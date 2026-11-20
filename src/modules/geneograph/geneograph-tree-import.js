function geneoReviewAvatar(person, boardPerson = false)
{
    if (!person) return '';
    const avatar = renderPersonAvatar(boardPerson ? geneoPersonAvatarModel(person) : person, 'gr-avatar-content', { element: 'span' });
    return `<span class="gr-avatar" aria-hidden="true">${avatar}</span>`;
}

function geneoReviewIdentity(person, boardPerson = false)
{
    if (!person) return `<span class="gr-muted">${escapeHtml(t('Unavailable'))}</span>`;
    const name = boardPerson ? geneoPersonDisplayName(person) : connectPersonName(person);
    const dates = geneoPersonLifeDates(person);
    return `<div class="gr-identity">${geneoReviewAvatar(person, boardPerson)}<span><strong title="${escapeHtml(name)}">${escapeHtml(name)}</strong><small>${escapeHtml(dates || '')}</small></span></div>`;
}

function geneoReviewStatus(draft, person, plan)
{
    if (plan.errors.some(error => error.personId === person.id)) return { key: 'conflicts', label: 'Needs resolution', icon: icon.warning };
    const choice = draft.choices.get(person.id);
    const tree = getPerson(choice);
    if ((!tree || tree.deleted || tree.projectId !== draft.projectId) && choice !== 'create' && choice !== 'unlink')
        return { key: 'unlinked', label: person.treePersonId ? 'Tree record unavailable' : 'Not linked to Family Tree', icon: icon.people };
    const pendingFacts = tree && geneoTreeImportFields(person, tree).some(([key]) => !draft.fields.get(person.id)?.has(key));
    const pendingRelations = choice !== 'unlink' && plan.relations.some(relation =>
    {
        if (!relation.ids.includes(person.id) || plan.statuses.get(relation.id) === 'Same relationship') return false;
        if (geneoReviewAutomaticParentLink(draft, relation) && relation.ids.some(id => draft.choices.get(id) === 'create')) return false;
        const fields = plan.relationshipFields.get(relation.id);
        return fields ? fields.some(field => !draft.relationshipFields.get(relation.id)?.has(field.key))
            : !draft.relationChoices.has(relation.id);
    });
    if (pendingFacts || pendingRelations) return { key: 'differences', label: 'Differences to review', icon: icon.checklist };
    if (plan.operations.some(operation => operation.personId === person.id || operation.ids?.includes(person.id)))
        return { key: 'staged', label: 'Changes selected', icon: icon.checklist };
    return { key: 'linked', label: 'No changes', icon: icon.check };
}

function geneoReviewSearch(label, value, attributes)
{
    const text = escapeHtml(t(label));
    return `<label class="app-search-field">${icon.search}<input type="search" ${attributes} aria-label="${text}" placeholder="${text}" value="${escapeHtml(value)}"></label>`;
}

function geneoReviewRail(draft, plan)
{
    const branch = draft.scope === 'branch' ? geneoReviewRoles(draft.diagram, draft.anchorId) : null;
    const query = draft.search.trim().toLocaleLowerCase();
    const groups = new Map([['Selected person', []], ['Changes selected', []], ['To review', []], ['No changes', []]]);
    const statuses = { unlinked: 'Not linked', differences: 'With differences', staged: 'With selected changes' };
    for (const person of draft.people)
    {
        const selected = draft.activePersonId === person.id;
        const { key, label, icon: statusIcon } = geneoReviewStatus(draft, person, plan);
        const unresolved = ['conflicts', 'unlinked', 'differences'].includes(key);
        const staged = plan.operations.some(operation => operation.personId === person.id || operation.ids?.includes(person.id));
        const matchesStatus = draft.status === 'all' || draft.status === 'unlinked' && !plan.mapping.has(person.id)
            || draft.status === 'differences' && unresolved || draft.status === 'staged' && staged;
        if (!selected && (!matchesStatus || branch && !branch.has(person.id) || query
            && !`${geneoPersonDisplayName(person)} ${geneoPersonLifeDates(person)}`.toLocaleLowerCase().includes(query))) continue;
        const group = selected ? 'Selected person' : staged ? 'Changes selected' : unresolved ? 'To review' : 'No changes';
        const name = escapeHtml(geneoPersonDisplayName(person));
        groups.get(group).push(`<button type="button" class="gr-person ${selected ? 'is-selected' : ''}" data-gr-person="${escapeHtml(person.id)}" aria-current="${selected}">
            ${geneoReviewAvatar(person, true)}<span><strong title="${name}">${name}</strong><small>${escapeHtml(t(staged && key !== 'conflicts' ? 'Changes selected' : label))}</small></span>
            <span class="gr-state ${staged ? 'staged' : key}" aria-hidden="true">${staged ? icon.check : statusIcon}</span></button>`);
    }
    const rows = [...groups].filter(([, people]) => people.length).map(([group, people]) =>
        `<section class="gr-rail-group"><h3>${escapeHtml(t(group))}${group === 'Selected person' ? '' : ` · ${people.length}`}</h3>${people.join('')}</section>`).join('');
    return `<nav class="gr-rail" aria-label="${escapeHtml(t('People'))}">
        <div class="gr-search-row">${geneoReviewSearch('Search board people', draft.search, 'data-gr-search')}
        <div class="gr-filter"><button type="button" class="icon-button ${draft.status !== 'all' || branch ? 'active' : ''}" data-gr-filter-toggle aria-controls="grReviewFilters" aria-expanded="${Boolean(draft.filterOpen)}" aria-label="${escapeHtml(t('Filter review status'))}" title="${escapeHtml(t('Filter review status'))}">${icon.filter}</button>
        ${draft.filterOpen ? `<div class="gr-filter-menu" id="grReviewFilters">
            ${[['People', [['board', 'All people'], ['branch', 'Family branch']], draft.scope, 'scope'],
                ['Review status', [['all', 'All statuses'], ...Object.entries(statuses)], draft.status, 'status']].map(([heading, entries, current, dimension]) =>
                `<div class="gr-filter-group" role="group" aria-label="${escapeHtml(t(heading))}"><strong>${escapeHtml(t(heading))}</strong>${entries.map(([key, label]) =>
                    `<button type="button" data-gr-${dimension}="${key}" aria-pressed="${key === current}"><span>${escapeHtml(t(label))}</span>${key === current ? icon.check : ''}</button>`).join('')}</div>`).join('')}</div>` : ''}</div></div>
        ${branch ? `<button class="gr-filter-chip" type="button" data-gr-scope aria-label="${escapeHtml(t('Clear branch filter'))}">${escapeHtml(t('Family branch'))}${icon.close}</button>` : ''}
        ${draft.status !== 'all' ? `<button class="gr-filter-chip" type="button" data-gr-status="all" aria-label="${escapeHtml(t('Clear status filter'))}">${escapeHtml(t(statuses[draft.status]))}${icon.close}</button>` : ''}
        <div class="gr-people-list">${rows}</div></nav>`;
}

