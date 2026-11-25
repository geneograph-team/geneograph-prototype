function treeSceneRect(x, y, width, height)
{
    return { left: x, top: y, right: x + width, bottom: y + height };
}

function treeSceneIntersects(a, b)
{
    return a.right >= b.left && b.right >= a.left && a.bottom >= b.top && b.bottom >= a.top;
}

function treeSceneViewport(transform, width, height, margin = 0)
{
    return treeSceneRect((-transform.x - margin) / transform.k, (-transform.y - margin) / transform.k,
        (width + 2 * margin) / transform.k, (height + 2 * margin) / transform.k);
}

function treeSceneFit(bounds, width, height)
{
    const k = Math.max(Number.EPSILON, Math.min(1.8,
        Math.max(1, width - 32) / Math.max(1, bounds.right - bounds.left),
        Math.max(1, height - 32) / Math.max(1, bounds.bottom - bounds.top)));
    return { k, x: (width - (bounds.left + bounds.right) * k) / 2,
        y: (height - (bounds.top + bounds.bottom) * k) / 2 };
}

function treeScenePathBounds(points)
{
    return {
        left: Math.min(...points.map(p => p.x)), right: Math.max(...points.map(p => p.x)),
        top: Math.min(...points.map(p => p.y)), bottom: Math.max(...points.map(p => p.y))
    };
}

function treeRoundedConnector(points, clearance)
{
    if (points.length < 2) return '';
    const point = p => p.x + ' ' + p.y;
    let path = 'M' + point(points[0]);
    for (let i = 1; i < points.length - 1; i++)
    {
        const a = points[i - 1], b = points[i], c = points[i + 1];
        const elbow = (a.x === b.x && b.y === c.y && a.y !== b.y && b.x !== c.x)
            || (a.y === b.y && b.x === c.x && a.x !== b.x && b.y !== c.y);
        const radius = elbow ? Math.min(10, Math.hypot(a.x - b.x, a.y - b.y) / 2,
            Math.hypot(c.x - b.x, c.y - b.y) / 2) : 0;
        const before = { x: b.x + Math.sign(a.x - b.x) * radius, y: b.y + Math.sign(a.y - b.y) * radius };
        const after = { x: b.x + Math.sign(c.x - b.x) * radius, y: b.y + Math.sign(c.y - b.y) * radius };
        path += radius >= 2 && clearance(treeScenePathBounds([before, b, after]))
            ? ' L' + point(before) + ' Q' + point(b) + ' ' + point(after)
            : ' L' + point(b);
    }
    return path + ' L' + point(points.at(-1));
}

function treeConnectorRouteChains(descriptors)
{
    const groups = new Map();
    const routes = [];
    const partnerOrdinals = new Map();
    for (const descriptor of descriptors)
    {
        const family = descriptor.familyOccurrenceId || descriptor.familyId;
        const key = JSON.stringify([family, descriptor.className]);
        if (descriptor.role === 'partner')
        {
            const ordinal = partnerOrdinals.get(key) || 0;
            partnerOrdinals.set(key, ordinal + 1);
            routes.push({ ...descriptor, key: key + ':partner:' + ordinal });
            continue;
        }
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(descriptor);
    }
    for (const [key, group] of groups)
    {
        const segments = group.flatMap(({ points }) => points.slice(1).map((b, i) => ({ a: points[i], b })))
            .filter(({ a, b }) => a.x !== b.x || a.y !== b.y);
        const nodes = new Map();
        const vertex = p =>
        {
            const id = p.x + ',' + p.y;
            if (!nodes.has(id)) nodes.set(id, { p, neighbors: new Set() });
            return nodes.get(id);
        };
        // Split coincident rails at the attachment vertices first. The explicit
        // graph retains degree-three feeds and interior child stems as square Ts.
        for (const { a, b } of segments)
        {
            const axis = a.x === b.x ? 'y' : a.y === b.y ? 'x' : null;
            const cross = axis === 'x' ? 'y' : 'x';
            const points = [a, b];
            if (axis)
            {
                for (const segment of segments)
                    for (const p of [segment.a, segment.b])
                        if (p[cross] === a[cross] && p[axis] > Math.min(a[axis], b[axis])
                            && p[axis] < Math.max(a[axis], b[axis])) points.push(p);
                points.sort((p, q) => p[axis] - q[axis]);
            }
            for (let i = 1; i < points.length; i++)
            {
                const left = vertex(points[i - 1]), right = vertex(points[i]);
                if (left === right) continue;
                left.neighbors.add(right);
                right.neighbors.add(left);
            }
        }
        const childEndpoints = new Map();
        for (const descriptor of group)
        {
            const endpoint = descriptor.points.at(-1);
            if (endpoint && descriptor.childId)
                childEndpoints.set(endpoint.x + ',' + endpoint.y, descriptor.childId);
        }
        let ordinal = 0;
        function walk(first)
        {
            for (const neighbor of first.neighbors)
            {
                const points = [first.p];
                let previous = first, current = neighbor;
                while (current)
                {
                    previous.neighbors.delete(current);
                    current.neighbors.delete(previous);
                    points.push(current.p);
                    const next = current.junction || current.neighbors.size !== 1 ? null : current.neighbors.values().next().value;
                    previous = current;
                    current = next;
                }
                const childIds = [...new Set([points[0], points.at(-1)]
                    .map(p => childEndpoints.get(p.x + ',' + p.y)).filter(Boolean))];
                routes.push({ ...group[0], key: key + ':' + ordinal++, points, childIds });
            }
        }
        for (const node of nodes.values()) node.junction = node.neighbors.size !== 2;
        for (const node of nodes.values()) if (node.junction) walk(node);
        for (const node of nodes.values()) walk(node);
    }
    return routes;
}

