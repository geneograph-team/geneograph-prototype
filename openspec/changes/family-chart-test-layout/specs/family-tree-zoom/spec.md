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
