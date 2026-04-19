# Dashboard Topic Summary Panel Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Improve dashboard card hierarchy so topic-level stats and actions read as a single section separate from subtopic-specific content.

**Architecture:** Wrap the existing dashboard card header, score bar, topic metrics, and topic-level actions in a dedicated summary container. Style that container as a subtle inset panel so the subtopic list below reads as a second section without changing any data flow or behavior.

**Tech Stack:** React in `app.jsx`, CSS in `styles.css`

---

### Task 1: Group topic-level content inside the dashboard card

**Files:**
- Modify: `/Users/sps/Documents/GitHub/sull1van.com/FEStudy/app.jsx`

**Step 1: Wrap the topic header, score bar, topic progress copy, topic buttons, and coverage note in a new summary container for dashboard cards only.**

**Step 2: Leave the subtopic header and subtopic rows outside that container so the two levels read as separate sections.**

### Task 2: Style the summary container for stronger hierarchy

**Files:**
- Modify: `/Users/sps/Documents/GitHub/sull1van.com/FEStudy/styles.css`

**Step 1: Add a subtle inset background, border, padding, and spacing for the new summary container.**

**Step 2: Tune margins so the subtopic area starts with more intentional separation below the topic-level block.**

### Task 3: Verify

**Files:**
- Modify: `/Users/sps/Documents/GitHub/sull1van.com/FEStudy/docs/plans/2026-04-18-dashboard-topic-summary-panel.md`

**Step 1: Run `npx -y esbuild app.jsx --bundle --format=iife --outfile=/tmp/festudy-app.js`.**

**Step 2: Run `npx -y esbuild styles.css --bundle --outfile=/tmp/festudy.css`.**

**Step 3: Re-read the dashboard card markup and confirm the summary panel applies only to the cards that begin with `Blueprint range ... questions`.**
