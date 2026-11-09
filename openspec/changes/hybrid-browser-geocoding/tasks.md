# Tasks

## Implementation

- [x] Add Geoapify-first browser adapter with LocationIQ fallback.
- [x] Normalize both provider responses to the existing map result.
- [x] Preserve AbortSignal semantics and a single UI result list.
- [x] Add per-provider pacing, timeout and cooldown.
- [x] Update shared search function and both search screens.
- [x] Show persistent linked credits below suggestions and in About.
- [x] Remove MapTiler endpoint, browser key, and obsolete configuration.
- [x] Inject public restricted browser keys in deployed Pages artifact,
  not into tracked source files.
- [x] Document provider terms, restrictions, quota caveats and setup.

## Verification

- [x] Write adapter tests for success, fallback, timeouts/errors,
  normalization, cancellation and source-config isolation.
- [x] Run these test assertions with simulated browser APIs in V8.
- [ ] Run native Node script and git diff whitespace checks on checkout.
- [x] Owner confirmed both Actions repository secrets configured (2026-11-09); values cannot be read back from GitHub and hosted requests still need verification after deployment.
- [ ] Verify real Geoapify/LocationIQ calls on allowed deployment
  origins, blocked keys, and both-provider outage fallback.
- [ ] Verify EN/RU, keyboard, mobile, user-visible credits, About.
- [ ] Test historical queries (Lviv, Lwów, Lemberg, Львів, Львов,
  Żółkiew, Zhovkva); manually validate coordinates and ambiguity.
- [ ] Verify file:// with no keys: Place editor / manual coordinates.
- [ ] Revoke previously committed MapTiler browser token after QA.
