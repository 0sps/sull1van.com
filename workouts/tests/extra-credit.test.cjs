const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'app.html'), 'utf8');
const exercises = JSON.parse(fs.readFileSync(path.join(root, 'exercises.json')));
const clone = value => JSON.parse(JSON.stringify(value));

function setup() {
    const storage = new Map();
    const notices = [];
    const modals = [];
    const logs = [];
    const context = vm.createContext({
        isSaving: false, currentWorkoutDay: 1, extraCreditExerciseIds: [],
        currentExerciseData: { '1_ex366': { 0: { reps: '15' } } },
        currentSetCounts: { '1_ex366': 1 }, completedExerciseState: {}, exercisePrResults: {},
        EXTRA_CREDIT_PICKS: { ex367: { reps: '12–20' } }, CONFIG: { LOCAL_STORAGE_TTL: 172800000 },
        getWorkoutData: () => ({ exercises: [{ exerciseId: 'ex366', sets: 1 }] }),
        getExercise: id => exercises[id], getExerciseForUI: id => exercises[id],
        weightUnit: 'lbs', lbsToKg: weight => weight * 0.45359237,
        showNotification: (...args) => notices.push(args), openModal: id => modals.push(id),
        saveWorkoutData: async data => logs.push(clone(data)), pendingWorkoutData: null,
        renderExtraCredit() {}, document: { getElementById: () => ({ focus() {}, querySelector: () => null }) },
        migrateLegacyProgressKey() {}, getProgressStorageKey: () => 'draft',
        localStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) }
    });
    for (const name of ['getExtraCreditExercises', 'addExtraCreditExercise', 'removeExtraCreditExercise',
        'saveWorkoutProgress', 'loadWorkoutProgress', 'completeWorkout']) {
        const match = source.match(new RegExp(`^        (?:async )?function ${name}\\([^]*?\\n        }`, 'm'));
        assert.ok(match, name);
        vm.runInContext(match[0], context);
    }
    return { context, logs, modals, notices };
}

test('empty optional entries do not block completion and partially filled extras log only entered sets', async () => {
    const { context, logs, modals, notices } = setup();
    context.addExtraCreditExercise('ex367');
    context.currentSetCounts.bonus_1_ex367 = 2;
    await context.completeWorkout();
    assert.deepEqual(logs[0].map(ex => ex.id), ['ex366']);

    context.currentExerciseData.bonus_1_ex367 = { 0: { reps: '12', weight: '5' } };
    await context.completeWorkout();
    assert.deepEqual(logs[1].map(ex => ex.id), ['ex366', 'ex367']);
    assert.deepEqual(logs[1][1].sets, [{ reps: 12, weight: 5 * 0.45359237, isWarmup: false, note: '' }]);
    assert.deepEqual(modals, []);
    assert.deepEqual(notices, []);

    context.currentSetCounts['1_ex366'] = 2;
    await context.completeWorkout();
    assert.deepEqual(modals, ['zeroRepsModal']);
    assert.equal(logs.length, 2);
    assert.equal(context.pendingWorkoutData.exercises.length, 2);
});

test('extra selections and entered sets stay scoped to a day and reject duplicate or unknown exercises', () => {
    const { context } = setup();
    for (const id of ['ex366', 'ex9999', 'ex367', 'ex367']) context.addExtraCreditExercise(id);
    context.currentExerciseData.bonus_1_ex367 = { 0: { reps: '9' } };
    context.saveWorkoutProgress();
    assert.deepEqual(clone(context.extraCreditExerciseIds), ['ex367']);

    context.currentWorkoutDay = 2;
    context.extraCreditExerciseIds = [];
    context.currentExerciseData = {};
    assert.equal(context.loadWorkoutProgress(), false);
    assert.deepEqual(clone(context.extraCreditExerciseIds), []);

    context.currentWorkoutDay = 1;
    assert.equal(context.loadWorkoutProgress(), true);
    assert.deepEqual(clone(context.extraCreditExerciseIds), ['ex367']);
    assert.equal(context.currentExerciseData.bonus_1_ex367[0].reps, '9');
    context.removeExtraCreditExercise('ex367');
    assert.deepEqual(clone(context.extraCreditExerciseIds), []);
    assert.equal(context.currentExerciseData.bonus_1_ex367, undefined);
    assert.equal(context.currentExerciseData['1_ex366'][0].reps, '15');
});
