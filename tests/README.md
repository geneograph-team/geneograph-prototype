# Tests

Reusable regression checks are tracked in this directory, grouped by the domain they exercise. They use Node.js built-ins and the existing local application source and vendor bundles. No package installation, new test framework or build step is required.

| Directory | Purpose |
| --- | --- |
| `family-tree/` | Layout, occurrences, routing, viewport, display settings, cache, recorder and internal stress-project checks |
| `projects/` | GEDCOM import and canonical project-data contract |
| `people/` | Person identity matching |
| `places/` | Unlinked Places and safe canonical reference handling |
| `notes/` | Search projection freshness and compatible rich-text editor retention |
| `search/` | Shared search scheduling, composition, cancellation and connected-input retention |
| `albums/` | Photo search freshness, tagging ranking, face regions, primary-photo cleanup and resize order |
| `temp/` | Ignored disposable test scripts, experiments and logs |

Run an individual reusable check from the repository root with a current Node.js version (Node 22 was used for the integrated Tree verification):

```sh
node tests/family-tree/test-family-tree-elk.cjs
node tests/projects/check-gedcom-import.cjs
node tests/projects/check-project-data-contract.cjs
node tests/people/test-person-match-engine.cjs
node tests/places/test-unlinked-places.cjs
node tests/search/test-shared-search-input.cjs
```

Select the checks relevant to the change. A nonzero exit means failure. `tree-cases.cjs` is a shared topology builder, not an executable test. The internal stress-project check must be removed with its temporary application fixture before open user testing; see the [removal guide](../doc/family-tree-stress-test.md).

## Build identity verification

Run `node tests/diagnostics/test-build-info.cjs`. The test uses a disposable
Git repository outside the canonical checkout, checks tag selection,
generation, runtime normalization, About markup/copy text and Diagnostics
agreement. Git and Node are required for this developer test, not the
static runtime. Separately check the actual Pages artifact, existing
geocoder config, direct-file fallback and EN/RU About copy/focus behavior.

## Performance verification

Assert structural counts in Node fixtures: builds per compatible revision, collection or membership passes, query versus detail work, and release on switch, rollback or invalidation. Compare cold and warm browser paths on the same revision pairing, browser, viewport, theme, locale, data and operations. Include the sample, the internal stress fixture when available, and synthetic linked evidence. Record counts beside timings, specify the timing boundary, and agree budgets from measured results. Do not use hardware-dependent time assertions.

Use the existing Diagnostics recorder where available and disposable instrumentation for focused investigations. Record allowlisted aggregate metrics only. Keep private genealogy, record identifiers and unredacted traces out of the repository and shared diagnostics.

### Archive preview and presentation regressions

Run `node tests/archive/test-archive-thumbnails.cjs` and `node tests/archive/test-archive-presentation.cjs`. The production-path test doubles cover warm offscreen retention and LRU pressure, immediate cache reuse during encode, visible-first scheduling, folder/layout lifecycle, derivative ownership and cache/element/byte caps, authored thumbnail budgets, async cancellation and project/source invalidation, compatible first/repeated desktop selection, select-all state, bulk fallback and active-only responsive markup with edit-safe breakpoint handling. They do not establish real browser image decode, scrolling, focus, drag/drop or paint behavior. Repeat matched image-heavy scenarios and mixed documents/linked evidence in the browser; verify EN/RU, light/dark and native direct-file separately.

### Archive keyboard and upload staging regressions

Run `node tests/archive/test-archive-keyboard.cjs` and `node tests/albums/test-upload-staging.cjs`. They exercise production keyboard routing/geometry, initial workspace ownership, edit guards, Enter preview and navigation boundaries; staged progress state, bounded preview hydration, URL ownership and stale encode cleanup; and Archive mixed import outcomes with test doubles. The existing Archive presentation test covers retained selection. Run real browser checks of immediate navigation in each layout after entry, layout switch, folder open, refresh and preview dismissal; confirm input/menu/modal independence and narrow presentation. Test Albums/Archive and shared picker uploads with mixed-validity batches and 158 representative high-resolution images, including actual preparation/commit feedback before work, paint responsiveness, finalization, add/remove/cancel, partial failure, destination ownership and linked evidence. Verify EN/RU, both themes, hosted/direct-file; no mock establishes native paint or memory behavior.

### Performance Diagnostics recording checklist

1. Use the same build, browser/version, device, viewport, locale, theme, protocol and dataset for compared runs. Record these separately using synthetic workload labels and counts.
2. Use Whiskerfield, the internal 6,481-person / 1,950-family workload when available, and synthetic evidence/place/media-heavy projects for relevant modules. Keep private projects local. Never commit project data or exported traces.
3. Clear before each recording. Use Basic for short operation sequences and Detailed to break down selected modules or capture the all-module browser aggregates. Run a clean entry followed by warm repeats. Repeat several times with the same sequence. Export after each run.
4. Check capacity and dropped count. Shorten the sequence or narrow scope if samples roll out of the 256-entry buffer. Compare the same operation and workload counts before using timings from #452 or a newer baseline.
5. Read synchronous, asynchronous and Tree durations according to their boundaries. Compare cache builds/hits and matched/prepared/rendered counts. Parent and child timings, and inclusive stages, can overlap. Investigate unexplained time in DevTools. Avoid inferring exact paint, decode or wait time from a timing difference.

For a clean #459 or later baseline, Clear, select scope and mode, Start once, run the sequence, wait for browser observation to settle, then Stop and export. If the export spans multiple starts, compare the top-level summaries only with samples whose `recording` matches `summaryCoverage.recording`. Older operation rows remain usable, but their browser and read-model summaries are unavailable. Export before restarting when each run needs its own aggregate. Allow a separate event-loop turn before Stop so already finished tasks can be delivered. A long task still running during Stop cannot reliably appear in that recording. Treat canceled or stopped gesture durations as partial elapsed time.

## Test data and temporary work

Build small deterministic synthetic cases within the relevant test or a domain-local helper. Do not commit exported genealogy projects, private photos, ad hoc logs, generated screenshots or large standalone fixture datasets. Put all disposable investigations and their outputs under `tests/temp/`; only that directory's ignore file is tracked. Use disposable browser sessions for interactive QA, then report the actual checks and limitations.

## Pipeline tooling

Keep pipeline-critical utilities separate in `scripts/`. The existing deployment localization gate remains at `scripts/check-localization-catalog.cjs`; run `node scripts/check-localization-catalog.cjs` after localization edits. Do not change the pipeline without explicit approval.
