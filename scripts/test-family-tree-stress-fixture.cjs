'use strict';

// TEMPORARY INTERNAL QA FIXTURE. Remove before open user testing.
// Run: node scripts/test-family-tree-stress-fixture.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { performance } = require('node:perf_hooks');

const source = file => fs.readFileSync(path.join(__dirname, '../src', file + '.js'), 'utf8');
const context = vm.createContext({
    console,
    state: { language: 'en' },
    t: text => text,
    translateText: text => text,
    localizedDataFieldValue: text => text,
    escapeHtml: text => text,
    getPlaceDisplay: () => '',
    cleanEditFieldValue: text => String(text ?? ''),
    currentProjectId: () => null
});
for (const file of [
    'seed/sample-data',
    'shared/genealogy-dates',
    'shared/person-name-helpers',
    'shared/relationships',
    'modules/family-tree/relationships',
    'shared/tree-seed-model',
    'core/validation',
    'seed/family-tree-stress-test',
    'modules/people/relationship-editor'
])
    vm.runInContext(source(file), context, { filename: file + '.js' });

const run = code => vm.runInContext(code, context);
const projectId = 'p-family-tree-stress';
const p1Before = run('JSON.stringify([sampleData.people, sampleData.families])');
assert.equal(run('sampleData.projects.length'), 2);
assert.equal(run('getProjectPeopleCount("' + projectId + '")'), 1200);
assert.equal(run('sampleData.people.filter(p => p.projectId === "' + projectId + '").length'), 0);
assert.equal(run('sampleData.families.filter(f => f.projectId === "' + projectId + '").length'), 0);
assert.equal(run('ensureFamilyTreeStressTestProjectLoaded("p1")'), true);
assert.equal(run('sampleData.people.length'), 24);

const buildStarted = performance.now();
const fixture = run('buildFamilyTreeStressTestFixture()');
const buildMs = performance.now() - buildStarted;
assert.equal(fixture.people.length, 1200);
assert.equal(fixture.families.length, 442);
assert.equal(JSON.stringify(fixture), JSON.stringify(run('buildFamilyTreeStressTestFixture()')));
assert.equal(fixture.people[0].birth.first.year, 1740);
assert.equal(fixture.people.at(-1).birth.first.year, 2010);
assert.equal(new Set(fixture.people.map(person => person.id)).size, 1200);
assert.equal(new Set(fixture.families.map(family => family.id)).size, fixture.families.length);
assert.equal(run('sampleData.projects[1].defaultPersonId'), 'stress-person-0349');

const cohorts = new Map();
const peopleById = new Map(fixture.people.map(person => [person.id, person]));
const parentFamilyById = new Map();
const partnerFamilyById = new Map();

// A bipartite person-family membership graph must be a connected TREE.
// Connectedness alone is insufficient: cycles allow one person to be
// encountered more than once through different visible pedigree branches.
const membership = new Map([
    ...fixture.people.map(person => ['person:' + person.id, new Set()]),
    ...fixture.families.map(family => ['family:' + family.id, new Set()])
]);
let membershipEdges = 0;
let wideFamilyCount = 0;
for (const person of fixture.people)
    cohorts.set(person.birth.first.year, (cohorts.get(person.birth.first.year) || 0) + 1);
assert.deepEqual([...cohorts.entries()], [
    [1740, 2], [1770, 10], [1800, 22], [1830, 40], [1860, 64],
    [1890, 96], [1920, 150], [1950, 220], [1980, 280], [2010, 316]
]);

