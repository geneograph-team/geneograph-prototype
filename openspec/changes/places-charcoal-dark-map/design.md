# Design — Dark map palette override

## Alternatives evaluated

1. **Copy and host a full MapLibre style JSON:** gives exact visual
   control and no runtime paint changes, but requires vendoring an
   upstream ~33 KB style, replacing OpenFreeMap's deployment placeholders,
   maintaining licenses/sprite/fonts/source paths and tracking upgrades.
2. **Runtime paint overrides (chosen):** keep OpenFreeMap style URLs and
   base layers, apply only known paint properties after style load.
   Small and reversible, no extra runtime network request; changes are
   easy to configure and ignored if an upstream layer disappears.
   The cost is a few paint updates on each dark-style load.

CSS filtering the map canvas was rejected because it affects all
rendered colors rather than the intended vector layers.

## Color ownership

`src/core/runtime-config.js` owns `PLACES_DARK_MAP_PAINT`, keyed by
OpenFreeMap Dark layer IDs. This palette is vector-map artwork, not an
extension of GeneoGraph's semantic CSS tokens. The palette changes
45 of the upstream 47 layers and 58 existing paint properties as
verified against the 2026-11-09 OpenFreeMap style repository.
Original names and properties remain owned by the upstream provider.

The customizer is `placesMapAdapter.applyDarkPalette(map, theme)`.
It exits for light maps, checks each layer with `map.getLayer`, applies
paint colors via `map.setPaintProperty`, and catches individual
upstream incompatibilities without breaking map initialization.

## Theme lifecycle

`mountPlacesMap` records `placesMapRuntime.mapTheme` immediately
after creating the map. On each `style.load`, paint overrides are
reapplied before route-layer restoration. `handlePlacesMapThemeChange`
compares the requested theme against `mapTheme` instead of calling an
undocumented `getStyleUrl()` API. The load callback handles a theme
change that happened while the initial style was loading.
`destroyPlacesMap` clears the theme field.

The light basemap is unchanged. Route layers and marker DOM remain
separate and are never targeted by the paint overrides. MapLibre's
vector source URLs, OpenFreeMap attribution, glyphs and sprites are
unmodified.

## Deployment and acceptance

`scripts/check-places-dark-palette.cjs` validates palette coverage,
MapLibre paint semantics, text contrast, upstream-layer fallback and
idempotent theme transitions. Alongside the existing MapLibre checker,
it runs before Pages deployment.

Visual QA is still needed: compare matching city/rural map viewpoints
at matching zoom in upstream and modified dark style, test selected
markers, routes and label legibility on desktop/mobile in EN/RU, and
switch light/dark repeatedly. Do not claim browser validation from
the unit tests alone.
