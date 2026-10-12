const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../app.html'), 'utf8');
const WorkoutDate = require('../js/workout-date.js');
const clone = value => JSON.parse(JSON.stringify(value));

function harness() {
    const elements = new Map(), saves = [], modals = [], focus = [];
    const exercises = {
        ex001: { name: 'Bench press', category: 'Push', muscles: ['Chest'] },
        ex002: { name: 'Lat pulldown', category: 'Pull', muscles: ['Back'] },
        ex003: { name: 'Cable <curl>', category: 'Pull', muscles: ['Biceps'] }
    };
    const original = { id: 'original-id', revision: 4, date: '2026-10-06T19:05:09.678Z', workoutName: 'Push day',
        exercises: [{ id: 'ex001', name: 'Bench press', sets: [{ weight: 50, reps: 8, isWarmup: false }] }] };
    const escape = value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    const context = vm.createContext({
        editingLogData: null, isSaving: false, pendingWorkoutData: null, workoutLogs: [original], WorkoutDate,
        document: { getElementById(id) {
            if (!elements.has(id)) elements.set(id, {
                value: '', innerHTML: '', textContent: '', style: {}, dataset: {}, open: false, disabled: false,
                reportValidity: () => true, focus: () => focus.push(id),
                querySelector: selector => ({ focus: () => focus.push(selector) })
            });
            return elements.get(id);
        } },
        getExerciseEntries: () => Object.entries(exercises), getExerciseForUI: id => ({ id, ...exercises[id] }),
        findSeasonLog: id => context.workoutLogs.find(log => log.id === id), formatDateFull: date => date.toISOString(),
        escapeHtml: escape, escapeAttr: escape, escapeInlineJsString: escape,
        displayWeight: kg => Math.round(kg / 0.45359237), lbsToKg: lbs => lbs * 0.45359237,
        validateWorkoutInput: (type, value) => ({ sanitizedValue: value }),
        closeModal: id => modals.push(`close:${id}`), openModal: id => modals.push(`open:${id}`),
        showNotification: () => { throw new Error('Unexpected notification'); },
        saveToFirebase: async (log, options) => { saves.push({ log: clone(log), options }); return true; },
        compareLogIds: (a, b) => String(a) === String(b), upsertRecordHistoryLog() {}, invalidateStatsCache() {},
        renderRecentLogs() {}, updateStats() {}, renderFullHistory() {}, console,
        showButtonSuccess: (btn, text, time, callback) => callback()
    });
    for (const name of ['generateSetHTML', 'generateExerciseHTML', 'loadWorkoutForEditing', 'renderEditExercises',
        'renderEditExercisePicker', 'addExerciseToEdit', 'addEditSet', 'removeEditSet', 'updateEditExerciseData',
        'removeExerciseFromEdit', 'closeEditModal', 'validateAndCleanWorkout', 'saveEditedWorkout', 'finalizeEditedWorkoutSave']) {
        const match = source.match(new RegExp(`^        (?:async )?function ${name}\\([^]*?\\n        }`, 'm'));
        assert.ok(match, `${name} exists`);
        vm.runInContext(match[0], context);
    }
    return { context, original, exercises, elements, saves, modals, focus };
}

test('viewer add action opens the library picker in an isolated draft of the same log', () => {
    const h = harness();
    h.context.loadWorkoutForEditing('original-id', true);
    assert.equal(h.elements.get('editAddExercisePanel').open, true);
    assert.equal(h.focus.at(-1), 'editExerciseSearch');
    assert.deepEqual(h.modals, ['close:exerciseModal', 'open:editModal']);
    const html = h.elements.get('editExerciseOptions').innerHTML;
    assert.ok(html.includes('Lat pulldown'));
    assert.ok(html.includes('Cable &lt;curl&gt;'));
    assert.ok(!html.includes('Bench press'));
    h.context.addExerciseToEdit('ex002');
    assert.equal(h.context.editingLogData.id, h.original.id);
    assert.equal(h.context.editingLogData.date, h.original.date);
    assert.equal(h.context.editingLogData.exercises.length, 2);
    assert.equal(h.original.exercises.length, 1);
    assert.equal(h.elements.get('editAddExercisePanel').open, false);
    assert.equal(h.focus.at(-1), '[data-ex-idx="1"][data-type="reps"]');
    const rendered = h.elements.get('editExerciseList').innerHTML;
    assert.ok(rendered.includes('LAT PULLDOWN'));
    assert.ok(rendered.includes('data-mode="edit" data-ex-idx="1" data-set-idx="0"'));
    assert.ok(h.elements.get('editExercisePickerStatus').textContent.includes('Lat pulldown added'));
});

