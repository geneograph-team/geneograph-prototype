# GeneoGraph Prototype

Static browser prototype for genealogy research. Open `src/index.html` directly or serve `src/` as static files. There is no framework, package manager, build step, backend, or durable project database. The GitHub Pages workflow builds the hosted demo by copying `src/` to `dist/` and publishes `dist/` from the `default` branch.

## Source layout

- `src/index.html` is the application shell and authoritative load order for stylesheets and classic deferred scripts. Files share load-order-dependent globals; keep the board asset before its seed adapter and bootstrap last.
- `src/core/` owns configuration, state, shell, validation, icons, bootstrap, the approved UI palette (`core/palette/`), and shared aliases and resets (`core/foundation.css`).
- `src/modules/` groups Projects, Family Tree, People, Geneograph, Albums, Archive, Notes, Places, and disabled Publish behavior and styles by feature. `src/shared/` owns cross-view helpers and controls. `shared/controls.css` owns recurring control appearance and focus states; module CSS owns layout and unique variants. `shared/resource-picker.css` owns picker-specific layout.
- `src/seed/` holds sample records and load-time seed adapters. `src/localization/` holds ordered English/Russian dictionaries and the language runtime.
- `src/assets/photos/`, `documents/`, `covers/`, and `ui/` hold static media. `src/assets/boards/whiskerfield-tree-research.js` registers the seeded board before `src/seed/seed-boards.js` loads.
- `src/vendor/` holds pinned local browser libraries, including `html-to-image`. MapLibre CSS and Quill load from pinned CDNs; the Places renderer imports the pinned MapLibre ES module only on hosted HTTP(S) pages. Opening via file:// retains the Places list and manual coordinates without an interactive map.

## Tests and scripts

- [`tests/`](tests/README.md): reusable regression checks grouped by domain; run locally with Node.js.
- `tests/temp/`: ignored disposable experiments and outputs.
- `scripts/`: pipeline-critical utilities, currently the localization catalog check.

## Documentation

[Documentation architecture](doc/documentation-architecture.md) defines which documents are authoritative and when to update them.

- [AGENTS.md](AGENTS.md): agent permissions, coding and verification workflow.
- [Product vision](doc/product-vision.md): product purpose and long-term direction, not the prototype's implemented feature list.
- [Design guide](doc/design-document.md): prototype interaction and UX principles; [source map](doc/source-map.md): code ownership and load-order dependencies.
- [Project data contract](doc/project-data-contract.md): evolving canonical record model; check active issues for unfinished validation.
- [Internal Family Tree stress-test fixture](doc/family-tree-stress-test.md): **temporary QA only; remove before open user testing**. Not part of the public sample experience.
- [OpenSpec](openspec/README.md): verified feature requirements, active changes and history.
- [Git branching](doc/git-branching-model.md) and [commit style](doc/git-commit-style.md): ChatGPT GitHub PR workflow only; local Codex must not use Git.

## Places map and geocoding

- The **map** uses MapLibre GL JS and OpenFreeMap vector styles on HTTP(S). Light mode uses upstream Liberty; dark mode uses a [locally hosted Liberty-derived style](doc/design-document.md#liberty-derived-dark-map-style-issue-177-supersedes-163). The dark style's colors are owned in `src/assets/map-styles/liberty-dark.json`, separate from UI colors.
- **Place-name search** uses the browser-only **Geoapify → LocationIQ** chain: Geoapify is primary; LocationIQ is tried automatically on no results or a provider error/timeout. No provider selector is shown. Deliberate search cancellation does not trigger fallback.
- Both providers receive linked credits below place-search suggestions in Places and Geneograph and under **Settings → About → Data providers**.
- `src/browser-config.js` contains **no keys**. The Pages workflow injects the restricted public browser tokens from GitHub Actions repository secrets `GEOAPIFY_BROWSER_KEY` and `LOCATIONIQ_BROWSER_KEY` into **deployed** `dist/browser-config.js`. Token values are visible to browser visitors, even though not stored in Git history. Restrict and monitor them at both providers.
- Direct `file://` use, missing credentials or provider failures must not prevent manual place creation and coordinate editing. The map and hosted geocoding need permitted network access; no backend manages quotas.

**Setup and troubleshooting:** [Browser geocoder setup, security, limits and verification](doc/browser-geocoder-setup.md). **Design rationale:** [Places maps and browser geocoding](doc/design-document.md#places-maps-and-browser-geocoding-issue-158).

## License

GeneoGraph's first-party prototype software remains licensed under GNU GPL 3. See [LICENSE.txt](LICENSE.txt). Third-party libraries, map styles, data and media retain their applicable terms; this statement does not grant rights in third-party material or change existing license grants.

The GeneoGraph website owns the shared [privacy policy](https://geneograph.com/legal.html#privacy) and [licenses and credits](https://geneograph.com/legal.html#licenses). Settings → About opens the corresponding English or Russian section from both the hosted and local prototype. These website links require an internet connection; distributed license files remain local. The published [GPL text](src/LICENSE.txt) must remain byte-identical to the repository license. The [vendor inventory](src/vendor/README.md) records the pinned libraries. Further verification of bundled notices, media provenance and provider terms remains tracked under [#427](https://github.com/geneograph-team/geneograph-prototype/issues/427). The public repository and its deployment history provide source access; an exact deployed-revision check remains required before distribution acceptance.
