## ADDED Requirements

### Requirement: Preserve readable imported research text

After assembling GEDCOM continuations, recognize HTML-formatted supported research text without interpreting ordinary literal text as markup. Store readable plain text in evidence fields and existing canonical Quill Delta in Notes when supported formatting is present. Preserve paragraphs, line breaks, bold, italic, underline, strike, lists and safe links; retain plain-text search content, readable note titles, shared note identity and all existing associations. Imported markup SHALL NOT be executed or load external resources. Unsupported or unsafe content and malformed formatting SHALL be disclosed in the import report. Citation ownership SHALL remain unchanged.

#### Scenario: MyHeritage styled note

- **WHEN** a formatted note includes paragraph and inline Word formatting, escaped characters and continued lines
- **THEN** the note contains readable plain text and supported validated Delta operations, not markup or executable content
- **AND** the existing shared links and project validation are preserved
