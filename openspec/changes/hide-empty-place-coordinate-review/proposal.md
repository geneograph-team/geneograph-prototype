# Hide empty coordinate correction and remove obsolete Place migration

## Why

Needs review currently displays a zero-count Coordinates need correction group on the canonical sample. Startup also runs old Place schema conversion that makes no change to the current 11 Place records.

## What changes

- Show the correction group only when active, project-scoped invalid-coordinate issues match the current search.
- Remove legacy `coords` string parsing and the unused central Place migration and startup call.
- Keep canonical coordinate validation, alternative-name normalization, editor behavior, and dismissal handling.

## Boundaries

No sample-data changes or unrelated normalization cleanup.
