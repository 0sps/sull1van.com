const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const window = {};
const context = vm.createContext({ window });
for (const file of ['strength.js', 'coach.js']) {
    vm.runInContext(fs.readFileSync(path.join(root, 'js', file), 'utf8'), context);
}
const lbsToKg = lbs => lbs * 0.45359237;
const displayWeight = kg => Math.round(kg / 0.45359237);
const log = (date, reps = [8, 8, 8], lbs = 100, extra = {}) => ({
    date, exercises: [{ id: 'lift', sets: reps.map(reps => ({ reps, weight: lbsToKg(lbs), ...extra })) }]
});
function setup(logs = [], planOverrides = {}, exercise = {}) {
    const plan = {
        progressionPlan_startDate: '2026-09-01', durationWeeks: 12,
        exercises: { lift: { goalIncreaseKg: 15, progressionStepKg: lbsToKg(5), ...planOverrides } }
    };
    return window.WorkoutCoach.create({
        getWorkoutLogs: () => logs, getProgressionPlan: () => plan,
        getExerciseData: () => ({ name: 'Test lift', ...exercise }),
        getNow: () => new Date('2026-09-29T12:00:00Z'),
        lbsToKg, kgToLbs: kg => kg / 0.45359237, displayWeight,
        formatWeightLbs: kg => `${displayWeight(kg)} lbs`, formatDate: date => new Date(date).toISOString().slice(0, 10),
        getPRTimeline: () => [
            { date: '2026-08-31' }, { date: '2026-09-28' }, { date: '2026-10-01' }, { date: null }
        ]
    });
}
const recommend = coach => coach.buildCoachRecommendation('lift', { reps: '6-10', sets: 4 });

