# Sibling unknown-parent selection

## Requirements

### Requirement: Explicit selection
When neither sibling has a recorded parent, the selector SHALL offer unknown father, unknown mother and both unknown parents and state whether one or two records will be created.

#### Scenario: Both parents
- **WHEN** the researcher selects both unknown parents
- **THEN** the description explains that two parent records will be created for both siblings

### Requirement: Deferred canonical creation
Choosing an option SHALL NOT mutate records. On valid confirmation, only the intended parent(s) SHALL be created and both siblings SHALL be linked within one family using the explicitly selected relationship type.

#### Scenario: Mother-only adoptive selection
- **WHEN** unknown mother and Adoptive are selected and the connection is confirmed
- **THEN** exactly one mother record and one family with adoptive links to both children are created

### Requirement: Preserve recorded parents and validation
Existing recorded family choices SHALL be preserved. Stale or invalid unknown-parent selections, ancestry cycles and incompatible recorded parent links SHALL be blocked without creating duplicate People.

#### Scenario: Recorded parent appears
- **WHEN** a sibling acquires a recorded parent before a synthetic parent choice is confirmed
- **THEN** the synthetic parent selection is rejected
