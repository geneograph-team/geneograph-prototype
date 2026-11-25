'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ELK = require('../src/vendor/elkjs-0.12.1/lib/elk.bundled.js');
const fixtures = require('./fixtures/elk-tree-approved.json');
const context = vm.createContext(
{
    performance
});
const source = path.join(__dirname, '../src/modules/family-tree/tree-elk-model.js');
vm.runInContext(fs.readFileSync(source, 'utf8'), context);

for (const file of ['tree-geometry.js', 'tree-elk-preview.js'])
{
    vm.runInContext(fs.readFileSync(path.join(path.dirname(source), file), 'utf8'), context);
}

const partialFamily = { id: 'household', left: 'parent', right: '', children: ['focus', 'sibling'] };
const projection = {
    people: [{ id: 'focus' }, { id: 'sibling' }, { id: 'parent' }],
    families: [partialFamily],
    focusPersonId: 'focus',
    branchRoles: { ancestorGenerations: 1,
        parentPresenceByPerson: new Map([
            ['focus', { father: true, mother: false }],
            ['sibling', { father: true, mother: false }],
            ['parent', { father: false, mother: false }]
        ]) }
};
const originalFamily = JSON.stringify(partialFamily);
const shallow = context.prepareElkTreeInput(projection);
assert.equal(JSON.stringify(partialFamily), originalFamily);
assert.equal(shallow.people.filter(person => person.placeholder).length, 1);
assert.equal(shallow.people.find(person => person.placeholder).placeholder.personId, 'focus');
projection.branchRoles.ancestorGenerations = 2;
const deeper = context.prepareElkTreeInput(projection);
assert.equal(deeper.people.filter(person => person.placeholder?.personId === 'parent').length, 2);

const EPS = .02;
const between = (v, a, b) => v >= Math.min(a, b) - EPS && v <= Math.max(a, b) + EPS;
const same = (a, b) => Math.abs(a - b) < EPS;
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const intersectionLength = (a, b, c, d) => Math.min(Math.max(a, b), Math.max(c, d)) - Math.max(Math.min(a, b), Math.min(c, d));