test('every scheduled exercise gets starting guidance without a progression entry', () => {
    const coach = setup();
    const result = coach.buildCoachRecommendation('new-lift', { reps: '12-20', sets: 3 });
    assert.equal(result.action, 'baseline');
    assert.equal(result.targetWeightKg, null);
    assert.equal(result.requiredWorkingSets, 2);
});
test('history is sorted and restricted to valid active-season dates', () => {
    const coach = setup([log('2026-08-20', [30], 400), log('2026-09-25'), log(null), log('invalid'), log('2026-10-01', [10, 10, 10], 300), log('2026-09-28', [7, 7, 7], 110)]);
    const result = recommend(coach);
    assert.equal(result.targetWeightDisplay, 110);
    assert.equal(result.recentSession.log.date, '2026-09-28');
    assert.equal(result.baselineSession.log.date, '2026-09-25');
    assert.equal(result.recentSessions.length, 2);
});
test('other workouts never push the lift out of the history window', () => {
    const unrelated = Array.from({ length: 30 }, () => ({ date: '2026-09-29', exercises: [] }));
    const result = recommend(setup([...unrelated, log('2026-09-26', [10, 10, 10])]));
    assert.equal(result.action, 'increase');
    assert.equal(result.targetWeightDisplay, 105);
});
test('a strong single set cannot earn progression for unfinished work', () => {
    const result = recommend(setup([log('2026-09-28', [12])]));
    assert.equal(result.action, 'incomplete');
    assert.equal(result.earnedIncrease, false);
});
test('one strong set cannot outweigh missed reps on other sets', () => {
    const coach = setup([log('2026-09-28', [12, 5, 5])]);
    const result = recommend(coach);
    assert.equal(result.action, 'repeat');
    assert.equal(result.targetWeightDisplay, 100);
    const evaluation = coach.evaluateProgressionSets(log('2026-09-28', [12, 5, 5]).exercises[0].sets, result);
    assert.equal(evaluation.progressEarned, false);
    assert.equal(evaluation.planComplete, false);
});
test('all required sets at the top earn exactly one equipment step', () => {
    const result = recommend(setup([log('2026-09-28', [10, 11, 10], 100)]));
    assert.equal(result.action, 'increase');
    assert.equal(result.targetWeightDisplay, 105);
});
test('the calendar never forces a heavier next workout', () => {
    const result = recommend(setup([log('2026-09-02'), log('2026-09-28')], { goalIncreaseKg: 100 }));
    assert.ok(result.plannedWeightTodayKg > result.targetWeightKg);
    assert.equal(result.targetWeightDisplay, 100);
});
test('an older strong session does not override the latest attempt', () => {
    const result = recommend(setup([log('2026-09-25', [12, 12, 12], 120), log('2026-09-28', [8, 8, 8], 100)]));
    assert.equal(result.action, 'repeat');
    assert.equal(result.targetWeightDisplay, 100);
});
test('warmups are excluded and removing a planned set cannot earn an increase', () => {
    const coach = setup();
    const target = recommend(coach);
    target.targetWeightKg = lbsToKg(100);
    const sets = [{ reps: 2, weight: lbsToKg(50), isWarmup: true }, ...log('2026-09-28', [10, 10, 10]).exercises[0].sets];
    assert.equal(coach.evaluateProgressionSets(sets, target).progressEarned, true);
    assert.equal(coach.evaluateProgressionSets(sets.slice(0, 3), target).progressEarned, false);
});
test('higher rep ranges earn progression without a max estimate', () => {
    const coach = setup([log('2026-09-28', [20, 20, 20])]);
    const result = coach.buildCoachRecommendation('lift', { reps: '12-20', sets: 4 });
    assert.equal(result.action, 'increase');
    assert.equal(result.bestEstimate, null);
});
test('explicit zero load works for bodyweight; missing load stays incomplete', () => {
    const result = recommend(setup([log('2026-09-28', [10, 10, 10], 0)], { targetMode: 'bodyweight' }, { '1repmaxformula': 'NONE' }));
    assert.equal(result.targetWeightKg, 0);
    assert.equal(result.action, 'repeat');
    assert.equal(result.baselineSession.representativeWeightKg, 0);
    const coach = setup([log('2026-09-28', [10, 10, 10], 0, { weight: '' })], { targetMode: 'bodyweight' });
    assert.equal(recommend(coach).action, 'baseline');
    assert.equal(coach.evaluateProgressionSets([{ reps: 10, weight: '' }], { ...result, requiredWorkingSets: 1 }).planComplete, false);
});
test('malformed, blank, negative, and fractional entries cannot earn completion', () => {
    const coach = setup([log('2026-09-28')]);
    const target = recommend(coach);
    for (const set of [{ reps: 10, weight: null }, { reps: 10, weight: -1 }, { reps: '10oops', weight: 50 }, { reps: 10.5, weight: 50 }]) {
        assert.equal(coach.evaluateProgressionSets([set], { ...target, requiredWorkingSets: 1 }).progressEarned, false);
    }
});
test('rep-only formulas still get load guidance from working sets', () => {
    const result = recommend(setup([log('2026-09-28', [10, 10, 10])], {}, { '1repmaxformula': 'NONE' }));
    assert.equal(result.action, 'increase');
    assert.equal(result.bestEstimate, null);
});
test('unsupported and reversed rep ranges request plan setup', () => {
    const coach = setup([log('2026-09-28')]);
    for (const reps of ['30 seconds', 'AMRAP', '10-6', '0', '3x10']) {
        assert.equal(coach.buildCoachRecommendation('lift', { reps, sets: 4 }).action, 'setup');
    }
});
test('two complete missed attempts at the same load suggest one lighter step', () => {
    const result = recommend(setup([log('2026-09-25', [6, 5, 5]), log('2026-09-28', [6, 5, 5])]));
    assert.equal(result.action, 'reduce');
    assert.equal(result.targetWeightDisplay, 95);
});
test('a single miss, different weights, or an incomplete session do not earn a reduction', () => {
    for (const logs of [
        [log('2026-09-28', [5, 5, 5])],
        [log('2026-09-25', [5, 5, 5], 90), log('2026-09-28', [5, 5, 5])],
        [log('2026-09-25', [5]), log('2026-09-28', [5, 5, 5])]
    ]) assert.equal(recommend(setup(logs)).action, 'repeat');
});
test('a warmup-only latest attempt cannot fall through to an older earned increase', () => {
    const result = recommend(setup([log('2026-09-25', [10, 10, 10]), log('2026-09-28', [10], 50, { isWarmup: true })]));
    assert.equal(result.action, 'incomplete');
    assert.equal(result.targetWeightDisplay, 100);
});
test('long gaps repeat the last weight even after a top-range session', () => {
    const result = recommend(setup([log('2026-09-02', [10, 10, 10])]));
    assert.equal(result.action, 'return');
    assert.equal(result.targetWeightDisplay, 100);
    assert.equal(result.confidence.label, 'Returning');
});
test('the representative weight includes failed lower-load working sets', () => {
    const sets = [{ weight: 50, reps: 10 }, { weight: 40, reps: 3 }];
    assert.equal(setup().getRepresentativeWeightKg(sets, { min: 6, max: 10 }), 40);
});
test('typing the displayed target completes the session despite unit rounding', () => {
    const coach = setup([log('2026-09-28', [8, 8, 8], 110, { weight: 50 })]);
    const target = recommend(coach);
    const sets = Array.from({ length: 3 }, () => ({ weight: lbsToKg(target.targetWeightDisplay), reps: 8 }));
    assert.equal(coach.evaluateProgressionSets(sets, target).planComplete, true);
});
test('season snapshot excludes records outside the season or in the future', () => {
    const snapshot = setup([log('2026-08-31'), log('2026-09-28'), log('2026-10-01')]).getSeasonSnapshot();
    assert.equal(snapshot.prCount, 1);
    assert.equal(snapshot.timeline.length, 1);
    assert.equal(snapshot.latestWorkout.date, '2026-09-28');
});
test('today focuses on actionable working-set advice and respects rest days', () => {
    const coach = setup([log('2026-09-28', [10, 10, 10])]);
    assert.equal(coach.getWorkoutAdvice([]).length, 0);
    const advice = coach.getWorkoutAdvice([{ id: 'lift', reps: '6-10', sets: 4 }, { id: 'new', reps: '8-12', sets: 3 }]);
    assert.equal(advice[0].action, 'baseline');
    assert.equal(advice[1].targetWeightDisplay, 105);
});
test('a single chart point produces finite SVG coordinates', () => {
    const coach = setup([log('2026-09-28')]);
    const target = recommend(coach);
    const chart = coach.buildTrainingPlanChart(target.recentSessions, target.baselineSession, 1, 5, target);
    assert.ok(chart.includes('<svg'));
    assert.ok(!/NaN|Infinity/.test(chart));
});

