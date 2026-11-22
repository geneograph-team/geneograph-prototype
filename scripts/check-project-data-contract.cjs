'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const context = vm.createContext({
    window: { GENEO_SEED_BOARD_ASSETS: [] },
    t: text => text,
    state: { language: 'en' },
    document: { documentElement: { lang: 'en' } },
    structuredClone
});
const files = [
    'seed/sample-data', 'shared/genealogy-dates', 'modules/places/place-record-helpers',
    'shared/person-name-helpers', 'shared/relationships', 'modules/family-tree/relationships', 'shared/tree-seed-model',
    'modules/people/person-form-fields', 'modules/people/person-editor', 'shared/date-and-place-fields',
    'seed/seed-archive-records', 'seed/seed-notes-records', 'seed/seed-geneograph-collections',
    'assets/boards/whiskerfield-tree-research', 'core/validation',
    'modules/people/relationship-editor', 'modules/people/controls'
];
for (const file of files)
{
    const filename = path.join(__dirname, '../src', file + '.js');
    vm.runInContext(fs.readFileSync(filename, 'utf8'), context, { filename });
}

const sample = vm.runInContext('sampleData', context);
const project = sample.projects[0];
const collections = vm.runInContext('PROJECT_OWNED_COLLECTIONS', context);
const authored = Object.fromEntries(vm.runInContext('PROJECT_DRAFT_COLLECTIONS', context).map(key => [key, sample[key] || []]));
const [board] = context.window.GENEO_SEED_BOARD_ASSETS;
authored.boards = [{ id: board.id, projectId: board.projectId, diagram: board.payload.board.diagram,
    collectionIds: ['board-col-research-theory'] }];

const withoutNameCaches = structuredClone(authored);
for (const person of withoutNameCaches.people)
{
    delete person.names.display;
    delete person.names.initials;
}
assert.deepEqual(context.buildSampleEvents(withoutNameCaches), context.buildSampleEvents(authored));

const before = JSON.stringify(authored);
const prepared = context.prepareProjectDraft(project, JSON.parse(before));
assert.deepEqual(Array.from(prepared.errors), []);
assert.ok(prepared.records.events.length);
const invalidEvidence = JSON.parse(before);
invalidEvidence.archiveFiles[0].linkedEventIds.push('missing-event');
const rejectedEvidence = context.prepareProjectDraft(project, invalidEvidence);
assert.ok(rejectedEvidence.errors.some(error => error.includes('linkedEventIds references missing events/missing-event')));
assert.equal(Object.hasOwn(rejectedEvidence, 'records'), false);
assert.ok(invalidEvidence.archiveFiles[0].linkedEventIds.includes('missing-event'));
assert.equal(context.prepareProjectDraft(project, { events: [] }).errors.length, 1);
assert.ok(context.prepareProjectDraft(project, { activity: [] }).errors.includes('Project input must exclude activity.'));
assert.ok(context.prepareProjectDraft({ id: 'blank', name: 'Blank' }, { people: {} }).errors.includes('people must be an array.'));
assert.equal(context.prepareProjectDraft({ id: 'blank', name: 'Blank' }, {}).records.events.length, 0);
const restored = JSON.parse(before);
const rebuiltEvents = context.buildSampleEvents(restored);
assert.equal(JSON.stringify(restored), before, "Timeline reconstruction must not modify canonical records.");
restored.events = rebuiltEvents;
assert.deepEqual(Array.from(context.validateProjectDraft(project, restored)), []);
assert.equal(JSON.stringify(authored), before);
assert.ok(context.validateProjectDraft({ ...project, coverPhotoId: 'missing-cover' }, restored).some(error => error.includes('Project cover photo is missing')));
const metadataOnly = JSON.parse(before);
for (const photo of metadataOnly.media) delete photo.src;
for (const file of metadataOnly.archiveFiles)
{
    delete file.assetUrl;
    delete file.previewUrl;
}
for (const board of metadataOnly.boards)
    for (const asset of board.diagram.assets) delete asset.src;
