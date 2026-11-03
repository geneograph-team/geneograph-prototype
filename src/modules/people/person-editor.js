function addPersonModalSnapshot(modal)
{
    const controls = [...modal.querySelectorAll('input, select, textarea')]
        .filter(control => control.type !== 'search' && control.id !== 'addPersonCreateAnother')
        .map(control => [control.id || control.name || '', control.type, control.value,
            control.type === 'checkbox' || control.type === 'radio' ? control.checked : null]);
    const attachments = Object.fromEntries(Object.entries(addPersonAttachmentDraftState)
        .map(([key, ids]) => [key, [...ids].sort()]));
    return JSON.stringify({ controls, attachments });
}

function openAddPersonDiscardConfirm()
{
    if (document.getElementById('addPersonDiscardOverlay')) return;
    const overlay = document.createElement('div');
    overlay.id = 'addPersonDiscardOverlay';
    overlay.className = 'add-person-mini-backdrop';
    overlay.innerHTML = `<div class="add-person-mini-card" role="alertdialog" aria-modal="true" aria-labelledby="addPersonDiscardTitle">
        <div class="add-person-mini-head"><div><h3 id="addPersonDiscardTitle">Discard changes?</h3>
        <p>Unsaved changes to this person will be lost.</p></div></div>
        <div class="add-person-mini-footer"><button class="button secondary" type="button" data-add-person-continue-editing>Continue editing</button>
        <button class="button danger" type="button" data-add-person-discard>Discard changes</button></div></div>`;
    const returnFocus = document.activeElement;
    document.body.appendChild(overlay);
    localizeUI(overlay);
    overlay.querySelector('[data-add-person-continue-editing]').addEventListener('click', () =>
    {
        overlay.remove();
        returnFocus?.focus?.({ preventScroll: true });
    });
    overlay.querySelector('[data-add-person-discard]').addEventListener('click', () =>
    {
        overlay.remove();
        closeModal({ force: true });
    });
    overlay.querySelector('[data-add-person-continue-editing]').focus();
}

