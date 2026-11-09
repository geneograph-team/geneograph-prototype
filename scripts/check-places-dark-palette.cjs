/* Dependency-free checks for the adjustable charcoal Places map (#163). */
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const read = filename => fs.readFileSync(path.join(root, filename), 'utf8');
const config = read('src/core/runtime-config.js');
const adapterText = read('src/modules/places/map-adapter.js');
const runtime = read('src/modules/places/map-and-route.js');

assert.match(config, /PLACES_DARK_MAP_PAINT = Object\.freeze/);
assert.match(config, /tiles\.openfreemap\.org\/styles\/dark/);
assert.match(config, /tiles\.openfreemap\.org\/styles\/liberty/);
assert.match(runtime, /map\.on\('style\.load',[\s\S]*?placesMapAdapter\.applyDarkPalette\(map, placesMapRuntime\.mapTheme\)/);
assert.match(runtime, /placesMapRuntime\.mapTheme !== resolvedTheme/);
assert.doesNotMatch(runtime, /getStyleUrl/);

const context = vm.createContext({
    window: { location: { protocol: 'https:' } },
    console
});
vm.runInContext(config + '\n' + adapterText
    + '\nthis.palette = PLACES_DARK_MAP_PAINT;'
    + '\nthis.adapter = placesMapAdapter;', context);
const palette = context.palette;
const adapter = context.adapter;
assert.ok(Object.keys(palette).length >= 35,
    'The charcoal palette should cover the main dark-map layers');

const expected = [
    'background', 'water', 'landuse_park', 'landcover_wood',
    'highway_minor', 'highway_major_inner', 'highway_motorway_inner',
    'place_village', 'place_town', 'place_city',
    'boundary_country_z5-', 'water_name'
];
expected.forEach(id => assert.ok(palette[id], 'Missing map paint override: ' + id));

for (const [id, paints] of Object.entries(palette))
{
    assert.ok(Object.keys(paints).length, 'No paint rules for ' + id);
    for (const [property, value] of Object.entries(paints))
    {
        assert.match(property, /^(?:background|fill|line|text)-(?:color|outline-color|halo-color)$/);
        assert.match(value, /^#[0-9a-f]{6}$/, id + ':' + property);
    }
}

// Color contrast tests for representative labels and the quiet charcoal land.
function relativeLuminance(color)
{
    const values = [1, 3, 5].map(i =>
        Number.parseInt(color.slice(i, i + 2), 16) / 255);
    const linear = values.map(v => v <= 0.04045
        ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}
function contrast(a, b)
{
    const x = relativeLuminance(a), y = relativeLuminance(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
const land = palette.background['background-color'];
assert.ok(contrast(land, '#0c0c0c') > 1.35,
    'Charcoal land should be visibly brighter than original near-black');
assert.ok(contrast(palette.place_village['text-color'], land) >= 6,
    'Village labels should remain high contrast');
assert.ok(contrast(palette.place_city['text-color'], land) >= 7,
    'City labels should remain high contrast');
assert.ok(palette.water['fill-color'] !== land,
    'Water should remain visually distinguishable from land');
assert.ok(palette.landuse_park['fill-color'] !== land,
    'Parks should remain distinguishable from land');

const layerIds = new Set(Object.keys(palette));
const painted = [];
const map = {
    getLayer: id => layerIds.has(id) ? { id } : null,
    setPaintProperty: (id, property, value) => painted.push({ id, property, value })
};
assert.equal(adapter.applyDarkPalette(map, 'light'), 0,
    'Never repaint the light basemap');
assert.equal(painted.length, 0);
const actual = adapter.applyDarkPalette(map, 'dark');
const total = Object.values(palette).reduce((sum, item) =>
    sum + Object.keys(item).length, 0);
assert.equal(actual, total);
assert.equal(painted.length, total);
assert.ok(painted.some(p => p.id === 'background'
    && p.property === 'background-color' && p.value === land));
assert.ok(!painted.some(p => p.id.startsWith('places-')),
    'Custom marker/route layers must not be recolored');

const onlyBackground = {
    getLayer: id => id === 'background' ? {} : null,
    setPaintProperty: () => {}
};
assert.equal(adapter.applyDarkPalette(onlyBackground, 'dark'), 1,
    'Missing upstream layers should be ignored without breaking the map');
assert.equal(adapter.applyDarkPalette(null, 'dark'), 0);

// Exercise actual theme handler with a MapLibre-like stub. No map reload for
// a repeated preference, but exactly one setStyle per effective change.
const start = runtime.indexOf('function handlePlacesMapThemeChange(event)');
const end = runtime.indexOf("window.addEventListener('geneograph-theme-change'", start);
assert.ok(start >= 0 && end > start, 'Cannot locate theme change handler');
const styles = [];
const fakeMap = { setStyle: style => styles.push(style) };
const status = [];
const themeCtx = vm.createContext({
    placesMapReady: () => true,
    placesMapRuntime: {
        map: fakeMap, mapTheme: 'light', loadTimeout: null,
        styleLoading: false
    },
    placesMapAdapter: { styleUrl: name => name + '-style' },
    PLACES_MAP_CONFIG: { loadTimeoutMs: 20000 },
    setPlacesMapStatus: title => status.push(title),
    clearTimeout: () => {},
    setTimeout: () => 1,
    console,
    failPlacesMap: message => { throw new Error(message); }
});
vm.runInContext(runtime.slice(start, end)
    + '\nthis.handleTheme = handlePlacesMapThemeChange;', themeCtx);
themeCtx.handleTheme({ detail: { theme: 'light' } });
assert.equal(styles.length, 0);
themeCtx.handleTheme({ detail: { theme: 'dark' } });
assert.equal(styles.length, 1);
assert.equal(styles[0], 'dark-style');
assert.equal(themeCtx.placesMapRuntime.mapTheme, 'dark');
themeCtx.handleTheme({ detail: { theme: 'dark' } });
assert.equal(styles.length, 1, 'Repeated theme event must not reload styles');
themeCtx.handleTheme({ detail: { theme: 'light' } });
assert.equal(styles.length, 2);
assert.equal(styles[1], 'light-style');
assert.equal(themeCtx.placesMapRuntime.mapTheme, 'light');
assert.equal(status.length, 2);

console.log('Dark map palette, contrast and theme-switch checks passed.');
