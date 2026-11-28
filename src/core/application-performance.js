// Local opt-in timings. No record, request, exception, project ID or user text is retained.
const appPerf = (() =>
{
    const limit = 256;
    const modules = Object.freeze(['Projects', 'Family Tree', 'People', 'Geneograph',
        'Albums', 'Archive', 'Notes', 'Places', 'Publish']);
    const selectableModules = Object.freeze(modules.filter(module => module !== 'Publish'));
    const treeKinds = new Set(['focus', 'selection', 'orientation', 'depth', 'render', 'zoom', 'pan']);
    const operations = new Map(modules.map(module => [module, new Set(['navigation', 'shellRender', 'render', 'query', 'selection', 'picker'])]));
    for (const kind of treeKinds) operations.get('Family Tree').add(kind);
    for (const kind of ['activation', 'gedcomParse', 'gedcomMap', 'gedcomCommit']) operations.get('Projects').add(kind);
    operations.get('Geneograph').add('boardOpen');
    for (const kind of ['boardRender', 'review', 'mutation']) operations.get('Geneograph').add(kind);
    operations.get('Places').add('mapInitialize');
    operations.get('Places').add('review');
    operations.get('People').add('profile');
    operations.get('People').add('mutation');
    for (const kind of ['search', 'filter', 'page', 'sort']) operations.get('People').add(kind);
    operations.get('Notes').add('editor');
    const actions = new Set(['moduleEntry', 'navigation', 'search', 'filter', 'sort', 'selection', 'multiSelection',
        'favorite', 'layoutSwitch', 'resize', 'gridHydrate', 'viewportRestore', 'inspector', 'edit', 'mutation', 'page', 'pageSize']);
    for (const kind of actions) operations.get('Albums').add(kind);
    operations.get('Publish').add('preview');
    for (const kind of ['layoutSwitch', 'folderNavigation', 'scroll', 'resize', 'previewHydrate']) operations.get('Archive').add(kind);
    const frameKinds = new Set(['selection', 'review', 'editor', 'profile', 'picker', 'preview', 'layoutSwitch', 'folderNavigation', 'scroll', 'resize', 'multiSelection']);
    const providerKeys = new Set(['people:index', 'families:index', 'families:graph', 'families:labels', 'people:directory',
        'people:link-search', 'places:associations', 'places:duplicate-pairs', 'places:inspector-events', 'people:photo-filter-search', 'people:geneo-match-names', 'notes:search-resources', 'people:album-tag-search', 'albums:tag-memberships', 'albums:photo-search']);
    const domainKeys = new Set(['projects', 'people', 'families', 'places', 'media', 'sources', 'notes',
        'boards', 'events', 'archive', 'albums', 'activity']);
    const stages = new Set(['navigation', 'people', 'families', 'projection', 'input', 'occurrences',
        'graph', 'flatten', 'spacing', 'routing', 'centering', 'centeringReroute', 'adapter',
        'diagnostics', 'inspector', 'scene', 'colors', 'viewport', 'cards', 'connectors',
        'portraitDemand', 'portraitWait', 'portraitDecode', 'renderSync',
        'lookup', 'index', 'query', 'filter', 'sort', 'detail', 'markup', 'dom', 'analysis',
        'evidence', 'editor', 'imageMarkup', 'mapSetup', 'markupBuild', 'domReplace',
        'binding', 'localization', 'mount', 'previewResize', 'previewEncode', 'retainedNodes', 'observers', 'layoutReadsWrites']);
    const metrics = new Set(['projectPeople', 'projectFamilies', 'visiblePeople', 'visibleFamilies',
        'cards', 'placeholders', 'families', 'edges', 'paths', 'diagnostics', 'mountedCards',
        'mountedPlaceholders', 'mountedControls', 'mountedPaths', 'passes', 'secondPass',
        'portraitHits', 'portraitMisses', 'portraitJobs', 'portraitFailures', 'portraitReady',
        'portraitDecodeFailures', 'recordsScanned', 'recordsMatched', 'recordsPrepared',
        'recordsRendered', 'linkedRecords', 'familyRecordsScanned', 'membershipEdgesVisited', 'sourceLinksScanned', 'placeConnectedEvents', 'placeEventOwnerVisits',
        'placeEventGroupsPrepared', 'placeEventGroupsRendered', 'placeEventRowsRendered',
        'archiveResultFiles', 'archiveResultFolders', 'archiveImageCandidates', 'archiveMountedRows',
        'archiveMountedTiles', 'archiveMountedMobileItems', 'archiveMountedStripItems', 'archiveMountedImages',
        'archiveMountedSources', 'archiveHydratedPreviews', 'archiveImageBytesKnown', 'archiveImageSourceBytes']);
    const statuses = new Set(['completed', 'canceled', 'failed', 'stopped', 'unchanged', 'empty']);
    const passFields = ['startupMs', 'bundleMs', 'constructorMs', 'postMs', 'waitMs', 'solverMs', 'roundTripMs'];
    let active = false, epoch = 0, next = 0, dropped = 0, startTime = 0;
    let samples = [];
    let current = null, frame = null, observer = null, observationStart = 0;
    let longTasks = { status: 'inactive' };
    let lifecycle = {};
    let summaryCoverage = null;
    const lifecycleKeys = new Set(['invalidations', 'legacyInvalidations', 'evictedEntries',
        'disposals', 'disposedEntries', 'projectActivations', 'unaffectedInvalidations']);
    const providerEvents = new Set(['hits', 'misses', 'uncached', 'builds']);
    const frameSupported = () => typeof requestAnimationFrame === 'function' && typeof cancelAnimationFrame === 'function';
    let config = { scope: 'all', modules: [], mode: 'detailed' };
    let exportedEpoch = -1, emptyStop = false;
    const archiveLayouts = new Set(['details', 'icons', 'image', 'sources']);
    const archivePresentations = new Set(['desktop', 'mobile', 'viewer', 'sources']);
    const archivePaths = new Set(['full', 'partial', 'hydrate', 'observe']);
    const archiveTasks = new Set(['tileLoad', 'stripLoad', 'viewerLoad', 'decode', 'thumbnail']);
    const archiveSources = new Set(['original', 'preview', 'thumbnail', 'derived', 'unknown']);
    const archiveCounters = new Set(['viewerCacheHits', 'viewerCacheMisses', 'viewerCacheEvictions',
        'thumbnailCacheHits', 'thumbnailCacheMisses', 'thumbnailCacheEvictions', 'observationSkipped',
        'previewJobsQueued', 'previewJobsCanceled', 'sourceBytesObserved', 'sourceBytesSamples']);
    const archiveGauges = new Set(['viewerEntries', 'thumbnailEntries', 'thumbnailEncodedBytes',
        'estimatedDecodedBytes', 'pendingJobs', 'runningJobs', 'mountedPreviews']);
    const archiveDurations = new Set(['resizeMs', 'encodeMs', 'queueWaitMs']);
    let archiveSummary = null, archiveStopCleanup = null;
    const summaryLimit = 8;
    const latencyBoundsMs = [1, 4, 8, 16, 33, 50, 100, 250, 500, 1000];
    let recordings = [], omittedRecordings = 0, recording = null;
    let projectContext = null;
    const imageLimit = 256;
    const pendingImages = new Map();
    let observedImages = new WeakSet();
    const known = value => Number.isFinite(value) && value >= 0 ? value : null;
    const viewport = () => ({ width: known(globalThis.innerWidth), height: known(globalThis.innerHeight) });

    function environment()
    {
        const ua = globalThis.navigator?.userAgent || '';
        const blink = ua.match(/(?:Chrome|Chromium)\/(\d{1,3})\./);
        const gecko = ua.match(/Firefox\/(\d{1,3})\./);
        const webkit = ua.match(/Version\/(\d{1,3})\..*Safari\//);
        const protocol = globalThis.location?.protocol;
        const theme = globalThis.document?.documentElement?.dataset?.theme;
        return {
            mode: protocol === 'file:' ? 'directFile' : ['https:', 'http:'].includes(protocol) ? 'hosted' : null,
            engine: blink ? 'Blink' : gecko ? 'Gecko' : webkit ? 'WebKit' : null,
            browserMajor: known(Number((blink || gecko || webkit)?.[1])),
            os: /Android/.test(ua) ? 'Android' : /iPhone|iPad|iPod/.test(ua) ? 'iOS'
                : /Windows/.test(ua) ? 'Windows' : /Macintosh/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : null,
            viewport: viewport(), devicePixelRatio: known(globalThis.devicePixelRatio),
            locale: typeof state !== 'undefined' && ['en', 'ru'].includes(state.language) ? state.language : null,
            theme: ['dark', 'light'].includes(theme) ? theme : null,
            logicalCpuHint: known(globalThis.navigator?.hardwareConcurrency),
            deviceMemoryGiBHint: known(globalThis.navigator?.deviceMemory)
        };
    }

    function workload()
    {
        if (typeof acquireProjectReadModel !== 'function' || typeof currentProjectId !== 'function'
            || typeof sampleData === 'undefined') return null;
        const id = currentProjectId();
        const model = acquireProjectReadModel(id);
        if (model.generation === null) return null;
        if (projectContext?.generation !== model.generation)
            projectContext = { generation: model.generation, collections: new Map() };

        const fields = [
            ['people', 'people'], ['families', 'families'], ['photos', 'media'],
            ['archiveFiles', 'archive', 'archiveFiles'], ['notes', 'notes'], ['places', 'places'],
            ['sources', 'sources'], ['boards', 'boards']
        ];
        const counts = { media: {} };
        for (const [key, domain, collection = domain] of fields)
        {
            const revision = model.revisionToken([domain]);
            if (revision === null) return null;
            let cached = projectContext.collections.get(key);
            if (cached?.revision !== revision)
            {
                const records = sampleData[collection];
                let count = Array.isArray(records) ? 0 : null;
                let bytes = 0, sizeKnown = 0;
                const media = key === 'photos' || key === 'archiveFiles';
                if (Array.isArray(records))
                {
                    for (const record of records)
                    {
                        if (record.projectId !== id || record.deleted) continue;
                        count++;
                        if (!media || known(record.sizeBytes) === null) continue;
                        sizeKnown++;
                        bytes += record.sizeBytes;
                    }
                }
                cached = { revision, count, size: media ? { sizeKnown, bytes: sizeKnown ? bytes : null } : null };
                projectContext.collections.set(key, cached);
            }
            counts[key] = cached.count;
            if (cached.size) counts.media[key] = cached.size;
        }
        return counts;
    }

    function summarize(trace)
    {
        const key = [trace.module, trace.kind, trace.timing || 'unspecified', trace.status].join('/');
        const row = recording.operations[key] ??= { count: 0, totalMs: 0, minMs: null, maxMs: null,
            histogram: Array(latencyBoundsMs.length + 1).fill(0) };
        row.count++;
        row.totalMs = round(row.totalMs + trace.totalMs);
        row.minMs = row.minMs === null ? trace.totalMs : Math.min(row.minMs, trace.totalMs);
        row.maxMs = row.maxMs === null ? trace.totalMs : Math.max(row.maxMs, trace.totalMs);
        const index = latencyBoundsMs.findIndex(bound => trace.totalMs <= bound);
        row.histogram[index < 0 ? latencyBoundsMs.length : index]++;
        recording.finished++;
    }
    const archiveDetailed = () => enabled('Archive') && config.mode === 'detailed';

    function archiveBucket(layout)
    {
        if (!archiveDetailed() || !archiveSummary || !archiveLayouts.has(layout)) return null;
        return archiveSummary.layouts[layout] ||= {};
    }
    function archiveContext(trace, layout, presentation, renderPath)
    {
        if (!detailed(trace) || trace.module !== 'Archive' || !archiveLayouts.has(layout)) return;
        trace.archiveLayout = layout;
        if (archivePresentations.has(presentation)) trace.archivePresentation = presentation;
        if (archivePaths.has(renderPath)) trace.archiveRenderPath = renderPath;
    }
    function archiveMetric(layout, key, value)
    {
        if (!Number.isFinite(value) || value < 0) return;
        if (!archiveCounters.has(key) && !archiveGauges.has(key) && !archiveDurations.has(key)) return;
        const bucket = archiveBucket(layout);
        if (!bucket) return;
        if (archiveCounters.has(key))
        {
            const counters = bucket.counters ||= {};
            counters[key] = (counters[key] || 0) + Math.floor(value);
        }
        else if (archiveGauges.has(key))
        {
            const gauges = bucket.gauges ||= {};
            const integer = Math.floor(value);
            const gauge = gauges[key] ||= { last: 0, max: 0 };
            gauge.last = integer;
            gauge.max = Math.max(gauge.max, integer);
        }
        else
        {
            const timings = bucket.timings ||= {};
            const item = timings[key] ||= { totalMs: 0, maxMs: 0, calls: 0 };
            item.totalMs = round(item.totalMs + value);
            item.maxMs = Math.max(item.maxMs, round(value));
            item.calls++;
        }
    }
    function archiveTaskBegin(layout, kind, source)
    {
        if (!archiveTasks.has(kind) || !archiveSources.has(source)) return null;
        const bucket = archiveBucket(layout);
        if (!bucket) return null;
        const tasks = bucket.tasks ||= {};
        const group = tasks[kind] ||= {};
        const entry = group[source] ||= { started: 0, pending: 0, maxPending: 0 };
        entry.started++;
        entry.pending++;
        entry.maxPending = Math.max(entry.maxPending, entry.pending);
        return { epoch, layout, kind, source, started: now(), done: false };
    }
    function archiveTaskValid(ticket)
    {
        return Boolean(ticket && !ticket.done && ticket.epoch === epoch && archiveDetailed());
    }
    function archiveTaskFinish(ticket, outcome, width, height)
    {
        if (!archiveTaskValid(ticket) || !['completed', 'failed', 'canceled'].includes(outcome)) return;
        const entry = archiveSummary.layouts[ticket.layout]?.tasks?.[ticket.kind]?.[ticket.source];
        if (!entry) return;
        ticket.done = true;
        entry.pending--;
        entry[outcome] = (entry[outcome] || 0) + 1;
        const elapsed = round(Math.max(0, now() - ticket.started));
        entry.elapsedTotalMs = round((entry.elapsedTotalMs || 0) + elapsed);
        entry.elapsedMaxMs = Math.max(entry.elapsedMaxMs || 0, elapsed);
        const pixels = width * height;
        if (outcome === 'completed' && Number.isFinite(pixels) && width > 0 && height > 0)
        {
            entry.dimensionSamples = (entry.dimensionSamples || 0) + 1;
            entry.totalObservedPixels = (entry.totalObservedPixels || 0) + pixels;
            entry.maxObservedPixels = Math.max(entry.maxObservedPixels || 0, pixels);
            entry.maxObservedWidth = Math.max(entry.maxObservedWidth || 0, width);
            entry.maxObservedHeight = Math.max(entry.maxObservedHeight || 0, height);
        }
    }
    // One transient cleanup owner, not a per-image event log.
    function archiveOnStop(cleanup)
    {
        if (archiveDetailed() && typeof cleanup === 'function') archiveStopCleanup = cleanup;
    }
    const now = () => performance.now();
    const round = n => Math.round(n * 1000) / 1000;
    const enabled = module => active && operations.has(module)
        && (config.scope === 'all' || config.modules.includes(module));
    const valid = trace => Boolean(trace && active && trace.epoch === epoch && trace.retained);
    const detailed = trace => valid(trace) && trace.mode === 'detailed';
    function configure(options = {})
    {
        if (active) return false;
        const selected = Array.isArray(options.modules) ? selectableModules.filter(module => options.modules.includes(module)) : config.modules;
        config = {
            scope: options.scope === 'selected' ? 'selected' : options.scope === 'all' ? 'all' : config.scope,
            modules: [...selected],
            mode: options.mode === 'basic' ? 'basic' : options.mode === 'detailed' ? 'detailed' : config.mode
        };
        return true;
    }
    function receiveLongTasks(entries)
    {
        for (const entry of entries)
        {
            if (entry.entryType !== 'longtask' || !Number.isFinite(entry.startTime)
                || entry.startTime < observationStart || !Number.isFinite(entry.duration) || entry.duration < 0) continue;
            longTasks.count++;
            longTasks.totalMs = round(longTasks.totalMs + entry.duration);
            longTasks.maxMs = round(Math.max(longTasks.maxMs, entry.duration));
        }
    }

    function observeLongTasks()
    {
        longTasks = { status: config.mode !== 'detailed' ? 'basic' : 'unsupported' };
        if (longTasks.status !== 'unsupported' || typeof PerformanceObserver === 'undefined'
            || !PerformanceObserver.supportedEntryTypes?.includes('longtask')) return;
        observationStart = now();
        try
        {
            const instance = new PerformanceObserver(list =>
            {
                if (active && observer === instance) receiveLongTasks(list.getEntries());
            });
            instance.observe({ entryTypes: ['longtask'] });
            observer = instance;
            longTasks = { status: 'observed', scope: 'pageWide', count: 0, totalMs: 0, maxMs: 0 };
        }
        catch (_error) {}
    }

    function cancelFrame()
    {
        if (frame === null) return;
        recording.frames.canceled++;
        cancelAnimationFrame(frame);
        frame = null;
    }

    function start()
    {
        if (active || (config.scope === 'selected' && !config.modules.length)) return false;
        if (!next) startTime = now();
        ++epoch;
        active = true;
        exportedEpoch = -1;
        emptyStop = false;
        archiveSummary = archiveDetailed() ? { recording: epoch, layouts: {} } : null;
        archiveStopCleanup = null;
        lifecycle = {};
        summaryCoverage = {
            recording: epoch,
            configuration: settings(),
            readModelLifecycle: config.mode === 'detailed' ? 'recorded' : 'outOfScope',
            archivePerformance: archiveSummary ? 'recorded' : 'outOfScope'
        };
        observeLongTasks();
        recording = { recording: epoch, configuration: settings(), environment: config.mode === 'detailed' ? environment() : null,
            started: 0, finished: 0, operations: {}, longTasks, frames: { observed: 0, coalesced: 0, canceled: 0, unsupported: 0 },
            build: typeof geneographBuildInfo === 'undefined' ? null : geneographBuildInfo,
            albumsImages: enabled('Albums') && config.mode === 'detailed' ? {
                    observed: 0, loaded: 0, errors: 0, canceled: 0, skipped: 0, dimensionsKnown: 0,
                    pixels: 0, maxWidth: null, maxHeight: null, maxPixels: null,
                    bytesKnown: 0, sourceBytes: 0, sources: {}, pendingPeak: 0,
                    decodeMs: null, previewQueueMs: null, previewGenerationMs: null, cache: null, previewEvents: null
                } : null };
        observedImages = new WeakSet();
        recordings.push(recording);
        if (recordings.length > summaryLimit)
        {
            recordings.shift();
            omittedRecordings++;
        }
        return true;
    }
    function finish(trace, status)
    {
        if (!active || !trace || trace.epoch !== epoch || trace.status !== 'pending' || !statuses.has(status)) return;
        trace.status = status;
        trace.totalMs = round(Math.max(0, now() - startTime - trace.atMs));
        summarize(trace);
    }
    function stop()
    {
        if (!active) return false;
        cancelFrame();
        if (observer)
        {
            receiveLongTasks(observer.takeRecords());
            observer.disconnect();
            observer = null;
        }
        for (const cancel of pendingImages.values()) cancel();
        for (const trace of samples) finish(trace, 'stopped');
        archiveStopCleanup?.();
        archiveStopCleanup = null;
        active = false;
        emptyStop = samples.length === 0;
        return true;
    }
    function clear()
    {
        stop();
        samples = [];
        lifecycle = {};
        longTasks = { status: 'inactive' };
        summaryCoverage = null;
        dropped = next = 0;
        recordings = [];
        recording = null;
        omittedRecordings = 0;
        projectContext = null;
        archiveSummary = null;
        exportedEpoch = -1;
        emptyStop = false;
        ++epoch;
    }
    function begin(module, kind, view, timing)
    {
        if (!enabled(module) || !operations.get(module).has(kind)) return null;
        const trace = { epoch, retained: true, seq: ++next, module, mode: config.mode, kind,
            atMs: round(now() - startTime), status: 'pending' };
        if (timing === 'synchronous' || timing === 'asynchronous') trace.timing = timing;
        recording.started++;
        if (current?.epoch === epoch && current.status === 'pending')
        {
            trace.parentSeq = current.seq;
            if (current.module === module) trace.action = current.action;
        }
        if (!trace.action && actions.has(kind)) trace.action = kind;
        if (trace.mode === 'detailed')
        {
            Object.assign(trace, { stages: {}, counts: {}, passTimings: [], milestones: {} });
            if (module === 'Family Tree' && view)
            {
                trace.orientation = view.orientation === 'horizontal' ? 'horizontal' : 'vertical';
                if (Number.isInteger(view.ancestorGenerations)) trace.ancestorDepth = view.ancestorGenerations;
                if (Number.isInteger(view.descendantGenerations)) trace.descendantDepth = view.descendantGenerations;
                trace.cousins = Boolean(view.showCousins);
            }
        }
        samples.push(trace);
        if (samples.length > limit)
        {
            samples.shift().retained = false;
            dropped++;
        }
        return trace;
    }
    function run(module, kind, fn)
    {
        if (!enabled(module)) return fn();
        const trace = begin(module, kind, null, 'synchronous');
        if (!trace) return fn();
        const previous = current;
        current = trace;
        try
        {
            const result = fn();
            finish(trace, result === false ? 'failed' : 'completed');
            if (trace.status !== 'completed' || !detailed(trace) || !(frameKinds.has(kind) || module === 'Albums' && ['render', 'gridHydrate'].includes(kind))) return result;
            if (!frameSupported()) recording.frames.unsupported++;
            else if (frame !== null) recording.frames.coalesced++;
            else
            {
                const handle = requestAnimationFrame(() =>
                {
                    if (trace.epoch !== epoch || frame !== handle) return;
                    frame = null;
                    recording.frames.observed++;
                    mark(trace, 'frameOpportunity');
                });
                frame = handle;
            }
            return result;
        }
        catch (error)
        {
            finish(trace, 'failed');
            throw error;
        }
        finally { current = previous; }
    }

    function currentDetailed(module)
    {
        return detailed(current) && (!module || current.module === module) ? current : null;
    }

    function recordProvider(trace, key, event, ms)
    {
        if (!detailed(trace) || !providerKeys.has(key) || !providerEvents.has(event)) return;
        const providers = trace.providers ||= {};
        const provider = providers[key] ||= {};
        provider[event] = (provider[event] || 0) + 1;
        if (event === 'builds' && Number.isFinite(ms) && ms >= 0)
            provider.buildMs = round((provider.buildMs || 0) + ms);
    }

    function recordLifecycle(module, event, value = 1)
    {
        const trace = currentDetailed();
        if (!lifecycleKeys.has(event) || !Number.isFinite(value) || value < 0
            || !(trace || (enabled(module) && config.mode === 'detailed'))) return;
        lifecycle[event] = (lifecycle[event] || 0) + Math.floor(value);
        if (trace)
        {
            const counts = trace.lifecycle ||= {};
            counts[event] = (counts[event] || 0) + Math.floor(value);
        }
    }

    function recordDomain(module, domain)
    {
        const trace = currentDetailed();
        if (!domainKeys.has(domain) || !(trace || (enabled(module) && config.mode === 'detailed'))) return;
        const domains = lifecycle.revisedDomains ||= {};
        domains[domain] = (domains[domain] || 0) + 1;
        if (trace)
        {
            const revised = trace.revisedDomains ||= {};
            revised[domain] = (revised[domain] || 0) + 1;
        }
    }

    function span(trace, stage, ms)
    {
        if (!detailed(trace) || !stages.has(stage) || !Number.isFinite(ms) || ms < 0) return;
        const item = trace.stages[stage] ||= { ms: 0, calls: 0 };
        item.ms = round(item.ms + ms);
        item.calls++;
    }
    function measure(trace, stage, fn)
    {
        if (!detailed(trace)) return fn();
        const start = now();
        try { return fn(); }
        finally { span(trace, stage, now() - start); }
    }
    function count(trace, key, value, add = false)
    {
        if (!detailed(trace) || !metrics.has(key) || !Number.isFinite(value) || value < 0) return;
        trace.counts[key] = add ? (trace.counts[key] || 0) + Math.floor(value) : Math.floor(value);
    }
    function mark(trace, key)
    {
        if (!detailed(trace) || !['pendingFeedback', 'scenePublished', 'frameOpportunity'].includes(key)) return;
        trace.milestones[key] ??= round(now() - startTime - trace.atMs);
    }
    function pass(trace, values)
    {
        if (!detailed(trace) || trace.passTimings.length >= 2) return;
        const entry = {};
        for (const field of passFields)
            if (Number.isFinite(values[field]) && values[field] >= 0) entry[field] = round(values[field]);
        trace.passTimings.push(entry);
    }
    function phase(trace, stage, fn)
    {
        if (!detailed(trace) || trace.timing !== 'synchronous' || !stages.has(stage)) return fn();
        const start = now();
        trace.phaseDepth = (trace.phaseDepth || 0) + 1;
        try { return fn(); }
        finally
        {
            const elapsed = now() - start;
            const outermost = --trace.phaseDepth === 0;
            if (detailed(trace) && trace.status === 'pending')
            {
                span(trace, stage, elapsed);
                if (outermost) trace.coveredMs = (trace.coveredMs || 0) + elapsed;
            }
        }
    }

    function albumsContext(trace, path, matched, displayed)
    {
        if (!detailed(trace) || trace.module !== 'Albums') return;
        trace.renderPath = ['full', 'partial', 'hydrate'].includes(path) ? path : undefined;
        trace.workload = { project: workload(), matched: known(matched), displayed: known(displayed), viewport: viewport() };
    }

    function observeAlbumImage(image, source, size)
    {
        if (!image || !enabled('Albums') || config.mode !== 'detailed' || observedImages.has(image)) return;
        const summary = recording.albumsImages;
        observedImages.add(image);
        if (!image.complete && pendingImages.size >= imageLimit)
        {
            summary.skipped++;
            return;
        }
        summary.observed++;
        const category = archiveSources.has(source) ? source : 'unknown';
        summary.sources[category] = (summary.sources[category] || 0) + 1;
        if (known(size) !== null)
        {
            summary.bytesKnown++;
            summary.sourceBytes += size;
        }
        const finishImage = loaded =>
        {
            if (!loaded) { summary.errors++; return; }
            summary.loaded++;
            if (image.naturalWidth > 0 && image.naturalHeight > 0)
            {
                summary.dimensionsKnown++;
                const pixels = image.naturalWidth * image.naturalHeight;
                summary.pixels += pixels;
                summary.maxWidth = Math.max(summary.maxWidth || 0, image.naturalWidth);
                summary.maxHeight = Math.max(summary.maxHeight || 0, image.naturalHeight);
                summary.maxPixels = Math.max(summary.maxPixels || 0, pixels);
            }
        };
        if (image.complete) finishImage(image.naturalWidth > 0);
        else
        {
            const events = new AbortController();
            const cleanup = () => { events.abort(); pendingImages.delete(image); };
            pendingImages.set(image, () => { cleanup(); summary.canceled++; });
            summary.pendingPeak = Math.max(summary.pendingPeak, pendingImages.size);
            const settle = loaded =>
            {
                if (!pendingImages.has(image)) return;
                if (!image.isConnected) pendingImages.get(image)();
                else { cleanup(); finishImage(loaded); }
            };
            image.addEventListener('load', () => settle(true), { signal: events.signal });
            image.addEventListener('error', () => settle(false), { signal: events.signal, capture: true });
        }
    }

    function cancelAlbumImage(image)
    {
        pendingImages.get(image)?.();
    }

    function pruneAlbumImageObservations()
    {
        for (const [image, cancel] of pendingImages)
            if (!image.isConnected) cancel();
    }

    function albumsMediaEpoch()
    {
        return enabled('Albums') && config.mode === 'detailed' ? epoch : null;
    }

    function albumsMediaMetric(origin, key, value)
    {
        if (origin === null || origin !== albumsMediaEpoch() || known(value) === null) return;
        const summary = recording.albumsImages;
        if (['decodeMs', 'previewQueueMs', 'previewGenerationMs'].includes(key))
        {
            const duration = summary[key] ??= { count: 0, totalMs: 0, maxMs: 0 };
            duration.count++;
            duration.totalMs = round(duration.totalMs + value);
            duration.maxMs = Math.max(duration.maxMs, value);
        }
        else if (['queued', 'canceled', 'completed', 'failed', 'mounted', 'detached'].includes(key))
        {
            const events = summary.previewEvents ??= {};
            events[key] = (events[key] || 0) + value;
        }
        else if (['hits', 'misses', 'evictions'].includes(key))
        {
            const cache = summary.cache ??= {};
            cache[key] = (cache[key] || 0) + value;
        }
        else if (['entries', 'encodedBytes', 'mountedPreviews', 'pendingJobs', 'runningJobs'].includes(key))
        {
            const cache = summary.cache ??= {};
            const gauge = cache[key] ??= { last: 0, peak: 0 };
            gauge.last = value;
            gauge.peak = Math.max(gauge.peak, value);
        }
    }

    function settings()
    {
        return { scope: config.scope, modules: [...config.modules], mode: config.mode };
    }
    function numericFields(values, keys)
    {
        return Object.fromEntries([...keys].filter(key => Number.isFinite(values[key])).map(key => [key, values[key]]));
    }

    function structuredLifecycle(values)
    {
        return { ...numericFields(values, lifecycleKeys),
            revisedDomains: values.revisedDomains && numericFields(values.revisedDomains, domainKeys) };
    }

    function snapshot()
    {
        return { schemaVersion: 3, recorder: 'geneograph-application-performance', elkVersion: '0.12.1',
            buildInfo: typeof geneographBuildInfo === 'undefined' ? null : geneographBuildInfo,
            active, configuration: settings(), capacity: limit, dropped, totalOperations: next,
            epochSummaries: { capacity: summaryLimit, omittedRecordings, histogramUpperBoundsMs: [...latencyBoundsMs],
                recordings: recordings.map(item => ({ ...JSON.parse(JSON.stringify(item)), incomplete: item.started - item.finished })) },
            summaryCoverage: summaryCoverage && {
                recording: summaryCoverage.recording,
                configuration: { ...summaryCoverage.configuration, modules: [...summaryCoverage.configuration.modules] },
                readModelLifecycle: summaryCoverage.readModelLifecycle,
                archivePerformance: summaryCoverage.archivePerformance,
                historicalSummaries: 'unavailable'
            },
            browser: { frameOpportunitySupported: frameSupported(), longTasks: { ...longTasks } },
            readModelLifecycle: structuredLifecycle(lifecycle),
            ...(archiveSummary ? { archivePerformance: JSON.parse(JSON.stringify(archiveSummary)) } : {}),
            samples: samples.map(trace =>
            ({
                seq: trace.seq, recording: trace.epoch, module: trace.module, mode: trace.mode,
                kind: trace.kind, atMs: trace.atMs, status: trace.status, totalMs: trace.totalMs,
                timing: trace.timing, parentSeq: trace.parentSeq,
                ...(trace.mode === 'detailed' ? {
                    action: trace.action, renderPath: trace.renderPath,
                    workload: trace.workload && JSON.parse(JSON.stringify(trace.workload)),
                    synchronousCoverage: trace.coveredMs === undefined || trace.totalMs === undefined ? undefined : {
                        coveredMs: round(Math.min(trace.totalMs, trace.coveredMs)),
                        remainderMs: round(Math.max(0, trace.totalMs - trace.coveredMs))
                    },
                    archiveLayout: trace.archiveLayout, archivePresentation: trace.archivePresentation,
                    archiveRenderPath: trace.archiveRenderPath,
                    orientation: trace.orientation, ancestorDepth: trace.ancestorDepth,
                    descendantDepth: trace.descendantDepth, cousins: trace.cousins, cache: trace.cache,
                    providers: trace.providers && Object.fromEntries([...providerKeys].filter(key => trace.providers[key])
                        .map(key => [key, Object.fromEntries([...providerEvents, 'buildMs']
                            .filter(event => Number.isFinite(trace.providers[key][event]))
                            .map(event => [event, trace.providers[key][event]]))])),
                    lifecycle: trace.lifecycle && structuredLifecycle(trace.lifecycle),
                    revisedDomains: trace.revisedDomains && numericFields(trace.revisedDomains, domainKeys),
                    stages: Object.fromEntries([...stages].filter(key => trace.stages[key]).map(key =>
                        [key, { ms: trace.stages[key].ms, calls: trace.stages[key].calls }])),
                    counts: Object.fromEntries([...metrics].filter(key => Object.hasOwn(trace.counts, key)).map(key => [key, trace.counts[key]])),
                    passTimings: trace.passTimings.map(entry => Object.fromEntries(passFields
                        .filter(key => Object.hasOwn(entry, key)).map(key => [key, entry[key]]))),
                    milestones: { pendingFeedback: trace.milestones.pendingFeedback,
                        scenePublished: trace.milestones.scenePublished, frameOpportunity: trace.milestones.frameOpportunity }
                } : {})
            })) };
    }
    function download()
    {
        if (active || !samples.length) return false;
        const recording = epoch;
        let url, link;
        try
        {
            url = URL.createObjectURL(new Blob([JSON.stringify(snapshot(), null, 2)], { type: 'application/json' }));
            link = document.createElement('a');
            link.href = url;
            link.download = 'geneograph-application-performance.json';
            document.body.append(link);
            link.click();
            if (recording === epoch && !active) exportedEpoch = recording;
            return true;
        }
        catch (_error) { return false; }
        finally
        {
            link?.remove();
            if (url) setTimeout(() => URL.revokeObjectURL(url), 1000);
        }
    }
    return { modules, selectableModules, enabled, configure, settings, start, stop, clear, begin, run,
        measure, phase, albumsContext, observeAlbumImage, cancelAlbumImage, pruneAlbumImageObservations, albumsMediaEpoch, albumsMediaMetric, span, count, mark, pass, finish, snapshot, download, valid, now,
        currentDetailed, recordProvider, recordLifecycle, recordDomain,
        archiveDetailed, archiveContext, archiveMetric, archiveTaskBegin, archiveTaskValid, archiveTaskFinish, archiveOnStop,
        kind(trace, kind) { if (valid(trace) && trace.module === 'Family Tree' && treeKinds.has(kind)) trace.kind = kind; },
        cache(trace, value) { if (detailed(trace) && ['hit', 'miss', 'pending'].includes(value)) trace.cache = value; },
        status() { return { active, count: samples.length, dropped, totalOperations: next,
            recording: epoch, exported: exportedEpoch === epoch, emptyStop }; } };
})();
