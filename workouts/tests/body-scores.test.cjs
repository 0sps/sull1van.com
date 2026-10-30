const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(path.join(__dirname, '../body.html'), 'utf8');

// Run the page's complete inline scripts with DOM nodes from its real markup.
// innerHTML registration includes the controls created by renderScoreCards().
function harness() {
    const nodes = new Map(), listeners = new Map();
    const classes = initial => {
        const values = new Set(initial.split(/\s+/).filter(Boolean));
        return { add: (...names) => names.forEach(name => values.add(name)),
            remove: (...names) => names.forEach(name => values.delete(name)),
            contains: name => values.has(name),
            toggle(name, force) {
                const add = force === undefined ? !values.has(name) : force;
                if (add) values.add(name); else values.delete(name);
                return add;
            } };
    };
    function register(markup) {
        for (const match of markup.matchAll(/<[\w-]+\b[^>]*\bid="([^"]+)"[^>]*>/g)) {
            const tag = match[0], id = match[1];
            const node = { value: tag.match(/\bvalue="([^"]*)"/)?.[1] || '', textContent: '', style: {}, dataset: {},
                classList: classes(tag.match(/\bclass="([^"]*)"/)?.[1] || ''), setAttribute() {}, focus() {} };
            let innerHTML = '';
            Object.defineProperty(node, 'innerHTML', { get: () => innerHTML, set(value) { innerHTML = value; register(value); } });
            nodes.set(id, node);
        }
    }
    register(html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, ''));
    const selects = ['gender', 'explorerGender', 'explorerEvent'].map(id => ({
        dataset: { selectId: id }, classList: classes('app-select'),
        querySelector: () => nodes.get(`${id}Trigger`), querySelectorAll: () => []
    }));
    const document = {
        getElementById: id => nodes.get(id) || null, body: { style: {} },
        querySelector(selector) { const id = selector.match(/data-select-id="([^"]+)"/)?.[1]; return selects.find(el => el.dataset.selectId === id) || null; },
        querySelectorAll: selector => selector === '.app-select' ? selects : [],
        addEventListener(type, callback) { if (!listeners.has(type)) listeners.set(type, []); listeners.get(type).push(callback); }
    };
    const firebase = {
        initializeApp: () => ({}), getAuth: () => ({}), getFirestore: () => ({}),
        onAuthStateChanged(auth, callback) { callback(null); }, signOut: async () => {}, signInWithPopup: async () => {},
        GoogleAuthProvider: function () {}, collection() {}, doc() {}, getDocs() {}, setDoc() {}, query() {}, orderBy() {}, where() {}
    };
    const context = vm.createContext({ ...firebase, document, window: { location: { hostname: 'localhost' } }, console,
        setTimeout() {}, alert(message) { throw new Error(message); } });
    for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
        if (/\bsrc=/.test(match[1])) continue;
        const code = match[2].replace(/^\s*import .*?;\s*$/gm, '');
        vm.runInContext(/type="module"/.test(match[1]) ? `(() => {${code}\n})();` : code, context);
    }
    for (const callback of listeners.get('DOMContentLoaded') || []) callback();
    const enter = (id, value) => { assert.ok(nodes.has(id), `Rendered input ${id}`); nodes.get(id).value = String(value); };
    return { context, nodes, enter };
}

test('Body initializes all nine independent scorecards and the range explorer', () => {
    const { nodes } = harness();
    const events = ['whtr', 'pushup', 'hrPushup', 'situp', 'clrc', 'plank', 'run', 'hamr', 'walk'];
    assert.equal(nodes.get('sectionEventGrid').innerHTML.match(/class="score-event-card"/g).length, 9);
    for (const event of events) assert.equal(nodes.get(`score-card-${event}-note`).textContent, 'Enter result');
    assert.match(nodes.get('scoreRangeSummary').innerHTML, /Male · 25-29/);
    assert.match(nodes.get('scoreRangeTable').innerHTML, /≤ 0.49/);
    assert.equal(nodes.get('loadingOverlay').style.display, 'none');
});

test('WHtR and repetition card results refresh with input and profile changes', () => {
    const { context: c, nodes, enter } = harness();
    enter('card-whtr-height', 72); enter('card-whtr-waist', 33); c.updateSectionCardScore('whtr');
    assert.equal(nodes.get('score-card-whtr-value').textContent, '20.0 / 20');
    assert.equal(nodes.get('score-card-whtr-note').textContent, '45.8%');
    enter('card-whtr-waist', 45); c.updateSectionCardScore('whtr');
    assert.equal(nodes.get('score-card-whtr-value').textContent, '0.0 / 20');
    assert.equal(nodes.get('score-card-whtr').classList.contains('bad'), true);
    enter('card-pushup-value', 47); c.updateSectionCardScore('pushup');
    assert.equal(nodes.get('score-card-pushup-value').textContent, '9.0 / 15');
    c.chooseAppSelect('gender', 'F');
    assert.equal(nodes.get('score-card-pushup-value').textContent, '15.0 / 15');
    assert.equal(nodes.get('explorerGender').value, 'F');
    assert.match(nodes.get('scoreRangeSummary').innerHTML, /Female · 25-29/);
});

test('timed cardio scoring, walk pass/fail and explorer selection remain connected', () => {
    const { context: c, nodes, enter } = harness();
    enter('card-run-mins', 10); c.updateSectionCardScore('run');
    assert.equal(nodes.get('score-card-run-value').textContent, '50.0 / 50');
    enter('card-run-mins', 40); c.updateSectionCardScore('run');
    assert.equal(nodes.get('score-card-run-value').textContent, '0.0 / 50');
    enter('card-walk-mins', 16); enter('card-walk-secs', 16); c.updateSectionCardScore('walk');
    assert.equal(nodes.get('score-card-walk-value').textContent, 'PASS');
    enter('card-walk-secs', 17); c.updateSectionCardScore('walk');
    assert.equal(nodes.get('score-card-walk-value').textContent, 'FAIL');
    c.selectSectionEvent('walk');
    assert.equal(nodes.get('explorerEvent').value, 'walk');
    assert.match(nodes.get('scoreRangeTable').innerHTML, /16:16/);
    assert.match(nodes.get('scoreRangeTable').innerHTML, /Max allowed time/);
    c.chooseAppSelect('explorerEvent', 'run');
    assert.match(nodes.get('scoreRangeSummary').innerHTML, /35 pts/);
    assert.match(nodes.get('scoreRangeVisual').innerHTML, /50 pts/);
});
