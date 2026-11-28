'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
let clock = 100;
const context = vm.createContext({ assert, performance: { now: () => clock }, advance: ms => { clock += ms; }, console });
for (const file of ['core/application-performance.js', 'modules/family-tree/tree-performance.js'])
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../../src', file), 'utf8'), context);
vm.runInContext("const recorder = appPerf;\nassert.equal(recorder.begin('Projects', 'render'), null);\nassert.equal(recorder.run('People', 'render', () => 9), 9);\nassert.equal(recorder.configure({ scope: 'selected', modules: ['People', 'Family Tree', 'private'], mode: 'basic' }), true);\nassert.equal(recorder.start(), true);\nassert.equal(recorder.configure({ mode: 'detailed' }), false);\nassert.equal(recorder.begin('Places', 'render'), null);\nassert.equal(recorder.begin('People', 'private-name'), null);\nassert.equal(recorder.run('People', 'render', () => { advance(12); return 'private-data'; }), 'private-data');\nconst basic = treePerf.begin('private-project', 'focus', { ancestorGenerations: 5 });\ntreePerf.count(basic, 'cards', 10);\ntreePerf.measure(basic, 'people', () => advance(8));\ntreePerf.finish(basic, 'completed');\nconst pending = treePerf.begin('other-project', 'render', {});\nrecorder.stop();\nlet snapshot = recorder.snapshot();\nassert.equal(snapshot.schemaVersion, 3);\nassert.equal(snapshot.samples.length, 3);\nassert.equal(snapshot.samples[0].totalMs, 12);\nassert.equal(snapshot.samples[1].totalMs, 8);\nassert.equal(snapshot.samples[1].counts, undefined);\nassert.equal(snapshot.samples[2].status, 'stopped');\nassert.equal(recorder.configure({ scope: 'all', mode: 'detailed' }), true);\nrecorder.start();\ntreePerf.finish(pending, 'completed');\nconst tree = treePerf.begin('another-private-project', 'focus', { ancestorGenerations: 5 });\ntreePerf.count(tree, 'cards', 42);\ntreePerf.count(tree, 'private-person', 999);\ntreePerf.span(tree, 'people', 3);\ntreePerf.span(tree, 'private-place', 7);\ntreePerf.pass(tree, { solverMs: 5, privateValue: 'private-data' });\ntreePerf.finish(tree, 'completed');\nassert.throws(() => recorder.run('Projects', 'gedcomParse', () => { throw Error('private-error'); }), /private-error/);\nassert.equal(recorder.run('Projects', 'activation', () => false), false);\nsnapshot = recorder.snapshot();\nassert.equal(snapshot.samples[2].status, 'stopped');\nassert.equal(snapshot.samples[3].counts.cards, 42);\nassert.equal(snapshot.samples[4].status, 'failed');\nassert.equal(snapshot.samples[5].status, 'failed');\nassert.equal(JSON.stringify(snapshot).includes('private'), false);\nfor (let i = 0; i < 260; i++) recorder.run('Notes', 'render', () => advance(1));\nassert.equal(recorder.status().count, 256);\nassert.equal(recorder.status().dropped, 10);\nrecorder.clear();\nassert.equal(recorder.status().active, false);\nassert.equal(recorder.status().count, 0);\nassert.equal(recorder.configure({ scope: 'selected', modules: [] }), true);\nassert.equal(recorder.start(), false);\nconsole.log('Application diagnostics: scope, modes, lifecycle, timing, privacy and capacity passed.');\n", context);

const providerContext = vm.createContext({
    assert, console, performance: { now: () => clock },
    advance: ms => { clock += ms; },
    state: { activeModule: 'People' },
    project: { id: 'private-project' },
    validProjectById: id => id === 'private-project' ? providerContext.project : null
});
for (const file of ['core/application-performance.js', 'core/project-read-model.js'])
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../../src', file), 'utf8'), providerContext);

