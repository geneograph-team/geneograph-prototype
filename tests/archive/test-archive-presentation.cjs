'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../../src/modules/archive/archive-library.js'), 'utf8');
const extract = (from, to) => {
    const start = source.indexOf(from), end = source.indexOf(to, start + from.length);
    assert.ok(start >= 0 && end > start);
    return source.slice(start, end);
};
const files = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
const folders = [{ id: 'f' }];
const state = {
    activeModule: 'Archive', archiveView: 'files', archiveFileLayout: 'tiles',
    archiveSelectedFileIds: [], archiveSelectedFolderIds: [], archiveSelectedFileId: null,
    archiveSelectedFolderItemId: 'f', archiveInspectorCollapsed: false
};
let full = 0, binds = 0, focused, editing = false, navigation = 0;
const traces = [];
const node = (id, type) => {
    const classes = new Set();
    const attrs = new Map(type === 'file' ? [['aria-selected', 'false']] : []);
    return {
        dataset: type === 'file' ? { archiveFileRow: id } : { archiveFolderRow: id },
        image: {}, getClientRects: () => [{}],
        classList: { add: key => classes.add(key), remove: key => classes.delete(key),
            toggle(key, value) { if (value) classes.add(key); else classes.delete(key); },
            contains: key => classes.has(key) },
        hasAttribute: key => attrs.has(key), setAttribute: (key, value) => attrs.set(key, value),
        getAttribute: key => attrs.get(key), focus() { focused = id; }
    };
};
const rows = new Map(files.map(file => [file.id, node(file.id, 'file')]));
rows.set('f', node('f', 'folder'));
rows.get('f').classList.add('selected-detail');
const checks = new Map(files.map(file => [file.id, { checked: false }]));
const all = { checked: false, indeterminate: false };
const page = { dataset: { archiveFilesPresentation: 'desktop', archiveResultItemCount: '4' } };
const inspector = { querySelector: () => null, outerHTML: '' };
const root = {
    querySelector(selector) {
        if (selector === '[data-archive-files-presentation]') return page;
        if (selector === '.archive-inspector') return inspector;
        const id = selector.match(/data-archive-(?:file|folder)-row="([^"]+)"/)?.[1];
        return id ? rows.get(id) : null;
    },
    querySelectorAll(selector) {
        if (selector === '[data-archive-select-all]') return [all];
        const id = selector.match(/data-archive-file-checkbox="([^"]+)"/)?.[1];
        if (id) return [checks.get(id)];
        return [...rows.values()];
    }
};
const context = vm.createContext({
    state, innerWidth: 1280, CSS: { escape: value => String(value) },
    main: { querySelector: selector => selector === '.archive-shell' ? root : root.querySelector(selector), contains: () => false },
    document: { activeElement: null }, archiveDragItem: null,
    archiveFileEditIsActive: () => editing,
    archiveFileById: id => files.find(file => file.id === id),
    appPerf: { currentDetailed: () => null },
    archiveDiagnosticContext: (_trace, kind) => traces.push(kind),
    archiveDiagnosticMeasure: (_trace, _stage, fn) => fn(),
    archiveDiagnosticMounted() {},
    renderArchiveInspector: () => '<aside>Inspector</aside>',
    bindArchiveControls() { binds++; }, localizeUI() {},
    appNavigationObserve() { navigation++; },
    renderArchiveMain() { full++; },
    archiveDiagnosticRun: (_kind, fn) => fn(),
    archiveMobileSelectMode: false, resetArchiveFolderRowClick() {},
    archiveLastFileRowClick: {},
    archiveMatchingFiles: () => files, archiveVisibleFiles: () => files,
    archiveVisibleChildFolders: () => folders,
    archiveFolderMatchProjection: () => ({ matchingCountByFolder: new Map() }),
    archiveFileFilteringActive: () => false, archiveFolderById: () => null,
    renderArchiveToolbar: () => '', renderArchiveLocationRow: () => '',
    renderArchiveActiveFilterbar: () => '', renderArchiveFilterResultsBar: () => '',
    renderArchiveSelectionBar: () => '', archiveBulkSelectionLabel: () => 'Selected',
    escapeHtml: value => String(value), t: value => value, icon: { close: '' },
    renderArchiveMobileItems: () => 'MOBILE_ROWS',
    renderArchiveFileTiles: () => 'DESKTOP_TILES',
    renderArchiveFileTableDesktop: () => 'DESKTOP_TABLE',
    renderArchiveImageView: () => 'VIEWER',
    archiveSortFoldersForTable: value => value
});
vm.runInContext(extract('let archiveSelectionAnchor = null;', 'function archiveSelectDesktopItem(')
    + extract('function archiveSelectDesktopItemWithDiagnosticsBody(', 'function renderArchiveMain()')
    + extract('function renderArchiveFilesViewWithDiagnosticsBody()', 'function archiveToolbarIsSources()'), context);
