# Design

The duplicate review row uses the existing `placeReviewConnectionTotal()` helper.
`selectPlace()` refreshes nested `[data-place-pair-select]` card highlighting
as well as normal Place rows.

Merge opens directly, initially requiring a survivor-card selection. The
survivor ID is fixed for the entire staged merge; choosing the other card
resets field decisions. Each field displays the non-survivor's original
value on the left and the survivor's staged value on the right. Clicking
the right-directed arrow immediately updates the right-hand field to the
proposed value, with an updated visual style and an optional reset. The
previous separate result row is redundant and removed. The three long
instruction/warning paragraphs are omitted from this modal. This follows
Geneograph's sync-arrow affordance; data are staged only.

A pure `placeMergeFieldResult()` preflight validates proposed choices
without mutating records. Both original primary names and alternative
names are deduplicated into alternatives, even when the incoming name
becomes the new primary name. Missing properties copy automatically,
while conflicts default to visibly retaining the survivor's value.
Coordinates and approximate radius are independently selectable but
validated together; a radius without a center is not permitted.

On confirmation, `mergeSavedPlaces()` checks the pair and project again,
applies the validated survivor result (including intentional clears), and
retains the existing cross-module reference-retargeting, source-link
deduplication and issue-cleanup behavior. Cancel never writes.

Keep tested dark/light, EN/RU, keyboard, mobile widths and file://.
