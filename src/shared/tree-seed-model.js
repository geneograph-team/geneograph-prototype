function cleanTreeNamePart(value)
{
    return String(value || '')
        .trim()
        .replace(/\s+/g, ' ');
}

function comparableTreeSurname(value)
{
    return cleanTreeNamePart(value)
        .normalize('NFKC')
        .toLocaleLowerCase();
}

function treeMarriageSortKey(
    family
)
{
    const marriageEvent =
        relationshipEventByTag(
            family,
            'MARR'
        );

    const marriageDate =
        normalizeGenealogyDateInput(
            marriageEvent?.date
          || {},
            'Exact date'
        );

    const sortValue =
        marriageDate.sortDate
        || marriageEvent?.sortDate
        || family?.startSortDate
        || '';

    const numericValue =
        Number(sortValue);

    return Number.isFinite(
        numericValue
    )
        ? numericValue
        : 0;
}

function activeTreeMarriages(
    personId, families = getPartnerRelationships(personId)
)
{
    return families
        .filter(family =>
        {
            const relationshipType =
                cleanTreeNamePart(
                    familyRelationshipType(
                        family
                    )
                );

            const relationshipStatus =
                cleanTreeNamePart(
                    family.relationshipStatus
              || 'active'
                ).toLocaleLowerCase();

            return (
                relationshipType === 'Married'
            && relationshipStatus === 'active'
            );
        })
        .sort((left, right) =>
        {
            const dateDifference =
                treeMarriageSortKey(right)
            - treeMarriageSortKey(left);

            if (dateDifference)
            {
                return dateDifference;
            }

            return String(
                left.id || ''
            ).localeCompare(
                String(
                    right.id || ''
                )
            );
        });
}

function marriedSpouseSurnameForTree(
    person, context
)
{
    if (!person?.id)
    {
        return '';
    }

    const marriage =
        activeTreeMarriages(
            person.id, context ? context.partnerFamilies.get(person.id) || [] : undefined
        )
            .map(family => ({
                family,

                spouse:
              context ? context.lookupPerson(getRelationshipPartnerId(family, person.id)) : getRelationshipPartner(family, person.id)
            }))
            .find(entry =>
                cleanTreeNamePart(
                    entry.spouse
                        ?.names
                        ?.last
                )
            );

    return cleanTreeNamePart(
        marriage
            ?.spouse
            ?.names
            ?.last
    );
}

function treePersonCardNames(person, context)
{
    const names =
        person?.names
        || {};

    const firstName =
        cleanTreeNamePart(
            names.first
        );

    const middleName =
        cleanTreeNamePart(
            names.middle
        );

    const isFemale =
        String(
            person?.gender || ''
        ).toLocaleLowerCase()
          === 'female';

    let effectiveSurname =
        cleanTreeNamePart(
            names.last
        );

    /*
      * This is a display fallback only. Never persist
      * the spouse's surname to the person's record.
      */
    if (
        isFemale
        && !effectiveSurname
    )
    {
        effectiveSurname =
            marriedSpouseSurnameForTree(
                person, context
            );
    }

    const maidenSurname =
        isFemale
            ? cleanTreeNamePart(
                names.maiden
            )
            : '';

    const shouldShowMaiden =
        Boolean(
            maidenSurname
          && comparableTreeSurname(
              maidenSurname
          ) !== comparableTreeSurname(
              effectiveSurname
          )
        );

    const format = middle =>
    {
        const core = [firstName, middle, effectiveSurname].filter(Boolean).join(' ');
        if (!core)
            return formatPersonFullName({ ...person, names: { ...names, middle } }) || 'Unnamed person';
        return [
            cleanTreeNamePart(names.prefix),
            shouldShowMaiden ? `${core} (${maidenSurname})` : core,
            cleanTreeNamePart(names.suffix)
        ].filter(Boolean).join(' ');
    };
    const name = format(middleName);
    return { name, compactName: middleName ? format('') : name };
}

function toTreePerson(person, context)
{
    return {
        id: person.id,
        ...treePersonCardNames(person, context),
        first: cleanTreeNamePart(person.names?.first),
        names: person.names,
        birthFact: person.birth,
        deathFact: person.death,
        short: formatPersonInitials(person),
        gender: person.gender,
        birth: formatGenealogyDateLabel(person.birth),
        place: getPlaceEventDisplay(person.birth),
        death: formatGenealogyDateLabel(person.death),
        deathPlace: getPlaceEventDisplay(person.death),
        status: person.livingStatus,
        avatar: person.avatarClass,
        primaryPhotoId: person.primaryPhotoId || '',
        ...(context ? context.counts.get(person.id) : {
            photos: getPersonPhotoCount(person.id),
            files: getArchiveFilesForPerson(person.id).length,
            notes: getNotesForPerson(person.id).length
        })
    };
}

