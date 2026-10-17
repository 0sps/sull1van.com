// Run with: node --test labs/tests/ui-regressions.test.cjs
// Deterministic lifecycle checks. No browser, Firebase, or private lab data required.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const html = readFileSync(require('node:path').join(__dirname, '../index.html'), 'utf8');
const source = [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)]
    .filter(([, attributes]) => !/\bsrc=|type="module"/.test(attributes))
    .map(([, , code]) => code).join('\n');

class Element {
    constructor() {
        const classes = new Set();
        this.classList = {
            add: (...names) => names.forEach(name => classes.add(name)),
            remove: (...names) => names.forEach(name => classes.delete(name)),
            contains: name => classes.has(name),
            toggle: (name, force = !classes.has(name)) => {
                if (force) classes.add(name); else classes.delete(name);
                return force;
            },
        };
        this.style = { setProperty() {}, removeProperty() {} };
        this.dataset = {};
        this.value = '';
        this.textContent = '';
        this.innerHTML = '';
        this.childNodes = [{ nodeType: 3, textContent: 'Saved!' }];
        this.isConnected = true;
        this.focusCount = 0;
    }
    focus() { this.focusCount++; }
    select() {}
    setSelectionRange() {}
    querySelectorAll() { return []; }
    querySelector() { return null; }
    appendChild() {}
    insertAdjacentHTML() {}
    setAttribute() {}
    scrollIntoView() {}
}

function setup(width = 1280) {
    const elements = new Map();
    const el = id => {
        if (!elements.has(id)) elements.set(id, new Element());
        return elements.get(id);
    };
    const listeners = {};
    const timers = new Map();
    const frames = new Map();
    const observers = [];
    let id = 0;
    const context = vm.createContext({
        console, Event, Node: { TEXT_NODE: 3 }, navigator: {},
        innerWidth: width, innerHeight: 800, devicePixelRatio: 3,
        history: { entries: [], pushState(state) { this.entries.push(state); } },
        document: {
            documentElement: new Element(), body: new Element(),
            getElementById: el,
            querySelector: selector => selector === '.layout' ? el('layout') : null,
            querySelectorAll: () => [],
            createElement: () => new Element(), createDocumentFragment: () => new Element(),
            addEventListener: (name, fn) => { (listeners[name] ||= []).push(fn); },
        },
        addEventListener: (name, fn) => { (listeners[name] ||= []).push(fn); },
        setTimeout: fn => { timers.set(++id, fn); return id; },
        clearTimeout: id => timers.delete(id),
        requestAnimationFrame: fn => { frames.set(++id, fn); return id; },
        cancelAnimationFrame: id => frames.delete(id),
        IntersectionObserver: class {
            constructor(callback) { this.callback = callback; this.nodes = []; observers.push(this); }
            observe(node) { this.nodes.push(node); }
            disconnect() { this.disconnected = true; }
        },
    });
    context.window = context;
    vm.runInContext(source, context);
    const run = code => vm.runInContext(code, context);
    run(`const actualRenderTrendChart = renderTrendChart;
         renderKPIs = setDetailUnitState = renderGauge = renderTrendChart = renderHistoryTable = () => {};
         allTests = ['A', 'B'].map(name => ({name, category: 'Other', type: 'numeric', points: [], numericPts: [{date:'2026-01-01', numVal: 12}, {date:'2026-02-01', numVal: 13}]}));`);
    const flush = queue => {
        const tasks = [...queue.values()]; queue.clear(); tasks.forEach(fn => fn());
    };
    const key = (key, target = 'commandInput') => {
        const event = { key, target: { id: target }, preventDefault() { this.defaultPrevented = true; } };
        (listeners.keydown || []).forEach(fn => fn(event));
        return event;
    };
    return { el, run, listeners, frames, timers, observers, context, key, flush };
}

