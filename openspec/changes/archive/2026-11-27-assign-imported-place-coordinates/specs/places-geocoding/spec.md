## ADDED Requirements

### Requirement: Bounded automatic import matching

Import matching SHALL inspect structured provider settlement identity, name, country, administrative evidence and available confidence without relying on formatted display strings or result order. Each distinct query SHALL make at most one request per provider; LocationIQ fallback SHALL occur only on primary failure or no eligible candidates, not weak/ambiguous primary results. A quota response SHALL stop the queue. Reuse throttling, cancellation, attribution and credential boundaries. No requests during preview or automatic retries after commit failure. Manual search SHALL remain unchanged.