const restoredMetadata = context.prepareProjectDraft(project, metadataOnly);
assert.deepEqual(Array.from(restoredMetadata.errors), []);
assert.deepEqual(Array.from(restoredMetadata.records.media, photo => photo.id),
    Array.from(restored.media, photo => photo.id));
assert.deepEqual(JSON.stringify(restoredMetadata.records.boards[0].diagram.nodes),
    JSON.stringify(restored.boards[0].diagram.nodes));
const boardCore = fs.readFileSync(path.join(__dirname, '../src/modules/geneograph/geneograph-editor-core.js'), 'utf8');
context.PHOTO_UPLOAD_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
context.geneoNumber = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;
for (const [start, end] of [
    ['geneoImageRecordName', 'normalizeGeneographImageRef'],
    ['normalizeGeneographImageRef', 'normalizeGeneographBoardAsset'],
    ['normalizeGeneographBoardAsset', 'pruneGeneographBoardAssets']
])
{
    vm.runInContext(boardCore.slice(boardCore.indexOf('function ' + start + '('),
        boardCore.indexOf('function ' + end + '(')), context);
}
const metadataBoard = restoredMetadata.records.boards[0];
const metadataNode = metadataBoard.diagram.nodes.find(node => node.imageRef?.scope === 'board');
const metadataAsset = metadataBoard.diagram.assets.find(asset => asset.id === metadataNode.imageRef.id);
assert.equal(context.normalizeGeneographBoardAsset(metadataAsset).id, metadataAsset.id);
const missingImage = context.resolveGeneographImageSource(metadataNode, { board: metadataBoard });
assert.equal(missingImage.available, false);
assert.equal(missingImage.photo.id, metadataAsset.id);
metadataNode.photoId = 'retired';
assert.ok(context.validateProjectDraft(project, restoredMetadata.records).some(error => error.includes('retired image field photoId')));
delete metadataNode.photoId;
const savedImageRef = metadataNode.imageRef;
metadataNode.imageRef = { scope: 'board' };
assert.ok(context.validateProjectDraft(project, restoredMetadata.records).some(error => error.includes('.imageRef requires')));
metadataNode.imageRef = savedImageRef;
const imageReference = metadataOnly.boards[0].diagram.nodes.find(node => node.imageRef?.scope === "board").imageRef;
metadataOnly.boards[0].diagram.assets = metadataOnly.boards[0].diagram.assets.filter(asset => asset.id !== imageReference.id);
assert.ok(context.prepareProjectDraft(project, metadataOnly).errors.some(error => error.includes(".imageRef references missing ID")));

const eventIds = Array.from(restored.events, event => event.id);
assert.equal(new Set(eventIds).size, eventIds.length);
assert.deepEqual(Array.from(context.buildSampleEvents(restored), event => event.id), eventIds);
assert.ok(restored.archiveFiles.find(file => file.id === 'af5').linkedEventIds.includes(
    'event-rel-silver-luna-partner-rel-silver-luna-partner-marriage'));
assert.ok(restored.notes.some(note => note.linkedEventIds.length));
assert.ok(restored.sourceLinks.length);
assert.deepEqual(Array.from(context.validateProjectDraft({ id: 'blank', name: 'Blank' }, {})), []);
assert.equal(context.validateProjectDraft({ id: 1, name: 'Blank' }, {}).length, 1);
assert.equal(context.validateProjectDraft({ id: 'blank', name: '   ' }, {}).length, 1);

for (const [collection, field, malformed] of [
    ['archiveFiles', 'linkedPersonIds', ''],
    ['notes', 'linkedPhotoIds', null],
    ['media', 'albumIds', 'album-id']
])
{
    const original = restored[collection][0];
    restored[collection][0] = { ...original, [field]: malformed };
    assert.ok(context.validateProjectDraft(project, restored).some(error =>
        error.includes(collection + '/' + original.id + '.' + field + ' must contain unique record IDs')));
    restored[collection][0] = original;
}

