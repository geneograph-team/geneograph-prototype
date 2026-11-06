# Tasks

## 1. Palette and surface hierarchy

- [ ] 1.1 Adjust Light and Dark neutral roles in `src/core/palette/geneograph-v3.css`, preserving the existing accent families; verify palette aliases remain defined and the UI-color ownership check passes.
- [ ] 1.2 Reconcile `foundation.css` surface aliases and Projects' nested activity/card treatments so rows are flatter than independent cards; verify Projects library and overview hierarchy in both themes at desktop and phone widths.
- [ ] 1.3 Apply the same surface-role rule in the owning Family Tree, People, and Albums styles; verify canvas cards, table rows, selection, inspector, and photo surfaces retain clear boundaries and readable metadata in both themes.
- [ ] 1.4 Inspect Geneograph, Archive, Notes, Places, and shared modal surfaces for the same raised-role misuse and correct only affected selectors; verify representative list, inspector, and modal states in both themes.

## 2. Category chips and person identity

- [ ] 2.1 Reconcile shared `.app-chip` category/status roles and on-hero treatment so foreground, border, and container belong to one accent family; verify representative chips in Projects, People, Family Tree, Albums, Archive, Notes, and Places, including hover/focus/disabled states.
- [ ] 2.2 Restore male, female, and unknown Family Tree card borders while keeping selection/focus as separate emphasis; verify all three categories in both themes, including hover and selected cards.
- [ ] 2.3 Adjust the People, Family Tree sidebar, and profile hero artwork treatment by theme; verify the tree is visible in Light and Dark without obscuring portraits, text, chips, or actions at narrow widths.

## 3. Integration review

- [ ] 3.1 With user-approved localhost browser QA, review representative populated and sparse screens in English and Russian at desktop and phone widths; verify readable supporting text, consistent elevation, visible focus/selection, and no new console or resource errors. Record any unavailable visual check rather than marking it passed.
- [ ] 3.2 Run the UI-color ownership check, focused static checks, `openspec validate refine-shared-theme-palette --strict`, and `git diff --check`; inspect the final diff for unrelated edits and preserve existing working-tree changes.
