## ADDED Requirements

### Requirement: Conditional coordinate correction group
Places Needs review SHALL show Coordinates need correction only when at least one active, project-scoped, truly invalid coordinate or radius issue matches the current search. Missing positions without a radius SHALL remain in Missing map positions, and dismissed issues SHALL appear only in Dismissed.

#### Scenario: Canonical sample
- **WHEN** the untouched sample project opens Needs review
- **THEN** no correction group appears, while the three active places without coordinates remain in Missing map positions

#### Scenario: Invalid record is fixed or dismissed
- **WHEN** the last active invalid-coordinate issue is fixed, dismissed, or filtered out by search
- **THEN** the correction group disappears without a zero-count header or empty body

#### Scenario: Invalid dismissal is restored
- **WHEN** a still-invalid dismissed issue is restored
- **THEN** the correction group reappears with the correct count and Fix coordinates action

### Requirement: Canonical Place startup
Prototype startup SHALL use canonical Place records without legacy `coords` strings or old-schema field migration. Canonical coordinate validation and normalization used by active Place workflows SHALL remain available.

#### Scenario: Start and edit Places
- **WHEN** the app starts and a user adds or edits a Place
- **THEN** canonical names, alternative names, coordinates, radius, project ownership and timestamps remain valid without a migration pass
