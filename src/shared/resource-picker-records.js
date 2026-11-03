/* Record adapters share the picker session; creation never commits associations. */
const rpRecordRecentPlaces = new Map();

function rpRecordIds(values)
{
    return [...new Set((values || []).filter(Boolean))];
}

function rpRecordProjectValid(projectId)
{
    return Boolean(projectId && validProjectById(projectId)
        && currentProjectId() === projectId);
}

function rpRecordUnavailable()
{
    return rpText('The connected record is no longer available.', 'Связанная запись больше недоступна.');
}

function rpRecordFailure(result)
{
    return result === false || result === null || result?.ok === false;
}

/* Callers use domain setters; never roll back unrelated project state. */
function rpRecordTransaction(save)
{
    const result = save();
    return result && typeof result.then === 'function'
        ? result.then(value => value === undefined ? true : value)
        : result === undefined ? true : result;
}

function rpRecordDecisions(ids, context = {})
{
    if (Array.isArray(context.changes?.decisions)) return context.changes.decisions;
    const selected = new Set(ids);
    return [...rpRecordIds([...(context.existingIds || []), ...ids])]
        .map(id => ({ id, linked: selected.has(id) }));
}

function rpRecordApplyChanges(currentIds, ids, context)
{
    return context?.changes ? rpApplyConnectionChanges(currentIds, context) : rpRecordIds(ids);
}

function rpRecordPreview(title, lines, body = '')
{
    return `<section><h3>${escapeHtml(title || '')}</h3>${lines.filter(Boolean)
        .map(line => `<p>${escapeHtml(line)}</p>`).join('')}${body}</section>`;
}

function rpCreateNoteForm(session, projectId)
{
    const label = (en, ru) => escapeHtml(rpText(en, ru));
    session.openForm(`
        <div class="modal" role="dialog" aria-modal="true" aria-labelledby="rpNoteCreateTitle">
          <form data-rp-note-form>
            <div class="modal-header"><h2 id="rpNoteCreateTitle">${label('Create note', 'Создать заметку')}</h2>
              <button type="button" class="close-button" data-close aria-label="${label('Close', 'Закрыть')}">${icon.close}</button></div>
            <div class="modal-body form-grid" style="display:flex;flex-direction:column;min-height:0">
              <div class="field"><label for="rpNoteTitle">${label('Title', 'Название')}</label><input class="input" id="rpNoteTitle" name="title" required maxlength="500" autocomplete="off"></div>
              <div class="field rp-note-body-field" style="display:flex;flex:1;flex-direction:column;min-height:0"><label for="rpNoteBody">${label('Note body', 'Текст заметки')}</label>
                ${typeof window.Quill === 'function' ? renderRichTextToolbar({ id: 'rpNoteToolbar', ariaLabel: rpText('Note formatting', 'Форматирование заметки') }) : ''}
                <div data-rp-note-rich hidden style="flex:1;min-height:180px"></div><textarea class="input" style="flex:1" id="rpNoteBody" name="body" rows="10"></textarea></div>
              <p data-rp-note-error role="alert" hidden></p>
            </div>
            <div class="modal-footer"><button type="button" class="button secondary" data-close>${label('Cancel', 'Отмена')}</button>
              <button type="submit" class="button primary">${label('Create', 'Создать')}</button></div>
          </form>
        </div>`, root =>
    {
        const form = root.querySelector('[data-rp-note-form]');
        const body = form.elements.body;
        let editor = null;
        if (typeof window.Quill === 'function')
        {
            const host = root.querySelector('[data-rp-note-rich]');
            host.hidden = false;
            editor = new window.Quill(host, { theme: 'snow', modules: { toolbar: root.querySelector('#rpNoteToolbar') } });
            editor.root.setAttribute('aria-label', rpText('Note body', 'Текст заметки'));
            body.hidden = true;
        }
        let saved = false;
        if (typeof modalBackdrop !== 'undefined') modalBackdrop.beforeClose = () =>
        {
            if (saved || !(form.elements.title.value || (editor ? editor.getText().trim() : body.value))) return true;
            rpConfirmDiscard({ title: rpText('Discard note draft?', 'Отменить черновик заметки?'),
                message: rpText('This note has not been created.', 'Эта заметка ещё не создана.'),
                onDiscard: () => closeModal({ force: true }) });
            return false;
        };
        form.addEventListener('submit', event =>
        {
            event.preventDefault();
            if (!form.reportValidity()) return;
            if (!rpRecordProjectValid(projectId))
            {
                const error = root.querySelector('[data-rp-note-error]');
                error.textContent = rpRecordUnavailable();
                error.hidden = false;
                return;
            }
            const delta = editor ? normalizeRichTextDelta(editor.getContents()) : null;
            const note = createCentralNote({ projectId, title: form.elements.title.value.trim(),
                contextType: '', contextId: '', collectionIds: [], inheritActiveContext: false,
                inheritActiveCollection: false, activate: false, renderAfterCreate: false,
                focusTitleAfterCreate: false, showCreatedToast: false });
            if (!note) return;
            note.body = delta ? plainTextFromRichTextDelta(delta) : body.value;
            note.bodyDelta = delta;
            note.bodyFormat = delta ? 'quill-delta-v1' : '';
            saved = true;
            session.selectCreated([note.id]);
            closeModal();
        });
    }, { primaryLabel: 'Create' });
}

