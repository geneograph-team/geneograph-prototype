function openArchiveAddFilesModal()
{
    openArchiveDocumentImport();
}

function connectedFilesForProject(
    projectId =
        currentProjectId()
)
{
    return (
        sampleData.archiveFiles
        || []
    )
        .filter(file =>
            !file.deleted
          && Boolean(projectId)
          && file.projectId === projectId
        );
}

function connectedFilesSelectionLabel(
    count
)
{
    return `${count} ${
        count === 1
            ? 'file'
            : 'files'
    } selected`;
}

function connectedFilesActionLabel(
    count
)
{
    if (!count)
    {
        return 'Add files';
    }

    return `Add ${count} ${
        count === 1
            ? 'file'
            : 'files'
    }`;
}


function createArchiveFolderRecord(
    name,
    parentId = null
)
{
    const projectId = requireActiveProjectId();
    if (!projectId) return null;
    const normalizedName =
        String(
            name || ''
        ).trim();

    if (!normalizedName)
    {
        return null;
    }

    const normalizedParentId =
        archiveNormalizeFolderId(
            parentId
        );

    let id =
        `folder-${Date.now()}`;

    let suffix =
        1;

    while (
        archiveFolderById(
            id
        )
    )
    {
        id =
            `folder-${Date.now()}-${suffix}`;

        suffix +=
            1;
    }

    const now =
        new Date()
            .toISOString();

    const folder = {
        id,

        projectId,

        favorite: false,

        parentId:
          normalizedParentId,

        name:
          normalizedName,

        createdAt:
          now,

        updatedAt:
          now
    };

    sampleData.archiveFolders =
        sampleData.archiveFolders
        || [];

    sampleData
        .archiveFolders
        .push(
            folder
        );
    markPrototypeSessionEdited();

    if (
        normalizedParentId
    )
    {
        state.archiveExpandedFolders[
            normalizedParentId
        ] = true;
    }

    return folder;
}

