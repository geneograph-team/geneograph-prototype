# Notes

## ADDED Requirements

### Requirement: Independent bulk selection

Notes SHALL display shared checkboxes, keep the open note independent of checked notes, select ranges in current filtered order and show a contextual toolbar only during selection. Selection SHALL be project/view/context local, prune hidden results and clear on module exit. Favourite, collection, archive, duplicate and permanent delete actions SHALL operate on revalidated captured visible records and preserve unrelated data. Delete SHALL confirm once and remove note relationships and source links. Collection membership decisions SHALL preserve untouched partial membership and apply only explicit changes. Batch changes SHALL invalidate and render once.

### Requirement: Notes editor history

Notes SHALL offer accessible Undo and Redo controls using the active Quill instance's History and canonical user-change save flow, retain history on compatible refreshes, isolate history per note and remove handlers on teardown. Other editors and the plain-text fallback SHALL remain unchanged.