function rpOpenNotePicker(options = {})
{
    const projectId = options.projectId || currentProjectId();
    if (!rpRecordProjectValid(projectId) || typeof options.onSave !== 'function') return null;
    const excluded = new Set(options.excludeNoteIds || []);
    const connectedIds = new Set(options.existingNoteIds || []);
    const records = () => (sampleData.notes || []).filter(note => note.projectId === projectId
        && !note.deleted && !excluded.has(note.id) && (options.includeArchived || !note.archived || connectedIds.has(note.id)));
    const collections = () => (sampleData.noteCollections || []).filter(collection => collection.projectId === projectId && !collection.deleted);
    const adapter = {
        kind: 'notes', projectId, title: options.title || 'Add notes',
        subtitle: options.targetLabel ? localizedDataFieldValue(options.targetLabel) : options.description ? t(options.description) : '',
        existingIds: rpRecordIds(options.existingNoteIds), partialIds: options.partialIds || [], mode: 'manage', records,
        name: note => localizedDataFieldValue(note.title) || rpText('Untitled note', 'Без названия'),
        searchText: note => noteSearchText(note),
        scopes: () => [{ id: 'all', label: rpText('All notes', 'Все заметки') },
            ...collections().map(collection => ({ id: `collection:${collection.id}`, label: localizedDataFieldValue(collection.name) })),
            { id: 'unfiled', label: rpText('Unfiled', 'Без коллекции') }],
        matchesScope: (note, scopeId) => scopeId === 'all' || (scopeId === 'unfiled'
            ? !(note.collectionIds || []).some(id => collections().some(collection => collection.id === id))
            : (note.collectionIds || []).includes(scopeId.slice('collection:'.length))),
        filters: () => [{ key: 'favorite', label: rpText('Favorites only', 'Только избранные'), type: 'checkbox' },
            ...(options.includeArchived ? [{ key: 'archived', label: rpText('Include archived', 'Включая архивные'), type: 'checkbox' }] : [])],
        matchesFilters: (note, values) => Boolean((!values.favorite || note.favorite) && (!note.archived || connectedIds.has(note.id) || (options.includeArchived && values.archived))),
        describe: (note, session) => ({ title: adapter.name(note),
            description: localizedNoteBodyText(note.body || '').replace(/\s+/g, ' ').slice(0, 160),
            meta: [note.archived ? rpText('Archived', 'В архиве') : '',
                session.scopeId === 'all' ? collections().filter(collection => (note.collectionIds || []).includes(collection.id))
                    .map(collection => localizedDataFieldValue(collection.name)).join(', ') : ''].filter(Boolean).join(' · '),
            icon: icon.note }),
        rank: (note, query, session) => Number(options.getSuggestionScore?.(note, query, session) || 0),
        preview: note => `<article class="rp-note-preview"><h3>${escapeHtml(adapter.name(note))}</h3><div class="rp-note-prose">${renderRichTextDeltaHtml(note.bodyDelta, localizedNoteBodyText(note.body || ''))}</div></article>`,
        create: session => rpCreateNoteForm(session, projectId),
        validate: () => rpRecordProjectValid(projectId) || rpRecordUnavailable(),
        commit: (ids, context = {}) =>
        {
            const available = new Set(records().map(note => note.id));
            if (!rpRecordProjectValid(projectId) || (context.changes?.addedIds || ids).some(id => !available.has(id))) return false;
            if (options.validate && options.validate() !== true) return false;
            return rpRecordTransaction(() => options.onSave(ids, context));
        },
        afterCommit: (ids, result, session) =>
        {
            options.afterSave?.();
            const changes = session?.getChanges?.();
            const message = changes?.removedIds.length ? rpText('Connections updated.', 'Связи обновлены.') : typeof options.successMessage === 'function'
                ? options.successMessage(Number.isFinite(result?.addedLinkCount) ? result.addedLinkCount : changes?.addedIds.length ?? ids.length)
                : options.successMessage;
            if (message) showToast(message);
        }
    };
    return openResourcePicker(adapter, options);
}

