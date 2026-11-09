/* Dependency-free check for the isolated MapLibre / OpenFreeMap experiment. */
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const geometry = require('../src/experiments/maplibre-poc/geometry.js');

const root = path.join(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const center = [24.0297, 49.8397];
const radius = 5000;

function testCircle(point, distance, segments)
{
    const polygon = geometry.geodesicCircle(point, distance, segments);
    const ring = polygon.geometry.coordinates[0];
    assert.equal(polygon.type, 'Feature');
    assert.equal(polygon.geometry.type, 'Polygon');
    assert.equal(ring.length, segments + 1);
    assert.deepEqual(ring[0], ring.at(-1), 'GeoJSON ring must close');
    for (const vertex of ring.slice(0, -1))
    {
        assert.ok(
            Math.abs(geometry.distanceMeters(point, vertex) - distance) < 0.01,
            'Boundary must lie at a constant geographic radius in metres'
        );
    }
}

testCircle(center, radius, 96);
testCircle([24, 75], 10000, 64);
testCircle([0, 0], 100, 16);
testCircle([-5, -40], 100000, 128);

for (const [point, distance, segments] of [
    [[181, 20], 1000, 96],
    [[20, 90], 1000, 96],
    [[20, 20], -1, 96],
    [[20, 20], 100001, 96],
    [[20, 20], NaN, 96],
    [[20, 20], 5000, 8]
])
{
    assert.throws(() => geometry.geodesicCircle(point, distance, segments), RangeError);
}

assert.equal(geometry.distanceMeters(center, center), 0);
assert.ok(geometry.distanceMeters([0, 0], [0, 1]) > 111000);

const html = read('src/experiments/maplibre-poc/index.html');
const js = read('src/experiments/maplibre-poc/poc.js');
const css = read('src/experiments/maplibre-poc/poc.css');
const main = read('src/index.html');

assert.ok(html.indexOf('geometry.js') < html.indexOf('poc.js'), 'Geometry must load first');
assert.match(html, /poc\.css/);
assert.match(html, /maplibre-gl@6\.16\.0\/dist\/maplibre-gl\.css/);
assert.match(js, /maplibre-gl@6\.16\.0\/dist\/maplibre-gl\.mjs/);
assert.match(js, /tiles\.openfreemap\.org\/styles\/liberty/);
assert.match(js, /window\.location\.protocol === 'file:'/);
assert.match(js, /sessionStorage/);
assert.match(js, /ResizeObserver/);
assert.match(js, /map\.on\('style\.load'/);
assert.match(js, /map\.on\('error'/);
assert.match(js, /geo\.geodesicCircle/);
assert.doesNotMatch(js, /api\.maptiler\.com|leaflet/ig);
assert.doesNotMatch(main, /maplibre-poc|maplibre-gl@/);
assert.doesNotMatch(css, /#[\da-f]{3}(?:[\da-f]{3})?\b/i);

for (const [filename, data] of [
    ['index.html', html], ['poc.js', js], ['poc.css', css],
    ['geometry.js', read('src/experiments/maplibre-poc/geometry.js')]
])
{
    assert.ok(data.endsWith('\n'), filename + ' must end with a newline');
    assert.ok(!data.includes('\r'), filename + ' must use LF line endings');
}

console.log('MapLibre PoC: geodesic geometry and isolation checks passed.');
