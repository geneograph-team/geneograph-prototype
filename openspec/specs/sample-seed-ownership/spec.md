# Sample seed ownership

## Requirements

### Requirement: Seed data and runtime stay separate
Sample genealogy, board collections, Archive, Notes, source links,
and other sample-only initialization SHALL live in `src/seed/`
or referenced data-only seed assets. Runtime canvas/paint factories,
Archive Source helpers, and Notes model behavior SHALL remain in
their owning modules.

#### Scenario: Classic script startup
- **WHEN** `src/index.html` opens on HTTP(S) or `file://`
- **THEN** ordered classic scripts initialize sample records before
  consumers without duplicate setup

### Requirement: Stable prototype graph
Sample IDs, linked evidence, board assets, and references SHALL be
project-consistent and available to their connected views.

#### Scenario: Open the sample research workspace
- **WHEN** the canonical sample loads
- **THEN** linked genealogy, Archive, Notes and Geneograph board views
  resolve their related records
