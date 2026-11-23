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
    'seed/family-tree-stress-test'
])
    vm.runInContext(source(file), context, { filename: file + '.js' });
vm.runInContext('const ADD_PERSON_RELATIONSHIP_TYPES = Object.keys(PARTNER_RELATIONSHIP_DEFINITIONS);', context);

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
assert.equal(fixture.families.length, 472);
assert.equal(JSON.stringify(fixture), JSON.stringify(run('buildFamilyTreeStressTestFixture()')));
assert.equal(fixture.people[0].birth.first.year, 1740);
assert.equal(fixture.people.at(-1).birth.first.year, 2010);
assert.equal(new Set(fixture.people.map(p => p.id)).size, 1200);
assert.equal(new Set(fixture.families.map(f => f.id)).size, fixture.families.length);
const cohorts = new Map();
const persons = new Map(fixture.people.map(person => [person.id, person]));
const neighbors = new Map(fixture.people.map(person => [person.id, new Set()]));
const biologicalParents = new Map();
for (const person of fixture.people)
    cohorts.set(person.birth.first.year, (cohorts.get(person.birth.first.year) || 0) + 1);
assert.equal(cohorts.size, 10);
assert.deepEqual([...cohorts.keys()], [1740, 1770, 1800, 1830, 1860, 1890, 1920, 1950, 1980, 2010]);
const partners = new Map();
let wideFamilyCount = 0;
let unknownParentFamilyCount = 0;
for (const family of fixture.families)
{
    assert.equal(family.projectId, projectId);
    const members = [family.partnerAId, family.partnerBId, ...family.childIds].filter(Boolean);
    for (const id of members) assert.ok(persons.has(id), 'broken person reference ' + id);
    for (const a of members)
        for (const b of members)
            if (a !== b) neighbors.get(a).add(b);
    if (family.childIds.length >= 8 && family.childIds.length <= 10) wideFamilyCount += 1;
    if (!family.partnerBId) unknownParentFamilyCount += 1;
    for (const id of [family.partnerAId, family.partnerBId].filter(Boolean))
        partners.set(id, (partners.get(id) || 0) + 1);
    for (const childId of family.childIds)
    {
        assert.ok(!biologicalParents.has(childId), 'duplicate biological parent family: ' + childId);
        const parents = [family.partnerAId, family.partnerBId].filter(Boolean);
        biologicalParents.set(childId, parents);
        for (const parentId of parents)
            assert.equal(persons.get(childId).birth.first.year - persons.get(parentId).birth.first.year, 30);
    }
}
const discovered = new Set([fixture.people[0].id]);
const queue = [...discovered];
for (let i = 0; i < queue.length; i += 1)
    for (const id of neighbors.get(queue[i]))
        if (!discovered.has(id)) { discovered.add(id); queue.push(id); }
assert.equal(discovered.size, 1200, 'all people must belong to one component');
assert.ok(wideFamilyCount >= 5);
assert.ok(unknownParentFamilyCount >= 1);
assert.ok([...partners.values()].some(count => count > 1));
for (const family of fixture.families)
{
    if (!family.partnerBId) continue;
    const a = biologicalParents.get(family.partnerAId) || [];
    const b = biologicalParents.get(family.partnerBId) || [];
    assert.ok(!a.some(id => b.includes(id)), 'known siblings cannot be partners in ' + family.id);
}
assert.equal(run('validateProjectDraft(sampleData.projects[1], buildFamilyTreeStressTestFixture()).length'), 0);

const openedAt = performance.now();
assert.equal(run('ensureFamilyTreeStressTestProjectLoaded("' + projectId + '")'), true);
const openMs = performance.now() - openedAt;
assert.equal(run('sampleData.people.filter(p => p.projectId === "' + projectId + '").length'), 1200);
assert.equal(run('sampleData.families.filter(f => f.projectId === "' + projectId + '").length'), 472);
assert.ok(run('sampleData.events.filter(e => e.projectId === "' + projectId + '").length') >= 1200);
assert.equal(run('getProjectPeopleCount("' + projectId + '")'), 1200);
assert.equal(run('JSON.stringify([sampleData.people.filter(p => p.projectId === "p1"), sampleData.families.filter(f => f.projectId === "p1")])'), p1Before);
run('sampleData.people.find(p => p.id === "stress-person-0350").names.first = "Edited"');
const peopleCount = run('sampleData.people.length');
const familyCount = run('sampleData.families.length');
const eventCount = run('sampleData.events.length');
assert.equal(run('ensureFamilyTreeStressTestProjectLoaded("' + projectId + '")'), true);
assert.equal(run('sampleData.people.length'), peopleCount);
assert.equal(run('sampleData.families.length'), familyCount);
assert.equal(run('sampleData.events.length'), eventCount);
assert.equal(run('sampleData.people.find(p => p.id === "stress-person-0350").names.first'), 'Edited');

console.log(JSON.stringify({
    ok: true, people: fixture.people.length, families: fixture.families.length,
    connected: discovered.size, generations: cohorts.size,
    wideFamilies: wideFamilyCount, unknownParentFamilies: unknownParentFamilyCount,
    buildMs: Math.round(buildMs), firstOpenMs: Math.round(openMs),
    note: 'Synthetic Node timings, not browser render/layout measurements'
}, null, 2));
