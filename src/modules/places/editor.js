function formatPlaceUpdatedAt(value)
{
    const timestamp = Date.parse(value || '');
    return Number.isFinite(timestamp) ? new Intl.DateTimeFormat(state.language === 'ru' ? 'ru-RU' : 'en-GB', { dateStyle: 'medium' }).format(new Date(timestamp)) : 'Unknown';
}

function clonePlaceEditorCoordinates(value)
{
    if (!value || !validLatitude(value.lat) || !validLongitude(value.lng)) return null;
    return { lat: Number(value.lat), lng: Number(value.lng) };
}

function placeEditorCoordinateText(coordinates)
{
    const value = clonePlaceEditorCoordinates(coordinates);
    return {
        latitude: value ? value.lat.toFixed(6) : '',
        longitude: value ? value.lng.toFixed(6) : ''
    };
}

function placeEditorCoordinateTextFromStored(coordinates)
{
    const normalized = clonePlaceEditorCoordinates(coordinates);
    if (normalized) return placeEditorCoordinateText(normalized);
    if (!coordinates || typeof coordinates !== 'object')
    {
        return { latitude: '', longitude: '' };
    }
    return {
        latitude: coordinates.lat === null || coordinates.lat === undefined ? '' : String(coordinates.lat),
        longitude: coordinates.lng === null || coordinates.lng === undefined ? '' : String(coordinates.lng)
    };
}

function storedPlaceCoordinateKey(coordinates)
{
    return JSON.stringify(placeEditorCoordinateTextFromStored(coordinates));
}

function parsePlaceEditorCoordinate(value, { label, minimum, maximum, example })
{
    const raw = String(value ?? '').trim();
    if (!raw) return { empty: true, valid: false, value: null, formatted: '', message: '' };
    const normalizedMinus = raw.replace(/\u2212/g, '-');
    const separatorCount = (normalizedMinus.match(/[.,]/g) || []).length;
    const normalized = separatorCount === 1 && normalizedMinus.includes(',')
        ? normalizedMinus.replace(',', '.')
        : normalizedMinus;
    if (separatorCount > 1 || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized))
    {
        return { empty: false, valid: false, value: null, formatted: '', message: t(`${label} must use decimal degrees, for example ${example}.`) };
    }
    const number = Number(normalized);
    if (!Number.isFinite(number))
    {
        return { empty: false, valid: false, value: null, formatted: '', message: t(`${label} must be a valid number.`) };
    }
    if (number < minimum || number > maximum)
    {
        return { empty: false, valid: false, value: null, formatted: '', message: t(`${label} must be between ${minimum} and ${maximum}.`) };
    }
    return { empty: false, valid: true, value: number, formatted: number.toFixed(6), message: '' };
}

function readPlaceEditorCoordinateState(latitudeText, longitudeText)
{
    const latitude = parsePlaceEditorCoordinate(latitudeText, {
        label: 'Latitude', minimum: -90, maximum: 90, example: '53.959400'
    });
    const longitude = parsePlaceEditorCoordinate(longitudeText, {
        label: 'Longitude', minimum: -180, maximum: 180, example: '-1.082000'
    });
    const hasAnyValue = Boolean(String(latitudeText || '').trim() || String(longitudeText || '').trim());
    if (!hasAnyValue)
    {
        return { valid: true, hasAnyValue: false, hasCoordinates: false, coordinates: null, latitude, longitude, message: '' };
    }
    if (latitude.empty || longitude.empty)
    {
        return { valid: false, hasAnyValue: true, hasCoordinates: false, coordinates: null, latitude, longitude, message: 'Enter both latitude and longitude.' };
    }
    if (!latitude.valid || !longitude.valid)
    {
        return { valid: false, hasAnyValue: true, hasCoordinates: false, coordinates: null, latitude, longitude, message: latitude.message || longitude.message };
    }
    return {
        valid: true,
        hasAnyValue: true,
        hasCoordinates: true,
        coordinates: { lat: latitude.value, lng: longitude.value },
        latitude,
        longitude,
        message: ''
    };
}

function readPlaceEditorRadiusState(text)
{
    const raw = String(text ?? '').trim().replace(',', '.');
    if (!raw) return { valid: false, meters: null,
        message: 'Enter an approximate radius in kilometres.' };
    if (!/^(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)$/.test(raw))
    {
        return { valid: false, meters: null, message: 'Enter a positive radius, for example 2.5 km.' };
    }
    const kilometres = Number(raw);
    if (!Number.isFinite(kilometres) || kilometres < 0.001 || kilometres > 1000)
    {
        return { valid: false, meters: null,
            message: 'Radius must be between 0.001 and 1000 km.' };
    }
    const meters = Math.round(kilometres * 1000);
    return { valid: true, meters, formatted: String(Number((meters / 1000).toFixed(3))), message: '' };
}

// Only bundled demo records receive localized editable presentation.
// Source values and the corresponding Place IDs stay canonical in storage.
const PLACE_EDITOR_SAMPLE_IDS = new Set([
    'place-pawford', 'place-meowbridge', 'place-fishmarket-row',
    'place-old-cattery', 'place-unknown', 'place-pawford-garden',
    'place-meowbridge-school', 'place-archive', 'place-residence',
    'place-cemetery'
]);

function placeEditorIsBundledSample(draft)
{
    return draft?.mode === 'edit' && PLACE_EDITOR_SAMPLE_IDS.has(draft.placeId)
        && getPlace(draft.placeId)?.projectId === 'p1';
}

function placeEditorDisplayedName(draft, value)
{
    const source = String(value ?? '');
    return state.language === 'ru' && placeEditorIsBundledSample(draft)
        && Object.prototype.hasOwnProperty.call(RU_DATA_PLACES, source)
        ? localizedDataFieldValue(source) : source;
}

function placeEditorCanonicalName(draft, value, originals)
{
    const text = String(value ?? '');
    if (!placeEditorIsBundledSample(draft)) return text;
    const original = (originals || []).find(source =>
        Object.prototype.hasOwnProperty.call(RU_DATA_PLACES, source)
        && RU_DATA_PLACES[source] === text);
    return original ?? text;
}

function placeEditorCanonicalAlternatives(draft, value)
{
    return String(value ?? '').split('\n').map(line =>
        placeEditorCanonicalName(draft, line, draft.original.alternativeNames));
}

function createPlaceEditorDraft(placeId = null, { initialCoordinates = null } = {})
{
    const existing = placeId ? getPlace(placeId) : null;
    const coordinates = clonePlaceEditorCoordinates(initialCoordinates || existing?.coordinates);
    const alternativeNames = placeAlternativeNames(existing).slice();
    const coordinateText = initialCoordinates
        ? placeEditorCoordinateText(coordinates)
        : placeEditorCoordinateTextFromStored(existing?.coordinates);
    const locationMode = placeHasRadiusValue(existing) ? 'approximate' : 'exact';
    const radiusText = placeHasRadiusValue(existing)
        ? (validPlaceRadiusMeters(existing.approximateRadiusMeters)
            ? String(Number((Number(existing.approximateRadiusMeters) / 1000).toFixed(3)))
            : String(existing.approximateRadiusMeters))
        : '';
    const original = {
        name: existing?.name || '',
        alternativeNames: alternativeNames.slice(),
        coordinates: clonePlaceEditorCoordinates(existing?.coordinates),
        coordinateText: placeEditorCoordinateTextFromStored(existing?.coordinates),
        locationMode,
        radiusText
    };
    return {
        mode: existing ? 'edit' : 'add',
        placeId: existing?.id || null,
        name: existing?.name || '',
        alternativeNames,
        coordinates,
        coordinateText,
        locationMode,
        radiusText,
        approximateRadiusMeters: validPlaceRadiusMeters(existing?.approximateRadiusMeters)
            ? Number(existing.approximateRadiusMeters)
            : null,
        original,
        dirty: Boolean(initialCoordinates && !existing),
        selectedSuggestion: null,
        existingCandidateId: null,
        dismissedDuplicateId: null,
        disclosures: {
            alternativeNames: alternativeNames.length > 0,
            coordinates: false
        },
        query: existing?.name || '',
        searchTouched: false,
        externalState: 'idle',
        externalError: '',
        externalResults: [],
        externalQuery: '',
        lastExternalQuery: '',
        renderedSuggestions: [],
        activeSuggestionIndex: -1,
        mapSession: null
    };
}

function resetPlaceEditorDraft()
{
    clearTimeout(
        placeGeocoderTimer
    );

    placeGeocoderTimer =
        null;

    placeGeocoderController
        ?.abort();

    placeGeocoderController =
        null;

    placeEditorDraft =
        null;

    placeEditorCompletion =
        null;
}

function placeEditorDraftPersonalityKey(draft)
{
    return JSON.stringify({
        name: draft.name,
        alternativeNames: draft.alternativeNames,
        coordinateText: draft.coordinateText,
        locationMode: draft.locationMode,
        radiusText: draft.radiusText
    });
}

