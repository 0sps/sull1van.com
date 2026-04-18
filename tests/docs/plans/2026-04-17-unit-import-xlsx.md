# Unit Import From XLSX Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add an in-page XLSX importer that copies non-empty units from an Excel workbook onto every matching historical test point in the encrypted labs vault.

**Architecture:** Use the already-loaded browser XLSX library and existing unlocked-vault helpers. Read the selected workbook in the browser, generate a dry-run summary, confirm with the user, then update matching `point.unit` fields and save through `persistVaultData()`.

**Tech Stack:** Static HTML, browser JavaScript, Firebase Auth, Firestore, Web Crypto, SheetJS CDN

---

### Task 1: Add the import action and file picker plumbing

**Files:**
- Modify: `/Users/sps/Documents/GitHub/sull1van.com/tests/tests.html`

**Step 1: Add a new action-sheet entry**

Add `Import units from XLSX` to the existing action sheet.

**Step 2: Add a hidden file input**

Add an `.xlsx`-accepting file input that can be triggered from the new action.

**Step 3: Add import-in-progress guards**

Prevent duplicate imports while one is already being parsed or saved.

### Task 2: Parse workbook rows and generate a safe preview

**Files:**
- Modify: `/Users/sps/Documents/GitHub/sull1van.com/tests/tests.html`

**Step 1: Parse workbook**

Read the selected file, validate the expected sheet and headers, and extract rows from `TestName` and `Units`.

**Step 2: Build lookup and summary**

Create an exact-name unit map that ignores blank unit values and produce dry-run counts for:
- matched test names
- matching points to update
- blank workbook rows skipped
- workbook names with no matching test

**Step 3: Present confirm dialog**

Use the existing confirm UI to show the summary and require explicit approval before saving.

### Task 3: Apply changes and refresh the page

**Files:**
- Modify: `/Users/sps/Documents/GitHub/sull1van.com/tests/tests.html`

**Step 1: Apply point-level unit updates**

Iterate all tests and all points, copying the mapped unit string to each matching point.

**Step 2: Persist and refresh**

Save through `persistVaultData()`, clear stale render state, reload data, and surface a success toast.

**Step 3: Verify failure handling**

Use the existing confirm dialog for validation and save errors, and reset the file input afterward.
