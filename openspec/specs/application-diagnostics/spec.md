# Application diagnostics

## Recording lifecycle and privacy

The application SHALL provide a single opt-in, in-memory performance recorder independent of project and module selection, including when no project is open. Recording scope SHALL support the entire application or selected modules. Configuration defaults to entire application and Detailed mode and is editable only while stopped. Selected scope requires at least one module before recording can start.

The rolling buffer SHALL retain at most 256 operations and count evictions. Start after Stop SHALL append retained samples under a new recording epoch. Stop SHALL retain samples and mark retained pending traces stopped. Clear SHALL stop and discard retained samples. Evicted traces SHALL NOT reenter the sample buffer. A completion observed before Stop may contribute to its epoch aggregate after eviction. Earlier-epoch completions SHALL NOT modify the recording. Navigation SHALL NOT stop or clear it.

Export SHALL be an explicit local JSON download, schema version 3, containing allowlisted module and operation names, recording epoch, mode, sequence, relative timing, outcome and available diagnostic fields. No authored genealogy records, person/project IDs, search text, filenames, URLs, exception messages or automatic telemetry SHALL be included. The disabled path SHALL avoid trace allocation.

## Instrumentation

Basic mode SHALL retain operation durations and outcomes. Detailed mode SHALL additionally retain available Tree settings, cache indicators, stage timings, counters, ELK pass timings and milestones. Detailed non-Tree operations can also retain shared provider, query, preparation, markup, DOM and analysis evidence where instrumented.

The initial instrumented boundaries are project activation, destination-module navigation through activation, application shell render, Projects startup/open render, People, Albums, Archive, Notes, Places and Publish main render, synchronous GEDCOM parse/map/commit, Geneograph home, board opening and editor render, existing Tree operations, and hosted Places map initialization through ready, failure or disposal. Offline unsupported-map fallback and later style changes are not map initialization samples. Nested timings overlap and SHALL NOT be summed as independent elapsed time. The source map lists current module-specific stages and partial-update boundaries.

## Global settings and recording shortcut

Global Settings SHALL present Diagnostics immediately before About, in place of the recording controls formerly in Tree Settings. Diagnostics SHALL provide scope and mode selectors with aligned shared chevron controls and narrow-screen stacking. Entire application remains the default; Selected modules initially contains no checked modules and exposes the eight available modules, excluding unreleased Publish while preserving internal instrumentation and entire-application semantics. Select all and Unselect all update the configuration once. Empty selected scope disables Start/New recording and shows only a localized explanatory hint; no selection count is displayed. Preserve explicit module selection during scope changes and modal reopening. Active recording locks configuration.

The configuration SHALL be compact, with a borderless, subtly differentiated module surface, shared checkbox styling, approximately 32px row hit areas, compact bulk actions, and no repeated fieldset legend. Use readable typography hierarchy, responsive grid and only the selected mode's localized description adjacent to its selector. A single divider separates configuration from recording actions. Disabled primary actions SHALL have visibly disabled token-backed styling. Preserve keyboard focus and accessible fieldset/description associations.

Diagnostics SHALL show Ready, Recording in progress and Recording ready to export states, with exported and empty-stop feedback. Ready hides empty counters and export/discard. Active displays label above operation count, a filled red Stop button with stop-square icon, dropped warning when needed and locked settings. Start is green with a play icon. Stopped results show label-above-value retained/dropped metrics and prioritize green Export with download icon, secondary New recording and quiet Discard. Successful local download initiation marks the retained epoch exported, not durable disk success; retain results for re-export. New recording validates scope before replacing data, confirms if unexported, and starts fresh; Discard always confirms. Cancellation preserves retained data. Generic recorder Start SHALL retain append semantics. Update live counters without repeatedly replacing controls or announcing every count change. Empty Stop returns to Ready with explanatory feedback.

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

