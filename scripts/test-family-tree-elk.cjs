'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ELK = require('../src/vendor/elkjs-0.10.0/lib/elk.bundled.js');
const fixtures = require('./fixtures/elk-tree-approved.json');
const context = vm.createContext(
{
    performance
});
const source = path.join(__dirname, '../src/modules/family-tree/tree-elk-model.js');
vm.runInContext(fs.readFileSync(source, 'utf8'), context);

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
})().catch(error =>
{
    console.error(error);
    process.exitCode = 1;
});