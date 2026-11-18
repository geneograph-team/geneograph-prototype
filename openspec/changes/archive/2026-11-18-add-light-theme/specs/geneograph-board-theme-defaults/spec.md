# Spec Delta

## Purpose

Defines theme-following Geneograph board defaults and persistent user-set color overrides.

## ADDED Requirements

### Requirement: Theme-aware inherited board appearance
The system SHALL resolve inherited canvas, card, object, and connection colors from the current interface theme on both new and existing boards. Switching the resolved theme SHALL update inherited colors without changing board content, selection, or viewport.

#### Scenario: New board in light appearance
- **WHEN** a user creates a board while Light is active, including when System resolves to Light
- **THEN** its inherited canvas, card, object, and connection colors use the light-board defaults

#### Scenario: New board in dark appearance
- **WHEN** a user creates a board while Dark is active, including when System resolves to Dark
- **THEN** its inherited colors match the current dark-board defaults

#### Scenario: Theme changes on an open board
- **WHEN** the resolved interface theme changes while a board is open, including a System appearance change
- **THEN** inherited colors update to the new theme without moving objects, changing selection, or resetting the viewport

### Requirement: Explicit color overrides
The system SHALL track whether each editable board, object, or connection color is inherited or explicitly set. An explicit value SHALL take precedence over the corresponding theme default, even if it equals that default when chosen. Reset to default SHALL clear the corresponding override.

#### Scenario: Theme changes after a custom color is set
- **WHEN** the user explicitly sets a canvas, card, object, or connection color and then changes the theme
- **THEN** that color stays fixed while unrelated inherited colors follow the theme

#### Scenario: Reset an explicit color
- **WHEN** the user resets an explicit color to default
- **THEN** its override is cleared and the current theme default appears, including after later theme changes

#### Scenario: Add an object after changing themes
- **WHEN** the user creates an object after the resolved theme changes
- **THEN** its inherited colors use the current theme defaults

### Requirement: Seed and editable board-file provenance
The system SHALL mark the seeded Whiskerfield board's intended theme defaults as inherited and preserve its deliberately authored colors as explicit values. Editable board export and import SHALL preserve inherited versus explicit color provenance and explicit values in the new board-file format.

#### Scenario: Seeded board changes theme
- **WHEN** the user switches themes while viewing the seeded board
- **THEN** its inherited colors change and its authored colors remain fixed

#### Scenario: Export and import a board
- **WHEN** a board is exported and imported as an editable board file
- **THEN** explicit colors and inheritance markers survive, so later theme changes affect only inherited colors
