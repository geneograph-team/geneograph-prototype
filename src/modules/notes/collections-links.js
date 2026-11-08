function openNoteCollectionsModal(
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

    const projectId =
        note.projectId;

    let query = '';
    let createMode = false;

    const assignedCollectionIds =
        new Set(
            note.collectionIds || []
        );

    const selectedCollectionIds =
        new Set(assignedCollectionIds);
    const collectionDecisions = new Map();
    let createdCollectionId = '';

    const createDraft = {
        name: '',
        description: ''
    };

    const allCollections = () =>
        getProjectNoteCollections(
            projectId
        );

    const collectionSearchText =
        collection =>
            `
            ${collection.name || ''}
            ${collection.description || ''}
          `
                .trim()
                .toLowerCase();

    const visibleCollections = () =>
    {
        const normalizedQuery =
            query
                .trim()
                .toLowerCase();

        if (!normalizedQuery)
        {
            return allCollections();
        }

        return allCollections()
            .filter(collection =>
                collection.id === createdCollectionId || collectionSearchText(
                    collection
                ).includes(
                    normalizedQuery
                )
            );
    };

    const collectionNoteCount =
        collection =>
            getNotesForCollection(
                collection.id,
                {
                    projectId,
                    includeArchived: true
                }
            ).length;

    const selectionLabel = () =>
    {
        return rpText(`${collectionDecisions.size} changes`, `Изменений: ${collectionDecisions.size}`);
    };

    const saveLabel = () =>
    {
        return t('Save changes');
    };

    const renderCollectionRow =
        collection =>
        {
            const alreadyAssigned =
                assignedCollectionIds.has(
                    collection.id
                );

            const selected =
                selectedCollectionIds.has(
                    collection.id
                );

            const noteCount =
                collectionNoteCount(
                    collection
                );

            return `
            <label
              class="
                album-picker-result
                ${
                    selected
                        ? 'is-selected'
                        : ''
                }
                ${
                    alreadyAssigned
                        ? 'is-complete'
                        : ''
                }
              "
              data-note-collection-picker-row="${escapeHtml(
                    collection.id
                )}">

              <span class="album-picker-cover">
                ${icon.folder}
              </span>

              <span class="album-picker-copy">
                <strong>
                  ${escapeHtml(
                        collection.name
                    || 'Untitled collection'
                    )}
                </strong>

                <span class="album-picker-description">
                  ${escapeHtml(
                        collection.description
                    || 'No description'
                    )}
                </span>

                <span class="album-picker-meta">
                  <span>
                    ${noteCount}
                    ${
                        noteCount === 1
                            ? 'note'
                            : 'notes'
                    }
                  </span>

                  ${
                        alreadyAssigned
                            ? `
                        <span
                          aria-hidden="true">
                          ·
                        </span>

                        <span
                          class="
                            album-picker-membership
                            complete
                          ">
                          Already added
                        </span>
                      `
                            : ''
                    }
                </span>
              </span>

              <input
                type="checkbox"
                value="${escapeHtml(
                    collection.id
                )}"
                data-note-collection-picker-choice
                ${
                    selected
                        ? 'checked'
                        : ''
                }
                ${
                    alreadyAssigned
                        ? 'disabled'
                        : ''
                }
                aria-label="${escapeHtml(
                    alreadyAssigned
                        ? `${
                            collection.name
                        } is already assigned`
                        : `${
                            selected
                                ? 'Remove'
                                : 'Add'
                        } ${
                            collection.name
                        }`
                )}">
            </label>
          `;
        };

    const renderResults = () =>
    {
        const collections =
            visibleCollections();

        if (collections.length)
        {
            return collections
                .map(
                    renderCollectionRow
                )
                .join('');
        }

        if (query.trim())
        {
            return `
            <div class="album-picker-empty">
              <div class="album-picker-empty-card">
                <strong>
                  No collections match this search
                </strong>

                <p>
                  Try another collection name
                  or description.
                </p>

                <div class="album-picker-empty-actions">
                  <button
                    class="button secondary"
                    type="button"
                    data-note-collection-picker-clear-search>
                    Clear search
                  </button>

                  <button
                    class="button primary"
                    type="button"
                    data-note-collection-picker-create>
                    Create collection
                  </button>
                </div>
              </div>
            </div>
          `;
        }

        return `
          <div class="album-picker-empty">
            <div class="album-picker-empty-card">
              <strong>
                No collections yet
              </strong>

              <p>
                Create a collection to organize
                this note.
              </p>

              <button
                class="button primary"
                type="button"
                data-note-collection-picker-create>
                Create collection
              </button>
            </div>
          </div>
        `;
    };

    openModal(`
        <div
          class="
            modal
            photo-people-modal
            album-picker-modal
            note-collection-picker-modal
          "
          role="dialog"
          aria-modal="true"
          aria-labelledby="noteCollectionPickerTitle">

          <div class="modal-header">
            <div>
              <h2 id="noteCollectionPickerTitle">
                Add to collection
              </h2>

              <p>
                ${escapeHtml(
                    note.title
                  || 'Untitled note'
                )}
              </p>
            </div>

            <button
              class="close-button"
              type="button"
              data-close
              aria-label="Close add to collection dialog">
              ${icon.close}
            </button>
          </div>

          <div class="album-picker-body">

            <div
              class="album-picker-browse"
              data-note-collection-picker-browse>

              <div
                class="
                  field
                  photo-people-search-field
                  album-picker-search
                ">

                <label for="noteCollectionPickerSearch">
                  Find collections
                </label>

                <div class="search-input">
                  ${icon.search}

                  <input
                    id="noteCollectionPickerSearch"
                    type="search"
                    data-note-collection-picker-search
                    placeholder="Search collections"
                    autocomplete="off">
                </div>
              </div>

              <section class="album-picker-results-panel">

                <div class="album-picker-results-head">

                  <div class="album-picker-results-heading">
                    <strong
                      data-note-collection-picker-results-title>
                      All collections
                    </strong>

                    <span
                      data-note-collection-picker-results-meta>
                    </span>
                  </div>

                  <button
                    class="
                      button
                      secondary
                      album-picker-new-button
                    "
                    type="button"
                    data-note-collection-picker-create>

                    ${icon.plus}
                    New collection
                  </button>
                </div>

                <div
                  class="
                    photo-people-results
                    album-picker-results
                  "
                  data-note-collection-picker-results>
                </div>
              </section>
            </div>

            <form
              id="noteCollectionPickerCreateForm"
              class="album-picker-create"
              data-note-collection-picker-create-form
              hidden>

              <div class="album-picker-create-copy">
                <strong>
                  Create a new collection
                </strong>

                <span>
                  The new collection will be
                  selected automatically.
                </span>
              </div>

              <div class="album-picker-create-fields">

                <div class="field">
                  <label for="noteCollectionPickerName">
                    Collection name
                  </label>

                  <input
                    id="noteCollectionPickerName"
                    type="text"
                    maxlength="120"
                    data-note-collection-picker-name
                    required
                    autocomplete="off">
                </div>

                <div class="field">
                  <label
                    for="noteCollectionPickerDescription">
                    Description
                  </label>

                  <textarea
                    id="noteCollectionPickerDescription"
                    maxlength="500"
                    data-note-collection-picker-description
                    placeholder="Optional description"></textarea>
                </div>
              </div>
            </form>
          </div>

          <div
            class="
              modal-footer
              photo-people-footer
              album-picker-footer
            ">

            <span
              class="photo-people-selection-count"
              data-note-collection-picker-count>
            </span>

            <div
              class="album-picker-footer-actions"
              data-note-collection-picker-footer-actions>
            </div>
          </div>
        </div>
      `);

    const modal =
        modalBackdrop.querySelector(
            '.note-collection-picker-modal'
        );

    if (!modal)
    {
        return;
    }

    rpInitMembershipPicker(modal);

    const browsePanel =
        modal.querySelector(
            '[data-note-collection-picker-browse]'
        );

    const createPanel =
        modal.querySelector(
            '[data-note-collection-picker-create-form]'
        );

    const resultsHost =
        modal.querySelector(
            '[data-note-collection-picker-results]'
        );

    const resultsTitle =
        modal.querySelector(
            '[data-note-collection-picker-results-title]'
        );

    const resultsMeta =
        modal.querySelector(
            '[data-note-collection-picker-results-meta]'
        );

    const countElement =
        modal.querySelector(
            '[data-note-collection-picker-count]'
        );

    const footerActions =
        modal.querySelector(
            '[data-note-collection-picker-footer-actions]'
        );

    const searchInput =
        modal.querySelector(
            '[data-note-collection-picker-search]'
        );

    const nameInput =
        modal.querySelector(
            '[data-note-collection-picker-name]'
        );

    const descriptionInput =
        modal.querySelector(
            '[data-note-collection-picker-description]'
        );

    const refreshFooter = () =>
    {
        if (
            !countElement
          || !footerActions
        )
        {
            return;
        }

        if (createMode)
        {
            countElement.textContent = '';

            footerActions.innerHTML = `
            <button
              class="button secondary"
              type="button"
              data-note-collection-picker-back>
              ${escapeHtml(t('Cancel'))}
            </button>

            <button
              class="
                button
                primary
                album-picker-save
              "
              type="submit"
              form="noteCollectionPickerCreateForm"
              ${
                    createDraft.name.trim()
                        ? ''
                        : 'disabled'
                }>
              ${escapeHtml(
                    t('Create and select')
                )}
            </button>
          `;

            return;
        }

        countElement.textContent =
            translateText(
                selectionLabel()
            );

        footerActions.innerHTML = `
          <button
            class="button secondary"
            type="button"
            data-note-collection-picker-cancel>
            ${escapeHtml(t('Cancel'))}
          </button>

          <button
            class="
              button
              primary
              album-picker-save
            "
            type="button"
            data-note-collection-picker-save
            ${
                collectionDecisions.size
                    ? ''
                    : 'disabled'
            }>
            ${escapeHtml(
                saveLabel()
            )}
          </button>
        `;
    };

    const refreshResults = () =>
    {
        const collections =
            visibleCollections();

        const total =
            allCollections().length;

        const hasQuery =
            Boolean(
                query.trim()
            );

        if (resultsTitle)
        {
            resultsTitle.textContent =
                t(
                    hasQuery
                        ? 'Search results'
                        : 'All collections'
                );
        }

        if (resultsMeta)
        {
            const source =
                hasQuery
                    ? `${collections.length} of ${total} collections`
                    : `${total} ${
                        total === 1
                            ? 'collection'
                            : 'collections'
                    }`;

            resultsMeta.textContent =
                translateText(source);
        }

        if (resultsHost)
        {
            resultsHost.innerHTML =
                renderResults();

            localizeUI(
                resultsHost
            );
            rpRefreshMembershipRows(resultsHost);
        }

        refreshFooter();
    };

    const showBrowse = () =>
    {
        createMode = false;

        browsePanel.hidden =
            false;

        createPanel.hidden =
            true;

        refreshResults();

        requestAnimationFrame(
            () =>
            {
                modal.querySelector('.album-picker-new-button')?.focus({
                    preventScroll: true
                });
            }
        );
    };

    const showCreate = () =>
    {
        createMode = true;

        browsePanel.hidden =
            true;

        createPanel.hidden =
            false;

        if (nameInput)
        {
            nameInput.value =
                createDraft.name;
        }

        if (descriptionInput)
        {
            descriptionInput.value =
                createDraft.description;
        }

        refreshFooter();

        requestAnimationFrame(
            () =>
            {
                nameInput?.focus({
                    preventScroll: true
                });
            }
        );
    };

    const requestReturn = rpMembershipReturn(modal, { isCreating: () => createMode,
        isDirty: () => Boolean(createDraft.name.trim() || createDraft.description.trim()), returnToResults: () =>
        {
            createDraft.name = ''; createDraft.description = '';
            showBrowse();
        } });

    searchInput?.addEventListener(
        'input',
        event =>
        {
            query =
                event.currentTarget.value;

            refreshResults();
        }
    );

    nameInput?.addEventListener(
        'input',
        event =>
        {
            createDraft.name =
                event.currentTarget.value;

            refreshFooter();
        }
    );

    descriptionInput?.addEventListener(
        'input',
        event =>
        {
            createDraft.description =
                event.currentTarget.value;
        }
    );

    createPanel?.addEventListener(
        'submit',
        event =>
        {
            event.preventDefault();

            const name =
                createDraft.name.trim();

            if (!name)
            {
                nameInput?.focus();
                return;
            }

            const duplicate =
                allCollections()
                    .some(collection =>
                        String(
                            collection.name || ''
                        )
                            .trim()
                            .toLowerCase()
                === name.toLowerCase()
                    );

            if (duplicate)
            {
                showToast(
                    'A collection with this name already exists.'
                );

                nameInput?.focus();
                return;
            }

            const collection = {
                id:
              createRuntimeId(
                  'note-col'
              ),

                projectId,

                name,

                description:
              createDraft.description
                  .trim()
            };

            sampleData.noteCollections.push(
                collection
            );

            selectedCollectionIds.add(
                collection.id
            );

            createdCollectionId = collection.id;
            collectionDecisions.set(collection.id, true);
            createDraft.name = '';
            createDraft.description = '';

            showBrowse();

            requestAnimationFrame(
                () =>
                {
                    modal
                        .querySelector(
                            `[data-note-collection-picker-row="${
                                CSS.escape(
                                    collection.id
                                )
                            }"]`
                        )
                        ?.scrollIntoView({
                            block: 'nearest'
                        });
                }
            );
        }
    );

    modal.addEventListener(
        'change',
        event =>
        {
            const checkbox =
                event.target.closest(
                    '[data-note-collection-picker-choice]'
                );

            if (!checkbox)
            {
                return;
            }

            const collectionId =
                checkbox.value;

            if (checkbox.checked)
            {
                selectedCollectionIds.add(
                    collectionId
                );
            }
            else
            {
                selectedCollectionIds.delete(
                    collectionId
                );
            }

            if (checkbox.checked === assignedCollectionIds.has(collectionId)) collectionDecisions.delete(collectionId);
            else collectionDecisions.set(collectionId, checkbox.checked);

            refreshResults();
        }
    );

    modal.addEventListener(
        'click',
        event =>
        {
            if (
                event.target.closest(
                    '[data-note-collection-picker-cancel]'
                )
            )
            {
                closeModal();
                return;
            }
            if (
                event.target.closest(
                    '[data-note-collection-picker-create]'
                )
            )
            {
                showCreate();
                return;
            }

            if (
                event.target.closest(
                    '[data-note-collection-picker-back]'
                )
            )
            {
                requestReturn();
                return;
            }

            if (
                event.target.closest(
                    '[data-note-collection-picker-clear-search]'
                )
            )
            {
                query = '';

                if (searchInput)
                {
                    searchInput.value = '';
                }

                refreshResults();

                searchInput?.focus({
                    preventScroll: true
                });

                return;
            }

            if (
                event.target.closest(
                    '[data-note-collection-picker-save]'
                )
            )
            {
                if (!collectionDecisions.size)
                {
                    return;
                }

                const currentNote = getNote(note.id, { projectId, includeArchived: true });
                if (currentProjectId() !== projectId || !currentNote
                    || [...collectionDecisions.keys()].some(id => !allCollections().some(collection => collection.id === id)))
                { showToast(rpText('The selected records are no longer available.', 'Выбранные записи больше недоступны.')); return; }
                const nextIds = new Set(currentNote.collectionIds || []);
                collectionDecisions.forEach((linked, id) => linked ? nextIds.add(id) : nextIds.delete(id));
                const saved = setNoteCollections(
                    note.id,
                    [...nextIds],
                    {
                        projectId
                    }
                );
                if (!saved) return;

                closeModal();

                renderNotesPreservingInteraction();

                const added = [...collectionDecisions.values()].filter(Boolean).length;
                const removed = collectionDecisions.size - added;
                const message = rpLinkChangeMessage('collections', added, removed);
                if (message) showToast(message);
            }
        }
    );

    refreshResults();
}

