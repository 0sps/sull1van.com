const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const clone = value => JSON.parse(JSON.stringify(value));
const source = fs.readFileSync(path.join(__dirname, '../data.html'), 'utf8');

function harness(options = {}) {
    const timers = new Map(), saves = [], deletes = [], messages = [], elements = new Map();
    let timerId = 0;
    const logs = ['A', 'B'].map(id => ({ id, date: '2026-10-06T12:00:00Z', revision: 4, exercises: [{ sets: [{ reps: 8 }] }] }));
    const context = vm.createContext({
        window: {}, console: { error() {} }, activeLogId: 'A', currentLogs: clone(logs), selectedLogIds: new Set(['A']),
        document: { getElementById(id) {
            if (!elements.has(id)) elements.set(id, { style: {}, textContent: '', value: '', offsetWidth: 100 });
            return elements.get(id);
        } },
        setTimeout: callback => { timers.set(++timerId, callback); return timerId; },
        clearTimeout: id => timers.delete(id),
        showToast: (message, type) => messages.push({ message, type }), showLoading() {}, hideSaveModal() {}, renderLogList() {},
        selectLog: id => { context.activeLogId = id; context.document.getElementById('jsonEditor').value = `selected ${id}`; },
        getWorkoutDocRef: id => id,
        executeSave: async (data, id, version) => {
            saves.push({ data: clone(data), id, version: clone(version) });
            if (options.pause) await options.pause;
            context.showToast(options.saveFailure ? 'Save failed' : 'Log saved successfully', options.saveFailure ? 'error' : undefined);
        },
        deleteDoc: async id => {
            deletes.push(id);
            if (options.pause) await options.pause;
            if (options.deleteFailure) throw new Error('Firebase deletion failed');
        }
    });
    const start = source.indexOf('        let pendingAction = null;');
    const end = source.indexOf('        window.deleteCurrentLog =', start);
    assert.ok(start >= 0 && end > start);
    vm.runInContext(source.slice(start, end), context);
    function trigger(type, id) {
        context.activeLogId = id;
        context.window._pendingSaveData = clone(logs.find(log => log.id === id));
        context.window._pendingOriginalId = id;
        context.window._pendingBaseVersion = { revision: 4, updatedAt: 'original-version' };
        context.window[type === 'save' ? 'triggerSaveWithUndo' : 'triggerDeleteWithUndo']();
    }
    async function tick() {
        const [id, callback] = timers.entries().next().value;
        timers.delete(id);
        await callback();
    }
    return { context, elements, saves, deletes, messages, timers, trigger, tick, logs };
}

for (const [first, second] of [['save', 'save'], ['delete', 'delete'], ['save', 'delete'], ['delete', 'save']]) {
    test(`${first} A followed by ${second} B keeps A isolated and allows B after completion`, async () => {
        const h = harness();
        h.trigger(first, 'A');
        h.trigger(second, 'B');
        assert.equal(h.timers.size, 1);
        assert.ok(h.messages.some(item => item.message.includes('pending action')));
        await h.tick();
        assert.deepEqual(h.saves.map(save => save.id), first === 'save' ? ['A'] : []);
        assert.deepEqual(h.deletes, first === 'delete' ? ['A'] : []);
        assert.ok(h.context.currentLogs.some(log => log.id === 'B'));
        h.trigger(second, 'B');
        await h.tick();
        if (second === 'save') assert.equal(h.saves.at(-1).id, 'B');
        else assert.equal(h.deletes.at(-1), 'B');
    });
}

test('queued save owns an immutable copy of its data, ID, and conflict version', async () => {
    const h = harness();
    h.trigger('save', 'A');
    h.context.window._pendingSaveData.exercises[0].sets[0].reps = 12;
    h.context.window._pendingOriginalId = 'B';
    h.context.window._pendingBaseVersion.revision = 99;
    await h.tick();
    assert.equal(h.saves[0].id, 'A');
    assert.equal(h.saves[0].data.exercises[0].sets[0].reps, 8);
    assert.equal(h.saves[0].version.revision, 4);
});

for (const type of ['save', 'delete']) {
    test(`undo ${type} cancels Firebase work and preserves another workout's draft`, async () => {
        const h = harness();
        h.trigger(type, 'A');
        h.context.activeLogId = 'B';
        h.context.currentLogs.find(log => log.id === 'B').revision = 99;
        h.context.document.getElementById('jsonEditor').value = 'unsaved B draft';
        h.context.window.handleUndoClick();
        assert.equal(h.timers.size, 0);
        assert.equal(h.saves.length + h.deletes.length, 0);
        assert.equal(h.context.activeLogId, 'B');
        assert.equal(h.elements.get('jsonEditor').value, 'unsaved B draft');
        assert.equal(h.context.currentLogs.find(log => log.id === 'B').revision, 99);
        assert.ok(h.context.currentLogs.some(log => log.id === 'A'));
        h.trigger('save', 'B');
        await h.tick();
        assert.equal(h.saves[0].id, 'B');
    });
}

test('failed deletion restores only its own log and keeps newer local changes', async () => {
    const h = harness({ deleteFailure: true });
    h.trigger('delete', 'A');
    h.context.currentLogs.find(log => log.id === 'B').revision = 99;
    h.context.activeLogId = 'B';
    h.context.document.getElementById('jsonEditor').value = 'unsaved B draft';
    await h.tick();
    assert.equal(h.context.currentLogs.find(log => log.id === 'B').revision, 99);
    assert.equal(h.context.currentLogs.filter(log => log.id === 'A').length, 1);
    assert.equal(h.context.activeLogId, 'B');
    assert.equal(h.elements.get('jsonEditor').value, 'unsaved B draft');
    assert.ok(h.messages.some(item => item.message === 'Deletion failed' && item.type === 'error'));
});

test('successful deletion clears a target reloaded during the undo countdown', async () => {
    const h = harness();
    h.trigger('delete', 'A');
    h.context.currentLogs.push(clone(h.logs[0]));
    h.context.activeLogId = 'A';
    await h.tick();
    assert.ok(!h.context.currentLogs.some(log => log.id === 'A'));
    assert.equal(h.context.activeLogId, null);
    assert.equal(h.context.selectedLogIds.has('A'), false);
});

test('undo and new actions stay blocked while Firebase is committing; success appears after confirmation', async () => {
    let release;
    const h = harness({ pause: new Promise(resolve => { release = resolve; }) });
    h.trigger('save', 'A');
    assert.equal(h.elements.get('undoTitle').textContent, 'SAVE QUEUED');
    assert.equal(h.messages.length, 0);
    const committing = h.tick();
    h.context.window.handleUndoClick();
    h.trigger('delete', 'B');
    assert.equal(h.timers.size, 0);
    assert.equal(h.deletes.length, 0);
    assert.ok(!h.messages.some(item => item.message === 'Log saved successfully'));
    release();
    await committing;
    assert.ok(h.messages.some(item => item.message === 'Log saved successfully'));
    h.trigger('delete', 'B');
    await h.tick();
    assert.deepEqual(h.deletes, ['B']);
});

test('a failed queued save never reports success and releases the next action', async () => {
    const h = harness({ saveFailure: true });
    h.trigger('save', 'A');
    await h.tick();
    assert.ok(h.messages.some(item => item.message === 'Save failed'));
    assert.ok(!h.messages.some(item => item.message === 'Log saved successfully'));
    h.trigger('delete', 'B');
    await h.tick();
    assert.deepEqual(h.deletes, ['B']);
});
