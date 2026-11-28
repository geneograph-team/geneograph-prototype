# Project read model

## Requirements

- Live providers use explicit project ownership and read canonical objects without writing through the read model.
- The active project retains one lazy compatible value per provider key. Exit, project replacement and rollback release its generation. Off-project reads are uncached.
- Typed successful edits invalidate affected domains. An unclassified edit invalidates retained projections conservatively.
- People and Profile use the shared person and family indexes. An ID query does not build relationship adjacency or the directory. People prepares detailed rows after pagination.

### Requirement: Scoped mutation boundaries

The prototype SHALL notify the read model before a consumer reads a successful typed mutation. For migrated mutation owners, notifications SHALL cover every changed project domain, including derived record replacements and evidence pruning, and advance the dirty-session revision once per logical commit. Unknown ownership or unclassified writes retain conservative fallback.

#### Scenario: Independent note mutation

- **WHEN** an existing note body or collection membership is saved without modifying entity references
- **THEN** the Notes domain advances while retained projections whose dependencies do not include Notes remain reusable

#### Scenario: Person save with dependent writes

- **WHEN** a person save changes authored facts or relationships and commits staged attachments
- **THEN** the affected owners and domains are invalidated before render, and changed event and evidence records are fresh on the next read

#### Scenario: Failed connection batch

- **WHEN** an Archive connection batch is rejected or a later write fails
- **THEN** the batch leaves prior canonical references and timestamps available and does not publish a successful edit notification

#### Scenario: Single-file Archive Place picker

- **WHEN** the Archive picker commits changed links to existing Places for one file
- **THEN** the file's project receives one Archive notification, the dirty revision advances once, and any Keep decision for a newly linked Place expires
- **AND** a canceled, invalid or unchanged selection leaves the original references, timestamp and dirty revision intact

### Requirement: Linked Place dismissal expiry

The prototype SHALL expire a Keep decision when a committed authored reference links that Place. A scoped check SHALL preserve unrelated decisions, including decisions belonging to other projects.

#### Scenario: Birth place relink

- **WHEN** a person save links a previously kept, unlinked Place
- **THEN** the Keep decision for that Place expires and the person and birth event are visible in the corresponding Place association
