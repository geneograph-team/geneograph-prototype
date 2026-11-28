'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../../src/modules/archive/archive-controls.js'), 'utf8');
const end = source.indexOf("document.addEventListener('keydown', handleArchiveFileKeyboard, true);");
assert.ok(end > 0);
const state = { activeModule: 'Archive', archiveView: 'files', archiveFileLayout: 'details',
    archiveSelectedFileId: null, archiveSelectedFolderItemId: null };
let modalOpen = false, menuOpen = false, editing = false, guardAction = null, full = 0;
let preview, folder, imageNavigation, focused;
const node = (type, id, x = 0, y = 0) => ({
    dataset: type === 'folder' ? { archiveFolderRow: id } : type === 'file' ? { archiveFileRow: id } : {},
    isConnected: true, getClientRects: () => [{}],
    getBoundingClientRect: () => ({ left: x, top: y, width: 80, height: 80 }),
    matches(selector) {
        return (selector.includes('.archive-tile') && state.archiveFileLayout === 'tiles' && (type === 'file' || type === 'folder'))
            || (type === 'stage' && selector.includes('.archive-image-stage'))
            || (type === 'strip' && selector.includes('[data-av-index]'))
            || (type === 'layout' && selector.includes('data-archive-file-layout'));
    },
    closest() { return type === 'file' || type === 'folder' ? this : null; },
    focus() { focused = this; document.activeElement = this; },
    scrollIntoView() { this.scrolled = true; }
});
const rows = [node('folder', 'f', 0, 0), node('file', 'a', 100, 0), node('file', 'b', 200, 0),
    node('file', 'c', 0, 100), node('file', 'd', 100, 100)];
const workspace = node('workspace'), stage = node('stage'), input = node('input'), strip = node('strip'), layout = node('layout'), body = node('body');
let activeRows = rows;
const root = { querySelectorAll: () => activeRows, contains: value => [...activeRows, workspace, stage, input, strip, layout].includes(value),
    querySelector: selector => selector === '.archive-main' ? workspace : selector === '.archive-image-stage' ? stage : null };
const main = { querySelector: () => root };
let keyListener;
const document = { body, documentElement: node('html'), activeElement: body,
    querySelector: () => menuOpen ? {} : null,
    addEventListener(type, handler) { if (type === 'keydown') keyListener = handler; } };
