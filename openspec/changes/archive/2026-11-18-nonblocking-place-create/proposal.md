# Nonblocking Place duplicate warnings

## Why

A suspected duplicate currently blocks valid Place creation while hiding the
override in an ellipsis menu. Genealogists must be free to record distinct
Places without responding to an informational match.

## What changes

- Never block a valid Place save on a duplicate warning.
- Offer visible, optional **Use existing place** and **Ignore** actions.
- Respect explicit geographic context in shared Place duplicate matching.
- Preserve normal Enter-to-submit when no autocomplete option is active.

## Boundaries

Normal name and coordinate validation still applies. Saved Place pair review,
merging and reference maintenance remain intact. No map-provider, persistence,
deployment or CI changes.
