# Proposal

## Why

The prototype’s dark and light UI colors are scattered across foundation tokens, module CSS, and JavaScript. That makes theme changes inconsistent and forces repeated color decisions. The approved GeneoGraph v3 palette provides a coherent source for both themes.

## What Changes

- Adopt the approved v3 light and dark UI values, including surfaces, text, interaction states, status colors, and the nine content accent families. Branded heroes use Heritage Green container and foreground roles, so they become pale green in Light and deep green in Dark.
- Keep a local, versioned copy of the palette in `src/` so direct `file://` opening works. Components use semantic roles or palette aliases, with no literal UI colors in module or shared styles and scripts.
- Migrate active app modules, shared controls, overlays, dialogs, SVG UI icons, and JavaScript-generated UI styling. Remove superseded color definitions rather than layering overrides.
- Add a focused repository check that detects new UI color literals outside the palette and documents how to add a color to the library first.
- Coordinate with the unfinished `add-light-theme` change; this change adopts v3 values after its theme behavior is in place and does not repeat its theme preference or board provenance work.

## Capabilities

### New Capabilities

- `ui-color-system`: Theme-resolved semantic UI colors and centralized color ownership for application components.

### Modified Capabilities

None; the repository has no established main specs yet.

## Impact

`src/core/foundation.css`, active module and shared CSS, UI color strings in classic JavaScript and inline SVG, `src/index.html` stylesheet order, and documentation. The external `E:\Geneograph\Documents\GeneoGraph-palette` package is the approved reference; implementation copies required production tokens into the repository. Authored Geneograph board colors, user-selected colors, image/SVG artwork, map tiles, and third-party styles are outside the UI-color rule. No runtime package, build step, or project data migration.

