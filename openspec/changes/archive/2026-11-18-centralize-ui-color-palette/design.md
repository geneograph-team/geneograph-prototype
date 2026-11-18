# Design

## Context

See [proposal.md](proposal.md). `src/core/foundation.css` currently owns two sets of theme tokens and also contains many component-level colors; 36 module CSS files and several classic scripts contain further literals. The `add-light-theme` change is still in progress (12/13 tasks) and supplies theme preference plus Geneograph color provenance. Its present Paper & Forest values differ from the approved v3 palette. The supplied v3 package has structured JSON, production CSS roles, contrast results, and preview assets; its CSS also contains demo component rules and compatibility aliases.

## Goals / Non-Goals

**Goals:** One local authoritative source for application UI colors; v3 values in both resolved themes; direct file opening; a repeatable guard against new raw UI colors.

**Non-Goals:** Reworking theme preference, authored board/user-selected colors, photographs, illustration/SVG artwork, Leaflet tiles, Quill/Leaflet source CSS, or creating a user palette editor. No palette hue/value changes are authorized by this plan.

## Decisions

### Store the approved palette in the repository

Copy the approved structured palette and a production-token CSS subset into `src/core/`, recording version/source in a short README. Load tokens before `foundation.css`. Keep the external package as the approved reference, not a runtime path. Exclude the package’s demo `.gg-*` component rules and unused compatibility aliases from production CSS; they can collide with local component ownership and duplicate roles. Avoid a runtime fetch or build step so `file://` remains functional. Check the copied token values against the approved package during migration.

### Use a semantic role bridge during migration

Keep existing component selectors and layout in their owning stylesheets. In `foundation.css`, map legacy semantic token names to approved `--gg-*` roles as a temporary compatibility bridge, without defining independent hex/RGB values. Migrate consumers by ownership area, then remove unused aliases. UI-generated styles and SVG icons use CSS variables or `currentColor`; user-authored colors and board provenance stay on the content path. Where the palette has no suitable role, record the gap and ask for approval before adding a value or altering the approved palette. A role alias to an existing approved value is permissible only if it has a documented distinct meaning.

### Enforce color ownership with a focused static check

Add a dependency-free check over first-party UI CSS, HTML, and JS. Flag literal hex, RGB/HSL/OKLCH, named colors where used as values, CSS gradients with raw stops, and color-bearing SVG attributes or data URLs; report file and line. Explicitly scope out approved palette files, authored board data, media/artwork, vendor libraries, and content colors. Allow CSS keywords such as `transparent`, `currentColor`, and inheritance. Keep narrow, documented exceptions only when a literal represents user content or a browser API value rather than application UI. Run the check in review/verification, not at runtime.

### Preserve category and state semantics

Use v3’s nine families for category identity, Heritage Green for primary interaction, and status roles for success/warning/error. Do not map death to error or archive gold to warning. Apply the supplied contrast report as a baseline, then inspect real text, focus, selection, overlay, disabled, and inverse-hero states at desktop and phone sizes in English and Russian. Use the existing Heritage Green container/on-container pair for branded heroes: pale in Light and deep in Dark. This supersedes the dark-in-both-themes hero treatment in the earlier light-theme plan. No new hero color is introduced.

## Risks / Trade-offs

- [v3 changes both existing themes visibly] → Review representative components in both themes; treat changes as intentional palette adoption while correcting any unreadable state.
- [Existing token names have multiple meanings] → Map by use, not by matching hex; split semantic aliases only where roles differ, subject to palette approval for new values.
- [Generated UI and SVG strings bypass CSS scanning] → Include first-party scripts and inline SVG in the ownership check, then inspect any exceptions.
- [Checker may flag authored content or miss dynamic color composition] → Narrow scope by path and source role, maintain documented exceptions, and manually review runtime color paths.
- [Concurrent light-theme change touches the same files] → Finish or reconcile that change first; preserve its theme preference and board provenance. Review diffs before migrating each owner.
- [External package contains more than production tokens] → Copy only approved data and token roles required at runtime; retain source/version documentation and compare values.

## Migration Plan

1. Confirm `add-light-theme` changes are present and reconcile overlapping files; keep its pending browser QA status separate.
2. Snapshot the approved v3 package/version and make the local production palette load first. Update `foundation.css` aliases and shared controls without duplicate definitions.
3. Move module UI literals into semantic roles in small owning-stylesheet passes; handle UI-generated JS/SVG separately. Preserve all current content colors.
4. Add and run the literal-color check; document role selection, exceptions, and the approval path for any genuinely new palette color.
5. Review both themes and key workflows at desktop and phone widths; run focused syntax checks, palette check, OpenSpec validation, and `git diff --check`. Rollback by reverting this change’s palette wiring and color mappings together, leaving theme preference and board provenance intact.

