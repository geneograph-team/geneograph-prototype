## ADDED Requirements

### Requirement: Preserve readable imported research text

After assembling GEDCOM continuations, recognize HTML-formatted supported research text without interpreting ordinary literal text as markup. Store readable plain text in evidence fields, retaining safe link destinations when different from their labels, and existing canonical Quill Delta in Notes when supported formatting is present. Preserve paragraphs, line breaks, bold, italic, underline, strike, lists and safe links; retain plain-text search content, readable note titles, shared note identity and all existing associations. Imported markup SHALL NOT be executed or load external resources. Routine presentation normalization and conversion of formatted evidence to readable plain text SHALL NOT produce warnings. Unsupported or incomplete formatting SHALL be reported separately from genuinely unsafe or active content omitted. Retain GEDCOM tag and line examples. Citation excerpts use the plain evidence representation required by the citation-to-Source mapping. Source evidence SHALL recognize bounded layers of escaped HTML formatting (including encoded line breaks and links) after continuation assembly, preserve literal unknown placeholders and unrecognized plain text, and pass restored markup through the existing safe text converter.

#### Scenario: MyHeritage styled note

- **WHEN** a formatted note includes paragraph and inline Word formatting, escaped characters and continued lines
- **THEN** the note contains readable plain text and supported validated Delta operations, not markup or executable content
- **AND** the existing shared links and project validation are preserved
