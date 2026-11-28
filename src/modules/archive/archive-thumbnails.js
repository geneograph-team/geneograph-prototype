// Archive supplies the folder-local policy and keeps ownership of full-resolution viewers.
const archivePreviewSourcePixels = 48 * 1024 * 1024;
const archivePreviewSourceBytes = 24 * 1024 * 1024;

function archiveThumbnailSource(file)
{
    return file && !file.deleted ? mediaPreviewLocalSource(file.thumbnailUrl || archiveImageSource(file)) : '';
}

function archiveThumbnailLocationKey()
{
    return JSON.stringify([state.archiveView || 'files', state.archiveSelectedFolderId || null]);
}

const archivePreviewRuntime = createMediaPreviewRuntime({
    entries: 256, mounted: 100, bytes: 4 * 1024 * 1024, margin: '120px',
    sourcePixels: archivePreviewSourcePixels, alpha: false, format: 'image/jpeg', quality: .72,
    scope()
    {
        const project = state.activeModule === 'Archive' ? validProjectById(currentProjectId()) : null;
        return project ? { project, location: archiveThumbnailLocationKey(), revision: prototypeSessionEditRevision } : null;
    },
    records(project)
    {
        return new Map((sampleData.archiveFiles || []).filter(file => file.projectId === project.id)
            .map(file => [file.id, file]));
    },
    current({ file }, project, location, revision)
    {
        return state.activeModule === 'Archive' && currentProjectId() === file.projectId
            && project === validProjectById(file.projectId) && location === archiveThumbnailLocationKey()
            && (prototypeSessionEditRevision === revision || (sampleData.archiveFiles || []).includes(file));
    },
    source: archiveThumbnailSource,
    tier: () => Math.min(288, 96 * Math.ceil(window.devicePixelRatio || 1)),
    withinBudget({ file, source })
    {
        const original = !file.thumbnailUrl || [file.assetUrl, file.previewUrl, file.src]
            .some(value => value && source === mediaPreviewLocalSource(value));
        if (original && (Number(file.width) * Number(file.height) > archivePreviewSourcePixels
            || Number(file.sizeBytes) > archivePreviewSourceBytes)) return false;
        return mediaPreviewInlineWithinBudget(source, archivePreviewSourceBytes);
    },
    borrowImage({ file, source })
    {
        const original = archiveImageSource(file);
        return source === mediaPreviewLocalSource(original)
            ? archiveImageView.cache.get(`${file.id}:${original}`)?.promise : null;
    },
    placeholder: target => target.layout === 'image' ? target.element.querySelector('svg') : null,
    layout: () => archiveDiagnosticLayout(),
    now: () => appPerf.now(),
    metric(layout, key, value)
    {
        if (!['previewMounted', 'previewDetached', 'decodeMs'].includes(key)) appPerf.archiveMetric(layout, key, value);
    },
    begin: (layout, kind, source) => appPerf.archiveTaskBegin(layout, kind, source),
    valid: observation => appPerf.archiveTaskValid(observation),
    finish: (observation, outcome, width, height) => appPerf.archiveTaskFinish(observation, outcome, width, height),
    observeImage: (target, image) => archiveDiagnosticObserveImage(image, target.layout,
        target.layout === 'icons' ? 'tileLoad' : 'stripLoad', 'derived'),
    finishImage: (image, outcome) => archiveDiagnosticFinishImage(image, outcome)
});

function archiveThumbnailLifecycle() { archivePreviewRuntime.lifecycle(); }
function archiveThumbnailUnmount() { archivePreviewRuntime.unmount(); }
function archiveThumbnailForget(element) { archivePreviewRuntime.forget(element); }
function archiveThumbnailTrack(element, file, layout) { archivePreviewRuntime.track(element, file, layout); }

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
