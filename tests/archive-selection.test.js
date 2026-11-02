const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync(require.resolve('../src/archive.js'), 'utf8');
const start = source.indexOf('let archiveSelectionAnchor = null;');
const end = source.indexOf('let archiveRenderedLocationKey = null;', start);
assert.ok(start >= 0 && end > start);

const rows = [
    { dataset: { archiveFolderRow: 'f1' }, getClientRects: () => [1] },
    { dataset: { archiveFolderRow: 'f2' }, getClientRects: () => [1] },
    { dataset: { archiveFileRow: 'a' }, getClientRects: () => [1] },
    { dataset: { archiveFileRow: 'hidden' }, getClientRects: () => [] },
    { dataset: { archiveFileRow: 'b' }, getClientRects: () => [1] }
];
const root = { querySelectorAll: () => rows };
const state = {
    archiveSelectedFolderIds: [],
    archiveSelectedFileIds: [],
    archiveSelectedFolderItemId: null,
    archiveSelectedFileId: null,
    archiveInspectorCollapsed: true
};
const context = {
    state,
    main: { querySelector: selector => selector === '.archive-shell' ? root : ({ focus() {} }) },
    renderArchiveMain() {},
    resetArchiveFolderRowClick() {},
    CSS: { escape: value => value }
};
vm.createContext(context);
vm.runInContext(source.slice(start, end), context);
const select = (type, id, modifiers = {}) =>
    context.archiveSelectDesktopItem(root, type, id,
        { shiftKey: false, ctrlKey: false, metaKey: false, ...modifiers });
const ids = () => ({
    folders: [...state.archiveSelectedFolderIds],
    files: [...state.archiveSelectedFileIds]
});

select('folder', 'f1');
assert.deepEqual(ids(), { folders: ['f1'], files: [] });
assert.equal(state.archiveSelectedFolderItemId, 'f1');
select('file', 'b', { shiftKey: true });
assert.deepEqual(ids(), { folders: ['f1', 'f2'], files: ['a', 'b'] });
select('file', 'a', { ctrlKey: true });
assert.deepEqual(ids(), { folders: ['f1', 'f2'], files: ['b'] });
select('folder', 'f2');
assert.deepEqual(ids(), { folders: ['f2'], files: [] });
select('file', 'a', { shiftKey: true });
assert.deepEqual(ids(), { folders: ['f2'], files: ['a'] });
rows[1].getClientRects = () => [];
select('file', 'b', { shiftKey: true });
assert.deepEqual(ids(), { folders: [], files: ['b'] });
select('file', 'hidden');
assert.deepEqual(ids(), { folders: [], files: ['b'] });
const moveStart = source.indexOf('function archiveCanMoveBulkItems(');
const moveEnd = source.indexOf('function archiveMoveBulkItems(', moveStart);
assert.ok(moveStart >= 0 && moveEnd > moveStart);
const folders = new Map([
    ['parent', { id: 'parent', parentId: null }],
    ['child', { id: 'child', parentId: 'parent' }],
    ['other', { id: 'other', parentId: null }]
]);
const moveContext = {
    archiveFolderById: id => folders.get(id),
    archiveFolderDescendantIds: id => id === 'parent' ? ['parent', 'child'] : [id],
    archiveFolderParentId: folder => folder.parentId,
    archiveFileFolderId: file => file.folderId
};
vm.createContext(moveContext);
vm.runInContext(source.slice(moveStart, moveEnd), moveContext);
const items = { folders: [folders.get('parent')], files: [{ id: 'file', folderId: 'other' }] };
assert.equal(moveContext.archiveCanMoveBulkItems(items, 'child'), false);
assert.equal(moveContext.archiveCanMoveBulkItems(items, 'missing'), false);
assert.equal(moveContext.archiveCanMoveBulkItems(items, 'other'), true);

