'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const read = file => fs.readFileSync(path.join(__dirname, '../..', file), 'utf8');
const source = read('src/modules/people/relationship-editor.js');
const take = (start, end) => source.slice(source.indexOf('function ' + start), source.indexOf('function ' + end));
const roles = read('src/shared/relationships.js').split('function familyFatherId')[0];
const parentage = read('src/modules/family-tree/relationships.js').split('function parentChildRelationshipTypeFieldLabel')[0];
const context = vm.createContext({ assert, console });
vm.runInContext(roles + parentage + read('src/modules/family-tree/tree-branches.js')
    + take('relationshipRoleHintForPerson(', 'uniqueFamilyId(')
    + take('assignParentToFamily(', 'createParentChildFamily(')
    + `
    const people = [{ id: 'R', gender: 'male' }, { id: 'F', gender: 'male' }, { id: 'N', gender: 'unknown' }];
    function getPerson(id) { return people.find(person => person.id === id); }
    function familyIncludesPerson(family, id) { return familyPartnerAId(family) === id || familyPartnerBId(family) === id; }
    function normalizeParentChildRelationshipType(value) { return value || 'Unknown parentage'; }
    const original = { id: 'r', partnerAId: 'F', partnerARoleHint: 'HUSB', childIds: ['R'],
        parentChildTypes: { 'F|R': 'Biological' } };
    const created = { id: 'f', partnerAId: '', partnerBId: '', childIds: ['F'],
        parentChildTypes: { 'N|F': 'Biological' } };
    assert.equal(assignParentToFamily(created, 'N', 'mother'), true);
    assert.equal(created.partnerBId, 'N');
    assert.equal(created.partnerBRoleHint, 'WIFE');
    assert.equal(resolveTreeBranches(treeBranchGraph(people, [original, created]), 'R', 4, false).ancestor.get('N').has(3), true);
    const generic = { ...created, partnerAId: '', partnerBId: '', partnerARoleHint: '', partnerBRoleHint: '' };
    assert.equal(assignParentToFamily(generic, 'N'), true);
    assert.equal(familyPartnerRole(generic, 'N', { explicitOnly: true }), '');
    assert.equal(resolveTreeBranches(treeBranchGraph(people, [original, generic]), 'R', 4, false).ancestor.has('N'), false);
    `, context);
console.log('Explicit mother creation with unknown gender retains ancestry role; unspecified roles stay neutral.');
