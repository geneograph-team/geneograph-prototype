'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const read = name => fs.readFileSync(path.join(__dirname, '../../src', name), 'utf8');

const sampleData = {
    projects: [{ id: 'a' }, { id: 'b' }],
    people: [], families: [], places: [], events: [], archiveFiles: [],
    notes: [], sources: [], sourceLinks: [], noteCollections: [], placeIssues: []
};
let edited = 0;
const context = vm.createContext({
    assert, icon: {}, sampleData, state: { activeModule: 'People', language: 'en' },
    document: { documentElement: { lang: 'en' } },
    currentProjectId: () => 'a',
    validProjectById: id => sampleData.projects.find(project => project.id === id),
    getPeople: id => sampleData.people.filter(person => person.projectId === id),
    getPerson: id => sampleData.people.find(person => person.id === id),
    getPhoto: () => null,
    updatePrototypeSessionUnloadGuard: () => { edited++; },
    localizedDataFieldValue: value => value,
    cleanEditFieldValue: value => String(value ?? '').trim(),
    t: value => value
});
const files = new Set([
    'core/project-read-model.js', 'shared/project-read-providers.js', 'shared/genealogy-dates.js',
    'shared/person-name-helpers.js', 'shared/relationships.js', 'shared/tree-seed-model.js',
    'modules/places/place-record-helpers.js', 'modules/notes/notes-model.js', 'modules/notes/editor.js',
    'modules/archive/archive-sources.js', 'modules/archive/archive-file-model.js',
    'modules/people/person-editor.js'
]);
for (const [, file] of read('index.html').matchAll(/<script\b[^>]*\bsrc="([^"]+\.js)"/g))
    if (files.delete(file)) vm.runInContext(read(file), context, { filename: file });
assert.equal(files.size, 0);
vm.runInContext(read('core/bootstrap.js').split('function prototypeSessionBeforeUnload')[0], context);
const actions = read('shared/shared-actions.js');
vm.runInContext(actions.slice(actions.indexOf('function normalizeCentralNoteIdArray'),
    actions.indexOf('function renderRichTextToolbar')), context);
const navigation = read('modules/archive/archive-navigation.js');
vm.runInContext(navigation.slice(navigation.indexOf('function archiveFilePlaceIds'),
    navigation.indexOf('function archiveFilterCollator')), context);
const dialogs = read('modules/archive/archive-link-dialogs.js');
vm.runInContext(dialogs.slice(dialogs.indexOf('function openArchiveFilePlacesModal'),
    dialogs.indexOf('function openArchiveFilesPlaceModal')), context);

