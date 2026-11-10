# GeneoGraph Prototype: Current Design and Engineering Guide

**Reviewed:** 2026-11-09
**Scope:** The working prototype in `src/`, not a specification of a shipped service.

**Canonical checkout:** `E:\Geneograph\Concept\geneograph-prototype`.

## 1. What this document describes

GeneoGraph is a project-based family-history research workspace. The prototype connects a structured family tree with person profiles, photographs, research files, notes, places, and free-form Geneograph boards. It demonstrates interactions and visual direction with seeded sample data. It is not a durable multi-user application.

## 2. Running the prototype

- Open `src/index.html` directly or serve `src/` as static files. There is no framework, package manager, compile step, or backend.
- `src/index.html` contains the shell, CDN references, and ordered stylesheets and classic deferred scripts. Script order matters: most share a global scope. `src/browser-config.js` loads before the geocoder and holds empty checked-in credential defaults; `src/core/geocoder-adapter.js` handles browser geocoding.
- Styles, behavior, seed records, state, and localization are grouped under `src/core/`, `modules/`, `shared/`, `seed/`, and `localization/`. Static media lives in `src/assets/{photos,documents,covers,ui,boards}/`; local vendor files support document and board export/preview paths.
- Quill and MapLibre CSS are pinned CDN dependencies; hosted Places lazily imports the pinned MapLibre GL JS ES module and uses OpenFreeMap vector basemaps. Geoapify geocoding runs directly in the browser with invisible LocationIQ fallback. GitHub Pages injects restricted browser credentials into the published artifact from Actions secrets; they remain visible to browser visitors. See `doc/browser-geocoder-setup.md`. Direct file-open sessions retain Places list and manual coordinate editing without an interactive map.
- The GitHub Pages workflow (`.github/workflows/deploy-prototype.yml`) copies `src/` into `dist/`, writes a deployment-only `dist/browser-config.js`, and publishes `dist/` on pushes to `default`. A feature branch does **not** receive this deployment configuration merely by opening a PR. Local and published behavior still require separate verification.

The main shell exposes a top bar, project/module navigation, workspace, right inspector, modals, and toasts. The visible modules are **Family Tree, People, Geneograph, Albums, Archive, Notes, and Places**. `Publish` has implementation files but is intentionally absent from the active module list in `src/core/runtime-config.js`.

## 3. Product and interaction principles

| Principle | Current design consequence |
| --- | --- |
| One research project, connected views | Records are scoped by project and referenced by stable IDs across modules. A profile, board card, photo, or place should not become an independent copy of the underlying record by accident. |
| Structured genealogy plus visual exploration | Family Tree is relationship-oriented; Geneograph is a flexible research canvas. They share people but have different layout and editing rules. |
| Direct manipulation with an inspector | Select an object to reveal relevant content, appearance, layout, and geometry controls. Multi-selection exposes only sensible shared operations. |
| Explicit provenance | Board-only and project-linked media or places are distinguished. Visual connection arrows do not imply a genealogical relationship. |
| Prototype truthfulness | Working local actions must be distinguished from simulated import, publishing, persistence, or service integrations. |

The visual identity uses the approved GeneoGraph v3 semantic palette: Soft Neutral Light and Neutral Charcoal Dark, Heritage Green for primary interaction, and category accents for content identity. `src/core/palette/geneograph-v3.css` owns UI color values; `src/core/foundation.css` owns aliases plus type, spacing, border, and motion tokens. Branded heroes use Heritage Green container/on-container in each theme. Geneograph uses compact tool surfaces and a dotted/grid-capable canvas; explicitly authored board colors remain content values. Avoid treating the old document's individual bug-fix notes as lasting design rules.

## 4. Architecture and state

### Runtime organization

