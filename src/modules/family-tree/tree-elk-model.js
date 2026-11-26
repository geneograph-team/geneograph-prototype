// Ported from the approved standalone ELK and automatic-occurrence experiments.
function projectElkTreeOccurrences(canonicalPeople, canonicalFamilies, preferences = new Map(), focusId = null)
{
    const byId = new Map(canonicalPeople.map((p, i) => [p.id,
    {
        person: p,
        index: i
    }]));
    const familyIds = new Set(canonicalFamilies.map(f => f.id));
    if (byId.size !== canonicalPeople.length || familyIds.size !== canonicalFamilies.length || [...familyIds].some(id => byId.has(id))) throw Error('Duplicate model IDs');
    const outgoing = new Map(canonicalPeople.map(p => [p.id, new Set()]));
    const parentFamilies = new Map(canonicalPeople.map(p => [p.id, []]));
    const households = new Map(canonicalPeople.map(p => [p.id, []]));
    for (const f of canonicalFamilies)
    {
        if (!f.parents.length || f.parents.length > 2 || new Set(f.parents).size !== f.parents.length || new Set(f.children).size !== f.children.length) throw Error('Invalid family: ' + f.id);
        for (const id of [...f.parents, ...f.children])
            if (!byId.has(id)) throw Error('Unknown canonical person: ' + id);
        for (const id of f.children) parentFamilies.get(id).push(f.id);
        for (const id of f.parents)
        {
            households.get(id).push(f);
            for (const child of f.children) outgoing.get(id).add(child);
        }
    }
    // Intersect downstream reachability sets to find the visible roots that
    // would reach both contexts in an upstream walk. Memoization also rejects cycles.
    const descendants = new Map(),
        visiting = new Set();

    function reachable(id)
    {
        if (descendants.has(id)) return descendants.get(id);
        if (visiting.has(id)) throw Error('Ancestry cycle at ' + id);
        visiting.add(id);
        const result = new Set([id]);
        for (const child of outgoing.get(id))
            for (const next of reachable(child)) result.add(next);
        visiting.delete(id);
        descendants.set(id, result);
        return result;
    }
    for (const p of canonicalPeople) reachable(p.id);
    const overlaps = (a, b) => [...a].some(id => b.has(id));
    const visualFamilies = [];
    const deferred = [];
    const unrelatedBranches = (a, b) => !reachable(a).has(b) && !reachable(b).has(a);
    for (const family of canonicalFamilies)
    {
        // A child that is itself on a sibling's descendant path is ambiguous.
        // Keep the canonical family whole rather than unfolding that overlap.
        const ordered = [...family.children].sort();
        const overlap = ordered.some((child, index) => ordered.slice(index + 1)
            .some(other => !unrelatedBranches(child, other)));
        const ambiguousParents = family.parents.filter(parent => households.get(parent).some(other =>
            other !== family && other.children.some(child => family.children.includes(child))
            && JSON.stringify([...other.parents].sort()) !== JSON.stringify([...family.parents].sort())));
        const buckets = [];
        if (!overlap && !ambiguousParents.length)
        {
            for (const child of ordered)
            {
                let bucket = buckets.find(group => group.every(other => !overlaps(reachable(child), reachable(other))));
                if (!bucket) { bucket = []; buckets.push(bucket); }
                bucket.push(child);
            }
        }
        else if (ordered.length > 1)
        {
            deferred.push({ familyId: family.id, reason: 'Overlapping sibling or alternative parent contexts; retained without splitting' });
        }
        if (buckets.length < 2)
        {
            visualFamilies.push({ ...family, canonicalFamilyId: family.id, familyOccurrenceId: family.id });
            continue;
        }
        for (const children of buckets)
        {
            // Anchor the key to a reconverging branch rather than an ordinary
            // sibling that may enter or leave this visible group.
            const anchor = children.find(child => ordered.some(other =>
                !children.includes(other) && overlaps(reachable(child), reachable(other))));
            const key = 'elk-family-occurrence:' + JSON.stringify([family.id, anchor]);
            visualFamilies.push({ ...family, id: key, canonicalFamilyId: family.id, familyOccurrenceId: key,
                splitSiblings: true, children: family.children.filter(id => children.includes(id)) });
        }
    }
    for (const list of households.values()) list.length = 0;
    for (const family of visualFamilies)
        for (const parent of family.parents) households.get(parent).push(family);

    const owners = new Map();
    const overrides = new Map(),
        decisions = [],
        entries = [];
    const usedIds = new Set([...byId.keys(), ...visualFamilies.map(family => family.id)]);

    function freshId(personId, familyId)
    {
        const base = 'occ-' + encodeURIComponent(personId) + '-' + encodeURIComponent(familyId);
        let id = base,
            n = 1;
        while (usedIds.has(id)) id = base + '-' + (++n);
        usedIds.add(id);
        return id;
    }
    for (const p of canonicalPeople)
    {
        const position = byId.get(p.id).index;
        // Multiple records with the same partner stay together. Treat them as one
        // co-parent context for duplicate detection but preserve each family ID.
        const contexts = new Map();
        for (const f of households.get(p.id))
        {
            const peer = f.parents.find(id => id !== p.id) ?? null;
            const contextId = f.splitSiblings || peer === null ? f.familyOccurrenceId : peer;
            if (!contexts.has(contextId)) contexts.set(contextId,
            {
                peer,
                contextId,
                families: [],
                children: new Set(),
                descendants: new Set()
            });
            const c = contexts.get(contextId);
            c.families.push(f);
            for (const id of f.children)
            {
                c.children.add(id);
                for (const d of reachable(id)) c.descendants.add(d);
            }
        }
        const parts = [...contexts.values()].sort((a, b) => a.contextId.localeCompare(b.contextId)),
            conflicts = new Map(parts.map(c => [c, new Set()])),
            evidence = [];
        let ambiguous = false;
        for (let i = 0; i < parts.length; i++)
            for (const b of parts.slice(i + 1))
            {
                const a = parts[i];
                if (!overlaps(a.descendants, b.descendants)) continue;
                // Shared immediate children indicate alternative parent records, not the
                // independent ancestral branches this policy is designed to unfold.
                if (overlaps(a.children, b.children) || overlaps(a.children, b.descendants) || overlaps(b.children, a.descendants))
                {
                    ambiguous = true;
                    continue;
                }
                conflicts.get(a).add(b);
                conflicts.get(b).add(a);
                evidence.push(
                {
                    families: [a.families.map(f => f.id), b.families.map(f => f.id)],
                    commonDescendants: [...a.descendants].filter(id => b.descendants.has(id)).sort()
                });
            }
        // A split family provides explicit branch ownership even if an
        // unrelated alternative household also needs a separate diagnosis.
        const siblingSplit = parts.some(context => context.families.some(family => family.splitSiblings));
        if (ambiguous)
        {
            deferred.push({
                personId: p.id,
                reason: 'Overlapping or incomplete co-parent contexts; retained without splitting',
                evidence
            });
        }
        if (!evidence.length || (ambiguous && !siblingSplit))
        {
            entries.push(
            {
                person:
                {
                    ...p,
                    personId: p.id,
                    occurrenceId: p.id,
                    primary: true,
                    occurrenceCount: 1,
                    contextFamilyIds: [...new Set(households.get(p.id).map(family => family.canonicalFamilyId))].sort()
                },
                position
            });
            continue;
        }
        // Partition conflicting partner contexts into distinct visual appearances.
        // Greedy deterministic coloring is sufficient for this bounded experiment;
        // compatible/unrelated partnerships stay together rather than multiplying cards.
        const buckets = [];
        for (const c of parts)
        {
            let bucket = buckets.find(b => b.every(other => !conflicts.get(c).has(other)));
            if (!bucket)
            {
                bucket = [];
                buckets.push(bucket);
            }
            bucket.push(c);
        }
        // Preserve the original record's relative input order at the nearest
        // co-parent context; insert other occurrences beside their own co-parent.
        // This is input ordering only, never a screen-coordinate constraint.
        const anchor = b => b.filter(c => c.peer !== null).map(c => byId.get(c.peer).index).sort((a, z) => Math.abs(a - position) - Math.abs(z - position) || a - z)[0] ?? position;
        const ranked = [...buckets].sort((a, b) => Math.abs(anchor(a) - position) - Math.abs(anchor(b) - position) || anchor(a) - anchor(b));
        const original = ranked[0];
        const appearances = [];
        const hasParents = parentFamilies.get(p.id).length > 0;
        const preferred = preferences.get(p.id);
        const exactBucket = buckets.find(bucket => bucket.some(context => context.contextId === preferred));
        const legacyBuckets = buckets.filter(bucket => bucket.some(context => context.peer === preferred));
        const preferredBucket = exactBucket || (legacyBuckets.length === 1 ? legacyBuckets[0] : null);
        const expandedBucket = preferredBucket || original;
        for (const bucket of buckets)
        {
            const fs = bucket.flatMap(context => context.families);
            const familyIds = fs.map(family => family.id).sort();
            const contextKey = JSON.stringify(bucket.filter(context => conflicts.get(context).size > 0)
                .map(context => context.contextId).sort());
            const anchorContext = bucket.find(context => conflicts.get(context).size > 0);
            const occurrenceId = 'elk-occurrence:' + JSON.stringify([p.id, contextKey]);
            const id = bucket === original ? p.id : freshId(p.id, familyIds[0]);
            if (bucket === expandedBucket) owners.set(p.id, id);
            entries.push(
            {
                person:
                {
                    ...p,
                    id,
                    personId: p.id,
                    occurrenceId,
                    primary: bucket === original,
                    occurrenceCount: buckets.length,
                    contextKey,
                    contextFamilyIds: [...new Set(fs.map(family => family.canonicalFamilyId))].sort(),
                    contextFamilyOccurrenceIds: familyIds,
                    hasParents,
                    expanded: hasParents && bucket === expandedBucket,
                    preferredPeer: anchorContext?.peer,
                    preferredContext: anchorContext?.contextId,
                    contextRoots: [...new Set(evidence.filter(item => item.families.some(group =>
                        group.some(familyId => familyIds.includes(familyId)))).flatMap(item => item.commonDescendants))].sort()
                },
                position: bucket === original ? position : anchor(bucket) + .5
            });
            appearances.push(
            {
                occurrenceId,
                familyIds,
                contextKey
            });
            for (const f of fs)
            {
                if (!overrides.has(f.id)) overrides.set(f.id, new Map());
                overrides.get(f.id).set(p.id, id);
            }
        }
        decisions.push(
        {
            personId: p.id,
            reason: 'Distinct child branches reconverge in ancestry',
            evidence,
            appearances
        });
    }
    entries.sort((a, b) => a.position - b.position || a.person.id.localeCompare(b.person.id));
    const people = entries.map(e => e.person);
    const families = visualFamilies.map(f => (
    {
        ...f,
        parents: f.parents.map(id => overrides.get(f.id)?.get(id) ?? id),
        children: f.children.map(id => owners.get(id) ?? id)
    }));
    separateElkGenerationConflicts(people, families, focusId, freshId);
    const canonicalByOccurrence = new Map(people.map(person => [person.id, person.personId]));
    const canonicalByFamily = new Map(canonicalFamilies.map(family => [family.id, family]));
    const memberships = new Map(canonicalFamilies.map(family => [family.id, new Set(family.children)]));
    for (const family of families)
    {
        const canonical = canonicalByFamily.get(family.canonicalFamilyId);
        const remaining = memberships.get(canonical.id);
        if (family.parents.some((id, index) => canonicalByOccurrence.get(id) !== canonical.parents[index])
            || family.children.some(id => !remaining.delete(canonicalByOccurrence.get(id))))
            throw Error('Family identity lost: ' + canonical.id);
    }
    if ([...memberships.values()].some(children => children.size))
        throw Error('Missing family child membership');
    return {
        people,
        families,
        decisions,
        deferred
    };
}

