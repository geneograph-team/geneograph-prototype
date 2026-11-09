# GeneoGraph Prototype

Static browser prototype for genealogy research. Open `src/index.html` directly or serve `src/` as static files. There is no framework, package manager, build step, backend, or durable project database. The current root-based GitHub Pages configuration does not publish the application from `src/`.

## Source layout

- `src/index.html` is the application shell and authoritative load order for stylesheets and classic deferred scripts. Files share load-order-dependent globals; keep the board asset before its seed adapter and bootstrap last.
- `src/core/` owns configuration, state, shell, validation, icons, bootstrap, the approved UI palette (`core/palette/`), and shared aliases and resets (`core/foundation.css`).
- `src/modules/` groups Projects, Family Tree, People, Geneograph, Albums, Archive, Notes, Places, and disabled Publish behavior and styles by feature. `src/shared/` owns cross-view helpers and controls. `shared/controls.css` owns recurring control appearance and focus states; module CSS owns layout and unique variants. `shared/resource-picker.css` owns picker-specific layout.
- `src/seed/` holds sample records and load-time seed adapters. `src/localization/` holds ordered English/Russian dictionaries and the language runtime.
- `src/assets/photos/`, `documents/`, `covers/`, and `ui/` hold static media. `src/assets/boards/whiskerfield-tree-research.js` registers the seeded board before `src/seed/seed-boards.js` loads.
- `src/vendor/` holds pinned local browser libraries, including `html-to-image`. Leaflet and Quill load from pinned CDNs.

See [the source map](doc/source-map.md) for dependency boundaries, [AGENTS.md](AGENTS.md) for coding rules, and [the design guide](doc/design-document.md) for current product context. `doc/` also holds the normative git branching model and commit style guides; `openspec/` contains verified specs and focused change folders.

## License

Repository contents are licensed under GNU GPL 3 unless otherwise specified. See [LICENSE.txt](LICENSE.txt) and bundled vendor licenses.
