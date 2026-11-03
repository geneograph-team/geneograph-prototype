function openAddPhotosForPersonDraftModal(options = {})
{
    return rpOpenDraftPhotoPicker(options);
}

function openAddPhotosToPersonModal(personId)
{
    return rpOpenPersonPhotoPicker(personId);
}

function openPhotoLinkModal(options = {})
{
    return rpOpenPhotoLinkPicker(options);
}

function openConnectedFilesModal(options = {})
{
    return rpOpenFilePicker(options);
}

function openSourcesForTargetModal(options = {})
{
    return rpOpenSourcePicker(options);
}

function openNoteLinkPickerModal(options = {})
{
    return rpOpenNotePicker(options);
}

function openNotesPlacesModal(options = {})
{
    return rpOpenPlacePicker(options);
}

function rpOpenArchiveResourcePicker({ ownerType, ownerIds, entityType })
{
    const projectId = currentProjectId();
    const ids = archiveUniqueIds(ownerIds);
    const ownersValid = () => ids.length > 0 && ids.every(id =>
    {
        const record = archiveConnectionRecord(ownerType, id);
        return record && !record.deleted && record.projectId === projectId;
    });
    if (!ownersValid()) return null;
    const records = (archiveEntityConfig(entityType)?.records() || []).filter(record => record.projectId === projectId);
    const existing = records.filter(record => ids.every(id => archiveConnectionIds(ownerType, id, entityType).includes(record.id))).map(record => record.id);
    const partialIds = records.filter(record => !existing.includes(record.id) && ids.some(id => archiveConnectionIds(ownerType, id, entityType).includes(record.id))).map(record => record.id);
    const save = (selected, context = {}) =>
    {
        if (!ownersValid()) return false;
        const decisions = context.changes?.decisions || selected.filter(id => !existing.includes(id)).map(id => ({ id, linked: true }));
        return archiveSetConnectionsAtomically(ids.flatMap(ownerId => decisions.filter(choice =>
            archiveConnectionIds(ownerType, ownerId, entityType).includes(choice.id) !== choice.linked).map(choice =>
            ({ ownerType, ownerId, entityType, entityId: choice.id, shouldLink: choice.linked }))));
    };
    const afterSave = () => ownerType === 'file' ? finishArchiveBulkLinkAction(ids) : renderArchivePreservingSourceInspectorScroll();
    const subtitle = ids.length === 1 ? String(archiveConnectionRecord(ownerType, ids[0])?.name || archiveConnectionRecord(ownerType, ids[0])?.title || '')
        : rpText(`${ids.length} selected records`, `Выбрано записей: ${ids.length}`);
    const base = { projectId, subtitle, description: subtitle, onSave: save, afterSave, validate: ownersValid, partialIds };
    if (entityType === 'source') return rpOpenSourcePicker({ ...base, draftSourceIds: existing, onDraftSave: save });
    if (entityType === 'note') return rpOpenNotePicker({ ...base, existingNoteIds: existing });
    if (entityType === 'photo') return rpOpenPhotoLinkPicker({ ...base, existingPhotoIds: existing });
    if (entityType === 'file') return rpOpenFilePicker({ ...base, existingFileIds: existing });
    return rpOpenPlacePicker({ ...base, disableManage: true, linkContext: { projectId, subtitle,
        initialPlaceIds: existing, validate: ownersValid, onSave: save, afterSave } });
}

function rpText(english, russian)
{
    return state.language === 'ru' ? russian : english;
}

function rpInitMembershipPicker(modal)
{
    modal.classList.add('membership-picker');
    modal.querySelector('.modal-header h2').textContent = modal.classList.contains('note-collection-picker-modal')
        ? rpText('Manage collections', 'Коллекции заметки') : rpText('Manage albums', 'Альбомы фотографий');
    const browse = modal.querySelector('.album-picker-browse');
    const search = browse.querySelector('.album-picker-search');
    const input = search.querySelector('input');
    input.setAttribute('aria-label', t(input.placeholder));
    input.placeholder = rpText('Search', 'Поиск');
    search.querySelector('label')?.remove();
    const toolbar = document.createElement('div');
    toolbar.className = 'membership-picker-toolbar';
    browse.prepend(toolbar);
    toolbar.append(search, browse.querySelector('.album-picker-new-button'));
    browse.querySelector('.album-picker-results-head')?.remove();
    const heading = modal.querySelector('.modal-header h2');
    heading.tabIndex = -1;
    requestAnimationFrame(() => heading.focus({ preventScroll: true }));
}

function rpRefreshMembershipRows(host)
{
    host.querySelectorAll('.album-picker-result').forEach(row =>
    {
        const description = row.querySelector('.album-picker-description');
        const name = row.querySelector('strong');
        if (name) name.title = [name.textContent.trim(), description?.textContent.trim()].filter(Boolean).join('\n');
        if (description && description.textContent.trim() === t('No description')) description.remove();
        row.querySelector('.album-picker-meta')?.remove();
        row.classList.remove('is-complete');
        const checkbox = row.querySelector('input[type=checkbox]');
        if (checkbox) { checkbox.disabled = false; checkbox.setAttribute('aria-label', name?.textContent.trim() || ''); }
    });
}

