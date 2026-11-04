# AGENTS.md

Guidelines for AI agents working on the GeneoGraph prototype repository.

The canonical local checkout is `E:\Geneograph\Concept\geneograph-prototype`. Open that folder as the workspace before changing code; `C:\Users\Nick-PC\Documents\Geneograph` may be a separate Codex workspace and is not this repository.

## Project Overview

GeneoGraph prototype is a static single-page interactive concept of the GeneoGraph genealogy research workspace. It is the target of the landing site's "Try Demo" CTA. It has no build tooling, no package manager and no framework: plain HTML, CSS and vanilla JavaScript served as static files. Third-party libraries load from CDNs: Leaflet 1.9.4 (maps) and Quill 2.0.3 (rich text), with SRI `integrity` hashes where provided.

The original monolithic `index.html` has been split: the application now lives in `src/` as `index.html` plus external stylesheets and classic deferred scripts (see Current Architecture below).

## Current Architecture

- `src/index.html` contains CDN references, ordered stylesheets, the application shell, runtime map configuration, and classic deferred scripts. **Stylesheet and script order is load-order significant — inspect the current file before editing it.**
- All scripts are classic (non-module) scripts sharing one global scope: top-level `const`/`let`/`function` declarations in one file are visible to all later files, so top-level identifiers must be unique across files.
- Extracted JS files retain the original 4-space indentation of the former inline script block (code starts at column 4); match it when editing those files.
- Key modules:
  - `core/icons.js` — the `icon` dictionary of inline SVG strings.
  - `src/core/runtime-config.js` — the active module list and map configuration; Places map runtime lives in `src/modules/places/map-runtime.js`.
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
- Stylesheets: `src/core/foundation.css` defines base tokens and resets; `src/shared/controls.css` owns reusable control appearance and loads immediately after foundation. Feature and other shared styles follow in the order shown in `src/index.html`. Check the cascade before changing selectors.
- Static media live in `src/assets/photos/`, `documents/`, `covers/`, `ui/`, and `boards/`.

## OpenSpec Handoff

OpenSpec is initialized in this repository with Codex integration. Keep `openspec/config.yaml` concise: project-wide facts and workflow rules only. Keep verified current behavior in `openspec/specs/` and one change's proposal, design, tasks, and delta specs in `openspec/changes/`. Do not copy this document or the full design guide into every change.

For substantive changes, inspect current behavior, create and validate one focused OpenSpec change, review its proposal before implementation, complete and test its tasks, then archive it after verification. Small, unambiguous fixes need not generate a large specification. Existing working-tree changes belong to the user; never discard them during setup.

`Prototype_Design_Document.md` is the current product and engineering guide, not a backlog or an OpenSpec change. Verify its claims against code before promoting them to durable specs. For Geneograph sample-board work, `src/seed/seed-boards.js` validates and installs the data-only asset in `src/assets/boards/`. The checked-in seed asset is a data-only `window.GENEO_SEED_BOARD_ASSETS.push(...)` script. Keep its board and project IDs valid and preserve direct `file://` loading when replacing it; no conversion tool is currently checked in.

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
- Keep verification proportional to risk. For small, isolated changes, run focused static checks such as JavaScript syntax and `git diff --check`; do not start a browser or run browser tests. Add automated tests only when they meaningfully cover a regression.
- For substantial changes that need visual or interaction verification, ask the user to perform or authorize a focused browser check. State the exact workflow and states to inspect, and report browser QA as pending until it is actually completed. Do not infer a pass from static checks.
- Stop when the acceptance criteria are met. Keep explanations concise and omit large diffs from final responses.

## Repository Structure

- `src/` — the entire application (see Current Architecture).
- `.github/` — issue and pull request templates.
- `.markdownlint.yaml`, `.markdownlint-cli2.yaml` — Markdown lint settings.
- `LICENSE.txt` — GNU GPL 3.
- `README.md` — setup instructions and source map.

