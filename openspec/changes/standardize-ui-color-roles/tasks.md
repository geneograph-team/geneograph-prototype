# Tasks

## 1. Stabilize the palette

- [x] 1.1 Update the restored v3.1 `geneograph-v3.json` to match current v3.2 CSS values and roles, including Light foundation/Material aliases and missing semantic roles; align metadata and README, preserve matching Dark/accent values, and verify `node scripts/check-ui-colors.js` reports no palette drift.
- [x] 1.2 Extend the checker for unresolved non-runtime custom properties and critical on-color contrast pairs; verify it catches a deliberately missing token and a mismatched pair, then passes the repository.
- [x] 1.3 Audit every non-palette Print Magenta on-color use and unresolved `brand-green-200`, `surface-base`, `green`, `radius-xs`, and `space-7` reference; replace each with a meaningful role or valid size token and verify the checker passes. Preserve board-authored paint exceptions.

## 2. Establish shared color contracts

- [x] 2.1 Define workspace, topbar, sidebar, inspector, panel, raised card, field, hover, divider, and selected-row roles in palette/foundation; verify representative shell computed styles in Light and Dark without globally replacing `--surface-main`.
- [x] 2.2 Add shared table/list colors for header, body, hover, inspected current, batch checked, focus, disabled, and dividers; verify a small representative table demonstrates distinct states in both themes.
- [x] 2.3 Align primary, secondary, tonal, text, destructive, icon, search, select, checkbox, modal, and resource-picker colors in owning shared styles; verify rest, hover, focus, pressed, and disabled states in a representative picker.

## 3. Migrate shells and data views

- [x] 3.1 Migrate Projects and Geneograph library shell, cards, create tiles, and informational panels to the shared elevation roles; verify those screens in both themes, including Tip of the Day and illustrated covers.
- [x] 3.2 Migrate Family Tree and People shell, inspector, profile, and directory table colors; verify gender borders, current person versus batch selection, keyboard focus, and the tree canvas remain distinct.
- [x] 3.3 Migrate Albums grid/list and Archive file/Source browser surfaces and tables; verify photo selection, file grouping, source rows, hover, current inspection, and batch checks.
- [x] 3.4 Migrate Notes and Places shell, editor/list, inspector, map controls, and table colors; verify selected notes and places, review states, and map tiles retain their intended meaning.

## 4. Correct content identity and status

- [x] 4.1 Align shared chips, activity icons, linked-resource rows, and picker icons with all nine approved accent families; verify generic Events are Chronicle Copper, Sources Evidence Slate, and photos/files/notes/places retain their own families across modules.
- [x] 4.2 Separate warning, error, success, offline, favorite, and disabled styling from category identity in Projects, Albums, Archive, Notes, and Places; verify representative states do not use another category's accent.
- [x] 4.3 Correct Publish source-level foreground/background pairs while keeping Publish disabled; verify source token and contrast checks pass, and record runtime visual QA as unavailable for this view.

## 5. Complete forms and inspector workflows

- [x] 5.1 Reconcile module-owned form, calendar, accordion, and right-inspector colors with shared roles across active modules; verify neutral expanded sections and readable fields in both themes.
- [x] 5.2 Reconcile Manage/Add Photos, Files, Notes, People, Places, Sources, and Geneograph picker states with the shared modal contract; verify selected versus current, focus, disabled Save, search, and footer states without changing picker behavior.
- [x] 5.3 Update palette and repository color-role documentation with the final mapping and exception policy; verify examples and commands match the implemented files.

## 6. Cross-module integration

- [x] 6.1 Run the color ownership, token-reference, contrast, relevant JavaScript syntax, and `git diff --check` checks; verify all pass and no new raw UI color literals appear outside approved exceptions.
- [x] 6.2 Run focused localhost browser QA after code work for Light and Dark, English and Russian, desktop and phone widths across Projects, Family Tree, People, Geneograph, Albums, Archive/Sources, Notes, Places, settings, and shared modals; verify console and failed-resource results, computed surfaces, hover, checked/current selection, focus, disabled, theme switching, and content-color preservation. Record any unavailable view explicitly.