function rpMembershipReturn(modal, { isCreating, isDirty, returnToResults })
{
    const requestReturn = () =>
    {
        if (!isCreating()) return true;
        const finish = () =>
        {
            returnToResults();
            modal.querySelector('.album-picker-new-button')?.focus({ preventScroll: true });
        };
        if (isDirty()) rpConfirmDiscard({ title: rpText('Discard changes?', 'Отменить изменения?'),
            message: rpText('The new album or collection has not been created.', 'Новый альбом или коллекция ещё не созданы.'), onDiscard: finish });
        else finish();
        return false;
    };
    modalBackdrop.beforeClose = requestReturn;
    return requestReturn;
}

function rpApplyConnectionChanges(currentIds, context = {})
{
    const result = new Set(currentIds || []);
    const changes = context.changes || context;
    if (Array.isArray(changes.decisions))
    {
        changes.decisions.forEach(({ id, linked }) => linked ? result.add(id) : result.delete(id));
    }
    else
    {
        (changes.removedIds || []).forEach(id => result.delete(id));
        (changes.addedIds || []).forEach(id => result.add(id));
    }
    return [...result];
}

function rpConfirmDiscard({ title, message, notice = '', onDiscard })
{
    openNestedModal(`<section class="modal rp-discard-modal" role="dialog" aria-modal="true" aria-labelledby="rpDiscardTitle"><header class="modal-header"><h2 id="rpDiscardTitle">${escapeHtml(title)}</h2></header><div class="modal-body"><p>${escapeHtml(message)}</p>${notice ? `<p>${escapeHtml(notice)}</p>` : ''}</div><footer class="modal-footer"><button type="button" class="button secondary" data-close>${rpText('Keep editing', 'Продолжить')}</button><button type="button" class="button danger" data-rp-discard>${rpText('Discard changes', 'Отменить изменения')}</button></footer></section>`);
    modalBackdrop.querySelector('[data-rp-discard]').addEventListener('click', () =>
    {
        closeModal({ force: true });
        onDiscard();
    });
}

