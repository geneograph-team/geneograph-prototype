const PARTNER_RELATIONSHIP_DEFINITIONS = Object.freeze({
    'Married': Object.freeze({ status: 'active', startTag: 'MARR', startEventType: 'Marriage', startTypeLabel: '', endTag: '', endEventType: '', endTypeLabel: '', hasEnd: false, startLabel: 'Marriage date', startPlaceLabel: 'Marriage place', showsMarriageType: true }),
    'Partner': Object.freeze({ status: 'active', startTag: 'EVEN', startEventType: 'Partnership', startTypeLabel: 'Partnership began', endTag: '', endEventType: '', endTypeLabel: '', hasEnd: false, startLabel: 'Relationship date', startPlaceLabel: 'Relationship place', showsMarriageType: false }),
    'Unmarried partner': Object.freeze({ status: 'active', startTag: 'EVEN', startEventType: 'Partnership', startTypeLabel: 'Partnership began', endTag: '', endEventType: '', endTypeLabel: '', hasEnd: false, startLabel: 'Relationship date', startPlaceLabel: 'Relationship place', showsMarriageType: false }),
    'Former partner': Object.freeze({ status: 'ended', startTag: 'EVEN', startEventType: 'Partnership', startTypeLabel: 'Partnership began', endTag: 'EVEN', endEventType: 'Partnership', endTypeLabel: 'Partnership ended', hasEnd: true, startLabel: 'From', startPlaceLabel: 'From place', endLabel: 'To', endPlaceLabel: 'To place', showsMarriageType: false }),
    'Separated': Object.freeze({ status: 'separated', startTag: 'MARR', startEventType: 'Marriage', startTypeLabel: '', endTag: 'EVEN', endEventType: 'Separation', endTypeLabel: 'Separation', hasEnd: true, startLabel: 'From', startPlaceLabel: 'From place', endLabel: 'To', endPlaceLabel: 'To place', showsMarriageType: true }),
    'Divorced': Object.freeze({ status: 'divorced', startTag: 'MARR', startEventType: 'Marriage', startTypeLabel: '', endTag: 'DIV', endEventType: 'Divorce', endTypeLabel: '', hasEnd: true, startLabel: 'From', startPlaceLabel: 'From place', endLabel: 'To', endPlaceLabel: 'To place', showsMarriageType: true }),
    'Annulled': Object.freeze({ status: 'annulled', startTag: 'MARR', startEventType: 'Marriage', startTypeLabel: '', endTag: 'ANUL', endEventType: 'Annulment', endTypeLabel: '', hasEnd: true, startLabel: 'From', startPlaceLabel: 'From place', endLabel: 'To', endPlaceLabel: 'To place', showsMarriageType: true }),
    'Engaged': Object.freeze({ status: 'active', startTag: 'ENGA', startEventType: 'Engagement', startTypeLabel: '', endTag: '', endEventType: '', endTypeLabel: '', hasEnd: false, startLabel: 'Engagement date', startPlaceLabel: 'Engagement place', showsMarriageType: false }),
    'Unknown relationship': Object.freeze({ status: 'unknown', startTag: 'EVEN', startEventType: 'Relationship', startTypeLabel: 'Relationship began', endTag: '', endEventType: '', endTypeLabel: '', hasEnd: false, startLabel: 'Relationship date', startPlaceLabel: 'Relationship place', showsMarriageType: false })
});

const ADD_PERSON_RELATIONSHIP_TYPES = Object.freeze(Object.keys(PARTNER_RELATIONSHIP_DEFINITIONS));
const ADD_PERSON_MARRIAGE_TYPES = ['Civil', 'Religious', 'Common law', 'Customary', 'Tribal custom', 'Unknown'];

function addPersonRelationshipTypeOptions(selected = 'Married')
{
    const active = ADD_PERSON_RELATIONSHIP_TYPES.includes(selected) ? selected : 'Married';
    return ADD_PERSON_RELATIONSHIP_TYPES.map(value => `<option value="${escapeHtml(value)}" ${value === active ? 'selected' : ''}>${escapeHtml(value)}</option>`).join('');
}
function partnerRelationshipDefinition(type)
{
    return PARTNER_RELATIONSHIP_DEFINITIONS[type] || PARTNER_RELATIONSHIP_DEFINITIONS['Unknown relationship'];
}
function addPersonRelationshipShowsMarriageType(type)
{
    return partnerRelationshipDefinition(String(type || '').trim()).showsMarriageType;
}
function addPersonMarriageTypeOptions(selected = 'Civil')
{
    const active = ADD_PERSON_MARRIAGE_TYPES.includes(selected) ? selected : 'Civil';
    return ADD_PERSON_MARRIAGE_TYPES.map(value => `<option value="${escapeHtml(value)}" ${value === active ? 'selected' : ''}>${escapeHtml(value)}</option>`).join('');
}

function relationshipEventMatches(event, tag, typeLabel = '')
{
    if (!event || event.gedcomTag !== tag) return false;
    if (tag !== 'EVEN') return true;
    return cleanEditFieldValue(event.typeLabel).toLowerCase() === cleanEditFieldValue(typeLabel).toLowerCase();
}

function partnerRelationshipManagedEvent(family, tag, typeLabel = '')
{
    return (family?.events || []).find(event => relationshipEventMatches(event, tag, typeLabel)) || null;
}

function partnerRelationshipStartEvent(family, type = familyRelationshipType(family))
{
    const definition = partnerRelationshipDefinition(type);
    const recorded = partnerRelationshipDefinition(familyRelationshipType(family));
    const event = family?.events?.find(item => item.relationshipManagedRole === 'start')
        || partnerRelationshipManagedEvent(family, recorded.startTag, recorded.startTypeLabel);
    if (event) return event;
    return createRelationshipEvent(definition.startTag, definition.startEventType, {
        id: `${family?.id || 'new-relationship'}-start`,
        typeLabel: definition.startTypeLabel,
        date: emptyGenealogyDate('Exact date')
    });
}

function partnerRelationshipEndEvent(family, type = familyRelationshipType(family))
{
    const definition = partnerRelationshipDefinition(type);
    if (!definition.hasEnd) return null;
    const managed = family?.events?.find(event => event.relationshipManagedRole === 'end');
    if (managed) return managed;
    const recorded = partnerRelationshipDefinition(familyRelationshipType(family));
    if (recorded.hasEnd)
    {
        const event = partnerRelationshipManagedEvent(family, recorded.endTag, recorded.endTypeLabel);
        if (event) return event;
    }
    return createRelationshipEvent(definition.endTag, definition.endEventType, {
        id: `${family?.id || 'new-relationship'}-end`,
        typeLabel: definition.endTypeLabel,
        date: emptyGenealogyDate('Exact date')
    });
}

function renderPartnerRelationshipDateFields({ prefix, relationshipType, family = null } = {})
{
    const definition = partnerRelationshipDefinition(relationshipType);
    const startEvent = partnerRelationshipStartEvent(family, relationshipType);
    const endEvent = partnerRelationshipEndEvent(family, relationshipType);
    const startPlace = editPlaceValue(startEvent?.placeId, startEvent?.placeText);
    const endPlace = editPlaceValue(endEvent?.placeId, endEvent?.placeText);

    return `<div class="partner-relationship-start" data-partner-relationship-start>
        ${renderGenealogyDateField(`${prefix}StartDate`, definition.startLabel, startEvent?.date || emptyGenealogyDate('Exact date'), {
            inputId: `${prefix}StartDateInput`, typeId: `${prefix}StartDateType`, placeholder: 'e.g. 14 Feb 1915', defaultDateType: 'Exact date', className: 'full genealogy-date-inline-range'
        })}
        ${renderPlaceCombobox({ id: `${prefix}StartPlace`, label: definition.startPlaceLabel, value: startPlace, selectedPlaceId: startEvent?.placeId || '', addressValue: startEvent?.address || '', placeholder: 'e.g. Meowbridge, England', className: 'full', inputAttrs: 'data-partner-relationship-start-place' })}
      </div>
      <div class="partner-relationship-end" data-partner-relationship-end ${definition.hasEnd ? '' : 'hidden'}>
        ${renderGenealogyDateField(`${prefix}EndDate`, definition.endLabel || 'To', endEvent?.date || emptyGenealogyDate('Exact date'), {
            inputId: `${prefix}EndDateInput`, typeId: `${prefix}EndDateType`, placeholder: 'e.g. 12 Jun 2025', defaultDateType: 'Exact date', className: 'full genealogy-date-inline-range'
        })}
        ${renderPlaceCombobox({ id: `${prefix}EndPlace`, label: definition.endPlaceLabel || 'To place', value: endPlace, selectedPlaceId: endEvent?.placeId || '', addressValue: endEvent?.address || '', placeholder: 'e.g. Pawford, England', className: 'full', inputAttrs: 'data-partner-relationship-end-place' })}
      </div>`;
}

function relationshipBlockShouldShow(options = {}, editPerson = null)
{
    if (options.relativeType === 'partner') return true;
    if (options.mode === 'edit' && editPerson) return getPartnerRelationships(editPerson.id).length > 0;
    return false;
}

function renderAddPersonRelationshipCard({
    relationship = null,
    personId = '',
    partner = null,
    index = 0,
    mode = 'edit',
    initialType = 'Married',
    partnerChildrenMode = PARTNER_CHILDREN_ADD_PARENT
} = {})
{
    const relationshipType = relationship
        ? familyRelationshipType(relationship)
        : mode === 'addPartner'
            ? initialType
            : 'Partner';
    const partnerName = formatPersonFullName(partner) || (mode === 'addPartner' ? 'Selected person' : 'Unknown person');
    const fieldPrefix = `addPersonRelationship${index}`;
    const startEvent = partnerRelationshipStartEvent(relationship, relationshipType);
    const marriageType = startEvent?.typeLabel || 'Civil';
    const showMarriageType = addPersonRelationshipShowsMarriageType(relationshipType);
    const showPartnerUnlinkToast = Boolean(mode === 'edit' && relationship?.id && personId && partner?.id);

    return `<div class="add-person-relationship-card" data-add-person-relationship-card data-relationship-id="${escapeHtml(relationship?.id || '')}" data-partner-id="${escapeHtml(partner?.id || '')}" data-relationship-index="${index}">
        <div class="add-person-relationship-grid">
          <div class="field add-person-select-field add-person-relationship-type-field">
            <label for="${fieldPrefix}Type">Relationship type</label>
            <select class="compact-select add-person-select" id="${fieldPrefix}Type" data-add-person-relationship-type>
              ${addPersonRelationshipTypeOptions(relationshipType)}
            </select>
            <span class="add-person-select-chevron" aria-hidden="true">${icon.chevron}</span>
          </div>

          <div class="field add-person-relationship-partner-field">
            <label>Person</label>
            <div class="add-person-relationship-partner-shell">
              <div class="add-person-relationship-partner">
                ${renderPersonAvatar(
                    partner,
                    'small-avatar'
                )}
                <span>${escapeHtml(partnerName)}</span>
              </div>
              ${showPartnerUnlinkToast ? `
                <button
                  class="add-person-relationship-partner-unlink"
                  type="button"
                  aria-label="Unlink ${escapeHtml(partnerName)}"
                  data-add-person-unlink-partner
                  data-person-id="${escapeHtml(personId)}"
                  data-partner-id="${escapeHtml(partner?.id || '')}"
                  data-relationship-id="${escapeHtml(relationship?.id || '')}">
                  ${icon.unlink}
                </button>
              ` : ''}
            </div>
          </div>

          ${renderPartnerRelationshipDateFields({ prefix: fieldPrefix, relationshipType, family: relationship })}

          <div class="field add-person-select-field add-person-marriage-type-field" data-add-person-marriage-type-field ${showMarriageType ? '' : 'hidden'}>
            <label for="${fieldPrefix}MarriageType">Marriage type</label>
            <select class="compact-select add-person-select" id="${fieldPrefix}MarriageType" data-add-person-marriage-type>
              ${addPersonMarriageTypeOptions(marriageType)}
            </select>
            <span class="add-person-select-chevron" aria-hidden="true">${icon.chevron}</span>
          </div>
          ${mode === 'addPartner'
                ? renderPartnerChildrenSelector({
                    anchorPersonId: partner?.id || '',
                    relationshipType: 'partner',
                    selectedPersonId: '',
                    selectedValue: partnerChildrenMode,
                    controlId: 'addPersonPartnerChildrenMode'
                })
                : ''}
        </div>
      </div>`;
}

function renderAddPersonRelationshipBlock(options = {}, editPerson = null)
{
    const isPartnerMode = options.relativeType === 'partner';
    const anchorPerson = isPartnerMode ? getPerson(options.personId || state.selectedPersonId) : null;
    const relationships = editPerson ? getPartnerRelationships(editPerson.id) : [];
    const cards = isPartnerMode
        ? [
            renderAddPersonRelationshipCard({
                relationship: null,
                personId: '',
                partner: anchorPerson,
                index: 0,
                mode: 'addPartner',
                initialType: options.connectionDetailType || 'Married',
                partnerChildrenMode:
                normalizePartnerChildrenMode(
                    options.partnerChildrenMode
                )
            })
        ]
        : relationships.map((relationship, index) => renderAddPersonRelationshipCard({
            relationship,
            personId: editPerson?.id || '',
            partner: getRelationshipPartner(relationship, editPerson?.id),
            index,
            mode: 'edit'
        }));

    if (!cards.length) return '';

    return `<section class="add-person-relationship-section" data-add-person-relationship-section>
        <div class="add-person-relationship-panel">
          <button class="add-person-relationship-header" type="button" data-add-person-relationship-toggle aria-expanded="true">
            <span class="add-person-relationship-header-main">
              <span class="add-person-relationship-chevron" aria-hidden="true">${icon.chevron}</span>
              <span>Relationship</span>
            </span>
          </button>

          <div class="add-person-relationship-body" data-add-person-relationship-body>
            ${cards.join('')}
          </div>
        </div>
      </section>`;
}

function updatePartnerRelationshipFields(
    card,
    relationshipType
)
{
    const definition =
        partnerRelationshipDefinition(
            relationshipType
        );

    const start =
        card?.querySelector(
            '[data-partner-relationship-start]'
        );

    const end =
        card?.querySelector(
            '[data-partner-relationship-end]'
        );

    const marriageTypeField =
        card?.querySelector(
            [
                '[data-add-person-marriage-type-field]',
                '[data-relationship-edit-marriage-type]'
            ].join(', ')
        );

    const startDateLabel =
        start?.querySelector(
            '.genealogy-date-field > label'
        );

    const startPlaceLabel =
        start?.querySelector(
            '.place-combobox-field > label'
        );

    const endDateLabel =
        end?.querySelector(
            '.genealogy-date-field > label'
        );

    const endPlaceLabel =
        end?.querySelector(
            '.place-combobox-field > label'
        );

    if (startDateLabel)
    {
        startDateLabel.textContent =
            t(definition.startLabel);
    }

    if (startPlaceLabel)
    {
        startPlaceLabel.textContent =
            t(definition.startPlaceLabel);
    }

    if (endDateLabel)
    {
        endDateLabel.textContent =
            t(
                definition.endLabel
            || 'To'
            );
    }

    if (endPlaceLabel)
    {
        endPlaceLabel.textContent =
            t(
                definition.endPlaceLabel
            || 'To place'
            );
    }

    if (end)
    {
        end.hidden =
            !definition.hasEnd;
    }

    if (marriageTypeField)
    {
        marriageTypeField.hidden =
            !definition.showsMarriageType;
    }
}

function partnerRelationshipDateOrderIsValid(startDate, endDate)
{
    return !genealogyDateDefinitelyAfter(startDate, endDate);
}

function updateAddPersonPartnerChildrenLabel()
{
    const selector =
        modalBackdrop?.querySelector(
            '#addPersonPartnerChildrenMode'
        );

    if (!selector) return;

    const addParentOption =
        selector.querySelector(
            `option[value="${PARTNER_CHILDREN_ADD_PARENT}"]`
        );

    if (!addParentOption) return;

    const gender =
        modalBackdrop?.querySelector('#addPersonGender')?.value
        || 'Unknown';

    addParentOption.textContent = t(
        partnerChildrenAddLabel('', gender)
    );
}

