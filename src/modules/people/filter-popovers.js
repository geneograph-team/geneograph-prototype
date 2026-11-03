function openAddFactOverlay(person)
{
    openTimelinePersonEditor({ kind: 'newAttribute', personId: person.id, tag: 'FACT' });
}

function closePeopleColumnsPopover()
{
    document.getElementById('peopleColumnsPopover')?.remove();
    document.getElementById('peopleColumnsButton')?.setAttribute('aria-expanded', 'false');
    document.removeEventListener('click', closePeopleColumnsOnOutside);
    document.removeEventListener('keydown', closePeopleColumnsOnEscape);
}

function closePeopleColumnsOnOutside(event)
{
    if (!event.target.closest('#peopleColumnsPopover') && !event.target.closest('#peopleColumnsButton')) closePeopleColumnsPopover();
}

function closePeopleColumnsOnEscape(event)
{
    if (event.key === 'Escape') closePeopleColumnsPopover();
}

function positionPeopleColumnsPopover(popover, anchor)
{
    const rect = anchor.getBoundingClientRect();
    popover.style.maxHeight = '';
    const width = popover.offsetWidth;
    const height = popover.offsetHeight;
    const below = window.innerHeight - rect.bottom - 20;
    const above = rect.top - 20;
    const placeBelow = below >= height || below >= above;
    popover.style.left = `${Math.max(12, Math.min(rect.left, window.innerWidth - width - 12))}px`;
    popover.style.top = `${placeBelow ? rect.bottom + 8 : Math.max(12, rect.top - height - 8)}px`;
    popover.style.maxHeight = `${Math.max(0, placeBelow ? below : above)}px`;
    anchor.setAttribute('aria-expanded', 'true');
}

function openPeopleColumnsPopover(anchor)
{
    if (document.getElementById('peopleColumnsPopover'))
    {
        closePeopleColumnsPopover();
        return;
    }
    closePeopleColumnsPopover();
    closePeopleFilterPopover();
    closeMenu();
    const columns = peopleColumnsWithDefaults();
    const optionalColumns = Object.entries(peopleColumnLabels).map(([key, label]) => `<label class="people-columns-option"><input type="checkbox" data-people-column="${key}" ${columns[key] ? 'checked' : ''}> <span>${escapeHtml(t(label))}</span></label>`).join('');
    const popover = document.createElement('div');
    popover.className = 'people-columns-popover';
    popover.id = 'peopleColumnsPopover';
    popover.setAttribute('role', 'dialog');
    popover.setAttribute('aria-label', t('Choose People table columns'));
    popover.innerHTML = `<div class="people-columns-header"><h3>${escapeHtml(t('Columns'))}</h3><p>${escapeHtml(t('Choose which fields are visible in the people table.'))}</p></div><div class="people-columns-list">${optionalColumns}</div><div class="people-columns-footer"><button class="button secondary" type="button" data-people-columns-reset>${escapeHtml(t('Reset columns'))}</button><button class="button primary" type="button" data-people-columns-close>${escapeHtml(t('Done'))}</button></div>`;
    document.body.appendChild(popover);
    positionPeopleColumnsPopover(popover, anchor);
    popover.querySelectorAll('[data-people-column]').forEach(input => input.addEventListener('change', () =>
    {
        state.peopleVisibleColumns = peopleColumnsWithDefaults();
        state.peopleVisibleColumns[input.dataset.peopleColumn] = input.checked;
        renderPeople();
        const newAnchor = document.getElementById('peopleColumnsButton');
        if (newAnchor) positionPeopleColumnsPopover(popover, newAnchor);
    }));
    popover.querySelector('[data-people-columns-reset]')?.addEventListener('click', () =>
    {
        state.peopleVisibleColumns = { ...defaultPeopleColumns };
        popover.querySelectorAll('[data-people-column]').forEach(input => { input.checked = true; });
        renderPeople();
        const newAnchor = document.getElementById('peopleColumnsButton');
        if (newAnchor) positionPeopleColumnsPopover(popover, newAnchor);
    });
    popover.querySelector('[data-people-columns-close]')?.addEventListener('click', closePeopleColumnsPopover);
    setTimeout(() =>
    {
        document.addEventListener('click', closePeopleColumnsOnOutside);
        document.addEventListener('keydown', closePeopleColumnsOnEscape);
    }, 0);
}

