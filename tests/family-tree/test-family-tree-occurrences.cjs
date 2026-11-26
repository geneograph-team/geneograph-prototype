'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ELK = require('../../src/vendor/elkjs-0.12.1/lib/elk.bundled.js');
const { approvedTreeCases } = require('./tree-cases.cjs');
const fixtures = approvedTreeCases();
const context = vm.createContext({ performance, clampNumber: (value, minimum, maximum) =>
    Math.max(minimum, Math.min(maximum, value)) });
for (const file of ['shared/genealogy-dates.js', 'core/state-tree-core.js', 'modules/family-tree/tree-geometry.js',
    'modules/family-tree/tree-elk-model.js', 'modules/family-tree/tree-elk-layout.js'])
{
    const source = fs.readFileSync(path.join(__dirname, '../../src', file), 'utf8');
    vm.runInContext(file === 'core/state-tree-core.js' ? source.slice(source.indexOf('function currentTreePeople('), source.indexOf('const topbar =')) : source, context);
}

const crossGenerationFamilies = [
    { id: 'focus-family', parents: ['father', 'mother'], children: ['focus'] },
    { id: 'paternal-family', parents: ['grandfather-a'], children: ['father', 'aunt-a'] },
    { id: 'maternal-family', parents: ['grandfather-b'], children: ['mother', 'aunt-b'] },
    { id: 'aunt-a-family', parents: ['aunt-a', 'older'], children: ['younger'] },
    { id: 'aunt-b-family', parents: ['aunt-b', 'younger'], children: [] }
];
const crossGenerationPeople = [...new Set(crossGenerationFamilies.flatMap(family =>
    [...family.parents, ...family.children]))].map(id => ({ id }));
const crossGenerationProjection = {
    focusPersonId: 'focus',
    people: crossGenerationPeople,
    families: crossGenerationFamilies.map(family => ({
        id: family.id, left: family.parents[0], right: family.parents[1], children: family.children
    })),
    branchRoles: { parentPresenceByPerson: new Map() }
};
for (const direction of ['DOWN', 'RIGHT'])
{
    const model = context.prepareElkTreeInput(crossGenerationProjection, new Map(), direction);
    const copies = model.people.filter(person => person.personId === 'younger');
    assert.equal(copies.length, 2);
    assert.equal(copies.filter(person => person.primary).length, 1);
    assert.ok(copies.every(person => person.occurrenceCount === 2));
    const parentFamily = model.families.find(family => family.canonicalFamilyId === 'aunt-a-family');
    const partnerFamily = model.families.find(family => family.canonicalFamilyId === 'aunt-b-family');
    const child = copies.find(person => parentFamily.children.includes(person.id));
    const partner = copies.find(person => partnerFamily.parents.includes(person.id));
    assert.equal(child.generation, partner.generation + 1);
    assert.equal(child.expanded, true);
    const occurrences = context.projectElkTreeOccurrences(crossGenerationPeople, crossGenerationFamilies, new Map(), 'focus');
    verify(crossGenerationPeople, crossGenerationFamilies, occurrences);
}

const [basePeople, baseFamilies] = fixtures['automatic-duplicates'];
const people = [...basePeople, { id: 'la01', name: 'Agnes' }, { id: 'la02', name: 'Frederick' }];
const families = [...baseFamilies, { id: 'F20', parents: ['la01', 'la02'], children: ['ha08'] }];
const project = (people, families, options) => context.buildFamilyTreeProjection(people,
    families.map(family => ({ id: family.id, left: family.parents[0], right: family.parents[1], children: family.children })), options);
const projectOccurrences = (people, families, preferences) => context.projectElkTreeOccurrences(people, families, preferences);
const semantic = projection => projection.families.map(family => ({ id: family.id,
    parents: [family.left, family.right].filter(Boolean), children: family.children }));

