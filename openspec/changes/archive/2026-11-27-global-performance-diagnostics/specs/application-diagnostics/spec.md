# ADDED Requirements

### Requirement: Local application-wide diagnostic recording
The application SHALL provide opt-in bounded Basic and Detailed recording with all-application or selected-module scope, independent of the current project or module. Stop SHALL retain samples and terminate pending traces; Clear SHALL stop and discard them. Export SHALL be explicit, versioned and contain only allowlisted anonymous operation timings, outcomes and available numerical diagnostics. No automatic telemetry or authored data SHALL be included.

#### Scenario: Switch project or module
- **WHEN** recording is active and the user changes project or module
- **THEN** the same session continues and only operations in scope are retained

### Requirement: Global Diagnostics and active stop shortcut
Global settings SHALL present Diagnostics immediately before About and Tree Settings SHALL no longer contain recording controls. While recording is active, an accessible recording button SHALL appear immediately left of Help. Activating it SHALL stop recording, retain samples and open Diagnostics directly.

#### Scenario: Stop from navigation
- **WHEN** a user activates the recording button
- **THEN** recording stops, the button disappears, and Diagnostics opens with export available for retained samples