- `src/seed/sample-data.js` establishes the seeded `sampleData` graph. `seed/seed-genealogy.js` and `seed/seed-boards.js` enrich it at load time; `core/validation.js` checks assumptions.
- The seeded Geneograph board is a data-only script in `src/assets/boards/whiskerfield-tree-research.js`, loaded before `src/seed/seed-boards.js`. The adapter validates the payload and assigns it to project `p1`. To replace the bundled seed, update the asset in its `window.GENEO_SEED_BOARD_ASSETS.push(...)` format and preserve valid board and project IDs. For another seeded board, use distinct IDs and load its script before `seed/seed-boards.js`. No conversion tool is currently checked in. The script wrapper keeps direct `file://` opening working; `.ggboard` remains the portable import/export format.
- `src/core/state-tree-core.js` owns central UI state; `src/core/app-shell.js` dispatches rendering. Feature behavior lives in `src/modules/{projects,family-tree,people,geneograph,albums,archive,notes,places,publish}/`; Publish remains disabled in navigation.
- `src/shared/` contains cross-view media, relationships, date/place fields, and actions. Geneograph board files, PNG export, and Tree transfer/import have focused files under `src/modules/geneograph/`.
- DOM rendering and event binding are largely imperative. This is an extracted multi-file application, but not yet a modular ES-module architecture or a persistent domain layer.

### Source of truth and lifetime

The prototype's project, person, relationship, note, media metadata, place, and board changes primarily mutate browser memory. Reloading restores the seeded experience rather than a saved account. Some interface preferences use browser storage; that is not project persistence. A downloaded `.ggboard` file is an explicit portable board snapshot, not autosave. Browser-local uploads and archive document imports have limited session lifetime unless exported through an applicable flow.

Use IDs and project scoping when resolving records. Derive display labels, counts, and links from canonical records where possible. Do not infer a stable domain field from a translated label or an inspector string. Board overrides are distinct from board defaults and from person data.

### Record ownership

| Record or state | Owner in the prototype | Important distinction |
| --- | --- | --- |
| Project and default person | Central sample-data graph | A blank project can be created in memory, but there is no account-backed save. |
| Person and family relationships | Project data | People, Profile, and Family Tree resolve shared IDs. A Geneograph card may display that person without owning the canonical Tree record. |
| Photo and album metadata | Project data | A project photo may be reused in profiles and boards. A board-only avatar asset has different scope. |
| Archive, note, and place records | Project data | Browser-local imported binaries have a shorter lifetime than their visible metadata. |
| Geneograph board and board-person records | Selected project | Multiple cards may refer to one board person. Nodes, connection routing, and board assets belong to the board. |
| Canvas/card/connection defaults | Geneograph board | Inherited appearance can change when a default changes. An explicit node or line override should not. |
| Active tool, selection, viewport, and open popovers | UI session | These are interaction state, not genealogy facts. Creation-strip choices are board-scoped and temporary. |
| Language and continuation preferences | Browser storage | Remembered UI preferences do not imply durable project data. |

When removing or replacing a record, inspect all references to its ID and the effect on both structured views and board views. When changing a board default, test inherited and customized objects separately. When editing a person photo, distinguish the project portrait, Geneograph board-person override, and an individual card's Photo visibility.

### Localization

`src/localization/` supplies ordered English/Russian translation data; `src/localization/runtime.js` owns language runtime and state. New visible actions, empty states, errors, tooltips, and accessibility names need both languages. Keep canonical data and machine identifiers separate from translated display text. Some older feature copy may still be literal English; localization completeness needs testing rather than assumption. The Russian dictionaries initialize at startup, and a duplicate key across UI blocks can prevent `RU_UI`/`RU_EXACT` construction and break the whole prototype. Run `node scripts/check-localization-catalog.cjs` after localization edits; the Pages workflow also runs it before publishing.

## 5. Shared application flows

**Projects.** A user can navigate projects and create a blank project in the in-memory model. The GEDCOM import chooser remains simulated; it does not parse a `.ged` file into people and relationships. Project settings, deletion, and continuation UI should be evaluated against the current in-memory lifetime, not described as account-backed services.

**Search, sorting, and selection.** People and other collections provide module-specific search, filters, sorting, selected items, and batch actions. Keep filter logic on stable record fields, preserve selection context when opening detail views, and show mixed values explicitly rather than silently taking the first selected object's value.

