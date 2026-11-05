# Tasks

Browser verification is deferred at the user's request. Task 4.1 remains open until that review.

## 1. Theme state and shared foundation

- [x] 1.1 Add an early theme initializer, persisted System/Dark/Light preference, and live system-change handling; verify first paint, reload, direct `file://` opening, and switching without losing an open module or modal.
- [x] 1.2 Replace the read-only Global settings theme row with a localized selector; verify Dark, Light, and System choices and their English/Russian labels.
- [x] 1.3 Add Paper & Forest semantic tokens, native color scheme, scrollbar, shadow, focus, and select styling in the owning shared styles.
- [x] 1.4 Update the theme guidance in `AGENTS.md` to describe both appearances and direct style ownership; verify the instructions match the implementation.

## 2. Module presentation

- [x] 2.1 Reconcile fixed colors in Projects, Family Tree, and People styles, retaining inverse dark green heroes.
- [x] 2.2 Reconcile Geneograph library, editor chrome, inspector, canvas controls, pickers, and product-tour UI with the shared light tokens.
- [x] 2.3 Reconcile Albums, Archive, and Notes styles, including shared manage dialogs and Quill controls.
- [x] 2.4 Reconcile Places and auxiliary UI, including Leaflet controls and map status overlays while leaving map tiles unchanged.

## 3. Geneograph board defaults

- [x] 3.1 Add light and dark defaults for canvas, card, object, and connection colors, resolved from the current interface theme.
- [x] 3.2 Track per-property inherited versus explicit colors at board and object levels. Make creation tools use the current defaults, edits pin values, and resets clear overrides.
- [x] 3.3 Update the Whiskerfield seed to classify inherited and authored colors. Preserve provenance and explicit values through `.ggboard` validation, import, and export.

## 4. Integration verification

- [ ] 4.1 Check all active modules and representative dialogs at desktop and phone widths in English/Russian, with populated and empty states; verify readable contrast, keyboard focus, no overflow, no missing assets, and no new console errors. Include a new-format `.ggboard` export/import round trip and theme switching after import.
- [x] 4.2 Run focused JavaScript syntax checks, OpenSpec validation, and `git diff --check`; verify all three pass and report any browser checks that remain pending.
