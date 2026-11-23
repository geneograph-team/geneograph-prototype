# Canonical project model

[Project data contract](../../../doc/project-data-contract.md) defines authored fields, detached preparation, and the requirements for future backup and GEDCOM work.

## Requirements

### Requirement: One canonical authored project graph

The prototype SHALL maintain one authored project record model with stable project-scoped record identities and separate board-local identities. The Whiskerfield sample SHALL author that model directly, without obsolete internal compatibility records, dual representations or seed-time repair of canonical authored data.

#### Scenario: Start a canonical project

- **WHEN** the prototype initializes the authored Whiskerfield fixture
- **THEN** all project-owned references resolve within that project
- **AND** timeline rows and UI display values are derived without modifying authored Archive, Notes or Source evidence
- **AND** no legacy internal schema conversion is necessary

### Requirement: Strict structured dates and image regions

Every canonical structured genealogy date SHALL reject unknown outer fields as well as invalid or unknown nested date parts. Photo and Archive person-region rectangles SHALL contain only normalized x, y, width and height coordinates; unexpected properties SHALL be rejected with record/field diagnostics.

#### Scenario: Unexpected nested input

- **WHEN** a detached import candidate contains an unrecognized date field or tagged image-region property
- **THEN** validation reports the affected owner and field without changing live records

### Requirement: Archive places reference project Places

Archive file place links SHALL use project-scoped Place IDs, not a parallel unlinked document-place text field.

#### Scenario: Link a file to a place

- **WHEN** the researcher links or changes an Archive file place
- **THEN** the selected Place record is referenced within the same project
- **AND** adding, unlinking or merging places preserves valid file links without inventing text-only place records

### Requirement: Detached strict project draft validation

The project draft validator SHALL reject unsupported shapes, duplicate/missing IDs, incorrect types, invalid genealogy and board graphs, and dangling or cross-project structured references before changing live project data.

#### Scenario: Invalid import candidate

- **WHEN** project metadata or any included collection is malformed
- **THEN** validation returns field/owner diagnostics
- **AND** the live project remains unchanged
- **AND** no partial project commit or evidence pruning occurs

### Requirement: Family identity and parentage preservation

Family records SHALL remain distinct even when partners overlap. They SHALL support single-parent families, multiple family memberships per child and per-parent parentage kinds without manufacturing biological links.

#### Scenario: Multiple family memberships

- **WHEN** a child belongs to more than one recorded family
- **THEN** edits, relationship projections and Geneograph Sync preserve each explicit family identity and parent-child type
- **AND** targeted unlink removes only the chosen membership

### Requirement: Stable derived event evidence

Derived events SHALL remain reproducible from authored fact/family identities, and regeneration SHALL preserve valid Source, Archive and Notes references. Removing a truly deleted target SHALL not prune unrelated valid evidence.

#### Scenario: Change a relationship event type

- **WHEN** a recorded family event changes its type without changing its identity
- **THEN** regenerated timeline data uses the stable event ID and updated type
- **AND** its valid evidence links still resolve

### Requirement: Safe board/Tree synchronization

Geneograph Sync SHALL stage only selected intended changes, validate the resulting project graph and provide exact rollback while preserving project-only records and board-local identity.

#### Scenario: Preview and apply selected changes

- **WHEN** a researcher stages an individual fact or relationship transfer
- **THEN** preview does not mutate either side
- **AND** apply changes only the approved target records
- **AND** rollback restores the previous state without removing unrelated links
