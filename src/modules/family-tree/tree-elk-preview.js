let treeElkRequest = null;

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
        frame.src = 'vendor/elkjs-0.10.0/layout.html';
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
            width: TREE_CARD_W, height: TREE_CARD_H })),
        families: semantic.families.map((family, index) => ({
            id: 'f' + index, parents: family.parents.map(id => ids.get(id)), children: family.children.map(id => ids.get(id))
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
        if (handled.has(family) || family?.parents.length === 2) continue;
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
            preferredPeer: person.preferredPeer, contextKey: person.contextKey,
            contextFamilyIds: person.contextFamilyIds, contextRoots: person.contextRoots,
            generation: person.generation, layoutX: x, layoutY: y, width, height });
        if (projection.branchRoles.focusActionPersonIds.has(record.id))
            focusControls.push({ personId: id, canonicalPersonId: record.id,
                x: x + width - TREE_FOCUS_CONTROL_W, y: y - TREE_FOCUS_CONTROL_H - TREE_FOCUS_CONTROL_GAP,
                width: TREE_FOCUS_CONTROL_W, height: TREE_FOCUS_CONTROL_H });
    }
    const connectorDescriptors = layout.paths.map(path =>
    {
        const family = /^f\d+$/.test(path.family) ? projection.families[Number(path.family.slice(1))] : null;
        const partner = path.role === 'parent' && layout.underpasses && !path.native;
        return { familyId: family?.id || path.family, points: path.points,
            d: treeConnectorPath(path.points), role: partner ? 'partner' : 'descendant',
            className: partner && family ? treePartnerConnectorClass(family) : partner ? 'tree-line partner' : 'tree-line descendant',
            childId: path.role === 'child' ? records.get(path.person)?.id : undefined };
    });
    return { stageWidth: Math.ceil(layout.width), stageHeight: Math.ceil(layout.height),
        positionedPeople, parentPlaceholders, focusControls, connectorDescriptors,
        diagnostics: [...layout.issues, ...model.deferred.map(item => item.reason)] };
}

function treeElkLayoutForProjection(projectId, projection, view)
{
    const expansion = new Map(view.ancestryExpansion);
    const key = JSON.stringify([projectId, projection.focusPersonId, view.ancestorGenerations,
        view.descendantGenerations, view.showCousins, projection.people.map(person => person.id),
        projection.families.map(({ id, left, right, children }) => [id, left, right, children]),
        [...projection.branchRoles.parentPresenceByPerson], [...expansion].sort()]);
    if (treeElkRequest?.key !== key)
    {
        disposeTreeElkLayout();
        const preview = { key };
        treeElkRequest = preview;
        // Defer even input errors until the pending presentation is mounted.
        Promise.resolve().then(async () =>
        {
            try
            {
                if (treeElkRequest !== preview) return;
                preview.model = prepareElkTreeInput(projection, expansion);
                preview.geometry = await solveElkTree(preview.model.people, preview.model.families, 'DOWN',
                    graph => calculateLocalElkGraph(preview, graph));
            }
            catch (error)
            {
                if (treeElkRequest !== preview) return;
                preview.error = true;
                console.warn('ELK layout:', error.message);
            }
            if (treeElkRequest === preview && state.activeModule === 'Family Tree'
                && currentFamilyTreeProjectId() === projectId)
                renderFamilyTree();
        });
    }
    return treeElkRequest.geometry ? adaptElkTreeLayout(treeElkRequest.model, treeElkRequest.geometry, projection) : null;
}
