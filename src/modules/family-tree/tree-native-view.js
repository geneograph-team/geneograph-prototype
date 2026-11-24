let nativeFamilyChart = null;

function nativeParentPlaceholderLinkPoints(link)
{
    const points = link.d.map(point => [...point]);
    const trim = (node, index, nextIndex) =>
    {
        const placeholder = node.data.addParent;
        if (!placeholder) return;
        const [x, y] = points[index];
        const [nextX, nextY] = points[nextIndex];
        const dx = nextX - x;
        const dy = nextY - y;
        const end = Math.min(1, dx ? placeholder.width / (2 * Math.abs(dx)) : Infinity,
            dy ? placeholder.height / (2 * Math.abs(dy)) : Infinity);
        points[index] = [x + dx * end, y + dy * end];
    };
    if (link.spouse)
    {
        trim(link.source, 0, 1);
        trim(link.target, 1, 0);
    }
    else
    {
        const parents = Array.isArray(link.source) ? link.source : link.target;
        if (parents[0] === parents[1]) trim(parents[0], points.length - 1, points.length - 2);
    }
    return points;
}

function styleNativeFamilyChartLinks(runtime)
{
    const tree = runtime.chart.store.getTree();
    const nodes = new Set(tree.data.map(node => node.tid));
    const households = new Map();
    const along = tree.is_horizontal ? 1 : 0;
    const across = 1 - along;
    const dimensions = node => node.data.addParent || { width: TREE_CARD_W, height: TREE_CARD_H };
    const extent = (node, axis) => (axis === 0 ? dimensions(node).width : dimensions(node).height) / 2;
    const pairKey = pair => JSON.stringify(pair.map(node => node.tid).sort());
    const point = (position, level) => tree.is_horizontal ? [level, position] : [position, level];
    const junctions = new Map();
    const directGaps = new Map();
    const pathLinks = [...runtime.host.querySelectorAll('.links_view path.link')].map(path => ({ path, link: d3.select(path).datum() }));
    const routedPartners = new Map();
    const partnershipCounts = new Map();
    for (const { link } of pathLinks)
    {
        if (!link?.spouse || !nodes.has(link.source.tid) || !nodes.has(link.target.tid)) continue;
        for (const { tid } of [link.source, link.target])
            partnershipCounts.set(tid, (partnershipCounts.get(tid) || 0) + 1);
    }
    for (const { link } of pathLinks)
    {
        if (!link?.spouse || !nodes.has(link.source.tid) || !nodes.has(link.target.tid)) continue;
        const [first, last] = [link.source, link.target].sort((a, b) => (along ? a.y - b.y : a.x - b.x));
        const [a, b] = [[first.x, first.y], [last.x, last.y]];
        if (a[across] !== b[across]) continue;
        const blockers = tree.data.filter(node =>
        {
            if (node.tid === first.tid || node.tid === last.tid) return false;
            const coordinates = [node.x, node.y];
            return Math.abs(coordinates[across] - a[across]) < extent(node, across)
                && coordinates[along] + extent(node, along) > a[along] + extent(first, along)
                && coordinates[along] - extent(node, along) < b[along] - extent(last, along);
        });
        if (!blockers.length)
        {
            const gap = [a[along] + extent(first, along), b[along] - extent(last, along)];
            const key = pairKey([first, last]);
            directGaps.set(key, gap);
            // Drop near the extended partner while staying on the midpoint link.
            if (first.extendedPartnership === last.tid)
                junctions.set(key, point(Math.min(gap[0] + first.extendedJunctionInset, gap[1]), a[across]));
            else if (last.extendedPartnership === first.tid)
                junctions.set(key, point(Math.max(gap[1] - last.extendedJunctionInset, gap[0]), a[across]));
            continue;
        }
        const start = a[along] + extent(first, along);
        const end = b[along] - extent(last, along);
        const level = a[across];
        const occupied = blockers.map(node => {
            const center = along ? node.y : node.x;
            return [center - extent(node, along), center + extent(node, along)];
        }).sort(([left], [right]) => left - right);
        const segments = [];
        let cursor = start;
        for (const [low, high] of occupied)
        {
            if (low > cursor) segments.push([point(cursor, level), point(low, level)]);
            cursor = Math.max(cursor, high);
        }
        if (cursor < end) segments.push([point(cursor, level), point(end, level)]);
        routedPartners.set(link, segments);

        // A farther household descends from its own partner's card.
        const outer = partnershipCounts.get(first.tid) < partnershipCounts.get(last.tid) ? first : last;
        const outerPosition = outer === first ? a : b;
        const key = pairKey([first, last]);
        junctions.set(key, point(outerPosition[along], outerPosition[across] + extent(outer, across)));
    }
    // A gap shared by several partnerships needs only one visible stroke.
    const drawnGaps = new Set();
    for (const { link } of pathLinks)
    {
        if (!link?.spouse) continue;
        const gap = directGaps.get(pairKey([link.source, link.target]));
        if (gap)
        {
            const level = across ? link.source.y : link.source.x;
            drawnGaps.add(JSON.stringify(gap.map(position => point(position, level))));
        }
    }
    for (const { path, link } of pathLinks)
    {
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

        const points = nativeParentPlaceholderLinkPoints(link);
        const segments = routedPartners.get(link)?.filter(segment =>
        {
            const key = JSON.stringify(segment);
            if (drawnGaps.has(key)) return false;
            drawnGaps.add(key);
            return true;
        }) ?? [points];
        const connector = segments.map(points => `M${points.map(point => point.join(' ')).join(' L')}`).join(' ');
        path.style.setProperty('d', `path("${connector}")`);
        if (segments.length) path.style.removeProperty('visibility');
        else path.style.visibility = 'hidden';

        if (link.spouse || link.d.length !== 6) continue;
        const child = Array.isArray(link.source) ? link.target : link.source;
        const parents = Array.isArray(link.source) ? link.source : link.target;
        if (!nodes.has(child.tid) || !parents.every(parent => nodes.has(parent.tid))) continue;
        const parentKey = pairKey(parents);
        const gap = directGaps.get(parentKey);
        const endpoint = points.at(-1);
        let junction = junctions.get(parentKey);
        if (!junction && gap && (endpoint[along] < gap[0] || endpoint[along] > gap[1]))
            junction = point((gap[0] + gap[1]) / 2, endpoint[across]);
        if (junction)
        {
            points[points.length - 1] = junction;
            points[3][along] = points[4][along] = junction[along];

        }
        const familyId = link.familyContextId || runtime.input.parentFamilyByChild.get(child.data.id)?.id;
        if (!familyId) continue;
        const keyByHousehold = JSON.stringify([familyId, parents.map(parent => parent.tid).sort(), points.at(-1), points[0][across]]);
        if (!households.has(keyByHousehold)) households.set(keyByHousehold, []);
        const parentRow = Math.max(...parents.map(parent => across ? parent.y : parent.x));
        const parentEdge = Math.max(...parents.map(parent => (across ? parent.y : parent.x) + extent(parent, across)));
        const childEdge = points[0][across] - extent(child, across);
        households.get(keyByHousehold).push({ path, points, parentRow, parentEdge, childEdge });
    }

    if (!CSS.supports('d', 'path("M0 0 L1 1")')) return;
    const bands = new Map();
    for (const siblings of households.values())
    {
        const points = siblings[0].points;
        const rail = [points.at(-1)[along], ...siblings.map(edge => edge.points[1][along])];
        const start = Math.min(...rail);
        const end = Math.max(...rail);
        const key = JSON.stringify([points[0][across], siblings[0].parentRow]);
        if (!bands.has(key)) bands.set(key, []);
        bands.get(key).push({ siblings, start, end, lane: 0 });
    }

    for (const groups of bands.values())
    {
        const lanes = [];
        for (const group of groups.sort((a, b) => a.start - b.start || a.end - b.end))
        {
            let lane = lanes.findIndex(end => end < group.start);
            if (lane < 0) lane = lanes.length;
            lanes[lane] = group.end;
            group.lane = lane;
        }

        const parentEdge = Math.max(...groups.flatMap(group => group.siblings.map(edge => edge.parentEdge)));
        const childEdge = Math.min(...groups.flatMap(group => group.siblings.map(edge => edge.childEdge)));
        const clearance = childEdge - parentEdge;
        for (const { siblings, start, end, lane } of groups)
        {
            const [first, ...rest] = siblings;
            const anchor = first.points.at(-1);
            const laneGap = Math.min(TREE_GEOMETRY.connectorLaneGap, Math.max(0, clearance - 16) / lanes.length);
            const railDepth = (clearance > 0 ? (parentEdge + childEdge) / 2 : first.points[1][across]) + (lane - (lanes.length - 1) / 2) * laneGap;
            const onRail = position => tree.is_horizontal ? [railDepth, position] : [position, railDepth];
            const trunk = `M${anchor.join(' ')} L${onRail(anchor[along]).join(' ')}`;
            const sharedRail = `M${onRail(start).join(' ')} L${onRail(end).join(' ')}`;
            const drops = siblings.map(({ points }) => `M${onRail(points[0][along]).join(' ')} L${points[0].join(' ')}`).join(' ');
            first.path.style.setProperty('d', `path("${trunk} ${sharedRail} ${drops}")`);
            rest.forEach(({ path }) => { path.style.visibility = 'hidden'; });
        }
    }
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
                addParent: {
                    personId, role,
                    width: treeParentPlaceholderWidth(missing.length),
                    height: missing.length === 1 ? TREE_CARD_H : TREE_GEOMETRY.parentPlaceholderHeight,
                    get crossSize() { return runtime.orientation === 'horizontal' ? this.height : this.width; },
                    personCrossSize: runtime.orientation === 'horizontal' ? TREE_CARD_H : TREE_CARD_W,
                    gap: TREE_PARENT_PLACEHOLDER_GAP
                }
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
                    const { personId, role, width, height } = placeholder;
                    return `<div class="card-inner native-parent-placeholder">${renderTreeParentPlaceholder({
                        personId, rel: role, label: role === 'father' ? 'Add father' : 'Add mother',
                        x: 0, y: 0, width, height
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