// Run the actual page renderers with a small DOM substitute, without launching a browser.
const now = new Date('2026-09-29T12:00:00Z');
class FixedDate extends Date {
    constructor(...args) { super(...(args.length ? args : [now.getTime()])); }
    static now() { return now.getTime(); }
}
function pageContext(page, names, bindings) {
    const source = fs.readFileSync(path.join(root, page), 'utf8');
    const elements = new Map();
    const document = {
        getElementById(id) {
            if (!elements.has(id)) elements.set(id, { innerHTML: '', textContent: '', dataset: {}, attributes: {}, setAttribute(name, value) { this.attributes[name] = value; }, style: { setProperty() {} }, classList: { toggle() {} } });
            return elements.get(id);
        }
    };
    const sandbox = vm.createContext({ Date: FixedDate, document, elements, lbsToKg, kgToLbs: kg => kg / 0.45359237, displayWeight,
        formatWeightLbs: kg => `${displayWeight(kg)} lbs`, DateFormats: { SHORT: {}, LONG: {} }, ...bindings });
    for (const name of names) {
        const match = source.match(new RegExp(`^        (?:async )?function ${name}\\([^]*?\\n        }`, 'm'));
        assert.ok(match, `${name} exists in ${page}`);
        vm.runInContext(match[0], sandbox);
    }
    return sandbox;
}
const prohibitedCopy = new RegExp(['sig' + 'nal', 'noi' + 'se'].join('|'), 'i');

