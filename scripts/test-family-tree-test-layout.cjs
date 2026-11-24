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

// Partnership chain: a divorced couple and other partners on both
// sides. The central family anchors the orientation; no card repetition.
function buildPartnerChain(extraPartners, ancestorMode = 'none')
{
    const ids = ['A', 'B', 'M', 'MP', 'MM'];
    const families = [
        { id: 'center', left: 'A', right: 'B', children: ['M'], relationshipStatus: 'divorced' },
        { id: 'middle-child', left: 'MP', right: 'M', children: ['MM'] }
    ];
    for (let index = 1; index <= extraPartners; index++)
    {
        ids.push('X' + index, 'Y' + index, 'L' + index, 'R' + index,
            'LP' + index, 'RP' + index, 'LL' + index, 'RR' + index);
        families.push(
            { id: 'left' + index, left: 'A', right: 'X' + index, children: ['L' + index] },
            { id: 'right' + index, left: 'Y' + index, right: 'B', children: ['R' + index] },
            { id: 'left-child' + index, left: 'LP' + index, right: 'L' + index, children: ['LL' + index] },
            { id: 'right-child' + index, left: 'RP' + index, right: 'R' + index, children: ['RR' + index] }
        );
    }
    const parents = ancestorMode === 'all' ? ids.filter(id => /^(A|B|X\d+|Y\d+)$/.test(id))
        : ancestorMode === 'main' ? ['A', 'B'] : [];
    for (const id of parents)
    {
        ids.push(id + 'F', id + 'M');
        families.push({ id: 'parents-' + id, left: id + 'F', right: id + 'M', children: [id] });
    }
    // Input family ordering must not separate the central couple.
    families.push(families.shift());
    return { people: ids.map(id => ({ id })), families, focus: 'M',
        roles: { directAncestorIds: new Set(['A', 'B', 'AF', 'AM', 'BF', 'BM']),
            focusActionPersonIds: new Set(ids.filter(id => id !== 'M')) } };
}

for (const count of [1, 2, 3, 4])
{
    for (const ancestorMode of ['none', 'main', 'all'])
    {
        const fixture = buildPartnerChain(count, ancestorMode);
        const chain = verify(fixture.people, fixture.families, fixture.focus, fixture.roles);
        const x = id => chain.peopleById[id].centerX;
        assert.equal(chain.positionedPeople.length, fixture.people.length);
        assert.ok(chain.groupedHouseholds, 'independent secondary household planner used');
        assert.equal(x('B') - x('A'), 340, 'central divorced couple adjacent');
        assert.ok(x('A') - x('X1') >= 340);
        assert.ok(x('Y1') - x('B') >= 340);
        assert.ok(x('L1') < x('M') && x('M') < x('R1'));
        for (let index = 2; index <= count; index++)
        {
            assert.ok(x('X' + index) < x('X' + (index - 1)));
            assert.ok(x('Y' + index) > x('Y' + (index - 1)));
            assert.ok(x('L' + index) < x('L' + (index - 1)));
            assert.ok(x('R' + index) > x('R' + (index - 1)));
        }
        assert.equal(chain.testPartnerRoutes.size, 2 * (count - 1) + (chain.groupedHouseholds ? 2 : 0));
        // The child stem must begin at the actual family connector, not a
        // guessed midpoint within someone else's card.
        for (const [familyId, route] of chain.testPartnerRoutes)
        {
            const partner = chain.connectorDescriptors.find(edge => edge.familyId === familyId && edge.role === 'partner');
            const stem = chain.connectorDescriptors.find(edge => edge.familyId === familyId
                && /descendant-(trunk|direct)$/.test(edge.role));
            assert.ok(partner && stem);
            assert.equal(stem.points[0].x, route.junctionX);
            assert.ok(partner.points.some(point => point.x === stem.points[0].x && point.y === stem.points[0].y));
            assert.ok(partner.visibleSegments.some(([start, end]) => stem.points[0].x >= start.x
                && stem.points[0].x <= end.x && stem.points[0].y === start.y),
                'descendant stem must meet the actual visible partner line');
        }
        assert.ok(chain.connectorDescriptors.find(edge => edge.familyId === 'center' && edge.role === 'partner')
            .className.includes('is-separated-or-divorced'));
        assert.equal(chain.testIssues.length, 0);
        assert.ok(!chain.testPartnerExtraAbove);
        for (const descriptor of chain.connectorDescriptors.filter(edge => edge.role === 'partner'))
        {
            const family = chain.families.find(item => item.id === descriptor.familyId);
            const a = chain.peopleById[family.left];
            const b = chain.peopleById[family.right];
            assert.ok(descriptor.points.every(point => point.y === descriptor.points[0].y
                && point.y > a.topY && point.y < a.bottomY && point.y > b.topY && point.y < b.bottomY));
            if (!descriptor.visibleSegments) continue;
            assert.ok(descriptor.visibleSegments.length >= 1);
            assert.equal((descriptor.d.match(/M/g) || []).length, descriptor.visibleSegments.length);
            assert.deepEqual(new Set(descriptor.partnerIds), new Set([family.left, family.right]));
            const [first, last] = [a, b].sort((x, y) => x.leftX - y.leftX);
            assert.equal(descriptor.visibleSegments[0][0].x, first.rightX);
            assert.equal(descriptor.visibleSegments.at(-1).at(-1).x, last.leftX);
            for (const [start, end] of descriptor.visibleSegments)
                for (const node of chain.positionedPeople.filter(node => node.id !== a.id && node.id !== b.id
                    && node.generation === a.generation))
                    assert.ok(end.x < node.leftX || start.x > node.rightX, 'pass-through must not touch unrelated card');
        }
        console.log(JSON.stringify({ extraPartnersPerSide: count, ancestorMode, people: fixture.people.length,
            diagnostics: Array.from(chain.testIssues, issue => issue.type) }));
    }
}

