function normalizePlaceLookupText(value)
{
    return cleanEditFieldValue(value)
        .replace(/\s+/g, ' ')
        .replace(/[.,;:]+$/g, '')
        .toLowerCase();
}

function getPlace(placeId)
{
    return sampleData.places.find(place => place.id === placeId) || null;
}

function validLatitude(value)
{
    if (!['number', 'string'].includes(typeof value) || (typeof value === 'string' && !value.trim())) return false;
    const number = Number(value);
    return Number.isFinite(number) && number >= -90 && number <= 90;
}

function validLongitude(value)
{
    if (!['number', 'string'].includes(typeof value) || (typeof value === 'string' && !value.trim())) return false;
    const number = Number(value);
    return Number.isFinite(number) && number >= -180 && number <= 180;
}

function normalizePlaceCoordinates(place)
{
    const source = place?.coordinates;
    if (!source || !validLatitude(source.lat) || !validLongitude(source.lng)) return null;
    return { lat: Number(source.lat), lng: Number(source.lng) };
}

// An absent radius keeps the existing exact-point record semantics.
// One metre to 1,000 kilometres is supported; invalid non-empty radii
// are not silently treated as exact points.
const PLACE_MAX_APPROXIMATE_RADIUS_METERS = 1000000;
const PLACE_EARTH_RADIUS_METERS = 6371008.8;

function placeHasRadiusValue(place)
{
    const value = place?.approximateRadiusMeters;
    return value !== null && value !== undefined && String(value).trim() !== '';
}

function validPlaceRadiusMeters(value)
{
    return (typeof value === 'number' || typeof value === 'string')
        && String(value).trim() !== ''
        && Number.isFinite(Number(value))
        && Number(value) >= 1
        && Number(value) <= PLACE_MAX_APPROXIMATE_RADIUS_METERS;
}

function placeHasInvalidRadius(place)
{
    return placeHasRadiusValue(place) && !validPlaceRadiusMeters(place.approximateRadiusMeters);
}

function placeHasApproximateArea(place)
{
    return placeHasRadiusValue(place)
        && validPlaceRadiusMeters(place.approximateRadiusMeters)
        && placeHasCoordinates(place);
}

function placeHasCoordinates(place)
{
    return Boolean(
        place?.coordinates
        && validLatitude(place.coordinates.lat)
        && validLongitude(place.coordinates.lng)
    ) && !placeHasInvalidRadius(place);
}

function placeLatLng(place)
{
    const coordinates = placeHasCoordinates(place) ? normalizePlaceCoordinates(place) : null;
    return coordinates ? [coordinates.lat, coordinates.lng] : null;
}

function formatPlaceRadius(meters)
{
    if (!validPlaceRadiusMeters(meters)) return '';
    const radius = Number(meters);
    return radius >= 1000
        ? `${Number((radius / 1000).toFixed(3))} ${t('km')}`
        : `${Number(radius.toFixed(1))} ${t('m')}`;
}

function placeDistanceMeters(one, two)
{
    if (!one || !two) return null;
    const rad = Math.PI / 180;
    const latitudeDelta = (two.lat - one.lat) * rad;
    const longitudeDelta = (two.lng - one.lng) * rad;
    const a = Math.sin(latitudeDelta / 2) ** 2
        + Math.cos(one.lat * rad) * Math.cos(two.lat * rad)
        * Math.sin(longitudeDelta / 2) ** 2;
    return 2 * PLACE_EARTH_RADIUS_METERS * Math.atan2(
        Math.sqrt(Math.max(0, a)), Math.sqrt(Math.max(0, 1 - a))
    );
}

function placeRadiusEdgePoint(center, radiusMeters, bearingDegrees)
{
    const rad = Math.PI / 180;
    const lat = Number(center.lat) * rad;
    const lng = Number(center.lng) * rad;
    const bearing = bearingDegrees * rad;
    const arc = Number(radiusMeters) / PLACE_EARTH_RADIUS_METERS;
    const latitude = Math.asin(Math.sin(lat) * Math.cos(arc)
        + Math.cos(lat) * Math.sin(arc) * Math.cos(bearing));
    const longitude = lng + Math.atan2(
        Math.sin(bearing) * Math.sin(arc) * Math.cos(lat),
        Math.cos(arc) - Math.sin(lat) * Math.sin(latitude)
    );
    return {
        lat: latitude / rad,
        lng: ((longitude / rad + 540) % 360) - 180
    };
}

