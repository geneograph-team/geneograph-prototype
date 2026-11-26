# Design — presentation boundaries and contracts

**Migration target.** The approved vertical ELK layout is already the sole provider after #404. The remaining architecture below describes later work. The names below describe minimal contracts, not mandated new global bindings or a generic framework. Preserve the static, classic deferred-script application and existing project commands.

## 1. Current code and migration boundaries

| Current source under src/ | Observed baseline | Target |
| --- | --- | --- |
| `core/state-tree-core.js`: treeProjectViewState, buildFamilyTreeProjection, deriveTreeBranchRoles, navigateFamilyTreeToPerson | Project-local view, canonical selection, focus/depth/cousin context and command routing | Retain semantic rules; detach context and preferences from geometry |
| `core/app-shell.js`: render and navigation capture/restore | Calls renderFamilyTree; disposes the ELK request on exit; captures focus, selection, zoom and scroll | Own presentation lifecycle and semantic navigation |
| `modules/family-tree/tree-elk-preview.js`: prepareElkTreeInput, treeElkLayoutForProjection, adaptElkTreeLayout | Anonymous solver IDs, cached graph key, DOWN solve, derives generations, adapts geometry, Retry after failure | Both orientations, revision-owned scene, explicit retry/error |
| `modules/family-tree/tree-elk-model.js`: projectElkTreeOccurrences, solveElkTree | Independent occurrence projection with one visible ancestry owner, compound layout and final routing | Keep semantic context available for #405 and reuse approved geometry |
| `modules/family-tree/tree-view.js`: renderFamilyTree, renderTreeLines, renderTreePersonCard, renderTreeFocusControl, treeDetailLevel; `tree-scroll.js` | Rebuilds main HTML, binds events, DOM-dependent centering, synthetic zoom mapping | Incremental renderer, scene-based viewport/search, actual scale and six detail stages |
| `modules/albums/filters-avatar.js`, `photo-layout-and-crop.js` | Compact avatar uses original photo.src; face positioning scans on scroll | Shared local derivative service; only visible portrait demand |

See [current source map](../../../doc/source-map.md) and [preview design](../elk-tree-preview/design.md). Verify existing consumers before removing helpers, including board transfer, inspector and relationship commands. Do not change canonical validation, data adapters or cross-module commands merely to accommodate the layout.

## 2. Dependency direction and lifecycle

```text
canonical records and existing validation/mutation commands
    -> detached project semantic context and relationship indexes
    -> presentation host (project, focus, selection, commands)
        -> Tree visibility and occurrence projection
        -> ELK provider -> final scene
        -> D3 HTML/SVG renderer and viewport
        -> local thumbnail service (visible portrait demand)
        -> semantic branch projection -> display style overlay
```

Branch projection reads the full project index and occurrence provenance, not layout; its style overlay cannot affect placement. Commands flow back through the host to existing canonical commands; layout and renderer cannot mutate genealogy or infer parentage from coordinates. The host owns shell, toolbar, inspector and navigation. Vertical and Horizontal configure one Tree provider, not separate hosts. Future Fan may share canonical context, commands and semantic coloring, but owns radial projection, scene, viewport and renderer; it does not implement Tree's rectangular scene. No speculative registry or generic geometry adapter.

Conceptual lifecycle: mount(container, context, preferences, commands), update(detached context, classified changes), dispose(). Mount once per project/presentation; targeted selection and style updates must not replace the viewport. Capture compatible viewport bookmark before leaving; invalidate old session and dispose solver transport, listeners, pointer capture, frames, transitions, thumbnail subscriptions and stale tasks. Empty project uses the existing first-person action without solver.

## 3. State ownership

| Owner | Data / lifetime |
| --- | --- |
| Authored project | Stable project-scoped person/family IDs, names, structured dates/status, partner slots, child memberships and parentage types, facts/evidence, media/crops. No visual geometry, occurrence IDs or color assignments. |
| App navigation and host | Active project/module, canonical selection, semantic focus and history intent, recents, inspector and action routing. Validate active-project targets. |
| Project-local view preferences | Existing state.treeProjectViews[projectId]: focus, depth, cousins, orientation, color reference/preset/collateral and channels, expansion preference by context, compatible viewport bookmark. Remember within existing prototype state conventions, not new storage/backup schema. |
| Presentation session | Session/revision, pending request, bounded geometry cache, scene, preferred occurrence/anchor, transform, mounted elements, diagnostics, image subscriptions. Derived and disposable; never serialize into genealogy or board. |

