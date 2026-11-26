## Why

External place autocomplete currently lists districts, streets and indirect
administrative areas beside populated settlements. This can confuse places
used for genealogical facts and make near-duplicate suggestions look equivalent.

## What Changes

- Limit Geoapify and LocationIQ queries to their supported settlement types.
- Independently validate provider classifications and remove strong duplicates
  before limiting the five displayed results.
- Keep existing local project Places and free-text/historical manual entry.
- Preserve provider failover, cancellation, localization and credits.

## Capability

- `settlement-autocomplete`: Only named inhabited settlements appear among
  external map suggestions.

Tracked by #349; saved-place duplicate review #316 is separate.

## Closeout — 26 November 2026

Founder accepted the implemented change (#349, merged PR #354) as complete on 26 November 2026. The recorded isolated provider checks passed; live hosted/provider and direct-file checks are not claimed executed by this archival.