function placeRadiusGeoJson(center, radiusMeters)
{
    if (!center || !validLatitude(center.lat) || !validLongitude(center.lng)
        || !validPlaceRadiusMeters(radiusMeters)) return null;
    const ring = [];
    for (let step = 0; step <= 64; step += 1)
    {
        const point = placeRadiusEdgePoint(center, radiusMeters, step * 360 / 64);
        // Keep the ring continuous when it straddles the antimeridian.
        const previous = ring.length ? ring[ring.length - 1][0] : Number(center.lng);
        let lng = point.lng;
        while (lng - previous > 180) lng -= 360;
        while (lng - previous < -180) lng += 360;
        ring.push([lng, point.lat]);
    }
    return {
        type: 'Feature',
        properties: {},
        geometry: { type: 'Polygon', coordinates: [ring] }
    };
}

function formatPlaceCoordinates(place)
{
    const coordinates = normalizePlaceCoordinates(place);
    return coordinates ? `${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}` : 'No coordinates recorded';
}

function placeNameParts(place)
{
    return String(place?.name || '')
        .split(',')
        .map(part => part.trim())
        .filter(Boolean);
}

function placePrimaryName(place)
{
    return placeNameParts(place)[0] || 'Unnamed place';
}

function placeSecondaryName(place)
{
    return placeNameParts(place).slice(1).join(', ');
}

function placeCountry(place)
{
    const parts = placeNameParts(place);
    return parts.length > 1 ? parts.at(-1) : 'Other places';
}

function placeAlternativeNames(place)
{
    return Array.isArray(place?.alternativeNames) ? place.alternativeNames : [];
}

