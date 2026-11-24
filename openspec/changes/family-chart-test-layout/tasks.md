# Tasks

- [x] Preserve the Classic solver and switcher; add per-project session checkbox.
- [x] Add independent offline experimental placement producer and license notices.
- [x] Add targeted regression checks for ordinary pedigree, mixed/shared branches, single-child alignment, missing parents, determinism and input preservation.
- [x] Execute isolated V8 geometry checks using the pushed source and experimental code, including 127-person and mixed/shared fixtures.
- [ ] Run repository Node test scripts from a checkout.
- [ ] Browser QA: toggle both directions, switch project/focus, edit/add relative, zoom/pan, EN/RU, themes, desktop/mobile and direct file://.
- [ ] Compare all #318 examples and #319 crossing cases with equal projection coverage, document performance and obtain adoption decision (#389).

- [x] Add two-partner family-junction placement and conservative crossing-driven occurrence splits.
- [x] Execute updated regression assertions in an isolated V8 harness: mixed and shared-ancestor fixtures have zero geometry diagnostics; shared fixture uses one additional occurrence; bridge split rejected; multi-partner, pedigree, placeholder and deterministic coverage checks pass.
- [ ] Browser-verify repeated-card selection/edit/focus, multiple partners, actual founder examples and dense-tree performance.

- [x] Restrict crossing-driven candidates to genuine shared ancestors; support branch-local contexts of one canonical parent family.
- [x] Run isolated regression assertions for shared-ancestor identity and the same-family sibling convergence (only father repeats, no false Add father, connected graph, zero diagnostics); nonintersecting control retains one card.
- [ ] Browser-confirm the founder's Marianna/Alexey example and other complex ancestry paths.

- [x] Replace three-person special case with graph-based partnership-chain ordering; reserve explicit junctions and upper tracks for nonadjacent partners.
- [x] Run isolated regressions: 4/6/8-person partner groups with descendants, both principal ancestors visible, all in-law ancestors visible; 5/8-person paths, asymmetric 1/3 and 3/1 extra partners, one-sided four extra partners, four extra on both sides, canonical edge coverage, deterministic ordering and actual child-to-partner junction attachment. Existing experimental assertions and Classic geometry snapshot comparisons pass.
- [ ] Browser-verify four-person founder screenshot, additional partners on each side, inline lane readability, focus controls, and all in-law ancestry connections.

- [x] Replace the experimental upper tracks with inline parallel partner lanes; remove extra vertical band reservations, preserve explicit family endpoints, visible child junctions and divorce style.
- [x] Run isolated regression assertions for up to four extra partners per former spouse, including all partners’ visible ancestors, no edge crossings or false card contacts; compare Classic geometry and inspect generated SVG paths.
- [ ] Verify actual inline rendering at different zoom levels and themes on founder’s dataset; confirm the pass-through convention is clear for larger partner groups.

This is an experimental view, not a completed architecture replacement. Keep the change active pending browser/evaluation evidence.
