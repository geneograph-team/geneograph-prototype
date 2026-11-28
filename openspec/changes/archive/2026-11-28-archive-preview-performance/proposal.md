# Archive preview performance

## Why

Large Archive folders mounted original-resolution scans as Icons and filmstrip previews. Repeated desktop selection also rebuilt the workspace and replaced existing image elements.

## What Changes

- Hydrate Icon and filmstrip previews from a shared, bounded in-memory derivative queue.
- Preserve compatible desktop file and preview nodes when moving selection between files.
- Record comparable layout interactions and keep full-resolution document viewing available.

## Capabilities

### New Capabilities

- `archive-previews` defines the Archive preview and retained selection behavior.

### Modified Capabilities

## Impact

Archive presentation and Diagnostics only. References, document bytes, folder queries and viewer resolution remain canonical. See [#456](https://github.com/geneograph-team/geneograph-prototype/issues/456).
