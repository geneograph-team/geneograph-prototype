function openPlacesMapContextMenu(event)
{
    if (!placesMapRuntime.map)
    {
        return;
    }
    closeMenu();
    const point = event.originalEvent;
    const selected = getPlace(state.selectedPlaceId);
    const menu = document.createElement('div');
    menu.className = 'menu-popover';
    menu.id = 'projectMenu';
    menu.style.left = `${Math.min(window.innerWidth - 230, Math.max(12, point.clientX))}px`;
    menu.style.top = `${Math.min(window.innerHeight - 210, Math.max(12, point.clientY))}px`;
    menu.innerHTML = `<button type="button" data-action="add">Add place here</button><button type="button" data-action="move" ${selected ? '' : 'disabled'}>Move selected place here</button><button type="button" data-action="copy">Copy coordinates</button><button type="button" data-action="centre">Centre map here</button>`;
    document.body.appendChild(menu);
    menu.addEventListener('click', clickEvent =>
    {
        const action = clickEvent.target.closest('[data-action]')?.dataset.action;
        if (!action) return;
        if (action === 'add')
        {
            enterPlacesMapAddMode(); updatePlacesDraftCoordinates(event.latlng);
        }
        if (action === 'move')
        {
            enterPlacesMapMoveMode(selected.id); updatePlacesDraftCoordinates(event.latlng);
        }
        if (action === 'copy') navigator.clipboard?.writeText(formatMapCoordinatePair(event.latlng));
        if (action === 'centre') placesMapRuntime.map?.panTo(event.latlng);
        closeMenu();
    });
    bindMenuLifecycle();
}

function createPlaceLeafletMarker(place)
{
    const latLng = placeLatLng(place);
    if (!latLng || !window.L) return null;
    const marker = L.marker(latLng, {
        icon: createPlaceMarkerIcon(place, place.id === state.selectedPlaceId),
        keyboard: true,
        title: place.name,
        alt: place.name,
        riseOnHover: true
    });
    marker.placeId = place.id;
    marker.bindTooltip(escapeHtml(place.name), { direction: 'top', offset: [0, -12] });
    marker.on('click', () => selectPlace(place.id, { source: 'map', focusMap: false }));
    marker.on('add', () => bindPlaceMarkerElement(marker, place));
    return marker;
}

function bindPlaceMarkerElement(marker, place)
{
    const markerElement = marker?.getElement();
    if (!markerElement || markerElement.dataset.placeMarkerBound === 'true') return;
    markerElement.dataset.placeMarkerBound = 'true';
    markerElement.setAttribute('aria-label', `Select ${place.name}`);
    markerElement.addEventListener('click', event =>
    {
        event.stopPropagation();
        selectPlace(place.id, { source: 'map', focusMap: false });
    }, { capture: true });
    markerElement.addEventListener('keydown', event =>
    {
        if (!['Enter', ' '].includes(event.key)) return;
        event.preventDefault();
        event.stopPropagation();
        selectPlace(place.id, { source: 'map', focusMap: false });
    });
}

function capturePlacesMapView()
{
    const map = placesMapRuntime.map;
    if (!map || placesMapRuntime.suppressViewCapture) return;
    const center = map.getCenter();
    state.placesMapView.center = { lat: center.lat, lng: center.lng };
    state.placesMapView.zoom = map.getZoom();
    state.placesMapView.userMoved = true;
}

function restorePlacesMapView(places)
{
    const map = placesMapRuntime.map;
    if (!map) return;
    const view = state.placesMapView;
    placesMapRuntime.suppressViewCapture = true;
    if (view?.center && validLatitude(view.center.lat) && validLongitude(view.center.lng))
    {
        map.setView([view.center.lat, view.center.lng], Number.isFinite(view.zoom) ? view.zoom : PLACES_MAP_CONFIG.defaultZoom, { animate: false });
    }
    else
    {
        fitPlacesMap(places, { markUserMoved: false });
    }
    requestAnimationFrame(() =>
    {
        placesMapRuntime.suppressViewCapture = false;
    });
}

