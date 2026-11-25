# Tasks

Architecture planning (#398) is complete in this PR; review/merge and all runtime work remain pending.

- [x] Review pushed source, #396 baseline, current specs and approved decisions; identify actual ownership and gaps.
- [x] Define detached contracts, state, invalidation, lifecycle, async ownership, layout/render boundaries, independent future Fan and migration sequence.
- [x] Record approved layout/duplicate/card/date/zoom/color requirements and retire artificial 0–200 target.
- [ ] #404 phase 1: audit and remove Classic early; focused offline regression; temporary exceptions justified.
- [ ] #399: occurrence projection and actual generation constraints, expanded owner and path context.
- [ ] #400: incremental D3 renderer and actual-scale viewport.
- [ ] #401: local derivatives and image lifecycle.
- [ ] #402: implement approved cards/date/zoom, verify thresholds and accessibility.
- [ ] #405: project-level coloring and channel/legend behavior.
- [ ] #403: integrate both orientations, actual browser/geometry and stress QA, founder acceptance.
- [ ] #404 phase 2: remove remaining legacy paths, reconcile current specs and preview change, final documentation, QA and archive.

## Verification of this architecture change

Inspected current pushed default, repository and OpenSpec guidance, preview design and verification, current card and zoom specs, canonical project data contract, project view state/projection/navigation, shell, ELK adapter/transport, render/card/date/viewport and avatar code. Reviewed target decisions against #397–405. Documentation-only; no executable behavior modified, no browser or regression tests run. Preview's pending browser and real-world relationship checks remain pending. Production-scale limits, actual threshold tuning, complex ancestry ambiguity and performance are implementation verification, not claimed resolved here.
