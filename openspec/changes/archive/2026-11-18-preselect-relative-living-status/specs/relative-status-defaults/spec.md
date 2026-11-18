# Spec Delta

## Purpose

Defines how the Add relative form chooses an initial living status from the linked person's recorded birth date while leaving the final status under the user's control.

## ADDED Requirements

### Requirement: Historical relatives receive a date-based initial status
When creating a new relative in Family Tree/People or Geneograph, the form SHALL use the linked person’s recorded birth and preselect Deceased if the linked person's latest possible birth year is at least 125 years before the current calendar year for a parent, sibling, or partner, or at least 140 years before it for a child. The current year SHALL be determined when the form opens.

#### Scenario: Parent of a person past the 125-year cutoff
- **WHEN** a user opens Add parent for a person whose latest possible birth year is 1901 in 2026
- **THEN** Deceased is preselected

#### Scenario: Child of a person past the 140-year cutoff
- **WHEN** a user opens Add child for a person whose latest possible birth year is 1886 in 2026
- **THEN** Deceased is preselected

#### Scenario: Geneograph board-local parent past the cutoff
- **WHEN** a user opens Add parent from a Geneograph person card whose board person’s latest possible birth year is 1901 in 2026
- **THEN** Deceased is preselected in Geneograph’s Add person modal

#### Scenario: Relative below the applicable cutoff
- **WHEN** a user opens Add sibling for a person born in 1902 in 2026
- **THEN** Living remains preselected

### Requirement: Uncertain dates do not establish a deceased default
The form SHALL retain its normal Living default when the linked person's birth date is absent, invalid, or lacks a finite latest possible birth year. It SHALL use the latest possible year of a bounded partial or range date when applying a cutoff.

#### Scenario: Open-ended date
- **WHEN** a user opens Add parent for a person whose birth is recorded only as After 1880
- **THEN** Living remains preselected

#### Scenario: Bounded range
- **WHEN** a user opens Add partner for a person whose birth is recorded Between 1898 and 1901 in 2026
- **THEN** Deceased is preselected based on the latest possible year, 1901

### Requirement: Preselection remains editable and does not create death evidence
The suggested status SHALL remain editable before save in both modals. Preselecting Deceased SHALL NOT create a death date or place. Editing an existing person, connecting an existing person, and creating a person without a relative link SHALL retain their current status behavior.

#### Scenario: User overrides the initial status
- **WHEN** a user changes a preselected Deceased status to Living before saving a new relative
- **THEN** the new person is saved as Living

#### Scenario: No death date is inferred
- **WHEN** Deceased is preselected for a new relative
- **THEN** the death date and death place remain empty

#### Scenario: Existing person is edited
- **WHEN** a user opens Edit person for someone with an existing living status
- **THEN** the existing status remains selected regardless of the person's relatives' birth years

