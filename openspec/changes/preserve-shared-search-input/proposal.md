# Preserve shared search input

Issue #481 addresses lost characters when module search replaces its focused input for each keystroke. Retain the native input during compatible results refreshes, coalesce work per browser frame and protect pending work from stale view changes. Keep existing query semantics and module-specific detail behavior. Acceptance includes real Notes and Albums browser workflows; no broad renderer rewrite or new dependencies.
