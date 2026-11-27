# Tasks

- [x] Implement hybrid source mapping, readable evidence, conservative URL extraction, real NOTE links and accurate source counts without schema changes.
- [x] Add synthetic regression fixtures covering shared/detailed citations, identity, different evidence, links, URL ambiguity, unsafe content, source categories and family citation limitations. Combined actual-source V8 checks of baseline mapping, rich text, citations, portrait mapping and mocked local/online crop acquisition passed; native URL, full native Node and browser checks remain pending.
- [ ] Run native GEDCOM/localization suites and browser Archive Sources/connected-source and report checks (EN/RU, direct file and hosted); verify private sample locally.
- [ ] Reconcile baseline GEDCOM spec and archive after material QA/acceptance.

The existing canonical link contract does not support family targets. Unresolved family citations are kept as Sources and reported instead of being attributed to individuals. Exact reconstructed evidence structure is used conservatively; equivalent but differently formatted citations may remain distinct. No private genealogy or network lookup in tests.

## Closeout — 2026-11-27

- [x] Founder explicitly accepts completed work and authorizes administrative closeout and archive.
- [x] Reconcile current baseline requirements and archive the change in the closeout PR.

#486 accepted under #483; #496 merged. Native/browser and private sample verification not independently run; family citation target limitation retained.

Unchecked execution/QA items above are retained as historical verification limitations, not outstanding acceptance blockers. Founder acceptance does not imply those checks were run. Reopen a new issue if further QA identifies a defect.
