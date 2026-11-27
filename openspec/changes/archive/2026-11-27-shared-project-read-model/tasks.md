# Tasks

- [x] Implement lazy active-project retention, domain revisions and legacy fallback.
- [x] Add scoped people and relationship providers and adopt them in People and Profile.
- [x] Document ownership, mutation and performance development contracts.
- [x] Add structural regression coverage and run the browser comparison.
- [x] Founder acceptance and OpenSpec archival.

## Verification

Node passed the read-model lifecycle and People directory regressions, person search and matching, project-data contract, GEDCOM, unlinked Places, Family Tree ELK and occurrences, the stress fixture, and localization catalog. The new fixtures assert lazy builds, retention and dependency tokens, project ownership and duplicate IDs, raw versus eligible lookups, membership order, typed and legacy invalidation, switch/replacement/disposal, bounded page details and Profile independence.

Edge passed hosted desktop, direct-file desktop and hosted 390 px mobile runs with English/dark and Russian/light coverage. Checked project switching, 10/25/50/100 row pages, empty search results, Profile navigation, the edit control, evidence relinking, name refresh and deletion fallback. A forced GEDCOM activation failure verified that staged records could be read without retention, the previous canonical project returned, and the dirty revision did not advance.

### Matched desktop Edge comparison

One synchronous timing sample per operation on the same Windows host, static server and 25-row page. Cold stress entry includes fixture activation. Paint and portrait decoding are outside this measurement.

| Workflow | Whiskerfield before → after | Linked GEDCOM import before → after | 6,481 people / 1,950 families before → after |
| --- | ---: | ---: | ---: |
| Cold People entry | 68 → 56 ms | 119 → 128 ms | 444 → 486 ms |
| Warm directory | 15 → 16 ms | 24 → 24 ms | 39 → 38 ms |
| Profile entry | 26 → 28 ms | 18 → 18 ms | 7 → 6 ms |
| Profile switch | 14 → 20 ms | 10 → 10 ms | 6 → 6 ms |
| Return to directory | 18 → 17 ms | 26 → 24 ms | 41 → 38 ms |
| Page | 19 → 13 ms | 25 → 24 ms | 40 → 37 ms |
| Search | 7 → 8 ms | 21 → 22 ms | 43 → 42 ms |
| Sort | 21 → 16 ms | 24 → 25 ms | 40 → 40 ms |
| Filter | 9 → 14 ms | 16 → 16 ms | 9 → 9 ms |

Warm Profile prepared one display record and made zero whole-family collection calls on all three workloads. It previously made 8–11 calls. Profile built zero directory graphs in both revisions. Warm directory prepared at most 25 visible records and reused the graph. Actual stress preview stayed at 5 ms and retained the table. Cold stress entry was slower in this sample, including fixture activation. Graph/label preparation, full-population query and the legacy preview inspector remain places to measure in integrated work. No numeric budget is claimed from a single run.

Browser coverage used Edge and programmatic control. Published HTTPS, other browser engines, physical touch, and a complete edit/save interaction matrix were outside the run. The founder explicitly accepted the implementation and documented verification on 27 November 2026; archive in the separate closeout PR. The unperformed coverage above remains unverified. No new runtime tests were performed during this documentation-only closeout.
