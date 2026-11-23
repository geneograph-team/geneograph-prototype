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
- **AND** the genealogy seed derives timeline events once without changing authored
  Source, Archive or Notes links
- **AND** later startup validates the authored collections and evidence links

### Requirement: Stable prototype graph
Sample IDs, linked evidence, board assets, and references SHALL be
project-consistent and available to their connected views.

#### Scenario: Open the sample research workspace
- **WHEN** the canonical sample loads
- **THEN** linked genealogy, Archive, Notes and Geneograph board views
  resolve their related records

### Requirement: Temporary large-scale technical fixture remains isolated and lazy

While internal Family Tree stress testing is in progress, the **temporary**
second sample project (issue #381) SHALL expose only metadata at startup,
then deterministically construct and validate its 1,200-person, ten-cohort,
connected canonical family graph upon first project activation. It SHALL NOT
modify Whiskerfield, duplicate records on reopening, or overwrite in-session
edits. The fixture and its references **MUST be removed before open user
testing**. This requirement is temporary and must be deleted with the fixture.

#### Scenario: Startup and first activation
- **WHEN** the app starts before the internal test project is opened
- **THEN** Whiskerfield records are present but no stress-test people or families exist
- **AND** its project card advertises its intended person count
- **WHEN** the tester opens the technical project
- **THEN** all 1,200 synthetic people and their valid family graph are available atomically
- **AND** a second opening does not regenerate or discard edits
- **AND** file-based startup requires no network fetch
