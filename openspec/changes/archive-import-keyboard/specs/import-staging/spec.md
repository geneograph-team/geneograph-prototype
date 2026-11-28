## ADDED Requirements

### Requirement: Responsive staged import feedback

Albums and Archive local batch imports SHALL expose localized progress before preparation and confirmed commit, with meaningful processed/total and failure counts, indeterminate finalization, and accessible progress feedback. Busy work SHALL prevent duplicate submission and ordinary dismissal, yield cooperatively, preserve original assets and destination/linking/validation semantics, and restore idle controls or close on success. Failures SHALL be reported distinctly; successful imports SHALL NOT be committed again on retry.

### Requirement: Bounded staging previews

Staged images SHALL use lightweight shells and supported display-sized derivatives prepared near the viewport. Mounted previews, derivative bytes and concurrent jobs SHALL be bounded; unavailable previews SHALL retain generic fallbacks. Removal, replacement and closing SHALL release owned temporary URLs and prevent stale completion. Committed asset URLs SHALL NOT be revoked by staging. Existing canonical storage and full-resolution viewing SHALL remain intact.
