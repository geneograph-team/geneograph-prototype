# Documentation architecture

**Scope:** Current GeneoGraph prototype repository documentation and its maintenance. This document governs where information belongs; it does not make proposed product capabilities implemented.

## Principles

1. **One authoritative home per topic.** Link to the owning document rather than restating detailed requirements. Keep the README navigational and AGENTS.md focused on agent behavior.
2. **Distinguish intent from implementation.** A product ambition, approved change, current feature and historical decision are different kinds of evidence. Never describe planned behavior as working code.
3. **Document the current truth.** Confirm technical claims against the relevant source and checks. Treat approved product decisions as requirements to implement, even when current code does not yet comply; report the discrepancy.
4. **Update alongside the change.** Change affected documentation in the same focused PR or local handoff. Do not rewrite unrelated docs, fabricate test results or create a second issue backlog.
5. **Keep documents durable and concise.** Prefer stable principles and contracts over one-off debugging narratives, repeated instructions, transient test results or time-sensitive external-service details.

## Ownership map

| Document | Owns | Does not own |
| --- | --- | --- |
| `README.md` | Repository introduction, basic run instructions and navigation to documentation | Detailed requirements or implementation history |
| `AGENTS.md` | Agent permissions, investigation, implementation, verification and protected operations | Product roadmap, exhaustive feature descriptions or duplicated specifications |
| `tests/README.md` | Test organization, reusable local checks, execution and disposable-test conventions | Feature requirements or historical test results |
| `doc/product-vision.md` | Product purpose, audience, principles and long-term possibilities | Claims that the prototype already ships every described capability |
| `doc/design-document.md` | Current prototype overview, shared UX conventions, interaction principles and high-level capability boundaries | Authoritative field-level data schema, repeated agent policies or issue-by-issue implementation history |
| `doc/source-map.md` | Code ownership, dependency boundaries and non-obvious load-order constraints | Historical QA snapshots or feature acceptance checklists |
| `doc/project-data-contract.md` | Canonical project-owned records, IDs, references, derived data and serialization boundaries | UI layout requirements; unverified schema completeness |
| `openspec/specs/<capability>/spec.md` | Verified current capability behavior | Aspirational features or unresolved changes |
| `openspec/changes/<name>/` | One active proposal, design, tasks and spec deltas as needed | Permanent duplicate specifications or general issue tracking |
| `openspec/changes/archive/` | Historical completed change artifacts, which may be superseded | Current feature authority |
| `openspec/README.md` and `openspec/config.yaml` | OpenSpec organization and concise integration context | Copies of AGENTS.md or the design guide |
| `doc/browser-geocoder-setup.md` and other focused service guides | Operational setup, provider restrictions, troubleshooting and service-specific verification | General product design or duplicate provider code documentation |
| `doc/git-branching-model.md`, `doc/git-commit-style.md` | GitHub chat PR branching, commits and review convention | Permission for local Codex to run Git |
| `.github/` templates | Intake prompts and PR review checklist | Long-lived behavior requirements |
| `.editorconfig`, `.gitattributes`, source files | Format rules and actual executable behavior, respectively | Product decisions or vision |

Component-local documentation, such as `src/core/palette/README.md`, may explain its own implementation details; link to it from a higher-level guide when useful, rather than copying it.

## Status and source-of-truth rules

- **Product direction:** `doc/product-vision.md` describes desired future experiences and principles. It does not establish a feature as currently implemented.
- **Approved work in progress:** GitHub issues capture scope, decisions and acceptance criteria; focused active OpenSpec changes capture proposed behavioral deltas. They do not become current specs until verified.
- **Implemented behavior:** Source code is evidence of what actually runs; `openspec/specs/` records verified current capability requirements. When the two disagree, investigate and report the discrepancy rather than silently declaring either correct.
- **Domain contracts:** `doc/project-data-contract.md` defines intended data invariants. Clearly label incomplete or provisional validation (notably ongoing project-data cleanup) until verified.
- **History:** Archived OpenSpec changes, resolved issues and old verification notes explain past decisions but do not override current approved requirements or code.

If two current documents conflict, find the authoritative owner in the table, check the relevant code and approved issue, then reconcile or flag the conflict. Do not copy contradictory text into a third location.

## When documentation must change

| Change | Update |
| --- | --- |
| A feature's observable behavior or acceptance criteria change | Associated issue/active OpenSpec change; consolidate verified final behavior into `openspec/specs/` at completion |
| General UX patterns or product-level interaction principles change | `doc/design-document.md` and affected feature specs |
| Canonical record fields, IDs, relationships, import/export boundaries change | `doc/project-data-contract.md` and affected specs; mark any incomplete validation |
| Source locations, module owners or essential load order change | `doc/source-map.md`; `README.md` only when its orientation becomes incorrect |
| Agent permissions, QA policy or protected workflow changes | `AGENTS.md`; repair directly conflicting references elsewhere |
| A long-term product decision is approved | `doc/product-vision.md` if it changes durable direction; track near-term implementation separately in issues |
| External provider setup, restrictions or release checks change | Relevant operational guide; verify volatile external claims against current provider material |
| Files are moved or renamed | Update links and path mentions in affected maintained docs, including `README.md` and `openspec/config.yaml` |
| Work is finished and requirements are verified | Follow `openspec/README.md` closeout; do not claim unperformed browser QA passed or archive unresolved material work |

## Maintenance checklist

1. **Locate the owner.** Search existing documents and current issues before creating a new file. Use a new focused guide only when an existing owner cannot hold the information clearly.
2. **Establish status.** Separate verified current behavior, proposed work, long-term vision and history. State known limits; don't promote unfinished prototype functionality into production claims.
3. **Make the smallest complete update.** Change the authoritative document, affected references and necessary cross-links; remove stale duplication rather than stacking exceptions.
4. **Verify claims and links.** Check relevant code, approved decisions, paths, Markdown structure, formatting and exact checks performed. For documentation-only work, browser QA is normally unnecessary.
5. **Report and preserve traceability.** Summarize what changed and what remains provisional in the issue/PR. Keep historical artifacts intact. Changes to CI/deployment still require separate explicit founder approval.

This policy is intentionally small: it does not require new tooling, review ceremonies, extra metadata on every file or a duplicate set of specs.
