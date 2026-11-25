The founder retired the former 0–200% display-range requirement on 2026-11-25; it has already been removed from the baseline spec in #398. Remove the legacy mapping and tests tied solely to artificial endpoints during #400/#402/#404.

## MODIFIED Requirements

### Requirement: Progressive card details

Use actual CSS-pixel size of the fixed card footprint, not displayed percentage. At 100% actual scale the reference card is 300 × 124 CSS px. Approved lab minimum width × height (initial tuning values):

| Stage | Minimum px | Content |
| --- | --- | --- |
| Full | 278 × 112 | 3:4 portrait, full name, precise/partial dates, actions |
| Short | 228 × 92 | Omit patronymic first; portrait, given/family name, compact dates, actions |
| Compact | 174 × 70 | Hide portrait; name, compact dates, actions |
| Actions-only | 110 × 46 | Hide dates; name and actions |
| Label | 48 × 19 | Shortened name (given name when needed; lab below 115 px), no actions, stronger fill |
| Marker | Below Label | Color-coded marker, accessible identity |

All visible Edit/Add relative buttons SHALL be icon-only, right-aligned and retained as long as they fit safely. Actual thresholds may be tuned against legibility/hit targets with deviations documented. Keep fixed card/connector bounds, use hysteresis to avoid flicker, keep selection and inspector usable.

#### Scenario: Zoom out

- **WHEN** screen-space cards become smaller
- **THEN** patronymic, portrait and dates are removed before actions, followed by labels and markers
- **AND** the portrait never stretches or narrows; geometry and canonical selection are unchanged.

### Requirement: Viewport continuity

Display actual scale (100% is 1:1) without the artificial 0–200 range. Support positive finite scale bounds that make overview/marker and legible detail usable. Zoom SHALL preserve interaction anchor where possible; Fit SHALL fit full scene bounds, including controls and connectors, rather than reset to a synthetic default. Explicit Focus/center uses scene identity.

#### Scenario: Fit a large tree

- **WHEN** Fit is invoked
- **THEN** the full scene fits the available viewport, including offscreen cards and paths
- **AND** no layout call or genealogical mutation occurs.
