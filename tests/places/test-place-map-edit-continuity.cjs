'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function element(value = '')
{
    const classes = new Set();
    return {
        value, hidden: false, disabled: false, textContent: '', attributes: {}, listeners: [],
        classList: {
            toggle: (name, enabled) => enabled ? classes.add(name) : classes.delete(name),
            contains: name => classes.has(name)
        },
        setAttribute(name, value) { this.attributes[name] = value; },
        addEventListener(type, listener) { this.listeners.push({ type, listener }); }
    };
}

const bar = '[data-places-coordinate-bar]';
const output = '[data-places-coordinate-output]';
const instruction = '[data-places-map-instruction]';
const radius = '#placesMapRadiusInput';
const confirm = '#placesConfirmMapEdit';
function shell()
{
    const result = { nodes: new Map([bar, output, instruction, radius, confirm, '#placesCancelMapEdit',
        '#placesMapRadiusError', '[data-places-map-radius-field]', '.places-map', '.places-content']
        .map(key => [key, element()])), radios: [element('exact'), element('approximate')] };
    const placeholder = { parentNode: { moveBefore(host) { host.closest = () => result.panel; result.host = host; } }, remove() {} };
    result.panel = element();
    result.host = placeholder;
    result.querySelector = key => key === '#placesVectorMap' ? placeholder : result.nodes.get(key);
    result.remove = () => {};
    return result;
}

let view = shell();
const host = { closest: () => view.panel };
view.host = host;
const main = {
    get childNodes() { return [view]; },
    contains: node => node === view.host,
    querySelector: key => view.nodes.get(key),
    querySelectorAll: () => view.radios,
    append(next) { view = next; }
};
const state = { placesViewMode: 'map' };
const map = {};
const runtime = { mode: 'add', status: 'ready', host, projectId: 'p1', map };
const original = { coordinates: null, coordinateText: { lat: '', lng: '' },
    locationMode: 'exact', radiusText: '', approximateRadiusMeters: null, returnToModal: true };
const draft = { ...original, mapSession: original, disclosures: {} };
let reopened, resets = 0;
const context = vm.createContext({
    main, state, placesMapRuntime: runtime, placeEditorDraft: draft, window: { addEventListener() {} },
    replaceSharedSearchBranch: () => false,
    replaceSharedSearchMarkup: (root, markup) => { root.innerHTML = markup; },
    document: { querySelector: main.querySelector, createElement: () => ({ content: shell() }) },
    currentProjectId: () => 'p1', getPlace: () => ({ name: 'Example' }),
    validLatitude: lat => Number.isFinite(lat) && Math.abs(lat) <= 90,
    validLongitude: lng => Number.isFinite(lng) && Math.abs(lng) <= 180,
    validPlaceRadiusMeters: meters => Number.isFinite(meters) && meters > 0,
    t: s => s, translateText: s => s, closeMenu() {},
    clonePlaceEditorCoordinates: value => value && { ...value },
    placeEditorCoordinateText: value => ({ lat: String(value.lat), lng: String(value.lng) }),
    requestAnimationFrame: callback => callback(),
    placesMapAdapter: { removeArea() { resets++; } }
});
for (const file of ['directory.js', 'editor.js', 'map-runtime.js', 'map-and-route.js'])
{
    const filename = path.join(__dirname, '../../src/modules/places', file);
    vm.runInContext(fs.readFileSync(filename, 'utf8'), context, { filename });
}
context.updatePlaceEditorDraftDirty = () => {};
context.restorePlaceEditorReviewContext = () => {};
context.openPlaceModal = (_id, options) => { reopened = options.draft; };
context.updatePlacesMapSelection = () => {};
context.renderPlacesRouteLayer = () => {};
context.renderPlaceAreaOverlays = () => {};
context.updatePlacesRouteControl = () => {};
context.placeHasCoordinates = () => false;
context.normalizePlaceCoordinates = () => null;
runtime.markersById = new Map();
runtime.currentPlaces = [];
const render = () =>
{
    context.replacePlacesMainMarkup('<new shell>');
    context.bindPlacesMapEditingControls();
    assert.equal(view.host, host);
    assert.equal(runtime.map, map);
    assert.equal(view.panel.classList.contains('is-picking'), true);
    assert.equal(view.nodes.get(bar).hidden, false);
    assert.equal(view.nodes.get(instruction).hidden, false);
    assert.equal(view.nodes.get(confirm).listeners.length, 1);
    assert.equal(draft.mapSession, original);
};
render();
assert.equal(view.nodes.get(output).textContent, 'No point selected');
assert.equal(view.nodes.get(confirm).disabled, true);
const marker = { remove() {} };
const handle = { remove() {} };
Object.assign(runtime, { draftMarker: marker, pendingLatLng: { lat: 3, lng: 5 } });
Object.assign(draft, { locationMode: 'approximate', radiusText: 'bad' });
render();
assert.equal(view.nodes.get(output).textContent, '3.00000, 5.00000');
assert.equal(view.nodes.get(radius).value, 'bad');
assert.equal(view.nodes.get(radius).attributes['aria-invalid'], 'true');
assert.equal(view.nodes.get(confirm).disabled, true);
Object.assign(draft, { radiusText: '2.750', approximateRadiusMeters: 2750 });
runtime.draftRadiusMarker = handle;
runtime.status = 'loading';
render();
runtime.status = 'ready';
render();
context.updatePlacesMapData([]);
context.updatePlacesMapData([]);
context.updatePlacesMapData([{ id: 'changed-list' }]);
assert.equal(runtime.currentPlaces[0].id, 'changed-list');
assert.equal(view.nodes.get(radius).value, '2.750');
assert.equal(view.nodes.get(radius).attributes['aria-invalid'], 'false');
assert.equal(view.nodes.get(confirm).disabled, false);
assert.equal(runtime.draftMarker, marker);
assert.equal(runtime.draftRadiusMarker, handle);
assert.equal(resets, 0, 'Compatible rerenders preserve overlay and markers');
context.cancelPlacesMapEditing();
assert.equal(reopened, draft);
assert.equal(draft.coordinates, null);
assert.equal(draft.locationMode, 'exact');
assert.equal(draft.radiusText, '');
assert.equal(runtime.pendingLatLng, null);
assert.equal(view.nodes.get(bar).hidden, true);

Object.assign(runtime, { mode: 'move', editingPlaceId: 'place', pendingLatLng: { lat: 4, lng: 6 } });
Object.assign(draft, { mapSession: original, locationMode: 'exact' });
render();
assert.equal(view.nodes.get(output).textContent, '4.00000, 6.00000');
context.completePlaceEditorMapSelection();
assert.deepEqual({ ...draft.coordinates }, { lat: 4, lng: 6 });
assert.equal(draft.approximateRadiusMeters, null);
assert.equal(runtime.mode, 'browse');
console.log('Retained Places markup restores add/move controls, draft state, listeners, Cancel and Use position.');
