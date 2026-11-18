## ADDED Requirements

### Requirement: Sample data ownership
Sample board collections, Archive records, Notes records, source links, and sample-only initialization SHALL reside in `src/seed/`. Geneograph canvas and paint runtime factories and Archive/Notes domain helpers SHALL reside in their feature modules.

#### Scenario: Classic script startup
- **WHEN** the app opens through HTTP or `file://`
- **THEN** the ordered classic scripts initialize the same records before their consumers without missing globals or duplicate initialization

#### Scenario: Sample data preservation
- **WHEN** canonical sample data finishes initializing
- **THEN** record contents, counts, IDs, source links, attached evidence, note collections, board collections, and Archive document places match the pre-change state

#### Scenario: Feature use
- **WHEN** the user opens and edits Geneograph, Archive, or Notes
- **THEN** existing runtime functions, views, and in-memory edits work without behavior changes
