const { useEffect, useMemo, useRef, useState } = React;

const STORAGE_KEY = "fe-industrial-prep-progress-v2";
const LEGACY_STORAGE_KEY = "fe-industrial-prep-progress-v1";
const ACTIVE_QUIZ_STORAGE_KEY = "fe-industrial-prep-active-quiz-v1";
const EXPORT_SCHEMA_VERSION = 1;

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

function formatQuestionHeading(question, index) {
  const rawId = question.id || "";
  const hasGeneratedId = rawId.includes(":");
  if (!hasGeneratedId) return rawId || `Question ${index + 1}`;
  const sourceLabel = question.sourceSubtopic || question.officialSubtopic || "Practice Question";
  return `Question ${index + 1} • ${sourceLabel}`;
}

function getCoverageLabel(questionCount) {
  if (questionCount === 0) return "No coverage yet";
  if (questionCount < 5) return "Thin coverage";
  if (questionCount < 15) return "Light coverage";
  return "Healthy coverage";
}

function getRecommendationReason(metrics, questionCount) {
  if (metrics.score == null) return "Unassessed and ready for a quick baseline.";
  if (questionCount < 5) return "Low readiness, but question coverage is still thin.";
  if (metrics.score < 60) return "One of your weakest mapped areas with enough questions to improve fast.";
  return "Good place to build confidence with available question depth.";
}

function isTestMode(mode) {
  return mode === "diagnostic" || mode === "topic-test";
}

function getQuizModeLabel(mode) {
  if (mode === "diagnostic") return "Diagnostic mode";
  if (mode === "topic-test") return "Topic test";
  return "Practice mode";
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
    version: 2,
    topicProgress,
    subtopicProgress,
    questionResults: {},
    answeredQuestionIds: [],
    completedDiagnostic: false,
    lastUpdated: new Date().toISOString()
  };
}

function mergeSubtopicProgress(base, incoming) {
  const next = { ...base };
  Object.entries(incoming).forEach(([sectionId, subtopics]) => {
    next[sectionId] = { ...(next[sectionId] || {}), ...(subtopics || {}) };
  });
  return next;
}

function normalizeProgress(data, parsed = {}) {
  const defaults = getDefaultProgress(data);
  const rawQuestionResults = parsed.questionResults || {};
  const normalizedQuestionResults = {};
  Object.entries(rawQuestionResults).forEach(([questionId, result]) => {
    if (typeof result?.wasCorrect === "boolean") {
      normalizedQuestionResults[questionId] = {
        wasCorrect: result.wasCorrect,
        updatedAt: result.updatedAt || null
      };
    }
  });

  return {
    ...defaults,
    ...parsed,
    topicProgress: { ...defaults.topicProgress, ...(parsed.topicProgress || {}) },
    subtopicProgress: mergeSubtopicProgress(defaults.subtopicProgress, parsed.subtopicProgress || {}),
    questionResults: normalizedQuestionResults,
    answeredQuestionIds: Object.keys(normalizedQuestionResults).length
      ? Object.keys(normalizedQuestionResults)
      : Array.isArray(parsed.answeredQuestionIds)
        ? parsed.answeredQuestionIds
        : []
  };
}

function readProgress(data) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return getDefaultProgress(data);
    return normalizeProgress(data, JSON.parse(raw));
  } catch (error) {
    return getDefaultProgress(data);
  }
}

function persistProgress(progress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...progress, lastUpdated: new Date().toISOString() }));
}

function setProgressForQuestionResult(progress, question, nextWasCorrect) {
  if (!question || (nextWasCorrect !== null && typeof nextWasCorrect !== "boolean")) {
    return progress;
  }

  const next = structuredClone(progress);
  const previousResult = next.questionResults?.[question.id];
  const previousWasCorrect = typeof previousResult?.wasCorrect === "boolean" ? previousResult.wasCorrect : null;

  if (previousWasCorrect === nextWasCorrect) {
    return progress;
  }

  const topicEntry = next.topicProgress[question.sectionId] || { answered: 0, correct: 0 };
  const subtopicEntry =
    next.subtopicProgress[question.sectionId]?.[question.officialSubtopic] || { answered: 0, correct: 0 };

  if (previousWasCorrect == null) {
    topicEntry.answered += 1;
    subtopicEntry.answered += 1;
  } else if (previousWasCorrect) {
    topicEntry.correct = clamp(topicEntry.correct - 1, 0, Number.MAX_SAFE_INTEGER);
    subtopicEntry.correct = clamp(subtopicEntry.correct - 1, 0, Number.MAX_SAFE_INTEGER);
  }

  if (nextWasCorrect) {
    topicEntry.correct += 1;
    subtopicEntry.correct += 1;
  }

  next.topicProgress[question.sectionId] = topicEntry;
  next.subtopicProgress[question.sectionId] = {
    ...(next.subtopicProgress[question.sectionId] || {}),
    [question.officialSubtopic]: subtopicEntry
  };
  if (nextWasCorrect == null) {
    const { [question.id]: _removedQuestionResult, ...remainingResults } = next.questionResults || {};
    next.questionResults = remainingResults;
  } else {
    next.questionResults = {
      ...(next.questionResults || {}),
      [question.id]: {
        wasCorrect: nextWasCorrect,
        updatedAt: new Date().toISOString()
      }
    };
  }
  next.answeredQuestionIds = Object.keys(next.questionResults);
  return next;
}

