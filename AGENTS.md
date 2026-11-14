# AGENTS.md

Guidelines for AI agents working on the GeneoGraph prototype repository.

The canonical local checkout is `E:\Geneograph\Concept\geneograph-prototype`. Open that folder as the workspace before changing code; `C:\Users\Nick-PC\Documents\Geneograph` may be a separate Codex workspace and is not this repository.

## Project Overview

GeneoGraph prototype is a static single-page interactive concept of the GeneoGraph genealogy research workspace. It is the target of the landing site's "Try Demo" CTA. It has no build tooling, no package manager and no framework: plain HTML, CSS and vanilla JavaScript served as static files. Third-party libraries include Quill 2.0.3 (rich text) and MapLibre GL JS 6.16.0 (hosted Places map). MapLibre CSS loads from a pinned CDN and the ES module is imported lazily only on HTTP(S); file:// keeps non-map Places workflows.

The original monolithic `index.html` has been split: the application now lives in `src/` as `index.html` plus external stylesheets and classic deferred scripts (see Current Architecture below).

## Current Architecture

- `src/index.html` contains CDN references, ordered stylesheets, the application shell, and classic deferred scripts; `src/core/runtime-config.js` owns runtime map configuration. **Stylesheet and script order is load-order significant — inspect the current file before editing it.**
- All scripts are classic (non-module) scripts sharing one global scope: top-level `const`/`let`/`function` declarations in one file are visible to all later files, so top-level identifiers must be unique across files.
- Extracted JS files retain the original 4-space indentation of the former inline script block (code starts at column 4); match it when editing those files.
- Key modules:
  - `core/icons.js` — the `icon` dictionary of inline SVG strings.
  - `src/core/runtime-config.js` — the active module list and basemap configuration; browser geocoder configuration is in `src/browser-config.js` (empty tracked defaults) and `src/core/geocoder-adapter.js` (Geoapify → LocationIQ). The Pages workflow overwrites only `dist/browser-config.js` from restricted GitHub Actions secrets; never commit provider tokens. Places loads `src/modules/places/map-adapter.js` before `map-runtime.js` and `map-and-route.js`.
  - `src/localization/` — ordered UI/data dictionaries and catalog; `localization/runtime.js` — language runtime (`en`, `ru`) and storage keys.
  - `seed/sample-data.js` — the central `sampleData` object (Whiskerfield sample project).
  - `seed/seed-genealogy.js`, `seed/seed-boards.js` — load-time mutations of `sampleData`; the Geneograph seed payload lives in `src/assets/boards/whiskerfield-tree-research.js`.
  - `core/validation.js` — `validateSampleData()` sanity checks.
  - `core/state-tree-core.js` — the central `state` object.
  - `core/app-shell.js` — `render()`, the central module dispatcher.
  - `src/modules/` — Projects, Family Tree, People, Geneograph, Albums, Archive, Notes, Places, and disabled Publish rendering, editors, and styles.
  - `src/shared/` — cross-view media, relationships, date/place fields, pickers, and actions.
  - Archive helpers and seed normalization load in the explicit order shown in `src/index.html`; Notes seed/model and shared Archive tagging pickers follow before bootstrap.
  - `src/modules/geneograph/` — ordered board model, library, canvas, inspector, pickers, interaction, import/export, and split styles.
  - `core/bootstrap.js` — global keyboard handling (Escape) and the initial `render()` call.
- Stylesheets: `src/core/palette/geneograph-v3.css` owns approved UI colors; `src/core/foundation.css` defines semantic compatibility aliases and resets; `src/shared/controls.css` owns reusable control appearance and loads immediately after foundation. Feature and other shared styles follow in the order shown in `src/index.html`. Check the cascade before changing selectors.
- Static media live in `src/assets/photos/`, `documents/`, `covers/`, `ui/`, and `boards/`.

## Root-Cause-First Changes

- **Fix the cause, not the visible symptom.** Before editing, trace the defect to the owning implementation, shared component, state flow or CSS cascade. Confirm why the existing behavior differs from what is intended.
- Correct or consolidate the responsible code and remove superseded declarations. Reuse existing shared rules and components; **do not stack overrides, duplicate logic/selectors, use `!important`, or add workaround scripts/guards just to conceal the underlying problem**.
- Only use a workaround when a direct fix would violate a documented compatibility requirement. Explain that constraint and the tradeoff in the work summary; keep exceptions small and explicit.

