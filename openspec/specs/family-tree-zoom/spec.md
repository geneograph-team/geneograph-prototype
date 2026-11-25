# Family Tree zoom

## Requirements

**Current implementation note:** The legacy display mapping is still present in
code. The founder retired the 0–200% display-range requirement on
2026-11-25. It is no longer normative; replacement by actual-scale zoom,
including Fit, is tracked in the [active migration delta](../../changes/elk-d3-tree-migration/specs/family-tree-zoom/spec.md).

### Requirement: Progressive card details
Family Tree SHALL adapt person detail to zoom, progressing from full
cards to names, given names, and minimal markers without changing
genealogical relationships.

#### Scenario: View markers
- **WHEN** the tree is shown at the smallest overview stage
- **THEN** person selection and the inspector remain usable

### Requirement: Viewport continuity
Zoom controls SHALL preserve the interaction anchor where possible;
Home SHALL restore the default level and focused-person context.

#### Scenario: Zoom by pointer
- **WHEN** the user zooms around a location
- **THEN** the tree position remains approximately anchored
