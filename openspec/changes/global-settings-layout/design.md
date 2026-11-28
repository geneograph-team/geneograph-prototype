# Design

Bound the settings modal with a flex-column frame, shrinkable grid body and focusable content scroll owner. Narrow layouts stack navigation above content. At exceptionally short heights (360 CSS px or less; 480 CSS px or less with stacked navigation), one outer scroll owner keeps every action reachable. Section changes replace panel content only, retain navigation focus and reset scroll; same-section language refresh restores scroll and focus. Reuse existing tokens, controls and EN/RU localization. Provider credits and links retain their existing markup and styling.
