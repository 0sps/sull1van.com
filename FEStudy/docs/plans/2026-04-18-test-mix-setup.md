# Test Mix Setup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a pre-test setup dialog that lets users choose exact counts from correct, incorrect, and unanswered question pools for any test mode, while ensuring unanswered submitted questions never affect saved progress.

**Architecture:** Introduce a shared test-setup dialog in `App` that computes scoped question pools from saved `questionResults`, clamps requested counts per pool, and starts a quiz from random samples across those pools. Update test submission so only explicitly graded questions persist into progress, while the quiz itself can still be marked complete and resumable metadata remains intact.

**Tech Stack:** React via `app.jsx`, browser `localStorage`, CSS in `styles.css`, esbuild verification

---

### Task 1: Add scoped pool helpers and quiz setup state

**Files:**
- Modify: `/Users/sps/Documents/GitHub/sull1van.com/FEStudy/app.jsx`

**Step 1: Add helper functions that derive `correct`, `incorrect`, and `unanswered` question pools from a candidate question list plus `progress.questionResults`.**

**Step 2: Add `testSetupDialog` state in `App` to track the requested test mode, title/subtitle, source questions, and requested counts per pool.**

**Step 3: Add helpers to open/close the dialog and initialize counts to a sensible default, such as all unanswered questions when available.**

**Step 4: Ensure the setup state stores enough metadata to start either a diagnostic or topic test without rebuilding intent elsewhere.**

### Task 2: Replace direct test starts with the setup dialog flow

**Files:**
- Modify: `/Users/sps/Documents/GitHub/sull1van.com/FEStudy/app.jsx`

**Step 1: Change diagnostic launch so it opens the setup dialog with all diagnostic-eligible MCQs instead of starting immediately.**

**Step 2: Change topic-test launch so it opens the same setup dialog with the section or subtopic MCQ pool instead of starting immediately.**

**Step 3: On confirm, clamp requested counts to pool availability, randomly sample from each pool, merge the selected questions, and start the quiz session using only that sampled set.**

**Step 4: Save the selected mix metadata on the quiz session so resumed/completed quizzes still reflect how they were configured.**

### Task 3: Build the setup dialog UI

**Files:**
- Modify: `/Users/sps/Documents/GitHub/sull1van.com/FEStudy/app.jsx`
- Modify: `/Users/sps/Documents/GitHub/sull1van.com/FEStudy/styles.css`

**Step 1: Render a modal dialog with the test title, short explanation, and three quota rows: `Correct`, `Incorrect`, `Unanswered`.**

**Step 2: For each row, show an input on the left and `/ N questions` on the right, where `N` is the scoped available count for that pool.**

**Step 3: Clamp each field to `0..N` on blur, treating blank as `0`, and reflect the corrected value in the UI immediately.**

**Step 4: Show `Total questions selected: N` and disable `Start test` when the total is `0`.**

**Step 5: Style the dialog so it matches the existing quiz/dashboard visual language and remains usable on laptop and mobile widths.**

### Task 4: Update quiz submission rules

**Files:**
- Modify: `/Users/sps/Documents/GitHub/sull1van.com/FEStudy/app.jsx`

**Step 1: Remove the existing behavior that marks ungraded quiz questions wrong on submit.**

**Step 2: Keep the submit confirmation, but change the messaging so unanswered questions are described as unrecorded rather than wrong.**

**Step 3: Ensure `questionResults` only changes when the user actually grades a question via `Mark right` or `Mark wrong`.**

**Step 4: Preserve completed quiz status and graded-count summaries even when a quiz is submitted early.**

### Task 5: Verify and document

**Files:**
- Modify: `/Users/sps/Documents/GitHub/sull1van.com/FEStudy/docs/plans/2026-04-18-test-mix-setup.md`

**Step 1: Run `npx -y esbuild app.jsx --bundle --format=iife --outfile=/tmp/festudy-app.js` and confirm success.**

**Step 2: Run `npx -y esbuild styles.css --bundle --outfile=/tmp/festudy.css` and confirm success.**

**Step 3: Sanity-check the new dialog wiring with source inspection for diagnostic start, topic-test start, quota clamping, and submit messaging.**

**Step 4: Report the changed behavior clearly, including the new unanswered-question persistence rule.**
