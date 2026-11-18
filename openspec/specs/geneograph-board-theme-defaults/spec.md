# Geneograph board theme defaults

## Requirements

### Requirement: Inherited board appearance follows the theme
New and existing boards SHALL resolve inherited canvas, card, object, and
connection colors from the effective theme without changing their contents,
selection, or viewport.

#### Scenario: Open board changes theme
- **WHEN** the effective appearance changes
- **THEN** inherited board colors update in place

### Requirement: Explicit colors override inheritance
A user-selected color SHALL remain fixed across theme changes until
Reset to default clears the explicit override.

#### Scenario: Reset a paint
- **WHEN** a user resets an explicitly chosen color
- **THEN** it follows the current and subsequent theme defaults

### Requirement: Editable board files preserve color provenance
Seeded boards SHALL distinguish authored from inherited colors.
Editable board export/import SHALL preserve explicit colors and
inheritance metadata.

#### Scenario: Reopen a board file
- **WHEN** a board is exported, imported, then the theme changes
- **THEN** only inherited paints follow the new theme
