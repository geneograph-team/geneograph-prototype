const TREE_BRANCH_PRESETS = [2, 4, 8, 16];

function treeBranchPaths(preset)
{
    const origins = ['F', 'M'];
    const levels = [[1, 2]];
    const depth = Math.log2(preset);
    let paths = ['F', 'M'];
    for (let level = 1; level < depth; level++)
    {
        levels.push(paths.flatMap((path, index) =>
        {
            origins.push(path + 'M');
            return [levels[level - 1][index], origins.length];
        }));
        paths = paths.flatMap(path => [path + 'F', path + 'M']);
    }
    return { origins, levels };
}

function treeBranchGraph(people, families)
{
    const ids = new Set(people.map(person => person.id));
    const candidates = new Map(), children = new Map();
    let unsupported = 0, conflicts = 0;
    for (const family of families)
    {
        const parents = [familyPartnerAId(family), familyPartnerBId(family)].filter(id => ids.has(id));
        for (const child of family.childIds || [])
        {
            if (!ids.has(child)) continue;
            for (const parent of parents)
            {
                const role = familyPartnerRole(family, parent, { explicitOnly: true });
                const kind = parentChildRelationshipType(family, parent, child);
                if (!role || kind !== 'Biological' || child === parent)
                {
                    unsupported++;
                    continue;
                }
                if (!candidates.has(child)) candidates.set(child, [new Map(), new Map()]);
                const side = candidates.get(child)[role === 'father' ? 0 : 1];
                if (!side.has(parent)) side.set(parent, new Set());
                side.get(parent).add(family.id);
            }
        }
    }
    const parents = new Map();
    for (const [child, sides] of candidates)
    {
        parents.set(child, sides.map(side =>
        {
            if (side.size !== 1)
            {
                if (side.size > 1) conflicts++;
                return null;
            }
            const [parent, families] = side.entries().next().value;
            if (!children.has(parent)) children.set(parent, new Set());
            children.get(parent).add(child);
            return { parent, families };
        }));
    }
    const key = JSON.stringify([[...ids], [...parents].map(([child, sides]) => [child, sides.map(edge =>
        edge && [edge.parent, [...edge.families]])]), unsupported, conflicts]);
    return { ids, parents, children, key, unsupported, conflicts };
}

function treeBranchOriginIds(graph, reference, origins)
{
    return origins.map(path =>
    {
        let id = reference;
        for (const role of path) id = graph.parents.get(id)?.[role === 'F' ? 0 : 1]?.parent;
        return id || '';
    });
}

function resolveTreeBranches(graph, reference, preset, includeCollateral)
{
    const { origins, levels } = treeBranchPaths(preset);
    const ancestor = new Map(), collateral = new Map(), transitions = new Map(), links = new Set();
    const originIds = treeBranchOriginIds(graph, reference, origins);
    const split = levels.length;
    const queue = graph.ids.has(reference) ? [{ id: reference, slot: 0, path: '' }] : [];
    const seen = new Set();
    for (let i = 0; i < queue.length; i++)
    {
        const { id, slot, path } = queue[i];
        const key = JSON.stringify([id, slot, path]);
        if (seen.has(key)) continue;
        seen.add(key);
        if (slot)
        {
            if (!ancestor.has(id)) ancestor.set(id, new Set());
            ancestor.get(id).add(slot);
        }
        graph.parents.get(id)?.forEach((edge, side) =>
        {
            if (!edge || edge.parent === reference) return;
            const prefix = path === null ? null : path + side;
            const next = prefix === null ? slot : levels[prefix.length - 1][parseInt(prefix, 2)];
            for (const family of edge.families)
            {
                links.add(JSON.stringify([edge.parent, id, family]));
                const link = JSON.stringify([edge.parent, id, family, slot]);
                if (!transitions.has(link)) transitions.set(link, new Set());
                transitions.get(link).add(next);
            }
            queue.push({ id: edge.parent, slot: next, path: prefix?.length < split ? prefix : null });
        });
    }
    let collateralVisits = 0;
    if (includeCollateral)
    {
        const work = [...ancestor].flatMap(([id, slots]) => [...slots].map(slot => [id, slot]));
        for (let i = 0; i < work.length; i++)
        {
            const [id, slot] = work[i];
            collateralVisits++;
            for (const child of graph.children.get(id) || [])
            {
                if (child === reference || ancestor.has(child)) continue;
                if (!collateral.has(child)) collateral.set(child, new Set());
                const slots = collateral.get(child);
                if (slots.has(slot)) continue;
                slots.add(slot);
                work.push([child, slot]);
            }
        }
    }
    return { reference, origins, originIds, ancestor, collateral, transitions, links, visits: seen.size + collateralVisits };
}

