let geneoObjectMenuController = null;
let geneoLayerDrag = null;
let geneoLayerRangeAnchor = null;

function geneoCancelLayerDrag()
{
    if (geneoLayerDrag?.frame) cancelAnimationFrame(geneoLayerDrag.frame);
    geneoLayerDrag?.controller.abort();
    geneoLayerDrag = null;
    sidebar.querySelectorAll('.layer-dragging, .layer-drop-before, .layer-drop-after').forEach(row => row.classList.remove('layer-dragging', 'layer-drop-before', 'layer-drop-after'));
}

function geneoStartLayerDrag(id)
{
    geneoCancelLayerDrag();
    const node = getGeneographNode(id);
    if (!node || geneoNodeEffectiveLocked(node) || geneoLayerRenameMatches('node', id)) return false;
    if (!geneoSelectedNodeIdSet().has(id)) selectGeneographNode(id);
    const ids = [...geneoSelectedNodeIdSet()].filter(item => ![...geneoSelectedNodeIdSet()].some(parent => parent !== item && geneoNodeInsidePanel(getGeneographNode(item), parent)));
    if (ids.some(item => geneoNodeEffectiveLocked(getGeneographNode(item)))) return false;
    const controller = new AbortController();
    geneoLayerDrag = { ids, boardId: selectedGeneographBoard()?.id, key: geneoLayerPeerKey(node), controller, frame: null, x: 0, y: 0, targetId: '', before: true };
    sidebar.querySelectorAll('[data-geneo-layer]').forEach(row =>
    {
        row.classList.toggle('selected', geneoSelectedNodeIdSet().has(row.dataset.geneoLayer));
        row.classList.toggle('layer-dragging', ids.includes(row.dataset.geneoLayer));
    });
    document.addEventListener('keydown', event =>
    {
        if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); geneoCancelLayerDrag(); renderGeneographEditorPreserveScroll(); }
    }, { capture: true, signal: controller.signal });
    return true;
}

function geneoUpdateLayerDrop(x, y)
{
    const drag = geneoLayerDrag;
    if (!drag) return false;
    const previousId = drag.targetId, previousBefore = drag.before;
    drag.x = x; drag.y = y; drag.targetId = '';
    sidebar.querySelectorAll('.layer-drop-before, .layer-drop-after').forEach(row => row.classList.remove('layer-drop-before', 'layer-drop-after'));
    const list = sidebar.querySelector('.geneo-layer-list');
    if (!list) return false;
    const area = list.getBoundingClientRect();
    const viewport = (sidebar.querySelector('.geneo-sidebar') || sidebar).getBoundingClientRect();
    if (x < area.left || x > area.right || y < Math.max(area.top, viewport.top) - 8 || y > Math.min(area.bottom, viewport.bottom) + 8) return false;
    const hit = document.elementFromPoint(x, y);
    let block = hit?.closest('[data-geneo-layer-block]');
    if (block && !list.contains(block)) return false;
    if (block && !hit.closest('[data-geneo-layer], [data-geneo-layer-connection], .geneo-layer-panel-head')
        && getGeneographNode(drag.ids[0])?.parentPanelId === block.dataset.geneoLayerBlock) block = null;
    if (!block)
    {
        const candidates = [...list.querySelectorAll('[data-geneo-layer-block]')].filter(element =>
        {
            const node = getGeneographNode(element.dataset.geneoLayerBlock);
            return node && geneoLayerPeerKey(node) === drag.key && !drag.ids.includes(node.id);
        });
        const distance = element => { const rect = element.getBoundingClientRect(); return y < rect.top ? rect.top - y : y > rect.bottom ? y - rect.bottom : 0; };
        block = candidates.sort((a, b) => distance(a) - distance(b))[0];
    }
    const node = block && getGeneographNode(block.dataset.geneoLayerBlock);
    if (!node || geneoLayerPeerKey(node) !== drag.key || drag.ids.includes(node.id)) return false;
    const row = block.querySelector('[data-geneo-layer]');
    drag.targetId = node.id;
    const rect = row.getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    drag.before = hit?.closest('[data-geneo-layer-connection]') ? false
        : previousId === node.id && Math.abs(y - midpoint) < 4 ? previousBefore : y < midpoint;
    (drag.before ? row : block).classList.add(drag.before ? 'layer-drop-before' : 'layer-drop-after');
    return true;
}

function geneoLayerAutoScroll()
{
    const drag = geneoLayerDrag;
    if (!drag) return;
    if (state.activeModule !== 'Geneograph' || selectedGeneographBoard()?.id !== drag.boardId || !sidebar.querySelector('.geneo-sidebar'))
    { geneoCancelLayerDrag(); return; }
    const scroll = sidebar.querySelector('.geneo-sidebar') || sidebar;
    const rect = scroll.getBoundingClientRect();
    if (drag.y > rect.top && drag.y < rect.bottom)
    {
        const delta = drag.y < rect.top + 36 ? -10 : drag.y > rect.bottom - 36 ? 10 : 0;
        if (delta) { scroll.scrollTop += delta; geneoUpdateLayerDrop(drag.x, drag.y); }
    }
    drag.frame = requestAnimationFrame(geneoLayerAutoScroll);
}

function geneoFinishLayerDrop()
{
    const drag = geneoLayerDrag;
    if (!drag) return;
    const { ids, targetId, before } = drag;
    geneoCancelLayerDrag();
    if (!targetId || !geneoApplyLayerOrder('drop', ids, targetId, before)) renderGeneographEditorPreserveScroll();
}

function bindGeneoLayerRow(row)
{
    const id = row.dataset.geneoLayer;
    row.addEventListener('contextmenu', event =>
    {
        if (event.target.closest('input')) return;
        event.preventDefault(); event.stopPropagation();
        if (geneoLayerDrag) return;
        openGeneographObjectContextMenu(id, event.clientX, event.clientY, 'sidebar');
    });
    row.addEventListener('keydown', event =>
    {
        if (event.key !== 'ContextMenu' && !(event.shiftKey && event.key === 'F10')) return;
        event.preventDefault(); event.stopPropagation();
        const rect = row.getBoundingClientRect();
        openGeneographObjectContextMenu(id, rect.left + 20, rect.bottom, 'sidebar');
    });
    row.addEventListener('dragstart', event =>
    {
        if (!geneoStartLayerDrag(id)) { event.preventDefault(); return; }
        event.dataTransfer.setData('text/geneo-node', id);
        event.dataTransfer.effectAllowed = 'move';
        geneoLayerDrag.frame = requestAnimationFrame(geneoLayerAutoScroll);
    });
    row.addEventListener('dragend', () => { if (geneoLayerDrag) { geneoCancelLayerDrag(); renderGeneographEditorPreserveScroll(); } });
    let holdTimer = null;
    let touchStart = null;
    let dragged = false;
    const cancelHold = () => { clearTimeout(holdTimer); holdTimer = null; };
    row.addEventListener('pointerdown', event =>
    {
        if (event.pointerType === 'mouse' || event.target.closest('button,input') || row.draggable === false) return;
        dragged = false;
        touchStart = { x: event.clientX, y: event.clientY };
        cancelHold();
        holdTimer = setTimeout(() =>
        {
            if (!row.isConnected || !geneoStartLayerDrag(id)) return;
            dragged = true;
            row.setPointerCapture(event.pointerId);
            geneoLayerDrag.x = event.clientX; geneoLayerDrag.y = event.clientY;
            geneoLayerDrag.frame = requestAnimationFrame(geneoLayerAutoScroll);
        }, 300);
    });
    row.addEventListener('pointermove', event =>
    {
        if (event.pointerType === 'mouse') return;
        if (!dragged && touchStart && Math.hypot(event.clientX - touchStart.x, event.clientY - touchStart.y) > 8) cancelHold();
        if (dragged && geneoLayerDrag)
        { event.preventDefault(); geneoUpdateLayerDrop(event.clientX, event.clientY); }
    });
    row.addEventListener('touchmove', event => { if (dragged && geneoLayerDrag) event.preventDefault(); }, { passive: false });
    row.addEventListener('pointerup', event =>
    {
        cancelHold(); touchStart = null;
        if (event.pointerType !== 'mouse' && dragged) geneoFinishLayerDrop();
    });
    row.addEventListener('pointercancel', event =>
    {
        if (event.pointerType === 'mouse') return;
        cancelHold(); touchStart = null;
        if (geneoLayerDrag) { geneoCancelLayerDrag(); renderGeneographEditorPreserveScroll(); }
    });
    row.addEventListener('click', event => { if (dragged) { event.preventDefault(); event.stopImmediatePropagation(); dragged = false; } }, true);
}

function geneoLayerPeerKey(node)
{
    return `${node.parentPanelId || 'root'}:${node.type === 'panel' ? 'panel' : 'object'}`;
}

