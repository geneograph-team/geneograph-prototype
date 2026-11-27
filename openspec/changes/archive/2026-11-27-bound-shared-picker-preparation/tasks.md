# Tasks

- [x] Reproduce and isolate expensive picker work using a 6,481-person browser fixture.
- [x] Bound shared results and index repeated association work.
- [x] Run hosted and direct-file Edge smoke checks and focused regressions.
- [x] Obtain founder acceptance.

## Verification

One paired synthetic Edge run measured single-picker open at 629 ms before and 14 ms after, with mounted rows dropping from 6,481 to 50. The shared Notes People linker went from 174 ms to 22 ms. Birth-place query went from 3,124 ms to 7 ms on the same 250-place fixture.

The final Geneograph flow opened in 123 ms hosted and 147 ms via file. Selection took 2.10 and 2.17 seconds, almost entirely in the board review continuation. Both flows also checked Notes linking, the photo person filter, and choosing, cancelling and saving birth-place entries. The fixture uses synthetic data and blocks live geocoder traffic.

## Founder acceptance — 27 November 2026

The founder explicitly accepted #459. Implementation is on default in commit `df8bd42ef71b5af92eae06cf8eaea5067aea866b`.

A subsequent founder recording on the imported 6,481-person / 1,950-family GEDCOM project retains 117 operations without drops (116 completed, one canceled Places map initialization). Geneograph manual picker opening takes 129.9/128.2 ms, query 74.8/66.8 ms and markup 54.8/61.3 ms; 50 records prepared/rendered out of 6,481, versus 962.8 ms and 6,481 prepared in Test B. First search takes 99.8 ms and subsequent search 12.7 ms, both scanning the full eligible population with 50 rendered. These observational comparisons corroborate the separate synthetic paired run, not a matched statistical benchmark. Geneograph selection takes 1,458.1 ms, of which 1,456.9 ms is the inclusive board-review continuation stage labeled dom; this is not isolated DOM insertion latency. #473 owns that remaining cost.

Notes picker opens in 98.9 ms with ten suggestions; selection/save takes 237.5 ms (evidence 65.7 ms, continuation 146.1 ms including nested editor-bearing render 92.4 ms). #458 owns Notes editor continuation and #474 owns mutation invalidation. People place queries range from 1.0 to 20.8 ms; the first association provider build is 17.1 ms and a later build 9.9 ms, with reuse between builds. The export does not independently time all save/selection work, identify query text, establish result correctness or cover live geocoding. Across the recording, 26 legacy invalidations and 15 evicted entries remain #474 evidence.

The founder accepts the measured picker improvements and documented limitations. The paired synthetic benchmark is a single run; dedicated deterministic pagination/selection preservation and Geneograph ranking/search parity regressions, comprehensive EN/RU and keyboard/accessibility coverage, full Notes tagging/search and photo person-filter instrumentation, and live geocoder/stale-result coverage were not independently established. Do not mark those checks as executed. Preserve remaining consumer-specific and integrated checks in #473/#458/#474/#460. No new runtime tests were run during this administrative archival.
