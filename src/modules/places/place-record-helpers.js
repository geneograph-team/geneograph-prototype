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

// ISO 3166-1 alpha-2 allowlist; do not treat arbitrary Intl region codes,
// numeric regions, or ambiguous two-letter place names as country names.
const PLACE_COUNTRY_CODES = new Set(('AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW').split(' '));
const PLACE_HISTORICAL_COUNTRIES = Object.freeze({
    'history:ussr': { en: 'USSR', ru: 'СССР', aliases: ['USSR', 'Soviet Union', 'СССР', 'Советский Союз', 'СРСР', 'ZSRR'] },
    'history:russian-empire': { en: 'Russian Empire', ru: 'Российская империя', aliases: ['Russian Empire', 'Российская империя', 'Російська імперія'] },
    'history:austria-hungary': { en: 'Austria-Hungary', ru: 'Австро-Венгрия', aliases: ['Austria-Hungary', 'Австро-Венгрия', 'Австро-Угорщина', 'Austro-Węgry'] },
    'history:czechoslovakia': { en: 'Czechoslovakia', ru: 'Чехословакия', aliases: ['Czechoslovakia', 'Československo', 'Чехословакия', 'Czechosłowacja'] },
    'history:yugoslavia': { en: 'Yugoslavia', ru: 'Югославия', aliases: ['Yugoslavia', 'Jugoslavija', 'Югославия', 'Jugosławia'] },
    'history:prussia': { en: 'Prussia', ru: 'Пруссия', aliases: ['Prussia', 'Preußen', 'Пруссия', 'Prusy'] },
    'history:ddr': { en: 'East Germany', ru: 'ГДР', aliases: ['East Germany', 'GDR', 'DDR', 'ГДР', 'German Democratic Republic'] }
});
let placeCountryAliasIndex;
function placeContextKey(value)
{
    return String(value || '').normalize('NFKC').trim().replace(/\s+/g, ' ').replace(/\.$/, '').toLowerCase();
}

function placeCountryAliases()
{
    if (placeCountryAliasIndex) return placeCountryAliasIndex;
    const index = new Map();
    const add = (name, code) =>
    {
        const key = placeContextKey(name);
        if (!key || key.length < 3) return;
        if (!index.has(key)) index.set(key, new Set());
        index.get(key).add(code);
    };
    for (const language of ['en','ru','uk','pl','de','fr','es','it','pt','cs','sk','be','nl','ro','hu','tr','sv','fi','lt','lv','et','el','ar','he','zh','ja','ko'])
    {
        try
        {
            const names = new Intl.DisplayNames([language], { type: 'region', fallback: 'none' });
            for (const code of PLACE_COUNTRY_CODES) add(names.of(code), code);
        }
        catch { /* explicit aliases and other supported locales remain usable */ }
    }
    const aliases = {
        PL: ['Poland','Polska','Польша','Польща'], UA: ['Ukraine','Украина','Україна'],
        RU: ['Russia','Russian Federation','Россия','Российская Федерация','Росія'],
        DE: ['Germany','Deutschland','Германия','Німеччина'],
        US: ['USA','U.S.A.','United States','United States of America','США'],
        GB: ['UK','U.K.','United Kingdom','Великобритания','Соединённое Королевство'],
        MD: ['Moldova','Молдова','Молдавия'], BY: ['Belarus','Беларусь','Белоруссия'],
        CZ: ['Czechia','Czech Republic','Чехия','Česko']
    };
    for (const [code, names] of Object.entries(aliases))
        for (const name of names) add(name, code);
    // These two-letter abbreviations are explicit aliases, not generic ISO codes.
    index.set('uk', new Set(['GB']));
    for (const [code, country] of Object.entries(PLACE_HISTORICAL_COUNTRIES))
        for (const name of country.aliases) add(name, code);
    // A bare name also commonly denotes a subnational region, not a country.
    for (const name of ['Georgia', 'Congo', 'Korea', 'Конго', 'Корея'])
        index.delete(placeContextKey(name));
    placeCountryAliasIndex = index;
    return index;
}

