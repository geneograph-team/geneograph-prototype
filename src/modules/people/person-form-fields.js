function cleanEditFieldValue(value)
{
    const text = String(value || '').trim();

    if (!text) return '';
    if (text === '-' || text === '—') return '';
    if (text.toLowerCase() === 'unknown') return '';

    return text;
}

const RELIGION_VALUES = Object.freeze([
    'Unknown',
    'Orthodox',
    'Catholic',
    'Jewish',
    'Muslim',
    'Other'
]);

const DEFAULT_RELIGION = 'Unknown';

function normalizeReligionValue(value)
{
    if (
        typeof value !== 'string'
        && typeof value !== 'number'
    )
    {
        return DEFAULT_RELIGION;
    }

    const text = String(value).trim();

    if (
        !text
        || text === '-'
        || text === '—'
    )
    {
        return DEFAULT_RELIGION;
    }

    const canonicalValue = RELIGION_VALUES.find(
        option =>
            option.toLowerCase() === text.toLowerCase()
    );

    /*
      * Preserve imported or legacy values that are not yet
      * part of the predefined option list.
      */
    return canonicalValue || text;
}

function religionFieldOptions(selectedValue)
{
    const selected =
        normalizeReligionValue(selectedValue);

    return RELIGION_VALUES.includes(selected)
        ? [...RELIGION_VALUES]
        : [selected, ...RELIGION_VALUES];
}

function renderReligionField({
    id,
    value = DEFAULT_RELIGION,
    className = '',
    label = 'Religion'
} = {})
{
    if (!id) return '';

    const selected = normalizeReligionValue(value);
    const options = religionFieldOptions(selected);

    const fieldClass = [
        'field',
        className
    ].filter(Boolean).join(' ');

    return `
        <div class="${escapeHtml(fieldClass)}">
          <label for="${escapeHtml(id)}">
            ${escapeHtml(label)}
          </label>

          <div class="common-select-shell">
            <select
              class="compact-select common-select"
              id="${escapeHtml(id)}">

              ${options.map(option => `
                <option
                  value="${escapeHtml(option)}"
                  ${option === selected ? 'selected' : ''}>
                  ${escapeHtml(option)}
                </option>
              `).join('')}
            </select>

            <span
              class="common-select-chevron"
              aria-hidden="true">
              ${icon.chevron}
            </span>
          </div>
        </div>
      `;
}

function readReligionField(
    root,
    fieldId
)
{
    if (!root || !fieldId)
    {
        return DEFAULT_RELIGION;
    }

    const field = root.querySelector(
        `#${CSS.escape(fieldId)}`
    );

    return normalizeReligionValue(field?.value);
}

function genderLabelFromPerson(person)
{
    const gender = String(person?.gender || '').toLowerCase();

    if (gender === 'male') return 'Male';
    if (gender === 'female') return 'Female';

    return 'Unknown';
}

function editDateValue(event)
{
    return formatGenealogyDateLabel(event);
}

function editPlaceValue(placeId, fallbackText = '')
{
    return placeInputDisplayValue(placeId, fallbackText);
}

function editPersonFormValues(person)
{
    return {
        firstName: cleanEditFieldValue(person?.names?.first),
        lastName: cleanEditFieldValue(person?.names?.last),
        middleName: cleanEditFieldValue(person?.names?.middle),
        maidenName: cleanEditFieldValue(person?.names?.maiden),

        gender: genderLabelFromPerson(person),
        livingStatus: normalizeLivingStatus(person?.livingStatus),

        birthDate: editDateValue(person?.birth),
        birthPlace: editPlaceValue(person?.birth?.placeId, person?.birth?.placeText),

        deathDate: editDateValue(person?.death),
        deathPlace: editPlaceValue(person?.death?.placeId, person?.death?.placeText),
        deathReason: cleanEditFieldValue(person?.death?.reason),
        burialPlace: editPlaceValue(person?.death?.burialPlaceId, person?.death?.burialPlaceText)
    };
}