function treeSceneConnectors(descriptors, obstacles, horizontal = false)
{
    const routes = treeConnectorRouteChains(descriptors);
    const familyOf = route => route.familyOccurrenceId || route.familyId;
    const cross = horizontal ? 'y' : 'x';
    const depth = horizontal ? 'x' : 'y';
    const segments = routes.flatMap(route => route.points.slice(1).map((b, i) =>
        ({ a: route.points[i], b, family: familyOf(route), bounds: treeScenePathBounds([route.points[i], b]) })));
    const halfGap = TREE_GEOMETRY.connectorLaneGap / 2;
    return routes.map(route =>
    {
        const { points } = route;
        if (route.role === 'partner') return { ...route, bounds: treeScenePathBounds(points) };
        const related = familyOf(route);
        const pieces = [[points[0]]];
        for (let i = 1; i < points.length; i++)
        {
            const a = points[i - 1], b = points[i];
            if (a[depth] === b[depth] && a[cross] !== b[cross])
            {
                const sign = Math.sign(b[cross] - a[cross]);
                const length = Math.abs(b[cross] - a[cross]);
                const marks = segments.filter(s => s.family !== related && s.a[cross] === s.b[cross]
                    && a[depth] > Math.min(s.a[depth], s.b[depth]) && a[depth] < Math.max(s.a[depth], s.b[depth]))
                    .map(s => sign * (s.a[cross] - a[cross]))
                    .filter(d => d > halfGap && d < length - halfGap).sort((x, y) => x - y);
                for (let j = 0; j < marks.length; j++)
                {
                    const start = marks[j] - halfGap;
                    let end = marks[j] + halfGap;
                    while (marks[j + 1] - halfGap <= end) end = marks[++j] + halfGap;
                    pieces.at(-1).push({ ...a, [cross]: a[cross] + sign * start });
                    pieces.push([{ ...a, [cross]: a[cross] + sign * end }]);
                }
            }
            pieces.at(-1).push(b);
        }
        const safe = rect => !obstacles.some(box => treeSceneIntersects(rect, box))
            && !segments.some(segment => segment.family !== related && treeSceneIntersects(rect, segment.bounds));
        return { ...route, bounds: treeScenePathBounds(points), d: pieces.map(points => treeRoundedConnector(points, safe)).join(' ') };
    });
}

