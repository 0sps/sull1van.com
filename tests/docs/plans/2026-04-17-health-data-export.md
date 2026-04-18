# Health Data Export Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a new action to the labs results action sheet that exports all decrypted health data to a human-friendly `.xlsx` workbook.

**Architecture:** Reuse the page’s existing auth and vault-unlock flow, then transform the decrypted vault payload into workbook rows on the client. Attach the new export action to the existing action sheet and download the generated file directly in the browser.

**Tech Stack:** Static HTML, browser JavaScript, Firebase Auth, Firestore, Web Crypto, SheetJS CDN

---

### Task 1: Add the export dependency and action-sheet entry

**Files:**
- Modify: `/Users/sps/Documents/GitHub/sull1van.com/tests/tests.html`

**Step 1: Add the browser XLSX dependency**

Insert a script tag in the document head for the SheetJS browser bundle so workbook generation is available in page scripts.

**Step 2: Add the new action-sheet item**

Insert a new sheet action under `Generate PDF Report` labeled `Export all health data to file`.

**Step 3: Wire the click handler**

The new action should close the sheet and call a dedicated export function.

**Step 4: Verify the action is visually consistent**

Ensure the new action matches the surrounding action-sheet structure and icon styling.

### Task 2: Build a workbook exporter from decrypted vault data

**Files:**
- Modify: `/Users/sps/Documents/GitHub/sull1van.com/tests/tests.html`

**Step 1: Add row-builder helpers**

Create small helpers that convert vault tests into:
- flattened result rows
- test summary rows

**Step 2: Add export filename helper**

Generate a stable human-readable filename that includes the current date.

**Step 3: Add the workbook creation utility**

Create an `exportHealthData()` function that:
- loads decrypted vault data
- validates that test data exists
- creates `Results` and `Tests` sheets
- sets readable column widths
- writes the workbook to a file

**Step 4: Reuse existing app feedback**

Use the success toast on success and the confirm dialog on failure.

### Task 3: Verify the export flow

**Files:**
- Modify: `/Users/sps/Documents/GitHub/sull1van.com/tests/tests.html`

**Step 1: Run a syntax-safe check**

Inspect the edited sections and make sure the page script is still valid.

**Step 2: Smoke test the export path**

Verify the new action uses the decrypted vault path and does not attempt to export encrypted Firebase payloads directly.

**Step 3: Review the workbook schema**

Confirm the `Results` and `Tests` columns match the approved design and preserve the important metadata fields.