// Founder grouping regression: two short collateral branches and a
// longer principal branch with a wide grandchild household. Reserve
// full-depth branch territory, but keep local descendants compact.
const groupingIds = ['A', 'B', 'X', 'Y', 'M', 'MP', 'G', 'GP', 'E', 'EP',
    'S', 'N', 'NP', 'I', 'L', 'LP', 'LL', 'R', 'RP', 'RR', 'AF', 'AM', 'BF', 'BM'];
const groupingFamilies = [
    { id: 'center', left: 'A', right: 'B', children: ['M'], relationshipStatus: 'divorced' },
    { id: 'left', left: 'A', right: 'X', children: ['L'] },
    { id: 'right', left: 'Y', right: 'B', children: ['R'] },
    { id: 'm', left: 'MP', right: 'M', children: ['G'] },
    { id: 'g', left: 'GP', right: 'G', children: ['E', 'S'] },
    { id: 'e', left: 'EP', right: 'E', children: ['N'] },
    { id: 'n', left: 'N', right: 'NP', children: [] },
    { id: 's', left: 'S', right: '', children: ['I'] },
    { id: 'l', left: 'LP', right: 'L', children: ['LL'] },
    { id: 'r', left: 'RP', right: 'R', children: ['RR'] },
    { id: 'pa', left: 'AF', right: 'AM', children: ['A'] },
    { id: 'pb', left: 'BF', right: 'BM', children: ['B'] }
];
const groupingRoles = { directAncestorIds: new Set(['A', 'B', 'AF', 'AM', 'BF', 'BM']) };
const groupingPeople = groupingIds.map(id => ({ id }));
const groupingBefore = context.calculateTestTreeLayout(groupingPeople, groupingFamilies, 'M',
    { branchRoles: groupingRoles, groupHouseholds: false });
const grouped = verify(groupingPeople, groupingFamilies, 'M', groupingRoles);
assert.ok(grouped.groupedHouseholds);
assert.equal(grouped.testIssues.length, 0);
assert.equal(grouped.positionedPeople.length, groupingPeople.length);
const gx = id => grouped.peopleById[id].centerX;
assert.equal(gx('B') - gx('A'), 340, 'principal couple remains compact');
assert.ok(gx('A') - gx('X') > 340 && gx('Y') - gx('B') > 340,
    'secondary partners move outward for their own descendants');
const territories = [
    ['X', 'L', 'LP', 'LL'],
    ['A', 'B', 'M', 'MP', 'G', 'GP', 'E', 'EP', 'S', 'N', 'NP', 'I'],
    ['Y', 'R', 'RP', 'RR']
].map(ids => ({
    left: Math.min(...ids.map(id => grouped.peopleById[id].leftX)),
    right: Math.max(...ids.map(id => grouped.peopleById[id].rightX))
}));
assert.ok(territories[1].left - territories[0].right >= 96);
assert.ok(territories[2].left - territories[1].right >= 96);
assert.equal((gx('E') + gx('S')) / 2, (gx('G') + gx('GP')) / 2);
assert.ok(gx('S') - gx('E') <
    groupingBefore.peopleById.S.centerX - groupingBefore.peopleById.E.centerX);
