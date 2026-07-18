# Chunk 10 research: ex332-ex365

`NONE` means the movement is inherently bodyweight, mobility, isometric/timed, cardio, band/TRX resistance without a meaningful external-load 1RM, or a push-up/pull-up family movement excluded by the user's rule. An empty string means the exercise is externally loaded but I did not find reliable, sufficiently specific evidence for a weight-and-reps formula.

## Formula-backed entries

- **ex342, Olympic Squat:** `w*(1+(r/30))`. Olympic squat is the high-bar squat family. StrengthLog identifies Epley's equation as one of the most accurate equations for squat, bench press, and deadlift, while Omni Calculator gives the exact equation. Sources: https://www.strengthlog.com/bench-press/ and https://www.omnicalculator.com/sports/one-rep-max
- **ex343, Pause Front Squat:** `w*36/(37-r)`. Gravitus's front-squat calculator explicitly estimates front-squat 1RM with Brzycki, and treats pause front squats as a front-squat variation. The Brzycki reference gives the exact equation. Sources: https://gravitus.com/strength-standards/front-squat/ and https://www.1rmcalculator.org/formulas/brzycki
- **ex345, Rack Pulls:** `w*(1+(r/30))`. Nishaana provides a rack-pull-specific 1RM estimator and explicitly identifies Epley as its formula. Source: https://nishaana.com/exercises/rack-pull/
- **ex349, Clean Deadlift:** `w*(1+(r/30))`. This is a loaded deadlift-family variation. A peer-reviewed deadlift study explicitly estimates deadlift 1RM with Epley and prints the equation. Source: https://pmc.ncbi.nlm.nih.gov/articles/PMC7739658/
- **ex350, Dumbbell Romanian Deadlift:** `w*(1+(r/30))`. A resistance-training preprint explicitly includes barbell/dumbbell Romanian deadlifts and states that predicted 1RM was calculated with the Epley equation. Source: https://sportrxiv.org/index.php/server/preprint/download/810/1789/1711
- **ex354-ex356, Lat Pulldown MAG-grip variants:** `w*(1+(r/30))`. A lat-pulldown study explicitly used the Epley formula, `weight*(1+(0.033*reps))`, to estimate lat-pulldown 1RM. The three MAG entries differ only by grip width. Source: https://repository.sungshin.ac.kr/bitstream/2025.oak/2513/2/%EA%B7%B8%EB%A6%BD%20%EC%A2%85%EB%A5%98%EC%97%90%20%EB%94%B0%EB%A5%B8%20%EB%9E%AB%ED%92%80%EB%8B%A4%EC%9A%B4%20%EC%9A%B4%EB%8F%99%EC%8B%9C%20%EA%B0%95%EB%8F%84%EB%B3%84%20%EC%A3%BC%EB%8F%99%EA%B7%BC%EA%B3%BC%20%ED%98%91%EB%A0%A5%EA%B7%BC%EC%9D%98%20%EA%B7%BC%ED%99%9C%EC%84%B1%EB%8F%84%EC%99%80%20%EC%8B%AC%EA%B7%BC%EB%B6%80%EB%8B%B4%EB%A5%A0%20%EB%B0%8F%20%EC%9E%90%EA%B0%81%EB%8F%84%EC%97%90%20%EB%AF%B8%EC%B9%98%EB%8A%94%20%EC%98%81%ED%96%A5.pdf
- **ex360, MegaMass Leverage Chest Press:** `w*(1+(r/30))`. A University of Georgia study reports 1RM testing for chest press and uses the Epley equation to estimate 1RM from repetitions and weight. Source: https://openscholar.uga.edu/record/4038/files/EricksonJacobPhD.pdf
- **ex365, Leg Press Calf Raise:** `w*(1+(r/30))`. Research on loaded calf raises tested a bilateral calf raise on a seated leg press and estimated a closely related loaded calf-raise 1RM with Epley. This supports Epley for the loaded calf-raise family while preserving machine/setup specificity in the recorded weight. Source: https://www.degruyterbrill.com/document/doi/10.1515/teb-2024-0015/html

## `NONE` entries

- **ex332:** Pike Push Up, push-up/bodyweight rule.
- **ex333:** Elevated Hip Bridge, bodyweight movement as named.
- **ex336:** Oblique Crunch, bodyweight movement as named.
- **ex337:** Balance Trainer Plank, isometric/timed.
- **ex338:** Cycling, cardio.
- **ex340:** Mini Loop Band Plank with Straight Leg Kickback, band/bodyweight and plank-based, no meaningful weight 1RM.
- **ex341:** TRX Tricep Extension, suspension-bodyweight movement.
- **ex346:** Cat Cow, mobility.
- **ex348:** Partner Floor Glute-Ham Raise, assisted bodyweight movement.
- **ex351:** High Knee, cardio/bodyweight.
- **ex352:** Bar Muscle Up, bodyweight pull-up family.
- **ex353:** Running - Trueform, cardio.

## Blank entries

- **ex334:** Weighted Ball Hyperextension, loaded but no reliable exercise-specific formula found.
- **ex335:** Dumbbell No Money Curls, loaded but no reliable exercise-specific formula found.
- **ex339:** Power Clean and Press, meaningful external load, but no sufficiently specific reps-to-1RM equation found for this combined lift.
- **ex344:** Incline Hammer Curl, loaded but no source exposing the exact formula used for this exercise.
- **ex347:** Cable Preacher Curl, loaded but no source exposing the exact formula used for this exercise.
- **ex357:** Single-arm Cable Row, loaded but no source exposing a sufficiently specific exact formula.
- **ex358:** Standing Multi Flight, machine setup can represent three different movements, so no single defensible lift formula was found.
- **ex359:** Hammer Strength Lateral Raise, loaded but no source exposing the exact formula used for this named machine variation.
- **ex361:** Machine Pullover, loaded but no reliable exercise-specific formula found.
- **ex362:** Cable Rear Delt Crossover, loaded but no reliable exercise-specific formula found.
- **ex363:** Preacher Curl Machine, loaded and demonstrably testable for 1RM, but no reliable reps-to-1RM equation specific to it was found.
- **ex364:** Seated Dumbbell Shrug, loaded but no source exposing a sufficiently specific exact formula.
