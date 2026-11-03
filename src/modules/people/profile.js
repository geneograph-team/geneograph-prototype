const PROFILE_CARD_SECTIONS = Object.freeze([
    Object.freeze({
        id: 'main',
        label: 'Main information'
    }),
    Object.freeze({
        id: 'education',
        label: 'Education'
    }),
    Object.freeze({
        id: 'work',
        label: 'Work'
    }),
    Object.freeze({
        id: 'other',
        label: 'Other'
    })
]);

function normalizeProfileCardSection(value)
{
    return PROFILE_CARD_SECTIONS.some(
        section => section.id === value
    )
        ? value
        : 'main';
}

function renderPeopleProfile(person)
{
    main.classList.add('people-profile-main');

    state.peopleProfileEditTab =
        normalizeProfileCardSection(
            state.peopleProfileEditTab
        );

    if (
        typeof state.peopleProfileEditing
        !== 'boolean'
    )
    {
        state.peopleProfileEditing = false;
    }

    main.innerHTML = `
        <div class="person-profile">
          <header class="profile-hero profile-command-hero">
            <button
              class="profile-back-link"
              type="button"
              id="backPeopleList">

              <span
                class="profile-back-link-icon"
                aria-hidden="true">
                ${icon.arrow}
              </span>

              <span>Back to people</span>
            </button>

            <div class="profile-hero-content">
              ${renderEditablePersonAvatar(
                    person,
                    'profile-hero-photo'
                )}

              <div class="profile-hero-copy">
                <h1>
                  ${escapeHtml(person.name)}
                </h1>
              </div>

              ${renderPeopleHeroLifeSummary(
                    person,
                    {
                        includeBirthPlace: true,
                        includeDeathPlace: true
                    }
                )}

              <p class="profile-hero-relation">
                ${escapeHtml(
                    person.parents
                        ? `Child of ${person.parents}`
                        : person.relation
                )}
              </p>

              <div
                class="
                  app-chip-row
                  app-chip-row--on-accent
                  person-profile-chips
                  profile-hero-tags
                ">

                ${renderLivingStatusChip(
                    person.living
                )}

                <span
                  class="
                    app-chip
                    app-chip--photos
                  ">

                  ${person.photos}
                  ${
                        person.photos === 1
                            ? 'photo'
                            : 'photos'
                    }
                </span>

                <span
                  class="
                    app-chip
                    app-chip--files
                  ">

                  ${person.files}
                  ${
                        person.files === 1
                            ? 'file'
                            : 'files'
                    }
                </span>

                <span
                  class="
                    app-chip
                    app-chip--notes
                  ">

                  ${person.notes}
                  ${
                        person.notes === 1
                            ? 'note'
                            : 'notes'
                    }
                </span>
              </div>
            </div>

            <div class="profile-hero-actions">
              <button
                class="button ${
                    state.peopleProfileEditing
                        ? 'secondary'
                        : 'primary'
                }"
                type="button"
                id="profileEditButton">

                ${
                    state.peopleProfileEditing
                        ? icon.close
                        : icon.edit
                }

                ${
                    state.peopleProfileEditing
                        ? 'Cancel editing'
                        : 'Edit profile'
                }
              </button>

              <button
                class="button secondary"
                type="button"
                id="profileAddRelative">

                ${icon.addperson}
                Add relative
              </button>

              <button
                class="button secondary"
                type="button"
                id="profileMoreActions"
                aria-haspopup="menu"
                aria-expanded="false">

                ${renderPanelButtonLabel(
                    icon.more,
                    'More actions'
                )}
              </button>
            </div>
          </header>

          <div class="person-profile__top">
            ${renderEditableProfileCard(person)}

            <div class="profile-family-slot">
              ${renderProfileFamilyHub(person)}
            </div>
          </div>

          <div class="person-profile__bottom">
            ${renderProfileConnectedCube(person)}
            ${renderProfileCompactTimeline(person)}
          </div>
        </div>
      `;

    bindPeopleProfileControls(person);
}

function peopleProfileAssets(person)
{
    const archiveMap = {
        silver: [
            { type: 'PNG', name: 'Pawford household register', meta: 'Four linked people - Source assigned', fileId: 'af1' },
            { type: 'JPG', name: 'Silver kitten portrait', meta: 'Added Feb 20 2021 - Personal album', fileId: null },
            { type: 'PNG', name: 'Silver birth announcement', meta: 'Name marked in image', fileId: 'af7' },
            { type: 'PNG', name: 'Meowbridge marriage record', meta: 'Linked to Luna', fileId: 'af5' }
        ],
        luna: [
            { type: 'JPG', name: 'Luna Purrington portrait', meta: 'Added Apr 30 2026 - Personal album', fileId: null },
            { type: 'PNG', name: 'Meowbridge marriage record', meta: 'Name marked in image', fileId: 'af5' },
            { type: 'PNG', name: 'Daisy letter to Luna', meta: 'Family correspondence', fileId: 'af4' }
        ],
        barnaby: [
            { type: 'PNG', name: 'Pawford household register', meta: 'Name marked in image', fileId: 'af1' },
            { type: 'PNG', name: 'Pawford register index', meta: 'Page reference', fileId: 'af3' }
        ],
        daisy: [
            { type: 'PNG', name: 'Daisy birth record', meta: 'Name marked in image', fileId: 'af-birth-sample' },
            { type: 'PNG', name: 'Daisy letter to Luna', meta: 'Family correspondence', fileId: 'af4' },
            { type: 'JPG', name: 'Daisy Milkpaw scan', meta: 'Added May 2 2026 - Family album', fileId: null }
        ]
    };
    return {
        archive:
          archiveMap[person.id]
          || [
              {
                  type:
                'PDF',

                  name:
                'Linked archive file.pdf',

                  meta:
                'Added recently - Source assigned',

                  fileId:
                null
              }
          ]
    };
}

function splitProfileName(person)
{
    const centralPerson = getPerson(person?.id);
    const names = centralPerson?.names || {};

    return {
        first: normalizeNameSegment(
            names.first ?? person?.first ?? ''
        ),

        patronym: normalizeNameSegment(
            names.middle ?? ''
        ),

        surname: normalizeNameSegment(
            names.last ?? person?.surname ?? ''
        )
    };
}

function renderProfileInfoRow(label, value)
{
    return `
        <div class="profile-info-row">
          <span>${escapeHtml(label)}</span>
          <strong>${escapeHtml(value)}</strong>
        </div>
      `;
}

function renderProfileInfoRowRaw(label, html)
{
    return `
        <div class="profile-info-row">
          <span>${escapeHtml(label)}</span>
          <strong>${html}</strong>
        </div>
      `;
}

function renderProfileStatusValue(status)
{
    const safeStatus = status || 'Unknown';

    return `
        <span class="profile-status-inline">
          <span
            class="
              add-person-status-dot
              ${statusDotClass(safeStatus)}
            "
            aria-hidden="true">
          </span>

          ${escapeHtml(safeStatus)}
        </span>
      `;
}

function renderProfilePartnersInfo(person)
{
    const centralPerson = getPerson(person?.id);

    if (!centralPerson)
    {
        return `
          <div class="panel-muted">
            No partners recorded
          </div>
        `;
    }

    const rows = getPartnerRelationships(
        centralPerson.id
    )
        .filter(family =>
            !family.projectId
          || !centralPerson.projectId
          || family.projectId
            === centralPerson.projectId
        )
        .map(family =>
        {
            const partnerId = familyPartnerId(
                family,
                centralPerson.id
            );

            const partner = getPerson(partnerId);

            if (!partner) return '';

            const relationshipType =
                relationshipTypeFromLegacy(family);

            const relationshipLabel =
                relationshipType
            === 'Unknown relationship'
                    ? 'Relationship'
                    : relationshipType;

            const dateLabel =
                partnerRelationshipDateSummary(
                    family
                ).rangeLabel;

            const partnerName =
                partner.names?.display
            || 'Unnamed person';

            return renderProfileInfoRowRaw(
                relationshipLabel,
                `
              <span class="profile-partner-value">
                <button
                  class="profile-partner-link"
                  type="button"
                  data-profile-partner-id="${
                        escapeHtml(partner.id)
                    }">
                  ${escapeHtml(partnerName)}
                </button>

                ${dateLabel
                    ? `
                    <small class="profile-partner-meta">
                      ${escapeHtml(dateLabel)}
                    </small>
                  `
                    : ''}
              </span>
            `
            );
        })
        .filter(Boolean);

    return rows.length
        ? rows.join('')
        : `
          <div class="panel-muted">
            No partners recorded
          </div>
        `;
}

