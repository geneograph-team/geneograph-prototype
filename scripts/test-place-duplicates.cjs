const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, 'src', file), 'utf8');

function context()
{
    const scope = {
        console,
        structuredClone,
        PLACE_EDITOR_CLOSE_COORDINATE_KM: 0.5,
        PLACE_REVIEW_COORDINATE_ISSUE_TYPES: ['missing_coordinates', 'invalid_coordinates'],
        cleanEditFieldValue: value => String(value || '').trim(),
        currentProjectId: () => 'p1',
        markPrototypeSessionEdited: () => {},
        state: { albumsFilters: {}, placesFilters: { placeIds: [] } },
        placesMapRuntime: { pendingFocusPlaceId: '' },
        centralFamilyRecords: () => scope.families,
        rebuildSampleEventsAndPruneSourceLinks: () => scope.sampleData.events,
        archiveDocumentPlace: file => ({ placeId: file.documentPlaceId || '', placeText: file.documentPlaceText || '' }),
        archiveFilePlaceIds: file => [...new Set([file.documentPlaceId, ...(file.linkedPlaceIds || []), ...(file.placeIds || [])].filter(Boolean))],
        archiveApplyDocumentPlace: (file, id, text, related) => {
            file.documentPlaceId = id || null;
            file.documentPlaceText = text;
            file.linkedPlaceIds = [...new Set([id, ...related].filter(Boolean))];
            file.placeIds = [...file.linkedPlaceIds];
        }
    };
    vm.createContext(scope);
    vm.runInContext(read('seed/sample-data.js') + '\nglobalThis.sampleData = sampleData;', scope);
    vm.runInContext(read('modules/places/place-record-helpers.js'), scope);
    vm.runInContext(read('modules/places/filters.js'), scope);
    vm.runInContext(read('modules/places/editor.js'), scope);
    vm.runInContext(read('core/state-tree-core.js').match(/function normalizePlaceLookupText\(value\)[\s\S]*?\n\}/)[0], scope);
    scope.families = [];
    return scope;
}

function run(scope, code) { return vm.runInContext(code, scope); }

const seed = context();
assert.equal(run(seed, 'getPlaceDuplicatePairs().length'), 0, 'seed Places stay clean');
const left = { id: 'left', projectId: 'p1', name: 'River House', alternativeNames: ['Old River House'], coordinates: null };
const right = { id: 'right', projectId: 'p1', name: 'River House', alternativeNames: [], coordinates: null };
seed.sampleData.places.push(left, right);
assert.equal(run(seed, 'getPlaceDuplicatePairs().filter(pair => pair.key === "left|right").length'), 1);
assert.equal(run(seed, 'matchDuplicatePlaces(getPlace("left"), getPlace("right")).exact'), true);
const editorMatch = seed.findPlaceEditorDuplicate({ mode: 'add', placeId: null, name: 'River House',
    alternativeNames: [], coordinates: null, approximateRadiusMeters: null });
assert.equal(editorMatch.place.id, 'left');
assert.deepEqual([...editorMatch.reasons], [...run(seed, 'matchDuplicatePlaces(getPlace("left"), getPlace("right")).reasons')]);
assert.equal(run(seed, 'matchDuplicatePlaces(getPlace("left"), getPlace("left"))'), null);
const otherProject = { id: 'other-project', projectId: 'p2', name: 'River House', coordinates: null };
seed.sampleData.places.push(otherProject);
assert.equal(run(seed, 'matchDuplicatePlaces(getPlace("left"), getPlace("other-project"))'), null);
right.name = 'Old River House';
assert.equal(run(seed, 'matchDuplicatePlaces(getPlace("left"), getPlace("right")).alias'), true);
right.name = 'River Hous';
assert.ok(run(seed, 'matchDuplicatePlaces(getPlace("left"), getPlace("right"))'));
right.name = 'Hill Tower';
right.coordinates = { lat: 1, lng: 1 };
left.coordinates = { lat: 1, lng: 1 };
assert.equal(run(seed, 'matchDuplicatePlaces(getPlace("left"), getPlace("right"))'), null, 'proximity alone is insufficient');
right.name = 'River House';
const pair = run(seed, 'getPlaceDuplicatePairs().find(pair => pair.key === "left|right")');
seed.sampleData.places.push({ id: 'third', projectId: 'p1', name: 'River House', alternativeNames: [], coordinates: null });
assert.equal(seed.dismissPlaceDuplicatePair(pair), true);
assert.ok(seed.placeDuplicateDismissal(pair));
assert.equal(seed.placeDuplicateDismissal(run(seed, 'getPlaceDuplicatePairs().find(pair => pair.key === "left|third")')), null,
    'dismissing one pair does not suppress another');
