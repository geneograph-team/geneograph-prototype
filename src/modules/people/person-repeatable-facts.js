const REPEATABLE_PERSON_FACTS = Object.freeze({ education: 'EDUC', occupation: 'OCCU', customFact: 'FACT' });

function profileSectionDraftSnapshot(panel)
{
    return JSON.stringify([...panel.querySelectorAll('input,select,textarea')].map(field =>
        [field.id, field.value, field.checked, field.dataset.placeId || '']));
}

function repeatableFactKind(tag)
{
    return Object.keys(REPEATABLE_PERSON_FACTS).find(kind => REPEATABLE_PERSON_FACTS[kind] === tag);
}

function repeatableFactLabel(tag)
{
    return tag === 'EDUC' ? 'Education' : tag === 'OCCU' ? 'Occupation' : 'Custom fact';
}

function renderRepeatableFactEntry(tag, record = null, scope = 'person')
{
    const prefix = createRuntimeId('fact-field');
    const value = record ? { ...record,
        institutionName: record.institutionName ?? record.agency,
        company: record.company ?? record.agency,
        institutionType: record.institutionType || record.type || 'Unknown' } : {};
    const text = (key, label, multiline = false) => `<div class="field ${multiline ? 'full' : ''}"><label for="${prefix}-${key}">${escapeHtml(t(label))}</label>${multiline
        ? `<textarea id="${prefix}-${key}" data-repeat-field="${key}" data-source-value="${escapeHtml(value[key] || '')}">${escapeHtml(localizedDataFieldValue(value[key] || ''))}</textarea>`
        : `<input id="${prefix}-${key}" data-repeat-field="${key}" data-source-value="${escapeHtml(value[key] || '')}" value="${escapeHtml(localizedDataFieldValue(value[key] || ''))}">`}</div>`;
    const date = (key, label) => renderGenealogyDateField(`${prefix}-${key}`, label, value[key] || (key === 'fromDate' ? value.date : null) || emptyGenealogyDate('Exact date'), { className: 'genealogy-date-inline-range', defaultDateType: 'Exact date' });
    const place = renderPlaceCombobox({ id: `${prefix}-place`, label: 'Place', value: editPlaceValue(value.placeId, value.placeText), selectedPlaceId: value.placeId || '', addressValue: value.address || '', placeholder: 'Search or type a place', className: 'full' });
    const dates = `<div class="add-person-fact-date-row repeatable-fact-dates full"><div class="profile-edit-date-cell">${date('fromDate', 'Start date')}</div><div class="profile-edit-date-cell">${date('toDate', 'End date')}</div></div>`;
    const fields = tag === 'FACT' ? renderCustomFactFields(prefix, value)
        : `${tag === 'EDUC' ? `${text('institutionName', 'Institution name')}<div class="field"><label for="${prefix}-institutionType">${escapeHtml(t('Institution type'))}</label><div class="common-select-shell"><select class="compact-select common-select" id="${prefix}-institutionType" data-repeat-field="institutionType">${educationInstitutionTypeOptions(value.institutionType || 'Unknown')}</select><span class="common-select-chevron" aria-hidden="true">${icon.chevron}</span></div></div>${text('value', 'Education or credential')}` : `${text('company', 'Company name')}${text('value', 'Occupation')}`}
          ${tag === 'EDUC' ? dates + place : place + dates}${text('notes', 'Notes', true)}`;
    return `<section class="repeatable-fact-entry${scope === 'person' ? ' add-person-fact-card' : ''}" data-repeat-entry data-repeat-id="${escapeHtml(record?.id || '')}" data-repeat-prefix="${prefix}" data-repeat-tag="${tag}"><div class="repeatable-fact-entry-head${scope === 'person' ? ' add-person-fact-card-header' : ''}"><h4>${escapeHtml(t(repeatableFactLabel(tag)))}</h4><button type="button" class="relation-action-button" data-repeat-remove aria-label="${escapeHtml(t('Remove fact'))}" title="${escapeHtml(t('Remove fact'))}">${icon.trash}</button></div><div class="add-person-fact-grid">${fields}</div><p class="repeatable-fact-error" data-repeat-error hidden role="alert"></p></section>`;
}

