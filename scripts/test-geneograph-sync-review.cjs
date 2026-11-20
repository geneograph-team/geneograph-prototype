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
    ADD_PERSON_MARRIAGE_TYPES: ['Civil', 'Religious'], PARENT_CHILD_RELATIONSHIP_TYPES: ['Biological', 'Adopted'], buildSampleEvents: () => []
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

const technicalOnly = context.geneoReviewRelationshipFields({ type: 'partner' },
    { ...boardFamily, events: [] },
    { ...treeFamily, relationshipType: boardFamily.relationshipType, events: [{ id: 'empty', gedcomTag: 'MARR',
        relationshipManagedRole: 'start', eventType: 'Marriage', typeLabel: '' }] }, ['one', 'two']);
assert.equal(technicalOnly.length, 0, 'empty event scaffolding must not create differences');

const recordedCivil = { ...treeFamily, marriageType: '', events: [{ ...treeFamily.events[0], typeLabel: 'Civil' }] };
const boardCivil = { ...recordedCivil, id: 'board-family', marriageType: 'Civil', events: [{ ...treeFamily.events[0], typeLabel: '' }] };
const pawford = { placeId: 'place-pawford', placeText: '', address: '' };
assert.ok(context.geneoReviewFactEquals('birth.place', pawford, { ...pawford, placeText: 'Pawford, England' }));
assert.ok(!context.geneoReviewFactEquals('birth.place', pawford, { ...pawford, address: '12 High Street' }));
assert.ok(!context.geneoReviewFactEquals('birth.place', pawford, { ...pawford, placeId: 'place-meowbridge' }));
const partner = { type: 'partner' };
assert.equal(context.geneoReviewRelationshipFields(partner, boardCivil, recordedCivil, ['one', 'two']).length, 0);
const religious = { ...recordedCivil, events: [{ ...recordedCivil.events[0], typeLabel: 'Religious' }] };
const marriageType = context.geneoReviewRelationshipFields(partner, boardCivil, religious, ['one', 'two'])[0];
assert.equal(marriageType.label, 'Marriage type');
marriageType.write(religious, marriageType.board);
assert.equal(religious.marriageType, 'Civil');
assert.equal(religious.events[0].typeLabel, 'Civil');
assert.deepEqual(religious.events[0].date, recordedCivil.events[0].date);

const missingEvent = context.geneoReviewRelationshipFields({ type: 'partner' },
    { ...boardFamily, events: [] }, { ...treeFamily, relationshipType: boardFamily.relationshipType,
        events: [{ ...treeFamily.events[0], date: { date: '2001' }, address: '', placeText: '' }] }, ['one', 'two']);
