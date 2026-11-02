# Design

## Context

See proposal.md. Archive already renders tile and table items from the same visible file/folder projections, stores file and folder checkbox selections separately, and has per-item More menus plus a bulk action bar. Tile CSS fixes width at 128–140px and absolutely positions the favorite star at the bottom. The sidebar folder tree has navigation and drag targets but no item menu. All state is in memory.

## Goals / Non-Goals

**Goals:**
- Keep one visible selection model across desktop tile and table layouts.
- Reuse existing item and bulk actions, including their eligibility checks.
- Preserve keyboard access through More buttons and the current mobile controls.

**Non-Goals:**
- Persistent selection, filesystem integration, new Archive commands, or a redesign of the mobile list.
- Range selection of sidebar navigation folders.

## Decisions

1. **Tile geometry.** Use a bounded responsive desktop grid targeting roughly 180–200px tiles, with a dedicated artwork row and copy region. Put the favorite indicator in a reserved slot beside the name rather than an absolute bottom corner. Keep two-line name truncation and full-name title. A wider fixed-size tile alone would leave unexplained blank space; a fluid unlimited tile would become huge when few items are present.

2. **Selection order and anchor.** Build the range from the currently rendered main-view item sequence: sorted folders first, then visible files. Store one transient anchor key for desktop selection. Plain click replaces selection and updates the inspector. Tile checkboxes and the bulk bar appear only when at least two items are selected; Ctrl/Cmd-click toggles membership; Shift-click replaces selection with the inclusive anchor-to-target range. If the anchor is no longer visible, treat the target as a new single-item anchor. Existing selection arrays remain the source of truth; no data-model change.

3. **Opening and native controls.** Keep double-click opening for unmodified item activation. Checkbox clicks continue to toggle selection directly. More buttons, inputs, links, and text-entry controls are excluded from row click selection. Maintain keyboard focus and existing Enter/Space behavior while making selection state visible in tiles and rows.

4. **Context menus.** Reuse the current item-action menu content and action dispatcher. Add a pointer-position option to its placement helper while retaining button anchoring for keyboard/More activation. Right-click on an unselected main item selects it first; right-click inside an existing multi-selection opens a menu built from the current bulk-action eligibility. The sidebar uses its folder ID to open the folder item menu without navigating or joining the main selection. Suppress the native context menu only on supported Archive targets, not on inputs or editable content.

5. **Selection safety.** Recompute the visible range after filtering, sorting, or navigation; clear or rebase the transient anchor when it disappears. Continue using existing visible-selection pruning and move/delete constraints, especially folder descendant rules.

## Risks / Trade-offs

- [Tile width reduces columns] → Check wide, intermediate, and narrow desktop content widths; preserve a separate mobile list.
- [Range can span folders and files] → Use explicit DOM order and test both directions and hidden-item changes.
- [Context menu can act on stale selection] → Resolve selected records and action eligibility when opening and executing the menu.
- [Right-click may disrupt drag or text selection] → Scope handlers to Archive items and preserve existing input and drag behavior.

## Migration Plan

No stored-data migration. The change is reversible by restoring the Archive rendering, CSS, and event handlers. Existing sample files and folders remain unchanged.