function destroyPlacesMap()
{
    clearTimeout(placesSearchTimer);
    removePlacesDraftMarker();
    if (placesMapRuntime.resizeObserver) placesMapRuntime.resizeObserver.disconnect();
    placesMapRuntime.resizeObserver = null;
    if (placesMapRuntime.tileLayer) placesMapRuntime.tileLayer.off();
    if (placesMapRuntime.map)
    {
        placesMapRuntime.map.off();
        placesMapRuntime.map.remove();
    }
    placesMapRuntime.map = null;
    placesMapRuntime.host = null;
    placesMapRuntime.tileLayer = null;
    placesMapRuntime.markerLayer = null;
    placesMapRuntime.routeLayer = null;
    placesMapRuntime.markersById.clear();
    placesMapRuntime.tileErrorCount = 0;
    placesMapRuntime.tilesAvailable = false;
    placesMapRuntime.mode = 'browse';
    placesMapRuntime.editingPlaceId = null;
    placesMapRuntime.mountedListKey = '';
    placesMapRuntime.currentPlaces = [];
    placesMapRuntime.suppressViewCapture = false;
}

function mountPlacesMap(places)
{
    const host = document.getElementById('placesLeafletMap');
    if (!host || state.activeModule !== 'Places' || state.placesViewMode === 'list') return;
    if (!window.L)
    {
        setPlacesMapStatus('Map library unavailable', 'Leaflet could not be loaded. The place list and editor remain available.', { retry: true, list: true });
        return;
    }
    if (placesMapRuntime.map && placesMapRuntime.host === host)
    {
        updatePlacesMapData(places);
        return;
    }
    destroyPlacesMap();
    placesMapRuntime.host = host;
    placesMapRuntime.currentPlaces = [...(places || [])];
    placesMapRuntime.map = L.map(host, {
        zoomControl: false,
        attributionControl: true,
        minZoom: PLACES_MAP_CONFIG.minZoom,
        maxZoom: PLACES_MAP_CONFIG.maxZoom,
        preferCanvas: false
    });
    placesMapRuntime.map.attributionControl.setPrefix('<a href="" target="_blank" rel="noopener noreferrer">Leaflet</a>');
    placesMapRuntime.markerLayer = L.featureGroup().addTo(placesMapRuntime.map);
    placesMapRuntime.tileLayer = createPlacesTileLayer();
    if (placesMapRuntime.tileLayer)
    {
        placesMapRuntime.tileLayer.addTo(placesMapRuntime.map);
    }
    else
    {
        setPlacesMapStatus('Map configuration required', 'Add a protected MapTiler browser key to window.GENEOGRAPH_CONFIG.maptilerKey.', { retry: true });
    }
    placesMapRuntime.map.on('moveend zoomend', capturePlacesMapView);
    placesMapRuntime.map.on(
        'click',
        handlePlacesMapClick
    );
    placesMapRuntime.map.on('contextmenu', openPlacesMapContextMenu);
    placesMapRuntime.resizeObserver = new ResizeObserver(() =>
    {
        placesMapRuntime.map?.invalidateSize({ pan: false, debounceMoveend: true });
    });
    placesMapRuntime.resizeObserver.observe(host.parentElement || host);
    updatePlacesMapData(places, { force: true });
    restorePlacesMapView(places);
    updatePlacesMapToolControls();
}

function updatePlacesMapData(places, { force = false } = {})
{
    const map = placesMapRuntime.map;
    const markerLayer = placesMapRuntime.markerLayer;
    if (!map || !markerLayer) return;
    const list = (places || []).filter(place => !place.deleted);
    const key = placesMapDataKey(list);
    placesMapRuntime.currentPlaces = [...list];
    if (!force && key === placesMapRuntime.mountedListKey)
    {
        updatePlacesMapSelection(state.selectedPlaceId);
        renderPlacesRouteLayer();
        return;
    }
    markerLayer.clearLayers();
    placesMapRuntime.markersById.clear();
    list.filter(placeHasCoordinates).forEach(place =>
    {
        const marker = createPlaceLeafletMarker(place);
        if (!marker) return;
        marker.addTo(markerLayer);
        bindPlaceMarkerElement(marker, place);
        placesMapRuntime.markersById.set(place.id, marker);
    });
    placesMapRuntime.mountedListKey = key;
    updatePlacesMapSelection(state.selectedPlaceId);
    renderPlacesRouteLayer();
    updatePlacesRouteControl();
    updatePlacesMapToolControls();
}

