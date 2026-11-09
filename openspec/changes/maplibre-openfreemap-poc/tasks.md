# Tasks

## 1. Isolated renderer experiment

- [x] 1.1 Add a standalone PoC page without editing the production app's
  script/style load order or project data.
- [x] 1.2 Pin MapLibre GL JS v6 and use OpenFreeMap Liberty/Dark with
  attribution, startup errors and manual fallback.
- [x] 1.3 Demonstrate selected/keyboard-focusable markers, draft dragging,
  coordinate picking, camera restoration, map fitting and route overlay.
- [x] 1.4 Render and update a 5 km geographic-radius GeoJSON polygon and
  keep route center aligned when moving it.
- [x] 1.5 Add EN/RU controls, light/dark themes, responsive styling, retry
  and clean teardown/reinitialization paths.

## 2. Focused checks

- [x] 2.1 Add dependency-free geometry and isolation checks.
- [x] 2.2 Review exact submitted files for JS syntax, final newlines and
  unintended production-file changes.
- [ ] 2.3 Run the Node checks in a checkout and record their results.
- [ ] 2.4 Run the hosted browser matrix: map tiles, attribution, WebGL,
  worker startup, routes, dragging, radius, resize, themes, EN/RU and retry.
- [ ] 2.5 Verify the main `src/index.html` still runs directly via
  `file://` and map failure does not block manual place editing there.
- [ ] 2.6 Publish final go/no-go for production migration #157 after manual
  browser checks, then archive this change if all checks pass.