function geneoLayerOrderPlan(action, ids = [...geneoSelectedNodeIdSet()], targetId = '', before = true)
{
    const diagram = selectedGeneographDiagram();
    const selected = diagram.nodes.filter(node => ids.includes(node.id)
        && !ids.some(id => id !== node.id && geneoNodeInsidePanel(node, id)));
    if (!selected.length || selected.some(geneoNodeEffectiveLocked)) return [];
    const groups = [...new Set(selected.map(geneoLayerPeerKey))];
    const plans = [];
    groups.forEach(key =>
    {
        const peers = diagram.nodes.filter(node => geneoLayerPeerKey(node) === key).sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
        const original = peers.map(node => node.id);
        let next = [...original];
        const moving = new Set(selected.filter(node => geneoLayerPeerKey(node) === key).map(node => node.id));
        if (action === 'drop')
        {
            if (!original.includes(targetId) || moving.has(targetId)) return;
            const block = next.filter(id => moving.has(id));
            next = next.filter(id => !moving.has(id));
            const index = next.indexOf(targetId) + (before ? 1 : 0);
            next.splice(index, 0, ...block);
        }
        else if (action === 'front') next = [...next.filter(id => !moving.has(id)), ...next.filter(id => moving.has(id))];
        else if (action === 'back') next = [...next.filter(id => moving.has(id)), ...next.filter(id => !moving.has(id))];
        else if (action === 'forward')
        {
            for (let index = next.length - 2; index >= 0; index--)
                if (moving.has(next[index]) && !moving.has(next[index + 1])) [next[index], next[index + 1]] = [next[index + 1], next[index]];
        }
        else if (action === 'backward')
        {
            for (let index = 1; index < next.length; index++)
                if (moving.has(next[index]) && !moving.has(next[index - 1])) [next[index], next[index - 1]] = [next[index - 1], next[index]];
        }
        if (next.some((id, index) => id !== original[index])) plans.push({ original, next });
    });
    return plans;
}

function geneoApplyLayerOrder(action, ids, targetId, before)
{
    const plans = geneoLayerOrderPlan(action, ids, targetId, before);
    if (!plans.length) return false;
    geneoPushHistory();
    const ordered = selectedGeneographDiagram().nodes.slice().sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
    ordered.forEach((node, index) => node.order = index + 1);
    plans.forEach(plan =>
    {
        const slots = plan.original.map(id => getGeneographNode(id).order).sort((a, b) => a - b);
        plan.next.forEach((id, index) => getGeneographNode(id).order = slots[index]);
    });
    touchGeneographBoard();
    renderGeneographEditorPreserveScroll();
    return true;
}

function closeGeneographObjectContextMenu()
{
    geneoObjectMenuController?.abort();
    geneoObjectMenuController = null;
    document.querySelector('.geneo-object-context-menu')?.remove();
}

function bindGeneoConnectionContextMenu(element, surface = 'canvas')
{
    const connectionIds = () => element.dataset.geneoFamilyBus
        ? element.dataset.geneoFamilyBus.split(',').filter(Boolean)
        : [surface === 'sidebar' ? element.dataset.geneoLayerConnection
            : surface === 'inspector' ? element.dataset.geneoInspectorConnection
                : element.dataset.geneoConnection].filter(Boolean);
    const open = (x, y) =>
    {
        const ids = connectionIds();
        if (!ids.length || geneoLayerDrag) return;
        openGeneographObjectContextMenu(ids[0], x, y, surface, ids);
    };
    element.addEventListener('contextmenu', event =>
    {
        if (event.target.closest('input,textarea,select,[contenteditable="true"]')) return;
        event.preventDefault();
        event.stopPropagation();
        open(event.clientX, event.clientY);
    });
    element.addEventListener('keydown', event =>
    {
        if (event.key !== 'ContextMenu' && !(event.shiftKey && event.key === 'F10')) return;
        if (event.target.closest('input,textarea,select,[contenteditable="true"]')) return;
        event.preventDefault();
        event.stopPropagation();
        const rect = element.getBoundingClientRect();
        open(rect.left + 20, rect.bottom);
    });
}

function openGeneographObjectContextMenu(nodeId, clientX, clientY, surface = 'canvas', connectionIds = null)
{
    const targets = Array.isArray(connectionIds)
        ? [...new Set(connectionIds)].filter(id => Boolean(getGeneographConnection(id)))
        : null;
    const isConnection = Boolean(targets?.length);
    const node = isConnection ? getGeneographConnection(nodeId) : getGeneographNode(nodeId);
    if (!node) return;
    closeGeneographObjectContextMenu();
    closeMenu();
    if (isConnection)
    {
        // Context actions must not act on unrelated selected nodes or connections.
        setGeneographSelection([], targets, { connectionId: nodeId });
        renderGeneographEditorPreserveScroll({ preserveSidebarScroll: surface === 'sidebar' });
    }
    else
    {
        if (!geneoSelectedNodeIdSet().has(nodeId))
        {
            selectGeneographNode(nodeId);
            renderGeneographEditorPreserveScroll();
        }
        if (state.selectedGeneoConnectionIds.length)
        {
            setGeneographNodeSelection([...geneoSelectedNodeIdSet()], nodeId);
            renderGeneographEditorPreserveScroll();
        }
    }
    const anchor = isConnection
        ? (surface === 'sidebar'
            ? sidebar.querySelector(`[data-geneo-layer-connection="${CSS.escape(nodeId)}"]`)
            : surface === 'inspector' ? main.querySelector(`[data-geneo-inspector-connection="${CSS.escape(nodeId)}"]`)
                : main.querySelector(targets.length > 1
                ? `[data-geneo-family-bus="${CSS.escape(targets.join(','))}"]`
                : `[data-geneo-connection="${CSS.escape(nodeId)}"]`))
        : (surface === 'sidebar'
            ? sidebar.querySelector(`[data-geneo-layer="${CSS.escape(nodeId)}"]`)
            : main.querySelector(`.geneo-node[data-geneo-node="${CSS.escape(nodeId)}"]`));
    if (!anchor) return;
    const nodes = isConnection ? [] : geneoObjectGroupNodes();
    const visible = isConnection
        ? targets.some(id => getGeneographConnection(id)?.visible !== false)
        : nodes.some(item => item.visible);
    const locked = isConnection ? false : nodes.every(item => item.locked);
    const groups = isConnection ? [
        { label: 'Visibility', actions: [[visible ? 'hide' : 'show', visible ? 'Hide' : 'Show', visible ? icon.eyeOff : icon.eye]] },
        { label: '', actions: [['delete', targets.length > 1 ? 'Delete connections' : 'Delete connection', icon.trash]] }
    ] : [
        ...(nodes.length === 1 && node.type === 'image' && resolveGeneographImageSource(node).available ? [{ label: '', actions: [['crop', 'Crop image', icon.image]] }] : []),
        { label: 'Layer order', actions: [['forward', 'Move forward one layer', icon.arrow], ['front', 'Move to front', icon.doublechevronSidebar], ['backward', 'Move backward one layer', icon.arrow], ['back', 'Move to back', icon.doublechevronSidebar]] },
        { label: 'Edit', actions: [['duplicate', 'Duplicate', icon.copy], ['copy', 'Copy', icon.copy], ['cut', 'Cut', icon.cut], ...(geneoObjectClipboard?.boardId === selectedGeneographBoard()?.id ? [['paste', 'Paste', icon.paste]] : [])] },
        { label: 'Visibility', actions: [[visible ? 'hide' : 'show', visible ? 'Hide' : 'Show', visible ? icon.eyeOff : icon.eye], [locked ? 'unlock' : 'lock', locked ? 'Unlock' : 'Lock', locked ? icon.unlock : icon.lock]] },
        { label: '', actions: [['delete', 'Delete', icon.trash]] }
    ];
    const menu = document.createElement('div');
    menu.id = 'projectMenu';
    menu.className = 'menu-popover geneo-object-context-menu';
    menu.setAttribute('role', 'menu');
    menu.setAttribute('aria-label', t(isConnection ? 'Connection actions' : 'Object actions'));
    menu.style.visibility = 'hidden';
    menu.innerHTML = groups.map(group => `<div class="geneo-context-group" role="group" ${group.label ? `aria-label="${escapeHtml(t(group.label))}"` : ''}>${group.label ? `<div class="geneo-context-heading">${escapeHtml(t(group.label))}</div>` : ''}${group.actions.map(([action, label, glyph]) => `<button type="button" role="menuitem" data-geneo-object-action="${action}" class="${action === 'delete' ? 'danger' : ''}" ${['forward', 'front', 'backward', 'back'].includes(action) && !geneoLayerOrderPlan(action).length ? 'disabled' : ''}><span class="geneo-context-icon ${action}">${glyph || ''}</span><span>${escapeHtml(t(label))}</span></button>`).join('')}</div>`).join('');
    document.body.appendChild(menu);
    const bounds = menu.getBoundingClientRect();
    menu.style.left = `${Math.max(12, Math.min(clientX, window.innerWidth - bounds.width - 12))}px`;
    menu.style.top = `${Math.max(12, Math.min(clientY, window.innerHeight - bounds.height - 12))}px`;
    menu.style.visibility = 'visible';
    menu.addEventListener('click', event =>
    {
        const action = event.target.closest('[data-geneo-object-action]')?.dataset.geneoObjectAction;
        if (!action || event.target.closest('button')?.disabled) return;
        closeGeneographObjectContextMenu();
        if (isConnection)
        {
            if (action === 'hide' || action === 'show')
            {
                const nextVisible = action === 'show';
                const changed = targets.map(id => getGeneographConnection(id))
                    .filter(item => item && (item.visible !== false) !== nextVisible);
                if (changed.length)
                {
                    geneoPushHistory();
                    changed.forEach(item => { item.visible = nextVisible; });
                    touchGeneographBoard();
                    renderGeneographEditorPreserveScroll({ preserveSidebarScroll: surface === 'sidebar' });
                }
            }
            else if (action === 'delete') deleteGeneographSelection();
        }
        else if (['forward', 'front', 'backward', 'back'].includes(action)) geneoApplyLayerOrder(action);
        else if (action === 'crop') geneoBeginImageCrop(node);
        else if (action === 'hide' || action === 'show') geneoSetSelectedObjectsProperty('visible', action === 'show');
        else if (action === 'lock' || action === 'unlock') geneoSetSelectedObjectsProperty('locked', action === 'lock');
        else if (action === 'duplicate') duplicateGeneographSelection();
        else if (action === 'copy') copyGeneographSelection();
        else if (action === 'cut') cutGeneographSelection();
        else if (action === 'paste') pasteGeneographObjects();
        else if (action === 'delete') deleteGeneographSelection();
        requestAnimationFrame(() =>
        {
            const restored = isConnection
                ? (surface === 'sidebar'
                    ? sidebar.querySelector(`[data-geneo-layer-connection="${CSS.escape(nodeId)}"]`)
                    : surface === 'inspector' ? main.querySelector(`[data-geneo-inspector-connection="${CSS.escape(nodeId)}"]`)
                        : main.querySelector(targets.length > 1
                        ? `[data-geneo-family-bus="${CSS.escape(targets.join(','))}"]`
                        : `[data-geneo-connection="${CSS.escape(nodeId)}"]`))
                : (surface === 'sidebar'
                    ? sidebar.querySelector(`[data-geneo-layer="${CSS.escape(nodeId)}"]`)
                    : main.querySelector(`.geneo-node[data-geneo-node="${CSS.escape(nodeId)}"]`));
            (restored || sidebar.querySelector('[data-geneo-layer-connection], [data-geneo-layer], button'))
                ?.focus({ preventScroll: true });
        });
    });
    menu.addEventListener('keydown', event =>
    {
        const items = [...menu.querySelectorAll('[role="menuitem"]:not(:disabled)')];
        const index = items.indexOf(document.activeElement);
        if (event.key === 'Escape')
        {
            event.preventDefault(); event.stopPropagation(); closeGeneographObjectContextMenu(); anchor.focus();
        }
        else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key))
        {
            event.preventDefault(); event.stopPropagation();
            const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1
                : (index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
            items[next]?.focus();
        }
        else if (event.key === 'Tab')
        {
            setTimeout(() => {
                if (menu.isConnected && !menu.contains(document.activeElement)) closeGeneographObjectContextMenu();
            }, 0);
        }
    });
    geneoObjectMenuController = new AbortController();
    const signal = geneoObjectMenuController.signal;
    document.addEventListener('pointerdown', event =>
    {
        if (!menu.contains(event.target)) closeGeneographObjectContextMenu();
    }, { signal });
    window.addEventListener('resize', closeGeneographObjectContextMenu, { signal });
    menu.querySelector('[role="menuitem"]:not(:disabled)')?.focus();
}