test('STATS dropdowns show real coach weight changes and the matching last working set', () => {
    const increase = recommend(setup([log('2026-09-28', [10, 10, 10], 100)]));
    const largerIncrease = recommend(setup([log('2026-09-28', [10, 10, 10], 150)], { progressionStepKg: lbsToKg(10) }));
    const reduce = recommend(setup([
        log('2026-09-28', [5, 5, 5], 225), log('2026-09-25', [5, 5, 5], 225)
    ], { progressionStepKg: lbsToKg(10) }));
    assert.equal(increase.action, 'increase');
    assert.equal(reduce.action, 'reduce');
    // A heavier warmup must never replace the working weight or reps shown.
    reduce.recentSession.workingSets.push({ weight: lbsToKg(300), reps: 1, isWarmup: true });
    const repeat = recommend(setup([log('2026-09-28', [8, 8, 8], 100)]));
    const liftRows = [
        { id: 'a', exercise: { name: 'Press <heavy>' }, planExercise: {}, recommendation: increase },
        { id: 'b', exercise: { name: 'Row' }, planExercise: {}, recommendation: largerIncrease },
        { id: 'c', exercise: { name: 'Squat' }, planExercise: {}, recommendation: reduce },
        { id: 'd', exercise: { name: 'Repeat lift' }, planExercise: {}, recommendation: repeat }
    ];
    const sandbox = pageContext('progression.html', ['renderLiftActions', 'formatLiftWeight', 'getLiftName', 'escapeHtml', 'progressionIcon'], { liftRows });
    sandbox.renderLiftActions();
    const html = sandbox.elements.get('liftActions').innerHTML;
    assert.ok(html.includes('Ready to add weight: 2'));
    assert.ok(html.includes('Try a lighter weight: 1'));
    assert.ok(html.includes('Press &lt;heavy&gt;'));
    assert.ok(html.includes('Last: 100 lbs'));
    assert.ok(html.includes('Last: 225 lbs × 5'));
    assert.ok(html.includes('+5 lbs'));
    assert.ok(html.includes('+10 lbs'));
    assert.ok(html.includes('-10 lbs'));
    assert.ok(!html.includes('Repeat lift'));
    assert.ok(!html.includes('300 lbs'));
    assert.equal((html.match(/<details /g) || []).length, 2);
});

test('STATS action dropdowns disappear when no matching recommendations remain', () => {
    const sandbox = pageContext('progression.html', ['renderLiftActions', 'formatLiftWeight', 'getLiftName', 'escapeHtml', 'progressionIcon'], {
        liftRows: [{ id: 'a', exercise: { name: 'Press' }, planExercise: {}, recommendation: recommend(setup([log('2026-09-28', [10, 10, 10])])) }]
    });
    sandbox.renderLiftActions();
    assert.ok(sandbox.elements.get('liftActions').innerHTML.includes('Ready to add weight: 1'));
    assert.ok(!sandbox.elements.get('liftActions').innerHTML.includes('Try a lighter weight'));
    sandbox.liftRows[0].recommendation = recommend(setup([log('2026-09-28', [8, 8, 8])]));
    sandbox.renderLiftActions();
    assert.equal(sandbox.elements.get('liftActions').innerHTML, '');
    sandbox.liftRows = [];
    sandbox.renderLiftActions();
    assert.equal(sandbox.elements.get('liftActions').innerHTML, '');
});

