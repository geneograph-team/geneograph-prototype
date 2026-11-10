/*
 * Renderer boundary for Places. No place-record or route derivation logic here.
 * MapLibre is imported only when a hosted Places map is requested.
 */
const placesMapAdapter = (function ()
{
    let libraryPromise = null;
    let library = null;

    function toLngLat(point)
    {
        if (Array.isArray(point)) return [Number(point[1]), Number(point[0])];
        return [Number(point.lng), Number(point.lat)];
    }

    function fromLngLat(point)
    {
        return { lat: Number(point.lat), lng: Number(point.lng) };
    }

    function supportedProtocol()
    {
        return window.location.protocol === 'http:' || window.location.protocol === 'https:';
    }

    async function load()
    {
        if (!supportedProtocol()) throw new Error('Map requires a hosted HTTP(S) page.');
        if (!libraryPromise)
        {
            libraryPromise = import(PLACES_MAP_CONFIG.moduleUrl)
                .then(module =>
                {
                    if (typeof module.Map !== 'function'
                        || (typeof module.supported === 'function' && !module.supported()))
                    {
                        throw new Error('MapLibre/WebGL2 is unavailable.');
                    }
                    library = module;
                    return module;
                })
                .catch(error =>
                {
                    libraryPromise = null;
                    throw error;
                });
        }
        return libraryPromise;
    }

    function styleUrl(theme)
    {
        return theme === 'dark'
            ? PLACES_MAP_CONFIG.styles.dark
            : PLACES_MAP_CONFIG.styles.light;
    }

    // Apply after each style.load, before the map is presented. Using only
    // setPaintProperty preserves upstream OpenFreeMap tiles, sprites, glyphs,
    // style layer ordering, and the map's attribution.
    function applyDarkPalette(map, theme)
    {
        if (theme !== 'dark' || !map?.getLayer) return 0;

        let applied = 0;
        Object.entries(PLACES_DARK_MAP_PAINT).forEach(([layerId, paints]) =>
        {
            // Missing layers are normal if OpenFreeMap changes its style.
            if (!map.getLayer(layerId)) return;
            Object.entries(paints).forEach(([property, value]) =>
            {
                try
                {
                    map.setPaintProperty(layerId, property, value);
                    ++applied;
                }
                catch (error)
                {
                    console.warn('GeneoGraph dark map paint override failed:',
                        layerId, property, error);
                }
            });
        });
        return applied;
    }

    // OpenFreeMap Dark references "circle-11" for town/city dots, but
    // its sprite can omit this image. Resolve only that known missing icon.
    // MapLibre v6 requires the resolver, not a styleimagemissing listener,
    // because listeners run too late for the current image request.
    function missingTownDotImage()
    {
        const size = 11;
        const data = new Uint8Array(size * size * 4);
        const radius = 4.5;
        for (let y = 0; y < size; ++y)
        {
            for (let x = 0; x < size; ++x)
            {
                const distance = Math.hypot(x - 5, y - 5);
                const alpha = Math.max(0, Math.min(1, radius + 0.5 - distance));
                const pixel = (y * size + x) * 4;
                data[pixel] = 255;
                data[pixel + 1] = 255;
                data[pixel + 2] = 255;
                data[pixel + 3] = Math.round(alpha * 255);
            }
        }
        return { width: size, height: size, data };
    }

    function createMap(host, theme)
    {
        const map = new library.Map({
            container: host,
            style: styleUrl(theme),
            center: [PLACES_MAP_CONFIG.defaultCenter.lng, PLACES_MAP_CONFIG.defaultCenter.lat],
            zoom: PLACES_MAP_CONFIG.defaultZoom,
            minZoom: PLACES_MAP_CONFIG.minZoom,
            maxZoom: PLACES_MAP_CONFIG.maxZoom,
            maxPitch: 0,
            dragRotate: false,
            pitchWithRotate: false,
            attributionControl: true
        });
        map.setMissingStyleImageResolver(id =>
        {
            if (id === 'circle-11')
            {
                map.addImage(id, missingTownDotImage(), { pixelRatio: 1 });
            }
        });
        return map;
    }

    function createMarker(map, latLng, {
        className = 'places-map-marker-icon',
        html = '',
        title = '',
        selected = false,
        draggable = false,
        anchor = 'bottom',
        onSelect = null,
        onDrag = null,
        tooltipHtml = ''
    } = {})
    {
        const element = document.createElement('button');
        element.type = 'button';
        element.className = className;
        element.classList.toggle('is-selected', selected);
        element.title = title;
        element.setAttribute('aria-label', title);
        element.innerHTML = html;
        const marker = new library.Marker({
            element,
            draggable,
            anchor
        }).setLngLat(toLngLat(latLng)).addTo(map);

        if (onSelect)
        {
            element.addEventListener('click', event =>
            {
                event.preventDefault();
                event.stopPropagation();
                onSelect();
            });
        }
        if (onDrag)
        {
            marker.on('drag', () => onDrag(fromLngLat(marker.getLngLat())));
            marker.on('dragend', () => onDrag(fromLngLat(marker.getLngLat())));
            // Custom DOM markers own keyboard editing, unlike default MapLibre markers.
            element.addEventListener('keydown', event =>
            {
                if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key))
                {
                    return;
                }
                event.preventDefault();
                event.stopPropagation();
                const point = map.project(marker.getLngLat());
                const pixels = event.shiftKey ? 10 : 1;
                if (event.key === 'ArrowLeft') point.x -= pixels;
                if (event.key === 'ArrowRight') point.x += pixels;
                if (event.key === 'ArrowUp') point.y -= pixels;
                if (event.key === 'ArrowDown') point.y += pixels;
                const next = map.unproject(point);
                marker.setLngLat([next.lng, next.lat]);
                onDrag(fromLngLat(next));
            });
        }
        if (tooltipHtml)
        {
            const popup = new library.Popup({
                closeButton: false,
                closeOnClick: false,
                offset: 14
            }).setHTML(tooltipHtml);
            element.addEventListener('mouseenter', () =>
            {
                marker.setPopup(popup);
                if (!popup.isOpen()) popup.addTo(map);
            });
            element.addEventListener('mouseleave', () => popup.remove());
            element.addEventListener('focus', () =>
            {
                marker.setPopup(popup);
                if (!popup.isOpen()) popup.addTo(map);
            });
            element.addEventListener('blur', () => popup.remove());
        }
        return marker;
    }

    function updateSelection(marker, selected)
    {
        if (!marker) return;
        const element = marker.getElement();
        element.classList.toggle('is-selected', selected);
        const inner = element.querySelector('.map-place-marker');
        if (inner) inner.classList.toggle('selected', selected);
    }

    function fitPoints(map, points, padding, maxZoom)
    {
        if (!points.length) return;
        const bounds = new library.LngLatBounds();
        points.forEach(point => bounds.extend(toLngLat(point)));
        map.fitBounds(bounds, {
            padding: {
                top: padding.topLeft[1], right: padding.bottomRight[0],
                bottom: padding.bottomRight[1], left: padding.topLeft[0]
            },
            maxZoom,
            duration: 0
        });
    }

    function focusPoint(map, point, padding)
    {
        // Always center explicit place navigation in the usable map area.
        // Left/right and top/bottom padding may differ because of overlays.
        const offset = [
            (padding.topLeft[0] - padding.bottomRight[0]) / 2,
            (padding.topLeft[1] - padding.bottomRight[1]) / 2
        ];
        map.easeTo({
            center: toLngLat(point),
            offset,
            duration: 0
        });
    }

    function setLineSegments(map, segments, color)
    {
        const sourceId = 'places-route-lines';
        const layerId = 'places-route-line';
        if (!map.getStyle()) return;
        const data = {
            type: 'FeatureCollection',
            features: segments.filter(segment => segment.length >= 2)
                .map(segment => ({
                    type: 'Feature',
                    properties: {},
                    geometry: {
                        type: 'LineString',
                        coordinates: segment.map(toLngLat)
                    }
                }))
        };
        if (map.getSource(sourceId))
        {
            map.getSource(sourceId).setData(data);
            return;
        }
        map.addSource(sourceId, { type: 'geojson', data });
        map.addLayer({
            id: layerId,
            type: 'line',
            source: sourceId,
            paint: {
                'line-color': color,
                'line-opacity': 0.78,
                'line-width': 3,
                'line-dasharray': [3, 2.67]
            }
        });
    }

    function clearLineSegments(map)
    {
        if (!map || !map.getStyle()) return;
        if (map.getLayer('places-route-line')) map.removeLayer('places-route-line');
        if (map.getSource('places-route-lines')) map.removeSource('places-route-lines');
    }

    // Future #154 supplies a geographic-radius polygon, never a pixel circle.
    function setArea(map, id, feature, {
        fillColor, outlineColor, fillOpacity = 0.16
    })
    {
        if (!map.getStyle()) return;
        const sourceId = 'places-area-' + id;
        if (map.getSource(sourceId))
        {
            map.getSource(sourceId).setData(feature);
            if (map.getLayer(sourceId + '-fill'))
            {
                map.setPaintProperty(sourceId + '-fill', 'fill-color', fillColor);
                map.setPaintProperty(sourceId + '-fill', 'fill-opacity', fillOpacity);
            }
            if (map.getLayer(sourceId + '-outline'))
            {
                map.setPaintProperty(sourceId + '-outline', 'line-color', outlineColor);
            }
            return;
        }
        map.addSource(sourceId, { type: 'geojson', data: feature });
        map.addLayer({
            id: sourceId + '-fill', type: 'fill', source: sourceId,
            paint: { 'fill-color': fillColor, 'fill-opacity': fillOpacity }
        });
        map.addLayer({
            id: sourceId + '-outline', type: 'line', source: sourceId,
            paint: { 'line-color': outlineColor, 'line-width': 2 }
        });
    }

    function removeArea(map, id)
    {
        if (!map || !map.getStyle()) return;
        const sourceId = 'places-area-' + id;
        for (const suffix of ['-fill', '-outline'])
        {
            if (map.getLayer(sourceId + suffix)) map.removeLayer(sourceId + suffix);
        }
        if (map.getSource(sourceId)) map.removeSource(sourceId);
    }

    return Object.freeze({
        supportedProtocol, load, styleUrl, createMap, applyDarkPalette, createMarker,
        toLngLat, fromLngLat, updateSelection, fitPoints, focusPoint,
        setLineSegments, clearLineSegments, setArea, removeArea
    });
})();