function geneoReviewDuplicate(draft, personId, treeId)
{
    return draft.diagram.people.find(person => person.id !== personId
        && ((draft.choices.has(person.id) ? draft.choices.get(person.id) : person.treePersonId) === treeId
            || [...(draft.relativeTargets || [])].some(([key, target]) => target === treeId && key.endsWith(`|${person.id}`))));
}

function geneoReviewComparisonRow(label, boardText, treeText, source, attributes, options = {})
{
    const transfer = direction =>
    {
        const description = `${label}: ${t(direction === 'board' ? 'Copy to Family Tree' : 'Copy to board')}`;
        return `<button type="button" class="gr-transfer ${source === direction ? 'is-selected' : ''} ${direction === 'tree' ? 'is-left' : ''}" ${attributes}
            data-source="${direction}" aria-pressed="${source === direction}" aria-label="${escapeHtml(description)}" title="${escapeHtml(description)}" ${options[direction + 'Blocked'] ? 'disabled' : ''}>${icon.arrow}</button>`;
    };
    const cell = (value, proposed, direction) =>
    {
        const changed = source === direction;
        return `<div class="gr-value ${changed ? 'is-destination' : ''}">${changed
            ? `<del>${escapeHtml(value)}</del><strong>${escapeHtml(options.clear ? t('Clear value') : proposed)}</strong>`
            : `<span>${escapeHtml(value)}</span>`}</div>`;
    };
    return `<div class="gr-fact"><h4>${escapeHtml(label)}</h4><div class="gr-values">
        ${cell(boardText, treeText, 'tree')}<div class="gr-transfers">${options.boardBlocked ? '' : transfer('board')}${options.treeBlocked ? '' : transfer('tree')}</div>${cell(treeText, boardText, 'board')}</div></div>`;
}

function geneoReviewFactRows(draft, person, tree)
{
    const fields = geneoTreeImportFields(person, tree);
    if (!fields.length) return '';
    const decisions = draft.fields.get(person.id);
    return `<section class="gr-section gr-facts"><h3><span aria-hidden="true">${icon.checklist}</span>${escapeHtml(t('Facts'))}</h3>${fields.map(([key, label, boardValue, treeValue]) =>
    {
        const source = decisions?.get(key);
        const clear = source && geneoReviewFactEmpty(geneoReviewFact(source === 'board' ? person : tree, key));
        return geneoReviewComparisonRow(t(label), boardValue, treeValue, source, `data-gr-fact="${key}"`, { clear });
    }).join('')}</section>`;
}

function geneoReviewText(key, values = {})
{
    return Object.entries(values).reduce((text, [name, value]) => text.replaceAll(`{${name}}`, value), t(key));
}

function geneoReviewRelativePhrase(draft, relation, personId, create = false)
{
    const names = ids => ids.map(id => geneoPersonDisplayName(geneoReviewPersonById(draft, id))).join(` ${t('and')} `);
    const child = relation.type === 'child' && relation.ids.at(-1) === personId;
    const category = relation.type === 'child' ? child ? 'child' : 'parent' : relation.type === 'partner' ? 'partner' : 'sibling';
    const relatives = relation.type === 'child' ? child ? relation.ids.slice(0, -1) : [relation.ids.at(-1)] : relation.ids.filter(id => id !== personId);
    const keys = create ? { child: 'Create in Family Tree as a child of {names}', parent: 'Create in Family Tree as a parent of {names}', partner: 'Create in Family Tree as a partner of {names}', sibling: 'Create in Family Tree as a sibling of {names}' }
        : { child: 'Add as a child of {names}', parent: 'Add as a parent of {names}', partner: 'Connect as a partner of {names}', sibling: 'Add as a sibling of {names}' };
    return geneoReviewText(keys[category], { names: names(relatives) });
}

