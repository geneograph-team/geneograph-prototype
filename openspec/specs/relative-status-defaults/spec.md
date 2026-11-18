# Relative living-status defaults

## Requirements

### Requirement: Conservative historical preselection
When creating a relative of a linked person in Family Tree/People or
Geneograph, the initial status SHALL be Deceased only when the anchor
person's latest possible birth year is at least 125 years before the
current year (parent/sibling/partner) or 140 years (child).

#### Scenario: An old parent
- **WHEN** Add parent opens with a linked person whose latest possible
  birth year meets the 125-year cutoff
- **THEN** Deceased is preselected for the new relative

### Requirement: Uncertain dates default to Living
Missing, invalid, or open-ended birth dates SHALL NOT establish the
Deceased preselection. Bounded ranges SHALL use their latest possible
year.

#### Scenario: Unbounded birth
- **WHEN** a linked person's birth is recorded as After 1880
- **THEN** Living stays preselected

### Requirement: Suggestion is editable, not evidence
The user SHALL be able to change the preselection. A suggested Deceased
status SHALL NOT create death dates or Places. Existing-person edits
SHALL preserve their existing status semantics.

#### Scenario: Override suggested status
- **WHEN** the user chooses Living before saving
- **THEN** the new relative is saved as Living