function bindAddPersonRelationshipBlock()
{
    modalBackdrop?.querySelectorAll('[data-add-person-relationship-toggle]').forEach(button =>
    {
        if (button.dataset.relationshipToggleBound === 'true') return;
        button.dataset.relationshipToggleBound = 'true';

        const section = button.closest('[data-add-person-relationship-section]');
        const body = section?.querySelector('[data-add-person-relationship-body]');

        button.addEventListener('click', () =>
        {
            const isExpanded = button.getAttribute('aria-expanded') === 'true';
            button.setAttribute('aria-expanded', isExpanded ? 'false' : 'true');

            if (body)
            {
                body.hidden = isExpanded;
            }
            if (!isExpanded) scrollAddPersonSectionIntoView(section);
        });
    });
    modalBackdrop?.querySelectorAll('[data-add-person-relationship-type]').forEach(select =>
    {
        const card = select.closest('[data-add-person-relationship-card]');

        const updateRelationshipFields = () =>
        {
            updatePartnerRelationshipFields(card, select.value);
        };

        select.addEventListener('change', updateRelationshipFields);
        updateRelationshipFields();
    });

    const partnerChildrenSelector =
        modalBackdrop?.querySelector(
            '#addPersonPartnerChildrenMode'
        );

    const addPersonGender =
        modalBackdrop?.querySelector('#addPersonGender');

    if (
        partnerChildrenSelector
        && addPersonGender
        && addPersonGender.dataset.partnerChildrenLabelBound !== 'true'
    )
    {
        addPersonGender.dataset.partnerChildrenLabelBound = 'true';

        addPersonGender.addEventListener(
            'change',
            updateAddPersonPartnerChildrenLabel
        );
    }

    updateAddPersonPartnerChildrenLabel();

    modalBackdrop
        ?.querySelectorAll(
            '[data-add-person-unlink-partner]'
        )
        .forEach(button =>
        {
            if (
                button.dataset
                    .unlinkPartnerBound === 'true'
            )
            {
                return;
            }

            button.dataset
                .unlinkPartnerBound = 'true';

            button.addEventListener(
                'click',
                event =>
                {
                    event.preventDefault();
                    event.stopPropagation();

                    const personId =
                        button.dataset.personId
                || '';

                    const partnerId =
                        button.dataset.partnerId
                || '';

                    const familyId =
                        button.dataset.relationshipId
                || '';

                    if (
                        !personId
                || !partnerId
                || !familyId
                    )
                    {
                        showToast(
                            'Relationship information is missing.'
                        );

                        return;
                    }

                    const sidebarContext =
                        state.activeModule === 'People'
                            ? state.peopleView === 'profile'
                                ? 'profile'
                                : 'people'
                            : 'tree';

                    openUnlinkRelationshipModal({
                        kind: 'partner',
                        personId,
                        relatedPersonId:
                  partnerId,
                        familyId,
                        sidebarContext
                    });
                }
            );
        });
}

function collectAddPersonRelationshipBlock()
{
    const cards = Array.from(modalBackdrop?.querySelectorAll('[data-add-person-relationship-card]') || []);
    const relationships = [];

    for (const card of cards)
    {
        const index = card.dataset.relationshipIndex || '0';
        const relationshipType = card.querySelector('[data-add-person-relationship-type]')?.value || 'Married';
        const definition = partnerRelationshipDefinition(relationshipType);
        const marriageTypeSelect = card.querySelector('[data-add-person-marriage-type]');
        const marriageType = definition.showsMarriageType
            ? marriageTypeSelect?.value || 'Civil'
            : '';

        const prefix = `addPersonRelationship${index}`;
        const startDate = collectGenealogyDateField(`${prefix}StartDate`);
        const endDate = definition.hasEnd
            ? collectGenealogyDateField(`${prefix}EndDate`)
            : emptyGenealogyDate('Exact date');

        if (!startDate || (definition.hasEnd && !endDate))
        {
            return {
                invalid: true,
                message: 'Check the relationship dates before saving.'
            };
        }

        if (definition.hasEnd && !partnerRelationshipDateOrderIsValid(startDate, endDate))
        {
            return {
                invalid: true,
                message: 'The relationship end date must be after or equal to the start date.'
            };
        }

        relationships.push({
            relationshipId: card.dataset.relationshipId || '',
            partnerId: card.dataset.partnerId || '',
            relationshipType,
            marriageType,
            startDate,
            startPlace: readPlaceInputValue('[data-partner-relationship-start-place]', card),
            endDate,
            endPlace: definition.hasEnd
                ? readPlaceInputValue('[data-partner-relationship-end-place]', card)
                : { text: '', selectedPlaceId: '' }
        });
    }

    return {
        invalid: false,
        relationships
    };
}

function relationshipIdForPartners(personAId, personBId)
{
    const left = String(personAId || 'person-a').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '');
    const right = String(personBId || 'person-b').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '');
    return `rel-${left}-${right}-family`;
}

function upsertManagedRelationshipEvent(relationship, role, definition, dateInput, placeInput, marriageType, options, previous)
{
    relationship.events = Array.isArray(relationship.events) ? relationship.events : [];
    const isStart = role === 'start';
    const tag = isStart ? definition.startTag : definition.endTag;
    const eventType = isStart ? definition.startEventType : definition.endEventType;
    const managedTypeLabel = isStart ? definition.startTypeLabel : definition.endTypeLabel;
    const typeLabel = tag === 'MARR' ? marriageType : managedTypeLabel;
    const previousTag = isStart ? previous?.startTag : previous?.endTag;
    const previousLabel = isStart ? previous?.startTypeLabel : previous?.endTypeLabel;
    let event = relationship.events.find(item => item.relationshipManagedRole === role)
        || (previousTag && partnerRelationshipManagedEvent(relationship, previousTag, previousLabel))
        || ((isStart || !previous || previous.hasEnd)
            && partnerRelationshipManagedEvent(relationship, tag, managedTypeLabel));
    const date = normalizeGenealogyDateInput(dateInput || {}, 'Exact date');
    const resolvedPlace = (options.resolvePlace || resolvePlaceAssignment)(placeInput, event?.placeId || '');

    if (!event)
    {
        const idBase = `${relationship.id}-${role}`;
        let id = idBase;
        for (let suffix = 2; relationship.events.some(item => item.id === id); suffix++)
            id = `${idBase}-${suffix}`;
        event = createRelationshipEvent(tag, eventType, {
            id,
            typeLabel,
            date,
            placeId: resolvedPlace.placeId,
            placeText: resolvedPlace.placeText,
            address: resolvedPlace.address
        });
        event.relationshipManagedRole = role;
        relationship.events.push(event);
    }
    else
    {
        event.eventType = eventType;
        event.gedcomTag = tag;
        event.typeLabel = typeLabel;
        event.date = date;
        event.placeId = resolvedPlace.placeId;
        event.placeText = resolvedPlace.placeText;
        event.address = resolvedPlace.address;
        event.relationshipManagedRole = role;
    }

    return event;
}

function upsertPartnerRelationshipEvents(relationship, values, options = {})
{
    const relationshipType = ADD_PERSON_RELATIONSHIP_TYPES.includes(values.relationshipType)
        ? values.relationshipType
        : 'Unknown relationship';
    const definition = partnerRelationshipDefinition(relationshipType);
    const currentStart = partnerRelationshipStartEvent(relationship);
    const marriageType = definition.showsMarriageType
        ? values.marriageType || (currentStart?.gedcomTag === 'MARR' && currentStart.typeLabel) || 'Civil'
        : '';

    const previous = PARTNER_RELATIONSHIP_DEFINITIONS[relationship.relationshipType];
    relationship.relationshipType = relationshipType;
    relationship.relationshipStatus = definition.status;

    upsertManagedRelationshipEvent(relationship, 'start', definition, values.startDate, values.startPlace, marriageType, options, previous);

    if (definition.hasEnd)
    {
        upsertManagedRelationshipEvent(relationship, 'end', definition, values.endDate, values.endPlace, marriageType, options, previous);
    }
    else
    {
        // Keep historical end events available to their evidence links.
        for (const event of relationship.events)
            if (event.relationshipManagedRole === 'end') delete event.relationshipManagedRole;
    }
}

function savePersonRelationshipBlock(personId, collected)
{
    if (!collected || collected.invalid || !collected.relationships?.length) return;

    collected.relationships.forEach(values =>
    {
        const relationship = centralFamilyRecords().find(rel => rel.id === values.relationshipId && isFamilyRelationship(rel));
        if (!relationship) return;

        upsertPartnerRelationshipEvents(relationship, values);
        relationship.updatedAt = new Date().toISOString();
    });
}

function createPersonIdFromName(firstName, lastName)
{
    const base = [firstName, lastName].filter(Boolean).join('-').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'person';
    let id = base;
    let counter = 2;
    while (getPerson(id))
    {
        id = `${base}-${counter}`;
        counter += 1;
    }
    return id;
}

function createPersonFromAddPersonModal(options = {}, additionalFacts = {}, dates = {})
{
    const projectId = requireActiveProjectId();
    if (!projectId) return null;
    const enteredFirstName = readAddPersonModalValue('#addPersonFirstName');
    const firstName = enteredFirstName || 'Unknown';
    const lastName = readAddPersonModalValue('#addPersonLastName');
    const middleName = readAddPersonModalValue('#addPersonMiddleName');
    const maidenName = readAddPersonModalValue('#addPersonMaidenName');
    const id = createPersonIdFromName( firstName, lastName);
    const genderValue = readAddPersonModalValue('#addPersonGender');
    const livingStatus = normalizeLivingStatus(readAddPersonModalValue('#addPersonLivingStatus'));
    const birthDate = dates.birth;
    const deathDate = livingStatus === 'Deceased' ? dates.death : emptyGenealogyDate('Exact date');
    const birthPlace = resolvePlaceInputSelector('#addPersonBirthPlace');
    const deathPlace = livingStatus === 'Deceased'
        ? resolvePlaceInputSelector('#addPersonDeathPlace')
        : { placeId: null, placeText: '', address: '', created: false };
    const now =
        new Date().toISOString();
    const person = {
        id,
        projectId,
        createdAt: now,
        updatedAt: now,
        names: { first: firstName, middle: middleName, last: lastName, maiden: maidenName },
        gender: genderValue === 'Male' ? 'male' : genderValue === 'Female' ? 'female' : 'unknown',
        livingStatus,
        avatarClass: genderValue === 'Female' ? 'avatar-purple' : genderValue === 'Male' ? 'avatar-green' : '',
        birth: {
            ...birthDate,
            placeId: birthPlace.placeId,
            placeText: birthPlace.placeText,
            address: birthPlace.address
        },
        death: {
            ...deathDate,

            placeId:
            deathPlace.placeId,

            placeText:
            deathPlace.placeText,

            address:
            deathPlace.address,

            reason:
            '',

            cause:
            '',

            burialPlaceId:
            null,

            burialPlaceText:
            ''
        },
        profile: { alternativeNames: null },
        attributes: [],
        events: [],
        notes: [],
        citations: [],
        meta: { updated: 'Just now', sourceStatus: 'Unsourced' }
    };

    applyAddPersonAdditionalFacts(person, additionalFacts);
    sampleData.people.push(person);
    return person;
}

function createUnknownParent(childPersonId, role)
{
    const child = getPerson(childPersonId);
    const isMother = role === 'mother';
    const now = new Date().toISOString();
    const id = createPersonIdFromName(isMother ? 'unknown-mother' : 'unknown-father', childPersonId);
    const person = {
        id,
        projectId: child.projectId,
        createdAt: now,
        updatedAt: now,
        names: { first: '', middle: '', last: '', maiden: '' },
        gender: isMother ? 'female' : 'male',
        livingStatus: 'Unknown',
        avatarClass: isMother ? 'avatar-purple' : 'avatar-green',
        birth: emptyGenealogyDate('Exact date'),
        death: emptyGenealogyDate('Exact date'),
        profile: { alternativeNames: null },
        attributes: [],
        events: [],
        notes: [],
        citations: [],
        meta: { updated: 'Just now', sourceStatus: 'Unsourced',
            placeholderRole: isMother ? 'mother' : 'father' }
    };
    sampleData.people.push(person);
    return person;
}

function relationshipRoleHintForPerson(personId)
{
    const gender = String(getPerson(personId)?.gender || '').toLowerCase();

    if (gender === 'male') return 'HUSB';
    if (gender === 'female') return 'WIFE';

    return '';
}

function parentSlotPreference(personId)
{
    const gender = String(getPerson(personId)?.gender || '').toLowerCase();

    if (gender === 'female') return 'mother';
    return 'father';
}

function uniqueFamilyId(baseId)
{
    const cleanBase = String(baseId || 'family')
        .replace(/[^a-z0-9]+/gi, '-')
        .replace(/^-|-$/g, '') || 'family';

    let id = cleanBase;
    let counter = 2;

    while (centralFamilyRecords().some(family => family.id === id))
    {
        id = `${cleanBase}-${counter}`;
        counter += 1;
    }

    return id;
}

function personDisplayName(personId)
{
    return connectPersonName(getPerson(personId));
}

function parentIdsForPerson(personId)
{
    return getParents(personId)
        .map(parent => parent.id)
        .filter(Boolean);
}

function childIdsForPerson(personId)
{
    return getChildren(personId)
        .map(child => child.id)
        .filter(Boolean);
}

function collectAncestorIds(personId, visited = new Set())
{
    parentIdsForPerson(personId).forEach(parentId =>
    {
        if (!parentId || visited.has(parentId)) return;
        visited.add(parentId);
        collectAncestorIds(parentId, visited);
    });

    return visited;
}

function collectDescendantIds(personId, visited = new Set())
{
    childIdsForPerson(personId).forEach(childId =>
    {
        if (!childId || visited.has(childId)) return;
        visited.add(childId);
        collectDescendantIds(childId, visited);
    });

    return visited;
}

function hasParentChildRelationship(parentId, childId)
{
    return centralFamilyRecords().some(family =>
        (family.childIds || []).includes(childId)
          && familyIncludesPerson(family, parentId)
    );
}

function hasPartnerRelationship(personAId, personBId)
{
    return Boolean(getPartnerRelationshipBetween(personAId, personBId));
}

function validateParentChildConnection(parentId, childId)
{
    if (!parentId || !childId)
    {
        return {
            ok: false,
            title: 'Missing person',
            message: 'Select a person to connect.'
        };
    }

    const parent = getPerson(parentId);
    const child = getPerson(childId);
    if (!parent || !child || parent.projectId !== child.projectId || parent.projectId !== currentProjectId())
    {
        return {
            ok: false,
            title: 'Person not found',
            message: 'Person record not found.'
        };
    }

    if (parentId === childId)
    {
        return {
            ok: false,
            title: 'Invalid relationship',
            message: 'A person cannot be connected to themselves.'
        };
    }

    if (hasParentChildRelationship(parentId, childId))
    {
        return {
            ok: false,
            title: 'Already connected',
            message: connectRelativeText('{parent} is already connected as a parent of {child}.', { parent: personDisplayName(parentId), child: personDisplayName(childId) })
        };
    }

    if (collectDescendantIds(childId).has(parentId))
    {
        return {
            ok: false,
            title: 'Relationship loop',
            message: connectRelativeText('{parent} is already a descendant of {child}. Connecting them as a parent would create a cycle.', { parent: personDisplayName(parentId), child: personDisplayName(childId) })
        };
    }

    if (collectAncestorIds(parentId).has(childId))
    {
        return {
            ok: false,
            title: 'Relationship loop',
            message: connectRelativeText('{child} is already an ancestor of {parent}. Connecting them as a child would create a cycle.', { parent: personDisplayName(parentId), child: personDisplayName(childId) })
        };
    }

    return { ok: true };
}

function validatePartnerConnection(personAId, personBId)
{
    if (!personAId || !personBId)
    {
        return {
            ok: false,
            title: 'Missing person',
            message: 'Select a person to connect.'
        };
    }

    const personA = getPerson(personAId);
    const personB = getPerson(personBId);
    if (!personA || !personB || personA.projectId !== personB.projectId || personA.projectId !== currentProjectId())
    {
        return {
            ok: false,
            title: 'Person not found',
            message: 'Person record not found.'
        };
    }

    if (personAId === personBId)
    {
        return {
            ok: false,
            title: 'Invalid relationship',
            message: 'A person cannot be connected to themselves.'
        };
    }

    if (hasPartnerRelationship(personAId, personBId))
    {
        return {
            ok: false,
            title: 'Already connected',
            message: connectRelativeText('{first} and {second} are already connected as partners.', { first: personDisplayName(personAId), second: personDisplayName(personBId) })
        };
    }

    return { ok: true };
}

function parentWarningForConnection(parentId, childId)
{
    if (!parentId || !childId) return null;

    const existingParents = getParents(childId)
        .filter(parent => parent.id && parent.id !== parentId);

    if (!existingParents.length) return null;

    return {
        severity: 'warning',
        title: 'Warning!',
        message: connectRelativeText(existingParents.length === 1
            ? '{person} already has a recorded parent. The selected person will be connected as an additional parent.'
            : '{person} already has recorded parents. The selected person will be connected as an additional parent.', { person: personDisplayName(childId) })
    };
}

const SINGLE_PARENT_FAMILY_CHOICE = '__single_parent__';

function activeProjectFamiliesForPerson(personId)
{
    const person = getPerson(personId);
    const projectId = person?.projectId || currentProjectId();

    return centralFamilyRecords().filter(family =>
        family
          && family.projectId === projectId
          && family.relationshipStatus !== 'deleted'
    );
}

function partnerFamiliesForPerson(personId)
{
    return activeProjectFamiliesForPerson(personId)
        .filter(family => familyIncludesPerson(family, personId));
}

function parentFamiliesForPerson(personId)
{
    return activeProjectFamiliesForPerson(personId)
        .filter(family => unlinkFamilyChildrenIds(family).includes(personId));
}

function familyHasSecondPartner(family, personId)
{
    return Boolean(familyPartnerId(family, personId));
}

function parentFamilyDisplayLabel(family)
{
    const names = [
        familyPartnerAId(family),
        familyPartnerBId(family)
    ]
        .filter(Boolean)
        .map(personDisplayName)
        .map(translateText)
        .filter(Boolean);

    return names.length > 1
        ? `${names[0]} ${t('and')} ${names[1]}`
        : names[0] || 'Unknown family';
}

const UNKNOWN_FATHER_FAMILY_CHOICE = '__unknown_father__';
const UNKNOWN_MOTHER_FAMILY_CHOICE = '__unknown_mother__';
const UNKNOWN_PARENTS_FAMILY_CHOICE = '__unknown_parents__';
const UNKNOWN_SIBLING_PARENT_OPTIONS = Object.freeze([
    { value: UNKNOWN_FATHER_FAMILY_CHOICE, label: 'Create unknown father',
        help: 'An unknown father will be created for both siblings.', roles: ['father'] },
    { value: UNKNOWN_MOTHER_FAMILY_CHOICE, label: 'Create unknown mother',
        help: 'An unknown mother will be created for both siblings.', roles: ['mother'] },
    { value: UNKNOWN_PARENTS_FAMILY_CHOICE, label: 'Create unknown parents',
        help: 'Two unknown parents (father and mother) will be created for both siblings.', roles: ['father', 'mother'] }
]);

