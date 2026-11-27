# Design

The localization runtime indexes the first three UTF-16 code units of each embedded catalog key on first use. Literal candidates are applied in the original order using the existing boundary-aware regexes. A replacement can introduce a later candidate, so candidates are recalculated after a changed result. Earlier rules are never applied again. The index is bounded by the catalog, and the existing text-cache limit and People projection lifecycle still apply.

This applies to every existing localization consumer, including People, Tree and shared pickers. The data and UI paths retain their existing translations, query semantics and canonical values.
