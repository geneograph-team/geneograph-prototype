'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const state = read('src/core/state-tree-core.js');
const context = vm.createContext({ assert, t: value => value,
    icon: { eye: 'eye', eyeOff: 'eye-off', undo: 'undo' },
    escapeHtml: value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'),
    localizedDataFieldValue: value => value, formatPersonFullName: person => person.name });
vm.runInContext(state.slice(state.indexOf('const TREE_PALETTE_DEFAULTS'), state.indexOf('function treeDisplaySettings'))
    + read('src/modules/family-tree/tree-branches.js')
    + state.slice(state.indexOf('function treePaletteRowsMarkup'), state.indexOf('function openTreeSettingsModal')), context);
vm.runInContext(`
const palette = normalizeTreePalette();
const origins = treeBranchPaths(16).origins;
const graph = { parents: new Map([['r', [{ parent: 'f' }, { parent: 'm' }]]]) };
const ids = treeBranchOriginIds(graph, 'r', origins);
const people = new Map([['f', { name: 'Father <name>' }], ['m', { name: 'Mother' }]]);
for (const preset of [2, 4, 8, 16])
{
    const html = treePaletteRowsMarkup(palette, 'light', preset, origins, ids, people);
    assert.equal((html.match(/data-tree-palette-color=/g) || []).length, 20);
    assert.equal((html.match(/data-tree-palette-reset=/g) || []).length, 20);
    assert.equal((html.match(/aria-label="Included in branch count"/g) || []).length, preset);
    assert.equal((html.match(/aria-label="Not included in branch count"/g) || []).length, 16 - preset);
    assert.ok(html.includes('Vacant branch origin'));
    assert.ok(html.includes('Father &lt;name>'));
}
palette.dark['16'] = '#112233';
const html = treePaletteRowsMarkup(palette, 'dark', 2, origins, ids, people);
assert.ok(html.includes('data-tree-palette-color="16" value="#112233"'));
`, context);
console.log('Tree palette editor rows, preset indicators, origin paths and inactive theme values passed.');