vm.runInContext(`
let scheduled, callback, disconnected = 0, requested = 0;
requestAnimationFrame = fn => { scheduled = fn; return ++requested; };
cancelAnimationFrame = () => { scheduled = null; };
PerformanceObserver = class
{
    static supportedEntryTypes = ['longtask'];
    constructor(fn) { callback = fn; }
    observe() {}
    takeRecords() { return []; }
    disconnect() { disconnected++; }
};
const provider = context => context.read('people:index', ['people'], () => { advance(3); return {}; });
setProjectReadModelActive(project.id);
const read = acquireProjectReadModel(project.id);
provider(read);
assert.equal(requested, 0);
appPerf.start();
const cold = appPerf.run('People', 'render', () =>
{
    invalidateProjectReadModel(project.id, ['people']);
    return provider(read);
});
appPerf.run('People', 'render', () =>
{
    invalidateProjectReadModel(project.id, ['notes']);
    assert.equal(provider(read), cold);
    appPerf.run('People', 'profile', () =>
    {
        assert.equal(provider(read), cold);
        appPerf.count(appPerf.currentDetailed('People'), 'recordsPrepared', 1);
    });
});
advance(9);
scheduled();
const pending = appPerf.begin('Places', 'mapInitialize', null, 'asynchronous');
appPerf.measure(pending, 'mapSetup', () => advance(5));
advance(20);
appPerf.finish(pending, 'completed');
const canceled = appPerf.begin('Places', 'mapInitialize', null, 'asynchronous');
appPerf.finish(canceled, 'canceled');
const stopped = appPerf.begin('Places', 'mapInitialize', null, 'asynchronous');
callback({ getEntries: () => [
    { entryType: 'longtask', startTime: performance.now(), duration: 54, name: 'private-task' },
    { entryType: 'longtask', startTime: 0, duration: 90 }
] });
disposeProjectReadModel();
appPerf.stop();
const data = appPerf.snapshot();
assert.equal(data.samples[0].providers['people:index'].buildMs, 3);
assert.equal(data.samples[1].providers['people:index'].hits, 1);
assert.equal(data.samples[2].parentSeq, data.samples[1].seq);
assert.equal(data.samples[2].milestones.frameOpportunity, 9);
assert.equal(data.samples[3].timing, 'asynchronous');
assert.equal(data.samples[3].totalMs, 25);
assert.equal(data.samples[3].stages.mapSetup.ms, 5);
assert.equal(data.samples[4].status, 'canceled');
assert.equal(data.samples[5].status, 'stopped');
assert.equal(data.readModelLifecycle.revisedDomains.people, 1);
assert.equal(data.readModelLifecycle.revisedDomains.notes, 1);
assert.equal(data.readModelLifecycle.evictedEntries, 1);
assert.equal(data.readModelLifecycle.disposals, 1);
assert.equal(data.browser.longTasks.count, 1);
assert.equal(data.browser.longTasks.totalMs, 54);
assert.equal(disconnected, 1);
assert.equal(JSON.stringify(data).includes('private'), false);
appPerf.clear();
appPerf.configure({ scope: 'selected', modules: ['People'], mode: 'detailed' });
appPerf.start();
assert.equal(appPerf.snapshot().browser.longTasks.status, 'outOfScope');
appPerf.finish(stopped, 'completed');
assert.equal(appPerf.snapshot().samples.length, 0);
appPerf.clear();
PerformanceObserver = undefined;
appPerf.configure({ scope: 'all' });
appPerf.start();
assert.equal(appPerf.snapshot().browser.longTasks.status, 'unsupported');
const evicted = appPerf.begin('Places', 'mapInitialize', null, 'asynchronous');
for (let index = 0; index < 256; index++) appPerf.run('Notes', 'render', () => advance(1));
appPerf.finish(evicted, 'completed');
assert.equal(appPerf.snapshot().dropped, 1);
assert.equal(appPerf.snapshot().samples.some(sample => sample.seq === evicted.seq), false);
assert.equal(evicted.status, 'pending');
appPerf.stop();
console.log('Application diagnostics: real provider adapter, causality, frame, async and long-task fallback passed.');
`, providerContext);


