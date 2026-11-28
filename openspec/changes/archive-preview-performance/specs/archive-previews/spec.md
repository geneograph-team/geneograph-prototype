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

#### Scenario: Scroll through a collection larger than the cache

- **WHEN** a preview leaves the near-viewport window or its derivative is invalidated
- **THEN** its image element is detached and its generic fallback remains; re-entry may reuse a compatible retained derivative or request another bounded job
- **AND** cache eviction never revokes a URL still used by a mounted preview; admission waits if mounted leases occupy the available budget

#### Scenario: Authored thumbnail of an oversized original

- **WHEN** a distinct supported small authored thumbnail is available for a document whose original exceeds the thumbnail-source budget
- **THEN** the thumbnail may be hydrated using its own observable dimensions and source size rather than the original's metadata, without opening the oversized original for preview generation

#### Scenario: First compatible desktop selection

- **WHEN** a file is first selected in an ordinary desktop list without an active draft or bulk composition change
- **THEN** the existing list and previews are retained, the selection state and select-all affordance are synchronized, and the inspector alone is replaced

### Requirement: Responsive Archive presentation

Ordinary Details and Icons list rendering SHALL construct only the active desktop or mobile variant. A breakpoint transition SHALL rebuild the applicable presentation while preserving canonical selection and compatible focus/scroll behavior. An active file edit or rename SHALL retain its input DOM across breakpoint changes. The existing Image viewer retains its independent presentation and resize behavior.
