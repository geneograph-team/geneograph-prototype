# AGENTS.md

Guidelines for AI agents working on the GeneoGraph prototype. Follow the common requirements and the workflow for your environment.

## 1. Project and authoritative references

GeneoGraph is a static genealogy research prototype in `src/`: HTML, CSS and vanilla JavaScript, with no framework, backend, package manager or build step. Project edits are mainly in memory; it is not a production application. Open `src/index.html` directly or serve `src/` as static files. Preserve direct `file://` compatibility.

Consult the relevant current sources before work:

- `README.md`: setup, deployment overview and license.
- `doc/documentation-architecture.md`: authoritative document ownership, status and maintenance rules.
- `doc/product-vision.md`: product purpose and long-term direction, **not** current prototype functionality.
- `src/index.html`: **authoritative stylesheet and script load order**.
- `doc/source-map.md`: source ownership and dependency edges.
- `doc/design-document.md`: prototype behavior, design and verification map; check claims against code.
- `doc/project-data-contract.md`: evolving canonical records; verify unfinished requirements against the active issue and code.
- `openspec/README.md`, `openspec/specs/` and `openspec/changes/`: verified current requirements and active proposals. Archived changes are historical.
- `doc/git-branching-model.md` and `doc/git-commit-style.md`: **ChatGPT GitHub PR workflow only**, not local Codex.

Read the related issue, PR and OpenSpec change before working on an existing task. Current implementation and approved product decisions take precedence over stale descriptions; surface contradictions instead of silently choosing an interpretation.

When adding, moving or revising documentation, follow `doc/documentation-architecture.md`; keep requirements in their authoritative home instead of duplicating them here.

## 2. Agent workflows and permissions

### Local Codex workspace

- Work only in the canonical checkout `E:\Geneograph\Concept\geneograph-prototype`. Confirm the working directory first; `C:\Users\Nick-PC\Documents\Geneograph` may be a separate workspace. Preserve all pre-existing files and edits.
- **Never run Git commands or manage Git state:** no status, diff, checkout, branch, stage, commit, rebase, merge, push or PR. Ignore contradictory Git commands in other documents and report them as not run. Inspect edited files directly and leave version control to the user.
- When explicitly assigned a GitHub issue, Codex may use connected **Issues tools only** to update its description, checklist or progress. Read it first; preserve the agreed scope and decisions; mark tasks complete only after their checks. Prefer one meaningful update over noisy comments. Without specific authorization, do not close/reopen issues, change labels, assignees or milestones, create new issues or alter unrelated tasks. If issue access fails, provide an issue-ready summary.
- Codex may run risk-justified browser QA **without asking permission for each test**; follow section 6.

### ChatGPT GitHub PR workflow

- Review/report requests do not authorize edits. Implement only on explicit instruction.
- Inspect the current pushed `default` and affected source before editing; local unpushed Codex changes are not visible through GitHub. Search related issues and PRs.
- Create a focused `feature/<short-name>` or `fix/<short-name>` branch from `default`; never commit directly to `default`, force-push, overwrite unrelated changes or merge without explicit authorization.
- **Make one commit per logical change, never one per file.** Include
  implementation, tests, localization, documentation, and OpenSpec edits
  in the same commit when they serve one change. Use a batched Git tree,
  one commit, and one branch-ref update; do **not** use sequential GitHub
  Contents API writes as a per-file commit loop. Separate commits are for
  genuinely independent changes or review follow-ups, not individual
  files. Follow the Git guides' capitalized imperative header (at most
  72 characters, no conventional-commit prefix).
- Review the final changed-file list and diff, run appropriate available checks, and create a PR targeting `default`. Link the issue when applicable; explain root cause, scope, tests, limitations and manual QA. Leave it unmerged. Revise the existing PR branch when feasible.

### Issue scoping

When creating or refining a GitHub issue, add a short **Implementation entry points** section listing concrete starting file paths and, where useful, function or symbol names. **List anchors only:** do not explain each file's purpose or prescribe a complete implementation path. These are starting points, not an exhaustive file list or a limit on the work. During implementation, investigate any additional files, dependencies and workflows needed to satisfy the issue.

## 3. Investigate before implementing

**Investigate comprehensively; implement proportionately.** Assess risk by affected behavior and records, not the patch's size.