function markPersonUpdated(
    person,
    now = new Date().toISOString()
)
{
    if (!person)
    {
        return;
    }

    person.meta =
        person.meta || {};

    person.meta.updated =
        'Just now';

    person.updatedAt =
        now;
    markPrototypeSessionEdited();
}

function toPeopleRecord(
    person,
    relationshipLabels = null
)
{
    const sourceCount =
        sourceIdsForTarget(
            'person',
            person.id,
            person.projectId
        ).length;
    return {
        id: person.id,
        initials: formatPersonInitials(person),
        name: formatPersonFullName(person),
        first: person.names.first,
        surname: person.names.last,
        living: person.livingStatus,
        birth: formatGenealogyDateLabel(person.birth),
        birthYear:
          timelineYearFromValue(
              person.birth
          ),
        birthPlace: getPlaceEventDisplay(person.birth),
        birthPlaceId:
          person.birth?.placeId
          || '',
        death: formatGenealogyDateLabel(person.death),
        deathPlace: getPlaceEventDisplay(person.death),
        updated: person.meta?.updated || '',
        updatedAt:
          person.updatedAt || '',

        createdAt:
          person.createdAt || '',
        gender: person.gender,
        relation:
          relationshipLabels
              ?.get(person.id)
          || personRelationshipLabel(
              person.id,
              treeDefaultPersonId(
                  person.projectId
              )
          ),
        photos: getPersonPhotoCount(person.id),
        files: getArchiveFilesForPerson(person.id).length,
        notes:
          getNotesForPerson(
              person.id
          ).length,
        sourceCount,
        avatarClass: person.avatarClass,
        primaryPhotoId: person.primaryPhotoId || '',
        parents: getParents(person.id).map(parent => formatPersonFullName(parent)).join(' and ') || 'Unknown parents'
    };
}

function getTreePeopleFromSampleData(projectId)
{
    return getPeople(projectId).map(person => toTreePerson(person));
}

function getPeopleRecordsFromSampleData(
    projectId
)
{
    const referencePersonId =
        treeDefaultPersonId(
            projectId
        );

    const relationshipLabels =
        buildPersonRelationshipLabelMap(
            projectId,
            referencePersonId
        );

    return getPeople(projectId)
        .filter(person =>
            !person.deleted
        )
        .map(person =>
            toPeopleRecord(
                person,
                relationshipLabels
            )
        );
}

function getTreeFamiliesFromSampleData(projectId, lookupPerson)
{
    return centralFamilyRecords()
        .filter(family => Boolean(projectId) && family.projectId === projectId)
        .map(family =>
        {
            const pair = normalizedFamilyPair(family, { lookupPerson });
            const partnerIds = [...new Set([familyPartnerAId(family), familyPartnerBId(family)].filter(Boolean))];
            let leftId = pair.fatherId || null;
            let rightId = pair.motherId || null;

            if (!leftId && !rightId)
            {
                [leftId, rightId = null] = partnerIds;
            }
            else if (!leftId)
            {
                leftId = partnerIds.find(id => id !== rightId) || null;
            }
            else if (!rightId)
            {
                rightId = partnerIds.find(id => id !== leftId) || null;
            }

            const children = [...family.childIds];
            return {
                id: family.id,
                sourceFamilyId: family.id,
                fatherId: pair.fatherId || null,
                motherId: pair.motherId || null,
                left: leftId,
                right: rightId,
                children,
                missingFather: !pair.fatherId,
                missingMother: !pair.motherId,
                relationshipType: family.relationshipType || 'Partner',
                relationshipStatus: family.relationshipStatus || ''
            };
        })
        .filter(family => family.left || family.right || family.children.length);
}

function eventDateFields(dateInput)
{
    const value = normalizeGenealogyDateInput(dateInput);
    return {
        state: value.state,
        first: value.first,
        second: value.second,
        date: value.date,
        dateLabel: value.dateLabel,
        dateType: value.dateType,
        sortDate: value.sortDate,
        calendar: value.calendar,
        originalText: value.originalText,
        date2: value.date2,
        date2Label: value.date2Label,
        sortDate2: value.sortDate2
    };
}

