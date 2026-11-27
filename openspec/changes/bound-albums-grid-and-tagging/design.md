# Design

Use one full Albums query per render. Retain lightweight card shells for the sorted population so layout and keyboard focus work across the entire scroll range. Mount detailed photo markup near the viewport or when a card receives focus. Resize regroups existing card nodes. Compatible selection, editing and tagging refreshes reuse the grid when the result identities match. If an edit changes Updated ordering, the existing cards are regrouped in the new order.

Prepare photo search fields and person candidate metadata in the project read model. Rank all eligible people with the existing scoring and render a scroll window of results. Scrolling and keyboard movement cross window boundaries. The search field stays connected and edits preserve their existing canonical commit and confirmation rules.
