// Grid and list previews share Archive's owner. Albums keeps larger alpha-capable derivatives.
const albumsPreviewPixels = 48 * 1024 * 1024;
const albumsPreviewBytes = 24 * 1024 * 1024;
const albumsPreviewMetricNames = {
    thumbnailEntries: 'entries', thumbnailEncodedBytes: 'encodedBytes',
    pendingJobs: 'pendingJobs', runningJobs: 'runningJobs', mountedPreviews: 'mountedPreviews',
    thumbnailCacheHits: 'hits', thumbnailCacheMisses: 'misses', thumbnailCacheEvictions: 'evictions',
    queueWaitMs: 'previewQueueMs', decodeMs: 'decodeMs', previewJobsQueued: 'queued',
    previewJobsCanceled: 'canceled', previewMounted: 'mounted', previewDetached: 'detached'
};
const albumsPreviewRuntime = createMediaPreviewRuntime({
    entries: 256, mounted: 120, bytes: 16 * 1024 * 1024, margin: '220px',
    pending: 160, warmPerFrame: 6, sourcePixels: albumsPreviewPixels,
    alpha: true, format: 'image/webp', quality: .82,
    scope()
    {
        const project = state.activeModule === 'Albums' ? validProjectById(currentProjectId()) : null;
        return project ? { project, location: null, revision: prototypeSessionEditRevision } : null;
    },
    records: project => new Map(getProjectPhotos(project.id).map(photo => [photo.id, photo])),
    current({ file }, project, location, revision)
    {
        return state.activeModule === 'Albums' && currentProjectId() === file.projectId
            && project === validProjectById(file.projectId)
            && (revision === prototypeSessionEditRevision || getPhoto(file.id, { projectId: project.id }) === file);
    },
    source: photo => !photo?.deleted && typeof photo?.src === 'string' ? mediaPreviewLocalSource(photo.src.trim()) : '',
    tier(layout)
    {
        const scale = Math.min(2, Math.max(1, Math.ceil(window.devicePixelRatio || 1)));
        return (layout === 'list' ? 128 : layout === 'detail' ? 512 : 384) * scale;
    },
    withinBudget({ file, source })
    {
        return !(Number(file.width) * Number(file.height) > albumsPreviewPixels)
            && !(Number(file.sizeBytes) > albumsPreviewBytes)
            && mediaPreviewInlineWithinBudget(source, albumsPreviewBytes);
    },
    focused: element => element.closest('[data-photo-id]')?.contains(document.activeElement),
    layout: () => state.albumsViewMode,
    now: () => performance.now(),
    metric(layout, key, value, observation)
    {
        const field = albumsPreviewMetricNames[key];
        if (field) appPerf.albumsMediaMetric(observation === undefined ? appPerf.albumsMediaEpoch() : observation?.epoch, field, value);
        if (key === 'resizeMs' && observation) observation.resize = value;
        if (key === 'encodeMs' && observation)
            appPerf.albumsMediaMetric(observation.epoch, 'previewGenerationMs', (observation.resize || 0) + value);
    },
    begin()
    {
        const epoch = appPerf.albumsMediaEpoch();
        return epoch === null ? null : { epoch };
    },
    valid: observation => Boolean(observation && observation.epoch === appPerf.albumsMediaEpoch()),
    finish(observation, outcome)
    {
        if (outcome === 'completed' || outcome === 'failed') appPerf.albumsMediaMetric(observation?.epoch, outcome, 1);
    },
    prepareImage({ element }, image)
    {
        image.className = 'thumb-img';
        image.draggable = false;
        element.dataset.photoState = 'loading';
        image.addEventListener('load', () =>
        {
            if (image.parentNode !== element) return;
            element.dataset.photoState = 'loaded';
            element.classList.add('has-image');
            element.querySelector('.photo-thumbnail-fallback').hidden = true;
        }, { once: true });
    },
    afterSource: (target, image) => appPerf.observeAlbumImage(image, 'derived'),
    finishImage: image => appPerf.cancelAlbumImage(image),
    resetImage(element)
    {
        element.dataset.photoState = 'missing';
        element.classList.remove('has-image');
        element.querySelector('.photo-thumbnail-fallback').hidden = false;
    }
});

function renderAlbumsPreviewHost(photo, { className = '', layout = 'grid', label = photo.title || photo.filename } = {})
{
    return `<span class="photo-thumbnail ${escapeHtml(className)}" data-photo-thumbnail
        data-albums-preview-host="${escapeHtml(photo.id)}" data-preview-layout="${layout}"
        data-photo-state="missing" role="img" aria-label="${escapeHtml(label || 'Photo')}">
        <span class="photo-thumbnail-fallback">${icon.image}<span>${escapeHtml(t('Image unavailable'))}</span></span>
    </span>`;
}

function mountAlbumsPreviews(root, photosById)
{
    root.querySelectorAll('[data-albums-preview-host]').forEach(host =>
    {
        if (albumsPreviewRuntime.targets.has(host)) return;
        const id = host.dataset.albumsPreviewHost;
        const photo = photosById ? photosById.get(id) : getPhoto(id, { projectId: currentProjectId() });
        if (photo) albumsPreviewRuntime.track(host, photo, host.dataset.previewLayout);
    });
}
