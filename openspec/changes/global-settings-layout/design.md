# Design

Bound the settings modal with a flex-column frame, shrinkable grid body and focusable content scroll owner. Narrow layouts stack navigation above content. At exceptionally short heights (360 CSS px or less; 480 CSS px or less with stacked navigation), one outer scroll owner keeps every action reachable. Section changes replace panel content only, retain navigation focus and reset scroll; same-section language refresh restores scroll and focus. Reuse existing tokens, controls and EN/RU localization. Provider credits and links retain their existing markup and styling.

Visual polish: use a subtle theme-adaptive tint of the modal surface, medium group corners, 14px group headings, 600-weight navigation labels and compact header/footer padding. General selects share a 160px desktop width and fill the row at the narrow breakpoint. Informational rows without an action span the full grid. Diagnostics retains its own existing select sizing and state hierarchy.