function openAddPersonModal(title, subtitle, options = {})
{
    const isEditMode = options.mode === 'edit';
    const editPerson = isEditMode ? getPerson(options.personId) : null;
    initializeAddPersonAttachmentDraft(
        editPerson
    );
    addPersonPossibleMatchState = {
        selectedPersonId: ''
    };
    const editValues = editPersonFormValues(editPerson);
    const isPartnerMode = options.relativeType === 'partner';
    const showRelationshipBlock = relationshipBlockShouldShow(options, editPerson);
    const connectionIntent = addPersonCreateConnectionIntent(options);
    const initialParentFamilySelection = defaultParentFamilySelection(
        connectionIntent.anchorPersonId,
        connectionIntent.relationshipType,
        options.parentFamilyId
          || options.parentFamilySelection
          || ''
    );
    const initialConnectionDetailType = options.connectionDetailType
        || (connectionIntent.relationshipType === 'parent'
            && parentIdsForPerson(connectionIntent.anchorPersonId).length >= 2
            ? 'Adoptive' : 'Biological');
    const autoFatherForNewSibling = connectionIntent.relationshipType === 'sibling'
        && !parentIdsForPerson(connectionIntent.anchorPersonId).length;

    const anchorGender = String(getPerson(connectionIntent.anchorPersonId)?.gender || '').toLowerCase();
    const relativeGender = isPartnerMode && connectionIntent.shouldConnect
        ? anchorGender === 'male' ? 'Female' : anchorGender === 'female' ? 'Male' : 'Unknown'
        : getGenderForRelativeType(options.relativeType);

    const initialGender = options.gender
        || (isEditMode ? editValues.gender
            : !connectionIntent.shouldConnect && state.activeModule === 'People' ? 'Male' : relativeGender)
        || 'Unknown';

    const initialStatus = options.livingStatus
        || (isEditMode ? editValues.livingStatus : 'Living');
    openModal(`<div class="modal add-person-modal" role="dialog" aria-modal="true" aria-labelledby="addPersonTitle">
        <div class="modal-header add-person-header"><div class="add-person-icon">${icon.people}</div><div><h2 id="addPersonTitle">${escapeHtml(title)}</h2><p>${escapeHtml(subtitle)}</p></div><button class="close-button" type="button" data-close>${icon.close}</button></div>
        <div class="modal-body add-person-grid">
          <div class="form-grid">
            <section><h3 class="form-section-title">Identity</h3><div class="two-col-form add-person-demographics">
              <div class="field add-person-select-field">
                <label for="addPersonGender">Gender</label>
                <select class="compact-select add-person-select" id="addPersonGender">
                  <option ${initialGender === 'Male' ? 'selected' : ''}>Male</option>
                  <option ${initialGender === 'Female' ? 'selected' : ''}>Female</option>
                  <option ${initialGender === 'Unknown' ? 'selected' : ''}>Unknown</option>
                </select>
                <span class="add-person-select-chevron" aria-hidden="true">${icon.chevron}</span>
              </div>
              <div class="field add-person-status-field"><label>Living status</label><button class="add-person-status-button" type="button" id="addPersonStatusButton" aria-haspopup="listbox" aria-expanded="false"><span class="add-person-status-current"><span class="add-person-status-dot ${statusDotClass(initialStatus)}"></span><span id="addPersonStatusLabel">${initialStatus}</span></span><span class="add-person-status-chevron" aria-hidden="true">${icon.chevron}</span></button><input type="hidden" id="addPersonLivingStatus" value="${initialStatus}"><div class="add-person-status-menu" id="addPersonStatusMenu" role="listbox" hidden>${['Living','Deceased','Unknown'].map(status => `<button class="add-person-status-option ${status === initialStatus ? 'active' : ''}" type="button" role="option" aria-selected="${status === initialStatus ? 'true' : 'false'}" data-status-value="${status}"><span><span class="add-person-status-dot ${statusDotClass(status)}"></span>${status}</span><span data-status-check>${status === initialStatus ? icon.check : ''}</span></button>`).join('')}</div></div>
            </div><div class="two-col-form add-person-name-fields">
              <div class="field">
                <label for="addPersonFirstName">First name</label>
                <input id="addPersonFirstName" data-source-value="${escapeHtml(editValues.firstName)}" value="${escapeHtml(localizedDataFieldValue(editValues.firstName))}" placeholder="e.g. Silver">
              </div>

              <div class="field">
                <label for="addPersonMiddleName">Middle name / Patronym</label>
                <input id="addPersonMiddleName" data-source-value="${escapeHtml(editValues.middleName)}" value="${escapeHtml(localizedDataFieldValue(editValues.middleName))}" placeholder="e.g. Purrington">
              </div>

              <div class="field">
                <label for="addPersonLastName">Last name</label>
                <input id="addPersonLastName" data-source-value="${escapeHtml(editValues.lastName)}" value="${escapeHtml(localizedDataFieldValue(editValues.lastName))}" placeholder="e.g. Whiskerfield">
              </div>

              <div class="field add-person-conditional-field" id="maidenNameField">
                <label for="addPersonMaidenName">Maiden name</label>
                <input id="addPersonMaidenName" data-source-value="${escapeHtml(editValues.maidenName)}" value="${escapeHtml(localizedDataFieldValue(editValues.maidenName))}" placeholder="e.g. Milkpaw">
              </div>
            </div></section>
          ${!isEditMode && connectionIntent.shouldConnect && connectionIntent.relationshipType === 'parent'
        ? `<div class="field add-person-select-field">
              <label for="addPersonConnectionDetailType">${escapeHtml(t('Relationship type'))}</label>
              <select class="compact-select add-person-select" id="addPersonConnectionDetailType">${parentChildRelationshipTypeOptions(initialConnectionDetailType)}</select>
              <span class="add-person-select-chevron" aria-hidden="true">${icon.chevron}</span>
            </div>` : ''}
          <section>
            <h3 class="form-section-title">Life events</h3>
            <div class="add-person-life-grid">
              <div class="add-person-life-event-block">
                ${renderGenealogyDateField('addPersonBirth', 'Birth date', editPerson?.birth || emptyGenealogyDate('Exact date'), {
                    inputId: 'addPersonBirthDate',
                    typeId: 'addPersonBirthDateType',
                    placeholder: 'e.g. 14 Feb 1915',
                    defaultDateType: 'Exact date',
                    className: 'genealogy-date-inline-range'
                })}

              ${renderPlaceCombobox({
                    id: 'addPersonBirthPlace',
                    label: 'Birth place',
                    value: editValues.birthPlace,
                    selectedPlaceId: editPerson?.birth?.placeId || '',
                    addressValue: editPerson?.birth?.address || '',
                    placeholder: 'e.g. Pawford, England'
                })}

              <div class="add-person-life-event-block add-person-death-fields" id="deathFieldsGroup">
                ${renderGenealogyDateField('addPersonDeath', 'Death date', editPerson?.death || emptyGenealogyDate('Exact date'), {
                    inputId: 'addPersonDeathDate',
                    typeId: 'addPersonDeathDateType',
                    placeholder: 'e.g. 14 Feb 1925',
                    defaultDateType: 'Exact date',
                    className: 'genealogy-date-inline-range'
                })}

                ${renderPlaceCombobox({
                    id: 'addPersonDeathPlace',
                    label: 'Death place',
                    value: editValues.deathPlace,
                    selectedPlaceId: editPerson?.death?.placeId || '',
                    addressValue: editPerson?.death?.address || '',
                    placeholder: 'e.g. Meowbridge, England'
                })}
              </div>
            </div>
          </section>
          </div>
          <aside>
            ${renderAddPersonAttachmentSideCard(editPerson)}
            ${isEditMode ? '' : renderAddPersonPossibleMatchesCard(options, editPerson)}
          </aside>
          ${!isEditMode && connectionIntent.shouldConnect && ['child', 'sibling'].includes(connectionIntent.relationshipType)
        ? `<section class="add-person-family-connection" data-add-person-family-connection>
              <div class="add-person-facts-section">
                <button class="add-person-facts-header" type="button" data-add-person-family-toggle aria-expanded="false" aria-controls="addPersonFamilyBody">
                  <span class="add-person-facts-header-main"><span class="add-person-facts-chevron" aria-hidden="true">${icon.chevron}</span><span>${escapeHtml(t('Family connection'))}</span></span>
                </button>
                <div class="add-person-facts-body add-person-family-body" id="addPersonFamilyBody" data-add-person-family-body hidden>
                  <div class="field add-person-select-field">
                    <label for="addPersonConnectionDetailType">${escapeHtml(t('Relationship type'))}</label>
                    <select class="compact-select add-person-select" id="addPersonConnectionDetailType" ${autoFatherForNewSibling ? 'disabled' : ''}>${autoFatherForNewSibling
                        ? `<option value="Biological">${escapeHtml(t('Biological'))}</option>`
                        : parentChildRelationshipTypeOptions(initialConnectionDetailType)}</select>
                    <span class="add-person-select-chevron" aria-hidden="true">${icon.chevron}</span>
                    <span class="add-person-family-error" data-add-person-detail-error hidden></span>
                  </div>
                  ${renderParentFamilySelector({
                    anchorPersonId: connectionIntent.anchorPersonId,
                    relationshipType: connectionIntent.relationshipType,
                    selectedValue: initialParentFamilySelection,
                    controlId: 'addPersonParentFamily',
                    showSelectionLabel: true,
                    showHeading: false
                  })}
                </div>
              </div>
            </section>` : ''}
          ${showRelationshipBlock ? renderAddPersonRelationshipBlock(options, editPerson) : ''}
          ${renderAddPersonAdditionalFacts(editPerson)}
        </div>
        <div class="modal-footer add-person-footer">
          <div class="add-person-footer-left">
            ${!isEditMode && ['child', 'sibling'].includes(connectionIntent.relationshipType) ? `
              <label class="checkbox-row add-person-repeat">
                <input type="checkbox" id="addPersonCreateAnother">
                <span>
                  Create and add another<br>
                  <span class="panel-muted">Add person and reopen this window</span>
                </span>
              </label>
            ` : ''}
          </div>

          <div class="add-person-footer-actions">
            <button class="button secondary" type="button" data-close>Cancel</button>
            <button class="button primary" type="button" ${isEditMode ? 'data-save-edit-person' : 'data-create-person'}>
              ${isEditMode ? 'Save changes' : 'Create'}
            </button>
          </div>
        </div>
      </div>`);
    bindAddPersonModalControls(options.mode === 'edit' ? options.personId || '' : '');
    if (connectionIntent.relationshipType === 'parent')
    {
        const typeSelect = modalBackdrop.querySelector('#addPersonConnectionDetailType');
        const genderSelect = modalBackdrop.querySelector('#addPersonGender');
        let typeTouched = false;
        typeSelect?.addEventListener('change', () => { typeTouched = true; });
        genderSelect?.addEventListener('change', () =>
        {
            if (!typeSelect || typeTouched) return;
            typeSelect.value = newPersonBiologicalConflict(connectionIntent, '', genderSelect.value)
                ? 'Adoptive' : 'Biological';
        });
    }
    bindAddPersonSideCards(options, editPerson);
    bindManageRelativeReturn(options.managerReturn);
    bindRepeatableFacts(modalBackdrop.querySelector('.add-person-modal'));
    focusPersonFactTarget(options.factTarget);
    updateAddPersonConditionalFields();
    const addPersonModal = modalBackdrop.querySelector('.add-person-modal');
    const initialSnapshot = addPersonModalSnapshot(addPersonModal);
    modalBackdrop.beforeClose = () =>
    {
        if (!modalBackdrop.querySelector('.add-person-modal')) return true;
        if (addPersonModalSnapshot(addPersonModal) === initialSnapshot) return true;
        openAddPersonDiscardConfirm();
        return false;
    };
    if (isEditMode)
    {
        modalBackdrop.querySelector('[data-save-edit-person]')?.addEventListener('click', () =>
        {
            saveEditPersonModalValues(options.personId);
        });
    }
    else
    {
        modalBackdrop.querySelector('[data-create-person]')?.addEventListener('click', event =>
        {
            const button = event.currentTarget;
            if (button.disabled) return;

            button.disabled = true;
            const result = commitAddPersonModalCreate(title, subtitle, options);

            if (!result?.ok && modalBackdrop.contains(button))
            {
                button.disabled = false;
            }
        });
    }
}

