const modules = ['Family Tree', 'People', 'Geneograph', 'Albums', 'Archive', 'Notes', 'Places']; ///Publish module is temp disabled, add 'Publish' to turn it on when needed

const PLACE_MAP_MODES = Object.freeze(['browse', 'add', 'move', 'center']);

const PLACES_MAP_CONFIG = Object.freeze({
    provider: 'maptiler',
    maptilerKey: window.GENEOGRAPH_CONFIG?.maptilerKey || '',
    tileUrl: 'https://api.maptiler.com/maps/streets-v4/256/{z}/{x}/{y}.png?key={key}',
    attribution: '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>',
    minZoom: 2,
    maxZoom: 19,
    defaultZoom: 5,
    defaultCenter: Object.freeze({ lat: 50.05, lng: 20.25 }),
    fitMaxZoom: 12,
    tileErrorThreshold: 3
});

const placesMapRuntime = {
    map: null,
    host: null,
    tileLayer: null,
    markerLayer: null,
    routeLayer: null,
    markersById: new Map(),
    resizeObserver: null,
    tileErrorCount: 0,
    mountedListKey: '',
    currentPlaces: [],
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