function geneoReviewPersonOperations(draft, person, plan, includeConnections = true)
{
    const operations = plan.operations.filter(operation => operation.personId === person.id || includeConnections && operation.ids?.includes(person.id));
    return `<ul class="gr-operation-list">${operations.map(operation =>
    {
        if (operation.type === 'identity')
        {
            const linked = getPerson(draft.choices.get(person.id));
            return `<li>${escapeHtml(operation.label === 'Link existing' && linked ? geneoReviewText('Link to {name}', { name: connectPersonName(linked) }) : t(operation.label))}</li>`;
        }
        if (operation.type === 'relationshipField')
        {
            const relation = plan.relations.find(item => item.id === operation.relationId);
            const counterpart = relation ? geneoReviewRelationSubjects(relation, person.id).map(id => geneoPersonDisplayName(geneoReviewPersonById(draft, id))).join(', ') : '';
            const direction = operation.source === 'board' ? 'Copy to Family Tree' : 'Copy to board';
            return `<li><strong>${escapeHtml(t(direction))}</strong> · ${escapeHtml([counterpart, operation.displayLabel || [operation.context, t(operation.label)].filter(Boolean).join(' · ')].filter(Boolean).join(' · '))}: ${escapeHtml(operation.clear ? t('Clear value') : operation.value)}</li>`;
        }
        if (operation.type === 'fact') return `<li><strong>${escapeHtml(t(operation.source === 'board' ? 'Family Tree' : 'On board'))}</strong> · ${operation.context ? escapeHtml(operation.context) + ' · ' : ''}${escapeHtml(t(operation.label))}: ${escapeHtml(operation.clear ? t('Clear value') : operation.value)}</li>`;
        if (operation.type === 'boardPerson') return `<li>${escapeHtml(t('Add person to board'))}: ${escapeHtml(connectPersonName(getPerson(operation.treeId)))}</li>`;
        const relation = plan.relations.find(item => item.id === operation.relationId);
        return `<li><strong>${escapeHtml(t(operation.source === 'board' ? 'Family Tree' : 'On board'))}</strong> · ${escapeHtml(geneoReviewRelativePhrase(draft, relation, person.id))}${operation.clears?.length ? ` · ${escapeHtml(t('Clear value'))}: ${escapeHtml(operation.clears.map(t).join(', '))}` : ''}</li>`;
    }).join('')}</ul>`;
}

function geneoReviewUndoAutoRelation(draft, personId)
{
    const automatic = draft.autoRelations?.get(personId);
    if (!automatic) return;
    if (automatic.previous) draft.relationChoices.set(automatic.id, automatic.previous);
    else draft.relationChoices.delete(automatic.id);
    draft.autoRelations.delete(personId);
}

function geneoReviewUndoRecordRow(draft, id)
{
    draft.relationChoices.delete(id);
    for (const [personId, origin] of draft.rowIdentityOrigins || [])
    {
        const dependent = geneoReviewAllRelations(draft).some(item => item.ids.includes(personId) && draft.relationChoices.get(item.id) === 'board');
        if (!dependent)
        {
            if (draft.choices.get(personId) === origin.applied) draft.choices.set(personId, origin.before);
            draft.rowIdentityOrigins.delete(personId);
        }
    }
}

function geneoReviewConfirmUnlink(modal, draft, person)
{
    const dialog = document.createElement('dialog');
    dialog.className = 'modal unlink-relationship-modal gr-unlink-confirm';
    dialog.setAttribute('aria-labelledby', 'grUnlinkTitle');
    dialog.setAttribute('aria-describedby', 'grUnlinkDescription');
    dialog.innerHTML = `<div class="modal-header"><div><h2 id="grUnlinkTitle">${escapeHtml(t('Unlink from Family Tree?'))}</h2>
        <p>${escapeHtml(geneoPersonDisplayName(person))}</p></div>
        <button type="submit" form="grUnlinkForm" class="close-button" value="cancel" aria-label="${escapeHtml(t('Close'))}">${icon.close}</button></div>
        <div class="modal-body unlink-relationship-body"><div class="unlink-relationship-warning" id="grUnlinkDescription">
            <strong>${escapeHtml(t('The board card and Family Tree person will be kept.'))}</strong>
            <span>${escapeHtml(t('The link will be removed when you apply changes. Any sync changes selected for this person will be cleared.'))}</span></div></div>
        <form id="grUnlinkForm" method="dialog" class="modal-footer"><button class="button secondary" value="cancel" autofocus>${escapeHtml(t('Cancel'))}</button>
        <button class="button danger" value="unlink">${escapeHtml(t('Unlink'))}</button></form>`;
    dialog.addEventListener('click', event => event.stopPropagation());
    dialog.addEventListener('keydown', event => { if (event.key === 'Escape') event.stopPropagation(); });
    dialog.addEventListener('close', () =>
    {
        dialog.remove();
        if (dialog.returnValue !== 'unlink' || geneoTreeImportDraft !== draft || !modal.isConnected) return;
        draft.fields.delete(person.id);
        for (const relation of geneoReviewAllRelations(draft).filter(item => item.ids.includes(person.id)))
        {
            if (draft.relationChoices.has(relation.id)) geneoReviewUndoRecordRow(draft, relation.id);
            draft.relationshipFields.delete(relation.id);
            for (const id of relation.ids) draft.relativeTargets.delete(`${relation.id}|${id}`);
        }
        geneoReviewUndoAutoRelation(draft, person.id);
        draft.unlinkChoices ||= new Map();
        draft.unlinkChoices.set(person.id, person.treePersonId || 'skip');
        draft.choices.set(person.id, 'unlink');
        draft.error = '';
        geneoTreeImportRender();
        modal.querySelector('[data-gr-identity-reset]')?.focus({ preventScroll: true });
    }, { once: true });
    modal.append(dialog);
    dialog.showModal();
}