function verify(sourcePeople, sourceFamilies, result)
{
    const canonical = new Map(result.people.map(person => [person.id, person.personId]));
    assert.equal(canonical.size, result.people.length);
    assert.equal(new Set(result.people.map(person => person.occurrenceId)).size, result.people.length);
    assert.deepEqual([...new Set(canonical.values())].sort(), Array.from(sourcePeople, person => person.id).sort());
    assert.equal(result.families.length, sourceFamilies.length);
    for (const [index, family] of result.families.entries())
    {
        const source = sourceFamilies[index];
        assert.equal(family.id, source.id);
        for (const role of ['parents', 'children'])
            assert.equal(JSON.stringify(family[role].map(id => canonical.get(id))), JSON.stringify(source[role]));
    }
    for (const duplicate of result.decisions)
    {
        const appearances = result.people.filter(person => person.personId === duplicate.personId);
        assert.ok(appearances.length > 1);
        assert.equal(new Set(appearances.map(person => person.contextKey)).size, appearances.length);
        assert.equal(appearances.filter(person => person.primary).length, 1);
        const upstream = result.families.flatMap(family => family.children).filter(id => canonical.get(id) === duplicate.personId);
        assert.equal(new Set(upstream).size, upstream.length ? 1 : 0);
        assert.equal(appearances.filter(person => person.expanded).length, upstream.length ? 1 : 0);
        if (upstream.length) assert.equal(appearances.find(person => person.expanded).id, upstream[0]);
    }
}

const originals = JSON.stringify([people, families]);
const full = projectOccurrences(people, families);
verify(people, families, full);
assert.equal(full.people.length, 53);
assert.equal(full.families.length, 20);
assert.equal(full.decisions.length, 1);
assert.equal(full.decisions[0].personId, 'ha08');
assert.equal(full.families.find(f => f.id === 'F20').children.length, 1);
const louise = full.people.filter(person => person.personId === 'ha08');
const appearances = result => result.people.filter(person => person.personId === 'ha08');
for (const owner of louise)
{
    const transferred = projectOccurrences(people, families, new Map([['ha08', owner.preferredPeer]]));
    verify(people, families, transferred);
    assert.equal(appearances(transferred).find(person => person.expanded).contextKey, owner.contextKey);
    assert.equal(JSON.stringify(appearances(transferred).map(person => person.occurrenceId)),
        JSON.stringify(louise.map(person => person.occurrenceId)));
}
const unavailable = projectOccurrences(people, families, new Map([['ha08', 'removed-peer']]));
assert.equal(JSON.stringify(unavailable), JSON.stringify(full));

const rootsOnly = projectOccurrences(basePeople, baseFamilies);
assert.equal(appearances(rootsOnly).length, 2);
assert.ok(appearances(rootsOnly).every(person => !person.hasParents && !person.expanded));
assert.equal(rootsOnly.people.filter(person => ['s1', 's2'].includes(person.personId)).length, 2);

let cases = 0;
let deferred = 0;
const maxAncestors = vm.runInContext('TREE_ANCESTOR_GENERATION_MAX', context);
const maxDescendants = vm.runInContext('TREE_DESCENDANT_GENERATION_MAX', context);
for (const [records, groups] of [...Object.values(fixtures), [people, families]])
{
    const snapshot = JSON.stringify([records, groups]);
    for (const focus of records)
        for (let ancestorGenerations = 0; ancestorGenerations <= maxAncestors; ancestorGenerations++)
            for (let descendantGenerations = 0; descendantGenerations <= maxDescendants; descendantGenerations++)
                for (const showCousins of [false, true])
                {
                    const visible = project(records, groups, { focusPersonId: focus.id, ancestorGenerations,
                        descendantGenerations, showCousins });
                    const visibleFamilies = semantic(visible);
                    const result = projectOccurrences(visible.people, visibleFamilies);
                    verify(visible.people, visibleFamilies, result);
                    assert.equal(JSON.stringify(result), JSON.stringify(projectOccurrences(visible.people, visibleFamilies)));
                    deferred += Number(Boolean(result.deferred.length));
                    const geometryInput = context.prepareElkTreeInput(visible);
                    assert.ok(geometryInput.people.every(person => Number.isInteger(person.generation)));
                    cases++;
                }
    assert.equal(JSON.stringify([records, groups]), snapshot);
}
assert.equal(JSON.stringify([people, families]), originals);

