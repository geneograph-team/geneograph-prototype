# Proposal

## Why

The centralized palette currently yields overly bright, flat light screens and too many raised dark surfaces. Family Tree card borders have lost their gender distinction, category chips vary, and botanical artwork disappears in light People heroes.

## What Changes

- Rebalance neutral surface and text roles in both themes and assign elevation by component purpose while preserving Heritage Green and the existing accent families.
- Restore distinct gender-colored Family Tree card borders, separate from selection and focus.
- Standardize category and status chips across modules, including on branded heroes.
- Make botanical tree artwork visible but subordinate to text in People, Family Tree, and profile heroes in light mode.
- Review representative screens and interaction states in both themes, languages, and desktop and phone widths. Preserve authored board colors and other content media.

## Capabilities

### New Capabilities

- `ui-color-system`: Semantic light and dark surfaces, readable states, consistent chips, and branded hero artwork.
- `family-tree-person-cards`: Gender border identity distinct from selection and focus.

### Modified Capabilities

None; no durable specs exist yet. This change refines the proposed palette behavior without editing the completed `centralize-ui-color-palette` folder.

## Impact

The shared palette, foundation aliases and chips, and owning module styles where elevation is misapplied. No data model, theme preference, dependency, build step, or runtime fetch changes.
