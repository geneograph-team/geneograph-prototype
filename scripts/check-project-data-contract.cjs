'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const context = vm.createContext({
    window: { GENEO_SEED_BOARD_ASSETS: [], addEventListener() {} },
    t: text => text,
    translateText: text => text,
    state: { language: 'en', geneoBoardViewports: {} },
    document: { documentElement: { lang: 'en' } },
    geneoThemeColor: dark => dark,
    getComputedStyle: () => ({ getPropertyValue: () => '#18211F' }),
    atob,
    structuredClone
});
const files = [
    'seed/sample-data', 'seed/seed-genealogy', 'shared/genealogy-dates', 'modules/places/place-record-helpers',
    'shared/person-name-helpers', 'shared/relationships', 'modules/family-tree/relationships', 'shared/tree-seed-model',
    'modules/people/person-form-fields', 'modules/people/person-editor', 'shared/date-and-place-fields',
    'modules/archive/archive-sources', 'seed/seed-archive-records', 'seed/seed-notes-records', 'seed/seed-geneograph-collections',
    'modules/albums/photo-layout-and-crop', 'modules/albums/person-photo',
    'modules/geneograph/geneograph-runtime', 'modules/geneograph/geneograph-model',
    'modules/geneograph/geneograph-editor-core', 'modules/geneograph/geneograph-theme-board', 'modules/geneograph/geneograph-sidebar',
    'modules/geneograph/geneograph-board-files', 'modules/geneograph/geneograph-shadow',
    'assets/boards/whiskerfield-tree-research', 'seed/seed-boards', 'core/validation',
    'modules/people/relationship-editor', 'modules/people/controls'
];
const sourceDirectory = path.join(__dirname, '../src');
const indexHtml = fs.readFileSync(path.join(sourceDirectory, 'index.html'), 'utf8');
const orderedScripts = Array.from(indexHtml.matchAll(/<script\b[^>]*\bsrc="([^"]+\.js)"/g), match => match[1]);
const scriptOrder = new Map(orderedScripts.map((name, index) => [name, index]));
for (const file of files) assert.ok(scriptOrder.has(file + '.js'), file + ' must be part of the app startup');
files.sort((left, right) => scriptOrder.get(left + '.js') - scriptOrder.get(right + '.js'));

for (const file of files)
{
    const filename = path.join(__dirname, '../src', file + '.js');
    vm.runInContext(fs.readFileSync(filename, 'utf8'), context, { filename });
}

const sample = vm.runInContext('sampleData', context);
const startupEvidence = JSON.stringify([sample.sourceLinks, sample.archiveFiles, sample.notes]);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/seed/seed-genealogy.js'), 'utf8'), context);
assert.equal(JSON.stringify([sample.sourceLinks, sample.archiveFiles, sample.notes]), startupEvidence);
assert.ok(sample.events.length > 0);
const project = sample.projects[0];
const seededBoard = sample.boards[0];
const paint = { color: '#336699', enabled: false, opacity: 60 };
const canvasAppearance = context.geneoAppearance({ stroke: paint, strokeColor: '#FFFFFF', strokeType: 'dashed' },
    { strokePattern: 'solid' }, 'shape');
