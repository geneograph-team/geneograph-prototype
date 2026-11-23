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
        for (const record of rows)
        {
            if (!isProjectDataRecord(record) || typeof record.id !== 'string' || !record.id.trim())
            {
                errors.push(key + ' contains a record without a valid ID.');
                continue;
            }
            if (index.has(record.id)) errors.push('Duplicate ' + key + ' ID: ' + record.id);
            if (record.projectId !== project.id) errors.push(key + '/' + record.id + ' belongs to a different project.');
            index.set(record.id, record);
        }
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
        for (const field of ['partner1Id', 'partner2Id', 'personAId', 'personBId', 'fatherId', 'motherId', 'husbandId', 'wifeId', 'childrenIds', 'nonEvents', 'marriageType', 'partner1RoleHint', 'partner2RoleHint', 'personARoleHint', 'personBRoleHint'])
            if (Object.hasOwn(family, field)) errors.push('Family ' + family.id + ' contains retired field ' + field);
        for (const role of ['start', 'end'])
            for (const suffix of ['Date', 'DateLabel', 'DateType', 'SortDate', 'Calendar', 'OriginalText', 'PlaceId', 'PlaceText', 'Address'])
                if (Object.hasOwn(family, role + suffix))
                    errors.push('Family ' + family.id + ' contains retired field ' + role + suffix);
        for (const field of ['partnerARoleHint', 'partnerBRoleHint'])
            if (Object.hasOwn(family, field) && !['', 'HUSB', 'WIFE'].includes(family[field]))
                errors.push('Family ' + family.id + '.' + field + ' must be HUSB, WIFE, or empty.');
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
        const validPoint = typeof point?.lat === 'number' && typeof point?.lng === 'number'
            && validLatitude(point.lat) && validLongitude(point.lng);
        if (point !== null && !validPoint)
            errors.push(owner + '.coordinates must be null or contain numeric latitude and longitude in range.');
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
        if (typeof id !== 'string' || !indexes.get(target).has(id))
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
    function validateDate(owner, date)
    {
        const validParts = parts => parts && !Array.isArray(parts)
            && [parts.year, parts.month, parts.day].every(value => value === null || Number.isInteger(value))
            && genealogyDateParts(parts.year, parts.month, parts.day, date.calendar);
        if (!date || !GENEALOGY_DATE_TYPES.includes(date.dateType) || !GENEALOGY_CALENDARS.includes(date.calendar)
            || !['empty', 'unknown', 'known', 'unparsed'].includes(date.state)
            || typeof date.originalText !== 'string' || !validParts(date.first)
            || (date.second !== null && !validParts(date.second))
            || (date.state === 'known'
                ? (date.dateType === 'Between') !== (date.second !== null)
                    || normalizeGenealogyDateInput(date).state !== 'known'
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
            if (!isProjectDataRecord(region) || !['x', 'y', 'width', 'height'].every(key => Number.isFinite(region[key]))
                || region.x < 0 || region.y < 0 || region.width <= 0 || region.height <= 0
                || region.x + region.width > 1.000001 || region.y + region.height > 1.000001)
                errors.push(path + '.personRegions.' + personId + ' must be within the ' + surface + '.');
        }
    }
    for (const collection of ['albums', 'archiveFolders', 'noteCollections', 'boardCollections'])
        for (const record of indexes.get(collection).values())
            if (typeof record.name !== 'string' || !record.name.trim())
                errors.push(collection + '/' + record.id + '.name must be nonempty text.');
    for (const photo of indexes.get('media').values())
    {
        const path = 'media/' + photo.id;
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
        if (typeof source.title !== 'string' || !source.title.trim()) errors.push(path + '.title must be nonempty text.');
        if (source.category !== '' && !SOURCE_CATEGORY_BY_VALUE.has(source.category))
            errors.push(path + '.category must be a supported Source category or empty.');
        if (source.accessedDate) validateDate(path + '.accessedDate', source.accessedDate);
        if (source.placeId != null && source.placeId !== '') requireReference(path, 'placeId', 'places', source.placeId);
    }

    function validateFactReferences(owner, fact, isVitalDate = false)
    {
        if (!fact || typeof fact !== 'object' || Array.isArray(fact))
        {
            errors.push(owner + ' must be a record.');
            return;
        }
        if (isVitalDate) validateDate(owner, fact);
        else for (const field of ['date', 'fromDate', 'toDate'])
            if (fact[field] != null) validateDate(owner + '.' + field, fact[field]);
        for (const field of ['placeId', 'burialPlaceId'])
            if (fact[field]) requireReference(owner, field, 'places', fact[field]);
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
                if (!isProjectDataRecord(record.profile))
                    errors.push(owner + '.profile must be a record.');
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
                    for (const field of ['first', 'middle', 'last', 'maiden', 'prefix', 'suffix'])
                    {
                        if (!Object.hasOwn(names, field) && !['first', 'last'].includes(field)) continue;
                        const value = names[field];
                        if (typeof value !== 'string' || value.length > 1024)
                            errors.push(owner + '.names.' + field + ' must be text of at most 1024 characters.');
                    }
                }

                if (record.primaryPhotoId) requireReference(owner, 'primaryPhotoId', 'media', record.primaryPhotoId);
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
    for (const filter of indexes.get('placeSavedFilters').values())
        if (filter.filters?.personId) requireReference('placeSavedFilters/' + filter.id, 'filters.personId', 'people', filter.filters.personId);
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
        for (const field of ['createdAt', 'updatedAt'])
            if (typeof note[field] !== 'string' || !Number.isFinite(Date.parse(note[field])))
                errors.push(path + '.' + field + ' must be a valid timestamp.');
        for (const field of ['created', 'updated', 'modified'])
            if (Object.hasOwn(note, field)) errors.push(path + ' contains retired display date ' + field + '.');
        for (const field of ['title', 'body'])
            if (typeof note[field] !== 'string') errors.push(path + '.' + field + ' must be text.');
        if ((note.bodyFormat !== '' && note.bodyFormat !== 'quill-delta-v1')
            || (note.bodyFormat === '' ? note.bodyDelta !== null : !Array.isArray(note.bodyDelta?.ops)))
            errors.push(path + ' requires a matching note body format and delta.');
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
        if (file.sizeBytes != null && (!Number.isSafeInteger(file.sizeBytes) || file.sizeBytes < 0))
            errors.push(owner + '.sizeBytes must be a nonnegative integer.');
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
        requireReference(owner, 'sourceId', 'sources', link.sourceId);
        const target = citationTargets.get(link.targetType);
        if (target) requireReference(owner, 'targetId', target, link.targetId);
        else errors.push(owner + ' has an invalid target type.');
        const key = JSON.stringify([link.sourceId, link.targetType, link.targetId]);
        if (citationKeys.has(key)) errors.push(owner + ' duplicates an existing source link.');
        citationKeys.add(key);
    }
    for (const board of indexes.get('boards').values()) validateProjectBoard(board, indexes, errors, validateDate);
    return errors;
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

