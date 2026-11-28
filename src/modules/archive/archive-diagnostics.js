// Opt-in Archive-only adapter. No asset strings or identifiers enter appPerf.
const archiveDiagnosticImages = new Map();
let archiveDiagnosticRoot = null;
let archiveDiagnosticCleanup = null;
const archiveDiagnosticSamples = new Map();

function archiveDiagnosticLayout()
{
    return state.archiveView === 'sources' ? 'sources'
        : state.archiveFileLayout === 'images' ? 'image'
        : state.archiveFileLayout === 'tiles' ? 'icons' : 'details';
}

function archiveDiagnosticContext(trace, path)
{
    if (!trace) return;
    const layout = archiveDiagnosticLayout();
    const presentation = layout === 'sources' ? 'sources' : layout === 'image' ? 'viewer'
        : matchMedia('(max-width: 900px)').matches ? 'mobile' : 'desktop';
    appPerf.archiveContext(trace, layout, presentation, path);
}

function archiveDiagnosticRun(kind, fn, path = 'observe')
{
    if (typeof appPerf === 'undefined' || !appPerf.archiveDetailed()) return fn();
    if (appPerf.currentDetailed('Archive')) return fn();
    return appPerf.run('Archive', kind, () =>
    {
        archiveDiagnosticContext(appPerf.currentDetailed('Archive'), path);
        return fn();
    });
}

function archiveDiagnosticCoalesced(kind, fn)
{
    if (!appPerf.archiveDetailed() || state.activeModule !== 'Archive' || appPerf.currentDetailed('Archive')) return fn();
    const recording = appPerf.status().recording;
    const time = appPerf.now();
    const previous = archiveDiagnosticSamples.get(kind);
    if (previous?.recording === recording && time - previous.time < 120) return fn();
    archiveDiagnosticSamples.set(kind, { recording, time });
    appPerf.archiveOnStop(archiveDiagnosticReset);
    return archiveDiagnosticRun(kind, fn);
}

function archiveDiagnosticMounted(trace, root)
{
    if (!trace || !root) return;
    const count = (key, selector) => appPerf.count(trace, key, root.querySelectorAll(selector).length);
    count('archiveMountedRows', '.archive-table [data-archive-file-row], .archive-table [data-archive-folder-row]');
    count('archiveMountedTiles', '.archive-tile');
    count('archiveMountedMobileItems', '.archive-mobile-item');
    count('archiveMountedStripItems', '[data-av-index]');
    const images = root.querySelectorAll('.archive-tile-art img, [data-av-index] img, [data-av-image]');
    appPerf.count(trace, 'archiveMountedImages', images.length);
    appPerf.count(trace, 'archiveHydratedPreviews', [...images].filter(image => !image.hasAttribute('data-av-image') && image.complete && image.naturalWidth > 0).length);
    count('archiveMountedSources', '[data-archive-source-row]');
    // Mounted elements, not viewport-visible records. No style/layout reads.
}

function archiveDiagnosticFinishImage(image, outcome)
{
    const entry = archiveDiagnosticImages.get(image);
    if (!entry) return;
    archiveDiagnosticImages.delete(image);
    image.removeEventListener('load', entry.load);
    image.removeEventListener('error', entry.error);
    appPerf.archiveTaskFinish(entry.ticket, outcome,
        outcome === 'completed' ? image.naturalWidth : undefined,
        outcome === 'completed' ? image.naturalHeight : undefined);
}

function archiveDiagnosticObserveImage(image, layout, kind, source)
{
    if (!image || !appPerf.archiveDetailed() || archiveDiagnosticImages.has(image)) return;
    if (archiveDiagnosticImages.size >= 2048)
    {
        appPerf.archiveMetric(layout, 'observationSkipped', 1);
        return;
    }
    const ticket = appPerf.archiveTaskBegin(layout, kind, source);
    if (!ticket) return;
    const entry = {
        ticket,
        load: () => archiveDiagnosticFinishImage(image, image.isConnected ? 'completed' : 'canceled'),
        error: () => archiveDiagnosticFinishImage(image, image.isConnected ? 'failed' : 'canceled')
    };
    archiveDiagnosticImages.set(image, entry);
    appPerf.archiveOnStop(archiveDiagnosticReset);
    image.addEventListener('load', entry.load);
    image.addEventListener('error', entry.error);
    // Already-complete cached/broken elements are observations, not a measured decode.
    if (image.complete && image.getAttribute('src'))
        archiveDiagnosticFinishImage(image, image.naturalWidth > 0 ? 'completed' : 'failed');
}

function archiveDiagnosticReset()
{
    archiveDiagnosticCleanup?.();
    archiveDiagnosticCleanup = null;
    archiveDiagnosticRoot = null;
    archiveDiagnosticSamples.clear();
    for (const image of archiveDiagnosticImages.keys()) archiveDiagnosticFinishImage(image, 'canceled');
}

function archiveDiagnosticBindRoot(root, existing = false)
{
    if (!root || !appPerf.archiveDetailed() || archiveDiagnosticRoot === root) return;
    if (archiveDiagnosticRoot) archiveDiagnosticReset();
    archiveDiagnosticRoot = root;
    appPerf.archiveOnStop(archiveDiagnosticReset);
    root.querySelectorAll('.archive-tile-art img').forEach(image =>
    {
        if (!existing || !image.complete) archiveDiagnosticObserveImage(image, 'icons', 'tileLoad', image.dataset.archivePreviewKind || 'unknown');
    });
    if (existing) root.querySelectorAll('[data-av-index] img').forEach(image =>
    {
        if (!image.complete) archiveDiagnosticObserveImage(image, 'image', 'stripLoad', 'unknown');
    });
    const scroller = root.querySelector('.archive-main');
    let handle = null;
    const scroll = () =>
    {
        if (!appPerf.archiveDetailed() || handle !== null) return;
        handle = requestAnimationFrame(() =>
        {
            handle = null;
            if (root.isConnected && archiveDiagnosticRoot === root && appPerf.archiveDetailed())
                archiveDiagnosticCoalesced('scroll', () => {});
        });
    };
    scroller?.addEventListener('scroll', scroll, { passive: true });
    const pageScroll = () => { if (matchMedia('(max-width: 900px)').matches) scroll(); };
    window.addEventListener('scroll', pageScroll, { passive: true });
    archiveDiagnosticCleanup = () =>
    {
        if (handle !== null) cancelAnimationFrame(handle);
        scroller?.removeEventListener('scroll', scroll);
        window.removeEventListener('scroll', pageScroll);
    };
}

function archiveDiagnosticAttachCurrent()
{
    if (appPerf.archiveDetailed() && state.activeModule === 'Archive') archiveDiagnosticBindRoot(main.querySelector('.archive-shell'), true);
}

function archiveDiagnosticMeasure(trace, stage, fn)
{
    return trace ? appPerf.measure(trace, stage, fn) : fn();
}
