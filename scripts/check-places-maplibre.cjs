/* Dependency-free focused checks for the Places MapLibre migration (#157). */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const root = path.join(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const names = [
    'src/index.html',
    'src/core/runtime-config.js',
    'src/modules/places/map-adapter.js',
    'src/modules/places/map-runtime.js',
    'src/modules/places/map-and-route.js',
    'src/modules/places/editor.js',
    'src/modules/places/directory.js',
    'src/modules/places/filters.js',
    'src/modules/places/main.css',
    'src/modules/geneograph/product-tour.js',
    'src/localization/catalog.js'
];
const files = Object.fromEntries(names.map(name => [name, read(name)]));
const html = files['src/index.html'];
const config = files['src/core/runtime-config.js'];
const adapterText = files['src/modules/places/map-adapter.js'];
const runtime = files['src/modules/places/map-runtime.js'];
const routes = files['src/modules/places/map-and-route.js'];
const editor = files['src/modules/places/editor.js'];

assert.match(html, /maplibre-gl@6\.16\.0\/dist\/maplibre-gl\.css/);
assert.match(config, /maplibre-gl@6\.16\.0\/dist\/maplibre-gl\.mjs/);
assert.match(config, /tiles\.openfreemap\.org\/styles\/liberty/);
assert.match(config, /tiles\.openfreemap\.org\/styles\/dark/);
assert.ok(html.indexOf('map-adapter.js') < html.indexOf('map-runtime.js'));
assert.doesNotMatch(html, /unpkg\.com\/leaflet|leaflet\.js|leaflet\.css/);
assert.doesNotMatch(config, /maps\/streets-v4|tileUrl:|api\.maptiler\.com\/maps/);
// #158 removed MapTiler geocoding from the map runtime.
assert.doesNotMatch(config + runtime, /PLACES_GEOCODING_CONFIG|maptilerKey/);
assert.doesNotMatch(runtime + routes, /\bL\.|window\.L|Leaflet/);
assert.match(editor, /await waitForPlacesMapReady\(\)/);
assert.match(editor, /showPlaceEditorMapFallback\(\)/);
assert.match(runtime, /placesMapAdapter\.supportedProtocol\(\)/);
assert.match(runtime, /<button class="button secondary" type="button" data-places-map-list>/);
assert.match(config, /pendingFocusPlaceId: null/);
assert.match(files['src/modules/places/directory.js'], /id="placesVectorMap"/);
assert.match(files['src/modules/places/main.css'], /\.places-vector-map/);
assert.match(files['src/modules/places/main.css'],
    /\.places-map-status\s*\{[^}]*top:\s*50%[^}]*transform:\s*translate\(-50%, -50%\)/s);