function unknownSiblingParentChoice(selection)
{
    return UNKNOWN_SIBLING_PARENT_OPTIONS.find(option => option.value === selection) || null;
}

function siblingParentSelectionHelp(selection)
{
    return t(unknownSiblingParentChoice(selection)?.help
        || 'The siblings will share the selected parent or parents.');
}

function updateSiblingParentSelectionHelp(select)
{
    const section = select?.closest('[data-parent-family-selector]');
    if (!section || section.dataset.parentFamilyType !== 'sibling') return;
    const help = section.querySelector('[data-parent-family-help]');
    if (help) help.textContent = siblingParentSelectionHelp(select.value);
}

function parentFamilyChoices(anchorPersonId, relationshipType, otherPersonId = '')
{
    const type = normalizeConnectRelationshipType(relationshipType);

    if (type === 'sibling')
    {
        const anchorParents = parentIdsForPerson(anchorPersonId);
        const otherParents = otherPersonId ? parentIdsForPerson(otherPersonId) : [];
        if (anchorParents.length && otherParents.length) return [];
        const sourcePersonId = anchorParents.length ? anchorPersonId : otherParents.length ? otherPersonId : '';
        if (!sourcePersonId)
            return UNKNOWN_SIBLING_PARENT_OPTIONS.map(option => ({
                value: option.value, label: t(option.label),
                family: null, parentIds: [], sourcePersonId: ''
            }));
        return parentFamiliesForPerson(sourcePersonId).flatMap(family =>
        {
            const parents = [familyPartnerAId(family), familyPartnerBId(family)].filter(Boolean);
            if (!parents.length) return [];
            return [
                ...(parents.length === 2 ? [{
                    value: family.id,
                    label: `${t('Both parents')} — ${parentFamilyDisplayLabel(family)}`,
                    family,
                    parentIds: parents,
                    sourcePersonId
                }] : []),
                ...parents.map(parentId => ({
                    value: `${family.id}::${parentId}`,
                    label: `${t('Only')} ${translateText(personDisplayName(parentId))}`,
                    family,
                    parentIds: [parentId],
                    sourcePersonId
                }))
            ];
        });
    }

    if (!['parent', 'child'].includes(type)) return [];

    // For Parent, the anchor is the child and the selected person is the parent.
    const parentId = type === 'parent' ? otherPersonId : anchorPersonId;
    if (!parentId || !getPerson(parentId)) return [];

    const existing = partnerFamiliesForPerson(parentId)
        .filter(family => familyHasSecondPartner(family, parentId))
        .map(family => ({
            value: family.id,
            label: type === 'parent'
                ? `${t('Both parents')} — ${parentFamilyDisplayLabel(family)}`
                : parentFamilyDisplayLabel(family),
            family
        }));

    return [
        ...existing,
        {
            value: SINGLE_PARENT_FAMILY_CHOICE,
            label: state.language === 'ru'
                ? `Только ${translateText(personDisplayName(parentId))}`
                : `${personDisplayName(parentId)} only`,
            family: null
        }
    ];
}

function defaultParentFamilySelection(
    anchorPersonId,
    relationshipType,
    preferredFamilyId = '',
    otherPersonId = ''
)
{
    const type = normalizeConnectRelationshipType(relationshipType);
    const choices = parentFamilyChoices(anchorPersonId, type, otherPersonId);
    const preferred = String(preferredFamilyId || '');

    if (choices.some(choice => choice.value === preferred))
    {
        return preferred;
    }

    if (type === 'sibling')
    {
        if (choices.some(choice => unknownSiblingParentChoice(choice.value)))
            return UNKNOWN_FATHER_FAMILY_CHOICE;
        if (choices.length === 1) return choices[0].value;
        const families = new Set(choices.map(choice => choice.family.id));
        return families.size === 1 ? choices[0].value : '';
    }

    const partnerChoices = choices.filter(choice =>
        choice.value !== SINGLE_PARENT_FAMILY_CHOICE
    );

    // Default to both parents only when the eligible partner family is unique.
    // With multiple families, require the researcher to choose explicitly.
    if (type === 'parent') return partnerChoices.length === 1
        ? partnerChoices[0].value
        : partnerChoices.length ? '' : choices[0]?.value || '';

    if (partnerChoices.length === 1)
    {
        return partnerChoices[0].value;
    }

    if (!partnerChoices.length)
    {
        return SINGLE_PARENT_FAMILY_CHOICE;
    }

    return '';
}

function validateParentFamilySelection({
    anchorPersonId,
    relationshipType,
    selection,
    otherPersonId = ''
} = {})
{
    const type = normalizeConnectRelationshipType(relationshipType);

    if (!['parent', 'child', 'sibling'].includes(type))
    {
        return { ok: true };
    }

    const choices = parentFamilyChoices(anchorPersonId, type, otherPersonId);
    const selected = String(selection || '');

    if (!selected)
    {
        return {
            ok: false,
            title: 'Select a parent family',
            message: type === 'sibling'
                ? 'Choose the parent family the siblings share.'
                : type === 'parent'
                    ? 'Choose whether to connect this parent alone or with a partner.'
                    : 'Choose the family this child will be added to.'
        };
    }

    if (!choices.some(choice => choice.value === selected))
    {
        return {
            ok: false,
            title: 'Parent family unavailable',
            message: type === 'sibling'
                ? 'The selected parents are no longer available. Choose another option.'
                : 'The selected parent family is no longer available.'
        };
    }

    return { ok: true };
}

function renderParentFamilySelector({
    anchorPersonId,
    relationshipType,
    otherPersonId = '',
    selectedValue = '',
    controlId = 'addPersonParentFamily',
    showSelectionLabel = true,
    showHeading = true
} = {})
{
    const type =
        normalizeConnectRelationshipType(
            relationshipType
        );

    if (!['parent', 'child', 'sibling'].includes(type))
    {
        return '';
    }

    const choices =
        parentFamilyChoices(
            anchorPersonId,
            type,
            otherPersonId
        );

    const selected =
        selectedValue
        || defaultParentFamilySelection(
            anchorPersonId,
            type,
            '',
            otherPersonId
        );

    const isSibling =
        type === 'sibling';

    const headingId =
        `${controlId}Heading`;

    const selectionLabel = showHeading
        ? t(isSibling ? 'Shared parent(s)' : 'Parents')
        : t(isSibling ? 'Shared parents' : 'Parents');

    return `
        <section
          class="add-person-parent-family"
          data-parent-family-selector
          data-parent-family-type="${type}">

          ${showHeading ? `<h3
            class="form-section-title"
            id="${escapeHtml(headingId)}">
            ${escapeHtml(isSibling ? t('Shared parent(s)') : t('Parents'))}
          </h3>` : ''}

          <div class="field">
            ${
                showSelectionLabel
                    ? `
                  <label for="${escapeHtml(controlId)}">
                    ${selectionLabel}
                  </label>
                `
                    : ''
            }

            <div class="add-person-select-field">
              <select
                class="compact-select add-person-select"
                id="${escapeHtml(controlId)}"
                data-parent-family-selection
                ${
                    showSelectionLabel
                        ? ''
                        : `aria-labelledby="${escapeHtml(headingId)}"`
                }
                ${choices.length ? '' : 'disabled'}>

                ${
                    selected
                        ? ''
                        : `<option value="">${escapeHtml(t(isSibling ? 'Choose shared parents' : 'Choose parents'))}</option>`
                }

                ${
                    choices.length
                        ? choices
                            .map(choice => `
                          <option
                            value="${escapeHtml(choice.value)}"
                            ${
                                choice.value === selected
                                    ? 'selected'
                                    : ''
                            }>
                            ${escapeHtml(choice.label)}
                          </option>
                        `)
                            .join('')
                        : `
                        <option value="">
                          No parent family available
                        </option>
                      `
                }
              </select>

              <span
                class="add-person-select-chevron"
                aria-hidden="true">
                ${icon.chevron}
              </span>
              ${showHeading ? '' : '<span class="add-person-family-error" data-add-person-family-error hidden></span>'}
            </div>

            <span class="field-help" data-parent-family-help>
              ${isSibling
                ? escapeHtml(siblingParentSelectionHelp(selected))
                : escapeHtml(t(!selected
                    ? type === 'parent'
                        ? 'Choose whether to connect this parent alone or with a partner.'
                        : 'Choose who will be recorded as this child’s parents.'
                    : selected === SINGLE_PARENT_FAMILY_CHOICE
                        ? 'Only the selected person will be recorded as a parent.'
                        : 'Both people in the selected family will be recorded as parents of this child.'))}
            </span>
          </div>
        </section>
      `;
}

const PARTNER_CHILDREN_ADD_PARENT = 'add-parent';
const PARTNER_CHILDREN_KEEP_SINGLE = 'keep-single-parent';

function normalizePartnerChildrenMode(value)
{
    return value === PARTNER_CHILDREN_KEEP_SINGLE
        ? PARTNER_CHILDREN_KEEP_SINGLE
        : PARTNER_CHILDREN_ADD_PARENT;
}

function singleParentFamilyWithChildrenForPerson(personId)
{
    const matches = partnerFamiliesForPerson(personId).filter(family =>
        !familyHasSecondPartner(family, personId)
        && unlinkFamilyChildrenIds(family).length > 0
    );
    return matches.length === 1 ? matches[0] : null;
}

function partnerChildrenParentRole(personId)
{
    const gender = String(getPerson(personId)?.gender || '').toLowerCase();

    if (gender === 'male') return 'father';
    if (gender === 'female') return 'mother';

    return 'parent';
}

function partnerChildrenAddLabel(
    selectedPersonId = '',
    genderValue = ''
)
{
    const normalizedGender =
        String(genderValue || '').trim().toLowerCase();

    const role = selectedPersonId
        ? partnerChildrenParentRole(selectedPersonId)
        : normalizedGender === 'male'
            ? 'father'
            : normalizedGender === 'female'
                ? 'mother'
                : 'parent';

    if (role === 'father')
    {
        return 'Add new partner as the children\'s father';
    }

    if (role === 'mother')
    {
        return 'Add new partner as the children\'s mother';
    }

    return 'Add new partner as the children\'s parent';
}

function renderPartnerChildrenSelector({
    anchorPersonId,
    relationshipType,
    selectedPersonId = '',
    selectedValue = PARTNER_CHILDREN_ADD_PARENT,
    controlId = 'connectPersonPartnerChildrenMode'
} = {})
{
    const type = normalizeConnectRelationshipType(relationshipType);
    const singleParentFamily =
        singleParentFamilyWithChildrenForPerson(anchorPersonId);

    if (type !== 'partner' || !singleParentFamily)
    {
        return '';
    }

    const selectedMode =
        normalizePartnerChildrenMode(selectedValue);

    const addParentLabel =
        partnerChildrenAddLabel(selectedPersonId);

    return `<div class="connect-partner-children-selector" data-partner-children-selector>
        <div class="field">
          <label for="${escapeHtml(controlId)}">${escapeHtml(t('Existing children'))}</label>

          <div class="add-person-select-field">
            <select
              class="compact-select add-person-select"
              id="${escapeHtml(controlId)}"
              data-partner-children-mode>
              <option
                value="${PARTNER_CHILDREN_ADD_PARENT}"
                ${selectedMode === PARTNER_CHILDREN_ADD_PARENT ? 'selected' : ''}>
                ${escapeHtml(t(addParentLabel))}
              </option>

              <option
                value="${PARTNER_CHILDREN_KEEP_SINGLE}"
                ${selectedMode === PARTNER_CHILDREN_KEEP_SINGLE ? 'selected' : ''}>
                ${escapeHtml(t('Keep the children with the single parent only'))}
              </option>
            </select>

            <span class="add-person-select-chevron" aria-hidden="true">
              ${icon.chevron}
            </span>
          </div>

          <span class="field-help">
            ${escapeHtml(t('Choose whether the new partner becomes a parent of the existing children.'))}
          </span>
        </div>
      </div>`;
}

function connectionPairForRelationship(anchorPersonId, relativePersonId, relationshipType)
{
    const anchorId = String(anchorPersonId || '');
    const relativeId = String(relativePersonId || '');
    const type = normalizeConnectRelationshipType(relationshipType);

    if (type === 'parent')
    {
        return {
            type,
            parentId: relativeId,
            childId: anchorId
        };
    }

    if (type === 'child')
    {
        return {
            type,
            parentId: anchorId,
            childId: relativeId
        };
    }

    if (type === 'sibling')
    {
        return {
            type,
            anchorPersonId: anchorId,
            siblingPersonId: relativeId
        };
    }

    return {
        type,
        personAId: anchorId,
        personBId: relativeId
    };
}

function validateRelationshipConnection({
    anchorPersonId,
    relativePersonId,
    relationshipType,
    parentFamilySelection = '',
    detailType = 'Biological'
} = {})
{
    const pair = connectionPairForRelationship(anchorPersonId, relativePersonId, relationshipType);

    if (pair.type === 'parent' || pair.type === 'child')
    {
        const parentChildValidation = validateParentChildConnection(pair.parentId, pair.childId);
        if (!parentChildValidation.ok) return parentChildValidation;
        if (detailType === 'Biological' && biologicalParentConflict(pair.parentId, pair.childId))
        {
            return { ok: false, title: t('Biological parent unavailable'),
                message: t('This person already has two biological parents or a biological parent of the same gender. Choose another relationship type.') };
        }

        // The newly created parent in Add Person has no existing family
        // selection. Existing-person Connect always provides a choice.
        if (pair.type === 'parent' && !parentFamilySelection)
            return parentChildValidation;

        const selectionValidation = validateParentFamilySelection({
            anchorPersonId: pair.type === 'parent' ? pair.childId : pair.parentId,
            relationshipType: pair.type,
            selection: parentFamilySelection,
            otherPersonId: pair.type === 'parent' ? pair.parentId : ''
        });
        if (!selectionValidation.ok) return selectionValidation;

        if (parentFamilySelection !== SINGLE_PARENT_FAMILY_CHOICE)
        {
            const choice = parentFamilyChoices(pair.parentId, 'child')
                .find(item => item.value === parentFamilySelection);
            const otherParentId = choice?.family
                ? familyPartnerId(choice.family, pair.parentId) : '';
            if (otherParentId)
            {
                // Prevent duplicate links and ancestry cycles through the
                // additionally selected parent before mutating any family.
                const otherValidation = validateParentChildConnection(otherParentId, pair.childId);
                if (!otherValidation.ok) return otherValidation;
                if (detailType === 'Biological'
                    && (biologicalParentConflict(pair.parentId, pair.childId, [otherParentId])
                        || biologicalParentConflict(otherParentId, pair.childId, [pair.parentId])))
                {
                    return { ok: false, title: t('Biological parent unavailable'),
                        message: t('This child cannot have another biological parent in the selected family. Choose another relationship type or family.') };
                }
            }
        }

        return parentChildValidation;
    }

    if (pair.type === 'sibling')
    {
        return validateSiblingConnection(
            pair.anchorPersonId,
            pair.siblingPersonId,
            parentFamilySelection,
            detailType
        );
    }

    return validatePartnerConnection(pair.personAId, pair.personBId);
}

function relationshipWarningForConnection({ anchorPersonId, relativePersonId, relationshipType } = {})
{
    const pair = connectionPairForRelationship(anchorPersonId, relativePersonId, relationshipType);

    if (pair.type === 'parent' || pair.type === 'child')
    {
        return parentWarningForConnection(pair.parentId, pair.childId);
    }

    return null;
}

function familyCanAcceptParent(family, parentId)
{
    if (!family) return false;
    if (familyIncludesPerson(family, parentId)) return true;

    const preferredSlot = parentSlotPreference(parentId);

    if (preferredSlot === 'mother' && !familyPartnerBId(family)) return true;
    if (preferredSlot === 'father' && !familyPartnerAId(family)) return true;

    return !familyPartnerAId(family) || !familyPartnerBId(family);
}

function assignParentToFamily(family, parentId)
{
    if (!family || !parentId) return false;
    if (familyIncludesPerson(family, parentId)) return true;

    const preferredSlot = parentSlotPreference(parentId);
    const roleHint = relationshipRoleHintForPerson(parentId);

    if (preferredSlot === 'mother' && !familyPartnerBId(family))
    {
        family.partnerBId = parentId;


        family.partnerBRoleHint = roleHint || 'WIFE';
        return true;
    }

    if (preferredSlot === 'father' && !familyPartnerAId(family))
    {
        family.partnerAId = parentId;


        family.partnerARoleHint = roleHint || 'HUSB';
        return true;
    }

    if (!familyPartnerAId(family))
    {
        family.partnerAId = parentId;


        family.partnerARoleHint = roleHint;
        return true;
    }

    if (!familyPartnerBId(family))
    {
        family.partnerBId = parentId;


        family.partnerBRoleHint = roleHint;
        return true;
    }

    return false;
}

