# Grid Card Width Design

**Date:** 2026-04-18

**Problem**

In collapsed grid view, several numeric biomarker cards look like their content is cut off halfway across the tile. The right half of the card is visually empty because the latest-value stack is being laid out inside a row that reserves extra space instead of letting the value cluster use the tile naturally.

**Approved Direction**

Adjust the collapsed grid-card layout so the numeric result cluster fills the tile more cleanly without changing the existing hierarchy:

1. Keep the biomarker name anchored at the top-left.
2. Keep the large latest value, inline unit, and sparkline grouped together.
3. Let that grouped numeric content use the available tile width instead of appearing stranded on the left side of the lower half.
4. Preserve list view, expanded cards, and the approved lazy-unit behavior.

**Layout Rules**

- Apply the change only to collapsed grid cards.
- Use the existing latest-value stack rather than introducing a second layout path.
- Avoid changing the meaning of the card or the position of the sparkline.
- Keep the design compact enough for long biomarker names and multi-character units.

**Why This Approach**

- It fixes the visual imbalance at the layout level instead of shrinking or hiding content.
- It preserves the current card design language while making the tiles feel properly filled.
- It keeps the change tightly scoped to the exact view shown in the screenshot.