Detailed mode can show active-project provider cache reuse, builds and anonymous domain revision categories. Basic mode retains operation summaries. A frame opportunity is an optional animation-frame callback and is never presented as paint. Where supported, Detailed recordings observe page-wide long tasks even with selected modules. Basic and inactive contexts install no long-task observer. No raw browser entries, cache keys containing user data, project identities or authored values are exported.

### Recording summary coverage

Schema 3 optionally includes `summaryCoverage`. Its `recording` matches the epoch on the samples covered by the top-level browser and read-model lifecycle summaries. Its `configuration` is the mode, scope and module selection captured at Start. The top-level `configuration` describes current settings and can be changed after Stop. Start appends operation samples and initializes summaries for a new epoch. Historical read-model lifecycle and Archive summaries are unavailable and must not be interpreted as zero. The additive epochSummaries field retains the latest eight recording summaries and reports omitted epochs. Clear sets `summaryCoverage` to null. In older schema-3 exports the field is absent and the current/last summary epoch has to be inferred before making a comparison.

Native long-task summaries only count entries that start inside the observed epoch and are delivered or queued before Stop drains the observer. The browser may only publish an entry after a task returns. A task that starts before Start, or finishes after a synchronous Stop, may be absent even if an operation in that task has its own duration. `observed` with count zero means no qualifying entries were collected. `unsupported`, `outOfScope`, `basic` and `inactive` leave the count unmeasured. No per-operation long-task attribution is inferred.

A Tree gesture trace is finished only by its native input owner. A superseding gesture or disposal cancels it. A normal end completes it. A native touch cancellation cancels it. Stop terminates genuinely active retained traces. A delayed callback from an earlier gesture, an evicted trace, or another epoch cannot complete a newer trace.

## Artifact build identity

The export SHALL carry an additive schema-3 `buildInfo` object when the shared
artifact identity is available to the runtime. It describes the loaded
artifact, not a remote branch head: version, full revision, short revision,
tag, commit distance and channel. Unavailable values are null; an unprepared
checkout has channel local. The immutable artifact identity applies to all
epochs in the export. Older exports without this object remain valid.

The Pages artifact build SHALL derive metadata from the actual checked-out
commit using complete Git history. Among reachable strict numeric
`vMAJOR.MINOR.PATCH` tags (no leading zeroes), choose the smallest
`git rev-list --count refs/tags/<tag>..HEAD` distance, breaking ties by the
highest numeric version. Exact tags identify releases; later commits use
`<version>-dev.<distance>`. Without a valid reachable tag, report a
development build with known revision and no release version. An unprepared
checkout has unknown version and revision. Prepared static artifacts retain
their embedded identity on HTTP(S) or direct file opening; subsequent local
edits are not detected. Runtime display/export SHALL NOT fetch Git or remote
state. Metadata generation SHALL modify only the copied artifact, preserve
geocoder configuration and existing publishing triggers, and never create
tags or releases. Tag-only pushes do not trigger deployment. See the
[Global settings specification](../global-settings/spec.md) for About display
and copy behavior.

## Archive Detailed evidence
Detailed Archive operations SHALL expose available allowlisted layout, presentation, full/partial/observation path, result and mounted structure counts and separated render stages. The existing epoch-scoped recorder SHALL aggregate bounded asynchronous image observation, explicit decode and thumbnail generation outcomes, timings and available dimensions, cache counters and gauges without retaining image identity or initiating additional image work. Unsupported/unavailable measurements remain absent. Stop/clear/replacement SHALL exclude obsolete completions. Basic/inactive/excluded scopes SHALL not collect Archive details. Native load elapsed and frame opportunities SHALL NOT be represented as pure decode or paint; long tasks remain page-wide in Entire application Detailed only. Schema 3 remains backward compatible.

Archive evidence SHALL retain the existing bounded current-epoch summary and allowlisted source categories, with missing observations omitted rather than fabricated. Mounted counts do not imply viewport visibility. Observed dimensions and estimated decoded bytes are not resident browser memory. No extra image fetch/decode is initiated for diagnostics; future optimization hooks are not evidence of an implemented cache. See the [source map](../../../doc/source-map.md) for measurement semantics.
