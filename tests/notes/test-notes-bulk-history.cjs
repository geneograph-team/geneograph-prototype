'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const read = name => fs.readFileSync(path.join(__dirname, '../../src/modules/notes', name), 'utf8');
const slice = (s, a, b) => s.slice(s.indexOf(a), s.indexOf(b, s.indexOf(a) + a.length));
const source = slice(read('editor.js'), 'const notesBulkSelection =', 'function bindNotesBrowserControls()') +
    slice(read('notes-model.js'), 'function applyNotesBulkCollections(', 'function setNoteCollections(') +
    slice(read('notes-model.js'), 'function bindNotesHistoryControls(', 'function destroyNotesRichTextEditor()') +
    slice(read('search-and-dialogs.js'), 'function deleteNotesRecords(', 'function openDeleteNoteModal(');
const assertions = String.raw`
const notes = [
    { id: 'a', projectId: 'p', collectionIds: ['c'], relatedNoteIds: ['b'], favorite: false },
    { id: 'b', projectId: 'p', collectionIds: [], relatedNoteIds: [], favorite: true },
    { id: 'c', projectId: 'p', collectionIds: ['other'], relatedNoteIds: ['b'], favorite: false },
    { id: 'foreign', projectId: 'q', collectionIds: [], relatedNoteIds: ['b'] }
];
const state = { activeModule: 'Notes', notesView: 'all', selectedNoteId: 'a' };
const sampleData = { notes, sourceLinks: [
    { projectId: 'p', targetType: 'note', targetId: 'b' },
    { projectId: 'q', targetType: 'note', targetId: 'b' }
], links: [{ projectId: 'p', fromType: 'note', fromId: 'b' }] };
let visible = notes.slice(0, 3), project = 'p', invalidations = 0, renders = 0;
const currentProjectId = () => project;
const filteredNotes = () => visible;
const rpText = en => en;
const showToast = () => {};
const markPrototypeSessionEdited = () => invalidations++;
const renderNotesPreservingInteraction = () => renders++;
const getProjectNoteCollections = () => [{ id: 'c' }, { id: 'other' }];
const notesRichTextRuntime = { instance: null };

reconcileNotesBulkSelection(filteredNotes());
toggleNotesBulkSelection('a', true);
toggleNotesBulkSelection('c', true, true);
assert.equal(notesBulkSelection.ids.size, 3);
assert.equal(state.selectedNoteId, 'a');
toggleNotesBulkSelection('b', false);
assert.equal(notesBulkSelection.ids.size, 2);
let captured = captureNotesBulkAction();
visible = notes.slice(0, 2);
assert.equal(resolveNotesBulkAction(captured), null);
reconcileNotesBulkSelection(filteredNotes());
assert.equal(notesBulkSelection.ids.size, 1);
visible = notes.slice(0, 3);
reconcileNotesBulkSelection(filteredNotes());
selectAllNotesBulk(true);
captured = captureNotesBulkAction();
project = 'q';
assert.equal(resolveNotesBulkAction(captured), null);
project = 'p';
clearNotesBulkSelection();
reconcileNotesBulkSelection(filteredNotes());
selectAllNotesBulk(true);
assert.equal(resolveNotesBulkAction(captured), null);
captured = captureNotesBulkAction();
applyNotesBulkAction(captured, 'favorite-add');
assert.equal(invalidations, 1);
assert.equal(renders, 1);
assert.ok(notes.slice(0, 3).every(note => note.favorite));
assert.equal(state.selectedNoteId, 'a');
applyNotesBulkAction(captured, 'favorite-add');
assert.equal(invalidations, 1);
applyNotesBulkAction(captured, 'archive-add');
assert.equal(invalidations, 2);
assert.equal(renders, 2);
assert.ok(notes.slice(0, 3).every(note => note.archived));
applyNotesBulkAction(captured, 'archive-remove');
assert.equal(invalidations, 3);
assert.ok(notes.slice(0, 3).every(note => !note.archived));
let membership = applyNotesBulkCollections(resolveNotesBulkAction(captured), new Map([['c', true]]), 'p');
assert.equal(membership.changed, 2);
assert.deepEqual(notes[2].collectionIds, ['other', 'c']);
applyNotesBulkCollections(resolveNotesBulkAction(captured), new Map([['c', false]]), 'p');
assert.deepEqual(notes[2].collectionIds, ['other']);
assert.equal(deleteNotesRecords(['b', 'foreign'], 'p'), 1);
assert.equal(invalidations, 4);
assert.ok(sampleData.notes.some(note => note.id === 'foreign'));
assert.equal(sampleData.sourceLinks.length, 1);
assert.equal(sampleData.sourceLinks[0].projectId, 'q');
assert.deepEqual(notes[0].relatedNoteIds, []);
assert.deepEqual(notes[3].relatedNoteIds, ['b']);
assert.equal(sampleData.links.length, 0);
state.notesView = 'archived';
reconcileNotesBulkSelection([]);
assert.equal(notesBulkSelection.ids.size, 0);

const button = () => ({ disabled: false, handlers: new Map(),
    addEventListener(name, fn) { this.handlers.set(name, fn); },
    removeEventListener(name, fn) { if (this.handlers.get(name) === fn) this.handlers.delete(name); } });
const undo = button(), redo = button(), listeners = new Set();
const instance = { history: { stack: { undo: [], redo: [] },
    undo() { this.stack.redo.push(this.stack.undo.pop()); listeners.forEach(fn => fn()); },
    redo() { this.stack.undo.push(this.stack.redo.pop()); listeners.forEach(fn => fn()); } },
    on(name, fn) { listeners.add(fn); }, off(name, fn) { listeners.delete(fn); } };
notesRichTextRuntime.instance = instance;
const toolbar = { querySelector: selector => selector.includes('undo') ? undo : redo };
const cleanup = bindNotesHistoryControls(instance, toolbar);
assert.ok(undo.disabled && redo.disabled);
instance.history.stack.undo.push(1); listeners.forEach(fn => fn());
assert.ok(!undo.disabled && redo.disabled);
undo.handlers.get('click')();
assert.ok(undo.disabled && !redo.disabled);
redo.handlers.get('click')();
assert.ok(!undo.disabled && redo.disabled);
cleanup();
assert.ok(undo.disabled && redo.disabled);
assert.equal(listeners.size, 0);
assert.equal(undo.handlers.size + redo.handlers.size, 0);
console.log('Notes bulk selection, scoped mutations, collection and history controls passed.');
`;
vm.runInNewContext(source + '\n' + assertions, { assert, console });
