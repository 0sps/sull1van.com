# Chunk 04 research: ex112-ex148

## Formula choice

All non-empty formulas use the Epley equation, `1RM = w * (1 + r / 30)`, represented in the requested syntax as `w*(1+(r/30))`. The equation is explicitly published in this formula reference and in the exercise-specific Dumbbell Lunge calculator below:

- Epley equation: https://www.1rmcalculator.org/formulas/epley
- Exercise-specific implementation showing `Estimated 1RM = total combined dumbbell load x (1 + reps / 30)`: https://endura.coach/dumbbell-lunge-strength-standards-calculator/

## Exercise-specific evidence for formula entries

- `ex112` Dumbbell Fly and `ex147` Dumbbell Incline Fly: Dumbbell Fly is tracked as a one-rep-max lift, and the incline variation is explicitly programmed as a percentage of its own 1RM. https://strengthlevel.com/strength-standards/dumbbell-fly and https://fitnessvolt.com/24493/incline-dumbbell-fly/
- `ex114` Landmine Row: an exercise-specific page directs users to estimate the movement with a 1RM calculator; Endura also lists a dedicated Landmine Row strength-standard calculator. https://www.drfitology.com/exercises/traps/single-arm-landmine-row and https://endura.coach/
- `ex115` Behind the Back Cable Bicep Curl: the clearly applicable Cable Bicep Curl family is tracked by 1RM, including both bilateral and one-arm versions. https://strengthlevel.com/strength-standards/cable-bicep-curl and https://strengthlevel.com/strength-standards/one-arm-cable-bicep-curl/lb
- `ex117` Standing Barbell Calf Raise: this exact loaded family has published 1RM standards. https://strengthlevel.com/strength-standards/barbell-calf-raise
- `ex118` Overhead Dumbbell Lunge: the exact movement has an estimated-1RM calculator based on working weight and reps. https://endura.coach/dumbbell-overhead-lunge-strength-standards-calculator/
- `ex119` Dumbbell Sumo Squat: the exact movement has an estimated-1RM strength calculator. https://endura.coach/dumbbell-sumo-squat-strength-standards-calculator/
- `ex123` Cable Crossover Fly: the Cable Fly family is explicitly tracked as a one-rep-max lift. https://strengthlevel.com/strength-standards/cable-fly/lb
- `ex125` Sumo Deadlift: the exact movement is explicitly tracked as a one-rep-max lift. https://strengthlevel.com/strength-standards/sumo-deadlift/lb
- `ex130` Dumbbell Clean: REP Fitness programs the exact movement using percentages of its 1RM, and an exercise-specific calculator reports estimated 1RM from a rep set. https://de.repfitness.com/de/blogs/training/how-to-dumbbell-clean and https://endura.coach/dumbbell-clean-strength-standards-calculator/
- `ex131` Kettlebell Sumo Squat: an exact exercise page directs users to a 1RM calculator, while U.S. Army guidance prescribes kettlebell/barbell sumo squat work as a percentage of 1RM. https://www.drfitology.com/exercises/quads/kettlebell-sumo-squat and https://api.army.mil/e2/c/downloads/531195.pdf
- `ex132` Elbows Out Bent Over Dumbbell Row: the Dumbbell Row family is explicitly tracked by 1RM. https://strengthlevel.com/strength-standards/dumbbell-row/lb
- `ex135` Single Leg Romanian Deadlift: the exact movement is explicitly tracked as a one-rep-max lift. https://strengthlevel.com/strength-standards/single-leg-romanian-deadlift
- `ex136` Dumbbell Seated Single Arm Shoulder Press: seated and dumbbell shoulder-press families are explicitly tracked by 1RM; Endura also lists a conversion for single-arm to two-arm dumbbell shoulder press. https://strengthlevel.com/strength-standards/seated-dumbbell-shoulder-press and https://endura.coach/
- `ex138` Chest-Supported Dumbbell Incline Row: the exact chest-supported dumbbell row family has published 1RM standards. https://strengthlevel.com/strength-standards/chest-supported-dumbbell-row
- `ex139` Barbell Step Up: an externally loaded step-up calculator estimates 1RM from weight and reps; its worked example, 70 lb for 6 reps producing about 84 lb, matches Epley. https://endura.coach/weighted-step-ups-strength-standards-calculator/
- `ex140` Barbell Shrug: the exact movement is tracked by 1RM. https://strengthlevel.com/strength-standards/barbell-shrug
- `ex141` Reverse Grip Barbell Bent Over Row: the loaded bent-over-row family has 1RM standards, and Endura lists both the reverse-grip variation and an underhand-to-overhand row conversion. https://strengthlevel.com/strength-standards/male/lb and https://endura.coach/
- `ex142` Dumbbell Floor Press: the exact movement is explicitly tracked as a one-rep-max lift. https://strengthlevel.com/strength-standards/dumbbell-floor-press
- `ex143` Barbell Front Raise: the exact movement is explicitly tracked as a one-rep-max lift. https://strengthlevel.com/strength-standards/barbell-front-raise

## `NONE` classifications

- `ex113` Frog Pump, `ex120` Single Leg Standing Calf Raise, `ex121` Air Squats, `ex128` Calf Raise, `ex129` Side Lunge, `ex133` Decline Reverse Crunch, `ex144` Forward Lunge with Twist, `ex145` Burpee, and `ex146` Crunches are named as bodyweight or non-load-specific movements, so an external-load `w` formula is not meaningful for these entries.
- `ex122` Decline Push Up, `ex137` Diamond Push Up, and `ex148` Australian Chin Up are push-up/pull-up variants and therefore `NONE` under the user's explicit rule.

## Blank classifications

- `ex116` Biceps Curl To Shoulder Press, `ex124` Deadlift to Calf Raise, `ex127` Dumbbell Romanian Deadlift to Calf Raise, and `ex134` Romanian Deadlift to Bent-Over Row are hybrid movements. Sources describe or calculate nearby lifts, but I did not find a reliably disclosed reps-and-weight equation for these exact hybrids.
- `ex126` Machine Squat is externally loaded, but the equipment name is too ambiguous (Smith, V-squat, hack squat, pendulum squat, and other machines have materially different loading) to assign an exercise-specific formula reliably.