## Coding Conventions

- No build step; Leaflet and Quill load from pinned CDNs, and local browser libraries live in `src/vendor/`. Do not add new runtime dependencies without asking.
- JavaScript: Allman-style braces (opening brace on its own line), single quotes for strings, semicolons never omitted. Icons are inline SVG strings in the `icon` dictionary (`src/core/icons.js`) — reuse them rather than duplicating markup.
- CSS: design tokens are custom properties in `:root` (surface ramps `--surface-*`, brand greens `--brand-green-*`, text `--text-*`, borders, spacing `--space-*`, radii, `--shadow-soft`, `--ease`, scrollbar colors). Reuse tokens instead of hard-coded values. Dark theme via `color-scheme: dark`.
- HTML: semantic elements (`section`, `figure`, `article`, `nav`), `aria-*` attributes, `role="status"`/`aria-live` for the toast. Explicit `width`/`height` on images, `loading="lazy"`/`decoding="async"` for non-critical images.

## Content and Design Rules

- Capitalization: the product is **GeneoGraph**; the visual board/workspace is **Geneograph**.
- This is an interactive prototype/concept. Never present planned capabilities as shipped; distinguish prototype behavior from product direction.
- Use the Whiskerfield sample project (Silver Whiskerfield, Luna Purrington, the Meowbridge marriage record) consistently. This is sample data, not historical records.
- Keep the dark identity: near-black surfaces (`#0B0F0E` app background), brand green (`#62D99A` primary accent). Amber (`#D4AA6B`) is reserved for possible/uncertain relationships only; red/purple/blue are status/semantic accents as already used.
- No glass/glow effects, floating decorative cards, or generic startup motifs.

## CSS Ownership

- Edit declarations in their owning feature or shared stylesheet. Merge superseded rules; do not append competing overrides or use `!important` merely to avoid reconciling an existing rule.
- Put shared tokens and resets in `src/core/foundation.css`; put reusable button, icon-button, field, select, checkbox, label, and focus appearance in `src/shared/controls.css`. Use existing opt-in classes (`.button`, `.text-action`, `.panel-action`, `.control-icon-button`, `.field`, `.select`, `.common-select`, `.compact-select`, `.checkbox-row`) where applicable. Feature styles own layout, dimensions, and named exceptions such as Living status. Reconcile shared rules directly instead of adding module overrides. Shared resource-picker layout belongs in `src/shared/resource-picker.css`. Preserve the CSS tag order.
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
- The current root-based GitHub Pages configuration does **not** publish the application from `src/` — do not assume the deployed Pages site reflects `src/` until the Pages configuration is updated.
- Preserve direct `file://` compatibility in source paths and load order. Codex browser security blocks local `file://` navigation, so use the localhost procedure below for browser QA. Do not change browser security settings.

## Browser QA on this Windows host

Use browser QA only for substantial changes after asking the user. The prototype has no required development server or build step. Do not start a server or open a browser for small changes.

1. Set the shell working directory to `E:\Geneograph\Concept\geneograph-prototype` and confirm `Get-Location` resolves there. Inspect `git status --short` before editing.
2. If browser QA is agreed, check `http://127.0.0.1:8000/index.html` and reuse an existing server when it returns HTTP 200. `scripts/serve-local.cjs` is not present in this checkout; do not follow older instructions that reference it. If no server is available, tell the user and agree on how to serve `src/` before browser testing.
3. Open the agreed localhost URL in the Codex browser only when the user authorizes agent-run QA. Check the affected workflow and relevant language, viewport, focus, and modal states; inspect console errors and failed resources. Report the exact browser or server error if access fails—never assume visual QA passed.
4. Use `file://` only for a separate manual compatibility check when available outside the restricted Codex browser. Do not add fetch-based runtime dependencies or change relative paths merely because localhost allows them.

## License

Repository contents are licensed under GNU GPL 3 (see `LICENSE.txt`). Do not add code with incompatible licenses.
