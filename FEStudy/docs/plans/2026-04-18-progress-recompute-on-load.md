# Progress Recompute On Load Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Recompute topic and subtopic progress counters from saved question results on every load and import so recategorized questions move into the correct current subtopic automatically.

**Architecture:** Keep `questionResults` as the durable source of truth and rebuild derived `topicProgress`, `subtopicProgress`, and `answeredQuestionIds` inside progress normalization using the current `data.questions` metadata. This preserves compatibility with existing exports while making displayed progress follow the latest question mapping after every refresh.

**Tech Stack:** React app state in `app.jsx`, browser `localStorage`, JSON import/export, esbuild verification

---

### Task 1: Rebuild derived progress during normalization

**Files:**
- Modify: `/Users/sps/Documents/GitHub/sull1van.com/FEStudy/app.jsx`

**Step 1: Add a helper that starts from default progress and reapplies each saved `questionResults` entry using the current question metadata.**

**Step 2: Update `normalizeProgress()` so recomputed counters win over stored `topicProgress`, `subtopicProgress`, and `answeredQuestionIds`.**

**Step 3: Ignore stale question IDs that no longer exist in the current data set.**

### Task 2: Verify load/import behavior

**Files:**
- Modify: `/Users/sps/Documents/GitHub/sull1van.com/FEStudy/docs/plans/2026-04-18-progress-recompute-on-load.md`

**Step 1: Confirm `readProgress()` and import both pass through the updated `normalizeProgress()` path.**

**Step 2: Run `npx -y esbuild app.jsx --bundle --format=iife --outfile=/tmp/festudy-app.js` and confirm success.**

**Step 3: Source-check the recompute helper and normalization call sites.**