function updatePlaceEditorDraftDirty(draft = placeEditorDraft)
{
    if (!draft) return false;
    draft.dirty = placeEditorDraftPersonalityKey(draft) !== JSON.stringify({
        name: draft.original.name,
        alternativeNames: draft.original.alternativeNames,
        coordinateText: draft.original.coordinateText,
        locationMode: draft.original.locationMode,
        radiusText: draft.original.radiusText
    });
    return draft.dirty;
}

function normalizePlaceEditorName(value)
{
    return String(value || '').trim().replace(/[ \t\f\v]+/g, ' ');
}

function validatePlaceEditorName(value)
{
    const raw = String(value || '');
    if (!raw.trim()) return { valid: false, value: '', message: 'Enter a place name.' };
    if (/[\r\n\u0000-\u001f\u007f]/.test(raw))
    {
        return { valid: false, value: raw.trim(), message: 'Place names cannot contain line breaks or control characters.' };
    }
    return { valid: true, value: normalizePlaceEditorName(raw), message: '' };
}

function syncPlaceEditorDraftFromModal()
{
    const draft = placeEditorDraft;
    const root = modalBackdrop.querySelector('[data-place-editor]');
    if (!draft || !root) return draft;
    draft.name = placeEditorCanonicalName(draft,
        root.querySelector('#placeNameInput')?.value || '', [draft.original.name]);
    draft.query = draft.name;
    draft.alternativeNames = placeEditorCanonicalAlternatives(draft,
        root.querySelector('#placeAlternativeNamesInput')?.value || '');
    draft.coordinateText = {
        latitude: root.querySelector('#placeLatitudeInput')?.value || '',
        longitude: root.querySelector('#placeLongitudeInput')?.value || ''
    };
    const coordinateState = readPlaceEditorCoordinateState(draft.coordinateText.latitude, draft.coordinateText.longitude);
    draft.coordinates = coordinateState.hasCoordinates ? coordinateState.coordinates : null;
    draft.locationMode = root.querySelector('[name="placeLocationMode"]:checked')?.value || draft.locationMode;
    draft.radiusText = root.querySelector('#placeApproximateRadiusInput')?.value || '';
    const radiusState = readPlaceEditorRadiusState(draft.radiusText);
    draft.approximateRadiusMeters = draft.locationMode === 'approximate' && radiusState.valid
        ? radiusState.meters : null;
    draft.disclosures.alternativeNames = Boolean(root.querySelector('[data-place-alternative-details]')?.open);
    draft.disclosures.coordinates = Boolean(root.querySelector('[data-place-coordinate-details]')?.open);
    updatePlaceEditorDraftDirty(draft);
    return draft;
}

function placeEditorExistingMatches(query)
{
    const normalized = normalizePlaceLookupText(query);
    if (!normalized) return [];
    return projectPlaces().map(place =>
    {
        const names = [place.name, ...placeAlternativeNames(place)];
        const normalizedNames = names.map(normalizePlaceLookupText);
        const exact = normalizedNames.some(value => value === normalized);
        const starts = normalizedNames.some(value => value.startsWith(normalized));
        const contains = normalizedNames.some(value => value.includes(normalized));
        return { place, rank: exact ? 0 : starts ? 1 : contains ? 2 : 9 };
    }).filter(result => result.rank < 9).sort((a, b) => a.rank - b.rank || a.place.name.localeCompare(b.place.name)).slice(0, 6).map(result => result.place);
}

function closePlaceEditorSuggestions()
{
    const input = modalBackdrop.querySelector('#placeNameInput');
    const list = modalBackdrop.querySelector('#placeEditorSuggestions');
    if (list) list.hidden = true;
    input?.setAttribute('aria-expanded', 'false');
    input?.removeAttribute('aria-activedescendant');
    if (placeEditorDraft) placeEditorDraft.activeSuggestionIndex = -1;
}

function renderPlaceEditorSuggestions({ open = true } = {})
{
    const draft = placeEditorDraft;
    const input = modalBackdrop.querySelector('#placeNameInput');
    const list = modalBackdrop.querySelector('#placeEditorSuggestions');
    if (!draft || !input || !list) return;
    const entered = input.value.trim();
    if (!entered)
    {
        draft.renderedSuggestions = [];
        list.innerHTML = '';
        closePlaceEditorSuggestions();
        return;
    }
    const suggestions = [];
    const existing = placeEditorExistingMatches(entered);
    const mapResults = draft.externalQuery === entered ? draft.externalResults : [];
    let html = '';
    if (existing.length)
    {
        html += '<div class="place-editor-suggestion-group" role="presentation"><span>Existing places</span></div>';
        existing.forEach(place =>
        {
            const option = { kind: 'existing', id: place.id, name: place.name };
            const index = suggestions.push(option) - 1;
            html += `<button class="place-editor-suggestion" id="placeEditorOption${index}" type="button" role="option" aria-selected="false" data-place-editor-option="${index}"><span><strong>${escapeHtml(place.name)}</strong><small>Existing place${place.id === draft.placeId ? ' / Current place' : ''}</small></span><em>${placeHasCoordinates(place) ? 'On map' : 'Not on map'}</em></button>`;
        });
    }
    html += '<div class="place-editor-suggestion-group" role="presentation"><span>Map results</span></div>';
    if (draft.externalState === 'loading')
    {
        html += '<div class="place-editor-suggestion-status">Searching map results...</div>';
    }
    else if (draft.externalState === 'unavailable')
    {
        html += `<div class="place-editor-suggestion-status"><span>${escapeHtml(draft.externalError || 'Map search is unavailable.')}</span><button type="button" data-place-editor-retry>Retry</button></div>`;
    }
    else if (draft.externalState === 'empty' && draft.externalQuery === entered)
    {
        html += '<div class="place-editor-suggestion-status">No matching map results. You can still use the entered text.</div>';
    }
    else if (entered.length < PLACE_EDITOR_GEOCODER_MIN_LENGTH)
    {
        html += `<div class="place-editor-suggestion-status">Type at least ${PLACE_EDITOR_GEOCODER_MIN_LENGTH} characters for map results.</div>`;
    }
    else if (mapResults.length)
    {
        mapResults.forEach(result =>
        {
            const index = suggestions.push(result) - 1;
            html += `<button class="place-editor-suggestion" id="placeEditorOption${index}" type="button" role="option" aria-selected="false" data-place-editor-option="${index}"><span><strong>${escapeHtml(result.primary)}</strong><small>${escapeHtml(result.context || result.name)}</small></span><em>${result.coordinates.lat.toFixed(5)}, ${result.coordinates.lng.toFixed(5)}</em></button>`;
        });
    }
    else
    {
        html += '<div class="place-editor-suggestion-status">Map results will appear here.</div>';
    }
    const manual = { kind: 'manual', id: 'manual', name: input.value };
    const manualIndex = suggestions.push(manual) - 1;
    const manualLabel = t('Use “{name}” as entered').replace('{name}', () => manual.name);
    html += `<div class="place-editor-suggestion-group" role="presentation"><span>${escapeHtml(t('Use entered text'))}</span></div>`;
    html += `<button class="place-editor-suggestion manual" id="placeEditorOption${manualIndex}" type="button" role="option" aria-selected="false" data-place-editor-option="${manualIndex}">${icon.edit}<span><strong>${escapeHtml(manualLabel)}</strong><small>${escapeHtml(t('Keep a historical or custom place name'))}</small></span></button>`;
    draft.renderedSuggestions = suggestions;
    draft.activeSuggestionIndex = Math.min(draft.activeSuggestionIndex, suggestions.length - 1);
    list.innerHTML = html + geneographGeocoder.attributionHtml();
    list.hidden = !open;
    input.setAttribute('aria-expanded', String(open));
    updatePlaceEditorActiveSuggestion();
}

function updatePlaceEditorActiveSuggestion()
{
    const draft = placeEditorDraft;
    const input = modalBackdrop.querySelector('#placeNameInput');
    const options = [...modalBackdrop.querySelectorAll('[data-place-editor-option]')];
    if (!draft || !input) return;
    options.forEach((option, index) =>
    {
        const active = index === draft.activeSuggestionIndex;
        option.classList.toggle('active', active);
        option.setAttribute('aria-selected', String(active));
    });
    const active = options[draft.activeSuggestionIndex];
    if (active)
    {
        input.setAttribute('aria-activedescendant', active.id);
        active.scrollIntoView({ block: 'nearest' });
    }
    else
    {
        input.removeAttribute('aria-activedescendant');
    }
}

