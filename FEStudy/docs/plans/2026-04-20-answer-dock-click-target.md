# Answer Dock Click Target Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the hidden-answer dock reveal interaction work by clicking anywhere in the quiz answer dock, with the reveal prompt shown as plain bold dark-grey text instead of a button.

**Architecture:** Keep the existing answer dock structure, but make the dock itself the reveal target only while the answer is hidden. Replace the nested reveal button with plain text so the dock reads like a single click surface, then preserve normal non-clickable revealed behavior so the source link still works independently.

**Tech Stack:** React, JSX, CSS

---

### Task 1: Update the quiz answer dock markup

**Files:**
- Modify: `/Users/sps/Documents/GitHub/sull1van.com/FEStudy/app.jsx`

**Step 1: Move the reveal click handling to the dock**

Make the hidden quiz answer dock handle the reveal click directly.

**Step 2: Replace the reveal button**

Swap the nested reveal button for plain instructional text.

### Task 2: Update the reveal styling

**Files:**
- Modify: `/Users/sps/Documents/GitHub/sull1van.com/FEStudy/styles.css`

**Step 1: Add clickable hidden-dock styling**

Add a scoped class for the hidden clickable dock so it gets the pointer cursor and only behaves as a click target before reveal.

**Step 2: Restyle the reveal prompt**

Make the `Click to show answer` text bold, dark grey, and button-free.

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
