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
    'shared/person-name-helpers', 'shared/media-and-album-model', 'shared/relationships', 'modules/family-tree/relationships', 'shared/tree-seed-model',
    'modules/people/person-form-fields', 'modules/people/person-editor', 'shared/date-and-place-fields',
    'modules/archive/archive-sources', 'seed/seed-archive-records', 'seed/seed-notes-records', 'seed/seed-geneograph-collections',
    'modules/albums/photo-layout-and-crop', 'modules/albums/person-photo',
    'modules/geneograph/geneograph-runtime', 'modules/geneograph/geneograph-model',
    'modules/geneograph/geneograph-editor-core', 'modules/geneograph/geneograph-theme-board', 'modules/geneograph/geneograph-sidebar',
    'modules/geneograph/geneograph-board-files', 'modules/geneograph/geneograph-pickers', 'modules/geneograph/geneograph-shadow',
    'assets/boards/whiskerfield-tree-research', 'seed/seed-boards', 'core/validation',
    'modules/people/relationship-editor', 'modules/people/controls', 'modules/publish/drafts-model'
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
function readJpegDimensions(filename)
{
    const bytes = fs.readFileSync(filename);
    assert.equal(bytes.readUInt16BE(0), 0xffd8);
    let index = 2;
    while (index < bytes.length - 8)
    {
        if (bytes[index++] !== 0xff) continue;
        while (bytes[index] === 0xff) index++;
        const marker = bytes[index++];
        if (marker === 0xd9 || marker === 0xda) break;
        if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
        const size = bytes.readUInt16BE(index);
        if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker))
            return { width: bytes.readUInt16BE(index + 5), height: bytes.readUInt16BE(index + 3) };
        assert.ok(size >= 2, 'Invalid JPEG section length');
        index += size;
    }
    throw new Error('No JPEG frame dimensions: ' + filename);
}
for (const photo of sample.media)
{
    const filename = path.join(sourceDirectory, photo.src);
    assert.equal(fs.statSync(filename).size, photo.sizeBytes, photo.id + ' file size');
    // The >1 MiB grandparents image's dimensions require separate verification.
    if (photo.id !== 'photo-grandparents-garden')
        assert.deepEqual(readJpegDimensions(filename), { width: photo.width, height: photo.height }, photo.id);
}
assert.equal(fs.statSync(path.join(sourceDirectory, 'assets/documents/silver_luna_marriage_packet.pdf')).size, 6723);
assert.equal(sample.media.find(photo => photo.id === 'photo-family-table').date.first.year, 2010);
const startupEvidence = JSON.stringify([sample.sourceLinks, sample.archiveFiles, sample.notes]);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/seed/seed-genealogy.js'), 'utf8'), context);
assert.equal(JSON.stringify([sample.sourceLinks, sample.archiveFiles, sample.notes]), startupEvidence);
assert.ok(sample.events.length > 0);
const project = sample.projects[0];
const seededBoard = sample.boards[0];
const seededCollections = sample.boardCollections;
const seededDiagram = seededBoard.diagram;
const seededBoardBeforeRefresh = JSON.stringify(seededBoard);
context.normalizeGeneographRuntimeData();
assert.equal(sample.boardCollections, seededCollections);
assert.equal(sample.boards[0], seededBoard);
assert.equal(seededBoard.diagram, seededDiagram);
assert.equal(JSON.stringify(seededBoard), seededBoardBeforeRefresh);
const paint = { color: '#336699', enabled: false, opacity: 60 };
const canvasAppearance = context.geneoAppearance({ stroke: paint },
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
const authoredBoardInput = JSON.parse(before);
const authoredBoardAsset = context.window.GENEO_SEED_BOARD_ASSETS[0];
const authoredBoardRecord = authoredBoardInput.boards.find(board => board.id === authoredBoardAsset.id);
authoredBoardRecord.diagram = structuredClone(authoredBoardAsset.payload.board.diagram);
const directlyAuthoredBoard = context.prepareProjectDraft(project, authoredBoardInput);
assert.deepEqual(Array.from(directlyAuthoredBoard.errors), []);
assert.equal(JSON.stringify(directlyAuthoredBoard.records.boards.find(board => board.id === authoredBoardAsset.id).diagram),
    JSON.stringify(authoredBoardAsset.payload.board.diagram));
context.geneoApplyThemeDefaultsToDiagram(authoredBoardRecord.diagram);
assert.equal(JSON.stringify(authoredBoardRecord.diagram), JSON.stringify(seededDiagram));
const normalizedBoardInput = JSON.parse(before);
const boardForNormalization = normalizedBoardInput.boards[0];
const membershipBeforeNormalization = JSON.stringify(boardForNormalization.diagram.families.map(family =>
    [family.id, family.partnerIds, family.children]));
const cardGeometry = board => JSON.stringify(board.diagram.nodes.filter(node => node.type === 'person')
    .map(node => [node.id, node.x, node.y, node.width, node.height]));
const geometryBeforeNormalization = cardGeometry(boardForNormalization);
context.normalizeGeneographBoardRecord(boardForNormalization);
assert.equal(JSON.stringify(boardForNormalization.diagram.families.map(family =>
    [family.id, family.partnerIds, family.children])), membershipBeforeNormalization);
assert.equal(cardGeometry(boardForNormalization), geometryBeforeNormalization);
assert.deepEqual(Array.from(context.prepareProjectDraft(project, normalizedBoardInput).errors), []);

const draftInput = JSON.parse(before);
const draftProject = structuredClone(project);
const projectBeforePreparation = JSON.stringify(draftProject);
const prepared = context.prepareProjectDraft(draftProject, draftInput);
assert.deepEqual(Array.from(prepared.errors), []);
assert.ok(prepared.records.events.length);
const { events: preparedTimeline, ...preparedAuthored } = prepared.records;
assert.equal(JSON.stringify(preparedAuthored), before);
assert.equal(JSON.stringify(preparedTimeline), JSON.stringify(sample.events));
assert.equal(JSON.stringify(draftInput), before);
assert.equal(JSON.stringify(prepared.project), projectBeforePreparation);
assert.equal(JSON.stringify(draftProject), projectBeforePreparation);
assert.notEqual(prepared.project, draftProject);
assert.notEqual(prepared.records.people[0], draftInput.people[0]);
assert.notEqual(prepared.records.boards[0].diagram.nodes, draftInput.boards[0].diagram.nodes);
const malformedVitalDateInput = JSON.parse(before);
const badVitalPerson = malformedVitalDateInput.people[0];
badVitalPerson.birth.first.aliasYear = 1998;
badVitalPerson.birth.placeText = false;
const malformedVitalDate = context.prepareProjectDraft(project, malformedVitalDateInput);
for (const field of ['birth.first.aliasYear', 'birth.placeText'])
    assert.ok(malformedVitalDate.errors.some(error => error.includes('people/' + badVitalPerson.id + '.' + field)));
assert.equal(Object.hasOwn(malformedVitalDate, 'records'), false);
const unknownOuterDateFields = JSON.parse(before);
unknownOuterDateFields.people[0].birth.unsupportedYear = 1999;
unknownOuterDateFields.media[0].date.unsupportedFlag = true;
unknownOuterDateFields.archiveFiles[0].documentDate.unexpectedNote = 'extra';
const outerDateErrors = context.prepareProjectDraft(project, unknownOuterDateFields).errors;
for (const field of ['people/' + unknownOuterDateFields.people[0].id + '.birth.unsupportedYear',
    'media/' + unknownOuterDateFields.media[0].id + '.date.unsupportedFlag',
    'archiveFiles/' + unknownOuterDateFields.archiveFiles[0].id + '.documentDate.unexpectedNote'])
    assert.ok(outerDateErrors.some(error => error.includes(field + ' is unexpected.')), field);
const extraRegionFields = JSON.parse(before);
extraRegionFields.media[0].personRegions.silver.unknownTag = true;
extraRegionFields.archiveFiles[0].personRegions.barnaby.unknownTag = true;
const regionErrors = context.prepareProjectDraft(project, extraRegionFields).errors;
for (const field of ['media/' + extraRegionFields.media[0].id + '.personRegions.silver.unknownTag',
    'archiveFiles/' + extraRegionFields.archiveFiles[0].id + '.personRegions.barnaby.unknownTag'])
    assert.ok(regionErrors.some(error => error.includes(field + ' is unexpected.')), field);
const malformedNestedDateReference = JSON.parse(before);
const datedPhoto = malformedNestedDateReference.media.find(photo => photo.date);
datedPhoto.date.placeId = { toString: false };
assert.ok(context.prepareProjectDraft(project, malformedNestedDateReference).errors.some(error =>
    error.startsWith('media/' + datedPhoto.id + '.date.placeId must be a nonempty record ID')));
const collectionShapeInput = JSON.parse(before);
const collectionShapeCases = Object.entries(collectionShapeInput).filter(([, rows]) => rows.length);
for (const [, rows] of collectionShapeCases)
    rows[0].unexpectedContractField = true;
const collectionShapeDraft = context.prepareProjectDraft(project, collectionShapeInput);
for (const [collection, rows] of collectionShapeCases)
    assert.ok(collectionShapeDraft.errors.includes(collection + '/' + rows[0].id + '.unexpectedContractField is unexpected.'), collection);
assert.equal(Object.hasOwn(collectionShapeDraft, 'records'), false);
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
const invalidFactPlace = JSON.parse(before);
const factPlaceOwner = invalidFactPlace.people[0];
factPlaceOwner.attributes[0].placeId = false;
const invalidFactPlaceDraft = context.prepareProjectDraft(project, invalidFactPlace);
assert.ok(invalidFactPlaceDraft.errors.some(error => error.includes('people/' + factPlaceOwner.id + '.attributes[0].placeId')));
assert.equal(Object.hasOwn(invalidFactPlaceDraft, 'records'), false);

const malformedFactFields = JSON.parse(before);
const factOwner = malformedFactFields.people[0];
Object.assign(factOwner.attributes[0], { notes: { text: 'Invalid' }, citations: false, unexpectedField: true });
factOwner.events.push({ id: 'invalid-event-type', gedcomTag: 'BAPM', eventType: [] });
const malformedFactDraft = context.prepareProjectDraft(project, malformedFactFields);
for (const field of ['attributes[0].notes', 'attributes[0].citations', 'events[' + (factOwner.events.length - 1) + '].eventType'])
    assert.ok(malformedFactDraft.errors.some(error => error.includes('people/' + factOwner.id + '.' + field)));
assert.ok(malformedFactDraft.errors.some(error => error.includes('people/' + factOwner.id + '.attributes[0]') && error.includes('unexpectedField')));
assert.equal(Object.hasOwn(malformedFactDraft, 'records'), false);

const obsoleteArchivePlace = JSON.parse(before);
obsoleteArchivePlace.archiveFiles[0].documentPlaceText = 'Legacy name';
assert.ok(context.prepareProjectDraft(project, obsoleteArchivePlace).errors.some(error =>
    error.includes('archiveFiles/' + obsoleteArchivePlace.archiveFiles[0].id + '.documentPlaceText is unexpected.')));
const malformedResearch = JSON.parse(before);
Object.assign(malformedResearch.notes[0], { title: 1, bodyFormat: 'quill-delta-v1', bodyDelta: null });
Object.assign(malformedResearch.archiveFiles[0], { name: ' ', sizeBytes: -1, linkedSourceIds: [] });
Object.assign(malformedResearch.sources[0], { title: '', category: 'invalid-category', placeId: 'missing-source-place' });
malformedResearch.archiveFiles[0].personRegions = { silver: { x: -1, y: 0, width: 1, height: 1 } };
const researchErrors = context.prepareProjectDraft(project, malformedResearch).errors;
for (const diagnostic of ['.title must be text', 'matching rich-text format', '.name must be nonempty text',
    '.sizeBytes must be a nonnegative integer', 'retired field linkedSourceIds', 'category must be a supported Source category', 'placeId references missing places/missing-source-place', '.personRegions.silver must be within the Archive image'])
    assert.ok(researchErrors.some(error => error.includes(diagnostic)), diagnostic);
const invalidEvidence = JSON.parse(before);
invalidEvidence.archiveFiles[0].linkedEventIds.push('missing-archive-event');
invalidEvidence.notes[0].linkedEventIds.push('missing-note-event');
invalidEvidence.sourceLinks.push({ id: 'bad-source-timeline-link', projectId: project.id,
    sourceId: invalidEvidence.sources[0].id, targetType: 'event', targetId: 'missing-source-event' });
const invalidEvidenceBefore = JSON.stringify(invalidEvidence);
const rejectedEvidence = context.prepareProjectDraft(project, invalidEvidence);
for (const diagnostic of [
    'archiveFiles/' + invalidEvidence.archiveFiles[0].id + '.linkedEventIds references missing events/missing-archive-event',
    'notes/' + invalidEvidence.notes[0].id + '.linkedEventIds references missing events/missing-note-event',
    'sourceLinks/bad-source-timeline-link.targetId references missing events/missing-source-event'
]) assert.ok(rejectedEvidence.errors.includes(diagnostic), diagnostic);
assert.equal(Object.hasOwn(rejectedEvidence, 'records'), false);
assert.equal(JSON.stringify(invalidEvidence), invalidEvidenceBefore);
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
const blankBoardProject = { id: 'blank-board-project', name: 'Blank board project' };
const blankBoard = { id: 'blank-board', projectId: blankBoardProject.id, title: 'Blank board', description: '',
    createdAt: project.createdAt, modifiedAt: project.modifiedAt, collectionIds: [], favorite: false, archived: false,
    diagram: context.createEmptyGeneographDiagram() };
assert.deepEqual(Array.from(context.prepareProjectDraft(blankBoardProject, { boards: [blankBoard] }).errors), []);
const restored = JSON.parse(before);
const rebuiltEvents = context.buildSampleEvents(restored);
assert.equal(JSON.stringify(restored), before, "Timeline reconstruction must not modify canonical records.");
restored.events = rebuiltEvents;
assert.deepEqual(Array.from(context.validateProjectDraft(project, restored)), []);
assert.equal(JSON.stringify(authored), before);
assert.ok(context.validateProjectDraft({ ...project, coverPhotoId: 'missing-cover' }, restored).some(error => error.includes('Project cover photo is missing')));
const badCover = context.prepareProjectDraft({ ...project, cover: 'unknown', coverPosition: { x: '5', y: 101 },
    coverImageSrc: false, thumb: 'unexpected' }, {});
for (const field of ['project.cover must identify', 'project.coverPosition requires',
    'project.coverImageSrc must be text', 'project.thumb is unexpected'])
    assert.ok(badCover.errors.some(error => error.includes(field)), field);
assert.deepEqual(Array.from(context.prepareProjectDraft(
    { id: 'positioned', name: 'Positioned', cover: 'photo', coverPosition: { x: 0, y: 100 } }, {}).errors), []);
const malformedProject = context.prepareProjectDraft({ ...project, defaultPersonId: false, desc: 42, files: 5, modifiedAt: 'invalid', created: 'old date' }, {});
for (const message of ['defaultPersonId must be a record ID', 'desc must be text', 'retired counter files', 'modifiedAt must be a valid timestamp', 'retired display date created'])
    assert.ok(malformedProject.errors.some(error => error.includes(message)));
const gardenPhoto = authored.media.find(photo => photo.id === 'photo-grandparents-garden');
assert.equal(context.formatGenealogyDateLabel(gardenPhoto.date), 'Between 1970 and 1975');
assert.equal(context.formatPhotoDate(gardenPhoto), '1970 - 1975');
assert.equal(context.photoDateModel({ date: { fromDate: '1970', toDate: '1975' } }).state, 'empty');
const malformedMedia = JSON.parse(before);
for (const collection of ['albums', 'archiveFolders', 'noteCollections', 'boardCollections'])
    malformedMedia[collection][0].name = '';
malformedMedia.media[0].width = -1;
malformedMedia.media[0].date.fromDate = '1998';
malformedMedia.media[0].personRegions['missing-person'] = { x: 0, y: 0, width: 2, height: 1 };
const mediaErrors = context.prepareProjectDraft(project, malformedMedia).errors;
for (const collection of ['albums', 'archiveFolders', 'noteCollections', 'boardCollections'])
    assert.ok(mediaErrors.includes(collection + '/' + malformedMedia[collection][0].id + '.name must be nonempty text.'));
for (const diagnostic of ['.name must be nonempty text', '.width has an invalid numeric value', 'contains retired photo range fields',
    'personRegions references missing people/missing-person', '.personRegions.missing-person must be within the photo'])
    assert.ok(mediaErrors.some(error => error.includes(diagnostic)), diagnostic);
const invalidAncillary = JSON.parse(before);
invalidAncillary.links.push({ id: 'bad-link', projectId: project.id, fromType: 'person',
    fromId: 'missing-person', toType: 'unsupported', toId: 'missing-file', label: 6 });
invalidAncillary.placeSavedFilters[0].filters.mapped = false;
invalidAncillary.placeSavedFilters[0].filters.extra = 'unexpected';
invalidAncillary.placeIssues.push({ id: 'bad-place-issue', projectId: project.id, placeId: 'place-pawford',
    otherPlaceId: 'place-pawford', type: 'possible_duplicate', status: 'pending', fingerprints: {} });
invalidAncillary.publishDrafts[0].details = [false];
invalidAncillary.publishDrafts[0].legacyScope = 'old scope';
invalidAncillary.publishDrafts[0].focusPersonId = 'missing-person';
const ancillaryErrors = context.prepareProjectDraft(project, invalidAncillary).errors;
for (const field of ['links/bad-link.fromId', 'links/bad-link.toType', 'links/bad-link.label',
    '.filters.mapped', '.filters.extra', '.details must be an array of text', 'legacyScope', '.focusPersonId references missing',
    'bad-place-issue.otherPlaceId', 'bad-place-issue.status', 'bad-place-issue.fingerprints'])
    assert.ok(ancillaryErrors.some(error => error.includes(field)), field);
const invalidNestedEvidence = JSON.parse(before);
invalidNestedEvidence.sourceLinks[0].extra = true;
invalidNestedEvidence.notes[0].checklist = [
    { id: 'same', text: 'Check record', done: true },
    { id: 'same', text: 10, done: 'false', obsolete: true }
];
const nestedEvidenceErrors = context.prepareProjectDraft(project, invalidNestedEvidence).errors;
for (const field of ['.extra is unexpected', '.checklist[1].id', '.checklist[1].text', '.checklist[1].done', '.checklist[1].obsolete'])
    assert.ok(nestedEvidenceErrors.some(error => error.includes(field)), field);
const malformedNoteRecord = JSON.parse(before);
const invalidNote = malformedNoteRecord.notes[0];
delete invalidNote.linkedPlaceIds;
invalidNote.tags = [null];
invalidNote.extra = 'unexpected';
const noteShapeErrors = context.prepareProjectDraft(project, malformedNoteRecord).errors;
for (const diagnostic of ['.linkedPlaceIds is required', '.tags must be an array of nonempty text', '.extra is unexpected'])
    assert.ok(noteShapeErrors.some(error => error.includes('notes/' + invalidNote.id + diagnostic)), diagnostic);
const malformedRichText = JSON.parse(before);
Object.assign(malformedRichText.notes[0], { bodyFormat: 'quill-delta-v1', bodyDelta: { ops: [
    { retain: 2 }, { insert: 'Text', attributes: { header: '3', background: 'red' } }
] } });
const richTextNode = malformedRichText.boards[0].diagram.nodes.find(node => node.textDelta?.ops.length);
richTextNode.textDelta.ops.push({ insert: { image: 'data' } });
const richTextErrors = context.prepareProjectDraft(project, malformedRichText).errors;
for (const field of ['.ops[0].retain', '.ops[1].attributes.header', '.ops[1].attributes.background',
    richTextNode.id + '.textDelta.ops['])
    assert.ok(richTextErrors.some(error => error.includes(field)), field);
const invalidArchiveShape = JSON.parse(before);
const wrongArchive = invalidArchiveShape.archiveFiles[0];
Object.assign(wrongArchive, { kind: 'folder', favorite: 1, previewUrl: null, anotherSize: '1 KB' });
delete wrongArchive.linkedNoteIds;
const archiveShapeErrors = context.prepareProjectDraft(project, invalidArchiveShape).errors;
for (const field of ['.kind is unsupported', '.favorite must be boolean', '.previewUrl must be text',
    '.linkedNoteIds is required', '.anotherSize is unexpected'])
    assert.ok(archiveShapeErrors.some(error => error.includes('archiveFiles/' + wrongArchive.id + field)), field);
const invalidPhotoShape = JSON.parse(before);
const malformedPhoto = invalidPhotoShape.media[0];
Object.assign(malformedPhoto, { caption: false, favorite: 0, src: {}, updatedAt: null, unknown: 1 });
delete malformedPhoto.albumIds;
const photoShapeErrors = context.prepareProjectDraft(project, invalidPhotoShape).errors;
for (const field of ['.caption must be text', '.favorite must be boolean', '.src must be text',
    '.updatedAt must be a valid timestamp', '.albumIds is required', '.unknown is unexpected'])
    assert.ok(photoShapeErrors.some(error => error.includes('media/' + malformedPhoto.id + field)), field);
const malformedPlaceShape = JSON.parse(before);
const badPlace = malformedPlaceShape.places.find(place => place.coordinates);
badPlace.coordinates.altitude = 5;
badPlace.createdAt = false;
badPlace.legacyName = 'Retired';
const placeShapeErrors = context.prepareProjectDraft(project, malformedPlaceShape).errors;
for (const field of ['.coordinates.altitude is unexpected', '.createdAt must be a valid timestamp', '.legacyName is unexpected'])
    assert.ok(placeShapeErrors.some(error => error.includes('places/' + badPlace.id + field)), field);
const unknownPersonFields = JSON.parse(before);
const malformedPerson = unknownPersonFields.people[0];
malformedPerson.counts = { notes: 1 };
malformedPerson.avatarClass = true;
malformedPerson.names.nickname = 'Unexpected';
malformedPerson.primaryPhotoId = false;
malformedPerson.primaryPhotoCrop = { centerX: 0.5, centerY: 0.5, zoom: 7, rotation: 0 };
malformedPerson.meta.placeholderRole = 'cousin';
malformedPerson.profile.alternativeNames = ['Name'];
const personShapeErrors = context.prepareProjectDraft(project, unknownPersonFields).errors;
for (const field of ['.counts is unexpected', '.avatarClass must be text', '.profile.alternativeNames must be text or null', '.names.nickname is unexpected', '.primaryPhotoId must be a nonempty record ID',
    '.primaryPhotoCrop requires valid', '.meta.placeholderRole must be mother or father'])
    assert.ok(personShapeErrors.some(error => error.includes('people/' + malformedPerson.id + field)), field);
const malformedFamilyShape = JSON.parse(before);
const malformedFamily = malformedFamilyShape.families[0];
Object.assign(malformedFamily, { relationshipType: true, relationshipStatus: 'pending', updatedAt: 'Just now', gedcomXref: 1, citations: false, importedPartner: 'unexpected' });
const familyShapeErrors = context.prepareProjectDraft(project, malformedFamilyShape).errors;
for (const field of ['.relationshipType is unsupported', '.relationshipStatus is unsupported',
    '.updatedAt must be a valid timestamp', '.gedcomXref must be text', '.citations must be an array', '.importedPartner is unexpected'])
    assert.ok(familyShapeErrors.some(error => error.includes('families/' + malformedFamily.id + field)), field);
const malformedContainers = JSON.parse(before);
malformedContainers.albums[0].description = false;
malformedContainers.archiveFolders[0].favorite = 'false';
delete malformedContainers.archiveFolders[0].parentId;
malformedContainers.noteCollections[0].outside = true;
malformedContainers.boardCollections[0].description = null;
Object.assign(malformedContainers.sources[0], { providedBy: {}, accessedDate: false, titleAlias: 'Retired' });
const containerErrors = context.prepareProjectDraft(project, malformedContainers).errors;
for (const field of ['.description must be text', '.favorite must be boolean', '.parentId is required',
    '.outside is unexpected', '.providedBy must be text', '.accessedDate', '.titleAlias is unexpected'])
    assert.ok(containerErrors.some(error => error.includes(field)), field);
const invalidTimestamps = JSON.parse(before);
delete invalidTimestamps.notes[0].createdAt;
invalidTimestamps.notes[0].updated = 'Just now';
invalidTimestamps.archiveFiles[0].updatedAt = 'invalid';
invalidTimestamps.archiveFiles[0].added = 'Just now';
const timestampErrors = context.prepareProjectDraft(project, invalidTimestamps).errors;
for (const message of ['.createdAt must be a valid timestamp', 'retired display date updated',
    '.updatedAt must be a valid timestamp', 'retired display date added'])
    assert.ok(timestampErrors.some(error => error.includes(message)), message);
const metadataOnly = JSON.parse(before);
for (const photo of metadataOnly.media) delete photo.src;
for (const file of metadataOnly.archiveFiles)
{
    delete file.assetUrl;
    delete file.previewUrl;
}
for (const board of metadataOnly.boards)
    for (const asset of board.diagram.assets) delete asset.src;
const invalidBoardAssetInput = structuredClone(metadataOnly);
const invalidBoardAsset = invalidBoardAssetInput.boards[0].diagram.assets[0];
Object.assign(invalidBoardAsset, { mimeType: 'text/plain', width: -1, src: false });
const invalidBoardAssetDraft = context.prepareProjectDraft(project, invalidBoardAssetInput);
for (const field of ['mimeType', 'width', 'src'])
    assert.ok(invalidBoardAssetDraft.errors.some(error => error.includes('.diagram.assets/' + invalidBoardAsset.id + '.' + field)));
assert.equal(Object.hasOwn(invalidBoardAssetDraft, 'records'), false);
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
metadataNode.photoId = 'duplicate-image-reference';
metadataNode.title = 'Duplicate image title';
const legacyImageErrors = context.validateProjectDraft(project, restoredMetadata.records);
for (const field of ['photoId', 'title'])
    assert.ok(legacyImageErrors.some(error => error.includes('retired image field ' + field)), field);
delete metadataNode.photoId;
delete metadataNode.title;
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
const invalidEducation = { ...originalAttributes[0], type: 'School', agency: 'School name', date: null, institutionName: 123 };
person.attributes = [invalidEducation];
const educationErrors = context.validateProjectDraft(project, restored);
for (const message of ['retired ranged attribute field date', 'retired attribute field agency', 'retired education field type', '.institutionName must be text'])
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
person.birth = { ...originalBirth, state: 'empty' };
assert.ok(context.validateProjectDraft(project, restored).some(error =>
    error.includes('.birth must contain a structured genealogy date')));
person.birth = { ...originalBirth, second: { ...originalBirth.first } };
assert.ok(context.validateProjectDraft(project, restored).some(error =>
    error.includes('.birth must contain a structured genealogy date')));
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
const originalEventCount = editedUnion.events.length;
for (const relationshipType of ['Partner', 'Engaged', 'Married'])
{
    context.upsertPartnerRelationshipEvents(editedUnion, { relationshipType,
        startDate: editedUnion.events[0].date, startPlace: {}
    }, { resolvePlace: () => ({ placeId: 'place-pawford', placeText: 'Pawford', address: '' }) });
    assert.equal(editedUnion.events.length, originalEventCount);
    assert.equal(editedUnion.events[0].id, editedEventId);
    assert.equal(editedUnion.events[0].gedcomTag, context.partnerRelationshipDefinition(relationshipType).startTag);
}
const ambiguousFamilyEvents = JSON.parse(before);
const roleFamily = ambiguousFamilyEvents.families.find(family => family.id === union.id);
roleFamily.events[0].relationshipManagedRole = 'start';
roleFamily.events.push({ ...roleFamily.events[0], id: 'second-current-start' });
const roleBoardFamily = ambiguousFamilyEvents.boards[0].diagram.families[0];
roleBoardFamily.events.push({ ...roleFamily.events[0], id: 'wrong-event-role', relationshipManagedRole: 'current' });
const roleErrors = context.prepareProjectDraft(project, ambiguousFamilyEvents).errors;
assert.ok(roleErrors.some(error => error.includes('duplicates the current start event')));
assert.ok(roleErrors.some(error => error.includes('relationshipManagedRole must be start or end')));
const malformedBoardEvent = JSON.parse(before);
const boardEventFamily = malformedBoardEvent.boards[0].diagram.families.find(family => family.events.length);
boardEventFamily.events[0].placeId = { toString: false };
boardEventFamily.events[0].eventType = false;
boardEventFamily.relationshipStatus = 'invented';
const malformedBoardFamilyErrors = context.prepareProjectDraft(project, malformedBoardEvent).errors;
for (const field of ['events[0].placeId', 'events[0].eventType', 'relationshipStatus'])
    assert.ok(malformedBoardFamilyErrors.some(error => error.includes('/' + boardEventFamily.id + '.' + field)));
const invalidBoardMembership = JSON.parse(before);
const boardMembershipFamily = invalidBoardMembership.boards[0].diagram.families.find(family => family.children.length);
Object.assign(boardMembershipFamily.children[0], { parentageType: 'invented', legacyType: 'biological' });
const boardMembershipErrors = context.prepareProjectDraft(project, invalidBoardMembership).errors;
for (const field of ['parentageType', 'legacyType'])
    assert.ok(boardMembershipErrors.some(error => error.includes('/' + boardMembershipFamily.id + '.children[0].' + field)));
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
assert.ok(context.validateProjectDraft(project, restored).some(error => error.includes('.source.nodeId references missing ID missing')));
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
for (const field of ['people', 'evidence', 'questions']) malformedBoard.boards[0][field] = [];
const retiredBoardErrors = context.prepareProjectDraft(project, malformedBoard).errors;
for (const field of ['people', 'evidence', 'questions'])
    assert.ok(retiredBoardErrors.some(error => error.includes('retired board field ' + field)), field);
Object.assign(malformedBoard.boards[0], { title: '', description: 'a'.repeat(501), favorite: 'false', modifiedAt: 'invalid', modified: 'Just now' });
delete malformedBoard.boards[0].collectionIds;
delete malformedBoard.boards[0].archived;
Object.assign(malformedBoard.boards[0].diagram.canvas, { gridVisible: true, snapToGrid: 1, extraCanvasField: true });
Object.assign(malformedBoard.boards[0].diagram.nodes[0].appearance, { strokeColor: '#FFFFFF', strokePattern: true, shadowEnabled: 'inherit', extraAppearanceField: true });
malformedBoard.boards[0].diagram.canvas.backgroundPaint.legacyOpacity = 5;
malformedBoard.boards[0].diagram.connectionDefaults.color = '#FFFFFF';
Object.assign(malformedBoard.boards[0].diagram.nodes[0], { width: 0, locked: 'false', name: 8, order: false, extraNodeField: true });
malformedBoard.boards[0].diagram.connections[0].route.waypoints.push({ x: 1000001, y: 0 });
malformedBoard.boards[0].diagram.nodes.push({
    id: 'bad-drawing', type: 'drawing', x: 0, y: 0, width: 100, height: 100,
    points: [{ x: 0, y: 0 }, { x: 1000001, y: 0 }]
});
malformedBoard.boards[0].thumb = false;
malformedBoard.boards[0].extraBoardField = true;
malformedBoard.boards[0].diagram.extraDiagramField = true;
const boardMetadataErrors = context.prepareProjectDraft(project, malformedBoard).errors;
for (const diagnostic of ['.thumb must be text', '.extraBoardField is unexpected', '.diagram.extraDiagramField is unexpected', '.title must be nonempty text', '.description must be text', '.favorite must be boolean', '.archived must be boolean', '.collectionIds must be an array', '.modifiedAt must be a valid timestamp', 'retired display date modified', 'canvas contains retired field gridVisible', '.canvas.snapToGrid must be boolean', '.canvas.extraCanvasField is unexpected', 'retired paint field strokeColor', '.appearance.strokePattern must be solid or dashed', '.appearance.shadowEnabled must be boolean or null', '.appearance.extraAppearanceField is unexpected', '.backgroundPaint.legacyOpacity is unexpected', 'retired paint field color', 'unsupported type or invalid geometry', '.locked must be boolean', '.name must be text of at most 80', '.order must be numeric', '.extraNodeField is unexpected', 'invalid connection route', 'invalid drawing points'])
    assert.ok(boardMetadataErrors.some(error => error.includes(diagnostic)), diagnostic);
const malformedCollectionRows = JSON.parse(before);
malformedCollectionRows.places[0] = null;
malformedCollectionRows.boards[0].diagram.nodes[0] = { id: false };
const malformedCollectionDraft = context.prepareProjectDraft(project, malformedCollectionRows);
assert.ok(malformedCollectionDraft.errors.some(error => error.startsWith('places[0]')));
assert.ok(malformedCollectionDraft.errors.some(error =>
    error.startsWith('boards/' + malformedCollectionRows.boards[0].id + '.diagram.nodes[0]')));
assert.equal(Object.hasOwn(malformedCollectionDraft, 'records'), false);
const malformedDiagramCollections = JSON.parse(before);
const malformedDiagramBoard = malformedDiagramCollections.boards[0];
malformedDiagramBoard.diagram.assets = null;
malformedDiagramBoard.diagram.connections = {};
const malformedDiagramErrors = context.prepareProjectDraft(project, malformedDiagramCollections).errors;
for (const collection of ['assets', 'connections'])
    assert.ok(malformedDiagramErrors.includes('boards/' + malformedDiagramBoard.id + '.diagram.' + collection + ' must be an array.'));
const malformedConnectionInput = JSON.parse(before);
const malformedConnection = malformedConnectionInput.boards[0].diagram.connections[0];
malformedConnection.kind = 'invented';
Object.assign(malformedConnection.style, { pattern: false, cornerRadius: 33, legacyWidth: 4 });
malformedConnection.source.port = 'center';
const malformedConnectionErrors = context.prepareProjectDraft(project, malformedConnectionInput).errors;
for (const field of ['kind', 'style.pattern', 'style.cornerRadius', 'style.legacyWidth', 'source.port'])
    assert.ok(malformedConnectionErrors.some(error => error.includes('/' + malformedConnection.id + '.' + field)));
const invalidNodeDetailsInput = JSON.parse(before);
const detailNodes = invalidNodeDetailsInput.boards[0].diagram.nodes;
const badImage = detailNodes.find(node => node.type === 'image');
const badPlaceNode = detailNodes.find(node => node.type === 'place');
badImage.imageRef.legacyId = badImage.imageRef.id;
badImage.imageCrop = { zoom: 0, x: 0, y: 0 };
badPlaceNode.placeSizeMode = false;
badPlaceNode.placeRef.legacyName = 'Old place';
const invalidNodeDetails = context.prepareProjectDraft(project, invalidNodeDetailsInput);
for (const [node, field] of [[badImage, 'imageRef.legacyId'], [badImage, 'imageCrop'],
    [badPlaceNode, 'placeSizeMode'], [badPlaceNode, 'placeRef.legacyName']])
    assert.ok(invalidNodeDetails.errors.some(error => error.includes('/' + node.id + '.' + field)));
const badCardInput = JSON.parse(before);
const badCardNode = badCardInput.boards[0].diagram.nodes.find(node => node.type === 'person');
badCardNode.personCard.styleSettings.standard = { nameFontSize: 1000, photoSize: 0, nameFormat: 'invalid', fields: { unexpectedFlag: true } };
const badCardErrors = context.prepareProjectDraft(project, badCardInput).errors;
for (const key of ['nameFontSize', 'photoSize', 'nameFormat', 'fields.unexpectedFlag'])
    assert.ok(badCardErrors.some(error => error.includes('/' + badCardNode.id + '.personCard.styleSettings.standard.' + key)));
const invalidBoardDiagram = JSON.parse(before);
invalidBoardDiagram.boards[0].diagram = [];
assert.ok(context.prepareProjectDraft(project, invalidBoardDiagram).errors.some(error =>
    error.includes('.diagram must be a record.')));
const invalidBoardReference = JSON.parse(before);
invalidBoardReference.boards[0].diagram.people[0].treePersonId = false;
assert.ok(context.prepareProjectDraft(project, invalidBoardReference).errors.some(error =>
    error.includes('treePersonId must be a nonempty ID when set.')));
const invalidBoardDefaults = JSON.parse(before);
const invalidDefaultsDiagram = invalidBoardDefaults.boards[0].diagram;
invalidDefaultsDiagram.personCardDefaults.styleSettings.portrait.photoSize = 13;
delete invalidDefaultsDiagram.cardAppearanceDefaults.neutral;
invalidDefaultsDiagram.connectionDefaults.width = 0;
const defaultErrors = context.prepareProjectDraft(project, invalidBoardDefaults).errors;
for (const field of ['styleSettings.portrait', 'cardAppearanceDefaults.neutral', 'connectionDefaults requires'])
    assert.ok(defaultErrors.some(error => error.includes(field)), field);
const invalidPaintDraft = JSON.parse(before);
const paintDiagram = invalidPaintDraft.boards[0].diagram;
paintDiagram.canvas.backgroundPaint.color = 'red';
paintDiagram.connectionDefaults.line.opacity = 101;
paintDiagram.cardAppearanceDefaults.neutral.stroke.enabled = 1;
paintDiagram.nodes[0].appearance.stroke.opacity = 5.5;
paintDiagram.connections[0].style.line.enabled = null;
const paintErrors = context.prepareProjectDraft(project, invalidPaintDraft).errors;
for (const field of ['canvas.backgroundPaint', 'connectionDefaults.line', 'neutral.stroke', 'appearance.stroke', 'style.line'])
    assert.ok(paintErrors.some(error => error.includes(field + ' must contain a hex color')), field);
const invalidBoardTheme = JSON.parse(before);
const invalidThemeDiagram = invalidBoardTheme.boards[0].diagram;
delete invalidThemeDiagram.canvas.backgroundOverride;
invalidThemeDiagram.connectionDefaults.lineOverride = 'false';
invalidThemeDiagram.cardAppearanceDefaults.neutral.paintOverrides.fill = 1;
delete invalidThemeDiagram.nodes[0].appearance.paintOverrides.text;
const themeErrors = context.prepareProjectDraft(project, invalidBoardTheme).errors;
for (const field of ['canvas.backgroundOverride', 'connectionDefaults.lineOverride',
    'cardAppearanceDefaults.neutral.paintOverrides', 'nodes[0].appearance.paintOverrides'])
    assert.ok(themeErrors.some(error => error.includes(field)), field);
invalidThemeDiagram.themeProvenanceVersion = 2;
assert.ok(context.prepareProjectDraft(project, invalidBoardTheme).errors.some(error =>
    error.includes('themeProvenanceVersion is unsupported')));
const imageOnlyLegacyFile = structuredClone(context.window.GENEO_SEED_BOARD_ASSETS[0].payload);
const imageOnlyLegacyNode = imageOnlyLegacyFile.board.diagram.nodes.find(node => node.type === 'image');
imageOnlyLegacyNode.photoId = imageOnlyLegacyNode.imageRef.id;
delete imageOnlyLegacyNode.imageRef;
assert.throws(() => context.validateGeneographBoardFile(imageOnlyLegacyFile), /board image reference is invalid/);
const currentBoardFile = structuredClone(context.window.GENEO_SEED_BOARD_ASSETS[0].payload);
const currentBoardFileBefore = JSON.stringify(currentBoardFile);
let openedBoardId;
Object.assign(context, {
    validProjectById: id => id === project.id ? project : null,
    createRuntimeId: () => 'test-imported-board',
    markPrototypeSessionEdited() {},
    openGeneographBoard: id => { openedBoardId = id; }
});
const unsupportedBoardFile = structuredClone(currentBoardFile);
unsupportedBoardFile.board.diagram.themeProvenanceVersion = 0;
assert.throws(() => context.importGeneographBoardPayload(unsupportedBoardFile, project.id), /invalid theme color settings/);
const legacyFamilyFile = structuredClone(currentBoardFile);
legacyFamilyFile.board.diagram.families[0].marriageType = 'Religious';
assert.throws(() => context.importGeneographBoardPayload(legacyFamilyFile, project.id), /supported Geneograph board file/);
const legacyImageFile = structuredClone(currentBoardFile);
legacyImageFile.board.diagram.nodes.find(node => node.type === 'image').title = 'Old image title';
assert.throws(() => context.importGeneographBoardPayload(legacyImageFile, project.id), /supported Geneograph board file/);
const legacyPaintFile = structuredClone(currentBoardFile);
legacyPaintFile.board.diagram.nodes[0].appearance.strokeType = 'solid';
assert.throws(() => context.importGeneographBoardPayload(legacyPaintFile, project.id), /supported Geneograph board file/);
assert.equal(sample.boards[0], seededBoard);
const importedBoard = context.importGeneographBoardPayload(currentBoardFile, project.id);
const currentBoardDiagram = importedBoard.diagram;
assert.equal(openedBoardId, importedBoard.id);
assert.equal(sample.boards[0], importedBoard);
assert.equal(JSON.stringify(currentBoardFile), currentBoardFileBefore);
assert.equal(currentBoardDiagram.themeProvenanceVersion, 1);
assert.deepEqual(Array.from(context.validateProjectDraft(project,
    Object.fromEntries(collections.map(key => [key, sample[key] || []])))), []);
sample.boards.shift();
delete context.state.geneoBoardViewports[importedBoard.id];
invalidThemeDiagram.themeProvenanceVersion = 0;
assert.ok(context.prepareProjectDraft(project, invalidBoardTheme).errors.some(error =>
    error.includes('themeProvenanceVersion is unsupported')));
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
const invalidBoardIdentity = JSON.parse(before);
const boardIdentity = invalidBoardIdentity.boards[0].diagram.people[0];
boardIdentity.syncState = 'unrecognized';
boardIdentity.names.middle = false;
boardIdentity.names.display = 'Derived name';
boardIdentity.photoRegion = { x: 0.8, y: 0, width: 0.4, height: 1 };
const boardIdentityErrors = context.prepareProjectDraft(project, invalidBoardIdentity).errors;
for (const field of ['syncState', 'names.middle', 'names.display', 'photoRegion'])
    assert.ok(boardIdentityErrors.some(error => error.includes('/' + boardIdentity.id + '.' + field)));
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
    error.includes('.birth.placeId references missing places/missing-board-birthplace')));
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
const marriageDestination = { ...structuredClone(union), events: [] };
const marriageRows = context.geneoReviewRelationshipFields({ type: 'partner' }, marriageDestination, union, []);
for (const label of ['Marriage type', 'Date', 'Place'])
{
    const row = marriageRows.find(item => item.label === label);
    assert.ok(row && !row.treeBlocked, label);
    row.write(marriageDestination, row.tree, 'tree');
}
assert.equal(marriageDestination.events.length, 1);
assert.equal(marriageDestination.events[0].typeLabel, union.events[0].typeLabel);
assert.equal(marriageDestination.events[0].placeId, union.events[0].placeId);
assert.equal(marriageDestination.events[0].date.sortDate, union.events[0].date.sortDate);
assert.equal(Object.hasOwn(marriageDestination, 'marriageType'), false);
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
const changingEvent = createdUnion.events.find(event => 'event-' + createdUnion.id + '-' + event.id === marriageIds[0]);
changingEvent.relationshipManagedRole = 'start';
context.upsertPartnerRelationshipEvents(createdUnion, { relationshipType: 'Engaged', startDate: changingEvent.date, startPlace: {} },
    { resolvePlace: () => ({ placeId: null, placeText: '', address: '' }) });
