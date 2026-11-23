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
    getPlaceEventDisplay: () => '',
    getPersonPhotoCount: () => 0,
    getArchiveFilesForPerson: () => [],
    getNotesForPerson: () => [],
    sourceIdsForTarget: () => [],
    timelineYearFromValue: date => date?.first?.year || '',
    treeDefaultPersonId: projectId => projectId === 'p1' ? 'silver' : 'stress-person-0001',
    document: { documentElement: { lang: 'en' } },
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
const id = n => 'stress-person-' + String(n).padStart(4, '0');
const familyId = n => 'stress-family-' + String(n).padStart(4, '0');
const p1Before = run('JSON.stringify([sampleData.people, sampleData.families])');

assert.equal(run('sampleData.projects.length'), 2);
assert.equal(run('sampleData.projects[1].defaultPersonId'), id(1));
assert.equal(run('getProjectPeopleCount("' + projectId + '")'), 1023);
assert.equal(run('sampleData.people.filter(p => p.projectId === "' + projectId + '").length'), 0);
assert.equal(run('sampleData.families.filter(f => f.projectId === "' + projectId + '").length'), 0);
assert.equal(run('ensureFamilyTreeStressTestProjectLoaded("p1")'), true);
assert.equal(run('sampleData.people.length'), 24);

const buildStarted = performance.now();
const fixture = run('buildFamilyTreeStressTestFixture()');
const buildMs = performance.now() - buildStarted;
assert.equal(fixture.people.length, 1023);
assert.equal(fixture.families.length, 511);
assert.equal(JSON.stringify(fixture), JSON.stringify(run('buildFamilyTreeStressTestFixture()')));
assert.equal(new Set(fixture.people.map(person => person.id)).size, 1023);
assert.equal(new Set(fixture.families.map(family => family.id)).size, 511);

const peopleById = new Map(fixture.people.map(person => [person.id, person]));
const parentFamilyById = new Map();
const partnerFamilyById = new Map();
const cohortCounts = new Map();
const membership = new Map([
    ...fixture.people.map(person => ['person:' + person.id, new Set()]),
    ...fixture.families.map(family => ['family:' + family.id, new Set()])
]);
let membershipEdges = 0;

// Every ancestor level is COMPLETE: Person 0001 at generation 0,
// Person 0002/0003 at 1, Person 0004–0007 at 2, ...,
// Person 0512–1023 at generation 9. Parent generations are 30 years older.
for (let n = 1; n <= fixture.people.length; n += 1)
{
    const person = peopleById.get(id(n));
    assert.ok(person, 'missing numbered ancestor ' + n);
    const generation = Math.floor(Math.log2(n));
    const year = 2000 - generation * 30;
    assert.equal(person.birth.first.year, year);
    assert.equal(person.names.first, 'Person');
    assert.equal(person.names.last, String(n).padStart(4, '0'));
    assert.equal(person.gender, n % 2 === 0 ? 'male' : 'female');
    cohortCounts.set(year, (cohortCounts.get(year) || 0) + 1);
}
assert.deepEqual([...cohortCounts.entries()], [
    [2000, 1], [1970, 2], [1940, 4], [1910, 8], [1880, 16],
    [1850, 32], [1820, 64], [1790, 128], [1760, 256], [1730, 512]
]);

for (let n = 1; n <= fixture.families.length; n += 1)
{
    const family = fixture.families[n - 1];
    const child = id(n);
    const father = id(2 * n);
    const mother = id(2 * n + 1);
    assert.equal(family.id, familyId(n));
    assert.equal(family.projectId, projectId);
    assert.equal(family.partnerAId, father);
    assert.equal(family.partnerBId, mother);
    assert.deepEqual(Array.from(family.childIds), [child]);
    assert.equal(family.parentChildTypes[father + '|' + child], 'Biological');
    assert.equal(family.parentChildTypes[mother + '|' + child], 'Biological');
    assert.ok(!parentFamilyById.has(child), 'repeated parent family: ' + child);
    parentFamilyById.set(child, family.id);
    for (const parentId of [father, mother])
    {
        assert.ok(!partnerFamilyById.has(parentId), 'repeated partner family: ' + parentId);
        partnerFamilyById.set(parentId, family.id);
        assert.equal(peopleById.get(child).birth.first.year -
            peopleById.get(parentId).birth.first.year, 30);
    }
    const familyKey = 'family:' + family.id;
    for (const personId of [father, mother, child])
    {
        const personKey = 'person:' + personId;
        membership.get(personKey).add(familyKey);
        membership.get(familyKey).add(personKey);
        membershipEdges += 1;
    }
}

assert.equal(parentFamilyById.size, 511);
assert.equal(partnerFamilyById.size, 1022);
assert.ok(!partnerFamilyById.has(id(1)), 'proband must be at bottom with no descendants');
for (let n = 1; n <= 511; n += 1)
    assert.ok(parentFamilyById.has(id(n)), 'missing parents for ' + n);
for (let n = 512; n <= 1023; n += 1)
    assert.ok(!parentFamilyById.has(id(n)), 'oldest ancestor must be a leaf');