function updatePlacesMapSelection(placeId, { focusMap = false } = {})
{
    placesMapRuntime.markersById.forEach((marker, id) =>
    {
        const place = getPlace(id);
        if (place) marker.setIcon(createPlaceMarkerIcon(place, id === placeId));
    });
    const place = getPlace(placeId);
    if (focusMap && placeHasCoordinates(place) && placesMapRuntime.map)
    {
        const padding = placesMapPadding();
        placesMapRuntime.map.panInside(placeLatLng(place), {
            paddingTopLeft: padding.topLeft,
            paddingBottomRight: padding.bottomRight
        });
    }
}

function placesMapPadding()
{
    const width = placesMapRuntime.host?.clientWidth || 900;
    const height = placesMapRuntime.host?.clientHeight || 600;
    return {
        topLeft: [Math.round(Math.min(420, Math.max(48, width * 0.34))), Math.round(Math.min(80, Math.max(32, height * 0.1)))],
        bottomRight: [Math.round(Math.min(240, Math.max(36, width * 0.12))), Math.round(Math.min(100, Math.max(40, height * 0.12)))]
    };
}

function getProjectRouteSurnames(projectId = currentProjectId())
{
    const counts = new Map();
    getPeople(projectId)
        .filter(person => person && !person.deleted)
        .forEach(person =>
        {
            const surname = String(person?.names?.last || '').trim();
            if (surname) counts.set(surname, (counts.get(surname) || 0) + 1);
        });
    return [...counts.entries()]
        .map(([surname, count]) => ({ surname, count }))
        .sort((a, b) => a.surname.localeCompare(b.surname, undefined, { sensitivity: 'base' }));
}

function getPersonRouteEvents(personId)
{
    const person = getPerson(personId);
    if (!person || person.deleted || person.projectId !== currentProjectId()) return [];
    return (sampleData.events || []).filter(event =>
        event?.projectId === person.projectId
        && Array.isArray(event.personIds)
        && event.personIds.includes(person.id)
    );
}

function getSurnameRoutePeople(surname)
{
    const expected = String(surname || '').trim();
    if (!expected) return [];
    return getPeople(currentProjectId()).filter(person =>
        person && !person.deleted && String(person?.names?.last || '').trim() === expected
    );
}

function getSurnameRouteEvents(surname)
{
    const personIds = new Set(getSurnameRoutePeople(surname).map(person => person.id));
    const events = new Map();
    (sampleData.events || []).forEach(event =>
    {
        if (event?.projectId !== currentProjectId()) return;
        if (!(event.personIds || []).some(personId => personIds.has(personId))) return;
        if (event.id && !events.has(event.id)) events.set(event.id, event);
    });
    return [...events.values()];
}

function normalizeRouteEvent(event)
{
    const date = normalizeGenealogyDateInput(event || {});
    const sortValue = genealogyDateSortValue(date);
    const place = getPlace(event?.placeId);
    const placeIsValid = Boolean(place && !place.deleted && place.projectId === currentProjectId());
    const coordinates = placeIsValid ? placeLatLng(place) : null;
    const hasSortableDate = Number.isFinite(sortValue);
    const hasCoordinates = Boolean(
        coordinates && validLatitude(coordinates[0]) && validLongitude(coordinates[1])
    );
    const exclusionReason = !hasSortableDate
        ? date.state === 'known' ? 'missingYear' : 'missingDate'
        : !placeIsValid
            ? 'missingPlace'
            : !hasCoordinates
                ? 'missingCoordinates'
                : '';
    return {
        event,
        eventId: String(event?.id || ''),
        personIds: [...new Set((event?.personIds || []).filter(Boolean))],
        place,
        placeId: place?.id || '',
        coordinates,
        date,
        dateLabel: formatGenealogyDateLabel(date),
        sortValue,
        hasSortableDate,
        exclusionReason,
        eligible: Boolean(hasSortableDate && placeIsValid && hasCoordinates)
    };
}

