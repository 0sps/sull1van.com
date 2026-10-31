const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const WorkoutDate = require('../js/workout-date.js');
const clone = value => JSON.parse(JSON.stringify(value));
const original = {
    id: 'existing-workout', date: '2026-10-06T19:05:09.678Z',
    workoutName: 'PULL', workoutDay: 2, weightUnit: 'kg', seasonId: 'season-1',
    exercises: [{ id: 'lift', sets: [{ reps: 8, weight: 50, isWarmup: false }] }],
    revision: 4, updatedAt: '2026-10-06T19:10:00.000Z'
};
const docPath = id => `users/sspsful@gmail.com/workouts/${id}`;
const source = page => fs.readFileSync(path.resolve(__dirname, '..', page), 'utf8');
function section(text, start, end) {
    const startIndex = text.indexOf(start);
    const endIndex = text.indexOf(end, startIndex + start.length);
    assert.ok(startIndex >= 0 && endIndex > startIndex, `Missing code section: ${start}`);
    return text.slice(startIndex, endIndex);
}

// Stage all writes and commit only after the callback and simulated server succeed.
// Retry can replace the remote snapshot before the callback is run again.
function firebaseMock(remote, options = {}) {
    const store = new Map(remote ? [[docPath(remote.id), clone(remote)]] : []);
    const calls = { reads: [], writes: [], commits: 0 };
    const runTransaction = async (db, callback) => {
        for (let attempt = 0; ; attempt++) {
            const staged = [];
            let hasWritten = false;
            const result = await callback({
                get: async ref => {
                    assert.equal(hasWritten, false, 'Firestore requires reads before writes');
                    calls.reads.push(ref);
                    const data = store.has(ref) ? clone(store.get(ref)) : null;
                    return { exists: () => data !== null, data: () => clone(data) };
                },
                set: (ref, data) => {
                    hasWritten = true;
                    staged.push({ type: 'set', ref, data: clone(data) });
                },
                delete: ref => {
                    hasWritten = true;
                    staged.push({ type: 'delete', ref });
                }
            });
            if (attempt === 0 && options.retryRemote) {
                store.set(docPath(options.retryRemote.id), clone(options.retryRemote));
                continue;
            }
            if (options.beforeCommit) await options.beforeCommit();
            if (options.failure) throw Object.assign(new Error(options.failure), { code: options.failure });
            for (const write of staged) {
                if (write.type === 'set') store.set(write.ref, write.data);
                else store.delete(write.ref);
            }
            calls.writes.push(...staged);
            calls.commits++;
            return result;
        }
    };
    return { store, calls, runTransaction };
}

