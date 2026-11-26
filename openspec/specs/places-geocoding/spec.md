# Places geocoding and search

## Requirements

### Requirement: Silent fallback and normalized results
Browser search SHALL use Geoapify first, then LocationIQ when the
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
An empty set of eligible Geoapify results SHALL permit LocationIQ fallback.
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
