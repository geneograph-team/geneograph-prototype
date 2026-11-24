const PROJECT_OWNED_COLLECTIONS = Object.freeze([
    'people',
    'families',
    'places',
    'placeSavedFilters',
    'placeIssues',
    'events',
    'media',
    'albums',
    'archiveFolders',
    'archiveFiles',
    'sources',
    'sourceLinks',
    'noteCollections',
    'notes',
    'boardCollections',
    'boards',
    'links',
    'publishDrafts',
    'activity',
    'notifications'
]);

const PROJECT_DRAFT_COLLECTIONS = Object.freeze(PROJECT_OWNED_COLLECTIONS.filter(key =>
    !['events', 'activity', 'notifications'].includes(key)));

function isProjectDataRecord(value)
{
    if (!value || Object.prototype.toString.call(value) !== '[object Object]') return false;
    const prototype = Object.getPrototypeOf(value);
    return prototype === null || Object.getPrototypeOf(prototype) === null;
}

function projectDraftValueError(project, records)
{
    const ancestors = new Set();
    let visited = 0;
    function visit(value, path, depth)
    {
        if (++visited > 1000000) return path + ' exceeds the project draft limit of 1,000,000 values.';
        if (depth > 64) return path + ' exceeds the project draft limit of 64 nested levels.';
        if (value === null || typeof value === 'string' || typeof value === 'boolean' || Number.isFinite(value)) return '';
        const array = Array.isArray(value);
        if (!array && !isProjectDataRecord(value)) return path + ' must contain JSON-compatible data.';
        if (ancestors.has(value)) return path + ' contains a circular reference.';
        if (array && value.length > 1000000 - visited) return path + ' exceeds the project draft value limit.';
        const keys = Object.keys(value);
        if (array && (keys.length !== value.length || keys.some((key, index) => key !== String(index))))
            return path + ' must be a dense array without named properties.';
        ancestors.add(value);
        for (const key of keys)
        {
            const error = visit(value[key], path + (array ? '[' + key + ']' : '.' + key), depth + 1);
            if (error) return error;
        }
        ancestors.delete(value);
        return '';
    }
    return visit(project, 'project', 0) || visit(records, 'records', 0);
}

// Reconstruct derived events on a detached copy before checking evidence links.
function prepareProjectDraft(project, records)
{
    if (!isProjectDataRecord(records))
        return { errors: ['Project collections must be an object.'] };
    if (!isProjectDataRecord(project)) return { errors: ['Project metadata must be an object.'] };
    if (Object.hasOwn(records, 'events'))
        return { errors: ['Timeline events are derived and must not be included in project input.'] };
    const excluded = Object.keys(records).filter(key => PROJECT_OWNED_COLLECTIONS.includes(key)
        && !PROJECT_DRAFT_COLLECTIONS.includes(key));
    if (excluded.length) return { errors: excluded.map(key => 'Project input must exclude ' + key + '.') };

    try
    {
        const valueError = projectDraftValueError(project, records);
        if (valueError) return { errors: [valueError] };
        const draftProject = structuredClone(project);
        const draft = structuredClone(records);
        const inputErrors = validateProjectDraft(draftProject, draft, { deferEventReferences: true });
        if (inputErrors.length) return { errors: inputErrors };
        draft.events = buildSampleEvents({
            people: draft.people ?? [],
            families: draft.families ?? [],
            places: draft.places ?? []
        });
        const errors = validateProjectDraft(draftProject, draft);
        return errors.length ? { errors } : { errors, project: draftProject, records: draft };
    }
    catch
    {
        return { errors: ['Invalid project records prevented timeline reconstruction.'] };
    }
}

function projectParentCycle(people, families, parentsFor, childrenFor)
{
    const childrenByParent = new Map();
    const parentCounts = new Map();
    for (const family of families)
    {
        const childIds = childrenFor(family);
        for (const parentId of parentsFor(family).filter(id => people.has(id)))
        {
            if (!childrenByParent.has(parentId)) childrenByParent.set(parentId, new Set());
            const children = childrenByParent.get(parentId);
            for (const childId of childIds)
            {
                if (!people.has(childId) || children.has(childId)) continue;
                children.add(childId);
                parentCounts.set(childId, (parentCounts.get(childId) || 0) + 1);
            }
        }
    }
    const roots = [...people.keys()].filter(id => !parentCounts.has(id));
    for (let i = 0; i < roots.length; i++)
    {
        for (const childId of childrenByParent.get(roots[i]) || [])
        {
            const count = parentCounts.get(childId) - 1;
            if (count) parentCounts.set(childId, count);
            else
            {
                parentCounts.delete(childId);
                roots.push(childId);
            }
        }
    }
    return parentCounts.keys().next().value;
}

