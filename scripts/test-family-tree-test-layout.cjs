'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { buildBranchFixture } = require('./test-family-tree-branch-layout.cjs');

const context = vm.createContext({
    console: { warn() {} }, state: { language: 'en' },
    document: { addEventListener() {} }
});
for (const filename of [
    'modules/family-tree/tree-layout.js',
    'vendor/d3-tidy-tree.js',
    'modules/family-tree/tree-test-layout.js',
    'modules/family-tree/tree-view.js'
])
{
    const source = path.join(__dirname, '../src', filename);
    vm.runInContext(fs.readFileSync(source, 'utf8'), context, { filename: source });
}

function verify(people, families, focus, branchRoles = {})
{
    const before = JSON.stringify({ people, families });
    const layout = context.calculateTestTreeLayout(people, families, focus, { branchRoles });
    const second = context.calculateTestTreeLayout(people, families, focus, { branchRoles });
    assert.equal(JSON.stringify({ people, families }), before, 'projection changed');
    assert.deepEqual(new Set(layout.positionedPeople.map(person => person.id)), new Set(people.map(person => person.id)));
    assert.equal(layout.positionedPeople.length, people.length);
    assert.equal(JSON.stringify(layout.positionedPeople), JSON.stringify(second.positionedPeople));
    assert.equal(JSON.stringify(layout.connectorDescriptors), JSON.stringify(second.connectorDescriptors));
    assert.ok(!layout.testIssues.some(issue => ['node-node', 'missing-family-link'].includes(issue.type)));
    for (const family of families)
    {
        const edges = layout.connectorDescriptors.filter(edge => edge.familyId === family.id);
        if (family.left && family.right) assert.ok(edges.some(edge => edge.role === 'partner'));
        if (family.left || family.right)
            for (const child of family.children || []) assert.ok(edges.some(edge => edge.childId === child));
    }
    return layout;
}

for (const depth of [0, 1, 3, 6])
{
    const people = [{ id: 'focus' }];
    const families = [];
    function add(child, remaining)
    {
        if (!remaining) return;
        const left = child + 'L';
        const right = child + 'R';
        people.push({ id: left }, { id: right });
        families.push({ id: 'parents-' + child, left, right, children: [child] });
        add(left, remaining - 1);
        add(right, remaining - 1);
    }
    add('focus', depth);
    const layout = verify(people, families, 'focus');
    assert.equal(layout.testIssues.length, 0, 'ordinary pedigree geometry');
    for (const family of families)
    {
        const a = layout.peopleById[family.left];
        const b = layout.peopleById[family.right];
        assert.equal(b.leftX - a.rightX, 40, 'compact partners');
    }
}
for (const sharedAncestor of [false, true])
{
    const { people, families, focus, branchRoles } = buildBranchFixture({ sharedAncestor });
    verify(people, families, focus, branchRoles);
}
const people = ['focus', 'partner', 'child', 'childPartner', 'grandchild'].map(id => ({ id }));
const families = [
    { id: 'household', left: 'focus', right: 'partner', children: ['child'] },
    { id: 'child-household', left: 'child', right: 'childPartner', children: ['grandchild'] }
];
const layout = verify(people, families, 'focus');
assert.equal(layout.peopleById.child.centerX,
    (layout.peopleById.focus.centerX + layout.peopleById.partner.centerX) / 2);
const placeholderLayout = verify(people, families, 'focus', {
    ancestorGenerations: 2, placeholderPersonIds: new Set(['focus', 'partner'])
});
assert.equal(placeholderLayout.parentPlaceholders.length, 4);
assert.throws(() => context.calculateTestTreeLayout(
    [{ id: 'focus' }, { id: 'unrelated' }], [], 'focus'), /disconnected/);

// The original solver remains independently callable.
const classic = context.calculateTreeLayout(people, families, 'focus');
assert.equal(classic.positionedPeople.length, people.length);
console.log('Experimental Family Tree layout checks passed.');
