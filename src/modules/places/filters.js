function projectPlaces(projectId = currentProjectId())
{
    return (sampleData.places || []).filter(place => place.projectId === projectId);
}

function placeSavedFiltersForProject(
    projectId = currentProjectId()
)
{
    return (
        sampleData.placeSavedFilters || []
    ).filter(savedFilter =>
        savedFilter.projectId === projectId
    );
}

function placeSavedFilterById(savedFilterId)
{
    return placeSavedFiltersForProject()
        .find(savedFilter =>
            savedFilter.id === savedFilterId
        ) || null;
}

function uniquePlaceSavedFilterId()
{
    const usedIds = new Set(
        (
            sampleData.placeSavedFilters || []
        ).map(savedFilter =>
            savedFilter.id
        )
    );

    let index = Date.now();
    let id = `place-saved-filter-${index}`;

    while (usedIds.has(id))
    {
        index += 1;
        id = `place-saved-filter-${index}`;
    }

    return id;
}

function placeFiltersWithDefaults(
    filters = state.placesFilters
)
{
    const source =
        filters && typeof filters === 'object'
            ? filters
            : {};

    return {
        personId:
          String(
              source.personId || ''
          ).trim(),

        surname:
          String(
              source.surname || ''
          ).trim(),

        yearFrom:
          String(
              source.yearFrom || ''
          ).trim(),

        yearTo:
          String(
              source.yearTo || ''
          ).trim(),

        eventType:
          String(
              source.eventType || ''
          ).trim(),

        country:
          String(
              source.country || ''
          ).trim(),

        mapped:
          [
              'all',
              'mapped',
              'unmapped'
          ].includes(source.mapped)
              ? source.mapped
              : 'all'
    };
}

function projectPeopleForPlaceFilters()
{
    return (
        sampleData.people || []
    )
        .filter(person =>
            person.projectId === currentProjectId()
        )
        .sort((a, b) =>
            placeFilterPersonName(a)
                .localeCompare(
                    placeFilterPersonName(b)
                )
        );
}

function placeFilterPersonName(person)
{
    return (
        formatPersonFullName(person)
        || person?.name
        || 'Unnamed person'
    );
}

function placeFilterPersonSurname(person)
{
    return String(
        person?.names?.last
        || person?.surname
        || ''
    ).trim();
}

function placeFilterSurnames()
{
    return [
        ...new Set(
            projectPeopleForPlaceFilters()
                .map(placeFilterPersonSurname)
                .filter(Boolean)
        )
    ].sort((a, b) =>
        a.localeCompare(b)
    );
}

function placeFilterCountries()
{
    return [
        ...new Set(
            projectPlaces()
                .map(place =>
                    placeCountry(place)
                )
                .filter(Boolean)
        )
    ].sort((a, b) =>
        a.localeCompare(b)
    );
}

const placeEventTypeLabels =
    Object.freeze({
        birth: 'Birth',
        childBirth: 'Birth of child',
        marriage: 'Marriage',
        death: 'Death',
        baptism: 'Baptism',
        burial: 'Burial',
        education: 'Education',
        occupation: 'Occupation',
        customFact: 'Other fact'
    });

function placeEventTypeLabel(type)
{
    if (!type)
    {
        return 'Other event';
    }

    if (placeEventTypeLabels[type])
    {
        return placeEventTypeLabels[type];
    }

    return String(type)
        .replace(
            /([a-z])([A-Z])/g,
            '$1 $2'
        )
        .replace(
            /^./,
            character =>
                character.toUpperCase()
        );
}

function placeFilterEventTypes()
{
    const types = new Map();

    (
        sampleData.events || []
    )
        .filter(event =>
            event.projectId
            === currentProjectId()
          && event.placeId
        )
        .forEach(event =>
        {
            const type =
                String(
                    event.type || ''
                ).trim();

            if (type)
            {
                types.set(
                    type,
                    placeEventTypeLabel(type)
                );
            }
        });

    return [
        ...types.entries()
    ].sort((a, b) =>
        a[1].localeCompare(b[1])
    );
}

function placeFilterOption(
    value,
    label,
    selectedValue
)
{
    return `
        <option
          value="${escapeHtml(value)}"
          ${
                value === selectedValue
                    ? 'selected'
                    : ''
            }>
          ${escapeHtml(label)}
        </option>
      `;
}