const archiveImageView = { host: stage, files: rows.slice(1), index: 1 };
const context = vm.createContext({
    state, main, document, mobileSurface: null, modalBackdrop: { classList: { contains: () => modalOpen } },
    currentProjectId: () => 'p', archiveFileEditIsActive: () => editing,
    runAfterArchiveFileEditGuard(fn) { if (editing) guardAction = fn; else fn(); },
    resetArchiveFolderRowClick() {}, archiveLastFileRowClick: null,
    archiveSelectDesktopItem(_root, type, id) {
        state.archiveSelectedFileId = type === 'file' ? id : null;
        state.archiveSelectedFolderItemId = type === 'folder' ? id : null;
    },
    renderArchiveMain() { full++; }, archiveOpenFolder(id) { folder = id; },
    openArchiveDocumentViewer(id) { preview = id; },
    archiveImageView, archiveImageNavigate(index, focusStrip, focusStage) {
        imageNavigation = [index, focusStrip, focusStage];
        if (index >= 0 && index < archiveImageView.files.length) archiveImageView.index = index;
    },
    requestAnimationFrame(fn) { fn(); }
});
vm.runInContext(source.slice(0, end) + "document.addEventListener('keydown', handleArchiveFileKeyboard, true);", context);
const key = (target, name, flags = {}) => {
    const event = { target, key: name, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; },
        stopPropagation() {}, ...flags };
    keyListener(event);
    return event.defaultPrevented;
};
const ready = force => vm.runInContext('archiveKeyboardReady(' + Boolean(force) + ')', context);
ready();
assert.equal(focused, workspace);
assert.equal(key(workspace, 'ArrowDown'), true);
assert.equal(state.archiveSelectedFolderItemId, 'f');
assert.equal(focused, rows[0]);
assert.equal(key(focused, 'Enter'), true);
assert.equal(folder, 'f');
key(focused, 'ArrowDown');
assert.equal(state.archiveSelectedFileId, 'a');
key(focused, 'Enter');
assert.equal(preview, 'a');
key(focused, 'ArrowDown');
assert.equal(state.archiveSelectedFileId, 'b');
assert.ok(rows[2].scrolled);
assert.equal(key(input, 'ArrowDown'), false);
assert.equal(key(input, 'Enter'), false);
assert.equal(key(focused, 'ArrowUp', { altKey: true }), false);
assert.equal(key(focused, 'ArrowUp', { shiftKey: true }), false);
modalOpen = true; assert.equal(key(focused, 'ArrowUp'), false); modalOpen = false;
menuOpen = true; assert.equal(key(focused, 'ArrowUp'), false); menuOpen = false;
editing = true;
key(focused, 'ArrowUp');
assert.equal(state.archiveSelectedFileId, 'b');
assert.ok(guardAction);
editing = false;
guardAction();
assert.equal(state.archiveSelectedFileId, 'a');
assert.equal(full, 1);
state.archiveFileLayout = 'tiles';
document.activeElement = layout;
ready(true);
assert.equal(focused, rows[1]);
key(focused, 'ArrowRight'); assert.equal(state.archiveSelectedFileId, 'b');
key(focused, 'ArrowRight'); assert.equal(state.archiveSelectedFileId, 'b');
key(focused, 'ArrowDown'); assert.equal(state.archiveSelectedFileId, 'd');
key(focused, 'ArrowLeft'); assert.equal(state.archiveSelectedFileId, 'c');
key(focused, 'ArrowUp'); assert.equal(state.archiveSelectedFolderItemId, 'f');
state.archiveFileLayout = 'images';
document.activeElement = layout;
ready(true); assert.equal(focused, stage);
key(stage, 'ArrowRight'); assert.equal(imageNavigation.join(','), '2,false,true');
key(strip, 'ArrowLeft'); assert.equal(imageNavigation.join(','), '1,true,false');
assert.equal(key(input, 'ArrowRight'), false);
state.archiveFileLayout = 'details';
document.activeElement = input; ready(); assert.equal(document.activeElement, input);
activeRows = []; document.activeElement = body; ready(); assert.equal(focused, workspace);
assert.equal(key(workspace, 'ArrowDown'), false);
state.activeModule = 'People'; assert.equal(key(body, 'ArrowDown'), false);
console.log('Archive keyboard: immediate ownership, Details/Icons geometry, Image routing, guards, Enter and boundaries passed.');

const folderSource = fs.readFileSync(path.join(__dirname, '../../src/modules/archive/archive-create-dialogs.js'), 'utf8');
const folderStart = folderSource.indexOf('function openArchiveCreateFolderModal(');
const submitStart = folderSource.indexOf("    form?.addEventListener(\n        'submit',", folderStart);
const submitEnd = folderSource.indexOf('\n\n    renderParentPicker();', submitStart);
assert.ok(folderStart >= 0 && submitStart > folderStart && submitEnd > submitStart);
let submit, created, refreshed = 0, closed = 0, toast;
const location = { archiveView: 'files', archiveSelectedFolderId: 'current', archiveSearch: 'kept' };
const folderContext = vm.createContext({
    state: location,
    form: { addEventListener(type, handler) { assert.equal(type, 'submit'); submit = handler; } },
    nameInput: { value: ' New folder ', focus() {} }, selectedParentId: 'different-parent',
    createArchiveFolderRecord(name, parent) { created = [name, parent]; return { id: 'new' }; },
    closeModal() { closed++; }, renderArchive() { refreshed++; }, showToast(message) { toast = message; }
});
vm.runInContext(folderSource.slice(submitStart, submitEnd), folderContext);
submit({ preventDefault() {} });
assert.equal(created.join(','), 'New folder,different-parent');
assert.equal(refreshed, 1); assert.equal(closed, 1); assert.equal(toast, 'Folder created.');
assert.equal(location.archiveSelectedFolderId, 'current'); assert.equal(location.archiveSearch, 'kept');
folderContext.createArchiveFolderRecord = () => null;
submit({ preventDefault() {} });
assert.equal(refreshed, 1); assert.equal(closed, 1);
console.log('Archive folder submit: correct parent, current location retained, invalid creation does not refresh.');
