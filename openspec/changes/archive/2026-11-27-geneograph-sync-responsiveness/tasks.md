# Tasks

- [x] Profile Sync preparation, plan comparison, selection continuation and board render.
- [x] Bound repeated matching and projection work, verify transaction safety, and record board render stages.
- [x] Compare card text fitting on a larger board.
- [x] Record founder's imported GEDCOM performance verification and acceptance (limitations below).

## Verification

Hosted Edge reproduced a 2,166 ms selection on a synthetic 6,481-person and 1,950-family project. Across opening and selection it measured 18 matching calls and 1,107 ms in preview computation. The updated 32-object board measured 76 ms hosted and 69 ms from file for selection, with projection at 11 and 8 ms. Sync open took 204 and 195 ms, including 148 and 136 ms of draft preparation. These are individual synthetic captures.

On a separate 152-object hosted board, three comparisons of card fitting measured about 94/61/70 ms before and 26/33/23 ms after. Final text-fit classes matched on all runs. Zoom and reopening retained the board.

Hosted English and direct-file Russian Edge checks covered Sync opening, manual selection and search, plan reuse, related and unrelated revision changes, stale rejection, rollback after a simulated write failure, Apply, and cancellation. A separate hosted Edge run staged a Tree partner onto a one-card board, checked repeatable patches, cancelled without changes, then applied the relationship and verified the resulting partner card and connector. Focused Node checks covered automatic matching parity, Diagnostics, the shared picker, and canonical project round trips.

Full canvas rendering still occurs on editor paths that use a full refresh. The initial conflict snapshot and event projection for canonical writes also remain synchronous. The captures do not establish budgets for those paths or reproduce the full range of multi-family conflicts on the private dataset.

## Transaction-safety follow-up

The original planner was reproduced in Edge with one linked parent and an unlinked child staged for creation. With no explicit relationship choice, preview changed the live family collection and emitted zero family patches. This occurred with both a new family and an existing matching family.

Canonical person and family arrays in the projection are separate from the live arrays. The planner deep-copies an existing record at its first write, including writes reached through automatic parent linking, sibling membership, relationship fields, partner event helpers and fact transfers. Board records are detached, and event generation reads detached inputs. Evidence projections build replacement records when references change. Apply recomputes the plan and checks the live baselines. Failed writes unwind in reverse order, restoring collection positions, board metadata and history.

The person who stages a relationship transfer remains its owner and fallback placement anchor when the review moves to another person. Derived decisions without a staging action use a stable relation or opening anchor. Search, status filtering, person navigation and summary toggling can reuse the plan because those controls do not change that ownership.

### Follow-up verification

- `node tests/geneograph/test-sync-transactions.cjs` uses the real planner, project read model and patch writer. It checks whole-data snapshots, both automatic family paths, stable IDs and plan parity, explicit relationship transfers, facts and parentage fields in both directions, revision-scoped reuse, stale rejection, partial rollback, evidence-record order and exactly-once Apply.
- The Geneograph shortlist, project-data-contract, Diagnostics and shared picker Node checks passed.
- Hosted English Edge exercised a new automatic family. Direct-file Russian Edge exercised an existing family. Both covered search, filter, person navigation, summary, Cancel and Apply. The stress workflow also exercised manual linking, stale rejection and rollback after an injected write failure.
- Three runs per protocol used the prior 32-object board on the synthetic 6,481-person and 1,950-family project. The table shows synchronous operation timings in milliseconds.

| Mode | Sync open | Selection continuation | Selection projection |
| --- | --- | --- | --- |
| Hosted | 197.8 / 202.2 / 206.6 | 64.2 / 60.1 / 66.2 | 8.4 / 7.8 / 8.1 |
| Direct file | 208.3 / 201.3 / 202.6 | 75.7 / 72.6 / 76.8 | 8.9 / 9.8 / 9.4 |

The timings are comparable to the previous optimized selection samples of 76 ms hosted and 69 ms direct file. The private imported GEDCOM, the full range of multi-family conflicts and founder acceptance remain pending. The change stays active.

## Founder acceptance — 27 November 2026

Founder explicitly accepted #473 after reviewing implementation `2352e9192a2b220aa00b181ed1eac3f2a25054c1` and transaction-safety correction `464e731956cc1465f87c16610dbf55982b9a4cf4`. The corrective regression and browser results above remain the correctness evidence. The subsequent founder-supplied Detailed schema-3 export on the imported project retained all 87 completed operations without drops, across two recording epochs. Picker samples report 6,481 eligible project people; board renders report 104–114 objects and 0–8 edges, while Sync review counts 101–108 represented people.

| Operation | Founder recording (ms) |
| --- | --- |
| Board render (five samples) | 151.1 / 151.8 / 170.2 / 152.8 / 168.2 |
| Sync open (three samples) | 237.5 / 245.0 / 237.3 |
| Manual picker selection continuation (three samples) | 85.1 / 102.7 / 102.9 |
| Selection projection | 7.2 / 15.1 / 17.7 |
| Sync Apply (two samples, inclusive of board rerender) | 234.9 / 235.4 |
| Apply projection | 14.1 / 20.0 |
| Apply patch writer (stage labeled evidence) | 0.6 / 0.1 |

The preceding imported-project selection sample was 1,458.1 ms; the new 85.1–102.9 ms samples support the intended responsiveness improvement, not a matched statistical benchmark or paint measurement. The latest epoch alone reports 21 page-wide long tasks (maximum 250 ms) and two legacy invalidations with two evicted entries; historical epoch summaries are unavailable. Mutation invalidation remains #474 work. The separate report of poor Add person Possible matches is a matching-quality concern (shared PersonMatchEngine, policy #322), not a demonstrated regression in this Sync optimization. Exact false-negative cause and desired policy require separate investigation.

Founder accepts the optimization and documented limitations. This export records timings and operation completion, not verification of every transfer, Cancel, or canonical record outcome. Broad multi-family conflicts on private data, complete board/edit/gesture, theme/viewport and cross-engine coverage, and residual synchronous conflict snapshot/event projection/full canvas rendering costs are not comprehensively verified. No runtime tests were rerun for administrative closeout. Do not interpret acceptance as execution of every original QA scenario; retain integrated regression in #460.