syncDraftInput.notes[0].linkedEventIds.push(marriageIds[0]);
const afterRelationshipChange = context.prepareProjectDraft(project, syncDraftInput);
assert.deepEqual(Array.from(afterRelationshipChange.errors), []);
assert.equal(afterRelationshipChange.records.events.find(event => event.id === marriageIds[0]).title, 'Engagement');
assert.ok(afterRelationshipChange.records.archiveFiles[0].linkedEventIds.includes(marriageIds[0]));
assert.ok(afterRelationshipChange.records.sourceLinks.some(link => link.targetId === marriageIds[0]));
assert.ok(afterRelationshipChange.records.notes[0].linkedEventIds.includes(marriageIds[0]));
const resolveUnionPlace = () => ({ placeId: null, placeText: '', address: '' });
const updateUnionType = relationshipType => context.upsertPartnerRelationshipEvents(createdUnion, {
    relationshipType, startDate: changingEvent.date, startPlace: {}, endDate: changingEvent.date, endPlace: {}
}, { resolvePlace: resolveUnionPlace });
updateUnionType('Divorced');
const endEvent = createdUnion.events.find(event => event.relationshipManagedRole === 'end');
const endTimelineId = 'event-' + createdUnion.id + '-' + endEvent.id;
syncDraftInput.notes[0].linkedEventIds.push(endTimelineId);
updateUnionType('Married');
const reopenedUnion = context.prepareProjectDraft(project, syncDraftInput);
assert.deepEqual(Array.from(reopenedUnion.errors), []);
assert.equal(endEvent.relationshipManagedRole, undefined);
assert.equal(reopenedUnion.records.events.find(event => event.id === endTimelineId).title, 'Divorce');
assert.ok(reopenedUnion.records.notes[0].linkedEventIds.includes(endTimelineId));
assert.notEqual(context.partnerRelationshipEndEvent(createdUnion, 'Divorced'), endEvent);
const historicalEnd = JSON.stringify(endEvent);
updateUnionType('Divorced');
const newEndEvent = createdUnion.events.find(event => event.relationshipManagedRole === 'end');
assert.notEqual(newEndEvent.id, endEvent.id);
assert.equal(context.partnerRelationshipEndEvent(createdUnion), newEndEvent);
assert.equal(JSON.stringify(endEvent), historicalEnd);
assert.deepEqual(Array.from(context.prepareProjectDraft(project, syncDraftInput).errors), []);
const syncEndTarget = structuredClone(createdUnion);
const syncEndSource = structuredClone(createdUnion);
const syncManagedEnd = syncEndSource.events.find(event => event.relationshipManagedRole === 'end');
Object.assign(syncManagedEnd, { gedcomTag: 'ANUL', eventType: 'Annulment' });
context.geneoReviewCopyRelationship(syncEndSource, syncEndTarget);
const syncedEnd = syncEndTarget.events.find(event => event.relationshipManagedRole === 'end');
assert.equal(syncedEnd.id, newEndEvent.id);
assert.equal(syncedEnd.gedcomTag, 'ANUL');
assert.equal(JSON.stringify(syncEndTarget.events.find(event => event.id === endEvent.id).date), JSON.stringify(endEvent.date));
assert.equal(syncEndTarget.events.length, createdUnion.events.length);
updateUnionType('Married');
context.geneoReviewCopyRelationship(createdUnion, syncEndTarget);
assert.ok(syncEndTarget.events.every(event => event.relationshipManagedRole !== 'end'));
assert.ok(syncEndTarget.events.some(event => event.id === endEvent.id));
assert.ok(syncEndTarget.events.some(event => event.id === newEndEvent.id));
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
let nextReviewId = 0;
context.createRuntimeId = prefix => prefix + '-test-' + ++nextReviewId;
const reviewBoard = sample.boards[0];
const reviewAnchor = reviewBoard.diagram.people.find(person => person.treePersonId === 'silver');
const beforeReview = JSON.stringify(sample);
const emptyReview = context.geneoReviewDraft(reviewBoard, reviewAnchor.id);
const placementDiagram = structuredClone(reviewBoard.diagram);
const placementPerson = { ...structuredClone(reviewAnchor), id: 'placement-person' };
placementDiagram.people.push(placementPerson);
const placementBefore = JSON.stringify(placementDiagram);
const personBeforePlacement = JSON.stringify(placementPerson);
const placementDraft = { activePersonId: reviewAnchor.id, treeNodeIds: new Map([['silver', 'placement-node']]) };
assert.equal(context.geneoReviewPlaceTreeCard(placementDraft, placementDiagram, placementPerson,
    { type: 'partner', ids: [reviewAnchor.id, placementPerson.id] }, 'silver'), true);