function renderEditableProfileCard(person)
{
    const editing = Boolean(
        state.peopleProfileEditing
    );

    const activeSection =
        normalizeProfileCardSection(
            state.peopleProfileEditTab
        );

    return `
        <article
          class="
            profile-card
            profile-full-card
            ${editing ? 'editing' : 'locked'}
          "
          data-profile-card-root>

          <h3>
            <span class="section-title">
              ${icon.people}
              Profile
            </span>

            <span
              class="
                profile-edit-card-state
                ${editing ? 'editing' : ''}
              ">
              ${editing ? 'Editing' : 'Locked'}
            </span>
          </h3>

          <div class="profile-card-body">
            ${renderProfileCardTabs(activeSection)}

            ${renderProfileCardPanels(
                person,
                editing,
                activeSection
            )}

            ${editing
                ? `
                <div class="profile-edit-inline-actions">
                  <button
                    class="button secondary"
                    type="button"
                    id="profileCancelEdit">
                    Cancel
                  </button>

                  <button
                    class="button primary"
                    type="button"
                    id="profileSaveInlineEdit">
                    Save changes
                  </button>
                </div>
              `
                : ''}
          </div>
        </article>
      `;
}

function renderProfileLockedPanelContent(
    person,
    sectionId
)
{
    const activeSection =
        normalizeProfileCardSection(sectionId);

    const name = splitProfileName(person);
    const details = peopleProfileDetailsFor(person);

    const isDeceased =
        person.living === 'Deceased';

    const isFemale =
        person.gender === 'female';

    const centralPerson = getPerson(person.id);

    const birthLabel =
        formatGenealogyDateLabel(
            centralPerson?.birth || person.birth
        );

    const deathLabel =
        formatGenealogyDateLabel(
            centralPerson?.death || person.death
        );

    const deathPlaceLabel =
        cleanEditFieldValue(person.deathPlace);

    if (activeSection === 'education' || activeSection === 'work')
    {
        return renderRepeatableFactReadOnly(centralPerson, activeSection === 'education' ? 'EDUC' : 'OCCU');
    }

    if (activeSection === 'other')
    {
        return renderRepeatableFactReadOnly(centralPerson, 'FACT') + `
          <div
            class="
              profile-readonly-grid
              profile-readonly-grid-single
            ">

            <section class="profile-info-block wide">
              <h4>Other</h4>

              ${renderProfileInfoRow(
                    'Religion',
                    normalizeReligionValue(
                        details.religion
                    )
                )}

              ${renderProfileInfoRow(
                    'Baptism date',
                    profileDetailDateLabel(
                        details.baptismDate
                    )
                )}

              ${renderProfileInfoRow(
                    'Baptism place',
                    details.baptismPlace || '-'
                )}

              ${renderProfileInfoRow(
                    'Privacy',
                    person.living === 'Living'
                        ? 'Living person protected'
                        : 'Standard record'
                )}
            </section>
          </div>
        `;
    }

    return `
        <div
          class="
            profile-readonly-grid
            profile-readonly-grid-tabbed
            main
          ">

          <section class="profile-info-block">
            <h4>Main information</h4>

            ${renderProfileInfoRow(
                'First name',
                name.first || '-'
            )}

            ${renderProfileInfoRow(
                'Last name',
                name.surname || '-'
            )}

            ${renderProfileInfoRow(
                'Patronym',
                name.patronym || '-'
            )}

            ${isFemale
                ? renderProfileInfoRow(
                    'Maiden name',
                    details.maidenName || '-'
                )
                : ''}

            ${renderProfileInfoRow(
                'Gender',
                isFemale
                    ? 'Female'
                    : person.gender === 'male'
                        ? 'Male'
                        : 'Unknown'
            )}

            ${renderProfileInfoRowRaw(
                'Living status',
                renderProfileStatusValue(
                    person.living || 'Unknown'
                )
            )}

            ${renderProfileInfoRow(
                'Prefix',
                details.prefix || '-'
            )}

            ${renderProfileInfoRow(
                'Suffix',
                details.suffix || '-'
            )}
          </section>

          <section class="profile-info-block">
            <h4>Birth and life</h4>

            ${renderProfileInfoRow(
                'Birth date',
                birthLabel || '-'
            )}

            ${renderProfileInfoRow(
                'Birth place',
                person.birthPlace || '-'
            )}

            ${isDeceased
                ? `
                ${renderProfileInfoRow(
                    'Death date',
                    deathLabel || '-'
                )}

                ${renderProfileInfoRow(
                    'Death place',
                    deathPlaceLabel || '-'
                )}

                ${renderProfileInfoRow(
                    'Death reason',
                    details.deathReason || '-'
                )}

                ${renderProfileInfoRow(
                    'Burial place',
                    details.burialPlace || '-'
                )}
              `
                : ''}
          </section>

          <section class="profile-info-block">
            <h4>Partners</h4>
            ${renderProfilePartnersInfo(person)}
          </section>
        </div>
      `;
}

function renderProfileCardTabs(activeSection)
{
    const active =
        normalizeProfileCardSection(activeSection);

    return `
        <div
          class="profile-card-tabs"
          role="tablist"
          aria-label="Profile card sections">

          ${PROFILE_CARD_SECTIONS.map(section =>
            {
                const isActive =
                    section.id === active;

                const tabId =
                    `profile-card-tab-${section.id}`;

                const panelId =
                    `profile-card-panel-${section.id}`;

                return `
              <button
                class="
                  profile-card-tab
                  ${isActive ? 'active' : ''}
                "
                id="${escapeHtml(tabId)}"
                type="button"
                role="tab"
                aria-selected="${
                    isActive ? 'true' : 'false'
                }"
                aria-controls="${escapeHtml(panelId)}"
                tabindex="${isActive ? '0' : '-1'}"
                data-profile-card-tab="${
                    escapeHtml(section.id)
                }">
                ${escapeHtml(section.label)}
              </button>
            `;
            }).join('')}
        </div>
      `;
}

function renderProfileEditPanelContent(
    person,
    sectionId
)
{
    switch (
        normalizeProfileCardSection(sectionId)
    )
    {
        case 'education':
            return renderProfileEducationEditFields(
                person
            );

        case 'work':
            return renderProfileWorkEditFields(
                person
            );

        case 'other':
            return renderProfileOtherEditFields(
                person
            ) + renderRepeatableFactList(person, 'FACT', 'profile');

        default:
            return renderProfileMainEditFields(
                person
            );
    }
}

function renderProfileCardPanels(
    person,
    editing,
    activeSection
)
{
    const active =
        normalizeProfileCardSection(activeSection);

    return `
        <div class="profile-card-panel-stack">
          ${PROFILE_CARD_SECTIONS.map(section =>
            {
                const isActive =
                    section.id === active;

                const tabId =
                    `profile-card-tab-${section.id}`;

                const panelId =
                    `profile-card-panel-${section.id}`;

                const content = editing
                    ? renderProfileEditPanelContent(
                        person,
                        section.id
                    )
                    : renderProfileLockedPanelContent(
                        person,
                        section.id
                    );

                return `
              <section
                class="
                  profile-card-panel
                  ${isActive ? 'active' : ''}
                "
                id="${escapeHtml(panelId)}"
                role="tabpanel"
                aria-labelledby="${escapeHtml(tabId)}"
                aria-hidden="${
                    isActive ? 'false' : 'true'
                }"
                data-profile-card-panel="${
                    escapeHtml(section.id)
                }"
                ${isActive ? '' : 'inert'}>
                ${content}
              </section>
            `;
            }).join('')}
        </div>
      `;
}

