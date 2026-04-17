const { useEffect, useMemo, useRef, useState } = React;

const STORAGE_KEY = "fe-industrial-prep-progress-v1";

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function scoreToColor(score) {
  if (score == null) return "#a08d78";
  if (score < 50) return "#d13f34";
  if (score < 70) return "#d99118";
  if (score < 85) return "#96a620";
  return "#27985d";
}

function computeEstimatedScore(correct, answered) {
  if (!answered) return null;
  const accuracy = correct / answered;
  const confidence = Math.min(answered / 5, 1);
  return Math.round(accuracy * (0.35 + 0.65 * confidence) * 100);
}

function getDefaultProgress(data) {
  const topicProgress = {};
  const subtopicProgress = {};
  data.sections.forEach((section) => {
    topicProgress[section.id] = { answered: 0, correct: 0 };
    subtopicProgress[section.id] = {};
    section.subtopicCoverage.forEach((subtopic) => {
      subtopicProgress[section.id][subtopic.name] = { answered: 0, correct: 0 };
    });
  });
  return {
    version: 1,
    topicProgress,
    subtopicProgress,
    answeredQuestionIds: [],
    completedDiagnostic: false,
    lastUpdated: new Date().toISOString()
  };
}

function readProgress(data) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultProgress(data);
    const parsed = JSON.parse(raw);
    return {
      ...getDefaultProgress(data),
      ...parsed,
      topicProgress: { ...getDefaultProgress(data).topicProgress, ...(parsed.topicProgress || {}) },
      subtopicProgress: mergeSubtopicProgress(getDefaultProgress(data).subtopicProgress, parsed.subtopicProgress || {})
    };
  } catch (error) {
    return getDefaultProgress(data);
  }
}

function mergeSubtopicProgress(base, incoming) {
  const next = { ...base };
  Object.entries(incoming).forEach(([sectionId, subtopics]) => {
    next[sectionId] = { ...(next[sectionId] || {}), ...(subtopics || {}) };
  });
  return next;
}

function persistProgress(progress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...progress, lastUpdated: new Date().toISOString() }));
}

function updateProgress(progress, question, wasCorrect) {
  const next = structuredClone(progress);
  const topicEntry = next.topicProgress[question.sectionId] || { answered: 0, correct: 0 };
  const subtopicEntry =
    next.subtopicProgress[question.sectionId]?.[question.officialSubtopic] || { answered: 0, correct: 0 };

  topicEntry.answered += 1;
  subtopicEntry.answered += 1;
  if (wasCorrect) {
    topicEntry.correct += 1;
    subtopicEntry.correct += 1;
  }

  next.topicProgress[question.sectionId] = topicEntry;
  next.subtopicProgress[question.sectionId] = {
    ...(next.subtopicProgress[question.sectionId] || {}),
    [question.officialSubtopic]: subtopicEntry
  };
  next.answeredQuestionIds = Array.from(new Set([...(next.answeredQuestionIds || []), question.id]));
  return next;
}

function pickRandom(items, count) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy.slice(0, count);
}

function getSectionMetrics(section, progress) {
  const topicState = progress.topicProgress[section.id] || { answered: 0, correct: 0 };
  const score = computeEstimatedScore(topicState.correct, topicState.answered);
  return {
    ...topicState,
    score
  };
}

function getSubtopicMetrics(progress, sectionId, subtopicName) {
  const state = progress.subtopicProgress?.[sectionId]?.[subtopicName] || { answered: 0, correct: 0 };
  return { ...state, score: computeEstimatedScore(state.correct, state.answered) };
}

function groupQuestionsBySection(data) {
  return data.questions.reduce((accumulator, question) => {
    if (!accumulator[question.sectionId]) {
      accumulator[question.sectionId] = [];
    }
    accumulator[question.sectionId].push(question);
    return accumulator;
  }, {});
}

function renderMath() {
  if (window.MathJax?.typesetPromise) {
    window.MathJax.typesetPromise().catch(() => {});
  }
}

