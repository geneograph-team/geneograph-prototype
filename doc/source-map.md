# Source map

`src/index.html` is the authoritative order for CSS and classic deferred JavaScript. `src/browser-config.js` carries empty public credential defaults, replaced only in GitHub Pages deployment by repository Actions secrets. `src/core/geocoder-adapter.js` precedes `src/shared/date-and-place-fields.js` and both place-search screens; it owns browser-only Geoapify → LocationIQ lookup. Each script shares one global scope; do not duplicate top-level bindings or move an eager initializer before its dependencies. Direct `file://` opening remains required.

## Owners

| Area | Source owner |
| --- | --- |
| Shell, state, validation, tokens | `src/core/` |
| Project and feature views, editors, inspectors, styles | `src/modules/<feature>/` |
| Cross-view media, relationships, date/place fields, pickers, controls | `src/shared/` |
| Sample records and load-time adapters | `src/seed/` |
| English/Russian dictionaries and runtime | `src/localization/` |
| Photos, document samples, covers, UI artwork, board payload | `src/assets/{photos,documents,covers,ui,boards}/` |
| Local third-party bundles | `src/vendor/` |

## Load-order edges

- The nondeferred `src/browser-config.js` initializes `window.GENEOGRAPH_CONFIG` before deferred scripts. Localization dictionaries and catalog precede `localization/runtime.js`; `seed/sample-data.js` precedes feature code.
- `shared/` genealogy helpers precede `seed/seed-genealogy.js`, which derives timeline entries from the authored genealogy records. Archive fixtures declare their document places directly.
- **Temporary internal QA (#381):** `seed/sample-data.js` registers stress-test project metadata, but `seed/family-tree-stress-test.js` is a function-only script loaded after `core/validation.js`. `shared/shared-actions.js` calls its lazy initialization before activating that project; 1,200 canonical records are validated and inserted only on first open. See [test fixture and mandatory pre-user-testing removal](family-tree-stress-test.md).
- `core/validation.js` owns detached project draft preparation. It validates source records, derives timeline events with `shared/tree-seed-model.js`, then validates evidence references against the reconstructed timeline. See [Project data contract](project-data-contract.md).
- `assets/boards/whiskerfield-tree-research.js` registers the board before `seed/seed-boards.js` validates it. Vendor scripts precede their document and PNG consumers. `core/bootstrap.js` calls `render()` last.
- `seed/seed-notes-records.js` initializes Notes collections, notes, and source links immediately before `modules/notes/notes-model.js` declares the Notes model and rich-text helpers. `shared/entity-link-pickers.js` owns pickers used by Notes and Archive tagging. `core/runtime-config.js` selects the hosted Liberty light style or the local Liberty-derived dark style at `assets/map-styles/liberty-dark.json`. `modules/places/map-adapter.js` resolves the local style URL for hosted Pages and precedes map runtime and route rendering; the adapter lazily imports MapLibre for hosted Places, while manual coordinates remain available through file://. `modules/places/map-runtime.js` precedes Places views; `modules/publish/drafts-model.js` precedes disabled Publish views.

| Seed/runtime load pair | Required order |
| --- | --- |
| Geneograph | `modules/geneograph/geneograph-runtime.js` → `seed/seed-geneograph-collections.js` → Geneograph model/editor scripts |
| Archive | `seed/seed-archive-records.js` → `modules/archive/archive-sources.js` → Archive file/navigation helpers |
| Notes | `seed/seed-notes-records.js` → `modules/notes/notes-model.js` → Notes views and controls |

- CSS tag order in `src/index.html` is the cascade. Split files preserve their original order, including interleaved shared, Notes, and Places rules. Edit declarations in the owning stylesheet; do not add a trailing override file.
- HTML and script asset paths resolve from `src/index.html`; CSS `url(...)` paths resolve from their stylesheet. Project-cover URLs inserted through CSS custom properties are made document-absolute in `shared/shared-actions.js`.

