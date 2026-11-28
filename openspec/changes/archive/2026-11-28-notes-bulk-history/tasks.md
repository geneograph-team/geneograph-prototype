# Tasks

- [x] Implement independent selection, contextual bulk actions and shared batch mutation helpers.
- [x] Extend existing collection picker and Notes-only Quill history controls.
- [x] 30 focused assertions executed against actual selection, scoped deletion, membership and history-control functions in isolated JavaScript with test doubles; modified JS/CJS syntax checked. Initial localization catalog construction and duplicate-key checks passed.
- [ ] Verify native regression suite and real browser workflows (selection/range, mixed memberships, all actions, stale modal, editor history, keyboard, EN/RU, themes and responsive layout).
- [x] Founder explicitly accepted #505 and requested closure; canonical requirements reconciled and archival prepared in the closeout PR.

Review follow-up: 53 combined focused assertions passed in isolated JavaScript using actual mutation/history and editor-retention code with test doubles, including same-project return rejection, archive idempotence and history cleanup on content replacement. Browser QA and native commands remain unrun.

Checkbox polish follow-up: reserve the existing checkbox column and hit area, use a 16px title-aligned glyph, reveal on hover/focus or any active selection, and retain visibility on coarse/touch devices. 50 focused selection/history and CSS/markup assertions passed using isolated JavaScript with test doubles; modified JS/CJS syntax checked. Actual full-app browser QA and native repository commands remain pending.

## Accepted closeout — 2026-11-28

Implementation PRs #524 and #525 are merged. Founder approved hover-revealed, title-aligned 16px row checkboxes with a reserved column, overriding the original always-visible desktop requirement. Keyboard focus, active bulk selection and touch-capable devices retain checkbox visibility. Founder explicitly accepted the completed work and requested issue closure.

Prior focused assertions, syntax and localization checks are documented above and in the implementation PRs. PR #525 also reports isolated Chromium fixture checks; these were not independently rerun or verified during closeout. Full native repository commands and actual application browser verification of all bulk mutations, editor history and the responsive/locale/theme matrix remain unperformed or unverified. Acceptance is not evidence that those checks ran. Keep the pending QA checkbox unchecked. No runtime tests rerun during administrative closeout.
