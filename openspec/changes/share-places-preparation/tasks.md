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

Node checks passed for combined person, surname, event and date filters, association ordering and deleted people, duplicate and owner regressions, mount scheduling, the read-model lifecycle, canonical data and Diagnostics. The original performance run did not exercise live editing and route controls. The follow-up below records that coverage.

## Map editing continuity follow-up

Hosted Edge reproduced the issue in both Add and Move from the place editor. Searching while a draft point was selected kept the same map, marker and session but hid the coordinate bar, removed the picking class and showed “No point selected”. In Move it also cleared the visible radius text.

The replacement controls now read the existing edit mode, pending point and radius text at bind time. They restore the picking class, coordinate bar, instructions, validation and confirmation state. Retained markers and overlays stay with the map. Cancel restores the session snapshot and recomputes the draft's dirty state. Use position returns to the editor with the chosen position staged. Save remains the canonical write. Genuine map disposal cancels the map edit.

- The deterministic retained-markup test covers loading and ready host reuse, unchanged and changed lists, no point, invalid and valid radius, marker identity, one handler per replacement control, Cancel and Use position. The mount scheduler, selector, duplicate, unlinked Places, project-data-contract and Diagnostics tests also passed.
- Hosted Whiskerfield Edge checks covered Add and Move from the modal, no point, invalid and valid radius text, draft marker movement by keyboard, search, filter removal, EN/RU refresh, MapLibre style reload, route and radius overlays, Cancel, Use position, approximate and exact Save, switching to List, and switching projects during a live Move session. The map and request identity stayed stable through compatible updates. Direct-file Russian fallback to List passed.

| Mode | Cold entry | No matches | Clear search | Matching search | Needs review |
| --- | --- | --- | --- | --- | --- |
| Hosted | 29.0 / 29.7 / 29.6 | 4.2 / 4.4 / 4.5 | 17.6 / 11.9 / 13.3 | 13.5 / 11.7 / 10.6 | 9.9 / 10.0 / 8.4 |
| Direct file | 36.0 / 31.0 / 42.0 | 4.0 / 4.8 / 4.6 | 11.9 / 11.7 / 9.1 | 16.8 / 16.6 / 16.3 | 10.5 / 7.1 / 11.1 |

The table reports milliseconds from three runs per protocol on the same synthetic workload. All six runs recorded one query per render, zero per-place people lookups, and one duplicate comparison build across the five renders. The private GEDCOM and pointer-based dragging on touch devices remain unverified in the browser.

