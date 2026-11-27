'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const files = [
    "src/core/project-read-model.js",
    "src/shared/project-read-providers.js",
    "src/modules/notes/notes-model.js",
    "src/modules/notes/search-and-dialogs.js",
    "src/modules/notes/browser.js",
    "src/modules/notes/editor.js"
];
const fixture = String.raw`
const project = { id: 'p1' }, other = { id: 'p2' };
let active = project.id, labels = 0, peopleReads = 0, chips = 0, commits = 0;
let timerId = 0;
const timers = new Map();
const setTimeout = callback => { timers.set(++timerId, callback); return timerId; };
const clearTimeout = id => timers.delete(id);
const finish = () => {
    const callbacks = [...timers.values()];
    timers.clear();
    callbacks.forEach(callback => callback());
};
const currentProjectId = () => active;
const validProjectById = id => [project, other].find(p => p.id === id);
const state = { language: 'en', activeModule: 'Notes', selectedNoteId: 'a', notesSaveStatus: 'Saved' };
const a = { id: 'a', projectId: 'p1', title: 'A', body: 'Changed text', updatedAt: '2000-01-01T00:00:00Z', linkedPersonIds: [], linkedPlaceIds: [] };
const b = { id: 'b', projectId: 'p1', title: 'B', body: 'B', linkedPersonIds: [] };
const c = { id: 'c', projectId: 'p2', title: 'C', body: 'C', linkedPersonIds: [] };
const people = Array.from({ length: 6481 }, (_, i) => ({ id: 'p' + i, projectId: 'p1', name: 'Person ' + (6481 - i) }));
people[0].deleted = true;
people.push({ id: 'foreign', projectId: 'p2', name: 'Foreign' });
const sampleData = { people, notes: [a, b, c], places: [{ id: 'place', projectId: 'p1', name: 'Local' }, { id: 'foreign-place', projectId: 'p2', name: 'Foreign' }] };
const getPeople = id => { peopleReads++; return people.filter(p => p.projectId === id); };
const personResourceDisplayName = p => { labels++; return p.name; };
const placeDisplayText = p => p.name;
const normalizeCentralNoteIdArray = ids => [...new Set(ids || [])];
const markPrototypeSessionEdited = (id, domains) => { commits++; invalidateProjectReadModel(id, domains); };
const localizedNoteBodyText = value => value;
const CSS = { escape: value => value };
const metadata = { textContent: 'Updated 2000', title: 'Updated 2000' };
const excerpt = {};
const status = { textContent: 'Saved', classList: { toggle() {} } };
const row = { querySelector: selector => ({
    '.notes-row-title': {}, '.notes-row-excerpt': excerpt, '.notes-row-metadata': metadata,
    '.notes-row-collections': {}
})[selector] };
const main = { querySelector: selector => selector === '#notesSaveStatus' ? status : selector.includes('data-note-id') ? row : null };
const icon = {};
const connectedSourceFilterOptions = () => [];
`;
const assertions = String.raw`
renderNoteBrowserCollectionChips = () => { chips++; return 'chips'; };
setProjectReadModelActive(active);
touchNote(a, { bodyOnly: true });
assert.equal(metadata.textContent, 'Updated today');
assert.equal(metadata.title, 'Updated today');
assert.equal(excerpt.textContent, a.body);
assert.equal(chips, 0);
assert.equal(notesSaveStatusFor(a), 'Saving');
assert.equal(status.textContent, 'Saving');
// Selecting a different note renders Saved.
state.selectedNoteId = b.id;
assert.equal(notesSaveStatusFor(b), 'Saved');
state.notesSaveStatus = notesSaveStatusFor(b);
status.textContent = state.notesSaveStatus;
finish();
assert.equal(status.textContent, 'Saved');
assert.equal(notesSaveStatusFor(a), 'Saved');
// Leaving and returning after the timer cannot carry a stale Saving status.
state.selectedNoteId = a.id;
touchNote(a, { bodyOnly: true });
state.activeModule = 'People';
finish();
state.activeModule = 'Notes';
assert.equal(notesSaveStatusFor(a), 'Saved');
// A stale callback cannot clear a newer edit on the same note.
touchNote(a, { bodyOnly: true });
const oldCallback = [...timers.values()][0];
touchNote(a, { bodyOnly: true });
oldCallback();
assert.equal(notesSaveStatusFor(a), 'Saving');
// Updating a non-selected note cannot steal the selected note's timer.
touchNote(b, { refreshPreview: false });
assert.equal(notesSaveStatusFor(a), 'Saving');
finish();
assert.equal(notesSaveStatusFor(a), 'Saved');
assert.equal(status.textContent, 'Saved');
// Deselection and project switching are isolated.
touchNote(a, { bodyOnly: true });
state.selectedNoteId = null;
assert.equal(notesSaveStatusFor(null), 'Saved');
active = other.id;
state.selectedNoteId = c.id;
setProjectReadModelActive(active);
assert.equal(notesSaveStatusFor(c), 'Saved');
finish();
active = project.id;
state.selectedNoteId = a.id;
setProjectReadModelActive(active);
assert.equal(notesSaveStatusFor(a), 'Saved');
// Compare actual old validation preparation against indexed membership.
labels = 0;
const oldStart = Date.now();
const oldIds = new Set(noteEntityRecords('person', project.id).map(p => p.id));
const oldMs = Date.now() - oldStart;
const oldLabels = labels;
assert.ok(oldLabels > 6480);
const requested = ['p8', 'p0', 'p1', 'foreign', 'p8', 'missing'];
const expected = normalizeCentralNoteIdArray(requested).filter(id => oldIds.has(id));
labels = 0;
peopleReads = 0;
const start = Date.now();
assert.equal(setNoteEntityLinks(a.id, 'person', requested, { projectId: project.id }), a);
const indexedMs = Date.now() - start;
assert.deepEqual(a.linkedPersonIds, expected);
assert.equal(labels, 0);
assert.equal(peopleReads, 1);
const afterCommit = commits;
assert.equal(setNoteEntityLinks(a.id, 'person', requested, { projectId: project.id }), a);
assert.equal(commits, afterCommit);
assert.equal(peopleReads, 1);
people[8].deleted = true;
invalidateProjectReadModel(project.id, ['people']);
setNoteEntityLinks(a.id, 'person', requested, { projectId: project.id });
assert.deepEqual(a.linkedPersonIds, ['p1']);
assert.equal(peopleReads, 2);
setNoteEntityLinks(a.id, 'place', ['foreign-place', 'place', 'place'], { projectId: project.id });
assert.deepEqual(a.linkedPlaceIds, ['place']);
assert.equal(setNoteEntityLinks(a.id, 'person', ['p1'], { projectId: other.id }), null);
console.log('Notes date, save feedback, and link validation regressions passed.');
console.log(JSON.stringify({ oldLabels, newLabels: labels, oldMs, indexedMs }));
`;
const sources = files.map(file => fs.readFileSync(path.join(__dirname, '../..', file), 'utf8'));
vm.runInNewContext([fixture, ...sources, assertions].join('\n'), { assert, console });
