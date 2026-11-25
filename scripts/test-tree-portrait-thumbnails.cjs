// Browser fixture. Run runPortraitThumbnailChecks() on the local app page.
async function runPortraitThumbnailChecks()
{
    const pause = (ms = 20) => new Promise(resolve => setTimeout(resolve, ms));
    const until = async predicate =>
    {
        for (let i = 0; i < 200; i++)
        {
            if (predicate()) return;
            await pause();
        }
        throw new Error('Portrait check timed out');
    };
    const check = (value, message) => { if (!value) throw new Error(message); };
    const fixture = (width, height) =>
    {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        for (const [x, y, color] of [[0, 0, 'red'], [1, 0, 'lime'], [0, 1, 'blue']])
        {
            ctx.fillStyle = color;
            ctx.fillRect(x * width / 2, y * height / 2, width / 2, height / 2);
        }
        return canvas.toDataURL();
    };
    const pixels = (image, x, y) =>
    {
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0);
        return [...ctx.getImageData(Math.round(x * canvas.width), Math.round(y * canvas.height), 1, 1).data];
    };
    const make = async request =>
    {
        const { blob } = await generatePortraitThumbnail(request);
        const url = URL.createObjectURL(blob);
        const image = new Image();
        image.src = url;
        await image.decode();
        URL.revokeObjectURL(url);
        return image;
    };
    const source = fixture(2400, 1800);
    const crop = normalizePersonPhotoCrop(null);
    const request = { source, crop, aspect: 1, tier: 128 };
    for (const [rotation, channel] of [[0, 0], [90, 2], [180, 3], [270, 1]])
    {
        const image = await make({ ...request, crop: { ...crop, rotation } });
        const pixel = pixels(image, .2, .2);
        check(channel === 3 ? pixel[3] === 0 : pixel[channel] > 225, 'Unexpected crop rotation ' + rotation);
    }
    const rect = await make({ ...request, region: { x: .55, y: .05, width: .35, height: .35 }, aspect: .75 });
    check(rect.naturalWidth === 96 && rect.naturalHeight === 128 && pixels(rect, .5, .5)[1] > 225, '3:4 tagged region');
    const tiny = await make({ ...request, source: fixture(12, 20), aspect: .75 });
    check(tiny.naturalWidth <= 12 && tiny.naturalHeight <= 20, 'Tiny source was upscaled');
    const offCenter = await make({ ...request, crop: { ...crop, centerX: .75, zoom: 1.5 } });
    check(pixels(offCenter, .4, .2)[1] > 225, 'Off-center crop');

    const cache = createPortraitThumbnailCache();
    const results = [];
    const releaseA = cache.subscribe('same', request, url => results.push(url));
    const releaseB = cache.subscribe('same', request, url => results.push(url));
    await until(() => results.length === 2);
    check(cache.stats.jobs === 1 && results[0] === results[1], 'In-flight deduplication');
    releaseA();
    releaseB();
    cache.subscribe('same', request, url => results.push(url))();
    check(cache.stats.jobs === 1 && results[0] === results[2], 'Warm reuse');
    const broken = cache.subscribe('bad', { ...request, source: 'data:image/png;base64,bad' }, () => { throw new Error('Corrupt image decoded'); });
    await until(() => cache.stats.failures === 1);
    broken();
    cache.subscribe('bad', request, () => { throw new Error('Corrupt revision retried'); })();
    check(cache.stats.jobs === 2, 'Failed revision should be cached');
    cache.dispose();
    check(cache.stats.revoked === 1 && !cache.stats.encoded && !cache.stats.decoded, 'Dispose did not release cache');

    let finish;
    const blocked = createPortraitThumbnailCache(() => new Promise(resolve => { finish = resolve; }));
    let delivered = false;
    const cancel = blocked.subscribe('pending', request, () => { delivered = true; });
    await until(() => finish);
    cancel();
    blocked.dispose();
    finish({ blob: new Blob(['sample']), bytes: 4 });
    await until(() => portraitThumbnailJobs === 0);
    check(!delivered && blocked.entries.size === 0, 'Late result survived disposal');

    const budget = createPortraitThumbnailCache(async () => ({ blob: new Blob(['test']), bytes: 512 * 512 * 4 }));
    const leases = [];
    for (let i = 0; i < 240; i++)
    {
        const release = budget.subscribe(String(i), request, () => {});
        if (release) leases.push(release);
    }
    check(leases.length === 200 && portraitThumbnailJobs === 2, 'Queue or concurrency capacity');
    await until(() => portraitThumbnailJobs === 0);
    check(budget.stats.decoded === 48 * 1024 * 1024 && budget.entries.size <= 200
        && budget.stats.encoded <= 24 * 1024 * 1024 && budget.stats.revoked === 0, 'Active lease budget');
    leases.forEach(release => release());
    budget.dispose();
    check(budget.stats.revoked === 48, 'Active URLs were not released');

    activateProject('p1', { moduleName: 'Family Tree' });
    await until(() => treeRenderRuntime?.scene);
    const runtime = treeRenderRuntime;
    const person = getPerson(treeProjectViewState().focusPersonId);
    const photo = getPhoto(person.primaryPhotoId, { projectId: runtime.projectId });
    const canonical = { source: photo.src, regionRecord: photo.personRegions, crop: JSON.stringify(person.primaryPhotoCrop), regions: JSON.stringify(photo.personRegions) };
    await until(() => portraitThumbnailJobs === 0);
    const currentImage = () => runtime.cards.querySelector('[data-person-id="' + person.id + '"] .tree-portrait-image');
    const packaged = Boolean(currentImage()?.naturalWidth);
    photo.src = source;
    renderFamilyTree();
    await until(() => currentImage()?.naturalWidth);
    const scene = runtime.scene, geometry = treeElkRequest.geometry;
    const original = currentImage().src;
    const before = runtime.portraitCache.stats.jobs;
    const { x, y, k } = runtime.transform;
    check(original.startsWith('blob:') && currentImage().naturalWidth < 2400 && photo.src === source, 'Original portrait source leaked');
    check(!runtime.cards.querySelector('[data-face-region-media]'), 'Tree installed a global face-region hook');
    setTreeViewport(runtime, x - 5000, y - 5000, k);
    flushTreeViewport(runtime);
    check(runtime.portraitLeases.size === 0, 'Offscreen portrait lease');
    setTreeViewport(runtime, x, y, k);
    flushTreeViewport(runtime);
    await until(() => currentImage()?.src === original);
    check(runtime.portraitCache.stats.jobs === before && runtime.scene === scene && treeElkRequest.geometry === geometry, 'Warm pan rebuilt or decoded');
    fitTreeViewport();
    await pause(100);
    if (treeDetailLevel(runtime.transform.k) !== 'full') check(runtime.portraitLeases.size === 0, 'Hidden portraits kept leases');
    setTreeViewport(runtime, x, y, k);
    flushTreeViewport(runtime);
    photo.src = fixture(900, 1200);
    renderFamilyTree();
    await until(() => currentImage()?.naturalWidth && currentImage().src !== original);
    check(JSON.stringify(person.primaryPhotoCrop) === canonical.crop && JSON.stringify(photo.personRegions) === canonical.regions, 'Canonical crop mutated');
    const replaced = currentImage().src;
    photo.personRegions = { ...photo.personRegions, [person.id]: { x: .55, y: .05, width: .35, height: .35 } };
    renderFamilyTree();
    await until(() => currentImage()?.naturalWidth && currentImage().src !== replaced);
    const tagged = currentImage().src;
    photo.personRegions = {};
    setPersonPrimaryPhoto(person.id, photo.id, { ...crop, rotation: 90 });
    await until(() => currentImage()?.naturalWidth && currentImage().src !== tagged);
    openPhotoLightbox(photo.id);
    check(document.querySelector('[data-albums-preview-stage] img')?.getAttribute('src') === photo.src,
        'Full photo viewer lost the original source');
    closeModal();
    openPersonPhotoAdjuster(person.id, photo.id);
    check([...document.querySelectorAll('.person-photo-adjust-layout img')].some(image => image.getAttribute('src') === photo.src),
        'Crop editor lost the original source');
    closeModal();
    setPhotoPersonIds(photo.id, photo.personIds.filter(id => id !== person.id));
    check(!currentImage(), 'Primary photo removal kept the derivative');
    check(portraitThumbnailTier(68, 1) === 128 && portraitThumbnailTier(68, 2) === 256
        && portraitThumbnailTier(140, 3) === 512, 'DPR tier selection');
    photo.personRegions = canonical.regionRecord;
    photo.src = canonical.source;
    const mountedCache = runtime.portraitCache;
    activateProject(FAMILY_TREE_STRESS_TEST_PROJECT_ID, { moduleName: 'Family Tree' });
    check(!mountedCache.entries.size && !mountedCache.stats.encoded && !runtime.portraitLeases.size, 'Project switch retained the old cache');
    return { protocol: location.protocol, packaged, cropRotations: 4, deduplication: true, dimensions: [96, 128], boundedUrls: budget.stats.revoked, warmPan: true, sourceRevision: true, projectIsolation: true };
}

if (typeof module !== 'undefined') module.exports = runPortraitThumbnailChecks;
