# Dashboard Quiet Luxury Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rework the FE Study home dashboard so it feels quieter, more refined, and less effect-heavy while preserving the existing structure and behavior.

**Architecture:** Keep the existing dashboard-specific class hooks and replace the current tactile rules in `styles.css` with a more restrained system: simpler hero, quieter stat tiles, flatter sidebar support modules, cleaner recommendation cards, and toned-down topic surfaces. Keep changes CSS-first so the redesign is easy to iterate and isolated from the quiz UI.

**Tech Stack:** React 18 via Babel, plain CSS, Google Fonts, live browser verification

---

### Task 1: Document The Revised Direction

**Files:**
- Create: `docs/plans/2026-04-20-dashboard-quiet-luxury-design.md`
- Create: `docs/plans/2026-04-20-dashboard-quiet-luxury.md`

**Step 1: Record the revised design**

- Capture the quieter aesthetic direction, the removal of the multicolor recommendation bars, and the emphasis on restraint.

**Step 2: Save the implementation plan**

- Describe the CSS-focused execution path and visual priorities.

### Task 2: Replace The Overstated Dashboard Surface Rules

**Files:**
- Modify: `styles.css`

**Step 1: Simplify the hero**

- Remove decorative framing and excessive glow.
- Keep the heading elegant and spacious.

**Step 2: Tone down stat tiles and buttons**

- Remove ornamental accent bars.
- Reduce button puffiness and make controls feel cleaner.

**Step 3: Flatten the sidebar support layer**

- Remove the recommendation-card top stripes.
- Make sidebar modules quieter than the main topic cards.

**Step 4: Refine the topic cards**

- Keep them prominent, but reduce the stylized header plating and individual subtopic widget feel.

**Step 5: Preserve mobile quality**

- Update the dashboard mobile overrides so the quieter system still holds together on narrow widths.

### Task 3: Verify Live Rendering

**Files:**
- Modify: `styles.css` if final polish is needed

**Step 1: Refresh the pushed dashboard**

Run: open the live FE Study dashboard and refresh
Expected: The new CSS appears on the landing page.

**Step 2: Review the recommendation cards and topic stack**

Expected: No multicolor top bars remain, and the page feels calmer and more cohesive.

**Step 3: Do a final polish pass**

- Remove any remaining surfaces that feel overly beveled, glossy, or forced.
