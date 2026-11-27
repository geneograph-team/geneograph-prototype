# Tasks

- [x] Reproduce repeated Places query and per-row work in Edge.
- [x] Share scoped associations and exact duplicate comparisons and reuse one owner snapshot.
- [x] Retain compatible map hosts and suppress stale scheduled mounts.
- [x] Run focused deterministic tests and hosted and direct-file Edge checks.
- [ ] Verify the founder’s imported GEDCOM and obtain acceptance.

## Verification

The matched workload used 151 distinct synthetic places, 6,481 people, 1,950 families and 19,453 project events. Before the change, a single hosted run measured 806 ms for cold list entry, 299 ms for a no-match search, 809 ms to clear it and 365 ms for a matching search. Each render ran two queries. The four renders made 1,524 calls to the per-place people lookup.

| Mode | Cold entry | No matches | Clear search | Matching search | Needs review |
| --- | --- | --- | --- | --- | --- |
| Hosted | 29.7 / 27.9 / 28.3 | 4.3 / 4.1 / 4.2 | 19.4 / 21.3 / 9.6 | 10.7 / 10.9 / 14.9 | 9.9 / 9.3 / 9.9 |
| Direct file | 30.7 / 32.2 / 30.7 | 5.7 / 6.6 / 5.0 | 20.2 / 22.0 / 8.9 | 12.3 / 11.2 / 11.3 | 7.0 / 7.3 / 9.6 |

Timings are in milliseconds. The direct-file runs used Russian. Each updated run recorded one query per render, zero per-place people lookups, and one duplicate comparison build across the five renders. Baseline Needs review and a direct-file baseline were outside this capture.

Hosted Whiskerfield MapLibre retained the loading and ready host through search. Camera, latest results, renamed markers, language refresh and selection checks passed. Switching to list and exiting disposed the map, and returning to map mode mounted a new host. One instrumentation run recorded a completed initialization at 1,540 ms with 662 ms of setup, and a canceled remount at 70 ms with 61 ms of setup. Direct-file fallback to list passed. These are individual initialization samples while the provider was reachable.

Node checks passed for combined person, surname, event and date filters, association ordering and deleted people, duplicate and owner regressions, mount scheduling, the read-model lifecycle, canonical data and Diagnostics. The private GEDCOM, live map editing and route controls, and full project-switch and saved-filter browser coverage remain unverified.
