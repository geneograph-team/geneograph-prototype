# Experimental Family Chart layout (#389)

## Why

The founder wants to compare the promising Family Chart visual direction against the existing Classic view with real project data, without replacing the working Classic solver.

## Change

Add an opt-in, session-only Test layout checkbox beside the unchanged view switcher. It selects a separate Family Chart-style layout calculation using the local, licensed D3 tidy-tree core and GeneoGraph family-context adapter, with the existing cards, connectors and interactions. Leave Classic as the default. The experiment is not a decision to adopt a production solver.

## Scope

Preserve the canonical schema, projected people/family IDs, and actual edges. Do not introduce a mandatory build or network dependency. Report unresolved geometry and rejected projections visibly. Full #318/#319/#388 acceptance remains separate.
