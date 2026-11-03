function noteSearchText(
    note
)
{
    const collectionText =
        getCollectionsForNote(
            note.id,
            {
                projectId:
              note.projectId
            }
        )
            .map(
                collection =>
                    collection.name
            )
            .join(' ');

    const checklistText =
        (note.checklist || [])
            .map(item => item.text)
            .join(' ');

    const tagText =
        (note.tags || [])
            .join(' ');

    const linkedText =
        Object.keys(
            NOTE_ENTITY_TYPES
        )
            .flatMap(type =>
                noteEntityRecordsForNote(
                    note,
                    type
                ).flatMap(record => [
                    noteEntityLabel(
                        type,
                        record
                    ),

                    noteEntityMeta(
                        type,
                        record
                    )
                ])
            )
            .filter(Boolean)
            .join(' ');

    const relatedText =
        getRelatedNotes(
            note.id,
            {
                projectId:
              note.projectId,

                includeArchived:
              true
            }
        )
            .map(related =>
                related.title
            )
            .join(' ');

    return [
        note.title,
        note.body,
        tagText,
        collectionText,
        checklistText,
        linkedText,
        relatedText
    ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
}

function filteredNotes()
{
    const projectId =
        currentProjectId();

    let list;

    if (
        state.notesView === 'archived'
    )
    {
        list =
            getProjectNotes(
                projectId,
                {
                    includeArchived: true
                }
            ).filter(
                note => note.archived
            );
    }
    else if (
        state.notesView === 'collection'
    )
    {
        list =
            getNotesForCollection(
                state.notesActiveCollectionId,
                {
                    projectId,
                    includeArchived: false
                }
            );
    }
    else
    {
        list =
            getProjectNotes(
                projectId
            );

        if (
            state.notesView === 'favorites'
        )
        {
            list =
                list.filter(
                    note => note.favorite
                );
        }
    }

    const context =
        activeNotesContext();

    if (context)
    {
        const linkedNoteIds =
            new Set(
                getNotesForContext(
                    context.type,
                    context.id,
                    {
                        projectId,

                        includeArchived:
                  state.notesView
                    === 'archived'
                    }
                ).map(
                    note => note.id
                )
            );

        list =
            list.filter(note =>
                linkedNoteIds.has(
                    note.id
                )
            );
    }

    const filters = notesFiltersWithDefaults();
    list = list.filter(note => noteMatchesNotesFilters(note, filters, projectId));

    const query =
        String(
            state.notesSearch || ''
        )
            .trim()
            .toLowerCase();

    if (query)
    {
        list =
            list.filter(note =>
                noteSearchText(note)
                    .includes(query)
            );
    }
    list =
        appSortRecords(list, {
            field:
            state.notesSort,

            direction:
            state.notesSortDirection,

            extractors: {
                name: {
                    type: 'text',
                    get: note =>
                        note.title
                },

                updated: {
                    type: 'number',
                    get: note =>
                        appSortTimestamp(
                            note.updatedAt
                        )
                },

                created: {
                    type: 'number',
                    get: note =>
                        appSortTimestamp(
                            note.createdAt
                        )
                }
            },

            getFallback:
            note => note.title
        });

    return list;
}

function ensureNotesSelection(list)
{
    if (!list.some(n => n.id === state.selectedNoteId))
    {
        state.selectedNoteId = null;
        state.notesRightCollapsed = true;
    }
}
function selectedNote()
{
    return getNote(
        state.selectedNoteId,
        {
            includeArchived: true
        }
    );
}

function notesTitle()
{
    if (
        state.notesView === 'collection'
    )
    {
        return collectionName(
            state.notesActiveCollectionId
        );
    }

    return {
        all:
          'All notes',

        favorites:
          'Favourites',

        archived:
          'Archived notes'
    }[state.notesView]
      || 'Notes';
}

function collectionName(
    collectionId
)
{
    return (
        getNoteCollection(
            collectionId
        )?.name
        || 'No collection'
    );
}

function removeBoardObjectsForEntity(
    entityType,
    entityId
)
{
    const affectedNodeIds =
        new Set();

    (sampleData.boards || [])
        .forEach(board =>
        {
            const diagram =
                board.diagram;

            if (!diagram)
            {
                return;
            }

            if (entityType === 'person')
            {
                diagram.people
                    .filter(person =>
                        person.treePersonId
                  === entityId
                    )
                    .forEach(person =>
                    {
                        person.treePersonId = null;
                        person.syncState = 'local';
                    });
            }

            if (
                entityType === 'media'
            || entityType === 'photo'
            )
            {
                diagram.people
                    .filter(person =>
                        person.photoId
                  === entityId
                    )
                    .forEach(person =>
                    {
                        person.photoId = null;
                    });

                diagram.nodes
                    .filter(node =>
                        node.type === 'image'
                && node.imageRef?.scope === 'project'
                && node.imageRef.id === entityId
                    )
                    .forEach(node =>
                    {
                        node.imageRef = null;
                        affectedNodeIds.add(node.id);
                    });
            }
        });

    return affectedNodeIds;
}

function deleteNotePermanently(
    noteId
)
{
    const index =
        sampleData.notes.findIndex(
            note =>
                note.id === noteId
        );

    if (index < 0)
    {
        return;
    }

    removeSourceLinksForTarget(
        'note',
        noteId
    );
    sampleData.notes.splice(
        index,
        1
    );

    sampleData.notes.forEach(
        note =>
        {
            note.relatedNoteIds =
                (
                    note.relatedNoteIds || []
                ).filter(
                    relatedId =>
                        relatedId !== noteId
                );
        }
    );

    sampleData.links =
        (
            sampleData.links || []
        ).filter(link =>
        {
            const noteIsSource =
                (
                    link.sourceType === 'note'
              && link.sourceId === noteId
                )
            || (
                link.fromType === 'note'
              && link.fromId === noteId
            );

            const noteIsTarget =
                (
                    link.targetType === 'note'
              && link.targetId === noteId
                )
            || (
                link.toType === 'note'
              && link.toId === noteId
            );

            return (
                !noteIsSource
            && !noteIsTarget
            );
        });

    if (
        state.selectedNoteId === noteId
    )
    {
        state.selectedNoteId =
            null;

        state.notesRightCollapsed =
            true;

        state.notesMobilePane =
            'browser';
    }

    removeBoardObjectsForEntity(
        'note',
        noteId
    );

    closeModal();
    renderNotes();

    showToast(
        'Note deleted.'
    );
}

function openDeleteNoteModal(
    noteId
)
{
    const note =
        getNote(
            noteId,
            {
                includeArchived: true
            }
        );

    if (!note)
    {
        return;
    }

    openModal(`
        <div
          class="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="deleteNoteTitle">

          <div class="modal-header">
            <div>
              <h2 id="deleteNoteTitle">
                Delete note?
              </h2>

              <p>
                This permanently removes
                the note and cannot be
                undone.
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

          <div class="modal-body">
            <div class="notes-confirmation-card">

              <strong>
                ${escapeHtml(
                    note.title
                )}
              </strong>

              <span>
                Links to this note will
                also be removed.
              </span>
            </div>
          </div>

          <div class="modal-footer">
            <button
              class="button secondary"
              type="button"
              data-close
              data-modal-initial-focus>
              Cancel
            </button>

            <button
              class="button danger"
              type="button"
              id="notesConfirmDelete">
              Delete permanently
            </button>
          </div>
        </div>
      `);

    modalBackdrop
        .querySelector(
            '#notesConfirmDelete'
        )
        ?.addEventListener(
            'click',
            () =>
                deleteNotePermanently(
                    noteId
                )
        );
}

function openNotesMenu(
    noteId,
    anchor
)
{
    closeMenu();

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

    const rect =
        anchor.getBoundingClientRect();

    const menu =
        document.createElement(
            'div'
        );

    menu.className =
        'menu-popover';

    menu.id =
        'projectMenu';

    menu.style.top =
        `${rect.bottom + 6}px`;

    menu.style.left =
        `${Math.max(
            12,
            rect.right - 200
        )}px`;

    menu.innerHTML = `
        <button
          type="button"
          data-action="favorite">
          ${
                note.favorite
                    ? 'Remove from favourites'
                    : 'Add to favourites'
            }
        </button>

        <button
          type="button"
          data-action="duplicate">
          Duplicate
        </button>

        <button
          type="button"
          data-action="add-to-collection">
          Add to collection
        </button>

        <button
          type="button"
          data-action="archive">
          ${
                note.archived
                    ? 'Unarchive'
                    : 'Archive'
            }
        </button>

        <button
          type="button"
          class="danger"
          data-action="delete">
          Delete
        </button>
      `;

    document.body.appendChild(
        menu
    );

    menu.addEventListener(
        'click',
        event =>
        {
            const action =
                event.target
                    .closest(
                        '[data-action]'
                    )
                    ?.dataset.action;

            if (!action)
            {
                return;
            }

            if (
                action === 'add-to-collection'
            )
            {
                closeMenu();

                /*
            * Restore focus to the persistent menu trigger
            * before opening the modal. openModal() can then
            * preserve the correct focus-return target instead
            * of capturing a menu item that has been removed.
            */
                anchor?.focus({
                    preventScroll: true
                });

                openNoteCollectionsModal(
                    note.id
                );

                return;
            }

            if (action === 'delete')
            {
                openDeleteNoteModal(
                    note.id
                );
                return;
            }

            if (action === 'favorite')
            {
                note.favorite =
                    !note.favorite;

                touchNote(note);

                showToast(
                    note.favorite
                        ? 'Added to favourites.'
                        : 'Removed from favourites.'
                );
            }

            if (action === 'archive')
            {
                note.archived =
                    !note.archived;

                touchNote(note);

                state.notesView =
                    note.archived
                        ? 'archived'
                        : 'all';

                state.notesActiveCollectionId =
                    null;

                showToast(
                    note.archived
                        ? 'Archived.'
                        : 'Unarchived.'
                );
            }

            if (action === 'duplicate')
            {
                duplicateCentralNote(
                    note.id
                );

                showToast(
                    'Note duplicated.'
                );
            }

            closeMenu();
            renderNotesPreservingInteraction();
        }
    );

    bindMenuLifecycle(
        anchor
    );
}

function openNotesCollectionMenu(
    collectionId,
    anchor
)
{
    closeMenu();

    const collection =
        getNoteCollection(
            collectionId
        );

    if (!collection)
    {
        return;
    }

    const rect =
        anchor.getBoundingClientRect();

    const menu =
        document.createElement('div');

    menu.className =
        'menu-popover';

    menu.id =
        'projectMenu';

    menu.style.top =
        `${rect.bottom + 6}px`;

    menu.style.left =
        `${
            Math.max(
                12,
                rect.right - 200
            )
        }px`;

    menu.innerHTML = `
        <button
          type="button"
          data-action="edit">
          Edit collection
        </button>

        <button
          type="button"
          data-action="delete"
          class="danger">
          Delete collection
        </button>
      `;

    document.body.appendChild(
        menu
    );

    menu.addEventListener(
        'click',
        event =>
        {
            const action =
                event.target
                    .closest(
                        '[data-action]'
                    )
                    ?.dataset.action;

            if (!action)
            {
                return;
            }

            if (action === 'edit')
            {
                openEditCollectionModal(
                    collectionId
                );

                return;
            }

            if (action === 'delete')
            {
                openDeleteCollectionModal(
                    collectionId
                );
            }
        }
    );

    bindMenuLifecycle(anchor);
}

function renderNotesCollectionModal({
    titleId,
    title,
    intro,
    formId,
    nameId,
    descriptionId,
    name = '',
    description = '',
    submitLabel
})
{
    return `
        <div
          class="modal notes-collection-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="${titleId}">

          <div class="modal-header">
            <div>
              <h2 id="${titleId}">
                ${title}
              </h2>

              <p>
                ${intro}
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

          <form
            class="notes-collection-form"
            id="${formId}">

            <div class="modal-body form-grid">
              <div class="field">
                <label for="${nameId}">
                  Collection name
                </label>

                <input
                  id="${nameId}"
                  type="text"
                  required
                  maxlength="120"
                  autocomplete="off"
                  value="${escapeHtml(name)}"
                  placeholder="e.g. Pawford archive questions">
              </div>

              <div class="field">
                <label for="${descriptionId}">
                  Description
                </label>

                <textarea
                  id="${descriptionId}"
                  rows="4"
                  maxlength="500"
                  placeholder="Optional description">${escapeHtml(
                        description
                    )}</textarea>
              </div>
            </div>

            <div class="modal-footer">
              <button
                class="button secondary"
                type="button"
                data-close>
                Cancel
              </button>

              <button
                class="button primary"
                type="submit">
                ${submitLabel}
              </button>
            </div>
          </form>
        </div>
      `;
}

function openEditCollectionModal(
    collectionId
)
{
    const collection =
        getNoteCollection(
            collectionId
        );

    if (!collection)
    {
        return;
    }

    openModal(
        renderNotesCollectionModal({
            titleId:
            'editCollectionTitle',

            title:
            'Edit collection',

            intro:
            'Update the collection name and description. Notes inside stay in this collection.',

            formId:
            'notesEditCollectionForm',

            nameId:
            'notesEditCollectionName',

            descriptionId:
            'notesEditCollectionDescription',

            name:
            collection.name || '',

            description:
            collection.description || '',

            submitLabel:
            'Save changes'
        })
    );

    const form =
        modalBackdrop.querySelector(
            '#notesEditCollectionForm'
        );

    const nameInput =
        modalBackdrop.querySelector(
            '#notesEditCollectionName'
        );

    const descriptionInput =
        modalBackdrop.querySelector(
            '#notesEditCollectionDescription'
        );

    form?.addEventListener(
        'submit',
        event =>
        {
            event.preventDefault();

            const name =
                nameInput?.value.trim()
            || '';

            const description =
                descriptionInput?.value.trim()
            || '';

            if (!name)
            {
                nameInput?.focus();

                showToast(
                    'Enter a collection name.'
                );

                return;
            }

            collection.name = name;
            collection.description =
                description;

            closeModal();
            renderNotes();

            showToast(
                'Collection updated.'
            );
        }
    );

    requestAnimationFrame(() =>
    {
        nameInput?.focus();
        nameInput?.select();
    });
}

function openDeleteCollectionModal(
    collectionId
)
{
    const collection =
        getNoteCollection(
            collectionId
        );

    if (!collection)
    {
        return;
    }

    const affectedNotes =
        getNotesForCollection(
            collection.id,
            {
                projectId:
              collection.projectId,

                includeArchived:
              true
            }
        );

    const noteLabel =
        affectedNotes.length === 1
            ? 'note'
            : 'notes';

    openModal(`
        <div
          class="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="deleteCollectionTitle">

          <div class="modal-header">
            <div>
              <h2 id="deleteCollectionTitle">
                Delete collection?
              </h2>

              <p>
                The collection will be removed.
                Notes and their other collection
                memberships will remain.
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

          <div class="modal-body">
            <div class="notes-evidence-card">
              <strong>
                ${escapeHtml(
                    collection.name
                )}
              </strong>

              <span>
                ${affectedNotes.length}
                ${noteLabel} will keep
                their remaining collections.
              </span>
            </div>
          </div>

          <div class="modal-footer">
            <button
              class="button secondary"
              type="button"
              data-close>
              Cancel
            </button>

            <button
              class="button danger"
              type="button"
              id="notesConfirmDeleteCollection">
              Delete collection
            </button>
          </div>
        </div>
      `);

    modalBackdrop
        .querySelector(
            '#notesConfirmDeleteCollection'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                affectedNotes.forEach(note =>
                {
                    removeNoteFromCollection(
                        note.id,
                        collection.id,
                        {
                            projectId:
                    collection.projectId,

                            touchUpdatedAt:
                    false
                        }
                    );
                });

                const index =
                    sampleData.noteCollections
                        .findIndex(
                            item =>
                                item.id
                      === collection.id
                        );

                if (index >= 0)
                {
                    sampleData.noteCollections
                        .splice(index, 1);
                }

                if (
                    state.notesActiveCollectionId
                === collection.id
                )
                {
                    state.notesView =
                        'all';

                    state.notesActiveCollectionId =
                        null;
                }

                closeModal();
                renderNotes();

                showToast(
                    'Collection deleted. Notes kept.'
                );
            }
        );
}

