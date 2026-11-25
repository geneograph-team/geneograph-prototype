## ADDED Requirements

### Requirement: Reversible ELK layout preview

The Tree presentation SHALL provide a localized, default-enabled ELK preview option per project. Disabling it SHALL select Classic in the same presentation. ELK work SHALL use the local pinned solver and discard results for superseded views.

#### Scenario: Switch layout providers

- GIVEN a project with no explicit preview preference
- WHEN a user opens Family Tree
- THEN the Tree uses ELK with the shared cards, connectors and inspector
- AND unchecking ELK preview selects Classic without changing genealogy records.

#### Scenario: Select a visual occurrence

- GIVEN the Tree displays multiple occurrences of a canonical person
- WHEN a user selects any occurrence
- THEN the Tree selects the canonical person and highlights their occurrences without recalculating layout or changing the focus.
