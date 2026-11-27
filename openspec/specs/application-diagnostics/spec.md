# Application diagnostics

## Recording lifecycle and privacy

The application SHALL provide a single opt-in, in-memory performance recorder independent of project and module selection, including when no project is open. Recording scope SHALL support the entire application or selected modules. Configuration defaults to entire application and Detailed mode and is editable only while stopped. Selected scope requires at least one module before recording can start.

The rolling buffer SHALL retain at most 256 operations and count evictions. Start after Stop SHALL append retained samples under a new recording epoch. Stop SHALL retain samples and mark retained pending traces stopped. Clear SHALL stop and discard retained samples. Evicted or earlier-epoch traces SHALL NOT modify the recording. Navigation SHALL NOT stop or clear it.

Export SHALL be an explicit local JSON download, schema version 2, containing allowlisted module and operation names, recording epoch, mode, sequence, relative timing, outcome and available diagnostic fields. No authored genealogy records, person/project IDs, search text, filenames, URLs, exception messages or automatic telemetry SHALL be included. The disabled path SHALL avoid trace allocation.

## Instrumentation

Basic mode SHALL retain operation durations and outcomes. Detailed mode SHALL additionally retain available Tree settings, cache indicators, stage timings, counters, ELK pass timings and milestones. Non-Tree operations currently expose operation-level durations and outcomes in both modes.

The initial instrumented boundaries are project activation, destination-module navigation through activation, application shell render, Projects startup/open render, People, Albums, Archive, Notes, Places and Publish main render, synchronous GEDCOM parse/map/commit, Geneograph home, board opening and editor render, existing Tree operations, and hosted Places map initialization through ready, failure or disposal. Offline unsupported-map fallback and later style changes are not map initialization samples. Nested timings overlap and SHALL NOT be summed as independent elapsed time. Additional module-specific internal stages are separate work.

## Global settings and recording shortcut

Global Settings SHALL present Diagnostics immediately before About, in place of the recording controls formerly in Tree Settings. Diagnostics SHALL provide scope and mode selectors, module checkboxes for selected scope, Start/Stop, Clear and Export, localized mode descriptions, current recording state and retained/dropped counts. The selectors SHALL reuse the common Global Settings chevron control pattern with aligned widths and narrow-screen stacking. Status and counts SHALL be visually separated from mode descriptions.

While recording is active, an accessible recording button SHALL appear immediately left of Help. It SHALL be hidden while stopped. Activating it SHALL stop the recorder using the same stop action, retain samples, hide the button and open Diagnostics directly. It SHALL NOT clear, export or restart automatically.

## Scenarios

### Switch project or module

- **WHEN** recording is active and a user changes projects or modules
- **THEN** the recording continues, retaining previous samples and excluding operations outside the selected scope.

### Stop from navigation

- **WHEN** the active recording button is activated
- **THEN** recording stops, the button disappears and Diagnostics opens with retained samples available for export.

See [Family Tree](../family-tree/spec.md) for Tree-specific rendering and layout behavior.
