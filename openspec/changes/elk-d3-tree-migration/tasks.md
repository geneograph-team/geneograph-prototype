# Tasks

Architecture planning (#398) is merged. Implementation and verification are tracked below.

- [x] Review pushed source, #396 baseline, current specs and approved decisions; identify actual ownership and gaps.
- [x] Define detached contracts, state, invalidation, lifecycle, async ownership, layout/render boundaries, independent future Fan and migration sequence.
- [x] Record approved layout/duplicate/card/date/zoom/color requirements and retire artificial 0–200 target.
- [x] #404: make vertical ELK the sole provider, remove Classic, and verify the offline Tree workflow.
- [x] #399: project stable occurrences and attach visible ancestry to one transferable owner.
- [ ] #400: incremental D3 renderer and actual-scale viewport.
- [ ] #401: local derivatives and image lifecycle.
- [ ] #402: implement approved cards/date/zoom, verify thresholds and accessibility.
- [ ] #405: project-level coloring and channel/legend behavior.
- [ ] #403: integrate both orientations, actual browser/geometry and stress QA, founder acceptance.
- [ ] #407: remove remaining legacy paths, reconcile current specs and preview change, final documentation, QA and archive.

## Verification of this architecture change

Inspected current pushed default, repository and OpenSpec guidance, preview design and verification, current card and zoom specs, canonical project data contract, project view state/projection/navigation, shell, ELK adapter/transport, render/card/date/viewport and avatar code. Reviewed target decisions against #397–405. Documentation-only; no executable behavior modified, no browser or regression tests run. Preview's pending browser and real-world relationship checks remain pending. Production-scale limits, actual threshold tuning, complex ancestry ambiguity and performance are implementation verification, not claimed resolved here.

## Verification of #404

- Ran the ELK reference regression, the 1,023-person stress fixture generation check and the localization catalog check. The retired Classic solver test covered placement tuning and occurrence behavior specific to that solver. The ELK suite retains relationship coverage, deterministic geometry and a shared placeholder regression for partial families and ancestor-depth boundaries.
- Ran Whiskerfield in isolated Edge on a local file URL with HTTP and HTTPS blocked. Vertical stage dimensions matched the accepted preview at 2,144 × 1,544. Checked same-project re-entry, focus, keyboard selection without layout calculation or viewport movement, inspector, search, canvas scroll and zoom, Edit, Add relative, Add parent, depth and cousins, English/dark and Russian/light.
- Injected a rejected layout and recovered with localized Retry in the same project and focus. Held another request and resolved it after switching projects. The late result did not replace the active layout. Leaving Tree disposed the request. Returning from a different project used the existing default focus and preserved canonical family memberships.
- Runtime reference audit found one ELK path and no callers of the retired solver, connector generator or provider switch. Shared card and placeholder dimensions, focus controls, SVG crossing treatment, relationship line styling, and the person lookup used by the inspector and relationship actions remain active. #407 owns final migration cleanup.

## Verification of #399

- Matched the SHA-256 of the approved reference in the local temp directory. The implementation uses production visibility, derives generations from family edges, and uses memoized downstream reachability to identify the same reconvergence roots as an upstream walk. The occurrence key uses canonical co-parent IDs so adding another record for the same pair does not change it. A preferred co-parent can still select the matching appearance if its bucket changes with visibility.
- The production projection matrix ran 12,852 combinations of fixture focus, ancestor depth, descendant depth and cousin visibility. Checked stable occurrence keys, exact canonical family endpoints, one expanded owner where applicable, no input mutation, and successful generation derivation. Separate cases diagnosed overlapping and incomplete contexts, ancestry cycles, and incompatible generation constraints. Overlapping and incomplete contexts retain their canonical memberships without splitting.
- The full extended fixture contained 52 canonical people, 53 appearances and 20 families. The Alex view contained 50 canonical people and 19 visible families before placeholders. Both owner choices laid out without overlapping cards or missing child routes. The approved ELK fixture and localization regressions passed.
- Edge on an offline file URL verified both Louise badges, one F20 attachment, a Space-key transfer and click transfer back, selection and inspector identity, Edit and Add relative, stable focus control dimensions and placement, no false parent placeholder, retained zoom, depth supersession, project isolation, and English/dark and Russian/light badge labels.
- One anonymized local private-import check rendered 98 cards with zero repeated people or layout diagnostics in the tested scope. The transfer itself was verified on the synthetic fixture.
