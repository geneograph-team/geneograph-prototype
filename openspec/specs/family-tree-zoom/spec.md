# Family Tree zoom

## Requirements

### Actual scale and viewport continuity

The displayed percentage SHALL use actual scale. At 100%, the ordinary card footprint is 300 × 124 CSS pixels. Supported positive scales extend from the normal overview minimum through 180%; Fit may go lower to include all scene bounds, including controls and connectors. Zoom preserves the interaction anchor where applicable. Explicit focus centers the appropriate occurrence. The viewport supports pointer pan, wheel, pinch, keyboard and resize. Fit, camera movement and scale changes reuse the mounted scene without a solver request or canonical edit.

### Progressive detail

Choose detail from the screen-space size of the fixed card footprint. At marker and label detail, canonical selection and the inspector remain usable. Semantic detail changes do not change layout geometry.

| Stage | Minimum CSS px | Visible detail |
| --- | --- | --- |
| Full | 278 × 112 | Portrait, full name, detailed dates, actions |
| Short | 228 × 92 | Portrait, shorter name, compact dates, actions |
| Compact | 174 × 70 | Shorter name, compact dates, actions |
| Actions | 110 × 46 | Name and actions |
| Label | 48 × 19 | Short name without card actions |
| Marker | Below Label | Color marker with accessible identity |

Edit and Add relative remain icon-only and right aligned where shown. Standalone Focus controls are anchored above the right side of eligible cards and hidden at overview scales. A focused action that disappears during zoom transfers keyboard focus to the card.
