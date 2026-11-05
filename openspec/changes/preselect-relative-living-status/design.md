# Design

## Context

See proposal.md for the motivation and specs/relative-status-defaults/spec.md for observable behavior. The shared `openAddPersonModal` in `src/modules/people/person-editor.js` and the separate Geneograph `renderGeneographPersonModal` in `src/modules/geneograph/geneograph-pickers.js` both currently default new people to Living. Relationship intent is already normalized by `addPersonCreateConnectionIntent` in `src/modules/people/relationship-editor.js`, and the linked person's birth uses the shared genealogy date model. The status control and save paths already support all three status values. `Prototype_Design_Document.md` is referenced by config but is absent in this checkout; source behavior is authoritative for this plan.

## Goals / Non-Goals

**Goals:** Keep one reusable initial-status calculation at new-relative form initialization and reuse the date model's bounds in both flows.

**Non-Goals:** Infer a death date or age at death, modify existing people or saved data, change the general Add person default, add a persistent inferred-status marker, or introduce a runtime dependency.

## Decisions

### Calculate from the linked person's bounded birth date

Use the existing genealogy date normalization/bounds helper to find the latest possible birth date. Convert that date to its calendar year and compare it with `new Date().getFullYear() - threshold`, including the cutoff year. A non-finite upper bound, unparsed date, and About/Circa date do not trigger the suggestion. This respects partial and bounded dates without parsing display text or using a fixed year. Using only the first year of a range was rejected because it could overstate age.

### Determine threshold from normalized relationship intent

Calculate once as each modal opens, after `addPersonCreateConnectionIntent` resolves the Family Tree/People anchor and type or the Geneograph relative option resolves its anchor node and category. Look up the Geneograph anchor’s board-local person through its node and person ID; do not require a Family Tree link. Parent, sibling, and partner use 125 years; child uses 140. `options.livingStatus` and edit-mode saved values take precedence over the inferred default in the shared form; Geneograph editing also preserves its saved status. Apply no inference when there is no new-relative connection. Recomputing while the form is open was rejected because it could overwrite a manual choice.

### Keep the suggested default reversible

Use the existing status button, menu, and conditional death fields in each modal. Leave death fields blank. No new data field is needed: the value the user saves remains the ordinary living status. The user can change the preselected value before saving.

## Risks / Trade-offs

- [A historical birth year does not prove another person's death] -> Treat this only as an editable form default, never as evidence.
- [Child and partner ages vary widely] -> Use the user-chosen conservative thresholds and make no inference without a bounded linked birth date.
- [Year-only comparison ignores month and day] -> This matches the requested age-in-years prototype rule and avoids date-specific timezone behavior.
- [Two modal implementations can diverge] -> Call one date/threshold helper from both entry points and verify People, Family Tree, and Geneograph, including board-local people.
