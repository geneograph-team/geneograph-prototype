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
    const canonical = id => layout.peopleById[id]?.canonicalPersonId || id;
    assert.deepEqual(new Set(layout.positionedPeople.map(person => canonical(person.id))), new Set(people.map(person => person.id)));
    assert.equal(new Set(layout.positionedPeople.map(person => person.id)).size, layout.positionedPeople.length);
    const counts = new Map();
    for (const person of layout.positionedPeople)
        counts.set(canonical(person.id), (counts.get(canonical(person.id)) || 0) + 1);
    for (const person of layout.positionedPeople)
    {
        const count = counts.get(canonical(person.id));
        assert.equal(person.occurrenceCount, count > 1 ? count : undefined);
    }
    assert.equal(JSON.stringify(layout.positionedPeople), JSON.stringify(second.positionedPeople));
    assert.equal(JSON.stringify(layout.connectorDescriptors), JSON.stringify(second.connectorDescriptors));
    assert.ok(!layout.testIssues.some(issue => ['node-node', 'missing-family-link'].includes(issue.type)));
    assert.deepEqual(new Set(layout.families.map(family => family.canonicalFamilyId || family.id)),
        new Set(families.map(family => family.id)));
    assert.equal(new Set(layout.families.map(family => family.id)).size, layout.families.length);
    // Verify coverage and reachability using routed family memberships
    // and distinct occurrence IDs, never shared canonical IDs as edges.
    const connected = new Map(layout.positionedPeople.map(person => [person.id, new Set()]));
    function connect(a, b)
    {
        if (!connected.has(a) || !connected.has(b)) return;
        connected.get(a).add(b);
        connected.get(b).add(a);
    }
    for (const family of families)
    {
        const contexts = layout.families.filter(item => (item.canonicalFamilyId || item.id) === family.id);
        assert.ok(contexts.length);
        assert.deepEqual(Array.from(contexts.flatMap(item => item.children), canonical).sort(),
            [...(family.children || [])].sort(), 'every canonical child membership is preserved exactly once');
        for (const rendered of contexts)
        {
            assert.equal(canonical(rendered.left), family.left);
            assert.equal(canonical(rendered.right), family.right);
            const edges = layout.connectorDescriptors.filter(edge => edge.familyId === rendered.id);
            if (rendered.left && rendered.right)
            {
                assert.ok(edges.some(edge => edge.role === 'partner'));
                connect(rendered.left, rendered.right);
            }
            if (rendered.left || rendered.right)
                for (const child of rendered.children)
                {
                    assert.ok(edges.some(edge => edge.childId === child));
                    connect(rendered.left || rendered.right, child);
                }
        }
    }
    const reached = new Set([focus]);
    for (const id of reached)
        for (const neighbor of connected.get(id)) reached.add(neighbor);
    assert.equal(reached.size, layout.positionedPeople.length);
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
    const baseline = context.calculateTestTreeLayout(people, families, focus, { branchRoles, allowRepetition: false });
    const layout = verify(people, families, focus, branchRoles);
    if (sharedAncestor)
    {
        assert.ok(baseline.testIssues.some(issue => issue.type === 'edge-crossing'));
        assert.equal(layout.positionedPeople.length, people.length + 1, 'one connected split is sufficient');
        assert.equal(layout.testIssues.length, 0);
        const repeated = layout.positionedPeople.filter(person => person.occurrenceCount === 2);
        assert.equal(repeated.length, 2);
        assert.ok(repeated.every(person => (person.canonicalPersonId || person.id) === 'focusLLLL'),
            'repeat the true converging ancestor, not focusL or another descendant');
    }
    else
    {
        assert.equal(layout.positionedPeople.length, people.length, 'no gratuitous repetition');
        assert.equal(layout.testIssues.length, 0);
    }
}

// Founder regression: Marianna and Stefan are siblings on different
// ancestral paths. Their shared father, not either child, must repeat.
// Both children belong to the same canonical family with unknown mother.
const convergencePeople = ['focus', 'left', 'right', 'marianna', 'stefan',
    'tomasz', 'stefanPartner', 'alexey', 'tomaszL', 'tomaszR'].map(id => ({ id }));
