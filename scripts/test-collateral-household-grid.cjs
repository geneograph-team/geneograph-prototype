'use strict';

function allocateHouseholdGrid(nodes, families, focusId, options)
{
    const { horizontal = false, cardWidth = 300, cardHeight = 124, gap = 56, laneGap = 18 } = options || {};
    const crossSize = horizontal ? cardHeight : cardWidth;
    const depthSize = horizontal ? cardWidth : cardHeight;
    const half = crossSize / 2;
    const spacing = crossSize + gap;
    const byId = new Map(nodes.map(node => [node.id, node]));
    const refuse = reason => ({ supported: false, reason });
    if (byId.size !== nodes.length || nodes.some(node => node.placeholder))
        return refuse('Repeated occurrences or placeholders require a boundary-aware region adapter');
    if (!byId.has(focusId)) return refuse('Missing focus');
    const partners = new Map(nodes.map(node => [node.id, new Set()]));
    const pairFamilies = new Set();
    for (const family of families)
    {
        if (!family.parents.length || family.parents.length > 2 ||
            [...family.parents, ...family.children].some(id => !byId.has(id)))
            return refuse('Invalid or incomplete family context');
        if (family.parents.length === 2)
        {
            const [a, b] = family.parents;
            const key = JSON.stringify([a, b].sort());
            if (pairFamilies.has(key)) return refuse('Separate family records for the same partners require distinct ports');
            pairFamilies.add(key);
            partners.get(a).add(b);
            partners.get(b).add(a);
        }
    }
    const compare = (a, b) => byId.get(a).cross - byId.get(b).cross || a.localeCompare(b);
    const units = [];
    const unitById = new Map();
    for (const node of nodes)
    {
        if (unitById.has(node.id)) continue;
        const unit = { members: [node.id], families: [], incoming: null };
        units.push(unit);
        unitById.set(node.id, unit);
        for (const id of unit.members)
        {
            for (const partner of partners.get(id))
            {
                if (unitById.has(partner)) continue;
                unitById.set(partner, unit);
                unit.members.push(partner);
            }
        }
    }
    for (const family of families)
    {
        const unit = unitById.get(family.parents[0]);
        const children = family.children.map(id => ({ id, unit: unitById.get(id) }));
        if (family.parents.some(id => unitById.get(id) !== unit) ||
            new Set(children.map(child => child.unit)).size !== children.length)
            return refuse('Shared household membership needs a non-exclusive region');
        for (const child of children)
        {
            if (child.unit === unit || child.unit.incoming)
                return refuse('Reconverging or multiple-parent household requires a shared region');
            child.unit.incoming = unit;
        }
        unit.families.push({ ...family, childUnits: children.sort((a, b) => compare(a.id, b.id)) });
    }
    const roots = units.filter(unit => !unit.incoming);
    if (roots.length !== 1) return refuse('Not a connected independent household tree');

    function orderUnit(unit)
    {
        const sorted = [...unit.members].sort(compare);
        if (sorted.length === 1)
            return unit.families.length <= 1 ? { order: sorted, slots: unit.families, principal: -1 } : null;
        const degree = id => partners.get(id).size;
        const hub = sorted.find(id => degree(id) === sorted.length - 1);
        let order;
        let principal = -1;
        if (hub && sorted.length > 2)
        {
            const others = sorted.filter(id => id !== hub).sort((a, b) =>
                Math.abs(byId.get(a).cross - byId.get(hub).cross) -
                Math.abs(byId.get(b).cross - byId.get(hub).cross) || compare(a, b));
            const firstSide = compare(others[0], hub) < 0 ? -1 : 1;
            const left = [], right = [];
            others.forEach((id, i) => ((i % 2 ? -firstSide : firstSide) < 0 ? left : right).push(id));
            order = [...left.reverse(), hub, ...right];
            principal = Math.min(order.indexOf(hub), order.indexOf(others[0]));
        }
        else if (sorted.every(id => degree(id) <= 2) && sorted.some(id => degree(id) === 1))
        {
            order = [sorted.find(id => degree(id) === 1)];
            for (const id of order)
            {
                const next = [...partners.get(id)].find(partner => !order.includes(partner));
                if (next) order.push(next);
            }
            if (order.length !== sorted.length) return null;
            const inversions = list => list.reduce((sum, id, i) =>
                sum + list.slice(i + 1).filter(other => compare(id, other) > 0).length, 0);
            if (inversions([...order].reverse()) < inversions(order)) order.reverse();
            const focusIndex = order.indexOf(focusId);
            principal = Math.max(0, Math.min(order.length - 2, focusIndex));
        }
        else return null;
        const slots = Array(order.length - 1);
        for (const family of unit.families)
        {
            if (family.parents.length !== 2) return null;
            const [a, b] = family.parents.map(id => order.indexOf(id)).sort((a, b) => a - b);
            const index = b - a === 1 ? a : order[a] === hub ? b - 1 : order[b] === hub ? a : -1;
            if (index < 0 || slots[index]) return null;
            slots[index] = family;
        }
        if (slots.some(family => !family)) return null;
        return { order, slots, principal };
    }

    const visiting = new Set();
    const visited = new Set();
    function measure(unit)
    {
        if (visiting.has(unit)) throw Error('Cycle in household graph');
        visiting.add(unit);
        const ordering = orderUnit(unit);
        if (!ordering) throw Error('Partnership graph has no independent slot ordering');
        const { order, slots, principal } = ordering;
        const blocks = slots.map(family =>
        {
            const children = family.childUnits.map(child => ({ ...child, plan: measure(child.unit) }));
            let cursor = 0;
            for (const child of children)
            {
                child.offset = cursor - child.plan.min;
                cursor += child.plan.max - child.plan.min + gap;
            }
            const childCenters = children.map(child => child.offset + child.plan.cards.find(card => card.id === child.id).cross);
            const center = children.length ? (Math.min(...childCenters) + Math.max(...childCenters)) / 2 : 0;
            children.forEach(child => child.offset -= center);
            return {
                family, children,
                min: Math.min(0, ...children.map(child => child.offset + child.plan.min)),
                max: Math.max(0, ...children.map(child => child.offset + child.plan.max))
            };
        });
        const gaps = Array(Math.max(0, order.length - 1)).fill(spacing);
        for (let i = 0; i + 1 < blocks.length; i++)
        {
            const required = 2 * (blocks[i].max - blocks[i + 1].min + gap);
            const shortage = Math.max(0, required - gaps[i] - gaps[i + 1]);
            gaps[i === principal ? i + 1 : i] += shortage;
        }
        const positions = [0];
        for (const distance of gaps) positions.push(positions.at(-1) + distance);
        const cards = order.map((id, i) => ({ id, cross: positions[i], level: 0 }));
        const households = [];
        for (const [i, block] of blocks.entries())
        {
            const junction = order.length === 1 ? 0 : (positions[i] + positions[i + 1]) / 2;
            households.push({
                id: block.family.id, parents: block.family.parents, children: block.family.children,
                level: 0, junction,
                territory: [junction + block.min, junction + block.max]
            });
            for (const child of block.children)
            {
                const shift = junction + child.offset;
                cards.push(...child.plan.cards.map(card => ({ ...card, cross: card.cross + shift, level: card.level + 1 })));
                households.push(...child.plan.households.map(household => ({
                    ...household, junction: household.junction + shift, level: household.level + 1,
                    territory: household.territory.map(value => value + shift)
                })));
            }
        }
        visiting.delete(unit);
        visited.add(unit);
        return {
            cards, households,
            min: Math.min(...cards.map(card => card.cross - half)),
            max: Math.max(...cards.map(card => card.cross + half))
        };
    }

    let plan;
    try { plan = measure(roots[0]); }
    catch (error) { return refuse(error.message); }
    if (visited.size !== units.length) return refuse('Unreachable household units');
    const cards = new Map(plan.cards.map(card => [card.id, card]));
    const bands = new Map();
    for (const household of plan.households)
    {
        const parents = household.parents.map(id => cards.get(id));
        household.extended = parents.length === 2 && plan.cards.some(card =>
            card.level === household.level && !household.parents.includes(card.id) &&
            card.cross > Math.min(...parents.map(parent => parent.cross)) &&
            card.cross < Math.max(...parents.map(parent => parent.cross)));
        if (!bands.has(household.level)) bands.set(household.level, []);
        bands.get(household.level).push(household);
    }
    const rows = [0];
    const maxLevel = Math.max(...plan.cards.map(card => card.level));
    for (let level = 0; level <= maxLevel; level++)
    {
        const households = bands.get(level) || [];
        const extended = households.filter(household => household.extended);
        extended.sort((a, b) => a.junction - b.junction || a.id.localeCompare(b.id));
        extended.forEach((household, i) => household.lane = i + 1);
        const parentPorts = new Map();
        for (const household of extended)
        {
            for (const id of household.parents)
            {
                if (!parentPorts.has(id)) parentPorts.set(id, []);
                parentPorts.get(id).push(household);
            }
        }
        for (const [id, linked] of parentPorts)
        {
            linked.forEach((household, i) =>
            {
                household.ports ||= {};
                household.ports[id] = cards.get(id).cross + crossSize * ((i + 1) / (linked.length + 1) - .5);
            });
        }
        // Allocate the entire corridor before producing a single path.
        rows.push(rows[level] + depthSize + (extended.length + 3) * laneGap);
    }
    const routes = [];
    const point = (cross, depth) => [cross, depth];
    const add = (household, role, points) => routes.push({ familyId: household.id, role, points });
    for (const household of plan.households)
    {
        const parents = household.parents.map(id => cards.get(id)).sort((a, b) => a.cross - b.cross);
        const row = rows[household.level];
        const edge = row + depthSize / 2;
        let junctionDepth = row;
        if (parents.length === 2)
        {
            const [left, right] = parents;
            if (household.extended)
            {
                junctionDepth = edge + household.lane * laneGap;
                const a = household.ports[left.id], b = household.ports[right.id];
                add(household, 'partner', [point(a, edge), point(a, junctionDepth),
                    point(household.junction, junctionDepth), point(b, junctionDepth), point(b, edge)]);
            }
            else
                add(household, 'partner', [point(left.cross + half, row),
                    point(household.junction, row), point(right.cross - half, row)]);
        }
        else junctionDepth = edge;
        if (!household.children.length) continue;
        const childCenters = household.children.map(id => cards.get(id).cross);
        const childEdge = rows[household.level + 1] - depthSize / 2;
        const railDepth = childEdge - laneGap;
        const low = Math.min(household.junction, ...childCenters);
        const high = Math.max(household.junction, ...childCenters);
        add(household, 'trunk', [point(household.junction, junctionDepth), point(household.junction, railDepth)]);
        if (high > low) add(household, 'rail', [point(low, railDepth), point(high, railDepth)]);
        for (const [i, id] of household.children.entries())
            add(household, 'child:' + id, [point(childCenters[i], railDepth), point(childCenters[i], childEdge)]);
    }
    const origin = cards.get(focusId);
    const dx = byId.get(focusId).cross - origin.cross;
    const dy = byId.get(focusId).depth - rows[origin.level];
    return {
        supported: true,
        cards: plan.cards.map(card => ({ id: card.id, cross: card.cross + dx, depth: rows[card.level] + dy })),
        households: plan.households.map(household => ({
            ...household, junction: household.junction + dx, territory: household.territory.map(value => value + dx)
        })),
        routes: routes.map(route => ({ ...route, points: route.points.map(([x, y]) => [x + dx, y + dy]) })),
        crossSize, depthSize
    };
}