assert.equal(canvasAppearance.stroke.color, paint.color);
assert.equal(canvasAppearance.stroke.enabled, false);
assert.equal(canvasAppearance.strokePattern, 'solid');
const inheritedStroke = context.geneoAppearance({ strokeWidth: 4, strokePattern: 'dashed' }, {}, 'person');
assert.equal(inheritedStroke.styleOverrides.strokeWidth, false);
assert.equal(inheritedStroke.styleOverrides.strokePattern, false);
const authoredStroke = context.geneoAppearance({ strokeWidth: 4, styleOverrides: { strokeWidth: true } }, {}, 'person');
assert.equal(authoredStroke.styleOverrides.strokeWidth, true);
const alignmentSettings = context.normalizeGeneographPersonCardOverrides({
    custom: true, styleSettings: { standard: { alignment: 'right' } }
});
assert.equal(alignmentSettings.styleSettings.standard.alignment, 'right');
assert.equal(alignmentSettings.styleSettings.standard.nameAlignment, null);
assert.equal(context.normalizeGeneographShapeKind('rectangle'), 'rectangle');
assert.equal(context.geneoAppearance({ cornerRadius: 12 }, { cornerRadius: 0 }, 'shape').cornerRadius, 12);
assert.equal(context.geneographBoardModifiedTime(seededBoard), Date.parse(seededBoard.modifiedAt));
assert.equal(Object.hasOwn(seededBoard, 'modified'), false);
const collections = vm.runInContext('PROJECT_OWNED_COLLECTIONS', context);
const authored = Object.fromEntries(vm.runInContext('PROJECT_DRAFT_COLLECTIONS', context).map(key => [key, sample[key] || []]));

const withoutNameCaches = structuredClone(authored);
for (const person of withoutNameCaches.people)
{
    delete person.names.display;
    delete person.names.initials;
}
assert.deepEqual(context.buildSampleEvents(withoutNameCaches), context.buildSampleEvents(authored));

const before = JSON.stringify(authored);
const normalizedBoardInput = JSON.parse(before);
const boardForNormalization = normalizedBoardInput.boards[0];
const membershipBeforeNormalization = JSON.stringify(boardForNormalization.diagram.families.map(family =>
    [family.id, family.partnerIds, family.children]));
const cardGeometry = board => JSON.stringify(board.diagram.nodes.filter(node => node.type === 'person')
    .map(node => [node.id, node.x, node.y, node.width, node.height]));
const geometryBeforeNormalization = cardGeometry(boardForNormalization);
context.normalizeGeneographBoardRecord(boardForNormalization, new Map([
    [project.id, new Set(normalizedBoardInput.people.map(person => person.id))]
]));
assert.equal(JSON.stringify(boardForNormalization.diagram.families.map(family =>
    [family.id, family.partnerIds, family.children])), membershipBeforeNormalization);
assert.equal(cardGeometry(boardForNormalization), geometryBeforeNormalization);
assert.deepEqual(Array.from(context.prepareProjectDraft(project, normalizedBoardInput).errors), []);

const prepared = context.prepareProjectDraft(project, JSON.parse(before));
assert.deepEqual(Array.from(prepared.errors), []);
assert.ok(prepared.records.events.length);
const missingPersonShape = JSON.parse(before);
for (const key of ['profile', 'attributes', 'birth']) delete missingPersonShape.people[0][key];
missingPersonShape.people[0].livingStatus = 'unknown';
missingPersonShape.people[0].sex = 'male';
const missingShape = context.prepareProjectDraft(project, missingPersonShape);
for (const diagnostic of ['.profile must be a record', '.attributes must be an array', '.birth must be a record', '.livingStatus must be', 'cannot contain sex'])
    assert.ok(missingShape.errors.some(error => error.includes(diagnostic)));
const invalidFactIds = JSON.parse(before);
const [education] = invalidFactIds.people[0].attributes;
invalidFactIds.people[0].attributes.push({ ...education }, { ...education, id: '' });
const invalidFactDraft = context.prepareProjectDraft(project, invalidFactIds);
assert.equal(invalidFactDraft.errors.filter(error => error.includes('requires a unique nonempty fact ID')).length, 2);
assert.equal(Object.hasOwn(invalidFactDraft, 'records'), false);
const malformedResearch = JSON.parse(before);
Object.assign(malformedResearch.notes[0], { title: 1, bodyFormat: 'quill-delta-v1', bodyDelta: null });
Object.assign(malformedResearch.archiveFiles[0], { name: ' ', sizeBytes: -1, linkedSourceIds: [] });
Object.assign(malformedResearch.sources[0], { title: '', category: 'invalid-category', placeId: 'missing-source-place' });
malformedResearch.archiveFiles[0].personRegions = { silver: { x: -1, y: 0, width: 1, height: 1 } };
const researchErrors = context.prepareProjectDraft(project, malformedResearch).errors;
for (const diagnostic of ['.title must be text', 'matching note body format', '.name must be nonempty text',
    '.sizeBytes must be a nonnegative integer', 'retired field linkedSourceIds', 'category must be a supported Source category', 'placeId references missing places/missing-source-place', '.personRegions.silver must be within the Archive image'])
    assert.ok(researchErrors.some(error => error.includes(diagnostic)), diagnostic);
