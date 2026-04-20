# Quiz Surface Hierarchy Design

## Goal

Refocus the testing experience so the question area reads as the clear primary surface, while the surrounding support UI feels quieter and slightly recessed.

## Approved Direction

- Keep the visual emphasis on `.quiz-stage` and `.question-card.quiz-card` by preserving their elevated shadow treatment.
- Remove the raised drop shadows from `.quiz-sidebar-card`, `.quiz-footer-sidebar`, and `.quiz-footer-stage`.
- Replace those support-surface shadows with a refined inset treatment that feels lightly neumorphic rather than flat.
- Restyle `.quiz-header` with a left-weighted green gradient wash that resolves back to the existing header base color by roughly 35% of the width.
- Remove the drop shadow from `.quiz-header` so it participates in the quieter support layer rather than competing with the question card.

## UX Intent

The page should read in layers:

1. The question card is the hero surface.
2. The sidebar and footers are supportive controls recessed into the page.
3. The header sets tone and orientation without visually popping forward.

## Notes

- The inset treatment should feel polished, not toy-like: soft inner shadow, subtle highlight, restrained contrast.
- The header gradient should start gently green on the left and fade quickly into the existing warm off-white tone without becoming a banner.
