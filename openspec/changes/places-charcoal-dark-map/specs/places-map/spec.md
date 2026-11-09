# Places map style specification delta (#163)

## ADDED Requirements

### Requirement: Softer readable Dark basemap

The Places map SHALL retain its OpenFreeMap Dark vector style and
apply GeneoGraph-owned paint overrides that make land/background,
roads, boundaries and settlement labels readable on charcoal.

#### Scenario: Dark map loads
- **WHEN** a hosted Places map initializes in dark application theme
- **THEN** the paint palette is applied to available OpenFreeMap Dark layers
- **AND** water, parks, roads and labels remain individually distinguishable
- **AND** map tiles, glyphs, sprites, markers and attribution are preserved

#### Scenario: Unsupported upstream layer
- **WHEN** an override targets a layer missing from the upstream style
- **THEN** the override is skipped rather than failing map initialization

### Requirement: Stable theme transitions

The Places map SHALL apply a palette only when appropriate for the
active theme and SHALL NOT reload the underlying style for redundant
theme-change events.

#### Scenario: Light theme
- **WHEN** the application switches to light
- **THEN** the default OpenFreeMap Liberty style is used without
  charcoal paint overrides

#### Scenario: Repeated theme switch
- **WHEN** light and dark themes are toggled repeatedly
- **THEN** each actual switch loads its corresponding style once
- **AND** Dark overrides reapply after each style load
- **AND** place markers and route overlays remain available
