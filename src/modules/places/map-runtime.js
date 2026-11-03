function placesMaptilerKey()
{
    return window.GENEOGRAPH_CONFIG?.maptilerKey || PLACES_MAP_CONFIG.maptilerKey || '';
}

function placesMapDataKey(places)
{
    return (places || []).map(place =>
    {
        const coordinates = normalizePlaceCoordinates(place);
        return [place.id, coordinates?.lat ?? '', coordinates?.lng ?? '', place.deleted].join(':');
    }).join('|');
}

function selectedPlaceFromList(list)
{
    return (list || []).find(place => place.id === state.selectedPlaceId)
        || (list || [])[0]
        || null;
}

function setPlacesMapStatus(title = '', message = '', { retry = false, list = false } = {})
{
    const status = document.querySelector('[data-places-map-status]');
    if (!status) return;
    if (!title && !message)
    {
        status.hidden = true;
        status.innerHTML = '';
        return;
    }
    status.hidden = false;
    status.innerHTML = `<strong>${escapeHtml(title)}</strong><span>${escapeHtml(message)}</span>${list ? `<button class="button primary" type="button" data-places-map-list>${escapeHtml(t('List view'))}</button>` : ''}${retry ? `<button class="button secondary" type="button" data-places-map-retry>${escapeHtml(t('Retry'))}</button>` : ''}`;
    status.querySelector('[data-places-map-list]')?.addEventListener('click', () =>
    {
        state.placesViewMode = 'list';
        renderPlaces();
    });
    status.querySelector('[data-places-map-retry]')?.addEventListener('click', () =>
    {
        const places = [...(placesMapRuntime.currentPlaces || [])];
        destroyPlacesMap();
        requestAnimationFrame(() => mountPlacesMap(places));
    });
}

function createPlacesTileLayer()
{
    const key = placesMaptilerKey();
    if (!placesMapRuntime.map || !key || !window.L)
    {
        placesMapRuntime.tilesAvailable = false;
        return null;
    }
    const layer = L.tileLayer(PLACES_MAP_CONFIG.tileUrl, {
        key,
        minZoom: PLACES_MAP_CONFIG.minZoom,
        maxZoom: PLACES_MAP_CONFIG.maxZoom,
        attribution: PLACES_MAP_CONFIG.attribution,
        crossOrigin: true
    });
    layer.on('tileerror', handlePlacesTileError);
    layer.on('tileload', handlePlacesTileLoad);
    layer.on('loading', () =>
    {
        if (placesMapRuntime.tileErrorCount >= PLACES_MAP_CONFIG.tileErrorThreshold)
        {
            setPlacesMapStatus('Loading map tiles', 'Retrying the hosted map connection.');
        }
    });
    layer.on('load', handlePlacesTileLoad);
    return layer;
}

function handlePlacesTileError()
{
    placesMapRuntime.tileErrorCount += 1;
    if (placesMapRuntime.tileErrorCount < PLACES_MAP_CONFIG.tileErrorThreshold) return;
    placesMapRuntime.tilesAvailable = false;
    updatePlacesMapToolControls();
    setPlacesMapStatus('Map tiles could not be loaded', 'Markers and routes remain available. Check the MapTiler key or network connection.', { retry: true });
}

function handlePlacesTileLoad()
{
    const hadErrors = placesMapRuntime.tileErrorCount >= PLACES_MAP_CONFIG.tileErrorThreshold;
    placesMapRuntime.tileErrorCount = 0;
    placesMapRuntime.tilesAvailable = true;
    updatePlacesMapToolControls();
    if (hadErrors) showToast('Map connection restored');
    setPlacesMapStatus();
}

function createPlaceMarkerIcon(
    place,
    selected = false
)
{
    const size =
        selected
            ? 30
            : 24;

    return L.divIcon({
        className:
          'places-leaflet-marker-icon',

        html: `
          <span
            class="
              leaflet-place-marker
              ${selected ? 'selected' : ''}
            "
            aria-hidden="true">
          </span>
        `,

        iconSize: [
            size,
            size
        ],

        iconAnchor: [
            size / 2,
            size
        ],

        tooltipAnchor: [
            0,
            -size + 3
        ]
    });
}

function createPlaceDraftMarkerIcon()
{
    const size = 30;

    return L.divIcon({
        className:
          'places-leaflet-marker-icon draft',

        html: `
          <span
            class="leaflet-place-marker draft"
            aria-hidden="true">
          </span>
        `,

        iconSize: [
            size,
            size
        ],

        iconAnchor: [
            size / 2,
            size
        ],

        tooltipAnchor: [
            0,
            -size + 3
        ]
    });
}

