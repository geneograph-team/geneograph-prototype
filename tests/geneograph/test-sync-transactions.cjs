'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const context = vm.createContext({
    window: { GENEO_SEED_BOARD_ASSETS: [], addEventListener() {} },
    t: text => text,
    translateText: text => text,
    state: { language: 'en', geneoBoardViewports: {} },
    document: { documentElement: { lang: 'en' } },
    geneoThemeColor: dark => dark,
    getComputedStyle: () => ({ getPropertyValue: () => '#18211F' }),
    assert, atob,
    structuredClone
});
const files = [
    'seed/sample-data', 'seed/seed-genealogy', 'shared/genealogy-dates', 'modules/places/place-record-helpers',
    'shared/person-name-helpers', 'shared/media-and-album-model', 'shared/relationships', 'modules/family-tree/relationships', 'shared/tree-seed-model',
    'modules/people/person-form-fields', 'modules/people/person-editor', 'shared/date-and-place-fields',
    'modules/archive/archive-sources', 'seed/seed-archive-records', 'seed/seed-notes-records', 'seed/seed-geneograph-collections',
    'modules/albums/photo-layout-and-crop', 'modules/albums/person-photo',
    'modules/geneograph/geneograph-runtime', 'modules/geneograph/geneograph-model',
    'modules/geneograph/geneograph-editor-core', 'modules/geneograph/geneograph-theme-board', 'modules/geneograph/geneograph-sidebar',
    'modules/geneograph/geneograph-board-files', 'modules/geneograph/geneograph-pickers', 'modules/geneograph/geneograph-shadow',
    'assets/boards/whiskerfield-tree-research', 'seed/seed-boards', 'core/validation',
    'modules/people/relationship-editor', 'modules/people/controls', 'modules/publish/drafts-model',
    'core/project-read-model', 'shared/project-read-providers', 'modules/geneograph/geneograph-tree-review-model',
    'modules/geneograph/geneograph-tree-import', 'modules/geneograph/geneograph-relationships'
];
const sourceDirectory = path.join(__dirname, '../../src');
const indexHtml = fs.readFileSync(path.join(sourceDirectory, 'index.html'), 'utf8');
const orderedScripts = Array.from(indexHtml.matchAll(/<script\b[^>]*\bsrc="([^"]+\.js)"/g), match => match[1]);
const scriptOrder = new Map(orderedScripts.map((name, index) => [name, index]));
// Load the existing shared graph color recipe without Tree runtime state.
const treePaletteSource = fs.readFileSync(path.join(__dirname, '../../src/core/state-tree-core.js'), 'utf8');
const treeToneSource = fs.readFileSync(path.join(__dirname, '../../src/modules/family-tree/tree-branches.js'), 'utf8');
vm.runInContext(treePaletteSource.slice(treePaletteSource.indexOf('const TREE_PALETTE_DEFAULTS'), treePaletteSource.indexOf('function normalizeTreePalette'))
    + treeToneSource.slice(treeToneSource.indexOf('function treePaletteLinearRgb'), treeToneSource.indexOf('function applyTreePalette')), context);
for (const file of files) assert.ok(scriptOrder.has(file + '.js'), file + ' must be part of the app startup');
files.sort((left, right) => scriptOrder.get(left + '.js') - scriptOrder.get(right + '.js'));

for (const file of files)
{
    const filename = path.join(__dirname, '../../src', file + '.js');
    vm.runInContext(fs.readFileSync(filename, 'utf8'), context, { filename });
}

