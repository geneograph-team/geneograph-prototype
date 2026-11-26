## ADDED Requirements

### Requirement: Accessible prototype licensing and data-use information

The prototype SHALL expose local first-party license text, public source access, known third-party notices and technical data-use information from Settings → About in English and Russian. Notices SHALL distinguish first-party software from third-party components and assets and retain original license terms. Prototype-specific information SHALL distinguish browser-local research from external requests, including hosted resources, map tiles, geocoding and optional linked GEDCOM photo download. The existing full privacy policy link SHALL remain available.

#### Scenario: Open notices offline or on the hosted prototype

- **WHEN** a user opens Settings → About and follows the license or data-use link
- **THEN** the local notice document opens at the appropriate language section without requiring an external service
- **AND** local license files remain accessible, while public source and provider links are explicitly external resources.
