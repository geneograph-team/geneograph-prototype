# Design

## Context

See [proposal.md](proposal.md). The v3 palette lives in `src/core/palette/geneograph-v3.css`; `src/core/foundation.css` maps `--surface-card` to `--gg-raised` across unrelated components. In Light, background, panel, and raised values are all near white. In Dark, filled rows and controls often share raised color. The palette checker restricts new first-party UI color literals outside the palette. `centralize-ui-color-palette` is complete in its change folder; `add-light-theme` still has a separate pending verification task.

Current Family Tree card rules are split between `tree-base.css` and `tree-refinements.css`: the later hover and selection declarations can mask the gender border. Shared chips also mix category foregrounds with unrelated translucent backgrounds, while the People heroes use `mix-blend-mode: screen` on artwork over pale Heritage Green.

## Goals / Non-Goals

**Goals:** Make the two themes feel related but individually balanced; make elevation correspond to component purpose; preserve all nine category accents; restore gender cues and visible artwork.

**Non-Goals:** Change theme preference, board-authored colors, genealogy semantics, uploaded media, map tiles, layout structure, data, or the palette checker’s content exceptions. Do not archive or complete another OpenSpec change as a side effect.

## Decisions

### Tune role values and consumers together

Keep neutral backgrounds and the existing accent families. Trial a softer, less white Light tonal ladder and a less filled Dark one in the palette, then correct component use of `--surface-main`, `--surface-card`, and `--surface-input`. Do not merely darken every token: if rows still use `--gg-raised`, they will remain too prominent. Treat tables and activity rows as part of their parent surface; reserve raised treatment for independent cards, floating menus, dialogs, and overlays. Prefer borders or very soft shadows over stacking nested bordered cards. Alternative considered: change only palette hex values; rejected because global `--surface-card` use would preserve the wrong hierarchy.

### Use role-specific chip colors

Map each `.app-chip--*` category to one palette accent family’s container, on-container, and outline roles. Status chips use status or neutral roles, not a content category by coincidence. Avoid transparent mixes for the resting chip container where the underlying hero or panel changes its appearance. Keep one shared size, shape, and state treatment; on-accent chips may need a distinct, opaque shared container role for readability. Alternative considered: per-module chip colors; rejected because identical content types would continue to drift.

### Separate gender identity from interaction rings

Use existing blue/cyan, rose, and purple accent families for male, female, and unknown gender respectively, subject to rendered contrast checks in both themes. Place gender color on the actual card border and selection/focus emphasis on a separate outer ring or shadow, so selected or hovered cards retain identity. Reconcile base and refinement selectors in their owning Family Tree styles instead of appending a final override. Alternative considered: selection replaces gender border; rejected because it recreates the reported loss of meaning.

### Adapt hero artwork blending by theme

Preserve the existing botanical image asset. Use a theme-aware opacity/blend or a palette-backed tint treatment so the tree remains visible on pale Heritage Green and deep Heritage Green. Keep the image behind content and away from the portrait/action area, including narrow layouts. Alternative considered: a new illustration; unnecessary for this styling correction.

## Risks / Trade-offs

- [A palette role change affects many modules at once] → Compare representative screens before broadening; review each owning stylesheet where semantic role use is wrong.
- [A stronger chip or border accent becomes too loud] → Review at normal viewing size alongside dense content, not in isolated swatches.
- [Muted text appears readable in token contrast reports but fails on composited surfaces] → Check rendered text, overlays, selected states, and hero artwork in both themes.
- [Existing CSS changes are uncommitted] → Preserve them and make surgical edits; inspect each touched file’s diff.
- [Light-theme QA remains pending in another change] → Keep that status separate and do not claim it passed from this change’s planning.

## Migration Plan

1. Record the current two-theme palette and representative screenshots; trial revised semantic tone relationships without changing the accent-family count.
2. Correct shared surface aliases and component ownership, starting with Projects, Family Tree, People, and Albums; inspect Geneograph, Archive, Notes, Places, and shared modals for the same role misuse.
3. Reconcile shared chip rules and gender card selectors, then adjust person hero artwork for each theme.
4. Check rendered states in both themes, English/Russian, desktop/phone; run the palette ownership check, focused static checks, OpenSpec validation, and `git diff --check`.
5. If rollback is needed, revert this change’s palette values and corresponding consumer mappings together; leave existing theme preference and authored content alone.
