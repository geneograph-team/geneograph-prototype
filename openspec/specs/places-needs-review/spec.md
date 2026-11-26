# Places Needs review

## Requirements

### Requirement: Issue groups reflect current records
Needs review SHALL show active invalid-coordinate items only when they
exist, missing map positions for referenced Places, unlinked Places,
possible duplicate pairs, and
a Dismissed group for review decisions. Groups SHALL respect project
scope and the review search.

#### Scenario: No invalid coordinates
- **WHEN** the project has no active invalid-coordinate issue
- **THEN** Coordinates need correction is not displayed as an empty group

### Requirement: Dismissal reason editing
The saved dismissal explanation SHALL be labelled **Dismissal reason**
(«Причина отклонения» in Russian) in both its read-only summary and its
editing form. When the reason editor is open, Restore SHALL be hidden
until Cancel returns to the summary; saving may rerender the row.

#### Scenario: Edit and cancel a dismissal reason
- **WHEN** the user opens Edit reason for a dismissed Place review item
- **THEN** Restore is not shown while the textarea and Save/Cancel are visible
- **AND** Cancel restores the normal summary and Restore control

### Requirement: Unified missing-position review rows
Active and dismissed missing-position items SHALL use one selectable review-row
structure with the localized singular No map position heading, Place name, optional
actual broader Place, linked-record total and contextual actions. An absent broader
Place SHALL not produce placeholder text or an empty line. Dismissed rows SHALL show
the dismissal reason beneath the record details. Selection SHALL continue to use the
Place ID and show the ordinary Place inspector.

#### Scenario: Missing broader Place
- **WHEN** a Place with no broader Place has a missing-position issue
- **THEN** its row shows No map position, its name and linked count without a
  No broader place recorded placeholder

#### Scenario: Dismissed Place without broader Place
- **WHEN** a dismissed missing-position Place has no broader Place
- **THEN** the row shows No map position, its Place name, linked count and dismissal reason without a placeholder line

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

### Requirement: Unlinked Places review
The prototype SHALL identify Places without live authored references in their owning project, independently of the five display counters. It SHALL present an Unlinked places group with Keep/Restore and confirmed Delete place. Review deletion SHALL refuse if a reference exists at confirmation. A Place without a map position and without live references SHALL appear in the unlinked group, not additionally as missing position. Active review totals SHALL count distinct affected Places. Keep decisions SHALL expire when the Place gains a live reference.

#### Scenario: A board-only dependency
- **WHEN** the only reference is a project-scoped Place node or board fact
- **THEN** the Place is not unlinked

#### Scenario: A stale delete confirmation
- **WHEN** a previously unlinked Place acquires a reference before confirmation
- **THEN** no Place or reference is deleted.
