function parentChildRelationshipKey(
    parentId,
    childId
)
{
    return `${parentId || ''}|${childId || ''}`;
}

function parentChildRelationshipType(
    family,
    parentId,
    childId
)
{
    const key = parentChildRelationshipKey(
        parentId,
        childId
    );

    return normalizeParentChildRelationshipType(
        family?.parentChildTypes?.[key]
    );
}

function parentChildRelationshipTypeOptions(
    selected = 'Biological'
)
{
    const active =
        normalizeParentChildRelationshipType(selected);

    return PARENT_CHILD_RELATIONSHIP_TYPES
        .map(value => `
          <option
            value="${escapeHtml(value)}"
            ${value === active ? 'selected' : ''}>
            ${escapeHtml(translateText(value))}
          </option>
        `)
        .join('');
}

function setParentChildRelationshipType(
    family,
    parentId,
    childId,
    value = 'Biological'
)
{
    if (!family || !parentId || !childId) return;

    const key = parentChildRelationshipKey(
        parentId,
        childId
    );

    family.parentChildTypes = {
        ...sanitizeParentChildTypes(
            family.parentChildTypes
        ),
        [key]:
          normalizeParentChildRelationshipType(value)
    };
}

function removeParentChildRelationshipType(
    family,
    parentId,
    childId
)
{
    if (!family || !parentId || !childId) return;

    const key = parentChildRelationshipKey(
        parentId,
        childId
    );

    const next = {
        ...sanitizeParentChildTypes(
            family.parentChildTypes
        )
    };

    delete next[key];
    family.parentChildTypes = next;
}

function relationBirthMeta(person)
{
    return person?.birth?.dateLabel
        || person?.birth?.date
        || '';
}

function relationGender(person)
{
    return String(person?.gender || '').toLowerCase();
}

function parentRelationLabel(person)
{
    if (relationGender(person) === 'male')
    {
        return 'Father';
    }

    if (relationGender(person) === 'female')
    {
        return 'Mother';
    }

    return 'Parent';
}

function siblingRelationLabel(person)
{
    if (relationGender(person) === 'male')
    {
        return 'Brother';
    }

    if (relationGender(person) === 'female')
    {
        return 'Sister';
    }

    return 'Sibling';
}

function childRelationLabel(person)
{
    if (relationGender(person) === 'male')
    {
        return 'Son';
    }

    if (relationGender(person) === 'female')
    {
        return 'Daughter';
    }

    return 'Child';
}

function relationMeta(
    label,
    person,
    qualifier = ''
)
{
    const relationshipLabel = [
        label,
        qualifier
    ].filter(Boolean).join(' · ');

    const birth = relationBirthMeta(person);

    return [
        relationshipLabel,
        birth
    ].filter(Boolean).join(' - ');
}

function partnerRelationshipDateSummary(family)
{
    const type = relationshipTypeFromLegacy(family);
    const definition = partnerRelationshipDefinition(type);
    const startEvent = partnerRelationshipStartEvent(family, type);
    const endEvent = partnerRelationshipEndEvent(family, type);
    const startLabel = formatGenealogyDateLabel(startEvent?.date);
    const endLabel = definition.hasEnd
        ? formatGenealogyDateLabel(endEvent?.date)
        : '';

    return {
        startLabel,
        endLabel,
        rangeLabel: startLabel && endLabel
            ? `${startLabel} – ${endLabel}`
            : startLabel
                ? (definition.hasEnd ? `From ${startLabel}` : startLabel)
                : endLabel
                    ? `To ${endLabel}`
                    : ''
    };
}

function partnerRelationshipMeta(family)
{
    const type = relationshipTypeFromLegacy(family);
    const displayType = type === 'Unknown relationship' ? 'Partner' : type;
    const date = partnerRelationshipDateSummary(family).rangeLabel;
    return [displayType, date].filter(Boolean).join(' · ');
}

function getRelationshipGroups(personId)
{
    const parents = getParents(personId);
    const siblings = getSiblings(personId);
    const partnerRelationships =
        getPartnerRelationships(personId);
    const children = getChildren(personId);

    return [
        {
            title: 'Parents',
            items: parents.map(parent =>
            {
                const family =
                    unlinkFindCentralFamilyForParentChild(
                        parent.id,
                        personId
                    );

                const type = parentChildRelationshipType(
                    family,
                    parent.id,
                    personId
                );

                return {
                    kind: 'parent',
                    person: parent,
                    personId,
                    relatedPersonId: parent.id,
                    familyId: family?.id || '',
                    meta: relationMeta(
                        parentRelationLabel(parent),
                        parent,
                        type === 'Biological' ? '' : type
                    ),
                    canEdit: true,
                    canUnlink: true
                };
            })
        },
        {
            title: 'Siblings',
            items: siblings.map(sibling => ({
                kind: 'sibling',
                person: sibling,
                personId,
                relatedPersonId: sibling.id,
                familyId: '',
                meta: relationMeta(
                    siblingRelationLabel(sibling),
                    sibling
                ),
                canEdit: false,
                canUnlink: false
            }))
        },
        {
            title: 'Partners',
            items: partnerRelationships
                .map(relationship =>
                {
                    const partner = getRelationshipPartner(
                        relationship,
                        personId
                    );

                    if (!partner) return null;

                    return {
                        kind: 'partner',
                        person: partner,
                        personId,
                        relatedPersonId: partner.id,
                        familyId: relationship.id || '',
                        meta: partnerRelationshipMeta(relationship),
                        canEdit: true,
                        canUnlink: true
                    };
                })
                .filter(Boolean)
        },
        {
            title: 'Children',
            items: children.map(child =>
            {
                const family =
                    unlinkFindCentralFamilyForParentChild(
                        personId,
                        child.id
                    );

                const type = parentChildRelationshipType(
                    family,
                    personId,
                    child.id
                );

                return {
                    kind: 'child',
                    person: child,
                    personId,
                    relatedPersonId: child.id,
                    familyId: family?.id || '',
                    meta: relationMeta(
                        childRelationLabel(child),
                        child,
                        type === 'Biological' ? '' : type
                    ),
                    canEdit: true,
                    canUnlink: true
                };
            })
        }
    ];
}

