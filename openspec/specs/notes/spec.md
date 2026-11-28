# Notes

## Requirements

### Requirement: Independent bulk selection

The Notes browser SHALL keep its existing search/filter/sort controls and
reserve a stable leading checkbox column in each note row. The favourite
action SHALL precede the individual More action on the right. On fine-pointer
hover devices idle checkboxes SHALL be hidden by opacity, revealed on row
hover or focus within the row, and visible on all rows during active bulk
selection. Touch/coarse-pointer devices, including hybrid devices, SHALL
retain visible controls. The 16px row checkbox glyph SHALL align with the
first title line without shifting text or action positions. Use shared
checkbox styling and accessible labels rather than a new checkbox skin.

Checking a note SHALL NOT open it or change the current editor. The opened
note retains its active-card styling independently of the subtle bulk
selection tint. Shift-click selects a range in current filtered/sorted
order. A contextual action bar SHALL appear only with active selection,
above the scrolling list, with selected count, select all matching results
(including indeterminate state) and clear selection. Escape clears
selection in the browser without taking editor or modal shortcuts.

Selection SHALL be project, collection/view and linked-context local,
retain eligible records through compatible refreshes and sorting, prune
excluded records and clear on module exit or context change. The open
editor and its scroll/content SHALL remain independent of checked notes.

### Requirement: Scoped bulk note management

The contextual bar SHALL expose Favourite, Collection and Archive actions
and More (Duplicate and permanent Delete). Explicit add/remove favourite
and archive/unarchive choices SHALL affect only applicable notes and
report actual affected counts. Collection management SHALL use the existing
picker with checked/unchecked/indeterminate membership and selected-note
counts, preserve untouched partial and unrelated memberships, and stage
new bulk collections until Save. Cancel SHALL NOT commit staged bulk changes.

Actions SHALL capture project, context and selected IDs, revalidate visible
targets before mutation, and reject stale targets rather than operate on
hidden or cross-project subsets. Batch operations SHALL preserve unrelated
records and use one scoped invalidation and render where applicable.
Duplication uses existing single-note copy semantics without navigating
away from the open editor. Permanent deletion SHALL confirm once with
count and irreversibility, clean note relationships and source/legacy
links consistently with single deletion, and safely close a deleted
note's editor. The current board model has no note-backed node type.
No new persistent record schema or global undo mechanism is introduced.

### Requirement: Notes editor history

Notes SHALL expose accessible Undo and Redo buttons at the start of its
rich-text toolbar. They SHALL use the active Quill instance's History
and existing canonical user-change save flow, keeping stored plain text
and Delta synchronized. Controls reflect available history and preserve
native editor shortcuts. Compatible refreshes SHALL retain the editor
instance and history; note switches and incompatible content replacement
SHALL isolate history per record and remove stale listeners on teardown.
Other rich-text editors and the plain-text fallback SHALL remain unchanged.
New controls SHALL support EN/RU, existing theme tokens and responsive
keyboard and touch interactions.
