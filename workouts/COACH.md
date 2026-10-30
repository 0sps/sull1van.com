# Workout coach

The deterministic calculator in `js/coach.js` is shared by the workout logger and progression dashboard. It uses active-season working sets and the same strength calculator as the PR modal.

## Strength-based targets

For each lift, the coach estimates a one-rep max for every valid non-warmup set and takes the highest estimate across the supplied active-season history. It calls `WorkoutStrength.getBestEstimatedOneRepMax()`, the same selector used by `records.js`. The strongest estimate can come from a lighter set with more reps, rather than the heaviest logged load.

The coach converts that maximum into a load for the upper end of the scheduled rep range using `WorkoutStrength.calculateWeightForEstimatedMax()`. Both directions use the exercise's configured formula, with the same Epley fallback as PRs. Both directions use actual reps, including 15- and 20-rep sets and targets. The inverse calculation also uses the fallback if a configured formula is invalid.

The target rounds up to the logger's whole-pound precision, so rounding cannot prescribe a load below the historical strength reference. Equipment increments do not add an arbitrary step to strength-derived targets. Choose an available equipment setting when logging a calculated load.

Example: working sets of 130, 145, 160, and 175 lb for eight reps yield a maximum Epley estimate of 221.67 lb from 175 × 8. The equivalent ten-rep load is 166.25 lb, displayed as 167 lb. Three sets of 130 × 10 do not earn progression against that reference.

An easier recent workout, ramp set, or back-off set cannot lower the season maximum. Recent history still determines confidence, but the confidence window does not restrict the strength reference.

## Completion and progression

The logger marks the first planned row as a warmup. Required working sets default to `max(1, sets - 1)`; callers can override this with `workingSets`. Removing rows cannot reduce the requirement. Optional extra rows cannot undo completed work.

The session prescription is met when the required number of valid working sets reach the recommended load and the lower rep bound. Strength progression is separate: finish the required working-set count and exceed the best season estimated max with a working set. Sets may use different weights and reps, and they do not need to form a consecutive run at the same load. A single new strength mark in an unfinished session does not earn a completed-session increase.

Live evaluation compares entered sets with the frozen historical reference supplied when the target was built. The next target is recalculated from the new best estimate. Historical evaluation compares the newest attempt with prior season attempts, so a saved PR is shown without adding another equipment step.

The Coach modal shows the source set and estimate, working-set completion, and estimated-strength progression. The progression dashboard uses the same calculated prescription. Session load references and season charts use the equivalent upper-rep load from each session's best estimate for strength-based lifts.

## History and exceptional cases

- Only valid dates within the active season and no later than now are used. History is sorted newest first and searched by lift rather than limited to a count of unrelated workouts.
- All matching lift entries within a workout contribute working sets. Warmups are excluded.
- Weights must be finite and positive, and reps must be positive integers. Missing, malformed, negative, and fractional entries cannot set a target or earn completion.
- A warmup-only or incomplete latest attempt stays visible. The season maximum still supplies the weight, and the action asks for a full session.
- A gap longer than `returnAfterDays` (21 by default) is labeled as returning. It does not erase the historical strength reference.
- Numeric ranges and fixed rep counts are supported. Timed entries, AMRAP, reversed ranges, and other text request rep-range setup.
- With no usable history, the coach asks for starting working sets instead of inventing a weight.

Bodyweight exercises and lifts configured with `1repmaxformula: "NONE"` are excluded from Coach recommendations and the progression dashboard. Eligibility also respects `equipment: "Bodyweight"` and `targetMode: "bodyweight"`. These exercises remain available for logging, history, and rep records in the logger.

The shared exercise formula determines strength-based targets. Calendar goals remain chart references and do not force a heavier prescription.

## Loading and verification

Both pages supply their full loaded season history, exercise metadata, season start, plan, and unit/date helpers. The app reads additional season documents when its initial workout window does not cover the season. A failed initial or continuation read blocks workout initialization and offers Retry so incomplete history cannot produce coach recommendations or PRs. Workout saves reject future timestamps, and the PR tracker excludes any future-dated historical records.

`service-worker.js` uses cache `seans-log-v34`. App pages, the coach, strength, and records modules, shared styles, and plans use network-first loading with cached offline fallback.

Run the existing Node tests without launching a browser:

```sh
node --test workouts/tests/*.test.cjs
```

Coach coverage includes ascending loads, strongest-estimate selection, PR formula parity, custom and invalid formulas, actual higher-rep calculations, historical reference retention, invalid inputs, incomplete sessions, live and saved progression, page rendering, and bodyweight and rep-only exclusion. Signed-in persistence and visual browser testing are separate checks.
