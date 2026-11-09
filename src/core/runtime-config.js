const modules = ['Family Tree', 'People', 'Geneograph', 'Albums', 'Archive', 'Notes', 'Places']; ///Publish module is temp disabled, add 'Publish' to turn it on when needed

const PLACE_MAP_MODES = Object.freeze(['browse', 'add', 'move', 'center']);

const PLACES_MAP_CONFIG = Object.freeze({
    provider: 'openfreemap',
    moduleUrl: 'https://unpkg.com/maplibre-gl@6.16.0/dist/maplibre-gl.mjs',
    styles: Object.freeze({
        light: 'https://tiles.openfreemap.org/styles/liberty',
        dark: 'https://tiles.openfreemap.org/styles/dark'
    }),
    minZoom: 2,
    maxZoom: 19,
    defaultZoom: 5,
    defaultCenter: Object.freeze({ lat: 50.05, lng: 20.25 }),
    fitMaxZoom: 12,
    errorThreshold: 3,
    loadTimeoutMs: 20000
});

// The upstream OpenFreeMap Dark preset is near-black. These are GeneoGraph's
// *vector basemap* paint overrides, not application UI colors/CSS tokens.
// Keys are OpenFreeMap Dark layer IDs; unknown IDs are ignored at runtime.
// The light basemap and OpenFreeMap tile/sprite/glyph URLs stay unchanged.
// Edit this palette to tune contrast without forking the upstream style JSON.
const PLACES_DARK_MAP_PAINT = Object.freeze({
    background: { 'background-color': '#293139' },
    water: { 'fill-color': '#244354' },
    landcover_ice_shelf: { 'fill-color': '#46535f' },
    landcover_glacier: { 'fill-color': '#495d67' },
    landuse_residential: { 'fill-color': '#323b45' },
    landcover_wood: { 'fill-color': '#344b3f' },
    landuse_park: { 'fill-color': '#355045' },
    waterway: { 'line-color': '#426b7e' },
    water_name: {
        'text-color': '#b4d0df',
        'text-halo-color': '#244354'
    },
    building: {
        'fill-color': '#39424c',
        'fill-outline-color': '#4b5865'
    },
    'aeroway-taxiway': { 'line-color': '#53616e' },
    'aeroway-runway-casing': { 'line-color': '#48535f' },
    'aeroway-area': { 'fill-color': '#343e48' },
    'aeroway-runway': { 'line-color': '#64727e' },
    road_area_pier: { 'fill-color': '#3b4650' },
    road_pier: { 'line-color': '#4b5966' },
    highway_path: { 'line-color': '#586c7b' },
    highway_minor: { 'line-color': '#536371' },
    highway_major_casing: { 'line-color': '#43515e' },
    highway_major_inner: { 'line-color': '#74818d' },
    highway_major_subtle: { 'line-color': '#667583' },
    highway_motorway_casing: { 'line-color': '#51606e' },
    highway_motorway_inner: { 'line-color': '#929fac' },
    highway_motorway_subtle: { 'line-color': '#72818f' },
    railway_transit: { 'line-color': '#63717d' },
    railway_transit_dashline: { 'line-color': '#303941' },
    railway_minor: { 'line-color': '#5f6d79' },
    railway_minor_dashline: { 'line-color': '#303941' },
    railway: { 'line-color': '#63717d' },
    railway_dashline: { 'line-color': '#303941' },
    highway_name_other: {
        'text-color': '#c1ccd6',
        'text-halo-color': '#293139'
    },
    highway_name_motorway: { 'text-color': '#e2e8ee' },
    boundary_state: { 'line-color': '#71808d' },
    'boundary_country_z0-4': { 'line-color': '#7d8c98' },
    'boundary_country_z5-': { 'line-color': '#8594a1' },
    place_other: {
        'text-color': '#bdc8d1',
        'text-halo-color': '#293139'
    },
    place_suburb: {
        'text-color': '#becbd6',
        'text-halo-color': '#293139'
    },
    place_village: {
        'text-color': '#d2dce4',
        'text-halo-color': '#293139'
    },
    place_town: {
        'text-color': '#e1e8ee',
        'text-halo-color': '#293139'
    },
    place_city: {
        'text-color': '#e8edf2',
        'text-halo-color': '#293139'
    },
    place_city_large: {
        'text-color': '#f1f4f7',
        'text-halo-color': '#293139'
    },
    place_state: {
        'text-color': '#cad5dd',
        'text-halo-color': '#293139'
    },
    place_country_other: {
        'text-color': '#cbd5dd',
        'text-halo-color': '#293139'
    },
    place_country_minor: {
        'text-color': '#d9e1e8',
        'text-halo-color': '#293139'
    },
    place_country_major: {
        'text-color': '#f1f5f7',
        'text-halo-color': '#293139'
    }
});

const placesMapRuntime = {
    mapTheme: null,
    map: null,
    host: null,
    markerLayer: null,
    routeLayer: null,
    markersById: new Map(),
    resizeObserver: null,
    loadTimeout: null,
    errorCount: 0,
    requestId: 0,
    readyWaiters: [],
    status: 'idle',
    styleLoading: false,
    mountedListKey: '',
    currentPlaces: [],
    pendingFocusPlaceId: null,
    suppressViewCapture: false,
    mode: 'browse',
    draftMarker: null,
    pendingLatLng: null,
    editingPlaceId: null,
    tilesAvailable: false
};

let placesSearchTimer = null;
let placeGeocoderController = null;
let placeGeocoderTimer = null;
let placeEditorDraft = null;
let placeEditorCompletion = null;

const PLACE_EDITOR_GEOCODER_MIN_LENGTH = 3;
const PLACE_EDITOR_GEOCODER_DEBOUNCE_MS = 300;
const PLACE_EDITOR_CLOSE_COORDINATE_KM = 0.5;

function currentFamilyTreeProjectId()
{
    return currentProjectId();
}