function editorHarness(editor, remote = original, options = {}) {
    const firebase = firebaseMock(remote, options);
    const notifications = [];
    const successCallbacks = [];
    const elements = new Map();
    const inputValue = '2026-10-04T14:05:09';
    const edited = clone(options.loaded || original);
    const context = vm.createContext({
        console: { error() {} }, WorkoutDate,
        document: { getElementById(id) {
            if (!elements.has(id)) elements.set(id, { value: '', textContent: '', disabled: false, style: { display: 'none' }, reportValidity: () => true });
            return elements.get(id);
        } },
        window: {
            currentUser: options.signedOut ? null : { email: 'sspsful@gmail.com' },
            firebaseDb: {}, firebaseRunTransaction: firebase.runTransaction,
            getWorkoutDocRef: docPath
        },
        updateSyncStatus: status => notifications.push(status),
        showNotification: (title, message) => notifications.push({ title, message }),
        showToast: (message, type) => notifications.push({ message, type }),
        showLoading() {}, invalidateStatsCache() {}, renderRecentLogs() {}, updateStats() {},
        renderFullHistory() {}, refreshUI() {}, renderLogList() {}, selectLog() {},
        showButtonSuccess: (button, message, duration, afterRestore) => {
            notifications.push({ message });
            if (afterRestore) successCallbacks.push(afterRestore);
        }, closeEditModal() {},
        compareLogIds: (a, b) => String(a) === String(b),
        validateAndCleanWorkout: exercises => ({ cleanedExercises: exercises, hasZeroReps: false }),
        editingLogData: edited, isSaving: false,
        workoutLogs: [clone(edited)], recordHistoryLogs: [clone(edited)],
        activeSeason: { startDate: '2026-09-01' },
        currentLogs: [clone(edited)], selectedLogIds: new Set(), activeLogId: edited.id,
        db: {}, runTransaction: firebase.runTransaction, getWorkoutDocRef: docPath,
        runValidation: () => ({ error: null }),
        showSaveModal() {}, showValidationModal() {}, confirm: () => true
    });
    context.document.getElementById('editWorkoutDate').value = inputValue;
    context.document.getElementById('editorWorkoutDate').value = inputValue;
    const json = context.document.getElementById('jsonEditor');
    json.value = JSON.stringify(edited);
    json.dataset = {
        originalId: edited.id,
        originalRevision: Number.isInteger(edited.revision) ? String(edited.revision) : '',
        originalUpdatedAt: edited.updatedAt || ''
    };
    if (editor === 'main') {
        const html = source('app.html');
        vm.runInContext([
            section(html, '        async function withFirebaseErrorHandling(', '        async function loadFromFirebase('),
            section(html, '        class StaleWriteError', '        async function saveWorkoutLog('),
            section(html, '        function upsertRecordHistoryLog(', '        function removeRecordHistoryLog('),
            section(html, '        async function saveEditedWorkout(', '        function closeEditModal(')
        ].join('\n'), context);
    } else {
        const html = source('data.html');
        vm.runInContext([
            section(html, '        window.updateWorkoutDate =', "        document.getElementById('jsonEditor').addEventListener('input'"),
            section(html, '        window.saveCurrentLog =', '        function showSaveModal('),
            section(html, '        class WorkoutEditorConflictError', '        let pendingAction = null;')
        ].join('\n'), context);
    }
    return { ...firebase, context, notifications, successCallbacks, elements, inputValue, async save() {
        if (editor === 'main') return context.saveEditedWorkout();
        await context.window.saveCurrentLog();
        if (context.window._pendingSaveData) {
            await context.executeSave(context.window._pendingSaveData, context.window._pendingOriginalId, context.window._pendingBaseVersion);
        }
    } };
}

