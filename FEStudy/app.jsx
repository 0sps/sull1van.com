const { useEffect, useId, useMemo, useRef, useState } = React;

const STORAGE_KEY = "fe-industrial-prep-progress-v2";
const LEGACY_STORAGE_KEY = "fe-industrial-prep-progress-v1";
const ACTIVE_QUIZ_STORAGE_KEY = "fe-industrial-prep-active-quiz-v1";
const EXPORT_SCHEMA_VERSION = 2;

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

const TEST_MIX_KEYS = ["correct", "incorrect", "unanswered"];

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

function computePercentCorrect(correct, answered) {
  if (!answered) return null;
  return Math.round((correct / answered) * 100);
}

function formatQuestionHeading(question, index) {
  const rawId = question.id || "";
  const hasGeneratedId = rawId.includes(":");
  if (!hasGeneratedId) return rawId || `Question ${index + 1}`;
  const sourceLabel = question.sourceSubtopic || question.officialSubtopic || "Practice Question";
  return `Question ${index + 1} • ${sourceLabel}`;
}

function ClearAnswerStamp({ disabled, onClick }) {
  const textPathId = `clear-answer-stamp-${useId().replace(/:/g, "")}`;

  return (
    <button
      type="button"
      className="clear-answer-stamp"
      onClick={onClick}
      disabled={disabled}
      aria-label="Clear answer"
    >
      <svg className="clear-answer-stamp-svg" viewBox="0 0 100 100" aria-hidden="true">
        <defs>
          <path id={textPathId} d="M 22 50 A 28 28 0 0 1 78 50" />
        </defs>
        <text className="clear-answer-stamp-text">
          <textPath href={`#${textPathId}`} startOffset="50%" textAnchor="middle">
            CLEAR ANSWER
          </textPath>
        </text>
      </svg>
      <span className="clear-answer-stamp-disc" aria-hidden="true" />
    </button>
  );
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
  return mode === "diagnostic" || mode === "topic-test" || mode === "review";
}

function getQuizModeLabel(mode) {
  if (mode === "diagnostic") return "Diagnostic mode";
  if (mode === "topic-test") return "Topic test";
  if (mode === "review") return "Answer review";
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
    diagnosticAttempts: [],
    lastUpdated: new Date().toISOString()
  };
}

function normalizeDiagnosticAttempts(parsedAttempts = []) {
  if (!Array.isArray(parsedAttempts)) return [];
  return parsedAttempts
    .filter((attempt) => attempt && Array.isArray(attempt.questionIds))
    .map((attempt, index) => ({
      id: attempt.id || `diagnostic-${Date.now()}-${index}`,
      startedAt: attempt.startedAt || null,
      completedAt: attempt.completedAt || null,
      questionsPerTopic: Number.isFinite(attempt.questionsPerTopic) ? attempt.questionsPerTopic : 0,
      questionIds: attempt.questionIds.filter(Boolean),
      responses:
        attempt.responses && typeof attempt.responses === "object"
          ? Object.entries(attempt.responses).reduce((accumulator, [questionId, response]) => {
            if (typeof response?.wasCorrect === "boolean") {
              accumulator[questionId] = { wasCorrect: response.wasCorrect };
            }
            return accumulator;
          }, {})
          : {},
      topicSummaries:
        attempt.topicSummaries && typeof attempt.topicSummaries === "object"
          ? Object.entries(attempt.topicSummaries).reduce((accumulator, [sectionId, summary]) => {
            accumulator[sectionId] = {
              answered: Number.isFinite(summary?.answered) ? summary.answered : 0,
              correct: Number.isFinite(summary?.correct) ? summary.correct : 0,
              score: computePercentCorrect(
                Number.isFinite(summary?.correct) ? summary.correct : 0,
                Number.isFinite(summary?.answered) ? summary.answered : 0
              )
            };
            return accumulator;
          }, {})
          : {},
      answered: Number.isFinite(attempt.answered) ? attempt.answered : 0,
      correct: Number.isFinite(attempt.correct) ? attempt.correct : 0,
      score: computePercentCorrect(
        Number.isFinite(attempt.correct) ? attempt.correct : 0,
        Number.isFinite(attempt.answered) ? attempt.answered : 0
      )
    }));
}

function mergeSubtopicProgress(base, incoming) {
  const next = { ...base };
  Object.entries(incoming).forEach(([sectionId, subtopics]) => {
    next[sectionId] = { ...(next[sectionId] || {}), ...(subtopics || {}) };
  });
  return next;
}

function rebuildDerivedProgress(data, questionResults) {
  const questionsById = data.questions.reduce((accumulator, question) => {
    accumulator[question.id] = question;
    return accumulator;
  }, {});
  const next = getDefaultProgress(data);

  Object.entries(questionResults).forEach(([questionId, result]) => {
    const question = questionsById[questionId];
    if (!question || typeof result?.wasCorrect !== "boolean") {
      return;
    }
    const updated = setProgressForQuestionResult(next, question, result.wasCorrect);
    next.topicProgress = updated.topicProgress;
    next.subtopicProgress = updated.subtopicProgress;
    next.questionResults = {
      ...updated.questionResults,
      [questionId]: {
        wasCorrect: result.wasCorrect,
        updatedAt: result.updatedAt || null
      }
    };
    next.answeredQuestionIds = Object.keys(next.questionResults);
  });

  return next;
}

