'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../../src/modules/family-tree/tree-elk-model.js'), 'utf8');
const start = source.indexOf('    function allocateUnifiedRails(');
const end = source.indexOf('    function planDynamicSpacing(', start);
const allocate = vm.runInNewContext(
    '(peopleById, entries, cards) => { ' + source.slice(start, end) + 'return allocateUnifiedRails(entries, cards); }');

function route(spec)
{
    const people = new Map();
    const entries = spec.map(([id, trunk, ...drops]) =>
    {
        const parents = [id + ':p'], children = drops.map((_, index) => id + ':c' + index);
        people.set(parents[0], { generation: 0 });
        children.forEach(child => people.set(child, { generation: 1 }));
        return { f: { id, parents, children }, u: trunk, v: 0, rail: 160,
            targets: drops.map((u, index) => ({ person: children[index], target: { u, v: 300 } })) };
    });
    const cards = [...people].map(([id, person]) => ({ id, v: person.generation ? 300 : 0, h: 100 }));
    const [band] = allocate(people, entries, cards);
    const points = entries.flatMap(entry => entry.targets.map(({ target }) => ({
        id: entry.f.id, points: [[entry.u, entry.v], [entry.u, entry.rail], [target.u, entry.rail], [target.u, target.v]]
    })));
    const segments = points.flatMap(({ id, points }) => points.slice(1).map(([x, y], index) =>
    {
        const [a, b] = points[index];
        return { id, x1: Math.min(a, x), x2: Math.max(a, x), y1: Math.min(b, y), y2: Math.max(b, y) };
    }));
    const conflicts = new Set();
    for (const [i, a] of segments.entries())
        for (const b of segments.slice(i + 1))
            if (a.id !== b.id && Math.max(a.x1, b.x1) <= Math.min(a.x2, b.x2)
                && Math.max(a.y1, b.y1) <= Math.min(a.y2, b.y2))
                conflicts.add([a.id, b.id].sort().join('/'));
    assert.ok(entries.every(entry => entry.rail >= 108 && entry.rail <= 292));
    return { conflicts: [...conflicts].sort(), slots: JSON.parse(JSON.stringify(band.levels)) };
}

const independent = [['a', 0, 40], ['b', 20, 60], ['c', 140, 100], ['d', 160, 120]];
const routed = route(independent);
assert.deepEqual(routed.conflicts, []);
assert.equal(routed.slots.length, 2);
assert.deepEqual(route([...independent].reverse()), routed);
assert.deepEqual(route(independent.map(([id, ...xs]) => [id, ...xs.map(x => -x)])).conflicts, []);
assert.equal(route([['a', 0, 10], ['b', 18, 28]]).slots.length, 1);
assert.equal(route([['a', 0, 10], ['b', 17.99, 28]]).slots.length, 1);
assert.equal(route([['a', 0, 10], ['b', 17.95, 28]]).slots.length, 2);
assert.deepEqual(route([['a', 0, 10], ['b', 0, 28]]).conflicts, ['a/b']);
const transitive = route([['a', 0, 40], ['b', 20, 60], ['c', 50, 85], ['x', 200, 240]]);
assert.equal(transitive.slots.length, 2);
assert.deepEqual(transitive.conflicts, ['a/b']);
const mixed = route([...independent, ['x', 200, 260], ['y', 210, 270], ['z', 220, 280], ['isolated', 330, 350]]);
assert.equal(mixed.slots.length, 3);
assert.deepEqual(mixed.conflicts, []);
const dense = Array.from({ length: 14 }, (_, index) => ['dense-' + index, index * 10, 210 - index, 260 + index]);
const denseResult = route(dense);
assert.equal(denseResult.slots.length, 14);
assert.ok(denseResult.conflicts.length > 0);
assert.deepEqual(route([...dense].reverse()), denseResult);
console.log('Descendant rail intersections, clearance, shared levels and dense determinism passed.');