async function searchPlaceEditorMapResults(query, { retry = false } = {})
{
    const draft = placeEditorDraft;
    const normalizedQuery = String(query || '').trim();
    if (!draft || normalizedQuery.length < PLACE_EDITOR_GEOCODER_MIN_LENGTH) return;
    if (!retry && draft.lastExternalQuery === normalizedQuery && ['ready', 'empty'].includes(draft.externalState)) return;
    placeGeocoderController?.abort();
    const controller = new AbortController();
    placeGeocoderController = controller;
    draft.externalState = 'loading';
    draft.externalError = '';
    draft.externalQuery = normalizedQuery;
    renderPlaceEditorSuggestions();
    try
    {
        const results = await searchSharedPlaceMapResults(normalizedQuery, controller.signal);
        if (placeEditorDraft !== draft || controller.signal.aborted || draft.query.trim() !== normalizedQuery) return;
        draft.externalResults = results;
        draft.externalState = draft.externalResults.length ? 'ready' : 'empty';
        draft.externalQuery = normalizedQuery;
        draft.lastExternalQuery = normalizedQuery;
    }
    catch (error)
    {
        if (error.name === 'AbortError' || placeEditorDraft !== draft) return;
        draft.externalResults = [];
        draft.externalState = 'unavailable';
        draft.externalError = 'Map search is unavailable. You can retry or use the entered text.';
        draft.externalQuery = normalizedQuery;
    }
    finally
    {
        if (placeGeocoderController === controller) placeGeocoderController = null;
    }
    renderPlaceEditorSuggestions();
}

function schedulePlaceEditorMapSearch(query, { immediate = false } = {})
{
    const draft = placeEditorDraft;
    if (!draft) return;
    clearTimeout(placeGeocoderTimer);
    placeGeocoderTimer = null;
    placeGeocoderController?.abort();
    placeGeocoderController = null;
    const value = String(query || '').trim();
    if (value.length < PLACE_EDITOR_GEOCODER_MIN_LENGTH)
    {
        draft.externalState = 'idle';
        draft.externalResults = [];
        draft.externalQuery = '';
        renderPlaceEditorSuggestions();
        return;
    }
    if (!draft.searchTouched && normalizePlaceLookupText(value) === normalizePlaceLookupText(draft.original.name)) return;
    draft.externalState = 'loading';
    draft.externalQuery = value;
    renderPlaceEditorSuggestions();
    placeGeocoderTimer = setTimeout(() =>
    {
        // Timer callbacks do not await promises; never leave a rejected
        // request unobserved, especially while rapidly editing the query.
        searchPlaceEditorMapResults(value, { retry: immediate }).catch(error =>
        {
            if (error?.name !== 'AbortError')
            {
                console.warn('GeneoGraph place search failed:', error);
            }
        });
    }, immediate ? 0 : PLACE_EDITOR_GEOCODER_DEBOUNCE_MS);
}

function findPlaceEditorDuplicate(draft = placeEditorDraft)
{
    if (!draft) return null;
    const proposed = { id: draft.placeId || '__new_place__', projectId: currentProjectId(),
        name: draft.name, alternativeNames: draft.alternativeNames, coordinates: draft.coordinates,
        approximateRadiusMeters: draft.approximateRadiusMeters };
    let best = null;
    projectPlaces().filter(place => place.id !== draft.placeId).forEach(place =>
    {
        const match = matchDuplicatePlaces(proposed, place);
        if (match && (!best || match.score > best.score))
            best = { place, ...match, alternativeConflict: match.alias };
    });
    return best;
}

function renderPlaceEditorDuplicateWarning()
{
    const draft = placeEditorDraft;
    const host = modalBackdrop.querySelector('[data-place-duplicate-warning]');

    if (!draft || !host) return null;

    const duplicate = findPlaceEditorDuplicate(draft);

    if (
        !duplicate
        || duplicate.place.id === draft.dismissedDuplicateId
    )
    {
        host.hidden = true;
        host.innerHTML = '';
        return duplicate;
    }

    if (duplicate.alternativeConflict)
    {
        draft.disclosures.alternativeNames = true;
        const details = modalBackdrop.querySelector('[data-place-alternative-details]');
        if (details) details.open = true;
    }

    const reasons = duplicate.reasons;

    const place = duplicate.place;
    const savedText = placeEditorCoordinateTextFromStored(place.coordinates);
    const savedPosition = readPlaceEditorCoordinateState(
        savedText.latitude,
        savedText.longitude
    );

    const positionText = savedPosition.hasCoordinates
        ? `${savedPosition.coordinates.lat.toFixed(6)}, ${savedPosition.coordinates.lng.toFixed(6)}`
        : t('No position set');

    const alternativeNames = placeAlternativeNames(place);

    host.hidden = false;
    host.innerHTML = `
        <div class="place-duplicate-heading">
          ${icon.warning}
          <strong>${escapeHtml(t('Possible duplicate'))}</strong>
          <button class="button ghost compact place-duplicate-dismiss" type="button"
            data-place-duplicate-ignore="${escapeHtml(place.id)}">
            ${icon.close}<span>${escapeHtml(placeReviewT('Dismiss'))}</span>
          </button>
        </div>

        <div class="place-duplicate-name" data-i18n-skip>
          ${escapeHtml(place.name)}
        </div>

        <p>${escapeHtml(reasons.map(reason => t(reason)).join(' '))}</p>


        <div
          class="place-duplicate-review"
          id="placeDuplicateReview"
          hidden>

          <strong>${escapeHtml(t('Saved place details'))}</strong>

          <dl>
            <div>
              <dt>${escapeHtml(t('Place'))}</dt>
              <dd data-i18n-skip>${escapeHtml(place.name)}</dd>
            </div>

            <div>
              <dt>${escapeHtml(t('Map location'))}</dt>
              <dd>${escapeHtml(positionText)}</dd>
            </div>

            ${alternativeNames.length ? `
              <div>
                <dt>${escapeHtml(t('Historical / alternative names'))}</dt>
                <dd>
                  <ul data-i18n-skip>
                    ${alternativeNames.map(name => `
                      <li>${escapeHtml(name)}</li>
                    `).join('')}
                  </ul>
                </dd>
              </div>
            ` : ''}
          </dl>

        </div>
        <div class="place-duplicate-actions">
          ${draft.mode === 'add' ? `
            <button class="button compact place-duplicate-use-existing" type="button"
              data-place-use-existing="${escapeHtml(place.id)}">
              ${escapeHtml(t('Use existing place'))}
            </button>
          ` : ''}
          <button class="button ghost compact place-duplicate-details" type="button"
            data-place-duplicate-details aria-expanded="false"
            aria-controls="placeDuplicateReview">
            <span>${escapeHtml(t('Place details'))}</span>${icon.chevron}
          </button>
          ${draft.mode === 'edit' ? `<button class="button compact place-duplicate-merge" type="button"
            data-place-review-merge="${escapeHtml(place.id)}">${escapeHtml(t('Merge'))}</button>` : ''}
        </div>
      `;

    localizeUI(host, { suppressObserverReplay: true });
    return duplicate;
}

function updatePlaceEditorAlternativeSummary()
{
    const draft = placeEditorDraft;
    const textarea = modalBackdrop.querySelector('#placeAlternativeNamesInput');
    const count = modalBackdrop.querySelector('[data-place-alternative-count]');
    if (!draft || !textarea || !count) return;
    draft.alternativeNames = placeEditorCanonicalAlternatives(draft, textarea.value);
    const normalized = normalizePlaceAlternativeNames(draft.alternativeNames, draft.name);
    count.textContent = normalized.length ? ` · ${normalized.length}` : '';
    updatePlaceEditorDraftDirty(draft);
}

