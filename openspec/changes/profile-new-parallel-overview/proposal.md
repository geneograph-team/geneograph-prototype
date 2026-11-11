# Profile New — Stage 1 (#192)

## Proposal
Implement an opt-in Profile New view alongside the unmodified legacy Profile. The approved v4 concept establishes the Overview layout: an all-events horizontal timeline, Immediate family, and Facts & connections card, plus four future-content placeholders.

## Ownership
New renderer/style files in People. Shared canonical genealogy, relationships, timeline evidence/edit interactions, linked resource counts, theme tokens and EN/RU runtime are reused. Existing person navigation—including relatives selected inside Profile New—continues opening legacy Profile.

## Safeguards
No existing Profile replacement, new persistence, changes to CI/deployment, dependency additions, or unrelated refactoring. The current project data graph is the only source of records. Stages #193–#196 implement the detailed tabs separately.

## Manual QA to complete before merging
Verify direct file://, EN/RU, light/dark, desktop/mobile, sparse/dense biographies, relative navigation, browser back/forward, timeline expanded evidence and edit actions, source links, and horizontal vs vertical scrolling. Compare against approved Profile v4 and legacy Profile. Document any failures before cutover.
