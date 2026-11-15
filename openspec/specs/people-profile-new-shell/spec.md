# people-profile-new-shell Specification

## Purpose
TBD - created by archiving change profile-new-stage-one. Update Purpose after archive.

## Requirements

### Requirement: Parallel Profile New navigation
People SHALL offer Profile New beneath legacy Profile, using the active project and selected person without redirecting existing profile entry points.

#### Scenario: Open the parallel view
- **WHEN** the user opens Profile New from People navigation
- **THEN** it displays the selected project person and participates in app navigation history

#### Scenario: Open a person elsewhere
- **WHEN** the user opens a person from another module or a relative link
- **THEN** legacy Profile remains the destination

### Requirement: Empty Stage 1 shell
Profile New SHALL show a real person hero, six accessible tabs, and empty Relatives and Facts & connections cards. Its Timeline SHALL show all recorded project-scoped events for the selected person in chronological order. Other tabs SHALL show localized unfinished states.

#### Scenario: Explore Overview
- **WHEN** Overview is selected
- **THEN** Timeline spans the width above Relatives and Facts & connections, displaying the selected person's events without fabricating or omitting records

#### Scenario: Switch tabs
- **WHEN** the user clicks a tab or uses arrow keys in the tablist
- **THEN** selection and the visible panel update; unfinished tabs explain their status

#### Scenario: Narrow layout
- **WHEN** the viewport narrows
- **THEN** cards stack, tabs stay reachable, and the page scrolls vertically without horizontal page overflow

### Requirement: Horizontal Profile New Timeline
Profile New SHALL display the selected person's events in a fixed-height horizontally scrollable timeline. Each event SHALL place its accurate year/range and derivable age above a semantically colored icon marker, with name and real details below. Unknown dates SHALL remain unknown.

#### Scenario: Open event details
- **WHEN** a timeline event is activated by pointer or keyboard
- **THEN** a dialog displays full event details and existing edit, file, and source actions without changing the legacy Timeline

#### Scenario: Navigate dense events
- **WHEN** the Timeline content exceeds its width
- **THEN** horizontal controls, native horizontal scrolling, and keyboard focus permit reaching every event while the card has no internal vertical scrollbar