left.updatedAt = 'tomorrow';
assert.ok(seed.placeDuplicateDismissal(pair), 'unrelated edits preserve dismissal');
left.approximateRadiusMeters = 400;
assert.equal(seed.placeDuplicateDismissal(pair), null, 'radius change reopens pair');
assert.equal(seed.restorePlaceDuplicatePair(pair.key), true);

for (const keepFirst of [true, false])
{
    const scope = context();
    const keepId = keepFirst ? 'a' : 'b';
    const removeId = keepFirst ? 'b' : 'a';
    const a = { id: 'a', projectId: 'p1', name: 'River House', alternativeNames: [], coordinates: { lat: 1, lng: 1 }, createdAt: 'old' };
    const b = { id: 'b', projectId: 'p1', name: 'River House', alternativeNames: ['Old River House'], coordinates: { lat: 2, lng: 2 }, approximateRadiusMeters: 500, createdAt: 'new' };
    scope.sampleData.places.push(a, b);
    scope.sampleData.people = [{ id: 'person', projectId: 'p1', birth: { placeId: removeId }, death: { placeId: keepId }, events: [{ placeIds: [keepId, removeId] }] }];
    scope.families = [{ events: [{ placeId: removeId }] }];
    scope.sampleData.media = [{ id: 'photo', placeId: removeId }];
    scope.sampleData.archiveFiles = [{ id: 'file', projectId: 'p1', documentPlaceId: removeId, linkedPlaceIds: [keepId, removeId], placeIds: [removeId] }];
    scope.sampleData.notes = [{ id: 'note', linkedPlaceIds: [keepId, removeId] }];
    scope.sampleData.sources = [{ id: 'source', placeId: removeId }];
    scope.sampleData.sourceLinks = [{ id: 'one', projectId: 'p1', sourceId: 'source', targetType: 'place', targetId: keepId },
        { id: 'two', projectId: 'p1', sourceId: 'source', targetType: 'place', targetId: removeId }];
    scope.sampleData.links = [
        { id: 'link-a', projectId: 'p1', sourceType: 'place', sourceId: keepId, targetType: 'person', targetId: 'person' },
        { id: 'link-b', projectId: 'p1', sourceType: 'place', sourceId: removeId, targetType: 'person', targetId: 'person' }
    ];
    scope.sampleData.boards = [{ diagram: { nodes: [{ type: 'place', placeRef: { scope: 'project', id: removeId, fallbackName: 'River House' } }] } }];
    scope.sampleData.events = [{ placeId: removeId }];
    scope.state.selectedPlaceId = removeId;
    scope.state.albumsFilters.placeId = removeId;
    scope.state.placesFilters.placeIds = [keepId, removeId];
    assert.equal(scope.mergeSavedPlaces(keepId, removeId, { aliases: true }), false,
        'different locations require an explicit choice');
    assert.equal(scope.sampleData.places.some(place => place.id === removeId), true,
        'a failed preflight does not mutate records');
    assert.equal(scope.mergeSavedPlaces(keepId, removeId, { aliases: true, locationChoice: 'keep' }), true);
    assert.equal(scope.sampleData.places.some(place => place.id === removeId), false);
    assert.equal(scope.getPlace(keepId).createdAt, keepFirst ? 'old' : 'new');
    assert.ok(scope.getPlace(keepId).alternativeNames.includes('Old River House') || scope.getPlace(keepId).name === 'Old River House');
    assert.equal(scope.sampleData.people[0].birth.placeId, keepId);
    assert.deepEqual([...scope.sampleData.people[0].events[0].placeIds], [keepId]);
    assert.equal(scope.families[0].events[0].placeId, keepId);
    assert.equal(scope.sampleData.media[0].placeId, keepId);
    assert.equal(scope.sampleData.archiveFiles[0].documentPlaceId, keepId);
    assert.deepEqual([...scope.sampleData.archiveFiles[0].linkedPlaceIds], [keepId]);
    assert.deepEqual([...scope.sampleData.notes[0].linkedPlaceIds], [keepId]);
    assert.equal(scope.sampleData.sources[0].placeId, keepId);
    assert.equal(scope.sampleData.sourceLinks.length, 1);
    assert.equal(scope.sampleData.links.length, 1);
    assert.equal(scope.sampleData.links[0].sourceId, keepId);
    assert.equal(scope.sampleData.boards[0].diagram.nodes[0].placeRef.id, keepId);
    assert.equal(scope.state.selectedPlaceId, keepId);
    assert.equal(scope.state.albumsFilters.placeId, keepId);
    assert.deepEqual([...scope.state.placesFilters.placeIds], [keepId]);
}

