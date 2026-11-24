let nativeFamilyChart = null;

function styleNativeFamilyChartLinks(runtime)
{
    const tree = runtime.chart.store.getTree();
    const nodes = new Set(tree.data);
    const households = new Map();
    for (const path of runtime.host.querySelectorAll('.links_view path.link'))
    {
        // Read the endpoints and points from the native SVG binding. Styling
        // leaves their positions and Family Chart's routing decisions intact.
        const link = d3.select(path).datum();
        if (!link) continue;
        path.classList.add('tree-line');
        path.classList.toggle('partner', Boolean(link.spouse));
        const key = link.spouse ? JSON.stringify([link.source.data.id, link.target.data.id].sort()) : '';
        const family = runtime.input.partnershipFamilies.get(key);
        const dashed = Boolean(family && treePartnerConnectorClass(family).includes('is-separated-or-divorced'));
        path.classList.toggle('is-separated-or-divorced', dashed);

        if (dashed)
        {
            const [start, end] = link.d;
            const halfLength = Math.hypot(end[0] - start[0], end[1] - start[1]) / 2;
            path.style.strokeDashoffset = TREE_PARTNER_DASH_LENGTH / 2 - halfLength;
        }
        else path.style.removeProperty('stroke-dashoffset');

        const curve = !link.spouse && roundedNativeFamilyChartPath(link.d);
        if (curve) path.style.setProperty('d', `path("${curve}")`);
        else path.style.removeProperty('d');
        path.style.removeProperty('visibility');

        if (link.spouse || link.d.length !== 6) continue;
        const child = Array.isArray(link.source) ? link.target : link.source;
        const parents = Array.isArray(link.source) ? link.source : link.target;
        if (!nodes.has(child) || !parents.every(parent => nodes.has(parent))) continue;
        const familyId = link.familyContextId || runtime.input.parentFamilyByChild.get(child.data.id)?.id;
        if (!familyId) continue;
        const keyByHousehold = JSON.stringify([familyId, parents.map(parent => parent.tid).sort(), link.d.at(-1), link.d[1][tree.is_horizontal ? 0 : 1]]);
        if (!households.has(keyByHousehold)) households.set(keyByHousehold, []);
        households.get(keyByHousehold).push({ path, points: link.d });
    }

    if (!CSS.supports('d', 'path("M0 0 L1 1")')) return;    if (!CSS.supports('d', 'path("M0 0 L1 1")')) return;
    for (const siblings of households.values())
    {
        if (siblings.length < 2) continue;
        const [first, ...rest] = siblings;
        const horizontal = tree.is_horizontal;
        const along = horizontal ? 1 : 0;
        const anchor = first.points.at(-1);
        const junction = first.points[3];
        const rail = [anchor[along], ...siblings.map(edge => edge.points[1][along])];
        const firstRail = [...junction];
        const lastRail = [...junction];
        firstRail[along] = Math.min(...rail);
        lastRail[along] = Math.max(...rail);
        const trunk = `M${anchor.join(' ')} L${junction.join(' ')}`;
        const sharedRail = `M${firstRail.join(' ')} L${lastRail.join(' ')}`;
        const drops = siblings.map(({ points }) => `M${points[1].join(' ')} L${points[0].join(' ')}`).join(' ');
        first.path.style.setProperty('d', `path("${trunk} ${sharedRail} ${drops}")`);
        rest.forEach(({ path }) => { path.style.visibility = 'hidden'; });
    }
}

function roundedNativeFamilyChartPath(points)
{
    const route = points.filter(([x, y], index) =>
        index === 0 || x !== points[index - 1][0] || y !== points[index - 1][1]);
    if (route.length < 3) return '';
    let path = `M${route[0].join(' ')}`;
    for (let index = 1; index < route.length - 1; index++)
    {
        const [x, y] = route[index];
        const [previousX, previousY] = route[index - 1];
        const [nextX, nextY] = route[index + 1];
        const incoming = Math.hypot(x - previousX, y - previousY);
        const outgoing = Math.hypot(nextX - x, nextY - y);
        const radius = Math.min(10, incoming / 2, outgoing / 2);
        const cornerX = x + radius * (previousX - x) / incoming;
        const cornerY = y + radius * (previousY - y) / incoming;
        const exitX = x + radius * (nextX - x) / outgoing;
        const exitY = y + radius * (nextY - y) / outgoing;
        path += ` L${cornerX} ${cornerY} Q${x} ${y} ${exitX} ${exitY}`;
    }
    return `${path} L${route.at(-1).join(' ')}`;
}