function openArchiveCreateFolderModal(
    parentId =
        state.archiveSelectedFolderId
)
{
    const initialParentId =
        archiveNormalizeFolderId(
            parentId
        );

    let selectedParentId =
        initialParentId;

    let query =
        '';

    let searchExpanded = false;

    const expandedIds =
        new Set([
            null
        ]);

    /*
        Reveal the initially selected parent and
        all of its ancestors.
      */
    archiveFolderAncestors(
        initialParentId
    ).forEach(folder =>
    {
        expandedIds.add(
            folder.id
        );
    });

    if (initialParentId)
    {
        expandedIds.add(
            initialParentId
        );
    }

    openModal(`
        <div
          class="
            modal
            archive-create-folder-modal
            resource-picker
          "
          role="dialog"
          aria-modal="true"
          aria-labelledby="archiveNewFolderTitle">

          <div class="modal-header">
            <div>
              <h2
                id="archiveNewFolderTitle">

                New folder
              </h2>

              <p>
                Enter a folder name and choose
                where it should be created.
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
            class="
              archive-create-folder-form
            "
            data-archive-create-folder-form>

            <div
              class="
                modal-body
                archive-create-folder-body
              ">

              <div
                class="
                  field
                  archive-create-folder-name-field
                ">

                <label
                  for="archiveCreateFolderName">

                  Name of new folder
                </label>

                <input
                  id="archiveCreateFolderName"
                  data-archive-folder-name
                  required
                  maxlength="160"
                  placeholder="e.g. Civil records">
              </div>

              <div
                class="
                  archive-create-folder-parent-picker
                "
                data-archive-create-folder-parent-picker>
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

                Create
              </button>
            </div>
          </form>
        </div>
      `);

    const modal =
        modalBackdrop.querySelector(
            '.archive-create-folder-modal'
        );

    const form =
        modal?.querySelector(
            '[data-archive-create-folder-form]'
        );

    const nameInput =
        form?.querySelector(
            '[data-archive-folder-name]'
        );

    const parentPickerRoot =
        form?.querySelector(
            '[data-archive-create-folder-parent-picker]'
        );

    const renderParentPicker =
        ({
            focusSearch =
                false
        } = {}) =>
        {
            if (!parentPickerRoot)
            {
                return;
            }

            const breadcrumbs = [
                { id: ARCHIVE_ROOT_PICKER_VALUE, name: t('All files') },
                ...archiveFolderAncestors(selectedParentId).map(folder => ({ id: folder.id, name: folder.name }))
            ];
            const currentCrumb = breadcrumbs.at(-1);
            const fullPath = breadcrumbs.map(crumb => crumb.name).join(' / ');

            parentPickerRoot.innerHTML = `
            <div class="archive-create-folder-path-row">
              <div class="archive-create-folder-path-context">
                <span class="archive-create-folder-path-label">${escapeHtml(t('Create inside'))}</span>
                <nav class="rp-path archive-folder-path" aria-label="${escapeHtml(t('Parent folder'))}" aria-live="polite">
                  <span class="rp-path-icon" aria-hidden="true">${icon.folderyellow}</span>
                  ${breadcrumbs.slice(0, -1).map((crumb, index) => `<button class="${index ? 'archive-folder-crumb-intermediate' : ''}" type="button" data-archive-create-folder-crumb="${escapeHtml(crumb.id)}" title="${escapeHtml(crumb.name)}">${escapeHtml(crumb.name)}</button><span class="${index ? 'archive-folder-crumb-intermediate' : ''}" aria-hidden="true">${icon.chevron}</span>`).join('')}
                  <span aria-current="page" title="${escapeHtml(fullPath)}">${escapeHtml(currentCrumb.name)}</span>
                </nav>
              </div>
              <div class="archive-folder-inline-search ${searchExpanded ? 'is-expanded' : ''}">
                <button type="button" class="icon-button" data-archive-create-folder-search-toggle
                  aria-label="${escapeHtml(t(searchExpanded ? 'Close search' : 'Search folders'))}" aria-expanded="${searchExpanded}" aria-controls="archiveCreateFolderSearch" title="${escapeHtml(t(searchExpanded ? 'Close search' : 'Search folders'))}">${icon.search}</button>
                <input id="archiveCreateFolderSearch" type="search" data-archive-create-folder-search
                  aria-label="${escapeHtml(t('Search folders'))}" placeholder="${escapeHtml(t('Search folders'))}" value="${escapeHtml(query)}" ${searchExpanded ? '' : 'hidden'}>
              </div>
            </div>

            ${renderArchiveMovePicker({
                query,

                selectedId:
                selectedParentId,

                expandedIds,

                /*
                The Create modal has no unavailable
                moving/current folder. Every folder
                is a valid parent destination.
              */
                movingFolder:
                null,

                /*
                This argument is used by the latest
                shared picker implementation. Older
                signatures safely ignore it.
              */
                currentFolderState:
                null,

                showRootSubtitle:
                false
            })}
          `;

            /*
           * This picker is rendered after openModal()
           * has localized the initial modal content.
           *
           * Localize the newly inserted subtree
           * explicitly. The same function also runs
           * after search, selection, and expand/collapse
           * rerenders.
           */
            localizeUI(
                parentPickerRoot,
                {
                    suppressObserverReplay:
                true
                }
            );

            requestAnimationFrame(
                () =>
                {
                    if (!focusSearch)
                    {
                        return;
                    }

                    const searchInput =
                        parentPickerRoot
                            .querySelector(
                                '[data-archive-create-folder-search]'
                            );

                    searchInput?.focus();

                    const end =
                        searchInput?.value
                            .length
                || 0;

                    searchInput
                        ?.setSelectionRange(
                            end,
                            end
                        );
                }
            );
        };

    /*
        Search is delegated because the picker
        content is rerendered after every query.
      */
    modal?.addEventListener(
        'input',
        event =>
        {
            const searchInput =
                event.target.closest(
                    '[data-archive-create-folder-search]'
                );

            if (!searchInput)
            {
                return;
            }

            query =
                searchInput.value;

            renderParentPicker({
                focusSearch:
              true
            });
        }
    );

    /*
        Reuse the Move picker expand and select
        controls inside this modal only.
      */
    modal?.addEventListener(
        'click',
        event =>
        {
            if (event.target.closest('[data-archive-create-folder-search-toggle]'))
            {
                searchExpanded = !searchExpanded;
                if (!searchExpanded) query = '';
                renderParentPicker({ focusSearch: searchExpanded });
                if (!searchExpanded) requestAnimationFrame(() => parentPickerRoot.querySelector('[data-archive-create-folder-search-toggle]')?.focus());
                return;
            }

            const crumb = event.target.closest('[data-archive-create-folder-crumb]');
            if (crumb)
            {
                selectedParentId = archiveFolderIdFromChoice(crumb.dataset.archiveCreateFolderCrumb);
                query = '';
                searchExpanded = false;
                renderParentPicker();
                requestAnimationFrame(() => parentPickerRoot.querySelector('[data-archive-create-folder-search-toggle]')?.focus());
                return;
            }

            const toggle =
                event.target.closest(
                    '[data-archive-move-toggle]'
                );

            if (toggle)
            {
                const folderId =
                    archiveFolderIdFromChoice(
                        toggle.dataset
                            .archiveMoveToggle
                    );

                if (
                    expandedIds.has(
                        folderId
                    )
                )
                {
                    expandedIds.delete(
                        folderId
                    );
                }
                else
                {
                    expandedIds.add(
                        folderId
                    );
                }

                renderParentPicker();

                return;
            }

            const destination =
                event.target.closest(
                    '[data-archive-move-select]'
                );

            if (!destination)
            {
                return;
            }

            if (
                destination.disabled
            || destination.getAttribute(
                'aria-disabled'
            ) === 'true'
            )
            {
                return;
            }

            selectedParentId =
                archiveFolderIdFromChoice(
                    destination.dataset
                        .archiveMoveSelect
                );

            /*
            Ensure a parent selected through search
            is revealed when the search is cleared.
          */
            archiveFolderAncestors(
                selectedParentId
            ).forEach(folder =>
            {
                expandedIds.add(
                    folder.id
                );
            });

            if (selectedParentId)
            {
                expandedIds.add(
                    selectedParentId
                );
            }

            renderParentPicker();
        }
    );

    form?.addEventListener(
        'submit',
        event =>
        {
            event.preventDefault();

            const name =
                nameInput
                    ?.value
                    .trim()
            || '';

            if (!name)
            {
                nameInput?.focus();

                return;
            }

            const folder =
                createArchiveFolderRecord(
                    name,
                    selectedParentId
                );

            if (!folder)
            {
                nameInput?.focus();

                return;
            }

            closeModal();

            archiveNavigateToLocation(
                {
                    view:
                'files',

                    folderId:
                folder.id,

                    search:
                '',

                    searchScope:
                'folder',

                    personFilterId:
                '',

                    selectedFileId:
                null,

                    inspectorCollapsed:
                false
                },
                {
                    expandCurrent:
                true
                }
            );

            showToast(
                'Folder created.'
            );
        }
    );

    renderParentPicker();

    requestAnimationFrame(
        () =>
        {
            nameInput?.focus();
        }
    );
}

