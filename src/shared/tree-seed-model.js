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
    personId
)
{
    return getPartnerRelationships(
        personId
    )
        .filter(family =>
        {
            const relationshipType =
                cleanTreeNamePart(
                    relationshipTypeFromLegacy(
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
    person
)
{
    if (!person?.id)
    {
        return '';
    }

    const marriage =
        activeTreeMarriages(
            person.id
        )
            .map(family => ({
                family,

                spouse:
              getRelationshipPartner(
                  family,
                  person.id
              )
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

function treePersonDisplayName(
    person
)
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
                person
            );
    }

    const maidenSurname =
        isFemale
            ? cleanTreeNamePart(
                names.maiden
            )
            : '';

    const baseName =
        [
            firstName,
            middleName,
            effectiveSurname
        ]
            .filter(Boolean)
            .join(' ')
        || cleanTreeNamePart(
            names.display
        )
        || 'Unnamed person';

    const shouldShowMaiden =
        Boolean(
            maidenSurname
          && comparableTreeSurname(
              maidenSurname
          ) !== comparableTreeSurname(
              effectiveSurname
          )
        );

    return shouldShowMaiden
        ? `${baseName} (${maidenSurname})`
        : baseName;
}

function toTreePerson(person)
{
    return {
        id: person.id,
        name:
          treePersonDisplayName(
              person
          ),
        short: person.names.initials,
        gender: person.gender,
        birth: formatGenealogyDateLabel(person.birth),
        place: getPlaceEventDisplay(person.birth),
        death: formatGenealogyDateLabel(person.death),
        deathPlace: getPlaceEventDisplay(person.death),
        status: person.livingStatus,
        avatar: person.avatarClass,
        primaryPhotoId: person.primaryPhotoId || '',
        photos: getPersonPhotoCount(person.id),
        files:
          getArchiveFilesForPerson(
              person.id
          ).length,
        notes:
          getNotesForPerson(
              person.id
          ).length
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
        initials: person.names.initials,
        name: person.names.display,
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
        updated: person.meta.updated,
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
        parents: getParents(person.id).map(parent => parent.names.display).join(' and ') || 'Unknown parents'
    };
}

function getTreePeopleFromSampleData(projectId)
{
    return getPeople(projectId).map(toTreePerson);
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

function getTreeFamiliesFromSampleData(projectId)
{
    const childOwner = new Map();
    return centralFamilyRecords()
        .filter(family => Boolean(projectId) && family.projectId === projectId)
        .map(family =>
        {
            const pair = normalizedFamilyPair(family);
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

            const children = [...new Set([...(family.childIds || []), ...(family.childrenIds || [])].filter(Boolean))]
                .filter(childId =>
                {
                    if (childOwner.has(childId)) return false;
                    childOwner.set(childId, family.id);
                    return true;
                });
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
                relationshipType: family.relationshipType || 'Partner'
            };
        })
        .filter(family => family.left || family.right || family.children.length);
}

function normalizeSampleGenealogyDates()
{
    sampleData.people.forEach(person =>
    {
        person.birth = {
            ...normalizeGenealogyDateInput(person.birth, 'Unknown'),
            placeId: cleanDatePlaceId(person.birth?.placeId),
            placeText: person.birth?.placeText || '',
            address: person.birth?.address || ''
        };

        if (person.livingStatus === 'Living')
        {
            person.death = normalizeGenealogyDateInput(person.death);
        }
        else
        {
            person.death = {
                ...normalizeGenealogyDateInput(person.death, 'Unknown'),
                placeId: cleanDatePlaceId(person.death?.placeId),
                placeText: person.death?.placeText || '',
                address: person.death?.address || '',
                reason: person.death?.reason || '',
                burialPlaceId: cleanDatePlaceId(person.death?.burialPlaceId),
                burialPlaceText: person.death?.burialPlaceText || '',
                burialAddress: person.death?.burialAddress || ''
            };
        }
    });

    (sampleData.educationSeed || []).forEach(fact =>
    {
        const person = getPerson(fact.personId);
        if (!person || personAttributeByTag(person, 'EDUC')) return;
        upsertPersonAttribute(person, 'EDUC', {
            id: fact.id || `education-${person.id}`,
            value: fact.value || fact.title || 'Education',
            type: fact.type || fact.institutionType || '',
            institutionName: fact.institutionName || fact.agency || '',
            institutionType: fact.institutionType || fact.type || '',
            placeId: cleanDatePlaceId(fact.placeId),
            placeText: fact.placeText || getPlaceDisplay(fact.placeId),
            address: fact.address || '',
            notes: fact.description || '',
            fromDate: genealogyDateOrNull({ date: fact.date, dateLabel: fact.dateLabel, dateType: fact.dateType || 'Exact date' }, 'Exact date'),
            toDate: null
        });
    });
    delete sampleData.educationSeed;

    const barnaby = getPerson('barnaby');
    if (barnaby && !personAttributeByTag(barnaby, 'OCCU'))
    {
        upsertPersonAttribute(barnaby, 'OCCU', {
            value: 'Archive clerk',
            company: 'Pawford records room',
            notes: 'Sample occupation fact kept on the centralized person record.',
            fromDate: genealogyDateOrNull({ date: '1976', dateLabel: '1976', dateType: 'Exact date' }, 'Exact date'),
            toDate: genealogyDateOrNull({ date: '1995', dateLabel: '1995', dateType: 'Exact date' }, 'Exact date')
        });
    }

    const pearl = getPerson('pearl');
    if (pearl && !personEventByTag(pearl, 'BAPM'))
    {
        upsertPersonEvent(pearl, 'BAPM', {
            date: genealogyDateOrNull({ date: '1928', dateLabel: '1928', dateType: 'Exact date' }, 'Exact date'),
            placeId: 'place-old-cattery',
            placeText: getPlaceDisplay('place-old-cattery')
        });
    }

    const legacyRelationships = Array.isArray(sampleData.relationshipSeed) ? sampleData.relationshipSeed : [];
    const gedcomRelationships = Array.isArray(sampleData.relationships) ? sampleData.relationships : [];
    const existingFamilies = Array.isArray(sampleData.families) && sampleData.families.length ? sampleData.families : [];
    sampleData.families = buildFamiliesFromRelationshipRecords([...existingFamilies, ...gedcomRelationships, ...legacyRelationships]);
    sampleData.families.forEach(family =>
    {
        const partnerAId = familyPartnerAId(family);
        const partnerBId = familyPartnerBId(family);
        const relationshipType = relationshipTypeFromLegacy(family);
        const startDate = normalizeGenealogyDateInput({
            date: family.startDate,
            dateLabel: family.startDateLabel,
            dateType: family.startDateType || (cleanGenealogyDateText(family.startDate || family.startDateLabel) ? 'Exact date' : 'Exact date'),
            sortDate: family.startSortDate,
            calendar: family.startCalendar,
            originalText: family.startOriginalText
        }, 'Exact date');

        family.type = 'family';
        family.relationshipType = relationshipType;
        family.relationshipStatus = family.relationshipStatus || 'active';
        family.partnerAId = partnerAId;
        family.partnerBId = partnerBId;
        family.partner1Id = partnerAId;
        family.partner2Id = partnerBId;
        family.personAId = partnerAId;
        family.personBId = partnerBId;
        family.partnerARoleHint = family.partnerARoleHint || (getPerson(partnerAId)?.gender === 'male' ? 'HUSB' : getPerson(partnerAId)?.gender === 'female' ? 'WIFE' : '');
        family.partnerBRoleHint = family.partnerBRoleHint || (getPerson(partnerBId)?.gender === 'male' ? 'HUSB' : getPerson(partnerBId)?.gender === 'female' ? 'WIFE' : '');
        family.gedcomXref = family.gedcomXref || `@F${family.id.replace(/[^a-z0-9]/gi, '').toUpperCase()}@`;
        family.childIds = [...new Set(family.childIds || [])];
        family.events = Array.isArray(family.events) ? family.events : [];
        family.attributes = Array.isArray(family.attributes) ? family.attributes : [];
        family.notes = Array.isArray(family.notes) ? family.notes : [];
        family.citations = Array.isArray(family.citations) ? family.citations : [];
        family.mediaIds = Array.isArray(family.mediaIds) ? family.mediaIds : [];

        family.startDate = startDate.date;
        family.startDateLabel = startDate.dateLabel;
        family.startDateType = startDate.dateType;
        family.startSortDate = startDate.sortDate;
        family.startCalendar = startDate.calendar;
        family.startOriginalText = startDate.originalText;
        family.startPlaceId = cleanDatePlaceId(family.startPlaceId);

        let marriage = relationshipEventByTag(family, 'MARR');
        if (!marriage)
        {
            marriage = createRelationshipEvent('MARR', 'Marriage', {
                id: `${family.id}-marriage`,
                typeLabel: family.marriageType || 'Civil',
                date: startDate,
                placeId: family.startPlaceId,
                placeText: family.startPlaceText || getPlaceDisplay(family.startPlaceId),
                address: family.startAddress || ''
            });
            if (relationshipType === 'Married' || formatGenealogyDateLabel(startDate) || family.startPlaceId) family.events.push(marriage);
        }
        else
        {
            marriage.date = normalizeGenealogyDateInput(marriage.date || startDate, 'Exact date');
            marriage.placeId = cleanDatePlaceId(marriage.placeId || family.startPlaceId);
            marriage.placeText = marriage.placeText || getPlaceDisplay(marriage.placeId);
            marriage.address = marriage.address || family.startAddress || '';
            marriage.typeLabel = marriage.typeLabel || family.marriageType || 'Civil';
            marriage.sortDate = marriage.date.sortDate || '';
        }
    });
    delete sampleData.relationshipSeed;
    syncFamilyReciprocalLinks();
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

function familyStartDateForTimeline(family)
{
    return normalizeGenealogyDateInput({
        date: family?.startDate || '',
        dateLabel: family?.startDateLabel || '',
        dateType: family?.startDateType || 'Exact date',
        sortDate: family?.startSortDate || '',
        calendar: family?.startCalendar || 'Gregorian',
        originalText: family?.startOriginalText || ''
    }, 'Exact date');
}

function familyLooksMarriedForTimeline(family)
{
    const relationshipType = cleanEditFieldValue(family?.relationshipType).toLowerCase();
    const marriageType = cleanEditFieldValue(family?.marriageType);
    const startDate = familyStartDateForTimeline(family);

    return Boolean(
        relationshipType === 'married'
          || relationshipType.includes('marriage')
          || marriageType
          || hasGenealogyDateValue(startDate, 'Exact date')
          || family?.startPlaceId
    );
}

function relationshipEventTag(event)
{
    return event?.gedcomTag || event?.tag || '';
}

function familyMarriageEventsForTimeline(family)
{
    const storedMarriageEvents = (family?.events || [])
        .filter(event => relationshipEventTag(event) === 'MARR');

    if (storedMarriageEvents.length)
    {
        return storedMarriageEvents;
    }

    if (!familyLooksMarriedForTimeline(family))
    {
        return [];
    }

    const startDate = familyStartDateForTimeline(family);

    return [{
        id: `${family.id}-marriage-derived`,
        gedcomTag: 'MARR',
        typeLabel: family.marriageType || '',
        date: startDate,
        placeId: family.startPlaceId || null,
        placeText: getPlaceDisplay(family.startPlaceId),
        derived: true
    }];
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
    const eventPerson = id => context ? eventPeople.find(person => person.id === id) : getPerson(id);

    eventPeople.forEach(person =>
    {
        ensurePersonCentralStructures(person);
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
            description: `Birth of ${person.names.display}`
        });
    });

    eventFamilies.forEach(family =>
    {
        const personA = eventPerson(familyPartnerAId(family));
        const personB = eventPerson(familyPartnerBId(family));
        if (personA && personB)
        {
            familyMarriageEventsForTimeline(family).forEach(event =>
            {
                const eventDate = timelineDatePayload(event.date, 'Exact date');
                const partnerAId = familyPartnerAId(family);
                const partnerBId = familyPartnerBId(family);
                const placeId = cleanDatePlaceId(event.placeId || family.startPlaceId) || null;

                events.push({
                    id: `event-${family.id}-${event.id || 'marriage'}`,
                    projectId: family.projectId || personA.projectId || personB.projectId,
                    type: 'marriage',
                    editTarget: { kind: 'relationship', personId: personA.id, recordId: family.id },
                    dateKind: 'point',
                    familyId: family.id,
                    personIds: [partnerAId, partnerBId],
                    relatedPersonIds: [partnerAId, partnerBId],
                    ...eventDate,
                    placeId,
                    placeText: event.placeText || getPlaceDisplay(placeId),
                    address: event.address || family.startAddress || '',
                    title: 'Marriage',
                    description: `Marriage of ${personA.names.display} and ${personB.names.display}`,
                    marriageType: event.typeLabel || family.marriageType || ''
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
              child.names.display
            });
        });
    });

    eventPeople.forEach(person =>
    {
        ensurePersonCentralStructures(person);
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
                description: `Death of ${person.names.display}`
            });
        }

        (person.attributes || []).forEach(attribute =>
        {
            if (attribute.tag === 'EDUC')
            {
                const fromDate = timelineOptionalGenealogyDate(attribute.fromDate || attribute.date, 'Exact date');
                const toDate = timelineOptionalGenealogyDate(attribute.toDate, 'Exact date');
                const primaryDate = fromDate || toDate || timelineUnknownGenealogyDate('Exact date');

                const institutionName = educationInstitutionLabel(attribute);
                const educationValue = educationValueLabel(attribute);

                const hasEducationContent = Boolean(
                    fromDate
                || toDate
                || timelineAttributeHasContent(attribute, ['institutionName', 'agency', 'value', 'type', 'institutionType', 'notes'])
                );

                if (!hasEducationContent) return;

                const eventDate = timelineDatePayload(primaryDate, 'Exact date');

                events.push({
                    id: `event-${attribute.id || `${person.id}-education`}`,
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
                const fromDate = timelineOptionalGenealogyDate(attribute.fromDate || attribute.date, 'Exact date');
                const toDate = timelineOptionalGenealogyDate(attribute.toDate, 'Exact date');
                const primaryDate = fromDate || toDate || timelineUnknownGenealogyDate('Exact date');

                const company = cleanEditFieldValue(attribute.company || attribute.agency);
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
                    id: `event-${attribute.id || `${person.id}-occupation`}`,
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
                      || `${person.id}-fact`
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
            const tag = event.tag || event.gedcomTag;
            if (!['BAPM', 'BURI'].includes(tag)) return;
            const eventDate = eventDateFields(event.date || emptyGenealogyDate('Exact date'));
            events.push({
                id: `event-${event.id || `${person.id}-${tag.toLowerCase()}`}`,
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
                description: event.notes || event.placeText || `${tag === 'BAPM' ? 'Baptism' : 'Burial'} of ${person.names.display}`
            });
        });
    });

    return events;
}

function rebuildSampleEventsAndPruneSourceLinks()
{
    sampleData.events =
        buildSampleEvents();

    const eventProjects = new Map(
        sampleData.events.map(event => [event.id, event.projectId])
    );

    (sampleData.archiveFiles || []).forEach(file =>
    {
        file.linkedEventIds = (file.linkedEventIds || [])
            .filter(eventId => eventProjects.get(eventId) === file.projectId);
    });

    /*
        Source links are populated later than the
        first generated-event build during startup.
      */
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

