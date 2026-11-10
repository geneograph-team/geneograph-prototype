# Proposal — Approximate circular Places (#154)

## Context
MapLibre/OpenFreeMap migration (#156/#157) and the grouped Needs review workflow (#153)
are already complete. The current Places map adapter exposes geographic area layers,
but Places records and editing previously supported exact points only.

## Product contract
- A Place can have an exact point, a representative center with a positive radius
  in metres, or no identified map position. Existing point/unmapped records require
  no migration.
- A valid area uses `coordinates: {lat, lng}` and optional
  `approximateRadiusMeters` (1–1,000,000 m); absent radius means an exact point.
- The circle is an **uncertainty region**, not an administrative or physical boundary.
  Uncertainty at an individual event remains separate from the shared Place record.
- Approximate Places count as mapped and are included chronologically in existing
  person/surname routes via their center; route visuals and text must disclose
  representative-center estimates, not measured travel distances.

## Implementation constraints
Reuse the current Place modal, model helpers, MapLibre GeoJSON area adapter,
route derivation and EN/RU catalog. Permit direct `file://` numeric editing when
the hosted vector map is unavailable. Avoid new dependencies, scripts, tests,
CI/deployment edits, and unrelated #175 camera-centering changes.

## Exclusions
No polygons, historic boundaries, dated names, per-event certainty scoring,
cloud persistence, new export schema or GEDCOM radius round-trip guarantees.

## Verification caveat
Syntax, pure geometry/model and focused rendering logic checks are useful,
but cannot replace actual hosted-browser QA for circle dragging, route overlays,
theme switching and responsive layouts.
