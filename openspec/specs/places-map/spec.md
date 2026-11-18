# Places mapping

## Requirements

### Requirement: Hosted vector map and local fallback
Hosted HTTP(S) Places SHALL render vector maps with pinned MapLibre GL JS
and OpenFreeMap map data, preserving marker/route selection, attribution,
and the active project. Direct `file://` opening SHALL retain list and
manual coordinate entry even without an interactive map.

#### Scenario: Map is unavailable
- **WHEN** the hosted map fails to load or the prototype opens via `file://`
- **THEN** users can still add and edit Places with or without coordinates

### Requirement: Current map styles
Light SHALL use upstream OpenFreeMap Liberty. Dark SHALL use the
GeneoGraph-maintained local Liberty-derived
`src/assets/map-styles/liberty-dark.json` style. The obsolete Dark paint
override approach is historical and is not the current runtime.

#### Scenario: Change effective theme
- **WHEN** a hosted Places map changes between Light and Dark
- **THEN** the corresponding style is used while Place routes/markers
  remain available

### Requirement: Approximate geographic areas
A Place MAY have exact coordinates, a representative center and
`approximateRadiusMeters` from 1 to 1,000,000 metres, or no identified
position. A radius SHALL require valid center coordinates and indicate
uncertainty rather than a physical or administrative boundary.

#### Scenario: Map an approximate location
- **WHEN** a Place has a valid center and radius
- **THEN** the approximate area is represented geographically, while
  route calculations use the representative center rather than imply
  measured travel
