    function compactParentPlaceholders(tree) {
        for (const child of tree) {
            if (child.parents?.length !== 2) continue;
            const [left, right] = [...child.parents].sort((a, b) => a.x - b.x);
            const first = left.data.addParent;
            const second = right.data.addParent;
            const placeholder = first || second;
            if (!placeholder) continue;
            const distance = Math.min(right.x - left.x,
                (first?.crossSize || placeholder.personCrossSize) / 2
                + (second?.crossSize || placeholder.personCrossSize) / 2 + placeholder.gap);
            if (first && second) {
                const middle = (left.x + right.x) / 2;
                left.x = middle - distance / 2;
                right.x = middle + distance / 2;
            } else if (first) left.x = right.x - distance;
            else right.x = left.x + distance;
        }
    }

    // GeneoGraph: extend the native focused tree with approved visible family
    // contexts. Existing occurrences retain their native identity and toggle state.
    function extendFamilyContexts(tree, data, families, geometry, gridConfig) {
        const { is_horizontal, node_separation, level_separation } = geometry;
        const cross = is_horizontal ? "y" : "x";
        const depth = is_horizontal ? "x" : "y";
        const origin = tree[0][depth];
        const records = new Map(data.map(record => [record.id, record]));
        const occurrences = new Map();
        const nativeNodes = new Set(tree);
        for (const node of tree) {
            if (!occurrences.has(node.data.id)) occurrences.set(node.data.id, []);
            occurrences.get(node.data.id).push(node);
        }

        function addOccurrence(id, level, preferred) {
            const node = {
                data: records.get(id), tid: id, added: true, depth: Math.abs(level),
                [depth]: origin + level * level_separation, [cross]: preferred
            };
            node.psx = node.x;
            node.psy = node.y;
            tree.push(node);
            occurrences.set(id, [node]);
            return node;
        }

        const households = [];
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
                const children = [];
                for (const id of childIds) {
                    const existing = occurrences.get(id);
                    const target = existing?.reduce((best, node) => distance(node, parents[0]) < distance(best, parents[0]) ? node : best)
                        || addOccurrence(id, level + 1, parents.reduce((sum, node) => sum + node[cross], 0) / parents.length);
                    if (Object.hasOwn(target, "_toggle") && !target.parents?.length
                        && target.data.rels.parents.some(parentId => parentIds.includes(parentId))) continue;
                    children.push(target);
                }
                households.push({ family, parents, children });
                pending.delete(family);
            }
        } while (pending.size < previousSize);

        const grid = gridConfig && planContextHouseholdGrid(tree, households, nativeNodes, families, geometry, gridConfig);
        if (grid?.status === 'applied') return { links: grid.links, grid };
        placeCollateralHouseholds(tree, households, nativeNodes, cross, depth, node_separation);

        const contextLinks = [];
        for (const { family, parents, children } of households) {
            for (const target of children) {
                const descriptors = createLinks({ ...target, children: undefined, spouses: undefined, coparent: undefined, parents }, is_horizontal);
                for (const link of descriptors) contextLinks.push({ ...link, id: family.id + ":child:" + target.tid, familyContextId: family.id });
            }
            if (parents.length === 2) {
                const [first, second] = parents;
                const descriptors = createLinks({ ...first, children: undefined, parents: undefined, spouses: undefined, coparent: second }, is_horizontal);
                for (const link of descriptors) contextLinks.push({ ...link, id: family.id + ":partner", familyContextId: family.id });
            }
        }
        return { links: contextLinks, grid };

        function distance(a, b) {
            return Math.abs(a[depth] - b[depth]) + Math.abs(a[cross] - b[cross]);
        }
    }

    function placeCollateralHouseholds(tree, households, nativeNodes, cross, depth, spacing) {
        const partners = new Map(tree.map(node => [node, new Set()]));
        for (const node of tree) {
            for (const partner of [...(node.spouses || []), node.coparent].filter(Boolean)) {
                partners.get(node).add(partner);
                partners.get(partner)?.add(node);
            }
        }
        for (const { parents } of households) {
            if (parents.length !== 2 || parents[0][depth] !== parents[1][depth]) continue;
            partners.get(parents[0]).add(parents[1]);
            partners.get(parents[1]).add(parents[0]);
        }

        const rows = new Map();
        const unitByNode = new Map();
        for (const node of tree) {
            if (unitByNode.has(node)) continue;
            const members = [node];
            const seen = new Set(members);
            for (const member of members) {
                for (const partner of partners.get(member)) {
                    if (partner[depth] !== node[depth] || seen.has(partner)) continue;
                    seen.add(partner);
                    members.push(partner);
                }
            }
            const native = members.filter(member => nativeNodes.has(member)).sort((a, b) => a[cross] - b[cross]);
            const added = members.some(member => !nativeNodes.has(member));
            let order = [...members].sort((a, b) => a[cross] - b[cross]);
            // Traverse a simple partnership chain from an endpoint. Retain
            // the direction of the existing native members where possible.
            let reordered = false;
            if (members.every(member => [...partners.get(member)].filter(p => seen.has(p)).length <= 2)) {
                const first = order.find(member => [...partners.get(member)].filter(p => seen.has(p)).length === 1);
                if (first) {
                    const chain = [first];
                    for (const member of chain) {
                        const next = [...partners.get(member)].find(p => seen.has(p) && !chain.includes(p));
                        if (next) chain.push(next);
                    }
                    if (chain.length === members.length) {
                        if (native.length > 1 && chain.indexOf(native[0]) > chain.indexOf(native.at(-1))) chain.reverse();
                        const preserved = chain.filter(member => nativeNodes.has(member));
                        const clearsPartnerships = order.slice(1).every((member, index) => partners.get(member).has(order[index]));
                        if (!added && !clearsPartnerships || added && preserved.every((member, index) => member === native[index])) {
                            reordered = !added;
                            order = chain;
                        }
                    }
                }
            }
            const anchor = reordered && seen.has(tree[0]) ? tree[0] : native[0] || node;
            const repack = added || reordered;
            const offset = order.indexOf(anchor);
            const unit = {
                order, native: native.length > 0, repack, focus: anchor === tree[0], anchor: anchor[cross], target: anchor[cross] - (repack ? offset * spacing : 0),
                offsets: order.map((member, index) => repack ? index * spacing : member[cross] - anchor[cross])
            };
            unit.span = Math.max(...unit.offsets);
            for (const member of order) unitByNode.set(member, unit);
            if (!rows.has(node[depth])) rows.set(node[depth], []);
            rows.get(node[depth]).push(unit);
        }

        for (const [level, units] of [...rows].sort(([a], [b]) => a - b)) {

            const groups = [];
            const assigned = new Set();
            for (const { parents, children } of households) {
                const childUnits = [...new Set(children.filter(child => child[depth] === level).map(child => unitByNode.get(child)))];
                const shared = parents.find(parent => partners.get(parent).size >= 3);
                const outer = parents.length === 2 && parents.find(parent => parent !== shared);
                const independentHousehold = outer && shared && partners.get(outer).size === 1
                    && parents.every(parent => parent[depth] < level);
                if (!childUnits.length || childUnits.some(unit => assigned.has(unit) || unit.focus
                    || unit.native && !independentHousehold)) continue;
                if (independentHousehold)
                    childUnits.sort((a, b) => a.anchor - b.anchor);
                let junction = parents.reduce((sum, parent) => sum + parent[cross], 0) / parents.length;
                if (independentHousehold && tree.some(node => node[depth] === shared[depth]
                    && node[cross] > Math.min(outer[cross], shared[cross])
                    && node[cross] < Math.max(outer[cross], shared[cross]))) junction = outer[cross];
                let span = 0;
                const offsets = childUnits.map(unit => {
                    const start = span;
                    span += unit.span + spacing;
                    return start;
                });
                const points = children.filter(child => child[depth] === level).map(child => {
                    const unit = unitByNode.get(child);
                    return offsets[childUnits.indexOf(unit)] + unit.offsets[unit.order.indexOf(child)];
                });
                groups.push({ units: childUnits, offsets, span: span - spacing,
                    target: junction - (Math.min(...points) + Math.max(...points)) / 2, orderAt: junction, native: false });
                childUnits.forEach(unit => assigned.add(unit));
            }
            if (!groups.length && !units.some(unit => unit.repack)) continue;
            for (const unit of units) {
                if (!assigned.has(unit))
                    groups.push({ units: [unit], offsets: [0], span: unit.span, focus: unit.focus, target: unit.target, orderAt: unit.native ? unit.anchor : unit.target, native: unit.native });
            }

            groups.sort((a, b) => a.orderAt - b.orderAt || Number(b.native) - Number(a.native));
            const anchor = groups.reduce((best, group, index) =>
                group.focus || (group.native && !groups[best].focus && (!groups[best].native || Math.abs(group.target) < Math.abs(groups[best].target))) ? index : best, 0);
            groups[anchor].position = groups[anchor].target;
            for (let index = anchor + 1; index < groups.length; index++) {
                const previous = groups[index - 1];
                groups[index].position = Math.max(groups[index].target, previous.position + previous.span + spacing);
            }
            for (let index = anchor - 1; index >= 0; index--) {
                const next = groups[index + 1];
                groups[index].position = Math.min(groups[index].target, next.position - groups[index].span - spacing);
            }
            for (const group of groups) {
                group.units.forEach((unit, index) => {
                    unit.order.forEach((node, member) => {
                        const next = group.position + group.offsets[index] + unit.offsets[member];
                        const delta = next - node[cross];
                        node[cross] = next;
                        if (typeof node.sx === "number") node.sx += delta;
                        if (typeof node[depth === "x" ? "psy" : "psx"] === "number")
                            node[depth === "x" ? "psy" : "psx"] += delta;
                    });
                });
            }
        }

        // An outer partner can move toward their children when another
        // household's child rail extends across the original junction.
        const familiesByParent = new Map();
        for (const household of households) {
            for (const parent of household.parents) {
                if (!familiesByParent.has(parent)) familiesByParent.set(parent, []);
                familiesByParent.get(parent).push(household);
            }
        }
        for (const { parents, children } of households) {
            if (parents.length !== 2 || !children.length) continue;
            const outer = parents.find(parent => partners.get(parent).size === 1 && !parent.is_ancestry);
            const shared = parents.find(parent => parent !== outer);
            if (!outer || partners.get(shared).size < 2 || outer[depth] !== shared[depth]) continue;
            const side = Math.sign(outer[cross] - shared[cross]);
            if (!side) continue;
            const outward = node => side * node[cross];
            const junction = (outward(outer) + outward(shared)) / 2;
            const otherChildren = familiesByParent.get(shared)
                .filter(household => household.parents !== parents)
                .flatMap(household => household.children)
                .filter(child => children.some(member => member[depth] === child[depth]));
            const railEnd = Math.max(-Infinity, ...otherChildren.map(outward));
            const childCenter = (Math.min(...children.map(outward)) + Math.max(...children.map(outward))) / 2;
            if (railEnd < junction || childCenter <= railEnd || childCenter <= outward(outer)) continue;

            const nextCard = Math.min(Infinity, ...tree.filter(node =>
                node[depth] === outer[depth] && outward(node) > outward(outer)).map(outward));
            const target = Math.min(childCenter + 24, nextCard - spacing);
            if (target <= outward(outer)) continue;
            if (target - spacing / 2 <= railEnd) continue;

            const delta = side * target - outer[cross];
            outer[cross] += delta;
            if (typeof outer.sx === "number") outer.sx += delta;
            const previousCross = depth === "x" ? "psy" : "psx";
            if (typeof outer[previousCross] === "number") outer[previousCross] += delta;
            outer.extendedPartnership = shared.tid;
            outer.extendedJunctionInset = 6 + Math.min(24, Math.max(0, target - childCenter));
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
