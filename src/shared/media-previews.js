// One generation slot for Archive and Albums. Each adapter owns its scope and budgets.
let mediaPreviewGenerating = false;
const mediaPreviewWaiting = new Set();

function mediaPreviewLocalSource(source)
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

function mediaPreviewInlineWithinBudget(source, maximumBytes)
{
    if (!/^data:image\//i.test(source)) return true;
    const comma = source.indexOf(',');
    if (comma < 0) return false;
    const payload = source.length - comma - 1;
    const bytes = /;base64$/i.test(source.slice(0, comma)) ? Math.floor(payload * 3 / 4) : payload;
    return bytes <= maximumBytes;
}

function createMediaPreviewRuntime(policy)
{
    const cache = new Map();
    const queue = new Map();
    const warmQueue = new Map();
    const targets = new Map();
    const mounted = new Map();
    const leases = new Map();
    let observer = null;
    let viewportObserver = null;
    let runningJob = null;
    let frame = 0;
    let project = null;
    let scopeLocation = null;
    let revision = -1;
    let encodedBytes = 0;
    const sourceKeys = new WeakMap();
    let nextSource = 0;

    function cancel(target)
    {
        if (runningJob?.target !== target) return;
        runningJob.canceled = true;
        runningJob.cancel?.();
    }

    function metrics(layout)
    {
        policy.metric(layout, 'thumbnailEntries', cache.size);
        policy.metric(layout, 'thumbnailEncodedBytes', encodedBytes);
        policy.metric(layout, 'pendingJobs', queue.size);
        policy.metric(layout, 'runningJobs', Number(Boolean(runningJob)));
        policy.metric(layout, 'mountedPreviews', mounted.size);
    }

    function detach(element, outcome = 'canceled')
    {
        const attachment = mounted.get(element);
        if (!attachment) return false;
        mounted.delete(element);
        const holders = leases.get(attachment.key);
        holders?.delete(element);
        if (!holders?.size) leases.delete(attachment.key);
        policy.finishImage?.(attachment.image, outcome);
        policy.resetImage?.(element);
        policy.metric(targets.get(element)?.layout, 'previewDetached', 1);
        attachment.image.removeAttribute('src');
        if (attachment.placeholder && attachment.image.parentNode === element)
            attachment.image.replaceWith(attachment.placeholder);
        else attachment.image.remove();
        return true;
    }

    function release(key, layout)
    {
        const entry = cache.get(key);
        if (!entry) return;
        // Explicit invalidation can retire a leased entry; detach all its users first.
        for (const element of leases.get(key) || []) detach(element);
        cache.delete(key);
        if (entry.url) URL.revokeObjectURL(entry.url);
        encodedBytes -= entry.bytes;
        policy.metric(layout, 'thumbnailCacheEvictions', 1);
    }

    function touch(target)
    {
        const cached = cache.get(target.key);
        if (cached)
        {
            cache.delete(target.key);
            cache.set(target.key, cached);
        }
        const attachment = mounted.get(target.element);
        if (attachment)
        {
            mounted.delete(target.element);
            mounted.set(target.element, attachment);
        }
    }

    function focused(target) { return Boolean(policy.focused?.(target.element)); }

    function offscreen(element)
    {
        const target = targets.get(element);
        return !target || !element.isConnected || (!target.visible && !focused(target));
    }

    function prioritize(element)
    {
        const target = targets.get(element);
        if (!target) return;
        enqueue(target);
        schedule();
    }

    function canMount()
    {
        return mounted.size < policy.mounted
            || [...mounted.keys()].some(offscreen);
    }

    function makeMountRoom()
    {
        if (mounted.size < policy.mounted) return true;
        const victim = [...mounted.keys()].find(offscreen);
        return victim !== undefined && detach(victim);
    }

    function makeRoom(bytes, layout)
    {
        if (bytes > policy.bytes) return false;
        while (cache.size >= policy.entries
            || encodedBytes + bytes > policy.bytes)
        {
            // LRU across cached and buffered elements. Near-viewport leases stay protected.
            const key = [...cache.keys()].find(key =>
                [...(leases.get(key) || [])].every(offscreen));
            if (key === undefined) return false;
            release(key, layout);
        }
        return true;
    }

    // Warm derivatives never wait behind an original-image load/decode/encode.
    function restoreCached(target)
    {
        const cached = cache.get(target.key);
        if (!cached) return false;
        touch(target);
        target.blocked = false;
        show(target, cached.url);
        if (!target.blocked)
        {
            policy.metric(target.layout, 'thumbnailCacheHits', 1);
            metrics(target.layout);
        }
        return true;
    }

    function enqueue(target)
    {
        if (!targetCurrent(target)) return;
        if (mounted.has(target.element))
        {
            touch(target);
            return;
        }
        if (policy.warmPerFrame && cache.has(target.key))
        {
            if (warmQueue.size < policy.pending || warmQueue.has(target.element))
                warmQueue.set(target.element, target);
            else target.blocked = true;
            return;
        }
        if (restoreCached(target))
        {
            queue.delete(target.element);
            return;
        }
        if (queue.has(target.element) || runningJob?.target === target) return;
        if (queue.size >= (policy.pending ?? Infinity))
        {
            const far = (target.inViewport || focused(target)) && [...queue.values()].find(item => !item.inViewport && !focused(item));
            if (!far) { target.blocked = true; return; }
            dequeue(far);
            far.blocked = true;
        }
        target.blocked = false;
        target.queuedAt = policy.now();
        queue.set(target.element, target);
        policy.metric(target.layout, 'previewJobsQueued', 1);
    }

    function wakeBlocked()
    {
        const waiting = [...targets.values()].filter(target => target.blocked && target.visible);
        waiting.sort((a, b) => Number(b.inViewport) - Number(a.inViewport));
        for (const target of waiting) enqueue(target);
    }

    function dequeue(target)
    {
        warmQueue.delete(target.element);
        if (queue.delete(target.element)) policy.metric(target.layout, 'previewJobsCanceled', 1);
        target.blocked = false;
    }

    function forget(element)
    {
        const target = targets.get(element);
        if (!target) return;
        observer?.unobserve(element);
        viewportObserver?.unobserve(element);
        targets.delete(element);
        dequeue(target);
        cancel(target);
        if (detach(element)) wakeBlocked();
        metrics(target.layout);
        schedule();
    }

    function unmount()
    {
        // Clear targets before detaching: no obsolete target can be woken during teardown.
        const retired = [...targets.values()];
        targets.clear();
        mediaPreviewWaiting.delete(schedule);
        for (const target of retired)
        {
            dequeue(target);
            cancel(target);
            detach(target.element);
        }
        observer?.disconnect();
        viewportObserver?.disconnect();
        observer = viewportObserver = null;
        if (frame) cancelAnimationFrame(frame);
        frame = 0;
        if (retired.length) metrics(retired[0].layout);
    }

    function lifecycle()
    {
        const scope = policy.scope();
        const nextProject = scope?.project ?? null;
        const nextLocation = scope?.location ?? null;
        if (project !== nextProject || scopeLocation !== nextLocation)
        {
            unmount();
            for (const key of cache.keys()) release(key, policy.layout());
            project = nextProject;
            scopeLocation = nextLocation;
            revision = -1;
            metrics(policy.layout());
        }
        if (!project || revision === scope.revision) return;
        revision = scope.revision;
        const records = policy.records(project);
        const changed = entry =>
        {
            const record = records.get(entry.file.id);
            return record !== entry.file || policy.source(record) !== entry.source || record.sizeBytes !== entry.sizeBytes;
        };
        for (const target of [...targets.values()])
        {
            if (!changed(target)) continue;
            forget(target.element);
            const record = records.get(target.file.id);
            if (record && target.element.isConnected) track(target.element, record, target.layout);
        }
        for (const [key, entry] of cache)
            if (changed(entry)) release(key, policy.layout());
        metrics(policy.layout());
    }

    function prune()
    {
        for (const [element] of targets)
            if (!element.isConnected) forget(element);
    }

    function track(element, file, layout)
    {
        const source = policy.source(file);
        if (!source || !element || typeof IntersectionObserver !== 'function') return;
        if (targets.has(element)) forget(element);
        const tier = policy.tier(layout, element);
        let sourceKey = sourceKeys.get(file);
        if (!sourceKey || sourceKey.source !== source || sourceKey.sizeBytes !== file.sizeBytes)
        {
            sourceKey = { source, sizeBytes: file.sizeBytes, revision: ++nextSource };
            sourceKeys.set(file, sourceKey);
        }
        const key = sourceKey.revision + ':' + tier;
        targets.set(element, { element, file, layout, source, tier, key,
            sizeBytes: file.sizeBytes, visible: false, inViewport: false, blocked: false });
        if (!observer)
        {
            const nearObserver = new IntersectionObserver(entries =>
            {
                if (observer !== nearObserver) return;
                const entering = [], layouts = new Set();
                let capacityChanged = false;
                // Apply the entire observation batch first: don't evict an element
                // that is about to become visible later in this same callback.
                for (const entry of entries)
                {
                    const target = targets.get(entry.target);
                    if (!target) continue;
                    layouts.add(target.layout);
                    target.visible = entry.isIntersecting;
                    if (entry.isIntersecting) entering.push(target);
                    else
                    {
                        target.inViewport = false;
                        if (!focused(target))
                        {
                            dequeue(target);
                            cancel(target);
                        }
                        // Keep the mounted derivative as a warm offscreen buffer.
                        capacityChanged = true;
                    }
                }
                entering.sort((a, b) => Number(b.inViewport) - Number(a.inViewport));
                for (const target of entering) enqueue(target);
                if (capacityChanged) wakeBlocked();
                for (const layout of layouts) metrics(layout);
                schedule();
            }, { rootMargin: policy.margin });
            observer = nearObserver;
            // Strict viewport observations prioritize visible misses over the
            // near-viewport prefetch queue, without synchronous layout reads.
            const strictObserver = new IntersectionObserver(entries =>
            {
                if (viewportObserver !== strictObserver) return;
                for (const entry of entries)
                {
                    const target = targets.get(entry.target);
                    if (target)
                {
                    target.inViewport = entry.isIntersecting;
                    if (target.inViewport && policy.pending && target.blocked) enqueue(target);
                }
                }
                schedule();
            });
            viewportObserver = strictObserver;
        }
        observer.observe(element);
        viewportObserver.observe(element);
    }

    function targetCurrent(target)
    {
        return (target.visible || focused(target)) && target.element.isConnected && targets.get(target.element) === target
            && policy.current(target, project, scopeLocation, revision)
            && !target.file.deleted && target.file.sizeBytes === target.sizeBytes
            && policy.source(target.file) === target.source;
    }

    function show(target, url, observe = true)
    {
        if (!url || !targetCurrent(target) || mounted.has(target.element)) return;
        if (!makeMountRoom())
        {
            target.blocked = true;
            return;
        }
        const image = document.createElement('img');
        image.alt = '';
        image.decoding = 'async';
        const placeholder = policy.placeholder?.(target) || null;
        if (placeholder) placeholder.replaceWith(image);
        else target.element.prepend(image);
        mounted.set(target.element, { key: target.key, image, placeholder });
        if (!leases.has(target.key)) leases.set(target.key, new Set());
        leases.get(target.key).add(target.element);
        policy.prepareImage?.(target, image);
        if (observe) policy.observeImage?.(target, image);
        image.addEventListener('error', () =>
        {
            if (mounted.get(target.element)?.image !== image) return;
            detach(target.element, 'failed');
            release(target.key, target.layout);
            // A broken derived URL stays a fallback until its source changes.
            if (makeRoom(0, target.layout))
                cache.set(target.key, { file: target.file, source: target.source,
                    sizeBytes: target.sizeBytes, url: '', bytes: 0 });
            wakeBlocked();
            metrics(target.layout);
            schedule();
        }, { once: true });
        image.src = url;
        if (observe)
        {
            policy.metric(target.layout, 'previewMounted', 1);
            policy.afterSource?.(target, image);
        }
    }

    function schedule()
    {
        if (frame || !canMount() || (!warmQueue.size && (!queue.size || runningJob))) return;
        if (!warmQueue.size && mediaPreviewGenerating)
        {
            mediaPreviewWaiting.add(schedule);
            return;
        }
        frame = requestAnimationFrame(() =>
        {
            frame = 0;
            if (warmQueue.size)
            {
                const priority = target => focused(target) ? 2 : Number(target.inViewport);
                const candidates = [...warmQueue.values()].sort((a, b) => priority(b) - priority(a));
                for (const target of candidates.slice(0, policy.warmPerFrame))
                {
                    warmQueue.delete(target.element);
                    if (targetCurrent(target) && !restoreCached(target)) enqueue(target);
                }
                wakeBlocked();
            }
            run();
            if (warmQueue.size || !runningJob && queue.size) schedule();
        });
    }

    async function run()
    {
        if (runningJob || mediaPreviewGenerating || !canMount()) return;
        const candidates = [...queue.values()];
        const target = candidates.find(focused) || candidates.find(candidate => candidate.inViewport)
            || queue.values().next().value;
        if (!target) return;
        queue.delete(target.element);
        if (!targetCurrent(target)) { schedule(); return; }
        const { key, layout, file, source, tier } = target;
        if (restoreCached(target))
        {
            schedule();
            return;
        }

        const job = runningJob = { target, cancel: null };
        mediaPreviewGenerating = true;
        const observation = policy.begin(layout, 'thumbnail', 'derived');
        policy.metric(layout, 'thumbnailCacheMisses', 1, observation);
        policy.metric(layout, 'queueWaitMs', policy.now() - target.queuedAt, observation);
        metrics(layout);
        let image, canvas;
        let ownsImage = false;
        let width = 0;
        let height = 0;
        let outcome = 'failed';
        try
        {
            if (!policy.withinBudget(target))
                throw new Error('Preview source exceeds budget');
            const borrowed = policy.borrowImage?.(target);
            if (borrowed)
            {
                image = await borrowed;
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
            if (job.canceled || !targetCurrent(target)) return;
            const pixels = image.naturalWidth * image.naturalHeight;
            if (!pixels || pixels > policy.sourcePixels) throw new Error('Archive thumbnail source exceeds budget');
            if (ownsImage) job.cancel = () => { image.src = ''; };
            const decodeStart = policy.now();
            await image.decode();
            if (policy.valid(observation)) policy.metric(layout, 'decodeMs', policy.now() - decodeStart, observation);
            job.cancel = null;
            if (job.canceled || !targetCurrent(target)) return;
            const ratio = Math.min(1, tier / Math.max(image.naturalWidth, image.naturalHeight));
            canvas = document.createElement('canvas');
            canvas.width = width = Math.max(1, Math.round(image.naturalWidth * ratio));
            canvas.height = height = Math.max(1, Math.round(image.naturalHeight * ratio));
            const drawStart = policy.now();
            canvas.getContext('2d', { alpha: policy.alpha }).drawImage(image, 0, 0, width, height);
            if (policy.valid(observation)) policy.metric(layout, 'resizeMs', policy.now() - drawStart, observation);
            if (ownsImage)
            {
                image.src = '';
                ownsImage = false;
            }
            const encodeStart = policy.now();
            const blob = await new Promise(resolve => canvas.toBlob(resolve, policy.format, policy.quality));
            if (policy.valid(observation)) policy.metric(layout, 'encodeMs', policy.now() - encodeStart, observation);
            if (!blob) throw new Error('Archive thumbnail encode failed');
            if (job.canceled || !targetCurrent(target)) return;
            if (!makeRoom(blob.size, policy.valid(observation) ? layout : null))
            {
                target.blocked = blob.size <= policy.bytes;
                return;
            }
            cache.set(key, { file, source, sizeBytes: file.sizeBytes,
                url: URL.createObjectURL(blob), bytes: blob.size });
            encodedBytes += blob.size;
            outcome = 'completed';
            show(target, cache.get(key).url, policy.valid(observation));
        }
        catch (_)
        {
            const metricLayout = policy.valid(observation) ? layout : null;
            if (outcome === 'completed') release(key, metricLayout);
            outcome = 'failed';
            if (!job.canceled && targetCurrent(target) && makeRoom(0, metricLayout))
                cache.set(key, { file, source, sizeBytes: file.sizeBytes, url: '', bytes: 0 });
        }
        finally
        {
            if (canvas) canvas.width = canvas.height = 0;
            if (ownsImage) image.src = '';
            if (job.canceled || !targetCurrent(target)) outcome = 'canceled';
            const observing = policy.valid(observation);
            if (observing && outcome === 'canceled') policy.metric(layout, 'previewJobsCanceled', 1);
            policy.finish(observation, outcome, width, height);
            runningJob = null;
            mediaPreviewGenerating = false;
            const waiting = [...mediaPreviewWaiting];
            mediaPreviewWaiting.clear();
            waiting.forEach(wake => wake());
            // A target may leave and re-enter while its canceled encode settles.
            if (job.canceled && targetCurrent(target)) enqueue(target);
            if (observing) metrics(layout);
            if (policy.pending) wakeBlocked();
            schedule();
        }
    }

    return { lifecycle, prune, track, forget, prioritize, unmount, run, release, cache, targets, mounted, leases,
        get bytes() { return encodedBytes; }, get observer() { return observer; },
        get viewportObserver() { return viewportObserver; }, get job() { return runningJob; } };
}
