# Place duplicate warnings and merges

## Requirements

### Requirement: Duplicate warning never blocks creation
A possible duplicate while adding/editing a Place SHALL be advisory.
A valid Place save SHALL proceed even when the warning is still visible.
Use existing Place and Ignore SHALL be optional and available directly
in the warning; Ignore affects only the current draft.

#### Scenario: Create while warned
- **WHEN** a valid new Place resembles an existing record
- **THEN** the user may save it without acting on the warning

### Requirement: Context-aware, name-based matching
The shared matcher SHALL consider canonical/alternative names and
geographic context. Coordinate proximity alone SHALL NOT establish
duplicates, and an explicitly conflicting region/country SHALL prevent
a match solely by a shared locality name.

#### Scenario: Different countries
- **WHEN** two Places share a locality name but have contradictory
  geographic hierarchy
- **THEN** they are not suggested as a duplicate pair

### Requirement: Pair-specific saved-record decisions
Needs review SHALL show each possible saved Place pair once, allow
Keep separate and Restore per pair, and permit explicit Merge. A
material name, alias, coordinate, or radius change MAY reopen a pair.

#### Scenario: Dismiss one pair
- **WHEN** A–B is marked Keep separate
- **THEN** A–C remains visible when independently matched

### Requirement: Survivor-directed merge review
Merge SHALL open directly without a Compare-only dialog. The user
SHALL select the surviving Place through its card. Source values SHALL
appear on the left; the survivor's staged values on the right. Clicking
a field arrow SHALL immediately update the displayed right-hand value;
Reset SHALL restore it without modifying saved data.

#### Scenario: Choose a different survivor
- **WHEN** the user selects the other Place to keep
- **THEN** pending field choices reset and right-hand values reflect
  the newly selected surviving Place

### Requirement: Safe merge confirmation
The result SHALL preserve the survivor's ID/project/creation metadata,
deduplicate and retain original and alternative names, fill missing
non-conflicting details where valid, and reject incompatible location
and radius choices. Cancel SHALL leave original records unchanged.
Confirmation SHALL redirect structured references from People, Events,
Archive, Sources, Notes, Albums, and Geneograph boards; deduplicate
links and remove the other Place.

#### Scenario: Merge two connected Places
- **WHEN** both Places link to an existing record
- **THEN** the surviving Place receives the reference once, and no
  references to the removed Place remain

### Requirement: Concise duplicate review
Exactly one selected card SHALL be highlighted, connected record totals
SHALL match the Missing map positions summary, and generic similarity
explanations SHALL not clutter the list or Merge modal.

#### Scenario: Change selected card
- **WHEN** the user selects the other Place in the review list
- **THEN** the highlight and inspector update together
