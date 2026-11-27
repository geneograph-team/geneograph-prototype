# Family Tree person cards

## Requirements

### Identity, dates and controls

Cards SHALL expose accessible canonical identity and actions for all occurrences. Keep the 3:4 portrait ratio with crop and initials fallback. Detailed dates SHALL use structured facts, retain known precision and qualifiers, and use localized compact years at lower detail without inventing dates or status. Display an unknown side when only a death date is recorded, and when only birth is recorded for a person whose living status is unknown or deceased. No dates with confirmed living status leaves the date area empty. When neither date is recorded, Unknown and Deceased remain distinct.

Card selection, hover and keyboard focus SHALL remain distinguishable from category coloring. Edit and Add relative identify the clicked record. Standalone Focus controls and ancestry badges keep separate actions. See the [viewport stages](../family-tree-zoom/spec.md).

### Portrait derivatives

Only visible full and short portraits with usable sources acquire thumbnail leases. Avatar intersection and device-pixel scale determine demand and tier. Project/module disposal, offscreen culling and revision changes release or replace leases. Tagged regions and person crop settings retain their source semantics; viewer and crop tools use the original. Offline project and generated images use the same lease workflow. Packaged photos can fall back to initials when the app runs under Edge direct-file access. Bundled portraits are supported over local HTTP.

### Project display channels

Fill and outline independently support Gender, Branch and Neutral. Connectors support Branch and Neutral; normal and partner connectors use the chosen neutral color for unresolved or neutral paths. Preserve existing branch classification and selection/focus cues. Each project's editable light and dark palettes SHALL contain the same sixteen slots plus male, female, unknown and neutral colors. All slots remain stored and editable independent of the selected count. Invalid or absent values use the theme defaults. Theme switching resolves the appropriate palette without changing layout or records. Gender mode distinguishes male, female and unknown in both themes. In Branch mode, connectors use the matching non-neutral branch; mixed and unresolved connections stay neutral.

Presets 2/4/8/16 divide the reference ancestry through generations 1/2/3/4 in father-first order, with vacant slots for missing ancestry. The reference, unrelated spouses and unresolved branches stay neutral. Optional collateral coloring follows uniquely attributable child paths without traversing the reference or direct ancestors. Appearance attribution uses actual visual context. Changing focus, orientation or depth does not renumber slots or write canonical color attributes. The Palette section lists reference-relative origins and relationship paths, distinguishes preset inclusion from missing origins, and replaces the standalone canvas legend. Individual color, theme palette and both-theme resets affect only the draft until Apply.

#### Scenario: Edit and reset colors
- **WHEN** the user changes or resets colors in the staged settings draft
- **THEN** only Apply commits them to project display preferences, and color-only application repaints without a geometry solve or viewport/selection reset.
