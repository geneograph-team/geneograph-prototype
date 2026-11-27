# Tasks

- [x] Reproduce search and editor mount costs on a linked synthetic Notes fixture.
- [x] Reuse search preparation and retain compatible editors.
- [x] Verify Notes search freshness, editor isolation and fallback in focused regressions.
- [ ] Review a new Diagnostics capture on the founder's imported project and obtain acceptance.

## Verification

The synthetic project had 6,481 people and 467 notes with up to 12 person links each. Narrow text search matched 14 notes. A single hosted before run measured 1,110 / 976 / 766 ms in the query stage. After, the same query took 39.2 / 4.0 / 3.1 ms hosted and 140.9 / 3.9 / 3.7 ms via direct file in Russian. The first measurement in each series is cold.

Before, three unfiltered editor-bearing renders took 138 / 165 / 126 ms total and each mounted Quill. After, clearing the search still mounted Quill because that query had closed the selected note. Two compatible repeats took 24 / 22 ms hosted and 25 / 23 ms via file with zero editor mounts. First mount remains measurable at 119 ms hosted and 124 ms via file in these runs.

Hosted English and direct-file Russian Edge covered rich-text formatting and selection, compatible sort and search, selection exclusion and reopen, person tag and unlink, undo/redo, rapid note switching, fallback on missing or failing Quill, and project isolation. Deterministic tests covered search parity and relevant revisions and verified that compatible markup retains the editor while incompatible content detaches both listeners. Project-data-contract and Diagnostics checks passed.

A separate hosted run measured Quill insert at 6.7 ms, paste at 8.7 ms, undo at 3.6 ms and redo at 3.3 ms with search active. The next warm refresh took 9.4 ms and kept the editor. These are single after-only operation timings.

The private imported project, all saved filter combinations, and touch-specific interaction remain outside this capture.