function validateProjectDraft(project, records, { deferEventReferences = false } = {})
{
    if (!isProjectDataRecord(project) || typeof project.id !== 'string' || !project.id.trim()
        || typeof project?.name !== 'string' || !project.name.trim()
        || !isProjectDataRecord(records))
        return ['Expected a project with an ID, name, and record collections.'];
    const errors = [];
    const indexes = new Map();
    function rejectUnknownFields(path, record, fields)
    {
        for (const field of Object.keys(record))
            if (!fields.includes(field)) errors.push(path + '.' + field + ' is unexpected.');
    }
    for (const key of Object.keys(records))
        if (!PROJECT_OWNED_COLLECTIONS.includes(key)) errors.push('Unknown collection: ' + key);
    for (const key of PROJECT_OWNED_COLLECTIONS)
    {
        const index = new Map();
        indexes.set(key, index);
        const rows = Object.hasOwn(records, key) ? records[key] : [];
        if (!Array.isArray(rows))
        {
            errors.push(key + ' must be an array.');
            continue;
        }
        for (const [rowIndex, record] of rows.entries())
        {
            if (!isProjectDataRecord(record) || typeof record.id !== 'string' || !record.id.trim())
            {
                errors.push(key + '[' + rowIndex + '] requires a record with a valid ID.');
                continue;
            }
            if (index.has(record.id)) errors.push('Duplicate ' + key + ' ID: ' + record.id);
            if (record.projectId !== project.id) errors.push(key + '/' + record.id + ' belongs to a different project.');
            index.set(record.id, record);
        }
    }
    rejectUnknownFields('project', project, ['id', 'name', 'desc', 'status', 'cover', 'coverPhotoId', 'coverImageSrc',
        'coverPosition', 'defaultPersonId', 'createdAt', 'modifiedAt', 'created', 'modified', 'files', 'notes']);
    if (Object.hasOwn(project, 'cover') && !['paper', 'tree', 'golden-tree', 'photo'].includes(project.cover))
        errors.push('project.cover must identify a supported cover style.');
    if (Object.hasOwn(project, 'coverImageSrc') && typeof project.coverImageSrc !== 'string')
        errors.push('project.coverImageSrc must be text when set.');
    if (Object.hasOwn(project, 'coverPosition'))
    {
        const position = project.coverPosition;
        if (!isProjectDataRecord(position) || !['x', 'y'].every(axis =>
            Number.isFinite(position[axis]) && position[axis] >= 0 && position[axis] <= 100))
            errors.push('project.coverPosition requires x and y percentages from 0 to 100.');
        else rejectUnknownFields('project.coverPosition', position, ['x', 'y']);
    }
    for (const field of ['defaultPersonId', 'coverPhotoId'])
        if (project[field] != null && typeof project[field] !== 'string')
            errors.push('Project ' + field + ' must be a record ID or empty.');
    for (const field of ['desc', 'cover', 'status'])
        if (Object.hasOwn(project, field) && typeof project[field] !== 'string')
            errors.push('Project ' + field + ' must be text.');
    for (const field of ['createdAt', 'modifiedAt'])
        if (Object.hasOwn(project, field) && (typeof project[field] !== 'string' || !Number.isFinite(Date.parse(project[field]))))
            errors.push('Project ' + field + ' must be a valid timestamp.');
    for (const field of ['created', 'modified'])
        if (Object.hasOwn(project, field)) errors.push('Project contains retired display date ' + field + '.');
    for (const field of ['files', 'notes'])
        if (Object.hasOwn(project, field)) errors.push('Project contains retired counter ' + field + '.');
    const people = indexes.get('people');
    if (project.defaultPersonId && !people.has(project.defaultPersonId))
        errors.push('Project default person is missing: ' + project.defaultPersonId);
    if (project.coverPhotoId && !indexes.get('media').has(project.coverPhotoId))
        errors.push('Project cover photo is missing: ' + project.coverPhotoId);
    for (const family of indexes.get('families').values())
    {
        const familyPath = 'families/' + family.id;
        const retiredFields = ['partner1Id', 'partner2Id', 'personAId', 'personBId', 'fatherId', 'motherId',
            'husbandId', 'wifeId', 'childrenIds', 'nonEvents', 'marriageType', 'partner1RoleHint', 'partner2RoleHint',
            'personARoleHint', 'personBRoleHint', ...['start', 'end'].flatMap(role =>
                ['Date', 'DateLabel', 'DateType', 'SortDate', 'Calendar', 'OriginalText', 'PlaceId', 'PlaceText', 'Address']
                    .map(suffix => role + suffix))];
        for (const field of retiredFields)
            if (Object.hasOwn(family, field)) errors.push(familyPath + ' contains retired field ' + field);
        rejectUnknownFields(familyPath, family, ['id', 'projectId', 'type', 'gedcomXref', 'partnerAId', 'partnerBId',
            'partnerARoleHint', 'partnerBRoleHint', 'relationshipType', 'relationshipStatus', 'childIds', 'importedRestriction',
            'parentChildTypes', 'events', 'attributes', 'notes', 'citations', 'mediaIds', 'createdAt', 'updatedAt', ...retiredFields]);
        for (const field of ['attributes', 'notes', 'citations', 'mediaIds'])
            if (!Array.isArray(family[field])) errors.push(familyPath + '.' + field + ' must be an array.');
        for (const field of ['partnerARoleHint', 'partnerBRoleHint'])
            if (Object.hasOwn(family, field) && !['', 'HUSB', 'WIFE'].includes(family[field]))
                errors.push('Family ' + family.id + '.' + field + ' must be HUSB, WIFE, or empty.');
        for (const field of ['createdAt', 'updatedAt'])
            if (Object.hasOwn(family, field) && (typeof family[field] !== 'string' || !Number.isFinite(Date.parse(family[field]))))
                errors.push(familyPath + '.' + field + ' must be a valid timestamp when set.');
        if (!ADD_PERSON_RELATIONSHIP_TYPES.includes(family.relationshipType)
            && !['Single parent', 'Sibling relationship'].includes(family.relationshipType))
            errors.push(familyPath + '.relationshipType is unsupported.');
        if (!['active', 'ended', 'separated', 'divorced', 'annulled', 'unknown'].includes(family.relationshipStatus))
            errors.push(familyPath + '.relationshipStatus is unsupported.');
        if (Object.hasOwn(family, 'gedcomXref') && typeof family.gedcomXref !== 'string')
            errors.push(familyPath + '.gedcomXref must be text when set.');
        if (family.type !== 'family')
            errors.push('Family ' + family.id + '.type must be family.');
        if (!Array.isArray(family.events))
            errors.push('Family ' + family.id + '.events must be an array.');
        const partnerSlots = [family.partnerAId, family.partnerBId];
        if (partnerSlots.some(id => typeof id !== 'string' || (id !== '' && !id.trim())))
        {
            errors.push('Family ' + family.id + ' partner slots must contain a person ID or an empty string.');
            continue;
        }
        const partners = partnerSlots.filter(Boolean);
        if (!partners.length || new Set(partners).size !== partners.length || !Array.isArray(family.childIds))
        {
            errors.push('Invalid family membership in ' + family.id);
            continue;
        }
        if (family.childIds.some(id => typeof id !== 'string' || !id.trim()))
        {
            errors.push('Family ' + family.id + '.childIds must contain nonempty person IDs.');
            continue;
        }
        if (new Set(family.childIds).size !== family.childIds.length)
            errors.push('Duplicate child in ' + family.id);
        for (const id of [...partners, ...family.childIds])
            if (!people.has(id)) errors.push('Family ' + family.id + ' references missing person ' + id);
        if (family.childIds.some(id => partners.includes(id)))
            errors.push('Family ' + family.id + ' lists a person as their own parent.');
        const memberships = new Set(partners.flatMap(parentId =>
            family.childIds.map(childId => parentChildRelationshipKey(parentId, childId))));
        const types = family.parentChildTypes;
        if (types != null && (typeof types !== 'object' || Array.isArray(types)))
            errors.push('Family ' + family.id + '.parentChildTypes must be an object.');
        else for (const [key, type] of Object.entries(types || {}))
        {
            if (!memberships.has(key))
                errors.push('Family ' + family.id + ' has a parentage type for a missing membership: ' + key);
            if (!PARENT_CHILD_RELATIONSHIP_TYPES.includes(type))
                errors.push('Family ' + family.id + ' has an unsupported parentage type: ' + type);
        }
    }
    const cyclePerson = projectParentCycle(people, indexes.get('families').values(),
        family => [family.partnerAId, family.partnerBId],
        family => Array.isArray(family.childIds) ? family.childIds : []);
    if (cyclePerson)
        errors.push('Family memberships contain a parent cycle. Check the ancestry of ' + cyclePerson + '.');
    for (const place of indexes.get('places').values())
    {
        const owner = 'places/' + place.id;
        rejectUnknownFields(owner, place, ['id', 'projectId', 'name', 'alternativeNames', 'coordinates',
            'approximateRadiusMeters', 'createdAt', 'updatedAt', 'parentId']);
        for (const field of ['createdAt', 'updatedAt'])
            if (Object.hasOwn(place, field) && (typeof place[field] !== 'string' || !Number.isFinite(Date.parse(place[field]))))
                errors.push(owner + '.' + field + ' must be a valid timestamp when set.');
        if (Object.hasOwn(place, 'parentId'))
            errors.push(owner + ' contains unsupported field parentId.');
        if (typeof place.name !== 'string' || !place.name.trim())
            errors.push(owner + '.name must be nonempty text.');
        const aliases = place.alternativeNames;
        if (!Array.isArray(aliases) || aliases.some(name => typeof name !== 'string' || !name.trim()))
            errors.push(owner + '.alternativeNames must be an array of nonempty text.');
        else if (new Set(aliases.map(normalizePlaceLookupText)).size !== aliases.length)
            errors.push(owner + '.alternativeNames contains duplicates.');
        const point = place.coordinates;
        const validPoint = isProjectDataRecord(point) && typeof point.lat === 'number' && typeof point.lng === 'number'
            && validLatitude(point.lat) && validLongitude(point.lng);
        if (point !== null && !validPoint)
            errors.push(owner + '.coordinates must be null or contain numeric latitude and longitude in range.');
        if (validPoint) rejectUnknownFields(owner + '.coordinates', point, ['lat', 'lng']);
        const radius = place.approximateRadiusMeters;
        if (radius != null && (typeof radius !== 'number' || !validPlaceRadiusMeters(radius) || !validPoint))
            errors.push(owner + '.approximateRadiusMeters requires a valid radius in meters and a coordinate pair.');
    }

    const references = {
        placeIssues: { placeId: 'places', otherPlaceId: 'places' },
        media: { placeId: 'places', personIds: ['people'], albumIds: ['albums'] },
        archiveFolders: { parentId: 'archiveFolders' },
        archiveFiles: { folderId: 'archiveFolders', documentPlaceId: 'places', linkedPersonIds: ['people'],
            linkedEventIds: ['events'], linkedNoteIds: ['notes'], linkedPlaceIds: ['places'] },
        notes: { collectionIds: ['noteCollections'], relatedNoteIds: ['notes'], linkedPersonIds: ['people'],
            linkedEventIds: ['events'], linkedPlaceIds: ['places'], linkedPhotoIds: ['media'], linkedArchiveFileIds: ['archiveFiles'] },
        events: { familyId: 'families', placeId: 'places', personIds: ['people'], relatedPersonIds: ['people'] },
        boards: { collectionIds: ['boardCollections'] }
    };
    function requireReference(owner, field, target, id)
    {
        if (target === 'events' && deferEventReferences && typeof id === 'string' && id.trim()) return;
        if (typeof id !== 'string' || !id.trim())
        {
            errors.push(owner + '.' + field + ' must be a nonempty record ID.');
            return;
        }
        if (!indexes.get(target).has(id))
            errors.push(owner + '.' + field + ' references missing ' + target + '/' + id);
    }
    for (const [collection, fields] of Object.entries(references))
    {
        for (const record of indexes.get(collection).values())
        {
            const owner = collection + '/' + record.id;
            for (const [field, target] of Object.entries(fields))
            {
                const value = record[field];
                if (!Object.hasOwn(record, field)) continue;
                if (!Array.isArray(target))
                {
                    if (value != null && value !== '') requireReference(owner, field, target, value);
                    continue;
                }
                if (!Array.isArray(value) || new Set(value).size !== value.length)
                {
                    errors.push(owner + '.' + field + ' must contain unique record IDs.');
                    continue;
                }
                for (const id of value) requireReference(owner, field, target[0], id);
            }
        }
    }
    function validateDate(owner, date, isVitalDate = false)
    {
        if (isProjectDataRecord(date))
        {
            rejectUnknownFields(owner, date, ['date', 'dateLabel', 'dateType', 'state', 'calendar',
                'first', 'second', 'originalText', 'sortDate', 'date2', 'date2Label', 'sortDate2',
                'placeId', 'burialPlaceId', 'placeText', 'address', 'reason', 'cause',
                'burialPlaceText', 'burialAddress', ...(isVitalDate ? ['importedRestriction'] : [])]);
            for (const field of ['date', 'dateLabel', 'sortDate', 'date2', 'date2Label', 'sortDate2',
                'placeText', 'address', 'reason', 'cause', 'burialPlaceText', 'burialAddress'])
                if (date[field] != null && typeof date[field] !== 'string')
                    errors.push(owner + '.' + field + ' must be text or null.');
            for (const field of ['placeId', 'burialPlaceId'])
                if (date[field] != null && date[field] !== '') requireReference(owner, field, 'places', date[field]);
            for (const field of ['first', 'second'])
                if (isProjectDataRecord(date[field]))
                    rejectUnknownFields(owner + '.' + field, date[field], ['year', 'month', 'day']);
        }
        const validParts = parts => isProjectDataRecord(parts)
            && [parts.year, parts.month, parts.day].every(value => value === null || Number.isInteger(value))
            && genealogyDateParts(parts.year, parts.month, parts.day, date.calendar);
        if (!isProjectDataRecord(date) || !GENEALOGY_DATE_TYPES.includes(date.dateType) || !GENEALOGY_CALENDARS.includes(date.calendar)
            || !['empty', 'unknown', 'known', 'unparsed'].includes(date.state)
            || typeof date.originalText !== 'string' || !validParts(date.first)
            || (date.second !== null && !validParts(date.second))
            || (date.state === 'known'
                ? (date.dateType === 'Between') !== (date.second !== null)
                    || normalizeGenealogyDateInput({ state: date.state, dateType: date.dateType, calendar: date.calendar, first: date.first, second: date.second }).state !== 'known'
                : date.first.year !== null || date.second !== null))
            errors.push(owner + ' must contain a structured genealogy date.');
    }
    function validatePersonRegions(path, regions, surface)
    {
        if (regions == null) return;
        if (!isProjectDataRecord(regions))
            errors.push(path + '.personRegions must be keyed by person ID.');
        else for (const [personId, region] of Object.entries(regions))
        {
            requireReference(path, 'personRegions', 'people', personId);
            if (isProjectDataRecord(region))
                rejectUnknownFields(path + '.personRegions.' + personId, region, ['x', 'y', 'width', 'height']);
            if (!isProjectImageRegion(region))
                errors.push(path + '.personRegions.' + personId + ' must be within the ' + surface + '.');
        }
    }
    const containerFields = {
        albums: ['description', 'createdAt'],
        archiveFolders: ['parentId', 'favorite', 'createdAt', 'updatedAt'],
        noteCollections: ['description'],
        boardCollections: ['description']
    };
    for (const [collection, fields] of Object.entries(containerFields))
    {
        for (const record of indexes.get(collection).values())
        {
            const path = collection + '/' + record.id;
            rejectUnknownFields(path, record, ['id', 'projectId', 'name', ...fields]);
            if (typeof record.name !== 'string' || !record.name.trim())
                errors.push(path + '.name must be nonempty text.');
            if (fields.includes('description') && typeof record.description !== 'string')
                errors.push(path + '.description must be text.');
            for (const field of fields.filter(key => key.endsWith('At')))
                if (typeof record[field] !== 'string' || !Number.isFinite(Date.parse(record[field])))
                    errors.push(path + '.' + field + ' must be a valid timestamp.');
            if (collection === 'archiveFolders' && !Object.hasOwn(record, 'parentId'))
                errors.push(path + '.parentId is required.');
            if (Object.hasOwn(record, 'favorite') && typeof record.favorite !== 'boolean')
                errors.push(path + '.favorite must be boolean.');
        }
    }
    for (const photo of indexes.get('media').values())
    {
        const path = 'media/' + photo.id;
        rejectUnknownFields(path, photo, ['id', 'projectId', 'kind', 'title', 'filename', 'src', 'mimeType',
            'width', 'height', 'sizeBytes', 'personIds', 'personRegions', 'albumIds', 'date', 'placeId',
            'placeText', 'caption', 'favorite', 'createdAt', 'updatedAt']);
        for (const field of ['personIds', 'albumIds', 'placeId'])
            if (!Object.hasOwn(photo, field)) errors.push(path + '.' + field + ' is required.');
        for (const field of ['title', 'mimeType', 'placeText', 'caption'])
            if (typeof photo[field] !== 'string') errors.push(path + '.' + field + ' must be text.');
        if (Object.hasOwn(photo, 'src') && typeof photo.src !== 'string')
            errors.push(path + '.src must be text when set.');
        if (typeof photo.favorite !== 'boolean') errors.push(path + '.favorite must be boolean.');
        for (const field of ['createdAt', 'updatedAt'])
            if (typeof photo[field] !== 'string' || !Number.isFinite(Date.parse(photo[field])))
                errors.push(path + '.' + field + ' must be a valid timestamp.');
        if (photo.kind !== 'photo') errors.push(path + '.kind must be photo.');
        if (typeof photo.filename !== 'string' || !photo.filename.trim())
            errors.push(path + '.filename must be nonempty text.');
        for (const field of ['width', 'height', 'sizeBytes'])
            if (photo[field] != null && (!Number.isSafeInteger(photo[field]) || photo[field] < (field === 'sizeBytes' ? 0 : 1)))
                errors.push(path + '.' + field + ' has an invalid numeric value.');
        if (photo.date != null)
        {
            validateDate(path + '.date', photo.date);
            if (Object.hasOwn(photo.date, 'fromDate') || Object.hasOwn(photo.date, 'toDate'))
                errors.push(path + '.date contains retired photo range fields.');
        }
        validatePersonRegions(path, photo.personRegions, 'photo');
    }
    for (const file of indexes.get('archiveFiles').values())
        if (file.documentDate != null) validateDate('archiveFiles/' + file.id + '.documentDate', file.documentDate);
    for (const source of indexes.get('sources').values())
    {
        const path = 'sources/' + source.id;
        rejectUnknownFields(path, source, ['id', 'projectId', 'title', 'category', 'providedBy', 'placeId',
            'reference', 'url', 'accessedDate', 'notes', 'favorite', 'createdAt', 'updatedAt']);
        for (const field of ['providedBy', 'reference', 'url', 'notes'])
            if (typeof source[field] !== 'string') errors.push(path + '.' + field + ' must be text.');
        if (typeof source.favorite !== 'boolean') errors.push(path + '.favorite must be boolean.');
        for (const field of ['createdAt', 'updatedAt'])
            if (typeof source[field] !== 'string' || !Number.isFinite(Date.parse(source[field])))
                errors.push(path + '.' + field + ' must be a valid timestamp.');
        if (typeof source.title !== 'string' || !source.title.trim()) errors.push(path + '.title must be nonempty text.');
        if (source.category !== '' && !SOURCE_CATEGORY_BY_VALUE.has(source.category))
            errors.push(path + '.category must be a supported Source category or empty.');
        if (source.accessedDate !== '') validateDate(path + '.accessedDate', source.accessedDate);
        if (source.placeId != null && source.placeId !== '') requireReference(path, 'placeId', 'places', source.placeId);
    }

    function validateFactReferences(owner, fact, isVitalDate = false)
    {
        if (!isProjectDataRecord(fact))
        {
            errors.push(owner + ' must be a record.');
            return;
        }
        if (Object.hasOwn(fact, 'importedRestriction')
            && (typeof fact.importedRestriction !== 'string' || !fact.importedRestriction.trim()))
            errors.push(owner + '.importedRestriction must be nonempty text when set.');
        if (isVitalDate) validateDate(owner, fact, true);
        else for (const field of ['date', 'fromDate', 'toDate'])
            if (fact[field] != null) validateDate(owner + '.' + field, fact[field]);
        if (!isVitalDate)
            for (const field of ['placeId', 'burialPlaceId'])
                if (fact[field] != null && fact[field] !== '') requireReference(owner, field, 'places', fact[field]);
        if (Object.hasOwn(fact, 'mediaIds'))
        {
            if (!Array.isArray(fact.mediaIds) || new Set(fact.mediaIds).size !== fact.mediaIds.length)
                errors.push(owner + '.mediaIds must contain unique record IDs.');
            else for (const id of fact.mediaIds) requireReference(owner, 'mediaIds', 'media', id);
        }
    }
    for (const collection of ['people', 'families'])
    {
        for (const record of indexes.get(collection).values())
        {
            const owner = collection + '/' + record.id;
            validateFactReferences(owner, record);
            if (collection === 'people')
            {
                rejectUnknownFields(owner, record, ['id', 'projectId', 'createdAt', 'updatedAt', 'primaryPhotoId',
                    'primaryPhotoCrop', 'names', 'gender', 'sex', 'livingStatus', 'avatarClass', 'birth', 'death',
                    'meta', 'profile', 'attributes', 'events', 'notes', 'citations', 'mediaIds', 'deleted', 'importedRestriction']);
                for (const field of ['createdAt', 'updatedAt'])
                    if (Object.hasOwn(record, field) && (typeof record[field] !== 'string' || !Number.isFinite(Date.parse(record[field]))))
                        errors.push(owner + '.' + field + ' must be a valid timestamp when set.');
                if (Object.hasOwn(record, 'deleted') && typeof record.deleted !== 'boolean')
                    errors.push(owner + '.deleted must be boolean when set.');
                if (Object.hasOwn(record, 'avatarClass') && typeof record.avatarClass !== 'string')
                    errors.push(owner + '.avatarClass must be text when set.');
                if (!isProjectDataRecord(record.profile))
                    errors.push(owner + '.profile must be a record.');
                else
                {
                    rejectUnknownFields(owner + '.profile', record.profile, ['alternativeNames']);
                    if (record.profile.alternativeNames != null && typeof record.profile.alternativeNames !== 'string')
                        errors.push(owner + '.profile.alternativeNames must be text or null.');
                }
                for (const field of ['events', 'attributes', 'notes', 'citations'])
                    if (!Object.hasOwn(record, field) || (['notes', 'citations'].includes(field) && !Array.isArray(record[field])))
                        errors.push(owner + '.' + field + ' must be an array.');
                validateProjectPersonIdentity(record, owner, errors);
                const names = record.names;
                if (!names || typeof names !== 'object' || Array.isArray(names))
                    errors.push(owner + '.names must be a record.');
                else
                {
                    if (Object.hasOwn(names, 'display') || Object.hasOwn(names, 'initials'))
                        errors.push(owner + '.names must exclude derived display and initials.');
                    const nameFields = ['first', 'middle', 'last', 'maiden', 'prefix', 'suffix'];
                    rejectUnknownFields(owner + '.names', names, [...nameFields, 'display', 'initials']);
                    for (const field of nameFields)
                    {
                        if (!Object.hasOwn(names, field) && !['first', 'last'].includes(field)) continue;
                        const value = names[field];
                        if (typeof value !== 'string' || value.length > 1024)
                            errors.push(owner + '.names.' + field + ' must be text of at most 1024 characters.');
                    }
                }

                if (record.meta !== undefined)
                {
                    if (!isProjectDataRecord(record.meta)) errors.push(owner + '.meta must be a record.');
                    else
                    {
                        rejectUnknownFields(owner + '.meta', record.meta, ['updated', 'sourceStatus', 'placeholderRole']);
                        for (const key of ['updated', 'sourceStatus'])
                            if (Object.hasOwn(record.meta, key) && typeof record.meta[key] !== 'string')
                                errors.push(owner + '.meta.' + key + ' must be text.');
                        if (Object.hasOwn(record.meta, 'placeholderRole') && !['mother', 'father'].includes(record.meta.placeholderRole))
                            errors.push(owner + '.meta.placeholderRole must be mother or father.');
                    }
                }
                if (record.primaryPhotoId != null && record.primaryPhotoId !== '')
                    requireReference(owner, 'primaryPhotoId', 'media', record.primaryPhotoId);
                validateProjectPhotoCrop(record.primaryPhotoCrop, owner + '.primaryPhotoCrop', errors);
                for (const field of ['birth', 'death'])
                    validateFactReferences(owner + '.' + field, record[field], true);
            }
            for (const field of ['events', 'attributes'])
            {
                const facts = record[field];
                if (!Object.hasOwn(record, field)) continue;
                if (!Array.isArray(facts))
                {
                    errors.push(owner + '.' + field + ' must be an array.');
                    continue;
                }
                if (collection === 'families' && field === 'events')
                    validateProjectFamilyEventRoles(facts, owner + '.events', errors);
                const factIds = new Set();
                for (const [index, fact] of facts.entries())
                {
                    const factPath = owner + '.' + field + '[' + index + ']';
                    if (!isProjectDataRecord(fact))
                    {
                        errors.push(factPath + ' must be a record.');
                        continue;
                    }
                    const commonFields = ['id', 'date', 'placeId', 'placeText', 'address', 'notes', 'citations', 'mediaIds', 'importedRestriction'];
                    const eventFields = ['gedcomTag', 'eventType', 'typeLabel', 'confidence', 'description'];
                    const attributeFields = ['tag', 'type', 'value', 'fromDate', 'toDate', 'company', 'institutionName', 'institutionType'];
                    if (collection === 'families') eventFields.push('relationshipManagedRole');
                    rejectUnknownFields(factPath, fact, [...commonFields, ...(field === 'events' ? eventFields : attributeFields)]);
                    if (Object.hasOwn(fact, 'citations') && !Array.isArray(fact.citations))
                        errors.push(factPath + '.citations must be an array when set.');
                    const textFields = field === 'events'
                        ? ['eventType', 'typeLabel', 'confidence', 'description']
                        : ['type', 'value'];
                    for (const key of [...textFields, 'placeText', 'address', 'notes'])
                        if (fact[key] != null && typeof fact[key] !== 'string')
                            errors.push(factPath + '.' + key + ' must be text or null.');
                    if (typeof fact?.id !== 'string' || !fact.id.trim() || factIds.has(fact.id))
                        errors.push(factPath + ' requires a unique nonempty fact ID.');
                    else factIds.add(fact.id);
                    if (field === 'events'
                        && (typeof fact?.gedcomTag !== 'string' || !fact.gedcomTag.trim() || Object.hasOwn(fact, 'tag')))
                        errors.push(factPath + ' requires a canonical gedcomTag and cannot contain tag.');
                    if (collection === 'people' && field === 'events' && fact && Object.hasOwn(fact, 'type'))
                        errors.push(factPath + ' contains retired person event field type.');
                    if (field === 'attributes' && (typeof fact?.tag !== 'string' || !fact.tag.trim()))
                        errors.push(factPath + ' requires a nonempty attribute tag.');
                    if (field === 'attributes' && ['EDUC', 'OCCU'].includes(fact?.tag))
                    {
                        if (Object.hasOwn(fact, 'date'))
                            errors.push(factPath + ' contains retired ranged attribute field date.');
                        if (Object.hasOwn(fact, 'agency'))
                            errors.push(factPath + ' contains retired attribute field agency.');
                        if (fact.tag === 'EDUC' && Object.hasOwn(fact, 'type'))
                            errors.push(factPath + ' contains retired education field type.');
                        for (const key of fact.tag === 'EDUC' ? ['institutionName', 'institutionType'] : ['company'])
                            if (Object.hasOwn(fact, key) && typeof fact[key] !== 'string')
                                errors.push(factPath + '.' + key + ' must be text.');
                    }
                    validateFactReferences(factPath, fact);
                }
            }
        }
    }
    for (const issue of indexes.get('placeIssues').values())
    {
        const owner = 'placeIssues/' + issue.id;
        const pairFields = issue.type === 'possible_duplicate' ? ['otherPlaceId', 'pairKey', 'fingerprints'] : [];
        rejectUnknownFields(owner, issue, ['id', 'projectId', 'placeId', 'type', 'status', 'dismissedAt', 'reason', ...pairFields]);
        if (!['missing_coordinates', 'invalid_coordinates', 'possible_duplicate', 'unlinked'].includes(issue.type))
            errors.push(owner + '.type is unsupported.');
        if (issue.status !== 'dismissed') errors.push(owner + '.status must be dismissed.');
        if (typeof issue.dismissedAt !== 'string' || !Number.isFinite(Date.parse(issue.dismissedAt)))
            errors.push(owner + '.dismissedAt must be a valid timestamp.');
        if (typeof issue.reason !== 'string') errors.push(owner + '.reason must be text.');
        if (issue.placeId == null || issue.placeId === '') errors.push(owner + '.placeId is required.');
        if (issue.type !== 'possible_duplicate') continue;
        if (!issue.otherPlaceId || issue.otherPlaceId === issue.placeId)
            errors.push(owner + '.otherPlaceId must identify a different place.');
        if (typeof issue.pairKey !== 'string' || !issue.pairKey.trim())
            errors.push(owner + '.pairKey must be nonempty text.');
        if (!isProjectDataRecord(issue.fingerprints)
            || Object.keys(issue.fingerprints).length !== 2
            || [issue.placeId, issue.otherPlaceId].some(id => typeof issue.fingerprints[id] !== 'string'))
            errors.push(owner + '.fingerprints must contain text for both places.');
    }
    const linkCollections = new Map(Object.entries({
        person: 'people', family: 'families', place: 'places', event: 'events', photo: 'media',
        album: 'albums', archiveFile: 'archiveFiles', source: 'sources', note: 'notes', board: 'boards'
    }));
    for (const link of indexes.get('links').values())
    {
        const owner = 'links/' + link.id;
        rejectUnknownFields(owner, link, ['id', 'projectId', 'fromType', 'fromId', 'toType', 'toId', 'label']);
        for (const endpoint of ['from', 'to'])
        {
            const target = linkCollections.get(link[endpoint + 'Type']);
            if (!target) errors.push(owner + '.' + endpoint + 'Type must identify a supported collection.');
            else requireReference(owner, endpoint + 'Id', target, link[endpoint + 'Id']);
        }
        if (typeof link.label !== 'string') errors.push(owner + '.label must be text.');
    }
    for (const filter of indexes.get('placeSavedFilters').values())
    {
        const owner = 'placeSavedFilters/' + filter.id;
        rejectUnknownFields(owner, filter, ['id', 'projectId', 'name', 'description', 'filters', 'createdAt', 'updatedAt']);
        for (const field of ['createdAt', 'updatedAt'])
            if (typeof filter[field] !== 'string' || !Number.isFinite(Date.parse(filter[field])))
                errors.push(owner + '.' + field + ' must be a valid timestamp.');
        if (typeof filter.name !== 'string' || !filter.name.trim()) errors.push(owner + '.name must be nonempty text.');
        if (typeof filter.description !== 'string') errors.push(owner + '.description must be text.');
        if (!isProjectDataRecord(filter.filters))
        {
            errors.push(owner + '.filters must be a record.');
            continue;
        }
        const fields = ['personId', 'surname', 'yearFrom', 'yearTo', 'eventType', 'country', 'mapped'];
        for (const key of Object.keys(filter.filters))
            if (!fields.includes(key)) errors.push(owner + '.filters.' + key + ' is unexpected.');
        for (const key of fields)
            if (typeof filter.filters[key] !== 'string') errors.push(owner + '.filters.' + key + ' must be text.');
        if (!['all', 'mapped', 'unmapped'].includes(filter.filters.mapped))
            errors.push(owner + '.filters.mapped must be all, mapped or unmapped.');
        if (filter.filters.personId) requireReference(owner, 'filters.personId', 'people', filter.filters.personId);
    }
    for (const draft of indexes.get('publishDrafts').values())
    {
        const owner = 'publishDrafts/' + draft.id;
        rejectUnknownFields(owner, draft, ['id', 'projectId', 'focusPersonId', 'title', 'type', 'scope',
            'updated', 'privacy', 'sources', 'format', 'status', 'preview', 'details']);
        if (!['report', 'chart', 'export'].includes(draft.type)) errors.push(owner + '.type is unsupported.');
        if (!['draft', 'exported'].includes(draft.status)) errors.push(owner + '.status is unsupported.');
        for (const key of ['title', 'preview', 'scope', 'updated', 'privacy', 'sources', 'format'])
            if (typeof draft[key] !== 'string' || !draft[key].trim()) errors.push(owner + '.' + key + ' must be nonempty text.');
        if (!Array.isArray(draft.details) || draft.details.some(value => typeof value !== 'string'))
            errors.push(owner + '.details must be an array of text.');
        if (draft.focusPersonId != null && draft.focusPersonId !== '')
            requireReference(owner, 'focusPersonId', 'people', draft.focusPersonId);
    }
    const folders = indexes.get('archiveFolders');
    const checkedFolders = new Set();
    for (const folder of folders.values())
    {
        const path = new Set();
        let current = folder;
        while (current && !checkedFolders.has(current.id))
        {
            if (path.has(current.id))
            {
                errors.push('Archive folder hierarchy contains a cycle at ' + current.id);
                break;
            }
            path.add(current.id);
            current = folders.get(current.parentId);
        }
        for (const id of path) checkedFolders.add(id);
    }
    const notes = indexes.get('notes');
    for (const note of notes.values())
    {
        const path = 'notes/' + note.id;
        const referenceFields = Object.keys(references.notes);
        rejectUnknownFields(path, note, ['id', 'projectId', 'title', 'body', 'bodyDelta', 'bodyFormat',
            'favorite', 'archived', 'tags', 'checklist', 'createdAt', 'updatedAt', 'importedRestriction',
            'created', 'updated', 'modified', ...referenceFields]);
        for (const field of referenceFields)
            if (!Object.hasOwn(note, field)) errors.push(path + '.' + field + ' is required.');
        if (Object.hasOwn(note, 'tags') && (!Array.isArray(note.tags)
            || note.tags.some(tag => typeof tag !== 'string' || !tag.trim())))
            errors.push(path + '.tags must be an array of nonempty text.');
        for (const field of ['favorite', 'archived'])
            if (typeof note[field] !== 'boolean') errors.push(path + '.' + field + ' must be boolean.');
        if (!Array.isArray(note.checklist)) errors.push(path + '.checklist must be an array.');
        else
        {
            const ids = new Set();
            for (const [index, item] of note.checklist.entries())
            {
                const itemPath = path + '.checklist[' + index + ']';
                if (!isProjectDataRecord(item))
                {
                    errors.push(itemPath + ' must be a record.');
                    continue;
                }
                rejectUnknownFields(itemPath, item, ['id', 'text', 'done']);
                if (typeof item.id !== 'string' || !item.id.trim() || ids.has(item.id))
                    errors.push(itemPath + '.id must be nonempty and unique within the checklist.');
                else ids.add(item.id);
                if (typeof item.text !== 'string') errors.push(itemPath + '.text must be text.');
                if (typeof item.done !== 'boolean') errors.push(itemPath + '.done must be boolean.');
            }
        }
        for (const field of ['createdAt', 'updatedAt'])
            if (typeof note[field] !== 'string' || !Number.isFinite(Date.parse(note[field])))
                errors.push(path + '.' + field + ' must be a valid timestamp.');
        for (const field of ['created', 'updated', 'modified'])
            if (Object.hasOwn(note, field)) errors.push(path + ' contains retired display date ' + field + '.');
        for (const field of ['title', 'body'])
            if (typeof note[field] !== 'string') errors.push(path + '.' + field + ' must be text.');
        if (Object.hasOwn(note, 'importedRestriction')
            && (typeof note.importedRestriction !== 'string' || !note.importedRestriction.trim()))
            errors.push(path + '.importedRestriction must be nonempty text when set.');
        validateProjectRichText(note.bodyDelta, note.bodyFormat, path + '.bodyDelta', errors);
        if (!Array.isArray(note.relatedNoteIds)) continue;
        for (const id of note.relatedNoteIds)
        {
            const related = notes.get(id);
            if (id === note.id || (related && (!Array.isArray(related.relatedNoteIds) || !related.relatedNoteIds.includes(note.id))))
                errors.push('Note ' + note.id + ' has an invalid reciprocal link to ' + id);
        }
    }
    for (const file of indexes.get('archiveFiles').values())
    {
        const owner = 'archiveFiles/' + file.id;
        const referenceFields = Object.keys(references.archiveFiles);
        rejectUnknownFields(owner, file, ['id', 'projectId', 'name', 'originalName', 'kind', 'type', 'mimeType',
            'sizeBytes', 'favorite', 'description', 'documentDate', 'personRegions',
            'assetUrl', 'previewUrl', 'thumbnailUrl', 'addedAt', 'updatedAt',
            'size', 'added', 'updated', 'linkedSourceIds', ...referenceFields]);
        for (const field of referenceFields)
            if (!Object.hasOwn(file, field)) errors.push(owner + '.' + field + ' is required.');
        if (!['img', 'pdf', 'doc', 'sheet', 'audio', 'archive', 'file'].includes(file.kind))
            errors.push(owner + '.kind is unsupported.');
        if (typeof file.favorite !== 'boolean') errors.push(owner + '.favorite must be boolean.');
        for (const field of ['type', 'mimeType', 'description'])
            if (typeof file[field] !== 'string') errors.push(owner + '.' + field + ' must be text.');
        for (const field of ['originalName', 'assetUrl', 'previewUrl', 'thumbnailUrl'])
            if (Object.hasOwn(file, field) && typeof file[field] !== 'string')
                errors.push(owner + '.' + field + ' must be text when set.');
        if (!Number.isSafeInteger(file.sizeBytes) || file.sizeBytes < 0)
            errors.push(owner + '.sizeBytes must be a nonnegative integer.');
        if (Object.hasOwn(file, 'size')) errors.push(owner + ' contains retired file size label.');
        for (const field of ['addedAt', 'updatedAt'])
            if (typeof file[field] !== 'string' || !Number.isFinite(Date.parse(file[field])))
                errors.push(owner + '.' + field + ' must be a valid timestamp.');
        for (const field of ['added', 'updated'])
            if (Object.hasOwn(file, field)) errors.push(owner + ' contains retired display date ' + field + '.');
        if (typeof file.name !== 'string' || !file.name.trim())
            errors.push(owner + '.name must be nonempty text.');
        if (Object.hasOwn(file, 'linkedSourceIds'))
            errors.push(owner + ' contains retired field linkedSourceIds.');
        if (file.documentPlaceId && Array.isArray(file.linkedPlaceIds) && file.linkedPlaceIds.includes(file.documentPlaceId))
            errors.push(owner + ' repeats its document place in related places.');
        validatePersonRegions(owner, file.personRegions, 'Archive image');
    }
    const citationKeys = new Set();
    const citationTargets = new Map(Object.entries({
        file: 'archiveFiles', photo: 'media', person: 'people', event: 'events', note: 'notes', place: 'places'
    }));
    for (const link of indexes.get('sourceLinks').values())
    {
        const owner = 'sourceLinks/' + link.id;
        rejectUnknownFields(owner, link, ['id', 'projectId', 'sourceId', 'targetType', 'targetId']);
        requireReference(owner, 'sourceId', 'sources', link.sourceId);
        const target = citationTargets.get(link.targetType);
        if (target) requireReference(owner, 'targetId', target, link.targetId);
        else errors.push(owner + ' has an invalid target type.');
        const key = JSON.stringify([link.sourceId, link.targetType, link.targetId]);
        if (citationKeys.has(key)) errors.push(owner + ' duplicates an existing source link.');
        citationKeys.add(key);
    }
    for (const board of indexes.get('boards').values()) validateProjectBoard(board, indexes, errors, validateDate, rejectUnknownFields);
    return errors;
}

