# Application diagnostics

## Recording lifecycle and privacy

The application SHALL provide a single opt-in, in-memory performance recorder independent of project and module selection, including when no project is open. Recording scope SHALL support the entire application or selected modules. Configuration defaults to entire application and Detailed mode and is editable only while stopped. Selected scope requires at least one module before recording can start.

The rolling buffer SHALL retain at most 256 operations and count evictions. Start after Stop SHALL append retained samples under a new recording epoch. Stop SHALL retain samples and mark retained pending traces stopped. Clear SHALL stop and discard retained samples. Evicted or earlier-epoch traces SHALL NOT modify the recording. Navigation SHALL NOT stop or clear it.

Export SHALL be an explicit local JSON download, schema version 3, containing allowlisted module and operation names, recording epoch, mode, sequence, relative timing, outcome and available diagnostic fields. No authored genealogy records, person/project IDs, search text, filenames, URLs, exception messages or automatic telemetry SHALL be included. The disabled path SHALL avoid trace allocation.

## Instrumentation

Basic mode SHALL retain operation durations and outcomes. Detailed mode SHALL additionally retain available Tree settings, cache indicators, stage timings, counters, ELK pass timings and milestones. Detailed non-Tree operations can also retain shared provider, query, preparation, markup, DOM and analysis evidence where instrumented.

The initial instrumented boundaries are project activation, destination-module navigation through activation, application shell render, Projects startup/open render, People, Albums, Archive, Notes, Places and Publish main render, synchronous GEDCOM parse/map/commit, Geneograph home, board opening and editor render, existing Tree operations, and hosted Places map initialization through ready, failure or disposal. Offline unsupported-map fallback and later style changes are not map initialization samples. Nested timings overlap and SHALL NOT be summed as independent elapsed time. The source map lists current module-specific stages and partial-update boundaries.

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

## Schema 3 and shared read-model evidence

The export retains the schema 2 operation identity, outcomes, Tree stage/count/milestone and pass timing fields. Schema 3 adds optional synchronous/asynchronous timing classification, anonymous parent sequence, allowlisted provider and lifecycle counters, and bounded browser metric summaries. A parent sample may roll out of the buffer before its children. Unclassified Tree records keep the existing Tree timing semantics. Readers should accept schema 2 without the new fields. The capacity remains 256 and the export reports dropped samples.

Detailed mode can show active-project provider cache reuse, builds and anonymous domain revision categories. Basic mode retains operation summaries. A frame opportunity is an optional animation-frame callback and is never presented as paint. Long-task aggregates are limited to the current/last Detailed all-module recording where supported. Disabled and selected-module contexts install no long-task observer. No raw browser entries, cache keys containing user data, project identities or authored values are exported.

### Recording summary coverage

Schema 3 optionally includes `summaryCoverage`. Its `recording` matches the epoch on the samples covered by the top-level browser and read-model lifecycle summaries. Its `configuration` is the mode, scope and module selection captured at Start. The top-level `configuration` describes current settings and can be changed after Stop. Start appends operation samples and initializes summaries for a new epoch. Historical summaries are unavailable and must not be interpreted as zero. Clear sets `summaryCoverage` to null. In older schema-3 exports the field is absent and the current/last summary epoch has to be inferred before making a comparison.

Native long-task summaries only count entries that start inside the observed epoch and are delivered or queued before Stop drains the observer. The browser may only publish an entry after a task returns. A task that starts before Start, or finishes after a synchronous Stop, may be absent even if an operation in that task has its own duration. `observed` with count zero means no qualifying entries were collected. `unsupported`, `outOfScope`, `basic` and `inactive` leave the count unmeasured. No per-operation long-task attribution is inferred.

A Tree gesture trace is finished only by its native input owner. A superseding gesture or disposal cancels it. A normal end completes it. A native touch cancellation cancels it. Stop terminates genuinely active retained traces. A delayed callback from an earlier gesture, an evicted trace, or another epoch cannot complete a newer trace.