for (const editor of ['main', 'data']) {
    test(`${editor}: date edit commits to the existing Firebase document and updates local state`, async () => {
        const harness = editorHarness(editor);
        await harness.save();
        assert.equal(harness.store.size, 1);
        assert.equal(harness.calls.commits, 1);
        const saved = harness.store.get(docPath(original.id));
        assert.equal(WorkoutDate.toInputValue(saved.date), harness.inputValue);
        assert.equal(new Date(saved.date).getMilliseconds(), 678);
        assert.equal(saved.id, original.id);
        assert.equal(saved.revision, 5);
        assert.ok(saved.updatedAt > original.updatedAt);
        assert.deepEqual(saved.exercises, original.exercises);
        assert.equal(saved.seasonId, original.seasonId);
        assert.equal(saved.workoutDay, original.workoutDay);
        const local = editor === 'main' ? harness.context.workoutLogs : harness.context.currentLogs;
        assert.deepEqual(clone(local[0]), saved);
    });

    test(`${editor}: successful legacy edit adds revision without losing lifts`, async () => {
        const legacy = clone(original);
        delete legacy.revision;
        delete legacy.updatedAt;
        const harness = editorHarness(editor, legacy, { loaded: legacy });
        await harness.save();
        const saved = harness.store.get(docPath(original.id));
        assert.equal(saved.revision, 1);
        assert.equal(WorkoutDate.toInputValue(saved.date), harness.inputValue);
        assert.deepEqual(saved.exercises, original.exercises);
    });

    test(`${editor}: Firebase retry commits the edit once when the loaded revision still matches`, async () => {
        const harness = editorHarness(editor, original, { retryRemote: clone(original) });
        await harness.save();
        assert.equal(harness.calls.reads.length, 2);
        assert.equal(harness.calls.commits, 1);
        assert.equal(harness.calls.writes.length, 1);
        const saved = harness.store.get(docPath(original.id));
        assert.equal(saved.revision, 5);
        assert.equal(WorkoutDate.toInputValue(saved.date), harness.inputValue);
    });

    test(`${editor}: failed commit can be retried successfully after the connection recovers`, async () => {
        const options = { failure: 'unavailable' };
        const harness = editorHarness(editor, original, options);
        await harness.save();
        assert.equal(harness.calls.commits, 0);
        delete options.failure;
        await harness.save();
        assert.equal(harness.calls.commits, 1);
        assert.equal(harness.store.get(docPath(original.id)).revision, 5);
        assert.equal(WorkoutDate.toInputValue(harness.store.get(docPath(original.id)).date), harness.inputValue);
    });

    for (const scenario of ['stale revision', 'stale legacy timestamp', 'deleted versioned document', 'deleted legacy document', 'concurrent update during retry', 'permission-denied', 'unavailable']) {
        test(`${editor}: ${scenario} preserves server and local data`, async () => {
            let remote = clone(original);
            const options = {};
            if (scenario === 'stale revision') remote.revision++;
            if (scenario === 'stale legacy timestamp') {
                delete remote.revision;
                options.loaded = clone(remote);
                remote.updatedAt = '2026-10-06T20:00:00.000Z';
            }
            if (scenario.startsWith('deleted')) remote = null;
            if (scenario === 'deleted legacy document') {
                options.loaded = clone(original);
                delete options.loaded.revision;
                delete options.loaded.updatedAt;
            }
            if (scenario === 'concurrent update during retry') options.retryRemote = { ...clone(original), revision: 5, date: '2026-10-05T12:00:00.000Z' };
            if (['permission-denied', 'unavailable'].includes(scenario)) options.failure = scenario;
            const harness = editorHarness(editor, remote, options);
            await harness.save();
            assert.equal(harness.calls.commits, 0);
            assert.equal(harness.calls.writes.length, 0);
            const expectedRemote = options.retryRemote || remote;
            assert.deepEqual(harness.store.get(docPath(original.id)), expectedRemote || undefined);
            const local = editor === 'main' ? harness.context.workoutLogs : harness.context.currentLogs;
            assert.deepEqual(clone(local[0]), options.loaded || original);
            assert.ok(harness.notifications.some(item => item === 'error' || item.type === 'error'));
            if (editor === 'main') {
                assert.equal(harness.context.isSaving, false);
                assert.equal(harness.elements.get('saveEditsBtn').disabled, false);
                assert.equal(harness.context.editingLogData.revision, (options.loaded || original).revision);
            }
        });
    }
}

test('main: signed-out editor does not attempt a Firebase transaction', async () => {
    const harness = editorHarness('main', original, { signedOut: true });
    await harness.save();
    assert.equal(harness.calls.reads.length, 0);
    assert.equal(harness.calls.commits, 0);
    assert.deepEqual(harness.store.get(docPath(original.id)), original);
});

test('main: repeated save during an in-flight edit leaves the pending data alone', async () => {
    const harness = editorHarness('main');
    harness.context.isSaving = true;
    await harness.save();
    assert.equal(harness.calls.reads.length, 0);
    assert.deepEqual(harness.context.editingLogData, original);
});

test('data: changing the date control preserves raw JSON edits and original conflict version', async () => {
    const harness = editorHarness('data');
    const json = harness.elements.get('jsonEditor');
    const changed = JSON.parse(json.value);
    changed.exercises[0].sets[0].reps = 10;
    json.value = JSON.stringify(changed);
    harness.context.window.updateWorkoutDate();
    assert.equal(JSON.parse(json.value).exercises[0].sets[0].reps, 10);
    await harness.save();
    const saved = harness.store.get(docPath(original.id));
    assert.equal(saved.exercises[0].sets[0].reps, 10);
    assert.equal(saved.revision, 5);
    assert.equal(WorkoutDate.toInputValue(saved.date), harness.inputValue);
});

function deferred() {
    let resolve;
    const promise = new Promise(done => { resolve = done; });
    return { promise, resolve };
}

