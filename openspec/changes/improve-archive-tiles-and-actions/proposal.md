# Proposal

## Why

Archive image tiles are too narrow for file names, and the favorite star can overlap the text. Desktop selection relies on checkboxes, while item actions require finding the More button; the folder sidebar has no equivalent context menu.

## What Changes

- Give desktop file and folder tiles enough width for a two-line name and a favorite indicator in reserved space.
- Add Explorer-style desktop selection: plain click selects one item, Ctrl/Cmd-click toggles an item, and Shift-click selects a contiguous range in the visible file-and-folder order.
- Open item actions on right-click for files and folders in tile and table views, and for sidebar folders. Reuse existing actions. Preserve a selected group on right-click and show applicable bulk actions.
- Keep mobile list and touch behavior, keyboard operation, double-click to open, and the current in-memory prototype data model.

## Capabilities

### New Capabilities

- `archive-item-browsing`: Archive tile presentation, desktop selection, and contextual actions for visible files and folders.

### Modified Capabilities

None.

## Impact

- Archive rendering and event handling in `src/archive.js`, tile and menu styles in `src/archive.css`, and any new English/Russian action labels in `src/localization.js`.
- Focused Archive browser regressions in `tests/`. No backend, package, data migration, or durable storage.