function placeCountryToken(value)
{
    const matches = placeCountryAliases().get(placeContextKey(value));
    return matches?.size === 1 ? matches.values().next().value : '';
}

// Split only top-level commas; parenthetical aliases and quoted names remain
// intact. This is display/context parsing, never a rewrite of stored names.
function placeNameParts(place)
{
    const value = String(place?.name || '');
    const parts = [];
    let depth = 0, quoted = false, start = 0;
    for (let i = 0; i < value.length; i++)
    {
        const char = value[i];
        if (char === '"') quoted = !quoted;
        if (!quoted)
        {
            if (char === '(') depth++;
            else if (char === ')' && depth) depth--;
            else if (char === ',' && !depth)
            {
                parts.push(value.slice(start, i).trim());
                start = i + 1;
            }
        }
    }
    parts.push(value.slice(start).trim());
    return parts.filter(Boolean);
}

function placeEmbeddedCoordinates(name)
{
    // Explicit decimal latitude, longitude suffix, in GEDCOM export order.
    const match = /^(.*?)\s*,\s*([+-]?\d{1,3}\.\d+)\s*,\s*([+-]?\d{1,3}\.\d+)\s*$/.exec(String(name || ''));
    if (!match || !match[1].trim()) return null;
    const lat = Number(match[2]), lng = Number(match[3]);
    return { name: match[1].trim(), coordinates: validLatitude(lat) && validLongitude(lng) ? { lat, lng } : null };
}

function placeContext(place)
{
    const embedded = placeEmbeddedCoordinates(place?.name);
    const parts = placeNameParts({ name: embedded?.name || place?.name });
    const countries = new Set();
    const add = value =>
    {
        const code = placeCountryToken(value);
        if (code) countries.add(code);
    };
    // Only complete jurisdiction components count; inspect trailing
    // parenthetical translations independently, including their last component.
    for (const part of parts.slice(parts.length > 1 ? 1 : 0))
    {
        add(part);
        const match = /^(.*?)\s*\(([^()]*)\)\s*\.?$/.exec(part);
        if (match)
        {
            add(match[1]);
            add(placeNameParts({ name: match[2] }).at(-1));
        }
    }
    const countryId = countries.size === 1 ? countries.values().next().value : '';
    const primary = parts[0] || '';
    const administrative = /(?:\b(?:oblast|province|county|district|region|governorate|voivodeship|prefecture|republic|state)\b|(?:обл\.?|область|губерния|уезд|район|край|республика|округ|воеводство|область|повіт|район|województwo|powiat)\s*$)/iu.test(primary);
    const firstAlias = /^(.*?)\s*\(([^()]*)\)\s*\.?$/.exec(primary);
    const primaryCountry = placeCountryToken(primary) || (firstAlias && placeCountryToken(firstAlias[1])) || '';
    const countryOnly = Boolean(primaryCountry && countries.size === 1 && countries.has(primaryCountry)
        && parts.every(part => placeCountryToken(part) === primaryCountry
            || (part === primary && firstAlias && placeCountryToken(firstAlias[2]) === primaryCountry)));
    const nonSettlement = /(?:\b(?:cemetery|church|cathedral|chapel|monastery|hospital|graveyard|cmentarz|kościół|cerkiew|klasztor)\b|(?:кладбищ|церков|церкв|собор|монастыр|часовн|больниц|цвинтар|кладовищ|монастир))/iu.test(primary);
    const settlementHint = /^(?:г\.|гор\.|с\.|сел\.|дер\.|д\.|пос\.|пгт\.?|хут\.|станица|город|село|деревня|місто|село|селище)\s+/iu.test(primary);
    return { parts, primary, countryId, countryOnly, administrative, nonSettlement, settlementHint,
        ambiguousCountry: countries.size > 1, embeddedCoordinates: embedded?.coordinates || null };
}

function placePrimaryName(place)
{
    return placeContext(place).primary || 'Unnamed place';
}

