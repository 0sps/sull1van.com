# Dashboard Tactile Refinement Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refine the FE Study home dashboard with a warm tactile skeuomorphic/neomorphic system while leaving the quiz experience unchanged.

**Architecture:** Scope the new visual language with dashboard-specific class hooks in `app.jsx`, then layer the tactile treatment in `styles.css` with dedicated materials, shadows, and typography. Keep layout and behavior intact so the work is strictly presentational and easy to verify in the browser.

**Tech Stack:** React 18 via Babel, plain CSS, Google Fonts, local browser verification with `python3 -m http.server`

---

### Task 1: Add Dashboard-Specific Hooks

**Files:**
- Modify: `app.jsx`
- Modify: `index.html`

**Step 1: Add dashboard-only class names**

- Add `dashboard-*` classes to the landing-page hero, stat tiles, sidebar panels, footer note, and topic cards.
- Leave quiz and modal markup alone unless a shared helper needs a non-breaking hook.

**Step 2: Add the display font dependency**

Run the edit in `index.html` so the dashboard can use a more refined display face without changing the whole app typography stack.

**Step 3: Reload the page and confirm no behavior changed**

Run: `python3 -m http.server 4173`
Expected: The app still loads and all dashboard buttons remain clickable.

### Task 2: Build the Dashboard Material System

**Files:**
- Modify: `styles.css`

**Step 1: Define dashboard material tokens**

- Add dashboard-specific color and shadow tokens for paper, porcelain, recessed wells, and raised slips.

**Step 2: Restyle the hero and stat tiles**

- Give the hero a sculpted master-panel treatment.
- Restyle stat tiles as inset precision blocks.
- Add scoped heading typography and button treatments for the dashboard only.

**Step 3: Restyle sidebar modules and recommendation slips**

- Make sidebar panels feel recessed.
- Make recommendation/history cards feel like raised note slips placed inside the trays.

**Step 4: Restyle topic cards and subtopic rows**

- Strengthen the topic summary plate.
- Convert subtopic rows into quieter slips with improved spacing and more tactile score tracks.

**Step 5: Preserve responsive behavior**

- Update the dashboard-specific mobile rules so the tactile styling compresses cleanly below `920px`.

### Task 3: Verify and Refine

**Files:**
- Modify: `styles.css` if polish adjustments are needed after review

**Step 1: Check the dashboard locally**

Run: `python3 -m http.server 4173`
Expected: The dashboard renders locally with the new surface hierarchy.

**Step 2: Review at desktop and narrow widths**

Run: open `http://127.0.0.1:4173` in the browser
Expected: Hero, sidebar modules, and topic cards keep their hierarchy without clipping or unreadable buttons.

**Step 3: Do a final CSS pass**

- Reduce any shadow or contrast that feels toy-like.
- Keep the page premium, warm, and readable.

**Step 4: Commit**

```bash
git add app.jsx index.html styles.css docs/plans/2026-04-20-dashboard-tactile-refinement-design.md docs/plans/2026-04-20-dashboard-tactile-refinement.md
git commit -m "feat: refine dashboard tactile surfaces"
```
