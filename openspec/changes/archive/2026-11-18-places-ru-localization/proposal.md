# Places Russian localization — issue #235

## Why

Five annotated screenshots show partly English route exclusions, partially
translated coordinate validation, incorrect count grammar, inconsistent
map-position terminology, and untranslated bundled names in editable controls.
Places review actions also inherit a generic «Скрыть» translation that is
less precise than the confirmed «Отклонить».

## Scope and product decisions

- Compose complete Russian route exclusion messages with correct plurals.
- Localize full latitude/longitude validation messages without changing rules.
- Correct missing-coordinates warnings and compact their typography in Places.
- Use «Нет координат», «Координаты не указаны», «Есть координаты» and
  «Добавить координаты» in their confirmed contexts.
- Display known bundled seed Place names in Russian reversibly, without
  touching custom names, stored canonical data, or IDs.
- Scope «Отклонить», «Отклонённые» and «Вернуть на проверку» to Places
  review, leaving shared Dismiss/Restore vocabulary unaffected.

No routing, geocoding, merge logic, persistence, CI or deployment changes.
