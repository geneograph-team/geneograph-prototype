'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ELK = require('../src/vendor/elkjs-0.10.0/lib/elk.bundled.js');
const fixtures = require('./fixtures/elk-tree-approved.json');
const context = vm.createContext({ performance, clampNumber: (value, minimum, maximum) =>
    Math.max(minimum, Math.min(maximum, value)) });
for (const file of ['core/state-tree-core.js', 'modules/family-tree/tree-geometry.js',
    'modules/family-tree/tree-elk-model.js', 'modules/family-tree/tree-elk-preview.js'])
{
    const source = fs.readFileSync(path.join(__dirname, '../src', file), 'utf8');
    vm.runInContext(file === 'core/state-tree-core.js' ? source.slice(source.indexOf('function currentTreePeople('), source.indexOf('const topbar =')) : source, context);
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
let unsupported = 0;
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
                    try
                    {
                        const geometryInput = context.prepareElkTreeInput(visible);
                        assert.ok(geometryInput.people.every(person => Number.isInteger(person.generation)));
                    }
                    catch (error)
                    {
                        assert.match(error.message, /incompatible generations|disconnected people/);
                        unsupported++;
                    }
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
assert.throws(() => context.prepareElkTreeInput(incompatible), /incompatible generations/);

(async () =>
{
    const solver = new ELK();
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
            graph => solver.layout(JSON.parse(JSON.stringify(graph))));
        assert.equal(result.boxes.length, input.people.length);
        assert.equal(result.issues.length, 0, result.issues.join('; '));
        for (const box of result.boxes)
            assert.ok(result.boxes.every(other => box === other || box.x + box.w <= other.x + .02 ||
                other.x + other.w <= box.x + .02 || box.y + box.h <= other.y + .02 || other.y + other.h <= box.y + .02));
        for (const family of input.families)
            for (const child of family.children)
                assert.ok(result.paths.some(path => path.family === family.id && path.role === 'child' && path.person === child));
    }
    console.log(JSON.stringify({ matrix: cases, deferred, unsupported, fullPeople: full.people.length,
        fullFamilies: full.families.length, alexVisiblePeople: visible.people.length, alexFamilies: visible.families.length }));
})().catch(error => { console.error(error); process.exitCode = 1; });