function createParentChildFamily(parentId, childId)
{
    const parent = getPerson(parentId);
    const child = getPerson(childId);
    const projectId = child?.projectId || parent?.projectId || currentProjectId();

    const family = {
        id: uniqueFamilyId(`fam-${parentId}-${childId}-parent`),
        projectId,
        type: 'family',
        partnerAId: '',
        partnerBId: '',
        partnerARoleHint: '',
        partnerBRoleHint: '',
        relationshipType: 'Unknown relationship',
        relationshipStatus: 'active',
        childIds: [childId],
        events: [],
        attributes: [],
        notes: [],
        citations: [],
        mediaIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    assignParentToFamily(family, parentId);
    centralFamilyRecords().push(family);

    return family;
}

function findOrCreateSingleParentFamily(parentId)
{
    const matches = partnerFamiliesForPerson(parentId).filter(family =>
        !familyHasSecondPartner(family, parentId)
    );
    if (matches.length === 1) return matches[0];

    const parent = getPerson(parentId);
    const family = {
        id: uniqueFamilyId(`fam-${parentId}-single-parent`),
        projectId: parent?.projectId || currentProjectId(),
        type: 'family',
        partnerAId: '',
        partnerBId: '',
        partnerARoleHint: '',
        partnerBRoleHint: '',
        relationshipType: 'Unknown relationship',
        relationshipStatus: 'active',
        childIds: [],
        events: [],
        attributes: [],
        notes: [],
        citations: [],
        mediaIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    assignParentToFamily(family, parentId);
    centralFamilyRecords().push(family);
    return family;
}

function addChildToFamily(family, parentId, childId)
{
    if (!family || !familyIncludesPerson(family, parentId))
    {
        return {
            ok: false,
            title: 'Parent family unavailable',
            message: 'The selected person is not a parent in this family.'
        };
    }

    const existingChildren = unlinkFamilyChildrenIds(family);

    if (existingChildren.includes(childId))
    {
        return {
            ok: true,
            family,
            relationshipType: 'parentChild',
            warning: null,
            reused: true
        };
    }

    const validation = validateParentChildConnection(parentId, childId);
    if (!validation.ok) return validation;

    unlinkSetFamilyChildren(family, [...existingChildren, childId]);
    family.updatedAt = new Date().toISOString();

    return {
        ok: true,
        family,
        relationshipType: 'parentChild',
        warning: parentWarningForConnection(parentId, childId)
    };
}

function connectChildToParentFamily(parentId, childId, selection, relationshipType = 'child')
{
    const familySelection = String(selection || '');
    const selectionValidation = validateParentFamilySelection({
        anchorPersonId: relationshipType === 'parent' ? childId : parentId,
        relationshipType,
        selection: familySelection,
        otherPersonId: relationshipType === 'parent' ? parentId : ''
    });

    if (!selectionValidation.ok) return selectionValidation;

    const family = familySelection === SINGLE_PARENT_FAMILY_CHOICE
        ? findOrCreateSingleParentFamily(parentId)
        : centralFamilyRecords().find(candidate => candidate.id === familySelection);

    return addChildToFamily(family, parentId, childId);
}

function validateSiblingConnection(anchorPersonId, siblingPersonId, familyId, detailType = 'Biological')
{
    if (!anchorPersonId || !siblingPersonId || anchorPersonId === siblingPersonId)
    {
        return {
            ok: false,
            title: 'Invalid relationship',
            message: 'A person cannot be connected as their own sibling.'
        };
    }

    const anchor = getPerson(anchorPersonId);
    const sibling = getPerson(siblingPersonId);
    if (!anchor || !sibling || anchor.projectId !== sibling.projectId
        || anchor.projectId !== currentProjectId())
        return { ok: false, title: 'Person not found', message: 'Person record not found.' };

    if (collectAncestorIds(anchorPersonId).has(siblingPersonId)
        || collectDescendantIds(anchorPersonId).has(siblingPersonId))
        return { ok: false, title: 'Relationship loop',
            message: 'An ancestor or descendant cannot also be added as a sibling.' };

    const anchorParents = parentIdsForPerson(anchorPersonId);
    const siblingParents = parentIdsForPerson(siblingPersonId);
    if (anchorParents.length && siblingParents.length)
    {
        if (anchorParents.some(id => siblingParents.includes(id)))
            return { ok: false, title: 'Already connected',
                message: 'These people already share a recorded parent.' };
        return { ok: false, title: 'Different parents',
            message: 'Both people have different recorded parents. Review their parents before connecting them as siblings.' };
    }

    const selectionValidation = validateParentFamilySelection({
        anchorPersonId,
        relationshipType: 'sibling',
        selection: familyId,
        otherPersonId: siblingPersonId
    });

    if (!selectionValidation.ok) return selectionValidation;

    const choice = parentFamilyChoices(anchorPersonId, 'sibling', siblingPersonId)
        .find(candidate => candidate.value === familyId);
    const unknownParentChoice = unknownSiblingParentChoice(choice?.value);
    if (unknownParentChoice)
        return { ok: true, unknownParentRoles: unknownParentChoice.roles, choice };
    const family = choice?.family;
    const sourcePersonId = choice?.sourcePersonId;
    const targetPersonId = sourcePersonId === anchorPersonId ? siblingPersonId : anchorPersonId;
    if (!family || !unlinkFamilyChildrenIds(family).includes(sourcePersonId))
    {
        return {
            ok: false,
            title: 'Parent family unavailable',
            message: 'The selected parent family does not contain the reference person.'
        };
    }

    if (choice.parentIds.every(parentId => hasParentChildRelationship(parentId, targetPersonId)))
    {
        return {
            ok: false,
            title: 'Already connected',
            message: connectRelativeText('{first} and {second} are already siblings in this family.', { first: personDisplayName(anchorPersonId), second: personDisplayName(siblingPersonId) })
        };
    }

    for (const parentId of choice.parentIds.filter(id => !hasParentChildRelationship(id, targetPersonId)))
    {
        const validation = validateParentChildConnection(parentId, targetPersonId);
        if (!validation.ok) return validation;
        if (detailType === 'Biological' && biologicalParentConflict(parentId, targetPersonId,
            choice.parentIds.filter(id => id !== parentId && !hasParentChildRelationship(id, targetPersonId))))
            return { ok: false, title: t('Biological parent unavailable'),
                message: t('This person already has two biological parents or a biological parent of the same gender. Choose another relationship type.') };
    }

    return { ok: true, family, choice, sourcePersonId, targetPersonId };
}

function connectSiblingsThroughFamily(anchorPersonId, siblingPersonId, familyId, detailType = 'Biological')
{
    const validation = validateSiblingConnection(
        anchorPersonId,
        siblingPersonId,
        familyId,
        detailType
    );

    if (!validation.ok) return validation;

    if (validation.unknownParentRoles)
    {
        const parents = validation.unknownParentRoles.map(role =>
            createUnknownParent(anchorPersonId, role));
        const family = createParentChildFamily(parents[0].id, anchorPersonId);
        parents.slice(1).forEach(parent => assignParentToFamily(family, parent.id));
        unlinkSetFamilyChildren(family, [anchorPersonId, siblingPersonId]);
        parents.forEach(parent =>
        {
            setParentChildRelationshipType(family, parent.id, anchorPersonId, detailType);
            setParentChildRelationshipType(family, parent.id, siblingPersonId, detailType);
        });
        return { ok: true, family, relationshipType: 'sibling', warning: null };
    }

    const { sourcePersonId, targetPersonId } = validation;
    const [selectedParentId] = validation.choice.parentIds;
    const isolateParent = validation.choice.parentIds.length === 1
        && familyHasSecondPartner(validation.family, selectedParentId);
    const family = isolateParent
        ? createParentChildFamily(selectedParentId, sourcePersonId)
        : validation.family;
    if (validation.choice.parentIds.length === 1)
    {
        const parentId = validation.choice.parentIds[0];
        const sourceType = parentChildRelationshipType(validation.family, parentId, sourcePersonId);
        unlinkSetFamilyChildren(family, [...unlinkFamilyChildrenIds(family), sourcePersonId]);
        if (!Object.hasOwn(family.parentChildTypes || {}, parentChildRelationshipKey(parentId, sourcePersonId)))
            setParentChildRelationshipType(family, parentId, sourcePersonId, sourceType);
    }
    unlinkSetFamilyChildren(family, [
        ...unlinkFamilyChildrenIds(family),
        targetPersonId
    ]);
    validation.choice.parentIds.forEach(parentId =>
    {
        setParentChildRelationshipType(family, parentId, targetPersonId, detailType);
    });
    family.updatedAt = new Date().toISOString();

    return {
        ok: true,
        family,
        relationshipType: 'sibling',
        warning: null
    };
}

function connectParentToChild(parentId, childId)
{
    const validation = validateParentChildConnection(parentId, childId);

    if (!validation.ok)
    {
        return validation;
    }

    const warning = parentWarningForConnection(parentId, childId);

    const matches = centralFamilyRecords().filter(candidate =>
        candidate.projectId === currentProjectId() && candidate.childIds.includes(childId) && familyCanAcceptParent(candidate, parentId)
    );
    let family = matches.length === 1 ? matches[0] : null;

    if (!family)
    {
        family = createParentChildFamily(parentId, childId);
    }
    else
    {
        family.childIds = [...new Set([...(family.childIds || []), childId])];

        assignParentToFamily(family, parentId);
        family.updatedAt = new Date().toISOString();
    }

    return {
        ok: true,
        family,
        relationshipType: 'parentChild',
        warning
    };
}

function getPartnerRelationshipBetween(personAId, personBId)
{
    return centralFamilyRecords().find(family =>
    {
        const a = familyPartnerAId(family);
        const b = familyPartnerBId(family);

        return (a === personAId && b === personBId) || (a === personBId && b === personAId);
    }) || null;
}

function connectPartners(personAId, personBId, options = {})
{
    const validation =
        validatePartnerConnection(personAId, personBId);

    if (!validation.ok)
    {
        return validation;
    }

    const personA = getPerson(personAId);
    const personB = getPerson(personBId);

    const existingChildrenFamilyId =
        String(options.existingChildrenFamilyId || '');

    const existingChildrenFamily = existingChildrenFamilyId
        ? centralFamilyRecords().find(family =>
            family.id === existingChildrenFamilyId && family.projectId === personA.projectId
              && familyIncludesPerson(family, personAId)
              && !familyHasSecondPartner(family, personAId)
              && unlinkFamilyChildrenIds(family).length > 0
        )
        : null;

    if (existingChildrenFamilyId && !existingChildrenFamily)
        return { ok: false, title: 'Family not found', message: 'The selected family is no longer available.' };

    if (existingChildrenFamily)
    {
        const assigned =
            assignParentToFamily(existingChildrenFamily, personBId);

        if (!assigned)
        {
            return {
                ok: false,
                title: 'Family cannot accept another parent',
                message: 'The selected family already has two recorded parents.'
            };
        }

        existingChildrenFamily.updatedAt = new Date().toISOString();


        return {
            ok: true,
            family: existingChildrenFamily,
            relationshipType: 'partner',
            warning: null,
            reused: true,
            inheritedChildren: true
        };
    }

    const id =
        uniqueFamilyId(
            relationshipIdForPartners(personAId, personBId)
        );

    const family = {
        id,
        projectId:
          personA.projectId
          || personB.projectId
          || currentProjectId(),
        type: 'family',
        gedcomXref:
          `@F${id.replace(/[^a-z0-9]/gi, '').toUpperCase()}@`,
        partnerAId: personAId,
        partnerBId: personBId,
        partnerARoleHint:
          relationshipRoleHintForPerson(personAId),
        partnerBRoleHint:
          relationshipRoleHintForPerson(personBId),
        relationshipType: 'Married',
        relationshipStatus: 'active',
        childIds: [],
        events: [],
        attributes: [],
        notes: [],
        citations: [],
        mediaIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    centralFamilyRecords().push(family);

    return {
        ok: true,
        family,
        relationshipType: 'partner',
        warning: null
    };
}

function connectPeopleByRelationship({
    anchorPersonId,
    relativePersonId,
    relationshipType,
    parentFamilySelection = '',
    detailType = '',
    partnerChildrenMode = PARTNER_CHILDREN_ADD_PARENT
} = {})
{
    const anchorId = String(anchorPersonId || '');
    const relativeId = String(relativePersonId || '');
    const type =
        normalizeConnectRelationshipType(relationshipType);

    const normalizedPartnerChildrenMode =
        normalizePartnerChildrenMode(partnerChildrenMode);
    const effectiveDetailType = type === 'partner'
        ? ADD_PERSON_RELATIONSHIP_TYPES.includes(detailType) ? detailType : 'Married'
        : PARENT_CHILD_RELATIONSHIP_TYPES.includes(detailType) ? detailType : 'Biological';

    const validation = validateRelationshipConnection({
        anchorPersonId: anchorId,
        relativePersonId: relativeId,
        relationshipType: type,
        parentFamilySelection,
        detailType: effectiveDetailType
    });

    if (!validation.ok)
    {
        return validation;
    }

    let result;

    if (type === 'parent')
    {
        result = parentFamilySelection
            ? connectChildToParentFamily(relativeId, anchorId, parentFamilySelection, 'parent')
            : connectParentToChild(relativeId, anchorId);
    }
    else if (type === 'child')
    {
        result = connectChildToParentFamily(
            anchorId,
            relativeId,
            parentFamilySelection
        );
    }
    else if (type === 'sibling')
    {
        result = connectSiblingsThroughFamily(
            anchorId,
            relativeId,
            parentFamilySelection,
            effectiveDetailType
        );
    }
    else
    {
        const existingChildrenFamily =
            normalizedPartnerChildrenMode ===
            PARTNER_CHILDREN_ADD_PARENT
                ? singleParentFamilyWithChildrenForPerson(anchorId)
                : null;

        result = connectPartners(
            anchorId,
            relativeId,
            {
                existingChildrenFamilyId:
              existingChildrenFamily?.id || ''
            }
        );
    }

    if (!result.ok) return result;

    if (type === 'parent' || type === 'child')
    {
        const parentId = type === 'parent' ? relativeId : anchorId;
        const childId = type === 'parent' ? anchorId : relativeId;
        [parentId, ...(parentFamilySelection ? [familyPartnerId(result.family, parentId)] : [])]
            .filter(Boolean).forEach(id =>
            {
                const key = parentChildRelationshipKey(id, childId);
                if (!Object.hasOwn(result.family.parentChildTypes || {}, key))
                {
                    setParentChildRelationshipType(result.family, id, childId,
                        id === parentId ? effectiveDetailType : 'Unknown parentage');
                }
            });
    }
    if (type === 'partner')
    {
        result.family.relationshipType = effectiveDetailType;
        result.family.relationshipStatus = partnerRelationshipDefinition(effectiveDetailType).status;
        if (result.inheritedChildren)
        {
            unlinkFamilyChildrenIds(result.family).forEach(childId =>
            {
                const key = parentChildRelationshipKey(relativeId, childId);
                if (!Object.hasOwn(result.family.parentChildTypes || {}, key))
                    setParentChildRelationshipType(result.family, relativeId, childId,
                        'Unknown parentage');
            });
        }
    }

    rebuildSampleEventsAndPruneSourceLinks();
    markPrototypeSessionEdited();

    return {
        ...result,
        anchorPersonId: anchorId,
        relativePersonId: relativeId,
        connectType: type,
        partnerChildrenMode:
          type === 'partner'
              ? normalizedPartnerChildrenMode
              : ''
    };
}

function addPersonConnectionTypeFromRelativeType(relativeType)
{
    const value = String(relativeType || '').toLowerCase();

    if (['father', 'mother', 'parent'].includes(value)) return 'parent';
    if (['son', 'daughter', 'child'].includes(value)) return 'child';
    if (['brother', 'sister', 'sibling'].includes(value)) return 'sibling';
    if (['partner', 'spouse'].includes(value)) return 'partner';

    return '';
}

function addPersonCreateConnectionIntent(options = {})
{
    const relationshipType = addPersonConnectionTypeFromRelativeType(
        options.connectRelationshipType || options.relativeType
    );

    const anchorPersonId = String(
        options.connectToPersonId
          || options.anchorPersonId
          || options.personId
          || ''
    );

    return {
        shouldConnect: Boolean(options.mode !== 'edit' && relationshipType && anchorPersonId),
        anchorPersonId,
        relationshipType
    };
}

function addPersonPartnerChildrenMode(options = {})
{
    const liveValue =
        modalBackdrop
            ?.querySelector('#addPersonPartnerChildrenMode')
            ?.value;

    return normalizePartnerChildrenMode(
        liveValue || options.partnerChildrenMode
    );
}

function addPersonConnectionDetailType(options = {})
{
    const intent = addPersonCreateConnectionIntent(options);
    if (intent.relationshipType === 'partner')
        return modalBackdrop?.querySelector('[data-add-person-relationship-type]')?.value
            || options.connectionDetailType || 'Married';
    return modalBackdrop?.querySelector('#addPersonConnectionDetailType')?.value
        || options.connectionDetailType || 'Biological';
}

function newPersonBiologicalConflict(intent, selection, gender)
{
    if (intent.relationshipType === 'parent')
        return biologicalParentConflict('', intent.anchorPersonId, [], gender);
    const choices = parentFamilyChoices(intent.anchorPersonId, intent.relationshipType);
    const choice = choices.find(item => item.value === selection);
    const parentIds = intent.relationshipType === 'child'
        ? [intent.anchorPersonId, familyPartnerId(choice?.family, intent.anchorPersonId)].filter(Boolean)
        : choice?.parentIds || [];
    return parentIds.some(parentId => biologicalParentConflict(parentId, '',
        parentIds.filter(id => id !== parentId)));
}

function addPersonParentFamilySelection(options = {})
{
    const intent = addPersonCreateConnectionIntent(options);
    if (!['child', 'sibling'].includes(intent.relationshipType)) return '';

    return modalBackdrop
        ?.querySelector('#addPersonParentFamily')
        ?.value
        || defaultParentFamilySelection(
            intent.anchorPersonId,
            intent.relationshipType,
            options.parentFamilyId
            || options.parentFamilySelection
            || ''
        );
}

function addPersonConnectionToastLabel(relationshipType)
{
    const map = {
        parent: 'parent',
        child: 'child',
        sibling: 'sibling',
        partner: 'partner'
    };

    return map[relationshipType] || 'relative';
}

function createdPersonConnectionToast(relationshipType)
{
    const messages = {
        parent: 'Person created and connected as parent.',
        child: 'Person created and connected as child.',
        sibling: 'Person created and connected as sibling.',
        partner: 'Person created and connected as partner.'
    };

    return t(messages[relationshipType] || 'Person created and connected as relative.');
}

function applyPartnerDetailsToCreatedConnection(connectionResult, relationshipValues)
{
    if (!connectionResult?.ok || connectionResult.connectType !== 'partner') return;
    if (!connectionResult.family) return;

    const values = relationshipValues?.relationships?.[0];
    if (!values) return;

    upsertPartnerRelationshipEvents(connectionResult.family, values);

    rebuildSampleEventsAndPruneSourceLinks();
}

function addPersonDateFieldHasTypedValue(fieldId)
{
    const root = modalBackdrop?.querySelector(`[data-genealogy-date-field="${CSS.escape(fieldId)}"]`);
    if (!root) return false;

    return Boolean(
        root.querySelector('[data-genealogy-date-input]')?.value.trim()
          || root.querySelector('[data-genealogy-date-input-to]')?.value.trim()
    );
}

function addPersonPlaceFieldHasTypedValue(selector)
{
    const value = modalBackdrop?.querySelector(selector)?.value || '';
    return hasTextValue(value);
}

function addPersonFactsHaveIdentifyingValue(facts = {})
{
    if (!facts || facts.invalid) return false;

    const burialPlaceText = facts.burialPlace?.text || '';
    const education = facts.education || {};
    const educationPlaceText = education.place?.text || '';
    const work = facts.work || {};
    const baptism = facts.baptism || {};
    const baptismPlaceText = baptism.place?.text || '';
    const customFact = facts.customFact || {};
    const customFactPlaceText = customFact.place?.text || '';

    return Boolean(
        hasTextValue(facts.alternativeNames)
          || hasTextValue(burialPlaceText)
          || hasTextValue(education.institutionName)
          || hasTextValue(education.value)
          || hasTextValue(educationPlaceText)
          || hasTextValue(education.notes)
          || hasGenealogyDateValue(education.fromDate, 'Exact date')
          || hasGenealogyDateValue(education.toDate, 'Exact date')
          || hasTextValue(work.company)
          || hasTextValue(work.occupation)
          || hasTextValue(work.notes)
          || hasGenealogyDateValue(work.fromDate, 'Exact date')
          || hasGenealogyDateValue(work.toDate, 'Exact date')
          || hasTextValue(baptismPlaceText)
          || hasGenealogyDateValue(baptism.date, 'Exact date')
          || hasTextValue(customFact.value)
          || hasTextValue(customFact.notes)
          || hasTextValue(customFactPlaceText)
          || hasGenealogyDateValue(
              customFact.date,
              'Exact date'
          )
    );
}

function addPersonHasCoreIdentifyingValue()
{
    const livingStatus = normalizeLivingStatus(readAddPersonModalValue('#addPersonLivingStatus'));

    return Boolean(
        readAddPersonModalValue('#addPersonFirstName')
          || readAddPersonModalValue('#addPersonLastName')
          || readAddPersonModalValue('#addPersonMiddleName')
          || readAddPersonModalValue('#addPersonMaidenName')
          || addPersonDateFieldHasTypedValue('addPersonBirth')
          || addPersonPlaceFieldHasTypedValue('#addPersonBirthPlace')
          || (
              livingStatus === 'Deceased'
              && (
                  addPersonDateFieldHasTypedValue('addPersonDeath')
                  || addPersonPlaceFieldHasTypedValue('#addPersonDeathPlace')
              )
          )
    );
}

function focusAddPersonFirstIdentifyingField()
{
    const target = modalBackdrop?.querySelector('#addPersonFirstName')
        || modalBackdrop?.querySelector('#addPersonLastName')
        || modalBackdrop?.querySelector('#addPersonBirthDate');

    target?.focus({ preventScroll: true });
}

function validateAddPersonCreateIdentity(options = {}, additionalFacts = {})
{
    const connectionIntent = addPersonCreateConnectionIntent(options);

    if (
        connectionIntent.shouldConnect
          || addPersonHasCoreIdentifyingValue()
          || addPersonFactsHaveIdentifyingValue(additionalFacts)
    )
    {
        return { ok: true };
    }

    return {
        ok: false,
        message: 'Add a name or at least one identifying fact before creating a person.'
    };
}

function applyAddPersonAttachmentDrafts(personId)
{
    const person =
        getPerson(personId);

    if (!person) return;

    setPersonPhotoIds(
        person.id,
        readAddPersonPhotoIds(),
        {
            rerender: false
        }
    );

    const linkedFiles = new Set(
        getArchiveFilesForPerson(person.id).map(file => file.id)
    );
    const selectedFiles = new Set(readAddPersonFileIds());
    const fileWrites = [...new Set([...linkedFiles, ...selectedFiles])]
        .filter(id => linkedFiles.has(id) !== selectedFiles.has(id))
        .map(id => ({
            ownerType: 'file',
            ownerId: id,
            entityType: 'person',
            entityId: person.id,
            shouldLink: selectedFiles.has(id)
        }));

    if (fileWrites.length)
    {
        archiveSetConnectionsAtomically(fileWrites);
    }

    const linkedNotes = new Set(
        getNotesForPerson(person.id, {
            projectId: person.projectId,
            includeArchived: true
        }).map(note => note.id)
    );
    const selectedNotes = new Set(readAddPersonNoteIds());

    for (const noteId of new Set([...linkedNotes, ...selectedNotes]))
    {
        if (linkedNotes.has(noteId) === selectedNotes.has(noteId)) continue;
        const note = getNote(noteId, {
            projectId: person.projectId,
            includeArchived: true
        });
        if (!note) continue;

        const personIds = new Set(note.linkedPersonIds || []);
        if (selectedNotes.has(noteId)) personIds.add(person.id);
        else personIds.delete(person.id);

        setNoteEntityLinks(note.id, 'person', [...personIds], {
            projectId: person.projectId
        });
    }
}

function commitAddPersonModalCreate(title, subtitle, options = {})
{
    const createAnother = modalBackdrop.querySelector('#addPersonCreateAnother')?.checked;
    const additionalFacts = collectAddPersonAdditionalFacts('');

    if (additionalFacts.invalid)
    {
        showToast(additionalFacts.message || 'Check the additional facts before creating.');
        return null;
    }

    const identityValidation = validateAddPersonCreateIdentity(options, additionalFacts);

    if (!identityValidation.ok)
    {
        showToast(identityValidation.message);
        focusAddPersonFirstIdentifyingField();
        return null;
    }

    const birthDate = collectGenealogyDateField('addPersonBirth');
    if (!birthDate)
    {
        showToast('Check the birth date before saving.');
        modalBackdrop.querySelector('#addPersonBirthDate')?.focus({ preventScroll: true });
        return null;
    }

    const livingStatus = readAddPersonModalValue('#addPersonLivingStatus');
    const deathDate = livingStatus === 'Deceased'
        ? collectGenealogyDateField('addPersonDeath') : emptyGenealogyDate('Exact date');
    if (!deathDate)
    {
        showToast('Check the death date before saving.');
        modalBackdrop.querySelector('#addPersonDeathDate')?.focus({ preventScroll: true });
        return null;
    }

    const relationshipValues = collectAddPersonRelationshipBlock();

    if (relationshipValues.invalid)
    {
        showToast(relationshipValues.message || 'Check the relationship details before creating.');
        return null;
    }

    const connectionIntent = addPersonCreateConnectionIntent(options);
    const connectionDetailType = addPersonConnectionDetailType(options);
    const parentFamilySelection = addPersonParentFamilySelection(options);
    if (connectionIntent.shouldConnect && connectionDetailType === 'Biological'
        && newPersonBiologicalConflict(connectionIntent, parentFamilySelection,
            modalBackdrop.querySelector('#addPersonGender')?.value))
    {
        const message = t('This connection cannot be biological. Choose another relationship type.');
        showToast(message);
        showAddPersonFamilyError('#addPersonConnectionDetailType', message);
        return null;
    }
    if (connectionIntent.shouldConnect
        && ['child', 'sibling'].includes(connectionIntent.relationshipType))
    {
        const familySelectionValidation = validateParentFamilySelection({
            anchorPersonId: connectionIntent.anchorPersonId,
            relationshipType: connectionIntent.relationshipType,
            selection: parentFamilySelection
        });

        if (!familySelectionValidation.ok)
        {
            showToast(familySelectionValidation.message);
            showAddPersonFamilyError('#addPersonParentFamily', t(familySelectionValidation.message));
            return null;
        }
    }

    const projectPeopleBeforeCreate = getPeople(currentProjectId()).length;
    const newPerson = createPersonFromAddPersonModal(options, additionalFacts, {
        birth: birthDate,
        death: deathDate
    });
    if (!newPerson) return null;
    let connectionResult = null;

    if (connectionIntent.shouldConnect)
    {
        connectionResult = connectPeopleByRelationship({
            anchorPersonId: connectionIntent.anchorPersonId,
            relativePersonId: newPerson.id,
            relationshipType: connectionIntent.relationshipType,
            parentFamilySelection,
            detailType: connectionDetailType,
            partnerChildrenMode:
            addPersonPartnerChildrenMode(options)
        });

        if (connectionResult.ok)
        {
            applyPartnerDetailsToCreatedConnection(connectionResult, relationshipValues);
        }
        else
        {
            const index = sampleData.people.indexOf(newPerson);
            if (index >= 0) sampleData.people.splice(index, 1);
            showToast(connectionResult.message || 'This relationship cannot be created.');
            return null;
        }
    }

    applyAddPersonAttachmentDrafts(newPerson.id);
    markPrototypeSessionEdited();

    rebuildSampleEventsAndPruneSourceLinks();

    if (projectPeopleBeforeCreate === 0)
    {
        const project = validProjectById(newPerson.projectId);
        if (project)
        {
            project.defaultPersonId = newPerson.id;
            touchProjectModified(project);
        }
        const treeView = treeProjectViewState(newPerson.projectId);
        treeView.focusPersonId = newPerson.id;
        treeView.recentPersonIds = [newPerson.id];
        state.treeCenterTargetId = newPerson.id;
    }

    clearPeopleSelection();

    const selectedAfterCreateId = newPerson.id;

    state.selectedPersonId = selectedAfterCreateId;

    state.selectedPeopleId = selectedAfterCreateId;

    if (options.managerReturn) options.managerReturn.relatedPersonId = newPerson.id;
    closeModal({ force: true, skipAfterClose: Boolean(createAnother) });

    if (state.activeModule === 'Family Tree')
    {
        treeProjectViewState(newPerson.projectId).focusPersonId = newPerson.id;
        state.treeCenterTargetId = newPerson.id;
        renderFamilyTreePreserveScroll();
    }
    else
    {
        render();
    }

    if (connectionIntent.shouldConnect)
    {
        if (connectionResult?.ok)
        {
            showToast(createdPersonConnectionToast(connectionIntent.relationshipType));
        }
        else
        {
            showToast(connectionResult?.message || 'Person created, but could not connect the relationship.');
        }
    }
    else
    {
        showToast('Person created.');
    }

    if (createAnother)
    {
        requestAnimationFrame(() =>
        {
            if (connectionIntent.shouldConnect)
            {
                openAddPersonModal(title, subtitle, {
                    ...options,
                    personId: connectionIntent.anchorPersonId,
                    connectToPersonId: connectionIntent.anchorPersonId,
                    connectAfterCreate: true,
                    connectRelationshipType: connectionIntent.relationshipType,
                    parentFamilySelection
                });
            }
            else
            {
                openAddPersonModal('Add person', 'Create a new person in this project');
            }
        });
    }

    return {
        ok: true,
        person: newPerson,
        connectionResult
    };
}

function addPersonDraftMatchEvent(fieldId, placeSelector)
{
    const field = modalBackdrop?.querySelector('[data-genealogy-date-field="' + fieldId + '"]');
    const type = field?.querySelector('[data-genealogy-date-type]')?.value || 'Exact date';
    const model = readGenealogyDateModel(field);
    const parsed = parseGenealogyDateTextAsType(
        field?.querySelector('[data-genealogy-date-input]')?.value || '',
        type,
        {
            calendar: model.calendar,
            date2: field?.querySelector('[data-genealogy-date-input-to]')?.value || ''
        }
    );
    const place = modalBackdrop?.querySelector(placeSelector);
    return {
        ...(parsed.valid ? parsed.value : emptyGenealogyDate(type)),
        placeId: place?.dataset.placeId || '',
        placeText: place ? collectLocalizedDataFieldValue(place, place.dataset.sourceValue || place.value).trim() : ''
    };
}

function collectAddPersonDraftForMatching()
{
    const names = {
        first: readAddPersonModalValue('#addPersonFirstName'),
        middle: readAddPersonModalValue('#addPersonMiddleName'),
        last: readAddPersonModalValue('#addPersonLastName'),
        maiden: readAddPersonModalValue('#addPersonMaidenName')
    };
    const birth = addPersonDraftMatchEvent('addPersonBirth', '#addPersonBirthPlace');
    const isDeceased = readAddPersonModalValue('#addPersonLivingStatus') === 'Deceased';
    const death = isDeceased
        ? addPersonDraftMatchEvent('addPersonDeath', '#addPersonDeathPlace')
        : emptyGenealogyDate();
    return {
        names,
        birth,
        death,
        hasSignal: Boolean(Object.values(names).some(value => value.trim())
            || birth.state === 'known' || birth.placeId || birth.placeText
            || death.state === 'known' || death.placeId || death.placeText)
    };
}

let addPersonPossibleMatchState = {
    selectedPersonId: '',
    index: null,
    indexProjectId: '',
    peopleLength: -1,
    placesLength: -1,
    refreshTimer: null,
    lastHtml: ''
};

function addPersonPossibleMatchIndex(fresh = false)
{
    const projectId = currentProjectId();
    if (!projectId) return null;
    if (fresh || !addPersonPossibleMatchState.index
        || addPersonPossibleMatchState.indexProjectId !== projectId
        || addPersonPossibleMatchState.peopleLength !== sampleData.people.length
        || addPersonPossibleMatchState.placesLength !== sampleData.places.length)
    {
        addPersonPossibleMatchState.index = PersonMatchEngine.createIndex(
            getPeople(projectId), sampleData.places, sampleData.families, projectId);
        addPersonPossibleMatchState.indexProjectId = projectId;
        addPersonPossibleMatchState.peopleLength = sampleData.people.length;
        addPersonPossibleMatchState.placesLength = sampleData.places.length;
    }
    return addPersonPossibleMatchState.index;
}

function addPersonDraftHasSearchEvidence(draft, hasFamilyContext = false)
{
    const meaningfulNames = Object.values(draft.names).filter(value => value.trim().length >= 3);
    if (meaningfulNames.length >= 2) return true;
    if (meaningfulNames.length !== 1) return false;
    const specificDate = [draft.birth, draft.death].some(date =>
        date.state === 'known' && date.first?.month && date.first?.day);
    const knownPlace = [draft.birth, draft.death].some(date =>
        Boolean(date.placeId || date.placeText));
    return Number(specificDate) + Number(knownPlace) + Number(hasFamilyContext) >= 2;
}

function findAddPersonPossibleMatches(options = {}, editPerson = null, { fresh = false } = {})
{
    const draft = collectAddPersonDraftForMatching();
    const intent = addPersonCreateConnectionIntent(options);
    if (!addPersonDraftHasSearchEvidence(draft, intent.shouldConnect)) return [];
    const index = addPersonPossibleMatchIndex(fresh);
    if (!index) return [];
    return PersonMatchEngine.search(index, draft, {
        excludeIds: [editPerson?.id || '', intent.shouldConnect ? intent.anchorPersonId : ''].filter(Boolean),
        anchorPersonId: intent.shouldConnect ? intent.anchorPersonId : '',
        relationshipType: intent.shouldConnect ? intent.relationshipType : '',
        limit: 2
    });
}

function addPersonPossibleMatchMeta(person)
{
    const life =
        connectPersonLifeLine(
            person
        );

    const place =
        getPlaceEventDisplay(
            person?.birth
        )
        || getPlaceEventDisplay(
            person?.death
        )
        || '';

    return [
        life,
        place
    ]
        .filter(Boolean)
        .map(escapeHtml)
        .join('<br>');
}

function renderAddPersonPossibleMatchRow(
    item,
    {
        context = 'family-tree',
        selectedPersonId =
            addPersonPossibleMatchState
                .selectedPersonId
    } = {}
)
{
    const person = item.person;
    const selected =
        person.id === selectedPersonId;

    const selectionAttribute =
        context === 'geneograph'
            ? 'data-geneo-person-possible-match'
            : 'data-add-person-possible-match';

    return `<button
        class="match-row is-possible-duplicate ${selected ? 'is-selected' : ''}"
        type="button"
        ${selectionAttribute}="${escapeHtml(person.id)}"
        aria-pressed="${selected ? 'true' : 'false'}">
        ${renderPersonAvatar(person, 'small-avatar')}
        <div>
          <strong>${escapeHtml(connectPersonName(person))}</strong><br>
          ${addPersonPossibleMatchMeta(person)}
          ${renderAddPersonMatchEvidence(item)}
        </div>
      </button>`;
}

function renderAddPersonMatchEvidence(item)
{
    const evidence = new Set((item.reasons || []).map(reason =>
        reason.kind === 'name' ? 'Names agree'
            : reason.kind === 'date' ? 'Dates compatible'
                : reason.kind === 'place' ? 'Places agree'
                    : 'Family connection'));
    return evidence.size
        ? '<div class="panel-muted add-person-match-evidence">' + [...evidence]
            .map(label => escapeHtml(t(label))).join(' · ') + '</div>'
        : '';
}

function addPersonPossibleMatchActionLabel(options = {})
{
    const connectionIntent = addPersonCreateConnectionIntent(options);
    return connectionIntent.shouldConnect ? 'Connect selected' : 'Open selected';
}

function renderAddPersonPossibleMatchesCard(options = {}, editPerson = null)
{
    const matches = findAddPersonPossibleMatches(options, editPerson);
    const draft = collectAddPersonDraftForMatching();
    const selectedPerson = getPerson(addPersonPossibleMatchState.selectedPersonId);
    const actionLabel = addPersonPossibleMatchActionLabel(options);

    if (!draft.hasSignal || !Object.values(draft.names || {})
        .some(value => value.trim().length >= 3))
    {
        return `<div class="modal-side-card" data-add-person-possible-matches>
          <h3>Possible matches<br><span class="panel-muted">Similar people in this project</span></h3>
          <div class="add-person-match-empty">Enter a name to check for existing people.</div>
        </div>`;
    }

    if (!matches.length)
    {
        return `<div class="modal-side-card" data-add-person-possible-matches>
          <h3>Possible matches<br><span class="panel-muted">Similar people in this project</span></h3>
          <div class="add-person-match-empty">No convincing matches yet. Add another name or corroborating details.</div>
        </div>`;
    }

    const selectedStillVisible = matches.some(item => item.person.id === addPersonPossibleMatchState.selectedPersonId);

    if (addPersonPossibleMatchState.selectedPersonId && !selectedStillVisible)
    {
        addPersonPossibleMatchState.selectedPersonId = '';
    }

    return `<div class="modal-side-card" data-add-person-possible-matches>
        <h3>Possible matches<br><span class="panel-muted">Similar people in this project</span></h3>
        <div class="add-person-match-list">
          ${matches.map(renderAddPersonPossibleMatchRow).join('')}
        </div>
        <button
          class="button secondary add-person-match-action"
          type="button"
          data-add-person-match-action
          ${selectedPerson && selectedStillVisible ? '' : 'disabled'}>
          ${icon.link}
          <span>${escapeHtml(actionLabel)}</span>
        </button>
      </div>`;
}

let addPersonAttachmentDraftState = {
    photoIds: [],
    fileIds: [],
    noteIds: []
};

function initializeAddPersonAttachmentDraft(editPerson = null)
{
    addPersonAttachmentDraftState = {
        photoIds:
          editPerson
              ? getPhotosForPerson(editPerson.id)
                  .map(photo => photo.id)
              : [],

        fileIds:
          editPerson
              ? getArchiveFilesForPerson(editPerson.id)
                  .map(file => file.id)
              : [],

        noteIds:
          editPerson
              ? getNotesForPerson(editPerson.id, { includeArchived: true })
                  .map(note => note.id)
              : []
    };
}

function readAddPersonPhotoIds()
{
    return [
        ...addPersonAttachmentDraftState.photoIds
    ];
}

function readAddPersonFileIds()
{
    return [
        ...addPersonAttachmentDraftState.fileIds
    ];
}

function readAddPersonNoteIds()
{
    return [
        ...addPersonAttachmentDraftState.noteIds
    ];
}

function refreshAddPersonAttachmentCounts()
{
    const counts = {
        photo:
          addPersonAttachmentDraftState.photoIds.length,

        file:
          addPersonAttachmentDraftState.fileIds.length,

        note:
          addPersonAttachmentDraftState.noteIds.length
    };

    Object.entries(counts).forEach(
        ([type, count]) =>
        {
            const element =
                modalBackdrop.querySelector(
                    `[data-add-person-attachment-count="${type}"]`
                );

            if (element)
            {
                element.textContent =
                    translateText(`${count} selected`);
            }
        }
    );
}

function setAddPersonPhotoDraftIds(photoIds)
{
    addPersonAttachmentDraftState.photoIds = [
        ...new Set(photoIds || [])
    ].filter(id => Boolean(getPhoto(id)));

    refreshAddPersonAttachmentCounts();
}

function setAddPersonFileDraftIds(fileIds)
{
    addPersonAttachmentDraftState.fileIds = [
        ...new Set(fileIds || [])
    ].filter(id =>
        Boolean(archiveFileById(id))
    );

    refreshAddPersonAttachmentCounts();
}

function setAddPersonNoteDraftIds(noteIds)
{
    addPersonAttachmentDraftState.noteIds = [
        ...new Set(noteIds || [])
    ].filter(id =>
        Boolean(
            getNote(id, {
                includeArchived: true
            })
        )
    );

    refreshAddPersonAttachmentCounts();
}

function renderAddPersonAttachmentSideCard()
{
    const row = ({
        type,
        title,
        iconHtml,
        extraClass = '',
        attribute
    }) =>
    {
        const count =
            addPersonAttachmentDraftState[
                `${type}Ids`
            ]?.length || 0;

        return `<button
          class="attach-row"
          type="button"
          ${attribute}>
          <div
            class="attach-icon ${escapeHtml(extraClass)}"
            aria-hidden="true">
            ${iconHtml}
          </div>

          <div>
            <strong>${escapeHtml(title)}</strong><br>

            <span
              data-add-person-attachment-count="${escapeHtml(type)}">
              ${escapeHtml(translateText(`${count} selected`))}
            </span>
          </div>
        </button>`;
    };

    return `<div class="modal-side-card">
        <h3>Attach to this person</h3>

        ${row({
            type: 'photo',
            title: 'Add photos',
            iconHtml: icon.image,
            extraClass: 'photo',
            attribute: 'data-add-person-photos'
        })}

        ${row({
            type: 'file',
            title: 'Add file',
            iconHtml: icon.file,
            extraClass: 'file',
            attribute: 'data-add-person-files'
        })}

        ${row({
            type: 'note',
            title: 'Add note',
            iconHtml: icon.note,
            extraClass: 'note',
            attribute: 'data-add-person-note'
        })}
      </div>`;
}

function refreshAddPersonPossibleMatchesCard(options = {}, editPerson = null)
{
    const container = modalBackdrop?.querySelector('[data-add-person-possible-matches]');
    if (!container) return;
    const next = renderAddPersonPossibleMatchesCard(options, editPerson);
    if (next === addPersonPossibleMatchState.lastHtml) return;

    container.outerHTML = next;
    addPersonPossibleMatchState.lastHtml = next;
    const refreshed = modalBackdrop.querySelector('[data-add-person-possible-matches]');
    if (refreshed) localizeUI(refreshed);
    bindAddPersonPossibleMatchRows(options, editPerson);
}

function openAddPersonPossibleMatch(personId)
{
    const person = getPerson(personId);
    if (!person) return;

    closeModal();

    state.selectedPersonId = person.id;
    state.selectedPeopleId = person.id;
    state.treeInspectorCollapsed = false;

    if (state.activeModule === 'Family Tree')
    {
        renderFamilyTreePreserveScroll?.() || renderFamilyTree();
    }
    else
    {
        render();
    }

    showToast(`Opened possible match: ${connectPersonName(person)}.`);
}

function bindAddPersonPossibleMatchRows(options = {}, editPerson = null)
{
    modalBackdrop?.querySelectorAll('[data-add-person-possible-match]').forEach(button =>
    {
        button.addEventListener('click', () =>
        {
            selectAddPersonPossibleMatch(button.dataset.addPersonPossibleMatch || '', options, editPerson);
        });
    });

    modalBackdrop?.querySelector('[data-add-person-match-action]')?.addEventListener('click', () =>
    {
        commitAddPersonPossibleMatchAction(options);
    });
}

function bindAddPersonSideCards(options = {}, editPerson = null)
{
    const projectId =
        editPerson?.projectId
        || currentProjectId();

    const subjectLabel =
        formatPersonFullName(editPerson)
        || 'New person';

    modalBackdrop
        ?.querySelector('[data-add-person-photos]')
        ?.addEventListener('click', () =>
        {
            openAddPhotosForPersonDraftModal({
                projectId,
                subjectLabel,
                existingPhotoIds:
              readAddPersonPhotoIds(),

                onSave:
              (ids, context) =>
              {
                  setAddPersonPhotoDraftIds(rpApplyConnectionChanges(readAddPersonPhotoIds(), context));
                  return { ok: true };
              },

                afterSave:
              refreshAddPersonAttachmentCounts,

                suppressLinkToast:
              true
            });
        });

    modalBackdrop
        ?.querySelector('[data-add-person-files]')
        ?.addEventListener('click', () =>
        {
            openConnectedFilesModal({
                projectId,

                title:
              `Add files to ${subjectLabel}`,

                subtitle:
              'Connect existing Archive files or add new files.',

                existingFileIds:
              readAddPersonFileIds(),

                modalOpener:
              openNestedModal,

                onSave:
              (fileIds, context) =>
              {
                  setAddPersonFileDraftIds(rpApplyConnectionChanges(readAddPersonFileIds(), context));

                  return {
                      ok: true,
                      addedLinkCount:
                    context.changes.addedIds.length
                  };
              },

                afterSave:
              refreshAddPersonAttachmentCounts,

                suppressLinkToast:
              true
            });
        });

    modalBackdrop
        ?.querySelector('[data-add-person-note]')
        ?.addEventListener('click', () =>
        {
            openNoteLinkPickerModal({
                projectId,

                title:
              'Add note',

                description:
              `Link existing notes to “${subjectLabel}”.`,

                existingNoteIds:
              readAddPersonNoteIds(),

                includeArchived:
              false,

                existingStatus:
              'Already selected',

                existingMetaLabel:
              'already selected',

                createLabel:
              'Create note',

                modalOpener:
              openNestedModal,

                onCreate:
              () =>
              {
                  const note =
                      createCentralNote({
                          projectId,
                          activate: false,
                          renderAfterCreate: false,
                          focusTitleAfterCreate: false,
                          showCreatedToast: false,
                          inheritActiveContext: false,
                          inheritActiveCollection: false
                      });

                  if (!note) return;

                  setAddPersonNoteDraftIds([
                      ...readAddPersonNoteIds(),
                      note.id
                  ]);

                  showToast(
                      'Note created and selected.'
                  );
              },

                onSave:
              (noteIds, context) =>
              {
                  setAddPersonNoteDraftIds(rpApplyConnectionChanges(readAddPersonNoteIds(), context));

                  return {
                      ok: true,
                      addedLinkCount:
                    context.changes.addedIds.length
                  };
              },

                afterSave:
              refreshAddPersonAttachmentCounts,

                suppressLinkToast:
              true
            });
        });

    bindAddPersonPossibleMatchRows(options, editPerson);

    const scheduleRefresh = () =>
    {
        if (addPersonPossibleMatchState.refreshTimer)
            clearTimeout(addPersonPossibleMatchState.refreshTimer);
        addPersonPossibleMatchState.refreshTimer = setTimeout(() =>
        {
            addPersonPossibleMatchState.refreshTimer = null;
            refreshAddPersonPossibleMatchesCard(options, editPerson);
        }, 130);
    };
    const selectors = [
        '#addPersonFirstName', '#addPersonMiddleName', '#addPersonLastName', '#addPersonMaidenName',
        '#addPersonBirthDate', '#addPersonDeathDate', '#addPersonBirthDateTo', '#addPersonDeathDateTo',
        '#addPersonBirthDateType', '#addPersonDeathDateType',
        '#addPersonBirthPlace', '#addPersonDeathPlace'
    ];
    selectors.forEach(selector =>
    {
        const input = modalBackdrop?.querySelector(selector);
        if (!input) return;
        input.addEventListener('input', scheduleRefresh);
        input.addEventListener('change', scheduleRefresh);
    });
}

function unlinkPersonName(personOrId)
{
    const person = typeof personOrId === 'string' ? getPerson(personOrId) : personOrId;
    return formatPersonFullName(person) || person?.name || 'Unknown person';
}

function unlinkFamilyPartnerAId(family)
{
    return familyPartnerAId(family) || '';
}

function unlinkFamilyPartnerBId(family)
{
    return familyPartnerBId(family) || '';
}

function unlinkFamilyIncludesPerson(family, personId)
{
    return Boolean(personId && (
        unlinkFamilyPartnerAId(family) === personId
          || unlinkFamilyPartnerBId(family) === personId
    ));
}

function unlinkFamilyPartnerId(family, personId)
{
    if (unlinkFamilyPartnerAId(family) === personId) return unlinkFamilyPartnerBId(family);
    if (unlinkFamilyPartnerBId(family) === personId) return unlinkFamilyPartnerAId(family);
    return '';
}

function unlinkFamilyChildrenIds(family)
{
    return [...new Set([...(family?.childIds || [])].filter(Boolean))];
}

function unlinkSetFamilyChildren(family, childIds = [])
{
    const ids = [...new Set(childIds.filter(Boolean))];
    family.childIds = ids;

    return ids;
}

function unlinkFindCentralFamilyForParentChild(parentId, childId, preferredFamilyId = '')
{
    const matches = centralFamilyRecords().filter(family =>
        (!preferredFamilyId || family.id === preferredFamilyId)
        && unlinkFamilyIncludesPerson(family, parentId) && unlinkFamilyChildrenIds(family).includes(childId)
    );
    return matches.length === 1 ? matches[0] : null;
}

function unlinkFindCentralPartnerFamily(personAId, personBId, preferredFamilyId = '')
{
    const matches = centralFamilyRecords().filter(family =>
        (!preferredFamilyId || family.id === preferredFamilyId)
        && unlinkFamilyIncludesPerson(family, personAId) && unlinkFamilyIncludesPerson(family, personBId)
    );
    return matches.length === 1 ? matches[0] : null;
}

function unlinkUniqueFamilyId(base = 'family')
{
    const cleanBase = String(base || 'family')
        .replace(/[^a-z0-9]+/gi, '-')
        .replace(/^-|-$/g, '') || 'family';

    let id = cleanBase;
    let counter = 2;

    while (centralFamilyRecords().some(family => family.id === id))
    {
        id = `${cleanBase}-${counter}`;
        counter += 1;
    }

    return id;
}

function unlinkCreateSingleParentFamily(parentId, childIds, sourceFamily)
{
    const usesSlotA = sourceFamily.partnerAId === parentId;
    const family = {
        id: unlinkUniqueFamilyId(`family-${parentId}-single-parent`),
        projectId: sourceFamily.projectId,
        type: 'family',


        partnerAId: usesSlotA ? parentId : '',
        partnerARoleHint: usesSlotA ? sourceFamily.partnerARoleHint || '' : '',

        partnerBId: usesSlotA ? '' : parentId,
        partnerBRoleHint: usesSlotA ? '' : sourceFamily.partnerBRoleHint || '',

        relationshipType: 'Single parent',
        relationshipStatus: 'active',
        childIds: [],
        events: [],
        attributes: [],
        notes: [],
        citations: [],
        mediaIds: [],
        parentChildTypes: {},
        gedcomXref: ''
    };

    family.gedcomXref = `@F${family.id.replace(/[^a-z0-9]/gi, '').toUpperCase()}@`;
    unlinkSetFamilyChildren(family, childIds);

    centralFamilyRecords().push(family);
    return family;
}

function unlinkFamilyHasPartnerPair(family)
{
    return Boolean(unlinkFamilyPartnerAId(family) && unlinkFamilyPartnerBId(family));
}

function unlinkFamilyHasPayload(family)
{
    return Boolean(
        (family?.events || []).length
          || (family?.attributes || []).length
          || (family?.notes || []).length
          || (family?.citations || []).length
          || (family?.mediaIds || []).length
    );
}

function unlinkRemoveFamilyById(familyId)
{
    const families = centralFamilyRecords();
    const index = families.findIndex(family => family.id === familyId);

    if (index >= 0)
    {
        families.splice(index, 1);
        return true;
    }

    return false;
}

function unlinkRemoveFamilyIfEmptyAndOrphaned(family)
{
    if (!family?.id) return false;
    if (unlinkFamilyChildrenIds(family).length) return false;
    if (unlinkFamilyHasPartnerPair(family)) return false;
    if (unlinkFamilyHasPayload(family)) return false;

    return unlinkRemoveFamilyById(family.id);
}

function unlinkParentChildRelationship({ parentId, childId, familyId = '' } = {})
{
    if (!parentId || !childId)
    {
        return { ok: false, message: 'Relationship information is missing.' };
    }

    const family = unlinkFindCentralFamilyForParentChild(parentId, childId, familyId);

    if (!family)
    {
        return { ok: false, message: 'Relationship record not found.' };
    }

    const children = unlinkFamilyChildrenIds(family);

    if (!children.includes(childId))
    {
        return { ok: false, message: 'This parent-child relationship has already been removed.' };
    }

    const otherParentId =
        unlinkFamilyPartnerId(family, parentId);

    const otherParentType = otherParentId
        ? parentChildRelationshipType(
            family,
            otherParentId,
            childId
        )
        : 'Biological';

    unlinkSetFamilyChildren(
        family,
        children.filter(id => id !== childId)
    );

    /*
      * The child is no longer represented by this family,
      * so remove all connection-type keys for that child.
      */
    removeParentChildRelationshipType(
        family,
        parentId,
        childId
    );

    if (otherParentId)
    {
        removeParentChildRelationshipType(
            family,
            otherParentId,
            childId
        );

        const singleParentFamily =
            unlinkCreateSingleParentFamily(
                otherParentId,
                [childId],
                family
            );

        setParentChildRelationshipType(
            singleParentFamily,
            otherParentId,
            childId,
            otherParentType
        );
    }

    unlinkRemoveFamilyIfEmptyAndOrphaned(family);
    markPrototypeSessionEdited();

    return {
        ok: true,
        message: 'Relationship unlinked.'
    };
}

function unlinkPartnerRelationship({ personAId, personBId, familyId = '', keepChildrenWithParentId = '' } = {})
{
    if (!personAId || !personBId)
    {
        return { ok: false, message: 'Relationship information is missing.' };
    }

    const family = unlinkFindCentralPartnerFamily(personAId, personBId, familyId);

    if (!family)
    {
        return { ok: false, message: 'Relationship record not found.' };
    }

    const childIds = unlinkFamilyChildrenIds(family);

    if (childIds.length)
    {
        if (![personAId, personBId].includes(keepChildrenWithParentId))
        {
            return { ok: false, message: 'Choose which parent should keep the children.' };
        }
        const retainedTypes = childIds.map(childId => ({
            childId,
            type: parentChildRelationshipType(
                family,
                keepChildrenWithParentId,
                childId
            )
        }));

        const singleParentFamily =
            unlinkCreateSingleParentFamily(
                keepChildrenWithParentId,
                childIds,
                family
            );

        retainedTypes.forEach(({ childId, type }) =>
        {
            setParentChildRelationshipType(
                singleParentFamily,
                keepChildrenWithParentId,
                childId,
                type
            );
        });
    }

    unlinkRemoveFamilyById(family.id);
    markPrototypeSessionEdited();

    return {
        ok: true,
        message: 'Relationship unlinked.'
    };
}

function refreshAfterRelationshipChange(
    focusPersonId,
    context = 'tree'
)
{
    rebuildSampleEventsAndPruneSourceLinks();

    if (focusPersonId)
    {
        state.selectedPersonId = focusPersonId;

        if (
            context === 'people'
          || context === 'profile'
        )
        {
            state.selectedPeopleId = focusPersonId;
        }
    }

    closeModal();

    if (context === 'profile')
    {
        state.activeModule = 'People';
        state.peopleView = 'profile';
        state.peopleSide = 'profile';
        renderPeople();
        return;
    }

    if (context === 'people')
    {
        state.peoplePreviewCollapsed = false;
        renderPeople();
        return;
    }

    state.treeInspectorCollapsed = false;

    renderFamilyTreePreserveScroll?.()
        || renderFamilyTree();
}

function buildUnlinkRelationshipContext(raw = {})
{
    const kind = String(raw.kind || '').toLowerCase();
    const personId = String(raw.personId || '');
    const relatedPersonId = String(raw.relatedPersonId || '');
    const familyId = String(raw.familyId || '');
    const sidebarContext = raw.sidebarContext || 'tree';

    if (!personId || !relatedPersonId)
    {
        return { ok: false, message: 'Relationship information is missing.' };
    }

    if (kind === 'sibling')
    {
        return {
            ok: false,
            message: 'Sibling relationships come from shared parents. Remove or edit parent-child links instead.'
        };
    }

    if (kind === 'parent')
    {
        const family = unlinkFindCentralFamilyForParentChild(relatedPersonId, personId, familyId);

        return {
            ok: Boolean(family),
            message: family ? '' : 'Relationship record not found.',
            kind,
            sidebarContext,
            personId,
            relatedPersonId,
            parentId: relatedPersonId,
            childId: personId,
            familyId: family?.id || familyId,
            childrenIds: []
        };
    }

    if (kind === 'child')
    {
        const family = unlinkFindCentralFamilyForParentChild(personId, relatedPersonId, familyId);

        return {
            ok: Boolean(family),
            message: family ? '' : 'Relationship record not found.',
            kind,
            sidebarContext,
            personId,
            relatedPersonId,
            parentId: personId,
            childId: relatedPersonId,
            familyId: family?.id || familyId,
            childrenIds: []
        };
    }

    if (kind === 'partner')
    {
        const family = unlinkFindCentralPartnerFamily(personId, relatedPersonId, familyId);
        const childrenIds = unlinkFamilyChildrenIds(family);

        return {
            ok: Boolean(family),
            message: family ? '' : 'Relationship record not found.',
            kind,
            sidebarContext,
            personId,
            relatedPersonId,
            familyId: family?.id || familyId,
            childrenIds
        };
    }

    return {
        ok: false,
        message: 'Unsupported relationship type.'
    };
}

function openManageRelationshipsDiscardConfirm(onDiscard, { message = 'Unsaved relationship changes will be lost.' } = {})
{
    if (document.getElementById('manageRelationshipsDiscardOverlay')) return;
    const overlay = document.createElement('div');
    overlay.id = 'manageRelationshipsDiscardOverlay';
    overlay.className = 'add-person-mini-backdrop';
    overlay.innerHTML = `<div class="add-person-mini-card" role="alertdialog" aria-modal="true" aria-labelledby="manageRelationshipsDiscardTitle">
        <div class="add-person-mini-head"><h3 id="manageRelationshipsDiscardTitle">${escapeHtml(t('Discard changes?'))}</h3><p>${escapeHtml(t(message))}</p></div>
        <div class="add-person-mini-footer"><button class="button secondary" type="button" data-manage-continue-editing>${escapeHtml(t('Continue editing'))}</button><button class="button danger" type="button" data-manage-discard>${escapeHtml(t('Discard changes'))}</button></div>
      </div>`;
    const returnFocus = document.activeElement;
    document.body.appendChild(overlay);
    overlay.querySelector('[data-manage-continue-editing]').addEventListener('click', () =>
    {
        overlay.remove();
        returnFocus?.focus?.({ preventScroll: true });
    });
    overlay.querySelector('[data-manage-discard]').addEventListener('click', () =>
    {
        overlay.remove();
        onDiscard();
    });
    overlay.addEventListener('keydown', event =>
    {
        if (event.key === 'Escape')
        {
            event.preventDefault(); event.stopPropagation();
            overlay.querySelector('[data-manage-continue-editing]').click();
        }
        if (event.key === 'Tab')
        {
            const buttons = [...overlay.querySelectorAll('button')];
            if (event.shiftKey && document.activeElement === buttons[0]) { event.preventDefault(); buttons.at(-1).focus(); }
            else if (!event.shiftKey && document.activeElement === buttons.at(-1)) { event.preventDefault(); buttons[0].focus(); }
        }
    });
    overlay.querySelector('[data-manage-continue-editing]').focus();
}

function bindManageRelativeReturn(context)
{
    if (!context) return;
    modalBackdrop.afterClose = () =>
    {
        if (currentProjectId() !== context.projectId || !getPerson(context.personId)
            || modalBackdrop.classList.contains('open')) return;
        refreshAfterRelationshipChange(context.personId, context.sidebarContext);
        openManageRelationshipsModal(context.personId, context.sidebarContext, {
            relatedPersonId: context.relatedPersonId, focusSelection: Boolean(context.relatedPersonId)
        });
        if (!context.relatedPersonId) requestAnimationFrame(() => modalBackdrop.querySelector('[data-manage-add-relative]')?.focus());
    };
}

function openManageRelativeMenu(anchor, managerReturn)
{
    if (closeGeneoOpenMenuOnTrigger(anchor)) return;
    closeMenu();
    const menu = document.createElement('div');
    menu.id = 'projectMenu';
    menu.className = 'menu-popover manage-relative-menu';
    menu.setAttribute('role', 'menu');
    menu.setAttribute('aria-label', t('Add relative'));
    menu.innerHTML = ['parent', 'partner', 'child', 'sibling'].map(type => `<button type="button" role="menuitem" data-manage-relative="${type}">${icon.people}<span>${escapeHtml(t(capitalize(type)))}</span></button>`).join('');
    document.body.appendChild(menu);
    const rect = anchor.getBoundingClientRect();
    menu.style.left = `${Math.max(12, Math.min(rect.left, innerWidth - menu.offsetWidth - 12))}px`;
    menu.style.top = `${rect.bottom + menu.offsetHeight + 8 < innerHeight ? rect.bottom + 6 : Math.max(12, rect.top - menu.offsetHeight - 6)}px`;
    if (innerWidth <= 900) mountMobileChoiceSheet(menu, anchor, t('Add relative'));
    anchor.setAttribute('aria-expanded', 'true');
    menu.addEventListener('click', event =>
    {
        const type = event.target.closest('[data-manage-relative]')?.dataset.manageRelative;
        if (!type) return;
        closeMenu();
        openAddPersonModal(`Add ${type}`, '', { relativeType: type, personId: managerReturn.personId,
            connectToPersonId: managerReturn.personId, connectAfterCreate: true, connectRelationshipType: type, managerReturn });
    });
    menu.addEventListener('keydown', event =>
    {
        const items = [...menu.querySelectorAll('[role="menuitem"]')];
        const index = items.indexOf(document.activeElement);
        if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); closeMenu(); anchor.focus(); }
        else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key))
        {
            event.preventDefault();
            items[event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus();
        }
    });
    bindMenuLifecycle(anchor);
    requestAnimationFrame(() => menu.querySelector('button')?.focus());
}