function placeSecondaryName(place)
{
    const context = placeContext(place);
    // Invalid or unresolved coordinate suffixes remain visible for review.
    return (placeEmbeddedCoordinates(place?.name) && !placeHasCoordinates(place)
        ? placeNameParts(place) : context.parts).slice(1).join(', ');
}

function placeCountryId(place)
{
    return placeContext(place).countryId || 'unknown';
}

function placeCountryLabel(id, language = typeof state !== 'undefined' && state.language === 'ru' ? 'ru' : 'en')
{
    if (!id || id === 'unknown') return typeof t === 'function' ? t('Other places') : 'Other places';
    if (PLACE_HISTORICAL_COUNTRIES[id]) return PLACE_HISTORICAL_COUNTRIES[id][language] || PLACE_HISTORICAL_COUNTRIES[id].en;
    if (!PLACE_COUNTRY_CODES.has(id)) return id;
    try { return new Intl.DisplayNames([language], { type: 'region' }).of(id); }
    catch { return id; }
}

function placeCountryFilterId(value)
{
    const text = String(value || '').trim();
    if (!text) return '';
    if (PLACE_COUNTRY_CODES.has(text) || PLACE_HISTORICAL_COUNTRIES[text] || text === 'unknown') return text;
    return placeCountryToken(text) || 'unknown';
}

