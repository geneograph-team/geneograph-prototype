## ADDED Requirements

### Requirement: Scoped mutation boundaries

The prototype SHALL notify the read model before a consumer reads a successful typed mutation. Notifications SHALL cover every changed project domain, including derived record replacements and evidence pruning, and advance the dirty-session revision once per logical commit.

#### Scenario: Independent note mutation

- **WHEN** an existing note body or collection membership is saved without modifying entity references
- **THEN** the Notes domain advances while unrelated retained People, Family Tree, Places, Geneograph, Archive and Albums projections remain reusable

#### Scenario: Person save with dependent writes

- **WHEN** a person save changes authored facts or relationships and commits staged attachments
- **THEN** the affected owners and domains are invalidated before render, and changed event and evidence records are fresh on the next read

#### Scenario: Failed connection batch

- **WHEN** an Archive connection batch is rejected or a later write fails
- **THEN** the batch leaves prior canonical references and timestamps available and does not publish a successful edit notification

### Requirement: Linked Place dismissal expiry

The prototype SHALL expire a Keep decision when a committed authored reference links that Place. A scoped check SHALL preserve unrelated decisions, including decisions belonging to other projects.

#### Scenario: Birth place relink

- **WHEN** a person save links a previously kept, unlinked Place
- **THEN** the Keep decision for that Place expires and the person and birth event are visible in the corresponding Place association
