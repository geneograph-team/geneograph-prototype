# Proposal

## Why

Family Tree currently scales fully detailed cards only between 70% and 130%. Zooming out cannot provide a useful overview of a larger family, and card text becomes too small before the relationships become legible as a map.

## What Changes

- Extend Family Tree zoom into a meaningful overview range and a closer detail range while preserving pointer or pinch anchoring.
- Present a clear 0–200% zoom-level display. The displayed value is a visual scale with 100% retaining today's card size; 0% represents the smallest useful overview rather than an invisible tree.
- Progressively simplify cards as zoom decreases: full details, photo and full name, given name, then a text-free relationship-map marker. Preserve gender colors and selection/focus distinction.
- Simplify parent placeholders and card-adjacent controls at overview levels without disabling selection, navigation, or accessible person identification.
- Keep Home's current behavior of restoring the default zoom and centering the focused person. Do not introduce a separate fit-all action in this change.

## Capabilities

### New Capabilities

- `family-tree-zoom`: Family Tree zoom range, visible zoom levels, semantic card detail, anchoring, and overview interaction.

### Modified Capabilities

None.

## Impact

- Family Tree zoom, card rendering, layout styling, parent placeholders, and related English/Russian accessibility labels in `src/modules/family-tree/` and localization as needed.
- No changes to person records, genealogy relationships, Geneograph boards, runtime dependencies, or direct `file://` loading.