function renderProfileMainEditFields(person)
{
    const name = splitProfileName(person);
    const details = peopleProfileDetailsFor(person);
    const isFemale = person.gender === 'female';
    const currentStatus = person.living === 'Deceased' ? 'Deceased' : person.living === 'Unknown' ? 'Unknown' : 'Living';
    const isDeceased = currentStatus === 'Deceased';
    const genderValue = person.gender === 'female' ? 'Female' : person.gender === 'male' ? 'Male' : 'Unknown';
    const centralPerson = getPerson(person.id);
    const birthPlaceValue = editPlaceValue(centralPerson?.birth?.placeId, centralPerson?.birth?.placeText || person.birthPlace);
    const rawDeathPlace = person.deathPlace === '-' ? '' : (person.deathPlace || '');
    const deathPlaceValue = editPlaceValue(centralPerson?.death?.placeId, centralPerson?.death?.placeText || rawDeathPlace);
    const burialPlaceValue = editPlaceValue(centralPerson?.death?.burialPlaceId, centralPerson?.death?.burialPlaceText || details.burialPlace);
    const birthDateModel = centralPerson?.birth || { date: person.birth, dateLabel: person.birth, dateType: details.birthDateType || 'Unknown' };
    const deathDateModel = centralPerson?.death || { date: person.death, dateLabel: person.death, dateType: details.deathDateType || 'Exact date' };
    return `<div class="profile-main-edit-grid ${isFemale ? 'has-maiden' : 'no-maiden'} ${isDeceased ? 'is-deceased' : ''}">
        <div class="field profile-field-gender add-person-select-field">
          <label>Gender</label>
          <select class="compact-select add-person-select" id="profileInlineGender">
            <option ${genderValue === 'Male' ? 'selected' : ''}>Male</option>
            <option ${genderValue === 'Female' ? 'selected' : ''}>Female</option>
            <option ${genderValue === 'Unknown' ? 'selected' : ''}>Unknown</option>
          </select>
          <span class="add-person-select-chevron" aria-hidden="true">${icon.chevron}</span>
        </div>
        <div class="field add-person-status-field profile-status-field profile-field-living"><label>Living status</label><button class="add-person-status-button" type="button" id="profileStatusButton" aria-haspopup="listbox" aria-expanded="false"><span class="add-person-status-current"><span class="add-person-status-dot ${statusDotClass(currentStatus)}"></span><span id="profileStatusLabel">${escapeHtml(currentStatus)}</span></span><span class="add-person-status-chevron" aria-hidden="true">${icon.chevron}</span></button><input type="hidden" id="profileInlineLiving" value="${escapeHtml(currentStatus)}"><div class="add-person-status-menu" id="profileStatusMenu" role="listbox" hidden>${['Living','Deceased','Unknown'].map(status => `<button class="add-person-status-option ${status === currentStatus ? 'active' : ''}" type="button" role="option" aria-selected="${status === currentStatus ? 'true' : 'false'}" data-profile-status-value="${status}"><span><span class="add-person-status-dot ${statusDotClass(status)}"></span>${status}</span><span data-profile-status-check>${status === currentStatus ? icon.check : ''}</span></button>`).join('')}</div></div>

        <div class="field profile-field-first"><label>First name</label><input id="profileInlineFirst" data-source-value="${escapeHtml(name.first)}" value="${escapeHtml(localizedDataFieldValue(name.first))}"></div>
        <div class="field profile-field-last"><label>Last name</label><input id="profileInlineLast" data-source-value="${escapeHtml(name.surname)}" value="${escapeHtml(localizedDataFieldValue(name.surname))}"></div>
        ${renderNameAffixCombobox({ id: 'profileInlinePrefix', label: 'Prefix', value: details.prefix || '', kind: 'prefix', className: 'profile-field-prefix' })}

        <div class="field profile-field-patronym"><label>Patronym</label><input id="profileInlinePatronym" data-source-value="${escapeHtml(name.patronym)}" value="${escapeHtml(localizedDataFieldValue(name.patronym))}"></div>
        <div class="field profile-field-maiden" id="profileInlineMaiden" ${isFemale ? '' : 'hidden'}><label>Maiden Name</label><input id="profileInlineMaidenInput" data-source-value="${escapeHtml(details.maidenName || '')}" value="${escapeHtml(localizedDataFieldValue(details.maidenName || ''))}" placeholder="Maiden surname"></div>
        ${renderNameAffixCombobox({ id: 'profileInlineSuffix', label: 'Suffix', value: details.suffix || '', kind: 'suffix', className: 'profile-field-suffix' })}

        ${renderGenealogyDateField('profileInlineBirthField', 'Birth Date', birthDateModel, {
            inputId: 'profileInlineBirth',
            typeId: 'profileInlineBirthType',
            className: 'profile-field-birth-date genealogy-date-inline-range',
            placeholder: 'e.g. 14 Feb 1915'
        })}
        ${renderPlaceCombobox({
            id: 'profileInlineBirthPlace',
            label: 'Birth Place',
            value: birthPlaceValue,
            selectedPlaceId: centralPerson?.birth?.placeId || '',
            addressValue: centralPerson?.birth?.address || '',
            placeholder: 'e.g. Pawford, England',
            className: 'profile-field-birth-place'
        })}

        <div class="profile-death-fields-group" id="profileInlineDeathFields" ${isDeceased ? '' : 'hidden'}>
          ${renderGenealogyDateField('profileInlineDeathField', 'Death Date', deathDateModel, {
                inputId: 'profileInlineDeath',
                typeId: 'profileInlineDeathType',
                className: 'profile-field-death-date genealogy-date-inline-range',
                placeholder: 'e.g. 20 Oct 1926',
                defaultDateType: 'Exact date'
            })}
          ${renderPlaceCombobox({
                id: 'profileInlineDeathPlace',
                label: 'Death Place',
                value: deathPlaceValue,
                selectedPlaceId: centralPerson?.death?.placeId || '',
                addressValue: centralPerson?.death?.address || '',
                placeholder: 'e.g. Meowbridge, England',
                className: 'profile-field-death-place'
            })}
        </div>
        <div class="profile-death-fields-group" id="profileInlineDeathExtraFields" ${isDeceased ? '' : 'hidden'}>
          ${renderGenealogyDateField('profileBurialDate', 'Burial date', personEventByTag(centralPerson, 'BURI')?.date, { className: 'profile-field-burial-date genealogy-date-inline-range' })}
          <div class="field profile-field-death-reason"><label>Cause of Death</label><input id="profileInlineDeathReason" value="${escapeHtml(details.deathReason || '')}" placeholder="Cause or reason"></div>
          ${renderPlaceCombobox({
                id: 'profileInlineBurialPlace',
                label: 'Burial Place',
                value: burialPlaceValue,
                selectedPlaceId: centralPerson?.death?.burialPlaceId || '',
                addressValue: centralPerson?.death?.burialAddress || '',
                placeholder: 'Burial place',
                className: 'profile-field-burial-place'
            })}
        </div>
      </div>`;
}

function renderProfileEducationEditFields(person)
{
    return renderRepeatableFactList(person, 'EDUC', 'profile');
}

function renderProfileWorkEditFields(person)
{
    return renderRepeatableFactList(person, 'OCCU', 'profile');
}

