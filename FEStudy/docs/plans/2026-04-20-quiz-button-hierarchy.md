# Quiz Button Hierarchy Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the key quiz and practice buttons so they share a refined neumorphic language with clear visual hierarchy.

**Architecture:** This is primarily a CSS refactor with targeted selector scoping. Shared button primitives remain intact for the rest of the app, while quiz/practice grading, nav, and header buttons receive context-specific surface treatments that express different action priority levels.

**Tech Stack:** React, CSS

---

### Task 1: Save the approved design

**Files:**
- Create: `/Users/sps/Documents/GitHub/sull1van.com/FEStudy/docs/plans/2026-04-20-quiz-button-hierarchy-design.md`

**Step 1: Record the hierarchy**

Capture the approved ranking of `Submit quiz`, `Mark right`, `Mark wrong`, navigation, and `Leave quiz`.

**Step 2: Record interaction constraints**

Document that hover and active states must be color/depth only, with no added motion.

### Task 2: Rework quiz and practice grading buttons

**Files:**
- Modify: `/Users/sps/Documents/GitHub/sull1van.com/FEStudy/styles.css`

**Step 1: Adjust the base grading button shape**

Tune the grading buttons so they share a sculpted neumorphic family.

**Step 2: Differentiate positive and negative grading**

Make `.result-button-primary` feel more inviting and more raised than `.result-button-ghost`.

**Step 3: Preserve disabled logic**

Keep the existing disabled behavior readable and functional.

### Task 3: Rework quiz header actions

**Files:**
- Modify: `/Users/sps/Documents/GitHub/sull1van.com/FEStudy/styles.css`

**Step 1: Quiet the leave action**

Restyle `.quiz-header-leave-button` so it feels caution-coded but integrated into the header.

**Step 2: Strengthen the submit action**

Give `.quiz-header-submit-button` the strongest raised treatment in the page’s control system.

### Task 4: Rework footer navigation buttons

**Files:**
- Modify: `/Users/sps/Documents/GitHub/sull1van.com/FEStudy/styles.css`

**Step 1: Carve the navigation controls into the footer**

Restyle `.quiz-nav-button` as recessed navigation controls.

**Step 2: Keep existing active-state hooks**

Preserve the current keyboard/hover/active selector logic while changing only the surface treatment.

### Task 5: Verify bundling

**Files:**
- Modify: `/Users/sps/Documents/GitHub/sull1van.com/FEStudy/styles.css`

**Step 1: Bundle app**

Run: `npx -y esbuild /Users/sps/Documents/GitHub/sull1van.com/FEStudy/app.jsx --bundle --format=iife --outfile=/tmp/festudy-app.js`

Expected: successful bundle with no syntax errors

**Step 2: Bundle styles**

Run: `npx -y esbuild /Users/sps/Documents/GitHub/sull1van.com/FEStudy/styles.css --bundle --outfile=/tmp/festudy.css`

Expected: successful bundle with no syntax errors
