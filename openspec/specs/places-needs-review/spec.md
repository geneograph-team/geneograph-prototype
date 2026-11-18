# Places Needs review

## Requirements

### Requirement: Issue groups reflect current records
Needs review SHALL show active invalid-coordinate items only when they
exist, missing map positions separately, possible duplicate pairs, and
a Dismissed group for review decisions. Groups SHALL respect project
scope and the review search.

#### Scenario: No invalid coordinates
- **WHEN** the project has no active invalid-coordinate issue
- **THEN** Coordinates need correction is not displayed as an empty group

### Requirement: Dismissal and restoration
A dismissed item SHALL move out of the active group; restoring it SHALL
return a still-relevant issue to review. Duplicate dismissal SHALL be
pair-specific, not a blanket waiver for either Place.

#### Scenario: Two candidate pairs
- **WHEN** a user keeps A and B separate
- **THEN** the A–C pair remains independently reviewable
