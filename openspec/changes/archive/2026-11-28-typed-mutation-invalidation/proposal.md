# Typed mutation invalidation

## Why

Measured prototype edits evicted read-model entries that the edits could not affect. Person saves also repeated dirty notifications and traversed authored Place references before rebuilding derived events.

## What Changes

- Publish scoped notifications from person, relationship, note, source, Place, media and Geneograph Sync commits using the existing read model.
- Include changed derived events, pruned evidence links and repaired references under their actual owners.
- Restrict Place dismissal traversal to commits and renders that require it.
- Keep the conservative fallback for cleanup with ambiguous ownership.

## Capabilities

### Modified Capabilities

- `project-read-model` adds verified commit, derived reference and Place dismissal behavior.

## Impact

The prototype keeps the same in-memory canonical collections, project activation lifecycle and Diagnostics recorder. See [GitHub issue #474](https://github.com/geneograph-team/geneograph-prototype/issues/474).
