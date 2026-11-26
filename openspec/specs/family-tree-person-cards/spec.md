# Family Tree person cards

## Requirements

### Identity, dates and controls

Cards SHALL expose accessible canonical identity and actions for all occurrences. Keep the 3:4 portrait ratio with crop and initials fallback. Detailed dates SHALL use structured facts, retain known precision and qualifiers, and use localized compact years at lower detail without inventing dates or status. Display an unknown side when only a death date is recorded, and when only birth is recorded for a person whose living status is unknown or deceased. No dates with confirmed living status leaves the date area empty. When neither date is recorded, Unknown and Deceased remain distinct.

Card selection, hover and keyboard focus SHALL remain distinguishable from category coloring. Edit and Add relative identify the clicked record. Standalone Focus controls and ancestry badges keep separate actions. See the [viewport stages](../family-tree-zoom/spec.md).

### Portrait derivatives

Only visible full and short portraits with usable sources acquire thumbnail leases. Avatar intersection and device-pixel scale determine demand and tier. Project/module disposal, offscreen culling and revision changes release or replace leases. Tagged regions and person crop settings retain their source semantics; viewer and crop tools use the original. Offline project and generated images use the same lease workflow. Packaged photos can fall back to initials when the app runs under Edge direct-file access. Bundled portraits are supported over local HTTP.

### Project display channels

Fill and outline independently support Gender, Branch and Neutral. Gender mode distinguishes male, female and unknown in both themes. Connector color supports Branch or Neutral. In Branch mode, connectors use the matching non-neutral branch; mixed and unresolved connections stay neutral. Selection and focus cues remain distinct.

Presets 2/4/8/16 divide the reference ancestry through generations 1/2/3/4 in father-first order, with vacant slots for missing ancestry. The reference, unrelated spouses and unresolved branches stay neutral. Optional collateral coloring follows uniquely attributable child paths without traversing the reference or direct ancestors. Appearance attribution uses actual visual context. Changing focus, orientation or depth does not renumber slots or write canonical color attributes. The legend describes the project’s resolved channels and categories.
