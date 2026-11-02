# Proposal

## Why

`src/final-overrides.css` still contains module, modal, and shared rules in a late cascade layer. This makes the effective style hard to locate and encourages competing declarations. Places-only rules have already moved to `notes-places.css`; the remaining rules need an ownership-based migration so the file can be removed without changing the prototype's appearance or interactions.

## What Changes

- Move remaining feature and modal rules into their owning module stylesheets; put genuinely shared controls in `foundation.css` or `resource-picker.css`.
- Reconcile duplicate declarations and responsive variants as rules move. Preserve current visual behavior, English/Russian layouts, keyboard focus, and direct `file://` opening.
- After the source is empty, remove `final-overrides.css` and its link from `src/index.html`; update documentation that still treats it as an active stylesheet.
- Scope the work as reviewable module passes, with focused visual checks after each pass and a full-module check before final removal.

## Capabilities

### New Capabilities

None. This is an internal stylesheet refactor with no new user-facing behavior.

### Modified Capabilities

None. Existing UI behavior and appearance are the preservation boundary; this change sets `skip_specs: true`.

## Impact

Touches `src/final-overrides.css`, the owning feature and shared CSS files, the stylesheet links in `src/index.html`, and relevant style documentation. No JavaScript behavior, dependency, build step, backend, or data format changes are planned. The working-tree edits to documentation and `.gitignore` belong to the user and must be preserved.