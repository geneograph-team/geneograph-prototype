# Tasks

- [x] Review private GEDCOM structure without committing personal data; implement original-first staged matching, per-person normalized regions and fallback/report behavior.
- [x] Add synthetic mapping and asynchronous attachment tests for shared originals, invalid/missing positions, missing originals, ambiguous identity and unrelated files. Actual-source V8 mapping/strict validation and local/online mocked attachment paths passed; native Node and real image/browser execution remain pending.
- [ ] Run native Node and browser QA, including local folder and opt-in online downloads, real image dimensions and portrait rendering in Albums/Profile/People/Tree, EN/RU, direct-file and hosted. Review private sample only locally with consent for online requests.
- [ ] Reconcile baseline GEDCOM spec and archive after acceptance.

Pixel rectangles are validated against decoded image dimensions; actual private original images have not been downloaded or verified. Unsupported or ambiguous links retain their fallback where available.