function validateProjectBoard(board, indexes, errors, validateDate)
{
    const owner = 'boards/' + board.id;
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
    function validatePaint(path, paint)
    {
        if (!isProjectDataRecord(paint) || typeof paint.color !== 'string' || !/^#[0-9a-f]{6}$/i.test(paint.color)
            || !Number.isInteger(paint.opacity) || paint.opacity < 0 || paint.opacity > 100
            || typeof paint.enabled !== 'boolean')
            errors.push(path + ' must contain a hex color, integer opacity from 0 to 100, and boolean enabled flag.');
    }
    function validateAppearancePaints(path, appearance)
    {
        for (const field of ['fill', 'stroke', 'text'])
            if (appearance && Object.hasOwn(appearance, field))
                validatePaint(path + '.' + field, appearance[field]);
    }
    validatePaint(owner + '.diagram.canvas.backgroundPaint', diagram?.canvas?.backgroundPaint);
    validatePaint(owner + '.diagram.connectionDefaults.line', diagram?.connectionDefaults?.line);
    if (!isProjectDataRecord(diagram?.canvas) || !['clear', 'dots', 'grid'].includes(diagram.canvas.backgroundPattern)
        || !isProjectDataRecord(diagram.canvas.backgroundPaint))
        errors.push(owner + '.diagram.canvas requires a background pattern and paint.');
    else for (const field of ['gridVisible', 'backgroundColor'])
        if (Object.hasOwn(diagram.canvas, field))
            errors.push(owner + '.diagram.canvas contains retired field ' + field + '.');
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
    const cardDefaults = diagram.personCardDefaults;
    if (!isProjectDataRecord(cardDefaults) || !GENEO_PERSON_CARD_STYLES.includes(cardDefaults.style))
        errors.push(owner + '.diagram.personCardDefaults requires a supported card style.');
    for (const style of GENEO_PERSON_CARD_STYLES)
    {
        const settings = cardDefaults?.styleSettings?.[style];
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
            return;
        }
        const records = new Map();
        for (const item of diagram[key])
        {
            if (!isProjectDataRecord(item) || typeof item.id !== 'string' || !item.id.trim() || records.has(item.id))
                errors.push(owner + '.diagram.' + key + ' contains a missing or duplicate record ID.');
            else records.set(item.id, item);
        }
        local.set(key, records);
    }
    function check(record, field, target, id)
    {
        if (id == null || id === '') return;
        const path = owner + '/' + record.id + '.' + field;
        if (typeof id !== 'string' || !id.trim()) errors.push(path + ' must be a nonempty ID when set.');
        else if (!target?.has(id)) errors.push(path + ' references missing ID ' + id);
    }
    for (const person of local.get('people').values())
    {
        const personPath = owner + '/' + person.id;
        const names = person.names;
        if (!names || typeof names !== 'object' || Array.isArray(names)
            || typeof names.first !== 'string' || typeof names.last !== 'string'
            || Object.hasOwn(person, 'displayName'))
            errors.push(personPath + ' requires recorded name parts and cannot contain displayName.');
        validateProjectPersonIdentity(person, personPath, errors);
        check(person, 'treePersonId', indexes.get('people'), person.treePersonId);
        check(person, 'photoId', indexes.get('media'), person.photoId);
        check(person, 'photoAssetId', local.get('assets'), person.photoAssetId);
        for (const field of ['birth', 'death'])
        {
            const vital = person[field];
            validateDate(personPath + '.' + field, vital);
            for (const placeField of ['placeId', 'burialPlaceId'])
                check(person, field + '.' + placeField, indexes.get('places'), vital?.[placeField]);
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
                validateDate(path + '.date', event.date);
                if (event.placeId && !indexes.get('places').has(event.placeId))
                    errors.push(path + '.placeId references missing Place ' + event.placeId);
            }
        }
        if (family.partnerIds.length > 2 || new Set(family.partnerIds).size !== family.partnerIds.length
            || family.partnerIds.some(id => typeof id !== 'string' || !id.trim()))
            errors.push(familyPath + '.partnerIds must contain at most two distinct person IDs.');
        for (const id of family.partnerIds) check(family, 'partnerIds', local.get('people'), id);
        const children = new Set();
        for (const child of family.children)
        {
            if (!child?.personId) errors.push(owner + '/' + family.id + ' contains a child without a person ID.');
            else
            {
                check(family, 'children', local.get('people'), child.personId);
                if (children.has(child.personId) || family.partnerIds.includes(child.personId))
                    errors.push(familyPath + ' has a duplicate child or self-parent membership: ' + child.personId);
                children.add(child.personId);
                if (Object.hasOwn(child, 'parentChildTypes'))
                {
                    const types = child.parentChildTypes;
                    const validTypes = ['unknown', ...PARENT_CHILD_RELATIONSHIP_TYPES.map(type => type.toLowerCase())];
                    if (!types || typeof types !== 'object' || Array.isArray(types)
                        || Object.entries(types).some(([parentId, type]) =>
                            !family.partnerIds.includes(parentId) || !validTypes.includes(type)))
                        errors.push(familyPath + '.children parentChildTypes must map member parent IDs to supported types.');
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
    for (const node of local.get('nodes').values())
    {
        rejectFlatPaint(owner + '/' + node.id + '.appearance', node.appearance, appearanceFields);
        validateAppearancePaints(owner + '/' + node.id + '.appearance', node.appearance);
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
            || node.points.some(point => !inWorld(point?.x) || !inWorld(point?.y))))
            errors.push(owner + '/' + node.id + ' has invalid drawing points.');
        if (node.type === 'person' && !node.personId) errors.push(owner + '/' + node.id + ' requires a person ID.');
        check(node, 'personId', local.get('people'), node.personId);
        check(node, 'parentPanelId', local.get('nodes'), node.parentPanelId);
        if (node.type === 'image')
            for (const field of ['photoId', 'title'])
                if (Object.hasOwn(node, field)) errors.push(owner + '/' + node.id + ' contains retired image field ' + field);
        if (node.type === 'image')
            for (const field of ['photoId', 'title'])
                if (Object.hasOwn(node, field))
                    errors.push(owner + '/' + node.id + ' contains retired image field ' + field + '.');
        if (node.type === 'image' && (!['board', 'project'].includes(node.imageRef?.scope)
            || typeof node.imageRef.id !== 'string' || !node.imageRef.id.trim()))
            errors.push(owner + '/' + node.id + '.imageRef requires a project photo or board asset ID.');
        if (node.type === 'place')
            for (const field of ['placeId', 'placeName'])
                if (Object.hasOwn(node, field)) errors.push(owner + '/' + node.id + ' contains retired place field ' + field);
        if (node.type === 'place' && !(node.placeRef?.scope === 'board'
            ? typeof node.placeRef.name === 'string' && node.placeRef.name.trim()
            : node.placeRef?.scope === 'project' && typeof node.placeRef.id === 'string' && node.placeRef.id.trim()
                && typeof node.placeRef.fallbackName === 'string'))
            errors.push(owner + '/' + node.id + '.placeRef requires a local name or project place ID.');
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
        rejectFlatPaint(owner + '/' + connection.id + '.style', connection.style, ['color']);
        if (connection.style && Object.hasOwn(connection.style, 'line'))
            validatePaint(owner + '/' + connection.id + '.style.line', connection.style.line);
        const route = connection.route;
        if (!['auto', 'manual'].includes(route?.mode) || !Array.isArray(route.waypoints)
            || route.waypoints.some(point => !inWorld(point?.x) || !inWorld(point?.y))
            || (Object.hasOwn(route, 'railY') && !inWorld(route.railY)))
            errors.push(owner + '/' + connection.id + ' has an invalid connection route.');
        check(connection, 'familyId', local.get('families'), connection.familyId);
        for (const field of ['source', 'target'])
        {
            const endpoint = connection[field];
            if (Boolean(endpoint?.nodeId) === Boolean(endpoint?.familyId))
                errors.push(owner + '/' + connection.id + '.' + field + ' requires one node or family ID.');
            check(connection, field, local.get('nodes'), endpoint?.nodeId);
            check(connection, field, local.get('families'), endpoint?.familyId);
        }
        if (!['family-partner', 'family-child'].includes(connection.kind)) continue;
        const family = local.get('families').get(connection.familyId);
        const path = owner + '/' + connection.id;
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
        if (!PLACE_REVIEW_COORDINATE_ISSUE_TYPES.includes(issue.type)) warn(`Place issue ${issue.id} has invalid type ${issue.type}`);
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

