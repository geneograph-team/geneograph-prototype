# Tasks

- [x] Shared recorder, Tree adapter, lifecycle, operation instrumentation, export projection.
- [x] Global Diagnostics and topbar shortcut, remove Tree controls, EN/RU strings.
- [x] Add focused regression tests; run V8 assertions against implementation.
- [ ] Native Node regression suite and localization catalog check.
- [x] Founder-provided Basic-mode export reviewed: 39 completed samples, eight modules, two project activations, one recording epoch, zero dropped; stopped state and numeric durations consistent. This covers Basic export and continuity, not all browser acceptance.
- [x] Align Diagnostics selects with common chevron controls and separate mode help from live status/counters; focused V8 markup and binding checks.
- [ ] Browser QA on EN/RU, both themes, responsive topbar, all/selected and no-project navigation, actual map/import/Tree operations and export. Not run comprehensively; remaining QA accepted as outstanding for administrative closeout at founder direction.

- [x] Consolidate implemented behavior into current specifications and archive the change in #465 at founder request (27 November 2026).

## Closeout evidence and limitations

#464 merged into default. #465 contains the layout corrections and this archive. V8 checks: 49 recorder assertions, 10 stub-topbar assertions, and 14 layout/binding assertions. Founder export: Basic/all-app, 39 completed operations across eight modules and two activations in one recording epoch, zero drops. No native Node suite, localization catalog run, comprehensive browser QA, selected-scope or Detailed browser validation is claimed. Remaining QA is explicitly deferred by the founder's closure/archive request; unchecked items are not passes. Further module-specific instrumentation and performance evaluation remain separate work under #453.
