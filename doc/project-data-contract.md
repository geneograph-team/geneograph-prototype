# Project data contract

A project owns the records listed by PROJECT_OWNED_COLLECTIONS in src/core/validation.js. Record IDs are stable within each collection. projectId identifies the owning project. References must resolve within that project. A board-local person ID is scoped to its board and is distinct from a Family Tree person ID.

A Family Tree family is identified by its own ID. partnerAId and partnerBId identify its members, with an empty slot for a one-parent family. childIds records memberships. parentChildTypes records the type of each parent-child link. Partner role hints support display and placement. A pair of partners can belong to more than one family record. A child can belong to several families, and neither case implies that records should be merged. Family events carry relationship dates and places. Timeline rows display recorded events and facts.

## V1 backup boundary

| Include | Exclude |
| --- | --- |
| Project metadata, people and names, recorded facts and dates, families and memberships, places, research records and their references | Active selection, filters currently applied, scroll and viewport session state, generated counters and timeline rows |
| Album and archive metadata, citations, notes, board records and their content | Media binaries. Keep metadata and valid record IDs so references still resolve, and represent unavailable content explicitly. |
| References to records owned by the exported project | Activity, notifications and other session history |

An external parser must reject an unsupported format or version before constructing a draft. Allocate a new project ID, remap record IDs where required, and rewrite references with collection-scoped maps. Rebuild derived timeline entries before resolving references to them. Validate the complete draft before committing any of it. Cancel and validation errors leave the live project untouched.

The detached validator checks collection ownership, ID uniqueness, ancestry cycles, parentage, and references across research records, nested facts, and board-local records. Rebuild the timeline with the detached people, families, and places before validating references to derived events. Complete validation of record shapes and verify a full sample-project round trip before using this boundary for GEDCOM or backup restore.
