# Reveal Flow Sync Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make practice mode use the same whole-box answer reveal interaction as quiz mode, and remove the self-grade intro block after the answer is revealed in both flows.

**Architecture:** Keep both reveal flows structurally similar by making the hidden answer panel itself the click target and conditioning the self-grade intro panel on unrevealed state. This keeps the UI consistent while preserving existing grading and source-link behavior after reveal.

**Tech Stack:** React, JSX, CSS

---

### Task 1: Update practice reveal behavior

**Files:**
- Modify: `/Users/sps/Documents/GitHub/sull1van.com/FEStudy/app.jsx`

**Step 1: Make the practice answer panel intro conditional**

Only show the self-grade guidance before the answer is revealed.

**Step 2: Make the practice answer panel the click target**

Move the reveal interaction from the nested button to the whole hidden answer panel.

### Task 2: Update quiz reveal behavior

**Files:**
- Modify: `/Users/sps/Documents/GitHub/sull1van.com/FEStudy/app.jsx`

**Step 1: Make the quiz self-grade intro conditional**

Hide the intro panel once the user has revealed the answer.

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
