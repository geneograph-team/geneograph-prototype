> **Archive note (2026-11-18):** Remaining checklist items were closed administratively at the founder's direction. This does not establish that previously pending browser/QA checks were executed.

# Tasks

## Renderer

- [x] Separate MapLibre basemap and temporary MapTiler geocoding config.
- [x] Replace Leaflet assets with MapLibre CSS and lazy ESM loading.
- [x] Add renderer adapter for markers, draft dragging, map fitting,
  historical route GeoJSON and future geographic-area overlays.
- [x] Port map lifecycle, context menu, resizing, theme and teardown.

## Workflow

- [x] Keep file:// non-map place workflows usable.
- [x] Wait for hosted-map readiness before leaving Add/Edit Place.
- [x] Preserve unsaved drafts and manual input on map failure.
- [x] Adapt guided-tour map selectors and English/Russian fallback copy.

## Verification

- [x] Add focused adapter/contract checks and execute their logic in V8.
- [x] Verify syntax and changed-file scope.
- [x] Run native Node, UI-color, and git diff checks from a checkout.
- [x] Test hosted Chromium and Firefox, both languages/themes,
  routes, selection, position picking, context menu and viewport.
- [x] Test file:// startup, editing, missing-position save, and
  simulated CDN/WebGL/style failures in a real browser.
- [x] Archive this change after browser QA and maintainer review.
