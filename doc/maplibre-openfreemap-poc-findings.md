# MapLibre + OpenFreeMap proof-of-concept findings

**Issue:** [#156](https://github.com/geneograph-team/geneograph-prototype/issues/156)
**Related work:** [#157 — renderer migration](https://github.com/geneograph-team/geneograph-prototype/issues/157), [#154 — approximate places](https://github.com/geneograph-team/geneograph-prototype/issues/154), [#158 — geocoding](https://github.com/geneograph-team/geneograph-prototype/issues/158)
**Reviewed:** 2026-11-09

## Outcome

**Proceed to design and implementation of #157.** The isolated prototype was
successfully loaded from a locally hosted environment, and the user reported
that all requested interactive tests passed. The experimental page, JavaScript,
styles, geometry helper, and test script are intentionally **not retained** in
the repository, per the product owner's decision.

The normal Places renderer remains Leaflet + MapTiler until #157 is
implemented and reviewed. This document is a decision record, **not** a claim
that the production migration is complete.

## Evaluated architecture

- **Renderer:** MapLibre GL JS v6.16.0 (ES-module distribution).
- **Vector basemap:** OpenFreeMap Liberty, with Dark as an optional style.
- **Map interactions:** selection and draggable draft markers, click-to-set
  coordinates, pan/zoom and view restoration, resize, historical route lines
  and chronological stops, and teardown/reinitialization.
- **Approximate place:** a center in longitude/latitude with radius in metres,
  drawn as a geodesic GeoJSON polygon rather than a screen-pixel circle.
  A route uses its representative center; this is not a historical boundary.
- **Fallback:** hosted HTTP(S) is allowed for interactive maps, but the
  application must still work from `file://` for place-list and manual
  coordinate workflows, including when the renderer is unavailable.

## Verification

- Source-level JavaScript syntax and spherical-geodesic geometry checks
  passed during the proof of concept. A 96-segment, 5 km closed polygon had
  negligible numerical radius deviation under the same spherical model.
- The user supplied a browser screenshot showing the OpenFreeMap basemap,
  map attribution, markers, and chronological route rendering successfully.
- The user subsequently confirmed that the remaining requested tests also
  passed: marker dragging, changing the approximate-area radius, dark theme,
  and map reinitialization.
- Browser versions, network logs, formal accessibility testing, and a
  reproducible automated browser run were **not** independently recorded.
  Those checks remain necessary in the production migration.

## Follow-up requirements

1. Implement a small renderer-neutral map adapter in #157 without altering
   canonical place records. Preserve keyboard interaction, marker focus,
   route fitting, layer lifecycle, theme changes, and failures/retry.
2. Keep the application usable via `file://`. In unavailable-map states,
   **Choose on map** must not discard or close an unsaved place draft;
   manual latitude/longitude entry and save without position must remain
   usable. The PoC did not verify the integrated production fallback.
3. Support a GeoJSON geographic-radius overlay from the adapter for #154.
   Exact points, unmapped places and approximate areas must remain distinct.
4. **Fix attribution duplication:** the PoC screenshot showed repeated
   OpenFreeMap/OpenMapTiles/OSM credits along the map footer. In #157 rely
   on the style's provided attribution where complete, adding only missing
   legally required credits. Verify correct readable attribution in both
   map themes.
5. MapTiler geocoding remains in use and is separately tracked in #158.
   OpenFreeMap replaces vector basemap hosting, **not place search**.
6. OpenFreeMap's public service is free for commercial use but does not
   provide an SLA. Keep a provider fallback strategy and recheck the
   published terms, attribution and reliability before commercial launch.
7. Verify Chromium and Firefox, EN/RU, both themes, keyboard/mobile, offline
   and WebGL failures, and direct-file non-map workflows before merging #157.

## Cleanup decision

The experimental assets under `src/experiments/maplibre-poc/`, the
PoC-specific test script, and the now-obsolete active OpenSpec PoC change
folder were removed from the open #159 branch. Only this evaluation record
should be merged. Do **not** deploy or maintain an experimental map page as
part of the released prototype.
