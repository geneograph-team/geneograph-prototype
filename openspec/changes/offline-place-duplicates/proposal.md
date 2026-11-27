# Improve offline multilingual Place duplicate detection

Implement #316 using comparison-only normalization, bounded Cyrillic/Latin transliteration and conservative context/position evidence. Keep the existing shared advisory matcher, project ownership and explicit merge. No provider calls, place dictionaries, schema changes or authored-name changes.