function selectAddPersonPossibleMatch(personId, options = {}, editPerson = null)
{
    addPersonPossibleMatchState.selectedPersonId = personId || '';
    refreshAddPersonPossibleMatchesCard(options, editPerson);
    const intent = addPersonCreateConnectionIntent(options);
    if (intent.relationshipType !== 'sibling') return;
    const selectedPersonId = addPersonPossibleMatchState.selectedPersonId;
    const selector = modalBackdrop?.querySelector('[data-parent-family-selector]');
    const currentValue = selector?.querySelector('#addPersonParentFamily')?.value || '';
    const selection = defaultParentFamilySelection(intent.anchorPersonId, 'sibling',
        currentValue, selectedPersonId);
    if (selector)
        selector.outerHTML = renderParentFamilySelector({
            anchorPersonId: intent.anchorPersonId,
            relationshipType: 'sibling',
            otherPersonId: selectedPersonId,
            selectedValue: selection,
            controlId: 'addPersonParentFamily',
            showSelectionLabel: true,
            showHeading: false
        });
    const typeSelect = modalBackdrop?.querySelector('#addPersonConnectionDetailType');
    if (!typeSelect) return;
    const fixedBiological = !parentIdsForPerson(intent.anchorPersonId).length
        && !parentIdsForPerson(selectedPersonId).length;
    typeSelect.disabled = fixedBiological;
    typeSelect.innerHTML = fixedBiological
        ? `<option value="Biological">${escapeHtml(t('Biological'))}</option>`
        : parentChildRelationshipTypeOptions('Biological');
}

function refreshAfterPossibleMatchConnection(anchorPersonId)
{
    closeModal({ force: true });

    state.selectedPersonId = anchorPersonId || state.selectedPersonId;
    state.selectedPeopleId = anchorPersonId || state.selectedPeopleId;
    state.treeInspectorCollapsed = false;

    if (state.activeModule === 'Family Tree')
    {
        renderFamilyTreePreserveScroll?.() || renderFamilyTree();
    }
    else
    {
        render();
    }
}

function commitAddPersonPossibleMatchAction(options = {})
{
    const selectedPerson = getPerson(addPersonPossibleMatchState.selectedPersonId);

    if (!selectedPerson)
    {
        showToast('Select a possible match first.');
        return;
    }

    const connectionIntent = addPersonCreateConnectionIntent(options);

    if (!connectionIntent.shouldConnect)
    {
        openAddPersonPossibleMatch(selectedPerson.id);
        return;
    }

    const relationshipValues = collectAddPersonRelationshipBlock();

    if (relationshipValues.invalid)
    {
        showToast(relationshipValues.message || 'Check the relationship details before connecting.');
        return;
    }

    const chosenFamily = addPersonParentFamilySelection(options);
    const familySelection = connectionIntent.relationshipType === 'sibling'
        ? defaultParentFamilySelection(connectionIntent.anchorPersonId, 'sibling',
            chosenFamily, selectedPerson.id)
        : chosenFamily;
    const result = connectPeopleByRelationship({
        anchorPersonId: connectionIntent.anchorPersonId,
        relativePersonId: selectedPerson.id,
        relationshipType: connectionIntent.relationshipType,
        parentFamilySelection: familySelection,
        detailType: modalBackdrop?.querySelector('#addPersonConnectionDetailType')?.value
            || addPersonConnectionDetailType(options),
        partnerChildrenMode:
          addPersonPartnerChildrenMode(options)
    });

    if (!result.ok)
    {
        showToast(result.message || 'Could not connect the selected match.');
        return;
    }

    applyPartnerDetailsToCreatedConnection(result, relationshipValues);

    rebuildSampleEventsAndPruneSourceLinks();
    if (options.managerReturn) options.managerReturn.relatedPersonId = selectedPerson.id;
    refreshAfterPossibleMatchConnection(connectionIntent.anchorPersonId);

    showToast(connectedRelativeToast(connectPersonName(selectedPerson), connectionIntent.relationshipType));
}

function readAddPersonModalValue(selector)
{
    const control =
        modalBackdrop.querySelector(selector);

    if (!control)
    {
        return '';
    }

    return collectLocalizedDataFieldValue(
        control,
        control.dataset.sourceValue
          ?? control.value
    ).trim();
}

function updateAddPersonFactSummary()
{
    const section =
        modalBackdrop?.querySelector(
            '[data-add-person-facts]'
        );

    if (!section) return;

    const count = section.querySelectorAll('[data-add-person-fact-card]:not([data-repeat-list]), [data-repeat-entry]').length;

    const countLabel =
        section.querySelector(
            '[data-add-person-facts-count]'
        );

    if (countLabel)
    {
        countLabel.textContent =
            formatAddPersonFactSummary(count);
    }
}

function collectAddPersonActiveFactIds()
{
    const section = modalBackdrop?.querySelector('[data-add-person-facts]');
    if (!section) return [];
    return Array.from(section.querySelectorAll('[data-add-person-fact-card]'))
        .map(card => card.dataset.addPersonFactCard)
        .filter(Boolean);
}

