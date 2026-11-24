/*
 * Experimental Family Chart-style layout (#389).
 * Layout approach adapted from Family Chart v0.9.0, calculate-tree.ts:
 * https://github.com/donatso/family-chart/tree/c7d22492dfc3090109cf28c6d4c82b1ee4ffd770
 * Uses the upstream D3 tidy-tree algorithm, with a GeneoGraph-specific
 * family-block projection rather than flattening canonical family records.
 *
 * MIT License
 * 
 * Copyright (c) 2026 donatso
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

// This independent experiment is deliberately not a fallback or replacement
// for calculateTreeLayout. Shared geometry, routing and rendering stay intact.
function calculateTestTreeLayout(people, sourceFamilies, focusPersonId, options = {})
{
    const g = TREE_GEOMETRY;
    const roles = options.branchRoles || {};
    const peopleById = new Map(people.map(person => [person.id, person]));
    const families = sourceFamilies.map(family => ({ ...family, children: [...(family.children || [])] }));
    if (!peopleById.has(focusPersonId)) throw new Error('Test layout has no visible focus.');

    const parentFamilies = new Map();
    const childFamilies = new Map();
    function addToIndex(index, id, family)
    {
        if (!peopleById.has(id)) return;
        if (!index.has(id)) index.set(id, []);
        index.get(id).push(family);
    }
    for (const family of families)
    {
        for (const id of [family.left, family.right]) addToIndex(childFamilies, id, family);
        for (const id of family.children) addToIndex(parentFamilies, id, family);
    }

    // Assign one generation to each canonical person, following real families.
    const generations = new Map([[focusPersonId, 0]]);
    const queue = [focusPersonId];
    function visit(id, generation)
    {
        if (!peopleById.has(id) || generations.has(id)) return;
        generations.set(id, generation);
        queue.push(id);
    }
    for (let i = 0; i < queue.length; i++)
    {
        const id = queue[i];
        const generation = generations.get(id);
        for (const family of parentFamilies.get(id) || [])
        {
            visit(family.left, generation - 1);
            visit(family.right, generation - 1);
            for (const child of family.children) visit(child, generation);
        }
        for (const family of childFamilies.get(id) || [])
        {
            visit(family.left, generation);
            visit(family.right, generation);
            for (const child of family.children) visit(child, generation + 1);
        }
    }
    if (generations.size !== people.length) throw new Error('Test layout projection is disconnected.');

    // Layout-only nodes and family ports. Keep all real IDs and relationships.
    const nodes = new Map(people.map(person => [person.id, {
        ...person, generation: generations.get(person.id), width: g.cardWidth, height: g.cardHeight
    }]));
    const parentPlaceholders = [];
    const parentPlaceholdersByPerson = Object.create(null);
    const placeholderFamilies = new Map();
    const placeholderOwners = new Set();
    const candidates = [focusPersonId, ...people.map(person => person.id).filter(id => id !== focusPersonId)];
    for (const id of candidates)
    {
        if (!roles.placeholderPersonIds?.has(id) ||
            1 - generations.get(id) > roles.ancestorGenerations) continue;
        const family = parentFamilies.get(id)?.[0];
        if (family && placeholderOwners.has(family.id)) continue;
        const presence = roles.parentPresenceByPerson?.get(id);
        const missing = [
            ! (presence ? presence.father : peopleById.has(family?.left)) && 'father',
            ! (presence ? presence.mother : peopleById.has(family?.right)) && 'mother'
        ].filter(Boolean);
        if (!missing.length) continue;
        if (family) placeholderOwners.add(family.id);
        const placeholders = missing.map(role =>
        {
            let key = id + '-' + role + '-test-placeholder';
            while (nodes.has(key)) key += ':';
            const node = {
                id: key, personId: id, rel: role, placeholder: true,
                label: role === 'father' ? 'Add father' : 'Add mother',
                generation: generations.get(id) - 1,
                width: treeParentPlaceholderWidth(missing.length),
                height: missing.length === 1 ? g.cardHeight : g.parentPlaceholderHeight
            };
            nodes.set(key, node);
            parentPlaceholders.push(node);
            return node;
        });
        parentPlaceholdersByPerson[id] = placeholders;
        if (family) placeholderFamilies.set(family.id, placeholders);
    }

    // Every compact partner unit is laid out as one variable-width tree node.
    const representatives = new Map([...nodes.keys()].map(id => [id, id]));
    function find(id)
    {
        let root = id;
        while (representatives.get(root) !== root) root = representatives.get(root);
        while (id !== root)
        {
            const next = representatives.get(id);
            representatives.set(id, root);
            id = next;
        }
        return root;
    }
    function join(a, b)
    {
        if (!nodes.has(a) || !nodes.has(b) || nodes.get(a).generation !== nodes.get(b).generation) return;
        representatives.set(find(b), find(a));
    }
    const ports = families.map(family =>
    {
        const placeholders = placeholderFamilies.get(family.id) || [];
        const left = nodes.has(family.left) ? family.left : placeholders.find(node => node.rel === 'father')?.id;
        const right = nodes.has(family.right) ? family.right : placeholders.find(node => node.rel === 'mother')?.id;
        join(left, right);
        return { id: family.id, parents: [left, right].filter(Boolean), children: family.children.filter(id => nodes.has(id)) };
    });
    for (const [id, placeholders] of Object.entries(parentPlaceholdersByPerson))
    {
        if (parentFamilies.has(id)) continue;
        const parents = placeholders.map(node => node.id);
        join(parents[0], parents[1]);
        ports.push({ id: 'missing-parents:' + id, parents, children: [id] });
    }

    const blocksByRoot = new Map();
    const blockById = new Map();
    for (const node of nodes.values())
    {
        const root = find(node.id);
        if (!blocksByRoot.has(root)) blocksByRoot.set(root, {
            id: root, generation: node.generation, members: [], parents: [], children: [], neighbors: []
        });
        const block = blocksByRoot.get(root);
        block.members.push(node);
        blockById.set(node.id, block);
    }
    const blocks = [...blocksByRoot.values()];
    // Honor explicit family left/right hints; no sex inference.
    for (const block of blocks)
    {
        const order = new Map(block.members.map((node, index) => [node.id, index]));
        const before = new Map(block.members.map(node => [node.id, new Set()]));
        for (const port of ports)
        {
            const [left, right] = port.parents;
            if (before.has(left) && before.has(right) && left !== right) before.get(right).add(left);
        }
        const remaining = new Set(block.members.map(node => node.id));
        const ordered = [];
        while (remaining.size)
        {
            const id = [...remaining].find(key => [...before.get(key)].every(dep => !remaining.has(dep)))
                || [...remaining].sort((a, b) => order.get(a) - order.get(b))[0];
            ordered.push(nodes.get(id));
            remaining.delete(id);
        }
        block.members = ordered;
        const gap = (a, b) => a.placeholder || b.placeholder ? g.parentPlaceholderGap : g.spouseGap;
        block.width = ordered.reduce((width, node, index) => width + node.width
            + (index ? gap(ordered[index - 1], node) : 0), 0);
        let x = -block.width / 2;
        block.offsets = new Map();
        for (let i = 0; i < ordered.length; i++)
        {
            const node = ordered[i];
            block.offsets.set(node.id, x + node.width / 2);
            x += node.width + (i + 1 < ordered.length ? gap(node, ordered[i + 1]) : 0);
        }
    }

    function addNeighbor(a, b, port)
    {
        if (!a || !b || a === b) return;
        if (!a.neighbors.some(edge => edge.block === b)) a.neighbors.push({ block: b, port });
    }
    function addEdge(parent, child, port, childId)
    {
        if (!parent || !child || parent === child) return;
        addNeighbor(parent, child, port);
        addNeighbor(child, parent, port);
        if (parent.generation !== child.generation - 1) return;
        if (!parent.children.some(edge => edge.block === child))
            parent.children.push({ block: child, port, childId });
        if (!child.parents.some(edge => edge.block === parent))
            child.parents.push({ block: parent, port, childId });
    }
    for (const port of ports)
    {
        const parents = [...new Set(port.parents.map(id => blockById.get(id)).filter(Boolean))];
        if (parents.length === 2)
        {
            addNeighbor(parents[0], parents[1], port);
            addNeighbor(parents[1], parents[0], port);
        }
        for (const childId of port.children)
            for (const parent of parents) addEdge(parent, blockById.get(childId), port, childId);
    }
    // Ancestor branches are ordered by their child's position in its couple.
    for (const block of blocks)
        block.parents.sort((a, b) => block.offsets.get(a.childId) - block.offsets.get(b.childId));

    const placed = new Map();
    const occupied = new Map();
    function hierarchy(rootBlock, direction, anchorId)
    {
        const seen = new Set([rootBlock]);
        const all = [];
        function build(block, parent, depth, incomingId)
        {
            const node = {
                block, parent, depth, anchor: block.offsets.get(incomingId) || 0
            };
            all.push(node);
            const children = [];
            for (const edge of block[direction])
            {
                if (seen.has(edge.block) || placed.has(edge.block)) continue;
                seen.add(edge.block);
                children.push(build(edge.block, node, depth + 1, direction === 'children' ? edge.childId : null));
            }
            if (children.length) node.children = children;
            return node;
        }
        const root = build(rootBlock, null, 0, anchorId);
        root.eachBefore = function(callback)
        {
            for (const node of all) callback(node);
            return this;
        };
        // Family Chart's central strategy: two independent tidy hierarchies
        // around the main person; adapt separation to actual family widths.
        treeTestTidy().nodeSize([1, 1]).separation((a, b) =>
            (a.block.width + b.block.width) / 2 + Math.abs(a.anchor - b.anchor)
            + (a.parent === b.parent ? g.siblingGap : g.subtreeGap))(root);
        return all.map(node => ({
            block: node.block,
            center: node.x - node.anchor
        }));
    }
    function place(plan, desired, preferredSide = 1)
    {
        const fresh = plan.filter(item => !placed.has(item.block));
        // A collateral branch moves as a unit. Compute its forbidden
        // translation intervals against occupied rows, not a per-card nudge.
        const forbidden = [];
        for (const item of fresh)
        {
            const half = item.block.width / 2;
            for (const other of occupied.get(item.block.generation) || [])
                forbidden.push([other.left - g.subtreeGap - item.center - half,
                    other.right + g.subtreeGap - item.center + half]);
        }
        forbidden.sort((a, b) => a[0] - b[0]);
        const merged = [];
        for (const interval of forbidden)
        {
            const last = merged[merged.length - 1];
            if (last && interval[0] < last[1]) last[1] = Math.max(last[1], interval[1]);
            else merged.push(interval);
        }
        let shift = desired;
        const blocking = merged.find(interval => shift > interval[0] && shift < interval[1]);
        if (blocking)
        {
            const [left, right] = blocking;
            shift = Math.abs(desired - left) === Math.abs(right - desired)
                ? (preferredSide < 0 ? left : right)
                : (Math.abs(desired - left) < Math.abs(right - desired) ? left : right);
        }
        for (const item of fresh)
        {
            const center = item.center + shift;
            placed.set(item.block, center);
            if (!occupied.has(item.block.generation)) occupied.set(item.block.generation, []);
            occupied.get(item.block.generation).push({
                left: center - item.block.width / 2, right: center + item.block.width / 2
            });
        }
    }

    const focus = blockById.get(focusPersonId);
    place(hierarchy(focus, 'parents'), 0);
    place(hierarchy(focus, 'children'), placed.get(focus));
    // The upstream demo's simple ancestor/progeny projection is not sufficient
    // for our visible collateral families. Keep them and their real links.
    while (placed.size < blocks.length)
    {
        let advanced = false;
        for (const [anchor, center] of placed)
        {
            const edge = anchor.neighbors.find(item => !placed.has(item.block));
            if (!edge) continue;
            const block = edge.block;
            const direction = block.generation < anchor.generation ? 'parents' : 'children';
            const parent = direction === 'children';
            const anchorIds = (parent ? edge.port.parents : edge.port.children).filter(id => blockById.get(id) === anchor);
            const desired = center + (anchorIds.length
                ? anchorIds.reduce((sum, id) => sum + anchor.offsets.get(id), 0) / anchorIds.length : 0);
            const childId = parent ? edge.port.children.find(id => blockById.get(id) === block) : null;
            const siblingIndex = anchor.children.findIndex(item => item.block === block);
            const placedSibling = anchor.children.findIndex(item => placed.has(item.block));
            place(hierarchy(block, direction, childId), desired,
                siblingIndex >= 0 && placedSibling >= 0 && siblingIndex < placedSibling ? -1 : 1);
            advanced = true;
            break;
        }
        if (!advanced) throw new Error('Test layout cannot attach a visible branch.');
    }

    const left = Math.min(...blocks.map(block => placed.get(block) - block.width / 2));
    const minGeneration = Math.min(...blocks.map(block => block.generation));
    for (const block of blocks)
    {
        for (const node of block.members)
        {
            const x = Math.round(g.paddingX - left + placed.get(block) + block.offsets.get(node.id) - node.width / 2);
            const y = g.paddingY + (node.generation - minGeneration) * g.generationPitch;
            Object.assign(node, {
                x, y, w: node.width, h: node.height, leftX: x, rightX: x + node.width,
                topY: y, bottomY: y + node.height, centerX: x + node.width / 2,
                centerY: y + node.height / 2, layoutX: x, layoutY: y
            });
            node.generation -= minGeneration;
        }
    }
    const positionedPeople = people.map(person => nodes.get(person.id));
    const positionedById = new Map(positionedPeople.map(person => [person.id, person]));
    const focusControls = positionedPeople.filter(person => roles.focusActionPersonIds?.has(person.id))
        .map(person => ({
            personId: person.id, canonicalPersonId: person.id,
            x: Math.round(person.rightX - g.focusControlWidth),
            y: Math.round(person.topY - g.focusControlHeight - g.focusControlGap),
            width: g.focusControlWidth, height: g.focusControlHeight
        }));
    const layout = {
        positionedPeople, positionedById, peopleById: Object.fromEntries(positionedById),
        families, familyAnchors: {}, parentPlaceholders, parentPlaceholdersByPerson, focusControls
    };
    // Same router and renderer as Classic; no call to the Classic solver.
    buildTreeConnectorDescriptors(layout, { arrangeBands: true });
    refreshTreeFamilyAnchors(families, positionedById, layout.familyAnchors);
    layout.connectorDescriptors = buildTreeConnectorDescriptors(layout);
    const right = Math.max(...[...nodes.values()].map(node => node.rightX),
        ...layout.connectorDescriptors.flatMap(edge => edge.points.map(point => point.x)));
    const bottom = Math.max(...[...nodes.values()].map(node => node.bottomY),
        ...layout.connectorDescriptors.flatMap(edge => edge.points.map(point => point.y)));
    layout.stageWidth = Math.max(g.minimumStageWidth, Math.ceil(right + g.paddingX));
    layout.stageHeight = Math.max(g.minimumStageHeight, Math.ceil(bottom + g.paddingY));
    layout.testIssues = validateTreeLayout(layout);

    // Every real family edge must be represented; counters or identity links
    // cannot connect otherwise detached groups. No repeated appearances yet.
    const connected = new Map(people.map(person => [person.id, new Set()]));
    function connect(a, b)
    {
        if (!connected.has(a) || !connected.has(b) || a === b) return;
        connected.get(a).add(b);
        connected.get(b).add(a);
    }
    for (const family of families)
    {
        const realParents = [family.left, family.right].filter(id => connected.has(id));
        const edges = layout.connectorDescriptors.filter(edge => edge.familyId === family.id);
        if (realParents.length === 2)
        {
            if (!edges.some(edge => edge.role === 'partner')) throw new Error('Test layout omitted a partner connection.');
            connect(...realParents);
        }
        for (const id of family.children)
        {
            if (!connected.has(id) || !realParents.length) continue;
            if (!edges.some(edge => edge.childId === id)) throw new Error('Test layout omitted a child connection.');
            for (const parent of realParents) connect(parent, id);
        }
    }
    const reached = new Set([focusPersonId]);
    for (const id of reached)
        for (const other of connected.get(id)) reached.add(other);
    if (reached.size !== people.length) throw new Error('Test layout rendered a disconnected branch.');
    return layout;
}
