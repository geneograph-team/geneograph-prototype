# Collateral household grid experiment (#394)

## Status

Isolated calculation experiment; the application preview and bundled runtime are unchanged. This is not a production implementation or accepted replacement for Family Chart's calculation. The prototype consumes the same canonical family contexts and the native preview's occurrence coordinates as ordering inputs. It explores independent household regions only.

## Model

Group same-generation partners into units, order simple chains or a shared-person star, and assign a distinct family slot. Recursively measure all child units, including their descendants, before placing parent slots. Reserve conservative full-depth envelopes rather than individual row positions. Expand nonprincipal gaps when adjacent family territories would conflict. Allocate inter-generation corridors before generating orthogonal paths; extended partnerships use distinct below-card lanes and child rails attach to family-specific junctions. The calculation is orientation-independent; coordinates are cross/depth, not screen x/y.

This is a deliberate experiment: the extended-partner lanes are below cards, not the previously preferred inline presentation. Native rendering integration, preservation of unchanged native regions, occurrence-aware shared regions and a crossing treatment require review before adoption. A disconnected, repeated, reconvergent or unsupported graph is explicitly rejected rather than silently flattened. Separate family records for the same partner pair are also rejected pending distinct family ports. The algorithm does not use names or fixture IDs to position nodes.

## Evidence

Base: `4408c53c`. Executed the pinned D3 and Family Chart bundles, canonical validator and native input adapter in an isolated V8 runtime, then the exact experiment functions in `scripts/test-collateral-household-grid.cjs`.

- 40 fixture/orientation combinations: one to five partners, with/without children, shallow/deep collateral households.
- All passed candidate coverage, deterministic output, canonical input preservation, parent/child port mapping, no overlapping card boxes, no connector interiors through cards and no coincident unrelated rails in calculation geometry.
- Crossings still occur (maximum 5 per case). This is not a crossing-free layout; visual treatment and acceptability require review.
- Calculation timings in this isolated runtime: 0–1 ms, using millisecond resolution; not browser performance.
- Native CLI and browser QA not run. No actual SVG DOM or screenshots were produced; descriptor geometry is not evidence of final renderer behavior.

## Remaining gates

- [ ] Reproduce the exact founder-reported third-partner failure in final rendered baseline; compare actual SVG and screenshots.
- [ ] Test bilateral/asymmetric principal partnerships, spouse ancestry, placeholders, duplicate occurrences, same-partner distinct families, multiple parent families and reconvergence; extend with a boundary-aware model, not fallback geometry.
- [ ] Retain native direct ancestry/descendant placements outside affected regions and prove unchanged controls, interaction and both orientations.
- [ ] Decide inline vs separated extended partnership routing; validate final renderer geometry and independent footprint/port connectivity globally.
- [ ] Native checkout and file:// browser QA, dense fixture and performance comparison, founder review.

Recommendation: revise/continue the isolated experiment, not adopt it yet. Keep #394 and #391 active until the remaining material gates are met.