**Dates and places.** Genealogy dates may be exact, approximate, ranged, or unknown. Display and input logic should preserve the recorded value and uncertainty rather than treating every date as a JavaScript timestamp. Place references should be resolved through project or board context; a typed map result and a board-only place have different consequences.

**Modals and feedback.** Creation/editing dialogs stage input, expose a clear primary action and cancel path, and return actionable errors. Long lists scroll inside the modal while footer actions remain reachable. Tooltips and toasts support feedback but should not be the sole carrier of essential state.

## 6. People, Profile, and Family Tree

### People and Profile

The People directory presents project people with search/filter/sort and bulk operations. A person's role relative to the project's default person is derived from relationships, not maintained as a separate manually edited label. Profile brings identity, life facts, relations, photos, notes, places, and research connections together. Add/Edit Person uses the shared person model; changes can be reflected in other views of that record.

Names include given, middle, surname, and where recorded a maiden surname. Living status and life dates affect display and privacy-oriented copy. Portraits resolve a primary project photo where available and otherwise use initials. Photo selection and association are prototype interactions over the current in-memory data; they do not upload to a production media service.

### Family Tree

Family Tree is the structured relationship view. It uses layout and connector logic to render people, partner groups, parents, children, and family junctions. Card actions open the established person and relationship workflows. The tree and People/Profile views refer to the same underlying records. Tree geometry and relationship constraints are implementation-owned in `src/modules/family-tree/`; do not copy dimensions from the 2026-08 snapshot.

The Tree is not a GEDCOM engine. The existence of genealogical tags or import affordances does not mean round-trip GEDCOM parsing, validation, or export is complete.

## 7. Geneograph

### Board workspace

Geneograph has a board collection and editor. Boards support free-form placement, pan and zoom, selection and multi-selection, resizing, layering, grouping via panels, an inspector, and undo/redo for editor operations. Supported board objects include person cards, images, places, sticky notes, text, shapes, drawings, panels, and connections. A board may reference project entities or contain board-local content. The editor is a research composition surface, not a substitute for the structured Family Tree.

The toolbar exposes navigation/edit tools and split controls for Connect, Person, Notes & text, and Shapes. Connect, Draw, and Shapes can show short creation-setting strips under the toolbar. A strip changes subsequent creations on the current board; it does not rewrite existing objects or Canvas defaults. Its temporary state resets on board switch or reload.

### Person cards and board-person data

Person cards have four styles: Standard, Compact, Chart, and Portrait. Styles have separate formatting and displayed-information choices. Standard and Chart support left/right photo placement; Compact has no photo on the card; Portrait is photo-first. Board defaults and individual overrides govern appearance and layout. Gender-color application in the card inspector is a one-time snapshot of the relevant board palette, not a permanent lock to that palette. Reset clears resettable overrides while preserving card style and geometry.

The board person can use a project photo, a board asset, or a linked Tree-photo fallback; framing is stored as board-person crop data. An avatar choice updates all cards for that board person without changing the Family Tree photo. The card and inspector photo actions lead to the same staged picker/crop flow. Photo visibility on a particular card remains a separate layout toggle.

For card layout, treat style changes as a switch among saved style-specific settings. A Compact card's centered text should not overwrite Standard or Chart alignment. Show only information controls that affect the active style; in a mixed-style selection, expose only settings supported by every selected style. Standard has separate name and life-event alignment controls. Photo alignment applies to Standard and Chart only and is inactive when Photo is hidden, without discarding the chosen side.

### Canvas and object inspectors

With no object selected, the inspector edits Canvas appearance, default card appearance/layout, and default connection appearance. Canvas background patterns show visual previews. The object-highlight filter is view-only. Board card defaults can be neutral or gender-specific and apply to inherited properties; explicit card overrides remain independent.

Selecting one object shows identity controls in the header and relevant content, appearance, layout, and position/size sections. Person Card content has a profile-style hero, Edit, and Family Tree link flow. Images show source details and a replace action; image margins are transparent, and missing sources use a neutral placeholder. Other object types expose their applicable controls. Bulk person-card selection exposes appearance/layout controls with mixed states and a single Reset action; heterogeneous selection is more limited.

