## ADDED Requirements

### Requirement: Bounded Archive previews

Archive SHALL hydrate Icons and Image filmstrip previews with display-sized derivatives, using bounded session-local jobs and storage. The full-resolution viewer SHALL continue to use the original document source.

#### Scenario: Switch between preview layouts

- **WHEN** a supported image becomes visible in Icons and then in the Image filmstrip in the same project and size tier
- **THEN** the two layouts reuse a compatible derivative while the viewer can display the original resolution

#### Scenario: Stale or failed preview

- **WHEN** a preview is unsupported, fails, or finishes after its target has left the current project or view
- **THEN** the current tile keeps its generic fallback and cannot receive the stale preview

### Requirement: Retained desktop single selection

Archive SHALL retain rows and tile image nodes during compatible desktop single-file selection.

#### Scenario: Select another file

- **WHEN** a user selects another file in the same desktop list and the selection and inspector composition are compatible
- **THEN** Archive updates selection and inspector state while keeping unaffected list and preview nodes mounted
