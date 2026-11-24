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
    let layout = buildTestTreeLayout(people, sourceFamilies, focusPersonId, options);
    if (options.allowRepetition === false) return layout;

    // Start from the routed single-appearance graph. Only try genuine
    // shared-ancestor splits after an intersection; long rails alone do not qualify.
    let visualPeople = people;
    let visualFamilies = sourceFamilies;
    const crossingCount = candidate => candidate.testIssues.filter(issue => issue.type === 'edge-crossing').length;
    const issueCount = (candidate, type) => candidate.testIssues.filter(issue => issue.type === type).length;
    // Bound the extra routing work on dense trees.
    let remainingTrials = 24;
    for (let round = 0; round < 3 && crossingCount(layout) && remainingTrials > 0; round++)
    {
        const involvedFamilies = new Set(layout.testIssues
            .filter(issue => issue.type === 'edge-crossing')
            .flatMap(issue => [issue.leftFamilyId, issue.rightFamilyId]));
        const candidates = testTreeAncestorSplitCandidates(visualPeople, visualFamilies, focusPersonId, involvedFamilies);
        let best = null;
        for (const split of candidates)
        {
            if (remainingTrials <= 0) break;
            const { people: nextPeople, families: nextFamilies } = split;
            // Splitting a bridge would detach a household. Reject that
            // before the expensive layout; identity badges are not edges.
            if (!testTreeOccurrencesConnected(nextPeople, nextFamilies, focusPersonId)) continue;
            remainingTrials--;
            let candidate;
            try
            {
                candidate = buildTestTreeLayout(nextPeople, nextFamilies, focusPersonId, options);
            }
            catch (error)
            {
                // A failed experimental candidate must never replace the
                // connected baseline.
                continue;
            }
            if (crossingCount(candidate) >= crossingCount(layout)) continue;
            if (candidate.testIssues.some(issue => ['node-node', 'edge-node', 'missing-family-link'].includes(issue.type))) continue;
            const otherIssues = ['edge-overlap', 'ancestor-order', 'routing-lane', 'rail-clearance', 'focus-clearance', 'placeholder-width'];
            if (otherIssues.some(type => issueCount(candidate, type) > issueCount(layout, type))) continue;
            if (!best || crossingCount(candidate) < crossingCount(best.layout)
                || (crossingCount(candidate) === crossingCount(best.layout)
                    && candidate.testIssues.length < best.layout.testIssues.length))
            {
                best = { layout: candidate, people: nextPeople, families: nextFamilies };
            }
            if (!crossingCount(candidate)) break;
        }
        if (!best) break;
        layout = best.layout;
        visualPeople = best.people;
        visualFamilies = best.families;
    }
    const counts = new Map();
    for (const person of layout.positionedPeople)
    {
        const id = person.canonicalPersonId || person.id;
        counts.set(id, (counts.get(id) || 0) + 1);
    }
    for (const person of layout.positionedPeople)
    {
        const count = counts.get(person.canonicalPersonId || person.id);
        if (count > 1) person.occurrenceCount = count;
    }
    return layout;
}

