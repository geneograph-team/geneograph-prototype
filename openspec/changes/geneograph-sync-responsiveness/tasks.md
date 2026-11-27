# Tasks

- [x] Profile Sync preparation, plan comparison, selection continuation and board render.
- [x] Bound repeated matching and projection work, verify transaction safety, and record board render stages.
- [x] Compare card text fitting on a larger board.
- [ ] Verify on the founder’s imported GEDCOM and obtain acceptance.

## Verification

Hosted Edge reproduced a 2,166 ms selection on a synthetic 6,481-person and 1,950-family project. Across opening and selection it measured 18 matching calls and 1,107 ms in preview computation. The updated 32-object board measured 76 ms hosted and 69 ms from file for selection, with projection at 11 and 8 ms. Sync open took 204 and 195 ms, including 148 and 136 ms of draft preparation. These are individual synthetic captures.

On a separate 152-object hosted board, three comparisons of card fitting measured about 94/61/70 ms before and 26/33/23 ms after. Final text-fit classes matched on all runs. Zoom and reopening retained the board.

Hosted English and direct-file Russian Edge checks covered Sync opening, manual selection and search, plan reuse, related and unrelated revision changes, stale rejection, rollback after a simulated write failure, Apply, and cancellation. A separate hosted Edge run staged a Tree partner onto a one-card board, checked repeatable patches, cancelled without changes, then applied the relationship and verified the resulting partner card and connector. Focused Node checks covered automatic matching parity, Diagnostics, the shared picker, and canonical project round trips.

Full canvas rendering still occurs on editor paths that use a full refresh. The initial conflict snapshot and event projection for canonical writes also remain synchronous. The captures do not establish budgets for those paths or reproduce the full range of multi-family conflicts on the private dataset.
