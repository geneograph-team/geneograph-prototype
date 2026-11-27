# Design

Use one place query for the country tree and main view. Search and basic place filters need no association context. The project read model indexes people and events by place for active association filters, list counts, the selected inspector and the shared selector. Broad reference-owner enumeration remains separate and is shared within a render. Duplicate comparisons are keyed to the places revision. Dismissal state and reference owners are read when needed because they have different inputs.

Retain the connected MapLibre host during compatible renders. Use the latest result list for loading and ready maps. Scheduled mounts verify project and host identity, and the resize observer follows the retained host. Marker content includes place names and language in its refresh key. Camera-fit identity is independent of marker text.
