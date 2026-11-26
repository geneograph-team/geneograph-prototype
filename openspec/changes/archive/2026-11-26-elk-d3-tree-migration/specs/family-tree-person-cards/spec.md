# Historical migration delta

Current requirements are consolidated in the [current specification](../../../../../specs/family-tree-person-cards/spec.md). The text below retains the migration proposal and lab decisions for traceability.

## MODIFIED Requirements

### Requirement: Distinct gender cues

Existing gender fill and outline remain available independently. When Gender is selected for a channel, male, female and unknown gender SHALL be distinguishable in both themes. Neutral and Branch are alternative channel modes; gender must not be forced when another mode is selected.

#### Scenario: Gender outline with branch fill

- **WHEN** the researcher selects Gender outline and Branch fill
- **THEN** gender outlines remain distinguishable and branch fill remains visible in both themes.

### Requirement: Interaction state does not erase identity

Selection, hover, keyboard focus and existing separate Focus control SHALL remain distinguishable independently of the selected category coloring. Preserve canonical actions on all occurrences.

#### Scenario: Select a branch-colored card

- **WHEN** the researcher selects a branch-colored occurrence
- **THEN** selection is visible without obscuring the category cue or changing the canonical target.

## ADDED Requirements

### Requirement: Detailed card content and date presentation

Detailed card SHALL have rectangular 3:4 portrait (crop, never distort), full name, dates, icon-only right-aligned Edit/Add relative. Drop patronymic first as space decreases; apply approved semantic stages. Use current structured facts, localized date precision and qualifiers, without b./d. prefixes or invented values.

| Facts / status | Display example |
| --- | --- |
| Both years | 1936–2014 |
| Both precise dates, full | 12 Mar 1936, next line – 4 Oct 2014 |
| Birth only, confirmed living | 1965 |
| Birth only, unknown or deceased | 1904–? |
| Death only | ?–1974 |
| No dates, confirmed living | Empty |
| No dates, unknown status | Unknown |
| No dates, confirmed deceased | Deceased |
| Qualified dates | c. 1880–bef. 1950 |

Month/year and partial precision, approximate/before/after/between/range qualifiers and localized equivalents SHALL be preserved; lower visible-date stages use compact years without implying certainty. Keep full accessible precision. Inconsistent imported facts SHALL be handled explicitly without inventing status or altering facts.

#### Scenario: Unknown birth, known death

- **WHEN** the recorded death year is 1974 and birth is unrecorded
- **THEN** the card displays ?–1974 at year detail.

### Requirement: Project-level branch coloring

Presets 2/4/8/16 split through generations 1/2/3/4 from the canonical reference. The father and mother first receive slots 1 and 2. At each later splitting generation, fathers inherit and mothers receive new slots in fixed father-first path order. Both parents inherit beyond the split. Missing paths leave slots vacant. All attributable direct ancestors are colored. The reference, unresolved paths, unrelated spouses and collateral by default remain neutral. Optional collateral coloring follows uniquely attributable child paths without traversing the reference or direct ancestors. Repeated appearances use their actual visual parent/child context and retain colors through expansion transfer. Focus, visible depth and orientation do not renumber branches.

Fill and outline independently offer Neutral/Gender/Branch; connectors Neutral/Branch. Color connectors only for matching non-neutral branch endpoints, mixed joins neutral. Preserve gender-mode compatibility, localized legend and accessible categories, independent selection/focus cues. Stronger fill at overview. Custom branch starting points/colors deferred.

Ordered palette reference, first N used:

- Light: #3976ad, #b75e81, #278275, #ad782c, #7958b1, #ad503f, #548531, #3987a7, #9b6689, #697fbd, #8e8331, #328f9d, #a55778, #6a925f, #b76e39, #8177a2.
- Dark: #71b2eb, #e98eaf, #59c3b0, #e6b75b, #bba0f1, #ed927c, #a6c96b, #70c7e6, #d7a0d0, #9baee9, #d0c96b, #6dcfcb, #e9a2b4, #a1c49a, #efad79, #b6acd6.
- Neutral light #87938b, dark #828f86. Lab blend strengths: .13 Full/Short/Compact, .25 Actions-only, .90 Label, .99 Marker. Validate production contrast and distinguishability, document adjustments.

#### Scenario: Change focus

- **WHEN** the researcher focuses another person without changing reference/settings
- **THEN** each occurrence with the same branch context retains its color
- **AND** no canonical color attribute is written.
