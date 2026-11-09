# Proposal — Reliable autocomplete cancellation (#168)

## Problem

Typing a new character while a shared place lookup is in flight has
occasionally produced an uncaught AbortError in production. The previous
fix (#167) covered the shared wrapper and Places editor timer, but no
real-browser test covered the shared combobox's input events.

## Scope

- Remove redundant AbortController forwarding in modern browsers by
  composing user cancellation and provider timeout signals.
- Preserve a safe compatibility path for older browser environments.
- Handle and release pending search promises/controllers in shared place
  fields, Places editor and Geneograph picker.
- Preserve 300 ms debounce, normalized result shape, project-place
  lookup, silent Geoapify → LocationIQ fallback, manual place entry.
- Add focused Node and browser regression tests, CI checks and runbook.

## Constraints

No backend, new provider, credentials, persistent data model, historical
gazetteer or UI redesign. No blanket unhandledrejection suppression.

## Verification caveat

A reduced Chromium test of the original algorithm did not reproduce
the reported unhandled rejection, though it did reproduce cancellation
of pending requests. The browser regression therefore tests the full
shared combobox event path and guards against the symptom. Production
verification remains required; the fix is not claimed as proven by
Node-level simulation alone.
