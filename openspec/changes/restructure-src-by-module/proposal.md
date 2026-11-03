# Proposal

## Why

The static prototype has clear feature concepts but 53 top-level source files and several files spanning thousands of lines and unrelated workflows. This makes code ownership hard to locate, raises the cost of targeted review, and makes load-order regressions more likely during maintenance.

## What Changes

- Document current script/CSS order, top-level global dependencies, and source ownership before moving code; repair the README source-map formatting.
- Organize first-party source into `core/`, `shared/`, `seed/`, `localization/`, and `modules/<feature>/` without adding a build step, package manager, runtime framework, or new persistence.
- Split the largest feature files by coherent workflow, beginning with Geneograph and Archive, then localization, Family Tree/People, and the remaining modules. Relocate misplaced Archive and Publish functions only after tracing dependencies and callers.
- Consolidate module-owned CSS with the corresponding module, preserve shared CSS ownership and the existing effective cascade, and categorize static assets after code ownership is stable.
- Update `src/index.html`, affected relative paths, `README.md`, `AGENTS.md`, and the design document as the structure changes.
- Use independent, reviewable passes with behavior checks after each. The goal is shorter, discoverable source units, not a target line count or a rewrite.

## Capabilities

### New Capabilities

None. This is a source-organization change with no intended user-visible behavior change.

### Modified Capabilities

None. The change opts out of specs because it is a pure refactor and documentation cleanup.

## Impact

First-party files under `src/`, their ordered tags in `src/index.html`, relative media/CSS references, and repository documentation. The `src/vendor/` bundles stay in place. Direct `file://` opening, classic deferred scripts, English/Russian behavior, seeded content, and active module behavior must remain intact. Publish remains disabled. No new runtime dependency or automated test suite is introduced solely for this cleanup.