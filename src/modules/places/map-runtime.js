function placesMapDataKey(places)
{
    return (places || []).map(place =>
    {
        const coordinates = normalizePlaceCoordinates(place);
        return [place.id, coordinates?.lat ?? '', coordinates?.lng ?? '',
            place.approximateRadiusMeters ?? '', place.deleted].join(':');
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
    status.innerHTML = `<strong>${escapeHtml(t(title))}</strong><span>${escapeHtml(t(message))}</span>${list ? `<button class="button secondary" type="button" data-places-map-list>${escapeHtml(t('List view'))}</button>` : ''}${retry ? `<button class="button secondary" type="button" data-places-map-retry>${escapeHtml(t('Retry'))}</button>` : ''}`;
    status.querySelector('[data-places-map-list]')?.addEventListener('click', () =>
    {
        state.placesViewMode = 'list';
        destroyPlacesMap();
        renderPlaces();
    });
    status.querySelector('[data-places-map-retry]')?.addEventListener('click', () =>
    {
        const places = [...(placesMapRuntime.currentPlaces || [])];
        destroyPlacesMap();
        requestAnimationFrame(() => mountPlacesMap(places));
    });
}

function placesMapReady()
{
    return placesMapRuntime.status === 'ready' && Boolean(placesMapRuntime.map);
}

function resolvePlacesMapWaiters(ready)
{
    const waiters = placesMapRuntime.readyWaiters.splice(0);
    waiters.forEach(resolve => resolve(ready));
}

function waitForPlacesMapReady()
{
    if (placesMapReady()) return Promise.resolve(true);
    if (placesMapRuntime.status === 'unavailable') return Promise.resolve(false);
    return new Promise(resolve =>
    {
        placesMapRuntime.readyWaiters.push(resolve);
    });
}

function failPlacesMap(message)
{
    const previousPlaces = [...(placesMapRuntime.currentPlaces || [])];
    if (placesMapRuntime.mode !== 'browse')
    {
        cancelPlacesMapEditing();
    }
    destroyPlacesMap();
    placesMapRuntime.currentPlaces = previousPlaces;
    placesMapRuntime.status = 'unavailable';
    placesMapRuntime.tilesAvailable = false;
    resolvePlacesMapWaiters(false);
    setPlacesMapStatus('Interactive map unavailable', message, {
        retry: placesMapAdapter.supportedProtocol(),
        list: true
    });
}

function createPlaceMarkerHtml(selected)
{
    return '<span class="map-place-marker'
        + (selected ? ' selected' : '')
        + '" aria-hidden="true"></span>';
}

function createPlaceDraftMarkerHtml()
{
    return '<span class="map-place-marker draft" aria-hidden="true"></span>';
}

function formatMapCoordinatePair(latLng)
{
    return latLng && validLatitude(latLng.lat) && validLongitude(latLng.lng)
        ? `${Number(latLng.lat).toFixed(5)}, ${Number(latLng.lng).toFixed(5)}`
        : 'No point selected';
}

function removePlacesDraftArea()
{
    if (placesMapRuntime.draftRadiusMarker) placesMapRuntime.draftRadiusMarker.remove();
    placesMapRuntime.draftRadiusMarker = null;
    placesMapAdapter.removeArea(placesMapRuntime.map, 'draft');
}

function removePlacesDraftMarker()
{
    removePlacesDraftArea();
    if (placesMapRuntime.draftMarker) placesMapRuntime.draftMarker.remove();
    placesMapRuntime.draftMarker = null;
    placesMapRuntime.pendingLatLng = null;
}

function updatePlacesDraftRadiusFromMarker(point)
{
    const draft = placeEditorDraft;
    const center = placesMapRuntime.pendingLatLng;
    if (!draft || draft.locationMode !== 'approximate' || !center) return;
    const distance = placeDistanceMeters(center, point);
    if (!Number.isFinite(distance)) return;
    const radius = Math.round(Math.min(PLACE_MAX_APPROXIMATE_RADIUS_METERS,
        Math.max(1, distance)));
    draft.approximateRadiusMeters = radius;
    draft.radiusText = String(Number((radius / 1000).toFixed(3)));
    updatePlaceEditorDraftDirty(draft);
    const input = main.querySelector('#placesMapRadiusInput');
    if (input) input.value = draft.radiusText;
    renderPlacesDraftArea({ moveHandle: false });
    updatePlacesMapToolControls();
}

function renderPlacesDraftArea({ moveHandle = true } = {})
{
    if (!placesMapReady()) return;
    const center = placesMapRuntime.pendingLatLng;
    const draft = placeEditorDraft;
    if (!center || !draft || draft.locationMode !== 'approximate'
        || !validPlaceRadiusMeters(draft.approximateRadiusMeters))
    {
        removePlacesDraftArea();
        return;
    }
    const colors = getComputedStyle(document.documentElement);
    const accent = colors.getPropertyValue('--gg-status-warning-accent').trim();
    placesMapAdapter.setArea(
        placesMapRuntime.map, 'draft',
        placeRadiusGeoJson(center, draft.approximateRadiusMeters),
        { fillColor: accent, outlineColor: accent, fillOpacity: 0.23 }
    );
    const edge = placeRadiusEdgePoint(center, draft.approximateRadiusMeters, 90);
    if (!placesMapRuntime.draftRadiusMarker)
    {
        placesMapRuntime.draftRadiusMarker = placesMapAdapter.createMarker(
            placesMapRuntime.map, [edge.lat, edge.lng],
            {
                className: 'places-radius-handle',
                html: '<span class="places-radius-handle-dot" aria-hidden="true"></span>',
                title: t('Drag or use arrow keys to resize approximate radius'),
                anchor: 'center',
                draggable: true,
                onDrag: updatePlacesDraftRadiusFromMarker
            }
        );
    }
    else if (moveHandle)
    {
        placesMapRuntime.draftRadiusMarker.setLngLat([edge.lng, edge.lat]);
    }
}

function createPlacesDraftMarker(latLng)
{
    if (!placesMapReady() || !latLng) return null;
    removePlacesDraftMarker();
    const marker = placesMapAdapter.createMarker(
        placesMapRuntime.map,
        latLng,
        {
            className: 'places-map-marker-icon draft',
            html: createPlaceDraftMarkerHtml(),
            title: t('Draft place position'),
            draggable: true,
            onDrag: coordinates => updatePlacesDraftCoordinates(coordinates, { moveMarker: false })
        }
    );
    placesMapRuntime.draftMarker = marker;
    placesMapRuntime.pendingLatLng = placesMapAdapter.fromLngLat(marker.getLngLat());
    return marker;
}

function updatePlacesDraftCoordinates(latLng, { moveMarker = true } = {})
{
    if (!latLng || !validLatitude(latLng.lat) || !validLongitude(latLng.lng)) return;
    const normalized = { lat: Number(latLng.lat), lng: Number(latLng.lng) };
    if (!placesMapRuntime.draftMarker) createPlacesDraftMarker(normalized);
    else if (moveMarker)
    {
        placesMapRuntime.draftMarker.setLngLat([normalized.lng, normalized.lat]);
    }
    placesMapRuntime.pendingLatLng = normalized;
    renderPlacesDraftArea();
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

function setPlacesMapLocationMode(mode)
{
    const draft = placeEditorDraft;
    if (!draft || !['add', 'move'].includes(placesMapRuntime.mode)
        || !['exact', 'approximate'].includes(mode)) return;
    draft.locationMode = mode;
    const radius = readPlaceEditorRadiusState(draft.radiusText);
    draft.approximateRadiusMeters = mode === 'approximate' && radius.valid
        ? radius.meters : null;
    updatePlaceEditorDraftDirty(draft);
    renderPlacesDraftArea();
    updatePlacesMapToolControls();
}

function setPlacesMapRadius(text)
{
    const draft = placeEditorDraft;
    if (!draft || draft.locationMode !== 'approximate') return;
    draft.radiusText = String(text ?? '');
    const radius = readPlaceEditorRadiusState(draft.radiusText);
    draft.approximateRadiusMeters = radius.valid ? radius.meters : null;
    updatePlaceEditorDraftDirty(draft);
    renderPlacesDraftArea();
    updatePlacesMapToolControls();
}

function syncPlacesMapAccuracyControls()
{
    const draft = placeEditorDraft;
    if (!draft) return;
    main.querySelectorAll('[name="placesMapLocationMode"]').forEach(input =>
    {
        input.checked = input.value === draft.locationMode;
    });
    const input = main.querySelector('#placesMapRadiusInput');
    if (input) input.value = draft.radiusText || '';
    updatePlacesMapToolControls();
}

function updatePlacesMapToolControls()
{
    const pendingValid =
        placesPendingCoordinatesValid();

    const centerSelected = main.querySelector('[data-map-fit]');
    if (centerSelected)
    {
        centerSelected.disabled = !placesMapReady()
            || !placeHasCoordinates(getPlace(state.selectedPlaceId));
    }

    const draft = placeEditorDraft;
    const approximate = draft?.locationMode === 'approximate';
    const radiusState = readPlaceEditorRadiusState(draft?.radiusText);
    const validRadius = !approximate || radiusState.valid;
    const radiusInput = main.querySelector('#placesMapRadiusInput');
    const radiusField = main.querySelector('[data-places-map-radius-field]');
    const radiusError = main.querySelector('#placesMapRadiusError');
    if (radiusField) radiusField.hidden = !approximate;
    main.querySelectorAll('[name="placesMapLocationMode"]').forEach(input =>
    {
        input.checked = input.value === (draft?.locationMode || 'exact');
    });
    if (radiusInput)
    {
        const invalid = approximate && !radiusState.valid;
        radiusInput.setAttribute('aria-invalid', String(invalid));
        if (radiusError)
        {
            const showError = invalid && Boolean(String(draft?.radiusText || '').trim());
            radiusError.hidden = !showError;
            radiusError.textContent = showError ? t(radiusState.message) : '';
        }
    }

    const centerButton = main.querySelector('#placesUseMapCentre');
    if (centerButton) centerButton.disabled = !placesMapReady();

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
            !pendingValid || !validRadius;

        confirmButton.textContent = t('Use position');
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
    if (output) output.textContent = t('No point selected');
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
        if (session.locationMode)
        {
            draft.locationMode = session.locationMode;
            draft.radiusText = session.radiusText;
            draft.approximateRadiusMeters = session.approximateRadiusMeters;
        }
    }
    if (session?.returnToModal && reopenEditor)
    {
        restorePlaceEditorReviewContext(draft);
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
    syncPlacesMapAccuracyControls();

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
            coordinateText: { ...placeEditorDraft.coordinateText },
            locationMode: placeEditorDraft.locationMode,
            radiusText: placeEditorDraft.radiusText,
            approximateRadiusMeters: placeEditorDraft.approximateRadiusMeters
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
    syncPlacesMapAccuracyControls();

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
    if (!placesPendingCoordinatesValid()
        || (placeEditorDraft?.locationMode === 'approximate'
            && !validPlaceRadiusMeters(placeEditorDraft.approximateRadiusMeters))) return;
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
    if (draft.locationMode !== 'approximate') draft.approximateRadiusMeters = null;
    draft.mapSession = null;
    draft.duplicateOverride = false;
    draft.dismissedDuplicateId = null;
    draft.disclosures.coordinates = true;
    updatePlaceEditorDraftDirty(draft);
    resetPlacesMapEditingUi();
    restorePlaceEditorReviewContext(draft);
    openPlaceModal(draft.placeId, { draft });
}

function handlePlacesMapClick(event)
{
    if (!['add', 'move'].includes(placesMapRuntime.mode)) return;
    updatePlacesDraftCoordinates(event.latlng);
}

