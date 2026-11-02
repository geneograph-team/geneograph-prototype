# Spec Delta

## Purpose

Archive item browsing lets a person scan visible files and folders, select related items, and reach the actions available for each item without losing context.

## ADDED Requirements

### Requirement: Readable Archive tiles
The Archive SHALL present desktop file and folder tiles with distinct artwork, name, and favorite areas so the favorite indicator cannot cover the name.

#### Scenario: Long favorite file name
- **WHEN** a favorite file has a name longer than two tile lines
- **THEN** its name is truncated within the name area and the favorite indicator remains visible without overlapping text

#### Scenario: Narrow Archive content area
- **WHEN** the Archive content area narrows
- **THEN** the tile grid wraps to fewer columns without clipping tiles or causing horizontal overflow

#### Scenario: Tile content
- **WHEN** a file or folder tile is shown
- **THEN** it shows artwork and a name without a metadata line

### Requirement: Desktop range and toggle selection
The Archive SHALL support single, toggle, and contiguous range selection across the currently visible folder-then-file order in desktop tile and table views.

#### Scenario: Plain click
- **WHEN** a person clicks an item without a selection modifier
- **THEN** that item becomes the sole selected item and its inspector details appear

#### Scenario: One selected tile
- **WHEN** exactly one file or folder tile is selected
- **THEN** its inspector detail is shown without a checked tile checkbox or bulk action bar

#### Scenario: Ctrl or Command click
- **WHEN** a person Ctrl-clicks or Command-clicks an item
- **THEN** only that item's membership in the selection changes without opening it

#### Scenario: Shift click
- **WHEN** a person selects an anchor item and Shift-clicks another visible item
- **THEN** every visible item between them, including folders and files, becomes selected

#### Scenario: Visible order changes
- **WHEN** filtering, sorting, navigation, or layout changes the visible items
- **THEN** a later range selection uses the current visible order and cannot select hidden items

### Requirement: Context actions for Archive items
The Archive SHALL offer right-click actions for file and folder tiles and rows, and for folders in the sidebar, using actions already available for those item types.

#### Scenario: Right click on an unselected item
- **WHEN** a person right-clicks an unselected file or folder in the main Archive view
- **THEN** that item becomes the selection and its item menu opens near the pointer

#### Scenario: Right click within a selected group
- **WHEN** a person right-clicks an item in a selection containing multiple items
- **THEN** the selection remains intact and a menu offers only actions valid for the selected group

#### Scenario: Sidebar folder context
- **WHEN** a person right-clicks a folder in the Archive sidebar
- **THEN** its folder action menu opens without changing the current Archive location or main-view selection

#### Scenario: Keyboard action access
- **WHEN** a person focuses an item's existing More button and activates it
- **THEN** the same applicable actions remain available without a pointer

### Requirement: Existing open and mobile behavior
The Archive SHALL preserve double-click opening and the current mobile list and touch interactions.

#### Scenario: Desktop double click
- **WHEN** a person double-clicks a file or folder without selection modifiers
- **THEN** the item opens as it did before this change

#### Scenario: Mobile item interaction
- **WHEN** a person uses the Archive mobile list
- **THEN** its existing tap, selection, and action controls remain usable