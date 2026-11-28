'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const state = { language: 'en' };
const note = { id: 'note', projectId: 'project', body: 'Body', bodyDelta: { ops: [{ insert: 'Body' }] }, bodyFormat: 'quill-delta-v1' };
const editor = {};
const detached = [];
let historyCleanups = 0;
const runtime = { editorElement: editor, instance: { off: (...args) => detached.push(args) },
    textChangeHandler() {}, selectionChangeHandler() {}, historyCleanup() { historyCleanups++; } };
const selectors = ['.notes-browser-pane', '#notesResizer', '.notes-editor-header', '.notes-editor-sections'];
const current = new Map();
const replacement = new Map();
for (const selector of selectors)
{
    replacement.set(selector, {});
    current.set(selector, { replaceWith: next => current.set(selector, next) });
}
const shell = { className: '', style: {} };
current.set('.notes-shell', shell);
replacement.set('.notes-shell', { className: 'new shell', style: { cssText: 'width: 100%' } });
const main = { contains: node => node === editor, querySelector: key => current.get(key), innerHTML: '' };
const context = vm.createContext({ main, state, notesRichTextRuntime: runtime, icon: {}, connectedSourceFilterOptions() {},
    replaceSharedSearchBranch: () => false,
    replaceSharedSearchMarkup: (root, markup) => { root.innerHTML = markup; },
    document: { createElement: () => ({ content: { querySelector: key => replacement.get(key) } }) } });
for (const file of ['notes-model.js', 'browser.js'])
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../../src/modules/notes', file), 'utf8'), context, { filename: file });
context.rememberNotesEditorContent(note);
const instance = runtime.instance;
assert.equal(context.replaceNotesMarkup('new markup', note), true);
assert.equal(runtime.instance, instance);
assert.equal(main.innerHTML, '');
assert.equal(shell.className, 'new shell');
for (const selector of selectors) assert.equal(current.get(selector), replacement.get(selector));
assert.deepEqual(detached, []);
assert.equal(historyCleanups, 0);
assert.equal(context.notesEditorContentMatches({ ...note, projectId: 'another-project' }), false);
note.body = 'Externally replaced body';
assert.equal(context.replaceNotesMarkup('replace old editor', note), false);
assert.equal(runtime.instance, null);
assert.equal(historyCleanups, 1);
assert.equal(runtime.historyCleanup, null);
assert.equal(main.innerHTML, 'replace old editor');
assert.deepEqual(detached.map(call => call[0]), ['text-change', 'selection-change']);
console.log('Notes compatible editor stays connected and changed content detaches the old listeners.');
