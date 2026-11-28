## ADDED Requirements

### Requirement: Immediate Archive keyboard browsing

The active file workspace SHALL be keyboard-ready on entry, layout switch, folder opening, preview dismissal and result refresh without an initial click or Tab. Preserve valid current selection; when no item is selected the first directional key selects the first eligible item. Do not steal focus or keys from independent active controls.

Details SHALL navigate Up/Down through the displayed list. Icons SHALL navigate Left/Right/Up/Down according to the actual visual grid, with narrow list presentation following its displayed order. Enter SHALL open the selected file's existing preview or explicitly open a selected folder. Image SHALL navigate Left/Right through its ordered image sequence without requiring focus on a clicked preview. Boundaries SHALL NOT wrap. Keep selection, inspector, focus and scroll synchronized and retain compatible list nodes and preview derivatives. Preserve guarded edits, modified shortcuts, nested controls, menus, dialogs, text entry and other modules.

### Requirement: Create folder without navigation

Successful Archive folder creation SHALL close the creation dialog, refresh the current location and give localized success feedback, without automatically opening the new folder, changing location/filter/history, or redirecting to a chosen parent. Explicit folder opening and existing validation/ownership semantics remain available.
