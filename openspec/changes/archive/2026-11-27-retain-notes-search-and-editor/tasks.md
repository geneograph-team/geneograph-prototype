# Tasks

- [x] Reproduce search and editor mount costs on a linked synthetic Notes fixture.
- [x] Reuse search preparation and retain compatible editors.
- [x] Verify Notes search freshness, editor isolation and fallback in focused regressions.
- [x] Correct row-date and save-feedback regressions; remove display-label sorting from person-link validation.
- [x] Founder accepts real-browser Notes follow-up (reported passed; detailed follow-up fallback not separately attested).
- [x] Review a new Diagnostics capture on the founder's imported project and obtain acceptance.

## Verification

The synthetic project had 6,481 people and 467 notes with up to 12 person links each. Narrow text search matched 14 notes. A single hosted before run measured 1,110 / 976 / 766 ms in the query stage. After, the same query took 39.2 / 4.0 / 3.1 ms hosted and 140.9 / 3.9 / 3.7 ms via direct file in Russian. The first measurement in each series is cold.

Before, three unfiltered editor-bearing renders took 138 / 165 / 126 ms total and each mounted Quill. After, clearing the search still mounted Quill because that query had closed the selected note. Two compatible repeats took 24 / 22 ms hosted and 25 / 23 ms via file with zero editor mounts. First mount remains measurable at 119 ms hosted and 124 ms via file in these runs.

Hosted English and direct-file Russian Edge covered rich-text formatting and selection, compatible sort and search, selection exclusion and reopen, person tag and unlink, undo/redo, rapid note switching, fallback on missing or failing Quill, and project isolation. Deterministic tests covered search parity and relevant revisions and verified that compatible markup retains the editor while incompatible content detaches both listeners. Project-data-contract and Diagnostics checks passed.

A separate hosted run measured Quill insert at 6.7 ms, paste at 8.7 ms, undo at 3.6 ms and redo at 3.3 ms with search active. The next warm refresh took 9.4 ms and kept the editor. These are single after-only operation timings.

The private imported project, all saved filter combinations, and touch-specific interaction remain outside this capture.

## Review follow-up

Body edits now refresh row metadata without rebuilding collection chips. Save feedback belongs to the selected canonical note; rendering a different editor derives the appropriate status and expired or superseded callbacks cannot update another editor. Person-link validation uses the existing eligible people index rather than sorting display labels. Source and other resource validation are unchanged.

A deterministic regression harness using the actual modified source in a V8 isolate passed date, timer/selection, project and person-link checks. The 6,481-person synthetic workload measured 27346 display-label calls in the old validation preparation versus zero in indexed validation; one cold people-index build and no repeated warm population read. These are structural counts, not a browser latency claim. The new Node-format test was syntax-parsed and its fixture/assertions executed in V8, not run via Node CLI. Actual Quill/browser QA and the founder's imported recording remain pending; the change stays active.

## Founder acceptance — 27 November 2026

Accepted and authorized closure and archival after reporting browser QA passed, including the shared search fix #481. The earlier imported-project Notes follow-up (6,481 people, 467 notes) recorded 171 completed operations and zero drops: search-resource query 13.9 ms cold, 1.7–12.5 ms warm; search-resource renders 3.4–62.1 ms; one preparation build and 109 hits; 35 notes-domain invalidations with zero retained-entry evictions. Person-tag saves 110.9/129.5 ms versus the earlier observed 237.5 ms, with nested render 21.6/30.6 ms and no editor stage. These are observational comparisons, not matched latency trials. Full-list actual editor mounts remain measurable (up to 127.3 ms total render in the capture); the trace does not identify all mounting reasons or independent paint/typing latency.

Follow-up #480 is on default. The reported rapid-typing defect was resolved by #481 (PR #482); founder confirms it works and browser QA passed. Acceptance covers the agreed work; no fresh independent full-suite or browser run was performed at archival. Detailed follow-up fallback, touch and exhaustive filter combinations were not separately attested; retain the earlier verification limits. #460 retains integrated regression coverage. No private data or raw captures committed.
