# Design

The Places editor continues using shared `matchDuplicatePlaces()` to display
an informational warning. `commitPlaceEditorDraft()` no longer inspects duplicate
status before validating and saving. **Use existing** invokes the existing
navigation/completion flow without creating a record. **Ignore** only hides the
current suggestion for the current draft; it never becomes a saved-pair decision.

For similarly named Places, compare explicitly supplied comma-separated
geographic contexts from the most general trailing component inward. A
conflicting shared level prevents a duplicate suggestion; missing levels alone
do not indicate a conflict. The full-name and alternative-name matching rules
remain available where contexts do not conflict.

Relevant name, alias, coordinate, location-mode and radius edits clear a
dismissed warning; returning from map selection re-evaluates the suggestion.
The name input consumes Enter only when selecting an active autocomplete
choice; otherwise native form submission proceeds.

Verification includes saved-pair review/merge, in-memory creation, EN/RU,
keyboard entry, and hosted versus file:// map behavior.
