# Design

## Separation

src/modules/places/map-adapter.js owns MapLibre map, markers, lines and
polygon overlays. UI/domain behavior remains in map-runtime.js and
map-and-route.js. The adapter translates GeneoGraph [latitude,longitude]
pairs to MapLibre [longitude,latitude]. Historical routes use GeoJSON
lines; future approximate places supply geodesic GeoJSON polygons, not
pixel-sized screen circles.

## Lifecycle

Load the pinned ES module only when the hosted Places map is opened.
A generation counter rejects late asynchronous loads after navigation.
A resource-error threshold and load timeout provide Retry / List
fallback. Markers, overlays and observers are torn down with WebGL.
Existing in-memory camera state is retained. Theme changes swap
OpenFreeMap styles and recreate route overlays.

## Editing and local-file fallback

The application must open directly via file://. Map access may be
unavailable, but the Places list, place editor and manual coordinate
fields remain operable. When requested from Add/Edit, the hosted map
mounts behind the modal; the modal only closes on map readiness.
Failure leaves unsaved inputs intact and opens Advanced coordinates.

MapTiler geocoding remains in a separate temporary configuration until
#158; removing the basemap does not remove its geocoder.

## Risk / rollback

MapLibre v6 requires external ES module CDN, WebGL2, workers and
OpenFreeMap connectivity. OpenFreeMap is free for commercial use but
has no public SLA. Attribution is supplied by the style, avoiding the
duplicate custom credits observed in #156. Browser QA is mandatory.
Rollback is a focused PR revert without changing records.
