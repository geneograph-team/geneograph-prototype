# Tasks

- [x] Implement shared country context, stable country filters, import-only coordinate extraction and conservative deduplication; normalize geocoder presentation.
- [x] Add synthetic mapping and provider-format tests. Actual-source V8 baseline, rich-text/citation mapping and new country/coordinate/duplicate checks and documented-provider formatting fixtures passed; native Node/browser tests remain pending.
- [ ] Run native suites, verify hosted/direct-file EN/RU UI, saved filters, actual provider payloads and private sample import. Reconcile verified baseline specs and archive after acceptance.

Provider fixtures are based on Geoapify/LocationIQ documented structured fields, not live responses. Poland-specific PK/PL-18 mapping is deliberately narrow. Unresolved aliases and ambiguous cases remain separate. No new requests or schema.
