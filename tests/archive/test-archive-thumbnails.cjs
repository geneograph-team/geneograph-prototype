'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const read = relative => fs.readFileSync(path.join(__dirname, '../../src', relative), 'utf8');
const revoked = [];
const opened = [];
const measurements = [];
const project = { id: 'a' };
let activeProject = project;
let nextUrl = 0;
let holdEncode = null;
const state = { activeModule: 'Archive' };
const sampleData = { archiveFiles: [] };
class PreviewImage
{
    set src(value)
    {
        if (!value) return;
        opened.push(value);
        this.naturalWidth = 5600;
        this.naturalHeight = 5600;
        queueMicrotask(() => value === 'blob:corrupt' ? this.onerror() : this.onload());
    }
    decode() { return Promise.resolve(); }
}
class AssetURL extends URL {}
AssetURL.createObjectURL = () => 'blob:derived-' + ++nextUrl;
AssetURL.revokeObjectURL = url => revoked.push(url);

const context = vm.createContext({
    state, sampleData, URL: AssetURL, location: { origin: 'http://local', protocol: 'http:' },
    window: { devicePixelRatio: 4 }, prototypeSessionEditRevision: 0,
    validProjectById: id => activeProject.id === id ? activeProject : null,
    currentProjectId: () => activeProject.id, archiveDiagnosticLayout: () => 'icons',
    archiveDiagnosticObserveImage() {}, archiveDiagnosticFinishImage() {},
    archiveImageSource: file => file.previewUrl,
    archiveImageView: { cache: new Map() },
    requestAnimationFrame: () => 1, cancelAnimationFrame() {},
    Image: PreviewImage, IntersectionObserver: class { observe() {} unobserve() {} disconnect() {} },
    document: {
        baseURI: 'http://local/index.html',
        createElement(tag)
        {
            if (tag === 'img') return { addEventListener() {} };
            return {
                getContext: () => ({ drawImage() {} }),
                toBlob(callback)
                {
                    if (holdEncode) { holdEncode(callback); return; }
                    assert.equal(this.width, 288);
                    assert.equal(this.height, 288);
                    callback({ size: 100 });
                }
            };
        }
    },
    appPerf: {
        now: () => 0, archiveMetric() {}, archiveTaskBegin() {}, archiveTaskValid: () => true,
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
const queue = (file, layout = 'icons') =>
{
    const element = { isConnected: true, img: null, querySelector() { return this.img; }, prepend(img) { this.img = img; } };
    context.testFile = file;
    context.testElement = element;
    context.testLayout = layout;
    run(`{
        archiveThumbnailTrack(testElement, testFile, testLayout);
        const target = archiveThumbnailTargets.get(testElement);
        if (target) {
            target.visible = true;
            target.queuedAt = 0;
            archiveThumbnailQueue.set(testElement, target);
        }
        }`);
    return element;
};

(async () =>
{
    run('archiveThumbnailLifecycle()');
    const file = add('first');
    const tile = queue(file);
    await run('archiveThumbnailRun()');
    assert.match(tile.img.src, /^blob:derived-/);
    const strip = queue(file, 'image');
    await run('archiveThumbnailRun()');
    assert.equal(strip.img.src, tile.img.src);
    assert.equal(opened.length, 1);
    const bad = queue(add('bad', 'blob:corrupt'));
    await run('archiveThumbnailRun()');
    assert.equal(bad.img, null);
    const oversized = queue(add('too-large', 'blob:large', { width: 9000, height: 9000 }));
    await run('archiveThumbnailRun()');
    assert.equal(oversized.img, null);
    assert.equal(opened.includes('blob:large'), false);

    let finishEncode;
    let encoding;
    const reachedEncode = new Promise(resolve => { encoding = resolve; });
    holdEncode = callback => { finishEncode = callback; encoding(); };
    const pending = queue(add('pending'));
    const job = run('archiveThumbnailRun()');
    await reachedEncode;
    assert.equal(run('Boolean(archiveThumbnailJob)'), true);
    activeProject = { id: 'b' };
    run('archiveThumbnailLifecycle()');
    finishEncode({ size: 100 });
    await job;
    assert.equal(pending.img, null);
    assert.equal(measurements.at(-1), 'canceled');
    assert.equal(run('archiveThumbnailCache.size'), 0);
    assert.deepEqual(revoked, [tile.img.src]);

    holdEncode = null;
    for (let index = 0; index < 101; index++)
    {
        queue(add('bound-' + index));
        await run('archiveThumbnailRun()');
    }
    assert.equal(run('archiveThumbnailCache.size'), 100);
    assert.equal(run('archiveThumbnailBytes'), 10000);
    const replaced = sampleData.archiveFiles.at(-1);
    replaced.previewUrl = 'blob:replacement';
    run('prototypeSessionEditRevision++; archiveThumbnailLifecycle()');
    assert.equal(run('archiveThumbnailCache.size'), 99);
    assert.ok(revoked.every(url => url.startsWith('blob:derived-')));
    console.log('Archive thumbnails: cross-layout reuse, failed and oversized sources, obsolete encode, URL ownership and entry bounds passed.');
})().catch(error =>
{
    console.error(error);
    process.exitCode = 1;
});
