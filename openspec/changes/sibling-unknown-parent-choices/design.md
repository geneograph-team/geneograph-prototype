## Design

Use the shared People sibling `parentFamilyChoices`, `validateSiblingConnection` and `connectSiblingsThroughFamily` path, already called from Family Tree. Three special choice IDs exist only when neither sibling has parents; their roles determine whether one or two canonical placeholder People are created upon confirmation. Attach both siblings to exactly one new family and record the selected parent-child type for each edge.

Reuse the established father default to avoid a selection regression, but default the relationship detail to Unknown parentage instead of forcing Biological. The selector describes the chosen record count, updates when changed and remains translated in both locales. Conflicts, stale selections, ancestry cycles and pre-existing family choices follow existing validation; no speculative partner link is created in a previously recorded family.
