# Design

## Context

See [proposal.md](proposal.md) for motivation and [the zoom spec](specs/family-tree-zoom/spec.md) for behavior. Family Tree currently stores physical scale in `state.treeZoom`, clamps it to 70–130, transforms the whole tree stage, and adjusts scroll offsets to preserve an anchor. Its cards and relationship lines share stage coordinates. The prototype must continue to open directly via `file://`.

## Goals / Non-Goals

**Goals:** Make the displayed zoom range intelligible, expose a useful overview, retain stable relationship geometry, and keep existing person and missing-parent actions available.

**Non-Goals:** Rebuild the tree layout, persist a new zoom preference, change person data, add an automatic fit-all command, or add a dependency.

## Decisions

### Map displayed levels to physical scale

Use a displayed 0–200 level and map it linearly to physical 20–180% scale: `physical = 20 + 0.8 × displayed`. Thus displayed 100% retains today's physical 100%; displayed 0% remains visible. Keep physical scale in `state.treeZoom` and centralize conversion, clamping, and display formatting in small helpers. Zoom buttons and wheel move by ten displayed points; pinch can remain continuous and the label rounds to an integer. Home restores displayed 100% and its existing focus-centered position. This avoids treating 0% as a literal CSS scale of zero while preserving existing stage, scroll, and full-screen calculations.

### Simplify content without changing relationship geometry

Use four display bands as initial cutoffs: 0–29 marker only, 30–54 given name, 55–84 portrait or initials plus full name, and 85–200 full card. Apply a detail-level class or attribute to the existing stage and use the owning Family Tree stylesheet to control visibility and presentation. Generate a separate given-name field from the person record rather than splitting the formatted name. Keep the full formatted name in the card's accessible label and tooltip. Preserve fixed card and connector geometry across bands so lines do not jump when a threshold is crossed; the reduced content is visually centered within the same hit area. Hidden card actions remain reachable through selection and the existing inspector. Simplify missing-parent placeholders at low levels while preserving their click and keyboard behavior.

Changing CSS stage presentation in place avoids rerendering the entire tree on every wheel or pinch event. The band thresholds are visual tuning values, not stored data. A continuously scaled full card was considered but makes labels illegible; rebuilding a distinct tree layout per band would risk connection jumps and expand this change substantially.

### Keep zoom anchored

Continue to calculate the world point under the wheel or pinch gesture before changing physical scale, then restore its screen position after the stage scale and detail band update. Button zoom uses the viewport center. Do not scroll to a selected person merely because the detail band changes. Keep the current Home behavior separate from zoom buttons.

## Risks / Trade-offs

- **Cards and parent targets become physically small near 0%.** → Keep their full world-space hit area, visible selection feedback, keyboard access, and inspector actions; check the low-level pointer and touch experience in browser QA.
- **Stage transitions may reveal abrupt content changes.** → Use a small number of bands and tune cutoffs against readable English and Russian names, portraits, and card widths.
- **Scale changes may expose existing scroll or line-coordinate assumptions.** → Audit all Family Tree reads of `state.treeZoom`, including full screen and reset, and verify anchor behavior across each threshold.
- **0% may be read as literal size.** → Treat the control as a zoom level display; keep the tree visible and make the overview state apparent through the cards.