function resolveNoteCreationContext(
    {
        contextType = '',
        contextId = '',
        allowActiveContext = true,
        projectId = currentProjectId()
    } = {}
)
{
    const explicit =
        contextType && contextId
            ? {
                type: contextType,
                id: contextId
            }
            : null;

    const requested =
        explicit
        || (
            allowActiveContext
                ? activeNotesContext()
                : null
        );

    if (!requested)
    {
        return null;
    }

    const record =
        noteEntityById(
            requested.type,
            requested.id,
            projectId
        );

    return record
        ? {
            type: requested.type,
            id: record.id
        }
        : null;
}

function createCentralNote(
    {
        contextType = '',
        contextId = '',
        collectionIds = null,
        title = 'Untitled note',
        projectId = currentProjectId(),
        inheritActiveContext = true,
        inheritActiveCollection = true,
        activate = true,
        renderAfterCreate = true,
        focusTitleAfterCreate = true,
        showCreatedToast = true
    } = {}
)
{
    const ownerProjectId = validProjectById(projectId)?.id || '';
    if (!ownerProjectId)
    {
        showToast('Open a project before creating records.');
        return null;
    }
    const previousActiveModule =
        state.activeModule;
    const creationContext =
        resolveNoteCreationContext({
            contextType,
            contextId,
            allowActiveContext:
            inheritActiveContext,
            projectId: ownerProjectId
        });

    const inheritedCollectionId =
        inheritActiveCollection
        && !Array.isArray(collectionIds)
        && !contextType
        && state.activeModule === 'Notes'
        && state.notesView === 'collection'
        && Boolean(
            getNoteCollection(
                state.notesActiveCollectionId
            )
        )
            ? state.notesActiveCollectionId
            : null;

    const initialCollectionIds =
        Array.isArray(collectionIds)
            ? collectionIds
            : (
                inheritedCollectionId
                    ? [inheritedCollectionId]
                    : []
            );

    const now =
        new Date().toISOString();

    const record = {
        id:
          createRuntimeId('note'),

        projectId: ownerProjectId,

        title:
          String(title || '').trim()
          || 'Untitled note',

        body:
          '',

        bodyDelta:
          null,

        bodyFormat:
          '',

        collectionIds:
          initialCollectionIds,

        favorite:
          false,

        archived:
          false,

        tags:
          [],

        checklist:
          [],

        linkedPersonIds:
          [],

        linkedPlaceIds:
          [],

        linkedEventIds:
          [],

        linkedPhotoIds:
          [],

        linkedArchiveFileIds:
          [],

        relatedNoteIds:
          [],

        createdAt:
          now,

        updatedAt:
          now
    };

    const newNote =
        normalizeCentralNoteRecord(
            record
        );

    sampleData.notes.unshift(
        newNote
    );

    if (creationContext)
    {
        setNoteEntityLinks(
            newNote.id,
            creationContext.type,
            [
                creationContext.id
            ],
            {
                projectId:
              newNote.projectId,

                touchUpdatedAt:
              false
            }
        );
    }

    if (activate)
    {
        state.activeModule =
            'Notes';

        clearNotesContext();

        if (creationContext)
        {
            setNotesContext(
                creationContext.type,
                creationContext.id,
                {
                    projectId:
                newNote.projectId
                }
            );
        }

        state.notesView =
            inheritedCollectionId
                ? 'collection'
                : 'all';

        state.notesActiveCollectionId =
            inheritedCollectionId;

        state.selectedNoteId =
            newNote.id;

        state.notesRightCollapsed =
            false;

        state.notesMobilePane =
            'editor';

        state.notesSaveStatus =
            'Saved';

        state.notesFilters = { ...defaultNotesFilters };
    }

    if (renderAfterCreate)
    {
        /*
          Entering Notes from another module requires
          a full render so the global module navigation
          receives the correct active state.

          Creating a Note while already inside Notes can
          use the smaller module-only render.
        */
        if (
            activate
          && previousActiveModule
            !== 'Notes'
        )
        {
            render();
        }
        else if (
            state.activeModule
            === 'Notes'
        )
        {
            renderNotes();
        }

        if (
            activate
          && focusTitleAfterCreate
        )
        {
            requestAnimationFrame(() =>
            {
                const titleInput =
                    main.querySelector(
                        '#notesTitleInput'
                    );

                titleInput?.focus();
                titleInput?.select();
            });
        }

        if (
            activate
          && showCreatedToast
        )
        {
            showToast(
                'Note created.'
            );
        }
    }

    return newNote;
}