function normalizeProgress(data, parsed = {}) {
  const defaults = getDefaultProgress(data);
  const rawQuestionResults = parsed.questionResults || {};
  const diagnosticAttempts = normalizeDiagnosticAttempts(parsed.diagnosticAttempts);
  const normalizedQuestionResults = {};
  Object.entries(rawQuestionResults).forEach(([questionId, result]) => {
    if (typeof result?.wasCorrect === "boolean") {
      normalizedQuestionResults[questionId] = {
        wasCorrect: result.wasCorrect,
        updatedAt: result.updatedAt || null
      };
    }
  });
  const recomputed = rebuildDerivedProgress(data, normalizedQuestionResults);

  return {
    ...defaults,
    ...parsed,
    topicProgress: recomputed.topicProgress,
    subtopicProgress: recomputed.subtopicProgress,
    questionResults: normalizedQuestionResults,
    answeredQuestionIds: recomputed.answeredQuestionIds,
    diagnosticAttempts,
    completedDiagnostic: diagnosticAttempts.length > 0 || !!parsed.completedDiagnostic
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
    revealed: false,
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

function getScopedTestPools(questions, progress) {
  return questions.reduce(
    (accumulator, question) => {
      const savedResult = progress.questionResults?.[question.id];
      if (savedResult?.wasCorrect === true) {
        accumulator.correct.push(question);
      } else if (savedResult?.wasCorrect === false) {
        accumulator.incorrect.push(question);
      } else {
        accumulator.unanswered.push(question);
      }
      return accumulator;
    },
    { correct: [], incorrect: [], unanswered: [] }
  );
}

function clampMixCount(value, max) {
  const numeric = Number.parseInt(String(value || "").trim(), 10);
  if (!Number.isFinite(numeric) || numeric < 0) {
    return 0;
  }
  return clamp(numeric, 0, max);
}

function getDefaultMixInputs(availability) {
  if (availability.unanswered > 0) {
    return { correct: "0", incorrect: "0", unanswered: String(availability.unanswered) };
  }
  if (availability.incorrect > 0) {
    return { correct: "0", incorrect: String(availability.incorrect), unanswered: "0" };
  }
  return { correct: String(availability.correct || 0), incorrect: "0", unanswered: "0" };
}

function sanitizeMixInputs(mixInputs, availability) {
  return TEST_MIX_KEYS.reduce((accumulator, key) => {
    accumulator[key] = String(clampMixCount(mixInputs?.[key], availability[key]));
    return accumulator;
  }, {});
}

function getSelectedMixCounts(mixInputs, availability) {
  return TEST_MIX_KEYS.reduce((accumulator, key) => {
    accumulator[key] = clampMixCount(mixInputs?.[key], availability[key]);
    return accumulator;
  }, {});
}

function buildQuizSession({
  mode,
  title,
  subtitle,
  sectionId = null,
  officialSubtopic = null,
  questions,
  progress,
  requestedMix = null,
  poolAvailability = null,
  initialResponses = null,
  showPriorResults = true,
  diagnosticMeta = null,
  returnTarget = { type: "dashboard" }
}) {
  const now = new Date().toISOString();
  const responses = {};
  questions.forEach((question) => {
    responses[question.id] = {
      ...normalizeQuizResponse(question),
      ...(initialResponses?.[question.id] || {})
    };
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
    requestedMix,
    poolAvailability,
    showPriorResults,
    diagnosticMeta,
    returnTarget: normalizeReturnTarget(returnTarget),
    responses,
    startedAt: now,
    completedAt: null,
    lastUpdated: now
  };
}

function normalizeReturnTarget(returnTarget) {
  if (returnTarget?.type === "topic-modal" && returnTarget.sectionId) {
    return { type: "topic-modal", sectionId: returnTarget.sectionId };
  }
  return { type: "dashboard" };
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
    const incomingWasCorrect = typeof incoming.wasCorrect === "boolean" ? incoming.wasCorrect : null;
    const incomingRevealed = typeof incoming.revealed === "boolean" ? incoming.revealed : false;
    responses[questionId] = {
      selectedChoice: incoming.selectedChoice ?? null,
      revealed: question.type === "open" && incomingWasCorrect == null ? false : incomingRevealed,
      wasCorrect: incomingWasCorrect
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
    currentIndex: clamp(rawSession.currentIndex || 0, 0, validQuestionIds.length),
    questionIds: validQuestionIds,
    baselineResults,
    requestedMix:
      rawSession.requestedMix && typeof rawSession.requestedMix === "object"
        ? TEST_MIX_KEYS.reduce((accumulator, key) => {
          if (typeof rawSession.requestedMix[key] === "number") {
            accumulator[key] = rawSession.requestedMix[key];
          }
          return accumulator;
        }, {})
        : null,
    poolAvailability:
      rawSession.poolAvailability && typeof rawSession.poolAvailability === "object"
        ? TEST_MIX_KEYS.reduce((accumulator, key) => {
          if (typeof rawSession.poolAvailability[key] === "number") {
            accumulator[key] = rawSession.poolAvailability[key];
          }
          return accumulator;
        }, {})
        : null,
    showPriorResults: rawSession.showPriorResults !== false,
    diagnosticMeta:
      rawSession.diagnosticMeta && typeof rawSession.diagnosticMeta === "object"
        ? {
          questionsPerTopic: Number.isFinite(rawSession.diagnosticMeta.questionsPerTopic)
            ? rawSession.diagnosticMeta.questionsPerTopic
            : 0,
          estimatedTotal: Number.isFinite(rawSession.diagnosticMeta.estimatedTotal)
            ? rawSession.diagnosticMeta.estimatedTotal
            : 0
        }
        : null,
    returnTarget: normalizeReturnTarget(rawSession.returnTarget),
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
  return normalizeReturnTarget(activeQuiz?.returnTarget);
}

function getActiveQuizSummary(activeQuiz) {
  if (!activeQuiz) return null;
  return {
    answeredCount: activeQuiz.questionIds.filter((questionId) => getSessionQuestionState(activeQuiz, questionId)?.wasCorrect != null).length,
    questionCount: activeQuiz.questionIds.length
  };
}

function splitQuestionsByAnswerState(questions, progress) {
  return questions.reduce(
    (accumulator, question) => {
      if (typeof progress.questionResults?.[question.id]?.wasCorrect === "boolean") {
        accumulator.answered.push(question);
      } else {
        accumulator.unanswered.push(question);
      }
      return accumulator;
    },
    { unanswered: [], answered: [] }
  );
}

function clampDiagnosticQuestionsPerTopic(value) {
  const numeric = Number.parseInt(String(value || "").trim(), 10);
  if (!Number.isFinite(numeric)) return 0;
  return clamp(numeric, 0, 10);
}

function getDiagnosticAvailabilityBySection(data, questionsBySection, progress) {
  return data.sections.map((section) => {
    const pools = splitQuestionsByAnswerState(questionsBySection[section.id] || [], progress);
    return {
      sectionId: section.id,
      sectionTitle: section.title,
      unanswered: pools.unanswered,
      answered: pools.answered,
      totalAvailable: pools.unanswered.length + pools.answered.length
    };
  });
}

function estimateDiagnosticQuestionCount(sectionAvailability, questionsPerTopic) {
  if (!questionsPerTopic) return 0;
  return sectionAvailability.reduce((sum, section) => sum + Math.min(section.totalAvailable, questionsPerTopic), 0);
}

function buildDiagnosticQuestionSet(sectionAvailability, questionsPerTopic) {
  if (!questionsPerTopic) return [];
  const selectedQuestions = sectionAvailability.flatMap((section) => {
    const unansweredSelection = pickRandom(section.unanswered, Math.min(section.unanswered.length, questionsPerTopic));
    const remainingSlots = Math.max(questionsPerTopic - unansweredSelection.length, 0);
    const answeredSelection = pickRandom(section.answered, Math.min(section.answered.length, remainingSlots));
    return [...unansweredSelection, ...answeredSelection];
  });
  return pickRandom(selectedQuestions, selectedQuestions.length);
}

function summarizeDiagnosticAttempt(activeQuiz, questionsById) {
  const topicSummaries = {};
  let answered = 0;
  let correct = 0;

  activeQuiz.questionIds.forEach((questionId) => {
    const question = questionsById[questionId];
    const response = activeQuiz.responses?.[questionId];
    if (!question || typeof response?.wasCorrect !== "boolean") {
      return;
    }

    answered += 1;
    if (response.wasCorrect) {
      correct += 1;
    }

    const current = topicSummaries[question.sectionId] || { answered: 0, correct: 0, score: null };
    current.answered += 1;
    if (response.wasCorrect) {
      current.correct += 1;
    }
    current.score = computePercentCorrect(current.correct, current.answered);
    topicSummaries[question.sectionId] = current;
  });

  return {
    id: activeQuiz.id,
    startedAt: activeQuiz.startedAt,
    completedAt: new Date().toISOString(),
    questionsPerTopic: activeQuiz.diagnosticMeta?.questionsPerTopic || 0,
    questionIds: [...activeQuiz.questionIds],
    responses: activeQuiz.questionIds.reduce((accumulator, questionId) => {
      const response = activeQuiz.responses?.[questionId];
      if (typeof response?.wasCorrect === "boolean") {
        accumulator[questionId] = { wasCorrect: response.wasCorrect };
      }
      return accumulator;
    }, {}),
    topicSummaries,
    answered,
    correct,
    score: computePercentCorrect(correct, answered)
  };
}

function formatDiagnosticAttemptDate(value) {
  if (!value) return "Completed diagnostic";
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit"
    }).format(new Date(value));
  } catch (error) {
    return value;
  }
}

function getLeaveDialogTitle(activeQuiz) {
  if (activeQuiz?.mode === "review") {
    return "What should we do with this review?";
  }
  if (activeQuiz?.mode === "diagnostic") {
    return "What should we do with this diagnostic?";
  }
  return "What should we do with this quiz?";
}

function getLeaveDialogDescription(activeQuiz) {
  if (activeQuiz?.mode === "review") {
    return "You can keep this review exactly as it is and resume later, or discard the mark changes from this review and leave.";
  }
  if (activeQuiz?.mode === "diagnostic") {
    return "You can keep this diagnostic exactly as it is and resume later, or discard every result from this diagnostic attempt and leave without saving it to diagnostic history.";
  }
  return "You can keep this quiz exactly as it is and resume later, or discard every result from this attempt and leave.";
}

function renderMath() {
  if (window.MathJax?.typesetPromise) {
    window.MathJax.typesetPromise().catch(() => { });
  }
}

function App() {
  const data = window.FEQuizData;
  const questionsBySection = useMemo(() => groupQuestionsBySection(data), [data]);
  const questionsById = useMemo(() => groupQuestionsById(data), [data]);
  const [progress, setProgress] = useState(() => readProgress(data));
  const [activeQuiz, setActiveQuiz] = useState(() => readActiveQuiz(questionsById));
  const [view, setView] = useState({ name: "dashboard" });
  const [topicModalSectionId, setTopicModalSectionId] = useState(null);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [quizActionDialog, setQuizActionDialog] = useState(null);
  const [testSetupDialog, setTestSetupDialog] = useState(null);
  const [diagnosticSetupDialog, setDiagnosticSetupDialog] = useState(null);
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
  const diagnosticHistory = useMemo(
    () => [...(progress.diagnosticAttempts || [])].sort((left, right) => new Date(right.completedAt || 0) - new Date(left.completedAt || 0)),
    [progress.diagnosticAttempts]
  );
  const hasCompletedDiagnostic = diagnosticHistory.length > 0 || progress.completedDiagnostic;

  function openQuizSession(session) {
    setActiveQuiz(session);
    setView({ name: "session" });
  }

  function openTopicModal(sectionId) {
    setTopicModalSectionId(sectionId);
  }

  function closeTopicModal() {
    setTopicModalSectionId(null);
  }

  function restoreAfterQuiz(returnTarget) {
    const normalized = normalizeReturnTarget(returnTarget);
    setView({ name: "dashboard" });
    setTopicModalSectionId(normalized.type === "topic-modal" ? normalized.sectionId : null);
  }

  function openTestSetupDialog({
    mode,
    title,
    subtitle,
    sectionId = null,
    officialSubtopic = null,
    questions,
    returnTarget = { type: "dashboard" }
  }) {
    const pools = getScopedTestPools(questions, progress);
    const availability = TEST_MIX_KEYS.reduce((accumulator, key) => {
      accumulator[key] = pools[key].length;
      return accumulator;
    }, {});
    setTestSetupDialog({
      mode,
      title,
      subtitle,
      sectionId,
      officialSubtopic,
      questions,
      returnTarget: normalizeReturnTarget(returnTarget),
      availability,
      mixInputs: getDefaultMixInputs(availability)
    });
  }

  function closeTestSetupDialog() {
    setTestSetupDialog(null);
  }

  function startDiagnostic() {
    const questionsPerTopic = 4;
    const sectionAvailability = getDiagnosticAvailabilityBySection(data, questionsBySection, progress);
    setDiagnosticSetupDialog({
      title: "Diagnostic",
      subtitle: "Pull balanced coverage across the FE Industrial topics with unanswered questions first.",
      questionsPerTopicInput: String(questionsPerTopic),
      sectionAvailability,
      estimatedTotal: estimateDiagnosticQuestionCount(sectionAvailability, questionsPerTopic)
    });
  }

  function startTopicPractice(sectionId, officialSubtopic = null, returnTarget = { type: "dashboard" }) {
    const section = data.sections.find((entry) => entry.id === sectionId);
    const questions = (questionsBySection[sectionId] || []).filter((question) => !officialSubtopic || question.officialSubtopic === officialSubtopic);
    openTestSetupDialog({
      mode: "topic-test",
      title: officialSubtopic || section.title,
      subtitle: officialSubtopic ? `${section.title} focused test` : `${section.title} topic test`,
      sectionId,
      officialSubtopic,
      questions,
      returnTarget
    });
  }

  function resumeQuiz() {
    if (!activeQuiz || activeQuiz.status !== "in-progress") return;
    const returnTarget = normalizeReturnTarget(activeQuiz.returnTarget);
    setTopicModalSectionId(returnTarget.type === "topic-modal" ? returnTarget.sectionId : null);
    setView({ name: "session" });
  }

  function leaveQuiz() {
    restoreAfterQuiz(getSessionBackView(activeQuiz));
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

  function closeDiagnosticSetupDialog() {
    setDiagnosticSetupDialog(null);
  }

  function updateTestSetupMixInput(key, value) {
    setTestSetupDialog((current) => {
      if (!current) return current;
      const nextValue = String(value).replace(/[^\d]/g, "");
      return {
        ...current,
        mixInputs: {
          ...current.mixInputs,
          [key]: nextValue
        }
      };
    });
  }

  function clampTestSetupMixInput(key) {
    setTestSetupDialog((current) => {
      if (!current) return current;
      return {
        ...current,
        mixInputs: {
          ...current.mixInputs,
          [key]: String(clampMixCount(current.mixInputs?.[key], current.availability[key]))
        }
      };
    });
  }

  function updateDiagnosticQuestionsPerTopicInput(value) {
    setDiagnosticSetupDialog((current) => {
      if (!current) return current;
      const nextValue = String(value).replace(/[^\d]/g, "");
      const questionsPerTopic = clampDiagnosticQuestionsPerTopic(nextValue);
      return {
        ...current,
        questionsPerTopicInput: nextValue,
        estimatedTotal: estimateDiagnosticQuestionCount(current.sectionAvailability, questionsPerTopic)
      };
    });
  }

  function clampDiagnosticQuestionsPerTopicInput() {
    setDiagnosticSetupDialog((current) => {
      if (!current) return current;
      const questionsPerTopic = clampDiagnosticQuestionsPerTopic(current.questionsPerTopicInput);
      return {
        ...current,
        questionsPerTopicInput: questionsPerTopic ? String(questionsPerTopic) : "",
        estimatedTotal: estimateDiagnosticQuestionCount(current.sectionAvailability, questionsPerTopic)
      };
    });
  }

  function startConfiguredTest() {
    if (!testSetupDialog) return;
    const pools = getScopedTestPools(testSetupDialog.questions, progress);
    const availability = TEST_MIX_KEYS.reduce((accumulator, key) => {
      accumulator[key] = pools[key].length;
      return accumulator;
    }, {});
    const requestedMix = getSelectedMixCounts(testSetupDialog.mixInputs, availability);
    const selectedQuestions = TEST_MIX_KEYS.flatMap((key) => pickRandom(pools[key], requestedMix[key]));
    if (!selectedQuestions.length) {
      setTestSetupDialog((current) =>
        current
          ? {
            ...current,
            availability,
            mixInputs: sanitizeMixInputs(current.mixInputs, availability)
          }
          : current
      );
      return;
    }

    openQuizSession(
      buildQuizSession({
        mode: testSetupDialog.mode,
        title: testSetupDialog.title,
        subtitle: testSetupDialog.subtitle,
        sectionId: testSetupDialog.sectionId,
        officialSubtopic: testSetupDialog.officialSubtopic,
        questions: pickRandom(selectedQuestions, selectedQuestions.length),
        progress,
        requestedMix,
        poolAvailability: availability,
        returnTarget: testSetupDialog.returnTarget
      })
    );
    closeTestSetupDialog();
  }

  function startConfiguredDiagnostic() {
    if (!diagnosticSetupDialog) return;
    const questionsPerTopic = clampDiagnosticQuestionsPerTopic(diagnosticSetupDialog.questionsPerTopicInput);
    const selectedQuestions = buildDiagnosticQuestionSet(diagnosticSetupDialog.sectionAvailability, questionsPerTopic);
    if (!selectedQuestions.length) {
      setDiagnosticSetupDialog((current) =>
        current
          ? {
            ...current,
            questionsPerTopicInput: questionsPerTopic ? String(questionsPerTopic) : "",
            estimatedTotal: 0
          }
          : current
      );
      return;
    }

    openQuizSession(
      buildQuizSession({
        mode: "diagnostic",
        title: "Diagnostic",
        subtitle: "Balanced cross-topic diagnostic with fresh question state for this attempt.",
        questions: selectedQuestions,
        progress,
        showPriorResults: false,
        diagnosticMeta: {
          questionsPerTopic,
          estimatedTotal: selectedQuestions.length
        }
      })
    );
    closeDiagnosticSetupDialog();
  }

  function openTopicReview(sectionId, returnTarget = { type: "dashboard" }) {
    const section = data.sections.find((entry) => entry.id === sectionId);
    const answeredQuestions = (questionsBySection[sectionId] || []).filter(
      (question) => typeof progress.questionResults?.[question.id]?.wasCorrect === "boolean"
    );
    const initialResponses = answeredQuestions.reduce((accumulator, question) => {
      accumulator[question.id] = {
        selectedChoice: null,
        revealed: true,
        wasCorrect: progress.questionResults[question.id].wasCorrect
      };
      return accumulator;
    }, {});

    openQuizSession(
      buildQuizSession({
        mode: "review",
        title: `${section.title} review`,
        subtitle: "Revisit every answered question in this topic and update the mark if your confidence has changed.",
        sectionId,
        questions: answeredQuestions,
        progress,
        initialResponses,
        returnTarget
      })
    );
  }

  function saveProgressAndLeaveQuiz() {
    closeQuizActionDialog();
    leaveQuiz();
  }

  function discardQuizAndLeave() {
    if (!activeQuiz) return;
    const returnTarget = getSessionBackView(activeQuiz);
    setProgress((current) => restoreProgressFromQuizSession(current, activeQuiz, questionsById));
    setActiveQuiz(null);
    restoreAfterQuiz(returnTarget);
    closeQuizActionDialog();
  }

  function submitQuiz() {
    if (!activeQuiz) return;

    const returnTarget = getSessionBackView(activeQuiz);

    setActiveQuiz((current) => {
      if (!current) return current;
      return {
        ...current,
        status: "complete",
        completedAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        responses: { ...current.responses }
      };
    });

    if (activeQuiz.mode === "diagnostic") {
      const diagnosticAttempt = summarizeDiagnosticAttempt(activeQuiz, questionsById);
      setProgress((current) => ({
        ...current,
        completedDiagnostic: true,
        diagnosticAttempts: [...(current.diagnosticAttempts || []), diagnosticAttempt]
      }));
    }

    restoreAfterQuiz(returnTarget);
    closeQuizActionDialog();
  }

  function updateQuizIndex(nextIndex) {
    setActiveQuiz((current) => {
      if (!current) return current;
      return {
        ...current,
        currentIndex: clamp(nextIndex, 0, current.questionIds.length),
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

  function clearQuizQuestion(question) {
    if (!question || !activeQuiz) return;
    const baseline = activeQuiz.baselineResults?.[question.id];
    const baselineWasCorrect = typeof baseline?.wasCorrect === "boolean" ? baseline.wasCorrect : null;
    setActiveQuiz((current) => {
      if (!current) return current;
      return {
        ...current,
        responses: {
          ...current.responses,
          [question.id]: normalizeQuizResponse(question)
        },
        lastUpdated: new Date().toISOString()
      };
    });
    setProgress((current) => setProgressForQuestionResult(current, question, baselineWasCorrect));
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

  useEffect(() => {
    if (!testSetupDialog) return undefined;

    function handleKeydown(event) {
      const targetTag = event.target?.tagName;
      if (targetTag === "INPUT" || targetTag === "TEXTAREA" || event.target?.isContentEditable) {
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        closeTestSetupDialog();
      }
    }

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [testSetupDialog]);

  useEffect(() => {
    if (!diagnosticSetupDialog) return undefined;

    function handleKeydown(event) {
      const targetTag = event.target?.tagName;
      if (targetTag === "INPUT" || targetTag === "TEXTAREA" || event.target?.isContentEditable) {
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        closeDiagnosticSetupDialog();
      }
    }

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [diagnosticSetupDialog]);

  useEffect(() => {
    if (!topicModalSectionId || view.name === "session") return undefined;

    function handleKeydown(event) {
      const targetTag = event.target?.tagName;
      if (targetTag === "INPUT" || targetTag === "TEXTAREA" || event.target?.isContentEditable) {
        return;
      }

      if (event.defaultPrevented) {
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        closeTopicModal();
      }
    }

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [topicModalSectionId, view.name]);

  const showResumeButton = activeQuiz?.status === "in-progress";
  const configuredQuestionTotal = testSetupDialog
    ? TEST_MIX_KEYS.reduce(
      (sum, key) => sum + clampMixCount(testSetupDialog.mixInputs?.[key], testSetupDialog.availability[key]),
      0
    )
    : 0;

  return (
    <div className={`app-shell ${view.name === "session" && isTestMode(activeQuiz?.mode) ? "app-shell-session" : ""}`}>
      {!(view.name === "session" && isTestMode(activeQuiz?.mode)) ? (
        <>
          <header className="hero dashboard-hero">
            <div className="hero-grid dashboard-hero-grid">
              <div className="dashboard-hero-copy">
                <div className="eyebrow">{data.exam}</div>
                <h1>Build your readiness for the FE exam.</h1>
                <p>
                  This dashboard is built
                  to help you diagnose weak areas and drill down into focused practice.
                </p>
                <div className="hero-controls dashboard-hero-controls">
                  <div className="hero-primary-actions">
                    <button className="button" onClick={startDiagnostic}>
                      {hasCompletedDiagnostic ? "Retake diagnostic" : "Take diagnostic"}
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
                      className={`session-banner dashboard-session-banner ${showResumeButton ? "is-clickable" : ""} ${activeQuiz.status === "in-progress" ? "is-active" : ""}`}
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
              <div className="stats-grid dashboard-stats-grid">
                <div className="stat-card dashboard-stat-card">
                  <div className="mini-label">Estimated overall</div>
                  <div className="stat-value" style={{ color: scoreToColor(overall.score) }}>
                    {overall.score == null ? "—" : `${overall.score}%`}
                  </div>
                </div>
                <div className="stat-card dashboard-stat-card">
                  <div className="mini-label">Questions answered</div>
                  <div className="stat-value">{overall.answered}</div>
                </div>
                <div className="stat-card dashboard-stat-card">
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
              diagnosticHistory={diagnosticHistory}
              questionsBySection={questionsBySection}
              recommendations={recommendations}
              activeQuiz={activeQuiz}
              onResumeQuiz={resumeQuiz}
              onStartDiagnostic={startDiagnostic}
              onOpenTopic={openTopicModal}
              onStartPractice={startTopicPractice}
            />
          ) : null}

          {view.name === "session" && !isTestMode(activeQuiz?.mode) ? (
            <SessionView
              view={view}
              isResetDialogOpen={isResetDialogOpen}
              onBack={() => setView({ name: "dashboard" })}
              onFinish={finishPracticeSession}
              onRecord={(question, wasCorrect) => setProgress((current) => updateProgressForQuestion(current, question, wasCorrect))}
            />
          ) : null}

          <div className="footer-note dashboard-footer-note">
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
          onClearQuestion={clearQuizQuestion}
        />
      ) : null}

      {topicModalSectionId && view.name !== "session" ? (
        <div className="topic-modal-backdrop" onClick={closeTopicModal}>
          <div
            className="topic-modal-shell"
            role="dialog"
            aria-modal="true"
            aria-labelledby="topic-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <TopicDetail
              section={data.sections.find((entry) => entry.id === topicModalSectionId)}
              progress={progress}
              questionCount={questionsBySection[topicModalSectionId]?.length || 0}
              activeQuiz={activeQuiz}
              onResumeQuiz={resumeQuiz}
              onClose={closeTopicModal}
              onPractice={(sectionId, officialSubtopic = null) =>
                startTopicPractice(sectionId, officialSubtopic, { type: "topic-modal", sectionId: topicModalSectionId })
              }
              onReviewTopic={(sectionId) => openTopicReview(sectionId, { type: "topic-modal", sectionId })}
            />
          </div>
        </div>
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
              This will wipe your topic scores, answered-question history, saved diagnostic history, diagnostic status, and
              any saved quiz session for this device only.
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
            <div className="mini-label">
              {quizActionDialog.type === "leave"
                ? activeQuiz.mode === "review"
                  ? "Leave review"
                  : "Leave quiz"
                : activeQuiz.mode === "review"
                  ? "Finish review"
                  : "Submit quiz"}
            </div>
            <h2 id="quiz-action-title" className="dialog-title">
              {quizActionDialog.type === "leave"
                ? getLeaveDialogTitle(activeQuiz)
                : activeQuiz.mode === "review"
                  ? "Finish this review now?"
                  : quizActionDialog.unansweredCount
                    ? "Submit and leave unanswered questions unrecorded?"
                    : "Submit this quiz now?"}
            </h2>
            <p id="quiz-action-description" className="sidebar-note" style={{ marginTop: 0 }}>
              {quizActionDialog.type === "leave"
                ? getLeaveDialogDescription(activeQuiz)
                : activeQuiz.mode === "review"
                  ? "Any changes you made to right or wrong marks are already saved. Finishing review just closes out this review session."
                  : quizActionDialog.unansweredCount
                    ? `${quizActionDialog.unansweredCount} unanswered question${quizActionDialog.unansweredCount === 1 ? "" : "s"} will be left unrecorded when you submit this test.`
                    : "We’ll save this quiz as complete and keep every graded result in your browser progress."}
            </p>
            <div className="toolbar dialog-actions quiz-action-dialog-actions">
              {quizActionDialog.type === "leave" ? (
                <div className="quiz-action-leave-layout">
                  <button className="button dialog-option quiz-action-save-button" onClick={saveProgressAndLeaveQuiz}>
                    Save progress and leave
                  </button>
                  <div className="quiz-action-secondary-row">
                    <button className="button-ghost dialog-option quiz-action-keep-button" onClick={closeQuizActionDialog}>
                      Keep testing
                    </button>
                    <button className="button-ghost dialog-option quiz-action-discard-button" onClick={discardQuizAndLeave}>
                      Discard results and leave
                    </button>
                  </div>
                </div>
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

      {testSetupDialog ? (
        <div className="dialog-backdrop" onClick={closeTestSetupDialog}>
          <div
            className="dialog-card test-setup-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="test-setup-title"
            aria-describedby="test-setup-description"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mini-label">{getQuizModeLabel(testSetupDialog.mode)}</div>
            <h2 id="test-setup-title" className="dialog-title">
              Build your question mix
            </h2>
            <p id="test-setup-description" className="sidebar-note" style={{ marginTop: 0 }}>
              {testSetupDialog.title} lets you pull from the questions you previously got right, previously missed, or have not attempted yet.
            </p>
            <div className="test-setup-summary">
              <strong>{testSetupDialog.title}</strong>
              <span className="muted">{testSetupDialog.subtitle}</span>
            </div>
            <div className="test-mix-grid">
              {TEST_MIX_KEYS.map((key) => (
                <label key={key} className="test-mix-row">
                  <span className="test-mix-label">{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                  <div className="test-mix-input-wrap">
                    <input
                      className="test-mix-input"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={testSetupDialog.mixInputs?.[key] ?? ""}
                      onChange={(event) => updateTestSetupMixInput(key, event.target.value)}
                      onBlur={() => clampTestSetupMixInput(key)}
                    />
                    <span className="test-mix-cap">/ {testSetupDialog.availability[key]} questions</span>
                  </div>
                </label>
              ))}
            </div>
            <div className="test-setup-total">
              <span className="mini-label">Total questions selected</span>
              <strong>{configuredQuestionTotal}</strong>
            </div>
            <div className="toolbar dialog-actions test-setup-actions">
              <button className="button-ghost dialog-option" onClick={closeTestSetupDialog}>
                Cancel
              </button>
              <button className="button dialog-option" onClick={startConfiguredTest} disabled={configuredQuestionTotal === 0}>
                Start test
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {diagnosticSetupDialog ? (
        <div className="dialog-backdrop" onClick={closeDiagnosticSetupDialog}>
          <div
            className="dialog-card test-setup-dialog diagnostic-setup-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="diagnostic-setup-title"
            aria-describedby="diagnostic-setup-description"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mini-label">Diagnostic setup</div>
            <h2 id="diagnostic-setup-title" className="dialog-title">
              Build a balanced diagnostic
            </h2>
            <p id="diagnostic-setup-description" className="sidebar-note" style={{ marginTop: 0 }}>
              Choose how many questions to pull from each topic. We’ll prefer unanswered questions first, then recycle previously answered ones only when needed.
            </p>
            <div className="test-setup-summary diagnostic-setup-summary">
              <strong>{diagnosticSetupDialog.title}</strong>
              <span className="muted">{diagnosticSetupDialog.subtitle}</span>
            </div>
            <label className="test-mix-row diagnostic-input-row">
              <span className="test-mix-label">Questions per topic</span>
              <div className="test-mix-input-wrap">
                <input
                  className="test-mix-input"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={diagnosticSetupDialog.questionsPerTopicInput}
                  onChange={(event) => updateDiagnosticQuestionsPerTopicInput(event.target.value)}
                  onBlur={clampDiagnosticQuestionsPerTopicInput}
                />
                <span className="test-mix-cap">Across {diagnosticSetupDialog.sectionAvailability.length} mapped topics</span>
              </div>
            </label>
            <div className="test-setup-total diagnostic-estimate-total">
              <span className="mini-label">Estimated total questions</span>
              <strong>{diagnosticSetupDialog.estimatedTotal}</strong>
            </div>
            <div className="diagnostic-topic-count">
              {diagnosticSetupDialog.sectionAvailability.filter((section) => section.totalAvailable > 0).length} topics currently have mapped questions available for the diagnostic pool.
            </div>
            <div className="toolbar dialog-actions test-setup-actions">
              <button className="button-ghost dialog-option" onClick={closeDiagnosticSetupDialog}>
                Cancel
              </button>
              <button
                className="button dialog-option"
                onClick={startConfiguredDiagnostic}
                disabled={diagnosticSetupDialog.estimatedTotal === 0}
              >
                Start diagnostic
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function getSectionMetrics(section, progress) {
  const topicState = progress.topicProgress[section.id] || { answered: 0, correct: 0 };
  const isScoreVisible = topicState.answered >= 10;
  const score = isScoreVisible ? computePercentCorrect(topicState.correct, topicState.answered) : null;
  return {
    ...topicState,
    score,
    isScoreVisible
  };
}

function getSubtopicMetrics(progress, sectionId, subtopicName) {
  const state = progress.subtopicProgress?.[sectionId]?.[subtopicName] || { answered: 0, correct: 0 };
  const isScoreVisible = state.answered >= 1;
  return { ...state, score: isScoreVisible ? computePercentCorrect(state.correct, state.answered) : null, isScoreVisible };
}

function renderAnsweredBreakdown(answered, correct) {
  const wrong = Math.max(answered - correct, 0);
  const details = [];
  if (correct > 0) {
    details.push(<span key="right" className="score-good">{correct} right</span>);
  }
  if (wrong > 0) {
    details.push(<span key="wrong" className="score-bad">{wrong} wrong</span>);
  }
  return (
    <>
      {answered} answered
      {details.length ? ": " : ""}
      {details.map((detail, index) => (
        <React.Fragment key={detail.key || index}>
          {index > 0 ? ", " : ""}
          {detail}
        </React.Fragment>
      ))}
    </>
  );
}

function Dashboard({
  data,
  progress,
  diagnosticHistory,
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
    <div className="content-grid dashboard-grid">
      <aside className="stack dashboard-sidebar">
        {activeQuiz?.status === "in-progress" ? (
          <div className="panel dashboard-panel dashboard-panel-resume">
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

        <div className="panel dashboard-panel dashboard-panel-study">
          <div className="mini-label">Study next</div>
          <h2 className="section-title">Recommended focus</h2>
          <div className="stack">
            {recommendations.map(({ section, metrics, questionCount }) => (
              <div key={section.id} className="results-card dashboard-mini-card">
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

        <div className="panel dashboard-panel">
          <div className="mini-label">How scoring works</div>
          <p className="sidebar-note">
            Topic bars unlock after you answer 10 questions in that topic. Subtopic bars unlock after your first answered
            question there, and all percentages are shown as raw percent correct.
          </p>
        </div>

        <div className="panel dashboard-panel dashboard-panel-diagnostic">
          <div className="mini-label">Diagnostic</div>
          <p className="sidebar-note">
            Build a balanced diagnostic across the mapped FE Industrial topics. You choose how many questions to pull per
            topic, and the app prefers unanswered questions before recycling older ones.
          </p>
          <button className="button" onClick={onStartDiagnostic}>
            Start diagnostic
          </button>
        </div>

        <div className="panel dashboard-panel">
          <div className="mini-label">Diagnostic history</div>
          {diagnosticHistory.length ? (
            <div className="stack diagnostic-history-list">
              {diagnosticHistory.map((attempt) => (
                <div key={attempt.id} className="results-card diagnostic-history-card dashboard-mini-card">
                  <div className="card-row">
                    <strong>{formatDiagnosticAttemptDate(attempt.completedAt)}</strong>
                    <span className="pill subtle">{attempt.score == null ? "Ungraded" : `${attempt.score}% correct`}</span>
                  </div>
                  <p className="muted" style={{ marginBottom: 8 }}>
                    {attempt.questionsPerTopic} per topic • {attempt.answered} graded
                  </p>
                  <p className="reason-text" style={{ margin: 0 }}>
                    {attempt.correct} correct out of {attempt.answered || 0} graded questions.
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="sidebar-note" style={{ marginBottom: 0 }}>
              No diagnostic attempts saved yet. Your completed diagnostics will show up here as separate entries.
            </p>
          )}
        </div>
      </aside>

      <main className="stack dashboard-main">
        {data.sections.map((section) => {
          const metrics = getSectionMetrics(section, progress);
          const questionCount = questionsBySection[section.id]?.length || 0;
          const isThinCoverage = questionCount < 5;
          const isExpanded = !!expandedSections[section.id];
          const coverageLabel = getCoverageLabel(questionCount);
          const canResumeSectionQuiz = activeQuiz?.status === "in-progress" && activeQuiz.sectionId === section.id;
          return (
            <article key={section.id} className={`topic-card dashboard-topic-card ${isThinCoverage ? "is-thin" : ""}`}>
              <div className="topic-summary-panel dashboard-topic-summary-panel">
                <div className="topic-header">
                  <div>
                    <div className="mini-label">
                      Blueprint range {section.questionRange} questions
                    </div>
                    <h3>{section.title}</h3>
                  </div>
                  <div className="toolbar">
                    <span className={`pill ${isThinCoverage ? "warn" : ""}`}>
                      {metrics.isScoreVisible ? `${metrics.score}% correct` : "Progress locked"}
                    </span>
                    <span className={`pill ${isThinCoverage ? "warn" : "subtle"}`}>{coverageLabel}</span>
                  </div>
                </div>

                <div className={`score-bar ${metrics.isScoreVisible ? "" : "is-disabled has-message"}`}>
                  {metrics.isScoreVisible ? (
                    <div className="score-mask" style={{ width: `${100 - (metrics.score || 0)}%` }} />
                  ) : (
                    <span className="score-bar-message">ANSWER AT LEAST 10 QUESTIONS TO SEE</span>
                  )}
                </div>

                <div className="topic-actions">
                  <div className="topic-progress-copy">
                    <span className="muted">{questionCount} mapped questions.</span>
                    <span className="muted">{renderAnsweredBreakdown(metrics.answered, metrics.correct)}</span>
                  </div>
                  <div className="toolbar">
                    <button className="button-ghost topic-card-action-open" onClick={() => onOpenTopic(section.id)}>
                      Open topic
                    </button>
                    <button
                      className="button-ghost topic-card-action-generate"
                      onClick={() => onStartPractice(section.id)}
                      disabled={questionCount === 0}
                    >
                      Generate quiz with topic
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
              </div>

              {isExpanded ? (
                <div className="subtopic-section-header">
                  <span className="mini-label">By subtopic</span>
                </div>
              ) : null}

              <div className={`subtopic-list compact ${isExpanded ? "" : "mobile-collapsed"}`}>
                {section.subtopicCoverage.map((subtopic) => {
                  const subMetrics = getSubtopicMetrics(progress, section.id, subtopic.name);
                  return (
                    <div key={subtopic.name} className="subtopic-row">
                      <div className="subtopic-meta">
                        <strong>{subtopic.name}</strong>
                        <div className="subtopic-summary">
                          <span className="muted">{subtopic.count} mapped questions.</span>
                          <span className="muted">{renderAnsweredBreakdown(subMetrics.answered, subMetrics.correct)}</span>
                        </div>
                      </div>
                      <div className="subtopic-metrics">
                        <div className="card-row" style={{ marginBottom: 6 }}>
                          <span className="muted">
                            {subMetrics.isScoreVisible ? `${subMetrics.score}% correct` : "Progress locked"}
                          </span>
                          <button className="nav-chip" onClick={() => onStartPractice(section.id, subtopic.name)} disabled={subtopic.count === 0}>
                            Generate quiz with subtopic
                          </button>
                        </div>
                        <div className={`score-bar ${subMetrics.isScoreVisible ? "" : "is-disabled"}`}>
                          {subMetrics.isScoreVisible ? (
                            <div className="score-mask" style={{ width: `${100 - (subMetrics.score || 0)}%` }} />
                          ) : null}
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

function TopicDetail({ section, progress, questionCount, activeQuiz, onResumeQuiz, onClose, onPractice, onReviewTopic }) {
  const metrics = getSectionMetrics(section, progress);
  const isThinCoverage = questionCount < 5;
  const canResumeSectionQuiz = activeQuiz?.status === "in-progress" && activeQuiz.sectionId === section.id;
  return (
    <div className="content-grid topic-detail-modal-layout">
      <aside className="stack">
        <div className="panel">
          <button className="button-ghost topic-modal-close-button" onClick={onClose}>
            Close topic
          </button>
          <div style={{ marginTop: 14 }} className="mini-label">
            {section.questionRange} official range
          </div>
          <h2 id="topic-modal-title" className="section-title">{section.title}</h2>
          <div className="topic-progress-copy sidebar-note">
            <span>{questionCount} mapped questions.</span>
            <span>{renderAnsweredBreakdown(metrics.answered, metrics.correct)}</span>
          </div>
          <div className="pill" style={{ marginTop: 10 }}>
            {metrics.isScoreVisible ? `${metrics.score}% correct` : "Progress locked"}
          </div>
          {canResumeSectionQuiz ? (
            <button className="button" style={{ marginTop: 16 }} onClick={onResumeQuiz}>
              Resume quiz
            </button>
          ) : null}
          {metrics.answered > 0 ? (
            <button className="button-ghost" style={{ marginTop: 12 }} onClick={() => onReviewTopic(section.id)}>
              Review previous answers
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
          <div className="topic-actions topic-actions-surface">
            <div>
              <div className="mini-label">Whole topic</div>
              <h3 style={{ marginTop: 8 }}>{section.title}</h3>
            </div>
            <div className="toolbar">
              <button className="button" onClick={() => onPractice(section.id)} disabled={questionCount === 0}>
                Generate quiz with topic
              </button>
            </div>
          </div>

          <div className="subtopic-section-header">
            <span className="mini-label">By subtopic</span>
          </div>

          <div className="subtopic-list">
            {section.subtopicCoverage.map((subtopic) => {
              const subMetrics = getSubtopicMetrics(progress, section.id, subtopic.name);
              return (
                <div className="subtopic-row" key={subtopic.name}>
                  <div className="subtopic-meta">
                    <strong>{subtopic.name}</strong>
                    <div className="subtopic-summary">
                      <span className="muted">{subtopic.count} mapped questions.</span>
                      <span className="muted">{renderAnsweredBreakdown(subMetrics.answered, subMetrics.correct)}</span>
                    </div>
                  </div>
                  <div className="subtopic-metrics">
                    <div className="card-row" style={{ marginBottom: 6 }}>
                      <span className="muted">{subMetrics.isScoreVisible ? `${subMetrics.score}% correct` : "Progress locked"}</span>
                      <button className="nav-chip" onClick={() => onPractice(section.id, subtopic.name)} disabled={subtopic.count === 0}>
                        Generate quiz with subtopic
                      </button>
                    </div>
                    <div className={`score-bar ${subMetrics.isScoreVisible ? "" : "is-disabled"}`}>
                      {subMetrics.isScoreVisible ? (
                        <div className="score-mask" style={{ width: `${100 - (subMetrics.score || 0)}%` }} />
                      ) : null}
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

      if (revealed && event.key === "Enter") {
        event.preventDefault();
        recordAndAdvance(true);
        return;
      }

      if (revealed && event.code === "Space") {
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

  function clearAnswer() {
    setSelectedChoice(null);
    setRevealed(false);
  }

  const canClearAnswer = selectedChoice != null || revealed;

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
          <div className="quiz-card-top">
            <div className="top-row">
              <span className="pill quiz-topic-pill">{question.officialSubtopic}</span>
            </div>
            <div className="quiz-card-top-actions">
              <ClearAnswerStamp onClick={clearAnswer} disabled={!canClearAnswer} />
            </div>
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

          {question.type === "open" && !revealed ? (
            <div className="answer-panel">
              <strong>Self-grade this one.</strong>
              <p className="muted">Work it out first, then mark whether you got it right before moving on.</p>
            </div>
          ) : null}

          {question.type === "open" ? (
            <div
              className={`answer-panel ${revealed ? "" : "is-clickable"}`}
              onClick={!revealed ? () => setRevealed(true) : undefined}
            >
              <div className="mini-label">Answer</div>
              <div className={`answer-reveal-shell ${revealed ? "is-revealed" : ""}`}>
                <div className="answer-reveal-content" dangerouslySetInnerHTML={{ __html: question.answer }} />
                {!revealed ? (
                  <div className="answer-reveal-button">Click to show answer</div>
                ) : null}
              </div>
              {revealed ? (
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
              ) : null}
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
  onGrade,
  onClearQuestion
}) {
  const questions = activeQuiz?.questionIds.map((questionId) => questionsById[questionId]).filter(Boolean) || [];
  const currentIndex = clamp(activeQuiz?.currentIndex || 0, 0, questions.length);
  const isSubmitLanding = currentIndex >= questions.length;
  const [navKeyActive, setNavKeyActive] = useState(null);
  const question = questions[currentIndex];
  const response = question ? getSessionQuestionState(activeQuiz, question.id) : null;
  const isReviewMode = activeQuiz?.mode === "review";
  const priorSavedResult =
    activeQuiz?.showPriorResults && question && typeof activeQuiz?.baselineResults?.[question.id]?.wasCorrect === "boolean"
      ? activeQuiz.baselineResults[question.id].wasCorrect
      : null;
  const gradedCount = questions.filter((entry) => getSessionQuestionState(activeQuiz, entry.id)?.wasCorrect != null).length;
  const progressPercent = questions.length ? Math.round((gradedCount / questions.length) * 100) : 0;
  const canRevealAnswer = !!response?.revealed;
  const unansweredCount = questions.filter((entry) => getSessionQuestionState(activeQuiz, entry.id)?.wasCorrect == null).length;
  const firstUnansweredIndex = questions.findIndex((entry) => getSessionQuestionState(activeQuiz, entry.id)?.wasCorrect == null);
  const canClearAnswer = !!(response && (response.selectedChoice != null || response.revealed || response.wasCorrect != null));

  useEffect(() => {
    renderMath();
  }, [question, response?.revealed, response?.selectedChoice, response?.wasCorrect]);

  function handleGradeAndAdvance(wasCorrect) {
    if (!question) return;
    onGrade(question, wasCorrect);
    if (currentIndex < questions.length - 1) {
      onSetIndex(currentIndex + 1);
      return;
    }
    onSetIndex(questions.length);
  }

  useEffect(() => {
    function handleKeydown(event) {
      if (isResetDialogOpen || isQuizActionDialogOpen) {
        return;
      }

      const targetTag = event.target?.tagName;
      if (targetTag === "INPUT" || targetTag === "TEXTAREA" || event.target?.isContentEditable) {
        return;
      }

      if (isSubmitLanding) {
        if (event.key === "ArrowLeft") {
          setNavKeyActive("left");
          event.preventDefault();
          onSetIndex(questions.length - 1);
        }
        return;
      }

      if (!question) {
        return;
      }

      const key = event.key.toUpperCase();
      const availableChoices = question.type === "mcq" ? Object.keys(question.choices || {}) : [];

      if (!isReviewMode && question.type === "mcq" && !response?.revealed && availableChoices.includes(key)) {
        event.preventDefault();
        onUpdateResponse(question.id, { selectedChoice: key, revealed: true });
        return;
      }

      if (response?.revealed && event.key === "Enter") {
        event.preventDefault();
        handleGradeAndAdvance(true);
        return;
      }

      if (response?.revealed && event.code === "Space") {
        event.preventDefault();
        handleGradeAndAdvance(false);
        return;
      }

      if (event.key === "ArrowRight") {
        setNavKeyActive("right");
        event.preventDefault();
        onSetIndex(currentIndex + 1);
        return;
      }

      if (event.key === "ArrowLeft") {
        setNavKeyActive("left");
        event.preventDefault();
        onSetIndex(currentIndex - 1);
      }
    }

    function handleKeyup(event) {
      if (event.key === "ArrowLeft" && navKeyActive === "left") {
        setNavKeyActive(null);
        return;
      }

      if (event.key === "ArrowRight" && navKeyActive === "right") {
        setNavKeyActive(null);
      }
    }

    function handleWindowBlur() {
      setNavKeyActive(null);
    }

    window.addEventListener("keydown", handleKeydown);
    window.addEventListener("keyup", handleKeyup);
    window.addEventListener("blur", handleWindowBlur);
    return () => {
      window.removeEventListener("keydown", handleKeydown);
      window.removeEventListener("keyup", handleKeyup);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [question, response?.revealed, currentIndex, isResetDialogOpen, isQuizActionDialogOpen, isReviewMode, isSubmitLanding, navKeyActive, onSetIndex, onUpdateResponse, questions.length]);

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
              <div className="mini-label">Graded</div>
              <strong>
                {gradedCount}/{questions.length}
              </strong>
            </div>
          </div>
          <div className="quiz-header-buttons">
            <button className="button-ghost quiz-header-leave-button" onClick={onRequestLeave}>
              {isReviewMode ? "Leave review" : "Leave quiz"}
            </button>
            <button className="button quiz-header-submit-button" onClick={onRequestSubmit}>
              {isReviewMode ? "Finish review" : "Submit quiz"}
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
            {isSubmitLanding ? (
              <>
                <div className="quiz-card-body quiz-submit-card-body">
                  <div className="quiz-submit-card">
                    <h2 className="quiz-submit-title">{isReviewMode ? "Ready to finish review?" : "Ready to submit?"}</h2>
                    <div className="mini-label">{unansweredCount === 0 ? "All questions graded" : "Review before submitting"}</div>
                    <strong>
                      {unansweredCount === 0
                        ? "Everything has been graded. You can submit whenever you're ready."
                        : `${unansweredCount} question${unansweredCount === 1 ? "" : "s"} still need a mark before you submit.`}
                    </strong>
                    <p className="muted">
                      {isReviewMode
                        ? "You can finish now or jump back to any question if you want to revise a saved result."
                        : "Submit here, use the top-right button as usual, or jump back to any unanswered question from the map."}
                    </p>
                    <div className="quiz-submit-stats">
                      <div className="quiz-submit-stat">
                        <span className="mini-label">Graded</span>
                        <strong>
                          {gradedCount}/{questions.length}
                        </strong>
                      </div>
                      <div className="quiz-submit-stat">
                        <span className="mini-label">Remaining</span>
                        <strong>{unansweredCount}</strong>
                      </div>
                    </div>
                    <div className="quiz-submit-actions">
                      <button className="button" onClick={onRequestSubmit}>
                        {isReviewMode ? "Finish review" : "Submit quiz"}
                      </button>
                      {firstUnansweredIndex >= 0 ? (
                        <button className="button-ghost" onClick={() => onSetIndex(firstUnansweredIndex)}>
                          Go to first unanswered
                        </button>
                      ) : null}
                      <button className="button-ghost" onClick={() => onSetIndex(Math.max(questions.length - 1, 0))}>
                        Back to last question
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="quiz-card-top">
                  <div className="top-row">
                    <span className="pill quiz-topic-pill">{question.officialSubtopic}</span>
                    {priorSavedResult != null ? (
                      <span className={`pill subtle ${priorSavedResult ? "score-good" : "score-bad"}`}>
                        Previously marked {priorSavedResult ? "correct" : "incorrect"}
                      </span>
                    ) : null}
                  </div>
                  <div className="quiz-card-top-actions">
                    <ClearAnswerStamp onClick={() => onClearQuestion(question)} disabled={!canClearAnswer} />
                  </div>
                  <h2>{formatQuestionHeading(question, currentIndex)}</h2>
                </div>

                <div className={`quiz-card-body ${question.type === "open" ? "has-answer-dock" : ""} ${canRevealAnswer ? "" : "is-awaiting-answer"}`}>
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
                              onClick={() => !isReviewMode && onUpdateResponse(question.id, { selectedChoice: key, revealed: true })}
                              disabled={isReviewMode}
                            >
                              <div className="choice-row">
                                <strong>{key}</strong>
                                <span dangerouslySetInnerHTML={{ __html: value }} />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ) : !canRevealAnswer ? (
                      <div className="answer-panel answer-panel-intro">
                        <strong>Self-grade this one.</strong>
                        <p className="muted">Work it out first, then mark it right or wrong below. You can revisit and change the mark later.</p>
                      </div>
                    ) : null}
                  </div>

                    {question.type === "open" ? (
                      <div
                        className={`quiz-answer-dock ${canRevealAnswer ? "" : "is-clickable"}`}
                        onClick={!canRevealAnswer ? () => onUpdateResponse(question.id, { revealed: true }) : undefined}
                      >
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
                        </div>
                        {priorSavedResult != null ? (
                          <div className="quiz-prior-result">
                            Saved before this attempt: {priorSavedResult ? "correct" : "incorrect"}.
                          </div>
                        ) : null}
                        <div className={`answer-reveal-shell ${canRevealAnswer ? "is-revealed" : ""}`}>
                          <div className="quiz-answer-content answer-reveal-content" dangerouslySetInnerHTML={{ __html: question.answer }} />
                          {!canRevealAnswer ? (
                            <div className="answer-reveal-button">Click to show answer</div>
                          ) : null}
                        </div>
                        {canRevealAnswer && question.url ? (
                          <a className="button-ghost quiz-source-link" href={question.url} target="_blank" rel="noreferrer">
                            Open source explanation
                          </a>
                        ) : null}
                      </div>
                    ) : null}
                </div>
              </>
            )}
          </article>
        </main>
      </div>

      <div className="quiz-footer-layout">
        <footer className="quiz-footer quiz-footer-sidebar">
          <div className="quiz-footer-nav">
            <button
              className={`button-ghost quiz-nav-button ${navKeyActive === "left" ? "is-key-active" : ""}`}
              onClick={() => onSetIndex(currentIndex - 1)}
              disabled={currentIndex === 0}
            >
              <span>Previous</span>
              <span className="shortcut-badge shortcut-badge-nav">←</span>
            </button>
            <button
              className={`button-ghost quiz-nav-button ${navKeyActive === "right" ? "is-key-active" : ""}`}
              onClick={() => onSetIndex(currentIndex + 1)}
              disabled={currentIndex >= questions.length}
            >
              <span>Next</span>
              <span className="shortcut-badge shortcut-badge-nav">→</span>
            </button>
          </div>
        </footer>
        <footer className="quiz-footer quiz-footer-stage">
          <div className="quiz-footer-center">
            <span className="muted">
              {isSubmitLanding ? (isReviewMode ? "Review wrap-up" : "Submission check") : `Question ${currentIndex + 1} of ${questions.length}`}
            </span>
          </div>
          <div className="quiz-footer-actions">
            {isSubmitLanding ? null : (
              <>
                <button
                  className="button-ghost result-button result-button-ghost"
                  onClick={() => handleGradeAndAdvance(false)}
                  disabled={!response?.revealed}
                >
                  <span>Mark wrong</span>
                  <span className="shortcut-badge">SPACE</span>
                </button>
                <button
                  className="button result-button result-button-primary"
                  onClick={() => handleGradeAndAdvance(true)}
                  disabled={!response?.revealed}
                >
                  <span>Mark right</span>
                  <span className="shortcut-badge">ENTER</span>
                </button>
              </>
            )}
          </div>
        </footer>
      </div>
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
