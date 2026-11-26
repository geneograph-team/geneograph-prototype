# Canonical Place records

## Requirements

### Requirement: Canonical, project-scoped Places
The prototype SHALL use canonical project-scoped Place records with
name, optional alternative names, optional coordinates, optional
approximate radius, and timestamps. No legacy `coords` migration step
is needed for the current sample.

#### Scenario: Create a Place
- **WHEN** a Place is added from supported editor flows
- **THEN** it belongs to the current project and is visible there

### Requirement: No Place soft delete
The canonical Places collection SHALL contain only present records;
it SHALL NOT retain deleted flags, tombstones, or a Place trash/restore
workflow. Confirmed removal SHALL clean associated references and
review decisions as documented by the owning record helpers.

#### Scenario: Delete a Place
- **WHEN** the user confirms permanent removal
- **THEN** the Place no longer resolves by ID, and linked views do not
  refer to a destroyed project Place ID

### Requirement: Prototype data lifetime
The baseline seed SHALL contain ten canonical Places. In-memory Place
changes SHALL reset to the seeded state on reload; this does not
represent production persistence.

#### Scenario: Reload after deletion
- **WHEN** the prototype reloads
- **THEN** the canonical seeded Places are restored

### Requirement: Canonical reference-safe Place changes
Place review, deletion and merge SHALL use an authoritative project-scoped canonical reference traversal. Confirmed merge SHALL retarget authored references and deduplicate redirected evidence; general confirmed deletion SHALL clear references without leaving dangling IDs. The `unlinked` review dismissal SHALL be accepted by the canonical validator without changing the Place shape or backup scope.

#### Scenario: Merge or delete a referenced Place
- **WHEN** the researcher confirms a merge or general deletion
- **THEN** canonical references are redirected or removed safely, without changing unrelated project records.