function updatePlaceEditorCoordinateUi({ formatValues = false } = {})
{
    const draft = placeEditorDraft;
    const root = modalBackdrop.querySelector('[data-place-editor]');
    const latitudeInput = root?.querySelector('#placeLatitudeInput');
    const longitudeInput = root?.querySelector('#placeLongitudeInput');
    if (!draft || !latitudeInput || !longitudeInput) return null;

    const result = readPlaceEditorCoordinateState(latitudeInput.value, longitudeInput.value);
    const mode = root.querySelector('[name="placeLocationMode"]:checked')?.value || draft.locationMode;
    const radiusInput = root.querySelector('#placeApproximateRadiusInput');
    const radiusState = readPlaceEditorRadiusState(radiusInput?.value);
    const approximate = mode === 'approximate';

    if (formatValues)
    {
        if (result.latitude.valid) latitudeInput.value = result.latitude.formatted;
        if (result.longitude.valid) longitudeInput.value = result.longitude.formatted;
        if (approximate && radiusState.valid && radiusInput)
        {
            radiusInput.value = radiusState.formatted;
        }
    }

    draft.coordinateText = {
        latitude: latitudeInput.value,
        longitude: longitudeInput.value
    };
    draft.coordinates = result.hasCoordinates ? result.coordinates : null;
    draft.locationMode = mode;
    draft.radiusText = radiusInput?.value || '';
    draft.approximateRadiusMeters = approximate && radiusState.valid
        ? radiusState.meters : null;

    const needsCenter = approximate && !result.hasCoordinates;
    latitudeInput.setAttribute('aria-invalid', String(
        (result.hasAnyValue && (result.latitude.empty || !result.latitude.valid))
        || (needsCenter && result.latitude.empty)
    ));
    longitudeInput.setAttribute('aria-invalid', String(
        (result.hasAnyValue && (result.longitude.empty || !result.longitude.valid))
        || (needsCenter && result.longitude.empty)
    ));
    if (radiusInput)
    {
        radiusInput.setAttribute('aria-invalid', String(approximate && !radiusState.valid));
    }
    const error = root.querySelector('#placeCoordinateError');
    if (error)
    {
        error.textContent = t(result.message
            || (needsCenter ? 'Set a center position for the approximate area.' : ''));
    }
    const radiusError = root.querySelector('#placeRadiusError');
    if (radiusError)
    {
        radiusError.textContent = approximate && !radiusState.valid
            ? t(radiusState.message) : '';
    }

    const modeControls = root.querySelector('[data-place-location-mode]');
    if (modeControls) modeControls.hidden = !result.hasAnyValue && !approximate;
    const radiusField = root.querySelector('[data-place-radius-field]');
    if (radiusField) radiusField.hidden = !approximate;

    const copy = root.querySelector('[data-place-copy-coordinates]');
    if (copy) copy.disabled = !result.hasCoordinates;
    const remove = root.querySelector('[data-place-remove-position]');
    if (remove) remove.hidden = !result.hasAnyValue;
    const choose = root.querySelector('[data-place-choose-map]');
    if (choose) choose.textContent = t(
        result.hasCoordinates ? 'Edit on map' : 'Choose on map'
    );

    const status = root.querySelector('[data-place-map-status]');
    if (status)
    {
        status.textContent = t(result.hasCoordinates
            ? approximate ? 'Approximate location' : 'Position set'
            : result.hasAnyValue || needsCenter
                ? 'Coordinates need attention' : 'No position set');
    }
    const summary = root.querySelector('[data-place-map-summary]');
    if (summary)
    {
        summary.hidden = !result.hasCoordinates;
        summary.textContent = result.hasCoordinates
            ? `${result.coordinates.lat.toFixed(6)}, ${result.coordinates.lng.toFixed(6)}`
                + (approximate && radiusState.valid
                    ? ' · ' + formatPlaceRadius(radiusState.meters)
                    : '')
            : '';
    }
    const details = root.querySelector('[data-place-coordinate-details]');
    if (!result.valid || needsCenter)
    {
        if (details) details.open = true;
        draft.disclosures.coordinates = true;
    }

    updatePlaceEditorDraftDirty(draft);
    return {
        ...result,
        valid: result.valid && (!approximate || (result.hasCoordinates && radiusState.valid)),
        radiusMeters: approximate && radiusState.valid ? radiusState.meters : null
    };
}

function updatePlaceEditorSelectionNotice()
{
    const draft = placeEditorDraft;
    const notice = modalBackdrop.querySelector('[data-place-selection-notice]');
    if (!draft || !notice) return;
    if (draft.selectedSuggestion?.kind === 'map')
    {
        notice.hidden = false;
        notice.textContent = draft.mode === 'edit'
            ? 'Map result selected. The draft name and map position were updated; review both before saving.'
            : 'Map result selected. Review the draft name and map position before creating the place.';
    }
    else
    {
        notice.hidden = true;
        notice.textContent = '';
    }
}

function selectPlaceEditorSuggestion(index)
{
    const draft = placeEditorDraft;
    const suggestion = draft?.renderedSuggestions?.[Number(index)];
    const input = modalBackdrop.querySelector('#placeNameInput');
    if (!draft || !suggestion || !input) return;
    draft.selectedSuggestion = suggestion;
    draft.dismissedDuplicateId = null;
    if (suggestion.kind === 'existing')
    {
        draft.existingCandidateId = suggestion.id;
        draft.name = suggestion.name;
        input.value = suggestion.name;
    }
    else if (suggestion.kind === 'map')
    {
        draft.existingCandidateId = null;
        draft.name = suggestion.name;
        input.value = suggestion.name;
        draft.coordinates = clonePlaceEditorCoordinates(suggestion.coordinates);
        draft.coordinateText = placeEditorCoordinateText(draft.coordinates);
        const latitude = modalBackdrop.querySelector('#placeLatitudeInput');
        const longitude = modalBackdrop.querySelector('#placeLongitudeInput');
        if (latitude) latitude.value = draft.coordinateText.latitude;
        if (longitude) longitude.value = draft.coordinateText.longitude;
        draft.disclosures.coordinates = true;
        const details = modalBackdrop.querySelector('[data-place-coordinate-details]');
        if (details) details.open = true;
        updatePlaceEditorCoordinateUi();
    }
    else
    {
        draft.existingCandidateId = null;
        draft.name = suggestion.name;
        input.value = suggestion.name;
    }
    draft.query = draft.name;
    updatePlaceEditorDraftDirty(draft);
    updatePlaceEditorSelectionNotice();
    renderPlaceEditorDuplicateWarning();
    closePlaceEditorSuggestions();
}

function useExistingPlaceFromEditor(
    placeId
)
{
    const place =
        getPlace(
            placeId
        );

    if (
        !place
        || place.projectId
          !== currentProjectId()
    )
    {
        return;
    }

    const wasEditing =
        placeEditorDraft?.mode
          === 'edit';

    const completion =
        placeEditorCompletion;

    resetPlaceEditorDraft();

    closeModal({
        force: true
    });

    if (
        completion?.onComplete
    )
    {
        showToast(
            'Existing place selected. No duplicate was created.'
        );

        requestAnimationFrame(
            () =>
            {
                completion.onComplete(
                    place,
                    {
                        usedExisting:
                  true
                    }
                );
            }
        );

        return;
    }

    state.selectedPlaceId =
        place.id;

    state.placesDetailOpen =
        false;

    renderPlaces();

    showToast(
        wasEditing
            ? 'Existing place opened. The edited place was not changed.'
            : 'Existing place selected. No duplicate was created.'
    );
}

function setPlaceEditorNameError(message = '')
{
    const input = modalBackdrop.querySelector('#placeNameInput');
    const error = modalBackdrop.querySelector('#placeNameError');
    if (error) error.textContent = message;
    input?.setAttribute('aria-invalid', String(Boolean(message)));
}

function commitPlaceEditorDraft()
{
    const draft = syncPlaceEditorDraftFromModal();
    if (!draft) return;
    const nameResult = validatePlaceEditorName(draft.name);
    if (!nameResult.valid)
    {
        setPlaceEditorNameError(nameResult.message);
        modalBackdrop.querySelector('#placeNameInput')?.focus();
        return;
    }
    draft.name = nameResult.value;
    const coordinateState = updatePlaceEditorCoordinateUi({ formatValues: true });
    if (!coordinateState?.valid)
    {
        const details = modalBackdrop.querySelector('[data-place-coordinate-details]');
        if (details) details.open = true;
        (modalBackdrop.querySelector('[aria-invalid="true"]') || modalBackdrop.querySelector('#placeLatitudeInput'))?.focus();
        return;
    }
    draft.coordinates = coordinateState.coordinates;
    draft.coordinateText = placeEditorCoordinateText(draft.coordinates);
    draft.approximateRadiusMeters = coordinateState.radiusMeters;
    draft.alternativeNames = normalizePlaceAlternativeNames(draft.alternativeNames, draft.name);
    const existing = draft.placeId ? getPlace(draft.placeId) : null;
    if (draft.mode === 'edit' && !existing)
    {
        setPlaceEditorNameError('This place is no longer available.');
        return;
    }
    const projectId = existing?.projectId || requireActiveProjectId();
    if (!projectId) return;
    const place = existing || {
        id: uniquePlaceIdFromText(draft.name),
        projectId
    };
    const coordinatesChanged = Boolean(
        existing
        && storedPlaceCoordinateKey(existing.coordinates) !== storedPlaceCoordinateKey(draft.coordinates)
    );
    const radiusChanged = Boolean(
        existing
        && (placeHasRadiusValue(existing) !== (draft.approximateRadiusMeters !== null)
            || (placeHasRadiusValue(existing)
                && Number(existing.approximateRadiusMeters) !== draft.approximateRadiusMeters))
    );
    place.name = draft.name;
    place.alternativeNames = draft.alternativeNames.slice();
    place.coordinates = clonePlaceEditorCoordinates(draft.coordinates);
    if (draft.approximateRadiusMeters !== null)
    {
        place.approximateRadiusMeters = draft.approximateRadiusMeters;
    }
    else delete place.approximateRadiusMeters;
    place.updatedAt = new Date().toISOString();
    if (coordinatesChanged || radiusChanged)
    {
        clearPlaceReviewDismissals(place.id, PLACE_REVIEW_COORDINATE_ISSUE_TYPES);
    }
    if (!existing) sampleData.places.unshift(place);
    markPrototypeSessionEdited();
    state.selectedPlaceId =
        place.id;

    const completion =
        placeEditorCompletion;

    // Newly created or repositioned places should be centered after the
    // map is rendered again. Geneograph completion callbacks are separate.
    if (!completion
        && state.activeModule === 'Places'
        && state.placesViewMode === 'map'
        && placeHasCoordinates(place))
    {
        placesMapRuntime.pendingFocusPlaceId = place.id;
    }

    resetPlaceEditorDraft();

    closeModal({
        force: true
    });

    showToast(
        existing
            ? 'Place updated.'
            : 'Place created.'
    );

    if (
        completion?.onComplete
    )
    {
        requestAnimationFrame(
            () =>
            {
                completion.onComplete(
                    place,
                    {
                        created:
                  !existing
                    }
                );
            }
        );

        return;
    }

    renderPlaces();
}