function openManageRelationshipsModal(personId, sidebarContext = 'tree', returnState = {})
{
    const person = getPerson(personId);
    if (!person || person.projectId !== currentProjectId())
    {
        showToast(t('Person record not found.'));
        return;
    }

    const order = ['Parents', 'Partners', 'Children', 'Siblings'];
    const groups = getRelationshipGroups(personId)
        .sort((a, b) => order.indexOf(a.title) - order.indexOf(b.title))
        .map(group => ({ ...group, items: group.items.filter(item => item.person?.projectId === person.projectId) }))
        .filter(group => group.items.length);
    const items = groups.flatMap(group => group.items);
    const keyFor = item => `${item.kind}:${item.relatedPersonId}:${item.familyId}`;
    const selected = items.find(item => keyFor(item) === returnState.selectedKey)
        || items.find(item => item.relatedPersonId === returnState.relatedPersonId) || items[0] || null;
    const selectedKey = selected ? keyFor(selected) : '';
    const editContext = selected?.kind !== 'sibling' && selected
        ? buildRelationshipEditContext({ ...selected, sidebarContext }) : null;
    const sharedParents = selected?.kind === 'sibling'
        ? getParents(selected.person.id).filter(parent => getParents(personId).some(own => own.id === parent.id))
        : [];
    const personList = groups.length ? groups.map(group => `<section class="manage-relationships-group">
        <h3>${escapeHtml(t(group.title))}<span>${group.items.length}</span></h3>
        ${group.items.map(item => `<button type="button" class="manage-relationships-choice ${keyFor(item) === selectedKey ? 'is-selected' : ''}" data-manage-select="${escapeHtml(keyFor(item))}" aria-current="${keyFor(item) === selectedKey ? 'true' : 'false'}">
            ${renderPersonAvatar(item.person, 'small-avatar', { element: 'span', decorative: true })}
            <span class="manage-relationships-copy"><strong>${escapeHtml(translateText(formatPersonFullName(item.person) || 'Unnamed person'))}</strong><span>${escapeHtml(item.kind === 'sibling' ? t('Shared parent connection') : translateText(item.meta || ''))}</span></span>
          </button>`).join('')}
      </section>`).join('') : `<p class="panel-muted">${escapeHtml(t('No immediate relationships recorded for this person.'))}</p>`;
    const details = selected ? `<div class="manage-relationships-detail-head">
        ${renderPersonAvatar(selected.person, 'small-avatar', { element: 'span', decorative: true })}
        <div class="manage-relationships-identity"><h3>${escapeHtml(translateText(formatPersonFullName(selected.person) || 'Unnamed person'))}</h3><span>${escapeHtml(t(selected.kind === 'sibling' ? 'Sibling' : selected.kind === 'partner' ? 'Partner' : selected.kind === 'parent' ? 'Parent' : 'Child'))}</span></div>
        ${selected.kind === 'sibling' ? '' : `<button class="manage-relationships-unlink" type="button" data-manage-unlink aria-label="${escapeHtml(t('Unlink'))}: ${escapeHtml(translateText(formatPersonFullName(selected.person) || 'Unnamed person'))}" title="${escapeHtml(t('Unlink'))}">${icon.unlink}<span>${escapeHtml(t('Unlink'))}</span></button>`}
      </div>
      ${selected.kind === 'sibling' ? `<div class="manage-relationships-sibling">
          <p>${escapeHtml(t('Siblings share at least one parent. Review a parent connection below to change this.'))}</p>
          <div class="manage-relationships-parent-actions">${sharedParents.map(parent => `<button class="button secondary" type="button" data-manage-parent-link="${escapeHtml(parent.id)}">${icon.people}<span>${escapeHtml(translateText(formatPersonFullName(parent) || 'Unnamed person'))}</span>${icon.chevron}</button>`).join('')}</div>
          <p class="panel-muted">${escapeHtml(t('Changing a parent connection may also affect other siblings.'))}</p>
        </div>` : `<div class="manage-relationships-fields form-grid">${editContext?.ok ? selected.kind === 'partner' ? renderPartnerRelationshipEditFields(editContext) : renderParentChildRelationshipEditFields(editContext) : `<p class="panel-muted">${escapeHtml(t('Relationship record not found.'))}</p>`}</div>
        `}`
        : `<p class="panel-muted">${escapeHtml(t('No immediate relationships recorded for this person.'))}</p>`;

    const emptyContent = `<div class="manage-relationships-empty"><h3>${escapeHtml(t('No relatives added yet'))}</h3><p>${escapeHtml(t('Add a new relative or connect someone already in this project.'))}</p><div class="manage-relationships-empty-actions"><button class="button primary" type="button" data-manage-add-relative aria-haspopup="menu" aria-expanded="false">${icon.plus}<span>${escapeHtml(t('Add relative'))}</span></button><button class="button secondary" type="button" data-manage-connect-existing>${icon.link}<span>${escapeHtml(t('Connect existing person'))}</span></button></div></div>`;
    openModal(`<div class="modal manage-relationships-modal ${items.length ? '' : 'is-empty'}" role="dialog" aria-modal="true" aria-labelledby="manageRelationshipsTitle">
        <div class="modal-header"><div><h2 id="manageRelationshipsTitle">${escapeHtml(t('Manage relationships'))}</h2><p>${escapeHtml(translateText(formatPersonFullName(person) || 'Unnamed person'))}</p></div><button class="close-button" type="button" data-close aria-label="${escapeHtml(t('Close'))}">${icon.close}</button></div>
        <div class="modal-body manage-relationships-body">${items.length ? `<nav class="manage-relationships-rail" aria-label="${escapeHtml(t('Relationships'))}">${personList}</nav><section class="manage-relationships-detail" aria-label="${escapeHtml(t('Relationship details'))}">${details}</section>` : emptyContent}</div>
        <div class="modal-footer manage-relationships-footer"><button class="button secondary" type="button" data-close>${escapeHtml(t('Done'))}</button>${selected && selected.kind !== 'sibling' ? `<button class="button primary" type="button" data-manage-save disabled>${escapeHtml(t('Save relationship'))}</button>` : ''}</div>
      </div>`);

    const modal = modalBackdrop.querySelector('.manage-relationships-modal');
    const rail = modal.querySelector('.manage-relationships-rail');
    if (rail) rail.scrollTop = returnState.scrollTop || 0;
    const currentState = () => ({ personId, sidebarContext, selectedKey, scrollTop: rail?.scrollTop || 0 });
    const managerReturn = { personId, sidebarContext, projectId: person.projectId };
    modal.querySelector('[data-manage-add-relative]')?.addEventListener('click', event => openManageRelativeMenu(event.currentTarget, managerReturn));
    modal.querySelector('[data-manage-connect-existing]')?.addEventListener('click', () => openConnectRelativeModal(personId, { managerReturn }));
    const fields = modal.querySelector('.manage-relationships-fields');
    if (editContext?.ok && selected?.kind === 'partner') bindPartnerRelationshipEditFields(modal);
    const initialSnapshot = relationshipEditSnapshot(fields);
    const isDirty = () => Boolean(fields && relationshipEditSnapshot(fields) !== initialSnapshot);
    const save = modal.querySelector('[data-manage-save]');
    const updateSave = () => { if (save) save.disabled = !isDirty() || !relationshipEditFieldsValid(editContext); };
    fields?.addEventListener('input', updateSave);
    fields?.addEventListener('change', updateSave);
    const guard = action => isDirty() ? openManageRelationshipsDiscardConfirm(action) : action();
    modalBackdrop.beforeClose = () =>
    {
        if (!isDirty()) return true;
        if (document.getElementById('manageRelationshipsDiscardOverlay'))
        {
            document.querySelector('[data-manage-continue-editing]')?.click();
            return false;
        }
        openManageRelationshipsDiscardConfirm(() => closeModal({ force: true }));
        return false;
    };
    modal.querySelectorAll('[data-manage-select]').forEach(button => button.addEventListener('click', () =>
        guard(() => openManageRelationshipsModal(personId, sidebarContext, { selectedKey: button.dataset.manageSelect, scrollTop: rail.scrollTop, focusSelection: true }))));
    modal.querySelectorAll('[data-manage-parent-link]').forEach(button => button.addEventListener('click', () =>
    {
        const parent = items.find(item => item.kind === 'parent' && item.relatedPersonId === button.dataset.manageParentLink);
        if (parent) openManageRelationshipsModal(personId, sidebarContext, { selectedKey: keyFor(parent), scrollTop: rail.scrollTop, focusSelection: true });
    }));
    modal.querySelector('[data-manage-unlink]')?.addEventListener('click', () => guard(() => openUnlinkRelationshipModal({
        kind: selected.kind,
        personId,
        relatedPersonId: selected.relatedPersonId,
        familyId: selected.familyId,
        sidebarContext,
        managerReturn: currentState()
    })));
    save?.addEventListener('click', () =>
    {
        if (!relationshipEditFieldsValid(editContext) || !isDirty()) return;
        if (saveRelationshipEdit(editContext))
        {
            modalBackdrop.beforeClose = null;
            refreshAfterRelationshipChange(personId, sidebarContext);
            openManageRelationshipsModal(personId, sidebarContext, currentState());
            showToast(t('Relationship updated.'));
        }
    });
    if (returnState.focusSelection) requestAnimationFrame(() => modalBackdrop.querySelector(`[data-manage-select="${CSS.escape(selectedKey)}"]`)?.focus({ preventScroll: true }));
}

