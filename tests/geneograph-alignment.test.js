const assert = require('node:assert/strict');
const { geneoCalculateAlignment, geneoLayerRangeIds, geneoAxisLockForMove } = require('../src/geneograph-alignment.js');

const moving = [{ id: 'moving', x: 10, y: 20, width: 40, height: 30 }];
const target = { id: 'target', x: 100, y: 80, width: 40, height: 30 };
const calculate = options => geneoCalculateAlignment({ movingNodes: moving, targets: [target],
    dx: 0, dy: 0, zoom: 1, ...options });

const edges = calculate({ dx: 86, dy: 56, fallbackDx: 80, fallbackDy: 60 });
assert.equal(edges.dx, 90);
assert.equal(edges.dy, 60);
assert.equal(edges.guides.x.position, 100);
assert.equal(edges.guides.y.position, 80);

const center = calculate({ dx: 91, dy: 61 });
assert.equal(center.dx, 90);
assert.equal(center.dy, 60);

const noMatch = calculate({ dx: 25, dy: 25, fallbackDx: 20, fallbackDy: 20 });
assert.equal(noMatch.dx, 20);
assert.equal(noMatch.dy, 20);
assert.equal(noMatch.guides.x, null);

const offGrid = calculate({ dx: 86, dy: 25, fallbackDx: 80, fallbackDy: 20 });
assert.equal(offGrid.dx, 90);
assert.equal(offGrid.dy, 20);

const group = geneoCalculateAlignment({
    movingNodes: [...moving, { id: 'second', x: 50, y: 20, width: 20, height: 30 }],
    targets: [{ id: 'second', x: 50, y: 20, width: 20, height: 30 }, { ...target, x: 40 }],
    dx: 29, dy: 25, zoom: 1
});
assert.equal(group.dx, 30);
assert.equal(group.matches.x.key, 'target:start');

assert.equal(calculate({ dx: 86, dy: 56, targets: [{ ...target, visible: false }] }).guides.x, null);
assert.equal(calculate({ dx: 86, dy: 56, targets: [{ ...target, locked: true }] }).dx, 90);
assert.equal(calculate({ dx: 80, dy: 25, zoom: .25, previous: { x: { key: 'target:start' } } }).dx, 90);
assert.equal(calculate({ dx: 84, dy: 25, zoom: 2 }).guides.x, null);

const leftPerson = { id: 'left', type: 'person', x: 0, y: 20, width: 40, height: 40 };
const rightPerson = { id: 'right', type: 'person', x: 100, y: 20, width: 40, height: 40 };
const between = geneoCalculateAlignment({
    movingNodes: [{ id: 'image', type: 'image', x: 0, y: 30, width: 20, height: 20 }],
    targets: [leftPerson, rightPerson], dx: 59, dy: 0, zoom: 1
});
assert.equal(between.dx, 60);
assert.equal(between.guides.x.position, 70);
assert.equal(between.matches.x.key, 'midpoint:x:left:right');

const vertical = geneoCalculateAlignment({
    movingNodes: [{ id: 'sticky', type: 'sticky', x: 30, y: 0, width: 20, height: 20 }],
    targets: [
        { id: 'top', type: 'person', x: 20, y: 0, width: 40, height: 40 },
        { id: 'bottom', type: 'person', x: 20, y: 100, width: 40, height: 40 }
    ], dx: 0, dy: 59, zoom: 1
});
assert.equal(vertical.dy, 60);
assert.equal(vertical.guides.y.position, 70);

const noMidpoint = overrides => geneoCalculateAlignment({
    movingNodes: [{ id: 'image', type: 'image', x: 0, y: 30, width: 20, height: 20 }],
    targets: [leftPerson, { ...rightPerson, ...overrides }], dx: 59, dy: 0, zoom: 1
});
assert.equal(noMidpoint({ type: 'shape' }).guides.x, null);
assert.equal(noMidpoint({ y: 100 }).guides.x, null);
assert.notEqual(noMidpoint({ x: 50 }).matches.x?.key, 'midpoint:x:left:right');
assert.equal(noMidpoint({ visible: false }).guides.x, null);

assert.equal(calculate({ dx: 86, dy: 56, targets: [{ ...target, type: 'drawing' }] }).guides.x, null);
assert.equal(calculate({ dx: 86, dy: 56, movingNodes: [{ ...moving[0], type: 'drawing' }] }).guides.x, null);
const locked = calculate({ dx: 86, dy: 56, fallbackDx: 80, fallbackDy: 0, lockedAxis: 'y' });
assert.equal(locked.dx, 90);
assert.equal(locked.dy, 0);
assert.equal(locked.guides.y, null);
const verticalLock = calculate({ dx: 86, dy: 56, fallbackDx: 0, fallbackDy: 60, lockedAxis: 'x' });
assert.equal(verticalLock.dx, 0);
assert.equal(verticalLock.dy, 60);
assert.equal(verticalLock.guides.x, null);

assert.deepEqual(geneoLayerRangeIds(['a', 'b', 'c', 'd'], 'b', 'd'), ['b', 'c', 'd']);
assert.deepEqual(geneoLayerRangeIds(['a', 'b', 'c', 'd'], 'd', 'b'), ['b', 'c', 'd']);
assert.deepEqual(geneoLayerRangeIds(['a', 'c'], 'b', 'c'), ['c']);
assert.equal(geneoAxisLockForMove(null, true, 10, 4), 'y');
assert.equal(geneoAxisLockForMove('y', true, 4, 12), 'y');
assert.equal(geneoAxisLockForMove('y', false, 4, 12), null);
assert.equal(geneoAxisLockForMove(null, true, 4, 12), 'x');

console.log('Geneograph alignment geometry passed');
