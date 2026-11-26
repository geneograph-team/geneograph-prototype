# Place duplicate warnings and merges

## Requirements

### Requirement: Duplicate warning never blocks creation
A possible duplicate while adding/editing a Place SHALL be advisory.
A valid Place save SHALL proceed even when the warning is still visible.
Use existing Place and Dismiss SHALL be optional and available directly
in the warning. Dismiss SHALL affect only the current editor draft, not
saved-pair review decisions; valid creation remains nonblocking.

#### Scenario: Create while warned
- **WHEN** a valid new Place resembles an existing record
- **THEN** the user may save it without acting on the warning

### Requirement: Compact editor duplicate warning
The advisory warning in Add/Edit Place SHALL show Dismiss with a leading
close icon at the trailing top-right of its heading, using the same quiet
visual treatment as the Place inspector warning. In Russian this action
SHALL read «Отклонить», without changing the shared Dismiss translation.
Place details SHALL be a lightweight disclosure with a chevron reflecting
its expanded state. Merge in edit mode and Use existing place in add mode
SHALL use the same bright warning-accent surface, contrast role, border,
hover treatment, and compact sizing as the inspector's Add position action.
These are entry points to further actions, not immediate merge or destructive
operations. Dismiss SHALL remain quiet and secondary; Place details SHALL
remain tertiary. Buttons SHALL retain accessible focus and touch states.
None of these actions SHALL gate a valid Place save or change saved
review decisions.

#### Scenario: Edit a possible duplicate
- **WHEN** a Place edit has a possible duplicate candidate
- **THEN** Dismiss with the close icon is at the top of the warning,
  Place details has an accessible disclosure chevron, and Merge is a
  bright warning-accent action beneath the warning evidence

#### Scenario: Add a possible duplicate
- **WHEN** a new Place draft has a possible duplicate candidate
- **THEN** the warning offers top-right Dismiss and a bright
  warning-accent Use existing place action
- **AND** creation remains valid without interacting with the warning

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
SHALL select the surviving Place through its card. The left and right
field columns SHALL correspond to the left and right Place cards in
that order. The survivor's column SHALL be visibly highlighted.
Field arrows SHALL point from the non-surviving Place toward the
survivor (leftwards when keeping the left Place, rightwards when
keeping the right Place). A field transfer SHALL immediately update
the surviving column's staged value; Reset SHALL restore it without
modifying saved data.

#### Scenario: Keep the left Place
- **WHEN** the user selects the left Place to keep
- **THEN** the left field values are highlighted and arrows point right-to-left
- **AND** a transfer updates the left column while the right column retains its original values

#### Scenario: Keep the right Place
- **WHEN** the user selects the right Place to keep
- **THEN** the right field values are highlighted and arrows point left-to-right
- **AND** a transfer updates the right column while the left column retains its original values

#### Scenario: Choose a different survivor
- **WHEN** the user selects the other Place to keep
- **THEN** pending field choices reset and only the newly selected side is highlighted

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

### Requirement: Unified pair review and comparison inspector
Each active or dismissed duplicate pair SHALL appear as one selectable review row
with a Possible duplicate heading, both names, concise Place context, and one
selected-state treatment for the full row. Selection SHALL use the stable pair key,
independent of the selected individual Place. Merge and Keep separate SHALL be row
actions for active pairs, and Restore SHALL use the same control appearance as
other dismissed review items. Generic similarity explanations SHALL not clutter
the list or Merge modal.

Selecting a pair SHALL show both Places in a comparison inspector without choosing
a survivor. Each Place SHALL offer View Place to switch intentionally to its normal
inspector. Search, dismissal, restoration and merge SHALL clear or preserve pair
selection only when the selected pair remains visible and valid.

#### Scenario: Two pairs share a Place
- **WHEN** A–B and A–C are visible and the user selects A–B
- **THEN** only A–B has the selected row treatment and the inspector compares A and B

#### Scenario: View one Place
- **WHEN** the user chooses View Place for B in the pair inspector
- **THEN** pair selection clears and B appears in the ordinary Place inspector

#### Scenario: Selected pair disappears
- **WHEN** search or a record edit removes the selected pair from visible findings
- **THEN** pair selection clears without selecting an unrelated pair