const location = context();
location.sampleData.places.push(
    { id: 'one', projectId: 'p1', name: 'Test Hall', coordinates: { lat: 1, lng: 1 } },
    { id: 'two', projectId: 'p1', name: 'Test Hall', coordinates: { lat: 2, lng: 2 }, approximateRadiusMeters: 500 }
);
assert.equal(location.mergeSavedPlaces('one', 'two', { locationChoice: 'remove' }), true);
assert.equal(location.getPlace('one').coordinates.lat, 2);
assert.equal(location.getPlace('one').approximateRadiusMeters, 500);

const contexts = context();
contexts.sampleData.places.push(
    { id: 'english-pawford', projectId: 'p1', name: 'Pawford, North Yorkshire, England', coordinates: null },
    { id: 'canadian-pawford', projectId: 'p1', name: 'Pawford, Ontario, Canada', coordinates: null },
    { id: 'short-pawford', projectId: 'p1', name: 'Pawford, England', coordinates: null },
    { id: 'different-town', projectId: 'p1', name: 'Different Town, North Yorkshire, England',
        coordinates: { lat: 53.9594, lng: -1.082 } }
);
assert.equal(run(contexts, 'matchDuplicatePlaces(getPlace("english-pawford"), getPlace("canadian-pawford"))'),
    null, 'same locality names in different regions/countries are not duplicates');
assert.ok(run(contexts, 'matchDuplicatePlaces(getPlace("english-pawford"), getPlace("short-pawford"))'),
    'compatible but partial geographical context still suggests a duplicate');
assert.equal(run(contexts, 'matchDuplicatePlaces(getPlace("english-pawford"), getPlace("different-town"))'),
    null, 'shared region alone is not a duplicate');

const createScope = context();
let createdToast = '';
createScope.sampleData.places.push(
    { id: 'existing-village', projectId: 'p1', name: 'Duplicate Village, England', coordinates: null }
);
createScope.testDraft = {
    mode: 'add', placeId: null, name: 'Duplicate Village, England', alternativeNames: [],
    coordinates: { lat: 52, lng: 0 }, coordinateText: { latitude: '52', longitude: '0' },
    locationMode: 'exact', radiusText: '', approximateRadiusMeters: null
};
createScope.placeEditorCompletion = null;
createScope.requireActiveProjectId = () => 'p1';
createScope.uniquePlaceIdFromText = () => 'new-duplicate-village';
createScope.showToast = value => { createdToast = value; };
createScope.closeModal = () => {};
createScope.renderPlaces = () => {};
run(createScope, [
    'syncPlaceEditorDraftFromModal = () => testDraft;',
    'updatePlaceEditorCoordinateUi = () => ({ valid: true, coordinates: testDraft.coordinates, radiusMeters: null });',
    'resetPlaceEditorDraft = () => {};',
    'commitPlaceEditorDraft();'
].join('\n'));
assert.equal(createScope.sampleData.places.filter(place => place.id === 'new-duplicate-village').length, 1,
    'possible duplicates never block valid Place creation');
assert.equal(createdToast, 'Place created.');
assert.equal(createScope.state.selectedPlaceId, 'new-duplicate-village');


