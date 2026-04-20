# Quiz Split Footer Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Split the combined quiz footer into two aligned footer cards so the navigation footer matches the sidebar width and the grading footer matches the question stage width.

**Architecture:** Preserve the existing `quiz-layout` column proportions and add a matching footer grid directly beneath it. Move the previous/next controls into the sidebar-width footer card and keep the question status plus grading actions in the stage-width footer card, with responsive stacking preserved for smaller viewports.

**Tech Stack:** React, JSX, CSS

---

### Task 1: Restructure the quiz footer markup

**Files:**
- Modify: `/Users/sps/Documents/GitHub/sull1van.com/FEStudy/app.jsx`

**Step 1: Replace the single footer with a two-column footer layout**

Add a `quiz-footer-layout` wrapper with a sidebar footer card and a stage footer card.

**Step 2: Preserve existing behavior**

Keep the current previous/next handlers, current question label, submit-landing label, and mark right/mark wrong logic unchanged while moving them into the new structure.

### Task 2: Update footer styling

**Files:**
- Modify: `/Users/sps/Documents/GitHub/sull1van.com/FEStudy/styles.css`

**Step 1: Add a grid container that mirrors the quiz layout**

Create `quiz-footer-layout` with the same column widths as `quiz-layout`.

**Step 2: Refine the sidebar and stage footer cards**

Style the left footer for navigation-only controls and the right footer for centered question status plus grading actions.

**Step 3: Preserve responsive behavior**

Update the small-screen rules so the split footer collapses into a single-column stack cleanly.

### Task 3: Verify the change

**Files:**
- Verify: `/Users/sps/Documents/GitHub/sull1van.com/FEStudy/app.jsx`
- Verify: `/Users/sps/Documents/GitHub/sull1van.com/FEStudy/styles.css`

**Step 1: Run the app bundle build**

Run: `npx -y esbuild /Users/sps/Documents/GitHub/sull1van.com/FEStudy/app.jsx --bundle --format=iife --outfile=/tmp/festudy-app.js`

Expected: build exits successfully.

**Step 2: Run the stylesheet bundle build**

Run: `npx -y esbuild /Users/sps/Documents/GitHub/sull1van.com/FEStudy/styles.css --bundle --outfile=/tmp/festudy.css`

Expected: build exits successfully.