function renderPlaceFilterFields(
    filters = defaultPlaceFilters,
    prefix = 'place-filter'
)
{
    const normalized =
        placeFiltersWithDefaults(filters);

    const peopleOptions =
        projectPeopleForPlaceFilters()
            .map(person =>
                placeFilterOption(
                    person.id,
                    placeFilterPersonName(person),
                    normalized.personId
                )
            )
            .join('');

    const surnameOptions =
        placeFilterSurnames()
            .map(surname =>
                placeFilterOption(
                    surname,
                    surname,
                    normalized.surname
                )
            )
            .join('');

    const eventTypeOptions =
        placeFilterEventTypes()
            .map(([type, label]) =>
                placeFilterOption(
                    type,
                    label,
                    normalized.eventType
                )
            )
            .join('');

    const countryOptions =
        placeFilterCountries()
            .map(country =>
                placeFilterOption(
                    country,
                    country,
                    normalized.country
                )
            )
            .join('');

    return `
        <div class="people-filter-field field full">
          <label for="${prefix}-person">
            Person
          </label>

          <select
            id="${prefix}-person"
            data-place-filter-input="personId">
            ${placeFilterOption(
                '',
                'Any person',
                normalized.personId
            )}
            ${peopleOptions}
          </select>
        </div>

        <div class="people-filter-field field">
          <label for="${prefix}-surname">
            Surname
          </label>

          <select
            id="${prefix}-surname"
            data-place-filter-input="surname">
            ${placeFilterOption(
                '',
                'Any surname',
                normalized.surname
            )}
            ${surnameOptions}
          </select>
        </div>

        <div class="people-filter-field field">
          <label for="${prefix}-event-type">
            Event type
          </label>

          <select
            id="${prefix}-event-type"
            data-place-filter-input="eventType">
            ${placeFilterOption(
                '',
                'Any event',
                normalized.eventType
            )}
            ${eventTypeOptions}
          </select>
        </div>

        <div class="people-filter-field field">
          <label for="${prefix}-year-from">
            Year from
          </label>

          <input
            id="${prefix}-year-from"
            type="text"
            inputmode="numeric"
            autocomplete="off"
            maxlength="4"
            pattern="[0-9]{1,4}"
            placeholder="Any year"
            value="${escapeHtml(
                normalized.yearFrom
            )}"
            data-place-filter-input="yearFrom">
        </div>

        <div class="people-filter-field field">
          <label for="${prefix}-year-to">
            Year to
          </label>

          <input
            id="${prefix}-year-to"
            type="text"
            inputmode="numeric"
            autocomplete="off"
            maxlength="4"
            pattern="[0-9]{1,4}"
            placeholder="Any year"
            value="${escapeHtml(
                normalized.yearTo
            )}"
            data-place-filter-input="yearTo">
        </div>

        <div class="people-filter-field field">
          <label for="${prefix}-country">
            Country
          </label>

          <select
            id="${prefix}-country"
            data-place-filter-input="country">
            ${placeFilterOption(
                '',
                'Any country',
                normalized.country
            )}
            ${countryOptions}
          </select>
        </div>

        <div class="people-filter-field field">
          <label for="${prefix}-mapped">
            Map status
          </label>

          <select
            id="${prefix}-mapped"
            data-place-filter-input="mapped">

            ${placeFilterOption(
                'all',
                'All places',
                normalized.mapped
            )}

            ${placeFilterOption(
                'mapped',
                'On map',
                normalized.mapped
            )}

            ${placeFilterOption(
                'unmapped',
                'Not on map',
                normalized.mapped
            )}
          </select>
        </div>

      `;
}

function readPlaceFilterFields(root)
{
    const readValue = key =>
        root
            .querySelector(
                `[data-place-filter-input="${key}"]`
            )
            ?.value
            ?.trim()
        || '';

    return placeFiltersWithDefaults({
        personId:
          readValue('personId'),

        surname:
          readValue('surname'),

        yearFrom:
          readValue('yearFrom'),

        yearTo:
          readValue('yearTo'),

        eventType:
          readValue('eventType'),

        country:
          readValue('country'),

        mapped:
          readValue('mapped')
          || 'all'
    });
}

