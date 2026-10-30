// Run with node --test tests/data-regressions.test.cjs. Uses synthetic vaults only.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const source = [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)]
    .filter(([, attrs]) => !/\bsrc=|type="module"/.test(attrs)).map(([, , code]) => code).join('\n');
const clone = value => JSON.parse(JSON.stringify(value));
const point = (id, value = '25') => ({ date: '2026-01-01', rawResult: value, isNumeric: true, testResultId: id });
const vault = (...points) => ({ schemaVersion: 2, tests: [{ name: 'A', type: 'numeric', points }] });
const row = (id, overrides = {}) => ({
    date: '2026-02-01', testName: 'B', isNumeric: true, rawResult: '30', rawRange: '', unit: '', sourceFile: 'lab.pdf', testResultId: id,
    ...overrides,
});
const ids = ['11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', '33333333-3333-4333-8333-333333333333'];

function setup(initial = vault(point(ids[0]))) {
    const elements = new Map();
    const el = id => {
        if (!elements.has(id)) {
            const classes = new Set();
            elements.set(id, {
                value: '', style: {}, textContent: '', innerHTML: '',
                classList: { add: (...xs) => xs.forEach(x => classes.add(x)), remove: (...xs) => xs.forEach(x => classes.delete(x)), contains: x => classes.has(x) },
                setAttribute() {}, querySelectorAll: () => [], querySelector: () => null, focus() {},
            });
        }
        return elements.get(id);
    };
    let remote = clone(initial), version = 0, commits = 0, transactionAttempts = 0, exported;
    const hooks = {};
    const firestore = {
        doc: () => 'vault/main',
        getDoc: async () => {
            const data = { encryptedPayload: JSON.stringify(remote), iv: 'iv' };
            if (hooks.read) await hooks.read();
            return { exists: () => true, data: () => data };
        },
        runTransaction: async (_db, callback) => {
            for (let attempt = 0; attempt < 5; attempt++) {
                transactionAttempts++;
                const readVersion = version;
                let write;
                const result = await callback({
                    get: async () => {
                        const data = { encryptedPayload: JSON.stringify(remote), iv: 'iv' };
                        if (hooks.transactionRead) await hooks.transactionRead();
                        return { exists: () => true, data: () => data };
                    },
                    set: (_ref, data) => { write = data; },
                });
                if (version !== readVersion) continue;
                if (write) { remote = JSON.parse(write.encryptedPayload); version++; commits++; }
                return result;
            }
            throw new Error('Transaction retries exhausted');
        },
    };
    const XLSX = {
        read: data => data,
        utils: {
            book_new: () => ({ Sheets: {} }),
            json_to_sheet: rows => ({ rows }),
            aoa_to_sheet: matrix => ({ matrix: clone(matrix) }),
            sheet_to_json: sheet => clone(sheet.matrix),
            book_append_sheet: (book, sheet, name) => { book.Sheets[name] = sheet; },
        },
        writeFile: book => { exported = book; },
    };
    const context = vm.createContext({
        console: { log() {}, warn() {}, error() {} }, crypto: webcrypto, Event,
        innerWidth: 1280, innerHeight: 800, navigator: {},
        history: { state: null, pushState(state) { this.state = state; }, back() {} },
        document: { addEventListener() {}, getElementById: el, body: { style: {} }, querySelector: () => el('layout'), querySelectorAll: () => [] },
        addEventListener() {}, setTimeout: () => 0, clearTimeout() {}, requestAnimationFrame: () => 0, cancelAnimationFrame() {},
        XLSX, FileReader: class { readAsArrayBuffer(file) { this.onload({ target: { result: file.workbook } }); } },
        _labsDb: {}, _labsUser: { uid: 'owner' }, _labsKey: {}, _labsSessionGeneration: 1, _labsFirestore: firestore,
        _labsDecryptValue: async (_key, payload) => JSON.parse(payload),
        _labsEncryptValue: async (_key, data) => ({ encryptedPayload: JSON.stringify(data), iv: 'iv' }),
    });
    context.window = context;
    vm.runInContext(source, context);
    const run = code => vm.runInContext(code, context);
    run(`loadData = async () => {}; closeCommandPalette = () => {}; showSuccessToast = () => {}; showConfirm = () => {};`);
    return {
        run, el, hooks, context,
        get remote() { return clone(remote); }, get exported() { return exported; },
        get commits() { return commits; }, get attempts() { return transactionAttempts; },
        setRemote(value) { remote = clone(value); version++; },
        setRows(rows, mode = 'sync') {
            context.inputRows = rows;
            context.cloud = clone(remote);
            run(`_workbookImportState = {workbookRows: inputRows, mode: '${mode}', reconciliation: buildWorkbookReconciliation(cloud, inputRows), selectedNewIds: new Set(inputRows.map(row => row.testResultId)), selectedChangedIds: new Set(), cloudSnapshotJson: JSON.stringify(cloud)};`);
        },
    };
}

