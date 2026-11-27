# Tasks

- [x] Implement detached lookup preparation, strong-match evaluation, bounded provider fallback, and final import validation; #499 moves online enrichment after commit.
- [x] Add synthetic matching, budget and provider request fixtures for structured evidence, ambiguous primary results, fallback, quota, abort, missing credentials and manual-search compatibility.
- [x] Remove the pre-import matching settings block and checkbox; retain concise footer disclosure, cancellation and final report; #499 replaces blocking progress with nonblocking status/stop.
- [ ] Run native GEDCOM/geocoder/localization suites and hosted/direct-file EN/RU browser QA, including close/cancel, retry, provider errors, attribution and actual private sample with informed consent. Verify account-specific provider limits/terms before deployment.
- [ ] Reconcile baseline specs and archive after material acceptance.

Published Geoapify and LocationIQ documentation describes controlled bulk requests (https://www.geoapify.com/tutorial/batch-geocoding-js-and-rate-limits/ and https://help.locationiq.com/support/solutions/articles/36000216034-is-batch-geocoding-supported-). Actual account entitlement/remaining quotas and live match accuracy are unverified. No private queries sent.

- [x] Implement #498 complete-name deduplication, incomplete/reversed lookup context, regional aliases, settlement type evidence, confidence gates and local per-place diagnostics.
- [ ] Verify provisional confidence thresholds and actual provider payloads against the eleven public locality examples and representative negative cases; compare accuracy on the private sample locally with informed consent. Native/browser QA remains required.

Provider field references: https://apidocs.geoapify.com/docs/geocoding/address-autocomplete/ and https://docs.locationiq.com/docs/autocomplete. Thresholds are conservative provisional implementation decisions, not empirically calibrated or provider guarantees.

- [x] Move matching after successful main import, use two bounded session-local lookup slots, project-scoped safe mutation, coalesced Places refresh and nonblocking status/stop (#499).
- [ ] Verify native/browser concurrency, immediate Places navigation, edits and map/route interactions, actual time to usable project and total lookup latency on matched workloads; test hosted/direct-file EN/RU. No empirical browser performance claims yet.

- [x] Add controlled lookup concurrency/dispatch and session-job lifecycle regression fixtures; inspect scoped Places patch and project-read invalidation paths.
- [ ] Native test execution, actual DOM/browser performance and complete interaction matrix remain to be verified. The repository source could be executed in isolated V8 with API stubs; the local runner could not resolve github.com to obtain a full checkout.