function sortRouteEvents(events)
{
    return (events || [])
        .map((event, index) => ({ ...event, originalIndex: index }))
        .sort((a, b) => a.sortValue - b.sortValue || a.originalIndex - b.originalIndex);
}

function routeStopDateLabel(stop)
{
    const first = stop?.events?.[0]?.dateLabel || '';
    const last = stop?.events?.[stop.events.length - 1]?.dateLabel || '';
    if (first && last && first !== last) return `${first} - ${last}`;
    return first || last || t('Date unknown');
}

function collapseConsecutiveRouteStops(events)
{
    const stops = [];
    (events || []).forEach(item =>
    {
        const previous = stops[stops.length - 1];
        if (previous && !item.breakBefore && previous.placeId === item.placeId)
        {
            previous.events.push(item);
            previous.eventIds = [...new Set([...previous.eventIds, item.eventId].filter(Boolean))];
            previous.personIds = [...new Set([...previous.personIds, ...item.personIds])];
            previous.lastSortValue = item.sortValue;
            previous.dateLabel = routeStopDateLabel(previous);
            return;
        }
        stops.push({
            place: item.place,
            placeId: item.placeId,
            coordinates: item.coordinates,
            events: [item],
            eventIds: item.eventId ? [item.eventId] : [],
            personIds: [...item.personIds],
            firstSortValue: item.sortValue,
            lastSortValue: item.sortValue,
            breakBefore: Boolean(item.breakBefore),
            dateLabel: item.dateLabel || t('Date unknown')
        });
    });
    return stops.map((stop, index) => ({ ...stop, sequence: index + 1 }));
}

function derivePlacesRoute(selection = {})
{
    const mode = ['person', 'surname'].includes(selection.mode) ? selection.mode : 'none';
    const person = mode === 'person' ? getPerson(selection.personId) : null;
    const surname = mode === 'surname' ? String(selection.surname || '').trim() : '';
    const people = mode === 'surname' ? getSurnameRoutePeople(surname) : (person ? [person] : []);
    const validSubject = mode === 'person'
        ? Boolean(person && !person.deleted && person.projectId === currentProjectId())
        : Boolean(surname && people.length);
    const sourceEvents = validSubject
        ? (mode === 'person' ? getPersonRouteEvents(person.id) : getSurnameRouteEvents(surname))
        : [];
    const normalized = sortRouteEvents(sourceEvents.map(normalizeRouteEvent));
    let breakBefore = false;
    const eligible = [];
    normalized.forEach(item =>
    {
        if (!item.eligible)
        {
            if (item.hasSortableDate) breakBefore = true;
            return;
        }
        eligible.push({ ...item, breakBefore });
        breakBefore = false;
    });
    const stops = collapseConsecutiveRouteStops(eligible);
    const distinctPositions = new Set(stops.map(stop =>
        `${Number(stop.coordinates[0]).toFixed(6)},${Number(stop.coordinates[1]).toFixed(6)}`
    ));
    const excludedByReason = normalized.reduce((counts, item) =>
    {
        if (item.eligible || !item.exclusionReason) return counts;
        counts[item.exclusionReason] += 1;
        return counts;
    }, { missingDate: 0, missingYear: 0, missingPlace: 0, missingCoordinates: 0 });
    const available = stops.length >= 2 && distinctPositions.size >= 2;
    const firstDate = stops[0]?.events?.[0]?.dateLabel || '';
    const finalStop = stops[stops.length - 1];
    const lastDate = finalStop?.events?.[finalStop.events.length - 1]?.dateLabel || '';
    return {
        mode,
        configured: validSubject,
        subject: mode === 'person' ? (person?.names?.display || person?.name || '') : surname,
        personId: person?.id || '',
        surname,
        people,
        peopleCount: people.length,
        sourceEventCount: sourceEvents.length,
        excludedCount: normalized.filter(item => !item.eligible).length,
        excludedByReason,
        stops,
        distinctPlaceCount: distinctPositions.size,
        available,
        dateSpan: firstDate && lastDate && firstDate !== lastDate
            ? `${firstDate} - ${lastDate}`
            : firstDate || lastDate || ''
    };
}