function resetPlaceFilterFields(root)
{
    root
        .querySelectorAll(
            '[data-place-filter-input]'
        )
        .forEach(input =>
        {
            const key =
                input.dataset
                    .placeFilterInput;

            if (input.type === 'checkbox')
            {
                input.checked =
                    Boolean(
                        defaultPlaceFilters[key]
                    );
                return;
            }

            input.value =
                defaultPlaceFilters[key]
            ?? '';
        });
}

function placeFilterYearError(filters)
{
    const normalized =
        placeFiltersWithDefaults(filters);

    const from =
        normalized.yearFrom;

    const to =
        normalized.yearTo;

    if (
        from
        && (
            !/^\d{1,4}$/.test(from)
          || Number(from) < 1
          || Number(from) > 9999
        )
    )
    {
        return 'Enter a valid starting year.';
    }

    if (
        to
        && (
            !/^\d{1,4}$/.test(to)
          || Number(to) < 1
          || Number(to) > 9999
        )
    )
    {
        return 'Enter a valid ending year.';
    }

    if (
        from
        && to
        && Number(from) > Number(to)
    )
    {
        return 'The starting year must not be later than the ending year.';
    }

    return '';
}

function activePlaceFilterEntries(
    filters = state.placesFilters
)
{
    const normalized =
        placeFiltersWithDefaults(filters);

    const entries = [];

    if (normalized.personId)
    {
        const person =
            projectPeopleForPlaceFilters()
                .find(item =>
                    item.id === normalized.personId
                );

        entries.push([
            'personId',
            'Person',
            person
                ? placeFilterPersonName(person)
                : 'Unknown person'
        ]);
    }

    if (normalized.surname)
    {
        entries.push([
            'surname',
            'Surname',
            normalized.surname
        ]);
    }

    if (
        normalized.yearFrom
        || normalized.yearTo
    )
    {
        let value = '';

        if (
            normalized.yearFrom
          && normalized.yearTo
        )
        {
            value =
                `${normalized.yearFrom}–${normalized.yearTo}`;
        }
        else if (normalized.yearFrom)
        {
            value =
                `From ${normalized.yearFrom}`;
        }
        else
        {
            value =
                `Until ${normalized.yearTo}`;
        }

        entries.push([
            'dateRange',
            'Date',
            value
        ]);
    }

    if (normalized.eventType)
    {
        entries.push([
            'eventType',
            'Event',
            placeEventTypeLabel(
                normalized.eventType
            )
        ]);
    }

    if (normalized.country)
    {
        entries.push([
            'country',
            'Country',
            normalized.country
        ]);
    }

    if (normalized.mapped === 'mapped')
    {
        entries.push([
            'mapped',
            'Map',
            'On map'
        ]);
    }

    if (
        normalized.mapped
          === 'unmapped'
    )
    {
        entries.push([
            'mapped',
            'Map',
            'Not on map'
        ]);
    }

    return entries;
}

function hasActivePlaceFilters(
    filters = state.placesFilters
)
{
    return (
        activePlaceFilterEntries(
            filters
        ).length > 0
    );
}

function activePlaceFilterCount(
    filters = state.placesFilters
)
{
    return activePlaceFilterEntries(
        filters
    ).length;
}

function renderPlacesActiveFilters()
{
    if (!hasActivePlaceFilters())
    {
        return '';
    }

    const chips =
        activePlaceFilterEntries()
            .map(([key, label, value]) => `
            <span
              class="
                filter-chip
                active-filter-chip
              ">

              <span
                class="
                  active-filter-chip-copy
                ">
                <strong>
                  ${escapeHtml(label)}:
                </strong>

                ${escapeHtml(value)}
              </span>

              <button
                class="
                  active-filter-chip-remove
                "
                type="button"
                data-places-remove-filter="${
                    escapeHtml(key)
                }"
                aria-label="Remove ${
                    escapeHtml(label)
                } filter"
                title="Remove filter">
                ${icon.close}
              </button>
            </span>
          `)
            .join('');

    return `
        <div
          class="
            people-filterbar
            places-filterbar
          "
          aria-label="Active Places filters">

          ${chips}

          <span class="active-filter-actions">
            <button
              class="text-action"
              type="button"
              id="placesClearFilters">
              Clear all
            </button>

            <button
              class="people-save-view"
              type="button"
              id="placesSaveFilter">
              Save filter
            </button>
          </span>
        </div>
      `;
}

