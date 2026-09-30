# Workout coach

The coach is a deterministic calculator in `js/coach.js`. It runs in the browser and explains the next workout using saved working sets. It has no model API or background service. The workout logger and progression dashboard use the same calculator.

## What changed

The previous calculator could convert the best estimated max from two sessions into a recommended load. It also allowed a single set's estimated strength to earn progression when the rest of the session missed the rep range. Its history helpers mixed season filtering with a limit of 14 workout documents, which could exclude a lift just because other workouts were more recent. The recommendation and progression dashboard used different targets and different definitions of success.

The new recommendation starts with the latest attempt for the specific lift. A session must include the required working sets before it can earn an increase. Estimated maxes remain available for charts and records, while increases follow the actual working sets. Season goals provide context below the workout prescription.

## Inputs and history

- `app.html` supplies its complete loaded active-season record history, not just the home screen's recent list. The existing history loader reads additional season documents when the initial 60-workout window does not cover the season.
- `progression.html` supplies the season logs it queries from Firestore.
- Both supply exercise metadata, the active season start, progression configuration, and unit/date formatters.
- The module independently validates dates, removes pre-season and future workouts, and sorts newest first. It finds the lift throughout the supplied history rather than truncating the overall workout list.
- All matching exercise entries within a workout contribute working sets. Rows marked as warmups are excluded.
- Missing weights remain missing. Explicit zero weight is accepted only for a progression entry configured with `targetMode: "bodyweight"`. Positive whole-number reps are required. Decimal reps and malformed strings are invalid.
- A warmup-only or partly entered latest attempt stays in the history. It cannot be skipped to recover an older earned increase.

## Set counts and rep ranges

The logger currently creates the training plan's number of rows and marks the first row as a warmup. The default required working-set count is therefore `max(1, sets - 1)`. A caller can supply `workingSets` explicitly to override that convention. Adding rows does not reduce the requirement. All entered working rows must meet the rep/weight rule, including extra rows. Removing rows cannot earn an increase below the planned count.

Numeric ranges such as `6-10` and `12-20`, or a fixed rep target such as `8`, are supported. Timed entries, AMRAP, reversed ranges, and other text request plan setup instead of guessing a load.

When a lift appears multiple times in the week, the dashboard chooses its next scheduled occurrence, starting with today. Its set count and rep range then agree with the next workout. Today’s focus uses today's actual exercise entries, including their individual set counts.

## Decision order

The latest usable working weight is the lightest valid working-set load in the newest attempt containing a valid load. A failed lower-load set contributes to that weight. If the newest attempt has no usable load, earlier usable history supplies a repeat weight while the newest attempt remains visible as incomplete.

| Condition | Next workout | Explanation |
| --- | --- | --- |
| Unsupported rep prescription | Set a numeric range | No invented load |
| No valid working weight in the season | Choose a starting weight | Log all required working sets to establish history |
| Latest attempt more than 21 days ago | Repeat the last working weight | Rebuild the rep range before increasing |
| Latest attempt lacks required valid working sets | Repeat the working weight | Finish a full session before increasing |
| Every working set reaches the top of the range at the working weight | Add one configured step | Start the next workout at the bottom of the range |
| Two complete recent attempts at the same load each miss the minimum on at least one set | Suggest one lighter step | Rebuild the rep range at the lighter load |
| Any other usable session | Repeat the working weight | Build reps within the range |

A reduction requires matching loads on every working set in both attempts. Mixed heavier/back-off sets, incomplete attempts, a single missed attempt, and old attempts cannot earn a reduction. A weight at or below one configured step repeats rather than producing a zero or negative recommendation.

For explicit bodyweight sessions, the coach can check rep completion at zero external load. Reaching the upper range does not invent added resistance. The recommendation explains that weighted progression needs a corresponding plan.

A recommended increase uses the lift's positive `progressionStepKg`. If that is absent, it uses `incrementLbs` (5 pounds by default). Targets are rounded to the whole-pound value shown by the logger and converted back to kilograms for evaluation. This keeps the displayed target and the completion check consistent. The user can choose the nearest available equipment setting.

`returnAfterDays` defaults to 21 and `missedSessionsBeforeReduction` defaults to 2. Exercise-specific `recommendation` values override plan defaults, which override module defaults. Older stored plans remain compatible; a legacy estimated-max method setting no longer changes how increases are earned.

## Completion during a workout

`evaluateProgressionSets()` is shared by the logger's completion styling and the Coach panel's current-workout readout. Completion requires every entered working row to be valid, at least the planned working-set count, and every set at or above the recommended weight and lower rep bound. Earning an increase additionally requires every set to reach the upper rep bound. Estimated strength cannot bypass either condition.

The logger shows the recommended load, working sets, and rep range directly on each lift. Session completion and an earned increase have separate text labels; only an earned increase turns the Coach button green. The Coach dialog leads with the prescription and one reason, with a current-workout result when sets have been entered. Logged sets, progression rules, season context, and method details are expandable. Its named header receives initial focus without scrolling, and Close remains visible while scrolling. On mobile the dialog uses the full viewport. Both pages share coaching tokens and components in `css/coach.css`.

The progression page puts today’s full prescription first, followed by expandable other lifts and season context. Rep-range setup links to the plan editor. Calendar comparisons use neutral chart styling and do not label logged weights as successful or failed against the season reference.

History labels describe what is available: no history, first session, recent history, incomplete history, or returning after a gap. They are not probabilities or claims about recovery. The calculator has no effort, sleep, pain, or fatigue measurements to evaluate.

## Goals, estimates, and records

The season baseline is the first chronologically valid session containing valid working rows. Calendar progress still interpolates from that baseline toward a configured goal across the block duration. It appears as a reference line and never forces the next workout weight above completed performance. Lifts without a configured increase show no season goal.

The coach's strength summaries and dashboard charts use actual sets from 1 through 12 reps. Higher-rep work remains fully eligible for rep-based progression and can be viewed in the Load chart. Formula handling and PR evaluation remain in `strength.js` and `records.js` respectively. A PR does not independently earn a weight increase.

Today's focus prioritizes starting sessions, lighter-step suggestions, returning lifts, unfinished attempts, earned increases, and then ordinary rep building. A rest day displays recovery guidance without choosing an unscheduled lift.

## Loading and verification

`service-worker.js` uses cache `seans-log-v17`. The coach module and shared coaching stylesheet are network-first alongside the app pages and plans so the UI can receive its matching calculator after an update. Offline use falls back to the cached copy.

Run the regression checks with the existing Node runtime:

```sh
node --test workouts/tests/coach.test.cjs
```

The suite tests decision rules, season boundaries, missing/invalid entries, warmups, required set counts, higher rep ranges, bodyweight work, stale history, unit rounding, and the actual page-rendering functions using a small DOM substitute. It also exercises the bundled weekly plan and checks the prohibited UI vocabulary. Desktop and mobile UI checks use an isolated preview built from production markup, styles, and rendering functions with sample history. Signed-in Firebase persistence is outside that preview.