const menuStart = source.indexOf('function openArchiveMobileChoiceMenu(');
const menuEnd = source.indexOf('function openArchiveConnectedRecordCommit(', menuStart);
assert.ok(menuStart >= 0 && menuEnd > menuStart);
let mountedMenu;
const menuContext = {
    state,
    innerWidth: 1200,
    innerHeight: 800,
    document: {
        getElementById: () => null,
        createElement: () => ({
            style: {},
            offsetWidth: 180,
            offsetHeight: 160,
            setAttribute() {},
            addEventListener(name, callback) { this[name] = callback; }
        }),
        body: { appendChild(menu) { mountedMenu = menu; } }
    },
    archiveSelectedBulkItems: () => ({
        folders: state.archiveSelectedFolderIds.map(id => ({ id, favorite: false })),
        files: state.archiveSelectedFileIds.map(id => ({ id, favorite: false }))
    }),
    closeMenu() {},
    bindMenuLifecycle() {},
    escapeHtml: value => value,
    t: value => value,
    main: { querySelector: () => null }
};
vm.createContext(menuContext);
vm.runInContext(source.slice(menuStart, menuEnd), menuContext);
state.archiveSelectedFolderIds = ['f1'];
state.archiveSelectedFileIds = ['a'];
const anchor = {
    getAttribute: () => null,
    getBoundingClientRect: () => ({ left: 10, right: 30, top: 10, bottom: 30 })
};
menuContext.openArchiveMobileChoiceMenu(anchor, 'bulk-context', { x: 400, y: 300 });
assert.match(mountedMenu.innerHTML, /data-archive-mobile-choice="move"/);
assert.match(mountedMenu.innerHTML, /data-archive-mobile-choice="favorite"/);
assert.match(mountedMenu.innerHTML, /data-archive-mobile-choice="delete"/);
assert.doesNotMatch(mountedMenu.innerHTML, /data-archive-mobile-choice="links"/);
assert.equal(mountedMenu.style.left, '400px');
assert.deepEqual(ids(), { folders: ['f1'], files: ['a'] });
const itemMenuStart = source.indexOf('function openArchiveItemActionsPopover(');
const itemMenuEnd = source.indexOf('function openArchiveMobileChoiceMenu(', itemMenuStart);
assert.ok(itemMenuStart >= 0 && itemMenuEnd > itemMenuStart);
class Element {}
const itemAnchor = new Element();
itemAnchor.getAttribute = () => null;
itemAnchor.getBoundingClientRect = () => ({ left: 10, right: 30, top: 10, bottom: 30 });
itemAnchor.setAttribute = () => {};
let localizedMenu = false;
const itemMenuContext = {
    HTMLElement: Element,
    state: { archiveSelectedFolderId: null },
    innerWidth: 1200,
    window: { innerWidth: 1200, innerHeight: 800 },
    document: {
        getElementById: () => null,
        createElement: () => ({
            style: {},
            offsetWidth: 180,
            offsetHeight: 160,
            setAttribute() {},
            addEventListener() {},
            querySelector: () => null
        }),
        body: { appendChild(menu) { mountedMenu = menu; } }
    },
    archiveFileById: id => id === 'a' ? { id, name: 'Record', favorite: false } : null,
    archiveFolderById: id => id === 'f1' ? { id, name: 'Folder', favorite: false } : null,
    archiveNormalizeFolderId: value => value,
    closeMenu() {},
    escapeHtml: value => value,
    t: value => value,
    localizeUI() { localizedMenu = true; },
    bindMenuLifecycle() {},
    requestAnimationFrame() {}
};
vm.createContext(itemMenuContext);
vm.runInContext(source.slice(itemMenuStart, itemMenuEnd), itemMenuContext);
itemMenuContext.openArchiveItemActionsPopover('file', 'a', itemAnchor, { x: 400, y: 300 });
assert.match(mountedMenu.innerHTML, /data-archive-item-action="rename"/);
assert.match(mountedMenu.innerHTML, /data-archive-item-action="move"/);
assert.equal(mountedMenu.style.left, '400px');
assert.equal(localizedMenu, true);
itemMenuContext.openArchiveItemActionsPopover('folder', 'f1', itemAnchor, { x: 400, y: 300 });
assert.match(mountedMenu.innerHTML, /data-archive-item-action="open"/);
assert.deepEqual(ids(), { folders: ['f1'], files: ['a'] });
const tileStart = source.indexOf('function renderArchiveFileTiles(');
const tileEnd = source.indexOf('function renderArchiveEmpty(', tileStart);
assert.ok(tileStart >= 0 && tileEnd > tileStart);
const tileContext = {
    state,
    archiveSortFoldersForTable: folders => folders,
    archiveFileKind: () => 'doc',
    archiveFileIcon: () => '<i>icon</i>',
    escapeHtml: value => String(value),
    t: value => value,
    icon: { more: '<i>more</i>', star: '<i>star</i>' }
};
vm.createContext(tileContext);
vm.runInContext(source.slice(tileStart, tileEnd), tileContext);
state.archiveSelectedFolderIds = [];
state.archiveSelectedFileIds = ['a'];
state.archiveSelectedFileId = 'a';
let tiles = tileContext.renderArchiveFileTiles(
    [{ id: 'a', name: 'Long record name', size: '2 MB', favorite: true }],
    [{ id: 'f1', name: 'Folder', favorite: false }]
);
assert.doesNotMatch(tiles, /archive-tile-select/);
assert.doesNotMatch(tiles, /2 MB|matching files|matching file/);
assert.match(tiles, /title="Long record name"/);
assert.match(tiles, /archive-tile-favorite/);

const barStart = source.indexOf('function renderArchiveSelectionBar(');
const barEnd = source.indexOf('function archiveSortFoldersForTable(', barStart);
assert.ok(barStart >= 0 && barEnd > barStart);
const barContext = {
    state,
    archiveSelectedBulkItems: () => ({
        folders: state.archiveSelectedFolderIds.map(id => ({ id, favorite: false })),
        files: state.archiveSelectedFileIds.map(id => ({ id, favorite: false }))
    }),
    archiveBulkSelectionLabel: () => 'Selected',
    escapeHtml: value => value,
    t: value => value,
    icon: { more: '<i>more</i>', close: '<i>close</i>' }
};
vm.createContext(barContext);
vm.runInContext(source.slice(barStart, barEnd), barContext);
assert.equal(barContext.renderArchiveSelectionBar([]), '');
state.archiveSelectedFolderIds = ['f1'];
tiles = tileContext.renderArchiveFileTiles(
    [{ id: 'a', name: 'Long record name', favorite: true }],
    [{ id: 'f1', name: 'Folder', favorite: false }]
);
assert.match(tiles, /archive-tile-select/);
assert.match(tiles, /data-archive-file-checkbox="a" checked/);
assert.match(barContext.renderArchiveSelectionBar([]), /archive-selection-bar/);
console.log('Archive selection and bulk move checks passed');