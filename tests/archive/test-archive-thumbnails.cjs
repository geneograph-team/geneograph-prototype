'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const read = relative => fs.readFileSync(path.join(__dirname, '../../src', relative), 'utf8');
const revoked = [];
const opened = [];
const measurements = [];
const gauges = [];
let activeProject = { id: 'a' };
let nextUrl = 0;
let holdEncode = null;
let blobBytes = 100;
const state = { activeModule: 'Archive' };
const sampleData = { archiveFiles: [] };
class PreviewImage
{
    set src(value)
    {
        if (!value) return;
        opened.push(value);
        this.naturalWidth = value === 'blob:authored-small' ? 120 : value === 'blob:unknown-oversize' ? 9000 : 5600;
        this.naturalHeight = this.naturalWidth;
        Promise.resolve().then(() => value === 'blob:corrupt' ? this.onerror() : this.onload());
    }
    decode() { return Promise.resolve(); }
}
class AssetURL extends URL {}
AssetURL.createObjectURL = () => 'blob:derived-' + ++nextUrl;
AssetURL.revokeObjectURL = url => revoked.push(url);

class PreviewNode
{
    constructor(tag)
    {
        this.tag = tag;
        this.parentNode = null;
        this.children = [];
        this.listeners = {};
        this.isConnected = true;
    }
    querySelector(tag) { return this.children.find(node => node.tag === tag) || null; }
    prepend(node) { this.children.unshift(node); node.parentNode = this; }
    addEventListener(kind, fn) { this.listeners[kind] = fn; }
    removeAttribute(name) { delete this[name]; }
    remove()
    {
        const parent = this.parentNode;
        if (parent) parent.children.splice(parent.children.indexOf(this), 1);
        this.parentNode = null;
    }
    replaceWith(node)
    {
        const parent = this.parentNode;
        if (!parent) return;
        parent.children[parent.children.indexOf(this)] = node;
        node.parentNode = parent;
        this.parentNode = null;
    }
    get img() { return this.querySelector('img'); }
}
class PreviewObserver
{
    constructor(callback) { this.callback = callback; }
    observe() {}
    unobserve() {}
    disconnect() {}
}
const context = vm.createContext({
    state, sampleData, URL: AssetURL, location: { origin: 'http://local', protocol: 'http:' },
    window: { devicePixelRatio: 4 }, prototypeSessionEditRevision: 0,
    validProjectById: id => activeProject.id === id ? activeProject : null,
    currentProjectId: () => activeProject.id, archiveDiagnosticLayout: () => 'icons',
    archiveDiagnosticObserveImage() {}, archiveDiagnosticFinishImage() {},
    archiveImageSource: file => file.assetUrl || file.previewUrl || file.src || file.thumbnailUrl || '',
    archiveImageView: { cache: new Map() },
    requestAnimationFrame: () => 1, cancelAnimationFrame() {},
    Image: PreviewImage, IntersectionObserver: PreviewObserver,
    document: {
        baseURI: 'http://local/index.html',
        createElement(tag)
        {
            if (tag === 'img') return new PreviewNode(tag);
            return {
                getContext: () => ({ drawImage() {} }),
                toBlob(callback)
                {
                    assert.ok(this.width <= 288 && this.height <= 288);
                    if (holdEncode) { holdEncode(callback); return; }
                    callback({ size: blobBytes });
                }
            };
        }
    },
    appPerf: {
        now: () => 0, archiveMetric(layout, key, value) { gauges.push({ layout, key, value }); },
        archiveTaskBegin: () => ({}), archiveTaskValid: () => true,
        archiveTaskFinish(ticket, outcome) { measurements.push(outcome); }
    }
});
vm.runInContext(read('modules/archive/archive-thumbnails.js'), context);
const run = code => vm.runInContext(code, context);
const add = (id, source = 'blob:original-' + id, fields = {}) =>
{
    const file = { id, projectId: activeProject.id, previewUrl: source, sizeBytes: 1000, ...fields };
    sampleData.archiveFiles.push(file);
    return file;
};
const intersect = (element, visible) =>
{
    context.testElement = element;
    context.testVisible = visible;
    run('archiveThumbnailObserver.callback([{ target: testElement, isIntersecting: testVisible }])');
};
const track = (file, layout = 'icons') =>
{
    const element = new PreviewNode('div');
    if (layout === 'image') element.prepend(new PreviewNode('svg'));
    context.testFile = file;
    context.testElement = element;
    context.testLayout = layout;
    run('archiveThumbnailTrack(testElement, testFile, testLayout)');
    return element;
};
const queue = (file, layout = 'icons') =>
{
    const element = track(file, layout);
    intersect(element, true);
    return element;
};
const bound = () =>
{
    assert.ok(run('archiveThumbnailCache.size') <= 100);
    assert.ok(run('archiveThumbnailBytes') <= 4 * 1024 * 1024);
    assert.ok(run('archiveThumbnailMounted.size') <= 100);
};