test('mobile selection survives repeated opens without duplicate detail history', () => {
    const s = setup(390);
    s.run(`openTest('A'); openTest('B');`);
    assert.equal(s.run('currentTestName'), 'B');
    assert.equal(s.context.history.entries.length, 1);
    assert.equal(s.el('detailTitle').textContent, 'B');
});

test('closing a popover before its first frame cancels both deferred jobs', () => {
    const s = setup();
    s.run(`openGridPopover(allTests[0], null); closeGridPopover();`);
    s.flush(s.frames); s.flush(s.timers);
    assert.equal(s.el('gridPopover').classList.contains('visible'), false);
    assert.equal(s.el('gridPopoverOverlay').classList.contains('visible'), false);
});

test('rapidly reopening the same popover produces a single trend chart', () => {
    const s = setup();
    s.run(`let renders = 0; renderTrendChart = () => renders++;
           openGridPopover(allTests[0], null); openGridPopover(allTests[0], null);`);
    s.flush(s.frames); s.flush(s.timers);
    assert.equal(s.run('renders'), 1);
});

test('delayed palette focus cannot steal focus after closing or entering add mode', () => {
    const s = setup();
    s.run(`renderCommandPalette = () => {}; openCommandPalette(); closeCommandPalette();`);
    const initial = s.el('commandInput').focusCount;
    s.flush(s.frames); s.flush(s.timers);
    assert.equal(s.el('commandInput').focusCount, initial);
    s.run(`commandPaletteOpen = true; commandMode = 'add'; focusCommandInput();`);
    assert.equal(s.el('commandInput').focusCount, initial);
});

test('only intersecting cards allocate charts and leaving the viewport releases them', () => {
    const s = setup();
    s.run(`filteredTests = allTests;
           let drawn = 0, destroyed = 0;
           drawSparkline = t => { drawn++; sparklineCharts[getTestDomId(t.name)] = {destroy() { destroyed++; }}; };`);
    for (const [index, name] of ['A', 'B'].entries()) {
        s.el(name).dataset.testname = name;
        s.context.card = s.el(name);
        s.run(`testCardNodes['test-btn-${name}_${index}'] = card;`);
    }
    s.run('renderList()');
    const observer = s.observers[0];
    assert.equal(s.run('drawn'), 0);
    observer.callback([{ target: s.el('A'), isIntersecting: true }]);
    assert.equal(s.run('drawn'), 1);
    observer.callback([{ target: s.el('A'), isIntersecting: false }]);
    assert.equal(s.run('destroyed'), 1);
    assert.equal(s.run('Object.keys(sparklineCharts).length'), 0);
});

test('stale intersection callbacks cannot resurrect charts after filtering', () => {
    const s = setup();
    s.run(`filteredTests = [];`);
    // Use one cached card to avoid HTML parsing in this lifecycle-only DOM stub.
    s.context.card = s.el('A'); s.el('A').dataset.testname = 'A';
    s.run(`filteredTests = [allTests[0]]; testCardNodes['test-btn-A_0'] = card;
           let drawn = 0; drawSparkline = () => drawn++; renderList();`);
    const stale = s.observers[0];
    s.run('renderList()');
    stale.callback([{ target: s.el('A'), isIntersecting: true }]);
    assert.equal(s.run('drawn'), 0);
    assert.equal(stale.disconnected, true);
});

test('filtering in grid view preserves the open detail chart', () => {
    const s = setup();
    s.el('layout').classList.add('is-grid-view');
    s.run(`let destroyed = false; currentChart = { destroy() { destroyed = true; } };
           filteredTests = []; renderList();`);
    assert.equal(s.run('destroyed'), false);
});

test('changing the mobile list layout keeps an open mobile detail chart intact', () => {
    const s = setup(390);
    s.el('layout').classList.add('in-detail');
    s.run(`let destroyed = false; currentChart = {destroy() { destroyed = true; }};
           window.setLayoutView(true); window.setLayoutView(false);`);
    assert.equal(s.run('destroyed'), false);
});

