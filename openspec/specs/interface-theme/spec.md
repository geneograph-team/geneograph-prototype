# Interface theme

## Purpose

Current appearance behavior of the browser prototype.

## Requirements

### Requirement: System preference and manual themes
Global settings SHALL offer System, Light, and Dark appearance. The initial
choice SHALL be System when no preference has been stored. Choosing Light or
Dark SHALL immediately update the UI and retain the preference across reloads.

#### Scenario: Follow the device
- **WHEN** System is selected and the device appearance changes
- **THEN** the effective interface theme follows the device preference

### Requirement: Compatible module presentation
Theme changes SHALL preserve the current view and data while applying
appropriate colors to the shell, controls, dialogs, and active modules.
Both EN/RU and direct `file://` opening SHALL remain supported.

#### Scenario: Switch while editing
- **WHEN** the user changes appearance in an active workspace
- **THEN** the view remains usable without recreating the edited record
