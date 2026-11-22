# Places basemap style maintenance

The Places basemap uses the hosted OpenFreeMap Liberty light style and a locally maintained dark adaptation in `src/assets/map-styles/liberty-dark.json`. This document owns asset-specific provenance, style decisions, attribution and visual approval requirements. Product interaction principles remain in [the design guide](design-document.md); geocoding and credentials are in [the browser geocoder guide](browser-geocoder-setup.md). Historical issue references are background, not current acceptance claims.

**Owned style:** `src/assets/map-styles/liberty-dark.json` is a static, versioned
dark adaptation of the **111-layer OpenFreeMap Liberty style**, not the older
OpenFreeMap Dark preset. Light mode still loads the original hosted Liberty URL.
`src/core/runtime-config.js` selects the relative dark style URL; the MapLibre
adapter resolves it against `document.baseURI` so GitHub Pages project
subpaths work. No runtime `PLACES_DARK_MAP_PAINT` or layer-ID-dependent
recoloring runs during `style.load`.

**Upstream provenance:** Based on
[OpenFreeMap Liberty](https://github.com/hyperknot/openfreemap-styles/blob/006ea5796803ba2df4330888836cb0a8f17473b4/styles/liberty/style.json)
at commit `006ea5796803ba2df4330888836cb0a8f17473b4`
(2026-10-25). The source's `__TILEJSON_DOMAIN__` placeholder is resolved
to `tiles.openfreemap.org`. Vector/raster tiles, hashed sprite and Noto
glyph endpoints remain on OpenFreeMap; label expressions and layer ordering
are unchanged, including non-Latin name fallback. No MapTiler assets,
additional keys or services are introduced.

**Cartographic ownership:** Edit the **paint properties in the style JSON**,
not the GeneoGraph v3 UI palette. Current dark direction (approximate hex
samples; judge on real rendered tiles):

| Feature | Dark Liberty color |
| --- | --- |
| Background / land | `#303C48` slate |
| Water | `#25536A` maritime blue |
| Protected areas / park polygons | `#354E48` muted green, zoom-faded |
| Woodland / grassland | `#3B6B51` / `#4A6B53` vegetation |
| Major roads / motorways | `#A99A82` / `#BA9E78` muted warm sand |
| Minor roads | `#6E8392` steel blue |
| Buildings | `#4C5B68` blue gray |
| Cities / water labels | `#EBF0F4` / `#B1D7E5` |

The `park` source layer may cover broad protected territories, including
non-vegetated terrain. Its muted green fill fades from 2–12% at country/
regional zoom to 20–28% locally. The separate dashed `park_outline`
also fades from invisible at country scale to subtle locally. Woodland
and grassland retain their independent physical landcover colors and
opacities, so vegetation is more informative than protected boundaries.

The existing zoom-dependent road widths, casings, distinct route classes,
boundaries, building footprints, POIs, sprites and all 111 layer positions
are preserved. Low-zoom Natural Earth raster relief is darkened and reduced
in opacity so it does not wash out the background. User map markers,
selected/draft pins, approximate-location circles and route layers are
**application overlays**, created/recreated after style loading; do not
embed them into the basemap JSON.

**Credits and maintenance:** Preserve OpenFreeMap/OpenMapTiles/
OpenStreetMap map attribution on all supported views. The adapted style
retains the original Liberty [BSD-style code and CC BY design notices]
(../src/assets/map-styles/LICENSE.md). When updating upstream, compare
source layer IDs, order, sprite revisions, tiles, labels, and attribution
before porting the dark colors to the newer Liberty baseline. Never fetch
or introduce font assets into this repository.

**Visual approval gate for future edits:** Before merging, compare the *current
light map*, the unchanged dark baseline and proposed edited dark style at
identical positions/zooms: city streets, rural countryside, water/coast and parks.
Review EN/RU and Cyrillic labels, contrast of place names and boundaries,
attribution, selected/draft markers, route stops/lines, approximate areas,
and repeated light/dark theme switches on desktop and mobile. A static
JSON audit or palette chips cannot substitute for hosted MapLibre visual
QA. Founder approval of the actual rendered palette is required. Direct
`file://` still offers manual coordinates, not an interactive map.

