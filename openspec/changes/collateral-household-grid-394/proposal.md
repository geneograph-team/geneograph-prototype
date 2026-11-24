# Collateral household grid experiment (#394)

## Status

The existing opt-in Family Chart preview attempts a family-context grid allocation before the old collateral placement pass. Classic remains default. Successful allocation is rendered by Family Chart's native SVG join without the legacy post-render connector correction. Unsupported or invalid candidates retain the preceding preview with an explicit localized notice, rather than stacking corrections. No permanent extra mode, schema or deployment change.

## Model

Collect visual family contexts from canonical families and occurrence-local native edges (including Add parent cards). Group same-generation partnerships into units. A child unit belongs exclusively to a household only when one visible family enters it; shared units are separately allocated and retain their edges. Orient the principal edge, traverse its partnership graph outward, recursively measure exclusive child envelopes, allocate family slots and pack region bounds across all occupied generation bands. Anchor the focused region and preserve clean native-only subregions as rigid shapes where possible. Assign inter-generation spacing, distinct ports and partner/child rail lanes before generating paths. Validate card overlap, connector interiors, unrelated coincident routes, false junctions and displayed graph connectivity before applying any geometry. Proper crossings are counted, not claimed absent. The extension owns geometry for the applied path; Family Chart owns cards, native SVG join, viewport and duplicate lifecycle.

Extended partnerships use below-card corridors rather than the earlier inline preference: provisional for founder review. Unsupported generation assignments, ambiguous contexts or invalid geometry retain the preceding preview and expose the reason in DOM/console. Fallback is an experimental comparison path, not a proposed permanent second solver.

## Evidence

- Initial isolated experiment `4cab673b`: 40 cases. This follow-up executes the actual patched Family Chart calculation and canonical adapter.
- 80/80 applied synthetic cases: one to five partnerships, single and bilateral hubs, shallow/deep, with/without children, both orientations. Verified canonical family/child endpoints, person coverage, deterministic output, unchanged fixture input and zero card overlap, connector/card interior hits, unrelated coincident segments, false junctions or disconnected occurrences. Maximum proper crossings: 8.
- Two ordinary no-collateral controls use the unchanged native path and match the preceding geometry.
- Additional probes in both orientations passed: separate family records for the same partners, and an additional single-parent family for a shared child.
- Isolated V8 source/bundle execution only; not browser/Node CLI. Actual SVG DOM, screenshots, imported founder case, pinned archive rebuild and localization CLI have not been verified.

## Remaining gates

- [ ] Reproduce the actual founder-reported imported case, compare final SVG and screenshots, review below-card extended links versus inline convention and remaining crossings.
- [ ] Expand asymmetric 1–4 additional partners per side, deep ancestors, spouse ancestry, same-partner/multiple-parent contexts, placeholders, native duplicate toggles and reconvergence. Verify supported/unsupported dispositions and no silently omitted relationship.
- [ ] Confirm unaffected native regions remain satisfactory; quantify necessary displacement, dimensions and dense-tree performance.
- [ ] Run repository Node checks, pinned archive rebuild, localization and browser/file:// QA in both orientations (focus/selection/edit/add, toggles, themes and depth changes).
- [ ] Founder review before adoption under #391/#388. Keep #394 active.
