# Design

Use `relationshipCount(person.id)` and `renderRelationships(person.id)` in the Profile New renderer. Both use `getRelationshipGroups()` and the shared row markup, which preserves Parents, Siblings, Partners, Children ordering, qualifiers, and established count semantics. Bind `bindRelationshipList(main, 'profile')` only for the Overview view. The `profile` context routes row selection to legacy Profile, while edit and unlink continue through existing relationship dialogs and confirmation flows.

The Relatives card remains a flex column with a fixed header. Its body gets `min-height: 0`, vertical auto overflow, hidden horizontal overflow, and contained overscroll. Shared row classes retain their current visual and keyboard behavior; only Profile New spacing is scoped locally. The shared empty message is localized by the existing UI localization pass, and no independent relative data is introduced.