const invalidEvidence = JSON.parse(before);
invalidEvidence.archiveFiles[0].linkedEventIds.push('missing-event');
const rejectedEvidence = context.prepareProjectDraft(project, invalidEvidence);
assert.ok(rejectedEvidence.errors.some(error => error.includes('linkedEventIds references missing events/missing-event')));
assert.equal(Object.hasOwn(rejectedEvidence, 'records'), false);
assert.ok(invalidEvidence.archiveFiles[0].linkedEventIds.includes('missing-event'));
assert.equal(context.prepareProjectDraft(project, { events: [] }).errors.length, 1);
for (const invalid of [new Map(), new Date(), new Set()])
{
    const invalidDraft = context.prepareProjectDraft(project, invalid);
    assert.ok(invalidDraft.errors.includes('Project collections must be an object.'));
    assert.equal(Object.hasOwn(invalidDraft, 'records'), false);
}
const circularDraftValue = {};
circularDraftValue.self = circularDraftValue;
for (const invalidValue of [new Map(), new Date(), Infinity, undefined, circularDraftValue, Array(2)])
{
    const malformedDraft = context.prepareProjectDraft({ ...project, metadata: invalidValue }, {});
    assert.ok(malformedDraft.errors[0].includes('project.metadata'));
    assert.equal(Object.hasOwn(malformedDraft, 'records'), false);
}
let deeplyNested = {};
for (let level = 0; level < 65; level++) deeplyNested = { nested: deeplyNested };
assert.ok(context.prepareProjectDraft({ ...project, metadata: deeplyNested }, {}).errors[0].includes('64 nested levels'));
class InvalidProject {}
assert.ok(context.prepareProjectDraft(Object.assign(new InvalidProject(), project), {}).errors.length);
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
const malformedProject = context.prepareProjectDraft({ ...project, defaultPersonId: false, desc: 42, files: 5, modifiedAt: 'invalid', created: 'old date' }, {});
for (const message of ['defaultPersonId must be a record ID', 'desc must be text', 'retired counter files', 'modifiedAt must be a valid timestamp', 'retired display date created'])
    assert.ok(malformedProject.errors.some(error => error.includes(message)));
const malformedMedia = JSON.parse(before);
for (const collection of ['albums', 'archiveFolders', 'noteCollections', 'boardCollections'])
    malformedMedia[collection][0].name = '';
malformedMedia.media[0].width = -1;
malformedMedia.media[0].personRegions['missing-person'] = { x: 0, y: 0, width: 2, height: 1 };
const mediaErrors = context.prepareProjectDraft(project, malformedMedia).errors;
for (const collection of ['albums', 'archiveFolders', 'noteCollections', 'boardCollections'])
    assert.ok(mediaErrors.includes(collection + '/' + malformedMedia[collection][0].id + '.name must be nonempty text.'));
for (const diagnostic of ['.name must be nonempty text', '.width has an invalid numeric value',
    'personRegions references missing people/missing-person', '.personRegions.missing-person must be within the photo'])
    assert.ok(mediaErrors.some(error => error.includes(diagnostic)), diagnostic);
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
const coverPhotoId = metadataOnly.media[0].id;
const coverProject = { ...project, cover: 'photo', coverPhotoId };
const restoredCover = context.prepareProjectDraft(coverProject, metadataOnly);
assert.deepEqual(Array.from(restoredCover.errors), []);
assert.equal(restoredCover.project.coverPhotoId, coverPhotoId);
assert.equal(Object.hasOwn(restoredCover.records.media.find(photo => photo.id === coverPhotoId), 'src'), false);
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
restored.places[0] = { ...originalPlace, parentId: originalPlace.id };
assert.ok(context.validateProjectDraft(project, restored).some(error =>
    error.includes('contains unsupported field parentId')));
