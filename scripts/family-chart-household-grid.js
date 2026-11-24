function planContextHouseholdGrid(tree, households, nativeNodes, families, geometry, config)
{
    const { is_horizontal: horizontal, level_separation: pitch } = geometry;
    const cross = horizontal ? 'y' : 'x', depth = horizontal ? 'x' : 'y';
    const gap = geometry.node_separation - (horizontal ? config.cardHeight : config.cardWidth);
    const laneGap = config.laneGap, origin = tree[0][depth];
    const nodeSet = new Set(tree);
    const level = node => Math.round((node[depth] - origin) / pitch);
    const halfCross = node => (node.data.addParent?.[horizontal ? 'height' : 'width'] ||
        (horizontal ? config.cardHeight : config.cardWidth)) / 2;
    const halfDepth = node => (node.data.addParent?.[horizontal ? 'width' : 'height'] ||
        (horizontal ? config.cardWidth : config.cardHeight)) / 2;
    const compare = (a, b) => a[cross] - b[cross] || a.tid.localeCompare(b.tid);
    const pair = parents => JSON.stringify(parents.map(node => node.tid).sort());
    const samePeople = (family, parents) => JSON.stringify([...family.parents].sort()) ===
        JSON.stringify(parents.map(node => node.data.id).sort());
    const groups = new Map();
    const refuse = reason => ({ status: 'unsupported', reason });
    if (new Set(tree.map(node => node.tid)).size !== tree.length) return refuse('Occurrence IDs are not unique');
    function add(familyId, parents, children)
    {
        const key = JSON.stringify([familyId, pair(parents)]);
        if (!groups.has(key)) groups.set(key, { key, familyId, parents, children: new Set() });
        const group = groups.get(key);
        children.forEach(child => group.children.add(child));
        return group;
    }
    for (const { family, parents, children } of households) add(family.id, parents, children);
    // Preserve occurrence-local native edges, including visual Add parent cards.
    // Distinct canonical family IDs remain distinct even for identical endpoints.
    const nativeLinks = new Map();
    for (const node of nativeNodes)
        for (const link of createLinks(node, horizontal)) nativeLinks.set(link.id, link);
    const nativeEdges = [...nativeLinks.values()];
    for (const link of nativeEdges.filter(link => !link.spouse))
    {
        const child = Array.isArray(link.source) ? link.target : link.source;
        const parents = [...new Set(Array.isArray(link.source) ? link.source : link.target)];
        if (!nodeSet.has(child) || parents.some(parent => !nodeSet.has(parent))) return refuse('Native edge leaves visible occurrence graph');
        const known = parents.filter(parent => !parent.data.addParent);
        const matching = [...groups.values()].filter(group => group.children.has(child) &&
            known.every(parent => group.parents.includes(parent)));
        if (parents.some(parent => parent.data.addParent))
        {
            const exact = matching.filter(group => group.parents.length === known.length);
            if (exact.length > 1) return refuse('Ambiguous placeholder family context');
            if (exact.length)
            {
                const group = exact[0];
                group.children.delete(child);
                if (!group.children.size && group.parents.length === 1) groups.delete(group.key);
                add(group.familyId, parents, [child]);
            }
            else if (known.length)
            {
                const candidates = families.filter(f => f.children.includes(child.data.id) && samePeople(f, known));
                if (candidates.length !== 1) return refuse('Placeholder has no unique canonical context');
                add(candidates[0].id, parents, [child]);
            }
            else add(null, parents, [child]);
        }
        else if (!matching.length)
        {
            const candidates = families.filter(f => f.children.includes(child.data.id) && samePeople(f, parents));
            if (!candidates.length) return refuse('Native child edge has no matching family context');
            for (const family of candidates) add(family.id, parents, [child]);
        }
    }
    for (const link of nativeEdges.filter(link => link.spouse))
    {
        const parents = [link.source, link.target];
        if (parents.some(parent => !nodeSet.has(parent))) return refuse('Native partnership leaves visible occurrence graph');
        if ([...groups.values()].some(group => pair(group.parents) === pair(parents))) continue;
        const matches = families.filter(f => samePeople(f, parents));
        if (!matches.length) return refuse('Native partnership has no matching family context');
        for (const family of matches) add(family.id, parents, []);
    }
    const contexts = [...groups.values()].filter(group => group.parents.length === 2 || group.children.size);
    const partners = new Map(tree.map(node => [node, new Set()]));
    for (const group of contexts)
    {
        group.children = [...group.children].sort(compare);
        group.level = level(group.parents[0]);
        if (group.parents.some(parent => level(parent) !== group.level) ||
            group.children.some(child => level(child) !== group.level + 1))
            return refuse('Family context spans incompatible generation bands');
        if (group.parents.length === 2)
        {
            const [a, b] = group.parents;
            partners.get(a).add(b);
            partners.get(b).add(a);
        }
    }
    const unitByNode = new Map(), units = [];
    for (const node of tree)
    {
        if (unitByNode.has(node)) continue;
        const unit = { members: [node], groups: [], incoming: [], level: level(node) };
        units.push(unit);
        unitByNode.set(node, unit);
        for (const member of unit.members)
            for (const partner of partners.get(member))
                if (!unitByNode.has(partner))
                {
                    unit.members.push(partner);
                    unitByNode.set(partner, unit);
                }
    }
    for (const group of contexts)
    {
        unitByNode.get(group.parents[0]).groups.push(group);
        for (const child of group.children) unitByNode.get(child).incoming.push({ group, child });
    }
    for (const unit of units)
    {
        unit.members.sort(compare);
        const pairCounts = new Map();
        for (const group of unit.groups) pairCounts.set(pair(group.parents), (pairCounts.get(pair(group.parents)) || 0) + 1);
        unit.dirty = unit.members.some(node => !nativeNodes.has(node)) || unit.members.length > 2 ||
            [...pairCounts.values()].some(count => count > 1) ||
            unit.members.some((node, i) => i && node[cross] - unit.members[i - 1][cross] < halfCross(node) + halfCross(unit.members[i - 1]));
        unit.owner = unit.incoming.length === 1 ? unit.incoming[0].group : null;
    }
    if (!units.some(unit => unit.dirty)) return { status: 'native' };

    // A child unit with more than one incoming family is a shared region,
    // not a second copy of an independent subtree.
    const owned = group => [...new Set(group.children.map(child => unitByNode.get(child)))].filter(unit => unit.owner === group);
    const bounds = cards => [
        Math.min(...cards.map(card => card.x - halfCross(card.node))),
        Math.max(...cards.map(card => card.x + halfCross(card.node)))
    ];
    const bandsFor = cards =>
    {
        const bands = new Map();
        for (const card of cards)
        {
            const row = bands.get(level(card.node)) || [Infinity, -Infinity];
            row[0] = Math.min(row[0], card.x - halfCross(card.node));
            row[1] = Math.max(row[1], card.x + halfCross(card.node));
            bands.set(level(card.node), row);
        }
        return bands;
    };
    function append(plan, child, offset)
    {
        plan.cards.push(...child.cards.map(card => ({ node: card.node, x: card.x + offset })));
        for (const [group, x] of child.junctions) plan.junctions.set(group, x + offset);
    }
    function packedChildren(group, deep)
    {
        const children = deep ? owned(group).map(unit => ({ unit, plan: measure(unit, true) })) : [];
        children.sort((a, b) => compare(a.unit.incoming[0].child, b.unit.incoming[0].child));
        let cursor = 0;
        for (const child of children)
        {
            const [min, max] = bounds(child.plan.cards);
            child.offset = cursor - min;
            cursor += max - min + gap;
        }
        const centers = children.map(child => child.offset +
            child.plan.cards.find(card => card.node === child.unit.incoming[0].child).x);
        const center = centers.length ? (Math.min(...centers) + Math.max(...centers)) / 2 : 0;
        children.forEach(child => child.offset -= center);
        return {
            group, children,
            min: Math.min(0, ...children.map(child => child.offset + bounds(child.plan.cards)[0])),
            max: Math.max(0, ...children.map(child => child.offset + bounds(child.plan.cards)[1]))
        };
    }
    function orderedSlots(unit)
    {
        const members = unit.members, slotByPair = new Map();
        if (members.length < 2) return { order: members, slotByPair, principal: -1 };
        const edges = unit.groups.filter(group => group.parents.length === 2);
        const rank = group =>
        {
            const [a, b] = group.parents;
            return [Number(partners.get(a).size > 1 && partners.get(b).size > 1),
                Number(group.parents.includes(tree[0])),
                Number(group.parents.every(node => nativeNodes.has(node))),
                -Math.abs(a[cross] - b[cross])];
        };
        const main = [...edges].sort((a, b) =>
        {
            const ra = rank(a), rb = rank(b);
            return ra.map((value, i) => rb[i] - value).find(value => value !== 0) || a.key.localeCompare(b.key);
        })[0];
        const [left, right] = [...main.parents].sort(compare);
        const used = new Set([left, right]), outerEdges = [];
        function expand(node, side)
        {
            const result = [];
            for (const child of [...partners.get(node)].sort(compare))
            {
                if (used.has(child)) continue;
                used.add(child);
                outerEdges.push({ parent: node, child, side });
                const tail = expand(child, side);
                result.push(...(side < 0 ? [...tail, child] : [child, ...tail]));
            }
            return result;
        }
        const order = [...expand(left, -1), left, right, ...expand(right, 1)];
        const principal = order.indexOf(left);
        slotByPair.set(pair([left, right]), principal);
        for (const { parent, child, side } of outerEdges)
            slotByPair.set(pair([parent, child]), order.indexOf(child) + (side < 0 ? 0 : -1));
        return { order, slotByPair, principal };
    }
    function measure(unit, deep)
    {
        const blocks = unit.groups.map(group => packedChildren(group, deep));
        // Keep clean native shapes rigid where their occupied bands are clear.
        if (!unit.dirty && (!deep || blocks.every(block => block.children.every(child => child.plan.native))))
        {
            const plan = { cards: unit.members.map(node => ({ node, x: node[cross] })), junctions: new Map(), native: true };
            const childBands = [];
            for (const block of blocks)
            {
                plan.junctions.set(block.group, block.group.parents.reduce((sum, node) => sum + node[cross], 0) / block.group.parents.length);
                for (const child of block.children)
                {
                    append(plan, child.plan, 0);
                    childBands.push(bandsFor(child.plan.cards));
                }
            }
            let clear = true;
            for (let i = 0; i < childBands.length; i++)
                for (const other of childBands.slice(i + 1))
                    for (const [row, a] of childBands[i])
                        if (other.has(row))
                        {
                            const b = other.get(row);
                            if (Math.min(a[1], b[1]) > Math.max(a[0], b[0])) clear = false;
                        }
            const byBand = new Map();
            for (const card of plan.cards)
            {
                const row = byBand.get(level(card.node)) || [];
                if (row.some(other => Math.abs(other.x - card.x) < halfCross(other.node) + halfCross(card.node))) clear = false;
                row.push(card);
                byBand.set(level(card.node), row);
            }
            if (clear) return plan;
        }
        const { order, slotByPair, principal } = orderedSlots(unit);
        const slots = Array.from({ length: Math.max(0, order.length - 1) }, () => []);
        const auxiliary = [];
        for (const block of blocks)
        {
            const slot = slotByPair.get(pair(block.group.parents));
            if (slot === undefined) auxiliary.push(block);
            else slots[slot].push(block);
        }
        const slotExtents = slots.map(items =>
        {
            let cursor = 0;
            for (const item of items)
            {
                item.offset = cursor - item.min;
                cursor += item.max - item.min + gap;
            }
            const middle = items.length ? (items[0].offset + items.at(-1).offset) / 2 : 0;
            items.forEach(item => item.offset -= middle);
            return [Math.min(0, ...items.map(item => item.offset + item.min)),
                Math.max(0, ...items.map(item => item.offset + item.max))];
        });
        const gaps = slots.map((items, i) => halfCross(order[i]) + halfCross(order[i + 1]) + gap +
            (items.length > 1 ? Math.max(...items.map(item => item.offset)) - Math.min(...items.map(item => item.offset)) : 0));
        for (let i = 0; i + 1 < slots.length; i++)
        {
            const required = 2 * (slotExtents[i][1] - slotExtents[i + 1][0] + gap);
            gaps[i === principal ? i + 1 : i] += Math.max(0, required - gaps[i] - gaps[i + 1]);
        }
        const positions = [0];
        gaps.forEach(distance => positions.push(positions.at(-1) + distance));
        const plan = { cards: order.map((node, i) => ({ node, x: positions[i] })), junctions: new Map(), native: false };
        const xByNode = new Map(plan.cards.map(card => [card.node, card.x]));
        function place(block, junction, center = junction)
        {
            plan.junctions.set(block.group, junction);
            for (const child of block.children) append(plan, child.plan, center + child.offset);
        }
        slots.forEach((items, i) =>
        {
            const center = (positions[i] + positions[i + 1] + halfCross(order[i]) - halfCross(order[i + 1])) / 2;
            items.forEach(block => place(block, center + block.offset));
        });
        for (const block of auxiliary)
        {
            const junction = block.group.parents.reduce((sum, node) => sum + xByNode.get(node), 0) / block.group.parents.length;
            const center = slots.length || auxiliary.length > 1 ? bounds(plan.cards)[1] + gap - block.min : junction;
            place(block, junction, center);
        }
        return plan;
    }

    // Allocate region bounds across all occupied generation bands. Anchor the
    // focused region and translate other regions only to satisfy clearance.
    const assigned = new Set(), regions = [];
    for (const unit of [...units].sort((a, b) => a.level - b.level || compare(a.members[0], b.members[0])))
    {
        if (assigned.has(unit)) continue;
        const plan = measure(unit, unit.dirty);
        for (const card of plan.cards) assigned.add(unitByNode.get(card.node));
        const anchor = plan.cards.find(card => card.node === tree[0]) ||
            plan.cards.find(card => unit.members.includes(card.node) && nativeNodes.has(card.node)) || plan.cards[0];
        regions.push({ ...plan, anchor, bands: bandsFor(plan.cards), desired: anchor.node[cross] - anchor.x });
    }
    regions.sort((a, b) => compare(a.anchor.node, b.anchor.node));
    const anchorIndex = regions.findIndex(region => region.cards.some(card => card.node === tree[0]));
    function distance(left, right)
    {
        let min = -Infinity;
        for (const [row, a] of left.bands)
            if (right.bands.has(row)) min = Math.max(min, a[1] - right.bands.get(row)[0] + gap);
        return min;
    }
    regions[anchorIndex].shift = regions[anchorIndex].desired;
    for (let i = anchorIndex + 1; i < regions.length; i++)
    {
        const region = regions[i];
        region.shift = Math.max(region.desired, ...regions.slice(anchorIndex, i).map(other => other.shift + distance(other, region)));
    }
    for (let i = anchorIndex - 1; i >= 0; i--)
    {
        const region = regions[i];
        region.shift = Math.min(region.desired, ...regions.slice(i + 1).map(other => other.shift - distance(region, other)));
    }
    const positions = new Map(), junctions = new Map();
    for (const region of regions)
    {
        for (const card of region.cards) positions.set(card.node, { x: card.x + region.shift, row: level(card.node) });
        for (const [group, x] of region.junctions) junctions.set(group, x + region.shift);
    }
    if (positions.size !== tree.length) return refuse('Region allocation did not cover all occurrences');

    const rows = new Map(), byBand = new Map();
    for (const node of tree)
    {
        const row = level(node);
        if (!rows.has(row)) rows.set(row, { half: 0, nodes: [] });
        const band = rows.get(row);
        band.nodes.push(node);
        band.half = Math.max(band.half, halfDepth(node));
    }
    for (const group of contexts)
    {
        if (!byBand.has(group.level)) byBand.set(group.level, []);
        byBand.get(group.level).push(group);
    }
    const x = node => positions.get(node).x;
    const allRoutes = [], links = [], layouts = new Map();
    for (const [row, rowGroups] of byBand)
    {
        const used = [];
        function reserve(preferred, min, max)
        {
            const center = Math.max(min, Math.min(max, preferred));
            for (let step = 0; step <= Math.ceil((max - min) / 4); step++)
                for (const sign of step ? [1, -1] : [1])
                {
                    const candidate = center + sign * step * 4;
                    if (candidate >= min && candidate <= max && used.every(value => Math.abs(value - candidate) >= 3.9))
                    {
                        used.push(candidate);
                        return candidate;
                    }
                }
            throw Error('Insufficient distinct connector ports');
        }
        const port = node => reserve(x(node), x(node) - halfCross(node) + 6, x(node) + halfCross(node) - 6);
        const partnerLanes = [], childLanes = [];
        function lane(lanes, min, max)
        {
            let index = lanes.findIndex(intervals => intervals.every(([a, b]) => max + gap / 4 < a || min - gap / 4 > b));
            if (index < 0) { index = lanes.length; lanes.push([]); }
            lanes[index].push([min, max]);
            return index;
        }
        try
        {
            const ordered = [...rowGroups].sort((a, b) => junctions.get(a) - junctions.get(b) || a.key.localeCompare(b.key));
            // Allocate ports and lanes once, globally per inter-generation band.
            for (const group of ordered)
            {
                const parents = [...group.parents].sort((a, b) => x(a) - x(b));
                const [a, b] = parents;
                const p = { group, parents, direct: false };
                layouts.set(group, p);
                if (!b) continue;
                const min = x(a) + halfCross(a), max = x(b) - halfCross(b);
                const blocked = rows.get(row).nodes.some(node => !parents.includes(node) && x(node) + halfCross(node) > min && x(node) - halfCross(node) < max);
                const repeated = ordered.some(other => other !== group && pair(other.parents) === pair(parents));
                if (!blocked && !repeated && max - min > 12)
                {
                    p.direct = true;
                    p.junction = reserve(junctions.get(group), min + 4, max - 4);
                }
            }
            for (const group of ordered)
            {
                const p = layouts.get(group), [a, b] = p.parents;
                if (!b)
                {
                    if (group.children.length) p.junction = port(a);
                }
                else if (!p.direct)
                {
                    p.a = port(a);
                    p.b = port(b);
                    const min = Math.min(p.a, p.b), max = Math.max(p.a, p.b);
                    p.junction = reserve(junctions.get(group), min + 4, max - 4);
                    p.partnerLane = lane(partnerLanes, min, max);
                }
                if (group.children.length)
                {
                    p.children = group.children.map(child => ({ child, port: port(child) }));
                    p.low = Math.min(p.junction, ...p.children.map(child => child.port));
                    p.high = Math.max(p.junction, ...p.children.map(child => child.port));
                    p.childLane = lane(childLanes, p.low, p.high);
                }
            }
        }
        catch (error) { return refuse(error.message); }
        const band = rows.get(row);
        band.partnerLanes = partnerLanes.length;
        band.childLanes = childLanes.length;
    }
    rows.get(0).position = origin;
    const rowNumbers = [...rows.keys()].sort((a, b) => a - b);
    const step = (a, b) => Math.max((b - a) * pitch, rows.get(a).half + rows.get(b).half +
        ((rows.get(a).partnerLanes || 0) + (rows.get(a).childLanes || 0) + 1) * laneGap);
    for (const row of rowNumbers.filter(row => row > 0))
    {
        const prior = rowNumbers[rowNumbers.indexOf(row) - 1];
        rows.get(row).position = rows.get(prior).position + step(prior, row);
    }
    for (const row of rowNumbers.filter(row => row < 0).reverse())
    {
        const next = rowNumbers[rowNumbers.indexOf(row) + 1];
        rows.get(row).position = rows.get(next).position - step(row, next);
    }
    const screen = ([a, b]) => horizontal ? [b, a] : [a, b];
    function descriptor(group, role, source, target, paths, spouse = false)
    {
        const gridPaths = paths.filter(points => points.length > 1).map(points => points.map(screen));
        const id = 'grid:' + group.key + ':' + role;
        allRoutes.push(...paths.map(points => ({ key: group.key, points })));
        links.push({
            id, familyContextId: group.familyId, source, target, spouse, curve: false,
            depth: (Array.isArray(source) ? target : source).depth || 0,
            gridPaths, d: gridPaths[0], _d: () => gridPaths[0]
        });
    }
    for (const p of layouts.values())
    {
        const { group, parents, junction } = p, [a, b] = parents;
        const band = rows.get(group.level), y = band.position;
        let junctionY;
        if (b && p.direct)
        {
            junctionY = y;
            descriptor(group, 'partner', a, b, [[[x(a) + halfCross(a), y], [junction, y], [x(b) - halfCross(b), y]]], true);
        }
        else if (b)
        {
            junctionY = y + band.half + (p.partnerLane + 1) * laneGap;
            descriptor(group, 'partner', a, b, [[[p.a, y + halfDepth(a)], [p.a, junctionY],
                [junction, junctionY], [p.b, junctionY], [p.b, y + halfDepth(b)]]], true);
        }
        else junctionY = y + halfDepth(a);
        if (!p.children?.length) continue;
        const rail = y + band.half + ((band.partnerLanes || 0) + p.childLane + 1) * laneGap;
        const common = [[[junction, junctionY], [junction, rail]]];
        if (p.low < p.high) common.push([[p.low, rail], [p.high, rail]]);
        p.children.forEach(({ child, port }, index) =>
        {
            const drop = [[port, rail], [port, rows.get(level(child)).position - halfDepth(child)]];
            descriptor(group, 'child:' + child.tid, child, b ? parents : [a, a], index ? [drop] : [...common, drop]);
        });
    }
    const cards = tree.map(node => ({ node, x: x(node), y: rows.get(level(node)).position, w: halfCross(node), h: halfDepth(node) }));
    const diagnostics = inspectContextGrid(cards, allRoutes, links, tree[0]);
    if (diagnostics.cardOverlaps || diagnostics.cardHits || diagnostics.coincident || diagnostics.falseJunctions || diagnostics.disconnected)
        return { ...refuse('Global geometry or connectivity validation failed'), diagnostics };
    // Publish geometry only after validation. Keep native occurrence objects.
    for (const card of cards)
    {
        const dx = card.x - card.node[cross];
        card.node[cross] = card.x;
        card.node[depth] = card.y;
        if (typeof card.node.sx === 'number') card.node.sx += dx;
    }
    const extents = allRoutes.flatMap(route => route.points.map(screen));
    return { status: 'applied', links, diagnostics, regions: regions.length, extents };
}