function deleteGeneographSelection({ detachFamilies = false } = {})
{
    const diagram = selectedGeneographDiagram();
    const connections = selectedGeneographConnections();
    const nodes = selectedGeneographNodes();
    if (!connections.length && !nodes.length) return;
    geneoPushHistory();
    if (detachFamilies)
        geneoDetachCutPeople(new Set(nodes.filter(node => node.type === 'person').map(node => node.personId)));
    connections.map(connection => connection.id).forEach(connectionId =>
    {
        if (getGeneographConnection(connectionId)) removeGeneographRelationship(connectionId);
    });
    const deletedIds = new Set(nodes.map(node => node.id));
    const siblingFamilyIds = new Set(diagram.connections.filter(item => item.kind === 'family-sibling' && (deletedIds.has(item.source.nodeId) || deletedIds.has(item.target.nodeId))).map(item => item.familyId).filter(Boolean));
    diagram.nodes.forEach(node =>
    {
        if (node.parentPanelId && deletedIds.has(node.parentPanelId) && !deletedIds.has(node.id)) node.parentPanelId = null;
    });
    diagram.connections = diagram.connections.filter(item => !deletedIds.has(item.source.nodeId) && !deletedIds.has(item.target.nodeId));
    diagram.nodes = diagram.nodes.filter(item => !deletedIds.has(item.id));
    pruneGeneographBoardAssets(diagram);
    siblingFamilyIds.forEach(rebuildGeneographSiblingFamily);
    selectGeneographCanvas(); touchGeneographBoard(); renderGeneographEditorPreserveScroll();
}

function geneoNodeHasSelectedAncestor(node, selectedIds)
{
    let parentId = node?.parentPanelId;
    while (parentId)
    {
        if (selectedIds.has(parentId)) return true;
        parentId = getGeneographNode(parentId)?.parentPanelId || null;
    }
    return false;
}

function geneoGroupMoveSnapshot(nodes)
{
    const selectedIds = new Set(nodes.map(node => node.id));
    const roots = nodes.filter(node => !geneoNodeHasSelectedAncestor(node, selectedIds));
    const movingIds = new Set();
    const addNodeAndDescendants = node =>
    {
        if (!node || movingIds.has(node.id)) return;
        movingIds.add(node.id);
        if (node.type === 'panel') selectedGeneographDiagram().nodes.filter(child => child.parentPanelId === node.id).forEach(addNodeAndDescendants);
    };
    roots.forEach(addNodeAndDescendants);
    return selectedGeneographDiagram().nodes.filter(node => movingIds.has(node.id) && !geneoNodeEffectiveLocked(node)).map(node => ({ id: node.id, x: node.x, y: node.y }));
}

function geneoReferenceMovesWithNodes(reference, movingNodeIds)
{
    if (reference?.nodeId) return movingNodeIds.has(reference.nodeId);
    if (!reference?.familyId) return false;
    const family = getGeneographFamily(reference.familyId);
    const partnerNodeIds = (family?.partnerIds || []).map(personId =>
        selectedGeneographDiagram().nodes.find(node => node.type === 'person' && node.personId === personId)?.id
    ).filter(Boolean);
    return partnerNodeIds.length > 0 && partnerNodeIds.every(nodeId => movingNodeIds.has(nodeId));
}

function geneoConnectionMoveSnapshot(nodes, connections = selectedGeneographConnections())
{
    const movingNodeIds = new Set(nodes.map(node => node.id));
    const selectedConnectionIds = new Set(connections.map(connection => connection.id));
    return selectedGeneographDiagram().connections.flatMap(connection =>
    {
        const selected = selectedConnectionIds.has(connection.id);
        const followsNodes = connection.route?.mode === 'manual'
          && geneoReferenceMovesWithNodes(connection.source, movingNodeIds)
          && geneoReferenceMovesWithNodes(connection.target, movingNodeIds);
        if (!selected && !followsNodes) return [];
        const renderedPoints = geneoConnectionPoints(connection);
        const waypoints = connection.route?.mode === 'manual'
            ? connection.route.waypoints.map(point => ({ ...point }))
            : selected ? renderedPoints.slice(1, -1).map(point => ({ ...point })) : [];
        if (!waypoints.length) return [];
        return [{ id: connection.id, waypoints, materialize: connection.route?.mode !== 'manual' }];
    });
}

function applyGeneographSelectionTranslation(pointerState, dx, dy)
{
    pointerState.nodes.forEach(item =>
    {
        const node = getGeneographNode(item.id);
        if (node)
        {
            node.x = geneoNumber(item.x + dx, node.x, -GENEO_WORLD_LIMIT, GENEO_WORLD_LIMIT);
            node.y = geneoNumber(item.y + dy, node.y, -GENEO_WORLD_LIMIT, GENEO_WORLD_LIMIT);
        }
    });
    pointerState.connections.forEach(item =>
    {
        const connection = getGeneographConnection(item.id);
        if (!connection) return;
        connection.route = {
            mode: 'manual',
            waypoints: item.waypoints.map(point =>
            {
                const translated = {
                    x: geneoNumber(point.x + dx, point.x, -GENEO_WORLD_LIMIT, GENEO_WORLD_LIMIT),
                    y: geneoNumber(point.y + dy, point.y, -GENEO_WORLD_LIMIT, GENEO_WORLD_LIMIT)
                };
                return pointerState.nodes.length || !selectedGeneographDiagram().canvas.snapToGrid
                    ? translated : snapGeneographPoint(translated);
            })
        };
    });
}

function geneoClearAlignmentGuides()
{
    main.querySelectorAll('[data-geneo-align-x], [data-geneo-align-y]').forEach(guide => { guide.hidden = true; });
}

