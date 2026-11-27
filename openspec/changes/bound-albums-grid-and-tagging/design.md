# Design

Use one full Albums query per render. Retain lightweight card shells for the sorted population so layout and keyboard focus work across the entire scroll range. Mount detailed photo markup near the viewport or when a card receives focus. Resize regroups existing card nodes. Compatible selection, editing and tagging refreshes reuse the grid when the result identities match. If an edit changes Updated ordering, the existing cards are regrouped in the new order.

Prepare photo search fields and person candidate metadata in the project read model. Rank all eligible people with the existing scoring, then render at most 20 suggestions or 50 search matches. The shared Albums and Archive modal resets the search and switches to its existing preview on **Back to photo** or activation of a marked area. Both transitions reuse the image view state. The search field stays connected and edits preserve their existing canonical commit and confirmation rules.
