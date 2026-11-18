# Proposal — browser-only hybrid geocoding (#158)

## Problem

GeneoGraph still sends place autocomplete requests to MapTiler and has
a MapTiler key committed in the static HTML. OpenFreeMap does not provide
geocoding. The owner has selected two browser providers and explicitly
rejected a serverless proxy for this prototype.

## What changes

- Use Geoapify autocomplete first with silent LocationIQ fallback on
  failure, timeout, quota/rate limit, invalid response or zero matches.
- Preserve normalized map-result shapes and both search consumers:
  Places Add/Edit and Geneograph place picker.
- Keep AbortSignal cancellation across provider transitions; never
  run fallback when the user intentionally cancels.
- Show both linked provider credits beneath search suggestions and in
  About → Data providers, without exposing provider selection.
- Remove the MapTiler endpoint and key from active application code.
- Publish restricted browser API keys through GitHub Actions repository
  secrets into dist/browser-config.js. The tracked source remains empty.
- Preserve file-open/manual place editing and add a focused test.

## Explicit non-goals

A backend or Cloudflare Worker, hiding API tokens from a browser visitor,
global free-plan quota enforcement, a historical gazetteer, automatic
geocoding of existing places, schema changes, or offline autocomplete.

## References

See doc/browser-geocoder-setup.md for current provider terms, limits,
deployment steps and QA gates. The owner accepted public browser keys
restricted to GeneoGraph deployment domains.
