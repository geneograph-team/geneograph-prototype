# GeneoGraph browser geocoding — setup and terms

**Issue:** [#158](https://github.com/geneograph-team/geneograph-prototype/issues/158)  
**Architecture:** Geoapify primary → LocationIQ fallback, direct browser requests, no backend.  
**Reviewed:** 2026-11-09

## 1. Configure GitHub Pages keys

In the repository open **Settings → Secrets and variables → Actions → New repository secret** and add:

| Secret name | Value |
| --- | --- |
| `GEOAPIFY_BROWSER_KEY` | Your restricted Geoapify browser API key |
| `LOCATIONIQ_BROWSER_KEY` | Your restricted LocationIQ browser access token |

Do **not** put API keys into an issue, pull request, `src/index.html`,
`src/browser-config.js`, README, workflow YAML or screenshots. Do not
share keys in chat.

The GitHub Pages action copies `src/` to `dist/`, then writes a
**browser-readable** `dist/browser-config.js` using the two Actions
secrets. The tracked `src/browser-config.js` has **empty keys** and
remains safe to commit. The deployed keys are **public by design**:
GitHub Secrets prevent accidental publication in Git *history*, not
inspection by the visitor's browser. Never describe browser keys as
private secrets. The deployment is still a static website and requires
no new backend.

Geocoding will fail gracefully to manual entry until both secrets are
configured and a deploy has completed. The primary and fallback are
independently optional; a missing primary key triggers the secondary.
A direct `file://` checkout can still create places manually. API
testing should use an approved hosted origin; a token restricted to
GitHub Pages cannot usually make requests from localhost or `file://`.

## 2. Restrict browser credentials

Confirm restrictions separately in **both** provider dashboards and
test real network requests:

- `https://geneograph-team.github.io/*`
- `https://*.geneograph.com/` (if the provider accepts this exact
  syntax; alternatively use its documented regex/glob syntax)
- Add `https://geneograph.com/*` separately if the apex domain hosts
  the application.

**Important:** Cross-origin `Referer` commonly contains the **origin
only**, not the full `/geneograph-prototype/` path, due to browser
referrer policy. Do not narrow restrictions to a path until that is
verified in actual browser requests. Also, a restriction on the whole
`geneograph-team.github.io` host necessarily covers paths for other
projects on that same domain.

Geoapify's settings distinguish allowed origins/referrers from CORS.
CORS **is not authentication**. LocationIQ supports HTTP referrer
patterns; both must be checked with their actual matching rules.

Browser keys remain extractable; a custom non-browser client might spoof
referrer/origin headers. Use provider dashboards to monitor misuse and
rotate keys if needed. A future backend proxy would be necessary for
secret tokens or reliable shared per-day quotas.

## 3. Request behavior

- Geoapify `/v1/geocode/autocomplete` with `format=json` is first.
- LocationIQ `/v1/autocomplete` receives the same query if Geoapify
  fails, times out, is rate/quota-limited, has missing credentials or
  yields no valid results.
- An intentional user abort **does not** trigger fallback.
- One common list of normalized candidate names and coordinates is
  presented to Places and Geneograph. No provider switch appears in UI.
- Both linked credits appear below suggestions and under **About →
  Data providers**, whether a search uses one provider or the other.
- Manual place creation remains available through outages, file-open
  and malformed results.
- No raw request/response cache is kept. Each browser throttles
  Geoapify to about 3 requests/second and LocationIQ to under one
  request/second; temporary provider cooldowns reduce repeated failures.

**Daily limits cannot be coordinated across all browsers without a
backend.** Geoapify's free tier currently offers 3,000 credits/day
and up to 5 requests/second, generally one autocomplete query per credit;
Geoapify describes free limits as soft. LocationIQ currently offers
5,000 requests/day and 60/minute. They are separate provider quotas,
**not** a combined guaranteed 8,000 searches/day. Monitor each provider's
usage statistics and preserve manual editing if either quota is reached.

## 4. Storage and attribution

Geoapify permits permanent use of geocoded output provided relevant
open-data source attribution accompanies stored information or is visible
when reused. LocationIQ permits retaining response **data** forever,
but free-tier caching of full request/response pairs is limited to
48 hours. The current prototype keeps place records in browser session
memory, not durable cloud storage; when persistent storage is introduced,
preserve provenance/required attribution appropriately.

Geoapify and LocationIQ receive typed place searches as direct browser
API requests. See providers' privacy terms before processing sensitive
research. The basemap remains OpenFreeMap + OpenStreetMap, independent
of geocoding. No historical place-name provider can guarantee a correct
modern geographic location.

## 5. Checks

From a feature-branch checkout:

```sh
node scripts/check-browser-geocoder.cjs
node --check src/core/geocoder-adapter.js
node --check src/shared/date-and-place-fields.js
git diff --check default...feature/hybrid-browser-geocoder
```

After deploying with **both** Actions secrets, test EN/RU queries
(`Lviv`, `Lwów`, `Lemberg`, `Львів`, `Львов`,
`Żółkiew`, `Zhovkva`). Compare coordinates and duplicate
settlements manually; do not assume modern names resolve historical
ambiguity. Verify Geoapify primary results, simulated blocked Geoapify
fallback, no-results fallback, cancellation, restricted-key denial,
both-provider outage, credits in both place pickers, keyboard, mobile,
About credits and `file://` manual editing.

**Revoke the obsolete MapTiler key** after the new geocoder has passed
hosted QA; its former value was committed in repository history.

## 6. Provider references

- [Geoapify autocomplete API](https://apidocs.geoapify.com/docs/geocoding/address-autocomplete/)
- [Geoapify pricing and attribution](https://www.geoapify.com/pricing/)
- [Geoapify browser key restrictions](https://myprojects.geoapify.com/help/api-keys/)
- [Geoapify storage rules](https://www.geoapify.com/geocoding-api/)
- [LocationIQ autocomplete API](https://docs.locationiq.com/docs/autocomplete)
- [LocationIQ free plan and attribution](https://locationiq.com/pricing)
- [LocationIQ HTTP referrer restrictions](https://help.locationiq.com/support/solutions/articles/36000216422-why-am-i-getting-the-access-restricted-error-)
- [LocationIQ storage policy](https://us1.locationiq.com/tos)
