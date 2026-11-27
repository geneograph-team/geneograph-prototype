'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../../src/core/state-tree-core.js'), 'utf8');
const settingsSource = source.slice(source.indexOf('const TREE_ANCESTOR_GENERATION_MIN'), source.indexOf('function setTreeOrientation'))
    + '\n' + source.slice(source.indexOf('function treeSettingsPersonPreview'), source.indexOf('function deriveTreeBranchRoles'));

const view = { focusPersonId: 'b', ancestorGenerations: 5, descendantGenerations: 3,
    showCousins: true, colors: { reference: 'a', preset: 4, fill: 'gender', outline: 'gender', connectors: 'neutral' } };
const original = JSON.stringify(view);
const controls = new Map();
const make = (dataset = {}) => ({
    dataset, events: {}, attrs: {}, hidden: false, value: '', valueAsNumber: NaN, checked: false,
    classList: { toggle() {} }, setAttribute(key, value) { this.attrs[key] = value; },
    removeAttribute(key) { delete this.attrs[key]; }, addEventListener(name, fn) { this.events[name] = fn; },
    querySelectorAll() { return []; }, closest() { return null; }
});
const buttons = ['visibility', 'coloring', 'palette'].map(key => make({ treeSettingsSection: key }));
const panels = ['visibility', 'coloring', 'palette'].map(key => make({ treeSettingsPanel: key }));
panels[1].hidden = panels[2].hidden = true;
const get = key => { if (!controls.has(key)) controls.set(key, make()); return controls.get(key); };
const form = make();
form.querySelector = get;
form.querySelectorAll = key => key === '[data-tree-settings-section]' ? buttons : panels;
let picked = null;
let saves = 0, renders = 0, repaints = 0, closes = 0, html = '', currentProject = 'p1';
const setup = () =>
{
    get('#treeAncestorGenerations').valueAsNumber = view.ancestorGenerations;
    get('#treeDescendantGenerations').valueAsNumber = view.descendantGenerations;
    get('#treeShowCousins').checked = view.showCousins;
    get('#treeBranchPreset').value = String(view.colors.preset);
    get('#treeBranchCollateral').checked = Boolean(view.colors.collateral);
    for (const key of ['fill', 'outline', 'connectors']) get('#tree-color-' + key).value = view.colors[key];
};
const submit = () => form.events.submit({ preventDefault() {} });
const change = (element, value) => element.events.change({ target: { value } });
const dependencies = {
    currentFamilyTreeProjectId: () => currentProject, treeProjectViewState: () => view,
    getPerson: id => id === 'a' ? { id: 'a', projectId: 'p1', name: 'Person A' } : id === 'b' ? { id: 'b', projectId: 'p1', name: 'Focus B' } : null,
    getPeople: () => [{ id: 'a', projectId: 'p1', name: 'Person A' }],
    sampleData: { projects: [{ id: 'p1', defaultPersonId: 'a' }] },
    clampNumber: (n, min, max) => Math.min(max, Math.max(min, n)),
    document: { documentElement: { dataset: { theme: 'light' } } },
    formatPersonFullName: p => p?.name || '', localizedDataFieldValue: x => x,
    t: x => x, escapeHtml: x => String(x), icon: {}, renderPersonAvatar: () => '<span>avatar</span>',
    closeGeneoDraftColorPicker: () => {}, openGeneoDraftColorPicker: options => { picked = options; },
    openModal: markup => { html = markup; setup(); },
    modalBackdrop: { querySelector: () => form },
    renderSharedFilterFields: () => '', bindSharedFilterFields: () => {},
    centralFamilyRecords: () => [], treeBranchGraph: () => ({ parents: new Map() }),
    treeBranchPaths: () => ({ origins: Array(16).fill('F') }), treeBranchOriginIds: () => Array(16).fill(''),
    closeModal: () => { closes++; }, localStorage: { setItem() { saves++; } },
    state: {}, treeRenderRuntime: {}, treePerf: { begin: () => null },
    renderFamilyTree: () => { renders++; }, refreshTreeColors: () => { repaints++; },
    TREE_BRANCH_PRESETS: [2, 4, 8, 16]
};
const run = new Function(...Object.keys(dependencies), settingsSource + '\nreturn { openTreeSettingsModal };')(...Object.values(dependencies));
run.openTreeSettingsModal();
assert.ok(html.includes('data-modal-initial-focus'));
assert.ok(html.indexOf('data-tree-settings-section="visibility"') < html.indexOf('data-tree-settings-section="coloring"'));
assert.ok(html.includes('Show extended family'));
assert.ok(html.includes('Default person'));
assert.ok(html.includes('Person A'));
assert.equal(html.includes('Focus B'), false);
assert.equal(html.includes('data-tree-palette-reference'), false);
const pickColor = color => {
    const button = { dataset: { treePaletteColor: '16', treePaletteLabel: 'Branch 16' } };
    get('[data-tree-palette-rows]').events.click({ target: { closest: selector => selector === '[data-tree-palette-color]' ? button : null } });
    picked.onChange(color);
};
buttons[2].events.click();
assert.equal(panels[2].hidden, false);
assert.equal(panels[0].hidden, true);
pickColor('#112233');
change(get('#treePaletteTheme'), 'dark');
pickColor('#445566');
buttons[1].events.click();
get('#treeBranchPreset').value = '2';
get('#tree-color-fill').value = 'branch';
assert.equal(JSON.stringify(view), original);
assert.equal(saves, 0);
form.events.invalid({ target: { closest: () => panels[0] } });
assert.equal(panels[0].hidden, false);
assert.equal(panels[1].hidden, true);
buttons[2].events.click();
assert.ok(get('[data-tree-palette-rows]').innerHTML.includes('data-color-value="#445566"'));
submit();
assert.equal(view.colors.palette.light['16'], '#112233');
assert.equal(view.colors.palette.dark['16'], '#445566');
assert.equal(view.colors.preset, 2);
assert.equal(view.colors.fill, 'branch');
assert.equal(saves, 1);
assert.equal(renders, 0);
assert.equal(repaints, 1);
assert.equal(closes, 1);
const committed = JSON.stringify(view);
run.openTreeSettingsModal();
get('#treeAncestorGenerations').valueAsNumber = 7;
buttons[2].events.click();
pickColor('#abcdef');
// No submit: shared close discards the form/draft. Reopening reads the committed view.
dependencies.closeModal();
assert.equal(JSON.stringify(view), committed);
assert.equal(saves, 1);
run.openTreeSettingsModal();
get('#treeAncestorGenerations').valueAsNumber = 6;
submit();
assert.equal(view.ancestorGenerations, 6);
assert.equal(saves, 2);
assert.equal(renders, 1);
assert.equal(repaints, 1);
run.openTreeSettingsModal();
currentProject = 'p2';
submit();
assert.equal(saves, 2);
assert.equal(renders, 1);
console.log('Tree settings staged section/theme edits, validation navigation, Apply and discard paths passed.');
