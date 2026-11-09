/* #156: isolated hosted map PoC; the production application never loads this file. */
(function ()
{
    'use strict';

    const MODULE_URL = 'https://unpkg.com/maplibre-gl@6.16.0/dist/maplibre-gl.mjs';
    const STYLES = Object.freeze({
        light: 'https://tiles.openfreemap.org/styles/liberty',
        dark: 'https://tiles.openfreemap.org/styles/dark'
    });
    const INITIAL_CENTER = Object.freeze([24.0297, 49.8397]);
    const INITIAL_RADIUS_KM = 5;
    const FIXTURE_STOPS = Object.freeze([
        { id: 'krakow', coordinates: [19.9366, 50.0614], sequence: 1 },
        { id: 'approx', coordinates: null, sequence: 2 },
        { id: 'warsaw', coordinates: [21.0122, 52.2297], sequence: 3 }
    ]);
    const CAMERA_STORAGE_KEY = 'geneograph-maplibre-poc-camera';
    const geo = window.GGMapPocGeometry;
    const elements = Object.fromEntries([
        'pocMap', 'mapFallback', 'fallbackMessage', 'retryFallback',
        'mapStatus', 'areaStatus', 'language', 'theme',
        'latitude', 'longitude', 'radiusKm', 'fitRoute',
        'toggleRoute', 'applyArea', 'resetArea', 'restartMap', 'destroyMap'
    ].map(id => [id, document.getElementById(id)]));

    const STRINGS = {
        en: {
            skip: 'Skip to map controls',
            tag: 'Isolated experiment · Issue #156',
            title: 'Places map — renderer proof of concept',
            intro: 'MapLibre GL JS and OpenFreeMap vector tiles. This fixture is separate from the GeneoGraph prototype and never changes project records.',
            mapTitle: 'Interactive map',
            mapHint: 'Click the map to move the approximate-place center, or drag the green marker.',
            hosted: 'Hosted HTTP(S) only',
            mapRegion: 'Interactive vector map with place markers and an approximate area',
            fallbackTitle: 'Map unavailable',
            retry: 'Retry map',
            attributionNote: 'Map data from OpenStreetMap via OpenFreeMap / OpenMapTiles. Attribution is also displayed on the map.',
            controls: 'Experiment controls',
            fixture: 'Illustrative Kraków → approximate Lviv → Warsaw route; dates and locations are test fixtures, not family-history facts.',
            language: 'Language',
            theme: 'Map and UI theme',
            lightOption: 'Light · Liberty',
            darkOption: 'Dark · Dark',
            routeLegend: 'Historical-route fixture',
            stop1: '1 · Kraków · 1875',
            stop2: '2 · Approximate Lviv area · 1905',
            stop3: '3 · Warsaw · 1920',
            fit: 'Fit route',
            hideRoute: 'Hide route',
            showRoute: 'Show route',
            areaLegend: 'Approximate place · geographic radius',
            latitude: 'Latitude',
            longitude: 'Longitude',
            radius: 'Radius (km)',
            apply: 'Apply center and radius',
            reset: 'Reset area',
            radiusInfo: 'The outline is a geodesic GeoJSON polygon, not a screen-pixel circle. Numeric inputs also work without a map.',
            lifecycle: 'Lifecycle and fallback checks',
            restart: 'Reinitialize map',
            destroy: 'Destroy map',
            session: 'Camera view is restored within this tab when storage is available. Test refresh, zoom, resize and map teardown.',
            loading: 'Loading MapLibre and OpenFreeMap…',
            styleLoading: 'Loading vector basemap style…',
            ready: 'Vector map ready. Try selecting, dragging, zooming or changing the radius.',
            stopped: 'Map destroyed. Manual center and radius editing still works.',
            hostedOnly: 'This experiment requires HTTP(S) for map rendering. Open src/index.html directly for the normal prototype; the numeric controls here still work.',
            webglMissing: 'WebGL2 is unavailable. Try a browser with WebGL2 support, or use the numeric controls without a map.',
            loadFailed: 'Could not load the map library, vector style or map tiles. Check network access, WebGL and developer tools; numeric editing remains available.',
            mapError: 'Map resources are failing to load. Use Retry map, or continue with manual coordinates.',
            stoppedFallback: 'Map was deliberately destroyed. Reinitialize it to test clean teardown and startup.',
            invalid: 'Enter latitude between -85 and 85, longitude between -180 and 180, and radius between 0.1 and 100 km.',
            areaSummary: 'Center: {lat}, {lng} · Radius: {radius} km · max geodesic error: {error} m',
            krakowName: 'Kraków, 1875',
            approxName: 'Approximate Lviv area, 1905',
            warsawName: 'Warsaw, 1920',
            markerSelect: 'Select {name}; stop {index} of 3',
            markerDrag: 'Drag to relocate approximate area; stop 2 of 3',
            missingMap: 'Map unavailable; use center/radius inputs.',
            routeHidden: 'Route hidden; marker selection remains available.'
        },
        ru: {
            skip: 'К управлению картой',
            tag: 'Отдельный эксперимент · Задача #156',
            title: 'Карта мест — проверка технологии',
            intro: 'Векторные карты MapLibre GL JS и OpenFreeMap. Пример не связан с основным прототипом и не изменяет записи проекта.',
            mapTitle: 'Интерактивная карта',
            mapHint: 'Нажмите на карту, чтобы переместить центр примерной области, или перетащите зелёный маркер.',
            hosted: 'Требуется HTTP(S)',
            mapRegion: 'Интерактивная векторная карта с маркерами и примерной областью',
            fallbackTitle: 'Карта недоступна',
            retry: 'Повторить загрузку',
            attributionNote: 'Данные OpenStreetMap через OpenFreeMap / OpenMapTiles. Атрибуция также отображается на карте.',
            controls: 'Управление экспериментом',
            fixture: 'Пример маршрута Краков → район Львова → Варшава; даты и места условные, это не исторические семейные сведения.',
            language: 'Язык',
            theme: 'Тема карты и интерфейса',
            lightOption: 'Светлая · Liberty',
            darkOption: 'Тёмная · Dark',
            routeLegend: 'Пример исторического маршрута',
            stop1: '1 · Краков · 1875',
            stop2: '2 · Примерный район Львова · 1905',
            stop3: '3 · Варшава · 1920',
            fit: 'Показать весь маршрут',
            hideRoute: 'Скрыть маршрут',
            showRoute: 'Показать маршрут',
            areaLegend: 'Примерное место · географический радиус',
            latitude: 'Широта',
            longitude: 'Долгота',
            radius: 'Радиус (км)',
            apply: 'Применить центр и радиус',
            reset: 'Сбросить область',
            radiusInfo: 'Контур — геодезический полигон GeoJSON, а не круг в пикселях. Числовые поля работают и без карты.',
            lifecycle: 'Проверка жизненного цикла',
            restart: 'Перезапустить карту',
            destroy: 'Уничтожить карту',
            session: 'Положение карты восстанавливается в этой вкладке, если хранилище доступно. Проверьте обновление, масштаб, размер и перезапуск.',
            loading: 'Загрузка MapLibre и OpenFreeMap…',
            styleLoading: 'Загрузка векторного стиля…',
            ready: 'Карта готова. Выберите точку, перетащите маркер, измените масштаб или радиус.',
            stopped: 'Карта уничтожена. Ручное редактирование координат и радиуса работает.',
            hostedOnly: 'Для карты необходим HTTP(S). Основной прототип открывается напрямую через src/index.html; числовые поля работают и здесь.',
            webglMissing: 'WebGL2 недоступен. Попробуйте другой браузер или используйте числовые поля без карты.',
            loadFailed: 'Не удалось загрузить библиотеку, стиль или тайлы. Проверьте сеть, WebGL и консоль; ручное редактирование доступно.',
            mapError: 'Ошибки загрузки карты. Нажмите «Повторить загрузку» или задайте координаты вручную.',
            stoppedFallback: 'Карта намеренно уничтожена. Перезапустите её для проверки повторной инициализации.',
            invalid: 'Укажите широту от -85 до 85, долготу от -180 до 180 и радиус от 0,1 до 100 км.',
            areaSummary: 'Центр: {lat}, {lng} · Радиус: {radius} км · максимальная геодезическая ошибка: {error} м',
            krakowName: 'Краков, 1875',
            approxName: 'Примерный район Львова, 1905',
            warsawName: 'Варшава, 1920',
            markerSelect: 'Выбрать {name}; остановка {index} из 3',
            markerDrag: 'Перетащите, чтобы изменить примерное место; остановка 2 из 3',
            missingMap: 'Карта недоступна; используйте поля координат и радиуса.',
            routeHidden: 'Маршрут скрыт; выбор маркеров доступен.'
        }
    };

    let language = 'en';
    let theme = 'light';
    let maplibregl = null;
    let map = null;
    let markers = [];
    let observer = null;
    let watchdog = null;
    let generation = 0;
    let ready = false;
    let loadingStyle = false;
    let errors = 0;
    let routeVisible = true;
    let selectedStop = 'approx';
    let center = [...INITIAL_CENTER];
    let radiusKm = INITIAL_RADIUS_KM;
    let statusKey = 'loading';
    let fallbackKey = '';

    function translate(key, values = {})
    {
        const source = STRINGS[language][key] || STRINGS.en[key] || key;
        return source.replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? ''));
    }

    function showStatus(key)
    {
        statusKey = key;
        elements.mapStatus.textContent = translate(key);
    }

    function renderAreaSummary()
    {
        const ring = geo.geodesicCircle(center, radiusKm * 1000).geometry.coordinates[0];
        const error = Math.max(...ring.slice(0, -1).map(point =>
            Math.abs(geo.distanceMeters(center, point) - radiusKm * 1000)
        ));
        elements.areaStatus.textContent = translate('areaSummary', {
            lat: center[1].toFixed(4),
            lng: center[0].toFixed(4),
            radius: radiusKm.toFixed(1),
            error: error.toFixed(4)
        });
    }

    function displayLanguage()
    {
        document.documentElement.lang = language;
        document.querySelectorAll('[data-i18n]').forEach(node =>
        {
            node.textContent = translate(node.dataset.i18n);
        });
        document.querySelectorAll('[data-i18n-aria-label]').forEach(node =>
        {
            node.setAttribute('aria-label', translate(node.dataset.i18nAriaLabel));
        });
        elements.theme.options[0].textContent = translate('lightOption');
        elements.theme.options[1].textContent = translate('darkOption');
        elements.toggleRoute.textContent = translate(routeVisible ? 'hideRoute' : 'showRoute');
        elements.toggleRoute.setAttribute('aria-pressed', String(routeVisible));
        showStatus(statusKey);
        elements.fallbackMessage.textContent = fallbackKey ? translate(fallbackKey) : '';
        updateStopButtons();
        updateMarkerLabels();
        renderAreaSummary();
    }

    function updateStopButtons()
    {
        document.querySelectorAll('[data-stop]').forEach(button =>
        {
            button.setAttribute('aria-pressed', String(button.dataset.stop === selectedStop));
        });
    }

    function getCoordinates(stop)
    {
        return stop.id === 'approx' ? [...center] : [...stop.coordinates];
    }

    function routeFeature()
    {
        return {
            type: 'Feature',
            properties: {},
            geometry: {
                type: 'LineString',
                coordinates: FIXTURE_STOPS.map(getCoordinates)
            }
        };
    }

    function paintColor(name)
    {
        return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    }

    function installSources()
    {
        if (!map) return;
        const area = geo.geodesicCircle(center, radiusKm * 1000);
        if (!map.getSource('poc-area'))
        {
            map.addSource('poc-area', { type: 'geojson', data: area });
            map.addLayer({
                id: 'poc-area-fill',
                type: 'fill',
                source: 'poc-area',
                paint: {
                    'fill-color': paintColor('--gg-primary'),
                    'fill-opacity': 0.20
                }
            });
            map.addLayer({
                id: 'poc-area-outline',
                type: 'line',
                source: 'poc-area',
                paint: {
                    'line-color': paintColor('--gg-primary'),
                    'line-width': 3
                }
            });
        }
        if (!map.getSource('poc-route'))
        {
            map.addSource('poc-route', { type: 'geojson', data: routeFeature() });
            map.addLayer({
                id: 'poc-route-line',
                type: 'line',
                source: 'poc-route',
                layout: { visibility: routeVisible ? 'visible' : 'none' },
                paint: {
                    'line-color': paintColor('--gg-accent-creative-blue-accent'),
                    'line-width': 3.5,
                    'line-opacity': 0.95
                }
            });
        }
    }

    function updateGeometry()
    {
        if (!map || !ready) return;
        const areaSource = map.getSource('poc-area');
        if (areaSource) areaSource.setData(geo.geodesicCircle(center, radiusKm * 1000));
        const routeSource = map.getSource('poc-route');
        if (routeSource) routeSource.setData(routeFeature());
        markers.forEach(({ stop, marker }) =>
        {
            if (stop.id === 'approx') marker.setLngLat(center);
        });
    }

    function updateMarkerLabels()
    {
        markers.forEach(({ stop, button }) =>
        {
            button.textContent = routeVisible ? String(stop.sequence) : '•';
            button.classList.toggle('is-selected', selectedStop === stop.id);
            button.classList.toggle('is-route-hidden', !routeVisible);
            button.title = translate(stop.id + 'Name');
            button.setAttribute('aria-label', translate(
                stop.id === 'approx' ? 'markerDrag' : 'markerSelect',
                { name: translate(stop.id + 'Name'), index: stop.sequence }
            ));
        });
    }

    function selectStop(id, focusMap = true)
    {
        const stop = FIXTURE_STOPS.find(item => item.id === id);
        if (!stop) return;
        selectedStop = id;
        updateStopButtons();
        updateMarkerLabels();
        if (map && ready && focusMap)
        {
            map.easeTo({ center: getCoordinates(stop), duration: 0 });
        }
    }

    function reflectInputs()
    {
        elements.latitude.value = center[1].toFixed(5);
        elements.longitude.value = center[0].toFixed(5);
        elements.radiusKm.value = String(radiusKm);
        renderAreaSummary();
    }

    function changeCenter(newCenter, fromDrag = false)
    {
        if (!newCenter.every(Number.isFinite)
            || newCenter[1] < -85 || newCenter[1] > 85)
        {
            showStatus('invalid');
            return;
        }
        const normalizedLongitude = ((newCenter[0] + 180) % 360 + 360) % 360 - 180;
        center = [normalizedLongitude, newCenter[1]];
        reflectInputs();
        selectStop('approx', false);
        if (map && ready)
        {
            const areaSource = map.getSource('poc-area');
            if (areaSource) areaSource.setData(geo.geodesicCircle(center, radiusKm * 1000));
            const routeSource = map.getSource('poc-route');
            if (routeSource) routeSource.setData(routeFeature());
            if (!fromDrag)
            {
                markers.find(item => item.stop.id === 'approx')?.marker.setLngLat(center);
            }
        }
    }

    function createMarkers()
    {
        if (!map || !maplibregl) return;
        FIXTURE_STOPS.forEach(stop =>
        {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'poc-map-marker' + (stop.id === 'approx' ? ' is-draft' : '');
            button.addEventListener('click', event =>
            {
                event.stopPropagation();
                selectStop(stop.id, false);
            });
            const marker = new maplibregl.Marker({
                element: button,
                draggable: stop.id === 'approx',
                anchor: 'bottom'
            }).setLngLat(getCoordinates(stop)).addTo(map);

            if (stop.id === 'approx')
            {
                marker.on('drag', () => changeCenter(
                    [marker.getLngLat().lng, marker.getLngLat().lat], true
                ));
                marker.on('dragend', () => changeCenter(
                    [marker.getLngLat().lng, marker.getLngLat().lat], true
                ));
            }
            markers.push({ stop, button, marker });
        });
        updateMarkerLabels();
    }

    function fitRoute()
    {
        if (!map || !ready) return;
        const bounds = new maplibregl.LngLatBounds();
        FIXTURE_STOPS.forEach(stop => bounds.extend(getCoordinates(stop)));
        geo.geodesicCircle(center, radiusKm * 1000).geometry.coordinates[0]
            .forEach(point => bounds.extend(point));
        map.fitBounds(bounds, {
            padding: { top: 48, bottom: 48, left: 48, right: 48 },
            maxZoom: 11,
            duration: 0
        });
    }

    function readCamera()
    {
        try
        {
            const value = JSON.parse(sessionStorage.getItem(CAMERA_STORAGE_KEY));
            if (Array.isArray(value?.center)
                && value.center.length === 2
                && value.center.every(Number.isFinite)
                && value.center[0] >= -180 && value.center[0] <= 180
                && value.center[1] >= -85 && value.center[1] <= 85
                && Number.isFinite(value.zoom) && value.zoom >= 1 && value.zoom <= 19)
            {
                return value;
            }
        }
        catch (_error)
        {
            // Storage is optional in local or privacy-restricted browsers.
        }
        return null;
    }

    function saveCamera()
    {
        if (!map || !ready) return;
        const current = map.getCenter();
        try
        {
            sessionStorage.setItem(CAMERA_STORAGE_KEY, JSON.stringify({
                center: [current.lng, current.lat],
                zoom: map.getZoom()
            }));
        }
        catch (_error)
        {
            // A blocked storage API does not block map interactions.
        }
    }

    function stopMap()
    {
        generation += 1;
        clearTimeout(watchdog);
        watchdog = null;
        if (observer) observer.disconnect();
        observer = null;
        markers.forEach(({ marker }) => marker.remove());
        markers = [];
        if (map)
        {
            map.remove();
            map = null;
        }
        ready = false;
        loadingStyle = false;
        errors = 0;
    }

    function showFallback(key)
    {
        stopMap();
        fallbackKey = key;
        elements.fallbackMessage.textContent = translate(key);
        elements.mapFallback.hidden = false;
        showStatus(key === 'stoppedFallback' ? 'stopped' : 'missingMap');
    }

    function beginWatchdog(milliseconds)
    {
        clearTimeout(watchdog);
        watchdog = setTimeout(() =>
        {
            if (!ready || loadingStyle) showFallback('loadFailed');
        }, milliseconds);
    }

    async function startMap()
    {
        stopMap();
        elements.mapFallback.hidden = true;
        fallbackKey = '';
        showStatus('loading');
        if (window.location.protocol === 'file:')
        {
            showFallback('hostedOnly');
            return;
        }
        const requestGeneration = generation;
        try
        {
            const library = await import(MODULE_URL);
            if (requestGeneration !== generation) return;
            maplibregl = library;
            if (typeof library.supported === 'function' && !library.supported())
            {
                showFallback('webglMissing');
                return;
            }
            const saved = readCamera();
            map = new library.Map({
                container: elements.pocMap,
                style: STYLES[theme],
                center: saved?.center || [21.9, 51],
                zoom: saved?.zoom || 5,
                minZoom: 2,
                maxZoom: 19,
                dragRotate: false,
                pitchWithRotate: false,
                attributionControl: {
                    compact: false,
                    customAttribution: [
                        '<a href="https://openfreemap.org/" target="_blank" rel="noopener noreferrer">OpenFreeMap</a>',
                        '<a href="https://openmaptiles.org/" target="_blank" rel="noopener noreferrer">© OpenMapTiles</a>',
                        '<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap contributors</a>'
                    ]
                }
            });
            map.addControl(new library.NavigationControl({ showCompass: false }), 'top-right');
            map.on('style.load', () =>
            {
                if (!map) return;
                try
                {
                    installSources();
                    if (loadingStyle)
                    {
                        loadingStyle = false;
                        clearTimeout(watchdog);
                        showStatus('ready');
                    }
                }
                catch (error)
                {
                    console.error('MapLibre PoC style error:', error);
                    showFallback('loadFailed');
                }
            });
            map.on('load', () =>
            {
                if (!map) return;
                ready = true;
                clearTimeout(watchdog);
                createMarkers();
                if (!saved) fitRoute();
                showStatus('ready');
            });
            map.on('moveend', saveCamera);
            map.on('click', event =>
            {
                if (!ready) return;
                changeCenter([event.lngLat.lng, event.lngLat.lat]);
            });
            map.on('error', event =>
            {
                console.error('MapLibre PoC resource error:', event.error);
                errors += 1;
                if (!ready || errors >= 3)
                {
                    showFallback('loadFailed');
                }
                else
                {
                    showStatus('mapError');
                }
            });
            if (typeof ResizeObserver !== 'undefined')
            {
                observer = new ResizeObserver(() => map?.resize());
                observer.observe(elements.pocMap.parentElement);
            }
            beginWatchdog(18000);
            showStatus('styleLoading');
        }
        catch (error)
        {
            console.error('MapLibre PoC startup error:', error);
            if (requestGeneration === generation) showFallback('loadFailed');
        }
    }

    function applyArea()
    {
        const latitudeText = elements.latitude.value.trim();
        const longitudeText = elements.longitude.value.trim();
        const radiusText = elements.radiusKm.value.trim();
        const latitude = Number(latitudeText);
        const longitude = Number(longitudeText);
        const radius = Number(radiusText);
        if (!latitudeText || !longitudeText || !radiusText
            || !Number.isFinite(latitude) || latitude < -85 || latitude > 85
            || !Number.isFinite(longitude) || longitude < -180 || longitude > 180
            || !Number.isFinite(radius) || radius < 0.1 || radius > 100)
        {
            elements.areaStatus.textContent = translate('invalid');
            return;
        }
        center = [longitude, latitude];
        radiusKm = radius;
        reflectInputs();
        selectStop('approx', false);
        updateGeometry();
    }

    function changeTheme(next)
    {
        theme = next;
        document.documentElement.dataset.theme = next;
        if (map && !ready)
        {
            startMap();
            return;
        }
        if (!map) return;
        try
        {
            loadingStyle = true;
            errors = 0;
            showStatus('styleLoading');
            beginWatchdog(15000);
            map.setStyle(STYLES[next]);
        }
        catch (error)
        {
            console.error('MapLibre PoC style change failed:', error);
            showFallback('loadFailed');
        }
    }

    document.querySelectorAll('[data-stop]').forEach(button =>
    {
        button.addEventListener('click', () => selectStop(button.dataset.stop));
    });
    elements.language.addEventListener('change', () =>
    {
        language = elements.language.value === 'ru' ? 'ru' : 'en';
        displayLanguage();
    });
    elements.theme.addEventListener('change', () =>
    {
        changeTheme(elements.theme.value === 'dark' ? 'dark' : 'light');
    });
    elements.fitRoute.addEventListener('click', fitRoute);
    elements.toggleRoute.addEventListener('click', () =>
    {
        routeVisible = !routeVisible;
        if (map && map.getLayer('poc-route-line'))
        {
            map.setLayoutProperty('poc-route-line', 'visibility', routeVisible ? 'visible' : 'none');
        }
        elements.toggleRoute.textContent = translate(routeVisible ? 'hideRoute' : 'showRoute');
        elements.toggleRoute.setAttribute('aria-pressed', String(routeVisible));
        updateMarkerLabels();
    });
    elements.applyArea.addEventListener('click', applyArea);
    elements.resetArea.addEventListener('click', () =>
    {
        center = [...INITIAL_CENTER];
        radiusKm = INITIAL_RADIUS_KM;
        reflectInputs();
        updateGeometry();
        selectStop('approx', false);
    });
    elements.restartMap.addEventListener('click', startMap);
    elements.retryFallback.addEventListener('click', startMap);
    elements.destroyMap.addEventListener('click', () => showFallback('stoppedFallback'));

    const initialLanguage = new URLSearchParams(window.location.search).get('lang');
    language = initialLanguage === 'ru' ? 'ru' : 'en';
    elements.language.value = language;
    reflectInputs();
    displayLanguage();
    startMap();
})();
