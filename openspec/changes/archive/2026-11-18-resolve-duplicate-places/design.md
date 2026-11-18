# Design

The detector lives in `modules/places/filters.js`, where project Place queries and review findings already live. It compares unique unordered pairs and requires name/alias evidence; distance only strengthens a name match. The editor calls the same matcher against its unsaved draft.

Keep separate stores the sorted pair IDs and a fingerprint of each Place's normalized names, coordinates, and radius in `placeIssues`. An unchanged fingerprint keeps the pair dismissed. Meaningful edits reopen a still-matching pair; unrelated metadata and links do not.

The merge dialog asks for the surviving Place, displays linked record counts, offers aliases from the removed Place, and requires choices for different locations and other populated conflicting fields. The merge model revalidates both records, retargets structured references and deduplicates arrays/evidence links, then removes the redundant Place. Derived events and route views rebuild from updated references. The survivor keeps its ID and creation metadata.
