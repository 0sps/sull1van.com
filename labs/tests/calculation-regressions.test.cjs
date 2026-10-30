const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('./helpers/app-harness.cjs');

test('numeric results preserve exponents and reject censored or narrative values', () => {
    const s = createApp();
    for (const [input, expected] of [['1e3', 1000], ['1.2E+3', 1200], ['-2.5e-2', -.025],
        ['1,234.5', 1234.5], ['.5', .5], ['0', 0], ['<8.4', null], ['Not detected (<20)', null],
        ['Hemolyzed 2+', null], ['1,2', null], ['1e999', null], ['', null]]) {
        s.context.input = input;
        assert.equal(s.run('cleanNumber(input)'), expected, input);
    }
    s.context.raw = [{ name: 'MARKER', type: 'numeric', points: [
        { date: '2026-01-01', rawResult: '<8.4', isNumeric: true },
    ] }];
    assert.equal(s.run('buildUiTestsFromVault(raw)[0].type'), 'qualitative');
    assert.equal(s.run('calcTestStats(buildUiTestsFromVault(raw)[0]).latestLabel'), '<8.4');
});

test('reference comparisons retain strict and inclusive boundary semantics', () => {
    const s = createApp();
    for (const [range, value, expected] of [['<100', 100, 'high'], ['<=100', 100, 'normal'],
        ['>60', 60, 'low'], ['>=60', 60, 'normal'], ['≤100', 100, 'normal'],
        ['-2--1', -1.5, 'normal'], ['1e2-2e2', 150, 'normal'], ['0-5 mg/dL', 4, 'normal']]) {
        s.context.range = range; s.context.value = value;
        assert.equal(s.run('isInRange(value, parseRange(range))'), expected, range);
    }
    assert.equal(s.run("getReferenceText(parseRange('<100'))"), 'Reference: < 100');
    assert.equal(s.run("parseRange('9-2')"), null);
});

test('qualitative matching respects negation and complete terms', () => {
    const s = createApp();
    for (const [input, expected] of [['Not present', 'clear'], ['Not reactive', 'clear'],
        ['Non-Reactive', 'clear'], ['Not Detected', 'clear'], ['Negative', 'clear'],
        ['Detected', 'reactive'], ['Reactive', 'reactive'], ['Present', 'reactive'],
        ['Presentation pending', 'unknown'], ['Not positive', 'unknown']]) {
        s.context.input = input;
        assert.equal(s.run('qualStatus(input)'), expected, input);
    }
});

test('latest mixed result drives stats, cards, search and anomaly filtering', () => {
    const s = createApp();
    s.run(`allTests = buildUiTestsFromVault([{name:'MARKER', points:[
        {date:'2026-01-01',rawResult:'25',isNumeric:true,rawRange:'10-90'},
        {date:'2026-02-01',rawResult:'Reactive',isNumeric:false}
    ]}]);`);
    assert.equal(s.run('calcTestStats(allTests[0]).latestLabel'), '⚠ REACTIVE');
    assert.equal(s.run("getCommandPointForTest(allTests[0], '2026-02-01').rawResult"), 'Reactive');
    assert.equal(s.run("isTestAnomalousAsOf(allTests[0], '2026-02-01')"), true);
    assert.match(s.run('renderTestCard(allTests[0])'), /Reactive/i);
    assert.equal(s.run("getCommandPointForTest(allTests[0], '2026-01-01').rawResult"), '25');
});

test('PDF retains qualitative readings and distinct authoritative IDs', () => {
    const s = createApp();
    s.loadPdf();
    let report = '';
    s.context.open = () => ({ document: { open() {}, write(html) { report = html; }, close() {} } });
    s.run(`allTests = buildUiTestsFromVault([{name:'MARKER', points:[
        {date:'2026-01-01',rawResult:'25',isNumeric:true,testResultId:'id-1'},
        {date:'2026-01-01',rawResult:'25',isNumeric:true,testResultId:'id-2'},
        {date:'2026-02-01',rawResult:'Negative',isNumeric:false,testResultId:'id-3'}
    ]}]); openPdfReportPrompt(); togglePdfReportTest('MARKER'); generateSelectedPdfReport();`);
    assert.match(report, /3 readings/);
    assert.match(report, /<td>Negative<\/td>/);
    assert.match(report, /<strong>Negative<\/strong>/);
    assert.equal((report.match(/<td>25<\/td>/g) || []).length, 2);
});

test('session reset clears PDF selections and rendered private results', () => {
    const s = createApp();
    s.loadPdf();
    s.run(`allTests = buildUiTestsFromVault([{name:'PRIVATE',points:[{date:'2026-01-01',rawResult:'25'}]}]);
        openPdfReportPrompt(); togglePdfReportTest('PRIVATE'); _labsResetPdfState();`);
    assert.equal(s.get('reportOverlay').classList.contains('visible'), false);
    assert.equal(s.get('reportResults').textContent, '');
    let opens = 0;
    s.context.open = () => { opens++; return null; };
    s.run('generateSelectedPdfReport()');
    assert.equal(opens, 0);
});

test('an in-flight load cannot republish results after the auth session changes', async () => {
    const s = createApp();
    let finish;
    s.context.pendingVault = new Promise(resolve => { finish = resolve; });
    s.run(`window._labsDb = {}; window._labsUser = {uid:'owner'}; window._labsKey = {};
        window._labsSessionGeneration = 1; allTests = []; waitForReadiness = async () => {};
        loadVaultData = () => pendingVault;`);
    const loading = s.run('loadData(true)');
    await Promise.resolve(); await Promise.resolve();
    s.run('window._labsSessionGeneration++; window._labsUser = null; window._labsKey = null;');
    finish({ tests: [{ name: 'PRIVATE', points: [{ date: '2026-01-01', rawResult: '25' }] }] });
    await loading;
    assert.equal(s.run('allTests.length'), 0);
    assert.equal(s.run('_dataLoaded'), false);
});
