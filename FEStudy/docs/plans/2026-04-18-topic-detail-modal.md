# Topic Detail Modal Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Convert the existing topic detail page into a modal overlay while preserving all topic actions, quiz flows, and return behavior.

**Architecture:** Reuse `TopicDetail` as the content component and introduce a dedicated modal state in `App` rather than keeping topic detail as a top-level page view. Add explicit quiz return-target metadata so leaving or submitting a quiz can restore either the dashboard or the originating topic modal without relying on implicit view reconstruction.

**Tech Stack:** React in `app.jsx`, CSS in `styles.css`, browser `localStorage`, esbuild verification

---

### Task 1: Replace page-level topic view with modal state

**Files:**
- Modify: `/Users/sps/Documents/GitHub/sull1van.com/FEStudy/app.jsx`

**Step 1: Add app state and helpers for opening and closing a topic modal by section id.**

**Step 2: Remove the main-page `view.name === "topic"` rendering path and update dashboard topic buttons to open the modal instead.**

**Step 3: Render the existing `TopicDetail` content inside a modal shell that supports close button, backdrop click, and `Escape`.**

### Task 2: Make quiz flows return to the correct origin

**Files:**
- Modify: `/Users/sps/Documents/GitHub/sull1van.com/FEStudy/app.jsx`

**Step 1: Extend quiz session creation to include an explicit `returnTarget`.**

**Step 2: Pass the correct return target from dashboard launches and topic-modal launches, including review and resume actions.**

**Step 3: Update quiz leave and submit logic to restore the origin encoded by `returnTarget`.**

### Task 3: Adapt topic detail component to modal use

**Files:**
- Modify: `/Users/sps/Documents/GitHub/sull1van.com/FEStudy/app.jsx`

**Step 1: Replace page-navigation wording and callbacks with modal-close behavior.**

**Step 2: Keep all current topic-level and subtopic-level actions wired to the same handlers.**

**Step 3: Ensure modal-launched actions can coexist with the existing test setup and quiz action dialogs.**

### Task 4: Style the topic modal shell

**Files:**
- Modify: `/Users/sps/Documents/GitHub/sull1van.com/FEStudy/styles.css`

**Step 1: Add a responsive modal shell with backdrop, max-height handling, and internal scrolling.**

**Step 2: Ensure the topic modal visually fits the app and layers correctly beneath other dialogs but above the dashboard.**

### Task 5: Verify

**Files:**
- Modify: `/Users/sps/Documents/GitHub/sull1van.com/FEStudy/docs/plans/2026-04-18-topic-detail-modal.md`

**Step 1: Run `npx -y esbuild app.jsx --bundle --format=iife --outfile=/tmp/festudy-app.js`.**

**Step 2: Run `npx -y esbuild styles.css --bundle --outfile=/tmp/festudy.css`.**

**Step 3: Re-read the launch, resume, leave, and submit code paths to confirm they restore dashboard or topic modal correctly.**