function addNotesPlaceIdsFromRecord(
    record,
    target
)
{
    if (
        !record
        || !target
    )
    {
        return;
    }

    [
        record.placeId,
        record.birthPlaceId,
        record.deathPlaceId,
        record.burialPlaceId
    ]
        .filter(Boolean)
        .forEach(placeId =>
            target.add(placeId)
        );

    if (
        Array.isArray(
            record.placeIds
        )
    )
    {
        record.placeIds
            .filter(Boolean)
            .forEach(placeId =>
                target.add(placeId)
            );
    }
}

function notesSuggestedPlaceIds(
    note
)
{
    const placeIds =
        new Set();

    if (!note)
    {
        return placeIds;
    }

    (
        note.linkedPersonIds || []
    )
        .map(personId =>
            noteEntityById(
                'person',
                personId,
                note.projectId
            )
        )
        .filter(Boolean)
        .forEach(person =>
        {
            addNotesPlaceIdsFromRecord(
                person,
                placeIds
            );

            addNotesPlaceIdsFromRecord(
                person.birth,
                placeIds
            );

            addNotesPlaceIdsFromRecord(
                person.death,
                placeIds
            );

            (
                person.events || []
            ).forEach(event =>
                addNotesPlaceIdsFromRecord(
                    event,
                    placeIds
                )
            );

            (
                person.attributes || []
            ).forEach(attribute =>
                addNotesPlaceIdsFromRecord(
                    attribute,
                    placeIds
                )
            );
        });

    (
        note.linkedEventIds || []
    )
        .map(eventId =>
            noteEntityById(
                'event',
                eventId,
                note.projectId
            )
        )
        .filter(Boolean)
        .forEach(event =>
            addNotesPlaceIdsFromRecord(
                event,
                placeIds
            )
        );

    getPhotosForNote(
        note.id,
        {
            projectId:
            note.projectId
        }
    ).forEach(photo =>
        addNotesPlaceIdsFromRecord(
            photo,
            placeIds
        )
    );

    [
        [
            'source',
            noteEntityLinkedIds(
                note,
                'source'
            )
        ],
        [
            'archiveFile',
            note.linkedArchiveFileIds
        ]
    ].forEach(
        (
            [
                type,
                recordIds
            ]
        ) =>
        {
            (
                recordIds || []
            )
                .map(recordId =>
                    noteEntityById(
                        type,
                        recordId,
                        note.projectId
                    )
                )
                .filter(Boolean)
                .forEach(record =>
                    addNotesPlaceIdsFromRecord(
                        record,
                        placeIds
                    )
                );
        }
    );

    return placeIds;
}