function isProjectImageRegion(region)
{
    return isProjectDataRecord(region)
        && ['x', 'y', 'width', 'height'].every(key => Number.isFinite(region[key]))
        && Object.keys(region).every(key => ['x', 'y', 'width', 'height'].includes(key))
        && region.x >= 0 && region.y >= 0 && region.width > 0 && region.height > 0
        && region.x + region.width <= 1.000001 && region.y + region.height <= 1.000001;
}

function validateProjectPhotoCrop(crop, path, errors)
{
    if (crop == null) return;
    if (!isProjectDataRecord(crop)
        || !['centerX', 'centerY'].every(key => Number.isFinite(crop[key]) && crop[key] >= 0 && crop[key] <= 1)
        || !Number.isFinite(crop.zoom) || crop.zoom < PERSON_PHOTO_ZOOM_MIN || crop.zoom > PERSON_PHOTO_ZOOM_MAX
        || !PERSON_PHOTO_ROTATIONS.includes(crop.rotation))
    {
        errors.push(path + ' requires valid normalized center coordinates, zoom and rotation.');
        return;
    }
    for (const key of Object.keys(crop))
        if (!['centerX', 'centerY', 'zoom', 'rotation'].includes(key)) errors.push(path + '.' + key + ' is unexpected.');
}

