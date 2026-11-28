// Archive preview URLs are owned here. Full-resolution viewer URLs remain owned by the document.
const archiveThumbnailCache = new Map();
const archiveThumbnailQueue = new Map();
const archiveThumbnailTargets = new Map();
const archiveThumbnailMounted = new Map();
const archiveThumbnailLeases = new Map();
let archiveThumbnailObserver = null;
let archiveThumbnailViewportObserver = null;
let archiveThumbnailJob = null;
let archiveThumbnailFrame = 0;
let archiveThumbnailProject = null;
let archiveThumbnailLocation = null;
let archiveThumbnailRevision = -1;
let archiveThumbnailBytes = 0;
const ARCHIVE_THUMBNAIL_ENTRIES = 256;
const ARCHIVE_THUMBNAIL_MOUNTED = 100;
const ARCHIVE_THUMBNAIL_BYTES = 4 * 1024 * 1024;
const ARCHIVE_THUMBNAIL_SOURCE_PIXELS = 48 * 1024 * 1024;
const ARCHIVE_THUMBNAIL_SOURCE_BYTES = 24 * 1024 * 1024;

function archiveThumbnailCancel(target)
{
    if (archiveThumbnailJob?.target !== target) return;
    archiveThumbnailJob.canceled = true;
    archiveThumbnailJob.cancel?.();
}

function archiveThumbnailLocalSource(source)
{
    try
    {
        if (!source) return '';
        if (/^(blob:|data:image\/)/i.test(source)) return source;
        const url = new URL(source, document.baseURI);
        return (url.protocol === 'file:' && location.protocol === 'file:'
            && url.href.startsWith(new URL('.', document.baseURI).href))
            || (/^https?:$/.test(url.protocol) && url.origin === location.origin) ? url.href : '';
    }
    catch (_) { return ''; }
}

function archiveThumbnailSource(file)
{
    if (!file || file.deleted) return '';
    // A distinct authored derivative has its own budget, not the original's metadata.
    return archiveThumbnailLocalSource(file.thumbnailUrl || archiveImageSource(file));
}

function archiveThumbnailUsesOriginal(file, source)
{
    return !file.thumbnailUrl || [file.assetUrl, file.previewUrl, file.src]
        .some(value => value && source === archiveThumbnailLocalSource(value));
}