function rpOpenSourcePicker(options = {})
{
    const projectId = options.projectId || currentProjectId();
    const draftMode = Array.isArray(options.draftSourceIds);
    const target = () => sourceTargetRecord(options.targetType, options.targetId, projectId);
    if (!rpRecordProjectValid(projectId) || (!draftMode && !target()) || (draftMode && typeof options.onDraftSave !== 'function')) return null;
    const records = () => (sampleData.sources || []).filter(source => source.projectId === projectId && !source.deleted);
    const existing = () => draftMode ? options.draftSourceIds : sourceIdsForTarget(options.targetType, options.targetId, projectId);
    const provider = source => String(source.providedBy || '').trim();
    const adapter = {
        kind: 'sources', projectId, title: options.title || 'Add sources',
        subtitle: !draftMode && target() ? localizedDataFieldValue(connectedSourceTargetLabel(options.targetType, target()))
            : options.subtitle ? t(options.subtitle) : rpText('Connect existing sources to this record.', 'Свяжите источники с этой записью.'),
        existingIds: rpRecordIds(existing()), partialIds: options.partialIds || [], records, mode: 'manage',
        name: source => localizedDataFieldValue(source.title) || rpText('Untitled source', 'Источник без названия'),
        searchText: source => [source.title, provider(source), source.location, source.reference, source.notes, source.url,
            localizedSourceCategoryLabel(source.category, '')].filter(Boolean).join(' '),
        scopes: () => [{ id: 'all', label: rpText('All sources', 'Все источники') },
            ...SOURCE_CATEGORIES.map(category => ({ id: category.value, label: t(category.shortLabel || category.label) })),
            { id: 'uncategorized', label: rpText('Uncategorized', 'Без категории') }],
        matchesScope: (source, scopeId) => scopeId === 'all' || (scopeId === 'uncategorized'
            ? !SOURCE_CATEGORIES.some(category => category.value === source.category) : source.category === scopeId),
        filters: () => [{ key: 'provider', label: rpText('Provider', 'Поставщик'), type: 'select',
            options: [{ value: '', label: rpText('All providers', 'Все поставщики') },
                ...[...new Set(records().map(provider).filter(Boolean))].sort().map(value => ({ value, label: value }))] },
            { key: 'favorite', label: rpText('Favorites only', 'Только избранные'), type: 'checkbox' }],
        matchesFilters: (source, values) => Boolean((!values.provider || provider(source) === values.provider) && (!values.favorite || source.favorite)),
        describe: source => ({ title: adapter.name(source), description: provider(source) === String(source.title || '').trim() ? '' : provider(source),
            meta: [localizedSourceCategoryLabel(source.category, ''), source.reference].filter(Boolean).join(' · '), icon: icon.source || icon.archive }),
        preview: source =>
        {
            const fields = [[rpText('Provider', 'Поставщик'), provider(source)], [rpText('Location', 'Местоположение'), source.location], [rpText('Reference', 'Шифр'), source.reference], ['URL', source.url]];
            const rows = fields.filter(([, value]) => value && value !== source.title).map(([label, value]) =>
            {
                let validUrl = false;
                try { validUrl = label === 'URL' && ['http:', 'https:'].includes(new URL(value).protocol); } catch (_) { /* Plain text reference. */ }
                return `<dt>${escapeHtml(label)}</dt><dd>${validUrl ? `<a href="${escapeHtml(value)}" target="_blank" rel="noopener noreferrer">${escapeHtml(value)}</a>` : escapeHtml(value)}</dd>`;
            }).join('');
            return `<article class="rp-source-preview"><header><span aria-hidden="true">${icon.source || icon.archive}</span><div><h3>${escapeHtml(adapter.name(source))}</h3><p>${escapeHtml(localizedSourceCategoryLabel(source.category, ''))}</p></div></header>${rows ? `<dl>${rows}</dl>` : ''}${source.notes ? `<section><h4>${rpText('Notes', 'Заметки')}</h4><p>${escapeHtml(source.notes)}</p></section>` : ''}</article>`;
        },
        create: session => session.openEditor(modalOpener => openArchiveSourceModal('', {
            modalOpener, targetProjectId: projectId, onCreated: source => session.selectCreated([source.id])
        }), { primaryLabel: 'Create' }),
        validate: () => (rpRecordProjectValid(projectId) && (draftMode || target()?.projectId === projectId)) || rpRecordUnavailable(),
        commit: (ids, context = {}) =>
        {
            const available = new Set(records().map(source => source.id));
            if (adapter.validate() !== true || (context.changes?.addedIds || ids).some(id => !available.has(id))) return false;
            return rpRecordTransaction(() =>
            {
                if (options.validate && options.validate() !== true) return false;
                if (draftMode) return options.onDraftSave(ids, context);
                const next = rpRecordApplyChanges(existing(), ids, context);
                const saved = setSourceIdsForTarget(options.targetType, options.targetId, next, { projectId });
                return Array.isArray(saved) && saved.length === next.length && next.every(id => saved.includes(id));
            });
        },
        afterCommit: () =>
        {
            options.afterSave?.();
            if (!draftMode)
            {
                showToast(rpText('Source links updated.', 'Связи с источниками обновлены.'));
            }
        }
    };
    return openResourcePicker(adapter, options);
}

