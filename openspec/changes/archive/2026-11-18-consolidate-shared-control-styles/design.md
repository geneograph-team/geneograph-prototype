# Design

## Context

`src/core/foundation.css` already defines `.button`, `.select`, and `.field` rules. Modules and shared feature styles repeat control colors, borders, typography, focus, and disabled treatments. CSS files are loaded by ordered links in `src/index.html`; the page must continue to work from `file://`. There is no build step or active browser test suite. The change moves existing declarations carefully and deliberately standardizes controls that still use browser defaults or divergent focus styling. Focused visual checks are the main verification.

## Goals / Non-Goals

- Give recurring buttons, icon buttons, text inputs, selects, checkboxes, and form labels one clear visual owner.
- Set a specific shared visual standard for recurring fields and dropdowns, including focus color and width, without changing their layouts or interactions.
- Leave view-specific placement, sizing, and genuinely specialized controls in their owning module stylesheets.
- Do not introduce a CSS framework, preprocessor, dependency, build step, JavaScript behavior change, or broad visual redesign.

## Decisions

### Shared control owner

Add `src/shared/controls.css` immediately after `src/core/foundation.css` in the explicit stylesheet order and before module styles. Foundation retains resets, tokens, typography, and general page primitives. Move reusable control visuals from foundation and module styles into the new file; do not leave duplicate declarations as a trailing override layer. Keep selectors class-based and opt-in so board handles, canvas tools, and other specialized elements are not accidentally restyled.

### Control contract

Use existing shared classes where they already express the control's purpose, including `.button` variants, `.common-select`, `.checkbox-row`, and `.field`. Establish a common icon-button treatment only for controls that share shape, padding, and interaction states. Add or adjust classes at targeted markup sites when that removes true duplication. Shared rules own visual properties and states: type, color, border, radius, background, hover, focus-visible, and disabled. Define one token-backed focus ring color and width for recurring fields and dropdown triggers; keep it visible for keyboard focus and do not rely on browser-default outlines. Module rules own layout, available width, responsive placement, and feature-specific variants. Avoid broad element selectors for all `button`, `input`, or `label` elements.

Treat native selects and recurring dropdown triggers as related but distinct primitives with a common visual baseline: control height, border, radius, surface, text, indicator spacing, hover, disabled, and focus ring. Apply the baseline to recurring fields and dropdowns currently using browser defaults or divergent focus colors or widths. Preserve native keyboard and open-menu behavior. A genuinely unique control such as Living status may use a named variant in its owning module stylesheet; its exception must be explicit and limited to the property that differs. Do not force custom menus, canvas controls, or photo-region tools into native-select styles. Use existing design tokens where possible; introduce a token only when multiple shared controls need the same value.

### Incremental migration

Inventory repeated rules, browser-default controls, focus colors and widths, and representative screens first. Migrate one family at a time: buttons and icon buttons; text/search fields and selects/dropdowns; checkboxes and labels; then shared modal/picker uses. For each family, move the actual owning declarations and remove redundant module declarations in the same patch. Preserve intentional differences as named variants or module-specific rules, rather than expanding a common selector until it becomes feature-specific. Review computed styles and interaction states after each family against the shared standard, and document any named exception.

### Documentation

Document the stylesheet ownership and class contract in existing repository guidance and the `src/` structure notes. Future shared control updates should edit `controls.css` directly; module CSS should not repeat its visual states.

## Risks / Trade-offs

- Moving rules earlier in the cascade can change specificity or expose later module selectors. Compare representative computed styles, inspect the stylesheet order, and remove or narrow conflicting declarations during each step.
- Standardizing a native dropdown can change its closed appearance across browsers. Check its indicator, clipping, keyboard operation, and open menu in supported browsers; avoid replacing native behavior with a custom widget.
- Russian text and phone widths can expose rigid control dimensions. Check both languages and narrow layouts, preserving responsive widths and accessible names.
- Some similar-looking controls have different semantics or interaction needs. Keep them module-owned where sharing would require complex exceptions.
- This increases the number of CSS links by one, but the ordered link remains compatible with direct local opening and reduces cross-module styling work.

## Migration Plan

1. Capture representative controls, browser-default dropdowns, field focus colors and widths, hover/disabled states, and modal layouts across modules as a baseline.
2. Add the shared stylesheet at the agreed load position, then migrate each control family with its redundant module rules removed.
3. Verify each family in English and Russian at desktop and phone widths; check direct `file://` startup and console after the stylesheet move.
4. Update repository style ownership guidance and run `git diff --check`.
5. If a family causes a regression, revert that family’s move and correct its selector contract before proceeding; retain the other verified families.