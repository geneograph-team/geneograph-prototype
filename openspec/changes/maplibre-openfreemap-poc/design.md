# Design

## Context and constraints

The current Places map uses Leaflet marker, feature group and polyline APIs.
The desktop/browser prototype has no build step and must still open its main
\`src/index.html\` directly via \`file://\`. Interactive vector maps do not need
to work from \`file://\`, but manual place and coordinate workflows must remain
possible in the production migration.

## Approach

- **Isolation.** \`src/experiments/maplibre-poc/index.html\` is a standalone
  fixture, not part of the application load order or project state. GitHub
  Pages' existing \`src/\` artifact deployment will include the page once merged.
- **Renderer.** Dynamically import the pinned MapLibre 6.16.0 ES module from
  UNPKG; v6 removed its older UMD bundle. Do not require a bundler. The dynamic
  import allows an explicit error state if the CDN cannot load. Use
  OpenFreeMap Liberty for light and OpenFreeMap Dark for theme testing.
- **Attribution.** Keep MapLibre's attribution control visible with links to
  OpenFreeMap, OpenMapTiles and OpenStreetMap; their attributions may already
  also be included by the style source.
- **Fixtures.** Three illustrative chronological stops: Kraków (1875),
  approximate Lviv area (1905), Warsaw (1920). These are not factual family
  data and never persist to the main project.
- **Interactive actions.** Select stops from the list or keyboard-focusable
  marker buttons, drag the middle marker, click the map to pick coordinates,
  fit the route, toggle route line, edit numeric center/radius, and restart or
  destroy the renderer. The map retains its camera in session storage when
  permitted, with memory-only behavior when storage is denied.
- **Geographic area.** Produce a 96-segment GeoJSON polygon with spherical
  forward-geodesic calculations. Radius is in **metres**, while the UI accepts
  kilometres. Do not use the pixel-valued MapLibre circle paint property.
  Update the GeoJSON polygon and line source when the representative center
  or radius changes. The numeric fields work even when mapping is unavailable.
- **Lifecycle.** Recreate sources and layers on \`style.load\`, clear markers,
  observer and timeouts on teardown, and provide an explicit failure state for
  CDN, style/tile or WebGL initialization problems.
- **Theme/color ownership.** Reuse the project's approved semantic
  \`--gg-*\` palette tokens; never add hard-coded UI colors. The underlying
  basemap styling is supplied by OpenFreeMap.

## Out of scope

No production renderer changes, geocoder replacement, place data-model
updates, full approximate-area editor, permanent storage or backend.
No attempt to implement offline vector tiles.

## Risks and evaluation

1. **Unverified WebGL/worker behavior.** Browser rendering requires real
   hosted/manual tests in Chromium and Firefox; static checks alone cannot
   establish success. MapLibre 6 requires ESM and WebGL2; if unsupported the
   fallback must remain usable.
2. **Free hosting is best-effort.** OpenFreeMap explicitly allows commercial
   usage with no published request limits but has no SLA. Plans must include
   outage fallback and future provider/hosting alternatives.
3. **Dark style maturity.** OpenFreeMap's Dark style may be less actively
   maintained than Liberty. The production migration must evaluate readability,
   zoom performance and map labels across the themes.
4. **Geodesic representation.** Spherical geometry suffices for small to
   medium approximate areas but does not model historic boundaries. The PoC
   constrains radius to 0.1–100 km and latitude to ±85°, and does not support
   dateline-spanning areas; investigate global edge cases before production.
5. **Attribution and third-party runtime.** Audit OpenFreeMap style licenses,
   CSP/worker loading, and browser request behavior before commercial release.
   Geocoding remains a separate MapTiler dependency (#158).

## Verification

Run \`node --check\` on the new JS and
\`node scripts/check-maplibre-poc.cjs\`. Then serve \`src/\` over HTTP and
exercise all workflows in both themes and languages, including mobile widths,
keyboard controls, failed network and blocked WebGL. Finally open
\`src/index.html\` directly via \`file://\` to confirm the unmodified normal
prototype's list/editor remain usable. Do not mark hosted browser criteria
passed from the static checks alone.

Useful references:
- https://maplibre.org/maplibre-gl-js/docs/
- https://openfreemap.org/quick_start/
- https://openfreemap.org/