function derivePlacesRouteSegments(route)
{
    const segments = [];
    (route?.stops || []).forEach(stop =>
    {
        if (!segments.length || stop.breakBefore) segments.push([]);
        segments[segments.length - 1].push(stop);
    });
    return segments;
}

function currentPlacesRouteSelection()
{
    return {
        mode: state.placesRouteMode,
        personId: state.placesRoutePersonId,
        surname: state.placesRouteSurname
    };
}

function currentPlacesRoute()
{
    return derivePlacesRoute(currentPlacesRouteSelection());
}

function normalizePlacesRouteSelection()
{
    const route = currentPlacesRoute();
    if (state.placesRouteMode !== 'none' && !route.configured)
    {
        clearPlacesRoute();
        return derivePlacesRoute({ mode: 'none' });
    }
    return route;
}

function clearPlacesRoute()
{
    state.placesRouteMode = 'none';
    state.placesRoutePersonId = '';
    state.placesRouteSurname = '';
    state.placesShowRoute = false;
}

function createPlacesRouteStopIcon(stop, totalStops)
{
    const isStart = stop.sequence === 1;
    const isEnd = stop.sequence === totalStops;
    return L.divIcon({
        className: 'places-route-marker-icon',
        html: `<span class="places-route-marker ${isStart ? 'is-start' : ''} ${isEnd ? 'is-end' : ''}" aria-hidden="true"><span>${stop.sequence}</span></span>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
    });
}

function renderPlacesRouteLayer()
{
    const map = placesMapRuntime.map;
    if (!map || !window.L) return;
    if (placesMapRuntime.routeLayer)
    {
        placesMapRuntime.routeLayer.remove();
        placesMapRuntime.routeLayer = null;
    }
    const route = normalizePlacesRouteSelection();
    if (!state.placesShowRoute || !route.available) return;
    const layer = L.layerGroup().addTo(map);
    const routeColor = getComputedStyle(document.documentElement).getPropertyValue('--gg-primary').trim();
    derivePlacesRouteSegments(route).forEach(segment =>
    {
        if (segment.length < 2) return;
        L.polyline(segment.map(stop => stop.coordinates), {
            className: 'places-leaflet-route',
            color: routeColor,
            weight: 3,
            opacity: 0.78,
            dashArray: '9 8'
        }).addTo(layer);
    });
    route.stops.forEach(stop =>
    {
        const eventContext = stop.events
            .map(item => item.event?.title || item.event?.type || t('Event'))
            .join(', ');
        const accessibleName = `${stop.sequence} of ${route.stops.length}: ${stop.place.name}; ${stop.dateLabel}; ${route.subject}; ${eventContext}`;
        const marker = L.marker(stop.coordinates, {
            icon: createPlacesRouteStopIcon(stop, route.stops.length),
            keyboard: true,
            title: accessibleName,
            alt: accessibleName,
            riseOnHover: true,
            zIndexOffset: 600
        }).addTo(layer);
        marker.bindTooltip(`
          <strong>${stop.sequence}. ${escapeHtml(stop.place.name)}</strong><br>
          ${escapeHtml(stop.dateLabel)}${eventContext ? `<br>${escapeHtml(eventContext)}` : ''}
        `, { direction: 'top', offset: [0, -14], opacity: 0.96 });
        marker.on('click', () => selectPlace(stop.placeId, { focusMap: false }));
    });
    placesMapRuntime.routeLayer = layer;
}

function updatePlacesRouteControl()
{
    const button = document.getElementById('placesRouteMenu');
    if (!button) return;
    const route = normalizePlacesRouteSelection();
    const active = Boolean(state.placesShowRoute && route.configured);
    button.classList.toggle('active', active);
    button.setAttribute('aria-label', route.configured
        ? `${t('Route settings')}: ${route.subject}; ${t(route.available ? 'Active' : 'Needs attention')}`
        : t('Route settings'));
    button.title = route.configured
        ? `${route.subject} - ${t(route.available ? 'Active' : 'Needs attention')}`
        : t('Route settings');
}

function fitPlacesMap(places = placesMapRuntime.currentPlaces || [], { markUserMoved = true } = {})
{
    const map = placesMapRuntime.map;
    if (!map) return;
    const points = (places || []).filter(placeHasCoordinates);
    const padding = placesMapPadding();
    placesMapRuntime.suppressViewCapture = !markUserMoved;
    if (points.length > 1)
    {
        map.fitBounds(L.latLngBounds(points.map(placeLatLng)), {
            paddingTopLeft: padding.topLeft,
            paddingBottomRight: padding.bottomRight,
            maxZoom: PLACES_MAP_CONFIG.fitMaxZoom,
            animate: false
        });
    }
    else if (points.length === 1)
    {
        map.setView(placeLatLng(points[0]), Math.min(11, PLACES_MAP_CONFIG.fitMaxZoom), { animate: false });
    }
    else
    {
        map.setView([PLACES_MAP_CONFIG.defaultCenter.lat, PLACES_MAP_CONFIG.defaultCenter.lng], PLACES_MAP_CONFIG.defaultZoom, { animate: false });
        setPlacesMapStatus('No mapped places', 'Add coordinates to a place to show it on the map.');
    }
    state.placesMapView.lastFitKey = placesMapDataKey(points);
    state.placesMapView.userMoved = markUserMoved;
    requestAnimationFrame(() =>
    {
        placesMapRuntime.suppressViewCapture = false;
    });
}

function bindPlacesMapEditingControls()
{
    main
        .querySelector(
            '#placesMapInfoToggle'
        )
        ?.addEventListener(
            'click',
            event =>
            {
                state.placesMapInfoExpanded =
                    !state.placesMapInfoExpanded;

                const panel =
                    main.querySelector(
                        '#placesMapInfoPanel'
                    );

                if (panel)
                {
                    panel.hidden =
                        !state.placesMapInfoExpanded;
                }

                event.currentTarget
                    .setAttribute(
                        'aria-expanded',
                        String(
                            state.placesMapInfoExpanded
                        )
                    );

                event.currentTarget
                    .classList
                    .toggle(
                        'active',
                        state.placesMapInfoExpanded
                    );
            }
        );

    main
        .querySelector(
            '#placesUseMapCentre'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                const center =
                    placesMapRuntime
                        .map
                        ?.getCenter();

                if (center)
                {
                    updatePlacesDraftCoordinates(
                        center
                    );
                }
            }
        );

    main
        .querySelector(
            '#placesCopyCoordinates'
        )
        ?.addEventListener(
            'click',
            async () =>
            {
                const pending =
                    placesMapRuntime
                        .pendingLatLng;

                if (!pending)
                {
                    return;
                }

                const text =
                    formatMapCoordinatePair(
                        pending
                    );

                try
                {
                    await navigator
                        .clipboard
                        .writeText(text);

                    showToast(
                        'Coordinates copied.'
                    );
                }
                catch
                {
                    showToast(text);
                }
            }
        );

    main
        .querySelector(
            '#placesCancelMapEdit'
        )
        ?.addEventListener(
            'click',
            cancelPlacesMapEditing
        );

    main
        .querySelector(
            '#placesConfirmMapEdit'
        )
        ?.addEventListener(
            'click',
            completePlaceEditorMapSelection
        );

    updatePlacesMapToolControls();
}

