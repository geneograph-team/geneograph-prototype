# ADDED Requirements

## Requirement: Opt-in experimental layout comparison

The Family Tree SHALL provide a Test layout checkbox next to its existing view selector. The Classic layout SHALL remain the default, and disabling the checkbox SHALL use the unchanged Classic positioning calculation. Experimental placement SHALL operate on the same detached visible projection and preserve its canonical person/family identities and real relationship coverage. The app SHALL visibly disclose unresolved experimental geometry or an unsupported projection and allow return to Classic. Selection is per project in the current session; no stored genealogy data SHALL change.

### Scenario: Compare layout engines

- **WHEN** a researcher checks Test layout in the Family Tree
- **THEN** the existing cards and interactions use the separate experimental placement
- **AND** the existing mode switcher remains unchanged
- **WHEN** the researcher unchecks Test layout
- **THEN** the Classic positioning engine is used again

### Scenario: Experimental layout cannot represent a projection

- **WHEN** the experimental calculation cannot produce the intended connected projection
- **THEN** the view explains that it cannot display the tree
- **AND** the researcher can uncheck Test layout without losing or modifying genealogy records

### Scenario: Multiple partnerships

- **WHEN** the experimental layout encounters a person with two distinct partners in a simple partner group
- **THEN** place the person between the partners, preserve explicit family identities, and align each child group as closely as feasible to its own junction without violating occupied-row clearance

### Scenario: Crossing-driven visual repetition

- **WHEN** ordinary experimental routing reports intersecting distinct-family paths
- **THEN** a bounded candidate search MAY repeat a visual occurrence only if routed intersections decrease without new collisions or lost relationships
- **AND** ancestry repetition SHALL target the shared ancestor where distinct child paths converge, not split a descendant's parent and partner memberships
- **AND** visual contexts MAY partition a canonical family across branches while retaining every canonical parent-child membership and any known other parent; no false missing-parent placeholder SHALL appear
- **AND** all rendered occurrences SHALL remain reachable from the focus through actual relationship edges, not shared identity or badges
- **AND** every repeated card SHALL resolve to the same canonical person and show its current occurrence count
- **AND** an unsuccessful or disconnected candidate SHALL leave the connected baseline unchanged
