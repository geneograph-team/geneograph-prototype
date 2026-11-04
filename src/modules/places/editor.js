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
        return { empty: false, valid: false, value: null, formatted: '', message: `${label} must use decimal degrees, for example ${example}.` };
    }
    const number = Number(normalized);
    if (!Number.isFinite(number))
    {
        return { empty: false, valid: false, value: null, formatted: '', message: `${label} must be a valid number.` };
    }
    if (number < minimum || number > maximum)
    {
        return { empty: false, valid: false, value: null, formatted: '', message: `${label} must be between ${minimum} and ${maximum}.` };
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

function createPlaceEditorDraft(placeId = null, { initialCoordinates = null } = {})
{
    const existing = placeId ? getPlace(placeId) : null;
    const coordinates = clonePlaceEditorCoordinates(initialCoordinates || existing?.coordinates);
    const alternativeNames = placeAlternativeNames(existing).slice();
    const coordinateText = initialCoordinates
        ? placeEditorCoordinateText(coordinates)
        : placeEditorCoordinateTextFromStored(existing?.coordinates);
    const original = {
        name: existing?.name || '',
        alternativeNames: alternativeNames.slice(),
        coordinates: clonePlaceEditorCoordinates(existing?.coordinates),
        coordinateText: placeEditorCoordinateTextFromStored(existing?.coordinates)
    };
    return {
        mode: existing ? 'edit' : 'add',
        placeId: existing?.id || null,
        name: existing?.name || '',
        alternativeNames,
        coordinates,
        coordinateText,
        original,
        dirty: Boolean(initialCoordinates && !existing),
        selectedSuggestion: null,
        existingCandidateId: null,
        duplicateOverride: false,
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
        coordinateText: draft.coordinateText
    });
}