test('manual save uses current transactional data and retries over concurrent remote additions', async () => {
    const s = setup(vault(point(ids[0]), point(ids[1])));
    let raced = false;
    s.hooks.transactionRead = () => {
        if (!raced) { raced = true; s.setRemote(vault(point(ids[0]), point(ids[1]), point(ids[2]))); }
    };
    await s.run(`executeFirebaseSave('2026-03-01', 'manual', [{name:'A',value:'40'}])`);
    const saved = s.remote.tests[0].points;
    assert.equal(saved.length, 4);
    assert.deepEqual(saved.slice(0, 3).map(p => p.testResultId), ids);
    assert.equal(saved[3].rawResult, '40');
    assert.equal(s.attempts, 2);
    assert.equal(s.commits, 1);
});

test('pending Sync cannot become an unconfirmed destructive Replace', async () => {
    const s = setup(vault(point(ids[0]), point(ids[1])));
    s.setRows([row(ids[2])]);
    let release;
    s.hooks.transactionRead = () => new Promise(resolve => { release = resolve; });
    const pending = s.run('applyWorkbookImport()');
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(s.run('_workbookImportInProgress'), true);
    s.run(`selectWorkbookImportMode('replace')`);
    assert.equal(s.run('_workbookImportState.mode'), 'sync');
    // Even direct mutation cannot change the captured operation after the await.
    s.run(`_workbookImportState.mode = 'replace'`);
    assert.equal(s.el('workbookReplaceConfirm').value, '');
    release();
    await pending;
    assert.equal(s.remote.tests.reduce((n, t) => n + t.points.length, 0), 3);
});

test('import aborts on a competing update instead of overwriting it during transaction retry', async () => {
    const s = setup();
    s.setRows([row(ids[2])]);
    let raced = false;
    s.hooks.transactionRead = () => {
        if (!raced) { raced = true; s.setRemote(vault(point(ids[0]), point(ids[1]))); }
    };
    await s.run('applyWorkbookImport()');
    assert.equal(s.commits, 0);
    assert.equal(s.remote.tests[0].points.length, 2);
    assert.match(s.el('workbookImportError').textContent, /cloud vault changed/);
});

test('adding an unrelated test preserves legacy numeric classification, units, ranges, and provenance', () => {
    const s = setup();
    s.context.legacy = { schemaVersion: 1, custom: 'keep', tests: [{
        name: 'A', type: 'numeric', unit: 'mg/dL', range: '10-90', note: 'keep',
        points: [{ date: '2026-01-01', value: '25', filename: 'original.pdf', sourcePage: 4 }],
    }] };
    s.context.newRows = [row(ids[2])];
    const merged = clone(s.run('applyWorkbookRowsToVault(legacy, newRows, false)'));
    const old = merged.tests.find(t => t.name === 'A');
    assert.equal(old.type, 'numeric');
    assert.equal(old.unit, 'mg/dL');
    assert.equal(old.range, '10-90');
    assert.equal(old.note, 'keep');
    assert.equal(old.points[0].sourcePage, 4);
    assert.equal(old.points[0].isNumeric, true);
    assert.equal(merged.custom, 'keep');
});

test('workbook names and source filenames normalize consistently before verification', async () => {
    const s = setup();
    s.context.inputFile = { workbook: { Sheets: { 'Blood Tests': { matrix: [
        ['Date','TestName','IsNumeric?','Result','NormalRange','Units','SourceFilename','Test ID'],
        ['2026-02-01','Glucose',1,'25','','','blood  test.pdf',ids[0]],
        ['2026-02-02','GLUCOSE',1,'30','','','blood  test.pdf',ids[1]],
    ] } } } };
    const rows = await s.run('parseHealthWorkbook(inputFile)');
    assert.equal(rows[0].testName, 'GLUCOSE');
    assert.equal(rows[0].sourceFile, 'blood test.pdf');
    s.context.parsedRows = rows;
    assert.doesNotThrow(() => s.run('verifyImportedRows(applyWorkbookRowsToVault({tests:[]}, parsedRows, true), parsedRows, true)'));
});

