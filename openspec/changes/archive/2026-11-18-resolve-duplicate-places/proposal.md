# Resolve duplicate Places

## Why

The Place editor warns about a possible duplicate, but two saved Places cannot be reviewed or consolidated. Coordinate review alone cannot surface these pairs.

## What changes

- Share one name-first duplicate detector between the editor and Needs review.
- List each pair once, with compare, merge, and pair-specific Keep separate/Restore actions.
- Require an explicit surviving Place and resolution of conflicting fields before retargeting structured references and permanently removing the other Place.

## Boundaries

The ten seeded Places remain unchanged. The prototype has no backend or undo for merges. Existing coordinate review and ordinary Place deletion remain separate.
