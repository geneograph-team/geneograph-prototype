# Spec Delta

## Purpose

The UI color system gives GeneoGraph components consistent, accessible light and dark colors from one approved semantic palette while keeping theme behavior independent of authored content.

## ADDED Requirements

### Requirement: Theme colors come from the shared palette
The application SHALL resolve its own interface colors from the versioned shared palette for the active light or dark theme. Application component styles and generated UI markup MUST NOT define color values outside that palette.

#### Scenario: Light and dark interface
- **WHEN** the resolved theme changes between light and dark
- **THEN** application surfaces, text, controls, states, and content accents use the corresponding palette roles without changing unrelated content

#### Scenario: Local opening
- **WHEN** the prototype opens directly through `file://`
- **THEN** the shared palette loads without a build step, network request, or external local file dependency

### Requirement: Color roles preserve meaning and readability
The application SHALL use semantic foundation, interaction, status, and content-category roles according to their documented meanings, with readable foreground and visible interactive boundaries in both themes.

#### Scenario: Category and action colors
- **WHEN** a module displays a content-category marker beside an action control
- **THEN** the marker uses its approved category role and the primary action uses the shared interaction role

#### Scenario: Interactive states
- **WHEN** a control is focused, hovered, selected, disabled, or in an error state
- **THEN** its color treatment remains distinguishable and readable in the active theme

### Requirement: Branded heroes follow the resolved theme
Branded heroes SHALL use Heritage Green container and foreground roles, appearing pale in Light and deep in Dark.

#### Scenario: Hero changes with theme
- **WHEN** a branded hero is visible and the resolved theme changes
- **THEN** its background and foreground update to the matching Heritage Green pair

### Requirement: New UI colors enter through the palette
The repository SHALL provide a check that rejects newly introduced literal UI colors outside the palette and SHALL document the process for adding an approved palette role before consuming it.

#### Scenario: New component color
- **WHEN** a developer introduces a new literal UI color in an application stylesheet or UI-generating script
- **THEN** the repository check reports its location and fails until the color is represented in the shared palette and referenced by role

#### Scenario: Authored content remains independent
- **WHEN** a Geneograph board contains an explicitly authored color, or the app shows an uploaded image, artwork, map tile, or third-party control
- **THEN** its content color is not forced into the UI palette