test('Coach modal renders actual evidence, live completion, and escaped exercise names', () => {
    const coach = setup([log('2026-09-28')]);
    const target = recommend(coach);
    const sandbox = pageContext('app.html', ['showTrainingPlanModal'], {
        coach, activeProgressionTargets: { key: target },
        getExerciseForUI: () => ({ name: '<script>bad</script>' }),
        escapeHtml: value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'),
        formatDate: date => new Date(date).toISOString().slice(0, 10),
        collectCurrentExerciseWorkingSets: () => log('2026-09-29', [10, 10, 10]).exercises[0].sets,
        openModal: id => { assert.equal(id, 'trainingPlanModal'); }
    });
    sandbox.showTrainingPlanModal('key');
    const html = sandbox.elements.get('trainingPlanModalContent').innerHTML;
    assert.ok(html.includes('3 working sets × 6-10 reps'));
    assert.ok(html.includes('This workout: Ready to increase'));
    assert.ok(html.includes('data-complete="true"'));
    assert.ok(html.includes('Target complete'));
    assert.ok(html.includes('data-step="1" data-state="complete"'));
    assert.ok(html.includes('data-step="2" data-state="complete"'));
    assert.ok(html.includes('data-step="3" data-state="active"'));
    assert.ok(html.includes('aria-current="step"'));
    assert.ok(html.includes('2026-09-28'));
    assert.ok(html.includes('&lt;script&gt;'));
    assert.ok(!html.includes('<script>bad'));
    assert.ok(!prohibitedCopy.test(html));
    sandbox.collectCurrentExerciseWorkingSets = () => log('2026-09-29', [10, 8, 8]).exercises[0].sets;
    sandbox.showTrainingPlanModal('key');
    assert.ok(sandbox.elements.get('trainingPlanModalContent').innerHTML.includes('data-complete="false"'));
    assert.ok(sandbox.elements.get('trainingPlanModalContent').innerHTML.includes('data-step="1" data-state="complete"'));
    assert.ok(sandbox.elements.get('trainingPlanModalContent').innerHTML.includes('data-step="2" data-state="active"'));
    assert.ok(sandbox.elements.get('trainingPlanModalContent').innerHTML.includes('data-step="3" data-state="pending"'));
    sandbox.collectCurrentExerciseWorkingSets = () => log('2026-09-29', [10, 10, 10], 90).exercises[0].sets;
    sandbox.showTrainingPlanModal('key');
    assert.ok(sandbox.elements.get('trainingPlanModalContent').innerHTML.includes('data-step="1" data-state="active"'));
    assert.ok(sandbox.elements.get('trainingPlanModalContent').innerHTML.includes('data-step="2" data-state="pending"'));
});
test('completed historical milestones show the earned next weight without adding a second step', () => {
    const coach = setup([log('2026-09-28', [10, 10, 10], 100)]);
    const target = recommend(coach);
    assert.equal(target.action, 'increase');
    const sandbox = pageContext('app.html', ['showTrainingPlanModal'], {
        coach, activeProgressionTargets: { key: target }, getExerciseForUI: () => ({ name: 'Test lift' }),
        escapeHtml: String, formatDate: String, collectCurrentExerciseWorkingSets: () => [], openModal() {}
    });
    sandbox.showTrainingPlanModal('key');
    const html = sandbox.elements.get('trainingPlanModalContent').innerHTML;
    assert.ok(html.includes('data-step="2" data-state="complete"'));
    assert.match(html, /data-step="3" data-state="active"[\s\S]*?<strong>105 lbs<\/strong>/);
    assert.ok(!html.includes('110 lbs'));
});
test('Coach modal counts extra qualifying sets and renders them as additional cards', () => {
    const coach = setup([log('2026-09-28', [8, 8], 160)]);
    const target = coach.buildCoachRecommendation('lift', { reps: '8-10', sets: 3 });
    const sandbox = pageContext('app.html', ['showTrainingPlanModal'], {
        coach, activeProgressionTargets: { key: target }, getExerciseForUI: () => ({ name: 'Test lift' }),
        escapeHtml: String, formatDate: String,
        collectCurrentExerciseWorkingSets: () => log('2026-09-29', [10, 10, 10], 160).exercises[0].sets,
        openModal() {}
    });
    sandbox.showTrainingPlanModal('key');
    const html = sandbox.elements.get('trainingPlanModalContent').innerHTML;
    assert.ok(html.includes('<span>3<small>/2</small>'));
    assert.ok(html.includes('--completion:100%'));
    assert.ok(html.includes('data-complete="true"'));
    assert.equal((html.match(/class="coach-set-row"/g) || []).length, 2);
    assert.equal((html.match(/class="coach-additional-set"/g) || []).length, 1);
    assert.ok(html.includes('Additional set added'));
    assert.ok(!html.includes('reps · Standard'));
    assert.ok(!html.includes('reps · Progress'));
    sandbox.collectCurrentExerciseWorkingSets = () => [
        ...log('2026-09-29', [10, 10], 160).exercises[0].sets,
        { weight: NaN, reps: NaN, isWarmup: false }
    ];
    sandbox.showTrainingPlanModal('key');
    const withEmptyExtra = sandbox.elements.get('trainingPlanModalContent').innerHTML;
    assert.ok(withEmptyExtra.includes('data-step="2" data-state="complete"'));
    assert.ok(withEmptyExtra.includes('data-complete="true"'));
    assert.ok(withEmptyExtra.includes('Ready to log'));
});
test('Coach modal renders an honest starting state without invented weight or history', () => {
    const coach = setup();
    const sandbox = pageContext('app.html', ['showTrainingPlanModal'], {
        coach, activeProgressionTargets: { key: recommend(coach) },
        getExerciseForUI: () => ({ name: 'Test lift' }), escapeHtml: String,
        formatDate: String, collectCurrentExerciseWorkingSets: () => [], openModal() {}
    });
    sandbox.showTrainingPlanModal('key');
    const html = sandbox.elements.get('trainingPlanModalContent').innerHTML;
    assert.ok(html.includes('Choose a starting weight'));
    assert.ok(html.includes('No working sets'));
    assert.ok(!html.includes('Season progress'));
    assert.ok(!/undefined|NaN/.test(html));
});
test('dashboard uses the real weekly plan and the shared coach for every scheduled lift', () => {
    const trainingPlanData = JSON.parse(fs.readFileSync(path.join(root, 'training-plan.json')));
    const progressionPlanData = JSON.parse(fs.readFileSync(path.join(root, 'progression-plan.json')));
    const exercisesData = JSON.parse(fs.readFileSync(path.join(root, 'exercises.json')));
    const workoutLogs = [{ date: '2026-09-28', exercises: [{ id: 'ex138', sets: [
        { reps: 12, weight: lbsToKg(100) }, { reps: 12, weight: lbsToKg(100) }
    ] }] }];
    const coach = window.WorkoutCoach.create({
        getWorkoutLogs: () => workoutLogs, getProgressionPlan: () => progressionPlanData,
        getExerciseData: id => exercisesData[id], getSeasonStartDate: () => '2026-09-01',
        getNow: () => now, lbsToKg, kgToLbs: kg => kg / 0.45359237, displayWeight,
        formatDate: String, getPRTimeline: () => []
    });
    const sandbox = pageContext('progression.html', [
        'parseDateLocal', 'formatDate', 'getLocalDateKey', 'escapeHtml',
        'getProgressionStartDate', 'getSeasonGoalDate', 'parseRepRange', 'getWorkingSets', 'getCoachConfig',
        'calculateEstimatedMaxKg', 'getBestEstimatedMax', 'getGoalIncreaseKg', 'getWeeklyTargetIncreaseKg',
        'getSeasonBaseline', 'getSeasonTargetWeightKg', 'getPlanStatus', 'getTrainingPlanEntries',
        'getMostRecentLift', 'getDailyAverages', 'buildLiftRows', 'formatLiftWeight', 'getLiftName',
        'getSharedSeasonSnapshot', 'getTodaysAdvice', 'renderSummary', 'renderLiftActions', 'renderCoachBrief', 'renderLiftTable',
        'renderChartStats', 'buildChart', 'progressionIcon'
    ], { coach, trainingPlanData, progressionPlanData, exercisesData, workoutLogs, liftRows: [], chartMetric: 'load' });
    sandbox.buildLiftRows();
    const allIds = new Set(Object.values(trainingPlanData.workouts).flatMap(workout => workout.exercises.map(ex => ex.id)));
    assert.equal(sandbox.liftRows.length, allIds.size);
    const row = sandbox.liftRows.find(row => row.id === 'ex138');
    assert.equal(row.dayName, 'PULL ROWS'); // Tuesday's next occurrence is Friday, with 4 total rows.
    assert.equal(row.recommendation.requiredWorkingSets, 3);
    assert.equal(row.recommendation.action, 'incomplete'); // Monday's two working sets cannot earn Friday's increase.
    sandbox.renderSummary();
    sandbox.renderLiftTable();
    const html = sandbox.elements.get('liftTableBody').innerHTML;
    assert.ok(html.includes('Finish the full session'));
    assert.ok(!/undefined|NaN/.test(html));
    assert.ok(!prohibitedCopy.test(html));
    const chart = sandbox.buildChart(row);
    assert.ok(chart.includes('<svg'));
    assert.ok(!/NaN|Infinity/.test(chart));
    sandbox.chartMetric = 'strength';
    assert.ok(!/NaN|Infinity/.test(sandbox.buildChart(row)));
    sandbox.renderChartStats(row);
    const statsHtml = sandbox.elements.get('chartStats').innerHTML;
    assert.ok(!/undefined|NaN/.test(statsHtml));
    assert.ok(statsHtml.includes('1RM'));
    assert.ok(statsHtml.includes('Best Set'));
    assert.ok(!statsHtml.includes('Strength Estimate'));
    assert.ok(!statsHtml.includes('Latest Max Set'));
    assert.ok(!statsHtml.includes('Best Daily'));
    assert.ok(!statsHtml.includes('reps ·'));
});
test('scheduled repeat days get coaching guidance instead of a recovery placeholder', () => {
    const coach = setup([log('2026-09-28')]);
    const sandbox = pageContext('app.html', ['updateStats'], {
        coach, activeSeason: { name: 'Test season' }, DateFormats: { SHORT: {} },
        getWorkoutData: () => ({ exercises: [{ exerciseId: 'lift', reps: '6-10', sets: 4 }] }),
        formatDate: String
    });
    sandbox.updateStats();
    assert.equal(sandbox.elements.get('coachFocusValue').textContent, 'Test lift');
    assert.ok(sandbox.elements.get('coachFocusDetail').textContent.includes('Build reps'));
});
test('workout UI files exclude the explicitly prohibited vocabulary', () => {
    for (const file of ['app.html', 'progression.html', 'js/coach.js']) {
        assert.ok(!prohibitedCopy.test(fs.readFileSync(path.join(root, file), 'utf8')), file);
    }
});