function archiveSourceAccessedDateValue(dateModel)
{
    if (!dateModel || dateModel.invalid) return null;
    const value = normalizeGenealogyDateInput(dateModel);
    return value.state === 'empty' ? '' : value;
}

function collectArchiveSourceAccessedDate()
{
    const fieldId =
        'archiveSourceAccessed';

    const fieldRoot =
        modalBackdrop
            ?.querySelector(
                `[data-genealogy-date-field="${fieldId}"]`
            );

    const dateModel =
        collectGenealogyDateField(
            fieldId
        );

    if (!dateModel)
    {
        return null;
    }

    const isoDate =
        archiveSourceAccessedDateValue(
            dateModel
        );

    if (isoDate === null)
    {
        setGenealogyDateFieldError(
            fieldRoot,
            'Enter a valid date or the known date parts.'
        );

        return null;
    }

    return isoDate;
}

function openArchiveSourceModal(
    sourceId = '',
    {
        onCreated =
            null,
        modalOpener = openModal,
        targetProjectId = null
    } = {}
)
{
    const source =
        archiveSourceById(
            sourceId
        );

    const editing =
        Boolean(
            source
        );

    const categoryOptions =
        SOURCE_CATEGORIES
            .map(category => `
            <option
              value="${escapeHtml(category.value)}"
              ${
                    source?.category
                  === category.value
                        ? 'selected'
                        : ''
                }>
              ${escapeHtml(category.label)}
            </option>
          `)
            .join('');

    modalOpener(`
        <div
          class="modal archive-source-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="archiveSourceModalTitle">

          <div class="modal-header">
            <div>
              <h2 id="archiveSourceModalTitle">
                ${
                    editing
                        ? 'Edit source'
                        : 'Add source'
                }
              </h2>

              <p>
                Record where this file or information came from.
                Only the source name is required.
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
            class="archive-source-form"
            data-archive-source-form>

            <div
              class="
                modal-body
                archive-source-form-body
              ">

              <section
                class="archive-source-form-section"
                aria-labelledby="archiveSourceBasicHeading">

                <div
                  class="
                    archive-source-form-section-heading
                  ">

                  <h3 id="archiveSourceBasicHeading">
                    Basic information
                  </h3>
                </div>

                <div class="field">
                  <label for="archiveSourceName">
                    Source name

                    <span
                      class="archive-source-required"
                      aria-hidden="true">
                      *
                    </span>
                  </label>

                  <input
                    id="archiveSourceName"
                    data-archive-source-title
                    required
                    aria-required="true"
                    autocomplete="off"
                    value="${escapeHtml(source?.title || '')}"
                    placeholder="e.g. Pawford household register">
                </div>

                <div
                  class="
                    archive-source-form-row
                    archive-source-form-row-identity
                  ">

                  <div class="field">
                    <label for="archiveSourceCategory">
                      Source category
                    </label>

                    <select
                      id="archiveSourceCategory"
                      class="compact-select"
                      data-archive-source-form-category>

                      <option value="">
                        Choose category
                      </option>

                      ${categoryOptions}
                    </select>
                  </div>

                  <div class="field">
                    <label for="archiveSourceProvidedBy">
                      Where or who did it come from?
                    </label>

                    <input
                      id="archiveSourceProvidedBy"
                      data-archive-source-provided-by
                      autocomplete="off"
                      value="${escapeHtml(source?.providedBy || '')}"
                      placeholder="Person, archive, website, library, or family collection">
                  </div>
                </div>
              </section>

              <section
                class="archive-source-form-section"
                aria-labelledby="archiveSourceFindingHeading">

                <div
                  class="
                    archive-source-form-section-heading
                  ">

                  <h3 id="archiveSourceFindingHeading">
                    Finding details
                  </h3>
                </div>

                <div
                  class="
                    archive-source-form-row
                    archive-source-form-row-location
                  ">

                  ${renderPlaceCombobox({
                        id: 'archiveSourceLocation',
                        label: 'Location',
                        value: archiveSourceCustodialPlaceLabel(source),
                        selectedPlaceId: archiveSourceCustodialPlace(source)?.id || '',
                        showAddress: false,
                        placeholder: 'Find or create a place'
                    })}

                  <div class="field">
                    <label for="archiveSourceReference">
                      Where can it be found?
                    </label>

                    <input
                      id="archiveSourceReference"
                      data-archive-source-reference
                      autocomplete="off"
                      value="${escapeHtml(source?.reference || '')}"
                      placeholder="Collection, folder, volume, page, call number, or item">
                  </div>
                </div>

                <div
                  class="
                    archive-source-form-row
                    archive-source-form-row-access
                  ">

                  <div class="field">
                    <label for="archiveSourceUrl">
                      Website or link
                    </label>

                    <input
                      id="archiveSourceUrl"
                      type="url"
                      inputmode="url"
                      autocomplete="url"
                      data-archive-source-url
                      value="${escapeHtml(source?.url || '')}"
                      placeholder="https://">
                  </div>

                  ${renderGenealogyDateField(
                        'archiveSourceAccessed',
                        'Date accessed or received',
                        source?.accessedDate
                      || '',
                        {
                            inputId:
                        'archiveSourceAccessedInput',

                            typeId:
                        'archiveSourceAccessedType',

                            defaultDateType:
                        'Exact date',

                            placeholder:
                        'e.g. 24 May 2026',

                            className:
                        'archive-source-accessed-date'
                        }
                    )}
                </div>
              </section>

              <section
                class="archive-source-form-section"
                aria-labelledby="archiveSourceNotesHeading">

                <div
                  class="
                    archive-source-form-section-heading
                  ">

                  <h3 id="archiveSourceNotesHeading">
                    Additional notes
                  </h3>
                </div>

                <div class="field">
                  <label for="archiveSourceNotes">
                    Notes
                  </label>

                  <textarea
                    id="archiveSourceNotes"
                    data-archive-source-notes
                    placeholder="Add anything that will help you recognize or find this source again">${escapeHtml(source?.notes || '')}</textarea>
                </div>
              </section>
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
                ${
                    editing
                        ? 'Save source'
                        : 'Create source'
                }
              </button>
            </div>
          </form>
        </div>
      `);

    const form =
        modalBackdrop.querySelector(
            '[data-archive-source-form]'
        );

    bindGenealogyDateFields(
        modalBackdrop
    );
    bindPlaceComboboxes(modalBackdrop);

    requestAnimationFrame(
        () =>
        {
            modalBackdrop
                .querySelector(
                    '#archiveSourceName'
                )
                ?.focus({
                    preventScroll: true
                });
        }
    );

    form?.addEventListener(
        'submit',
        event =>
        {
            event.preventDefault();

            const projectId =
                source?.projectId
            || targetProjectId
            || requireActiveProjectId();

            if (!projectId || projectId !== currentProjectId())
            {
                showToast(t('The connected record is no longer available.'));
                return;
            }

            const title =
                form
                    .querySelector(
                        '[data-archive-source-title]'
                    )
                    .value
                    .trim();

            if (!title)
            {
                return;
            }

            const accessedDate =
                collectArchiveSourceAccessedDate();

            if (accessedDate === null)
            {
                form
                    .querySelector(
                        '[data-genealogy-date-input]'
                    )
                    ?.focus({
                        preventScroll: true
                    });

                return;
            }

            const now =
                new Date().toISOString();

            const target =
                source
            || {
                id:
                createRuntimeId(
                    'source'
                ),

                projectId,

                favorite:
                false,

                createdAt:
                now
            };

            target.title =
                title;

            target.category =
                form
                    .querySelector(
                        '[data-archive-source-form-category]'
                    )
                    .value;

            target.providedBy =
                form
                    .querySelector(
                        '[data-archive-source-provided-by]'
                    )
                    .value
                    .trim();

            const locationInput = readPlaceInputValue(
                '#archiveSourceLocation',
                modalBackdrop
            );
            const storedAt = resolvePlaceAssignment(locationInput);
            if (locationInput.text && !storedAt.placeId)
            {
                form.querySelector('#archiveSourceLocation')?.focus();
                showToast(t('The selected place is no longer available.'));
                return;
            }
            target.placeId = storedAt.placeId;

            target.reference =
                form
                    .querySelector(
                        '[data-archive-source-reference]'
                    )
                    .value
                    .trim();

            target.url =
                form
                    .querySelector(
                        '[data-archive-source-url]'
                    )
                    .value
                    .trim();

            target.accessedDate =
                accessedDate;

            target.notes =
                form
                    .querySelector(
                        '[data-archive-source-notes]'
                    )
                    .value
                    .trim();

            target.updatedAt =
                now;
            markPrototypeSessionEdited();

            const created =
                !source;

            if (created)
            {
                sampleData.sources.unshift(
                    target
                );
            }

            if (
                created
            && typeof onCreated
              === 'function'
            )
            {
                closeModal();

                onCreated(
                    target
                );

                return;
            }

            state.archiveView =
                'sources';

            state.archiveSelectedSourceId =
                target.id;

            state.archiveSearch =
                '';

            closeModal();
            renderArchive();

            showToast(
                editing
                    ? 'Source updated.'
                    : 'Source created.'
            );
        }
    );
}

