# Design — provider-neutral browser autocomplete

## Search contract

searchSharedPlaceMapResults(query, signal) delegates to
geneographGeocoder.search(query, signal, 5). Results preserve the
existing {id, kind, name, primary, context, coordinates:{lat,lng}}
contract. The adapter owns provider URLs, encoding, normalization,
response validation, timeouts, throttling and automatic fallback.

Geoapify /v1/geocode/autocomplete (format=json, JSON results) goes
first. If it returns no valid matches or cannot fulfill the search,
LocationIQ /v1/autocomplete is tried with the original query. A user's
AbortSignal cancels both operations and blocks fallback.

UI search states remain loading, ready, empty or unavailable. Neither
screen announces provider identity or failure. Existing manual typing
and project-only place selection remain unchanged.

## API keys and deployment

The tracked src/browser-config.js contains no credentials. GitHub
Actions reads GEOAPIFY_BROWSER_KEY and LOCATIONIQ_BROWSER_KEY repository
secrets and writes dist/browser-config.js before Pages artifact upload.
The deployed tokens remain visible to visitors in the browser, by
design. HTTP referrer/origin restrictions and monitoring reduce risk
but do not make them private; CORS does not authenticate callers.

## Controls and reliability

The adapter applies per-browser pacing (Geoapify approximately 3.3
requests/s; LocationIQ below 60/min), 6.5-second individual request
timeouts, and short cooldowns for rejected or failed services. There
is no global per-day usage counter; account quota and provider usage
dashboards must be monitored. No raw response caching is introduced.

## Attribution and persistence

Both linked provider credits appear near place suggestions even when
only one provider responds, and in About alongside OpenFreeMap and
OpenStreetMap credits. Geoapify permits retaining results with
appropriate source attribution, and LocationIQ permits indefinite
storage of response data while limiting free-tier full response-pair
caching to 48h. A future durable record store must preserve sufficient
open-data provenance/attribution.

## Compatibility and rollback

The app is still plain static HTML/CSS/classic scripts. file://
startup and manual place entry require no credentials or network.
Geocoding is best-effort; no place record is auto-created by typing.
Rollback the feature PR without touching stored place IDs.
