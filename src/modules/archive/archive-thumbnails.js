// Archive preview URLs are owned here. Full-resolution viewer URLs remain owned by the document.
const archiveThumbnailCache = new Map();
const archiveThumbnailQueue = new Map();
const archiveThumbnailTargets = new Map();
let archiveThumbnailObserver = null;
let archiveThumbnailJob = null;
let archiveThumbnailFrame = 0;
let archiveThumbnailProject = null;
let archiveThumbnailRevision = -1;
let archiveThumbnailBytes = 0;
const ARCHIVE_THUMBNAIL_ENTRIES = 100;
const ARCHIVE_THUMBNAIL_BYTES = 4 * 1024 * 1024;
const ARCHIVE_THUMBNAIL_SOURCE_PIXELS = 48 * 1024 * 1024;
const ARCHIVE_THUMBNAIL_SOURCE_BYTES = 24 * 1024 * 1024;

function archiveThumbnailCancel(target)
{
    if (archiveThumbnailJob?.target !== target) return;
    archiveThumbnailJob.canceled = true;
    archiveThumbnailJob.cancel?.();
}

function archiveThumbnailSource(file)
{
    try
    {
        const source = file.thumbnailUrl || archiveImageSource(file);
        if (!source || file.deleted) return '';
        if (/^(blob:|data:image\/)/i.test(source)) return source;
        const url = new URL(source, document.baseURI);
        return (url.protocol === 'file:' && location.protocol === 'file:'
            && url.href.startsWith(new URL('.', document.baseURI).href))
            || (/^https?:$/.test(url.protocol) && url.origin === location.origin) ? url.href : '';
    }
    catch (_) { return ''; }
}

function archiveThumbnailMetrics(layout)
{
    appPerf.archiveMetric(layout, 'thumbnailEntries', archiveThumbnailCache.size);
    appPerf.archiveMetric(layout, 'thumbnailEncodedBytes', archiveThumbnailBytes);
    appPerf.archiveMetric(layout, 'pendingJobs', archiveThumbnailQueue.size);
    appPerf.archiveMetric(layout, 'runningJobs', Number(Boolean(archiveThumbnailJob)));
}

function archiveThumbnailRelease(key, layout)
{
    const entry = archiveThumbnailCache.get(key);
    if (!entry) return;
    archiveThumbnailCache.delete(key);
    if (entry.url) URL.revokeObjectURL(entry.url);
    archiveThumbnailBytes -= entry.bytes;
    appPerf.archiveMetric(layout, 'thumbnailCacheEvictions', 1);
}

function archiveThumbnailForget(element)
{
    const target = archiveThumbnailTargets.get(element);
    if (!target) return;
    archiveThumbnailObserver?.unobserve(element);
    archiveThumbnailTargets.delete(element);
    archiveThumbnailQueue.delete(element);
    archiveThumbnailCancel(target);
    archiveDiagnosticFinishImage(element.querySelector('img'), 'canceled');
}

function archiveThumbnailUnmount()
{
    for (const element of archiveThumbnailTargets.keys()) archiveThumbnailForget(element);
    archiveThumbnailObserver?.disconnect();
    archiveThumbnailObserver = null;
    if (archiveThumbnailFrame) cancelAnimationFrame(archiveThumbnailFrame);
    archiveThumbnailFrame = 0;
}

function archiveThumbnailLifecycle()
{
    const project = state.activeModule === 'Archive' ? validProjectById(currentProjectId()) : null;
    if (archiveThumbnailProject !== project)
    {
        archiveThumbnailUnmount();
        for (const key of archiveThumbnailCache.keys()) archiveThumbnailRelease(key, archiveDiagnosticLayout());
        archiveThumbnailProject = project;
        archiveThumbnailRevision = -1;
    }
    if (project && archiveThumbnailRevision !== prototypeSessionEditRevision)
    {
        archiveThumbnailRevision = prototypeSessionEditRevision;
        const files = new Map((sampleData.archiveFiles || []).filter(file => file.projectId === project.id)
            .map(file => [file.id, file]));
        for (const [key, entry] of archiveThumbnailCache)
        {
            const file = files.get(entry.file.id);
            if (file !== entry.file || archiveThumbnailSource(file) !== entry.source || file.sizeBytes !== entry.sizeBytes)
                archiveThumbnailRelease(key, archiveDiagnosticLayout());
        }
    }
}

