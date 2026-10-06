(function (window) {
    'use strict';

    const ESTIMATE_EPSILON_KG = 0.0005;

    function createRecordTracker(options = {}) {
        const getWorkoutLogs = options.getWorkoutLogs || (() => []);
        const getSeasonStartDate = options.getSeasonStartDate || (() => null);
        const getExerciseData = options.getExerciseData || (() => null);

        function parseDate(value) {
            const date = new Date(value);
            return Number.isFinite(date.getTime()) ? date : null;
        }

        function getSeasonLogs() {
            const start = parseDate(getSeasonStartDate());
            if (!start) return [];
            return getWorkoutLogs().filter(log => {
                const logDate = parseDate(log?.date);
                return logDate && logDate >= start;
            });
        }

        function getWorkingSets(sets) {
            return (sets || [])
                .filter(set => !set.isWarmup)
                .map(set => ({
                    weight: Number(set.weight),
                    reps: parseInt(set.reps, 10)
                }))
                .filter(set => Number.isFinite(set.weight) && set.weight >= 0 && Number.isFinite(set.reps) && set.reps > 0);
        }

        function getExerciseProfile(exerciseId) {
            const exercise = getExerciseData(exerciseId) || null;
            const profile = window.WorkoutStrength?.getExerciseStrengthProfile(exercise);
            return {
                exercise,
                profile: profile || {
                    mode: 'estimated1rm',
                    formulaSource: 'epleyFallback',
                    validated: false,
                    usedFallback: true
                }
            };
        }

        function getBestRepMark(sets) {
            const workingSets = getWorkingSets(sets);
            if (workingSets.length === 0) return null;
            const bestSet = workingSets.reduce((best, set) => {
                if (!best || set.reps > best.reps) return set;
                if (set.reps === best.reps && set.weight > best.weight) return set;
                return best;
            }, null);
            return {
                mode: 'repsOnly',
                reps: bestSet.reps,
                weightKg: bestSet.weight
            };
        }

        function getBestEstimatedMark(exercise, sets) {
            const estimate = window.WorkoutStrength?.getBestEstimatedOneRepMax(exercise, sets);
            if (!estimate) return null;
            return {
                mode: 'estimated1rm',
                estimatedMaxKg: estimate.estimatedMaxKg,
                weightKg: estimate.weightKg,
                reps: estimate.reps,
                calculationReps: estimate.calculationReps,
                repsCapped: estimate.repsCapped,
                validated: estimate.validated,
                usedFallback: estimate.usedFallback,
                invalidConfiguredFormula: estimate.invalidConfiguredFormula,
                formula: estimate.formula,
                formulaSource: estimate.formulaSource
            };
        }

        function getBestMark(exerciseId, sets) {
            const { exercise, profile } = getExerciseProfile(exerciseId);
            return profile.mode === 'repsOnly'
                ? getBestRepMark(sets)
                : getBestEstimatedMark(exercise, sets);
        }

        function getExerciseSetsFromLogs(logs, exerciseId) {
            return (logs || []).flatMap(log =>
                (log.exercises || [])
                    .filter(exercise => exercise.id === exerciseId)
                    .flatMap(exercise => exercise.sets || [])
            );
        }

        function getFirstSeasonMark(logs, exerciseId) {
            const orderedLogs = (logs || []).slice().sort((a, b) => new Date(a.date) - new Date(b.date));
            for (const log of orderedLogs) {
                const exerciseSets = (log.exercises || [])
                    .filter(exercise => exercise.id === exerciseId)
                    .flatMap(exercise => exercise.sets || []);
                const mark = getBestMark(exerciseId, exerciseSets);
                if (mark) return { ...mark, date: log.date };
            }
            return null;
        }

        function compareMarks(current, previousBest) {
            if (!current) return { isPR: false, matchedPR: false };
            if (!previousBest) return { isPR: true, matchedPR: false };

            if (current.mode === 'repsOnly') {
                return {
                    isPR: current.reps >= previousBest.reps,
                    matchedPR: current.reps === previousBest.reps
                };
            }

            return {
                isPR: current.estimatedMaxKg > previousBest.estimatedMaxKg + ESTIMATE_EPSILON_KG,
                matchedPR: false
            };
        }

        function buildRecord(current, previousBest, matchedPR) {
            if (current.mode === 'repsOnly') {
                return {
                    type: 'maxReps',
                    reps: current.reps,
                    previousReps: previousBest?.reps ?? null,
                    matched: matchedPR
                };
            }

            return {
                type: 'estimated1rm',
                estimatedMaxKg: current.estimatedMaxKg,
                previousEstimatedMaxKg: previousBest?.estimatedMaxKg ?? null,
                weightKg: current.weightKg,
                reps: current.reps,
                calculationReps: current.calculationReps,
                repsCapped: current.repsCapped,
                validated: current.validated,
                usedFallback: current.usedFallback,
                formulaSource: current.formulaSource
            };
        }

        function isMarkBetter(candidate, existing) {
            if (!candidate) return false;
            if (!existing) return true;
            if (candidate.mode === 'repsOnly') return candidate.reps > existing.reps;
            return candidate.estimatedMaxKg > existing.estimatedMaxKg + ESTIMATE_EPSILON_KG;
        }

        function buildEvaluation(exerciseId, current, previousBest, historicalBaseline) {
            if (!current) {
                return {
                    isPR: false,
                    mode: getExerciseProfile(exerciseId).profile.mode,
                    matchedPR: false,
                    current: null,
                    previousBest: null,
                    seasonBaseline: null,
                    weightPR: false,
                    repPR: false,
                    records: []
                };
            }

            const comparison = compareMarks(current, previousBest);
            const seasonBaseline = historicalBaseline || { ...current, date: null };
            const records = comparison.isPR
                ? [buildRecord(current, previousBest, comparison.matchedPR)]
                : [];

            return {
                isPR: comparison.isPR,
                mode: current.mode,
                matchedPR: comparison.matchedPR,
                current,
                previousBest,
                seasonBaseline,
                weightPR: false,
                repPR: current.mode === 'repsOnly' && comparison.isPR,
                records
            };
        }

        function evaluateAgainstLogs(exerciseId, currentSets, historicalLogs) {
            const current = getBestMark(exerciseId, currentSets);
            const historicalSets = getExerciseSetsFromLogs(historicalLogs, exerciseId);
            const previousBest = getBestMark(exerciseId, historicalSets);
            const historicalBaseline = getFirstSeasonMark(historicalLogs, exerciseId);
            return buildEvaluation(exerciseId, current, previousBest, historicalBaseline);
        }

        function evaluateExercise(exerciseId, currentSets) {
            return evaluateAgainstLogs(exerciseId, currentSets, getSeasonLogs());
        }

        function getPRTimeline() {
            const events = [];
            const bestMarksByExercise = new Map();
            const baselinesByExercise = new Map();
            const logs = getSeasonLogs().slice().sort((a, b) => new Date(a.date) - new Date(b.date));

            logs.forEach(log => {
                const exercisesById = new Map();
                (log.exercises || []).forEach(exercise => {
                    const existing = exercisesById.get(exercise.id) || {
                        id: exercise.id,
                        name: exercise.name || exercise.id,
                        sets: []
                    };
                    existing.sets.push(...(exercise.sets || []));
                    exercisesById.set(exercise.id, existing);
                });

                exercisesById.forEach(exercise => {
                    const current = getBestMark(exercise.id, exercise.sets);
                    const previousBest = bestMarksByExercise.get(exercise.id) || null;
                    const historicalBaseline = baselinesByExercise.get(exercise.id) || null;
                    const result = buildEvaluation(exercise.id, current, previousBest, historicalBaseline);

                    if (result.isPR) {
                        events.push({
                            logId: log.id,
                            date: log.date,
                            workoutName: log.workoutName,
                            exerciseId: exercise.id,
                            exerciseName: exercise.name,
                            mode: result.mode,
                            matchedPR: result.matchedPR,
                            current: result.current,
                            previousBest: result.previousBest,
                            seasonBaseline: result.seasonBaseline,
                            weightPR: result.weightPR,
                            repPR: result.repPR,
                            records: result.records
                        });
                    }

                    if (current && !historicalBaseline) {
                        baselinesByExercise.set(exercise.id, { ...current, date: log.date });
                    }
                    if (isMarkBetter(current, previousBest)) {
                        bestMarksByExercise.set(exercise.id, current);
                    }
                });
            });

            return events.sort((a, b) => new Date(b.date) - new Date(a.date));
        }

        return { evaluateExercise, getSeasonLogs, getPRTimeline };
    }

    window.WorkoutRecords = { create: createRecordTracker };
})(window);