assert.doesNotMatch(files['src/modules/geneograph/product-tour.js'], /window\.L|places-leaflet/);
assert.match(routes, /geneograph-theme-change/);
assert.match(routes, /map\.on\('style\.load'/);
assert.match(routes, /placesMapAdapter\.setLineSegments/);
assert.match(routes, /pendingFocusPlaceId/);
assert.match(routes, /restorePlacesMapView\(placesMapRuntime\.currentPlaces\);[\s\S]*?updatePlacesMapSelection\(focusPlaceId, \{ focusMap: true \}\)/);
assert.match(editor, /placesMapRuntime\.pendingFocusPlaceId = place\.id/);
assert.match(files['src/modules/places/filters.js'], /placesMapRuntime\.pendingFocusPlaceId/);
assert.match(files['src/localization/catalog.js'], /Interactive map unavailable.*Недоступна|Interactive map unavailable.*недоступна/i);

for (const [name, content] of Object.entries(files))
{
    assert.ok(content.endsWith('\n'), name + ' must end with a newline');
    assert.ok(!content.split('\n').some(line => /[ \t]+$/.test(line)),
        name + ' must not have trailing whitespace');
}

const context = {
    window: { location: { protocol: 'https:' } },
    PLACES_MAP_CONFIG: {
        moduleUrl: 'https://invalid.example/unused.mjs',
        styles: { light: 'liberty', dark: 'dark' }
    }
};
vm.runInNewContext(adapterText + '\nthis.adapter = placesMapAdapter;', context);
const adapter = context.adapter;

assert.equal(adapter.supportedProtocol(), true);
context.window.location.protocol = 'file:';
assert.equal(adapter.supportedProtocol(), false);
context.window.location.protocol = 'https:';
assert.equal(JSON.stringify(adapter.toLngLat([50.05, 20.25])), '[20.25,50.05]');
assert.equal(JSON.stringify(adapter.toLngLat({ lat: 50.05, lng: 20.25 })), '[20.25,50.05]');
assert.equal(JSON.stringify(adapter.fromLngLat({ lat: 50.05, lng: 20.25 })),
    '{"lat":50.05,"lng":20.25}');
assert.equal(adapter.styleUrl('dark'), 'dark');
assert.equal(adapter.styleUrl('light'), 'liberty');

const sources = new Map();
const layers = new Map();
const fakeMap = {
    getStyle: () => ({}),
    getSource: key => sources.get(key),
    getLayer: key => layers.get(key),
    addSource: (key, source) =>
    {
        sources.set(key, {
            ...source,
            setData(value) { this.data = value; }
        });
    },
    addLayer: layer => layers.set(layer.id, layer),
    removeLayer: key => layers.delete(key),
    removeSource: key => sources.delete(key),
    easeTo: options => { fakeMap.cameraCalls = (fakeMap.cameraCalls || 0) + 1;
        fakeMap.camera = options; }
};
adapter.setLineSegments(fakeMap, [[[50, 20], [51, 21]], [[52, 22]]], 'test-color');
assert.equal(sources.size, 1);
assert.equal(layers.size, 1);
assert.equal(JSON.stringify(sources.get('places-route-lines').data.features[0].geometry.coordinates),
    '[[20,50],[21,51]]');
adapter.setLineSegments(fakeMap, [[[49, 24], [50, 25]]], 'test-color');
assert.equal(JSON.stringify(sources.get('places-route-lines').data.features[0].geometry.coordinates),
    '[[24,49],[25,50]]');
adapter.clearLineSegments(fakeMap);
assert.equal(sources.size, 0);
assert.equal(layers.size, 0);

const area = {
    type: 'Feature',
    properties: {},
    geometry: { type: 'Polygon', coordinates: [[[24, 50], [24.1, 50], [24, 50]]] }
};
adapter.setArea(fakeMap, 'a', area, {
    fillColor: 'test-fill', outlineColor: 'test-outline'
});
assert.equal(sources.size, 1);
assert.equal(layers.size, 2);
const nextArea = { ...area, properties: { changed: true } };
adapter.setArea(fakeMap, 'a', nextArea, {
    fillColor: 'test-fill', outlineColor: 'test-outline'
});
assert.equal(sources.get('places-area-a').data.properties.changed, true);
adapter.removeArea(fakeMap, 'a');
assert.equal(sources.size, 0);
assert.equal(layers.size, 0);

adapter.focusPoint(fakeMap, [50, 20], {
    topLeft: [150, 40],
    bottomRight: [80, 100]
});
assert.equal(fakeMap.cameraCalls, 1);
assert.equal(JSON.stringify(fakeMap.camera.center), '[20,50]');
assert.equal(JSON.stringify(fakeMap.camera.offset), '[35,-30]');
assert.equal(fakeMap.camera.duration, 0);
// Focus is explicit navigation, even when the place is already visible.
adapter.focusPoint(fakeMap, [50, 20], {
    topLeft: [150, 40],
    bottomRight: [80, 100]
});
assert.equal(fakeMap.cameraCalls, 2);

// Regression: a place navigation requested during map loading must survive
// until MapLibre is ready, and should keep the new viewport center.
const focusFunctionStart = routes.indexOf('function updatePlacesMapSelection(');
const focusFunctionEnd = routes.indexOf('\nfunction placesMapPadding()', focusFunctionStart);
assert.ok(focusFunctionStart >= 0 && focusFunctionEnd > focusFunctionStart);
const selectionContext = {
    placesMapRuntime: {
        markersById: new Map(),
        status: 'loading',
        map: {
            getCenter: () => ({ lat: 50, lng: 20 }),
            getZoom: () => 8
        },
        pendingFocusPlaceId: null
    },
    state: { placesMapView: {} },
    getPlace: id => id === 'p1' || id === 'p2'
        ? { id, coordinates: { lat: 50, lng: 20 } }
        : null,
    placeHasCoordinates: place => Boolean(place?.coordinates),
    placeLatLng: place => place.coordinates,
    placesMapPadding: () => ({ topLeft: [150, 40], bottomRight: [80, 100] }),
    placesMapReady: () => selectionContext.placesMapRuntime.status === 'ready',
    placesMapAdapter: {
        updateSelection: () => {},
        focusPoint: () =>
        {
            selectionContext.cameraCalls = (selectionContext.cameraCalls || 0) + 1;
        }
    }
};
vm.runInNewContext(routes.slice(focusFunctionStart, focusFunctionEnd)
    + '\nthis.selectMapPlace = updatePlacesMapSelection;', selectionContext);
selectionContext.selectMapPlace('p1', { focusMap: true });
assert.equal(selectionContext.placesMapRuntime.pendingFocusPlaceId, 'p1');
assert.equal(selectionContext.cameraCalls || 0, 0);
selectionContext.placesMapRuntime.status = 'ready';
selectionContext.selectMapPlace('p1', { focusMap: true });
assert.equal(selectionContext.cameraCalls, 1);
assert.equal(selectionContext.placesMapRuntime.pendingFocusPlaceId, null);
assert.equal(selectionContext.state.placesMapView.center.lng, 20);
assert.equal(selectionContext.state.placesMapView.userMoved, true);
// Changing selection while loading supersedes the earlier queued focus.
selectionContext.placesMapRuntime.pendingFocusPlaceId = 'p1';
selectionContext.selectMapPlace('p2', { focusMap: false });
assert.equal(selectionContext.placesMapRuntime.pendingFocusPlaceId, null);

// OpenFreeMap Dark uses circle-11 in three place-name layers. Its sprite
// may not include the image. Resolve only that known icon, and make the
// resolver survive style changes; do not replace unrelated provider icons.
const spriteImages = [];
const mockLibrary = {
    Map: class
    {
        constructor(options)
        {
            this.options = options;
        }
        setMissingStyleImageResolver(resolver)
        {
            this.resolver = resolver;
        }
        addImage(id, image, options)
        {
            spriteImages.push({ id, image, options });
        }
        setStyle(style)
        {
            this.options.style = style;
        }
    }
};
const spriteContext = {
    window: {
        location: { protocol: 'https:' },
        __testLibrary: mockLibrary
    },
    PLACES_MAP_CONFIG: {
        styles: { light: 'liberty', dark: 'dark' },
        defaultCenter: { lat: 0, lng: 0 },
        defaultZoom: 3, minZoom: 1, maxZoom: 18
    }
};
const adapterWithMapStub = adapterText.replace(
    'let library = null;', 'let library = window.__testLibrary;'
);
assert.notEqual(adapterWithMapStub, adapterText,
    'MapLibre library test injection should remain available');
vm.runInNewContext(adapterWithMapStub
    + '\nthis.adapter = placesMapAdapter;', spriteContext);
const mapWithMissingSprite = spriteContext.adapter.createMap({}, 'dark');
assert.equal(mapWithMissingSprite.options.style, 'dark');
assert.equal(typeof mapWithMissingSprite.resolver, 'function');
mapWithMissingSprite.resolver('unrelated-provider-icon');
assert.equal(spriteImages.length, 0,
    'Do not replace unknown upstream sprite images');
mapWithMissingSprite.resolver('circle-11');
assert.equal(spriteImages.length, 1);
assert.equal(spriteImages[0].id, 'circle-11');
assert.equal(spriteImages[0].image.width, 11);
assert.equal(spriteImages[0].image.height, 11);
assert.equal(spriteImages[0].image.data.length, 11 * 11 * 4);
assert.equal(spriteImages[0].image.data[(5 * 11 + 5) * 4 + 3], 255,
    'Town dot should have an opaque center');
assert.equal(spriteImages[0].image.data[3], 0,
    'Town dot corner should be transparent');
assert.equal(spriteImages[0].options.pixelRatio, 1);
mapWithMissingSprite.setStyle('light');
mapWithMissingSprite.resolver('circle-11');
assert.equal(spriteImages.length, 2,
    'MapLibre resolver should remain registered across style changes');

console.log('Places MapLibre adapter, integration and fallback checks passed.');
