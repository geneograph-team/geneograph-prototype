// Tree instrumentation delegates to the one application recording session.
// The project argument is intentionally ignored; it never reaches the recorder.
const treePerf = {
    begin(_projectId, kind, view) { return appPerf.begin('Family Tree', kind, view); },
    measure: appPerf.measure, span: appPerf.span, count: appPerf.count,
    mark: appPerf.mark, pass: appPerf.pass, finish: appPerf.finish,
    valid: appPerf.valid, now: appPerf.now, kind: appPerf.kind, cache: appPerf.cache
};
