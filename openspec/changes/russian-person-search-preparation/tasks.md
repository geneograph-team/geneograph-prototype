# Tasks

- [x] Isolate the cold Russian directory cost in the actual browser implementation.
- [x] Bound obsolete embedded-rule work and verify real-catalog parity and structural work.
- [x] Compare fresh hosted EN/RU runs and verify shared browser navigation and search.
- [ ] Founder acceptance and archival.

## Root cause and measured work

In a separately instrumented hosted run, Russian cold navigation built 6,481 haystacks and made 64,845 translation calls, with 12,984 dynamic cache misses. Inclusive dynamic work took 6,569 ms. The embedded sweep accounted for about 6,270 ms and 49,404,120 regex attempts. English made zero dynamic calls. After the fix the same workload still made 12,984 dynamic calls, but only 6,481 embedded regex attempts, with about 31 ms spent in the embedded helper. The enclosing Russian dynamic stage took about 170 ms. This measures the nested work and those durations must not be added.

## Matched hosted Edge comparison

Fresh, isolated profiles, same Windows host, local static server, viewport, dark theme, stress workload, and 25 visible rows. The baseline used the original embedded replacement loop through a temporary localization overlay. Each run activated the project, opened People, returned to Projects and reopened People. The sequences below are milliseconds in run order, followed by the median in parentheses. Page-wide long-task maxima cover the recording and cannot be attributed to a specific action.

| Metric | EN before | EN after | RU before | RU after |
| --- | --- | --- | --- | --- |
| Cold People navigation | 158.6 / 173.9 / 211.3 (173.9) | 170.1 / 175.8 / 182.2 (175.8) | 6556.6 / 6726.6 / 7565.6 (6726.6) | 411.8 / 395.3 / 360.9 (395.3) |
| Directory build | 64.8 / 62.7 / 72.2 (64.8) | 56.2 / 68.1 / 65.0 (65.0) | 6452.5 / 6550.6 / 7386.0 (6550.6) | 331.3 / 315.1 / 217.3 (315.1) |
| Warm People return | 53.5 / 38.9 / 42.8 (42.8) | 35.9 / 31.9 / 30.4 (31.9) | 61.4 / 61.9 / 62.0 (61.9) | 44.4 / 31.3 / 30.4 (31.3) |
| Longest observed browser task | 158 / 174 / 211 (174) | 170 / 176 / 182 (176) | 7456 / 7735 / 8576 (7735) | 426 / 411 / 384 (411) |

Each run built the directory once, reused it on return and prepared 25 rows on the full result. Russian retained a measurable cold cost from the remaining dynamic phrase work. The measurements do not define a latency budget.

## Verification

Node compared the ordered embedded rules and dynamic phrases with the previous algorithm using the real catalogs. It also checked localized and raw search parity, language toggling, substitution ordering, unchanged canonical values, the existing cache limit, and zero embedded regex attempts for 6,481 distinct names without matching literals.

Hosted and direct-file Edge verified English and Russian directory and Tree picker results, Russian single-person picker search and selection, filtering, sorting, paging, Profile entry/return, project isolation and name-edit refresh. This used the sample and built-in stress projects. Published production, other browser engines and a complete picker interaction matrix were outside the run. Private traces were not checked in.