function geneoShowAlignmentGuides(guides)
{
    const bounds = geneoCanvasRuntime.bounds || { left: 0, top: 0 };
    const vertical = main.querySelector('[data-geneo-align-x]');
    const horizontal = main.querySelector('[data-geneo-align-y]');
    if (vertical)
    {
        vertical.hidden = !guides.x;
        if (guides.x)
        {
            vertical.style.left = `${guides.x.position - bounds.left}px`;
            vertical.style.top = `${guides.x.start - bounds.top}px`;
            vertical.style.height = `${guides.x.end - guides.x.start}px`;
            vertical.style.width = `${2 / (state.geneoZoom / 100)}px`;
        }
    }
    if (horizontal)
    {
        horizontal.hidden = !guides.y;
        if (guides.y)
        {
            horizontal.style.left = `${guides.y.start - bounds.left}px`;
            horizontal.style.top = `${guides.y.position - bounds.top}px`;
            horizontal.style.width = `${guides.y.end - guides.y.start}px`;
            horizontal.style.height = `${2 / (state.geneoZoom / 100)}px`;
        }
    }
}

function geneoMoveAlignmentContext(pointerState)
{
    if (pointerState.alignmentContext) return pointerState.alignmentContext;
    const movingIds = new Set(pointerState.nodes.map(item => item.id));
    const movingNodes = pointerState.nodes.flatMap(item =>
    {
        const node = getGeneographNode(item.id);
        return node ? [{ id: item.id, type: node.type, x: item.x, y: item.y, width: node.width, height: node.height }] : [];
    });
    if (!movingNodes.length) return null;
    const targets = selectedGeneographDiagram().nodes.filter(target =>
        geneoNodeEffectiveVisible(target)
        && target.type !== 'drawing'
        && !movingIds.has(target.id)
        && !movingNodes.some(moving =>
            geneoNodeInsidePanel(target, moving.id)
            || geneoNodeInsidePanel(getGeneographNode(moving.id), target.id)
        )
    ).map(target => ({ id: target.id, type: target.type, x: target.x, y: target.y, width: target.width, height: target.height }));
    pointerState.alignmentContext = { movingNodes, targets, matches: null };
    return pointerState.alignmentContext;
}

function geneoPointerToCanvas(event)
{
    const stage = main.querySelector('[data-geneo-stage]');
    const rect = stage?.getBoundingClientRect();
    const bounds = geneoCanvasRuntime.bounds || { left: 0, top: 0 };
    const zoom = state.geneoZoom / 100;
    return {
        x: bounds.left + (event.clientX - (rect?.left || 0)) / zoom,
        y: bounds.top + (event.clientY - (rect?.top || 0)) / zoom
    };
}

function cancelGeneographConnectionDraft()
{
    state.geneoConnectionDraft = null;
    clearGeneographConnectionClick();
    geneoCanvasRuntime.connectionPreviewPoint = null;
    geneoCanvasRuntime.connectionHoverTarget = null;
    if (geneoCanvasRuntime.connectionPreviewFrame) cancelAnimationFrame(geneoCanvasRuntime.connectionPreviewFrame);
    geneoCanvasRuntime.connectionPreviewFrame = null;
    main.querySelector('[data-geneo-connection-tip]')?.remove();
}

function exitGeneographConnectionTool()
{
    cancelGeneographConnectionDraft();
    selectGeneographCanvas();
    geneoConnectionToolRuntime.panelOpen = false;
    state.geneoTool = 'pan';
    renderGeneographEditorPreserveScroll({
        preserveInspectorScroll: true,
        preserveSidebarScroll: true
    });
}

function geneoConnectionCandidateExists(source, target, kind = null)
{
    return selectedGeneographDiagram()?.connections.some(connection =>
        (!kind || connection.kind === kind) && (
        geneoConnectionReferencesMatch(connection.source, source) && geneoConnectionReferencesMatch(connection.target, target)
        || geneoConnectionReferencesMatch(connection.source, target) && geneoConnectionReferencesMatch(connection.target, source)));
}

function geneoConnectionReferencesMatch(source, target)
{
    return source?.nodeId === target?.nodeId
        && source?.familyId === target?.familyId
        && source?.port === target?.port;
}

function geneoConnectionTipText(source, target)
{
    if (geneoConnectionReferencesMatch(source, target)) return null;
    if (!source.familyId && !target.familyId && !geneoPersonIdForNode(source.nodeId) && !geneoPersonIdForNode(target.nodeId))
        return null;
    const result = canCreateGeneographConnection(source, target, geneoConnectionToolRuntime.purpose);
    if (result.valid && geneoConnectionCandidateExists(source, target, result.kind)) return { text: t('That connection already exists.'), invalid: true };
    if (result.valid && result.kind === 'visual') return geneoConnectionToolRuntime.purpose === 'visual'
        ? { text: t('Visual connection'), invalid: false } : null;
    if (!result.valid) return { text: t(result.reason), invalid: true };
    if (result.kind === 'visual') return null;
    const personName = personId => geneoPersonDisplayName(getGeneographPerson(personId) || {});
    if (result.kind === 'family-partner') return { text: t('Connect as partners'), invalid: false };
    if (result.kind === 'family-sibling') return { text: t('Connect as siblings'), invalid: false };
    if (result.familyId)
        return { text: t('Add {child} to this family').replace('{child}', personName(result.childPersonId)), invalid: false };
    return { text: t('{parent} is parent of {child}')
        .replace('{parent}', personName(result.parentPersonId))
        .replace('{child}', personName(result.childPersonId)), invalid: false };
}

function updateGeneographConnectionTip()
{
    const target = geneoCanvasRuntime.connectionHoverTarget;
    const viewport = main.querySelector('[data-geneo-canvas-viewport]');
    let tip = viewport?.querySelector('[data-geneo-connection-tip]');
    if (geneoEffectiveCanvasTool() !== 'connect' || !state.geneoConnectionDraft || !target?.element?.isConnected || !viewport)
    {
        tip?.remove();
        return;
    }
    const message = geneoConnectionTipText(state.geneoConnectionDraft, target.reference);
    if (!message)
    {
        tip?.remove();
        return;
    }
    if (!tip)
    {
        tip = document.createElement('div');
        tip.dataset.geneoConnectionTip = '';
        tip.className = 'geneo-connection-tip';
        tip.setAttribute('role', 'status');
        viewport.appendChild(tip);
    }
    if (tip.textContent !== message.text) tip.textContent = message.text;
    tip.classList.toggle('invalid', message.invalid);
    const viewportRect = viewport.getBoundingClientRect();
    const socketRect = target.element.getBoundingClientRect();
    const stageRect = main.querySelector('[data-geneo-stage]')?.getBoundingClientRect();
    const bounds = geneoCanvasRuntime.bounds || { left: 0, top: 0 };
    const points = geneoConnectionPreviewPoints(state.geneoConnectionDraft, geneoConnectionPoint(target.reference));
    const end = points.at(-1);
    const previous = points.at(-2);
    const zoom = state.geneoZoom / 100;
    const lineX = (stageRect?.left || 0) + (end.x * .45 + previous.x * .55 - bounds.left) * zoom - viewportRect.left;
    const lineY = (stageRect?.top || 0) + (end.y * .45 + previous.y * .55 - bounds.top) * zoom - viewportRect.top;
    const tipWidth = tip.offsetWidth;
    const tipHeight = tip.offsetHeight;
    const lineVisible = lineX >= 0 && lineX <= viewportRect.width && lineY >= 0 && lineY <= viewportRect.height;
    const center = lineVisible ? lineX : socketRect.left + socketRect.width / 2 - viewportRect.left;
    const above = (lineVisible ? lineY : socketRect.top - viewportRect.top) - tipHeight - 13;
    const clampLeft = value => Math.max(8, Math.min(value, viewportRect.width - tipWidth - 8));
    let left = clampLeft(center - tipWidth / 2);
    let top = Math.max(8, Math.min(above >= 8 ? above : (lineVisible ? lineY : socketRect.bottom - viewportRect.top) + 13,
        viewportRect.height - tipHeight - 8));
    const card = target.element.closest('[data-geneo-node]')?.getBoundingClientRect();
    if (card && left + tipWidth > card.left - viewportRect.left && left < card.right - viewportRect.left
        && top + tipHeight > card.top - viewportRect.top && top < card.bottom - viewportRect.top)
    {
        const aboveCard = card.top - viewportRect.top - tipHeight - 9;
        const belowCard = card.bottom - viewportRect.top + 9;
        if (aboveCard >= 8) top = aboveCard;
        else if (belowCard + tipHeight <= viewportRect.height - 8) top = belowCard;
        else left = clampLeft(card.left - viewportRect.left - tipWidth - 9);
    }
    tip.style.left = `${left}px`;
    tip.style.top = `${top}px`;
}