function timelineOptionalGenealogyDate(dateInput, fallbackType = 'Exact date')
{
    if (!dateInput) return null;

    const normalized = normalizeGenealogyDateInput(dateInput, fallbackType);
    return hasGenealogyDateValue(normalized, fallbackType) ? normalized : null;
}

function timelineUnknownGenealogyDate(fallbackType = 'Exact date')
{
    return emptyGenealogyDate(fallbackType);
}

function timelineDatePayload(dateInput, fallbackType = 'Exact date')
{
    return eventDateFields(dateInput || timelineUnknownGenealogyDate(fallbackType));
}

function timelineAttributeHasContent(attribute, fields = [])
{
    return fields.some(field => cleanEditFieldValue(attribute?.[field]))
        || Boolean(attribute?.placeId)
        || cleanEditFieldValue(attribute?.placeText);
}

function timelineDateRangeLabel(fromDate, toDate)
{
    const from = formatGenealogyDateLabel(fromDate);
    const to = formatGenealogyDateLabel(toDate);

    const qualified = date => date && !['Exact date', 'Exact', ''].includes(date.type || date.dateType || 'Exact date');
    const ru = state.language === 'ru';
    if (qualified(fromDate) || qualified(toDate))
        return [from && `${ru ? 'Начало' : 'Start'}: ${from}`, to && `${ru ? 'Окончание' : 'End'}: ${to}`].filter(Boolean).join('\n');
    if (from && to) return `${from} — ${to}`;
    if (from) return `${ru ? 'С' : 'From'} ${from}`;
    if (to) return `${ru ? 'До' : 'Until'} ${to}`;

    return '';
}

