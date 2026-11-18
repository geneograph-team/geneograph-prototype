# Proposal

## Why

New relatives currently start with Living status even when the linked person's recorded birth year makes that default implausible. A conservative, editable default will reduce repetitive correction in historical family trees without claiming that a death has been verified.

## What Changes

- When creating a relative for an existing person in Family Tree/People or for a board person in Geneograph, calculate an age cutoff from the current calendar year each time the form opens.
- Preselect Deceased for a new parent, sibling, or partner when the linked person's latest possible birth year is at least 125 years before the current year; use 140 years for a new child.
- Keep Living when the linked birth date is absent, unparsed, or does not establish a latest birth year before the cutoff. Preserve explicit status choices and existing-person edits.
- Keep the status editable and leave death date and place empty. This is a form default, not a recorded death claim.

## Capabilities

### New Capabilities

- `relative-status-defaults`: Date-based initial living-status selection in the Add relative flow.

### Modified Capabilities

None; this repository has no current OpenSpec capability specs.

## Impact

The shared Add person/relative modal in People and Family Tree, Geneograph’s separate board-person modal, and the existing genealogy date model are affected. No project data migration, runtime dependency, or change to saved living-status values is needed.
