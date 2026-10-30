const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const window = {};
const context = vm.createContext({ window });
for (const file of ['strength.js', 'coach.js', 'records.js']) {
    vm.runInContext(fs.readFileSync(path.join(root, 'js', file), 'utf8'), context);
}
const lbsToKg = lbs => lbs * 0.45359237;
const displayWeight = kg => Math.round(kg / 0.45359237);
const log = (date, reps = [8, 8, 8], lbs = 100, extra = {}) => ({
    date, exercises: [{ id: 'lift', sets: reps.map(reps => ({ reps, weight: lbsToKg(lbs), ...extra })) }]
});
// Generic recommendation tests use weighted lifts; bodyweight exclusion is covered separately.
function setup(logs = [], planOverrides = {}, exercise = {}) {
    const plan = {
        progressionPlan_startDate: '2026-09-01', durationWeeks: 12,
        exercises: { lift: { goalIncreaseKg: 15, progressionStepKg: lbsToKg(5), ...planOverrides } }
    };
    return window.WorkoutCoach.create({
        getWorkoutLogs: () => logs, getProgressionPlan: () => plan,
        getExerciseData: () => ({ name: 'Test lift', '1repmaxformula': 'w*(1+(r/30))', ...exercise }),
        getNow: () => new Date('2026-09-29T12:00:00Z'),
        lbsToKg, displayWeight,
        formatDate: date => new Date(date).toISOString().slice(0, 10),
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
    const result = recommend(setup([log('2026-08-20', [30], 400), log('2026-09-25'), log(null), log('invalid'), log('2026-10-01', [10, 10, 10], 300), log('2026-09-28', [7, 7, 7], 110)]));
    assert.equal(result.targetWeightDisplay, 102);
    assert.equal(result.recentSession.log.date, '2026-09-28');
    assert.equal(result.baselineSession.log.date, '2026-09-25');
    assert.equal(result.recentSessions.length, 2);
});
test('other workouts never push the lift out of the history window', () => {
    const unrelated = Array.from({ length: 30 }, () => ({ date: '2026-09-29', exercises: [] }));
    const result = recommend(setup([...unrelated, log('2026-09-25', [10, 10, 10], 90), log('2026-09-26', [10, 10, 10])]));
    assert.equal(result.action, 'increase');
    assert.equal(result.targetWeightDisplay, 100);
});
test('a strong single set cannot earn progression for unfinished work', () => {
    const result = recommend(setup([log('2026-09-28', [12])]));
    assert.equal(result.action, 'incomplete');
});
test('strong sets and prescribed session completion are evaluated independently', () => {
    const coach = setup([log('2026-09-28', [12, 5, 5])]);
    const result = recommend(coach);
    assert.equal(result.targetWeightDisplay, 105);
    const evaluation = coach.evaluateProgressionSets(log('2026-09-29', [12, 5, 5]).exercises[0].sets, result);
    assert.equal(evaluation.progressEarned, false);
    assert.equal(evaluation.planComplete, false);
    assert.equal(evaluation.complete, true);
});
test('repeating the historical max does not invent an equipment increase', () => {
    const result = recommend(setup([log('2026-09-28', [10, 11, 10], 100)]));
    assert.equal(result.action, 'repeat');
    assert.equal(result.targetWeightDisplay, 103);
});
test('the calendar never forces a heavier next workout', () => {
    const result = recommend(setup([log('2026-09-02'), log('2026-09-28')], { goalIncreaseKg: 100 }));
    const withoutGoal = recommend(setup([log('2026-09-02'), log('2026-09-28')], { goalIncreaseKg: 0 }));
    assert.equal(result.targetWeightDisplay, withoutGoal.targetWeightDisplay);
    assert.equal(result.action, withoutGoal.action);
    assert.equal(result.targetWeightDisplay, 95);
});
test('an easier latest session preserves the strongest season target', () => {
    const result = recommend(setup([log('2026-09-25', [12, 12, 12], 120), log('2026-09-28', [8, 8, 8], 100)]));
    assert.equal(result.action, 'repeat');
    assert.equal(result.targetWeightDisplay, 126);
    assert.equal(result.recentSession.log.date, '2026-09-28');
});
test('warmups are excluded and removing a planned set cannot earn an increase', () => {
    const coach = setup();
    const target = recommend(coach);
    target.targetWeightKg = lbsToKg(100);
    const sets = [{ reps: 2, weight: lbsToKg(50), isWarmup: true }, ...log('2026-09-28', [10, 10, 10]).exercises[0].sets];
    assert.equal(coach.evaluateProgressionSets(sets, target).progressEarned, true);
    assert.equal(coach.evaluateProgressionSets(sets.slice(0, 3), target).progressEarned, false);
});
test('higher rep ranges use their actual strength estimate', () => {
    const result = setup([log('2026-09-28', [20, 20, 20])]).buildCoachRecommendation('lift', { reps: '12-20', sets: 4 });
    assert.equal(result.action, 'repeat');
    assert.equal(result.targetWeightDisplay, 100);
    assert.equal(result.bestEstimate.calculationReps, 20);
});
test('bodyweight plans receive no recommendation at any logged load', () => {
    for (const weight of [0, 100]) {
        const coach = setup([log('2026-09-28', [10, 10, 10], weight)], { targetMode: 'bodyweight' });
        assert.equal(coach.isExerciseEligible('lift'), false);
        assert.equal(recommend(coach), null);
        assert.equal(coach.getWorkoutAdvice([{ id: 'lift', reps: '6-10', sets: 4 }]).length, 0);
    }
});
test('malformed, blank, negative, and fractional entries cannot earn completion', () => {
    const coach = setup([log('2026-09-28')]);
    const target = recommend(coach);
    for (const set of [{ reps: 10, weight: null }, { reps: 10, weight: -1 }, { reps: '10oops', weight: 50 }, { reps: 10.5, weight: 50 }]) {
        assert.equal(coach.evaluateProgressionSets([set], { ...target, requiredWorkingSets: 1 }).progressEarned, false);
    }
});
test('rep-only formulas receive no Coach even with positive added weight', () => {
    const coach = setup([log('2026-09-28', [10, 10, 10])], {}, { '1repmaxformula': 'NONE' });
    assert.equal(coach.isExerciseEligible('lift'), false);
    assert.equal(recommend(coach), null);
});
test('unsupported and reversed rep ranges request plan setup', () => {
    const coach = setup([log('2026-09-28')]);
    for (const reps of ['30 seconds', 'AMRAP', '10-6', '0', '3x10']) {
        assert.equal(coach.buildCoachRecommendation('lift', { reps, sets: 4 }).action, 'setup');
    }
});
test('missed attempts preserve the strongest season reference', () => {
    const result = recommend(setup([log('2026-09-28', [5, 5, 5], 225), log('2026-09-25', [5, 5, 5], 225)]));
    assert.equal(result.action, 'repeat');
    assert.equal(result.targetWeightDisplay, 197);
    assert.equal(result.bestEstimate.reps, 5);
});
test('incomplete and varied attempts cannot erase historical strength', () => {
    for (const latest of [log('2026-09-28', [5, 5, 5], 100), log('2026-09-28', [5], 100)]) {
        const result = recommend(setup([log('2026-09-25', [10, 10, 10], 150), latest]));
        assert.equal(result.targetWeightDisplay, 150);
    }
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
    assert.equal(setup().getRepresentativeWeightKg(sets), 40);
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
    assert.equal(advice[1].targetWeightDisplay, 100);
});
test('a single chart point produces finite SVG coordinates', () => {
    const coach = setup([log('2026-09-28')]);
    const target = recommend(coach);
    const chart = coach.buildTrainingPlanChart(target.recentSessions, target.baselineSession, 1, 5);
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

test('STATS dropdowns show the calculated weighted targets and escape names', () => {
    const target = recommend(setup([log('2026-09-25', [10, 10, 10], 90), log('2026-09-28', [10, 10, 10], 100)]));
    assert.equal(target.action, 'increase');
    const sandbox = pageContext('progression.html', ['renderLiftActions', 'formatLiftWeight', 'getLiftName', 'escapeHtml', 'progressionIcon'], {
        liftRows: [{ id: 'lift', exercise: { name: 'Press <heavy>' }, planExercise: {}, recommendation: target }]
    });
    sandbox.renderLiftActions();
    const html = sandbox.elements.get('liftActions').innerHTML;
    assert.ok(html.includes('Ready to add weight: 1'));
    assert.ok(html.includes('Press &lt;heavy&gt;'));
    assert.ok(html.includes('100 lbs × 10 reps'));
    assert.ok(html.includes('Best estimated max: 133 lbs'));
    assert.ok(!html.includes('Try a lighter weight'));
});

test('STATS action dropdowns disappear when no matching recommendations remain', () => {
    const sandbox = pageContext('progression.html', ['renderLiftActions', 'formatLiftWeight', 'getLiftName', 'escapeHtml', 'progressionIcon'], {
        liftRows: [{ id: 'a', exercise: { name: 'Press' }, planExercise: {}, recommendation: recommend(setup([log('2026-09-25', [10, 10, 10], 90), log('2026-09-28', [10, 10, 10])])) }]
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

test('Coach modal renders weighted evidence, live completion, and escaped exercise names', () => {
    const coach = setup([log('2026-09-28')]);
    const target = recommend(coach);
    const sandbox = pageContext('app.html', ['showTrainingPlanModal'], {
        coach, activeProgressionTargets: { key: target }, getExerciseForUI: () => ({ name: '<script>bad</script>' }),
        escapeHtml: value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'),
        formatDate: date => new Date(date).toISOString().slice(0, 10), openModal() {},
        collectCurrentExerciseWorkingSets: () => log('2026-09-29', [10, 10, 10], 110).exercises[0].sets
    });
    sandbox.showTrainingPlanModal('key');
    const html = sandbox.elements.get('trainingPlanModalContent').innerHTML;
    assert.ok(html.includes('3 working sets × 6-10 reps'));
    assert.ok(html.includes('This workout: Ready to increase'));
    assert.ok(html.includes('data-complete="true"'));
    assert.ok(html.includes('Estimated max improved'));
    assert.ok(html.includes('2026-09-28'));
    assert.ok(html.includes('&lt;script&gt;'));
    assert.ok(!html.includes('<script>bad'));
    sandbox.collectCurrentExerciseWorkingSets = () => log('2026-09-29', [10, 10, 10], 90).exercises[0].sets;
    sandbox.showTrainingPlanModal('key');
    assert.ok(sandbox.elements.get('trainingPlanModalContent').innerHTML.includes('data-complete="false"'));
});
test('completed historical milestones show the calculated target without a second step', () => {
    const coach = setup([log('2026-09-25', [10, 10, 10], 90), log('2026-09-28', [10, 10, 10], 100)]);
    const target = recommend(coach);
    assert.equal(target.action, 'increase');
    const sandbox = pageContext('app.html', ['showTrainingPlanModal'], {
        coach, activeProgressionTargets: { key: target }, getExerciseForUI: () => ({ name: 'Test lift' }),
        escapeHtml: String, formatDate: String, collectCurrentExerciseWorkingSets: () => [], openModal() {}
    });
    sandbox.showTrainingPlanModal('key');
    const html = sandbox.elements.get('trainingPlanModalContent').innerHTML;
    assert.ok(html.includes('data-step="2" data-state="complete"'));
    assert.ok(html.includes('<strong>100 lbs</strong>'));
    assert.ok(!html.includes('105 lbs'));
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
test('working-set completion and growth counts tolerate varied order and loads', () => {
    const coach = setup([log('2026-09-28', [8, 8], 160)]);
    const target = coach.buildCoachRecommendation('lift', { reps: '8-10', sets: 3 });
    for (const reps of [[8, 10, 10, 8], [10, 10, 8, 10], [10, '', 10], [8, 8, 8, 8]]) {
        const sets = reps.map(reps => ({ reps, weight: lbsToKg(160) }));
        const evaluation = coach.evaluateProgressionSets(sets, target);
        assert.equal(evaluation.complete, true);
        assert.equal(evaluation.planComplete, true);
        assert.equal(evaluation.progressEarned, reps.includes(10));
    }
    const onlyOne = coach.evaluateProgressionSets([{ reps: 20, weight: lbsToKg(160) }], target);
    assert.equal(onlyOne.complete, false);
    assert.equal(onlyOne.progressEarned, false);
});
test('weighted strength progression is independent of consecutive growth ordering', () => {
    const prior = log('2026-09-25', [8, 8, 8], 160);
    for (const reps of [[8, 10, 10, 8], [10, 8, 10, 8]]) {
        const target = recommend(setup([prior, log('2026-09-28', reps, 160)]));
        assert.equal(target.action, 'increase');
        assert.equal(target.targetWeightDisplay, 160);
    }
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
        getNow: () => now, lbsToKg, displayWeight,
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
    assert.ok(sandbox.elements.get('coachFocusDetail').textContent.includes('Build estimated strength'));
});
test('workout UI files exclude the explicitly prohibited vocabulary', () => {
    for (const file of ['app.html', 'progression.html', 'js/coach.js']) {
        assert.ok(!prohibitedCopy.test(fs.readFileSync(path.join(root, file), 'utf8')), file);
    }
});

test('bodyweight equipment excludes coaching even with a custom strength formula', () => {
    const coach = setup([log('2026-09-28')], {}, { equipment: 'Bodyweight', '1repmaxformula': 'w*(1+(r/30))' });
    assert.equal(coach.isExerciseEligible('lift'), false);
    assert.equal(recommend(coach), null);
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
test('the workout entry turns green at the minimum prescription independently of growth sets', () => {
    const coach = setup();
    const target = {
        ...coach.buildCoachRecommendation('lift', { reps: '8-12', sets: 5 }),
        targetWeightKg: lbsToKg(160)
    };
    assert.equal(target.requiredWorkingSets, 4);
    let liveSets = [];
    const sandbox = pageContext('app.html', ['checkExerciseCompletion'], {
        coach, activeProgressionTargets: { key: target },
        collectCurrentExerciseWorkingSets: () => liveSets,
        getExerciseForUI: () => ({ name: 'Test lift' })
    });
    const entryStates = new Map();
    const coachStates = new Map();
    sandbox.document.getElementById('exercise-key').classList.toggle = (name, value) => entryStates.set(name, value);
    sandbox.document.getElementById('coach-btn-key').classList.toggle = (name, value) => coachStates.set(name, value);
    for (const reps of [[8, 8, 8, 8], [10, 10, 8, 8], [12, 12, 8, 8]]) {
        liveSets = reps.map(reps => ({ reps, weight: lbsToKg(160) }));
        sandbox.checkExerciseCompletion('key');
        const evaluation = coach.evaluateProgressionSets(liveSets, target);
        assert.equal(evaluation.planComplete, true);
        assert.equal(evaluation.satisfactorySets, 4);
        assert.equal(evaluation.growthSets, reps[0] === 12 ? 2 : 0);
        assert.equal(entryStates.get('completed'), true);
        assert.equal(coachStates.get('achieved'), false);
        assert.equal(sandbox.elements.get('coach-status-key').textContent, 'Session target met');
    }
    // Extra unfinished or below-target sets cannot revoke completed prescribed work.
    liveSets = [...[8, 8, 8, 8].map(reps => ({ reps, weight: lbsToKg(160) })),
        { reps: 5, weight: lbsToKg(150) }, { reps: NaN, weight: NaN }];
    sandbox.checkExerciseCompletion('key');
    assert.equal(entryStates.get('completed'), true);
    for (const sets of [
        [8, 8, 8].map(reps => ({ reps, weight: lbsToKg(160) })),
        [8, 8, 8, 7].map(reps => ({ reps, weight: lbsToKg(160) })),
        [160, 160, 160, 150].map(weight => ({ reps: 8, weight: lbsToKg(weight) })),
        [...[8, 8, 8].map(reps => ({ reps, weight: lbsToKg(160) })), { reps: 8, weight: lbsToKg(160), isWarmup: true }]
    ]) {
        liveSets = sets;
        sandbox.checkExerciseCompletion('key');
        assert.equal(entryStates.get('completed'), false);
        assert.equal(coachStates.get('achieved'), false);
    }
    liveSets = [12, 12, 12, 12].map(reps => ({ reps, weight: lbsToKg(160) }));
    sandbox.checkExerciseCompletion('key');
    assert.equal(entryStates.get('completed'), true);
    assert.equal(coachStates.get('achieved'), true);
});

test('calendar comparison does not label a valid repeated load as a failure', () => {
    const coach = setup([log('2026-09-02'), log('2026-09-28')], { goalIncreaseKg: 100 });
    const target = recommend(coach);
    assert.equal(target.action, 'repeat');
    const chart = coach.buildTrainingPlanChart(target.recentSessions, target.baselineSession, 10, 100);
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
test('starting set charts retain missing states and ineligible lifts never get targets', () => {
    const coach = setup();
    assert.ok(coach.buildCoachSetChart([], recommend(coach)).includes('data-state="missing"'));
    assert.equal(recommend(setup([], { targetMode: 'bodyweight' })), null);
});
test('weight trend works without a configured season goal', () => {
    const coach = setup([log('2026-09-28')], { goalIncreaseKg: 0 });
    const target = recommend(coach);
    const html = coach.buildTrainingPlanChart(target.recentSessions, target.baselineSession, 0, 0);
    assert.ok(html.includes('<svg'));
    assert.ok(!html.includes('Season reference'));
    assert.ok(!html.includes('class="training-plan-chart-plan"'));
    assert.ok(!/NaN|Infinity/.test(html));
});

// Strength-based coaching uses the actual PR calculator, including per-lift formulas.
const epleyExercise = { '1repmaxformula': 'w*(1+(r/30))' };
function strengthCoach(logs, exercise = epleyExercise) {
    return setup(logs, {}, { '1repmaxformula': '', ...exercise });
}
function rampLog(date = '2026-09-28', weights = [130, 145, 160, 175], reps = [8, 8, 8, 8]) {
    return { date, exercises: [{ id: 'lift', sets: [
        { weight: lbsToKg(115), reps: 8, isWarmup: true },
        ...weights.map((weight, index) => ({ weight: lbsToKg(weight), reps: reps[index] }))
    ] }] };
}
test('ascending pulldown sets use the PR max estimate to calculate the ten-rep weight', () => {
    const history = rampLog();
    const coach = strengthCoach([history]);
    const target = recommend(coach);
    const pr = window.WorkoutStrength.getBestEstimatedOneRepMax(epleyExercise, history.exercises[0].sets);
    const tracker = window.WorkoutRecords.create({
        getWorkoutLogs: () => [history], getSeasonStartDate: () => '2026-09-01', getExerciseData: () => epleyExercise
    });
    const record = tracker.evaluateExercise('lift', history.exercises[0].sets);
    assert.equal(target.bestEstimate.estimatedMaxKg, record.previousBest.estimatedMaxKg);
    assert.equal(target.bestEstimate.estimatedMaxKg, pr.estimatedMaxKg);
    assert.equal(displayWeight(pr.weightKg), 175);
    assert.ok(Math.abs(pr.estimatedMaxKg / lbsToKg(1) - 221.6666667) < 0.000001);
    assert.equal(target.targetWeightDisplay, 167);
    assert.equal(target.requiredWorkingSets, 3);
    assert.equal(target.usesEstimatedMax, true);
    const lighter = coach.evaluateProgressionSets(log('2026-09-29', [10, 10, 10], 130).exercises[0].sets, target);
    assert.equal(lighter.progressEarned, false);
    assert.equal(lighter.planComplete, false);
    assert.equal(lighter.growthSets, 0);
    const matched = coach.evaluateProgressionSets(history.exercises[0].sets, target);
    assert.equal(matched.strengthProgressEarned, false);
    const improved = coach.evaluateProgressionSets(rampLog('2026-09-29', [145, 160, 180], [8, 8, 8]).exercises[0].sets, target);
    assert.equal(improved.strengthProgressEarned, true);
    assert.equal(improved.progressEarned, true);
    assert.equal(improved.rangeProgressEarned, false);
    assert.equal(coach.getEstimatedTargetWeightKg(improved.bestEstimate.estimatedMaxKg, 10, 'lift') / lbsToKg(1), 171);
    assert.equal(coach.evaluateProgressionSets([{ weight: lbsToKg(180), reps: 8 }], target).progressEarned, false);
});
test('maximum estimated strength can come from a lighter, higher-rep set', () => {
    const target = recommend(strengthCoach([rampLog('2026-09-28', [180, 175, 145], [3, 10, 8])]));
    assert.equal(displayWeight(target.bestEstimate.weightKg), 175);
    assert.equal(target.bestEstimate.reps, 10);
    assert.equal(target.targetWeightDisplay, 175);
});
test('an easier latest workout does not erase the best season strength reference', () => {
    const coach = strengthCoach([rampLog('2026-09-05'), log('2026-09-28', [10, 10, 10], 130)]);
    const target = recommend(coach);
    assert.equal(target.targetWeightDisplay, 167);
    assert.equal(displayWeight(target.bestEstimate.weightKg), 175);
    assert.equal(target.recentSessions.length, 1);
    assert.equal(target.action, 'repeat');
    assert.equal(coach.evaluateProgressionSets(log('2026-09-29', [10, 10, 10], 130).exercises[0].sets, target).progressEarned, false);
});
test('warmups, invalid entries, other lifts, future and pre-season records cannot set the target', () => {
    const history = rampLog();
    history.exercises[0].sets.push({ weight: lbsToKg(900), reps: 10, isWarmup: true },
        { weight: lbsToKg(900), reps: 8.5 }, { weight: '', reps: 10 }, { weight: lbsToKg(900), reps: '10oops' });
    history.exercises.push({ id: 'other', sets: [{ weight: lbsToKg(900), reps: 10 }] });
    const target = recommend(strengthCoach([history, log('2026-08-28', [10, 10, 10], 900), log('2026-10-01', [10, 10, 10], 900)]));
    assert.equal(target.targetWeightDisplay, 167);
});
test('coach and PR estimates share custom formulas, fallback formulas and actual high reps', () => {
    for (const exercise of [epleyExercise, { '1repmaxformula': 'w*36/(37-r)' }, { '1repmaxformula': 'invalid' }, {}]) {
        const history = rampLog('2026-09-28', [130, 145, 160], [8, 10, 20]);
        const target = recommend(strengthCoach([history], exercise));
        const pr = window.WorkoutStrength.getBestEstimatedOneRepMax(exercise, history.exercises[0].sets);
        assert.equal(target.bestEstimate.estimatedMaxKg, pr.estimatedMaxKg);
        assert.equal(target.bestEstimate.calculationReps, 20);
        const inverse = window.WorkoutStrength.calculateWeightForEstimatedMax(exercise, pr.estimatedMaxKg, 10);
        assert.ok(Math.abs(window.WorkoutStrength.estimateOneRepMax(exercise, inverse, 10).estimatedMaxKg - pr.estimatedMaxKg) < 0.000001);
        assert.equal(target.targetWeightDisplay, Math.ceil(inverse / lbsToKg(1) - 0.000001));
    }
});
test('a new max recalculates the recommendation without adding an arbitrary equipment step', () => {
    const target = recommend(strengthCoach([rampLog('2026-09-25'), rampLog('2026-09-28', [145, 160, 180], [8, 8, 8])]));
    assert.equal(target.action, 'increase');
    assert.equal(target.targetWeightDisplay, 171);
});
test('incomplete attempts and long breaks retain the season strength reference', () => {
    const incomplete = recommend(strengthCoach([rampLog('2026-09-25'), log('2026-09-28', [8], 100)]));
    assert.equal(incomplete.action, 'incomplete');
    assert.equal(incomplete.targetWeightDisplay, 167);
    const returning = recommend(strengthCoach([rampLog('2026-09-02')]));
    assert.equal(returning.action, 'return');
    assert.equal(returning.targetWeightDisplay, 167);
});
test('strength coach modal shows estimated progression and recalculates the next weight', () => {
    const coach = strengthCoach([rampLog()]);
    const target = recommend(coach);
    const sandbox = pageContext('app.html', ['showTrainingPlanModal'], {
        coach, activeProgressionTargets: { key: target }, getExerciseForUI: () => ({ name: 'Pulldown' }),
        escapeHtml: String, formatDate: String, openModal() {},
        collectCurrentExerciseWorkingSets: () => rampLog('2026-09-29', [145, 160, 180], [8, 8, 8]).exercises[0].sets
    });
    sandbox.showTrainingPlanModal('key');
    const html = sandbox.elements.get('trainingPlanModalContent').innerHTML;
    assert.ok(html.includes('167 lbs'));
    assert.ok(html.includes('171 lbs'));
    assert.ok(html.includes('This workout: Ready to increase'));
    assert.ok(html.includes('Estimated max improved'));
    assert.ok(html.includes('Beat your estimated max'));
    assert.ok(html.includes('data-step="2" data-state="complete"'));
    assert.ok(!html.includes('Estimated maxes and personal records do not earn'));
    sandbox.collectCurrentExerciseWorkingSets = () => log('2026-09-29', [10, 10, 10], 130).exercises[0].sets;
    sandbox.showTrainingPlanModal('key');
    const lighter = sandbox.elements.get('trainingPlanModalContent').innerHTML;
    assert.ok(!lighter.includes('Ready to increase'));
    assert.ok(!lighter.includes('Growth sets complete'));
    assert.ok(lighter.includes('data-complete="false"'));
});
test('saved strength progression shows its calculated next weight in both pages', () => {
    const coach = strengthCoach([rampLog('2026-09-25'), rampLog('2026-09-28', [145, 160, 180], [8, 8, 8])]);
    const target = recommend(coach);
    assert.equal(target.lastEvaluation.strengthProgressEarned, true);
    const modal = pageContext('app.html', ['showTrainingPlanModal'], {
        coach, activeProgressionTargets: { key: target }, getExerciseForUI: () => ({ name: 'Pulldown' }),
        escapeHtml: String, formatDate: String, openModal() {}, collectCurrentExerciseWorkingSets: () => []
    });
    modal.showTrainingPlanModal('key');
    const html = modal.elements.get('trainingPlanModalContent').innerHTML;
    assert.ok(html.includes('171 lbs'));
    assert.ok(html.includes('Estimated max improved'));
    assert.ok(html.includes('data-step="1" data-state="complete"'));
    assert.ok(html.includes('data-step="2" data-state="complete"'));
    const stats = pageContext('progression.html', ['renderLiftActions', 'formatLiftWeight', 'getLiftName', 'escapeHtml', 'progressionIcon'], {
        liftRows: [{ id: 'lift', exercise: { name: 'Pulldown' }, planExercise: {}, recommendation: target }]
    });
    stats.renderLiftActions();
    const actions = stats.elements.get('liftActions').innerHTML;
    assert.ok(actions.includes('171 lbs × 10 reps'));
    assert.ok(actions.includes('Best estimated max: 228 lbs'));
    assert.ok(!actions.includes('0 lbs <span>next time'));
});
test('15 and 20 reps remain distinct PRs and produce the correct twenty-rep coach target', () => {
    const history = log('2026-09-28', [15, 15, 15], 100);
    const coach = strengthCoach([history]);
    const target = coach.buildCoachRecommendation('lift', { reps: '12-20', sets: 4 });
    const tracker = window.WorkoutRecords.create({
        getWorkoutLogs: () => [history], getSeasonStartDate: () => '2026-09-01', getExerciseData: () => epleyExercise
    });
    const current = log('2026-09-29', [20, 20, 20], 100).exercises[0].sets;
    const record = tracker.evaluateExercise('lift', current);
    assert.equal(target.bestEstimate.calculationReps, 15);
    assert.ok(Math.abs(target.bestEstimate.estimatedMaxKg / lbsToKg(1) - 150) < 0.000001);
    assert.equal(target.targetWeightDisplay, 90);
    assert.equal(record.current.calculationReps, 20);
    assert.ok(Math.abs(record.current.estimatedMaxKg / lbsToKg(1) - 166.6666667) < 0.000001);
    assert.equal(record.isPR, true);
    assert.equal(coach.evaluateProgressionSets(current, target).strengthProgressEarned, true);
    const matched = coach.evaluateProgressionSets(log('2026-09-29', [20, 20, 20], 90).exercises[0].sets, target);
    assert.equal(matched.rangeProgressEarned, true);
    assert.equal(matched.strengthProgressEarned, false);
    assert.equal(matched.progressEarned, false);
});
test('twenty-rep targets invert each lift formula rather than a hardcoded Epley formula', () => {
    const exercise = { '1repmaxformula': 'w*36/(37-r)' };
    const coach = strengthCoach([log('2026-09-28', [15, 15, 15], 100)], exercise);
    const target = coach.buildCoachRecommendation('lift', { reps: '12-20', sets: 4 });
    assert.ok(Math.abs(target.bestEstimate.estimatedMaxKg / lbsToKg(1) - 100 * 36 / 22) < 0.000001);
    assert.equal(target.bestEstimate.formula, exercise['1repmaxformula']);
    assert.equal(target.targetWeightDisplay, 78); // 100 * (37 - 20) / (37 - 15), rounded up.
    for (const reps of [15, 20]) {
        const estimate = window.WorkoutStrength.estimateOneRepMax(exercise, lbsToKg(100), reps);
        const inverse = window.WorkoutStrength.calculateWeightForEstimatedMax(exercise, estimate.estimatedMaxKg, reps);
        assert.equal(estimate.calculationReps, reps);
        assert.ok(Math.abs(inverse - lbsToKg(100)) < 0.000001);
    }
});
test('bundled exercise formulas are honored identically by the coach and PR tracker', () => {
    const exerciseData = JSON.parse(fs.readFileSync(path.join(root, 'exercises.json')));
    for (const exercise of Object.values(exerciseData).filter(ex => ex && typeof ex === 'object')) {
        const history = log('2026-09-28', [15, 20, 8], 100);
        const coach = strengthCoach([history], exercise);
        const target = coach.buildCoachRecommendation('lift', { reps: '12-20', sets: 4 });
        const tracker = window.WorkoutRecords.create({
            getWorkoutLogs: () => [history], getSeasonStartDate: () => '2026-09-01', getExerciseData: () => exercise
        });
        const record = tracker.evaluateExercise('lift', history.exercises[0].sets);
        if (exercise['1repmaxformula']?.trim().toUpperCase() === 'NONE') {
            assert.equal(target, null);
            assert.equal(record.current.mode, 'repsOnly');
        } else {
            assert.equal(target.bestEstimate.estimatedMaxKg, record.current.estimatedMaxKg);
            assert.equal(target.bestEstimate.formula, record.current.formula);
            assert.equal(target.bestEstimate.calculationReps, record.current.calculationReps);
        }
    }
});

test('the actual catalog Pull Up is excluded from advice while weighted lifts remain eligible', () => {
    const catalog = JSON.parse(fs.readFileSync(path.join(root, 'exercises.json')));
    const coach = window.WorkoutCoach.create({
        getExerciseData: id => catalog[id], getSeasonStartDate: () => '2026-09-01',
        getNow: () => now, lbsToKg, displayWeight
    });
    assert.equal(coach.isExerciseEligible('ex003'), false);
    assert.equal(coach.getProgressionTarget('ex003', '6-10', { sets: 4 }), null);
    assert.equal(coach.isExerciseEligible('ex013'), true);
    const advice = coach.getWorkoutAdvice([
        { id: 'ex003', reps: '6-10', sets: 4 }, { id: 'ex013', reps: '8-12', sets: 3 }
    ]);
    assert.deepEqual(Array.from(advice, entry => entry.exerciseId), ['ex013']);
});

test('progression filters bodyweight and rep-only plan entries before any lift calculations', () => {
    const catalog = JSON.parse(fs.readFileSync(path.join(root, 'exercises.json')));
    const coach = window.WorkoutCoach.create({ getExerciseData: id => catalog[id] });
    const trainingPlanData = { schedule: Array(7).fill('mixed'), workouts: { mixed: { exercises: [
        { id: 'ex003', reps: '6-10', sets: 4 }, { id: 'ex013', reps: '8-12', sets: 3 },
        { id: 'ex055', reps: '8-12', sets: 3 }
    ] } } };
    const sandbox = pageContext('progression.html', ['getTrainingPlanEntries', 'parseRepRange'], {
        coach, trainingPlanData, progressionPlanData: {}, exercisesData: catalog
    });
    assert.deepEqual(Array.from(sandbox.getTrainingPlanEntries(), entry => entry.id), ['ex013']);
});

test('future historical sets cannot suppress current strength or rep PRs', () => {
    for (const exercise of [epleyExercise, { '1repmaxformula': 'NONE' }]) {
        const tracker = window.WorkoutRecords.create({
            getWorkoutLogs: () => [log('2026-09-28', [8], 100), log('2026-10-01', [30], 400)],
            getSeasonStartDate: () => '2026-09-01', getExerciseData: () => exercise, getNow: () => now
        });
        const result = tracker.evaluateExercise('lift', log('2026-09-29', [10], 150).exercises[0].sets);
        assert.equal(result.isPR, true);
        assert.equal(tracker.getSeasonLogs().length, 1);
        assert.ok(tracker.getPRTimeline().every(event => new Date(event.date) <= now));
    }
});

test('future-history filtering retains records at the exact current instant', () => {
    const tracker = window.WorkoutRecords.create({
        getWorkoutLogs: () => [log(now.toISOString(), [10], 100)],
        getSeasonStartDate: () => '2026-09-01', getExerciseData: () => epleyExercise, getNow: () => now
    });
    assert.equal(tracker.getSeasonLogs().length, 1);
    assert.equal(tracker.evaluateExercise('lift', log('2026-09-29', [8], 90).exercises[0].sets).isPR, false);
});
