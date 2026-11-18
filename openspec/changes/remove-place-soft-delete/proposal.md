# Remove obsolete Place soft-delete state

## Why

Places are permanently removed from the in-memory prototype, yet the sample and runtime retain an unused `deleted` flag and one hidden Place record.

## What changes

- Remove the hidden `place-deleted` sample and `deleted` from the remaining Place records and creation paths.
- Remove Place-specific `deleted` checks and the unused `projectPlaces` visibility option while retaining project and missing-record checks.
- Preserve the existing permanent-delete cleanup of linked records and Geneograph Place references.

## Boundaries

Other entity deletion states, persistence, migration cleanup and unrelated sample records are unchanged.
