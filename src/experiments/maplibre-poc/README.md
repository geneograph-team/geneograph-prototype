# MapLibre + OpenFreeMap proof of concept

Standalone experiment for [#156](https://github.com/geneograph-team/geneograph-prototype/issues/156).
The production Places map is unchanged.

## Run

From the repository root:

```sh
python -m http.server 8000 --directory src
```

Open:

- http://127.0.0.1:8000/experiments/maplibre-poc/index.html
- http://127.0.0.1:8000/experiments/maplibre-poc/index.html?lang=ru

After this change merges, the experiment should also be reachable at:

https://geneograph-team.github.io/geneograph-prototype/experiments/maplibre-poc/

It is not linked from the production prototype and requires network access,
MapLibre's ES-module CDN and WebGL2. It makes no requests to MapTiler.

## What to verify manually

1. Wait for the OpenFreeMap Liberty basemap and attribution to appear.
   Check the browser console for worker, style, glyph and tile errors.
2. Select each route stop from the list and via keyboard-focusable map
   markers. Observe the 1875 → 1905 → 1920 route.
3. Drag the middle green marker or click the map. Confirm both the
   uncertainty circle and the route's middle point follow the center.
4. Change the radius from 5 km to 10 km. Zoom in/out: the *geographic*
   extent remains 10 km even though the displayed pixels change.
5. Fit the route, pan/zoom, refresh the page, toggle route visibility,
   resize to phone width and use the map's keyboard controls.
6. Switch to Dark and back to Liberty, then to Russian and back to
   English. Verify overlays, attribution, status, and focus.
7. Destroy and reinitialize the map several times. Check the console for
   unhandled errors and confirm the markers are not duplicated.
8. Use DevTools to disable network, refresh, and verify an explicit
   fallback. Try a browser without WebGL2 if available.
9. Open this standalone HTML via `file://`: the map should not start,
   but the numeric center/radius editor should work.
10. Open the *normal* `src/index.html` via `file://` and verify its
    existing Places list, manual coordinates and modal workflows.

## Static checks

From the repository root:

```sh
node --check src/experiments/maplibre-poc/geometry.js
node --check src/experiments/maplibre-poc/poc.js
node scripts/check-maplibre-poc.cjs
git diff --check default...feature/maplibre-poc
```

The isolated experiment uses the same approved `--gg-*` palette tokens as
the app. It uses OpenFreeMap Liberty for light and the separately available
Dark style for dark; Dark needs explicit visual QA.

## Decision gate

This PR demonstrates implementation feasibility, not proof of hosted
compatibility until browser checks pass. See
[verification.md](../../../openspec/changes/maplibre-openfreemap-poc/verification.md)
for the go/no-go criteria and outstanding checks. Do not treat the
experiment as a production migration (#157) or completed approximate-area
record editor (#154). Geocoding replacement remains #158.
