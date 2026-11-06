# Spec Delta

## Purpose

The interface color system gives GeneoGraph readable, consistent light and dark surfaces and category accents while leaving authored research content unchanged.

## ADDED Requirements

### Requirement: Interface surfaces express a consistent hierarchy
The application SHALL distinguish workspace, primary content, controls, and raised overlays or independent cards in both themes without applying the raised treatment to every row.

#### Scenario: Dense module view
- **WHEN** a user views a table, list, or inspector in either theme
- **THEN** the workspace, primary content, row separators, selected item, and interactive controls remain visually distinguishable without nested card elevation obscuring the content

#### Scenario: Independent card and overlay
- **WHEN** a standalone card or overlay appears above its surrounding work surface
- **THEN** its boundary is clear and its elevation is stronger than ordinary rows or fields

### Requirement: Text and states remain readable on their rendered surfaces
The application SHALL keep primary and supporting text, controls, and interaction states legible on the actual surface or artwork behind them in light and dark themes.

#### Scenario: Supporting content
- **WHEN** metadata or helper text appears in a card, table, inspector, or hero
- **THEN** it remains readable at its rendered size and is visually subordinate to the primary content

#### Scenario: Interaction state
- **WHEN** a control or row is hovered, selected, focused, disabled, or marked with an error
- **THEN** its state remains distinguishable from the resting state and its visible text remains readable

### Requirement: Category chips use coherent accent families
Category and status chips SHALL use a consistent shape and interaction treatment while matching their intended category or status accent in both themes.

#### Scenario: Module chips
- **WHEN** the same content category appears as a chip in different modules or a branded hero
- **THEN** it keeps a coherent foreground, container, and border relationship for its accent family

#### Scenario: Chip interaction
- **WHEN** an interactive chip is hovered, focused, active, or disabled
- **THEN** its meaning and state remain clear without a washed-out or unrelated accent color

### Requirement: Botanical artwork remains visible in branded person heroes
People and Family Tree sidebar person heroes and the People profile hero SHALL show the botanical tree artwork in both themes without reducing text or action readability.

#### Scenario: Light hero
- **WHEN** a person hero is shown in light theme
- **THEN** the tree artwork is perceptible as supporting decoration behind the content

#### Scenario: Narrow hero
- **WHEN** the hero is shown in a narrow inspector or phone layout
- **THEN** its artwork does not obscure the portrait, identity details, chips, or actions
