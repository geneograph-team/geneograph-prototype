let treeElkRequest = null;
const treeElkOrientationCache = new Map();

function disposeTreeElkLayout()
{
    const previous = treeElkRequest;
    treeElkRequest = null;
    previous?.cancel?.();
}

function calculateLocalElkGraph(preview, graph)
{
    return new Promise((resolve, reject) =>
    {
        if (preview !== treeElkRequest) return reject(new Error('Layout superseded'));
        const frame = document.createElement('iframe');
        frame.hidden = true;
        frame.title = 'Local graph layout';
        frame.src = 'vendor/elkjs-0.12.1/layout.html';
        function finish(error, layout)
        {
            clearTimeout(timeout);
            window.removeEventListener('message', receive);
            frame.remove();
            preview.cancel = null;
            if (error) reject(new Error(error));
            else resolve(layout);
        }
        function receive(event)
        {
            if (event.source !== frame.contentWindow) return;
            if (event.data?.type === 'layout-ready')
                frame.contentWindow.postMessage({ type: 'layout-graph', id: 1, graph }, '*');
            else if (event.data?.type === 'layout-result' && event.data.id === 1)
                finish(event.data.error, event.data.layout);
        }
        const timeout = setTimeout(() => finish('ELK layout timed out'), 45000);
        preview.cancel = () => finish('Layout superseded');
        window.addEventListener('message', receive);
        document.body.append(frame);
    });
}

function prepareElkTreeInput(projection, preferences)
{
    const genderById = new Map(projection.people.map(person => [person.id, person.gender]));
    const semantic = projectElkTreeOccurrences(
        projection.people.map(({ id }) => ({ id })),
        projection.families.map(family => ({ id: family.id,
            parents: [family.left, family.right].filter(Boolean), children: family.children })),
        preferences
    );
    // Stable canonical context stays in the presentation. Only anonymous IDs
    // and geometry are passed into the solver frame.
    const ids = new Map(semantic.people.map((person, index) => [person.id, 'p' + index]));
    const model = {
        ...semantic,
        people: semantic.people.map(person => ({ ...person, id: ids.get(person.id),
            gender: genderById.get(person.personId), width: TREE_CARD_W, height: TREE_CARD_H,
            focusClearance: projection.branchRoles.focusActionPersonIds?.has(person.personId)
                ? TREE_FOCUS_CONTROL_H + TREE_FOCUS_CONTROL_GAP : 0 })),
        families: semantic.families.map((family, index) => ({
            id: 'f' + index, canonicalFamilyId: family.canonicalFamilyId, familyOccurrenceId: family.familyOccurrenceId,
            parents: family.parents.map(id => ids.get(id)), children: family.children.map(id => ids.get(id))
        }))
    };
    const relations = new Map(model.people.map(person => [person.id, []]));
    function connect(a, b, step)
    {
        relations.get(a).push([b, step]);
        relations.get(b).push([a, -step]);
    }
    for (const family of model.families)
    {
        if (family.parents.length === 2) connect(...family.parents, 0);
        for (const child of family.children) connect(family.parents[0], child, 1);
    }
    const focus = model.people.find(person => person.personId === projection.focusPersonId && person.primary)?.id;
    model.focusId = focus;
    const generations = new Map([[focus, 0]]);
    const queue = [focus];
    for (const id of queue)
    {
        for (const [other, step] of relations.get(id))
        {
            const generation = generations.get(id) + step;
            if (!generations.has(other))
            {
                generations.set(other, generation);
                queue.push(other);
            }
            else if (generations.get(other) !== generation)
                throw new Error('Visible relationships require incompatible generations');
        }
    }
    if (generations.size !== model.people.length)
        throw new Error('The visible tree contains disconnected people');

    const parentFamilies = new Map();
    for (const family of model.families)
        for (const child of family.children)
            if (!parentFamilies.has(child)) parentFamilies.set(child, family);
    const handled = new Set();
    const occurrences = new Map(model.people.map(person => [person.id, person]));
    for (const person of model.people.slice())
    {
        if (person.occurrenceCount > 1 && (person.hasParents ? !person.expanded : !person.primary)) continue;
        const canonicalId = person.personId;
        const presence = projection.branchRoles.parentPresenceByPerson.get(canonicalId);
        const generation = generations.get(person.id) - 1;
        if (!presence || -generation > projection.branchRoles.ancestorGenerations) continue;
        const roles = ['father', 'mother'].filter(role => !presence[role]);
        if (!roles.length) continue;
        let family = parentFamilies.get(person.id);
        if (handled.has(family) || family?.parents.length === 2
            || family?.parents.some(id => occurrences.get(id)?.occurrenceCount > 1)) continue;
        if (!family)
        {
            family = { id: 'placeholder-family-' + person.id, parents: [], children: [person.id] };
            model.families.push(family);
        }
        handled.add(family);
        for (const rel of roles)
        {
            const id = person.id + '-missing-' + rel;
            generations.set(id, generation);
            family.parents[rel === 'father' ? 'unshift' : 'push'](id);
            model.people.push({ id, width: treeParentPlaceholderWidth(roles.length),
                height: roles.length === 1 ? TREE_CARD_H : TREE_GEOMETRY.parentPlaceholderHeight,
                placeholder: { personId: canonicalId, rel, label: rel === 'father' ? 'Add father' : 'Add mother' } });
        }
    }
    const minimum = Math.min(...generations.values());
    for (const person of model.people) person.generation = generations.get(person.id) - minimum;
    return model;
}