for (const keepFirst of [true, false])
{
    const scope = context();
    const keepId = keepFirst ? 'a' : 'b';
    const removeId = keepFirst ? 'b' : 'a';
    const a = { id: 'a', projectId: 'p1', name: 'River House', alternativeNames: ['Old Mill'],
        coordinates: { lat: 1, lng: 1 }, createdAt: 'first', researchNote: 'East bank' };
    const b = { id: 'b', projectId: 'p1', name: 'River Hous', alternativeNames: ['Old Hall'],
        coordinates: { lat: 2, lng: 2 }, approximateRadiusMeters: 500,
        createdAt: 'second', researchNote: 'West bank', confidence: 'high' };
    scope.sampleData.places.push(a, b);
    const keep = scope.getPlace(keepId);
    const remove = scope.getPlace(removeId);
    const options = { locationChoice: 'keep', fieldChoices: {
        name: 'remove', alternativeNames: 'remove', coordinates: 'remove',
        approximateRadiusMeters: 'remove', researchNote: 'remove'
    } };
    const preview = scope.placeMergeFieldResult(keep, remove, options);
    assert.ok(preview, 'stage a valid per-field merge');
    assert.equal(preview.id, keepId);
    assert.equal(preview.createdAt, keep.createdAt);
    assert.equal(preview.name, remove.name);
    assert.equal(preview.coordinates.lat, remove.coordinates.lat);
    assert.equal(preview.researchNote, remove.researchNote);
    assert.ok(preview.alternativeNames.includes(keep.name), 'preserve displaced primary name');
    assert.ok(preview.alternativeNames.includes('Old Mill'), 'preserve left alternative');
    assert.ok(preview.alternativeNames.includes('Old Hall'), 'preserve right alternative');
    assert.equal(keep.name, keepFirst ? 'River House' : 'River Hous', 'preview never mutates Place');

    assert.equal(scope.mergeSavedPlaces(keepId, removeId, options), true);
    assert.equal(scope.sampleData.places.filter(place => place.id === keepId).length, 1);
    assert.equal(scope.sampleData.places.some(place => place.id === removeId), false);
    assert.equal(scope.getPlace(keepId).name, remove.name);
    assert.equal(scope.getPlace(keepId).createdAt, keepFirst ? 'first' : 'second');
    assert.equal(scope.getPlace(keepId).researchNote, remove.researchNote);
    assert.equal(scope.getPlace(keepId).confidence, 'high', 'fill missing metadata automatically');
}

const safety = context();
const saved = { id: 'safe-a', projectId: 'p1', name: 'River House',
    coordinates: { lat: 1, lng: 1 }, approximateRadiusMeters: 200, createdAt: 'old' };
const candidate = { id: 'safe-b', projectId: 'p1', name: 'River House', coordinates: null };
safety.sampleData.places.push(saved, candidate);
const clearCenter = { locationChoice: 'keep', fieldChoices: {
    coordinates: 'remove', approximateRadiusMeters: 'keep'
} };
assert.equal(safety.placeMergeFieldResult(saved, candidate, clearCenter), null,
    'radius cannot remain without a valid center');
assert.equal(safety.mergeSavedPlaces('safe-a', 'safe-b', clearCenter), false,
    'invalid staged location aborts before mutating references or Places');
assert.equal(saved.coordinates.lat, 1);
assert.equal(safety.sampleData.places.some(place => place.id === 'safe-b'), true);

const clearArea = { locationChoice: 'keep', fieldChoices: {
    coordinates: 'remove', approximateRadiusMeters: 'remove'
} };
assert.equal(safety.mergeSavedPlaces('safe-a', 'safe-b', clearArea), true,
    'explicitly clearing both values produces a valid unmapped Place');
assert.equal(safety.getPlace('safe-a').coordinates, null);
assert.equal('approximateRadiusMeters' in safety.getPlace('safe-a'), false);

assert.equal(read('modules/places/directory.js').includes('data-place-pair-compare'), false,
    'Compare-only control is removed');
assert.equal(read('modules/places/editor.js').includes('compareOnly'), false,
    'Compare-only dialog path is removed');
assert.ok(read('modules/places/filters.js').includes("main.querySelectorAll('[data-place-pair-select]')"),
    'shared selection updates nested duplicate cards');
assert.ok(read('modules/places/editor.js').includes('data-place-merge-copy'),
    'field-level transfer controls are present');