const smallPeople = ids => ids.split(' ').map(id => ({ id }));
const family = (id, parents, children) => ({ id, parents: parents.split(' '), children: children ? children.split(' ') : [] });
const ordinary = [family('first', 'a b', 'd'), family('same-pair', 'a b', 'e'), family('bilateral-a', 'a c', ''),
    family('bilateral-b', 'b f', '')];
const ordinaryPeople = smallPeople('a b c d e f');
const ordinaryResult = projectOccurrences(ordinaryPeople, ordinary);
verify(ordinaryPeople, ordinary, ordinaryResult);
assert.equal(ordinaryResult.decisions.length, 0);
const ambiguous = [family('first', 'a b', 'c'), family('second', 'a d', 'c')];
const ambiguousPeople = smallPeople('a b c d');
const ambiguousResult = projectOccurrences(ambiguousPeople, ambiguous);
verify(ambiguousPeople, ambiguous, ambiguousResult);
assert.equal(ambiguousResult.deferred[0].personId, 'a');
const incomplete = [family('first', 'a', 'c'), family('second', 'a d', 'c')];
assert.equal(projectOccurrences(smallPeople('a c d'), incomplete).deferred[0].personId, 'a');
const nestedChildren = [family('first', 'a b', 'c'), family('second', 'a d', 'e'), family('nested', 'c f', 'e')];
assert.equal(projectOccurrences(smallPeople('a b c d e f'), nestedChildren).deferred[0].personId, 'a');
assert.throws(() => projectOccurrences(smallPeople('a b'), [family('first', 'a', 'b'), family('second', 'b', 'a')]), /Ancestry cycle/);
const incompatible = project(smallPeople('a b c'), [family('up', 'a', 'b'), family('partner', 'a b', 'c')],
    { focusPersonId: 'b', ancestorGenerations: 3, descendantGenerations: 3, showCousins: true });
const resolved = context.prepareElkTreeInput(incompatible);
const resolvedCopies = [...new Set(resolved.people.filter(person => person.occurrenceCount === 2)
    .map(person => person.personId))];
assert.equal(resolvedCopies.length, 1);


function marriageLoopFixture(childbearing)
{
    const families = [family('ancestors', 'a b', 'c d e'), family('c-branch', 'c', 'p'),
        family('d-branch', 'd', 'q r'), family('e-branch', 'e', 's'),
        family('marriage-1', 'p q', childbearing ? 'u' : ''),
        family('marriage-2', 'r s', childbearing ? 'v' : '')];
    return { people: smallPeople('a b c d e p q r s' + (childbearing ? ' u v' : '')), families };
}

const marriageInputs = [];
for (const childbearing of [false, true])
{
    const fixture = marriageLoopFixture(childbearing);
    const snapshot = JSON.stringify(fixture);
    const result = context.projectElkTreeOccurrences(fixture.people, fixture.families, undefined, 'c');
    verify(fixture.people, fixture.families, result);
    assert.equal(result.people.length, fixture.people.length + 2);
    assert.equal(result.people.filter(person => person.personId === 'a' || person.personId === 'b').length, 2);
    assert.deepEqual(Array.from(result.decisions, item => item.reason),
        Array(2).fill('Collateral marriage reconnects visible ancestry'));
    const old = projectOccurrences(fixture.people, fixture.families);
    assert.equal(old.people.filter(person => ['a','b'].includes(person.personId)).length, childbearing ? 4 : 2);
    const graph = context.elkOccurrenceIncidence(result.people, result.families, 'c');
    assert.equal(graph.cycleRank, 0);
    assert.equal(graph.conflict, false);
    assert.equal(graph.rows.size, result.people.length);
    const primaryContext = result.people.find(person => person.occurrenceCount === 2 && person.primary);
    const copyContext = result.people.find(person => person.personId === primaryContext.personId && !person.primary);
    assert.equal(copyContext.preferredContext, undefined, 'Moving ancestry would disconnect this copy’s original context');
    const transfer = context.projectElkTreeOccurrences(fixture.people, fixture.families,
        new Map([[copyContext.personId, copyContext.contextKey]]), 'c');
    assert.equal(JSON.stringify(transfer), JSON.stringify(result));
    assert.equal(JSON.stringify(fixture), snapshot);
    marriageInputs.push({
        people: fixture.people, focusPersonId: 'c', branchRoles: { parentPresenceByPerson: new Map() },
        families: fixture.families.map(({ id, parents: [left, right], children }) => ({ id, left, right, children }))
    });
}

