# Spec Delta

## Purpose

Helps users place Geneograph board objects precisely by showing temporary object-relative alignment guides during movement.

## ADDED Requirements

### Requirement: Object alignment guides
While a user drags one or more board objects, the editor SHALL show temporary horizontal or vertical guides when the moving selection's edge or center is close to the corresponding edge or center of another visible object.

#### Scenario: Align edges or centers
- **WHEN** a moving selection approaches a visible object's matching left, horizontal center, right, top, vertical center, or bottom alignment
- **THEN** the editor displays the matching guide and aligns that axis of the selection

#### Scenario: Independent axes
- **WHEN** horizontal and vertical matches are available at the same time
- **THEN** both guides can appear and both axes can align

#### Scenario: Guide near aligned cards
- **WHEN** an alignment guide appears for two cards
- **THEN** its visible segment stays between separated cards or outside their bounds, without crossing either card's interior

### Requirement: Alignment priority over the grid
The editor SHALL use object alignment when a matching object is within the guide threshold, even when Snap to grid is enabled. When no match qualifies on an axis, existing grid snapping SHALL apply on that axis.

#### Scenario: Match between grid points
- **WHEN** Snap to grid is enabled and a nearby object alignment falls between grid points
- **THEN** the dragged selection aligns with that object on the matching axis

#### Scenario: No nearby match
- **WHEN** no object alignment qualifies on an axis during a drag
- **THEN** that axis follows its existing Snap to grid setting

### Requirement: Group and target behavior
For multi-object movement, the editor SHALL align the moving selection as one bounding rectangle and preserve positions within the selection. It SHALL consider visible stationary objects, including locked objects, but SHALL not match objects moving with the selection.

#### Scenario: Multi-selection
- **WHEN** multiple selected objects are dragged near a stationary object
- **THEN** their combined bounds align and the selected objects keep their relative positions

#### Scenario: Hidden or moving object
- **WHEN** a possible target is hidden or belongs to the moving selection
- **THEN** it does not produce a guide or snapping target

### Requirement: Midpoint alignment between person cards
When two stationary visible person cards share a row or column without overlapping on that axis, the editor SHALL guide and snap a dragged object's center to the midpoint of the card centers within the alignment threshold. The moving object need not fit between their edges. This midpoint behavior SHALL not apply to other target types.

#### Scenario: Center within a person-card gap
- **WHEN** a moving object's center approaches the midpoint of two visible person-card centers on a shared row or column
- **THEN** a center guide appears and the object snaps to that midpoint on the matching axis

#### Scenario: No qualifying pair
- **WHEN** the cards do not share the relevant row or column, overlap on that axis, or either card is hidden
- **THEN** that pair does not produce a midpoint guide or snap

### Requirement: Pencil drawings excluded from alignment
Pencil drawing objects SHALL neither trigger alignment while being moved nor serve as alignment targets for other moving objects.

#### Scenario: Drawing moved or targeted
- **WHEN** a pencil drawing is in the moving selection or is a potential stationary target
- **THEN** that drawing does not produce alignment snapping or guides

### Requirement: Shift-constrained object dragging
While Shift is held during an object drag, the editor SHALL lock movement to the first dominant movement axis and SHALL apply alignment and grid snapping only on that axis. Releasing Shift SHALL restore free movement.

#### Scenario: Hold Shift while dragging
- **WHEN** the user holds Shift and begins moving an object mostly horizontally or vertically
- **THEN** the object moves only on that axis and the locked axis stays at its drag-start coordinate

#### Scenario: Release and press Shift again
- **WHEN** the user releases Shift and then holds it again during the same drag
- **THEN** free movement resumes while released, and a new dominant axis is chosen when Shift is held again

### Requirement: Board items range selection
Shift-clicking an object row in Board items SHALL select the inclusive range of currently displayed object rows from the last plain-click anchor through the clicked row in rendered order. Connection rows SHALL not be included. Ctrl/Cmd toggle selection SHALL retain its current behavior.

#### Scenario: Select visible range
- **WHEN** the user clicks one object row and Shift-clicks another displayed object row
- **THEN** all displayed object rows between them are selected, including both endpoints

#### Scenario: Anchor no longer displayed
- **WHEN** the anchor row is hidden by search, filtering, or a collapsed panel before Shift-click
- **THEN** the clicked object becomes the sole selection and the new anchor

### Requirement: Transient drag feedback
Alignment guides SHALL be visibly thicker than the initial 1px guide, appear only during eligible object movement, and clear on pointer release, cancellation, or editor rerender. They SHALL not be stored in the board or exported file.

#### Scenario: Drag ends
- **WHEN** the user releases or cancels an object drag
- **THEN** alignment guides disappear while the committed object positions follow the existing undo/redo behavior

#### Scenario: Other editing gestures
- **WHEN** the user resizes an object, edits a connection, pans, or moves objects with keyboard arrows
- **THEN** this change does not show object alignment guides
