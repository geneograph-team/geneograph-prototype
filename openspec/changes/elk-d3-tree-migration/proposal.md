# ELK/D3 Family Tree migration

**Status:** Approved product direction; target design for implementation, not current runtime behavior. [Umbrella #397](https://github.com/geneograph-team/geneograph-prototype/issues/397); architecture [#398](https://github.com/geneograph-team/geneograph-prototype/issues/398). Source baseline `0d1ed1347da14ccd9642d5ef98af8529fce1aa31`.

The founder accepted the integrated vertical ELK preview (#396), focus/duplicate experiment, card/date/zoom lab and branch-color lab on 2026-11-25. ELK is the target engine. Classic is not a required comparison or recovery mode. Remove it early after dependency audit, retaining temporary legacy helpers only with a concrete benefit and removal condition.

## Scope

Reuse canonical genealogy, commands, visibility projection and approved ELK layout. Separate occurrence projection from geometry; use one incremental D3-assisted HTML/SVG renderer with local thumbnail derivatives, both orientations, approved cards and branch coloring. Existing toolbar: Vertical / Horizontal / disabled Fan; Vertical default, orientation remembered per project. Preserve standalone Focus controls. Future Fan remains independent and out of scope. No new canonical schema, backup workflow, custom branch coloring, unrelated board changes, CI or deployment changes.

**Founder clarification:** discard the artificial displayed 0–200% zoom requirement. Use actual scale and screen-space dimensions; Fit and legibility determine supported bounds, not a synthetic display range.

## Evidence and related work

- [ELK preview design](../elk-tree-preview/design.md) and [verification](../elk-tree-preview/verification.md) describe the existing baseline and outstanding QA. Reuse that implementation, not an alternative provider.
- #399 occurrences; #400 renderer; #401 derivatives; #402 cards/date/zoom; #403 orientation/integration; #404 early Classic removal; #405 coloring; #407 final cleanup and acceptance.
- Approved standalone attachments: `elk-d3-focus-duplicates.html`, `geneograph-card-zoom-lab.html`, `geneograph-branch-color-lab.html`. Supply to implementation agents for visual comparison. The fixtures are reference evidence, not production integration tests. Decisions are recorded in the feature deltas and design below; exact palette reference also in #405.

Current verified specs remain current-behavior records until corresponding implementation and acceptance; the migration deltas supersede incompatible old target requirements. Preserve earlier preview verification, including unperformed checks. Reconcile preview and migration changes and archive only when verified, as required by [OpenSpec workflow](../../README.md).
