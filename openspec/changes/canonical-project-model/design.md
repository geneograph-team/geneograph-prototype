## Design

### Single source of truth

Project metadata and `PROJECT_OWNED_COLLECTIONS` are authoritative records. One directly authored Whiskerfield sample supplies test data. A project `family` is a distinct record: preserve separate unions of the same partners, one-parent families, multiple families for a child and per-parent parentage types. Preserve project IDs, record IDs and board-local IDs in their respective scopes.

Timeline events, display labels and counters are computed. Authored Source/Archive/Notes references to computed events remain durable references to the originating person/family fact identity. Seed startup and derived rebuilding must not silently prune valid authored evidence.

### Strict detached draft boundary

`prepareProjectDraft(project, records)` checks JSON-compatible values, allowed collections, required and optional field shapes, ownership, nested IDs, project- and board-local references, and invalid relationship/board structures. It reconstructs derived events on the detached copy, validates the complete reference closure, and either reports owning-path diagnostics or returns a safe draft without mutating the live project. Warnings emitted by seed validation are not a substitute.

### No internal legacy compatibility

Retire obsolete *persisted* old/new aliases, duplicate representations, conversion paths and sample-time repairs after checking their writers and consumers. Do not conflate these with legitimate transient UI descriptors (notably `connectionPairForRelationship().personAId/personBId`), display-only formatting, meaningful historical genealogy event semantics or explicit **external** `.ggboard` import handling. Uncertain candidates require evidence, not blind deletion.

### Cross-module transaction and verification

Treat People/Profile, Family Tree, Geneograph, Archive, Notes, Albums and Places as consumers of shared project identity. Tests must check family/membership isolation, event references, partial media, affected-module edits, board/Tree Sync selection, preview nonmutation, apply, undo and rollback. Prefer focused unit/contract checks, then browser verification for affected interactive paths. Record local-reported, observed-automated, observed-browser and unrun states separately.

### V1 future backup boundary

Use the collection inventory and exclusions in `doc/project-data-contract.md` as the proposed V1 boundary. Keep metadata for unavailable photos, Archive files and board assets; exclude binary contents and session URLs. Project/record/board-local ID remapping must rewrite *all structured references*, including derived event IDs, before full detached validation and atomic commit. These are requirements for #332, **not** an assertion that restore exists. Unsupported backup versions must fail before draft construction.

### Execution and closeout

Execute one bounded issue at a time. A completed small code change does not complete the milestone; completion requires the issue's stated behavior and check evidence. Stop on completed acceptance or a concrete approval/environment blocker; report remaining work rather than chasing unrelated cleanup. Codex uses the canonical local checkout and no Git commands. #372 consolidates the verified final contract and OpenSpec baseline; archive this change only when substantive acceptance is actually complete.
