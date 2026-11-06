# GeneoGraph UI palette

Approved base: `E:\Geneograph\Documents\GeneoGraph-palette`. The repository's v3.2 palette refines the neutral surface roles for this prototype. `geneograph-v3.json` is the machine-readable reference; `geneograph-v3.css` contains the matching runtime theme roles, excluding demo component rules and deprecated aliases. Keep both files in sync. The CSS loads locally before `foundation.css`, including through `file://`. Its select-chevron SVG role aliases use the theme text-secondary values.

This palette owns application UI colors. Authored Geneograph board colors, user-selected content colors, photos and artwork, map tiles, and vendor styles retain their own color data. New UI values require palette approval before use. Components consume semantic variables, never literal colors. Run `node scripts/check-ui-colors.js` to enforce this. An intentional new role using an existing approved value belongs here with documented meaning; a new color value requires user approval first. Existing content-color exceptions are recorded exactly in `scripts/ui-color-exceptions.json`. Its Archive document-paper exception is content presentation, not app chrome.

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
| Wide table selection | `--gg-selected-row` | `--table-row-selected` |
| Currently inspected row | `--gg-selected-border` | `--table-current-marker` |

Light surfaces progress from a warm neutral workspace to clean sidebars, inset panels, and white raised cards. Wide tables use the sidebar tone so their large bodies do not read as raised cards. The Light Tip of the Day uses the Heritage Green container palette; Dark keeps the deep green accent.

Category families identify people, boards and education, photos, files, notes, places, events, sources, and publication in that order: Heritage Green, Creative Blue, Rose Sepia, Sepia Gold, Investigation Purple, Map Cyan, Chronicle Copper, Evidence Slate, and Print Magenta. Use `--gg-accent-<family>-*` for these identities. Use `--gg-status-<state>-*` for success, warning, error, pending, offline, favorite, and neutral states. Favorite currently reuses approved Sepia Gold values under its own role so its color can be controlled independently later. A missing source is a warning; a source record is Evidence Slate.

Edit shared control appearance in `src/shared/controls.css`, shared picker appearance in `src/shared/resource-picker.css`, and unique module styling in the owning module stylesheet. Change an existing rule directly rather than appending an override. `scripts/check-ui-colors.js` checks JSON/CSS parity, raw literals, unresolved tokens, and critical foreground/background contrast. The probe commands `node scripts/check-ui-colors.js --check-token-text` and `node scripts/check-ui-colors.js --check-pair` intentionally fail and are for checking that the checker catches a missing token and a low-contrast pair. Browser QA remains necessary for actual cascade, focus, hover, disabled, and checked states.

Migration note: `centralize-ui-color-palette` supersedes the Paper & Forest UI values and dark-in-both-themes hero treatment in the unfinished `add-light-theme` change. That change's System/Dark/Light preference and board color provenance remain. Heroes use Heritage Green container/on-container in each theme. Browser QA for `add-light-theme` remains independently pending.
