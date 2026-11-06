# Spec Delta

## Purpose

Family Tree person cards convey recorded gender and current interaction state through distinct, readable visual cues in either application theme.

## ADDED Requirements

### Requirement: Person cards retain distinct gender border cues
Family Tree person cards SHALL show distinguishable male, female, and unknown-gender border treatments in light and dark themes.

#### Scenario: Unselected cards
- **WHEN** male, female, and unknown-gender people appear together in Family Tree
- **THEN** their card borders express three distinct category treatments with sufficient visibility against the canvas

#### Scenario: Theme switch
- **WHEN** the application theme changes while person cards are visible
- **THEN** each gender cue remains identifiable without changing the person's data

### Requirement: Interaction state remains distinct from gender
Selection, keyboard focus, and hover SHALL be visible without erasing a card's gender distinction.

#### Scenario: Selected person
- **WHEN** a person card is selected or marked as the current focus person
- **THEN** its interaction emphasis is visible and its gender cue remains perceptible

#### Scenario: Hover and keyboard focus
- **WHEN** a person card is hovered or receives keyboard focus
- **THEN** the interaction cue is clear without changing the underlying gender border meaning
