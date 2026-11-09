# Spec Delta

## ADDED Requirements

### Requirement: Isolated hosted mapping experiment

A separately accessible page SHALL demonstrate MapLibre and OpenFreeMap
without changing GeneoGraph's normal Places renderer, geocoder, or project
records. It SHALL require no application build step or map API key.

#### Scenario: Open the PoC over HTTP(S)
- **WHEN** a supported browser opens the experiment with network and WebGL2
- **THEN** it attempts to render an attributed vector map and route fixtures
- **AND** it does not write to the main GeneoGraph project

### Requirement: Geographic radius and route remain coupled

The experiment SHALL represent an approximate place with a geographic
center and radius in metres, calculating a GeoJSON geodesic polygon.

#### Scenario: Change the radius
- **WHEN** a user changes the numeric radius from 5 to 10 km
- **THEN** the boundary updates to a 10 km geographic radius
- **AND** its on-screen size adjusts with map zoom

#### Scenario: Move the center
- **WHEN** a user drags the approximate marker or picks map coordinates
- **THEN** the boundary and chronological route pass through the new center

### Requirement: Map failure never blocks numeric editing

The standalone page SHALL offer a clear unavailable-map state and retain
numeric center/radius editing regardless of map availability.

#### Scenario: Open from disk
- **WHEN** a user opens the standalone page via \`file://\`
- **THEN** the map is explicitly unavailable, but numeric editing remains

#### Scenario: Change language and theme
- **WHEN** a user switches English/Russian or light/dark
- **THEN** the controls and vector style update without losing geometry
