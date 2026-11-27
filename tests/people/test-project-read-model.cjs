'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const read = file => fs.readFileSync(path.join(__dirname, '../../src', file), 'utf8');
const projects = [{ id: 'a' }, { id: 'b' }, { id: 'deleted', deleted: true }];
const person = (id, projectId, gender = '') => ({ id, projectId, gender });
const a = person('same', 'a', 'male');
const b = person('same', 'b', 'female');
const partner = person('partner', 'a', 'female');
const child = person('child', 'a', 'female');
const deleted = { ...person('deleted-person', 'a'), deleted: true };
const people = [a, b, partner, child, deleted];
const family = { id: 'f', projectId: 'a', partnerAId: a.id, partnerBId: partner.id, childIds: [child.id, 'missing', child.id] };
const second = { id: 'g', projectId: 'a', partnerAId: a.id, childIds: [deleted.id] };
const foreignFamily = { id: 'f', projectId: 'b', partnerAId: b.id, childIds: [] };
const sampleData = { families: [family, foreignFamily, second] };
let peoplePasses = 0;
let unloadUpdates = 0;
const context = vm.createContext({
    sampleData,
    validProjectById: id => projects.find(project => project.id === id && !project.deleted),
    getPeople(id)
    {
        peoplePasses++;
        return people.filter(person => person.projectId === id);
    },
    getPerson: id => people.find(person => person.id === id),
    treeDefaultPersonId: () => 'same',
    invalidateLinkedPlaceDismissals() {}
});
for (const file of ['core/project-read-model.js', 'shared/relationships.js', 'shared/project-read-providers.js'])
    vm.runInContext(read(file), context, { filename: file });
const bootstrap = read('core/bootstrap.js').split('function prototypeSessionBeforeUnload')[0];
context.updatePrototypeSessionUnloadGuard = () => { unloadUpdates++; };
vm.runInContext(bootstrap, context, { filename: 'bootstrap edit contract' });

const {
    acquireProjectReadModel, setProjectReadModelActive, disposeProjectReadModel, markPrototypeSessionEdited,
    projectPeopleIndex, projectFamilyIndex, projectRelationshipLabels, getParents, getChildren, getPartnerRelationships
} = context;
let familyPasses = 0;
const centralFamilyRecords = context.centralFamilyRecords;
context.centralFamilyRecords = () => { familyPasses++; return centralFamilyRecords(); };
let graphPasses = 0;
const buildGraph = context.buildPersonRelationshipGraph;
context.buildPersonRelationshipGraph = (...args) => { graphPasses++; return buildGraph(...args); };
setProjectReadModelActive('a');
assert.equal(peoplePasses, 0);
assert.equal(familyPasses, 0);
const handle = acquireProjectReadModel('a');
const peopleIndex = projectPeopleIndex(handle);
assert.equal(peopleIndex.rawById.get(a.id), a);
assert.equal(peopleIndex.rawById.get(deleted.id), deleted);
assert.equal(peopleIndex.eligibleById.has(deleted.id), false);
assert.equal(peopleIndex.rawById.set, undefined);
assert.equal(projectPeopleIndex(acquireProjectReadModel('a')), peopleIndex);
assert.equal(peoplePasses, 1);
assert.equal(familyPasses, 0);
assert.equal(graphPasses, 0);
const families = projectFamilyIndex(handle);
assert.deepEqual(Array.from(families.partnerFamilies(a.id)), [family, second]);
assert.deepEqual(Array.from(families.parentFamilies(child.id)), [family]);
assert.equal(families.byId.get(family.id), family);
assert.deepEqual(Array.from(getParents(child.id, families), parent => parent.id), [a.id, partner.id]);
assert.deepEqual(Array.from(getChildren(a.id, families), person => person.id), [child.id, deleted.id]);
assert.deepEqual(Array.from(getPartnerRelationships(a.id, families)), [family]);
assert.equal(familyPasses, 1);
assert.equal(graphPasses, 0);
const labels = projectRelationshipLabels(handle, a.id);
assert.equal(labels.get(child.id), 'Daughter');
assert.equal(labels.get(a.id), 'Self');
assert.equal(projectRelationshipLabels(handle, a.id), labels);
assert.equal(projectRelationshipLabels(handle, child.id).get(a.id), 'Father');
assert.equal(graphPasses, 1);

const token = handle.revisionToken(['people', 'families']);
markPrototypeSessionEdited('a', ['notes']);
assert.equal(handle.revisionToken(['people', 'families']), token);
assert.equal(projectPeopleIndex(handle), peopleIndex);
assert.equal(projectFamilyIndex(handle), families);
assert.equal(peoplePasses, 1);
family.childIds = [deleted.id, child.id];
markPrototypeSessionEdited('a', ['families', 'families']);
assert.notEqual(handle.revisionToken(['people', 'families']), token);
assert.notEqual(projectFamilyIndex(handle), families);
assert.equal(projectPeopleIndex(handle), peopleIndex);
assert.equal(familyPasses, 2);
assert.equal(projectRelationshipLabels(handle, a.id).get(child.id), 'Daughter');
assert.equal(graphPasses, 2);

child.deleted = true;
markPrototypeSessionEdited('a', ['people', 'notes']);
assert.equal(projectPeopleIndex(handle).eligibleById.has(child.id), false);
child.deleted = false;
markPrototypeSessionEdited();
assert.equal(projectPeopleIndex(handle).eligibleById.has(child.id), true);
assert.equal(unloadUpdates, 1);
assert.equal(vm.runInContext('prototypeSessionEditRevision', context), 4);
assert.equal(vm.runInContext('prototypeSessionHasEdits', context), true);

const nonActive = acquireProjectReadModel('b');
assert.equal(nonActive.generation, null);
assert.equal(projectPeopleIndex(nonActive).rawById.get(b.id), b);
assert.notEqual(projectPeopleIndex(nonActive), projectPeopleIndex(nonActive));
assert.equal(projectPeopleIndex(acquireProjectReadModel('deleted')).rawById.size, 0);
assert.equal(projectPeopleIndex(acquireProjectReadModel('missing')).rawById.size, 0);
setProjectReadModelActive('b');
const liveB = acquireProjectReadModel('b');
const cachedB = projectPeopleIndex(liveB);
assert.notEqual(liveB.generation, handle.generation);
assert.equal(handle.revisionToken(['people']), null);
assert.equal(projectFamilyIndex(liveB).byId.get(foreignFamily.id), foreignFamily);
assert.equal(projectPeopleIndex(handle).rawById.get(a.id), a);
assert.equal(projectPeopleIndex(liveB), cachedB);

projects[1] = { id: 'b' };
setProjectReadModelActive('b');
assert.equal(projectPeopleIndex(liveB).rawById.size, 0);
assert.notEqual(projectPeopleIndex(acquireProjectReadModel('b')), cachedB);
assert.throws(() => context.withoutProjectReadModelRetention(() =>
{
    setProjectReadModelActive('b');
    assert.equal(acquireProjectReadModel('b').generation, null);
    throw Error('simulated rollback');
}), /simulated rollback/);
setProjectReadModelActive('b');
assert.notEqual(acquireProjectReadModel('b').generation, null);
disposeProjectReadModel();
assert.equal(acquireProjectReadModel('b').generation, null);
console.log('Read-model lazy builds, scoped memberships, typed edits, fallback and disposal passed.');