function renderRepeatableFactList(person, tag, scope = 'person')
{
    const records = (getPerson(person?.id)?.attributes || person?.attributes || []).filter(record => record.tag === tag);
    const label = tag === 'EDUC' ? 'Add education' : tag === 'OCCU' ? 'Add occupation' : 'Add custom fact';
    return `<div class="repeatable-fact-list" data-repeat-list="${tag}" data-repeat-scope="${scope}" ${scope === 'person' ? `data-add-person-fact-card="${repeatableFactKind(tag)}"` : ''}><div data-repeat-entries>${records.map(record => renderRepeatableFactEntry(tag, record, scope)).join('')}</div>${scope === 'profile' ? `<button type="button" class="button secondary repeatable-fact-add" data-repeat-add="${tag}">${icon.plus}<span>${escapeHtml(t(label))}</span></button>` : ''}</div>`;
}

function appendRepeatableFact(list)
{
    const entries = list.querySelector('[data-repeat-entries]');
    entries.insertAdjacentHTML('beforeend', renderRepeatableFactEntry(list.dataset.repeatList, null, list.dataset.repeatScope));
    const entry = entries.lastElementChild;
    bindGenealogyDateFields(entry); bindPlaceComboboxes(entry); localizeUI(entry);
    entry.scrollIntoView({ block: 'nearest' });
    entry.querySelector('input,select,textarea')?.focus({ preventScroll: true });
    return entry;
}

function bindRepeatableFacts(root)
{
    if (root.dataset.repeatableBound) return;
    root.dataset.repeatableBound = 'true';
    root.addEventListener('click', event =>
    {
        const add = event.target.closest('[data-repeat-add]');
        if (add) { appendRepeatableFact(add.closest('[data-repeat-list]')); return; }
        const remove = event.target.closest('[data-repeat-remove]');
        if (remove) { remove.closest('[data-repeat-entry]').remove(); updateAddPersonFactSummary(); }
        const edit = event.target.closest('[data-person-attribute-edit]');
        if (edit) openTimelinePersonEditor({ kind: 'attribute', personId: edit.dataset.personId, recordId: edit.dataset.personAttributeEdit });
    });
}

function collectRepeatableFacts(root, tag)
{
    const rows = [];
    const lists = [...root.querySelectorAll('[data-repeat-list]')].filter(list => !tag || list.dataset.repeatList === tag);
    for (const list of lists) for (const entry of list.querySelectorAll('[data-repeat-entry]'))
    {
        const prefix = entry.dataset.repeatPrefix;
        const recordTag = entry.dataset.repeatTag;
        const read = key => {
            const input = entry.querySelector(`[data-repeat-field="${key}"]`);
            return input ? collectLocalizedDataFieldValue(input, input.dataset.sourceValue || '').trim() : '';
        };
        const customRead = suffix => entry.querySelector(`#${CSS.escape(prefix + suffix)}`)?.value.trim() || '';
        const blankDate = id => {
            const field = entry.querySelector(`[data-genealogy-date-field="${id}"]`);
            return ![...field?.querySelectorAll('[data-genealogy-date-input],[data-genealogy-date-input-to]') || []].some(input => input.value.trim());
        };
        const date = id => blankDate(id) ? null : collectGenealogyDateField(id);
        const placeId = recordTag === 'FACT' ? `${prefix}Place` : `${prefix}-place`;
        const place = readPlaceInputValue(`#${placeId}`, entry);
        const values = recordTag === 'FACT'
            ? { type: customRead('Type'), value: customRead('Value'), notes: customRead('Notes'), date: date(`${prefix}Date`), place }
            : { value: read('value'), notes: read('notes'),
                ...(recordTag === 'EDUC' ? { institutionName: read('institutionName'), institutionType: read('institutionType') || 'Unknown' } : { company: read('company') }),
                fromDate: date(`${prefix}-fromDate`), toDate: date(`${prefix}-toDate`), place };
        const textContent = [values.value, values.notes, values.company, values.institutionName, values.type, place.text, place.address].some(Boolean)
            || (values.institutionType && values.institutionType !== 'Unknown');
        const dateContent = recordTag === 'FACT' ? !blankDate(`${prefix}Date`) : !blankDate(`${prefix}-fromDate`) || !blankDate(`${prefix}-toDate`);
        if (!entry.dataset.repeatId && !textContent && !dateContent) continue;
        let error = '';
        if (recordTag === 'FACT' && !values.type) error = 'Enter a fact name.';
        if (recordTag === 'FACT' ? dateContent && !values.date
            : (!blankDate(`${prefix}-fromDate`) && !values.fromDate) || (!blankDate(`${prefix}-toDate`) && !values.toDate)) error = 'Check the fact dates before saving.';
        if (recordTag !== 'FACT' && values.fromDate && values.toDate && genealogyDateDefinitelyAfter(values.fromDate, values.toDate)) error = 'The end date is earlier than the start date.';
        if (error)
        {
            const body = entry.closest('[data-add-person-facts-body]');
            if (body) { body.hidden = false; body.parentElement.querySelector('[data-add-person-facts-toggle]')?.setAttribute('aria-expanded', 'true'); }
            const message = entry.querySelector('[data-repeat-error]'); message.hidden = false; message.textContent = t(error);
            entry.scrollIntoView({ block: 'nearest' }); entry.querySelector('[aria-invalid="true"],input,select,textarea')?.focus({ preventScroll: true });
            return { invalid: true, message: error, entry, focusSelector: `[data-repeat-prefix="${prefix}"] input` };
        }
        rows.push({ id: entry.dataset.repeatId || null, tag: recordTag, values });
    }
    return { rows, tags: lists.map(list => list.dataset.repeatList), invalid: false };
}

