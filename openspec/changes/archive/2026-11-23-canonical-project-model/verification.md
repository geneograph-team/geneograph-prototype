# Closeout verification

23 November 2026. The baseline audit records an earlier snapshot. The closed milestone issues record observed local runs. GitHub CI did not independently verify the project data contract.

| Scope | Observed results |
| --- | --- |
| [M1 #369](https://github.com/geneograph-team/geneograph-prototype/issues/369) | Local contract and localization commands passed. The authored Whiskerfield draft, raw board, metadata-only assets, owning-path errors, and stable regenerated evidence were covered. |
| [M2 #370](https://github.com/geneograph-team/geneograph-prototype/issues/370) | Local syntax, contract and localization checks passed. Chromium on file URLs exercised occupation editing with retained evidence and membership, photo caption editing with a retained date range, and older board import through the File handler. The native chooser was not run. |
| [M3 #371](https://github.com/geneograph-team/geneograph-prototype/issues/371) | Local syntax, contract and localization passed. Chromium on file URLs exercised new and existing partners, parent/child/sibling creation, invalid links and precise unlink. Marriage evidence survived repeated timeline rebuilding. Two-way Sync covered staging, Apply, injected rollback, retry, toolbar Undo, project isolation and Place transfer with stable local IDs and media references. Russian/light and English/dark covered keyboard staging and Escape. English also covered inspector focus return. |
| M4 local checkout | Ran `node scripts/check-project-data-contract.cjs` and `node scripts/check-localization-catalog.cjs`. Both exited 0. Closeout changed documentation only and did not repeat browser QA. |

Local M4 file fingerprints (SHA-256)

- `src/core/validation.js` — `fcab60452853ca915bb3423be506870c25f6d6d6cd78df43557eda5b6fd36d7c`
- `scripts/check-project-data-contract.cjs` — `9dfc4646189202d356ce5befca7d0a3ff853a3a9d2f130c09bb42a46ca5ddd84`
- `scripts/check-localization-catalog.cjs` — `695d74e06ff8123f9f451f15e7171f9a4c795b335028e7ad7f3be4b8d03dcd65`

Other browser engines, the broad responsive matrix, and the separate person-first-board-sync desktop and phone layout task remain unrun. GEDCOM and project backup/restore are future work in #331 and #332.
