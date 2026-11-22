## Design

Use the existing `src/core/geocoder-adapter.js` as the sole classification
boundary; don't add per-module filters or change the normalized UI contract.

Geoapify's `type=city` includes cities, towns and villages. Require
`result_type=city` or, if the result type is unknown/missing, an explicitly
allowed OSM `datasource.raw.place` category. Reject contradictory raw types.
Geoapify's API does not guarantee every hamlet will be returned.

LocationIQ's `tag` supports a comma-separated allowlist of OSM
`class=place` types: city, town, village, hamlet, isolated_dwelling, farm.
Do not combine with the less specific `layers=city`, which could inadvertently
exclude small settlements. Require the returned `class` and `type` too.
Neither API filter is trusted without response validation.

One request per provider fetches at most 20 candidates (typically 15) so
type filtering and deduplication happen before the existing five-result cap.
Use Geoapify place IDs and OSM class/ID where available; otherwise deduplicate
only exact normalized name/context/type with near-identical coordinates.
Do not merge same-named distinct settlements or use transliteration heuristics.

Return unchanged `id`, `kind`, `name`, `primary`, `context`,
`coordinates` objects. Geoapify with zero eligible candidates invokes the
existing LocationIQ fallback; aborts, cooldowns, timeouts and credits stay
unchanged. Manually entered historical places and existing project Places
are not filtered. Browser API keys remain untouched.

Browser QA on a key-authorized hosted origin is still required, including
small hamlets and EN/RU historical/localized name variations.
