# Design

Filter and sort review items as today, then omit only the empty `invalid_coordinates` group before group ordering. Keep Missing map positions and Dismissed independent.

The canonical sample's Place array is byte-for-byte identical before and after `normalizeCentralPlaceRecords()`. Creation and editing already write canonical names, aliases, coordinates, timestamps and deletion state. Remove that no-op migration and its call; keep the canonical coordinate normalization helper for map display and validation, but restrict it to `place.coordinates`.
