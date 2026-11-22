## Why

Connecting an existing person as Parent currently bypasses the family picker available in the reverse Child direction and can attach a parent without an explicit decision about the parent's recorded partner.

## What Changes

- Offer a selected parent's partner families plus an explicit parent-alone option when connecting Parent in Family Tree / People.
- Require an explicit choice when partner families exist; describe whether one or both parents will be linked.
- Reuse shared connection validation, preserve parent-child type and reject existing-link, cycle and biological conflicts for each chosen parent.
- Align relationship and people-search headings and controls on the desktop modal.

## Capabilities

### New Capabilities

- `existing-parent-family-selection`: Explicit reciprocal family selection when connecting an existing parent.

Related: #324. Coordinate with sibling unknown-parent choices #333 in this PR.