const previewScope = context();
previewScope.sampleData.places.push(
    { id: 'preview-left', projectId: 'p1', name: 'Tower House', alternativeNames: [], coordinates: null },
    { id: 'preview-right', projectId: 'p1', name: 'Tower Hous', alternativeNames: [], coordinates: null }
);
previewScope.t = value => value;
previewScope.escapeHtml = value => String(value ?? '');
previewScope.icon = { close: '', arrow: '→', undo: '↶' };
previewScope.placeReviewConnectionTotal = () => 0;
previewScope.CSS = { escape: value => value };
previewScope.openModal = () => {};
const destinationHost = { innerHTML: '' };
const keepCards = ['preview-left', 'preview-right'].map(id => ({
    dataset: { placeMergeSurvivor: id },
    classList: { toggle: () => {} },
    setAttribute: () => {},
    querySelector: () => ({ textContent: '' }),
    focus: () => {}
}));
const mergeButton = { disabled: true, addEventListener: () => {} };
const previewRoot = {
    onClick: null,
    querySelector: selector => selector === '[data-place-merge-fields]' ? destinationHost
        : selector === '[data-place-merge-confirm]' ? mergeButton
        : selector.startsWith('[data-place-merge-copy=') ? { focus: () => {} } : null,
    querySelectorAll: selector => selector === '[data-place-merge-survivor]' ? keepCards : [],
    addEventListener: (event, handler) => { if (event === 'click') previewRoot.onClick = handler; }
};
previewScope.modalBackdrop = { querySelector: () => previewRoot };
previewScope.openPlaceMergeModal('preview-left', 'preview-right');

const clickPreview = (selector, data) => previewRoot.onClick({
    target: { closest: query => query === selector ? { dataset: data, focus: () => {} } : null }
});
const rightValue = key => {
    const html = destinationHost.innerHTML;
    const section = html.match(new RegExp('data-place-merge-field="' + key + '"[\\s\\S]*?</section>'))?.[0] || '';
    return section.match(new RegExp('data-place-merge-destination="' + key + '"[^>]*>([\\s\\S]*?)</div>'))?.[1]?.trim();
};
clickPreview('[data-place-merge-survivor]', { placeMergeSurvivor: 'preview-left' });
assert.equal(rightValue('name'), 'Tower House', 'right column starts with selected survivor value');
clickPreview('[data-place-merge-copy]', { placeMergeCopy: 'name' });
assert.equal(rightValue('name'), 'Tower Hous', 'copy updates right destination to source value');
assert.ok(destinationHost.innerHTML.includes('is-updated'),
    'copied field receives a visible updated style');
assert.equal(previewScope.getPlace('preview-left').name, 'Tower House',
    'arrow stages changes but does not mutate saved Place');
clickPreview('[data-place-merge-reset]', { placeMergeReset: 'name' });
assert.equal(rightValue('name'), 'Tower House', 'reset restores survivor value');
clickPreview('[data-place-merge-survivor]', { placeMergeSurvivor: 'preview-right' });
assert.equal(rightValue('name'), 'Tower Hous', 'changing survivor reorders destination');
clickPreview('[data-place-merge-copy]', { placeMergeCopy: 'name' });
assert.equal(rightValue('name'), 'Tower House',
    'left remains source and right updates when the other survivor is chosen');

previewScope.getPlace('preview-left').coordinates = { lat: 1, lng: 2 };
previewScope.getPlace('preview-right').coordinates = { lat: 3, lng: 4 };
clickPreview('[data-place-merge-survivor]', { placeMergeSurvivor: 'preview-right' });
assert.equal(rightValue('coordinates'), '3.000000, 4.000000',
    'destination initially reflects the right survivor coordinates');
clickPreview('[data-place-merge-copy]', { placeMergeCopy: 'coordinates' });
assert.equal(rightValue('coordinates'), '1.000000, 2.000000',
    'copying a location immediately updates the right-hand coordinates');
assert.equal(previewScope.getPlace('preview-right').coordinates.lat, 3,
    'coordinate transfer also remains staged until Merge');

const modalCode = read('modules/places/editor.js').split('function openPlaceMergeModal(')[1];
for (const removedText of [
    'All linked records will be redirected to the selected Place.',
    'This merge cannot be undone in this session.',
    'Arrows copy values from the other Place into the selected Place. Original names remain available as alternative names.'
])
    assert.equal(modalCode.includes(removedText), false, 'unwanted modal explanation is absent');

console.log('Place duplicate review, survivor-directed merge, and nonblocking creation OK');
