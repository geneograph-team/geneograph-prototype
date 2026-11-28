'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const read = file => fs.readFileSync(path.join(__dirname, '../../src', file), 'utf8');
const events = [];
const makeNode = () => ({
    disabled: false, hidden: false, textContent: '', attrs: {}, children: [], isConnected: true,
    setAttribute(key, value) { this.attrs[key] = value; },
    removeAttribute(key) { delete this.attrs[key]; if (key === 'value') delete this.value; },
    addEventListener() {},
    append(node) { this.children.push(node); node.parent = this; },
    remove() { if (this.parent) this.parent.children = this.parent.children.filter(node => node !== this); }
});
const input = makeNode(), drop = makeNode(), close = makeNode(), confirm = makeNode(), body = makeNode();
confirm.disabled = true;
const phase = makeNode(), bar = makeNode(), count = makeNode(), live = makeNode(), panel = makeNode();
panel.querySelector = selector => ({ '[data-upload-phase]': phase, progress: bar, '[data-upload-count]': count, '[role="status"]': live })[selector];
const modal = makeNode(), header = { after(node) { assert.equal(node, panel); } };
modal.querySelector = selector => selector === '.modal-header' ? header : selector === '.modal-body' ? body : null;
modal.querySelectorAll = () => [input, close, confirm];
let observer, lifecycle, nextUrl = 0, ticks = [], heldEncode = null;
const urls = new Set(), revoked = [];
const setTimeoutMock = fn => { ticks.push(fn); return ticks.length; };
const context = vm.createContext({
    assert, modalBackdrop: {}, rpText: en => en, escapeHtml: x => x, performance: { now: () => 0 },
    setTimeout: setTimeoutMock, clearTimeout() {}, requestAnimationFrame: fn => { ticks.push(fn); return ticks.length; }, cancelAnimationFrame() {},
    document: {
        createElement(tag) {
            if (tag === 'div') return panel;
            if (tag === 'canvas') return { getContext: () => ({ drawImage() {} }), toBlob(fn) {
                if (heldEncode) heldEncode(fn); else fn({ size: 1024 });
            } };
            return makeNode();
        }
    },
    IntersectionObserver: class { constructor(cb) { observer = cb; } observe() {} disconnect() {} },
    MutationObserver: class { constructor(cb) { lifecycle = cb; } observe() {} disconnect() {} },
    Image: class {
        set src(value) { if (value) { this.naturalWidth = 5600; this.naturalHeight = 5600; Promise.resolve().then(() => this.onload?.()); } }
    },
    URL: { createObjectURL() { const url = 'blob:staging-' + ++nextUrl; urls.add(url); return url; },
        revokeObjectURL(url) { assert.ok(urls.delete(url), 'owned URL revoked once'); revoked.push(url); } },
    modal, input, drop, confirm, close, panel, phase, bar, count, live, body
});
vm.runInContext(read('shared/upload-staging.js'), context);
const run = code => vm.runInContext(code, context);
const flush = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };
const drain = async () => { let n = 0; while (ticks.length && n++ < 200) { ticks.shift()(); await flush(); } assert.ok(n < 200); };
const runTests = (async () => {
    context.progress = run('createUploadProgress(modal, input, drop)');
    run("progress.begin('Preparing photos…', 3)");
    assert.equal(panel.hidden, false); assert.equal(bar.max, 3); assert.equal(bar.value, 0);
    assert.equal(input.disabled, true); assert.equal(close.disabled, true); assert.equal(body.attrs['aria-busy'], 'true');
    run('progress.update(2, 1)'); assert.equal(bar.value, 2); assert.equal(count.textContent, '2 of 3 processed · 1 failed');
    run('progress.update(3, 1); progress.finalizing()'); assert.equal(bar.value, undefined);
    run('progress.end()'); assert.equal(panel.hidden, true); assert.equal(close.disabled, false); assert.equal(confirm.disabled, true);
    assert.equal(body.attrs['aria-busy'], undefined);

    const nodes = Array.from({ length: 40 }, (_, i) => Object.assign(makeNode(), { dataset: { uploadPreview: String(i) } }));
    context.root = { querySelectorAll: () => nodes };
    context.entries = nodes.map((node, i) => ({ id: String(i), file: { name: 'photo-' + i } }));
    run('mountUploadStagingPreviews(modal, root, entries)');
    observer(nodes.map(target => ({ target, isIntersecting: true })));
    await drain();
    assert.equal(nodes.filter(node => node.children.length).length, 32);
    assert.equal(urls.size, 32);
    observer([{ target: nodes[0], isIntersecting: false }]);
    await drain();
    assert.equal(nodes[0].children.length, 0);
    assert.equal(nodes[32].children.length, 1);
    assert.equal(urls.size, 32);
    // Closing or replacing the modal releases all derived URLs.
    modal.isConnected = false; lifecycle();
    assert.equal(urls.size, 0);
    assert.equal(nodes.filter(node => node.children.length).length, 0);
    await drain();
    modal.isConnected = true;
    let completeEncode;
    heldEncode = fn => { completeEncode = fn; };
    run('mountUploadStagingPreviews(modal, root, entries)');
    observer([{ target: nodes[0], isIntersecting: true }]);
    ticks.shift()(); await flush();
    assert.ok(completeEncode);
    run('uploadStagingSessions.get(modal)()');
    completeEncode({ size: 1024 }); await flush(); await drain();
    assert.equal(nodes[0].children.length, 0);
    assert.equal(urls.size, 0);
    assert.equal(new Set(revoked).size, revoked.length);

    // Actual Archive importer: terminal outcomes include invalid/corrupt files;
    // canonical bytes are retained only for successes and destination identity is checked.
    const archive = read('modules/archive/archive-documents.js');
    const start = archive.indexOf('async function archiveImportFiles('), end = archive.indexOf('function archiveRollbackImportedFiles(', start);
    assert.ok(start >= 0 && end > start);
    const project = { id: 'p' };
    let current = project, dirty = 0, ids = 0, yields = 0;
    const sampleData = { archiveFiles: [] }, archiveDocumentBytes = new Map(), archiveUploadedImageUrls = new Map();
    const archiveContext = vm.createContext({
        sampleData, archiveDocumentBytes, archiveUploadedImageUrls,
        currentProjectId: () => 'p', validProjectById: () => current, archiveFolderById: () => ({ id: 'f' }),
        archiveDocumentLabel: en => en, archiveDocumentExtension: name => name.split('.').at(-1),
        archiveDocumentExtensions: new Set(['txt']), archiveImageExtensions: new Set(['jpg']), archiveDocumentMaxBytes: 20 * 1024 * 1024,
        archiveValidateDocument: async () => {}, archiveValidateImage: async file => { if (file.name === 'broken.jpg') throw Error('bad'); },
        uploadYield: async () => { yields++; },
        crypto: { randomUUID: () => String(++ids) }, URL: { createObjectURL: () => 'blob:original' },
        markPrototypeSessionEdited: () => dirty++
    });
    vm.runInContext(archive.slice(start, end), archiveContext);
    const good = { name: 'good.jpg', size: 10, type: 'image/jpeg' }, bad = { name: 'broken.jpg', size: 10 }, unsupported = { name: 'bad.exe', size: 10 };
    archiveContext.files = [good, bad, unsupported];
    archiveContext.onResult = (file, status) => events.push(file.name + ':' + status);
    const result = await vm.runInContext("archiveImportFiles(files, { projectId: 'p', folderId: 'f', onResult })", archiveContext);
    assert.equal(result.length, 1); assert.equal(dirty, 1); assert.equal(yields, 3);
    assert.equal(archiveDocumentBytes.get(result[0]), good);
    assert.equal(events.join(','), 'good.jpg:uploading,good.jpg:success,broken.jpg:uploading,broken.jpg:error,bad.exe:uploading,bad.exe:error');
    current = null;
    const rejected = await vm.runInContext("archiveImportFiles([files[0]], { projectId: 'p', folderId: 'f', onResult })", archiveContext);
    assert.equal(rejected.length, 0); assert.equal(sampleData.archiveFiles.length, 1);
    console.log('Upload staging: progress, busy-state restoration, 32-preview bound, URL cleanup, stale encode and Archive mixed outcomes passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
