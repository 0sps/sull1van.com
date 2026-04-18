# Progressive Loading And Deferred Units Design

**Date:** 2026-04-17

**Problem**

The labs page currently waits for Firebase auth readiness, vault unlock, Firestore fetch, decryption, and UI parsing before meaningful content appears. Units are also not reliable because some biomarkers only have unit text on some historical records.

**Approved Direction**

Restructure the page into three visible stages:

1. Render result skeleton cards immediately on page load.
2. Replace skeletons with real test results as soon as decrypted data has been parsed.
3. Resolve units after the results are already visible, showing a small muted rounded rectangle while unit status is still pending.

**Unit Resolution Rules**

- Treat units as plain text strings.
- For each biomarker, inspect matching historical results from newest to oldest.
- Return the first non-empty unit string found.
- If no point-level unit exists, allow the test-level unit field as a final fallback.
- If no unit exists anywhere for that biomarker, remove the placeholder entirely.
- Never render `null`, `undefined`, or blank unit placeholders as text.

**UI Behavior**

- List view and grid view both show a small gray rounded rectangle in the unit slot while the answer is unresolved.
- Once resolved:
  - if a unit exists, replace the placeholder with the unit text
  - if no unit exists, remove the unit slot so the card looks natural
- Detail view uses the same deferred result in the header and any unit-aware KPI or history display.

**Why This Approach**

- Improves perceived speed by showing the interface immediately.
- Keeps decryption and parsing on the real data path, but moves unit lookup off the critical render path.
- Centralizes the unit fallback logic so the list, grid, detail, export, and chart tooltip all stay in sync.
