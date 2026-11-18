# Spec Delta

## ADDED Requirements

### Requirement: Hosted vector basemap without MapTiler tiles

The Places map SHALL use MapLibre with OpenFreeMap for vector map
rendering, preserve marker and route semantics, and expose compliant
attribution from the map style.

#### Scenario: Select and view an existing place
- **WHEN** a mapped place is selected in the map or list
- **THEN** marker selection and inspector agree, with its viewport
  preserved when appropriate

#### Scenario: Change UI theme
- **WHEN** the theme changes between Light and Dark
- **THEN** the map style updates without dropping place markers or routes

### Requirement: No-map editing remains functional

Places SHALL support list/manual coordinate entry through file:// or
when hosted map resources cannot be initialized.

#### Scenario: Map is unavailable from Add/Edit Place
- **WHEN** the user attempts Choose on map and mapping cannot load
- **THEN** the editor retains unsaved fields, stays open, and expands
  manual coordinates
- **AND** a place can still be saved without coordinates

### Requirement: Renderer supports future geographic-area overlays

The map adapter SHALL accept GeoJSON geographic polygons for area
fill/outline display independently of the stored place data model.

#### Scenario: An approximate-area polygon is provided
- **WHEN** future issue #154 supplies a geographic-radius polygon
- **THEN** the adapter draws or updates the polygon without using
  a screen-pixel radius