let peopleFilterReturnFocus =
    null;

function closePeopleFilterPopover({
    restoreFocus = false
} = {})
{
    document
        .getElementById(
            'peopleFilterPopover'
        )
        ?.remove();
    document.getElementById('peopleFilterButton')?.setAttribute('aria-expanded', 'false');

    document.removeEventListener(
        'click',
        closePeopleFilterOnOutside
    );

    document.removeEventListener(
        'keydown',
        closePeopleFilterOnEscape
    );

    if (
        restoreFocus
        && peopleFilterReturnFocus
            ?.isConnected
    )
    {
        peopleFilterReturnFocus.focus({
            preventScroll:
            true
        });
    }

    peopleFilterReturnFocus =
        null;
}

function closePeopleFilterOnOutside(
    event
)
{
    const popover =
        document.getElementById(
            'peopleFilterPopover'
        );

    const trigger =
        document.getElementById(
            'peopleFilterButton'
        );

    const eventPath =
        typeof event.composedPath
          === 'function'
            ? event.composedPath()
            : [];

    const insidePopover =
        eventPath.length
            ? eventPath.includes(
                popover
            )
            : popover?.contains(
                event.target
            );

    const insideTrigger =
        eventPath.length
            ? eventPath.includes(
                trigger
            )
            : trigger?.contains(
                event.target
            );

    if (
        insidePopover
        || insideTrigger
    )
    {
        return;
    }

    closePeopleFilterPopover();
}

function closePeopleFilterOnEscape(
    event
)
{
    if (
        event.key !== 'Escape'
    )
    {
        return;
    }

    event.preventDefault();

    closePeopleFilterPopover({
        restoreFocus:
          true
    });
}

function peopleFilterOptions(
    values,
    selected
)
{
    /*
      * Retained temporarily because other modules
      * may still use the old native-select helper.
      */
    return values.map(value => `
        <option
          value="${escapeHtml(value)}"
          ${
                value === selected
                    ? 'selected'
                    : ''
            }>
          ${escapeHtml(value || 'Any')}
        </option>
      `).join('');
}