function setArchiveFileConnectionIds(
    fileId,
    entityType,
    nextIds
)
{
    const file =
        archiveFileById(
            fileId
        );

    if (!file)
    {
        return false;
    }

    if (
        ![
            'person',
            'event',
            'note',
            'source',
            'place'
        ].includes(entityType)
    )
    {
        return false;
    }

    const currentIds =
        new Set(
            archiveConnectionIds(
                'file',
                file.id,
                entityType
            )
        );

    const normalizedNextIdList =
        archiveUniqueIds(
            nextIds
        );

    const nextRecords =
        normalizedNextIdList.map(id =>
            archiveConnectionRecord(
                entityType,
                id
            )
        );

    if (
        nextRecords.some(record =>
            !record
          || (
              file.projectId
            && record.projectId
            && file.projectId
              !== record.projectId
          )
        )
    )
    {
        return false;
    }

    const normalizedNextIds =
        new Set(
            normalizedNextIdList
        );

    if (
        entityType === 'place'
        && normalizedNextIds.size > 1
    )
    {
        return false;
    }

    const writes = [
        ...[...currentIds]
            .filter(recordId =>
                !normalizedNextIds.has(
                    recordId
                )
            )
            .map(recordId => ({
                ownerType: 'file',
                ownerId: file.id,
                entityType,
                entityId: recordId,
                shouldLink: false
            })),

        ...[...normalizedNextIds]
            .filter(recordId =>
                !currentIds.has(
                    recordId
                )
            )
            .map(recordId => ({
                ownerType: 'file',
                ownerId: file.id,
                entityType,
                entityId: recordId,
                shouldLink: true
            }))
    ];

    const committed =
        archiveSetConnectionsAtomically(
            writes
        );

    if (!committed.ok)
    {
        return false;
    }

    const savedIds =
        new Set(
            archiveConnectionIds(
                'file',
                file.id,
                entityType
            )
        );

    const saved =
        savedIds.size === normalizedNextIds.size
        && [...normalizedNextIds].every(id => savedIds.has(id));

    if (saved && entityType === 'person' && file.personRegions)
    {
        file.personRegions = Object.fromEntries(
            Object.entries(file.personRegions).filter(([personId]) => savedIds.has(personId))
        );
    }

    return saved;
}

function archiveFileSuggestedPersonIds(
    file
)
{
    if (!file)
    {
        return [];
    }

    const eventPersonIds =
        (
            file.linkedEventIds
          || []
        ).flatMap(eventId =>
        {
            const event =
                archiveConnectionRecord(
                    'event',
                    eventId
                );

            return placeInspectorEventOwnerIds(
                event
            );
        });

    const sourcePersonIds =
        sourceIdsForTarget(
            'file',
            file.id,
            file.projectId
        ).flatMap(sourceId =>
            sourceTargetIds(
                sourceId,
                'person',
                file.projectId
            )
        );

    return archiveUniqueIds([
        ...eventPersonIds,
        ...sourcePersonIds
    ]);
}

