'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ELK = require('../src/vendor/elkjs-0.12.1/lib/elk.bundled.js');
const context = vm.createContext({ performance });
const moduleDir = path.join(__dirname, '../src/modules/family-tree');
for (const file of ['tree-geometry.js', 'tree-elk-model.js'])
    vm.runInContext(fs.readFileSync(path.join(moduleDir, file), 'utf8'), context);

const EPS = .02;
const refine = context.refineElkTreeCentering;
let compact = true;
// Suppress only the final objective for the matched reference solve, in this test VM.
context.refineElkTreeCentering = (...args) => refine(...(compact ? args : args.slice(0, 6)));

function fixture(sides, descendants = false)
{
    const people = [], families = [], branches = [];
    const add = (id, generation, gender) =>
    {
        people.push({ id, generation, gender, width: 300, height: 124 });
        return id;
    };
    const family = (id, parents, children) => families.push({ id, parents, children });
    const depth = 5;
    add('R', depth, 'male');
    add('S', depth, 'female');
    const children = descendants ? [add('D', depth + 1, 'female')] : [];
    family('focus', ['R', 'S'], children);
    if (descendants)
    {
        const mate = add('DM', depth + 1, 'male');
        family('descendant', [mate, 'D'], [add('G', depth + 2, 'male')]);
        family('mate-parents', [add('DMF', depth, 'male'), add('DMM', depth, 'female')], [mate]);
    }
    function ancestors(child, generation)
    {
        if (!generation) return;
        const father = add(child + 'F', generation - 1, 'male');
        const mother = add(child + 'M', generation - 1, 'female');
        family('parents:' + child, [father, mother], [child]);
        ancestors(father, generation - 1);
        ancestors(mother, generation - 1);
    }
    ancestors('R', depth);
    const protectedIds = people.map(p => p.id);
    for (const side of sides)
    {
        const sibling = 'R' + side;
        const parental = families.find(f => f.children.includes(sibling));
        for (let i = 0; i < 3; i++)
        {
            const root = add(side + 'collateral' + i, depth - 1, i % 2 ? 'female' : 'male');
            const mate = add(root + 'Mate', depth - 1, i % 2 ? 'male' : 'female');
            const child = add(root + 'Child', depth, 'male');
            const childMate = add(child + 'Mate', depth, 'female');
            const grandchild = add(child + 'Grandchild', depth + 1, 'female');
            parental.children.push(root);
            family('union:' + root, i % 2 ? [mate, root] : [root, mate], [child]);
            family('union:' + child, [child, childMate], [grandchild]);
            branches.push({ side, sibling, root, ids: [root, mate, child, childMate, grandchild] });
        }
    }
    return { people, families, protectedIds, branches };
}

(async () =>
{
    const elk = new ELK();
    let cases = 0;
    for (const direction of ['DOWN', 'RIGHT'])
        for (const [sides, descendants] of [['', false], ['F', false], ['M', false], ['FM', false], ['FM', true]])
        {
            const { people, families, protectedIds, branches } = fixture(sides, descendants);
            const axis = direction === 'DOWN' ? 'x' : 'y';
            const depthAxis = direction === 'DOWN' ? 'y' : 'x';
            const extent = direction === 'DOWN' ? 'w' : 'h';
            const solve = async enabled =>
            {
                compact = enabled;
                let calls = 0, reroutes = 0;
                const layout = await context.solveElkTree(people, families, direction, graph =>
                {
                    calls++;
                    return elk.layout(JSON.parse(JSON.stringify(graph)));
                }, 'R', (stage, fn) =>
                {
                    if (stage === 'centeringReroute') reroutes++;
                    return fn();
                });
                assert.equal(layout.issues.length, 0, layout.issues.join('; '));
                assert.ok(calls <= 2);
                assert.equal(calls, layout.passes);
                return { layout, calls, reroutes };
            };
            const before = await solve(false), after = await solve(true);
            assert.equal(after.calls, before.calls);
            assert.ok(after.reroutes - before.reroutes <= 24);
            const old = new Map(before.layout.boxes.map(b => [b.id, b]));
            const next = new Map(after.layout.boxes.map(b => [b.id, b]));
            assert.equal(next.size, old.size);
            for (const id of protectedIds) assert.deepEqual(next.get(id), old.get(id), 'Main branch moved: ' + id);
            for (const p of people)
            {
                const a = old.get(p.id), b = next.get(p.id);
                assert.equal(b[depthAxis], a[depthAxis]);
                assert.equal(b.w, a.w);
                assert.equal(b.h, a.h);
            }
            const movedSides = new Set();
            for (const branch of branches)
            {
                const shift = next.get(branch.root)[axis] - old.get(branch.root)[axis];
                const anchor = old.get(branch.sibling)[axis];
                const start = old.get(branch.root)[axis];
                assert.ok(Math.abs(next.get(branch.root)[axis] - anchor) <= Math.abs(start - anchor) + EPS);
                for (const id of branch.ids)
                    assert.ok(Math.abs(next.get(id)[axis] - old.get(id)[axis] - shift) <= EPS, 'Subtree must move rigidly');
                if (Math.abs(shift) > EPS) movedSides.add(shift > 0 ? 'F' : 'M');
            }
            if (!descendants)
                for (const side of ['F', 'M']) assert.equal(movedSides.has(side), sides.includes(side));
            for (const a of people)
                for (const b of people)
                {
                    if (a.generation !== b.generation || old.get(a.id)[axis] >= old.get(b.id)[axis]) continue;
                    const gap = old.get(b.id)[axis] - old.get(a.id)[axis] - old.get(a.id)[extent];
                    const newGap = next.get(b.id)[axis] - next.get(a.id)[axis] - next.get(a.id)[extent];
                    assert.ok(newGap >= Math.min(40, Math.max(0, gap)) - EPS, 'Group order or clearance changed');
                }
            const conflicts = context.elkCenteringConflicts(before.layout, axis);
            for (const [key, count] of context.elkCenteringConflicts(after.layout, axis))
                assert.ok(count <= (conflicts.get(key) || 0), 'New routing conflict: ' + key);
            const edgeIds = layout => [...new Set(layout.paths.map(p => p.id))].sort();
            assert.deepEqual(edgeIds(after.layout), edgeIds(before.layout));
            cases++;
        }
    console.log('Collateral compaction: ' + cases + ' matched layouts passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
