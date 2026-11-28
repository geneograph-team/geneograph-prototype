function archiveDateValue(value)
{
    if (value && typeof value === 'object') return genealogyDateSortValue(value);
    if (!value) return 0;
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

function archiveFormatDate(value, fallback = 'Unknown')
{
    if (value && typeof value === 'object') return formatGenealogyDateLabel(value) || t(fallback);
    const parsed = Date.parse(value || '');
    if (!Number.isFinite(parsed)) return value || fallback;
    return new Intl.DateTimeFormat(state.language === 'ru' ? 'ru' : 'en-US', {
        year: 'numeric', month: 'short', day: 'numeric'
    }).format(new Date(parsed));
}

function archiveUniqueIds(values)
{
    return [...new Set((values || []).filter(Boolean))];
}

function restoreModalChoiceFocus({
    modal,
    selector,
    value,
    index = 0,
    fallbackSelector = 'input[type="search"]'
})
{
    requestAnimationFrame(() =>
    {
        const choices = [
            ...(
                modal?.querySelectorAll(
                    selector
                ) || []
            )
        ].filter(choice =>
            !choice.disabled
        );

        const matchingChoice =
            choices.find(choice =>
                choice.value === value
            );

        const nextChoice =
            matchingChoice
          || choices[
              Math.min(
                  Math.max(index, 0),
                  Math.max(choices.length - 1, 0)
              )
          ];

        if (nextChoice)
        {
            nextChoice.focus();
            return;
        }

        modal
            ?.querySelector(
                fallbackSelector
            )
            ?.focus();
    });
}

function archiveEventLabel(event)
{
    if (!event) return t('Event');
    const people = (event.personIds || []).map(id => formatPersonFullName(getPerson(id))).filter(Boolean);
    return [translateText(event.title || event.type || 'Event'), people.join(' & ')].filter(Boolean).join(' · ');
}

function archiveEventMeta(event)
{
    const date = event ? formatGenealogyDateLabel(event) : '';
    const place = getPlaceDisplay(event?.placeId) || event?.placeText || '';
    return [date, place].filter(Boolean).join(' · ') || translateText(event?.description || 'Genealogy event');
}

function archiveNoteIdsForFile(file)
{
    const reciprocal = (sampleData.notes || [])
        .filter(note => (note.linkedArchiveFileIds || []).includes(file.id))
        .map(note => note.id);
    return archiveUniqueIds([...(file.linkedNoteIds || []), ...reciprocal]);
}

function archiveNoteIdsForSource(
    source
)
{
    return source
        ? sourceTargetIds(
            source.id,
            'note',
            source.projectId
        )
        : [];
}

function archiveFilesForSource(
    sourceId
)
{
    const source =
        archiveSourceById(
            sourceId
        );

    if (!source)
    {
        return [];
    }

    return sourceTargetIds(
        source.id,
        'file',
        source.projectId
    )
        .map(fileId =>
            archiveFileById(
                fileId,
                source.projectId
            )
        )
        .filter(Boolean);
}

function archiveConnectionIds(
    ownerType,
    ownerId,
    entityType
)
{
    if (ownerType === 'file')
    {
        const file =
            archiveFileById(
                ownerId
            );

        if (!file)
        {
            return [];
        }

        if (entityType === 'person')
        {
            return file.linkedPersonIds || [];
        }

        if (entityType === 'event')
        {
            return file.linkedEventIds || [];
        }

        if (entityType === 'note')
        {
            return archiveNoteIdsForFile(
                file
            );
        }

        if (entityType === 'place')
        {
            return archiveFilePlaceIds(file);
        }

        if (entityType === 'source')
        {
            return sourceIdsForTarget(
                'file',
                file.id,
                file.projectId
            );
        }
    }

    if (ownerType === 'source')
    {
        const source =
            archiveSourceById(
                ownerId
            );

        if (!source)
        {
            return [];
        }

        return sourceTargetIds(
            source.id,
            entityType,
            source.projectId
        );
    }

    return [];
}

function archiveEntityConfig(type)
{
    const projectId = currentProjectId();
    const configs = {
        person: {
            singular: 'person', title: 'People', addLabel: 'Add people',
            records: () => (sampleData.people || []).filter(person => !person.deleted && person.projectId === projectId),
            label: record => formatPersonFullName(record) || record?.name || 'Person',
            meta: record =>
                archiveFilePersonMeta(
                    record
                )
        },
        event: {
            singular: 'event', title: 'Events', addLabel: 'Add events',
            records: () => (sampleData.events || []).filter(event => event.projectId === projectId),
            label: archiveEventLabel,
            meta: archiveEventMeta
        },
        note: {
            singular: 'note', title: 'Notes', addLabel: 'Add notes',
            records: () => typeof getProjectNotes === 'function' ? getProjectNotes(projectId, { includeArchived: false }) : (sampleData.notes || []).filter(note => note.projectId === projectId && !note.archived),
            label: record => record?.title || 'Untitled note',
            meta: record => typeof noteExcerpt === 'function' ? (noteExcerpt(record, 90) || 'No note content') : 'Research note'
        },
        place: {
            singular: 'place', title: 'Places', addLabel: 'Add places',
            records: () => (sampleData.places || []).filter(place => place.projectId === projectId),
            label: record => record?.name || 'Place',
            meta: record => (record?.alternativeNames || []).slice(0, 2).join(' · ') || 'Place record'
        },
        photo: {
            singular:
            'photo',

            title:
            'Photos',

            addLabel:
            'Add photos',

            records:
            () =>
                getProjectPhotos(
                    projectId
                ),

            label:
            record =>
                record?.title
              || record?.filename
              || 'Untitled photo',

            meta:
            record =>
                [
                    formatPhotoDate(
                        record
                    ),

                    record?.filename
                ]
                    .filter(Boolean)
                    .join(' · ')
              || 'Photo'
        },
        source: {
            singular: 'source', title: 'Sources', addLabel: 'Add sources',
            records: archiveProjectSources,
            label: record => record?.title || 'Untitled source',
            meta:
            record =>
                [
                    localizedSourceCategoryLabel(
                        record?.category,
                        ''
                    ),

                    record?.providedBy
                ]
                    .filter(Boolean)
                    .join(' · ')
              || 'Source record'
        },
        file: {
            singular: 'file', title: 'Files', addLabel: 'Add files',
            records: archiveProjectFiles,
            label: record => record?.name || 'Untitled file',
            meta: record => [archiveFileTypeLabel(record), archiveFolderPath(record?.folderId)].filter(Boolean).join(' · ')
        }
    };
    return configs[type] || null;
}

function archiveConnectionRecord(
    type,
    id
)
{
    if (type === 'person')
    {
        return getPerson(
            id
        );
    }

    if (type === 'event')
    {
        return (
            sampleData.events || []
        ).find(event =>
            event.id === id
        ) || null;
    }

    if (type === 'note')
    {
        return typeof getNote
          === 'function'
            ? getNote(
                id,
                {
                    includeArchived:
                    true
                }
            )
            : (
                sampleData.notes || []
            ).find(note =>
                note.id === id
            ) || null;
    }

    if (type === 'place')
    {
        return getPlace(
            id
        );
    }

    if (type === 'photo')
    {
        return getPhoto(
            id,
            {
                projectId:
              currentProjectId()
            }
        );
    }

    if (type === 'source')
    {
        return archiveSourceById(
            id
        );
    }

    if (type === 'file')
    {
        return archiveFileById(
            id
        );
    }

    return null;
}

function archiveSyncNoteLink(
    noteId,
    entityType,
    entityId,
    shouldLink,
    changes
)
{
    if (entityType !== 'file')
    {
        return;
    }

    const note =
        getNote(
            noteId,
            {
                includeArchived:
              true
            }
        );

    if (!note)
    {
        return;
    }

    const nextIds =
        new Set(
            note.linkedArchiveFileIds
          || []
        );

    if (shouldLink)
    {
        nextIds.add(
            entityId
        );
    }
    else
    {
        nextIds.delete(
            entityId
        );
    }

    setNoteEntityLinks(
        note.id,
        'archiveFile',
        [...nextIds],
        {
            projectId:
            note.projectId,
            changes
        }
    );
}

function archiveSetConnection(
    ownerType,
    ownerId,
    entityType,
    entityId,
    shouldLink,
    changes = null
)
{
    if (!changes)
    {
        const result = archiveSetConnectionsAtomically([{ ownerType, ownerId, entityType, entityId, shouldLink }]);
        return result.ok && result.changedCount > 0;
    }

    if (
        ownerType === 'file'
        && entityType === 'source'
    )
    {
        const file =
            archiveFileById(
                ownerId
            );

        return Boolean(
            file
          && setSourceLink(
              entityId,
              'file',
              file.id,
              shouldLink,
              {
                  projectId:
                file.projectId,
                  notify: false
              }
          )
        );
    }

    if (ownerType === 'source')
    {
        const source =
            archiveSourceById(
                ownerId
            );

        if (
            !source
          || !SOURCE_LINK_TARGET_TYPES
              .includes(
                  entityType
              )
        )
        {
            return false;
        }

        return setSourceLink(
            source.id,
            entityType,
            entityId,
            shouldLink,
            {
                projectId:
              source.projectId,
                notify: false
            }
        );
    }

    if (ownerType !== 'file')
    {
        return false;
    }

    const file =
        archiveFileById(
            ownerId
        );

    const record =
        archiveConnectionRecord(
            entityType,
            entityId
        );

    const eventPeople = entityType === 'event' && shouldLink
        ? archiveEventEvidencePeople(record, file?.projectId)
        : null;

    if (
        !file
        || (
            shouldLink
          && !record
        )
        || (
            record?.projectId
          && file.projectId
          && record.projectId
            !== file.projectId
        )
        || (entityType === 'event' && shouldLink && !eventPeople)
    )
    {
        return false;
    }

    if (entityType === 'place')
    {
        const currentIds = archiveFilePlaceIds(file);
        if (!shouldLink && !currentIds.includes(entityId)) return false;
        if (!archiveSetFilePlaces(file, shouldLink
            ? [...currentIds, entityId]
            : currentIds.filter(id => id !== entityId), { notify: false })) return false;
    }
    else
    {
        const field =
            ({
                person:
              'linkedPersonIds',

                event:
              'linkedEventIds',

                note:
              'linkedNoteIds'
            })[entityType];

        if (!field)
        {
            return false;
        }

        const ids =
            new Set(
                file[field] || []
            );

        if (shouldLink)
        {
            ids.add(
                entityId
            );
        }
        else
        {
            ids.delete(
                entityId
            );
        }

        file[field] =
            [...ids];
        if (entityType === 'person' && !shouldLink && Object.hasOwn(file.personRegions || {}, entityId))
        {
            const regions = { ...file.personRegions };
            delete regions[entityId];
            file.personRegions = regions;
        }

        if (entityType === 'event' && shouldLink && eventPeople)
        {
            file.linkedPersonIds = [...new Set([
                ...(file.linkedPersonIds || []),
                ...eventPeople.map(person => person.id)
            ])];
        }


        if (entityType === 'note')
        {
            archiveSyncNoteLink(
                entityId,
                'file',
                file.id,
                shouldLink,
                changes
            );
        }
    }

    file.updatedAt =
        new Date().toISOString();


    const savedIds =
        archiveConnectionIds(
            'file',
            file.id,
            entityType
        );

    return shouldLink
        ? savedIds.includes(
            entityId
        )
        : !savedIds.includes(
            entityId
        );
}

function archiveSetConnectionsAtomically(writes = [], changes = null)
{
    const pending = writes.map(write => ({
        ownerType: write?.ownerType || '',
        ownerId: String(write?.ownerId || '').trim(),
        entityType: write?.entityType || '',
        entityId: String(write?.entityId || '').trim(),
        shouldLink: write?.shouldLink !== false
    }));
    const snapshots = new Map();
    const snapshot = record =>
    {
        if (record && !snapshots.has(record)) snapshots.set(record, { ...record });
    };
    const valid = pending.every(write =>
    {
        const owner = archiveConnectionRecord(write.ownerType, write.ownerId);
        const record = archiveConnectionRecord(write.entityType, write.entityId);
        if (!owner || !write.entityType || !write.entityId || (write.shouldLink && !record)
            || (write.shouldLink && owner.projectId && record.projectId && owner.projectId !== record.projectId))
            return false;

        snapshot(owner);
        snapshot(record);
        if (write.ownerType === 'source' || (write.ownerType === 'file' && write.entityType === 'source'))
        {
            const targetType = write.ownerType === 'source' ? write.entityType : 'file';
            const targetId = write.ownerType === 'source' ? write.entityId : write.ownerId;
            for (const link of sourceLinksForTarget(targetType, targetId, owner.projectId))
                snapshot(archiveSourceById(link.sourceId, owner.projectId));
        }
        return true;
    });
    if (!valid) return { ok: false, changedCount: 0 };

    const beforeSourceLinks = sampleData.sourceLinks;
    const mutations = new Map();
    let changedCount = 0;
    let placeReferences = false;
    const restore = () =>
    {
        for (const [record, original] of snapshots)
        {
            for (const key of Object.keys(record))
                if (!Object.hasOwn(original, key)) delete record[key];
            Object.assign(record, original);
        }
        sampleData.sourceLinks = beforeSourceLinks;
    };

    try
    {
        for (const write of pending)
        {
            const { ownerType, ownerId, entityType, entityId, shouldLink } = write;
            const wasLinked = archiveConnectionIds(ownerType, ownerId, entityType).includes(entityId);
            if (wasLinked === shouldLink) continue;
            if (!archiveSetConnection(ownerType, ownerId, entityType, entityId, shouldLink, mutations))
            {
                restore();
                return { ok: false, changedCount: 0 };
            }

            const owner = archiveConnectionRecord(ownerType, ownerId);
            const domains = ownerType === 'source' ? sourceLinkMutationDomains(entityType)
                : entityType === 'source' ? ['archive', 'sources'] : ['archive'];
            recordProjectMutation(mutations, owner?.projectId, ...domains);
            changedCount++;
            if (entityType === 'place') placeReferences = true;
        }
    }
    catch (error)
    {
        restore();
        throw error;
    }

    if (changes)
    {
        for (const [projectId, domains] of mutations) recordProjectMutation(changes, projectId, ...domains);
    }
    else if (mutations.size) markPrototypeProjectsEdited(mutations, { placeReferences });

    return { ok: true, changedCount };
}

function archiveFileEditIsActive(
    fileId =
        state.archiveSelectedFileId
)
{
    return Boolean(
        state.archiveFileEditing
        && state.archiveFileEditDraft
            ?.fileId === fileId
    );
}

function archiveDocumentDateModel(file)
{
    return file?.documentDate || emptyGenealogyDate();
}

function archiveApplyDocumentPlace(
    file,
    placeId,
    relatedPlaceIds = archiveFilePlaceIds(file)
        .filter(id => id !== (file?.documentPlaceId || ''))
)
{
    const normalizedPlaceId = String(placeId || '').trim();
    file.documentPlaceId = normalizedPlaceId || null;
    file.linkedPlaceIds = archiveUniqueIds(
        relatedPlaceIds.filter(id => id && id !== normalizedPlaceId)
    );
}

function archiveFileEditDraftFromFile(
    file
)
{
    return {
        fileId:
          file.id,

        description:
          file.description
          || '',

        documentDate: {
            ...archiveDocumentDateModel(
                file
            )
        }
    };
}

function normalizedArchiveFileEditDraft(
    draft
)
{
    return {
        description:
          String(
              draft?.description || ''
          ).trim(),

        documentDate:
          mediaDateFromGenealogyModel(
              draft?.documentDate
            || {}
          )
    };
}

function collectArchiveFileEditDraft({
    allowInvalidDate =
        false
} = {})
{
    if (
        !state.archiveFileEditing
    )
    {
        return null;
    }

    const documentDate =
        collectGenealogyDateField(
            'archiveFileDocumentDate',
            {
                allowInvalid:
              allowInvalidDate
            }
        );

    if (!documentDate)
    {
        return null;
    }

    return {
        fileId:
          state.archiveSelectedFileId,

        description:
          main
              .querySelector(
                  '#archiveFileDescription'
              )
              ?.value
              .trim()
          || '',

        documentDate
    };
}

function archiveFileEditIsDirty()
{
    if (
        !state.archiveFileEditing
        || !state.archiveFileEditOriginal
    )
    {
        return false;
    }

    const current =
        collectArchiveFileEditDraft({
            allowInvalidDate:
            true
        });

    /*
        An invalid live date is still an unsaved
        change and must trigger the discard guard.
      */
    if (
        !current
        || current.documentDate
            ?.invalid
    )
    {
        return true;
    }

    return JSON.stringify(
        normalizedArchiveFileEditDraft(
            current
        )
    ) !== JSON.stringify(
        normalizedArchiveFileEditDraft(
            state.archiveFileEditOriginal
        )
    );
}

function resetArchiveFileEditState()
{
    state.archiveFileEditing =
        false;

    state.archiveFileEditOriginal =
        null;

    state.archiveFileEditDraft =
        null;
}

function beginArchiveFileEdit()
{
    const file =
        archiveFileById(
            state.archiveSelectedFileId
        );

    if (!file)
    {
        return;
    }

    const draft =
        archiveFileEditDraftFromFile(
            file
        );

    state.archiveFileEditing =
        true;

    state.archiveFileEditOriginal = {
        ...draft,

        documentDate: {
            ...draft.documentDate
        }
    };

    state.archiveFileEditDraft = {
        ...draft,

        documentDate: {
            ...draft.documentDate
        }
    };

    state.archiveInspectorSections
        .details =
            true;

    renderArchiveMain();
    requestAnimationFrame(() => main.querySelector('#archiveFileDocumentDateInput')?.focus({ preventScroll: true }));
}

function cancelArchiveFileEdit()
{
    runAfterArchiveFileEditGuard(() =>
    {
        resetArchiveFileEditState();
        renderArchiveMain();
        requestAnimationFrame(() => main.querySelector('#archiveEditFile')?.focus({ preventScroll: true }));
    });
}

function saveArchiveFileEdit()
{
    const file =
        archiveFileById(
            state.archiveSelectedFileId
        );

    if (!file)
    {
        resetArchiveFileEditState();
        renderArchiveMain();

        return;
    }

    const draft =
        collectArchiveFileEditDraft();

    if (!draft)
    {
        showToast(
            'Check the historical date before saving.'
        );

        return;
    }

    file.description =
        draft.description
        || '';

    /*
        Store the canonical genealogy-date model.
        The old { type, value } representation is
        no longer written.
      */
    file.documentDate =
        normalizeGenealogyDateInput(
            draft.documentDate,
            draft.documentDate
                ?.dateType
          || 'Exact date'
        );

    file.updatedAt =
        new Date()
            .toISOString();

    markPrototypeSessionEdited();

    resetArchiveFileEditState();
    renderArchive();
    requestAnimationFrame(() => main.querySelector('#archiveEditFile')?.focus({ preventScroll: true }));
    showToast(
        'File updated.'
    );
}

function runAfterArchiveFileEditGuard(
    action
)
{
    if (state.archiveFileNameEditingId)
    {
        const value = main.querySelector('#archiveFileNameInput')?.value.trim() || '';
        if (value !== state.archiveFileNameOriginal)
        {
            openModal(`<div class="modal" role="dialog" aria-modal="true" aria-labelledby="archiveDiscardFileNameTitle"><div class="modal-header"><h2 id="archiveDiscardFileNameTitle">${escapeHtml(t('Discard changes?'))}</h2></div><div class="modal-body"><p>${escapeHtml(t('Your unsaved file name will be lost.'))}</p></div><div class="modal-footer"><button class="button secondary" type="button" data-close>${escapeHtml(t('Continue editing'))}</button><button class="button danger" type="button" data-discard-file-name>${escapeHtml(t('Discard changes'))}</button></div></div>`);
            modalBackdrop.querySelector('[data-discard-file-name]')?.addEventListener('click', () =>
            {
                closeModal();
                state.archiveFileNameEditingId = '';
                state.archiveFileNameOriginal = '';
                action();
            });
            return;
        }
        state.archiveFileNameEditingId = '';
        state.archiveFileNameOriginal = '';
        action();
        return;
    }
    if (
        !state.archiveFileEditing
    )
    {
        action();

        return;
    }

    if (
        !archiveFileEditIsDirty()
    )
    {
        resetArchiveFileEditState();
        action();

        return;
    }

    openModal(`
        <div
          class="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="discardArchiveFileEditTitle">

          <div class="modal-header">
            <div>
              <h2
                id="discardArchiveFileEditTitle">
                Discard file changes?
              </h2>

              <p>
                Your unsaved detail changes will be lost.
              </p>
            </div>

            <button
              class="close-button"
              type="button"
              data-close
              aria-label="Close">

              ${icon.close}
            </button>
          </div>

          <div class="modal-footer">
            <button
              class="button secondary"
              type="button"
              data-close>

              Continue editing
            </button>

            <button
              class="button danger"
              type="button"
              data-discard-archive-file-edit>

              Discard changes
            </button>
          </div>
        </div>
      `);

    modalBackdrop
        .querySelector(
            '[data-discard-archive-file-edit]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                closeModal();
                resetArchiveFileEditState();
                action();
            }
        );
}