Default Vertical; branch reference independent of focus. Initialize reference from valid project default or neutral if none; after deletion validate/recover within project. Map existing colorFill true to Gender fill + Gender outline, false to Neutral fill + Gender outline, neutral connectors. Branch preset default 4, collateral off; don't silently change existing gender settings. Preserve focus/selection/depth and compatible expansion preferences on orientation switch. Center on explicitly acted-on occurrence or deterministic primary occurrence, then valid focus if removed; never depend on mounted DOM for lookup. Selection of a visible person highlights all occurrences, does not change focus or trigger layout. Navigation outside visible scope may change focus as existing commands do. Separate Focus buttons retain visual treatment and eligibility.

## 4. Detached boundary contracts

Use ordinary data and maps; no framework or new canonical fields. Detach arrays/records used in asynchronous work. Read fresh canonical display content on updates; solver output must not carry stale person copies.

| Boundary | Required information and invariants |
| --- | --- |
| Semantic context | Project ID, canonical records/indexes, explicit family IDs, ordered partner slots, child IDs, parentage, relevant relationship style, topology/content revisions or equivalent fingerprints. Full project context for branch assignment. |
| Visible projection | Focus, visible person/family IDs and filtered memberships; existing branch roles, actual missing-parent presence and Focus eligibility. |
| Occurrence projection | Stable occurrenceId, canonicalPersonId, context family IDs/path provenance, primary/expanded flags, count, known-collapsed vs absent ancestry; projected families with canonical familyId and occurrence endpoints; placeholder canonical target and parent slot; generation constraints and diagnostics. |
| Layout request | Session/project/revision; DOWN or RIGHT; fixed upright card, placeholder and standalone Focus footprints, occurrence/family/edge IDs, port constraints and versioned layout config. Map to request-local opaque solver IDs outside ELK. |
| Geometry result | Finite normalized scene bounds, rectangles for cards/placeholders/controls, stable occurrence/family IDs, final orthogonal connector segments with stable keys, family/endpoint occurrence IDs, role/style and junction/underpass metadata, diagnostics, request identity. x right, y down, unscaled CSS-layout units; bounds include controls and paths. |
| Render snapshot | Current scene, current canonical content keyed by ID, selected/focused IDs, occurrence flags, localized detail/date model, occurrence/family style overlay, viewport and action eligibility. DOM keys are visual IDs; edit/add/inspector/board commands use canonical IDs; specific family/expansion actions use explicit context IDs. |

Occurrence IDs derive from canonical ID and deterministic family/context identity, not coordinates, iteration index or name. Preserve separate same-pair family records and every explicit visible membership. #408 permits a canonical family to have several stable visual instances when its sibling branches reconverge. These instances partition child memberships and repeat both known parents as a couple, or the sole known parent of a single-parent record. Display styles continue to use the canonical family ID. Detect reconvergence across co-parent contexts with common descendant path, not merely multiple partners. One occurrence owns visible upstream ancestry; transfer ownership via context preference without canonical mutation. The approved fixture used fixed generation labels: derive actual constraints from projected edges, partners same layer and parent-child step, validate components and cycles. Distinguish missing from known-collapsed or out-of-scope ancestry; no false Add parent action. Overlapping contexts, alternate parent records or incompatible generations may need founder policy; diagnose rather than merge, fabricate or silently discard facts. Use bounded traversal/memoization rather than unbounded path unfolding.

## 5. ELK and connector ownership

