const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../body.html'), 'utf8');
const script = source.match(/<script>\s*\/\/ =+\s*\/\/ STATE[\s\S]*?<\/script>/)[0]
    .replace(/^<script>/, '').replace(/<\/script>$/, '');
function harness() {
    const nodes = new Map(); const saves = [];
    const element = id => {
        if (!nodes.has(id)) nodes.set(id, { value: '', textContent: '', placeholder: '',
            classList: { add() {}, remove() {}, toggle() {} }, setAttribute() {}, focus() {} });
        return nodes.get(id);
    };
    const context = vm.createContext({ console, setTimeout() {}, alert(message) { throw new Error(message); },
        window: { currentUser: { uid: 'sean' }, firebaseDb: {}, firebaseDoc: () => 'ref',
            async firebaseSetDoc(ref, data) { saves.push(data); } },
        document: { getElementById: element, querySelectorAll: () => [], addEventListener() {}, body: { style: {} } }
    });
    vm.runInContext(script, context);
    return { context, element, saves };
}
const near = (actual, expected) => assert.ok(Math.abs(Number(actual) - expected) < 1e-8, `${actual} approximately ${expected}`);

test('closed modal draft retains physical values through imperial to metric switch and save', async () => {
    const { context: c, element: el, saves } = harness();
    el('mWeight').value = '185'; el('mHeight').value = '72'; el('mWaist').value = '33';
    c.closeMeasurementModal(); c.setUnits('metric'); c.openMeasurementModal();
    near(el('mWeight').value, 83.91458845); near(el('mHeight').value, 182.88); near(el('mWaist').value, 83.82);
    await c.saveBodyMeasurements();
    assert.equal(saves[0].weight, 185); assert.equal(saves[0].height, 72); assert.equal(saves[0].waist, 33);
});

test('metric to imperial converts every length field, leaves blanks and repeated selection intact', async () => {
    const { context: c, element: el, saves } = harness(); c.setUnits('metric');
    el('mWeight').value = '84';
    const lengths = ['mHeight', 'mRightWrist', 'mWaist', 'mLeftBicep', 'mRightBicep', 'mChest', 'mLeftCalf'];
    for (const id of lengths) el(id).value = '25.4';
    c.setUnits('imperial');
    near(el('mWeight').value, 84 / 0.45359237);
    for (const id of lengths) near(el(id).value, 10);
    assert.equal(el('mRightCalf').value, '');
    const weight = el('mWeight').value;
    c.setUnits('imperial'); assert.equal(el('mWeight').value, weight);
    await c.saveBodyMeasurements();
    assert.equal(saves[0].weight, 185.19); assert.equal(saves[0].rightCalf, null); assert.equal(saves[0].leftCalf, 10);
});

test('repeated unit round trips preserve measurement precision', () => {
    const { context: c, element: el } = harness(); el('mRightWrist').value = '7.25';
    for (let i = 0; i < 20; i++) { c.setUnits('metric'); c.setUnits('imperial'); }
    near(el('mRightWrist').value, 7.25);
});
