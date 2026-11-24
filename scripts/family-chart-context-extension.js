    // GeneoGraph: extend the native focused tree with approved visible family
    // contexts. Existing occurrences retain native positions and toggle state.
    function extendFamilyContexts(tree, data, families, geometry) {
        const { is_horizontal, node_separation, level_separation } = geometry;
        const cross = is_horizontal ? "y" : "x";
        const depth = is_horizontal ? "x" : "y";
        const origin = tree[0][depth];
        const records = new Map(data.map(record => [record.id, record]));
        const occurrences = new Map();
        const rows = new Map();
        for (const node of tree) {
            if (!occurrences.has(node.data.id)) occurrences.set(node.data.id, []);
            occurrences.get(node.data.id).push(node);
            const level = Math.round((node[depth] - origin) / level_separation);
            if (!rows.has(level)) rows.set(level, []);
            rows.get(level).push(node[cross]);
        }

        function addOccurrence(id, level, preferred) {
            const positions = rows.get(level) || [];
            const free = position => positions.every(other => Math.abs(other - position) >= node_separation);
            let position = preferred;
            for (let offset = 1; !free(position); offset++) {
                const right = preferred + offset * node_separation;
                const left = preferred - offset * node_separation;
                position = free(left) ? left : right;
            }
            positions.push(position);
            rows.set(level, positions);
            const node = {
                data: records.get(id), tid: id, added: true, depth: Math.abs(level),
                [depth]: origin + level * level_separation, [cross]: position
            };
            node.psx = node.x;
            node.psy = node.y;
            tree.push(node);
            occurrences.set(id, [node]);
            return node;
        }

        const contextLinks = [];
        const pending = new Set(families);
        let previousSize;
        do {
            previousSize = pending.size;
            for (const family of pending) {
                const parentIds = family.parents.filter(id => records.has(id));
                const childIds = family.children.filter(id => records.has(id));
                if (!parentIds.length) { pending.delete(family); continue; }
                const parent = parentIds.flatMap(id => occurrences.get(id) || [])[0];
                const child = childIds.flatMap(id => occurrences.get(id) || [])
                    .find(node => !Object.hasOwn(node, "_toggle") || node.parents?.length);
                if (!parent && !child) continue;
                // The native duplicate toggle owns intentionally closed ancestry.
                if (!parent && child && child.data.rels.parents.some(id => parentIds.includes(id))
                    && child.parents?.length === 0 && Object.hasOwn(child, "_toggle")) continue;

                const anchor = parent || child;
                const level = Math.round((anchor[depth] - origin) / level_separation) - (parent ? 0 : 1);
                const parents = parentIds.map(id => {
                    const existing = occurrences.get(id);
                    return existing?.reduce((best, node) => distance(node, anchor) < distance(best, anchor) ? node : best)
                        || addOccurrence(id, level, anchor[cross]);
                });
                for (const id of childIds) {
                    const existing = occurrences.get(id);
                    const target = existing?.reduce((best, node) => distance(node, parents[0]) < distance(best, parents[0]) ? node : best)
                        || addOccurrence(id, level + 1, parents[0][cross]);
                    if (Object.hasOwn(target, "_toggle") && !target.parents?.length
                        && target.data.rels.parents.some(parentId => parentIds.includes(parentId))) continue;
                    const descriptors = createLinks({ ...target, children: undefined, spouses: undefined, coparent: undefined, parents }, is_horizontal);
                    for (const link of descriptors) contextLinks.push({ ...link, id: family.id + ":child:" + target.tid, familyContextId: family.id });
                }
                if (parents.length === 2) {
                    const [first, second] = parents;
                    const descriptors = createLinks({ ...first, children: undefined, parents: undefined, spouses: undefined, coparent: second }, is_horizontal);
                    for (const link of descriptors) contextLinks.push({ ...link, id: family.id + ":partner", familyContextId: family.id });
                }
                pending.delete(family);
            }
        } while (pending.size < previousSize);
        return contextLinks;

        function distance(a, b) {
            return Math.abs(a[depth] - b[depth]) + Math.abs(a[cross] - b[cross]);
        }
    }

    function mergeFamilyContextLinks(nativeLinks, contextLinks) {
        const endpoints = link => {
            const source = [].concat(link.source);
            const target = [].concat(link.target);
            if (link.spouse) return { partner: source.concat(target).map(node => node.tid).sort() };
            const parentNodes = Array.isArray(link.source) ? source : target;
            const child = Array.isArray(link.source) ? target[0] : source[0];
            return {
                child: child.tid,
                parents: [...new Set(parentNodes.filter(node => !node.data.addParent).map(node => node.tid))].sort(),
                placeholder: parentNodes.some(node => node.data.addParent)
            };
        };
        const childrenByOccurrence = new Map();
        for (const link of contextLinks) {
            const context = endpoints(link);
            if (!context.child) continue;
            if (!childrenByOccurrence.has(context.child)) childrenByOccurrence.set(context.child, []);
            childrenByOccurrence.get(context.child).push(context.parents);
        }
        nativeLinks = nativeLinks.filter(link => {
            const edge = endpoints(link);
            if (!edge.child || edge.placeholder) return true;
            const contexts = childrenByOccurrence.get(edge.child) || [];
            if (contexts.some(parents => parents.length === edge.parents.length
                && parents.every((id, index) => id === edge.parents[index]))) return true;
            return !contexts.some(parents =>
                parents.length > edge.parents.length && edge.parents.every(id => parents.includes(id)));
        });

        const endpointKey = link => {
            const { partner, child, parents } = endpoints(link);
            return JSON.stringify(partner || [child, parents]);
        };
        const represented = new Set(nativeLinks.map(endpointKey));
        for (const link of contextLinks) {
            const key = endpointKey(link);
            if (represented.has(key)) continue;
            represented.add(key);
            nativeLinks.push(link);
        }
        return nativeLinks;
    }
