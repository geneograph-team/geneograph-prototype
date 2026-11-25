# Tasks

Architecture planning (#398) is merged. Implementation and verification are tracked below.

- [x] Review pushed source, #396 baseline, current specs and approved decisions; identify actual ownership and gaps.
- [x] Define detached contracts, state, invalidation, lifecycle, async ownership, layout/render boundaries, independent future Fan and migration sequence.
- [x] Record approved layout/duplicate/card/date/zoom/color requirements and retire artificial 0–200 target.
- [x] #404: make vertical ELK the sole provider, remove Classic, and verify the offline Tree workflow.
- [x] #399: project stable occurrences and attach visible ancestry to one transferable owner.
- [x] #408: support reconverging sibling branches and visual family instances.
- [x] #400: incremental D3 renderer and actual-scale viewport.
- [ ] #401: local derivatives and image lifecycle implemented. Packaged photos under direct file opening remain a browser compatibility gap.
- [x] #402: implement approved cards/date/zoom, verify thresholds and accessibility.
- [x] #405: project-level coloring and channel/legend behavior.
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

## Verification of #408

- The #399 projection matrix passed all 12,852 cases. Seven additional vertical ELK solves covered reconverging siblings with one or two known parents, distinct single-parent records, and both upstream owner choices. Targeted checks covered the third compatible sibling, ordinary unrelated sibling groups, canonical coverage and stable keys, and competing or invalid context preferences. Approved ELK and localization regressions passed.
- Edge opened the local app file with HTTP and HTTPS blocked. The synthetic single-parent family rendered two appearances, and the two-parent family rendered four appearances across two visual families. Each branch had a child route at the correct endpoints, with no overlapping cards or routing diagnostics. Verified count badges, canonical selection and Edit, no false parent placeholders, separate project preferences, and independent transfer of upstream ancestry for each parent.
- The founder will verify the private imported case. No private data was used for this task. Alternative parent and ancestor/descendant overlap cases remain diagnosed rather than unfolded.

## Verification of #400

- Renderer checks covered actual-scale Fit, connector culling, rounded elbows, square family junctions, and crossing gaps. Approved ELK, occurrence, stress-fixture and localization checks passed.
- Offline Edge checks covered wheel anchoring, dragging, pinch, keyboard pan, Fit, resize, fullscreen, search, keyed card and path identity, portrait culling, localization and project disposal. Both synthetic reconvergence cases retained canonical selection and Edit and transferred ancestry independently. The stress view with six ancestor generations mounted 3 of 127 cards and 5 of 189 paths at the measured viewport. The slowest of 20 measured pan draws took 0.4 ms of JavaScript time.
- Compared 20 visible-card selections after three warmups on the same private 6,481-person import, focus, depth settings and 2,560 × 1,000 Edge viewport at 100%. The updated camera exposed a different set of fully visible cards. Median synchronous selection went from about 4.2 s to 3.4 ms, with a 4.4 ms p95 after the change. The second animation frame arrived at 33.2 ms median after the change. Instrumentation recorded zero calls to the full people or family adapters, projection, occurrence solver, ELK, full Tree render or card markup during the final selection run.

## Verification of #401

- Isolated Edge on loopback and direct file opening passed synthetic 4.32 MP and tiny-source checks, off-center crop, tagged region, four rotations, transparency, 96 × 128 output, in-flight deduplication, warm reuse, corrupt-source suppression, late disposal, URL release and active cache bounds. Tree checks covered actual blob URL and natural dimensions, hidden and offscreen demand, warm pan without scene changes, canonical source/region/crop changes, unlinking and project disposal. The full photo viewer and crop editor still used the original source. Packaged portraits worked on loopback and used initials on direct file opening in Edge. The complete EN/RU and light/dark matrix was not repeated for this task.
- The same Edge machine and 6,400 × 1,500 viewport at 100% compared #400 with #401 using 72 deterministic 2,400 × 1,800 JPEGs and two identical eight-position pan passes. The harness eagerly decoded mounted baseline images so completion could be compared. Cold settling was 106 ms before and 646 ms after. Mounted images went from 34 originals to 32 thumbnails at 128 × 128, about 560 MiB versus 2 MiB estimated mounted RGBA if all mounted images were decoded, rather than measured browser RSS. The updated cold cache created 32 derivatives and retained 24,690 encoded bytes. First pan took 200 ms before and 467 ms after, including 14 more derivative jobs. Warm pan took 184 ms before and 133 ms after, with zero additional generation, 42 cumulative cache hits and 35,998 retained encoded bytes. Maximum pan draw was 4.6 ms in both runs. Both kept the same scene throughout panning. This records source generation attempts after the change. Native browser original decode reuse on the baseline was not instrumented.
- Renderer, approved ELK, occurrence, duplicate transfer in Edge, and localization checks passed. The active migration remains open.

## Verification of #402

- Edge passed the six semantic zoom boundaries on loopback and direct-file opening using Whiskerfield and synthetic long Cyrillic names, dates and photos. Verified 3:4 geometry, adaptive initials, accessible full identity, date precision, action targets, Edit, Add relative and keyboard focus fallback. Card and geometry identities were stable during zoom.
- Verified the 96 × 128 portrait through delayed and failed 256-tier generation, cached return after Compact, successful decoded swap to 384 × 512, and invalidation on corrupt source replacement.
- Edge regressions covered duplicate transfer, original viewer/editor media, wheel anchoring, touch pinch, Fit, fullscreen and project disposal. Renderer, ELK, occurrence and localization checks passed. Reviewed EN dark and RU light Whiskerfield captures. Bundled photos under direct-file opening retain the existing #401 fallback in Edge. Production horizontal QA remains with #403.

## Verification of #405

- A deterministic 63-person pedigree passed the four slot sequences through five generations. Verified vacant origins, the maternal grandfather in slot 2, explicit-role conflicts, bounded cycles and unique or mixed collateral paths. Single- and two-parent GEDCOM fixtures kept their distinct occurrence colors through ancestry-owner transfer in Edge. Matching routed fragments were colored.
- Edge verified independent channels, the project reference search, legend, focus independence, retained portraits, and unchanged scene geometry during color-only saves. Whiskerfield computed styles showed distinct initials tiles in Gender, Branch and Neutral fill in both themes. The initials tint is 33%, versus 13% detailed categorized card fill. Legacy neutral detail keeps its neutral surface. Sixteen hues were reviewed as palette samples and are not assumed universally distinguishable.
- A role-labeled 1,023-person, 511-family stress fixture recorded 1,023 state visits, 1.4 ms resolution, 10.1 ms first color refresh and 0.2 ms cached restyle with three mounted cards and five paths. Zero structural projections ran during those changes.
- Renderer, ELK, occurrence, localization, portrait and semantic zoom regressions passed. Settings persist in the existing project session view. Durable reload persistence, private import and production horizontal behavior were not verified.