function treeBranchSceneSlots(scene, resolution)
{
    const candidates = new Map(), outgoing = new Map();
    const people = scene.byOccurrence;
    const work = [];
    for (const card of scene.cards)
    {
        const person = card.canonicalPersonId || card.id;
        const slots = resolution.ancestor.get(person) || resolution.collateral.get(person);
        if (person === resolution.reference || (slots?.size === 1 && !(card.occurrenceCount > 1 && resolution.ancestor.has(person))))
        {
            const slot = person === resolution.reference ? 0 : [...slots][0];
            candidates.set(card.id, new Set([slot]));
            work.push([card.id, slot]);
        }
    }
    for (const family of scene.colorFamilies || [])
        for (const child of family.children)
            for (const parent of family.parents)
            {
                if (!people.has(child) || !(people.get(parent)?.occurrenceCount > 1)) continue;
                const key = JSON.stringify([people.get(parent).canonicalPersonId || parent,
                    people.get(child).canonicalPersonId || child, family.canonicalId]);
                if (!resolution.links.has(key)) continue;
                if (!outgoing.has(child)) outgoing.set(child, []);
                outgoing.get(child).push({ parent, family: family.canonicalId });
            }
    for (let i = 0; i < work.length; i++)
    {
        const [child, slot] = work[i];
        const childId = people.get(child).canonicalPersonId || child;
        for (const { parent, family } of outgoing.get(child) || [])
        {
            const person = people.get(parent).canonicalPersonId || parent;
            if (person === resolution.reference) continue;
            const next = resolution.transitions.get(JSON.stringify([person, childId, family, slot]));
            for (const parentSlot of next || [])
            {
                if (!candidates.has(parent)) candidates.set(parent, new Set());
                if (candidates.get(parent).has(parentSlot)) continue;
                candidates.get(parent).add(parentSlot);
                work.push([parent, parentSlot]);
            }
        }
    }
    // A shared visual context is unresolved if a participating ancestral child
    // cannot supply a branch. Propagate that uncertainty through repeated parents.
    const blocked = new Set([...outgoing.keys()].filter(id => !candidates.get(id)?.size));
    for (const child of blocked)
        for (const { parent } of outgoing.get(child) || []) blocked.add(parent);
    return new Map([...candidates].filter(([id, slots]) => !blocked.has(id) && slots.size === 1 && !slots.has(0))
        .map(([id, slots]) => [id, [...slots][0]]));
}

function treeBranchConnectionSlot(endpoints, slots)
{
    if (!endpoints || endpoints.length < 2) return 0;
    const slot = slots.get(endpoints[0]);
    return slot && endpoints.every(id => slots.get(id) === slot) ? slot : 0;
}

const treeBranchCache = new WeakMap();

function treeColorSettings(projectId, view)
{
    if (!view.colors)
    {
        const reference = sampleData.projects.find(project => project.id === projectId)?.defaultPersonId;
        view.colors = { reference: getPerson(reference)?.projectId === projectId ? reference : '',
            preset: 4, collateral: false, fill: view.colorFill === false ? 'neutral' : 'gender',
            outline: 'gender', connectors: 'neutral', palette: normalizeTreePalette() };
    }
    if (view.colors.reference && getPerson(view.colors.reference)?.projectId !== projectId)
        view.colors.reference = '';
    if (!view.colors.palette) view.colors.palette = normalizeTreePalette();
    return view.colors;
}

function treeBranchColor(slot)
{
    return slot ? 'var(--tree-branch-' + slot + ')' : 'var(--tree-branch-neutral)';
}

// Choose readable text on strongly colored overview labels. The category color
// is the same in every detail level; CSS still owns zoom-dependent mixing.
function treePaletteLabelInk(color)
{
    const channels = [1, 3, 5].map(offset =>
    {
        const value = parseInt(color.slice(offset, offset + 2), 16) / 255;
        return value <= 0.04045 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
    });
    const luminance = channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
    return luminance > 0.179 ? '#000000' : '#ffffff';
}

