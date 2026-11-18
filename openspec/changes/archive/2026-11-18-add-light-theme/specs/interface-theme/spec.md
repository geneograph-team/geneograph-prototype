# Spec Delta

## Purpose

Defines how the prototype selects and presents dark and light interface appearances across its active research workspace.

## ADDED Requirements

### Requirement: Theme preference
The system SHALL offer Dark, Light, and System appearance choices in Global settings, starting with System when no choice has been saved.

#### Scenario: First visit
- **WHEN** the prototype opens with no saved appearance choice
- **THEN** it uses the device's current light or dark preference

#### Scenario: Manual choice
- **WHEN** a user selects Dark or Light
- **THEN** the interface changes immediately and retains that choice across reloads

#### Scenario: System changes
- **WHEN** System is selected and the device appearance changes while the prototype is open
- **THEN** the interface updates to match the new device appearance

### Requirement: Complete light presentation
The system SHALL apply Paper & Forest light colors consistently to the app shell, shared controls, active modules, dialogs, and auxiliary views while preserving readable dark presentation.

#### Scenario: Switch while working
- **WHEN** the user switches between Light and Dark in any active module
- **THEN** visible surfaces, text, controls, focus indicators, overlays, and open dialogs use the selected appearance without losing the current workflow

#### Scenario: Branded hero
- **WHEN** Light is active and a dark green branded hero is visible
- **THEN** the hero retains its dark green treatment with readable foreground content

#### Scenario: Localization and direct opening
- **WHEN** the prototype is opened directly from its local `src/index.html` in English or Russian
- **THEN** theme selection and visible theme labels work without a build step or server
