'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const context = vm.createContext({});
for (const file of [
    'vendor/d3-7.9.0.min.js',
    'vendor/family-chart-0.9.0-context.js',
    'core/validation.js',
    'modules/family-tree/tree-native-input.js'
])
{
    const filename = path.join(__dirname, '../src', file);
    vm.runInContext(fs.readFileSync(filename, 'utf8'), context, { filename });
}

const people = [
    { id: 'father', gender: 'male' },
    { id: 'mother', gender: 'female' },
    { id: 'child', gender: 'unknown' },
    { id: 'sibling', gender: 'female' }
];
const families = [{ id: 'family', left: 'father', right: 'mother', children: ['child', 'sibling'] }];
const original = JSON.stringify([people, families]);
for (const isHorizontal of [false, true])
{
    const input = context.buildNativeFamilyChartInput(people, families);
    const layout = context.f3.CalculateTree({
        data: input.data,
        main_id: 'child',
        is_horizontal: isHorizontal,
        single_parent_empty_card: false,
        show_siblings_of_main: true
    });
    assert.equal(layout.is_horizontal, isHorizontal);
    assert.equal(layout.data.length, 4);
    assert.equal(input.data.find(person => person.id === 'child').data.gender, '');
    assert.equal(JSON.stringify([people, families]), original);
}

for (const [expected, extra] of [
    ['multiple-parent-families', { id: 'adoptive', left: 'father', children: ['child'] }],
    ['multiple-families-for-partners', { id: 'another', left: 'mother', right: 'father', children: [] }],
    ['parentless-family', { id: 'no-parents', children: ['father'] }],
    ['missing-person', { id: 'missing', left: 'unknown-person', children: ['father'] }],
    ['parent-cycle', { id: 'cycle', left: 'child', children: ['father'] }]
])
{
    const result = context.buildNativeFamilyChartInput(people, [...families, extra]);
    assert.equal(result.data, null);
    assert.ok(result.issues.some(issue => issue.type === expected), expected);
}

console.log('Family Chart native orientations, detached source data, and unsupported relationship guards passed.');

const contextPeople = [...people, { id: 'stepParent' }, { id: 'otherChild' }, { id: 'adoptiveParent' }];
const contexts = [
    ...families,
    { id: 'other-household', left: 'father', right: 'stepParent', children: ['otherChild'] },
    { id: 'adoptive', left: 'adoptiveParent', children: ['child'] }
];
const untouched = JSON.stringify([contextPeople, contexts]);
for (const isHorizontal of [false, true])
{
    const input = context.buildNativeFamilyChartInput(contextPeople, contexts, { contextual: true });
    assert.ok(input.data);
    const tree = context.f3.CalculateTree({
        data: input.data,
        main_id: 'child',
        is_horizontal: isHorizontal,
        single_parent_empty_card: false,
        show_siblings_of_main: true,
        family_contexts: input.familyContexts
    });
    const visible = new Set(tree.data.map(node => node.data.id));
    assert.equal(visible.size, contextPeople.length);
    const childLink = tree.contextLinks.find(link => link.familyContextId === 'adoptive');
    assert.equal(childLink.source.data.id, 'child');
    assert.ok(childLink.target.every(parent => parent.data.id === 'adoptiveParent'));
    const biological = tree.contextLinks.find(link => link.familyContextId === 'family' && link.source.data.id === 'child');
    assert.equal(Array.from(biological.target, node => node.data.id).sort().join(','), 'father,mother');
    assert.equal(JSON.stringify([contextPeople, contexts]), untouched);
}

const householdPeople = [...people, ...['partner', 'stepParent', 'firstChild', 'secondChild', 'halfSibling'].map(id => ({ id }))];
const householdFamilies = [
    ...families,
    { id: 'collateral', left: 'sibling', right: 'partner', children: ['firstChild', 'secondChild'] },
    { id: 'second', left: 'father', right: 'stepParent', children: ['halfSibling'] }
];
for (const isHorizontal of [false, true])
{
    const input = context.buildNativeFamilyChartInput(householdPeople, householdFamilies, { contextual: true });
    const tree = context.f3.CalculateTree({
        data: input.data,
        main_id: 'child',
        is_horizontal: isHorizontal,
        single_parent_empty_card: false,
        show_siblings_of_main: true,
        family_contexts: input.familyContexts
    });
    const across = isHorizontal ? 'y' : 'x';
    const depth = isHorizontal ? 'x' : 'y';
    const card = id => tree.data.find(node => node.data.id === id);
    const [sibling, partner] = ['sibling', 'partner'].map(card);
    const baseline = context.f3.CalculateTree({
        data: context.buildNativeFamilyChartInput(people, families).data,
        main_id: 'child',
        is_horizontal: isHorizontal,
        single_parent_empty_card: false,
        show_siblings_of_main: true
    });
    const siblingOrder = nodes => Array.from(nodes)
        .filter(node => ['child', 'sibling'].includes(node.data.id))
        .sort((a, b) => a[across] - b[across]).map(node => node.data.id);
    assert.deepEqual(siblingOrder(tree.data), siblingOrder(baseline.data));
    const between = (coordinate, a, b) => coordinate > Math.min(a, b) && coordinate < Math.max(a, b);
    assert.ok(!tree.data.some(node => node[depth] === sibling[depth] && between(node[across], sibling[across], partner[across])));
    const childMidpoint = (card('firstChild')[across] + card('secondChild')[across]) / 2;
    assert.equal(childMidpoint, (sibling[across] + partner[across]) / 2);
    const halfSiblingLink = tree.contextLinks.find(link => link.familyContextId === 'second' && link.source.data.id === 'halfSibling');
    assert.equal(Array.from(halfSiblingLink.target, parent => parent.data.id).sort().join(','), 'father,stepParent');

    const reachable = new Set(['child']);
    for (const id of reachable)
    {
        for (const link of tree.contextLinks)
        {
            const endpoints = [link.source, link.target].flat().map(node => node.data.id);
            if (endpoints.includes(id)) endpoints.forEach(endpoint => reachable.add(endpoint));
        }
    }
    assert.equal(reachable.size, householdPeople.length);
}
