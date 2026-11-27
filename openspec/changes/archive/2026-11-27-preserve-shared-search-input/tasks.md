# Tasks

- [x] Audit shared input binding and consumer replacement paths.
- [x] Retain the connected input and coalesce current query refreshes across audited consumers.
- [x] Add focused deterministic scheduling/lifecycle regression coverage.
- [x] Reproduce focus-gap/typing defect and verify connected-input approach in isolated Chromium fixture.
- [x] Founder confirms browser QA passed and the reported search defect is resolved (case-by-case coverage not supplied).
- [ ] Independently verify all other shared consumers, accessibility, hosted/direct-file, EN/RU and actual IME (not separately established; residual coverage accepted for closeout, #460 retains integrated checks).
- [x] Obtain founder acceptance and prepare archive.

## Verification and limits

Local repository checkout was blocked by DNS resolution; the full application could not be run. Chromium 144 isolated DOM fixture used the original shared handler and the proposed helper with synthetic result regions. In three trials each on 467 and 459 items, the original handler lost characters from the 27-character keyboard sequence; after the change all six runs retained the exact input, same node, continuous focus and correct result IDs. A 6,481-item fixture retained full text in all three new runs with 4–7 total renders versus 28 old renders (including initial render). These are real browser keyboard events against isolated synthetic markup, not full-app performance measurements. Also verified simulated composition, mid-string edits, Cyrillic insertion, selection replacement, deletion, clear, modal deferral, stale project cancellation, outside focus and retained map-host identity in the isolated fixture. Actual IME, real Quill/MapLibre behavior and consumer-specific browser integration remain pending. No raw traces or private data committed.

## Founder acceptance — 27 November 2026

PR #482 is on default. Founder reports the fix works and browser QA passed, explicitly accepting #481 and #458 and authorizing closure and archival. This resolves the reported skipped-letter acceptance blocker in Notes and Albums. The founder did not provide a case-by-case matrix, browser version, protocol or additional timings; do not infer independently verified actual IME, every consumer, every accessibility/locale/protocol combination, or disabled Publish QA. Earlier isolated Chromium and deterministic evidence stands with its stated limitations. Full application regression across consumers, including Albums after #457, remains part of #460 and normal module acceptance. No new independent browser or full-suite run at archival.
