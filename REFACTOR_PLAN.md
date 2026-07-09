# Styling & Jekyll Consolidation Plan

Goal: fix the fragmentation in theming, layouts, and CSS **with zero change to what
visitors see or how the pages behave**. Every phase ends with a verification step;
the final phase is a full visual regression pass.

Guiding rule: we are moving code, not redesigning. Rendered pixels, theme-toggle
behavior, animations, and mobile behavior must be identical before and after.

---

## Phase 0 — Baseline capture (do first, before touching anything)

1. `jekyll build` and copy `_site/` to `_site_baseline/` (outside the repo or
   gitignored) as the reference build.
2. Capture reference screenshots of every page type in every theme state:
   - Pages: home, about, one tag page, and each of the 7 posts.
   - States: OS-light (no toggle), OS-dark (no toggle), forced-dark via toggle,
     forced-light via toggle.
   - Widths: ~1280px desktop and ~390px mobile.
3. Note the interactive behaviors to re-verify manually at the end:
   - Theme toggle (first click flips opposite of OS, persists in localStorage, no flash on reload).
   - Note-card expand/collapse animation (0.3s grid animation, scroll position preserved).
   - Mini-TOC: desktop fisheye hover, drag scrubbing, track click; mobile reveal
     at 3s, 5s dismiss, keep-alive taps, scroll-up re-summon, touch scrubbing.
   - Post accent-color gradient (light + dark).
   - "Switch to desktop" hint on mobile posts.

---

## Phase 1 — Single-source theme palette with CSS custom properties

**Problem:** every color is defined 3–4 times: light values in `main.css`/`extra.css`,
dark values in their `@media (prefers-color-scheme: dark)` blocks, then the whole
palette duplicated again as `html[data-theme="dark"]` and `html[data-theme="light"]`
override blocks inline in `_layouts/default.html` (~150 lines).

**Fix:** define each color once as a variable; theme switching just reassigns variables.

### 1.1 Build the palette inventory

Extract every light/dark color pair currently in use:

| Variable | Light | Dark |
|---|---|---|
| `--bg` | `#fff` | `#151515` |
| `--fg` | `#333` | `#e6e6e6` |
| `--link` | `#00e` | `#9bf` |
| `--link-visited` | `#518` | `#a9f` |
| `--link-hover` | `#03f` | `#9cf` |
| `--link-active` | `#a00` | `#f99` |
| `--block-bg` (blockquote/pre/kbd/.highlight) | `#eee` | `#000` |
| `--block-shadow` | `none` | `0 0 0.5em #333` |
| `--blockquote-border` | `#ccc` | `#333` |
| `--code-fg` | `#050` | `#9c6` |
| `--samp-fg` | `#730` | `#db0` |
| `--kbd-border` | `#ccc` | `#333` |
| `--hr-border` | `#999` | `#666` |
| `--table-border` | `#999` | `#666` |
| `--img-soft-opacity` | `0.8` | `0.7` |
| `--img-lightshadow` | `0 0 0.5em #999` | `none` |
| `--hl` | `#808` | `#f9c` |
| `--toggle-border` | `#888` | `#aaa` |
| `--toggle-gradient` | `linear-gradient(to right,#fff 50%,#333 50%)` | `linear-gradient(to right,#ccc 50%,#222 50%)` |

(`pre .cursor` colors too if kept — see Phase 4.4.)

### 1.2 Write the three palette blocks in `main.css`

```css
:root { /* light values */ }

/* OS prefers dark AND user hasn't forced light */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) { /* dark values */ }
}

/* user forced dark */
:root[data-theme="dark"] { /* dark values, same list */ }
```

This exactly reproduces the current cascade: media-query dark applies by default
on dark OS, `data-theme="light"` opts out of it, `data-theme="dark"` forces dark
on light OS. (The two dark blocks are an unavoidable ~20-line duplication of
*variable assignments only* — CSS can't OR a media query with a selector — but
it replaces ~150 lines of duplicated *rules*.)

### 1.3 Convert rules to variables

- In `main.css` and `extra.css`, replace every hardcoded color with its `var(--x)`.
- Delete the entire `@media (prefers-color-scheme: dark)` rule-override blocks at
  the bottom of both files (their values now live in the palette block).
- Keep the non-color dark-mode behaviors (`.light`/`.dark` display swap) working:
  drive them off variables too (`--display-light: block; --display-dark: none;`
  flipped in the dark palettes), or keep them as the one remaining
  media-query/data-theme special case. Prefer the variable approach so there is
  exactly one theming mechanism.

### 1.4 Gut `_layouts/default.html`

- Delete the entire `html[data-theme="dark"] { ... }` and
  `html[data-theme="light"] { ... }` inline override blocks (~150 lines).
- Keep only: the `.theme-toggle` button rule (converted to variables and moved
  into `main.css`), the flash-prevention inline script (must stay inline in
  `<head>`), and the accent-color block (see 1.5).
