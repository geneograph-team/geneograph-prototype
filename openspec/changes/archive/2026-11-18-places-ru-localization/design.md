# Design

Places dictionaries provide full sentence translations, contextual review
action labels, and agreed coordinate-state terminology. The shared Russian
translation of Dismiss remains «Скрыть» outside Places. A small Places
helper selects contextual keys only within the review interface.

Both route overview and route popup share the same exclusion title and
reason formatter. It uses the existing Russian plural formatter for event
counts, while the original exclusions and reasons stay unchanged.

Latitude/longitude parsing uses exact translated error sentences while
retaining numeric validation. The missing-coordinate dynamic translator
uses «Координаты не указаны. Связанных записей: N.» to avoid case errors.

The Place editor localizes only ten bundled sample Place IDs with exact
translations in the bundled dictionary. On collection, unchanged translated
names/aliases are mapped back to the original canonical values; an edited
string is accepted as the user's authored value. The inverse mapping is
language-independent so switching locale while a draft remains open does
not rewrite the stored Place. User-created/geocoder names are never
automatically transformed. No-op Save remains safe for canonical names.

A dedicated regression script verifies plurals, validation, localized
review labels and reversible editor values. Manual browser QA is recorded
in the PR and is not claimed as performed.
