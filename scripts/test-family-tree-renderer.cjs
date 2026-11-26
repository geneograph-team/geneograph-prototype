'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const context = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/modules/family-tree/tree-performance.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/modules/family-tree/tree-geometry.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/modules/family-tree/tree-renderer.js'), 'utf8'), context);
const point = (x, y) => ({ x, y });

const viewport = context.treeSceneViewport({ x: -40, y: 20, k: 2 }, 300, 200, 0);
assert.deepEqual(JSON.parse(JSON.stringify(viewport)), { left: 20, top: -10, right: 170, bottom: 90 });
const spanning = context.treeScenePathBounds([point(-100, 40), point(800, 40)]);
assert.ok(context.treeSceneIntersects(viewport, spanning));
const bounds = { left: -10, top: 8, right: 990, bottom: 408 };
const fit = context.treeSceneFit(bounds, 532, 332);
assert.equal(fit.k, .5);
assert.equal(bounds.left * fit.k + fit.x, 16);
assert.equal(bounds.right * fit.k + fit.x, 516);
assert.ok(bounds.top * fit.k + fit.y >= 16);
assert.ok(bounds.bottom * fit.k + fit.y <= 316);

const routes = [
    [point(100, 0), point(100, 40), point(0, 40), point(0, 100)],
    [point(100, 0), point(100, 40), point(140, 40), point(140, 100)],
    [point(100, 0), point(100, 40), point(200, 40), point(200, 100)]
];
const descriptors = paths => paths.map(points => ({ familyId: 'family', className: 'tree-line descendant', role: 'descendant', points }));
for (const horizontal of [false, true])
{
    const orientation = points => horizontal ? points.map(p => point(p.y, p.x)) : points;
    const geometry = context.treeSceneConnectors(descriptors(routes.map(orientation)), [], horizontal);
    assert.equal(geometry.flatMap(route => route.d.match(/ Q/g) || []).length, 2);
    assert.equal(geometry.length, 5);
    assert.ok(geometry.some(route => route.d === (horizontal ? 'M0 100 L40 100' : 'M100 0 L100 40')
        || route.d === (horizontal ? 'M40 100 L0 100' : 'M100 40 L100 0')));
    assert.ok(geometry.some(route => route.d === (horizontal ? 'M40 140 L100 140' : 'M140 40 L140 100')
        || route.d === (horizontal ? 'M100 140 L40 140' : 'M140 100 L140 40')));
}
const short = context.treeRoundedConnector([point(0, 0), point(2, 0), point(2, 10)], () => true);
assert.equal(short, 'M0 0 L2 0 L2 10');
const corner = [point(0, 0), point(20, 0), point(20, 20)];
assert.ok(context.treeSceneConnectors(descriptors([corner]), [{ left: 12, top: 2, right: 19, bottom: 9 }])[0].d.includes(' L20 0'));
const underpass = context.treeSceneConnectors([
    ...descriptors([[point(0, 50), point(100, 50)]]),
    { familyId: 'unrelated', className: 'tree-line descendant', role: 'descendant', points: [point(50, 0), point(50, 100)] }
], []);
assert.equal(underpass.find(route => route.familyId === 'family').d, 'M0 50 L42 50 M58 50 L100 50');
// Separate inline partner fragments must share one dash phase.
for (const horizontal of [false, true])
    for (const length of [20, 40, 63, 80])
        for (const reverse of [false, true])
        {
            const at = u => horizontal ? point(10, u) : point(u, 10);
            const center = length / 2;
            const make = (a, b, familyId, dashed, dashCenter = center) => ({
                familyId, role: 'partner', className: 'tree-line partner' + (dashed ? ' is-separated-or-divorced' : ''),
                points: (reverse ? [b, a] : [a, b]).map(at), dashCenter
            });
            const routes = context.treeSceneConnectors([
                make(0, center, 'divorced', true), make(center, length, 'divorced', true),
                make(-100, -60, 'divorced', true), make(0, length, 'married', false),
                ...descriptors([[at(0), at(length)]])
            ], [], horizontal);
            for (const route of routes.filter(route => route.familyId === 'divorced'))
            {
                const cross = horizontal ? 'y' : 'x';
                const start = route.points[0][cross], end = route.points.at(-1)[cross];
                const phase = ((route.dashOffset + Math.sign(end - start) * (center - start)) % 18 + 18) % 18;
                assert.ok(Math.abs(phase - 5) < .0001);
            }
            assert.equal(routes.find(route => route.familyId === 'married').dashOffset, null);
            assert.equal(routes.find(route => route.familyId === 'family').dashOffset, undefined);
        }
// Exercise the filter actually registered by the viewport, without a DOM.
let zoomFilter;
const behavior = Object.fromEntries(['extent', 'scaleExtent', 'touchable', 'clickDistance', 'on']
    .map(name => [name, () => behavior]));
behavior.filter = callback => { zoomFilter = callback; return behavior; };
const selection = { call: () => selection, on: () => selection };
const identity = { translate: () => identity, scale: k => ({ k }) };
context.d3 = { zoom: () => behavior, select: () => selection, zoomIdentity: identity };
context.state = { treeZoom: 100 };
context.ResizeObserver = class { observe() {} };
vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/modules/family-tree/tree-scroll.js'), 'utf8'), context);
const runtime = { canvas: { clientWidth: 800, clientHeight: 600 }, scene: {} };
context.bindTreeViewport(runtime);
const target = (...matches) => ({ closest: selectors => matches.some(match =>
    selectors.split(', ').includes(match)) ? {} : null });
const event = (type, target, extra = {}) => ({ type, target, button: 0, ctrlKey: false, ...extra });
for (const control of [target('button'), target('a'), target()])
{
    assert.ok(zoomFilter(event('wheel', control)));
    assert.ok(zoomFilter(event('wheel', control, { ctrlKey: true })));
}
for (const control of [target('button'), target('a')])
    for (const type of ['mousedown', 'touchstart'])
        assert.equal(zoomFilter(event(type, control)), false);
for (const control of [target('input'), target('select'), target('textarea'),
    target('[contenteditable="true"]'), target('.tree-layout-status'), target('button', '.tree-layout-status')])
    for (const type of ['wheel', 'mousedown', 'touchstart'])
        assert.equal(zoomFilter(event(type, control)), false);
assert.ok(zoomFilter(event('mousedown', target())));
assert.ok(zoomFilter(event('touchstart', target())));
assert.equal(zoomFilter(event('mousedown', target(), { button: 2 })), false);
assert.equal(zoomFilter(event('mousedown', target(), { ctrlKey: true })), false);
runtime.scene = null;
assert.equal(zoomFilter(event('wheel', target('button'))), false);
console.log('Tree Fit, spanning culling, rounded terminals, square junctions, underpasses, centered partner dashes and zoom filter passed.');
