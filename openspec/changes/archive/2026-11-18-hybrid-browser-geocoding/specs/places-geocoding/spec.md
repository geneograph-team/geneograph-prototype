# Spec delta — browser-only hybrid geocoding

## ADDED Requirements

### Requirement: Invisible hybrid provider fallback

Place search SHALL call Geoapify first, then automatically call
LocationIQ when primary search fails or yields no valid results.
Provider selection SHALL NOT appear in the user interface.

#### Scenario: Primary service unavailable
- **WHEN** Geoapify times out, returns an error or lacks a browser key
- **THEN** LocationIQ is attempted with the original search string
- **AND** users see one normalized result list

#### Scenario: Primary has no matching places
- **WHEN** Geoapify returns zero valid matches
- **THEN** LocationIQ is searched before a no-results message appears

#### Scenario: User cancels search
- **WHEN** the place input changes and its request is aborted
- **THEN** neither stale results nor a fallback request appear

### Requirement: Geocoder attribution

The app SHALL present the required linked credits for both providers
adjacent to place-search suggestions and under About → Data providers.

#### Scenario: Either provider responds
- **WHEN** the user opens place search suggestions
- **THEN** both provider attributions remain visible without a
  user-facing provider-switch control

### Requirement: Browser credentials are deploy-scoped

Provider credentials SHALL NOT be committed into tracked source. The
hosted artifact MAY contain restricted public browser tokens inserted
by the deploy pipeline, and direct-file mode SHALL retain manual
place creation with no credentials.

#### Scenario: Both providers unavailable
- **WHEN** neither service can provide results
- **THEN** Place creation, manual coordinates and existing project
  place selection remain operable
