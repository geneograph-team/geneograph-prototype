# Build identity delta

## ADDED Requirements

### Requirement: Shared artifact build identity

The prototype SHALL display the normalized embedded Git version, short build revision and channel in About, and export the same metadata including the full revision through Diagnostics. Copy version information SHALL include the full revision when available; unavailable clipboard access SHALL offer manual copy. Local source without metadata SHALL identify itself as a local development build without asserting a Git revision. Static hosting and direct file opening SHALL not require Git or network access. Pages SHALL generate metadata from the actual checked-out commit without modifying tracked source or publishing triggers.