function placeCountry(place)
{
    return placeCountryLabel(placeCountryId(place));
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

// One traversal of authored Place references. Never scan free text, review
// decisions or derived timeline events for matching strings.
function visitProjectPlaceReferences(projectId, visit, { includeDeleted = false } = {})
{
    const owned = key => (sampleData[key] || []).filter(record =>
        record.projectId === projectId && (includeDeleted || !record.deleted));
    const field = (owner, record, key, kind = 'scalar') =>
    {
        if (!record) return;
        const value = record[key];
        if (kind === 'array' ? Array.isArray(value) && value.length : typeof value === 'string' && value)
            visit({ owner, record, key, kind });
    };
    const date = (owner, record) =>
    {
        field(owner, record, 'placeId');
        field(owner, record, 'burialPlaceId');
    };
    const fact = (owner, record) =>
    {
        if (!record) return;
        date(owner, record);
        for (const key of ['date', 'fromDate', 'toDate']) date(owner, record[key]);
    };
    for (const key of ['people', 'families'])
        for (const record of owned(key))
        {
            fact(record, record);
            if (key === 'people')
                for (const vital of ['birth', 'death']) date(record, record[vital]);
            for (const item of [...(record.events || []), ...(record.attributes || [])])
                fact(record, item);
        }
    for (const record of owned('media'))
    {
        field(record, record, 'placeId');
        date(record, record.date);
    }
    for (const record of owned('archiveFiles'))
    {
        field(record, record, 'documentPlaceId');
        field(record, record, 'linkedPlaceIds', 'array');
        date(record, record.documentDate);
    }
    for (const record of owned('notes')) field(record, record, 'linkedPlaceIds', 'array');
    for (const record of owned('sources'))
    {
        field(record, record, 'placeId');
        date(record, record.accessedDate);
    }
    for (const record of owned('sourceLinks'))
        if (record.targetType === 'place') field(record, record, 'targetId', 'sourceLink');
    for (const record of owned('links'))
        for (const end of ['from', 'to'])
            if (record[end + 'Type'] === 'place') field(record, record, end + 'Id', 'link');
    for (const board of owned('boards'))
    {
        const diagram = board.diagram;
        for (const person of diagram?.people || [])
            for (const vital of ['birth', 'death']) date(board, person[vital]);
        for (const family of diagram?.families || [])
            for (const event of family.events || []) fact(board, event);
        for (const node of diagram?.nodes || [])
            if (node.type === 'place' && node.placeRef?.scope === 'project')
                field(board, node.placeRef, 'id', 'boardPlace');
    }
}

function projectPlaceReferenceOwners(projectId)
{
    const owners = new Map();
    visitProjectPlaceReferences(projectId, ({ owner, record, key, kind }) =>
    {
        for (const id of kind === 'array' ? record[key] : [record[key]])
        {
            if (!owners.has(id)) owners.set(id, new Set());
            owners.get(id).add(owner);
        }
    });
    return owners;
}

function placeLiveReferenceCount(place, owners = null)
{
    if (!place) return 0;
    return (owners || projectPlaceReferenceOwners(place.projectId)).get(place.id)?.size || 0;
}

// A Keep decision expires when a committed edit links the Place.
function invalidateLinkedPlaceDismissals()
{
    const issues = sampleData.placeIssues || [];
    if (!issues.some(issue => issue.type === 'unlinked')) return;
    const projects = new Map();
    sampleData.placeIssues = issues.filter(issue =>
    {
        if (issue.type !== 'unlinked') return true;
        if (!projects.has(issue.projectId))
            projects.set(issue.projectId, projectPlaceReferenceOwners(issue.projectId));
        return !projects.get(issue.projectId).has(issue.placeId);
    });
}

function rewriteProjectPlaceReferences(place, replacement = null)
{
    const projectId = place.projectId;
    const keepId = replacement?.id || null;
    const removedLinks = new Set();
    const changedBoards = new Set();
    const changedFiles = new Set();
    const changedSourceLinks = new Set();
    const changedLinks = new Set();
    const boards = new Set((sampleData.boards || []).filter(board => board.projectId === projectId));
    const archiveFiles = new Set((sampleData.archiveFiles || []).filter(file => file.projectId === projectId));
    visitProjectPlaceReferences(projectId, ({ owner, record, key, kind }) =>
    {
        if (kind === 'array' ? !record[key].includes(place.id) : record[key] !== place.id) return;
        if (kind === 'sourceLink' || kind === 'link')
        {
            if (!replacement) removedLinks.add(owner);
            else
            {
                record[key] = keepId;
                (kind === 'sourceLink' ? changedSourceLinks : changedLinks).add(owner);
            }
        }
        else if (kind === 'boardPlace')
        {
            if (replacement)
            {
                record.id = keepId;
                record.fallbackName = placePrimaryName(replacement) || replacement.name;
            }
            else
            {
                const name = String(record.fallbackName || placePrimaryName(place) || place.name || 'Place').trim();
                delete record.id;
                delete record.fallbackName;
                record.scope = 'board';
                record.name = name;
            }
        }
        else if (kind === 'array')
            record[key] = [...new Set(record[key].map(id => id === place.id ? keepId : id).filter(Boolean))];
        else
        {
            if (!replacement && boards.has(owner) && key === 'placeId' && !record.placeText)
                record.placeText = place.name;
            record[key] = keepId;
        }
        if (boards.has(owner)) changedBoards.add(owner);
        if (archiveFiles.has(owner)) changedFiles.add(owner);
    }, { includeDeleted: true });
    for (const file of changedFiles)
        file.linkedPlaceIds = (file.linkedPlaceIds || []).filter(id => id !== file.documentPlaceId);
    for (const board of changedBoards) board.modifiedAt = new Date().toISOString();

    // Deduplicate redirected links, never unrelated authored evidence.
    const deduplicate = (records, changed, key) =>
    {
        const seen = new Set(records.filter(record => record.projectId === projectId && !changed.has(record)).map(key));
        return records.filter(record =>
        {
            if (removedLinks.has(record)) return false;
            if (!changed.has(record)) return true;
            const identity = key(record);
            if (seen.has(identity)) return false;
            seen.add(identity);
            return true;
        });
    };
    sampleData.sourceLinks = deduplicate(sampleData.sourceLinks || [], changedSourceLinks,
        link => JSON.stringify([link.sourceId, link.targetType, link.targetId]));
    sampleData.links = deduplicate(sampleData.links || [], changedLinks,
        link => JSON.stringify([link.fromType, link.fromId, link.toType, link.toId, link.label]));
}

function deleteSavedPlace(placeId, { unlinkedOnly = false, projectId = currentProjectId() } = {})
{
    const place = (sampleData.places || []).find(item => item.id === placeId && item.projectId === projectId);
    if (!place || projectId !== currentProjectId() || (unlinkedOnly && placeLiveReferenceCount(place))) return false;
    rewriteProjectPlaceReferences(place);
    sampleData.places = sampleData.places.filter(item => item !== place);
    sampleData.placeIssues = (sampleData.placeIssues || []).filter(issue =>
        issue.projectId !== projectId || (issue.placeId !== placeId && issue.otherPlaceId !== placeId));
    sampleData.events = rebuildSampleEventsAndPruneSourceLinks();
    markPrototypeSessionEdited();
    return true;
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

    rewriteProjectPlaceReferences(removed, keep);
    sampleData.places = sampleData.places.filter(place => place !== removed);
    sampleData.placeIssues = (sampleData.placeIssues || []).filter(issue =>
        issue.projectId !== keep.projectId || (issue.placeId !== removeId && issue.otherPlaceId !== removeId
        && !(locationChanged && issue.placeId === keepId
            && PLACE_REVIEW_COORDINATE_ISSUE_TYPES.includes(issue.type))));
    if (state.albumsFilters?.placeId === removeId) state.albumsFilters.placeId = keepId;
    if (Array.isArray(state.placesFilters?.placeIds))
        state.placesFilters.placeIds = [...new Set(state.placesFilters.placeIds.map(id => id === removeId ? keepId : id))];
    if (placesMapRuntime.pendingFocusPlaceId === removeId) placesMapRuntime.pendingFocusPlaceId = keepId;
    state.selectedPlaceId = keepId;
    sampleData.events = rebuildSampleEventsAndPruneSourceLinks();
    markPrototypeSessionEdited();
    return true;
}

function placeAssociationIndex(projectId = currentProjectId())
{
    const context = acquireProjectReadModel(projectId);
    return context.read('places:associations', ['places', 'people', 'events'], id =>
    {
        const placeIds = new Set((sampleData.places || []).filter(place => place.projectId === id).map(place => place.id));
        const eventsByPlaceId = new Map(), peopleByPlaceId = new Map(), counts = new Map();
        const personPlaces = new Map();
        const collect = (record, ids) =>
        {
            if (!record) return;
            for (const key of ['placeId', 'birthPlaceId', 'deathPlaceId', 'burialPlaceId'])
                if (placeIds.has(record[key])) ids.add(record[key]);
            if (Array.isArray(record.placeIds))
                for (const placeId of record.placeIds) if (placeIds.has(placeId)) ids.add(placeId);
        };
        const append = (index, key, record) =>
        {
            if (!index.has(key)) index.set(key, []);
            index.get(key).push(record);
        };
        const trace = typeof appPerf === 'undefined' ? null : appPerf.currentDetailed();
        if (trace) appPerf.count(trace, 'recordsScanned', (sampleData.events || []).length, true);
        for (const event of sampleData.events || [])
        {
            if (event.projectId !== id) continue;
            const ids = new Set();
            collect(event, ids);
            if (!ids.size) continue;
            for (const placeId of ids) append(eventsByPlaceId, placeId, event);
            for (const personId of event.personIds || [])
            {
                if (!personPlaces.has(personId)) personPlaces.set(personId, new Set());
                for (const placeId of ids) personPlaces.get(personId).add(placeId);
            }
        }
        for (const person of projectPeopleIndex(context).rawById.values())
        {
            const ids = new Set(personPlaces.get(person.id));
            collect(person.birth, ids);
            collect(person.death, ids);
            for (const attribute of person.attributes || []) collect(attribute, ids);
            for (const event of person.events || []) collect(event, ids);
            for (const placeId of ids) append(peopleByPlaceId, placeId, person);
        }
        for (const [placeId, people] of peopleByPlaceId) counts.set(placeId, people.length);
        return { eventsByPlaceId, peopleByPlaceId, counts };
    });
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

function getPlaceEventDisplay(event)
{
    const linked = cleanEditFieldValue(getPlaceDisplay(event?.placeId));
    return linked || cleanEditFieldValue(event?.placeText);
}