function openPeopleFilterPopover(
    anchor
)
{
    if (document.getElementById('peopleFilterPopover'))
    {
        closePeopleFilterPopover();
        return;
    }
    closePeopleFilterPopover();
    closeAlbumsFilterPopover();
    closePeopleColumnsPopover();
    closeMenu();

    peopleFilterReturnFocus =
        anchor;
    anchor.setAttribute('aria-expanded', 'true');

    const filters =
        peopleFiltersWithDefaults();

    const popover =
        document.createElement(
            'div'
        );

    popover.className =
        'shared-filter-panel people-filter-popover';

    popover.id =
        'peopleFilterPopover';

    popover.setAttribute(
        'role',
        'dialog'
    );

    popover.setAttribute(
        'aria-label',
        translateText(
            'Filter people'
        )
    );

    popover.innerHTML = `
        <div
          class="
            shared-filter-panel-header
          ">

          <div>
            <h3>Filter people</h3>
            <p>
              Choose one or more values.
            </p>
          </div>

          <button
            class="
              shared-filter-panel-close
            "
            type="button"
            aria-label="Close"
            data-people-filter-close>

            ${icon.close}
          </button>
        </div>

        <div
          class="
            shared-filter-panel-body
          ">

          ${renderPeopleFilterFields(
                filters,
                'people-popover-filter'
            )}
        </div>

        <div
          class="
            shared-filter-panel-footer
          ">

          <button
            class="link"
            type="button"
            data-people-filter-reset>
            Clear filters
          </button>

          <div
            class="
              shared-filter-panel-actions
            ">

            <button
              class="button secondary"
              type="button"
              data-people-filter-cancel>
              Cancel
            </button>

            <button
              class="button primary"
              type="button"
              data-people-filter-apply>

              <span
                aria-live="polite"
                data-people-filter-result>
                ${escapeHtml(
                    peopleFilterApplyLabel(
                        filters
                    )
                )}
              </span>
            </button>
          </div>
        </div>
      `;

    document.body.appendChild(
        popover
    );

    localizeUI(popover);
    const resultLabel =
        popover.querySelector(
            '[data-people-filter-result]'
        );

    const applyButton =
        popover.querySelector(
            '[data-people-filter-apply]'
        );

    let controller = null;

    const updatePeopleFilterPreview =
        nextFilters =>
        {
            if (resultLabel)
            {
                resultLabel.textContent =
                    peopleFilterApplyLabel(
                        nextFilters
                    );
            }

            if (applyButton)
            {
                applyButton.disabled =
                    Boolean(
                        (
                            controller
                                ?.getErrors()
                  || []
                        ).length
                    );
            }
        };

    controller =
        bindPeopleFilterFields(
            popover,
            filters,
            'people-popover-filter',
            updatePeopleFilterPreview
        );

    updatePeopleFilterPreview(
        controller?.getValues()
        || filters
    );

    popover
        .querySelector(
            '[data-people-filter-reset]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                controller?.reset();
            }
        );

    popover
        .querySelector(
            '[data-people-filter-close]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                closePeopleFilterPopover({
                    restoreFocus:
                true
                });
            }
        );

    popover
        .querySelector(
            '[data-people-filter-cancel]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                closePeopleFilterPopover({
                    restoreFocus:
                true
                });
            }
        );
    popover
        .querySelector(
            '[data-people-filter-apply]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                const errors =
                    controller?.getErrors()
              || [];

                if (errors.length)
                {
                    controller
                        ?.focusFirstInvalid();

                    return;
                }

                clearPeopleSelection();

                state.peopleFilters =
                    controller?.getValues()
              || peopleFiltersWithDefaults();

                state.peopleSavedViewId =
                    '';

                state.peopleSavedView =
                    hasActivePeopleFilters()
                        ? 'Custom filters'
                        : 'All people';

                closePeopleFilterPopover();

                renderPeople();
            }
        );

    positionSharedFilterPanel(
        popover,
        anchor
    );

    requestAnimationFrame(
        () =>
        {
            popover
                .querySelector(
                    '[data-people-filter-close]'
                )
                ?.focus({
                    preventScroll:
                true
                });
        }
    );

    setTimeout(
        () =>
        {
            document.addEventListener(
                'click',
                closePeopleFilterOnOutside
            );

            document.addEventListener(
                'keydown',
                closePeopleFilterOnEscape
            );
        },
        0
    );
}

function clearPeopleFilters()
{
    clearPeopleSelection();

    state.peopleFilters =
        peopleFiltersWithDefaults(
            defaultPeopleFilters
        );

    state.peopleSavedViewId =
        '';

    state.peopleSavedView =
        'All people';

    renderPeople();

    showToast(
        'People filters cleared.'
    );
}

function removePeopleFilter(
    key
)
{
    const definition =
        sharedFilterDefinitionByKey(
            peopleFilterSchema,
            key
        );

    if (!definition)
    {
        return;
    }

    clearPeopleSelection();

    state.peopleFilters =
        peopleFiltersWithDefaults();

    state.peopleFilters[key] =
        cloneSharedFilterValues(
            [definition],
            {}
        )[key];

    state.peopleSavedViewId =
        '';

    state.peopleSavedView =
        hasActivePeopleFilters()
            ? 'Custom filters'
            : 'All people';

    renderPeople();
}

