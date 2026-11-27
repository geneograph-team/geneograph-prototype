'use strict';

// TEMPORARY INTERNAL QA FIXTURE. Remove before open user testing.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const context = vm.createContext({
    console, performance, structuredClone, TextDecoder, TextEncoder, Blob, File, URL, Response, AbortSignal,
    state: { language: 'en' }, prototypeSessionEditRevision: 0,
    validProjectById: id => vm.runInContext('sampleData', context).projects.find(project => project.id === id),
    document: { documentElement: { lang: 'en' } },
    t: value => value, translateText: value => value,
    localizedDataFieldValue: value => value, escapeHtml: value => value,
    getPlaceDisplay: () => '', getPlaceEventDisplay: () => '',
    getPersonPhotoCount: () => 0, getArchiveFilesForPerson: () => [], getNotesForPerson: () => [],
    sourceIdsForTarget: () => [], timelineYearFromValue: date => date?.first?.year || '',
    treeDefaultPersonId: projectId => projectId === 'p1' ? 'silver' : 'p-family-tree-stress-person-1',
    cleanEditFieldValue: value => String(value ?? ''), currentProjectId: () => null
});
for (const file of [
    'seed/sample-data', 'shared/genealogy-dates', 'shared/person-name-helpers', 'modules/places/place-record-helpers',
    'core/project-read-model', 'shared/relationships', 'shared/project-read-providers', 'modules/family-tree/relationships', 'shared/tree-seed-model',
    'modules/people/person-form-fields', 'modules/people/person-editor', 'modules/people/relationship-editor',
    'modules/archive/archive-sources', 'modules/people/directory', 'core/validation', 'modules/archive/archive-documents',
    'modules/projects/gedcom-import', 'seed/family-tree-stress-data', 'seed/family-tree-stress-test'
])
{
    const filename = path.join(__dirname, '../../src', file + '.js');
    vm.runInContext(fs.readFileSync(filename, 'utf8'), context, { filename });
}

const run = code => vm.runInContext(code, context);
const projectId = 'p-family-tree-stress';
const focus = 'p-family-tree-stress-person-1';
const sample = run('sampleData');
const project = sample.projects.find(item => item.id === projectId);
const scoped = key => sample[key].filter(record => record.projectId === projectId);
const whiskerfield = () => JSON.stringify([sample.people.filter(p => p.projectId === 'p1'),
    sample.families.filter(f => f.projectId === 'p1')]);
const p1Before = whiskerfield();
assert.equal(sample.projects.length, 2);
assert.equal(project.defaultPersonId, focus);
assert.equal(context.getProjectPeopleCount(projectId), 6481);
assert.equal(scoped('people').length, 0);
assert.equal(scoped('families').length, 0);
assert.equal(context.ensureFamilyTreeStressTestProjectLoaded('p1'), true);

const source = run('FAMILY_TREE_STRESS_TEST_GEDCOM');
const parsed = context.parseGedcomImport(source);
const individuals = parsed.roots.filter(record => record.tag === 'INDI');
const familyRecords = parsed.roots.filter(record => record.tag === 'FAM');
assert.equal(individuals.length, 6481);
assert.equal(familyRecords.length, 1950);
assert.equal(source.split(/\r?\n/).filter(line => /^2 DATE /.test(line)).length, 7237);
const start = performance.now();
const draft = context.buildFamilyTreeStressTestFixture(project);
const buildMs = performance.now() - start;
assert.deepEqual(Array.from(draft.errors), []);
assert.equal(draft.records.people.length, 6481);
assert.equal(draft.records.families.length, 1950);
assert.equal(new Set(draft.records.people.map(p => p.id)).size, 6481);
assert.equal(new Set(draft.records.families.map(f => f.id)).size, 1950);
assert.equal(draft.project.defaultPersonId, focus);
assert.equal(draft.records.people[0].names.first, 'Person');
assert.equal(draft.records.people[0].names.last, '2573');
assert.equal(draft.records.people[0].birth.first.year, 1999);
assert.equal(draft.records.people[0].birth.first.month, 4);
assert.equal(draft.records.people[0].birth.first.day, 4);

const canonicalByXref = new Map(individuals.map((record, index) => [record.xref, draft.records.people[index].id]));
const familyByXref = new Map(draft.records.families.map(record => [record.gedcomXref, record]));
const childClaims = new Map();
for (const person of individuals)
{
    for (const link of person.children.filter(node => node.tag === 'FAMC'))
    {
        if (!childClaims.has(link.value)) childClaims.set(link.value, []);
        childClaims.get(link.value).push(person.xref);
    }
}
for (const sourceFamily of familyRecords)
{
    const family = familyByXref.get(sourceFamily.xref);
    assert.ok(family);
    const member = tag => sourceFamily.children.find(node => node.tag === tag)?.value;
    assert.equal(family.partnerAId, canonicalByXref.get(member('HUSB')) || '');
    assert.equal(family.partnerBId, canonicalByXref.get(member('WIFE')) || '');
    const expectedChildren = new Set([...sourceFamily.children.filter(node => node.tag === 'CHIL').map(node => node.value),
        ...(childClaims.get(sourceFamily.xref) || [])].map(xref => canonicalByXref.get(xref)));
    assert.deepEqual(new Set(family.childIds), expectedChildren);
}
assert.ok(draft.records.people.every(person => person.names.first === 'Person' && /^\d{4}$/.test(person.names.last)));
for (const key of ['places', 'media', 'archiveFiles', 'sources', 'sourceLinks', 'notes'])
    assert.equal(draft.records[key].length, 0, key);
assert.throws(() => context.buildFamilyTreeStressTestFixture(project, 'invalid GEDCOM'));
assert.equal(scoped('people').length, 0);
assert.equal(scoped('families').length, 0);

const openedAt = performance.now();
assert.equal(context.ensureFamilyTreeStressTestProjectLoaded(projectId), true);
const openMs = performance.now() - openedAt;
assert.equal(scoped('people').length, 6481);
assert.equal(scoped('families').length, 1950);
assert.ok(scoped('events').length > 0);
assert.equal(context.getProjectPeopleCount(projectId), 6481);
assert.equal(whiskerfield(), p1Before);
assert.equal(JSON.stringify(scoped('people')), JSON.stringify(draft.records.people));
assert.equal(JSON.stringify(scoped('families')), JSON.stringify(draft.records.families));
const treePeople = context.getTreePeopleFromSampleData(projectId);
const directory = context.peopleDirectoryContext(projectId).records;
assert.equal(treePeople.length, 6481);
assert.equal(new Set(treePeople.map(person => person.id)).size, 6481);
assert.equal(directory.length, 6481);
assert.equal(new Set(directory.map(person => person.id)).size, 6481);
const first = scoped('people').find(person => person.id === focus);
first.names.first = 'Edited';
const eventCount = scoped('events').length;
assert.equal(context.ensureFamilyTreeStressTestProjectLoaded(projectId), true);
assert.equal(scoped('people').length, 6481);
assert.equal(scoped('families').length, 1950);
assert.equal(scoped('events').length, eventCount);
assert.equal(scoped('people').find(person => person.id === focus).names.first, 'Edited');
assert.equal(whiskerfield(), p1Before);
console.log(JSON.stringify({ ok: true, people: 6481, families: 1950,
    buildMs: Math.round(buildMs), firstOpenMs: Math.round(openMs),
    note: 'Node timings are not browser render/layout measurements' }, null, 2));
