# Family Tree Stress Test — temporary GEDCOM fixture (#446)

> **INTERNAL QA ONLY — REMOVE BEFORE OPEN USER TESTING.** This replaces the #381 synthetic ancestor project, not Whiskerfield. The founder explicitly approved bundling this pseudonymized dataset for temporary QA. Generic names and fixed date shifts do not make it anonymous; removing files later does not erase Git history. Never add the original genealogy or unshifted export.

## Dataset

- 6,481 people, 1,950 nonempty families, 7,237 recorded GEDCOM date lines. The source had 13 additional empty, unreferenced FAM records; they contain no relationships or events and are omitted.
- Data-only classic script: `src/seed/family-tree-stress-data.js` (approved shifted-date GEDCOM). Expected SHA-256 for the generated UTF-8 file: `2fa531ef68a941f12ca7075b35b029422b7b2f05000f2a19c8744a1211f1fad6` (LF).
- Names are generic; original names, locations, notes, source citations, media, and contact information are not included.
- Default focus is the first exported person, Person 2573 (`p-family-tree-stress-person-1`), with shifted birth date 4 April 1999.
- Multiple partnerships, incomplete ancestry, broad sibling groups and repeated family contexts replace the previous complete binary pedigree. Separate small synthetic layout cases continue to test precise geometry.

## Loading

The project card advertises 6,481 people before loading. Opening it for the first time uses the existing GEDCOM parser, mapper and detached canonical validator. Only complete validated collections are installed; the importer derives timeline events. No network fetch, second project creation, or additional dependency. Reopening preserves edits. Fully reload after changing the fixture.

## Verification

Run `node tests/family-tree/test-family-tree-stress-fixture.cjs`, `node tests/projects/check-gedcom-import.cjs`, `node tests/projects/check-project-data-contract.cjs` and `node scripts/check-localization-catalog.cjs`. Check real browser first-open timings, both Tree orientations, focus/navigation and incomplete ancestry, People directory, switching to Whiskerfield and reopening with edits, HTTP(S) and direct file opening. Node timings are not browser layout timings.

## Mandatory removal before open user testing

- [ ] Delete `src/seed/family-tree-stress-data.js`, `src/seed/family-tree-stress-test.js` and their script tags in `src/index.html`.
- [ ] Remove `p-family-tree-stress` metadata and lazy-count special case from `src/seed/sample-data.js`.
- [ ] Remove the first-open hook from `src/shared/shared-actions.js` and technical project translations from `src/localization/shared-projects.js`.
- [ ] Remove `tests/family-tree/test-family-tree-stress-fixture.cjs`, this guide, dedicated OpenSpec requirement, and temporary references in `README.md`, `AGENTS.md`, `doc/source-map.md` and `tests/README.md`.
- [ ] Verify no technical project or data is present in the distributed build. Run core validation and browser smoke tests including file://.
- [ ] Review and document removal in the release PR; do not remove general People adapter fixes or shared importer functionality.
