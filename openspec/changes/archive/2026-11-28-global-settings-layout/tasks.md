# Tasks

- [x] Refine four-section hierarchy and retain tour in General and Help.
- [x] Bound modal and update section contents independently of navigation.
- [x] Preserve Diagnostics, version copy and provider credits; localize labels.
- [x] Execute 23 focused markup/navigation/scroll-state assertions with isolated JavaScript and DOM/Node module doubles; changed JS/CJS syntax checked; Help, provider markup and Diagnostics binder compared unchanged.
- [ ] Run native regression and actual browser layout/scroll/keyboard, narrow/short viewport, EN/RU/theme, tour and nested Diagnostics checks.
- [x] Founder explicitly accepted #520 and requested closure; reconcile canonical requirements and prepare archival in the closeout PR.

- [x] Apply founder-approved visual polish: subtly tinted group surfaces, medium rounding, consistent General select width, lighter navigation weight, clearer group headings, reduced chrome padding and full-width informational rows.
- [ ] Verify actual appearance and control alignment in both themes and at responsive widths after visual polish.

Visual polish: 32 existing and new focused assertions passed using isolated JavaScript and DOM/Node module doubles (23 existing, 9 new CSS contracts). No native suite or actual browser visual verification claimed.

## Accepted closeout — 2026-11-28

PRs #521 and #522 are merged. Founder screenshots show the General and About grouping, compact version, retained provider links, stationary frame and visual polish at the shown desktop dimensions. They do not independently establish scroll behavior or the complete responsive/keyboard/locale/recording/tour matrix. Earlier reports record 23 and 32 focused assertions with isolated JS/DOM/Node doubles and localization checks; native suite and full browser QA remain unperformed or unverified. The founder accepts the implementation with these limitations. A subsequent requested manual color adjustment to match the sidebar was explained; pushed default still has the theme-adaptive tint from #522. Unpushed local edits are not visible and are not changed by this archive. No runtime tests rerun. Keep unperformed checks unchecked.
