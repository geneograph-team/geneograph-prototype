# ADDED Requirements

### Requirement: Consistent interactive person search

Interactive person searches SHALL normalize case, whitespace and Unicode diacritics consistently. Every nonempty query token SHALL match a substring of searchable fields belonging to the same candidate person, independently of token order. Search SHALL include recorded first, middle, last, maiden, prefix and suffix names, full and localized display names, and existing context-specific metadata. Preserve project scope, eligibility, sorting, caps, ranking, existing links and empty-query behavior. Mixed record searches SHALL retain their existing non-person text matching and support matching a single linked person where names are already searchable. Do not change identity-match scoring or canonical data.

#### Scenario: Partial names in any order
- **WHEN** a user searches for `Lu Ma Pu` or `Pu Lu Ma`
- **THEN** Luna Mabel Purrington matches, but a different person's partial matches cannot supply a missing token.