// Resolve anonymous layout IDs only in the application, never in the solver frame.
function describeElkTreeDiagnostics(model, layout, projection)
{
    const canonical = new Map(projection.people.map(p => [p.id, p]));
    const occurrences = new Map(model.people.map(p => [p.id, p]));
    const families = new Map(model.families.map(f => [f.id, f]));
    const originalFamilies = new Map(projection.families.map(f => [f.id, f]));
    const orderDetails = new Map((layout.orderDetails || []).map(d => [d.message, d]));
    const name = id => canonical.get(id)?.name || canonical.get(id)?.compactName || id;
    const label = id =>
    {
        const person = occurrences.get(id);
        if (person?.placeholder)
            return t(person.placeholder.label) + ' — ' + translateText(name(person.placeholder.personId));
        return person ? translateText(name(person.personId)) : translateText(name(id));
    };
    const subjects = ids => [...new Set(ids.map(label))].join(' / ');
    const diagnostics = [];
    for (const message of layout.issues)
    {
        const order = orderDetails.get(message);
        const suffix = message.slice(message.indexOf(': ') + 2);
        const family = order ? families.get(order.familyId) : [...families.values()]
            .find(f => suffix === f.id || suffix.startsWith(f.id + ':'));
        const person = [...occurrences.keys()].find(id => suffix === id || suffix.startsWith(id + ':'));
        const group = suffix.startsWith('group:') ? layout.groups.find(g => g.id === suffix) : null;
        const ids = order?.personIds || (family ? [...family.parents, ...family.children]
            : person ? [person] : group ? layout.boxes.filter(b => b.x >= group.x && b.y >= group.y
                && b.x + b.w <= group.x + group.w + .02 && b.y + b.h <= group.y + group.h + .02).map(b => b.id) : []);
        diagnostics.push({
            subject: subjects(ids),
            reason: t(order ? 'Preferred parent or principal partner order was not achieved.'
                : 'The layout could not safely position or connect this relationship.'),
            technical: order ? '' : message
        });
    }
    for (const item of model.deferred)
    {
        const family = originalFamilies.get(item.familyId);
        const ids = item.personId ? [item.personId] : family ? [family.left, family.right, ...family.children].filter(Boolean) : [];
        diagnostics.push({
            subject: [...new Set(ids.map(id => translateText(name(id))))].join(' / '),
            reason: t(item.personId ? 'Overlapping or incomplete co-parent contexts were retained without splitting.'
                : 'Overlapping sibling or alternative parent contexts were retained without splitting.'),
            technical: ''
        });
    }
    return diagnostics;
}