function createTreeRenderScene(layout)
{
    const cards = layout.positionedPeople.map(person => ({ ...person, key: person.id,
        bounds: treeSceneRect(person.layoutX, person.layoutY, person.width, person.height) }));
    const placeholders = layout.parentPlaceholders.map(parent => ({ ...parent, key: parent.id,
        bounds: treeSceneRect(parent.x, parent.y, parent.width, parent.height) }));
    const controls = layout.focusControls.map(control => ({ ...control, key: control.personId,
        bounds: treeSceneRect(control.x, control.y, control.width, control.height) }));
    const collisionBoxes = [...cards, ...placeholders, ...controls].map(node => node.bounds);
    const paths = treeSceneConnectors(layout.connectorDescriptors, collisionBoxes, layout.orientation === 'horizontal');
    for (const path of paths)
    {
        path.segmentBounds = path.points.slice(1).map((end, index) =>
        {
            const bounds = treeScenePathBounds([path.points[index], end]);
            // A rounded elbow can enter the corner of the former segment box.
            return { left: bounds.left - 10, top: bounds.top - 10, right: bounds.right + 10, bottom: bounds.bottom + 10 };
        });
    }
    const bounds = [...collisionBoxes, ...paths.map(path => path.bounds)].reduce((rect, next) => ({
        left: Math.min(rect.left, next.left), right: Math.max(rect.right, next.right),
        top: Math.min(rect.top, next.top), bottom: Math.max(rect.bottom, next.bottom)
    }), { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity });
    return { cards, placeholders, controls, paths, bounds,
        width: layout.stageWidth, height: layout.stageHeight,
        byOccurrence: new Map(cards.map(card => [card.id, card])),
        primaryByPerson: new Map(cards.filter(card => card.primary !== false)
            .map(card => [card.canonicalPersonId || card.id, card])) };
}

function joinTreeHtml(layer, entries, tag, render)
{
    d3.select(layer).selectAll(function () { return this.children; }).data(entries, entry => entry.key)
        .join(enter => enter.append(tag))
        .each(function (entry)
        {
            const markup = render(entry);
            if (this.treeMarkup === markup) return;
            const focusedControl = this.contains(document.activeElement) && document.activeElement !== this;
            const template = document.createElement('template');
            template.innerHTML = markup.trim();
            const source = template.content.firstElementChild;
            for (const attribute of [...this.attributes])
                if (!source.hasAttribute(attribute.name)) this.removeAttribute(attribute.name);
            for (const attribute of source.attributes) this.setAttribute(attribute.name, attribute.value);
            if (this.treeInner !== source.innerHTML)
            {
                this.innerHTML = source.innerHTML;
                this.treeInner = source.innerHTML;
                if (focusedControl) this.focus({ preventScroll: true });
            }
            this.treeMarkup = markup;
        });
}

