# Tasks

- [x] Implement bounded HTML-to-text/Delta conversion, plain text fallback, shared note preservation and localized simplification report.
- [x] Add synthetic fixtures and run isolated actual-source mapping and strict validation checks; review follow-up also checks link destinations in plain-only evidence, malformed residual markup and referenced family-note composition in V8.
- [ ] Run full native Node GEDCOM and localization checks; verify actual browser Notes editor, search, save, import preview and report in EN/RU, served and direct-file, including private founder sample.
- [ ] Integrate verified baseline spec and archive after material QA/acceptance.

Isolated V8 fixtures used actual importer and validation sources with synthetic records, simple URL and structuredClone substitutes. Browser-specific entity decoding and native URL semantics remain unverified. No private genealogy committed.

## Closeout — 2026-11-27

- [x] Founder explicitly accepts completed work and authorizes administrative closeout and archive.
- [x] Reconcile current baseline requirements and archive the change in the closeout PR.

#484 accepted under #483; #496 merged. Native/browser and private sample checks not independently run.

Unchecked execution/QA items above are retained as historical verification limitations, not outstanding acceptance blockers. Founder acceptance does not imply those checks were run. Reopen a new issue if further QA identifies a defect.