function setGeneographConnectionHoverTarget(element)
{
    if (geneoEffectiveCanvasTool() !== 'connect' || !state.geneoConnectionDraft || !element)
    {
        geneoCanvasRuntime.connectionHoverTarget = null;
        updateGeneographConnectionTip();
        return;
    }
    const reference = element.hasAttribute('data-geneo-family-junction')
        ? { familyId: element.dataset.geneoFamilyJunction, port: 'bottom' }
        : { nodeId: element.dataset.geneoPortNode, port: element.dataset.geneoPort };
    geneoCanvasRuntime.connectionHoverTarget = { element, reference };
    geneoCanvasRuntime.connectionPreviewPoint = geneoConnectionPoint(reference);
    main.querySelector('[data-geneo-connection-preview]')?.setAttribute('d',
        geneoRoundedPolylinePath(geneoConnectionPreviewPoints(state.geneoConnectionDraft, geneoCanvasRuntime.connectionPreviewPoint), geneoConnectionToolStyle().cornerRadius));
    updateGeneographConnectionTip();
}

function activateGeneographConnectionPoint(reference)
{
    if (!state.geneoConnectionDraft)
    {
        if (state.geneoTool !== 'connect') geneoConnectionToolRuntime.purpose = 'automatic';
        state.geneoTool = 'connect';
        state.geneoConnectionDraft = reference;
        geneoCanvasRuntime.connectionPreviewPoint = geneoConnectionPoint(reference);
        renderGeneographEditorPreserveScroll();
        return;
    }
    if (geneoConnectionReferencesMatch(state.geneoConnectionDraft, reference))
    {
        exitGeneographConnectionTool();
        return;
    }
    const created = commitGeneographConnection(state.geneoConnectionDraft, reference);
    if (created)
    {
        cancelGeneographConnectionDraft();
        state.geneoTool = 'pan';
        showToast('Connection created.');
    }
    renderGeneographEditorPreserveScroll();
}

function updateGeneographConnectionPreview(event)
{
    if (geneoEffectiveCanvasTool() !== 'connect' || !state.geneoConnectionDraft || !event.target.closest?.('[data-geneo-canvas-viewport]')) return;
    if (geneoCanvasRuntime.connectionHoverTarget?.element?.contains(event.target)) return;
    const clientX = event.clientX;
    const clientY = event.clientY;
    if (geneoCanvasRuntime.connectionPreviewFrame) cancelAnimationFrame(geneoCanvasRuntime.connectionPreviewFrame);
    geneoCanvasRuntime.connectionPreviewFrame = requestAnimationFrame(() =>
    {
        geneoCanvasRuntime.connectionPreviewFrame = null;
        if (!state.geneoConnectionDraft) return;
        const point = geneoCanvasRuntime.connectionHoverTarget?.element?.isConnected
            ? geneoConnectionPoint(geneoCanvasRuntime.connectionHoverTarget.reference)
            : geneoPointerToCanvas({ clientX, clientY });
        geneoCanvasRuntime.connectionPreviewPoint = point;
        const preview = main.querySelector('[data-geneo-connection-preview]');
        if (preview) preview.setAttribute('d', geneoRoundedPolylinePath(geneoConnectionPreviewPoints(state.geneoConnectionDraft, point), geneoConnectionToolStyle().cornerRadius));
    });
}

function startGeneographPanGesture(event, fromConnect = false)
{
    const wrap = event.target.closest('[data-geneo-canvas-wrap]');
    if (!wrap) return false;
    geneoPointerState = {
        kind: 'pan', pointerId: event.pointerId, fromConnect, wrap,
        clientX: event.clientX, clientY: event.clientY,
        left: wrap.scrollLeft, top: wrap.scrollTop, moved: false,
        suppressItemClick: !fromConnect
    };
    event.preventDefault();
    event.stopPropagation();
    return true;
}

function startGeneographObjectDrag(event)
{
    if (geneoPointerState || event.isPrimary === false) return;
    const nodeElement = event.target.closest('[data-geneo-node]'); if (!nodeElement || event.button !== 0 ||
      event.target.closest(
          [
              'button',
              'input',
              'textarea',
              'select',
              'a',
              '[contenteditable]',
              '.rich-text-toolbar',
              '.ql-tooltip'
          ].join(',')
      ))
        return;
    const node = getGeneographNode(nodeElement.dataset.geneoNode);
    if (node?.type === 'panel' && geneoEffectiveCanvasTool() === 'select'
        && !geneoPanelDirectTarget(event, nodeElement)) return;
    if (!node || (!['select', 'pan'].includes(geneoEffectiveCanvasTool())
        && !(geneoEffectiveCanvasTool() === 'connect' && geneoSelectedNodeIdSet().has(node.id)))) return;
    if (event.ctrlKey || event.metaKey) return;
    if (geneoEffectiveCanvasTool() === 'pan'
        && (!geneoSelectedNodeIdSet().has(node.id) || geneoNodeEffectiveLocked(node)))
    {
        startGeneographPanGesture(event);
        return;
    }
    const pendingSelectNodeId = event.shiftKey && !geneoSelectedNodeIdSet().has(node.id) ? node.id : null;
    if (!geneoSelectedNodeIdSet().has(node.id) && !pendingSelectNodeId) selectGeneographNode(node.id);
    if (geneoNodeEffectiveLocked(node)) return;
    if (!event.shiftKey)
    {
        event.preventDefault();
        event.stopPropagation();
    }
    const beforeSnapshot = geneoSnapshot();
    const undoLength = geneoHistoryRuntime.undo.length;
    const redo = [...geneoHistoryRuntime.redo];
    geneoPushHistory(); const point = geneoPointerToCanvas(event);
    const selection = pendingSelectNodeId ? [node] : selectedGeneographNodes();
    const nodes = geneoGroupMoveSnapshot(selection);
    const connections = geneoConnectionMoveSnapshot(nodes, pendingSelectNodeId ? [] : selectedGeneographConnections());
    if (!nodes.length && !connections.length)
    {
        geneoHistoryRuntime.undo.pop(); return;
    }
    geneoPointerState = { kind: 'move-group', pointerId: event.pointerId, beforeSnapshot, undoLength, redo, nodeId: node.id, start: point, x: node.x, y: node.y, nodes, connections, pendingSelectNodeId, axisLockAllowed: true, axisLock: null, moved: false,
        panThreshold: geneoEffectiveCanvasTool() === 'pan', clientX: event.clientX, clientY: event.clientY };
}

function geneoPanelDirectTarget(event, element)
{
    if (event.type === 'click' && event.detail === 0) return true;
    const rect = element.getBoundingClientRect();
    const edge = 12;
    if (event.clientX - rect.left <= edge || rect.right - event.clientX <= edge
        || event.clientY - rect.top <= edge || rect.bottom - event.clientY <= edge) return true;
    const title = element.querySelector('.geneo-panel-title');
    if (!title) return false;
    const titleRect = title.getBoundingClientRect();
    return event.clientX >= titleRect.left && event.clientX <= titleRect.right
        && event.clientY >= titleRect.top && event.clientY <= titleRect.bottom;
}

function geneoNodeInsidePanel(node, panelId)
{
    let parentId = node.parentPanelId;
    while (parentId)
    {
        if (parentId === panelId) return true;
        parentId = getGeneographNode(parentId)?.parentPanelId;
    }
    return false;
}

function startGeneographSelectedConnectionDrag(event, connection)
{
    if (!connection || geneoPointerState || event.isPrimary === false) return false;
    if (event.button !== 0 || !['select', 'pan', 'connect'].includes(geneoEffectiveCanvasTool()) || event.shiftKey || event.ctrlKey || event.metaKey) return false;
    if (geneoEffectiveCanvasTool() === 'pan' && !geneoSelectedConnectionIdSet().has(connection.id))
        return startGeneographPanGesture(event);
    if (!geneoSelectedConnectionIdSet().has(connection.id)) selectGeneographConnection(connection.id);
    const beforeSnapshot = geneoSnapshot();
    const undoLength = geneoHistoryRuntime.undo.length;
    const redo = [...geneoHistoryRuntime.redo];
    geneoPushHistory();
    const nodes = geneoGroupMoveSnapshot(selectedGeneographNodes());
    const connections = geneoConnectionMoveSnapshot(nodes, selectedGeneographConnections());
    if (!nodes.length && !connections.length)
    {
        geneoHistoryRuntime.undo.pop(); return true;
    }
    geneoPointerState = {
        kind: 'move-group',
        pointerId: event.pointerId,
        beforeSnapshot, undoLength, redo,
        nodeId: nodes[0]?.id || null,
        start: geneoPointerToCanvas(event),
        x: nodes[0]?.x || 0,
        y: nodes[0]?.y || 0,
        nodes,
        connections,
        moved: false,
        panThreshold: geneoEffectiveCanvasTool() === 'pan',
        clientX: event.clientX, clientY: event.clientY
    };
    event.preventDefault();
    event.stopPropagation();
    return true;
}

function startGeneographConnectionDrag(event)
{
    const path = event.target.closest('.geneo-connection-hit');
    return path ? startGeneographSelectedConnectionDrag(event,
        getGeneographConnection(path.dataset.geneoConnection)) : false;
}

