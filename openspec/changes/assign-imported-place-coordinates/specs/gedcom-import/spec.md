## ADDED Requirements

### Requirement: Match missing place coordinates after confirmation

Following offline preparation, the importer SHALL automatically attempt at most 150 distinct eligible unresolved places per import, prioritized by linked records, after disclosure and confirmation. Users MAY opt out or stop lookup and continue with completed results. Closing/cancelling the import SHALL discard the entire draft. Preserve authored names, existing coordinates, links and invalid/conflicting source evidence. Only unique strongly matched settlement candidates receive coordinates; uncertainty and historical or unsupported context remain unresolved. Final detached validation SHALL precede commit. Network failures SHALL NOT prevent import; report completed and skipped outcomes truthfully.
