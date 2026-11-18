# Separate sample seed records from feature runtime

## Why

Issue 263 identifies sample records inside Archive and Notes modules and active Geneograph factories inside a seed file. The current placement hides ownership and load dependencies.

## What changes

- Move board collections, Archive records, Notes records, source links, and sample-only Archive place initialization into `src/seed/`.
- Move Geneograph canvas and paint factories and constants into `src/modules/geneograph/`.
- Update classic-script references and architecture documentation without changing sample content, runtime interfaces, or behavior.

## Boundaries

No persistence, migrations, bundler, schema changes, shared-actions cleanup, or feature changes.