const transferable = marriageLoopFixture(false);
transferable.people.push({ id: 'x' });
transferable.families.push(family('repeat-link-a', 'p x', ''), family('repeat-link-b', 'q x', ''));
const originalContexts = context.projectElkTreeOccurrences(transferable.people, transferable.families, undefined, 'c');
const transferTarget = originalContexts.people.find(person => !person.primary && person.preferredContext);
assert.ok(transferTarget);
const moved = context.projectElkTreeOccurrences(transferable.people, transferable.families,
    new Map([[transferTarget.personId, transferTarget.preferredContext]]), 'c');
verify(transferable.people, transferable.families, moved);
assert.equal(moved.people.find(person => person.occurrenceId === transferTarget.occurrenceId).expanded, true);
assert.equal(JSON.stringify(moved.people.map(person => person.occurrenceId)),
    JSON.stringify(originalContexts.people.map(person => person.occurrenceId)));

const repeatedMarriage = marriageLoopFixture(false);
repeatedMarriage.families.push(family('marriage-record', 'p q', ''));
const repeated = context.projectElkTreeOccurrences(repeatedMarriage.people, repeatedMarriage.families, undefined, 'c');
verify(repeatedMarriage.people, repeatedMarriage.families, repeated);
assert.ok(repeated.people.filter(p => ['p', 'q'].includes(p.personId)).every(p => p.occurrenceCount === 1));
assert.equal(context.elkOccurrenceIncidence(repeated.people, repeated.families, 'c').conflict, false);

const partnerTriangle = [family('p1', 'a b', ''), family('p2', 'b c', ''), family('p3', 'a c', '')];
const triangle = context.projectElkTreeOccurrences(smallPeople('a b c'), partnerTriangle, undefined, 'a');
verify(smallPeople('a b c'), partnerTriangle, triangle);
assert.equal(triangle.people.length, 3);
assert.equal(context.elkOccurrenceIncidence(triangle.people, triangle.families, 'a').cycleRank, 1);

const dateFixture = {
    people: smallPeople('p0 p1 p2 p3 p5 p6 p7 p9'), focusPersonId: 'p0',
    branchRoles: { parentPresenceByPerson: new Map() },
    families: [
        { id: 'f0', left: 'p0', right: 'p1', children: ['p2', 'p3'] },
        { id: 'f1', left: 'p2', right: 'p5', children: ['p6'] },
        { id: 'f3', left: 'p3', children: ['p7'] },
        { id: 'f4', left: 'p5', right: 'p7', children: ['p9'] }
    ]
};
const dated = year => ({ state: 'known', dateType: 'Exact date', calendar: 'Gregorian', first: { year } });
dateFixture.people[3].birthFact = dated(1901);
const identities = model => model.people.map(({ personId, occurrenceId, primary, expanded }) =>
    [personId, occurrenceId, primary, expanded]);
const endpoints = model => model.families.map(({ parents, children }) => [parents, [...children].sort()]);
let birthBaseline;
for (const year of [1900, 1902, undefined, 1901])
{
    dateFixture.people[2].birthFact = year ? dated(year) : undefined;
    const input = context.prepareElkTreeInput(dateFixture);
    if (!birthBaseline) birthBaseline = input;
    assert.equal(JSON.stringify(identities(input)), JSON.stringify(identities(birthBaseline)));
    assert.equal(JSON.stringify(endpoints(input)), JSON.stringify(endpoints(birthBaseline)));
    const order = input.families.find(f => f.canonicalFamilyId === 'f0').children.map(id =>
        input.people.find(person => person.id === id).personId);
    assert.deepEqual([...order], year === 1900 || year === 1901 ? ['p2', 'p3'] : ['p3', 'p2']);
}