// Identify genuine convergence of ancestry paths, rather than arbitrary
// people incident to crossing rails. Traverse real parent families from
// the focus and its visible partners. A shared ancestor has at least two
// distinct children on those paths; being someone's child and spouse is
// not sufficient. Never move a descendant's parent or partner membership.
function* testTreeAncestorSplitCandidates(people, families, focusPersonId, involvedFamilies)
{
    const byId = new Map(people.map(person => [person.id, person]));
    const parentFamilies = new Map();
    for (const family of families)
        for (const child of family.children || [])
        {
            if (!parentFamilies.has(child)) parentFamilies.set(child, []);
            parentFamilies.get(child).push(family);
        }
    const roots = new Set([focusPersonId]);
    for (const family of families)
        if ([family.left, family.right].includes(focusPersonId))
            for (const id of [family.left, family.right])
                if (byId.has(id)) roots.add(id);
    const ancestors = new Set(roots);
    for (const id of ancestors)
        for (const family of parentFamilies.get(id) || [])
            for (const parent of [family.left, family.right])
                if (byId.has(parent)) ancestors.add(parent);
    const branches = new Map();
    for (const family of families)
        for (const parent of [family.left, family.right])
        {
            if (!byId.has(parent) || roots.has(parent)) continue;
            for (const child of family.children || [])
            {
                if (!ancestors.has(child) || child === parent) continue;
                if (!branches.has(parent)) branches.set(parent, []);
                branches.get(parent).push({ family, child });
            }
        }
    const shared = [...branches].filter(([, links]) => new Set(links.map(link => link.child)).size >= 2);
    // Crossing-family incidence is a prioritization, not a requirement on
    // the ancestor's own connector: a crossing may be lower on its paths.
    shared.sort((a, b) => Number(b[1].some(link => involvedFamilies.has(link.family.id)))
        - Number(a[1].some(link => involvedFamilies.has(link.family.id))));
    for (const [id, links] of shared)
    {
        const person = byId.get(id);
        const canonicalId = person.canonicalPersonId || id;
        const ids = new Set(byId.keys());
        let suffix = 2;
        while (ids.has(canonicalId + '--test-occurrence-' + suffix)) suffix++;
        const occurrenceId = canonicalId + '--test-occurrence-' + suffix;
        const nextPeople = [...people, { ...person, id: occurrenceId, canonicalPersonId: canonicalId }];
        const choices = [...links].sort((a, b) => Number(involvedFamilies.has(b.family.id))
            - Number(involvedFamilies.has(a.family.id)));
        const seen = new Set();
        for (const { family, child } of choices)
        {
            // A visual family context may partition children of one canonical
            // family. Keep all real parent/child memberships and the other
            // parent, if known. No canonical family is created or changed.
            const childGroups = [[child], (family.children || []).slice()];
            for (const moving of childGroups)
            {
                const key = family.id + '|' + moving.join('|');
                if (seen.has(key)) continue;
                seen.add(key);
                const remaining = (family.children || []).filter(value => !moving.includes(value));
                const canonicalFamilyId = family.canonicalFamilyId || family.id;
                let familySuffix = 2;
                const familyIds = new Set(families.map(record => record.id));
                while (familyIds.has(canonicalFamilyId + '--test-family-' + familySuffix)) familySuffix++;
                const shifted = {
                    ...family,
                    left: family.left === id ? occurrenceId : family.left,
                    right: family.right === id ? occurrenceId : family.right,
                    children: moving
                };
                const nextFamilies = families.flatMap(record => record.id !== family.id ? [record]
                    : remaining.length ? [{ ...record, children: remaining }, {
                        ...shifted, id: canonicalFamilyId + '--test-family-' + familySuffix, canonicalFamilyId
                    }] : [shifted]);
                yield { people: nextPeople, families: nextFamilies };
            }
        }
    }
}

// Connectivity is evaluated on distinct occurrences, without identity edges.
// The routed builder independently checks that each real family membership
// has a connector before accepting the same graph.
function testTreeOccurrencesConnected(people, families, focusPersonId)
{
    const adjacency = new Map(people.map(person => [person.id, new Set()]));
    if (!adjacency.has(focusPersonId)) return false;
    for (const family of families)
    {
        const parents = [family.left, family.right].filter(id => adjacency.has(id));
        if (!parents.length) continue;
        for (const id of [...parents, ...(family.children || [])])
        {
            if (!adjacency.has(id) || id === parents[0]) continue;
            adjacency.get(parents[0]).add(id);
            adjacency.get(id).add(parents[0]);
        }
    }
    const reached = new Set([focusPersonId]);
    for (const id of reached)
        for (const other of adjacency.get(id)) reached.add(other);
    return reached.size === adjacency.size;
}

