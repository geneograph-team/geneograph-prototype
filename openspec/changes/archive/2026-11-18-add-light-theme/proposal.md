# Proposal

## Why

The prototype currently forces a dark interface. A light appearance would make the research workspace usable for people who prefer lighter surfaces while preserving GeneoGraph's green identity and the existing dark experience.

## What Changes

- Add Paper & Forest light colors across the app shell, shared controls, active modules, dialogs, and auxiliary views. Retain dark green branded heroes as deliberate inverse surfaces.
- Let people select Dark, Light, or System in Global settings. System is the initial preference; an explicit choice persists across reloads and System follows device appearance changes.
- Let Geneograph canvas, object, and connection defaults follow the resolved interface theme on existing and new boards. Explicit user-set colors stay fixed; update the seeded board to distinguish inherited defaults from authored colors.
- Localize theme controls in English and Russian and update the repository's dark-only design guidance.

## Capabilities

### New Capabilities

- `interface-theme`: Theme preference, system following, and consistent light and dark interface presentation.
- `geneograph-board-theme-defaults`: Live theme-aware board defaults with persistent per-property color overrides.

### Modified Capabilities

None; the repository has no durable OpenSpec specs yet.

## Impact

Global settings and startup theme initialization; shared CSS tokens and module-owned color rules; Geneograph board defaults, seeded data, and editable board-file format; localization and design documentation. No runtime dependency or build step is added.
