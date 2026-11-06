# Design

## Context

See `proposal.md` for motivation and `specs/ui-color-system/spec.md` for behavior. The static prototype loads `src/core/palette/geneograph-v3.css` before foundation and module CSS, including via `file://`. `src/core/foundation.css` aliases palette roles; shared and module styles also consume them. The supplied audit is a source review, not browser verification. The restored `src/core/palette/geneograph-v3.json` is version 3.1 while the current CSS is version 3.2: `node scripts/check-ui-colors.js` now reports 29 Light-theme foundation and Material-role mismatches. Other audit examples remain visible, including panel-colored workspace, missing variables, and mismatched Print Magenta foregrounds.

## Goals / Non-Goals

**Goals:**
- Establish an explicit, auditable mapping from a canonical paired palette to semantic UI roles and from those roles to component states.
- Complete the cross-module migration in one change while keeping module ownership of unique styling and preserving direct local-file loading.
- Check critical contrast and token resolution automatically, then verify computed states visually.

**Non-Goals:**
- Redesign layouts, typography, spacing, or data behavior.
- Recolor user-authored board objects, images, map tiles, document contents, or rich text.
- Activate Publish or add a build step, package manager, or runtime dependency.

## Decisions

### Canonical palette and role ownership

Treat the current v3.2 CSS as the approved value reference for this reconciliation. Update the restored v3.1 JSON's Light foundation and Material aliases to match it, add semantic roles present in CSS but missing from JSON (including the full-row selection role), and align version/direction metadata and README. Preserve matching Dark values and accent families unless a specific component review justifies a user-approved value change. The reconciled JSON becomes the canonical machine-readable list, while the plain CSS remains loaded by `index.html` for `file://`. Extend the repository check for CSS/JSON parity and references; it does not become a runtime generator. Alternative: overwrite the v3.2 CSS with older JSON values; rejected because it would undo the current approved palette. A new hex requires explicit palette approval, per repository convention.

### Layer roles without global replacement

Map top bar, left navigation, workspace, inspector, inset panel, raised card/modal, and field to distinct roles in foundation. Change root shells selectively; `--surface-main` also serves actual panels and cannot be globally replaced. Keep Dark neutral charcoal and Light warm neutral. The screenshot concern about overly white panels and dirty sidebars is addressed by role placement first, then contrast review of actual computed colors before changing approved values. Alternative: blanket replace legacy aliases; rejected because it would invert legitimate panels and create cascade surprises.

### Shared state contract

Define shared role aliases and opt-in styles for table surfaces, headers, hover, checked rows, currently inspected rows, focus, disabled, and dividers. Apply to People, Albums list, Archive files and Sources, and Places without forcing their DOM or column layouts to match. Keep batch selection and inspector-current distinguishable via a checked control plus leading/outline cue. Shared controls and resource pickers own common colors; module styles own genuinely unique arrangements. Alternative: separate per-module color rules; rejected because it preserves drift.

### Category and status separation

Use the approved nine accent families for content identity: Heritage Green for people/birth, Creative Blue for boards/education, Rose Sepia for photos, Sepia Gold for files, Investigation Purple for notes, Map Cyan for places, Chronicle Copper for generic events, Evidence Slate for sources, Print Magenta for publication identity. Global primary actions and selection remain Heritage Green. Warning/error/success/offline roles are separate. Correct every mismatched on-color reference by examining its actual background, including the disabled Publish source styles. Preserve Family Tree gender borders, timeline subtype colors, and explicit Geneograph paints. Alternative: tint selection by module; rejected because selection should mean the same thing everywhere.

### Verification architecture

Extend `scripts/check-ui-colors.js` (or a nearby focused checker) to reject missing palette data, drift, undefined non-runtime custom properties, and UI literals outside documented exceptions. Add targeted contrast calculations for critical token pairs; use browser computed-style and interaction QA for component states because static token checks cannot prove cascade outcome. Keep true runtime-injected board variables and content exceptions explicit. Review one module at a time during implementation, then run the full cross-module browser matrix once code is complete.

## Risks / Trade-offs

- [Large one-change migration can hide cascade regressions] → Commit work in ordered stages, compare affected selectors, run focused checks after each stage, and inspect both themes after code work.
- [Audit line numbers or claims may be stale] → Verify each cited selector in current source; the restored JSON mismatch has been confirmed by the existing checker.
- [Color role may not fit every component] → Keep narrowly documented semantic exceptions in the palette rather than local literal overrides.
- [A subtle divider can fail as the only control boundary] → Test meaningful boundaries and focus separately from decorative separators.
- [Publish is unavailable in the UI] → Correct source-level token misuse, but report its browser behavior as unverified rather than claiming visual QA.

## Migration Plan

1. Synchronize the restored older JSON to the current v3.2 CSS, then stabilize parity checks, unresolved tokens, and P0 foreground mismatches.
2. Add shared surface, table, control, picker, inspector, category, and status role contracts.
3. Migrate shell and table colors module by module, followed by content identity and form/modal edge cases.
4. Perform final Light/Dark, EN/RU, desktop/phone browser QA and contrast checks; update palette documentation and run `git diff --check`.

Rollback is a focused revert of this change's palette, shared styles, and module-owned edits; it has no persistent data migration.