test('import preview enables the initial Apply button once parsing finishes', async () => {
    const s = setup();
    s.context.inputRows = [row(ids[2])];
    s.run('parseHealthWorkbook = async () => inputRows');
    await s.run(`handleWorkbookImportFileChange({target:{files:[{name:'new.xlsx'}]}})`);
    assert.equal(s.run('_workbookImportInProgress'), false);
    assert.equal(s.el('workbookImportApply').disabled, false);
});

test('sync can clear a legacy filename alias without failing verification', () => {
    const s = setup();
    s.context.legacy = { tests: [{ name: 'A', type: 'numeric', points: [{ ...point(ids[0]), filename: 'old.pdf' }] }] };
    s.context.newRows = [row(ids[0], { testName: 'A', sourceFile: '' })];
    const result = s.run('applyWorkbookRowsToVault(legacy, newRows, false)');
    s.context.result = result;
    assert.doesNotThrow(() => s.run('verifyImportedRows(result, newRows, false)'));
    assert.equal(result.tests[0].points[0].filename, undefined);
    assert.equal(result.tests[0].points[0].sourceFile, null);
});

test('a stale file reader cannot start a new-session vault load or unlock flow', async () => {
    const s = setup();
    let release;
    s.context.deferParse = new Promise(resolve => { release = resolve; });
    s.run('parseHealthWorkbook = () => deferParse; let vaultLoads = 0; loadVaultData = async () => { vaultLoads++; return {tests:[]}; };');
    const pending = s.run(`handleWorkbookImportFileChange({target:{files:[{name:'new.xlsx'}]}})`);
    s.context._labsSessionGeneration++;
    release([row(ids[2])]);
    await pending;
    assert.equal(s.run('vaultLoads'), 0);
});

test('export and full restore round trip large metadata and legacy records without UUIDs', async () => {
    const original = {
        schemaVersion: 1, arbitraryMetadata: 'x'.repeat(70000) + '😀',
        tests: [{ name: 'Glucose', type: 'numeric', unit: 'mg/dL', range: '10-90',
            points: [{ date: '2026-01-01', value: '25', filename: 'old  report.pdf', sourcePage: 4, lab: 'legacy', reviewStatus: 'checked', verificationStatus: 'verified', extra: { untouched: true } }] },
            { name: 'Empty metadata', type: 'qualitative', points: [], note: 'preserve me' }],
    };
    const s = setup(original);
    await s.run('exportHealthData()');
    assert.deepEqual(Object.keys(s.exported.Sheets), ['Results', 'Tests', 'Blood Tests', 'Vault Backup']);
    const chunks = s.exported.Sheets['Vault Backup'].matrix.slice(1);
    assert.ok(chunks.length > 2);
    assert.ok(chunks.every(chunk => chunk[3].length <= 30000));
    s.context.backupFile = { name: 'backup.xlsx', workbook: s.exported };
    const parsed = await s.run('parseHealthWorkbook(backupFile)');
    assert.deepEqual(clone(parsed.restoreVault), original);
    s.setRemote(vault(point(ids[2])));
    await s.run('handleWorkbookImportFileChange({target:{files:[backupFile]}})');
    assert.equal(s.run('_workbookImportState.mode'), 'replace');
    s.run(`selectWorkbookImportMode('sync')`);
    assert.equal(s.run('_workbookImportState.mode'), 'replace');
    await s.run('applyWorkbookImport()');
    assert.equal(s.commits, 0);
    s.el('workbookReplaceConfirm').value = 'REPLACE';
    await s.run('applyWorkbookImport()');
    assert.equal(s.commits, 1);
    assert.deepEqual(s.remote, original);
});

test('a session change during a transaction prevents writes', async () => {
    const s = setup();
    s.hooks.transactionRead = () => { s.context._labsSessionGeneration++; };
    await assert.rejects(s.run('updateVaultData(value => value)'), /session changed/);
    assert.equal(s.commits, 0);
});

test('a session change during a load rejects stale decrypted data', async () => {
    const s = setup();
    s.hooks.read = () => { s.context._labsSessionGeneration++; };
    await assert.rejects(s.run('loadVaultData()'), /session changed/);
});

test('manual save rejects duplicate submissions while the first transaction is pending', async () => {
    const s = setup();
    let release;
    s.hooks.transactionRead = () => new Promise(resolve => { release = resolve; });
    const pending = s.run(`executeFirebaseSave('2026-03-01','manual',[{name:'A',value:'30'}])`);
    await new Promise(resolve => setImmediate(resolve));
    await s.run(`executeFirebaseSave('2026-03-01','manual',[{name:'A',value:'30'}])`);
    release();
    await pending;
    assert.equal(s.commits, 1);
    assert.equal(s.remote.tests[0].points.length, 2);
    assert.equal(s.run('_manualSaveInProgress'), false);
});
