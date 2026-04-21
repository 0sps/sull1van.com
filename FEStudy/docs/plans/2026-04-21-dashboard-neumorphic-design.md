# Dashboard Neumorphic Design

**Approved direction:** Warm ivory-and-sage claymorphism for the desktop landing page.

## Intent

The landing page should feel like a sculpted study console rather than a flat dashboard. The visual language should be soft, premium, and tactile, with strong raised and inset surfaces, broad shadow pockets, and gentle internal highlights that make the interface look physically molded.

## Scope

- Overhaul the desktop landing page only.
- Keep quiz, modal, and session behavior unchanged.
- Reuse existing information architecture where possible so the dashboard still feels familiar.

## Visual System

- Base surface: warm paper-clay background with layered radial glow fields.
- Accent family: sage, teal, and muted bronze for progress and emphasis.
- Hero: large sculpted control deck with a prominent headline, framed summary copy, stat wells, and an inset utility rail.
- Sidebar: stacked raised trays with softer inset mini-cards.
- Topic cards: large molded panels with carved summary headers, inset progress rails, and more tactile subtopic rows.
- Buttons and pills: pillowed controls with distinct raised and pressed states.

## Layout Decisions

- Keep the two-column dashboard layout.
- Make the hero more architectural with:
  - a stronger left copy block,
  - a right-side stat cluster,
  - a bottom diagnostic/control rail,
  - ambient decorative orbs and etched grid texture.
- Make topic cards feel denser and more premium with clearer hierarchy between summary, actions, and subtopics.

## Interaction Decisions

- Preserve current click targets and actions.
- Use hover/focus states that deepen or invert the neumorphic depth instead of shifting layout.
- Keep motion subtle and CSS-only.

## Success Criteria

- The dashboard reads as unmistakably neumorphic on desktop.
- The landing page looks significantly more premium and dimensional than the previous warm-card treatment.
- Existing dashboard actions still work with no behavioral regressions.