function renderProfileOtherEditFields(person)
{
    const centralPerson = ensurePersonCentralStructures(
        getPerson(person.id) || person
    );

    const details = peopleProfileDetailsFor(person);
    const baptism = personEventByTag(centralPerson, 'BAPM');

    return `
        <div class="profile-card-edit-grid two profile-other-edit-grid">
          ${renderReligionField({
                id: 'profileReligion',
                value: details.religion,
                className: 'profile-other-religion'
            })}

          ${renderGenealogyDateField(
                'profileBaptismDate',
                'Baptism date',
                details.baptismDate,
                {
                    inputId: 'profileBaptismDate',
                    typeId: 'profileBaptismDateType',
                    className: 'profile-other-baptism-date genealogy-date-inline-range',
                    defaultDateType: 'Exact date',
                    placeholder: 'e.g. 14 Feb 1915'
                }
            )}

          ${renderPlaceCombobox({
                id: 'profileBaptismPlace',
                label: 'Baptism place',
                value: editPlaceValue(
                    baptism?.placeId,
                    baptism?.placeText || details.baptismPlace
                ),
                selectedPlaceId: baptism?.placeId || '',
                addressValue: baptism?.address || '',
                placeholder: 'e.g. Pawford, England',
                className: 'full profile-other-baptism-place'
            })}
        </div>
      `;
}

function profileResourceNoun(count, singular, plural)
{
    return count === 1 ? singular : plural;
}

function renderProfileResourceEmpty(message)
{
    return `
        <div class="profile-resource-empty">
          ${escapeHtml(message)}
        </div>
      `;
}

function renderProfileResourceCard({
    type,
    iconSvg,
    title,
    count,
    singular,
    plural,
    addLabel,
    addToast,
    addAction = '',
    showFooter = true,
    body
})
{
    const noun = profileResourceNoun(
        count,
        singular,
        plural
    );

    return `
        <article
          class="
            profile-resource-card
            profile-connected-card
            profile-resource-card--${type}
          ">

          <h3 class="profile-connected-head">
            <span class="profile-connected-title">
              <span class="profile-connected-icon">
                ${iconSvg}
              </span>

              <span>${escapeHtml(title)}</span>

              <span
                class="profile-resource-count"
                aria-label="${escapeHtml(`${count} ${noun}`)}">
                ${count}
              </span>
            </span>

            ${addLabel
                    ? `
                <span class="profile-connected-actions">
                  <button
                    class="profile-connected-action"
                    type="button"
                    ${
                        addAction
                            ? `data-profile-resource-action="${escapeHtml(addAction)}"`
                            : `data-toast="${escapeHtml(addToast || '')}"`
                    }>

                    ${icon.plus}

                    <span>
                      ${escapeHtml(addLabel)}
                    </span>
                  </button>
                </span>
              `
                    : ''
            }
          </h3>

          <div class="profile-resource-card__body">
            ${body}
          </div>

          ${showFooter && count > 0
                ? `
              <button
                class="profile-resource-card__footer"
                type="button"
                data-profile-view-all="${type}">
                <span>
                  View all ${count} ${escapeHtml(noun)}
                </span>

                ${icon.chevron}
              </button>
            `
                : ''}
        </article>
      `;
}

function profileArchiveAddedLabel(item)
{
    const meta = String(item?.meta || '').trim();

    if (!meta) return 'Added recently';

    return meta.split(/\s+-\s+/)[0]
        || 'Added recently';
}

function profileConnectedPlaceEventLabel(
    event
)
{
    return (
        cleanEditFieldValue(
            event?.title
        )
        || cleanEditFieldValue(
            event?.type
        )
        || t('Event')
    );
}

function profileConnectedPlaceMeta(
    events
)
{
    const labels = [
        ...new Set(
            events
                .map(
                    profileConnectedPlaceEventLabel
                )
                .filter(Boolean)
        )
    ];

    const visibleLabels =
        labels.slice(0, 2);

    const remainingCount =
        labels.length
        - visibleLabels.length;

    return [
        visibleLabels.join(' · '),

        remainingCount > 0
            ? `+${remainingCount} ${t('more')}`
            : ''
    ]
        .filter(Boolean)
        .join(' · ')
        || t('Linked event');
}

function getProfileConnectedPlaces(
    personId
)
{
    const person =
        getPerson(personId);

    if (!person)
    {
        return [];
    }

    const groupedPlaces =
        new Map();

    (sampleData.events || [])
        .forEach(event =>
        {
            if (
                event?.projectId
              !== person.projectId
            )
            {
                return;
            }

            if (
                !Array.isArray(
                    event.personIds
                )
            || !event.personIds.includes(
                person.id
            )
            )
            {
                return;
            }

            const place =
                getPlace(event.placeId);

            if (
                !place
            || place.deleted
            || place.projectId
              !== person.projectId
            )
            {
                return;
            }

            const existing =
                groupedPlaces.get(place.id)
            || {
                id: place.id,
                place,
                events: [],
                sortValue:
                Number.POSITIVE_INFINITY
            };

            existing.events.push(event);

            existing.sortValue =
                Math.min(
                    existing.sortValue,
                    parseTimelineSortValue(
                        event
                    )
                );

            groupedPlaces.set(
                place.id,
                existing
            );
        });

    return [
        ...groupedPlaces.values()
    ]
        .map(group => ({
            id: group.place.id,

            title:
            placeDisplayText(
                group.place
            )
            || t('Unnamed place'),

            meta:
            profileConnectedPlaceMeta(
                group.events
            ),

            hasCoordinates:
            placeHasCoordinates(
                group.place
            ),

            sortValue:
            group.sortValue
        }))
        .sort(
            (first, second) =>
                first.sortValue
              - second.sortValue
            || first.title.localeCompare(
                second.title
            )
        );
}

function renderProfileConnectedSources(
    person
)
{
    const centralPerson =
        getPerson(
            person.id
        );

    const sources =
        centralPerson
            ? sourcesForTarget(
                'person',
                centralPerson.id,
                centralPerson.projectId
            )
            : [];

    const body =
        centralPerson
            ? renderConnectedSourceList({
                targetType:
                'person',

                targetId:
                centralPerson.id,

                projectId:
                centralPerson.projectId,

                sources,

                emptyText:
                'No sources linked to this person.'
            })
            : renderProfileResourceEmpty(
                'No sources linked to this person.'
            );

    return renderProfileResourceCard({
        type:
          'sources',

        iconSvg:
          icon.archive,

        title:
          'Sources',

        count:
          sources.length,

        singular:
          'source',

        plural:
          'sources',

        addLabel:
          'Add source',

        addAction:
          'add-sources',

        showFooter:
          false,

        body
    });
}

function renderProfileConnectedCube(
    person
)
{
    return `
        <section
          class="profile-connected-cube"
          aria-label="Connected profile items">

          ${renderProfileConnectedPhotos(
                person
            )}
          ${renderProfileConnectedFiles(
                person
            )}
          ${renderProfileConnectedNotes(
                person
            )}
          ${renderProfileConnectedPlaces(
                person
            )}
        </section>
      `;
}

function renderProfileCompactTimeline(person)
{
    const timelineContent =
        renderFamilyTreeTimeline(person.id);

    return `
        <section
          class="profile-compact-timeline profile-connected-card"
          aria-label="Timeline">

          <h3 class="profile-connected-head profile-timeline-head">
            <span class="profile-connected-title">
              <span class="profile-connected-icon">
                ${icon.clock}
              </span>

              <span>Timeline</span>
            </span>

            <span class="profile-connected-actions">
              <button
                class="profile-connected-action"
                type="button"
                data-profile-add-fact>
                ${icon.plus}
                <span>Add fact</span>
              </button>
            </span>
          </h3>

          <div class="profile-compact-timeline-list">
            ${timelineContent}
          </div>
        </section>
      `;
}

