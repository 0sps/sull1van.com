# Grid Card Width Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make collapsed grid-view biomarker cards use their tile width more naturally so the latest value, unit, and sparkline no longer look cut off halfway across the card.

**Architecture:** Keep the existing grid-card markup and latest-value stack, but adjust the collapsed-grid CSS so the result cluster stretches and aligns within the tile more effectively. Limit the change to collapsed grid cards so list view and expanded cards stay untouched.

**Tech Stack:** Static HTML, CSS, browser JavaScript

---

### Task 1: Adjust collapsed grid tile layout

**Files:**
- Modify: `/Users/sps/Documents/GitHub/sull1van.com/tests/tests.html`

**Step 1: Inspect the collapsed grid selectors**

Review the `.layout.is-grid-view #panelList .test-card:not(.expanded)` rules that affect the right-side result cluster.

**Step 2: Update the numeric cluster sizing**

Change the collapsed-grid layout so the latest value, inline unit, and sparkline can occupy the tile width cleanly instead of sitting in a half-empty row.

**Step 3: Preserve existing lazy unit behavior**

Make sure the change does not disturb the pending unit placeholder or the resolved inline unit behavior.

### Task 2: Verify the page scripts and review the diff

**Files:**
- Modify: `/Users/sps/Documents/GitHub/sull1van.com/tests/tests.html`

**Step 1: Run syntax verification**

Parse the inline scripts with Node to confirm the page still loads cleanly after the layout edit.

**Step 2: Review the diff**

Confirm the final patch is limited to the collapsed grid-card layout behavior requested in the screenshot.
