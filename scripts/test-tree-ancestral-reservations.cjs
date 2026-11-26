'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ELK = require('../src/vendor/elkjs-0.12.1/lib/elk.bundled.js');
const context = vm.createContext({ performance });
for (const file of ['tree-geometry.js', 'tree-elk-model.js'])
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/modules/family-tree', file), 'utf8'), context);

const EPS = .02;
function fixture(direction, pattern)
{
    const people = [], families = [];
    const add = (id, generation, gender, role = null, paired = false) =>
    {
        people.push({ id, generation, gender, width: role && paired && direction === 'DOWN' ? 130 : 300,
            height: 124, ...(role ? { placeholder: { rel: role } } : {}) });
        return id;
    };
    add('R', 4, 'male');
    function ancestors(id, generation)
    {
        if (!generation) return;
        const cut = pattern[id];
        const father = add(id + 'F', generation - 1, 'male', cut === 'both' || cut === 'father' ? 'father' : null, cut === 'both');
        const mother = add(id + 'M', generation - 1, 'female', cut === 'both' || cut === 'mother' ? 'mother' : null, cut === 'both');
        families.push({ id: 'parents:' + id, parents: [father, mother], children: [id] });
        if (cut !== 'both' && cut !== 'father') ancestors(father, generation - 1);
        if (cut !== 'both' && cut !== 'mother') ancestors(mother, generation - 1);
    }
    ancestors('R', 4);
    const oldest = Math.min(...people.map(person => person.generation));
    for (const person of people) person.generation -= oldest;
    return { people, families };
}

(async () =>
{
    const elk = new ELK();
    let cases = 0;
    for (const direction of ['DOWN', 'RIGHT'])
        for (const pattern of [{}, { RF: 'both' }, { RM: 'both' }, { RF: 'both', RMM: 'father' },
            { RFF: 'both', RFM: 'mother', RMF: 'both' }, { RF: 'both', RM: 'both' }, { RFFF: 'both' }])
        {
            const { people, families } = fixture(direction, pattern);
            const snapshot = JSON.stringify({ people, families });
            const byId = new Map(people.map(person => [person.id, person]));
            const cross = direction === 'DOWN' ? 'x' : 'y';
            const depth = direction === 'DOWN' ? 'y' : 'x';
            const extent = direction === 'DOWN' ? 'w' : 'h';
            const expectedCount = people.filter(person => person.placeholder)
                .reduce((sum, person) => sum + person.generation, 0);
            let calls = 0, native;
            const result = await context.solveElkTree(people, families, direction, async graph =>
            {
                calls++;
                assert.equal(graph.children.filter(node => node.id.startsWith('reservation:')).length, expectedCount);
                assert.equal(graph.edges.filter(edge => edge.id.startsWith('reservation:')).length, expectedCount);
                native = await elk.layout(JSON.parse(JSON.stringify(graph)));
                return native;
            }, 'R');
            assert.ok(calls <= 2);
            assert.equal(result.issues.length, 0, result.issues.join('; '));
            assert.equal(result.reservations.length, expectedCount);
            assert.equal(result.boxes.length, people.length);
            assert.equal(result.junctions.length, families.length);
            assert.equal(JSON.stringify({ people, families }), snapshot);
            assert.ok(result.ports.every(port => !port.id.startsWith('reservation:') && !port.id.endsWith(':reserve-in')));
            assert.ok(result.paths.every(route => !route.id.startsWith('reservation:')));
            for (const family of families)
                for (const child of family.children)
                    assert.ok(result.paths.some(route => route.family === family.id && route.role === 'child' && route.person === child));
            assert.equal(context.elkCenteringConflicts(result, cross).size, 0);

            const rows = new Map(), shapes = new Map();
            for (const box of result.boxes)
            {
                const person = byId.get(box.id);
                assert.ok(person);
                assert.equal(box.w, person.width);
                assert.equal(box.h, person.height);
                if (!rows.has(person.generation)) rows.set(person.generation, []);
                rows.get(person.generation).push(box[depth]);
                if (!person.placeholder) continue;
                for (const older of result.boxes.filter(other => byId.get(other.id).generation < person.generation))
                    assert.ok(Math.min(box[cross] + box[extent], older[cross] + older[extent])
                        - Math.max(box[cross], older[cross]) <= EPS, 'Card stacked above missing-parent slot: ' + box.id);
            }
            for (const row of rows.values()) assert.ok(Math.max(...row) - Math.min(...row) <= EPS);
            for (const node of native.children) shapes.set(node.id, node);
            const groups = new Map(result.groups.map(group => [group.id, group]));
            for (const reservation of result.reservations)
            {
                const owner = groups.get(reservation.owner);
                const original = shapes.get(reservation.id), originalOwner = shapes.get(reservation.owner);
                assert.ok(owner && original && originalOwner);
                assert.equal(reservation[depth], original[depth]);
                assert.ok(Math.abs(reservation[cross] - original[cross] - (owner[cross] - originalOwner[cross])) <= EPS);
                for (const other of result.boxes.filter(box => byId.get(box.id).generation === reservation.generation))
                    assert.ok(Math.min(reservation[cross] + reservation[extent], other[cross] + other[extent])
                        - Math.max(reservation[cross], other[cross]) <= EPS, 'Occupied reserved footprint: ' + reservation.id);
            }
            cases++;
        }
    // Complete top-level missing-parent pairs have exactly the width of the
    // card they feed in Vertical. Horizontal retains its native footprint.
    for (const direction of ['DOWN', 'RIGHT'])
        for (const pattern of [{ R: 'both' }, { RF: 'both', RM: 'both' },
            { RFF: 'both', RFM: 'both', RMF: 'both', RMM: 'both' }])
        {
            const { people, families } = fixture(direction, pattern);
            const byId = new Map(people.map(person => [person.id, person]));
            let calls = 0;
            const result = await context.solveElkTree(people, families, direction, graph =>
            {
                calls++;
                for (const group of graph.children)
                {
                    if (!group.children) continue;
                    const members = group.children.filter(node => byId.has(node.id));
                    const paired = members.length === 2 && members.every(node => byId.get(node.id).placeholder);
                    const padding = direction === 'DOWN' && paired ? 0 : 18;
                    assert.equal(group.layoutOptions['elk.padding'],
                        '[top=18,left=' + padding + ',bottom=18,right=' + padding + ']');
                }
                return elk.layout(JSON.parse(JSON.stringify(graph)));
            }, 'R');
            assert.ok(calls <= 2);
            assert.equal(result.issues.length, 0, result.issues.join('; '));
            const axis = direction === 'DOWN' ? 'x' : 'y';
            assert.equal(context.elkCenteringConflicts(result, axis).size, 0);
            if (direction === 'DOWN')
            {
                const cards = new Map(result.boxes.map(box => [box.id, box]));
                const midpoint = id => cards.get(id).x + cards.get(id).w / 2;
                for (const family of families.filter(f => f.parents.every(id => byId.get(id).placeholder)))
                {
                    const [father, mother] = family.parents.map(id => cards.get(id)).sort((a, b) => a.x - b.x);
                    assert.ok(Math.abs(mother.x + mother.w - father.x - 300) <= EPS);
                    assert.ok(Math.abs((midpoint(family.parents[0]) + midpoint(family.parents[1])) / 2
                        - midpoint(family.children[0])) <= EPS, 'Unnecessary placeholder offset');
                }
            }
            cases++;
        }
    console.log('Ancestral reservations: ' + cases + ' layouts passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