function renderPlaceEditorModal(draft)
{
    const coordinateState = readPlaceEditorCoordinateState(
        draft.coordinateText.latitude,
        draft.coordinateText.longitude
    );

    const alternativeCount = normalizePlaceAlternativeNames(
        draft.alternativeNames,
        draft.name
    ).length;

    return `
        <div
          class="modal place-editor-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="placeModalTitle"
          data-place-editor>

          <div class="modal-header">
            <div>
              <h2 id="placeModalTitle">
                ${escapeHtml(t(draft.mode === 'edit' ? 'Edit place' : 'Add place'))}
              </h2>
              <p>
                ${escapeHtml(t('Names and map position are saved together only when you confirm.'))}
              </p>
            </div>
            <button
              class="close-button"
              type="button"
              data-close
              aria-label="${escapeHtml(t('Close'))}">
              ${icon.close}
            </button>
          </div>

          <form id="placeForm" novalidate>
            <div class="modal-body form-grid place-editor-body">

              <div class="field full place-editor-place-field">
                <label for="placeNameInput">${escapeHtml(t('Place'))}</label>

                <p class="place-editor-support" id="placeNameSupport">
                  ${escapeHtml(t('Search existing places or map results, or enter a historical place name manually.'))}
                </p>

                <div class="place-editor-combobox" data-place-editor-combobox>
                  <input
                    id="placeNameInput"
                    value="${escapeHtml(placeEditorDisplayedName(draft, draft.name))}"
                    placeholder="${escapeHtml(t('e.g. Pawford, North Yorkshire, England'))}"
                    role="combobox"
                    aria-autocomplete="list"
                    aria-expanded="false"
                    aria-controls="placeEditorSuggestions"
                    aria-describedby="placeNameSupport placeNameError"
                    aria-invalid="false"
                    autocomplete="off">

                  <div
                    class="place-editor-suggestions"
                    id="placeEditorSuggestions"
                    role="listbox"
                    aria-label="${escapeHtml(t('Place suggestions'))}"
                    hidden>
                  </div>
                </div>

                <span
                  class="place-editor-field-error"
                  id="placeNameError"
                  role="alert"></span>

                <div
                  class="place-editor-duplicate"
                  data-place-duplicate-warning
                  hidden>
                </div>
              </div>

              <p
                class="place-editor-selection-notice full"
                data-place-selection-notice
                hidden>
              </p>

              <section
                class="place-map-location full"
                aria-labelledby="placeMapLocationHeading">

                <h3 id="placeMapLocationHeading">
                  ${escapeHtml(t('Map location'))}
                </h3>

                <div class="place-map-location-row">
                  <div class="place-map-status">
                    ${icon.mapPin}

                    <div class="place-map-status-copy">
                      <strong data-place-map-status></strong>
                      <span data-place-map-summary hidden></span>
                    </div>
                  </div>

                  <div class="place-map-location-actions">
                    <button
                      class="button secondary compact"
                      type="button"
                      data-place-choose-map>
                      ${escapeHtml(t(
                            coordinateState.hasCoordinates
                                ? 'Edit on map'
                                : 'Choose on map'
                        ))}
                    </button>

                    <button
                      class="place-editor-text-action"
                      type="button"
                      data-place-remove-position
                      ${coordinateState.hasAnyValue ? '' : 'hidden'}>
                      ${escapeHtml(t('Remove position'))}
                    </button>
                  </div>
                </div>

                <fieldset class="place-location-mode" data-place-location-mode
                  ${coordinateState.hasAnyValue || draft.locationMode === 'approximate' ? '' : 'hidden'}>
                  <legend>${escapeHtml(t('Position accuracy'))}</legend>
                  <div class="place-location-mode-options">
                    <label>
                      <input type="radio" name="placeLocationMode" value="exact"
                        ${draft.locationMode !== 'approximate' ? 'checked' : ''}>
                      ${escapeHtml(t('Exact point'))}
                    </label>
                    <label>
                      <input type="radio" name="placeLocationMode" value="approximate"
                        ${draft.locationMode === 'approximate' ? 'checked' : ''}>
                      ${escapeHtml(t('Approximate area'))}
                    </label>
                  </div>
                </fieldset>

                <div class="place-approximate-radius"
                  data-place-radius-field ${draft.locationMode === 'approximate' ? '' : 'hidden'}>
                  <label for="placeApproximateRadiusInput">${escapeHtml(t('Radius (km)'))}</label>
                  <input id="placeApproximateRadiusInput" type="text"
                    inputmode="decimal" autocomplete="off" spellcheck="false"
                    maxlength="16" value="${escapeHtml(draft.radiusText)}"
                    placeholder="2.5" aria-describedby="placeRadiusHelp placeRadiusError">
                  <p id="placeRadiusHelp">${escapeHtml(t('The circle marks a possible location, not a boundary.'))}</p>
                  <span class="place-coordinate-error" id="placeRadiusError"
                    role="alert" aria-live="polite"></span>
                </div>

                <p
                  class="place-coordinate-help"
                  data-place-map-unavailable
                  role="status"
                  aria-live="polite"
                  hidden></p>

                <details
                  class="field full places-editor-disclosure"
                  data-place-coordinate-details
                  ${draft.disclosures.coordinates || !coordinateState.valid ? 'open' : ''}>

                  <summary>
                    <span class="places-editor-disclosure-summary-label">
                      ${escapeHtml(t('Advanced coordinates'))}
                    </span>
                    <span class="places-editor-disclosure-chevron" aria-hidden="true">
                      ${icon.chevron}
                    </span>
                  </summary>

                  <p class="place-coordinate-help" id="placeCoordinateHelp">
                    ${escapeHtml(t('Enter decimal degrees. Latitude must be between -90 and 90; longitude must be between -180 and 180.'))}
                  </p>

                  <div class="place-coordinate-fields">
                    <label for="placeLatitudeInput">
                      ${escapeHtml(t('Latitude'))}
                      <input
                        id="placeLatitudeInput"
                        type="text"
                        inputmode="decimal"
                        autocomplete="off"
                        spellcheck="false"
                        maxlength="24"
                        value="${escapeHtml(draft.coordinateText.latitude)}"
                        placeholder="53.959400"
                        aria-describedby="placeCoordinateHelp placeCoordinateError">
                    </label>

                    <label for="placeLongitudeInput">
                      ${escapeHtml(t('Longitude'))}
                      <input
                        id="placeLongitudeInput"
                        type="text"
                        inputmode="decimal"
                        autocomplete="off"
                        spellcheck="false"
                        maxlength="24"
                        value="${escapeHtml(draft.coordinateText.longitude)}"
                        placeholder="-1.082000"
                        aria-describedby="placeCoordinateHelp placeCoordinateError">
                    </label>

                    <button
                      class="place-coordinate-copy-button"
                      type="button"
                      data-place-copy-coordinates
                      aria-label="${escapeHtml(t('Copy coordinates'))}"
                      title="${escapeHtml(t('Copy coordinates'))}"
                      ${coordinateState.hasCoordinates ? '' : 'disabled'}>
                      ${icon.copy}
                    </button>
                  </div>
                  <span
                    class="place-coordinate-error"
                    id="placeCoordinateError"
                    role="alert"
                    aria-live="polite"></span>
                </details>
              </section>

              <details
                class="field full places-editor-disclosure"
                data-place-alternative-details
                ${draft.disclosures.alternativeNames ? 'open' : ''}>

                <summary>
                  <span class="places-editor-disclosure-summary-label">
                    ${escapeHtml(t('Historical / alternative names'))}
                    <span data-place-alternative-count>
                      ${alternativeCount ? ` · ${alternativeCount}` : ''}
                    </span>
                  </span>
                  <span class="places-editor-disclosure-chevron" aria-hidden="true">
                    ${icon.chevron}
                  </span>
                </summary>

                <p class="place-editor-support">
                  ${escapeHtml(t('Enter one full historical or alternative place name per line.'))}
                </p>

                <label for="placeAlternativeNamesInput">
                  ${escapeHtml(t('Alternative names'))}
                </label>
                <textarea id="placeAlternativeNamesInput">${escapeHtml(
                    draft.alternativeNames.map(name => placeEditorDisplayedName(draft, name)).join('\n')
                )}</textarea>
              </details>

            </div>

            <div class="modal-footer">
              <button class="button secondary" type="button" data-close>
                ${escapeHtml(t('Cancel'))}
              </button>
              <button class="button primary" type="submit">
                ${escapeHtml(t(draft.mode === 'edit' ? 'Save changes' : 'Create place'))}
              </button>
            </div>
          </form>
        </div>
      `;
}