function applyRepeatableFacts(person, draft)
{
    if (!draft || draft.invalid) return;
    const tags = new Set(draft.tags);
    const records = person.attributes || [];
    const retained = new Set(draft.rows.map(row => row.id).filter(Boolean));
    for (const row of draft.rows)
        if (row.id && !records.some(record => record.id === row.id && record.tag === row.tag)) throw new Error('Fact record is no longer available');
    person.attributes = records.filter(record => !tags.has(record.tag) || retained.has(record.id));
    draft.rows.forEach(row =>
    {
        let record = person.attributes.find(item => item.id === row.id);
        if (!record) { record = { id: createRuntimeId('person-fact'), tag: row.tag, citations: [], mediaIds: [] }; person.attributes.push(record); }
        const { place, ...values } = row.values;
        const resolved = resolvePlaceAssignment(place, record.placeId);
        Object.assign(record, values, { placeId: resolved.placeId, placeText: resolved.placeText, address: resolved.address });
        if (row.tag !== 'FACT') record.date = null;
        if (row.tag !== 'FACT' && 'agency' in record) delete record.agency;
        if (row.tag === 'EDUC') record.type = record.institutionType === 'Unknown' ? '' : record.institutionType;
    });
}

function renderRepeatableFactReadOnly(person, tag)
{
    const records = (getPerson(person.id)?.attributes || []).filter(record => record.tag === tag);
    if (!records.length) return `<p class="panel-muted">${escapeHtml(t('No facts recorded.'))}</p>`;
    return `<div class="repeatable-fact-readonly">${records.map(record =>
    {
        const fields = tag === 'EDUC'
            ? [['Institution name', educationInstitutionLabel(record)], ['Institution type', educationInstitutionTypeLabel(record) === 'Unknown' ? '' : educationInstitutionTypeLabel(record)], ['Education or credential', educationValueLabel(record)]]
            : tag === 'OCCU' ? [['Occupation', record.value], ['Company name', record.company || record.agency]]
                : [['Fact details', record.value]];
        fields.push(['Place', editPlaceValue(record.placeId, record.placeText)], ['Address', record.address]);
        if (tag === 'FACT') fields.push(['Date or period', formatGenealogyDateLabel(record.date)]);
        else fields.push(['Start date', formatGenealogyDateLabel(record.fromDate || record.date)], ['End date', formatGenealogyDateLabel(record.toDate)]);
        fields.push(['Notes', record.notes]);
        const edit = tag === 'FACT' ? `<button class="link" type="button" data-person-attribute-edit="${escapeHtml(record.id)}" data-person-id="${escapeHtml(person.id)}">${icon.edit}${escapeHtml(t('Edit fact'))}</button>` : '';
        return `<section class="profile-info-block repeatable-fact-summary"><h4 ${tag === 'FACT' ? 'data-user-content' : ''}>${escapeHtml(tag === 'FACT' ? record.type || t('Custom fact') : t(repeatableFactLabel(tag)))}</h4>${fields.filter(([, value]) => value).map(([label, value]) => renderProfileInfoRow(label, value)).join('')}${edit}</section>`;
    }).join('')}</div>`;
}