const originalPlace = restored.places[0];
restored.places[0] = { ...originalPlace, name: ' ', alternativeNames: ['Pawford', 'pawford'],
    coordinates: { lat: '53', lng: -1 }, approximateRadiusMeters: 10 };
const placeErrors = context.validateProjectDraft(project, restored);
for (const field of ['name', 'alternativeNames', 'coordinates', 'approximateRadiusMeters'])
    assert.ok(placeErrors.some(error => error.includes('places/' + originalPlace.id + '.' + field)));
restored.places[0] = originalPlace;

const person = restored.people[0];
const originalNames = person.names;
person.names = [];
assert.ok(context.validateProjectDraft(project, restored).some(error => error.includes('.names must be a record')));
person.names = { ...originalNames, first: 123, last: 'x'.repeat(1025) };
for (const field of ['first', 'last'])
    assert.ok(context.validateProjectDraft(project, restored).some(error => error.includes('.names.' + field + ' must be text')));
person.names = originalNames;

const originalAttributes = person.attributes;
person.attributes = [{ id: 'invalid-attribute', tag: 1, mediaIds: null }];
const factErrors = context.validateProjectDraft(project, restored);
assert.ok(factErrors.some(error => error.includes('.attributes[0] requires a nonempty attribute tag')));
assert.ok(factErrors.some(error => error.includes('.attributes[0].mediaIds must contain unique record IDs')));
person.attributes = null;
assert.ok(context.validateProjectDraft(project, restored).some(error => error.includes('.attributes must be an array')));
person.attributes = originalAttributes;

const originalBirth = person.birth;
person.birth = '1998';
assert.ok(context.validateProjectDraft(project, restored).some(error => error.includes('.birth must be a record')));
person.birth = { ...originalBirth, first: { ...originalBirth.first, year: String(originalBirth.first.year) } };
assert.ok(context.validateProjectDraft(project, restored).some(error => error.includes('.birth must contain a structured genealogy date')));
person.birth = originalBirth;

const marriage = restored.families.find(family => family.id === 'rel-silver-luna-partner').events[0];
const originalMarriageDate = marriage.date;
marriage.date = { date: '18 Aug 2023' };
assert.ok(context.validateProjectDraft(project, restored).some(error => error.includes('.events[0].date must contain a structured genealogy date')));
marriage.date = originalMarriageDate;
marriage.tag = marriage.gedcomTag;
assert.ok(context.validateProjectDraft(project, restored).some(error => error.includes('requires a canonical gedcomTag')));
delete marriage.tag;
const baptism = restored.people.find(person => person.id === 'pearl').events[0];
assert.equal(context.personEventByTag(restored.people.find(person => person.id === 'pearl'), 'BAPM'), baptism);
baptism.tag = 'BAPM';
assert.ok(context.validateProjectDraft(project, restored).some(error =>
    error.includes('people/pearl.events[0] requires a canonical gedcomTag')));
delete baptism.tag;

restored.sourceLinks.push({ ...restored.sourceLinks[0], id: 'duplicate-citation' });
assert.ok(context.validateProjectDraft(project, restored).some(error => error.includes('duplicates an existing source link')));
restored.sourceLinks.pop();

const folders = restored.archiveFolders;
const root = folders.find(folder => folder.id === 'pawford');
root.parentId = 'fond12';
assert.ok(context.validateProjectDraft(project, restored).some(error => error.includes('folder hierarchy contains a cycle')));
root.parentId = null;