function renderPlaceCombobox({
    id,
    label,
    value = '',
    selectedPlaceId = '',
    addressValue = '',
    showAddress = true,
    placeholder = 'Search or type a place',
    className = '',
    inputAttrs = '',
    createOptionLabel = 'Create place from entered text'
} = {})
{
    const listId =
        `${id}PlaceList`;

    const addressFieldsId =
        `${id}AddressFields`;

    const hasAddress =
        Boolean(
            String(addressValue || '').trim()
        );

    const addressAction =
        hasAddress
            ? '- Remove address'
            : '+ Add address';

    return `<div class="field place-combobox-field ${escapeHtml(className)}" data-place-combobox data-place-create-label="${escapeHtml(createOptionLabel)}">
        <label for="${escapeHtml(id)}">${escapeHtml(label)}</label>

        <div class="place-combobox-shell">
          <input
            id="${escapeHtml(id)}"
            value="${escapeHtml(localizedDataFieldValue(value))}"
            data-source-value="${escapeHtml(value)}"
            placeholder="${escapeHtml(placeholder)}"
            autocomplete="off"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded="false"
            aria-controls="${escapeHtml(listId)}"
            data-place-input
            data-place-id="${escapeHtml(selectedPlaceId || '')}"
            ${inputAttrs}>

          <div
            class="place-combobox-list"
            id="${escapeHtml(listId)}"
            role="listbox"
            hidden>
          </div>
        </div>

        ${showAddress ? `
          <div
            class="place-address-disclosure ${hasAddress ? 'has-address' : ''}"
            data-place-address-disclosure>

            <button
              class="place-address-toggle ${hasAddress ? 'is-remove' : ''}"
              type="button"
              data-place-address-toggle
              aria-expanded="${hasAddress ? 'true' : 'false'}"
              aria-controls="${escapeHtml(addressFieldsId)}">

              <span data-place-address-toggle-label>
                ${escapeHtml(t(addressAction))}
              </span>
            </button>

            <div
              class="place-address-fields"
              id="${escapeHtml(addressFieldsId)}"
              data-place-address-fields
              ${hasAddress ? '' : 'hidden'}>

              <label for="${escapeHtml(id)}Address">
                Address
              </label>

              <input
                id="${escapeHtml(id)}Address"
                data-place-address
                data-source-value="${escapeHtml(addressValue)}"
                value="${escapeHtml(localizedDataFieldValue(addressValue))}"
                placeholder="Street, house, parish, or site details">
            </div>
          </div>
        ` : ''}
      </div>`;
}

function educationInstitutionTypeOptions(selected = '')
{
    const options = [
        'Unknown',
        'School',
        'University',
        'College',
        'Seminary',
        'Apprenticeship',
        'Private tutoring',
        'Military academy',
        'Religious instruction',
        'Home education',
        'Other'
    ];

    const current = cleanEditFieldValue(selected || 'Unknown');
    if (!options.includes(current)) options.push(current);

    return options
        .map(value => `<option value="${escapeHtml(value)}" ${value === current ? 'selected' : ''}>${escapeHtml(value)}</option>`)
        .join('');
}

function educationValueLabel(attribute)
{
    const value = cleanEditFieldValue(attribute?.value);
    return value && value !== 'Education' ? value : '';
}

function educationInstitutionLabel(attribute)
{
    return cleanEditFieldValue(attribute?.institutionName || attribute?.agency);
}

function educationInstitutionTypeLabel(attribute)
{
    return cleanEditFieldValue(attribute?.institutionType || attribute?.type);
}

function educationPrimaryLabel(attribute)
{
    return educationInstitutionLabel(attribute)
        || educationValueLabel(attribute)
        || 'Education';
}

function educationTimelineDescription(attribute)
{
    const primary = educationPrimaryLabel(attribute);
    const credential = educationValueLabel(attribute);

    if (credential && credential !== primary)
    {
        return `${primary} - ${credential}`;
    }

    return primary;
}

