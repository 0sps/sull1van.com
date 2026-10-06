const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const clone = value => value == null ? value : JSON.parse(JSON.stringify(value));
const loaderSource = fs.readFileSync(path.join(__dirname, '../js/config-loader.js'), 'utf8');
const versioned = [
    { id: 'trainingPlan', file: 'training-plan.json', key: 'lastGeneratedAt' },
    { id: 'progressionPlan', file: 'progression-plan.json', key: 'lastUpdatedDate' }
];

// Exercise the page's actual adapter with mocked Firebase and unchanged cache helpers.
function harness(page, { seed, remote = null, retryRemote = null, cached = null, seedError = false, serverError = false, signedOut = false } = {}) {
    const writes = [], cacheWrites = [], calls = [];
    const snapshot = () => ({ exists: () => remote !== null, data: () => clone(remote) });
    const failServer = () => { if (serverError) throw new Error('server unavailable'); };
    const context = vm.createContext({
        console: { warn() {} },
        window: {
            currentUser: signedOut ? null : { email: 'owner@example.com' }, firebaseDb: {},
            getUserConfigDocRef: id => `config/${id}`,
            firebaseGetDoc: async () => { calls.push('get'); failServer(); return snapshot(); },
            firebaseSetDoc: async (ref, data) => { failServer(); writes.push({ ref, data: clone(data) }); },
            firebaseRunTransaction: async (db, operation) => {
                calls.push('transaction'); failServer();
                if (retryRemote) {
                    await operation({ get: async () => snapshot(), set() {} });
                    remote = retryRemote;
                }
                return operation({ get: async () => snapshot(), set: (ref, data) => writes.push({ ref, data: clone(data) }) });
            }
        },
        readCachedUserConfig: () => clone(cached),
        writeCachedUserConfig: (id, data) => cacheWrites.push(clone(data)),
        fetchSeedConfig: async () => { calls.push('seed'); if (seedError) throw new Error('seed unavailable'); return clone(seed); }
    });
    vm.runInContext(loaderSource, context);
    const html = fs.readFileSync(path.join(__dirname, '..', page === 'app' ? 'app.html' : 'progression.html'), 'utf8');
    const start = html.indexOf(page === 'app' ? '        function assertUserConfigFirebaseReady(' : '        const configLoader =');
    const end = html.indexOf(page === 'app' ? '        const CONFIG_SYNC_TARGETS =' : '        function normalizeActiveSeason(', start);
    assert.ok(start >= 0 && end > start);
    vm.runInContext(html.slice(start, end), context);
    return { context, writes, cacheWrites, calls, load: (id, file, options) => context.loadUserConfig(id, file, options) };
}

