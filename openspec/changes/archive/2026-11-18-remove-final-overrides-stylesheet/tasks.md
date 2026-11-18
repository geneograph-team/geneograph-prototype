# Tasks

## 1. Notes and existing Places pass

- [x] 1.1 Move Notes page, picker, and modal rules from `final-overrides.css` into their owning rules in `notes-places.css`; verify Notes at desktop and phone widths in English/Russian, including modal focus, and run `git diff --check`.
- [x] 1.2 Verify the previously moved Places rules and the remaining mixed Places selectors at wide, intermediate, and phone widths in English/Russian; confirm list, map, review, inspector, and modal states match the baseline before marking this task done.

## 2. Albums

- [x] 2.1 Merge Albums gallery, detail, photo picker, and modal rules into `albums.css`, removing their source rules; verify these views and keyboard focus at desktop and phone widths in English/Russian and run `git diff --check`.

## 3. Archive

- [x] 3.1 Merge Archive file, folder, selection, and inspector rules into `archive.css`; remove source rules, verify grid/list and inspector states at desktop widths in English/Russian, and run `git diff --check`.

## 4. People

- [x] 4.1 Merge People directory and inspector rules into `family-people.css` or `people-shared.css` according to existing ownership; remove source rules, verify search, selection, and mobile states in English/Russian, and run `git diff --check`.

## 5. Family Tree

- [x] 5.1 Merge Family Tree canvas, toolbar, inspector, and modal rules into `family-people.css`; remove source rules, verify expanded/collapsed inspector and responsive canvas controls in both languages, and run `git diff --check`.

## 6. Projects

- [x] 6.1 Merge Projects hero, cards, and project-specific create-tile rules into their existing owner stylesheet; leave cross-module library controls for the shared pass, verify grid/list layouts at desktop and phone widths in both languages, and run `git diff --check`.

## 7. Geneograph

- [x] 7.1 Merge Geneograph board and inspector rules into `geneograph.css`; remove source rules, verify editor, selection, and responsive inspector states at wide, intermediate, and phone widths in English/Russian, and run `git diff --check`.

## 8. Publish audit

- [x] 8.1 Move any Publish-owned rules found in `final-overrides.css` into `publish.css`, or record that none exist; verify the resulting selectors and run `git diff --check` if files change.
  - Audit: no Publish or Publication selectors remain in `final-overrides.css`; no CSS move was needed.

## 9. Shared controls

- [x] 9.1 Merge shared form and resource-picker rules into `foundation.css` or `resource-picker.css`; remove source rules, verify controls and focus across affected modules in English/Russian, and run `git diff --check`.
- [x] 9.2 Merge shared mobile modal shell, navigation, and cross-module library rules into their shared owner; resolve the three mixed Places selector lists, remove source rules, verify affected modules at desktop and phone widths in both languages, and run `git diff --check`.

## 10. Final removal and integration

- [x] 10.1 Confirm `final-overrides.css` has no active rules, remove it and its `src/index.html` link, and update `AGENTS.md`, `README.md`, and `Prototype_Design_Document.md`; verify all stylesheet references resolve with direct `file://` opening and run `git diff --check`.
- [x] 10.2 Review every active module plus shared modals at desktop, intermediate, and phone widths in English/Russian; inspect the console and confirm focus and responsive states before marking the migration complete.
  - Visual QA was accepted by the user in this chat. Independent browser and console inspection was unavailable under the browser security policy; static integration checks confirmed all local CSS links resolve, every linked stylesheet has balanced braces, and git diff --check passes.

## Workflow follow-up

- Archive the OpenSpec change only after implementation and verification are complete.