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

Preserve supported event and education details. Use shared Source records for undetailed citations and standalone sources; create citation-specific Sources for detailed evidence, inheriting original source metadata and retaining readable locators, dates, roles, excerpts and literal citation quality in Source Notes. Assign a URL only when a safe HTTP(S) destination is unambiguous. Reuse identical evidence only within the original source; preserve supported person/event links and explicit research Notes. Do not generate citation Notes or infer facts. Omit redundant unused base records when citation-specific Sources retain the original metadata. Preserve unresolved family citations as Sources with a report warning instead of assigning them to unrelated people. Omit residence/contact details, recorded ages and export bookkeeping from the report. Report online-only MyHeritage photos once per distinct file URL.

#### Scenario: Distinct records from one source

- **WHEN** two different detailed citations refer to one source and another person cites identical evidence to the first
- **THEN** two Sources retain the different evidence, and the first Source links to both people
- **AND** no generated citation Note is created.

### Requirement: Preserve additional family events and date qualifiers

Import engagement, marriage banns, marriage contracts, marriage licenses, marriage settlements, divorce filings, and family census entries as linked Notes. Keep the event label, original date, place, and attached note text. Keep existing marriage, divorce, and annulment events as relationship events.

Map GEDCOM CAL and INT to the Calculated date type when the date can be parsed, keeping the original GEDCOM text. Education and Occupation import GEDCOM FROM and TO periods into their existing start and end fields. Periods on other records remain preserved as text.

### Requirement: Optional MyHeritage photo downloads

For MyHeritage GEDCOM files, offer an explicit download action for JPEG, PNG, and WebP links on the supported MyHeritage image host. Stage and validate each distinct image locally, keep its associations, and apply the same attachment limits as local files. Failed downloads remain nonblocking. Selecting a GEDCOM alone does not request any online images.

### Requirement: Preserve readable imported research text

After assembling GEDCOM continuations, recognize HTML-formatted supported research text without interpreting ordinary literal text as markup. Store readable plain text in evidence fields, retaining safe link destinations when different from their labels, and existing canonical Quill Delta in Notes when supported formatting is present. Preserve paragraphs, line breaks, bold, italic, underline, strike, lists and safe links; retain plain-text search content, readable note titles, shared note identity and all existing associations. Imported markup SHALL NOT be executed or load external resources. Routine presentation normalization and conversion of formatted evidence to readable plain text SHALL NOT produce warnings. Unsupported or incomplete formatting SHALL be reported separately from genuinely unsafe or active content omitted, retaining GEDCOM tag and line examples. Source evidence SHALL recognize bounded layers of escaped HTML after continuation assembly and preserve literal unknown placeholders and unrecognized plain text.

### Requirement: Preserve MyHeritage portraits without redundant cutouts

For explicit, unambiguous MyHeritage cutout-to-original identity links, stage original images first and validate the owning person's original pixel rectangle against decoded image dimensions. When every cutout link has a usable rectangle on an available original, reuse that original with normalized per-person regions and supported primary-photo flags rather than load or store redundant derived images. Missing, ambiguous or invalid originals/regions SHALL retain available fallback portraits and disclose genuine unresolved attachment outcomes in expandable warnings. Successful consolidation and retained fallback portraits are not warnings or separate technical counters. Distinct unrelated images SHALL NOT be merged by title, filename or resemblance. Existing optional online download consent, allowed hosts, attachment limits, project validation, other exporters and local folder behavior remain intact.

### Requirement: Organize imported photos and research notes

Before detached draft validation, create one ordinary project-local album named Imported and assign every final canonical photo to it, when photos exist. Create one ordinary project-local Notes collection named Imported and assign every final canonical Note to it, when notes exist. Names use the import language (EN Imported; RU Импортированные). Consolidated photos count once, and citation-only Sources do not create Notes collections. No empty container, duplicate membership or separate system collection is created. Preview and result counts reflect actual research records; ordinary automatically created collection counters are not displayed. Cancelled or failed imports SHALL leave existing projects and collections unchanged. Imported records retain ordinary editability, connected-record links and All photos/All notes access; Archive and Sources organization is unaffected.

### Requirement: Prepare imported place context offline

Preserve authored place names and fact text, reconstruct continuations, extract unambiguous valid embedded latitude/longitude pairs, preserve valid explicit MAP coordinates and report conflicts without choosing one. Consolidate only equivalent complete place hierarchies (case, canonical Unicode, insignificant whitespace or demonstrably incidental final full stop), even without recognized country, with compatible coordinates and no invalid/conflicting coordinate evidence. Preserve aliases, all references and valid timestamps. Do not merge by locality-only similarity or reorder stored names. This preparation precedes automatic geocoding; existing projects SHALL NOT be rewritten.

### Requirement: Match missing place coordinates after confirmation

Following offline preparation, the importer SHALL automatically attempt at most 150 eligible unresolved places per import, prioritized by linked records, after disclosure and confirmation. A concise disclosure beside the import action explains that place names may be sent to the existing providers. No pre-import settings block or opt-out checkbox is shown. Final detached validation and successful commit/activation SHALL precede online lookup. Canceling or failing import before commit starts no job. Network failures SHALL NOT prevent import.

Matching runs asynchronously in a session-local project-scoped job. Preserve authored names, existing coordinates, links and invalid/conflicting source evidence. Apply the recall-first settlement selection and single-provider policy defined in [Places geocoding](../places-geocoding/spec.md); historical or unsupported context remains unresolved. Each later point mutation rechecks live project/job/record identity, unchanged input, missing coordinates and valid point; preserve manual edits and cancel on deletion/replacement. Limit concurrent import lookups globally to two, deduplicate in-flight queries, prioritize queued manual provider requests, and recheck cooldown at dispatch. Coalesce progressive Places list/review/count/marker/inspector updates without remounting the module or resetting viewport, search, selection or open drafts; defer conflicting edits/menus.

The result dialog SHALL present a compact themed lookup panel with running indicator, Stop lookup action, provider attribution and final status, without a separate technical statistics block. Closing the report does not stop matching; stopping retains completed matches. Places shows the same explanatory status panel only while running and removes it on termination. The result reports quota or provider interruptions; unresolved places remain in Needs review with localized reasons and eligible explicit retries. Jobs, diagnostics and provisional match notes are session-local, not canonical stored evidence or telemetry; reload ends jobs.

#### Scenario: Continue working during matching

- **WHEN** the detached import commits successfully
- **THEN** the project is immediately usable while up to two global lookup slots enrich eligible missing coordinates
- **AND** the user can stop matching without rolling back imported records or completed matches
- **AND** a provisional automatically selected point can be reviewed or manually corrected.

### Requirement: Verified post-import duplicate reconciliation

Automatic reconciliation SHALL be limited to unchanged newly imported settlements with independently verified shared provider identity, compatible context, matching coordinates and no conflicting authored fields or dismissal. Provisional first-result assignments SHALL NOT authorize automatic merging. Use the canonical reference remap, preserve names as aliases, original fact text, project ownership and active selection. Prefer a more specific authored name, preserve session-only verified evidence for a later explicit retry, and invalidate evidence on edits. Defer unsafe active editing situations to review. Unverified shortened/full names SHALL remain review suggestions rather than automatic merges. Existing stale-write and asynchronous lifecycle protections remain intact.