function separateElkGenerationConflicts(people, families, focusId, freshId)
{
    const focus = people.find(person => person.primary && person.personId === focusId);
    if (!focus) return;

    const byId = new Map(people.map(person => [person.id, person]));
    const memberships = new Map(people.map(person => [person.id, []]));
    for (const family of families)
        for (const [ids, offset] of [[family.parents, 0], [family.children, 1]])
            ids.forEach(id => memberships.get(id).push({ family, offset }));

    const queue = [focus.id];
    const rows = new Map([[focus.id, 0]]);
    const visitedFamilies = new Set();
    const copies = new Map();
    const affected = new Set();
    // Each household gets its row from the first path that reaches it. Keep that
    // path attached and give incompatible endpoints an appearance on the new row.
    for (const id of queue)
        for (const { family, offset } of memberships.get(id))
        {
            if (visitedFamilies.has(family)) continue;
            visitedFamilies.add(family);
            const parentRow = rows.get(id) - offset;
            for (const [ids, row] of [[family.parents, parentRow], [family.children, parentRow + 1]])
                for (let index = 0; index < ids.length; index++)
                {
                    const endpoint = ids[index];
                    if (!rows.has(endpoint))
                    {
                        rows.set(endpoint, row);
                        queue.push(endpoint);
                    }
                    if (rows.get(endpoint) === row) continue;
                    if (!copies.has(endpoint)) copies.set(endpoint, new Map());
                    const appearances = copies.get(endpoint);
                    if (!appearances.has(row))
                    {
                        const person = byId.get(endpoint);
                        const contextKey = JSON.stringify(['generation', person.occurrenceId, family.familyOccurrenceId]);
                        const copy = {
                            ...person,
                            id: freshId(person.personId, contextKey),
                            occurrenceId: 'elk-occurrence:' + contextKey,
                            contextKey,
                            primary: false,
                            preferredPeer: undefined,
                            preferredContext: undefined
                        };
                        appearances.set(row, copy);
                        people.push(copy);
                        affected.add(person.personId);
                    }
                    ids[index] = appearances.get(row).id;
                }
        }

    if (!affected.size) return;
    const counts = new Map();
    const appearances = new Map();
    for (const person of people)
        if (affected.has(person.personId))
        {
            counts.set(person.personId, (counts.get(person.personId) ?? 0) + 1);
            appearances.set(person.id, { parents: false, families: [] });
        }
    for (const family of families)
    {
        for (const id of family.children)
            if (appearances.has(id)) appearances.get(id).parents = true;
        for (const id of family.parents)
            appearances.get(id)?.families.push(family);
    }
    const withParents = new Set(people.filter(person => appearances.get(person.id)?.parents)
        .map(person => person.personId));
    for (const person of people)
    {
        const appearance = appearances.get(person.id);
        if (!appearance) continue;
        person.occurrenceCount = counts.get(person.personId);
        person.hasParents = withParents.has(person.personId);
        person.expanded = appearance.parents;
        person.contextFamilyIds = [...new Set(appearance.families.map(family => family.canonicalFamilyId))].sort();
        person.contextFamilyOccurrenceIds = appearance.families.map(family => family.familyOccurrenceId).sort();
    }
}