vm.runInContext(`
appPerf.clear();
appPerf.configure({ scope: 'all', mode: 'detailed' });
let currentObserver;
let queued = [];
PerformanceObserver = class
{
    static supportedEntryTypes = ['longtask'];
    constructor(callback) { this.callback = callback; currentObserver = this; }
    observe() {}
    takeRecords() { return queued.splice(0); }
    disconnect() {}
};
appPerf.start();
const oldObserver = currentObserver;
const oldThreshold = performance.now();
advance(80);
queued = [
    { entryType: 'longtask', startTime: oldThreshold - 1, duration: 60 },
    { entryType: 'longtask', startTime: oldThreshold, duration: 75 }
];
appPerf.run('People', 'profile', () => null);
const oldFrame = scheduled;
appPerf.stop();
const firstSummary = appPerf.snapshot();
assert.equal(firstSummary.browser.longTasks.count, 1);
assert.equal(firstSummary.browser.longTasks.totalMs, 75);
assert.equal(firstSummary.summaryCoverage.recording, firstSummary.samples[0].recording);
assert.equal(firstSummary.summaryCoverage.readModelLifecycle, 'recorded');
assert.equal(firstSummary.summaryCoverage.configuration.mode, 'detailed');

appPerf.configure({ scope: 'selected', modules: ['People'], mode: 'basic' });
const stoppedExport = appPerf.snapshot();
assert.equal(stoppedExport.configuration.mode, 'basic');
assert.equal(stoppedExport.summaryCoverage.configuration.mode, 'detailed');
assert.equal(stoppedExport.summaryCoverage.historicalSummaries, 'unavailable');
appPerf.start();
appPerf.run('People', 'profile', () => null);
oldObserver.callback({getEntries: () => [{entryType: 'longtask', startTime: performance.now(), duration: 100}]});
oldFrame();
const mixed = appPerf.snapshot();
assert.equal(mixed.samples.length, 2);
assert.notEqual(mixed.samples[0].recording, mixed.summaryCoverage.recording);
assert.equal(mixed.samples[1].recording, mixed.summaryCoverage.recording);
assert.equal(mixed.browser.longTasks.status, 'basic');
assert.equal(mixed.browser.longTasks.count, undefined);
assert.equal(mixed.summaryCoverage.readModelLifecycle, 'outOfScope');
appPerf.stop();

appPerf.configure({ scope: 'all', mode: 'detailed' });
appPerf.start();
appPerf.run('People', 'profile', () => null);
const newFrame = scheduled;
oldFrame();
appPerf.run('People', 'profile', () => null);
assert.equal(scheduled, newFrame, 'stale callback must not clear newer pending frame');
oldObserver.callback({getEntries: () => [{entryType: 'longtask', startTime: performance.now(), duration: 100}]});
assert.equal(appPerf.snapshot().browser.longTasks.count, 0);
appPerf.clear();
assert.equal(appPerf.snapshot().summaryCoverage, null);
assert.equal(appPerf.snapshot().browser.longTasks.status, 'inactive');
assert.equal(appPerf.snapshot().samples.length, 0);
`, providerContext);
console.log('Diagnostics: mixed epochs, queued long tasks, stale callbacks and Clear passed.');


