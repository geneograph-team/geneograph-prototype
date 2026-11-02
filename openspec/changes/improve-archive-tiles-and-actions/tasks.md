# Tasks

## 1. Tile layout

- [ ] 1.1 Rework desktop file and folder tile markup and CSS with bounded width, reserved favorite space, two-line names, and no tile metadata; verify no overlap or horizontal overflow at wide, intermediate, and narrow desktop widths in English and Russian.
- [ ] 1.2 Verify selected, favorite, hover, focus, and missing-preview tile states; keep full names available through title or accessible labeling.
- [x] 1.3 Suppress tile checkboxes and the bulk bar for a single selected item; verify the inspector remains available and multi-selection reveals bulk controls.

## 2. Desktop selection

- [x] 2.1 Add a transient visible-order selection anchor and plain/Ctrl/Cmd/Shift click behavior for tile and table items; verify inclusive ranges across folders and files in both directions.
- [ ] 2.2 Rebase or clear the anchor after filtering, sorting, navigation, and layout changes; add focused browser regressions proving hidden items are never selected and checkbox, inspector, double-click, and drag behavior still work.

## 3. Context actions

- [ ] 3.1 Adapt the existing item menu to open at a right-click position for main-view files and folders and sidebar folders; verify sidebar right-click does not navigate or alter the main selection, and More buttons remain keyboard-operable.
- [x] 3.2 Reuse existing bulk action eligibility when right-clicking a selected group; add focused regressions for single-item, mixed selection, invalid folder moves, and preserving the selection until an action or explicit clear.
- [ ] 3.3 Check English and Russian menu labels and keyboard focus/close behavior; run the focused Archive regressions and `git diff --check`.

## Workflow follow-up

- Archive the OpenSpec change after implementation and review.