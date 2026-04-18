# First Load Reliability And Unit Placement Design

**Date:** 2026-04-18

**Problem**

The labs page can get stuck on its initial skeleton state until the user manually refreshes. The current boot flow allows `loadData()` to return early while auth and vault state are still settling, which can leave the screen waiting for a later event to recover. At the same time, resolved numeric units are still able to appear in a lower card slot instead of consistently living in the top-right latest-result cluster.

**Approved Direction**

Tighten the first-load flow and simplify the unit render path:

1. Make the initial data boot self-healing so auth-ready and vault-ready transitions always lead to a real render without relying on the refresh button.
2. Keep the pending unit placeholder behavior unchanged.
3. Once a numeric unit resolves, render it only beside the large latest-result value in the top-right card cluster for both list and grid layouts.
4. Keep the detail header subtitle line under the test name for resolved units there as well.

**Boot Reliability Rules**

- Treat `loadData()` as an idempotent state transition, not a one-shot attempt.
- Avoid leaving `_loadingInProgress` in a state that blocks later real loads.
- When auth is ready but the user or vault key is not yet available, keep the page in a recoverable waiting state.
- When vault unlock finishes, trigger a fresh render path immediately.
- If the first load fails, show an error while still allowing the next load attempt to proceed normally.

**Unit Rendering Rules**

- Numeric cards keep the lower unit slot only while unit status is `pending`.
- Once a numeric unit is `resolved`, the lower unit slot is removed entirely.
- Resolved numeric units render beside the large latest value, above the sparkline, in both card and grid view.
- Qualitative cards may continue using the separate lower slot because they do not have the same numeric latest-value cluster.
- Detail view continues to show the subtitle-style unit text block beneath the biomarker name.

**Why This Approach**

- It fixes the root cause of the “stuck loading until refresh” behavior instead of hiding it behind retries alone.
- It removes the split numeric-unit presentation so there is one clear place units appear after resolution.
- It preserves the user-approved progressive loading behavior and only tightens the parts that have been flaky or visually off.