function renderProfileConnectedPhotos(person)
{
    const photos = getPhotosForPerson(person.id);
    const hasOverflow = photos.length > 3;
    const trackId = `profilePhotoTrack-${person.id}`;

    const body = photos.length
        ? `
          <div
            class="
              profile-photo-carousel
              ${hasOverflow ? 'has-overflow' : ''}
            "
            data-profile-photo-carousel>

            ${hasOverflow
                ? `
                <button
                  class="
                    profile-photo-carousel-button
                    previous
                  "
                  type="button"
                  data-profile-photo-prev
                  aria-label="Previous photos"
                  aria-controls="${escapeHtml(trackId)}"
                  disabled>
                  ${icon.arrow}
                </button>
              `
                : ''}

            <div
              class="profile-photo-track"
              id="${escapeHtml(trackId)}"
              data-profile-photo-track
              aria-label="Photos for ${escapeHtml(person.name)}">

              ${photos
                    .map(photo =>
                    {
                        const label =
                            photo.title
                    || photo.filename
                    || 'Photo';

                        return `
                    <div
                      class="
                        person-connected-photo-item
                        profile-photo-item
                      ">

                      <button
                        class="profile-photo-thumb"
                        type="button"
                        data-profile-photo="${escapeHtml(
                            photo.id
                        )}"
                        title="${escapeHtml(
                            label
                        )}"
                        aria-label="Open ${escapeHtml(
                            label
                        )}">

                        ${renderPhotoThumbnail(
                            photo,
                            { label }
                        )}
                      </button>

                      ${renderPersonPhotoUnlinkButton(
                            photo,
                            person.id
                        )}
                    </div>
                  `;
                    })
                    .join('')}
            </div>

            ${hasOverflow
                ? `
                <button
                  class="
                    profile-photo-carousel-button
                    next
                  "
                  type="button"
                  data-profile-photo-next
                  aria-label="Next photos"
                  aria-controls="${escapeHtml(trackId)}">
                  ${icon.chevron}
                </button>
              `
                : ''}
          </div>
        `
        : renderProfileResourceEmpty('No photos yet');

    return renderProfileResourceCard({
        type: 'photos',
        iconSvg: icon.image,
        title: 'Photos',
        count: photos.length,
        singular: 'photo',
        plural: 'photos',
        addLabel: 'Add photos',
        addAction: 'add-photos',
        body
    });
}

function renderProfileConnectedFiles(
    person
)
{
    const files =
        getArchiveFilesForPerson(
            person.id
        );

    const preview =
        files.slice(
            0,
            3
        );

    const body =
        preview.length
            ? renderConnectedFileList({
                files:
              preview,

                contextType:
              'person',

                contextId:
              person.id,

                emptyText:
              'No archive files linked'
            })
            : renderProfileResourceEmpty(
                'No archive files linked'
            );

    return renderProfileResourceCard({
        type:
          'archive',

        iconSvg:
          icon.file,

        title:
          'Archive',

        count:
          files.length,

        singular:
          'file',

        plural:
          'files',

        addLabel:
          'Add file',

        addAction:
          'add-files',

        body
    });
}

function renderProfileNoteRows(
    person,
    notes =
        getNotesForPerson(
            person.id
        )
)
{
    const preview =
        notes.slice(
            0,
            3
        );

    if (!preview.length)
    {
        return renderProfileResourceEmpty(
            'No notes yet'
        );
    }

    return renderConnectedNoteList({
        notes: preview,
        contextType: 'person',
        contextId: person.id,
        limit: 3
    });
}

function renderProfileConnectedNotes(
    person
)
{
    const notes =
        getNotesForPerson(
            person.id
        );

    return renderProfileResourceCard({
        type:
          'notes',

        iconSvg:
          icon.note,

        title:
          'Notes',

        count:
          notes.length,

        singular:
          'note',

        plural:
          'notes',

        addLabel:
          'Add note',

        addAction:
          'add-note',

        body:
          renderProfileNoteRows(
              person,
              notes
          )
    });
}

function renderProfileConnectedPlaces(
    person
)
{
    const places =
        getProfileConnectedPlaces(
            person.id
        );

    const preview =
        places.slice(0, 3);

    const coordinateWarning =
        t(
            'Location has no coordinates'
        );

    const body = preview.length
        ? `
          <div
            class="
              profile-resource-list
            ">

            ${preview
                .map(place =>
                {
                    const accessibleLabel = [
                        `Open ${place.title}`,

                        !place.hasCoordinates
                            ? coordinateWarning
                            : ''
                    ]
                        .filter(Boolean)
                        .join('. ');

                    return `
                  <button
                    class="
                      profile-resource-row
                      profile-place-preview-row
                    "
                    type="button"
                    data-profile-place="${escapeHtml(
                        place.id
                    )}"
                    aria-label="${escapeHtml(
                        accessibleLabel
                    )}">

                    <span
                      class="
                        profile-place-preview-title
                      ">

                      <strong>
                        ${escapeHtml(
                            place.title
                        )}
                      </strong>

                      ${
                            !place.hasCoordinates
                                ? `
                            <span
                              class="
                                profile-place-coordinate-warning
                              "
                              role="img"
                              aria-label="${escapeHtml(
                                    coordinateWarning
                                )}"
                              title="${escapeHtml(
                                    coordinateWarning
                                )}">
                              ${icon.warning}
                            </span>
                          `
                                : ''
                        }
                    </span>

                    <small
                      class="
                        profile-place-preview-meta
                      ">
                      ${escapeHtml(
                            place.meta
                        )}
                    </small>
                  </button>
                `;
                })
                .join('')}
          </div>
        `
        : renderProfileResourceEmpty(
            'No places linked'
        );

    return renderProfileResourceCard({
        type: 'places',
        iconSvg: icon.mapPin,
        title: 'Places',
        count: places.length,
        singular: 'place',
        plural: 'places',
        body
    });
}

function renderProfileFamilyHub(person)
{
    const count = relationshipCount(person.id);

    return `
        <section
          class="profile-side-card profile-family-hub"
          aria-label="Family relationships">

          <h3 class="profile-family-head">
            <span class="section-title profile-family-title">
              <span
                class="profile-family-title-icon"
                aria-hidden="true">
                ${icon.peoplegroup}
              </span>

              <span>Family</span>
            </span>

            <span
              class="profile-family-count"
              aria-label="${count} ${
                    count === 1
                        ? 'relationship'
                        : 'relationships'
                }">
              ${count}
            </span>
          </h3>

          <div class="profile-family-scroll">
            ${renderRelationships(person.id)}
          </div>
        </section>
      `;
}

function updateProfilePhotoCarousel(carousel)
{
    const track = carousel?.querySelector(
        '[data-profile-photo-track]'
    );

    const previous = carousel?.querySelector(
        '[data-profile-photo-prev]'
    );

    const next = carousel?.querySelector(
        '[data-profile-photo-next]'
    );

    if (!track || !previous || !next) return;

    previous.disabled = track.scrollLeft <= 2;

    next.disabled =
        track.scrollLeft + track.clientWidth
        >= track.scrollWidth - 2;
}

function bindProfilePhotoCarousels(root = main)
{
    root
        .querySelectorAll('[data-profile-photo-carousel]')
        .forEach(carousel =>
        {
            const track = carousel.querySelector(
                '[data-profile-photo-track]'
            );

            const previous = carousel.querySelector(
                '[data-profile-photo-prev]'
            );

            const next = carousel.querySelector(
                '[data-profile-photo-next]'
            );

            /*
          * Carousels with three or fewer photos do not render
          * navigation buttons.
          */
            if (!track || !previous || !next) return;

            const scrollTrack = direction =>
            {
                track.scrollBy({
                    left:
                Math.max(track.clientWidth * .82, 160)
                * direction,
                    behavior: 'smooth'
                });
            };

            previous.addEventListener('click', () =>
            {
                scrollTrack(-1);
            });

            next.addEventListener('click', () =>
            {
                scrollTrack(1);
            });

            track.addEventListener(
                'scroll',
                () => updateProfilePhotoCarousel(carousel),
                { passive: true }
            );

            requestAnimationFrame(() =>
            {
                updateProfilePhotoCarousel(carousel);
            });
        });
}

