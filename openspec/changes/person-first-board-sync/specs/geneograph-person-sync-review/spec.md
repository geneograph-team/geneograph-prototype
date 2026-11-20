## ADDED Requirements

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