test('picker searches names, muscles and categories and rejects duplicates and invalid IDs', () => {
    const h = harness();
    h.context.loadWorkoutForEditing('original-id');
    for (const query of [' LAT ', 'back', 'pull']) {
        h.elements.get('editExerciseSearch').value = query;
        h.context.renderEditExercisePicker();
        assert.ok(h.elements.get('editExerciseOptions').innerHTML.includes('Lat pulldown'));
    }
    h.elements.get('editExerciseSearch').value = 'no match';
    h.context.renderEditExercisePicker();
    assert.ok(h.elements.get('editExerciseOptions').innerHTML.includes('No matching exercises'));
    h.context.addExerciseToEdit('ex002');
    h.context.addExerciseToEdit('ex002');
    h.context.addExerciseToEdit('missing');
    assert.equal(h.context.editingLogData.exercises.length, 2);
    assert.ok(!h.elements.get('editExerciseOptions').innerHTML.includes('Lat pulldown'));
    h.context.removeExerciseFromEdit(1);
    assert.ok(h.elements.get('editExerciseOptions').innerHTML.includes('Lat pulldown'));
});

test('discard removes newly added exercises without changing saved history or the library', () => {
    const h = harness();
    const libraryBefore = clone(h.exercises);
    h.context.loadWorkoutForEditing('original-id', true);
    h.context.addExerciseToEdit('ex003');
    h.context.updateEditExerciseData(1, 0, 'reps', '12');
    h.context.closeEditModal();
    assert.equal(h.context.editingLogData, null);
    assert.equal(h.original.exercises.length, 1);
    assert.deepEqual(h.exercises, libraryBefore);
    assert.equal(h.saves.length, 0);
    assert.equal(h.elements.get('editExerciseOptions').innerHTML, '');
    h.context.loadWorkoutForEditing('original-id');
    assert.equal(h.context.editingLogData.exercises.length, 1);
    assert.equal(h.elements.get('editAddExercisePanel').open, false);
});

test('save persists added exercises and sets to the original log with its date and conflict version', async () => {
    const h = harness();
    h.context.loadWorkoutForEditing('original-id', true);
    h.context.addExerciseToEdit('ex002');
    h.context.updateEditExerciseData(1, 0, 'reps', '10');
    h.context.updateEditExerciseData(1, 0, 'weight', '130');
    h.context.addEditSet(1);
    h.context.updateEditExerciseData(1, 1, 'reps', '8');
    await h.context.saveEditedWorkout();
    assert.equal(h.saves.length, 1);
    const { log, options } = h.saves[0];
    assert.equal(options.requireExisting, true);
    assert.equal(log.id, h.original.id);
    assert.equal(log.date, h.original.date);
    assert.equal(log.revision, 4);
    assert.deepEqual(log.exercises[0], h.original.exercises[0]);
    assert.equal(log.exercises[1].id, 'ex002');
    assert.equal(log.exercises[1].name, 'Lat pulldown');
    assert.equal(log.exercises[1].sets.length, 2);
    assert.ok(Math.abs(log.exercises[1].sets[0].weight - 130 * 0.45359237) < 0.000001);
    assert.equal(log.exercises[1].sets[1].reps, 8);
    assert.equal(h.context.workoutLogs[0].exercises.length, 2);
    assert.equal(h.context.editingLogData, null);
});

test('blank new exercises go through the existing empty-set confirmation before any save', async () => {
    const h = harness();
    h.context.loadWorkoutForEditing('original-id', true);
    h.context.addExerciseToEdit('ex002');
    await h.context.saveEditedWorkout();
    assert.equal(h.saves.length, 0);
    assert.equal(h.context.pendingWorkoutData.isEdit, true);
    assert.equal(h.context.pendingWorkoutData.exercises.length, 1);
    assert.ok(h.modals.includes('open:zeroRepsModal'));
    assert.equal(h.original.exercises.length, 1);
    assert.equal(h.context.editingLogData.exercises.length, 2);
});