function renderTreeViewport(runtime)
{
    if (!runtime.scene) return;
    const { canvas, stage, transform, scene } = runtime;
    const visible = treeSceneViewport(transform, canvas.clientWidth, canvas.clientHeight);
    const viewport = treeSceneViewport(transform, canvas.clientWidth, canvas.clientHeight, 96);
    const detail = treeDetailLevel(transform.k);
    stage.style.transform = 'translate(' + transform.x + 'px, ' + transform.y + 'px) scale(' + transform.k + ')';
    const activeAction = document.activeElement?.closest('.card-actions');
    if ((detail === 'label' || detail === 'marker') && stage.contains(activeAction))
        activeAction.closest('.tree-person-card').focus({ preventScroll: true });
    stage.dataset.detailLevel = detail;
    stage.dataset.singleInitial = String(54 * transform.k < 44);
    stage.dataset.compactParent = String(transform.k < .76);
    stage.dataset.hideFocus = String(transform.k <= .60);
    stage.style.setProperty('--tree-overview-connection-width', 1.5 / transform.k + 'px');
    stage.style.setProperty('--tree-overview-parent-border-width', 1 / transform.k + 'px');
    stage.style.setProperty('--tree-overview-plus-size', Math.min(70, 15 / transform.k) + 'px');
    stage.style.setProperty('--tree-overview-name-size', Math.min(78, Math.max(25, 11 / transform.k)) + 'px');
    runtime.shell.querySelector('.zoom-value').textContent = Math.round(transform.k * 100) + '%';

    const active = document.activeElement;
    const focusedKey = stage.contains(active) ? active.closest('[data-tree-occurrence-id]')?.dataset.treeOccurrenceId : null;
    const isVisible = entry => treeSceneIntersects(viewport, entry.bounds);
    const cards = scene.cards.filter(entry => entry.key === focusedKey || isVisible(entry));
    const generation = runtime.contentRevision;
    joinTreeHtml(runtime.cards, cards, 'article', entry =>
    {
        const contentKey = generation + '|' + (state.selectedPersonId === (entry.canonicalPersonId || entry.id));
        if (entry.markupKey !== contentKey)
        {
            entry.markup = renderTreePersonCard(entry);
            entry.markupKey = contentKey;
        }
        return entry.markup;
    });
    updateTreePortraits(runtime, visible, detail, .75);
    if (focusedKey && document.activeElement === document.body)
        runtime.cards.querySelector('[data-tree-occurrence-id="' + CSS.escape(focusedKey) + '"]')?.focus({ preventScroll: true });
    const controls = transform.k > .60 ? scene.controls.filter(isVisible) : [];
    if (active?.matches('.tree-focus-control, .add-parent-card')
        && stage.contains(active) && ![...controls, ...scene.placeholders.filter(isVisible)].some(entry =>
            Number.parseFloat(active.style.left) === entry.bounds.left && Number.parseFloat(active.style.top) === entry.bounds.top))
        canvas.focus({ preventScroll: true });
    joinTreeHtml(runtime.placeholders, scene.placeholders.filter(isVisible), 'button', renderTreeParentPlaceholder);
    joinTreeHtml(runtime.controls, controls, 'button', renderTreeFocusControl);
    d3.select(runtime.lines).selectAll('path').data(scene.paths.filter(path => path.segmentBounds.some(bounds => treeSceneIntersects(viewport, bounds))), path => path.key).join('path')
        .attr('class', path => path.className).attr('data-tree-family-id', path => path.familyId)
        .attr('data-tree-connection-role', path => path.role)
        .attr('data-tree-family-occurrence-id', path => path.familyOccurrenceId || path.familyId)
        .attr('data-tree-child-id', path => path.childIds?.length === 1 ? path.childIds[0] : null)
        .attr('data-tree-child-ids', path => path.childIds?.length > 1 ? JSON.stringify(path.childIds) : null)
        .attr('d', path => path.d);
}
function bindTreeRenderer(runtime)
{
    const { shell, controller } = runtime;
    const { signal } = controller;
    shell.addEventListener('click', event =>
    {
        if (event.defaultPrevented || event.target.closest('.tree-inspector')) return;
        const button = event.target.closest('button');
        const card = event.target.closest('.tree-person-card');
        const personId = card?.dataset.personId;
        if (!button)
        {
            if (personId && !event.target.closest('a, input, select, textarea')) navigateFamilyTreeToPerson(personId, { center: false });
            return;
        }
        if (button.matches('[data-tree-expand-ancestry]'))
        {
            const appearance = runtime.scene?.byOccurrence.get(card?.dataset.treeOccurrenceId);
            if (!appearance?.hasParents || appearance.expanded || !appearance.preferredContext) return;
            const view = treeProjectViewState(runtime.projectId);
            if (document.activeElement === button) view.ancestryFocusReturn = appearance.id;
            captureTreeCanvasScroll(runtime.projectId);
            (view.ancestryExpansion ??= new Map()).set(personId, appearance.preferredContext);
            renderFamilyTree();
        }
        else if (button.dataset.cardEdit) openEditPersonModal(button.dataset.cardEdit);
        else if (button.dataset.cardAdd && personId)
        {
            if (treeProjectViewState().focusPersonId !== personId)
            {
                treeRelativeIntent = { projectId: runtime.projectId, personId };
                focusTreeBranchForRelative(personId);
            }
            else
            {
                selectVisibleTreePerson(personId, { center: false });
                openRelativePopover(button, personId);
            }
        }
        else if (button.dataset.treeCardFocus) setTreeFocusPerson(button.dataset.treeCardFocus);
        else if (button.dataset.addRelative)
        {
            const target = personById(button.dataset.personId);
            if (!target) return;
            focusTreeBranchForRelative(target.id);
            const role = button.dataset.addRelative;
            openAddPersonModal('Add ' + role, 'Create a new person and add as ' + target.name.split(' ')[0] + "'s " + role,
                { relativeType: role, personId: target.id });
        }
        else if (button.dataset.zoom === 'fit') fitTreeViewport();
        else if (button.dataset.zoom) zoomTreeViewport(button.dataset.zoom === 'in' ? 1.15 : 1 / 1.15);
        else if (button.matches('[data-tree-fullscreen]')) toggleTreeFullscreen();
        else if (button.matches('[data-tree-person-picker]'))
        {
            event.stopPropagation();
            openTreePersonPicker(button);
        }
        else if (button.matches('[data-tree-settings]')) openTreeSettingsModal();
        else if (button.matches('[data-tree-retry-layout]'))
        {
            disposeTreeElkLayout();
            renderFamilyTree();
        }
    }, { signal });
    runtime.canvas.addEventListener('dblclick', event =>
    {
        const card = event.target.closest('[data-tree-occurrence-id]');
        if (card && !event.target.closest('button, a, input, select, textarea'))
        {
            event.preventDefault();
            setTreeFocusPerson(card.dataset.personId);
        }
    }, { signal });
    runtime.canvas.addEventListener('keydown', event =>
    {
        const card = event.target.closest('[data-tree-occurrence-id]');
        if (card && event.target !== card || !card && event.target !== runtime.canvas) return;
        if (card && ['Enter', ' '].includes(event.key))
        {
            event.preventDefault();
            navigateFamilyTreeToPerson(card.dataset.personId, { center: false });
            return;
        }
        const movement = { ArrowLeft: [-1,0], ArrowRight: [1,0], ArrowUp: [0,-1], ArrowDown: [0,1] }[event.key];
        if (event.key === 'Home') fitTreeViewport();
        else if (event.key === '+' || event.key === '=') zoomTreeViewport(1.15);
        else if (event.key === '-') zoomTreeViewport(1 / 1.15);
        else if (movement && runtime.scene)
        {
            const origin = card && runtime.scene.byOccurrence.get(card.dataset.treeOccurrenceId);
            if (origin)
            {
                const [dx, dy] = movement;
                let nearest = null, distance = Infinity;
                for (const entry of runtime.scene.cards)
                {
                    const x = (entry.bounds.left + entry.bounds.right - origin.bounds.left - origin.bounds.right) / 2;
                    const y = (entry.bounds.top + entry.bounds.bottom - origin.bounds.top - origin.bounds.bottom) / 2;
                    const forward = x * dx + y * dy;
                    const score = forward + 2 * Math.abs(y * dx - x * dy);
                    if (forward > 0 && score < distance) { nearest = entry; distance = score; }
                }
                if (nearest)
                {
                    centerTreeOnOccurrence(nearest);
                    runtime.cards.querySelector('[data-tree-occurrence-id="' + CSS.escape(nearest.id) + '"]')?.focus({ preventScroll: true });
                }
            }
            else
            {
                const { x, y, k } = runtime.transform;
                setTreeViewport(runtime, x - 64 * movement[0], y - 64 * movement[1], k);
            }
        }
        else return;
        event.preventDefault();
    }, { signal });
}

