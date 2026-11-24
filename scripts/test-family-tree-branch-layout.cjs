'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const context = vm.createContext({ console: { warn() {} }, state: { language: 'en' }, document: { addEventListener() {} } });
for (const file of ['tree-layout', 'tree-view'])
{
    const filename = path.join(__dirname, '../src/modules/family-tree', file + '.js');
    vm.runInContext(fs.readFileSync(filename, 'utf8'), context, { filename });
}

function buildBranchFixture({ extraAncestor = false, sharedAncestor = false } = {})
{
    const people = [{ id: 'focus' }, { id: 'sibling' }, { id: 'partner' }, { id: 'child' }];
    const families = [];
    const placeholderPersonIds = new Set();
    function appendParents(child, depth)
    {
        if (depth >= 6) return;
        const left = child + 'L';
        const right = child + 'R';
        const incomplete = depth >= 3 && child.endsWith('RR');
        people.push({ id: left });
        if (!incomplete) people.push({ id: right });
        else placeholderPersonIds.add(child);
        families.push({ id: 'parents-' + child, left, right: incomplete ? '' : right,
            children: child === 'focus' ? [child, 'sibling'] : [child] });
        appendParents(left, depth + 1);
        if (!incomplete && !(depth >= 4 && child.endsWith('LL'))) appendParents(right, depth + 1);
    }
    appendParents('focus', 1);
    families.push({ id: 'household', left: 'focus', right: 'partner', children: ['child'] });
    people.push({ id: 'other-partner' }, { id: 'other-child' }, { id: 'adoptive-parent' });
    families.push({ id: 'other-household', left: 'focus', right: 'other-partner', children: ['other-child'] });
    families.push({ id: 'adoptive-household', left: 'adoptive-parent', right: '', children: ['sibling'] });
    if (sharedAncestor)
        families.push({ id: 'shared-ancestry', left: 'focusLLLL', right: '', children: ['focusR'] });
    if (extraAncestor)
    {
        people.push({ id: 'extra-ancestor' });
        families.push({ id: 'extra-branch', left: 'extra-ancestor', right: '', children: ['focusLLLLR'] });
    }
    return { people, families, focus: 'focus', branchRoles: { placeholderPersonIds } };
}

function measure(layout)
{
    const rails = layout.connectorDescriptors.filter(edge => edge.role.endsWith('-rail'));
    const width = Math.max(...layout.positionedPeople.map(person => person.rightX))
        - Math.min(...layout.positionedPeople.map(person => person.leftX));
    return {
        width,
        height: layout.stageHeight,
        railLength: rails.reduce((sum, edge) => sum + Math.abs(edge.points[1].x - edge.points[0].x), 0),
        issues: context.validateTreeLayout(layout).map(issue => issue.type || issue)
    };
}

function run(options)
{
    const { people, families, focus, branchRoles } = buildBranchFixture(options);
    return context.calculateTreeLayout(people, families, focus, { branchRoles });
}

function checkAncestorOnly(depth, oldTopRailLength)
{
    const people = [{ id: 'focus' }];
    const families = [];
    function addParents(child, remaining)
    {
        if (!remaining) return;
        const left = child + 'L';
        const right = child + 'R';
        people.push({ id: left }, { id: right });
        families.push({ id: 'parents-' + child, left, right, children: [child] });
        addParents(left, remaining - 1);
        addParents(right, remaining - 1);
    }
    addParents('focus', depth);

    const layout = context.calculateTreeLayout(people, families, 'focus');
    const oldestBand = layout.connectorBands.find(band => band.generation === 1);
    const oldestRailLength = oldestBand.families.reduce((sum, family) => sum + family.maxX - family.minX, 0);
    assert.equal(layout.positionedPeople.length, people.length);
    assert.equal(layout.peopleById.focus.generation, depth);
    assert.equal(context.validateTreeLayout(layout).length, 0);
    assert.ok(oldestRailLength < oldTopRailLength, 'the oldest row still has the long parallel runs');
    return { depth, oldestRailLength };
}

if (require.main === module)
{
    const baseline = run();
    const changed = run({ extraAncestor: true });
    const relativeX = (layout, id) => layout.peopleById[id].centerX - layout.peopleById.focus.centerX;
    const movement = Math.abs(relativeX(baseline, 'focusRR') - relativeX(changed, 'focusRR'));
    const measures = measure(baseline);
    assert.deepEqual(Array.from(measures.issues), []);
    assert.ok(movement <= 16, 'adding an ancestor shifted the opposite branch');
    assert.ok(measures.railLength < 15021, 'six-generation fixture exceeds the previous rail length');
    const shared = run({ sharedAncestor: true });
    assert.equal(shared.positionedPeople.filter(person => person.id === 'focusLLLL').length, 1);
    assert.ok(shared.connectorDescriptors.some(edge => edge.familyId === 'shared-ancestry' && edge.childId === 'focusR'));
    assert.ok(!context.validateTreeLayout(shared).some(issue => ['missing-family-link', 'edge-node'].includes(issue.type)));
    const ancestorOnly = [checkAncestorOnly(3, 1504), checkAncestorOnly(4, 6016)];
    console.log(JSON.stringify({ ...measures, distantBranchMovement: movement, ancestorOnly }));
    assert.equal(new Set(baseline.positionedPeople.map(person => person.id)).size, buildBranchFixture().people.length);
    assert.deepEqual(measure(run()), measures);
    assert.equal(JSON.stringify(run().connectorDescriptors), JSON.stringify(baseline.connectorDescriptors));
}

module.exports = { buildBranchFixture };
