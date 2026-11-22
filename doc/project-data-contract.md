# Project data contract

**Status: provisional V1 contract.** Canonical-data cleanup [#330](https://github.com/geneograph-team/geneograph-prototype/issues/330) is unfinished. These are intended invariants and a proposed serialization boundary, **not** proof that complete validation, GEDCOM import [#331](https://github.com/geneograph-team/geneograph-prototype/issues/331) or project backup/restore [#332](https://github.com/geneograph-team/geneograph-prototype/issues/332) is implemented or verified. Finalize the contract with #330 without introducing legacy compatibility paths.

A project owns the records listed by PROJECT_OWNED_COLLECTIONS in src/core/validation.js. Record IDs are stable within each collection. projectId identifies the owning project. References must resolve within that project. A board-local person ID is scoped to its board and is distinct from a Family Tree person ID.

A Family Tree family is identified by its own ID. partnerAId and partnerBId identify its members, with an empty slot for a one-parent family. childIds records memberships. parentChildTypes records the type of each parent-child link. Partner role hints support display and placement. A pair of partners can belong to more than one family record. A child can belong to several families, and neither case implies that records should be merged. Family events carry relationship dates and places. Timeline rows display recorded events and facts.

## Stored records and derived views

| Record | Contract |
| --- | --- |
| Project | Nonempty text ID and name. Optional default person and cover photo IDs resolve to people and media in the same project. |
| Person name | A names object with first and last strings. Middle, maiden, prefix and suffix are optional strings. An empty string represents an unrecorded part. The draft limit is 1,024 UTF-16 code units per part. Display names and initials are computed from the recorded parts and the placeholder role. |
| Person and family events | Each event has an ID unique within its owner's event array and a nonempty gedcomTag. Dates are structured genealogy dates. Evidence references resolve within the project. Attributes use their own tag field. |
| Family membership | Both partner slots are strings. An empty string means the slot is unoccupied. A child ID is a nonempty string and occurs at most once per family. Parentage keys combine the parent ID and child ID with a vertical bar and apply only within that family. Missing parentage is read as Unknown parentage. |
| Place | A nonempty name, an array of nonempty alternative names unique after lookup normalization, and coordinates. A null coordinate means no known map location. A point contains numeric latitude and longitude in range. An optional approximate radius of 1 to 1,000,000 meters requires a valid center. |
| Source link | A source ID, target type and target ID. The source and target must exist in the same project. The same source-to-target triple can occur only once. |
| Media and albums | Person and album references belong to the media record. Its optional place points to a project Place. A person's primary photo references project media. |
| Archive and Notes | An Archive file references its folder, document place and related project records. A note references its collections and related records. Both can point to derived event IDs, which are resolved after reconstruction. |
| Geneograph | Board collections are project references. A board diagram owns its assets, people, families, nodes and connections. Board-local IDs resolve within the diagram. References explicitly scoped to the project resolve against project collections. |

Display names, initials, timeline rows and UI counters are derived presentation. A link to a derived event ID is an authored relationship. Preserve that link and regenerate its target from the underlying person, family or fact identity.

## V1 backup boundary — proposed, not yet validated

The matrix is the intended candidate boundary for #332, subject to #330's completed canonical model and meaningful reference-closed round trips. Include media/Archive metadata and Geneograph boards **only if they remain coherent without excluded binaries**; otherwise exclude the affected subset and disclose omissions. The matrix is not evidence that backup or restore is available today.

| Include | Exclude |
| --- | --- |
| Project metadata, people and names, recorded facts and dates, families and memberships, places, research records and their references | Active selection, filters currently applied, scroll and viewport session state, generated counters and timeline rows |
| Album and archive metadata, citations, notes, board records and their content | Media binaries. Keep metadata and valid record IDs so references still resolve, and represent unavailable content explicitly. |
| References to records owned by the exported project | Activity, notifications and other session history |

The detached input collections are people, families, places, placeSavedFilters, placeIssues, media, albums, archiveFolders, archiveFiles, sources, sourceLinks, noteCollections, notes, boardCollections, boards, links and publishDrafts. Project metadata is passed separately. Missing collections are empty. Input containing events, activity or notifications is rejected. Saved filters are project records. Active filter controls and viewport state are session data.

### Media references without binaries

Keep project media, Archive file, and board asset metadata under their original record IDs in the serialized project. Preserve album membership, portrait IDs and crop, Archive evidence links, and board image references. A board-local asset ID remains scoped to its board. During restore, remap the IDs and their references together if the destination requires new IDs.

Exclude the bytes and session-specific locators that contain or expose them, including inline data URLs, object URLs, and preview URLs. A metadata record with unavailable content has no usable source locator. The restore flow must show an unavailable-media placeholder and must not fabricate a filename, reuse a destination project's file, or drop a valid relationship just because its bytes are absent. A missing metadata record is a dangling reference and fails validation.

The project backup contract is separate from the Geneograph board file contract. A standalone board export may embed its own images. A project backup retains board image objects and asset metadata while applying the project-wide binary exclusion.

An external parser must reject an unsupported format or version before constructing a draft. Allocate a new project ID, remap record IDs where required, and rewrite references with collection-scoped maps. Rebuild derived timeline entries before resolving references to them. Validate the complete draft before committing any of it. Cancel and validation errors leave the live project untouched.

The detached validator checks collection ownership, ID uniqueness, ancestry cycles, parentage, and references across research records, nested facts, and board-local records. Rebuild the timeline with the detached people, families, and places before validating references to derived events. Complete validation of record shapes and verify a full sample-project round trip before using this boundary for GEDCOM or backup restore.
