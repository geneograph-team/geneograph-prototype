# Delta: Place geocoding

## ADDED Requirements

### Multilingual automatic matching

Automatic import lookup SHALL use one configured provider per query, without secondary-provider retry on empty, rejected, ambiguous or failed results. Manual search SHALL retain its existing policy. Comparison SHALL tolerate bounded multilingual name and administrative equivalents, incomplete input and absent optional scores with corroboration, while rejecting conflicting geography, ambiguous settlements, invalid coordinates and truncated candidate pools. Original place/fact text SHALL remain unchanged. Unresolved imported places SHALL expose a localized reason and eligible explicit retry through the same guarded queue.