function startGeneographResize(
    event
)
{
    const button =
        event.target.closest(
            '[data-geneo-resize]'
        );

    if (
        !button
        || event.button !== 0
    )
    {
        return false;
    }

    if (geneoPointerState || event.isPrimary === false) return true;

    const node =
        getGeneographNode(
            button.dataset.geneoNode
        );

    if (
        !node
        || geneoNodeEffectiveLocked(
            node
        )
    )
    {
        return true;
    }

    const beforeSnapshot = geneoSnapshot();
    const undoLength = geneoHistoryRuntime.undo.length;
    const redo = [...geneoHistoryRuntime.redo];
    geneoPushHistory();

    geneoPointerState = {
        kind: 'resize',
        pointerId: event.pointerId,
        beforeSnapshot, undoLength, redo,

        nodeId:
          node.id,

        handle:
          button.dataset.geneoResize,

        start:
          geneoPointerToCanvas(
              event
          ),

        x:
          node.x,

        y:
          node.y,

        width:
          node.width,

        height:
          node.height,

        aspectRatio:
          node.width / node.height,

        lockAspectRatio:
          event.shiftKey
          || geneoShiftPressed,

        moved: false
    };

    event.preventDefault();
    event.stopPropagation();

    return true;
}

function moveGeneographObject(event)
{
    const cropDrag = geneoImageCropRuntime?.drag;
    if (cropDrag && cropDrag.pointerId === event.pointerId)
    {
        if (cropDrag.kind === 'scale')
        {
            const dx = (event.clientX - cropDrag.clientX) / cropDrag.boardZoom;
            const dy = (event.clientY - cropDrag.clientY) / cropDrag.boardZoom;
            const horizontal = cropDrag.handle.includes('e') ? 1 : cropDrag.handle.includes('w') ? -1 : 0;
            const vertical = cropDrag.handle.includes('s') ? 1 : cropDrag.handle.includes('n') ? -1 : 0;
            const delta = (dx * horizontal * cropDrag.baseWidth + dy * vertical * cropDrag.baseHeight)
                / ((horizontal * cropDrag.baseWidth) ** 2 + (vertical * cropDrag.baseHeight) ** 2);
            geneoImageCropRuntime.draft = { zoom: cropDrag.zoom, x: cropDrag.x, y: cropDrag.y };
            geneoScaleImageCropFromHandle(cropDrag.handle, cropDrag.zoom + delta);
        }
        else
        {
            geneoImageCropRuntime.draft.x = cropDrag.x + (event.clientX - cropDrag.clientX) / cropDrag.width;
            geneoImageCropRuntime.draft.y = cropDrag.y + (event.clientY - cropDrag.clientY) / cropDrag.height;
            geneoRefreshImageCropDom();
        }
        return;
    }
    updateGeneographConnectionPreview(event);
    if (!geneoPointerState) return;
    if (geneoPointerState.pointerId !== undefined && event.pointerId !== geneoPointerState.pointerId) return;
    if (geneoPointerState.kind === 'pencil')
    {
        if (event.pointerId !== geneoPointerState.pointerId) return;
        const point = geneoPointerToCanvas(event);
        const previous = geneoPointerState.points.at(-1);
        const minimumDistance = 2 / Math.max(.1, state.geneoZoom / 100);
        if (previous && Math.hypot(point.x - previous.x, point.y - previous.y) < minimumDistance) return;
        geneoPointerState.points.push(point);
        geneoPointerState.moved = true;
        updateGeneographPencilPreview(geneoPointerState.points);
        return;
    }
    if (geneoPointerState.kind === 'pan')
    {
        const dx = event.clientX - geneoPointerState.clientX;
        const dy = event.clientY - geneoPointerState.clientY;
        if (!geneoPointerState.moved && Math.hypot(dx, dy) < 5) return;
        geneoPointerState.moved = true;
        geneoPointerState.wrap.scrollLeft = geneoPointerState.left - dx;
        geneoPointerState.wrap.scrollTop = geneoPointerState.top - dy;
        return;
    }
    if (
        geneoPointerState.kind === 'draw-panel'
        || geneoPointerState.kind === 'draw-shape'
    )
    {
        const point = snapGeneographPoint(
            geneoPointerToCanvas(event)
        );

        const rect = geneoPanelDraftRect(
            geneoPointerState.start,
            point
        );

        geneoPointerState.current = point;
        geneoPointerState.moved =
            rect.width > 2
          || rect.height > 2;

        updateGeneographPanelDraftDom(
            geneoPointerState.start,
            point
        );

        return;
    }
    if (geneoPointerState.kind === 'waypoint')
    {
        const connection = getGeneographConnection(geneoPointerState.connectionId);
        const point = snapGeneographPoint(geneoPointerToCanvas(event));
        const waypoint = connection?.route.waypoints[geneoPointerState.index];
        if (waypoint)
        {
            clearGeneographConnectionClick(); waypoint.x = geneoNumber(point.x, waypoint.x, -GENEO_WORLD_LIMIT, GENEO_WORLD_LIMIT); waypoint.y = geneoNumber(point.y, waypoint.y, -GENEO_WORLD_LIMIT, GENEO_WORLD_LIMIT); geneoPointerState.moved = true; const svg = main.querySelector('.geneo-connections'); if (svg) svg.outerHTML = renderGeneographConnectors();
        }
        return;
    }
    if (geneoPointerState.kind === 'family-bus-rail')
    {
        const point = geneoPointerToCanvas(event);
        const bus = geneoPointerState;
        const nextY = geneoClampFamilyBusRailY(bus,
            bus.railY + point.y - bus.start.y);
        if (nextY === bus.railY && !bus.moved) return;
        const currentY = getGeneographConnection(bus.connectionIds[0])?.route?.railY ?? bus.railY;
        if (nextY === currentY) return;
        clearGeneographConnectionClick();
        geneoSetFamilyBusRailY(bus, nextY);
        bus.moved = true;
        const svg = main.querySelector('.geneo-connections');
        if (svg) svg.outerHTML = renderGeneographConnectors();
        return;
    }
    if (geneoPointerState.kind === 'segment')
    {
        const connection = getGeneographConnection(geneoPointerState.connectionId);
        const point = geneoPointerToCanvas(event);
        const dx = point.x - geneoPointerState.start.x;
        const dy = point.y - geneoPointerState.start.y;
        if (Math.hypot(dx, dy) <= 1) return;
        const first = connection?.route.waypoints[geneoPointerState.firstWaypoint];
        const second = connection?.route.waypoints[geneoPointerState.secondWaypoint];
        if (first && second)
        {
            clearGeneographConnectionClick();
            if (geneoPointerState.vertical)
            {
                const x = snapGeneographCoordinate(geneoPointerState.first.x + dx); first.x = x; second.x = x;
            }
            else
            {
                const y = snapGeneographCoordinate(geneoPointerState.first.y + dy); first.y = y; second.y = y;
            }
            geneoPointerState.moved = true;
            const svg = main.querySelector('.geneo-connections'); if (svg) svg.outerHTML = renderGeneographConnectors();
        }
        return;
    }
    if (geneoPointerState.kind === 'marquee')
    {
        const point = geneoPointerToCanvas(event);
        const left = Math.min(geneoPointerState.start.x, point.x);
        const top = Math.min(geneoPointerState.start.y, point.y);
        const right = Math.max(geneoPointerState.start.x, point.x);
        const bottom = Math.max(geneoPointerState.start.y, point.y);
        geneoPointerState.current = point;
        geneoPointerState.moved = Math.abs(right - left) > 2 || Math.abs(bottom - top) > 2;
        const rect = { left, top, right, bottom };
        const hitIds = selectedGeneographDiagram().nodes.filter(node =>
        {
            if (!geneoNodeEffectiveVisible(node)) return false;
            if (geneoPointerState.panelId && !geneoNodeInsidePanel(node, geneoPointerState.panelId)) return false;
            if (node.type === 'panel' && !(node.x >= left && node.y >= top
                && node.x + node.width <= right && node.y + node.height <= bottom)) return false;
            if (node.type === 'drawing') return geneoDrawingIntersectsRect(node, rect);
            return node.x < right && node.x + node.width > left && node.y < bottom && node.y + node.height > top;
        }).map(node => node.id);
        const selectedPanels = new Set(hitIds.filter(id => getGeneographNode(id)?.type === 'panel'));
        const rootHitIds = hitIds.filter(id => ![...selectedPanels].some(panelId => geneoNodeInsidePanel(getGeneographNode(id), panelId)));
        const hitConnectionIds = selectedGeneographDiagram().connections.filter(connection => geneoConnectionIntersectsRect(connection, rect)).map(connection => connection.id);
        const nextIds = geneoPointerState.additive ? [...new Set([...geneoPointerState.baseIds, ...rootHitIds])] : rootHitIds;
        const nextConnectionIds = geneoPointerState.additive ? [...new Set([...geneoPointerState.baseConnectionIds, ...hitConnectionIds])] : hitConnectionIds;
        setGeneographSelection(nextIds, nextConnectionIds, { nodeId: rootHitIds.at(-1) || nextIds.at(-1), connectionId: hitConnectionIds.at(-1) || nextConnectionIds.at(-1) });
        const bounds = geneoCanvasRuntime.bounds || { left: 0, top: 0 };
        const marquee = main.querySelector('[data-geneo-marquee]');
        if (marquee)
        {
            marquee.hidden = false;
            marquee.style.left = `${left - bounds.left}px`; marquee.style.top = `${top - bounds.top}px`;
            marquee.style.width = `${right - left}px`; marquee.style.height = `${bottom - top}px`;
        }
        const selectedIds = geneoSelectedNodeIdSet();
        main.querySelectorAll('article[data-geneo-node]').forEach(element => element.classList.toggle('selected', selectedIds.has(element.dataset.geneoNode)));
        const selectedConnectionIds = geneoSelectedConnectionIdSet();
        main.querySelectorAll('[data-geneo-connection-group]').forEach(element => element.classList.toggle('selected', selectedConnectionIds.has(element.dataset.geneoConnectionGroup)));
        return;
    }
    const node = getGeneographNode(geneoPointerState.nodeId);
    const point = geneoPointerToCanvas(event); const dx = point.x - geneoPointerState.start.x; const dy = point.y - geneoPointerState.start.y; geneoPointerState.moved = Math.abs(dx) > 1 || Math.abs(dy) > 1;
    if (geneoPointerState.moved && geneoPointerState.kind === 'resize') clearGeneographConnectionClick();
    if (geneoPointerState.kind === 'move-group')
    {
        if (geneoPointerState.panThreshold && !geneoPointerState.started
            && Math.hypot(event.clientX - geneoPointerState.clientX,
                event.clientY - geneoPointerState.clientY) < 5)
        {
            geneoPointerState.moved = false;
            return;
        }
        geneoPointerState.started = true;
        if (!geneoPointerState.moved) return;
        if (geneoPointerState.pendingSelectNodeId)
        {
            setGeneographNodeSelection([geneoPointerState.pendingSelectNodeId], geneoPointerState.pendingSelectNodeId);
            geneoPointerState.pendingSelectNodeId = null;
        }
        geneoPointerState.axisLock = geneoAxisLockForMove(
            geneoPointerState.axisLock,
            geneoPointerState.axisLockAllowed && event.shiftKey,
            dx, dy
        );
        const moveDx = geneoPointerState.axisLock === 'x' ? 0 : dx;
        const moveDy = geneoPointerState.axisLock === 'y' ? 0 : dy;
        let deltaX = moveDx, deltaY = moveDy;
        if (selectedGeneographDiagram().canvas.snapToGrid)
        {
            deltaX = node ? snapGeneographCoordinate(geneoPointerState.x + moveDx) - geneoPointerState.x : Math.round(moveDx / GENEO_GRID_SIZE) * GENEO_GRID_SIZE;
            deltaY = node ? snapGeneographCoordinate(geneoPointerState.y + moveDy) - geneoPointerState.y : Math.round(moveDy / GENEO_GRID_SIZE) * GENEO_GRID_SIZE;
        }
        if (geneoPointerState.axisLock === 'x') deltaX = 0;
        if (geneoPointerState.axisLock === 'y') deltaY = 0;
        const alignmentContext = geneoMoveAlignmentContext(geneoPointerState);
        if (alignmentContext)
        {
            const aligned = geneoCalculateAlignment({
                movingNodes: alignmentContext.movingNodes,
                targets: alignmentContext.targets,
                dx: moveDx, dy: moveDy, fallbackDx: deltaX, fallbackDy: deltaY,
                zoom: state.geneoZoom / 100,
                lockedAxis: geneoPointerState.axisLock,
                previous: alignmentContext.matches
            });
            deltaX = aligned.dx;
            deltaY = aligned.dy;
            alignmentContext.matches = aligned.matches;
            geneoShowAlignmentGuides(aligned.guides);
        }
        else geneoClearAlignmentGuides();
        if (geneoPointerState.moved) clearGeneographConnectionClick();
        applyGeneographSelectionTranslation(geneoPointerState, deltaX, deltaY);
        updateGeneographLiveGeometry(node, geneoPointerState.nodes.map(item => getGeneographNode(item.id)).filter(Boolean));
        return;
    }
    else
    {
        if (!node) return;

        const diagram =
            selectedGeneographDiagram();

        const handle =
            geneoPointerState.handle;

        const west =
            handle.includes('w');

        const north =
            handle.includes('n');

        const east =
            handle.includes('e');

        const south =
            handle.includes('s');

        if (
            node.type === 'person'
          && (north || south)
        )
        {
            node.personCard.heightMode =
                'manual';
        }

        if (
            node.type === 'place'
          && geneoPointerState.moved
        )
        {
            node.placeSizeMode =
                'manual';
        }

        const fixedLeft =
            geneoPointerState.x;

        const fixedTop =
            geneoPointerState.y;

        const fixedRight =
            geneoPointerState.x
          + geneoPointerState.width;

        const fixedBottom =
            geneoPointerState.y
          + geneoPointerState.height;

        let left =
            west
                ? fixedLeft + dx
                : fixedLeft;

        let right =
            east
                ? fixedRight + dx
                : fixedRight;

        let top =
            north
                ? fixedTop + dy
                : fixedTop;

        let bottom =
            south
                ? fixedBottom + dy
                : fixedBottom;

        if (diagram.canvas.snapToGrid)
        {
            if (west)
            {
                left =
                    snapGeneographCoordinate(
                        left
                    );
            }
            else if (east)
            {
                right =
                    snapGeneographCoordinate(
                        right
                    );
            }

            if (north)
            {
                top =
                    snapGeneographCoordinate(
                        top
                    );
            }
            else if (south)
            {
                bottom =
                    snapGeneographCoordinate(
                        bottom
                    );
            }
        }

        const maximumSize =
            geneoNodeMaximumSize(node);

        const baseMinimumSize =
            geneoNodeMinimumSize(
                node
            );

        let width;
        let height;

        const lockPersonRatio =
            node.type === 'person'
          && (
              event.shiftKey
            || geneoShiftPressed
            || geneoPointerState
                .lockAspectRatio
          )
          && (west || east)
          && (north || south);

        if (lockPersonRatio)
        {
            const rawWidth =
                Math.abs(right - left);

            const rawHeight =
                Math.abs(bottom - top);

            const horizontalIntent =
                Math.abs(
                    rawWidth
                / geneoPointerState.width
              - 1
                );

            const verticalIntent =
                Math.abs(
                    rawHeight
                / geneoPointerState.height
              - 1
                );

            const requestedScale =
                horizontalIntent >= verticalIntent
                    ? rawWidth
                / geneoPointerState.width
                    : rawHeight
                / geneoPointerState.height;

            const minimumScale =
                Math.max(
                    baseMinimumSize.width
                / geneoPointerState.width,
                    baseMinimumSize.height
                / geneoPointerState.height
                );

            const maximumScale =
                Math.min(
                    maximumSize.width
                / geneoPointerState.width,
                    maximumSize.height
                / geneoPointerState.height
                );

            const scale =
                geneoNumber(
                    requestedScale,
                    1,
                    minimumScale,
                    maximumScale
                );

            width =
                geneoPointerState.width
            * scale;

            height =
                geneoPointerState.height
            * scale;
        }
        else
        {
            width =
                geneoNumber(
                    right - left,
                    node.width,
                    baseMinimumSize.width,
                    maximumSize.width
                );

            height =
                geneoNumber(
                    bottom - top,
                    node.height,
                    baseMinimumSize.height,
                    maximumSize.height
                );
        }

        if (node.type === 'person' && diagram.canvas.snapToGrid && !lockPersonRatio)
        {
            const socketStep = GENEO_GRID_SIZE * 2;
            if (west || east)
                width = Math.max(
                    Math.ceil(baseMinimumSize.width / socketStep) * socketStep,
                    Math.min(Math.floor(maximumSize.width / socketStep) * socketStep,
                        Math.round(width / socketStep) * socketStep)
                );
            if (north || south)
                height = Math.max(
                    Math.ceil(baseMinimumSize.height / socketStep) * socketStep,
                    Math.min(Math.floor(maximumSize.height / socketStep) * socketStep,
                        Math.round(height / socketStep) * socketStep)
                );
        }

        /*
        * Preserve the opposite horizontal edge
        * after width clamping.
        */
        if (west)
        {
            left =
                fixedRight - width;

            right =
                fixedRight;
        }
        else
        {
            left =
                fixedLeft;

            right =
                fixedLeft + width;
        }

        /*
        * Preserve the opposite vertical edge
        * after height clamping.
        */
        if (north)
        {
            top =
                fixedBottom - height;

            bottom =
                fixedBottom;
        }
        else
        {
            top =
                fixedTop;

            bottom =
                fixedTop + height;
        }

        node.x =
            geneoNumber(
                left,
                node.x,
                -GENEO_WORLD_LIMIT,
                GENEO_WORLD_LIMIT
            );

        node.y =
            geneoNumber(
                top,
                node.y,
                -GENEO_WORLD_LIMIT,
                GENEO_WORLD_LIMIT
            );

        node.width =
            width;

        node.height =
            height;
    }
    updateGeneographLiveGeometry(node, geneoPointerState.kind === 'move-group' ? geneoPointerState.nodes.map(item => getGeneographNode(item.id)).filter(Boolean) : [node]);
}

