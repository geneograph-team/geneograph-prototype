# Proposal

## Why

The prototype has shared control classes, but module stylesheets still repeat button, select, checkbox, label, and focus treatments. A small, explicit shared-control layer will make future changes consistent and reduce the number of CSS files a developer must inspect.

## What Changes

- Define one reusable base for common buttons, icon buttons, text fields, native selects, checkboxes, and form labels. Standardize recurring dropdown and field appearance, including hover, disabled, and focus color and width, instead of retaining inconsistent browser defaults.
- Move duplicate visual declarations from module CSS into that shared owner. Keep module CSS responsible for placement, dimensions imposed by a view, and genuinely distinct controls such as canvas tools and photo-region handles.
- Preserve current interactions, accessible names, English/Russian layouts, desktop/phone behavior, and direct `file://` loading. Intentional visual changes are limited to bringing recurring controls up to the shared standard; give genuinely unique controls, such as Living status, explicit named exceptions.
- Document the class/ownership contract so later control changes edit the shared rule directly instead of adding module overrides.

## Capabilities

No capability requirements change. This preserves functional behavior while intentionally standardizing control presentation; `.openspec.yaml` sets `skip_specs: true`.

## Impact

`src/core/foundation.css`, a focused shared control stylesheet under `src/shared/`, the ordered CSS tags in `src/index.html`, and only the module styles/markup needed to adopt common classes. No runtime dependency, build step, data model, or persistence change.