function applyTreePalette(runtime, palette)
{
    // Set both themes on the shell. CSS switches the aliases on theme changes,
    // including system-theme changes, without touching geometry or selection.
    if (runtime.appliedPalette === palette) return;
    runtime.appliedPalette = palette;
    for (const theme of ['light', 'dark'])
        for (const [key, color] of Object.entries(palette[theme]))
        {
            runtime.shell.style.setProperty('--tree-palette-' + theme + '-' + key, color);
            runtime.shell.style.setProperty('--tree-palette-' + theme + '-' + key + '-ink', treePaletteLabelInk(color));
        }
}

function refreshTreeColors(runtime)
{
    if (!runtime?.scene) return;
    const projectId = runtime.projectId;
    const view = treeProjectViewState(projectId);
    const settings = treeColorSettings(projectId, view);
    const enabled = [settings.fill, settings.outline, settings.connectors].includes('branch');
    applyTreePalette(runtime, settings.palette);
    runtime.workspace.dataset.treeFill = settings.fill;
    runtime.workspace.classList.add('has-color-fill');
    let cache = treeBranchCache.get(view);
    if (enabled && cache?.revision !== prototypeSessionEditRevision)
    {
        const graph = treeBranchGraph(getPeople(projectId), centralFamilyRecords().filter(family => family.projectId === projectId));
        if (!cache || graph.key !== cache.graph.key)
        {
            cache = { graph };
            treeBranchCache.set(view, cache);
        }
        cache.revision = prototypeSessionEditRevision;
    }
    let result;
    if (enabled)
    {
        const key = JSON.stringify([settings.reference, settings.preset, settings.collateral]);
        if (cache.key !== key)
        {
            cache.result = resolveTreeBranches(cache.graph, settings.reference, settings.preset, settings.collateral);
            cache.key = key;
        }
        result = cache.result;
    }
    if (runtime.branchScene !== runtime.scene || runtime.branchResult !== result)
    {
        runtime.branchScene = runtime.scene;
        runtime.branchResult = result;
        runtime.branchSlots = result ? treeBranchSceneSlots(runtime.scene, result) : new Map();
        runtime.branchRouteSlots = new Map();
    }
    runtime.branchSettings = settings;
    paintTreeColors(runtime);
}

function paintTreeColors(runtime)
{
    const settings = runtime.branchSettings;
    if (!settings) return;
    for (const card of runtime.cards.children)
    {
        const slot = runtime.branchSlots.get(card.__data__.id);
        const stamp = [settings.fill, settings.outline, slot, state.language].join('|');
        if (card.treeColorStamp === stamp && card.style.getPropertyValue('--tree-card-category')) continue;
        card.treeColorStamp = stamp;
        const category = mode => mode === 'gender' ? 'var(--tree-gender-border)'
            : treeBranchColor(mode === 'branch' ? slot : 0);
        const fill = category(settings.fill);
        card.style.setProperty('--tree-card-category', fill);
        card.style.setProperty('--tree-card-category-ink', settings.fill === 'gender' ? 'var(--tree-gender-ink)'
            : 'var(--tree-branch-' + (settings.fill === 'branch' && slot ? slot : 'neutral') + '-ink)');
        card.style.setProperty('--tree-outline-category', category(settings.outline));
        card.style.setProperty('--tree-placeholder-tint', fill);
        card.dataset.branchSlot = slot || '';
        if (settings.fill === 'branch' || settings.outline === 'branch')
            card.setAttribute('aria-description', slot ? t('Branch') + ' ' + slot : t('Neutral'));
        else card.removeAttribute('aria-description');
    }
    for (const node of runtime.lines.children)
    {
        const route = node.__data__;
        const routeSlots = runtime.branchRouteSlots;
        if (settings.connectors === 'branch' && !routeSlots.has(route.key))
        {
            const family = runtime.scene.colorFamilyById.get(route.familyOccurrenceId);
            const endpoints = family && (route.role === 'partner' ? family.parents : [...family.parents, ...family.children]);
            routeSlots.set(route.key, treeBranchConnectionSlot(endpoints, runtime.branchSlots));
        }
        const slot = settings.connectors === 'branch' ? routeSlots.get(route.key) : 0;
        if (node.treeBranchSlot === slot) continue;
        node.treeBranchSlot = slot;
        node.style.setProperty('--tree-branch-stroke', treeBranchColor(slot));
    }
}
