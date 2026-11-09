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
        if (action === 'centre') placesMapRuntime.map?.panTo([event.latlng.lng, event.latlng.lat], { duration: 0 });
        closeMenu();
    });
    bindMenuLifecycle();
}

function createPlaceMapMarker(place)
{
    const latLng = placeLatLng(place);
    if (!latLng || !placesMapReady()) return null;
    return placesMapAdapter.createMarker(placesMapRuntime.map, latLng, {
        className: 'places-map-marker-icon',
        html: createPlaceMarkerHtml(place.id === state.selectedPlaceId),
        title: t('Select place') + ': ' + place.name,
        selected: place.id === state.selectedPlaceId,
        onSelect: () => selectPlace(place.id, { source: 'map', focusMap: false }),
        tooltipHtml: escapeHtml(place.name)
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
    if (!placesMapReady()) return;
    const view = state.placesMapView;
    placesMapRuntime.suppressViewCapture = true;
    if (view?.center && validLatitude(view.center.lat) && validLongitude(view.center.lng))
    {
        map.jumpTo({
            center: [Number(view.center.lng), Number(view.center.lat)],
            zoom: Number.isFinite(view.zoom) ? view.zoom : PLACES_MAP_CONFIG.defaultZoom
        });
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

function destroyPlacesMap({ preserveWaiters = false } = {})
{
    ++placesMapRuntime.requestId;
    clearTimeout(placesSearchTimer);
    clearTimeout(placesMapRuntime.loadTimeout);
    placesMapRuntime.loadTimeout = null;
    removePlacesDraftMarker();
    if (placesMapRuntime.resizeObserver) placesMapRuntime.resizeObserver.disconnect();
    placesMapRuntime.resizeObserver = null;
    placesMapRuntime.markersById.forEach(marker => marker.remove());
    placesMapRuntime.markersById.clear();
    if (placesMapRuntime.routeLayer)
    {
        placesMapRuntime.routeLayer.remove();
        placesMapRuntime.routeLayer = null;
    }
    if (placesMapRuntime.map)
    {
        placesMapRuntime.map.remove();
    }
    placesMapRuntime.map = null;
    placesMapRuntime.host = null;
    placesMapRuntime.markerLayer = null;
    placesMapRuntime.errorCount = 0;
    placesMapRuntime.tilesAvailable = false;
    placesMapRuntime.status = 'idle';
    placesMapRuntime.styleLoading = false;
    placesMapRuntime.mapTheme = null;
    placesMapRuntime.mode = 'browse';
    placesMapRuntime.editingPlaceId = null;
    placesMapRuntime.mountedListKey = '';
    placesMapRuntime.currentPlaces = [];
    if (!preserveWaiters) placesMapRuntime.pendingFocusPlaceId = null;
    placesMapRuntime.suppressViewCapture = false;
    if (!preserveWaiters) resolvePlacesMapWaiters(false);
}

function mountPlacesMap(places)
{
    const host = document.getElementById('placesVectorMap');
    if (!host || state.activeModule !== 'Places' || state.placesViewMode === 'list') return;
    if (!placesMapAdapter.supportedProtocol())
    {
        failPlacesMap('Interactive maps require a hosted page. Use List view and Advanced coordinates to manage places locally.');
        return;
    }
    if (placesMapRuntime.host === host
        && placesMapRuntime.status === 'ready')
    {
        updatePlacesMapData(places);
        return;
    }
    if (placesMapRuntime.host === host
        && placesMapRuntime.status === 'loading')
    {
        placesMapRuntime.currentPlaces = [...(places || [])];
        return;
    }
    destroyPlacesMap({ preserveWaiters: true });
    placesMapRuntime.host = host;
    placesMapRuntime.currentPlaces = [...(places || [])];
    placesMapRuntime.status = 'loading';
    const requestId = placesMapRuntime.requestId;
    setPlacesMapStatus('Loading vector map', 'Connecting to OpenFreeMap…', { list: true });
    placesMapAdapter.load()
        .then(() =>
        {
            if (requestId !== placesMapRuntime.requestId
                || !host.isConnected
                || placesMapRuntime.host !== host)
            {
                return;
            }
            const theme = document.documentElement.dataset.theme === 'dark'
                ? 'dark' : 'light';
            const map = placesMapAdapter.createMap(host, theme);
            placesMapRuntime.map = map;
            placesMapRuntime.mapTheme = theme;
            map.on('click', event => handlePlacesMapClick({ latlng: event.lngLat }));
            map.on('contextmenu', event => openPlacesMapContextMenu({
                latlng: event.lngLat,
                originalEvent: event.originalEvent
            }));
            map.on('moveend', capturePlacesMapView);
            map.on('style.load', () =>
            {
                if (placesMapRuntime.map !== map) return;
                placesMapRuntime.errorCount = 0;
                // style.load fires for initial load and every setStyle().
                // Paint overrides do not replace the upstream style or the route.
                placesMapAdapter.applyDarkPalette(map, placesMapRuntime.mapTheme);
                if (placesMapReady())
                {
                    placesMapRuntime.styleLoading = false;
                    clearTimeout(placesMapRuntime.loadTimeout);
                    placesMapRuntime.loadTimeout = null;
                    renderPlacesRouteLayer();
                    setPlacesMapStatus();
                }
            });
            map.on('load', () =>
            {
                if (placesMapRuntime.map !== map
                    || requestId !== placesMapRuntime.requestId) return;
                clearTimeout(placesMapRuntime.loadTimeout);
                placesMapRuntime.loadTimeout = null;
                placesMapRuntime.status = 'ready';
                placesMapRuntime.tilesAvailable = true;
                setPlacesMapStatus();
                updatePlacesMapData(placesMapRuntime.currentPlaces, { force: true });
                restorePlacesMapView(placesMapRuntime.currentPlaces);
                const focusPlaceId = placesMapRuntime.pendingFocusPlaceId;
                if (focusPlaceId && state.selectedPlaceId === focusPlaceId)
                {
                    updatePlacesMapSelection(focusPlaceId, { focusMap: true });
                }
                else
                {
                    placesMapRuntime.pendingFocusPlaceId = null;
                }
                updatePlacesMapToolControls();
                resolvePlacesMapWaiters(true);
                const resolvedTheme = document.documentElement.dataset.theme === 'dark'
                    ? 'dark' : 'light';
                if (placesMapRuntime.mapTheme !== resolvedTheme)
                {
                    handlePlacesMapThemeChange({ detail: { theme: resolvedTheme } });
                }
            });
            map.on('idle', () =>
            {
                if (placesMapRuntime.map === map)
                {
                    placesMapRuntime.errorCount = 0;
                }
            });
            map.on('error', event =>
            {
                if (placesMapRuntime.map !== map) return;
                console.warn('GeneoGraph map resource error:', event.error);
                ++placesMapRuntime.errorCount;
                if (placesMapRuntime.errorCount >= PLACES_MAP_CONFIG.errorThreshold)
                {
                    failPlacesMap('The map could not load. Check your connection or WebGL2 support. Place editing remains available.');
                }
            });
            if (typeof ResizeObserver !== 'undefined')
            {
                placesMapRuntime.resizeObserver = new ResizeObserver(() => map.resize());
                placesMapRuntime.resizeObserver.observe(host.parentElement || host);
            }
            placesMapRuntime.loadTimeout = setTimeout(() =>
            {
                if (requestId === placesMapRuntime.requestId
                    && !placesMapReady())
                {
                    failPlacesMap('The map could not load. Check your connection or WebGL2 support. Place editing remains available.');
                }
            }, PLACES_MAP_CONFIG.loadTimeoutMs);
        })
        .catch(error =>
        {
            if (requestId !== placesMapRuntime.requestId) return;
            console.warn('GeneoGraph could not initialize MapLibre:', error);
            failPlacesMap('The map could not load. Check your connection or WebGL2 support. Place editing remains available.');
        });
}

function handlePlacesMapThemeChange(event)
{
    if (!placesMapReady()) return;
    const theme = event.detail?.theme === 'dark' ? 'dark' : 'light';
    const map = placesMapRuntime.map;
    // MapLibre does not provide a reliable public getStyleUrl method.
    // Track our requested theme to avoid reloading the style on every map load.
    if (placesMapRuntime.mapTheme === theme) return;
    const nextStyle = placesMapAdapter.styleUrl(theme);
    try
    {
        placesMapRuntime.styleLoading = true;
        setPlacesMapStatus('Loading vector map', 'Connecting to OpenFreeMap…', { list: true });
        clearTimeout(placesMapRuntime.loadTimeout);
        placesMapRuntime.loadTimeout = setTimeout(() =>
        {
            if (placesMapRuntime.map === map)
            {
                failPlacesMap('The map could not load. Check your connection or WebGL2 support. Place editing remains available.');
            }
        }, PLACES_MAP_CONFIG.loadTimeoutMs);
        placesMapRuntime.mapTheme = theme;
        map.setStyle(nextStyle);
    }
    catch (error)
    {
        console.warn('GeneoGraph map theme update failed:', error);
        failPlacesMap('The map could not load. Check your connection or WebGL2 support. Place editing remains available.');
    }
}

window.addEventListener('geneograph-theme-change', handlePlacesMapThemeChange);

function updatePlacesMapData(places, { force = false } = {})
{
    const list = (places || []).filter(place => !place.deleted);
    placesMapRuntime.currentPlaces = [...list];
    if (!placesMapReady()) return;
    const key = placesMapDataKey(list);
    if (!force && key === placesMapRuntime.mountedListKey)
    {
        updatePlacesMapSelection(state.selectedPlaceId);
        renderPlacesRouteLayer();
        return;
    }
    placesMapRuntime.markersById.forEach(marker => marker.remove());
    placesMapRuntime.markersById.clear();
    list.filter(placeHasCoordinates).forEach(place =>
    {
        const marker = createPlaceMapMarker(place);
        if (marker) placesMapRuntime.markersById.set(place.id, marker);
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
        placesMapAdapter.updateSelection(marker, id === placeId);
    });
    const place = getPlace(placeId);
    if (!focusMap && placesMapRuntime.pendingFocusPlaceId !== placeId)
    {
        // A newer selection supersedes an earlier queued navigation.
        placesMapRuntime.pendingFocusPlaceId = null;
    }
    if (focusMap && placeHasCoordinates(place))
    {
        // MapLibre initializes asynchronously; do not lose explicit focus.
        placesMapRuntime.pendingFocusPlaceId = place.id;
        if (placesMapReady())
        {
            placesMapAdapter.focusPoint(
                placesMapRuntime.map, placeLatLng(place), placesMapPadding()
            );
            // Keep explicit navigation after a map shell re-render, even if
            // restorePlacesMapView temporarily suppresses moveend capture.
            const center = placesMapRuntime.map.getCenter();
            state.placesMapView.center = { lat: center.lat, lng: center.lng };
            state.placesMapView.zoom = placesMapRuntime.map.getZoom();
            state.placesMapView.userMoved = true;
            placesMapRuntime.pendingFocusPlaceId = null;
        }
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

function createPlacesRouteStopHtml(stop, totalStops)
{
    const isStart = stop.sequence === 1;
    const isEnd = stop.sequence === totalStops;
    return '<span class="places-route-marker'
        + (isStart ? ' is-start' : '')
        + (isEnd ? ' is-end' : '')
        + '" aria-hidden="true"><span>' + stop.sequence + '</span></span>';
}

function renderPlacesRouteLayer()
{
    if (!placesMapReady() || placesMapRuntime.styleLoading) return;
    const map = placesMapRuntime.map;
    if (placesMapRuntime.routeLayer)
    {
        placesMapRuntime.routeLayer.remove();
        placesMapRuntime.routeLayer = null;
    }
    placesMapAdapter.clearLineSegments(map);
    const route = normalizePlacesRouteSelection();
    if (!state.placesShowRoute || !route.available) return;
    const color = getComputedStyle(document.documentElement)
        .getPropertyValue('--gg-primary').trim();
    placesMapAdapter.setLineSegments(
        map,
        derivePlacesRouteSegments(route).map(segment =>
            segment.map(stop => stop.coordinates)
        ),
        color
    );
    const markers = [];
    route.stops.forEach(stop =>
    {
        const eventContext = stop.events
            .map(item => item.event?.title || item.event?.type || t('Event'))
            .join(', ');
        const name = stop.sequence + ' of ' + route.stops.length + ': '
            + stop.place.name + '; ' + stop.dateLabel + '; '
            + route.subject + '; ' + eventContext;
        const tooltip = '<strong>' + stop.sequence + '. '
            + escapeHtml(stop.place.name) + '</strong><br>'
            + escapeHtml(stop.dateLabel)
            + (eventContext ? '<br>' + escapeHtml(eventContext) : '');
        markers.push(placesMapAdapter.createMarker(map, stop.coordinates, {
            className: 'places-route-marker-icon',
            html: createPlacesRouteStopHtml(stop, route.stops.length),
            title: name,
            anchor: 'center',
            tooltipHtml: tooltip,
            onSelect: () => selectPlace(stop.placeId, { focusMap: false })
        }));
    });
    placesMapRuntime.routeLayer = {
        remove()
        {
            markers.forEach(marker => marker.remove());
            placesMapAdapter.clearLineSegments(map);
        }
    };
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
    if (!placesMapReady()) return;
    const map = placesMapRuntime.map;
    const points = (places || []).filter(placeHasCoordinates);
    const padding = placesMapPadding();
    placesMapRuntime.suppressViewCapture = !markUserMoved;
    if (points.length > 1)
    {
        placesMapAdapter.fitPoints(
            map, points.map(placeLatLng), padding, PLACES_MAP_CONFIG.fitMaxZoom
        );
    }
    else if (points.length === 1)
    {
        map.jumpTo({
            center: placesMapAdapter.toLngLat(placeLatLng(points[0])),
            zoom: Math.min(11, PLACES_MAP_CONFIG.fitMaxZoom)
        });
    }
    else
    {
        map.jumpTo({
            center: [PLACES_MAP_CONFIG.defaultCenter.lng, PLACES_MAP_CONFIG.defaultCenter.lat],
            zoom: PLACES_MAP_CONFIG.defaultZoom
        });
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