The inspector header provides rename, lock/unlock, and hide/show for an individual board object. A person card's Apply gender color command copies the current male, female, or unknown board appearance into editable overrides once. It remains available even if automatic gender coloring is off. The card Reset action clears appearance, formatting, and displayed-information overrides, but preserves style, position, dimensions, and sizing mode. Bulk edits should be one undoable operation and must change only the property the user touched.

### Connections and drawing

Connect can create visual lines and structured Family Tree relationships, with validity checked before committing a genealogical link. Visual line patterns include Solid, Dashed, Dotted, and alternating short/long dashes. The creation strip includes color, width, pattern, and visual arrowheads. Board connection defaults are inherited property by property; a selected connection can override or reset them. Arrowheads are visual only and are not stored for Family Tree relationships.

The in-progress connection preview snaps to a candidate socket. Relationship tips explain a valid partner, sibling, parent-child, or family-junction outcome; invalid targets show a reason. Empty-canvas right-click or double-click exits Connect mode, while object context menus remain available. Panning remains possible away from sockets.

Shapes and drawings have separate creation-strip settings, copied into new objects rather than saved as Canvas defaults. Inspector settings for an already-created object are independent of the active creation strip.

### Board files and export

`src/modules/geneograph/geneograph-board-files.js` validates and downloads editable `.ggboard` JSON and imports it into the current project. `src/modules/geneograph/geneograph-export.js` renders a board PNG for download, subject to browser image access and size limits. Board export/import is a real prototype capability, unlike generic project autosave. Validate board assets and project references when importing. Neither file format implies a server-side backup or collaboration model.

## 8. Albums and Archive

**Albums** organizes project photographs, album membership, associations to people and places, metadata, and primary portraits. It includes library and detail views, batch selection, photo/album workflows, and browser-local upload interactions. These update the prototype state; there is no durable media backend.

**Archive** organizes files, folders, sources, and linked research records. Browser-local document import supports PNG, JPEG, WebP, TXT, CSV, PDF, and DOCX, up to 20 MB each; imported file contents are available until reload. The document viewer has preview and download paths, using bundled parsing/sanitization libraries where needed. This is more than a visual mock, but it is not persistent document storage, OCR processing, or a production source-citation service. Record metadata and browser-local binary lifetime must be described separately.

## 9. Notes and Places

**Notes** supports project research notes and editor interactions, including links to relevant records. Quill supplies rich-text editing. The prototype should preserve safe rendering and distinguish note content from UI labels.

**Places** provides project place records and map-oriented browsing/search. Map tiles and geographic search depend on the configured provider and network, so map-unavailable states must not block non-map choices. The Geneograph Add/Change Place modal combines project places, map results, and a board-only option in one results list. Selecting a map result adds a project Place; choosing board-only does not. Merely typing a query never creates a place.

**Places map navigation:** Single-click a place in the Countries sidebar to select it; double-click to switch to map view (if needed) and center its marker within the unobscured viewport. Creating or repositioning a place with valid coordinates in the Places editor centers that marker after the map has reloaded, including while MapLibre is still initializing. Map loading/error notices are centered within the map panel and use a neutral List view escape action. If a place lacks coordinates, keep the manual position-editing path rather than guessing a location. The dark basemap is a locally hosted Liberty-derived MapLibre style; the light basemap remains upstream Liberty, and map colors stay separate from application theme tokens.

### Places maps and browser geocoding (issue #158)

**Two independent services:** MapLibre GL JS renders the interactive map with **OpenFreeMap** vector tiles; it does not search for place names. Autocomplete instead uses **Geoapify first**, then **LocationIQ** as a fallback. All provider requests originate in the visitor's browser, **not** a GeneoGraph backend. The provider used is deliberately invisible in the search UI.

**Search pipeline:**

```text
Places Add/Edit or Geneograph Add/Change Place
  → shared searchSharedPlaceMapResults(query, AbortSignal)
  → geneographGeocoder.search(query, signal, 5)
  → Geoapify autocomplete (primary)
      ├─ Valid matches → normalized place suggestions
      └─ No valid matches / timeout / network, authorization or quota error
           → LocationIQ autocomplete (fallback)
                 ├─ Valid matches → same suggestion interface
                 └─ No matches / failure → normal empty or unavailable state
```

