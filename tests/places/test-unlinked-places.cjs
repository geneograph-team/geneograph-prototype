const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const sampleData = { places: [], placeIssues: [] };
const state = { albumsFilters: {}, placesFilters: {} };
const ctx = vm.createContext({
    sampleData, state, currentProjectId: () => 'p1',
    projectPlaces: (projectId = 'p1') => sampleData.places.filter(p => p.projectId === projectId),
    cleanEditFieldValue: value => String(value ?? '').trim(),
    PLACE_EDITOR_CLOSE_COORDINATE_KM: 0.5,
    rebuildSampleEventsAndPruneSourceLinks: () => [],
    invalidateProjectReadModel() {},
    updatePrototypeSessionUnloadGuard() {},
    placesMapRuntime: {}, structuredClone, console
});
for (const file of ['place-record-helpers.js', 'filters.js'])
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../../src/modules/places', file), 'utf8'), ctx, { filename: file });
vm.runInContext(fs.readFileSync(path.join(__dirname, '../../src/core/bootstrap.js'), 'utf8')
    .split('function prototypeSessionBeforeUnload')[0], ctx);
const run = code => vm.runInContext(code, ctx);
const place = { id: 'p', projectId: 'p1', name: 'Town', alternativeNames: [], coordinates: null };
const other = { id: 'other', projectId: 'p1', name: 'Town', alternativeNames: [], coordinates: null };
const foreign = { id: 'p', projectId: 'p2', name: 'Other town', alternativeNames: [], coordinates: null };
const base = { id: 'r', projectId: 'p1' };
const fixtures = [
    ['people', { birth: { placeId: 'p' } }],
    ['people', { death: { burialPlaceId: 'p' } }],
    ['people', { events: [{ date: { placeId: 'p' } }] }],
    ['people', { attributes: [{ fromDate: { placeId: 'p' } }] }],
    ['people', { attributes: [{ toDate: { burialPlaceId: 'p' } }] }],
    ['families', { events: [{ placeId: 'p' }] }],
    ['families', { attributes: [{ date: { placeId: 'p' } }] }],
    ['media', { placeId: 'p' }],
    ['media', { date: { placeId: 'p' } }],
    ['archiveFiles', { documentPlaceId: 'p', linkedPlaceIds: [] }],
    ['archiveFiles', { linkedPlaceIds: ['p'] }],
    ['archiveFiles', { documentDate: { placeId: 'p' } }],
    ['notes', { linkedPlaceIds: ['p'] }],
    ['sources', { placeId: 'p' }],
    ['sources', { accessedDate: { placeId: 'p' } }],
    ['sourceLinks', { sourceId: 's', targetType: 'place', targetId: 'p' }],
    ['links', { fromType: 'place', fromId: 'p', toType: 'note', toId: 'n', label: '' }],
    ['links', { fromType: 'note', fromId: 'n', toType: 'place', toId: 'p', label: '' }],
    ['boards', { diagram: { people: [{ birth: { placeId: 'p' } }] } }],
    ['boards', { diagram: { families: [{ events: [{ date: { placeId: 'p' } }] }] } }],
    ['boards', { diagram: { nodes: [{ type: 'place', placeRef: { scope: 'project', id: 'p', fallbackName: 'Town' } }] } }]
];
const collections = [...new Set(fixtures.map(([key]) => key))];
function reset()
{
    for (const key of collections) sampleData[key] = [];
    sampleData.places = [structuredClone(place), structuredClone(other), structuredClone(foreign)];
    sampleData.placeIssues = [];
    sampleData.events = [{ projectId: 'p1', placeId: 'p' }];
}
for (const [key, data] of fixtures)
{
    reset();
    sampleData[key] = [{ ...base, ...structuredClone(data) }, { ...base, projectId: 'p2', ...structuredClone(data) }];
    const before = JSON.stringify(sampleData[key][1]);
    assert.equal(run("placeLiveReferenceCount(getPlace('p'))"), 1, key);
    assert.equal(run("getPlaceReviewIssues(getPlace('p')).some(i => i.type === 'unlinked')"), false, key);
    assert.equal(run("deleteSavedPlace('p', { unlinkedOnly: true })"), false, key);
    assert.equal(run("mergeSavedPlaces('other', 'p')"), true, key);
    assert.equal(run("projectPlaceReferenceOwners('p1').has('p')"), false, key);
    assert.equal(run("placeLiveReferenceCount(getPlace('other'))"), 1, key);
    assert.equal(JSON.stringify(sampleData[key][1]), before, key);
    assert.equal(run("deleteSavedPlace('other')"), true, key);
    assert.equal(run("projectPlaceReferenceOwners('p1').has('other')"), false, key);
    assert.equal(JSON.stringify(sampleData[key].find(r => r.projectId === 'p2')), before, key);
}
reset();
sampleData.boards = [{ ...base, diagram: { nodes: [{ type: 'place', placeRef: { scope: 'board', name: 'p' } }] } }];
sampleData.people = [{ ...base, deleted: true, birth: { placeId: 'p' } }];
sampleData.notes = [{ ...base, body: 'p', linkedPlaceIds: [] }];
assert.equal(run("placeLiveReferenceCount(getPlace('p'))"), 0);
assert.equal(run("getPlaceReviewIssues(getPlace('p')).map(i => i.type).join(',')"), 'unlinked');
assert.equal(run("dismissPlaceReviewIssue('p', 'unlinked')"), true);
assert.equal(run("getActivePlaceReviewIssues(getPlace('p')).length"), 0);
sampleData.sources = [{ ...base, placeId: 'p' }];
run('invalidateLinkedPlaceDismissals()');
assert.equal(sampleData.placeIssues.length, 0);
sampleData.sources = [];
assert.equal(run("getActivePlaceReviewIssues(getPlace('p'))[0].type"), 'unlinked');
assert.equal(run("dismissPlaceReviewIssue('p', 'unlinked')"), true);
assert.equal(run("restorePlaceReviewIssue('p', 'unlinked')"), true);
assert.equal(run("deleteSavedPlace('p', { unlinkedOnly: true })"), true);
assert.equal(sampleData.people[0].birth.placeId, null);
assert.equal(sampleData.places.some(p => p.projectId === 'p2' && p.id === 'p'), true);
reset();
sampleData.archiveFiles = [{ ...base, documentPlaceId: 'p', linkedPlaceIds: ['other'] }];
sampleData.sourceLinks = [{ ...base, sourceId: 's', targetType: 'place', targetId: 'p' },
    { ...base, id: 'keep-link', sourceId: 's', targetType: 'place', targetId: 'other' }];
sampleData.links = [{ ...base, fromType: 'place', fromId: 'p', toType: 'note', toId: 'n', label: '' },
    { ...base, id: 'keep-typed', fromType: 'place', fromId: 'other', toType: 'note', toId: 'n', label: '' }];
assert.equal(run("mergeSavedPlaces('other', 'p')"), true);
assert.equal(sampleData.archiveFiles[0].documentPlaceId, 'other');
assert.equal(sampleData.archiveFiles[0].linkedPlaceIds.length, 0);
assert.equal(sampleData.sourceLinks.length, 1);
assert.equal(sampleData.sourceLinks[0].id, 'keep-link');
assert.equal(sampleData.links.length, 1);
assert.equal(sampleData.links[0].id, 'keep-typed');
console.log('Unlinked Places: 21 sole-reference cases, merge/delete, cross-project isolation, deduplication and dismissal lifecycle passed.');
