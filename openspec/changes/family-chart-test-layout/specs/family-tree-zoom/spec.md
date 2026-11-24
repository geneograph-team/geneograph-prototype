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

- **WHEN** the experimental layout encounters a same-generation partnership chain
- **THEN** all actual partners SHALL be adjacent wherever the component is a simple path, including a divorced couple with another partner on each side
- **AND** orient the principal family using the focus and ancestry context rather than enforcing every gender/slot hint
- **AND** if a branching component has more partners than can be adjacent, preserve the principal couple and place additional partners outward with separate, explicit family junctions and parallel horizontal connector lanes within the generation row
- **AND** no same-generation partner connector SHALL route above cards; visible extended segments SHALL meet only the actual partners, leaving clearance at intervening unrelated cards
- **AND** for independent secondary household branches on both sides of the principal couple, reserve the full visible descendant footprints with exclusive horizontal territories; preserve compact principal partners but allow longer inline secondary partnership gaps and independent junctions near each secondary partner
- **AND** retain the general connected layout where independent grouping cannot be achieved without conflicts or worsened geometry
- **AND** each child group SHALL attach to its actual family junction and remain as locally aligned as feasible without violating occupied-row clearance
- **AND** retain canonical families, separated/divorced styling and real-edge connectivity; report unresolved intersections rather than duplicating people solely because of multiple partnerships

### Scenario: Crossing-driven visual repetition

- **WHEN** ordinary experimental routing reports intersecting distinct-family paths
- **THEN** a bounded candidate search MAY repeat a visual occurrence only if routed intersections decrease without new collisions or lost relationships
- **AND** ancestry repetition SHALL target the shared ancestor where distinct child paths converge, not split a descendant's parent and partner memberships
- **AND** visual contexts MAY partition a canonical family across branches while retaining every canonical parent-child membership and any known other parent; no false missing-parent placeholder SHALL appear
- **AND** all rendered occurrences SHALL remain reachable from the focus through actual relationship edges, not shared identity or badges
- **AND** every repeated card SHALL resolve to the same canonical person and show its current occurrence count
- **AND** an unsuccessful or disconnected candidate SHALL leave the connected baseline unchanged
