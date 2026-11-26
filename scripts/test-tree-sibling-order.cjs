'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ELK = require('../src/vendor/elkjs-0.12.1/lib/elk.bundled.js');
const context = vm.createContext({ performance });
for (const file of ['shared/genealogy-dates.js', 'modules/family-tree/tree-geometry.js',
    'modules/family-tree/tree-elk-model.js', 'modules/family-tree/tree-elk-layout.js'])
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../src', file), 'utf8'), context);

const date = (year, month = null, day = null, dateType = 'Exact date') =>
    ({ state: 'known', dateType, calendar: 'Gregorian', first: { year, month, day } });
const birthFacts = { A: date(1900), B: date(1901, 2, 3), C: date(1902, null, null, 'About / Circa') };
const original = ['D', 'C', 'B', 'A', 'E'];
const order = ['A', 'B', 'C', 'D', 'E'];
function fixture(partnered, competingParents)
{
    const people = [{ id: 'P', gender: 'male' }, { id: 'Q', gender: 'female' }];
    const families = [{ id: 'parents', left: 'P', right: 'Q', children: original.slice() }];
    for (const id of original)
    {
        const gender = id === 'B' ? 'female' : 'male';
        people.push({ id, gender, birthFact: birthFacts[id] });
        if (!partnered) continue;
        people.push({ id: id + 'm', gender: gender === 'male' ? 'female' : 'male' }, { id: id + 'c', gender: 'male' });
        families.push({ id: 'union:' + id, left: id, right: id + 'm', children: [id + 'c'] });
    }
    if (competingParents)
    {
        people.push({ id: 'SP', gender: 'male' }, { id: 'SM', gender: 'female' });
        families.push({ id: 'mate-parents', left: 'SP', right: 'SM', children: ['Cm'] });
    }
    return { people, families, focusPersonId: 'A', branchRoles: { parentPresenceByPerson: new Map() } };
}

const projection = fixture(false, false);
const originalJson = JSON.stringify(projection);
assert.deepEqual([...context.treeChronologicalFamilies(projection)[0].children], order);
assert.equal(JSON.stringify(projection), originalJson);
projection.people.find(p => p.id === 'A').birthFact = birthFacts.B;
assert.deepEqual([...context.treeChronologicalFamilies(projection)[0].children], ['B', 'A', 'C', 'D', 'E']);
projection.people.find(p => p.id === 'D').birthFact = { state: 'known', dateType: 'Exact date', first: { year: null, month: 1, day: 1 } };
projection.people.find(p => p.id === 'C').birthFact = { state: 'unknown' };
assert.deepEqual([...context.treeChronologicalFamilies(projection)[0].children], ['B', 'A', 'D', 'C', 'E']);
for (const p of projection.people) delete p.birthFact;
assert.equal(context.treeChronologicalFamilies(projection)[0], projection.families[0]);

(async () =>
{
    const elk = new ELK();
    let cases = 0;
    for (const direction of ['DOWN', 'RIGHT'])
        for (const [partnered, competingParents] of [[false, false], [true, false], [true, true]])
            for (const focus of ['A', 'C', 'P'])
            {
                const data = fixture(partnered, competingParents);
                data.focusPersonId = focus;
                const before = JSON.stringify(data);
                const model = context.prepareElkTreeInput(data, new Map(), direction);
                assert.equal(JSON.stringify(data), before);
                const peopleById = new Map(model.people.map(person => [person.id, person]));
                const family = model.families.find(f => f.canonicalFamilyId === 'parents');
                assert.deepEqual([...family.children.map(id => peopleById.get(id).personId)], order);
                let calls = 0;
                const result = await context.solveElkTree(model.people, model.families, direction, graph =>
                {
                    calls++;
                    const group = graph.children.find(g => g.children.some(n => n.id === family.id));
                    const junction = group.children.find(n => n.id === family.id);
                    const childPorts = junction.ports.filter(port => port.id.startsWith(family.id + ':children'));
                    assert.equal(childPorts.length, competingParents ? 1 : order.length);
                    return elk.layout(JSON.parse(JSON.stringify(graph)));
                }, model.focusId);
                assert.ok(calls <= 2);
                assert.equal(result.issues.length, 0, result.issues.join('; '));
                const axis = direction === 'DOWN' ? 'x' : 'y';
                const cards = new Map(result.boxes.map(box => [box.id, box]));
                const actual = [...family.children].sort((a, b) => cards.get(a)[axis] - cards.get(b)[axis])
                    .map(id => peopleById.get(id).personId);
                if (!competingParents) assert.deepEqual([...actual], order);
                assert.equal(context.elkCenteringConflicts(result, axis).size, 0);
                cases++;
            }
    // The focus is descended from the multiply anchored sibling. The spouse's
    // parental branch decides which side is preferred, not the sibling's age.
    for (const direction of ['DOWN', 'RIGHT'])
        for (const gender of ['male', 'female'])
        {
            const data = fixture(true, true);
            data.focusPersonId = 'Cc';
            data.people.find(p => p.id === 'C').gender = gender;
            data.people.find(p => p.id === 'Cm').gender = gender === 'male' ? 'female' : 'male';
            const model = context.prepareElkTreeInput(data, new Map(), direction);
            const peopleById = new Map(model.people.map(person => [person.id, person]));
            const family = model.families.find(f => f.canonicalFamilyId === 'parents');
            const expected = gender === 'male' ? ['A', 'B', 'D', 'E', 'C'] : ['C', 'A', 'B', 'D', 'E'];
            let calls = 0;
            const result = await context.solveElkTree(model.people, model.families, direction, graph =>
            {
                calls++;
                const junction = graph.children.flatMap(g => g.children).find(n => n.id === family.id);
                const ports = junction.ports.filter(port => port.id.startsWith(family.id + ':children:'));
                assert.equal(ports.length, order.length);
                const preferred = ports.slice().sort((a, b) => (direction === 'DOWN' ? -1 : 1)
                    * (Number(a.layoutOptions['elk.port.index']) - Number(b.layoutOptions['elk.port.index'])))
                    .map(port => peopleById.get(port.id.slice((family.id + ':children:').length)).personId);
                assert.deepEqual([...preferred], expected);
                return elk.layout(JSON.parse(JSON.stringify(graph)));
            }, model.focusId);
            assert.ok(calls <= 2);
            assert.equal(result.issues.length, 0, result.issues.join('; '));
            const axis = direction === 'DOWN' ? 'x' : 'y';
            const cards = new Map(result.boxes.map(box => [box.id, box]));
            const actual = [...family.children].sort((a, b) => cards.get(a)[axis] - cards.get(b)[axis])
                .map(id => peopleById.get(id).personId);
            assert.deepEqual([...actual], expected);
            assert.equal(context.elkCenteringConflicts(result, axis).size, 0);
            cases++;
        }
    console.log('Chronological sibling preference: ' + cases + ' layouts passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
