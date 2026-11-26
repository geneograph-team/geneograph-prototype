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
- **Temporary internal QA (#381):** `seed/sample-data.js` registers stress-test project metadata, but `seed/family-tree-stress-test.js` is a function-only script loaded after `core/validation.js`. `shared/shared-actions.js` calls its lazy initialization before activating that project; 1,023 canonical ancestor records are validated and inserted only on first open. See [test fixture and mandatory pre-user-testing removal](family-tree-stress-test.md).
- `modules/projects/gedcom-import.js` owns local GEDCOM decoding, parsing, mapping, preview and commit. It validates detached records before publishing the new project.
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


### Family Tree layout

The Tree builds visibility before display hydration. Its request-local person and resource indexes serve visible cards without putting derived values onto canonical records. The shared canonical projection lives in `src/core/state-tree-core.js` and provides the Tree data and mounts the shell through `src/modules/family-tree/tree-view.js`. `tree-renderer.js` builds the scene, applies semantic detail, joins visible entities by stable key, and updates selection and the inspector in place. `tree-viewport.js` controls the actual camera transform with D3 Zoom. `tree-performance.js` owns opt-in in-memory anonymous timing collection and explicit JSON export in Tree Settings; it does not own layout or canonical data. `tree-portraits.js` leases viewport-visible portrait derivatives from `src/shared/portrait-thumbnails.js`. The branch overlay in tree-branches.js resolves ancestry slots, visual occurrence attribution, display channels and the legend. The Albums crop helpers still define canonical crop and face-region semantics. `tree-elk-layout.js` owns the project-local layout request, resolves layout diagnostics to local record labels and adapts occurrence geometry and connector descriptors. It applies birth chronology as a visual sibling preference after recorded occurrence membership is resolved. `tree-elk-model.js` owns focus-aware occurrence resolution, compound graph construction, focus-relative principal partnership selection, ancestry-aware household and bilateral partnership junction input order, native bottom-up hierarchical sweep and root-level model-order preference, cross-axis family centering and unified inline routing. Guarded refinement reuses indexed native routing inputs and compares conflicts incrementally by changed geometry identity, retaining full per-relationship multiplicity. The occurrence result records each appearance’s canonical person, co-parent context, family memberships and reconvergence roots. The project view stores a canonical context preference for moving visible ancestry between occurrences. Sibling reconvergence can create visual family instances that partition child memberships under the same canonical family ID. The ELK adapter retains both IDs so each rail can be routed independently and inherit the canonical family style. The standalone ELK frame exchanges anonymous ELK JSON graphs through messages. `tree-geometry.js` owns the shared card, orientation-aware placeholder, nominal partner gap, dash pattern, connector and focus-control dimensions. The Tree requests ELK DOWN for Vertical or RIGHT for Horizontal and offers Retry after failure. Its per-project depth, orientation and color preferences are validated before projection and saved in local browser storage on committed changes. A future Fan presentation would attach at the application shell with canonical IDs and project-scoped view state, and own its projection, viewport and radial renderer.

Family Tree styles are loaded in functional order from `src/index.html`.

| Stylesheet | Ownership |
| --- | --- |
| `tree-workspace.css` | Shell, toolbar, picker, canvas, zoom, settings, branch legend and responsive workspace |
| `tree-cards.css` | Person and placeholder cards, portraits, controls, detail levels and card color states |
| `tree-connectors.css` | Stroke width and color, overview strokes and separation/divorce dashes |
| `person-panel.css` | Tree inspector, summary, timeline and responsive panel layout |

These four files consolidate the former two Tree stylesheets. Shared inspector controls live in `shared/controls.css`, mobile relationship form rules in `shared/relationship-forms.css`, and application and Projects breakpoints in `core/foundation.css`. People-only rules live with their directory or profile.

Target architecture for the approved migration (#398): [ELK/D3 design](../openspec/changes/elk-d3-tree-migration/design.md). The owners above describe current code; the linked design describes the target contracts, not implemented modules. Update this map as ownership changes land.
