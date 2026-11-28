# Tasks and verification

- [x] Identify legacy notifications and isolate read-model, Place reference, event reconstruction and render costs before application edits.
- [x] Migrate the measured commit owners and audit nested and secondary record changes, fallback, and dirty-state transitions.
- [x] Repeat the same stress-project workload and verify provider freshness, reuse, ownership and representative failure and rollback with automated regressions.
- [x] Verify patched browser flows for People and Profile, Places, Notes, Albums and Archive. Check Geneograph matching and project isolation in the stress harness.
- [x] Audit and verify single-file Archive Place commits, transactional callers and Keep dismissal expiry.
- [ ] Complete founder acceptance and any remaining manual checks before archiving.

## Matched browser measurements

Three consecutive repetitions per revision in the Codex in-app Chromium browser at 1280×720, English, light theme, local HTTP. Each revision began with a fresh document on the same internal stress fixture of 6,481 people and 1,950 families, augmented in memory with one synthetic note, collection, photo and unlinked Keep decision. Each action warmed the same providers immediately before the mutation. Values are milliseconds in run order. Durations are synchronous and can include nested work.

| Action | Legacy / typed notifications per run | Evicted entries per run | Commit before → after | Following provider demand before → after |
| --- | --- | --- | --- | --- |
| Note text save boundary | 0 / 1 → 0 / 1 | 0 → 0 | 3.7 / 1.8 / 1.2 → 0.3 / 0.1 / 0.0 | 0.2 / 0.1 / 0.0 → 0.1 / 0.0 / 0.0 |
| Note collection assignment/removal | 1 / 0 → 0 / 1 | 9 → 0 | 3.1 / 1.5 / 1.3 → 0.1 / 0.0 / 0.0 | 50.6 / 53.6 / 48.4 → 0.0 / 0.0 / 0.0 |
| Photo favourite toggle | 1 / 0 → 0 / 1 | 9 → 2 | 13.2 / 5.9 / 4.7 → 6.6 / 3.5 / 3.6 | 50.6 / 53.5 / 49.7 → 0.1 / 0.0 / 0.0 |
| Person name save with relationship block submitted | 3 / 0 → 0 / 1 | 9 → 8 | 395.3 / 216.3 / 195.1 → 213.7 / 197.7 / 201.3 | 7.6 / 4.4 / 3.6 → 4.9 / 4.8 / 4.9 |

The note text sample called the real timestamp/save boundary with preview refresh disabled. The timed person sample invoked the real form save without its unchanged-relationship comparison snapshot in both revisions. A separate patched run used the snapshot and verified a changed relationship place, relink, and three staged attachments in one commit. The timed fixture did not replicate the founder's imported evidence density or benchmark every mutation.

For person saves the dirty boundary dropped from three calls to one and from 7.5 / 4.3 / 3.5 ms to 2.6 / 1.5 / 1.7 ms. Place reference passes dropped from four to two, approximately 25,924 to 12,962 stress-project person-owner visits per save, plus family and other collection work. Their aggregate time was 8.6 / 5.5 / 4.8 ms before and 4.6 / 2.7 / 4.3 ms after. The text, collection and favourite operations each had one reference pass before and zero after. Eviction itself was 0–0.2 ms. Person event reconstruction, including source pruning, was 302.4 / 135.6 / 120.4 ms before and 126.3 / 121.5 / 118.4 ms after. Source pruning on this sparse fixture was at most 0.2 ms. Person shell render was 83.3 / 75.4 / 70.4 ms before and 83.0 / 73.7 / 80.6 ms after. Some required provider rebuilds occurred inside that render. The steady-state person-save timings overlap, and these measurements do not include paint.

Of seven compared provider outputs, collection edits went from zero hits to seven, favourites from zero to five, and person saves from zero to one (duplicate pairs). Note text kept all seven in both revisions. These are output identity checks. The eviction counts include nested directory providers. A separate browser run warmed 13 named production provider entries across People and families, Places, Geneograph matching, Notes, shared link and photo-filter search, and Albums search, tagging and membership. It verified exact reuse for note text and collections, expected invalidation for favourite, source-link and tag/primary repair, scoped place and event freshness, a language variant, and project return without cross-project People leakage. The browser unload guard was installed after edits.

## Browser and automated coverage

The patched Whiskerfield UI verified a saved name and new birth place, Places evidence and rename, the updated Profile, draft discard, note duplication, favourite removal from the filtered Albums view, and an Archive source-to-person link. Geneograph Sync copied a Tree name to the board, then Undo and Redo restored the expected board names. At 390×844, keyboard module navigation reached the edited People Profile. Settings switched to Russian and dark mode and were restored afterward. A separate native Chrome direct-file run opened the sample, saved a Place with manual coordinates, displayed its coordinates in the inspector and showed the browser unload warning on close. The sample and stress consoles reported no errors in the checked windows.

The reusable tests cover typed mutation counts, timestamp and rollback behavior, event and source-link pruning across owners, reference-safe Place merge/delete, provider reuse, search variants, GEDCOM import/replacement, and Geneograph Sync Apply, rollback and history restore. The permanent delete paths were kept conservative. The issue's original 3.9-second page-wide task remains unattributed. Event reconstruction and shell rendering dominated the synthetic person action.

The full deployed map/geocoder path and comprehensive keyboard coverage were outside the exercised windows. A repeat on founder-scale linked evidence can establish whether the synthetic result generalizes to the original imported workload. No private dataset or trace belongs in the change.

## Archive Place picker follow-up

The regression reproduced a successful single-file picker write with zero notifications. Existing Place additions and removals now notify the file owner's Archive domain once and check authored Place references. The file's document Place is preserved while still selected. Validation failures and unchanged saves leave the timestamp and edit revision alone. The direct unlink, shared Archive picker and bulk writes use the existing atomic boundary. The nested setter defers notification to that boundary, which also records Places if its caller creates a Place as part of the commit. A new Place opened and saved separately in Places is its own commit.

The focused regression verifies the picker callback, exact domain and dirty revision, preserved People and Places state, expiry of the linked Keep decision, rejection of a foreign Place, repeated saves, direct unlink and a two-write Archive transaction. Local HTTP Chromium QA kept a new unlinked Place, linked it to one Whiskerfield Archive file via the keyboard-operable picker, and saw the connected file count rise to one. Removing the link in the same picker restored the unlinked review card and preserved the existing document Place. Discarding a staged re-link left the original link count intact. No console errors were reported in the checked window. This follow-up used existing saved Places in the picker and did not exercise remote geocoding.
