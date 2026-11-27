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

### Requirement: Shared graph palette

Inherited Geneograph person gender/neutral appearance SHALL use the accepted Family Tree category recipes for the effective theme, with readable foregrounds and distinct initials-only tiles. Inherited shape colors use the shared heritage-green recipe. Manual color suggestions expose sixteen shared theme colors, neutral and semantic colors without automatic branch assignment or dependence on mutable project Tree palettes. Explicit paints, alpha, disabled paint, loaded portraits, selection and board editing remain independent. Inherited text adapts to insufficient contrast where possible without rewriting authored text paints. Existing preview and export paths use resolved board appearance.

Edit and add-relative actions use transparent resting surfaces, subtle theme-specific hover highlights and icon colors contrasting with the effective card fill, independently of authored text, across standard, compact, chart and portrait layouts. Preserve hit targets, positions, focus, selection and visibility behavior.
