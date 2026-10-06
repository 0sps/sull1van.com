(function (root) {
    'use strict';

    function getVersionKey(configId, jsonPath) {
        if (configId === 'trainingPlan' && jsonPath === 'training-plan.json') return 'lastGeneratedAt';
        if (configId === 'progressionPlan' && jsonPath === 'progression-plan.json') return 'lastUpdatedDate';
        return null;
    }

    function parseVersion(data, key) {
        const value = key ? data?.[key] : null;
        if (typeof value !== 'string' || !value.trim()) return null;
        const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value.trim()) ? `${value.trim()}T00:00:00Z` : value.trim();
        const time = Date.parse(normalized);
        return Number.isFinite(time) ? time : null;
    }

    function prepareBundledConfigWrite(configId, bundledData, currentData = null) {
        if (configId !== 'trainingPlan') return bundledData;
        return {
            ...bundledData,
            revision: (Number.isInteger(currentData?.revision) ? currentData.revision : 0) + 1,
            updatedAt: new Date().toISOString()
        };
    }

    function create({ readCache, writeCache, fetchSeed, getRef, getDoc, setDoc, runTransaction,
        assertReady = () => {}, allowUnversionedCacheOnSeedFailure = false }) {
        async function loadVersioned(configId, jsonPath, forceRefresh) {
            const versionKey = getVersionKey(configId, jsonPath);
            const cached = readCache(configId);
            const cachedVersion = parseVersion(cached?.data, versionKey);
            let seed;
            let seedVersion;
            try {
                seed = await fetchSeed(jsonPath);
                seedVersion = parseVersion(seed, versionKey);
                if (seedVersion === null) throw new Error(`${jsonPath} is missing a valid ${versionKey}.`);
            } catch (error) {
                // The logger permits any cached seed; progression requires a valid version.
                if (!forceRefresh && cached && (allowUnversionedCacheOnSeedFailure || cachedVersion !== null)) {
                    console.warn(`Using cached ${configId} config because bundled ${jsonPath} could not be loaded:`, error);
                    return cached.data;
                }
                throw error;
            }

            try {
                assertReady();
                const ref = getRef(configId);
                const data = await runTransaction(async transaction => {
                    const snapshot = await transaction.get(ref);
                    const remote = snapshot.exists() ? snapshot.data() : null;
                    const remoteVersion = parseVersion(remote, versionKey);
                    if (remoteVersion !== null && remoteVersion >= seedVersion) return remote;
                    if (snapshot.exists() && remoteVersion === null) {
                        console.warn(`Replacing Firebase ${configId} config because it has no valid ${versionKey}.`);
                    }
                    const data = prepareBundledConfigWrite(configId, seed, remote);
                    transaction.set(ref, data);
                    return data;
                });
                writeCache(configId, data);
                return data;
            } catch (error) {
                if (forceRefresh) throw error;
                if (cached && cachedVersion !== null && cachedVersion >= seedVersion) {
                    console.warn(`Using cached ${configId} config because Firebase refresh failed:`, error);
                    return cached.data;
                }
                console.warn(`Using bundled ${jsonPath} because Firebase refresh failed:`, error);
                return seed;
            }
        }

        async function load(configId, jsonPath, { forceRefresh = false } = {}) {
            if (getVersionKey(configId, jsonPath)) return loadVersioned(configId, jsonPath, !!forceRefresh);
            const cached = readCache(configId);
            if (!forceRefresh && cached?.isFresh) return cached.data;
            try {
                assertReady();
                const ref = getRef(configId);
                const snapshot = await getDoc(ref);
                // Existing unversioned documents remain authoritative; seed only once.
                const data = snapshot.exists() ? snapshot.data() : await fetchSeed(jsonPath);
                if (!snapshot.exists()) await setDoc(ref, data);
                writeCache(configId, data);
                return data;
            } catch (error) {
                if (forceRefresh) throw error;
                if (cached) {
                    console.warn(`Using stale cached config for ${configId} because refresh failed:`, error);
                    return cached.data;
                }
                // Boot fallbacks are never stored as freshly confirmed Firebase data.
                console.warn(`Using bundled seed config for ${configId} because Firebase refresh failed:`, error);
                return fetchSeed(jsonPath);
            }
        }
        return { load };
    }

    const api = { create, prepareBundledConfigWrite };
    root.WorkoutConfigLoader = api;
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
