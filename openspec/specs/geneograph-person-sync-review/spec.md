# Geneograph person-first sync review

## Requirements

### Requirement: Review preparation and freshness

Sync MAY reuse a detached preview for search, filtering, person navigation and summary display while the board and relevant project revisions remain current. A staged decision SHALL be reflected in the next preview. Apply SHALL recompute and validate a fresh plan before any records are written. Automatic suggestions SHALL preserve existing eligibility, ranking and project scope. Preview and cancellation SHALL leave canonical records, board records and review history unchanged. Navigating to another reviewer-visible person SHALL preserve staged transfer ownership and placement. A failed Apply SHALL restore written records in their original collection order and preserve board metadata and review history.

### Requirement: Person-first sync review

The sync dialogue SHALL default to people represented on the board and pin the active person separately from review-status groups.

#### Scenario: Review a board

- **WHEN** a user opens board sync
- **THEN** the selected person is pinned and the remaining board people are grouped by review status.

### Requirement: Explicit field transfers

The sync dialogue SHALL stage only the selected fields for existing relationships and apply them alongside explicitly selected identity or connection changes.

#### Scenario: Copy one differing field

- **WHEN** a user stages a relationship field transfer and applies it
- **THEN** only that field changes on the destination and unrelated relationship attributes and events are preserved.