function beginArchiveFileRename(fileId)
{
    const file = archiveFileById(fileId);
    if (!file) return;
    state.archiveView = 'files';
    state.archiveSelectedFolderId = archiveFileFolderId(file);
    state.archiveSelectedFileId = file.id;
    state.archiveInspectorCollapsed = false;
    state.archiveFileNameEditingId = file.id;
    state.archiveFileNameOriginal = file.name || '';
    renderArchiveMain();
    if (innerWidth <= 900 && !document.body.classList.contains('mobile-details-open'))
        openMobileSurface('details');
    requestAnimationFrame(() => main.querySelector('#archiveFileNameInput')?.focus({ preventScroll: true }));
}

function saveArchiveFileRename()
{
    const file = archiveFileById(state.archiveFileNameEditingId);
    const input = main.querySelector('#archiveFileNameInput');
    const name = input?.value.trim() || '';
    if (!file || !name)
    {
        input?.focus();
        showToast(t('Enter a file name before saving.'));
        return;
    }
    file.name = name;
    file.updatedAt = new Date().toISOString();
    markPrototypeSessionEdited();
    state.archiveFileNameEditingId = '';
    state.archiveFileNameOriginal = '';
    renderArchiveMain();
    requestAnimationFrame(() => main.querySelector('#archiveRenameFile')?.focus({ preventScroll: true }));
    showToast(t('File renamed.'));
}