function generatePeopleSavedViewName(
    filters = state.peopleFilters
)
{
    const entries = activePeopleFilterEntries(filters);

    if (!entries.length)
    {
        return 'Custom people filter';
    }

    return entries
        .slice(0, 2)
        .map(([, , value]) => value)
        .join(' - ');
}

function setPeopleSavedViewModalError(message = '', focusSelector = '')
{
    const error = modalBackdrop.querySelector(
        '[data-people-saved-view-error]'
    );

    if (error)
    {
        error.textContent = message;
        error.hidden = !message;
    }

    if (message && focusSelector)
    {
        modalBackdrop.querySelector(focusSelector)?.focus();
    }
}

function openPeopleSavedViewModal({
    mode = 'create',
    viewId = '',
    initialName = '',
    initialDescription = '',
    initialFilters = defaultPeopleFilters
} = {})
{
    const isEdit = mode === 'edit';

    const existingView = isEdit
        ? peopleProjectSavedViews().find(view => view.id === viewId)
        : null;

    if (isEdit && !existingView)
    {
        showToast('Saved filter not found.');
        return;
    }

    const name = existingView ? peopleSavedViewText(existingView, 'name') : initialName;
    const description = existingView ? peopleSavedViewText(existingView, 'description') : initialDescription;

    const filters = peopleFiltersWithDefaults(
        existingView?.filters || initialFilters
    );

    const title = isEdit ? 'Edit filter' : 'Create filter';
    const subtitle = isEdit
        ? 'Update the name, description, or filter conditions.'
        : 'Create a reusable filter for the People directory.';

    const submitLabel = isEdit ? 'Save changes' : 'Create filter';

    openModal(`
        <div
          class="modal people-saved-view-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="peopleSavedViewModalTitle">

          <div class="modal-header">
            <div>
              <h2 id="peopleSavedViewModalTitle">${escapeHtml(title)}</h2>
              <p>${escapeHtml(subtitle)}</p>
            </div>

            <button
              class="close-button"
              type="button"
              data-close>
              ${icon.close}
            </button>
          </div>

          <form id="peopleSavedViewForm">
            <div class="modal-body people-saved-view-body">
              <div class="people-saved-view-identity">
                <div class="field">
                  <label for="peopleSavedViewName">Name</label>
                  <input
                    id="peopleSavedViewName"
                    required
                    maxlength="80"
                    value="${escapeHtml(name)}"
                    placeholder="e.g. Meowbridge relatives">
                </div>

                <div class="field">
                  <label for="peopleSavedViewDescription">Description</label>
                  <textarea
                    id="peopleSavedViewDescription"
                    placeholder="Optional description">${escapeHtml(description)}</textarea>
                </div>
              </div>

              <section
                class="people-saved-view-filters"
                aria-labelledby="peopleSavedViewFiltersTitle">

                <div class="people-saved-view-section-header">
                  <div>
                    <h3 id="peopleSavedViewFiltersTitle">Filters</h3>
                    <p>Choose at least one condition for this saved filter.</p>
                  </div>

                  <button
                    class="link people-saved-view-clear"
                    type="button"
                    data-people-saved-view-clear>
                    Clear filters
                  </button>
                </div>

                ${renderPeopleFilterFields(
                    filters,
                    'people-saved-view-filter'
                )}

                <p
                  class="people-saved-view-error"
                  data-people-saved-view-error
                  role="alert"
                  hidden>
                </p>
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
                ${escapeHtml(submitLabel)}
              </button>
            </div>
          </form>
        </div>
      `);

    const form = modalBackdrop.querySelector('#peopleSavedViewForm');
    const nameInput = modalBackdrop.querySelector('#peopleSavedViewName');

    const savedViewFilterController =
        bindPeopleFilterFields(
            form,
            filters,
            'people-saved-view-filter',
            () =>
            {
                setPeopleSavedViewModalError();
            }
        );

    nameInput?.focus();

    modalBackdrop
        .querySelector('[data-people-saved-view-clear]')
        ?.addEventListener('click', () =>
        {
            resetPeopleFilterFields(form);
            setPeopleSavedViewModalError();
        });

    form?.addEventListener('input', () =>
    {
        setPeopleSavedViewModalError();
    });

    form?.addEventListener('change', () =>
    {
        setPeopleSavedViewModalError();
    });
    form?.addEventListener(
        'submit',
        event =>
        {
            event.preventDefault();

            const submittedName =
                nameInput?.value.trim()
            || '';

            const submittedDescription =
                modalBackdrop
                    .querySelector(
                        '#peopleSavedViewDescription'
                    )
                    ?.value
                    .trim()
            || '';

            const submittedFilters =
                readPeopleFilterFields(
                    form
                );

            if (!submittedName)
            {
                setPeopleSavedViewModalError(
                    'Enter a filter name.',
                    '#peopleSavedViewName'
                );

                return;
            }

            const filterErrors =
                savedViewFilterController
                    ?.getErrors()
            || [];

            if (filterErrors.length)
            {
                setPeopleSavedViewModalError(
                    filterErrors[0],
                    '[aria-invalid="true"]'
                );

                savedViewFilterController
                    ?.focusFirstInvalid();

                return;
            }

            const normalizedFilters =
                peopleFiltersWithDefaults(
                    submittedFilters
                );

            if (
                !hasActivePeopleFilters(
                    normalizedFilters
                )
            )
            {
                setPeopleSavedViewModalError(
                    'Choose at least one filter option.',
                    [
                        '[data-shared-filter-input]',
                        '[data-shared-filter-year-mode]',
                        '[data-shared-filter-select]'
                    ].join(', ')
                );

                return;
            }

            const duplicate =
                peopleProjectSavedViews().find(view =>
                    view.id !== viewId
              && peopleSavedViewText(view, 'name')
                  .trim()
                  .toLowerCase()
                === submittedName
                    .toLowerCase()
                );

            if (duplicate)
            {
                setPeopleSavedViewModalError(
                    'A saved filter with this name already exists.',
                    '#peopleSavedViewName'
                );

                return;
            }

            if (isEdit)
            {
                const wasActive =
                    state.peopleSavedViewId
              === existingView.id;

                existingView.name =
                    submittedName === name ? existingView.name : submittedName;

                existingView.description =
                    submittedDescription === description ? existingView.description : submittedDescription;

                existingView.filters =
                    peopleFiltersWithDefaults(
                        normalizedFilters
                    );

                if (wasActive)
                {
                    clearPeopleSelection();

                    state.peopleSavedView =
                        submittedName;

                    state.peopleFilters =
                        peopleFiltersWithDefaults(
                            normalizedFilters
                        );
                }

                closeModal();
                renderPeople();
                showToast(
                    'Filter updated.'
                );

                return;
            }

            const id =
                `people-view-${Date.now()}`;

            const savedFilters =
                peopleFiltersWithDefaults(
                    normalizedFilters
                );

            peopleSavedViews.push({
                id,
                projectId: currentProjectId(),
                name:
              submittedName,

                description:
              submittedDescription,

                filters:
              savedFilters
            });

            clearPeopleSelection();

            state.peopleSavedViewId =
                id;

            state.peopleSavedView =
                submittedName;

            state.peopleFilters =
                peopleFiltersWithDefaults(
                    savedFilters
                );

            state.peopleView =
                'directory';

            closeModal();
            renderPeople();
            showToast(
                'Filter created.'
            );
        }
    );
}