async function solveElkTree(people, families, direction, calculate, focusId = null, measure = (_, fn) => fn())
{
    const nominalPartnerGap = TREE_GEOMETRY.partnerGap;
    const secondarySpacing = 80;
    const JUNCTION = 12;
    const EPS = .02;
    const peopleById = new Map(people.map(person => [person.id, person]));
    const familyById = new Map(families.map(family => [family.id, family]));

    function partnershipGroups()
    {
        const partners = new Map(people.map(p => [p.id, new Set()]));
        for (const f of families)
            for (const a of f.parents)
                for (const b of f.parents)
                    if (a !== b) partners.get(a).add(b);
        const seen = new Set(),
            groups = [],
            owner = new Map();
        for (const p of people)
        {
            if (seen.has(p.id)) continue;
            const members = [p.id];
            seen.add(p.id);
            for (const id of members)
                for (const peer of partners.get(id))
                    if (!seen.has(peer))
                    {
                        seen.add(peer);
                        members.push(peer);
                    }
            const group = {
                id: 'group:' + p.id,
                members,
                generation: p.generation
            };
            for (const id of members)
            {
                if (peopleById.get(id).generation !== group.generation) throw Error('Incompatible generation in partnership group');
                owner.set(id, group.id);
            }
            groups.push(group);
        }
        return {
            groups,
            owner
        };
    }
    // Shared native layout settings for the root and its compound groups.
    const placementOptions = Object.freeze(
    {
        'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
        'elk.layered.nodePlacement.bk.fixedAlignment': 'BALANCED',
        'elk.layered.crossingMinimization.hierarchicalSweepiness': '-1'
    });
    // Rank the visible occurrences relative to the focus, not canonical identities.
    const parentFamilies = new Map(people.map(person => [person.id, []]));
    const memberships = new Map(people.map(person => [person.id, []]));
    for (const family of families)
    {
        for (const child of family.children) parentFamilies.get(child).push(family);
        for (const id of [...family.parents, ...family.children]) memberships.get(id).push(family);
    }
    const direct = new Set(), ancestryOrder = new Map(), distance = new Map();
    if (peopleById.has(focusId))
    {
        const ancestors = [focusId], seen = new Set(ancestors);
        for (const id of ancestors)
            for (const family of parentFamilies.get(id))
            {
                direct.add(family.id);
                for (const parent of family.parents)
                    if (!seen.has(parent))
                    {
                        seen.add(parent);
                        ancestors.push(parent);
                    }
            }
        const queue = [focusId], visitedFamilies = new Set();
        distance.set(focusId, 0);
        for (const id of queue)
            for (const family of memberships.get(id))
            {
                if (visitedFamilies.has(family.id)) continue;
                visitedFamilies.add(family.id);
                for (const peer of [...family.parents, ...family.children])
                    if (!distance.has(peer))
                    {
                        distance.set(peer, distance.get(id) + 1);
                        queue.push(peer);
                    }
            }
        function visit(id)
        {
            if (ancestryOrder.has(id)) return;
            ancestryOrder.set(id, ancestryOrder.size);
            for (const family of parentFamilies.get(id))
                for (const parent of elkOrderedPartners(family.parents, peopleById) || family.parents)
                    visit(parent);
        }
        visit(focusId);
    }
    const familyDistance = family => Math.min(...family.parents.map(id => distance.get(id) ?? Infinity));
    // One principal pair per connected group. Prefer direct ancestral households,
    // then proximity to the focus and visible children; stable input order breaks ties.
    // Without a supplied focus (standalone fixtures), retain the stable degree-based choice.
    function primaryPartnerships(groups)
    {
        const result = [];
        for (const group of groups)
        {
            const fs = families.filter(f => f.parents.length === 2 && f.parents.every(id => group.members.includes(id)));
            const counts = group.members.map(id => (
            {
                id,
                count: fs.filter(f => f.parents.includes(id)).length
            }));
            counts.sort((a, b) => b.count - a.count);
            if (!counts.length || !counts[0].count) continue;
            const primary = distance.size
                ? fs.slice().sort((a, b) => Number(direct.has(b.id)) - Number(direct.has(a.id))
                    || familyDistance(a) - familyDistance(b)
                    || Number(b.children.length > 0) - Number(a.children.length > 0))[0]
                : fs.find(f => f.parents.includes(counts[0].id));
            const anchor = counts.find(entry => primary.parents.includes(entry.id)).id;
            const secondary = fs.filter(f => f.id !== primary.id && f.parents.includes(anchor));
            result.push(
            {
                group: group.id,
                anchor,
                primary: primary.id,
                primaryPeople: [...primary.parents],
                orderedPeople: elkOrderedPartners(primary.parents, peopleById),
                secondary: secondary.map(f => f.id),
                secondaryPeople: [...new Set(secondary.flatMap(f => f.parents.filter(id => id !== anchor && !primary.parents.includes(id))))]
            });
        }
        return result;
    }

    function buildGraph(dynamicSpacings = null)
    {
        const
        {
            groups,
            owner
        } = partnershipGroups();
        const primaryPairs = primaryPartnerships(groups);
        const incoming = direction === 'DOWN' ? 'NORTH' : 'WEST',
            outgoing = direction === 'DOWN' ? 'SOUTH' : 'EAST';
        const options = {
            'elk.algorithm': 'layered',
            // Prefer model order at the root only; compound scopes fail in ELK 0.12.1.
            'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
            'elk.direction': direction,
            'elk.edgeRouting': 'ORTHOGONAL',
            'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
            'elk.json.shapeCoords': 'PARENT',
            'elk.json.edgeCoords': 'PARENT',
            'elk.partitioning.activate': 'true',
            'elk.layered.mergeHierarchyEdges': 'false',
            'elk.layered.mergeEdges': 'false',
            'elk.spacing.nodeNode': String(nominalPartnerGap),
            'elk.layered.spacing.nodeNodeBetweenLayers': '52',
            'elk.spacing.edgeNode': '14',
            'elk.layered.spacing.edgeNodeBetweenLayers': '14',
            'elk.layered.spacing.edgeEdgeBetweenLayers': '14',
            'elk.spacing.edgeEdge': '10',
            'elk.padding': '[top=64,left=48,bottom=64,right=48]',
            'elk.randomSeed': '1',
            ...placementOptions
        };
        const graph = {
            id: 'root',
            layoutOptions:
            {
                ...options
            },
            children: [],
            edges: []
        };
        const nodes = new Map(),
            containers = new Map(),
            edgeInfo = new Map(),
            portOwner = new Map();
        const partition = n => ({ 'elk.partitioning.partition': String(n) });

        function leaf(id, w, h, part)
        {
            const node = {
                id,
                width: w,
                height: h,
                layoutOptions:
                {
                    ...partition(part),
                    'elk.portConstraints': 'FIXED_SIDE'
                },
                ports: []
            };
            nodes.set(id, node);
            return node;
        }
        for (const group of groups)
        {
            // INCLUDE_CHILDREN is inherited throughout.
            const node = {
                id: group.id,
                children: [],
                edges: [],
                layoutOptions:
                {
                    ...partition(group.generation),
                    'elk.partitioning.activate': 'true',
                    'elk.padding': '[top=18,left=18,bottom=18,right=18]',
                    ...placementOptions
                }
            };
            graph.children.push(node);
            containers.set(group.id, node);
        }
        for (const p of people)
        {
            const node = leaf(p.id, p.width, p.height, 0);
            containers.get(owner.get(p.id)).children.push(node);
        }
        for (const f of families)
        {
            const node = leaf(f.id, JUNCTION, JUNCTION, 1);
            owner.set(f.id, owner.get(f.parents[0]));
            containers.get(owner.get(f.id)).children.push(node);
        }

        function port(nodeId, id, side, index)
        {
            const node = nodes.get(nodeId);
            if (!node.ports.some(p => p.id === id))
            {
                node.ports.push(
                {
                    id,
                    width: 0,
                    height: 0,
                    layoutOptions:
                    {
                        'elk.port.side': side,
                        ...(index == null ? {} : { 'elk.port.index': String(index) })
                    }
                });
                portOwner.set(id, nodeId);
            }
            return id;
        }

        function edge(f, role, person, source, target)
        {
            const id = f.id + ':' + role + ':' + person;
            const sourceGroup = owner.get(portOwner.get(source)),
                targetGroup = owner.get(portOwner.get(target));
            // Define every edge in its actual containing graph, so its local ELK
            // coordinates can be translated to the root without changing geometry.
            const container = sourceGroup === targetGroup ? containers.get(sourceGroup) : graph;
            container.edges.push(
            {
                id,
                sources: [source],
                targets: [target]
            });
            edgeInfo.set(id,
            {
                familyId: f.id,
                role,
                person,
                source,
                target,
                sourceNode: portOwner.get(source),
                targetNode: portOwner.get(target)
            });
        }
        const ordered = new Map(primaryPairs.filter(pair => pair.orderedPeople).map(pair => [pair.primary, pair.orderedPeople]));
        for (const f of families)
            if (f.parents.some(id => peopleById.get(id).placeholder))
            {
                const order = elkOrderedPartners(f.parents, peopleById);
                if (order) ordered.set(f.id, order);
            }
        for (const f of families)
        {
            const order = ordered.get(f.id);
            // ELK numbers fixed ports clockwise. North runs left to right;
            // west runs bottom to top. Fixed port order expresses the preferred card order.
            if (order) nodes.get(f.id).layoutOptions['elk.portConstraints'] = 'FIXED_ORDER';
            const join = order ? null : port(f.id, f.id + ':parents', incoming);
            const descendants = port(f.id, f.id + ':children', outgoing, order ? (direction === 'DOWN' ? 2 : 0) : null);
            for (const parent of f.parents)
            {
                const index = order?.indexOf(parent);
                const target = join || port(f.id, f.id + ':parents:' + parent, incoming,
                    direction === 'DOWN' ? index : 2 - index);
                edge(f, 'parent', parent, port(parent, parent + ':out:' + f.id, outgoing), target);
            }
            for (const child of f.children) edge(f, 'child', child, descendants, port(child, child + ':in:' + f.id, incoming));
        }
        // Per-element minimum node spacing: this is not a flexible maximum or
        // guaranteed descendant alignment. Test the documented IndividualSpacings string.
        const partnered = new Set(families.filter(family => family.parents.length === 2).flatMap(family => family.parents));
        for (const person of people)
        {
            const minimum = Math.max(partnered.has(person.id) ? nominalPartnerGap : 0,
                direction === 'RIGHT' ? person.focusClearance || 0 : 0);
            if (minimum) nodes.get(person.id).layoutOptions['elk.spacing.individual'] = 'spacing.nodeNode:' + minimum;
        }
        for (const pair of primaryPairs)
            for (const id of pair.secondaryPeople)
            {
                const spacing = dynamicSpacings?.get(id) ?? secondarySpacing;
                if (!Number.isFinite(spacing) || spacing < secondarySpacing || spacing > secondarySpacing + 600) throw Error('Invalid dynamic spacing: ' + id);
                nodes.get(id).layoutOptions['elk.spacing.individual'] = 'spacing.nodeNode:' + spacing;
            }
        // Stable topological preference for principal partner and parent-slot order.
        // This only changes ELK input order, never record order or card positions.
        for (const group of graph.children)
        {
            const members = group.children.filter(node => peopleById.has(node.id)).map(node => node.id);
            const constraints = [...ordered.values()].filter(ids => ids.every(id => members.includes(id)));
            const remaining = [...members], sorted = [];
            while (remaining.length)
            {
                const index = remaining.findIndex(id => !constraints.some(([a, b]) => b === id && remaining.includes(a)));
                if (index < 0) break; // Leave conflicting constraints for the existing diagnostics.
                sorted.push(remaining.splice(index, 1)[0]);
            }
            const rank = new Map([...sorted, ...remaining].map((id, i) => [id, i]));
            // Orient the junction order of a simple partnership path around its
            // principal pair. Leave the person order and all secondary placement
            // constraints unchanged. Branches, cycles and placeholders retain
            // the ordinary native preference.
            const junctionRank = new Map();
            const pair = primaryPairs.find(pair => pair.group === group.id);
            if (pair?.orderedPeople && members.length >= 4
                && members.every(id => !peopleById.get(id).placeholder))
            {
                const neighbours = new Map(members.map(id => [id, new Set()]));
                const junctions = group.children.filter(node => familyById.has(node.id));
                for (const node of junctions)
                {
                    const parents = familyById.get(node.id).parents;
                    if (parents.length !== 2) continue;
                    const [a, b] = parents;
                    neighbours.get(a).add(b);
                    neighbours.get(b).add(a);
                }
                const [a, b] = pair.orderedPeople;
                if (neighbours.get(a).size === 2 && neighbours.get(b).size === 2
                    && [...neighbours.values()].every(peers => peers.size <= 2))
                {
                    function extend(start, previous)
                    {
                        const path = [], seen = new Set([start, previous]);
                        let next = [...neighbours.get(start)].find(id => id !== previous);
                        while (next && !seen.has(next))
                        {
                            path.push(next);
                            seen.add(next);
                            const after = [...neighbours.get(next)].find(id => id !== start);
                            start = next;
                            next = after;
                        }
                        return path;
                    }
                    const sequence = [...extend(a, b).reverse(), a, b, ...extend(b, a)];
                    if (sequence.length === members.length && new Set(sequence).size === members.length)
                    {
                        const pathRank = new Map(sequence.map((id, i) => [id, i]));
                        for (const node of junctions)
                            junctionRank.set(node.id, Math.min(...familyById.get(node.id).parents.map(id => pathRank.get(id))));
                    }
                }
            }
            group.children.sort((a, b) => (rank.get(a.id) ?? members.length) - (rank.get(b.id) ?? members.length)
                || (junctionRank.get(a.id) ?? 0) - (junctionRank.get(b.id) ?? 0));
        }
        // Prefer paternal-before-maternal ancestral households at the root.
        // The bottom-up sweep keeps internal ordering local while ELK can still
        // optimize the relative positions of the compound groups.
        const groupRank = group => Math.min(...group.children.map(node => ancestryOrder.get(node.id) ?? Infinity));
        graph.children.sort((a, b) => groupRank(a) - groupRank(b));
        return {
            graph,
            groups,
            owner,
            edgeInfo,
            direction,
            primaryPairs,
            ordered
        };
    }

    function flatten(graph, model)
    {
        const boxes = [],
            junctions = [],
            groups = [],
            ports = [],
            paths = [],
            issues = [],
            seenEdges = new Set(),
            allShapes = new Map();
        const finite = (...values) => values.every(Number.isFinite);
        const absolute = (p, x, y) => (
        {
            x: p.x + x,
            y: p.y + y
        });

        function walk(node, ox, oy, isRoot = false)
        {
            const x = isRoot ? 0 : ox + node.x,
                y = isRoot ? 0 : oy + node.y;
            if (!finite(x, y, node.width, node.height)) throw Error('Missing ELK node geometry: ' + node.id);
            const shape = {
                id: node.id,
                x,
                y,
                w: node.width,
                h: node.height
            };
            allShapes.set(node.id, shape);
            if (peopleById.has(node.id)) boxes.push(shape);
            else if (familyById.has(node.id)) junctions.push(shape);
            else if (!isRoot) groups.push(shape);
            for (const port of node.ports || [])
            {
                if (!finite(port.x, port.y)) issues.push('Missing port coordinate: ' + port.id);
                else ports.push(
                {
                    id: port.id,
                    node: node.id,
                    x: x + port.x + (port.width || 0) / 2,
                    y: y + port.y + (port.height || 0) / 2
                });
            }
            for (const edge of node.edges || [])
            {
                const info = model.edgeInfo.get(edge.id);
                if (!info)
                {
                    issues.push('Unexpected edge: ' + edge.id);
                    continue;
                }
                if (seenEdges.has(edge.id)) issues.push('Repeated edge: ' + edge.id);
                seenEdges.add(edge.id);
                if (!edge.sections?.length)
                {
                    issues.push('Missing route: ' + edge.id);
                    continue;
                }
                if (JSON.stringify(edge.sources) !== JSON.stringify([info.source]) || JSON.stringify(edge.targets) !== JSON.stringify([info.target])) issues.push('Changed endpoints: ' + edge.id);
                for (const section of edge.sections)
                {
                    const points = [section.startPoint, ...(section.bendPoints || []), section.endPoint];
                    if (!points.every(p => p && finite(p.x, p.y)))
                    {
                        issues.push('Invalid section: ' + edge.id);
                        continue;
                    }
                    paths.push(
                    {
                        id: edge.id,
                        section: section.id,
                        family: info.familyId,
                        role: info.role,
                        person: info.person,
                        points: points.map(p => absolute(p, x, y))
                    });
                }
            }
            for (const child of node.children || []) walk(child, x, y);
        }
        walk(graph, 0, 0, true);
        for (const id of model.edgeInfo.keys())
            if (!seenEdges.has(id)) issues.push('Missing edge: ' + id);
        for (const person of people)
            if (boxes.filter(b => b.id === person.id).length !== 1) issues.push('Expected one card: ' + person.id);
        for (const family of families)
            if (junctions.filter(b => b.id === family.id).length !== 1) issues.push('Expected one junction: ' + family.id);
        const portsById = new Map(ports.map(p => [p.id, p]));
        // Endpoint/section continuity: ELK can split a single edge at hierarchy ports.
        // Check the returned polyline network rather than inventing a missing segment.
        const near = (a, b) => Math.abs(a.x - b.x) < .1 && Math.abs(a.y - b.y) < .1;
        for (const [id, info] of model.edgeInfo)
        {
            const pieces = paths.filter(p => p.id === id),
                a = portsById.get(info.source),
                b = portsById.get(info.target);
            if (!a || !b || !pieces.length)
            {
                issues.push('Missing endpoint geometry: ' + id);
                continue;
            }
            const segs = pieces.map(p => [p.points[0], p.points.at(-1)]);
            let frontier = [a],
                remaining = [...segs];
            for (let i = 0; i < frontier.length; i++)
                for (let j = remaining.length - 1; j >= 0; j--)
                {
                    const [u, v] = remaining[j];
                    if (near(frontier[i], u) || near(frontier[i], v))
                    {
                        frontier.push(u, v);
                        remaining.splice(j, 1);
                    }
                }
            if (!frontier.some(p => near(p, b)) || remaining.length) issues.push('Disconnected route sections: ' + id);
        }
        return {
            boxes,
            junctions,
            groups,
            ports,
            paths,
            issues,
            width: graph.width,
            height: graph.height
        };
    }

    function secondaryJunctionPosition(leftEdge, rightEdge, childCenters)
    {
        const middle = (leftEdge + rightEdge) / 2;
        if (!childCenters.length) return middle;
        const target = (Math.min(...childCenters) + Math.max(...childCenters)) / 2;
        const clearance = Math.min(16, (rightEdge - leftEdge) / 2);
        return Math.max(leftEdge + clearance, Math.min(rightEdge - clearance, target));
    }

    function inlinePartnerships(raw, model)
    {
        const vertical = model.direction === 'DOWN',
            to = (p) => vertical ?
            {
                u: p.x,
                v: p.y
            } :
            {
                u: p.y,
                v: p.x
            },
            from = (p) => vertical ?
            {
                x: p.u,
                y: p.v
            } :
            {
                x: p.v,
                y: p.u
            };
        const box = b => (
        {
            id: b.id,
            u: vertical ? b.x : b.y,
            v: vertical ? b.y : b.x,
            w: vertical ? b.w : b.h,
            h: vertical ? b.h : b.w
        });
        const byId = new Map(raw.boxes.map(b => [b.id, box(b)])),
            oldJunctions = new Map(raw.junctions.map(b => [b.id, box(b)]));
        const paths = [],
            junctions = [],
            underpasses = [],
            issues = [...raw.issues],
            pendingChildren = [],
            junctionMoves = [];
        const secondaryFamilies = new Set((model.primaryPairs || []).flatMap(pair => pair.secondary));
        const ports = raw.ports.filter(p => !p.id.includes(':out:') && !familyById.has(p.node));
        const EPS = .02;
        const point = (u, v) => (
        {
            u,
            v
        });
        const add = (f, role, person, points, extended = false) =>
        {
            const clean = points.filter((p, i) => !i || Math.abs(p.u - points[i - 1].u) > EPS || Math.abs(p.v - points[i - 1].v) > EPS);
            if (clean.length < 2) return;
            paths.push(
            {
                id: f.id + ':' + role + ':' + person,
                section: f.id + ':' + role + ':' + person + ':' + paths.length,
                family: f.id,
                role,
                person,
                extended,
                points: clean.map(from)
            });
        };
        const fail = message =>
        {
            throw Error(message);
        };
        for (const group of model.groups)
        {
            const cards = group.members.map(id => byId.get(id)).sort((a, b) => a.u - b.u);
            const fs = families.filter(f => f.parents.every(id => group.members.includes(id)));
            if (!fs.length) continue;
            const center = cards[0].v + cards[0].h / 2;
            if (cards.some(c => Math.abs(c.v + c.h / 2 - center) > EPS)) fail('Partnership group not aligned: ' + group.id);
            const entries = fs.map(f =>
            {
                const idx = f.parents.map(id => cards.findIndex(c => c.id === id)).sort((a, b) => a - b);
                const j = oldJunctions.get(f.id);
                if (!j) fail('Missing ELK junction: ' + f.id);
                return {
                    f,
                    left: idx[0],
                    right: idx.at(-1),
                    old: j,
                    span: idx.at(-1) - idx[0]
                };
            }).sort((a, b) => a.span - b.span || a.f.id.localeCompare(b.f.id));
            const usedGaps = new Set(),
                lanes = [];
            // Allocate short direct pairs first. Extended pairs use the closest unused
            // gap to their original ELK junction and an upper parallel lane.
            for (const e of entries)
            {
                if (e.left === e.right)
                {
                    const card = cards[e.left];
                    e.u = card.u + card.w / 2;
                    e.v = card.v + card.h;
                    continue;
                }
                const candidates = [];
                for (let i = e.left; i < e.right; i++)
                {
                    const a = cards[i],
                        b = cards[i + 1],
                        gap = b.u - a.u - a.w;
                    if (gap >= 14) candidates.push(
                    {
                        i,
                        u: (a.u + a.w + b.u) / 2,
                        used: usedGaps.has(i),
                        d: Math.abs((a.u + a.w + b.u) / 2 - (e.old.u + e.old.w / 2))
                    });
                }
                candidates.sort((a, b) => Number(a.used) - Number(b.used) || a.d - b.d || a.i - b.i);
                if (!candidates.length)
                {
                    issues.push('No usable inline gap: ' + e.f.id);
                    e.native = true;
                    continue;
                }
                const slot = candidates[0];
                usedGaps.add(slot.i);
                e.slot = slot.i;
                e.u = slot.u;
                if (secondaryFamilies.has(e.f.id) && e.f.children.length)
                {
                    const childCards = e.f.children.map(id => byId.get(id));
                    if (childCards.some(c => !c)) fail('Missing child card for secondary junction: ' + e.f.id);
                    const centers = childCards.map(c => c.u + c.w / 2);
                    const target = (Math.min(...centers) + Math.max(...centers)) / 2;
                    const leftEdge = cards[slot.i].u + cards[slot.i].w,
                        rightEdge = cards[slot.i + 1].u;
                    e.u = secondaryJunctionPosition(leftEdge, rightEdge, centers);
                    junctionMoves.push(
                    {
                        family: e.f.id,
                        from: slot.u,
                        to: e.u,
                        target,
                        offsetBefore: Math.abs(slot.u - target),
                        offsetAfter: Math.abs(e.u - target)
                    });
                }
                let lane = 0;
                while ((lanes[lane] || []).some(other => Math.max(e.left, other.left) < Math.min(e.right, other.right))) lane++;
                (lanes[lane] ||= []).push(e);
                e.v = center - lane * 12;
                if (cards.some(c => e.v < c.v + 7 || e.v > c.v + c.h - 7)) fail('Insufficient room for distinct inline lanes: ' + group.id);
            }
            for (const e of entries)
            {
                const
                {
                    f,
                    u,
                    v,
                    left,
                    right,
                    old
                } = e;
                if (e.native)
                {
                    paths.push(...raw.paths.filter(path => path.family === f.id).map(path => (
                    {
                        ...path,
                        native: true
                    })));
                    junctions.push(raw.junctions.find(junction => junction.id === f.id));
                    continue;
                }
                const centerPoint = from(point(u, v));
                junctions.push(
                {
                    id: f.id,
                    x: centerPoint.x - 5,
                    y: centerPoint.y - 5,
                    w: 10,
                    h: 10
                });
                // Draw each partner half-line to its own junction, clipped at unrelated
                // cards. Leave a 3px clearance rather than suggesting that an unrelated
                // card is a member of that family. No visible line goes through a card.
                for (const i of left === right ? [] : [left, right])
                {
                    const card = cards[i],
                        start = i === left ? card.u + card.w : card.u;
                    const lo = Math.min(start, u),
                        hi = Math.max(start, u),
                        holes = [];
                    for (let k = left + 1; k < right; k++)
                    {
                        const c = cards[k];
                        if (c.u >= hi || c.u + c.w <= lo) continue;
                        holes.push([Math.max(lo, c.u - 3), Math.min(hi, c.u + c.w + 3)]);
                        underpasses.push(
                        {
                            family: f.id,
                            card: c.id,
                            partner: card.id
                        });
                    }
                    let cursor = lo;
                    for (const [a, b] of holes.sort((a, b) => a[0] - b[0]))
                    {
                        if (a > cursor + EPS) add(f, 'parent', card.id, [point(cursor, v), point(a, v)], e.span > 1);
                        cursor = Math.max(cursor, b);
                    }
                    if (hi > cursor + EPS) add(f, 'parent', card.id, [point(cursor, v), point(hi, v)], e.span > 1);
                    const pp = from(point(start, v));
                    ports.push(
                    {
                        id: card.id + ':inline:' + f.id,
                        node: card.id,
                        ...pp
                    });
                }
                const fpaths = raw.paths.filter(p => p.family === f.id && p.role === 'child');
                // Unified routing needs only the native endpoints, not a particular
                // bend pattern. Three or more children can have different ELK rails.
                if (raw.issues.length) fail('ELK output has unresolved geometry or endpoint issues');
                const targets = f.children.map(person =>
                {
                    const port = raw.ports.find(p => p.id === person + ':in:' + f.id && p.node === person);
                    if (!port || !fpaths.some(p => p.person === person)) fail('Missing ELK child endpoint: ' + f.id + ':' + person);
                    return {
                        person,
                        target: to(port)
                    };
                });
                if (!targets.length) continue;
                const nativeLevels = fpaths.flatMap(p => p.points.map(to).slice(1).flatMap((b, i) =>
                {
                    const a = to(p.points[i]);
                    return Math.abs(a.v - b.v) < EPS && Math.abs(a.u - b.u) > EPS ? [a.v] : [];
                })).sort((a, b) => a - b);
                const rail = nativeLevels.length ? nativeLevels[Math.floor(nativeLevels.length / 2)] : (old.v + old.h + Math.min(...targets.map(t => t.target.v))) / 2;
                pendingChildren.push(
                {
                    f,
                    u,
                    v,
                    rail,
                    targets
                });
                ports.push(
                {
                    id: f.id + ':inline:children',
                    node: f.id,
                    ...centerPoint
                });

            }
        }
        // Allocate all child rails for a generation band together, before drawing them.
        // The supplied person coordinates, group extents and child ports stay untouched.
        const railBands = allocateUnifiedRails(pendingChildren, [...byId.values()]);
        for (const entry of pendingChildren)
        {
            const
            {
                f,
                u,
                v,
                rail,
                targets
            } = entry;
            for (const
                {
                    person,
                    target
                }
                of targets) add(f, 'child', person, [point(u, v), point(u, rail), point(target.u, rail), target]);
        }
        if (junctions.length !== families.length) fail('Missing inline family junction');
        const actual = new Set(paths.map(p => p.id));
        for (const f of families)
            for (const [role, ids] of [
                    ['parent', f.parents.length === 1 ? [] : f.parents],
                    ['child', f.children]
                ])
                for (const id of ids)
                    if (!actual.has(f.id + ':' + role + ':' + id)) fail('Missing visible relationship: ' + f.id + ':' + id);
        const boxes = raw.boxes;
        const groups = raw.groups;
        return {
            ...raw,
            boxes,
            groups,
            paths,
            junctions,
            ports,
            issues,
            underpasses,
            railBands,
            junctionMoves
        };
    }

    // One common rail per generation gap, with the minimum number of additional
    // lanes when closed horizontal intervals conflict. The input is in cross/depth
    // coordinates; all coordinates refer to the actual ELK layout, not a synthetic grid.
    function allocateUnifiedRails(entries, cards)
    {
        const bands = new Map(),
            clearance = 8,
            laneGap = 14,
            tolerance = .02;
        for (const e of entries)
        {
            const g = peopleById.get(e.f.parents[0]).generation;
            if (e.f.parents.some(id => peopleById.get(id).generation !== g) || e.f.children.some(id => peopleById.get(id).generation !== g + 1)) throw Error('Nonconsecutive generation rail: ' + e.f.id);
            const xs = [e.u, ...e.targets.map(t => t.target.u)];
            e.lo = Math.min(...xs);
            e.hi = Math.max(...xs);
            if (!bands.has(g)) bands.set(g, []);
            bands.get(g).push(e);
        }
        const summaries = [];
        for (const [g, items] of [...bands].sort((a, b) => a[0] - b[0]))
        {
            const parents = cards.filter(c => peopleById.get(c.id).generation === g);
            const children = cards.filter(c => peopleById.get(c.id).generation === g + 1);
            const low = Math.max(...parents.map(c => c.v + c.h)) + clearance;
            const high = Math.min(...children.map(c => c.v), ...items.flatMap(e => e.targets.map(t => t.target.v))) - clearance;
            if (high < low) throw Error('No shared clear rail corridor between generations ' + (g + 1) + ' and ' + (g + 2));
            // A clearance-separated interval cannot interact with any earlier
            // interval. Reuse the band levels, but order each such component locally.
            const order = [...items].sort((a, b) => a.lo - b.lo || a.hi - b.hi || a.f.id.localeCompare(b.f.id));
            const components = [];
            let rightmost = -Infinity;
            for (const entry of order)
            {
                if (rightmost + clearance <= entry.lo + tolerance) components.push([]);
                const lanes = components.at(-1);
                // Greedy interval partitioning uses the minimum number of lanes.
                const available = lanes.find(lane => lane.at(-1).hi + clearance <= entry.lo + tolerance);
                if (available) available.push(entry);
                else lanes.push([entry]);
                rightmost = Math.max(rightmost, entry.hi);
            }
            const count = Math.max(...components.map(lanes => lanes.length));
            const spacing = count > 1 ? Math.min(laneGap, (high - low) / (count - 1)) : laneGap;
            if (spacing < clearance) throw Error('Insufficient space for distinct descendant rails');
            const nativeLevels = items.map(e => e.rail).sort((a, b) => a - b);
            const preferred = nativeLevels[Math.floor(nativeLevels.length / 2)];
            const span = (count - 1) * spacing;
            const base = Math.max(low, Math.min(high - span, preferred - span / 2));
            const levels = Array.from({ length: count }, (_, index) => ({ level: base + index * spacing, families: [] }));
            let bestScore = 0;
            for (const lanes of components)
            {
                const local = orderRailLanes(lanes, tolerance);
                bestScore += local.score;
                // Center a smaller component near the native level using shared rails.
                const offset = Math.floor((count - lanes.length) / 2);
                for (const [index, lane] of local.order.entries())
                {
                    const level = levels[offset + index];
                    for (const entry of lanes[lane])
                    {
                        entry.rail = level.level;
                        level.families.push(entry.f.id);
                    }
                }
            }
            summaries.push(
            {
                generation: g + 1,
                nextGeneration: g + 2,
                levels,
                estimatedLaneIntersections: bestScore
            });
        }
        return summaries;
    }

    function orderRailLanes(lanes, tolerance)
    {
        const count = lanes.length;
        const costs = lanes.map(() => Array(count).fill(0));
        const inSpan = (u, entry) => u >= entry.lo - tolerance && u <= entry.hi + tolerance;
        for (const [i, lane] of lanes.entries())
            for (let j = i + 1; j < count; j++)
            {
                const other = lanes[j];
                let first = 0;
                for (const a of lane)
                {
                    while (first < other.length && other[first].hi < a.lo - tolerance) first++;
                    for (let k = first; k < other.length && other[k].lo <= a.hi + tolerance; k++)
                    {
                        const b = other[k];
                        // An upper rail meets a lower trunk or drops across a lower rail.
                        costs[i][j] += Number(inSpan(b.u, a))
                            + a.targets.filter(t => inSpan(t.target.u, b)).length;
                        costs[j][i] += Number(inSpan(a.u, b))
                            + b.targets.filter(t => inSpan(t.target.u, a)).length;
                    }
                }
            }
        const order = lanes.map((_, index) => index);
        let score = order.reduce((total, i) =>
            total + order.slice(i + 1).reduce((sum, j) => sum + costs[i][j], 0), 0);
        if (!score) return { order, score };

        if (count <= 10)
        {
            // The first lane contributes its cost to every remaining lane below it.
            // Solve each subset once. Lowest original index wins ties.
            const size = 1 << count;
            const best = new Float64Array(size);
            const first = new Uint8Array(size);
            for (let mask = 1; mask < size; mask++)
            {
                best[mask] = Infinity;
                for (let i = 0; i < count; i++)
                {
                    const bit = 1 << i;
                    if (!(mask & bit)) continue;
                    const rest = mask ^ bit;
                    let cost = best[rest];
                    for (let j = 0; j < count; j++)
                        if (rest & (1 << j)) cost += costs[i][j];
                    if (cost >= best[mask]) continue;
                    best[mask] = cost;
                    first[mask] = i;
                }
            }
            score = best[size - 1];
            let mask = size - 1;
            for (let index = 0; index < count; index++)
            {
                order[index] = first[mask];
                mask ^= 1 << order[index];
            }
        }
        else
        {
            // Adjacent swaps only affect the swapped pair. Bound dense work.
            for (let pass = 0; pass < count; pass++)
            {
                let changed = false;
                for (let i = 0; i < count - 1; i++)
                {
                    const a = order[i], b = order[i + 1];
                    const delta = costs[b][a] - costs[a][b];
                    if (delta >= 0) continue;
                    [order[i], order[i + 1]] = [b, a];
                    score += delta;
                    changed = true;
                }
                if (!changed) break;
            }
        }
        return { order, score };
    }

    function planDynamicSpacing(raw, model)
    {
        const floor = secondarySpacing,
            limit = floor + 600,
            vertical = model.direction === 'DOWN';
        const cards = new Map(raw.boxes.map(b => [b.id, b]));
        const cross = b => vertical ? b.x + b.w / 2 : b.y + b.h / 2;
        const size = b => vertical ? b.w : b.h;
        const requested = new Map(),
            entries = [];
        if (raw.issues.length) throw Error('Cannot measure incomplete first-pass ELK layout');
        for (const pair of model.primaryPairs)
        {
            const group = model.groups.find(g => g.id === pair.group);
            const anchor = cards.get(pair.anchor);
            if (!anchor || !group) throw Error('Missing first-pass partnership group');
            const groupCards = group.members.map(id => cards.get(id));
            if (groupCards.some(c => !c)) throw Error('Missing first-pass person card');
            for (const familyId of pair.secondary)
            {
                const f = familyById.get(familyId),
                    id = f.parents.find(id => id !== pair.anchor),
                    partner = cards.get(id);
                if (!partner || !pair.secondaryPeople.includes(id)) continue;
                const children = f.children.map(id => cards.get(id));
                if (children.some(c => !c)) throw Error('Missing first-pass child: ' + familyId);
                const x = cross(partner),
                    side = Math.sign(x - cross(anchor));
                const target = children.length ? (Math.min(...children.map(cross)) + Math.max(...children.map(cross))) / 2 : null;
                const inward = side ? groupCards.filter(c => c.id !== id && side * (x - cross(c)) > EPS).sort((a, b) => Math.abs(x - cross(a)) - Math.abs(x - cross(b)))[0] : null;
                const gap = inward ? Math.abs(x - cross(inward)) - (size(partner) + size(inward)) / 2 : floor;
                const outward = target === null ? 0 : Math.max(0, side * (target - x));
                // An already adequate gap is retained; only request more if the child
                // midpoint lies farther outward. ELK may move the children as well.
                const wanted = outward > EPS ? Math.max(floor, Math.ceil(gap + outward)) : floor;
                const spacing = Math.min(limit, wanted);
                requested.set(id, Math.max(requested.get(id) || floor, spacing));
                entries.push(
                {
                    family: familyId,
                    partner: id,
                    name: peopleById.get(id).name,
                    side: side < 0 ? 'left/up' : side > 0 ? 'right/down' : 'undetermined',
                    inwardNeighbour: inward?.id ?? null,
                    firstPartnerCenter: x,
                    firstChildMidpoint: target,
                    firstInwardGap: gap,
                    outwardDeficit: outward,
                    requestedMinimum: spacing,
                    capped: wanted > limit
                });
            }
        }
        return {
            requested,
            entries,
            changed: [...requested.values()].some(n => n > floor)
        };
    }
    const started = performance.now();
    const first = measure('graph', () => buildGraph());
    const firstResult = await calculate(first.graph);
    let raw = measure('flatten', () => flatten(firstResult, first));
    const spacingPlan = measure('spacing', () => planDynamicSpacing(raw, first));
    let final = first;
    if (spacingPlan.changed)
    {
        final = measure('graph', () => buildGraph(spacingPlan.requested));
        const finalResult = await calculate(final.graph);
        raw = measure('flatten', () => flatten(finalResult, final));
    }
    let layout;
    try
    {
        layout = measure('routing', () => inlinePartnerships(raw, final));
    }
    catch (error)
    {
        // Keep every native relationship visible when the approved connector
        // presentation cannot represent the graph, and surface its diagnosis.
        layout = {
            ...raw,
            issues: [...raw.issues, error.message]
        };
    }
    const orderIssues = [];
    const orderDetails = [];
    const finalCards = new Map(layout.boxes.map(box => [box.id, box]));
    for (const [familyId, orderedPeople] of final.ordered)
    {
        const [male, female] = orderedPeople.map(id => finalCards.get(id));
        const cross = direction === 'DOWN' ? 'x' : 'y';
        if (male && female && male[cross] >= female[cross])
        {
            const message = `Principal partner order: ${familyId} (${male[cross]}, ${female[cross]})`;
            orderIssues.push(message);
            orderDetails.push({ message, familyId, personIds: orderedPeople });
        }
    }
    if (layout.underpasses)
    {
        try
        {
            layout = measure('centering', () => refineElkTreeCentering(raw, final, people, families, layout,
                (...args) => measure('centeringReroute', () => inlinePartnerships(...args))));
        }
        catch (error)
        {
            // Keep the valid inline scene if refinement itself fails.
            layout = { ...layout, issues: [...layout.issues, 'Family centering refinement: ' + error.message] };
        }
    }
    return {
        ...layout,
        issues: [...layout.issues, ...orderIssues],
        orderDetails,
        direction,
        elapsed: performance.now() - started,
        passes: final === first ? 1 : 2,
        spacing: spacingPlan.entries,
        primaryPairs: final.primaryPairs
    };
}
// Parent-slot roles are presentation metadata, not canonical gender changes.
function elkOrderedPartners(ids, people)
{
    if (ids.length !== 2) return null;
    const fatherSlot = ids.find(id => people.get(id).placeholder?.rel === 'father');
    const motherSlot = ids.find(id => people.get(id).placeholder?.rel === 'mother');
    if (fatherSlot) return [fatherSlot, ids.find(id => id !== fatherSlot)];
    if (motherSlot) return [ids.find(id => id !== motherSlot), motherSlot];
    const male = ids.find(id => people.get(id).gender === 'male');
    const female = ids.find(id => people.get(id).gender === 'female');
    return male && female ? [male, female] : null;
}

