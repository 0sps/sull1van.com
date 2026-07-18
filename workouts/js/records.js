(function (window) {
    'use strict';

    const WEIGHT_EPSILON_KG = 0.0005;

    function createRecordTracker(options = {}) {
        const getWorkoutLogs = options.getWorkoutLogs || (() => []);
        const getSeasonStartDate = options.getSeasonStartDate || (() => null);

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

        function weightsMatch(first, second) {
            return Math.abs(first - second) <= WEIGHT_EPSILON_KG;
        }

        function evaluateExercise(exerciseId, currentSets) {
            const workingSets = getWorkingSets(currentSets);
            if (workingSets.length === 0) {
                return { isPR: false, weightPR: false, repPR: false, records: [] };
            }

            const historicalSets = getSeasonLogs().flatMap(log =>
                (log.exercises || [])
                    .filter(exercise => exercise.id === exerciseId)
                    .flatMap(exercise => getWorkingSets(exercise.sets))
            );

            const currentMaxWeight = Math.max(...workingSets.map(set => set.weight));
            const historicalMaxWeight = historicalSets.length
                ? Math.max(...historicalSets.map(set => set.weight))
                : null;
            const weightPR = historicalMaxWeight === null || currentMaxWeight > historicalMaxWeight + WEIGHT_EPSILON_KG;

            const repPRSets = workingSets.filter(currentSet => {
                const matchingHistory = historicalSets.filter(set => weightsMatch(set.weight, currentSet.weight));
                const historicalMaxReps = matchingHistory.length
                    ? Math.max(...matchingHistory.map(set => set.reps))
                    : null;
                return historicalMaxReps === null || currentSet.reps > historicalMaxReps;
            });
            const repPR = repPRSets.length > 0;

            const records = [];
            if (weightPR) records.push({ type: 'weight', weightKg: currentMaxWeight });
            if (repPR) {
                const bestRepSet = repPRSets.reduce((best, set) => set.reps > best.reps ? set : best);
                records.push({ type: 'reps', weightKg: bestRepSet.weight, reps: bestRepSet.reps });
            }

            return {
                isPR: weightPR || repPR,
                weightPR,
                repPR,
                records
            };
        }

        function getPRTimeline() {
            const maxWeightByExercise = new Map();
            const maxRepsByExerciseWeight = new Map();
            const events = [];
            const logs = getSeasonLogs().slice().sort((a, b) => new Date(a.date) - new Date(b.date));

            logs.forEach(log => {
                (log.exercises || []).forEach(exercise => {
                    const sets = getWorkingSets(exercise.sets);
                    if (sets.length === 0) return;

                    const previousMaxWeight = maxWeightByExercise.get(exercise.id);
                    const currentMaxWeight = Math.max(...sets.map(set => set.weight));
                    const weightPR = previousMaxWeight === undefined || currentMaxWeight > previousMaxWeight + WEIGHT_EPSILON_KG;
                    const repPRSets = [];

                    sets.forEach(set => {
                        const key = `${exercise.id}:${set.weight.toFixed(4)}`;
                        const previousMaxReps = maxRepsByExerciseWeight.get(key);
                        if (previousMaxReps === undefined || set.reps > previousMaxReps) repPRSets.push(set);
                        maxRepsByExerciseWeight.set(key, Math.max(previousMaxReps || 0, set.reps));
                    });

                    maxWeightByExercise.set(exercise.id, Math.max(previousMaxWeight ?? -Infinity, currentMaxWeight));
                    if (!weightPR && repPRSets.length === 0) return;

                    const records = [];
                    if (weightPR) records.push({ type: 'weight', weightKg: currentMaxWeight });
                    if (repPRSets.length > 0) {
                        const bestRepSet = repPRSets.reduce((best, set) => set.reps > best.reps ? set : best);
                        records.push({ type: 'reps', weightKg: bestRepSet.weight, reps: bestRepSet.reps });
                    }

                    events.push({
                        logId: log.id,
                        date: log.date,
                        workoutName: log.workoutName,
                        exerciseId: exercise.id,
                        exerciseName: exercise.name || exercise.id,
                        weightPR,
                        repPR: repPRSets.length > 0,
                        records
                    });
                });
            });

            return events.sort((a, b) => new Date(b.date) - new Date(a.date));
        }

        function getRecentPRs(limitCount = 5) {
            return getPRTimeline().slice(0, Math.max(0, limitCount));
        }

        function getPRCountSince(date) {
            const cutoff = parseDate(date);
            if (!cutoff) return 0;
            return getPRTimeline().filter(event => parseDate(event.date) >= cutoff).length;
        }

        return { evaluateExercise, getSeasonLogs, getPRTimeline, getRecentPRs, getPRCountSince };
    }

    window.WorkoutRecords = { create: createRecordTracker };
})(window);
