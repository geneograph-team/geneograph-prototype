# Tasks and verification

- [x] Implement shared import feedback, sequential/bounded preparation and commit yields, and bounded transient staging derivatives in Albums, Archive and shared photo picker.
- [x] Preserve current Archive location after folder creation.
- [x] Implement immediate workspace keyboard ownership, directional navigation, Enter preview/folder and existing guarded selection routes.
- [x] Add focused keyboard, progress, preview ownership and import-outcome regressions.
- [x] Execute new keyboard and upload-staging assertions plus existing Archive presentation assertions against actual source in an isolated JavaScript harness with Node VM/DOM/IntersectionObserver test doubles. Checks cover initial ownership, layout switch, list/grid directions and bounds, Image routing, independent controls, edit-guard path; progress counts and restoration, 32-preview cap, stale encode and URL release, mixed Archive outcomes, destination rejection and retained desktop selection. Actual folder-create submit handler also passed with a different selected parent, unchanged current location/search and no refresh on failed creation. Syntax checks on changed scripts.
- [ ] Native Node suites/localization catalog and real browser QA: both preparation and confirmed commit progress including paint opportunity, add-more/remove/cancel, mixed and partial failures, original assets, captured destinations/linking, large high-resolution image batches and shared picker forms. Measure per-file commit/final-render costs and compare before/after; per-file canonical notifications deliberately retained, no measured reduction claimed.
- [ ] Verify current-folder and different-parent folder creation with existing filters/history and success feedback.
- [ ] Keyboard-only real browser matrix for all three layouts after entry, switch, folder open, result refresh, preview close; variable grid widths, first/last/empty, edit guards, nested controls, scroll/focus, narrow, EN/RU, light/dark, hosted/direct-file. No actual browser QA claimed.
- [ ] Founder acceptance and canonical spec consolidation/archive.