const placedCard = placementDiagram.nodes.pop();
assert.equal(placedCard.id, 'placement-node');
assert.equal(placedCard.personId, placementPerson.id);
assert.equal(placedCard.personCard.heightMode, 'auto');
assert.equal(JSON.stringify(placementPerson), personBeforePlacement);
assert.equal(JSON.stringify(placementDiagram), placementBefore);
const emptyPlan = context.geneoTreeImportPreview(emptyReview);
assert.equal(emptyPlan.error || '', '');
assert.equal(emptyPlan.patches.length, 0);
assert.equal(JSON.stringify(sample), beforeReview);
const currentFirstName = reviewAnchor.names.first;
reviewAnchor.names.first = 'Silver revised';
const selectedReview = context.geneoReviewDraft(reviewBoard, reviewAnchor.id);
selectedReview.fields.set(reviewAnchor.id, new Map([['names.first', 'board']]));
const beforeSelectedReview = JSON.stringify(sample);
const selectedPlan = context.geneoTreeImportPreview(selectedReview);
assert.equal(selectedPlan.error || '', '');
assert.ok(selectedPlan.patches.some(patch => patch.key === 'people' && patch.id === 'silver'));
assert.equal(JSON.stringify(sample), beforeSelectedReview);
context.geneoReviewWritePatches(reviewBoard, selectedPlan.patches, 'after');
assert.equal(sample.people.find(person => person.id === 'silver').names.first, 'Silver revised');
const afterSync = Object.fromEntries(collections.map(key => [key, sample[key] || []]));
assert.deepEqual(Array.from(context.validateProjectDraft(project, afterSync)), []);
context.geneoReviewWritePatches(reviewBoard, selectedPlan.patches, 'before');
assert.equal(JSON.stringify(sample), beforeSelectedReview);
const reverseReview = context.geneoReviewDraft(reviewBoard, reviewAnchor.id);
reverseReview.fields.set(reviewAnchor.id, new Map([['names.first', 'tree']]));
const reversePlan = context.geneoTreeImportPreview(reverseReview);
assert.equal(reversePlan.error || '', '');
assert.ok(reversePlan.patches.some(patch => patch.key === 'board.people' && patch.id === reviewAnchor.id));
assert.ok(reversePlan.patches.every(patch => patch.key.startsWith('board.')));
assert.equal(JSON.stringify(sample), beforeSelectedReview);
const treeBeforeReverse = JSON.stringify(collections.filter(key => key !== 'boards').map(key => sample[key]));
context.geneoReviewWritePatches(reviewBoard, reversePlan.patches, 'after');
assert.equal(reviewAnchor.names.first, currentFirstName);
assert.equal(JSON.stringify(collections.filter(key => key !== 'boards').map(key => sample[key])), treeBeforeReverse);
const afterReverse = Object.fromEntries(collections.map(key => [key, sample[key] || []]));
assert.deepEqual(Array.from(context.validateProjectDraft(project, afterReverse)), []);
context.geneoReviewWritePatches(reviewBoard, reversePlan.patches, 'before');
assert.equal(JSON.stringify(sample), beforeSelectedReview);
reviewAnchor.names.first = currentFirstName;
assert.equal(JSON.stringify(sample), beforeReview);