test('bodyweight rep completion never promises an automatic weight increase', () => {
    const coach = setup([log('2026-09-28', [10, 10, 10], 0)], { targetMode: 'bodyweight' });
    const target = recommend(coach);
    const result = coach.evaluateProgressionSets(target.recentSession.workingSets, target);
    assert.equal(result.planComplete, true);
    assert.equal(result.rangeProgressEarned, true);
    assert.equal(result.progressEarned, false);
    assert.equal(result.statusLabel, 'Upper rep target complete');
    const chart = coach.buildTrainingPlanChart(target.recentSessions, target.baselineSession, 0, 0, target);
    assert.ok(!/NaN|Infinity/.test(chart));
});

test('Coach opens at its named header without scrolling to a lower control', () => {
    const focusCalls = [];
    const title = { focus: options => focusCalls.push(options) };
    const scrollContainer = { scrollTop: 300 };
    const modal = {
        classList: { add() {} }, setAttribute() {},
        querySelector(selector) {
            return selector === '[data-modal-initial-focus]' ? title : selector === '.modal' ? scrollContainer : null;
        }
    };
    const source = fs.readFileSync(path.join(root, 'app.html'), 'utf8');
    const match = source.match(/^        function openModal\([^]*?\n        }/m);
    const sandbox = vm.createContext({
        document: { activeElement: {}, getElementById: () => modal },
        lastFocusedBeforeModal: null, FOCUSABLE_SELECTOR: 'button, summary'
    });
    vm.runInContext(match[0], sandbox);
    sandbox.openModal('trainingPlanModal');
    assert.equal(focusCalls.length, 1);
    assert.equal(focusCalls[0].preventScroll, true);
    assert.equal(scrollContainer.scrollTop, 0);
});

