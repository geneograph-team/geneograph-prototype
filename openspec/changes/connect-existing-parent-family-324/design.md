## Design

The existing `parentFamilyChoices` and `renderParentFamilySelector` accept Parent as a reciprocal form of Child: the anchor is the child and the selected result is the candidate parent. Candidate selection, search and relationship changes reset the selector to the correct person's valid options; when multiple partner families exist no default is chosen. Even with one partner family the user explicitly selects a family or parent alone. With no partner family, parent alone is safe by default.

The same `connectChildToParentFamily` mutation and `validateRelationshipConnection` check both directions. Selected partner families validate the other parent for existing links, ancestor cycles and biological conflicts before changing a record, and write the chosen parent-child type to both links when newly formed. The legacy Add Person creation of a brand-new parent remains on its existing parent creation path when no family selection exists; no unrelated new-person workflow is changed. Selecting a partner family defaults to Unknown parentage unless the researcher explicitly selects a type.

In the Connect modal, make the right-hand results heading the search field's visible label at the same vertical position as the left relationship label, and keep the results in the existing scrollable panel. Retain responsive stacking and semantic labels.