function renderCustomFactFields(
    idPrefix,
    fact = null
)
{
    const type =
        cleanEditFieldValue(fact?.type);

    const value =
        cleanEditFieldValue(fact?.value);

    const notes =
        cleanEditFieldValue(fact?.notes);

    const date =
        fact?.date
          || emptyGenealogyDate('Exact date');

    return `
        <div
          class="field full custom-fact-field"
          data-custom-fact-field="type">

          <label for="${escapeHtml(idPrefix)}Type">
            ${escapeHtml(t('Fact name'))} <span class="custom-fact-required" aria-hidden="true">*</span>
          </label>

          <input
            id="${escapeHtml(idPrefix)}Type"
            value="${escapeHtml(type)}"
            placeholder="e.g. Skill, membership, physical description"
            aria-required="true"
            aria-describedby="
              ${escapeHtml(idPrefix)}TypeHelp
              ${escapeHtml(idPrefix)}TypeError
            ">

          <div
            class="custom-fact-help"
            id="${escapeHtml(idPrefix)}TypeHelp">
            *Required. Use a short category that describes the fact.
          </div>

          <div
            class="custom-fact-error"
            id="${escapeHtml(idPrefix)}TypeError"
            aria-live="polite">
          </div>
        </div>

        <div
          class="field full custom-fact-field"
          data-custom-fact-field="content">

          <label for="${escapeHtml(idPrefix)}Value">
            Fact details
          </label>

          <input
            id="${escapeHtml(idPrefix)}Value"
            value="${escapeHtml(value)}"
            placeholder="e. g. Woodworking, served in the army, etc."
            aria-describedby="${escapeHtml(idPrefix)}ContentError">

          <div
            class="custom-fact-error"
            id="${escapeHtml(idPrefix)}ContentError"
            aria-live="polite">
          </div>
        </div>

        ${renderGenealogyDateField(
            `${idPrefix}Date`,
            'Date or period',
            date,
            {
                inputId: `${idPrefix}DateInput`,
                typeId: `${idPrefix}DateType`,
                defaultDateType: 'Exact date',
                placeholder: 'e.g. 14 Feb 1915',
                className:
              'full genealogy-date-inline-range'
            }
        )}

        ${renderPlaceCombobox({
            id: `${idPrefix}Place`,
            label: 'Place',
            value: editPlaceValue(
                fact?.placeId,
                fact?.placeText
            ),
            selectedPlaceId:
            fact?.placeId || '',
            addressValue: fact?.address || '',
            placeholder:
            'Search or type a place',
            className: 'full'
        })}

        <div class="field full">
          <label for="${escapeHtml(idPrefix)}Notes">
            Notes
          </label>

          <textarea
            id="${escapeHtml(idPrefix)}Notes"
            placeholder="Research context or additional details">${escapeHtml(notes)}</textarea>
        </div>`;
}

function addPersonFactDefinitions()
{
    return [
        { id: 'prefix', label: 'Prefix', icon: icon.info || icon.plus },
        { id: 'suffix', label: 'Suffix', icon: icon.info || icon.plus },
        { id: 'causeOfDeath', label: 'Cause of death', icon: icon.death || icon.plus },
        { id: 'burialPlace', label: 'Burial place', icon: icon.mapPin || icon.plus },
        { id: 'education', label: 'Education', icon: icon.education || icon.plus },
        { id: 'occupation', label: 'Occupation', icon: icon.work || icon.placeholder || icon.plus },
        { id: 'religion', label: 'Religion', icon: icon.religion || icon.plus },
        { id: 'baptism', label: 'Baptism', icon: icon.baptism || icon.plus },
        { id: 'customFact', label: 'Custom fact', icon: icon.info || icon.plus },
        { id: 'alternativeNames', label: 'Alternative names', icon: icon.people || icon.plus }
    ];
}

