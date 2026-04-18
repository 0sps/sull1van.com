# Unit Import From XLSX Design

**Date:** 2026-04-17

**Problem**

The labs vault is stored as a single encrypted Firestore document and then parsed into UI records in the browser. A workbook at `/Users/sps/Tresors/Sean's tresor/health/blood tests/BTUnits.xlsx` contains authoritative unit strings by exact test name, and those unit strings need to be copied onto every matching historical point in the vault.

**Approved Direction**

Add an on-page XLSX import utility to `tests.html` that runs only after the user is signed in and the vault is unlocked.

The importer will:
- let the user choose an `.xlsx` file from disk
- parse the `Blood Tests` sheet client-side
- build an exact-match lookup from `TestName` to `Units`
- skip rows where `Units` is blank
- iterate through every `test` in `vaultData.tests`
- for every `point` under a matching `test.name`, copy the matched unit string into `point.unit`
- re-encrypt and save the updated vault using the existing `persistVaultData()` path

**Workbook Assumptions**

The workbook currently contains:
- sheet name: `Blood Tests`
- headers: `TestName`, `Units`

The implementation should still validate the sheet and headers so failures are explicit.

**User Flow**

1. Open the labs page and unlock the vault.
2. Open the action sheet.
3. Select `Import units from XLSX`.
4. Choose the workbook file.
5. See a dry-run style summary showing:
- matched biomarker names
- points to update
- rows skipped for blank units
- unmatched workbook names
6. Confirm import.
7. Save the updated encrypted vault and refresh the UI.

**Safety Rules**

- Exact-name matches only
- Trim whitespace from unit values
- Never write blank unit strings
- Do not touch unmatched tests
- Do not save until the user confirms

**Why This Approach**

The page already has the correct auth, decrypt, and encrypted save flow. Keeping the importer in-page avoids terminal-side Firebase credential problems and reduces the risk of writing malformed encrypted data.