function inspectContextGrid(cards, routes, links, focus)
{
    const diagnostics = { cardOverlaps: 0, cardHits: 0, coincident: 0, crossings: 0, falseJunctions: 0, disconnected: 0 };
    const overlap = (a, b, c, d) => Math.min(Math.max(a, b), Math.max(c, d)) - Math.max(Math.min(a, b), Math.min(c, d));
    const segments = routes.flatMap(route => route.points.slice(1).map((b, i) => ({ a: route.points[i], b, key: route.key })))
        .filter(({ a, b }) => a[0] !== b[0] || a[1] !== b[1]);
    for (let i = 0; i < cards.length; i++)
        for (const b of cards.slice(i + 1))
        {
            const a = cards[i];
            if (Math.abs(a.x - b.x) < a.w + b.w - 1e-6 && Math.abs(a.y - b.y) < a.h + b.h - 1e-6) diagnostics.cardOverlaps++;
        }
    for (const { a, b } of segments)
        for (const c of cards)
            if ((a[0] === b[0] && a[0] > c.x - c.w + 1e-6 && a[0] < c.x + c.w - 1e-6 &&
                overlap(a[1], b[1], c.y - c.h, c.y + c.h) > 1e-6) ||
                (a[1] === b[1] && a[1] > c.y - c.h + 1e-6 && a[1] < c.y + c.h - 1e-6 &&
                overlap(a[0], b[0], c.x - c.w, c.x + c.w) > 1e-6)) diagnostics.cardHits++;
    for (let i = 0; i < segments.length; i++)
    {
        const s = segments[i];
        for (const t of segments.slice(i + 1))
        {
            if (s.key === t.key) continue;
            const sv = s.a[0] === s.b[0], tv = t.a[0] === t.b[0];
            if (sv === tv)
            {
                const axis = sv ? 0 : 1, other = 1 - axis;
                if (Math.abs(s.a[axis] - t.a[axis]) < 1e-6 && overlap(s.a[other], s.b[other], t.a[other], t.b[other]) > 1e-6)
                    diagnostics.coincident++;
            }
            else
            {
                const v = sv ? s : t, h = sv ? t : s;
                if (overlap(h.a[0], h.b[0], v.a[0], v.a[0]) < -1e-6 ||
                    overlap(v.a[1], v.b[1], h.a[1], h.a[1]) < -1e-6) continue;
                const end = [h.a[0], h.b[0]].some(x => Math.abs(x - v.a[0]) < 1e-6) ||
                    [v.a[1], v.b[1]].some(y => Math.abs(y - h.a[1]) < 1e-6);
                if (end) diagnostics.falseJunctions++;
                else diagnostics.crossings++;
            }
        }
    }
    const reachable = new Set([focus]);
    const adjacent = new Map(cards.map(card => [card.node, new Set()]));
    for (const link of links)
    {
        const endpoints = [...new Set([link.source, link.target].flat())];
        for (const a of endpoints) for (const b of endpoints) adjacent.get(a).add(b);
    }
    for (const node of reachable) for (const next of adjacent.get(node)) reachable.add(next);
    diagnostics.disconnected = cards.length - reachable.size;
    return diagnostics;
}