function geneoReviewPersonDetail(draft, plan)
{
    const person = draft.people.find(item => item.id === draft.activePersonId);
    if (!person) return '';
    const choice = draft.choices.get(person.id);
    const candidate = !['create', 'skip', 'unlink'].includes(choice) ? getPerson(choice) : null;
    const tree = candidate && !candidate.deleted && candidate.projectId === draft.projectId ? candidate : null;
    const staged = plan.operations.find(operation => operation.personId === person.id && operation.type === 'identity');
    const original = getPerson(person.treePersonId);
    const canCreate = !original || original.deleted || original.projectId !== draft.projectId;
    const addPerson = canCreate && !tree && choice !== 'unlink';
    const move = [...draft.boardLinkMoves.values()].find(item => item.from === person.id || item.to === person.id);
    const actionButton = (attributes, label, svg = icon.link) => `<button type="button" class="button ghost gr-card-search" ${attributes}>${svg}${escapeHtml(t(label))}</button>`;
    const card = (label, svg, identity, action, footer = '', unlink = '') => `<section class="gr-identity-column"><header class="gr-identity-heading"><h3 class="gr-identity-source"><span aria-hidden="true">${svg}</span>${escapeHtml(t(label))}</h3>${action}</header><div class="gr-identity-card"><div class="gr-identity-card-body">${identity}</div>${unlink}</div>${footer.trim() ? `<div class="gr-identity-card-actions">${footer}</div>` : ''} </section>`;
    const treeMissing = choice === 'unlink' ? 'Link will be removed' : choice === 'create' ? 'Will be created in Family Tree'
        : person.treePersonId ? 'Tree record unavailable' : 'Not linked to Family Tree';
    const facts = tree && !move ? geneoReviewFactRows(draft, person, tree) : '';
    const relationships = !move && choice !== 'unlink' ? geneoReviewRelations(draft, person, plan) : '';
    const treeActions = `
        ${staged && !move && choice !== 'create' ? `${choice === 'unlink' ? '' : `<span class="gr-record-type">${escapeHtml(t(staged.label))}</span>`}<button type="button" class="gr-text" data-gr-identity-reset>${escapeHtml(t('Undo'))}</button>` : ''}
        `;
    const unlink = person.treePersonId && choice !== 'unlink' && !move
        ? `<button type="button" class="icon-button gr-identity-unlink" data-gr-unlink aria-label="${escapeHtml(t('Unlink'))}" title="${escapeHtml(t('Unlink'))}">${icon.unlink}</button>` : '';
    return `<div class="gr-detail"><button type="button" class="gr-text gr-back-list" data-gr-list>${escapeHtml(t('Back to people'))}</button>
        <div class="gr-values gr-identity-comparison">
            ${card('On board', icon.whiteboard, geneoReviewIdentity(person, true), actionButton('data-gr-change-anchor' + (tree && !move ? '' : ' disabled'), 'Change link'))}
            <div class="gr-identity-spacer">${addPerson ? `<button type="button" class="gr-transfer ${choice === 'create' ? 'is-selected' : ''}" data-gr-identity-new aria-pressed="${choice === 'create'}" aria-label="${escapeHtml(t('Add to Family Tree'))}">${icon.arrow}</button>` : `<span aria-hidden="true">${icon.link}</span>`}</div>
            ${card('Family Tree', icon.tree, tree ? geneoReviewIdentity(tree) : choice === 'create' ? geneoReviewIdentity(person, true) : addPerson ? `<button type="button" class="gr-empty-record gr-empty-transfer" data-gr-identity-new>${icon.plus}<span>${escapeHtml(t('Add to Family Tree'))}</span></button>` : `<p class="gr-muted">${escapeHtml(t(treeMissing))}</p>`,
                actionButton('data-gr-link' + (move ? ' disabled' : ''), tree ? 'Change link' : 'Link person'), treeActions, unlink)}
        </div>
        ${move ? `<p class="gr-muted">${escapeHtml(geneoReviewText('Move {name}’s Family Tree link from {from} to {to}.', {
            name: connectPersonName(getPerson(move.treeId)), from: geneoPersonDisplayName(geneoReviewPersonById(draft, move.from)),
            to: geneoPersonDisplayName(geneoReviewPersonById(draft, move.to))
        }))} <button class="gr-text" type="button" data-gr-undo-board-link="${escapeHtml(move.from)}">${escapeHtml(t('Undo'))}</button></p>` : ''}
        ${staged?.label === 'Link existing' && !move && original && original.id !== tree?.id ? `<p class="gr-muted">${escapeHtml(geneoReviewText('Replace the link to {from} with a link to {to}.', { from: connectPersonName(original), to: connectPersonName(tree) }))}</p>` : ''}
        ${facts}${relationships}
        ${tree && !move && !facts && !relationships ? `<p class="gr-review-empty gr-muted">${escapeHtml(t('No differences for this person.'))}</p>` : ''}</div>`;
}

function geneoReviewSummary(draft, plan)
{
    const ids = new Set(plan.operations.map(operation => operation.personId));
    return `<div class="gr-final"><h3>${escapeHtml(t('Selected changes'))}</h3>${[...ids].map(id =>
    {
        const person = draft.people.find(item => item.id === id);
        return `<section class="gr-summary-person">${geneoReviewIdentity(person, true)}${geneoReviewPersonOperations(draft, person, plan, false)}<button type="button" class="gr-text" data-gr-person="${escapeHtml(id)}">${escapeHtml(t('Review person'))}</button></section>`;
    }).join('') || `<p class="gr-muted">${escapeHtml(t('No changes selected'))}</p>`}</div>`;
}

