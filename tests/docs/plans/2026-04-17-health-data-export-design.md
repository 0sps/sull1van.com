# Health Data Export Design

**Date:** 2026-04-17

**Problem**

The labs page stores health data in Firestore as an encrypted vault payload. Users need an understandable way to export all decrypted health data from the existing test results page without introducing a second backend access path or weakening the encryption-at-rest model.

**Approved Direction**

Add a new item to the existing three-dot action sheet in `tests.html` under `Generate PDF Report` named `Export all health data to file`.

When selected, the page will:
- close the action sheet
- ensure the vault is already unlocked on the current page
- use the in-memory decrypted vault payload (`_vaultDataCache`) or reload it through the existing `loadVaultData()` path
- generate a human-friendly `.xlsx` workbook in the browser
- trigger a local file download

**Why This Approach**

The current page already authenticates the user, unlocks the vault, and decrypts the Firestore payload client-side. Reusing that decrypted payload is the safest and simplest way to export plaintext data because:
- Firebase remains encrypted at rest
- no new backend endpoint is required
- the export exactly reflects the data the page is already rendering

**Workbook Shape**

The export will produce an `.xlsx` file with two sheets:

1. `Results`
One row per test result point with human-readable columns:
- Test Name
- Category
- Date
- Result
- Numeric Value
- Unit
- Reference Range
- Type
- Lab
- Source File
- Test Result ID

2. `Tests`
One row per biomarker/test definition with summary metadata:
- Test Name
- Category
- Type
- Unit
- Default Range
- Total Results
- First Date
- Last Date

**Implementation Notes**

- Use a browser-side XLSX library so the export can happen fully client-side.
- Keep the export utility close to the existing vault-loading logic in `tests.html`.
- Use the raw decrypted vault payload as the source of truth, then derive human-friendly rows for the workbook.
- Show success and failure feedback using the page’s existing UI patterns.

**Non-Goals**

- No JSON export
- No CSV export
- No raw decrypted JSON worksheet
- No new Firestore schema or new server endpoint
