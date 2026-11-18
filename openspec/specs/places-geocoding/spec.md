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
