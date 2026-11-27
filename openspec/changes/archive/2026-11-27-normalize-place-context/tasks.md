# Tasks

- [x] Implement shared country context, stable country filters, import-only coordinate extraction and conservative deduplication; normalize geocoder presentation.
- [x] Add synthetic mapping and provider-format tests. Actual-source V8 baseline, rich-text/citation mapping and new country/coordinate/duplicate checks and documented-provider formatting fixtures passed; native Node/browser tests remain pending.
- [ ] Run native suites, verify hosted/direct-file EN/RU UI, saved filters, actual provider payloads and private sample import. Reconcile verified baseline specs and archive after acceptance.

Provider fixtures are based on Geoapify/LocationIQ documented structured fields, not live responses. Poland-specific PK/PL-18 mapping is deliberately narrow. Unresolved aliases and ambiguous cases remain separate. No new requests or schema.

## Closeout — 2026-11-27

- [x] Founder explicitly accepts completed work and authorizes administrative closeout and archive.
- [x] Reconcile current baseline requirements and archive the change in the closeout PR.

#490 accepted under #483; #496 merged. Native/browser, live provider and private sample checks not independently run.

Unchecked execution/QA items above are retained as historical verification limitations, not outstanding acceptance blockers. Founder acceptance does not imply those checks were run. Reopen a new issue if further QA identifies a defect.