function buildSampleEvents(context = null)
{
    const events = [];
    const eventPeople = context?.people || sampleData.people;
    const eventFamilies = context?.families || centralFamilyRecords();
    const peopleById = context ? new Map(eventPeople.map(person => [person.id, person])) : null;
    const placesById = context ? new Map((context.places || []).map(place => [place.id, place])) : null;
    const eventPerson = id => peopleById ? peopleById.get(id) : getPerson(id);
    const eventPlaceName = id => placesById ? placesById.get(id)?.name || '' : getPlaceDisplay(id);

    eventPeople.forEach(person =>
    {
        const birthDate = eventDateFields(person.birth);
        events.push({
            id: `event-${person.id}-birth`,
            projectId: person.projectId,
            type: 'birth',
            editTarget: { kind: 'birth', personId: person.id },
            personIds: [person.id],
            relatedPersonIds: [],
            ...birthDate,
            placeId: person.birth?.placeId || null,
            placeText: person.birth?.placeText || '',
            address: person.birth?.address || '',
            title: 'Birth',
            description: `Birth of ${formatPersonFullName(person)}`
        });
    });

    eventFamilies.forEach(family =>
    {
        const personA = eventPerson(familyPartnerAId(family));
        const personB = eventPerson(familyPartnerBId(family));
        if (personA && personB)
        {
            family.events.forEach(event =>
            {
                const marriage = event.gedcomTag === 'MARR';
                const title = marriage ? 'Marriage' : event.eventType;
                const eventDate = timelineDatePayload(event.date, 'Exact date');
                const partnerAId = familyPartnerAId(family);
                const partnerBId = familyPartnerBId(family);
                const placeId = cleanDatePlaceId(event.placeId) || null;

                events.push({
                    id: `event-${family.id}-${event.id}`,
                    projectId: family.projectId || personA.projectId || personB.projectId,
                    type: marriage ? 'marriage' : 'relationship',
                    editTarget: { kind: 'relationship', personId: personA.id, recordId: family.id },
                    dateKind: 'point',
                    familyId: family.id,
                    personIds: [partnerAId, partnerBId],
                    relatedPersonIds: [partnerAId, partnerBId],
                    ...eventDate,
                    placeId,
                    placeText: event.placeText || eventPlaceName(placeId),
                    address: event.address || '',
                    title,
                    description: marriage ? `Marriage of ${formatPersonFullName(personA)} and ${formatPersonFullName(personB)}` : event.description || title,
                    ...(marriage ? { marriageType: event.typeLabel || '' } : {})
                });
            });
        }

        (family.childIds || []).forEach(childId =>
        {
            const child = eventPerson(childId);
            if (!child) return;
            const childBirthDate = eventDateFields(child.birth);
            const parentIds =
                [
                    ...new Set([
                        familyPartnerAId(
                            family
                        ),

                        familyPartnerBId(
                            family
                        )
                    ])
                ]
                    .filter(Boolean)
                    .filter(parentId =>
                    {
                        const parent =
                            eventPerson(
                                parentId
                            );

                        return Boolean(
                            parent
                  && !parent.deleted
                        );
                    });

            if (!parentIds.length)
            {
                return;
            }

            events.push({
                id:
              `event-${family.id}-${childId}-child-birth`,

                projectId:
              family.projectId
              || child.projectId,

                type:
              'childBirth',
                editTarget: { kind: 'birth', personId: childId },

                personIds:
              parentIds,

                relatedPersonIds:
              [childId],

                ...childBirthDate,

                placeId:
              child.birth?.placeId
              || null,

                placeText:
              child.birth?.placeText
              || '',

                address:
              child.birth?.address
              || '',

                title:
              `Birth of ${
                  child.gender === 'female'
                      ? 'daughter'
                      : child.gender === 'male'
                          ? 'son'
                          : 'child'
              }`,

                description:
              formatPersonFullName(child)
            });
        });
    });

    eventPeople.forEach(person =>
    {
        if (person.livingStatus === 'Deceased')
        {
            const deathDate = eventDateFields(person.death);
            events.push({
                id: `event-${person.id}-death`,
                projectId: person.projectId,
                type: 'death',
                editTarget: { kind: 'death', personId: person.id },
                personIds: [person.id],
                relatedPersonIds: [],
                ...deathDate,
                placeId: person.death?.placeId || null,
                placeText: person.death?.placeText || '',
                address: person.death?.address || '',
                title: 'Death',
                description: `Death of ${formatPersonFullName(person)}`
            });
        }

        (person.attributes || []).forEach(attribute =>
        {
            if (attribute.tag === 'EDUC')
            {
                const fromDate = timelineOptionalGenealogyDate(attribute.fromDate, 'Exact date');
                const toDate = timelineOptionalGenealogyDate(attribute.toDate, 'Exact date');
                const primaryDate = fromDate || toDate || timelineUnknownGenealogyDate('Exact date');

                const institutionName = educationInstitutionLabel(attribute);
                const educationValue = educationValueLabel(attribute);

                const hasEducationContent = Boolean(
                    fromDate
                || toDate
                || timelineAttributeHasContent(attribute, ['institutionName', 'value', 'institutionType', 'notes'])
                );

                if (!hasEducationContent) return;

                const eventDate = timelineDatePayload(primaryDate, 'Exact date');

                events.push({
                    id: `event-${attribute.id}`,
                    projectId: person.projectId,
                    type: 'education',
                    editTarget: { kind: 'attribute', personId: person.id, recordId: attribute.id },
                    dateKind: 'span',
                    personIds: [person.id],
                    relatedPersonIds: [],
                    ...eventDate,
                    fromDate,
                    toDate,
                    placeId: attribute.placeId || null,
                    placeText: attribute.placeText || '',
                    address: attribute.address || '',
                    title: 'Education',
                    description: educationTimelineDescription(attribute),
                    institutionName,
                    institutionType: educationInstitutionTypeLabel(attribute),
                    educationValue,
                    dateRangeLabel: timelineDateRangeLabel(fromDate, toDate)
                });
            }

            if (attribute.tag === 'OCCU')
            {
                const fromDate = timelineOptionalGenealogyDate(attribute.fromDate, 'Exact date');
                const toDate = timelineOptionalGenealogyDate(attribute.toDate, 'Exact date');
                const primaryDate = fromDate || toDate || timelineUnknownGenealogyDate('Exact date');

                const company = cleanEditFieldValue(attribute.company);
                const occupation = cleanEditFieldValue(attribute.value || attribute.occupation);

                const hasOccupationContent = Boolean(
                    fromDate
                || toDate
                || company
                || occupation
                || timelineAttributeHasContent(attribute, ['type', 'notes'])
                );

                if (!hasOccupationContent) return;

                const eventDate = timelineDatePayload(primaryDate, 'Exact date');

                events.push({
                    id: `event-${attribute.id}`,
                    projectId: person.projectId,
                    type: 'occupation',
                    editTarget: { kind: 'attribute', personId: person.id, recordId: attribute.id },
                    dateKind: 'span',
                    personIds: [person.id],
                    relatedPersonIds: [],
                    ...eventDate,
                    fromDate,
                    toDate,
                    placeId: attribute.placeId || null,
                    placeText: attribute.placeText || '',
                    address: attribute.address || '',
                    title: 'Occupation',
                    description: [occupation, company].filter(Boolean).join(' at ') || 'Occupation fact',
                    company,
                    occupation,
                    dateRangeLabel: timelineDateRangeLabel(fromDate, toDate)
                });
            }

            if (attribute.tag === 'FACT')
            {
                const factType =
                    cleanEditFieldValue(
                        attribute.type
                    );

                const factValue =
                    cleanEditFieldValue(
                        attribute.value
                    );

                const factNotes =
                    cleanEditFieldValue(
                        attribute.notes
                    );

                const factDate =
                    timelineOptionalGenealogyDate(
                        attribute.date,
                        'Exact date'
                    );

                const hasFactContent = Boolean(factType);

                if (!hasFactContent)
                {
                    return;
                }

                events.push({
                    id:
                  `event-${
                      attribute.id
                  }`,

                    projectId:
                  person.projectId,

                    type:
                  'customFact',
                    editTarget: { kind: 'attribute', personId: person.id, recordId: attribute.id },

                    dateKind:
                  'point',

                    personIds:
                  [person.id],

                    relatedPersonIds:
                  [],

                    ...timelineDatePayload(
                        factDate
                    || timelineUnknownGenealogyDate(
                        'Exact date'
                    ),
                        'Exact date'
                    ),

                    placeId:
                  attribute.placeId || null,

                    placeText:
                  attribute.placeText || '',

                    address:
                  attribute.address || '',

                    title:
                  factType,

                    description:
                  factValue,

                    notes:
                  factNotes
                });
            }
        });

        (person.events || []).forEach(event =>
        {
            const tag = event.gedcomTag;
            if (!['BAPM', 'BURI'].includes(tag)) return;
            const eventDate = eventDateFields(event.date || emptyGenealogyDate('Exact date'));
            events.push({
                id: `event-${event.id}`,
                projectId: person.projectId,
                type: tag === 'BAPM' ? 'baptism' : 'burial',
                editTarget: { kind: 'event', personId: person.id, recordId: event.id, tag },
                personIds: [person.id],
                relatedPersonIds: [],
                ...eventDate,
                placeId: event.placeId || null,
                placeText: event.placeText || '',
                address: event.address || '',
                title: tag === 'BAPM' ? 'Baptism' : 'Burial',
                description: event.notes || event.placeText || `${tag === 'BAPM' ? 'Baptism' : 'Burial'} of ${formatPersonFullName(person)}`
            });
        });
    });

    return events;
}

