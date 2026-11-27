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