function updateProgressForQuestion(progress, question, nextWasCorrect) {
  if (typeof nextWasCorrect !== "boolean") {
    return progress;
  }
  return setProgressForQuestionResult(progress, question, nextWasCorrect);
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

function groupQuestionsById(data) {
  return data.questions.reduce((accumulator, question) => {
    accumulator[question.id] = question;
    return accumulator;
  }, {});
}

function normalizeQuizResponse(question) {
  return {
    selectedChoice: null,
    revealed: question.type === "open",
    wasCorrect: null
  };
}

function captureBaselineResults(questions, progress) {
  return questions.reduce((accumulator, question) => {
    const previous = progress.questionResults?.[question.id];
    accumulator[question.id] =
      typeof previous?.wasCorrect === "boolean"
        ? { wasCorrect: previous.wasCorrect, updatedAt: previous.updatedAt || null }
        : null;
    return accumulator;
  }, {});
}

function buildQuizSession({ mode, title, subtitle, sectionId = null, officialSubtopic = null, questions, progress }) {
  const now = new Date().toISOString();
  const responses = {};
  questions.forEach((question) => {
    responses[question.id] = normalizeQuizResponse(question);
  });

  return {
    id: `${Date.now()}-${slugify(`${mode}-${title}`)}`,
    mode,
    title,
    subtitle,
    sectionId,
    officialSubtopic,
    status: "in-progress",
    currentIndex: 0,
    questionIds: questions.map((question) => question.id),
    baselineResults: captureBaselineResults(questions, progress),
    responses,
    startedAt: now,
    completedAt: null,
    lastUpdated: now
  };
}

function normalizeQuizSession(rawSession, questionsById) {
  if (!rawSession || !Array.isArray(rawSession.questionIds)) {
    return null;
  }

  const validQuestionIds = rawSession.questionIds.filter((questionId) => questionsById[questionId]);
  if (!validQuestionIds.length) {
    return null;
  }

  const responses = {};
  validQuestionIds.forEach((questionId) => {
    const question = questionsById[questionId];
    const incoming = rawSession.responses?.[questionId] || {};
    responses[questionId] = {
      selectedChoice: incoming.selectedChoice ?? null,
      revealed: typeof incoming.revealed === "boolean" ? incoming.revealed : question.type === "open",
      wasCorrect: typeof incoming.wasCorrect === "boolean" ? incoming.wasCorrect : null
    };
  });
  const baselineResults = {};
  validQuestionIds.forEach((questionId) => {
    const incoming = rawSession.baselineResults?.[questionId];
    baselineResults[questionId] =
      typeof incoming?.wasCorrect === "boolean"
        ? { wasCorrect: incoming.wasCorrect, updatedAt: incoming.updatedAt || null }
        : null;
  });

  return {
    id: rawSession.id || `${Date.now()}-${slugify(`${rawSession.mode || "quiz"}-${rawSession.title || "session"}`)}`,
    mode: rawSession.mode || "topic-test",
    title: rawSession.title || "Saved quiz",
    subtitle: rawSession.subtitle || "",
    sectionId: rawSession.sectionId || null,
    officialSubtopic: rawSession.officialSubtopic || null,
    status: rawSession.status === "complete" ? "complete" : "in-progress",
    currentIndex: clamp(rawSession.currentIndex || 0, 0, validQuestionIds.length - 1),
    questionIds: validQuestionIds,
    baselineResults,
    responses,
    startedAt: rawSession.startedAt || new Date().toISOString(),
    completedAt: rawSession.completedAt || null,
    lastUpdated: rawSession.lastUpdated || new Date().toISOString()
  };
}

function restoreProgressFromQuizSession(progress, activeQuiz, questionsById) {
  if (!activeQuiz) {
    return progress;
  }

  return activeQuiz.questionIds.reduce((nextProgress, questionId) => {
    const question = questionsById[questionId];
    if (!question) {
      return nextProgress;
    }
    const baseline = activeQuiz.baselineResults?.[questionId];
    const baselineWasCorrect = typeof baseline?.wasCorrect === "boolean" ? baseline.wasCorrect : null;
    return setProgressForQuestionResult(nextProgress, question, baselineWasCorrect);
  }, progress);
}

function buildExportSnapshot(data, progress, activeQuiz) {
  return {
    schemaVersion: EXPORT_SCHEMA_VERSION,
    exam: data.exam,
    exportedAt: new Date().toISOString(),
    progress: {
      ...progress,
      lastUpdated: progress.lastUpdated || new Date().toISOString()
    },
    activeQuiz: activeQuiz
      ? {
          ...activeQuiz,
          lastUpdated: activeQuiz.lastUpdated || new Date().toISOString()
        }
      : null
  };
}

function extractImportedProgress(data, parsed) {
  if (parsed?.progress && typeof parsed.progress === "object") {
    return normalizeProgress(data, parsed.progress);
  }
  return normalizeProgress(data, parsed);
}

function extractImportedQuiz(parsed, questionsById) {
  if (parsed?.activeQuiz !== undefined) {
    return normalizeQuizSession(parsed.activeQuiz, questionsById);
  }
  return null;
}

function readActiveQuiz(questionsById) {
  try {
    const raw = localStorage.getItem(ACTIVE_QUIZ_STORAGE_KEY);
    if (!raw) return null;
    return normalizeQuizSession(JSON.parse(raw), questionsById);
  } catch (error) {
    return null;
  }
}

function persistActiveQuiz(activeQuiz) {
  if (!activeQuiz) {
    localStorage.removeItem(ACTIVE_QUIZ_STORAGE_KEY);
    return;
  }
  localStorage.setItem(
    ACTIVE_QUIZ_STORAGE_KEY,
    JSON.stringify({ ...activeQuiz, lastUpdated: new Date().toISOString() })
  );
}

function getSessionQuestionState(activeQuiz, questionId) {
  return activeQuiz?.responses?.[questionId] || null;
}

function getSessionBackView(activeQuiz) {
  if (activeQuiz?.sectionId) {
    return { name: "topic", sectionId: activeQuiz.sectionId };
  }
  return { name: "dashboard" };
}

function getActiveQuizSummary(activeQuiz) {
  if (!activeQuiz) return null;
  return {
    answeredCount: activeQuiz.questionIds.filter((questionId) => getSessionQuestionState(activeQuiz, questionId)?.wasCorrect != null).length,
    questionCount: activeQuiz.questionIds.length
  };
}

function renderMath() {
  if (window.MathJax?.typesetPromise) {
    window.MathJax.typesetPromise().catch(() => {});
  }
}

function App() {
  const data = window.FEQuizData;
  const questionsBySection = useMemo(() => groupQuestionsBySection(data), [data]);
  const questionsById = useMemo(() => groupQuestionsById(data), [data]);
  const [progress, setProgress] = useState(() => readProgress(data));
  const [activeQuiz, setActiveQuiz] = useState(() => readActiveQuiz(questionsById));
  const [view, setView] = useState({ name: "dashboard" });
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [quizActionDialog, setQuizActionDialog] = useState(null);
  const [resetDialogSelection, setResetDialogSelection] = useState("keep");
  const fileInputRef = useRef(null);
  const keepProgressButtonRef = useRef(null);
  const resetEverythingButtonRef = useRef(null);

  useEffect(() => {
    persistProgress(progress);
  }, [progress]);

  useEffect(() => {
    persistActiveQuiz(activeQuiz);
  }, [activeQuiz]);

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

  const activeQuizSummary = useMemo(() => getActiveQuizSummary(activeQuiz), [activeQuiz]);

  function openQuizSession(session) {
    setActiveQuiz(session);
    setView({ name: "session" });
  }

  function startDiagnostic() {
    const diagnosticQuestions = data.sections.flatMap((section) => {
      const available = (questionsBySection[section.id] || []).filter((question) => question.type === "mcq");
      return pickRandom(available, Math.min(2, available.length));
    });

    openQuizSession(
      buildQuizSession({
        mode: "diagnostic",
        title: "Diagnostic",
        subtitle: "A quick baseline across the FE Industrial sections we can currently map from the bank.",
        questions: diagnosticQuestions,
        progress
      })
    );
  }

  function startTopicPractice(sectionId, officialSubtopic = null, mcqOnly = false) {
    const section = data.sections.find((entry) => entry.id === sectionId);
    let questions = (questionsBySection[sectionId] || []).filter((question) => !officialSubtopic || question.officialSubtopic === officialSubtopic);
    if (mcqOnly) {
      questions = questions.filter((question) => question.type === "mcq");
      openQuizSession(
        buildQuizSession({
          mode: "topic-test",
          title: officialSubtopic || section.title,
          subtitle: officialSubtopic ? `${section.title} focused test` : `${section.title} topic test`,
          sectionId,
          officialSubtopic,
          questions,
          progress
        })
      );
      return;
    }

    const seenQuestionIds = new Set(progress.answeredQuestionIds || []);
    const unseen = questions.filter((question) => !seenQuestionIds.has(question.id));
    const ordered = [...unseen, ...questions.filter((question) => seenQuestionIds.has(question.id))];

    setView({
      name: "session",
      mode: "practice",
      title: officialSubtopic || section.title,
      subtitle: officialSubtopic ? `${section.title} focused practice` : `${section.title} study session`,
      questions: ordered,
      index: 0,
      sectionId,
      officialSubtopic
    });
  }

  function resumeQuiz() {
    if (!activeQuiz || activeQuiz.status !== "in-progress") return;
    setView({ name: "session" });
  }

  function leaveQuiz() {
    setView(getSessionBackView(activeQuiz));
  }

  function openLeaveQuizDialog() {
    if (!activeQuiz) return;
    setQuizActionDialog({ type: "leave" });
  }

  function openSubmitQuizDialog() {
    if (!activeQuiz) return;
    setQuizActionDialog({
      type: "submit",
      unansweredCount: activeQuiz.questionIds.filter((questionId) => getSessionQuestionState(activeQuiz, questionId)?.wasCorrect == null).length
    });
  }

  function closeQuizActionDialog() {
    setQuizActionDialog(null);
  }

  function saveProgressAndLeaveQuiz() {
    closeQuizActionDialog();
    leaveQuiz();
  }

  function discardQuizAndLeave() {
    if (!activeQuiz) return;
    const backView = getSessionBackView(activeQuiz);
    setProgress((current) => restoreProgressFromQuizSession(current, activeQuiz, questionsById));
    setActiveQuiz(null);
    setView(backView);
    closeQuizActionDialog();
  }

  function submitQuiz() {
    if (!activeQuiz) return;

    const unansweredQuestionIds = activeQuiz.questionIds.filter((questionId) => getSessionQuestionState(activeQuiz, questionId)?.wasCorrect == null);
    const backView = getSessionBackView(activeQuiz);

    if (unansweredQuestionIds.length) {
      setProgress((current) =>
        unansweredQuestionIds.reduce((nextProgress, questionId) => {
          const question = questionsById[questionId];
          return question ? setProgressForQuestionResult(nextProgress, question, false) : nextProgress;
        }, current)
      );
    }

    setActiveQuiz((current) => {
      if (!current) return current;
      const nextResponses = { ...current.responses };
      unansweredQuestionIds.forEach((questionId) => {
        nextResponses[questionId] = {
          ...(nextResponses[questionId] || {}),
          revealed: true,
          wasCorrect: false
        };
      });
      return {
        ...current,
        status: "complete",
        completedAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        responses: nextResponses
      };
    });

    if (activeQuiz.mode === "diagnostic") {
      setProgress((current) => ({ ...current, completedDiagnostic: true }));
    }

    setView(backView);
    closeQuizActionDialog();
  }

  function updateQuizIndex(nextIndex) {
    setActiveQuiz((current) => {
      if (!current) return current;
      return {
        ...current,
        currentIndex: clamp(nextIndex, 0, current.questionIds.length - 1),
        lastUpdated: new Date().toISOString()
      };
    });
  }

  function updateQuizResponse(questionId, patch) {
    setActiveQuiz((current) => {
      if (!current) return current;
      return {
        ...current,
        responses: {
          ...current.responses,
          [questionId]: {
            ...(current.responses[questionId] || {}),
            ...patch
          }
        },
        lastUpdated: new Date().toISOString()
      };
    });
  }

  function gradeQuizQuestion(question, wasCorrect) {
    updateQuizResponse(question.id, { wasCorrect });
    setProgress((current) => updateProgressForQuestion(current, question, wasCorrect));
  }

  function finishPracticeSession() {
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
        setProgress(extractImportedProgress(data, parsed));
        setActiveQuiz(extractImportedQuiz(parsed, questionsById));
      } catch (error) {
        window.alert("That file could not be imported. Please choose a progress JSON exported from this app.");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  }

  function handleExportProgress() {
    const payload = buildExportSnapshot(data, progress, activeQuiz);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "fe-industrial-progress.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function resetProgress() {
    const next = getDefaultProgress(data);
    setProgress(next);
    setActiveQuiz(null);
    setView({ name: "dashboard" });
    setIsResetDialogOpen(false);
  }

  useEffect(() => {
    if (!isResetDialogOpen) return undefined;

    function handleKeydown(event) {
      const targetTag = event.target?.tagName;
      if (targetTag === "INPUT" || targetTag === "TEXTAREA" || event.target?.isContentEditable) {
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        setIsResetDialogOpen(false);
        return;
      }

      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
        event.preventDefault();
        setResetDialogSelection((current) => (current === "keep" ? "reset" : "keep"));
        return;
      }

      if (event.key === "Enter" || event.code === "Space") {
        event.preventDefault();
        if (resetDialogSelection === "keep") {
          setIsResetDialogOpen(false);
        } else {
          resetProgress();
        }
      }
    }

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [isResetDialogOpen, resetDialogSelection]);

  useEffect(() => {
    if (!isResetDialogOpen) return undefined;

    const selectedButton = resetDialogSelection === "keep" ? keepProgressButtonRef.current : resetEverythingButtonRef.current;
    selectedButton?.focus();
    return undefined;
  }, [isResetDialogOpen, resetDialogSelection]);

  function openResetDialog() {
    setResetDialogSelection("keep");
    setIsResetDialogOpen(true);
  }

  useEffect(() => {
    if (!quizActionDialog) return undefined;

    function handleKeydown(event) {
      const targetTag = event.target?.tagName;
      if (targetTag === "INPUT" || targetTag === "TEXTAREA" || event.target?.isContentEditable) {
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        closeQuizActionDialog();
      }
    }

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [quizActionDialog]);

  const showResumeButton = activeQuiz?.status === "in-progress";

  return (
    <div className={`app-shell ${view.name === "session" && isTestMode(activeQuiz?.mode) ? "app-shell-session" : ""}`}>
      {!(view.name === "session" && isTestMode(activeQuiz?.mode)) ? (
        <>
          <header className="hero">
            <div className="hero-grid">
              <div>
                <div className="eyebrow">{data.exam}</div>
                <h1>Build your readiness, section by section.</h1>
                <p>
                  This dashboard is scoped to the FE Industrial blueprint, seeded by your local question bank, and built
                  to help you diagnose weak areas before drilling down into focused practice.
                </p>
                <div className="hero-controls">
                  <div className="hero-primary-actions">
                    <button className="button" onClick={startDiagnostic}>
                      {progress.completedDiagnostic ? "Retake diagnostic" : "Take diagnostic"}
                    </button>
                  </div>
                  <div className="hero-utility-actions">
                    <button className="button-ghost" onClick={handleExportProgress}>
                      Export progress JSON
                    </button>
                    <button className="button-ghost" onClick={handleImportClick}>
                      Import progress JSON
                    </button>
                    <button className="button-ghost" onClick={openResetDialog}>
                      Reset progress
                    </button>
                    <input className="file-input" type="file" accept="application/json" ref={fileInputRef} onChange={handleImportProgress} />
                  </div>
                  {activeQuiz ? (
                    <button
                      className={`session-banner ${showResumeButton ? "is-clickable" : ""} ${activeQuiz.status === "in-progress" ? "is-active" : ""}`}
                      onClick={showResumeButton ? resumeQuiz : undefined}
                      disabled={!showResumeButton}
                    >
                      <span className={`pill ${activeQuiz.status === "in-progress" ? "" : "subtle"}`}>
                        Saved quiz: {activeQuiz.status === "in-progress" ? "In progress" : "Complete"}
                      </span>
                      <span className="muted">
                        {activeQuiz.title} • {activeQuizSummary?.answeredCount || 0}/{activeQuizSummary?.questionCount || 0} graded
                      </span>
                    </button>
                  ) : null}
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
              activeQuiz={activeQuiz}
              onResumeQuiz={resumeQuiz}
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
              activeQuiz={activeQuiz}
              onResumeQuiz={resumeQuiz}
              onBack={() => setView({ name: "dashboard" })}
              onPractice={startTopicPractice}
            />
          ) : null}

          {view.name === "session" && !isTestMode(activeQuiz?.mode) ? (
            <SessionView
              view={view}
              isResetDialogOpen={isResetDialogOpen}
              onBack={() => setView(view.sectionId ? { name: "topic", sectionId: view.sectionId } : { name: "dashboard" })}
              onFinish={finishPracticeSession}
              onRecord={(question, wasCorrect) => setProgress((current) => updateProgressForQuestion(current, question, wasCorrect))}
            />
          ) : null}

          <div className="footer-note">
            Mapped questions: {data.coverageReport.mappedQuestionCount}. Unmatched source questions:{" "}
            {data.coverageReport.unmatchedQuestionCount}. Topics with low coverage can still track progress, but they may
            need more source material later.
          </div>
        </>
      ) : null}

      {view.name === "session" && isTestMode(activeQuiz?.mode) ? (
        <QuizSessionView
          activeQuiz={activeQuiz}
          questionsById={questionsById}
          isResetDialogOpen={isResetDialogOpen}
          isQuizActionDialogOpen={!!quizActionDialog}
          onRequestLeave={openLeaveQuizDialog}
          onRequestSubmit={openSubmitQuizDialog}
          onSetIndex={updateQuizIndex}
          onUpdateResponse={updateQuizResponse}
          onGrade={gradeQuizQuestion}
        />
      ) : null}

      {isResetDialogOpen ? (
        <div className="dialog-backdrop" onClick={() => setIsResetDialogOpen(false)}>
          <div
            className="dialog-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-progress-title"
            aria-describedby="reset-progress-description"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mini-label">Progress reset</div>
            <h2 id="reset-progress-title" className="dialog-title">
              Clear all saved progress for this browser?
            </h2>
            <p id="reset-progress-description" className="sidebar-note" style={{ marginTop: 0 }}>
              This will wipe your topic scores, answered-question history, diagnostic status, and any saved quiz session for
              this device only.
            </p>
            <div className="toolbar dialog-actions">
              <button
                ref={keepProgressButtonRef}
                className={`button-ghost dialog-option ${resetDialogSelection === "keep" ? "is-selected" : ""}`}
                onMouseEnter={() => setResetDialogSelection("keep")}
                onFocus={() => setResetDialogSelection("keep")}
                onClick={() => setIsResetDialogOpen(false)}
              >
                Keep my progress
              </button>
              <button
                ref={resetEverythingButtonRef}
                className={`button button-danger dialog-option ${resetDialogSelection === "reset" ? "is-selected" : ""}`}
                onMouseEnter={() => setResetDialogSelection("reset")}
                onFocus={() => setResetDialogSelection("reset")}
                onClick={resetProgress}
              >
                Reset everything
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {quizActionDialog && activeQuiz ? (
        <div className="dialog-backdrop" onClick={closeQuizActionDialog}>
          <div
            className="dialog-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="quiz-action-title"
            aria-describedby="quiz-action-description"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mini-label">{quizActionDialog.type === "leave" ? "Leave quiz" : "Submit quiz"}</div>
            <h2 id="quiz-action-title" className="dialog-title">
              {quizActionDialog.type === "leave"
                ? "What should we do with this quiz?"
                : quizActionDialog.unansweredCount
                  ? "Submit and mark unanswered questions wrong?"
                  : "Submit this quiz now?"}
            </h2>
            <p id="quiz-action-description" className="sidebar-note" style={{ marginTop: 0 }}>
              {quizActionDialog.type === "leave"
                ? "You can keep this quiz exactly as it is and resume later, or discard every result from this attempt and leave."
                : quizActionDialog.unansweredCount
                  ? `${quizActionDialog.unansweredCount} unanswered question${quizActionDialog.unansweredCount === 1 ? "" : "s"} will be marked wrong and saved before we close the test.`
                  : "We’ll save this quiz as complete and keep every graded result in your browser progress."}
            </p>
            <div className="toolbar dialog-actions quiz-action-dialog-actions">
              {quizActionDialog.type === "leave" ? (
                <>
                  <button className="button-ghost dialog-option" onClick={closeQuizActionDialog}>
                    Keep testing
                  </button>
                  <button className="button dialog-option" onClick={saveProgressAndLeaveQuiz}>
                    Save progress and leave
                  </button>
                  <button className="button button-danger dialog-option" onClick={discardQuizAndLeave}>
                    Discard results and leave
                  </button>
                </>
              ) : (
                <>
                  <button className="button-ghost dialog-option" onClick={closeQuizActionDialog}>
                    Keep testing
                  </button>
                  <button className="button dialog-option" onClick={submitQuiz}>
                    Confirm submit
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
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

function Dashboard({
  data,
  progress,
  questionsBySection,
  recommendations,
  activeQuiz,
  onResumeQuiz,
  onOpenTopic,
  onStartPractice,
  onStartDiagnostic
}) {
  const [expandedSections, setExpandedSections] = useState({});

  function toggleSection(sectionId) {
    setExpandedSections((current) => ({ ...current, [sectionId]: !current[sectionId] }));
  }

  return (
    <div className="content-grid">
      <aside className="stack">
        {activeQuiz?.status === "in-progress" ? (
          <div className="panel">
            <div className="mini-label">Resume where you left off</div>
            <h2 className="section-title">{activeQuiz.title}</h2>
            <p className="sidebar-note">
              {getQuizModeLabel(activeQuiz.mode)} • {getActiveQuizSummary(activeQuiz)?.answeredCount || 0}/
              {getActiveQuizSummary(activeQuiz)?.questionCount || 0} graded
            </p>
            <button className="button" onClick={onResumeQuiz}>
              Resume quiz
            </button>
          </div>
        ) : null}

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
                <p className="reason-text">{getRecommendationReason(metrics, questionCount)}</p>
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
          const isThinCoverage = questionCount < 5;
          const isExpanded = !!expandedSections[section.id];
          const coverageLabel = getCoverageLabel(questionCount);
          const canResumeSectionQuiz = activeQuiz?.status === "in-progress" && activeQuiz.sectionId === section.id;
          return (
            <article key={section.id} className={`topic-card ${isThinCoverage ? "is-thin" : ""}`}>
              <div className="topic-header">
                <div>
                  <div className="mini-label">
                    Blueprint range {section.questionRange} questions
                  </div>
                  <h3>{section.title}</h3>
                </div>
                <div className="toolbar">
                  <span className={`pill ${isThinCoverage ? "warn" : ""}`}>
                    {metrics.score == null ? "Not yet assessed" : `${metrics.score}% ready`}
                  </span>
                  <span className={`pill ${isThinCoverage ? "warn" : "subtle"}`}>{coverageLabel}</span>
                </div>
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
                  {canResumeSectionQuiz ? (
                    <button className="button-ghost" onClick={onResumeQuiz}>
                      Resume quiz
                    </button>
                  ) : null}
                  <button className="nav-chip subtopic-toggle" onClick={() => toggleSection(section.id)}>
                    {isExpanded ? "Hide subtopics" : "Show more"}
                  </button>
                </div>
              </div>

              {isThinCoverage ? (
                <div className="coverage-note">
                  This section has limited mapped source material right now, so its score is less representative than the
                  stronger-covered sections.
                </div>
              ) : null}

              <div className={`subtopic-list compact ${isExpanded ? "" : "mobile-collapsed"}`}>
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

function TopicDetail({ section, progress, questionCount, activeQuiz, onResumeQuiz, onBack, onPractice }) {
  const metrics = getSectionMetrics(section, progress);
  const isThinCoverage = questionCount < 5;
  const canResumeSectionQuiz = activeQuiz?.status === "in-progress" && activeQuiz.sectionId === section.id;
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
          {canResumeSectionQuiz ? (
            <button className="button" style={{ marginTop: 16 }} onClick={onResumeQuiz}>
              Resume quiz
            </button>
          ) : null}
          {isThinCoverage ? (
            <div className="coverage-note">
              Coverage is thin here, so use these questions as a light check-in rather than a full representation of the topic.
            </div>
          ) : null}
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
              const subMetrics = getSubtopicMetrics(progress, section.id, subtopic.name);
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
                      <span className="muted">{subMetrics.score == null ? "Not assessed" : `${subMetrics.score}% ready`}</span>
                      <button className="nav-chip" onClick={() => onPractice(section.id, subtopic.name, false)} disabled={subtopic.count === 0}>
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
      </main>
    </div>
  );
}

function SessionView({ view, isResetDialogOpen, onBack, onFinish, onRecord }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [revealed, setRevealed] = useState(false);

  const question = view.questions[currentIndex];

  useEffect(() => {
    setCurrentIndex(0);
    setSelectedChoice(null);
    setRevealed(false);
  }, [view.title, view.mode]);

  useEffect(() => {
    setSelectedChoice(null);
    setRevealed(false);
  }, [currentIndex]);

  useEffect(() => {
    renderMath();
  }, [question, revealed]);

  useEffect(() => {
    function handleKeydown(event) {
      if (isResetDialogOpen) {
        return;
      }

      const targetTag = event.target?.tagName;
      if (targetTag === "INPUT" || targetTag === "TEXTAREA" || event.target?.isContentEditable) {
        return;
      }

      if (!question) {
        return;
      }

      const key = event.key.toUpperCase();
      const availableChoices = question.type === "mcq" ? Object.keys(question.choices || {}) : [];

      if (question.type === "mcq" && !revealed && availableChoices.includes(key)) {
        event.preventDefault();
        submitChoice(key);
        return;
      }

      if ((revealed || question.type === "open") && event.key === "Enter") {
        event.preventDefault();
        recordAndAdvance(true);
        return;
      }

      if ((revealed || question.type === "open") && event.code === "Space") {
        event.preventDefault();
        recordAndAdvance(false);
      }
    }

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [question, revealed, currentIndex, view.questions.length, isResetDialogOpen]);

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
            Practice mode
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
          <h2>{formatQuestionHeading(question, currentIndex)}</h2>
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
              {question.type === "mcq" && revealed ? (
                <div className="mini-label" style={{ color: selectedChoice === question.answer ? "#1f7a4d" : "#b33a3a", marginBottom: 8 }}>
                  {selectedChoice === question.answer ? "Correct" : `Incorrect · Correct answer: ${question.answer}`}
                </div>
              ) : null}
              <div className="mini-label">Answer</div>
              <div dangerouslySetInnerHTML={{ __html: question.answer }} />
              <div className="toolbar" style={{ marginTop: 14 }}>
                {question.url ? (
                  <a className="button-ghost" href={question.url} target="_blank" rel="noreferrer">
                    Open source explanation
                  </a>
                ) : null}
                <button className="button result-button result-button-primary" onClick={() => recordAndAdvance(true)}>
                  <span>{currentIndex >= view.questions.length - 1 ? "Finish session" : "I got it"}</span>
                  <span className="shortcut-badge">ENTER</span>
                </button>
                <button className="button-ghost result-button result-button-ghost" onClick={() => recordAndAdvance(false)}>
                  <span>I missed it</span>
                  <span className="shortcut-badge">SPACE</span>
                </button>
              </div>
            </div>
          ) : null}
        </article>
      </main>
    </div>
  );
}

function QuizSessionView({
  activeQuiz,
  questionsById,
  isResetDialogOpen,
  isQuizActionDialogOpen,
  onRequestLeave,
  onRequestSubmit,
  onSetIndex,
  onUpdateResponse,
  onGrade
}) {
  const questions = activeQuiz?.questionIds.map((questionId) => questionsById[questionId]).filter(Boolean) || [];
  const currentIndex = clamp(activeQuiz?.currentIndex || 0, 0, Math.max(questions.length - 1, 0));
  const question = questions[currentIndex];
  const response = question ? getSessionQuestionState(activeQuiz, question.id) : null;
  const gradedCount = questions.filter((entry) => getSessionQuestionState(activeQuiz, entry.id)?.wasCorrect != null).length;
  const progressPercent = questions.length ? Math.round((gradedCount / questions.length) * 100) : 0;
  const canRevealAnswer = question?.type === "open" || !!response?.revealed;

  useEffect(() => {
    renderMath();
  }, [question, response?.revealed, response?.selectedChoice, response?.wasCorrect]);

  function handleGradeAndAdvance(wasCorrect) {
    if (!question) return;
    onGrade(question, wasCorrect);
    if (currentIndex < questions.length - 1) {
      onSetIndex(currentIndex + 1);
    }
  }

  useEffect(() => {
    function handleKeydown(event) {
      if (isResetDialogOpen || isQuizActionDialogOpen || !question) {
        return;
      }

      const targetTag = event.target?.tagName;
      if (targetTag === "INPUT" || targetTag === "TEXTAREA" || event.target?.isContentEditable) {
        return;
      }

      const key = event.key.toUpperCase();
      const availableChoices = question.type === "mcq" ? Object.keys(question.choices || {}) : [];

      if (question.type === "mcq" && !response?.revealed && availableChoices.includes(key)) {
        event.preventDefault();
        onUpdateResponse(question.id, { selectedChoice: key, revealed: true });
        return;
      }

      if ((response?.revealed || question.type === "open") && event.key === "Enter") {
        event.preventDefault();
        handleGradeAndAdvance(true);
        return;
      }

      if ((response?.revealed || question.type === "open") && event.code === "Space") {
        event.preventDefault();
        handleGradeAndAdvance(false);
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        onSetIndex(currentIndex + 1);
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        onSetIndex(currentIndex - 1);
      }
    }

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [question, response?.revealed, currentIndex, isResetDialogOpen, isQuizActionDialogOpen, onSetIndex, onUpdateResponse]);

  if (!questions.length) {
    return (
      <div className="quiz-shell">
        <div className="quiz-empty">
          <div className="results-card">
            <div className="mini-label">No quiz available</div>
            <h2 className="dialog-title">This test has no mapped questions yet.</h2>
            <p className="sidebar-note">Try another section or return to the dashboard while the bank continues to grow.</p>
            <button className="button" onClick={onRequestLeave}>
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const answerLabelColor =
    response?.wasCorrect == null
      ? "#69553d"
      : response.wasCorrect
        ? "#1f7a4d"
        : "#b33a3a";

  return (
    <div className="quiz-shell">
      <header className="quiz-header">
        <div className="quiz-header-meta">
          <div className="mini-label">{getQuizModeLabel(activeQuiz.mode)}</div>
          <h2 className="quiz-title">{activeQuiz.title}</h2>
          <p className="quiz-subtitle">{activeQuiz.subtitle}</p>
        </div>
        <div className="quiz-header-actions">
          <div className="quiz-header-statuses">
            <div className="quiz-progress-block">
              <div className="mini-label">Saved state</div>
              <div className="pill">{activeQuiz.status === "in-progress" ? "In progress" : "Complete"}</div>
            </div>
            <div className="quiz-progress-block">
              <div className="mini-label">Graded</div>
              <strong>
                {gradedCount}/{questions.length}
              </strong>
            </div>
          </div>
          <div className="quiz-header-buttons">
            <button className="button-ghost" onClick={onRequestLeave}>
              Leave quiz
            </button>
            <button className="button" onClick={onRequestSubmit}>
              Submit quiz
            </button>
          </div>
        </div>
      </header>

      <div className="quiz-layout">
        <aside className="quiz-sidebar">
          <div className="quiz-sidebar-card">
            <div className="card-row" style={{ marginBottom: 10 }}>
              <span className="mini-label">Question map</span>
              <span className="muted">{progressPercent}% graded</span>
            </div>
            <div className="progress-track" style={{ marginBottom: 16 }}>
              <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
            </div>
            <div className="question-chip-grid">
              {questions.map((entry, index) => {
                const state = getSessionQuestionState(activeQuiz, entry.id);
                const statusClass =
                  state?.wasCorrect == null
                    ? state?.selectedChoice || state?.revealed
                      ? "review"
                      : "pending"
                    : state.wasCorrect
                      ? "correct"
                      : "incorrect";
                return (
                  <button
                    key={entry.id}
                    className={`question-chip ${currentIndex === index ? "is-current" : ""} ${statusClass}`}
                    onClick={() => onSetIndex(index)}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
            <div className="quiz-sidebar-note">
              <div className="pill subtle">Arrow keys move between questions</div>
            </div>
          </div>
        </aside>

        <main className="quiz-stage">
          <article className="question-card quiz-card">
            <div className="quiz-card-top">
              <div className="top-row">
                <span className="pill">{question.officialSubtopic}</span>
                <span className="pill">{question.type === "mcq" ? "Multiple choice" : "Self-graded"}</span>
              </div>
              <h2>{formatQuestionHeading(question, currentIndex)}</h2>
            </div>

            <div className={`quiz-card-body ${canRevealAnswer ? "" : "is-awaiting-answer"}`}>
              <div className="quiz-question-scroll">
                <div className="question-stem" dangerouslySetInnerHTML={{ __html: question.stem }} />

                {question.type === "mcq" ? (
                  <div className="choice-grid">
                    {Object.entries(question.choices).map(([key, value]) => {
                      const isRevealed = !!response?.revealed;
                      const isCorrectChoice = isRevealed && key === question.answer;
                      const isSelectedIncorrect = isRevealed && response?.selectedChoice === key && key !== question.answer;
                      const isSelected = response?.selectedChoice === key;
                      return (
                        <button
                          key={key}
                          className={`choice-button ${isCorrectChoice ? "correct" : ""} ${isSelectedIncorrect ? "incorrect" : ""} ${isSelected ? "selected" : ""}`}
                          onClick={() => onUpdateResponse(question.id, { selectedChoice: key, revealed: true })}
                        >
                          <div className="choice-row">
                            <strong>{key}</strong>
                            <span dangerouslySetInnerHTML={{ __html: value }} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="answer-panel answer-panel-intro">
                    <strong>Self-grade this one.</strong>
                    <p className="muted">Work it out first, then mark it right or wrong below. You can revisit and change the mark later.</p>
                  </div>
                )}
              </div>

              {canRevealAnswer ? (
                <div className="quiz-answer-dock">
                  <div className="card-row">
                    <div>
                      <div className="mini-label" style={{ color: answerLabelColor }}>
                        {response?.wasCorrect == null
                          ? "Ready to grade"
                          : response.wasCorrect
                            ? "Marked correct"
                            : "Marked incorrect"}
                      </div>
                      <strong>Answer</strong>
                    </div>
                    {question.type === "mcq" && response?.revealed ? (
                      <span className="pill subtle">
                        {response.selectedChoice === question.answer ? "You picked the key" : `Correct choice: ${question.answer}`}
                      </span>
                    ) : null}
                  </div>
                  <div className="quiz-answer-content" dangerouslySetInnerHTML={{ __html: question.answer }} />
                  {question.url ? (
                    <a className="button-ghost quiz-source-link" href={question.url} target="_blank" rel="noreferrer">
                      Open source explanation
                    </a>
                  ) : null}
                </div>
              ) : (
                <div className="quiz-answer-placeholder">
                  <div className="mini-label">Reveal locked</div>
                  <strong>Select an answer first.</strong>
                  <p className="muted">The explanation appears here only after you choose an option.</p>
                </div>
              )}
            </div>
          </article>
        </main>
      </div>

      <footer className="quiz-footer">
        <div className="quiz-footer-left">
          <button className="button-ghost" onClick={() => onSetIndex(currentIndex - 1)} disabled={currentIndex === 0}>
            Previous
          </button>
          <button className="button-ghost" onClick={() => onSetIndex(currentIndex + 1)} disabled={currentIndex >= questions.length - 1}>
            Next
          </button>
        </div>
        <div className="quiz-footer-center">
          <span className="muted">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span className="muted">Enter = mark right • Space = mark wrong</span>
        </div>
        <div className="quiz-footer-right">
          <button
            className="button-ghost result-button result-button-ghost"
            onClick={() => handleGradeAndAdvance(false)}
            disabled={!response?.revealed && question.type !== "open"}
          >
            <span>Mark wrong</span>
            <span className="shortcut-badge">SPACE</span>
          </button>
          <button
            className="button result-button result-button-primary"
            onClick={() => handleGradeAndAdvance(true)}
            disabled={!response?.revealed && question.type !== "open"}
          >
            <span>Mark right</span>
            <span className="shortcut-badge">ENTER</span>
          </button>
        </div>
      </footer>
    </div>
  );
}

function pickRandom(items, count) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy.slice(0, count);
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
