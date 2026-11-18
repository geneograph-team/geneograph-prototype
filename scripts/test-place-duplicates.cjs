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

console.log('Place duplicate detection, dismissal, and merge integrity OK');
