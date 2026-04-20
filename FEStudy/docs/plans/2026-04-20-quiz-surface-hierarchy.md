# Quiz Surface Hierarchy Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the question card the dominant visual surface by recessing the quiz sidebar and footers and softening the quiz header.

**Architecture:** This is a CSS-only hierarchy pass. Shared surface rules stay intact for borders/backgrounds, while the header and support surfaces get targeted shadow/background overrides to separate raised and recessed layers.

**Tech Stack:** React, CSS

---

### Task 1: Document the approved hierarchy direction

**Files:**
- Create: `/Users/sps/Documents/GitHub/sull1van.com/FEStudy/docs/plans/2026-04-20-quiz-surface-hierarchy-design.md`

**Step 1: Save the approved design**

Write the approved visual hierarchy direction, including the recessed sidebar/footer surfaces and the compressed green header gradient.

**Step 2: Review for scope**

Confirm the document only covers the requested surfaces and does not introduce unrelated UI changes.

### Task 2: Recess support surfaces

**Files:**
- Modify: `/Users/sps/Documents/GitHub/sull1van.com/FEStudy/styles.css`

**Step 1: Override support-surface shadows**

Remove the raised drop shadow from `.quiz-sidebar-card`, `.quiz-footer-sidebar`, and `.quiz-footer-stage`.

**Step 2: Add refined inset treatment**

Add a restrained inset shadow stack so those surfaces feel pressed into the page rather than elevated above it.

**Step 3: Preserve stage emphasis**

Leave `.quiz-card` elevated so the question area remains the strongest surface on the screen.

### Task 3: Soften the quiz header

**Files:**
- Modify: `/Users/sps/Documents/GitHub/sull1van.com/FEStudy/styles.css`

**Step 1: Remove header drop shadow**

Override the shared surface shadow on `.quiz-header`.

**Step 2: Add the gradient wash**

Apply a left-to-right green-tinted gradient that fades back to the existing header tone by about 35% of the element width.

**Step 3: Keep interaction styling intact**

Confirm the header button hover/active styling still reads correctly against the updated background.

### Task 4: Verify bundling

**Files:**
- Modify: `/Users/sps/Documents/GitHub/sull1van.com/FEStudy/styles.css`

**Step 1: Bundle app**

Run: `npx -y esbuild /Users/sps/Documents/GitHub/sull1van.com/FEStudy/app.jsx --bundle --format=iife --outfile=/tmp/festudy-app.js`

Expected: successful bundle with no syntax errors

**Step 2: Bundle styles**

Run: `npx -y esbuild /Users/sps/Documents/GitHub/sull1van.com/FEStudy/styles.css --bundle --outfile=/tmp/festudy.css`

Expected: successful bundle with no syntax errors