restored.places[0] = originalPlace;
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
const invalidEducation = { ...originalAttributes[0], type: 'School', agency: 'School name', institutionName: 123 };
person.attributes = [invalidEducation];
const educationErrors = context.validateProjectDraft(project, restored);
for (const message of ['retired attribute field agency', 'retired education field type', '.institutionName must be text'])
    assert.ok(educationErrors.some(error => error.includes(message)));
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
baptism.type = 'BAPM';
assert.ok(context.validateProjectDraft(project, restored).some(error => error.includes('retired person event field type')));
delete baptism.type;
const beforeFactRead = JSON.stringify(person);
assert.equal(context.personAttributeByTag(person, 'EDUC'), person.attributes[0]);
assert.equal(context.personEventByTag(person, 'BAPM'), null);
assert.equal(JSON.stringify(person), beforeFactRead);
const personForEvent = structuredClone(person);
const savedBaptism = context.upsertPersonEvent(personForEvent, 'BAPM', { date: baptism.date });
assert.equal(savedBaptism.gedcomTag, 'BAPM');
assert.equal(Object.hasOwn(savedBaptism, 'type'), false);

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

const assignedFamily = { ...union, partnerBId: '', partnerBRoleHint: '' };
assert.equal(context.assignParentToFamily(assignedFamily, 'luna'), true);
assert.equal(assignedFamily.partnerBId, 'luna');
assert.equal(assignedFamily.partnerBRoleHint, 'WIFE');
assert.equal(Object.hasOwn(assignedFamily, 'partner2RoleHint'), false);
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
vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/modules/geneograph/geneograph-relationships.js'), 'utf8'), context);
const mixedTreeFamily = { ...union, parentChildTypes: { 'silver|oliver': 'Adoptive', 'luna|oliver': 'Guardian' } };
const mixedBoardFamily = { partnerIds: ['board-silver', 'board-luna'],
    children: [{ personId: 'board-oliver', parentageType: 'unknown',
        parentChildTypes: { 'board-silver': 'step', 'board-luna': 'guardian' } }] };
const parentageRows = context.geneoReviewRelationshipFields(
    { type: 'child', ids: ['board-silver', 'board-luna', 'board-oliver'] },
    mixedBoardFamily, mixedTreeFamily, ['silver', 'luna', 'oliver']);
assert.equal(parentageRows.length, 1);
assert.equal(parentageRows[0].tree, 'Adoptive');
parentageRows[0].write(mixedBoardFamily, parentageRows[0].tree, 'tree');
assert.equal(mixedBoardFamily.children[0].parentChildTypes['board-silver'], 'adoptive');
assert.equal(mixedBoardFamily.children[0].parentChildTypes['board-luna'], 'guardian');
const cutDiagram = { families: [structuredClone(mixedBoardFamily)], connections: [] };
context.selectedGeneographDiagram = () => cutDiagram;
context.geneoDetachCutPeople(new Set(['board-silver']));
assert.deepEqual(Array.from(cutDiagram.families[0].partnerIds), ['board-luna']);
assert.equal(cutDiagram.families[0].children[0].parentageType, 'guardian');
assert.equal(Object.hasOwn(cutDiagram.families[0].children[0], 'parentChildTypes'), false);
const malformedBoard = JSON.parse(before);
Object.assign(malformedBoard.boards[0], { title: '', modifiedAt: 'invalid', modified: 'Just now' });
malformedBoard.boards[0].diagram.canvas.gridVisible = true;
(malformedBoard.boards[0].diagram.nodes[0].appearance ||= {}).strokeColor = '#FFFFFF';
malformedBoard.boards[0].diagram.connectionDefaults.color = '#FFFFFF';
const boardMetadataErrors = context.prepareProjectDraft(project, malformedBoard).errors;
for (const diagnostic of ['.title must be nonempty text', '.modifiedAt must be a valid timestamp', 'retired display date modified', 'canvas contains retired field gridVisible', 'retired paint field strokeColor', 'retired paint field color'])
    assert.ok(boardMetadataErrors.some(error => error.includes(diagnostic)), diagnostic);
