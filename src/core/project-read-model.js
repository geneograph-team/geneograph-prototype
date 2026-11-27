// Canonical records are borrowed for reads. Providers retain one compatible value
// per key and the coordinator retains only the currently opened project.
const PROJECT_READ_DOMAINS = Object.freeze([
    'projects', 'people', 'families', 'places', 'media', 'sources', 'notes',
    'boards', 'events', 'archive', 'albums', 'activity'
]);
let activeProjectReadModel = null;
let projectReadGeneration = 0;
let projectReadRetentionPaused = false;

function setProjectReadModelActive(projectId)
{
    if (projectReadRetentionPaused) return;
    const project = projectId ? validProjectById(projectId) : null;
    if (activeProjectReadModel?.project === project || (!activeProjectReadModel && !project)) return;
    disposeProjectReadModel();
    if (project)
    {
        if (typeof appPerf !== 'undefined') appPerf.recordLifecycle(
            typeof state === 'undefined' ? null : state.activeModule, 'projectActivations');
        activeProjectReadModel = {
            project, generation: projectReadGeneration, fallback: 0,
            revisions: new Map(), entries: new Map()
        };
    }
}

function disposeProjectReadModel()
{
    if (activeProjectReadModel && typeof appPerf !== 'undefined')
    {
        const module = typeof state === 'undefined' ? null : state.activeModule;
        appPerf.recordLifecycle(module, 'disposals');
        appPerf.recordLifecycle(module, 'disposedEntries', activeProjectReadModel.entries.size);
    }
    activeProjectReadModel?.entries.clear();
    activeProjectReadModel = null;
    projectReadGeneration++;
}

// Staged import activation may read a draft before its owning commit succeeds.
function withoutProjectReadModelRetention(callback)
{
    const previous = projectReadRetentionPaused;
    projectReadRetentionPaused = true;
    disposeProjectReadModel();
    try { return callback(); }
    finally { projectReadRetentionPaused = previous; }
}

function invalidateProjectReadModel(projectId, domains)
{
    const active = activeProjectReadModel;
    if (!active) return;
    const classified = projectId && Array.isArray(domains) && domains.length
        && domains.every(domain => PROJECT_READ_DOMAINS.includes(domain));
    const perf = typeof appPerf === 'undefined' ? null : appPerf;
    const module = typeof state === 'undefined' ? null : state.activeModule;
    if (!classified)
    {
        perf?.recordLifecycle(module, 'legacyInvalidations');
        perf?.recordLifecycle(module, 'evictedEntries', active.entries.size);
        active.fallback++;
        active.entries.clear();
        return;
    }
    if (active.project.id !== projectId) return;
    const affected = new Set(domains);
    perf?.recordLifecycle(module, 'invalidations');
    for (const domain of affected)
    {
        active.revisions.set(domain, (active.revisions.get(domain) || 0) + 1);
        perf?.recordDomain(module, domain);
    }
    const before = active.entries.size;
    for (const [key, entry] of active.entries)
    {
        if (entry.domains.some(domain => affected.has(domain))) active.entries.delete(key);
    }
    perf?.recordLifecycle(module, 'evictedEntries', before - active.entries.size);
    if (before === active.entries.size) perf?.recordLifecycle(module, 'unaffectedInvalidations');
}

function acquireProjectReadModel(projectId)
{
    const project = projectId ? validProjectById(projectId) : null;
    const active = activeProjectReadModel?.project === project ? activeProjectReadModel : null;
    const isValid = () => project && validProjectById(projectId) === project;
    const revisionToken = domains => active && activeProjectReadModel === active && isValid()
        ? [active.fallback, ...domains.map(domain => active.revisions.get(domain) || 0)].join(':')
        : null;
    return Object.freeze({
        projectId: project?.id || '',
        generation: active?.generation ?? null,
        revisionToken,
        read(key, domains, build, variant = [])
        {
            // An obsolete handle cannot read or repopulate a new generation.
            if (!isValid()) return build('');
            const token = revisionToken(domains);
            const perf = typeof appPerf === 'undefined' ? null : appPerf;
            const trace = perf?.currentDetailed();
            if (token === null)
            {
                if (!trace) return build(projectId);
                perf.recordProvider(trace, key, 'uncached');
                const start = perf.now();
                try { return build(projectId); }
                finally { perf.recordProvider(trace, key, 'builds', perf.now() - start); }
            }
            const entry = active.entries.get(key);
            if (entry?.token === token && entry.domains.length === domains.length
                && entry.domains.every((domain, index) => domain === domains[index])
                && entry.variant.length === variant.length
                && entry.variant.every((value, index) => Object.is(value, variant[index])))
            {
                if (trace) perf.recordProvider(trace, key, 'hits');
                return entry.value;
            }
            const start = trace ? perf.now() : 0;
            if (trace) perf.recordProvider(trace, key, 'misses');
            let value;
            try { value = build(projectId); }
            finally { if (trace) perf.recordProvider(trace, key, 'builds', perf.now() - start); }
            active.entries.set(key, { domains, token, variant, value });
            return value;
        }
    });
}

function readOnlyProjectMap(map)
{
    return Object.freeze({
        size: map.size,
        get: key => map.get(key),
        has: key => map.has(key),
        keys: () => map.keys(),
        values: () => map.values()
    });
}
