'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function makeFixture(count, deep, bothSides, children = true)
{
    const ids = new Set();
    const families = [];
    const add = (id, parents, kids) =>
    {
        [...parents, ...kids].forEach(id => ids.add(id));
        families.push({ id, parents, children: kids });
    };
    add('root', ['ancestor-a', 'ancestor-b'], ['hub', 'collateral']);
    add('collateral-family', ['collateral', 'collateral-spouse'], ['collateral-child']);
    add('principal', ['hub', 'principal'], children ? ['principal-child'] : []);
    for (let i = 1; i < count; i++)
    {
        const hub = bothSides && i % 2 === 0 ? 'principal' : 'hub';
        const childIds = children ? Array.from({ length: i % 3 + 1 }, (_, j) => 'c-' + i + '-' + j) : [];
        add('extra-' + i, [hub, 'partner-' + i], childIds);
        if (deep && childIds.length)
            add('desc-' + i, [childIds[0], 'desc-partner-' + i], ['grand-' + i, 'grand-other-' + i]);
    }
    return { people: [...ids].map(id => ({ id, gender: id.includes('partner') || id === 'principal' ? 'female' : 'male' })), families, focusId: 'hub' };
}

const context = vm.createContext({});
for (const file of ['vendor/d3-7.9.0.min.js', 'vendor/family-chart-0.9.0-context.js', 'core/validation.js', 'modules/family-tree/tree-native-input.js'])
{
    const filename = path.join(__dirname, '../src', file);
    vm.runInContext(fs.readFileSync(filename, 'utf8'), context, { filename });
}
const config = { cardWidth: 300, cardHeight: 124, laneGap: 16 };

function calculate(fixture, horizontal, enable = true)
{
    const canonical = fixture.families.map(family => ({ id: family.id, left: family.parents[0], right: family.parents[1], children: family.children }));
    const data = context.buildNativeFamilyChartInput(fixture.people, canonical, { contextual: true });
    return context.f3.CalculateTree({ data: data.data, main_id: fixture.focusId, is_horizontal: horizontal,
        node_separation: 356, level_separation: 189, single_parent_empty_card: false,
        show_siblings_of_main: true, family_contexts: data.familyContexts, household_grid: enable ? config : undefined });
}

function snapshot(tree)
{
    return JSON.stringify({ nodes: tree.data.map(node => [node.tid, node.x, node.y]),
        links: tree.householdGrid?.links?.map(link => [link.id, link.gridPaths]) });
}

function verify(tree, fixture)
{
    const grid = tree.householdGrid;
    assert.equal(grid.status, 'applied', grid.reason);
    assert.equal(new Set(tree.data.map(node => node.data.id)).size, fixture.people.length);
    for (const key of ['cardOverlaps', 'cardHits', 'coincident', 'falseJunctions', 'disconnected'])
        assert.equal(grid.diagnostics[key], 0, key);
    for (const family of fixture.families)
    {
        const partnership = grid.links.find(link => link.familyContextId === family.id && link.spouse);
        if (family.parents.length === 2)
        {
            assert.ok(partnership, family.id);
            assert.equal(JSON.stringify([partnership.source.data.id, partnership.target.data.id].sort()), JSON.stringify([...family.parents].sort()));
        }
        for (const child of family.children)
        {
            const link = grid.links.find(link => link.familyContextId === family.id && !link.spouse && link.source.data.id === child);
            assert.ok(link, family.id + ':' + child);
            assert.equal(JSON.stringify([...new Set(link.target.map(node => node.data.id))].sort()), JSON.stringify([...family.parents].sort()));
        }
    }
}
let passed = 0;
for (const horizontal of [false, true])
    for (const both of [false, true])
        for (const count of [1, 2, 3, 4, 5])
            for (const deep of [false, true])
                for (const children of [false, true])
                {
                    const fixture = makeFixture(count, deep, both, children);
                    const original = JSON.stringify(fixture);
                    const tree = calculate(fixture, horizontal);
                    verify(tree, fixture);
                    assert.equal(JSON.stringify(fixture), original);
                    assert.equal(snapshot(tree), snapshot(calculate(fixture, horizontal)));
                    passed++;
                }
assert.equal(passed, 80);
const control = { people: [{ id: 'a', gender: 'male' }, { id: 'b', gender: 'female' }, { id: 'c', gender: 'male' }],
    families: [{ id: 'f', parents: ['a', 'b'], children: ['c'] }], focusId: 'c' };
for (const horizontal of [false, true])
{
    const tree = calculate(control, horizontal);
    assert.equal(tree.householdGrid.status, 'native');
    assert.equal(snapshot(tree), snapshot(calculate(control, horizontal, false)));
    const samePair = makeFixture(3, true, true, true);
    samePair.people.push({ id: 'another-child', gender: 'male' });
    samePair.families.push({ id: 'same-pair-family', parents: ['hub', 'principal'], children: ['another-child'] });
    verify(calculate(samePair, horizontal), samePair);
    const multipleParents = makeFixture(3, true, true, true);
    multipleParents.people.push({ id: 'adoptive', gender: 'male' });
    multipleParents.families.push({ id: 'other-parent-family', parents: ['adoptive'], children: ['principal-child'] });
    verify(calculate(multipleParents, horizontal), multipleParents);
}
console.log('80 grid cases, four additional family-context probes and two unchanged native controls passed.');