function openResourcePicker(adapter, options = {})
{
    const esc = escapeHtml;
    const session = {
        adapter, options, projectId: adapter.projectId,
        existingIds: new Set(adapter.existingIds || []),
        selectedIds: new Set(adapter.existingIds || []),
        partialIds: new Set(adapter.partialIds || []), decisions: new Map(), createdIds: new Set(),
        scopeId: 'all', query: '', filters: {}, view: 'results', sort: 'name', browseSort: 'name', limit: adapter.kind === 'photos' ? 36 : 100,
        scrolls: new Map(), busy: false
    };
    const labels = {
        photos: [rpText('Add photos', 'Добавить фотографии'), rpText('Upload photos', 'Загрузить фото')],
        files: [rpText('Add files', 'Добавить файлы'), rpText('Upload files', 'Загрузить файлы')],
        notes: [rpText('Add notes', 'Добавить заметки'), rpText('New note', 'Новая заметка')],
        sources: [rpText('Add sources', 'Добавить источники'), rpText('New source', 'Новый источник')],
        places: [rpText('Add places', 'Добавить места'), rpText('New place', 'Новое место')]
    };
    const title = {
        photos: rpText('Manage photos', 'Связанные фотографии'), files: rpText('Manage files', 'Связанные файлы'),
        notes: rpText('Manage notes', 'Связанные заметки'), sources: rpText('Manage sources', 'Связанные источники'),
        places: rpText('Manage places', 'Связанные места')
    }[adapter.kind];
    const button = (action, contents, label, extra = '') => `<button type="button" class="icon-button" data-rp-action="${action}" aria-label="${esc(label)}" title="${esc(label)}" ${extra}>${contents || ''}</button>`;
    (options.modalOpener || openModal)(`<section class="modal resource-picker" role="dialog" aria-modal="true" data-resource-picker="${adapter.kind}" aria-label="${esc(title)}">
        <header class="modal-header"><div><h2 tabindex="-1" data-rp-heading>${esc(title)}</h2>${adapter.subtitle ? `<p title="${esc(adapter.subtitle)}">${esc(adapter.subtitle)}</p>` : ''}</div>${button('close', icon.close, rpText('Close', 'Закрыть'))}</header>
        <div class="rp-toolbar"><button type="button" class="button secondary" data-rp-action="browse">${icon.folder || ''}<span>${rpText('Browse', 'Обзор')}</span></button><label class="rp-search">${icon.search}<input type="search" data-rp-search aria-label="${esc(rpText('Search', 'Поиск'))}" placeholder="${esc(rpText('Search', 'Поиск'))}"></label>${button('filters', icon.filter || icon.settings, rpText('Filters', 'Фильтры'))}<select data-rp-sort aria-label="${esc(rpText('Sort', 'Сортировка'))}"><option value="name">${rpText('Name', 'Название')}</option><option value="updated">${rpText('Recently updated', 'Недавно изменённые')}</option>${adapter.kind === 'photos' ? `<option value="date">${rpText('Photo date', 'Дата фотографии')}</option>` : ''}<option value="relevance" hidden>${rpText('Relevance', 'По совпадению')}</option></select><button type="button" class="button secondary rp-create" data-rp-action="create">${icon.plus}<span>${labels[adapter.kind][1]}</span></button></div>
        <nav class="rp-path" aria-label="${esc(rpText('Location', 'Расположение'))}"></nav><div class="rp-error" role="alert" hidden></div>
        <div class="rp-content" tabindex="-1"></div>
        <footer class="modal-footer"><div class="rp-selection-summary"><button type="button" class="rp-selected" data-rp-action="selected"></button><span data-rp-changes></span></div><div class="rp-footer-actions"><button type="button" class="button secondary" data-rp-action="close">${rpText('Cancel', 'Отмена')}</button><button type="button" class="button primary" data-rp-action="save">${rpText('Save changes', 'Сохранить изменения')}</button><button type="button" class="button primary" data-rp-action="preview-transfer" hidden></button><button type="button" class="button secondary" data-rp-action="results" hidden>${rpText('Done', 'Готово')}</button></div><span class="sr-only" data-rp-live aria-live="polite"></span></footer>
    </section>`);
    const root = modalBackdrop.querySelector('[data-resource-picker]');
    const sortSelect = root.querySelector('[data-rp-sort]');
    const sortControl = document.createElement('div');
    sortControl.className = 'rp-sort';
    sortSelect.before(sortControl);
    sortControl.innerHTML = `${icon.sortLines}<span class="rp-sort-chevron" aria-hidden="true">${icon.chevron}</span>`;
    sortControl.append(sortSelect);
    sortSelect.hidden = true;
    const sortTrigger = document.createElement('button');
    sortTrigger.type = 'button';
    sortTrigger.className = 'rp-sort-trigger';
    sortTrigger.setAttribute('aria-haspopup', 'menu');
    sortTrigger.setAttribute('aria-expanded', 'false');
    sortControl.append(sortTrigger);
    sortTrigger.addEventListener('click', () =>
    {
        if (sortTrigger.getAttribute('aria-expanded') === 'true') { closeMenu(); return; }
        closeMenu();
        const menu = document.createElement('div');
        menu.id = 'projectMenu';
        menu.className = 'menu-popover rp-sort-menu';
        menu.setAttribute('role', 'menu');
        menu.setAttribute('aria-label', rpText('Sort', 'Сортировка'));
        menu.innerHTML = [...sortSelect.options].filter(option => !option.hidden).map(option => `<button type="button" role="menuitemradio" aria-checked="${option.selected}" data-sort-value="${option.value}"><span>${esc(option.textContent)}</span><span aria-hidden="true">${option.selected ? icon.check : ''}</span></button>`).join('');
        modalBackdrop.append(menu);
        const rect = sortTrigger.getBoundingClientRect();
        menu.style.left = `${Math.max(12, Math.min(rect.left, innerWidth - menu.offsetWidth - 12))}px`;
        menu.style.top = `${rect.bottom + menu.offsetHeight + 6 < innerHeight ? rect.bottom + 6 : Math.max(12, rect.top - menu.offsetHeight - 6)}px`;
        menu.addEventListener('click', event =>
        {
            const option = event.target.closest('[data-sort-value]');
            if (!option) return;
            sortSelect.value = option.dataset.sortValue;
            sortSelect.dispatchEvent(new Event('change', { bubbles: true }));
            closeMenu();
            sortTrigger.focus({ preventScroll: true });
        });
        bindMenuLifecycle(sortTrigger);
        menu.querySelector('[aria-checked="true"]')?.focus();
    });
    root.querySelector('[data-rp-action="filters"]').setAttribute('aria-haspopup', 'dialog');
    root.querySelector('[data-rp-action="filters"]').setAttribute('aria-expanded', 'false');
    session.root = root;
    const content = root.querySelector('.rp-content');
    const records = () => adapter.records().filter(Boolean);
    const idOf = record => String(adapter.id ? adapter.id(record) : record.id);
    const scopes = () => adapter.scopes?.(session) || [{ id: 'all', label: rpText('All items', 'Все записи') }];
    const key = () => `${session.view}:${session.scopeId}:${session.query}`;
    const remember = () => session.scrolls.set(key(), content.scrollTop);
    const switchView = view =>
    {
        const previous = session.view;
        remember();
        session.view = view;
        session.render();
        const returnButton = previous === 'preview' && view === 'results'
            ? [...root.querySelectorAll('[data-rp-action]')].find(button => button.dataset.rpAction === `preview:${session.previewId}`) : null;
        (returnButton || content).focus({ preventScroll: true });
    };
    const lookup = id => records().find(record => idOf(record) === id);
    const norm = value => String(value || '').normalize('NFKD').toLocaleLowerCase(state.language === 'ru' ? 'ru' : 'en');
    session.error = message =>
    {
        const field = root.querySelector('.rp-error');
        field.textContent = message || '';
        field.hidden = !message;
    };
    session.selectCreated = ids =>
    {
        ids.forEach(id =>
        {
            session.selectedIds.add(String(id));
            session.decisions.set(String(id), true);
            session.createdIds.add(String(id));
        });
        session.view = 'results';
        session.scrolls.set(key(), 0);
        session.render();
        content.scrollTop = 0;
        root.querySelector('[data-rp-live]').textContent = ['photos', 'files'].includes(adapter.kind)
            ? rpText('Uploaded items selected', 'Загруженные материалы выбраны') : rpText('Created item selected', 'Созданная запись выбрана');
    };
    session.openEditor = (launch, editorOptions = {}) =>
    {
        remember();
        const opener = html =>
        {
            openNestedModal(html);
            const editor = modalBackdrop.querySelector('.modal');
            editor?.classList.add('resource-picker-editor-modal');
            if (editorOptions.primaryLabel)
            {
                const submit = editor?.querySelector('button[type="submit"]');
                if (submit) submit.textContent = editorOptions.primaryLabel === 'Create and select'
                    ? rpText('Create', 'Создать') : editorOptions.primaryLabel === 'Upload and select'
                        ? rpText('Upload', 'Загрузить') : t(editorOptions.primaryLabel);
            }
            return editor;
        };
        return launch(opener);
    };
    session.openForm = (html, bind, editorOptions) => session.openEditor(opener =>
    {
        const editor = opener(html);
        bind?.(editor);
        return editor;
    }, editorOptions);
    const toggle = id =>
    {
        const linked = session.partialIds.has(id) && !session.decisions.has(id) ? true : !session.selectedIds.has(id);
        if (linked) session.selectedIds.add(id);
        else session.selectedIds.delete(id);
        session.decisions.set(id, linked);
        remember();
        session.render();
        [...root.querySelectorAll('[data-rp-check]')].find(field => field.dataset.rpCheck === id)?.focus({ preventScroll: true });
        root.querySelector('[data-rp-live]').textContent = `${rpText('Selected', 'Выбрано')}: ${session.selectedIds.size}`;
    };
    const rowHtml = record =>
    {
        const id = idOf(record);
        const detail = adapter.describe(record, session);
        const name = detail.title || adapter.name(record);
        const selected = session.selectedIds.has(id);
        const uploaded = ['photos', 'files'].includes(adapter.kind) && session.createdIds.has(id);
        return `<article class="rp-record ${selected ? 'is-selected' : ''}"><label class="rp-record-select">${detail.imageHtml ? `<div class="rp-thumbnail">${detail.imageHtml}</div>` : `<span class="rp-record-icon">${detail.icon || icon[adapter.kind.slice(0, -1)] || icon.file || ''}</span>`}<span class="rp-record-copy"><span class="rp-record-title"><strong title="${esc(name)}">${esc(name)}</strong>${uploaded ? `<span class="rp-uploaded-marker">${rpText('Uploaded', 'Загружено')}</span>` : ''}</span>${detail.description ? `<span class="rp-description">${esc(detail.description)}</span>` : ''}${detail.meta ? `<small>${esc(detail.meta)}</small>` : ''}</span><input type="checkbox" data-rp-check="${esc(id)}" value="${esc(id)}" aria-label="${esc(name)}" ${selected ? 'checked' : ''}></label>${adapter.preview ? button(`preview:${id}`, icon.eye || icon.search, `${rpText('Preview', 'Просмотр')}: ${name}`) : ''}</article>`;
    };
    const emptyHtml = () =>
    {
        const searching = Boolean(session.query.trim() || Object.values(session.filters).some(Boolean));
        const allLinked = adapter.mode !== 'manage' && records().length > 0 && records().every(record => session.existingIds.has(idOf(record)));
        const headings = {
            photos: rpText('No photos yet', 'Фотографий пока нет'),
            files: rpText('No files here yet', 'Файлов пока нет'),
            notes: rpText('No notes here yet', 'Заметок пока нет'),
            sources: rpText('No sources here yet', 'Источников пока нет'),
            places: rpText('No places here yet', 'Мест пока нет')
        };
        const heading = session.view === 'selected' ? rpText('Nothing selected', 'Ничего не выбрано')
            : searching ? rpText('No matches found', 'Ничего не найдено')
                : allLinked ? rpText('Everything here is already linked', 'Все записи уже связаны') : headings[adapter.kind];
        const description = searching ? rpText('Try another search or clear the filters.', 'Измените запрос или сбросьте фильтры.')
            : allLinked ? rpText('Choose another location or create a new record.', 'Выберите другой раздел или создайте запись.')
                : rpText('Browse another location or add a new item.', 'Выберите другой раздел или создайте запись.');
        return `<div class="rp-empty"><h3>${heading}</h3><p>${description}</p><button type="button" class="button secondary" data-rp-action="${session.view === 'selected' ? 'results' : searching ? 'clear-filters' : 'create'}">${session.view === 'selected' ? rpText('Done', 'Готово') : searching ? rpText('Clear search and filters', 'Сбросить поиск и фильтры') : labels[adapter.kind][1]}</button></div>`;
    };
    const results = () =>
    {
        const query = norm(session.query).trim();
        let items = records();
        if (session.view === 'selected') return items.filter(record => session.selectedIds.has(idOf(record)) || session.decisions.has(idOf(record)) || session.partialIds.has(idOf(record)));
        items = items.filter(record => (!adapter.matchesScope || adapter.matchesScope(record, session.scopeId, session))
            && (!adapter.matchesFilters || adapter.matchesFilters(record, session.filters, session))
            && (!query || query.split(/\s+/).every(word => norm(adapter.searchText?.(record) || adapter.name(record)).includes(word))));
        items.sort((a, b) =>
        {
            if (session.sort === 'relevance' && query)
            {
                const difference = Number(adapter.rank?.(b, query, session) || 0) - Number(adapter.rank?.(a, query, session) || 0);
                if (difference) return difference;
            }
            if (session.sort === 'updated' || session.sort === 'date')
            {
                const get = session.sort === 'date' ? adapter.dateValue : record => adapter.updated?.(record) || record.updatedAt || '';
                const difference = String(get?.(b) || '').localeCompare(String(get?.(a) || ''));
                if (difference) return difference;
            }
            return adapter.name(a).localeCompare(adapter.name(b), state.language === 'ru' ? 'ru' : 'en', { numeric: true });
        });
        return items;
    };
    session.getChanges = () =>
    {
        const choices = new Map(session.decisions);
        session.selectedIds.forEach(id => { if (!session.existingIds.has(id)) choices.set(id, true); });
        session.existingIds.forEach(id => { if (!session.selectedIds.has(id)) choices.set(id, false); });
        const decisions = [...choices].filter(([id, linked]) => session.partialIds.has(id) || linked !== session.existingIds.has(id))
            .map(([id, linked]) => ({ id, linked }));
        return { addedIds: decisions.filter(choice => choice.linked).map(choice => choice.id),
            removedIds: decisions.filter(choice => !choice.linked).map(choice => choice.id), decisions };
    };
    const closeFilters = () =>
    {
        root.querySelector('.rp-filter-panel')?.remove();
        session.filterOpen = false;
        root.querySelector('[data-rp-action="filters"]').setAttribute('aria-expanded', 'false');
    };
    const openFilters = () =>
    {
        if (session.filterOpen) { closeFilters(); return; }
        session.filterOpen = true;
        session.filterDraft = { ...session.filters };
        const panel = document.createElement('section');
        panel.className = 'rp-filter-panel';
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-label', rpText('Filters', 'Фильтры'));
        panel.innerHTML = `<h3>${rpText('Filters', 'Фильтры')}</h3><div class="rp-filters">${(adapter.filters?.(session) || []).map(field =>
            `<label class="field ${field.type === 'checkbox' ? 'rp-filter-checkbox' : ''}">${field.type === 'checkbox'
                ? `<input type="checkbox" data-rp-filter="${esc(field.key)}" ${session.filters[field.key] ? 'checked' : ''}>${esc(field.label)}`
                : `<span>${esc(field.label)}</span>${field.type === 'select'
                    ? `<select class="input" data-rp-filter="${esc(field.key)}">${field.options.map(option => `<option value="${esc(option.value)}" ${String(session.filters[field.key] || '') === String(option.value) ? 'selected' : ''}>${esc(option.label)}</option>`).join('')}</select>`
                    : `<input class="input" type="date" data-rp-filter="${esc(field.key)}" value="${esc(session.filters[field.key] || '')}">`}`}</label>`).join('')}</div>
            <p class="rp-filter-error" role="alert" hidden></p><div class="rp-filter-actions"><button type="button" class="button secondary" data-rp-action="reset-filters">${rpText('Clear filters', 'Сбросить фильтры')}</button><button type="button" class="button secondary" data-rp-action="close-filters">${rpText('Done', 'Готово')}</button></div>`;
        root.append(panel);
        const trigger = root.querySelector('[data-rp-action="filters"]');
        const bounds = root.getBoundingClientRect();
        const target = trigger.getBoundingClientRect();
        panel.style.top = `${target.bottom - bounds.top + 8}px`;
        panel.style.right = `${Math.max(12, Math.min(bounds.width - 340, bounds.right - target.right))}px`;
        panel.style.maxHeight = `${Math.max(180, bounds.bottom - target.bottom - 100)}px`;
        trigger.setAttribute('aria-expanded', 'true');
        panel.querySelector('input,select,button')?.focus({ preventScroll: true });
    };
    const requestClose = () =>
    {
        if (session.busy) return false;
        if (session.filterOpen) { closeFilters(); return false; }
        if (session.view !== 'results') { switchView('results'); return false; }
        if (!session.getChanges().decisions.length) return true;
        rpConfirmDiscard({ title: rpText('Discard connection changes?', 'Отменить изменения связей?'),
            message: rpText('Your connection changes have not been saved.', 'Изменения связей ещё не сохранены.'),
            notice: session.createdIds.size ? rpText('New resources will remain in the project.', 'Новые материалы останутся в проекте.') : '',
            onDiscard: () => closeModal({ force: true }) });
        return false;
    };
    session.render = () =>
    {
        root.setAttribute('aria-busy', String(session.busy));
        root.querySelectorAll('button,input,select').forEach(control => { control.disabled = session.busy; });
        root.dataset.view = session.view;
        root.querySelector('.rp-toolbar').hidden = session.view === 'preview';
        const searchField = root.querySelector('[data-rp-search]');
        if (searchField.value !== session.query) searchField.value = session.query;
        const sortField = root.querySelector('[data-rp-sort]');
        sortField.querySelector('[value="relevance"]').hidden = !session.query.trim();
        sortField.value = session.sort;
        sortTrigger.textContent = sortField.selectedOptions[0]?.textContent || '';
        sortTrigger.setAttribute('aria-label', `${rpText('Sort', 'Сортировка')}: ${sortTrigger.textContent}`);
        const allScopes = scopes();
        const currentScope = allScopes.find(scope => scope.id === session.scopeId) || allScopes[0];
        const ancestors = [];
        let parent = currentScope?.parentId;
        const seen = new Set();
        while (parent && !seen.has(parent))
        {
            seen.add(parent);
            const scope = allScopes.find(item => item.id === parent);
            if (!scope) break;
            ancestors.unshift(scope);
            parent = scope.parentId;
        }
        if (session.scopeId !== 'all' && !ancestors.some(scope => scope.id === 'all')) ancestors.unshift(allScopes[0]);
        const path = root.querySelector('.rp-path');
        path.hidden = session.view !== 'results';
        path.title = [...ancestors.filter(Boolean), currentScope].filter(Boolean).map(scope => scope.label).join(' / ');
        path.innerHTML = `<span class="rp-path-icon" aria-hidden="true">${adapter.kind === 'files' ? icon.folderyellow : adapter.kind === 'places' ? icon.mapPin : icon.folder}</span>${ancestors.filter(Boolean).map(scope => `<button type="button" data-rp-scope="${esc(scope.id)}" title="${esc(scope.label)}">${esc(scope.label)}</button><span aria-hidden="true">${icon.chevron}</span>`).join('')}<span aria-current="page" title="${esc(currentScope?.label || '')}">${esc(currentScope?.label || '')}</span>`;
        if (session.view === 'browse')
        {
            content.innerHTML = `<h3 class="rp-view-heading">${rpText('Browse', 'Обзор')}</h3><div class="rp-scopes">${allScopes.map(scope => `<button type="button" data-rp-scope="${esc(scope.id)}" class="rp-scope ${scope.id === session.scopeId ? 'is-selected' : ''}" ${scope.parentId ? 'style="padding-left:32px"' : ''}>${scope.icon || icon.folder || ''}<span>${esc(scope.label)}</span>${icon.chevron}</button>`).join('')}</div>`;
        }
        else if (session.view === 'filters')
        {
            content.innerHTML = `<div class="rp-filters">${(adapter.filters?.(session) || []).map(field => `<label>${field.type === 'checkbox' ? `<input type="checkbox" data-rp-filter="${esc(field.key)}" ${session.filters[field.key] ? 'checked' : ''}>${esc(field.label)}` : `<span>${esc(field.label)}</span>${field.type === 'select' ? `<select data-rp-filter="${esc(field.key)}">${field.options.map(option => `<option value="${esc(option.value)}" ${String(session.filters[field.key] || '') === String(option.value) ? 'selected' : ''}>${esc(option.label)}</option>`).join('')}</select>` : `<input type="date" data-rp-filter="${esc(field.key)}" value="${esc(session.filters[field.key] || '')}">`}`}</label>`).join('')}<button type="button" class="button secondary" data-rp-action="clear-filters">${rpText('Clear filters', 'Сбросить фильтры')}</button><button type="button" class="button primary" data-rp-action="results">${rpText('Show results', 'Показать результаты')}</button></div>`;
        }
        else if (session.view === 'preview')
        {
            const record = lookup(session.previewId);
            content.innerHTML = record ? `<div class="rp-preview">${adapter.preview(record, session)}</div>` : `<div class="rp-empty">${rpText('This item is no longer available.', 'Запись больше недоступна.')}</div>`;
            if (record) adapter.bindPreview?.(content, record, session);
        }
        else
        {
            const uploads = session.view === 'results' && ['photos', 'files'].includes(adapter.kind)
                ? records().filter(record => session.createdIds.has(idOf(record))) : [];
            const items = results().filter(record => !uploads.some(upload => idOf(upload) === idOf(record)));
            const folders = adapter.kind === 'files' && !session.query.trim() && !Object.values(session.filters).some(Boolean) && session.view === 'results'
                ? allScopes.filter(scope => scope.parentId === session.scopeId) : [];
            const folderHtml = folders.length ? `<div class="rp-scopes">${folders.map(scope => `<button type="button" class="rp-scope" data-rp-scope="${esc(scope.id)}">${icon.folder}<span>${esc(scope.label)}</span>${icon.chevron}</button>`).join('')}</div>` : '';
            const groupedPlaces = adapter.kind === 'places' && session.scopeId === 'all' && !session.query.trim() && session.view === 'results';
            if (groupedPlaces) items.sort((a, b) => placeCountry(a).localeCompare(placeCountry(b), state.language === 'ru' ? 'ru' : 'en'));
            const visible = items.slice(0, session.limit);
            let rows = visible.map(rowHtml).join('');
            if (adapter.kind === 'places' && session.scopeId === 'all' && !session.query.trim() && session.view === 'results')
            {
                const groups = new Map();
                visible.forEach(record =>
                {
                    const country = placeCountry(record);
                    const key = !country || country === 'Other places' ? rpText('Other places', 'Другие места') : country;
                    if (!groups.has(key)) groups.set(key, []);
                    groups.get(key).push(record);
                });
                rows = [...groups].sort(([a], [b]) => a.localeCompare(b, state.language === 'ru' ? 'ru' : 'en'))
                    .map(([country, group]) => `<h3 class="rp-country-heading">${esc(country)}</h3>${group.map(rowHtml).join('')}`).join('');
            }
            const uploadHtml = uploads.length ? `<section class="rp-uploaded-group" aria-label="${rpText('Uploaded', 'Загружено')}"><h3 class="rp-uploaded-heading">${rpText('Uploaded', 'Загружено')}</h3><div class="rp-results ${adapter.kind === 'photos' ? 'rp-photo-grid' : ''}">${uploads.map(rowHtml).join('')}</div></section>` : '';
            content.innerHTML = uploadHtml + folderHtml + (items.length ? `<div class="rp-results ${adapter.kind === 'photos' ? 'rp-photo-grid' : ''}">${rows}</div>${items.length > session.limit ? `<button type="button" class="button secondary rp-load-more" data-rp-action="more">${rpText('Load more', 'Показать ещё')}</button>` : ''}` : folders.length || uploads.length ? '' : emptyHtml());
        }
        content.scrollTop = session.scrolls.get(key()) || 0;
        content.querySelectorAll('img').forEach(image => { image.loading = 'lazy'; image.decoding = 'async'; });
        content.querySelectorAll('[data-rp-check]').forEach(input =>
        {
            input.indeterminate = session.partialIds.has(input.dataset.rpCheck) && !session.decisions.has(input.dataset.rpCheck);
        });
        const changes = session.getChanges();
        const summary = root.querySelector('.rp-selection-summary');
        summary.hidden = ['preview', 'browse'].includes(session.view);
        root.querySelector('.rp-selected').innerHTML = `${rpText('Selected', 'Выбрано')} (${session.selectedIds.size}) ${icon.chevron}`;
        root.querySelector('.rp-selected').disabled = !session.selectedIds.size && !changes.decisions.length && !session.partialIds.size;
        root.querySelector('[data-rp-changes]').textContent = changes.decisions.length
            ? rpText(`${changes.addedIds.length} to connect · ${changes.removedIds.length} to disconnect`, `Добавить: ${changes.addedIds.length} · Убрать: ${changes.removedIds.length}`) : '';
        const save = root.querySelector('[data-rp-action="save"]');
        save.disabled = session.busy || !changes.decisions.length;
        save.hidden = session.view !== 'results';
        root.querySelector('.rp-footer-actions [data-rp-action="close"]').hidden = session.view === 'selected';
        root.querySelector('.rp-footer-actions [data-rp-action="results"]').hidden = session.view !== 'selected';
        const transfer = root.querySelector('[data-rp-action="preview-transfer"]');
        transfer.hidden = session.view !== 'preview';
        transfer.textContent = session.selectedIds.has(session.previewId) ? rpText('Disconnect', 'Убрать связь') : rpText('Connect', 'Связать');
        root.querySelector('[data-rp-action="filters"]').classList.toggle('is-active', Object.values(session.filters).some(Boolean));
        if (session.busy) root.querySelectorAll('button,input,select').forEach(control => { control.disabled = true; });
    };
    session.refresh = session.render;
    root.addEventListener('change', event =>
    {
        if (event.target.matches('[data-rp-check]')) toggle(event.target.dataset.rpCheck);
        if (event.target.matches('[data-rp-filter]'))
        {
            session.filterDraft[event.target.dataset.rpFilter] = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
            const invalid = session.filterDraft.dateFrom && session.filterDraft.dateTo && session.filterDraft.dateFrom > session.filterDraft.dateTo;
            const error = root.querySelector('.rp-filter-error');
            error.hidden = !invalid;
            error.textContent = invalid ? rpText('The end date must not be before the start date.', 'Конечная дата не может быть раньше начальной.') : '';
            if (!invalid)
            {
                session.filters = { ...session.filterDraft };
                session.render();
            }
        }
        if (event.target.matches('[data-rp-sort]'))
        {
            session.sort = event.target.value;
            if (!session.query.trim()) session.browseSort = session.sort;
            session.render();
        }
    });
    root.querySelector('[data-rp-search]').addEventListener('input', event =>
    {
        const hadQuery = Boolean(session.query.trim());
        session.query = event.target.value;
        session.view = 'results'; session.limit = adapter.kind === 'photos' ? 36 : 100;
        if (!session.query.trim()) session.sort = session.browseSort;
        else if (!hadQuery) session.sort = 'relevance';
        const sort = root.querySelector('[data-rp-sort]');
        sort.querySelector('[value="relevance"]').hidden = !session.query.trim();
        sort.value = session.sort;
        session.render();
    });
    root.addEventListener('click', async event =>
    {
        const scope = event.target.closest('[data-rp-scope]');
        if (scope) { remember(); session.scopeId = scope.dataset.rpScope; session.view = 'results'; session.render(); return; }
        const action = event.target.closest('[data-rp-action]')?.dataset.rpAction;
        if (!action) return;
        if (action.startsWith('preview:')) { closeFilters(); session.previewId = action.slice(8); switchView('preview'); }
        else if (action === 'close' && !session.busy) closeModal();
        else if (action === 'preview-transfer') { toggle(session.previewId); switchView('results'); }
        else if (action === 'filters') openFilters();
        else if (action === 'close-filters') { closeFilters(); root.querySelector('[data-rp-action="filters"]').focus(); }
        else if (['browse', 'selected', 'results'].includes(action)) { closeFilters(); switchView(session.view === action && action !== 'results' ? 'results' : action); }
        else if (action === 'more') { remember(); session.limit += adapter.kind === 'photos' ? 36 : 100; session.render(); }
        else if (action === 'reset-filters')
        {
            session.filters = {};
            closeFilters();
            session.render();
            openFilters();
        }
        else if (action === 'clear-filters')
        {
            session.filters = {};
            session.filterDraft = {};
            const reopen = session.filterOpen;
            closeFilters();
            session.query = '';
            session.sort = session.browseSort;
            root.querySelector('[data-rp-search]').value = '';
            root.querySelector('[data-rp-sort]').value = session.browseSort;
            root.querySelector('[data-rp-sort] [value="relevance"]').hidden = true;
            switchView('results');
            if (reopen) openFilters();
        }
        else if (action === 'create') adapter.create?.(session);
        else if (action === 'manage') adapter.manage?.(session);
        else if (action === 'save' && !session.busy)
        {
            const valid = adapter.validate?.(session);
            if (currentProjectId() !== session.projectId || valid === false || typeof valid === 'string') { session.error(typeof valid === 'string' ? valid : rpText('The destination is no longer available.', 'Место назначения больше недоступно.')); return; }
            const ids = [...session.selectedIds];
            const changes = session.getChanges();
            if (changes.addedIds.some(id => !lookup(id))) { session.error(rpText('An item is no longer available. Review your selection.', 'Запись больше недоступна. Проверьте выбор.')); return; }
            session.busy = true; session.render();
            try
            {
                const result = await adapter.commit(ids, { session, mode: 'manage', existingIds: [...session.existingIds], changes });
                if (result === false || result === null || result?.ok === false)
                {
                    if (!result?.cancelled) session.error(result?.message || rpText('Could not save the links. Please try again.', 'Не удалось сохранить связи. Повторите попытку.'));
                    else requestAnimationFrame(() => root.querySelector('[data-rp-action="save"]').focus());
                }
                else { closeModal({ force: true }); adapter.afterCommit?.(ids, result, session); }
            }
            catch (error) { session.error(error.message || rpText('Could not save the links.', 'Не удалось сохранить связи.')); }
            finally { session.busy = false; session.render(); }
        }
    });
    root.addEventListener('pointerdown', event =>
    {
        if (session.filterOpen && !event.target.closest('.rp-filter-panel,[data-rp-action="filters"]')) closeFilters();
    });
    modalBackdrop.beforeClose = requestClose;
    session.render();
    requestAnimationFrame(() => root.querySelector('[data-rp-heading]')?.focus({ preventScroll: true }));
    return session;
}