function addPersonFactToModal(factId, personId = '')
{
    const section = modalBackdrop?.querySelector('[data-add-person-facts]');
    const target = section?.querySelector('[data-add-person-facts-added]');
    if (REPEATABLE_PERSON_FACTS[factId] && section && target)
    {
        let list = target.querySelector(`[data-repeat-list="${REPEATABLE_PERSON_FACTS[factId]}"]`);
        if (!list)
        {
            target.insertAdjacentHTML('beforeend', renderRepeatableFactList(null, REPEATABLE_PERSON_FACTS[factId]));
            list = target.lastElementChild;
        }
        const body = section.querySelector('[data-add-person-facts-body]');
        if (body) body.hidden = false;
        section.querySelector('[data-add-person-facts-toggle]')?.setAttribute('aria-expanded', 'true');
        appendRepeatableFact(list); updateAddPersonFactSummary(); return;
    }
    if (!section || !target || target.querySelector(`[data-add-person-fact-card="${CSS.escape(factId)}"]`)) return;
    const person = personId ? getPerson(personId) : null;
    target.insertAdjacentHTML('beforeend', addPersonFactCardHtml(factId, person));
    const button = section.querySelector(`[data-add-person-add-fact="${CSS.escape(factId)}"]`);
    if (button)
    {
        button.disabled = true;
        button.classList.add('is-added');
    }
    const body = section.querySelector('[data-add-person-facts-body]');
    const toggle = section.querySelector('[data-add-person-facts-toggle]');
    if (body) body.hidden = false;
    if (toggle) toggle.setAttribute('aria-expanded', 'true');
    const insertedFact = target.lastElementChild || target;
    bindGenealogyDateFields(insertedFact);
    bindPlaceComboboxes(insertedFact);
    bindNameAffixComboboxes(insertedFact);

    updateAddPersonFactSummary();
}

function removeAddPersonFactCard(section, factId)
{
    section.querySelector(`[data-add-person-fact-card="${CSS.escape(factId)}"]`)?.remove();
    const button = section.querySelector(`[data-add-person-add-fact="${CSS.escape(factId)}"]`);
    if (button)
    {
        button.disabled = false;
        button.classList.remove('is-added');
    }
    updateAddPersonFactSummary();
}

function confirmRemoveAddPersonFact(
    factId,
    onConfirm
)
{
    const definition =
        addPersonFactDefinition(factId);

    document
        .querySelector(
            '[data-add-person-fact-confirm]'
        )
        ?.remove();

    const backdrop =
        document.createElement('div');

    backdrop.className =
        'add-person-fact-confirm-backdrop';

    backdrop.dataset.addPersonFactConfirm =
        'true';

    backdrop.innerHTML = `
        <div class="add-person-fact-confirm-card" role="dialog" aria-modal="true" aria-labelledby="removeFactTitle">
          <div class="add-person-fact-confirm-header">
            <h3 id="removeFactTitle">Remove ${escapeHtml(definition.label)}?</h3>
            <button class="close-button" type="button" data-cancel-remove-fact aria-label="Cancel removing fact">${icon.close}</button>
          </div>

          <div class="add-person-fact-confirm-body">
            Removing this fact will clear the saved ${escapeHtml(definition.label.toLowerCase())} data when you save the person.
          </div>

          <div class="add-person-fact-confirm-actions">
            <button class="button secondary" type="button" data-cancel-remove-fact>Cancel</button>
            <button class="button primary" type="button" data-confirm-remove-fact>Remove fact</button>
          </div>
        </div>
      `;

    let backdropDismissBinding = null;

    function handleKeydown(event)
    {
        if (event.key === 'Escape')
        {
            close();
        }
    }

    function close()
    {
        backdropDismissBinding?.destroy();
        backdropDismissBinding = null;

        document.removeEventListener(
            'keydown',
            handleKeydown
        );

        backdrop.remove();
    }

    backdrop.addEventListener(
        'click',
        event =>
        {
            if (
                event.target.closest(
                    '[data-cancel-remove-fact]'
                )
            )
            {
                close();
                return;
            }

            if (
                event.target.closest(
                    '[data-confirm-remove-fact]'
                )
            )
            {
                close();
                onConfirm?.();
            }
        }
    );

    document.addEventListener(
        'keydown',
        handleKeydown
    );

    document.body.appendChild(backdrop);

    backdropDismissBinding =
        bindIntentionalBackdropDismiss(
            backdrop,
            close
        );

    backdrop
        .querySelector(
            '[data-cancel-remove-fact]'
        )
        ?.focus({
            preventScroll: true
        });
}

function bindAddPersonAdditionalFacts(personId = '')
{
    const section = modalBackdrop?.querySelector('[data-add-person-facts]');
    if (!section) return;
    const toggle = section.querySelector('[data-add-person-facts-toggle]');
    const body = section.querySelector('[data-add-person-facts-body]');
    toggle?.addEventListener('click', () =>
    {
        const expanded = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        if (body) body.hidden = expanded;
    });
    section.querySelectorAll('[data-add-person-add-fact]').forEach(button => button.addEventListener('click', () =>
    {
        addPersonFactToModal(button.dataset.addPersonAddFact, personId);
    }));
    section.addEventListener('click', event =>
    {
        const remove = event.target.closest('[data-add-person-remove-fact]');
        if (!remove) return;
        const factId = remove.dataset.addPersonRemoveFact;
        confirmRemoveAddPersonFact(factId, () => removeAddPersonFactCard(section, factId));
    });
    updateAddPersonFactSummary();
}