function App() {
  const data = window.FEQuizData;
  const questionsBySection = useMemo(() => groupQuestionsBySection(data), [data]);
  const [progress, setProgress] = useState(() => readProgress(data));
  const [view, setView] = useState({ name: "dashboard" });
  const fileInputRef = useRef(null);

  useEffect(() => {
    persistProgress(progress);
  }, [progress]);

  useEffect(() => {
    renderMath();
  });

  const overall = useMemo(() => {
    const topicStates = data.sections.map((section) => getSectionMetrics(section, progress)).filter((state) => state.answered > 0);
    const answered = topicStates.reduce((sum, state) => sum + state.answered, 0);
    const correct = topicStates.reduce((sum, state) => sum + state.correct, 0);
    const scoredTopics = topicStates.filter((state) => state.score != null).length;
    return {
      answered,
      correct,
      topicsAssessed: scoredTopics,
      score: computeEstimatedScore(correct, answered)
    };
  }, [data.sections, progress]);

  const recommendations = useMemo(() => {
    return data.sections
      .map((section) => {
        const metrics = getSectionMetrics(section, progress);
        const questionCount = questionsBySection[section.id]?.length || 0;
        return { section, metrics, questionCount };
      })
      .filter((entry) => entry.questionCount > 0)
      .sort((left, right) => {
        const leftScore = left.metrics.score == null ? -1 : left.metrics.score;
        const rightScore = right.metrics.score == null ? -1 : right.metrics.score;
        return leftScore - rightScore;
      })
      .slice(0, 3);
  }, [data.sections, progress, questionsBySection]);

  function startDiagnostic() {
    const diagnosticQuestions = data.sections.flatMap((section) => {
      const available = (questionsBySection[section.id] || []).filter((question) => question.type === "mcq");
      return pickRandom(available, Math.min(2, available.length));
    });
    setView({
      name: "session",
      mode: "diagnostic",
      title: "Diagnostic",
      subtitle: "A quick baseline across the FE Industrial sections we can currently map from the bank.",
      questions: diagnosticQuestions,
      index: 0
    });
  }

  function startTopicPractice(sectionId, officialSubtopic = null, mcqOnly = false) {
    const section = data.sections.find((entry) => entry.id === sectionId);
    let questions = (questionsBySection[sectionId] || []).filter((question) => !officialSubtopic || question.officialSubtopic === officialSubtopic);
    if (mcqOnly) {
      questions = questions.filter((question) => question.type === "mcq");
    }
    const unseen = questions.filter((question) => !(progress.answeredQuestionIds || []).includes(question.id));
    const ordered = [...unseen, ...questions.filter((question) => (progress.answeredQuestionIds || []).includes(question.id))];

    setView({
      name: "session",
      mode: mcqOnly ? "topic-test" : "practice",
      title: officialSubtopic || section.title,
      subtitle: officialSubtopic ? `${section.title} focused practice` : `${section.title} study session`,
      questions: ordered,
      index: 0,
      sectionId,
      officialSubtopic
    });
  }

  function finishSession() {
    if (view.mode === "diagnostic") {
      setProgress((current) => ({ ...current, completedDiagnostic: true }));
    }
    setView({ name: "dashboard" });
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  function handleImportProgress(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        const merged = {
          ...getDefaultProgress(data),
          ...parsed,
          topicProgress: { ...getDefaultProgress(data).topicProgress, ...(parsed.topicProgress || {}) },
          subtopicProgress: mergeSubtopicProgress(getDefaultProgress(data).subtopicProgress, parsed.subtopicProgress || {})
        };
        setProgress(merged);
      } catch (error) {
        window.alert("That file could not be imported. Please choose a progress JSON exported from this app.");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  }

  function handleExportProgress() {
    const payload = {
      ...progress,
      exportedAt: new Date().toISOString(),
      exam: data.exam
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "fe-industrial-progress.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function resetProgress() {
    if (!window.confirm("Reset all saved progress for this browser?")) return;
    const next = getDefaultProgress(data);
    setProgress(next);
  }

  return (
    <div className="app-shell">
      <header className="hero">
        <div className="hero-grid">
          <div>
            <div className="eyebrow">{data.exam}</div>
            <h1>Build your readiness, section by section.</h1>
            <p>
              This dashboard is scoped to the FE Industrial blueprint, seeded by your local question bank, and built
              to help you diagnose weak areas before drilling down into focused practice.
            </p>
            <div className="toolbar" style={{ marginTop: 18 }}>
              <button className="button" onClick={startDiagnostic}>
                {progress.completedDiagnostic ? "Retake diagnostic" : "Take diagnostic"}
              </button>
              <button className="button-ghost" onClick={handleExportProgress}>
                Export progress JSON
              </button>
              <button className="button-ghost" onClick={handleImportClick}>
                Import progress JSON
              </button>
              <button className="button-ghost" onClick={resetProgress}>
                Reset progress
              </button>
              <input className="file-input" type="file" accept="application/json" ref={fileInputRef} onChange={handleImportProgress} />
            </div>
          </div>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="mini-label">Estimated overall</div>
              <div className="stat-value" style={{ color: scoreToColor(overall.score) }}>
                {overall.score == null ? "—" : `${overall.score}%`}
              </div>
            </div>
            <div className="stat-card">
              <div className="mini-label">Questions answered</div>
              <div className="stat-value">{overall.answered}</div>
            </div>
            <div className="stat-card">
              <div className="mini-label">Topics assessed</div>
              <div className="stat-value">{overall.topicsAssessed}/13</div>
            </div>
          </div>
        </div>
      </header>

      {view.name === "dashboard" ? (
        <Dashboard
          data={data}
          progress={progress}
          questionsBySection={questionsBySection}
          recommendations={recommendations}
          onStartDiagnostic={startDiagnostic}
          onOpenTopic={(sectionId) => setView({ name: "topic", sectionId })}
          onStartPractice={startTopicPractice}
        />
      ) : null}

      {view.name === "topic" ? (
        <TopicDetail
          section={data.sections.find((entry) => entry.id === view.sectionId)}
          progress={progress}
          questionCount={questionsBySection[view.sectionId]?.length || 0}
          onBack={() => setView({ name: "dashboard" })}
          onPractice={startTopicPractice}
        />
      ) : null}

      {view.name === "session" ? (
        <SessionView
          view={view}
          progress={progress}
          onBack={() => setView(view.sectionId ? { name: "topic", sectionId: view.sectionId } : { name: "dashboard" })}
          onFinish={finishSession}
          onRecord={(question, wasCorrect) => setProgress((current) => updateProgress(current, question, wasCorrect))}
        />
      ) : null}

      <div className="footer-note">
        Mapped questions: {data.coverageReport.mappedQuestionCount}. Unmatched source questions:{" "}
        {data.coverageReport.unmatchedQuestionCount}. Topics with low coverage can still track progress, but they may
        need more source material later.
      </div>
    </div>
  );
}

function Dashboard({ data, progress, questionsBySection, recommendations, onOpenTopic, onStartPractice, onStartDiagnostic }) {
  return (
    <div className="content-grid">
      <aside className="stack">
        <div className="panel">
          <div className="mini-label">Study next</div>
          <h2 className="section-title">Recommended focus</h2>
          <div className="stack">
            {recommendations.map(({ section, metrics, questionCount }) => (
              <div key={section.id} className="results-card">
                <div className="card-row">
                  <strong>{section.title}</strong>
                  <span className="pill">{metrics.score == null ? "Unassessed" : `${metrics.score}%`}</span>
                </div>
                <p className="muted" style={{ marginBottom: 10 }}>
                  {questionCount} mapped questions available
                </p>
                <button className="button-ghost" onClick={() => onOpenTopic(section.id)}>
                  Open topic
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="mini-label">How scoring works</div>
          <p className="sidebar-note">
            Scores are confidence-adjusted. Early results stay conservative until you answer about five questions in a
            section, so the dashboard does not overstate readiness after one lucky guess.
          </p>
        </div>

        <div className="panel">
          <div className="mini-label">Diagnostic</div>
          <p className="sidebar-note">
            The diagnostic pulls a small multiple-choice sample across the mapped FE Industrial sections and seeds your
            starting percentages.
          </p>
          <button className="button" onClick={onStartDiagnostic}>
            Start diagnostic
          </button>
        </div>
      </aside>

      <main className="stack">
        {data.sections.map((section) => {
          const metrics = getSectionMetrics(section, progress);
          const questionCount = questionsBySection[section.id]?.length || 0;
          return (
            <article key={section.id} className="topic-card">
              <div className="topic-header">
                <div>
                  <div className="mini-label">
                    Blueprint range {section.questionRange} questions
                  </div>
                  <h3>{section.title}</h3>
                </div>
                <span className="pill">
                  {metrics.score == null ? "Not yet assessed" : `${metrics.score}% ready`}
                </span>
              </div>

              <div className="score-bar">
                <div className="score-mask" style={{ width: `${100 - (metrics.score || 0)}%` }} />
              </div>

              <div className="topic-actions" style={{ marginTop: 16 }}>
                <span className="muted">
                  {questionCount} mapped questions • {metrics.answered} answered
                </span>
                <div className="toolbar">
                  <button className="button-ghost" onClick={() => onOpenTopic(section.id)}>
                    Study this
                  </button>
                  <button className="button-ghost" onClick={() => onStartPractice(section.id, null, true)} disabled={questionCount === 0}>
                    Test me on this topic
                  </button>
                </div>
              </div>

              <div className="subtopic-list">
                {section.subtopicCoverage.map((subtopic) => {
                  const subMetrics = getSubtopicMetrics(progress, section.id, subtopic.name);
                  return (
                    <div key={subtopic.name} className="subtopic-row">
                      <div className="subtopic-meta">
                        <strong>{subtopic.name}</strong>
                        <span className="muted">
                          {subtopic.count} mapped questions
                        </span>
                      </div>
                      <div className="subtopic-metrics">
                        <div className="card-row" style={{ marginBottom: 6 }}>
                          <span className="muted">
                            {subMetrics.score == null ? "Not assessed" : `${subMetrics.score}%`}
                          </span>
                          <button className="nav-chip" onClick={() => onStartPractice(section.id, subtopic.name, false)} disabled={subtopic.count === 0}>
                            Practice this subtopic
                          </button>
                        </div>
                        <div className="score-bar">
                          <div className="score-mask" style={{ width: `${100 - (subMetrics.score || 0)}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>
          );
        })}
      </main>
    </div>
  );
}

function TopicDetail({ section, progress, questionCount, onBack, onPractice }) {
  const metrics = getSectionMetrics(section, progress);
  return (
    <div className="content-grid">
      <aside className="stack">
        <div className="panel">
          <button className="button-ghost" onClick={onBack}>
            Back to dashboard
          </button>
          <div style={{ marginTop: 14 }} className="mini-label">
            {section.questionRange} official range
          </div>
          <h2 className="section-title">{section.title}</h2>
          <p className="sidebar-note">
            {questionCount} mapped questions are currently available in this section from the local bank.
          </p>
          <div className="pill" style={{ marginTop: 10 }}>
            {metrics.score == null ? "Not assessed" : `${metrics.score}% estimated`}
          </div>
        </div>
      </aside>

      <main className="stack">
        <article className="topic-card">
          <div className="topic-actions">
            <div>
              <div className="mini-label">Focused practice</div>
              <h3 style={{ marginTop: 8 }}>Subtopic breakdown</h3>
            </div>
            <button className="button" onClick={() => onPractice(section.id, null, true)} disabled={questionCount === 0}>
              Test me on this topic
            </button>
          </div>

          <div className="subtopic-list">
            {section.subtopicCoverage.map((subtopic) => {
              const metrics = getSubtopicMetrics(progress, section.id, subtopic.name);
              return (
                <div className="subtopic-row" key={subtopic.name}>
                  <div className="subtopic-meta">
                    <strong>{subtopic.name}</strong>
                    <span className="muted">
                      {subtopic.count} mapped questions
                    </span>
                  </div>
                  <div className="subtopic-metrics">
                    <div className="card-row" style={{ marginBottom: 6 }}>
                      <span className="muted">{metrics.score == null ? "Not assessed" : `${metrics.score}% ready`}</span>
                      <button className="nav-chip" onClick={() => onPractice(section.id, subtopic.name, false)} disabled={subtopic.count === 0}>
                        Practice this subtopic
                      </button>
                    </div>
                    <div className="score-bar">
                      <div className="score-mask" style={{ width: `${100 - (metrics.score || 0)}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </article>
      </main>
    </div>
  );
}

function SessionView({ view, progress, onBack, onFinish, onRecord }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [localResults, setLocalResults] = useState([]);

  const question = view.questions[currentIndex];

  useEffect(() => {
    setCurrentIndex(0);
    setSelectedChoice(null);
    setRevealed(false);
    setLocalResults([]);
  }, [view.title, view.mode]);

  useEffect(() => {
    setSelectedChoice(null);
    setRevealed(false);
  }, [currentIndex]);

  useEffect(() => {
    renderMath();
  }, [question, revealed]);

  if (!view.questions.length) {
    return (
      <div className="content-grid">
        <aside className="stack">
          <div className="panel">
            <button className="button-ghost" onClick={onBack}>
              Back
            </button>
          </div>
        </aside>
        <main className="stack">
          <div className="empty-state">
            No mapped questions are available for this selection yet. That usually means the current bank has a coverage
            gap for this section or subtopic.
          </div>
        </main>
      </div>
    );
  }

  const percent = Math.round(((currentIndex + 1) / view.questions.length) * 100);

  function recordAndAdvance(wasCorrect) {
    if (!question) return;
    onRecord(question, wasCorrect);
    setLocalResults((current) => [...current, { questionId: question.id, wasCorrect }]);
    if (currentIndex >= view.questions.length - 1) {
      onFinish();
      return;
    }
    setCurrentIndex((current) => current + 1);
  }

  function submitChoice(choiceKey) {
    setSelectedChoice(choiceKey);
    setRevealed(true);
  }

  return (
    <div className="content-grid">
      <aside className="stack">
        <div className="panel">
          <button className="button-ghost" onClick={onBack}>
            Leave session
          </button>
          <div style={{ marginTop: 14 }} className="mini-label">
            {view.mode === "diagnostic" ? "Diagnostic mode" : "Practice mode"}
          </div>
          <h2 className="section-title">{view.title}</h2>
          <p className="sidebar-note">{view.subtitle}</p>
          <div className="progress-track" style={{ marginTop: 18 }}>
            <div className="progress-fill" style={{ width: `${percent}%` }} />
          </div>
          <p className="muted" style={{ marginBottom: 0 }}>
            Question {currentIndex + 1} of {view.questions.length}
          </p>
        </div>
      </aside>

      <main className="stack">
        <article className="question-card">
          <div className="top-row">
            <span className="pill">{question.officialSubtopic}</span>
            <span className="pill">{question.type === "mcq" ? "Multiple choice" : "Self-graded"}</span>
          </div>
          <h2>{question.id}</h2>
          <div className="question-stem" dangerouslySetInnerHTML={{ __html: question.stem }} />

          {question.type === "mcq" ? (
            <div className="choice-grid">
              {Object.entries(question.choices).map(([key, value]) => {
                const isCorrect = revealed && key === question.answer;
                const isIncorrect = revealed && selectedChoice === key && key !== question.answer;
                return (
                  <button
                    key={key}
                    className={`choice-button ${isCorrect ? "correct" : ""} ${isIncorrect ? "incorrect" : ""}`}
                    onClick={() => submitChoice(key)}
                    disabled={revealed}
                  >
                    <div className="choice-row">
                      <strong>{key}</strong>
                      <span dangerouslySetInnerHTML={{ __html: value }} />
                    </div>
                  </button>
                );
              })}
            </div>
          ) : null}

          {question.type === "open" ? (
            <div className="answer-panel">
              <strong>Self-grade this one.</strong>
              <p className="muted">Work it out first, then mark whether you got it right before moving on.</p>
            </div>
          ) : null}

          {revealed || question.type === "open" ? (
            <div className="answer-panel">
              <div className="mini-label">Answer</div>
              <div dangerouslySetInnerHTML={{ __html: question.answer }} />
              <div className="toolbar" style={{ marginTop: 14 }}>
                {question.url ? (
                  <a className="button-ghost" href={question.url} target="_blank" rel="noreferrer">
                    Open source explanation
                  </a>
                ) : null}
                <button
                  className="button"
                  onClick={() => recordAndAdvance(question.type === "mcq" ? selectedChoice === question.answer : true)}
                >
                  {currentIndex >= view.questions.length - 1 ? "Finish session" : "I got it"}
                </button>
                <button
                  className="button-ghost"
                  onClick={() => recordAndAdvance(false)}
                >
                  I missed it
                </button>
              </div>
            </div>
          ) : null}
        </article>
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
