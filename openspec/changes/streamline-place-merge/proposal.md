# Streamline saved Place duplicate review and merge

## Why

The saved duplicate list retains stale selection highlighting, repeats linked
record categories, and routes Compare to a redundant modal. Merge selection
uses separate radios and can silently lose non-conflicting Place details.

## What changes

- Keep exactly the selected review card highlighted.
- Remove Compare and generic match-reason copy from duplicate list/modal.
- Summarize each Place with the existing Linked records total.
- Select the surviving Place via its whole accessible card.
- Use Geneograph-style survivor-directed arrows to stage individual fields
  with an immediate result preview before a single final Merge action.
- Preserve original names as alternatives and fill missing data safely.

## Boundaries

Shared duplicate matching and Keep separate/Restore are unchanged. The
survivor keeps its identity; structured links retarget as before. No
backend, data migration, CI, or deployment changes.
