## MODIFIED Requirements

### Requirement: Empty Stage 1 shell
Profile New SHALL show a real person hero, six accessible tabs, a populated Timeline, Relatives card, and Additional facts card. Other tabs SHALL show localized unfinished states.

#### Scenario: Explore Overview
- **WHEN** Overview is selected
- **THEN** Timeline spans the width above Relatives and Additional facts, each showing only records for the selected project person

#### Scenario: Switch tabs
- **WHEN** the user clicks a tab or uses arrow keys in the tablist
- **THEN** selection and the visible panel update; unfinished tabs explain their status

#### Scenario: Narrow layout
- **WHEN** the viewport narrows
- **THEN** cards stack, tabs stay reachable, and the page scrolls vertically without horizontal page overflow

## ADDED Requirements

### Requirement: Grouped additional facts
Profile New SHALL show all meaningful recorded alternative names, religion, occupation, education, custom facts, and cause of death in that group and type order. It SHALL preserve stored order within a type and full authored primary values. It SHALL omit empty groups and placeholder values. The recorded maiden name SHALL appear in the hero rather than this card.

#### Scenario: Multiple records
- **WHEN** the person has multiple eligible records of a type
- **THEN** every distinct record is shown in stored order, with full wrapping text and relevant recorded context

#### Scenario: No eligible facts
- **WHEN** the person has no eligible facts
- **THEN** the card shows a compact localized empty state

#### Scenario: Growing card
- **WHEN** the facts exceed its minimum height
- **THEN** the facts card and page grow without an inner facts scrollbar; on desktop Relatives matches the row height without making the row grow

#### Scenario: Narrow layout
- **WHEN** the lower cards stack
- **THEN** each card sizes independently without sideways overflow or clipped facts
