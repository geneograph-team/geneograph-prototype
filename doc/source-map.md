# Source map

`src/index.html` is the authoritative order for CSS and classic deferred JavaScript. Each script shares one global scope; do not duplicate top-level bindings or move an eager initializer before its dependencies. Direct `file://` opening remains required.

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

- Inline `window.GENEOGRAPH_CONFIG` precedes deferred scripts. Localization dictionaries and catalog precede `localization/runtime.js`; `seed/sample-data.js` precedes feature code.
- `shared/` genealogy helpers precede `seed/seed-genealogy.js`, which immediately normalizes sample records. `modules/archive/archive-seed-normalize.js` loads after Archive helpers because it immediately normalizes seeded file places.
- `assets/boards/whiskerfield-tree-research.js` registers the board before `seed/seed-boards.js` validates it. Vendor scripts precede their document and PNG consumers. `core/bootstrap.js` calls `render()` last.
- `modules/notes/notes-seed-and-model.js` owns Notes seed/model and rich-text helpers. `shared/entity-link-pickers.js` owns pickers used by Notes and Archive tagging. `modules/places/map-adapter.js` precedes map runtime and route rendering; the adapter lazily imports MapLibre for hosted Places, while manual coordinates remain available through file://. `modules/places/map-runtime.js` precedes Places views; `modules/publish/drafts-model.js` precedes disabled Publish views.
- CSS tag order in `index.html` is the cascade. Split files preserve their original order, including interleaved shared, Notes, and Places rules. Edit declarations in the owning stylesheet; do not add a trailing override file.
- HTML and script asset paths resolve from `src/index.html`; CSS `url(...)` paths resolve from their stylesheet. Project-cover URLs inserted through CSS custom properties are made document-absolute in `shared/shared-actions.js`.

## Verification baseline

The user confirmed direct `file://` startup and targeted English/Russian checks after the JavaScript, CSS, and asset moves. The known baseline console warning is a nonreciprocal sample-note link (`validation.js:3`). Chromium also reported a form-field id/name advisory. Geneograph PNG export for Luna's portrait has a separately recorded `file://`/render issue; it was not changed as part of this structure cleanup.
