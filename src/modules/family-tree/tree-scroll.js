let treeRenderRuntime = null;

function treeDetailLevel(scale = treeRenderRuntime?.transform.k ?? state.treeZoom / 100)
{
    const width = TREE_CARD_W * scale;
    if (width < TREE_CARD_W * .28) return 'marker';
    if (width < TREE_CARD_W * .64) return 'given';
    if (width < TREE_CARD_W * .88) return 'name';
    return 'full';
}

function requestTreeViewport(runtime)
{
    if (runtime.frame !== null) return;
    runtime.frame = requestAnimationFrame(() =>
    {
        runtime.frame = null;
        if (treeRenderRuntime === runtime) renderTreeViewport(runtime);
    });
}

function flushTreeViewport(runtime)
{
    if (runtime.frame !== null) cancelAnimationFrame(runtime.frame);
    runtime.frame = null;
    renderTreeViewport(runtime);
}

function setTreeViewport(runtime, x, y, k)
{
    if (![x, y, k].every(Number.isFinite) || k <= 0) return;
    d3.select(runtime.canvas).call(runtime.behavior.transform, d3.zoomIdentity.translate(x, y).scale(k));
}

function bindTreeViewport(runtime)
{
    const { canvas } = runtime;
    runtime.transform = d3.zoomIdentity.scale(state.treeZoom / 100);
    runtime.frame = null;
    runtime.behavior = d3.zoom()
        .extent(() => [[0, 0], [canvas.clientWidth, canvas.clientHeight]])
        .scaleExtent([.03, 1.8])
        .touchable(() => true)
        .clickDistance(5)
        .filter(event => !!runtime.scene && !event.button
            && !event.target.closest('button, a, input, select, textarea, [contenteditable="true"]')
            && (!event.ctrlKey || event.type === 'wheel'))
        .on('start.tree', event =>
        {
            if (event.sourceEvent) closeMenu();
            if (event.sourceEvent?.type === 'mousedown') runtime.dragWindow = event.sourceEvent.view;
            if (event.sourceEvent && event.sourceEvent.type !== 'wheel') canvas.classList.add('is-panning');
        })
        .on('zoom.tree', event =>
        {
            if (runtime !== treeRenderRuntime) return;
            runtime.transform = event.transform;
            state.treeZoom = 100 * event.transform.k;
            requestTreeViewport(runtime);
        })
        .on('end.tree', () =>
        {
            runtime.dragWindow = null;
            canvas.classList.remove('is-panning');
        });
    d3.select(canvas).call(runtime.behavior).on('dblclick.zoom', null);
    setTreeViewport(runtime, 0, 0, runtime.transform.k);
    let width = canvas.clientWidth, height = canvas.clientHeight;
    runtime.resize = new ResizeObserver(() =>
    {
        const size = [canvas.clientWidth, canvas.clientHeight];
        if (width === size[0] && height === size[1]) return;
        const { x, y, k } = runtime.transform;
        setTreeViewport(runtime, x + (size[0] - width) / 2, y + (size[1] - height) / 2, k);
        if (runtime.scene) updateTreeViewportLimits(runtime);
        [width, height] = size;
    });
    runtime.resize.observe(canvas);
}

function disposeTreeRenderer()
{
    const runtime = treeRenderRuntime;
    if (!runtime) return;
    treeRenderRuntime = null;
    clearTreePortraits(runtime);
    runtime.portraitCache?.dispose();
    runtime.resize.disconnect();
    if (runtime.frame !== null) cancelAnimationFrame(runtime.frame);
    runtime.controller.abort();
    d3.select(runtime.canvas).on('.zoom', null).interrupt();
    runtime.behavior.on('.tree', null);
    if (runtime.dragWindow)
    {
        d3.select(runtime.dragWindow).on('mousemove.zoom mouseup.zoom', null);
        d3.dragEnable(runtime.dragWindow, true);
    }
    runtime.shell.remove();
}

function updateTreeViewportLimits(runtime)
{
    const fit = treeSceneFit(runtime.scene.bounds, runtime.canvas.clientWidth, runtime.canvas.clientHeight);
    runtime.behavior.scaleExtent([Math.min(.03, fit.k, runtime.transform.k), 1.8]);
    return fit;
}

function fitTreeViewport()
{
    const runtime = treeRenderRuntime;
    if (!runtime?.scene) return;
    const { x, y, k } = updateTreeViewportLimits(runtime);
    setTreeViewport(runtime, x, y, k);
}

function zoomTreeViewport(factor)
{
    const runtime = treeRenderRuntime;
    if (!runtime?.scene) return;
    d3.select(runtime.canvas).call(runtime.behavior.scaleBy, factor);
}

function treePrimaryPersonCard(personId)
{
    return treeRenderRuntime?.cards.querySelector('[data-tree-primary="true"][data-person-id="' + CSS.escape(personId) + '"]');
}

function centerTreeOnOccurrence(entry, immediate = true)
{
    const runtime = treeRenderRuntime;
    if (!runtime || !entry) return;
    const { left, right, top, bottom } = entry.bounds;
    const k = runtime.transform.k;
    setTreeViewport(runtime, (runtime.canvas.clientWidth - (left + right) * k) / 2,
        (runtime.canvas.clientHeight - (top + bottom) * k) / 2, k);
    if (immediate) flushTreeViewport(runtime);
}

function centerTreeOnPerson(personId = treeProjectViewState().focusPersonId)
{
    centerTreeOnOccurrence(treeRenderRuntime?.scene?.primaryByPerson.get(personId));
}

function getTreeCanvasScroll()
{
    const runtime = treeRenderRuntime;
    if (!runtime?.scene) return null;
    const { x, y, k } = runtime.transform;
    return { left: -x, top: -y, scale: k };
}

function captureTreeCanvasScroll(projectId = currentFamilyTreeProjectId())
{
    if (!projectId || treeRenderRuntime?.projectId !== projectId) return null;
    const bookmark = getTreeCanvasScroll();
    if (bookmark) treeProjectViewState(projectId).canvasScroll = bookmark;
    return bookmark;
}

function restoreTreeCanvasScroll(bookmark)
{
    const runtime = treeRenderRuntime;
    if (!runtime || !bookmark) return;
    setTreeViewport(runtime, -bookmark.left, -bookmark.top, bookmark.scale || state.treeZoom / 100);
}
