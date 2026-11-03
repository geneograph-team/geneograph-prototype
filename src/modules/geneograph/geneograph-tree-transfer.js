let geneoBoardChooserDraft = null;

function geneoBoardHasTreePerson(board, personId)
{
    return (board.diagram?.people || []).some(person => person.treePersonId === personId
        && (board.diagram?.nodes || []).some(node => node.type === 'person' && node.personId === person.id));
}

function openGeneographBoardChooser(personIds)
{
    const projectId = currentProjectId();
    const ids = [...new Set(personIds || [])].filter(id =>
    {
        const person = getPerson(id);
        return person && !person.deleted && person.projectId === projectId;
    });
    if (!projectId || !ids.length) return;

    geneoBoardChooserDraft = { projectId, personIds: ids, boardId: '', query: '', includeArchived: false, createOpen: false, newTitle: '' };
    const description = state.language === 'ru'
        ? ids.length === 1 ? `Добавить ${connectPersonName(getPerson(ids[0]))} на холст Генеографа.` : `Добавить выбранных людей (${ids.length}) на холст Генеографа.`
        : `Add ${ids.length === 1 ? connectPersonName(getPerson(ids[0])) : `${ids.length} selected people`} to a Geneograph board.`;
    openModal(`<div class="modal geneo-transfer-modal geneo-board-chooser-modal" role="dialog" aria-modal="true" aria-labelledby="geneoBoardChooserTitle">
        <div class="modal-header"><div><h2 id="geneoBoardChooserTitle">Choose a board</h2><p>${escapeHtml(description)}</p></div><button class="close-button" type="button" data-close aria-label="Close">${icon.close}</button></div>
        <div class="geneo-transfer-body"><div class="geneo-transfer-search"><label for="geneoBoardSearch">Search boards</label><div class="search-input">${icon.search}<input id="geneoBoardSearch" type="search" autocomplete="off" placeholder="Search boards" data-geneo-board-search></div></div>
          <label class="geneo-transfer-check"><input type="checkbox" data-geneo-include-archived> Include archived boards</label><div class="geneo-transfer-list" role="radiogroup" aria-label="Boards" data-geneo-board-list></div>
          <button class="geneo-transfer-create-toggle" type="button" data-geneo-toggle-create aria-expanded="false" aria-controls="geneoTransferCreate">${icon.plus}<span>Create new board</span>${icon.chevron}</button>
          <div class="geneo-transfer-create" id="geneoTransferCreate" hidden><label for="geneoNewBoardName">Board name</label><input id="geneoNewBoardName" class="geneo-input" type="text" maxlength="120" placeholder="Board name" autocomplete="off"></div></div>
        <div class="modal-footer"><span class="geneo-transfer-announcement" data-geneo-board-summary aria-live="polite"></span><button class="button secondary" type="button" data-close>Cancel</button><button class="button primary" type="button" data-geneo-add-to-board disabled>Add to board</button></div>
      </div>`);

    const modal = modalBackdrop.querySelector('.geneo-transfer-modal');
    const search = modal.querySelector('[data-geneo-board-search]');
    const list = modal.querySelector('[data-geneo-board-list]');
    const add = modal.querySelector('[data-geneo-add-to-board]');
    const createToggle = modal.querySelector('[data-geneo-toggle-create]');
    const createPanel = modal.querySelector('#geneoTransferCreate');
    const nameInput = modal.querySelector('#geneoNewBoardName');
    const summary = modal.querySelector('[data-geneo-board-summary]');
    const syncAction = () =>
    {
        const draft = geneoBoardChooserDraft;
        if (!draft) return;
        createPanel.hidden = !draft.createOpen;
        createToggle.setAttribute('aria-expanded', String(draft.createOpen));
        createToggle.classList.toggle('active', draft.createOpen);
        const board = !draft.createOpen ? getGeneographBoard(draft.boardId, { projectId: draft.projectId }) : null;
        const present = board ? draft.personIds.filter(id => geneoBoardHasTreePerson(board, id)).length : 0;
        const missing = board ? draft.personIds.length - present : 0;
        add.textContent = draft.createOpen ? t('Create and add') : board && !missing ? t('Open board') : t('Add to board');
        add.disabled = draft.createOpen ? !draft.newTitle.trim() : !board;
        summary.textContent = draft.createOpen ? t('Create and add')
            : board ? `${add.textContent}: ${board.title}` : t('Select a board');
    };
    const renderList = () =>
    {
        const draft = geneoBoardChooserDraft;
        if (!draft) return;
        const boards = getProjectBoards(draft.projectId, { includeArchived: draft.includeArchived })
            .filter(board => board.title.toLowerCase().includes(draft.query.toLowerCase()));
        list.innerHTML = boards.length ? boards.map(board =>
        {
            const present = draft.personIds.filter(id => geneoBoardHasTreePerson(board, id)).length;
            const missing = draft.personIds.length - present;
            const status = missing
                ? state.language === 'ru' ? `Добавить: ${missing}${present ? ` · Уже на холсте: ${present}` : ''}` : `${missing} ${missing === 1 ? 'person' : 'people'} to add${present ? ` · ${present} already on board` : ''}`
                : t(draft.personIds.length === 1 ? 'Already on this board' : 'All selected people are on this board');
            return `<label class="geneo-transfer-choice ${draft.boardId === board.id && !draft.createOpen ? 'selected' : ''}"><span class="geneo-transfer-preview" aria-hidden="true">${renderGeneographBoardPreview(board, 'square')}</span><span class="geneo-transfer-copy"><strong title="${escapeHtml(board.title)}">${escapeHtml(board.title)}</strong><small>${board.archived ? `${escapeHtml(t('Archived board'))} · ` : ''}${escapeHtml(status)}</small></span><input type="radio" name="geneoBoardChoice" value="${escapeHtml(board.id)}" ${draft.boardId === board.id && !draft.createOpen ? 'checked' : ''} aria-label="${escapeHtml(`${board.title}, ${status}`)}"></label>`;
        }).join('') : '<p class="geneo-transfer-empty">No boards found. Create one below.</p>';
        localizeUI(list);
        if (!draft.createOpen && !boards.some(board => board.id === draft.boardId)) draft.boardId = '';
        syncAction();
    };
    search.addEventListener('input', () => { geneoBoardChooserDraft.query = search.value.trim(); renderList(); });
    modal.querySelector('[data-geneo-include-archived]').addEventListener('change', event => { geneoBoardChooserDraft.includeArchived = event.target.checked; renderList(); });
    list.addEventListener('change', event => { if (event.target.name === 'geneoBoardChoice') { geneoBoardChooserDraft.boardId = event.target.value; geneoBoardChooserDraft.createOpen = false; renderList(); list.querySelector(`input[value="${CSS.escape(event.target.value)}"]`)?.focus(); } });
    createToggle.addEventListener('click', () =>
    {
        geneoBoardChooserDraft.createOpen = !geneoBoardChooserDraft.createOpen;
        renderList();
        if (geneoBoardChooserDraft.createOpen) nameInput.focus();
    });
    nameInput.addEventListener('input', () => { geneoBoardChooserDraft.newTitle = nameInput.value; syncAction(); });
    nameInput.addEventListener('keydown', event => { if (event.key === 'Enter' && !add.disabled) { event.preventDefault(); add.click(); } });
    add.addEventListener('click', () =>
    {
        if (!geneoBoardChooserDraft.createOpen) { geneoAddPeopleToBoard(geneoBoardChooserDraft.boardId); return; }
        const title = geneoBoardChooserDraft.newTitle.trim();
        if (!title) { nameInput.focus(); return; }
        if (currentProjectId() !== projectId || geneoBoardChooserDraft.personIds.some(id =>
        {
            const person = getPerson(id);
            return !person || person.deleted || person.projectId !== projectId;
        })) { showToast('The selected people are no longer available.'); return; }
        const now = new Date().toISOString();
        const board = { id: createRuntimeId('board'), projectId, title, description: '', collectionIds: [], modified: 'Just now', modifiedAt: now, createdAt: now, favorite: false, archived: false, diagram: createEmptyGeneographDiagram() };
        sampleData.boards.unshift(board);
        geneoAddPeopleToBoard(board.id);
    });
    renderList();
    search.focus();
}