function updateTreeInspector(runtime, selected)
{
    runtime.workspace.classList.toggle('inspector-collapsed', state.treeInspectorCollapsed);
    const button = runtime.shell.querySelector('[data-tree-person-picker]');
    const name = selected?.name || '';
    button.querySelector('.tree-control-name').textContent = translateText(name);
    button.setAttribute('aria-label', t('Find person') + ': ' + translateText(name));
    button.title = translateText(name);
    const previous = runtime.workspace.querySelector('.tree-inspector');
    const template = document.createElement('template');
    template.innerHTML = renderPersonSidebar(selected?.id, 'tree').trim();
    const next = template.content.firstElementChild;
    if (previous) previous.replaceWith(next);
    else runtime.workspace.append(next);
    bindPersonSidebar(next, 'tree');
    localizeUI(next, { suppressObserverReplay: true });
}

function selectVisibleTreePerson(personId, { center })
{
    const runtime = treeRenderRuntime;
    const view = treeProjectViewState();
    if (!runtime?.scene || runtime.projectId !== currentFamilyTreeProjectId()
        || runtime.request !== treeElkRequest || runtime.focusId !== view.focusPersonId
        || runtime.ancestors !== view.ancestorGenerations || runtime.descendants !== view.descendantGenerations
        || runtime.cousins !== view.showCousins) return false;
    const selected = runtime.scene.primaryByPerson.get(personId);
    if (!selected) return false;
    if (state.selectedPersonId !== personId)
    {
        const previous = state.selectedPersonId;
        appNavigationMarkIntent();
        state.selectedPersonId = personId;
        state.treeInspectorCollapsed = false;
        rememberTreeSelectedPerson(personId, runtime.projectId);
        for (const card of runtime.cards.children)
            if (card.dataset.personId === previous || card.dataset.personId === personId)
                card.classList.toggle('selected', card.dataset.personId === personId);
        updateTreeInspector(runtime, selected);
        appNavigationObserve();
    }
    if (center) centerTreeOnOccurrence(selected);
    return true;
}