## Codex Local Workspace Workflow

Codex working in this local checkout must not run Git commands, create or switch branches, stage files, commit, rebase, merge, push, or create pull requests. Work directly in the canonical checkout and leave all changes for the user to review and manage. Preserve existing files and changes; inspect relevant file contents before editing. Use targeted syntax, OpenSpec, and behavior checks rather than Git-based checks. If an instruction elsewhere calls for `git status`, `git diff --check`, or another Git operation, skip that operation and report it as not run.

The Git process in `doc/git-branching-model.md` and `doc/git-commit-style.md` applies to the ChatGPT chat GitHub PR workflow below, not to Codex local workspace work.

## ChatGPT GitHub Pull Request Workflow

These rules apply only when the ChatGPT chat version works through the connected GitHub repository to make a PR. They do not instruct Codex in this local checkout to use Git. For that separate PR workflow, branch naming, commit messages, and merging follow `doc/git-branching-model.md` and `doc/git-commit-style.md`.

- Treat the current pushed GitHub branch as the source for remote edits; check the repository's default branch and current file content before changing anything. Local uncommitted or unpushed changes are not available through the GitHub connection.
- Respect the user's requested stage: for **review/audit/report only**, do not write code; an explicit **implement/fix/create a patch or PR** request authorizes implementation. Otherwise, present findings and wait for approval before writing.
- For an authorized GitHub change, create a **new, descriptively named branch from the current default branch** for that focused issue. Never commit directly to the default branch, force-push, or overwrite unrelated work.
- Keep edits minimal and consistent with the repository's code, styling, localization, and file-format rules. Fetch the latest affected files and their SHAs; if a branch has diverged or changes conflict, inspect and resolve safely rather than silently replacing someone else's work.
- Verify the proposed change with appropriate available checks (syntax, targeted tests, diff/whitespace, and behavior where testable). Distinguish automated checks from browser/manual QA and explicitly disclose anything not tested.
- Commit only the intended files to the feature branch, then open a pull request targeting the repository's default branch. The PR description must include the problem/root cause, changes made, affected scope, checks performed, remaining risks, and any manual verification steps.
- Return the PR link and a concise summary to the user. Leave the PR **unmerged** for their review; do not merge, close, or change the default branch unless the user explicitly instructs it.
- When the user requests a revision to an open PR, update its existing feature branch when feasible instead of creating duplicate PRs. Use downloadable patches only when requested or when direct GitHub changes are unavailable.

## Protected Deployment and Lightweight Verification

These rules apply to all agents, including local and GitHub-connected work.

- **Explicit approval gate:** Never modify deployment or CI infrastructure without the founder's explicit approval for that specific change. This includes GitHub Actions workflows, Pages configuration, publishing triggers, build/deployment scripts, secret injection, test jobs, and CI settings. An implementation request does not implicitly approve such changes, even when they seem beneficial.
- If a task appears to require an infrastructure change, explain why, identify the smallest safe alternative, and request approval **before** modifying it. Do not add or adjust CI merely to run a feature's tests.
- Keep the prototype lightweight: prefer existing tooling, targeted static checks, and proportionate manual/browser QA. Do not add testing frameworks, dependencies, helper scripts, configuration, or permanent fixtures without a specific ongoing need.
- Temporary investigation scripts, generated artifacts, debug logging, and one-off browser harnesses should normally stay outside the repository; remove task-created disposable files when no longer needed.
- Retain concise, valuable regression coverage for repeated failures and high-risk behavior (especially record relationships, data integrity, board import/export, and recovery). Evaluate maintenance cost and reuse existing checks first. **Never remove existing useful tests solely to tidy the repository or make CI pass.**
- Before completing a local change, review the edited files for unrelated edits or leftover artifacts without using Git. Remove only task-created disposable files; preserve user work. Record exactly which automated and manual checks ran, which did not, and any residual risk. For ChatGPT chat PR work, also inspect the PR's changed-file list and diff.
- Keep repository maintenance and cleanup separate from functional changes unless the cleanup is directly required for the approved task.

## OpenSpec Handoff

OpenSpec is initialized in this repository with Codex integration. Keep `openspec/config.yaml` concise: project-wide facts and workflow rules only. Keep verified current behavior in `openspec/specs/` and one change's proposal, design, tasks, and delta specs in `openspec/changes/`. Do not copy this document or the full design guide into every change.