const union = restored.families.find(family => family.id === 'rel-silver-luna-partner');
const sharedRole = context.normalizedFamilyPair({ ...union, partnerARoleHint: 'HUSB', partnerBRoleHint: 'HUSB' });
assert.equal(sharedRole.fatherId, union.partnerAId);
assert.equal(sharedRole.motherId, union.partnerBId);
const editedUnion = structuredClone(union);
const editedEventId = editedUnion.events[0].id;
context.upsertPartnerRelationshipEvents(editedUnion, {
    relationshipType: 'Married', marriageType: 'Civil',
    startDate: editedUnion.events[0].date, startPlace: {}
}, { resolvePlace: () => ({ placeId: 'place-pawford', placeText: 'Pawford', address: '' }) });
assert.equal(editedUnion.events[0].id, editedEventId);
assert.equal(editedUnion.events[0].placeId, 'place-pawford');
assert.equal(Object.hasOwn(editedUnion, 'startPlaceId'), false);
const invalidUnionDraft = JSON.parse(before);
const invalidUnion = invalidUnionDraft.families.find(family => family.id === union.id);
invalidUnion.startPlaceId = 'place-pawford';
assert.ok(context.prepareProjectDraft(project, invalidUnionDraft).errors.some(error => error.includes('retired field startPlaceId')));

const secondUnion = structuredClone(union);
secondUnion.id = 'separate-union';
secondUnion.events = [];
secondUnion.parentChildTypes['silver|oliver'] = 'Guardian';
restored.families.push(secondUnion);
restored.events = context.buildSampleEvents(restored);
assert.deepEqual(Array.from(context.validateProjectDraft(project, restored)), []);
secondUnion.parentChildTypes['missing|oliver'] = 'Guardian';
assert.ok(context.validateProjectDraft(project, restored).some(error => error.includes('missing membership')));
delete secondUnion.parentChildTypes['missing|oliver'];
secondUnion.childrenIds = [...secondUnion.childIds];
assert.ok(context.validateProjectDraft(project, restored).some(error => error.includes('retired field childrenIds')));
delete secondUnion.childrenIds;
const originalPartner = secondUnion.partnerBId;
secondUnion.partnerBId = false;
assert.ok(context.validateProjectDraft(project, restored).some(error => error.includes('partner slots must contain a person ID')));
secondUnion.partnerBId = originalPartner;
secondUnion.childIds.push(0);
assert.ok(context.validateProjectDraft(project, restored).some(error => error.includes('.childIds must contain nonempty person IDs')));
secondUnion.childIds.pop();
secondUnion.type = 'partner';
assert.ok(context.validateProjectDraft(project, restored).some(error => error.includes('.type must be family')));
secondUnion.type = 'family';
delete secondUnion.events;
assert.ok(context.validateProjectDraft(project, restored).some(error => error.includes('.events must be an array')));
secondUnion.events = [];
const boardFamily = restored.boards[0].diagram.families.find(family => family.children.length);
boardFamily.children.push({ ...boardFamily.children[0] });
assert.ok(context.validateProjectDraft(project, restored).some(error => error.includes('duplicate child or self-parent membership')));
boardFamily.children.pop();
const panel = { id: 'cyclic-panel', type: 'panel', parentPanelId: 'cyclic-panel' };
restored.boards[0].diagram.nodes.push(panel);
assert.ok(context.validateProjectDraft(project, restored).some(error => error.includes('panel nesting cycle')));
restored.boards[0].diagram.nodes.pop();
restored.boards[0].diagram.connections[0].source = { nodeId: 'missing', port: 'bottom' };
assert.ok(context.validateProjectDraft(project, restored).some(error => error.includes('.source references missing ID missing')));
const syncModel = fs.readFileSync(path.join(__dirname, '../src/modules/geneograph/geneograph-tree-review-model.js'), 'utf8');
vm.runInContext(syncModel, context);
const createdUnion = context.geneoReviewNewFamily('new-sync-union', project.id, ['silver', 'luna']);
const syncDraftInput = JSON.parse(before);
syncDraftInput.families.push(createdUnion);
assert.deepEqual(Array.from(context.prepareProjectDraft(project, syncDraftInput).errors), []);
createdUnion.nonEvents = [];
assert.ok(context.prepareProjectDraft(project, syncDraftInput).errors.some(error => error.includes('retired field nonEvents')));
const parentChoice = { type: 'child', treeIds: ['silver', 'oliver'] };
const oneParent = { ...secondUnion, id: 'single-parent-union', partnerBId: '', events: [] };
sample.families.push(secondUnion, oneParent);
assert.deepEqual(Array.from(context.geneoReviewTreeFamilyCandidates({ projectId: project.id }, parentChoice), family => family.id),
    ['rel-silver-luna-partner', 'separate-union', 'single-parent-union']);