Reuse approved compound unified, balanced Brandes–Köpf at all levels, compact inline primary couples, secondary gap junction alignment, dynamic child midpoint spacing, unified rails. At most two solves; first determines bounded additional spacing. ELK owns generation, compound geometry and initial placement. Select one principal partnership per connected visible occurrence group relative to the focus: direct ancestral households first, then proximity to the focus and visible children, with stable input-order ties. Establish preferred principal/parent-slot input order and paternal-before-maternal ancestral household input order. For a simple real-person partnership path with a secondary partner on both sides of the principal relationship, orient the family junction input order along that path from the first principal partner to the second; preserve the existing person input order, native secondary placement freedom and distinct family records. Branching, cyclic and placeholder groups retain ordinary native preferences; request root-level NODES_AND_EDGES model-order preference and native bottom-up hierarchical sweep (-1) at the root and compound groups. Do not force model order or set the preference on compound children (ELK 0.12.1 errors). ELK owns partner placement; no post-solve partner permutations. Report unsatisfied ordering preferences by relationship without invalidating otherwise valid geometry. Secondary real-partner placement remains flexible. The prior preferred-ordering decision remains the diagnostic fallback while the founder-authorized #411 draft-branch experiment targets strict principal ordering. Bottom-up sweep is a native heuristic, not a strict guarantee; secondary real partners remain flexible. Acceptance requires broader regression and founder visual verification. Then guarded ancestry-first refinement may rigidly translate an ordinary family group along the cross axis toward the midpoint of its two distinct known parental families. Descendant groups follow only when all their visible incoming families move together. Keep shared partnership blocks and placeholder groups fixed during ancestry-centering translations. Preserve row alignment, partner order and internal spacing, external group order and required clearance. Process oldest first; reject a candidate if any other measured couple's centering worsens or the existing inline router fails or adds connector/card conflicts. The native inline scene is retained on rejection. Presentation routing consumes the accepted coordinates only; no second router or extra ELK solve. Preserve relationship line styles and distinct family records, one-parent handling, underpass decoration; native route fallback only with diagnostic for unrepresentable inline geometry. Validate finite bounds, correct endpoints and membership coverage, no unrelated card hits, false junctions or coincident unrelated strokes; measure crossings without claiming planarity. Map generation/cross-axis and port sides for orientations, not rotate text or use second solver. Reference footprint 300 × 124; actual card/control/placeholder metrics are geometry input.

Keep pinned local ELK 0.12.1 and separate frame/provenance/license per preview design. Exchange anonymous graph JSON, not names or media; check message source and correlation, timeout and clean up. Promise/message scheduling does not guarantee off-main-thread execution; current bundle can block. #403 measures both passes and evaluates compatible local worker only if justified. Maintain file://. #400 pins local D3 7.9.0 reference version, license/provenance/checksum, no CDN/build step.

## 6. Invalidation and async ownership

| Change | Required update | Layout |
| --- | --- | --- |
| Project/module switch | Dispose session; mount new | New if needed |
| Topology/relevant parentage, focus, depth, cousins | Projection/occurrences; color index on topology | If effective geometry input changes |
| Expansion owner, orientation, fixed geometry metrics | Update occurrence edges/constraints or geometry | Yes |
| Selection, inspector, search query, recents | Targeted content; explicit focus change uses focus rule | No |
| Names, dates, status, display-only relationship style, photo/crop revision | Content/style/image update in fixed bounds | No unless structural control or metric changes |
| Branch reference, preset, collateral | Recompute full-project branch index and occurrence overlay | No |
| Fill/outline/connector, theme, language, detail stage | Style/content/visibility | No |
| Pan, zoom, resize, fullscreen | Transform/culling/stage; anchor or fit | No |

Geometry key includes project, effective ordered topology/visibility, focus/depth/cousins, expansion context, orientation, metrics and config version; never just counts or display text. Stable serialization/revisions with equivalent correctness; one current geometry cache, bounded additional entries only with measured benefit. Content/style/image caches independent. Distinct session token and monotonically increasing revision; cancel superseded transport where possible, check session/project/presentation/key/revision before and after each await/pass and before publishing. Discard stale success AND error. Coalesce rapid structural changes. Pending scene explicitly marked stale if retained and commands cannot target removed records; otherwise loading. Empty is valid result. Localized diagnostic and Retry for current failed input, no Classic fallback. On dispose cancel frames, timers and message handlers; avoid stale media callbacks. Test repeated/out-of-order results, cancellation, failure, re-entry and project changes.

## 7. Renderer, zoom and thumbnails