function archiveThumbnailTrack(element, file, layout)
{
    const source = archiveThumbnailSource(file);
    if (!source || !element || typeof IntersectionObserver !== 'function') return;
    const tier = Math.min(288, 96 * Math.ceil(window.devicePixelRatio || 1));
    const key = JSON.stringify([file.projectId, file.id, source, file.sizeBytes, tier]);
    archiveThumbnailTargets.set(element, { element, file, layout, source, tier, key,
        sizeBytes: file.sizeBytes, visible: false });
    if (!archiveThumbnailObserver)
        archiveThumbnailObserver = new IntersectionObserver(entries =>
        {
            for (const entry of entries)
            {
                const target = archiveThumbnailTargets.get(entry.target);
                if (!target) continue;
                target.visible = entry.isIntersecting;
                if (entry.isIntersecting && !entry.target.querySelector('img'))
                {
                    target.queuedAt = appPerf.now();
                    archiveThumbnailQueue.set(entry.target, target);
                    appPerf.archiveMetric(target.layout, 'previewJobsQueued', 1);
                }
                else archiveThumbnailQueue.delete(entry.target);
                if (!entry.isIntersecting) archiveThumbnailCancel(target);
            }
            archiveThumbnailSchedule();
        }, { rootMargin: '120px' });
    archiveThumbnailObserver.observe(element);
}

function archiveThumbnailTargetCurrent(target)
{
    return target.visible && target.element.isConnected && archiveThumbnailTargets.get(target.element) === target
        && state.activeModule === 'Archive' && currentProjectId() === target.file.projectId
        && archiveThumbnailProject === validProjectById(target.file.projectId)
        && !target.file.deleted && target.file.sizeBytes === target.sizeBytes
        && archiveThumbnailSource(target.file) === target.source;
}

function archiveThumbnailShow(target, url, observe = true)
{
    if (!url || !archiveThumbnailTargetCurrent(target)) return;
    const image = document.createElement('img');
    image.alt = '';
    image.decoding = 'async';
    const placeholder = target.layout === 'image' ? target.element.querySelector('svg') : null;
    image.addEventListener('error', () =>
    {
        if (placeholder) image.replaceWith(placeholder);
        else image.remove();
    }, { once: true });
    if (placeholder) placeholder.replaceWith(image);
    else target.element.prepend(image);
    if (observe)
        archiveDiagnosticObserveImage(image, target.layout, target.layout === 'icons' ? 'tileLoad' : 'stripLoad', 'derived');
    image.src = url;
}

function archiveThumbnailSchedule()
{
    if (archiveThumbnailJob || archiveThumbnailFrame || !archiveThumbnailQueue.size) return;
    archiveThumbnailFrame = requestAnimationFrame(() =>
    {
        archiveThumbnailFrame = 0;
        archiveThumbnailRun();
    });
}

async function archiveThumbnailRun()
{
    const target = archiveThumbnailQueue.values().next().value;
    if (!target) return;
    archiveThumbnailQueue.delete(target.element);
    if (!archiveThumbnailTargetCurrent(target)) { archiveThumbnailSchedule(); return; }
    const { key, layout, file, source, tier } = target;
    const cached = archiveThumbnailCache.get(key);
    if (cached)
    {
        archiveThumbnailCache.delete(key);
        archiveThumbnailCache.set(key, cached);
        appPerf.archiveMetric(layout, 'thumbnailCacheHits', 1);
        archiveThumbnailShow(target, cached.url);
        archiveThumbnailMetrics(layout);
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
        const knownPixels = Number(file.width) * Number(file.height);
        if (knownPixels > ARCHIVE_THUMBNAIL_SOURCE_PIXELS || Number(file.sizeBytes) > ARCHIVE_THUMBNAIL_SOURCE_BYTES)
            throw new Error('Archive thumbnail source exceeds budget');
        const viewer = archiveImageView.cache.get(`${file.id}:${archiveImageSource(file)}`);
        const originalSource = new URL(archiveImageSource(file), document.baseURI).href;
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
        archiveThumbnailCache.set(key, { file, source, sizeBytes: file.sizeBytes,
            url: URL.createObjectURL(blob), bytes: blob.size });
        archiveThumbnailBytes += blob.size;
        outcome = 'completed';
        archiveThumbnailShow(target, archiveThumbnailCache.get(key).url, appPerf.archiveTaskValid(observation));
    }
    catch (_)
    {
        if (!job.canceled && archiveThumbnailTargetCurrent(target)) archiveThumbnailCache.set(key,
            { file, source, sizeBytes: file.sizeBytes, url: '', bytes: 0 });
    }
    finally
    {
        if (ownsImage) image.src = '';
        if (job.canceled || !archiveThumbnailTargetCurrent(target)) outcome = 'canceled';
        const observing = appPerf.archiveTaskValid(observation);
        if (observing && outcome === 'canceled') appPerf.archiveMetric(layout, 'previewJobsCanceled', 1);
        while (archiveThumbnailCache.size > ARCHIVE_THUMBNAIL_ENTRIES || archiveThumbnailBytes > ARCHIVE_THUMBNAIL_BYTES)
            archiveThumbnailRelease(archiveThumbnailCache.keys().next().value, observing ? layout : null);
        appPerf.archiveTaskFinish(observation, outcome, width, height);
        archiveThumbnailJob = null;
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