function formatMapCoordinatePair(latLng)
{
    return latLng && validLatitude(latLng.lat) && validLongitude(latLng.lng)
        ? `${Number(latLng.lat).toFixed(5)}, ${Number(latLng.lng).toFixed(5)}`
        : 'No point selected';
}

function removePlacesDraftMarker()
{
    if (placesMapRuntime.draftMarker) placesMapRuntime.draftMarker.remove();
    placesMapRuntime.draftMarker = null;
    placesMapRuntime.pendingLatLng = null;
}

function createPlacesDraftMarker(latLng)
{
    if (!placesMapRuntime.map || !window.L || !latLng) return null;
    removePlacesDraftMarker();
    const marker = L.marker(latLng, {
        draggable: true,
        autoPan: true,
        keyboard: true,
        icon: createPlaceDraftMarkerIcon(),
        title: 'Draft place position'
    }).addTo(placesMapRuntime.map);
    marker.on('drag', event => updatePlacesDraftCoordinates(event.target.getLatLng(), { moveMarker: false }));
    marker.on('dragend', event => updatePlacesDraftCoordinates(event.target.getLatLng(), { moveMarker: false }));
    placesMapRuntime.draftMarker = marker;
    placesMapRuntime.pendingLatLng = marker.getLatLng();
    return marker;
}

function updatePlacesDraftCoordinates(latLng, { moveMarker = true } = {})
{
    if (!latLng || !validLatitude(latLng.lat) || !validLongitude(latLng.lng)) return;
    const normalized = L.latLng(Number(latLng.lat), Number(latLng.lng));
    if (!placesMapRuntime.draftMarker) createPlacesDraftMarker(normalized);
    else if (moveMarker) placesMapRuntime.draftMarker.setLatLng(normalized);
    placesMapRuntime.pendingLatLng = normalized;
    const output = document.querySelector('[data-places-coordinate-output]');
    if (output) output.textContent = formatMapCoordinatePair(normalized);
    updatePlacesMapToolControls();
}

function placesPendingCoordinatesValid()
{
    const pending = placesMapRuntime.pendingLatLng;
    return Boolean(pending && validLatitude(pending.lat) && validLongitude(pending.lng));
}

function updatePlacesMapModeUi()
{
    const mode = placesMapRuntime.mode;
    const editing = mode !== 'browse';
    const shell = main.querySelector('.places-map');
    const content = main.querySelector('.places-content');
    shell?.classList.toggle('is-browsing', !editing);
    shell?.classList.toggle('is-editing', editing);
    shell?.classList.toggle('is-adding-position', mode === 'add');
    shell?.classList.toggle('is-moving-position', mode === 'move');
    content?.classList.toggle('is-editing', editing);
    if (editing)
    {
        state.placesMapInfoExpanded =
            false;

        const infoPanel =
            main.querySelector(
                '#placesMapInfoPanel'
            );

        if (infoPanel)
        {
            infoPanel.hidden = true;
        }

        const infoButton =
            main.querySelector(
                '#placesMapInfoToggle'
            );

        infoButton
            ?.setAttribute(
                'aria-expanded',
                'false'
            );

        infoButton
            ?.classList
            .remove('active');

        closeMenu();
    }
}

function setPlacesMapPickingState(active)
{
    const panel =
        placesMapRuntime
            .host
            ?.closest(
                '.places-map-panel'
            );

    panel
        ?.classList
        .toggle(
            'is-picking',
            active
        );
}

function updatePlacesMapInstruction(message = '')
{
    const instruction = document.querySelector(
        '[data-places-map-instruction]'
    );

    if (!instruction) return;

    instruction.hidden = !message;
    instruction.textContent = translateText(message);
}

function updatePlacesMapToolControls()
{
    const pendingValid =
        placesPendingCoordinatesValid();

    const copyButton =
        main.querySelector(
            '#placesCopyCoordinates'
        );

    if (copyButton)
    {
        copyButton.disabled =
            !pendingValid;
    }

    const confirmButton =
        main.querySelector(
            '#placesConfirmMapEdit'
        );

    if (confirmButton)
    {
        confirmButton.disabled =
            !pendingValid;

        confirmButton.textContent = 'Use position';
    }

    updatePlacesMapModeUi();
}

function showPlacesCoordinateBar(show)
{
    const bar = document.querySelector('[data-places-coordinate-bar]');
    if (bar) bar.hidden = !show;
}

