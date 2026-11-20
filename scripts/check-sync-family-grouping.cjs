'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const context = vm.createContext({ structuredClone,
    PARENT_CHILD_RELATIONSHIP_TYPES: ['Biological', 'Adopted'],
    familyPartnerAId: family => family.parentAId,
    familyPartnerBId: family => family.parentBId
});
vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/modules/geneograph/geneograph-tree-review-model.js'), 'utf8'), context);
// Relationship metadata copying is separately owned; verify that grouping invokes it.
context.geneoReviewCopyRelationship = (source, target) => {
    target.relationshipType = source.relationshipType;
    target.events = structuredClone(source.events);
};
const single = (id, parent, children, type = 'biological') => ({ id, partnerIds: [parent],
    children: children.map(personId => ({ personId, parentageType: type })),
    events: [], marriageType: '', relationshipType: 'Unknown relationship' });
const halfSiblings = [single('both', 'father', ['edith']), single('other', 'father', ['fiona'])];
assert.equal(context.geneoReviewBoardSiblings(halfSiblings, ['edith', 'fiona']), true);
assert.equal(context.geneoReviewBoardSiblings(halfSiblings, ['edith', 'unrelated']), false);
assert.equal(context.geneoReviewBoardSiblings([{ partnerIds: [], children: [{ personId: 'a' }, { personId: 'b' }] }], ['a', 'b']), true);
const treeFamily = { id: 'tree', parentAId: 'tree-father', parentBId: 'tree-mother', childIds: ['tree-child'], relationshipType: 'Married', events: [{ id: 'marriage' }] };
const mapping = new Map([['father', 'tree-father'], ['mother', 'tree-mother'], ['child', 'tree-child']]);
const draft = { treeConnectionIds: new Map([['tree:tree:partner', 'partner-line']]) };
const fixture = () => ({
    'board.families': [single('father-family', 'father', ['child']), single('mother-family', 'mother', ['child'], 'adopted')],
    'board.nodes': [{ id: 'father-node', personId: 'father', x: 0 }, { id: 'mother-node', personId: 'mother', x: 200 }, { id: 'child-node', personId: 'child', x: 100 }],
    'board.connections': ['father', 'mother'].map(parent => ({ id: parent + '-line', familyId: parent + '-family', kind: 'family-child', source: { nodeId: parent + '-node', port: 'bottom' }, target: { nodeId: 'child-node', port: 'top' } }))
});
const projected = fixture();
const original = structuredClone(projected);
context.geneoReviewCoalesceBoardParents(draft, projected, mapping, treeFamily, () => {});
assert.equal(projected['board.families'].length, 1);
const family = projected['board.families'][0];
assert.deepEqual(Array.from(family.partnerIds), ['father', 'mother']);
assert.equal(family.children[0].parentChildTypes.father, 'biological');
assert.equal(family.children[0].parentChildTypes.mother, 'adopted');
assert.equal(family.relationshipType, 'Married');
assert.equal(family.events[0].id, 'marriage');
assert.equal(projected['board.connections'].filter(line => line.kind === 'family-child').length, 1);
assert.equal(projected['board.connections'].filter(line => line.kind === 'family-partner').length, 1);
assert.equal(projected['board.connections'].find(line => line.kind === 'family-child').source.familyId, family.id);
context.geneoReviewCoalesceBoardParents(draft, projected, mapping, treeFamily, () => {});
assert.equal(projected['board.connections'].length, 2);
assert.equal(original['board.families'].length, 2);
const separate = fixture();
separate['board.families'][1].children.push({ personId: 'half-sibling', parentageType: 'biological' });
context.geneoReviewCoalesceBoardParents(draft, separate, new Map([...mapping, ['half-sibling', 'tree-half']]), { ...treeFamily, childIds: ['tree-child', 'tree-half'] }, () => {});
assert.equal(separate['board.families'].length, 2);
const oneParent = fixture();
oneParent['board.families'].pop();
context.geneoReviewCoalesceBoardParents(draft, oneParent, mapping, treeFamily, () => {});
assert.equal(oneParent['board.families'][0].partnerIds.length, 1);
console.log('Sync shared-parent siblings, parent grouping, types, routes, and partial-family checks passed.');