function showPlaceEditorMapFallback(message = 'Interactive mapping is unavailable. You can enter coordinates manually or save the place without a position.')
{
    const root = modalBackdrop.querySelector('[data-place-editor]');
    const status = root?.querySelector('[data-place-map-unavailable]');
    if (status)
    {
        status.hidden = false;
        status.textContent = t(message);
    }
    const details = root?.querySelector('[data-place-coordinate-details]');
    if (details) details.open = true;
}

function restorePlaceEditorReviewContext(draft)
{
    const context = draft?.reviewContext;
    if (!context) return;
    draft.reviewContext = null;
    if (state.activeModule !== 'Places') return;
    state.placesView = 'review';
    state.placesSearch = context.search;
    state.placesViewMode = context.viewMode;
    renderPlaces();
}

async function startPlaceEditorMapSelection()
{
    const draft = syncPlaceEditorDraftFromModal();
    if (!draft) return;
    if (!placesMapAdapter.supportedProtocol())
    {
        showPlaceEditorMapFallback();
        return;
    }
    const originalView = state.placesViewMode;
    if (state.placesView === 'review')
    {
        draft.reviewContext = {
            search: state.placesSearch,
            viewMode: state.placesViewMode
        };
        state.placesView = 'all';
        state.placesSearch = '';
    }
    if (!placesMapReady() || !placesMapRuntime.host?.isConnected)
    {
        const status = modalBackdrop.querySelector('[data-place-map-unavailable]');
        const button = modalBackdrop.querySelector('[data-place-choose-map]');
        if (status)
        {
            status.hidden = false;
            status.textContent = t('Loading interactive map…');
        }
        if (button) button.disabled = true;
        if (draft.reviewContext || !placesMapRuntime.host?.isConnected)
        {
            placesMapRuntime.status = 'loading';
            state.placesViewMode = 'map';
            if (draft.reviewContext) renderPlaces();
            else renderPlacesMain();
        }
        const ready = await waitForPlacesMapReady();
        if (placeEditorDraft !== draft || !modalBackdrop.querySelector('[data-place-editor]'))
        {
            restorePlaceEditorReviewContext(draft);
            return;
        }
        if (button) button.disabled = false;
        if (!ready || !placesMapReady())
        {
            if (draft.reviewContext) restorePlaceEditorReviewContext(draft);
            else if (originalView === 'list')
            {
                state.placesViewMode = 'list';
                destroyPlacesMap();
                renderPlacesMain();
            }
            showPlaceEditorMapFallback();
            return;
        }
    }
    draft.mapSession = {
        returnToModal: true,
        coordinates: clonePlaceEditorCoordinates(draft.coordinates),
        coordinateText: { ...draft.coordinateText },
        locationMode: draft.locationMode,
        radiusText: draft.radiusText,
        approximateRadiusMeters: draft.approximateRadiusMeters
    };
    clearTimeout(placeGeocoderTimer);
    placeGeocoderController?.abort();
    closeModal({ force: true, preservePlaceEditor: true });
    requestAnimationFrame(() =>
    {
        if (placeEditorDraft !== draft || state.activeModule !== 'Places') return;
        if (!placesMapReady())
        {
            restorePlaceEditorReviewContext(draft);
            openPlaceModal(draft.placeId, { draft });
            showPlaceEditorMapFallback();
            return;
        }
        if (draft.mode === 'edit') enterPlacesMapMoveMode(draft.placeId);
        else enterPlacesMapAddMode();
    });
}

function bindPlaceEditor()
{
    const draft =
        placeEditorDraft;

    const root =
        modalBackdrop.querySelector(
            '[data-place-editor]'
        );

    const input =
        root?.querySelector(
            '#placeNameInput'
        );

    if (
        !draft
        || !root
        || !input
    )
    {
        return;
    }

    /*
      * The editor focuses the Place field when the
      * modal opens. Do not treat that programmatic
      * focus as a request to open suggestions.
      */
    let suppressInitialSuggestionOpen =
        true;
    let openBeforePointer = null;

    input.addEventListener(
        'pointerdown',
        () =>
        {
            suppressInitialSuggestionOpen =
                false;
            openBeforePointer = input.getAttribute('aria-expanded') === 'true';
        }
    );

    input.addEventListener(
        'focus',
        () =>
        {
            if (
                !suppressInitialSuggestionOpen
            )
            {
                renderPlaceEditorSuggestions();
            }
        }
    );

    input.addEventListener(
        'click',
        () =>
        {
            const wasOpen = openBeforePointer;
            openBeforePointer = null;
            if (wasOpen === true)
            {
                closePlaceEditorSuggestions();
            }
            else if (input.getAttribute('aria-expanded') !== 'true')
            {
                renderPlaceEditorSuggestions();
            }
        }
    );
    input.addEventListener('input', () =>
    {
        draft.name = placeEditorCanonicalName(draft, input.value, [draft.original.name]);
        draft.query = input.value;
        draft.searchTouched = true;
        draft.selectedSuggestion = null;
        draft.existingCandidateId = null;
        draft.dismissedDuplicateId = null;
        setPlaceEditorNameError();
        updatePlaceEditorDraftDirty(draft);
        renderPlaceEditorDuplicateWarning();
        renderPlaceEditorSuggestions();
        schedulePlaceEditorMapSearch(input.value);
    });
    input.addEventListener('keydown', event =>
    {
        const count = draft.renderedSuggestions.length;
        if (event.key === 'ArrowDown' && count)
        {
            event.preventDefault();
            draft.activeSuggestionIndex = (draft.activeSuggestionIndex + 1 + count) % count;
            updatePlaceEditorActiveSuggestion();
        }
        else if (event.key === 'ArrowUp' && count)
        {
            event.preventDefault();
            draft.activeSuggestionIndex = (draft.activeSuggestionIndex - 1 + count) % count;
            updatePlaceEditorActiveSuggestion();
        }
        else if (event.key === 'Enter')
        {
            if (draft.activeSuggestionIndex >= 0)
            {
                event.preventDefault();
                selectPlaceEditorSuggestion(draft.activeSuggestionIndex);
            }
            else closePlaceEditorSuggestions();
        }
        else if (event.key === 'Escape')
        {
            event.stopPropagation();
            closePlaceEditorSuggestions();
        }
        else if (event.key === 'Tab')
        {
            closePlaceEditorSuggestions();
        }
    });
    root.querySelector('[data-place-editor-combobox]')?.addEventListener('focusout', () => setTimeout(() =>
    {
        if (!root.querySelector('[data-place-editor-combobox]')?.contains(document.activeElement)) closePlaceEditorSuggestions();
    }, 0));
    root.querySelector('#placeEditorSuggestions')?.addEventListener('mousedown', event => event.preventDefault());
    root.querySelector('#placeEditorSuggestions')?.addEventListener('click', event =>
    {
        const option = event.target.closest('[data-place-editor-option]');
        if (option) selectPlaceEditorSuggestion(option.dataset.placeEditorOption);
        if (event.target.closest('[data-place-editor-retry]')) schedulePlaceEditorMapSearch(input.value, { immediate: true });
    });
    root.querySelector('#placeAlternativeNamesInput')?.addEventListener('input', () =>
    {
        draft.dismissedDuplicateId = null;
        updatePlaceEditorAlternativeSummary();
        renderPlaceEditorDuplicateWarning();
    });
    root.querySelectorAll('details').forEach(details => details.addEventListener('toggle', () =>
    {
        if (details.matches('[data-place-alternative-details]')) draft.disclosures.alternativeNames = details.open;
        if (details.matches('[data-place-coordinate-details]')) draft.disclosures.coordinates = details.open;
    }));
    root.querySelectorAll('[name="placeLocationMode"]').forEach(input =>
    {
        input.addEventListener('change', () =>
        {
            draft.dismissedDuplicateId = null;
            updatePlaceEditorCoordinateUi();
            renderPlaceEditorDuplicateWarning();
        });
    });
    root.querySelector('#placeApproximateRadiusInput')?.addEventListener('input', () =>
    {
        draft.dismissedDuplicateId = null;
        updatePlaceEditorCoordinateUi();
        renderPlaceEditorDuplicateWarning();
    });
    root.querySelector('#placeApproximateRadiusInput')?.addEventListener('blur', () =>
        updatePlaceEditorCoordinateUi({ formatValues: true })
    );
    ['#placeLatitudeInput', '#placeLongitudeInput'].forEach(selector =>
    {
        root.querySelector(selector)?.addEventListener('input', () =>
        {
            draft.selectedSuggestion = null;
            draft.dismissedDuplicateId = null;
            updatePlaceEditorSelectionNotice();
            updatePlaceEditorCoordinateUi();
            renderPlaceEditorDuplicateWarning();
        });
        root.querySelector(selector)?.addEventListener('blur', () => updatePlaceEditorCoordinateUi({ formatValues: true }));
    });
    root.querySelector('[data-place-copy-coordinates]')?.addEventListener('click', async () =>
    {
        const result = updatePlaceEditorCoordinateUi({ formatValues: true });
        if (!result?.hasCoordinates) return;
        const text = `${result.coordinates.lat.toFixed(6)}, ${result.coordinates.lng.toFixed(6)}`;
        try
        {
            if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
            await navigator.clipboard.writeText(text);
            showToast('Coordinates copied.');
        }
        catch
        {
            showToast(text);
        }
    });
    root.querySelector('[data-place-remove-position]')?.addEventListener('click', () =>
    {
        root.querySelector('#placeLatitudeInput').value = '';
        root.querySelector('#placeLongitudeInput').value = '';
        const exact = root.querySelector('[name="placeLocationMode"][value="exact"]');
        if (exact) exact.checked = true;
        const radius = root.querySelector('#placeApproximateRadiusInput');
        if (radius) radius.value = '';

        draft.selectedSuggestion = null;
        draft.dismissedDuplicateId = null;

        updatePlaceEditorSelectionNotice();
        updatePlaceEditorCoordinateUi();
        renderPlaceEditorDuplicateWarning();

        root.querySelector('[data-place-choose-map]')?.focus({
            preventScroll: true
        });
    });
    root.querySelector('[data-place-choose-map]')?.addEventListener('click', startPlaceEditorMapSelection);
    root.querySelector('[data-place-duplicate-warning]')?.addEventListener('click', event =>
    {
        const existingId = event.target.closest('[data-place-use-existing]')
            ?.dataset.placeUseExisting;
        if (existingId && draft.mode === 'add')
        {
            useExistingPlaceFromEditor(existingId);
            return;
        }

        const ignoreId = event.target.closest('[data-place-duplicate-ignore]')
            ?.dataset.placeDuplicateIgnore;
        if (ignoreId)
        {
            draft.dismissedDuplicateId = ignoreId;
            draft.existingCandidateId = null;
            renderPlaceEditorDuplicateWarning();
            input.focus({ preventScroll: true });
            return;
        }

        const detailsButton = event.target.closest('[data-place-duplicate-details]');
        if (detailsButton)
        {
            const panel = root.querySelector('#placeDuplicateReview');
            if (panel)
            {
                panel.hidden = !panel.hidden;
                detailsButton.setAttribute('aria-expanded', String(!panel.hidden));
            }
            return;
        }

        const mergeId = event.target.closest('[data-place-review-merge]')?.dataset.placeReviewMerge;
        if (mergeId && draft.mode === 'edit')
        {
            syncPlaceEditorDraftFromModal();
            if (updatePlaceEditorDraftDirty(draft))
            {
                showToast(t('Save or discard your changes before reviewing a merge.'));
                return;
            }
            const completion = placeEditorCompletion;
            resetPlaceEditorDraft();
            closeModal({ force: true });
            openPlaceMergeModal(draft.placeId, mergeId, { onComplete: completion?.onComplete });
        }
    });
    root.querySelector('#placeForm')?.addEventListener('submit', event =>
    {
        event.preventDefault();
        commitPlaceEditorDraft();
    });
    updatePlaceEditorAlternativeSummary();
    updatePlaceEditorCoordinateUi();
    updatePlaceEditorSelectionNotice();
    renderPlaceEditorDuplicateWarning();
    requestAnimationFrame(
        () =>
        {
            input.focus({
                preventScroll: true
            });

            suppressInitialSuggestionOpen =
                false;
        }
    );
}

