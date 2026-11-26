'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../../src/core/state-tree-core.js'), 'utf8');
const store = new Map();
const localStorage = { getItem: key => store.get(key), setItem: (key, value) => store.set(key, value), removeItem: key => store.delete(key) };
const people = [{ id: 'a', projectId: 'p1' }, { id: 'b', projectId: 'p2' }];
const context = vm.createContext({ assert, localStorage,
    getPerson: id => people.find(person => person.id === id),
    clampNumber: (n, min, max) => Math.min(max, Math.max(min, n)),
    sampleData: { projects: [{ id: 'p1', defaultPersonId: 'a' }, { id: 'p2', defaultPersonId: 'b' }] }
});
vm.runInContext(source.slice(source.indexOf('const TREE_ANCESTOR_GENERATION_MIN'), source.indexOf('function rememberTreeSelectedPerson')), context);
const read = context.readTreeDisplaySettings;
assert.equal(read('p1').ancestorGenerations, 5);
assert.equal(read('p1').orientation, 'vertical');
assert.equal(read('p1').colors.reference, 'a');
const save = context.saveTreeDisplaySettings;
save('p1', { orientation: 'horizontal', ancestorGenerations: 4, descendantGenerations: 0, showCousins: false,
    colors: { reference: 'a', preset: 8, collateral: true, fill: 'branch', outline: 'neutral', connectors: 'branch' } });
save('p2', { orientation: 'vertical', ancestorGenerations: 12, colorFill: false, colors: { reference: 'a' } });
assert.deepEqual(JSON.parse(JSON.stringify(read('p1'))), { orientation: 'horizontal', ancestorGenerations: 4,
    descendantGenerations: 0, showCousins: false,
    colors: { reference: 'a', preset: 8, collateral: true, fill: 'branch', outline: 'neutral', connectors: 'branch' } });
assert.equal(read('p2').ancestorGenerations, 8);
assert.equal(read('p2').colors.fill, 'neutral');
assert.equal(read('p2').colors.reference, '');
for (const depth of [0, 5, 6, 7, 8])
{
    save('p2', { ancestorGenerations: depth });
    assert.equal(read('p2').ancestorGenerations, depth);
}
people.shift();
assert.equal(read('p1').colors.reference, '');
save('p1', null);
assert.equal(read('p1').orientation, 'vertical');
save('p2', { orientation: 'Classic', ancestorGenerations: 'oops' });
assert.equal(read('p2').orientation, 'vertical');
assert.equal(read('p2').ancestorGenerations, 5);
store.set([...store.keys()][0], '{ malformed');
assert.equal(read('p2').ancestorGenerations, 5);
localStorage.getItem = () => { throw Error('Storage blocked'); };
assert.equal(read('p2').orientation, 'vertical');
console.log('Tree defaults, legacy and malformed settings, per-project restore, depth bounds and deleted reference passed.');