function projectEventReferences(records, eventProjects)
{
    return records.map(record =>
    {
        if (!record.linkedEventIds?.length) return record;
        const linkedEventIds = record.linkedEventIds.filter(id => eventProjects.get(id) === record.projectId);
        return linkedEventIds.length === record.linkedEventIds.length ? record : { ...record, linkedEventIds };
    });
}

function rebuildSampleEventsAndPruneSourceLinks()
{
    sampleData.events =
        buildSampleEvents();

    const eventProjects = new Map(sampleData.events.map(event => [event.id, event.projectId]));
    for (const key of ['archiveFiles', 'notes'])
        sampleData[key] = projectEventReferences(sampleData[key], eventProjects);

    if (
        Array.isArray(
            sampleData.sourceLinks
        )
        && sampleData.sourceLinks.length
    )
    {
        pruneInvalidSourceLinks();
    }

    return sampleData.events;
}

function validateSampleNotesFixture(
    warn = message =>
        console.warn(
            '[sampleData]',
            message
        )
)
{
    if (
        sampleData.notes.length
          !== EXPECTED_CANONICAL_NOTE_COUNT
    )
    {
        warn(
            `Expected exactly ${
                EXPECTED_CANONICAL_NOTE_COUNT
            } seeded notes; found ${
                sampleData.notes.length
            }`
        );
    }

    if (
        sampleData.noteCollections.length
          !== EXPECTED_CANONICAL_NOTE_COLLECTION_COUNT
    )
    {
        warn(
            `Expected exactly ${
                EXPECTED_CANONICAL_NOTE_COLLECTION_COUNT
            } seeded note collections; found ${
                sampleData.noteCollections.length
            }`
        );
    }
}