function renderRelation(item)
{
    const person = item?.person;

    if (!person) return '';

    const name =
        person.names?.display || 'Unnamed person';

    const actions =
        item.canEdit || item.canUnlink
            ? `
            <div
              class="relation-actions"
              aria-label="Relationship actions">

              ${item.canEdit
                    ? `
                  <button
                    class="relation-action-button"
                    type="button"
                    aria-label="Edit relationship with ${escapeHtml(name)}"
                    data-edit-relationship>
                    ${icon.edit}
                  </button>
                `
                    : ''}

              ${item.canUnlink
                    ? `
                  <button
                    class="relation-action-button danger"
                    type="button"
                    aria-label="Unlink ${escapeHtml(name)}"
                    title="Unlink relationship"
                    data-unlink-relationship>
                    ${icon.unlink}
                  </button>
                `
                    : ''}
            </div>
          `
            : '';

    return `
        <div
          class="relation-row"
          data-relationship-row
          data-relationship-kind="${escapeHtml(item.kind)}"
          data-relationship-person-id="${escapeHtml(item.personId)}"
          data-relationship-related-person-id="${escapeHtml(item.relatedPersonId)}"
          data-relationship-family-id="${escapeHtml(item.familyId)}">

          <button
            class="relation-row-main"
            type="button"
            data-select-relationship-person="${escapeHtml(person.id)}"
            aria-label="Select ${escapeHtml(name)}">

            ${renderPersonAvatar(
                person,
                'small-avatar',
                {
                    element: 'span',
                    decorative: true
                }
            )}

            <span class="relation-row-copy">
              <strong>${escapeHtml(name)}</strong>
              <span>${escapeHtml(item.meta)}</span>
            </span>
          </button>

          ${actions}
        </div>
      `;
}

function renderRelationshipGroup(group)
{
    if (!group?.items?.length) return '';

    return `
        <section class="relationship-group">
          <div class="relation-group-title">
            ${escapeHtml(group.title)}
          </div>

          <div>
            ${group.items.map(renderRelation).join('')}
          </div>
        </section>
      `;
}

function relationshipCount(personId)
{
    return getRelationshipGroups(personId)
        .reduce(
            (total, group) =>
                total + group.items.length,
            0
        );
}

function renderRelationships(personId)
{
    const groups = getRelationshipGroups(personId)
        .map(renderRelationshipGroup)
        .filter(Boolean);

    if (!groups.length)
    {
        return `
          <div class="panel-muted">
            No immediate relationships recorded for this person.
          </div>
        `;
    }

    return `
        <div class="relationship-list">
          ${groups.join('')}
        </div>
      `;
}

function getGenderForRelativeType(relativeType)
{
    const map = {
        father: 'Male',
        mother: 'Female',
        son: 'Male',
        daughter: 'Female',
        brother: 'Male',
        sister: 'Female',
        parent: 'Unknown',
        child: 'Unknown',
        partner: 'Unknown'
    };

    return map[String(relativeType || '').toLowerCase()] || 'Unknown';
}

function statusDotClass(status)
{
    if (status === 'Deceased') return 'deceased';
    if (status === 'Unknown') return 'unknown';
    return 'living';
}

function normalizeLivingStatus(status)
{
    if (status === 'Deceased') return 'Deceased';
    if (status === 'Unknown') return 'Unknown';
    return 'Living';
}

function livingStatusChipTone(
    status
)
{
    const safeStatus =
        normalizeLivingStatus(
            status
        );

    if (
        safeStatus === 'Deceased'
    )
    {
        return 'app-chip--deceased';
    }

    if (
        safeStatus === 'Unknown'
    )
    {
        return 'app-chip--unknown';
    }

    return 'app-chip--living';
}

function renderLivingStatusChip(
    status
)
{
    const safeStatus =
        normalizeLivingStatus(
            status
        );

    return `
        <span
          class="
            app-chip
            ${livingStatusChipTone(
                safeStatus
            )}
            living-status-chip
          ">

          <span
            class="
              add-person-status-dot
              ${statusDotClass(
                    safeStatus
                )}
            "
            aria-hidden="true">
          </span>

          <span>
            ${escapeHtml(
                safeStatus
            )}
          </span>
        </span>
      `;
}