const reviewedPerson = { ...structuredClone(sample.people[0]), id: 'sync-undo-media-person' };
sample.people.push(reviewedPerson);
context.selectedGeneographBoard = () => reviewBoard;
const undoPersonCreation = {
    boardId: reviewBoard.id, side: 'before',
    patches: [{ key: 'people', id: reviewedPerson.id, before: null, after: structuredClone(reviewedPerson) }]
};
assert.equal(context.geneoReviewHistoryCanRestore(undoPersonCreation), true);
const taggedPhoto = sample.media[0];
const originalRegions = taggedPhoto.personRegions;
taggedPhoto.personRegions = { ...originalRegions, [reviewedPerson.id]: { x: 0.1, y: 0.1, width: 0.3, height: 0.3 } };
assert.equal(context.geneoReviewHistoryCanRestore(undoPersonCreation), false);
taggedPhoto.personRegions = originalRegions;
assert.equal(context.geneoReviewHistoryCanRestore(undoPersonCreation), true);
sample.placeSavedFilters.push({
    id: 'sync-undo-place-filter', projectId: project.id, filters: { personId: reviewedPerson.id }
});
assert.equal(context.geneoReviewHistoryCanRestore(undoPersonCreation), false);
sample.placeSavedFilters.pop();
sample.people.pop();

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