assert.deepEqual(Array.from(context.geneoReviewTreeFamilyCandidates({ projectId: project.id },
    { type: 'child', treeIds: ['silver', 'iris-not-yet-linked'] }), family => family.id), ['single-parent-union']);
assert.equal(context.unlinkFindCentralPartnerFamily('silver', 'luna', 'separate-union').id, 'separate-union');
assert.equal(context.unlinkFindCentralPartnerFamily('silver', 'luna', 'stale-union'), null);
assert.equal(context.unlinkFindCentralPartnerFamily('silver', 'luna'), null);
assert.equal(context.unlinkFindCentralFamilyForParentChild('silver', 'oliver', 'single-parent-union').id, 'single-parent-union');
assert.equal(context.unlinkFindCentralFamilyForParentChild('silver', 'oliver', 'stale-union'), null);
assert.equal(context.unlinkFindCentralFamilyForParentChild('silver', 'oliver'), null);
sample.families.splice(-2);

Object.assign(context, {
    removeSourceLinksForTargets: (type, ids) => {
        sample.sourceLinks = sample.sourceLinks.filter(link => link.targetType !== type || !ids.includes(link.targetId));
    },
    pruneInvalidSourceLinks() {},
    clearPeopleSelection() {},
    treeDefaultPersonId: () => project.defaultPersonId,
    currentProjectId: () => project.id,
    markPrototypeSessionEdited() {},
    closeModal() {},
    render() {},
    showToast() {}
});
Object.assign(sample, JSON.parse(before));
sample.events = context.buildSampleEvents(sample);
const existingSolo = structuredClone(oneParent);
existingSolo.parentChildTypes = { 'silver|oliver': 'Guardian' };
existingSolo.childIds = ['oliver'];
sample.families.push(existingSolo);
const familyIdsBeforeUnlink = new Set(sample.families.map(family => family.id));
sample.families.find(family => family.id === 'rel-silver-luna-partner').partnerARoleHint = '';
const unlinkResult = context.unlinkParentChildRelationship({
    parentId: 'luna', childId: 'oliver', familyId: 'rel-silver-luna-partner'
});
assert.equal(unlinkResult.ok, true);
assert.equal(existingSolo.parentChildTypes['silver|oliver'], 'Guardian');
const retained = sample.families.find(family => !familyIdsBeforeUnlink.has(family.id));
assert.deepEqual(Array.from(retained.childIds), ['oliver']);
assert.equal(retained.parentChildTypes['silver|oliver'], 'Biological');
assert.equal(retained.partnerAId, 'silver');
assert.equal(retained.partnerARoleHint, '');
Object.assign(sample, JSON.parse(before));
sample.events = context.buildSampleEvents(sample);

const initialCards = sample.boards[0].diagram.people.length;
context.deletePeopleRecords(['silver']);
assert.equal(sample.people.some(person => person.id === 'silver'), false);
assert.equal(sample.boards[0].diagram.people.length, initialCards);
assert.ok(sample.boards[0].diagram.people.every(person => person.treePersonId !== 'silver'));
assert.ok(sample.archiveFiles.every(file => !file.linkedPersonIds.includes('silver')));
assert.ok(sample.notes.every(note => !note.linkedPersonIds.includes('silver')));
const afterDeletion = Object.fromEntries(collections.map(key => [key, sample[key] || []]));
assert.deepEqual(Array.from(context.validateProjectDraft(project, afterDeletion)), []);

console.log('Sample project round trip, stable evidence IDs, family memberships, and board references passed.');