const run = code => vm.runInContext(code, context);
run(`
const person = {
    id: 'person', projectId: 'a', names: { first: 'Before' }, gender: 'male', livingStatus: 'Living',
    birth: emptyGenealogyDate(), death: emptyGenealogyDate(), profile: {}, events: [], attributes: []
};
const foreign = {
    ...person, id: 'foreign', projectId: 'b', names: { first: 'Foreign' },
    birth: emptyGenealogyDate(), events: [], attributes: []
};
const place = { id: 'linked', projectId: 'a', name: 'Linked' };
const note = { id: 'note', projectId: 'a', title: 'Note', collectionIds: [], linkedArchiveFileIds: [] };
const collection = { id: 'collection', projectId: 'a', name: 'Collection' };
const source = { id: 'source', projectId: 'a', title: 'Source' };
const file = { id: 'file', projectId: 'a', linkedPersonIds: [] };
sampleData.people.push(person, foreign);
sampleData.places.push(place);
sampleData.notes.push(note);
sampleData.noteCollections.push(collection);
sampleData.sources.push(source);
sampleData.archiveFiles.push(file);
sampleData.events = buildSampleEvents();
sampleData.placeIssues.push(
    { type: 'unlinked', projectId: 'a', placeId: 'linked' },
    { type: 'unlinked', projectId: 'a', placeId: 'keep-a' },
    { type: 'unlinked', projectId: 'b', placeId: 'keep-b' }
);
setProjectReadModelActive('a');
const originalPeople = projectPeopleIndex(acquireProjectReadModel('a'));
const notifications = [];
const invalidate = invalidateProjectReadModel;
invalidateProjectReadModel = (projectId, domains) =>
{
    notifications.push(projectId + ':' + (domains || []).slice().sort().join(','));
    invalidate(projectId, domains);
};
const revision = () => prototypeSessionEditRevision;
const checkNotifications = (...expected) =>
{
    assert.equal(notifications.splice(0).join('|'), expected.join('|'));
};

note.body = 'Edited body';
touchNote(note, { refreshPreview: false });
assert.ok(note.updatedAt && prototypeSessionHasEdits);
checkNotifications('a:notes');
assert.equal(setNoteCollections(note.id, [collection.id]), note);
assert.equal(setNoteCollections(note.id, [collection.id]), note);
checkNotifications('a:notes');
assert.equal(projectPeopleIndex(acquireProjectReadModel('a')), originalPeople);

assert.equal(setNoteEntityLinks(note.id, 'source', [source.id]), note);
assert.equal(setNoteEntityLinks(note.id, 'source', [source.id]), note);
checkNotifications('a:notes,sources');
const links = sampleData.sourceLinks;
assert.equal(setSourceIdsForTarget('person', person.id, [source.id]).join(), source.id);
checkNotifications('a:people,sources');
assert.notEqual(sampleData.sourceLinks, links);
assert.equal(sourceIdsForTarget('person', person.id, 'a').join(), source.id);

const before = JSON.stringify([file, note, source, sampleData.sourceLinks]);
const beforeLinks = sampleData.sourceLinks;
const failed = archiveSetConnectionsAtomically([
    { ownerType: 'file', ownerId: file.id, entityType: 'note', entityId: note.id },
    { ownerType: 'file', ownerId: file.id, entityType: 'photo', entityId: 'missing', shouldLink: false },
    { ownerType: 'file', ownerId: file.id, entityType: 'photo', entityId: 'missing' }
]);
assert.equal(failed.ok, false);
assert.equal(JSON.stringify([file, note, source, sampleData.sourceLinks]), before);
assert.equal(sampleData.sourceLinks, beforeLinks);
checkNotifications();

const setConnection = archiveSetConnection;
archiveSetConnection = (...args) => args[2] !== 'person' && setConnection(...args);
const failedAfterWrite = archiveSetConnectionsAtomically([
    { ownerType: 'file', ownerId: file.id, entityType: 'note', entityId: note.id },
    { ownerType: 'file', ownerId: file.id, entityType: 'person', entityId: person.id }
]);
archiveSetConnection = setConnection;
assert.equal(failedAfterWrite.ok, false);
assert.equal(JSON.stringify([file, note, source, sampleData.sourceLinks]), before);
assert.equal(sampleData.sourceLinks, beforeLinks);
checkNotifications();

assert.equal(archiveSetConnectionsAtomically([
    { ownerType: 'file', ownerId: file.id, entityType: 'note', entityId: note.id },
    { ownerType: 'file', ownerId: file.id, entityType: 'person', entityId: person.id }
]).changedCount, 2);
assert.equal(note.linkedArchiveFileIds.join(), file.id);
assert.equal(file.linkedPersonIds.join(), person.id);
checkNotifications('a:archive,notes');

const foreignEvent = sampleData.events.find(event => event.projectId === 'b');
const staleFile = { id: 'foreign-file', projectId: 'b', linkedEventIds: ['missing-event'] };
sampleData.archiveFiles.push(staleFile);
sampleData.sourceLinks.push({ id: 'broken', projectId: 'b', sourceId: 'absent', targetType: 'event', targetId: 'missing-event' });
const changes = new Map();
recordProjectMutation(changes, 'a', 'people');
person.names.first = 'After';
person.birth.placeId = place.id;
rebuildSampleEventsAndPruneSourceLinks(changes);
markPrototypeProjectsEdited(changes);
checkNotifications('a:events,people', 'b:archive,sources');
assert.equal(sampleData.events.find(event => event.projectId === 'b'), foreignEvent);
assert.equal(sampleData.events.find(event => event.projectId === 'a').description, 'Birth of After');
assert.notEqual(sampleData.archiveFiles.find(item => item.id === staleFile.id), staleFile);
assert.equal(sampleData.archiveFiles.find(item => item.id === staleFile.id).linkedEventIds.length, 0);
assert.equal(sampleData.sourceLinks.some(link => link.id === 'broken'), false);
assert.equal(sampleData.placeIssues.map(issue => issue.placeId).join(), 'keep-a,keep-b');

const beforeSwitch = projectPeopleIndex(acquireProjectReadModel('a'));
markPrototypeSessionEdited('b', ['people']);
checkNotifications('b:people');
assert.equal(projectPeopleIndex(acquireProjectReadModel('a')), beforeSwitch);
setProjectReadModelActive('b');
assert.equal(projectPeopleIndex(acquireProjectReadModel('b')).eligibleById.has(person.id), false);
setProjectReadModelActive('a');
assert.notEqual(projectPeopleIndex(acquireProjectReadModel('a')), beforeSwitch);
assert.equal(revision(), 7);

let invalidForm = true;
let rendered = 0;
const readAddPersonModalValue = selector => ({
    '#addPersonGender': 'Male', '#addPersonLivingStatus': 'Living', '#addPersonFirstName': 'Saved'
})[selector] || '';
const collectAddPersonAdditionalFacts = () => ({ invalid: invalidForm });
const collectAddPersonRelationshipBlock = () => ({ relationships: [] });
const collectGenealogyDateField = () => emptyGenealogyDate();
const resolvePlaceInputSelector = () => ({ placeId: place.id, placeText: place.name, address: '' });
const clearNamedPersonPlaceholderRole = () => {};
const normalizeLivingStatus = value => value;
applyAddPersonAdditionalFacts = () => {};
const savePersonRelationshipBlock = () => {};
const applyAddPersonAttachmentDrafts = () => {};
const closeModal = () => {};
const showToast = () => {};
const render = () =>
{
    rendered++;
    assert.equal(sampleData.events.find(event => event.projectId === 'a').description, 'Birth of Saved');
    assert.equal(projectPeopleIndex(acquireProjectReadModel('a')).rawById.get(person.id).names.first, 'Saved');
};
saveEditPersonModalValues(person.id);
assert.equal(person.names.first, 'After');
assert.equal(rendered, 0);
checkNotifications();
invalidForm = false;
saveEditPersonModalValues(person.id);
assert.equal(person.meta.updated, 'Just now');
assert.equal(rendered, 1);
assert.equal(revision(), 8);
checkNotifications('a:events,people');

const archivePlace = { id: 'archive-place', projectId: 'a', name: 'Archive Place' };
const otherPlace = { id: 'other-place', projectId: 'b', name: 'Other Place' };
sampleData.places.push(archivePlace, otherPlace);
sampleData.placeIssues.push({ type: 'unlinked', projectId: 'a', placeId: archivePlace.id });
file.documentPlaceId = place.id;
file.linkedPlaceIds = [];
let picker;
const openNotesPlacesModal = options => { picker = options.linkContext; };
const renderArchive = () => {};
const rpApplyConnectionChanges = (ids, context) => [...ids, ...context.changes.addedIds];
const readModel = acquireProjectReadModel('a');
const retainedPeople = projectPeopleIndex(readModel);
const placesRevision = readModel.revisionToken(['places']);
const build = () => file.linkedPlaceIds.slice();
const retainedArchive = readModel.read('test:archive', ['archive'], build);
openArchiveFilePlacesModal(file.id);
assert.equal(revision(), 8);
assert.equal(picker.onSave([otherPlace.id]), false);
assert.equal(revision(), 8);
checkNotifications();
assert.equal(picker.onSave([], { changes: { addedIds: [archivePlace.id] } }), true);
checkNotifications('a:archive');
assert.equal(revision(), 9);
assert.equal(file.documentPlaceId, place.id);
assert.equal(file.linkedPlaceIds.join(), archivePlace.id);
assert.equal(sampleData.placeIssues.map(issue => issue.placeId).join(), 'keep-a,keep-b');
assert.notEqual(readModel.read('test:archive', ['archive'], build), retainedArchive);
assert.equal(projectPeopleIndex(readModel), retainedPeople);
assert.equal(readModel.revisionToken(['places']), placesRevision);
const savedAt = file.updatedAt;
assert.ok(savedAt);
assert.equal(picker.onSave([place.id, archivePlace.id]), true);
assert.equal(file.updatedAt, savedAt);
assert.equal(revision(), 9);
checkNotifications();
assert.equal(archiveSetConnection('file', file.id, 'place', place.id, false), true);
checkNotifications('a:archive');
assert.equal(revision(), 10);
assert.equal(file.documentPlaceId, null);
assert.equal(file.linkedPlaceIds.join(), archivePlace.id);
assert.equal(archiveSetConnectionsAtomically([
    { ownerType: 'file', ownerId: file.id, entityType: 'place', entityId: archivePlace.id, shouldLink: false },
    { ownerType: 'file', ownerId: file.id, entityType: 'place', entityId: place.id }
]).changedCount, 2);
checkNotifications('a:archive');
assert.equal(revision(), 11);
`);
assert.equal(edited, 1);
console.log('Typed mutation boundaries: Notes, sources, Archive success/rollback, derived changes, dismissals and project switching passed.');
