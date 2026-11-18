# Unify Places review rows

## Why

Duplicate findings currently look like two separately selectable Places. Selection by Place ID highlights unrelated pairs sharing that Place and shows a one-sided inspector.

## What changes

- Show each duplicate finding as one compact selectable row, keyed by its pair ID, with a comparison inspector and intentional View Place actions.
- Give active and dismissed missing-position findings the same review-row hierarchy, singular heading and compact details.
- Align duplicate Restore with the existing dismissed-item control.

## Boundaries

Duplicate matching, merge decisions, coordinate detection, and stored dismissal semantics remain unchanged. Browser QA is performed by the user.
