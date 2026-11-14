# Spec Delta

## Purpose

Family Tree zoom lets people move between a readable relationship overview and detailed person cards without losing their place or access to a person.

## ADDED Requirements

### Requirement: Understandable zoom levels
The Family Tree SHALL display a zoom level from 0% to 200%. At 100%, cards SHALL retain the current default scale; 0% SHALL remain a visible, usable overview rather than a zero-size tree.

#### Scenario: Reach both ends of the zoom range
- **WHEN** a user zooms repeatedly out or in
- **THEN** the displayed level stops at 0% or 200%, respectively, and the tree remains visible and interactive

#### Scenario: Restore default view
- **WHEN** a user activates Home
- **THEN** the level returns to 100% and the focused person is centered, as in the existing view

### Requirement: Progressive card detail
The Family Tree SHALL use distinct card-detail stages as users zoom out: full card details, photo and full name, given name, and a text-free person marker. The selected and focused person SHALL remain visually distinct at every stage.

#### Scenario: Zoom out through detail stages
- **WHEN** a user zooms from the default level to the overview
- **THEN** card content simplifies in stages before its text becomes too small to read, while person positions and relationship connections remain stable

#### Scenario: Zoom back into details
- **WHEN** a user zooms into a more detailed stage
- **THEN** the appropriate name, photo, date, and card actions return without changing person or relationship records

#### Scenario: Long or localized names
- **WHEN** a name is too long for the active card stage in English or Russian
- **THEN** visible text is clipped or abbreviated within the card, and the full person name remains available as an accessible label

### Requirement: Overview interaction
The Family Tree SHALL keep person selection, keyboard access, and navigation available at all zoom levels. Parent placeholders and card-adjacent controls SHALL not obscure the relationship overview.

#### Scenario: Select an overview marker
- **WHEN** a user activates a person marker at the lowest detail stage
- **THEN** that person is selected and their existing inspector information remains available

#### Scenario: Use a missing-parent placeholder
- **WHEN** a user activates an available Add father or Add mother placeholder at an overview level
- **THEN** the existing add-relative flow opens for the correct person and role

### Requirement: Stable viewport during zoom
Zooming SHALL preserve the tree point under a mouse or pinch gesture, or the viewport center for button zoom, subject to normal canvas bounds.

#### Scenario: Zoom at a pointer position
- **WHEN** a user zooms with a mouse wheel or pinch gesture over the tree
- **THEN** the point under the gesture remains at approximately the same screen position across zoom and detail-stage changes

#### Scenario: Zoom with a button
- **WHEN** a user activates a zoom button
- **THEN** the visible tree stays centered on approximately the same point across zoom and detail-stage changes