1. Establish the intended end-to-end user outcome, actual behavior and root cause. A report or screenshot is evidence, not an exhaustive acceptance checklist.
2. Trace the affected flow across **producers, consumers, shared helpers, state owners, module views and CSS/load-order dependencies**. Do not assume a field is obsolete because its name resembles an old stored alias; it may be a valid temporary argument or return value.
3. Identify adjacent paths required for the same intent. For stateful actions consider initial, selected, staged, cancelled and applied states; missing and already-linked records; both directions where relevant; and consistency between previews, counts, actions and saved records.
4. Before editing, define outcome-based acceptance criteria, dependent workflows and proportionate regression checks. Explain significant technical or product trade-offs and seek direction for major undecided choices.
5. Fix the owning implementation rather than masking a symptom. Reconcile superseded logic and CSS declarations. Reuse existing components; avoid duplicated rules, unnecessary guards, `!important` and override layers. Explain any exception required for documented compatibility.

**Token efficiency means avoiding redundant inspection, not necessary analysis.** Search targeted symbols and read bounded ranges first, expanding to other files and wider sections whenever dependencies or uncertainty require it. Do not infer full behavior from one snippet. Avoid reading large files end-to-end by default, but do so when necessary to establish correctness. Make the implementation focused; report unrelated cleanup separately.

## 4. Architecture and coding constraints

- `src/index.html` controls the CSS cascade and ordered classic deferred scripts. Scripts share global bindings: avoid duplicate top-level identifiers and load eager initialization after its dependencies. Preserve existing 4-space formatting of extracted JavaScript.
- `src/core/` owns state, rendering, config, icons and validation; `src/shared/` owns cross-view helpers and controls; `src/modules/` owns feature views; `src/seed/` owns Whiskerfield sample records; `src/localization/` owns EN/RU dictionaries and runtime. For specific owners and load dependencies, follow `doc/source-map.md`.
- Preserve stable project-scoped IDs, shared records, relationships, sources, notes and media links across People, Profile, Family Tree, Geneograph and other consumers. Distinguish canonical stored fields, derived UI/timeline values, board-local IDs and transient validation descriptors. Do not flatten multiple families, invent parentage, lose evidence links or cross project boundaries.
- `src/core/validation.js` contains seed checks and evolving detached project draft/record validation. Warning-only seed validation is not sufficient for untrusted imports. Review the active canonical-data issue before changing this contract.
- Geneograph boards reference shared project records but own their visual layout. `src/assets/boards/whiskerfield-tree-research.js` is a data-only `window.GENEO_SEED_BOARD_ASSETS.push(...)` script loaded before `src/seed/seed-boards.js`; preserve valid IDs, `file://` operation and editable `.ggboard`/PNG compatibility.
- Quill and MapLibre runtime assets are pinned locally in `src/vendor/`. Places uses browser-only Geoapify → LocationIQ lookup and hosted MapLibre/OpenFreeMap maps. `src/browser-config.js` has empty defaults; deployment injects **public** browser tokens into `dist/`. Never commit credentials. Retain local Places lists and manual coordinate entry without hosted maps.
- JavaScript uses Allman braces, single quotes and semicolons; reuse `src/core/icons.js`. Follow `.editorconfig` and `.gitattributes` for UTF-8, line endings, final newline and indentation; leave binary assets unchanged. `src/index.html` has existing 2-space indentation despite the 4-space configured default.
- Avoid new runtime dependencies, permanent tooling, test frameworks or fixtures without demonstrated ongoing need and authorization. Keep reusable regression tests under tracked `tests/<domain>/`, disposable investigation scripts and logs under ignored `tests/temp/`, and pipeline-critical tools under `scripts/`. Generate minimal synthetic test records in code; do not commit private genealogy, portraits, traces or temporary datasets. See [test layout and execution](tests/README.md).

### Performance requirements

