# Tasks — Issue #163

## Implementation

- [x] Evaluate OpenFreeMap's published Dark style and alternatives.
- [x] Define a maintained charcoal palette for background, roads, water,
  parks, buildings, labels and boundaries.
- [x] Apply only Dark style paint overrides after `style.load`.
- [x] Track requested map theme and avoid redundant style reloading.
- [x] Preserve OpenFreeMap styles, vector sources, fonts, sprites,
  attribution, markers, route overlays and Light palette.
- [x] Add focused contrast/theme/forward-compatibility tests.
- [x] Add map checks to GitHub Pages deployment gate.
- [x] Update README, design guide and source map.

## Verification / review

- [x] Confirm all 45 overridden layer IDs and 58 paint properties
  exist in upstream OpenFreeMap Dark style source (2026-11-09).
- [x] Run focused assertions with simulated MapLibre in V8.
- [ ] Run `node scripts/check-places-dark-palette.cjs` and
  `node scripts/check-places-maplibre.cjs` natively in a checkout.
- [ ] Test hosted dark map side-by-side with upstream Dark at identical
  city/rural views; founder approves revised palette.
- [ ] Verify mobile, desktop, EN/RU, labels, markers, routes, attribution
  and repeated light/dark transitions in a browser.
- [ ] Verify provider style outage and `file://` manual place entry.
- [ ] Merge PR only after founder review/permission.
