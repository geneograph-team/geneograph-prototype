# Proposal

## Why

GeneoGraph Places currently uses Leaflet with MapTiler raster tiles. The
successful standalone MapLibre/OpenFreeMap experiment (#156) supports
moving to commercial-compatible free vector map hosting. MapTiler's
geocoding remains separately tracked by #158.

## What changes

- Use pinned MapLibre GL JS v6 with OpenFreeMap Liberty and Dark styles.
- Isolate renderer calls in a narrow adapter for markers, route GeoJSON,
  map views, lifecycle, and future area polygons (#154).
- Keep Places records and historical route derivation unchanged.
- Let the main app work through file:// without initializing WebGL,
  with clear List / manual-coordinate fallback.
- Keep Add/Edit Place open until the hosted map is ready. On failure,
  preserve the draft and expand its manual coordinate fields.
- Update tour integrations, theme switching, and English/Russian copy.

## Non-goals

No area/radius record feature (#154), no geocoding change (#158), no
offline vector tiles, backend, build system, or unrelated redesign.
