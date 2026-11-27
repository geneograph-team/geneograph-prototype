# Tasks

- [x] Reproduce repeated Places query and per-row work in Edge.
- [x] Share scoped associations and exact duplicate comparisons and reuse one owner snapshot.
- [x] Retain compatible map hosts and suppress stale scheduled mounts.
- [x] Run focused deterministic tests and hosted and direct-file Edge checks.
- [x] Verify imported-project performance and obtain explicit founder acceptance (see accepted closeout and limitations).

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

## Founder follow-up — selected inspector

A hosted Edge fixture with 6,481 people, 1,950 families and 19,453 project events placed 9,600 events at one saved place and one event at a sparse control. Before the correction, a heavy inspector render repeated 158,124 date sort-key calculations, about 27,085 name-format calls and 12,346 global person lookups. Grouping and sorting took 543–587 ms across the matched operations. The collapsed preview formatted only 14 rows, and Archive and Notes collection lookups were below 1 ms in this fixture.

The inspector computes dates once per connected event and names once per group. It uses the project people index for scoped records, preserves legacy missing and foreign resolution, and retains one prepared grouping per active project, place and language. Plans with unresolved or foreign owners rebuild on repeat reads so those owners cannot go stale. Only rows within the existing preview or expanded view are formatted. Diagnostics reports event counts, owner visits, group preparation and visible rows, with evidence and DOM timing on selection.

| Heavy inspector operation | Prior hosted, ms | Corrected hosted, ms | Corrected direct file, ms |
| --- | --- | --- | --- |
| Selection, cold then warm | 583.5 / 569.1 / 556.7 | 46.5 / 5.3 / 5.4 | 47.3 / 4.8 / 5.3 |
| Full refresh | 545.9 / 556.6 / 572.3 | 2.9 / 2.7 / 2.6 | 3.0 / 2.7 / 2.7 |
| Partial refresh | 562.8 / 571.0 / 590.3 | 2.4 / 2.2 / 2.2 | 2.6 / 2.3 / 2.2 |

Sparse selection measured 19.9 ms before and 19.9/22.1 ms after, hosted/direct file. The heavy cold preparation computed 9,600 date keys, visited 12,327 owner memberships, and prepared 6,481 groups. Warm renders skipped grouping and sorting. The normal inspector still showed five groups and 14 rows. Hosted search and clear took 2.9 and 4.1 ms, each with one query. A separate open-and-save rename exercise took 1,026.5 ms before and 99.4 ms after hosted, and 77.9 ms from file. It includes the save handler and refresh.

View all and Show less retained their original contents and controls. Hosted expansion measured 1,138 / 1,155 / 2,044 ms before and 511 / 474 / 417 ms after. Collapse measured 1,722 / 2,304 / 2,722 ms before and 1,059 / 1,013 / 1,175 ms after. Direct-file after samples were 510 / 489 / 452 ms to expand and 1,119 / 1,005 / 1,114 ms to collapse. These are separate browser measurements on the intentionally large expanded view. Expanded DOM work remains substantial.

Hosted English and direct-file Russian checks passed for heavy and sparse selection, search and clear, View all and Show less, save refresh, and person evidence navigation. Hosted map editing continuity with routes, theme, language, project switch and exact and approximate saves passed again. Deterministic inspector, map editing, map mount, association, duplicate, unlinked Places, project-data-contract and Diagnostics checks passed. The founder's private GEDCOM and live source/media/note link edits were outside this follow-up capture. Founder acceptance remains pending.

## Accepted closeout — 27 November 2026

Founder explicitly accepted #455 and requested archival. Implementation `5e0eab21521ebbb7c2ca4c156d14ebd0513cc56a`, map editing continuity correction `288d2190f79f94f3014d5c1bac166e78fa29778b`, inspector correction `1a06703a43d487299031dbe4aabd6150ea50d4af`. Both capability deltas are already integrated in current specs; no new runtime or normative changes at archival.

Final founder Detailed schema-3 recording on imported GEDCOM: 33 completed operations, zero drops, one recording epoch, 6,481 people / 1,950 families / 151 initial matching places. Places navigation 57.2 ms, initial render 52.5 ms; 14 render/query samples 7.7–55.9 ms, each with one query call (0.3–2.6 ms except the final 16.2 ms query including association preparation). Five selections 8.6–22.9 ms; selection evidence 4.7–16.2 ms, DOM 0.9–1.3 ms. Maximum evidence across Places render/query/selection 17.8 ms. Heavy selection #32: 946 connected events, 1,312 owner visits, 498 groups prepared, five groups and 13 rows rendered; projection 11.3 ms, total 22.9 ms, frame opportunity 26.8 ms. Final render #33 reports the same group/event counts, projection 10.7 ms and 55.9 ms total. Earlier imported test maxima were selection 474 ms, render 834.3 ms, evidence 474.8 ms; these observational comparisons corroborate the synthetic correction but are not controlled matched benchmarks or paint times. Earlier Test B repeated per-place association queries were removed; association provider builds 9.9–14.6 ms in final capture, duplicate builds 15.0–20.1 ms, with compatible reuse.

Two map initializations completed, zero canceled: 2,236/415.4 ms async elapsed with 12.1/10.7 ms synchronous setup. Page-wide 10 long tasks, total 1,761 ms, max 542 ms include import/Tree and other work, not attributable solely to Places. Two legacy invalidations/eight evictions remain #474 evidence; #312 owns insight destination functionality and #460 integrated regression.

Founder accepts normal browsing/selection and documented limitations. Large expanded event views retain existing full content and substantial DOM cost (synthetic hosted View all 417–511 ms, Show less 1,013–1,175 ms). Touch dragging, full saved-filter/project-switch matrix, live source/media/note link edits and comprehensive cross-engine/viewport coverage remain incomplete; the final trace does not establish every map edit, save/cancel or review correctness outcome. No runtime tests independently rerun at archival; prior local deterministic/browser results remain as reported. Original unchecked issue criteria remain historical, not claims that every check ran. No private dataset or raw export committed.
