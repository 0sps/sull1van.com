# Clear Answer Stamp Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the existing `Clear answer` ghost button with a circular stamped control that uses wrapped text, soft red styling, and a stronger hover motion.

**Architecture:** Add one reusable React helper for the circular clear control so practice mode and quiz mode stay visually identical. Style the control with dedicated CSS for the SVG text ring, pale fill, disabled state, and hover/focus treatment without affecting other button classes.

**Tech Stack:** React, JSX, CSS

---

### Task 1: Add a shared clear-answer stamp component

**Files:**
- Modify: `/Users/sps/Documents/GitHub/sull1van.com/FEStudy/app.jsx`

**Step 1: Add a helper component**

Create a reusable `ClearAnswerStamp` component that renders a `button` with an inline `svg`, `textPath`, and stable unique path id.

**Step 2: Replace both existing clear-answer buttons**

Use the helper in `SessionView` and `QuizSessionView`, preserving current click handlers and disabled logic.

### Task 2: Add dedicated stamp styling

**Files:**
- Modify: `/Users/sps/Documents/GitHub/sull1van.com/FEStudy/styles.css`

**Step 1: Replace the old clear-answer button rule**

Add dedicated styles for the circular layout, pale red fill, circular text ring, center disc, disabled state, and hover/focus behavior.

**Step 2: Keep layout behavior intact**

Retain the `margin-left: auto` alignment so the stamp stays at the right edge of the question-card top row.

### Task 3: Verify the patch

**Files:**
- Verify: `/Users/sps/Documents/GitHub/sull1van.com/FEStudy/app.jsx`
- Verify: `/Users/sps/Documents/GitHub/sull1van.com/FEStudy/styles.css`

**Step 1: Run the app bundle build**

Run: `npx -y esbuild /Users/sps/Documents/GitHub/sull1van.com/FEStudy/app.jsx --bundle --format=iife --outfile=/tmp/festudy-app.js`

Expected: build exits successfully.

**Step 2: Run the stylesheet bundle build**

Run: `npx -y esbuild /Users/sps/Documents/GitHub/sull1van.com/FEStudy/styles.css --bundle --outfile=/tmp/festudy.css`

Expected: build exits successfully.
