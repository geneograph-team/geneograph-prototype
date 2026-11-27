# Tasks

- [x] Correct shared relationship connection, inherited parentage, explicit role and edit conflict handling.
- [x] Add focused synthetic regression tests; execute actual source assertions in a V8 isolate, including mixed types, both-parent paths, cycles, conflicts, project isolation, role retention, successful/failed edit and all four branch presets.
- [ ] Run native Node regression suites, including canonical data contract and Geneograph Sync.
- [ ] Verify real browser flows including Add Person/possible match, mounted color refresh, sibling placeholders, EN/RU and direct file. Confirm implicit unique-family Add parent behavior with founder.
- [ ] Complete baseline spec integration and archive after material acceptance checks.

No browser or native Node test execution was available through the connected repository environment. The regression executes actual production writers with synthetic state and stubbed UI/derived-event hooks; it is not proof of rendered behavior or cache invalidation. Existing Geneograph transfer validates projected ancestry and biological parent counts; no change in this PR.
