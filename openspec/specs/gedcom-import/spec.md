# GEDCOM import

## Requirements

### Requirement: Local versioned GEDCOM import

The prototype SHALL read UTF-8 GEDCOM 5.5.1 locally and import all supported people and families into one separate session project. It SHALL show the file version, editable project name, counts, unsupported data, and the reload warning before commit.

#### Scenario: Import a genealogy

- **WHEN** a user selects or drops a valid file and confirms the preview
- **THEN** the importer resolves project-local people and family references
- **AND** the detached draft validates and regenerates timeline events before commit
- **AND** Family Tree opens for the new project and the overview offers the import report

### Requirement: Preserve supported family and date semantics

Distinct FAM records SHALL keep distinct identities. One-parent families and multiple memberships SHALL remain separate. Explicit marriage, divorce and supported parentage SHALL be preserved. Unknown parentage or missing events SHALL remain unasserted. Qualified and bounded dates SHALL use canonical date fields, with unsupported date text retained and disclosed.

### Requirement: Fail without partial imports

Invalid encoding, unsupported versions, invalid graph references, and structural errors SHALL stop the import before commit. The local importer limits input to 8 MiB, 120,000 lines, 4,096 code units per line, 15,000 top-level records, and 32 nested levels, with parse and mapping time checks. Cancel and failed validation SHALL leave the existing project and view unchanged.
