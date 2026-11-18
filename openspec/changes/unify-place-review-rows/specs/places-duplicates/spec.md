## MODIFIED Requirements

### Requirement: Unified pair review and comparison inspector
Each duplicate pair SHALL be one selectable review row keyed by the pair identity, independent of individual Place selection. The selected row SHALL show a comparison inspector for both Places with explicit View Place actions. Active rows SHALL offer Merge and Keep separate; dismissed rows SHALL offer Restore with the shared dismissed-item style.

#### Scenario: Two pairs share a Place
- **WHEN** A–B and A–C are visible and the user selects A–B
- **THEN** only A–B has the selected row treatment and the inspector compares A and B

#### Scenario: View one Place
- **WHEN** the user chooses View Place for B in the pair inspector
- **THEN** pair selection clears and B appears in the ordinary Place inspector

#### Scenario: Selected pair disappears
- **WHEN** search or a record edit removes the selected pair from visible findings
- **THEN** pair selection clears without selecting an unrelated pair