for (const page of ['app', 'progression']) {
    for (const { id, file, key } of versioned) {
        const seed = { [key]: '2026-10-06', name: 'seed' };
        for (const [state, remote] of [
            ['missing', null], ['older', { [key]: '2026-10-05', revision: 4 }],
            ['invalid', { [key]: 'invalid', revision: 4 }],
            ['equal', { [key]: '2026-10-06', name: 'remote' }],
            ['newer', { [key]: '2026-10-07', name: 'remote' }]
        ]) {
            test(`${page}: ${id} ${state} server version`, async () => {
                const h = harness(page, { seed, remote });
                const result = clone(await h.load(id, file));
                if (['equal', 'newer'].includes(state)) {
                    assert.deepEqual(result, remote);
                    assert.equal(h.writes.length, 0);
                } else {
                    assert.equal(result.name, 'seed');
                    assert.equal(h.writes.length, 1);
                    if (id === 'trainingPlan') {
                        assert.equal(result.revision, (remote?.revision || 0) + 1);
                        assert.ok(Number.isFinite(Date.parse(result.updatedAt)));
                    } else assert.deepEqual(result, seed);
                }
                assert.deepEqual(h.cacheWrites, [result]);
            });
        }
        for (const cachedVersion of ['2026-10-05', '2026-10-06', '2026-10-07', 'invalid']) {
            test(`${page}: ${id} outage with ${cachedVersion} cache`, async () => {
                const data = { [key]: cachedVersion, name: 'cache' };
                const h = harness(page, { seed, serverError: true, cached: { data, isFresh: true } });
                assert.deepEqual(clone(await h.load(id, file)), ['2026-10-06', '2026-10-07'].includes(cachedVersion) ? data : seed);
                assert.equal(h.cacheWrites.length, 0);
            });
        }
        for (const valid of [true, false]) {
            test(`${page}: ${id} seed failure preserves cache policy (${valid})`, async () => {
                const data = { [key]: valid ? '2026-10-06' : 'invalid' };
                const h = harness(page, { seedError: true, cached: { data } });
                if (valid || page === 'app') assert.deepEqual(clone(await h.load(id, file)), data);
                else await assert.rejects(h.load(id, file), /seed unavailable/);
                assert.equal(h.cacheWrites.length, 0);
                assert.deepEqual(h.calls, ['seed']);
            });
        }
    }
    for (const state of ['fresh cache', 'existing server', 'first seed', 'stale offline cache', 'offline seed']) {
        test(`${page}: unversioned config ${state}`, async () => {
            const seed = { source: 'seed' }, remote = state === 'existing server' ? { source: 'remote' } : null;
            const cached = state.includes('cache') ? { data: { source: 'cache' }, isFresh: state === 'fresh cache' } : null;
            const h = harness(page, { seed, remote, cached, serverError: state.includes('offline') });
            assert.deepEqual(clone(await h.load('customConfig', 'custom.json')), cached ? cached.data : remote || seed);
            assert.equal(h.writes.length, state === 'first seed' ? 1 : 0);
            assert.equal(h.cacheWrites.length, ['existing server', 'first seed'].includes(state) ? 1 : 0);
            if (state === 'fresh cache') assert.deepEqual(h.calls, []);
            if (remote) assert.deepEqual(h.calls, ['get']);
        });
    }
}

test('app force refresh rejects seed/server failures despite a fresh cache', async () => {
    for (const id of ['trainingPlan', 'customConfig']) {
        for (const seedError of [true, false]) {
            const h = harness('app', { seedError, serverError: true, cached: { data: { lastGeneratedAt: '2026-10-07' }, isFresh: true }, seed: { lastGeneratedAt: '2026-10-06' } });
            await assert.rejects(h.load(id, id === 'trainingPlan' ? 'training-plan.json' : 'custom.json', { forceRefresh: true }));
            assert.equal(h.cacheWrites.length, 0);
        }
    }
});

test('app readiness guard prevents writes after sign-out and force refresh bypasses fresh cache', async () => {
    const h = harness('app', { signedOut: true, seed: { lastGeneratedAt: '2026-10-06' } });
    await assert.rejects(h.load('trainingPlan', 'training-plan.json', { forceRefresh: true }), /Sign in/);
    assert.deepEqual(h.calls, ['seed']);
    const refreshed = harness('app', { cached: { data: { source: 'cache' }, isFresh: true }, remote: { source: 'remote' } });
    assert.deepEqual(clone(await refreshed.load('customConfig', 'custom.json', { forceRefresh: true })), { source: 'remote' });
});

test('transaction retry preserves a newer server plan that arrived during seeding', async () => {
    for (const page of ['app', 'progression']) {
        const retryRemote = { lastGeneratedAt: '2026-10-07', revision: 8 };
        const h = harness(page, { seed: { lastGeneratedAt: '2026-10-06' }, retryRemote });
        assert.deepEqual(clone(await h.load('trainingPlan', 'training-plan.json')), retryRemote);
        assert.deepEqual(h.writes, []);
        assert.deepEqual(h.cacheWrites, [retryRemote]);
    }
});

test('app explicit overwrite still uses the shared revision preparation helper', () => {
    const h = harness('app');
    const prepare = vm.runInContext('prepareBundledConfigWrite', h.context);
    assert.equal(prepare('trainingPlan', { name: 'seed' }, { revision: 8 }).revision, 9);
    assert.deepEqual(clone(prepare('progressionPlan', { name: 'seed' }, { revision: 8 })), { name: 'seed' });
});