const convergenceFamilies = [
    { id: 'focus-parents', left: 'right', right: 'left', children: ['focus'] },
    { id: 'left-parents', left: 'tomasz', right: 'marianna', children: ['left'] },
    { id: 'right-parents', left: 'stefan', right: 'stefanPartner', children: ['right'] },
    { id: 'shared-father', left: 'alexey', right: '', children: ['marianna', 'stefan'] },
    { id: 'tomasz-parents', left: 'tomaszL', right: 'tomaszR', children: ['tomasz'] }
];
const convergenceRoles = {
    ancestorGenerations: 5,
    placeholderPersonIds: new Set(['marianna', 'stefan']),
    parentPresenceByPerson: new Map([
        ['marianna', { father: true, mother: false }],
        ['stefan', { father: true, mother: false }]
    ])
};
const convergenceBefore = context.calculateTestTreeLayout(convergencePeople, convergenceFamilies, 'focus',
    { branchRoles: convergenceRoles, allowRepetition: false });
assert.ok(convergenceBefore.testIssues.some(issue => issue.type === 'edge-crossing'));
const convergence = verify(convergencePeople, convergenceFamilies, 'focus', convergenceRoles);
assert.equal(convergence.testIssues.length, 0);
assert.equal(convergence.positionedPeople.length, convergencePeople.length + 1);
const repeatedFather = convergence.positionedPeople.filter(person => person.occurrenceCount === 2);
assert.equal(repeatedFather.length, 2);
assert.ok(repeatedFather.every(person => (person.canonicalPersonId || person.id) === 'alexey'));
assert.ok(!convergence.peopleById.marianna.occurrenceCount && !convergence.peopleById.stefan.occurrenceCount);
const fatherContexts = convergence.families.filter(family => (family.canonicalFamilyId || family.id) === 'shared-father');
assert.equal(fatherContexts.length, 2);
assert.deepEqual(new Set(fatherContexts.map(family => family.left)), new Set(repeatedFather.map(person => person.id)));
assert.deepEqual(Array.from(convergence.parentPlaceholders, node => node.rel).sort(), ['mother', 'mother'],
    'known father must never turn into an Add father placeholder');

// The exact same shared ancestor need not repeat when paths do not intersect.
const uncrossed = verify(convergencePeople.filter(person => !['tomaszL', 'tomaszR'].includes(person.id)),
    [{ ...convergenceFamilies[0], left: 'left', right: 'right' }, ...convergenceFamilies.slice(1, 4)],
    'focus', convergenceRoles);
assert.equal(uncrossed.positionedPeople.length, convergencePeople.length - 2);
assert.equal(uncrossed.testIssues.length, 0);

// Two partners on opposite sides; keep distinct family junctions and
// children in their own compact groups without unnecessary repetition.
const multiPeople = ['shared', 'partner-a', 'partner-b', 'a1', 'a2', 'b1'].map(id => ({ id }));
const multiFamilies = [
    { id: 'a', left: 'shared', right: 'partner-a', children: ['a1', 'a2'] },
    { id: 'b', left: 'shared', right: 'partner-b', children: ['b1'] }
];
const multi = verify(multiPeople, multiFamilies, 'shared');
assert.equal(multi.positionedPeople.length, multiPeople.length);
assert.equal(multi.testIssues.length, 0);
const mx = id => multi.peopleById[id].centerX;
assert.equal(mx('partner-a') - mx('shared'), 340);
assert.equal(mx('shared') - mx('partner-b'), 340);
assert.ok(mx('b1') < mx('a1') && mx('a1') < mx('a2'));
assert.ok(Math.abs((mx('a1') + mx('a2')) / 2 - (mx('shared') + mx('partner-a')) / 2) <= 8);
assert.ok(multi.connectorDescriptors.filter(edge => edge.role === 'partner')
    .every(edge => edge.points.every(point => point.y === edge.points[0].y)));
const balanced = verify(multiPeople.filter(person => person.id !== 'a2'),
    [{ ...multiFamilies[0], children: ['a1'] }, multiFamilies[1]], 'shared');
for (const family of multiFamilies)
{
    const a = balanced.peopleById[family.left].centerX;
    const b = balanced.peopleById[family.right].centerX;
    assert.ok(Math.abs(balanced.peopleById[family.children[0]].centerX - (a + b) / 2) <= 8);
}
// A split of this bridge household must not be accepted just because it
// would put its partner on a separate, shorter branch.
assert.equal(context.testTreeOccurrencesConnected(
    [...multiPeople, { id: 'shared-copy', canonicalPersonId: 'shared' }],
    [multiFamilies[0], { ...multiFamilies[1], left: 'shared-copy' }],
    'shared'), false);

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