function inspectGeometry(plan)
{
    const { cards, routes, crossSize, depthSize } = plan;
    const issues = { cards: 0, cardHits: 0, coincident: 0, crossings: 0 };
    const segments = routes.flatMap(route => route.points.slice(1).map((b, i) =>
        ({ a: route.points[i], b, familyId: route.familyId })).filter(s => s.a[0] !== s.b[0] || s.a[1] !== s.b[1]));
    const overlap = (a, b, c, d) => Math.min(Math.max(a, b), Math.max(c, d)) - Math.max(Math.min(a, b), Math.min(c, d));
    for (let i = 0; i < cards.length; i++)
    {
        for (const other of cards.slice(i + 1))
            if (Math.abs(cards[i].cross - other.cross) < crossSize && Math.abs(cards[i].depth - other.depth) < depthSize) issues.cards++;
    }
    for (const { a, b } of segments)
    {
        for (const card of cards)
        {
            const left = card.cross - crossSize / 2, right = card.cross + crossSize / 2;
            const top = card.depth - depthSize / 2, bottom = card.depth + depthSize / 2;
            if (a[0] === b[0] && a[0] > left && a[0] < right && overlap(a[1], b[1], top, bottom) > 0 ||
                a[1] === b[1] && a[1] > top && a[1] < bottom && overlap(a[0], b[0], left, right) > 0) issues.cardHits++;
        }
    }
    for (let i = 0; i < segments.length; i++)
    {
        const s = segments[i];
        for (const t of segments.slice(i + 1))
        {
            if (s.familyId === t.familyId) continue;
            const sv = s.a[0] === s.b[0], tv = t.a[0] === t.b[0];
            if (sv === tv)
            {
                const axis = sv ? 0 : 1, other = 1 - axis;
                if (s.a[axis] === t.a[axis] && overlap(s.a[other], s.b[other], t.a[other], t.b[other]) > 0) issues.coincident++;
            }
            else
            {
                const v = sv ? s : t, h = sv ? t : s;
                if (v.a[0] > Math.min(h.a[0], h.b[0]) && v.a[0] < Math.max(h.a[0], h.b[0]) &&
                    h.a[1] > Math.min(v.a[1], v.b[1]) && h.a[1] < Math.max(v.a[1], v.b[1])) issues.crossings++;
            }
        }
    }
    return issues;
}

