# Shared UI color system

## Purpose

Semantic, accessible Light and Dark palettes for the current prototype.

## Requirements

### Requirement: Palette-owned UI colors
App UI styles SHALL use semantic roles from
`src/core/palette/geneograph-v3.css` and documented compatibility aliases,
not isolated new literal UI colors. New roles SHALL be introduced through
the palette first.

#### Scenario: New module control
- **WHEN** a control is styled in either appearance
- **THEN** its surfaces, text, and states resolve through shared roles

### Requirement: Consistent surfaces and interaction
Workspace, navigation, inspectors, content, raised cards, and inset fields
SHALL use consistent elevation meanings. Hover, current selection, batch
selection, keyboard focus, and disabled states SHALL be distinguishable.

#### Scenario: Keyboard selection
- **WHEN** an item is focused, selected, or checked in a dense list
- **THEN** those states remain separately recognizable in both themes

### Requirement: Category identity differs from status
Heritage Green SHALL identify primary interaction. Content categories
SHALL use their category accent roles independently of warning, error,
success, or disabled status roles.

#### Scenario: Review warning on a source
- **WHEN** a source needs attention
- **THEN** the warning styling SHALL NOT replace its content identity

### Requirement: Readable branded heroes and controls
Text and icons SHALL use appropriate foreground roles for their actual
surfaces. Branded heroes SHALL use the approved Light/Dark Heritage Green
container and on-container pairs, with supporting decoration readable.

#### Scenario: Theme changes on a hero
- **WHEN** a hero is visible during a theme change
- **THEN** its background/foreground pair updates without loss of contrast

### Requirement: Authored content stays independent
Explicit board colors, rich-text colors, photographs, map tiles, and
third-party artwork SHALL NOT be overwritten by UI theme changes.

#### Scenario: Custom Geneograph paint
- **WHEN** the user changes the interface appearance
- **THEN** explicitly authored board paints remain unchanged
