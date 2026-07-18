(function (window) {
    'use strict';

    async function loadJson(jsonPath) {
        const response = await fetch(jsonPath, { cache: 'no-cache' });
        if (!response.ok) {
            throw new Error(`Failed to load ${jsonPath}: HTTP ${response.status}`);
        }
        return response.json();
    }

    async function loadExercises(jsonPath = 'exercises.json') {
        const data = await loadJson(jsonPath);
        if (!data || typeof data !== 'object' || Array.isArray(data)) {
            throw new Error(`${jsonPath} does not contain a valid exercise catalog.`);
        }

        const exerciseCount = Object.entries(data).filter(([id, exercise]) => (
            /^ex\d+$/.test(id) && exercise && typeof exercise === 'object' && typeof exercise.name === 'string'
        )).length;
        if (exerciseCount === 0) {
            throw new Error(`${jsonPath} does not contain any valid exercises.`);
        }

        return data;
    }

    window.WorkoutConfig = Object.freeze({ loadExercises });
})(window);