function openCreatePeopleFilterModal()
{
    openPeopleSavedViewModal({
        mode:
          'create',

        initialName:
          '',

        initialDescription:
          '',

        initialFilters:
          peopleFiltersWithDefaults(
              defaultPeopleFilters
          )
    });
}

function openSavePeopleViewModal()
{
    if (!hasActivePeopleFilters())
    {
        showToast('Add filters before saving a filter.');
        return;
    }

    openPeopleSavedViewModal({
        mode: 'create',
        initialName: generatePeopleSavedViewName(),
        initialDescription: '',
        initialFilters: peopleFiltersWithDefaults()
    });
}

function openEditPeopleFilterModal(viewId)
{
    openPeopleSavedViewModal({
        mode: 'edit',
        viewId
    });
}

function openPeopleSavedViewMenu(viewId, anchor)
{
    closeMenu();
    closePeopleFilterPopover();
    closePeopleColumnsPopover();

    const view = peopleProjectSavedViews().find(item => item.id === viewId);
    if (!view || !anchor) return;

    const rect = anchor.getBoundingClientRect();
    const menu = document.createElement('div');

    menu.className = 'menu-popover';
    menu.id = 'projectMenu';
    menu.setAttribute('role', 'menu');
    menu.setAttribute('aria-label', `Actions for ${view.name}`);

    menu.style.top = `${rect.bottom + 6}px`;
    menu.style.left = `${Math.max(12, rect.right - 190)}px`;

    menu.innerHTML = `
        <button
          type="button"
          role="menuitem"
          data-people-saved-view-action="edit">
          Edit filter
        </button>

        <button
          class="danger"
          type="button"
          role="menuitem"
          data-people-saved-view-action="delete">
          Delete filter
        </button>
      `;

    document.body.appendChild(menu);

    menu.addEventListener('click', event =>
    {
        const actionButton = event.target.closest(
            '[data-people-saved-view-action]'
        );

        if (!actionButton) return;

        const action = actionButton.dataset.peopleSavedViewAction;

        closeMenu();

        if (action === 'edit')
        {
            openEditPeopleFilterModal(viewId);
        }

        if (action === 'delete')
        {
            openDeletePeopleFilterConfirm(viewId);
        }
    });

    menu.addEventListener('keydown', event =>
    {
        if (event.key !== 'Escape') return;

        event.preventDefault();
        closeMenu();
        anchor.focus();
    });

    setTimeout(() =>
    {
        document.addEventListener('click', closeMenu);
    }, 0);
}

