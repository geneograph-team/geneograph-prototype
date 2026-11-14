# Tasks

## 1. Zoom range and position

- [x] 1.1 Centralize displayed-level/physical-scale conversion and clamp Family Tree zoom to displayed 0–200; verify 0 remains visible, 100 matches the current size, and 200 reaches the upper bound.
- [ ] 1.2 Update wheel, buttons, pinch label, and Home to use the mapped range; verify pointer/pinch anchoring, button-center anchoring, and Home focus centering across both ends and stage boundaries.

## 2. Progressive cards

- [x] 2.1 Add a stable person-detail stage and a record-derived given-name field without changing card or relationship coordinates; verify the four bands by zooming out and back in with long English and Russian names.
- [x] 2.2 Style full, portrait/name, given-name, and marker views in the owning Family Tree stylesheet; verify readable names where shown, portrait/initial fallback, gender colors, and distinct selected/focused states in both themes.
- [ ] 2.3 Simplify card actions and missing-parent placeholders at overview levels while retaining selection, keyboard activation, inspector access, and Add father/mother flows; verify each action at the lowest level.

## 3. Integration verification

- [ ] 3.1 Check populated and sparse trees at desktop and phone widths in English and Russian, including wheel, buttons, pinch, full screen, person navigation, Home, and console; verify relationships remain attached and the viewport does not jump at a band transition.
- [x] 3.2 Run focused JavaScript syntax checks and `openspec validate improve-family-tree-zoom --strict`, then review edited files directly for whitespace issues; verify these checks pass before completing the change without running Git.