function inspect(layout, peopleById, families)
{
    const
    {
        boxes,
        paths
    } = layout, marks = [], details = [];
    const report = {
        cards: boxes.length,
        uniquePeople: new Set(boxes.map(b => peopleById.get(b.id)?.personId)).size,
        uniqueOccurrences: new Set(boxes.map(b => b.id)).size,
        families: layout.junctions.length,
        routedEdges: new Set(paths.map(p => p.id)).size,
        expectedEdges: families.reduce((n, f) => n + f.parents.length + f.children.length, 0),
        cardOverlaps: 0,
        cardHits: 0,
        coincident: 0,
        crossings: 0,
        falseJunctions: 0,
        nonOrthogonal: 0,
        modelIssues: layout.issues.length,
        generationSpread: []
    };
    const segments = paths.flatMap(p => p.points.slice(1).map((b, i) => (
        {
            a: p.points[i],
            b,
            family: p.family,
            id: p.id
        })))
        .filter(s => distance(s.a, s.b) > EPS);
    const hit = (type, point, note) =>
    {
        marks.push(
        {
            type,
            point,
            note
        });
        details.push(type + ': ' + note);
    };
    // All card interiors are protected, including the card that owns an endpoint.
    // Liang–Barsky clipping works for horizontal, vertical and unexpected diagonal paths.
    function inside(a, b, r)
    {
        let t0 = 0,
            t1 = 1,
            dx = b.x - a.x,
            dy = b.y - a.y;
        for (const [p, q] of [
                [-dx, a.x - r.x - EPS],
                [dx, r.x + r.w - EPS - a.x],
                [-dy, a.y - r.y - EPS],
                [dy, r.y + r.h - EPS - a.y]
            ])
        {
            if (Math.abs(p) < 1e-9)
            {
                if (q < 0) return null;
                continue;
            }
            const v = q / p;
            if (p < 0) t0 = Math.max(t0, v);
            else t1 = Math.min(t1, v);
            if (t0 > t1) return null;
        }
        return t1 - t0 > 1e-6 ?
        {
            x: a.x + dx * (t0 + t1) / 2,
            y: a.y + dy * (t0 + t1) / 2
        } : null;
    }
    for (let i = 0; i < boxes.length; i++)
        for (const b of boxes.slice(i + 1))
        {
            const a = boxes[i];
            if (intersectionLength(a.x, a.x + a.w, b.x, b.x + b.w) > EPS && intersectionLength(a.y, a.y + a.h, b.y, b.y + b.h) > EPS)
            {
                report.cardOverlaps++;
                hit('Card overlap',
                {
                    x: (Math.max(a.x, b.x) + Math.min(a.x + a.w, b.x + b.w)) / 2,
                    y: (Math.max(a.y, b.y) + Math.min(a.y + a.h, b.y + b.h)) / 2
                }, a.id + ' / ' + b.id);
            }
        }
    for (const s of segments)
    {
        if (!same(s.a.x, s.b.x) && !same(s.a.y, s.b.y))
        {
            report.nonOrthogonal++;
            hit('Non-orthogonal segment',
            {
                x: (s.a.x + s.b.x) / 2,
                y: (s.a.y + s.b.y) / 2
            }, s.id);
        }
        for (const card of boxes)
        {
            const point = inside(s.a, s.b, card);
            if (point)
            {
                report.cardHits++;
                hit('Connector inside card', point, s.id + ' / ' + card.id);
            }
        }
    }
    const crossingKeys = new Set(),
        touchKeys = new Set(),
        overlapKeys = new Set();
    const positionKey = p => Math.round(p.x * 20) + ',' + Math.round(p.y * 20);
    for (let i = 0; i < segments.length; i++)
    {
        const s = segments[i];
        for (const t of segments.slice(i + 1))
        {
            if (s.family === t.family) continue; // shared rails are legal within the SAME canonical family
            const sv = same(s.a.x, s.b.x),
                tv = same(t.a.x, t.b.x),
                sh = same(s.a.y, s.b.y),
                th = same(t.a.y, t.b.y);
            if (!(sv || sh) || !(tv || th)) continue;
            const pair = [s.family, t.family].sort().join('/');
            if (sv === tv)
            {
                const a = sv ? 'y' : 'x',
                    b = sv ? 'x' : 'y';
                if (!same(s.a[b], t.a[b])) continue;
                const low = Math.max(Math.min(s.a[a], s.b[a]), Math.min(t.a[a], t.b[a]));
                const high = Math.min(Math.max(s.a[a], s.b[a]), Math.max(t.a[a], t.b[a]));
                if (high - low > EPS)
                {
                    const key = pair + ':' + b + ':' + Math.round(s.a[b] * 20) + ':' + Math.round(low * 20) + ':' + Math.round(high * 20);
                    if (!overlapKeys.has(key))
                    {
                        overlapKeys.add(key);
                        report.coincident++;
                        const p = {
                            [a]: (low + high) / 2,
                            [b]: s.a[b]
                        };
                        hit('Coincident unrelated segments', p, s.id + ' / ' + t.id);
                        marks.at(-1).segment = [
                        {
                            [a]: low,
                            [b]: s.a[b]
                        },
                        {
                            [a]: high,
                            [b]: s.a[b]
                        }];
                    }
                }
                else if (Math.abs(high - low) <= EPS)
                {
                    const p = {
                            [a]: (low + high) / 2,
                            [b]: s.a[b]
                        },
                        key = pair + ':' + positionKey(p);
                    if (!touchKeys.has(key))
                    {
                        touchKeys.add(key);
                        report.falseJunctions++;
                        hit('Unrelated endpoint contact', p, s.id + ' / ' + t.id);
                    }
                }
            }
            else
            {
                const v = sv ? s : t,
                    h = sv ? t : s,
                    p = {
                        x: v.a.x,
                        y: h.a.y
                    };
                if (!between(p.x, h.a.x, h.b.x) || !between(p.y, v.a.y, v.b.y)) continue;
                const key = pair + ':' + positionKey(p);
                const contact = [h.a.x, h.b.x].some(x => same(x, p.x)) || [v.a.y, v.b.y].some(y => same(y, p.y));
                const keys = contact ? touchKeys : crossingKeys;
                if (!keys.has(key))
                {
                    keys.add(key);
                    report[contact ? 'falseJunctions' : 'crossings']++;
                    hit(contact ? 'Unrelated junction contact' : 'Proper crossing', p, s.id + ' / ' + t.id);
                }
            }
        }
    }
    return {
        report,
        marks,
        details: [...layout.issues, ...details]
    };
}

