# Tasks and verification

- [x] Capture the initial local browser baseline and compare three repeated synthetic scenarios.
- [x] Share bounded Archive preview jobs and session derivatives between Icons and Image.
- [x] Preserve compatible desktop file selection nodes and scope inspector rebinding.
- [x] Audit import invalidations with a production-path reproduction.
- [x] Run focused thumbnail, Archive and Diagnostics regressions and representative browser checks.
- [ ] Complete remaining integrated browser coverage and founder acceptance.

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
