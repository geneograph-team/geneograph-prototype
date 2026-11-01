# Design

## Context

See proposal.md for motivation. Geneograph stores node rectangles in board coordinates. Pointer movement converts screen coordinates through current zoom, then `move-group` computes one translation for all selected nodes. Snap to grid currently quantizes that translation; live geometry updates without a full editor render. The board stage is scaled and its bounds can expand. The existing undo snapshot is taken at drag start.

## Goals / Non-Goals

**Goals:** Object-relative alignment, midpoint placement between person cards, Shift axis locking, Board items range selection, visibly thicker guides, stable behavior across zoom, and no board-schema change.

**Non-Goals:** Resizing, connection endpoints or waypoints, general equal-spacing guides, keyboard nudging, persistent guides, a new settings toggle, or automatic rearrangement.

## Decisions

- Compute guides from node bounding rectangles, not DOM measurements. Board coordinates remain the single source for snapping and preserve behavior under pan and zoom. Test left/center/right and top/center/bottom independently.
- Convert a roughly 6-screen-pixel capture radius to board units using zoom. Compare the raw desired selection bounds with stationary visible target bounds before grid quantization; a qualifying match replaces that axis's grid result. Otherwise retain existing grid movement. Use one deterministic nearest match per axis and prefer the current match until it leaves a slightly larger release radius to avoid flicker.
- Use the combined bounds of all moving nodes. Exclude every moving node, including panel descendants moved with a selected panel; skip hidden targets, pencil drawings, and ancestor/descendant self-matches. Do not show guides when the dragged selection contains a pencil drawing. Locked visible nodes remain targets. Keep the same delta for all moving nodes and attached manual connection waypoints.
- For the new midpoint case, use two stationary visible person-card rectangles on a common row or column. Compare the moving selection's center with the midpoint of the two card centers, snap the matching axis within the same zoom-scaled threshold, and draw a guide through that center. Do not require the moving bounds to fit in the gap: seeded person cards are wider than some adjacent gaps. Do not infer midpoints from other object types or arbitrary equal-spacing chains. Resolve a competing direct alignment by nearest correction, with a deterministic tie rule.
- When Shift is held during a move, choose the dominant axis from the first meaningful pointer displacement, hold the other axis at its starting coordinate, and run object alignment and grid fallback only on the unlocked axis. Releasing Shift resumes free movement; pressing it again establishes a new axis lock. Keep resize, connection, and keyboard gestures unchanged.
- In Board items, a plain object-row click establishes a range anchor. Shift-click selects every displayed object row between that anchor and the clicked row, inclusive, using rendered order; connection rows are not selected. If the anchor is no longer displayed after search, filtering, or collapse, treat Shift-click as a single selection and establish a new anchor. Preserve Ctrl/Cmd toggle behavior and canvas selection behavior.
- Render at most one horizontal and one vertical guide in a pointer-events-none overlay inside the scaled stage. Increase line thickness from the initial 1px to 2px in screen space so zoom does not make the guide disappear. Give each line a span between the relevant moving and target rectangles, and position it with the same board-bounds offset as nodes. Clear it on pointerup, pointercancel, drag abort, and full render; never add it to diagram data or snapshots.
- Keep this feature on by default without another canvas control. A setting would add persistence and localization for a behavior that can first be evaluated directly; it can be proposed separately if needed.

## Risks / Trade-offs

- **Grid expectation:** alignment can leave a node between grid points → show the guide at capture and restore grid snapping immediately when no target qualifies.
- **Dense boards:** many rectangles could produce noisy or costly matching → evaluate only visible stationary nodes, choose one match per axis, and do not rebuild the whole board on each pointermove. Limit midpoint pairs to nonoverlapping person cards sharing the relevant row or column.
- **Panel geometry:** parent and child rectangles can align trivially → exclude moving descendants and ancestor/descendant self-matches; verify panel cases in a browser.
- **Zoom and rerender:** screen thresholds and guide positions can drift → derive threshold from current zoom and clear guides whenever the editor rerenders.

## Migration Plan

No migration. The change uses only transient drag state. Removing the guide calculation and overlay returns existing grid movement; board files remain compatible.
