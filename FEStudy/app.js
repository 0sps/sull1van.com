var FEStudyApp = (() => {
  // app.jsx
  var { useEffect, useId, useMemo, useRef, useState } = React;
  var STORAGE_KEY = "fe-industrial-prep-progress-v2";
  var LEGACY_STORAGE_KEY = "fe-industrial-prep-progress-v1";
  var ACTIVE_QUIZ_STORAGE_KEY = "fe-industrial-prep-active-quiz-v1";
  var EXPORT_SCHEMA_VERSION = 2;
  function slugify(value) {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }
  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }
  var TEST_MIX_KEYS = ["correct", "incorrect", "unanswered"];
  var SAFE_HTML_TAGS = /* @__PURE__ */ new Set([
    "a",
    "b",
    "br",
    "circle",
    "code",
    "dd",
    "defs",
    "div",
    "dl",
    "dt",
    "em",
    "g",
    "i",
    "li",
    "line",
    "marker",
    "ol",
    "p",
    "path",
    "polygon",
    "polyline",
    "pre",
    "rect",
    "small",
    "span",
    "strong",
    "sub",
    "sup",
    "svg",
    "table",
    "tbody",
    "td",
    "text",
    "tfoot",
    "th",
    "thead",
    "tr",
    "tspan",
    "u",
    "ul"
  ]);
  var SAFE_HTML_ATTRIBUTES = /* @__PURE__ */ new Set([
    "aria-hidden",
    "baseline-shift",
    "class",
    "cx",
    "cy",
    "d",
    "fill",
    "font-family",
    "font-size",
    "font-style",
    "font-weight",
    "height",
    "href",
    "id",
    "marker-end",
    "marker-start",
    "markerheight",
    "markerwidth",
    "opacity",
    "orient",
    "points",
    "r",
    "refx",
    "refy",
    "rel",
    "role",
    "scope",
    "stroke",
    "stroke-dasharray",
    "stroke-width",
    "style",
    "target",
    "text-anchor",
    "title",
    "transform",
    "viewbox",
    "width",
    "x",
    "x1",
    "x2",
    "xmlns",
    "y",
    "y1",
    "y2"
  ]);
  var URL_ATTRIBUTES = /* @__PURE__ */ new Set(["href"]);
  function isSafeAttributeValue(name, value) {
    const normalized = String(value).trim().replace(/[\u0000-\u001F\u007F\s]+/g, "").toLowerCase();
    if (URL_ATTRIBUTES.has(name)) {
      return normalized === "" || normalized.startsWith("#") || normalized.startsWith("http://") || normalized.startsWith("https://");
    }
    if (name === "style") {
      return !/expression\s*\(|url\s*\(|@import|javascript:/i.test(value);
    }
    return true;
  }
  function sanitizeHtml(rawHtml) {
    if (typeof rawHtml !== "string") return "";
    const template = document.createElement("template");
    template.innerHTML = rawHtml;
    template.content.querySelectorAll("*").forEach((node) => {
      const tagName = node.tagName.toLowerCase();
      if (!SAFE_HTML_TAGS.has(tagName)) {
        node.replaceWith(document.createTextNode(node.textContent || ""));
        return;
      }
      [...node.attributes].forEach((attribute) => {
        const name = attribute.name.toLowerCase();
        if (name.startsWith("on") || !SAFE_HTML_ATTRIBUTES.has(name) || !isSafeAttributeValue(name, attribute.value)) {
          node.removeAttribute(attribute.name);
        }
      });
      if (node.tagName.toLowerCase() === "a") {
        node.setAttribute("rel", "noreferrer");
      }
    });
    return template.innerHTML;
  }
  function SafeHtml({ as: Tag = "div", className, html }) {
    const safeHtml = useMemo(() => sanitizeHtml(html), [html]);
    return /* @__PURE__ */ React.createElement(Tag, { className, dangerouslySetInnerHTML: { __html: safeHtml } });
  }
  var FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
  function FocusTrap({ children, autoFocus = true, ...rest }) {
    const ref = useRef(null);
    useEffect(() => {
      const node = ref.current;
      if (!node) return void 0;
      const previouslyFocused = document.activeElement;
      const getFocusable = () => Array.from(node.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
        (el) => !el.hasAttribute("disabled") && el.getAttribute("aria-hidden") !== "true"
      );
      if (autoFocus) {
        const first = getFocusable()[0];
        (first || node).focus();
      }
      function handleKeyDown(event) {
        if (event.key !== "Tab") return;
        const items = getFocusable();
        if (!items.length) {
          event.preventDefault();
          node.focus();
          return;
        }
        const first = items[0];
        const last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
      node.addEventListener("keydown", handleKeyDown);
      return () => {
        node.removeEventListener("keydown", handleKeyDown);
        if (previouslyFocused && typeof previouslyFocused.focus === "function") {
          previouslyFocused.focus();
        }
      };
    }, [autoFocus]);
    return /* @__PURE__ */ React.createElement("div", { ref, tabIndex: -1, ...rest }, children);
  }
  function computeEstimatedScore(correct, answered) {
    if (!answered) return null;
    const accuracy = correct / answered;
    const confidence = Math.min(answered / 5, 1);
    return Math.round(accuracy * (0.35 + 0.65 * confidence) * 100);
  }
  function computePercentCorrect(correct, answered) {
    if (!answered) return null;
    return Math.round(correct / answered * 100);
  }
  function formatQuestionHeading(question, index) {
    const rawId = question.id || "";
    const hasGeneratedId = rawId.includes(":");
    if (!hasGeneratedId) return rawId || `Question ${index + 1}`;
    const sourceLabel = question.sourceSubtopic || question.officialSubtopic || "Practice Question";
    return `Question ${index + 1} \u2022 ${sourceLabel}`;
  }
  function ClearAnswerStamp({ disabled, onClick }) {
    const textPathId = `clear-answer-stamp-${useId().replace(/:/g, "")}`;
    return /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "clear-answer-stamp",
        onClick,
        disabled,
        "aria-label": "Clear answer"
      },
      /* @__PURE__ */ React.createElement("svg", { className: "clear-answer-stamp-svg", viewBox: "0 0 100 100", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("defs", null, /* @__PURE__ */ React.createElement("path", { id: textPathId, d: "M 22 50 A 28 28 0 0 1 78 50" })), /* @__PURE__ */ React.createElement("text", { className: "clear-answer-stamp-text" }, /* @__PURE__ */ React.createElement("textPath", { href: `#${textPathId}`, startOffset: "50%", textAnchor: "middle" }, "CLEAR ANSWER"))),
      /* @__PURE__ */ React.createElement("span", { className: "clear-answer-stamp-disc", "aria-hidden": "true" })
    );
  }
  function getRecommendationReason(metrics, questionCount) {
    if (metrics.score == null) return "Unassessed and ready for a quick baseline.";
    if (questionCount < 5) return "Low readiness, but question coverage is still thin.";
    if (metrics.score < 60) return "One of your weakest mapped areas with enough questions to improve fast.";
    return "Good place to build confidence with available question depth.";
  }
  var KNOWN_QUIZ_MODES = ["diagnostic", "topic-test", "review"];
  function normalizeQuizMode(mode) {
    return KNOWN_QUIZ_MODES.includes(mode) ? mode : "topic-test";
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
      lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  function normalizeDiagnosticAttempts(parsedAttempts = []) {
    if (!Array.isArray(parsedAttempts)) return [];
    return parsedAttempts.filter((attempt) => attempt && Array.isArray(attempt.questionIds)).map((attempt, index) => ({
      id: attempt.id || `diagnostic-${Date.now()}-${index}`,
      startedAt: attempt.startedAt || null,
      completedAt: attempt.completedAt || null,
      questionsPerTopic: Number.isFinite(attempt.questionsPerTopic) ? attempt.questionsPerTopic : 0,
      questionIds: attempt.questionIds.filter(Boolean),
      responses: attempt.responses && typeof attempt.responses === "object" ? Object.entries(attempt.responses).reduce((accumulator, [questionId, response]) => {
        if (typeof response?.wasCorrect === "boolean") {
          accumulator[questionId] = { wasCorrect: response.wasCorrect };
        }
        return accumulator;
      }, {}) : {},
      topicSummaries: attempt.topicSummaries && typeof attempt.topicSummaries === "object" ? Object.entries(attempt.topicSummaries).reduce((accumulator, [sectionId, summary]) => {
        accumulator[sectionId] = {
          answered: Number.isFinite(summary?.answered) ? summary.answered : 0,
          correct: Number.isFinite(summary?.correct) ? summary.correct : 0,
          score: computePercentCorrect(
            Number.isFinite(summary?.correct) ? summary.correct : 0,
            Number.isFinite(summary?.answered) ? summary.answered : 0
          )
        };
        return accumulator;
      }, {}) : {},
      answered: Number.isFinite(attempt.answered) ? attempt.answered : 0,
      correct: Number.isFinite(attempt.correct) ? attempt.correct : 0,
      score: computePercentCorrect(
        Number.isFinite(attempt.correct) ? attempt.correct : 0,
        Number.isFinite(attempt.answered) ? attempt.answered : 0
      )
    }));
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
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...progress, lastUpdated: (/* @__PURE__ */ new Date()).toISOString() }));
    } catch (error) {
      console.warn("Progress could not be saved locally.", error);
    }
  }
  function setProgressForQuestionResult(progress, question, nextWasCorrect) {
    if (!question || nextWasCorrect !== null && typeof nextWasCorrect !== "boolean") {
      return progress;
    }
    const next = structuredClone(progress);
    const previousResult = next.questionResults?.[question.id];
    const previousWasCorrect = typeof previousResult?.wasCorrect === "boolean" ? previousResult.wasCorrect : null;
    if (previousWasCorrect === nextWasCorrect) {
      return progress;
    }
    const topicEntry = next.topicProgress[question.sectionId] || { answered: 0, correct: 0 };
    const subtopicEntry = next.subtopicProgress[question.sectionId]?.[question.officialSubtopic] || { answered: 0, correct: 0 };
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
      ...next.subtopicProgress[question.sectionId] || {},
      [question.officialSubtopic]: subtopicEntry
    };
    if (nextWasCorrect == null) {
      const { [question.id]: _removedQuestionResult, ...remainingResults } = next.questionResults || {};
      next.questionResults = remainingResults;
    } else {
      next.questionResults = {
        ...next.questionResults || {},
        [question.id]: {
          wasCorrect: nextWasCorrect,
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
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
      accumulator[question.id] = typeof previous?.wasCorrect === "boolean" ? { wasCorrect: previous.wasCorrect, updatedAt: previous.updatedAt || null } : null;
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
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const responses = {};
    questions.forEach((question) => {
      responses[question.id] = {
        ...normalizeQuizResponse(question),
        ...initialResponses?.[question.id] || {}
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
      baselineResults[questionId] = typeof incoming?.wasCorrect === "boolean" ? { wasCorrect: incoming.wasCorrect, updatedAt: incoming.updatedAt || null } : null;
    });
    return {
      id: rawSession.id || `${Date.now()}-${slugify(`${rawSession.mode || "quiz"}-${rawSession.title || "session"}`)}`,
      mode: normalizeQuizMode(rawSession.mode),
      title: rawSession.title || "Saved quiz",
      subtitle: rawSession.subtitle || "",
      sectionId: rawSession.sectionId || null,
      officialSubtopic: rawSession.officialSubtopic || null,
      status: rawSession.status === "complete" ? "complete" : "in-progress",
      currentIndex: clamp(rawSession.currentIndex || 0, 0, validQuestionIds.length),
      questionIds: validQuestionIds,
      baselineResults,
      requestedMix: rawSession.requestedMix && typeof rawSession.requestedMix === "object" ? TEST_MIX_KEYS.reduce((accumulator, key) => {
        if (typeof rawSession.requestedMix[key] === "number") {
          accumulator[key] = rawSession.requestedMix[key];
        }
        return accumulator;
      }, {}) : null,
      poolAvailability: rawSession.poolAvailability && typeof rawSession.poolAvailability === "object" ? TEST_MIX_KEYS.reduce((accumulator, key) => {
        if (typeof rawSession.poolAvailability[key] === "number") {
          accumulator[key] = rawSession.poolAvailability[key];
        }
        return accumulator;
      }, {}) : null,
      showPriorResults: rawSession.showPriorResults !== false,
      diagnosticMeta: rawSession.diagnosticMeta && typeof rawSession.diagnosticMeta === "object" ? {
        questionsPerTopic: Number.isFinite(rawSession.diagnosticMeta.questionsPerTopic) ? rawSession.diagnosticMeta.questionsPerTopic : 0,
        estimatedTotal: Number.isFinite(rawSession.diagnosticMeta.estimatedTotal) ? rawSession.diagnosticMeta.estimatedTotal : 0
      } : null,
      returnTarget: normalizeReturnTarget(rawSession.returnTarget),
      responses,
      startedAt: rawSession.startedAt || (/* @__PURE__ */ new Date()).toISOString(),
      completedAt: rawSession.completedAt || null,
      lastUpdated: rawSession.lastUpdated || (/* @__PURE__ */ new Date()).toISOString()
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
      exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
      progress: {
        ...progress,
        lastUpdated: progress.lastUpdated || (/* @__PURE__ */ new Date()).toISOString()
      },
      activeQuiz: activeQuiz ? {
        ...activeQuiz,
        lastUpdated: activeQuiz.lastUpdated || (/* @__PURE__ */ new Date()).toISOString()
      } : null
    };
  }
  function extractImportedProgress(data, parsed) {
    if (parsed?.progress && typeof parsed.progress === "object") {
      return normalizeProgress(data, parsed.progress);
    }
    return normalizeProgress(data, parsed);
  }
  function extractImportedQuiz(parsed, questionsById) {
    if (parsed?.activeQuiz !== void 0) {
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
    try {
      if (!activeQuiz) {
        localStorage.removeItem(ACTIVE_QUIZ_STORAGE_KEY);
        return;
      }
      localStorage.setItem(
        ACTIVE_QUIZ_STORAGE_KEY,
        JSON.stringify({ ...activeQuiz, lastUpdated: (/* @__PURE__ */ new Date()).toISOString() })
      );
    } catch (error) {
      console.warn("Active quiz could not be saved locally.", error);
    }
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
      completedAt: (/* @__PURE__ */ new Date()).toISOString(),
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
      return new Intl.DateTimeFormat(void 0, {
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
  function renderMath(target) {
    if (!window.MathJax?.typesetPromise) return;
    const nodes = target ? [target] : void 0;
    if (window.MathJax.typesetClear && nodes) {
      window.MathJax.typesetClear(nodes);
    }
    window.MathJax.typesetPromise(nodes).catch(() => {
    });
  }
  function isValidQuizData(data) {
    if (!data || typeof data !== "object") return false;
    if (typeof data.exam !== "string" || !data.exam.trim()) return false;
    if (!data.coverageReport || typeof data.coverageReport !== "object") return false;
    if (!Number.isFinite(data.coverageReport.mappedQuestionCount)) return false;
    if (!Number.isFinite(data.coverageReport.unmatchedQuestionCount)) return false;
    if (!Array.isArray(data.sections) || !Array.isArray(data.questions)) return false;
    const sectionIds = /* @__PURE__ */ new Set();
    const sectionsAreValid = data.sections.every((section) => {
      if (!section || typeof section !== "object") return false;
      if (typeof section.id !== "string" || !section.id.trim()) return false;
      if (typeof section.title !== "string" || !section.title.trim()) return false;
      if (typeof section.questionRange !== "string" && typeof section.questionRange !== "number") return false;
      if (!Array.isArray(section.subtopicCoverage)) return false;
      sectionIds.add(section.id);
      return section.subtopicCoverage.every(
        (subtopic) => subtopic && typeof subtopic === "object" && typeof subtopic.name === "string" && subtopic.name.trim() && Number.isFinite(subtopic.count)
      );
    });
    if (!sectionsAreValid || !sectionIds.size) return false;
    return data.questions.every((question) => {
      if (!question || typeof question !== "object") return false;
      if (typeof question.id !== "string" || !question.id.trim()) return false;
      if (!sectionIds.has(question.sectionId)) return false;
      if (typeof question.officialSubtopic !== "string" || !question.officialSubtopic.trim()) return false;
      if (typeof question.stem !== "string" || !question.stem.trim()) return false;
      if (question.type === "mcq") {
        return question.choices && typeof question.choices === "object" && !Array.isArray(question.choices) && typeof question.answer === "string" && Object.prototype.hasOwnProperty.call(question.choices, question.answer);
      }
      if (question.type === "open") {
        return typeof question.answer === "string";
      }
      return false;
    });
  }
  function DataLoadError() {
    return /* @__PURE__ */ React.createElement("main", { className: "app-shell" }, /* @__PURE__ */ React.createElement("section", { className: "answer-panel" }, /* @__PURE__ */ React.createElement("h1", null, "Question data could not be loaded."), /* @__PURE__ */ React.createElement("p", { className: "muted" }, "Refresh the page, or check that ", /* @__PURE__ */ React.createElement("code", null, "data/app-data.js"), " is available next to this app.")));
  }
  function App() {
    const data = window.FEQuizData;
    if (!isValidQuizData(data)) {
      return /* @__PURE__ */ React.createElement(DataLoadError, null);
    }
    return /* @__PURE__ */ React.createElement(QuizApp, { data });
  }
  function QuizApp({ data }) {
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
    const latestProgressRef = useRef(progress);
    const latestActiveQuizRef = useRef(activeQuiz);
    latestProgressRef.current = progress;
    latestActiveQuizRef.current = activeQuiz;
    useEffect(() => {
      const timer = setTimeout(() => persistProgress(progress), 400);
      return () => clearTimeout(timer);
    }, [progress]);
    useEffect(() => {
      const timer = setTimeout(() => persistActiveQuiz(activeQuiz), 400);
      return () => clearTimeout(timer);
    }, [activeQuiz]);
    useEffect(() => {
      function flush() {
        persistProgress(latestProgressRef.current);
        persistActiveQuiz(latestActiveQuizRef.current);
      }
      window.addEventListener("pagehide", flush);
      window.addEventListener("visibilitychange", flush);
      return () => {
        window.removeEventListener("pagehide", flush);
        window.removeEventListener("visibilitychange", flush);
      };
    }, []);
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
      return data.sections.map((section) => {
        const metrics = getSectionMetrics(section, progress);
        const questionCount = questionsBySection[section.id]?.length || 0;
        return { section, metrics, questionCount };
      }).filter((entry) => entry.questionCount > 0).sort((left, right) => {
        const leftScore = left.metrics.score == null ? -1 : left.metrics.score;
        const rightScore = right.metrics.score == null ? -1 : right.metrics.score;
        return leftScore - rightScore;
      }).slice(0, 3);
    }, [data.sections, progress, questionsBySection]);
    const activeQuizSummary = useMemo(() => getActiveQuizSummary(activeQuiz), [activeQuiz]);
    const diagnosticHistory = useMemo(
      () => [...progress.diagnosticAttempts || []].sort((left, right) => new Date(right.completedAt || 0) - new Date(left.completedAt || 0)),
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
    function reviewCompletedQuiz() {
      if (!activeQuiz || activeQuiz.status !== "complete") return;
      setActiveQuiz((current) => {
        if (!current || current.status !== "complete") return current;
        return {
          ...current,
          mode: "review",
          title: `${current.title} review`,
          subtitle: "Review this completed quiz and update any saved marks.",
          status: "in-progress",
          currentIndex: 0,
          returnTarget: { type: "dashboard" },
          showPriorResults: true,
          lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
        };
      });
      setTopicModalSectionId(null);
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
        setTestSetupDialog(
          (current) => current ? {
            ...current,
            availability,
            mixInputs: sanitizeMixInputs(current.mixInputs, availability)
          } : current
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
        setDiagnosticSetupDialog(
          (current) => current ? {
            ...current,
            questionsPerTopicInput: questionsPerTopic ? String(questionsPerTopic) : "",
            estimatedTotal: 0
          } : current
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
          completedAt: (/* @__PURE__ */ new Date()).toISOString(),
          lastUpdated: (/* @__PURE__ */ new Date()).toISOString(),
          responses: { ...current.responses }
        };
      });
      if (activeQuiz.mode === "diagnostic") {
        const diagnosticAttempt = summarizeDiagnosticAttempt(activeQuiz, questionsById);
        setProgress((current) => ({
          ...current,
          completedDiagnostic: true,
          diagnosticAttempts: [...current.diagnosticAttempts || [], diagnosticAttempt]
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
          lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
        };
      });
    }
    function updateQuizResponse(questionId, patch) {
      const question = questionsById[questionId];
      setActiveQuiz((current) => {
        if (!current) return current;
        return {
          ...current,
          responses: {
            ...current.responses,
            [questionId]: {
              ...current.responses[questionId] || {},
              ...patch
            }
          },
          lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
        };
      });
      if (question && typeof patch.wasCorrect === "boolean") {
        setProgress((current) => updateProgressForQuestion(current, question, patch.wasCorrect));
      }
    }
    function gradeQuizQuestion(question, wasCorrect) {
      updateQuizResponse(question.id, { wasCorrect });
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
          lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
        };
      });
      setProgress((current) => setProgressForQuestionResult(current, question, baselineWasCorrect));
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
      if (!isResetDialogOpen) return void 0;
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
          setResetDialogSelection((current) => current === "keep" ? "reset" : "keep");
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
      if (!isResetDialogOpen) return void 0;
      const selectedButton = resetDialogSelection === "keep" ? keepProgressButtonRef.current : resetEverythingButtonRef.current;
      selectedButton?.focus();
      return void 0;
    }, [isResetDialogOpen, resetDialogSelection]);
    function openResetDialog() {
      setResetDialogSelection("keep");
      setIsResetDialogOpen(true);
    }
    useEffect(() => {
      if (!quizActionDialog) return void 0;
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
      if (!testSetupDialog) return void 0;
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
      if (!diagnosticSetupDialog) return void 0;
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
      if (!topicModalSectionId || view.name === "session") return void 0;
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
    const showReviewButton = activeQuiz?.status === "complete";
    const configuredQuestionTotal = testSetupDialog ? TEST_MIX_KEYS.reduce(
      (sum, key) => sum + clampMixCount(testSetupDialog.mixInputs?.[key], testSetupDialog.availability[key]),
      0
    ) : 0;
    return /* @__PURE__ */ React.createElement("div", { className: `app-shell ${view.name === "session" && isTestMode(activeQuiz?.mode) ? "app-shell-session" : ""}` }, /* @__PURE__ */ React.createElement("a", { className: "skip-link", href: "#main-content" }, "Skip to main content"), !(view.name === "session" && isTestMode(activeQuiz?.mode)) ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("header", { className: "app-topbar" }, /* @__PURE__ */ React.createElement("div", { className: "app-topbar-brand" }, /* @__PURE__ */ React.createElement("div", { className: "brand-mark" }, "FE"), /* @__PURE__ */ React.createElement("span", { className: "brand-name" }, "FEStudy"), /* @__PURE__ */ React.createElement("span", { className: "brand-tag" }, data.exam)), /* @__PURE__ */ React.createElement("div", { className: "app-topbar-actions" }, /* @__PURE__ */ React.createElement("button", { className: "topbar-link", onClick: handleExportProgress }, "Export progress"), /* @__PURE__ */ React.createElement("button", { className: "topbar-link", onClick: handleImportClick }, "Import"), /* @__PURE__ */ React.createElement("button", { className: "topbar-link is-reset", onClick: openResetDialog }, "Reset"), /* @__PURE__ */ React.createElement("input", { className: "file-input", type: "file", accept: "application/json", ref: fileInputRef, onChange: handleImportProgress }), /* @__PURE__ */ React.createElement("div", { className: "topbar-divider" }), /* @__PURE__ */ React.createElement("div", { className: "topbar-avatar" }, "FE"))), /* @__PURE__ */ React.createElement("div", { className: "app-main" }, /* @__PURE__ */ React.createElement("div", { className: "fe-hero" }, /* @__PURE__ */ React.createElement("div", { className: "fe-hero-copy" }, /* @__PURE__ */ React.createElement("div", { className: "fe-hero-head" }, /* @__PURE__ */ React.createElement("h1", null, "Build your readiness for the FE exam."), /* @__PURE__ */ React.createElement("p", null, "Diagnose weak areas, drill focused practice, and watch your coverage climb \u2014 all from this one page.")), /* @__PURE__ */ React.createElement("div", { className: "fe-hero-actions" }, /* @__PURE__ */ React.createElement("button", { className: "button button-lg", onClick: startDiagnostic }, hasCompletedDiagnostic ? "Retake diagnostic" : "Take diagnostic"), activeQuiz ? /* @__PURE__ */ React.createElement("div", { className: "resume-chip" }, /* @__PURE__ */ React.createElement("span", { className: "resume-dot" }), /* @__PURE__ */ React.createElement("span", { className: "resume-text" }, activeQuiz.status === "in-progress" ? "Saved quiz" : "Completed quiz", " \u2014 ", activeQuiz.title, " \xB7 ", activeQuizSummary?.answeredCount || 0, "/", activeQuizSummary?.questionCount || 0, " graded"), showResumeButton || showReviewButton ? /* @__PURE__ */ React.createElement(
      "button",
      {
        className: "resume-btn",
        onClick: showResumeButton ? resumeQuiz : reviewCompletedQuiz
      },
      showReviewButton ? "Review" : "Resume"
    ) : null) : null)), /* @__PURE__ */ React.createElement("div", { className: "fe-score-card" }, /* @__PURE__ */ React.createElement("div", { className: "fe-score-top" }, /* @__PURE__ */ React.createElement("span", { className: "fe-score-label" }, "Estimated overall"), /* @__PURE__ */ React.createElement("div", { className: "fe-score-value-row" }, /* @__PURE__ */ React.createElement("span", { className: "fe-score-value" }, overall.score == null ? "\u2014" : `${overall.score}%`), /* @__PURE__ */ React.createElement("span", { className: "fe-score-sub" }, "early estimate")), /* @__PURE__ */ React.createElement("div", { className: "fe-score-track" }, /* @__PURE__ */ React.createElement("div", { className: "fe-score-fill", style: { width: `${overall.score || 0}%` } }))), /* @__PURE__ */ React.createElement("div", { className: "fe-score-stats" }, /* @__PURE__ */ React.createElement("div", { className: "fe-score-stat" }, /* @__PURE__ */ React.createElement("span", { className: "fe-score-num" }, overall.answered), /* @__PURE__ */ React.createElement("span", { className: "fe-score-cap" }, "questions answered")), /* @__PURE__ */ React.createElement("div", { className: "fe-score-stat" }, /* @__PURE__ */ React.createElement("span", { className: "fe-score-num" }, overall.topicsAssessed, /* @__PURE__ */ React.createElement("span", { className: "fe-score-num-sub" }, "/", data.sections.length)), /* @__PURE__ */ React.createElement("span", { className: "fe-score-cap" }, "topics assessed"))), /* @__PURE__ */ React.createElement("p", { className: "fe-score-note" }, "Answer 10+ questions in a topic to unlock its real score."))), recommendations.length ? /* @__PURE__ */ React.createElement("div", { className: "focus-strip" }, /* @__PURE__ */ React.createElement("div", { className: "focus-strip-head" }, /* @__PURE__ */ React.createElement("span", { className: "focus-strip-eyebrow" }, "Study next"), /* @__PURE__ */ React.createElement("span", { className: "focus-strip-title" }, "Recommended focus: ", recommendations[0].section.title)), /* @__PURE__ */ React.createElement("span", { className: "focus-strip-body" }, getRecommendationReason(recommendations[0].metrics, recommendations[0].questionCount)), /* @__PURE__ */ React.createElement(
      "button",
      {
        className: "button dark-button",
        onClick: () => startTopicPractice(recommendations[0].section.id),
        disabled: recommendations[0].questionCount === 0
      },
      "Start 10-question check"
    )) : null, view.name === "dashboard" ? /* @__PURE__ */ React.createElement(
      Dashboard,
      {
        data,
        progress,
        diagnosticHistory,
        questionsBySection,
        recommendations,
        activeQuiz,
        onResumeQuiz: resumeQuiz,
        onReviewCompletedQuiz: reviewCompletedQuiz,
        onStartDiagnostic: startDiagnostic,
        onOpenTopic: openTopicModal,
        onStartPractice: startTopicPractice
      }
    ) : null, /* @__PURE__ */ React.createElement("div", { className: "footer-note dashboard-footer-note" }, "Mapped questions: ", data.coverageReport.mappedQuestionCount, ". Unmatched source questions:", " ", data.coverageReport.unmatchedQuestionCount, ". Topics with low coverage can still track progress, but they may need more source material later."))) : null, view.name === "session" && isTestMode(activeQuiz?.mode) ? /* @__PURE__ */ React.createElement(
      QuizSessionView,
      {
        activeQuiz,
        questionsById,
        isResetDialogOpen,
        isQuizActionDialogOpen: !!quizActionDialog,
        onRequestLeave: openLeaveQuizDialog,
        onRequestSubmit: openSubmitQuizDialog,
        onSetIndex: updateQuizIndex,
        onUpdateResponse: updateQuizResponse,
        onGrade: gradeQuizQuestion,
        onClearQuestion: clearQuizQuestion
      }
    ) : null, topicModalSectionId && view.name !== "session" ? /* @__PURE__ */ React.createElement("div", { className: "topic-modal-backdrop", onClick: closeTopicModal }, /* @__PURE__ */ React.createElement(
      FocusTrap,
      {
        className: "topic-modal-shell",
        role: "dialog",
        "aria-modal": "true",
        "aria-labelledby": "topic-modal-title",
        onClick: (event) => event.stopPropagation()
      },
      /* @__PURE__ */ React.createElement(
        TopicDetail,
        {
          section: data.sections.find((entry) => entry.id === topicModalSectionId),
          progress,
          questionCount: questionsBySection[topicModalSectionId]?.length || 0,
          activeQuiz,
          onResumeQuiz: resumeQuiz,
          onClose: closeTopicModal,
          onPractice: (sectionId, officialSubtopic = null) => startTopicPractice(sectionId, officialSubtopic, { type: "topic-modal", sectionId: topicModalSectionId }),
          onReviewTopic: (sectionId) => openTopicReview(sectionId, { type: "topic-modal", sectionId })
        }
      )
    )) : null, isResetDialogOpen ? /* @__PURE__ */ React.createElement("div", { className: "dialog-backdrop", onClick: () => setIsResetDialogOpen(false) }, /* @__PURE__ */ React.createElement(
      FocusTrap,
      {
        autoFocus: false,
        className: "dialog-card",
        role: "dialog",
        "aria-modal": "true",
        "aria-labelledby": "reset-progress-title",
        "aria-describedby": "reset-progress-description",
        onClick: (event) => event.stopPropagation()
      },
      /* @__PURE__ */ React.createElement("div", { className: "mini-label" }, "Progress reset"),
      /* @__PURE__ */ React.createElement("h2", { id: "reset-progress-title", className: "dialog-title" }, "Clear all saved progress for this browser?"),
      /* @__PURE__ */ React.createElement("p", { id: "reset-progress-description", className: "sidebar-note", style: { marginTop: 0 } }, "This will wipe your topic scores, answered-question history, saved diagnostic history, diagnostic status, and any saved quiz session for this device only."),
      /* @__PURE__ */ React.createElement("div", { className: "toolbar dialog-actions" }, /* @__PURE__ */ React.createElement(
        "button",
        {
          ref: keepProgressButtonRef,
          className: `button-ghost dialog-option ${resetDialogSelection === "keep" ? "is-selected" : ""}`,
          onMouseEnter: () => setResetDialogSelection("keep"),
          onFocus: () => setResetDialogSelection("keep"),
          onClick: () => setIsResetDialogOpen(false)
        },
        "Keep my progress"
      ), /* @__PURE__ */ React.createElement(
        "button",
        {
          ref: resetEverythingButtonRef,
          className: `button button-danger dialog-option ${resetDialogSelection === "reset" ? "is-selected" : ""}`,
          onMouseEnter: () => setResetDialogSelection("reset"),
          onFocus: () => setResetDialogSelection("reset"),
          onClick: resetProgress
        },
        "Reset everything"
      ))
    )) : null, quizActionDialog && activeQuiz ? /* @__PURE__ */ React.createElement("div", { className: "dialog-backdrop", onClick: closeQuizActionDialog }, /* @__PURE__ */ React.createElement(
      FocusTrap,
      {
        className: "dialog-card",
        role: "dialog",
        "aria-modal": "true",
        "aria-labelledby": "quiz-action-title",
        "aria-describedby": "quiz-action-description",
        onClick: (event) => event.stopPropagation()
      },
      /* @__PURE__ */ React.createElement("div", { className: "mini-label" }, quizActionDialog.type === "leave" ? activeQuiz.mode === "review" ? "Leave review" : "Leave quiz" : activeQuiz.mode === "review" ? "Finish review" : "Submit quiz"),
      /* @__PURE__ */ React.createElement("h2", { id: "quiz-action-title", className: "dialog-title" }, quizActionDialog.type === "leave" ? getLeaveDialogTitle(activeQuiz) : activeQuiz.mode === "review" ? "Finish this review now?" : quizActionDialog.unansweredCount ? "Submit and leave unanswered questions unrecorded?" : "Submit this quiz now?"),
      /* @__PURE__ */ React.createElement("p", { id: "quiz-action-description", className: "sidebar-note", style: { marginTop: 0 } }, quizActionDialog.type === "leave" ? getLeaveDialogDescription(activeQuiz) : activeQuiz.mode === "review" ? "Any changes you made to right or wrong marks are already saved. Finishing review just closes out this review session." : quizActionDialog.unansweredCount ? `${quizActionDialog.unansweredCount} unanswered question${quizActionDialog.unansweredCount === 1 ? "" : "s"} will be left unrecorded when you submit this test.` : "We\u2019ll save this quiz as complete and keep every graded result in your browser progress."),
      /* @__PURE__ */ React.createElement("div", { className: "toolbar dialog-actions quiz-action-dialog-actions" }, quizActionDialog.type === "leave" ? /* @__PURE__ */ React.createElement("div", { className: "quiz-action-leave-layout" }, /* @__PURE__ */ React.createElement("button", { className: "button dialog-option quiz-action-save-button", onClick: saveProgressAndLeaveQuiz }, "Save progress and leave"), /* @__PURE__ */ React.createElement("div", { className: "quiz-action-secondary-row" }, /* @__PURE__ */ React.createElement("button", { className: "button-ghost dialog-option quiz-action-keep-button", onClick: closeQuizActionDialog }, "Keep testing"), /* @__PURE__ */ React.createElement("button", { className: "button-ghost dialog-option quiz-action-discard-button", onClick: discardQuizAndLeave }, "Discard results and leave"))) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { className: "button-ghost dialog-option", onClick: closeQuizActionDialog }, "Keep testing"), /* @__PURE__ */ React.createElement("button", { className: "button dialog-option", onClick: submitQuiz }, "Confirm submit")))
    )) : null, testSetupDialog ? /* @__PURE__ */ React.createElement("div", { className: "dialog-backdrop", onClick: closeTestSetupDialog }, /* @__PURE__ */ React.createElement(
      FocusTrap,
      {
        className: "dialog-card test-setup-dialog",
        role: "dialog",
        "aria-modal": "true",
        "aria-labelledby": "test-setup-title",
        "aria-describedby": "test-setup-description",
        onClick: (event) => event.stopPropagation()
      },
      /* @__PURE__ */ React.createElement("div", { className: "mini-label" }, getQuizModeLabel(testSetupDialog.mode)),
      /* @__PURE__ */ React.createElement("h2", { id: "test-setup-title", className: "dialog-title" }, "Build your question mix"),
      /* @__PURE__ */ React.createElement("p", { id: "test-setup-description", className: "sidebar-note", style: { marginTop: 0 } }, testSetupDialog.title, " lets you pull from the questions you previously got right, previously missed, or have not attempted yet."),
      /* @__PURE__ */ React.createElement("div", { className: "test-setup-summary" }, /* @__PURE__ */ React.createElement("strong", null, testSetupDialog.title), /* @__PURE__ */ React.createElement("span", { className: "muted" }, testSetupDialog.subtitle)),
      /* @__PURE__ */ React.createElement("div", { className: "test-mix-grid" }, TEST_MIX_KEYS.map((key) => /* @__PURE__ */ React.createElement("label", { key, className: "test-mix-row" }, /* @__PURE__ */ React.createElement("span", { className: "test-mix-label" }, key.charAt(0).toUpperCase() + key.slice(1)), /* @__PURE__ */ React.createElement("div", { className: "test-mix-input-wrap" }, /* @__PURE__ */ React.createElement(
        "input",
        {
          className: "test-mix-input",
          inputMode: "numeric",
          pattern: "[0-9]*",
          value: testSetupDialog.mixInputs?.[key] ?? "",
          onChange: (event) => updateTestSetupMixInput(key, event.target.value),
          onBlur: () => clampTestSetupMixInput(key)
        }
      ), /* @__PURE__ */ React.createElement("span", { className: "test-mix-cap" }, "/ ", testSetupDialog.availability[key], " questions"))))),
      /* @__PURE__ */ React.createElement("div", { className: "test-setup-total" }, /* @__PURE__ */ React.createElement("span", { className: "mini-label" }, "Total questions selected"), /* @__PURE__ */ React.createElement("strong", null, configuredQuestionTotal)),
      /* @__PURE__ */ React.createElement("div", { className: "toolbar dialog-actions test-setup-actions" }, /* @__PURE__ */ React.createElement("button", { className: "button-ghost dialog-option", onClick: closeTestSetupDialog }, "Cancel"), /* @__PURE__ */ React.createElement("button", { className: "button dialog-option", onClick: startConfiguredTest, disabled: configuredQuestionTotal === 0 }, "Start test"))
    )) : null, diagnosticSetupDialog ? /* @__PURE__ */ React.createElement("div", { className: "dialog-backdrop", onClick: closeDiagnosticSetupDialog }, /* @__PURE__ */ React.createElement(
      FocusTrap,
      {
        className: "dialog-card test-setup-dialog diagnostic-setup-dialog",
        role: "dialog",
        "aria-modal": "true",
        "aria-labelledby": "diagnostic-setup-title",
        "aria-describedby": "diagnostic-setup-description",
        onClick: (event) => event.stopPropagation()
      },
      /* @__PURE__ */ React.createElement("div", { className: "mini-label" }, "Diagnostic setup"),
      /* @__PURE__ */ React.createElement("h2", { id: "diagnostic-setup-title", className: "dialog-title" }, "Build a balanced diagnostic"),
      /* @__PURE__ */ React.createElement("p", { id: "diagnostic-setup-description", className: "sidebar-note", style: { marginTop: 0 } }, "Choose how many questions to pull from each topic. We\u2019ll prefer unanswered questions first, then recycle previously answered ones only when needed."),
      /* @__PURE__ */ React.createElement("div", { className: "test-setup-summary diagnostic-setup-summary" }, /* @__PURE__ */ React.createElement("strong", null, diagnosticSetupDialog.title), /* @__PURE__ */ React.createElement("span", { className: "muted" }, diagnosticSetupDialog.subtitle)),
      /* @__PURE__ */ React.createElement("label", { className: "test-mix-row diagnostic-input-row" }, /* @__PURE__ */ React.createElement("span", { className: "test-mix-label" }, "Questions per topic"), /* @__PURE__ */ React.createElement("div", { className: "test-mix-input-wrap" }, /* @__PURE__ */ React.createElement(
        "input",
        {
          className: "test-mix-input",
          inputMode: "numeric",
          pattern: "[0-9]*",
          value: diagnosticSetupDialog.questionsPerTopicInput,
          onChange: (event) => updateDiagnosticQuestionsPerTopicInput(event.target.value),
          onBlur: clampDiagnosticQuestionsPerTopicInput
        }
      ), /* @__PURE__ */ React.createElement("span", { className: "test-mix-cap" }, "Across ", diagnosticSetupDialog.sectionAvailability.length, " mapped topics"))),
      /* @__PURE__ */ React.createElement("div", { className: "test-setup-total diagnostic-estimate-total" }, /* @__PURE__ */ React.createElement("span", { className: "mini-label" }, "Estimated total questions"), /* @__PURE__ */ React.createElement("strong", null, diagnosticSetupDialog.estimatedTotal)),
      /* @__PURE__ */ React.createElement("div", { className: "diagnostic-topic-count" }, diagnosticSetupDialog.sectionAvailability.filter((section) => section.totalAvailable > 0).length, " topics currently have mapped questions available for the diagnostic pool."),
      /* @__PURE__ */ React.createElement("div", { className: "toolbar dialog-actions test-setup-actions" }, /* @__PURE__ */ React.createElement("button", { className: "button-ghost dialog-option", onClick: closeDiagnosticSetupDialog }, "Cancel"), /* @__PURE__ */ React.createElement(
        "button",
        {
          className: "button dialog-option",
          onClick: startConfiguredDiagnostic,
          disabled: diagnosticSetupDialog.estimatedTotal === 0
        },
        "Start diagnostic"
      ))
    )) : null);
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
      details.push(/* @__PURE__ */ React.createElement("span", { key: "right", className: "score-good" }, correct, " right"));
    }
    if (wrong > 0) {
      details.push(/* @__PURE__ */ React.createElement("span", { key: "wrong", className: "score-bad" }, wrong, " wrong"));
    }
    return /* @__PURE__ */ React.createElement(React.Fragment, null, answered, " answered", details.length ? ": " : "", details.map((detail, index) => /* @__PURE__ */ React.createElement(React.Fragment, { key: detail.key || index }, index > 0 ? ", " : "", detail)));
  }
  function Dashboard({
    data,
    progress,
    diagnosticHistory,
    questionsBySection,
    recommendations,
    activeQuiz,
    onResumeQuiz,
    onReviewCompletedQuiz,
    onOpenTopic,
    onStartPractice,
    onStartDiagnostic
  }) {
    const [expandedSections, setExpandedSections] = useState({});
    function toggleSection(sectionId) {
      setExpandedSections((current) => ({ ...current, [sectionId]: !current[sectionId] }));
    }
    return /* @__PURE__ */ React.createElement("div", { className: "knowledge" }, /* @__PURE__ */ React.createElement("div", { className: "knowledge-head" }, /* @__PURE__ */ React.createElement("h2", { className: "knowledge-title" }, "Knowledge areas"), /* @__PURE__ */ React.createElement("span", { className: "knowledge-sub" }, data.sections.length, " topics \xB7 ordered by blueprint weight \xB7 click to expand")), /* @__PURE__ */ React.createElement("div", { className: "ka-list" }, data.sections.map((section) => {
      const metrics = getSectionMetrics(section, progress);
      const questionCount = questionsBySection[section.id]?.length || 0;
      const isExpanded = !!expandedSections[section.id];
      const answered = metrics.answered || 0;
      const inProgress = answered > 0 && !metrics.isScoreVisible;
      const statusText = metrics.isScoreVisible ? `${metrics.score}% correct` : inProgress ? "In progress" : "Unassessed";
      const statusColor = metrics.isScoreVisible ? "#4c7a3f" : inProgress ? "#9a6a1e" : "#8a8468";
      const barColor = inProgress ? "var(--orange)" : "var(--accent)";
      const barWidth = metrics.isScoreVisible ? `${metrics.score || 0}%` : inProgress ? `${clamp(answered / 10 * 34, 6, 34)}%` : "0%";
      const canResumeSectionQuiz = activeQuiz?.status === "in-progress" && activeQuiz.sectionId === section.id;
      return /* @__PURE__ */ React.createElement("article", { key: section.id, className: `ka-card ${isExpanded ? "is-open" : ""}` }, /* @__PURE__ */ React.createElement("div", { className: "ka-row", onClick: () => toggleSection(section.id) }, /* @__PURE__ */ React.createElement("div", { className: "ka-titlecol" }, /* @__PURE__ */ React.createElement("span", { className: "ka-name" }, section.title), /* @__PURE__ */ React.createElement("span", { className: "ka-blueprint" }, "Blueprint ", section.questionRange, " questions")), /* @__PURE__ */ React.createElement("div", { className: "ka-barwrap" }, /* @__PURE__ */ React.createElement("div", { className: "ka-bar" }, /* @__PURE__ */ React.createElement("div", { className: "ka-bar-fill", style: { width: barWidth, background: barColor } })), /* @__PURE__ */ React.createElement("span", { className: "ka-status", style: { color: statusColor } }, statusText)), /* @__PURE__ */ React.createElement("span", { className: "ka-mapped" }, questionCount, " mapped \xB7 ", answered, " answered"), /* @__PURE__ */ React.createElement("span", { className: "ka-chevron" }, isExpanded ? "\u2212" : "+")), isExpanded ? /* @__PURE__ */ React.createElement("div", { className: "ka-expand" }, /* @__PURE__ */ React.createElement("div", { className: "ka-expand-actions" }, /* @__PURE__ */ React.createElement("button", { className: "button", onClick: () => onStartPractice(section.id), disabled: questionCount === 0 }, "Generate quiz \u2014 whole topic"), /* @__PURE__ */ React.createElement("button", { className: "button-ghost", onClick: () => onOpenTopic(section.id) }, "Browse questions"), canResumeSectionQuiz ? /* @__PURE__ */ React.createElement("button", { className: "button-ghost", onClick: onResumeQuiz }, "Resume quiz") : null), /* @__PURE__ */ React.createElement("div", { className: "ka-subgrid" }, section.subtopicCoverage.map((subtopic) => {
        const subMetrics = getSubtopicMetrics(progress, section.id, subtopic.name);
        return /* @__PURE__ */ React.createElement("div", { key: subtopic.name, className: "ka-sub" }, /* @__PURE__ */ React.createElement("div", { className: "ka-sub-meta" }, /* @__PURE__ */ React.createElement("span", { className: "ka-sub-name" }, subtopic.name), /* @__PURE__ */ React.createElement("span", { className: "ka-sub-count" }, subtopic.count, " mapped questions", subMetrics.isScoreVisible ? ` \xB7 ${subMetrics.score}% correct` : "")), /* @__PURE__ */ React.createElement(
          "button",
          {
            className: "ka-sub-btn",
            onClick: () => onStartPractice(section.id, subtopic.name),
            disabled: subtopic.count === 0
          },
          "Quiz this"
        ));
      }))) : null);
    })), /* @__PURE__ */ React.createElement("div", { className: "ka-extras" }, /* @__PURE__ */ React.createElement("div", { className: "extra-card" }, /* @__PURE__ */ React.createElement("div", { className: "mini-label" }, "How scoring works"), /* @__PURE__ */ React.createElement("p", { className: "sidebar-note" }, "Topic bars unlock after you answer 10 questions in that topic. Subtopic scores appear after your first answered question there, and every percentage is shown as raw percent correct.")), /* @__PURE__ */ React.createElement("div", { className: "extra-card" }, /* @__PURE__ */ React.createElement("div", { className: "mini-label" }, "Diagnostic history"), diagnosticHistory.length ? /* @__PURE__ */ React.createElement("div", { className: "stack diagnostic-history-list" }, diagnosticHistory.map((attempt) => /* @__PURE__ */ React.createElement("div", { key: attempt.id, className: "extra-history-row" }, /* @__PURE__ */ React.createElement("div", { className: "card-row" }, /* @__PURE__ */ React.createElement("strong", null, formatDiagnosticAttemptDate(attempt.completedAt)), /* @__PURE__ */ React.createElement("span", { className: "pill subtle" }, attempt.score == null ? "Ungraded" : `${attempt.score}% correct`)), /* @__PURE__ */ React.createElement("p", { className: "muted", style: { margin: "4px 0 0" } }, attempt.questionsPerTopic, " per topic \xB7 ", attempt.correct, " correct of ", attempt.answered || 0, " graded")))) : /* @__PURE__ */ React.createElement("p", { className: "sidebar-note", style: { marginBottom: 0 } }, "No diagnostic attempts saved yet. Run a diagnostic from the top of the page and your completed attempts will show up here."))));
  }
  function TopicDetail({ section, progress, questionCount, activeQuiz, onResumeQuiz, onClose, onPractice, onReviewTopic }) {
    const metrics = getSectionMetrics(section, progress);
    const isThinCoverage = questionCount < 5;
    const canResumeSectionQuiz = activeQuiz?.status === "in-progress" && activeQuiz.sectionId === section.id;
    return /* @__PURE__ */ React.createElement("div", { className: "content-grid topic-detail-modal-layout" }, /* @__PURE__ */ React.createElement("aside", { className: "stack" }, /* @__PURE__ */ React.createElement("div", { className: "panel" }, /* @__PURE__ */ React.createElement("button", { className: "button-ghost topic-modal-close-button", onClick: onClose }, "Close topic"), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 14 }, className: "mini-label" }, section.questionRange, " official range"), /* @__PURE__ */ React.createElement("h2", { id: "topic-modal-title", className: "section-title" }, section.title), /* @__PURE__ */ React.createElement("div", { className: "topic-progress-copy sidebar-note" }, /* @__PURE__ */ React.createElement("span", null, questionCount, " mapped questions."), /* @__PURE__ */ React.createElement("span", null, renderAnsweredBreakdown(metrics.answered, metrics.correct))), /* @__PURE__ */ React.createElement("div", { className: "pill", style: { marginTop: 10 } }, metrics.isScoreVisible ? `${metrics.score}% correct` : "Progress locked"), canResumeSectionQuiz ? /* @__PURE__ */ React.createElement("button", { className: "button", style: { marginTop: 16 }, onClick: onResumeQuiz }, "Resume quiz") : null, metrics.answered > 0 ? /* @__PURE__ */ React.createElement("button", { className: "button-ghost", style: { marginTop: 12 }, onClick: () => onReviewTopic(section.id) }, "Review previous answers") : null, isThinCoverage ? /* @__PURE__ */ React.createElement("div", { className: "coverage-note" }, "Coverage is thin here, so use these questions as a light check-in rather than a full representation of the topic.") : null)), /* @__PURE__ */ React.createElement("div", { className: "stack" }, /* @__PURE__ */ React.createElement("article", { className: "topic-card" }, /* @__PURE__ */ React.createElement("div", { className: "topic-actions topic-actions-surface" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "mini-label" }, "Whole topic"), /* @__PURE__ */ React.createElement("h3", { style: { marginTop: 8 } }, section.title)), /* @__PURE__ */ React.createElement("div", { className: "toolbar" }, /* @__PURE__ */ React.createElement("button", { className: "button", onClick: () => onPractice(section.id), disabled: questionCount === 0 }, "Generate quiz with topic"))), /* @__PURE__ */ React.createElement("div", { className: "subtopic-section-header" }, /* @__PURE__ */ React.createElement("span", { className: "mini-label" }, "By subtopic")), /* @__PURE__ */ React.createElement("div", { className: "subtopic-list" }, section.subtopicCoverage.map((subtopic) => {
      const subMetrics = getSubtopicMetrics(progress, section.id, subtopic.name);
      return /* @__PURE__ */ React.createElement("div", { className: "subtopic-row", key: subtopic.name }, /* @__PURE__ */ React.createElement("div", { className: "subtopic-meta" }, /* @__PURE__ */ React.createElement("strong", null, subtopic.name), /* @__PURE__ */ React.createElement("div", { className: "subtopic-summary" }, /* @__PURE__ */ React.createElement("span", { className: "muted" }, subtopic.count, " mapped questions."), /* @__PURE__ */ React.createElement("span", { className: "muted" }, renderAnsweredBreakdown(subMetrics.answered, subMetrics.correct)))), /* @__PURE__ */ React.createElement("div", { className: "subtopic-metrics" }, /* @__PURE__ */ React.createElement("div", { className: "card-row", style: { marginBottom: 6 } }, /* @__PURE__ */ React.createElement("span", { className: "muted" }, subMetrics.isScoreVisible ? `${subMetrics.score}% correct` : "Progress locked"), /* @__PURE__ */ React.createElement("button", { className: "nav-chip", onClick: () => onPractice(section.id, subtopic.name), disabled: subtopic.count === 0 }, "Generate quiz with subtopic")), /* @__PURE__ */ React.createElement("div", { className: `score-bar ${subMetrics.isScoreVisible ? "" : "is-disabled"}` }, subMetrics.isScoreVisible ? /* @__PURE__ */ React.createElement("div", { className: "score-mask", style: { width: `${100 - (subMetrics.score || 0)}%` } }) : null)));
    })))));
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
    const questions = useMemo(
      () => (activeQuiz?.questionIds || []).map((questionId) => questionsById[questionId]).filter(Boolean),
      [activeQuiz?.questionIds, questionsById]
    );
    const currentIndex = clamp(activeQuiz?.currentIndex || 0, 0, questions.length);
    const isSubmitLanding = currentIndex >= questions.length;
    const [navKeyActive, setNavKeyActive] = useState(null);
    const questionScrollRef = useRef(null);
    const liveRegionId = useId();
    const question = questions[currentIndex];
    const response = question ? getSessionQuestionState(activeQuiz, question.id) : null;
    const isReviewMode = activeQuiz?.mode === "review";
    const priorSavedResult = activeQuiz?.showPriorResults && question && typeof activeQuiz?.baselineResults?.[question.id]?.wasCorrect === "boolean" ? activeQuiz.baselineResults[question.id].wasCorrect : null;
    const { gradedCount, unansweredCount, firstUnansweredIndex } = useMemo(() => {
      let graded = 0;
      let unanswered = 0;
      let firstUnanswered = -1;
      questions.forEach((entry, index) => {
        const isGraded = getSessionQuestionState(activeQuiz, entry.id)?.wasCorrect != null;
        if (isGraded) {
          graded += 1;
        } else {
          unanswered += 1;
          if (firstUnanswered === -1) firstUnanswered = index;
        }
      });
      return { gradedCount: graded, unansweredCount: unanswered, firstUnansweredIndex: firstUnanswered };
    }, [activeQuiz, questions]);
    const progressPercent = questions.length ? Math.round(gradedCount / questions.length * 100) : 0;
    const canRevealAnswer = !!response?.revealed;
    const canClearAnswer = !!(response && (response.selectedChoice != null || response.revealed || response.wasCorrect != null));
    const liveAnnouncement = isSubmitLanding ? isReviewMode ? "Review wrap-up. All questions reviewed." : `Submission check. ${unansweredCount === 0 ? "All questions graded." : `${unansweredCount} question${unansweredCount === 1 ? "" : "s"} still need a mark.`}` : question ? `Question ${currentIndex + 1} of ${questions.length}. ${response?.wasCorrect === true ? "Marked correct." : response?.wasCorrect === false ? "Marked incorrect." : response?.revealed ? "Answer revealed, ready to grade." : "Awaiting your answer."}` : "";
    useEffect(() => {
      renderMath(questionScrollRef.current);
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
    function handleSelectChoice(choiceKey) {
      if (!question || isReviewMode) return;
      onUpdateResponse(question.id, {
        selectedChoice: choiceKey,
        revealed: true,
        wasCorrect: choiceKey === question.answer
      });
    }
    function renderMobileGradeActions() {
      if (isSubmitLanding || !response?.revealed) return null;
      return /* @__PURE__ */ React.createElement("div", { className: "mobile-grade-actions" }, /* @__PURE__ */ React.createElement(
        "button",
        {
          className: "button-ghost result-button result-button-ghost",
          onClick: () => handleGradeAndAdvance(false)
        },
        /* @__PURE__ */ React.createElement("span", null, "Mark wrong"),
        /* @__PURE__ */ React.createElement("span", { className: "shortcut-badge" }, "SPACE")
      ), /* @__PURE__ */ React.createElement(
        "button",
        {
          className: "button result-button result-button-primary",
          onClick: () => handleGradeAndAdvance(true)
        },
        /* @__PURE__ */ React.createElement("span", null, "Mark right"),
        /* @__PURE__ */ React.createElement("span", { className: "shortcut-badge" }, "ENTER")
      ));
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
        if (!isReviewMode && question.type === "mcq" && availableChoices.includes(key)) {
          event.preventDefault();
          handleSelectChoice(key);
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
      return /* @__PURE__ */ React.createElement("div", { className: "quiz-shell" }, /* @__PURE__ */ React.createElement("div", { className: "quiz-empty" }, /* @__PURE__ */ React.createElement("div", { className: "results-card" }, /* @__PURE__ */ React.createElement("div", { className: "mini-label" }, "No quiz available"), /* @__PURE__ */ React.createElement("h2", { className: "dialog-title" }, "This test has no mapped questions yet."), /* @__PURE__ */ React.createElement("p", { className: "sidebar-note" }, "Try another section or return to the dashboard while the bank continues to grow."), /* @__PURE__ */ React.createElement("button", { className: "button", onClick: onRequestLeave }, "Back"))));
    }
    const answerLabelColor = response?.wasCorrect == null ? "#69553d" : response.wasCorrect ? "#1f7a4d" : "#b33a3a";
    return /* @__PURE__ */ React.createElement("div", { className: "quiz-shell" }, /* @__PURE__ */ React.createElement("div", { id: liveRegionId, className: "sr-only", role: "status", "aria-live": "polite" }, liveAnnouncement), /* @__PURE__ */ React.createElement("header", { className: "quiz-header" }, /* @__PURE__ */ React.createElement("div", { className: "quiz-header-meta" }, /* @__PURE__ */ React.createElement("div", { className: "mini-label" }, getQuizModeLabel(activeQuiz.mode)), /* @__PURE__ */ React.createElement("h1", { className: "quiz-title" }, activeQuiz.title), /* @__PURE__ */ React.createElement("p", { className: "quiz-subtitle" }, activeQuiz.subtitle)), /* @__PURE__ */ React.createElement("div", { className: "quiz-header-actions" }, /* @__PURE__ */ React.createElement("div", { className: "quiz-header-statuses" }, /* @__PURE__ */ React.createElement("div", { className: "quiz-progress-block" }, /* @__PURE__ */ React.createElement("div", { className: "mini-label" }, "Graded"), /* @__PURE__ */ React.createElement("strong", null, gradedCount, "/", questions.length))), /* @__PURE__ */ React.createElement("div", { className: "quiz-header-buttons" }, /* @__PURE__ */ React.createElement("button", { className: "button-ghost quiz-header-leave-button", onClick: onRequestLeave }, isReviewMode ? "Leave review" : "Leave quiz"), /* @__PURE__ */ React.createElement("button", { className: "button quiz-header-submit-button", onClick: onRequestSubmit }, isReviewMode ? "Finish review" : "Submit quiz")))), /* @__PURE__ */ React.createElement("div", { className: "quiz-layout" }, /* @__PURE__ */ React.createElement("aside", { className: "quiz-sidebar" }, /* @__PURE__ */ React.createElement("div", { className: "quiz-sidebar-card" }, /* @__PURE__ */ React.createElement("div", { className: "card-row", style: { marginBottom: 10 } }, /* @__PURE__ */ React.createElement("span", { className: "mini-label" }, "Question map"), /* @__PURE__ */ React.createElement("span", { className: "muted" }, progressPercent, "% graded")), /* @__PURE__ */ React.createElement("div", { className: "progress-track", style: { marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { className: "progress-fill", style: { width: `${progressPercent}%` } })), /* @__PURE__ */ React.createElement("nav", { className: "question-chip-grid", "aria-label": "Question map" }, questions.map((entry, index) => {
      const state = getSessionQuestionState(activeQuiz, entry.id);
      const statusClass = state?.wasCorrect == null ? state?.selectedChoice || state?.revealed ? "review" : "pending" : state.wasCorrect ? "correct" : "incorrect";
      const statusLabel = statusClass === "correct" ? "marked correct" : statusClass === "incorrect" ? "marked incorrect" : statusClass === "review" ? "answered, not yet graded" : "not answered";
      return /* @__PURE__ */ React.createElement(
        "button",
        {
          key: entry.id,
          className: `question-chip ${currentIndex === index ? "is-current" : ""} ${statusClass}`,
          onClick: () => onSetIndex(index),
          "aria-label": `Question ${index + 1}, ${statusLabel}`,
          "aria-current": currentIndex === index ? "true" : void 0
        },
        /* @__PURE__ */ React.createElement("span", { "aria-hidden": "true" }, index + 1)
      );
    })), /* @__PURE__ */ React.createElement("div", { className: "quiz-sidebar-note" }, /* @__PURE__ */ React.createElement("div", { className: "pill subtle" }, "Arrow keys move between questions")))), /* @__PURE__ */ React.createElement("main", { id: "main-content", className: "quiz-stage" }, /* @__PURE__ */ React.createElement("article", { className: "question-card quiz-card" }, isSubmitLanding ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "quiz-card-body quiz-submit-card-body" }, /* @__PURE__ */ React.createElement("div", { className: "quiz-submit-card" }, /* @__PURE__ */ React.createElement("h2", { className: "quiz-submit-title" }, isReviewMode ? "Ready to finish review?" : "Ready to submit?"), /* @__PURE__ */ React.createElement("div", { className: "mini-label" }, unansweredCount === 0 ? "All questions graded" : "Review before submitting"), /* @__PURE__ */ React.createElement("strong", null, unansweredCount === 0 ? "Everything has been graded. You can submit whenever you're ready." : `${unansweredCount} question${unansweredCount === 1 ? "" : "s"} still need a mark before you submit.`), /* @__PURE__ */ React.createElement("p", { className: "muted" }, isReviewMode ? "You can finish now or jump back to any question if you want to revise a saved result." : "Submit here, use the top-right button as usual, or jump back to any unanswered question from the map."), /* @__PURE__ */ React.createElement("div", { className: "quiz-submit-stats" }, /* @__PURE__ */ React.createElement("div", { className: "quiz-submit-stat" }, /* @__PURE__ */ React.createElement("span", { className: "mini-label" }, "Graded"), /* @__PURE__ */ React.createElement("strong", null, gradedCount, "/", questions.length)), /* @__PURE__ */ React.createElement("div", { className: "quiz-submit-stat" }, /* @__PURE__ */ React.createElement("span", { className: "mini-label" }, "Remaining"), /* @__PURE__ */ React.createElement("strong", null, unansweredCount))), /* @__PURE__ */ React.createElement("div", { className: "quiz-submit-actions" }, /* @__PURE__ */ React.createElement("button", { className: "button", onClick: onRequestSubmit }, isReviewMode ? "Finish review" : "Submit quiz"), firstUnansweredIndex >= 0 ? /* @__PURE__ */ React.createElement("button", { className: "button-ghost", onClick: () => onSetIndex(firstUnansweredIndex) }, "Go to first unanswered") : null, /* @__PURE__ */ React.createElement("button", { className: "button-ghost", onClick: () => onSetIndex(Math.max(questions.length - 1, 0)) }, "Back to last question"))))) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "quiz-card-top" }, /* @__PURE__ */ React.createElement("div", { className: "top-row" }, /* @__PURE__ */ React.createElement("span", { className: "pill quiz-topic-pill" }, question.officialSubtopic), priorSavedResult != null ? /* @__PURE__ */ React.createElement("span", { className: `pill subtle ${priorSavedResult ? "score-good" : "score-bad"}` }, "Previously marked ", priorSavedResult ? "correct" : "incorrect") : null), /* @__PURE__ */ React.createElement("div", { className: "quiz-card-top-actions" }, /* @__PURE__ */ React.createElement(ClearAnswerStamp, { onClick: () => onClearQuestion(question), disabled: !canClearAnswer })), /* @__PURE__ */ React.createElement("h2", null, formatQuestionHeading(question, currentIndex))), /* @__PURE__ */ React.createElement("div", { ref: questionScrollRef, className: `quiz-card-body ${question.type === "open" ? "has-answer-dock" : ""} ${canRevealAnswer ? "" : "is-awaiting-answer"}` }, /* @__PURE__ */ React.createElement("div", { className: "quiz-question-scroll" }, /* @__PURE__ */ React.createElement(SafeHtml, { className: "question-stem", html: question.stem }), question.type === "mcq" ? /* @__PURE__ */ React.createElement("div", { className: "choice-grid" }, Object.entries(question.choices).map(([key, value]) => {
      const isRevealed = !!response?.revealed;
      const isCorrectChoice = isRevealed && key === question.answer;
      const isSelectedIncorrect = isRevealed && response?.selectedChoice === key && key !== question.answer;
      const isSelected = response?.selectedChoice === key;
      const statusLabel = isCorrectChoice ? "Correct answer" : isSelectedIncorrect ? "Your answer, incorrect" : isSelected ? "Your answer" : "";
      const statusIcon = isCorrectChoice ? "\u2713" : isSelectedIncorrect ? "\u2717" : "";
      return /* @__PURE__ */ React.createElement(
        "button",
        {
          key,
          className: `choice-button ${isCorrectChoice ? "correct" : ""} ${isSelectedIncorrect ? "incorrect" : ""} ${isSelected ? "selected" : ""}`,
          onClick: () => handleSelectChoice(key),
          disabled: isReviewMode,
          "aria-pressed": isSelected
        },
        /* @__PURE__ */ React.createElement("div", { className: "choice-row" }, /* @__PURE__ */ React.createElement("strong", null, key), /* @__PURE__ */ React.createElement(SafeHtml, { as: "span", html: value }), statusIcon ? /* @__PURE__ */ React.createElement("span", { className: `choice-status-icon ${isCorrectChoice ? "is-correct" : "is-incorrect"}`, "aria-hidden": "true" }, statusIcon) : null),
        statusLabel ? /* @__PURE__ */ React.createElement("span", { className: "sr-only" }, statusLabel) : null
      );
    }), renderMobileGradeActions()) : !canRevealAnswer ? /* @__PURE__ */ React.createElement("div", { className: "answer-panel answer-panel-intro" }, /* @__PURE__ */ React.createElement("strong", null, "Self-grade this one."), /* @__PURE__ */ React.createElement("p", { className: "muted" }, "Work it out first, then mark it right or wrong below. You can revisit and change the mark later.")) : null), question.type === "open" ? /* @__PURE__ */ React.createElement("div", { className: `quiz-answer-dock ${canRevealAnswer ? "" : "is-clickable"}` }, /* @__PURE__ */ React.createElement("div", { className: "card-row" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "mini-label", style: { color: answerLabelColor } }, response?.wasCorrect == null ? "Ready to grade" : response.wasCorrect ? "Marked correct" : "Marked incorrect"), /* @__PURE__ */ React.createElement("strong", null, "Answer"))), priorSavedResult != null ? /* @__PURE__ */ React.createElement("div", { className: "quiz-prior-result" }, "Saved before this attempt: ", priorSavedResult ? "correct" : "incorrect", ".") : null, /* @__PURE__ */ React.createElement("div", { className: `answer-reveal-shell ${canRevealAnswer ? "is-revealed" : ""}` }, /* @__PURE__ */ React.createElement(SafeHtml, { className: "quiz-answer-content answer-reveal-content", html: question.answer }), !canRevealAnswer ? /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "answer-reveal-button",
        onClick: () => onUpdateResponse(question.id, { revealed: true })
      },
      "Show answer"
    ) : null), canRevealAnswer && question.url ? /* @__PURE__ */ React.createElement("a", { className: "button-ghost quiz-source-link", href: question.url, target: "_blank", rel: "noreferrer" }, "Open source explanation", /* @__PURE__ */ React.createElement("span", { className: "sr-only" }, " (opens in new tab)")) : null, renderMobileGradeActions()) : null))))), /* @__PURE__ */ React.createElement("div", { className: "quiz-footer-layout" }, /* @__PURE__ */ React.createElement("div", { className: "quiz-footer quiz-footer-sidebar", role: "toolbar", "aria-label": "Question navigation" }, /* @__PURE__ */ React.createElement("div", { className: "quiz-footer-nav" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        className: `button-ghost quiz-nav-button ${navKeyActive === "left" ? "is-key-active" : ""}`,
        onClick: () => onSetIndex(currentIndex - 1),
        disabled: currentIndex === 0
      },
      /* @__PURE__ */ React.createElement("span", null, "Previous"),
      /* @__PURE__ */ React.createElement("span", { className: "shortcut-badge shortcut-badge-nav" }, "\u2190")
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        className: `button-ghost quiz-nav-button ${navKeyActive === "right" ? "is-key-active" : ""}`,
        onClick: () => onSetIndex(currentIndex + 1),
        disabled: currentIndex >= questions.length
      },
      /* @__PURE__ */ React.createElement("span", null, "Next"),
      /* @__PURE__ */ React.createElement("span", { className: "shortcut-badge shortcut-badge-nav" }, "\u2192")
    ))), /* @__PURE__ */ React.createElement("div", { className: "quiz-footer quiz-footer-stage", role: "toolbar", "aria-label": "Grade this question" }, /* @__PURE__ */ React.createElement("div", { className: "quiz-footer-center" }, /* @__PURE__ */ React.createElement("span", { className: "muted" }, isSubmitLanding ? isReviewMode ? "Review wrap-up" : "Submission check" : `Question ${currentIndex + 1} of ${questions.length}`)), /* @__PURE__ */ React.createElement("div", { className: "quiz-footer-actions" }, isSubmitLanding ? null : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
      "button",
      {
        className: "button-ghost result-button result-button-ghost",
        onClick: () => handleGradeAndAdvance(false),
        disabled: !response?.revealed
      },
      /* @__PURE__ */ React.createElement("span", null, "Mark wrong"),
      /* @__PURE__ */ React.createElement("span", { className: "shortcut-badge" }, "SPACE")
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        className: "button result-button result-button-primary",
        onClick: () => handleGradeAndAdvance(true),
        disabled: !response?.revealed
      },
      /* @__PURE__ */ React.createElement("span", null, "Mark right"),
      /* @__PURE__ */ React.createElement("span", { className: "shortcut-badge" }, "ENTER")
    ))))));
  }
  function pickRandom(items, count) {
    const copy = [...items];
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
    }
    return copy.slice(0, count);
  }
  ReactDOM.createRoot(document.getElementById("root")).render(/* @__PURE__ */ React.createElement(App, null));
})();