function updateGeneographLiveGeometry(
    node,
    nodes = [node]
)
{
    const bounds =
        geneoCanvasRuntime.bounds
        || {
            left: 0,
            top: 0
        };

    nodes.forEach(item =>
    {
        const element =
            main.querySelector(
                `article[data-geneo-node="${
                    CSS.escape(
                        item.id
                    )
                }"]`
            );

        if (!element) return;

        element.style.left =
            `${
                item.x - bounds.left
            }px`;

        element.style.top =
            `${
                item.y - bounds.top
            }px`;

        element.style.width =
            `${item.width}px`;

        element.style.height =
            `${item.height}px`;
    });

    const svg =
        main.querySelector(
            '.geneo-connections'
        );

    if (svg)
    {
        svg.outerHTML =
            renderGeneographConnectors();
    }
}

function endGeneographObjectDrag(event)
{
    if (geneoImageCropRuntime?.drag?.pointerId === event.pointerId)
    {
        geneoImageCropRuntime.drag = null;
        return;
    }
    if (geneoPointerState?.pointerId !== undefined && event.pointerId !== geneoPointerState.pointerId) return;
    if (geneoPointerState?.kind === 'pencil' && event?.type === 'pointerup' && (event.buttons & 1)) return;
    if (!geneoPointerState) return; const stateBefore = geneoPointerState; geneoPointerState = null;
    geneoClearAlignmentGuides();
    if (event?.type === 'pointercancel' && stateBefore.beforeSnapshot)
    {
        geneoDrawPanPending = false;
        const board = selectedGeneographBoard();
        if (board) board.diagram = JSON.parse(stateBefore.beforeSnapshot);
        geneoHistoryRuntime.undo.length = stateBefore.undoLength;
        geneoHistoryRuntime.redo = stateBefore.redo;
        renderGeneographEditorPreserveScroll();
        return;
    }
    if (stateBefore.kind === 'pencil')
    {
        const switchToPan = geneoDrawPanPending;
        geneoDrawPanPending = false;
        updateGeneographPencilPreview();
        if (stateBefore.wrap?.hasPointerCapture?.(stateBefore.pointerId))
        {
            stateBefore.wrap.releasePointerCapture(stateBefore.pointerId);
        }
        geneoCanvasRuntime.suppressNodeClick = true;
        requestAnimationFrame(() =>
        {
            geneoCanvasRuntime.suppressNodeClick = false;
        });
        if (switchToPan)
        {
            geneoCreationToolSettings('drawing').panelOpen = false;
            state.geneoTool = 'pan';
            setGeneoCtrlSelectPressed(false);
        }
        if (event?.type === 'pointercancel')
        {
            if (switchToPan) renderGeneographEditorPreserveScroll();
            return;
        }
        const drawing = createGeneographDrawingFromPoints(stateBefore.points, stateBefore.beforeSnapshot);
        if (!drawing)
        {
            if (switchToPan) renderGeneographEditorPreserveScroll();
            return;
        }
        renderGeneographEditorPreserveScroll();
        requestAnimationFrame(() => main.querySelector(`[data-geneo-node="${CSS.escape(drawing.id)}"]`)?.focus({ preventScroll: true }));
        return;
    }
    if (
        stateBefore.kind === 'draw-panel'
        || stateBefore.kind === 'draw-shape'
    )
    {
        hideGeneographPanelDraftDom();

        geneoCanvasRuntime.suppressNodeClick = true;

        requestAnimationFrame(() =>
        {
            geneoCanvasRuntime.suppressNodeClick = false;
        });

        const rect = geneoPanelDraftRect(
            stateBefore.start,
            stateBefore.current || stateBefore.start
        );

        const drawingShape = stateBefore.kind === 'draw-shape';
        const defaults = geneoNodeDefaults(drawingShape ? 'shape' : 'panel');

        if (drawingShape && !stateBefore.moved)
        {
            const shape = createGeneographShapeFromRect(
                { x: stateBefore.start.x, y: stateBefore.start.y },
                { useDefaultSize: true }
            );
            if (!shape) return;
            finishGeneographPlacementTool();
            renderGeneographEditorPreserveScroll();
            requestAnimationFrame(() => main.querySelector(`[data-geneo-node="${CSS.escape(shape.id)}"]`)?.focus({ preventScroll: true }));
            return;
        }

        if (
            !stateBefore.moved
          || rect.width < defaults.minWidth
          || rect.height < defaults.minHeight
        )
        {
            if (stateBefore.moved)
            {
                showToast(
                    `${drawingShape ? 'Shape' : 'Panel'} must be at least ${defaults.minWidth} × ${defaults.minHeight}.`
                );
            }

            return;
        }

        const panel = drawingShape
            ? createGeneographShapeFromRect(rect)
            : createGeneographPanelFromRect(rect);

        if (!panel) return;

        finishGeneographPlacementTool();

        renderGeneographEditorPreserveScroll();
        requestAnimationFrame(() =>
        {
            main
                .querySelector(
                    `[data-geneo-node="${CSS.escape(panel.id)}"]`
                )
                ?.focus({ preventScroll: true });
        });

        return;
    }
    if (stateBefore.kind === 'pan')
    {
        if (stateBefore.moved && (stateBefore.fromConnect || stateBefore.suppressItemClick))
        {
            geneoCanvasRuntime.suppressNodeClick = true;
            requestAnimationFrame(() => { geneoCanvasRuntime.suppressNodeClick = false; });
        }
        captureGeneographViewport();
        expandGeneographCanvasNearEdge();
        return;
    }
    if (stateBefore.kind === 'marquee')
    {
        geneoCanvasRuntime.suppressNodeClick = stateBefore.moved;
        requestAnimationFrame(() =>
        {
            geneoCanvasRuntime.suppressNodeClick = false;
        });
        renderGeneographEditorPreserveScroll(); return;
    }
    if (!stateBefore.moved)
    {
        geneoHistoryRuntime.undo.pop(); return;
    }
    geneoCanvasRuntime.suppressNodeClick = true;
    requestAnimationFrame(() =>
    {
        geneoCanvasRuntime.suppressNodeClick = false;
    });
    const node = getGeneographNode(stateBefore.nodeId);
    if (stateBefore.kind === 'resize' && node?.type === 'panel')
    {
        reconcileGeneographPanelMembership(node.id);
    }
    else if (stateBefore.kind === 'move-group')
    {
        const movedNodes = stateBefore.nodes.map(item => getGeneographNode(item.id)).filter(Boolean);
        const movedPanels = movedNodes.filter(item => item.type === 'panel');
        movedPanels.forEach(panel => reconcileGeneographPanelMembership(panel.id));
        if (movedNodes.length === 1 && movedNodes[0].type !== 'panel')
        {
            movedNodes[0].parentPanelId = geneoContainingPanelForNode(movedNodes[0])?.id || null;
        }
    }
    touchGeneographBoard(); renderGeneographEditorPreserveScroll();
}

