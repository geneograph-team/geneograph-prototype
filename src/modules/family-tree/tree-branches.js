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
    // Resolve descendants from the reference, not from the current viewport
    // or the collateral traversal. Ancestor membership wins if a malformed
    // cyclic graph makes a person both ancestor and descendant.
    const descendants = new Set();
    const descendantWork = graph.ids.has(reference) ? [reference] : [];
    if (descendantWork.length) descendants.add(reference);
    for (let i = 0; i < descendantWork.length; i++)
        for (const child of graph.children.get(descendantWork[i]) || [])
        {
            if (descendants.has(child)) continue;
            descendants.add(child);
            descendantWork.push(child);
        }
    for (const id of ancestor.keys()) descendants.delete(id);
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
                if (child === reference || ancestor.has(child) || descendants.has(child)) continue;
                if (!collateral.has(child)) collateral.set(child, new Set());
                const slots = collateral.get(child);
                if (slots.has(slot)) continue;
                slots.add(slot);
                work.push([child, slot]);
            }
        }
    }
    return { reference, origins, originIds, ancestor, descendants, collateral, transitions, links,
        visits: seen.size + descendantWork.length + collateralVisits };
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
        if (person === resolution.reference || resolution.descendants.has(person)
            || (slots?.size === 1 && !(card.occurrenceCount > 1 && resolution.ancestor.has(person))))
        {
            const slot = person === resolution.reference ? 0 : resolution.descendants.has(person) ? 'descendants' : [...slots][0];
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
    return new Map([...candidates].filter(([id, slots]) => !blocked.has(id) && slots.size === 1)
        .map(([id, slots]) => [id, slots.has(0) ? 'descendants' : [...slots][0]]));
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

function treeBranchColor(slot, role = '')
{
    return 'var(--tree-branch-' + (slot || 'neutral') + role + ')';
}

function treePaletteLinearRgb(color)
{
    return [1, 3, 5].map(offset =>
    {
        const value = parseInt(color.slice(offset, offset + 2), 16) / 255;
        return value <= 0.04045 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
    });
}

function treePaletteLuminance(color)
{
    const [r, g, b] = treePaletteLinearRgb(color);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function treePaletteContrast(a, b)
{
    const x = treePaletteLuminance(a), y = treePaletteLuminance(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

function treePaletteLabelInk(color)
{
    return treePaletteLuminance(color) > 0.179 ? '#000000' : '#ffffff';
}

// OKLab coordinates; scaling the chromatic axes together preserves hue.
function treePaletteLab(color)
{
    const [r, g, b] = treePaletteLinearRgb(color);
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    return [0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
        1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
        0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s];
}

function treePaletteTone(lab, lightness, chromaScale, chromaLimit)
{
    const chroma = Math.hypot(lab[1], lab[2]);
    const scale = chroma ? Math.min(chromaScale, chromaLimit / chroma) : 0;
    const rgb = factor =>
    {
        const a = lab[1] * scale * factor, b = lab[2] * scale * factor;
        const l = Math.pow(lightness + 0.3963377774 * a + 0.2158037573 * b, 3);
        const m = Math.pow(lightness - 0.1055613458 * a - 0.0638541728 * b, 3);
        const s = Math.pow(lightness - 0.0894841775 * a - 1.2914855480 * b, 3);
        return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
            -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
            -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s];
    };
    const inGamut = values => values.every(value => value >= -1e-7 && value <= 1 + 1e-7);
    let values = rgb(1);
    if (!inGamut(values))
    {
        let low = 0, high = 1;
        for (let i = 0; i < 16; i++)
        {
            const middle = (low + high) / 2;
            if (inGamut(rgb(middle))) low = middle;
            else high = middle;
        }
        values = rgb(low);
    }
    return '#' + values.map(value =>
    {
        value = Math.min(1, Math.max(0, value));
        const encoded = value <= 0.0031308 ? 12.92 * value : 1.055 * Math.pow(value, 1 / 2.4) - 0.055;
        return Math.round(encoded * 255).toString(16).padStart(2, '0');
    }).join('');
}

// Derive bounded presentation tones only when the palette changes. The
// editable hex remains the base, not a separately stored surface or outline.
function treePaletteTones(color, theme)
{
    const lab = treePaletteLab(color), dark = theme === 'dark';
    const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
    const canvas = dark ? '#0b0f0e' : '#f1f2f3';
    const secondary = dark ? '#26352d' : '#515e63';
    const surface = (lightness, scale, cap) =>
    {
        let tone = treePaletteTone(lab, lightness, scale, cap);
        // Reserve contrast for the subtle hover lift toward primary text.
        for (let i = 0; i < 20 && treePaletteContrast(tone, secondary) < 5; i++)
        {
            lightness = Math.min(0.995, lightness + 0.01);
            tone = treePaletteTone(lab, lightness, scale, cap);
        }
        return tone;
    };
    const overviewL = clamp(lab[0], dark ? 0.58 : 0.70, dark ? 0.92 : 0.995);
    const overview = overviewL === lab[0] ? color : treePaletteTone(lab, overviewL, 1, 0.32);
    const lightSurface = Math.max(0, lab[0] - 0.945);
    // Dark canvas, luminous cards: retain the relative hue and lightness
    // differences of the approved base palette instead of forcing a dark tint.
    const luminousL = clamp(lab[0], 0.74, 0.91);
    const detail = surface(dark ? Math.min(0.94, luminousL + 0.035) : 0.945 + lightSurface,
        dark ? 0.78 : 0.46, dark ? 0.18 : 0.065);
    const compact = surface(dark ? Math.min(0.93, luminousL + 0.02) : 0.915 + lightSurface,
        dark ? 0.88 : 0.60, dark ? 0.20 : 0.085);
    const actions = surface(dark ? Math.min(0.92, luminousL + 0.005) : 0.885 + lightSurface,
        dark ? 0.96 : 0.75, dark ? 0.22 : 0.10);
    const outline = treePaletteTone(lab, dark ? clamp(lab[0], 0.82, 0.90) : 0.51, 1, 0.18);
    // Preserve the approved overview outline; a deeper same-hue outline
    // stays readable against a luminous detailed card.
    const detailOutline = dark ? treePaletteTone(lab, 0.39, 1, 0.13) : outline;
    let connectorL = dark ? clamp(lab[0], 0.56, 0.70) : 0.55;
    let connector = treePaletteTone(lab, connectorL, 0.85, 0.15);
    for (let i = 0; i < 20 && treePaletteContrast(connector, canvas) < 3; i++)
    {
        connectorL += dark ? 0.01 : -0.01;
        connector = treePaletteTone(lab, connectorL, 0.85, 0.15);
    }
    // Portrait initials are visible at full/short detail. Derive a stronger
    // same-hue tint from the actual detail surface, not the actions fill.
    // Keep dark initials readable even for arbitrary custom RGB bases.
    const avatarInk = dark ? '#14221c' : '#202729';
    let avatarL = treePaletteLab(detail)[0] - 0.15;
    let avatar = treePaletteTone(lab, avatarL, 1, 0.16);
    for (let i = 0; i < 20 && treePaletteContrast(avatar, avatarInk) < 4.5; i++)
    {
        avatarL += 0.01;
        avatar = treePaletteTone(lab, avatarL, 1, 0.16);
    }
    return { overview, detail, compact, actions, avatar, outline, 'detail-outline': detailOutline,
        connector, ink: treePaletteLabelInk(overview) };
}

function applyTreePalette(runtime, palette)
{
    // Both themes live on the shell; CSS switches aliases without repainting
    // geometry or recomputing colors on viewport gestures.
    if (runtime.appliedPalette === palette) return;
    runtime.appliedPalette = palette;
    for (const theme of ['light', 'dark'])
        for (const [key, color] of Object.entries(palette[theme]))
        {
            const prefix = '--tree-palette-' + theme + '-' + key;
            for (const [role, value] of Object.entries(treePaletteTones(color, theme)))
                runtime.shell.style.setProperty(prefix + (role === 'overview' ? '' : '-' + role), value);
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
        const category = (mode, role = '') => mode === 'gender' ? 'var(--tree-gender-tone' + role + ')'
            : treeBranchColor(mode === 'branch' ? slot : 0, role);
        for (const role of ['', '-detail', '-compact', '-actions', '-avatar', '-ink'])
            card.style.setProperty('--tree-card-category' + role, category(settings.fill, role));
        card.style.setProperty('--tree-outline-category', category(settings.outline, '-outline'));
        card.style.setProperty('--tree-outline-detail-category', category(settings.outline, '-detail-outline'));
        card.dataset.branchSlot = slot || '';
        if (settings.fill === 'branch' || settings.outline === 'branch')
            card.setAttribute('aria-description', slot === 'descendants' ? t('Reference & descendants')
                : slot ? t('Branch') + ' ' + slot : t('Neutral'));
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
        node.style.setProperty('--tree-branch-stroke', treeBranchColor(slot, '-connector'));
    }
}