function normalizePlaceAlternativeNames(values, canonicalName = '')
{
    const canonicalKey = normalizePlaceLookupText(canonicalName);
    const seen = new Set();
    return (Array.isArray(values) ? values : []).map(value => String(value || '').trim()).filter(value =>
    {
        const key = normalizePlaceLookupText(value);
        if (!key || key === canonicalKey || seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

function placeUpdatedLabel(place)
{
    const timestamp = Date.parse(place?.updatedAt || '');
    if (!Number.isFinite(timestamp)) return 'Unknown';
    return new Intl.DateTimeFormat(state.language === 'ru' ? 'ru-RU' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(timestamp));
}

function getPlaceDisplay(placeId)
{
    return placeId ? getPlace(placeId)?.name || '' : '';
}

function placeLinkMatches(link, placeId)
{
    if (!link || !placeId) return false;
    return (
        (link.sourceType === 'place' && link.sourceId === placeId)
        || (link.targetType === 'place' && link.targetId === placeId)
        || (link.fromType === 'place' && link.fromId === placeId)
        || (link.toType === 'place' && link.toId === placeId)
    );
}

function recordHasPlaceReference(record, placeId)
{
    if (!record || !placeId) return false;
    if (record.placeId === placeId || record.birthPlaceId === placeId || record.deathPlaceId === placeId || record.burialPlaceId === placeId) return true;
    if (Array.isArray(record.placeIds) && record.placeIds.includes(placeId)) return true;
    return false;
}

function clearStructuredPlaceReferences(record, placeId)
{
    if (!record || !placeId) return;
    ['placeId', 'birthPlaceId', 'deathPlaceId', 'burialPlaceId', 'documentPlaceId'].forEach(key =>
    {
        if (record[key] === placeId) record[key] = null;
    });
    for (const key of ['placeIds', 'linkedPlaceIds'])
    {
        if (Array.isArray(record[key])) record[key] = record[key].filter(id => id !== placeId);
    }
}

function retargetStructuredPlaceReferences(record, removeId, keepId)
{
    if (!record) return;
    for (const key of ['placeId', 'birthPlaceId', 'deathPlaceId', 'burialPlaceId', 'documentPlaceId'])
        if (record[key] === removeId) record[key] = keepId;
    for (const key of ['placeIds', 'linkedPlaceIds'])
        if (Array.isArray(record[key])) record[key] = [...new Set(record[key].map(id => id === removeId ? keepId : id))];
}

function updateBoardFactPlaceReferences(board, place, replacement = null)
{
    const diagram = board.diagram;
    const records = [
        ...(diagram?.people || []).flatMap(person => [person.birth, person.death]),
        ...(diagram?.families || []).flatMap(family => family.events || [])
    ];
    let updated = false;
    for (const record of records)
    {
        if (!recordHasPlaceReference(record, place.id)) continue;
        if (replacement) retargetStructuredPlaceReferences(record, place.id, replacement.id);
        else
        {
            if (record.placeId === place.id && !record.placeText) record.placeText = place.name;
            clearStructuredPlaceReferences(record, place.id);
        }
        updated = true;
    }
    return updated;
}

function placeMergeValuePresent(value)
{
    return value !== null && value !== undefined && value !== ''
        && (!Array.isArray(value) || value.length > 0)
        && (typeof value !== 'object' || Array.isArray(value) || Object.keys(value).length > 0);
}

function placeMergeEditableFieldKeys(left, right)
{
    const reserved = new Set(['id', 'projectId', 'createdAt', 'updatedAt',
        'name', 'alternativeNames', 'coordinates', 'approximateRadiusMeters']);
    return [...new Set([...Object.keys(left || {}), ...Object.keys(right || {})])]
        .filter(key => !reserved.has(key) && (placeMergeValuePresent(left?.[key]) || placeMergeValuePresent(right?.[key])));
}

function placeMergeConflictingFields(keep, removed)
{
    return placeMergeEditableFieldKeys(keep, removed).filter(key =>
        placeMergeValuePresent(keep[key]) && placeMergeValuePresent(removed[key])
        && JSON.stringify(keep[key]) !== JSON.stringify(removed[key]));
}

// Build a preview without mutating either saved Place.
function placeMergeFieldResult(keep, removed, { aliases = true, locationChoice, fieldChoices = {} } = {})
{
    if (!keep || !removed) return null;
    const result = structuredClone(keep);
    const isChoice = choice => ['keep', 'remove'].includes(choice);
    const nameChoice = fieldChoices.name || 'keep';
    const alternativeChoice = fieldChoices.alternativeNames || 'keep';
    if (!isChoice(nameChoice) || !isChoice(alternativeChoice)) return null;
    if (nameChoice === 'remove') result.name = removed.name;
    if (!String(result.name || '').trim()) return null;

    if (aliases)
    {
        const first = alternativeChoice === 'remove' ? removed : keep;
        const second = alternativeChoice === 'remove' ? keep : removed;
        result.alternativeNames = normalizePlaceAlternativeNames([
            ...placeAlternativeNames(first), second.name, ...placeAlternativeNames(second), first.name
        ], result.name);
    }
    else result.alternativeNames = normalizePlaceAlternativeNames(placeAlternativeNames(keep), result.name);

    for (const key of ['coordinates', 'approximateRadiusMeters'])
    {
        const original = keep[key] ?? null;
        const incoming = removed[key] ?? null;
        const different = JSON.stringify(original) !== JSON.stringify(incoming);
        const choice = fieldChoices[key] || locationChoice;
        if (different && !isChoice(choice)) return null;
        if (choice && !isChoice(choice)) return null;
        // Missing values are filled automatically; copying an empty value is
        // an explicit user decision and may clear the survivor's value.
        if (choice === 'remove')
        {
            if (placeMergeValuePresent(incoming)) result[key] = structuredClone(incoming);
            else if (key === 'coordinates') result.coordinates = null;
            else delete result[key];
        }
        else if (!placeMergeValuePresent(original) && placeMergeValuePresent(incoming))
            result[key] = structuredClone(incoming);
    }

    for (const key of placeMergeEditableFieldKeys(keep, removed))
    {
        const current = keep[key];
        const incoming = removed[key];
        const conflict = placeMergeValuePresent(current) && placeMergeValuePresent(incoming)
            && JSON.stringify(current) !== JSON.stringify(incoming);
        const choice = fieldChoices[key];
        if (conflict && !isChoice(choice)) return null;
        if (choice && !isChoice(choice)) return null;
        if (choice === 'remove')
        {
            if (placeMergeValuePresent(incoming)) result[key] = structuredClone(incoming);
            else delete result[key];
        }
        else if (!placeMergeValuePresent(current) && placeMergeValuePresent(incoming))
            result[key] = structuredClone(incoming);
    }

    const position = normalizePlaceCoordinates(result);
    if (placeMergeValuePresent(result.coordinates) && !position) return null;
    if (placeHasRadiusValue(result)
        && (!validPlaceRadiusMeters(result.approximateRadiusMeters) || !position)) return null;
    return result;
}

function mergeSavedPlaces(keepId, removeId, { aliases = true, locationChoice, fieldChoices = {} } = {})
{
    const keep = getPlace(keepId);
    const removed = getPlace(removeId);
    if (!keep || !removed || keepId === removeId || keep.projectId !== removed.projectId
        || keep.projectId !== currentProjectId()) return false;
    const match = matchDuplicatePlaces(keep, removed);
    if (!match) return false;
    const result = placeMergeFieldResult(keep, removed, { aliases, locationChoice, fieldChoices });
    if (!result) return false;
    const locationChanged = JSON.stringify([keep.coordinates || null, keep.approximateRadiusMeters ?? null])
        !== JSON.stringify([result.coordinates || null, result.approximateRadiusMeters ?? null]);
    for (const key of new Set([...Object.keys(keep), ...Object.keys(result)]))
    {
        if (['id', 'projectId', 'createdAt', 'updatedAt'].includes(key)) continue;
        if (Object.hasOwn(result, key)) keep[key] = result[key];
        else delete keep[key];
    }
    keep.updatedAt = new Date().toISOString();

    (sampleData.people || []).forEach(person =>
        [person, person.birth, person.death, ...(person.events || []), ...(person.attributes || [])]
            .forEach(record => retargetStructuredPlaceReferences(record, removeId, keepId)));
    centralFamilyRecords().forEach(family =>
        [family, ...(family.events || [])].forEach(record => retargetStructuredPlaceReferences(record, removeId, keepId)));
    (sampleData.media || []).forEach(record => retargetStructuredPlaceReferences(record, removeId, keepId));
    (sampleData.archiveFiles || []).forEach(file =>
    {
        if (!archiveFilePlaceIds(file).includes(removeId)) return;
        const documentPlace = archiveDocumentPlace(file);
        const related = archiveFilePlaceIds(file);
        retargetStructuredPlaceReferences(file, removeId, keepId);
        archiveApplyDocumentPlace(file,
            documentPlace.placeId === removeId ? keepId : documentPlace.placeId,
            documentPlace.placeText,
            [...new Set(related.map(id => id === removeId ? keepId : id))]
                .filter(id => id !== (documentPlace.placeId === removeId ? keepId : documentPlace.placeId)));
    });
    [sampleData.sources, sampleData.notes].forEach(records =>
        (records || []).forEach(record => retargetStructuredPlaceReferences(record, removeId, keepId)));
    (sampleData.sourceLinks || []).forEach(link =>
    {
        if (link.targetType === 'place' && link.targetId === removeId) link.targetId = keepId;
    });
    const sourceLinkKeys = new Set();
    sampleData.sourceLinks = (sampleData.sourceLinks || []).filter(link =>
    {
        const key = [link.projectId, link.sourceId, link.targetType, link.targetId].join('|');
        if (link.targetType === 'place' && link.targetId === keepId && sourceLinkKeys.has(key)) return false;
        sourceLinkKeys.add(key);
        return true;
    });
    (sampleData.links || []).forEach(link =>
    {
        for (const [typeKey, idKey] of [['sourceType', 'sourceId'], ['targetType', 'targetId'], ['fromType', 'fromId'], ['toType', 'toId']])
            if (link[typeKey] === 'place' && link[idKey] === removeId) link[idKey] = keepId;
    });
    const linkKeys = new Set();
    sampleData.links = (sampleData.links || []).filter(link =>
    {
        const key = JSON.stringify(Object.entries(link).filter(([name]) => name !== 'id')
            .sort(([left], [right]) => left.localeCompare(right)));
        if (placeLinkMatches(link, keepId) && linkKeys.has(key)) return false;
        linkKeys.add(key);
        return true;
    });
    (sampleData.boards || []).forEach(board =>
    {
        let updated = updateBoardFactPlaceReferences(board, removed, keep);
        (board.diagram?.nodes || []).forEach(node =>
        {
            if (node.type !== 'place' || node.placeRef?.scope !== 'project' || node.placeRef.id !== removeId) return;
            node.placeRef.id = keepId;
            node.placeRef.fallbackName = placePrimaryName(keep) || keep.name;
            updated = true;
        });
        if (updated) board.updatedAt = keep.updatedAt;
    });
    sampleData.places = sampleData.places.filter(place => place.id !== removeId);
    sampleData.placeIssues = (sampleData.placeIssues || []).filter(issue =>
        issue.placeId !== removeId && issue.otherPlaceId !== removeId
        && !(locationChanged && issue.placeId === keepId
            && PLACE_REVIEW_COORDINATE_ISSUE_TYPES.includes(issue.type)));
    if (state.albumsFilters?.placeId === removeId) state.albumsFilters.placeId = keepId;
    if (Array.isArray(state.placesFilters?.placeIds))
        state.placesFilters.placeIds = [...new Set(state.placesFilters.placeIds.map(id => id === removeId ? keepId : id))];
    if (placesMapRuntime.pendingFocusPlaceId === removeId) placesMapRuntime.pendingFocusPlaceId = keepId;
    state.selectedPlaceId = keepId;
    sampleData.events = rebuildSampleEventsAndPruneSourceLinks();
    markPrototypeSessionEdited();
    return true;
}

function getEventsForPlace(placeId, { projectId = currentProjectId() } = {})
{
    return (sampleData.events || []).filter(event =>
        event.projectId === projectId
        && recordHasPlaceReference(event, placeId)
    );
}

function getPeopleForPlace(placeId, { projectId = currentProjectId() } = {})
{
    const eventPersonIds = new Set(
        getEventsForPlace(placeId, { projectId }).flatMap(event => event.personIds || [])
    );
    return (sampleData.people || []).filter(person =>
    {
        if (person.projectId !== projectId) return false;
        return eventPersonIds.has(person.id)
          || recordHasPlaceReference(person.birth, placeId)
          || recordHasPlaceReference(person.death, placeId)
          || (person.attributes || []).some(attribute => recordHasPlaceReference(attribute, placeId))
          || (person.events || []).some(event => recordHasPlaceReference(event, placeId));
    });
}

function getPhotosForPlace(
    placeId,
    {
        projectId =
            currentProjectId()
    } = {}
)
{
    return getProjectPhotos(
        projectId
    ).filter(
        photo =>
            photo.placeId === placeId
    );
}

function getArchiveFilesForPlace(placeId, { projectId = currentProjectId(), includeDeleted = false } = {})
{
    const linkedFileIds = new Set((sampleData.links || []).filter(link =>
        link.projectId === projectId
        && placeLinkMatches(link, placeId)
    ).flatMap(link =>
    {
        if (link.sourceType === 'archive' || link.sourceType === 'archiveFile') return [link.sourceId];
        if (link.targetType === 'archive' || link.targetType === 'archiveFile') return [link.targetId];
        if (link.fromType === 'archive' || link.fromType === 'archiveFile') return [link.fromId];
        if (link.toType === 'archive' || link.toType === 'archiveFile') return [link.toId];
        return [];
    }));
    return (sampleData.archiveFiles || []).filter(file =>
        file.projectId === projectId
        && (includeDeleted || !file.deleted)
        && (archiveFilePlaceIds(file).includes(placeId) || linkedFileIds.has(file.id))
    );
}

function getNotesForPlace(
    placeId,
    options = {}
)
{
    return getNotesForEntity(
        'place',
        placeId,
        options
    );
}

function getPlaceConnectionCounts(placeId, { projectId = currentProjectId() } = {})
{
    return {
        people: getPeopleForPlace(placeId, { projectId }).length,
        events: getEventsForPlace(placeId, { projectId }).length,
        files: getArchiveFilesForPlace(placeId, { projectId }).length,
        photos: getPhotosForPlace(placeId, { projectId }).length,
        notes: getNotesForPlace(placeId, { projectId }).length
    };
}

function getPlaceEventDisplay(event)
{
    const linked = cleanEditFieldValue(getPlaceDisplay(event?.placeId));
    return linked || cleanEditFieldValue(event?.placeText);
}