function collectCustomFactFields(
    idPrefix,
    root = modalBackdrop
)
{
    const select = suffix =>
        root?.querySelector(
            `#${CSS.escape(`${idPrefix}${suffix}`)}`
        );

    const typeInput = select('Type');
    const valueInput = select('Value');
    const notesInput = select('Notes');

    const typeField =
        typeInput?.closest(
            '[data-custom-fact-field="type"]'
        );

    const contentField =
        valueInput?.closest(
            '[data-custom-fact-field="content"]'
        );

    const typeError =
        select('TypeError');

    const contentError =
        select('ContentError');

    typeField?.classList.remove('has-error');
    contentField?.classList.remove('has-error');

    typeInput?.removeAttribute('aria-invalid');
    valueInput?.removeAttribute('aria-invalid');

    if (typeError)
    {
        typeError.textContent = '';
    }

    if (contentError)
    {
        contentError.textContent = '';
    }

    const type =
        String(typeInput?.value || '').trim();

    const value =
        String(valueInput?.value || '').trim();

    const notes =
        String(notesInput?.value || '').trim();

    const place = readPlaceInputValue(
        `#${idPrefix}Place`,
        root
    );

    const date = collectGenealogyDateField(
        `${idPrefix}Date`
    );

    if (!type)
    {
        typeField?.classList.add('has-error');

        typeInput?.setAttribute(
            'aria-invalid',
            'true'
        );

        if (typeError)
        {
            typeError.textContent =
                'Enter a short name for this fact.';
        }

        typeInput?.focus({
            preventScroll: true
        });

        return {
            invalid: true,
            message:
            'Enter a name for the custom fact.'
        };
    }

    if (!date)
    {
        root
            ?.querySelector(
                `[data-genealogy-date-field="${CSS.escape(
                    `${idPrefix}Date`
                )}"] [data-genealogy-date-input]`
            )
            ?.focus({
                preventScroll: true
            });

        return {
            invalid: true,
            message:
            'Check the custom fact date before saving.'
        };
    }

    const hasContent = Boolean(
        value
          || notes
          || place.text
          || place.selectedPlaceId
          || hasGenealogyDateValue(
              date,
              'Exact date'
          )
    );

    if (!hasContent)
    {
        contentField?.classList.add('has-error');

        valueInput?.setAttribute(
            'aria-invalid',
            'true'
        );

        if (contentError)
        {
            contentError.textContent =
                'Add a value, date, place, or note.';
        }

        valueInput?.focus({
            preventScroll: true
        });

        return {
            invalid: true,
            message:
            'Add some information to the custom fact.'
        };
    }

    return {
        invalid: false,

        value: {
            type,
            value,
            date,
            place,
            notes
        }
    };
}

function collectAddPersonAdditionalFacts(personId = '')
{
    const section = modalBackdrop?.querySelector('[data-add-person-facts]');
    const facts = { activeFactIds: collectAddPersonActiveFactIds(), targetEventId: modalBackdrop.querySelector('.add-person-modal')?.dataset.targetEventId || '' };
    if (!section) return facts;
    facts.repeatable = collectRepeatableFacts(section);
    facts.repeatable.tags = ['EDUC', 'OCCU', 'FACT'];
    if (facts.repeatable.invalid) return facts.repeatable;
    const hasFact = factId => Boolean(section.querySelector(`[data-add-person-fact-card="${CSS.escape(factId)}"]`));
    if (hasFact('prefix')) facts.prefix = readAddPersonModalValue('#addPersonFactPrefix');
    if (hasFact('suffix')) facts.suffix = readAddPersonModalValue('#addPersonFactSuffix');
    if (hasFact('causeOfDeath')) facts.deathReason = readAddPersonModalValue('#addPersonFactCauseOfDeath');
    if (hasFact('burialPlace'))
    {
        facts.burialDate = collectGenealogyDateField('addPersonBurial');
        if (!facts.burialDate) return { invalid: true, message: 'Check the burial date before saving.' };
        facts.burialPlace = readPlaceInputValue('#addPersonFactBurialPlace', modalBackdrop);
    }
    if (hasFact('alternativeNames')) facts.alternativeNames = readAddPersonModalValue('#addPersonFactAlternativeNames');
    if (hasFact('religion'))
    {
        facts.religion = readReligionField(
            modalBackdrop,
            'addPersonFactReligion'
        );
    }
    if (hasFact('baptism'))
    {
        const baptismDate = collectGenealogyDateField('addPersonFactBaptism');
        if (!baptismDate) return { invalid: true, message: 'Check the baptism date before saving.' };
        facts.baptism = {
            place: readPlaceInputValue('#addPersonFactBaptismPlace', modalBackdrop),
            date: baptismDate
        };
    }
    return facts;
}


function applyAddPersonAdditionalFacts(person, facts = {})
{
    ensurePersonCentralStructures(person);
    const active = new Set(facts.activeFactIds || []);
    const targetEvent = person.events.find(event => event.id === facts.targetEventId);
    const writeEvent = (tag, values) => targetEvent && (targetEvent.tag || targetEvent.gedcomTag) === tag
        ? Object.assign(targetEvent, values) : upsertPersonEvent(person, tag, values);

    person.names.prefix = active.has('prefix') ? (normalizeNameSegment(facts.prefix)) : '';
    person.names.suffix = active.has('suffix') ? (normalizeNameSegment(facts.suffix)) : '';
    rebuildPersonDisplayName(person);


    if (person.livingStatus === 'Deceased' && active.has('causeOfDeath'))
    {
        person.death.reason = valueOrNull(facts.deathReason) || '';
        person.death.cause = person.death.reason;
    }
    else if (person.livingStatus === 'Deceased')
    {
        person.death.reason = '';
        person.death.cause = '';
    }

    if (person.livingStatus === 'Deceased' && active.has('burialPlace'))
    {
        const burialPlace = resolvePlaceAssignment(facts.burialPlace, person.death?.burialPlaceId);
        person.death.burialPlaceText = burialPlace.placeText;
        person.death.burialPlaceId = burialPlace.placeId;
        person.death.burialAddress = burialPlace.address;
        writeEvent('BURI', { date: genealogyDateOrNull(facts.burialDate), placeId: burialPlace.placeId, placeText: burialPlace.placeText, address: burialPlace.address });
    }
    else if (person.livingStatus === 'Deceased')
    {
        person.death.burialPlaceText = '';
        person.death.burialPlaceId = null;
        person.death.burialAddress = '';
    }

    person.profile.alternativeNames = active.has('alternativeNames') ? valueOrNull(facts.alternativeNames) : null;

    applyRepeatableFacts(person, facts.repeatable);

    if (active.has('religion'))
    {
        upsertPersonAttribute(
            person,
            'RELI',
            {
                value: normalizeReligionValue(
                    facts.religion
                )
            }
        );
    }
    else
    {
        removePersonAttribute(person, 'RELI');
    }

    if (active.has('baptism') && facts.baptism)
    {
        const existingBaptism = targetEvent && (targetEvent.tag || targetEvent.gedcomTag) === 'BAPM' ? targetEvent : personEventByTag(person, 'BAPM');
        const baptismPlace = resolvePlaceAssignment(facts.baptism.place, existingBaptism?.placeId);

        writeEvent('BAPM', {
            date: genealogyDateOrNull(facts.baptism.date, 'Exact date'),
            placeText: baptismPlace.placeText,
            placeId: baptismPlace.placeId,
            address: baptismPlace.address
        });
    }
    else
    {
        if (targetEvent && (targetEvent.tag || targetEvent.gedcomTag) === 'BAPM') person.events = person.events.filter(event => event.id !== targetEvent.id);
        else removePersonEvent(person, 'BAPM');
    }
}
function updatePersonInitials(person)
{
    const first = person.names.first || '';
    const last = person.names.last || '';
    person.names.initials = `${first[0] || ''}${last[0] || ''}`.toUpperCase() || person.names.initials || '??';
}