function addPersonAddedFactsFromPerson(person)
{
    if (!person) return [];
    ensurePersonCentralStructures(person);
    const details = peopleProfileDetailsFor({ id: person.id });
    const facts = [];
    if (cleanEditFieldValue(person.names?.prefix || details.prefix)) facts.push('prefix');
    if (cleanEditFieldValue(person.names?.suffix || details.suffix)) facts.push('suffix');
    if (cleanEditFieldValue(person.death?.cause || person.death?.reason)) facts.push('causeOfDeath');
    if (editPlaceValue(person.death?.burialPlaceId) || cleanEditFieldValue(person.death?.burialPlaceText) || hasGenealogyDateValue(personEventByTag(person, 'BURI')?.date)) facts.push('burialPlace');
    if (cleanEditFieldValue(person.profile?.alternativeNames || details.alternativeNames)) facts.push('alternativeNames');
    if (person.attributes.some(record => record.tag === 'EDUC')) facts.push('education');
    if (person.attributes.some(record => record.tag === 'OCCU')) facts.push('occupation');
    if (personHasReligionFact(person)) facts.push('religion');
    if (personHasBaptismFact(person)) facts.push('baptism');
    if (personAttributeByTag(person, 'FACT'))
    {
        facts.push('customFact');
    }

    const allowed = new Set(addPersonFactDefinitions().map(fact => fact.id));
    return [...new Set(facts)].filter(factId => allowed.has(factId));
}

function addPersonFactDefinition(factId)
{
    return addPersonFactDefinitions().find(fact => fact.id === factId) || addPersonFactDefinitions()[0];
}

function addPersonFactCardHtml(factId, person = null)
{
    if (REPEATABLE_PERSON_FACTS[factId]) return renderRepeatableFactList(person, REPEATABLE_PERSON_FACTS[factId]);
    const definition = addPersonFactDefinition(factId) || {
        id: factId,
        label: 'Additional fact',
        icon: icon.info
    };
    const centralPerson = person ? ensurePersonCentralStructures(person) : null;
    const details = centralPerson ? peopleProfileDetailsFor({ id: centralPerson.id }) : defaultPeopleProfileDetails();
    const death = centralPerson?.death || {};
    const baptism = centralPerson ? personEventByTag(centralPerson, 'BAPM') : null;
    const prefixValue = cleanEditFieldValue(centralPerson?.names?.prefix || details.prefix);
    const suffixValue = cleanEditFieldValue(centralPerson?.names?.suffix || details.suffix);
    const header = `<div class="add-person-fact-card-header"><div class="add-person-fact-card-title"><span class="fact-button-icon" aria-hidden="true">${definition.icon}</span><span>${escapeHtml(definition.label)}</span></div><button class="add-person-fact-remove" type="button" data-add-person-remove-fact="${escapeHtml(factId)}" aria-label="${escapeHtml(t('Remove fact'))}" title="${escapeHtml(t('Remove fact'))}">${icon.trash}</button></div>`;
    const fieldWrap = content => `<div class="add-person-fact-card" data-add-person-fact-card="${escapeHtml(factId)}">${header}<div class="add-person-fact-grid">${content}</div></div>`;
    if (factId === 'prefix')
    {
        return fieldWrap(renderNameAffixCombobox({ id: 'addPersonFactPrefix', label: 'Prefix', value: prefixValue, kind: 'prefix', className: 'full' }));
    }
    if (factId === 'suffix')
    {
        return fieldWrap(renderNameAffixCombobox({ id: 'addPersonFactSuffix', label: 'Suffix', value: suffixValue, kind: 'suffix', className: 'full' }));
    }
    if (factId === 'causeOfDeath')
    {
        return fieldWrap(`<div class="field full"><label for="addPersonFactCauseOfDeath">Cause of death</label><input id="addPersonFactCauseOfDeath" value="${escapeHtml(cleanEditFieldValue(death.reason || death.cause))}" placeholder="Cause or reason"></div>`);
    }
    if (factId === 'burialPlace')
    {
        return fieldWrap(renderGenealogyDateField('addPersonBurial', 'Burial date', personEventByTag(centralPerson, 'BURI')?.date, { className: 'full genealogy-date-inline-range' }) + renderPlaceCombobox({
            id: 'addPersonFactBurialPlace',
            label: 'Burial place',
            value: editPlaceValue(death.burialPlaceId, death.burialPlaceText),
            selectedPlaceId: death.burialPlaceId || '',
            addressValue: death.burialAddress || '',
            placeholder: 'e.g. Old Cattery, England',
            className: 'full'
        }));
    }
    if (factId === 'religion')
    {
        return fieldWrap(
            renderReligionField({
                id: 'addPersonFactReligion',
                value: details.religion,
                className: 'full'
            })
        );
    }
    if (factId === 'baptism')
    {
        return fieldWrap(`${renderGenealogyDateField('addPersonFactBaptism', 'Baptism date', details.baptismDate, {
            inputId: 'addPersonFactBaptismDate',
            typeId: 'addPersonFactBaptismDateType',
            className: 'full genealogy-date-inline-range',
            defaultDateType: 'Exact date',
            placeholder: 'e.g. 14 Feb 1915'
        })}
          ${renderPlaceCombobox({
            id: 'addPersonFactBaptismPlace',
            label: 'Baptism place',
            value: editPlaceValue(baptism?.placeId, baptism?.placeText || details.baptismPlace),
            selectedPlaceId: baptism?.placeId || '',
            addressValue: baptism?.address || '',
            placeholder: 'Search or type a place',
            className: 'full'
        })}`);
    }
    return fieldWrap(`<div class="field full"><label for="addPersonFactAlternativeNames">Alternative names</label><input id="addPersonFactAlternativeNames" value="${escapeHtml(details.alternativeNames || '')}" placeholder="Nickname, spelling variant, or former name"></div>`);
}

