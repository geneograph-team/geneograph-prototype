# Places Russian localization

## Requirements

### Requirement: Contextual review vocabulary

Places Needs review and inspector SHALL use the Russian action «Отклонить»,
group «Отклонённые» and action «Вернуть на проверку». Shared translations
for Dismiss/Restore used elsewhere SHALL remain unchanged.

#### Scenario: Dismiss a review warning in Russian
- **WHEN** a user dismisses a Places review warning in Russian
- **THEN** the action says «Отклонить», the item appears under «Отклонённые»
- **AND** its review state can be restored without affecting the Place

### Requirement: Complete route exclusion messages

The route overview and route picker SHALL show exclusion counts and reason
breakdowns as natural fully localized messages, with correct Russian plural
forms for 1, 2, 5, 11 and 21 events.

#### Scenario: Two excluded events
- **WHEN** two events are excluded, one without a date and one without a Place
- **THEN** Russian UI reads «Не включено в маршрут: 2 события»
- **AND** its reasons read «без даты: 1 · без места: 1»

### Requirement: Coordinate validation in complete sentences

The Place editor SHALL report latitude and longitude numeric-format,
valid-number and bounds errors as complete localized sentences. Validation
bounds (latitude −90 to 90, longitude −180 to 180) SHALL be unchanged.

#### Scenario: Latitude outside bounds
- **WHEN** the user enters 181 degrees of latitude in Russian
- **THEN** the field reports «Широта должна быть в диапазоне от −90 до 90.»
- **AND** saving remains blocked by ordinary coordinate validation

### Requirement: Consistent coordinate status and warning

Compact Places status labels SHALL use «Нет координат» / «Есть координаты»,
review descriptions SHALL use «Координаты не указаны», and missing-location
review actions SHALL use «Добавить координаты». Approximate Places with valid
center coordinates SHALL count as having coordinates.

#### Scenario: One linked record, no coordinates
- **WHEN** a Place has no coordinates and is linked to one record
- **THEN** the Russian warning says
  «Координаты не указаны. Связанных записей: 1.»
- **AND** the warning text uses a compact Places-only type size

### Requirement: Reversible localization of bundled sample Place names

In the Russian editor, bundled sample Place names and alternative names
SHALL be displayed using their known Russian sample translations. Saving
without editing or switching languages SHALL preserve original canonical
stored values. User-created Place names and geocoder results SHALL never
be translated automatically in editable controls.

#### Scenario: Open and save an unchanged bundled Place
- **WHEN** Meowbridge School is opened in the Russian Place editor
- **THEN** the input shows «Школа Мяубриджа, Северный Йоркшир, Англия»
- **AND** saving without edits retains its canonical English name and aliases

#### Scenario: Edit an unfamiliar name
- **WHEN** a user edits a custom Place name in Russian
- **THEN** the entered name is preserved as authored
