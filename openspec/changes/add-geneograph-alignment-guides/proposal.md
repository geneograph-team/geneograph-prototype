# Proposal

## Why

Moving Geneograph objects currently snaps only to the canvas grid, making it hard to line up cards and research objects with one another. Temporary alignment guides can make placement precise without changing the board model.

## What Changes

- Show temporary alignment lines while moving board objects near another visible object's left, center, or right edge, or top, center, or bottom edge.
- Magnetically align the moving selection to a nearby match. Alignment wins over grid snapping within its threshold; otherwise existing grid behavior applies.
- Treat a multi-selection as one moving rectangle, exclude its own objects from targets, and let locked visible objects serve as targets.
- Show a midpoint guide and snap an object when it is centered in the gap between two person cards. Exclude pencil drawings from alignment, both as moving objects and targets.
- While Shift is held during an object drag, constrain movement to the first dominant axis. In Board items, Shift-click selects the displayed object-row range from the anchor row to the clicked row.
- Increase alignment-guide line width for visibility, and clear guides at drag end or cancellation. Keep keyboard movement, resizing, connection editing, general equal-spacing guides, and saved board settings outside this change.

## Capabilities

### New Capabilities

- `geneograph-object-alignment`: Temporary guides and object-relative snapping during Geneograph object moves.

### Modified Capabilities

None. No main specs currently exist.

## Impact

Geneograph move handling, Board items selection, and canvas presentation in `src/geneograph.js` and `src/geneograph.css`; focused alignment and selection checks plus browser verification. No new dependency, board-file field, or project persistence.