function makeFixture(count, deep, bothSides, children = true)
{
    const ids = new Set();
    const families = [];
    const add = (id, parents, kids) =>
    {
        [...parents, ...kids].forEach(id => ids.add(id));
        families.push({ id, parents, children: kids });
    };
    add('root', ['ancestor-a', 'ancestor-b'], ['hub', 'collateral']);
    add('collateral-family', ['collateral', 'collateral-spouse'], ['collateral-child']);
    add('principal', ['hub', 'principal'], children ? ['principal-child'] : []);
    for (let i = 1; i < count; i++)
    {
        const hub = bothSides && i % 2 === 0 ? 'principal' : 'hub';
        const childIds = children ? Array.from({ length: i % 3 + 1 }, (_, j) => 'c-' + i + '-' + j) : [];
        add('extra-' + i, [hub, 'partner-' + i], childIds);
        if (deep && childIds.length)
            add('desc-' + i, [childIds[0], 'desc-partner-' + i], ['grand-' + i, 'grand-other-' + i]);
    }
    return { people: [...ids].map(id => ({ id, gender: id.includes('partner') || id === 'principal' ? 'female' : 'male' })), families, focusId: 'hub' };
}

function runExperiment(api, inputBuilder, assert, log)
{
    const results = [];
    for (const horizontal of [false, true])
    {
        for (const children of [true, false])
        {
            for (let count = 1; count <= 5; count++)
            {
                for (const deep of [false, true])
                {
                    const fixture = makeFixture(count, deep, false, children);
                    const source = JSON.stringify(fixture);
                    const canonical = fixture.families.map(family => ({
                        id: family.id, left: family.parents[0], right: family.parents[1], children: family.children
                    }));
                    const input = inputBuilder(fixture.people, canonical, { contextual: true });
                    const native = api.CalculateTree({
                        data: input.data, main_id: fixture.focusId, is_horizontal: horizontal,
                        node_separation: 356, level_separation: 189, single_parent_empty_card: false,
                        show_siblings_of_main: true, family_contexts: input.familyContexts
                    });
                    const nodes = native.data.map(node => ({
                        id: node.data.id, cross: horizontal ? node.y : node.x, depth: horizontal ? node.x : node.y
                    }));
                    assert(nodes.length === fixture.people.length, 'baseline coverage');
                    const start = Date.now();
                    const plan = allocateHouseholdGrid(nodes, fixture.families, fixture.focusId, { horizontal });
                    const elapsed = Date.now() - start;
                    assert(plan.supported, plan.reason);
                    assert(plan.cards.length === nodes.length, 'candidate coverage');
                    assert(plan.households.length === fixture.families.length, 'household coverage');
                    assert(JSON.stringify(plan) === JSON.stringify(allocateHouseholdGrid(nodes, fixture.families, fixture.focusId, { horizontal })), 'determinism');
                    assert(JSON.stringify(fixture) === source, 'canonical input mutation');
                    const diagnostics = inspectGeometry(plan);
                    assert(diagnostics.cards === 0 && diagnostics.cardHits === 0 && diagnostics.coincident === 0, JSON.stringify({ horizontal, count, deep, children, diagnostics }));
                    const byId = new Map(plan.cards.map(card => [card.id, card]));
                    for (const family of fixture.families)
                    {
                        const h = plan.households.find(household => household.id === family.id);
                        assert(JSON.stringify(h.parents) === JSON.stringify(family.parents), 'parent context');
                        assert(JSON.stringify(h.children) === JSON.stringify(family.children), 'child context');
                        for (const id of family.children)
                            assert(plan.routes.some(route => route.familyId === family.id && route.role === 'child:' + id && route.points.at(-1)[0] === byId.get(id).cross), 'child port');
                    }
                    const rowCards = plan.cards.filter(card => card.depth === byId.get('hub').depth);
                    const principalGap = Math.abs(byId.get('hub').cross - byId.get('principal').cross) - plan.crossSize;
                    results.push({ horizontal, count, deep, children, people: nodes.length, ...diagnostics, principalGap, rowCards: rowCards.length, elapsed });
                }
            }
        }
    }
    log(results);
    return results;
}

if (require.main === module)
{
    const fs = require('node:fs');
    const path = require('node:path');
    const vm = require('node:vm');
    const assert = require('node:assert/strict');
    const context = vm.createContext({});
    for (const file of ['vendor/d3-7.9.0.min.js', 'vendor/family-chart-0.9.0-context.js', 'core/validation.js', 'modules/family-tree/tree-native-input.js'])
    {
        const filename = path.join(__dirname, '../src', file);
        vm.runInContext(fs.readFileSync(filename, 'utf8'), context, { filename });
    }
    runExperiment(context.f3, context.buildNativeFamilyChartInput, assert.ok, results => console.log(JSON.stringify(results, null, 2)));
}

module.exports = { allocateHouseholdGrid, inspectGeometry, makeFixture, runExperiment };
