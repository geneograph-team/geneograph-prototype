## MODIFIED Requirements

### Requirement: Unified missing-position review rows
Active and dismissed missing-position rows SHALL use the same selectable row hierarchy as duplicate findings, with a localized singular No map position heading, Place name, optional real broader Place and linked total. Dismissed rows SHALL retain their reason and reason-editing controls. Missing broader-Place data SHALL not create placeholder text.

#### Scenario: Missing broader Place
- **WHEN** a Place with no broader Place has a missing-position issue
- **THEN** its row shows No map position, its name and linked count without a No broader place recorded placeholder

#### Scenario: Dismissed Place without broader Place
- **WHEN** a dismissed missing-position Place has no broader Place
- **THEN** the row shows No map position, its Place name, linked count and dismissal reason without a placeholder line
