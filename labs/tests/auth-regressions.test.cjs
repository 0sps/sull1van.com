// Synthetic module/auth/crypto checks. No browser, network, or private data.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const scripts = [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)];
const classic = scripts.filter(([, attrs]) => !/\bsrc=|type="module"/.test(attrs)).map(([, , code]) => code).join('\n');
const rawModule = scripts.find(([, attrs]) => /type="module"/.test(attrs))[2];
const moduleSource = rawModule.slice(rawModule.indexOf('// ─── Crypto helpers'));
class Element {
    constructor() {
        const classes = new Set();
        this.classList = { add: (...v) => v.forEach(x => classes.add(x)), remove: (...v) => v.forEach(x => classes.delete(x)), contains: x => classes.has(x), toggle: (x, force = !classes.has(x)) => { if (force) classes.add(x); else classes.delete(x); } };
        this.style = {setProperty() {}, removeProperty() {}};
        this.dataset = {}; this.value = ''; this.attributes = {}; this._text = ''; this._html = ''; this.focusCount = 0;
    }
    set textContent(value) { this._text = value; this._html = ''; }
    get textContent() { return this._text; }
    set innerHTML(value) { this._html = value; this._text = ''; }
    get innerHTML() { return this._html; }
    setAttribute(k, v) { this.attributes[k] = v; }
    focus() { this.focusCount++; }
    querySelectorAll() { return []; }
    querySelector() { return null; }
    appendChild() {}
}
function setup() {
    const elements = new Map(), storage = new Map(), docs = new Map(), timers = new Map(), frames = new Map();
    let seq = 0, authCallback, transactionTail = Promise.resolve();
    const el = id => { if (!elements.has(id)) elements.set(id, new Element()); return elements.get(id); };
    const snap = ref => ({ exists: () => docs.has(ref), data: () => JSON.parse(JSON.stringify(docs.get(ref))) });
    const Firestore = {
        getFirestore: () => ({}), doc: (db, ...parts) => parts.join('/'), getDoc: async ref => snap(ref),
        runTransaction: async (db, callback) => {
            const previous = transactionTail; let release;
            transactionTail = new Promise(resolve => { release = resolve; });
            await previous;
            try {
                const writes = new Map();
                const result = await callback({ get: async ref => snap(ref), set: (ref, value) => writes.set(ref, value) });
                writes.forEach((value, ref) => docs.set(ref, JSON.parse(JSON.stringify(value))));
                return result;
            } finally { release(); }
        },
    };
    const context = vm.createContext({
        console: {log() {}, warn() {}, error() {}}, Event, Node: {TEXT_NODE: 3}, TextEncoder, TextDecoder, crypto: webcrypto,
        btoa: value => Buffer.from(value, 'binary').toString('base64'), atob: value => Buffer.from(value, 'base64').toString('binary'),
        navigator: {userAgent: 'iPhone'}, innerWidth: 390, innerHeight: 800,
        history: {state: null, replaceState(state) { this.state = state; }},
        location: {protocol: 'https:', hostname: 'example.test', origin: 'https://example.test'},
        localStorage: {getItem: k => storage.get(k) ?? null, setItem: (k, v) => storage.set(k, String(v)), removeItem: k => storage.delete(k)},
        document: {getElementById: el, documentElement: new Element(), body: new Element(), querySelector: sel => sel === '.layout' ? el('layout') : null, querySelectorAll: () => [], addEventListener() {}, createElement: () => new Element()},
        addEventListener() {}, setTimeout: fn => { timers.set(++seq, fn); return seq; }, clearTimeout: id => timers.delete(id),
        requestAnimationFrame: fn => { frames.set(++seq, fn); return seq; }, cancelAnimationFrame: id => frames.delete(id),
        initializeApp: () => ({}), getAuth: () => ({}), Firestore, onAuthStateChanged: (auth, fn) => { authCallback = fn; }, signOut: async () => {},
    });
    context.window = context;
    const run = code => vm.runInContext(code, context);
    run(classic); run(moduleSource);
    return {context, run, el, docs, storage, frames, timers, auth: user => authCallback(user)};
}

test('large encrypted vault round-trips without exceeding the function argument limit', async () => {
    const s = setup();
    s.context.key = await webcrypto.subtle.generateKey({name: 'AES-GCM', length: 256}, true, ['encrypt', 'decrypt']);
    const vault = {schemaVersion: 2, tests: [{name: 'A', points: Array.from({length: 3000}, (_, i) => ({date: '2026-10-01', rawResult: String(i), rawRange: '0-100', sourceFile: 'synthetic.pdf', testResultId: String(i), isNumeric: true}))}]};
    s.context.vault = vault;
    const encrypted = await s.run('_labsEncryptValue(key, vault)');
    s.context.encrypted = encrypted;
    const recovered = await s.run('_labsDecryptValue(key, encrypted.encryptedPayload, encrypted.iv)');
    assert.deepEqual(JSON.parse(JSON.stringify(recovered)), vault);
});

test('fresh setup atomically creates metadata and a readable empty encrypted vault', async () => {
    const s = setup();
    s.run('_waitVaultSubmit = async () => "synthetic-password"');
    s.context.key = await s.run('_labsAcquireKey(_labsDb)');
    assert.equal(s.docs.size, 2);
    s.context.record = s.docs.get('vault/main');
    const vault = await s.run('_labsDecryptValue(key, record.encryptedPayload, record.iv)');
    assert.deepEqual(JSON.parse(JSON.stringify(vault)), {schemaVersion: 2, tests: []});
    const meta = s.docs.get('meta/encryption');
    s.context.meta = meta;
    assert.equal(await s.run('verifyKey(key, meta.encryptedKeyCheck, meta.keyCheckIv)'), true);
});

