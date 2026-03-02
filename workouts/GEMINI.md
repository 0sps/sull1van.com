# GEMINI.md — Workout Tracker Codebase Guide

> **Purpose:** Help any developer or AI agent quickly understand this codebase's architecture, gotchas, and conventions so they can make changes confidently.

>**YOUR purpose in assisting with this codebase:** Help the developer improve it in any way possible. think hard, and work thoroughly. you are very experinced at development work so you should do great with this codebase.
---

## Architecture at a Glance

This is a **single-file PWA** (`app.html`, ~3,700 lines) with:

- **Vanilla HTML/CSS/JS** — no frameworks, no build step
- **Firebase Firestore** for cloud persistence (all workout logs)
- **Google Auth** for login (handled in `index.html`, session checked here)
- **localStorage** for in-progress workout data (write-ahead cache, expires after 24h)
- **Two JSON data files** loaded at runtime:
  - `exercises.json` — exercise library (IDs, names, muscles, instructions, CSV export metadata)
  - `training-plan.json` — weekly schedule mapping days → workouts → exercises

### File Structure

```
workouts/
├── app.html              ← The entire app (CSS + HTML + JS in one file)
├── index.html            ← Login page (Google Auth)
├── exercises.json        ← Exercise definitions (id → metadata)
├── training-plan.json    ← Weekly schedule + workout definitions
├── manifest.json         ← PWA manifest
├── service-worker.js     ← Offline caching
├── sean.jpg              ← User photo
├── apple-touch-icon.png  ← iOS icon
└── maskable-icon.png     ← Android icon
```

---

## Critical Gotchas

### 1. Two `<script>` blocks with different scoping

Firebase imports are in a **`<script type="module">`** block. The main app logic is in a regular **`<script>`**. ES modules are scoped, so Firebase functions are bridged to the global scope via `window.firebase*` assignments. **Do not try to use Firebase imports directly in the main script block — they won't be available.**

The manual log logic lives in a **third `<script>`** block (also non-module), with its functions explicitly assigned to `window.*` for the same reason.

### 2. Weight storage: kg internally, lbs for display

| Layer | Unit |
|-------|------|
| User input | **lbs** (default `weightUnit = 'lbs'`) |
| Firestore storage | **kg** (converted via `lbsToKg()` before save) |
| Display | **lbs** (converted back via `displayWeight()` → `kgToLbs()`) |
| CSV export | **kg** (raw stored value) |

**Always check which unit context you're in before doing math.** The `normalizeWeightToLbs()` helper exists for volume calculations on user-entered data.

### 3. `exerciseId` vs `id` — the naming inconsistency

This is the single most confusing thing in the codebase:

| Context | Field name | Example |
|---------|-----------|---------|
| `training-plan.json` exercises | `id` | `"id": "ex001"` |
| `getWorkoutData()` output | `exerciseId` | `{ exerciseId: "ex001", sets: 4 }` |
| Saved workout logs | `id` | `{ id: "ex001", name: "..." }` |
| Edit modal data | `id` | `{ id: "ex001", sets: [...] }` |

**When reading exercise IDs from saved logs, always use `ex.id` (not `ex.exerciseId`).** The training plan's `getWorkoutData()` is the only place that uses `exerciseId`.

### 4. Exercise keys are day-scoped

In `currentExerciseData` and `currentSetCounts`, exercise keys follow the pattern:

```
`${currentWorkoutDay}_${exerciseId}`   // e.g., "0_ex001"
```

This prevents collision when the same exercise appears on multiple days (e.g., Cable Lateral Raise in both PUSH A and PUSH B).

### 5. The `multiplier` field in exercises.json

Some exercises have `multiplier: 2` (e.g., Dumbbell Shoulder Press, Incline Dumbbell Curl). This is for **unilateral dumbbell exercises** — you log the weight of one dumbbell, and the multiplier tells the CSV export app that actual volume = weight × 2. The multiplier is **only used in CSV export**, not in internal volume calculations.

### 6. `exercises.json` is incomplete by design

Many exercises have empty `muscles`, `category`, `equipment`, and `instructions` fields. This is intentional — the owner fills these in over time. The exercises used in the active training plan are the most complete. Don't treat empty fields as bugs.

---

## How the Tab System Works

Tabs are controlled by `setupTabs()` which uses `style.display` toggling:

- **Visible tab:** `style.display = 'block'`
- **Hidden tab:** `style.display = 'none'`
- **Initial state:** Most tabs start with `display: none` via CSS classes (`no-display`, or the plan/library `.active` pattern)