function openPlaceModal(
    placeId = null,
    {
        initialCoordinates = null,
        draft = null,
        completion = undefined,
        modalOpener = openModal
    } = {}
)
{
    const mode =
        placeId
            ? 'edit'
            : 'add';

    if (draft)
    {
        placeEditorDraft =
            draft;
    }
    else if (
        !placeEditorDraft
        || placeEditorDraft.mode
          !== mode
        || placeEditorDraft.placeId
          !== placeId
    )
    {
        resetPlaceEditorDraft();

        placeEditorDraft =
            createPlaceEditorDraft(
                placeId,
                {
                    initialCoordinates
                }
            );
    }
    else if (initialCoordinates)
    {
        placeEditorDraft.coordinates =
            clonePlaceEditorCoordinates(
                initialCoordinates
            );

        placeEditorDraft.coordinateText =
            placeEditorCoordinateText(
                placeEditorDraft.coordinates
            );
    }

    if (!placeEditorDraft)
    {
        return;
    }
    if (
        completion !== undefined
    )
    {
        placeEditorCompletion =
            completion;
    }

    placeEditorDraft.mapSession =
        null;

    modalOpener(
        renderPlaceEditorModal(
            placeEditorDraft
        )
    );

    bindPlaceEditor();
}

function openPlaceModalForCoordinateReview(placeId)
{
    resetPlaceEditorDraft();
    const draft = createPlaceEditorDraft(placeId);
    if (!draft) return;
    draft.disclosures.coordinates = true;
    openPlaceModal(placeId, { draft });
    requestAnimationFrame(() =>
    {
        const invalidInput = modalBackdrop.querySelector('[data-place-coordinate-details] [aria-invalid="true"]');
        (invalidInput || modalBackdrop.querySelector('#placeLatitudeInput'))?.focus({ preventScroll: true });
    });
}
function openDeletePlaceModal(placeId, { returnToEditor = false } = {})
{
    const place = getPlace(placeId); if (!place) return;
    const returnAttribute = returnToEditor && placeEditorDraft ? ' data-return-to-place-editor' : '';
    openModal(`<div class="modal" role="dialog" aria-modal="true" aria-labelledby="deletePlaceTitle" data-place-delete-confirm${returnAttribute}><div class="modal-header"><div><h2 id="deletePlaceTitle">Delete place permanently?</h2><p>This action cannot be undone.</p></div><button class="close-button" type="button" data-close aria-label="Close">${icon.close}</button></div><div class="modal-body place-delete-confirm"><strong>${escapeHtml(place.name)}</strong><ul><li>The place will no longer appear in calculated routes.</li><li>Structured links from connected records will be cleared.</li><li>Connected people, events, files, photos, and notes will remain.</li><li>Textual mentions may remain in free-text content.</li></ul></div><div class="modal-footer"><button class="button secondary" type="button" data-close>Cancel</button><button class="button danger" type="button" data-confirm-delete-place>Delete permanently</button></div></div>`);
    modalBackdrop.querySelector('[data-confirm-delete-place]')?.addEventListener('click', () =>
    {
        resetPlaceEditorDraft();
        (sampleData.boards || []).forEach(board =>
        {
            let repairedBoardPlace = updateBoardFactPlaceReferences(board, place);
            (board.diagram?.nodes || []).forEach(node =>
            {
                if (node.type !== 'place' || node.placeRef?.scope !== 'project' || node.placeRef.id !== place.id) return;
                node.placeRef = {
                    scope: 'board',
                    name: String(node.placeRef.fallbackName || placePrimaryName(place) || place.name || 'Place').trim()
                };
                repairedBoardPlace = true;
            });
            if (repairedBoardPlace) board.updatedAt = new Date().toISOString();
        });
        removeSourceLinksForTarget(
            'place',
            place.id
        );
        sampleData.places = sampleData.places.filter(item => item.id !== place.id);
        markPrototypeSessionEdited();
        sampleData.placeIssues = (sampleData.placeIssues || []).filter(issue =>
            issue.placeId !== place.id && issue.otherPlaceId !== place.id);
        sampleData.people.forEach(person => [person, person.birth, person.death, ...(person.events || []), ...(person.attributes || [])].filter(Boolean).forEach(record => clearStructuredPlaceReferences(record, place.id)));
        centralFamilyRecords().forEach(family => [family, ...(family.events || [])].forEach(record => clearStructuredPlaceReferences(record, place.id)));
        [sampleData.media, sampleData.archiveFiles, sampleData.sources, sampleData.notes].forEach(records => (records || []).forEach(record => clearStructuredPlaceReferences(record, place.id)));
        sampleData.links = sampleData.links.filter(link => !placeLinkMatches(link, place.id));
        sampleData.events =
            rebuildSampleEventsAndPruneSourceLinks();

        state.selectedPlaceId = projectPlaces()[0]?.id || null;

        closeModal();
        renderPlaces();

        showToast(
            'Place deleted permanently.'
        );
    });
}

function placeMergeLocationLabel(place)
{
    const coordinates = normalizePlaceCoordinates(place);
    const position = coordinates ? `${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}` : t('No position set');
    return `${position}${placeHasRadiusValue(place) ? ` · ${formatPlaceRadius(place.approximateRadiusMeters)}` : ''}`;
}