function renderUnlinkRelationshipChildren(context)
{
    if (context.kind !== 'partner' || !context.childrenIds.length) return '';

    const personAName = unlinkPersonName(context.personAId);
    const personBName = unlinkPersonName(context.personBId);

    return `<div class="unlink-relationship-children">
        <div class="unlink-relationship-children-title">Children connected through this relationship</div>
        <ul class="unlink-relationship-child-list">
          ${context.childrenIds.map(childId => `<li>${escapeHtml(unlinkPersonName(childId))}</li>`).join('')}
        </ul>

        <div class="unlink-relationship-options" role="radiogroup" aria-label="Choose parent to keep children">
          <label class="unlink-relationship-option">
            <input type="radio" name="unlinkKeepChildrenWith" value="${escapeHtml(context.personAId)}">
            <span>Keep children with ${escapeHtml(personAName)}</span>
          </label>
          <label class="unlink-relationship-option">
            <input type="radio" name="unlinkKeepChildrenWith" value="${escapeHtml(context.personBId)}">
            <span>Keep children with ${escapeHtml(personBName)}</span>
          </label>
        </div>
      </div>`;
}

function unlinkRelationshipDescription(context)
{
    if (context.kind === 'parent')
    {
        return `This will remove ${unlinkPersonName(context.parentId)} as ${unlinkPersonName(context.childId)}’s parent. Neither person will be deleted.`;
    }

    if (context.kind === 'child')
    {
        return `This will remove ${unlinkPersonName(context.childId)} as ${unlinkPersonName(context.parentId)}’s child. Neither person will be deleted.`;
    }

    if (context.kind === 'partner')
    {
        const base = `This will remove the partner relationship between ${unlinkPersonName(context.personAId)} and ${unlinkPersonName(context.personBId)}. Neither person will be deleted.`;

        if (context.childrenIds.length)
        {
            return `${base} Choose which parent should keep the children after unlinking.`;
        }

        return base;
    }

    return 'This will remove the selected relationship. No person will be deleted.';
}

