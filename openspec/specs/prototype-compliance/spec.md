# Prototype legal notices

## Requirements

### Requirement: Accessible prototype licensing and data-use information

The GeneoGraph website SHALL provide the shared user-facing privacy and licensing notices for the website and prototype. Settings → About SHALL link to the appropriate localized website privacy and license sections without duplicating the legal document in the prototype. Original distributed license files and first-party GPL text SHALL remain available with the prototype. Notices SHALL distinguish first-party software from third-party components and assets, retain applicable original license terms and explain browser-local research and external requests. Contextual provider and map credits SHALL remain in the prototype.

#### Scenario: Open notices from the prototype

- **WHEN** a user follows the Privacy policy or Open-source licenses link in Settings → About in either supported language
- **THEN** the corresponding website Legal section opens in a new tab in that language
- **AND** the prototype remains open with its state unchanged.

#### Scenario: Open the prototype directly from local files

- **WHEN** the prototype is opened through a local file URL
- **THEN** its normal local behavior remains available, with original license files included in the distribution
- **AND** the website notice links are external and require network access.
