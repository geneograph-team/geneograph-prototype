## ADDED Requirements

### Requirement: Present-or-removed Place records
The sample-only prototype SHALL keep only present Places in the canonical Place array. Place records SHALL have no `deleted` field, and no soft-deleted list, tombstone, or restore workflow SHALL be used.

#### Scenario: Fresh sample
- **WHEN** the app initializes
- **THEN** exactly ten canonical Places are present and no hidden duplicate Place exists

#### Scenario: Create a Place
- **WHEN** a Place is created by supported editor or text-entry flows
- **THEN** it has no `deleted` field and is visible only in its project

#### Scenario: Delete permanently
- **WHEN** the user confirms permanent Place deletion
- **THEN** the record is removed, `getPlace` no longer resolves it, structured references and review dismissals are cleaned, Geneograph project Place nodes retain board fallback names, and selection moves to a remaining project Place or clears

#### Scenario: Reload sample
- **WHEN** the browser refreshes after an in-memory deletion
- **THEN** the original ten-Place sample is restored without persistent trash state