function nativeFamilyChartOrientation(view)
{
    return view === 'Horizontal' ? 'horizontal' : 'vertical';
}

function showNativeFamilyChartUnavailable(slot)
{
    nativeFamilyChart = null;
    slot.textContent = t('Family Chart cannot display these relationships. Switch off the preview to return to Classic.');
    slot.setAttribute('role', 'status');
}

function addNativeParentPlaceholders(root, runtime)
{
    for (const child of root.descendants())
    {
        if (child.depth >= runtime.ancestorGenerations) continue;
        const personId = child.data.id;
        const known = runtime.parentRolesByChild.get(personId) || {};
        const roles = ['father', 'mother'];
        const parents = child.children || [];
        // A saved parent outside the preview or behind a native duplicate
        // toggle does not become an Add parent action.
        if (roles.some(role => known[role] && !parents.some(node => node.data.id === known[role]))) continue;

        const missing = roles.filter(role => !known[role]);
        if (!missing.length) continue;
        const placeholders = new Map(missing.map(role =>
        {
            let id = `add-parent:${personId}:${role}`;
            while (runtime.input.peopleById.has(id)) id += ':';
            const placeholder = d3.hierarchy({
                id, data: { gender: role === 'father' ? 'M' : 'F' },
                rels: { parents: [], spouses: [], children: [] },
                addParent: { personId, role, count: missing.length }
            });
            placeholder.parent = child;
            placeholder.depth = child.depth + 1;
            return [role, placeholder];
        }));
        child.children = roles.map(role =>
            placeholders.get(role) || parents.find(node => node.data.id === known[role]));
    }
}

function mountNativeFamilyChart(slot, input, context)
{
    const { projectId, focusId, view, orientation, parentRolesByChild = input.parentRolesByChild } = context;
    if (!input.data)
    {
        showNativeFamilyChartUnavailable(slot);
        return;
    }

    const dataKey = JSON.stringify([input.data, input.familyContexts]);
    const reusable = nativeFamilyChart?.projectId === projectId && nativeFamilyChart.dataKey === dataKey;
    if (!reusable)
    {
        const host = document.createElement('div');
        host.className = 'f3 native-family-chart';
        slot.append(host);
        const chart = f3.createChart(host, input.data);
        const runtime = { host, chart, projectId, dataKey, input };
        nativeFamilyChart = runtime;

        chart.setTransitionTime(0).setSingleParentEmptyCard(false)
            .setDuplicateBranchToggle(true)
            .setModifyTreeHierarchy((root, isAncestry) =>
            {
                if (isAncestry) addNativeParentPlaceholders(root, runtime);
            });

        chart.setCardHtml()
            .setCardDim({ w: TREE_CARD_W, h: TREE_CARD_H })
            .setCardInnerHtmlCreator(node =>
            {
                const placeholder = node.data.addParent;
                if (placeholder)
                {
                    const { personId, role, count } = placeholder;
                    return `<div class="card-inner native-parent-placeholder">${renderTreeParentPlaceholder({
                        personId, rel: role, label: role === 'father' ? 'Add father' : 'Add mother',
                        x: 0, y: 0, width: treeParentPlaceholderWidth(count),
                        height: count === 1 ? TREE_CARD_H : TREE_GEOMETRY.parentPlaceholderHeight
                    })}</div>`;
                }
                const person = runtime.input.peopleById.get(node.data.id);
                if (person && !runtime.cardPeople.has(person.id))
                    runtime.cardPeople.set(person.id, toTreePerson(person));
                return person ? `<div class="card-inner">${renderTreePersonCard({
                    ...runtime.cardPeople.get(person.id), layoutX: 0, layoutY: 0
                }, { native: true, occurrenceId: node.tid })}</div>` : '';
            })
            .setOnCardClick((event, node) =>
            {
                if (event.target.closest('button, a')) return;
                selectNativeFamilyChartPerson(node.data.id);
            });

        chart.setAfterUpdate(() =>
        {
            styleNativeFamilyChartLinks(runtime);
            host.querySelectorAll('.f3-toggle-div').forEach(toggle =>
            {
                toggle.tabIndex = 0;
                toggle.setAttribute('role', 'button');
                toggle.setAttribute('aria-label', t('Toggle branch'));
            });
        });

        host.addEventListener('keydown', event =>
        {
            if (!['Enter', ' '].includes(event.key)) return;
            if (event.target.matches('.f3-toggle-div'))
            {
                event.preventDefault();
                event.target.click();
            }
            else if (event.target.matches('.tree-person-card'))
            {
                event.preventDefault();
                selectNativeFamilyChartPerson(event.target.dataset.personId);
            }
        });

        host.addEventListener('click', event =>
        {
            const addParent = event.target.closest('.add-parent-card[data-add-relative]');
            if (addParent)
            {
                const personId = addParent.dataset.personId;
                const role = addParent.dataset.addRelative;
                const person = getPerson(personId);
                if (person)
                {
                    focusTreeBranchForRelative(personId);
                    openAddPersonModal(`Add ${role}`, `Create a new person and add as ${formatPersonFullName(person)}'s ${role}`,
                        { relativeType: role, personId });
                }
                return;
            }
            const action = event.target.closest('[data-native-tree-focus], [data-card-edit], [data-card-add]');
            const personId = action?.closest('.tree-person-card')?.dataset.personId;
            if (!personId) return;
            if (action.hasAttribute('data-native-tree-focus')) setTreeFocusPerson(personId);
            else if (action.hasAttribute('data-card-edit')) openEditPersonModal(personId);
            else openRelativePopover(action, personId);
        });
    }

    const runtime = nativeFamilyChart;
    const { chart, host } = runtime;
    if (!slot.contains(host)) slot.append(host);
    const orientationChanged = runtime.orientation !== orientation;
    const focusChanged = runtime.focusId !== focusId;
    runtime.orientation = orientation;
    runtime.focusId = focusId;
    runtime.input = input;
    runtime.ancestorGenerations = view.ancestorGenerations;
    runtime.parentRolesByChild = parentRolesByChild;
    runtime.cardPeople = new Map();
    if (orientation === 'horizontal') chart.setOrientationHorizontal();
    else chart.setOrientationVertical();
    chart.setFamilyContexts(input.familyContexts);
    chart.setCardXSpacing(TREE_CARD_W + 56).setCardYSpacing(TREE_CARD_H + 65)
        .setAncestryDepth(view.ancestorGenerations).setProgenyDepth(view.descendantGenerations)
        .setShowSiblingsOfMain(view.ancestorGenerations > 0);
    if (focusChanged) chart.updateMainId(focusId);
    chart.updateTree({
        initial: !reusable,
        tree_position: !reusable || orientationChanged ? 'fit' : focusChanged ? 'main_to_middle' : 'inherit'
    });
}