function openTimelinePersonEditor(target)
{
    if (!target || !getPerson(target.personId)) return;
    const profile = main.querySelector('[data-profile-card-root]');
    if (state.peopleProfileEditing && profile?.profileSectionSnapshots
        && [...profile.querySelectorAll('[data-profile-card-panel]')].some(panel =>
            profile.profileSectionSnapshots[panel.dataset.profileCardPanel] !== profileSectionDraftSnapshot(panel)))
    {
        openManageRelationshipsDiscardConfirm(() =>
        {
            state.peopleProfileEditing = false; renderPeople(); openTimelinePersonEditor(target);
        }, { message: 'Unsaved profile changes will be lost.' });
        return;
    }
    const selectedPersonId = state.selectedPersonId, selectedPeopleId = state.selectedPeopleId;
    const scrollSelector = '.tree-inspector,.profile-compact-timeline-list,.profile-card-panel';
    const scrolls = [...document.querySelectorAll(scrollSelector)].map(element => ({ top: element.scrollTop, left: element.scrollLeft }));
    const mainScroll = { top: main.scrollTop, left: main.scrollLeft };
    const treeScroll = state.activeModule === 'Family Tree' ? captureTreeCanvasScroll() : null;
    openAddPersonModal('Edit person', getPerson(target.personId).names.display, { mode: 'edit', personId: target.personId, factTarget: target });
    modalBackdrop.afterClose = () =>
    {
        state.selectedPersonId = selectedPersonId; state.selectedPeopleId = selectedPeopleId;
        if (treeScroll) restoreTreeCanvasScroll(treeScroll);
        requestAnimationFrame(() =>
        {
            main.scrollTop = mainScroll.top; main.scrollLeft = mainScroll.left;
            document.querySelectorAll(scrollSelector).forEach((element, index) =>
            { const saved = scrolls[index]; if (saved) { element.scrollTop = saved.top; element.scrollLeft = saved.left; } });
            if (target.timelineEventId) document.querySelector(`[data-timeline-edit-fact="${CSS.escape(target.timelineEventId)}"]`)?.focus({ preventScroll: true });
        });
    };
}

function focusPersonFactTarget(target)
{
    if (!target) return;
    let field;
    if (target.kind === 'attribute' || target.kind === 'newAttribute')
    {
        const record = getPerson(target.personId)?.attributes?.find(record => record.id === target.recordId);
        const tag = record?.tag || target.tag;
        const section = modalBackdrop.querySelector('[data-add-person-facts]');
        section?.querySelector('[data-add-person-facts-toggle]')?.setAttribute('aria-expanded', 'true');
        const body = section?.querySelector('[data-add-person-facts-body]'); if (body) body.hidden = false;
        if (target.kind === 'newAttribute')
        {
            const kind = repeatableFactKind(tag);
            let list = section.querySelector(`[data-repeat-list="${tag}"]`);
            if (!list) { addPersonFactToModal(kind, target.personId); list = section.querySelector(`[data-repeat-list="${tag}"]`); }
            else appendRepeatableFact(list);
            field = list?.querySelector('[data-repeat-entry]:last-child input');
        }
        else field = modalBackdrop.querySelector(`[data-repeat-id="${CSS.escape(target.recordId)}"] input`);
    }
    else if (target.kind === 'relationship') field = modalBackdrop.querySelector(`[data-relationship-id="${CSS.escape(target.recordId)}"] select`);
    else if (target.kind === 'birth' || target.kind === 'death') field = modalBackdrop.querySelector(`[data-genealogy-date-field="addPerson${target.kind === 'birth' ? 'Birth' : 'Death'}"] [data-genealogy-date-input]`);
    else if (target.kind === 'event')
    {
        addPersonFactToModal(target.tag === 'BURI' ? 'burialPlace' : 'baptism', target.personId);
        const record = getPerson(target.personId).events.find(event => event.id === target.recordId);
        if (record)
        {
            modalBackdrop.querySelector('.add-person-modal').dataset.targetEventId = record.id;
            const dateId = target.tag === 'BURI' ? 'addPersonBurial' : 'addPersonFactBaptism';
            applyGenealogyDateToField(dateId, record.date || emptyGenealogyDate('Exact date'), { silent: true });
            const place = modalBackdrop.querySelector(target.tag === 'BURI' ? '#addPersonFactBurialPlace' : '#addPersonFactBaptismPlace');
            if (place)
            {
                place.dataset.placeId = record.placeId || '';
                place.dataset.sourceValue = editPlaceValue(record.placeId, record.placeText);
                place.value = localizedDataFieldValue(place.dataset.sourceValue);
                const address = place.closest('[data-place-combobox]')?.querySelector('[data-place-address]');
                if (address) { address.dataset.sourceValue = record.address || ''; address.value = localizedDataFieldValue(record.address || ''); }
            }
            field = modalBackdrop.querySelector(`[data-genealogy-date-field="${dateId}"] [data-genealogy-date-input]`);
        }
    }
    requestAnimationFrame(() => { field?.scrollIntoView({ block: 'center' }); field?.focus({ preventScroll: true }); });
}