function siblingFixture({ couple = false, upstream = false, separate = false, reconverges = true } = {})
{
    const people = smallPeople('a c d e g r x' + (couple ? ' b' : '')
        + (upstream ? ' u v' + (couple ? ' w z' : '') : ''));
    const parents = couple ? 'a b' : 'a';
    const families = separate
        ? [family('F', parents, 'c x'), family('F-other', parents, 'd')]
        : [family('F', parents, 'c d x')];
    families.push(family('C', 'c', 'e'), family('D', 'd', 'g'), family('R', reconverges ? 'e g' : 'e', 'r'));
    if (upstream)
    {
        families.push(family('A-up', 'u v', 'a'));
        if (couple) families.push(family('B-up', 'w z', 'b'));
    }
    return { people, families };
}

function verifySiblingSplit(fixture, options, preferences)
{
    const { people, families } = fixture;
    const snapshot = JSON.stringify(fixture);
    const result = projectOccurrences(people, families, preferences);
    const byId = new Map(result.people.map(person => [person.id, person]));
    assert.equal(new Set(result.families.map(family => family.familyOccurrenceId)).size, result.families.length);
    assert.equal(new Set(result.people.map(person => person.occurrenceId)).size, result.people.length);
    for (const original of families)
    {
        const groups = result.families.filter(family => family.canonicalFamilyId === original.id);
        assert.ok(groups.length);
        for (const group of groups)
            assert.equal(JSON.stringify(group.parents.map(id => byId.get(id).personId)), JSON.stringify(original.parents));
        assert.equal(JSON.stringify(groups.flatMap(group => group.children.map(id => byId.get(id).personId)).sort()),
            JSON.stringify([...original.children].sort()));
    }
    for (const id of options.couple ? ['a', 'b'] : ['a'])
    {
        const copies = result.people.filter(person => person.personId === id);
        assert.equal(copies.length, options.reconverges === false ? 1 : 2);
        if (copies.length === 1) continue;
        assert.equal(new Set(copies.map(person => person.preferredContext)).size, 2);
        assert.equal(copies.filter(person => person.expanded).length, options.upstream ? 1 : 0);
        if (options.upstream)
        {
            assert.equal(result.families.find(family => family.canonicalFamilyId === id.toUpperCase() + '-up').children[0],
                copies.find(person => person.expanded).id);
            if (preferences?.has(id)) assert.equal(copies.find(person => person.expanded).preferredContext, preferences.get(id));
        }
    }
    const produced = result.families.filter(group => group.canonicalFamilyId === 'F' || group.canonicalFamilyId === 'F-other');
    if (options.reconverges !== false)
    {
        assert.equal(produced.length, 2);
        assert.equal(produced.filter(group => group.children.includes('c') && group.children.includes('x')).length, 1);
        assert.equal(produced.filter(group => group.children.length === 1 && group.children[0] === 'd').length, 1);
        assert.ok(produced[0].parents.every(id => !produced[1].parents.includes(id)));
    }
    assert.equal(result.people.filter(person => person.personId === 'r').length, 1);
    assert.equal(JSON.stringify(fixture), snapshot);
    return result;
}

