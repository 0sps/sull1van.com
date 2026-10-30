const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../training-plan-editor.html'), 'utf8');
const appSource = fs.readFileSync(path.join(__dirname, '../app.html'), 'utf8');
const clone = value => JSON.parse(JSON.stringify(value));
const makePlan = () => ({ name: 'My plan', schedule: Array(7).fill('LIFT'), workouts: {
    LIFT: { subtitle: 'Push', exercises: [{ id: 'ex001', sets: 3, reps: '8-12' }] }
} });
function loadFunction(context, name, text = source) {
    const match = text.match(new RegExp(`^        (?:async )?function ${name}\\([^]*?\\n        }`, 'm'));
    assert.ok(match, `${name} exists`);
    vm.runInContext(match[0], context);
}
function harness() {
    const messages = [];
    const context = vm.createContext({
        DAYS: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], planMode: 'import',
        exercisesData: { ex001: { name: 'Bench' }, ex002: { name: 'Row' } },
        el: { importJsonInput: { value: '' } }, selectedDayIndex: 0,
        editorDays: [{ exercises: [] }], isValidDayIndex: index => index === 0,
        markPlanDirty() {}, syncMatchingWorkoutDays() {}, renderSelectedDay() {}, renderValidation() {},
        showToast: (...args) => messages.push(args), getSharedWorkoutDefinitionErrors: () => []
    });
    for (const name of ['normalizeImportedTrainingPlan', 'parseImportedTrainingPlan', 'isExerciseCatalogEntry',
        'validatePlan', 'addExerciseToSelectedDay']) loadFunction(context, name);
    return { context, messages };
}

test('visual editor refuses duplicate add, permits another lift and permits re-add after removal', () => {
    const { context: c, messages } = harness();
    c.addExerciseToSelectedDay('ex001');
    c.addExerciseToSelectedDay('ex001');
    c.addExerciseToSelectedDay('ex002');
    assert.deepEqual(clone(c.editorDays[0].exercises).map(ex => ex.id), ['ex001', 'ex002']);
    assert.match(messages[0][0], /already in this workout/);
    c.editorDays[0].exercises.shift();
    c.addExerciseToSelectedDay('ex001');
    assert.equal(c.editorDays[0].exercises.length, 2);
});

test('validation rejects duplicate IDs from imports and existing build-mode plans', () => {
    const { context: c } = harness();
    const plan = makePlan(); plan.workouts.LIFT.exercises.push({ id: 'ex001', sets: 4, reps: '5-8' });
    for (const mode of ['import', 'build']) {
        c.planMode = mode;
        const result = c.validatePlan(plan);
        assert.equal(result.valid, false);
        assert.ok(result.errors.some(error => error.includes('repeats exercise id')));
    }
});

test('same exercise remains allowed across different scheduled workouts', () => {
    const { context: c } = harness(); const plan = makePlan();
    plan.schedule[1] = 'SECOND'; plan.workouts.SECOND = clone(plan.workouts.LIFT);
    assert.equal(c.validatePlan(plan).valid, true);
});

test('import normalizes schedule, workout keys and IDs before app lookup and persistence', () => {
    const { context: c } = harness(); const plan = makePlan();
    plan.schedule = Array(7).fill(' LIFT ');
    plan.workouts = { ' LIFT ': plan.workouts.LIFT };
    plan.workouts[' LIFT '].exercises[0].id = ' ex001 ';
    c.el.importJsonInput.value = JSON.stringify(plan);
    const parsed = c.parseImportedTrainingPlan();
    assert.equal(parsed.valid, true); assert.equal(c.validatePlan(parsed.plan).valid, true);
    assert.equal(parsed.plan.schedule[0], 'LIFT');
    assert.equal(parsed.plan.workouts.LIFT.exercises[0].id, 'ex001');
    assert.equal(parsed.plan.name, 'My plan');
    c.trainingPlanData = parsed.plan;
    c.getExercise = id => c.exercisesData[id];
    loadFunction(c, 'getWorkoutData', appSource);
    const workout = c.getWorkoutData(0);
    assert.equal(workout.name, 'LIFT');
    assert.equal(workout.exercises[0].exerciseId, 'ex001');
});

test('normalization rejects colliding workout keys rather than losing a definition', () => {
    const { context: c } = harness(); const plan = makePlan();
    plan.workouts[' LIFT '] = { exercises: [] };
    c.el.importJsonInput.value = JSON.stringify(plan);
    const parsed = c.parseImportedTrainingPlan();
    assert.equal(parsed.valid, false); assert.match(parsed.error, /collide/);
});

test('duplicate imported IDs are rejected after trimming', () => {
    const { context: c } = harness(); const plan = makePlan();
    plan.workouts.LIFT.exercises.push({ id: ' ex001 ', sets: 3, reps: '8-12' });
    c.el.importJsonInput.value = JSON.stringify(plan);
    const parsed = c.parseImportedTrainingPlan();
    assert.equal(parsed.valid, true); assert.equal(c.validatePlan(parsed.plan).valid, false);
});

test('malformed schedules report validation errors and numeric names stay invalid', () => {
    const { context: c } = harness();
    for (const schedule of [null, 'invalid', {}, [], [1, 1, 1, 1, 1, 1, 1]]) {
        const plan = makePlan(); plan.schedule = schedule;
        assert.equal(c.validatePlan(plan).valid, false);
    }
});
