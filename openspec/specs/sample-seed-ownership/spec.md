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
second sample project (issue #446, replacing #381) SHALL expose lightweight
project metadata and a data-only pseudonymized GEDCOM asset at startup.
It SHALL use the existing GEDCOM parser and mapper to validate and derive
canonical records on first activation, preserving 6,481 people and 1,950
nonempty families. Generic names and shifted dates SHALL remain intact.
The first exported individual SHALL be the default focus. The fixture SHALL
NOT modify Whiskerfield, duplicate records on reopening, overwrite in-session
edits or install any partial invalid draft. The data asset, fixture and its
references **MUST be removed before open user testing**. This requirement
is temporary and must be deleted with the fixture.

#### Scenario: Startup and first activation
- **WHEN** the app starts before the internal test project is opened
- **THEN** Whiskerfield records are present but no stress-test people or families exist
- **AND** its project card advertises 6,481 people
- **WHEN** the tester opens the technical project
- **THEN** 6,481 people, 1,950 families and derived timeline events are available atomically
- **AND** a second opening does not regenerate or discard edits
- **AND** file-based startup and first activation require no network fetch

#### Scenario: Complex genealogy
- **WHEN** the tester navigates the technical project's genealogy
- **THEN** incomplete ancestry, multiple partnerships, siblings and repeated visual contexts use the canonical family memberships
- **AND** Tree and People views reference the same canonical identities
