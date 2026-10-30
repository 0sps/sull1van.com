const assert = require('node:assert/strict');
const { test } = require('node:test');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const helperPath = path.resolve(__dirname, '../js/workout-date.js');

function inTimezone(timezone, code) {
    execFileSync(process.execPath, ['-e', `
        const assert = require('node:assert/strict');
        const dates = require(${JSON.stringify(helperPath)});
        ${code}
    `], { env: { ...process.env, TZ: timezone } });
}

test('local editing retains hours, minutes, seconds and milliseconds across timezones', () => {
    for (const timezone of ['America/Chicago', 'UTC', 'Asia/Kolkata']) {
        inTimezone(timezone, `
            const original = '2026-10-06T01:23:45.678Z';
            const value = dates.toInputValue(original);
            assert.equal(dates.fromInputValue(value, original), original);
            const changed = value.replace(/T.*/, 'T14:05:09');
            const saved = dates.fromInputValue(changed, original);
            assert.equal(dates.toInputValue(saved), changed);
            assert.equal(new Date(saved).getMilliseconds(), 678);
            assert.equal(new Date(saved).getHours(), 14);
        `);
    }
});

test('Chicago date edits use the offset for the selected date', () => {
    inTimezone('America/Chicago', `
        assert.equal(dates.toInputValue('2026-10-06T01:23:45.678Z'), '2026-10-05T20:23:45');
        assert.equal(dates.fromInputValue('2026-01-15T20:23:45', '2026-10-06T01:23:45.678Z'), '2026-01-16T02:23:45.678Z');
        assert.equal(dates.fromInputValue('2026-10-05T20:23', '2026-10-06T01:23:45.678Z'), '2026-10-06T01:23:00.678Z');
    `);
});

test('unchanged repeated DST hour preserves the original instant', () => {
    inTimezone('America/Chicago', `
        for (const original of ['2026-11-01T06:30:00.123Z', '2026-11-01T07:30:00.456Z']) {
            assert.equal(dates.toInputValue(original), '2026-11-01T01:30:00');
            assert.equal(dates.fromInputValue('2026-11-01T01:30:00', original), original);
        }
    `);
});

test('invalid dates and nonexistent DST times are rejected', () => {
    inTimezone('America/Chicago', `
        for (const value of ['', 'invalid', '2026-02-30T12:00:00', '2026-10-06T24:00:00', '2026-03-08T02:30:00']) {
            assert.throws(() => dates.fromInputValue(value, '2026-10-06T01:23:45.678Z'));
        }
        assert.equal(dates.toInputValue('invalid'), '');
    `);
});

test('editing workout dates reorders recent and season history and removes pre-season entries', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../app.html'), 'utf8');
    const functionSource = source.slice(source.indexOf('        function upsertRecordHistoryLog('), source.indexOf('        function removeRecordHistoryLog('));
    const context = vm.createContext({ assert });
    vm.runInContext(`
        const activeSeason = { startDate: '2026-09-01' };
        const workoutLogs = [
            { id: 'a', date: '2026-10-06T12:00:00.000Z' },
            { id: 'b', date: '2026-10-05T12:00:00.000Z' }
        ];
        const recordHistoryLogs = JSON.parse(JSON.stringify(workoutLogs));
        const compareLogIds = (a, b) => String(a) === String(b);
        ${functionSource}
        workoutLogs[0].date = '2026-10-04T12:00:00.000Z';
        upsertRecordHistoryLog(workoutLogs[0]);
        assert.equal(workoutLogs[0].id, 'b');
        assert.equal(recordHistoryLogs[0].id, 'b');
        workoutLogs[1].date = '2026-08-15T12:00:00.000Z';
        upsertRecordHistoryLog(workoutLogs[1]);
        assert.equal(recordHistoryLogs.length, 1);
        assert.equal(recordHistoryLogs[0].id, 'b');
        workoutLogs[1].date = '2026-10-07T12:00:00.000Z';
        upsertRecordHistoryLog(workoutLogs[1]);
        assert.equal(recordHistoryLogs[0].id, 'a');
        assert.equal(workoutLogs[0].id, 'a');
    `, context);
});

test('main workout editor saves the selected date without changing identity or lifts', async () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../app.html'), 'utf8');
    const functionSource = source.slice(source.indexOf('        async function saveEditedWorkout('), source.indexOf('        async function finalizeEditedWorkoutSave('));
    const dateInput = { value: '2026-01-15T14:05:09', reportValidity: () => true };
    const log = { id: 'original-id', revision: 4, date: '2026-10-06T19:05:09.678Z', exercises: [{ id: 'lift', sets: [{ reps: 8, weight: 50 }] }] };
    let saved = false;
    const context = vm.createContext({
        editingLogData: log,
        isSaving: false,
        WorkoutDate: require(helperPath),
        document: { getElementById: () => dateInput },
        validateAndCleanWorkout: exercises => ({ cleanedExercises: exercises, hasZeroReps: false }),
        finalizeEditedWorkoutSave: async () => { saved = true; },
        showNotification: () => { throw new Error('Unexpected validation error'); }
    });
    await vm.runInContext(`${functionSource}\nsaveEditedWorkout();`, context);
    assert.equal(saved, true);
    assert.equal(log.id, 'original-id');
    assert.equal(log.revision, 4);
    assert.equal(require(helperPath).toInputValue(log.date), dateInput.value);
    assert.equal(new Date(log.date).getMilliseconds(), 678);
    assert.deepEqual(log.exercises, [{ id: 'lift', sets: [{ reps: 8, weight: 50 }] }]);
});

test('save-date validation rejects future instants, including one millisecond ahead', () => {
    const dates = require(helperPath);
    const now = Date.parse('2026-10-30T15:00:00.500Z');
    assert.equal(dates.assertNotFuture('2026-10-30T15:00:00.500Z', now), '2026-10-30T15:00:00.500Z');
    assert.equal(dates.assertNotFuture('2026-10-29T15:00:00Z', now), '2026-10-29T15:00:00.000Z');
    for (const date of ['2026-10-30T15:00:00.501Z', '2026-11-01T00:00:00Z']) {
        assert.throws(() => dates.assertNotFuture(date, now), /cannot be in the future/);
    }
    for (const date of [undefined, null, '', 'invalid', 0]) {
        assert.throws(() => dates.assertNotFuture(date, now), /valid workout date/);
    }
});
