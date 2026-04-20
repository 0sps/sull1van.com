# Button Interaction States Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add stronger hover and pressed color states to the quiz and practice session controls without introducing any new motion.

**Architecture:** Scope new state styling to the session UI so generic app buttons stay unchanged. Reuse the existing quiz/practice button classes where possible, and add specific header-button classes for the leave/submit controls so their hover and active states remain tightly targeted.

**Tech Stack:** React, JSX, CSS

---

### Task 1: Mark up the quiz header action buttons

**Files:**
- Modify: `/Users/sps/Documents/GitHub/sull1van.com/FEStudy/app.jsx`

**Step 1: Add explicit classes to the quiz header controls**

Apply dedicated classes to the leave and submit quiz buttons so their hover and active states can be styled without affecting unrelated buttons.

### Task 2: Add scoped interaction styles

**Files:**
- Modify: `/Users/sps/Documents/GitHub/sull1van.com/FEStudy/styles.css`

**Step 1: Align nav hover and active states with the keyboard-active state**

Make the previous and next buttons use the same green visual treatment for keyboard, hover, and active interaction states.

**Step 2: Add header button states**

Make the submit action darken on hover and active with no shadow growth, and make the leave action use a thicker dark red outline with no motion.

**Step 3: Strengthen result buttons for enabled state**

Increase the saturation of the mark right and mark wrong buttons once enabled, and add hover and active color states that affect only color treatment.

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
