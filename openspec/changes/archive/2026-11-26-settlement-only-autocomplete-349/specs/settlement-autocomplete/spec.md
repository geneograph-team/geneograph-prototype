# Settlement-only external autocomplete

## Requirements

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
