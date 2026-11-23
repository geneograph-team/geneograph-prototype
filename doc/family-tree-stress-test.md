# Family Tree Stress Test — internal fixture (issue #381)

> **INTERNAL QA ONLY — REMOVE BEFORE OPEN USER TESTING.**
> This temporary project is not a demonstration tree, research dataset or user-facing feature. It MUST be removed from the application and default branch before the first open user-testing build. Disabling visibility alone is not sufficient: delete the fixture, project metadata, activation hook and script references. Track that removal explicitly in the release checklist.

## Purpose and limits

This project exercises GeneoGraph's **Family Tree** with a large, **single-appearance branching pedigree**. It is a repeatable regression and performance input for #318 (deep layout), #319 (**single-instance identity baseline**, not multiple-family contexts), #320 (zoom/card readability), #321 (photo-light rendering baseline) and umbrella #379. The fixture contains **no people from Whiskerfield**, photos, sources, narrative biographies or research claims. It is **not** intended to resemble historical demographics.

- Project: `Family Tree Stress Test [TEST ONLY]`, project ID `p-family-tree-stress`.
- Exactly **1,200 people** in ten cohorts: 1740 (2), 1770 (10), 1800 (22), 1830 (40), 1860 (64), 1890 (96), 1920 (150), 1950 (220), 1980 (280), 2010 (316). **Exactly 30 years** between the synthetic birth years of recorded parent and child.
- **442 family records**, one connected person–family **membership tree**: no reconverging ancestry, no pedigree loops, no duplicate partner families or parent families for any person. Every person belongs to **at most one family as a partner** and **at most one family as a child**. This prevents the test data from requiring repeated visual appearances of the same canonical person.
- Two founders form the first couple. Each following paired generation contains descendants and newly introduced partners of the **same birth cohort**, each recorded in one partner family. New partners have **unknown parents**, so an “Add father” / “Add mother” placeholder may be expected above those individuals; it does not represent a second person. All such partners are connected to the founding couple through recorded marriage and descendant links.
- Asymmetric branches, cousins and **23 eight-child families** provide density without multiple partnerships, half-sibling branches, consanguinity or shared-ancestor reconvergence. Complex multiple-family contexts belong to separate #319 tests, not this baseline fixture.
- Generic `Person 0001`–`Person 1200` names and deterministic `stress-person-0001`… IDs. Numeric surname fields are intentionally synthetic. Birth dates are year-only and Gregorian; other date/place fields are unknown. No images are generated, so this is a **photo-light volume baseline**, not a photo-heavy #321 fixture.
- Generator version: **v2** (single-appearance pedigree), defined by `FAMILY_TREE_STRESS_TEST_COHORTS` and deterministic family allocation in `src/seed/family-tree-stress-test.js`. Reproducibility is tested by full JSON equality on repeated builds.

## Loading and safe use

The Projects list includes only lightweight project metadata at initial startup. The generator code loads as an ordinary local deferred script, but **does not construct the people/families** until the first `activateProject()` call for this project. After building the detached graph, canonical validation runs **before** people/families and derived timeline events are installed together. A failed validation leaves the shared arrays unchanged and refuses activation.

Reopening or switching projects in the same browser session reuses the records without regeneration or overwriting edits. Everything remains memory-only like the rest of the prototype; a browser reload reconstructs the same canonical fixture after opening again. This works with `file://` without a fetch request, backend or worker.

**After updating the generator, perform a full page reload before testing.** An already-open tab retains its previous in-memory test records until reload; switching projects alone will **not** replace those records.

The Projects card displays the **intended 1,200-person count before materialization**, not a zero-person preview. Whiskerfield (`p1`) is unchanged. Project IDs and person/family IDs are isolated.

## Stable QA focus points

| Scenario | Select |
| --- | --- |
| Default central focus, generations above and below | `stress-person-0349` (1920 descendant with recorded ancestry) |
| Founding couple / oldest cohort | `stress-person-0001`, `stress-person-0002` (1740) |
| Last cohort / distant descendants | `stress-person-1200` (2010) |
| Wide sibling family (8 children, one pair of parents) | `stress-family-0007`; e.g. `stress-person-0035` |
| Another wide household at the next generation | `stress-family-0018`; e.g. `stress-person-0075` |
| Married-in spouse with unknown ancestors | `stress-person-0014`, partnered with `stress-person-0013` in `stress-family-0007` |
| No duplicate contexts after navigating between branches | `stress-person-0349`, then `stress-person-0035`, then `stress-person-1200` |

Ten project cohorts **do not imply ten simultaneously visible Tree rows**. Current controls cap ancestry at six generations and descendants at five, each relative to a focus person. Move focus between cohorts to test the full range; changing those limits is outside #381.

## Checks and benchmarking

Run `node scripts/test-family-tree-stress-fixture.cjs`. The dependency-free test verifies count, determinism, generation spacing, **connectedness of all person and family nodes**, and **acyclicity of the person–family membership graph** (exactly one path between any two nodes). It also asserts at most one parent and partner family per person, canonical validation, 8-child families, isolation from Whiskerfield, first-open loading, no duplicate records on reopen and preservation of an edit. The **People module's directory record adapter is exercised with all 1,200 records**, including absence and presence of optional `person.meta.updated`; missing metadata must not crash the People view. This structural check prevents fixture-induced repeated appearances; only real browser QA can confirm rendering.

For browser QA, measure:
1. Startup with stress project **unopened** (confirm no stress records in `sampleData.people`).
2. First open of test project, then reopen after navigating back; record elapsed time and heap use if available.
3. Focus on `stress-person-0349`, `stress-person-0035`, `stress-person-1200`; record visible card count, projection/layout/render times, navigation, pan, fit, zoom levels and keyboard/inspector behavior. **Check rendered cards for duplicate `data-person-id` values within each view and report any repeats as a Tree rendering bug, not as acceptable fixture data.**
4. EN/RU and light/dark, desktop/narrow viewport; verify Whiskerfield still works and project switching never leaks records.

Collect measurements in the PR/issue or QA notes, not in permanent source files. Node-side build/activation timings are **not** browser paint/layout measurements. Photo-heavy avatar tests require a separate #321 fixture.

## Mandatory removal checklist — before open user testing

- [ ] Delete `src/seed/family-tree-stress-test.js` and its `src/index.html` script tag.
- [ ] Remove the `p-family-tree-stress` project metadata and lazy-count special case from `src/seed/sample-data.js`.
- [ ] Remove the `ensureFamilyTreeStressTestProjectLoaded` activation hook in `src/shared/shared-actions.js`.
- [ ] Remove the technical project name/description translations from `src/localization/shared-projects.js`.
- [ ] Remove `scripts/test-family-tree-stress-fixture.cjs`, this temporary guide, and the dedicated OpenSpec requirement; update `README.md`, `AGENTS.md` and `doc/source-map.md` references.
- [ ] Verify Projects lists only intended public samples, run `node scripts/check-project-data-contract.cjs`, recheck navigation and `file://`, and inspect the built release output for `p-family-tree-stress` or `stress-person-` references.
- [ ] Document removal in the open-user-testing release PR before deploying that build.

No CI/deployment changes belong to this internal fixture PR.
