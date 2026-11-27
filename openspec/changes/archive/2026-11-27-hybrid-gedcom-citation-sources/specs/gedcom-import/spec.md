## MODIFIED Requirements

### Requirement: Preserve supported genealogy and evidence from MyHeritage exports

Identify MyHeritage by the GEDCOM header source. When its married surname differs from its recorded surname, import the married surname as the last name and the recorded surname as the maiden name, while respecting an explicitly recorded maiden name. Other exporters retain the standard surname mapping.

Preserve supported event and education details. Use shared Source records for undetailed citations and standalone sources; create citation-specific Sources for detailed evidence, inheriting original source metadata, retaining readable locators, dates, roles, excerpts and literal citation quality in Source Notes, and assigning a URL only when a safe HTTP(S) destination is unambiguous. Reuse identical evidence only within the original source; preserve all supported person/event links and explicit research Notes. Do not generate citation Notes or infer genealogy facts. Omit redundant unused base records when citation-specific Sources retain the original metadata. Preserve unresolved family citations as Sources with a report warning instead of assigning them to unrelated people. Omit residence/contact details, recorded ages and export bookkeeping from the report. Report online-only MyHeritage photos once per distinct file URL.

#### Scenario: Different matches from one family website

- **WHEN** a person cites two distinct records from the same website and another person cites the identical first record
- **THEN** two Sources preserve the distinct evidence and the first is linked to both people
- **AND** no generated citation Note is created
