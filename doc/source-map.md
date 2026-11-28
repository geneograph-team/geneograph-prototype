# Source map

`src/index.html` is the authoritative order for CSS and classic deferred JavaScript. `src/browser-config.js` carries empty public credential defaults, replaced only in GitHub Pages deployment by repository Actions secrets. `src/core/geocoder-adapter.js` precedes `src/shared/date-and-place-fields.js` and both place-search screens; it owns browser-only interactive Geoapify → LocationIQ lookup and single-provider automatic import lookup. Each script shares one global scope; do not duplicate top-level bindings or move an eager initializer before its dependencies. Direct `file://` opening remains required.

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
- `localization/runtime.js` owns exact, dynamic and embedded translations. Its lazy literal-prefix index selects embedded candidates from the fixed catalog. The same ordered regexes still govern substitutions for UI and search. A substitution can introduce a later candidate, so matching resumes from the next rule on the updated text.
- `core/app-shell.js` owns the shared main-view search input lifecycle. Native input values publish immediately; compatible result refreshes coalesce per animation frame, retain the connected input path, and scope pending work to the owning input/project/module/language. Consumer renderers keep their own query, selection and detail lifecycles; Notes and Places retain their editor/map surfaces separately. Modal closure resumes only still-current work.
- `shared/person-name-helpers.js` owns interactive person-search normalization, name-field preparation and token matching. It loads before person-search consumers; callers own candidate scope, metadata, ranking and limits. `shared/filter-fields.js` preserves optional person references for explicitly opted-in `shared/filter-interactions.js` fields.
- `shared/` genealogy helpers precede `seed/seed-genealogy.js`, which derives timeline entries from the authored genealogy records. Archive fixtures declare their document places directly.
- **Temporary internal QA (#446, replacing #381):** `seed/sample-data.js` registers stress-test project metadata; `seed/family-tree-stress-data.js` carries the approved pseudonymized GEDCOM as data only. `seed/family-tree-stress-test.js` is a function-only script. `shared/shared-actions.js` calls its lazy initialization before activating that project; the existing GEDCOM parser/mapper validates 6,481 people and 1,950 families and derives events only on first open. See [test fixture and mandatory pre-user-testing removal](family-tree-stress-test.md).
- `modules/projects/gedcom-import.js` owns local GEDCOM decoding, parsing, mapping, preview and commit. It validates detached records before publishing the new project, then owns session-local automatic place matching jobs, diagnostics and verified duplicate reconciliation; Places owns coalesced view refresh.
- `core/application-performance.js` owns the single opt-in diagnostic session and versioned export; `modules/family-tree/tree-performance.js` is the Tree adapter. The shell owns Diagnostics settings and recording navigation control. Diagnostic data is transient and not part of project records.
- `core/validation.js` owns detached project draft preparation. It validates source records, derives timeline events with `shared/tree-seed-model.js`, then validates evidence references against the reconstructed timeline. See [Project data contract](project-data-contract.md).
- `assets/boards/whiskerfield-tree-research.js` registers the board before `seed/seed-boards.js` validates it. Vendor scripts precede their document and PNG consumers. `core/bootstrap.js` calls `render()` last.
- `seed/seed-notes-records.js` initializes Notes collections, notes, and source links immediately before `modules/notes/notes-model.js` declares the Notes model and rich-text helpers. `shared/entity-link-pickers.js` owns pickers used by Notes and Archive tagging. `core/runtime-config.js` selects the hosted Liberty light style or the local Liberty-derived dark style at `assets/map-styles/liberty-dark.json`. `modules/places/map-adapter.js` resolves the local style URL for hosted Pages and precedes map runtime and route rendering; the adapter resolves and lazily imports the vendored MapLibre module against the document base URL for hosted Places, while manual coordinates remain available through file://. `modules/places/map-runtime.js` precedes Places views; `modules/publish/drafts-model.js` precedes disabled Publish views.

| Seed/runtime load pair | Required order |
| --- | --- |
| Geneograph | `modules/geneograph/geneograph-runtime.js` → `seed/seed-geneograph-collections.js` → Geneograph model/editor scripts |
| Archive | `seed/seed-archive-records.js` → `modules/archive/archive-sources.js` → Archive file/navigation helpers |
| Notes | `seed/seed-notes-records.js` → `modules/notes/notes-model.js` → Notes views and controls |

- CSS tag order in `src/index.html` is the cascade. Split files preserve their original order, including interleaved shared, Notes, and Places rules. Edit declarations in the owning stylesheet; do not add a trailing override file.
- HTML and script asset paths resolve from `src/index.html`; CSS `url(...)` paths resolve from their stylesheet. Project-cover URLs inserted through CSS custom properties are made document-absolute in `shared/shared-actions.js`.


### Shared project read model

The classic-script order is coordinator, relationship rules, then providers. The People consumers and bootstrap load afterward. The coordinator lives in `core/project-read-model.js`. Provider construction lives in `shared/project-read-providers.js`. Acquire with `acquireProjectReadModel(projectId)`. A handle offers `projectId`, `generation`, `revisionToken(domains)`, and `read(key, domains, build, variant)`. A stale or non-active handle has a null revision token. The shell and project activation manage the active project and the import rollback releases the old generation.

`core/bootstrap.js` owns the dirty-session notification boundary. Nested writes in scoped person, relationship, evidence and Sync commits report their changed owners and domains to a commit-local map. `shared/tree-seed-model.js` records changed projected events and pruned event references before the owning edit notifies retained readers. `modules/places/place-record-helpers.js` owns authored Place-reference traversal and dismissal expiry. Known edits without Place-reference changes can skip that traversal. The shell and Places check the active project, and unclassified commits retain a conservative global check.

| Retained key | Owner and inputs | Variant |
| --- | --- | --- |
| `people:index` | `projectPeopleIndex(context)` reads people and indexes raw and eligible IDs | None |
| `families:index` | `projectFamilyIndex(context)` reads people, family IDs and partner/child memberships | None |
| `families:graph` | Relationship provider builds adjacency from the scoped people and families | None |
| `families:labels` | `projectRelationshipLabels(context, referenceId)` applies genealogy rules to people and adjacency | Reference person ID |
| `people:directory` | `peopleDirectoryContext(projectId)` reads people, families, places, sources, archive and events | Language, reference person ID and source-link collection replacement |
| `people:geneo-match-names` | Geneograph Sync automatic matching reads eligible people, groups by name and prepares birth dates on demand | Language |
| `notes:search-resources` | Notes search indexes eligible linked records and formats labels and person search fields by people, families, places, events, media, archive and sources revisions | Language |
| `people:link-search` | Shared People linker reads people, places and media to prepare searchable fields and photo counts | Language |
| `albums:photo-search` | Albums search prepares photo text from media, albums, people and places | Language |
| `people:album-tag-search` | Albums and Archive tagging prepare names and search fields from people and places | Language |
| `albums:tag-memberships` | Shared tagging reads media and album memberships for contextual rankings | None |
| `people:photo-filter-search` | Shared resource picker reads people for photo filter ordering and search | Language |
| `places:associations` | Place directory, inspector and selector read places, people and events to index ordered associations and distinct people counts | None |
| `places:inspector-events` | Places inspector groups connected events and precomputes date and person sort keys from places, people and events | Place ID and language |
| `places:duplicate-pairs` | Places review and Project Overview share exact duplicate comparisons derived from canonical place records | None |

All keys retain one value for the active generation. A domain edit evicts matching entries. Unknown edits evict all entries. Non-active reads are uncached. For a new provider, use a distinct key, declare inputs and return read-only derived data. For example, a single-person consumer can call `projectPeopleIndex(acquireProjectReadModel(projectId)).eligibleById.get(personId)`. A mutation owner that has completed a project metadata change can call `markPrototypeSessionEdited(projectId, ['projects'])`. Default-reference changes already use that path. Reads that require families can pass the scoped index to the existing relationship helpers. Tree layout retains its separate request-local preparation.

### Application diagnostics instrumentation

`core/application-performance.js` owns the opt-in recorder, allowlists, operation nesting and bounded export. `appPerf.run(module, kind, fn)` measures synchronous calls. Asynchronous lifecycle owners use `begin(module, kind, null, 'asynchronous')` and `finish(trace, outcome)`. `currentDetailed(module)` provides synchronous attribution for stage and count helpers. Omit the module only for shared work owned by the initiating operation. Only time work already performed. Propagate a trace explicitly across callbacks when possible and let the owner handle cancellation and failure.

`core/project-read-model.js` reports provider hits, misses, uncached builds and elapsed build time at its existing retention boundary. It reports affected revision categories and entry evictions/disposal without exporting project identity, revision tokens, domain data or variant values. `shared/project-read-providers.js` counts the collections and membership edges already traversed. Provider timings can include nested builds.

| Module | Instrumented operations and work | Known gaps |
| --- | --- | --- |
| Projects | Activation/navigation/render, GEDCOM parse/map/commit, import sizes, open-project insights analysis | Insight section attribution and slower deferred work need a targeted recording |
| People | Directory, Profile, preview, delete, search/filter/sort/page. Filter, sort, detail, markup, DOM insertion, evidence and provider reuse | Other edit/save and preview substeps lack dedicated stages |
| Places | Entry, list/map workspace changes, selection, review, query, duplicate analysis and inspector evidence. Map initialization ends at readiness/failure/cancel | Style-only reloads and geocoder or tile network breakdown need separate profiling |
| Archive | Workspace render, file/source query and detail, inspector and desktop selection | Query totals may repeat within a render. Photo decoding and async import/viewer work are unspecified |
| Albums | Navigation, photo query, detail pane, grid resize, tagging candidate queries, and viewport card preparation and mounting | Native image decoding and guarded navigation wait need separate measurements |
| Notes | Render, result query, central-note selection and rich editor mount | First Quill mount and full browser-list rendering remain independent of compatible editor reuse |
| Geneograph | Library query, board open/render, Sync review and Apply. Board render separates object markup, DOM mount, sidebar and card text fit. Sync separates snapshot input, projection, detail and Apply writes | Pan, zoom, direct manipulation and serialization lack dedicated stage attribution |
| Publish | Preview markup and existing render boundary | Publish remains disabled in regular navigation |
| Shared pickers | Single-person open/query/selection, People link search and commit, photo person filter, and place suggestions. Candidate counts and query/markup or DOM stages track the work performed | Geneograph selection includes the board review continuation, with separate projection and detail timings. Live geocoding is outside this picker capture |
| Family Tree | Existing focus, layout passes, viewport, portraits and Tree stages | Existing Tree lifecycle and timing fields retain their meaning |

The top-level `summaryCoverage` binds the browser and read-model summaries to the current/last recording epoch and its Start configuration. It is independent of the latest editable settings. The Tree viewport owns gesture traces using their source events. A fresh mouse or touch gesture can replace a wheel burst before D3 emits its delayed end. Replaced traces cancel at replacement. Native release attribution keeps delayed events from ending a different trace.

### Family Tree layout

The Tree builds visibility before display hydration. Its request-local person and resource indexes serve visible cards without putting derived values onto canonical records. The shared canonical projection lives in `src/core/state-tree-core.js` and provides the Tree data and mounts the shell through `src/modules/family-tree/tree-view.js`. `tree-renderer.js` builds the scene, applies semantic detail, joins visible entities by stable key, and updates selection and the inspector in place. `tree-viewport.js` controls the actual camera transform with D3 Zoom. `tree-performance.js` adapts Tree timings to the application recorder; it does not own session state, layout or canonical data. `tree-portraits.js` leases viewport-visible portrait derivatives from `src/shared/portrait-thumbnails.js`. The branch overlay in tree-branches.js resolves ancestry slots, visual occurrence attribution, display channels and shell-local theme palette variables. `state-tree-core.js` owns normalized project display palettes and the staged Visibility / Coloring / Palette settings form; origin paths are resolved by the branch helper. The existing Geneograph paint picker accepts a caller-owned color-only draft target for Tree palette settings, without board history or live Tree edits. Geneograph reuses the immutable Tree palette defaults and pure tonal helpers (loaded earlier in the classic-script order), not project-customized Tree colors or ancestry attribution. Board theme provenance and explicit paints remain board-owned. The Albums crop helpers still define canonical crop and face-region semantics. `tree-elk-layout.js` owns the project-local layout request, resolves layout diagnostics to local record labels and adapts occurrence geometry and connector descriptors. It applies birth chronology as a visual sibling preference after recorded occurrence membership is resolved. `tree-elk-model.js` owns focus-aware occurrence resolution, compound graph construction, focus-relative principal partnership selection, ancestry-aware household and bilateral partnership junction input order, native bottom-up hierarchical sweep and root-level model-order preference, cross-axis family centering and unified inline routing. Guarded refinement reuses indexed native routing inputs and compares conflicts incrementally by changed geometry identity, retaining full per-relationship multiplicity. The occurrence result records each appearance’s canonical person, co-parent context, family memberships and reconvergence roots. The project view stores a canonical context preference for moving visible ancestry between occurrences. Sibling reconvergence can create visual family instances that partition child memberships under the same canonical family ID. The ELK adapter retains both IDs so each rail can be routed independently and inherit the canonical family style. The standalone ELK frame exchanges anonymous ELK JSON graphs through messages. `tree-geometry.js` owns the shared card, orientation-aware placeholder, nominal partner gap, dash pattern, connector and focus-control dimensions. The Tree requests ELK DOWN for Vertical or RIGHT for Horizontal and offers Retry after failure. Its per-project depth, orientation and color preferences are validated before projection and saved in local browser storage on committed changes. A future Fan presentation would attach at the application shell with canonical IDs and project-scoped view state, and own its projection, viewport and radial renderer.

Family Tree styles are loaded in functional order from `src/index.html`.

| Stylesheet | Ownership |
| --- | --- |
| `tree-workspace.css` | Shell, toolbar, picker, canvas, zoom, settings, palette editor and responsive workspace |
| `tree-cards.css` | Person and placeholder cards, portraits, controls, detail levels and card color states |
| `tree-connectors.css` | Stroke width and color, overview strokes and separation/divorce dashes |
| `person-panel.css` | Tree inspector, summary, timeline and responsive panel layout |

These four files consolidate the former two Tree stylesheets. Shared inspector controls live in `shared/controls.css`, mobile relationship form rules in `shared/relationship-forms.css`, and application and Projects breakpoints in `core/foundation.css`. People-only rules live with their directory or profile.

Current behavior is recorded in the [Family Tree specification](../openspec/specs/family-tree/spec.md). The [ELK/D3 migration design](../openspec/changes/archive/2026-11-26-elk-d3-tree-migration/design.md) retains historical design decisions and verification evidence.