function geneoAddPeopleToBoard(boardId)
{
    const draft = geneoBoardChooserDraft;
    const board = draft && getGeneographBoard(boardId, { projectId: draft.projectId });
    if (!board || currentProjectId() !== draft.projectId) return;
    const people = draft.personIds.map(id => getPerson(id));
    if (people.some(person => !person || person.deleted || person.projectId !== board.projectId)) return;

    closeModal();
    navigateToProjectModule(board.projectId, 'Geneograph');
    openGeneographBoard(board.id);
    const diagram = selectedGeneographDiagram();
    const existing = people.map(person => geneoBoardRepresentationForTreePerson(person.id));
    const addedCount = existing.filter(entry => !entry.person || !entry.node).length;
    const needsChange = addedCount > 0;
    if (needsChange) geneoPushHistory();
    const nodes = people.map(person =>
    {
        let { person: boardPerson, node } = geneoBoardRepresentationForTreePerson(person.id);
        if (!boardPerson)
        {
            boardPerson = createGeneographLinkedBoardPerson(person, board.projectId);
            diagram.people.push(boardPerson);
        }
        if (!node)
        {
            node = createGeneographPersonNodeForBoardPerson(boardPerson);
        }
        return node;
    }).filter(Boolean);
    if (needsChange) touchGeneographBoard(board);
    if (nodes.length)
    {
        setGeneographNodeSelection(nodes.map(node => node.id), nodes[0].id);
        renderGeneographEditorPreserveCenter(geneoNodeCenter(nodes[0]));
    }
    geneoBoardChooserDraft = null;
    showToast(needsChange ? `${addedCount} ${addedCount === 1 ? 'person' : 'people'} added to board.` : t('Board opened.'));
}