const invalidBoardDraft = JSON.parse(before);
const cyclicDiagram = invalidBoardDraft.boards[0].diagram;
const [cycleParent, cycleChild] = cyclicDiagram.people;
cyclicDiagram.families.push(
    { id: 'board-cycle-a', partnerIds: [cycleParent.id], children: [{ personId: cycleChild.id }], events: [] },
    { id: 'board-cycle-b', partnerIds: [cycleChild.id], children: [{ personId: cycleParent.id }], events: [] });
assert.ok(context.prepareProjectDraft(project, invalidBoardDraft).errors.some(error =>
    error.includes('has a parent cycle involving')));
cyclicDiagram.families.splice(-2);
const invalidEventFamily = invalidBoardDraft.boards[0].diagram.families[0];
invalidEventFamily.events.push({ ...union.events[0], placeId: 'missing-family-place' });
assert.ok(context.prepareProjectDraft(project, invalidBoardDraft).errors.some(error =>
    error.includes('.placeId references missing Place missing-family-place')));
invalidEventFamily.events.pop();
const eventWithPlace = { ...union.events[0], placeId: 'merged-place', placeText: '' };
const birthplace = { placeId: 'merged-place', placeText: '' };
const placeBoard = { diagram: { people: [{ birth: birthplace }], families: [{ events: [eventWithPlace] }] } };
const oldPlace = { id: 'merged-place', name: 'Old place' };
const newPlace = { id: 'retained-place', name: 'Retained place' };
assert.equal(context.updateBoardFactPlaceReferences(placeBoard, oldPlace, newPlace), true);
assert.equal(birthplace.placeId, newPlace.id);
assert.equal(eventWithPlace.placeId, newPlace.id);
assert.equal(context.updateBoardFactPlaceReferences(placeBoard, newPlace), true);
assert.equal(eventWithPlace.placeId, null);
assert.equal(birthplace.placeText, newPlace.name);
const invalidEdgeDiagram = invalidBoardDraft.boards[0].diagram;
const invalidEdge = invalidEdgeDiagram.connections.find(connection => connection.kind === 'family-partner');
const originalEdgeTarget = invalidEdge.target;
invalidEdge.target = { ...invalidEdge.target, nodeId: invalidEdge.source.nodeId };
assert.ok(context.prepareProjectDraft(project, invalidBoardDraft).errors.some(error =>
    error.includes('endpoints must match the recorded family members')));
invalidEdge.target = originalEdgeTarget;
const invalidBoardPerson = invalidBoardDraft.boards[0].diagram.people[0];
const boardLivingStatus = invalidBoardPerson.livingStatus;
delete invalidBoardPerson.livingStatus;
invalidBoardPerson.sex = invalidBoardPerson.gender;
invalidBoardPerson.displayName = 'Legacy name';
const identityErrors = context.prepareProjectDraft(project, invalidBoardDraft).errors;
assert.ok(identityErrors.some(error => error.includes('.livingStatus must be')));
assert.ok(identityErrors.some(error => error.includes('requires a canonical gender')));
invalidBoardPerson.livingStatus = boardLivingStatus;
assert.ok(identityErrors.some(error => error.includes('cannot contain displayName')));
delete invalidBoardPerson.sex;
delete invalidBoardPerson.displayName;
const originalBoardBirth = invalidBoardPerson.birth;
invalidBoardPerson.birth = { ...originalBoardBirth, placeId: 'missing-board-birthplace' };
assert.ok(context.prepareProjectDraft(project, invalidBoardDraft).errors.some(error =>
    error.includes('.birth.placeId references missing ID missing-board-birthplace')));
