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
