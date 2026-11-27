const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const context = vm.createContext({ assert, console, performance });
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, '../..', file), 'utf8');
const roles = read('src/shared/relationships.js').split('function familyFatherId')[0];
const parentage = read('src/modules/family-tree/relationships.js').split('function parentChildRelationshipTypeFieldLabel')[0];
vm.runInContext(roles + parentage + read('src/modules/family-tree/tree-branches.js'), context);
vm.runInContext('function normalizeParentChildRelationshipType(value) {return value || "Unknown parentage";}', context);
vm.runInContext('(' + function ()
{
    const person = id => ({ id });
    const family = (id, father, mother, childIds, explicit = true) => ({
        id, partnerAId: father, partnerBId: mother, childIds,
        partnerARoleHint: explicit ? 'HUSB' : '', partnerBRoleHint: explicit ? 'WIFE' : '',
        parentChildTypes: Object.fromEntries(childIds.flatMap(child => [father, mother].filter(Boolean)
            .map(parent => [parent + '|' + child, 'Biological'])))
    });
    const people = [person('R')], families = [];
    let frontier = ['R'];
    const generations = [];
    for (let i = 0; i < 5; i++)
    {
        const next = [];
        for (const id of frontier)
        {
            const father = id + 'F', mother = id + 'M';
            people.push(person(father), person(mother));
            families.push(family(id, father, mother, [id]));
            next.push(father, mother);
        }
        generations.push(next);
        frontier = next;
    }
    assert.equal(people.length, 63);
    const toJson = slots => JSON.stringify(slots);
    const expected = [[1, 2], [1, 3, 2, 4], [1, 5, 3, 6, 2, 7, 4, 8],
        [1, 9, 5, 10, 3, 11, 6, 12, 2, 13, 7, 14, 4, 15, 8, 16]];
    for (const preset of [2, 4, 8, 16])
    {
        const result = resolveTreeBranches(treeBranchGraph(people, families), 'R', preset, false);
        let order;
        generations.forEach((ids, index) =>
        {
            order = index < Math.log2(preset) ? expected[index] : order.flatMap(slot => [slot, slot]);
            assert.equal(toJson(ids.map(id => [...result.ancestor.get(id)][0])), toJson(order));
        });
        assert.equal(result.ancestor.get('R'), undefined);
        assert.equal(result.ancestor.get('RMF').has(2), true);
    }
    const missing = resolveTreeBranches(treeBranchGraph(people, families.filter(item => item.id !== 'RF')), 'R', 4, false);
    assert.equal(missing.originIds[2], '');
    assert.equal(missing.originIds[3], 'RMM');
    const unknown = resolveTreeBranches(treeBranchGraph(people, [family('unknown', 'RF', 'RM', ['R'], false)]), 'R', 2, true);
    assert.equal(unknown.ancestor.size, 0);
    const conflict = resolveTreeBranches(treeBranchGraph(people,
        [...families, family('rival', 'RFF', null, ['R'])]), 'R', 2, true);
    assert.equal(conflict.originIds[0], '');
    const people2 = ['R', 'E', 'G', 'C', 'D', 'A', 'B', 'L', 'W', 'J', 'X', 'Y'].map(person);
    const families2 = [family('root', 'E', 'G', ['R']), family('e', 'C', null, ['E']),
        family('g', 'D', null, ['G']), family('same', 'A', 'B', ['C', 'D']),
        family('collateral', 'C', 'W', ['L']), family('overlap', 'C', 'D', ['J']),
        family('down', 'R', 'X', ['Y'])];
    const graph = treeBranchGraph(people2, families2);
    const result = resolveTreeBranches(graph, 'R', 2, true);
    assert.equal(result.collateral.get('L').has(1), true);
    assert.equal(result.collateral.get('J').size, 2);
    assert.equal(result.collateral.has('W'), false);
    assert.equal(result.collateral.has('Y'), false);
    assert.equal(resolveTreeBranches(graph, 'R', 2, false).collateral.size, 0);
    const cards = ['R', 'E', 'G', 'C', 'D', 'A-one', 'A-two', 'B-one', 'B-two'].map(id =>
        ({ id, canonicalPersonId: id.split('-')[0], occurrenceCount: id.includes('-') ? 2 : 1 }));
    const scene = { cards, byOccurrence: new Map(cards.map(card => [card.id, card])), colorFamilies: [
        { canonicalId: 'same', parents: ['A-one', 'B-one'], children: ['C'] },
        { canonicalId: 'same', parents: ['A-two', 'B-two'], children: ['D'] }
    ] };
    const slots = treeBranchSceneSlots(scene, result);
    assert.equal(slots.get('A-one'), 1);
    assert.equal(slots.get('B-two'), 2);
    assert.equal(treeBranchConnectionSlot(['A-one', 'B-one', 'C'], slots), 1);
    assert.equal(treeBranchConnectionSlot(['A-one', 'B-two'], slots), 0);
    assert.equal(treeBranchConnectionSlot(['A-one', 'missing', 'C'], slots), 0);
    const ambiguous = { ...scene, colorFamilies: [{ canonicalId: 'same', parents: ['A-one'], children: ['C', 'D'] }] };
    assert.equal(treeBranchSceneSlots(ambiguous, result).has('A-one'), false);
    assert.equal(resolveTreeBranches(graph, 'missing', 16, true).visits, 0);
    const cycle = treeBranchGraph(people2, [...families2, family('cycle', 'C', null, ['A'])]);
    const visits = resolveTreeBranches(cycle, 'R', 16, true).visits;
    assert.ok(visits < people2.length * 32);
    const origins16 = treeBranchPaths(16).origins;
    assert.equal(origins16.length, 16);
    assert.equal(JSON.stringify(treeBranchOriginIds(graph, 'R', origins16).slice(0, 2)), JSON.stringify(['E', 'G']));
    assert.equal(JSON.stringify(treeBranchOriginIds(graph, 'missing', origins16)), JSON.stringify(Array(16).fill('')));
    assert.equal(treePaletteLabelInk('#ffffff'), '#000000');
    assert.equal(treePaletteLabelInk('#000000'), '#ffffff');
    const props = new Map();
    const runtime = { shell: { style: { setProperty: (key, value) => props.set(key, value) } } };
    const palette = { light: { neutral: '#112233', '16': '#334455' }, dark: { neutral: '#aabbcc', '16': '#ddeeff' } };
    applyTreePalette(runtime, palette);
    assert.equal(props.get('--tree-palette-light-neutral'), '#112233');
    assert.equal(props.get('--tree-palette-dark-neutral'), '#aabbcc');
    assert.equal(props.get('--tree-palette-dark-16'), '#ddeeff');
    const replacement = { ...palette, light: { ...palette.light, neutral: '#abcdef' } };
    applyTreePalette(runtime, replacement);
    assert.equal(props.get('--tree-palette-light-neutral'), '#abcdef');
    assert.equal(props.get('--tree-palette-dark-neutral'), '#aabbcc');
    console.log('Complete 63-person pedigree, vacant origins, collateral conflicts, cycle, occurrence fragments and connector provenance passed.');
}.toString() + ')()', context);