assert.deepEqual(Array.from(missingEvent, row => row.displayLabel), ['Marriage date']);
assert.ok(missingEvent.every(row => row.boardBlocked && !row.treeBlocked));
context.escapeHtml = text => String(text);
context.icon = { arrow: '[arrow]' };
vm.runInContext(read('geneograph-tree-review-relatives.js'), context);
vm.runInContext(read('geneograph-tree-import.js'), context);
assert.equal(context.geneoReviewRelationshipNotice(missingEvent), '');
const dateDestination = { events: [] };
missingEvent[0].write(dateDestination, missingEvent[0].tree, 'tree');
assert.deepEqual(dateDestination.events[0].date, { date: '2001' });
assert.equal(dateDestination.events[0].placeText, undefined);
assert.equal(dateDestination.events[0].typeLabel, undefined);
assert.equal(dateDestination.events[0].customMetadata, undefined);
const oneWay = context.geneoReviewComparisonRow('Marriage date', '2000', '2001', 'board', 'data-test', { treeBlocked: true });
assert.match(oneWay, /aria-pressed="true"/);
assert.equal((oneWay.match(/class="gr-transfer /g) || []).length, 1);

const fieldRows = context.geneoReviewRelationshipFields({ type: 'partner' },
    { ...boardFamily, events: [] }, treeFamily, ['one', 'two']);
const fieldDestination = { events: [] };
for (const row of fieldRows.filter(item => ['Date', 'Place'].includes(item.label)))
    row.write(fieldDestination, row.tree, 'tree');
assert.equal(fieldDestination.events.length, 1);
assert.equal(fieldDestination.events[0].date.date, '2001');
assert.equal(fieldDestination.events[0].placeText, 'Tree place');
assert.equal(fieldDestination.events[0].address, undefined);

const parents = context.geneoTreeImportRelations({ families: [
    { id: 'parent-pair', partnerIds: ['a', 'b'], children: [{ personId: 'child' }] }
], connections: [] }, new Set(['a', 'b', 'child']));
const parentRows = parents.filter(row => row.type === 'child');
assert.deepEqual(Array.from(parentRows, row => Array.from(row.ids)), [['a', 'child'], ['b', 'child']]);
assert.notEqual(parentRows[0].id, parentRows[1].id);

const moveContext = context;
moveContext.normalizeGeneographPersonNames = record => record.names;
moveContext.emptyGenealogyDate = () => ({});
for (const record of [...board.diagram.people, ...sampleData.people]) {
    record.names = { first: record.id, last: 'Example' };
    record.gender = 'unknown';
    record.livingStatus = 'Unknown';
}
const unlinked = { id: 'c', names: { first: 'c', last: 'Example' }, gender: 'unknown', livingStatus: 'Unknown', projectId: 'project' };
board.diagram.people.push(unlinked);
board.diagram.nodes.push({ id: 'c', personId: 'c', type: 'person' });
const moveDraft = moveContext.geneoReviewDraft(board, 'a');
moveContext.geneoStageReviewBoardLink(moveDraft, board.diagram.people[0], 'c');
assert.equal(moveDraft.activePersonId, 'c');
const duplicateDraft = moveContext.geneoReviewDraft(board, 'a');
moveContext.geneoStageReviewTreeLink(duplicateDraft, board.diagram.people[0], 'two');
assert.equal(duplicateDraft.choices.get('a'), 'one');
assert.match(duplicateDraft.error, /already represented/);
const newTree = person('three');
Object.assign(newTree, { names: { first: 'Three' }, gender: 'unknown', livingStatus: 'Unknown' });
sampleData.people.push(newTree);
moveContext.createGeneographLinkedBoardPerson = record => ({ ...record, id: 'board-' + record.id, treePersonId: record.id });
const replaceDraft = moveContext.geneoReviewDraft(board, 'a');
replaceDraft.fields.set('a', new Map([['names.first', 'board']]));
moveContext.geneoStageReviewTreeLink(replaceDraft, board.diagram.people[0], 'three');
assert.equal(replaceDraft.choices.get('a'), 'one');
assert.match(replaceDraft.error, /Clear selected transfers/);
replaceDraft.fields.clear();
moveContext.geneoStageReviewTreeLink(replaceDraft, board.diagram.people[0], 'three');
assert.equal(replaceDraft.choices.get('a'), 'three');
assert.equal(board.diagram.people[0].treePersonId, 'one');
sampleData.people.pop();
const moved = moveContext.geneoTreeImportPreview(moveDraft);
assert.equal(moved.error, '');
assert.equal(moved.mapping.get('c'), 'one');
assert.equal(moved.mapping.has('a'), false);
assert.equal(moved.patches.find(patch => patch.id === 'a').after.treePersonId, null);
assert.equal(moved.patches.find(patch => patch.id === 'c').after.treePersonId, 'one');
assert.equal(board.diagram.people[0].treePersonId, 'one');
assert.equal(unlinked.treePersonId, undefined);

moveContext.familyPartnerAId = family => family.partnerAId || family.parentAId;
moveContext.familyPartnerBId = family => family.partnerBId || family.parentBId;
moveContext.geneoPersonDisplayName = person => person.names.first + ' ' + person.names.last;
moveContext.geneoPersonInitials = person => person.names.first[0];
boardFamily.children.push({ personId: 'c', parentageType: 'biological' });
const addDraft = moveContext.geneoReviewDraft(board, 'a');
const onlyFather = addDraft.relations.find(relation => relation.type === 'child' && relation.ids[0] === 'a');
moveContext.geneoStageReviewRelativeTarget(addDraft, onlyFather.id, 'c', 'create');
assert.equal(addDraft.relationChoices.get(onlyFather.id), 'board');
const added = moveContext.geneoTreeImportPreview(addDraft);
assert.equal(added.error, '');
const addedRecord = added.patches.find(patch => patch.key === 'people' && patch.before === null);
assert.ok(addedRecord);
const newParentFamily = added.patches.find(patch => patch.key === 'families' && patch.before === null);
assert.equal(newParentFamily.after.partnerAId, 'one');
assert.equal(newParentFamily.after.partnerBId, '');
assert.deepEqual(newParentFamily.after.childIds, [addedRecord.id]);
assert.equal(added.patches.filter(patch => patch.key === 'families').length, 2);
assert.ok(!sampleData.people.some(record => record.id === addedRecord.id));
const automaticDraft = moveContext.geneoReviewDraft(board, 'c');
automaticDraft.choices.set('c', 'create');
const automaticPlan = moveContext.geneoTreeImportPreview(automaticDraft);
assert.equal(automaticPlan.error, '');
assert.equal(automaticPlan.operations.filter(item => item.type === 'relationship').length, 2);
assert.ok(automaticPlan.patches.some(item => item.key === 'people' && item.before === null));
assert.equal(automaticDraft.relationChoices.size, 0);
automaticDraft.choices.set('c', 'skip');
assert.equal(moveContext.geneoTreeImportPreview(automaticDraft).patches.length, 0);
boardFamily.children.pop();

console.log('Person-first board sync, isolated field projection, and version conflict checks passed.');