function commitGeneoInlineEdit(
    cancel = false
)
{
    const node =
        getGeneographNode(
            state.geneoInlineEditNodeId
        );

    if (!node)
    {
        destroyGeneographRichTextEditor();

        state.geneoInlineEditNodeId =
            null;

        state.geneoInlineEditSelectAll =
            false;

        state.geneoInlineEditSurface =
            'canvas';

        return;
    }

    if (
        isGeneographRichTextNode(
            node
        )
    )
    {
        if (!cancel)
        {
            const activeRuntime =
                geneoRichTextRuntime
                    .nodeId === node.id;

            const nextDelta =
                activeRuntime
                    ? cloneRichTextDelta(
                        geneoRichTextRuntime
                            .draftDelta
                    )
                    : cloneRichTextDelta(
                        node.textDelta
                    );

            const nextText =
                activeRuntime
                    ? String(
                        geneoRichTextRuntime
                            .draftText || ''
                    )
                    : String(
                        node.text || ''
                    );

            const changed =
                node.text !== nextText
            || !richTextDeltasEqual(
                node.textDelta,
                nextDelta
            );

            if (changed)
            {
                geneoPushHistory();

                node.text =
                    nextText;

                node.textDelta =
                    nextDelta;

                node.textFormat =
                    nextDelta
                        ? 'quill-delta-v1'
                        : '';

                touchGeneographBoard();
            }
        }

        destroyGeneographRichTextEditor();
    }
    else
    {
        const input =
            main.querySelector(
                '[data-geneo-inline-input]'
            );

        if (
            !cancel
          && input
        )
        {
            const nextTitle =
                String(
                    input.value ?? ''
                )
                    .trim()
                    .slice(0, 160);

            if (
                node.title
            !== nextTitle
            )
            {
                geneoPushHistory();

                node.title =
                    nextTitle;

                touchGeneographBoard();
            }
        }
    }

    state.geneoInlineEditNodeId =
        null;

    state.geneoInlineEditSelectAll =
        false;

    state.geneoInlineEditSurface =
        'canvas';

    renderGeneographEditorPreserveScroll();
}