test('fresh setup preserves an existing vault when encryption metadata is missing', async () => {
    const s = setup();
    const original = {encryptedPayload: 'existing encrypted data', iv: 'original'};
    s.docs.set('vault/main', original);
    s.run('_waitVaultSubmit = async () => "synthetic-password"');
    await assert.rejects(s.run('_labsAcquireKey(_labsDb)'), /already exists without its encryption settings/);
    assert.equal(s.docs.get('vault/main'), original);
    assert.equal(s.docs.has('meta/encryption'), false);
});

test('concurrent first-run creation leaves one matching metadata and vault pair', async () => {
    const s = setup();
    s.run('_waitVaultSubmit = async () => "synthetic-password"');
    const results = await Promise.allSettled([s.run('_labsAcquireKey(_labsDb)'), s.run('_labsAcquireKey(_labsDb)')]);
    const successful = results.filter(x => x.status === 'fulfilled');
    assert.equal(successful.length, 1);
    assert.equal(results.filter(x => x.status === 'rejected').length, 1);
    s.context.key = successful[0].value;
    s.context.record = s.docs.get('vault/main');
    assert.equal((await s.run('_labsDecryptValue(key, record.encryptedPayload, record.iv)')).tests.length, 0);
});

test('signout removes decrypted models, UI, pending chart work, prompts and cached key', async () => {
    const s = setup();
    s.run(`_labsUser = {uid: 'owner', email: 'sspsful@gmail.com'}; _labsKey = {};
        allTests = [{name: 'PRIVATE_TEST'}]; filteredTests = allTests; currentTestName = 'PRIVATE_TEST';
        _dataLoaded = true; _loadingInProgress = true; _queuedForceRefresh = true;
        _workbookImportState = {fileName:'PRIVATE.xlsx'}; commandPaletteOpen = true;
        let destroyed = 0; currentChart = {destroy() { destroyed++; }};
        sparklineCharts = {a: {destroy() { destroyed++; }}};
        gridPopoverFrame = requestAnimationFrame(() => { throw Error('stale chart'); });
        window.pdfResetCount = 0; window._labsResetPdfState = () => pdfResetCount++;
    `);
    for (const id of ['detailTitle', 'kpiLatest', 'commandResults', 'gridPopoverContent', 'sourcePlatterRecords', 'workbookImportBody', 'confirmActions', 'addRowsContainer', 'reportResults']) s.el(id).innerHTML = 'PRIVATE_RESULT';
    for (const id of ['commandOverlay', 'gridPopoverOverlay', 'sourcePlatterOverlay', 'vaultOverlay']) s.el(id).classList.add('visible');
    s.el('vaultPassword').value = 'secret';
    s.storage.set('health_enc_key', 'cached'); s.storage.set('health_enc_key_expiry', String(Date.now() + 1e9));
    await s.auth(null);
    assert.equal(s.context._labsUser, null); assert.equal(s.context._labsKey, null);
    assert.equal(s.run('allTests.length + filteredTests.length'), 0);
    assert.equal(s.run('currentTestName'), null);
    assert.equal(s.run('_dataLoaded || _queuedForceRefresh || commandPaletteOpen'), false);
    assert.equal(s.run('_loadingInProgress'), true, 'active load retains ownership of its lifecycle guard');
    assert.equal(s.run('destroyed'), 2); assert.equal(s.frames.size, 0);
    for (const id of ['detailTitle', 'kpiLatest', 'commandResults', 'gridPopoverContent', 'sourcePlatterRecords', 'workbookImportBody', 'confirmActions', 'addRowsContainer', 'reportResults']) assert.equal(s.el(id).innerHTML, '', id);
    assert.equal(s.el('vaultPassword').value, ''); assert.equal(s.storage.has('health_enc_key'), false);
    assert.equal(s.context.pdfResetCount, 1);
});

test('initial unauthenticated startup preserves the intended cached-key lifetime', async () => {
    const s = setup();
    s.storage.set('health_enc_key', 'cached');
    await s.auth(null);
    assert.equal(s.storage.get('health_enc_key'), 'cached');
});

test('a real desktop signout does not automatically reopen Google sign-in', async () => {
    const s = setup();
    let attempts = 0;
    s.context.navigator.userAgent = 'Desktop';
    s.context._labsUser = {uid: 'owner', email: 'sspsful@gmail.com'};
    s.context._labsLogin = () => { attempts++; };
    await s.auth(null);
    assert.equal(attempts, 0);
    assert.equal(s.context._labsHasAttemptedAutoLogin, true);
});

test('signout cancels an outstanding unlock and prevents late key publication', async () => {
    const s = setup();
    const pending = s.auth({uid: 'owner', email: 'sspsful@gmail.com'});
    for (let i = 0; i < 20 && !s.el('vaultSubmit').onclick; i++) await Promise.resolve();
    assert.equal(typeof s.el('vaultSubmit').onclick, 'function');
    await s.auth(null);
    await pending;
    assert.equal(s.context._labsKey, null); assert.equal(s.context._labsUser, null);
    assert.equal(s.el('vaultSubmit').onclick, null); assert.equal(s.docs.size, 0);
    const callbacks = [...s.frames.values()]; s.frames.clear(); callbacks.forEach(fn => fn());
    const innerCallbacks = [...s.frames.values()]; s.frames.clear(); innerCallbacks.forEach(fn => fn());
    assert.equal(s.el('vaultPassword').focusCount, 0);
    assert(s.el('panelList').innerHTML.includes('Sign in with Google'));
});