function resetPlacesMapEditingUi()
{
    removePlacesDraftMarker();
    placesMapRuntime.mode = 'browse';
    placesMapRuntime.editingPlaceId = null;
    setPlacesMapPickingState(false);
    showPlacesCoordinateBar(false);
    updatePlacesMapInstruction();
    const output = document.querySelector('[data-places-coordinate-output]');
    if (output) output.textContent = 'No point selected';
    updatePlacesMapToolControls();
}

function cancelPlacesMapEditing({ reopenEditor = true } = {})
{
    const draft = placeEditorDraft;
    const session = draft?.mapSession;
    resetPlacesMapEditingUi();
    if (!draft) return;
    if (session)
    {
        draft.coordinates = clonePlaceEditorCoordinates(session.coordinates);
        draft.coordinateText = { ...session.coordinateText };
        draft.mapSession = null;
    }
    if (session?.returnToModal && reopenEditor)
    {
        requestAnimationFrame(() => openPlaceModal(draft.placeId, { draft }));
    }
    else if (!session?.returnToModal)
    {
        resetPlaceEditorDraft();
    }
}

function enterPlacesMapAddMode()
{
    if (!placesMapRuntime.map)
    {
        showToast(
            'The map is not ready yet.'
        );

        return;
    }

    if (!placeEditorDraft || placeEditorDraft.mode !== 'add')
    {
        resetPlaceEditorDraft();
        placeEditorDraft = createPlaceEditorDraft();
        placeEditorDraft.mapSession = {
            returnToModal: false,
            coordinates: null,
            coordinateText: placeEditorCoordinateText(null)
        };
    }
    resetPlacesMapEditingUi();

    placesMapRuntime.mode =
        'add';

    state.placesMapInfoExpanded =
        false;

    setPlacesMapPickingState(true);
    showPlacesCoordinateBar(true);

    updatePlacesMapInstruction(
        'Click the map to place a new location, or use the map centre.'
    );

    if (placeEditorDraft.coordinates)
    {
        updatePlacesDraftCoordinates(placeEditorDraft.coordinates);
    }

    updatePlacesMapToolControls();
}

function enterPlacesMapMoveMode(
    placeId =
        state.selectedPlaceId
)
{
    const place =
        getPlace(placeId);

    if (
        !placesMapRuntime.map
        || !place
    )
    {
        showToast(
            'The map is not ready yet.'
        );

        return;
    }

    if (!placeEditorDraft || placeEditorDraft.mode !== 'edit' || placeEditorDraft.placeId !== place.id)
    {
        resetPlaceEditorDraft();
        placeEditorDraft = createPlaceEditorDraft(place.id);
        placeEditorDraft.mapSession = {
            returnToModal: false,
            coordinates: clonePlaceEditorCoordinates(placeEditorDraft.coordinates),
            coordinateText: { ...placeEditorDraft.coordinateText }
        };
    }
    resetPlacesMapEditingUi();

    placesMapRuntime.mode =
        'move';

    state.placesMapInfoExpanded =
        false;

    placesMapRuntime.editingPlaceId =
        place.id;

    setPlacesMapPickingState(true);
    showPlacesCoordinateBar(true);

    updatePlacesMapInstruction(
        placeEditorDraft.coordinates
            ? `Drag the draft marker or click the map to reposition ${place.name}.`
            : `Click the map to position ${place.name}, or use the map centre.`
    );

    if (placeEditorDraft.coordinates)
    {
        updatePlacesDraftCoordinates(
            placeEditorDraft.coordinates
        );
    }

    updatePlacesMapToolControls();
}

function completePlaceEditorMapSelection()
{
    const latLng = placesMapRuntime.pendingLatLng;
    if (!placesPendingCoordinatesValid()) return;
    let draft = placeEditorDraft;
    if (!draft)
    {
        draft = placesMapRuntime.mode === 'move'
            ? createPlaceEditorDraft(placesMapRuntime.editingPlaceId)
            : createPlaceEditorDraft();
        placeEditorDraft = draft;
    }
    draft.coordinates = { lat: Number(latLng.lat), lng: Number(latLng.lng) };
    draft.coordinateText = placeEditorCoordinateText(draft.coordinates);
    draft.mapSession = null;
    draft.duplicateOverride = false;
    draft.dismissedDuplicateId = null;
    draft.disclosures.coordinates = true;
    updatePlaceEditorDraftDirty(draft);
    resetPlacesMapEditingUi();
    openPlaceModal(draft.placeId, { draft });
}

function handlePlacesMapClick(event)
{
    if (!['add', 'move'].includes(placesMapRuntime.mode)) return;
    updatePlacesDraftCoordinates(event.latlng);
}