function removePlaceFilter(key)
{
    const filters =
        placeFiltersWithDefaults();

    if (key === 'dateRange')
    {
        filters.yearFrom = '';
        filters.yearTo = '';
    }
    else if (key === 'mapped')
    {
        filters.mapped = 'all';
    }
    else if (
        Object.prototype
            .hasOwnProperty
            .call(filters, key)
    )
    {
        filters[key] = '';
    }

    state.placesFilters = filters;
    state.placesSavedFilterId =
        '';

    renderPlaces();
}

function clearPlaceFilters()
{
    state.placesFilters = {
        ...defaultPlaceFilters
    };

    state.placesSavedFilterId = '';
    renderPlaces();
    showToast(
        'Place filters cleared.'
    );
}

const PLACE_REVIEW_COORDINATE_ISSUE_TYPES = Object.freeze([
    'missing_coordinates',
    'invalid_coordinates'
]);

function placeCoordinateReviewState(place)
{
    const coordinates = place?.coordinates;
    const latitude = coordinates?.lat;
    const longitude = coordinates?.lng;
    const hasLatitude = latitude !== null && latitude !== undefined && String(latitude).trim() !== '';
    const hasLongitude = longitude !== null && longitude !== undefined && String(longitude).trim() !== '';

    if (placeHasInvalidRadius(place))
    {
        return { missing: false, invalid: true };
    }
    if (!hasLatitude && !hasLongitude)
    {
        return { missing: !placeHasRadiusValue(place), invalid: placeHasRadiusValue(place) };
    }

    return {
        missing: false,
        invalid: !hasLatitude || !hasLongitude || !validLatitude(latitude) || !validLongitude(longitude)
    };
}

function placeReviewConnectionCount(placeId)
{
    return Object.values(getPlaceConnectionCounts(placeId))
        .reduce((total, count) => total + Number(count || 0), 0);
}

function placeDuplicateContextsConflict(left, right)
{
    const context = value => String(value || '').split(',').slice(1)
        .map(normalizePlaceLookupText).filter(Boolean);
    const a = context(left);
    const b = context(right);
    const sharedDepth = Math.min(a.length, b.length);
    for (let depth = 1; depth <= sharedDepth; depth += 1)
    {
        if (a[a.length - depth] !== b[b.length - depth]) return true;
    }
    return false;
}

