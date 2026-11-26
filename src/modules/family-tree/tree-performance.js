// Local, opt-in diagnostic data only. Never serialize a model, DOM node or request key.
const treePerf = (() =>
{
    const limit = 256;
    const kinds = new Set(['focus', 'selection', 'orientation', 'depth', 'render', 'zoom', 'pan']);
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
    let session = null, epoch = 0;
    const now = () => performance.now();
    const round = n => Math.round(n * 1000) / 1000;
    const valid = trace => !!trace && !!session?.active && trace.epoch === session.epoch;
    function finish(trace, status)
    {
        if (!valid(trace) || trace.status !== 'pending' || !statuses.has(status)) return;
        trace.status = status;
        trace.totalMs = round(now() - session.start - trace.atMs);
    }
    function stop()
    {
        if (!session?.active) return;
        for (const trace of session.samples) finish(trace, 'stopped');
        session.active = false;
    }
    function project(id)
    {
        if (session && session.project !== id)
        {
            stop();
            session = null;
        }
    }
    function start(id)
    {
        project(id);
        if (!id || session?.active) return;
        if (!session) session = { project: id, start: now(), samples: [], dropped: 0, next: 0 };
        session.epoch = ++epoch;
        session.active = true;
    }
    function clear(id)
    {
        const active = session?.project === id && session.active;
        stop();
        session = null;
        if (active) start(id);
    }
    function begin(id, kind, view)
    {
        if (!session?.active || session.project !== id || !kinds.has(kind)) return null;
        const trace = { epoch: session.epoch, seq: ++session.next, kind, atMs: round(now() - session.start),
            status: 'pending', stages: {}, counts: {}, passTimings: [], milestones: {} };
        if (view)
        {
            trace.orientation = view.orientation === 'horizontal' ? 'horizontal' : 'vertical';
            if (Number.isInteger(view.ancestorGenerations)) trace.ancestorDepth = view.ancestorGenerations;
            if (Number.isInteger(view.descendantGenerations)) trace.descendantDepth = view.descendantGenerations;
            trace.cousins = Boolean(view.showCousins);
        }
        session.samples.push(trace);
        if (session.samples.length > limit)
        {
            session.samples.shift();
            session.dropped++;
        }
        return trace;
    }
    function span(trace, stage, ms)
    {
        if (!valid(trace) || !stages.has(stage) || !Number.isFinite(ms) || ms < 0) return;
        const item = trace.stages[stage] ||= { ms: 0, calls: 0 };
        item.ms = round(item.ms + ms);
        item.calls++;
    }
    function measure(trace, stage, fn)
    {
        if (!valid(trace)) return fn();
        const start = now();
        try { return fn(); }
        finally { span(trace, stage, now() - start); }
    }
    function count(trace, key, value, add = false)
    {
        if (!valid(trace) || !metrics.has(key) || !Number.isFinite(value) || value < 0) return;
        trace.counts[key] = add ? (trace.counts[key] || 0) + Math.floor(value) : Math.floor(value);
    }
    function mark(trace, key)
    {
        if (!valid(trace) || !['pendingFeedback', 'scenePublished', 'frameOpportunity'].includes(key)) return;
        trace.milestones[key] ??= round(now() - session.start - trace.atMs);
    }
    function pass(trace, values)
    {
        if (!valid(trace) || trace.passTimings.length >= 2) return;
        const entry = {};
        for (const field of passFields)
            if (Number.isFinite(values[field]) && values[field] >= 0) entry[field] = round(values[field]);
        trace.passTimings.push(entry);
    }
    function snapshot()
    {
        // Explicit schema projection: the private project key and epoch never leave memory.
        return { schemaVersion: 1, recorder: 'geneograph-tree-performance', elkVersion: '0.12.1',
            active: Boolean(session?.active), capacity: limit, dropped: session?.dropped || 0,
            totalOperations: session?.next || 0, samples: (session?.samples || []).map(trace =>
            ({
                seq: trace.seq, kind: trace.kind, atMs: trace.atMs, status: trace.status, totalMs: trace.totalMs,
                orientation: trace.orientation, ancestorDepth: trace.ancestorDepth, descendantDepth: trace.descendantDepth,
                cousins: trace.cousins, cache: trace.cache, stages: trace.stages, counts: trace.counts,
                passTimings: trace.passTimings, milestones: trace.milestones
            })) };
    }
    function download()
    {
        const url = URL.createObjectURL(new Blob([JSON.stringify(snapshot(), null, 2)], { type: 'application/json' }));
        const link = document.createElement('a');
        link.href = url;
        link.download = 'geneograph-tree-performance.json';
        document.body.append(link);
        try { link.click(); }
        finally { link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
    }
    return { start, stop, clear, project, begin, measure, span, count, mark, pass, finish, snapshot, download,
        valid, now, kind(trace, kind) { if (valid(trace) && kinds.has(kind)) trace.kind = kind; },
        cache(trace, value) { if (valid(trace) && ['hit', 'miss', 'pending'].includes(value)) trace.cache = value; },
        status() { return { active: Boolean(session?.active), count: session?.samples.length || 0 }; } };
})();

function treePerformanceSettingsMarkup()
{
    return `<details class="tree-branch-settings" data-tree-performance>
      <summary>${escapeHtml(t('Performance recording'))}</summary>
      <p class="field-help">${escapeHtml(t('Record anonymous Tree timings locally. Export manually; no genealogy data is included.'))}</p>
      <p role="status" data-performance-status></p>
      <div class="tree-color-channels">
        <button class="button secondary" type="button" data-performance-toggle></button>
        <button class="button secondary" type="button" data-performance-clear>${escapeHtml(t('Clear recording'))}</button>
        <button class="button secondary" type="button" data-performance-export>${escapeHtml(t('Export recording'))}</button>
      </div>
    </details>`;
}

function bindTreePerformanceSettings(root, projectId)
{
    const section = root.querySelector('[data-tree-performance]');
    if (!section) return;
    treePerf.project(projectId);
    const toggle = section.querySelector('[data-performance-toggle]');
    const clear = section.querySelector('[data-performance-clear]');
    const exportButton = section.querySelector('[data-performance-export]');
    const update = () =>
    {
        const status = treePerf.status();
        toggle.textContent = t(status.active ? 'Stop recording' : 'Start recording');
        section.querySelector('[data-performance-status]').textContent =
            t(status.active ? 'Recording active' : 'Recording stopped') + ' · ' + status.count;
        clear.disabled = !status.count;
        exportButton.disabled = !status.count;
    };
    toggle.addEventListener('click', () =>
    {
        if (treePerf.status().active) treePerf.stop();
        else treePerf.start(projectId);
        update();
    });
    clear.addEventListener('click', () => { treePerf.clear(projectId); update(); });
    exportButton.addEventListener('click', () => treePerf.download());
    update();
}
