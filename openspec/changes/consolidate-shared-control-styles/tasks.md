# Tasks

## 1. Baseline and shared owner

- [ ] 1.1 Inventory repeated button, icon-button, input, select/dropdown, checkbox, and label selectors plus browser-default dropdowns and divergent field focus colors or widths; record representative desktop/phone, English/Russian controls and their hover, focus, disabled states for comparison.
- [ ] 1.2 Add `src/shared/controls.css` directly after foundation in `src/index.html`, move existing reusable foundation control rules there without duplication, and verify the page opens from `file://` with unchanged representative controls and no new console error.

## 2. Buttons

- [ ] 2.1 Consolidate recurring button variants and icon-button visual states in the shared owner, updating only matching markup and removing duplicate module declarations; verify primary, secondary, danger, icon, hover, focus, and disabled examples across affected modules in both languages.
- [ ] 2.2 Keep specialized canvas and image-editing controls module-owned, and verify their appearance and interactions remain unchanged at desktop and phone widths.

## 3. Fields and selections

- [ ] 3.1 Define and apply the shared field and dropdown visual standard (height, border, radius, surface, typography, indicator spacing, hover, disabled, and one token-backed keyboard focus color/width) to recurring text/search fields, native selects, and dropdown triggers, including those still using browser defaults; remove duplicate module declarations and verify search, selection, native open-menu behavior, focus, and narrow widths.
- [ ] 3.2 Identify genuinely unique dropdowns such as Living status, encode only their necessary differences as named module-owned variants, and verify they retain the shared focus standard and keyboard behavior.
- [ ] 3.3 Consolidate reusable checkbox and form-label visuals, preserving accessible names and mixed/disabled states; verify representative single and bulk selections and form labels in English and Russian.

## 4. Shared dialog adoption and guidance

- [ ] 4.1 Apply the common controls to matching modal and resource-picker controls, remove their redundant visual rules, and verify affected dialogs, upload/picker flows, focus states, and phone layouts without changing their actions or dimensions.
- [ ] 4.2 Document control class usage and stylesheet ownership in the existing repository/source-structure guidance; verify the guidance points to the actual shared file and states that modules retain layout and unique controls.

## 5. Integration

- [ ] 5.1 Open `src/index.html` directly via `file://` and review representative controls across all affected modules in English and Russian at desktop and phone widths; confirm consistent field/dropdown focus color and width, hover/disabled states, no overflow, working native dropdown menus, and no new console errors.
- [ ] 5.2 Inspect the final CSS diff for duplicate visual rules, unintended broad selectors, and load-order regressions; run `git diff --check` and confirm no runtime dependency, build step, or functional behavior change was introduced.