One D3 transform shared by SVG and HTML. Keyed enter/update/exit for cards, controls, placeholders, segments; reused keys update geometry and content. Cull using scene viewport and bounded overscan including crossing segments whose endpoints are both offscreen. Profile before spatial index. Search, keyboard traversal, fit and centering use full scene. Mount/scroll target before keyboard focus; keep focused node briefly if needed, recover focus explicitly. Coalesce frame updates, preserve anchors on wheel/pinch/pointer, support keyboard, resize, fullscreen and reduced motion. Wheel zoom remains available over canvas cards, placeholders and action buttons; button/link drag starts, native form controls, editable content and layout status controls remain excluded as appropriate. No per-gesture layout.

**Zoom:** actual scale (100% = 1:1), not remapped 0–200%. No fixed displayed upper/lower endpoint. Keep positive finite bounds based on usable scene/controls, allow genuine Fit of whole scene and marker overview; handle empty/very large scenes, no clipping or jump from stage changes. Use actual on-screen card dimensions for detail and hysteresis; thresholds in delta are lab starting values. Keep scene footprint stable; preserve full accessible identity and inspector when actions hide. Exact scale limits and default viewport anchoring are implementation tuning, not new product requirements.

Thumbnail service owns source revision/crop/rotation/size/DPR keys, visible demand, bounded decode queue/cache by bytes and entries, reusable object URLs/bitmaps, release and invalidation. Rectangular 3:4 Tree portrait cropped without stretching, only Full/Short demand; no original source fallback in compact avatar. Shared compatible consumers may use their own aspect ratios. Do not change full photo viewer/editor or original bytes. Cancel/ignore obsolete subscriptions, isolate projects, test crop edits and duplicates. Do not persist derivatives or change storage unless separately justified.

#401 keeps the current square card footprint. The renderer requests a portrait only when its DOM bounds intersect the actual viewport at a portrait-bearing detail level. It selects a 128, 256, or 512 px longest-edge tier using the displayed size and DPR. The bake accepts a 3:4 aspect for #402. The cache keys on project, canonical photo, immutable source token, effective normalized region or crop, aspect and tier. It rechecks canonical inputs on content revisions. Duplicate occurrences share an entry when their effective inputs match.

One mounted project Tree owns the cache. It allows up to 200 entries, 24 MiB of encoded derivatives and 48 MiB estimated decoded derivative pixels. Active URLs are protected from eviction. Two source jobs can run concurrently across disposals, with a 16 Mi-pixel limit per source and at most one 512 px canvas per job. Known oversize sources are rejected before decode. For unknown or inaccurate metadata, the browser may allocate the first full decode before dimensions can be checked. Browser-internal decode and encode buffers are outside the application estimates. Work is in memory. The cache drops queued demand when its last lease leaves, ignores abandoned completions, remembers failures while the key remains cached, and revokes URLs after release or eviction.

Edge under direct file opening can read imported data/blob photos into the canvas. Canvas export for packaged file-backed images is blocked by the browser and those cards retain initials. Locally serving the same files lets packaged photos generate derivatives. The original viewer and editor still use their existing sources.

## 8. Delivery and verification

#398 defines boundaries; #404 removed the Classic solver, connector generator and toggle. Shared geometry and rendering remain active because the ELK adapter and viewport use them. #399, #400, #401, #402 and #405 may proceed where contracts permit. #403 integrates orientations and actual visual/behavior tests; #407 removes remaining legacy renderer/viewport/CSS/strings, verifies single runtime path and reconciles docs/specs. No deploy/CI changes.

Use existing reference fixtures, 52-person expanded-ancestry fixture, Whiskerfield, private import (not committed), #381 internal stress project (mandatory separate removal before open user testing). Verify canonical coverage, generation conflicts, geometry, selection without layout, color/focus/orientation invariance, offline browser, EN/RU, both themes, keyboard/touch, actions/placeholder correctness, cancellation and project isolation. Measure layout passes, DOM render, interaction timing, mounted counts, thumbnail decode/cache separately; report actual numbers and limitations. The earlier preview verification is historical evidence, not new QA. No implementation or browser validation claimed by #398.

## Incremental vertical Tree renderer (#400)