function activateProfileCardSection(
    card,
    sectionId,
    {
        focusTab = false
    } = {}
)
{
    if (!card) return;

    const activeSection =
        normalizeProfileCardSection(sectionId);

    state.peopleProfileEditTab =
        activeSection;

    const tabs = [
        ...card.querySelectorAll(
            '[data-profile-card-tab]'
        )
    ];

    const panels = [
        ...card.querySelectorAll(
            '[data-profile-card-panel]'
        )
    ];

    tabs.forEach(tab =>
    {
        const isActive =
            tab.dataset.profileCardTab
          === activeSection;

        tab.classList.toggle(
            'active',
            isActive
        );

        tab.setAttribute(
            'aria-selected',
            isActive ? 'true' : 'false'
        );

        tab.tabIndex = isActive ? 0 : -1;
    });

    panels.forEach(panel =>
    {
        const isActive =
            panel.dataset.profileCardPanel
          === activeSection;

        panel.classList.toggle(
            'active',
            isActive
        );

        panel.setAttribute(
            'aria-hidden',
            isActive ? 'false' : 'true'
        );

        if (isActive)
        {
            panel.removeAttribute('inert');
        }
        else
        {
            panel.setAttribute('inert', '');
        }
    });

    if (focusTab)
    {
        card.querySelector(
            `[data-profile-card-tab="${
                CSS.escape(activeSection)
            }"]`
        )?.focus();
    }
}

function bindProfileCardTabs(card)
{
    if (!card) return;

    const tabs = [
        ...card.querySelectorAll(
            '[data-profile-card-tab]'
        )
    ];

    tabs.forEach((tab, index) =>
    {
        tab.addEventListener('click', () =>
        {
            activateProfileCardSection(
                card,
                tab.dataset.profileCardTab
            );
        });

        tab.addEventListener(
            'keydown',
            event =>
            {
                const handledKeys = [
                    'ArrowLeft',
                    'ArrowRight',
                    'Home',
                    'End'
                ];

                if (
                    !handledKeys.includes(event.key)
                )
                {
                    return;
                }

                event.preventDefault();

                let nextIndex = index;

                if (event.key === 'ArrowLeft')
                {
                    nextIndex =
                        (index - 1 + tabs.length)
                % tabs.length;
                }

                if (event.key === 'ArrowRight')
                {
                    nextIndex =
                        (index + 1)
                % tabs.length;
                }

                if (event.key === 'Home')
                {
                    nextIndex = 0;
                }

                if (event.key === 'End')
                {
                    nextIndex = tabs.length - 1;
                }

                activateProfileCardSection(
                    card,
                    tabs[nextIndex]
                        .dataset.profileCardTab,
                    {
                        focusTab: true
                    }
                );
            }
        );
    });
}

function profileEditValidationFailure(
    section,
    message,
    focusSelector
)
{
    return {
        ok: false,
        section,
        message,
        focusSelector
    };
}

function collectProfileMainEdit()
{
    const living =
        main.querySelector(
            '#profileInlineLiving'
        )?.value || 'Unknown';

    const birthDate =
        collectGenealogyDateField(
            'profileInlineBirthField'
        );

    if (!birthDate)
    {
        return profileEditValidationFailure(
            'main',
            'Check the birth date before saving.',
            `
            [data-genealogy-date-field=
              "profileInlineBirthField"]
            [data-genealogy-date-input]
          `.replace(/\s+/g, ' ')
        );
    }

    const deathDate =
        living === 'Deceased'
            ? collectGenealogyDateField(
                'profileInlineDeathField'
            )
            : emptyGenealogyDate(
                'Exact date'
            );

    if (!deathDate)
    {
        return profileEditValidationFailure(
            'main',
            'Check the death date before saving.',
            `
            [data-genealogy-date-field=
              "profileInlineDeathField"]
            [data-genealogy-date-input]
          `.replace(/\s+/g, ' ')
        );
    }

    const burialDate = living === 'Deceased' ? collectGenealogyDateField('profileBurialDate') : null;
    if (living === 'Deceased' && !burialDate) return profileEditValidationFailure('main', 'Check the burial date before saving.', '#profileBurialDateDate');
    if (living === 'Deceased' && genealogyDateDefinitelyAfter(birthDate, deathDate))
        return profileEditValidationFailure('main', 'The death date is earlier than the birth date.', '#profileInlineDeath');

    return {
        ok: true,
        section: 'main',
        payload: {
            first:
            (() =>
            {
                const input = main.querySelector('#profileInlineFirst');
                return collectLocalizedDataFieldValue(input, input?.dataset.sourceValue || '').trim();
            })(),

            last:
            (() =>
            {
                const input = main.querySelector('#profileInlineLast');
                return collectLocalizedDataFieldValue(input, input?.dataset.sourceValue || '').trim();
            })(),

            patronym:
            (() =>
            {
                const input = main.querySelector('#profileInlinePatronym');
                return collectLocalizedDataFieldValue(input, input?.dataset.sourceValue || '').trim();
            })(),

            prefix:
            main.querySelector(
                '#profileInlinePrefix'
            )?.value.trim() || '',

            suffix:
            main.querySelector(
                '#profileInlineSuffix'
            )?.value.trim() || '',

            maidenName:
            (() =>
            {
                const input = main.querySelector('#profileInlineMaidenInput');
                return collectLocalizedDataFieldValue(input, input?.dataset.sourceValue || '').trim();
            })(),

            gender:
            main.querySelector(
                '#profileInlineGender'
            )?.value || 'Unknown',

            living,

            birthDate,
            birthPlace:
            readPlaceInputValue(
                '#profileInlineBirthPlace',
                main
            ),

            deathDate,
            deathPlace:
            readPlaceInputValue(
                '#profileInlineDeathPlace',
                main
            ),

            deathReason:
            main.querySelector(
                '#profileInlineDeathReason'
            )?.value.trim() || '',

            burialPlace:
            readPlaceInputValue(
                '#profileInlineBurialPlace',
                main
            ),
            burialDate
        }
    };
}

function collectProfileEducationEdit()
{
    const payload = collectRepeatableFacts(main, 'EDUC');
    return payload.invalid ? { ok: false, section: 'education', message: payload.message, focusSelector: payload.focusSelector } : { ok: true, section: 'education', payload };
}

function collectProfileWorkEdit()
{
    const payload = collectRepeatableFacts(main, 'OCCU');
    return payload.invalid ? { ok: false, section: 'work', message: payload.message, focusSelector: payload.focusSelector } : { ok: true, section: 'work', payload };
}

function collectProfileOtherEdit()
{
    const repeatable = collectRepeatableFacts(main, 'FACT');
    if (repeatable.invalid) return { ok: false, section: 'other', message: repeatable.message, focusSelector: repeatable.focusSelector };
    const baptismDate =
        collectGenealogyDateField(
            'profileBaptismDate'
        );

    if (!baptismDate)
    {
        return profileEditValidationFailure(
            'other',
            'Check the baptism date before saving.',
            `
            [data-genealogy-date-field=
              "profileBaptismDate"]
            [data-genealogy-date-input]
          `.replace(/\s+/g, ' ')
        );
    }

    return {
        ok: true,
        section: 'other',
        payload: {
            repeatable,
            religion:
            readReligionField(
                main,
                'profileReligion'
            ),

            baptismDate,

            baptismPlace:
            readPlaceInputValue(
                '#profileBaptismPlace',
                main
            )
        }
    };
}

function collectProfileEditSections()
{
    const card = main.querySelector('[data-profile-card-root]');
    const collectors = { main: collectProfileMainEdit, education: collectProfileEducationEdit,
        work: collectProfileWorkEdit, other: collectProfileOtherEdit };
    const results = Object.entries(collectors).filter(([section]) =>
    {
        const initial = card?.profileSectionSnapshots?.[section];
        return initial === undefined || initial !== profileSectionDraftSnapshot(card.querySelector(`[data-profile-card-panel="${section}"]`));
    }).map(([, collect]) => collect());

    const invalid = results.find(
        result => !result.ok
    );

    if (invalid) return invalid;

    return {
        ok: true,
        payloads: Object.fromEntries(
            results.map(result => [
                result.section,
                result.payload
            ])
        )
    };
}

