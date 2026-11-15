# Design

`profile-new.js/css` owns the horizontal view. `getFamilyTreeTimelineEvents(person.id)` supplies project-scoped, sorted events; existing timeline helpers supply date/range/age, semantic marker/icon/color, and details. Horizontal event buttons open a standard app modal. The modal renders the existing `renderTimelineItem()` and binds `bindTimelineSourceControls()` to preserve editing, evidence expand/collapse, file/source attach and unlink, and file opening. The modal body scrolls vertically; the Timeline card does not.

The horizontal track uses equal-width event columns, a continuous line, and an overflow container with native wheel/trackpad horizontal scrolling plus previous/next controls. Event buttons support tab focus, visible focus, and Enter/Space. Long visible details may be visually clamped to fit the fixed card; the dialog retains complete data and actions. Unknown years display an explicit unknown marker, never an invented year. Existing age calculation is used only where it returns a value.

The selected dialog layout is the founder's decision for evidence/citation presentation in issue 193. No evidence UI is embedded in the horizontal node.