/* Owners with existing getters/setters can reuse the place adapter without new saved fields. */
function rpCreatePlaceOwnerContext({ projectId = currentProjectId(), getRecord, getIds,
    setIds, title = 'Add places', subtitle = '', suggestedPlaceIds = [], afterSave, renderContext } = {})
{
    const record = getRecord?.();
    if (!record || record.projectId !== projectId || typeof setIds !== 'function') return null;
    return { projectId, title, subtitle, initialPlaceIds: rpRecordIds(getIds(record)), suggestedPlaceIds,
        getPlaceIds: () => { const current = getRecord(); return current ? rpRecordIds(getIds(current)) : []; },
        validate: () => Boolean(getRecord() && getRecord().projectId === projectId && !getRecord().deleted),
        onSave: ids =>
        {
            const current = getRecord();
            return current && current.projectId === projectId && !current.deleted ? setIds(current, ids) : false;
        }, afterSave, renderContext };
}

function rpOpenPlacePicker(options = {})
{
    const context = options.linkContext || null;
    const noteId = options.noteId || state.selectedNoteId;
    const note = () => getNote(noteId, { includeArchived: true, projectId });
    const projectId = context?.projectId || options.projectId
        || getNote(noteId, { includeArchived: true })?.projectId || currentProjectId();
    if (!rpRecordProjectValid(projectId) || (!context && !note())) return null;
    const mode = 'manage';
    const records = () => projectPlaces(projectId).filter(place => !place.deleted && place.projectId === projectId);
    const existing = () => rpRecordIds(context ? context.getPlaceIds?.() || context.initialPlaceIds : note()?.linkedPlaceIds);
    const suggested = () => new Set(context ? context.suggestedPlaceIds || [] : notesSuggestedPlaceIds(note()));
    const names = place => [place.name, placePrimaryName(place), placeSecondaryName(place), ...placeAlternativeNames(place)].filter(Boolean);
    const recent = () => rpRecordRecentPlaces.get(projectId) || [];
    const adapter = {
        kind: 'places', projectId, title: options.title || context?.title || (mode === 'manage' ? 'Manage places' : 'Add places'),
        subtitle: options.subtitle || context?.subtitle || localizedDataFieldValue(note()?.title || ''),
        existingIds: existing(), partialIds: options.partialIds || context?.partialIds || [], mode, records, name: place => placePrimaryName(place),
        searchText: place => [...names(place), place.country, place.region, place.city, place.address].filter(Boolean).join(' '),
        scopes: () => [{ id: 'all', label: rpText('All places', 'Все места') },
            { id: 'contextSuggested', label: rpText('Suggested places', 'Предлагаемые места') },
            { id: 'recent', label: rpText('Recent places', 'Недавние места') }],
        matchesScope: (place, scopeId) => scopeId === 'all' || (scopeId === 'contextSuggested' ? suggested().has(place.id) : scopeId === 'recent' && recent().includes(place.id)),
        filters: () => [{ key: 'coordinates', label: rpText('With coordinates', 'С координатами'), type: 'checkbox' }],
        matchesFilters: (place, values) => !values.coordinates || Boolean(normalizePlaceCoordinates(place)),
        rank: (place, query) =>
        {
            const normalized = normalizePlaceLookupText(query);
            if (!normalized) return suggested().has(place.id) ? 1 : 0;
            const candidates = names(place).map(normalizePlaceLookupText);
            return candidates.some(name => name === normalized) ? 3 : candidates.some(name => name.startsWith(normalized)) ? 2
                : candidates.some(name => name.includes(normalized)) ? 1 : 0;
        },
        describe: (place, session) => ({ title: placePrimaryName(place), description: placeSecondaryName(place),
            meta: session.query ? placeAlternativeNames(place).filter(name => normalizePlaceLookupText(name).includes(normalizePlaceLookupText(session.query))).join(', ') : '',
            icon: icon.mapPin }),
        create: session =>
        {
            if (!rpRecordProjectValid(projectId)) return session.error(rpRecordUnavailable());
            const previousSelectedPlaceId = state.selectedPlaceId;
            session.openEditor(modalOpener => openPlaceModal(null, { modalOpener,
                completion: { onComplete: place =>
                {
                    state.selectedPlaceId = previousSelectedPlaceId;
                    if (place?.projectId === projectId && !place.deleted) session.selectCreated([place.id]);
                }, onCancel: () => { state.selectedPlaceId = previousSelectedPlaceId; } }
            }), { primaryLabel: 'Create' });
        },
        validate: () => (rpRecordProjectValid(projectId) && (context
            ? typeof context.onSave === 'function' && (!context.validate || context.validate() === true)
            : Boolean(note() && !note().deleted && note().projectId === projectId))) || rpRecordUnavailable(),
        commit: (ids, commitContext = {}) =>
        {
            const available = new Set(records().map(place => place.id));
            if (adapter.validate() !== true || (commitContext.changes?.addedIds || ids).some(id => !available.has(id))) return false;
            const next = rpRecordApplyChanges(existing(), ids, commitContext);
            return rpRecordTransaction(() =>
            {
                if (context) return context.onSave(next, commitContext);
                const saved = setNoteEntityLinks(noteId, 'place', next, { projectId });
                const linked = note()?.linkedPlaceIds || [];
                return saved !== false && next.length === linked.length && next.every(id => linked.includes(id));
            });
        },
        afterCommit: (ids, result, session) =>
        {
            rpRecordRecentPlaces.set(projectId, rpRecordIds([...ids, ...recent()]).slice(0, 20));
            if (context) (context.afterSave || context.renderContext)?.();
            else (options.renderContext || renderNotesPreservingInteraction)();
            options.afterSave?.(ids, result, session);
            showToast(context?.successMessage || rpText('Place links updated.', 'Связи с местами обновлены.'));
        }
    };
    const session = openResourcePicker(adapter, options);
    if (session && (Array.isArray(options.selectedIds) || options.query))
    {
        const allowed = new Set(records().map(place => place.id));
        if (Array.isArray(options.selectedIds)) session.selectedIds = new Set(options.selectedIds.filter(id => allowed.has(id)
            && (mode === 'manage' || !session.existingIds.has(id))));
        session.query = String(options.query || '');
        session.render();
    }
    return session;
}

function rpOpenManagePlaces(options = {})
{
    return rpOpenPlacePicker({ ...options, mode: 'manage', title: options.manageTitle || 'Manage places' });
}
