# Tasks

- [x] Review private GEDCOM structure without committing personal data; implement original-first staged matching, per-person normalized regions and fallback/report behavior.
- [x] Add synthetic mapping and asynchronous attachment tests for shared originals, invalid/missing positions, missing originals, ambiguous identity and unrelated files. Actual-source V8 mapping/strict validation and local/online mocked attachment paths passed; native Node and real image/browser execution remain pending.
- [ ] Run native Node and browser QA, including local folder and opt-in online downloads, real image dimensions and portrait rendering in Albums/Profile/People/Tree, EN/RU, direct-file and hosted. Review private sample only locally with consent for online requests.
- [ ] Reconcile baseline GEDCOM spec and archive after acceptance.

Pixel rectangles are validated against decoded image dimensions; actual private original images have not been downloaded or verified. Unsupported or ambiguous links retain their fallback where available.

## Closeout — 2026-11-27

- [x] Founder explicitly accepts completed work and authorizes administrative closeout and archive.
- [x] Reconcile current baseline requirements and archive the change in the closeout PR.

#485 accepted under #483; #496 merged. Actual private image decode/render and browser/native suites were not independently run.

Unchecked execution/QA items above are retained as historical verification limitations, not outstanding acceptance blockers. Founder acceptance does not imply those checks were run. Reopen a new issue if further QA identifies a defect.
