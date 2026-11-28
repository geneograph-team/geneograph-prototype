# Existing-parent family selection

## Requirements

### Requirement: Reciprocal explicit family choice
When connecting an existing Parent to a child, the UI SHALL present that parent's eligible partner families and a separate connect-parent-only choice. A selected family SHALL plainly identify that both people will become recorded parents. Exactly one eligible partner family SHALL default to “Both parents” and remain editable; multiple eligible families SHALL require deliberate selection.

#### Scenario: Parent with one partner family
- **WHEN** a researcher selects a parent who has one eligible partner family
- **THEN** that family is selected as “Both parents” by default, with the parent-only alternative still available

#### Scenario: Parent with two partner families
- **WHEN** a researcher selects a parent who has two eligible partner families
- **THEN** neither family is silently selected and Connect requires a choice

### Requirement: Validate all intended parent links
The connection SHALL validate all chosen parent links before mutation for cycles, duplicate links, project ownership, biological parent count and role conflicts. A parent-only choice SHALL NOT attach the parent's partner. The selected type SHALL apply to every explicitly selected parent. When adding a partner as parent to the existing children of the unique single-parent family, inherit each child's recorded type from the existing parent. When a new parent is added to a unique eligible existing family, the selected child receives the chosen type and other existing children inherit the recorded type of the existing parent. Reject conflicting proposed links without partial writes. Existing ambiguous or non-biological parentage is not automatically rewritten. Parentage edits to Biological SHALL validate the same biological constraints. Preserve explicit source-family role hints in sibling isolation and explicit Add father/mother roles in possible-match links.

#### Scenario: Co-parent is already linked
- **WHEN** the child already has a link to the other parent in the chosen family
- **THEN** the operation fails without adding duplicate parent links

### Requirement: Preserve reciprocal paths and accessibility
Child-to-parent and sibling connections SHALL retain their behavior. The modal SHALL preserve EN/RU selection, keyboard semantics and matched label/control alignment at desktop widths.

#### Scenario: Search changes candidate
- **WHEN** another parent is selected after searching
- **THEN** the picker presents only that parent's eligible families and no stale selection is applied