function changeNativeFamilyChartOrientation(orientation)
{
    const runtime = nativeFamilyChart;
    if (!runtime || runtime.orientation === orientation) return;
    const chart = runtime.chart;
    if (orientation === 'horizontal') chart.setOrientationHorizontal();
    else chart.setOrientationVertical();
    runtime.orientation = orientation;
    chart.updateTree({ tree_position: 'fit' });
}

function selectNativeFamilyChartPerson(personId)
{
    const runtime = nativeFamilyChart;
    const projectId = currentFamilyTreeProjectId();
    const person = getPerson(personId);
    if (!person || person.deleted || person.projectId !== projectId) return;

    state.selectedPersonId = personId;
    state.treeInspectorCollapsed = false;
    rememberTreeSelectedPerson(personId, projectId);
    rerenderPersonSidebarContext('tree', { preserveScroll: false });
    const picker = main.querySelector('[data-tree-person-picker]');
    if (picker)
    {
        picker.querySelector('.tree-control-name').textContent = translateText(treePersonDisplayName(person));
        picker.title = translateText(treePersonDisplayName(person));
        picker.setAttribute('aria-label', `${t('Find person')}: ${translateText(treePersonDisplayName(person))}`);
    }
    runtime?.host.querySelectorAll('.tree-person-card').forEach(card =>
        card.classList.toggle('selected', card.dataset.personId === personId));
    localizeUI(getPersonSidebarElement('tree'), { suppressObserverReplay: true });
}

function zoomNativeFamilyChart(action)
{
    const runtime = nativeFamilyChart;
    const svg = runtime?.host.querySelector('svg.main_svg');
    if (!svg) return;
    if (action === 'fit')
    {
        const tree = runtime.chart.store.getTree();
        f3.handlers.treeFit({ svg, svg_dim: svg.getBoundingClientRect(), tree_dim: tree.dim, transition_time: 0 });
    }
    else f3.handlers.manualZoom({ svg, amount: action === 'in' ? 1.2 : 1 / 1.2, transition_time: 0 });
}
