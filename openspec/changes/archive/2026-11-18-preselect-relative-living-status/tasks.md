# Tasks

## 1. Relative status default

- [x] 1.1 Add a reusable date-based initial-status helper using the linked person's bounded birth date, current year, and relationship-specific 125/140-year cutoffs; verify exact, partial, range, open-ended, missing, and boundary-year cases with a focused executable check.
- [x] 1.2 Apply that helper only when the shared Add person modal creates a new linked relative, while preserving explicit options and saved edit values; verify parent, sibling, partner, child, general Add person, and Edit person initial selections.

- [x] 1.3 Apply the same helper to Geneograph’s separate new-relative board-person modal using the anchor node’s board-local person; verify all four relative categories, general board-person creation, and editing of an existing board person.

## 2. Save behavior

- [x] 2.1 Keep death fields empty and save the status selected by the user through each existing save path; verify a preselected Deceased relative and a manually changed Living relative in Family Tree and Geneograph.

## 3. Integration check

- [x] 3.1 Check Add relative from People and Geneograph in the localhost preview, including historical/default and override cases; verify Family Tree uses the shared People form and cover cutoff boundaries and uncertain dates in focused helper checks. Run focused syntax checks, OpenSpec validation, and `git diff --check`.