function geneoTreeImportRender()
{
    const draft = geneoTreeImportDraft;
    const modal = modalBackdrop.querySelector('.geneo-family-review');
    if (!draft || !modal) return;
    const plan = geneoTreeImportPreview(draft);
    const active = document.activeElement;
    const focusKey = active && modal.contains(active) ? active.dataset.grFocus : '';
    const selection = active instanceof HTMLInputElement ? active.selectionStart : null;
    const scrolls = ['.gr-rail', '.gr-detail', '.gr-final'].map(selector => [selector, modal.querySelector(selector)?.scrollTop || 0]);
    if (!draft.relationshipExpanded) draft.relationshipExpanded = new Map();
    modal.querySelectorAll('[data-gr-relationship-settings]').forEach(element => draft.relationshipExpanded.set(element.dataset.grRelationshipSettings, element.open));
    const body = modal.querySelector('[data-gr-body]');
    modal.classList.toggle('gr-mobile-detail', draft.mobileDetail);
    body.innerHTML = `${geneoReviewRail(draft, plan)}${geneoReviewPersonDetail(draft, plan)}`;
    modal.querySelector('[data-gr-changes]').innerHTML = draft.summaryOpen ? geneoReviewSummary(draft, plan) : '';
    modal.querySelector('[data-gr-changes]').hidden = !draft.summaryOpen;
    modal.querySelectorAll('select.common-select').forEach(select =>
    {
        if (select.parentElement.classList.contains('common-select-shell')) return;
        const shell = document.createElement('span'); shell.className = 'common-select-shell';
        select.before(shell); shell.append(select);
        const chevron = document.createElement('span'); chevron.className = 'common-select-chevron'; chevron.setAttribute('aria-hidden', 'true'); chevron.innerHTML = icon.chevron;
        shell.append(chevron);
    });
    modal.querySelector('[data-gr-error]').textContent = draft.error || plan.error || '';
    const blockedField = plan.errors.find(error => error.relationId && draft.relationshipFields.has(error.relationId));
    const clearField = modal.querySelector('[data-gr-reset-blocked-fields]');
    clearField.hidden = !blockedField;
    clearField.dataset.grResetBlockedFields = blockedField?.relationId || '';
    const reviewError = modal.querySelector('[data-gr-locate-error]');
    const affected = plan.errors.find(error => error.personId && draft.people.some(person => person.id === error.personId));
    reviewError.hidden = !affected || affected.personId === draft.activePersonId;
    reviewError.dataset.grLocateError = affected?.personId || '';
    modal.querySelector('[data-gr-refresh]').hidden = !plan.errors.some(error => error.message === t('A reviewed record changed. Refresh the review to keep your choices and compare the latest values.'));
    const counts = [['Create in Tree', 'person to create', 'people to create'], ['Link existing', 'person to link', 'people to link'], ['Unlink from Family Tree', 'person to unlink', 'people to unlink'], ['boardPerson', 'card to add', 'cards to add'], ['relationship', 'family connection', 'family connections'], ['relationshipField', 'relationship field change', 'relationship field changes'], ['fact', 'fact change', 'fact changes']]
        .map(([type, one, many]) => { const count = plan.operations.filter(operation => operation.type === type || operation.label === type).length; return count ? `${count} ${t(count === 1 ? one : many)}` : ''; }).filter(Boolean);
    modal.querySelector('[data-gr-summary]').textContent = counts.join(' · ') || t('No changes selected');
    modal.querySelector('[data-gr-summary]').setAttribute('aria-expanded', Boolean(draft.summaryOpen));
    const next = modal.querySelector('[data-gr-next]');
    next.textContent = t('Apply changes');
    next.disabled = !plan.patches.length || Boolean(plan.error);
    localizeUI(modal, { suppressObserverReplay: true });
    for (const [selector, scroll] of scrolls) if (modal.querySelector(selector)) modal.querySelector(selector).scrollTop = scroll;
    modal.querySelectorAll('button, input, select, summary[data-gr-config-summary]').forEach(element =>
    {
        element.dataset.grFocus = [...element.attributes].filter(attribute => attribute.name.startsWith('data-gr-') && attribute.name !== 'data-gr-focus').map(attribute => `${attribute.name}:${attribute.value}`).join('|') + (element.dataset.source || '');
    });
    if (focusKey)
    {
        const target = [...modal.querySelectorAll('[data-gr-focus]')].find(element => element.dataset.grFocus === focusKey);
        target?.focus({ preventScroll: true });
        if (target instanceof HTMLInputElement && ['text', 'search'].includes(target.type) && selection !== null) target.setSelectionRange(selection, selection);
    }
}

function geneoStageReviewBoardLink(draft, person, targetId)
{
    const target = draft.people.find(item => item.id === targetId);
    const treeId = draft.choices.get(person.id);
    const tree = getPerson(treeId);
    const affected = [person.id, target?.id];
    const hasTransfers = affected.some(id => draft.fields.get(id)?.size || draft.rowIdentityOrigins?.has(id))
        || geneoReviewAllRelations(draft).some(relation => relation.ids.some(id => affected.includes(id))
            && (draft.relationChoices.has(relation.id) || draft.relationshipFields.has(relation.id)));
    if (!target || target.treePersonId || draft.choices.get(target.id) !== 'skip' || !tree || tree.deleted || tree.projectId !== draft.projectId)
        draft.error = t('Choose an unlinked board person.');
    else if (hasTransfers) draft.error = t('Clear selected transfers for these people before changing the link.');
    else
    {
        draft.boardLinkMoves.set(person.id, { from: person.id, to: target.id, treeId,
            previous: draft.choices.get(person.id), previousTarget: draft.choices.get(target.id) });
        draft.choices.set(person.id, 'unlink');
        draft.choices.set(target.id, treeId);
        draft.activePersonId = target.id;
    }
}

function geneoStageReviewTreeLink(draft, person, treeId)
{
    const duplicate = geneoReviewDuplicate(draft, person.id, treeId);
    const hasTransfers = draft.fields.get(person.id)?.size || draft.rowIdentityOrigins?.has(person.id)
        || geneoReviewAllRelations(draft).some(relation => relation.ids.includes(person.id)
            && (draft.relationChoices.has(relation.id) || draft.relationshipFields.has(relation.id)));
    if (hasTransfers && draft.choices.get(person.id) !== treeId)
        draft.error = t('Clear selected transfers for these people before changing the link.');
    else if (duplicate) draft.error = t('This Tree person is already represented on the board. Locate the existing person instead.');
    else
    {
        geneoReviewUndoAutoRelation(draft, person.id);
        if (draft.choices.get(person.id) !== treeId)
        {
            draft.choices.set(person.id, treeId);
            draft.fields.delete(person.id);
        }
    }
}

