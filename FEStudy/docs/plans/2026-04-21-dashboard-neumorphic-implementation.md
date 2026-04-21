# Dashboard Neumorphic Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the dashboard landing page into a warm, deeply neumorphic desktop experience without changing dashboard or quiz behavior.

**Architecture:** Keep the React data flow intact and limit markup changes to the dashboard-facing sections in `app.jsx`. Drive the visual overhaul through dashboard-scoped CSS so quiz and modal flows remain stable while the landing page gets a distinct sculpted shell, raised cards, inset wells, and tactile controls.

**Tech Stack:** React 18 via Babel, plain JSX, plain CSS

---

### Task 1: Capture the new dashboard shell structure

**Files:**
- Modify: `app.jsx`

**Step 1: Update the dashboard hero markup**

- Add decorative and structural wrappers for the hero surface.
- Group the headline and intro into a content well.
- Group the primary and utility actions into a sculpted control rail.

**Step 2: Update the hero stats cluster**

- Add richer stat-card labels and supporting text hooks.
- Introduce a small summary deck for readiness messaging.

**Step 3: Keep existing actions and data bindings unchanged**

- Preserve `startDiagnostic`, import/export/reset, and resume behavior.
- Avoid changes to state shape or event flow.

### Task 2: Make the dashboard panels and topic cards more architectural

**Files:**
- Modify: `app.jsx`

**Step 1: Add dashboard-only wrapper classes**

- Add semantic hooks for sidebar trays, recommendation cards, topic headers, action bars, and subtopic rows.

**Step 2: Improve hierarchy in topic cards**

- Split summary copy, metrics, and action clusters more clearly.
- Add dashboard-only helper copy where needed.

**Step 3: Leave session, topic detail, and quiz logic intact**

- Do not alter question flow or grading behavior.

### Task 3: Replace the dashboard visual treatment with warm claymorphism

**Files:**
- Modify: `styles.css`

**Step 1: Introduce dashboard-specific surface tokens**

- Add a richer set of dashboard variables for raised, inset, and pressed states.

**Step 2: Restyle the hero**

- Add layered background gradients, large shadow pockets, inner highlights, and desktop-oriented composition.

**Step 3: Restyle dashboard panels, mini-cards, topic cards, and controls**

- Use deep outer shadows plus inner highlights for raised pieces.
- Use inset shadows for rails, wells, progress tracks, and utility strips.
- Make buttons and chips feel pillowed and tactile.

**Step 4: Tighten desktop responsiveness**

- Ensure the new hero and topic layouts adapt cleanly at tablet and mobile breakpoints.

### Task 4: Verify the overhaul

**Files:**
- Modify: `app.jsx`
- Modify: `styles.css`

**Step 1: Check JSX syntax and class-name consistency**

Run: `rg -n "dashboard-" app.jsx styles.css`
Expected: matching dashboard hooks present in both files

**Step 2: Verify there are no broken references**

Run: `node -e "new Function(require('fs').readFileSync('app.jsx','utf8'))" 2>/dev/null || true`
Expected: manual inspection fallback if Babel-only syntax prevents direct parse

**Step 3: Review the dashboard visually in code**

- Confirm the hero, sidebar panels, stat cards, and topic cards all use the new dashboard-scoped structure and styles.
