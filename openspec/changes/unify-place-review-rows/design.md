# Design

`selectedPlaceReviewPairKey` belongs to the Places review view and is separate from `selectedPlaceId`. Pair rows expose `data-place-pair-key` without `data-place-id`, so ordinary Place row handlers cannot select them. The review renderer resolves the key only among visible active or dismissed pairs; a filtered or invalid pair clears the key. Pair selection updates the full row and renders a two-Place inspector without changing the individual Place selection.

Both review item types use `places-review-list-row` for spacing, hover, focus, selected state and trailing actions. Missing-position rows display the singular issue heading and omit absent broader-Place text. The pair row has one heading, identity line and compact context for each Place, with no inner selectable cards. Dismiss and Restore keep the pair key and move focus to the corresponding group row.