function validateProjectRichText(delta, format, path, errors)
{
    if (format === '' && delta === null) return;
    if (format !== 'quill-delta-v1' || !isProjectDataRecord(delta) || !Array.isArray(delta.ops))
    {
        errors.push(path + ' requires a matching rich-text format and delta.');
        return;
    }
    for (const field of Object.keys(delta))
        if (field !== 'ops') errors.push(path + '.' + field + ' is unexpected.');
    const attributeValidators = new Map(Object.entries({
        bold: value => value === true,
        italic: value => value === true,
        underline: value => value === true,
        strike: value => value === true,
        blockquote: value => value === true,
        color: value => typeof value === 'string' && /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(value),
        background: value => typeof value === 'string' && /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(value),
        size: value => ['small', 'large', 'huge'].includes(value),
        header: value => [2, 3].includes(value),
        list: value => ['bullet', 'ordered'].includes(value),
        align: value => ['center', 'right', 'justify'].includes(value),
        indent: value => Number.isInteger(value) && value >= 1 && value <= 8,
        link: value => typeof value === 'string' && Boolean(value.trim())
    }));
    for (const [index, operation] of delta.ops.entries())
    {
        const owner = path + '.ops[' + index + ']';
        if (!isProjectDataRecord(operation))
        {
            errors.push(owner + ' must be a record.');
            continue;
        }
        if (typeof operation.insert !== 'string' || !operation.insert)
            errors.push(owner + '.insert must be nonempty text.');
        for (const field of Object.keys(operation))
            if (!['insert', 'attributes'].includes(field)) errors.push(owner + '.' + field + ' is unexpected.');
        if (!Object.hasOwn(operation, 'attributes')) continue;
        if (!isProjectDataRecord(operation.attributes))
        {
            errors.push(owner + '.attributes must be a record.');
            continue;
        }
        for (const [key, value] of Object.entries(operation.attributes))
            if (!attributeValidators.get(key)?.(value))
                errors.push(owner + '.attributes.' + key + ' is unsupported or invalid.');
    }
}

function validateProjectPersonIdentity(person, path, errors)
{
    if (!['Living', 'Deceased', 'Unknown'].includes(person.livingStatus))
        errors.push(path + '.livingStatus must be Living, Deceased, or Unknown.');
    if (!['male', 'female', 'unknown'].includes(person.gender) || Object.hasOwn(person, 'sex'))
        errors.push(path + ' requires a canonical gender and cannot contain sex.');
}

function validateProjectFamilyEventRoles(events, path, errors)
{
    if (!Array.isArray(events)) return;
    const roles = new Set();
    for (const [index, event] of events.entries())
    {
        const role = event?.relationshipManagedRole;
        if (role === undefined || role === '') continue;
        const field = path + '[' + index + '].relationshipManagedRole';
        if (!['start', 'end'].includes(role))
            errors.push(field + ' must be start or end when set.');
        else if (roles.has(role))
            errors.push(field + ' duplicates the current ' + role + ' event.');
        roles.add(role);
    }
}