test('a trend chart uses its own pane canvas even if another pane contains the same test', () => {
    const s = setup();
    const canvas = new Element();
    const container = new Element();
    container.id = 'detailDynamic';
    container.querySelector = () => canvas;
    s.context.targetPane = container;
    let chartCanvas;
    s.context.Chart = function (target) { chartCanvas = target; };
    s.run('actualRenderTrendChart(allTests[0], targetPane)');
    assert.equal(chartCanvas, canvas);
});

test('anomaly filtering scans the global latest date once per update', () => {
    const s = setup();
    s.run(`let scans = 0; getCommandAsOfDate = () => { scans++; return '2026-02-01'; };
           renderList = () => {}; anomalyLensActive = true; applyFilters();`);
    assert.equal(s.run('scans'), 1);
});

test('Enter on an action button does not also open the selected command result', () => {
    const s = setup();
    s.run(`commandPaletteOpen = true; let opens = 0;
           getCommandRows = () => [{test: {name:'A'}}]; openCommandResult = () => opens++;`);
    s.key('Enter', 'some-action-button');
    assert.equal(s.run('opens'), 0);
    s.key('Enter');
    assert.equal(s.run('opens'), 1);
});

test('Escape dismisses source details before the grid popover beneath them', () => {
    const s = setup();
    s.el('sourcePlatterOverlay').classList.add('visible');
    s.el('gridPopover').classList.add('visible');
    s.key('Escape');
    assert.equal(s.el('sourcePlatterOverlay').classList.contains('visible'), false);
    assert.equal(s.el('gridPopover').classList.contains('visible'), true);
});

test('phone-to-desktop resize restores headers and the same selected test', () => {
    const s = setup(390);
    s.run(`openTest('B'); innerWidth = 1200;`);
    s.listeners.resize[0]();
    assert.equal(s.el('globalTopBar').style.display, '');
    assert.equal(s.el('layout').classList.contains('in-detail'), false);
    assert.equal(s.run('currentTestName'), 'B');
});

test('desktop-to-phone resize cannot leave a detail pane below the list', () => {
    const s = setup();
    s.run(`openTest('A'); innerWidth = 390;`);
    s.listeners.resize[0]();
    assert.equal(s.el('panelDetail').classList.contains('visible'), false);
    assert.equal(s.run('currentChart'), null);
    assert.equal(s.run('currentTestName'), null);
});

test('a new success toast gets a full lifetime after an earlier toast', () => {
    const s = setup();
    s.run(`showSuccessToast('First'); showSuccessToast('Second');`);
    assert.equal(s.timers.size, 1);
    assert.equal(s.el('successToast').classList.contains('visible'), true);
});

test('refreshing data rebuilds the selected detail using the new readings', async () => {
    const s = setup(390);
    s.el('layout').classList.add('in-detail');
    s.run(`currentTestName = 'A';
           window._labsDb = {}; window._labsUser = {}; window._labsKey = {};
           waitForReadiness = async () => {};
           loadVaultData = async () => ({ tests: [{name:'A', points:[], numericPts:[{numVal:42}]}] });
           buildUiTestsFromVault = tests => tests;
           buildChips = applyFilters = deferUnitResolution = () => {};
           let refreshedValue = null;
           openTest = name => { refreshedValue = allTests.find(test => test.name === name).numericPts[0].numVal; };`);
    await s.run('loadData(true)');
    assert.equal(s.run('refreshedValue'), 42);
    assert.equal(s.context.history.entries.length, 0);
});

test('every script parses, including the Firebase module and PDF exporter', () => {
    for (const [, attrs, code] of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
        if (/\bsrc=/.test(attrs)) continue;
        if (/type="module"/.test(attrs)) {
            const result = require('node:child_process').spawnSync(process.execPath,
                ['--check', '--input-type=module'], {input: code, encoding: 'utf8'});
            assert.equal(result.status, 0, result.stderr);
        } else new vm.Script(code);
    }
    new vm.Script(readFileSync(require('node:path').join(__dirname, '../pdf-export.js'), 'utf8'));
});
