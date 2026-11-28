# Tasks

- [x] Correct shared relationship connection, inherited parentage, explicit role and edit conflict handling.
- [x] Add focused synthetic regression tests; execute actual source assertions in a V8 isolate, including mixed types, both-parent paths, cycles, conflicts, project isolation, role retention, successful/failed edit and all four branch presets.
- [ ] Run native Node regression suites, including canonical data contract and Geneograph Sync.
- [ ] Verify real browser flows including Add Person/possible match, mounted color refresh, sibling placeholders, EN/RU and direct file. Confirm implicit unique-family Add parent behavior with founder.
- [x] Reconcile verified baseline spec and data contract and archive following founder acceptance.

No browser or native Node test execution was available through the connected repository environment. The regression executes actual production writers with synthetic state and stubbed UI/derived-event hooks; it is not proof of rendered behavior or cache invalidation. Existing Geneograph transfer validates projected ancestry and biological parent counts; no change in this PR.

## Acceptance and archive

Issue #493 was accepted and closed by the founder on 27 November 2026; implementation merged via #495 at `7204ce77`. The founder requested archival on 28 November 2026 in PR #507. The founder-approved unique eligible single-parent family behavior is retained; multiple eligible families use a separate parent-only family. Current source review confirms inheritance of each recorded child type, shared pre-mutation validation, explicit-role retention in sibling isolation, and Biological edit conflict checks. Native Node and full browser checks originally pending above remain unchecked; no additional runtime tests performed for this archive. Original issue acceptance explicitly covers those limitations, not evidence that the checks ran.
