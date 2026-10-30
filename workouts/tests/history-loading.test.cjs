const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'app.html'), 'utf8');
function section(start, end) {
    const first = source.indexOf(start);
    const last = source.indexOf(end, first + start.length);
    assert.ok(first >= 0 && last > first, `Missing source section ${start}`);
    return source.slice(first, last);
}

function harness({ logs = [], failRead = null } = {}) {
    const overlay = { style: { display: 'flex' }, innerHTML: '' };
    const calls = { reads: 0, rendered: 0, handlers: 0 };
    const options = { logs, failRead };
    const c = vm.createContext({
        console: { error() {}, warn() {}, log() {} }, Date, Math,
        CONFIG: { FIREBASE_INIT_LIMIT: 60 },
        workoutLogs: [], recordHistoryLogs: [], recordHistoryReady: false,
        oldestLoadedWorkoutSnapshot: null,
        activeSeason: { startDate: '2026-09-01' }, activeSeasonStatus: 'loaded',
        document: { getElementById: () => overlay },
        window: {
            firebaseReady: true, currentUser: { email: 'sspsful@gmail.com' },
            getWorkoutCollectionRef: () => ({}),
            firebaseQuery: (...args) => args, firebaseWhere() {}, firebaseOrderBy() {},
            firebaseLimit() {}, firebaseStartAfter() {},
            firebaseGetDocs: async () => {
                calls.reads++;
                if (options.failRead === calls.reads) throw Object.assign(new Error('unavailable'), { code: 'unavailable' });
                const docs = (calls.reads === 1 ? options.logs : []).map(data => ({ id: data.id, data: () => data }));
                return { docs, forEach: callback => docs.forEach(callback) };
            }
        },
        loadExerciseData: async () => true, loadTrainingPlan: async () => true,
        loadProgressionPlan: async () => true, loadActiveSeason: async () => true,
        updateSyncStatus() {}, invalidateStatsCache() {}, showNotification() {},
        updateCurrentDate() {}, setTodaysWorkout() {}, loadWorkoutProgress() {},
        renderExercises() { calls.rendered++; }, renderRecentLogs() {}, renderPlanView() {},
        renderLibrary() {}, updateStats() {}, setupTabs() {},
        setupEventHandlers() { calls.handlers++; }, openSeasonModal() {}
    });
    vm.runInContext([
        section('        async function withFirebaseErrorHandling(', '        // Guards against rapid'),
        section('        async function init()', '        function updateCurrentDate()')
    ].join('\n'), c);
    return { c, calls, overlay, options };
}

test('failed initial history read leaves PR history unavailable and blocks coach UI initialization', async () => {
    const h = harness({ failRead: 1 });
    await h.c.init();
    assert.equal(h.c.recordHistoryReady, false);
    assert.equal(h.calls.reads, 1);
    assert.equal(h.calls.rendered, 0);
    assert.equal(h.calls.handlers, 0);
    assert.equal(h.overlay.style.display, 'flex');
    assert.match(h.overlay.innerHTML, /retry|refresh/i);
});

test('successful genuinely empty history enables the workout UI', async () => {
    const h = harness();
    await h.c.init();
    assert.equal(h.c.recordHistoryReady, true);
    assert.equal(h.c.recordHistoryLogs.length, 0);
    assert.equal(h.calls.reads, 1);
    assert.equal(h.calls.rendered, 1);
    assert.equal(h.calls.handlers, 1);
    assert.equal(h.overlay.style.display, 'none');
});

test('successful recent read retains season logs and excludes pre-season workouts', async () => {
    const logs = [
        { id: 'season', date: '2026-10-01T12:00:00.000Z', exercises: [] },
        { id: 'old', date: '2026-01-01T12:00:00.000Z', exercises: [] }
    ];
    const h = harness({ logs });
    await h.c.init();
    assert.equal(h.c.recordHistoryReady, true);
    assert.deepEqual(Array.from(h.c.recordHistoryLogs, log => log.id), ['season']);
    assert.equal(h.calls.rendered, 1);
});

test('failed continuation query blocks coach UI rather than evaluating incomplete season history', async () => {
    const logs = Array.from({ length: 60 }, (_, i) => ({ id: `w${i}`, date: '2026-10-01T12:00:00.000Z', exercises: [] }));
    const h = harness({ logs, failRead: 2 });
    await h.c.init();
    assert.equal(h.calls.reads, 2);
    assert.equal(h.c.recordHistoryReady, false);
    assert.equal(h.c.recordHistoryLogs.length, 0);
    assert.equal(h.calls.rendered, 0);
    assert.equal(h.calls.handlers, 0);
    assert.equal(h.overlay.style.display, 'flex');
    assert.match(h.overlay.innerHTML, /retry|refresh/i);
});

test('retry after failed initial fetch initializes only after history succeeds', async () => {
    const h = harness({ failRead: 1 });
    await h.c.init();
    assert.equal(h.calls.handlers, 0);
    h.options.failRead = null;
    await h.c.init();
    assert.equal(h.c.recordHistoryReady, true);
    assert.equal(h.calls.reads, 2);
    assert.equal(h.calls.rendered, 1);
    assert.equal(h.calls.handlers, 1);
    assert.equal(h.overlay.style.display, 'none');
});
