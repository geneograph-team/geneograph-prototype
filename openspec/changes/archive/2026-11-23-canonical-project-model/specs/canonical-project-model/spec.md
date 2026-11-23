# Canonical project model (proposed delta)

**Status:** target behavior for [#330](https://github.com/geneograph-team/geneograph-prototype/issues/330), not a declaration that every current field, editor and import boundary is verified. `doc/project-data-contract.md` owns the field-level detail.

## ADDED Requirements

### Requirement: One canonical authored project graph

The prototype SHALL maintain one authored project record model with stable project-scoped record identities and separate board-local identities. The Whiskerfield sample SHALL author that model directly, without obsolete internal compatibility records, dual representations or seed-time repair of canonical authored data.

#### Scenario: Start a canonical project

- **WHEN** the prototype initializes the authored Whiskerfield fixture
- **THEN** all project-owned references resolve within that project
- **AND** timeline rows and UI display values are derived without modifying authored Archive, Notes or Source evidence
- **AND** no legacy internal schema conversion is necessary

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

### Requirement: Defined future V1 project backup boundary

The V1 project contract SHALL define included authored collections, excluded derived/UI and media-byte state, unavailable-media metadata, collection-scoped ID/reference remapping (including regenerated event references), format/version rejection and validate-before-atomic-commit behavior. This requirement does **not** implement serialization, parsing or restoration.

#### Scenario: Specify a binary-free project restore

- **WHEN** a future backup contains media and Archive metadata but no image/document bytes
- **THEN** its IDs and references remain representable and validated
- **AND** the future UI can distinguish unavailable media from a missing record
- **AND** restoration is required to reject a broken graph atomically

### Requirement: Verifiable cross-module completion

Completion of canonical-model cleanup SHALL require executed integrity checks and appropriate interactive regression QA, with unperformed checks documented rather than assumed.

#### Scenario: Close the canonical cleanup

- **WHEN** all four milestones are reviewed
- **THEN** evidence identifies which tests passed on the final revision
- **AND** unresolved browser/environment gaps are recorded
- **AND** accepted requirements are consolidated into current specs before archiving this proposal
