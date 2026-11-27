# Delta: Place geocoding

## ADDED Requirements

### Multilingual automatic matching

Automatic import lookup SHALL use one configured provider per query, without secondary-provider retry on empty, rejected, ambiguous or failed results. Manual search SHALL retain its existing policy. Manual and automatic query preparation and response language SHALL align for recognized settlement inputs, preserving unrestricted manual input and manual fallback. Automatic matching SHALL select the first plausible provider-ranked settlement, including ambiguous or full pools, tolerate multilingual variants, incomplete context and missing scores, and favor settlement-level over address-level confidence. Explicit geographic contradictions, invalid coordinates and reliably incompatible types SHALL remain excluded. Only independently verified identity evidence SHALL authorize unattended merging. Provisional assignments SHALL be identifiable in session-local diagnostics. Original place/fact text SHALL remain unchanged. Unresolved imported places SHALL expose a localized reason and eligible explicit retry through the same guarded queue.
