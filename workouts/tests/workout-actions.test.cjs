const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../app.html'), 'utf8');
const clone = value => JSON.parse(JSON.stringify(value));
function section(start, end) {
    const a = source.indexOf(start), b = source.indexOf(end, a);
    assert.ok(a >= 0 && b > a);
    return source.slice(a, b);
}
function deletionHarness({ pause, failure = false } = {}) {
    const elements = new Map(), writes = [], notices = [];
    const context = vm.createContext({
        console: { error() {} }, selectedSetForDeletion: null,
        CONFIG: { SET_DELETION_LOG_SLICE: 10, MAX_RECENT_SETS: 50 },
        workoutLogs: [{ id: 'log', date: '2026-10-01T12:00:00Z', exercises: [{ id: 'ex001', sets: [1, 2, 3].map(reps => ({ reps, weight: 10 })) }] }],
        getSeasonWorkoutLogs: () => context.workoutLogs,
        findSeasonLog: id => context.workoutLogs.find(log => log.id === id),
        getExercise: () => ({ name: 'Bench' }),
        document: { getElementById(id) {
            if (!elements.has(id)) elements.set(id, { innerHTML: '', style: {} });
            return elements.get(id);
        } },
        compareLogIds: (a, b) => String(a) === String(b), formatDate: date => date.toISOString(),
        DateFormats: { SHORT: {} }, displayWeight: x => x, escapeHtml: String,
        emptyStateHtml: () => 'No sets found', openModal() {}, closeModal() {},
        saveToFirebase: async log => { writes.push(clone(log)); if (pause) await pause; return !failure; },
        deleteFromFirebase: async () => true, upsertRecordHistoryLog() {}, removeRecordHistoryLog() {},
        invalidateStatsCache() {}, renderRecentLogs() {}, updateStats() {}, renderFullHistory() {},
        showNotification: (...args) => notices.push(args)
    });
    vm.runInContext(section('        function flattenRecentSets()', '        function viewLogDetail('), context);
    context.renderDeleteSetList();
    return { context, elements, writes, notices };
}

test('successive deletions in one modal use the newly rendered row indices', async () => {
    const h = deletionHarness();
    h.context.selectSetForDeletion(0);
    await h.context.executeDeleteSet(0);
    assert.deepEqual(clone(h.context.flattenRecentSets()).map(set => set.reps), [2, 1]);
    assert.match(h.elements.get('deleteSetList').innerHTML, /selectSetForDeletion\(0\)/);
    assert.doesNotMatch(h.elements.get('deleteSetList').innerHTML, /selectSetForDeletion\(2\)/);
    h.context.selectSetForDeletion(0);
    assert.equal(h.context.selectedSetForDeletion.reps, 2);
    await h.context.executeDeleteSet(0);
    assert.deepEqual(clone(h.context.workoutLogs[0].exercises[0].sets).map(set => set.reps), [1]);
});

test('repeated deletion clicks cannot commit twice while a deletion is pending', async () => {
    let release;
    const h = deletionHarness({ pause: new Promise(resolve => { release = resolve; }) });
    h.context.selectSetForDeletion(0);
    const first = h.context.executeDeleteSet(0);
    h.context.selectSetForDeletion(1);
    await h.context.executeDeleteSet(0);
    assert.equal(h.writes.length, 1);
    assert.equal(h.context.selectedSetForDeletion.reps, 3);
    release();
    await first;
    assert.deepEqual(clone(h.context.workoutLogs[0].exercises[0].sets).map(set => set.reps), [1, 2]);
});

test('failed deletion preserves the row and releases the pending guard for retry', async () => {
    const h = deletionHarness({ failure: true });
    h.context.selectSetForDeletion(0);
    await h.context.executeDeleteSet(0);
    assert.equal(h.context.selectedSetForDeletion.reps, 3);
    assert.equal(h.context.workoutLogs[0].exercises[0].sets.length, 3);
    await h.context.executeDeleteSet(0);
    assert.equal(h.writes.length, 2);
    assert.equal(h.notices.length, 2);
});

test('exercise history resolves exact IDs even when another exercise name contains the requested name', () => {
    const elements = new Map();
    const context = vm.createContext({
        getExerciseForUI: () => ({ id: 'ex013', name: 'Leg Press' }),
        getSeasonWorkoutLogs: () => [
            { date: '2026-10-02T12:00:00Z', exercises: [{ id: 'ex365', name: 'Leg Press Calf Raise', sets: [{ weight: 300, reps: 10 }] }] },
            { date: '2026-10-01T12:00:00Z', exercises: [{ id: 'ex013', name: 'Renamed exercise', sets: [{ weight: 200, reps: 8 }] }] }
        ],
        document: { getElementById(id) { if (!elements.has(id)) elements.set(id, {}); return elements.get(id); } },
        formatDateFull: date => date.toISOString(), displayWeight: x => x, escapeHtml: String,
        formatLiftVolumeLbs: String, emptyStateHtml: () => '', openModal() {}
    });
    vm.runInContext(section('        function showExerciseHistory(', '        function updateStats()'), context);
    context.showExerciseHistory('ex013');
    assert.equal(elements.get('historyModalTitle').textContent, 'LEG PRESS HISTORY');
    assert.match(elements.get('historyModalContent').innerHTML, /<strong>200 lbs<\/strong>/);
    assert.doesNotMatch(elements.get('historyModalContent').innerHTML, /300 lbs/);
});

test('History buttons carry catalog IDs for delegated clicks', () => {
    const context = vm.createContext({ escapeAttr: String, escapeHtml: String, formatLiftVolumeLbs: String });
    vm.runInContext(section('        function generateExerciseHTML(', '        /**\n         * Generates HTML for a log entry'), context);
    const html = context.generateExerciseHTML({ id: 'ex013', name: 'Leg Press' }, 'day_ex013', '');
    assert.match(html, /class="btn-history" data-exercise-id="ex013"/);
    assert.match(source, /const exerciseId = historyBtn.dataset.exerciseId;\s+if \(exerciseId\) showExerciseHistory\(exerciseId\);/);
});