function geneoStageReviewRelation(draft, id, direction)
{
    const relation = geneoReviewAllRelations(draft).find(item => item.id === id);
    if (!relation) return;
    const old = draft.relationChoices.get(id);
    if (direction === 'none' || old === direction)
    {
        geneoReviewUndoRecordRow(draft, id);
    }
    else
    {
        if ([...draft.boardLinkMoves.values()].some(move => relation.ids.includes(move.from) || relation.ids.includes(move.to)))
        {
            draft.error = t('Apply or undo the link change before syncing this relationship.');
            return;
        }
        const targets = direction === 'board' ? relation.ids.map(personId => [personId, geneoReviewRelativeTarget(draft, relation, personId)]) : [];
        if (targets.some(([personId, target]) => target && target !== 'create' && geneoReviewDuplicate(draft, personId, target)))
        {
            draft.error = t('This Tree person is already represented on the board. Locate the existing person instead.');
            return;
        }
        if (!draft.transferDirections) draft.transferDirections = new Map();
        if (draft.transferDirections.has(id) && draft.transferDirections.get(id) !== direction) draft.transferTypes.set(id, geneoReviewRelationType(draft, relation, direction));
        draft.transferDirections.set(id, direction);
        draft.relationChoices.set(id, direction);
        if (direction === 'board')
        {
            if (!draft.rowIdentityOrigins) draft.rowIdentityOrigins = new Map();
            for (const personId of relation.ids)
            {
                const target = targets.find(([targetPersonId]) => targetPersonId === personId)?.[1];
                if (target && target !== draft.choices.get(personId))
                {
                    if (!draft.rowIdentityOrigins.has(personId)) draft.rowIdentityOrigins.set(personId, { before: draft.choices.get(personId), applied: target });
                    draft.choices.set(personId, target);
                }
            }
        }
    }
}

function geneoOpenReviewPersonPicker(modal, draft, person, mode, anchor, relationId = '')
{
    if (!person) return;
    const board = mode === 'board';
    const candidates = board ? draft.people.filter(item => item.id !== person.id).map(item => ({
        id: item.id, name: geneoPersonDisplayName(item), dates: geneoPersonLifeDates(item), avatar: geneoPersonAvatarModel(item),
        unavailable: item.treePersonId || draft.choices.get(item.id) !== 'skip' ? 'Already linked' : ''
    })) : geneoTreeImportMatches(person, draft.projectId, draft).map(({ person: item, context }) => ({
        id: item.id, name: connectPersonName(item), dates: connectPersonLifeLine(item), avatar: item,
        searchText: [getPlaceEventDisplay(item.birth), ...context].filter(Boolean).join(' '),
        unavailable: geneoReviewDuplicate(draft, person.id, item.id) ? 'Already linked' : ''
    }));
    openSinglePersonPicker({ parent: modal, anchor, candidates,
        subtitle: t(board ? 'Choose a board person to link to {name} in Family Tree.' : 'Choose a Family Tree person to link to {name}.')
            .replace('{name}', () => board ? connectPersonName(getPerson(draft.choices.get(person.id))) : geneoPersonDisplayName(person)),
        onSelect: id =>
        {
            if (geneoTreeImportDraft !== draft) return;
            draft.error = '';
            if (board) geneoStageReviewBoardLink(draft, person, id);
            else if (mode === 'relative') geneoStageReviewRelativeTarget(draft, relationId, person.id, id);
            else geneoStageReviewTreeLink(draft, person, id);
            geneoTreeImportRender();
            if (mode === 'relative')
            {
                const row = [...modal.querySelectorAll('[data-gr-record-row]')].find(item => item.dataset.grRecordRow === relationId);
                if (row) { row.tabIndex = -1; row.focus({ preventScroll: true }); return; }
            }
            const heading = modal.querySelector('.gr-identity-source');
            if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
        }
    });
}

function geneoStageReviewRelativeTarget(draft, relationId, personId, target)
{
    const relation = geneoReviewAllRelations(draft).find(item => item.id === relationId);
    if (!relation || !relation.ids.includes(personId)) return;
    if (target !== 'create' && geneoReviewDuplicate(draft, personId, target))
    {
        draft.error = t('This Tree person is already represented on the board. Locate the existing person instead.');
        return;
    }
    const previous = draft.relativeTargets.get(`${relationId}|${personId}`) || draft.choices.get(personId);
    if (previous !== target)
    {
        // A row-selected identity may also be used by other staged relationships.
        // Undo those transfers before changing its endpoint, leaving unrelated rows intact.
        const affected = geneoReviewAllRelations(draft).filter(item => item.id === relationId
            || draft.rowIdentityOrigins?.has(personId) && item.ids.includes(personId));
        for (const item of affected)
        {
            geneoReviewUndoRecordRow(draft, item.id);
            draft.relationshipFields.delete(item.id);
        }
    }
    draft.relativeTargets.set(`${relationId}|${personId}`, target);
    const type = draft.transferTypes.get(relationId) || geneoReviewRelationType(draft, relation, 'board');
    const families = relation.type === 'child' ? geneoReviewTreeFamilyCandidates(draft, relation) : [];
    const ready = relation.ids.every(id => !['', 'skip', 'unlink'].includes(geneoReviewRelativeTarget(draft, relation, id)))
        && (relation.type !== 'sibling' || draft.siblingFamilies.has(relationId))
        && (families.length <= 1 || draft.treeFamilyChoices.has(relationId));
    if (type && ready && draft.relationChoices.get(relationId) !== 'board')
        geneoStageReviewRelation(draft, relationId, 'board');
}

