# Progressive Loading And Deferred Units Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the labs page render immediately with skeleton cards, then hydrate real results, then resolve biomarker units asynchronously after the results are visible.

**Architecture:** Keep the existing Firebase and vault flow, but decouple visual rendering from data readiness. Render skeleton cards on startup, parse decrypted tests into UI objects, then run a deferred newest-to-oldest unit scan that updates list, grid, detail, and unit-aware displays.

**Tech Stack:** Static HTML, browser JavaScript, Firebase Auth, Firestore, Web Crypto, Chart.js

---

### Task 1: Add skeleton-first rendering

**Files:**
- Modify: `/Users/sps/Documents/GitHub/sull1van.com/tests/tests.html`

**Step 1: Add skeleton card styles**

Create CSS for loading cards, shimmer blocks, and compact unit placeholders that match both list and grid layouts.

**Step 2: Add a skeleton renderer**

Create a renderer that populates `panelList` with placeholder cards immediately on page load.

**Step 3: Stop replacing the panel with blocking loading markup**

Keep the skeletons visible while data is loading instead of wiping the panel back to a spinner.

### Task 2: Add deferred unit resolution

**Files:**
- Modify: `/Users/sps/Documents/GitHub/sull1van.com/tests/tests.html`

**Step 1: Preserve point-level unit strings**

Capture each point’s unit string while building UI tests.

**Step 2: Add per-test unit state**

Track `pending`, `resolved`, and `absent` states plus the resolved display unit string.

**Step 3: Add a newest-to-oldest resolver**

Scan test points backward for the first non-empty unit, then fall back to the test-level unit field.

**Step 4: Defer resolution until after first real render**

Start the unit scan after the real list is displayed and resolve in small batches.

### Task 3: Render units consistently everywhere

**Files:**
- Modify: `/Users/sps/Documents/GitHub/sull1van.com/tests/tests.html`

**Step 1: Add card unit slots**

Render the gray rounded rectangle placeholder while pending, unit text when resolved, and nothing when absent.

**Step 2: Update detail/header and KPI paths**

Use the resolved unit state in detail header, KPI latest display, chart tooltip, and history value rendering.

**Step 3: Re-render safely during unit hydration**

Refresh the visible UI without disturbing the current filters or open detail state.
