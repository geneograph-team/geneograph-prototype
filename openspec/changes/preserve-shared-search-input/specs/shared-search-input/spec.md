# Shared search input

## ADDED Requirements

### Requirement: Lossless main-view search input
Compatible search-result refreshes SHALL preserve the native focused search input, its current value and caret; they SHALL NOT depend on asynchronous refocusing of a newly created input. Query updates SHALL use the latest complete native value and not publish intermediate IME composition. Pending refreshes SHALL remain scoped to the originating current input, module, project and language and SHALL NOT publish into a superseded view. Existing full-population query, filter, ordering, counts, selection and detail lifecycle semantics SHALL be preserved.

#### Scenario: Rapid typing
- **WHEN** a researcher rapidly types, deletes or replaces characters in a shared main-view search field
- **THEN** the field retains the complete native text and focus during compatible refreshes, and the final query produces the existing matching result set.

#### Scenario: Navigation during pending refresh
- **WHEN** the owning view or project changes before publication
- **THEN** stale refresh work does not alter results or steal focus in the destination view.