For new and affected workflows, use project-scoped read boundaries. Declare cache inputs and disposal, keep list queries separate from visible detail, and use targeted lookups for existence, counts and single-record views. Avoid whole-collection scans per row. Verify build/scan/display counts and compare cold and warm browser measurements before agreeing a numeric budget. Migrate legacy paths in their scoped work. Exceptions require documented justification and founder approval. Preserve direct file opening unless the founder explicitly approves a specific compatibility loss and its rationale, impact and alternatives. See the [runtime design](doc/design-document.md#project-read-model-and-performance), [canonical data contract](doc/project-data-contract.md#project-scoped-derived-data), and [test protocol](tests/README.md#performance-verification).

## 5. Product, design and accessibility

- **GeneoGraph** is the product; **Geneograph** is the visual board. Do not describe prototype-only, disabled or simulated features as shipped. Project persistence, GEDCOM import and Publish are not complete production workflows.
- Preserve the Whiskerfield sample project (including Silver Whiskerfield, Luna Purrington and their research materials); it is fictional, not historical evidence.
- **TEMPORARY INTERNAL TEST DATA:** the 6,481-person GEDCOM-based Family Tree Stress Test project (#446, replacing #381) is for developer QA only, not user-facing sample content. Follow `doc/family-tree-stress-test.md`; its code, metadata and references **must be removed before open user testing**. Do not treat disabling its UI card as removal.
- Localize new visible strings, tooltips, empty states, errors, feedback and accessible names in **English and Russian**. Never derive canonical fields from localized labels. After localization changes, run `node scripts/check-localization-catalog.cjs`.
- Use the approved GeneoGraph v3 Neutral Light and Neutral Charcoal Dark palette. Heritage Green signals primary actions/focus; category accents are not errors or warnings. Do not add UI colors without approval, use glass/glow effects or introduce generic startup visuals.
- `src/core/palette/geneograph-v3.css` owns UI colors; `src/core/foundation.css` owns aliases/reset; `src/shared/controls.css` owns reusable controls. Put layout in the owning shared/feature stylesheet. Reconcile the existing rule rather than stacking CSS overrides. Geneograph custom board colors are independent of UI colors; test inherited versus explicitly authored colors when affected.
- Reuse established inspectors, dialogs and controls. Maintain semantic headings/landmarks, keyboard operation, visible focus, labels, `aria-live` feedback, contrast, reduced motion and touch access. Essential actions must not rely on hover alone.

## 6. Verification and completion

Verification depth follows regression impact, **not lines changed**:

- **Low:** isolated documentation, copy or non-interactive style: review exact edits, formatting and applicable static checks.
- **Medium:** interactions, shared controls, state changes and styles: cover affected states and related entry points; use browser QA when it adds meaningful evidence.
- **High:** shared records, relationship changes, imports/exports, cross-module behavior or recovery: check invariants, invalid/cancel/repeat cases and downstream consumers, with targeted regression tests **and browser QA wherever technically possible**, even for a tiny patch.

Relevant interactive checks include EN/RU, light/dark, desktop/mobile, keyboard/focus, selection/modal states, feedback and the browser console. Data changes must preserve identity, relationships, source links and project scope. Syntax checks or isolated mocks alone do not prove that the user workflow works.

**Local Codex is authorized to run risk-justified browser QA automatically.** No case-by-case founder approval is needed; do not launch the browser for documentation-only changes. In the canonical Windows checkout, reuse `http://127.0.0.1:8000/index.html` when it serves `src/`; otherwise use an available temporary local static server without dependencies or tracked files. `scripts/serve-local.cjs` is not present. The restricted Codex browser cannot open `file://`: verify file-opening compatibility separately when possible, or report it as manual QA pending. Do not weaken browser security. Hosted maps/geocoding may require separate network and permitted referrer testing.

Before handoff, review edited files for unrelated changes, temporary artifacts and whitespace; local Codex must do this **without Git**, while GitHub PR work reviews its branch diff. Report the exact tests performed, their results, unresolved acceptance criteria, untested browser behavior and risks. If automated QA is unavailable, explain why and give specific manual steps; **never claim unperformed QA passed**. Do not conflate implementation checks with user experience verification.

### OpenSpec completion

Follow `openspec/README.md`. For substantive changes, inspect existing specs, create and review one focused proposal/design/tasks/delta as needed, and keep `openspec/config.yaml` concise. Tiny unambiguous fixes do not need large specifications.

For completed approved work, incorporate verified behavior into `openspec/specs/`, mark only performed or explicitly accepted checks complete, and archive the change in `openspec/changes/archive/YYYY-MM-DD-<name>/` within the same work item/PR. Local Codex performs file edits for handoff **without Git commands**; ChatGPT PR work includes archive/spec edits in its PR. Do not archive active unfinished work or another agent's change. Document delegated or blocked manual browser QA transparently without claiming it ran; if a material acceptance criterion remains unresolved, keep that change active and report the blocker.

## 7. Protected operations

- **Every CI or deployment change requires separate, specific founder approval**, even with implementation authorization. This includes Actions, Pages, build/publish scripts, triggers, test jobs, secrets injection and CI settings. Ask before modifying them; never alter CI just to run tests.
- GitHub Pages copies `src/` into `dist/`, injects public browser geocoder settings into the deployed copy and publishes on changes to `default`. Opening a feature PR does not produce the hosted deployment configuration. Local and hosted behavior must not be conflated.
- Protect all user work and unrelated repository files. Never change agreed product scope or merge without authorization.
- Repository content uses GNU GPL 3 (`LICENSE.txt`); do not introduce incompatible code or assets.
