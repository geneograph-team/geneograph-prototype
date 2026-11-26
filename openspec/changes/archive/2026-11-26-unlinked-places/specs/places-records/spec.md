# ADDED Requirements

### Requirement: Canonical reference-safe Place changes
Place review, deletion and merge SHALL use an authoritative project-scoped canonical reference traversal. Confirmed merge SHALL retarget authored references and deduplicate redirected evidence; general confirmed deletion SHALL clear references without leaving dangling IDs. The `unlinked` review dismissal SHALL be accepted by the canonical validator without changing the Place shape or backup scope.

#### Scenario: Merge or delete a referenced Place
- **WHEN** the researcher confirms a merge or general deletion
- **THEN** canonical references are redirected or removed safely, without changing unrelated project records.
