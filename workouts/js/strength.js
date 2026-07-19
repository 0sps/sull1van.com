(function (window) {
    'use strict';

    const FALLBACK_FORMULA = 'w*(1+(r/30))';
    const MAX_ESTIMATE_REPS = 12;
    const MAX_FORMULA_LENGTH = 160;

    function tokenize(formula) {
        const source = String(formula || '').trim().toLowerCase();
        if (!source || source.length > MAX_FORMULA_LENGTH) return null;

        const tokens = [];
        let index = 0;
        while (index < source.length) {
            const char = source[index];
            if (/\s/.test(char)) {
                index += 1;
                continue;
            }
            const numberMatch = source.slice(index).match(/^(?:\d+(?:\.\d*)?|\.\d+)/);
            if (numberMatch) {
                tokens.push({ type: 'number', value: Number(numberMatch[0]) });
                index += numberMatch[0].length;
                continue;
            }
            if (char === 'w' || char === 'r') {
                tokens.push({ type: 'variable', value: char });
                index += 1;
                continue;
            }
            if ('+-*/^()'.includes(char)) {
                tokens.push({ type: char, value: char });
                index += 1;
                continue;
            }
            return null;
        }
        return tokens;
    }

    function evaluateFormula(formula, weight, reps) {
        const w = Number(weight);
        const r = Number(reps);
        if (!Number.isFinite(w) || w <= 0 || !Number.isFinite(r) || r <= 0) return null;

        const tokens = tokenize(formula);
        if (!tokens || tokens.length === 0) return null;
        let cursor = 0;

        function parseExpression() {
            let value = parseTerm();
            while (tokens[cursor]?.type === '+' || tokens[cursor]?.type === '-') {
                const operator = tokens[cursor++].type;
                const right = parseTerm();
                value = operator === '+' ? value + right : value - right;
            }
            return value;
        }

        function parseTerm() {
            let value = parsePower();
            while (tokens[cursor]?.type === '*' || tokens[cursor]?.type === '/') {
                const operator = tokens[cursor++].type;
                const right = parsePower();
                if (operator === '/' && right === 0) throw new Error('Division by zero');
                value = operator === '*' ? value * right : value / right;
            }
            return value;
        }

        function parsePower() {
            let value = parseUnary();
            if (tokens[cursor]?.type === '^') {
                cursor += 1;
                value = Math.pow(value, parsePower());
            }
            return value;
        }

        function parseUnary() {
            if (tokens[cursor]?.type === '+') {
                cursor += 1;
                return parseUnary();
            }
            if (tokens[cursor]?.type === '-') {
                cursor += 1;
                return -parseUnary();
            }
            return parsePrimary();
        }

        function parsePrimary() {
            const token = tokens[cursor++];
            if (!token) throw new Error('Unexpected end of formula');
            if (token.type === 'number') return token.value;
            if (token.type === 'variable') return token.value === 'w' ? w : r;
            if (token.type === '(') {
                const value = parseExpression();
                if (tokens[cursor]?.type !== ')') throw new Error('Missing closing parenthesis');
                cursor += 1;
                return value;
            }
            throw new Error('Unexpected formula token');
        }

        try {
            const result = parseExpression();
            if (cursor !== tokens.length || !Number.isFinite(result) || result <= 0 || result > 100000) return null;
            return result;
        } catch (error) {
            return null;
        }
    }

    function getExerciseStrengthProfile(exercise) {
        const configuredValue = exercise?.['1repmaxformula'] ?? exercise?.oneRepMaxFormula;
        const configuredFormula = typeof configuredValue === 'string' ? configuredValue.trim() : '';

        if (configuredFormula.toUpperCase() === 'NONE') {
            return {
                mode: 'repsOnly',
                formula: null,
                formulaSource: 'none',
                validated: false,
                usedFallback: false
            };
        }

        if (!configuredFormula) {
            return {
                mode: 'estimated1rm',
                formula: FALLBACK_FORMULA,
                formulaSource: 'epleyFallback',
                validated: false,
                usedFallback: true
            };
        }

        return {
            mode: 'estimated1rm',
            formula: configuredFormula,
            formulaSource: 'custom',
            validated: true,
            usedFallback: false
        };
    }

    function getExerciseFormula(exercise) {
        const profile = getExerciseStrengthProfile(exercise);
        return profile.mode === 'estimated1rm' && profile.formulaSource === 'custom'
            ? profile.formula
            : null;
    }

    function getCalculationReps(reps) {
        const repCount = Number(reps);
        if (!Number.isFinite(repCount) || repCount <= 0) return null;
        return Math.min(repCount, MAX_ESTIMATE_REPS);
    }

    function estimateNamed(weight, reps, method = 'epley') {
        const w = Number(weight);
        const r = getCalculationReps(reps);
        if (!Number.isFinite(w) || w <= 0 || r === null) return null;
        if (r === 1) return w;

        switch (String(method || 'epley').toLowerCase()) {
            case 'brzycki':
                return r >= 37 ? null : w * (36 / (37 - r));
            case 'lombardi':
                return w * Math.pow(r, 0.1);
            case 'epley':
            default:
                return w * (1 + r / 30);
        }
    }

    function estimateOneRepMax(exercise, weight, reps) {
        const profile = getExerciseStrengthProfile(exercise);
        if (profile.mode === 'repsOnly') return null;

        const actualReps = Number(reps);
        const calculationReps = getCalculationReps(actualReps);
        if (calculationReps === null) return null;

        const configuredFormula = profile.formulaSource === 'custom' ? profile.formula : null;
        const configuredValue = configuredFormula ? evaluateFormula(configuredFormula, weight, calculationReps) : null;
        if (configuredValue !== null) {
            return {
                estimatedMaxKg: configuredValue,
                validated: true,
                usedFallback: false,
                formula: configuredFormula,
                formulaSource: 'custom',
                actualReps,
                calculationReps,
                repsCapped: actualReps > calculationReps
            };
        }

        const fallbackValue = evaluateFormula(FALLBACK_FORMULA, weight, calculationReps);
        if (fallbackValue === null) return null;
        return {
            estimatedMaxKg: fallbackValue,
            validated: false,
            usedFallback: true,
            formula: FALLBACK_FORMULA,
            formulaSource: 'epleyFallback',
            invalidConfiguredFormula: !!configuredFormula,
            actualReps,
            calculationReps,
            repsCapped: actualReps > calculationReps
        };
    }

    function getBestEstimatedOneRepMax(exercise, sets) {
        let best = null;
        (sets || []).forEach((set, setIndex) => {
            if (set?.isWarmup) return;
            const weightKg = Number(set?.weight);
            const reps = parseInt(set?.reps, 10);
            const estimate = estimateOneRepMax(exercise, weightKg, reps);
            if (!estimate) return;
            if (!best || estimate.estimatedMaxKg > best.estimatedMaxKg) {
                best = { ...estimate, weightKg, reps, setIndex };
            }
        });
        return best;
    }

    function calculateWeightForEstimatedMax(exercise, estimatedMaxKg, reps) {
        const target = Number(estimatedMaxKg);
        const repCount = getCalculationReps(reps);
        const profile = getExerciseStrengthProfile(exercise);
        if (profile.mode === 'repsOnly' || !Number.isFinite(target) || target <= 0 || repCount === null) return null;

        const formula = profile.formula;
        let low = 0.0001;
        let high = Math.max(target * 2, 1);
        let highEstimate = evaluateFormula(formula, high, repCount);
        for (let attempt = 0; attempt < 10 && (!Number.isFinite(highEstimate) || highEstimate < target); attempt += 1) {
            high *= 2;
            highEstimate = evaluateFormula(formula, high, repCount);
        }
        if (!Number.isFinite(highEstimate) || highEstimate < target) return null;

        for (let iteration = 0; iteration < 60; iteration += 1) {
            const midpoint = (low + high) / 2;
            const estimate = evaluateFormula(formula, midpoint, repCount);
            if (!Number.isFinite(estimate)) return null;
            if (estimate < target) low = midpoint;
            else high = midpoint;
        }
        const weight = (low + high) / 2;
        return Number.isFinite(weight) && weight > 0 ? weight : null;
    }

    window.WorkoutStrength = Object.freeze({
        FALLBACK_FORMULA,
        MAX_ESTIMATE_REPS,
        evaluateFormula,
        getCalculationReps,
        getExerciseStrengthProfile,
        getExerciseFormula,
        estimateNamed,
        estimateOneRepMax,
        getBestEstimatedOneRepMax,
        calculateWeightForEstimatedMax
    });
})(window);