const run = code => vm.runInContext(code, context);
const select = (id, modifiers = {}) => {
    context.selectionId = id;
    context.modifiers = modifiers;
    run("archiveSelectDesktopItemWithDiagnosticsBody(main.querySelector('.archive-shell'), 'file', selectionId, modifiers)");
};
const originalImage = rows.get('b').image;
select('a');
assert.equal(full, 0);
assert.equal(binds, 1);
assert.equal(state.archiveSelectedFileId, 'a');
assert.equal(state.archiveSelectedFileIds.join(','), 'a');
assert.equal(state.archiveSelectedFolderItemId, null);
assert.equal(rows.get('f').classList.contains('selected-detail'), false);
assert.equal(rows.get('a').classList.contains('selected-detail'), true);
assert.equal(rows.get('a').getAttribute('aria-selected'), 'true');
assert.equal(checks.get('a').checked, true);
assert.equal(all.indeterminate, true);
select('b');
assert.equal(full, 0);
assert.equal(binds, 2);
assert.equal(rows.get('a').getAttribute('aria-selected'), 'false');
assert.equal(checks.get('a').checked, false);
assert.equal(checks.get('b').checked, true);
assert.equal(rows.get('b').image, originalImage);
assert.equal(focused, 'b');
select('b');
assert.equal(binds, 2);
assert.equal(navigation, 2);
assert.equal(traces.at(-1), 'partial');
page.dataset.archiveResultItemCount = '1';
select('c');
assert.equal(all.checked, true);
assert.equal(all.indeterminate, false);
page.dataset.archiveResultItemCount = '4';
select('a', { shiftKey: true });
assert.equal(full, 1);
assert.equal(state.archiveSelectedFileIds.length, 3);
select('b');
assert.equal(full, 2, 'bulk-to-single changes list composition');
assert.equal(state.archiveSelectedFileIds.join(','), 'b');
let markup = run('renderArchiveFilesViewWithDiagnosticsBody()');
assert.ok(markup.includes('DESKTOP_TILES') && !markup.includes('MOBILE_ROWS'));
assert.ok(!markup.includes('archive-mobile-bulk'));
state.archiveFileLayout = 'details';
markup = run('renderArchiveFilesViewWithDiagnosticsBody()');
assert.ok(markup.includes('DESKTOP_TABLE') && !markup.includes('MOBILE_ROWS'));
context.innerWidth = 390;
markup = run('renderArchiveFilesViewWithDiagnosticsBody()');
assert.ok(markup.includes('MOBILE_ROWS') && !markup.includes('DESKTOP_TABLE'));
assert.ok(markup.includes('archive-mobile-bulk'));
run('archiveRefreshResponsiveFiles()');
assert.equal(full, 3, 'breakpoint changes the mounted list');
page.dataset.archiveFilesPresentation = 'mobile';
run('archiveRefreshResponsiveFiles()');
assert.equal(full, 3);
editing = true;
markup = run('renderArchiveFilesViewWithDiagnosticsBody()');
assert.ok(markup.includes('MOBILE_ROWS') && markup.includes('DESKTOP_TABLE'));
page.dataset.archiveFilesPresentation = 'both';
run('archiveRefreshResponsiveFiles()');
assert.equal(full, 3, 'active editor keeps its existing DOM on resize');
editing = false;
state.archiveFileNameEditingId = 'b';
assert.equal(run('archiveFilesPresentation()'), 'both');
state.archiveFileNameEditingId = null;
state.archiveFileLayout = 'images';
assert.ok(run('renderArchiveFilesViewWithDiagnosticsBody()').includes('VIEWER'));
run('archiveRefreshResponsiveFiles()');
assert.equal(full, 3, 'viewer owns its resize');
console.log('Archive presentation: first/repeat selection, accessibility state, bulk fallback, active layout and edit-safe breakpoint passed.');