// UI workflow and additive Archive schema-3 evidence.
const workflowContext = vm.createContext({
    assert, console, performance: { now: () => clock }, advance: ms => { clock += ms; },
    Blob: class {}, URL: { createObjectURL: () => 'blob:test', revokeObjectURL() {} },
    setTimeout: fn => fn(), document: { body: { append() {} }, createElement: () => ({ click() {}, remove() {} }) },
    state: { activeModule: 'People', archiveView: 'files', archiveFileLayout: 'tiles' },
    matchMedia: () => ({ matches: false }), cancelAnimationFrame() {},
    t: text => text, escapeHtml: text => text, icon: { play: '', stopSquare: '', download: '', trash: '', check: '', chevron: '' }
});
for (const file of ['core/application-performance.js', 'modules/archive/archive-diagnostics.js'])
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../../src', file), 'utf8'), workflowContext);
const shellSource = fs.readFileSync(path.join(__dirname, '../../src/core/app-shell.js'), 'utf8');
vm.runInContext(shellSource.slice(shellSource.indexOf('function diagnosticsView(')), workflowContext);
vm.runInContext(`
assert.equal(appPerf.settings().modules.length, 0);
assert.equal(diagnosticsView(appPerf.status(), appPerf.settings()).heading, 'Ready to record');
assert.equal((diagnosticsSettingsMarkup().match(/data-diagnostics-module value=/g) || []).length, 8);
assert.equal(diagnosticsSettingsMarkup().includes('value="Publish"'), false);
assert.equal(diagnosticsSettingsMarkup().includes('<legend>'), false);
assert.equal(diagnosticsSettingsMarkup().includes('aria-label="Selected modules"'), true);
assert.equal(diagnosticsSettingsMarkup().includes('aria-describedby="diagnosticsModeDescription"'), true);
assert.equal(diagnosticsSettingsMarkup().includes('Operation durations, outcomes, available stage timings and counters.'), true);
assert.equal(diagnosticsSettingsMarkup().includes('Also includes available stage timings and counters.'), false);
assert.equal(diagnosticsSettingsMarkup().includes('diagnostics-explanation'), false);
assert.equal(diagnosticsModeDescription('basic'), 'Operation durations and outcomes.');
assert.equal(appPerf.modules.includes('Publish'), true);
appPerf.configure({ scope: 'selected', modules: ['Publish'] });
assert.equal(appPerf.settings().modules.length, 0);
assert.equal(appPerf.start(), false);
appPerf.configure({ scope: 'selected', modules: [] });
assert.equal(diagnosticsStartFresh(appPerf.status().recording), false);
appPerf.configure({ modules: ['Archive'] });
assert.equal(diagnosticsStartFresh(appPerf.status().recording), true);
assert.equal(appPerf.download(), false);
appPerf.run('Archive', 'layoutSwitch', () =>
{
    const trace = appPerf.currentDetailed('Archive');
    appPerf.archiveContext(trace, 'icons', 'desktop', 'full');
    appPerf.count(trace, 'archiveResultFiles', 665);
    appPerf.count(trace, 'archiveMountedTiles', 665);
    appPerf.span(trace, 'domReplace', 7);
});
const load = appPerf.archiveTaskBegin('icons', 'tileLoad', 'preview');
advance(9);
appPerf.archiveTaskFinish(load, 'completed', 4000, 3000);
appPerf.archiveTaskFinish(load, 'completed', 1, 1);
assert.equal(appPerf.archiveTaskBegin('private-layout', 'tileLoad', 'preview'), null);
assert.equal(appPerf.archiveTaskBegin('icons', 'private-task', 'preview'), null);
appPerf.archiveMetric('icons', 'private-key', 100);
appPerf.archiveMetric('icons', 'pendingJobs', 3);
appPerf.archiveMetric('icons', 'pendingJobs', 1);
const obsolete = appPerf.archiveTaskBegin('icons', 'tileLoad', 'thumbnail');
const mockImage = () => ({
    complete: false, isConnected: true, naturalWidth: 500, naturalHeight: 300,
    getAttribute: () => 'private-url', listeners: {},
    addEventListener(kind, fn) { this.listeners[kind] = fn; },
    removeEventListener(kind) { delete this.listeners[kind]; }
});
const loaded = mockImage(), pendingImage = mockImage(), failed = mockImage();
archiveDiagnosticObserveImage(loaded, 'icons', 'tileLoad', 'thumbnail');
archiveDiagnosticObserveImage(pendingImage, 'icons', 'tileLoad', 'thumbnail');
archiveDiagnosticObserveImage(failed, 'icons', 'tileLoad', 'thumbnail');
loaded.listeners.load();
failed.listeners.error();
assert.equal(archiveDiagnosticImages.size, 1);
state.activeModule = 'Archive';
let executions = 0;
archiveDiagnosticCoalesced('scroll', () => executions++);
archiveDiagnosticCoalesced('scroll', () => executions++);
advance(121);
archiveDiagnosticCoalesced('scroll', () => executions++);
assert.equal(executions, 3);
state.activeModule = 'People';
appPerf.stop();
let data = appPerf.snapshot();
assert.equal(archiveDiagnosticImages.size, 0);
assert.equal(data.schemaVersion, 3);
assert.equal(data.samples[0].archiveLayout, 'icons');
assert.equal(data.samples[0].counts.archiveResultFiles, 665);
assert.equal(data.samples.filter(sample => sample.kind === 'scroll').length, 2);
assert.equal(data.archivePerformance.recording, data.summaryCoverage.recording);
assert.equal(data.archivePerformance.layouts.icons.tasks.tileLoad.preview.completed, 1);
assert.equal(data.archivePerformance.layouts.icons.tasks.tileLoad.preview.maxObservedPixels, 12000000);
assert.equal(data.archivePerformance.layouts.icons.tasks.tileLoad.thumbnail.completed, 1);
assert.equal(data.archivePerformance.layouts.icons.tasks.tileLoad.thumbnail.failed, 1);
assert.equal(data.archivePerformance.layouts.icons.tasks.tileLoad.thumbnail.canceled, 1);
assert.equal(data.archivePerformance.layouts.icons.tasks.tileLoad.thumbnail.pending, 1);
assert.equal(data.archivePerformance.layouts.icons.gauges.pendingJobs.max, 3);
assert.equal(data.archivePerformance.layouts.icons.gauges.pendingJobs.last, 1);
assert.equal(data.browser.longTasks.status, 'outOfScope');
assert.equal(JSON.stringify(data).includes('private'), false);
assert.equal(diagnosticsView(appPerf.status(), appPerf.settings()).confirmNew, true);
const recording = appPerf.status().recording;
assert.equal(diagnosticsStartFresh(recording), false);
assert.equal(appPerf.status().count, 3);
assert.equal(appPerf.download(), true);
assert.equal(appPerf.status().exported, true);
assert.equal(diagnosticsView(appPerf.status(), appPerf.settings()).heading, 'Recording exported');
appPerf.configure({ modules: [] });
assert.equal(diagnosticsStartFresh(recording), false);
assert.equal(appPerf.status().count, 3);
appPerf.configure({ modules: ['Archive'] });
assert.equal(diagnosticsStartFresh(recording), true);
appPerf.archiveTaskFinish(obsolete, 'completed', 1, 1);
assert.equal(Object.keys(appPerf.snapshot().archivePerformance.layouts).length, 0);
assert.equal(appPerf.status().count, 0);
appPerf.stop();
assert.equal(appPerf.status().emptyStop, true);
appPerf.configure({ mode: 'basic' });
appPerf.start();
assert.equal(appPerf.archiveTaskBegin('icons', 'tileLoad', 'preview'), null);
assert.equal(appPerf.snapshot().archivePerformance, undefined);
appPerf.stop();
appPerf.clear();
appPerf.configure({ scope: 'selected', mode: 'detailed', modules: ['People'] });
appPerf.start();
assert.equal(appPerf.archiveTaskBegin('icons', 'tileLoad', 'preview'), null);
assert.equal(appPerf.snapshot().archivePerformance, undefined);
appPerf.stop();
appPerf.clear();
appPerf.configure({ scope: 'all', mode: 'detailed', modules: [] });
appPerf.start();
assert.equal(appPerf.enabled('People'), true);
appPerf.run('Archive', 'render', () => null);
appPerf.stop();
const oldDocument = document.createElement;
document.createElement = () => ({ click() { throw Error('download failed'); }, remove() {} });
assert.equal(appPerf.download(), false);
assert.equal(appPerf.status().exported, false);
document.createElement = oldDocument;
assert.equal(diagnosticsStartFresh(appPerf.status().recording, true), true);
assert.equal(appPerf.status().count, 0);
appPerf.stop();
appPerf.clear();
console.log('Diagnostics workflow and Archive epoch/allowlist regression passed.');
`, workflowContext);

