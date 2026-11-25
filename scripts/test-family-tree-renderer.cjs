'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const context = vm.createContext({ TREE_GEOMETRY: { connectorLaneGap: 16 } });
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
console.log('Tree Fit, spanning culling, rounded terminals, square junctions and underpasses passed.');
