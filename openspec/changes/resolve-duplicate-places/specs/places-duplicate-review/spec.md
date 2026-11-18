## ADDED Requirements

### Requirement: Detect possible duplicate Place pairs

The system SHALL compare distinct Places within the same project using one detector for saved Place pairs and editor drafts. A match SHALL require an exact name or alias match, meaningful name similarity, or similar names supported by proximity. Proximity alone SHALL NOT create a match.

#### Scenario: Similar saved Places

- **WHEN** two saved Places in a project have matching alternative names
- **THEN** Needs review shows one pair with shared match reasons and Compare, Merge, and Keep separate actions

#### Scenario: Nearby different Places

- **WHEN** two Places have close coordinates but distinct names
- **THEN** they are not listed as a duplicate pair

### Requirement: Preserve pair-specific review decisions

The system SHALL dismiss only the chosen unordered pair and SHALL restore it on request. A name, alias, coordinate, or approximate-radius change SHALL reopen a still-matching pair; unrelated edits SHALL NOT.

#### Scenario: A Place has two possible matches

- **WHEN** the user keeps pair A–B separate
- **THEN** A–C remains visible and A–B appears under Dismissed until restored or materially changed

### Requirement: Merge saved Places safely

The system SHALL require a user-selected survivor and explicit resolution of populated conflicting fields, preserve the survivor ID, retarget structured references, deduplicate repeated links, and remove the other Place permanently.

#### Scenario: Both Places connect to the same record

- **WHEN** the user merges the Places
- **THEN** the record has one reference to the surviving Place and no reference to the removed Place

#### Scenario: Different locations

- **WHEN** both Places have different coordinates or approximate radii
- **THEN** the merge cannot complete until the user chooses which location to keep