function normalizeConnectRelationshipType(type)
{
    const value = String(type || '').toLowerCase();

    if (['father', 'mother', 'parent'].includes(value)) return 'parent';
    if (['son', 'daughter', 'child'].includes(value)) return 'child';
    if (['brother', 'sister', 'sibling'].includes(value)) return 'sibling';
    if (['partner', 'spouse', 'husband', 'wife'].includes(value)) return 'partner';

    return 'parent';
}

function connectRelationshipLabel(type)
{
    const map = {
        parent: 'Parent',
        child: 'Child',
        sibling: 'Sibling',
        partner: 'Partner'
    };

    return map[normalizeConnectRelationshipType(type)] || 'Parent';
}

function connectRelationshipSentence(type)
{
    const map = {
        parent: 'parent',
        child: 'child',
        sibling: 'sibling',
        partner: 'partner'
    };

    return map[normalizeConnectRelationshipType(type)] || 'parent';
}

function connectRelativeText(key, values = {})
{
    return t(key).replace(/\{(\w+)\}/g, (match, name) =>
        Object.prototype.hasOwnProperty.call(values, name) ? translateText(String(values[name])) : match);
}

function connectedRelativeToast(personName, type)
{
    const messages = {
        parent: '{person} connected as parent.',
        child: '{person} connected as child.',
        sibling: '{person} connected as sibling.',
        partner: '{person} connected as partner.'
    };
    return connectRelativeText(messages[normalizeConnectRelationshipType(type)], { person: personName });
}

function connectPersonName(person)
{
    if (person?.meta?.placeholderRole === 'father'
        && ![person.names?.first, person.names?.middle, person.names?.last].some(Boolean))
        return t('Unknown father');
    return person?.names?.display || person?.name || 'Unknown person';
}

function connectPersonLifeLine(person)
{
    const birth = formatGenealogyDateLabel(person?.birth);
    const death = formatGenealogyDateLabel(person?.death);

    if (birth && death) return `${birth} - ${death}`;
    if (birth) return birth;
    if (death) return connectRelativeText('Died {date}', { date: death });

    return t('Dates unknown');
}

function connectPersonPlaceLine(person)
{
    return (
        getPlaceEventDisplay(
            person?.birth
        )
        || getPlaceEventDisplay(
            person?.death
        )
        || ''
    );
}

