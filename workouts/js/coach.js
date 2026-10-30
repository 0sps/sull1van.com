(function (window) {
    'use strict';

    const DEFAULT_CONFIG = {
        recommendation: {
            formula: 'epley',
            lookbackSessions: 2,
            incrementLbs: 5,
            returnAfterDays: 21,
            missedSessionsBeforeReduction: 2
        }
    };

    function toFiniteNumber(value, fallback = null) {
        const number = Number(value);
        return Number.isFinite(number) ? number : fallback;
    }

    function createCoach(options = {}) {
        const getProgressionPlan = options.getProgressionPlan || (() => null);
        const getWorkoutLogs = options.getWorkoutLogs || (() => []);
        const getExerciseData = options.getExerciseData || (() => null);
        const getSeasonStartDate = options.getSeasonStartDate || (() => null);
        const getNow = options.getNow || (() => new Date());
        const getPRTimeline = options.getPRTimeline || (() => []);
        const lbsToKg = options.lbsToKg;
        const displayWeight = options.displayWeight;
        const formatDate = options.formatDate;
        const dateFormats = options.dateFormats || {};

        function getPlan() {
            return getProgressionPlan() || null;
        }

        function isExerciseEligible(exerciseId) {
            if (!exerciseId) return false;
            const exercise = getExerciseData(exerciseId);
            if (getPlan()?.exercises?.[exerciseId]?.targetMode === 'bodyweight') return false;
            if (/body\s*weight/i.test(String(exercise?.equipment || ''))) return false;
            return window.WorkoutStrength?.getExerciseStrengthProfile(exercise).mode !== 'repsOnly';
        }

        function getLogs() {
            const start = getProgressionStartDate();
            const now = parseValidDate(getNow());
            if (!start || !now) return [];
            return (getWorkoutLogs() || []).filter(log => {
                const date = parseValidDate(log?.date);
                return date && date >= start && date <= now;
            }).slice().sort((a, b) => new Date(b.date) - new Date(a.date));
        }

        function parseRepRange(repSpec) {
            const text = String(repSpec ?? '').trim();
            const match = text.match(/^(\d+)(?:\s*[-–]\s*(\d+))?$/);
            if (!match) return { min: 0, max: 0, label: text };
            const min = Number(match[1]);
            const max = Number(match[2] || match[1]);
            if (min < 1 || max < min) return { min: 0, max: 0, label: text };
            return { min, max, label: min === max ? String(min) : `${min}-${max}` };
        }

        function getCoachConfig(planExercise) {
            return {
                ...DEFAULT_CONFIG.recommendation,
                ...(getPlan()?.recommendationDefaults || {}),
                ...(planExercise?.recommendation || {}),
                allowZeroWeight: planExercise?.targetMode === 'bodyweight'
            };
        }

        function getEstimatedMaxDetails(weightKg, reps, formula = 'epley', exerciseId = null) {
            if (exerciseId && window.WorkoutStrength) {
                return window.WorkoutStrength.estimateOneRepMax(getExerciseData(exerciseId), weightKg, reps);
            }
            const estimatedMaxKg = window.WorkoutStrength
                ? window.WorkoutStrength.estimateNamed(weightKg, reps, formula)
                : null;
            if (Number.isFinite(estimatedMaxKg)) {
                return { estimatedMaxKg, validated: false, usedFallback: true, formula };
            }
            return null;
        }

        function calculateEstimatedMaxKg(weightKg, reps, formula = 'epley', exerciseId = null) {
            if (exerciseId && window.WorkoutStrength?.getExerciseStrengthProfile(getExerciseData(exerciseId)).mode === 'repsOnly') {
                return null;
            }
            const sharedEstimate = getEstimatedMaxDetails(weightKg, reps, formula, exerciseId);
            if (sharedEstimate) return sharedEstimate.estimatedMaxKg;
            const calculationReps = Number(reps);
            if (!Number.isFinite(weightKg) || weightKg <= 0 || !Number.isFinite(calculationReps) || calculationReps <= 0) return null;

            if (formula === 'brzycki') {
                if (calculationReps >= 37) return null;
                return weightKg * (36 / (37 - calculationReps));
            }

            if (formula === 'lombardi') {
                return weightKg * Math.pow(calculationReps, 0.10);
            }

            return weightKg * (1 + calculationReps / 30);
        }

        function calculateWeightForRepsKg(estimatedMaxKg, reps, formula = 'epley', exerciseId = null) {
            if (exerciseId && window.WorkoutStrength) {
                return window.WorkoutStrength.calculateWeightForEstimatedMax(getExerciseData(exerciseId), estimatedMaxKg, reps);
            }
            if (!Number.isFinite(estimatedMaxKg) || estimatedMaxKg <= 0 || !Number.isFinite(reps) || reps <= 0) return null;

            if (formula === 'brzycki') {
                if (reps >= 37) return null;
                return estimatedMaxKg / (36 / (37 - reps));
            }

            if (formula === 'lombardi') {
                return estimatedMaxKg / Math.pow(reps, 0.10);
            }

            return estimatedMaxKg / (1 + reps / 30);
        }

        function getEstimatedTargetWeightKg(estimatedMaxKg, reps, exerciseId) {
            const weight = calculateWeightForRepsKg(estimatedMaxKg, reps, 'epley', exerciseId);
            if (!Number.isFinite(weight)) return null;
            // Round up to the logger's whole-pound precision so the prescription
            // never falls below the reference estimate through rounding.
            return lbsToKg(Math.max(1, Math.ceil(weight / lbsToKg(1) - 0.000001)));
        }

        function getProgressionStartDate() {
            const seasonDate = parseValidDate(getSeasonStartDate());
            if (seasonDate) return seasonDate;
            const dateStr = getPlan()?.progressionPlan_startDate;
            return dateStr ? new Date(`${dateStr}T00:00:00`) : null;
        }

        function getWorkingSets(sets) {
            return (Array.isArray(sets) ? sets : []).filter(set => set && !set.isWarmup);
        }

        function getLogExercises(log) {
            return Array.isArray(log?.exercises) ? log.exercises : [];
        }

        function parseValidDate(value) {
            if (value === null || value === undefined || value === '') return null;
            const date = new Date(value);
            return Number.isFinite(date.getTime()) ? date : null;
        }

        function normalizeSet(set) {
            const numeric = value => value === null || value === undefined || String(value).trim() === ''
                ? NaN : Number(value);
            return { weight: numeric(set?.weight), reps: numeric(set?.reps) };
        }

        function isValidWorkingSet(set, allowZeroWeight = false) {
            return Number.isFinite(set.weight) && (allowZeroWeight ? set.weight >= 0 : set.weight > 0) &&
                Number.isInteger(set.reps) && set.reps > 0;
        }

        function getRepresentativeWeightKg(workingSets, allowZeroWeight = false) {
            const sets = getWorkingSets(workingSets).map(normalizeSet)
                .filter(set => isValidWorkingSet(set, allowZeroWeight));
            return sets.length ? Math.min(...sets.map(set => set.weight)) : null;
        }

        function getPlanBaselineWeightKg(planExercise) {
            return toFiniteNumber(parseFloat(planExercise?.baselineWeightKg));
        }

        function getPlanTargetWeightKg(planExercise, seasonBaselineWeightKg = null) {
            if (seasonBaselineWeightKg === null || seasonBaselineWeightKg === undefined || seasonBaselineWeightKg === '') return null;
            const baselineWeightKg = toFiniteNumber(seasonBaselineWeightKg);
            if (baselineWeightKg === null) return null;
            return baselineWeightKg + getPlanGoalIncreaseKg(planExercise);
        }

        function getPlanGoalIncreaseKg(planExercise) {
            const configuredIncreaseKg = toFiniteNumber(parseFloat(planExercise?.goalIncreaseKg));
            if (configuredIncreaseKg !== null) return Math.max(configuredIncreaseKg, 0);
            const baselineWeightKg = getPlanBaselineWeightKg(planExercise);
            const targetWeightKg = toFiniteNumber(parseFloat(planExercise?.targetWeightKg));
            if (baselineWeightKg !== null && targetWeightKg !== null) {
                return Math.max(targetWeightKg - baselineWeightKg, 0);
            }

            return toFiniteNumber(parseFloat(planExercise?.goalIncreaseKg), 0);
        }

        function getPlanWeeklyTargetIncreaseKg(planExercise) {
            const goalIncreaseKg = getPlanGoalIncreaseKg(planExercise);
            const durationWeeks = toFiniteNumber(parseFloat(getPlan()?.durationWeeks));
            if (goalIncreaseKg > 0 && durationWeeks !== null && durationWeeks > 0) {
                return goalIncreaseKg / durationWeeks;
            }

            return toFiniteNumber(parseFloat(planExercise?.weeklyTargetIncreaseKg), 0);
        }

        function getExerciseProgressionSessions(exerciseId, limitCount = Infinity, repRange = null, allowZeroWeight = false) {
            const sessions = [];
            for (const log of getLogs()) {
                const exerciseLogs = getLogExercises(log).filter(ex => (ex.id || ex.exerciseId) === exerciseId);
                if (!exerciseLogs.length) continue;
                const workingSets = exerciseLogs.flatMap(ex => getWorkingSets(ex.sets));
                const bestEstimate = allowZeroWeight ? null : getBestEstimatedMax([{ workingSets }], exerciseId);
                const representativeWeightKg = bestEstimate && repRange?.max > 0
                    ? getEstimatedTargetWeightKg(bestEstimate.estimatedMaxKg, repRange.max, exerciseId)
                    : getRepresentativeWeightKg(workingSets, allowZeroWeight);
                // Keep partly filled sessions so an incomplete attempt cannot be skipped to earn a jump.
                sessions.push({ log, exerciseLog: exerciseLogs[0], workingSets, representativeWeightKg, bestEstimate });
                if (sessions.length >= limitCount) break;
            }
            return sessions;
        }

        function getCoachConfidence(sessionCount, requiredSessions = 2) {
            return {
                className: sessionCount >= requiredSessions ? 'high' : 'low',
                label: sessionCount >= requiredSessions ? 'Recent history' : sessionCount ? 'First session' : 'No history',
                detail: sessionCount ? `Based on ${sessionCount} recent session${sessionCount === 1 ? '' : 's'} for this lift.`
                    : 'No working sets for this lift in the active season.'
            };
        }

        function getBestEstimatedMax(sessions, exerciseId = null) {
            if (!sessions || sessions.length === 0) return null;

            let bestEstimate = null;
            sessions.forEach(session => {
                const sets = getWorkingSets(session.workingSets || session.sets).map(normalizeSet)
                    .filter(set => isValidWorkingSet(set));
                // Use the same best-set selector, formula and actual reps as the PR modal.
                const estimate = window.WorkoutStrength?.getBestEstimatedOneRepMax(getExerciseData(exerciseId), sets);
                if (estimate && (!bestEstimate || estimate.estimatedMaxKg > bestEstimate.estimatedMaxKg)) {
                    bestEstimate = { ...estimate, session };
                }
            });

            return bestEstimate;
        }

        function getWorkoutAdvice(plannedExercises = []) {
            const priority = { baseline: 0, reduce: 1, return: 2, incomplete: 3, increase: 4, repeat: 5, setup: 6 };
            return plannedExercises.map(ex => {
                const exerciseId = ex.exerciseId || ex.id;
                const recommendation = buildCoachRecommendation(exerciseId, ex);
                return recommendation ? { ...recommendation, name: getExerciseData(exerciseId)?.name || exerciseId } : null;
            }).filter(Boolean).sort((a, b) => priority[a.action] - priority[b.action]);
        }

        function getSeasonSnapshot({ now = getNow(), plannedExercises = [], prWindowDays = 14, activityWindowDays = 7 } = {}) {
            const currentDate = parseValidDate(now) || new Date();
            const seasonStart = getProgressionStartDate() || currentDate;
            const elapsedMs = Math.max(0, currentDate.getTime() - seasonStart.getTime());
            const week = Math.floor(elapsedMs / (7 * 24 * 60 * 60 * 1000)) + 1;
            const logs = getLogs().slice().sort((first, second) => {
                const firstTime = parseValidDate(first?.date)?.getTime() ?? 0;
                const secondTime = parseValidDate(second?.date)?.getTime() ?? 0;
                return secondTime - firstTime;
            });
            const timeline = (getPRTimeline() || []).filter(event => {
                const date = parseValidDate(event?.date);
                return date && date >= seasonStart && date <= currentDate;
            }).slice().sort((first, second) => {
                const firstTime = parseValidDate(first?.date)?.getTime() ?? 0;
                const secondTime = parseValidDate(second?.date)?.getTime() ?? 0;
                return secondTime - firstTime;
            });
            const prCutoff = new Date(currentDate.getTime() - prWindowDays * 24 * 60 * 60 * 1000);
            const activityCutoff = new Date(currentDate.getTime() - activityWindowDays * 24 * 60 * 60 * 1000);
            const latestWorkout = logs[0] || null;
            const latestWorkoutDate = parseValidDate(latestWorkout?.date);
            const activeRecently = !!latestWorkoutDate && latestWorkoutDate >= activityCutoff;
            const daysSinceWorkout = latestWorkoutDate
                ? Math.max(0, Math.floor((currentDate.getTime() - latestWorkoutDate.getTime()) / (24 * 60 * 60 * 1000)))
                : null;

            return {
                seasonStart,
                week,
                timeline,
                latestPR: timeline[0] || null,
                prCount: timeline.filter(event => {
                    const eventDate = parseValidDate(event?.date);
                    return eventDate && eventDate >= seasonStart && eventDate >= prCutoff && eventDate <= currentDate;
                }).length,
                prWindowDays,
                latestWorkout,
                activeRecently,
                daysSinceWorkout,
                activityWindowDays,
                workoutAdvice: getWorkoutAdvice(plannedExercises)
            };
        }

        function evaluateProgressionSets(workingSets, target) {
            const sets = getWorkingSets(workingSets).map(normalizeSet);
            const requiredSets = Math.max(1, Number(target?.requiredWorkingSets) || 1);
            const allowZeroWeight = target?.coachConfig?.allowZeroWeight || target?.planExercise?.targetMode === 'bodyweight';
            const validSets = sets.filter(set => isValidWorkingSet(set, allowZeroWeight));
            const hasTarget = Number.isFinite(target?.targetWeightKg) && target?.repRange?.min > 0;
            let growthSets = 0;
            let growthRun = 0;
            for (const set of sets) {
                const qualifies = hasTarget && target.repRange.max > 0 &&
                    isValidWorkingSet(set, allowZeroWeight) && set.reps >= target.repRange.max &&
                    set.weight + 0.01 >= target.targetWeightKg;
                growthRun = qualifies ? growthRun + 1 : 0;
                growthSets = Math.max(growthSets, growthRun);
            }
            const rangeProgressEarned = growthSets >= requiredSets;
            const complete = validSets.length >= requiredSets;
            // Session completion uses the minimum prescription independently of growth sets.
            // Optional extra sets cannot undo the required work already completed.
            const satisfactorySets = hasTarget ? validSets.filter(set =>
                set.reps >= target.repRange.min && set.weight + 0.01 >= target.targetWeightKg).length : 0;
            const planComplete = satisfactorySets >= requiredSets;
            const bestEstimate = target ? getBestEstimatedMax([{ workingSets }], target.exerciseId) : null;
            const strengthProgressEarned = complete && bestEstimate && Number.isFinite(target?.referenceEstimatedMaxKg)
                ? bestEstimate.estimatedMaxKg > target.referenceEstimatedMaxKg + 0.0005 : false;
            const progressEarned = target?.usesEstimatedMax
                ? strengthProgressEarned : rangeProgressEarned && target.targetWeightKg > 0;
            return {
                planComplete,
                rangeProgressEarned,
                strengthProgressEarned,
                progressEarned,
                complete,
                requiredSets,
                growthSets,
                satisfactorySets,
                loggedSets: validSets.length,
                statusClass: planComplete ? 'on-track' : 'behind',
                statusLabel: !complete ? 'Finish working sets' : progressEarned ? 'Ready to increase'
                    : rangeProgressEarned ? 'Upper rep target complete'
                    : planComplete ? 'Rep range complete' : 'Keep building reps',
                bestEstimate
            };
        }

        function getPlannedProgressKgForDate(date, weeklyTargetIncreaseKg, goalIncreaseKg) {
            const startDate = getProgressionStartDate();
            if (!startDate || !date || !Number.isFinite(weeklyTargetIncreaseKg)) return 0;

            const elapsedMs = new Date(date).getTime() - startDate.getTime();
            const elapsedWeeks = Math.max(0, elapsedMs / (7 * 24 * 60 * 60 * 1000));
            const plannedProgress = elapsedWeeks * weeklyTargetIncreaseKg;
            return Number.isFinite(goalIncreaseKg) && goalIncreaseKg > 0
                ? Math.min(goalIncreaseKg, plannedProgress)
                : plannedProgress;
        }

        function getPlannedWeightKgForDate(baselineWeightKg, date, weeklyTargetIncreaseKg, goalIncreaseKg) {
            if (!Number.isFinite(baselineWeightKg)) return null;
            return baselineWeightKg + getPlannedProgressKgForDate(date, weeklyTargetIncreaseKg, goalIncreaseKg);
        }

        function buildCoachRecommendation(exerciseId, workoutExercise = {}) {
            if (!isExerciseEligible(exerciseId)) return null;
            const planExercise = getPlan()?.exercises?.[exerciseId] || {};
            const coachConfig = getCoachConfig(planExercise);
            const repRange = parseRepRange(coachConfig.repRange || workoutExercise.reps);
            // The logger's first planned row defaults to a warmup. Explicit workingSets overrides this.
            const requiredWorkingSets = Math.max(1, Math.floor(Number(workoutExercise.workingSets) || (Number(workoutExercise.sets) - 1) || 1));
            const sessions = getExerciseProgressionSessions(exerciseId, Infinity, repRange, coachConfig.allowZeroWeight);
            const current = sessions[0] || null;
            const usable = sessions.find(session => session.representativeWeightKg !== null) || null;
            const baselineSession = getBaselineProgressionSession(exerciseId, repRange, coachConfig.allowZeroWeight);
            const now = parseValidDate(getNow()) || new Date();
            const daysSinceLift = current ? Math.max(0, Math.floor((now - new Date(current.log.date)) / 86400000)) : null;
            const returnAfterDays = Math.max(1, Number(coachConfig.returnAfterDays) || 21);
            const recentSessions = sessions.filter(session => now - new Date(session.log.date) <= returnAfterDays * 86400000)
                .slice(0, Math.max(2, Number(coachConfig.lookbackSessions) || 2, Number(coachConfig.missedSessionsBeforeReduction) || 2));
            const validSessionCount = recentSessions.filter(session => session.workingSets.length >= requiredWorkingSets &&
                session.workingSets.map(normalizeSet).every(set => isValidWorkingSet(set, coachConfig.allowZeroWeight))).length;
            const confidence = getCoachConfidence(validSessionCount);
            if (recentSessions.length && !validSessionCount) {
                confidence.label = 'Incomplete history';
                confidence.detail = 'Recent attempts do not contain all required working sets.';
            }
            const configuredStep = Number(planExercise.progressionStepKg);
            const stepKg = configuredStep > 0 ? configuredStep : lbsToKg(Number(coachConfig.incrementLbs) > 0 ? Number(coachConfig.incrementLbs) : 5);
            const lastWeightKg = usable?.representativeWeightKg ?? null;
            let targetWeightKg = lastWeightKg;
            let action = 'repeat';
            let reason = `Keep the same weight and build toward ${requiredWorkingSets} consecutive growth sets of ${repRange.max}+ reps.`;
            const evaluationTarget = { exerciseId, repRange, targetWeightKg: lastWeightKg, requiredWorkingSets, coachConfig, planExercise };
            let lastEvaluation = current ? evaluateProgressionSets(current.workingSets, evaluationTarget) : null;
            const missedSessions = Math.max(2, Math.floor(Number(coachConfig.missedSessionsBeforeReduction) || 2));
            const repeatedMiss = lastWeightKg > 0 && sessions.length >= missedSessions && sessions.slice(0, missedSessions).every(session => {
                const evaluation = evaluateProgressionSets(session.workingSets, evaluationTarget);
                // A lighter back-off set does not count as a failure at the same load.
                const sameLoad = session.workingSets.map(normalizeSet).every(set => Math.abs(set.weight - lastWeightKg) <= 0.01);
                return evaluation.complete && !evaluation.planComplete && sameLoad &&
                    now - new Date(session.log.date) <= returnAfterDays * 86400000;
            });

            if (!repRange.min) {
                action = 'setup';
                targetWeightKg = null;
                reason = 'Set a numeric rep range in the training plan before using load recommendations.';
                confidence.label = 'Setup needed';
                confidence.className = 'low';
                confidence.detail = 'A numeric rep range is needed to evaluate logged sets.';
            } else if (lastWeightKg === null) {
                action = 'baseline';
                reason = `Choose a weight you can use for ${requiredWorkingSets} working set${requiredWorkingSets === 1 ? '' : 's'} of ${repRange.label} reps, then log every set.`;
            } else if (daysSinceLift > returnAfterDays) {
                action = 'return';
                reason = `Your last session was ${daysSinceLift} days ago. Repeat the last working weight and rebuild the rep range before increasing.`;
                confidence.label = 'Returning';
                confidence.className = 'low';
                confidence.detail = `Last logged session: ${daysSinceLift} days ago.`;
            } else if (!lastEvaluation.complete) {
                action = 'incomplete';
                reason = `The last attempt has ${lastEvaluation.loggedSets} valid working set${lastEvaluation.loggedSets === 1 ? '' : 's'}; this workout calls for ${requiredWorkingSets}. Repeat the weight and finish all working sets.`;
            } else if (lastEvaluation.rangeProgressEarned && lastWeightKg > 0) {
                action = 'increase';
                targetWeightKg = Math.round((lastWeightKg + stepKg) * 1000000) / 1000000;
                reason = `${lastEvaluation.growthSets} consecutive growth sets reached ${repRange.max} reps at the last working weight. Add one step and start again at ${repRange.min} reps.`;
            } else if (repeatedMiss && lastWeightKg > stepKg) {
                action = 'reduce';
                targetWeightKg = Math.round((lastWeightKg - stepKg) * 1000000) / 1000000;
                reason = `${missedSessions} complete sessions at the same weight fell below ${repRange.min} reps on at least one set. Try one step lighter and rebuild the range.`;
            } else if (!lastEvaluation.planComplete) {
                reason = `At least one working set fell below ${repRange.min} reps or used a lighter weight. Repeat the weight and aim for ${repRange.min}+ reps on every set.`;
            }
            const bestEstimate = getBestEstimatedMax(sessions, exerciseId);
            const usesEstimatedMax = !!bestEstimate && !coachConfig.allowZeroWeight && repRange.max > 0;
            if (usesEstimatedMax) {
                // Project the season's strongest set to the upper rep target. Never let a
                // lighter ramp or back-off set replace the strength reference.
                targetWeightKg = getEstimatedTargetWeightKg(bestEstimate.estimatedMaxKg, repRange.max, exerciseId);
                const priorBest = getBestEstimatedMax(sessions.slice(1), exerciseId);
                lastEvaluation = evaluateProgressionSets(current.workingSets, {
                    ...evaluationTarget, targetWeightKg, usesEstimatedMax: true,
                    referenceEstimatedMaxKg: priorBest?.estimatedMaxKg ?? bestEstimate.estimatedMaxKg
                });
                const latestPR = lastEvaluation.strengthProgressEarned;
                action = daysSinceLift > returnAfterDays ? 'return' : !lastEvaluation.complete ? 'incomplete'
                    : latestPR ? 'increase' : 'repeat';
                reason = `Your best season estimated max is ${displayWeight(bestEstimate.estimatedMaxKg)} lb, from ${displayWeight(bestEstimate.weightKg)} lb × ${bestEstimate.reps} reps. This weight is calculated for ${repRange.max} reps using the same formula as your PRs.`;
                if (action === 'incomplete') reason += ` Finish ${requiredWorkingSets} working sets before earning progression.`;
                if (action === 'return') reason += ` Your last attempt was ${daysSinceLift} days ago; rebuild the rep range as you return.`;
            }
            // Match the whole-pound input shown by both pages so typing the target completes it.
            if (Number.isFinite(targetWeightKg) && targetWeightKg > 0) {
                targetWeightKg = lbsToKg(Math.max(1, displayWeight(targetWeightKg)));
            }
            const labels = { baseline: 'Establish a baseline', setup: 'Set the rep range', increase: 'Add one step', reduce: 'Try one step lighter', return: 'Ease back in', incomplete: 'Finish the full session', repeat: 'Build reps at this weight' };
            return {
                exerciseId, repRange, requiredWorkingSets, targetWeightKg,
                targetWeightDisplay: Number.isFinite(targetWeightKg) ? displayWeight(targetWeightKg) : null,
                recentSession: current, recentSessions,
                bestEstimate, usesEstimatedMax,
                referenceEstimatedMaxKg: usesEstimatedMax ? bestEstimate.estimatedMaxKg : null,
                baselineSession, confidence, action, actionLabel: usesEstimatedMax && action === 'increase' ? 'New strength target' : usesEstimatedMax && action === 'repeat' ? 'Build estimated strength' : labels[action], reason,
                stepKg,
                lastEvaluation, coachConfig, planExercise
            };
        }

        function getProgressionTarget(exerciseId, repSpec, workoutExercise = {}) {
            return buildCoachRecommendation(exerciseId, { ...workoutExercise, reps: repSpec });
        }

        function getBaselineProgressionSession(exerciseId, repRange, allowZeroWeight = getPlan()?.exercises?.[exerciseId]?.targetMode === 'bodyweight') {
            const sessions = getExerciseProgressionSessions(exerciseId, Infinity, repRange, allowZeroWeight);
            return sessions.slice().reverse().find(session => session.representativeWeightKg !== null &&
                session.workingSets.map(normalizeSet).every(set => isValidWorkingSet(set, allowZeroWeight))) || null;
        }

        function getRecentProgressionSessions(exerciseId, repRange, lookbackDays = 14, allowZeroWeight = false) {
            const cutoff = new Date(getNow()).getTime() - lookbackDays * 86400000;
            return getExerciseProgressionSessions(exerciseId, Infinity, repRange, allowZeroWeight)
                .filter(session => new Date(session.log.date).getTime() >= cutoff && session.representativeWeightKg !== null);
        }

        function buildCoachSetChart(workingSets, target) {
            const required = Math.max(1, target.requiredWorkingSets || 1);
            const sets = getWorkingSets(workingSets).map(normalizeSet);
            const repMin = target.repRange.min;
            const repMax = target.repRange.max;
            if (!repMax) return '';
            const scale = Math.max(repMax, ...sets.slice(0, required).map(set => Number.isInteger(set.reps) && set.reps > 0 ? set.reps : 0));
            const rows = Array.from({ length: Math.max(required, sets.length) }, (_, index) => {
                const set = sets[index];
                const valid = set && isValidWorkingSet(set, target.coachConfig.allowZeroWeight);
                const state = !valid ? 'missing' : set.reps < target.repRange.min ? 'below' : set.reps >= repMax ? 'top' : 'range';
                if (index >= required) {
                    return `<div class="coach-additional-set" data-set="${index + 1}"><span class="coach-set-label">Set ${String(index + 1).padStart(2, '0')}</span><strong>Additional set added</strong><span class="coach-caption">${valid ? `${displayWeight(set.weight)} lb × ${set.reps} reps` : 'Ready to log'}</span></div>`;
                }
                const status = { missing: 'Missing', below: 'Below range', top: 'Top reached', range: 'In range' }[state];
                return `<div class="coach-set-row" data-state="${state}" aria-label="Set ${index + 1}: ${valid ? `${set.reps} reps, ${displayWeight(set.weight)} lb, ${status}` : 'Missing valid working set'}">
                    <span class="coach-set-label">Set ${String(index + 1).padStart(2, '0')}</span>
                    <div class="coach-rep-track" data-close-markers="${(repMax - repMin) / scale < 0.3}" data-overlap="${repMin === repMax}" aria-hidden="true"><span class="coach-rep-fill" style="--rep-fill: ${valid ? set.reps / scale * 100 : 0}%"></span><span class="coach-rep-marker coach-rep-marker-standard" style="--rep-marker: ${repMin / scale * 100}%"><span class="coach-rep-marker-symbol"></span><span class="coach-rep-marker-label">${repMin}<span>reps</span></span></span><span class="coach-rep-marker coach-rep-marker-progress" style="--rep-marker: ${repMax / scale * 100}%"><span class="coach-rep-marker-symbol"></span>${repMin === repMax ? '' : `<span class="coach-rep-marker-label">${repMax}<span>reps</span></span>`}</span></div>
                    <span class="coach-set-result">${valid ? `${set.reps} reps` : 'Missing'}</span>
                    <span class="coach-set-note coach-set-load">${valid ? `${displayWeight(set.weight)} lb` : 'Log this set'}</span>
                    <span class="coach-set-status coach-achievement" role="img" aria-label="${status}"></span>
                </div>`;
            }).join('');
            return `<div class="coach-set-chart">${rows}</div>`;
        }

        function buildTrainingPlanChart(sessions, baseline, weeklyTargetIncreaseKg, goalIncreaseKg) {
            if (!sessions || sessions.length === 0 || !baseline) {
                return '<div class="training-plan-chart-empty">No progression logs in the last 14 days.</div>';
            }

            const chartSessions = [...sessions].filter(session => parseValidDate(session?.log?.date)).reverse();
            if (chartSessions.length === 0) {
                return '<div class="training-plan-chart-empty">No chartable progression logs in the last 14 days.</div>';
            }
            const baselineWeightKg = baseline.representativeWeightKg;
            const points = chartSessions.map(session => {
                const sessionDate = parseValidDate(session.log.date);
                const plannedWeightKg = getPlannedWeightKgForDate(
                    baselineWeightKg,
                    session.log.date,
                    weeklyTargetIncreaseKg,
                    goalIncreaseKg
                );

                return {
                    date: sessionDate,
                    actualKg: session.representativeWeightKg,
                    plannedKg: plannedWeightKg
                };
            });

            const showReference = goalIncreaseKg > 0;
            const values = points.flatMap(point => showReference ? [point.actualKg, point.plannedKg] : [point.actualKg]).filter(Number.isFinite);
            if (values.length === 0) {
                return '<div class="training-plan-chart-empty">No chartable progression weights in the last 14 days.</div>';
            }
            const minValue = Math.min(...values);
            const maxValue = Math.max(...values);
            const yPadding = Math.max(1, (maxValue - minValue) * 0.2);
            const yMin = Math.max(0, minValue - yPadding);
            const yMax = maxValue + yPadding;
            const width = 640;
            const height = 230;
            const margin = { top: 24, right: 22, bottom: 42, left: 144 };
            const plotWidth = width - margin.left - margin.right;
            const plotHeight = height - margin.top - margin.bottom;
            const firstDate = points[0].date.getTime();
            const lastDate = points[points.length - 1].date.getTime();
            const dateSpan = Math.max(1, lastDate - firstDate);

            const xForDate = date => points.length === 1
                ? margin.left + plotWidth / 2
                : margin.left + ((date.getTime() - firstDate) / dateSpan) * plotWidth;
            const yForKg = kg => margin.top + (1 - ((kg - yMin) / Math.max(1, yMax - yMin))) * plotHeight;
            const actualPath = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${xForDate(point.date).toFixed(1)} ${yForKg(point.actualKg).toFixed(1)}`).join(' ');
            const plannedPath = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${xForDate(point.date).toFixed(1)} ${yForKg(point.plannedKg).toFixed(1)}`).join(' ');
            const yTicks = [yMin, (yMin + yMax) / 2, yMax];

            const gridHtml = yTicks.map(tick => {
                const y = yForKg(tick).toFixed(1);
                return `
                    <line class="training-plan-chart-grid" x1="${margin.left}" y1="${y}" x2="${width - margin.right}" y2="${y}"></line>
                    <text class="training-plan-chart-label" x="8" y="${Number(y) + 4}">${displayWeight(tick)} lb</text>`;
            }).join('');

            const pointHtml = points.map((point, index) => {
                const x = xForDate(point.date).toFixed(1);
                const y = yForKg(point.actualKg).toFixed(1);
                const plannedY = yForKg(point.plannedKg).toFixed(1);
                const label = formatDate(point.date.toISOString(), dateFormats.SHORT);
                const dateLabel = index === 0 || (index === points.length - 1 && point.date.getTime() !== firstDate)
                    ? `<text class="training-plan-chart-label" x="${x}" y="${height - 10}" text-anchor="${index === 0 ? 'start' : 'end'}">${label}</text>`
                    : '';

                return `
                    ${showReference ? `<line x1="${x}" y1="${y}" x2="${x}" y2="${plannedY}" stroke="rgba(255,255,255,0.14)" stroke-width="1"></line>` : ''}
                    <circle class="training-plan-chart-dot" cx="${x}" cy="${y}" r="6"><title>${label}: ${displayWeight(point.actualKg)} lb logged</title></circle>
                    ${dateLabel}`;
            }).join('');

            return `
                <div class="training-plan-chart-card">
                    <svg class="training-plan-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Logged working weight${showReference ? ' and season reference' : ''} over the last two weeks">
                        ${gridHtml}
                        <line class="training-plan-chart-axis" x1="${margin.left}" y1="${height - margin.bottom}" x2="${width - margin.right}" y2="${height - margin.bottom}"></line>
                        ${showReference ? `<path class="training-plan-chart-plan" d="${plannedPath}"></path>` : ''}
                        <path class="training-plan-chart-actual" d="${actualPath}"></path>
                        ${pointHtml}
                    </svg>
                    <div class="training-plan-legend">
                        <span class="actual">Logged weight</span>
                        ${showReference ? '<span class="planned">Season reference</span>' : ''}
                    </div>
                </div>`;
        }

        return {
            isExerciseEligible,
            parseRepRange,
            getCoachConfig,
            calculateEstimatedMaxKg,
            calculateWeightForRepsKg,
            getEstimatedTargetWeightKg,
            getProgressionStartDate,
            getWorkingSets,
            getRepresentativeWeightKg,
            getPlanBaselineWeightKg,
            getPlanTargetWeightKg,
            getPlanGoalIncreaseKg,
            getPlanWeeklyTargetIncreaseKg,
            getExerciseProgressionSessions,
            getCoachConfidence,
            getBestEstimatedMax,
            getWorkoutAdvice,
            getSeasonSnapshot,
            evaluateProgressionSets,
            buildCoachRecommendation,
            getProgressionTarget,
            getBaselineProgressionSession,
            getRecentProgressionSessions,
            getPlannedProgressKgForDate,
            getPlannedWeightKgForDate,
            buildTrainingPlanChart,
            buildCoachSetChart
        };
    }

    window.WorkoutCoach = { create: createCoach };
})(window);
