## MODIFIED Requirements

### Requirement: Show one active Place in duplicate review

The duplicate review UI SHALL highlight only the selected Place card and
keep the inspector synchronized when selection changes via click/keyboard.

### Requirement: Review and merge directly

The Possible duplicates row SHALL expose Merge and Keep separate, without
a separate Compare action. The Merge modal SHALL let the user select the
surviving Place using its complete card instead of a separate radio.

#### Scenario: Select a survivor

- **WHEN** a user activates either Place card
- **THEN** that card alone is marked as the survivor
- **AND** fields are reviewed in the context of that survivor

### Requirement: Configure fields through survivor-directed arrows

Each available Place field SHALL show both original values and the proposed
survivor value. An arrow SHALL stage copying only from the other Place
into the selected survivor, with a reset option. Switching the survivor
SHALL discard old staged choices.

#### Scenario: Transfer name and preserve alternatives

- **WHEN** the user copies the other Place's name to the survivor
- **THEN** the old primary name remains available as an alternative
- **AND** both Places' alternative names survive deduplicated

#### Scenario: Missing nonconflicting value

- **WHEN** the surviving Place lacks a value provided by the other
- **THEN** the value is filled automatically without data loss

#### Scenario: Invalid area

- **WHEN** staged coordinates and radius would leave an approximate
  area without a valid center
- **THEN** merging cannot proceed until the conflict is fixed

### Requirement: Merge only after explicit confirmation

Cancel SHALL keep both Places and linked records unchanged. On Merge, the
surviving ID and creation metadata SHALL be preserved, structured
references SHALL retarget safely, and the other saved Place SHALL be
removed.

### Requirement: Consistent concise review information

Both duplicate review cards and Merge cards SHALL show the same linked
record total used elsewhere in Needs review. Generic similarity reasons
SHALL NOT be repeated beneath the cards or in the modal.
