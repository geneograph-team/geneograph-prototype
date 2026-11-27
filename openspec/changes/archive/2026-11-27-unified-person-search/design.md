# Design and inventory

`shared/person-name-helpers.js` owns normalization, query tokenization, searchable name fields and same-candidate matching. The People directory prepares text in its existing revision/language-scoped read model. Single-person dialogs prepare candidate text on open; other consumers use their existing project-scoped candidates. Places route option summaries are reused within the open popover. Ranking, result limits, existing links and selected states remain consumer-owned.

## Migrated surfaces

- People directory; Family Tree focus, connect-relative and Tree Settings default/reference pickers.
- Shared single-person and multi-person pickers (Notes, Archive/Sources, relative selection, Geneograph linking/review), mixed person/event picker including related people.
- Albums photo tagging, Albums/Archive/Notes person filters and shared photo-resource filter; Places person-route search.
- Geneograph board-person review rail and person layers (board-local names); Archive connection picker.
- Existing linked-person name search in photo, note and Archive file/source browsing, photo/notes resource pickers. Existing generic mixed-record text matching stays intact; added person-name matching evaluates one linked person at a time.

## Not applicable

Native non-searchable selects (Places person/surname filters), surname-only and place-name searches, name-affix suggestions, unrelated record title/content searches and board/collection library search that does not search people. Disabled Publish. `person-match-engine.js` proposes identity matches, not interactive text search; unchanged. Event-specific text matching, non-person comboboxes and resource matching are retained.