// Refine the cross-axis position of ordinary family groups only. The native
// solver still determines generations, internal geometry and model order.
// The existing inline router is the only publisher of refined connectors.
function refineElkTreeCentering(raw, model, people, families, baseline, route)
{
    const EPS = .02;
    const vertical = model.direction === 'DOWN';
    const axis = vertical ? 'x' : 'y';
    const extent = vertical ? 'w' : 'h';
    const sceneExtent = vertical ? 'width' : 'height';
    const peopleById = new Map(people.map(p => [p.id, p]));
    const incoming = new Map(people.map(p => [p.id, []]));
    const unions = new Map(model.groups.map(g => [g.id, []]));
    for (const family of families)
    {
        unions.get(model.owner.get(family.id)).push(family);
        for (const child of family.children) incoming.get(child).push(family);
    }
    const ordinary = new Set(model.groups.filter(g => g.members.every(id => !peopleById.get(id).placeholder)
        && g.members.length <= 2 && unions.get(g.id).length <= 1).map(g => g.id));
    const generations = new Map(model.groups.map(g => [g.id, g.generation]));
    const clearanceByGroup = new Map(model.groups.map(g => [g.id,
        Math.max(TREE_GEOMETRY.partnerGap, ...(vertical ? [] : g.members.map(id => peopleById.get(id).focusClearance || 0)))]));
    const realPair = f => f?.parents.length === 2 && f.parents.every(id => !peopleById.get(id).placeholder);
    const pairs = families.filter(realPair).map(f =>
    {
        const parents = f.parents.map(id => incoming.get(id));
        if (parents.some(fs => fs.length !== 1 || !realPair(fs[0]))) return null;
        const [a, b] = parents.map(fs => fs[0]);
        if (a.id === b.id) return null;
        return { f, a, b, group: model.owner.get(f.id), generation: peopleById.get(f.parents[0]).generation };
    }).filter(Boolean).sort((a, b) => a.generation - b.generation || a.f.id.localeCompare(b.f.id));
    const errors = geometry =>
    {
        const cards = new Map(geometry.boxes.map(b => [b.id, b]));
        const center = f => f.parents.reduce((sum, id) =>
        {
            const card = cards.get(id);
            return sum + card[axis] + card[extent] / 2;
        }, 0) / f.parents.length;
        return new Map(pairs.map(p => [p.f.id, center(p.f) - (center(p.a) + center(p.b)) / 2]));
    };
    // Native fallback routes cannot be reused after moving their endpoints.
    if (baseline.issues.length || baseline.paths.some(p => p.native)) return baseline;
    let current = raw;
    let layout = baseline;
    let offsets = errors(current);
    const accepted = [];
    let conflicts = null;
    for (const pair of pairs)
    {
        const delta = -offsets.get(pair.f.id);
        if (Math.abs(delta) <= EPS || !ordinary.has(pair.group)) continue;
        const moved = new Set([pair.group]);
        // Descendant groups with no other incoming family may follow rigidly.
        // Shared/multiple partnerships and placeholder groups stay native.
        let added = true;
        while (added)
        {
            added = false;
            for (const g of model.groups)
            {
                if (!ordinary.has(g.id) || moved.has(g.id)) continue;
                const parents = g.members.flatMap(id => incoming.get(id));
                if (parents.length && parents.every(f => moved.has(model.owner.get(f.id))))
                {
                    moved.add(g.id);
                    added = true;
                }
            }
        }
        const shapes = new Map(current.groups.map(g => [g.id, g]));
        // Preserve order and at least the existing clearance up to the nominal
        // spacing (including horizontal Focus-control clearance).
        let safe = true;
        for (const id of moved)
        {
            const a = shapes.get(id);
            if (!a || a[axis] + delta < 0)
            {
                safe = false;
                break;
            }
            for (const b of current.groups)
            {
                if (moved.has(b.id) || generations.get(id) !== generations.get(b.id)) continue;
                const before = a[axis] <= b[axis];
                const gap = before ? b[axis] - a[axis] - a[extent] : a[axis] - b[axis] - b[extent];
                const clearance = Math.max(clearanceByGroup.get(id), clearanceByGroup.get(b.id));
                const next = gap + (before ? -delta : delta);
                if (next < Math.min(clearance, Math.max(0, gap)) - EPS)
                {
                    safe = false;
                    break;
                }
            }
            if (!safe) break;
        }
        if (!safe) continue;
        const translate = (shape, owner) => moved.has(owner) ? { ...shape, [axis]: shape[axis] + delta } : shape;
        const trial = {
            ...current,
            boxes: current.boxes.map(b => translate(b, model.owner.get(b.id))),
            groups: current.groups.map(g => translate(g, g.id)),
            junctions: current.junctions.map(j => translate(j, model.owner.get(j.id))),
            ports: current.ports.map(p => translate(p, model.owner.get(p.node)))
        };
        trial[sceneExtent] = Math.max(current[sceneExtent], ...trial.groups.map(g => g[axis] + g[extent] + (vertical ? 48 : 64)));
        const nextOffsets = errors(trial);
        if (Math.abs(nextOffsets.get(pair.f.id)) > EPS || pairs.some(p =>
            Math.abs(nextOffsets.get(p.f.id)) > Math.abs(offsets.get(p.f.id)) + EPS)) continue;
        // Native path sections in trial are read-only depth/coverage hints for
        // inlinePartnerships. Every visible route must be reconstructed by it;
        // never publish a candidate that reuses native sections.
        let candidate;
        try
        {
            candidate = route(trial, model);
        }
        catch (error)
        {
            continue;
        }
        if (candidate.issues.length || candidate.paths.some(p => p.native)) continue;
        conflicts ??= elkCenteringConflicts(layout, axis);
        const nextConflicts = elkCenteringConflicts(candidate, axis);
        if ([...nextConflicts].some(([key, count]) => count > (conflicts.get(key) || 0))) continue;
        current = trial;
        layout = candidate;
        offsets = nextOffsets;
        conflicts = nextConflicts;
        accepted.push(pair.f.id);
    }
    return accepted.length ? { ...layout, centeredFamilies: accepted } : baseline;
}