function renderUnlinkRelationshipModal(context)
{
    const needsChildDecision = context.kind === 'partner' && context.childrenIds.length > 0;

    return `<div class="modal unlink-relationship-modal" role="dialog" aria-modal="true" aria-labelledby="unlinkRelationshipTitle">
        <div class="modal-header">
          <div>
            <h2 id="unlinkRelationshipTitle">Remove relationship?</h2>
            <p>This changes the relationship only. People records will remain in the project.</p>
          </div>
          <button
            class="close-button"
            type="button"
            data-close
            aria-label="Close">
            ${icon.close}
          </button>
        </div>

        <div class="modal-body unlink-relationship-body">
          <div class="unlink-relationship-warning">
            ${escapeHtml(unlinkRelationshipDescription(context))}
          </div>

          ${renderUnlinkRelationshipChildren(context)}
        </div>

        <div class="modal-footer">
          <button class="button secondary" type="button" data-close>Cancel</button>
          <button class="button danger" type="button" data-confirm-unlink-relationship ${needsChildDecision ? 'disabled' : ''}>
            Unlink relationship
          </button>
        </div>
      </div>`;
}

function openUnlinkRelationshipModal(rawContext = {})
{
    const context = buildUnlinkRelationshipContext(rawContext);

    if (!context.ok)
    {
        showToast(context.message || 'Relationship cannot be unlinked.');
        return;
    }

    openModal(renderUnlinkRelationshipModal(context));
    if (rawContext.managerReturn)
    {
        context.managerReturn = rawContext.managerReturn;
        modalBackdrop.beforeClose = () =>
        {
            openManageRelationshipsModal(
                context.managerReturn.personId,
                context.managerReturn.sidebarContext,
                context.managerReturn
            );
            return false;
        };
    }
    bindUnlinkRelationshipModal(context);
}

