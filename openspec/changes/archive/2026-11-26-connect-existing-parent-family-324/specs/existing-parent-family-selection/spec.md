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
The connection SHALL validate the chosen parent and any additionally selected parent for relationship cycles, duplicate links and biological constraints before mutation. A parent-only choice SHALL NOT attach the parent's partner.

#### Scenario: Co-parent is already linked
- **WHEN** the child already has a link to the other parent in the chosen family
- **THEN** the operation fails without adding duplicate parent links

### Requirement: Preserve reciprocal paths and accessibility
Child-to-parent and sibling connections SHALL retain their behavior. The modal SHALL preserve EN/RU selection, keyboard semantics and matched label/control alignment at desktop widths.

#### Scenario: Search changes candidate
- **WHEN** another parent is selected after searching
- **THEN** the picker presents only that parent's eligible families and no stale selection is applied
