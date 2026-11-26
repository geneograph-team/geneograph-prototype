// Keep portrait leases tied to the mounted renderer and its current visible cards.
function treePortraitDescriptor(runtime, id)
{
    if (runtime.portraitRevision !== runtime.contentRevision)
    {
        runtime.portraitRevision = runtime.contentRevision;
        runtime.portraitDescriptors = new Map();
        runtime.portraitSources = new Map();
    }
    if (runtime.portraitDescriptors.has(id)) return runtime.portraitDescriptors.get(id);
    const person = getPerson(id);
    const photo = person?.projectId === runtime.projectId
        ? getPhoto(person.primaryPhotoId, { projectId: runtime.projectId }) : null;
    let descriptor = null;
    if (photo?.src)
    {
        let source = runtime.portraitSources.get(photo.id);
        if (source === undefined)
        {
            try { source = portraitThumbnailSource(photo); }
            catch { source = ''; }
            runtime.portraitSources.set(photo.id, source);
        }
        if (source)
        {
            const region = photoPersonRegion(photo, id);
            const crop = region ? null : normalizePersonPhotoCrop(person.primaryPhotoCrop);
            // Use the immutable source string once per photo and scene revision, not on camera frames.
            runtime.portraitSourceTokens ||= new WeakMap();
            const previous = runtime.portraitSourceTokens.get(photo);
            const token = previous?.source === source ? previous.token : (runtime.portraitToken = (runtime.portraitToken || 0) + 1);
            runtime.portraitSourceTokens.set(photo, { source, token });
            descriptor = { key: JSON.stringify([runtime.projectId, photo.id, token, region || crop]),
                request: { source, region, crop, sourcePixels: Number(photo.width) * Number(photo.height) } };
        }
    }
    runtime.portraitDescriptors.set(id, descriptor);
    return descriptor;
}

function updateTreePortraits(runtime, visible, detail, aspect, trace = null)
{
    const leases = runtime.portraitLeases ||= new Map();
    const demand = new Map();
    let canvas;
    const cards = detail === 'full' || detail === 'short' ? runtime.cards.children : [];
    for (const card of cards)
    {
        if (!treeSceneIntersects(visible, card.__data__.bounds)) continue;
        const descriptor = treePortraitDescriptor(runtime, card.dataset.personId);
        if (!descriptor) continue;
        const avatar = card.querySelector('.tree-avatar');
        if (!avatar) continue;

        // Read rendered geometry only for portraits that can acquire a lease.
        canvas ??= runtime.canvas.getBoundingClientRect();
        const rect = avatar.getBoundingClientRect();
        if (!rect.width || !rect.height || rect.right <= canvas.left || rect.left >= canvas.right
            || rect.bottom <= canvas.top || rect.top >= canvas.bottom) continue;
        const tier = portraitThumbnailTier(Math.max(rect.width, rect.height));
        const base = descriptor.key + '|' + aspect;
        demand.set(avatar, { base, key: base + '|' + tier, tier, descriptor });
    }

    for (const [avatar, lease] of leases)
    {
        if (demand.get(avatar)?.base === lease.base) continue;
        releaseTreePortrait(avatar, lease);
        leases.delete(avatar);
    }
    if (!demand.size) return;
    const cache = runtime.portraitCache ||= createPortraitThumbnailCache();
    const before = trace ? { ...cache.stats } : null;
    for (const [avatar, { base, key, tier, descriptor }] of demand)
    {
        let lease = leases.get(avatar);
        if (!lease)
        {
            lease = { base, current: null, pending: null };
            leases.set(avatar, lease);
            const compatible = [...portraitThumbnailLimits.tiers].reverse()
                .map(value => base + '|' + value)
                .find(candidate => cache.hasReady(candidate));
            if (compatible && compatible !== key)
                subscribeTreePortrait(runtime, avatar, lease, compatible, null, true, trace);
        }
        if (lease.pending?.key === key) continue;
        lease.pending?.release?.();
        lease.pending = null;
        if (lease.current?.key !== key)
            subscribeTreePortrait(runtime, avatar, lease, key, { ...descriptor.request, aspect, tier }, false, trace);
    }
    if (before)
        for (const [metric, key] of [['portraitHits', 'hits'], ['portraitMisses', 'misses'], ['portraitJobs', 'jobs']])
            treePerf.count(trace, metric, Math.max(0, cache.stats[key] - before[key]), true);
}

function subscribeTreePortrait(runtime, avatar, lease, key, request, fallback = false, trace = null)
{
    const subscribed = trace && treePerf.now();
    const subscription = { key };
    if (fallback) lease.fallback = subscription;
    else lease.pending = subscription;
    subscription.release = runtime.portraitCache.subscribe(key, request, url =>
    {
        const decodeStarted = trace && treePerf.now();
        if (trace) treePerf.span(trace, 'portraitWait', decodeStarted - subscribed);
        const image = document.createElement('img');
        image.className = 'tree-portrait-image';
        image.alt = '';
        image.decoding = 'async';
        image.draggable = false;
        image.src = url;
        image.decode().then(() =>
        {
            if (runtime.portraitLeases.get(avatar) !== lease || !avatar.isConnected || runtime.stage.hidden) return;
            if (fallback ? lease.fallback !== subscription || lease.current : lease.pending !== subscription) return;

            if (trace)
            {
                treePerf.span(trace, 'portraitDecode', treePerf.now() - decodeStarted);
                treePerf.count(trace, 'portraitReady', 1, true);
            }
            const previous = lease.current;
            avatar.querySelector('img')?.remove();
            avatar.append(image);
            avatar.classList.add('has-photo');
            lease.current = subscription;
            if (!fallback) lease.fallback?.release();
            lease.fallback = null;
            if (!fallback) lease.pending = null;
            previous?.release();
        }).catch(() => { if (trace) treePerf.count(trace, 'portraitDecodeFailures', 1, true); });
    });
    if (!subscription.release) lease[fallback ? 'fallback' : 'pending'] = null;
}

function releaseTreePortrait(avatar, lease)
{
    avatar.querySelector('img')?.remove();
    avatar.classList.remove('has-photo');
    lease.current?.release();
    lease.pending?.release?.();
    lease.fallback?.release?.();
}

function clearTreePortraits(runtime)
{
    for (const [avatar, lease] of runtime.portraitLeases || []) releaseTreePortrait(avatar, lease);
    runtime.portraitLeases?.clear();
}