function adaptElkTreeLayout(model, layout, projection)
{
    const boxes = new Map(layout.boxes.map(box => [box.id, box]));
    const canonical = new Map(projection.people.map(person => [person.id, person]));
    const records = new Map(model.people.filter(person => !person.placeholder)
        .map(person => [person.id, canonical.get(person.personId)]));
    const positionedPeople = [];
    const parentPlaceholders = [];
    const focusControls = [];
    for (const person of model.people)
    {
        const { x, y, w: width, h: height } = boxes.get(person.id);
        if (person.placeholder)
        {
            parentPlaceholders.push({ ...person.placeholder, id: person.id, x, y, width, height });
            continue;
        }
        const record = records.get(person.id);
        const id = person.occurrenceId;
        positionedPeople.push({ ...record, id, canonicalPersonId: record.id, primary: person.primary,
            occurrenceCount: person.occurrenceCount, hasParents: person.hasParents, expanded: person.expanded,
            preferredContext: person.preferredContext, contextKey: person.contextKey,
            contextFamilyIds: person.contextFamilyIds, contextFamilyOccurrenceIds: person.contextFamilyOccurrenceIds, contextRoots: person.contextRoots,
            generation: person.generation, layoutX: x, layoutY: y, width, height });
        if (projection.branchRoles.focusActionPersonIds.has(record.id))
            focusControls.push({ personId: id, canonicalPersonId: record.id,
                x: x + width - TREE_FOCUS_CONTROL_W, y: y - TREE_FOCUS_CONTROL_H - TREE_FOCUS_CONTROL_GAP,
                width: TREE_FOCUS_CONTROL_W, height: TREE_FOCUS_CONTROL_H });
    }
    const semanticFamilies = new Map(model.families.map(family => [family.id, family]));
    const canonicalFamilies = new Map(projection.families.map(family => [family.id, family]));
    const connectorDescriptors = layout.paths.map(path =>
    {
        const occurrence = semanticFamilies.get(path.family);
        const family = canonicalFamilies.get(occurrence?.canonicalFamilyId);
        const partner = path.role === 'parent' && layout.underpasses && !path.native;
        return { familyId: family?.id || path.family, familyOccurrenceId: occurrence?.familyOccurrenceId || path.family, points: path.points,
            d: treeConnectorPath(path.points), role: partner ? 'partner' : 'descendant',
            className: partner && family ? treePartnerConnectorClass(family) : partner ? 'tree-line partner' : 'tree-line descendant',
            childId: path.role === 'child' ? records.get(path.person)?.id : undefined };
    });
    const occurrenceIds = new Map(model.people.map(person => [person.id, person.occurrenceId || person.id]));
    const colorFamilies = model.families.map(family => ({
        id: family.familyOccurrenceId || family.id,
        canonicalId: family.canonicalFamilyId,
        parents: family.parents.map(id => occurrenceIds.get(id)),
        children: family.children.map(id => occurrenceIds.get(id))
    }));
    return { orientation: layout.direction === 'RIGHT' ? 'horizontal' : 'vertical',
        stageWidth: Math.ceil(layout.width), stageHeight: Math.ceil(layout.height), colorFamilies,
        positionedPeople, parentPlaceholders, focusControls, connectorDescriptors,
        diagnostics: describeElkTreeDiagnostics(model, layout, projection) };
}

function treeElkLayoutForProjection(projectId, projection, view)
{
    const expansion = new Map(view.ancestryExpansion);
    const orientation = view.orientation === 'horizontal' ? 'horizontal' : 'vertical';
    const direction = orientation === 'horizontal' ? 'RIGHT' : 'DOWN';
    const key = JSON.stringify([projectId, orientation, projection.focusPersonId, view.ancestorGenerations,
        view.descendantGenerations, view.showCousins, projection.people.map(person => [person.id, person.gender]),
        projection.families.map(({ id, left, right, children }) => [id, left, right, children]),
        [...projection.branchRoles.parentPresenceByPerson], [...expansion].sort()]);
    if (treeElkRequest?.key !== key)
    {
        disposeTreeElkLayout();
        const cached = treeElkOrientationCache.get(orientation);
        const preview = { key, projection, orientation, ...(cached?.key === key ? cached : {}) };
        treeElkRequest = preview;
        // Defer even input errors until the pending presentation is mounted.
        if (!preview.geometry) Promise.resolve().then(async () =>
        {
            try
            {
                if (treeElkRequest !== preview) return;
                preview.model = prepareElkTreeInput(projection, expansion);
                preview.geometry = await solveElkTree(preview.model.people, preview.model.families, direction,
                    graph => calculateLocalElkGraph(preview, graph), preview.model.focusId);
                if (treeElkRequest !== preview) return;
                treeElkOrientationCache.set(orientation, { key, model: preview.model, geometry: preview.geometry });
            }
            catch (error)
            {
                if (treeElkRequest !== preview) return;
                preview.error = true;
                console.warn('ELK layout:', error.message);
            }
            if (treeElkRequest === preview && state.activeModule === 'Family Tree'
                && currentFamilyTreeProjectId() === projectId)
                renderFamilyTree(preview.projection);
        });
    }
    treeElkRequest.projection = projection;
    return treeElkRequest.geometry ? adaptElkTreeLayout(treeElkRequest.model, treeElkRequest.geometry, projection) : null;
}
