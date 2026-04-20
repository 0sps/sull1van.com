# Quiz Button Hierarchy Design

## Goal

Extend the new neumorphic testing language to the key quiz controls so the page hierarchy is legible at a glance and the user feels guided instead of crowded.

## Approved Direction

- `Submit quiz` remains the single strongest action on the page.
- `Mark right` should feel more inviting than `Mark wrong`.
- `Previous` and `Next` should read as recessed navigation controls that belong to the footer tray.
- `Leave quiz` should stay available but visually quiet, with caution-coded treatment rather than strong elevation.
- No motion should be added on hover or click. State changes should be handled through color, border, inset, and shadow treatment only.

## Visual Hierarchy

1. `Submit quiz`
   - Raised and filled.
   - Strongest green presence on the page.
   - Clear primary action.

2. `Mark right`
   - Soft raised green button.
   - Warm, encouraging, clearly actionable.
   - Distinctly secondary to `Submit quiz`, but more welcoming than `Mark wrong`.

3. `Mark wrong`
   - More restrained red-tinted control.
   - Clear but less seductive than `Mark right`.
   - Slightly flatter or more inset-leaning than the positive action.

4. `Previous` / `Next`
   - Recessed into the footer panel.
   - Calm navigation layer, not competing with grading.

5. `Leave quiz`
   - Quiet caution control in the header.
   - Outlined and integrated with the header surface.

## Design Tone

Refined neumorphism:

- Sculpted, not puffy.
- Creamy off-white bases with careful top highlights and tighter shadow edges.
- Strong hierarchy through depth and tint rather than movement.