invalidBoardPerson.birth = '1900';
assert.ok(context.prepareProjectDraft(project, invalidBoardDraft).errors.some(error =>
    error.includes('.birth must contain a structured genealogy date')));
invalidBoardPerson.birth = originalBoardBirth;
const invalidPlaceNode = invalidBoardDraft.boards[0].diagram.nodes.find(node => node.type === 'place');
invalidPlaceNode.placeId = invalidPlaceNode.placeRef.id;
assert.ok(context.prepareProjectDraft(project, invalidBoardDraft).errors.some(error =>
    error.includes('contains retired place field placeId')));
delete invalidPlaceNode.placeId;
const boardMembership = invalidBoardDraft.boards[0].diagram.families.find(family => family.children.length).children[0];
boardMembership.parentChildTypes = { 'missing-board-parent': 'adoptive' };
assert.ok(context.prepareProjectDraft(project, invalidBoardDraft).errors.some(error =>
    error.includes('parentChildTypes must map member parent IDs')));
const createdUnion = context.geneoReviewNewFamily('new-sync-union', project.id, ['silver', 'luna']);
const syncDraftInput = JSON.parse(before);
context.geneoReviewCopyRelationship(union, createdUnion);
assert.equal(createdUnion.events[0].placeId, union.events[0].placeId);
assert.equal(createdUnion.events[0].date.originalText, union.events[0].date.originalText);
assert.equal(Object.hasOwn(createdUnion, 'startPlaceId'), false);
const blankSource = { ...union, events: [] };
const blankDestination = context.geneoReviewNewFamily('blank-sync-union', project.id, ['silver', 'luna']);
context.geneoReviewCopyRelationship(blankSource, blankDestination);
assert.equal(blankDestination.events.length, 0);
const flattened = { ...union.events[0], date: null, dateLabel: '18 Aug 2023', sortDate: '20230818' };
const flattenedCopy = context.geneoReviewRelationshipData({ ...union, events: [flattened] });
assert.equal(flattenedCopy.events[0].date.state, 'empty');
const comparison = context.geneoReviewRelationshipFields(
    { type: 'partner' }, { ...union, events: [flattened] },
    { ...union, events: [{ ...union.events[0], date: context.emptyGenealogyDate('Exact date') }] }, []);
assert.equal(comparison.some(row => row.label === 'Date'), false);
const engagement = { ...union.events[0], id: 'engagement', gedcomTag: 'ENGA', eventType: 'Engagement', typeLabel: '' };
context.geneoReviewCopyRelationship({ ...union, events: [union.events[0], engagement] }, blankDestination);
assert.deepEqual(Array.from(blankDestination.events, event => event.gedcomTag), ['MARR', 'ENGA']);