function openGeneographTreeImport(options = {})
{
    const board = selectedGeneographBoard();
    const node = selectedGeneographNode();
    const startId = options.personId || (node?.type === 'person' ? node.personId : '');
    if (!board || board.projectId !== currentProjectId() || !board.diagram.people.some(person => person.id === startId)) return;
    geneoTreeImportDraft = geneoReviewDraft(board, startId);
    openModal(`<div class="modal geneo-family-review" role="dialog" aria-modal="true" aria-labelledby="geneoReviewTitle">
        <header class="modal-header"><h2 id="geneoReviewTitle">${escapeHtml(t('Sync board and Family Tree'))}</h2><button class="close-button" type="button" data-close aria-label="${escapeHtml(t('Close'))}">${icon.close}</button></header>
        <div class="gr-body" data-gr-body></div>
        <div class="gr-changes" id="grSelectedChanges" data-gr-changes role="region" aria-label="${escapeHtml(t('Selected changes'))}" hidden></div>
        <div class="gr-errors"><span role="alert" data-gr-error></span><button type="button" class="gr-text" data-gr-refresh hidden>${escapeHtml(t('Refresh review'))}</button><button type="button" class="gr-text" data-gr-reset-blocked-fields hidden>${escapeHtml(t('Clear selected changes'))}</button><button type="button" class="gr-text" data-gr-locate-error hidden>${escapeHtml(t('Review person'))}</button></div>
        <footer class="modal-footer"><button type="button" class="gr-footer-summary gr-text" data-gr-summary aria-controls="grSelectedChanges" aria-expanded="false" title="${escapeHtml(t('Show selected changes'))}"></button><button type="button" class="button secondary" data-close>${escapeHtml(t('Cancel'))}</button><button class="button primary" type="button" data-gr-next>${escapeHtml(t('Apply changes'))}</button></footer></div>`);
    const modal = modalBackdrop.querySelector('.geneo-family-review');
    modal.addEventListener('click', event =>
    {
        const draft = geneoTreeImportDraft;
        if (!draft) return;
        const dismissFilter = draft.filterOpen && !event.target.closest('.gr-filter');
        if (dismissFilter) draft.filterOpen = false;
        const button = event.target.closest('button');
        if (!button || button.disabled || button.hasAttribute('data-close'))
        { if (dismissFilter && !button?.hasAttribute('data-close')) geneoTreeImportRender(); return; }
        const person = draft.people.find(item => item.id === draft.activePersonId);
        draft.error = '';
        if (button.hasAttribute('data-gr-change-anchor') || button.hasAttribute('data-gr-link') || button.hasAttribute('data-gr-relative-search'))
        {
            const relative = button.hasAttribute('data-gr-relative-search');
            geneoOpenReviewPersonPicker(modal, draft, relative ? geneoReviewPersonById(draft, button.dataset.person) : person,
                relative ? 'relative' : button.hasAttribute('data-gr-link') ? 'tree' : 'board', button, button.dataset.relation);
            return;
        }
        else if (button.hasAttribute('data-gr-scope')) { draft.scope = button.dataset.grScope || 'board'; draft.filterOpen = false; }
        else if (button.hasAttribute('data-gr-status')) { draft.status = button.dataset.grStatus; draft.filterOpen = false; }
        else if (button.hasAttribute('data-gr-filter-toggle')) draft.filterOpen = !draft.filterOpen;
        else if (button.hasAttribute('data-gr-person') || button.hasAttribute('data-gr-locate') || button.hasAttribute('data-gr-locate-error'))
        {
            draft.activePersonId = button.dataset.grPerson || button.dataset.grLocate || button.dataset.grLocateError;
            draft.summaryOpen = false; draft.mobileDetail = true;
            if (button.hasAttribute('data-gr-locate')) { draft.scope = 'board'; draft.search = ''; draft.status = 'all'; }
        }
        else if (button.hasAttribute('data-gr-undo-board-link'))
        {
            const move = draft.boardLinkMoves.get(button.dataset.grUndoBoardLink);
            draft.choices.set(move.from, move.previous);
            draft.choices.set(move.to, move.previousTarget);
            draft.boardLinkMoves.delete(move.from);
            draft.activePersonId = move.from;
        }
        else if (button.hasAttribute('data-gr-list')) draft.mobileDetail = false;
        else if (button.hasAttribute('data-gr-relative-create')) geneoStageReviewRelativeTarget(draft, button.dataset.relation, button.dataset.person, 'create');
        else if (button.hasAttribute('data-gr-identity-new'))
        {
            if (draft.choices.get(person.id) === 'create')
            {
                for (const relation of geneoReviewAllRelations(draft).filter(item => item.ids.includes(person.id)))
                    if (draft.relationChoices.has(relation.id)) geneoReviewUndoRecordRow(draft, relation.id);
                draft.rowIdentityOrigins?.delete(person.id);
                draft.choices.set(person.id, 'skip');
            }
            else draft.choices.set(person.id, 'create');
            draft.fields.delete(person.id);
        }
        else if (button.hasAttribute('data-gr-unlink'))
        {
            geneoReviewConfirmUnlink(modal, draft, person);
            return;
        }
        else if (button.hasAttribute('data-gr-identity-reset'))
        {
            const wasUnlink = draft.choices.get(person.id) === 'unlink';
            geneoReviewUndoAutoRelation(draft, person.id);
            const tree = getPerson(person.treePersonId);
            draft.choices.set(person.id, wasUnlink ? draft.unlinkChoices?.get(person.id) || person.treePersonId || 'skip'
                : tree && !tree.deleted && tree.projectId === draft.projectId ? tree.id : 'skip');
            if (!wasUnlink) draft.fields.delete(person.id);
        }
        else if (button.hasAttribute('data-gr-fact'))
        {
            if (!draft.fields.has(person.id)) draft.fields.set(person.id, new Map());
            const fields = draft.fields.get(person.id);
            const key = button.dataset.grFact;
            if (button.dataset.source === 'none' || fields.get(key) === button.dataset.source) fields.delete(key);
            else fields.set(key, button.dataset.source);
        }
        else if (button.hasAttribute('data-gr-reset-blocked-fields'))
            draft.relationshipFields.delete(button.dataset.grResetBlockedFields);
        else if (button.hasAttribute('data-gr-clear-relationship-fields'))
            draft.relationshipFields.delete(button.dataset.grClearRelationshipFields);
        else if (button.hasAttribute('data-gr-relationship-field'))
        {
            const { grRelationshipId: id, grRelationshipField: key, source } = button.dataset;
            const relation = geneoReviewAllRelations(draft).find(item => item.id === id);
            if ([...draft.boardLinkMoves.values()].some(move => relation?.ids.includes(move.from) || relation?.ids.includes(move.to)))
            {
                draft.error = t('Apply or undo the link change before syncing this relationship.');
                geneoTreeImportRender();
                return;
            }
            const choices = draft.relationshipFields.get(id) || new Map();
            if (choices.get(key) === source) choices.delete(key);
            else choices.set(key, source);
            if (choices.size) draft.relationshipFields.set(id, choices);
            else draft.relationshipFields.delete(id);
        }
        else if (button.hasAttribute('data-gr-relation')) geneoStageReviewRelation(draft, button.dataset.grRelation, button.dataset.source);
        else if (button.hasAttribute('data-gr-next'))
        {
            geneoTreeImportCommit(); return;
        }
        else if (button.hasAttribute('data-gr-summary')) draft.summaryOpen = !draft.summaryOpen;
        else if (button.hasAttribute('data-gr-refresh'))
        {
            const current = getGeneographBoard(draft.boardId, { projectId: draft.projectId });
            draft.baseline = geneoReviewRecordSnapshot(current);
            draft.diagram = structuredClone(current.diagram);
            const represented = new Set(current.diagram.nodes.filter(item => item.type === 'person').map(item => item.personId));
            draft.people = draft.diagram.people.filter(item => represented.has(item.id));
            draft.relations = geneoTreeImportRelations(draft.diagram, represented);
            geneoReviewPrepareTreeRelationIds(draft);
            for (const item of draft.people)
            {
                if (!draft.choices.has(item.id)) draft.choices.set(item.id, item.treePersonId || 'skip');
                if (!draft.newIds.has(item.id)) draft.newIds.set(item.id, createRuntimeId('person'));
                if (!draft.siblingFamilyIds.has(item.id)) draft.siblingFamilyIds.set(item.id, createRuntimeId('family'));
            }
            for (const family of draft.diagram.families)
                for (const key of [family.id, ...family.partnerIds.map(id => JSON.stringify([family.id, id]))])
                    if (!draft.familyIds.has(key)) draft.familyIds.set(key, createRuntimeId('family'));
            if (!draft.people.some(item => item.id === draft.activePersonId)) draft.activePersonId = draft.anchorId;
        }
        else return;
        geneoTreeImportRender();
        if (button.closest('.gr-filter-menu')) modal.querySelector('[data-gr-filter-toggle]')?.focus();
        if (button.hasAttribute('data-gr-filter-toggle') && draft.filterOpen) modal.querySelector('.gr-filter-menu button[aria-pressed="true"]')?.focus();
        if (button.hasAttribute('data-gr-person') || button.hasAttribute('data-gr-locate') || button.hasAttribute('data-gr-locate-error'))
        {
            const heading = modal.querySelector('.gr-detail h3');
            if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
        }
        if (button.hasAttribute('data-gr-list')) modal.querySelector('.gr-person.is-selected')?.scrollIntoView({ block: 'nearest' });
    });
    modal.addEventListener('input', event =>
    {
        if (event.target.hasAttribute('data-gr-search')) geneoTreeImportDraft.search = event.target.value;
        else return;
        geneoTreeImportRender();
    });
    modal.addEventListener('change', event =>
    {
        const draft = geneoTreeImportDraft;
        if (event.target.hasAttribute('data-gr-sibling')) draft.siblingFamilies.set(event.target.dataset.grSibling, event.target.value);
        else if (event.target.hasAttribute('data-gr-parent-type')) draft.parentTypes.set(event.target.dataset.grParentType, event.target.value);
        else if (event.target.hasAttribute('data-gr-transfer-type')) draft.transferTypes.set(event.target.dataset.grTransferType, event.target.value);
        else if (event.target.hasAttribute('data-gr-tree-parents')) draft.treeParentChoices.set(event.target.dataset.grTreeParents, event.target.value);
        else if (event.target.hasAttribute('data-gr-tree-family')) draft.treeFamilyChoices.set(event.target.dataset.grTreeFamily, event.target.value);
        else return;
        geneoTreeImportRender();
    });
    modal.addEventListener('keydown', event =>
    {
        const menu = event.target.closest('.gr-filter-menu');
        if (menu && ['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key))
        {
            event.preventDefault();
            const items = [...menu.querySelectorAll('button')];
            const index = items.indexOf(event.target);
            const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1
                : (index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
            items[next]?.focus();
            return;
        }
        if (event.key === 'Escape' && geneoTreeImportDraft?.filterOpen)
        { event.preventDefault(); event.stopPropagation(); geneoTreeImportDraft.filterOpen = false; geneoTreeImportRender(); modal.querySelector('[data-gr-filter-toggle]')?.focus(); }
    });
    geneoTreeImportRender();
    if (options.match) modal.querySelector('[data-gr-link]')?.click();
}
