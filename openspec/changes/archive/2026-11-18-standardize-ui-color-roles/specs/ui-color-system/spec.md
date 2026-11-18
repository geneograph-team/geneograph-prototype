# Spec Delta

## Purpose

Defines how GeneoGraph assigns theme-dependent application colors to surfaces, interactions, content categories, and status across its modules.

## ADDED Requirements

### Requirement: Shared palette owns UI colors
The application SHALL derive UI colors from one synchronized palette for Light and Dark themes. Components SHALL use semantic roles that resolve in both themes.

#### Scenario: Theme change
- **WHEN** the effective theme changes
- **THEN** application chrome and controls use the corresponding palette roles without changing content data

#### Scenario: New UI color
- **WHEN** a new application UI color is needed
- **THEN** it is added to the shared palette before a component uses it

### Requirement: Consistent surface elevation
The application SHALL distinguish workspace, top bar, navigation, inspector, content panels, raised cards, and inset fields with consistent surface roles in both themes.

#### Scenario: Module navigation
- **WHEN** a user moves among Projects, Family Tree, People, Geneograph, Albums, Archive, Notes, and Places
- **THEN** equivalent surfaces retain the same elevation meaning

#### Scenario: Inspector expansion
- **WHEN** an inspector section is expanded without selecting an item
- **THEN** its surface remains neutral rather than appearing selected

### Requirement: Consistent interaction states
The application SHALL distinguish rest, hover, current item, batch selection, pressed, keyboard focus, and disabled states using shared roles and visible cues beyond color alone where selection or focus matters.

#### Scenario: Table and list selection
- **WHEN** a user inspects an item and checks items for a batch action in People, Albums list, Archive files or Sources, or Places
- **THEN** the current item and checked items remain distinguishable, including when they are the same row

#### Scenario: Keyboard focus
- **WHEN** a user tabs to an enabled control or selectable row action
- **THEN** focus is visible independently of hover and selection in either theme

### Requirement: Consistent shared controls and pickers
Buttons, fields, search, selects, checkboxes, modals, and resource pickers SHALL use matching semantic colors for equivalent states across modules.

#### Scenario: Resource picker
- **WHEN** a user opens a Manage or Add picker for photos, files, notes, people, places, or sources
- **THEN** toolbar, selection, focus, disabled, and footer states have consistent meanings while resource-specific layouts remain usable

### Requirement: Content identity remains separate from status
The application SHALL use approved content accent families for category identity and separate status roles for warning, error, success, and disabled conditions. Shared primary actions and global selection SHALL retain Heritage Green.

#### Scenario: Content categories
- **WHEN** events, sources, photos, files, notes, places, people, boards, or publication items appear in different modules
- **THEN** each category keeps its assigned accent family, with generic Events using Chronicle Copper and Sources using Evidence Slate

#### Scenario: Warning or failure
- **WHEN** a record needs review or an operation fails
- **THEN** status styling conveys the condition without replacing the record's content identity

### Requirement: Accessible foreground and background pairing
The application SHALL pair text, icons, and meaningful control boundaries with foreground roles appropriate to their actual backgrounds in both themes.

#### Scenario: Primary and destructive controls
- **WHEN** a user views an enabled primary or destructive action
- **THEN** its label and icon use the matching on-color and remain readable in Light and Dark themes

### Requirement: Content colors remain independent
Application theme changes SHALL preserve explicit Geneograph board paints, user-selected colors, photographs, cover artwork, map tiles, and authored rich-text colors.

#### Scenario: Theme change with customized board
- **WHEN** the user changes the app theme while viewing a board with explicitly chosen paints
- **THEN** those saved paints remain unchanged while surrounding UI follows the new theme
