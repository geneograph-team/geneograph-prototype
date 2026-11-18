# Design

The canonical Place set is the array of records currently present in `sampleData.places`. `getPlace` returns `null` after physical removal. All Place selectors therefore filter by project and record existence, with no soft-delete branch. The delete handler continues to remove source links, structured references, dismissals, and board links before re-rendering. Selection falls back to the first remaining project Place.

Baseline: the ten active seeded Places have a stable full-record hash after removing only their `deleted: false` fields. The hidden `place-deleted` record has no other direct ID references in the sample graph.
