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
const state = { activeModule: 'Archive', archiveView: 'files', archiveSelectedFolderId: 'folder-a' };
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
                    const limit = state.activeModule === 'Albums' ? 384 : 288;
                    assert.ok(this.width <= limit && this.height <= limit);
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
vm.runInContext(read('shared/media-previews.js'), context);
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
    run('archivePreviewRuntime.observer.callback([{ target: testElement, isIntersecting: testVisible }])');
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
    assert.ok(run('archivePreviewRuntime.cache.size') <= 256);
    assert.ok(run('archivePreviewRuntime.bytes') <= 4 * 1024 * 1024);
    assert.ok(run('archivePreviewRuntime.mounted.size') <= 100);
};

const runTests = (async () =>
{
    run('archiveThumbnailLifecycle()');
    const file = add('first');
    const tile = queue(file);
    await run('archivePreviewRuntime.run()');
    assert.match(tile.img.src, /^blob:derived-/);
    const sharedUrl = tile.img.src;
    const strip = queue(file, 'image');
    await run('archivePreviewRuntime.run()');
    assert.equal(strip.img.src, sharedUrl);
    assert.equal(opened.length, 1);
    const originalTileImage = tile.img, originalStripImage = strip.img;
    intersect(tile, false);
    intersect(strip, false);
    assert.equal(tile.img, originalTileImage);
    assert.equal(strip.img, originalStripImage);
    assert.equal(run('archivePreviewRuntime.mounted.size'), 2);
    assert.equal(revoked.includes(sharedUrl), false);
    intersect(tile, true);
    assert.equal(tile.img, originalTileImage);
    assert.equal(tile.img.src, sharedUrl);
    assert.equal(opened.length, 1);
    // Invalidation detaches any mounted user before revoking the derivative.
    context.testElement = tile;
    run("archivePreviewRuntime.release(archivePreviewRuntime.targets.get(testElement).key, 'icons')");
    assert.equal(tile.img, null);
    assert.equal(strip.img, null);
    assert.ok(strip.querySelector('svg'), 'filmstrip placeholder must return on invalidation');
    assert.ok(revoked.includes(sharedUrl));
    intersect(tile, false);
    intersect(tile, true);
    await run('archivePreviewRuntime.run()');
    assert.notEqual(tile.img.src, sharedUrl);

    const bad = queue(add('bad', 'blob:corrupt'));
    await run('archivePreviewRuntime.run()');
    assert.equal(bad.img, null);
    const oversized = queue(add('too-large', 'blob:large', { width: 9000, height: 9000 }));
    await run('archivePreviewRuntime.run()');
    assert.equal(oversized.img, null);
    assert.equal(opened.includes('blob:large'), false);
    const authored = queue(add('authored', 'blob:huge-original', {
        thumbnailUrl: 'blob:authored-small', width: 9000, height: 9000, sizeBytes: 30 * 1024 * 1024
    }));
    await run('archivePreviewRuntime.run()');
    assert.match(authored.img.src, /^blob:derived-/);
    assert.ok(opened.includes('blob:authored-small'));
    assert.equal(opened.includes('blob:huge-original'), false);
    const alias = queue(add('alias', 'blob:alias', {
        thumbnailUrl: 'blob:alias', width: 9000, height: 9000
    }));
    await run('archivePreviewRuntime.run()');
    assert.equal(alias.img, null);
    assert.equal(opened.includes('blob:alias'), false);
    const unknown = queue(add('unknown', 'blob:unknown-oversize'));
    await run('archivePreviewRuntime.run()');
    assert.equal(unknown.img, null);
    intersect(authored, false);

    // Leave and immediately re-enter while encoding. The old job cannot mount;
    // a new job is queued when it settles, even without another observer event.
    let finishEncode, encoding;
    const reachedEncode = new Promise(resolve => { encoding = resolve; });
    holdEncode = callback => { finishEncode = callback; encoding(); };
    const pending = queue(add('pending'));
    const job = run('archivePreviewRuntime.run()');
    await reachedEncode;
    intersect(pending, false);
    intersect(pending, true);
    finishEncode({ size: 100 });
    await job;
    assert.equal(pending.img, null);
    assert.equal(measurements.at(-1), 'canceled');
    holdEncode = null;
    await run('archivePreviewRuntime.run()');
    assert.match(pending.img.src, /^blob:derived-/);
    intersect(pending, false);

    const reachedSwitch = new Promise(resolve => { encoding = resolve; });
    holdEncode = callback => { finishEncode = callback; encoding(); };
    const obsolete = queue(add('obsolete'));
    const oldJob = run('archivePreviewRuntime.run()');
    await reachedSwitch;
    const oldObserver = run('archivePreviewRuntime.observer');
    activeProject = { id: 'b' };
    run('archiveThumbnailLifecycle()');
    finishEncode({ size: 100 });
    await oldJob;
    assert.equal(obsolete.img, null);
    assert.equal(measurements.at(-1), 'canceled');
    assert.equal(run('archivePreviewRuntime.cache.size'), 0);
    assert.equal(run('archivePreviewRuntime.mounted.size'), 0);
    assert.equal(tile.img, null);

    holdEncode = null;
    // Scroll beyond both budgets; recently visited images stay warm until pressure.
    const tiles = [];
    for (let index = 0; index < 281; index++)
    {
        const item = add('bound-' + index);
        const element = queue(item);
        tiles.push({ item, element, url: null });
        await run('archivePreviewRuntime.run()');
        tiles[index].url = element.img.src;
        bound();
        if (index >= 8) intersect(tiles[index - 8].element, false);
    }
    assert.equal(run('archivePreviewRuntime.mounted.size'), 100);
    assert.equal(run('archivePreviewRuntime.cache.size'), 256);
    assert.equal(run('archivePreviewRuntime.bytes'), 25600);
    assert.equal(tiles.filter(item => item.element.img).length, 100);
    assert.ok(revoked.includes(tiles[0].url));
    assert.ok(!tiles[0].element.img);
    intersect(tiles[0].element, true);
    await run('archivePreviewRuntime.run()');
    assert.notEqual(tiles[0].element.img.src, tiles[0].url);
    assert.equal(run('archivePreviewRuntime.mounted.size'), 100);
    // A cached but unmounted item restores immediately, even while a cold
    // generation job is held at encode. No extra original is opened.
    const warm = tiles[100];
    assert.equal(warm.element.img, null);
    const enteredCold = new Promise(resolve => { encoding = resolve; });
    holdEncode = callback => { finishEncode = callback; encoding(); };
    const cold = queue(add('cold-buffer'));
    const coldJob = run('archivePreviewRuntime.run()');
    await enteredCold;
    const beforeWarm = opened.length;
    intersect(warm.element, true);
    assert.equal(warm.element.img.src, warm.url);
    assert.equal(opened.length, beforeWarm);
    assert.equal(run('archivePreviewRuntime.job !== null'), true);
    finishEncode({ size: 100 });
    await coldJob;
    holdEncode = null;
    assert.ok(cold.img);
    bound();
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
    await run('archivePreviewRuntime.run()');
    assert.match(replaced.element.img.src, /^blob:derived-/);
    assert.notEqual(replaced.element.img.src, retired);
    // Derived load failure also restores the placeholder and releases the lease.
    const failedUrl = replaced.element.img.src;
    replaced.element.img.listeners.error();
    assert.equal(replaced.element.img, null);
    assert.ok(revoked.includes(failedUrl));
    bound();

    // Same-folder layout switch retains encoded derivatives but replaces
    // obsolete elements. A different folder clears both buffers and jobs.
    const warmUrl = warm.element.img.src;
    run('archiveThumbnailUnmount()');
    run('archiveThumbnailLifecycle()');
    const warmStrip = queue(warm.item, 'image');
    assert.equal(warmStrip.img.src, warmUrl);
    const folderObserver = run('archivePreviewRuntime.observer');
    const folderViewportObserver = run('archivePreviewRuntime.viewportObserver');
    const folderEncode = new Promise(resolve => { encoding = resolve; });
    holdEncode = callback => { finishEncode = callback; encoding(); };
    const folderPending = queue(add('folder-pending'));
    const folderJob = run('archivePreviewRuntime.run()');
    await folderEncode;
    state.archiveSelectedFolderId = 'folder-b';
    run('archiveThumbnailLifecycle()');
    assert.equal(warmStrip.img, null);
    assert.equal(run('archivePreviewRuntime.cache.size'), 0);
    assert.equal(run('archivePreviewRuntime.mounted.size'), 0);
    assert.ok(revoked.includes(warmUrl));
    finishEncode({ size: 100 });
    await folderJob;
    holdEncode = null;
    assert.equal(folderPending.img, null);
    assert.equal(run('archivePreviewRuntime.cache.size'), 0);

    // Foreground misses precede earlier near-viewport-only misses. Stale
    // callbacks from the previous folder's observers cannot enqueue work.
    const near = queue(add('near-only'));
    const foreground = queue(add('foreground'));
    folderObserver.callback([{ target: near, isIntersecting: true }]);
    folderViewportObserver.callback([{ target: near, isIntersecting: true }]);
    context.testElement = foreground;
    run('archivePreviewRuntime.viewportObserver.callback([{ target: testElement, isIntersecting: true }])');
    await run('archivePreviewRuntime.run()');
    assert.ok(foreground.img);
    assert.equal(near.img, null);
    await run('archivePreviewRuntime.run()');
    assert.ok(near.img);

    // More intersecting targets than the hard cap: protect mounted URLs and
    // admit the next waiting target when a slot becomes available.
    run('archiveThumbnailUnmount()');
    const crowded = [];
    for (let index = 0; index < 101; index++)
    {
        const element = queue(add('crowded-' + index));
        crowded.push(element);
        await run('archivePreviewRuntime.run()');
        bound();
    }
    assert.equal(run('archivePreviewRuntime.mounted.size'), 100);
    assert.equal(crowded[100].img, null);
    assert.ok(crowded[0].img);
    assert.equal(revoked.includes(crowded[0].img.src), false);
    intersect(crowded[0], false);
    assert.ok(crowded[0].img, 'retain until pressure');
    await run('archivePreviewRuntime.run()');
    assert.equal(crowded[0].img, null);
    assert.ok(crowded[100].img);
    assert.equal(run('archivePreviewRuntime.mounted.size'), 100);
    bound();

    // Byte pressure can block a job before the element-count cap is reached.
    state.activeModule = 'People';
    run('archiveThumbnailLifecycle()');
    assert.equal(run('archivePreviewRuntime.cache.size'), 0);
    assert.equal(run('archivePreviewRuntime.mounted.size'), 0);
    state.activeModule = 'Archive';
    run('archiveThumbnailLifecycle()');
    blobBytes = 3 * 1024 * 1024;
    const largeA = queue(add('large-derivative-a'));
    await run('archivePreviewRuntime.run()');
    const largeB = queue(add('large-derivative-b'));
    await run('archivePreviewRuntime.run()');
    assert.ok(largeA.img);
    assert.equal(largeB.img, null);
    bound();
    intersect(largeA, false);
    assert.ok(largeA.img, 'retain until byte pressure');
    await run('archivePreviewRuntime.run()');
    assert.equal(largeA.img, null);
    assert.ok(largeB.img);
    bound();
    state.activeModule = 'People';
    run('archiveThumbnailLifecycle()');
    assert.equal(run('archivePreviewRuntime.cache.size'), 0);
    assert.equal(run('archivePreviewRuntime.bytes'), 0);
    assert.equal(run('archivePreviewRuntime.mounted.size'), 0);
    assert.equal(run('archivePreviewRuntime.leases.size'), 0);
    assert.ok(revoked.every(url => url.startsWith('blob:derived-')));
    assert.equal(new Set(revoked).size, revoked.length, 'owned URLs revoked once');
    assert.ok(gauges.some(metric => metric.key === 'mountedPreviews' && metric.value === 100));
    console.log('Archive thumbnails: warm mounted buffer, immediate cache restore, visible-first jobs, folder/layout lifecycle, leased LRU, source budgets, cancellation and resource caps passed.');

    const photos = new Map();
    const frames = new Map();
    let nextFrame = 0;
    context.document.activeElement = null;
    context.window.devicePixelRatio = 1;
    context.getProjectPhotos = () => [...photos.values()];
    context.getPhoto = id => photos.get(id);
    context.performance = { now: () => 0 };
    context.appPerf.albumsMediaEpoch = () => null;
    context.appPerf.albumsMediaMetric = () => {};
    context.appPerf.observeAlbumImage = () => {};
    context.appPerf.cancelAlbumImage = () => {};
    context.requestAnimationFrame = callback => { frames.set(++nextFrame, callback); return nextFrame; };
    context.cancelAnimationFrame = frame => frames.delete(frame);
    vm.runInContext(read('modules/albums/media-previews.js'), context);
    blobBytes = 100;
    state.activeModule = 'Albums';
    run('albumsPreviewRuntime.lifecycle()');
    async function flushFrame()
    {
        const pending = [...frames];
        pending.forEach(([id, callback]) =>
        {
            if (frames.delete(id)) callback();
        });
        for (let step = 0; step < 12; step++) await Promise.resolve();
    }
    function albumPhoto(id, fields = {})
    {
        const photo = { id, projectId: activeProject.id, src: 'blob:album-original-' + id,
            width: 6000, height: 5900, sizeBytes: 1500000, ...fields };
        photos.set(id, photo);
        return photo;
    }
    function albumHost(photo, layout = 'grid')
    {
        const host = new PreviewNode('div');
        const fallback = { hidden: false };
        const query = host.querySelector.bind(host);
        host.querySelector = selector => selector === '.photo-thumbnail-fallback' ? fallback : query(selector);
        host.classList = { add() {}, remove() {} };
        host.closest = () => null;
        host.dataset = {};
        context.element = host;
        context.photo = photo;
        context.layout = layout;
        run('albumsPreviewRuntime.track(element, photo, layout)');
        return host;
    }
    function albumVisible(host, visible)
    {
        context.element = host;
        context.visible = visible;
        run('albumsPreviewRuntime.observer.callback([{ target: element, isIntersecting: visible }])');
    }
    const a = albumPhoto('a');
    const oldHost = albumHost(a);
    albumVisible(oldHost, true);
    await flushFrame();
    assert.ok(oldHost.img?.src.startsWith('blob:derived-'));
    assert.equal(a.src, 'blob:album-original-a');
    albumVisible(oldHost, false);
    const retainedImage = oldHost.img;
    albumVisible(oldHost, true);
    await flushFrame();
    assert.equal(oldHost.img, retainedImage);
    const duplicate = albumHost(a);
    albumVisible(duplicate, true);
    await flushFrame();
    assert.equal(duplicate.img.src, retainedImage.src);
    const shared = duplicate.img.src;
    context.element = oldHost;
    run('albumsPreviewRuntime.forget(element)');
    assert.ok(!revoked.includes(shared), 'the second lease protects the URL');

    const oversizedAlbum = albumHost(albumPhoto('oversized', { width: 10000, height: 10000 }));
    albumVisible(oversizedAlbum, true);
    await flushFrame();
    assert.equal(oversizedAlbum.img, null);
    assert.ok(!opened.includes('blob:album-original-oversized'));

    for (let index = 0; index < 267; index++)
    {
        const host = albumHost(albumPhoto('pressure-' + index), 'list');
        albumVisible(host, true);
        await flushFrame();
        assert.ok(host.img, 'pressure target mounts');
        albumVisible(host, false);
    }
    assert.equal(run('albumsPreviewRuntime.cache.size'), 256);
    assert.equal(run('albumsPreviewRuntime.mounted.size'), 120);
    assert.ok(!revoked.includes(shared), 'visible lease survives pressure');
    assert.ok(run('albumsPreviewRuntime.bytes') <= 16 * 1024 * 1024);
    a.src = 'blob:album-original-replacement';
    run('prototypeSessionEditRevision++; albumsPreviewRuntime.lifecycle()');
    assert.equal(duplicate.img, null);
    assert.ok(revoked.includes(shared));
    albumVisible(duplicate, true);
    await flushFrame();
    assert.ok(duplicate.img?.src.startsWith('blob:derived-'));
    assert.ok(opened.includes(a.src));

    // An in-flight old view holds the one generation slot until cancellation settles.
    let completeEncode;
    holdEncode = callback => { completeEncode = callback; };
    const retiring = albumHost(albumPhoto('retiring'));
    albumVisible(retiring, true);
    await flushFrame();
    assert.equal(typeof completeEncode, 'function');
    state.activeModule = 'Archive';
    run('albumsPreviewRuntime.lifecycle(); archiveThumbnailLifecycle()');
    const archiveDuringCancellation = queue(add('cross-runtime'));
    await run('archivePreviewRuntime.run()');
    assert.equal(archiveDuringCancellation.img, null);
    assert.ok(!opened.includes('blob:original-cross-runtime'));
    holdEncode = null;
    completeEncode({ size: 100 });
    await flushFrame();
    await flushFrame();
    await flushFrame();
    assert.equal(retiring.img, null);
    assert.ok(archiveDuringCancellation.img, 'Archive resumes when the shared generation slot is released');
    assert.equal(run('albumsPreviewRuntime.mounted.size'), 0);
    assert.ok(revoked.every(url => url.startsWith('blob:derived-')));
    console.log('Albums previews: warm reuse, pressure, source replacement, protected leases and shared generation slot passed.');
})().catch(error =>
{
    console.error(error);
    process.exitCode = 1;
});