function openDeletePeopleFilterConfirm(viewId)
{
    const view = peopleProjectSavedViews().find(item => item.id === viewId);
    if (!view)
    {
        showToast('Saved filter not found.');
        return;
    }

    openModal(`
        <div
          class="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="deletePeopleFilterTitle">

          <div class="modal-header">
            <div>
              <h2 id="deletePeopleFilterTitle">Delete filter?</h2>
              <p>This action cannot be undone.</p>
            </div>

            <button
              class="close-button"
              type="button"
              data-close>
              ${icon.close}
            </button>
          </div>

          <div class="modal-body">
            <div class="people-filter-delete-copy">
              <strong>${escapeHtml(view.name)}</strong>
              will be removed from Saved filters.
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
              id="confirmDeletePeopleFilter">
              Delete filter
            </button>
          </div>
        </div>
      `);

    modalBackdrop
        .querySelector('#confirmDeletePeopleFilter')
        ?.addEventListener('click', () =>
        {
            deletePeopleSavedView(viewId);
        });
}

function deletePeopleSavedView(viewId)
{
    const index = peopleSavedViews.findIndex(view => view.id === viewId && view.projectId === currentProjectId());
    if (index < 0)
    {
        closeModal();
        showToast('Saved filter not found.');
        return;
    }

    const wasActive = state.peopleSavedViewId === viewId;

    peopleSavedViews.splice(index, 1);

    if (wasActive)
    {
        clearPeopleSelection();
        state.peopleSavedViewId = '';
        state.peopleSavedView = 'All people';
        state.peopleFilters =
            peopleFiltersWithDefaults(
                defaultPeopleFilters
            );
        state.peopleView = 'directory';
    }

    closeModal();
    renderPeople();
    showToast('Filter deleted.');
}

