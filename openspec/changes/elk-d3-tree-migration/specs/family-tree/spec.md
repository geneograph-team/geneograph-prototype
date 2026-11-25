## ADDED Requirements

### Requirement: Single ELK Tree presentation

Family Tree SHALL use the approved ELK provider in Vertical and Horizontal orientations and a single D3-assisted renderer. The normal selector SHALL offer Vertical / Horizontal / disabled Fan. Vertical SHALL be default and the orientation remembered per project. Classic, preview toggle and recovery provider SHALL be removed; errors SHALL expose a localized diagnostic and retry without mutating genealogy. Retain existing separate Focus controls.

#### Scenario: Switch orientation

- **WHEN** a researcher selects Horizontal in the normal selector
- **THEN** the same canonical focus, selection, depth, visible context and compatible expansion preference are retained
- **AND** cards remain upright and layout is recalculated in the chosen direction
- **AND** returning to that project retains its chosen orientation.

### Requirement: Canonical identity and visual occurrences

Repeated ancestors SHALL be detected by reconvergent relationship paths, not partner count. Each occurrence SHALL identify its canonical person and context; all repeated appearances show ×N when space permits, with accessible full identity. Exactly one occurrence owns visible upstream ancestry and can transfer that ownership to another occurrence. Distinct family records and memberships SHALL remain intact. When distinct siblings reconverge on visible descendant paths, visual family instances SHALL partition the child memberships and repeat both known parents together or the single known parent. The preference SHALL distinguish sibling contexts of the same family. Known collapsed ancestry is not an unknown parent.

#### Scenario: Select or transfer an occurrence

- **WHEN** a repeated person is selected
- **THEN** all their occurrences are selected canonically without changing focus or layout
- **WHEN** the researcher explicitly transfers upstream ancestry to another occurrence
- **THEN** the ownership and geometry change but canonical records, focus and selection do not.

### Requirement: Detached scene and viewport

ELK SHALL own card placement, with at most two solves for approved dynamic spacing. Routing consumes final coordinates without moving cards. Renderer SHALL incrementally update keyed visible cards, controls and intersecting connectors, with full-scene navigation. Selection, viewport, semantic detail and colors SHALL NOT recalculate layout. Superseded or disposed requests SHALL NOT publish.

#### Scenario: Change focus while layout is pending

- **WHEN** an earlier layout completes after a newer focus or project request
- **THEN** it is discarded and only the current request may publish geometry.

### Requirement: Branch-relative descendant depth

Descendant generations SHALL count independently below the focus and every eligible sibling when ancestor depth is at least one. At ancestor depth two or more, Show cousins SHALL add the siblings of each recorded parent and apply the same descendant budget below each aunt or uncle. The toggle SHALL NOT add the siblings of grandparents or older ancestors. At depth zero the roots and eligible partners remain visible. Child paths are bounded by the chosen depth, and a family SHALL display only the child memberships admitted through eligible paths. Branch coloring is independent of visibility.