# Diagnostic History And Raw Scoring Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace confidence-adjusted dashboard scoring with raw percent-correct thresholds, and add repeatable diagnostic attempts with dedicated setup, history storage, and fresh-session behavior.

**Architecture:** Keep `questionResults` as the single authoritative latest-result store for per-question progress while adding `diagnosticAttempts` as a parallel history collection. Refactor quiz-session state so prior-answer visibility becomes an explicit session-mode behavior, allowing diagnostics to suppress prior-answer display without changing how grading updates the saved result store.

**Tech Stack:** React via `app.jsx`, browser `localStorage`, JSON import/export, CSS in `styles.css`

---

### Task 1: Add raw scoring helpers and diagnostic-attempt normalization

**Files:**
- Modify: `/Users/sps/Documents/GitHub/sull1van.com/FEStudy/app.jsx`

**Step 1: Add a raw percentage helper**

Write a small helper near the existing score utilities:

```js
function computePercentCorrect(correct, answered) {
  if (!answered) return null;
  return Math.round((correct / answered) * 100);
}
```

**Step 2: Add progress defaults for diagnostics**

Extend `getDefaultProgress` to include:

```js
diagnosticAttempts: []
```

**Step 3: Normalize imported diagnostic attempts**

Add a helper that validates imported attempts into a safe array shape. Keep it minimal:

```js
function normalizeDiagnosticAttempts(parsedAttempts = []) {
  if (!Array.isArray(parsedAttempts)) return [];
  return parsedAttempts
    .filter((attempt) => attempt && Array.isArray(attempt.questionIds))
    .map((attempt) => ({
      id: attempt.id || `${Date.now()}-diagnostic`,
      startedAt: attempt.startedAt || null,
      completedAt: attempt.completedAt || null,
      questionsPerTopic: Number.isFinite(attempt.questionsPerTopic) ? attempt.questionsPerTopic : 0,
      questionIds: attempt.questionIds,
      topicSummaries: attempt.topicSummaries && typeof attempt.topicSummaries === "object" ? attempt.topicSummaries : {},
      answered: Number.isFinite(attempt.answered) ? attempt.answered : 0,
      correct: Number.isFinite(attempt.correct) ? attempt.correct : 0
    }));
}
```

**Step 4: Feed normalized attempts into progress normalization**

Update `normalizeProgress` so it always returns a valid `diagnosticAttempts` array.

**Step 5: Run a bundle check**

Run:

```bash
npx -y esbuild app.jsx --bundle --format=iife --outfile=/tmp/festudy-app.js
```

Expected: PASS with no syntax errors

### Task 2: Replace confidence-adjusted scoring with thresholded raw percentages

**Files:**
- Modify: `/Users/sps/Documents/GitHub/sull1van.com/FEStudy/app.jsx`

**Step 1: Update section metric calculation**

Change `getSectionMetrics` to return:

```js
const score = topicState.answered >= 10 ? computePercentCorrect(topicState.correct, topicState.answered) : null;
const isScoreVisible = topicState.answered >= 10;
```

Include `isScoreVisible` in the returned object.

**Step 2: Update subtopic metric calculation**

Change `getSubtopicMetrics` to return:

```js
const answered = state.answered;
const score = answered >= 1 ? computePercentCorrect(state.correct, answered) : null;
const isScoreVisible = answered >= 1;
```

**Step 3: Update overall score usage**

Remove confidence-adjusted usage for topic/subtopic cards only. Leave overall app summary alone unless it directly depends on the old helper in a way that now feels misleading; if needed, rename or isolate the old helper so only dashboard card logic changes in this pass.

**Step 4: Run a bundle check**

Run:

```bash
npx -y esbuild app.jsx --bundle --format=iife --outfile=/tmp/festudy-app.js
```

Expected: PASS

### Task 3: Update topic and subtopic card rendering for inactive bars

**Files:**
- Modify: `/Users/sps/Documents/GitHub/sull1van.com/FEStudy/app.jsx`
- Modify: `/Users/sps/Documents/GitHub/sull1van.com/FEStudy/styles.css`

**Step 1: Replace readiness wording**

Update the dashboard topic-card label from:

```jsx
{metrics.score == null ? "Not yet assessed" : `${metrics.score}% ready`}
```

to:

```jsx
{metrics.isScoreVisible ? `${metrics.score}% correct` : "Progress locked"}
```

Do the equivalent `% correct` wording for subtopics.

**Step 2: Render inactive topic bars with message**

In the topic card score bar area, render a disabled-state class when `!metrics.isScoreVisible` and include:

```jsx
<span className="score-bar-message">ANSWER AT LEAST 10 QUESTIONS TO SEE</span>
```

inside the bar container.

**Step 3: Render inactive subtopic bars without message**

Apply a disabled-state class when `!subMetrics.isScoreVisible`, but do not render extra text in the bar.

**Step 4: Add CSS for inactive bars**

Style inactive bars as greyed out and ensure the topic message centers cleanly inside the bar.

**Step 5: Run bundle checks**

Run:

```bash
npx -y esbuild app.jsx --bundle --format=iife --outfile=/tmp/festudy-app.js
npx -y esbuild styles.css --bundle --outfile=/tmp/festudy.css
```

Expected: PASS

### Task 4: Add explicit prior-answer visibility to quiz sessions

**Files:**
- Modify: `/Users/sps/Documents/GitHub/sull1van.com/FEStudy/app.jsx`

**Step 1: Extend `buildQuizSession`**

Add a new field:

```js
showPriorResults = true
```

and store it in the returned session.

**Step 2: Normalize persisted sessions**

Update `normalizeQuizSession` to preserve:

```js
showPriorResults: rawSession.showPriorResults !== false
```

**Step 3: Make baseline capture conditional**

In `buildQuizSession`, set:

```js
baselineResults: showPriorResults ? captureBaselineResults(questions, progress) : {}
```

or equivalent.

**Step 4: Use the new flag when starting non-diagnostic quizzes**

Topic tests and reviews should continue to pass `showPriorResults: true`.

**Step 5: Run bundle check**

Run:

```bash
npx -y esbuild app.jsx --bundle --format=iife --outfile=/tmp/festudy-app.js
```

Expected: PASS

### Task 5: Build the diagnostic-specific setup dialog and estimator

**Files:**
- Modify: `/Users/sps/Documents/GitHub/sull1van.com/FEStudy/app.jsx`
- Modify: `/Users/sps/Documents/GitHub/sull1van.com/FEStudy/styles.css`

**Step 1: Add diagnostic pool helpers**

Create helpers that, for each section, split questions into:

- unanswered
- answered

based on `progress.questionResults`.

**Step 2: Add estimate helper**

Write a helper that computes the estimated total for a requested `questionsPerTopic` target by summing:

```js
Math.min(sectionQuestions.length, questionsPerTopic)
```

using the unanswered-first, answered-second availability logic.

**Step 3: Add diagnostic setup dialog state**

Introduce a dedicated `diagnosticSetupDialog` state object instead of reusing the generic mix dialog for diagnostics.

**Step 4: Route `startDiagnostic` into the new dialog**

Make `Take diagnostic` / `Retake diagnostic` open the new setup dialog.

**Step 5: Style the new dialog**

Add a compact numeric-input layout and estimated-total summary styling.

**Step 6: Run bundle checks**

Run:

```bash
npx -y esbuild app.jsx --bundle --format=iife --outfile=/tmp/festudy-app.js
npx -y esbuild styles.css --bundle --outfile=/tmp/festudy.css
```

Expected: PASS

### Task 6: Generate balanced diagnostic sessions and suppress prior-answer display

**Files:**
- Modify: `/Users/sps/Documents/GitHub/sull1van.com/FEStudy/app.jsx`

**Step 1: Add a balanced diagnostic picker**

Create a helper that:

- iterates all sections
- picks up to `questionsPerTopic` unanswered questions first
- fills the remainder from previously answered questions
- combines all chosen questions
- shuffles the final result

**Step 2: Start diagnostic sessions from the picker**

When the user confirms the diagnostic setup dialog, build a quiz session with:

```js
mode: "diagnostic",
showPriorResults: false
```

and the balanced picked questions.

**Step 3: Keep grading behavior unchanged**

Do not special-case `gradeQuizQuestion`; diagnostics should still update the authoritative `questionResults` store exactly like other quiz modes.

**Step 4: Run bundle check**

Run:

```bash
npx -y esbuild app.jsx --bundle --format=iife --outfile=/tmp/festudy-app.js
```

Expected: PASS

### Task 7: Record completed diagnostic attempts in progress history

**Files:**
- Modify: `/Users/sps/Documents/GitHub/sull1van.com/FEStudy/app.jsx`

**Step 1: Add a summary builder for completed diagnostics**

Create a helper that derives per-topic and overall counts from a completed diagnostic session using the saved responses and `questionsById`.

**Step 2: Store diagnostic attempts on submit**

In `submitQuiz`, when `activeQuiz.mode === "diagnostic"`, append a normalized attempt record to `progress.diagnosticAttempts`.

**Step 3: Preserve completed diagnostic flag if still useful**

If `completedDiagnostic` still powers button copy, keep updating it for now to avoid a larger unrelated copy refactor.

**Step 4: Run bundle check**

Run:

```bash
npx -y esbuild app.jsx --bundle --format=iife --outfile=/tmp/festudy-app.js
```

Expected: PASS

### Task 8: Extend export/import to include diagnostic history

**Files:**
- Modify: `/Users/sps/Documents/GitHub/sull1van.com/FEStudy/app.jsx`

**Step 1: Include diagnostic attempts in export**

Ensure `buildExportSnapshot` carries the full normalized progress object, including `diagnosticAttempts`.

**Step 2: Verify import compatibility**

Keep `extractImportedProgress` and `normalizeProgress` backward-compatible with exports that omit diagnostic history.

**Step 3: Run bundle check**

Run:

```bash
npx -y esbuild app.jsx --bundle --format=iife --outfile=/tmp/festudy-app.js
```

Expected: PASS

### Task 9: Add a diagnostic history panel to the dashboard

**Files:**
- Modify: `/Users/sps/Documents/GitHub/sull1van.com/FEStudy/app.jsx`
- Modify: `/Users/sps/Documents/GitHub/sull1van.com/FEStudy/styles.css`

**Step 1: Add a dashboard panel**

Render a new panel in the sidebar or nearby summary area that lists saved diagnostic attempts in reverse chronological order.

**Step 2: Show the core metadata**

For each attempt, display:

- completion date
- questions per topic
- graded count
- overall percent correct

**Step 3: Add empty-state copy**

If there are no attempts, show a short note encouraging the user to take a diagnostic.

**Step 4: Style the history list**

Keep it compact and visually consistent with the existing dashboard panels.

**Step 5: Run bundle checks**

Run:

```bash
npx -y esbuild app.jsx --bundle --format=iife --outfile=/tmp/festudy-app.js
npx -y esbuild styles.css --bundle --outfile=/tmp/festudy.css
```

Expected: PASS

### Task 10: End-to-end verification

**Files:**
- Modify: `/Users/sps/Documents/GitHub/sull1van.com/FEStudy/app.jsx`
- Modify: `/Users/sps/Documents/GitHub/sull1van.com/FEStudy/styles.css`

**Step 1: Verify dashboard threshold behavior**

Manual checks:

- Topic with fewer than 10 answered questions shows greyed-out bar and required message
- Topic with 10 or more answered questions shows `% correct`
- Subtopic with 0 answered shows greyed-out bar and no message
- Subtopic with 1 or more answered shows `% correct`

**Step 2: Verify diagnostic flow**

Manual checks:

- Diagnostic button opens the dedicated setup dialog
- Changing questions per topic updates the estimated total
- Starting the diagnostic creates a balanced cross-topic test
- Reused diagnostic questions do not show prior-answer context

**Step 3: Verify authoritative-result behavior**

Manual checks:

- Re-answer a previously wrong question as right in a diagnostic and confirm the saved progress reflects right
- Re-answer a previously wrong question as right in a non-diagnostic quiz and confirm the saved progress reflects right

**Step 4: Verify history and export/import**

Manual checks:

- Completed diagnostics appear in the history panel
- Exported JSON includes diagnostic attempts
- Re-imported JSON restores diagnostic attempts and current progress

**Step 5: Run final bundle checks**

Run:

```bash
npx -y esbuild app.jsx --bundle --format=iife --outfile=/tmp/festudy-app.js
npx -y esbuild styles.css --bundle --outfile=/tmp/festudy.css
```

Expected: PASS