for (const action of ['discard', 'open another workout', 'change working reps', 'change date']) {
    test(`main: ${action} during saving preserves the committed snapshot and the current draft`, async () => {
        const entered = deferred(), release = deferred();
        const h = editorHarness('main', original, { beforeCommit: async () => { entered.resolve(); await release.promise; } });
        const saving = h.save();
        await entered.promise;
        const draft = h.context.editingLogData;
        if (action === 'discard') h.context.editingLogData = null;
        if (action === 'open another workout') h.context.editingLogData = { id: 'another', exercises: [] };
        if (action === 'change working reps') draft.exercises[0].sets[0].reps = 12;
        if (action === 'change date') h.elements.get('editWorkoutDate').value = '2026-10-03T14:05:09';
        release.resolve();
        await saving;
        const saved = h.store.get(docPath(original.id));
        assert.equal(saved.exercises[0].sets[0].reps, 8);
        assert.equal(WorkoutDate.toInputValue(saved.date), h.inputValue);
        assert.deepEqual(clone(h.context.workoutLogs[0]), saved);
        assert.ok(!h.notifications.some(item => item.title === 'ERROR'));
        assert.equal(h.successCallbacks.length, 0);
        if (action === 'discard') assert.equal(h.context.editingLogData, null);
        if (action === 'open another workout') assert.equal(h.context.editingLogData.id, 'another');
        if (action === 'change working reps') {
            assert.equal(draft.exercises[0].sets[0].reps, 12);
            assert.equal(draft.revision, 5);
        }
        if (action === 'change date') assert.equal(h.elements.get('editWorkoutDate').value, '2026-10-03T14:05:09');
    });
}

test('main: saved-button callback cannot close a new or newly edited draft', async () => {
    for (const action of ['new session', 'changed reps', 'changed date', 'unchanged']) {
        const h = editorHarness('main');
        let closed = false;
        h.context.closeEditModal = () => { closed = true; };
        await h.save();
        assert.equal(h.successCallbacks.length, 1);
        if (action === 'new session') h.context.editingLogData = { id: 'another' };
        if (action === 'changed reps') h.context.editingLogData.exercises[0].sets[0].reps = 12;
        if (action === 'changed date') h.elements.get('editWorkoutDate').value = '2026-10-03T14:05:09';
        h.successCallbacks[0]();
        assert.equal(closed, action === 'unchanged');
    }
});

test('data: a completed save preserves the selection and unsaved editor contents of another workout', async () => {
    const entered = deferred(), release = deferred();
    const h = editorHarness('data', original, { beforeCommit: async () => { entered.resolve(); await release.promise; } });
    const saving = h.save();
    await entered.promise;
    h.context.activeLogId = 'another';
    h.elements.get('jsonEditor').value = 'unsaved draft of another workout';
    h.context.selectLog = () => { throw new Error('Save completion must keep the current selection'); };
    release.resolve();
    await saving;
    assert.equal(h.context.activeLogId, 'another');
    assert.equal(h.elements.get('jsonEditor').value, 'unsaved draft of another workout');
    assert.equal(h.store.get(docPath(original.id)).revision, 5);
    assert.ok(h.notifications.some(item => item.message === 'Log saved successfully'));
});

for (const editor of ['main', 'data']) {
    test(`${editor}: future date input cannot save or mutate the loaded workout`, async () => {
        const h = editorHarness(editor);
        const future = new Date(Date.now() + 86400000).toISOString();
        h.elements.get(editor === 'main' ? 'editWorkoutDate' : 'editorWorkoutDate').value = WorkoutDate.toInputValue(future);
        await h.save();
        assert.equal(h.calls.commits, 0);
        assert.equal(h.calls.reads.length, 0);
        assert.deepEqual(h.store.get(docPath(original.id)), original);
    });

    test(`${editor}: save boundary rejects a future date when UI validation is bypassed`, async () => {
        const h = editorHarness(editor);
        const futureLog = { ...clone(original), date: new Date(Date.now() + 86400000).toISOString() };
        if (editor === 'main') assert.equal(await h.context.saveToFirebase(futureLog), false);
        else await h.context.executeSave(futureLog, original.id, { revision: original.revision, updatedAt: original.updatedAt });
        assert.equal(h.calls.commits, 0);
        assert.equal(h.calls.reads.length, 0);
        assert.deepEqual(h.store.get(docPath(original.id)), original);
    });
}

