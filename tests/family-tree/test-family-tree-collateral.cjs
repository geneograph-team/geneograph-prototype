'use strict';

function collateralFixture(depth = 6)
{
    const people = new Set(), families = [];
    function add(id, left, right, ...children)
    {
        [left, right, ...children].filter(Boolean).forEach(person => people.add(person));
        families.push({ id, left: left || '', right: right || '', children });
    }
    add('parents', 'P', 'M', 'F', 'S');
    add('half', 'P', 'Other', 'H');
    add('paternal', 'PG', 'PM', 'P', 'U');
    add('maternal', 'MG', 'MM', 'M', 'A');
    add('older', 'GG', 'GM', 'PG', 'Far');
    add('far-house', 'Far', null, 'FarChild');
    add('spouse-ancestry', 'OutsideParent', null, 'SMate');
    add('spouse-house', 'SMate', 'OutsidePartner', 'OutsideChild');
    add('empty-house', 'H', 'ChildlessMate');
    for (const root of ['F', 'S', 'H', 'U', 'A'])
    {
        for (let level = 0; level < depth; level++)
            add(root + '-house-' + level, level ? root + level : root, level ? root + 'Mate' + level : root + 'Mate', root + (level + 1));
    }
    return { people: [...people].map(id => ({ id, name: id })), families };
}

if (require.main === module)
{
    const assert = require('node:assert/strict');
    const fs = require('node:fs');
const path = require('node:path');
    const vm = require('node:vm');
    const source = fs.readFileSync(path.join(__dirname, '../../src/core/state-tree-core.js'), 'utf8');
    const context = vm.createContext({ clampNumber: (n, min, max) => Math.min(max, Math.max(min, n)) });
    vm.runInContext(source.slice(source.indexOf('function currentTreePeople('), source.indexOf('const topbar =')), context);
    const { people, families } = collateralFixture();
    const project = (ancestorGenerations, descendantGenerations, showCousins, p = people, f = families) =>
        context.buildFamilyTreeProjection(p, f, { focusPersonId: 'F', ancestorGenerations, descendantGenerations, showCousins });
    const original = JSON.stringify({ people, families });
    for (const a of [0, 1, 2, 6])
        for (const d of [0, 1, 2, 3, 5])
            for (const cousins of [false, true])
            {
                const projection = project(a, d, cousins);
                const selected = new Set(projection.people.map(person => person.id));
                const roots = ['F', ...(a >= 1 ? ['S', 'H'] : []), ...(a >= 2 && cousins ? ['U', 'A'] : [])];
                const expectedFamilies = new Set([
                    ...(a >= 1 ? ['parents', 'half', 'empty-house'] : []),
                    ...(a >= 2 ? ['paternal', 'maternal'] : []),
                    ...(a >= 3 ? ['older'] : [])
                ]);
                for (const root of ['F', 'S', 'H', 'U', 'A'])
                {
                    const eligible = roots.includes(root);
                    assert.equal(selected.has(root), eligible);
                    for (let level = 0; level < 6; level++)
                    {
                        assert.equal(selected.has(root + (level + 1)), eligible && level < d);
                        assert.equal(selected.has(root + 'Mate' + (level || '')), eligible && (level === 0 || level < d));
                        if (eligible && (level === 0 || level < d)) expectedFamilies.add(root + '-house-' + level);
                    }
                }
                for (const id of ['Far', 'FarChild', 'OutsideParent', 'OutsidePartner', 'OutsideChild'])
                    assert.equal(selected.has(id), false);
                assert.deepEqual([...projection.families.map(family => family.id)].sort(), [...expectedFamilies].sort());
                for (const family of projection.families)
                {
                    if (d === 0 && family.id.includes('-house-')) assert.equal(family.children.length, 0);
                    if (a >= 2 && !cousins && family.id === 'paternal')
                        assert.equal(family.children.join(), 'P');
                }
            }
    // A projected single child is not necessarily the only recorded child.
    const narrow = project(2, 0, false);
    const paternal = narrow.families.find(family => family.id === 'paternal');
    assert.equal(paternal.children.join(), 'P');
    assert.equal(paternal.recordedChildCount, 2);
    const hiddenAncestry = project(1, 0, false, people, [...families,
        { id: 'hidden-mate-parents', left: 'OutsideParent', right: '', children: ['FMate'] }]);
    assert.equal(hiddenAncestry.visiblePersonIds.has('FMate'), true);
    assert.equal(hiddenAncestry.visiblePersonIds.has('OutsideParent'), false);
    assert.equal(hiddenAncestry.branchRoles.recordedParentFamilyCountByPerson.get('FMate'), 1);
    assert.equal(narrow.branchRoles.recordedParentFamilyCountByPerson.get('FMate'), 0);
    assert.equal(JSON.stringify({ people, families }), original);

    // S is both a branch root and independently encountered through F's descendants.
    // Its larger root budget must survive the merge, even with a cycle in the input.
    const overlap = [...families, { id: 'overlap', left: 'F1', right: '', children: ['S'] },
        { id: 'cycle', left: 'F2', right: '', children: ['F1'] }];
    const merged = project(1, 3, false, people, overlap);
    assert.equal(merged.visiblePersonIds.has('S3'), true);
    assert.equal(merged.visiblePersonIds.has('S4'), false);
    assert.equal(merged.families.find(family => family.id === 'cycle').children.join(), 'F1');

    // A child visible as somebody else's partner does not authorize an excluded child edge.
    const zero = project(1, 0, false, people, [...families,
        { id: 'coincidental', left: 'F', right: 'S1', children: [] }]);
    assert.equal(zero.visiblePersonIds.has('S1'), true);
    assert.equal(zero.families.find(family => family.id === 'S-house-0').children.length, 0);

    // Deep synthetic projection with many independently eligible branches.
    const broad = collateralFixture(9);
    for (let i = 0; i < 500; i++)
    {
        const root = 'extra-' + i;
        broad.families.find(family => family.id === 'parents').children.push(root);
        broad.people.push({ id: root });
        for (let level = 0; level < 8; level++)
        {
            const child = root + '-' + (level + 1);
            broad.people.push({ id: child });
            broad.families.push({ id: root + '-family-' + level, left: level ? root + '-' + level : root, children: [child] });
        }
    }
    const now = performance.now();
    const large = project(6, 5, true, broad.people, broad.families);
    assert.equal(large.visiblePersonIds.has('extra-499-5'), true);
    assert.equal(large.visiblePersonIds.has('extra-499-6'), false);
    console.log(JSON.stringify({ cases: 40, sourcePeople: broad.people.length, sourceFamilies: broad.families.length,
        visiblePeople: large.people.length, visibleFamilies: large.families.length, projectionMs: +(performance.now() - now).toFixed(2) }));
}

module.exports = collateralFixture;
