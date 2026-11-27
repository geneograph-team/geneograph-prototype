# Tasks

- [x] Confirm the live #454 provider, mutation and disposal boundaries.
- [x] Add bounded and allowlisted provider, operation, stage and browser evidence to the existing recorder.
- [x] Document measured coverage, gaps, schema and recording protocol.
- [x] Run focused recorder, provider and application regressions.
- [ ] Founder acceptance and OpenSpec archival.

## Verification

Node passed application and Tree diagnostics, Tree ELK and occurrences, People directory preparation, shared person search, the project read-model lifecycle, project-data contract, GEDCOM, unlinked Places and localization. The recorder tests cover scope, privacy, nested attribution, provider builds/reuse, dependency invalidation and disposal, unsupported browser metrics, frame opportunities, asynchronous completion and cancel/stop, epoch changes, eviction and bounded storage.

Headless Edge verified real project/module navigation, People cold and warm preparation, Profile, Places selection/review, Archive partial render, Albums navigation, Notes selection and editor mount, Geneograph board open, typed place invalidation, project disposal, Basic selected scope, manual JSON download, and the Russian settings and topbar Stop shortcut. The sequence ran over loopback and direct file. Hosted Places separately recorded a completed asynchronous initialization of 1,728.7 ms with 678.4 ms in the synchronous map setup stage. The difference includes other work and waiting.

## Sample interpretation

One hosted Detailed export retained 46 operations and no drops. On the 6,481-person stress workload, a cold People render took 84.6 ms and prepared 25 rows. Its directory provider build took 51.9 ms, including a nested 10.9 ms graph build. A warm render took 26.8 ms with a directory cache hit. Warm sorting took 14.9 ms, markup 3.7 ms and DOM insertion 2.0 ms. Search examined the same 6,481 candidates but matched and prepared one row and took 7.5 ms. A place-domain invalidation rebuilt the directory projection while reusing relationship labels. These examples distinguish cold preparation, warm sorting and visible rendering without adding overlapping measurements.

In a 15-render warm Whiskerfield comparison, median disabled and Detailed times were 13.1 and 13.2 ms over loopback, and 23.7 and 24.3 ms from disk. These samples indicate the overhead in this harness only. The browser reported long tasks, but the harness batched multiple actions in one script turn, so the aggregate cannot identify a single slow user operation.

The export is disposable and local. No private data or trace is checked in. Physical touch, other browser engines, live Publish navigation, independent per-module scenario repetitions and individual decode/network attribution were outside this verification. The module optimization campaign follows acceptance.