The Tree shell lives for one mounted project view. ELK results provide scene geometry and stable occurrence and family keys. D3 7.9.0 is vendored under its ISC license at `src/vendor/d3-7.9.0`. The npm tarball SHA-256 is `7E36605710A2BA54846797C8C6D888911341B215AE53257DC32A49A0B824355E` and the bundled script SHA-256 is `F2094BBF6141B359722C4FE454EB6C4B0F0E42CC10CC7AF921FC158FCEB86539`.

A single camera transform applies to HTML cards and SVG paths. Camera frames join entities within the viewport and a 96 CSS pixel margin. Full-detail portraits are requested when the portrait's card intersects the actual viewport. Fit includes cards, controls and connectors. Actual scale thresholds carry forward the existing display tiers at 28%, 64% and 88%. Selection of a visible occurrence updates the mounted highlight and inspector using the active scene. Changes to focus, project, or visibility settings follow the existing layout request lifecycle.

Connectors share straight segments at family junctions. Eligible elbows use up to 10 layout units of rounding, limited by adjacent segment lengths and clearance from other scene geometry. Existing partnership styling and crossing treatment apply to the keyed paths.
### Production card stages (#402)

The 300 × 124 card geometry is stable. Full, Short, Compact, Actions-only and Label require both approved dimensions. Their exact scale boundaries are 278/300, 228/300, 174/300, 46/124 and 48/300. There is no hysteresis. The four action-bearing stages use 28, 32, 42 and 66 layout-unit target sides, each providing at least 24 CSS pixels at its minimum scale. Standalone Focus keeps its existing anchor and visibility above 60%.

The portrait slot is 54 × 72 layout units. Initials switch to one below 44 rendered CSS pixels of width. The Tree holds the last decoded derivative while another tier for the same subject and crop is pending or fails. Returning after Compact can reuse a ready compatible tier. A source or crop revision releases the earlier derivative. The existing structured date model supplies card date variants and accessible detail. Card category and placeholder tint custom properties are available for #405.

### Progressive branch colors (#405)

Canonical biological father and mother role hints feed the bounded project graph. The resolver uses four fixed splitting levels and visited person and slot states deeper in the graph. Project session preferences retain a reference independent of focus and migrate legacy fill without changing the outline and connector defaults. An absent or deleted reference resolves to neutral and can be replaced in settings.

The graph is revalidated after a committed edit. Visual parent and child endpoints carry branch attribution separately from ELK geometry. Ambiguous appearances and merged routes stay neutral. Color-only saves patch keyed nodes and the legend. Theme palettes are CSS tokens and initials mix 33% into the neutral surface.
### Collateral descendant visibility (#409)

The visibility projection seeds the focus, its eligible siblings, and eligible aunts and uncles together at distance zero. A breadth-first walk through indexed child families gives the first visit the largest remaining budget. Partners are admitted without adding them to the traversal frontier. Each family records its allowed child memberships independently of overall person visibility, so an independently visible person cannot restore an excluded child edge.
### Horizontal and project presentation settings (#403)

The shared Tree adapter selects ELK DOWN or RIGHT, carries orientation through the request and routes, and keeps the last completed compatible result per orientation. Async results are published only by the active request. Camera bookmarks match the full layout key and stay in session view state. Project-local browser storage holds only committed orientation, depth, cousins and color settings. Default ancestor depth is five and the supported range is zero through eight. Missing or invalid settings fall back safely.

The shared geometry contract defines a 40-unit nominal ordinary partner gap for real and placeholder pairs. In Vertical, paired missing-parent widths are (regular card width − gap) / 2 and their height equals the regular card height (130 × 124 each); in Horizontal all placeholders use full regular card dimensions. Reserve actual dimensions in the solver input; preserve topology-dependent extra spacing and existing control clearance. Inline divorced/separated partner fragments share the 10/8 dash phase at the physical direct gap midpoint, or the existing routed junction for extended relationships. The secondary floor remains max(80, 40) and the first-pass dynamic deficit retains its existing bound. The principal relationship is chosen relative to the focused occurrence as described above. Ordered ports on principal mixed-gender junctions and missing-parent slots request the preferred order; native bottom-up sweep and ancestral input ordering replace any earlier partner-permutation experiment. Remaining diagnostics identify affected people and the reason through an expandable localized warning, resolving anonymous layout IDs only in the application. Horizontal cards reserve the existing Focus control height plus its gap through individual node spacing. Rendering still consumes final coordinates.