(async () =>
{
    const solver = new ELK();
    for (const [name, [people, families]] of Object.entries(fixtures))
    {
        const model = context.projectElkTreeOccurrences(people.map(person => (
        {
            ...person,
            width: 154,
            height: 58
        })), families);
        assert.equal(model.people.length, 51);
        assert.equal(model.families.length, 19);
        if (name === 'automatic-duplicates')
        {
            assert.equal(people.length, 50);
            assert.equal(model.decisions.length, 1);
            assert.equal(model.decisions[0].appearances.length, 2);
        }
        for (const [direction, width, height] of [
                ['DOWN', 154, 58],
                ['RIGHT', 154, 58],
                ['DOWN', 300, 124]
            ])
        {
            const calculate = graph => solver.layout(JSON.parse(JSON.stringify(graph)));
            const cards = model.people.map(person => (
            {
                ...person,
                width,
                height
            }));
            const layout = await context.solveElkTree(cards, model.families, direction, calculate);
            if (direction === 'DOWN' && width === 300)
            {
                const repeat = await context.solveElkTree(cards, model.families, direction, calculate);
                assert.deepEqual(repeat.boxes, layout.boxes);
                assert.deepEqual(repeat.paths, layout.paths);
            }
            assert.equal(layout.boxes.length, 51);
            assert.equal(layout.junctions.length, 19);
            assert.equal(layout.issues.length, 0, layout.issues.join('\n'));
            assert.ok(layout.railBands?.length);
            assert.ok(layout.passes <= 2);
            for (const a of layout.boxes)
            {
                assert.ok(layout.boxes.every(b => a === b || a.x + a.w <= b.x + .02 ||
                    b.x + b.w <= a.x + .02 || a.y + a.h <= b.y + .02 || b.y + b.h <= a.y + .02));
            }
            const ids = new Map(model.people.map(person => [person.id, person]));
            const
            {
                report
            } = inspect(layout, ids, model.families);
            assert.equal(report.cardHits, 0);
            assert.equal(report.coincident, 0);
            assert.equal(report.falseJunctions, 0);
            assert.equal(report.routedEdges, report.expectedEdges);
            for (const family of model.families)
            {
                const canonical = families.find(record => record.id === family.id);
                assert.equal(JSON.stringify(family.parents.map(id => ids.get(id).personId)), JSON.stringify(canonical.parents));
                assert.equal(JSON.stringify(family.children.map(id => ids.get(id).personId)), JSON.stringify(canonical.children));
            }
            console.log(JSON.stringify(
            {
                name,
                direction,
                cardWidth: width,
                crossings: report.crossings,
                passes: layout.passes,
                width: layout.width,
                height: layout.height,
                elapsed: Math.round(layout.elapsed),
                railBands: layout.railBands.length
            }));
        }
    }
    const singleParentPeople = [
        { id: 'parent', generation: 0, width: 300, height: 124 },
        { id: 'child', generation: 1, width: 300, height: 124 }
    ];
    const singleParentFamily = [{ id: 'single-parent', parents: ['parent'], children: ['child'] }];
    for (const direction of ['DOWN', 'RIGHT'])
    {
        const layout = await context.solveElkTree(singleParentPeople, singleParentFamily, direction,
            graph => solver.layout(JSON.parse(JSON.stringify(graph))));
        assert.equal(layout.issues.length, 0, layout.issues.join("; "));
        assert.equal(layout.junctions.length, 1);
        assert.equal(layout.paths.length, 1);
        assert.equal(layout.paths[0].role, 'child');
    }
    for (let count = 1; count <= 5; count += 1)
    {
        for (const hasChildren of [false, true])
        {
            const people = [{ id: 'anchor', generation: 0, width: 300, height: 124 }];
            const families = [];
            for (let partner = 0; partner < count; partner += 1)
            {
                people.push({ id: 'partner' + partner, generation: 0, width: 300, height: 124 });
                if (hasChildren) people.push({ id: 'child' + partner, generation: 1, width: 300, height: 124 });
                families.push({ id: 'family' + partner, parents: ['anchor', 'partner' + partner],
                    children: hasChildren ? ['child' + partner] : [] });
            }
            const layout = await context.solveElkTree(people, families, 'DOWN',
                graph => solver.layout(JSON.parse(JSON.stringify(graph))));
            assert.equal(layout.boxes.length, people.length);
            assert.equal(layout.junctions.length, families.length);
            assert.equal(layout.issues.length, 0, layout.issues.join('; '));
            const { report } = inspect(layout, new Map(people.map(p => [p.id, p])), families);
            assert.equal(report.cardOverlaps, 0);
            assert.equal(report.cardHits, 0);
            assert.equal(report.coincident, 0);
            assert.equal(report.routedEdges, report.expectedEdges);
            console.log(JSON.stringify({ partners: count, hasChildren, crossings: report.crossings,
                falseJunctions: report.falseJunctions }));
        }
    }
    const solvePair = (people, families, direction) => context.solveElkTree(people, families, direction,
        graph => solver.layout(JSON.parse(JSON.stringify(graph))));
    let orderedCases = 0;
    for (const direction of ['DOWN', 'RIGHT'])
        for (const count of [1, 2, 3, 5])
            for (const hasChildren of [false, true])
                for (const maleAnchor of [false, true])
                    for (const reverse of [false, true])
                    {
                        const anchor = { id: 'a', gender: maleAnchor ? 'male' : 'female', width: 300, height: 124, generation: 0 };
                        const people = [anchor], families = [];
                        for (let i = 0; i < count; i++)
                        {
                            people.push({ ...anchor, id: 'p' + i, gender: maleAnchor ? 'female' : 'male' });
                            if (hasChildren) people.push({ ...anchor, id: 'c' + i, generation: 1 });
                            families.push({ id: 'f' + i, parents: reverse ? ['p' + i, 'a'] : ['a', 'p' + i],
                                children: hasChildren ? ['c' + i] : [] });
                        }
                        if (reverse) people.reverse();
                        const layout = await solvePair(people, families, direction);
                        assert.deepEqual([...layout.issues], []);
                        assert.equal(layout.primaryPairs[0].primary, 'f0');
                        const byId = new Map(layout.boxes.map(box => [box.id, box]));
                        const [male, female] = layout.primaryPairs[0].orderedPeople.map(id => byId.get(id));
                        const gap = direction === 'DOWN' ? female.x - male.x - male.w : female.y - male.y - male.h;
                        assert.ok(gap >= 40 - .02, 'Ordered principal partner gap');
                        if (count === 1) assert.ok(Math.abs(gap - 40) < .02, 'Uniform ordinary gap');
                        assert.ok(layout.passes <= 2);
                        assert.ok(layout.spacing.every(entry => entry.firstInwardGap >= 40 - .02));
                        orderedCases++;
                    }
    for (const direction of ['DOWN', 'RIGHT'])
    {
        const people = ['a', 'b', 'c', 'd', 'e', 'child'].map(id => ({
            id, gender: ['a', 'd', 'e'].includes(id) ? 'male' : 'female', width: 300, height: 124,
            generation: id === 'child' ? 1 : 0
        }));
        const families = [
            { id: 'principal', parents: ['b', 'a'], children: ['child'] },
            { id: 'left-extra', parents: ['a', 'c'], children: [] },
            { id: 'right-extra', parents: ['b', 'd'], children: [] },
            { id: 'other-extra', parents: ['b', 'e'], children: [] }
        ];
        const layout = await solvePair(people, families, direction);
        assert.deepEqual([...layout.issues], []);
        assert.equal(layout.primaryPairs[0].primary, 'principal');
        assert.equal(layout.primaryPairs[0].anchor, 'b');
        assert.ok(layout.passes <= 2);
    }
    console.log(JSON.stringify({ orderedCases, bilateralCases: 2, nominalGap: 40 }));

    // Reverse an ordered junction in ELK's input so its output is valid geometry
    // with a deliberately reversed principal pair, alongside unaffected families.
    const warningPeople = ['u', 'v', 'x', 'y', 'a', 'b', 'm', 'n', 'c', 'd', 'e'].map((id, index) => ({
        id, gender: index % 2 ? 'female' : 'male', width: 300, height: 124,
        generation: index < 4 ? 0 : index < 8 ? 1 : 2
    }));
    const warningFamilies = [
        { id: 'left', parents: ['u', 'v'], children: ['a', 'm'] },
        { id: 'right', parents: ['x', 'y'], children: ['b', 'n'] },
        { id: 'primary', parents: ['a', 'b'], children: ['c'] },
        { id: 'secondary', parents: ['a', 'n'], children: ['d'] },
        { id: 'other', parents: ['m', 'b'], children: ['e'] }
    ];
    for (const direction of ['DOWN', 'RIGHT'])
    {
        const layout = await context.solveElkTree(warningPeople, warningFamilies, direction, graph =>
        {
            const input = JSON.parse(JSON.stringify(graph));
            const junction = input.children.flatMap(group => group.children).find(node => node.id === 'primary');
            const [a, b] = junction.ports.filter(port => port.id.startsWith('primary:parents:'));
            const index = 'elk.port.index';
            [a.layoutOptions[index], b.layoutOptions[index]] = [b.layoutOptions[index], a.layoutOptions[index]];
            return solver.layout(input);
        });
        assert.equal(layout.issues.length, 1);
        assert.match(layout.issues[0], /^Principal partner order: primary /);
        assert.ok(layout.underpasses);
        const { report } = inspect(layout, new Map(warningPeople.map(person => [person.id, person])), warningFamilies);
        assert.equal(report.cardHits, 0);
        assert.equal(report.falseJunctions, 0);
        assert.equal(report.routedEdges, report.expectedEdges);
        assert.ok(layout.passes <= 2);

        await assert.rejects(context.solveElkTree(warningPeople, warningFamilies, direction, async graph =>
        {
            const result = await solver.layout(JSON.parse(JSON.stringify(graph)));
            const group = result.children.find(container => container.children.some(node => node.id === 'a'));
            group.children = group.children.filter(node => node.id !== 'a');
            return result;
        }), /Cannot measure incomplete first-pass ELK layout/);
    }


    // Ancestry-first centering: ordinary couples stay compact, siblings must
    // not pull the principal household off the midpoint of its parental pairs.
    function pedigree(depth, side, descendants, extended = false)
    {
        const people = [], families = [];
        const add = (id, generation, gender) =>
        {
            people.push({ id, generation, gender, width: 300, height: 124 });
            return id;
        };
        const family = (id, parents, children) => families.push({ id, parents, children });
        const parental = id => families.find(f => f.children.includes(id));
        add('R', depth, 'male');
        add('S', depth, 'female');
        family('couple:R', ['R', 'S'], []);
        function ancestors(child, generation)
        {
            if (!generation) return;
            const prefix = child === 'R' ? '' : child;
            const father = add(prefix + 'F', generation - 1, 'male');
            const mother = add(prefix + 'M', generation - 1, 'female');
            family('parents:' + child, [father, mother], [child]);
            ancestors(father, generation - 1);
            ancestors(mother, generation - 1);
        }
        ancestors('R', depth);
        for (const branch of side)
        {
            if (extended)
            {
                const anchor = branch.repeat(3);
                const generation = depth - 3;
                for (let i = 1; i <= 3; i++)
                {
                    let current = add(branch + '-branch-' + i, generation, i === 2 ? 'female' : 'male');
                    parental(anchor).children.push(current);
                    for (let level = generation; level <= depth; level++)
                    {
                        if (i === 2 && level > generation + 1) break;
                        const person = people.find(p => p.id === current);
                        const male = person.gender === 'male';
                        let parents = [current];
                        if (i !== 2 || level !== generation)
                        {
                            const spouse = add(current + '-partner', level, male ? 'female' : 'male');
                            parents = male ? [current, spouse] : [spouse, current];
                        }
                        const children = [];
                        if (level < depth)
                        {
                            children.push(add(current + '-child', level + 1, i === 3 ? 'female' : 'male'));
                            if (i === 1 && level === generation)
                                children.push(add(current + '-other', level + 1, 'female'));
                        }
                        family('extended:' + current, parents, children);
                        current = children[0];
                        if (!current) break;
                    }
                }
            }
            const sibling = add(branch + '-near', depth - 1, branch === 'F' ? 'male' : 'female');
            parental(branch).children.push(sibling);
            if (descendants)
                family('near:' + branch, [sibling], [add(sibling + '-child', depth, 'male')]);
        }
        return { people, families };
    }

    function cardCoordinates(graph, people)
    {
        const ids = new Set(people.map(p => p.id));
        const cards = new Map();
        function walk(node, x, y)
        {
            if (ids.has(node.id))
                cards.set(node.id, { id: node.id, x, y, w: node.width, h: node.height });
            for (const child of node.children || []) walk(child, x + child.x, y + child.y);
        }
        walk(graph, 0, 0);
        return cards;
    }

    function coupleErrors(cards, families, direction)
    {
        const incoming = new Map(families.flatMap(f => f.children.map(id => [id, f])));
        const center = f => f.parents.reduce((sum, id) =>
        {
            const b = cards.get(id);
            return sum + (direction === 'DOWN' ? b.x + b.w / 2 : b.y + b.h / 2);
        }, 0) / f.parents.length;
        const result = new Map();
        for (const f of families)
        {
            if (f.parents.length !== 2) continue;
            const [a, b] = f.parents.map(id => incoming.get(id));
            if (a?.parents.length === 2 && b?.parents.length === 2)
                result.set(f.id, Math.abs(center(f) - (center(a) + center(b)) / 2));
        }
        return result;
    }

    let centeringCases = 0;
    for (const direction of ['DOWN', 'RIGHT'])
        for (const [depth, side, descendants, extended] of [
            [3, '', false, false],
            [3, 'M', false, false],
            [3, 'F', true, false],
            [5, 'M', true, false],
            [5, 'F', false, false],
            [5, 'FM', true, false],
            [5, 'M', true, true],
            [5, 'F', true, true]
        ])
        {
            const { people, families } = pedigree(depth, side, descendants, extended);
            let native;
            const layout = await context.solveElkTree(people, families, direction, async graph =>
            {
                native = await solver.layout(JSON.parse(JSON.stringify(graph)));
                return native;
            });
            const before = cardCoordinates(native, people);
            const after = new Map(layout.boxes.map(b => [b.id, b]));
            const oldErrors = coupleErrors(before, families, direction);
            const newErrors = coupleErrors(after, families, direction);
            assert.ok(layout.passes <= 2);
            assert.deepEqual([...layout.issues], []);
            assert.equal(after.size, before.size);
            for (const [id, error] of newErrors)
                assert.ok(error <= oldErrors.get(id) + EPS, 'Other couple centering regressed: ' + id);
            for (const p of people)
            {
                const a = before.get(p.id), b = after.get(p.id);
                assert.equal(direction === 'DOWN' ? a.y : a.x, direction === 'DOWN' ? b.y : b.x);
                assert.equal(a.w, b.w);
                assert.equal(a.h, b.h);
            }
            for (const f of families.filter(f => f.parents.length === 2))
            {
                const [a, b] = f.parents.map(id => before.get(id));
                const [c, d] = f.parents.map(id => after.get(id));
                const axis = direction === 'DOWN' ? 'x' : 'y';
                assert.ok(same(b[axis] - a[axis], d[axis] - c[axis]), 'Rigid partner gap changed');
            }
            const { report } = inspect(layout, new Map(people.map(p => [p.id, p])), families);
            assert.equal(report.cardOverlaps, 0);
            assert.equal(report.cardHits, 0);
            assert.equal(report.coincident, 0);
            assert.equal(report.falseJunctions, 0);
            assert.equal(report.nonOrthogonal, 0);
            assert.equal(report.routedEdges, families.reduce((n, f) => n + (f.parents.length === 2 ? 2 : 0) + f.children.length, 0));
            if (!extended)
            {
                assert.ok(newErrors.get('parents:R') < EPS, 'Main couple must be centered');
                if (side.length !== 1)
                    assert.deepEqual([...after.values()], [...before.values()], 'Balanced tree must remain native');
            }
            console.log(JSON.stringify({ direction, depth, side, descendants, extended,
                nativeOffset: oldErrors.get('parents:R'), refinedOffset: newErrors.get('parents:R'),
                centeredFamilies: layout.centeredFamilies || [], crossings: report.crossings }));
            centeringCases++;
        }
    console.log(JSON.stringify({ centeringCases }));

    const reversal = require('./fixtures/elk-principal-order-reversal.json');
    for (const direction of ['DOWN', 'RIGHT'])
    {
        const layout = await solvePair(reversal.people, reversal.families, direction);
        assert.ok(layout.underpasses, layout.issues.join('; '));
        assert.ok(layout.issues.every(issue => issue.startsWith('Principal partner order: z1 ')));
        assert.ok(layout.passes <= 2);
        console.log(JSON.stringify({ direction, compoundOrderingDiagnostics: layout.issues }));
    }
})().catch(error =>
{
    console.error(error);
    process.exitCode = 1;
});