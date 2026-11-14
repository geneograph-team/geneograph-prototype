# GeneoGraph Prototype

Static browser prototype for genealogy research. Open `src/index.html` directly or serve `src/` as static files. There is no framework, package manager, build step, backend, or durable project database. The GitHub Pages workflow builds the hosted demo by copying `src/` to `dist/` and publishes `dist/` from the `default` branch.

## Source layout

- `src/index.html` is the application shell and authoritative load order for stylesheets and classic deferred scripts. Files share load-order-dependent globals; keep the board asset before its seed adapter and bootstrap last.
- `src/core/` owns configuration, state, shell, validation, icons, bootstrap, the approved UI palette (`core/palette/`), and shared aliases and resets (`core/foundation.css`).
- `src/modules/` groups Projects, Family Tree, People, Geneograph, Albums, Archive, Notes, Places, and disabled Publish behavior and styles by feature. `src/shared/` owns cross-view helpers and controls. `shared/controls.css` owns recurring control appearance and focus states; module CSS owns layout and unique variants. `shared/resource-picker.css` owns picker-specific layout.
- `src/seed/` holds sample records and load-time seed adapters. `src/localization/` holds ordered English/Russian dictionaries and the language runtime.
- `src/assets/photos/`, `documents/`, `covers/`, and `ui/` hold static media. `src/assets/boards/whiskerfield-tree-research.js` registers the seeded board before `src/seed/seed-boards.js` loads.
- `src/vendor/` holds pinned local browser libraries, including `html-to-image`. MapLibre CSS and Quill load from pinned CDNs; the Places renderer imports the pinned MapLibre ES module only on hosted HTTP(S) pages. Opening via file:// retains the Places list and manual coordinates without an interactive map.

See [the source map](doc/source-map.md) for dependency boundaries, [AGENTS.md](AGENTS.md) for coding rules, and [the design guide](doc/design-document.md) for current product context. `doc/` also holds Git branching and commit guides for ChatGPT chat GitHub PR work; Codex local work does not use Git. `openspec/` contains verified specs and focused change folders.

## Places map and geocoding

- The **map** uses MapLibre GL JS and OpenFreeMap vector styles on HTTP(S). Light mode uses upstream Liberty; dark mode uses a [locally hosted Liberty-derived style](doc/design-document.md#liberty-derived-dark-map-style-issue-177-supersedes-163). The dark style's colors are owned in `src/assets/map-styles/liberty-dark.json`, separate from UI colors.
- **Place-name search** uses the browser-only **Geoapify → LocationIQ** chain: Geoapify is primary; LocationIQ is tried automatically on no results or a provider error/timeout. No provider selector is shown. Deliberate search cancellation does not trigger fallback.
- Both providers receive linked credits below place-search suggestions in Places and Geneograph and under **Settings → About → Data providers**.
- `src/browser-config.js` contains **no keys**. The Pages workflow injects the restricted public browser tokens from GitHub Actions repository secrets `GEOAPIFY_BROWSER_KEY` and `LOCATIONIQ_BROWSER_KEY` into **deployed** `dist/browser-config.js`. Token values are visible to browser visitors, even though not stored in Git history. Restrict and monitor them at both providers.
- Direct `file://` use, missing credentials or provider failures must not prevent manual place creation and coordinate editing. The map and hosted geocoding need permitted network access; no backend manages quotas.

**Setup and troubleshooting:** [Browser geocoder setup, security, limits and verification](doc/browser-geocoder-setup.md). **Design rationale:** [Places maps and browser geocoding](doc/design-document.md#places-maps-and-browser-geocoding-issue-158).

## License

Repository contents are licensed under GNU GPL 3 unless otherwise specified. See [LICENSE.txt](LICENSE.txt) and bundled vendor licenses.
