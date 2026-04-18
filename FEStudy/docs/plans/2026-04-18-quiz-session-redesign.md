# Quiz Session Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a viewport-focused quiz experience with resumable saved sessions, immediate reversible progress updates, and explicit in-progress versus complete quiz state.

**Architecture:** Add a dedicated saved quiz-session model alongside existing progress storage, refactor progress updates so individual question results can be changed safely, and replace the current session screen with a stable viewport-height quiz shell for test-taking modes. Keep question ordering in session state so resume behavior is deterministic across page reloads and exits.

**Tech Stack:** Static HTML, React 18 UMD with Babel, CSS, localStorage, MathJax

---

### Task 1: Define saved quiz session helpers

**Files:**
- Modify: `app.jsx`

**Step 1: Add a new local storage key and default session helpers**

Add constants and helper functions to read, write, clear, and normalize the active saved quiz session.

**Step 2: Add question lookup helpers**

Create utilities that map question ids back to question objects for restore and progress calculations.

**Step 3: Verify helper behavior in code**

Check that missing or malformed saved session data falls back safely to `null`.

**Step 4: Commit**

```bash
git add app.jsx
git commit -m "feat: add saved quiz session helpers"
```

### Task 2: Make progress updates reversible per question

**Files:**
- Modify: `app.jsx`

**Step 1: Refactor progress state updates to use question-result deltas**

Replace the append-only `updateProgress` behavior with helpers that can apply, remove, or replace a stored mark for a given question.

**Step 2: Track per-question graded results in saved progress**

Store enough information in progress so revisiting a question can reverse its previous contribution before applying the new one.

**Step 3: Run a manual browser verification**

Verify that marking a question correct, then incorrect, changes section/subtopic counts in both directions without duplication.

**Step 4: Commit**

```bash
git add app.jsx
git commit -m "feat: support reversible quiz progress updates"
```

### Task 3: Create resumable quiz session lifecycle

**Files:**
- Modify: `app.jsx`

**Step 1: Store the active session in `App` state**

Load the saved active session on startup and persist updates alongside progress.

**Step 2: Update quiz start handlers**

Make diagnostic and topic-test creation build a full saved session payload. Starting a new quiz should replace the old saved session.

**Step 3: Add resume and submit behaviors**

Support leaving an in-progress quiz, resuming it later, and marking it complete on submit.

**Step 4: Commit**

```bash
git add app.jsx
git commit -m "feat: add resumable quiz lifecycle"
```

### Task 4: Redesign the test-taking UI shell

**Files:**
- Modify: `app.jsx`
- Modify: `styles.css`

**Step 1: Split test sessions from general practice presentation**

Route `diagnostic` and `topic-test` modes into a dedicated quiz shell while preserving regular practice behavior.

**Step 2: Build the viewport-height layout**

Add a centered question panel, fixed header/footer zones, and question navigation chips that stay visible without page scrolling.

**Step 3: Keep the answer reveal inside a stable card area**

Prevent layout jumps by reserving card space for revealed answer and grading content.

**Step 4: Commit**

```bash
git add app.jsx styles.css
git commit -m "feat: redesign quiz session workspace"
```

### Task 5: Wire question revisiting and regrading

**Files:**
- Modify: `app.jsx`
- Modify: `styles.css`

**Step 1: Add previous/next and jump navigation**

Allow users to move freely across questions in the saved session.

**Step 2: Restore per-question state when navigating**

Reload selected choices, reveal state, and prior grading marks for any visited question.

**Step 3: Let users re-mark correctness**

Ensure the action controls can overwrite a prior mark and immediately update saved progress.

**Step 4: Commit**

```bash
git add app.jsx styles.css
git commit -m "feat: support quiz revisiting and regrading"
```

### Task 6: Add dashboard/topic resume entry points

**Files:**
- Modify: `app.jsx`

**Step 1: Surface resume actions where relevant**

Show a `Resume quiz` action when an active in-progress session exists.

**Step 2: Keep copy and state labels clear**

Distinguish `in-progress` and `complete` sessions in the UI.

**Step 3: Commit**

```bash
git add app.jsx
git commit -m "feat: add quiz resume entry points"
```

### Task 7: Verify end-to-end behavior

**Files:**
- Modify: `app.jsx`
- Modify: `styles.css`

**Step 1: Manual verification in browser**

Check:
- answer without page scroll on laptop-sized viewport
- leave and resume in-progress quiz
- change a prior mark and verify progress updates
- submit quiz and verify complete status
- start a new quiz and verify replacement of the old saved session

**Step 2: Clean up copy and edge cases**

Adjust any labels, empty states, or disabled states found during verification.

**Step 3: Commit**

```bash
git add app.jsx styles.css
git commit -m "fix: polish quiz session flow"
```
