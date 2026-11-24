# GEDCOM import

## Requirements

### Requirement: Local versioned GEDCOM import

The prototype SHALL read UTF-8 GEDCOM 5.5.1 locally and import all supported people and families into one separate session project. It SHALL show the file version, editable project name, counts, unsupported data, and the reload warning before commit.

#### Scenario: Import a genealogy

- **WHEN** a user selects a valid file and confirms the preview
- **THEN** the importer resolves project-local people and family references
- **AND** the detached draft validates and regenerates timeline events before commit
- **AND** Family Tree opens for the new project and the overview offers the import report

### Requirement: Preserve supported family and date semantics

Distinct FAM records SHALL keep distinct identities. One-parent families and multiple memberships SHALL remain separate. Explicit marriage, divorce and supported parentage SHALL be preserved. Unspecified parentage SHALL default to Biological. Explicit unsupported or ambiguous parentage and missing events SHALL remain unasserted. Qualified and bounded dates SHALL use canonical date fields, with unsupported date text retained and disclosed.

### Requirement: Fail without partial imports

Invalid encoding, unsupported versions, invalid graph references, and structural errors SHALL stop the import before commit. The local importer limits input to 64 MiB, 600,000 lines, 4,096 code units per line, 30,000 top-level records, and 32 nested levels, with five-second time checks for parsing and mapping. Cancel and failed validation SHALL leave the existing project and view unchanged.

The project overview dropzone SHALL remain inactive until import into an existing project is supported.

### Requirement: Match optional local attachments

The initial dialog SHALL offer GEDCOM selection as its single file action. After a valid preview, referenced local files SHALL reveal a separate optional folder picker. Selecting, changing or removing the folder SHALL preserve the selected genealogy and its project name.

The importer SHALL match files only from the selected folder, including subfolders. It SHALL prefer a relative-path match and accept suffix or filename matches only when unambiguous. Shared files SHALL reuse one canonical Photos or Archive record. Files without a supported representation or link SHALL be reported separately from imported files. Folder errors and missing files SHALL allow the genealogy to proceed.

### Requirement: Explain import outcomes

Fatal errors SHALL stay visible in the dialog and explain the reason, recovery and that no project was created. The preview and result SHALL disclose the session-only lifetime. The result SHALL report actual imported records and attachment outcomes, and remain available in the imported project's overview.

### Requirement: Preserve supported genealogy and evidence from MyHeritage exports

Identify MyHeritage by the GEDCOM header source. When its married surname differs from its recorded surname, import the married surname as the last name and the recorded surname as the maiden name, while respecting an explicitly recorded maiden name. Other exporters retain the standard surname mapping.

Preserve supported event and education details and import Source records with separate linked notes for individual citation excerpts and locators. Omit residence/contact details, recorded ages, citation quality flags, and export bookkeeping from the import report. Report online-only MyHeritage photos once per distinct file URL.

### Requirement: Preserve additional family events and date qualifiers

Import engagement, marriage banns, marriage contracts, marriage licenses, marriage settlements, divorce filings, and family census entries as linked Notes. Keep the event label, original date, place, and attached note text. Keep existing marriage, divorce, and annulment events as relationship events.

Map GEDCOM CAL and INT to the Calculated date type when the date can be parsed, keeping the original GEDCOM text. Date periods remain unsupported.
