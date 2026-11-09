# Proposal — Charcoal dark Places map (#163)

## Problem

OpenFreeMap's default Dark style is near-black and obscures minor roads,
boundaries and settlement names in the Places workspace. It clashes with
GeneoGraph's softer charcoal dark application theme. The founder selected
Option B: customized vector colors, retaining the dark map.

## Changes

- Keep the OpenFreeMap Dark style and light Liberty style URLs.
- Define a GeneoGraph-owned, configurable set of Dark layer paint colors
  (land, water, parks, roads, boundaries, village/city labels).
- Apply overrides through MapLibre `setPaintProperty` on `style.load`;
  do not recolor the WebGL canvas or map markers with CSS filters.
- Track the selected map theme explicitly and avoid redundant style
  reloads; reapply dark colors after every actual theme switch.
- Preserve tiles, fonts, sprites, attribution, overlays, routes,
  place selection and manual `file://` editing.
- Add automated palette/contrast and theme transition checks to Pages CI.
- Document palette ownership, external style terms and visual QA.

## Out of scope

Light-map restyling, app palette changes, external geocoding APIs,
place data, marker colors, account tokens or backend changes.

## Review

Founder to approve hosted dark-map appearance after side-by-side browser
comparison at matching viewpoints. Do not merge before visual review.