function placeMergeFieldText(key, value)
{
    if (key === 'coordinates')
    {
        const point = normalizePlaceCoordinates({ coordinates: value });
        return point ? `${point.lat.toFixed(6)}, ${point.lng.toFixed(6)}` : t('No position set');
    }
    if (key === 'approximateRadiusMeters')
        return validPlaceRadiusMeters(value) ? formatPlaceRadius(value) : t('No value');
    if (Array.isArray(value)) return value.length ? value.join(', ') : t('No value');
    if (!placeMergeValuePresent(value)) return t('No value');
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
}

function openPlaceMergeModal(leftId, rightId, { onComplete = null } = {})
{
    const left = getPlace(leftId);
    const right = getPlace(rightId);
    if (!matchDuplicatePlaces(left, right) || left.projectId !== currentProjectId()) return;

    const mergeDraft = { keepId: '', fields: {} };
    const placeCard = place => `<button class="place-merge-card" type="button"
        data-place-merge-survivor="${escapeHtml(place.id)}" aria-pressed="false">
        <span class="place-merge-card-status" data-place-merge-status></span>
        <strong data-i18n-skip>${escapeHtml(place.name)}</strong>
        <small>${escapeHtml(placeMergeLocationLabel(place))}</small>
        ${placeAlternativeNames(place).length ? `<small data-i18n-skip>${escapeHtml(placeAlternativeNames(place).join(', '))}</small>` : ''}
        <small>${escapeHtml(t('Linked records'))}: ${placeReviewConnectionTotal(place)}</small>
    </button>`;

    openModal(`<div class="modal place-merge-modal" role="dialog" aria-modal="true" aria-labelledby="placeMergeTitle">
        <div class="modal-header"><div><h2 id="placeMergeTitle">${escapeHtml(t('Merge places'))}</h2>
        <p>${escapeHtml(t('Choose the Place to keep. The other Place will be removed permanently and its links redirected.'))}</p></div>
        <button class="close-button" type="button" data-close aria-label="${escapeHtml(t('Close'))}">${icon.close}</button></div>
        <div class="modal-body">
            <div class="place-merge-pair" role="group" aria-label="${escapeHtml(t('Keep this place'))}">
                ${placeCard(left)}${placeCard(right)}
            </div>
            <div class="place-merge-fields" data-place-merge-fields></div>
        </div>
        <div class="modal-footer">
            <button class="button secondary" type="button" data-close>${escapeHtml(t('Cancel'))}</button>
            <button class="button danger" type="button" data-place-merge-confirm disabled>${escapeHtml(t('Merge places'))}</button>
        </div></div>`);

    const root = modalBackdrop.querySelector('.place-merge-modal');
    const host = root.querySelector('[data-place-merge-fields]');
    const confirm = root.querySelector('[data-place-merge-confirm]');
    const fieldKeys = ['name', 'alternativeNames', 'coordinates', 'approximateRadiusMeters',
        ...placeMergeEditableFieldKeys(left, right)];
    const fieldLabel = key => ({
        name: 'Place', alternativeNames: 'Historical / alternative names',
        coordinates: 'Map location', approximateRadiusMeters: 'Approximate radius'
    })[key] || key;
    const choicesFor = (keep, removed) =>
    {
        const fields = { ...mergeDraft.fields };
        for (const key of ['coordinates', 'approximateRadiusMeters', ...placeMergeConflictingFields(keep, removed)])
            if (!fields[key]) fields[key] = 'keep';
        return fields;
    };
    const render = () =>
    {
        root.querySelectorAll('[data-place-merge-survivor]').forEach(card =>
        {
            const selected = card.dataset.placeMergeSurvivor === mergeDraft.keepId;
            card.classList.toggle('is-selected', selected);
            card.setAttribute('aria-pressed', String(selected));
            card.querySelector('[data-place-merge-status]').textContent = !mergeDraft.keepId
                ? t('Choose to keep')
                : t(selected ? 'Selected to keep' : 'Will be merged');
        });
        const keep = mergeDraft.keepId && getPlace(mergeDraft.keepId);
        const removed = keep && getPlace(keep.id === leftId ? rightId : leftId);
        if (!keep || !removed)
        {
            host.innerHTML = `<p class="place-merge-prompt">${escapeHtml(t('Select the Place to keep to review its fields.'))}</p>`;
            confirm.disabled = true;
            return;
        }
        const fields = choicesFor(keep, removed);
        const result = placeMergeFieldResult(keep, removed, { locationChoice: 'keep', fieldChoices: fields });
        const invalid = !result;
        host.innerHTML = `<h3>${escapeHtml(t('Fields to merge'))}</h3>
            ${fieldKeys.map(key =>
            {
                const current = keep[key];
                const incoming = removed[key];
                const keepLeft = keep.id === leftId;
                const copied = mergeDraft.fields[key] === 'remove';
                const different = JSON.stringify(current ?? null) !== JSON.stringify(incoming ?? null);
                const autoFilled = !placeMergeValuePresent(current) && placeMergeValuePresent(incoming);
                const value = result ? result[key] : copied || autoFilled ? incoming : current;
                const copyLabel = `${t('Copy to surviving place')}: ${t(fieldLabel(key))}`;
                const resetLabel = `${t('Keep original value')}: ${t(fieldLabel(key))}`;
                const canCopy = different && !(autoFilled && !copied)
                    && (key !== 'name' || placeMergeValuePresent(incoming));
                const valueCell = (place, destination) => `<div class="place-merge-value ${destination ? `is-survivor ${copied || autoFilled ? 'is-updated' : ''}` : ''}"
                    ${destination ? `data-place-merge-destination="${escapeHtml(key)}" aria-live="polite"` : ''} data-i18n-skip>
                    ${escapeHtml(placeMergeFieldText(key, destination ? value : place[key]))}
                </div>`;
                return `<section class="place-merge-field" data-place-merge-field="${escapeHtml(key)}">
                    <h4>${escapeHtml(t(fieldLabel(key)))}</h4>
                    <div class="place-merge-field-values">
                        ${valueCell(left, keepLeft)}
                        <div class="place-merge-transfer">
                            <button class="gr-transfer ${keepLeft ? 'is-left' : ''} ${copied ? 'is-selected' : ''}"
                                type="button" data-place-merge-copy="${escapeHtml(key)}"
                                aria-label="${escapeHtml(copyLabel)}" title="${escapeHtml(copyLabel)}"
                                aria-pressed="${copied}" ${canCopy ? '' : 'disabled'}>${icon.arrow}</button>
                            ${copied ? `<button class="gr-reset-icon" type="button"
                                data-place-merge-reset="${escapeHtml(key)}"
                                aria-label="${escapeHtml(resetLabel)}" title="${escapeHtml(resetLabel)}">${icon.undo}</button>` : ''}
                        </div>
                        ${valueCell(right, !keepLeft)}
                    </div>
                </section>`;
            }).join('')}
            ${invalid ? `<p class="place-merge-error" role="alert">${escapeHtml(t('The chosen location and radius are incompatible. Adjust the arrows before merging.'))}</p>` : ''}`;
        confirm.disabled = invalid;
    };

    root.addEventListener('click', event =>
    {
        const card = event.target.closest('[data-place-merge-survivor]');
        if (card)
        {
            mergeDraft.keepId = card.dataset.placeMergeSurvivor;
            mergeDraft.fields = {};
            render();
            card.focus({ preventScroll: true });
            return;
        }
        const copy = event.target.closest('[data-place-merge-copy]');
        const reset = event.target.closest('[data-place-merge-reset]');
        if (copy || reset)
        {
            const key = (copy || reset).dataset.placeMergeCopy || reset?.dataset.placeMergeReset;
            if (reset) delete mergeDraft.fields[key];
            else mergeDraft.fields[key] = 'remove';
            render();
            root.querySelector(`[data-place-merge-copy="${CSS.escape(key)}"]`)?.focus({ preventScroll: true });
        }
    });
    confirm.addEventListener('click', () =>
    {
        const keepId = mergeDraft.keepId;
        const removeId = keepId === leftId ? rightId : leftId;
        const keep = getPlace(keepId);
        const removed = getPlace(removeId);
        if (!keep || !removed || !matchDuplicatePlaces(keep, removed)
            || keep.projectId !== currentProjectId())
        {
            showToast(t('These places are no longer available for merging.'));
            return;
        }
        const fields = choicesFor(keep, removed);
        if (!placeMergeFieldResult(keep, removed, { locationChoice: 'keep', fieldChoices: fields })
            || !mergeSavedPlaces(keepId, removeId, { locationChoice: 'keep', fieldChoices: fields }))
        {
            showToast(t('These places could not be merged.'));
            render();
            return;
        }
        closeModal({ force: true });
        if (state.activeModule === 'Places') renderPlaces();
        if (onComplete) requestAnimationFrame(() => onComplete(getPlace(keepId), { merged: true }));
        showToast(t('Places merged.'));
    });
    render();
}

