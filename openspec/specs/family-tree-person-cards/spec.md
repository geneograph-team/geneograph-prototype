# Family Tree person cards

## Requirements

### Requirement: Distinct gender cues
Person cards SHALL use visibly distinguishable male, female, and
unknown-gender border treatments in Light and Dark themes.

#### Scenario: Mixed people
- **WHEN** people with different recorded gender are displayed together
- **THEN** their card borders remain distinguishable

### Requirement: Interaction state does not erase identity
Selection, hover, and keyboard focus SHALL remain visible without
obscuring the gender cue.

#### Scenario: Select a card
- **WHEN** a card is selected
- **THEN** its selection emphasis and gender border remain perceptible