const runTests = (async () =>
{
    run('archiveThumbnailLifecycle()');
    const file = add('first');
    const tile = queue(file);
    await run('archiveThumbnailRun()');
    assert.match(tile.img.src, /^blob:derived-/);
    const sharedUrl = tile.img.src;
    const strip = queue(file, 'image');
    await run('archiveThumbnailRun()');
    assert.equal(strip.img.src, sharedUrl);
    assert.equal(opened.length, 1);
    intersect(tile, false);
    intersect(strip, false);
    assert.equal(tile.img, null);
    assert.equal(strip.img, null);
    assert.ok(strip.querySelector('svg'), 'filmstrip placeholder must return');
    assert.equal(run('archiveThumbnailMounted.size'), 0);
    assert.equal(revoked.includes(sharedUrl), false);
    intersect(tile, true);
    await run('archiveThumbnailRun()');
    assert.equal(tile.img.src, sharedUrl);
    assert.equal(opened.length, 1);
    // Invalidation detaches any mounted user before revoking the derivative.
    context.testElement = tile;
    run("archiveThumbnailRelease(archiveThumbnailTargets.get(testElement).key, 'icons')");
    assert.equal(tile.img, null);
    assert.ok(revoked.includes(sharedUrl));
    intersect(tile, false);
    intersect(tile, true);
    await run('archiveThumbnailRun()');
    assert.notEqual(tile.img.src, sharedUrl);

    const bad = queue(add('bad', 'blob:corrupt'));
    await run('archiveThumbnailRun()');
    assert.equal(bad.img, null);
    const oversized = queue(add('too-large', 'blob:large', { width: 9000, height: 9000 }));
    await run('archiveThumbnailRun()');
    assert.equal(oversized.img, null);
    assert.equal(opened.includes('blob:large'), false);
    const authored = queue(add('authored', 'blob:huge-original', {
        thumbnailUrl: 'blob:authored-small', width: 9000, height: 9000, sizeBytes: 30 * 1024 * 1024
    }));
    await run('archiveThumbnailRun()');
    assert.match(authored.img.src, /^blob:derived-/);
    assert.ok(opened.includes('blob:authored-small'));
    assert.equal(opened.includes('blob:huge-original'), false);
    const alias = queue(add('alias', 'blob:alias', {
        thumbnailUrl: 'blob:alias', width: 9000, height: 9000
    }));
    await run('archiveThumbnailRun()');
    assert.equal(alias.img, null);
    assert.equal(opened.includes('blob:alias'), false);
    const unknown = queue(add('unknown', 'blob:unknown-oversize'));
    await run('archiveThumbnailRun()');
    assert.equal(unknown.img, null);
    intersect(authored, false);

    // Leave and immediately re-enter while encoding. The old job cannot mount;
    // a new job is queued when it settles, even without another observer event.
    let finishEncode, encoding;
    const reachedEncode = new Promise(resolve => { encoding = resolve; });
    holdEncode = callback => { finishEncode = callback; encoding(); };
    const pending = queue(add('pending'));
    const job = run('archiveThumbnailRun()');
    await reachedEncode;
    intersect(pending, false);
    intersect(pending, true);
    finishEncode({ size: 100 });
    await job;
    assert.equal(pending.img, null);
    assert.equal(measurements.at(-1), 'canceled');
    holdEncode = null;
    await run('archiveThumbnailRun()');
    assert.match(pending.img.src, /^blob:derived-/);
    intersect(pending, false);

    const reachedSwitch = new Promise(resolve => { encoding = resolve; });
    holdEncode = callback => { finishEncode = callback; encoding(); };
    const obsolete = queue(add('obsolete'));
    const oldJob = run('archiveThumbnailRun()');
    await reachedSwitch;
    const oldObserver = run('archiveThumbnailObserver');
    activeProject = { id: 'b' };
    run('archiveThumbnailLifecycle()');
    finishEncode({ size: 100 });
    await oldJob;
    assert.equal(obsolete.img, null);
    assert.equal(measurements.at(-1), 'canceled');
    assert.equal(run('archiveThumbnailCache.size'), 0);
    assert.equal(run('archiveThumbnailMounted.size'), 0);
    assert.equal(tile.img, null);

    holdEncode = null;
    // Scroll beyond the entire cache budget; old shells remain, not old images.
    const tiles = [];
    for (let index = 0; index < 125; index++)
    {
        const item = add('bound-' + index);
        const element = queue(item);
        tiles.push({ item, element, url: null });
        await run('archiveThumbnailRun()');
        tiles[index].url = element.img.src;
        bound();
        if (index >= 8) intersect(tiles[index - 8].element, false);
    }
    assert.equal(run('archiveThumbnailMounted.size'), 8);
    assert.equal(run('archiveThumbnailCache.size'), 100);
    assert.equal(run('archiveThumbnailBytes'), 10000);
    assert.equal(tiles.filter(item => item.element.img).length, 8);
    assert.ok(revoked.includes(tiles[0].url));
    assert.ok(!tiles[0].element.img);
    intersect(tiles[0].element, true);
    await run('archiveThumbnailRun()');
    assert.notEqual(tiles[0].element.img.src, tiles[0].url);
    assert.equal(run('archiveThumbnailMounted.size'), 9);
    // A stale callback from a disposed observer cannot hide the new element.
    oldObserver.callback([{ target: tiles[0].element, isIntersecting: false }]);
    assert.ok(tiles[0].element.img);
    const replaced = tiles.at(-1);
    const retired = replaced.element.img.src;
    replaced.item.previewUrl = 'blob:replacement';
    run('prototypeSessionEditRevision++; archiveThumbnailLifecycle()');
    assert.equal(replaced.element.img, null);
    assert.ok(revoked.includes(retired));
    intersect(replaced.element, true);
    await run('archiveThumbnailRun()');
    assert.match(replaced.element.img.src, /^blob:derived-/);
    assert.notEqual(replaced.element.img.src, retired);
    // Derived load failure also restores the placeholder and releases the lease.
    const failedUrl = replaced.element.img.src;
    replaced.element.img.listeners.error();
    assert.equal(replaced.element.img, null);
    assert.ok(revoked.includes(failedUrl));
    bound();

    // More intersecting targets than the hard cap: protect mounted URLs and
    // admit the next waiting target when a slot becomes available.
    run('archiveThumbnailUnmount()');
    const crowded = [];
    for (let index = 0; index < 101; index++)
    {
        const element = queue(add('crowded-' + index));
        crowded.push(element);
        await run('archiveThumbnailRun()');
        bound();
    }
    assert.equal(run('archiveThumbnailMounted.size'), 100);
    assert.equal(crowded[100].img, null);
    assert.ok(crowded[0].img);
    assert.equal(revoked.includes(crowded[0].img.src), false);
    intersect(crowded[0], false);
    await run('archiveThumbnailRun()');
    assert.ok(crowded[100].img);
    assert.equal(run('archiveThumbnailMounted.size'), 100);
    bound();

    // Byte pressure can block a job before the element-count cap is reached.
    state.activeModule = 'People';
    run('archiveThumbnailLifecycle()');
    assert.equal(run('archiveThumbnailCache.size'), 0);
    assert.equal(run('archiveThumbnailMounted.size'), 0);
    state.activeModule = 'Archive';
    run('archiveThumbnailLifecycle()');
    blobBytes = 3 * 1024 * 1024;
    const largeA = queue(add('large-derivative-a'));
    await run('archiveThumbnailRun()');
    const largeB = queue(add('large-derivative-b'));
    await run('archiveThumbnailRun()');
    assert.ok(largeA.img);
    assert.equal(largeB.img, null);
    bound();
    intersect(largeA, false);
    await run('archiveThumbnailRun()');
    assert.ok(largeB.img);
    bound();
    state.activeModule = 'People';
    run('archiveThumbnailLifecycle()');
    assert.equal(run('archiveThumbnailCache.size'), 0);
    assert.equal(run('archiveThumbnailBytes'), 0);
    assert.equal(run('archiveThumbnailMounted.size'), 0);
    assert.equal(run('archiveThumbnailLeases.size'), 0);
    assert.ok(revoked.every(url => url.startsWith('blob:derived-')));
    assert.equal(new Set(revoked).size, revoked.length, 'owned URLs revoked once');
    assert.ok(gauges.some(metric => metric.key === 'mountedPreviews' && metric.value === 100));
    console.log('Archive thumbnails: viewport detach/re-entry, leased eviction, source budgets, cancellation, replacement, cache/element caps and URL ownership passed.');
})().catch(error =>
{
    console.error(error);
    process.exitCode = 1;
});
