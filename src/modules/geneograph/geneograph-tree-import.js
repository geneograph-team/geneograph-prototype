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
    if (plan.operations.some(operation => operation.personId === person.id || operation.ids?.includes(person.id)))
        return { key: 'staged', label: 'Changes selected', icon: icon.checklist };
    const choice = draft.choices.get(person.id);
    const tree = getPerson(choice);
    if (!tree || tree.deleted || tree.projectId !== draft.projectId)
        return { key: 'unlinked', label: person.treePersonId ? 'Tree record unavailable' : 'Not linked to Family Tree', icon: person.treePersonId ? icon.warning : icon.people };
    if (geneoTreeImportFields(person, tree).length || plan.relations.some(relation => relation.ids.includes(person.id) && plan.statuses.get(relation.id) !== 'Same relationship'))
        return { key: 'differences', label: 'Differences to review', icon: icon.checklist };
    return { key: 'linked', label: 'Linked to Family Tree', icon: icon.link };
}

function geneoReviewRoleText(draft, personId)
{
    const role = geneoReviewRoles(draft.diagram, draft.anchorId).get(personId);
    if (!role) return t('Other board people');
    if (!role.path.length) return '';
    return role.path.map(edge =>
    {
        const from = draft.people.find(person => person.id === edge.from);
        const singular = { Parents: 'Parent of', Partners: 'Partner of', Children: 'Child of', Siblings: 'Sibling of' }[edge.role];
        const qualifier = edge.qualifier && !['biological', 'Biological'].includes(edge.qualifier)
            ? `${t(PARENT_CHILD_RELATIONSHIP_TYPES.find(type => type.toLowerCase() === edge.qualifier.toLowerCase()) || (edge.qualifier === 'unknown' ? 'Unknown' : edge.qualifier))} · ` : '';
        return `${qualifier}${t(singular)} ${geneoPersonDisplayName(from)}`;
    }).join(' / ');
}

function geneoReviewRail(draft, plan)
{
    const roles = geneoReviewRoles(draft.diagram, draft.anchorId);
    const query = draft.search.trim().toLocaleLowerCase();
    const groups = ['Anchor person', 'Parents', 'Partners', 'Children', 'Siblings', 'Extended family', 'Other board people'];
    let count = 0;
    const rows = groups.map(group =>
    {
        const people = draft.people.filter(person =>
        {
            const role = roles.get(person.id)?.group || 'Other board people';
            const status = geneoReviewStatus(draft, person, plan);
            return role === group && (draft.scope === 'board' || roles.has(person.id))
                && (!query || `${geneoPersonDisplayName(person)} ${geneoPersonLifeDates(person)}`.toLocaleLowerCase().includes(query))
                && (draft.status === 'all' || draft.status === 'unlinked' && !plan.mapping.has(person.id)
                    || draft.status === 'differences' && (status.key === 'differences' || status.key === 'conflicts')
                    || draft.status === 'staged' && status.key === 'staged');
        });
        count += people.length;
        if (!people.length) return '';
        return `<section class="gr-rail-group"><h3>${escapeHtml(t(group === 'Anchor person' ? 'Selected person' : group))}</h3>${people.map(person =>
        {
            const status = geneoReviewStatus(draft, person, plan);
            return `<button type="button" class="gr-person ${draft.activePersonId === person.id ? 'is-selected' : ''}" data-gr-person="${escapeHtml(person.id)}" aria-current="${draft.activePersonId === person.id}">
                ${geneoReviewAvatar(person, true)}<span><strong title="${escapeHtml(geneoPersonDisplayName(person))}">${escapeHtml(geneoPersonDisplayName(person))}</strong><small>${escapeHtml(t(status.label))}</small></span><span class="gr-state ${status.key}" title="${escapeHtml(t(status.label))}" aria-hidden="true">${status.icon || icon.people}</span></button>`;
        }).join('')}</section>`;
    }).join('');
    return `<nav class="gr-rail" aria-label="${escapeHtml(t('People'))}"><h3 class="gr-branch-title">${escapeHtml(geneoReviewText('Family of {name}', { name: geneoPersonDisplayName(draft.people.find(person => person.id === draft.anchorId)) }))}</h3><div class="gr-scope" role="group" aria-label="${escapeHtml(t('Review scope'))}">
        ${geneoReviewButton('Family branch', 'data-gr-scope="branch"', draft.scope === 'branch')}${geneoReviewButton('Entire board', 'data-gr-scope="board"', draft.scope === 'board')}</div>
        <div class="gr-search-row"><input type="search" class="common-input" data-gr-search aria-label="${escapeHtml(t('Search board people'))}" placeholder="${escapeHtml(t('Search board people'))}" value="${escapeHtml(draft.search)}">
        <div class="gr-filter"><button type="button" class="icon-button ${draft.status !== 'all' ? 'active' : ''}" data-gr-filter-toggle aria-expanded="${Boolean(draft.filterOpen)}" aria-label="${escapeHtml(t('Filter review status'))}" title="${escapeHtml(t('Filter review status'))}">${icon.filter}</button>
        ${draft.filterOpen ? `<div class="gr-filter-menu" role="group" aria-label="${escapeHtml(t('Filter review status'))}">${[['all', 'All people'], ['unlinked', 'Not linked'], ['differences', 'With differences'], ['staged', 'With selected changes']].map(([key, label]) => geneoReviewButton(label, `data-gr-status="${key}"`, draft.status === key)).join('')}</div>` : ''}</div></div>
        ${draft.status !== 'all' ? `<button class="gr-filter-chip" type="button" data-gr-status="all" title="${escapeHtml(t('Clear status filter'))}" aria-label="${escapeHtml(t('Clear status filter'))}">${escapeHtml(t({ unlinked: 'Not linked', differences: 'With differences', staged: 'With selected changes' }[draft.status]))}${icon.close}</button>` : ''}
        <div class="gr-people-list">${rows}${!count ? `<p class="gr-muted">${escapeHtml(t('No people match these filters.'))}</p>` : ''}</div></nav>`;
}

