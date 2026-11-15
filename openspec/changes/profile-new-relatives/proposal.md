# Why

Issue 194 advances the parallel Profile New Overview by populating its Relatives card. The established relationship renderer and handlers already provide the canonical grouping, row data, count, and actions.

# What Changes

- Render the existing relationship list and count for the selected project person inside Profile New's fixed-height Relatives card.
- Bind the shared Profile relationship handlers so relative navigation opens the legacy Profile and edit/unlink retain their existing dialogs.
- Scope padding, overflow, and compact empty-state styling to Profile New.

# Boundaries

Legacy Profile, Family Tree relationships, Timeline, Facts & connections, other tabs, data models, and persistence remain unchanged.