For substantive changes, inspect current behavior, create and validate one focused OpenSpec change, review its proposal before implementation, complete and test its tasks, then archive it after verification. Small, unambiguous fixes need not generate a large specification. Existing working-tree changes belong to the user; never discard them during setup.

`doc/design-document.md` is the current product and engineering guide, not a backlog or an OpenSpec change. Verify its claims against code before promoting them to durable specs. For Geneograph sample-board work, `src/seed/seed-boards.js` validates and installs the data-only asset in `src/assets/boards/`. The checked-in seed asset is a data-only `window.GENEO_SEED_BOARD_ASSETS.push(...)` script. Keep its board and project IDs valid and preserve direct `file://` loading when replacing it; no conversion tool is currently checked in.

## Critical File-Handling Rule

Several extracted files are still very large. **Never read them end-to-end.**

- Some JS files remain large. Locate the relevant symbol with `rg` and read only its bounded section.
- CSS is split by owning component or workflow. Locate selectors with `rg` and inspect the actual cascade in `src/index.html`.
- Use targeted `rg` searches (selectors, ids, class names, function names, `aria-` attributes) to locate the section you need.
- Read only the relevant line ranges.
- When editing, prefer narrow, surgical patches anchored on unique strings.

## Token-Efficient Workflow

- Inspect only files relevant to the requested change. Avoid repository-wide scans unless targeted searches fail or cross-cutting behavior requires one.
- Prefer targeted `rg` searches and bounded file ranges. Do not reread or repeat file contents already inspected.
- Make surgical patches at the responsible layer; avoid unrelated refactors.
- Keep verification proportional to risk. For small, isolated changes, run focused static checks such as JavaScript syntax and a direct whitespace review of edited files; do not start a browser or run browser tests. Add automated tests only when they meaningfully cover a regression. Codex does not run `git diff --check`.
- For substantial changes that need visual or interaction verification, ask the user to perform or authorize a focused browser check. State the exact workflow and states to inspect, and report browser QA as pending until it is actually completed. Do not infer a pass from static checks.
- Stop when the acceptance criteria are met. Keep explanations concise and omit large diffs from final responses.

## Repository Structure

- `src/` — the entire application (see Current Architecture).
- `doc/` — design guide, source map, and normative git workflow documents (`git-branching-model.md`, `git-commit-style.md`).
- `openspec/` — verified specs and focused change folders.
- `.github/` — issue and pull request templates.
- `.markdownlint.yaml`, `.markdownlint-cli2.yaml` — Markdown lint settings.
- `LICENSE.txt` — GNU GPL 3.
- `README.md` — setup instructions and source map.

## Coding Conventions

- No build step; Quill and MapLibre CSS load from pinned CDNs, while MapLibre's ES module is imported lazily for hosted Places maps. Local browser libraries live in `src/vendor/`. Do not add new runtime dependencies without asking.
- JavaScript: Allman-style braces (opening brace on its own line), single quotes for strings, semicolons never omitted. Icons are inline SVG strings in the `icon` dictionary (`src/core/icons.js`) — reuse them rather than duplicating markup.
- CSS: approved v3 light/dark UI colors live only in `src/core/palette/geneograph-v3.css`; components use semantic roles or aliases, never new literal UI colors. After palette edits, check JSON/CSS role parity, literals, and contrast with available tools and targeted browser QA; do not assume a standalone UI-color checker is present. Add a new color to the library only after user approval. Theme preference is System initially, with Dark and Light choices in Global settings. Branded heroes use the pale Light and deep Dark Heritage Green container/on-container pair.
- HTML: semantic elements (`section`, `figure`, `article`, `nav`), `aria-*` attributes, `role="status"`/`aria-live` for the toast. Explicit `width`/`height` on images, `loading="lazy"`/`decoding="async"` for non-critical images.

## Content and Design Rules

- Capitalization: the product is **GeneoGraph**; the visual board/workspace is **Geneograph**.
- This is an interactive prototype/concept. Never present planned capabilities as shipped; distinguish prototype behavior from product direction.
- Use the Whiskerfield sample project (Silver Whiskerfield, Luna Purrington, the Meowbridge marriage record) consistently. This is sample data, not historical records.
- Use the approved v3 Neutral Charcoal Dark and Warm Neutral Light palette. Primary actions and focus use Heritage Green; category accents identify content, while status colors represent state. Do not use an archive gold as a warning or a death event as an error.
- No glass/glow effects, floating decorative cards, or generic startup motifs.