(async () =>
{
    const solver = new ELK();
    let marriageSolves = 0;
    for (const projection of marriageInputs)
        for (const direction of ['DOWN', 'RIGHT'])
        {
            const model = context.prepareElkTreeInput(projection, undefined, direction);
            const result = await context.solveElkTree(model.people, model.families, direction,
                graph => solver.layout(JSON.parse(JSON.stringify(graph))), model.focusId);
            assert.equal(result.issues.length, 0, result.issues.join('; '));
            assert.ok(result.passes <= 2);
            assert.equal(result.boxes.length, model.people.length);
            assert.equal(context.elkCenteringConflicts(result, direction === 'DOWN' ? 'x' : 'y').size, 0);
            marriageSolves++;
        }
    console.log(JSON.stringify({ marriageSolves }));
    const visible = project(people, families,
        { focusPersonId: 's1', ancestorGenerations: 5, descendantGenerations: 3, showCousins: true });
    for (const owner of louise)
    {
        const input = context.prepareElkTreeInput(visible, new Map([['ha08', owner.preferredPeer]]));
        const nodes = input.people.filter(person => person.personId === 'ha08');
        assert.equal(nodes.length, 2);
        assert.equal(nodes.find(person => person.expanded).contextKey, owner.contextKey);
        assert.ok(!input.people.some(person => person.placeholder?.personId === 'ha08'));
        const result = await context.solveElkTree(input.people, input.families, 'DOWN',
            graph => solver.layout(JSON.parse(JSON.stringify(graph))), input.focusId);
        assert.equal(result.boxes.length, input.people.length);
        assert.equal(result.issues.length, 0, result.issues.join('; '));
        for (const box of result.boxes)
            assert.ok(result.boxes.every(other => box === other || box.x + box.w <= other.x + .02 ||
                other.x + other.w <= box.x + .02 || box.y + box.h <= other.y + .02 || other.y + other.h <= box.y + .02));
        for (const family of input.families)
            for (const child of family.children)
                assert.ok(result.paths.some(path => path.family === family.id && path.role === 'child' && path.person === child));
    }
    const stable = siblingFixture({ couple: true, upstream: true });
    const stableResult = projectOccurrences(stable.people, stable.families);
    const narrower = projectOccurrences(stable.people.filter(person => person.id !== 'x'),
        stable.families.map(group => ({ ...group, children: group.children.filter(id => id !== 'x') })));
    assert.equal(JSON.stringify(narrower.people.filter(person => person.personId === 'a').map(person => person.occurrenceId)),
        JSON.stringify(stableResult.people.filter(person => person.personId === 'a').map(person => person.occurrenceId)));
    assert.equal(JSON.stringify(projectOccurrences(stable.people, stable.families, new Map([['a', 'b']]))),
        JSON.stringify(stableResult));
    let siblingSolves = 0;
    for (const options of [{}, { separate: true }, { couple: true }, { upstream: true },
        { couple: true, upstream: true }, { couple: true, reconverges: false }])
    {
        const fixture = siblingFixture(options);
        const result = verifySiblingSplit(fixture, options);
        if (options.reconverges === false) continue;
        const alternate = new Map(result.people.filter(person => (person.personId === 'a' || person.personId === 'b')
            && person.hasParents && !person.expanded).map(person => [person.personId, person.preferredContext]));
        if (options.upstream) verifySiblingSplit(fixture, options, alternate);
        const visible = project(fixture.people, fixture.families, {
            focusPersonId: 'r', ancestorGenerations: 6, descendantGenerations: 0, showCousins: true
        });
        for (const preference of options.upstream ? [undefined, alternate] : [undefined])
        {
            const input = context.prepareElkTreeInput(visible, preference);
            assert.equal(input.people.filter(person => person.personId === 'a').length, 2);
            if (options.upstream)
                assert.ok(!input.people.some(person => ['a','b'].includes(person.placeholder?.personId)));
            assert.ok(input.families.filter(family => ['F','F-other'].includes(family.canonicalFamilyId))
                .every(family => family.parents.length === (options.couple ? 2 : 1)));
            const layout = await context.solveElkTree(input.people, input.families, 'DOWN',
                graph => solver.layout(JSON.parse(JSON.stringify(graph))), input.focusId);
            assert.equal(layout.boxes.length, input.people.length);
            assert.equal(layout.issues.length, 0, layout.issues.join('; '));
            for (const group of input.families)
                for (const child of group.children)
                    assert.ok(layout.paths.some(path => path.family === group.id && path.role === 'child' && path.person === child));
            siblingSolves++;
        }
    }
    console.log(JSON.stringify({ siblingSolves }));
    console.log(JSON.stringify({ matrix: cases, deferred, unsupported: 0, fullPeople: full.people.length,
        fullFamilies: full.families.length, alexVisiblePeople: visible.people.length, alexFamilies: visible.families.length }));
})().catch(error => { console.error(error); process.exitCode = 1; });