function connectPersonSearchText(person)
{
    return [
        connectPersonName(person),
        person?.names?.first,
        person?.names?.middle,
        person?.names?.last,
        person?.names?.maiden,
        connectPersonLifeLine(person),
        connectPersonPlaceLine(person)
    ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
}

function connectPersonExistingRelationships(anchorPersonId)
{
    const connected = new Map();
    const add = (personId, type) =>
    {
        if (!personId || personId === anchorPersonId) return;
        if (!connected.has(personId)) connected.set(personId, new Set());
        connected.get(personId).add(type);
    };

    getParents(anchorPersonId).forEach(person => add(person.id, 'parent'));
    getChildren(anchorPersonId).forEach(person => add(person.id, 'child'));
    getSiblings(anchorPersonId).forEach(person => add(person.id, 'sibling'));
    getPartnerRelationships(anchorPersonId).forEach(relationship =>
        add(familyPartnerId(relationship, anchorPersonId), 'partner')
    );

    return connected;
}

function connectPersonCandidateScore(person, anchorPerson, relationshipType, query)
{
    let score = 0;
    const type = normalizeConnectRelationshipType(relationshipType);
    const search = connectPersonSearchText(person);
    const q = String(query || '').trim().toLowerCase();

    if (q && search.includes(q)) score += 80;

    const anchorSurname = String(anchorPerson?.names?.last || '').toLowerCase();
    const personSurname = String(person?.names?.last || '').toLowerCase();

    if (anchorSurname && personSurname && anchorSurname === personSurname) score += 24;

    const anchorBirthPlace = getPlaceEventDisplay(anchorPerson?.birth).toLowerCase();
    const personBirthPlace = getPlaceEventDisplay(person?.birth).toLowerCase();

    if (anchorBirthPlace && personBirthPlace && anchorBirthPlace === personBirthPlace) score += 12;

    const gender = String(person?.gender || '').toLowerCase();

    if (type === 'parent')
    {
        const anchorSort = Number(anchorPerson?.birth?.sortDate || 0);
        const candidateSort = Number(person?.birth?.sortDate || 0);
        if (anchorSort && candidateSort && candidateSort < anchorSort) score += 18;
    }

    if (type === 'child')
    {
        const anchorSort = Number(anchorPerson?.birth?.sortDate || 0);
        const candidateSort = Number(person?.birth?.sortDate || 0);
        if (anchorSort && candidateSort && candidateSort > anchorSort) score += 18;
    }

    if (type === 'partner' && ['male', 'female', 'unknown'].includes(gender))
    {
        score += 4;
    }

    return score;
}

function connectPersonCandidates()
{
    const anchor = getPerson(connectPersonModalState.anchorPersonId);
    if (!anchor) return [];

    const query = String(connectPersonModalState.query || '').trim().toLowerCase();
    const relationshipType = connectPersonModalState.relationshipType
        ? normalizeConnectRelationshipType(connectPersonModalState.relationshipType) : '';
    const connected = connectPersonExistingRelationships(anchor.id);

    return getPeople(currentProjectId())
        .filter(person => person?.id && person.id !== anchor.id)
        .filter(person => !person.deleted)
        .filter(person => query || !connected.has(person.id))
        .filter(person => !query || connectPersonSearchText(person).includes(query))
        .map(person => ({
            person,
            score: connectPersonCandidateScore(person, anchor, relationshipType, query)
        }))
        .sort((a, b) => b.score - a.score || connectPersonName(a.person).localeCompare(connectPersonName(b.person)))
        .slice(0, query ? 12 : relationshipType ? 3 : 12)
        .map(item => item.person);
}

function connectPersonSelectedValidation()
{
    if (!connectPersonModalState.relationshipType) return { ok: false };
    if (!connectPersonModalState.selectedPersonId) return { ok: true };

    return validateRelationshipConnection({
        anchorPersonId: connectPersonModalState.anchorPersonId,
        relativePersonId: connectPersonModalState.selectedPersonId,
        relationshipType: connectPersonModalState.relationshipType,
        parentFamilySelection: connectPersonModalState.parentFamilySelection,
        detailType: connectPersonDetailType()
    });
}

function biologicalParentConflict(parentId, childId, additionalParentIds = [], genderOverride = '')
{
    const parents = parentIdsForPerson(childId).filter(id => id !== parentId &&
        centralFamilyRecords().some(family => unlinkFamilyChildrenIds(family).includes(childId)
            && familyIncludesPerson(family, id)
            && parentChildRelationshipType(family, id, childId) === 'Biological'));
    parents.push(...additionalParentIds.filter(id => id && id !== parentId && !parents.includes(id)));
    const role = String(genderOverride || getPerson(parentId)?.gender || '').toLowerCase();
    return parents.length >= 2 || (['male', 'female'].includes(role) && parents.some(id =>
        String(getPerson(id)?.gender || '').toLowerCase() === role));
}

function connectPersonDetailType()
{
    const type = normalizeConnectRelationshipType(connectPersonModalState.relationshipType);
    if (type === 'sibling' && connectPersonModalState.selectedPersonId
        && !parentIdsForPerson(connectPersonModalState.anchorPersonId).length
        && !parentIdsForPerson(connectPersonModalState.selectedPersonId).length)
        return 'Biological';
    if (connectPersonModalState.detailType) return connectPersonModalState.detailType;
    if (type === 'partner') return 'Married';
    if (type === 'parent' && parentIdsForPerson(connectPersonModalState.anchorPersonId)
        .filter(id => centralFamilyRecords().some(family => unlinkFamilyChildrenIds(family)
            .includes(connectPersonModalState.anchorPersonId) && familyIncludesPerson(family, id)
            && parentChildRelationshipType(family, id, connectPersonModalState.anchorPersonId) === 'Biological'))
        .length >= 2) return 'Adoptive';
    if (['child', 'sibling'].includes(type) && newPersonBiologicalConflict({
        anchorPersonId: connectPersonModalState.anchorPersonId,
        relationshipType: type
    }, connectPersonModalState.parentFamilySelection, 'Unknown')) return 'Adoptive';
    const pair = connectionPairForRelationship(connectPersonModalState.anchorPersonId,
        connectPersonModalState.selectedPersonId, type);
    if (pair.parentId && pair.childId)
    {
        const otherParent = type === 'child'
            ? familyPartnerId(parentFamilyChoices(pair.parentId, 'child')
                .find(choice => choice.value === connectPersonModalState.parentFamilySelection)?.family,
            pair.parentId) : '';
        return biologicalParentConflict(pair.parentId, pair.childId, otherParent ? [otherParent] : [])
            || (otherParent && biologicalParentConflict(otherParent, pair.childId, [pair.parentId]))
            ? 'Adoptive' : 'Biological';
    }
    if (type === 'sibling' && pair.siblingPersonId)
    {
        const choice = parentFamilyChoices(pair.anchorPersonId, 'sibling', pair.siblingPersonId)
            .find(item => item.value === connectPersonModalState.parentFamilySelection);
        const targetPersonId = choice?.sourcePersonId === pair.anchorPersonId
            ? pair.siblingPersonId : pair.anchorPersonId;
        if (choice?.parentIds.some(parentId => biologicalParentConflict(parentId, targetPersonId,
            choice.parentIds.filter(id => id !== parentId)))) return 'Adoptive';
    }
    return 'Biological';
}

function renderConnectPersonDetailSelector()
{
    const type = normalizeConnectRelationshipType(connectPersonModalState.relationshipType);
    if (!type) return '';
    const fixedBiological = type === 'sibling' && connectPersonModalState.selectedPersonId
        && !parentIdsForPerson(connectPersonModalState.anchorPersonId).length
        && !parentIdsForPerson(connectPersonModalState.selectedPersonId).length;
    const value = connectPersonDetailType();
    const options = fixedBiological
        ? `<option value="Biological">${escapeHtml(t('Biological'))}</option>`
        : type === 'partner'
        ? addPersonRelationshipTypeOptions(value)
        : parentChildRelationshipTypeOptions(value);
    return `<div class="field add-person-select-field connect-person-detail-field">
      <label for="connectPersonDetailType">${escapeHtml(t('Relationship type'))}</label>
      <select class="compact-select add-person-select" id="connectPersonDetailType" data-connect-detail-type ${fixedBiological ? 'disabled' : ''}>${options}</select>
      <span class="add-person-select-chevron" aria-hidden="true">${icon.chevron}</span>
    </div>`;
}

function connectPersonActiveWarning()
{
    if (!connectPersonModalState.relationshipType) return null;
    const anchor = getPerson(connectPersonModalState.anchorPersonId);
    const selected = getPerson(connectPersonModalState.selectedPersonId);
    const type = normalizeConnectRelationshipType(connectPersonModalState.relationshipType);

    if (!anchor) return null;

    if (!selected && type === 'parent' && getParents(anchor.id).length > 0)
    {
        return {
            severity: 'warning',
            title: 'Warning!',
            message: connectRelativeText(getParents(anchor.id).length === 1
                ? '{person} already has a recorded parent. The selected person will be connected as an additional parent.'
                : '{person} already has recorded parents. The selected person will be connected as an additional parent.', { person: connectPersonName(anchor) })
        };
    }

    if (!selected) return null;

    return relationshipWarningForConnection({
        anchorPersonId: anchor.id,
        relativePersonId: selected.id,
        relationshipType: type
    });
}

function connectPersonNoticeHtml(notice)
{
    if (!notice)
    {
        return `<div class="connect-person-warning" data-connect-warning hidden></div>`;
    }

    const isBlocking = notice.severity === 'blocking';

    return `<div class="connect-person-warning ${isBlocking ? 'is-blocking' : ''}" data-connect-warning>
        <div class="connect-person-warning-title">${icon.warning}<span>${escapeHtml(t(notice.title || 'Warning!'))}</span></div>
        <p>${escapeHtml(t(notice.message || ''))}</p>
      </div>`;
}

function connectPersonWarningHtml()
{
    if (!connectPersonModalState.relationshipType) return '';
    const validation = connectPersonSelectedValidation();

    if (!validation.ok)
    {
        return connectPersonNoticeHtml({
            severity: 'blocking',
            title: validation.title || 'Cannot connect',
            message: validation.message || 'This relationship cannot be created.'
        });
    }

    return connectPersonNoticeHtml(connectPersonActiveWarning());
}

function renderConnectPersonResult(person, connectedTypes = null)
{
    const selected = person.id === connectPersonModalState.selectedPersonId;
    const place = connectPersonPlaceLine(person);
    const connectedLabel = connectedTypes?.size
        ? `${t('Already connected as')}: ${[...connectedTypes]
            .map(type => t(connectRelationshipLabel(type))).join(', ')}`
        : '';

    return `<button class="connect-person-result ${selected ? 'is-selected' : ''}" type="button" data-connect-person-result="${escapeHtml(person.id)}" aria-pressed="${selected ? 'true' : 'false'}">
        ${renderPersonAvatar(person, 'connect-person-avatar')}
        <span class="connect-person-result-copy">
          <strong>${escapeHtml(connectPersonName(person))}</strong>
          <span>${escapeHtml(connectPersonLifeLine(person))}</span>
          ${place ? `<span>${escapeHtml(place)}</span>` : ''}
          ${connectedLabel ? `<span class="connect-person-related-status">${escapeHtml(connectedLabel)}</span>` : ''}
        </span>
      </button>`;
}

function renderConnectPersonResults()
{
    const candidates = connectPersonCandidates();
    const connected = connectPersonExistingRelationships(connectPersonModalState.anchorPersonId);

    if (!candidates.length)
    {
        return `<div class="connect-person-empty">
          No matching people found. Try another name or create a new person.
        </div>`;
    }

    return `<div class="connect-person-results">
        ${candidates.map(person => renderConnectPersonResult(person, connected.get(person.id))).join('')}
      </div>`;
}

function renderConnectPersonModalHtml()
{
    const anchor = getPerson(connectPersonModalState.anchorPersonId);
    const anchorName = connectPersonName(anchor);
    const relationshipType = connectPersonModalState.relationshipType;
    const selectedPerson = getPerson(connectPersonModalState.selectedPersonId);
    const selectedValidation = connectPersonSelectedValidation();
    const connectDisabled = !relationshipType || !selectedPerson || !selectedValidation.ok;
    const resultTitle = connectPersonModalState.query ? 'Search results'
        : relationshipType ? 'Suggested matches' : 'People in this project';

    return `<div class="modal connect-person-modal" role="dialog" aria-modal="true" aria-labelledby="connectPersonTitle">
        <div class="modal-header connect-person-header">
          <div class="connect-person-header-icon" aria-hidden="true">${icon.link}</div>
          <div>
            <h2 id="connectPersonTitle">Connect existing person</h2>
            <p>${escapeHtml(connectRelativeText('Find a person in this project and connect them to {person}.', { person: anchorName }))}</p>
          </div>
          <button class="close-button" type="button" data-close aria-label="Close">${icon.close}</button>
        </div>

        <div class="connect-person-layout">
          <aside class="connect-person-left">
            <div class="field add-person-select-field">
              <label for="connectPersonRelationship">Select relationship</label>
              <select class="compact-select add-person-select" id="connectPersonRelationship" data-connect-relationship>
                <option value="" ${!relationshipType ? 'selected' : ''}>Select relationship</option>
                ${['parent', 'child', 'sibling', 'partner'].map(value => `<option value="${value}" ${value === relationshipType ? 'selected' : ''}>${connectRelationshipLabel(value)}</option>`).join('')}
              </select>
              <span class="add-person-select-chevron" aria-hidden="true">${icon.chevron}</span>
            </div>

            ${renderConnectPersonDetailSelector()}

            ${relationshipType ? renderPartnerChildrenSelector({
                anchorPersonId: anchor?.id || '',
                relationshipType,
                selectedPersonId: connectPersonModalState.selectedPersonId,
                selectedValue: connectPersonModalState.partnerChildrenMode,
                controlId: 'connectPersonPartnerChildrenMode'
            }) : ''}


            ${relationshipType && (relationshipType !== 'sibling' || selectedPerson
                || parentIdsForPerson(anchor?.id || '').length)
                ? renderParentFamilySelector({
                anchorPersonId: anchor?.id || '',
                relationshipType,
                otherPersonId: selectedPerson?.id || '',
                selectedValue:
                connectPersonModalState
                    .parentFamilySelection,
                controlId:
                'connectPersonParentFamily',
                showSelectionLabel:
                false
            }) : ''}

            ${connectPersonWarningHtml()}
          </aside>

          <section class="connect-person-main">
            <div class="field">
              <label for="connectPersonSearch">Find person</label>
              <div class="connect-person-search-shell">
                ${icon.search}
                <input id="connectPersonSearch" data-connect-search value="${escapeHtml(connectPersonModalState.query)}" placeholder="Search people..." autocomplete="off">
              </div>
            </div>

            <div class="connect-person-results-panel">
              <div class="connect-person-results-title">${escapeHtml(resultTitle)}</div>
              ${renderConnectPersonResults()}
            </div>

            <button class="connect-person-create" type="button" data-connect-create-new ${relationshipType ? '' : 'disabled'}>
              <span class="connect-person-create-icon" aria-hidden="true">${icon.addperson}</span>
              <span class="connect-person-create-copy">
                <strong>Can’t find the person?</strong>
                <span>${escapeHtml(t(relationshipType ? { parent: 'Create and connect a new parent.', child: 'Create and connect a new child.', sibling: 'Create and connect a new sibling.', partner: 'Create and connect a new partner.' }[normalizeConnectRelationshipType(relationshipType)] : 'Select a relationship to create and connect a person.'))}</span>
              </span>
              <span class="connect-person-create-chevron" aria-hidden="true">${icon.chevron}</span>
            </button>
          </section>
        </div>

        <div class="modal-footer connect-person-footer">
          <button class="button secondary" type="button" data-close>Cancel</button>
          <button class="button primary" type="button" id="connectPersonConfirm" ${connectDisabled ? 'disabled' : ''}>Connect</button>
        </div>
      </div>`;
}

function refreshConnectPersonModal()
{
    const previousLayout = modalBackdrop.querySelector('.connect-person-layout');
    const scrollTop = previousLayout?.scrollTop || 0;
    const searchWasFocused = document.activeElement?.matches('[data-connect-search]');
    const selectionStart = searchWasFocused ? document.activeElement.selectionStart : null;
    modalBackdrop.innerHTML = renderConnectPersonModalHtml();
    modalBackdrop.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', closeModal));
    bindConnectPersonModalControls();

    const layout = modalBackdrop.querySelector('.connect-person-layout');
    if (layout) layout.scrollTop = scrollTop;
    const input = modalBackdrop.querySelector('[data-connect-search]');
    if (input && searchWasFocused)
    {
        input.focus({ preventScroll: true });
        input.setSelectionRange(selectionStart, selectionStart);
    }

    localizeUI(modalBackdrop);
}

function bindConnectPersonModalControls()
{
    const modal = modalBackdrop.querySelector('.connect-person-modal');
    if (!modal) return;
    bindManageRelativeReturn(connectPersonModalState.managerReturn);

    modal.querySelector('[data-connect-relationship]')?.addEventListener('change', event =>
    {
        connectPersonModalState.relationshipType = event.currentTarget.value
            ? normalizeConnectRelationshipType(event.currentTarget.value) : '';
        connectPersonModalState.selectedPersonId = '';
        connectPersonModalState.detailType = '';
        connectPersonModalState.partnerChildrenMode =
            PARTNER_CHILDREN_ADD_PARENT;

        connectPersonModalState.parentFamilySelection = defaultParentFamilySelection(
            connectPersonModalState.anchorPersonId,
            connectPersonModalState.relationshipType,
            connectPersonModalState.requestedParentFamilySelection
        );
        refreshConnectPersonModal();
    });

    modal.querySelector('[data-connect-detail-type]')?.addEventListener('change', event =>
    {
        connectPersonModalState.detailType = event.currentTarget.value;
        refreshConnectPersonModal();
    });

    modal.querySelector('#connectPersonParentFamily')?.addEventListener('change', event =>
    {
        connectPersonModalState.parentFamilySelection = event.currentTarget.value;
        refreshConnectPersonModal();
    });

    modal.querySelector('#connectPersonPartnerChildrenMode')
        ?.addEventListener('change', event =>
        {
            connectPersonModalState.partnerChildrenMode =
                normalizePartnerChildrenMode(event.currentTarget.value);
        });

    modal.querySelector('[data-connect-search]')?.addEventListener('input', event =>
    {
        connectPersonModalState.query = event.currentTarget.value;
        connectPersonModalState.selectedPersonId = '';
        refreshConnectPersonModal();
    });

    modal.querySelectorAll('[data-connect-person-result]').forEach(button =>
    {
        button.addEventListener('click', () =>
        {
            connectPersonModalState.selectedPersonId = button.dataset.connectPersonResult || '';
            connectPersonModalState.parentFamilySelection = defaultParentFamilySelection(
                connectPersonModalState.anchorPersonId, connectPersonModalState.relationshipType, '',
                connectPersonModalState.selectedPersonId);
            refreshConnectPersonModal();
        });
    });

    modal.querySelector('[data-connect-create-new]')?.addEventListener('click', () =>
    {
        if (!connectPersonModalState.relationshipType) return;
        const anchor = getPerson(connectPersonModalState.anchorPersonId);
        const relationshipType = normalizeConnectRelationshipType(connectPersonModalState.relationshipType);
        const label = connectRelationshipSentence(relationshipType);

        closeModal({ skipAfterClose: true });

        const descriptions = {
            parent: 'Create a new person and connect them as a parent of {person}.',
            child: 'Create a new person and connect them as a child of {person}.',
            sibling: 'Create a new person and connect them as a sibling of {person}.',
            partner: 'Create a new person and connect them as a partner of {person}.'
        };
        openAddPersonModal(
            `Add ${label}`,
            connectRelativeText(descriptions[relationshipType], { person: connectPersonName(anchor) }),
            {
                relativeType: relationshipType,
                connectRelationshipType: relationshipType,
                connectAfterCreate: true,
                personId: anchor?.id || connectPersonModalState.anchorPersonId,
                connectToPersonId: anchor?.id || connectPersonModalState.anchorPersonId,
                parentFamilySelection: connectPersonModalState.parentFamilySelection,
                connectionDetailType: connectPersonDetailType(),
                partnerChildrenMode: connectPersonModalState.partnerChildrenMode,
                managerReturn: connectPersonModalState.managerReturn
            }
        );
    });

    modal.querySelector('#connectPersonConfirm')?.addEventListener('click', () =>
    {
        const anchor = getPerson(connectPersonModalState.anchorPersonId);
        const selected = getPerson(connectPersonModalState.selectedPersonId);

        if (!anchor || !selected || !connectPersonModalState.relationshipType) return;

        const validation = connectPersonSelectedValidation();

        if (!validation.ok)
        {
            showToast(validation.message || 'This relationship cannot be created.');
            refreshConnectPersonModal();
            return;
        }

        const result = connectPeopleByRelationship({
            anchorPersonId: anchor.id,
            relativePersonId: selected.id,
            relationshipType: connectPersonModalState.relationshipType,
            parentFamilySelection: connectPersonModalState.parentFamilySelection,
            detailType: connectPersonDetailType(),
            partnerChildrenMode: connectPersonModalState.partnerChildrenMode
        });

        if (!result.ok)
        {
            showToast(result.message || 'Could not connect these people.');
            refreshConnectPersonModal();
            return;
        }

        const successMessage = connectedRelativeToast(connectPersonName(selected), connectPersonModalState.relationshipType);
        if (connectPersonModalState.managerReturn) connectPersonModalState.managerReturn.relatedPersonId = selected.id;

        closeModal();

        state.selectedPersonId = anchor.id;
        state.selectedPeopleId = anchor.id;
        state.treeInspectorCollapsed = false;

        if (state.activeModule === 'Family Tree')
        {
            renderFamilyTreePreserveScroll();
        }
        else
        {
            render();
        }

        if (result.warning?.message)
        {
            showToast(`${successMessage} ${t('Existing parent links were kept.')}`);
        }
        else
        {
            showToast(successMessage);
        }
    });
}

function openConnectRelativeModal(anchorPersonId, options = {})
{
    const anchor = getPerson(anchorPersonId);
    if (!anchor) return;

    const relationshipType = '';

    connectPersonModalState = {
        anchorPersonId: anchor.id,
        managerReturn: options.managerReturn || null,
        relationshipType,
        detailType: '',
        query: '',
        selectedPersonId: '',
        parentFamilySelection: '',
        requestedParentFamilySelection: options.parentFamilyId || options.parentFamilySelection || '',
        partnerChildrenMode: normalizePartnerChildrenMode(
            options.partnerChildrenMode
        )
    };

    openModal(renderConnectPersonModalHtml());
    bindConnectPersonModalControls();
    if (window.innerWidth > 900)
    {
        modalBackdrop.querySelector('[data-connect-search]')?.focus();
    }
}

function openRelativePopover(
    anchor,
    anchorPersonId
)
{
    const openPopover = document.getElementById('relativePopover');
    if (openPopover?.dataset.personId === anchorPersonId
        && (menuLifecycleAnchor === anchor || (anchor.id && menuLifecycleAnchor?.id === anchor.id)))
    {
        closeMenu();
        return;
    }
    closeMenu();

    const person =
        personById(anchorPersonId);

    if (!person || !anchor) return;

    const popover = document.createElement('div');
    popover.className = 'relative-popover';
    popover.id = 'relativePopover';
    popover.dataset.personId = anchorPersonId;

    popover.innerHTML = `<div class="relative-popover-body"><h2>New relative</h2><p>to ${escapeHtml(person.name)}</p>
        <div class="relative-group">Parents</div><div class="relative-grid"><button class="relative-choice" data-rel="father"><span class="gender-icon">${icon.male}</span>Father</button><button class="relative-choice female" data-rel="mother"><span class="gender-icon">${icon.female}</span>Mother</button></div>
        <div class="relative-group">Partner</div><div class="relative-grid" style="grid-template-columns:1fr"><button class="relative-choice" data-rel="partner"><span class="relative-choice-icon marriage-icon">${icon.marriage}</span>Partner / Spouse</button></div>
        <div class="relative-group">Children</div><div class="relative-grid"><button class="relative-choice" data-rel="son"><span class="gender-icon">${icon.male}</span>Son</button><button class="relative-choice female" data-rel="daughter"><span class="gender-icon">${icon.female}</span>Daughter</button></div>
        <div class="relative-group">Siblings</div><div class="relative-grid"><button class="relative-choice" data-rel="brother"><span class="gender-icon">${icon.male}</span>Brother</button><button class="relative-choice female" data-rel="sister"><span class="gender-icon">${icon.female}</span>Sister</button></div>
        <button class="connect-choice" type="button" data-connect-existing><span class="connect-choice-main"><span class="connect-choice-icon">${icon.link}</span><span class="connect-choice-copy"><strong>Connect existing person</strong><span>Link someone already in this tree</span></span></span><span class="connect-choice-chevron" aria-hidden="true">${icon.chevron}</span></button></div>`;

    document.body.appendChild(popover);
    if (window.innerWidth <= 900) mountMobileChoiceSheet(popover, anchor, t('New relative'));
    else positionRelativePopover(popover, anchor);

    popover.querySelectorAll('[data-rel]').forEach(button =>
    {
        button.addEventListener('click', () =>
        {
            const rel = button.dataset.rel;
            closeMenu();
            focusTreeBranchForRelative(person.id);
            openAddPersonModal(`Add ${rel}`, `Create a new person and add as ${person.name.split(' ')[0]}'s ${rel}`, {
                relativeType: rel,
                connectRelationshipType: addPersonConnectionTypeFromRelativeType(rel),
                connectAfterCreate: Boolean(addPersonConnectionTypeFromRelativeType(rel)),
                personId: person.id,
                connectToPersonId: person.id
            });
        });
    });

    popover.querySelector('[data-connect-existing]')?.addEventListener('click', () =>
    {
        closeMenu();
        focusTreeBranchForRelative(person.id);
        openConnectRelativeModal(person.id, { relationshipType: 'parent' });
    });

    bindMenuLifecycle(anchor);
}
function clampNumber(value, min, max)
{
    return Math.max(min, Math.min(value, max));
}

function positionRelativePopover(popover, anchor)
{
    const rect = anchor.getBoundingClientRect();
    const margin = 12;
    const gap = 14;
    const arrowSize = 20;
    const arrowCornerPadding = 24;

    const popoverWidth = popover.offsetWidth || 360;
    const popoverHeight = popover.offsetHeight || 560;

    const anchorCenterX = rect.left + rect.width / 2;
    const anchorCenterY = rect.top + rect.height / 2;

    const spaceRight = window.innerWidth - rect.right - margin;
    const spaceLeft = rect.left - margin;

    if (spaceRight < popoverWidth + gap && spaceLeft < popoverWidth + gap)
    {
        const spaceBelow = window.innerHeight - rect.bottom - gap - margin;
        const spaceAbove = rect.top - gap - margin;
        const placeBelow = spaceBelow >= spaceAbove;
        const availableHeight = Math.max(120, placeBelow ? spaceBelow : spaceAbove);
        popover.querySelector('.relative-popover-body').style.maxHeight = `${availableHeight - 2}px`;
        popover.style.left = `${clampNumber(anchorCenterX - popoverWidth / 2, margin, window.innerWidth - popoverWidth - margin)}px`;
        popover.style.top = `${placeBelow ? rect.bottom + gap : rect.top - gap - popover.offsetHeight}px`;
        popover.dataset.arrowSide = 'none';
        return;
    }

    let left;
    let arrowSide;

    if (spaceRight >= popoverWidth + gap)
    {
        left = rect.right + gap;
        arrowSide = 'left';
    }
    else if (spaceLeft >= popoverWidth + gap)
    {
        left = rect.left - popoverWidth - gap;
        arrowSide = 'right';
    }
    else if (spaceRight >= spaceLeft)
    {
        left = clampNumber(rect.right + gap, margin, window.innerWidth - popoverWidth - margin);
        arrowSide = 'left';
    }
    else
    {
        left = clampNumber(rect.left - popoverWidth - gap, margin, window.innerWidth - popoverWidth - margin);
        arrowSide = 'right';
    }

    const preferredTop = anchorCenterY - popoverHeight / 2;
    const maxTop = Math.max(margin, window.innerHeight - popoverHeight - margin);
    const top = clampNumber(preferredTop, margin, maxTop);

    const minArrowTop = arrowCornerPadding;
    const maxArrowTop = Math.max(
        minArrowTop,
        popoverHeight - arrowSize - arrowCornerPadding
    );

    const arrowTop = clampNumber(
        anchorCenterY - top - arrowSize / 2,
        minArrowTop,
        maxArrowTop
    );

    popover.style.left = `${left}px`;
    popover.style.top = `${top}px`;
    popover.dataset.arrowSide = arrowSide;
    popover.style.setProperty('--relative-popover-arrow-top', `${arrowTop}px`);
}