function geneoReviewDuplicate(draft, personId, treeId)
{
    return draft.diagram.people.find(person => person.id !== personId
        && ((draft.choices.has(person.id) ? draft.choices.get(person.id) : person.treePersonId) === treeId
            || draft.identityTargets?.get(person.id) === treeId
            || [...(draft.relativeTargets || [])].some(([key, target]) => target === treeId && key.endsWith(`|${person.id}`))));
}

function geneoReviewCandidates(draft, person, relationId = '')
{
    if (draft.matchEditorOpenId !== person.id) return '';
    const query = draft.matchQueries.get(person.id) || '';
    const matches = geneoTreeImportMatches(person, draft.projectId, draft).filter(({ person: candidate, context }) =>
        !query || `${connectPersonName(candidate)} ${connectPersonLifeLine(candidate)} ${getPlaceEventDisplay(candidate.birth)} ${context.join(' ')}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
    return `<section class="gr-candidates"><label class="gr-label" for="grCandidateSearch">${escapeHtml(t('Link existing'))}</label><input id="grCandidateSearch" type="search" class="common-input" data-gr-match-search data-query-person="${escapeHtml(person.id)}" value="${escapeHtml(query)}" placeholder="${escapeHtml(t('Search by name, date, or place'))}">
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

function geneoReviewFactRows(draft, person, tree)
{
    const fields = geneoTreeImportFields(person, tree);
    const decisions = draft.fields.get(person.id) || new Map();
    const headings = `<h3>${escapeHtml(t('Facts'))}</h3>`;
    if (!fields.length) return `<section class="gr-section gr-facts">${headings}<p class="gr-muted">${escapeHtml(t('No fact differences'))}</p></section>`;
    return `<section class="gr-section gr-facts">${headings}
        ${fields.map(([key, label, boardValue, treeValue]) =>
        {
            const source = decisions.get(key);
            const from = source === 'board' ? person : tree;
            const clear = source && geneoReviewFactEmpty(geneoReviewFact(from, key));
            const transfer = direction =>
            {
                const text = `${t(label)}: ${t(direction === 'board' ? 'Copy to Family Tree' : 'Copy to board')}`;
                return `<button type="button" class="gr-transfer ${source === direction ? 'is-selected' : ''} ${direction === 'tree' ? 'is-left' : ''}" data-gr-fact="${key}" data-source="${direction}" aria-pressed="${source === direction}" aria-label="${escapeHtml(text)}" title="${escapeHtml(text)}">${icon.arrow}</button>`;
            };
            return `<div class="gr-fact"><h4>${escapeHtml(t(label))}</h4><div class="gr-values">
                <div class="gr-value ${source === 'tree' ? 'is-destination' : ''}">${source === 'tree' ? `<del>${escapeHtml(boardValue)}</del><strong>${escapeHtml(clear ? t('Empty') : treeValue)}</strong>` : `<span>${escapeHtml(boardValue)}</span>`}</div>
                <div class="gr-transfers">${transfer('board')}${transfer('tree')}</div>
                <div class="gr-value ${source === 'board' ? 'is-destination' : ''}">${source === 'board' ? `<del>${escapeHtml(treeValue)}</del><strong>${escapeHtml(clear ? t('Empty') : boardValue)}</strong>` : `<span>${escapeHtml(treeValue)}</span>`}</div></div>
                ${source ? `<div class="gr-result"><span>${escapeHtml(`${t(source === 'board' ? 'Family Tree' : 'On board')}: ${clear ? t('Clear value') : geneoReviewFactText(from, key)}`)}</span><button type="button" class="gr-reset-icon" data-gr-fact="${key}" data-source="none" title="${escapeHtml(t('Reset'))}" aria-label="${escapeHtml(t('Reset'))}">${icon.undo}</button></div>` : ''}</div>`;
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

function geneoReviewPrimaryRelation(draft, personId)
{
    return draft.relations.filter(relation => relation.ids.includes(personId)).sort((left, right) =>
    {
        const score = relation => (personId !== draft.anchorId && relation.ids.includes(draft.anchorId) ? 10 : 0)
            + (relation.type === 'child' && relation.ids.at(-1) === personId ? 3 : 0)
            + relation.ids.filter(id => id !== personId && !['skip', 'create', 'unlink'].includes(draft.choices.get(id))).length;
        return score(right) - score(left);
    })[0];
}

function geneoReviewRelationTitle(draft, relation)
{
    const name = id => geneoPersonDisplayName(geneoReviewPersonById(draft, id));
    if (relation.type === 'child') return `${name(relation.ids.at(-1))} · ${t('Child of')} ${relation.ids.slice(0, -1).map(name).join(` ${t('and')} `)}`;
    return `${relation.ids.map(name).join(` ${t('and')} `)} · ${t(relation.type === 'partner' ? 'Partners' : 'Siblings')}`;
}

function geneoReviewRelationDetail(draft, relation, source)
{
    if (relation.origin === 'tree' && source === 'board') return t('Not connected on board');
    if (relation.type === 'partner')
    {
        const family = relation.origin === 'tree' ? sampleData.families.find(item => item.id === relation.treeFamilyId)
            : source === 'board' ? draft.diagram.families.find(item => item.id === relation.familyId)
            : sampleData.families.find(item => item.projectId === draft.projectId && geneoReviewEqual(geneoReviewFamilyParents(item).sort(), relation.ids.map(id => draft.choices.get(id)).sort()));
        if (!family) return t('Not connected in Tree');
        const data = geneoReviewRelationshipData(family);
        const details = [t(data.relationshipType || 'Unknown relationship'), t(data.marriageType || ''), partnerRelationshipDateSummary(family).rangeLabel,
            ...data.events.map(event => event.placeText || getPlaceDisplay(event.placeId))];
        return details.filter(Boolean).join(' · ');
    }
    if (relation.type === 'sibling') return t('Choose the recorded parent family');
    if (relation.origin === 'tree')
    {
        const family = sampleData.families.find(item => item.id === relation.treeFamilyId);
        const treeIds = relation.treeIds || relation.ids.map(id => draft.choices.get(id));
        return [...new Set(treeIds.slice(0, -1).map(id => t(parentChildRelationshipType(family, id, treeIds.at(-1)))))].join(' / ');
    }
    const family = draft.diagram.families.find(item => item.id === relation.familyId);
    const child = family.children.find(item => item.personId === relation.ids.at(-1));
    return [...new Set(relation.ids.slice(0, -1).map(id => t(geneoReviewParentType(family, child, id) || 'Unavailable')))].join(' / ');
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
        if (operation.type === 'fact') return `<li><strong>${escapeHtml(t(operation.source === 'board' ? 'Family Tree' : 'On board'))}</strong> · ${escapeHtml(t(operation.label))}: ${escapeHtml(operation.clear ? t('Clear value') : operation.value)}</li>`;
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

function geneoReviewIdentityTransfer(draft, person, choice)
{
    let target = draft.identityTargets?.get(person.id) || (!['skip', 'unlink'].includes(choice) ? choice : '') || 'create';
    let candidate = target !== 'create' ? getPerson(target) : null;
    if (candidate?.deleted || candidate?.projectId !== draft.projectId) { target = 'create'; candidate = null; }
    const staged = choice === target && choice !== (person.treePersonId || 'skip');
    const transferLabel = target === 'create' ? t('Create {name} in Family Tree').replace('{name}', geneoPersonDisplayName(person))
        : t('Link to {name}').replace('{name}', connectPersonName(candidate));
    const search = `<button type="button" class="gr-record-search" data-gr-link aria-label="${escapeHtml(t('Search Family Tree'))}" title="${escapeHtml(t('Search Family Tree'))}">${icon.search}</button>`;
    const board = `<div class="gr-relative-cell"><div class="gr-identity-line">${geneoReviewIdentity(person, true)}<button type="button" class="gr-text gr-identity-action" data-gr-change-anchor aria-expanded="${Boolean(draft.changingAnchor)}">${icon.peoplegroup}${escapeHtml(t('Change person'))}</button></div>${person.id !== draft.anchorId ? `<p class="gr-person-role">${escapeHtml(geneoReviewRoleText(draft, person.id))}</p>` : ''}${draft.changingAnchor ? `<label class="gr-anchor-select">${escapeHtml(t('Choose person'))}<select class="common-select" data-gr-anchor-select>${draft.people.map(item => `<option value="${escapeHtml(item.id)}" ${item.id === draft.anchorId ? 'selected' : ''}>${escapeHtml(geneoPersonDisplayName(item))}</option>`).join('')}</select></label>` : ''}</div>`;
    const destination = candidate ? `<div class="gr-record-header">${geneoReviewIdentity(candidate)}${search}</div><div class="gr-record-actions"><button type="button" class="gr-text" data-gr-identity-new>${escapeHtml(t('Create a new person'))}</button></div>`
        : staged && choice === 'create' ? `<div class="gr-record-header">${geneoReviewIdentity(person, true)}${search}</div><span class="gr-record-type">${escapeHtml(t('New Tree person'))}</span>`
            : `<div class="gr-empty-destination"><button type="button" class="gr-empty-record gr-empty-transfer" data-gr-identity-transfer aria-label="${escapeHtml(transferLabel)}">${icon.plus}<span>${escapeHtml(t(person.treePersonId ? 'Tree record unavailable' : 'Not in the tree'))}</span></button>${search}</div>`;
    return `<div class="gr-identities gr-identity-comparison">${board}<div class="gr-transfers"><button type="button" class="gr-transfer ${staged ? 'is-selected' : ''}" data-gr-identity-transfer aria-pressed="${staged}" title="${escapeHtml(transferLabel)}" aria-label="${escapeHtml(transferLabel)}">${icon.arrow}</button>${staged ? `<button type="button" class="gr-text gr-transfer-undo" data-gr-identity-reset>${escapeHtml(t('Undo'))}</button>` : ''}</div><div class="gr-relative-cell ${staged ? 'is-destination' : ''}">${destination}${person.treePersonId ? `<button type="button" class="gr-text gr-identity-action" data-gr-unlink>${icon.unlink}${escapeHtml(t('Unlink'))}</button>` : ''}</div></div>`;
}

function geneoReviewPersonDetail(draft, plan)
{
    const person = draft.people.find(item => item.id === draft.activePersonId);
    if (!person) return '';
    const choice = draft.choices.get(person.id);
    const candidate = !['create', 'skip', 'unlink'].includes(choice) ? getPerson(choice) : null;
    const tree = candidate && !candidate.deleted && candidate.projectId === draft.projectId ? candidate : null;
    const original = getPerson(person.treePersonId);
    const canCreate = !original || original.deleted || original.projectId !== draft.projectId;
    const anchorReady = plan.mapping.has(draft.anchorId);
    const dependent = (draft.fields.get(person.id)?.size || 0) + draft.relations.filter(relation => relation.ids.includes(person.id) && draft.relationChoices.has(relation.id)).length;
    return `<div class="gr-detail"><button type="button" class="gr-text gr-back-list" data-gr-list>${escapeHtml(t('Back to people'))}</button>
        <div class="gr-comparison-head gr-global-columns"><span>${icon.whiteboard}${escapeHtml(t('On board'))}</span><span aria-hidden="true"></span><span>${icon.tree}${escapeHtml(t('Family Tree'))}</span></div>
        ${canCreate && choice !== 'unlink' ? geneoReviewIdentityTransfer(draft, person, choice) : `<div class="gr-identities"><div><div class="gr-identity-line">${geneoReviewIdentity(person, true)}<button type="button" class="gr-text gr-identity-action" data-gr-change-anchor aria-expanded="${Boolean(draft.changingAnchor)}">${icon.peoplegroup}${escapeHtml(t('Change person'))}</button></div>
        ${person.id !== draft.anchorId ? `<p class="gr-person-role">${escapeHtml(geneoReviewRoleText(draft, person.id))}</p>` : ''}
        ${draft.changingAnchor ? `<label class="gr-anchor-select">${escapeHtml(t('Choose person'))}<select class="common-select" data-gr-anchor-select>${draft.people.map(item => `<option value="${escapeHtml(item.id)}" ${item.id === draft.anchorId ? 'selected' : ''}>${escapeHtml(geneoPersonDisplayName(item))}</option>`).join('')}</select></label>` : ''}</div>
        <div><div class="gr-identity-line">${tree ? geneoReviewIdentity(tree) : `<p class="gr-muted">${escapeHtml(t(choice === 'unlink' ? 'Link will be removed' : choice === 'create' ? 'Will be created in Family Tree' : person.treePersonId ? 'Tree record unavailable' : 'Not linked to Family Tree'))}</p>`}
        <div class="gr-identity-actions"><button type="button" class="gr-text gr-identity-action" data-gr-link>${icon.edit}${escapeHtml(t(tree ? 'Change link' : 'Link existing'))}</button>${person.treePersonId && choice !== 'unlink' ? `<button type="button" class="gr-text gr-identity-action" data-gr-unlink>${icon.unlink}${escapeHtml(t('Unlink'))}</button>` : ''}</div></div>
        <div class="gr-actions">
        ${choice !== (person.treePersonId || 'skip') ? `<button type="button" class="gr-text" data-gr-identity-reset>${escapeHtml(t('Undo'))}</button>` : ''}</div></div></div>`}
        ${choice === 'unlink' ? `<p class="gr-muted">${escapeHtml(t('The Family Tree person and their relationships will not be deleted.'))}</p>${dependent ? `<button type="button" class="gr-choice" data-gr-discard-transfers>${escapeHtml(t('Remove this person’s selected transfers'))}</button>` : ''}` : ''}
        ${geneoReviewCandidates(draft, person)}
        ${tree && (anchorReady || person.id === draft.anchorId) ? geneoReviewFactRows(draft, person, tree) : ''}
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
    const expandedGroups = new Set([...modal.querySelectorAll('details[data-gr-relative-disclosure][open]')].map(element => element.dataset.grRelativeDisclosure));
    if (!draft.relationshipExpanded) draft.relationshipExpanded = new Map();
    modal.querySelectorAll('[data-gr-relationship-settings]').forEach(element => draft.relationshipExpanded.set(element.dataset.grRelationshipSettings, element.open));
    const body = modal.querySelector('[data-gr-body]');
    modal.classList.toggle('gr-mobile-detail', draft.mobileDetail);
    body.innerHTML = `${geneoReviewRail(draft, plan)}${geneoReviewPersonDetail(draft, plan)}`;
    modal.querySelectorAll('details[data-gr-relative-disclosure]').forEach(element =>
    {
        element.open = expandedGroups.has(element.dataset.grRelativeDisclosure) || Boolean(element.querySelector('.gr-error'));
    });
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
    modal.querySelector('[data-gr-refresh]').hidden = !plan.errors.some(error => error.message === t('A reviewed record changed. Refresh the review to keep your choices and compare the latest values.'));
    const counts = [['Create in Tree', 'person to create', 'people to create'], ['Link existing', 'person to link', 'people to link'], ['Unlink from Family Tree', 'person to unlink', 'people to unlink'], ['boardPerson', 'card to add', 'cards to add'], ['relationship', 'family connection', 'family connections'], ['fact', 'fact change', 'fact changes']]
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
        <div class="gr-errors"><span role="alert" data-gr-error></span><button type="button" class="gr-text" data-gr-refresh hidden>${escapeHtml(t('Refresh review'))}</button></div>
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
        if (button.hasAttribute('data-gr-change-anchor')) draft.changingAnchor = !draft.changingAnchor;
        else if (button.hasAttribute('data-gr-scope')) draft.scope = button.dataset.grScope;
        else if (button.hasAttribute('data-gr-status')) { draft.status = button.dataset.grStatus; draft.filterOpen = false; }
        else if (button.hasAttribute('data-gr-filter-toggle')) draft.filterOpen = !draft.filterOpen;
        else if (button.hasAttribute('data-gr-person') || button.hasAttribute('data-gr-locate'))
        {
            draft.activePersonId = button.dataset.grPerson || button.dataset.grLocate;
            draft.summaryOpen = false; draft.mobileDetail = true;
            if (button.hasAttribute('data-gr-locate')) { draft.scope = 'board'; draft.search = ''; draft.status = 'all'; }
        }
        else if (button.hasAttribute('data-gr-list')) draft.mobileDetail = false;
        else if (button.hasAttribute('data-gr-link')) draft.matchEditorOpenId = draft.matchEditorOpenId === person.id ? '' : person.id;
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
            if (!draft.identityTargets) draft.identityTargets = new Map();
            draft.identityTargets.set(person.id, 'create');
            draft.choices.set(person.id, 'skip');
            draft.fields.delete(person.id);
        }
        else if (button.hasAttribute('data-gr-identity-transfer'))
        {
            const target = draft.identityTargets?.get(person.id) || (!['skip', 'unlink'].includes(draft.choices.get(person.id)) ? draft.choices.get(person.id) : '') || 'create';
            const candidate = target !== 'create' ? getPerson(target) : null;
            if (target !== 'create' && (!candidate || candidate.deleted || candidate.projectId !== draft.projectId)) draft.error = t('Tree record unavailable');
            else if (target !== 'create' && geneoReviewDuplicate(draft, person.id, target)) draft.error = t('This Tree person is already represented on the board. Locate the existing person instead.');
            else
            {
                draft.choices.set(person.id, target);
                draft.fields.delete(person.id);
                draft.matchEditorOpenId = '';
            }
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
            draft.relations.filter(relation => relation.ids.includes(person.id)).forEach(relation => draft.relationChoices.delete(relation.id));
        }
        else if (button.hasAttribute('data-gr-identity-reset'))
        {
            draft.identityTargets?.delete(person.id);
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
                const original = getPerson(person.treePersonId);
                if (!original || original.deleted || original.projectId !== draft.projectId)
                {
                    if (!draft.identityTargets) draft.identityTargets = new Map();
                    draft.identityTargets.set(person.id, treeId);
                    draft.choices.set(person.id, 'skip');
                    draft.fields.delete(person.id);
                }
                else { geneoReviewUndoAutoRelation(draft, person.id); draft.choices.set(person.id, treeId); draft.fields.delete(person.id); }
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
        if (button.hasAttribute('data-gr-match')) modal.querySelector('[data-gr-identity-transfer]')?.focus({ preventScroll: true });
        if (button.hasAttribute('data-gr-person') || button.hasAttribute('data-gr-locate'))
        {
            modal.querySelector('.gr-detail')?.scrollTo(0, 0);
            const heading = modal.querySelector('.gr-detail h3');
            if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
        }
        if (button.hasAttribute('data-gr-list')) modal.querySelector('.gr-person.is-selected')?.scrollIntoView({ block: 'nearest' });
    });
    modal.addEventListener('input', event =>
    {
        if (event.target.hasAttribute('data-gr-search')) geneoTreeImportDraft.search = event.target.value;
        else if (event.target.hasAttribute('data-gr-match-search')) geneoTreeImportDraft.matchQueries.set(event.target.dataset.queryPerson || geneoTreeImportDraft.activePersonId, event.target.value);
        else return;
        geneoTreeImportRender();
    });
    modal.addEventListener('change', event =>
    {
        const draft = geneoTreeImportDraft;
        if (event.target.hasAttribute('data-gr-anchor-select'))
        { draft.anchorId = event.target.value; draft.activePersonId = event.target.value; draft.changingAnchor = false; draft.mobileDetail = true; }
        else if (event.target.hasAttribute('data-gr-sibling')) draft.siblingFamilies.set(event.target.dataset.grSibling, event.target.value);
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
