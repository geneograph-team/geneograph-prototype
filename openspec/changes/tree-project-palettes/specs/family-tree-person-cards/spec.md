# MODIFIED Requirements

### Project display channels

Fill and outline independently support Gender, Branch and Neutral. Connectors support Branch and Neutral; normal and partner connectors use the chosen neutral color for unresolved or neutral paths. Preserve existing branch classification and selection/focus cues. Each project's editable light and dark palettes SHALL contain the same sixteen slots plus male, female, unknown and neutral colors. All slots remain stored and editable independent of the selected count. Invalid or absent values use the theme defaults. Theme switching resolves the appropriate palette without changing layout or records.

#### Scenario: Edit and reset colors
- **WHEN** the user changes or resets colors in the staged settings draft
- **THEN** only Apply commits them to project display preferences, and color-only application repaints without a geometry solve or viewport/selection reset.
