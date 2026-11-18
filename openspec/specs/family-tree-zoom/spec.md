# Family Tree zoom

## Requirements

### Requirement: Visible 0–200 display range
Family Tree SHALL map its bounded physical zoom range to a displayed
0–200% level. At 0% the overview remains visible; at 100% the default
scale is restored.

#### Scenario: Reach the overview
- **WHEN** the user zooms out repeatedly
- **THEN** the displayed level stops at 0% and the tree remains usable

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