function applyProfileMainEdit(
    person,
    payload
)
{
    const centralPerson =
        getPerson(person.id);

    if (!centralPerson) return;

    ensurePersonCentralStructures(
        centralPerson
    );

    const first =
        payload.first
        || centralPerson.names.first
        || person.first
        || '';

    const last =
        payload.last
        || centralPerson.names.last
        || person.surname
        || '';

    // display name is derived below via rebuildPersonDisplayName


    const gender =
        String(payload.gender || '')
            .toLowerCase();

    const normalizedGender =
        gender === 'male'
        || gender === 'female'
            ? gender
            : 'unknown';

    const livingStatus =
        normalizeLivingStatus(
            payload.living
        );

    const birthPlace =
        resolvePlaceAssignment(
            payload.birthPlace,
            centralPerson.birth?.placeId
        );

    const deathPlace =
        resolvePlaceAssignment(
            payload.deathPlace,
            centralPerson.death?.placeId
        );

    const burialPlace =
        resolvePlaceAssignment(
            payload.burialPlace,
            centralPerson.death
                ?.burialPlaceId
        );

    centralPerson.names.first = first;
    centralPerson.names.middle = payload.patronym || '';
    centralPerson.names.last = last;
    centralPerson.names.prefix = normalizeNameSegment(payload.prefix);
    centralPerson.names.suffix = normalizeNameSegment(payload.suffix);
    centralPerson.names.maiden = payload.maidenName || '';
    rebuildPersonDisplayName(centralPerson);


    centralPerson.gender =
        normalizedGender;

    centralPerson.livingStatus =
        livingStatus;

    centralPerson.birth = {
        ...payload.birthDate,
        placeId: birthPlace.placeId,
        placeText: birthPlace.placeText,
        address: birthPlace.address
    };

    if (livingStatus === 'Deceased')
    {
        if (personEventByTag(centralPerson, 'BURI') || hasGenealogyDateValue(payload.burialDate) || burialPlace.placeId || burialPlace.placeText)
            upsertPersonEvent(centralPerson, 'BURI', { date: genealogyDateOrNull(payload.burialDate), placeId: burialPlace.placeId, placeText: burialPlace.placeText, address: burialPlace.address });
        centralPerson.death = {
            ...payload.deathDate,
            placeId: deathPlace.placeId,
            placeText: deathPlace.placeText,
            address: deathPlace.address,
            reason: payload.deathReason,
            cause: payload.deathReason,
            burialPlaceId:
            burialPlace.placeId,
            burialPlaceText:
            burialPlace.placeText,
            burialAddress:
            burialPlace.address
        };
    }
    else
    {
        centralPerson.death = normalizeGenealogyDateInput(centralPerson.death);
    }

    person.first = first;
    person.surname = last;
    person.name = centralPerson.names.display;
    person.gender = normalizedGender;
    person.living = livingStatus;
    person.birth =
        formatGenealogyDateLabel(
            payload.birthDate
        );
    person.birthPlace =
        birthPlace.placeText;

    if (livingStatus === 'Deceased')
    {
        person.death =
            formatGenealogyDateLabel(
                payload.deathDate
            );

        person.deathPlace =
            deathPlace.placeText;
    }
    else
    {
        person.death = '';
        person.deathPlace = '';
    }
}

function applyProfileEducationEdit(person, payload)
{
    applyRepeatableFacts(getPerson(person.id), payload);
}

function applyProfileWorkEdit(person, payload)
{
    applyRepeatableFacts(getPerson(person.id), payload);
}

function applyProfileOtherEdit(
    person,
    payload
)
{
    const centralPerson =
        getPerson(person.id);

    if (!centralPerson) return;

    upsertPersonAttribute(
        centralPerson,
        'RELI',
        {
            value:
            normalizeReligionValue(
                payload.religion
            )
        }
    );

    const baptism =
        upsertPersonEvent(
            centralPerson,
            'BAPM',
            {
                date:
              genealogyDateOrNull(
                  payload.baptismDate,
                  'Exact date'
              )
            }
        );

    const resolvedPlace =
        resolvePlaceAssignment(
            payload.baptismPlace,
            baptism.placeId
        );

    baptism.placeId =
        resolvedPlace.placeId;

    baptism.placeText =
        resolvedPlace.placeText;

    baptism.address =
        resolvedPlace.address;
    applyRepeatableFacts(centralPerson, payload.repeatable);
}

function applyProfileEditSections(
    person,
    payloads
)
{
    if (payloads.main) applyProfileMainEdit(
        person,
        payloads.main
    );

    if (payloads.education) applyProfileEducationEdit(
        person,
        payloads.education
    );

    if (payloads.work) applyProfileWorkEdit(
        person,
        payloads.work
    );

    if (payloads.other) applyProfileOtherEdit(
        person,
        payloads.other
    );

    person.updated =
        'Just now';

    const centralPerson =
        getPerson(person.id);

    markPersonUpdated(
        centralPerson
    );

    sampleData.events =
        rebuildSampleEventsAndPruneSourceLinks();
}

function showProfileEditValidationError(
    card,
    result
)
{
    activateProfileCardSection(
        card,
        result.section
    );

    showToast(result.message);

    requestAnimationFrame(() =>
    {
        card?.querySelector(
            result.focusSelector
        )?.focus();
    });
}

function cancelPeopleProfileEditing()
{
    state.peopleProfileEditing = false;
    renderPeople();
    showToast('Profile editing cancelled.');
}