function bindUnlinkRelationshipModal(context)
{
    const confirmButton = modalBackdrop.querySelector('[data-confirm-unlink-relationship]');
    const keepChildrenInputs = [...modalBackdrop.querySelectorAll('input[name="unlinkKeepChildrenWith"]')];

    keepChildrenInputs.forEach(input =>
    {
        input.addEventListener('change', () =>
        {
            if (confirmButton) confirmButton.disabled = false;
        });
    });

    confirmButton?.addEventListener('click', () =>
    {
        let result = null;

        if (context.managerReturn)
        {
            const latest = buildUnlinkRelationshipContext(context);
            const family = centralFamilyRecords().find(candidate => candidate.id === context.familyId);
            const childrenChanged = context.kind === 'partner'
                && JSON.stringify([...context.childrenIds].sort())
                    !== JSON.stringify([...(latest.childrenIds || [])].sort());
            if (!latest.ok || latest.familyId !== context.familyId
                || childrenChanged
                || getPerson(context.personId)?.projectId !== currentProjectId()
                || getPerson(context.relatedPersonId)?.projectId !== currentProjectId()
                || family?.projectId !== currentProjectId())
            {
                showToast(t('Relationship record not found.'));
                openManageRelationshipsModal(context.personId, context.sidebarContext, context.managerReturn);
                return;
            }
        }

        if (context.kind === 'parent' || context.kind === 'child')
        {
            result = unlinkParentChildRelationship({
                parentId: context.parentId,
                childId: context.childId,
                familyId: context.familyId
            });
        }

        if (context.kind === 'partner')
        {
            const keepChildrenWithParentId = modalBackdrop.querySelector('input[name="unlinkKeepChildrenWith"]:checked')?.value || '';

            result = unlinkPartnerRelationship({
                familyId: context.familyId,
                keepChildrenWithParentId
            });
        }

        if (!result?.ok)
        {
            showToast(result?.message || 'Relationship could not be unlinked.');
            return;
        }

        modalBackdrop.beforeClose = null;
        refreshAfterRelationshipChange(
            context.personId,
            context.sidebarContext
        );
        if (context.managerReturn)
        {
            openManageRelationshipsModal(
                context.managerReturn.personId,
                context.managerReturn.sidebarContext,
                context.managerReturn
            );
        }
    });
}

function buildRelationshipEditContext(raw = {})
{
    const kind =
        String(raw.kind || '').toLowerCase();

    const personId =
        String(raw.personId || '');

    const relatedPersonId =
        String(raw.relatedPersonId || '');

    const familyId =
        String(raw.familyId || '');

    const sidebarContext =
        raw.sidebarContext || 'tree';

    if (!personId || !relatedPersonId)
    {
        return {
            ok: false,
            message: 'Relationship information is missing.'
        };
    }

    if (kind === 'sibling')
    {
        return {
            ok: false,
            message:
            'Sibling relationships are derived from shared parents.'
        };
    }

    if (kind === 'parent')
    {
        const family =
            unlinkFindCentralFamilyForParentChild(
                relatedPersonId,
                personId,
                familyId
            );

        return {
            ok: Boolean(family),
            message: family
                ? ''
                : 'Relationship record not found.',
            kind,
            sidebarContext,
            personId,
            relatedPersonId,
            family,
            familyId: family?.id || familyId,
            parentId: relatedPersonId,
            childId: personId
        };
    }

    if (kind === 'child')
    {
        const family =
            unlinkFindCentralFamilyForParentChild(
                personId,
                relatedPersonId,
                familyId
            );

        return {
            ok: Boolean(family),
            message: family
                ? ''
                : 'Relationship record not found.',
            kind,
            sidebarContext,
            personId,
            relatedPersonId,
            family,
            familyId: family?.id || familyId,
            parentId: personId,
            childId: relatedPersonId
        };
    }

    if (kind === 'partner')
    {
        const family =
            unlinkFindCentralPartnerFamily(
                personId,
                relatedPersonId,
                familyId
            );

        return {
            ok: Boolean(family),
            message: family
                ? ''
                : 'Relationship record not found.',
            kind,
            sidebarContext,
            personId,
            relatedPersonId,
            family,
            familyId: family?.id || familyId
        };
    }

    return {
        ok: false,
        message: 'Unsupported relationship type.'
    };
}

function relationshipEditPersonName(personId)
{
    return formatPersonFullName(getPerson(personId))
        || 'Unknown person';
}

function renderParentChildRelationshipEditFields(
    context
)
{
    const currentType = parentChildRelationshipType(
        context.family,
        context.parentId,
        context.childId
    );
    const parentName = translateText(
        relationshipEditPersonName(context.parentId)
    );
    const childName = translateText(
        relationshipEditPersonName(context.childId)
    );
    const description = t(
        'Choose how to describe {parent}\'s relationship to {child}. They will stay connected in the Family Tree.'
    )
        .replace('{parent}', parentName)
        .replace('{child}', childName);

    return `
        <div class="field add-person-select-field">
          <label for="relationshipEditParentChildType">
            ${escapeHtml(parentChildRelationshipTypeFieldLabel())}
          </label>

          <select
            class="compact-select add-person-select"
            id="relationshipEditParentChildType">
            ${parentChildRelationshipTypeOptions(
                currentType
            )}
          </select>

          <span
            class="add-person-select-chevron"
            aria-hidden="true">
            ${icon.chevron}
          </span>
        </div>

        <div class="panel-muted">
          ${escapeHtml(description)}
        </div>
      `;
}

function renderPartnerRelationshipEditFields(
    context
)
{
    const family = context.family;

    const relationshipType =
        familyRelationshipType(family);

    const startEvent =
        partnerRelationshipStartEvent(
            family,
            relationshipType
        );

    const marriageType =
        startEvent.typeLabel
        || 'Civil';

    const showMarriageType =
        addPersonRelationshipShowsMarriageType(
            relationshipType
        );

    return `
        <div class="field add-person-select-field">
          <label for="relationshipEditType">
            Relationship type
          </label>

          <select
            class="compact-select add-person-select"
            id="relationshipEditType">
            ${addPersonRelationshipTypeOptions(
                relationshipType
            )}
          </select>

          <span
            class="add-person-select-chevron"
            aria-hidden="true">
            ${icon.chevron}
          </span>
        </div>

        <div data-relationship-edit-fields>
          ${renderPartnerRelationshipDateFields({
                prefix: 'relationshipEdit',
                relationshipType,
                family
            })}
        </div>

        <div
          class="field add-person-select-field"
          data-relationship-edit-marriage-type
          ${showMarriageType ? '' : 'hidden'}>

          <label for="relationshipEditMarriageType">
            Marriage type
          </label>

          <select
            class="compact-select add-person-select"
            id="relationshipEditMarriageType">
            ${addPersonMarriageTypeOptions(
                marriageType
            )}
          </select>

          <span
            class="add-person-select-chevron"
            aria-hidden="true">
            ${icon.chevron}
          </span>
        </div>
      `;
}

function renderRelationshipEditModal(context)
{
    const personName =
        relationshipEditPersonName(context.personId);

    const relatedName =
        relationshipEditPersonName(
            context.relatedPersonId
        );

    return `
        <div
          class="modal relationship-edit-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="relationshipEditTitle">

          <div class="modal-header">
            <div>
              <h2 id="relationshipEditTitle">
                Edit relationship
              </h2>

              <p>
                ${escapeHtml(personName)}
                and
                ${escapeHtml(relatedName)}
              </p>
            </div>

            <button
              class="close-button"
              type="button"
              data-close>
              ${icon.close}
            </button>
          </div>

          <div class="modal-body form-grid">
            ${context.kind === 'partner'
                ? renderPartnerRelationshipEditFields(
                    context
                )
                : renderParentChildRelationshipEditFields(
                    context
                )}
          </div>

          <div class="modal-footer">
            <button
              class="button secondary"
              type="button"
              data-close>
              Cancel
            </button>

            <button
              class="button primary"
              type="button"
              data-save-relationship-edit>
              Save relationship
            </button>
          </div>
        </div>
      `;
}

function relationshipEditSnapshot(root)
{
    if (!root) return '';
    return JSON.stringify([...root.querySelectorAll('input, select, textarea')]
        .filter(control => control.type !== 'search')
        .map(control => [control.id || control.name || '', control.value,
            control.type === 'checkbox' || control.type === 'radio' ? control.checked : null,
            control.dataset.selectedPlaceId || '']));
}

function relationshipEditFieldsValid(context)
{
    if (!context?.ok) return false;
    if (context.kind !== 'partner')
    {
        return PARENT_CHILD_RELATIONSHIP_TYPES.includes(
            modalBackdrop.querySelector('#relationshipEditParentChildType')?.value
        );
    }
    const type = modalBackdrop.querySelector('#relationshipEditType')?.value;
    if (!ADD_PERSON_RELATIONSHIP_TYPES.includes(type)) return false;
    const start = collectGenealogyDateField('relationshipEditStartDate');
    const end = partnerRelationshipDefinition(type).hasEnd
        ? collectGenealogyDateField('relationshipEditEndDate') : null;
    return Boolean(start && (!partnerRelationshipDefinition(type).hasEnd
        || (end && partnerRelationshipDateOrderIsValid(start, end))));
}

function bindPartnerRelationshipEditFields(root = modalBackdrop)
{
    bindGenealogyDateFields(root);
    bindPlaceComboboxes(root);
    bindNameAffixComboboxes(root);
    const typeSelect = root.querySelector('#relationshipEditType');
    const update = () => { if (typeSelect) updatePartnerRelationshipFields(root, typeSelect.value); };
    typeSelect?.addEventListener('change', update);
    update();
}

function saveRelationshipEdit(context)
{
    const latest = buildRelationshipEditContext(context);
    const family = centralFamilyRecords().find(candidate => candidate.id === context.familyId);
    if (!latest.ok || latest.familyId !== context.familyId || family?.projectId !== currentProjectId()
        || getPerson(context.personId)?.projectId !== currentProjectId()
        || getPerson(context.relatedPersonId)?.projectId !== currentProjectId())
    {
        showToast(t('Relationship record not found.'));
        return false;
    }
    if (!relationshipEditFieldsValid(latest))
    {
        showToast(t('Check the relationship details before saving.'));
        return false;
    }

    if (latest.kind === 'partner')
    {
        const relationshipType = modalBackdrop.querySelector('#relationshipEditType').value;
        const definition = partnerRelationshipDefinition(relationshipType);
        upsertPartnerRelationshipEvents(family, {
            relationshipType,
            marriageType: addPersonRelationshipShowsMarriageType(relationshipType)
                ? modalBackdrop.querySelector('#relationshipEditMarriageType')?.value || 'Civil' : '',
            startDate: collectGenealogyDateField('relationshipEditStartDate'),
            startPlace: readPlaceInputValue('#relationshipEditStartPlace', modalBackdrop),
            endDate: definition.hasEnd ? collectGenealogyDateField('relationshipEditEndDate') : emptyGenealogyDate('Exact date'),
            endPlace: definition.hasEnd ? readPlaceInputValue('#relationshipEditEndPlace', modalBackdrop) : { text: '', selectedPlaceId: '' }
        });
    }
    else
    {
        const key = parentChildRelationshipKey(latest.parentId, latest.childId);
        family.parentChildTypes = {
            ...sanitizeParentChildTypes(family.parentChildTypes),
            [key]: modalBackdrop.querySelector('#relationshipEditParentChildType').value
        };
    }
    family.updatedAt = new Date().toISOString();
    markPrototypeSessionEdited();
    return true;
}

function bindRelationshipEditModal(context)
{
    if (context.kind === 'partner') bindPartnerRelationshipEditFields(modalBackdrop);

    modalBackdrop
        .querySelector(
            '[data-save-relationship-edit]'
        )
        ?.addEventListener('click', () =>
        {
            if (!saveRelationshipEdit(context)) return;
            refreshAfterRelationshipChange(
                context.personId,
                context.sidebarContext
            );

            showToast('Relationship updated.');
        });
}

function openRelationshipEditModal(
    rawContext = {}
)
{
    const context =
        buildRelationshipEditContext(rawContext);

    if (!context.ok)
    {
        showToast(
            context.message
          || 'Relationship cannot be edited.'
        );
        return;
    }

    openModal(
        renderRelationshipEditModal(context)
    );

    bindRelationshipEditModal(context);
}