test('session completion and earned progression have distinct labels and button states', () => {
    const coach = setup([log('2026-09-28')]);
    const target = recommend(coach);
    let liveSets = log('2026-09-29', [8, 8, 8]).exercises[0].sets;
    const toggles = new Map();
    const sandbox = pageContext('app.html', ['checkExerciseCompletion'], {
        coach, activeProgressionTargets: { key: target },
        collectCurrentExerciseWorkingSets: () => liveSets,
        getExerciseForUI: () => ({ name: 'Test lift' })
    });
    const button = sandbox.document.getElementById('coach-btn-key');
    button.classList.toggle = (name, value) => toggles.set(name, value);
    sandbox.checkExerciseCompletion('key');
    assert.equal(sandbox.elements.get('coach-status-key').textContent, 'Session target met');
    assert.equal(toggles.get('achieved'), false);
    liveSets = log('2026-09-29', [10, 10, 10]).exercises[0].sets;
    sandbox.checkExerciseCompletion('key');
    assert.equal(sandbox.elements.get('coach-status-key').textContent, 'Increase earned for next session');
    assert.equal(toggles.get('achieved'), true);
});

test('calendar comparison does not label a valid repeated load as a failure', () => {
    const coach = setup([log('2026-09-02'), log('2026-09-28')], { goalIncreaseKg: 100 });
    const target = recommend(coach);
    assert.equal(target.action, 'repeat');
    const chart = coach.buildTrainingPlanChart(target.recentSessions, target.baselineSession, 10, 100, target);
    assert.ok(chart.includes('Season reference'));
    assert.ok(!/behind|Below plan|on-track|At\/above plan/.test(chart));
});

test('rep-range setup offers a real editor path and omits invented completion targets', () => {
    const coach = setup([log('2026-09-28')]);
    const target = coach.buildCoachRecommendation('lift', { reps: 'AMRAP', sets: 4 });
    assert.equal(target.confidence.label, 'Setup needed');
    assert.ok(!target.confidence.detail.includes('do not contain all required working sets'));
    const sandbox = pageContext('app.html', ['showTrainingPlanModal'], {
        coach, activeProgressionTargets: { key: target }, getExerciseForUI: () => ({ name: 'Test lift' }),
        escapeHtml: String, formatDate: String, collectCurrentExerciseWorkingSets: () => [], openModal() {}
    });
    sandbox.showTrainingPlanModal('key');
    const html = sandbox.elements.get('trainingPlanModalContent').innerHTML;
    assert.ok(html.includes('href="training-plan-editor.html"'));
    assert.ok(!html.includes('Session and progression rules'));
    assert.ok(!/undefined|NaN/.test(html));
});


