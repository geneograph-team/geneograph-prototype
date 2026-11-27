## ADDED Requirements

### Requirement: Compatible Places map updates

A compatible update in the same project SHALL retain the map and camera while applying the latest visible places and marker content. Switching away from the map SHALL release its resources. A queued mount SHALL be discarded if its host or project is obsolete. A compatible update during Add or Move SHALL preserve pending coordinates, radius text, validation, the draft marker and usable editing controls. Cancel SHALL restore the draft snapshot. Use position SHALL stage coordinates in the editor for Save.
