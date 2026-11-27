# Project read model

## Requirements

- Live providers use explicit project ownership and read canonical objects without writing through the read model.
- The active project retains one lazy compatible value per provider key. Exit, project replacement and rollback release its generation. Off-project reads are uncached.
- Typed successful edits invalidate affected domains. An unclassified edit invalidates retained projections conservatively.
- People and Profile use the shared person and family indexes. An ID query does not build relationship adjacency or the directory. People prepares detailed rows after pagination.