let frontier = [id(1)];
for (let level = 1; level <= 9; level += 1)
{
    frontier = frontier.flatMap(personId =>
    {
        const family = fixture.families[Number(personId.slice(-4)) - 1];
        assert.ok(family, 'incomplete ancestry above ' + personId);
        return [family.partnerAId, family.partnerBId];
    });
    assert.equal(frontier.length, 2 ** level, 'ancestor row must be completely filled');
    assert.equal(new Set(frontier).size, frontier.length, 'ancestor row repeats a person');
    assert.equal(frontier[0], id(2 ** level));
    assert.equal(frontier.at(-1), id(2 ** (level + 1) - 1));
}

// Connected and acyclic PERSON–FAMILY graph prevents two visual paths
// to the same person, rather than merely checking for no ancestry cycles.
const discovered = new Set(['person:' + id(1)]);
const queue = [...discovered];
for (let i = 0; i < queue.length; i += 1)
    for (const node of membership.get(queue[i]))
        if (!discovered.has(node))
        {
            discovered.add(node);
            queue.push(node);
        }
assert.equal(discovered.size, membership.size, 'entire fixture must be connected');
assert.equal(membership.size, 1023 + 511);
assert.equal(membershipEdges, membership.size - 1, 'family graph must contain no loops');

assert.equal(run('validateProjectDraft(sampleData.projects[1], buildFamilyTreeStressTestFixture()).length'), 0);

const openedAt = performance.now();
assert.equal(run('ensureFamilyTreeStressTestProjectLoaded("' + projectId + '")'), true);
const openMs = performance.now() - openedAt;
assert.equal(run('sampleData.people.filter(p => p.projectId === "' + projectId + '").length'), 1023);
assert.equal(run('sampleData.families.filter(f => f.projectId === "' + projectId + '").length'), 511);
assert.ok(run('sampleData.events.filter(e => e.projectId === "' + projectId + '").length') >= 1023);
assert.equal(run('getProjectPeopleCount("' + projectId + '")'), 1023);

const treePeople = run('getTreePeopleFromSampleData("' + projectId + '")');
const treeFamilies = run('getTreeFamiliesFromSampleData("' + projectId + '")');
assert.equal(treePeople.length, 1023);
assert.equal(new Set(treePeople.map(person => person.id)).size, 1023);
assert.equal(treeFamilies.length, 511);
assert.equal(new Set(treeFamilies.map(family => family.id)).size, 511);
assert.ok(treeFamilies.every(family => family.left && family.right && family.children.length === 1));
for (let n = 1; n <= treeFamilies.length; n += 1)
{
    const family = treeFamilies[n - 1];
    assert.equal(family.fatherId, id(2 * n), 'Tree father must match numbered ancestry');
    assert.equal(family.motherId, id(2 * n + 1), 'Tree mother must match numbered ancestry');
    assert.deepEqual(Array.from(family.children), [id(n)]);
    assert.equal(family.missingFather, false, 'full ancestry must not display missing father');
    assert.equal(family.missingMother, false, 'full ancestry must not display missing mother');
}

// People directory must handle person records whose optional meta is absent.
const peopleDirectoryRecords = run('getPeopleRecordsFromSampleData("' + projectId + '")');
assert.equal(peopleDirectoryRecords.length, 1023);
assert.equal(new Set(peopleDirectoryRecords.map(person => person.id)).size, 1023);
assert.ok(peopleDirectoryRecords.every(person => person.updated === ''));
assert.equal(peopleDirectoryRecords[0].name, 'Person 0001');
run('sampleData.people.find(p => p.id === "stress-person-0001").meta = { updated: "Changed" }');
assert.equal(run('getPeopleRecordsFromSampleData("' + projectId + '")[0].updated'), 'Changed');
run('delete sampleData.people.find(p => p.id === "stress-person-0001").meta');

assert.equal(run('JSON.stringify([sampleData.people.filter(p => p.projectId === "p1"), sampleData.families.filter(f => f.projectId === "p1")])'), p1Before);
run('sampleData.people.find(p => p.id === "stress-person-0001").names.first = "Edited"');
const peopleCount = run('sampleData.people.length');
const familyCount = run('sampleData.families.length');
const eventCount = run('sampleData.events.length');
assert.equal(run('ensureFamilyTreeStressTestProjectLoaded("' + projectId + '")'), true);
assert.equal(run('sampleData.people.length'), peopleCount);
assert.equal(run('sampleData.families.length'), familyCount);
assert.equal(run('sampleData.events.length'), eventCount);
assert.equal(run('sampleData.people.find(p => p.id === "stress-person-0001").names.first'), 'Edited');

console.log(JSON.stringify({
    ok: true, people: fixture.people.length, families: fixture.families.length,
    ancestorLevelsAboveProband: 9, connectedMembershipNodes: discovered.size,
    noPedigreeCycles: true, buildMs: Math.round(buildMs),
    firstOpenMs: Math.round(openMs),
    note: 'Node timings are not browser render/layout measurements'
}, null, 2));