function saveEditPersonModalValues(personId)
{
    const person = getPerson(personId);

    if (!person)
    {
        closeModal();
        showToast('Person record was not found.');
        return;
    }

    const genderValue = readAddPersonModalValue('#addPersonGender');
    const livingStatus = readAddPersonModalValue('#addPersonLivingStatus');
    const additionalFacts = collectAddPersonAdditionalFacts(personId);
    if (additionalFacts.invalid)
    {
        showToast(additionalFacts.message || 'Check the additional facts before saving.');
        return;
    }

    const relationshipValues = collectAddPersonRelationshipBlock();
    if (relationshipValues.invalid)
    {
        showToast(relationshipValues.message || 'Check the relationship details before saving.');
        return;
    }

    const birthDate = collectGenealogyDateField('addPersonBirth');
    if (!birthDate)
    {
        showToast('Check the birth date before saving.');
        return;
    }
    const deathDate = livingStatus === 'Deceased' ? collectGenealogyDateField('addPersonDeath') : null;
    if (livingStatus === 'Deceased' && !deathDate) return showToast('Check the death date before saving.');

    const birthPlace = resolvePlaceInputSelector('#addPersonBirthPlace');
    const deathPlace = resolvePlaceInputSelector('#addPersonDeathPlace');

    person.names.first = readAddPersonModalValue('#addPersonFirstName');
    person.names.last = readAddPersonModalValue('#addPersonLastName');
    person.names.middle = readAddPersonModalValue('#addPersonMiddleName');
    person.names.maiden = readAddPersonModalValue('#addPersonMaidenName');

    if ([person.names.first, person.names.middle, person.names.last].some(Boolean)
        && person.meta?.placeholderRole === 'father')
        delete person.meta.placeholderRole;

    rebuildPersonDisplayName(person);


    person.gender = genderValue === 'Male'
        ? 'male'
        : genderValue === 'Female'
            ? 'female'
            : 'unknown';

    person.livingStatus = normalizeLivingStatus(livingStatus);

    person.birth = {
        ...birthDate,
        placeId: birthPlace.placeId,
        placeText: birthPlace.placeText,
        address: birthPlace.address
    };

    if (person.livingStatus === 'Deceased')
    {
        person.death = {
            ...deathDate,
            placeId: deathPlace.placeId,
            placeText: deathPlace.placeText,
            address: deathPlace.address,
            reason: person.death?.reason || '',
            cause: person.death?.cause || person.death?.reason || '',
            burialPlaceId: cleanDatePlaceId(person.death?.burialPlaceId),
            burialPlaceText: person.death?.burialPlaceText || ''
        };
    }
    else
    {
        person.death = normalizeGenealogyDateInput(person.death);
    }

    applyAddPersonAdditionalFacts(person, additionalFacts);
    savePersonRelationshipBlock(personId, relationshipValues);
    applyAddPersonAttachmentDrafts(
        personId
    );
    syncFamilyReciprocalLinks();

    markPersonUpdated(person);
    rebuildSampleEventsAndPruneSourceLinks();

    closeModal({ force: true });
    if (state.activeModule === 'Family Tree')
    {
        renderFamilyTreePreserveScroll?.() || renderFamilyTree();
    }
    else
    {
        render();
    }
    showToast('Person updated.');
}

function openEditPersonModal(personId)
{
    const person = getPerson(personId);

    if (!person)
    {
        showToast('Person record was not found.');
        return;
    }

    openAddPersonModal('Edit person', person.names.display, {
        mode: 'edit',
        personId
    });
}

function setAddPersonFamilyExpanded(expanded)
{
    const section = modalBackdrop?.querySelector('[data-add-person-family-connection]');
    const toggle = section?.querySelector('[data-add-person-family-toggle]');
    const body = section?.querySelector('[data-add-person-family-body]');
    if (!toggle || !body) return;
    toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    body.hidden = !expanded;
}

function showAddPersonFamilyError(selector, message)
{
    const control = modalBackdrop?.querySelector(selector);
    if (!control) return;
    setAddPersonFamilyExpanded(true);
    const error = control.closest('.field')?.querySelector('.add-person-family-error');
    if (error)
    {
        error.textContent = message;
        error.hidden = false;
        control.setAttribute('aria-invalid', 'true');
    }
    control.focus({ preventScroll: true });
    control.scrollIntoView({ block: 'nearest' });
}

function bindAddPersonFamilyConnection()
{
    const section = modalBackdrop?.querySelector('[data-add-person-family-connection]');
    if (!section) return;
    section.querySelector('[data-add-person-family-toggle]')?.addEventListener('click', event =>
    {
        setAddPersonFamilyExpanded(event.currentTarget.getAttribute('aria-expanded') !== 'true');
    });
    section.querySelectorAll('select').forEach(control => control.addEventListener('change', () =>
    {
        const error = control.closest('.field')?.querySelector('.add-person-family-error');
        if (error) error.hidden = true;
        control.removeAttribute('aria-invalid');
    }));
}

