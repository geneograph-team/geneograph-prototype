# Tasks

- [x] Implement detached automatic coordinate matching and automatic lookup, progress, stop, final validation, report and bounded provider fallback.
- [x] Add synthetic matching, budget and provider request fixtures for structured evidence, ambiguous primary results, fallback, quota, abort, missing credentials and manual-search compatibility.
- [x] Remove the pre-import matching settings block and checkbox; retain concise footer disclosure, transient progress/stop, cancellation and final report.
- [ ] Run native GEDCOM/geocoder/localization suites and hosted/direct-file EN/RU browser QA, including close/cancel, retry, provider errors, attribution and actual private sample with informed consent. Verify account-specific provider limits/terms before deployment.
- [ ] Reconcile baseline specs and archive after material acceptance.

Published Geoapify and LocationIQ documentation describes controlled bulk requests (https://www.geoapify.com/tutorial/batch-geocoding-js-and-rate-limits/ and https://help.locationiq.com/support/solutions/articles/36000216034-is-batch-geocoding-supported-). Actual account entitlement/remaining quotas and live match accuracy are unverified. No private queries sent.

- [x] Implement #498 complete-name deduplication, incomplete/reversed lookup context, regional aliases, settlement type evidence, confidence gates and local per-place diagnostics.
- [ ] Verify provisional confidence thresholds and actual provider payloads against the eleven public locality examples and representative negative cases; compare accuracy on the private sample locally with informed consent. Native/browser QA remains required.

Provider field references: https://apidocs.geoapify.com/docs/geocoding/address-autocomplete/ and https://docs.locationiq.com/docs/autocomplete. Thresholds are conservative provisional implementation decisions, not empirically calibrated or provider guarantees.
