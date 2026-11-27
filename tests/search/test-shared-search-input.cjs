'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

let nextFrame = 0, modalOpen = false, renders = 0;
const frames = new Map();
const state = { activeModule: 'Notes', currentProjectId: 'p1', projectOpen: true, language: 'en', query: '' };
const input = () =>
{
    const listeners = new Map();
    const node = { isConnected: true, value: '', listeners,
        addEventListener(type, handler)
        {
            if (!listeners.has(type)) listeners.set(type, []);
            listeners.get(type).push(handler);
        },
        fire(type, fields = {})
        {
            for (const handler of listeners.get(type) || []) handler({ currentTarget: node, ...fields });
        }
    };
    return node;
};
let field = input();
const main = { addEventListener() {}, contains: node => node === field && node.isConnected,
    querySelector: selector => selector === '#query' ? field : null };
const context = vm.createContext({
    state, main, window: { addEventListener() {} }, sidebar: { addEventListener() {} },
    document: { addEventListener() {} }, modalBackdrop: { classList: { contains: () => modalOpen } },
    requestAnimationFrame: callback => { frames.set(++nextFrame, callback); return nextFrame; },
    cancelAnimationFrame: id => frames.delete(id)
});
vm.runInContext(fs.readFileSync(path.join(__dirname, '../../src/core/app-shell.js'), 'utf8'), context);
const render = () => { renders++; context.bindSearchInput(main, '#query', 'query', render); };
const tick = () =>
{
    const batch = [...frames.values()];
    frames.clear();
    batch.forEach(callback => callback());
};
const type = value => { field.value = value; field.fire('input'); };
context.bindSearchInput(main, '#query', 'query', render);
context.bindSearchInput(main, '#query', 'query', render);
for (const handlers of field.listeners.values()) assert.equal(handlers.length, 1);
type('r'); type('re'); type('repeated letters');
assert.equal(state.query, 'repeated letters');
assert.equal(renders, 0);
assert.equal(frames.size, 1);
tick();
assert.equal(renders, 1);
for (const handlers of field.listeners.values()) assert.equal(handlers.length, 1);
// Composition updates state without refreshing until committed.
field.fire('compositionstart');
field.value = 'по'; field.fire('input', { isComposing: true });
tick();
assert.equal(state.query, 'по');
assert.equal(renders, 1);
field.value = 'поиск'; field.fire('compositionend');
field.fire('input');
tick();
assert.equal(renders, 2);
assert.equal(state.query, 'поиск');
// Tab commits results before the browser moves focus.
type('abc');
field.fire('keydown', { key: 'Tab' });
assert.equal(renders, 3);
assert.equal(frames.size, 0);
// Native clear and superseded frames.
type('abcd');
const superseded = [...frames.values()][0];
type('');
tick();
assert.equal(state.query, '');
assert.equal(renders, 4);
superseded();
assert.equal(renders, 4);
// A modal defers publication; closing resumes only current work.
type('modal');
modalOpen = true;
tick();
assert.equal(renders, 4);
modalOpen = false;
context.resumeSharedSearch();
tick();
assert.equal(renders, 5);
// No queued publication into a different project or module.
type('project');
state.currentProjectId = 'p2';
tick();
assert.equal(renders, 5);
type('module');
state.activeModule = 'Albums';
tick();
assert.equal(renders, 5);
type('language');
state.language = 'ru';
tick();
assert.equal(renders, 5);
// Replacement/clear outside the input controller invalidates pending work.
type('detached');
const detached = field;
detached.isConnected = false;
field = input();
context.bindSearchInput(main, '#query', 'query', render);
tick();
assert.equal(renders, 5);
detached.fire('input');
assert.equal(state.query, 'detached');
type('queued');
state.query = '';
tick();
assert.equal(renders, 5);
type('fresh');
tick();
assert.equal(renders, 6);
assert.equal(state.query, 'fresh');
console.log('Shared search latest value, composition, keyboard commit, modal deferral, cancellation and idempotent binding passed.');