## CSS Ownership

- Edit declarations in their owning feature or shared stylesheet. Merge superseded rules; do not append competing overrides or use `!important` merely to avoid reconciling an existing rule.
- Test new styles in both resolved themes. Theme-specific exceptions belong beside the owning rule; prefer a semantic token when the same role recurs. Geneograph board colors are separate from UI colors: inherited colors follow the resolved theme, while explicitly chosen colors remain fixed.
- Put approved UI colors in `src/core/palette/geneograph-v3.css`, semantic compatibility aliases and resets in `src/core/foundation.css`; put reusable button, icon-button, field, select, checkbox, label, and focus appearance in `src/shared/controls.css`. Use existing opt-in classes (`.button`, `.text-action`, `.panel-action`, `.control-icon-button`, `.field`, `.select`, `.common-select`, `.compact-select`, `.checkbox-row`) where applicable. Feature styles own layout, dimensions, and named exceptions such as Living status. Reconcile shared rules directly instead of adding module overrides. Shared resource-picker layout belongs in `src/shared/resource-picker.css`. Preserve the CSS tag order.
- For substantial shared or responsive style changes, include English/Russian, desktop/phone widths, focus, and relevant modal states in the requested browser QA. Use focused static checks for small style edits.

## Accessibility Requirements

Maintain on every change:

- Keyboard focus styles and operable controls.
- Semantic heading hierarchy and landmarks (topbar/sidebar/main).
- `aria-live` regions for dynamic feedback (toast).
- Legible contrast; secondary text must stay readable.
- Reduced-motion support where present.

## File Format Rules (from `.gitattributes` / `.editorconfig`)

- Encoding is UTF-8 for all text files; always end files with a final newline.
- Line endings and indentation by file type:
  - CRLF: `.txt`, `.md` (2-space indent), `.editorconfig`.
  - LF: `.html` (4-space per `.editorconfig`; the existing `src/index.html` currently uses 2-space indentation), `.css` (4-space indent), `.js` (4-space indent), `.json` (4-space indent), `.gitattributes`/`.gitignore` (tab indent), `.yml` (2-space, as in `.github/` templates).
- `.png`, `.webp`, `.jpg`, `.jpeg`, `.ico`, `.svg` are binary — never normalize them as text.

## Deployment

- The site is static: open `src/index.html` directly or serve `src/` as static files; no build step is required.
- The current GitHub Pages workflow copies `src/` into a generated `dist/`, injects deployment-only browser geocoder configuration, and publishes `dist/` after relevant pushes to `default`. Feature-branch PRs do not deploy this artifact; verify hosted behavior separately.
- Preserve direct `file://` compatibility in source paths and load order. The interactive Places map requires HTTP(S), but list/editor/manual-coordinate workflows must remain usable via file://. Codex browser security blocks local `file://` navigation, so use the localhost procedure below for browser QA. Do not change browser security settings.

## Browser QA on this Windows host

Use browser QA only for substantial changes after asking the user. The prototype has no required development server or build step. Do not start a server or open a browser for small changes.

1. Set the shell working directory to `E:\Geneograph\Concept\geneograph-prototype` and confirm `Get-Location` resolves there. Inspect only task-relevant files before editing; do not run Git status.
2. If browser QA is agreed, check `http://127.0.0.1:8000/index.html` and reuse an existing server when it returns HTTP 200. `scripts/serve-local.cjs` is not present in this checkout; do not follow older instructions that reference it. If no server is available, tell the user and agree on how to serve `src/` before browser testing.
3. Open the agreed localhost URL in the Codex browser only when the user authorizes agent-run QA. Check the affected workflow and relevant language, viewport, focus, and modal states; inspect console errors and failed resources. Report the exact browser or server error if access fails—never assume visual QA passed.
4. Use `file://` only for a separate manual compatibility check when available outside the restricted Codex browser. Do not add fetch-based runtime dependencies or change relative paths merely because localhost allows them.

## License

Repository contents are licensed under GNU GPL 3 (see `LICENSE.txt`). Do not add code with incompatible licenses.
