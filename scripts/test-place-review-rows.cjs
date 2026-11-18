const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, 'src', file), 'utf8');
const scope = {
    console,
    structuredClone,
    PLACE_EDITOR_CLOSE_COORDINATE_KM: 0.5,
    CONNECTED_NOTES_PREVIEW_LIMIT: 3,
    cleanEditFieldValue: value => String(value || '').trim(),
    currentProjectId: () => 'p1',
    markPrototypeSessionEdited: () => {},
    t: value => value,
    escapeHtml: value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;'),
    icon: { mapPin: '<svg></svg>', doublechevronSidebar: '<svg></svg>', info: '<svg></svg>' },
    state: { language: 'en', selectedPlaceId: 'a', selectedPlaceReviewPairKey: '', placesInspectorCollapsed: false },
    CSS: { escape: value => value },
    getProjectPhotos: () => [],
    getNotesForEntity: () => [],
    rerenderPlacesInspector: () => { scope.inspectorRenders += 1; },
    inspectorRenders: 0
};
vm.createContext(scope);
vm.runInContext(read('seed/sample-data.js') + '\nglobalThis.sampleData = sampleData;', scope);
for (const file of ['modules/places/place-record-helpers.js',
    'modules/places/filters.js', 'modules/places/directory.js', 'modules/places/inspector.js'])
    vm.runInContext(read(file), scope);
scope.rerenderPlacesInspector = () => { scope.inspectorRenders += 1; };
vm.runInContext(read('core/state-tree-core.js').match(/function normalizePlaceLookupText\(value\)[\s\S]*?\n\}/)[0], scope);

scope.sampleData.places.push(
    { id: 'a', projectId: 'p1', name: 'Test Pair', coordinates: null },
    { id: 'b', projectId: 'p1', name: 'Test Pair', coordinates: null },
    { id: 'c', projectId: 'p1', name: 'Test Pair', coordinates: null }
);
const pairs = scope.getPlaceDuplicatePairs();
const ab = pairs.find(pair => pair.key === 'a|b');
const ac = pairs.find(pair => pair.key === 'a|c');
assert.ok(ab && ac);

scope.state.selectedPlaceReviewPairKey = ab.key;
const selectedMarkup = scope.renderPlaceDuplicateReviewRow({ pair: ab, dismissal: null });
const otherMarkup = scope.renderPlaceDuplicateReviewRow({ pair: ac, dismissal: null });
assert.match(selectedMarkup, /places-review-pair-row active/);
assert.match(selectedMarkup, /data-place-pair-key="a\|b"/);
assert.match(selectedMarkup, /aria-current="true"/);
assert.doesNotMatch(otherMarkup, /places-review-pair-row active/);
assert.doesNotMatch(selectedMarkup, /data-place-id=|data-place-pair-select|places-review-duplicate-place/);
assert.match(selectedMarkup, /Possible duplicate/);
assert.match(selectedMarkup, /data-place-pair-merge/);
assert.match(selectedMarkup, /data-place-pair-dismiss/);

assert.equal(scope.dismissPlaceDuplicatePair(ab), true);
const dismissedMarkup = scope.renderPlaceDuplicateReviewRow({ pair: ab, dismissal: scope.placeDuplicateDismissal(ab) });
assert.match(dismissedMarkup, /button secondary places-review-restore-button/);
assert.doesNotMatch(dismissedMarkup, /data-place-pair-merge/);

scope.state.selectedPlaceReviewPairKey = '';
const missing = scope.renderPlaceReviewListRow({ place: scope.getPlace('a'),
    issue: { type: 'missing_coordinates', actionLabel: 'Add position' }, dismissal: null });
assert.match(missing, /places-review-item-heading">No map position/);
assert.match(missing, /Linked records/);
assert.doesNotMatch(missing, /No broader place recorded|Missing map positions/);
const dismissedMissing = scope.renderPlaceReviewListRow({ place: scope.getPlace('a'),
    issue: { type: 'missing_coordinates', actionLabel: 'Add position' },
    dismissal: { type: 'missing_coordinates', reason: 'Research pending' } });
assert.match(dismissedMissing, /places-review-item-heading">No map position/);
assert.match(dismissedMissing, /Dismissal reason/);
assert.match(dismissedMissing, /Research pending/);
assert.match(dismissedMissing, /button secondary places-review-restore-button/);
assert.doesNotMatch(dismissedMissing, /No broader place recorded|Missing map positions/);

const inspector = scope.renderPlacesDuplicateInspector(ab);
assert.match(inspector, /Possible duplicate/);
assert.match(inspector, /data-place-pair-view-place="a"/);
assert.match(inspector, /data-place-pair-view-place="b"/);
assert.doesNotMatch(inspector, /data-place-pair-merge|Selected to keep/);

const row = key => ({ dataset: { placePairKey: key }, attrs: {}, active: false,
    classList: { toggle(name, on) { if (name === 'active') this.owner.active = on; },
        remove(name) { if (name === 'active') this.owner.active = false; } },
    setAttribute(name, value) { this.attrs[name] = value; },
    removeAttribute(name) { delete this.attrs[name]; },
    querySelector() { return { insertAdjacentHTML() {} }; } });
const pairRows = [row(ab.key), row(ac.key)];
const singleRow = row('single');
for (const item of [...pairRows, singleRow]) item.classList.owner = item;
scope.main = {
    querySelector(selector) { return pairRows.find(item => selector.includes(`data-place-pair-key="${item.dataset.placePairKey}"`)) || null; },
    querySelectorAll(selector) { return selector === '[data-place-pair-key]' ? pairRows : selector.includes('mobile-item-details') ? [] : [singleRow]; }
};
scope.state.selectedPlaceReviewPairKey = '';
assert.equal(scope.selectPlaceReviewPair(ab.key), true);
assert.equal(pairRows[0].active, true);
assert.equal(pairRows[1].active, false);
assert.equal(scope.state.selectedPlaceId, 'a', 'pair selection does not change individual Place selection');
assert.equal(scope.selectPlaceReviewPair(ac.key), true);
assert.equal(pairRows[0].active, false);
assert.equal(pairRows[1].active, true);
assert.equal(scope.inspectorRenders, 2);
assert.equal(scope.selectedVisiblePlaceReviewPair([{ items: [{ pair: ac }] }]).key, ac.key);
assert.equal(scope.selectedVisiblePlaceReviewPair([{ items: [{ pair: ab }] }]), null);
assert.equal(scope.state.selectedPlaceReviewPairKey, '', 'filtering away a pair clears the stale selection');

console.log('Place review row and pair-selection checks passed');
