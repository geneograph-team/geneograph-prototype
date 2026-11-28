# Albums

## Requirements

### Requirement: Display-sized media previews and retained interactions

Ordinary Grid, List and inspector previews SHALL use the shared media preview runtime with bounded work and warm reuse. The Grid SHALL retain its justified layout. List SHALL retain its page-size controls, ordering, complete current page and pagination. Compatible selection, favorites and inspector changes SHALL retain unaffected rows/cards, previews, scroll and observers. Changes to filtered membership or order SHALL refresh the owning result. Full-resolution lightbox and tagging SHALL use the original source. See the shared media previews spec for resource and ownership rules.

### Requirement: Albums grid and tagging result continuity

Albums SHALL retain the full ordered photo result for search, filtering, scrolling and selection while preparing detailed grid cards on demand. Compatible resizing SHALL preserve the current card instances. Albums and Archive tagging SHALL rank the full eligible population and display up to 20 suggestions for empty search and up to 50 matches for active search. When matches exceed the cap, the modal SHALL display the shown and total counts and a refinement hint. The **Back to photo** button and existing face-area activation SHALL leave tagging in the same modal while preserving the image view and committed data. Face-area activation SHALL select the associated person, and Cancel SHALL retain its entry-dependent behavior. Region and primary-photo controls SHALL retain existing canonical update and confirmation semantics.

Empty search SHALL label the capped suggestions as Suggested people. Search SHALL exclude already-tagged, deleted and foreign-project candidates before ranking and applying the display cap. No pagination or Show more action extends the capped candidate list. The Back to photo and face-area transitions SHALL NOT create a tag or undo committed tags or regions; keyboard activation of an existing face area SHALL use the same transition. Archive SHALL preserve its existing owner refresh behavior and omit primary-profile-photo controls.
