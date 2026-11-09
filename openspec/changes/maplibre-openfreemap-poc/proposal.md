# Proposal

## Why

GeneoGraph's Places map currently uses Leaflet with MapTiler raster tiles and a
separate MapTiler geocoding API. Before migrating to a free, commercial-compatible
vector basemap, we need evidence that MapLibre GL JS can reproduce the essential
map interactions and render a geographic-radius area for #154.

## What Changes

- Add an **isolated**, static HTML/CSS/JavaScript experiment at
  `src/experiments/maplibre-poc/` using pinned MapLibre GL JS 6.16.0 and the
  OpenFreeMap Liberty basemap.
- Exercise keyboard-accessible markers, draggable coordinates, map clicks,
  viewport persistence, route lines and geodesic approximate-area overlays.
- Offer a dark-basemap preview, EN/RU controls and an explicit `file://` or
  unavailable-map fallback with functioning numeric coordinates/radius.
- Add dependency-free geometry/isolation checks and a browser-verification plan.
- Keep the production Places renderer and all existing place records unchanged.

## Capabilities

### New Capabilities

- `places-map-renderer-poc`: A standalone, non-production evaluation page for
  a hosted vector map and offline-compatible manual geometry controls.

### Modified Capabilities

None. The production Places map and MapTiler geocoder are not changed.

## Impact

The experiment is a separate page and is not referenced by `src/index.html`.
It introduces a **PoC-only CDN dependency** on MapLibre GL JS, not a build
tool or dependency in the normal application. Future migration #157 depends
on successful hosted browser verification. Approximate-place behavior remains
tracked in #154 and geocoding replacement in #158.