function placeDuplicateNameSimilarity(left, right)
{
    if (placeDuplicateContextsConflict(left, right)) return 0;
    const a = normalizePlaceLookupText(String(left || '').split(',')[0]);
    const b = normalizePlaceLookupText(String(right || '').split(',')[0]);
    if (!a || !b) return 0;
    if (a === b) return 1;
    const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
    for (let i = 1; i <= a.length; i += 1)
    {
        const current = [i];
        for (let j = 1; j <= b.length; j += 1)
            current[j] = Math.min(current[j - 1] + 1, previous[j] + 1, previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        previous.splice(0, previous.length, ...current);
    }
    return 1 - previous[b.length] / Math.max(a.length, b.length);
}

function placeDuplicatePairKey(leftId, rightId)
{
    return [leftId, rightId].sort().join('|');
}

function placeDuplicateFingerprint(place)
{
    const coordinates = normalizePlaceCoordinates(place);
    return JSON.stringify([
        normalizePlaceLookupText(place.name),
        normalizePlaceAlternativeNames(place.alternativeNames, place.name)
            .map(normalizePlaceLookupText).sort(),
        coordinates?.lat ?? null,
        coordinates?.lng ?? null,
        placeHasRadiusValue(place) ? Number(place.approximateRadiusMeters) : null
    ]);
}

function matchDuplicatePlaces(left, right)
{
    if (!left || !right || left.id === right.id || left.projectId !== right.projectId) return null;
    // A shared locality name does not imply the same Place across regions.
    if (placeDuplicateContextsConflict(left.name, right.name)) return null;
    const leftNames = [left.name, ...placeAlternativeNames(left)];
    const rightNames = [right.name, ...placeAlternativeNames(right)];
    const leftName = normalizePlaceLookupText(left.name);
    const rightName = normalizePlaceLookupText(right.name);
    const exact = Boolean(leftName && leftName === rightName);
    const alias = leftNames.some(name => rightNames.some(other =>
        normalizePlaceLookupText(name) && normalizePlaceLookupText(name) === normalizePlaceLookupText(other))) && !exact;
    const similarity = Math.max(0, ...leftNames.flatMap(name => rightNames.map(other => placeDuplicateNameSimilarity(name, other))));
    const leftCoordinates = normalizePlaceCoordinates(left);
    const rightCoordinates = normalizePlaceCoordinates(right);
    const distanceKm = leftCoordinates && rightCoordinates
        ? placeDistanceMeters(leftCoordinates, rightCoordinates) / 1000 : Infinity;
    const close = distanceKm <= PLACE_EDITOR_CLOSE_COORDINATE_KM;
    if (!(exact || alias || similarity >= 0.88 || (similarity >= 0.72 && distanceKm <= 2))) return null;
    const reasons = [
        exact ? 'The names match.' : '',
        alias ? 'An alternative name matches.' : '',
        similarity >= 0.88 && !exact && !alias ? 'The names are very similar.' : '',
        similarity >= 0.72 && similarity < 0.88 ? 'The names are similar and the map positions are close.' : '',
        close ? 'The map positions are very close.' : ''
    ].filter(Boolean);
    return { exact, alias, similar: similarity >= 0.88, close, similarity, distanceKm, reasons,
        score: (exact ? 100 : 0) + (alias ? 80 : 0) + similarity * 20 + (close ? 30 : 0) };
}

function getPlaceDuplicatePairs(projectId = currentProjectId())
{
    const places = projectPlaces(projectId);
    const pairs = [];
    for (let i = 0; i < places.length; i += 1)
        for (let j = i + 1; j < places.length; j += 1)
        {
            const match = matchDuplicatePlaces(places[i], places[j]);
            if (match) pairs.push({ left: places[i], right: places[j], key: placeDuplicatePairKey(places[i].id, places[j].id), ...match });
        }
    return pairs.sort((a, b) => b.score - a.score || a.key.localeCompare(b.key));
}

function placeDuplicateDismissal(pair)
{
    return (sampleData.placeIssues || []).find(issue => issue.projectId === pair.left.projectId
        && issue.type === 'possible_duplicate' && issue.pairKey === pair.key
        && issue.status === 'dismissed'
        && issue.fingerprints?.[pair.left.id] === placeDuplicateFingerprint(pair.left)
        && issue.fingerprints?.[pair.right.id] === placeDuplicateFingerprint(pair.right)) || null;
}

function dismissPlaceDuplicatePair(pair)
{
    if (!pair) return false;
    const current = getPlaceDuplicatePairs(pair.left.projectId).find(item => item.key === pair.key);
    if (!current) return false;
    sampleData.placeIssues = (sampleData.placeIssues || []).filter(issue =>
        !(issue.projectId === current.left.projectId && issue.type === 'possible_duplicate' && issue.pairKey === current.key));
    sampleData.placeIssues.push({ id: `place-pair-${Date.now()}`, projectId: current.left.projectId,
        type: 'possible_duplicate', pairKey: current.key, placeId: current.left.id, otherPlaceId: current.right.id,
        fingerprints: { [current.left.id]: placeDuplicateFingerprint(current.left), [current.right.id]: placeDuplicateFingerprint(current.right) },
        status: 'dismissed', dismissedAt: new Date().toISOString(), reason: '' });
    markPrototypeSessionEdited();
    return true;
}

function restorePlaceDuplicatePair(key)
{
    const before = (sampleData.placeIssues || []).length;
    sampleData.placeIssues = (sampleData.placeIssues || []).filter(issue =>
        !(issue.projectId === currentProjectId() && issue.type === 'possible_duplicate' && issue.pairKey === key));
    if (sampleData.placeIssues.length === before) return false;
    markPrototypeSessionEdited();
    return true;
}

function getPlaceReviewIssues(place)
{
    if (!place || place.projectId !== currentProjectId()) return [];
    const coordinateState = placeCoordinateReviewState(place);
    const connectionCount = placeReviewConnectionCount(place.id);
    const issues = [];

    if (coordinateState.invalid)
    {
        issues.push({
            type: 'invalid_coordinates',
            title: 'Coordinates need attention',
            description: 'The saved coordinates or approximate radius are incomplete or outside the valid range.',
            actionLabel: 'Fix coordinates'
        });
    }
    else if (coordinateState.missing)
    {
        issues.push({
            type: 'missing_coordinates',
            title: 'No map position',

            description:
            connectionCount > 0
                ? `This place is connected to ${connectionCount} ${
                    connectionCount === 1
                        ? 'record'
                        : 'records'
                } but has no map position.`
                : 'This place has no map position.',

            actionLabel: 'Add position'
        });
    }

    return issues;
}

function isPlaceReviewIssueDismissed(placeId, issueType)
{
    return (sampleData.placeIssues || []).some(issue =>
        issue.projectId === currentProjectId()
        && issue.placeId === placeId
        && issue.type === issueType
        && issue.status === 'dismissed'
    );
}

function getActivePlaceReviewIssues(place)
{
    return getPlaceReviewIssues(place).filter(issue =>
        !isPlaceReviewIssueDismissed(place.id, issue.type)
    );
}

function placeNeedsReview(place)
{
    return getActivePlaceReviewIssues(place).length > 0;
}

function getPlacesNeedingReview()
{
    return projectPlaces().filter(placeNeedsReview);
}

const PLACE_REVIEW_DEFAULT_MISSING_REASON = 'Exact position not identified';

function placeReviewDismissalReason(issue)
{
    const reason = String(issue?.reason || '').trim();
    return reason || (issue?.type === 'missing_coordinates'
        ? PLACE_REVIEW_DEFAULT_MISSING_REASON
        : '');
}

function getDismissedPlaceReviewItems()
{
    return (sampleData.placeIssues || [])
        .filter(issue =>
            issue.projectId === currentProjectId()
            && issue.status === 'dismissed'
        )
        .map(issue =>
        {
            const place = getPlace(issue.placeId);
            if (!place || place.projectId !== currentProjectId()) return null;
            const review = getPlaceReviewIssues(place).find(item => item.type === issue.type);
            return review ? { place, issue, review } : null;
        })
        .filter(Boolean);
}

function dismissPlaceReviewIssue(placeId, issueType)
{
    const place = getPlace(placeId);
    if (!place || place.projectId !== currentProjectId()) return false;
    if (!getPlaceReviewIssues(place).some(issue => issue.type === issueType)) return false;
    if (isPlaceReviewIssueDismissed(placeId, issueType)) return false;

    if (!Array.isArray(sampleData.placeIssues)) sampleData.placeIssues = [];
    const existing = sampleData.placeIssues.find(issue =>
        issue.projectId === currentProjectId()
        && issue.placeId === placeId
        && issue.type === issueType
    );
    const dismissedAt = new Date().toISOString();
    if (existing)
    {
        existing.status = 'dismissed';
        existing.dismissedAt = dismissedAt;
        existing.reason = issueType === 'missing_coordinates'
            ? PLACE_REVIEW_DEFAULT_MISSING_REASON
            : '';
    }
    else
    {
        sampleData.placeIssues.push({
            id: `place-issue-dismissal-${Date.now()}-${sampleData.placeIssues.length}`,
            projectId: currentProjectId(),
            placeId,
            type: issueType,
            status: 'dismissed',
            dismissedAt,
            reason: issueType === 'missing_coordinates'
                ? PLACE_REVIEW_DEFAULT_MISSING_REASON
                : ''
        });
    }
    markPrototypeSessionEdited();
    return true;
}

function restorePlaceReviewIssue(placeId, issueType)
{
    const issue = (sampleData.placeIssues || []).find(item =>
        item.projectId === currentProjectId()
        && item.placeId === placeId
        && item.type === issueType
        && item.status === 'dismissed'
    );
    if (!issue) return false;
    sampleData.placeIssues = sampleData.placeIssues.filter(item => item !== issue);
    markPrototypeSessionEdited();
    return true;
}

function updatePlaceReviewDismissalReason(placeId, issueType, value)
{
    const issue = (sampleData.placeIssues || []).find(item =>
        item.projectId === currentProjectId()
        && item.placeId === placeId
        && item.type === issueType
        && item.status === 'dismissed'
    );
    if (!issue) return false;
    const reason = String(value || '').trim().slice(0, 240)
        || (issueType === 'missing_coordinates' ? PLACE_REVIEW_DEFAULT_MISSING_REASON : '');
    if (placeReviewDismissalReason(issue) === reason) return true;
    issue.reason = reason;
    markPrototypeSessionEdited();
    return true;
}

function clearPlaceReviewDismissals(placeId, issueTypes = [])
{
    const types = new Set(issueTypes);
    sampleData.placeIssues = (sampleData.placeIssues || []).filter(issue =>
        !(issue.projectId === currentProjectId() && issue.placeId === placeId && types.has(issue.type))
    );
}

function selectPlace(
    placeId,
    {
        source = 'list',
        focusMap = true
    } = {}
)
{
    const place =
        getPlace(placeId);

    if (
        !place
        || place.projectId
          !== currentProjectId()
    )
    {
        return;
    }

    state.selectedPlaceReviewPairKey = '';

    const placeChanged =
        state.selectedPlaceId
          !== place.id;

    state.selectedPlaceId =
        place.id;

    if (placeChanged)
    {
        state
            .placesInspectorShowAllEvents =
                false;
    }

    main
        .querySelectorAll(
            '[data-place-id]'
        )
        .forEach(row =>
        {
            const selected =
                row.dataset.placeId
              === place.id;

            row.classList.toggle(
                'active',
                selected
            );

            if (row.classList.contains('places-review-list-row'))
            {
                if (selected) row.setAttribute('aria-current', 'true');
                else row.removeAttribute('aria-current');
            }
            else
            {
                row.setAttribute(
                    'aria-selected',
                    String(selected)
                );
            }
        });

    main.querySelectorAll('[data-place-pair-key]').forEach(row =>
    {
        row.classList.remove('active');
        row.removeAttribute('aria-current');
    });

    main.querySelectorAll('.places-review-row-actions .mobile-item-details').forEach(button => button.remove());
    const selectedReviewRow = main.querySelector(`.places-review-list-row[data-place-id="${CSS.escape(place.id)}"]`);
    selectedReviewRow?.querySelector('.places-review-row-actions')?.insertAdjacentHTML('beforeend',
        `<button class="mobile-item-details" type="button" data-mobile-open-details aria-label="${escapeHtml(t('Details'))}">${icon.info}<span>${escapeHtml(t('Details'))}</span></button>`);

    sidebar
        .querySelectorAll(
            '[data-place-tree-item]'
        )
        .forEach(row =>
        {
            row.classList.toggle(
                'active',
                row.dataset
                    .placeTreeItem
              === place.id
            );
        });

    rerenderPlacesInspector({
        preserveScroll:
          false
    });

    updatePlacesMapSelection(
        place.id,
        {
            focusMap:
            focusMap
            && source !== 'map'
        }
    );

    updatePlacesMapToolControls();
}

function showPlaceOnMap(
    placeId,
    {
        editPosition = false
    } = {}
)
{
    const place =
        getPlace(placeId);

    if (
        !place
        || place.projectId
          !== currentProjectId()
    )
    {
        return;
    }

    closeMenu();

    state.selectedPlaceId =
        place.id;

    state.placesViewMode =
        'map';

    // A newly rendered map is not ready until its style finishes loading.
    placesMapRuntime.pendingFocusPlaceId =
        placeHasCoordinates(place) ? place.id : null;

    if (
        state.activeModule !== 'Places'
        || !main.querySelector(
            '#placesVectorMap'
        )
    )
    {
        state.activeModule =
            'Places';

        render();
    }
    else
    {
        selectPlace(
            place.id,
            {
                source: 'list',
                focusMap: true
            }
        );
    }

    requestAnimationFrame(() =>
    {
        selectPlace(
            place.id,
            {
                source: 'list',
                focusMap: true
            }
        );

        if (
            !placeHasCoordinates(place)
        )
        {
            setPlacesMapStatus(
                'This place is not on the map',
                'Choose Edit position to add a map point.'
            );
        }
        else if (placesMapReady())
        {
            setPlacesMapStatus();
        }

        if (editPosition)
        {
            enterPlacesMapMoveMode(
                place.id
            );
        }
    });
}