vm.runInContext(`
let nextId = 0;
const createRuntimeId = prefix => prefix + '-sync-test-' + ++nextId;
const currentProjectId = () => 'p1';
const validProjectById = id => sampleData.projects.find(project => project.id === id);
const markPrototypeSessionEdited = () => invalidateProjectReadModel('p1');
const invalidateGeneographBoardPreview = () => {};
const showToast = () => {};
const renderGeneographEditorPreserveScroll = () => {};
const closeModal = () => { geneoTreeImportDraft = null; };
geneoTreeImportRender = () => {};
setProjectReadModelActive('p1');

const serialize = value => JSON.stringify(value);
const snapshot = () => serialize([sampleData, geneoHistoryRuntime]);
const template = structuredClone(sampleData.boards.find(board => board.projectId === 'p1' && board.diagram.people.length >= 2));
const canonicalTemplate = getPeople('p1').find(person => !person.deleted);

function fixture(existing, suffix = String(existing))
{
    const canonical = { ...structuredClone(canonicalTemplate), id: 'sync-test-parent-' + suffix };
    sampleData.people.push(canonical);
    const board = structuredClone(template);
    const [parent, child] = board.diagram.people;
    parent.treePersonId = canonical.id;
    child.treePersonId = null;
    for (const person of [parent, child])
        for (const key of ['birth', 'death']) if (person[key]) person[key].placeId = null;
    const nodes = [parent, child].map(person => board.diagram.nodes.find(node => node.personId === person.id));
    const family = { id: 'board-family-' + suffix, partnerIds: [parent.id], children: [{
        personId: child.id, parentChildTypes: { [parent.id]: 'Biological' }, parentageType: 'Biological'
    }], events: [] };
    board.id = 'sync-test-board-' + suffix;
    Object.assign(board.diagram, { people: [parent, child], nodes, families: [family], connections: [] });
    sampleData.boards.push(board);
    state.geneoBoardId = board.id;
    const canonicalFamily = existing && geneoReviewNewFamily('sync-test-existing-' + suffix, 'p1', [canonical.id]);
    if (canonicalFamily) sampleData.families.push(canonicalFamily);
    const open = () =>
    {
        const draft = geneoTreeImportDraft = geneoReviewDraft(board, child.id);
        draft.choices.set(child.id, 'create');
        assert.equal(draft.relationChoices.size, 0);
        return draft;
    };
    return { board, parent, child, canonical, canonicalFamily, open };
}

for (const existing of [false, true])
{
    const { board, parent, child, canonical, canonicalFamily, open } = fixture(existing);
    let draft = open();
    const before = snapshot();
    const plan = geneoReviewPreviewForRender(draft, false);
    assert.equal(snapshot(), before, 'Preview changed live data');
    assert.equal(plan.error, '');
    const personId = draft.newIds.get(child.id);
    const family = plan.patches.find(patch => patch.key === 'families' && patch.after.childIds.includes(personId));
    assert.ok(family, 'Automatic parent link needs a family patch');
    assert.equal(family.before?.id || null, canonicalFamily?.id || null);
    assert.equal(family.after.parentChildTypes[canonical.id + '|' + personId], 'Biological');
    draft.activePersonId = parent.id;
    draft.search = 'search';
    draft.status = 'linked';
    draft.summaryOpen = true;
    assert.equal(geneoReviewPreviewForRender(draft, true), plan);
    const planSignature = plan => serialize([plan.patches, plan.operations, plan.errors, [...plan.statuses]]);
    assert.equal(planSignature(geneoTreeImportPreview(draft)), planSignature(plan));
    invalidateProjectReadModel('p1', ['media']);
    assert.equal(geneoReviewPreviewForRender(draft, true), plan);
    invalidateProjectReadModel('p1', ['families']);
    assert.notEqual(geneoReviewPreviewForRender(draft, true), plan);
    closeModal();
    assert.equal(snapshot(), before, 'Cancel changed live data');

    draft = open();
    const originalName = canonical.names.first;
    canonical.names.first = 'Changed after opening';
    const changed = snapshot();
    assert.equal(geneoTreeImportCommit(), false);
    assert.equal(snapshot(), changed, 'Stale Apply made a write');
    canonical.names.first = originalName;
    closeModal();

    draft = open();
    const beforeFailure = snapshot();
    const writer = geneoReviewWritePatches;
    geneoReviewWritePatches = (board, patches, side, rollback) =>
    {
        writer(board, patches.slice(0, 2), side, rollback);
        throw Error('Simulated partial write');
    };
    assert.equal(geneoTreeImportCommit(), false);
    geneoReviewWritePatches = writer;
    assert.equal(snapshot(), beforeFailure, 'Rollback changed records, order, metadata or history');

    const appliedId = draft.newIds.get(child.id);
    assert.equal(geneoTreeImportCommit(), true);
    assert.equal(geneoTreeImportCommit(), false);
    assert.equal(sampleData.people.filter(person => person.id === appliedId).length, 1);
    assert.equal(board.diagram.people.find(person => person.id === child.id).treePersonId, appliedId);
    const families = sampleData.families.filter(family => family.childIds.includes(appliedId));
    assert.equal(families.length, 1);
    assert.equal(families[0].parentChildTypes[canonical.id + '|' + appliedId], 'Biological');
}
const explicit = fixture(true, 'explicit');
const foreign = { ...structuredClone(explicit.canonical), id: 'sync-test-foreign', projectId: 'foreign' };
sampleData.people.push(foreign);
const foreignBefore = serialize(foreign);
const treeChild = { ...structuredClone(explicit.canonical), id: 'sync-test-linked-child' };
sampleData.people.push(treeChild);
explicit.child.treePersonId = treeChild.id;
let draft = geneoTreeImportDraft = geneoReviewDraft(explicit.board, explicit.child.id);
const relation = draft.relations[0];
draft.relationChoices.set(relation.id, 'board');
let before = snapshot();
const transfer = geneoTreeImportPreview(draft);
assert.equal(transfer.error, '');
assert.ok(transfer.patches.some(patch => patch.key === 'families' && patch.id === explicit.canonicalFamily.id
    && patch.after.childIds.includes(treeChild.id)));
assert.equal(snapshot(), before);
assert.equal(geneoTreeImportCommit(), true);
assert.equal(serialize(foreign), foreignBefore);

explicit.child.names.first = 'Board value';
treeChild.names.first = 'Tree value';
explicit.board.diagram.families[0].children[0].parentChildTypes[explicit.parent.id] = 'Adoptive';
draft = geneoTreeImportDraft = geneoReviewDraft(explicit.board, explicit.child.id);
const fields = geneoTreeImportPreview(draft).relationshipFields.get(relation.id);
const parentage = fields.find(field => field.label === 'Parentage type');
assert.ok(parentage);
before = snapshot();
for (const direction of ['board', 'tree'])
{
    draft.fields.set(explicit.child.id, new Map([['names.first', direction]]));
    draft.relationshipFields.set(relation.id, new Map([[parentage.key, direction]]));
    const plan = geneoReviewPreviewForRender(draft, false);
    assert.equal(plan.error, '');
    const personKey = direction === 'board' ? 'people' : 'board.people';
    const familyKey = direction === 'board' ? 'families' : 'board.families';
    assert.equal(plan.patches.find(patch => patch.key === personKey).after.names.first,
        direction === 'board' ? 'Board value' : 'Tree value');
    assert.ok(plan.patches.some(patch => patch.key === familyKey));
    assert.equal(snapshot(), before);
}
closeModal();

const treeSide = fixture(false, 'tree-side');
treeSide.parent.treePersonId = explicit.canonical.id;
const treeSideBefore = snapshot();
draft = geneoTreeImportDraft = geneoReviewDraft(treeSide.board, treeSide.parent.id);
const imported = geneoTreeImportPreview(draft).relations.find(item => item.origin === 'tree'
    && item.treeFamilyId === explicit.canonicalFamily.id && item.type === 'child');
assert.ok(imported);
draft.relationChoices.set(imported.id, 'tree');
const staged = geneoReviewPreviewForRender(draft, false);
assert.equal(staged.error, '');
assert.ok(staged.operations.some(operation => operation.type === 'boardPerson' && operation.personId === treeSide.parent.id));
draft.activePersonId = treeSide.child.id;
assert.equal(geneoReviewPreviewForRender(draft, true), staged);
const fresh = geneoTreeImportPreview(draft);
assert.equal(serialize([fresh.operations, fresh.patches, fresh.errors, [...fresh.statuses]]),
    serialize([staged.operations, staged.patches, staged.errors, [...staged.statuses]]));
assert.equal(snapshot(), treeSideBefore);
assert.equal(geneoTreeImportCommit(), true);
assert.ok(treeSide.board.diagram.people.some(person => person.treePersonId === treeChild.id));
assert.equal(serialize(foreign), foreignBefore);

const linksBefore = [...sampleData.sourceLinks];
assert.ok(linksBefore.length > 1);
const journal = [];
geneoReviewWritePatches(treeSide.board, [{ key: 'sourceLinks', id: linksBefore[0].id, before: linksBefore[0], after: null }], 'after', journal);
for (const restore of journal.reverse()) restore();
assert.deepEqual(sampleData.sourceLinks, linksBefore);
assert.equal(sampleData.sourceLinks[0], linksBefore[0]);

`, context);
console.log('Sync automatic and explicit transfers, both field directions, preview and navigation parity, Cancel, stale rejection, rollback and exactly-once Apply passed.');