function archiveThumbnailSourceWithinBudget(file, source)
{
    if (archiveThumbnailUsesOriginal(file, source))
    {
        const knownPixels = Number(file.width) * Number(file.height);
        if (knownPixels > ARCHIVE_THUMBNAIL_SOURCE_PIXELS || Number(file.sizeBytes) > ARCHIVE_THUMBNAIL_SOURCE_BYTES)
            return false;
    }
    // Inline data has an observable length without decoding or fetching the image.
    if (/^data:image\//i.test(source))
    {
        const comma = source.indexOf(',');
        if (comma < 0) return false;
        const payload = source.length - comma - 1;
        const bytes = /;base64$/i.test(source.slice(0, comma)) ? Math.floor(payload * 3 / 4) : payload;
        if (bytes > ARCHIVE_THUMBNAIL_SOURCE_BYTES) return false;
    }
    return true;
}

function archiveThumbnailMetrics(layout)
{
    appPerf.archiveMetric(layout, 'thumbnailEntries', archiveThumbnailCache.size);
    appPerf.archiveMetric(layout, 'thumbnailEncodedBytes', archiveThumbnailBytes);
    appPerf.archiveMetric(layout, 'pendingJobs', archiveThumbnailQueue.size);
    appPerf.archiveMetric(layout, 'runningJobs', Number(Boolean(archiveThumbnailJob)));
    appPerf.archiveMetric(layout, 'mountedPreviews', archiveThumbnailMounted.size);
}

function archiveThumbnailDetach(element, outcome = 'canceled')
{
    const mounted = archiveThumbnailMounted.get(element);
    if (!mounted) return false;
    archiveThumbnailMounted.delete(element);
    const leases = archiveThumbnailLeases.get(mounted.key);
    leases?.delete(element);
    if (!leases?.size) archiveThumbnailLeases.delete(mounted.key);
    archiveDiagnosticFinishImage(mounted.image, outcome);
    mounted.image.removeAttribute('src');
    if (mounted.placeholder && mounted.image.parentNode === element)
        mounted.image.replaceWith(mounted.placeholder);
    else mounted.image.remove();
    return true;
}

function archiveThumbnailRelease(key, layout)
{
    const entry = archiveThumbnailCache.get(key);
    if (!entry) return;
    // Explicit invalidation can retire a leased entry; detach all its users first.
    for (const element of archiveThumbnailLeases.get(key) || []) archiveThumbnailDetach(element);
    archiveThumbnailCache.delete(key);
    if (entry.url) URL.revokeObjectURL(entry.url);
    archiveThumbnailBytes -= entry.bytes;
    appPerf.archiveMetric(layout, 'thumbnailCacheEvictions', 1);
}

function archiveThumbnailLocationKey()
{
    return JSON.stringify([state.archiveView || 'files', state.archiveSelectedFolderId || null]);
}

function archiveThumbnailTouch(target)
{
    const cached = archiveThumbnailCache.get(target.key);
    if (cached)
    {
        archiveThumbnailCache.delete(target.key);
        archiveThumbnailCache.set(target.key, cached);
    }
    const mounted = archiveThumbnailMounted.get(target.element);
    if (mounted)
    {
        archiveThumbnailMounted.delete(target.element);
        archiveThumbnailMounted.set(target.element, mounted);
    }
}

function archiveThumbnailOffscreen(element)
{
    const target = archiveThumbnailTargets.get(element);
    return !target || !element.isConnected || !target.visible;
}

function archiveThumbnailCanMount()
{
    return archiveThumbnailMounted.size < ARCHIVE_THUMBNAIL_MOUNTED
        || [...archiveThumbnailMounted.keys()].some(archiveThumbnailOffscreen);
}

function archiveThumbnailMakeMountRoom()
{
    if (archiveThumbnailMounted.size < ARCHIVE_THUMBNAIL_MOUNTED) return true;
    const victim = [...archiveThumbnailMounted.keys()].find(archiveThumbnailOffscreen);
    return victim !== undefined && archiveThumbnailDetach(victim);
}

function archiveThumbnailMakeRoom(bytes, layout)
{
    if (bytes > ARCHIVE_THUMBNAIL_BYTES) return false;
    while (archiveThumbnailCache.size >= ARCHIVE_THUMBNAIL_ENTRIES
        || archiveThumbnailBytes + bytes > ARCHIVE_THUMBNAIL_BYTES)
    {
        // LRU across cached and buffered elements. Near-viewport leases stay protected.
        const key = [...archiveThumbnailCache.keys()].find(key =>
            [...(archiveThumbnailLeases.get(key) || [])].every(archiveThumbnailOffscreen));
        if (key === undefined) return false;
        archiveThumbnailRelease(key, layout);
    }
    return true;
}

// Warm derivatives never wait behind an original-image load/decode/encode.
function archiveThumbnailRestoreCached(target)
{
    const cached = archiveThumbnailCache.get(target.key);
    if (!cached) return false;
    archiveThumbnailTouch(target);
    target.blocked = false;
    archiveThumbnailShow(target, cached.url);
    if (!target.blocked)
    {
        appPerf.archiveMetric(target.layout, 'thumbnailCacheHits', 1);
        archiveThumbnailMetrics(target.layout);
    }
    return true;
}

function archiveThumbnailEnqueue(target)
{
    if (!archiveThumbnailTargetCurrent(target)) return;
    if (archiveThumbnailMounted.has(target.element))
    {
        archiveThumbnailTouch(target);
        return;
    }
    if (archiveThumbnailRestoreCached(target))
    {
        archiveThumbnailQueue.delete(target.element);
        return;
    }
    if (archiveThumbnailQueue.has(target.element) || archiveThumbnailJob?.target === target) return;
    target.blocked = false;
    target.queuedAt = appPerf.now();
    archiveThumbnailQueue.set(target.element, target);
    appPerf.archiveMetric(target.layout, 'previewJobsQueued', 1);
}

function archiveThumbnailWakeBlocked()
{
    const waiting = [...archiveThumbnailTargets.values()].filter(target => target.blocked && target.visible);
    waiting.sort((a, b) => Number(b.inViewport) - Number(a.inViewport));
    for (const target of waiting) archiveThumbnailEnqueue(target);
}

function archiveThumbnailDequeue(target)
{
    if (archiveThumbnailQueue.delete(target.element)) appPerf.archiveMetric(target.layout, 'previewJobsCanceled', 1);
    target.blocked = false;
}

function archiveThumbnailForget(element)
{
    const target = archiveThumbnailTargets.get(element);
    if (!target) return;
    archiveThumbnailObserver?.unobserve(element);
    archiveThumbnailViewportObserver?.unobserve(element);
    archiveThumbnailTargets.delete(element);
    archiveThumbnailDequeue(target);
    archiveThumbnailCancel(target);
    if (archiveThumbnailDetach(element)) archiveThumbnailWakeBlocked();
    archiveThumbnailMetrics(target.layout);
    archiveThumbnailSchedule();
}

function archiveThumbnailUnmount()
{
    // Clear targets before detaching: no obsolete target can be woken during teardown.
    const targets = [...archiveThumbnailTargets.values()];
    archiveThumbnailTargets.clear();
    for (const target of targets)
    {
        archiveThumbnailDequeue(target);
        archiveThumbnailCancel(target);
        archiveThumbnailDetach(target.element);
    }
    archiveThumbnailObserver?.disconnect();
    archiveThumbnailViewportObserver?.disconnect();
    archiveThumbnailObserver = archiveThumbnailViewportObserver = null;
    if (archiveThumbnailFrame) cancelAnimationFrame(archiveThumbnailFrame);
    archiveThumbnailFrame = 0;
    if (targets.length) archiveThumbnailMetrics(targets[0].layout);
}

function archiveThumbnailLifecycle()
{
    const project = state.activeModule === 'Archive' ? validProjectById(currentProjectId()) : null;
    const location = project ? archiveThumbnailLocationKey() : null;
    if (archiveThumbnailProject !== project || archiveThumbnailLocation !== location)
    {
        archiveThumbnailUnmount();
        for (const key of archiveThumbnailCache.keys()) archiveThumbnailRelease(key, archiveDiagnosticLayout());
        archiveThumbnailProject = project;
        archiveThumbnailLocation = location;
        archiveThumbnailRevision = -1;
        archiveThumbnailMetrics(archiveDiagnosticLayout());
    }
    if (project && archiveThumbnailRevision !== prototypeSessionEditRevision)
    {
        archiveThumbnailRevision = prototypeSessionEditRevision;
        const files = new Map((sampleData.archiveFiles || []).filter(file => file.projectId === project.id)
            .map(file => [file.id, file]));
        for (const target of [...archiveThumbnailTargets.values()])
        {
            const file = files.get(target.file.id);
            if (file !== target.file || archiveThumbnailSource(file) !== target.source || file.sizeBytes !== target.sizeBytes)
            {
                archiveThumbnailForget(target.element);
                if (file && target.element.isConnected) archiveThumbnailTrack(target.element, file, target.layout);
            }
        }
        for (const [key, entry] of archiveThumbnailCache)
        {
            const file = files.get(entry.file.id);
            if (file !== entry.file || archiveThumbnailSource(file) !== entry.source || file.sizeBytes !== entry.sizeBytes)
                archiveThumbnailRelease(key, archiveDiagnosticLayout());
        }
        archiveThumbnailMetrics(archiveDiagnosticLayout());
    }
}

function archiveThumbnailTrack(element, file, layout)
{
    const source = archiveThumbnailSource(file);
    if (!source || !element || typeof IntersectionObserver !== 'function') return;
    if (archiveThumbnailTargets.has(element)) archiveThumbnailForget(element);
    const tier = Math.min(288, 96 * Math.ceil(window.devicePixelRatio || 1));
    const key = JSON.stringify([file.projectId, file.id, source, file.sizeBytes, tier]);
    archiveThumbnailTargets.set(element, { element, file, layout, source, tier, key,
        sizeBytes: file.sizeBytes, visible: false, inViewport: false, blocked: false });
    if (!archiveThumbnailObserver)
    {
        const observer = new IntersectionObserver(entries =>
        {
            if (archiveThumbnailObserver !== observer) return;
            const entering = [], layouts = new Set();
            let capacityChanged = false;
            // Apply the entire observation batch first: don't evict an element
            // that is about to become visible later in this same callback.
            for (const entry of entries)
            {
                const target = archiveThumbnailTargets.get(entry.target);
                if (!target) continue;
                layouts.add(target.layout);
                target.visible = entry.isIntersecting;
                if (entry.isIntersecting) entering.push(target);
                else
                {
                    target.inViewport = false;
                    archiveThumbnailDequeue(target);
                    archiveThumbnailCancel(target);
                    // Keep the mounted derivative as a warm offscreen buffer.
                    capacityChanged = true;
                }
            }
            entering.sort((a, b) => Number(b.inViewport) - Number(a.inViewport));
            for (const target of entering) archiveThumbnailEnqueue(target);
            if (capacityChanged) archiveThumbnailWakeBlocked();
            for (const layout of layouts) archiveThumbnailMetrics(layout);
            archiveThumbnailSchedule();
        }, { rootMargin: '120px' });
        archiveThumbnailObserver = observer;
        // Strict viewport observations prioritize visible misses over the
        // near-viewport prefetch queue, without synchronous layout reads.
        const viewportObserver = new IntersectionObserver(entries =>
        {
            if (archiveThumbnailViewportObserver !== viewportObserver) return;
            for (const entry of entries)
            {
                const target = archiveThumbnailTargets.get(entry.target);
                if (target) target.inViewport = entry.isIntersecting;
            }
            archiveThumbnailSchedule();
        });
        archiveThumbnailViewportObserver = viewportObserver;
    }
    archiveThumbnailObserver.observe(element);
    archiveThumbnailViewportObserver.observe(element);
}

function archiveThumbnailTargetCurrent(target)
{
    return target.visible && target.element.isConnected && archiveThumbnailTargets.get(target.element) === target
        && state.activeModule === 'Archive' && currentProjectId() === target.file.projectId
        && archiveThumbnailProject === validProjectById(target.file.projectId)
        && archiveThumbnailLocation === archiveThumbnailLocationKey()
        && (prototypeSessionEditRevision === archiveThumbnailRevision || (sampleData.archiveFiles || []).includes(target.file))
        && !target.file.deleted && target.file.sizeBytes === target.sizeBytes
        && archiveThumbnailSource(target.file) === target.source;
}

function archiveThumbnailShow(target, url, observe = true)
{
    if (!url || !archiveThumbnailTargetCurrent(target) || archiveThumbnailMounted.has(target.element)) return;
    if (!archiveThumbnailMakeMountRoom())
    {
        target.blocked = true;
        return;
    }
    const image = document.createElement('img');
    image.alt = '';
    image.decoding = 'async';
    const placeholder = target.layout === 'image' ? target.element.querySelector('svg') : null;
    if (placeholder) placeholder.replaceWith(image);
    else target.element.prepend(image);
    archiveThumbnailMounted.set(target.element, { key: target.key, image, placeholder });
    if (!archiveThumbnailLeases.has(target.key)) archiveThumbnailLeases.set(target.key, new Set());
    archiveThumbnailLeases.get(target.key).add(target.element);
    if (observe)
        archiveDiagnosticObserveImage(image, target.layout, target.layout === 'icons' ? 'tileLoad' : 'stripLoad', 'derived');
    image.addEventListener('error', () =>
    {
        if (archiveThumbnailMounted.get(target.element)?.image !== image) return;
        archiveThumbnailDetach(target.element, 'failed');
        archiveThumbnailRelease(target.key, target.layout);
        // A broken derived URL stays a fallback until its source changes.
        if (archiveThumbnailMakeRoom(0, target.layout))
            archiveThumbnailCache.set(target.key, { file: target.file, source: target.source,
                sizeBytes: target.sizeBytes, url: '', bytes: 0 });
        archiveThumbnailWakeBlocked();
        archiveThumbnailMetrics(target.layout);
        archiveThumbnailSchedule();
    }, { once: true });
    image.src = url;
}

function archiveThumbnailSchedule()
{
    if (archiveThumbnailJob || archiveThumbnailFrame || !archiveThumbnailQueue.size
        || !archiveThumbnailCanMount()) return;
    archiveThumbnailFrame = requestAnimationFrame(() =>
    {
        archiveThumbnailFrame = 0;
        archiveThumbnailRun();
    });
}

async function archiveThumbnailRun()
{
    if (archiveThumbnailJob || !archiveThumbnailCanMount()) return;
    const target = [...archiveThumbnailQueue.values()].find(candidate => candidate.inViewport)
        || archiveThumbnailQueue.values().next().value;
    if (!target) return;
    archiveThumbnailQueue.delete(target.element);
    if (!archiveThumbnailTargetCurrent(target)) { archiveThumbnailSchedule(); return; }
    const { key, layout, file, source, tier } = target;
    if (archiveThumbnailRestoreCached(target))
    {
        archiveThumbnailSchedule();
        return;
    }

    const job = archiveThumbnailJob = { target, cancel: null };
    const observation = appPerf.archiveTaskBegin(layout, 'thumbnail', 'derived');
    appPerf.archiveMetric(layout, 'thumbnailCacheMisses', 1);
    appPerf.archiveMetric(layout, 'queueWaitMs', appPerf.now() - target.queuedAt);
    archiveThumbnailMetrics(layout);
    let image;
    let ownsImage = false;
    let width = 0;
    let height = 0;
    let outcome = 'failed';
    try
    {
        if (!archiveThumbnailSourceWithinBudget(file, source))
            throw new Error('Archive thumbnail source exceeds budget');
        const viewer = archiveImageView.cache.get(`${file.id}:${archiveImageSource(file)}`);
        const originalSource = archiveThumbnailLocalSource(archiveImageSource(file));
        if (source === originalSource && viewer)
        {
            image = await viewer.promise;
        }
        else
        {
            image = new Image();
            ownsImage = true;
            image.decoding = 'async';
            await new Promise((resolve, reject) =>
            {
                image.onload = resolve;
                image.onerror = reject;
                job.cancel = () => { image.src = ''; reject(new Error('Thumbnail no longer needed')); };
                image.src = source;
            });
        }
        if (job.canceled || !archiveThumbnailTargetCurrent(target)) return;
        const pixels = image.naturalWidth * image.naturalHeight;
        if (!pixels || pixels > ARCHIVE_THUMBNAIL_SOURCE_PIXELS) throw new Error('Archive thumbnail source exceeds budget');
        if (ownsImage) job.cancel = () => { image.src = ''; };
        await image.decode();
        job.cancel = null;
        if (job.canceled || !archiveThumbnailTargetCurrent(target)) return;
        const ratio = Math.min(1, tier / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement('canvas');
        canvas.width = width = Math.max(1, Math.round(image.naturalWidth * ratio));
        canvas.height = height = Math.max(1, Math.round(image.naturalHeight * ratio));
        const drawStart = appPerf.now();
        canvas.getContext('2d', { alpha: false }).drawImage(image, 0, 0, width, height);
        if (appPerf.archiveTaskValid(observation)) appPerf.archiveMetric(layout, 'resizeMs', appPerf.now() - drawStart);
        if (ownsImage)
        {
            image.src = '';
            ownsImage = false;
        }
        const encodeStart = appPerf.now();
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', .72));
        if (appPerf.archiveTaskValid(observation)) appPerf.archiveMetric(layout, 'encodeMs', appPerf.now() - encodeStart);
        if (!blob) throw new Error('Archive thumbnail encode failed');
        if (job.canceled || !archiveThumbnailTargetCurrent(target)) return;
        if (!archiveThumbnailMakeRoom(blob.size, appPerf.archiveTaskValid(observation) ? layout : null))
        {
            target.blocked = blob.size <= ARCHIVE_THUMBNAIL_BYTES;
            return;
        }
        archiveThumbnailCache.set(key, { file, source, sizeBytes: file.sizeBytes,
            url: URL.createObjectURL(blob), bytes: blob.size });
        archiveThumbnailBytes += blob.size;
        outcome = 'completed';
        archiveThumbnailShow(target, archiveThumbnailCache.get(key).url, appPerf.archiveTaskValid(observation));
    }
    catch (_)
    {
        const metricLayout = appPerf.archiveTaskValid(observation) ? layout : null;
        if (outcome === 'completed') archiveThumbnailRelease(key, metricLayout);
        outcome = 'failed';
        if (!job.canceled && archiveThumbnailTargetCurrent(target) && archiveThumbnailMakeRoom(0, metricLayout))
            archiveThumbnailCache.set(key, { file, source, sizeBytes: file.sizeBytes, url: '', bytes: 0 });
    }
    finally
    {
        if (ownsImage) image.src = '';
        if (job.canceled || !archiveThumbnailTargetCurrent(target)) outcome = 'canceled';
        const observing = appPerf.archiveTaskValid(observation);
        if (observing && outcome === 'canceled') appPerf.archiveMetric(layout, 'previewJobsCanceled', 1);
        appPerf.archiveTaskFinish(observation, outcome, width, height);
        archiveThumbnailJob = null;
        // A target may leave and re-enter while its canceled encode settles.
        if (job.canceled && archiveThumbnailTargetCurrent(target)) archiveThumbnailEnqueue(target);
        if (observing) archiveThumbnailMetrics(layout);
        archiveThumbnailSchedule();
    }
}

function mountArchiveTileThumbnails(root)
{
    const previews = root.querySelectorAll('[data-archive-tile-preview]');
    if (!previews.length) return;
    const projectId = currentProjectId();
    const files = new Map((sampleData.archiveFiles || []).filter(file => file.projectId === projectId)
        .map(file => [file.id, file]));
    previews.forEach(art =>
    {
        const file = files.get(art.closest('[data-archive-file-row]').dataset.archiveFileRow);
        if (file) archiveThumbnailTrack(art, file, 'icons');
    });
}
