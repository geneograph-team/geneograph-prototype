# Tasks

## 1. Baseline and dependency map

- [x] 1.1 Record the current ordered local JS/CSS tags, first-party top-level declarations and immediate side effects, and local path references in a compact source map; verify it against `src/index.html` and targeted symbol searches.
- [x] 1.2 Repair the literal `\n` in README's CSS entry and document the current source ownership and direct `file://` constraint; verify rendered Markdown and run `git diff --check`.
- [x] 1.3 Capture a browser baseline for startup and representative Family Tree, People, Geneograph, Albums, Archive, Notes, and Places views in English/Russian; verify console state and preserve findings for later comparisons.

## 2. Path-only source organization

- [x] 2.1 Move small core and seed scripts into `core/` and `seed/`, update their ordered `index.html` tags and docs, and verify all paths resolve plus direct `file://` startup/console and `git diff --check`.
- [x] 2.2 Move already isolated shared helpers and resource-picker scripts into `shared/` without splitting code; update references/docs and verify affected picker and media flows in both languages plus `git diff --check`.
- [x] 2.3 Move already isolated feature scripts into `modules/<feature>/`, keeping relative tag order and code unchanged; update source map and verify the affected module workflows and console plus `git diff --check`.
  - Existing limitation accepted by the user: Geneograph PNG export fails for a Luna portrait missing from the cloned stage; the moved exporter is otherwise unchanged. Archive's script-relative PDF import path was updated for its new location.

## 3. Geneograph extraction

- [x] 3.1 Extract board model, normalization/defaults, and collection/library functions from `geneograph.js` into owner files; verify seeded board loading, library/collection actions, import/export, console, and `git diff --check`.
- [x] 3.2 Extract canvas rendering, object/connection rendering, and inspector functions by coherent dependency boundary; verify board appearance, selection, English/Russian inspector states, and `git diff --check`.
  - The user confirmed no new errors; Chromium reported an advisory about an existing form field lacking an id/name. The split is text-identical to the original file.
- [x] 3.3 Extract pickers/modals and editor pointer/keyboard interaction without reordering initializers; verify add/replace, drag, alignment, undo/redo, focus, console, and `git diff --check`. Update the Geneograph source map after this pass.

## 4. Archive extraction

- [x] 4.1 Extract source/link and folder/file model operations from `archive.js`; verify links, folder/file actions, state integrity, console, and `git diff --check`.
- [x] 4.2 Extract Archive library, sidebar, inspector, and preview functions; verify list/grid, selection, right-click menus, preview, English/Russian rendering, and `git diff --check`.
- [x] 4.3 Extract Archive upload, move, and related dialogs; verify add/remove staged files, folder destinations, cancel/confirm, focus, console, and `git diff --check`. Update the Archive source map.

## 5. Localization extraction

- [x] 5.1 Split ordered UI and sample-data dictionaries out of `localization.js` by module/domain; verify duplicate-key detection, representative translated values, English/Russian startup, and `git diff --check`.
- [x] 5.2 Keep translation lookup and DOM-localization runtime in a clearly owned file, preserve its initialization order, update source map, and verify language switching, dynamic modal content, console, and `git diff --check`.

## 6. Family Tree and People extraction

- [x] 6.1 Separate Family Tree viewport/layout interaction, person hero/timeline, and relationship workflows from `family-and-shared.js` where dependency mapping supports it; update source map and verify zoom/pan, relatives, editing, console, and `git diff --check`.
- [x] 6.2 Separate People directory/filter, profile, and person-edit workflows from `people.js`; update source map and verify directory, the current profile view, editing, English/Russian rendering, and `git diff --check`.

## 7. Remaining module ownership

- [x] 7.1 Separate Albums photo-management and album-view workflows where functions form coherent units; update source map and verify photo pickers/uploads, album assignment, console, and `git diff --check`.
- [x] 7.2 Separate Notes browser, editor, and linking workflows; trace the Archive file/person dialogs currently in `notes.js` before moving them to Archive or a shared owner. Verify notes and Archive tagging flows, update source map, and run `git diff --check`.
- [x] 7.3 Separate Places map/route, directory, inspector, and editor workflows; trace Publish draft functions currently in `places.js` before moving them to Publish. Verify map/list, place editing, Publish remains disabled, update source map, and run `git diff --check`.
- [x] 7.4 Review `shared-media.js` and `projects-tree-layout.js` for coherent shared versus Projects/Family Tree ownership, extract only independent units, update source map, verify affected views, and run `git diff --check`.

## 8. CSS organization

- [x] 8.1 Move existing shared/core and feature stylesheets to owner directories without changing rule order; update tags and CSS `url(...)` paths, verify direct file loading, affected layouts, and `git diff --check`.
- [x] 8.2 Split Geneograph CSS at complete board/library/inspector seams; update ownership docs and verify cascade, focus, desktop/phone states in English/Russian, and `git diff --check`.
- [x] 8.3 Split Archive and Albums CSS in separate module passes at complete view/modal seams; update ownership docs for each and verify affected layouts and focus in both languages plus `git diff --check` after each pass.
- [x] 8.4 Split Family Tree/People and Notes/Places CSS in separate module passes only where ownership is clear; update ownership docs for each and verify affected responsive states in both languages plus `git diff --check` after each pass.

## 9. Static assets and documentation

- [x] 9.1 Inventory exact non-board asset references and move one category at a time into `assets/photos/`, `documents/`, `covers/`, or `ui/`; preserve IDs and board images, verify every local path and affected view, and run `git diff --check` after each category.
- [x] 9.2 Update README, AGENTS, and the design guide to the actual final paths and ownership boundaries, without copying large inventories; verify links and example paths resolve and run `git diff --check`.

## 10. Integration review

- [x] 10.1 Check all local `index.html` tags and CSS asset URLs resolve, no duplicate top-level binding was introduced, and the final load order matches the dependency map; verify direct `file://` startup and console.
- [x] 10.2 Review active modules and shared modals at desktop and phone widths in English/Russian, including focus and key edit/selection flows; record any remaining limitations, run `git diff --check`, and confirm no runtime dependency or application behavior was added.

## Workflow follow-up

- Archive this change only after the completed tasks and review are accepted.