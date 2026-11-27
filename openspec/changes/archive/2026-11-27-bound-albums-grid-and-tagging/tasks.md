# Tasks

- [x] Capture before and after grid, resize, selection and tagging samples on the same synthetic workload.
- [x] Bound image card and tagging result markup and retain compatible grid nodes.
- [x] Verify focused regressions and browser paths listed below.
- [x] Review the founder's imported-library Diagnostics and obtain explicit acceptance; remaining unperformed checks documented below.

## Measurements

One matched series used Edge with 459 photo records and 6,481 people. Each photo had four initial tags and the first photo had two face regions. The fixture reused a packaged image. Times are synchronous operation timings in milliseconds, with rendering and image decode excluded as separate, unmeasured costs. Observer-driven card preparation occurs separately from grid entry.

| Operation | Hosted before | Hosted after | Direct-file after |
| --- | --- | --- | --- |
| Entry | 90.1 | 18.9 | 21.5 |
| Resize | 49.2 / 43.0 / 38.6 | 3.6 / 1.3 / 2.1 | 4.1 / 1.5 / 1.3 |
| Selection | 143.4 | 60.5 | 47.6 |
| Tag open | 1006 / 1059 / 950 | 51.4 / 25.4 / 51.2 | 60.9 / 25.0 / 53.9 |
| Tag search | 289.7 / 243.0 / 223.7 | 44.2 / 2.1 / 3.5 | 243.6 / 1.9 / 3.1 |
| Tag select | 172.5 / 178.1 / 180.5 | 30.0 / 34.4 / 44.5 | 33.5 / 22.4 / 30.0 |
| Tag remove | 173.1 / 187.0 / 176.0 | 16.6 / 71.2 / 35.5 | 17.1 / 20.0 / 24.6 |

Grid entry went from four query calls to one in the fixture. Resize went from 459 full card preparations to zero. The grid keeps 459 lightweight shells and prepared 27 full cards near the initial viewport. A 620px test had 12 hydrated cards after scrolling to the end. Tagging mounted 22 candidate rows versus 6,477 before. All candidates remain searchable. First Russian tagging search still prepared 6,477 search fields, which accounts for the cold outlier.

A separate matched hosted run against the original public Albums files measured keyboard region move at 170 / 169 / 212 ms before and 18 / 14 / 66 ms after. Keyboard resize measured 176 / 135 / 115 ms before and 15 / 19 / 18 ms after. Clear measured 545 / 395 / 383 ms before and 17 / 22 / 29 ms after. The original pointer geometry handlers were retained.

## Actual checks

Hosted English and direct-file Russian Edge passed grid/list switching, album and Unsorted views, compatible caption saves, node identity on resize, offscreen multi-selection, project isolation, rapid search typing in the library and tag modal, opening tagging from a lightbox, searching for people outside the initial window, multiple tags, forward and backward keyboard traversal across a candidate window, keyboard region edits and clearing, primary-photo removal cancel and confirm, and the shared Archive tagging entry. Hosted mouse input also passed region draw, move and resize. The narrow test covered scrolling, bounded cards and rapid typing to an empty result.

The deterministic Albums, canonical data contract, Diagnostics and shared picker Node regressions passed. The private library, touch gestures, independent decode timing, and broader linked evidence workflows remain outside this capture.

## Founder-approved tagging follow-up

Edge with 6,481 people and one existing tag showed 20 suggestions and 50 of 6,480 matches in both modules. Hosted English at 2,560 px and direct-file Russian at 520 px passed rapid typing and clearing, exact ranked order, no-result behavior, discovery beyond the initial suggestions, Full preview, face click and keyboard activation, zoom retention, entry-dependent Cancel, multiple commits, face-region editing and Albums primary-photo removal confirmation. The deterministic regression also covers exactly 50 matches, smaller totals and excluded people. Synchronous broad-query samples were 52.3 ms (Albums) and 48.8 ms (Archive) hosted and 231.3 ms and 244.9 ms direct-file. These are individual fixture samples and exclude paint and decode. Imported data and touch gestures remain pending.

## Founder acceptance — 27 November 2026

Founder explicitly accepted #457 and authorized closure and archival after the tagging follow-up review. Original optimization commit 325bd154b18eabb2089b296ff30844b08759e8f2, UX follow-up 012d4efbf876ea72a996630295c2dd8f8de47c10 and button-label adjustment 17f8125ee090f47b7c9873170e990e9e38a4ee33 are on default. The final label is **Back to photo**. The capped list supersedes candidate virtualization; all eligible people remain discoverable by search. The previous scroll-window focus and resize concerns no longer apply to candidate scrolling.

Founder supplied an imported-library recording before the capped-list follow-up: 784 operations, 256 retained completed samples and 528 overwritten. Retained samples include 63 grid resizes (2.2–8.3 ms, median 2.7), 86 card hydration batches (0.8–25.6 ms, median 3.4, 1–15 cards per batch), 82 Albums renders (1.7–81.1 ms, median 20.2), and 18 picker operations (4.6–117.7 ms, median 28.6; up to 6,480 matches, 21–22 mounted candidate rows in the pre-cap version). A recurring result set contained 245 photos; 81 render samples had one query call, one had none. These are observational synchronous measurements on a different workload/result subset from the earlier 459-photo baseline; do not infer matched entry latency, total mounted-card count, paint/decode cost or individual long-task causes. Earlier samples were overwritten. The recording-wide lifecycle summary reports eight invalidations, seven legacy, eleven evictions; #474 retains responsibility for remaining measured legacy mutation paths.

Implementation-reported matched synthetic tests and follow-up browser/Node checks are recorded above. The founder's explicit acceptance is not a case-by-case attestation of the earlier interactive checklist or fresh post-follow-up imported-data QA. No additional independent browser or full-suite run occurred during closeout. Touch gestures, independent image decode timing, broader linked evidence workflows, and follow-up mouse drag-pan/explicit close were not separately verified. These limits are accepted for closure; #460 retains integrated regression checks. No private genealogy data or raw recordings committed.
