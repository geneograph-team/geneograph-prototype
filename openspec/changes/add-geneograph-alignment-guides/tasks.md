# Tasks

## 1. Alignment calculation

- [x] 1.1 Add a pure alignment calculation for node rectangles, selected bounds, axis matches, zoom-scaled capture and release thresholds, and deterministic tie-breaking; verify with one focused dependency-free test for edge, center, dual-axis, group, locked/hidden, and no-match cases.
- [ ] 1.2 Integrate the calculation into `move-group` before grid snapping, preserving one translation for selected nodes and attached manual waypoints; verify grid-on priority, grid fallback, grid-off movement, and undo/redo on a sample board.
- [x] 1.3 Add midpoint candidates for gaps between visible person cards, with fit and shared-row/column checks, and exclude pencil drawings from both moving and target alignment; extend the focused geometry test.

## 2. Guide presentation and lifecycle

- [ ] 2.1 Make the pointer-events-none guide lines 2px in screen space, update at most one line per axis during movement, and verify edge and midpoint placement at 25%, 100%, and 200% zoom and after pan.
- [x] 2.3 Add Shift axis locking to object dragging before alignment and grid snapping; verify dominant-axis choice, release/repress behavior, group movement, and no effect on resize or connection gestures.
- [ ] 2.2 Clear transient matches and lines on release, cancellation, aborted drags, and editor rerender; verify no stale guides after switching boards or tools and no guide data in `.ggboard` export.

## 3. Board items selection

- [x] 3.1 Add Shift-click selection of the inclusive displayed object-row range, preserving the plain-click anchor and Ctrl/Cmd toggle; verify filtered/collapsed anchor fallback and keyboard selection.

## 4. Integration checks

- [ ] 4.1 Check single objects, mixed object types, multi-selection, panels, hidden and locked targets, pencil drawings, midpoint guides, Shift axis locking, and Board items ranges in English/Russian browser views; confirm connection, resize, keyboard move, and grid controls retain their current behavior.
- [x] 4.2 Run `git diff --check` and strict OpenSpec validation after the expanded change; verify the unrelated working-tree CSS edit remains untouched.
