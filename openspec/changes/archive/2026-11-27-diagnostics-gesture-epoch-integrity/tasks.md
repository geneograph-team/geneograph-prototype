# Tasks

- [x] Reproduce the orphaned gesture with real D3 handlers and correct ownership.
- [x] Add additive schema-3 summary coverage metadata and stale callback checks.
- [x] Verify supported-browser long-task observation and document boundaries.
- [x] Run focused Tree, Diagnostics, and browser regressions.
- [x] Founder acceptance and archival.

## Verification

The hosted Edge reproduction sent a wheel event followed immediately by a mouse press and move. D3 emitted the delayed wheel end while the drag was still held. The pre-fix export showed zoom pending and pan completed. Mouseup did not resolve the zoom. Stop later reported a stopped zoom. This reproduces the orphan mechanism and does not interpret time until Stop as user input latency.

Hosted and direct-file Edge confirmed the replaced wheel canceled at the new drag, the pan stayed pending and visually active until mouseup, and native release completed it. Tests also covered grouped wheel input, a programmatic transform during the burst, touch cancellation, module exit and remount, and Stop followed by restart. A further hosted run verified focus and orientation changes and cancellation on project switch. Node Diagnostics, Tree performance, renderer, ELK, occurrences and localization checks passed. They cover stale endings, replacement, disposal, eviction, Clear, multiple epochs, and late observer and frame callbacks.

A separate hosted Edge test used two isolated browser tasks. An independent native observer and Diagnostics agreed on one 75 ms entry in the first epoch and one 125 ms entry in the second. The mixed export retained both operations and identified the second epoch as the top-level summary owner. Tasks spanning Start or synchronous Stop were excluded by the recording boundaries and were observed independently after completion. Node covered queued record draining and unsupported, Basic, selected-scope and cleared states. The browser and operation timings are different measurement boundaries.

Tests used isolated Edge in English over loopback and Russian from disk. Touch cancellation was synthesized. Physical devices, gesture interruptions at the OS/window-manager level, and other browser engines were outside this run. No founder data or raw trace was retained in the repository.

## Founder acceptance — 27 November 2026

The founder explicitly accepted #475. Implementation is on default in commit `f7d104e5a8d95dcbd7e59ea589677ab165cc059d`. The later #459 founder recording uses schema 3 with explicit summaryCoverage for Detailed all-module epoch 1, 117 retained operations, zero drops and observed page-wide long-task aggregates (68 entries, maximum 1,877 ms). It confirms the new export provenance is present; it does not exercise Tree gesture ownership or independently prove observer completeness. The hosted/direct-file Edge and deterministic checks reported above remain the basis for gesture and observer verification. Physical touch devices, OS/window-manager interruption and other browser engines were not verified. No tests were rerun for this administrative archival.
