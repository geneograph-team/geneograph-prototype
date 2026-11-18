## MODIFIED Requirements

### Requirement: Possible duplicates are informational

A valid Place creation or edit SHALL NOT require resolving, ignoring or
confirming a possible-duplicate warning.

#### Scenario: Save despite visible warning

- **WHEN** a valid draft is suggested as a possible duplicate
- **AND** the user submits it without interacting with the warning
- **THEN** the entered Place is saved exactly once

#### Scenario: Optional actions

- **WHEN** a duplicate warning appears during Place creation
- **THEN** Use existing place selects the matching record without creating one
- **AND** Ignore dismisses only that warning for the current draft
- **AND** neither action is required to save the draft

### Requirement: Geographic context informs duplicate matching

A shared locality name SHALL NOT produce a possible-duplicate suggestion
when the two Places have conflicting explicit geographic hierarchies.

#### Scenario: Same locality, different countries or regions

- **WHEN** the locality names are the same but supplied geographic context
  disagrees
- **THEN** no duplicate match is returned

#### Scenario: Compatible partial context

- **WHEN** locality names match, and one record omits but does not contradict
  some of the other's geographic context
- **THEN** the matcher MAY suggest a duplicate

### Requirement: Enter submits the form without an active suggestion

- **WHEN** the name input has no actively selected autocomplete suggestion
- **AND** Enter is pressed
- **THEN** the normal Place form submit behavior is preserved
