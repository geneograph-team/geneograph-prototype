# Tasks

## 1. Palette foundation

- [x] 1.1 Reconcile the in-progress `add-light-theme` work and document which overlapping theme declarations this change supersedes; verify the diff preserves theme preference, board provenance, and existing user changes.
- [x] 1.2 Copy the approved v3 structured palette and production CSS roles into `src/core/`, record its version and source, exclude demo component rules, and verify token values match the supplied package and load through `file://`.
- [x] 1.3 Load the palette before `foundation.css`; map existing semantic UI aliases to v3 roles without independent color literals. Verify Dark and Light surfaces, shared controls, focus, and selected states in a focused preview.

## 2. Shared UI and modules

- [x] 2.1 Migrate shared controls, modals, overlays, navigation, and core UI to palette roles in their owning stylesheets; verify representative English/Russian workflows in both themes and remove superseded declarations.
- [x] 2.2 Migrate Projects, Family Tree, and People UI colors, including the Heritage Green hero pair (pale Light, deep Dark); verify cards, tree, profile, and settings in both themes.
- [x] 2.3 Migrate Geneograph library and inspector UI colors while leaving explicit board colors and inherited board defaults on their content/theme path; verify board appearance, editing, and theme switching.
- [x] 2.4 Migrate Albums, Archive, Notes, Places, and disabled Publish UI colors in owning stylesheets; verify each active module’s list/detail, modal, hover, focus, and selection states in both themes.
- [x] 2.5 Migrate first-party JS-generated UI and inline SVG colors to palette roles or `currentColor`, preserving authored board data and artwork; verify generated controls and icon states in both themes.

## 3. Ownership and integration

- [x] 3.1 Add a dependency-free UI-literal color check with documented exclusions and a check fixture for an illegal color; verify it fails on the fixture and passes migrated source.
- [x] 3.2 Document palette role selection and the approval-first process for any new color; update AGENTS.md and the design guide to remove conflicting legacy color rules. Verify documentation paths and commands.
- [x] 3.3 Review desktop and phone layouts in English and Russian across representative modules and modals, including hero, focus, error, disabled, overlay, and selected states; resolve any readability or contrast issue without unapproved colors.
- [x] 3.4 Run the palette check, focused JavaScript syntax checks, OpenSpec validation, and `git diff --check`; verify no UI literal colors remain outside the approved palette or documented content/vendor exclusions.

