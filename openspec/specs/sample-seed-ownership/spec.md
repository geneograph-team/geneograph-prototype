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
then deterministically construct and validate its **1,023-person, 10-level
ancestor pedigree** upon first project activation. **Person 0001 SHALL be
the bottom focal person; persons 0002 and 0003 are their parents; each numbered
person n with parents has father 2n and mother 2n+1** through nine complete
ancestral levels (2, 4, 8, ... 512 ancestors in each successive level).
Every person belongs to at most one family as a child and at most one family
as a partner; the person-family membership graph SHALL be connected and
acyclic. No branches may reconverge or require repeated visual appearances.
Multiple-partner, half-sibling, descendant-heavy or pedigree-collapse cases
are not part of this baseline fixture. It SHALL NOT modify Whiskerfield, duplicate records
on reopening, or overwrite in-session edits. The fixture and its references
**MUST be removed before open user testing**. This requirement is temporary
and must be deleted with the fixture.

#### Scenario: Startup and first activation
- **WHEN** the app starts before the internal test project is opened
- **THEN** Whiskerfield records are present but no stress-test people or families exist
- **AND** its project card advertises its intended person count
- **WHEN** the tester opens the technical project
- **THEN** all 1,023 synthetic people and their 511 valid parent families are available atomically
- **AND** a second opening does not regenerate or discard edits
- **AND** file-based startup requires no network fetch

#### Scenario: Fully populated ancestors above the proband
- **WHEN** the tester selects Person 0001 in Family Tree
- **THEN** Person 0002 is the recorded father and Person 0003 the recorded mother
- **AND** their recorded parents are Person 0004–0007, and every row up to nine ancestor levels is fully populated with 2^level distinct people
- **AND** Person 0001 has no descendants in this baseline fixture
- **AND** all ancestry remains navigable despite the Tree UI's existing six-level-at-once limit

#### Scenario: Single-appearance Family Tree baseline
- **WHEN** the tester focuses anywhere in the technical project's pedigree
- **THEN** each canonical person appears at most once in that view
- **AND** there are no membership loops, repeated parent families or repeated partner families
- **AND** any unknown-parent placeholders represent missing evidence, not duplicate person records