- The toggle JS at the bottom of `<body>` is unchanged.

### 1.5 Simplify the accent-color block

The `{% if page.accent_color %}` block currently repeats the gradient 4 times
(default, dark, light, media-query dark). With the palette in place, `--bg`
already resolves to the correct page background in every theme state, so it
collapses to:

```css
:root { --accent-color: {{ page.accent_color }}; }
body {
  background-color: var(--bg);
  background-image: linear-gradient(to bottom,
    color-mix(in srgb, var(--accent-color) 50%, var(--bg)) 0%,
    var(--bg) min(50%, 1000px));
  background-repeat: no-repeat;
}
```

No `!important`, no per-theme copies. Note: the current light-mode gradient fades
to `transparent` over white rather than to `#fff`; visually identical since body
bg is white, but verify against baseline screenshots to be safe.

This block must stay in the layout (it's per-page Liquid), but shrinks from ~50
lines to ~12.

### 1.6 Fix the accent_color data inconsistency

`_posts/2026-05-19-Best-liver-of-all-time.md` uses 8-digit hex `#62cf98ff`
(alpha `ff` = fully opaque). Change to `#62cf98`. Identical rendering.

**Verify:** rebuild, screenshot-diff all pages in all 4 theme states. Confirm
toggle first-click behavior and no-flash reload still work.

---

## Phase 2 — Extract note-card and mini-TOC out of `post.html`

**Problem:** `_layouts/post.html` is 745 lines; ~700 are two self-contained
components (note-card + mini-TOC) with inline `<style>`/`<script>`. The layout
is unreadable and every post page carries the code inline instead of cached files.

**Fix (pure relocation, no logic changes):**

1. Create `_includes/note-card.html` — the note-card `<style>` + `<script>`
   moved verbatim.
2. Create `_includes/mini-toc.html` — the mini-TOC markup (`#mini-toc-scrollbar`
   div) + its `<style>` + `<script>` moved verbatim.
3. Create `_includes/post-meta.html` (optional) — the byline + mobile-desktop
   hint block, if further slimming is wanted.
4. `post.html` becomes ~30 lines:

```liquid
---
layout: default
---
<h1>{{ page.title }}</h1>
{% include post-meta.html %}
{{ content }}
<div> ...tags/comments links... </div>
{% include note-card.html %}
{% include mini-toc.html %}
```

**Ordering constraint:** keep the includes in the same relative position they
occupy today (after `{{ content }}`), so DOM order, CSS cascade order, and
`DOMContentLoaded` handler registration order are unchanged.

**Optional step further (still zero visual change):** move the two components'
CSS into `assets/css/main.css` (or a `post.css`) and JS into
`assets/js/note-card.js` / `assets/js/mini-toc.js` loaded with `defer`. Benefits:
browser caching across posts. Risk: `defer` vs inline changes execution timing
slightly; both scripts already wait for `DOMContentLoaded`, so behavior is safe,
but do this as its own commit so it can be reverted independently. The dark-mode
color rules inside these components should be converted to the Phase 1 variables
(e.g. `--note-card-bg`, `--note-card-border`) while moving — the note-card
currently has its own triple light/dark/media-query blocks that collapse into
palette entries.

**Verify:** rebuild; on a post with note-cards (`2026-07-04`) test
expand/collapse animation + scroll anchoring; on a long post (`2026-05-19`)
test all mini-TOC behaviors desktop and mobile; confirm short posts
(`welcome-to-my-blog`, <2 headings) still show no TOC.

---

## Phase 3 — Merge `extra.css` into `main.css`

**Problem:** `extra.css` (figures, tables, boxes, image treatments) is core
content styling but loads only when `page.layout == 'post'`. A table or figure
on `about.md`, the home page, or a tag page would render unstyled — a latent
inconsistency.

**Fix:**

1. Append `extra.css` contents to `main.css` (post-Phase-1, i.e. already
   variable-ized, with its dark-mode block absorbed into the palette).
2. Delete `assets/css/extra.css`.
3. Remove the conditional `<link>` from `_includes/head.html`.

**Safety check (already confirmed):** no non-post page currently uses any
selector from `extra.css` (no tables, figures, `.box`, `.light`/`.dark`, etc.
in `about.md`, `index.html`, or tag pages), so newly applying these rules
site-wide changes nothing rendered today.

**Verify:** screenshot-diff home/about/tag pages; spot-check tables and figures
in the chargers and blood-tests posts.

---

## Phase 4 — Dead weight and small bugs

All confirmed unreferenced by grep across the blog (excluding `200rhs/`,
`FEStudy/`, `workouts/`, `labs/`, which don't reference them either):

1. **Favicon 404:** `_includes/head.html` links `/favicon.png`, which doesn't
   exist. Change to:
   `<link rel="icon" href="{{ site.baseurl }}/favicon.ico">`
   (Browsers currently fall back to `/favicon.ico` anyway, so the visible icon
   is unchanged — this just kills the 404.)
2. **Delete `jquery.js`** (89 KB at site root, zero references anywhere in the
   repo).
3. **`dozen.txt`** (66 KB at root, zero references). Confirm it isn't shared as
   a raw URL anywhere external before deleting; if unsure, move it out of the
   repo rather than delete.
4. **Prune vestigial CSS** (optional, do as its own commit): `samp`, `kbd`,
   `pre .cursor`, `.ctrl-l`, `.wrap`, `.question`, `.mono`, `table.grid`,
   `table.ruled`, `table.top`, `.box`, `.hl`, `a:empty` heading-anchor rules,
   `audio`, `noscript div` — none are used by any current post, draft, or page.
   Two options:
   - **Conservative (recommended):** keep them. They're inherited from the Susam
     theme and may be wanted for future posts; after Phase 1 they no longer
     carry duplication cost. Cost is ~60 lines.
   - **Aggressive:** delete them. If a future post needs one, restore from git.
   Either way, do NOT delete anything used by drafts in `drafts/`.
5. **`.gitignore`:** add `.DS_Store` (a 34 KB one is committed at root) and
   `_site_baseline/`.

**Verify:** rebuild; confirm no 404s in browser devtools network tab on a post
page and the home page.

---

## Phase 5 — Per-post CSS consolidation (highest care, do last)

**Problem:** posts embed large bespoke `<style>` blocks (chargers: 42 blocks in
1,741 lines; blood-tests: ~29; BLOAT: ~11), and patterns repeat across posts:

- The `1fr` → `1fr 1fr` → `2.2fr 1fr` responsive grid appears in both
  `2026-05-18-tracking-blood-tests.md` and `2026-05-19-Best-liver-of-all-time.md`.
- BLOAT hand-rolls a `.mobile-toc` box even though the layout ships a mini-TOC.
- Each block re-implements dark-mode with varying completeness (some handle
  `[data-theme]` + media query, some only one), so per-post elements behave
  inconsistently under the theme toggle today.

**Approach — extract only what repeats; leave true one-offs inline:**

1. Create `assets/css/components.css` (or a section in `main.css`) with shared,
   variable-ized classes. Candidates:
   - `.post-grid` (the responsive 1/2-column → `2.2fr 1fr` layout), parameterized
     with modifier classes if the two posts' breakpoints differ.
   - `.mobile-toc` (the BLOAT table-of-contents box).
   - The tooltip-card pattern from blood-tests, if it's wanted in future posts.
2. Migrate one pattern per commit: move the CSS, update the post's markup
   classes, screenshot-diff that post in all theme states before moving on.
3. **Do not touch** the chargers post's device-review markup or the
   self-driving-car post's parallax backgrounds beyond converting raw colors to
   palette variables where they reference theme colors — those are legitimate
   one-off art direction.
4. While in each `<style>` block, normalize its dark-mode handling to the
   Phase 1 variable system so per-post elements respond to the toggle the same
   way the rest of the site does. Where a post currently *lacks* a
   `[data-theme]` override (i.e. its element ignores the toggle today), decide
   per case: matching current behavior exactly means leaving it; fixing it is a
   (desirable) user-visible change and should be listed separately, not smuggled
   into this refactor.

This phase is optional and separable — Phases 1–4 deliver most of the
consolidation value at near-zero risk.

---

## Phase 6 — Final verification

1. `jekyll build`; `diff -r` the new `_site/` against `_site_baseline/`.
   Differences should be exactly: relocated CSS/JS (inline → files), the merged
   stylesheet links, favicon href, and deleted dead files. No content or markup
   ordering changes beyond those.
2. Repeat the full Phase 0 screenshot matrix (pages × 4 theme states × 2 widths)
   and compare against baseline. Target: pixel-identical.
3. Manually re-run the interactive checklist from Phase 0 step 3.
4. Check devtools console + network on home, about, a tag page, and each post:
   no JS errors, no 404s.
5. Confirm `feed.xml` and `sitemap.xml` still generate (plugins unaffected, but
   cheap to check).

---

## Suggested commit sequence

1. `chore: baseline, gitignore .DS_Store`
2. `refactor(css): single-source theme palette via custom properties` (Phase 1)
3. `refactor(layout): extract note-card and mini-toc includes` (Phase 2)
4. `refactor(css): move component styles/JS to cached assets` (Phase 2 optional)
5. `refactor(css): merge extra.css into main.css` (Phase 3)
6. `fix: favicon link; remove unused jquery.js` (Phase 4)
7. `refactor(css): shared post components (.post-grid, .mobile-toc)` (Phase 5, one commit per pattern)

Each commit builds and passes the screenshot check independently, so any step
can be reverted without unwinding the rest.

## Expected outcome

- `_layouts/default.html`: ~178 → ~60 lines (toggle script + accent block only).
- `_layouts/post.html`: 745 → ~30 lines.
- One stylesheet, one theming mechanism, every color defined once.
- No visual or behavioral change for visitors; identical URLs; identical feed.
