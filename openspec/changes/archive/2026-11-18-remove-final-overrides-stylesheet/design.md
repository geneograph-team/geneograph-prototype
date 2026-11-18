# Design

## Context

See `proposal.md` for the motivation. `src/index.html` loads `final-overrides.css` after most feature stylesheets but before three later feature stylesheets. The remaining file includes Projects, Family Tree, People, Geneograph, Albums, Archive, Notes, Publish-adjacent, shared form controls, mobile modal shells, navigation, and library tiles. Places-only rules were moved to `notes-places.css` in a prior working-tree pass; three mixed selectors still mention Places and other modules. The app must keep direct `file://` opening and classic CSS links.

## Goals / Non-Goals

**Goals:** Place each rule next to its owning component or shared control, remove redundant declarations, and end with no `final-overrides.css` link or file. Preserve the visible cascade at desktop, intermediate, and phone widths in English and Russian.

**Non-Goals:** Redesign screens, alter modal dimensions or interactions, rename selectors, change JavaScript, reorganize stylesheet files, add a build step, or add a test for each CSS move.

## Decisions

1. **Migrate by selector ownership, not file position.** Use the existing feature stylesheets: Notes/Places in `notes-places.css`; Albums in `albums.css`; Archive in `archive.css` and its document/image viewer sheets; People in `family-people.css` or `people-shared.css`; Family Tree and Projects in `family-people.css`; Geneograph in `geneograph.css` and its tree-review sheet; product-tour rules in `product-tour.css`; Publish in `publish.css` if applicable. Shared controls belong in `foundation.css` or `resource-picker.css`. This follows current ownership without creating more stylesheet links. Copying contiguous blocks would mix unrelated modules.
2. **Reconcile the cascade for each slice.** Compare the source rule with existing selectors and media queries, then merge the effective declarations into the owning rule or state variant. Remove superseded declarations; do not reproduce a trailing override section in another file. Split mixed selector lists when module-specific behavior belongs to a module, but leave genuinely cross-module behavior in a shared sheet. Existing `!important` may be retained only where removing it changes the effective style; add none as a shortcut.
3. **Preserve link order until the final gate.** Moving a rule from a later file to an earlier file can change specificity ties. Check the resulting selector precedence against remaining `final-overrides.css` and later sheets after each pass. Remove the final link only when the source file contains no active rules. This limits the blast radius compared with reordering all CSS at once.
4. **Reviewable migration units.** Follow the module order already recorded in `Prototype_Design_Document.md`: Notes, Albums, Archive, People, Family Tree, Projects, Geneograph, Publish audit, shared controls, final deletion. Places-only work is complete and is not repeated. Each unit must remove its migrated source rules and finish verification before the next unit.

## Risks / Trade-offs

- **Cascade regression after moving earlier in load order** -> Compare affected computed styles and responsive states before and after each unit; inspect the browser at wide, intermediate, and phone widths in both languages.
- **Mixed selectors affect another module** -> Split only when ownership is clear; keep shared behavior in a shared stylesheet and verify every module named by the old selector.
- **Mobile/modal regressions and focus loss** -> Exercise open, closed, collapsed, keyboard-focus, and narrow viewport states relevant to the moved rules.
- **Visual verification unavailable in an execution environment** -> Keep that gate explicitly pending; do not claim visual equivalence from syntax or diff checks alone.
- **Concurrent working-tree edits** -> Preserve existing edits and deletions; apply narrow changes without resetting files.

## Migration Plan

For each module: inventory its remaining selectors in `final-overrides.css`, locate owning markup and CSS, record overlap with earlier or later declarations, integrate the effective rules, remove the source rules, and check CSS balance plus `git diff --check`. Run focused browser and console checks before proceeding. After module-specific rules are gone, consolidate shared controls and the three mixed Places selectors. Confirm no active rules remain, remove the file and `src/index.html` link, update docs, and run a full module/viewport review. A failed pass should restore only that pass's edits while preserving unrelated working-tree changes; do not reset the repository.