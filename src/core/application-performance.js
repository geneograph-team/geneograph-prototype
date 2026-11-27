// Local opt-in timings. No record, request, exception, project ID or user text is retained.
const appPerf = (() =>
{
    const limit = 256;
    const modules = Object.freeze(['Projects', 'Family Tree', 'People', 'Geneograph',
        'Albums', 'Archive', 'Notes', 'Places', 'Publish']);
    const treeKinds = new Set(['focus', 'selection', 'orientation', 'depth', 'render', 'zoom', 'pan']);
    const operations = new Map(modules.map(module => [module, new Set(['navigation', 'shellRender', 'render'])]));
    for (const kind of treeKinds) operations.get('Family Tree').add(kind);
    for (const kind of ['activation', 'gedcomParse', 'gedcomMap', 'gedcomCommit']) operations.get('Projects').add(kind);
    operations.get('Geneograph').add('boardOpen');
    operations.get('Geneograph').add('boardRender');
    operations.get('Places').add('mapInitialize');
    const stages = new Set(['navigation', 'people', 'families', 'projection', 'input', 'occurrences',
        'graph', 'flatten', 'spacing', 'routing', 'centering', 'centeringReroute', 'adapter',
        'diagnostics', 'inspector', 'scene', 'colors', 'viewport', 'cards', 'connectors',
        'portraitDemand', 'portraitWait', 'portraitDecode', 'renderSync']);
    const metrics = new Set(['projectPeople', 'projectFamilies', 'visiblePeople', 'visibleFamilies',
        'cards', 'placeholders', 'families', 'edges', 'paths', 'diagnostics', 'mountedCards',
        'mountedPlaceholders', 'mountedControls', 'mountedPaths', 'passes', 'secondPass',
        'portraitHits', 'portraitMisses', 'portraitJobs', 'portraitFailures', 'portraitReady',
        'portraitDecodeFailures']);
    const statuses = new Set(['completed', 'canceled', 'failed', 'stopped', 'unchanged', 'empty']);
    const passFields = ['startupMs', 'bundleMs', 'constructorMs', 'postMs', 'waitMs', 'solverMs', 'roundTripMs'];
    let active = false, epoch = 0, next = 0, dropped = 0, startTime = 0;
    let samples = [];
    let config = { scope: 'all', modules: [...modules], mode: 'detailed' };
    const now = () => performance.now();
    const round = n => Math.round(n * 1000) / 1000;
    const enabled = module => active && operations.has(module)
        && (config.scope === 'all' || config.modules.includes(module));
    const valid = trace => Boolean(trace && active && trace.epoch === epoch && trace.retained);
    const detailed = trace => valid(trace) && trace.mode === 'detailed';
    function configure(options = {})
    {
        if (active) return false;
        const selected = Array.isArray(options.modules) ? modules.filter(module => options.modules.includes(module)) : config.modules;
        config = {
            scope: options.scope === 'selected' ? 'selected' : options.scope === 'all' ? 'all' : config.scope,
            modules: [...selected],
            mode: options.mode === 'basic' ? 'basic' : options.mode === 'detailed' ? 'detailed' : config.mode
        };
        return true;
    }
    function start()
    {
        if (active || (config.scope === 'selected' && !config.modules.length)) return false;
        if (!next) startTime = now();
        ++epoch;
        active = true;
        return true;
    }
    function finish(trace, status)
    {
        if (!valid(trace) || trace.status !== 'pending' || !statuses.has(status)) return;
        trace.status = status;
        trace.totalMs = round(Math.max(0, now() - startTime - trace.atMs));
    }
    function stop()
    {
        if (!active) return false;
        for (const trace of samples) finish(trace, 'stopped');
        active = false;
        return true;
    }
    function clear()
    {
        stop();
        samples = [];
        dropped = next = 0;
        ++epoch;
    }
    function begin(module, kind, view)
    {
        if (!enabled(module) || !operations.get(module).has(kind)) return null;
        const trace = { epoch, retained: true, seq: ++next, module, mode: config.mode, kind,
            atMs: round(now() - startTime), status: 'pending' };
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
        const trace = begin(module, kind);
        try
        {
            const result = fn();
            finish(trace, result === false ? 'failed' : 'completed');
            return result;
        }
        catch (error)
        {
            finish(trace, 'failed');
            throw error;
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
    function settings()
    {
        return { scope: config.scope, modules: [...config.modules], mode: config.mode };
    }
    function snapshot()
    {
        return { schemaVersion: 2, recorder: 'geneograph-application-performance', elkVersion: '0.12.1',
            active, configuration: settings(), capacity: limit, dropped, totalOperations: next,
            samples: samples.map(trace =>
            ({
                seq: trace.seq, recording: trace.epoch, module: trace.module, mode: trace.mode,
                kind: trace.kind, atMs: trace.atMs, status: trace.status, totalMs: trace.totalMs,
                ...(trace.mode === 'detailed' ? {
                    orientation: trace.orientation, ancestorDepth: trace.ancestorDepth,
                    descendantDepth: trace.descendantDepth, cousins: trace.cousins, cache: trace.cache,
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
        const url = URL.createObjectURL(new Blob([JSON.stringify(snapshot(), null, 2)], { type: 'application/json' }));
        const link = document.createElement('a');
        link.href = url;
        link.download = 'geneograph-application-performance.json';
        document.body.append(link);
        try { link.click(); }
        finally { link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
    }
    return { modules, enabled, configure, settings, start, stop, clear, begin, run,
        measure, span, count, mark, pass, finish, snapshot, download, valid, now,
        kind(trace, kind) { if (valid(trace) && trace.module === 'Family Tree' && treeKinds.has(kind)) trace.kind = kind; },
        cache(trace, value) { if (detailed(trace) && ['hit', 'miss', 'pending'].includes(value)) trace.cache = value; },
        status() { return { active, count: samples.length, dropped, totalOperations: next }; } };
})();
