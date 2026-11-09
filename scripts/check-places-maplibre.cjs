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
assert.match(config, /PLACES_GEOCODING_CONFIG/);
assert.match(runtime, /PLACES_GEOCODING_CONFIG/);
assert.doesNotMatch(runtime + routes, /\bL\.|window\.L|Leaflet/);
assert.match(editor, /await waitForPlacesMapReady\(\)/);
assert.match(editor, /showPlaceEditorMapFallback\(\)/);
assert.match(runtime, /placesMapAdapter\.supportedProtocol\(\)/);
assert.match(files['src/modules/places/directory.js'], /id="placesVectorMap"/);
assert.match(files['src/modules/places/main.css'], /\.places-vector-map/);
assert.doesNotMatch(files['src/modules/geneograph/product-tour.js'], /window\.L|places-leaflet/);
assert.match(routes, /geneograph-theme-change/);
assert.match(routes, /map\.on\('style\.load'/);
assert.match(routes, /placesMapAdapter\.setLineSegments/);
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
    project: () => ({ x: 15, y: 700 }),
    getContainer: () => ({ clientWidth: 600, clientHeight: 500 }),
    panBy: (delta, options) => { fakeMap.delta = delta; fakeMap.options = options; }
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
assert.equal(JSON.stringify(fakeMap.delta), '[135,-300]');
assert.equal(fakeMap.options.duration, 0);

console.log('Places MapLibre adapter, integration and fallback checks passed.');
