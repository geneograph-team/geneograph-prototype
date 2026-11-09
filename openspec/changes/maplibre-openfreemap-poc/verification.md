# Proof-of-concept verification and decision gate

## Scope and evidence

- PoC path: `src/experiments/maplibre-poc/index.html` (isolated).
- Basemap: OpenFreeMap Liberty; optional Dark style switch.
- Library: pinned MapLibre GL JS 6.16.0 ES module (CDN).
- Domain model: none changed. Sample fixtures only. The current
  Leaflet/MapTiler production renderer remains in `src/index.html`.
- Geocoding: unchanged and still MapTiler-backed. Track via #158.

## Checks performed

| Check | Result | Evidence / limitation |
| --- | --- | --- |
| JS syntax for `poc.js`, `geometry.js`, `check-maplibre-poc.cjs` | Pass | Parsed in V8 from the pushed branch's exact file content. |
| Geodesic center/radius math | Pass | Executed 96-segment 5 km circle; maximum deviation from 5000 m on the same spherical model was under 0.000001 m. |
| Ring closure and invalid input | Pass | 97 coordinates including closing point; negative radius and invalid latitude rejected. |
| Automated fixture/isolation assertions | Pass in V8 | Executed the committed check script's assertions with equivalent in-memory Node primitives and the actual pushed files; **real Node CLI run is still pending**. |
| Main prototype source changes | None | Branch compares only new experiment, tests and OpenSpec files. |
| Hosted vector tiles/attribution/WebGL2/worker | Pending | Requires a real hosted browser; not inferred from static checks. |
| Marker dragging, circle resizing, route behavior | Pending | Requires manual browser interaction. |
| EN/RU, both themes, responsive layout, keyboard | Pending | Requires focused browser QA. |
| `file://` normal prototype / fallback behavior | Pending | Needs a manual browser check outside this environment. |
| Node CLI check and `git diff --check` | Pending | Run in a checkout before merge. |

## Provider and technical observations

- OpenFreeMap publicly allows commercial use, reports no public map-view
  quota, and currently has no service SLA or personalized support:
  https://openfreemap.org/
- Liberty is documented in the official quick start:
  https://openfreemap.org/quick_start/
- MapLibre 6 uses the ES-module CDN distribution and Web Workers; its
  browser integration must be tested on hosted HTTP(S):
  https://maplibre.org/maplibre-gl-js/docs/
- No map token or MapTiler raster URL appears in the PoC. OpenFreeMap
  styles supply tiles, not a replacement for MapTiler's geocoder.
- The area polygon is constructed from forward geodesic spherical
  bearings and the route line uses the representative center. This
  should not be read as a historic jurisdiction boundary.
- The free public provider's availability, style maintenance, browser
  performance, glyph compatibility, accessibility, and future usage
  conditions remain operational risks. A production provider adapter
  and graceful list/manual-coordinate fallback are still necessary.

## Go / no-go

**Current decision: HOLD — browser verification not yet completed.**

Proceed with #157 only after a reviewer demonstrates, in at least
Chromium and one other supported browser, that:

1. Liberty and Dark load with full attribution; no blocking CDN,
   worker or WebGL errors occur.
2. Selection, keyboard focus, draft drag, map click, route toggle,
   view restore, resize, theme and EN/RU interactions work.
3. A 5 km then 10 km geodesic area stays geographically correct
   through zoom/pan and the route follows its representative center.
4. Failure/retry and direct-file fallback are clear, and the normal
   `src/index.html` remains usable without the experiment.
5. Performance and console/network errors are recorded, including the
   actual browser versions and any provider failures.

If any gate fails, document the failure in #156 and reassess MapLibre
loading, fallback or provider choice before #157. Archive the OpenSpec
change only after the evidence is complete.
