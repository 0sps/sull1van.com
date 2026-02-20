# Premium UI Overhaul Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the /dates/app.html interface into a high-end, atmospheric "Celestial Tracker" with custom typography, reflective glass effects, and orbital motion.

**Architecture:** Use modern CSS (variables, saturate filters, custom gradients) and Vanilla JS to refactor the existing UI while maintaining all current functionality. Introduce a "Nebula" layer and "Glass 2.0" styling for all interactive components.

**Tech Stack:** Vanilla HTML/CSS/JS (Google Fonts: Outfit, Plus Jakarta Sans).

---

### Task 1: Typography & Global Variables Refinement

**Files:**
- Modify: `/Users/sps/Documents/GitHub/sull1van.com/dates/app.html`

**Step 1: Update Google Fonts imports**
Replace the existing Inter import with Outfit and Plus Jakarta Sans.

```html
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&display=swap" rel="stylesheet">
```

**Step 2: Update CSS Variables and Body Styles**
Update `:root` variables to use the new font families and refine system colors.

```css
:root {
    --font-heading: 'Outfit', sans-serif;
    --font-body: 'Plus Jakarta Sans', sans-serif;
    /* ... existing ios colors ... */
}

* {
    /* ... */
    font-family: var(--font-body);
}

.header-title, .sheet-title, .hud-label, .row-title, .card-name {
    font-family: var(--font-heading);
}
```

**Step 3: Commit**
```bash
git add dates/app.html
git commit -m "style: upgrade typography to Outfit and Plus Jakarta Sans"
```

---

### Task 2: Atmospheric Background & Nebula Layer

**Files:**
- Modify: `/Users/sps/Documents/GitHub/sull1van.com/dates/app.html`

**Step 1: Add Nebula HTML element**
Add `<div class="nebula"></div>` and `<div class="vignette"></div>` inside the HTML.

**Step 2: Implement Nebula and Refine Grain CSS**
Create a slow-moving, atmospheric radial gradient nebula and update the grain blend mode.

```css
.nebula {
    position: fixed;
    inset: 0;
    z-index: -4;
    background: radial-gradient(circle at 20% 30%, rgba(10, 132, 255, 0.08) 0%, transparent 50%),
                radial-gradient(circle at 80% 70%, rgba(255, 149, 0, 0.05) 0%, transparent 50%);
    filter: blur(80px);
    animation: nebula-drift 30s ease-in-out infinite alternate;
}

@keyframes nebula-drift {
    from { transform: scale(1) translate(0, 0); }
    to { transform: scale(1.1) translate(20px, 10px); }
}

.grain {
    opacity: 0.05;
    mix-blend-mode: overlay;
}
```

**Step 3: Commit**
```bash
git add dates/app.html
git commit -m "style: add atmospheric nebula and refine grain textures"
```

---

### Task 3: Glassmorphism 2.0 & Reflective Borders

**Files:**
- Modify: `/Users/sps/Documents/GitHub/sull1van.com/dates/app.html`

**Step 1: Update Grid and HUD Card Styles**
Implement the 1px reflective borders and increased saturation for all glass elements.

```css
.grid-card, .hud-card, .ios-list, .app-header-banner {
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%);
    backdrop-filter: blur(24px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-top: 1.5px solid rgba(255, 255, 255, 0.15); /* Reflective highlight */
    box-shadow: 0 8px 32px -8px rgba(0, 0, 0, 0.4);
}
```

**Step 2: Refine Interactive States**
Update hover and active scales to be smoother with the new aesthetic.

**Step 3: Commit**
```bash
git add dates/app.html
git commit -m "style: implement Glassmorphism 2.0 with reflective borders"
```

---

### Task 4: Refined Component Overhaul

**Files:**
- Modify: `/Users/sps/Documents/GitHub/sull1van.com/dates/app.html`

**Step 1: Overhaul Segmented Control**
Make it look more integrated and less "app-like." Use high-contrast active states.

**Step 2: Update Navigation Buttons & Stats Cards**
Update the "Add" button and Stats summary cards to match the new typography and border style.

**Step 3: Commit**
```bash
git add dates/app.html
git commit -m "style: overhaul components with premium orbital aesthetic"
```

---

### Task 5: Solar View Transitions

**Files:**
- Modify: `/Users/sps/Documents/GitHub/sull1van.com/dates/app.html`

**Step 1: Define transition keyframes**
Create the "Solar Switch" animation in CSS.

```css
@keyframes solar-out {
    from { transform: rotateY(0) scale(1); opacity: 1; }
    to { transform: rotateY(5deg) scale(0.95); opacity: 0; }
}
@keyframes solar-in {
    from { transform: rotateY(-5deg) scale(0.95); opacity: 0; }
    to { transform: rotateY(0) scale(1); opacity: 1; }
}
```

**Step 2: Update switchTab JavaScript**
Modify the `switchTab` function to apply these classes before swapping content.

**Step 3: Commit**
```bash
git add dates/app.html
git commit -m "feat: implement Solar View transitions for tab switching"
```