> [!IMPORTANT]
> When checking if a tab is visible, always use `=== 'block'`, **not** `!== 'none'`. On first load, `style.display` is `""` (empty string), which passes `!== 'none'` but the tab isn't actually visible.

---

## Data Flow

### Saving a Workout
```
User fills inputs → currentExerciseData (in-memory)
                   → localStorage (auto-save on every change)
                   → "Complete Workout" button
                   → validateAndCleanWorkout() strips 0-rep sets
                   → if empty sets found → zeroRepsModal confirmation
                   → lbs→kg conversion
                   → saveToFirebase() → Firestore doc (id = Date.now())
                   → workoutLogs.unshift() (local array update)
                   → invalidateStatsCache() + refreshUI()
                   → clearWorkoutProgress() (remove localStorage)
```

### Loading Data
```
init() → Firebase auth check
       → loadExerciseData() (exercises.json)
       → loadTrainingPlan() (training-plan.json)
       → loadFromFirebase(60) (last 60 workouts, ordered by date desc)
       → render everything
```

The history tab has a "LOAD ALL HISTORY" button that calls `loadFromFirebase(0)` to fetch everything. This is intentionally lazy to minimize Firestore reads.

---

## Performance Patterns

### Render Batching
`scheduleRender()` uses `requestAnimationFrame` to deduplicate DOM updates. Call `refreshUI(['exercises', 'logs', 'stats'])` instead of calling render functions directly.

### Stats Caching
`updateStats()` uses a versioned cache (`cachedStats` + `cachedStatsVersion`). Call `invalidateStatsCache()` whenever workout data changes — never modify `cachedStatsVersion` directly.

### Log Calculation Cache
`calculateTotalSets()` and `calculateTotalVolume()` cache results per log ID in `logCalculationCache`. Call `invalidateLogCache(logId)` for a specific log or `invalidateLogCache()` to clear all.

---

## Streak Calculation Logic

The streak counter in `updateStats()` walks backward up to 365 days with these rules:

- **Workout logged on that day** → streak increments
- **Rest day** (per training plan schedule) → streak continues but doesn't increment
- **Today with no workout yet** → gets a pass (you might still work out)
- **Missed non-rest day** → streak breaks

---

## Event Handling

Uses **event delegation** via `setupEventHandlers()` — one global click handler on `document` routes to the right function based on CSS classes and `data-*` attributes. Modes tracked via `data-mode`:

| Mode | Context |
|------|---------|
| `workout` | Today's workout inputs |
| `edit` | Edit modal for past workouts |
| `manual` | Manual log modal |

---

## Common Modification Patterns

### Adding a new exercise
Add entry to `exercises.json` with a unique `ex###` ID. If adding to a workout, reference that ID in `training-plan.json`.

### Changing the weekly schedule
Edit the `schedule` array in `training-plan.json`. **Must have exactly 7 entries** (Sun–Sat). Use `"REST"` for rest days. The plan view labels now derive from this dynamically.

### Adding a new modal
1. Add HTML overlay with `class="modal-overlay" id="yourModal"`
2. Inner div with `class="modal"`
3. Open/close via `openModal('yourModal')` / `closeModal('yourModal')`
4. Clicking the overlay backdrop auto-closes (handled by event delegation)

### Adding a new tab
1. Add `<button class="nav-tab" data-tab="yourTab">` in the nav
2. Add `<div id="yourTabTab" class="tab-content no-display">` for content
3. Add the display logic in `setupTabs()` — set `style.display = 'block'`

---

## CSV Export Format

The export targets compatibility with external fitness apps. Format:

```
Date,Exercise,Reps,Weight(kg),Duration(s),Distance(m),Incline,Resistance,isWarmup,Note,multiplier
```

- **Date** format: `YYYY-MM-DD HH:MM:SS +0000`
- **Exercise** uses `exportName` from exercises.json (may differ from display name)
- **Weight** is stored kg value (no conversion)
- **multiplier** comes from exercises.json (`1` for bilateral, `2` for unilateral dumbbell)

---

## Things to Watch Out For

1. **No user-scoped queries** — Firestore queries hit `collection('workouts')` globally. Security relies on Firebase Security Rules, not client-side filtering.
2. **`Date.now()` as document IDs** — Log IDs are timestamps. `compareLogIds()` does string comparison, so always use it instead of `===`.
3. **The first set defaults to warmup** — `isWarmup` defaults to `true` for index 0 sets unless overridden by saved data.
4. **`getWorkoutData()` returns a rest day object for unknown schedule entries** — If a schedule value doesn't match any workout key, it returns `{ name: 'REST DAY', exercises: [] }`.