for (const family of fixture.families)
{
    assert.equal(family.projectId, projectId);
    assert.ok(family.partnerAId && family.partnerBId, 'every family is a complete pair');
    assert.ok(family.childIds.length >= 1 && family.childIds.length <= 10);
    const members = [family.partnerAId, family.partnerBId, ...family.childIds];
    assert.equal(new Set(members).size, members.length, 'duplicate family membership');
    if (family.childIds.length >= 8) wideFamilyCount += 1;

    for (const id of members)
    {
        assert.ok(peopleById.has(id), 'missing member ' + id);
        const personKey = 'person:' + id;
        const familyKey = 'family:' + family.id;
        membership.get(personKey).add(familyKey);
        membership.get(familyKey).add(personKey);
        membershipEdges += 1;
    }
    for (const id of [family.partnerAId, family.partnerBId])
    {
        assert.ok(!partnerFamilyById.has(id), 'repeated partner context: ' + id);
        partnerFamilyById.set(id, family.id);
    }
    for (const childId of family.childIds)
    {
        assert.ok(!parentFamilyById.has(childId), 'repeated parent context: ' + childId);
        parentFamilyById.set(childId, family.id);
        for (const parentId of [family.partnerAId, family.partnerBId])
            assert.equal(peopleById.get(childId).birth.first.year -
                peopleById.get(parentId).birth.first.year, 30);
    }
}
assert.ok(wideFamilyCount >= 5, 'several wide sibling groups must remain');
assert.equal(partnerFamilyById.size, fixture.families.length * 2);
assert.equal(parentFamilyById.size, fixture.people.length - 2 - (fixture.families.length - 1));

for (const family of fixture.families)
{
    if (family.id === 'stress-family-0001')
    {
        assert.ok(!parentFamilyById.has(family.partnerAId));
        assert.ok(!parentFamilyById.has(family.partnerBId));
    }
    else
    {
        assert.ok(parentFamilyById.has(family.partnerAId), 'continuing descendant needs a parent family');
        assert.ok(!parentFamilyById.has(family.partnerBId), 'married-in spouse may not reconnect another branch');
    }
}
for (const person of fixture.people)
    assert.ok(parentFamilyById.has(person.id) || partnerFamilyById.has(person.id),
        'disconnected record: ' + person.id);

const discovered = new Set(['person:' + fixture.people[0].id]);
const queue = [...discovered];
for (let i = 0; i < queue.length; i += 1)
    for (const id of membership.get(queue[i]))
        if (!discovered.has(id)) { discovered.add(id); queue.push(id); }
assert.equal(discovered.size, membership.size, 'all persons and families must be connected');
assert.equal(membershipEdges, membership.size - 1, 'pedigree must have no reconverging branches');

assert.equal(run('validateProjectDraft(sampleData.projects[1], buildFamilyTreeStressTestFixture()).length'), 0);
const openedAt = performance.now();
assert.equal(run('ensureFamilyTreeStressTestProjectLoaded("' + projectId + '")'), true);
const openMs = performance.now() - openedAt;
assert.equal(run('sampleData.people.filter(p => p.projectId === "' + projectId + '").length'), 1200);
assert.equal(run('sampleData.families.filter(f => f.projectId === "' + projectId + '").length'), 442);
assert.ok(run('sampleData.events.filter(e => e.projectId === "' + projectId + '").length') >= 1200);
assert.equal(run('getProjectPeopleCount("' + projectId + '")'), 1200);
assert.equal(run('JSON.stringify([sampleData.people.filter(p => p.projectId === "p1"), sampleData.families.filter(f => f.projectId === "p1")])'), p1Before);
run('sampleData.people.find(p => p.id === "stress-person-0349").names.first = "Edited"');
const peopleCount = run('sampleData.people.length');
const familyCount = run('sampleData.families.length');
const eventCount = run('sampleData.events.length');
assert.equal(run('ensureFamilyTreeStressTestProjectLoaded("' + projectId + '")'), true);
assert.equal(run('sampleData.people.length'), peopleCount);
assert.equal(run('sampleData.families.length'), familyCount);
assert.equal(run('sampleData.events.length'), eventCount);
assert.equal(run('sampleData.people.find(p => p.id === "stress-person-0349").names.first'), 'Edited');

console.log(JSON.stringify({
    ok: true, people: fixture.people.length, families: fixture.families.length,
    connectedMembershipNodes: discovered.size, noPedigreeCycles: true,
    generations: cohorts.size, wideFamilies: wideFamilyCount,
    buildMs: Math.round(buildMs), firstOpenMs: Math.round(openMs),
    note: 'Synthetic Node timings, not browser render/layout measurements'
}, null, 2));