function updatePlaceEditorDraftDirty(draft = placeEditorDraft)
{
    if (!draft) return false;
    draft.dirty = placeEditorDraftPersonalityKey(draft) !== JSON.stringify({
        name: draft.original.name,
        alternativeNames: draft.original.alternativeNames,
        coordinateText: draft.original.coordinateText
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
    draft.name = root.querySelector('#placeNameInput')?.value || '';
    draft.query = draft.name;
    draft.alternativeNames = (root.querySelector('#placeAlternativeNamesInput')?.value || '').split('\n');
    draft.coordinateText = {
        latitude: root.querySelector('#placeLatitudeInput')?.value || '',
        longitude: root.querySelector('#placeLongitudeInput')?.value || ''
    };
    const coordinateState = readPlaceEditorCoordinateState(draft.coordinateText.latitude, draft.coordinateText.longitude);
    draft.coordinates = coordinateState.hasCoordinates ? coordinateState.coordinates : null;
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
    const manual = { kind: 'manual', id: 'manual', name: entered };
    const manualIndex = suggestions.push(manual) - 1;
    html += '<div class="place-editor-suggestion-group" role="presentation"><span>Use entered text</span></div>';
    html += `<button class="place-editor-suggestion manual" id="placeEditorOption${manualIndex}" type="button" role="option" aria-selected="false" data-place-editor-option="${manualIndex}">${icon.edit}<span><strong>Use “${escapeHtml(entered)}” as entered</strong><small>Keep a historical or custom place name</small></span></button>`;
    draft.renderedSuggestions = suggestions;
    draft.activeSuggestionIndex = Math.min(draft.activeSuggestionIndex, suggestions.length - 1);
    list.innerHTML = html;
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
    renderPlaceEditorSuggestions();
}

function schedulePlaceEditorMapSearch(query, { immediate = false } = {})
{
    const draft = placeEditorDraft;
    if (!draft) return;
    clearTimeout(placeGeocoderTimer);
    placeGeocoderTimer = null;
    placeGeocoderController?.abort();
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
    placeGeocoderTimer = setTimeout(() => searchPlaceEditorMapResults(value, { retry: immediate }), immediate ? 0 : PLACE_EDITOR_GEOCODER_DEBOUNCE_MS);
}

function placeEditorNameSimilarity(left, right)
{
    const a = normalizePlaceLookupText(left);
    const b = normalizePlaceLookupText(right);
    if (!a || !b) return 0;
    if (a === b) return 1;
    const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
    for (let i = 1; i <= a.length; i += 1)
    {
        const current = [i];
        for (let j = 1; j <= b.length; j += 1)
        {
            current[j] = Math.min(current[j - 1] + 1, previous[j] + 1, previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        }
        previous.splice(0, previous.length, ...current);
    }
    return 1 - previous[b.length] / Math.max(a.length, b.length);
}

function placeEditorCoordinateDistanceKm(left, right)
{
    if (!clonePlaceEditorCoordinates(left) || !clonePlaceEditorCoordinates(right)) return Infinity;
    const radians = value => value * Math.PI / 180;
    const latDelta = radians(right.lat - left.lat);
    const lngDelta = radians(right.lng - left.lng);
    const a = Math.sin(latDelta / 2) ** 2 + Math.cos(radians(left.lat)) * Math.cos(radians(right.lat)) * Math.sin(lngDelta / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function findPlaceEditorDuplicate(draft = placeEditorDraft)
{
    if (!draft) return null;
    if (draft.existingCandidateId)
    {
        const place = getPlace(draft.existingCandidateId);
        if (place && place.id !== draft.placeId && !place.deleted && place.projectId === currentProjectId())
        {
            return {
                place,
                exact: true,
                similar: true,
                close: placeEditorCoordinateDistanceKm(draft.coordinates, place.coordinates) <= PLACE_EDITOR_CLOSE_COORDINATE_KM,
                alternativeConflict: placeAlternativeNames(place).some(name => normalizePlaceLookupText(name) === normalizePlaceLookupText(draft.name))
            };
        }
    }
    const canonical = normalizePlaceLookupText(draft.name);
    const alternatives = normalizePlaceAlternativeNames(draft.alternativeNames, draft.name);
    let best = null;
    projectPlaces().filter(place => place.id !== draft.placeId).forEach(place =>
    {
        const names = [place.name, ...placeAlternativeNames(place)];
        const exact = names.some(name => normalizePlaceLookupText(name) === canonical);
        const alternativeConflict = alternatives.some(alternative => names.some(name => normalizePlaceLookupText(name) === normalizePlaceLookupText(alternative)));
        const similarity = Math.max(...names.map(name => placeEditorNameSimilarity(draft.name, name)));
        const distance = placeEditorCoordinateDistanceKm(draft.coordinates, place.coordinates);
        const close = distance <= PLACE_EDITOR_CLOSE_COORDINATE_KM;
        const likely = exact || alternativeConflict || similarity >= 0.88 || close || (similarity >= 0.72 && distance <= 2);
        if (!likely) return;
        const score = (exact ? 100 : 0) + (alternativeConflict ? 80 : 0) + similarity * 20 + (close ? 30 : 0);
        if (!best || score > best.score) best = { place, exact, alternativeConflict, similar: similarity >= 0.88, similarity, close, distance, score };
    });
    return best;
}

function renderPlaceEditorDuplicateWarning({ force = false } = {})
{
    if (document.querySelector('[data-place-duplicate-menu]'))
    {
        closeMenu();
    }
    const draft = placeEditorDraft;
    const host = modalBackdrop.querySelector('[data-place-duplicate-warning]');

    if (!draft || !host) return null;

    const duplicate = findPlaceEditorDuplicate(draft);

    if (
        !duplicate
        || (!force && duplicate.place.id === draft.dismissedDuplicateId)
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

    const reasons = [
        duplicate.exact ? 'The entered name matches this place.' : '',
        duplicate.alternativeConflict
            ? 'An alternative name conflicts with this place.'
            : '',
        duplicate.similar && !duplicate.exact
            ? 'The names are very similar.'
            : '',
        duplicate.close ? 'The map positions are very close.' : ''
    ].filter(Boolean);

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
        </div>

        <div class="place-duplicate-name" data-i18n-skip>
          ${escapeHtml(place.name)}
        </div>

        <p>${escapeHtml(reasons.map(reason => t(reason)).join(' '))}</p>

        <button
          class="button ghost compact icon-only place-duplicate-more"
          type="button"
          data-place-duplicate-more="${escapeHtml(place.id)}"
          aria-label="${escapeHtml(t('More actions'))}"
          title="${escapeHtml(t('More actions'))}"
          aria-haspopup="menu"
          aria-expanded="false">
          ${icon.more}
        </button>

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

          ${draft.mode === 'add' ? `
            <button
              class="button secondary compact"
              type="button"
              data-place-use-existing="${escapeHtml(place.id)}">
              ${escapeHtml(t('Use existing place'))}
            </button>
          ` : ''}
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
    draft.alternativeNames = textarea.value.split('\n');
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

    const result = readPlaceEditorCoordinateState(
        latitudeInput.value,
        longitudeInput.value
    );

    if (formatValues)
    {
        if (result.latitude.valid) latitudeInput.value = result.latitude.formatted;
        if (result.longitude.valid) longitudeInput.value = result.longitude.formatted;
    }

    draft.coordinateText = {
        latitude: latitudeInput.value,
        longitude: longitudeInput.value
    };
    draft.coordinates = result.hasCoordinates ? result.coordinates : null;

    latitudeInput.setAttribute('aria-invalid', String(
        result.hasAnyValue && (result.latitude.empty || !result.latitude.valid)
    ));
    longitudeInput.setAttribute('aria-invalid', String(
        result.hasAnyValue && (result.longitude.empty || !result.longitude.valid)
    ));

    const error = root.querySelector('#placeCoordinateError');
    if (error) error.textContent = translateText(result.message || '');

    const copy = root.querySelector('[data-place-copy-coordinates]');
    if (copy) copy.disabled = !result.hasCoordinates;

    const remove = root.querySelector('[data-place-remove-position]');
    if (remove) remove.hidden = !result.hasAnyValue;

    const choose = root.querySelector('[data-place-choose-map]');
    if (choose)
    {
        choose.textContent = t(
            result.hasCoordinates ? 'Edit on map' : 'Choose on map'
        );
    }

    const status = root.querySelector('[data-place-map-status]');
    if (status)
    {
        status.textContent = t(
            result.hasCoordinates
                ? 'Position set'
                : result.hasAnyValue
                    ? 'Coordinates need attention'
                    : 'No position set'
        );
    }

    const summary = root.querySelector('[data-place-map-summary]');
    if (summary)
    {
        summary.hidden = !result.hasCoordinates;
        summary.textContent = result.hasCoordinates
            ? `${result.coordinates.lat.toFixed(6)}, ${result.coordinates.lng.toFixed(6)}`
            : '';
    }

    const details = root.querySelector('[data-place-coordinate-details]');
    if (!result.valid && details)
    {
        details.open = true;
        draft.disclosures.coordinates = true;
    }

    updatePlaceEditorDraftDirty(draft);
    return result;
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
    draft.duplicateOverride = false;
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
        || place.deleted
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

function commitPlaceEditorDraft({ allowDuplicate = false } = {})
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
    draft.alternativeNames = normalizePlaceAlternativeNames(draft.alternativeNames, draft.name);
    const duplicate = findPlaceEditorDuplicate(draft);
    if (duplicate && !(allowDuplicate || draft.duplicateOverride))
    {
        draft.existingCandidateId = duplicate.place.id;
        renderPlaceEditorDuplicateWarning({ force: true });
        modalBackdrop.querySelector('[data-place-duplicate-warning]')?.scrollIntoView({ block: 'nearest' });
        return;
    }
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
        projectId,
        deleted: false
    };
    const coordinatesChanged = Boolean(
        existing
        && storedPlaceCoordinateKey(existing.coordinates) !== storedPlaceCoordinateKey(draft.coordinates)
    );
    place.name = draft.name;
    place.alternativeNames = draft.alternativeNames.slice();
    place.coordinates = clonePlaceEditorCoordinates(draft.coordinates);
    place.updatedAt = new Date().toISOString();
    if (coordinatesChanged)
    {
        clearPlaceReviewDismissals(place.id, PLACE_REVIEW_COORDINATE_ISSUE_TYPES);
    }
    if (!existing) sampleData.places.unshift(place);
    state.selectedPlaceId =
        place.id;

    const completion =
        placeEditorCompletion;

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
                    value="${escapeHtml(draft.name)}"
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
                    draft.alternativeNames.join('\n')
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

function startPlaceEditorMapSelection()
{
    const draft = syncPlaceEditorDraftFromModal();
    if (!draft) return;
    draft.mapSession = {
        returnToModal: true,
        coordinates: clonePlaceEditorCoordinates(draft.coordinates),
        coordinateText: { ...draft.coordinateText }
    };
    clearTimeout(placeGeocoderTimer);
    placeGeocoderController?.abort();
    closeModal({ force: true, preservePlaceEditor: true });
    state.placesViewMode = 'map';
    renderPlacesMain();
    requestAnimationFrame(() => requestAnimationFrame(() =>
    {
        if (draft.mode === 'edit') enterPlacesMapMoveMode(draft.placeId);
        else enterPlacesMapAddMode();
    }));
}

function openPlaceDuplicateMenu(anchor, placeId)
{
    const root = anchor.closest('[data-place-editor]');
    const draft = placeEditorDraft;

    if (!root || !draft) return;

    if (
        document.querySelector('[data-place-duplicate-menu]')
        && menuLifecycleAnchor === anchor
    )
    {
        closeMenu();
        return;
    }

    closeMenu();

    const menu = document.createElement('div');
    menu.id = 'projectMenu';
    menu.className = 'menu-popover';
    menu.dataset.placeDuplicateMenu = '';
    menu.setAttribute('role', 'menu');
    menu.setAttribute('aria-label', t('More actions'));

    menu.innerHTML = `
        <button
          type="button"
          role="menuitem"
          data-duplicate-action="details">
          ${escapeHtml(t('Place details'))}
        </button>

        <button
          type="button"
          role="menuitem"
          data-duplicate-action="ignore">
          ${escapeHtml(t('Ignore'))}
        </button>
      `;

    // Keep the menu inside the modal's focus boundary,
    // but outside its scrolling content.
    modalBackdrop.appendChild(menu);

    const rect = anchor.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();

    const left = Math.max(
        12,
        Math.min(rect.right - menuRect.width,
            window.innerWidth - menuRect.width - 12)
    );

    const preferredTop = rect.bottom + 6;
    const top = preferredTop + menuRect.height <= window.innerHeight - 12
        ? preferredTop
        : Math.max(12, rect.top - menuRect.height - 6);

    menu.style.left = `${left}px`;
    menu.style.top = `${top}px`;

    anchor.setAttribute('aria-expanded', 'true');
    bindMenuLifecycle(anchor);

    menu.addEventListener('click', event =>
    {
        const action = event.target.closest('[data-duplicate-action]')
            ?.dataset.duplicateAction;

        if (!action) return;

        closeMenu();

        if (!root.isConnected || placeEditorDraft !== draft) return;

        if (action === 'details')
        {
            const panel = root.querySelector('#placeDuplicateReview');
            if (panel) panel.hidden = !panel.hidden;

            anchor.focus({ preventScroll: true });
            return;
        }

        if (action === 'ignore')
        {
            draft.dismissedDuplicateId = placeId;
            draft.existingCandidateId = null;
            draft.duplicateOverride = true;

            renderPlaceEditorDuplicateWarning();

            root.querySelector('[data-place-choose-map]')?.focus({
                preventScroll: true
            });
        }
    });

    const items = [...menu.querySelectorAll('[role="menuitem"]')];

    menu.addEventListener('keydown', event =>
    {
        const index = items.indexOf(document.activeElement);
        let next;

        if (event.key === 'ArrowDown') next = (index + 1) % items.length;
        else if (event.key === 'ArrowUp')
        {
            next = (index - 1 + items.length) % items.length;
        }
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = items.length - 1;
        else if (event.key === 'Tab')
        {
            event.preventDefault();
            closeMenu();
            anchor.focus({ preventScroll: true });
            return;
        }
        else
        {
            return;
        }

        event.preventDefault();
        items[next].focus({ preventScroll: true });
    });

    items[0]?.focus({ preventScroll: true });
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
        draft.name = input.value;
        draft.query = input.value;
        draft.searchTouched = true;
        draft.selectedSuggestion = null;
        draft.existingCandidateId = null;
        draft.duplicateOverride = false;
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
            event.preventDefault();
            if (draft.activeSuggestionIndex >= 0) selectPlaceEditorSuggestion(draft.activeSuggestionIndex);
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
        draft.duplicateOverride = false;
        updatePlaceEditorAlternativeSummary();
        renderPlaceEditorDuplicateWarning();
    });
    root.querySelectorAll('details').forEach(details => details.addEventListener('toggle', () =>
    {
        if (details.matches('[data-place-alternative-details]')) draft.disclosures.alternativeNames = details.open;
        if (details.matches('[data-place-coordinate-details]')) draft.disclosures.coordinates = details.open;
    }));
    ['#placeLatitudeInput', '#placeLongitudeInput'].forEach(selector =>
    {
        root.querySelector(selector)?.addEventListener('input', () =>
        {
            draft.selectedSuggestion = null;
            draft.dismissedDuplicateId = null;
            draft.duplicateOverride = false;
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

        draft.selectedSuggestion = null;
        draft.duplicateOverride = false;
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
        const moreButton = event.target.closest('[data-place-duplicate-more]');

        if (moreButton)
        {
            openPlaceDuplicateMenu(
                moreButton,
                moreButton.dataset.placeDuplicateMore
            );
            return;
        }

        const existingId = event.target.closest('[data-place-use-existing]')
            ?.dataset.placeUseExisting;

        if (existingId && draft.mode === 'add')
        {
            useExistingPlaceFromEditor(existingId);
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
            let repairedBoardPlace = false;
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
        sampleData.placeIssues = (sampleData.placeIssues || []).filter(issue => issue.placeId !== place.id);
        sampleData.people.forEach(person => [person, person.birth, person.death, ...(person.events || []), ...(person.attributes || [])].filter(Boolean).forEach(record => clearStructuredPlaceReferences(record, place.id)));
        centralFamilyRecords().forEach(family => [family, ...(family.events || [])].forEach(record => clearStructuredPlaceReferences(record, place.id)));
        [sampleData.media, sampleData.archiveFiles, sampleData.sources, sampleData.notes].forEach(records => (records || []).forEach(record => clearStructuredPlaceReferences(record, place.id)));
        sampleData.links = sampleData.links.filter(link => !placeLinkMatches(link, place.id));
        sampleData.events =
            rebuildSampleEventsAndPruneSourceLinks();

        state.selectedPlaceId =
            projectPlaces()
                .find(item =>
                    !item.deleted
                )
                ?.id
          || null;

        closeModal();
        renderPlaces();

        showToast(
            'Place deleted permanently.'
        );
    });
}