// Compare conflict multiplicity by relationship/card identity, not absolute
// coordinates: an existing crossing may translate, but no new one is allowed.
// Sweep bounding intervals on the cross axis to avoid comparing distant rails.
function elkCenteringConflicts(layout, axis)
{
    const EPS = .02;
    const conflicts = new Map();
    const items = [];
    const add = (type, ids) =>
    {
        const key = JSON.stringify([type, ...ids.sort()]);
        conflicts.set(key, (conflicts.get(key) || 0) + 1);
    };
    for (const b of layout.boxes)
        items.push({ id: b.id, card: true, x0: b.x, x1: b.x + b.w, y0: b.y, y1: b.y + b.h });
    for (const p of layout.paths)
        for (let i = 1; i < p.points.length; i++)
        {
            const a = p.points[i - 1], b = p.points[i];
            const x0 = Math.min(a.x, b.x), x1 = Math.max(a.x, b.x);
            const y0 = Math.min(a.y, b.y), y1 = Math.max(a.y, b.y);
            if (![x0, x1, y0, y1].every(Number.isFinite) || (x1 - x0 > EPS && y1 - y0 > EPS))
            {
                add('invalid segment', [p.id]);
                continue;
            }
            if (x1 - x0 <= EPS && y1 - y0 <= EPS) continue;
            items.push({ id: p.id, family: p.family, x0, x1, y0, y1 });
        }
    items.sort((a, b) => a[axis + '0'] - b[axis + '0']);
    for (let i = 0; i < items.length; i++)
        for (let j = i + 1; j < items.length; j++)
        {
            const a = items[i], b = items[j];
            if (b[axis + '0'] > a[axis + '1'] + EPS) break;
            const x = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0);
            const y = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
            if (x < -EPS || y < -EPS) continue;
            if (a.card && b.card)
            {
                if (x > EPS && y > EPS) add('card overlap', [a.id, b.id]);
                continue;
            }
            if (a.card || b.card)
            {
                const card = a.card ? a : b;
                const line = a.card ? b : a;
                const vertical = line.x1 - line.x0 <= EPS;
                if (vertical ? y > EPS && line.x0 > card.x0 + EPS && line.x0 < card.x1 - EPS
                    : x > EPS && line.y0 > card.y0 + EPS && line.y0 < card.y1 - EPS)
                    add('card hit', [card.id, line.id]);
                continue;
            }
            if (a.family === b.family) continue;
            const parallel = (a.x1 - a.x0 <= EPS) === (b.x1 - b.x0 <= EPS);
            if (parallel)
            {
                add(x > EPS || y > EPS ? 'coincident' : 'contact', [a.id, b.id]);
                continue;
            }
            const v = a.x1 - a.x0 <= EPS ? a : b;
            const h = v === a ? b : a;
            const interior = v.x0 > h.x0 + EPS && v.x0 < h.x1 - EPS
                && h.y0 > v.y0 + EPS && h.y0 < v.y1 - EPS;
            add(interior ? 'crossing' : 'contact', [a.id, b.id]);
        }
    return conflicts;
}