function validateProjectBoard(board, indexes, errors, validateDate, rejectUnknownFields)
{
    const owner = 'boards/' + board.id;
    rejectUnknownFields(owner, board, ['id', 'projectId', 'title', 'description', 'collectionIds',
        'favorite', 'archived', 'createdAt', 'modifiedAt', 'thumb', 'diagram', 'people', 'evidence', 'questions', 'modified']);
    if (Object.hasOwn(board, 'thumb') && typeof board.thumb !== 'string')
        errors.push(owner + '.thumb must be text when set.');
    for (const field of ['people', 'evidence', 'questions'])
        if (Object.hasOwn(board, field))
            errors.push(owner + ' contains retired board field ' + field + '.');
    if (typeof board.title !== 'string' || !board.title.trim() || board.title.length > 160)
        errors.push(owner + '.title must be nonempty text of at most 160 characters.');
    if (typeof board.description !== 'string' || board.description.length > 500)
        errors.push(owner + '.description must be text of at most 500 characters.');
    if (!Array.isArray(board.collectionIds))
        errors.push(owner + '.collectionIds must be an array.');
    for (const field of ['favorite', 'archived'])
        if (typeof board[field] !== 'boolean') errors.push(owner + '.' + field + ' must be boolean.');
    for (const field of ['createdAt', 'modifiedAt'])
        if (typeof board[field] !== 'string' || !Number.isFinite(Date.parse(board[field])))
            errors.push(owner + '.' + field + ' must be a valid timestamp.');
    if (Object.hasOwn(board, 'modified'))
        errors.push(owner + ' contains retired display date modified.');
    const diagram = board.diagram;
    if (!isProjectDataRecord(diagram))
    {
        errors.push(owner + '.diagram must be a record.');
        return;
    }
    rejectUnknownFields(owner + '.diagram', diagram, ['themeProvenanceVersion', 'canvas', 'personCardDefaults',
        'cardAppearanceDefaults', 'connectionDefaults', 'assets', 'people', 'families', 'nodes', 'connections']);
    function validatePaint(path, paint)
    {
        if (!isProjectDataRecord(paint) || typeof paint.color !== 'string' || !/^#[0-9a-f]{6}$/i.test(paint.color)
            || !Number.isInteger(paint.opacity) || paint.opacity < 0 || paint.opacity > 100
            || typeof paint.enabled !== 'boolean')
            errors.push(path + ' must contain a hex color, integer opacity from 0 to 100, and boolean enabled flag.');
        if (isProjectDataRecord(paint)) rejectUnknownFields(path, paint, ['color', 'opacity', 'enabled']);
    }
    function validateAppearancePaints(path, appearance)
    {
        if (!isProjectDataRecord(appearance))
        {
            errors.push(path + ' must be a record.');
            return;
        }
        rejectUnknownFields(path, appearance, ['fill', 'stroke', 'text', 'strokeWidth', 'strokePattern',
            'paintOverrides', 'styleOverrides', 'shadowEnabled', 'cornerRadius', 'fontSize', 'imageOpacity',
            'backgroundColor', 'strokeColor', 'textColor', 'strokeType']);
        if (appearance.shadowEnabled != null && typeof appearance.shadowEnabled !== 'boolean')
            errors.push(path + '.shadowEnabled must be boolean or null.');
        if (Object.hasOwn(appearance, 'styleOverrides'))
        {
            const flags = appearance.styleOverrides;
            if (!isProjectDataRecord(flags))
                errors.push(path + '.styleOverrides must be a record.');
            else
            {
                const fields = ['strokeWidth', 'strokePattern'];
                rejectUnknownFields(path + '.styleOverrides', flags, fields);
                for (const field of fields)
                    if (typeof flags[field] !== 'boolean')
                        errors.push(path + '.styleOverrides.' + field + ' must be boolean.');
            }
        }
        for (const [field, minimum, maximum] of [
            ['strokeWidth', GENEO_STROKE_WIDTH_MIN, GENEO_STROKE_WIDTH_MAX],
            ['cornerRadius', 0, 32], ['imageOpacity', 0, 100], ['fontSize', 8, 72]
        ])
            if (Object.hasOwn(appearance, field) && (!Number.isInteger(appearance[field])
                || appearance[field] < minimum || appearance[field] > maximum))
                errors.push(path + '.' + field + ' is outside its supported range.');
        if (Object.hasOwn(appearance, 'strokePattern') && !['solid', 'dashed'].includes(appearance.strokePattern))
            errors.push(path + '.strokePattern must be solid or dashed.');
        for (const field of ['fill', 'stroke', 'text'])
            if (appearance && Object.hasOwn(appearance, field))
                validatePaint(path + '.' + field, appearance[field]);
    }
    validatePaint(owner + '.diagram.canvas.backgroundPaint', diagram?.canvas?.backgroundPaint);
    validatePaint(owner + '.diagram.connectionDefaults.line', diagram?.connectionDefaults?.line);
    const canvasPath = owner + '.diagram.canvas';
    const canvas = diagram.canvas;
    if (!isProjectDataRecord(canvas) || !['clear', 'dots', 'grid'].includes(canvas.backgroundPattern)
        || !isProjectDataRecord(canvas.backgroundPaint))
        errors.push(canvasPath + ' requires a background pattern and paint.');
    if (isProjectDataRecord(canvas))
    {
        const flags = ['snapToGrid', 'alwaysShowSockets', 'shadowEnabled', 'colorPersonCardsByGender'];
        rejectUnknownFields(canvasPath, canvas, ['backgroundPattern', 'backgroundPaint', 'backgroundOverride', ...flags,
            'gridVisible', 'backgroundColor']);
        for (const field of flags)
            if (typeof canvas[field] !== 'boolean') errors.push(canvasPath + '.' + field + ' must be boolean.');
        for (const field of ['gridVisible', 'backgroundColor'])
            if (Object.hasOwn(canvas, field))
                errors.push(canvasPath + ' contains retired field ' + field + '.');
    }
    if (diagram?.themeProvenanceVersion === 1)
    {
        const validateOverrides = (path, overrides) =>
        {
            if (!isProjectDataRecord(overrides)
                || !['fill', 'stroke', 'text'].every(key => typeof overrides[key] === 'boolean'))
                errors.push(path + '.paintOverrides must contain boolean fill, stroke and text flags.');
        };
        if (typeof diagram.canvas?.backgroundOverride !== 'boolean')
            errors.push(owner + '.diagram.canvas.backgroundOverride must be boolean.');
        if (typeof diagram.connectionDefaults?.lineOverride !== 'boolean')
            errors.push(owner + '.diagram.connectionDefaults.lineOverride must be boolean.');
        for (const [key, appearance] of Object.entries(diagram.cardAppearanceDefaults || {}))
            validateOverrides(owner + '.diagram.cardAppearanceDefaults.' + key, appearance?.paintOverrides);
        if (Array.isArray(diagram.nodes))
            for (const [index, node] of diagram.nodes.entries())
                validateOverrides(owner + '.diagram.nodes[' + index + '].appearance', node?.appearance?.paintOverrides);
    }
    else
        errors.push(owner + '.diagram.themeProvenanceVersion is unsupported.');
    function validateCardPresentation(path, settings)
    {
        if (!isProjectDataRecord(settings)) return;
        for (const key of GENEO_PERSON_CARD_FORMAT_KEYS)
            if (settings[key] != null && !geneoPersonCardSettingValueIsValid(key, settings[key]))
                errors.push(path + '.' + key + ' has an unsupported value.');
        if (Object.hasOwn(settings, 'fields'))
        {
            const keys = Object.keys(geneoDefaultPersonCardSettings().fields);
            if (!isProjectDataRecord(settings.fields))
                errors.push(path + '.fields must be a record.');
            else
            {
                rejectUnknownFields(path + '.fields', settings.fields, keys);
                for (const key of keys)
                    if (Object.hasOwn(settings.fields, key) && typeof settings.fields[key] !== 'boolean')
                        errors.push(path + '.fields.' + key + ' must be boolean.');
            }
        }
    }
    const cardDefaults = diagram.personCardDefaults;
    validateCardPresentation(owner + '.diagram.personCardDefaults', cardDefaults);
    if (!isProjectDataRecord(cardDefaults) || !GENEO_PERSON_CARD_STYLES.includes(cardDefaults.style))
        errors.push(owner + '.diagram.personCardDefaults requires a supported card style.');
    for (const style of GENEO_PERSON_CARD_STYLES)
    {
        const settings = cardDefaults?.styleSettings?.[style];
        validateCardPresentation(owner + '.diagram.personCardDefaults.styleSettings.' + style, settings);
        if (!isProjectDataRecord(settings) || !GENEO_PERSON_CARD_PHOTO_SIZES.includes(settings.photoSize)
            || !Object.keys(GENEO_PERSON_CARD_FONT_RANGES).every(key => geneoValidPersonCardFontSize(key, settings[key])))
            errors.push(owner + '.diagram.personCardDefaults.styleSettings.' + style + ' has invalid font or photo sizes.');
    }
    for (const gender of ['neutral', 'male', 'female', 'unknown'])
    {
        const appearance = diagram.cardAppearanceDefaults?.[gender];
        const path = owner + '.diagram.cardAppearanceDefaults.' + gender;
        for (const field of ['fill', 'stroke', 'text'])
            if (!appearance || !Object.hasOwn(appearance, field))
                errors.push(path + '.' + field + ' is required.');
    }
    const connectionDefaults = diagram.connectionDefaults;
    if (!Number.isInteger(connectionDefaults?.width) || connectionDefaults.width < GENEO_STROKE_WIDTH_MIN
        || connectionDefaults.width > GENEO_STROKE_WIDTH_MAX
        || !GENEO_CONNECTION_PATTERNS.includes(connectionDefaults.pattern)
        || !GENEO_CONNECTION_ARROWS.includes(connectionDefaults.arrows)
        || !Number.isInteger(connectionDefaults.cornerRadius) || connectionDefaults.cornerRadius < 0 || connectionDefaults.cornerRadius > 32
        || typeof connectionDefaults.showRelationshipDates !== 'boolean')
        errors.push(owner + '.diagram.connectionDefaults requires valid width, pattern, arrows, radius and date visibility.');
    const local = new Map();
    for (const key of ['assets', 'people', 'families', 'nodes', 'connections'])
    {
        if (!Array.isArray(diagram?.[key]))
        {
            errors.push(owner + '.diagram.' + key + ' must be an array.');
            continue;
        }
        const records = new Map();
        for (const [rowIndex, item] of diagram[key].entries())
        {
            if (!isProjectDataRecord(item) || typeof item.id !== 'string' || !item.id.trim() || records.has(item.id))
                errors.push(owner + '.diagram.' + key + '[' + rowIndex + '] requires a record with a unique nonempty ID.');
            else records.set(item.id, item);
        }
        local.set(key, records);
    }
    if (local.size !== 5) return;
    function check(record, field, target, id)
    {
        if (id == null || id === '') return;
        const path = owner + '/' + record.id + '.' + field;
        if (typeof id !== 'string' || !id.trim()) errors.push(path + ' must be a nonempty ID when set.');
        else if (!target?.has(id)) errors.push(path + ' references missing ID ' + id);
    }
    for (const asset of local.get('assets').values())
    {
        const path = owner + '.diagram.assets/' + asset.id;
        rejectUnknownFields(path, asset, ['id', 'kind', 'filename', 'displayName', 'src', 'mimeType',
            'width', 'height', 'sizeBytes', 'createdAt', 'updatedAt']);
        if (asset.kind !== 'photo') errors.push(path + '.kind must be photo.');
        if (!PHOTO_UPLOAD_ALLOWED_TYPES.includes(asset.mimeType))
            errors.push(path + '.mimeType must be a supported image type.');
        if (typeof asset.filename !== 'string' || !asset.filename.trim())
            errors.push(path + '.filename must be nonempty text.');
        if (typeof asset.displayName !== 'string')
            errors.push(path + '.displayName must be text.');
        if (Object.hasOwn(asset, 'src') && typeof asset.src !== 'string')
            errors.push(path + '.src must be text when set.');
        for (const field of ['width', 'height', 'sizeBytes'])
            if (!Number.isInteger(asset[field]) || asset[field] < 0)
                errors.push(path + '.' + field + ' must be a nonnegative integer.');
        for (const field of ['createdAt', 'updatedAt'])
            if (typeof asset[field] !== 'string' || !Number.isFinite(Date.parse(asset[field])))
                errors.push(path + '.' + field + ' must be a valid timestamp.');
    }
    for (const person of local.get('people').values())
    {
        const personPath = owner + '/' + person.id;
        rejectUnknownFields(personPath, person, ['id', 'treePersonId', 'syncState', 'names', 'gender',
            'livingStatus', 'birth', 'death', 'photoId', 'photoAssetId', 'photoCrop', 'photoRegion', 'displayName']);
        if (!['local', 'linked', 'modified'].includes(person.syncState))
            errors.push(personPath + '.syncState must be local, linked or modified.');
        const names = person.names;
        if (!isProjectDataRecord(names) || typeof names.first !== 'string' || typeof names.last !== 'string'
            || Object.hasOwn(person, 'displayName'))
            errors.push(personPath + ' requires recorded name parts and cannot contain displayName.');
        if (isProjectDataRecord(names))
        {
            const fields = ['first', 'middle', 'last', 'maiden'];
            rejectUnknownFields(personPath + '.names', names, fields);
            for (const field of fields)
                if (Object.hasOwn(names, field) && (typeof names[field] !== 'string' || names[field].length > 1024))
                    errors.push(personPath + '.names.' + field + ' must be text of at most 1024 characters.');
        }
        validateProjectPersonIdentity(person, personPath, errors);
        check(person, 'treePersonId', indexes.get('people'), person.treePersonId);
        check(person, 'photoId', indexes.get('media'), person.photoId);
        check(person, 'photoAssetId', local.get('assets'), person.photoAssetId);
        validateProjectPhotoCrop(person.photoCrop, personPath + '.photoCrop', errors);
        if (person.photoRegion != null && !isProjectImageRegion(person.photoRegion))
            errors.push(personPath + '.photoRegion must be within the photo.');
        for (const field of ['birth', 'death'])
        {
            const vital = person[field];
            validateDate(personPath + '.' + field, vital);
        }
    }
    for (const family of local.get('families').values())
    {
        if (!Array.isArray(family.partnerIds) || !Array.isArray(family.children))
        {
            errors.push(owner + '/' + family.id + ' requires partnerIds and children arrays.');
            continue;
        }
        const familyPath = owner + '/' + family.id;
        rejectUnknownFields(familyPath, family, ['id', 'partnerIds', 'children', 'relationshipType',
            'relationshipStatus', 'events', 'marriageType']);
        if (!ADD_PERSON_RELATIONSHIP_TYPES.includes(family.relationshipType)
            && !['Single parent', 'Sibling relationship'].includes(family.relationshipType))
            errors.push(familyPath + '.relationshipType is unsupported.');
        if (!['active', 'ended', 'separated', 'divorced', 'annulled', 'unknown'].includes(family.relationshipStatus))
            errors.push(familyPath + '.relationshipStatus is unsupported.');
        if (Object.hasOwn(family, 'marriageType'))
            errors.push(familyPath + ' contains retired field marriageType.');
        validateProjectFamilyEventRoles(family.events, familyPath + '.events', errors);
        if (!Array.isArray(family.events))
            errors.push(familyPath + '.events must be an array.');
        else
        {
            const ids = new Set();
            for (const [index, event] of family.events.entries())
            {
                const path = familyPath + '.events[' + index + ']';
                if (!isProjectDataRecord(event) || typeof event.id !== 'string' || !event.id.trim() || ids.has(event.id))
                {
                    errors.push(path + ' requires a unique nonempty event ID.');
                    continue;
                }
                ids.add(event.id);
                if (typeof event.gedcomTag !== 'string' || !event.gedcomTag.trim() || Object.hasOwn(event, 'tag'))
                    errors.push(path + ' requires a canonical gedcomTag.');
                rejectUnknownFields(path, event, ['id', 'gedcomTag', 'tag', 'eventType', 'typeLabel',
                    'date', 'placeId', 'placeText', 'address', 'confidence', 'relationshipManagedRole']);
                for (const field of ['eventType', 'typeLabel', 'placeText', 'address', 'confidence'])
                    if (event[field] != null && typeof event[field] !== 'string')
                        errors.push(path + '.' + field + ' must be text or null.');
                validateDate(path + '.date', event.date);
                if (event.placeId != null && event.placeId !== '')
                {
                    if (typeof event.placeId !== 'string' || !event.placeId.trim())
                        errors.push(path + '.placeId must be a nonempty ID when set.');
                    else if (!indexes.get('places').has(event.placeId))
                        errors.push(path + '.placeId references missing Place ' + event.placeId);
                }
            }
        }
        if (family.partnerIds.length > 2 || new Set(family.partnerIds).size !== family.partnerIds.length
            || family.partnerIds.some(id => typeof id !== 'string' || !id.trim()))
            errors.push(familyPath + '.partnerIds must contain at most two distinct person IDs.');
        for (const id of family.partnerIds) check(family, 'partnerIds', local.get('people'), id);
        const children = new Set();
        const validTypes = ['unknown', ...PARENT_CHILD_RELATIONSHIP_TYPES.map(type => type.toLowerCase())];
        for (const [index, child] of family.children.entries())
        {
            const childPath = familyPath + '.children[' + index + ']';
            if (!isProjectDataRecord(child) || typeof child.personId !== 'string' || !child.personId.trim())
                errors.push(childPath + '.personId requires a nonempty ID.');
            else
            {
                rejectUnknownFields(childPath, child, ['personId', 'parentageType', 'parentChildTypes']);
                check(family, 'children[' + index + '].personId', local.get('people'), child.personId);
                if (!validTypes.includes(child.parentageType))
                    errors.push(childPath + '.parentageType must be a supported type.');
                if (children.has(child.personId) || family.partnerIds.includes(child.personId))
                    errors.push(familyPath + ' has a duplicate child or self-parent membership: ' + child.personId);
                children.add(child.personId);
                if (Object.hasOwn(child, 'parentChildTypes'))
                {
                    const types = child.parentChildTypes;
                    if (!isProjectDataRecord(types)
                        || Object.entries(types).some(([parentId, type]) =>
                            !family.partnerIds.includes(parentId) || !validTypes.includes(type)))
                        errors.push(childPath + '.parentChildTypes must map member parent IDs to supported types.');
                }
            }
        }
    }
    const cyclePerson = projectParentCycle(local.get('people'), local.get('families').values(),
        family => Array.isArray(family.partnerIds) ? family.partnerIds : [],
        family => Array.isArray(family.children) ? family.children.map(child => child?.personId) : []);
    if (cyclePerson) errors.push(owner + ' has a parent cycle involving ' + cyclePerson + '.');
    function rejectFlatPaint(path, appearance, fields)
    {
        if (!isProjectDataRecord(appearance)) return;
        for (const field of fields)
            if (Object.hasOwn(appearance, field))
                errors.push(path + ' contains retired paint field ' + field + '.');
    }
    const appearanceFields = ['backgroundColor', 'strokeColor', 'textColor', 'strokeType'];
    for (const [key, appearance] of Object.entries(diagram.cardAppearanceDefaults || {}))
    {
        const path = owner + '.diagram.cardAppearanceDefaults.' + key;
        rejectFlatPaint(path, appearance, appearanceFields);
        validateAppearancePaints(path, appearance);
    }
    rejectFlatPaint(owner + '.diagram.connectionDefaults', diagram.connectionDefaults, ['color']);
    const inWorld = coordinate => Number.isFinite(coordinate) && Math.abs(coordinate) <= GENEO_WORLD_LIMIT;
    const nodeFields = new Map([
        ['person', ['personId', 'personCard']],
        ['image', ['imageRef', 'imageCrop', 'photoId', 'title']],
        ['sticky', ['text', 'textFormat', 'textDelta']],
        ['text', ['text', 'textFormat', 'textDelta']],
        ['panel', ['title', 'description']],
        ['shape', ['shapeKind']],
        ['place', ['placeRef', 'placeSizeMode', 'placeId', 'placeName']],
        ['drawing', ['points']]
    ]);
    for (const node of local.get('nodes').values())
    {
        const nodePath = owner + '/' + node.id;
        rejectUnknownFields(nodePath, node, ['id', 'type', 'name', 'x', 'y', 'width', 'height',
            'parentPanelId', 'order', 'visible', 'locked', 'appearance', 'chartCardLayoutVersion',
            'portraitCardLayoutVersion', ...(nodeFields.get(node.type) || [])]);
        for (const field of node.type === 'panel' ? ['title', 'description'] : ['text'])
            if (Object.hasOwn(node, field) && typeof node[field] !== 'string')
                errors.push(nodePath + '.' + field + ' must be text when set.');
        if (Object.hasOwn(node, 'name') && (typeof node.name !== 'string' || node.name.length > 80))
            errors.push(nodePath + '.name must be text of at most 80 characters.');
        for (const field of ['visible', 'locked'])
            if (Object.hasOwn(node, field) && typeof node[field] !== 'boolean')
                errors.push(nodePath + '.' + field + ' must be boolean when set.');
        if (Object.hasOwn(node, 'order') && !Number.isFinite(node.order))
            errors.push(nodePath + '.order must be numeric when set.');
        if (node.type === 'shape' && node.shapeKind !== 'rounded-rectangle'
            && !GENEO_SHAPE_KINDS.some(shape => shape.id === node.shapeKind))
            errors.push(nodePath + '.shapeKind must be a supported shape.');
        rejectFlatPaint(owner + '/' + node.id + '.appearance', node.appearance, appearanceFields);
        validateAppearancePaints(owner + '/' + node.id + '.appearance', node.appearance);
        if (Object.hasOwn(node, 'textFormat') || Object.hasOwn(node, 'textDelta'))
            validateProjectRichText(node.textDelta, node.textFormat, owner + '/' + node.id + '.textDelta', errors);
        if (node.type === 'shape' && node.shapeKind === 'rounded-rectangle')
            errors.push(owner + '/' + node.id + ' contains retired rounded-rectangle shape kind.');
        for (const field of ['chartCardLayoutVersion', 'portraitCardLayoutVersion'])
            if (Object.hasOwn(node, field))
                errors.push(owner + '/' + node.id + ' contains retired layout field ' + field + '.');
        if (!GENEO_NODE_TYPES.has(node.type) || !['x', 'y', 'width', 'height'].every(key => Number.isFinite(node[key]))
            || Math.abs(node.x) > GENEO_WORLD_LIMIT || Math.abs(node.y) > GENEO_WORLD_LIMIT
            || node.width <= 0 || node.height <= 0 || node.width > 10000 || node.height > 10000)
            errors.push(owner + '/' + node.id + ' has an unsupported type or invalid geometry.');
        if (node.type === 'drawing' && (!Array.isArray(node.points) || node.points.length < 2
            || node.points.some(point => !isProjectDataRecord(point) || !['x', 'y'].every(key => Number.isFinite(point[key]) && point[key] >= 0 && point[key] <= 1))))
            errors.push(owner + '/' + node.id + ' has invalid drawing points.');
        if (node.type === 'person' && Object.hasOwn(node, 'personCard'))
        {
            const card = node.personCard;
            const cardPath = nodePath + '.personCard';
            if (!isProjectDataRecord(card) || typeof card.custom !== 'boolean'
                || !['auto', 'manual'].includes(card.heightMode) || !isProjectDataRecord(card.styleSettings))
                errors.push(cardPath + ' requires valid customization, height mode, and style settings.');
            else
            {
                validateCardPresentation(cardPath, card);
                const fonts = Object.keys(GENEO_PERSON_CARD_FONT_RANGES);
                rejectUnknownFields(cardPath + '.styleSettings', card.styleSettings, GENEO_PERSON_CARD_STYLES);
                for (const [style, settings] of Object.entries(card.styleSettings))
                {
                    const settingsPath = cardPath + '.styleSettings.' + style;
                    if (!isProjectDataRecord(settings))
                    {
                        errors.push(settingsPath + ' must be a record.');
                        continue;
                    }
                    validateCardPresentation(settingsPath, settings);
                    for (const key of fonts)
                        if (settings[key] != null && !geneoValidPersonCardFontSize(key, settings[key]))
                            errors.push(settingsPath + '.' + key + ' has an invalid font size.');
                    if (settings.photoSize != null && !GENEO_PERSON_CARD_PHOTO_SIZES.includes(settings.photoSize))
                        errors.push(settingsPath + '.photoSize is unsupported.');
                }
            }
        }
        if (node.type === 'person' && !node.personId) errors.push(owner + '/' + node.id + ' requires a person ID.');
        check(node, 'personId', local.get('people'), node.personId);
        check(node, 'parentPanelId', local.get('nodes'), node.parentPanelId);
        if (node.type === 'image')
            for (const field of ['photoId', 'title'])
                if (Object.hasOwn(node, field))
                    errors.push(owner + '/' + node.id + ' contains retired image field ' + field + '.');
        if (node.type === 'image' && (!isProjectDataRecord(node.imageRef) || !['board', 'project'].includes(node.imageRef.scope)
            || typeof node.imageRef.id !== 'string' || !node.imageRef.id.trim()))
            errors.push(owner + '/' + node.id + '.imageRef requires a project photo or board asset ID.');
        if (node.type === 'place')
            for (const field of ['placeId', 'placeName'])
                if (Object.hasOwn(node, field)) errors.push(owner + '/' + node.id + ' contains retired place field ' + field);
        if (node.type === 'place' && (!isProjectDataRecord(node.placeRef) || !(node.placeRef.scope === 'board'
            ? typeof node.placeRef.name === 'string' && node.placeRef.name.trim()
            : node.placeRef?.scope === 'project' && typeof node.placeRef.id === 'string' && node.placeRef.id.trim()
                && typeof node.placeRef.fallbackName === 'string')))
            errors.push(owner + '/' + node.id + '.placeRef requires a local name or project place ID.');
        if (node.type === 'image' && isProjectDataRecord(node.imageRef))
            rejectUnknownFields(nodePath + '.imageRef', node.imageRef, ['scope', 'id']);
        if (node.type === 'place' && isProjectDataRecord(node.placeRef))
            rejectUnknownFields(nodePath + '.placeRef', node.placeRef,
                node.placeRef.scope === 'board' ? ['scope', 'name'] : ['scope', 'id', 'fallbackName']);
        if (node.type === 'place' && !['auto', 'manual'].includes(node.placeSizeMode))
            errors.push(nodePath + '.placeSizeMode must be auto or manual.');
        if (node.type === 'image' && node.imageCrop != null)
        {
            const crop = node.imageCrop;
            if (!isProjectDataRecord(crop) || !['zoom', 'x', 'y'].every(field => Number.isFinite(crop[field]))
                || crop.zoom < 1 || crop.zoom > 4 || Math.abs(crop.x) > 1 || Math.abs(crop.y) > 1)
                errors.push(nodePath + '.imageCrop must contain a valid zoom and offsets.');
            else rejectUnknownFields(nodePath + '.imageCrop', crop, ['zoom', 'x', 'y']);
        }
        if (node.imageRef?.scope === 'board') check(node, 'imageRef', local.get('assets'), node.imageRef.id);
        if (node.imageRef?.scope === 'project') check(node, 'imageRef', indexes.get('media'), node.imageRef.id);
        if (node.placeRef?.scope === 'project') check(node, 'placeRef', indexes.get('places'), node.placeRef.id);
    }
    const nodes = local.get('nodes');
    const checkedPanels = new Set();
    for (const node of nodes.values())
    {
        let parent = node;
        const chain = new Set();
        while (parent?.parentPanelId && !checkedPanels.has(parent.id))
        {
            if (chain.has(parent.id))
            {
                errors.push(owner + ' has a panel nesting cycle at ' + parent.id);
                break;
            }
            chain.add(parent.id);
            parent = nodes.get(parent.parentPanelId);
            if (parent && parent.type !== 'panel')
            {
                errors.push(owner + ' has a non-panel container ' + parent.id);
                break;
            }
        }
        for (const id of chain) checkedPanels.add(id);
    }
    for (const connection of local.get('connections').values())
    {
        const path = owner + '/' + connection.id;
        rejectUnknownFields(path, connection, ['id', 'kind', 'familyId', 'source', 'target', 'style', 'route', 'showRelationshipDates', 'visible', 'name']);
        if (!['visual', 'family-partner', 'family-child'].includes(connection.kind))
            errors.push(path + '.kind must be a supported connection kind.');
        if (Object.hasOwn(connection, 'showRelationshipDates') && typeof connection.showRelationshipDates !== 'boolean')
            errors.push(path + '.showRelationshipDates must be boolean when set.');
        if (Object.hasOwn(connection, 'visible') && typeof connection.visible !== 'boolean')
            errors.push(path + '.visible must be boolean when set.');
        if (Object.hasOwn(connection, 'name') && typeof connection.name !== 'string')
            errors.push(path + '.name must be text when set.');
        const style = connection.style;
        if (!isProjectDataRecord(style))
            errors.push(path + '.style must be a record.');
        else
        {
            rejectFlatPaint(path + '.style', style, ['color']);
            rejectUnknownFields(path + '.style', style, ['line', 'width', 'pattern', 'arrows', 'cornerRadius', 'color']);
            if (Object.hasOwn(style, 'line')) validatePaint(path + '.style.line', style.line);
            if (Object.hasOwn(style, 'width') && (!Number.isInteger(style.width)
                || style.width < GENEO_STROKE_WIDTH_MIN || style.width > GENEO_STROKE_WIDTH_MAX))
                errors.push(path + '.style.width must be a supported stroke width.');
            if (Object.hasOwn(style, 'pattern') && !GENEO_CONNECTION_PATTERNS.includes(style.pattern))
                errors.push(path + '.style.pattern must be a supported connection pattern.');
            if (Object.hasOwn(style, 'arrows') && (connection.kind !== 'visual' || !GENEO_CONNECTION_ARROWS.includes(style.arrows)))
                errors.push(path + '.style.arrows must be a supported arrow style on a visual connection.');
            if (Object.hasOwn(style, 'cornerRadius') && (!Number.isInteger(style.cornerRadius) || style.cornerRadius < 0 || style.cornerRadius > 32))
                errors.push(path + '.style.cornerRadius must be an integer from 0 to 32.');
        }
        const route = connection.route;
        if (!['auto', 'manual'].includes(route?.mode) || !Array.isArray(route.waypoints)
            || route.waypoints.some(point => !inWorld(point?.x) || !inWorld(point?.y))
            || (Object.hasOwn(route, 'railY') && !inWorld(route.railY)))
            errors.push(owner + '/' + connection.id + ' has an invalid connection route.');
        check(connection, 'familyId', local.get('families'), connection.familyId);
        for (const field of ['source', 'target'])
        {
            const endpoint = connection[field];
            const endpointPath = path + '.' + field;
            if (!isProjectDataRecord(endpoint))
            {
                errors.push(endpointPath + ' must be a record.');
                continue;
            }
            rejectUnknownFields(endpointPath, endpoint, ['nodeId', 'familyId', 'port']);
            const hasNode = Object.hasOwn(endpoint, 'nodeId');
            const hasFamily = Object.hasOwn(endpoint, 'familyId');
            if (hasNode === hasFamily)
                errors.push(endpointPath + ' requires one node or family ID.');
            if (!['top', 'right', 'bottom', 'left'].includes(endpoint.port))
                errors.push(endpointPath + '.port must be a supported socket.');
            for (const [key, collection] of [['nodeId', 'nodes'], ['familyId', 'families']])
            {
                if (!Object.hasOwn(endpoint, key)) continue;
                if (endpoint[key] == null || endpoint[key] === '')
                    errors.push(endpointPath + '.' + key + ' must be a nonempty ID.');
                else check(connection, field + '.' + key, local.get(collection), endpoint[key]);
            }
        }
        if (!['family-partner', 'family-child'].includes(connection.kind)) continue;
        const family = local.get('families').get(connection.familyId);
        if (!family)
        {
            errors.push(path + ' requires a local family ID.');
            continue;
        }
        if (!Array.isArray(family.partnerIds) || !Array.isArray(family.children)) continue;
        const personAt = endpoint => nodes.get(endpoint?.nodeId)?.personId;
        const sourcePerson = personAt(connection.source);
        const targetPerson = personAt(connection.target);
        const parentAt = (endpoint, personId) => endpoint?.familyId === family.id
            || family.partnerIds.includes(personId);
        const childAt = personId => personId && family.children.some(child => child?.personId === personId);
        const matches = connection.kind === 'family-partner'
            ? sourcePerson !== targetPerson && family.partnerIds.includes(sourcePerson) && family.partnerIds.includes(targetPerson)
            : (parentAt(connection.source, sourcePerson) && childAt(targetPerson))
                || (parentAt(connection.target, targetPerson) && childAt(sourcePerson));
        if (!matches) errors.push(path + ' endpoints must match the recorded family members.');
    }
}