function buildTestTreeLayout(people, sourceFamilies, focusPersonId, options = {})
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
        // Order complete partnership components, not each person's spouses
        // independently. A path has an exact adjacency-preserving order.
        const pairs = ports.filter(port => port.parents.length === 2
            && port.parents.every(id => before.has(id)) && port.parents[0] !== port.parents[1]);
        const adjacency = new Map(ordered.map(node => [node.id, new Set()]));
        for (const port of pairs)
        {
            const [left, right] = port.parents;
            adjacency.get(left).add(right);
            adjacency.get(right).add(left);
        }
        if (ordered.length > 2)
        {
            // Prefer the junction on the focus's direct ancestry path.
            // Otherwise favor an interior edge over a leaf partnership.
            const priority = port => {
                const [left, right] = port.parents;
                return (port.children.includes(focusPersonId) ? 10000 : 0)
                    + (port.children.some(id => roles.directAncestorIds?.has(id)) ? 1000 : 0)
                    + (roles.directAncestorIds?.has(left) && roles.directAncestorIds?.has(right) ? 100 : 0)
                    + (adjacency.get(left).size > 1 && adjacency.get(right).size > 1 ? 10 : 0);
            };
            const main = pairs.slice().sort((a, b) => priority(b) - priority(a))[0];
            block.principalPort = main;
            const endpoints = ordered.filter(node => adjacency.get(node.id).size === 1);
            if (endpoints.length === 2 && ordered.every(node => adjacency.get(node.id).size <= 2))
            {
                const path = [];
                let previous = null;
                let current = endpoints[0].id;
                while (current && path.length < ordered.length)
                {
                    path.push(nodes.get(current));
                    const next = [...adjacency.get(current)].find(id => id !== previous);
                    previous = current;
                    current = next;
                }
                if (path.length === ordered.length)
                {
                    if (path.findIndex(node => node.id === main.parents[0]) >
                        path.findIndex(node => node.id === main.parents[1])) path.reverse();
                    ordered.splice(0, ordered.length, ...path);
                }
            }
            else if (main)
            {
                const [left, right] = main.parents;
                // Trees with degree > 2 cannot keep every pair adjacent.
                // For a single hub, distribute partners on both sides.
                // For linked hubs, keep the principal couple together and
                // put each hub's other branches outward on its own side.
                const visited = new Set([left, right]);
                function branch(id)
                {
                    if (visited.has(id)) return [];
                    visited.add(id);
                    return [nodes.get(id), ...[...adjacency.get(id)].flatMap(branch)];
                }
                const leftBranches = [...adjacency.get(left)].filter(id => id !== right).map(branch);
                const rightBranches = [...adjacency.get(right)].filter(id => id !== left).map(branch);
                let leftSide = leftBranches.flat();
                let rightSide = rightBranches.flat();
                if (adjacency.get(right).size === 1)
                {
                    leftSide = leftBranches.filter((_, i) => i % 2 === 0).flat();
                    rightSide = leftBranches.filter((_, i) => i % 2 === 1).flat();
                }
                else if (adjacency.get(left).size === 1)
                {
                    leftSide = rightBranches.filter((_, i) => i % 2 === 1).flat();
                    rightSide = rightBranches.filter((_, i) => i % 2 === 0).flat();
                }
                const sequence = [...leftSide.reverse(), nodes.get(left), nodes.get(right), ...rightSide];
                if (sequence.length === ordered.length) ordered.splice(0, ordered.length, ...sequence);
            }
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
    const extendedPartnerPorts = new Map();
    function buildExtendedPartnerPorts()
    {
        extendedPartnerPorts.clear();
        for (const block of blocks)
        {
            const pairs = ports.filter(port => port.parents.length === 2 && port.parents.every(id => blockById.get(id) === block));
            const degrees = new Map(block.members.map(node => [node.id, new Set()]));
            for (const port of pairs)
            {
                const [a, b] = port.parents;
                if (a !== b) { degrees.get(a).add(b); degrees.get(b).add(a); }
            }
            const spans = [];
            for (const port of pairs)
            {
                const [a, b] = port.parents;
                const ai = block.members.findIndex(node => node.id === a);
                const bi = block.members.findIndex(node => node.id === b);
                const adjacent = Math.abs(ai - bi) === 1;
                const explicitJunction = block.groupedJunctions?.get(port.id);
                if (adjacent && explicitJunction === undefined) continue;
                const leafId = degrees.get(a).size < degrees.get(b).size ? a : b;
                const hubId = leafId === a ? b : a;
                const leafIndex = block.members.findIndex(node => node.id === leafId);
                const side = Math.sign(block.offsets.get(hubId) - block.offsets.get(leafId));
                const leaf = nodes.get(leafId);
                const neighbor = block.members[leafIndex + side];
                const junction = (block.offsets.get(leafId) + side * leaf.width / 2
                    + block.offsets.get(neighbor.id) - side * neighbor.width / 2) / 2;
                spans.push({ port, hubId, leafId, junction: explicitJunction ?? junction, side,
                    adjacent, span: Math.abs(ai - bi) });
            }
            // Each extended partnership gets a horizontal lane INSIDE the
            // generation row. Nonoverlapping spans can share lanes; longer
            // spans run above shorter ones, but never above the card tops.
            spans.sort((a, b) => a.span - b.span);
            const lanes = [];
            for (const entry of spans)
            {
                const x1 = block.offsets.get(entry.hubId);
                const x2 = block.offsets.get(entry.leafId);
                const min = Math.min(x1, x2);
                const max = Math.max(x1, x2);
                if (entry.adjacent)
                {
                    entry.offsetY = 0;
                    extendedPartnerPorts.set(entry.port.id, entry);
                    continue;
                }
                let lane = 0;
                while ((lanes[lane] || []).some(other => min < other.max && max > other.min)) lane++;
                if (!lanes[lane]) lanes[lane] = [];
                lanes[lane].push({ min, max });
                entry.lane = lane;
                extendedPartnerPorts.set(entry.port.id, entry);
            }
            const step = Math.min(g.connectorLaneGap / 2,
                (Math.min(...block.members.map(node => node.height)) / 2 - g.connectorLaneGap / 2)
                / Math.max(1, lanes.length));
            for (const entry of spans.filter(item => !item.adjacent)) entry.offsetY = -(entry.lane + 1) * step;
        }
    }
    buildExtendedPartnerPorts();
    // Ancestor branches are ordered by their child's position in its couple.
    function junctionOffset(block, port)
    {
        const extended = extendedPartnerPorts.get(port.id);
        if (extended && blockById.get(extended.leafId) === block) return extended.junction;
        const offsets = port.parents.filter(id => blockById.get(id) === block)
            .map(id => block.offsets.get(id));
        return offsets.length ? offsets.reduce((sum, offset) => sum + offset, 0) / offsets.length : 0;
    }
    for (const block of blocks)
    {
        block.parents.sort((a, b) => block.offsets.get(a.childId) - block.offsets.get(b.childId));
        // Each household's children belong to its own family junction,
        // not the center of the combined multi-partner block.
        block.children.sort((a, b) => junctionOffset(block, a.port) - junctionOffset(block, b.port));
    }

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
                const child = build(edge.block, node, depth + 1, direction === 'children' ? edge.childId : null);
                child.port = edge.port;
                children.push(child);
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
        if (direction === 'children')
        {
            // The tidy layout centers all children on the same node. Refine
            // multiple households as whole subtrees, toward their own ports.
            // Keep the original sibling order and same-row footprint gaps.
            function collect(node, result)
            {
                result.add(node);
                for (const child of node.children || []) collect(child, result);
            }
            for (const node of all)
            {
                const groups = new Map();
                for (const child of node.children || [])
                {
                    if (!groups.has(child.port)) groups.set(child.port, []);
                    groups.get(child.port).push(child);
                }
                if (groups.size < 2 && node.block.members.length < 3) continue;
                for (const [port, children] of groups)
                {
                    const moving = new Set();
                    children.forEach(child => collect(child, moving));
                    const center = node.x - node.anchor + junctionOffset(node.block, port);
                    const attachments = children.map(child => child.x);
                    const desired = center - (Math.min(...attachments) + Math.max(...attachments)) / 2;
                    let low = -Infinity;
                    let high = Infinity;
                    for (const item of moving)
                    {
                        const x = item.x - item.anchor;
                        for (const other of all)
                        {
                            if (moving.has(other) || other.depth !== item.depth) continue;
                            const ox = other.x - other.anchor;
                            const clearance = (item.block.width + other.block.width) / 2
                                + (item.parent === other.parent ? g.siblingGap : g.subtreeGap);
                            if (ox < x) low = Math.max(low, ox + clearance - x);
                            else high = Math.min(high, ox - clearance - x);
                        }
                    }
                    if (low > high) continue;
                    const shift = Math.max(low, Math.min(high, desired));
                    for (const item of moving) item.x += shift;
                }
            }
        }
        return all.map(node => ({
            block: node.block,
            center: node.x - node.anchor
        }));
    }
    function place(plan, desired, preferredSide = 1, siblingBounds = null)
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
        if (siblingBounds)
        {
            // Keep ordered sibling households on their own sides even if
            // the closest unconstrained gap is across the central branch.
            const root = fresh[0];
            const min = siblingBounds.min - root.center;
            const max = siblingBounds.max - root.center;
            const ideal = Math.max(min, Math.min(max, desired));
            const choices = [ideal, ...merged.flatMap(interval => interval)]
                .filter(value => Number.isFinite(value) && value >= min && value <= max
                    && merged.every(interval => value <= interval[0] || value >= interval[1]))
                .sort((a, b) => Math.abs(a - desired) - Math.abs(b - desired)
                    || preferredSide * (b - a));
            // A reconvergent graph may leave no legal gap between already
            // placed siblings. Retain the existing connected fallback and
            // its geometry diagnostics in that case.
            if (choices.length) shift = choices[0];
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
            const desired = center + (parent && anchor.members.length > 2
                ? junctionOffset(anchor, edge.port)
                : anchorIds.length
                    ? anchorIds.reduce((sum, id) => sum + anchor.offsets.get(id), 0) / anchorIds.length : 0);
            const childId = parent ? edge.port.children.find(id => blockById.get(id) === block) : null;
            const siblingIndex = anchor.children.findIndex(item => item.block === block);
            const placedSibling = anchor.children.findIndex(item => placed.has(item.block));
            let siblingBounds = null;
            if (parent && anchor.members.length > 2 && siblingIndex >= 0)
            {
                let min = -Infinity;
                let max = Infinity;
                anchor.children.forEach((sibling, index) =>
                {
                    const other = sibling.block;
                    if (index === siblingIndex || !placed.has(other)) return;
                    const clearance = (block.width + other.width) / 2 + g.siblingGap;
                    if (index < siblingIndex) min = Math.max(min, placed.get(other) + clearance);
                    else max = Math.min(max, placed.get(other) - clearance);
                });
                siblingBounds = { min, max };
            }
            place(hierarchy(block, direction, childId), desired,
                siblingIndex >= 0 && placedSibling >= 0 && siblingIndex < placedSibling ? -1 : 1, siblingBounds);
            advanced = true;
            break;
        }
        if (!advanced) throw new Error('Test layout cannot attach a visible branch.');
    }

    // Independent household grouping. Plan complete descendant footprints
    // instead of making secondary partners follow a rigid equal-width row.
    // This is an atomic local layout: leave reconvergent/non-tree regions
    // to the existing graph solver, and never move a branch through another.
    let groupedHouseholds = false;
    if (options.groupHouseholds !== false)
    for (const block of blocks)
    {
        const principal = block.principalPort;
        if (!principal || block.members.length < 4 || block.members.some(node => node.placeholder)) continue;
        const mainIds = principal.parents.slice().sort((a, b) => block.offsets.get(a) - block.offsets.get(b));
        const mainIndex = block.members.findIndex(node => node.id === mainIds[0]);
        if (mainIndex < 1 || block.members[mainIndex + 1]?.id !== mainIds[1]
            || mainIndex + 2 >= block.members.length) continue;
        const ownPorts = ports.filter(port => port.parents.length === 2
            && port.parents.every(id => blockById.get(id) === block));
        // Linked hubs with leaf secondary partners on either side. General
        // partnership paths/cycles retain their existing ordering.
        const secondaries = block.members.filter(node => !mainIds.includes(node.id)).map(node => {
            const matches = ownPorts.filter(port => port.parents.includes(node.id));
            const side = block.offsets.get(node.id) < block.offsets.get(mainIds[0]) ? -1 : 1;
            const hubId = mainIds[side < 0 ? 0 : 1];
            return matches.length === 1 && matches[0].parents.includes(hubId)
                ? { node, port: matches[0], side } : null;
        });
        if (secondaries.some(item => !item) || ownPorts.length !== secondaries.length + 1
            || ownPorts.some(port => port.children.some(id => !block.children.some(edge =>
                edge.port === port && edge.childId === id)))) continue;
        if (!secondaries.some(item => item.port.children.length)) continue;
        // Do not detach a descendant who has other visible ancestry or
        // multiple incoming families. Each local block must be owned once.
        const owned = new Set();
        let valid = true;
        function extent(items)
        {
            return {
                left: Math.min(...items.map(item => item.center - item.block.width / 2)),
                right: Math.max(...items.map(item => item.center + item.block.width / 2))
            };
        }
        function packChildren(edges, parent)
        {
            const items = [];
            const attachments = [];
            let right = null;
            for (const edge of edges)
            {
                const child = edge.block;
                if (owned.has(child) || child === block || child.members.length > 2
                    || child.parents.length !== 1 || child.parents[0].block !== parent
                    || child.neighbors.some(link => link.block !== parent
                        && !child.children.some(other => other.block === link.block)))
                {
                    valid = false;
                    return null;
                }
                owned.add(child);
                const own = [{ block: child, center: 0 }];
                const descendants = packChildren(child.children, child);
                if (!descendants) return null;
                own.push(...descendants.items);
                const footprint = extent(own);
                const shift = right === null ? 0 : right + g.subtreeGap - footprint.left;
                own.forEach(item => items.push({ block: item.block, center: item.center + shift }));
                attachments.push(shift + (child.offsets.get(edge.childId) || 0));
                right = footprint.right + shift;
            }
            const center = attachments.length ? (attachments[0] + attachments.at(-1)) / 2 : 0;
            return { items: items.map(item => ({ ...item, center: item.center - center })) };
        }
        const byPort = new Map();
        for (const port of ownPorts)
        {
            const group = packChildren(block.children.filter(edge => edge.port === port), block);
            if (!group) break;
            byPort.set(port, group.items);
        }
        if (!valid || byPort.size !== ownPorts.length
            || block.children.some(edge => !owned.has(edge.block))) continue;

        // Preserve the principal couple's compact gap and current junction.
        const principalCenter = (block.offsets.get(mainIds[0]) + block.offsets.get(mainIds[1])) / 2;
        const origin = placed.get(block) + principalCenter;
        const offsets = new Map(mainIds.map(id => [id, block.offsets.get(id) - principalCenter]));
        const junctions = new Map();
        const planned = (byPort.get(principal) || []).map(item => ({ ...item }));
        const mainExtent = planned.length ? extent(planned) : { left: 0, right: 0 };
        let outerLeft = Math.min(mainExtent.left, offsets.get(mainIds[0]) - nodes.get(mainIds[0]).width / 2);
        let outerRight = Math.max(mainExtent.right, offsets.get(mainIds[1]) + nodes.get(mainIds[1]).width / 2);
        for (const side of [-1, 1])
        {
            const partners = secondaries.filter(item => item.side === side)
                .sort((a, b) => side * (block.offsets.get(a.node.id) - block.offsets.get(b.node.id)));
            for (const { node, port } of partners)
            {
                // The child junction sits just inside the gap facing the
                // principal hub, rather than at the middle of a long rail.
                const junctionDelta = -side * (node.width / 2 + g.spouseGap / 2);
                const children = byPort.get(port).map(item => ({ ...item, center: item.center + junctionDelta }));
                const footprint = children.length ? extent(children) : { left: 0, right: 0 };
                const low = Math.min(-node.width / 2, footprint.left);
                const high = Math.max(node.width / 2, footprint.right);
                const center = side < 0 ? outerLeft - g.subtreeGap - high : outerRight + g.subtreeGap - low;
                offsets.set(node.id, center);
                junctions.set(port.id, center + junctionDelta);
                planned.push(...children.map(item => ({ ...item, center: item.center + center })));
                if (side < 0) outerLeft = center + low;
                else outerRight = center + high;
            }
        }
        const min = Math.min(...block.members.map(node => offsets.get(node.id) - node.width / 2));
        const max = Math.max(...block.members.map(node => offsets.get(node.id) + node.width / 2));
        const width = max - min;
        const recenter = (min + max) / 2;
        // Include the old neighboring regions in the clearance check.
        // No partial update is allowed if this independent plan conflicts.
        const proposed = new Map(planned.map(item => [item.block, origin + item.center]));
        proposed.set(block, origin + recenter);
        let collision = false;
        for (const [item, center] of proposed)
        {
            const half = (item === block ? width : item.width) / 2;
            for (const other of blocks)
            {
                if (other === item || other.generation !== item.generation) continue;
                const otherCenter = proposed.get(other) ?? placed.get(other);
                const otherHalf = (other === block ? width : other.width) / 2;
                if (Math.abs(center - otherCenter) < half + otherHalf + g.siblingGap - 0.01)
                { collision = true; break; }
            }
            if (collision) break;
        }
        if (collision) continue;
        block.width = width;
        block.offsets = new Map([...offsets].map(([id, offset]) => [id, offset - recenter]));
        block.groupedJunctions = new Map([...junctions].map(([id, offset]) => [id, offset - recenter]));
        proposed.forEach((center, item) => placed.set(item, center));
        groupedHouseholds = true;
    }
    if (groupedHouseholds) buildExtendedPartnerPorts();

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
    const focusControls = positionedPeople.filter(person => roles.focusActionPersonIds?.has(person.canonicalPersonId || person.id))
        .map(person => ({
            personId: person.id, canonicalPersonId: person.canonicalPersonId || person.id,
            x: Math.round(person.rightX - g.focusControlWidth),
            y: Math.round(person.topY - g.focusControlHeight - g.focusControlGap),
            width: g.focusControlWidth, height: g.focusControlHeight
        }));
    const testPartnerRoutes = new Map();
    for (const [familyId, entry] of extendedPartnerPorts)
    {
        const leaf = nodes.get(entry.leafId);
        const hub = nodes.get(entry.hubId);
        const center = leaf.centerX - blockById.get(leaf.id).offsets.get(leaf.id);
        testPartnerRoutes.set(familyId, {
            hubId: hub.id, leafId: leaf.id,
            junctionX: Math.round(center + entry.junction), offsetY: entry.offsetY
        });
    }
    const layout = {
        testPartnerRoutes,
        ...(groupedHouseholds ? { groupedHouseholds: true } : {}),
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
    if (groupedHouseholds && layout.testIssues.length)
    {
        const ordinary = buildTestTreeLayout(people, sourceFamilies, focusPersonId, { ...options, groupHouseholds: false });
        const issueTypes = new Set(layout.testIssues.map(issue => issue.type));
        if ([...issueTypes].some(type => layout.testIssues.filter(issue => issue.type === type).length
            > ordinary.testIssues.filter(issue => issue.type === type).length)) return ordinary;
    }

    // Every real family edge must be represented; counters or identity links
    // cannot connect otherwise detached groups. Check actual routed edges.
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