test('data: future date entered through raw JSON is rejected before confirmation', async () => {
    const h = editorHarness('data');
    const futureLog = { ...clone(original), date: new Date(Date.now() + 86400000).toISOString() };
    h.elements.get('jsonEditor').value = JSON.stringify(futureLog);
    h.elements.get('editorWorkoutDate').value = WorkoutDate.toInputValue(futureLog.date);
    await h.context.window.saveCurrentLog();
    assert.equal(h.context.window._pendingSaveData, undefined);
    assert.match(h.elements.get('validationMsg').textContent, /cannot be in the future/);
    assert.equal(h.calls.commits, 0);
});


function setDeletionHarness(loaded, remote = loaded, options = {}) {
    const h = editorHarness('main', remote, { ...options, loaded });
    const c = h.context;
    c.isDeletingSet = false;
    c.selectedSetForDeletion = { workoutId: loaded.id, exerciseIndex: 0, setIndex: 0,
        isEmptyWorkout: loaded.exercises.length === 0 };
    c.findSeasonLog = () => c.workoutLogs[0];
    c.renderDeleteSetList = () => {};
    const html = source('app.html');
    vm.runInContext([
        section(html, '        function removeRecordHistoryLog(', '        function updateSyncStatus('),
        section(html, '        async function executeDeleteSet(', '        function viewLogDetail(')
    ].join('\n'), c);
    return h;
}

for (const legacy of [false, true]) {
    const loaded = clone(original);
    if (legacy) { delete loaded.revision; delete loaded.updatedAt; }
    const label = legacy ? 'legacy' : 'versioned';
    test(`set deletion: ${label} last-set deletion preserves newer remote sets`, async () => {
        const newer = clone(loaded);
        newer.exercises[0].sets.push({ reps: 12, weight: 60 });
        if (legacy) newer.updatedAt = '2026-10-07T12:00:00Z';
        else newer.revision++;
        const h = setDeletionHarness(loaded, newer);
        await h.context.executeDeleteSet(0);
        assert.deepEqual(h.store.get(docPath(loaded.id)), newer);
        assert.deepEqual(clone(h.context.workoutLogs), [loaded]);
        assert.deepEqual(clone(h.context.recordHistoryLogs), [loaded]);
        assert.ok(h.context.selectedSetForDeletion);
        assert.equal(h.calls.commits, 0);
    });
    test(`set deletion: ${label} unchanged last-set deletion succeeds`, async () => {
        const h = setDeletionHarness(loaded);
        await h.context.executeDeleteSet(0);
        assert.equal(h.store.size, 0);
        assert.equal(h.context.workoutLogs.length, 0);
        assert.equal(h.context.recordHistoryLogs.length, 0);
        assert.equal(h.context.selectedSetForDeletion, null);
    });
    test(`set deletion: ${label} deleted workout stays deleted when removing a remaining set`, async () => {
        const twoSets = clone(loaded);
        twoSets.exercises[0].sets.push({ reps: 10, weight: 55 });
        const h = setDeletionHarness(twoSets, null);
        await h.context.executeDeleteSet(0);
        assert.equal(h.store.size, 0);
        assert.deepEqual(clone(h.context.workoutLogs), [twoSets]);
        assert.deepEqual(clone(h.context.recordHistoryLogs), [twoSets]);
        assert.ok(h.context.selectedSetForDeletion);
        assert.equal(h.calls.commits, 0);
    });
    test(`set deletion: ${label} removing one of two sets persists remaining set`, async () => {
        const twoSets = clone(loaded);
        twoSets.exercises[0].sets.push({ reps: 10, weight: 55 });
        const h = setDeletionHarness(twoSets);
        await h.context.executeDeleteSet(0);
        const saved = h.store.get(docPath(loaded.id));
        assert.deepEqual(saved.exercises[0].sets, [twoSets.exercises[0].sets[1]]);
        assert.equal(saved.revision, (loaded.revision || 0) + 1);
        assert.deepEqual(clone(h.context.workoutLogs[0]), saved);
    });
}

test('set deletion: a concurrent change on transaction retry prevents whole-workout deletion', async () => {
    const newer = clone(original);
    newer.revision++;
    newer.exercises[0].sets.push({ reps: 12, weight: 60 });
    const h = setDeletionHarness(original, original, { retryRemote: newer });
    await h.context.executeDeleteSet(0);
    assert.deepEqual(h.store.get(docPath(original.id)), newer);
    assert.equal(h.calls.commits, 0);
    assert.equal(h.calls.writes.length, 0);
});