function bindAddPersonModalControls(personId = '')
{
    bindGenealogyDateFields(modalBackdrop);
    bindPlaceComboboxes(modalBackdrop);
    bindNameAffixComboboxes(modalBackdrop);

    bindAddPersonAdditionalFacts(personId);
    bindAddPersonFamilyConnection();
    bindAddPersonRelationshipBlock();
    const gender = modalBackdrop.querySelector('#addPersonGender');
    const statusButton = modalBackdrop.querySelector('#addPersonStatusButton');
    const statusMenu = modalBackdrop.querySelector('#addPersonStatusMenu');
    gender?.addEventListener('change', updateAddPersonConditionalFields);
    statusButton?.addEventListener('click', event =>
    {
        event.stopPropagation();
        const open = statusMenu?.hidden;
        if (statusMenu) statusMenu.hidden = !open;
        statusButton.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    statusMenu?.querySelectorAll('[data-status-value]').forEach(button => button.addEventListener('click', () =>
    {
        const status = button.dataset.statusValue;
        modalBackdrop.querySelector('#addPersonLivingStatus').value = status;
        modalBackdrop.querySelector('#addPersonStatusLabel').textContent = status;
        const dot = modalBackdrop.querySelector('.add-person-status-current .add-person-status-dot');
        if (dot) dot.className = `add-person-status-dot ${statusDotClass(status)}`;
        statusMenu.hidden = true;
        statusButton.setAttribute('aria-expanded', 'false');
        statusMenu.querySelectorAll('[data-status-value]').forEach(item =>
        {
            item.classList.toggle('active', item.dataset.statusValue === status);
            item.setAttribute('aria-selected', item.dataset.statusValue === status ? 'true' : 'false');
            const check = item.querySelector('[data-status-check]');
            if (check) check.innerHTML = item.dataset.statusValue === status ? icon.check : '';
        });
        const deathModel = modalBackdrop.querySelector('[data-genealogy-date-field="addPersonDeath"] [data-genealogy-date-model]');
        if (deathModel)
        {
            const currentDeath = normalizeGenealogyDateInput(JSON.parse(deathModel.value || '{}'));
            if (status === 'Deceased' && !currentDeath.date && !currentDeath.dateLabel)
            {
                applyGenealogyDateToField('addPersonDeath', emptyGenealogyDate('Exact date'));
            }

            if (status !== 'Deceased')
            {
                applyGenealogyDateToField('addPersonDeath', emptyGenealogyDate('Exact date'));
            }
        }
        updateAddPersonConditionalFields();
    }));
    modalBackdrop.querySelectorAll('[data-possible-match]').forEach(button => button.addEventListener('click', () => showToast(`Possible match selected: ${button.dataset.possibleMatch}. Connect/merge flow will be added later.`)));
}

function updateAddPersonConditionalFields()
{
    const gender = modalBackdrop.querySelector('#addPersonGender')?.value || 'Unknown';
    const status = modalBackdrop.querySelector('#addPersonLivingStatus')?.value || 'Living';
    const maiden = modalBackdrop.querySelector('#maidenNameField');
    const death = modalBackdrop.querySelector('#deathFieldsGroup');
    if (maiden) maiden.hidden = gender !== 'Female';
    if (death) death.hidden = status !== 'Deceased';
}

function defaultPeopleProfileDetails()
{
    return {
        prefix: '',
        suffix: '',
        maidenName: '',
        alternativeNames: '',
        birthDateType: 'Exact date',
        deathDateType: 'Exact date',
        deathReason: '',
        burialPlace: '',
        educationInstitutionName: '',
        educationInstitutionType: '',
        educationValue: '',
        educationPlace: '',
        educationNotes: '',
        educationFromDate: emptyGenealogyDate('Exact date'),
        educationToDate: emptyGenealogyDate('Exact date'),
        workCompany: '',
        workOccupation: '',
        workNotes: '',
        workFromDate: emptyGenealogyDate('Exact date'),
        workToDate: emptyGenealogyDate('Exact date'),
        religion: '',
        baptismPlace: '',
        baptismDate: emptyGenealogyDate('Exact date')
    };
}

function valueOrNull(value)
{
    const text = String(value ?? '').trim();
    return text ? text : null;
}

function genealogyDateOrNull(value, fallbackType = 'Exact date')
{
    if (!value) return null;
    const date = normalizeGenealogyDateInput(value, fallbackType);
    return formatGenealogyDateLabel(date) ? date : null;
}

function dateForForm(value, fallbackType = 'Exact date')
{
    return normalizeGenealogyDateInput(value || emptyGenealogyDate(fallbackType), fallbackType);
}

function ensurePersonCentralStructures(person)
{
    if (!person) return null;
    person.profile = person.profile && typeof person.profile === 'object' ? person.profile : {};
    person.attributes = Array.isArray(person.attributes) ? person.attributes : [];
    person.attributes.forEach(attribute => { if (!attribute.id) attribute.id = createRuntimeId('person-fact'); });
    person.events = Array.isArray(person.events) ? person.events : [];
    person.notes = Array.isArray(person.notes) ? person.notes : [];
    person.citations = Array.isArray(person.citations) ? person.citations : [];
    person.names = person.names || {};
    person.birth = person.birth || emptyGenealogyDate('Exact date');
    person.death = person.death || { ...emptyGenealogyDate('Exact date'), placeId: null, reason: '', cause: '', burialPlaceId: null };
    if (typeof person.birth.placeText === 'undefined') person.birth.placeText = '';
    if (typeof person.birth.address === 'undefined') person.birth.address = '';
    if (typeof person.death.placeText === 'undefined') person.death.placeText = '';
    if (typeof person.death.address === 'undefined') person.death.address = '';
    if (typeof person.death.burialPlaceText === 'undefined') person.death.burialPlaceText = '';
    if (typeof person.death.burialAddress === 'undefined') person.death.burialAddress = '';
    if (typeof person.death.cause === 'undefined') person.death.cause = person.death.reason || '';
    if (typeof person.death.reason === 'undefined') person.death.reason = person.death.cause || '';
    return person;
}

function personAttributeByTag(person, tag)
{
    ensurePersonCentralStructures(person);
    return person?.attributes?.find(attribute => attribute.tag === tag) || null;
}

function upsertPersonAttribute(person, tag, values = {})
{
    ensurePersonCentralStructures(person);
    let attribute = person.attributes.find(item => item.tag === tag);
    if (!attribute)
    {
        attribute = {
            id: `${tag.toLowerCase()}-${person.id}`,
            tag,
            value: '',
            type: '',
            institutionName: '',
            institutionType: '',
            date: null,
            fromDate: null,
            toDate: null,
            placeId: null,
            placeText: '',
            notes: '',
            citations: [],
            mediaIds: []
        };
        person.attributes.push(attribute);
    }
    Object.assign(attribute, values);
    return attribute;
}

function removePersonAttribute(person, tag)
{
    ensurePersonCentralStructures(person);
    person.attributes = person.attributes.filter(attribute => attribute.tag !== tag);
}

function personEventByTag(person, tag)
{
    ensurePersonCentralStructures(person);
    return person?.events?.find(event => event.tag === tag || event.gedcomTag === tag) || null;
}

function upsertPersonEvent(person, tag, values = {})
{
    ensurePersonCentralStructures(person);
    let event = person.events.find(item => item.tag === tag || item.gedcomTag === tag);
    if (!event)
    {
        event = {
            id: `${tag.toLowerCase()}-${person.id}`,
            tag,
            gedcomTag: tag,
            type: tag,
            date: null,
            placeId: null,
            placeText: '',
            notes: '',
            citations: [],
            mediaIds: []
        };
        person.events.push(event);
    }
    Object.assign(event, values, { tag, gedcomTag: tag });
    return event;
}

function removePersonEvent(person, tag)
{
    ensurePersonCentralStructures(person);
    person.events = person.events.filter(event => event.tag !== tag && event.gedcomTag !== tag);
}

function hasTextValue(value)
{
    return value !== null && value !== undefined && String(value).trim() !== '';
}

function hasGenealogyDateValue(value, fallbackType = 'Exact date')
{
    return Boolean(value && formatGenealogyDateLabel(normalizeGenealogyDateInput(value, fallbackType)));
}

function personHasEducationFact(person)
{
    const fact = personAttributeByTag(person, 'EDUC');

    return Boolean(fact && (
        hasTextValue(educationInstitutionLabel(fact))
        || hasTextValue(educationInstitutionTypeLabel(fact))
        || hasTextValue(educationValueLabel(fact))
        || hasTextValue(fact.placeText)
        || hasTextValue(fact.placeId)
        || hasTextValue(fact.notes)
        || hasGenealogyDateValue(fact.fromDate, 'Exact date')
        || hasGenealogyDateValue(fact.toDate, 'Exact date')
    ));
}

function personHasOccupationFact(person)
{
    const fact = personAttributeByTag(person, 'OCCU');
    return Boolean(fact && (hasTextValue(fact.company) || hasTextValue(fact.value) || hasTextValue(fact.notes) || hasGenealogyDateValue(fact.fromDate, 'Exact date') || hasGenealogyDateValue(fact.toDate, 'Exact date')));
}

function personHasReligionFact(person)
{
    const fact = personAttributeByTag(person, 'RELI');
    return Boolean(fact && hasTextValue(fact.value));
}

function personHasBaptismFact(person)
{
    const event = personEventByTag(person, 'BAPM');
    return Boolean(event && (hasTextValue(event.placeText) || hasTextValue(event.placeId) || hasGenealogyDateValue(event.date, 'Exact date')));
}

function peopleProfileDetailsFor(person)
{
    const centralPerson = ensurePersonCentralStructures(getPerson(person?.id) || person);
    if (!centralPerson) return defaultPeopleProfileDetails();

    return new Proxy({}, {
        get(_target, prop)
        {
            const education = personAttributeByTag(centralPerson, 'EDUC');
            const work = personAttributeByTag(centralPerson, 'OCCU');
            const religion = personAttributeByTag(centralPerson, 'RELI');
            const baptism = personEventByTag(centralPerson, 'BAPM');
            if (prop === 'prefix') return centralPerson.names.prefix || '';
            if (prop === 'suffix') return centralPerson.names.suffix || '';
            if (prop === 'maidenName') return centralPerson.names.maiden || '';
            if (prop === 'alternativeNames') return centralPerson.profile.alternativeNames || '';
            if (prop === 'birthDateType') return centralPerson.birth?.dateType || 'Exact date';
            if (prop === 'deathDateType') return centralPerson.death?.dateType || 'Exact date';
            if (prop === 'deathReason') return centralPerson.death?.cause || centralPerson.death?.reason || '';
            if (prop === 'burialPlace') return editPlaceValue(centralPerson.death?.burialPlaceId, centralPerson.death?.burialPlaceText);
            if (prop === 'educationInstitutionName') return educationInstitutionLabel(education);
            if (prop === 'educationInstitutionType') return educationInstitutionTypeLabel(education) || 'Unknown';
            if (prop === 'educationValue') return educationValueLabel(education);
            if (prop === 'educationPlace') return editPlaceValue(education?.placeId, education?.placeText);
            if (prop === 'educationNotes') return education?.notes || '';
            if (prop === 'educationFromDate') return dateForForm(education?.fromDate, 'Exact date');
            if (prop === 'educationToDate') return dateForForm(education?.toDate, 'Exact date');
            if (prop === 'workCompany') return work?.company || work?.agency || '';
            if (prop === 'workOccupation') return work?.value || '';
            if (prop === 'workNotes') return work?.notes || '';
            if (prop === 'workFromDate') return dateForForm(work?.fromDate, 'Exact date');
            if (prop === 'workToDate') return dateForForm(work?.toDate, 'Exact date');
            if (prop === 'religion') return religion?.value || '';
            if (prop === 'baptismPlace') return editPlaceValue(baptism?.placeId, baptism?.placeText);
            if (prop === 'baptismDate') return dateForForm(baptism?.date, 'Exact date');
            return undefined;
        },
        set(_target, prop, value)
        {
            if (prop === 'prefix')
            {
                centralPerson.names.prefix = normalizeNameSegment(value); rebuildPersonDisplayName(centralPerson); return true;
            }
            if (prop === 'suffix')
            {
                centralPerson.names.suffix = normalizeNameSegment(value); rebuildPersonDisplayName(centralPerson); return true;
            }

            if (prop === 'maidenName')
            {
                centralPerson.names.maiden = valueOrNull(value) || ''; return true;
            }
            if (prop === 'alternativeNames')
            {
                centralPerson.profile.alternativeNames = valueOrNull(value); return true;
            }
            if (prop === 'birthDateType')
            {
                centralPerson.birth.dateType = value || centralPerson.birth.dateType || 'Exact date'; return true;
            }
            if (prop === 'deathDateType')
            {
                centralPerson.death.dateType = value || centralPerson.death.dateType || 'Exact date'; return true;
            }
            if (prop === 'deathReason')
            {
                centralPerson.death.reason = valueOrNull(value) || ''; centralPerson.death.cause = centralPerson.death.reason; return true;
            }
            if (prop === 'burialPlace')
            {
                const resolved = resolvePlaceAssignment(value, centralPerson.death?.burialPlaceId);
                centralPerson.death.burialPlaceText = resolved.placeText;
                centralPerson.death.burialPlaceId = resolved.placeId;
                centralPerson.death.burialAddress = resolved.address;
                return true;
            }
            if (prop === 'religion')
            {
                upsertPersonAttribute(
                    centralPerson,
                    'RELI',
                    {
                        value: normalizeReligionValue(value)
                    }
                );

                return true;
            }
            if (prop === 'baptismPlace')
            {
                const event = upsertPersonEvent(centralPerson, 'BAPM');
                const resolved = resolvePlaceAssignment(value, event.placeId);
                event.placeText = resolved.placeText;
                event.placeId = resolved.placeId;
                event.address = resolved.address;
                return true;
            }
            if (prop === 'baptismDate')
            {
                upsertPersonEvent(centralPerson, 'BAPM', { date: genealogyDateOrNull(value, 'Exact date') }); return true;
            }
            return true;
        }
    });
}

function profileDetailDateLabel(input, fallback = '-')
{
    return formatGenealogyDateLabel(input) || fallback;
}

