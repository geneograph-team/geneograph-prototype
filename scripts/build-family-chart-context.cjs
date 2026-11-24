'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { createHash } = require('node:crypto');

const archive = process.argv[2];
const expected = '266a310b4af71b41f83ccb362c35062d39e8121dbad23165b4a00bba34786765';
if (!archive || createHash('sha256').update(fs.readFileSync(archive)).digest('hex') !== expected)
    throw new Error('Pass the pinned family-chart-0.9.0.tgz archive.');

const extension = fs.readFileSync(path.join(__dirname, 'family-chart-context-extension.js'), 'utf8').trim();
let bundle = execFileSync('tar', ['-xOf', archive, 'package/dist/family-chart.js'], { encoding: 'utf8' }).replace(/\r\n/g, '\n');
function insert(before, after)
{
    if (bundle.split(before).length !== 2) throw new Error('Upstream source changed: ' + before);
    bundle = bundle.replace(before, () => after);
}
insert('    function calculateTree(data, { main_id', extension + '\n\n    function calculateTree(data, { family_contexts = undefined, main_id');
insert('        setupProgenyParentsPos(tree);',
    '        compactParentPlaceholders(tree);\n        setupProgenyParentsPos(tree);');
insert('        const dim = calculateTreeDim(tree, node_separation, level_separation);',
    '        const contextLinks = family_contexts && extendFamilyContexts(tree, data_stash, family_contexts, { is_horizontal, node_separation, level_separation });\n'
    + '        const dim = calculateTreeDim(tree, node_separation, level_separation);');
insert('return { data: tree, data_stash, dim, main_id: main.id, is_horizontal };',
    'return { data: tree, data_stash, dim, main_id: main.id, is_horizontal, contextLinks };');
insert('            return calculateTree(state.data, args);',
    '            args.family_contexts = state.family_contexts;\n            return calculateTree(state.data, args);');
insert('        setModifyTreeHierarchy(modifyTreeHierarchy) {',
    '        setFamilyContexts(families) {\n            this.store.state.family_contexts = families;\n            return this;\n        }\n        setModifyTreeHierarchy(modifyTreeHierarchy) {');
insert('        const links_data = Object.values(links_data_dct);',
    '        const links_data = tree.contextLinks ? mergeFamilyContextLinks(Object.values(links_data_dct), tree.contextLinks) : Object.values(links_data_dct);');

fs.writeFileSync(path.join(__dirname, '../src/vendor/family-chart-0.9.0-context.js'), bundle);
