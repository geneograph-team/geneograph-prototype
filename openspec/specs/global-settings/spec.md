# Global settings

## Settings organization and navigation

Global settings SHALL expose General, Storage & backup, Diagnostics and About
in that order. General SHALL group functional Interface theme and Language
under Appearance and Regional preferences, and retain a dedicated Product
tour group using the existing tour start action. The tour SHALL remain
available from Help. Preview-only startup and read-only timezone controls
SHALL NOT appear. Storage & backup SHALL describe unavailable local backup
and cloud sync features without suggesting they work. Diagnostics SHALL
preserve its recording behavior and configuration hierarchy (see
[Application diagnostics](../application-diagnostics/spec.md)).

About SHALL group Application (Version and GeneoGraph website) and Legal &
credits (Privacy policy, Open-source licenses and Data providers). Help
center and contact support remain in Help, not duplicate About rows.
First-party external destinations SHALL use shared text links; third-party
provider attribution wording, destinations and existing inline link styling
SHALL be preserved. New labels and accessible names SHALL support EN/RU.

## About version identity

About SHALL show one Version row with the normalized Git version and short
build revision as a single string, for example `1.6.1-96219dd` or
`1.6.1-dev.1-ac00659`. Untagged builds with a known revision display a
localized Development build label with short revision; an unprepared
checkout displays Local development build without asserting a revision.
An accessible icon-only copy action SHALL copy exactly the displayed string.
If clipboard access is unavailable, offer selectable text for manual copy
and localized feedback. Separate Build and Channel rows SHALL NOT appear.
Full revision, tag, distance and channel remain in Diagnostics. The shared
identity and derivation rules are defined in
[Application diagnostics](../application-diagnostics/spec.md#artifact-build-identity).

## Responsive content scrolling

At ordinary desktop and narrow viewport sizes the settings dialog SHALL
retain stable dimensions across section changes, with header, navigation
and footer stationary and only the selected content panel scrolling as
needed. Narrow layouts stack navigation above the panel. At exceptionally
short viewports (360 CSS px or less, or 480 CSS px or less with stacked
navigation), a single outer scroll owner preserves reachability.
Section changes replace the panel contents, retain navigation focus and
reset content scroll; same-section language refresh preserves scroll and
focus where practical. Keyboard users SHALL be able to focus the scroll
panel and reach all actions. Settings navigation SHALL NOT stop or restart
Diagnostics recordings; nested confirmations retain their existing lifecycle.
Other modals keep their own scrolling behavior.

## Consistent settings presentation

Groups SHALL use a subtle theme-adaptive surface using existing semantic
palette tokens, medium corner rounding, clear group headings and subtle
dividers. General preference selects share a 160px desktop width and fill
their control row on narrow screens. Informational rows without actions
span the available grid. Header/footer spacing is compact while preserving
reachability. Provider link styling and Diagnostics state presentation
remain unchanged.
