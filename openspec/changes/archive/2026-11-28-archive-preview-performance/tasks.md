# Tasks and verification

- [x] Capture the initial local browser baseline and compare three repeated synthetic scenarios.
- [x] Share bounded Archive preview jobs and session derivatives between Icons and Image.
- [x] Preserve compatible desktop file selection nodes and scope inspector rebinding.
- [x] Audit import invalidations with a production-path reproduction.
- [x] Run focused thumbnail, Archive and Diagnostics regressions and representative browser checks.
- [x] Founder acceptance (28 November 2026): founder reports test passed and authorizes closeout. Remaining integrated coverage is tracked by #460.

## Browser measurements

Chromium 158, 1280×720, English, local HTTP. The fixture used 158 distinct object URLs referencing a synthetic 5,600×5,600 JPEG, 6,103,297 encoded bytes per logical file. The same generated JPEG was reused for the input URLs, so cumulative logical bytes do not represent heap or network traffic. One file carried a person link. The pre-edit local run originally activated the wrong top-level module through a test argument, although the Archive render path ran. The three matched reruns activated Archive correctly and loaded its three presentation owners at the issue's reference revision, with the same fixture and interaction sequence. The reference build produced no detailed Archive stage summaries in these runs. The browser harness measured synchronous action time and next frame callback in both builds. Frame timing does not establish paint or pure decode time.

| Measure | Before | After |
| --- | --- | --- |
| Icons entry sync, three runs (ms) | 40.0, 64.2, 61.1 | 63.2, 45.8, 46.5 |
| Icons entry frame callback (ms) | 72.5, 219.3, 211.3 | 105.1, 72.7, 95.7 |
| Icons selection sync, three samples per run (ms) | 53.7/35.5/44.9, 44.4/36.5/39.5, 39.4/36.4/40.0 | 20.3/15.0/15.5, 16.8/11.3/16.8, 19.4/11.4/12.3 |
| Icons synthetic scroll frame callback (ms) | 7.7, 52.8, 5.6 | 3.0, 6.0, 6.3 |
| Icons search to ten matches sync (ms) | 37.6, 30.2, 17.4 | 17.8, 26.8, 20.2 |
| Details selection sync (ms) | 58.8–85.1 | First selection 58.2–94.3, compatible repeats 17.7–26.3 |
| Image selection sync (ms) | 7.9–14.2 | 5.3–12.4 |
| Image selection frame maximum (ms) | 215.7, 125.0, 123.7 | 25.3, 9.5, 23.0 |

Each Icons result retained 158 accessible file shells. At the settled sample, the original mounted 158 preview image elements and the patch hydrated eight. The original filmstrip mounted ten original-backed preview elements, and the patch hydrated seven. Observed preview dimensions fell from 5,600×5,600 to 192×192. The full viewer remained 5,600×5,600. Compatible Icons and Details selection preserved the existing row, and patched inspector binding measured 0.3–1.0 ms versus 30.2–47.6 ms for the patched full Details selection on the same workload.

Each patched Detailed run recorded 12 Icons jobs, 11 completed and one canceled, with seven pending at peak and one running. Eleven cached derivatives totaled 41,085 encoded bytes. The filmstrip hit that cache seven times with zero new thumbnail jobs during this sequence. Maximum asynchronous encode elapsed time was 95.0–141.5 ms across runs. Explicit full-viewer decode reached 13.5–114.5 ms across runs. The viewer retained three images with peak estimated RGBA footprint of 376,320,000 bytes. These are independent of derivative payload size and are not browser memory measurements.

Separate Entire application + Detailed samples recorded nine long tasks, 147 ms maximum, on the reference and fourteen, 156 ms maximum, on the patched run. The patched run also executed the three-file upload audit, so the aggregate is observational and cannot be attributed to preview work. The disabled-recorder patched run had 11.5–21.2 ms synchronous Icons selections and a 214.7 ms frame outlier. These runs do not reproduce the founder's multi-second scroll outliers or establish recorder overhead statistically.

## Invalidation and coverage

Three 64×64 synthetic JPEGs went through `archiveImportFiles` and produced three legacy invalidations. The source emits one per successful file. This can explain most of the historical 159 when importing 158 files, but the extra invalidation and single eviction have no attributable action in that recording. Upload semantics were left within their existing owner.

Browser checks exercised Details, Icons and Image, large-folder entry, repeated selection, shift range selection, clear, keyboard inspection, search and scroll, and desktop-to-390 px resize. Structural tests exercised project switch during an encode, source replacement, failure, oversize, high-DPI cap, cache eviction, cross-layout reuse and owned URL cleanup. The browser comparison used one image-heavy folder with repeated synthetic artwork. Broader mixed-file/evidence editing, EN/RU and light/dark repetition, native direct-file QA for this change, and the complete #460 integrated matrix remain pending. Incompatible selections and data/query changes still use full rendering including responsive variants. No source image fixtures or exported recordings are committed.