function validateSampleData()
{
    const warn = message => console.warn('[sampleData]', message);
    const personIds = new Set(sampleData.people.map(person => person.id));
    const projectIds = new Set(sampleData.projects.map(project => project.id));
    if (projectIds.size !== sampleData.projects.length)
    {
        warn('Projects contain duplicate IDs');
    }

    PROJECT_OWNED_COLLECTIONS.forEach(collectionName =>
    {
        const records = Array.isArray(sampleData[collectionName])
            ? sampleData[collectionName]
            : [];
        const ids = records.map(record => record?.id).filter(Boolean);
        if (new Set(ids).size !== ids.length)
        {
            warn(`${collectionName} contains duplicate IDs`);
        }
        records.forEach(record =>
        {
            if (!record?.projectId || !projectIds.has(record.projectId))
            {
                warn(`${collectionName} record ${record?.id || '(missing ID)'} points to missing project ${record?.projectId || '(none)'}`);
            }
        });
    });

    const archiveFolderMap = new Map(
        (sampleData.archiveFolders || []).map(folder => [folder.id, folder])
    );
    (sampleData.archiveFolders || []).forEach(folder =>
    {
        const parentId = folder.parentId;
        if (!parentId) return;
        const parent = archiveFolderMap.get(parentId);
        if (!parent)
        {
            warn(`Archive folder ${folder.id} points to missing parent ${parentId}`);
        }
        else if (parent.projectId !== folder.projectId)
        {
            warn(`Archive folder ${folder.id} has a cross-project parent ${parentId}`);
        }
    });
    const placeIds = new Set(sampleData.places.map(place => place.id));
    const familyIds = new Set(centralFamilyRecords().map(family => family.id));
    const mediaIds = new Set((sampleData.media || []).map(media => media.id));
    const albumIds = new Set((sampleData.albums || []).map(album => album.id));
    const archiveFileIds =
        new Set(
            (
                sampleData.archiveFiles || []
            ).map(file =>
                file.id
            )
        );
    const mediaById =
        new Map(
            (
                sampleData.media || []
            ).map(photo => [
                photo.id,
                photo
            ])
        );

    const eventIds =
        new Set(
            (
                sampleData.events || []
            ).map(event =>
                event.id
            )
        );

    const noteCollectionIds =
        new Set(
            (
                sampleData.noteCollections || []
            ).map(collection =>
                collection.id
            )
        );

    const noteIds =
        new Set(
            (
                sampleData.notes || []
            ).map(note =>
                note.id
            )
        );

    const noteCollectionById =
        new Map(
            (
                sampleData.noteCollections || []
            ).map(collection => [
                collection.id,
                collection
            ])
        );

    const personById =
        new Map(
            (
                sampleData.people || []
            ).map(person => [
                person.id,
                person
            ])
        );

    const placeById =
        new Map(
            (
                sampleData.places || []
            ).map(place => [
                place.id,
                place
            ])
        );

    const eventById =
        new Map(
            (
                sampleData.events || []
            ).map(event => [
                event.id,
                event
            ])
        );

    const sourceById =
        new Map(
            (
                sampleData.sources || []
            ).map(source => [
                source.id,
                source
            ])
        );

    const archiveFileById =
        new Map(
            (
                sampleData.archiveFiles || []
            ).map(file => [
                file.id,
                file
            ])
        );

    const noteById =
        new Map(
            (
                sampleData.notes || []
            ).map(note => [
                note.id,
                note
            ])
        );
    const seen = collectionName =>
    {
        const ids = new Set();
        (sampleData[collectionName] || []).forEach(item =>
        {
            if (!item?.id) warn(`${collectionName} item is missing an ID`);
            if (item?.id && ids.has(item.id)) warn(`Duplicate ${collectionName} ID: ${item.id}`);
            if (item?.id) ids.add(item.id);
        });
    };

    validateSampleNotesFixture(warn);

    validateSampleGeneographCollections(
        warn,
        projectIds
    );

    sampleData.noteCollections.forEach(
        collection =>
        {
            if (
                !projectIds.has(
                    collection.projectId
                )
            )
            {
                warn(
                    `Note collection ${
                        collection.id
                    } points to missing project ${
                        collection.projectId
                    }`
                );
            }

            if (
                !String(
                    collection.name || ''
                ).trim()
            )
            {
                warn(
                    `Note collection ${
                        collection.id
                    } has no name`
                );
            }

            if (
                typeof collection.description
              !== 'string'
            )
            {
                warn(
                    `Note collection ${
                        collection.id
                    } has an invalid description`
                );
            }
        }
    );

    const canonicalNoteArrayFields = [
        'collectionIds',
        'checklist',
        'linkedPersonIds',
        'linkedPlaceIds',
        'linkedEventIds',
        'linkedPhotoIds',
        'linkedArchiveFileIds',
        'relatedNoteIds'
    ];

    const forbiddenNoteFields = [
        'type',
        'status',
        'collectionId',
        'caseId',
        'confidence',
        'question',
        'conclusion',
        'evidence',
        'tasks',
        'deleted',
        'linkedPeople',
        'linkedPlaces',
        'linkedSources',
        'linkedSourceIds',
        'created',
        'updated',
        'sortRank',
        'excerpt',
        'pinned',
        'personIds',
        'relatedNotes',
        'tags'
    ];

    const validateNoteReferences = (
        note,
        field,
        records,
        label
    ) =>
    {
        (
            note[field] || []
        ).forEach(id =>
        {
            const record =
                records.get(id);

            if (!record)
            {
                warn(
                    `Note ${
                        note.id
                    } ${field} points to missing ${
                        label
                    } ${id}`
                );

                return;
            }

            if (
                record.projectId
            && record.projectId
              !== note.projectId
            )
            {
                warn(
                    `Note ${
                        note.id
                    } and ${
                        label
                    } ${id} are in different projects`
                );
            }
        });
    };

    sampleData.notes.forEach(note =>
    {
        if (
            !projectIds.has(
                note.projectId
            )
        )
        {
            warn(
                `Note ${
                    note.id
                } points to missing project ${
                    note.projectId
                }`
            );
        }

        if (
            !String(
                note.title || ''
            ).trim()
        )
        {
            warn(
                `Note ${
                    note.id
                } has no title`
            );
        }

        if (
            typeof note.body
            !== 'string'
        )
        {
            warn(
                `Note ${
                    note.id
                } has an invalid body`
            );
        }

        const normalizedBodyDelta =
            note.bodyDelta
                ? normalizeRichTextDelta(
                    note.bodyDelta
                )
                : null;

        if (
            note.bodyDelta
          && !normalizedBodyDelta
        )
        {
            warn(
                `Note ${
                    note.id
                } has an invalid bodyDelta`
            );
        }

        if (
            note.bodyFormat
          && note.bodyFormat
            !== 'quill-delta-v1'
        )
        {
            warn(
                `Note ${
                    note.id
                } has an unsupported bodyFormat ${
                    note.bodyFormat
                }`
            );
        }

        if (
            note.bodyFormat
            === 'quill-delta-v1'
          && !normalizedBodyDelta
        )
        {
            warn(
                `Note ${
                    note.id
                } declares Quill content without a valid Delta`
            );
        }

        if (
            normalizedBodyDelta
          && note.bodyFormat
            !== 'quill-delta-v1'
        )
        {
            warn(
                `Note ${
                    note.id
                } has Delta content without the Quill format marker`
            );
        }

        if (
            typeof note.favorite
            !== 'boolean'
        )
        {
            warn(
                `Note ${
                    note.id
                } favorite must be boolean`
            );
        }

        if (
            typeof note.archived
            !== 'boolean'
        )
        {
            warn(
                `Note ${
                    note.id
                } archived must be boolean`
            );
        }

        canonicalNoteArrayFields.forEach(
            field =>
            {
                if (
                    !Array.isArray(
                        note[field]
                    )
                )
                {
                    warn(
                        `Note ${
                            note.id
                        } ${field} must be an array`
                    );

                    return;
                }

                if (
                    field !== 'checklist'
              && new Set(
                  note[field]
              ).size
                !== note[field].length
                )
                {
                    warn(
                        `Note ${
                            note.id
                        } has duplicate values in ${field}`
                    );
                }
            }
        );

        (
            note.collectionIds || []
        ).forEach(collectionId =>
        {
            const collection =
                noteCollectionById.get(
                    collectionId
                );

            if (
                !noteCollectionIds.has(
                    collectionId
                )
            || !collection
            )
            {
                warn(
                    `Note ${
                        note.id
                    } points to missing collection ${
                        collectionId
                    }`
                );

                return;
            }

            if (
                collection.projectId
              !== note.projectId
            )
            {
                warn(
                    `Note ${
                        note.id
                    } and collection ${
                        collectionId
                    } are in different projects`
                );
            }
        });

        const checklistIds =
            new Set();

        (
            note.checklist || []
        ).forEach(item =>
        {
            if (
                !item
            || typeof item
              !== 'object'
            )
            {
                warn(
                    `Note ${
                        note.id
                    } has an invalid checklist item`
                );

                return;
            }

            if (
                !String(
                    item.id || ''
                ).trim()
            )
            {
                warn(
                    `Note ${
                        note.id
                    } has a checklist item without an ID`
                );
            }
            else if (
                checklistIds.has(
                    item.id
                )
            )
            {
                warn(
                    `Note ${
                        note.id
                    } has duplicate checklist ID ${
                        item.id
                    }`
                );
            }
            else
            {
                checklistIds.add(
                    item.id
                );
            }

            if (
                !String(
                    item.text || ''
                ).trim()
            )
            {
                warn(
                    `Note ${
                        note.id
                    } has an empty checklist item`
                );
            }

            if (
                typeof item.done
              !== 'boolean'
            )
            {
                warn(
                    `Note ${
                        note.id
                    } checklist item ${
                        item.id
                    } has invalid done state`
                );
            }
        });

        validateNoteReferences(
            note,
            'linkedPersonIds',
            personById,
            'person'
        );

        validateNoteReferences(
            note,
            'linkedPlaceIds',
            placeById,
            'place'
        );

        validateNoteReferences(
            note,
            'linkedEventIds',
            eventById,
            'event'
        );

        validateNoteReferences(
            note,
            'linkedPhotoIds',
            mediaById,
            'photo'
        );

        validateNoteReferences(
            note,
            'linkedArchiveFileIds',
            archiveFileById,
            'archive file'
        );

        (
            note.linkedPersonIds || []
        ).forEach(personId =>
        {
            if (
                !personIds.has(
                    personId
                )
            )
            {
                warn(
                    `Note ${
                        note.id
                    } points to missing person ${
                        personId
                    }`
                );
            }
        });

        (
            note.linkedPlaceIds || []
        ).forEach(placeId =>
        {
            if (
                !placeIds.has(
                    placeId
                )
            )
            {
                warn(
                    `Note ${
                        note.id
                    } points to missing place ${
                        placeId
                    }`
                );
            }
        });

        (
            note.linkedEventIds || []
        ).forEach(eventId =>
        {
            if (
                !eventIds.has(
                    eventId
                )
            )
            {
                warn(
                    `Note ${
                        note.id
                    } points to missing event ${
                        eventId
                    }`
                );
            }
        });
        (
            note.linkedArchiveFileIds || []
        ).forEach(fileId =>
        {
            if (
                !archiveFileIds.has(
                    fileId
                )
            )
            {
                warn(
                    `Note ${
                        note.id
                    } points to missing archive file ${
                        fileId
                    }`
                );
            }
        });

        (
            note.relatedNoteIds || []
        ).forEach(relatedNoteId =>
        {
            if (
                relatedNoteId
              === note.id
            )
            {
                warn(
                    `Note ${
                        note.id
                    } relates to itself`
                );

                return;
            }

            const relatedNote =
                noteById.get(
                    relatedNoteId
                );

            if (
                !noteIds.has(
                    relatedNoteId
                )
            || !relatedNote
            )
            {
                warn(
                    `Note ${
                        note.id
                    } points to missing related note ${
                        relatedNoteId
                    }`
                );

                return;
            }

            if (
                relatedNote.projectId
              !== note.projectId
            )
            {
                warn(
                    `Note ${
                        note.id
                    } and related note ${
                        relatedNoteId
                    } are in different projects`
                );
            }

            if (
                !(
                    relatedNote.relatedNoteIds
              || []
                ).includes(note.id)
            )
            {
                warn(
                    `Note ${
                        note.id
                    } and related note ${
                        relatedNoteId
                    } are not reciprocal`
                );
            }
        });

        [
            'createdAt',
            'updatedAt'
        ].forEach(field =>
        {
            if (
                !Number.isFinite(
                    Date.parse(
                        note[field] || ''
                    )
                )
            )
            {
                warn(
                    `Note ${
                        note.id
                    } has an invalid ${field} timestamp`
                );
            }
        });

        forbiddenNoteFields.forEach(
            field =>
            {
                if (
                    Object.prototype
                        .hasOwnProperty
                        .call(
                            note,
                            field
                        )
                )
                {
                    warn(
                        `Note ${
                            note.id
                        } still contains legacy field ${field}`
                    );
                }
            }
        );
    });

    [
        'projects',
        'people',
        'families',
        'places',
        'placeSavedFilters',
        'placeIssues',
        'sources',
        'sourceLinks',
        'archiveFiles',
        'media',
        'albums',
        'notes',
        'noteCollections',
        'boards',
        'boardObjects',
        'boardConnectors',
        'publishDrafts',
        'notifications',
        'activity'
    ].forEach(seen);

    const forbiddenSourceFields = [
        'type',
        'repositoryOwner',
        'location',
        'holder',
        'description',
        'updated',
        'linkedPersonIds',
        'linkedEventIds',
        'linkedNoteIds',
        'linkedPlaceIds',
        'placeIds'
    ];

    (
        sampleData.sources || []
    ).forEach(source =>
    {
        if (
            !String(
                source.title || ''
            ).trim()
        )
        {
            warn(
                `Source ${source.id} has no title`
            );
        }

        if (
            source.category
          && !SOURCE_CATEGORY_BY_VALUE.has(
              source.category
          )
        )
        {
            warn(
                `Source ${
                    source.id
                } has invalid category ${
                    source.category
                }`
            );
        }

        if (source.placeId)
        {
            const custodian = placeById.get(source.placeId);
            if (!custodian || custodian.deleted || custodian.projectId !== source.projectId)
            {
                warn(`Source ${source.id} has an invalid custodial Place reference ${source.placeId}`);
            }
        }

        forbiddenSourceFields.forEach(
            field =>
            {
                if (
                    Object.prototype
                        .hasOwnProperty
                        .call(
                            source,
                            field
                        )
                )
                {
                    warn(
                        `Source ${
                            source.id
                        } contains obsolete field ${
                            field
                        }`
                    );
                }
            }
        );
    });

    const sourceLinkKeys =
        new Set();

    (
        sampleData.sourceLinks || []
    ).forEach(link =>
    {
        const source =
            sourceById.get(
                link.sourceId
            );

        const target =
            sourceTargetRecord(
                link.targetType,
                link.targetId,
                link.projectId
            );

        const key =
            [
                link.projectId,
                link.sourceId,
                link.targetType,
                link.targetId
            ].join('|');

        if (!source)
        {
            warn(
                `Source link ${link.id} points to missing source ${link.sourceId}`
            );
        }

        if (
            !SOURCE_LINK_TARGET_TYPES.includes(
                link.targetType
            )
        )
        {
            warn(
                `Source link ${link.id} has invalid target type ${link.targetType}`
            );
        }

        if (!target)
        {
            warn(
                `Source link ${link.id} points to missing ${link.targetType} ${link.targetId}`
            );
        }

        if (
            source
          && source.projectId
            !== link.projectId
        )
        {
            warn(
                `Source link ${link.id} and source ${source.id} are in different projects`
            );
        }

        if (
            target?.projectId
          && target.projectId
            !== link.projectId
        )
        {
            warn(
                `Source link ${link.id} and target ${link.targetId} are in different projects`
            );
        }

        if (
            sourceLinkKeys.has(
                key
            )
        )
        {
            warn(
                `Duplicate Source connection: ${key}`
            );
        }

        sourceLinkKeys.add(
            key
        );
    });

    (
        sampleData.archiveFiles || []
    ).forEach(file =>
    {
        if (
            Object.prototype
                .hasOwnProperty
                .call(
                    file,
                    'linkedSourceIds'
                )
        )
        {
            warn(
                `Archive file ${file.id} still contains legacy field linkedSourceIds`
            );
        }
    });

    const archiveFileLinkDefinitions = [
        {
            field: 'linkedPersonIds',
            label: 'person',
            records: personById
        },
        {
            field: 'linkedEventIds',
            label: 'event',
            records: eventById
        },
        {
            field: 'linkedNoteIds',
            label: 'note',
            records: noteById
        },
        {
            field: 'linkedPlaceIds',
            label: 'place',
            records: placeById
        },
        {
            field: 'placeIds',
            label: 'place',
            records: placeById
        }
    ];

    (sampleData.archiveFiles || []).forEach(file =>
    {
        if (!projectIds.has(file.projectId))
        {
            warn(
                `Archive file ${file.id} points to missing project ${file.projectId}`
            );
        }

        archiveFileLinkDefinitions.forEach(definition =>
        {
            const values =
                Array.isArray(file[definition.field])
                    ? file[definition.field]
                    : [];

            if (
                file[definition.field] != null
            && !Array.isArray(file[definition.field])
            )
            {
                warn(
                    `Archive file ${file.id} ${definition.field} must be an array`
                );
            }

            if (new Set(values).size !== values.length)
            {
                warn(
                    `Archive file ${file.id} has duplicate IDs in ${definition.field}`
                );
            }

            values.forEach(recordId =>
            {
                const record =
                    definition.records.get(recordId);

                if (!record)
                {
                    warn(
                        `Archive file ${file.id} points to missing ${definition.label} ${recordId}`
                    );
                }
                else if (
                    record.projectId
              && file.projectId
              && record.projectId !== file.projectId
                )
                {
                    warn(
                        `Archive file ${file.id} and ${definition.label} ${recordId} are in different projects`
                    );
                }
            });
        });

        if (file.documentPlaceId && placeById.get(file.documentPlaceId)?.projectId !== file.projectId)
            warn('Archive file ' + file.id + ' has an invalid document place ' + file.documentPlaceId);
        if (file.documentPlaceId && file.linkedPlaceIds.includes(file.documentPlaceId))
            warn('Archive file ' + file.id + ' repeats its document place in its linked places.');
    });

    (sampleData.places || []).forEach(place =>
    {
        if (!projectIds.has(place.projectId)) warn(`Place ${place.id} points to missing project ${place.projectId}`);
        if (!String(place.name || '').trim()) warn(`Place ${place.id} has no name`);
        if (!Array.isArray(place.alternativeNames)) warn(`Place ${place.id} alternativeNames must be an array`);
        if (new Set((place.alternativeNames || []).map(name => normalizePlaceLookupText(name))).size !== (place.alternativeNames || []).length) warn(`Place ${place.id} has duplicate alternative names`);
        if (place.coordinates && (!validLatitude(place.coordinates.lat) || !validLongitude(place.coordinates.lng))) warn(`Place ${place.id} has invalid coordinates`);
        if (placeHasInvalidRadius(place)) warn(`Place ${place.id} has invalid approximate radius`);
        if (placeHasRadiusValue(place) && !normalizePlaceCoordinates(place)) warn(`Place ${place.id} has an approximate radius but no valid center`);
        if (!Number.isFinite(Date.parse(place.updatedAt || ''))) warn(`Place ${place.id} has an invalid updatedAt timestamp`);
    });

    (
        sampleData.placeSavedFilters || []
    )
        .forEach(savedFilter =>
        {
            if (
                !projectIds.has(
                    savedFilter.projectId
                )
            )
            {
                warn(
                    `Place saved filter ${savedFilter.id} points to missing project ${savedFilter.projectId}`
                );
            }

            if (
                !String(
                    savedFilter.name || ''
                ).trim()
            )
            {
                warn(
                    `Place saved filter ${savedFilter.id} has no name`
                );
            }

            if (
                !savedFilter.filters
            || typeof savedFilter.filters
              !== 'object'
            )
            {
                warn(
                    `Place saved filter ${savedFilter.id} has invalid filters`
                );
            }
        });

    (sampleData.placeIssues || []).forEach(issue =>
    {
        const place = getPlace(issue.placeId);
        if (!projectIds.has(issue.projectId)) warn(`Place issue ${issue.id} points to missing project ${issue.projectId}`);
        if (!place) warn(`Place issue ${issue.id} points to missing place ${issue.placeId}`);
        else if (place.projectId !== issue.projectId) warn(`Place issue ${issue.id} and place ${issue.placeId} are in different projects`);
        if (issue.status !== 'dismissed') warn(`Place issue ${issue.id} must be a dismissal record`);
        if (!['missing_coordinates', 'invalid_coordinates', 'possible_duplicate', 'unlinked'].includes(issue.type)) warn(`Place issue ${issue.id} has invalid type ${issue.type}`);
        if (!Number.isFinite(Date.parse(issue.dismissedAt || ''))) warn(`Place issue ${issue.id} has an invalid dismissedAt timestamp`);
    });

    if (sampleData.media.length !== 14) warn(`Expected exactly 14 seeded media records; found ${sampleData.media.length}`);

    (sampleData.albums || []).forEach(album =>
    {
        if (!projectIds.has(album.projectId)) warn(`Album ${album.id} points to missing project ${album.projectId}`);
        if (!String(album.name || '').trim()) warn(`Album ${album.id} has no name`);
        if (!Number.isFinite(Date.parse(album.createdAt || ''))) warn(`Album ${album.id} has an invalid createdAt timestamp`);
    });

    (sampleData.media || []).forEach(photo =>
    {
        if (photo.kind !== 'photo') warn(`Media ${photo.id} has unsupported kind ${photo.kind}`);
        if (!projectIds.has(photo.projectId)) warn(`Media ${photo.id} points to missing project ${photo.projectId}`);
        if (!Array.isArray(photo.personIds)) warn(`Media ${photo.id} personIds must be an array`);
        if (!Array.isArray(photo.albumIds)) warn(`Media ${photo.id} albumIds must be an array`);
        if (new Set(photo.personIds || []).size !== (photo.personIds || []).length) warn(`Media ${photo.id} has duplicate person IDs`);
        if (new Set(photo.albumIds || []).size !== (photo.albumIds || []).length) warn(`Media ${photo.id} has duplicate album IDs`);
        (photo.personIds || []).forEach(personId =>
        {
            const person = getPerson(personId);
            if (!person) warn(`Media ${photo.id} points to missing person ${personId}`);
            else if (person.projectId !== photo.projectId) warn(`Media ${photo.id} and person ${personId} are in different projects`);
        });
        if (photo.personRegions != null)
        {
            if (!photo.personRegions || typeof photo.personRegions !== 'object' || Array.isArray(photo.personRegions)) warn(`Media ${photo.id} has invalid face regions`);
            else Object.entries(photo.personRegions).forEach(([personId, region]) =>
            {
                if (!(photo.personIds || []).includes(personId)) warn(`Media ${photo.id} has face area for untagged person ${personId}`);
                if (!region || !['x', 'y', 'width', 'height'].every(key => Number.isFinite(region[key]))
                    || region.x < 0 || region.y < 0 || region.width < FACE_REGION_MIN || region.height < FACE_REGION_MIN
                    || region.x + region.width > 1.000001 || region.y + region.height > 1.000001)
                    warn(`Media ${photo.id} has invalid face area for ${personId}`);
            });
        }
        (photo.albumIds || []).forEach(albumId =>
        {
            const album = sampleData.albums.find(item => item.id === albumId);
            if (!albumIds.has(albumId)) warn(`Media ${photo.id} points to missing album ${albumId}`);
            else if (album.projectId !== photo.projectId) warn(`Media ${photo.id} and album ${albumId} are in different projects`);
        });
        if (!photo.date || typeof photo.date !== 'object' || Array.isArray(photo.date)) warn(`Media ${photo.id} has an invalid structured date`);
        else
        {
            const normalizedType = normalizeGenealogyDateType(photo.date.dateType || 'Exact date');
            if (normalizedType !== photo.date.dateType) warn(`Media ${photo.id} has invalid date type ${photo.date.dateType}`);
            if (normalizedType === 'Between' && (photo.date.first?.year == null || photo.date.second?.year == null)) warn(`Media ${photo.id} has an incomplete Between date`);
        }
        if (photo.placeId && !placeIds.has(photo.placeId)) warn(`Media ${photo.id} points to missing place ${photo.placeId}`);
        if (!Number.isFinite(photo.width) || photo.width <= 0) warn(`Media ${photo.id} has invalid width`);
        if (!Number.isFinite(photo.height) || photo.height <= 0) warn(`Media ${photo.id} has invalid height`);
        if (!Number.isFinite(photo.sizeBytes) || photo.sizeBytes < 0) warn(`Media ${photo.id} has invalid sizeBytes`);
        ['createdAt', 'updatedAt'].forEach(field =>
        {
            if (!Number.isFinite(Date.parse(photo[field] || ''))) warn(`Media ${photo.id} has invalid ${field}`);
        });
    });

    sampleData.people.forEach(person =>
    {
        if (!projectIds.has(person.projectId)) warn(`Person ${person.id} points to missing project ${person.projectId}`);
        [person.birth?.placeId, person.death?.placeId, person.death?.burialPlaceId].filter(Boolean).forEach(placeId =>
        {
            if (!placeIds.has(placeId)) warn(`Missing place ID ${placeId} on person ${person.id}`);
        });
        (person.attributes || []).forEach(attribute =>
        {
            if (attribute.placeId && !placeIds.has(attribute.placeId)) warn(`Attribute ${attribute.id} points to missing place ${attribute.placeId}`);
            (attribute.mediaIds || []).forEach(mediaId =>
            {
                if (!mediaIds.has(mediaId)) warn(`Attribute ${attribute.id} points to missing media ${mediaId}`);
            });
        });
        (person.events || []).forEach(event =>
        {
            if (event.placeId && !placeIds.has(event.placeId)) warn(`Event ${event.id} points to missing place ${event.placeId}`);
            (event.mediaIds || []).forEach(mediaId =>
            {
                if (!mediaIds.has(mediaId)) warn(`Event ${event.id} points to missing media ${mediaId}`);
            });
        });
        if (
            person.primaryPhotoId
        )
        {
            const primaryPhoto =
                getPhoto(
                    person.primaryPhotoId
                );

            if (!primaryPhoto)
            {
                warn(
                    `Person ${
                        person.id
                    } points to missing primary photo ${
                        person.primaryPhotoId
                    }`
                );
            }
            else if (
                primaryPhoto.projectId
              !== person.projectId
            )
            {
                warn(
                    `Person ${
                        person.id
                    } primary photo is in another project`
                );
            }
            else if (
                !(
                    primaryPhoto.personIds || []
                ).includes(
                    person.id
                )
            )
            {
                warn(
                    `Person ${
                        person.id
                    } is not tagged in primary photo ${
                        primaryPhoto.id
                    }`
                );
            }
        }
        if (person.primaryPhotoCrop != null)
        {
            const crop = person.primaryPhotoCrop;
            if (!Number.isFinite(crop.centerX) || crop.centerX < 0 || crop.centerX > 1) warn(`Person ${person.id} has invalid primary photo centerX`);
            if (!Number.isFinite(crop.centerY) || crop.centerY < 0 || crop.centerY > 1) warn(`Person ${person.id} has invalid primary photo centerY`);
            if (!Number.isFinite(crop.zoom) || crop.zoom < PERSON_PHOTO_ZOOM_MIN || crop.zoom > PERSON_PHOTO_ZOOM_MAX) warn(`Person ${person.id} has invalid primary photo zoom`);
            if (!PERSON_PHOTO_ROTATIONS.includes(crop.rotation)) warn(`Person ${person.id} has invalid primary photo rotation`);
        }
    });

    centralFamilyRecords().forEach(family =>
    {
        [familyPartnerAId(family), familyPartnerBId(family)].filter(Boolean).forEach(personId =>
        {
            if (!personIds.has(personId)) warn(`Family ${family.id} points to missing partner ${personId}`);
        });
        (family.childIds || []).forEach(personId =>
        {
            if (!personIds.has(personId)) warn(`Family ${family.id} points to missing child ${personId}`);
        });
        (family.events || []).forEach(event =>
        {
            if (event.placeId && !placeIds.has(event.placeId)) warn(`Family event ${event.id} points to missing place ${event.placeId}`);
        });
    });

    (sampleData.events || []).forEach(event =>
    {
        (event.personIds || []).forEach(personId =>
        {
            if (!personIds.has(personId)) warn(`Derived event ${event.id} points to missing person ${personId}`);
        });
        if (event.placeId && !placeIds.has(event.placeId)) warn(`Derived event ${event.id} points to missing place ${event.placeId}`);
    });

    (sampleData.links || []).forEach(link =>
    {
        if (!link.id) warn('Link is missing an ID');
    });
}

const defaultPlaceFilters = Object.freeze({
    personId: '',
    surname: '',
    yearFrom: '',
    yearTo: '',
    eventType: '',
    country: '',
    mapped: 'all'
});

