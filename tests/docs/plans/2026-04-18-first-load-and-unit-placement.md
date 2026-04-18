# First Load Reliability And Unit Placement Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the labs page reliably hydrate real results on first load and render resolved numeric units only in the top-right latest-result cluster while preserving the detail subtitle unit block.

**Architecture:** Keep the existing progressive skeleton-first UI, but make the boot path resilient to auth and vault timing by allowing readiness transitions to trigger real loads cleanly. Centralize numeric unit rendering so pending units use the lower placeholder row and resolved units move into the latest-value cluster for both list and grid cards.

**Tech Stack:** Static HTML, browser JavaScript, Firebase Auth, Firestore, Web Crypto, Chart.js

---

### Task 1: Stabilize the first-load path

**Files:**
- Modify: `/Users/sps/Documents/GitHub/sull1van.com/tests/tests.html`

**Step 1: Trace all early returns in `loadData()`**

Identify which auth and vault states intentionally pause loading and ensure each one leaves the page ready for the next trigger.

**Step 2: Make load attempts resumable**

Adjust loading guards and readiness transitions so an early initial load does not strand the UI in a permanent skeleton state.

**Step 3: Re-check the auth and vault callbacks**

Make sure Firebase auth changes and successful vault unlock both re-enter the real load path reliably on first boot.

### Task 2: Simplify numeric unit placement

**Files:**
- Modify: `/Users/sps/Documents/GitHub/sull1van.com/tests/tests.html`

**Step 1: Keep pending placeholders where they are**

Leave the lower placeholder row untouched while units are unresolved.

**Step 2: Remove the lower resolved numeric unit row**

Ensure numeric cards no longer render resolved unit text in the bottom-left area.

**Step 3: Render resolved numeric units inline with the latest value**

Place the resolved unit beside the large latest-result value in both list and grid layouts, above the sparkline.

### Task 3: Restore the detail subtitle and verify

**Files:**
- Modify: `/Users/sps/Documents/GitHub/sull1van.com/tests/tests.html`

**Step 1: Keep the detail header unit subtitle active**

Verify the unit block under the biomarker name remains populated after the rendering cleanup.

**Step 2: Run syntax verification**

Parse the edited inline scripts to confirm the page still loads.

**Step 3: Review the diff for regressions**

Confirm the final code matches the approved boot and unit-render behavior without disturbing the existing import/export flows.