function applyPeopleSavedView(
    viewId
)
{
    const view =
        peopleProjectSavedViews().find(
            item =>
                item.id === viewId
        );

    if (!view)
    {
        return;
    }

    clearPeopleSelection();

    state.peopleSavedViewId =
        view.id;

    state.peopleSavedView =
        view.name;

    state.peopleFilters =
        peopleFiltersWithDefaults(
            view.filters
        );

    state.peopleView =
        'directory';

    renderPeople();
}

function openPeopleActionsMenu(
    personId,
    anchor,
    {
        includeProfile = true
    } = {}
)
{
    const openMenu = document.getElementById('projectMenu');
    if (openMenu?.classList.contains('people-row-menu') && openMenu.dataset.personId === personId
        && (menuLifecycleAnchor === anchor || (anchor.id && menuLifecycleAnchor?.id === anchor.id)))
    {
        closeMenu();
        return;
    }
    closeMenu();
    closePeopleFilterPopover();
    closePeopleColumnsPopover();

    const person = getPerson(personId);

    if (!person || !anchor) return;

    const rect =
        anchor.getBoundingClientRect();

    const menu =
        document.createElement('div');

    menu.className =
        'menu-popover people-row-menu';

    menu.id = 'projectMenu';
    menu.dataset.personId = personId;

    menu.setAttribute(
        'role',
        'menu'
    );

    menu.setAttribute(
        'aria-label',
        `Actions for ${
            person.names?.display || 'person'
        }`
    );

    menu.style.visibility = 'hidden';
    menu.style.top =
        `${rect.bottom + 6}px`;
    menu.style.left = '0px';

    menu.innerHTML = `
        ${includeProfile
            ? `
            <button
              type="button"
              role="menuitem"
              data-people-action="profile">
              Open profile
            </button>
          `
            : ''}

        <button
          type="button"
          role="menuitem"
          data-people-action="tree">
          Show in Family Tree
        </button>

        <button
          type="button"
          role="menuitem"
          data-people-action="board">
          Add to Geneograph board
        </button>

        <button
          type="button"
          role="menuitem"
          data-people-action="relationships">
          Manage relationships
        </button>

        <button
          type="button"
          role="menuitem"
          class="danger"
          data-people-action="delete">
          Delete person
        </button>
      `;

    document.body.appendChild(menu);

    const viewportPadding = 12;

    const menuWidth =
        menu.getBoundingClientRect().width;

    menu.style.left = `${
        Math.max(
            viewportPadding,
            Math.min(
                rect.right - menuWidth,
                window.innerWidth
              - menuWidth
              - viewportPadding
            )
        )
    }px`;

    menu.style.visibility = 'visible';

    menu.addEventListener(
        'click',
        event =>
        {
            const action =
                event.target
                    .closest('[data-people-action]')
                    ?.dataset.peopleAction;

            if (!action) return;

            closeMenu();

            if (action === 'profile')
            {
                openPeopleProfileFromRow(
                    person.id
                );
            }

            if (action === 'edit')
            {
                openEditPersonModal(
                    person.id
                );
            }

            if (action === 'tree')
            {
                showPersonInFamilyTree(
                    person.id
                );
            }

            if (action === 'board')
            {
                openGeneographBoardChooser([person.id]);
            }

            if (action === 'relationships')
            {
                openManageRelationshipsModal(person.id, state.activeModule === 'Family Tree' ? 'tree' : 'people');
            }

            if (action === 'delete')
            {
                openDeletePeopleConfirm([
                    person.id
                ]);
            }
        }
    );

    bindMenuLifecycle(anchor);
}

