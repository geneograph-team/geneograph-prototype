# Proposal

## Why

The shared palette exists, but components still assign its colors to inconsistent roles. This makes both themes hard to tune and produces mismatched elevation, selection, content accents, and text contrast across modules.

## What Changes

- Establish one semantic color contract for application surfaces, controls, tables, inspectors, pickers, content categories, and status states in Light and Dark themes.
- Reconcile palette CSS, JSON, and documentation; replace unresolved variables and mismatched foreground/background pairs; add focused automated checks for token references and critical contrast pairs.
- Migrate the full UI in Projects, Family Tree, People, Geneograph, Albums, Archive and Sources, Notes, Places, shared workflows, and the disabled Publish source styles in this change. Keep module layouts and authored content intact.
- Preserve the approved accent families and neutral-charcoal Dark direction. Use Heritage Green for shared actions and selection, and distinguish content identity from warnings, errors, success, and disabled states.
- Verify both themes across English and Russian, wide and narrow screens, hover, selection, keyboard focus, forms, modals, and empty states.

## Capabilities

### New Capabilities

- `ui-color-system`: Theme-dependent UI roles and their consistent use across application modules and shared components.

### Modified Capabilities

None. The repository has no main OpenSpec capabilities yet.

## Impact

`src/core/palette/`, `src/core/foundation.css`, shared control and picker styles, module-owned styles and relevant category classes, palette checks, and documentation. No framework, build step, data-model migration, or new runtime dependency. Explicit Geneograph board paints, uploaded images, map tiles, cover art, and authored rich text remain content colors.
