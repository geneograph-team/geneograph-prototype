const modules = ['Family Tree', 'People', 'Geneograph', 'Albums', 'Archive', 'Notes', 'Places']; ///Publish module is temp disabled, add 'Publish' to turn it on when needed

const PLACE_MAP_MODES = Object.freeze(['browse', 'add', 'move', 'center']);

const PLACES_MAP_CONFIG = Object.freeze({
    provider: 'openfreemap',
    moduleUrl: 'https://unpkg.com/maplibre-gl@6.16.0/dist/maplibre-gl.mjs',
    styles: Object.freeze({
        light: 'https://tiles.openfreemap.org/styles/liberty',
        dark: 'assets/map-styles/liberty-dark.json'
    }),
    minZoom: 2,
    maxZoom: 19,
    defaultZoom: 5,
    defaultCenter: Object.freeze({ lat: 50.05, lng: 20.25 }),
    fitMaxZoom: 12,
    errorThreshold: 3,
    loadTimeoutMs: 20000
});

// The dark basemap is a pinned Liberty-derived style in src/assets/map-styles/.
// Keep basemap colors separate from application palette tokens.
const placesMapRuntime = {
    mapTheme: null,
    map: null,
    host: null,
    markerLayer: null,
    routeLayer: null,
    markersById: new Map(),
    areaIds: new Set(),
    draftRadiusMarker: null,
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
    pendingRouteFitKey: null,
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

