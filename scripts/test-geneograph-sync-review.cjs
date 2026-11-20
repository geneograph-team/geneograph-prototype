'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const read = file => fs.readFileSync(path.join(__dirname, '..', 'src', 'modules', 'geneograph', file), 'utf8');
const person = (id, treePersonId) => ({ id, treePersonId, projectId: 'project' });
const boardFamily = { id: 'board-family', partnerIds: ['a', 'b'], children: [],
    relationshipType: 'Partner', relationshipStatus: 'active', marriageType: '', events: [] };
const treeFamily = { id: 'tree-family', projectId: 'project', parentAId: 'one', parentBId: 'two',
    childIds: [], relationshipType: 'Married', relationshipStatus: 'active', marriageType: '', events: [] };
const board = { id: 'board', projectId: 'project', diagram: { people: [person('a', 'one'), person('b', 'two')],
    families: [boardFamily], connections: [], nodes: ['a', 'b'].map(personId => ({ id: personId, personId, type: 'person' })) } };
const sampleData = { people: [person('one'), person('two')], families: [treeFamily], events: [], sourceLinks: [], archiveFiles: [] };
let id = 0;
const context = vm.createContext({
    structuredClone, sampleData, t: text => text, getPerson: id => sampleData.people.find(record => record.id === id),
    getGeneographBoard: () => board, currentProjectId: () => 'project', createRuntimeId: type => type + ++id,
    familyPartnerAId: family => family.parentAId, familyPartnerBId: family => family.parentBId,
    relationshipTypeFromLegacy: family => family.relationshipType, partnerRelationshipStartEvent: family =>
        family.events.find(event => event.relationshipManagedRole === 'start'), partnerRelationshipEndEvent: () => null,
    normalizeGenealogyDateInput: value => ({ date: value.date ?? '' }), formatGenealogyDateLabel: value => value?.date || '',
    getPlaceDisplay: () => '', connectPersonName: record => record.id,
    parentChildRelationshipKey: (parent, child) => parent + '|' + child,
    parentChildRelationshipType: (family, parent, child) => family.parentChildTypes?.[parent + '|' + child] || 'Biological',
    PARENT_CHILD_RELATIONSHIP_TYPES: ['Biological', 'Adopted'], buildSampleEvents: () => []
});
vm.runInContext(read('geneograph-tree-review-model.js'), context);
const relationId = 'board-family:partner';
const draft = context.geneoReviewDraft(board, 'a');
assert.equal(draft.scope, 'board');
const fields = plan => plan.relationshipFields.get(relationId);
const initial = context.geneoTreeImportPreview(draft);
assert.deepEqual(Array.from(fields(initial), row => row.label), ['Relationship type']);
assert.equal(initial.patches.length, 0);

boardFamily.events = [{ id: 'be', relationshipManagedRole: 'start', gedcomTag: 'MARR', eventType: 'Marriage',
    date: { date: '2000' }, placeText: 'Board place', address: 'Same address', customMetadata: { board: true } }];
treeFamily.events = [{ id: 'te', relationshipManagedRole: 'start', gedcomTag: 'MARR', eventType: 'Marriage',
    date: { date: '2001' }, placeText: 'Tree place', address: 'Same address', customMetadata: { tree: true } }];
const updated = context.geneoReviewDraft(board, 'a');
const choices = fields(context.geneoTreeImportPreview(updated));
assert.deepEqual(Array.from(choices, row => row.label), ['Relationship type', 'Date', 'Place']);
updated.relationshipFields.set(relationId, new Map([[choices[0].key, 'tree'], [choices[1].key, 'board'], [choices[2].key, 'tree']]));
const plan = context.geneoTreeImportPreview(updated);
assert.equal(plan.error, '');
assert.equal(plan.operations.length, 3);
const treePatch = plan.patches.find(patch => patch.key === 'families');
const boardPatch = plan.patches.find(patch => patch.key === 'board.families');
assert.deepEqual(treePatch.after, { ...treeFamily, events: [{ ...treeFamily.events[0], date: { date: '2000' } }] });
assert.deepEqual(boardPatch.after, { ...boardFamily, relationshipType: 'Married',
    events: [{ ...boardFamily.events[0], placeId: null, placeText: 'Tree place' }] });
assert.equal(treeFamily.events[0].date.date, '2001');
assert.equal(boardFamily.relationshipType, 'Partner');

treeFamily.events[0].address = 'Edited outside review';
assert.match(context.geneoTreeImportPreview(updated).error, /Refresh the review/);
treeFamily.events[0].address = 'Same address';
updated.relationshipFields.get(relationId).delete(choices[1].key);
assert.ok(!context.geneoTreeImportPreview(updated).patches.some(patch => patch.key === 'families'));

const parentage = context.geneoReviewRelationshipFields({ type: 'child', ids: ['a', 'b', 'child'] },
    { partnerIds: ['a', 'b'], children: [{ personId: 'child', parentageType: 'biological' }] },
    { id: 'family', parentChildTypes: { 'one|tree-child': 'Adopted', 'two|tree-child': 'Biological' } }, ['one', 'two', 'tree-child']);
assert.equal(parentage.length, 1);
assert.equal(parentage[0].treeBlocked, true);
const target = { parentChildTypes: { 'one|tree-child': 'Adopted', 'two|tree-child': 'Biological', unrelated: 'Adopted' } };
parentage[0].write(target, parentage[0].board, 'board');
assert.deepEqual(target.parentChildTypes, { 'one|tree-child': 'Biological', 'two|tree-child': 'Biological', unrelated: 'Adopted' });

console.log('Person-first board sync, isolated field projection, and version conflict checks passed.');
