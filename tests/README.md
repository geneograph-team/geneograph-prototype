# Tests

Reusable regression checks are tracked in this directory, grouped by the domain they exercise. They use Node.js built-ins and the existing local application source and vendor bundles. No package installation, new test framework or build step is required.

| Directory | Purpose |
| --- | --- |
| `family-tree/` | Layout, occurrences, routing, viewport, display settings, cache, recorder and internal stress-project checks |
| `projects/` | GEDCOM import and canonical project-data contract |
| `people/` | Person identity matching |
| `places/` | Unlinked Places and safe canonical reference handling |
| `temp/` | Ignored disposable test scripts, experiments and logs |

Run an individual reusable check from the repository root with a current Node.js version (Node 22 was used for the integrated Tree verification):

```sh
node tests/family-tree/test-family-tree-elk.cjs
node tests/projects/check-gedcom-import.cjs
node tests/projects/check-project-data-contract.cjs
node tests/people/test-person-match-engine.cjs
node tests/places/test-unlinked-places.cjs
```

Select the checks relevant to the change. A nonzero exit means failure. The known project-data contract assertion failure is tracked in #436; do not treat it as a successful run. `tree-cases.cjs` is a shared topology builder, not an executable test. The internal stress-project check must be removed with its temporary application fixture before open user testing; see the [removal guide](../doc/family-tree-stress-test.md).

## Test data and temporary work

Build small deterministic synthetic cases within the relevant test or a domain-local helper. Do not commit exported genealogy projects, private photos, ad hoc logs, generated screenshots or large standalone fixture datasets. Put all disposable investigations and their outputs under `tests/temp/`; only that directory's ignore file is tracked. Use disposable browser sessions for interactive QA, then report the actual checks and limitations.

## Pipeline tooling

Keep pipeline-critical utilities separate in `scripts/`. The existing deployment localization gate remains at `scripts/check-localization-catalog.cjs`; run `node scripts/check-localization-catalog.cjs` after localization edits. Do not change the pipeline without explicit approval.
