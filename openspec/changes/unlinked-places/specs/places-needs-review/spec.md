# ADDED Requirements

### Requirement: Unlinked Places review
The prototype SHALL identify Places without live authored references in their owning project, independently of the five display counters. It SHALL present an Unlinked places group with Keep/Restore and confirmed Delete place. Review deletion SHALL refuse if a reference exists at confirmation. A Place without a map position and without live references SHALL appear in the unlinked group, not additionally as missing position. Active review totals SHALL count distinct affected Places. Keep decisions SHALL expire when the Place gains a live reference.

#### Scenario: A board-only dependency
- **WHEN** the only reference is a project-scoped Place node or board fact
- **THEN** the Place is not unlinked

#### Scenario: A stale delete confirmation
- **WHEN** a previously unlinked Place acquires a reference before confirmation
- **THEN** no Place or reference is deleted.
