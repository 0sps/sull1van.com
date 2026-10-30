(function (root) {
    'use strict';

    // Inputs show local wall time; Firestore keeps a sortable UTC ISO timestamp.
    function toInputValue(isoDate) {
        const date = new Date(isoDate);
        if (!Number.isFinite(date.getTime())) return '';
        const pad = value => String(value).padStart(2, '0');
        return `${String(date.getFullYear()).padStart(4, '0')}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    }

    function fromInputValue(value, originalDate) {
        const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value);
        if (!match) throw new Error('Enter a valid workout date and time.');
        const [, year, month, day, hour, minute, second = '00'] = match;
        const normalized = `${year}-${month}-${day}T${hour}:${minute}:${second}`;
        // Preserve milliseconds and the exact instant, including repeated DST hours.
        if (normalized === toInputValue(originalDate)) return originalDate;
        const date = new Date(normalized);
        if (!Number.isFinite(date.getTime()) || toInputValue(date.toISOString()) !== normalized) {
            throw new Error('Enter a valid workout date and time. This time may fall in a daylight saving clock change.');
        }
        const original = new Date(originalDate);
        if (Number.isFinite(original.getTime())) date.setMilliseconds(original.getMilliseconds());
        return date.toISOString();
    }

    function assertNotFuture(isoDate, now = Date.now()) {
        const date = new Date(isoDate);
        const timestamp = date.getTime();
        const currentTimestamp = new Date(now).getTime();
        const valid = typeof isoDate === 'string' && isoDate.trim() !== '' && Number.isFinite(timestamp);
        if (!valid || !Number.isFinite(currentTimestamp) || timestamp > currentTimestamp) {
            const error = new Error(valid
                ? 'Workout dates cannot be in the future.'
                : 'Enter a valid workout date and time.');
            error.code = 'invalid-workout-date';
            throw error;
        }
        return date.toISOString();
    }

    const api = { toInputValue, fromInputValue, assertNotFuture };
    root.WorkoutDate = api;
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
