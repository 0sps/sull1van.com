(function (window) {
    'use strict';

    const DEFAULT_CONFIG = {
        coachLogLookback: 14,
        recommendation: {
            method: 'repRangeCompletion',
            formula: 'epley',
            validRepMin: 1,
            validRepMax: 12,
            lookbackSessions: 2,
            roundingMode: 'floor',
            incrementLbs: 5
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
        const coachLogLookback = options.coachLogLookback || DEFAULT_CONFIG.coachLogLookback;
        const lbsToKg = options.lbsToKg;
        const kgToLbs = options.kgToLbs;
        const roundWeightLbs = options.roundWeightLbs;
        const displayWeight = options.displayWeight;
        const formatWeightLbs = options.formatWeightLbs;
        const formatDate = options.formatDate;
        const dateFormats = options.dateFormats || {};

        function getPlan() {
            return getProgressionPlan() || null;
        }

        function getLogs() {
            return getWorkoutLogs() || [];
        }

        function parseRepRange(repSpec) {
            const nums = String(repSpec || '').match(/\d+/g)?.map(Number) || [];
            if (nums.length === 0) return { min: 0, max: 0, label: String(repSpec || '') };
            if (nums.length === 1) return { min: nums[0], max: nums[0], label: String(nums[0]) };
            return { min: nums[0], max: nums[1], label: `${nums[0]}-${nums[1]}` };
        }

        function getCoachConfig(planExercise) {
            const defaults = getPlan()?.recommendationDefaults || {};
            return {
                ...DEFAULT_CONFIG.recommendation,
                ...(defaults || {}),
                ...(planExercise?.recommendation || {})
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
            const sharedEstimate = getEstimatedMaxDetails(weightKg, reps, formula, exerciseId);
            if (sharedEstimate) return sharedEstimate.estimatedMaxKg;
            if (!Number.isFinite(weightKg) || weightKg <= 0 || !Number.isFinite(reps) || reps <= 0) return null;

            if (formula === 'brzycki') {
                if (reps >= 37) return null;
                return weightKg * (36 / (37 - reps));
            }

            if (formula === 'lombardi') {
                return weightKg * Math.pow(reps, 0.10);
            }

            return weightKg * (1 + reps / 30);
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

        function getProgressionStartDate() {
            const seasonDate = parseValidDate(getSeasonStartDate());
            if (seasonDate) return seasonDate;
            const dateStr = getPlan()?.progressionPlan_startDate;
            return dateStr ? new Date(`${dateStr}T00:00:00`) : null;
        }

        function getWorkingSets(sets) {
            return (sets || []).filter(set => !set.isWarmup);
        }

        function getLogExercises(log) {
            return Array.isArray(log?.exercises) ? log.exercises : [];
        }

        function parseValidDate(value) {
            const date = new Date(value);
            return Number.isFinite(date.getTime()) ? date : null;
        }

        function normalizeSet(set) {
            const parsedWeight = parseFloat(set.weight);
            return {
                weight: Number.isFinite(parsedWeight) ? parsedWeight : 0,
                reps: parseInt(set.reps, 10)
            };
        }

        function getRepresentativeWeightKg(workingSets, repRange = null, allowZeroWeight = false) {
            const minReps = repRange?.min || 1;
            const normalizedSets = workingSets.map(normalizeSet);
            const hasAllowedWeight = set => allowZeroWeight ? set.weight >= 0 : set.weight > 0;
            const isValidSet = set => Number.isFinite(set.weight) && hasAllowedWeight(set) && Number.isFinite(set.reps);
            const eligibleSets = normalizedSets.filter(set => isValidSet(set) && set.reps >= minReps);
            const sourceSets = eligibleSets.length > 0
                ? eligibleSets
                : normalizedSets.filter(set => isValidSet(set) && set.reps > 0);

            if (sourceSets.length === 0) return null;
            return Math.min(...sourceSets.map(set => set.weight));
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

        function getExerciseProgressionSessions(exerciseId, limitCount = Infinity, repRange = null, allowZeroWeight = false, logLimit = Infinity) {
            const sessions = [];
            const sourceLogs = getLogs().slice(0, logLimit);

            for (const log of sourceLogs) {
                const exerciseLog = getLogExercises(log).find(ex => ex.id === exerciseId);
                if (!exerciseLog) continue;

                const workingSets = getWorkingSets(exerciseLog.sets);
                const representativeWeightKg = getRepresentativeWeightKg(workingSets, repRange, allowZeroWeight);
                if (representativeWeightKg === null) continue;

                sessions.push({ log, exerciseLog, workingSets, representativeWeightKg });
                if (sessions.length >= limitCount) break;
            }

            return sessions;
        }

        function getCoachConfidence(sessionCount, requiredSessions = 2) {
            if (sessionCount >= requiredSessions) {
                return {
                    className: 'high',
                    label: 'High',
                    detail: `${sessionCount} recent lift${sessionCount === 1 ? '' : 's'} found in the last ${coachLogLookback} workout logs`
                };
            }

            if (sessionCount === 1) {
                return {
                    className: 'low',
                    label: 'Low',
                    detail: `Only 1 recent lift found in the last ${coachLogLookback} workout logs`
                };
            }

            return {
                className: 'low',
                label: 'Low',
                detail: `No recent lifts found in the last ${coachLogLookback} workout logs`
            };
        }

        function getBestEstimatedMaxSignal(sessions, coachConfig, exerciseId = null) {
            if (!sessions || sessions.length === 0 || coachConfig.method !== 'estimatedMax') return null;

            const minReps = Number(coachConfig.validRepMin) || 1;
            const maxReps = Number(coachConfig.validRepMax) || 12;
            let bestSignal = null;

            sessions.forEach(session => {
                session.workingSets.forEach(set => {
                    const weightKg = parseFloat(set.weight);
                    const reps = parseInt(set.reps, 10);
                    if (!Number.isFinite(weightKg) || weightKg <= 0) return;
                    if (!Number.isFinite(reps) || reps < minReps || reps > maxReps) return;

                    const estimate = getEstimatedMaxDetails(weightKg, reps, coachConfig.formula, exerciseId);
                    const estimatedMaxKg = estimate?.estimatedMaxKg;
                    if (!Number.isFinite(estimatedMaxKg)) return;

                    if (!bestSignal || estimatedMaxKg > bestSignal.estimatedMaxKg) {
                        bestSignal = { ...estimate, estimatedMaxKg, weightKg, reps, session };
                    }
                });
            });

            return bestSignal;
        }

        function evaluateProgressionSets(workingSets, target) {
            if (!target || !workingSets || workingSets.length === 0) {
                return {
                    planComplete: false,
                    rangeProgressEarned: false,
                    strengthProgressEarned: false,
                    progressEarned: false,
                    statusClass: 'behind',
                    statusLabel: 'Below plan',
                    bestSignal: null
                };
            }

            const planComplete = workingSets.every(set => {
                const reps = parseInt(set.reps, 10);
                const weightKg = parseFloat(set.weight);
                return Number.isFinite(reps) && reps >= target.repRange.min &&
                    Number.isFinite(weightKg) && Number.isFinite(target.targetWeightKg) && weightKg >= target.targetWeightKg;
            });
            const rangeProgressEarned = workingSets.every(set => {
                const reps = parseInt(set.reps, 10);
                const weightKg = parseFloat(set.weight);
                return Number.isFinite(reps) && reps >= target.repRange.max &&
                    Number.isFinite(weightKg) && Number.isFinite(target.targetWeightKg) && weightKg >= target.targetWeightKg;
            });
            const coachConfig = target.coachConfig || getCoachConfig(target.planExercise);
            const sessionLike = { workingSets };
            const bestSignal = getBestEstimatedMaxSignal([sessionLike], coachConfig, target.exerciseId);
            const topRangeEstimatedMaxKg = coachConfig.method === 'estimatedMax'
                ? calculateEstimatedMaxKg(target.targetWeightKg, target.repRange.max, coachConfig.formula, target.exerciseId)
                : null;
            const strengthProgressEarned = !!bestSignal && Number.isFinite(topRangeEstimatedMaxKg) &&
                bestSignal.estimatedMaxKg >= topRangeEstimatedMaxKg;
            const progressEarned = rangeProgressEarned || strengthProgressEarned;

            return {
                planComplete,
                rangeProgressEarned,
                strengthProgressEarned,
                progressEarned,
                statusClass: progressEarned ? 'on-track' : planComplete ? 'on-track' : 'behind',
                statusLabel: progressEarned ? 'Progress earned' : planComplete ? 'Complete' : 'Below plan',
                bestSignal
            };
        }

        function didSessionHitTopReps(workingSets, repRange, targetWeightKg) {
            if (!repRange || !repRange.max || !Number.isFinite(targetWeightKg)) return false;
            if (!workingSets || workingSets.length === 0) return false;

            return workingSets.every(set => {
                const reps = parseInt(set.reps, 10);
                const rawWeight = parseFloat(set.weight);
                const weight = Number.isFinite(rawWeight) ? rawWeight : 0;
                return Number.isFinite(reps) && reps >= repRange.max && weight >= targetWeightKg;
            });
        }

        function getMostRecentProgressionSession(exerciseId, repRange, allowZeroWeight = false) {
            const startDate = getProgressionStartDate();
            const workoutLogs = getLogs();
            if (!startDate || workoutLogs.length === 0) return null;

            for (const log of workoutLogs) {
                const logDate = parseValidDate(log.date);
                if (!logDate) continue;
                if (logDate < startDate) break;

                const exerciseLog = getLogExercises(log).find(ex => ex.id === exerciseId);
                if (!exerciseLog) continue;

                const workingSets = getWorkingSets(exerciseLog.sets);
                const representativeWeightKg = getRepresentativeWeightKg(workingSets, repRange, allowZeroWeight);
                if (representativeWeightKg === null) continue;

                return { log, exerciseLog, workingSets, representativeWeightKg };
            }

            return null;
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
            const planExercise = getPlan()?.exercises?.[exerciseId];
            if (!planExercise) return null;

            const coachConfig = getCoachConfig(planExercise);
            const repRange = parseRepRange(coachConfig.repRange || workoutExercise.reps);
            const baselineSession = getBaselineProgressionSession(exerciseId, repRange);
            const baselineWeightKg = baselineSession?.representativeWeightKg ?? null;
            const allowZeroWeight = baselineWeightKg === 0 || planExercise.targetMode === 'bodyweight';
            const lookbackSessions = Math.max(1, parseInt(coachConfig.lookbackSessions, 10) || 2);
            const recentSessions = getExerciseProgressionSessions(exerciseId, lookbackSessions, repRange, allowZeroWeight, coachLogLookback);
            const blockSession = getMostRecentProgressionSession(exerciseId, repRange, allowZeroWeight);
            const bestSignal = getBestEstimatedMaxSignal(recentSessions, coachConfig, exerciseId);
            const confidence = getCoachConfidence(recentSessions.length, lookbackSessions);

            if (!blockSession && !bestSignal && baselineWeightKg === null && coachConfig.method !== 'estimatedMax') return null;

            const goalIncreaseKg = getPlanGoalIncreaseKg(planExercise);
            const weeklyTargetIncreaseKg = getPlanWeeklyTargetIncreaseKg(planExercise);
            const plannedWeightTodayKg = baselineWeightKg !== null
                ? getPlannedWeightKgForDate(baselineWeightKg, new Date(), weeklyTargetIncreaseKg, goalIncreaseKg)
                : null;
            const progressionStepKg = parseFloat(planExercise.progressionStepKg) || 0;
            const estimatedTargetForBottomKg = bestSignal && repRange.min
                ? calculateWeightForRepsKg(bestSignal.estimatedMaxKg, repRange.min, coachConfig.formula, exerciseId)
                : null;
            const roundedEstimatedTargetKg = estimatedTargetForBottomKg !== null
                ? lbsToKg(roundWeightLbs(kgToLbs(estimatedTargetForBottomKg), coachConfig.incrementLbs, coachConfig.roundingMode))
                : null;
            const earnedIncrease = blockSession
                ? didSessionHitTopReps(
                    blockSession.workingSets,
                    repRange,
                    Math.max(blockSession.representativeWeightKg, plannedWeightTodayKg || 0)
                )
                : false;
            const recentTargetWeightKg = blockSession
                ? blockSession.representativeWeightKg + (earnedIncrease ? progressionStepKg : 0)
                : null;
            const fallbackTargetWeightKg = Math.max(
                plannedWeightTodayKg || 0,
                recentTargetWeightKg || 0,
                baselineWeightKg || 0
            );
            const targetWeightKg = roundedEstimatedTargetKg !== null
                ? Math.max(roundedEstimatedTargetKg, baselineWeightKg || 0)
                : coachConfig.method === 'estimatedMax'
                    ? null
                    : fallbackTargetWeightKg;

            return {
                exerciseId,
                repRange,
                targetWeightKg,
                targetWeightDisplay: Number.isFinite(targetWeightKg) ? displayWeight(targetWeightKg) : '?',
                recentSession: blockSession,
                recentSessions,
                bestSignal,
                confidence,
                earnedIncrease,
                plannedWeightTodayKg,
                coachConfig,
                planExercise
            };
        }

        function getProgressionTarget(exerciseId, repSpec) {
            return buildCoachRecommendation(exerciseId, { reps: repSpec });
        }

        function getBaselineProgressionSession(exerciseId, repRange) {
            const startDate = getProgressionStartDate();
            const workoutLogs = getLogs().slice().sort((first, second) => {
                const firstTime = parseValidDate(first?.date)?.getTime() ?? 0;
                const secondTime = parseValidDate(second?.date)?.getTime() ?? 0;
                return firstTime - secondTime;
            });
            if (!startDate || workoutLogs.length === 0) return null;

            for (const log of workoutLogs) {
                const logDate = parseValidDate(log.date);
                if (!logDate) continue;
                if (logDate < startDate) continue;

                const exerciseLog = getLogExercises(log).find(ex => ex.id === exerciseId);
                if (!exerciseLog) continue;

                const workingSets = getWorkingSets(exerciseLog.sets);
                const representativeWeightKg = getRepresentativeWeightKg(workingSets, repRange);
                if (representativeWeightKg === null) continue;

                return { log, exerciseLog, workingSets, representativeWeightKg };
            }

            return null;
        }

        function getRecentProgressionSessions(exerciseId, repRange, lookbackDays = 14, allowZeroWeight = false) {
            const cutoff = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000);
            const startDate = getProgressionStartDate();
            const effectiveCutoff = startDate && startDate > cutoff ? startDate : cutoff;
            const sessions = [];

            for (const log of getLogs()) {
                const logDate = parseValidDate(log.date);
                if (!logDate) continue;
                if (logDate < effectiveCutoff) break;

                const exerciseLog = getLogExercises(log).find(ex => ex.id === exerciseId);
                if (!exerciseLog) continue;

                const workingSets = getWorkingSets(exerciseLog.sets);
                const representativeWeightKg = getRepresentativeWeightKg(workingSets, repRange, allowZeroWeight);
                if (representativeWeightKg === null) continue;

                sessions.push({ log, exerciseLog, workingSets, representativeWeightKg });
            }

            return sessions;
        }



        function getPaceInfo(progressDeltaKg, weeklyTargetIncreaseKg) {
            const thresholdKg = Math.max(0.25, (weeklyTargetIncreaseKg || 0) * 0.5);
            const weeksOffset = weeklyTargetIncreaseKg > 0 ? Math.round(Math.abs(progressDeltaKg) / weeklyTargetIncreaseKg) : 0;

            if (progressDeltaKg >= thresholdKg) {
                return {
                    className: 'ahead',
                    label: 'Ahead',
                    detail: weeksOffset > 0 ? `${weeksOffset} week${weeksOffset === 1 ? '' : 's'} ahead of pace` : 'Slightly ahead of pace'
                };
            }

            if (progressDeltaKg <= -thresholdKg) {
                return {
                    className: 'behind',
                    label: 'Behind',
                    detail: weeksOffset > 0 ? `${weeksOffset} week${weeksOffset === 1 ? '' : 's'} behind schedule` : 'Slightly behind schedule'
                };
            }

            return {
                className: 'on-track',
                label: 'On Track',
                detail: 'Aligned with the current training plan'
            };
        }

        function buildTrainingPlanChart(sessions, baseline, weeklyTargetIncreaseKg, goalIncreaseKg, target = null) {
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
                const sessionTarget = target && plannedWeightKg !== null
                    ? { ...target, targetWeightKg: plannedWeightKg }
                    : null;
                const evaluation = sessionTarget
                    ? evaluateProgressionSets(session.workingSets, sessionTarget)
                    : null;

                return {
                    date: sessionDate,
                    actualKg: session.representativeWeightKg,
                    plannedKg: plannedWeightKg,
                    hitPlan: evaluation ? evaluation.planComplete || evaluation.progressEarned : plannedWeightKg === null || session.representativeWeightKg >= plannedWeightKg - 0.01
                };
            });

            const values = points.flatMap(point => [point.actualKg, point.plannedKg]).filter(Number.isFinite);
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
            const margin = { top: 18, right: 22, bottom: 34, left: 44 };
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

            const pointHtml = points.map(point => {
                const x = xForDate(point.date).toFixed(1);
                const y = yForKg(point.actualKg).toFixed(1);
                const plannedY = yForKg(point.plannedKg).toFixed(1);
                const statusClass = point.hitPlan ? 'on-track' : 'behind';
                const label = formatDate(point.date.toISOString(), dateFormats.SHORT);

                return `
                    <line x1="${x}" y1="${y}" x2="${x}" y2="${plannedY}" stroke="rgba(255,255,255,0.14)" stroke-width="1"></line>
                    <circle class="training-plan-chart-dot ${statusClass}" cx="${x}" cy="${y}" r="6"></circle>
                    <text class="training-plan-chart-label" x="${x}" y="${height - 10}" text-anchor="middle">${label}</text>`;
            }).join('');

            return `
                <div class="training-plan-chart-card">
                    <svg class="training-plan-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Weight lifted over the last two weeks against planned target">
                        ${gridHtml}
                        <line class="training-plan-chart-axis" x1="${margin.left}" y1="${height - margin.bottom}" x2="${width - margin.right}" y2="${height - margin.bottom}"></line>
                        <path class="training-plan-chart-plan" d="${plannedPath}"></path>
                        <path class="training-plan-chart-actual" d="${actualPath}"></path>
                        ${pointHtml}
                    </svg>
                    <div class="training-plan-legend">
                        <span class="actual">Actual</span>
                        <span class="planned">Plan line</span>
                        <span class="hit">At/above plan</span>
                        <span class="behind">Below plan</span>
                    </div>
                </div>`;
        }

        return {
            parseRepRange,
            getCoachConfig,
            calculateEstimatedMaxKg,
            calculateWeightForRepsKg,
            getProgressionStartDate,
            getWorkingSets,
            getRepresentativeWeightKg,
            getPlanBaselineWeightKg,
            getPlanTargetWeightKg,
            getPlanGoalIncreaseKg,
            getPlanWeeklyTargetIncreaseKg,
            getExerciseProgressionSessions,
            getCoachConfidence,
            getBestEstimatedMaxSignal,
            evaluateProgressionSets,
            buildCoachRecommendation,
            getProgressionTarget,
            getBaselineProgressionSession,
            getRecentProgressionSessions,
            getPlannedProgressKgForDate,
            getPlannedWeightKgForDate,
            getPaceInfo,
            buildTrainingPlanChart
        };
    }

    window.WorkoutCoach = { create: createCoach };
})(window);