function formatAddPersonFactSummary(count)
{
    const numericCount = Number(count);

    const normalizedCount =
        Number.isFinite(numericCount)
            ? Math.max(0, Math.trunc(numericCount))
            : 0;

    return translateText(
        normalizedCount
            ? `${normalizedCount} added`
            : 'Optional'
    );
}

function renderAddPersonAdditionalFacts(person = null)
{
    const activeFacts = addPersonAddedFactsFromPerson(person);
    const expanded = activeFacts.length > 0;
    const definitions = addPersonFactDefinitions();
    return `<section class="add-person-additional-section">
        <div class="add-person-facts-section" data-add-person-facts>
          <button class="add-person-facts-header" type="button" data-add-person-facts-toggle aria-expanded="${expanded ? 'true' : 'false'}">
            <span class="add-person-facts-header-main"><span class="add-person-facts-chevron" aria-hidden="true">${icon.chevron}</span><span>Additional facts</span></span>
            <span class="add-person-facts-meta" data-add-person-facts-count>${escapeHtml(formatAddPersonFactSummary(activeFacts.length))}</span>
          </button>
          <div class="add-person-facts-body" data-add-person-facts-body ${expanded ? '' : 'hidden'}>
            <div class="fact-buttons" data-add-person-fact-buttons>
              ${definitions.map(fact => `<button class="fact-button ${REPEATABLE_PERSON_FACTS[fact.id] ? 'fact-button-repeatable' : ''} ${activeFacts.includes(fact.id) && !REPEATABLE_PERSON_FACTS[fact.id] ? 'is-added' : ''}" type="button" data-add-person-add-fact="${escapeHtml(fact.id)}" ${activeFacts.includes(fact.id) && !REPEATABLE_PERSON_FACTS[fact.id] ? 'disabled' : ''}>${REPEATABLE_PERSON_FACTS[fact.id] ? `<span class="fact-button-plus" aria-hidden="true">${icon.plus}</span>` : ''}<span class="fact-button-icon" aria-hidden="true">${fact.icon}</span><span>${escapeHtml(fact.label)}</span></button>`).join('')}
            </div>
            <div class="add-person-facts-added" data-add-person-facts-added>${activeFacts.map(factId => addPersonFactCardHtml(factId, person)).join('')}</div>
          </div>
        </div>
      </section>`;
}


