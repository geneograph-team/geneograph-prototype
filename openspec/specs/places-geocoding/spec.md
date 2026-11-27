# Places geocoding and search

## Requirements

### Requirement: Silent fallback and normalized results
Interactive/manual browser search SHALL use Geoapify first, then LocationIQ when the
primary is unavailable or returns no usable matches. The provider switch
SHALL be invisible and result shapes normalized.

#### Scenario: Primary unavailable
- **WHEN** Geoapify fails, times out, or has no browser key
- **THEN** LocationIQ is attempted without losing the search string

### Requirement: Cancellation does not leak stale results
Newer queries, dismissal, or component teardown SHALL abort previous
requests and prevent stale results or fallback from appearing.

#### Scenario: Type during lookup
- **WHEN** the user changes the query while a request is in flight
- **THEN** the old result SHALL not overwrite the newer query's state

### Requirement: Provider attribution and credential boundaries
Provider credits SHALL be accessible alongside suggestions and in the
Data providers interface. Restricted public browser credentials SHALL
not be committed to tracked source; hosted credentials MAY be injected
into the deployed artifact. Manual Place entry SHALL work without keys.

#### Scenario: No provider available
- **WHEN** both geocoders are unavailable
- **THEN** users can still create Places and edit coordinates manually

### Requirement: External results represent inhabited settlements
External map suggestions SHALL include only classified inhabited cities,
towns, villages, hamlets and smaller named settlements, excluding streets,
districts, suburbs and administrative units.

#### Scenario: District and city share a translated name
- **WHEN** a provider returns a same-named city and administrative district
- **THEN** the city remains selectable and the district is not suggested

### Requirement: Conservative duplicate suppression
Only results with shared provider identity or matching name, type, full
administrative context and near-identical coordinates SHALL be merged.
Different settlements with matching names SHALL remain available.

#### Scenario: Two distinct villages called Newtown
- **WHEN** villages have the same name but different contexts or coordinates
- **THEN** both appear as distinct suggestions

### Requirement: Preserve fallback and manual entry
For interactive/manual search, an empty set of eligible Geoapify results SHALL permit LocationIQ fallback.
Aborted searches SHALL never continue with a second provider. Existing
project Places and free-text historical place entry SHALL be unaffected.

#### Scenario: Geoapify returns streets only
- **WHEN** Geoapify returns no eligible settlement after filtering
- **THEN** LocationIQ is tried with the requested language and settlement tags

### Requirement: Limit results after filtering
The adapter SHALL return at most the requested number of valid,
non-duplicate results, obtained from a bounded provider response without
unbounded extra requests.

#### Scenario: Excluded records arrive before a city
- **WHEN** a provider places a street before an eligible city
- **THEN** the city may occupy a result slot after the street is discarded

### Requirement: Present consistent structured settlement names

Map suggestions and newly saved map-selected place names SHALL prefer structured settlement, useful county, full region and country names in the requested language where available. Remove redundant components and known postcodes, expand codes only with reliable country-scoped mappings, retain useful fallback context, and preserve coordinates and conservative identity checks. Existing stored and manually entered names SHALL remain unchanged.

### Requirement: Recall-first automatic import matching

Automatic import lookup SHALL choose one configured provider before dispatch: Geoapify if configured, otherwise LocationIQ if configured. It SHALL NOT retry through the other provider on empty, rejected, ambiguous or failed results. Quota responses stop the queue. Reuse throttling, cancellation, attribution and credential boundaries. Manual search retains its fallback. Manual and automatic query preparation and response language SHALL align for recognized settlement inputs, preserving unrestricted manual input. Meaningful bare settlement names and incomplete or reversed hierarchy are eligible without inferring country from script; normalize prefixes and administrative abbreviations for lookup/comparison only.

Select the first plausible provider-ranked name match; if none exists, accept the first provider-only name with strong settlement-level confidence (at least .85, falling back to overall confidence when settlement confidence is absent) and corroborating complete supplied geographic context. Tolerate bounded multilingual aliases, transliteration and spelling variants, missing optional scores and compatible generic city classification when finer type metadata is absent. Low overall address confidence, competing plausible settlements or a full response pool alone SHALL NOT veto placement. Exclude explicitly contradictory country or comparable administrative evidence, invalid coordinates and incompatible settlement types; historical or unsupported hierarchy remains unresolved. Do not infer sovereignty or rewrite recorded jurisdiction.

Only the separate strict identity verification path may authorize unattended reconciliation, not provisional placements. Retain local diagnostic reason, provider and available confidence scores; unresolved places offer localized reasons and eligible explicit retry, while provisional assignments are identified in the inspector. No automatic cross-provider retry, new telemetry or canonical schema change. See [GEDCOM import](../gedcom-import/spec.md) for scheduling, source-coordinate protection and reconciliation.

#### Scenario: Several plausible settlements

- **WHEN** several eligible settlements match an incomplete name or the provider returns a full candidate pool
- **THEN** the first plausible name match in provider order receives coordinates
- **AND** a provisional match does not qualify as verified identity for automatic merging
- **AND** an explicitly contradictory candidate is skipped.
