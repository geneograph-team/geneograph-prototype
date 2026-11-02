# GeneoGraph Prototype

This is a static, browser-based genealogy research prototype. Open `src/index.html`
directly or serve `src/` as static files. There is no framework, package manager,
build step, backend, or durable project database. The current root-based GitHub
Pages configuration does not publish the application from `src/`.

## Source map

- `src/index.html` contains the application shell, CDN references, runtime map
  configuration, and the ordered stylesheet and classic deferred script tags.
  Script order matters because files share load-order-dependent globals.
- `src/foundation.css` defines base styles and tokens. Feature stylesheets sit
  beside their corresponding scripts; `final-overrides.css` contains later
  overrides. Keep the stylesheet order in `index.html` when making changes.
- `src/app-shell.js`, `state-tree-core.js`, and `bootstrap.js` handle rendering,
  shared state, and startup. Feature files include `people.js`, `geneograph.js`,
  `albums.js`, `archive.js`, `notes.js`, and `places.js`. Shared helpers and seed
  data remain in `src/`; follow `index.html` to see their load order.
- `src/assets/` holds the favicon, sample media and documents. The seeded board
  script is in `src/assets/boards/`.
- `src/vendor/` holds pinned local browser libraries, including `html-to-image`
  with its source map, version note, and license. Leaflet and Quill load from
  pinned CDNs.
- `tests/` contains focused browser regressions; `openspec/` contains project
  specifications and focused changes. See `AGENTS.md` and
  `Prototype_Design_Document.md` for development and product guidance.

## License

Repository contents are licensed under the GNU GPL 3 unless otherwise
specified. See [LICENSE.txt](./LICENSE.txt) and the bundled vendor licenses.
