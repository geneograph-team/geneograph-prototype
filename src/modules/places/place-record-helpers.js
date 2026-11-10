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

function parseLegacyCoordinateString(value)
{
    if (typeof value !== 'string') return null;
    const parts = value.split(',').map(part => Number(part.trim()));
    if (parts.length !== 2 || !validLatitude(parts[0]) || !validLongitude(parts[1])) return null;
    return { lat: parts[0], lng: parts[1] };
}

function normalizePlaceCoordinates(place)
{
    const source = place?.coordinates || parseLegacyCoordinateString(place?.coords);
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
        && Boolean(normalizePlaceCoordinates(place));
}

function placeHasCoordinates(place)
{
    return Boolean(normalizePlaceCoordinates(place)) && !placeHasInvalidRadius(place);
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
        ring.push([point.lng, point.lat]);
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
    ['placeId', 'birthPlaceId', 'deathPlaceId', 'burialPlaceId'].forEach(key =>
    {
        if (record[key] === placeId) record[key] = null;
    });
    if (Array.isArray(record.placeIds))
    {
        record.placeIds = record.placeIds.filter(id => id !== placeId);
    }
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
        && (recordHasPlaceReference(file, placeId) || linkedFileIds.has(file.id))
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

