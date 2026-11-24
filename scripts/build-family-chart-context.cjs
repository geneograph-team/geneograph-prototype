'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { createHash } = require('node:crypto');

const archive = process.argv[2];
const expected = '266a310b4af71b41f83ccb362c35062d39e8121dbad23165b4a00bba34786765';
if (!archive || createHash('sha256').update(fs.readFileSync(archive)).digest('hex') !== expected)
    throw new Error('Pass the pinned family-chart-0.9.0.tgz archive.');

const extension = ['family-chart-household-grid.js', 'family-chart-context-extension.js']
    .map(file => fs.readFileSync(path.join(__dirname, file), 'utf8').trim()).join('\n\n');
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

insert("function calculateTree(data, { family_contexts = undefined, main_id",
    "function calculateTree(data, { family_contexts = undefined, household_grid = undefined, main_id");
insert("        const contextLinks = family_contexts && extendFamilyContexts(tree, data_stash, family_contexts, { is_horizontal, node_separation, level_separation });\n        const dim = calculateTreeDim(tree, node_separation, level_separation);\n        return { data: tree, data_stash, dim, main_id: main.id, is_horizontal, contextLinks };",
    "        const context = family_contexts && extendFamilyContexts(tree, data_stash, family_contexts, { is_horizontal, node_separation, level_separation }, household_grid);\n        const dim = calculateTreeDim(tree, node_separation, level_separation);\n        const householdGrid = context && context.grid;\n        if (householdGrid?.status === 'applied') {\n            const xs = householdGrid.extents.map(point => point[0]), ys = householdGrid.extents.map(point => point[1]);\n            const right = Math.max(dim.width - dim.x_off, ...xs), bottom = Math.max(dim.height - dim.y_off, ...ys);\n            dim.x_off = Math.max(dim.x_off, -Math.min(...xs));\n            dim.y_off = Math.max(dim.y_off, -Math.min(...ys));\n            dim.width = right + dim.x_off;\n            dim.height = bottom + dim.y_off;\n        }\n        return { data: tree, data_stash, dim, main_id: main.id, is_horizontal, contextLinks: context && context.links, householdGrid };");
insert("            args.family_contexts = state.family_contexts;",
    "            args.family_contexts = state.family_contexts;\n            args.household_grid = state.household_grid;");
insert("        setFamilyContexts(families) {",
    "        setHouseholdGrid(config) {\n            this.store.state.household_grid = config;\n            return this;\n        }\n        setFamilyContexts(families) {");
insert("        const links_data_dct = tree.data.reduce((acc, d) => {\n            createLinks(d, tree.is_horizontal).forEach(l => acc[l.id] = l);\n            return acc;\n        }, {});\n        const links_data = tree.contextLinks ? mergeFamilyContextLinks(Object.values(links_data_dct), tree.contextLinks) : Object.values(links_data_dct);",
    "        const links_data_dct = tree.householdGrid?.status === 'applied' ? {} : tree.data.reduce((acc, d) => {\n            createLinks(d, tree.is_horizontal).forEach(l => acc[l.id] = l);\n            return acc;\n        }, {});\n        const links_data = tree.householdGrid?.status === 'applied' ? tree.householdGrid.links : tree.contextLinks ? mergeFamilyContextLinks(Object.values(links_data_dct), tree.contextLinks) : Object.values(links_data_dct);");
insert("        function linkExit(d) {\n            const path = d3__namespace.select(this);",
    "        function linkExit(d) {\n            const path = d3__namespace.select(this);\n            if (tree.householdGrid?.status === 'applied' || d.gridPaths) { path.remove(); return; }");
insert("    function createPath(d, is_ = false) {",
    "    function createPath(d, is_ = false) {\n        if (d.gridPaths) return d.gridPaths.map(points => d3__namespace.line()(points)).join(' ');");

fs.writeFileSync(path.join(__dirname, '../src/vendor/family-chart-0.9.0-context.js'), bundle);
