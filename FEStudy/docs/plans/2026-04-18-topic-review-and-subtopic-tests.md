# Topic Review And Subtopic Tests Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Extend the test-mix popup to subtopic launches, show richer right/wrong topic summaries, and add a topic-level review mode for previously answered questions.

**Architecture:** Reuse the existing quiz session shell by adding a `review` mode that seeds responses from saved `questionResults` while keeping grading reversible. Update topic and subtopic entry points to share the test setup dialog and render answered summaries from existing topic and subtopic progress counters.

**Tech Stack:** React in `app.jsx`, CSS in `styles.css`, browser `localStorage`, esbuild verification

---

### Task 1: Extend session helpers for review mode

**Files:**
- Modify: `/Users/sps/Documents/GitHub/sull1van.com/FEStudy/app.jsx`

**Step 1: Add support for `review` in the quiz mode label and viewport-shell routing.**

**Step 2: Extend quiz-session construction so callers can provide preloaded responses for answered-question review sessions.**

**Step 3: Add an `openTopicReview` flow that gathers previously answered questions for a section and opens them in the shared quiz shell.**

### Task 2: Route subtopic launches through the test setup popup

**Files:**
- Modify: `/Users/sps/Documents/GitHub/sull1van.com/FEStudy/app.jsx`

**Step 1: Change subtopic CTA handlers to open the existing mix popup with MCQs scoped to that subtopic.**

**Step 2: Keep the topic-level test CTA using the same popup flow so both entry points stay consistent.**

### Task 3: Add answered summaries to topic UI

**Files:**
- Modify: `/Users/sps/Documents/GitHub/sull1van.com/FEStudy/app.jsx`
- Modify: `/Users/sps/Documents/GitHub/sull1van.com/FEStudy/styles.css`

**Step 1: Add a reusable render/helper for `X answered: Y right, Z wrong`.**

**Step 2: Update topic cards and topic detail panels to show mapped questions plus answered/right/wrong summaries.**

**Step 3: Update subtopic rows to show the same breakdown in a lighter inline treatment.**

### Task 4: Add topic-level review CTA

**Files:**
- Modify: `/Users/sps/Documents/GitHub/sull1van.com/FEStudy/app.jsx`
- Modify: `/Users/sps/Documents/GitHub/sull1van.com/FEStudy/styles.css`

**Step 1: Add `Review previous answers` once at the topic level only, visible when that topic has answered questions.**

**Step 2: Build the review session from all previously answered questions in the topic across subtopics.**

**Step 3: Seed the review session so each question starts revealed and already marked right or wrong, and re-marking updates progress immediately.**

### Task 5: Verify

**Files:**
- Modify: `/Users/sps/Documents/GitHub/sull1van.com/FEStudy/docs/plans/2026-04-18-topic-review-and-subtopic-tests.md`

**Step 1: Run `npx -y esbuild app.jsx --bundle --format=iife --outfile=/tmp/festudy-app.js`.**

**Step 2: Run `npx -y esbuild styles.css --bundle --outfile=/tmp/festudy.css`.**

**Step 3: Source-check the subtopic popup wiring, topic review CTA, and review-mode session behavior.**