const repeatedMarriage = { ...union, events: [
    union.events[0],
    { ...union.events[0], id: 'second-marriage' }
] };
const firstCopiedId = createdUnion.events[0].id;
context.geneoReviewCopyRelationship(repeatedMarriage, createdUnion);
assert.equal(createdUnion.events.length, 2);
assert.equal(new Set(createdUnion.events.map(event => event.id)).size, 2);
assert.ok(createdUnion.events.some(event => event.id === firstCopiedId));
context.geneoReviewCopyRelationship(repeatedMarriage, createdUnion);
assert.equal(createdUnion.events.length, 2);
syncDraftInput.families.push(createdUnion);
const marriageIds = createdUnion.events.map(event => 'event-' + createdUnion.id + '-' + event.id);
syncDraftInput.archiveFiles[0].linkedEventIds.push(marriageIds[0]);
(syncDraftInput.notes[0].linkedEventIds ||= []).push(marriageIds[1]);
marriageIds.forEach((targetId, index) => syncDraftInput.sourceLinks.push({
    id: 'sync-marriage-evidence-' + index, projectId: project.id,
    sourceId: syncDraftInput.sources[0].id, targetType: 'event', targetId
}));
for (let pass = 0; pass < 2; pass++)
{
    const roundTrip = context.prepareProjectDraft(project, syncDraftInput);
    assert.deepEqual(Array.from(roundTrip.errors), []);
    for (const id of marriageIds)
    {
        assert.ok(roundTrip.records.events.some(event => event.id === id));
        assert.ok(roundTrip.records.sourceLinks.some(link => link.targetId === id));
    }
    assert.ok(roundTrip.records.archiveFiles[0].linkedEventIds.includes(marriageIds[0]));
    assert.ok(roundTrip.records.notes[0].linkedEventIds.includes(marriageIds[1]));
    createdUnion.events.reverse();
}
assert.deepEqual(Array.from(context.prepareProjectDraft(project, syncDraftInput).errors), []);
createdUnion.nonEvents = [];
assert.ok(context.prepareProjectDraft(project, syncDraftInput).errors.some(error => error.includes('retired field nonEvents')));
const parentChoice = { type: 'child', treeIds: ['silver', 'oliver'] };
const oneParent = { ...secondUnion, id: 'single-parent-union', partnerBId: '', events: [] };
sample.families.push(secondUnion, oneParent);
assert.equal(context.singleParentFamilyWithChildrenForPerson('silver').id, oneParent.id);
sample.families.push({ ...oneParent, id: 'second-single-parent-union' });
assert.equal(context.singleParentFamilyWithChildrenForPerson('silver'), null);
sample.families.pop();
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
const extraParent = { ...structuredClone(sample.people[0]), id: 'test-additional-parent' };
sample.people.push(extraParent);
const outsidePerson = { ...extraParent, id: 'outside-person', projectId: 'another-project' };
sample.people.push(outsidePerson);
assert.equal(context.validateParentChildConnection(outsidePerson.id, 'oliver').ok, false);
assert.equal(context.validatePartnerConnection(outsidePerson.id, 'oliver').ok, false);
sample.people.pop();
const soloA = { ...structuredClone(oneParent), id: 'existing-solo-a',
    childIds: ['oliver'], parentChildTypes: { 'silver|oliver': 'Guardian' } };
const soloB = { ...structuredClone(soloA), id: 'existing-solo-b',
    partnerAId: 'luna', parentChildTypes: { 'luna|oliver': 'Adoptive' } };
sample.families.push(soloA, soloB);
const beforeAddingParent = JSON.stringify([soloA, soloB]);
const parentResult = context.connectPeopleByRelationship({
    anchorPersonId: 'oliver', relativePersonId: extraParent.id, relationshipType: 'parent', detailType: 'Foster'
});
assert.equal(parentResult.ok, true, JSON.stringify(parentResult));
assert.equal(JSON.stringify([soloA, soloB]), beforeAddingParent);
assert.deepEqual(Array.from(parentResult.family.childIds), ['oliver']);
assert.equal(parentResult.family.parentChildTypes[extraParent.id + '|oliver'], 'Foster');
assert.equal(context.findOrCreateSingleParentFamily('silver'), soloA);
const anotherSilverFamily = { ...structuredClone(soloA), id: 'another-silver-family' };
sample.families.push(anotherSilverFamily);
const existingFamilyIds = new Set(sample.families.map(family => family.id));
const separateSolo = context.findOrCreateSingleParentFamily('silver');
assert.equal(existingFamilyIds.has(separateSolo.id), false);
assert.equal(separateSolo.childIds.length, 0);
assert.equal(soloA.parentChildTypes['silver|oliver'], 'Guardian');
assert.equal(anotherSilverFamily.parentChildTypes['silver|oliver'], 'Guardian');
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