const panelContext = vm.createContext({
    assert, performance: { now: () => clock }, t: text => text, escapeHtml: text => text,
    icon: { play: '', stopSquare: '', download: '', trash: '', check: '', chevron: '' },
    console, setInterval: () => 1, clearInterval() {}, requestAnimationFrame: () => 1, cancelAnimationFrame() {},
    Blob: class {}, URL: { createObjectURL: () => 'blob:test', revokeObjectURL() {} },
    setTimeout: fn => fn(), document: { body: { append() {} }, createElement: () => ({ click() {}, remove() {} }) },
    syncDiagnosticsTopbar() {}, showToast() {}, openNestedModal() {}, closeModal() {}
});
vm.runInContext(fs.readFileSync(path.join(__dirname, '../../src/core/application-performance.js'), 'utf8'), panelContext);
vm.runInContext(shellSource.slice(shellSource.indexOf('function diagnosticsView(')), panelContext);
vm.runInContext(`
function node(value = '')
{
    return {
        value, textContent: '', innerHTML: '', dataset: {}, isConnected: true, listeners: {},
        classList: { toggle() {}, contains: () => true },
        addEventListener(kind, fn) { this.listeners[kind] = fn; },
        focus() {}
    };
}
const elements = new Map();
const get = selector =>
{
    if (!elements.has(selector)) elements.set(selector, node());
    return elements.get(selector);
};
const modules = appPerf.selectableModules.map(node);
const panel = { isConnected: true, querySelector: get, querySelectorAll: () => modules };
const root = { classList: { contains: () => true }, querySelector: () => panel };
const modalBackdrop = { querySelector: () => get('[data-diagnostics-confirm]') };
const click = selector => get(selector).listeners.click();
const change = selector => get(selector).listeners.change();
const button = name => get('[data-performance-' + name + ']');
bindDiagnosticsSettings(root);
assert.equal(get('#diagnosticsModeDescription').textContent, 'Operation durations, outcomes, available stage timings and counters.');
get('#diagnosticsMode').value = 'basic';
change('#diagnosticsMode');
assert.equal(get('#diagnosticsModeDescription').textContent, 'Operation durations and outcomes.');
get('#diagnosticsMode').value = 'detailed';
change('#diagnosticsMode');
assert.equal(get('#diagnosticsModeDescription').textContent, 'Operation durations, outcomes, available stage timings and counters.');
assert.equal(button('start').hidden, false);
assert.equal(button('export').hidden, true);
assert.equal(get('[data-performance-metrics]').hidden, true);
get('#diagnosticsScope').value = 'selected';
change('#diagnosticsScope');
assert.equal(button('start').disabled, true);
assert.equal(get('[data-diagnostics-hint]').hidden, false);
click('[data-diagnostics-all]');
assert.equal(appPerf.settings().modules.length, 8);
assert.equal(appPerf.settings().modules.includes('Publish'), false);
assert.equal(get('[data-diagnostics-all]').disabled, true);
assert.equal(get('[data-diagnostics-hint]').hidden, true);
click('[data-diagnostics-none]');
assert.equal(appPerf.settings().modules.length, 0);
assert.equal(button('start').disabled, true);
get('#diagnosticsScope').value = 'all';
change('#diagnosticsScope');
click('[data-performance-start]');
assert.equal(appPerf.status().active, true);
assert.equal(button('stop').hidden, false);
assert.equal(button('export').hidden, true);
assert.equal(get('[data-diagnostics-modules]').disabled, true);
appPerf.run('Archive', 'render', () => null);
click('[data-performance-stop]');
assert.equal(button('export').hidden, false);
assert.equal(button('new').hidden, false);
assert.equal(button('clear').hidden, false);
assert.equal(get('[data-performance-drop-metric]').hidden, false);
click('[data-performance-new]');
assert.equal(appPerf.status().count, 1, 'Opening confirmation must not clear the recording');
assert.equal(appPerf.status().active, false);
click('[data-diagnostics-confirm]');
assert.equal(appPerf.status().count, 0);
assert.equal(appPerf.status().active, true);
appPerf.run('Archive', 'render', () => null);
click('[data-performance-stop]');
click('[data-performance-export]');
assert.equal(appPerf.status().exported, true);
assert.equal(get('[data-performance-status]').textContent, 'Recording exported');
click('[data-performance-clear]');
assert.equal(appPerf.status().count, 1);
click('[data-diagnostics-confirm]');
assert.equal(appPerf.status().count, 0);
assert.equal(button('start').hidden, false);
assert.equal(button('export').hidden, true);
console.log('Diagnostics panel bindings: ready/active/results, selection, confirmation and export passed with test doubles.');
`, panelContext);
