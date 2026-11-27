# Design

The single-person picker and the photo person filter page through their full ranked result sets. The Notes People linker retains its ten suggestions and computes photo counts once per project revision. Birth-place suggestions count distinct associated people in one pass per project revision and keep the existing ranking and eight-result limit.

The Geneograph manual picker reuses canonical project indexes and skips automatic-match eligibility work. Diagnostics tracks opening, query, markup and the post-selection continuation separately. The board review continuation belongs to #473.