function openArchiveRenameItemModal(
    type,
    id
)
{
    const file =
        type === 'file'
            ? archiveFileById(
                id
            )
            : null;

    const folder =
        type === 'folder'
            ? archiveFolderById(
                id
            )
            : null;

    const item =
        file
        || folder;

    if (!item)
    {
        return;
    }

    const itemType =
        file
            ? 'file'
            : 'folder';

    const currentName =
        file?.name
        || folder?.name
        || '';

    const title =
        file
            ? 'Rename file'
            : 'Rename folder';

    const description =
        file
            ? 'Update the file name without changing its contents, folder, or links.'
            : 'Update the folder name without changing its contents or location.';

    openModal(`
        <div
          class="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="archiveRenameItemTitle">

          <div class="modal-header">
            <div>
              <h2
                id="archiveRenameItemTitle">

                ${escapeHtml(
                    title
                )}
              </h2>

              <p>
                ${escapeHtml(
                    description
                )}
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
            data-archive-rename-item-form>

            <div class="modal-body">
              <div class="field">
                <label
                  for="archiveRenameItemValue">

                  Name
                </label>

                <input
                  id="archiveRenameItemValue"
                  required
                  maxlength="220"
                  value="${escapeHtml(
                        currentName
                    )}">
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

                Rename
              </button>
            </div>
          </form>
        </div>
      `);

    const form =
        modalBackdrop.querySelector(
            '[data-archive-rename-item-form]'
        );

    const input =
        form?.querySelector(
            '#archiveRenameItemValue'
        );

    form?.addEventListener(
        'submit',
        event =>
        {
            event.preventDefault();

            const value =
                input
                    ?.value
                    .trim()
            || '';

            if (!value)
            {
                input?.focus();

                return;
            }

            const now =
                new Date()
                    .toISOString();

            if (file)
            {
                file.name =
                    value;

                file.updatedAt =
                    now;

                file.updated =
                    'Just now';
            }

            if (folder)
            {
                folder.name =
                    value;

                folder.updatedAt =
                    now;
            }

            closeModal();
            renderArchive();

            showToast(
                `${
                    itemType === 'file'
                        ? 'File'
                        : 'Folder'
                } renamed.`
            );
        }
    );

    requestAnimationFrame(
        () =>
        {
            input?.focus();
            input?.select();
        }
    );
}

