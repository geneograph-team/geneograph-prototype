# Add Person possible matches

## Requirements

### Requirement: Conservative identity candidate discovery
The Add Person Possible matches panel SHALL require at least one meaningful
canonical name field before querying candidates. Date, place and relationship
fields SHALL only corroborate or contradict name-based candidates.

#### Scenario: No useful name
- **WHEN** a draft has only a name part or only date/place details
- **THEN** the panel SHALL NOT present a possible duplicate

#### Scenario: Two meaningful names
- **WHEN** two independent recorded name parts match a canonical person,
  allowing bounded name variation and recorded aliases
- **THEN** that person MAY be shown without a matching date or place

#### Scenario: One name with two distinct corroborators
- **WHEN** one name matches, birth day/month agrees, and birthplace agrees
- **THEN** that person MAY be shown despite an unknown birth year

### Requirement: Missing fields are not contradictory
The matcher SHALL read canonical names, structured genealogy dates and saved
Places. An unknown surname, maiden name, date or Place SHALL NOT count as a
conflict. Distinct recorded birth years within five years SHALL be tolerated
as weaker evidence when enough name evidence exists.

#### Scenario: Luna Mabel with different recorded surname completeness
- **WHEN** Luna Mabel Purrington (maiden; surname missing), born in 1999,
  is compared with Luna Mabel Whiskerfield (maiden missing), born in 1998
- **THEN** the existing person SHALL remain an eligible moderate match

### Requirement: Project-scoped and advisory suggestions
Candidate retrieval SHALL be project-scoped, exclude deleted records and
the current edit/connection anchor, and SHALL NOT mutate data. The existing
Open selected and Connect selected flows and relationship validation SHALL
remain authoritative. Search indices SHALL be transient, not project data.

#### Scenario: Connect an existing person
- **WHEN** the user accepts a possible match as a relative
- **THEN** the current relationship validation SHALL run against the
  canonical record without cloning or merging the person

### Requirement: Responsive suggestions
The UI SHALL debounce matching input, preserve form focus and scroll, avoid
unneeded card replacement, and keep selection while the candidate remains
eligible. Candidate retrieval SHALL be separate from matching evaluation so
it can be replaced by SQL-backed retrieval later.
