# Design

Register `profile-new` as a sibling People view. Keep existing entry points on `profile`. A separate renderer and stylesheet own the new shell. Reuse established avatar, life-summary, status-chip, and person-edit/menu behavior without copying legacy content cards.

Tabs use button tab semantics and arrow-key navigation. Overview has empty fixed-height cards. Other tabs show a localized unfinished state. The page scrolls vertically; Timeline and Relatives content regions are prepared for later horizontal and vertical overflow respectively. Stage 1 shows no event, relative, or fact records.
