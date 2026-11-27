## ADDED Requirements

### Requirement: Bounded shared picker preparation

Shared person pickers SHALL search the full eligible population using the existing context-specific ordering and limits. A paged picker SHALL prepare and render at most one page of results at a time. Changing pages SHALL preserve the selection until the user changes it. Existing top-result pickers SHALL keep their suggestion limit.

#### Scenario: Search past the first page
- **WHEN** the user searches for an eligible person outside the current page
- **THEN** the search includes that person and prepares details only for the visible results.