## Continuation — 28 November 2026

Founder review found that mounted preview elements accumulated as scrolling advanced, despite the URL cache budget, and that original size metadata incorrectly rejected distinct small authored thumbnails. This follow-up detaches and restores placeholders outside the near-viewport area, leases mounted URLs, enforces independent element/entry/byte limits, cancels/requeues obsolete work and checks actual selected preview source budgets. First compatible desktop file selection now retains rows and updates select-all and inspector; ordinary full renders build only the active presentation. Editing/renaming keeps both variants to avoid replacing drafts on breakpoint changes. Toolbar ResizeObserver skips unchanged geometry; inspector-only rebinding no longer duplicates the shell Alt+Up handler.

- [x] Implement continuation fixes and add focused structural regression tests.
- [x] Execute the updated thumbnail and new presentation assertions against actual source in an isolated JavaScript harness with DOM/IntersectionObserver/Node VM test doubles. Covers 125 successive tiles, re-entry after eviction, 101 simultaneously intersecting targets, byte pressure, placeholder restoration, owned URL revocation once, distinct authored vs aliased original budget, unknown oversize, rapid exit/re-entry during encode, obsolete project/observer, source replacement/error, first/repeated selection and select-all, bulk fallback, responsive markup and edit-safe breakpoint.
- [ ] Run native test scripts and real browser verification of the continuation, especially rapid scrolling through the entire collection, cache pressure, desktop/mobile breakpoint/focus/drag/drop, first selection, file rename/edit drafts, Image filmstrip and full viewer; repeat matched performance measurements and disabled overhead.
- [ ] Complete remaining mixed documents/linked evidence, EN/RU light/dark, direct-file and integrated acceptance. Previous browser results above describe the pre-continuation implementation, not the new changes. No new browser results claimed.

## Folder-local thumbnail buffer — 28 November 2026

Founder recording after PR #511: 93 completed operations, zero drops, 158 high-resolution images (229,904,030 source bytes). Compared with earlier observational recording: maximum Icons scroll frame opportunity 1,711.8 → 48.2 ms; maximum tile-load elapsed 6,499.8 → 20.6 ms; Icons selections median 64.3 → 26.1 ms; Image selections median 13.8 → 9.75 ms. Different interaction sequences; no matched statistical inference or paint/decode attribution. Icons cache 378 hits, 146 misses, 35 evictions, max 100 entries / 725,446 encoded bytes, max 42 mounted previews, one running job; maximum generation queue wait 3,176.1 ms. Full Details queries still reach 189.1 ms (binding 117.7 ms). No long-task or recorder-overhead evidence in this Archive-only export. Founder observed disappearing previews on reverse scroll and approved retaining a folder-local buffer with 256 entries, 100 mounted previews, 4 MiB encoded budget, LRU pressure cleanup and visible-first/cache-bypass behavior. This refinement does not expand Details/query or upload work (#512).

- [x] Implement bounded folder-local mounted and derivative buffers, immediate warm-cache restore and strict viewport priority.
- [x] Execute actual updated thumbnail regression assertions in isolated JavaScript with Node VM/DOM/IntersectionObserver doubles: 281 successive tiles, 256-entry/100-element limits, 101 simultaneous near targets, byte pressure, retained node identity, warm hit during active encode, foreground before prefetch, same-folder layout reuse, folder switch during encode, stale observers, original/source/URL ownership and failure handling.
- [ ] Native regression and browser QA of the revised buffer: scroll down/back through the 158-image folder, exceed both budgets with synthetic larger collections, compare warm load/miss counts and frame opportunities, verify folder exit/return and same-folder layout switching; retain outstanding integrated QA. No browser measurements of this revision yet.

## Acceptance and archival — 28 November 2026

Founder reports the test passed and explicitly accepts #456, including the final folder-local buffer. PR #513 is merged on default at `02e1b7ff174797a50154589d05ad4e52f8f062db`. This acceptance supersedes the pending standalone acceptance gate, not the historical record of which tests were run. No additional runtime or browser checks were performed at archival; the founder did not provide a new timing export or enumerate all test scenarios. The unchecked native/browser and broader integrated coverage items above remain honest historical limitations, carried proportionately into #460. Residual Details full-query cost and unattributed invalidation/eviction are accepted limitations, not new optimization work. Upload progress and folder creation behavior remain separate #512.

- [x] Integrate final requirements in `openspec/specs/archive-previews/spec.md` and move the accepted change to the dated archive (pending archival PR merge).
