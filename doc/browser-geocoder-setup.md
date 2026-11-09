# GeneoGraph browser geocoding — setup and terms

**Issue:** [#158](https://github.com/geneograph-team/geneograph-prototype/issues/158)
**Architecture:** Geoapify primary → LocationIQ fallback, direct browser requests, no backend.
**Reviewed:** 2026-11-09
**Credential status:** The owner reported both Actions repository secrets configured on 2026-11-09. GitHub does not disclose secret values to this review; actual deployment and authorized requests still need validation.

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

### When will the configured secrets be used?

**Only after PR #161 is merged into `default`.** The deploy workflow is
triggered by pushes to `default` affecting `src/` or the workflow,
**not** by a feature-branch PR. Opening PR #161 or running a local
`src/index.html` checkout will **not** automatically inject secrets.

A successful deployment performs these steps:

1. Check out `default` and copy `src/*` into `dist/`.
2. Read the two **repository Actions secrets** in the build job.
3. Overwrite **only the generated copy** `dist/browser-config.js`
   with `window.GENEOGRAPH_CONFIG = { geoapifyKey, locationiqKey }`.
4. Upload and publish `dist/` via GitHub Pages. The tracked
   `src/browser-config.js` remains empty and unchanged.

When checking the deployed website, verify in its browser console
**without printing the tokens**:

```js
Boolean(window.GENEOGRAPH_CONFIG?.geoapifyKey)
Boolean(window.GENEOGRAPH_CONFIG?.locationiqKey)
```

Both should return `true` after a successful deploy. The developer
tools **Network** panel should show requests to
`api.geoapify.com` for normal searches, and to `api.locationiq.com`
only after primary failure/zero matches. Request URLs contain API
keys as query parameters: **redact them before sharing screenshots,
logs or network exports**. Verify the complete request and response
privately, never publish bearer values.

See [the design guide](design-document.md#places-maps-and-browser-geocoding-issue-158)
for the architecture and record-lifetime boundaries.

## 2. Restrict browser credentials

Confirm restrictions separately in **both** provider dashboards and
test actual requests from the deployed host. **Geoapify Allowed HTTP
referrers accept regular expressions, not shell-style wildcards.** Two
candidate whole-URL patterns (verify against the observed `Referer`
header and Geoapify's matching behavior) are:

```text
^https://geneograph-team\.github\.io(/.*)?$
^https://([A-Za-z0-9-]+\.)*geneograph\.com(/.*)?$
```

The second pattern permits the apex domain as well as subdomains; if
only a single subdomain is used, restrict it specifically instead.
Do not use `https://geneograph-team.github.io/*` as a regex: the
unescaped periods and trailing `/*` do **not** mean "any path".

For **Geoapify Allowed origins**, use actual origin values such as
`https://geneograph-team.github.io` (no trailing slash or path).
Add individual production domains only if supported by the dashboard;
do not assume the `*.geneograph.com` syntax works in that field.
Avoid Allowed IP address restrictions for browser requests, and don't
mistake `CORS Access-Control-Allow-Origin` for an authorization control.

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

### Fallback semantics

| Primary Geoapify result | LocationIQ behavior | User-visible result |
| --- | --- | --- |
| Valid matches | Not called | Normal place suggestions |
| HTTP error (including 401, 403, 429, 5xx), timeout, network or invalid payload | Attempt fallback | Suggestions if fallback succeeds |
| Zero valid matches | Attempt fallback | Suggestions if fallback succeeds; otherwise no matches |
| Both services fail | Attempted and failed | Generic search unavailable; manual entry still works |
| Caller deliberately cancels / types another query | **Not called** | Superseded search produces no stale suggestions |

A failed primary receives a short cooldown (five minutes for
401/403/429, 30 seconds for 5xx, 15 seconds for fetch errors/timeouts).
Each provider request uses a 6.5-second timeout, so an initial
provider timeout can delay the fallback. A successful **empty** primary
followed by failed fallback is treated as *no results*, not proof of
service-wide failure.

The adapter does not expose a provider selector or fallback status in
either UI. Displayed place name and coordinates are suggestions, not
verified historical findings.

**Search cancellation:** When a person types again, changes fields or
closes the editor, the previous request is intentionally aborted.
The shared UI search wrapper resolves these superseded requests to
an ignored empty result instead of propagating an `AbortError` to
timer-launched autocomplete callbacks. The Places editor also observes
any unexpected timer promise rejection. Aborted requests must never
replace newer suggestions, emit an unhandled rejection, or trigger
a LocationIQ fallback. Provider errors from still-active searches
continue to show normal retry/unavailable states. Ambiguous village names must be reviewed
against historical sources before assignment.

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

## 6. Troubleshooting and release gate

| Symptom | Check / action |
| --- | --- |
| Search works before merge only when manually configured | Expected: repository Actions secrets reach **the published Pages artifact only** on a push to `default`. |
| Both searches unavailable after deployment | Confirm Pages action succeeded and check the two **Boolean** values above; verify Actions secret **names**, not values. |
| HTTP 401/403 from Geoapify | The primary provider denied access; LocationIQ should silently handle the query if authorized. Inspect the failing request's **Request Headers → Referer and Origin** and the page URL in DevTools. Compare with the *Geoapify-specific* allowed-referrer/origin regular expressions, key validity and project. Hosted `https://geneograph-team.github.io/` and local `http://localhost:8000/` are different origins. Do not use a production key without restrictions or confuse response CORS configuration with API-key authorization. |
| HTTP 429 or quota exceeded | Monitor both accounts; client pacing cannot enforce a shared daily quota. Wait for provider resets or reduce usage; manual entry stays available. |
| Geoapify has no result | The fallback runs automatically; verify LocationIQ separately in Network if needed. |
| Local `file://` or localhost cannot search | Keys are absent locally or blocked by restricted origins. Use direct GitHub Pages for API testing. Manual names and coordinates remain available. |
| Unexpected place coordinates | Check source settlement identity and its modern/historical names. Do not blindly accept autocomplete suggestions. |
| After deploy old MapTiler requests remain | Hard-reload the website (or use a private window), confirm the new script/Pages artifact, and inspect current request hosts. |

**Before closing #158 or revoking MapTiler access:** run
`node scripts/check-browser-geocoder.cjs`, verify real hosted
Geoapify → LocationIQ fallback and attribution in both pickers, test
English/Russian and small screens, and ensure the application can
still create places without either provider. The obsolete MapTiler
browser token existed in Git history; revoke/rotate it independently
after the replacement is validated. Never display provider keys in
issues, screenshots or CI logs.

## 7. Provider references

- [Geoapify autocomplete API](https://apidocs.geoapify.com/docs/geocoding/address-autocomplete/)
- [Geoapify pricing and attribution](https://www.geoapify.com/pricing/)
- [Geoapify browser key restrictions](https://myprojects.geoapify.com/help/api-keys/)
- [Geoapify storage rules](https://www.geoapify.com/geocoding-api/)
- [LocationIQ autocomplete API](https://docs.locationiq.com/docs/autocomplete)
- [LocationIQ free plan and attribution](https://locationiq.com/pricing)
- [LocationIQ HTTP referrer restrictions](https://help.locationiq.com/support/solutions/articles/36000216422-why-am-i-getting-the-access-restricted-error-)
- [LocationIQ storage policy](https://us1.locationiq.com/tos)
