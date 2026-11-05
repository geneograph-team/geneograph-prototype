# Tasks

## 1. Theme state and shared foundation

- [ ] 1.1 Add an early theme initializer, persisted System/Dark/Light preference, and live system-change handling; verify first paint, reload, direct `file://` opening, and switching without losing an open module or modal.
- [ ] 1.2 Replace the read-only Global settings theme row with a localized selector; verify Dark, Light, and System choices and their English/Russian labels.
- [ ] 1.3 Add Paper & Forest semantic tokens, native color scheme, scrollbar, shadow, focus, and select styling in the owning shared styles; verify normal, hover, selected, disabled, and keyboard-focus control states in both appearances.
- [ ] 1.4 Update the theme guidance in `AGENTS.md` to describe both appearances and direct style ownership; verify the instructions match the implementation.

## 2. Module presentation

- [ ] 2.1 Reconcile fixed colors in Projects, Family Tree, and People styles, retaining inverse dark green heroes; verify representative directory, profile, tree, settings, and modal views in both appearances and languages.
- [ ] 2.2 Reconcile Geneograph library, editor chrome, inspector, canvas controls, pickers, and product-tour UI with the shared light tokens; verify the seeded board changes inherited colors with the theme while authored colors remain fixed.
- [ ] 2.3 Reconcile Albums, Archive, and Notes styles, including shared manage dialogs and Quill controls; verify list/grid, previews, editing, and modal states in both appearances and languages.
- [ ] 2.4 Reconcile Places and auxiliary UI, including Leaflet controls and map status overlays; verify map/list, editing, markers, and dialogs while leaving map tiles unchanged.

## 3. Geneograph board defaults

- [ ] 3.1 Add light and dark defaults for canvas, card, object, and connection colors, resolved from the current interface theme; verify new and open boards, including live System changes.
- [ ] 3.2 Track per-property inherited versus explicit colors at board and object levels. Make creation tools use the current defaults, edits pin values, and resets clear overrides; verify theme changes, board switching, and reset behavior without selection or viewport loss.
- [ ] 3.3 Update the Whiskerfield seed to classify inherited and authored colors. Preserve provenance and explicit values through `.ggboard` validation, import, and export; verify a new-format round trip and theme switching after import.

## 4. Integration verification

- [ ] 4.1 Check all active modules and representative dialogs at desktop and phone widths in English/Russian, with populated and empty states; verify readable contrast, keyboard focus, no overflow, no missing assets, and no new console errors.
- [ ] 4.2 Run focused JavaScript syntax checks, OpenSpec validation, and `git diff --check`; verify all three pass and report any browser checks that remain pending.
