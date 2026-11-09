# GeneoGraph UI palette

Approved base: `E:\Geneograph\Documents\GeneoGraph-palette`. The repository's v3.2 palette refines the neutral surface roles for this prototype. `geneograph-v3.json` is the machine-readable reference; `geneograph-v3.css` contains the matching runtime theme roles, excluding demo component rules and deprecated aliases. Keep both files in sync. The CSS loads locally before `foundation.css`, including through `file://`. Its select-chevron SVG role aliases use the theme text-secondary values.

This palette owns application UI colors. Authored Geneograph board colors, user-selected content colors, photos and artwork, map tiles, and vendor styles retain their own color data. New UI values require palette approval before use. Components consume semantic variables, never literal colors. Check JSON/CSS role consistency and validate changed color usage with the available tools and relevant browser QA; the earlier `scripts/check-ui-colors.js` and `scripts/ui-color-exceptions.json` are not present in this repository. An intentional new role using an existing approved value belongs here with documented meaning; a new color value requires user approval first. Archive document-paper styling is content presentation, not app chrome.

## Role map

| UI purpose | Palette role | App alias |
| --- | --- | --- |
| Page/workspace | `--gg-background` | `--surface-workspace` |
| Top navigation | `--gg-topbar` | `--surface-topbar` |
| Left navigation | `--gg-sidebar` | `--surface-sidebar` |
| Right inspector | `--gg-details` | `--surface-inspector` |
| Inset panel or modal | `--gg-panel` | `--surface-panel` |
| Raised card | `--gg-raised` | `--surface-raised` |
| Tip of the Day | `--gg-tip-background`, `--gg-tip-text`, `--gg-tip-link` | direct component roles |
| Field, hover, divider | `--gg-field`, `--gg-hover`, `--gg-border` | `--surface-field`, `--surface-hover`, `--surface-divider` |
| Life-status dots | `--gg-living-dot`, `--gg-deceased-dot`, `--gg-unknown-dot` | Used by Family Tree and Edit Person; independent of brand/action and archive colors |
| Wide table selection | `--gg-selected-row` | `--table-row-selected` |
| Currently inspected row | `--gg-selected-border` | `--table-current-marker` |

Light surfaces progress from a warm neutral workspace to clean sidebars, inset panels, and white raised cards. Wide tables use the sidebar tone so their large bodies do not read as raised cards. The Light Tip of the Day uses the Heritage Green container palette; Dark keeps the deep green accent.

Category families identify people, boards and education, photos, files, notes, places, events, sources, and publication in that order: Heritage Green, Creative Blue, Rose Sepia, Sepia Gold, Investigation Purple, Map Cyan, Chronicle Copper, Evidence Slate, and Print Magenta. Use `--gg-accent-<family>-*` for these identities. Use `--gg-status-<state>-*` for success, warning, error, pending, offline, favorite, and neutral states. Favorite currently reuses approved Sepia Gold values under its own role so its color can be controlled independently later. A missing source is a warning; a source record is Evidence Slate.

Edit shared control appearance in `src/shared/controls.css`, shared picker appearance in `src/shared/resource-picker.css`, and unique module styling in the owning module stylesheet. Change an existing rule directly rather than appending an override. For palette changes, compare JSON/CSS parity, inspect raw literals and unresolved tokens, and check critical foreground/background contrast. Use focused browser QA for actual cascade, focus, hover, disabled, and checked states; do not add a permanent checker solely for a one-off edit.

Migration note: `centralize-ui-color-palette` supersedes the Paper & Forest UI values and dark-in-both-themes hero treatment in the unfinished `add-light-theme` change. That change's System/Dark/Light preference and board color provenance remain. Heroes use Heritage Green container/on-container in each theme. Browser QA for `add-light-theme` remains independently pending.
