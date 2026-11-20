function geneoReviewButton(label, attributes = '', selected = false)
{
    return `<button type="button" class="gr-choice ${selected ? 'is-selected' : ''}" ${attributes} aria-pressed="${selected}">${escapeHtml(t(label))}</button>`;
}

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
    const dates = boardPerson ? geneoPersonLifeDates(person) : connectPersonLifeLine(person);
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
    const groups = new Map([['Selected person', []], ['To review', []], ['Changes selected', []], ['No changes', []]]);
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
        const group = selected ? 'Selected person' : unresolved ? 'To review' : staged ? 'Changes selected' : 'No changes';
        const name = escapeHtml(geneoPersonDisplayName(person));
        groups.get(group).push(`<button type="button" class="gr-person ${selected ? 'is-selected' : ''}" data-gr-person="${escapeHtml(person.id)}" aria-current="${selected}">
            ${geneoReviewAvatar(person, true)}<span><strong title="${name}">${name}</strong><small>${escapeHtml(t(label))}</small></span>
            <span class="gr-state ${key}" aria-hidden="true">${statusIcon}</span></button>`);
    }
    const rows = [...groups].filter(([, people]) => people.length).map(([group, people]) =>
        `<section class="gr-rail-group"><h3>${escapeHtml(t(group))}${group === 'Selected person' ? '' : ` · ${people.length}`}</h3>${people.join('')}</section>`).join('');
    return `<nav class="gr-rail" aria-label="${escapeHtml(t('People'))}">
        <div class="gr-search-row">${geneoReviewSearch('Search board people', draft.search, 'data-gr-search')}
        <div class="gr-filter"><button type="button" class="icon-button ${draft.status !== 'all' || branch ? 'active' : ''}" data-gr-filter-toggle aria-expanded="${Boolean(draft.filterOpen)}" aria-label="${escapeHtml(t('Filter review status'))}" title="${escapeHtml(t('Filter review status'))}">${icon.filter}</button>
        ${draft.filterOpen ? `<div class="gr-filter-menu" role="group" aria-label="${escapeHtml(t('Filter review status'))}">
            ${geneoReviewButton('Family branch', 'data-gr-scope', Boolean(branch))}
            ${Object.entries({ all: 'All people', ...statuses }).map(([key, label]) => geneoReviewButton(label, `data-gr-status="${key}"`, draft.status === key)).join('')}</div>` : ''}</div></div>
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

function geneoReviewCandidates(draft, person, relationId = '')
{
    if (draft.matchEditorOpenId !== person.id) return '';
    const query = draft.matchQueries.get(person.id) || '';
    const matches = geneoTreeImportMatches(person, draft.projectId, draft).filter(({ person: candidate, context }) =>
        !query || `${connectPersonName(candidate)} ${connectPersonLifeLine(candidate)} ${getPlaceEventDisplay(candidate.birth)} ${context.join(' ')}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
    return `<section class="gr-candidates">${geneoReviewSearch('Search by name, date, or place', query, `data-gr-match-search data-query-person="${escapeHtml(person.id)}"`)}
        <div class="gr-candidate-list">${matches.map(({ person: candidate, context, strong, eligible }) =>
        {
            const duplicate = geneoReviewDuplicate(draft, person.id, candidate.id);
            const parents = sampleData.families.filter(family => family.projectId === draft.projectId && (family.childIds || []).includes(candidate.id))
                .flatMap(geneoReviewFamilyParents).map(id => getPerson(id)).filter(Boolean).map(connectPersonName);
            return `<div class="gr-candidate">${geneoReviewIdentity(candidate)}<div class="gr-candidate-context"><span class="${strong ? 'gr-strong' : 'gr-muted'}">${escapeHtml(t(strong ? 'Strong match' : eligible ? 'Possible match' : 'Project record'))}</span>${context.length ? `<small>${escapeHtml(t('Recorded family'))}: ${escapeHtml(context.join(', '))}</small>` : parents.length ? `<small>${escapeHtml(t('Parents'))}: ${escapeHtml([...new Set(parents)].join(', '))}</small>` : ''}</div>
            ${duplicate ? `<button type="button" class="gr-text" data-gr-locate="${escapeHtml(duplicate.id)}">${escapeHtml(t('Locate existing'))}</button>` : `<button type="button" class="gr-choice" ${relationId ? `data-gr-relative-candidate="${escapeHtml(candidate.id)}" data-relation="${escapeHtml(relationId)}" data-person="${escapeHtml(person.id)}"` : `data-gr-match="${escapeHtml(candidate.id)}"`}>${escapeHtml(t('Choose person'))}</button>`}</div>`;
        }).join('') || `<p class="gr-muted">${escapeHtml(t('No matching records. Try another name or create a person.'))}</p>`}</div>
        <button type="button" class="gr-text" data-gr-match-close>${escapeHtml(t('Close search'))}</button></section>`;
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
        ${cell(boardText, treeText, 'tree')}<div class="gr-transfers">${transfer('board')}${transfer('tree')}</div>${cell(treeText, boardText, 'board')}</div>
        ${options.boardBlocked || options.treeBlocked ? `<p class="gr-muted">${escapeHtml(t('This relationship field cannot be copied independently.'))}</p>` : ''}</div>`;
}

function geneoReviewFactRows(draft, person, tree)
{
    const fields = geneoTreeImportFields(person, tree);
    if (!fields.length) return '';
    const decisions = draft.fields.get(person.id);
    return `<section class="gr-section gr-facts"><h3>${escapeHtml(t('Facts'))}</h3>${fields.map(([key, label, boardValue, treeValue]) =>
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
            return `<li><strong>${escapeHtml(t(direction))}</strong> · ${escapeHtml([counterpart, operation.context, t(operation.label)].filter(Boolean).join(' · '))}: ${escapeHtml(operation.clear ? t('Clear value') : operation.value)}</li>`;
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
    const searchButton = (attributes, label) => `<button type="button" class="button secondary gr-card-search" ${attributes} aria-label="${escapeHtml(t(label))}">${icon.search}${escapeHtml(t('Search'))}</button>`;
    const card = (label, identity, action, footer = '') => `<section class="gr-identity-card"><div class="gr-identity-card-head"><h3>${escapeHtml(t(label))}</h3>${action}</div>${identity}${footer}</section>`;
    const boardSearch = draft.changingAnchor ? `<section class="gr-candidates">${geneoReviewSearch('Search board people', draft.boardQuery || '', 'data-gr-board-query')}
        <div class="gr-candidate-list">${draft.people.filter(item => `${geneoPersonDisplayName(item)} ${geneoPersonLifeDates(item)}`.toLocaleLowerCase().includes((draft.boardQuery || '').trim().toLocaleLowerCase())).map(item =>
            `<div class="gr-candidate">${geneoReviewIdentity(item, true)}<button type="button" class="gr-choice" data-gr-person="${escapeHtml(item.id)}">${escapeHtml(t('Choose person'))}</button></div>`).join('')
            || `<p class="gr-muted">${escapeHtml(t('No people match these filters.'))}</p>`}</div>
        <button type="button" class="gr-text" data-gr-change-anchor>${escapeHtml(t('Close search'))}</button></section>` : '';
    const treeMissing = choice === 'unlink' ? 'Link will be removed' : choice === 'create' ? 'Will be created in Family Tree'
        : person.treePersonId ? 'Tree record unavailable' : 'Not linked to Family Tree';
    const treeActions = `<div class="gr-identity-actions">
        ${staged ? `<span class="gr-record-type">${escapeHtml(t(staged.label))}</span><button type="button" class="gr-text" data-gr-identity-reset>${escapeHtml(t('Undo'))}</button>` : ''}
        ${canCreate && choice !== 'create' && choice !== 'unlink' ? `<button type="button" class="gr-text" data-gr-identity-new>${escapeHtml(t('Create a new person'))}</button>` : ''}
        ${person.treePersonId && choice !== 'unlink' ? `<button type="button" class="gr-text" data-gr-unlink>${escapeHtml(t('Unlink'))}</button>` : ''}
        </div>`;
    return `<div class="gr-detail"><button type="button" class="gr-text gr-back-list" data-gr-list>${escapeHtml(t('Back to people'))}</button>
        <div class="gr-values gr-identity-comparison">
            ${card('On board', geneoReviewIdentity(person, true), searchButton('data-gr-change-anchor aria-expanded="' + Boolean(draft.changingAnchor) + '"', 'Search board people'))}
            <span class="gr-identity-spacer" aria-hidden="true"></span>
            ${card('Family Tree', tree ? geneoReviewIdentity(tree) : `<p class="gr-muted">${escapeHtml(t(treeMissing))}</p>${choice === 'create' ? geneoReviewIdentity(person, true) : ''}`,
                searchButton('data-gr-link aria-expanded="' + (draft.matchEditorOpenId === person.id && !draft.relativeSearch) + '"', 'Search Family Tree'), treeActions)}
        </div>
        ${choice === 'unlink' ? `<p class="gr-muted">${escapeHtml(t('The Family Tree person and their relationships will not be deleted.'))}</p>
            <button type="button" class="gr-choice" data-gr-discard-transfers>${escapeHtml(t('Remove this person’s selected transfers'))}</button>` : ''}
        ${boardSearch}${!draft.relativeSearch ? geneoReviewCandidates(draft, person) : ''}
        ${tree ? geneoReviewFactRows(draft, person, tree) : ''}
        ${choice !== 'unlink' ? geneoReviewRelations(draft, person, plan) : ''}</div>`;
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
    const scrolls = ['.gr-rail', '.gr-detail', '.gr-final', '.gr-candidate-list'].map(selector => [selector, modal.querySelector(selector)?.scrollTop || 0]);
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

function openGeneographTreeImport(options = {})
{
    const board = selectedGeneographBoard();
    const node = selectedGeneographNode();
    const startId = options.personId || (node?.type === 'person' ? node.personId : '');
    if (!board || board.projectId !== currentProjectId() || !board.diagram.people.some(person => person.id === startId)) return;
    geneoTreeImportDraft = geneoReviewDraft(board, startId);
    if (options.match) geneoTreeImportDraft.matchEditorOpenId = startId;
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
        if (button.hasAttribute('data-gr-change-anchor')) { draft.changingAnchor = !draft.changingAnchor; draft.matchEditorOpenId = ''; draft.relativeSearch = null; }
        else if (button.hasAttribute('data-gr-scope')) { draft.scope = draft.scope === 'board' ? 'branch' : 'board'; draft.filterOpen = false; }
        else if (button.hasAttribute('data-gr-status')) { draft.status = button.dataset.grStatus; draft.filterOpen = false; }
        else if (button.hasAttribute('data-gr-filter-toggle')) draft.filterOpen = !draft.filterOpen;
        else if (button.hasAttribute('data-gr-person') || button.hasAttribute('data-gr-locate') || button.hasAttribute('data-gr-locate-error'))
        {
            draft.activePersonId = button.dataset.grPerson || button.dataset.grLocate || button.dataset.grLocateError;
            draft.summaryOpen = false; draft.mobileDetail = true;
            draft.changingAnchor = false; draft.matchEditorOpenId = ''; draft.relativeSearch = null;
            if (button.hasAttribute('data-gr-locate')) { draft.scope = 'board'; draft.search = ''; draft.status = 'all'; }
        }
        else if (button.hasAttribute('data-gr-list')) draft.mobileDetail = false;
        else if (button.hasAttribute('data-gr-link'))
        {
            draft.changingAnchor = false;
            draft.matchEditorOpenId = draft.matchEditorOpenId === person.id && !draft.relativeSearch ? '' : person.id;
            draft.relativeSearch = null;
        }
        else if (button.hasAttribute('data-gr-match-close')) { draft.matchEditorOpenId = ''; draft.relativeSearch = null; }
        else if (button.hasAttribute('data-gr-relative-search'))
        {
            draft.relativeSearch = { relationId: button.dataset.relation, personId: button.dataset.person };
            draft.matchEditorOpenId = button.dataset.person;
        }
        else if (button.hasAttribute('data-gr-relative-create') || button.hasAttribute('data-gr-relative-candidate'))
        {
            const id = button.dataset.person;
            const target = button.hasAttribute('data-gr-relative-create') ? 'create' : button.dataset.grRelativeCandidate;
            if (target !== 'create' && geneoReviewDuplicate(draft, id, target)) draft.error = t('This Tree person is already represented on the board. Locate the existing person instead.');
            else draft.relativeTargets.set(`${button.dataset.relation}|${id}`, target);
            draft.relativeSearch = null; draft.matchEditorOpenId = '';
        }
        else if (button.hasAttribute('data-gr-relative-reset'))
        {
            geneoReviewUndoRecordRow(draft, button.dataset.relation);
            draft.relativeTargets.delete(`${button.dataset.relation}|${button.dataset.person}`);
            draft.relativeSearch = null; draft.matchEditorOpenId = '';
        }
        else if (button.hasAttribute('data-gr-identity-new'))
        {
            draft.choices.set(person.id, 'create');
            draft.fields.delete(person.id);
        }
        else if (button.hasAttribute('data-gr-unlink'))
        {
            if (!draft.unlinkChoices) draft.unlinkChoices = new Map();
            draft.unlinkChoices.set(person.id, draft.choices.get(person.id));
            draft.choices.set(person.id, 'unlink');
        }
        else if (button.hasAttribute('data-gr-discard-transfers'))
        {
            draft.fields.delete(person.id);
            draft.relations.filter(relation => relation.ids.includes(person.id)).forEach(relation =>
            {
                draft.relationChoices.delete(relation.id);
                draft.relationshipFields.delete(relation.id);
            });
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
        else if (button.hasAttribute('data-gr-match'))
        {
            const treeId = button.dataset.grMatch;
            const duplicate = geneoReviewDuplicate(draft, person.id, treeId);
            if (duplicate) draft.error = t('This Tree person is already represented on the board. Locate the existing person instead.');
            else
            {
                geneoReviewUndoAutoRelation(draft, person.id);
                draft.choices.set(person.id, treeId);
                draft.fields.delete(person.id);
                draft.matchEditorOpenId = '';
            }
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
            const choices = draft.relationshipFields.get(id) || new Map();
            if (choices.get(key) === source) choices.delete(key);
            else choices.set(key, source);
            if (choices.size) draft.relationshipFields.set(id, choices);
            else draft.relationshipFields.delete(id);
        }
        else if (button.hasAttribute('data-gr-relation'))
        {
            const id = button.dataset.grRelation;
            const relation = geneoReviewAllRelations(draft).find(item => item.id === id);
            const old = draft.relationChoices.get(id);
            if (button.dataset.source === 'none' || old === button.dataset.source)
            {
                geneoReviewUndoRecordRow(draft, id);
            }
            else
            {
                const targets = button.dataset.source === 'board' ? relation.ids.map(personId => [personId, geneoReviewRelativeTarget(draft, relation, personId)]) : [];
                if (targets.some(([personId, target]) => target && target !== 'create' && geneoReviewDuplicate(draft, personId, target)))
                {
                    draft.error = t('This Tree person is already represented on the board. Locate the existing person instead.');
                    geneoTreeImportRender();
                    return;
                }
                if (!draft.transferDirections) draft.transferDirections = new Map();
                if (draft.transferDirections.has(id) && draft.transferDirections.get(id) !== button.dataset.source) draft.transferTypes.set(id, geneoReviewRelationType(draft, relation, button.dataset.source));
                draft.transferDirections.set(id, button.dataset.source);
                draft.relationChoices.set(id, button.dataset.source);
                if (button.dataset.source === 'board')
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
                if (!draft.familyIds.has(family.id)) draft.familyIds.set(family.id, createRuntimeId('family'));
            if (!draft.people.some(item => item.id === draft.activePersonId)) draft.activePersonId = draft.anchorId;
        }
        else return;
        geneoTreeImportRender();
        if (button.hasAttribute('data-gr-link') || button.hasAttribute('data-gr-relative-search')) modal.querySelector('[data-gr-match-search]')?.focus();
        if (button.hasAttribute('data-gr-match')) modal.querySelector('[data-gr-link]')?.focus({ preventScroll: true });
        if (button.hasAttribute('data-gr-change-anchor')) modal.querySelector('[data-gr-board-query]')?.focus({ preventScroll: true });
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
        else if (event.target.hasAttribute('data-gr-board-query')) geneoTreeImportDraft.boardQuery = event.target.value;
        else if (event.target.hasAttribute('data-gr-match-search')) geneoTreeImportDraft.matchQueries.set(event.target.dataset.queryPerson || geneoTreeImportDraft.activePersonId, event.target.value);
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
        if (event.key === 'Escape' && geneoTreeImportDraft?.filterOpen)
        { event.preventDefault(); event.stopPropagation(); geneoTreeImportDraft.filterOpen = false; geneoTreeImportRender(); modal.querySelector('[data-gr-filter-toggle]')?.focus(); }
    });
    geneoTreeImportRender();
}
