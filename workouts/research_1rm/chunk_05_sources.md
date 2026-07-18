# Chunk 05 research notes (ex149-ex185)

## Formula used

For externally loaded dynamic resistance exercises with evidence that the exercise or its close movement family is treated as a 1RM lift, this mapping uses the Epley estimate `w*(1+(r/30))`. A recent large exercise-data study states the exact Epley equation and notes that classical weight-and-repetition equations are routinely applied across hundreds of resistance exercises: [Marzagao, *A Weight-Dependent 1RM Prediction Equation*](https://sportrxiv.org/index.php/server/preprint/download/768/1661). Strength Level's [generic 1RM calculator](https://strengthlevel.com/one-rep-max-calculator) likewise describes its calculator as usable for any lift. These are estimated 1RMs, not recommendations to attempt true maximums on isolation, machine, or small-muscle exercises.

Exercise-specific and close-family evidence:

- `ex149` Push Press: Strength Level publishes [Push Press 1RM standards](https://strengthlevel.com/strength-standards/push-press/lb).
- `ex152` Dumbbell Side Bend: the [Dumbbell Side Bend standards](https://strengthlevel.com/strength-standards/dumbbell-side-bend) explicitly report 1RM values.
- `ex153` Kettlebell Upright Row: this is a loaded variation of the upright-row family. Published exercise guidance describes the implement variations as the same movement family ([upright row overview](https://en.wikipedia.org/wiki/Upright_row)), and an exercise-testing source reports 1RM testing for the upright row ([study material surfaced in search](https://testgruff.allegrograph.com/health-fitness-04/Book?dataid=OSx00-1013&title=kettlebell-workout-to-increase-vo2-max.pdf)).
- `ex159`, `ex166`, and `ex167` are incline, low-pulley, and unilateral cable-fly variants. Strength Level explicitly tracks [Cable Fly 1RM standards](https://strengthlevel.com/strength-standards/cable-fly/lb).
- `ex160` Arnold Dumbbell Press: Strength Level publishes [Arnold Press 1RM standards](https://strengthlevel.com/strength-standards/arnold-press/lb).
- `ex169` Dumbbell Skullcrusher: the exact exercise is presented with an estimated 1RM calculator and standards ([Dumbbell Skullcrusher](https://mrgym.ir/exercise/dumbbell-skullcrusher/)).
- `ex170` Cross Body Hammer Curls: the exact exercise is prescribed by percentage of 1RM ([AtletIQ Cross Body Hammer Curl](https://atletiq.com/en/exercises/416)); Strength Level also reports 1RM standards for the close [Hammer Curl](https://strengthlevel.pl/standardy-sily/uginanie-przedramion-w-chwycie-mlotkowym/kg) family.
- `ex173` Landmine Romanian Deadlift: the exact exercise has an estimated 1RM calculator ([Landmine Romanian Deadlift](https://mrgym.ir/exercise/landmine-romanian-deadlift/)); Romanian deadlift 1RM standards provide family support ([Strength Level RDL](https://strengthlevel.es/estandares-de-fuerza/peso-muerto-rumano)).
- `ex174` Landmine Squat: Strength Level includes Landmine Squat in its 1RM comparison tables ([RDL vs. Landmine Squat](https://strengthlevel.com/strength-standards/romanian-deadlift-vs-landmine-squat/kg)).
- `ex175` Dumbbell Squat: Strength Level explicitly publishes [Dumbbell Squat 1RM standards](https://strengthlevel.com/strength-standards/dumbbell-squat/lb).
- `ex176` Preacher Curl: Strength Level explicitly publishes [Preacher Curl 1RM standards](https://strengthlevel.com/strength-standards/preacher-curl/lb).
- `ex177` Dumbbell Decline Bench Press: Strength Level explicitly publishes [Decline Dumbbell Bench Press 1RM standards](https://strengthlevel.com/strength-standards/decline-dumbbell-bench-press/lb).
- `ex180` Ab Crunch Machine: exact machine-crunch sources report [one-rep-max standards](https://www.strength-calculator.com/exercise/machine-ab-crunch) and program loads by percentage of 1RM ([Machine Crunch](https://www.strongermobileapp.com/exercises/machine-crunch)).
- `ex181` Lateral Cable Tricep Extension: this is a one-arm cable triceps-extension variation ([exercise description](https://iridium.fit/exercises/triceps/lateral-cable-tricep-extension)); cable triceps-extension standards are expressed as 1RM ([Strength Level cable rope triceps extension](https://strengthlevel.fr/standards-de-force/extension-des-triceps-a-la-poulie-avec-corde/lb)).
- `ex182` Seated Back Extension: machine back-extension guidance explicitly programs by percentage of 1RM ([Machine Back Extension](https://www.strongermobileapp.com/exercises/machine-back-extension)), and the exact seated variation has an estimated 1RM calculator ([Seated Back Extension](https://mrgym.ir/exercise/seated-back-extension/)).
- `ex184` Dumbbell Hanging Lateral Raise: the exact exercise has a weight-and-repetition estimated-1RM calculator ([Dumbbell Hanging Lateral Raise](https://mrgym.ir/exercise/dumbbell-hanging-lateral-raise/)).

## `NONE` decisions

- `ex151` Decline Russian Twists; `ex155` Superman; `ex161` Side Bridge; `ex163` Hanging Windshield Wiper; `ex164` Jump Squat; `ex165` Lunge Jump; `ex171` TRX Bridge; `ex172` Jump Rope; `ex178` Vertical Leg Raise; and `ex185` Scissor Crossover Kick are unqualified bodyweight, mobility, endurance, or cardio movements rather than externally loaded 1RM lifts.
- `ex156` Chin Up and `ex157` Wide Grip Pull Up are `NONE` under the user's explicit instruction to classify pull-up variants as bodyweight movements.
- `ex162` Handle Band Crunch uses elastic-band resistance without a stable weight value `w`.
- `ex179` Barbell Ab Rollout uses the barbell as a rolling implement; the nominal bar weight is not the resistance being lifted through a conventional loaded repetition.
- `ex183` Tricep Push Up is a push-up variant and is `NONE` under the user's explicit rule.

## Blank decisions

- `ex150` Decline Overhead Weighted Sit Up is externally loaded, but no reliable source located in the search tied a weight-and-repetition 1RM equation to this exact movement or a sufficiently close loaded family.
- `ex154` Alternating Single Arm Kettlebell Swing is externally loaded but ballistic and alternating. Search results emphasized timed/repetition conditioning and did not reliably substantiate a conventional weight-and-repetition 1RM estimate for the exact movement.
- `ex158` Cable Hip Extension is externally loaded, but no reliable exercise-specific or close-family source located in the search substantiated a reps-based 1RM formula.
- `ex168` Iron Cross is ambiguous by name: authoritative sources describe both an isometric gymnastics hold ([NASM Iron Cross](https://www.nasm.org/resource-center/exercise-library/iron-cross)) and a dynamic dumbbell exercise ([Fitbod Iron Cross](https://fitbod.me/exercises/iron-cross)). With no equipment or instructions in the JSON entry, assigning either `NONE` or a loaded formula would be unreliable.

## Scope caveats

Epley estimates are most defensible from hard, low-repetition sets. Cable-stack and machine values are equipment-specific, and unilateral/dumbbell records must keep the same convention (per implement versus combined load) over time.
