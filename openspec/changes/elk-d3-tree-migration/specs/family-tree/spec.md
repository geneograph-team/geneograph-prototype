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

ELK SHALL own generation alignment, compound geometry and initial placement, with at most two solves for approved dynamic spacing. Partner and parent-slot order SHALL be expressed as a native input preference before placement; no post-solve partner permutations are permitted. A guarded ancestry-first stage MAY translate ordinary family groups rigidly along the cross axis before final inline routing. Routing consumes accepted coordinates without moving cards. Renderer SHALL incrementally update keyed visible cards, controls and intersecting connectors, with full-scene navigation. Selection, viewport, semantic detail and colors SHALL NOT recalculate layout. Superseded or disposed requests SHALL NOT publish.

#### Scenario: Change focus while layout is pending

- **WHEN** an earlier layout completes after a newer focus or project request
- **THEN** it is discarded and only the current request may publish geometry.

### Requirement: Guarded ancestry-first family centering

An ordinary two-person family group with two distinct unambiguous known parental families SHALL prefer the midpoint of those parental families. Collateral branches SHALL NOT force a displaced ordinary couple to remain off-center when a safe correction exists. Corrections SHALL preserve the generation axis, internal partner geometry and order, relative group order and minimum available clearance, relationship memberships and connector integrity. Descendant groups MAY follow rigidly when all their incoming families move together. Shared partnership blocks and placeholder groups SHALL retain native placement. Already centered groups SHALL remain unchanged unless they follow an accepted rigid translation. A correction SHALL be rejected when another eligible couple's centering worsens or routing adds geometry conflicts. Rejected corrections SHALL retain the last valid scene; the existing inline router SHALL own final connectors. No extra solver passes or synthetic relationships are permitted.

#### Scenario: Asymmetric collateral branch

- **WHEN** a sibling with or without descendants pulls an ordinary couple away from the midpoint between its known parental families
- **THEN** center the couple when all placement and routing invariants permit
- **AND** preserve previously balanced ancestral couples and compact partnerships.

#### Scenario: Unsafe correction

- **WHEN** a proposed translation violates group clearance, ancestry centering or connector integrity
- **THEN** retain the last valid placement and its routes.

### Requirement: Branch-relative descendant depth

Descendant generations SHALL count independently below the focus and every eligible sibling when ancestor depth is at least one. At ancestor depth two or more, Show cousins SHALL add the siblings of each recorded parent and apply the same descendant budget below each aunt or uncle. The toggle SHALL NOT add the siblings of grandparents or older ancestors. At depth zero the roots and eligible partners remain visible. Child paths are bounded by the chosen depth, and a family SHALL display only the child memberships admitted through eligible paths. Branch coloring is independent of visibility.
### Requirement: Shared partner geometry and saved presentation

Principal mixed-gender pairs SHALL prefer male left in Vertical and above in Horizontal. Missing-parent slots SHALL prefer father-left/above and mother-right/below order, including secondary households, without modifying canonical gender. Secondary real partners retain flexible placement. ELK may prioritize global placement over these preferences; reversed preferences SHALL be identified by a nonfatal diagnostic without changing the native partner positions or relaxing geometry validation. Nonfatal diagnostics SHALL provide an expandable localized explanation and identify affected people or relationships where available, distinguishing placement/connection problems from ambiguous relationship contexts. The principal family SHALL be selected per connected visible partnership group relative to the focused occurrence: prioritize direct ancestral households, then proximity to the focus and visible children, with deterministic input-order ties. Prefer ancestry-aware household order and native bottom-up hierarchical crossing minimization without forcing all model order. The #411 experimental target is strict principal ordering, with secondary real partners flexible; native heuristic exceptions remain diagnosed until broader verification and founder acceptance establish a stricter contract. Real partnerships have a uniform nominal minimum of 40 layout units. Relationship status changes the stroke treatment. Secondary placements retain their outward clearance calculation and larger minimum.

New or missing ancestor-depth settings SHALL default to five generations and accept zero through eight. Valid saved depths are retained. Committed depth, Show cousins, orientation and branch display preferences SHALL be cached per project in the current browser profile when local storage is available. A restored camera must match the layout key.
