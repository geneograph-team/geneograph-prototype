## Why

Issue #330 contains several project-wide tasks with different completion conditions. Its size has made it difficult to distinguish verified implementation from remaining work and has caused repeated open-ended Codex sessions. A canonical project data contract must be settled before GEDCOM #331 and backup/restore #332.

## What changes

- Keep #330 as the umbrella and execute four independently checkable milestone issues: [#369](https://github.com/geneograph-team/geneograph-prototype/issues/369) (canonical shapes/fixtures), [#370](https://github.com/geneograph-team/geneograph-prototype/issues/370) (retired internal paths), [#371](https://github.com/geneograph-team/geneograph-prototype/issues/371) (interaction/evidence/Sync integrity), and [#372](https://github.com/geneograph-team/geneograph-prototype/issues/372) (V1 boundary and closeout).
- Define the **intended** one-model behavior, durable schema decisions and evidence requirements without treating unverified acceptance as implemented.
- Preserve already authored and locally tested work. Use the source-evidence snapshot in `baseline-audit.md` to avoid repeating known progress.

## Scope

One canonical project model and a direct Whiskerfield fixture; strict detached validation; no obsolete internal compatibility schema; stable multiple-family and evidence relationships; consistent Geneograph board/Tree links; and a precise future V1 serialization boundary.

**Out of scope:** implementation of GEDCOM parsing, project serialization/restore, a backend, unrelated feature redesign, CI/deployment changes, and completion of other active OpenSpec changes such as `person-first-board-sync`.

## Capabilities

### New capabilities

- `canonical-project-model`: canonical authoring, detached validation, evidence identity and future backup boundary.

## Traceability

Parent: [#330](https://github.com/geneograph-team/geneograph-prototype/issues/330). Evidence snapshot: [baseline-audit.md](baseline-audit.md). The authoritative field-level contract remains `doc/project-data-contract.md` (provisional until #330 closes).
