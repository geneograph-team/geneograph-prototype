# Design

## Context

`src/core/foundation.css` holds a dark-only token set and forces `color-scheme: dark`; module styles also contain fixed dark colors. Global settings currently displays Theme as a read-only Dark row. Geneograph stores canvas, card, and connection colors in each diagram, but node and reset defaults also come from global functions. See `proposal.md` for motivation and the two delta specs for behavior.

## Goals / Non-Goals

**Goals:** Keep the static, direct-`file://` application and current dark visuals; make a complete light appearance with accessible control states; keep theme preference outside project data; preserve authored board appearance.

**Non-Goals:** A general user palette editor, recoloring explicitly authored board colors, compatibility with older unmarked `.ggboard` files, changing photo/map tile content, or adding a CSS framework or runtime dependency.

## Decisions

### Theme state and first paint

Store the preference (`system`, `dark`, `light`) in local storage, defaulting to `system`. Resolve System with `matchMedia('(prefers-color-scheme: dark)')`, falling back to Light if unavailable. Set a root theme attribute before styles paint, then set the matching native `color-scheme`. Listen for system changes only to update the resolved appearance while System is selected. Change the root attribute without calling the app's central `render()`, preserving modal and module state. The Global settings selector changes and displays the preference; English/Russian strings use the existing localization catalog. Use a separate key from language and guard storage access for local-file browsers that deny it.

### Paper & Forest color roles

Keep the present dark token values unchanged. Define the light equivalents at the same token layer: page `#F8FAF6`, primary surface `#FFFFFF`, sidebar `#EFF3EC`, input `#E7EEE7`, selected surface `#E4EDE7`, primary text `#17251E`, secondary text `#52635A`, and primary action `#1B6847` with white foreground. Add explicit semantic roles where one existing token serves conflicting light-theme purposes (for example, on-primary text, strong control outline, inverse hero foreground); do not repurpose the bright dark-theme accent as light-theme body text. Use theme-aware scrollbars, select chevrons, shadows, and focus colors.

Apply role tokens in `foundation.css` and shared controls, then reconcile fixed dark assumptions in each owning module stylesheet. Preserve dark green People and other branded heroes with local inverse-surface roles. Theme the surrounding Geneograph editor, modal, board library, Notes/Quill controls, and Places/Leaflet controls; map tiles and authored imagery remain content. Avoid a final override stylesheet and avoid CSS rules whose only purpose is to counter an earlier module rule.

### Board color ownership

Resolve the effective Geneograph defaults from the current interface theme. Keep the current dark defaults and define a light set: canvas `#F3F7F2`, neutral cards `#FFFFFF`/`#17251E`, male cards `#EAF3F8`/`#173047`, female cards `#F4EFF9`/`#382647`, sticky notes `#FFF2CF`/`#4F4326`, and connections `#526B5C`. Extend the theme defaults to text, shape, place, drawing, and other node types. New boards and newly created objects inherit the resolved defaults; a board does not retain the theme active at creation.

Store explicit color overrides with per-property provenance at canvas, board-default, object, and connection levels. Resolve each effective color as explicit value first, current theme default second. Record a user edit as explicit even when its value equals the active default; do not infer intent by comparing hex values. Existing appearance reset actions clear the relevant override and show the current default. Apply theme changes to effective defaults without rewriting explicit board data or disturbing board selection, viewport, and editing state. Creation tools that outlive a board or theme switch must resolve defaults at use time.

Update the Whiskerfield seed deliberately: mark default-looking colors intended to follow the theme as inherited and keep its authored palette choices explicit. Update `.ggboard` validation and import/export for this provenance model, ensuring a round trip preserves it. Older files without provenance need no compatibility path for this prototype change.

## Risks / Trade-offs

- [Fixed colors and translucent overlays assume dark surfaces] → Audit each active module and shared modal at both themes; move reusable colors into semantic tokens and keep named exceptions near owning styles.
- [Low contrast on light surfaces] → Check normal text at 4.5:1 and meaningful controls/focus at 3:1, including hover, disabled, selected, and Russian layouts; inspect actual rendered combinations.
- [Theme flash on reload] → Resolve and apply the stored preference before styles paint, compatible with `file://`.
- [Board defaults are partly global and tool state can outlive a board] → Resolve inherited values at use time from the current theme; verify theme and board switching, resets, seed behavior, and import/export.
- [Third-party UI and maps have their own CSS] → Adapt Quill and Leaflet controls in owning module styles without replacing the libraries or recoloring map tiles.

## Migration Plan

Treat a missing interface theme preference as System. Update the seeded board and current `.ggboard` format to carry color provenance; no migration or compatibility promise applies to older unmarked exports. Reverting the interface CSS and preference control restores the current dark UI only if the matching board default and provenance changes are reverted together.
