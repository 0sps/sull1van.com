const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');

function createApp() {
    const elements = new Map(), listeners = {};
    const get = id => {
        if (!elements.has(id)) {
            const classes = new Set();
            elements.set(id, {
                id, value: '', textContent: '', innerHTML: '', dataset: {}, childNodes: [],
                style: { setProperty() {}, removeProperty() {} },
                classList: {
                    add: (...names) => names.forEach(name => classes.add(name)),
                    remove: (...names) => names.forEach(name => classes.delete(name)),
                    contains: name => classes.has(name),
                    toggle(name, force = !classes.has(name)) {
                        if (force) classes.add(name); else classes.delete(name);
                        return force;
                    },
                },
                focus() {}, select() {}, setSelectionRange() {}, setAttribute() {},
                querySelector() { return null; }, querySelectorAll() { return []; },
                insertAdjacentHTML(position, html) { this.innerHTML += html; },
                appendChild() {}, scrollIntoView() {},
            });
        }
        return elements.get(id);
    };
    const context = vm.createContext({
        console: { log() {}, warn() {}, error() {} }, Event, Node: { TEXT_NODE: 3 }, navigator: {},
        innerWidth: 1280, innerHeight: 800, devicePixelRatio: 1,
        history: { state: null, pushState(state) { this.state = state; }, back() {} },
        document: {
            documentElement: get('root'), body: get('body'), getElementById: get,
            querySelector: selector => selector === '.layout' ? get('layout') : null,
            querySelectorAll: () => [], createElement: () => get(Symbol()),
            createDocumentFragment: () => get(Symbol()),
            addEventListener: (name, fn) => { (listeners[name] ||= []).push(fn); },
        },
        addEventListener: (name, fn) => { (listeners[name] ||= []).push(fn); },
        setTimeout: () => 1, clearTimeout() {}, requestAnimationFrame: () => 1,
        cancelAnimationFrame() {},
    });
    context.window = context;
    const html = readFileSync(join(__dirname, '../../index.html'), 'utf8');
    const source = [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)]
        .filter(([, attrs]) => !/\bsrc=|type="module"/.test(attrs))
        .map(([, , code]) => code).join('\n');
    const run = code => vm.runInContext(code, context);
    run(source);
    return { context, get, run, listeners,
        loadPdf() { run(readFileSync(join(__dirname, '../../pdf-export.js'), 'utf8')); },
    };
}

module.exports = { createApp };
