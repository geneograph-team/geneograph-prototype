# Project data contract

**Status: provisional V1 contract.** Canonical-data cleanup [#330](https://github.com/geneograph-team/geneograph-prototype/issues/330) is unfinished. These are intended invariants and a proposed serialization boundary, **not** proof that complete validation, GEDCOM import [#331](https://github.com/geneograph-team/geneograph-prototype/issues/331) or project backup/restore [#332](https://github.com/geneograph-team/geneograph-prototype/issues/332) is implemented or verified. Finalize the contract with #330 without introducing legacy compatibility paths.

A project owns the records listed by PROJECT_OWNED_COLLECTIONS in src/core/validation.js. Record IDs are stable within each collection. projectId identifies the owning project. References must resolve within that project. A board-local person ID is scoped to its board and is distinct from a Family Tree person ID.

A Family Tree family is identified by its own ID. partnerAId and partnerBId identify its members, with an empty slot for a one-parent family. childIds records memberships. parentChildTypes records the type of each parent-child link. Partner role hints support display and placement. A pair of partners can belong to more than one family record. A child can belong to several families, and neither case implies that records should be merged. Family events carry relationship dates and places. The recorded marriage event stores the marriage type in its typeLabel. Timeline rows display recorded events and facts.

## Stored records and derived views

| Record | Contract |
| --- | --- |
| Project | Nonempty text ID and name. Optional default person and cover photo IDs resolve to people and media in the same project. Creation and modification use createdAt and modifiedAt timestamps. |
| Person | Explicit gender and living status, structured birth and death dates, a profile object, and arrays for events, attributes, notes and citations. |
| Person name | A names object with first and last strings. Middle, maiden, prefix and suffix are optional strings. An empty string represents an unrecorded part. The draft limit is 1,024 UTF-16 code units per part. Display names and initials are computed from the recorded parts and the placeholder role. |
| Person and family events | Each event has an ID unique within its owner's event array and a nonempty gedcomTag. Dates are structured genealogy dates. Evidence references resolve within the project. Attributes use their own tag field. Education records use institutionName and institutionType. Occupation records use company. Custom facts may have a type. |
| Family membership | Both partner slots are strings. An empty string means the slot is unoccupied. A child ID is a nonempty string and occurs at most once per family. Parentage keys combine the parent ID and child ID with a vertical bar and apply only within that family. Missing parentage is read as Unknown parentage. Optional partner role hints are HUSB, WIFE or empty. The role hints are display metadata. |
| Place | A nonempty name, an array of nonempty alternative names unique after lookup normalization, and coordinates. A null coordinate means no known map location. A point contains numeric latitude and longitude in range. An optional approximate radius of 1 to 1,000,000 meters requires a valid center. |
| Source link | A source ID, target type and target ID. The source and target must exist in the same project. The same source-to-target triple can occur only once. |
| Media and albums | Person and album references belong to the media record. Its optional place points to a project Place. A person's primary photo references project media. Album names and photo filenames are nonempty text. Image regions use normalized coordinates and a key for the referenced person. |
| Archive and Notes | An Archive file references its folder, document place and related project records. A note references its collections and related records. Both can point to derived event IDs, which are resolved after reconstruction. Note text has a title and body. Rich-text notes pair the quill-delta-v1 format with a delta containing an ops array. |
| Geneograph | Board collections are project references. A board diagram owns its assets, people, families, nodes and connections. Board-local IDs resolve within the diagram. References explicitly scoped to the project resolve against project collections. Board vital and family events use structured dates. Board diagrams have theme provenance version 1, explicit canvas and connection override flags, and boolean fill, stroke and text override flags on card appearances and nodes. Standalone board-file import converts older theme settings at the file boundary. The sample board authors its defaults directly. Partner and child edges must agree with the family membership and the parent graph must be acyclic. |

Display names, initials, timeline rows and UI counters are derived presentation. A link to a derived event ID is an authored relationship. Preserve that link and regenerate its target from the underlying person, family or fact identity. A relationship timeline ID combines the family ID and its recorded event ID. Changing the event type retains both IDs, and the timeline reflects the new type.

## V1 backup boundary

V1 retains project metadata and the collections below. The metadata-only Whiskerfield round trip exercises this boundary with photo, Archive, and board image bytes removed. Backup serialization and restore remain follow-up work in #332.

| Data | Included collections |
| --- | --- |
| Genealogy | `people`, `families` |
| Places | `places`, `placeSavedFilters`, `placeIssues` |
| Photos | `media`, `albums` |
| Evidence | `archiveFolders`, `archiveFiles`, `sources`, `sourceLinks`, `links` |
| Notes | `noteCollections`, `notes` |
| Geneograph | `boardCollections`, `boards` |
| Publishing | `publishDrafts` |

Exclude generated timeline rows and counters, activity, notifications, active filters and selections, scroll and viewport state, and media bytes and session locators. Saved Places filters are project records.

`prepareProjectDraft(project, records)` accepts project metadata separately from the collections. Missing collections are treated as empty. Unknown collections and input containing `events`, `activity`, or `notifications` are rejected. The input must be JSON-compatible and is limited to 1,000,000 values across metadata and collections, with at most 64 nested levels. The function validates on a detached copy and returns either diagnostics or the detached project and records with regenerated events. It does not commit the project. The backup serializer is responsible for excluding binary locators before producing the backup.

### Media references without binaries

Keep project media, Archive file, and board asset metadata under their original record IDs in the serialized project. Preserve album membership, portrait IDs and crop, Archive evidence links, and board image references. A board-local asset ID remains scoped to its board. During restore, remap the IDs and their references together if the destination requires new IDs.

Exclude the bytes and session-specific locators that contain or expose them, including inline data URLs, object URLs, and preview URLs. A metadata record with unavailable content has no usable source locator. The restore flow must show an unavailable-media placeholder and must not fabricate a filename, reuse a destination project's file, or drop a valid relationship just because its bytes are absent. A missing metadata record is a dangling reference and fails validation.

For a project cover chosen from its photo library, preserve coverPhotoId and coverPosition with the related media metadata. Exclude coverImageSrc, including when it is a cropped copy. A cover uploaded solely for the cover has no media record to reference. Preserve the cover style and position, and display the unavailable-cover state until the user chooses another image. Preset covers retain their preset key and use the application asset for that key.

The project backup contract is separate from the Geneograph board file contract. A standalone board export may embed its own images. A project backup retains board image objects and asset metadata while applying the project-wide binary exclusion.

An external parser must reject an unsupported format or version before constructing a draft. Allocate a new project ID, remap record IDs where required, and rewrite references with collection-scoped maps. Rebuild derived timeline entries before resolving references to them. Validate the complete draft before committing any of it. Cancel and validation errors leave the live project untouched.

### Restore identity and reference rewriting

Allocate the destination project ID first and assign it to the project record and each owned record. Allocate collision-free IDs for collections whose runtime lookups use global IDs. Preserve board-local IDs unless the destination board itself already contains those IDs. Use a separate map for each board and each local record kind.

Rewrite all structured references. This includes project defaults and covers, family partner and child IDs, parentage keys, fact Place and media IDs, collection memberships, person-region keys, reciprocal note links, Archive evidence and folder references, and typed Source targets. Board nodes and edges use board-local maps for people, assets, family links, panel IDs and endpoints. Links from a board to the Family Tree, project Places and project media use the project collection maps. Never rewrite a plain-text mention as though it were an ID.

Regenerate derived events from the remapped records. Map each old derived event ID to the new ID by its originating person, family or fact, then rewrite Source, Archive and Notes event references before validating the complete draft. If any structured reference is unresolved, report its owning record and field and leave the current project untouched.

The detached validator checks collection ownership, ID uniqueness, ancestry cycles, parentage, and references across research records, nested facts, and board-local records. The contract check exercises the authored Whiskerfield draft, a blank project, metadata without image bytes, and links to regenerated timeline events. Full schema review and end-to-end verification remain part of #330.
