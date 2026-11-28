# Build identity delta

## ADDED Requirements

### Requirement: Shared artifact build identity

The prototype SHALL display one Version row in About containing the normalized Git version and short build revision as a single string (e.g. 1.6.1-96219dd), or an honest development fallback. An accessible icon-only copy action in that row SHALL copy exactly the displayed string; unavailable clipboard access SHALL offer manual copy. Diagnostics SHALL retain structured metadata including the full revision and channel; About SHALL NOT display separate Build or Channel rows. External About destinations SHALL use text links, the product tour SHALL remain an in-app button, and Help center SHALL show Coming soon without an inactive action. Local source without metadata SHALL identify itself as a local development build without asserting a Git revision. Static hosting and direct file opening SHALL not require Git or network access. Pages SHALL generate metadata from the actual checked-out commit without modifying tracked source or publishing triggers.