A user-cancelled or superseded search **never** falls through to LocationIQ. Requests have individual timeouts, per-browser pacing and short failure cooldowns. The two search screens continue to display existing project places and manually entered or historical names; searching alone creates **no** place record. Successful external results use the existing `{ id, kind, name, primary, context, coordinates: { lat, lng } }` contract; place records retain their project-scoped IDs. A provider's modern location suggestion should not be treated as proof of a historical settlement's identity.

**Credentials and deployment:** `src/browser-config.js` deliberately contains `geoapifyKey: ''` and `locationiqKey: ''`. The GitHub Pages workflow reads **`GEOAPIFY_BROWSER_KEY`** and **`LOCATIONIQ_BROWSER_KEY`** from repository **Actions secrets** and writes them into the published `dist/browser-config.js` after copying `src/`. The deployed keys are **visible to every browser visitor**; GitHub Actions secrets protect *repository history*, not the deployed token values. Restrict keys in both provider dashboards to verified GeneoGraph referrers and monitor usage. No Worker, private API proxy or server-held credential exists.

**Fallback and limits:** Without allowed keys, network access or provider availability, the application still supports project-place selection, creating places with names alone, and entering decimal coordinates manually; `file://` remains a non-map workflow. Daily free allowances are **account-wide**, while this adapter only throttles **each browser instance**; it cannot enforce a global usage ceiling. Silent fallback improves reliability but does not guarantee extra usable quota. Both required provider links appear *beneath autocomplete suggestions* in both place pickers and again under **Settings → About → Data providers**, independently of the active provider. The map's OpenFreeMap/OpenStreetMap attribution is separate.

**Data and verification boundary:** There is no persistent raw geocoder response cache, and saved prototype place edits are still browser-memory-only. Any future durable genealogy store must document geocoded source attribution and honor each provider's storage/caching terms. Hosted EN/RU, historical-name coverage, referrer restrictions, failure/cancellation, credits and keyboard/mobile behavior require actual browser checks before merging; static adapter tests alone do not validate third-party API behavior. For exact deployment steps, quotas, terms, troubleshooting and manual QA, see [Browser geocoder setup](browser-geocoder-setup.md).

### Liberty-derived dark map style (issue #177; supersedes #163)

**Owned style:** `src/assets/map-styles/liberty-dark.json` is a static, versioned
dark adaptation of the **111-layer OpenFreeMap Liberty style**, not the older
OpenFreeMap Dark preset. Light mode still loads the original hosted Liberty URL.
`src/core/runtime-config.js` selects the relative dark style URL; the MapLibre
adapter resolves it against `document.baseURI` so GitHub Pages project
subpaths work. No runtime `PLACES_DARK_MAP_PAINT` or layer-ID-dependent
recoloring runs during `style.load`.