test('set chart keeps missing required sets visible and excludes warmups', () => {
    const coach = setup();
    const target = recommend(coach);
    const html = coach.buildCoachSetChart([
        { weight: lbsToKg(50), reps: 20, isWarmup: true },
        { weight: lbsToKg(100), reps: 12 },
        { weight: '', reps: 10 }
    ], target);
    assert.equal((html.match(/class="coach-set-row"/g) || []).length, 3);
    assert.equal((html.match(/data-state="missing"/g) || []).length, 2);
    assert.ok(html.includes('--rep-fill: 100%'));
    assert.ok(html.includes('--rep-marker: 83.333'));
    assert.ok(!/NaN|Infinity|20 reps/.test(html));
});
test('set chart distinguishes the standard and progression thresholds', () => {
    const coach = setup();
    const target = coach.buildCoachRecommendation('lift', { reps: '8-10', sets: 4 });
    const html = coach.buildCoachSetChart([7, 8, 10].map(reps => ({ reps, weight: lbsToKg(100) })), target);
    assert.deepEqual([...html.matchAll(/data-state="([^"]+)"/g)].map(match => match[1]), ['below', 'range', 'top']);
    assert.equal((html.match(/coach-rep-marker-standard/g) || []).length, 3);
    assert.equal((html.match(/coach-rep-marker-progress/g) || []).length, 3);
    assert.ok(html.includes('--rep-marker: 80%'));
    assert.ok(html.includes('--rep-marker: 100%'));
    assert.ok(html.includes('coach-rep-marker-label">8<span>reps</span>'));
    assert.ok(html.includes('coach-rep-marker-label">10<span>reps</span>'));
    assert.ok(!html.includes('Bars show reps'));
    assert.equal((html.match(/class="coach-set-status coach-achievement"/g) || []).length, 3);
    assert.ok(!html.includes('>In range</span>'));
    assert.ok(!html.includes('>Top reached</span>'));
    assert.ok(html.includes('Set 01'));
    const fixedRange = { ...target, repRange: { min: 10, max: 10, label: '10' } };
    assert.ok(coach.buildCoachSetChart([], fixedRange).includes('data-overlap="true"'));
    const higherTarget = coach.buildCoachRecommendation('lift', { reps: '12-15', sets: 3 });
    const higherChart = coach.buildCoachSetChart([], higherTarget);
    assert.ok(higherChart.includes('coach-rep-marker-label">12<span>reps</span>'));
    assert.ok(higherChart.includes('coach-rep-marker-label">15<span>reps</span>'));
    const overriddenCoach = setup([], { recommendation: { repRange: '12-15' } });
    const overriddenTarget = overriddenCoach.buildCoachRecommendation('lift', { reps: '8-10', sets: 3 });
    assert.ok(overriddenCoach.buildCoachSetChart([], overriddenTarget).includes('coach-rep-marker-label">15<span>reps</span>'));
});
test('bodyweight and starting set charts retain states without explanatory prose', () => {
    const coach = setup();
    const target = recommend(coach);
    assert.ok(coach.buildCoachSetChart([], target).includes('data-state="missing"'));
    const bodyweight = recommend(setup([log('2026-09-28', [10, 10, 10], 0)], { targetMode: 'bodyweight' }));
    const html = coach.buildCoachSetChart(log('2026-09-28', [10, 10, 10], 0).exercises[0].sets, bodyweight);
    assert.ok(html.includes('data-state="top"'));
    assert.ok(!html.includes('earn the next step'));
});
test('weight trend works without a configured season goal', () => {
    const coach = setup([log('2026-09-28')], { goalIncreaseKg: 0 });
    const target = recommend(coach);
    const html = coach.buildTrainingPlanChart(target.recentSessions, target.baselineSession, 0, 0, target);
    assert.ok(html.includes('<svg'));
    assert.ok(!html.includes('Season reference'));
    assert.ok(!html.includes('class="training-plan-chart-plan"'));
    assert.ok(!/NaN|Infinity/.test(html));
});
