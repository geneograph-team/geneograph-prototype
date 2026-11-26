'use strict';
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const metrics = { status: '', passes: -1 };
const sandbox = vm.createContext({
    TREE_GEOMETRY: { cardWidth: 300 }, state: { activeModule: 'Family Tree' },
    genealogyDateSortValue: value => value,
    currentFamilyTreeProjectId: () => project,
    renderFamilyTree() {},
    console: { warn() {} },
    treePerf: {
        cache(trace, status) { if (trace) { trace.cache = status; metrics.status = status; } },
        measure(_trace, _stage, fn) { return fn(); },
        count(_trace, key, value) { if (key === 'passes') metrics.passes = value; },
        finish() {}
    }
});
let project = 'p1', solves = 0, pending;
vm.runInContext(fs.readFileSync('src/modules/family-tree/tree-elk-layout.js', 'utf8'), sandbox);
sandbox.prepareElkTreeInput = p => ({ people: [{ id: p.focusPersonId }], families: [], focusId: p.focusPersonId });
sandbox.solveElkTree = (people, _families, direction) =>
{
    solves++;
    const id = people[0].id;
    return new Promise((resolve, reject) =>
    {
        pending = { id, resolve: (overrides = {}) => resolve({ id, direction, underpasses: [], passes: id === 'a' ? 2 : 1, ...overrides }), reject };
    });
};
sandbox.adaptElkTreeLayout = (_model, geometry, projection) => ({ geometry, name: projection.people[0].name });
const request = () => vm.runInContext('treeElkRequest', sandbox);
const size = () => vm.runInContext('treeElkRecentLayouts.size', sandbox);
const tick = () => new Promise(resolve => setImmediate(resolve));
const view = { orientation: 'vertical', ancestorGenerations: 7, descendantGenerations: 3, showCousins: true };
const projection = (id, name = id, gender = 'unknown') => ({
    focusPersonId: id, people: [{ id, name, gender }], families: [],
    branchRoles: { parentPresenceByPerson: new Map(), focusActionPersonIds: new Set() }
});
const open = (id, name, gender) => sandbox.treeElkLayoutForProjection(project, projection(id, name, gender), view, {});

async function complete(id, name, gender)
{
    assert.equal(open(id, name, gender), null);
    assert.equal(metrics.status, 'miss');
    await tick();
    assert.equal(pending.id, id);
    pending.resolve();
    await tick();
    return request().geometry;
}

(async () =>
{
    const a = await complete('a');
    await complete('b');
    assert.equal(open('a', 'fresh').geometry, a);
    assert.equal(open('a', 'fresh').name, 'fresh');
    assert.equal(metrics.status, 'hit');
    assert.equal(metrics.passes, 0);
    assert.equal(solves, 2);

    for (const id of ['c', 'd', 'e', 'f', 'g', 'h', 'i']) await complete(id);
    assert.equal(size(), 8);
    assert.equal(open('a').geometry, a);
    await complete('b');
    assert.equal(size(), 8);

    view.orientation = 'horizontal';
    const horizontal = await complete('a');
    assert.equal(horizontal.direction, 'RIGHT');
    view.orientation = 'vertical';
    assert.equal(open('a').geometry, a);
    await complete('a', 'edited', 'female');
    assert.equal(open('a').geometry, a);

    open('late');
    await tick();
    const abandoned = pending;
    assert.equal(open('a').geometry, a);
    abandoned.resolve();
    await tick();
    assert.equal(request().geometry, a);
    assert.equal(open('late'), null);
    await tick();
    pending.reject(new Error('test layout failure'));
    await tick();
    assert.equal(request().error, true);
    assert.equal(open('a').geometry, a);
    assert.equal(open('late'), null);
    await tick();
    pending.resolve();
    await tick();

    project = 'p2';
    const b = await complete('a');
    assert.notEqual(b, a);
    assert.equal(size(), 1);
    view.ancestorGenerations = 8;
    await complete('a');
    view.ancestorGenerations = 7;
    assert.equal(open('a').geometry, b);
    view.ancestryExpansion = new Map([['a', 'path']]);
    await complete('a');
    const changed = projection('a');
    changed.branchRoles.focusActionPersonIds.add('a');
    assert.equal(sandbox.treeElkLayoutForProjection(project, changed, view, {}), null);
    await tick();
    pending.resolve({ underpasses: undefined });
    await tick();
    assert.equal(open('a').geometry.underpasses.length, 0);
    assert.equal(sandbox.treeElkLayoutForProjection(project, changed, view, {}), null);
    await tick();
    pending.resolve();
    await tick();
    const changedFamily = { ...changed, families: [{ id: 'f', left: 'a', right: '', children: [], recordedChildCount: 1 }] };
    assert.equal(sandbox.treeElkLayoutForProjection(project, changedFamily, view, {}), null);
    await tick();
    pending.resolve();
    await tick();
    changedFamily.families[0].recordedChildCount = 2;
    assert.equal(sandbox.treeElkLayoutForProjection(project, changedFamily, view, {}), null);
    await tick();
    pending.resolve();
    await tick();
    changedFamily.branchRoles.recordedParentFamilyCountByPerson = new Map([['a', 1]]);
    assert.equal(sandbox.treeElkLayoutForProjection(project, changedFamily, view, {}), null);
    await tick();
    pending.resolve();
    await tick();
    const chronological = { ...changed, people: [...changed.people, { id: 'c', birthFact: 2 }, { id: 'd' }],
        families: [{ id: 'f', left: 'a', right: '', children: ['c', 'd'] }] };
    assert.equal(sandbox.treeElkLayoutForProjection(project, chronological, view, {}), null);
    await tick();
    pending.resolve();
    await tick();
    const orderedGeometry = request().geometry;
    chronological.people[1].birthFact = 1;
    assert.equal(sandbox.treeElkLayoutForProjection(project, chronological, view, {}).geometry, orderedGeometry);
    chronological.people[2].birthFact = .5;
    assert.equal(sandbox.treeElkLayoutForProjection(project, chronological, view, {}), null);
    await tick();
    const lateModule = pending;
    sandbox.disposeTreeElkLayout();
    lateModule.resolve();
    await tick();
    assert.equal(size(), 0);
    assert.equal(request(), null);
    console.log('Recent Tree layout LRU, two-pass hit accounting, fresh display, compatibility, failure and cancellation passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
