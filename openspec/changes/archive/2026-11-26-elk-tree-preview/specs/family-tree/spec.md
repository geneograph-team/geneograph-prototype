## ADDED Requirements

### Requirement: Local vertical ELK layout

The Tree presentation SHALL use the pinned local vertical ELK solver. It SHALL discard results for superseded views and offer localized Retry after a failed request.

#### Scenario: Retry a failed layout

- GIVEN the Tree layout failed
- WHEN the user chooses Retry
- THEN the Tree starts a new ELK request for the same project and focus
- AND canonical records and memberships are preserved.

#### Scenario: Select a visual occurrence

- GIVEN the Tree displays multiple occurrences of a canonical person
- WHEN a user selects any occurrence
- THEN the Tree selects the canonical person and highlights their occurrences without recalculating layout or changing the focus.
