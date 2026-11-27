'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const project = { id: 'p1' };
const person = { id: 'ada', projectId: 'p1', name: 'Ada North' };
const deleted = { id: 'removed', projectId: 'p1', name: 'Ineligible name', deleted: true };
const place = { id: 'town', projectId: 'p1', name: 'Town North' };
const collection = { id: 'collection', projectId: 'p1', name: 'Travel papers' };
const related = { id: 'related', projectId: 'p1', title: 'Related archive', archived: true };
const note = { id: 'note', projectId: 'p1', title: 'Journal', body: 'Body text', tags: ['tag'],
    checklist: [{ text: 'Check index' }], collectionIds: [collection.id], relatedNoteIds: [related.id],
    linkedPersonIds: [person.id, deleted.id, 'foreign'], linkedPlaceIds: [place.id] };
const sampleData = { people: [person, deleted, { id: 'foreign', projectId: 'p2', name: 'Foreign record' }],
    places: [place], notes: [note, related], noteCollections: [collection], sourceLinks: [], sources: [{ id: 'source', projectId: 'p1', title: 'Original source' }] };
let prepared = 0;
const state = { language: 'en' };
const context = vm.createContext({
    state, sampleData, icon: {}, currentProjectId: () => 'p1',
    validProjectById: id => id === project.id ? project : null,
    getPeople: id => sampleData.people.filter(person => person.projectId === id),
    personResourceDisplayName: person => state.language === 'ru' ? 'РУ ' + person.name : person.name,
    personSearchHaystack: person => { prepared++; return person.name.toLowerCase(); },
    formatGenealogyDateLabel: () => '', placeDisplayText: place => place.name,
    sourceLinksForProject: () => sampleData.sourceLinks, sourceIdsForTarget: () => [],
    normalizeCentralNoteIdArray: ids => [...new Set(ids || [])],
    archiveUniqueIds: ids => [...new Set(ids || [])]
});
for (const file of ['core/project-read-model.js', 'shared/project-read-providers.js',
    'modules/notes/notes-model.js', 'modules/notes/search-and-dialogs.js'])
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../../src', file), 'utf8'), context, { filename: file });
context.setProjectReadModelActive(project.id);
const search = () => context.noteSearchText(note, context.notesSearchContext(project.id));
assert.equal(search(), context.noteSearchText(note));
assert.match(search(), /ada north/);
assert.doesNotMatch(search(), /ineligible|foreign record/);
assert.equal(prepared, 1);
note.body = 'Different body';
collection.name = 'Renamed collection';
related.title = 'Renamed related record';
context.invalidateProjectReadModel(project.id, ['notes']);
assert.match(search(), /different body.*renamed collection.*renamed related record/);
assert.equal(prepared, 1);
note.linkedPersonIds = [];
assert.doesNotMatch(search(), /ada north/);
note.linkedPersonIds = [person.id];
person.name = 'Ada South';
place.name = 'New town';
context.invalidateProjectReadModel(project.id, ['people', 'places']);
assert.match(search(), /ada south.*new town/);
state.language = 'ru';
assert.match(search(), /ру ada south/);
person.deleted = true;
context.invalidateProjectReadModel(project.id, ['people']);
assert.doesNotMatch(search(), /ada south/);
sampleData.sourceLinks.push({ targetType: 'note', targetId: note.id, sourceId: 'source' });
assert.match(search(), /original source/);
sampleData.sources[0].title = 'Revised source';
context.invalidateProjectReadModel(project.id, ['sources']);
assert.match(search(), /revised source/);
sampleData.sourceLinks.length = 0;
assert.doesNotMatch(search(), /revised source/);
console.log('Notes search parity, live note edits and scoped linked-resource freshness passed.');
