## MODIFIED Requirements

### Requirement: Empty Stage 1 shell
Profile New SHALL show a real person hero, six accessible tabs, a populated Relatives card, and an empty Facts & connections card. Its Timeline SHALL show all recorded project-scoped events for the selected person in chronological order. Other tabs SHALL show localized unfinished states.

#### Scenario: Explore Overview
- **WHEN** Overview is selected
- **THEN** Timeline spans the width above Relatives and Facts & connections, displaying the selected person's events and established relationship rows without fabricating records

#### Scenario: Switch tabs
- **WHEN** the user clicks a tab or uses arrow keys in the tablist
- **THEN** selection and the visible panel update; unfinished tabs explain their status

#### Scenario: Narrow layout
- **WHEN** the viewport narrows
- **THEN** cards stack, tabs stay reachable, and the page scrolls vertically without horizontal page overflow

## ADDED Requirements

### Requirement: Profile New Relatives
Profile New SHALL show the active-project person's real relationships using the same group order, row display, and count semantics as legacy Profile. The card header SHALL remain visible while only the list scrolls vertically.

#### Scenario: Open a relative
- **WHEN** the user activates a relative row
- **THEN** that person opens in legacy Profile with the current project and app navigation preserved

#### Scenario: Edit or unlink a relationship
- **WHEN** the user activates an available relationship action
- **THEN** the established editor or unlink confirmation opens with the correct relationship context

#### Scenario: No relationships
- **WHEN** the selected person has no recorded relatives
- **THEN** the card displays a compact localized empty state without empty groups