function openNewCollectionModal()
{
    openModal(
        renderNotesCollectionModal({
            titleId:
            'newCollectionTitle',

            title:
            'Create collection',

            intro:
            'Collections keep related notes together.',

            formId:
            'notesCollectionForm',

            nameId:
            'notesCollectionName',

            descriptionId:
            'notesCollectionDescription',

            submitLabel:
            'Create collection'
        })
    );

    const form =
        modalBackdrop.querySelector(
            '#notesCollectionForm'
        );

    const nameInput =
        modalBackdrop.querySelector(
            '#notesCollectionName'
        );

    const descriptionInput =
        modalBackdrop.querySelector(
            '#notesCollectionDescription'
        );

    form?.addEventListener(
        'submit',
        event =>
        {
            event.preventDefault();

            const name =
                nameInput?.value.trim()
            || '';

            const description =
                descriptionInput?.value.trim()
            || '';

            if (!name)
            {
                nameInput?.focus();

                showToast(
                    'Enter a collection name.'
                );

                return;
            }

            const id =
                createRuntimeId('note-col');

            sampleData.noteCollections.push({
                id,

                projectId:
              currentProjectId(),

                name,
                description
            });

            state.notesView =
                'collection';

            state.notesActiveCollectionId =
                id;

            closeModal();
            renderNotes();

            showToast(
                'Collection created.'
            );
        }
    );

    requestAnimationFrame(() =>
    {
        nameInput?.focus();
    });
}


