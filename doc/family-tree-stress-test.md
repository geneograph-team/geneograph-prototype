# Family Tree Stress Test — internal ancestor fixture (#381)

> **INTERNAL QA ONLY — REMOVE BEFORE OPEN USER TESTING.**
> This temporary project is not a product demonstration, research dataset or sample intended for external testers. Remove its code, metadata and references completely before an open user-testing release; hiding the project card does not count.

## What this project tests

A fully populated **bottom-up ancestor pedigree**, not a descendant-growing or intermarried family graph:

- **Person 0001** (`stress-person-0001`) is the proband/default focus at the **bottom**.
- **Person 0002** is their father; **Person 0003** is their mother.
- **Persons 0004–0007** are their four grandparents.
- For every numbered person `n` with recorded parents: **father = 2n; mother = 2n + 1**. Complete all nine ancestor levels above the proband, for **10 total generations / 1,023 unique people / 511 canonical families**.
- Cohort birth years are synthetic, year-only Gregorian: 2000 (1), 1970 (2), 1940 (4), 1910 (8), 1880 (16), 1850 (32), 1820 (64), 1790 (128), 1760 (256), 1730 (512). Every parent is **30 years older** than their child.
- **No descendant branches of Person 0001 in v3**. The “first person at the bottom” and dense ancestry are the priority; descendants are an optional separate future fixture/extension, not part of this baseline.
- Every person has at most one partner family and one parent family. The bipartite person–family membership graph is a **single connected tree**: 1,534 nodes, 1,533 links, zero loops, no reconvergence, no repeated canonical people or pedigree collapse. Each canonical family has one child and two recorded parents.
- Names are `Person 0001` through `Person 1023`; dates and references are artificial. There are no photos, research claims, biographies, archive entries, places, sources or notes. Whiskerfield is untouched.

This fixture is a **high-density ancestor layout, focus/navigation, generation-boundary and identity-uniqueness baseline** for Family Tree work #318–#321 and umbrella #379. It does not cover multiple partnerships, half-siblings, wide sibling families or intentional repeated contexts; those need separate tests under #319.

## Loading and browsing

The app registers only lightweight project metadata at startup, including its expected `1,023 people` count. Opening the project for the first time generates and validates the detached canonical graph, derives timeline events and installs the records as a complete project. Switching away and back does **not** regenerate people, duplicate records or discard in-session edits. A full browser reload creates the same fixture when opened again.

This is synchronous, memory-only and works over HTTP(S) or direct `file://` without additional libraries, network APIs or persistence.

**After updating fixture code, reload the entire browser tab.** The existing tab retains old in-memory family records until reload, even if you switch projects.

## Stable QA identities

| Focus / check | Person or family |
| --- | --- |
| Default bottom / proband | `stress-person-0001` (born 2000) |
| Father and mother | `stress-person-0002` and `stress-person-0003` (1970) |
| Four grandparents | `stress-person-0004`–`stress-person-0007` (1940) |
| Great-grandparent example | `stress-person-0008`–`stress-person-0015` (1910) |
| Six levels above proband | `stress-person-0064`–`stress-person-0127` (1820) |
| Oldest ancestors, nine levels up | `stress-person-0512`–`stress-person-1023` (1730) |
| First parent family (child 0001) | `stress-family-0001`: father 0002 + mother 0003 → child 0001 |
| Next paternal family (child 0002) | `stress-family-0002`: father 0004 + mother 0005 → child 0002 |
| Maternal family (child 0003) | `stress-family-0003`: father 0006 + mother 0007 → child 0003 |

**Current Tree visibility limit:** the Family Tree's existing settings show at most **six ancestor levels at once**, with four by default. All nine ancestor levels are present in canonical data; use **Focus** to move upward through generations and inspect the entire ancestry. Raising the on-screen cap is a separate Tree feature/performance decision, not silently part of this data fixture.

## Verification

Run `node tests/family-tree/test-family-tree-stress-fixture.cjs`. The test uses the project's actual canonical validator, checks every numbered parent relationship and every complete ancestor level (2, 4, 8, …, 512 people), validates the graph's connectivity **and** lack of cycles, verifies first-open lazy materialization, stable IDs, determinism, Whiskerfield isolation, reopen-with-edits behavior, unique Tree view adapter records and People directory records with absent optional `meta` fields.

For manual browser QA, fully reload the updated PR branch, open the technical project, focus `Person 0001` and verify:

1. 0002 and 0003 appear above 0001; 0004–0007 appear above them, with correct mother/father connectors.
2. Ancestor rows are filled to the configured depth; there are no repeated person cards or inappropriate missing-parent placeholders within a filled row.
3. Focus upward to the older cohorts and verify nine ancestor levels exist in total. Check zoom, pan, recenter, keyboard, narrow viewport, EN/RU and light/dark behavior, and record actual browser layout/paint timings and visible node counts.
4. Open **People** and **Profiles**; confirm all 1,023 people are available without errors. Switch to Whiskerfield and verify isolation, then reopen this project without losing edits.

Source/Node timings are not real browser rendering benchmarks. Report any visual duplicate as a Tree rendering bug rather than accepting it as fixture data.

## Mandatory removal — before open user testing

- [ ] Delete `src/seed/family-tree-stress-test.js` and its script tag in `src/index.html`.
- [ ] Remove `p-family-tree-stress` metadata and lazy-count special case from `src/seed/sample-data.js`.
- [ ] Remove the test-project first-open hook from `src/shared/shared-actions.js`.
- [ ] Remove technical project name and description translations from `src/localization/shared-projects.js`.
- [ ] Remove `tests/family-tree/test-family-tree-stress-fixture.cjs`, this guide, the dedicated OpenSpec requirement and temporary references in `README.md`, `AGENTS.md` and `doc/source-map.md`.
- [ ] Verify the user-testing build contains no `p-family-tree-stress` or `stress-person-` records; run core project validation and browser smoke tests, including `file://`.
- [ ] Document and review the full removal in the pre-open-testing release PR.

Do not remove the separate shared People adapter fix for optional metadata; that is a general bug fix, not fixture-only behavior. No CI/deployment changes belong to #381.
