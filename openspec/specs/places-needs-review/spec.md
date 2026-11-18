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

### Requirement: Consistent inspector warning cards
Place inspector warnings SHALL use a shared accessible card structure with a
fixed-width warning icon, prominent title, tertiary Open review control,
aligned readable description, and optional contextual actions. The text and
actions SHALL share a common leading alignment independent of card height.
Narrow inspectors and longer EN/RU labels SHALL wrap without horizontal
overflow. Existing review, fix, and dismissal behavior SHALL be preserved.

#### Scenario: Missing-coordinate review
- **WHEN** a Place has a missing-coordinate review warning
- **THEN** its title, description, Add position and Dismiss actions follow
  a consistent visual hierarchy and preserve their keyboard behavior

#### Scenario: Possible duplicates
- **WHEN** a Place has possible duplicate candidates
- **THEN** the inspector renders the same warning-card structure and
  navigation control without an empty action row or duplicate counter