for (const familyId of ['left', 'right'])
{
    const route = grouped.testPartnerRoutes.get(familyId);
    const family = grouped.families.find(record => record.id === familyId);
    const child = grouped.peopleById[family.children[0]];
    assert.equal(child.centerX, route.junctionX);
    const partner = grouped.connectorDescriptors.find(edge => edge.familyId === familyId && edge.role === 'partner');
    assert.ok(partner.visibleSegments.length === 1 && partner.points.every(point => point.y === partner.points[0].y));
}
console.log(JSON.stringify({
    groupingRegression: 'principal and collateral territories',
    sideClearance: [territories[1].left - territories[0].right, territories[2].left - territories[1].right],
    principalPartnerGap: gx('B') - gx('A') - 300,
    secondaryPartnerGaps: [gx('A') - gx('X') - 300, gx('Y') - gx('B') - 300],
    siblingAttachmentSpacingBefore: groupingBefore.peopleById.S.centerX - groupingBefore.peopleById.E.centerX,
    siblingAttachmentSpacingAfter: gx('S') - gx('E')
}));

// A visible independent parent branch on a descendant's partner prevents
// this local planner from owning the whole descendant component.
const attached = verify([...groupingPeople, { id: 'external-parent' }],
    [...groupingFamilies, { id: 'external-parents', left: 'external-parent', right: '', children: ['EP'] }],
    'M', groupingRoles);
assert.ok(!attached.groupedHouseholds, 'retain the connected graph solver for non-independent regions');

// Asymmetric hubs and one-sided multiple partnerships. A collateral
// child group must not jump across the central family to find a gap.
for (const [leftCount, rightCount] of [[1, 3], [3, 1], [0, 4], [4, 0], [4, 4]])
{
    const ids = ['A', 'B', 'M'];
    const families = [{ id: 'center', left: 'A', right: 'B', children: ['M'], relationshipStatus: 'divorced' }];
    for (const [count, side, hub] of [[leftCount, 'L', 'A'], [rightCount, 'R', 'B']])
        for (let index = 1; index <= count; index++)
        {
            const partner = side + 'p' + index;
            const child = side + 'c' + index;
            ids.push(partner, child);
            families.push({ id: side + index, left: hub, right: partner, children: [child] });
        }
    const layout = verify(ids.map(id => ({ id })), families, 'M');
    assert.equal(layout.positionedPeople.length, ids.length);
    assert.equal(layout.testIssues.length, 0);
    const x = id => layout.peopleById[id].centerX;
    assert.equal(x('B') - x('A'), 340);
    if (leftCount && rightCount)
    {
        for (let i = 1; i <= leftCount; i++) assert.ok(x('Lc' + i) < x('M'));
        for (let i = 1; i <= rightCount; i++) assert.ok(x('Rc' + i) > x('M'));
    }
    const order = Array.from(layout.families).filter(family => family.children.length).map(family => {
        const extended = layout.testPartnerRoutes.get(family.id);
        return { junction: extended ? extended.junctionX : (x(family.left) + x(family.right)) / 2,
            child: x(family.children[0]) };
    }).sort((a, b) => a.junction - b.junction);
    assert.ok(order.every((item, index) => index === 0 || order[index - 1].child < item.child));
}

// A path of arbitrary length must preserve all actual partner adjacency,
// even when canonical left/right hints cannot all be honored.
for (const count of [5, 8])
{
    const ids = Array.from({ length: count }, (_, i) => 'p' + i);
    const families = ids.slice(1).map((id, index) => ({
        id: 'chain-' + index,
        left: index % 2 ? id : ids[index],
        right: index % 2 ? ids[index] : id,
        children: []
    }));
    const layout = verify(ids.map(id => ({ id })), families, ids[2]);
    for (const family of families)
        assert.equal(Math.abs(layout.peopleById[family.left].centerX - layout.peopleById[family.right].centerX), 340);
    assert.equal(layout.testIssues.length, 0);
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
