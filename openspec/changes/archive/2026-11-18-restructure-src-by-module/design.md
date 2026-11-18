# Design

## Context

See [proposal.md](proposal.md). `src/index.html` is the authoritative load manifest: 39 first-party top-level JavaScript files, 13 CSS files, and local vendor and board-asset scripts use ordered classic `defer` tags. Top-level lexical bindings and functions are shared across scripts. Direct `file://` opening must continue to work. The largest files are `geneograph.js` (~30.8k lines), `archive.js` (~25.9k), `family-and-shared.js` (~13.6k), `notes.js` (~12.5k), `albums.js` (~11.6k), and `localization.js` (~9.7k). CSS ownership already forbids trailing overrides. There is no checked-in browser test suite.

## Goals / Non-Goals

**Goals:** Make ownership and script order explicit; produce smaller workflow-owned source files; preserve visible behavior, data, localization, export/import, responsive styles, and direct file loading. Keep every pass independently reviewable and reversible.

**Non-Goals:** ES modules, bundling, generated HTML, a package manager, new persistence, feature redesign, broad coding-style reformatting, exact file-size limits, or moving third-party vendor bundles.

## Decisions

1. **Keep explicit classic script and CSS tags.** Update `index.html` paths in place and preserve the effective load order. Moving to ES modules or a generated manifest would change `file://` behavior and add tooling. For each extraction, inventory top-level declarations, reads, immediate side effects, and downstream callers. Place extracted scripts at the earliest safe point after their dependencies and before first use; avoid duplicate lexical names. Keep `bootstrap.js` last. Preserve seed board asset before its adapter and vendor scripts before consumers.
2. **Separate path moves from logic splits.** First move small, already isolated files into `core/`, `shared/`, `seed/`, `localization/`, or `modules/<feature>/`. In a later pass, split one large file by contiguous, coherent workflow. Do not change behavior and file location in the same pass. The target tree is a navigation aid, not a mandatory filename schema. `modules/projects/`, `family-tree/`, `people/`, `geneograph/`, `albums/`, `archive/`, `notes/`, `places/`, and `publish/` own feature behavior and styles. Shared resource picker, media, dates, actions, and cross-module controls remain under `shared/`; app state, shell, runtime config, icons, and bootstrap under `core/`. `src/vendor/` remains unchanged.
3. **Split by ownership and dependency, not line count.** Candidate Geneograph seams are board model/defaults, library and collections, canvas render, inspector, pickers/modals, and editor interaction. Candidate Archive seams are source/link model, folder/file operations, library UI, inspector, and upload/move dialogs. Localization can separate ordered UI/data dictionaries from translation and DOM runtime. Family Tree/People, Albums, Notes, and Places follow only after dependencies are mapped. Preserve function bodies and top-level initialization order; leave tightly coupled helpers together when extraction would create a circular load dependency.
4. **Move misplaced code after tracing usage.** Archive file/person dialogs in `notes.js` and Publish draft helpers in `places.js` are candidates, not automatic moves. Verify callers, shared state, and first-use timing; extract to an owner or a genuinely shared file only if ownership becomes clearer without new coupling. Publish stays disabled.
5. **Keep CSS cascade explicit.** Move stylesheet files to module directories after JS ownership settles. Preserve tag order and relative `url(...)` resolution; split a CSS file only at a complete component/state boundary. Merge competing declarations in the owner, rather than recreating `final-overrides.css` or adding `!important`.
6. **Categorize assets last.** Keep `assets/boards/` and `vendor/` as they are. Group other assets into photos, documents, covers, and UI only after locating HTML, CSS, JS, and sample-data references. Move one category per pass and update exact paths; do not rename media IDs or alter embedded board images.
7. **Maintain a compact source map.** README lists directory ownership and points to `index.html` for load order. AGENTS and the design guide reflect actual paths after each phase. Fix the literal `\n` in the existing README CSS entry during the documentation baseline.

## Risks / Trade-offs

- [Global load order] A moved declaration may be read before initialization or collide with another top-level name → inventory bindings and side effects before extraction; preserve ordering and check startup console after each pass.
- [Relative paths] Nested scripts, CSS, assets, or board files may resolve from different bases → check every moved reference from `src/index.html` and every CSS `url(...)`; open directly via `file://`.
- [Cascade changes] Splitting CSS may change selector precedence → keep original stylesheet order, compare affected desktop/phone states in English/Russian, and reconcile declarations in place.
- [Large diff] Moving and splitting all files at once obscures regressions → review one module or asset category per pass; stop on failure and revert that pass only, preserving earlier completed passes and unrelated changes.
- [Token savings] Folders alone do not shrink large files → prioritize cohesive splits and targeted source maps; avoid arbitrary fragment sizes or copies of code in docs.

## Migration Plan

1. Capture current paths, ordered tags, global reads/declarations, CSS URL references, and a bounded browser baseline. Repair README formatting and add the compact ownership map.
2. Relocate small self-contained files, then split Geneograph, Archive, localization, Family Tree/People, and remaining feature files in separate passes. Update ordered tags with each pass.
3. Move module CSS, then categorize assets. Update documentation to the final structure.
4. At each pass, inspect the diff, check direct `file://` startup and console, exercise affected English/Russian workflows at desktop and phone widths, and run `git diff --check`. Use automated checks only for a meaningful migration risk (for example, missing local resource paths or duplicate top-level names).
5. If a pass fails, restore only its path/content changes; do not reset the working tree or remove unrelated edits. Resume from the last verified pass. Do not archive the OpenSpec change until all tasks and integration checks are complete.