# MODIFIED Requirements

### Requirement: Context-aware, name-based matching
The shared matcher SHALL compare authored canonical/alternative names using comparison-only Unicode normalization and bounded reusable script transliteration, with conservative similarity, context and geographic evidence. Coordinate proximity or approximate area overlap alone SHALL NOT establish duplicates. Explicitly conflicting geographic context and implausible distances SHALL veto matches. Unknown translations SHALL NOT establish equivalence. No network request or place-name dictionary SHALL be used. Author names and the canonical Place schema SHALL remain unchanged.

#### Scenario: Corroborated different scripts
- **WHEN** two same-project Places have similar transliterated locality names and consistent administrative context or sufficiently close positions
- **THEN** the shared advisory detector may flag them as possible duplicates in Needs review and Add/Edit Place

#### Scenario: Unresolved translation
- **WHEN** a pair lacks sufficient name/context/position evidence
- **THEN** it remains separate

### Requirement: Stable saved pair decisions
Equivalent normalized inputs and interface language changes SHALL preserve dismissal. Material authored name, alias, coordinate or radius changes MAY reopen the pair. The pair-key and fingerprint tuple format SHALL remain compatible with existing records.