function bindPeopleProfileControls(person)
{
    bindRepeatableFacts(main);
    bindToasts(main);
    bindGenealogyDateFields(main);
    bindPlaceComboboxes(main);
    bindNameAffixComboboxes(main);

    bindRelationshipList(main, 'profile');
    bindProfilePhotoCarousels(main);
    bindPersonPhotoUnlinkButtons(main);
    bindConnectedNoteLinks(
        main
    );
    bindConnectedFileLinks(
        main,
        {
            onUnlinked:
            ({
                contextType
            }) =>
            {
                if (
                    contextType
                !== 'person'
                )
                {
                    return;
                }

                renderAfterPersonConnectedResourcesChanged();
            }
        }
    );
    bindTimelineSourceControls(
        main,
        {
            afterSave:
            renderAfterPersonConnectedResourcesChanged
        }
    );
    bindConnectedSourceLinks(
        main,
        {
            onUnlinked:
            ({
                targetType
            }) =>
            {
                if (
                    targetType
                  === 'person'
                )
                {
                    renderAfterPersonConnectedResourcesChanged();
                }
            }
        }
    );
    const profileCard = main.querySelector(
        '[data-profile-card-root]'
    );
    if (state.peopleProfileEditing && profileCard)
        profileCard.profileSectionSnapshots = Object.fromEntries([...profileCard.querySelectorAll('[data-profile-card-panel]')]
            .map(panel => [panel.dataset.profileCardPanel, profileSectionDraftSnapshot(panel)]));
    bindProfileCardTabs(profileCard);
    main.querySelector('#backPeopleList')?.addEventListener('click', () =>
    {
        state.peopleView = 'directory'; state.peopleSide = 'people'; state.peopleProfileEditing = false; renderPeople(); renderTopbar();
    });
    main
        .querySelector('#profileEditButton')
        ?.addEventListener('click', () =>
        {
            if (state.peopleProfileEditing)
            {
                cancelPeopleProfileEditing();
                return;
            }

            state.peopleProfileEditing = true;
            renderPeople();
        });
    main
        .querySelector('#profileAddRelative')
        ?.addEventListener(
            'click',
            event =>
            {
                openRelativePopover(
                    event.currentTarget,
                    person.id
                );
            }
        );
    main
        .querySelector('#profileMoreActions')
        ?.addEventListener(
            'click',
            event =>
            {
                openPeopleActionsMenu(
                    person.id,
                    event.currentTarget,
                    {
                        includeProfile: false
                    }
                );
            }
        );
    main.querySelector('#profileInlineGender')?.addEventListener('change', event =>
    {
        const isFemale = event.target.value === 'Female';
        const row = main.querySelector('#profileInlineMaiden');
        const editGrid = main.querySelector('.profile-main-edit-grid');
        if (row) row.hidden = !isFemale;
        if (editGrid)
        {
            editGrid.classList.toggle('has-maiden', isFemale);
            editGrid.classList.toggle('no-maiden', !isFemale);
        }
    });
    const profileStatusButton = main.querySelector('#profileStatusButton');
    const profileStatusMenu = main.querySelector('#profileStatusMenu');
    profileStatusButton?.addEventListener('click', event =>
    {
        event.stopPropagation();
        const expanded = profileStatusButton.getAttribute('aria-expanded') === 'true';
        profileStatusButton.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        if (profileStatusMenu) profileStatusMenu.hidden = expanded;
    });
    main.querySelectorAll('[data-profile-status-value]').forEach(option => option.addEventListener('click', event =>
    {
        event.stopPropagation();
        const status = option.dataset.profileStatusValue;
        const input = main.querySelector('#profileInlineLiving');
        const label = main.querySelector('#profileStatusLabel');
        const dot = main.querySelector('#profileStatusButton .add-person-status-current .add-person-status-dot');
        if (input) input.value = status;
        if (label) label.textContent = status;
        if (dot) dot.className = `add-person-status-dot ${statusDotClass(status)}`;
        main.querySelectorAll('[data-profile-status-value]').forEach(item =>
        {
            const active = item.dataset.profileStatusValue === status;
            item.classList.toggle('active', active);
            item.setAttribute('aria-selected', active ? 'true' : 'false');
            const check = item.querySelector('[data-profile-status-check]');
            if (check) check.innerHTML = active ? icon.check : '';
        });
        const isDeceased = status === 'Deceased';
        const deathModel = main.querySelector('[data-genealogy-date-field="profileInlineDeathField"] [data-genealogy-date-model]');
        if (deathModel)
        {
            const currentDeath = normalizeGenealogyDateInput(JSON.parse(deathModel.value || '{}'));
            if (isDeceased && !currentDeath.date && !currentDeath.dateLabel)
            {
                applyGenealogyDateToField('profileInlineDeathField', emptyGenealogyDate('Exact date'));
            }
            if (!isDeceased)
            {
                applyGenealogyDateToField('profileInlineDeathField', emptyGenealogyDate('Exact date'));
            }
        }
        const group = main.querySelector('#profileInlineDeathFields');
        const extraGroup = main.querySelector('#profileInlineDeathExtraFields');
        if (group) group.hidden = !isDeceased;
        if (extraGroup) extraGroup.hidden = !isDeceased;
        main.querySelectorAll('.profile-field-death-date, .profile-field-death-place, .profile-field-death-reason, .profile-field-burial-place').forEach(field =>
        {
            field.hidden = !isDeceased;
        });
        const editGrid = main.querySelector('.profile-main-edit-grid');
        if (editGrid) editGrid.classList.toggle('is-deceased', isDeceased);
        if (profileStatusMenu) profileStatusMenu.hidden = true;
        profileStatusButton?.setAttribute('aria-expanded', 'false');
    }));
    main
        .querySelector('#profileCancelEdit')
        ?.addEventListener(
            'click',
            cancelPeopleProfileEditing
        );

    main
        .querySelector('#profileSaveInlineEdit')
        ?.addEventListener('click', () =>
        {
            const result =
                collectProfileEditSections();

            if (!result.ok)
            {
                showProfileEditValidationError(
                    profileCard,
                    result
                );

                return;
            }

            applyProfileEditSections(
                person,
                result.payloads
            );

            state.peopleProfileEditing = false;

            renderPeople();

            showToast(
                'Profile changes saved.'
            );
        });
    main.querySelector('[data-profile-add-fact]')?.addEventListener('click', () => openAddFactOverlay(person));
    main.querySelectorAll('[data-profile-partner-id]').forEach(button =>
    {
        button.addEventListener('click', () => openProfileFamilyMember(button.dataset.profilePartnerId));
        button.addEventListener('keydown', event =>
        {
            if (event.key === 'Enter' || event.key === ' ')
            {
                event.preventDefault(); openProfileFamilyMember(button.dataset.profilePartnerId);
            }
        });
    });
    main.querySelectorAll('[data-profile-photo]').forEach(button => button.addEventListener('click', () => openProfilePhoto(button.dataset.profilePhoto)));
    main.querySelector('[data-profile-resource-action="add-photos"]') ?.addEventListener('click', () => openAddPhotosToPersonModal(person.id));
    main
        .querySelector(
            '[data-profile-resource-action="add-files"]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                openPersonFilesModal(
                    person.id
                );
            }
        );
    main
        .querySelector(
            '[data-profile-resource-action="add-note"]'
        )
        ?.addEventListener(
            'click',
            () =>
                openPersonNotesModal(
                    person.id,
                    'profile'
                )
        );
    main
        .querySelector(
            '[data-profile-resource-action="add-sources"]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                const centralPerson =
                    getPerson(
                        person.id
                    );

                if (!centralPerson)
                {
                    return;
                }

                openSourcesForTargetModal({
                    targetType:
                'person',

                    targetId:
                centralPerson.id,

                    projectId:
                centralPerson.projectId,

                    title:
                'Add sources',

                    subtitle:
                `Connect existing sources to ${
                    centralPerson.names?.display
                  || 'this person'
                }.`,

                    afterSave:
                renderAfterPersonConnectedResourcesChanged
                });
            }
        );
    main.querySelectorAll('[data-profile-place]').forEach(button => button.addEventListener('click', () => openProfilePlace(button.dataset.profilePlace)));
    const profileViewAllActions = {
        archive:
          () =>
              openProfileAllArchive(
                  person.id
              ),

        notes:
          () =>
              openProfileAllNotes(
                  person.id
              ),

        photos:
          () =>
              openProfileAllPhotos(
                  person.id
              ),

        places:
          () =>
              openProfileAllPlaces(
                  person.id
              )
    };

    main
        .querySelectorAll('[data-profile-view-all]')
        .forEach(button =>
        {
            button.addEventListener('click', () =>
            {
                profileViewAllActions[
                    button.dataset.profileViewAll
                ]?.();
            });
        });
}

function openProfileArchiveFile(fileId)
{
    if (!fileId)
    {
        showToast('Archive item preview is simulated.'); return;
    }
    openFamilyArchiveItem(fileId);
}

function openProfilePhoto(photoId)
{
    openAlbumsForPhoto(photoId);
}

function openProfilePlace(placeId)
{
    if (!placeId)
    {
        showToast('Place record not found.');
        return;
    }

    appNavigationMarkIntent({ type: 'place', id: placeId });

    state.activeModule = 'Places';
    state.placesView = 'all';
    state.selectedPlaceId = placeId;
    render();
}

function openProfileAllArchive(
    personId =
        state.selectedPeopleId
)
{
    openArchiveForPerson(
        personId
    );
}

function openProfileAllNotes(
    personId =
        state.selectedPeopleId
)
{
    openNotesForContext(
        'person',
        personId
    );
}

function openProfileAllPhotos(personId = state.selectedPeopleId)
{
    openAlbumsForPerson(personId);
}

function openProfileAllPlaces(
    personId =
        state.selectedPeopleId
)
{
    const person =
        getPerson(personId);

    state.activeModule = 'Places';
    state.placesView = 'all';

    state.placesSavedFilterId =
        '';

    state.placesFilters = {
        ...defaultPlaceFilters,

        personId:
          person?.id || ''
    };

    state.selectedPlaceId = null;
    state.placesSearch = '';

    render();
}

function openProfileFamilyMember(
    personId
)
{
    if (!personId)
    {
        showToast(
            'Placeholder family member; add a linked person later.'
        );

        return;
    }

    if (!getPerson(personId))
    {
        showToast(
            'This family member is not linked to a People profile yet.'
        );

        return;
    }

    state.selectedPeopleId =
        personId;

    state.selectedPersonId =
        personId;

    state.peopleView =
        'profile';

    state.peopleSide =
        'profile';

    renderPeople();
}