**Upstream provenance:** Based on
[OpenFreeMap Liberty](https://github.com/hyperknot/openfreemap-styles/blob/006ea5796803ba2df4330888836cb0a8f17473b4/styles/liberty/style.json)
at commit `006ea5796803ba2df4330888836cb0a8f17473b4`
(2026-10-25). The source's `__TILEJSON_DOMAIN__` placeholder is resolved
to `tiles.openfreemap.org`. Vector/raster tiles, hashed sprite and Noto
glyph endpoints remain on OpenFreeMap; label expressions and layer ordering
are unchanged, including non-Latin name fallback. No MapTiler assets,
additional keys or services are introduced.

**Cartographic ownership:** Edit the **paint properties in the style JSON**,
not the GeneoGraph v3 UI palette. Current dark direction (approximate hex
samples; judge on real rendered tiles):

| Feature | Dark Liberty color |
| --- | --- |
| Background / land | `#303C48` slate |
| Water | `#25536A` maritime blue |
| Parks / green areas | `#3B684E` botanical green |
| Major roads / motorways | `#A99A82` / `#BA9E78` muted warm sand |
| Minor roads | `#6E8392` steel blue |
| Buildings | `#4C5B68` blue gray |
| Cities / water labels | `#EBF0F4` / `#B1D7E5` |

The existing zoom-dependent road widths, casings, distinct route classes,
boundaries, building footprints, POIs, sprites and all 111 layer positions
are preserved. Low-zoom Natural Earth raster relief is darkened and reduced
in opacity so it does not wash out the background. User map markers,
selected/draft pins, approximate-location circles and route layers are
**application overlays**, created/recreated after style loading; do not
embed them into the basemap JSON.

**Credits and maintenance:** Preserve OpenFreeMap/OpenMapTiles/
OpenStreetMap map attribution on all supported views. The adapted style
retains the original Liberty [BSD-style code and CC BY design notices]
(../src/assets/map-styles/LICENSE.md). When updating upstream, compare
source layer IDs, order, sprite revisions, tiles, labels, and attribution
before porting the dark colors to the newer Liberty baseline. Never fetch
or introduce font assets into this repository.

**Visual approval gate:** Before merging, compare the *current light map*,
the previous dark map and this dark Liberty candidate at identical
positions/zooms: city streets, rural countryside, water/coast and parks.
Review EN/RU and Cyrillic labels, contrast of place names and boundaries,
attribution, selected/draft markers, route stops/lines, approximate areas,
and repeated light/dark theme switches on desktop and mobile. A static
JSON audit or palette chips cannot substitute for hosted MapLibre visual
QA. Founder approval of the actual rendered palette is required. Direct
`file://` still offers manual coordinates, not an interactive map.

## 10. Publish and other unfinished capabilities

`src/modules/publish/publish.js` contains a publication wizard and previews, but Publish is disabled in the active module navigation. Its export and draft confirmation paths are simulated; no real report, book, chart, GEDCOM, or GEDZip artifact is generated there. Do not list Publish as a working top-level module or mistake Geneograph PNG export for a general Publish pipeline.

Other important boundaries:

- No durable project database, account authentication, permissions, or collaborative synchronization.
- No real GEDCOM parser/import workflow or verified round-trip interchange.
- No production upload/storage service for photos and archive files.
- No general server-side map/geocoding authority; map rendering and geocoding rely on browser configuration and external providers; there is no private geocoding proxy.
- A local undo stack and a downloaded board file do not constitute project-wide persistence or backup.

### Capability and lifetime matrix

| Workflow | Current result | Persistence boundary |
| --- | --- | --- |
| Create a blank project or edit sample records | Changes the browser's in-memory project graph | Reload restores the seeded state. |
| Import GEDCOM | Opens a concept flow, not a parser | No imported genealogy is committed. |
| Edit a Geneograph board | Interactive objects, settings, and undo/redo | Current session unless an editable board file is downloaded. |
| Export/import a Geneograph `.ggboard` | Real validated board JSON download and current-project import | Explicit file transfer, not automatic save. |
| Export Geneograph PNG | Real browser-side image download | Static image only; it is not an editable board. |
| Add a browser-local Archive document | Real local preview/download path for supported formats | Imported contents are lost on reload. |
| Use Places map / autocomplete | OpenFreeMap map tiles plus Geoapify / LocationIQ browser search on a hosted origin | No durable search cache; availability depends on external providers, allowed referrers and connectivity. Manual place entry remains usable without them. |
| Use Publish wizard | Preview/simulated output interaction | No generated publication file. |

## 11. Responsive design and accessibility

The workspace spans desktop and narrow layouts. Toolbars may overflow, inspectors compress, and long modal result lists should retain reachable actions. On phones, creation strips remain one horizontally scrollable row. Use flexible columns for inspector fields, avoid clipping translated labels, and keep touch targets usable without overlapping canvas controls.

Semantic buttons, labeled icon actions, focus indicators, accessible names, selected/pressed states, Escape dismissal, and focus return are part of the interaction contract. Native button rows are preferred for searchable modal choices. Hover-only affordances need a keyboard and touch path. Canvas operations and visual connection feedback must not steal socket clicks or prevent pan. Respect reduced-motion behavior where provided. English and Russian both need layout and keyboard checks.

### Verification map

| Change area | Minimum checks |
| --- | --- |
| Shared person or relationship data | People, Profile, Family Tree, Geneograph link resolution, and project scoping. |
| Geneograph card presentation | Four styles, long names and dates, photo/initials/Photo off, inherited versus custom appearance, minimum and enlarged sizes. |
| Board interaction | Pan/zoom, selection, touch and keyboard controls, inspector, bulk mixed states, undo/redo, board switch. |
| Connections | Valid/invalid relationship targets, visual lines, all patterns, arrowheads, route editing, hover/focus feedback, right-click exit. |
| Media and files | Missing assets, local upload lifetime, board import/export, Archive preview/download, Cancel and reload. |
| Localization and responsiveness | English/Russian copy, translated label fit, 320px phone through desktop, focus order, open menus and modals. |
| Places geocoding | Geoapify primary, LocationIQ fallback on no matches/error/timeout, search cancellation, stale results, attribution in both pickers and About, credentials absent, quota/429, hosted referrers, `file://` manual entry. |

Use the verification map to choose focused manual browser checks. Inspect the console and exercise the affected workflow in English and Russian where relevant.

## 12. Engineering guidance

### OpenSpec adoption

OpenSpec is initialized here with Codex integration. Keep its config short and write focused change artifacts rather than copying this guide into every proposal. Current code and validated behavior remain the source of truth when older prose disagrees. Archive a change only after its implementation and checks are complete; the resulting specs should describe shipped prototype behavior, not aspirations. See `AGENTS.md` for the handoff convention.

1. Start at `src/index.html` and follow its load order. Change stylesheet/script order only after checking global dependencies and the actual CSS cascade.
2. Search targeted functions/selectors in the relevant feature file; several files are too large to inspect wholesale. Keep edits near the owning renderer and event bindings.
3. Reuse design tokens, icons, localized strings, shared media and paint controls, and established modal/inspector patterns.
4. Keep project IDs, board assets, person references, and per-property default/override semantics intact. A view-only choice should not mutate saved records.
5. Validate transitions, not only appearance: selection, Cancel, undo/redo, reload, import/export, missing assets, external-service failures, and mixed bulk values.
6. Inspect the browser console and run `git diff --check`. For structural changes, open `src/index.html` locally and exercise the relevant workflow at desktop and phone widths.

### Repository footprint and deployment safety

The prototype should not accumulate permanent scripts, test harnesses, or tooling for one-off investigations. Keep temporary checks outside the final PR unless they provide clear lasting regression protection; preserve existing valuable coverage for data integrity and recurring failures. Scope verification to the actual risk, report untested behavior, and keep unrelated cleanup separate.

Deployment and CI infrastructure are protected: **every change requires explicit founder approval**, including changes made only to run tests. Current Pages publishing, secret injection, and workflow triggers must not be altered as a side effect of product work. The detailed agent rules and PR cleanup gate are in `AGENTS.md`.

### CSS ownership

The CSS consolidation is complete. Edit styles in the owning `src/modules/<feature>/` or `src/shared/` stylesheet; shared tokens live in `src/core/foundation.css`, and shared picker controls in `src/shared/resource-picker.css`. Reconcile existing declarations directly instead of adding a trailing override or unnecessary `!important`. Preserve direct `file://` opening and check the load order in `src/index.html` when changing the cascade.

For shared or responsive changes, check the affected modules in English and Russian at desktop and phone widths, including focus and modal states. Run `git diff --check`. Automated checks should target meaningful regressions.

## 13. Production direction

The prototype is a substantial interaction reference, not a deployable production architecture. A product implementation should first define durable project-scoped schemas and stable identifiers, then extract and test pure relationship, date, place, board-validation, and appearance-resolution logic. Add persistence, authenticated access, media/document storage, and reliable import/export around those contracts. Implement GEDCOM and publication generation as separately verified pipelines. Keep English/Russian localization and accessible keyboard/touch operation as release criteria, not later polish.

Technology choices for a production client, backend, or database are not decided by this prototype. The old document's single-file extraction plan and prescribed stack have been superseded by the current multi-file static application; future architecture should be chosen against actual data and service requirements.
