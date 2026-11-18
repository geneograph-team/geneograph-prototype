# OpenSpec workflow

OpenSpec is the project's compact record of **current behavior** plus
**focused work in progress**, not a second issue tracker.

- `specs/<capability>/spec.md`: the canonical, up-to-date behavior that
  currently exists in the prototype (verify against code).
- `changes/<change-name>/`: only work still being planned or implemented.
  Keep proposal, design, checklist and delta specs proportional to the task.
- `changes/archive/YYYY-MM-DD-<change-name>/`: completed historical
  proposals, task records and delta specs, retained for traceability.
  Historical changes may describe superseded implementations; they are
  **not** authoritative current requirements.

## Automatic closeout for future changes

Whenever an agent completes an approved substantive change, **perform this
closeout in the same work item/PR without requiring another user request**:

1. Confirm acceptance criteria and record checks actually performed.
   Distinguish executable checks from unperformed manual browser QA.
2. Update `specs/` with the verified final behavior. Integrate deltas,
   reconcile superseded rules and remove duplicative active requirements.
3. Complete the task checklist only for work done or explicitly accepted;
   document any waived checks honestly in the PR/review notes.
4. Archive the change using OpenSpec's archive operation if installed;
   otherwise move its files intact to a dated `changes/archive/` folder.
   Delete the original active paths. Ensure the archived change is not
   still returned as an active change.
5. Include the archived folder and updated baseline specs in the
   implementation PR. No changes to GitHub Actions, deployment pipelines
   or automatic merges are permitted without separate founder approval.

For tiny fixes, prefer no OpenSpec change folder at all. Never regenerate
a full historical change record merely to record a small typo.

## Historical backlog cleanup — 2026-11-18

At the founder's direction, all previously open checklists were treated
as administratively complete and dated archived. Checkboxes closed during
this maintenance pass **do not imply** unperformed native tests or browser
checks were executed. Earlier overlapping/superseded map, palette and
merge designs remain in the dated archive only; `specs/` reflects the
currently implemented approach. Reopen a new issue/change if fresh QA
identifies an actual defect.
