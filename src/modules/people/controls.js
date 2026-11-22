function openDeletePeopleConfirm(personIds)
{
    const requestedIds = [...new Set(Array.isArray(personIds) ? personIds.filter(Boolean) : [])];
    const validPeople = requestedIds
        .map(personId => getPerson(personId))
        .filter(Boolean);

    if (!validPeople.length) return;

    const validIds = validPeople.map(person => person.id);
    const count = validPeople.length;
    const visibleNames = validPeople.slice(0, 5)
        .map(person => `<li>${escapeHtml(formatPersonFullName(person) || 'Unnamed person')}</li>`)
        .join('');
    const remaining = count - 5;
    const noun = count === 1 ? 'person' : 'people';

    const heading = t(count === 1 ? 'Delete this person?' : 'Delete selected people?');
    const selectedCount = `${t('Selected')}: ${translateCountPhrase(`${count} ${noun}`)}`;
    const warning = t(count === 1
        ? 'This person and their family connections will be removed from the project.'
        : 'The selected people and their family connections will be removed from the project.');
    const remainingLabel = state.language === 'ru'
        ? `И ещё ${translateCountPhrase(`${remaining} ${remaining === 1 ? 'person' : 'people'}`)}.`
        : `And ${remaining} more ${remaining === 1 ? 'person' : 'people'}.`;

    openModal(`<div class="modal" role="dialog" aria-modal="true" aria-labelledby="deletePeopleTitle"><div class="modal-header"><div><h2 id="deletePeopleTitle">${escapeHtml(heading)}</h2><p>${escapeHtml(selectedCount)}</p></div><button class="close-button" type="button" data-close aria-label="${escapeHtml(t('Close'))}">${icon.close}</button></div><div class="modal-body"><div class="people-delete-confirm-copy"><p>${escapeHtml(warning)}</p><ul>${visibleNames}</ul>${remaining > 0 ? `<p class="people-delete-remaining">${escapeHtml(remainingLabel)}</p>` : ''}<p>${escapeHtml(t('Linked photos, Archive files, notes, and other research materials will remain in the project.'))}</p></div></div><div class="modal-footer"><button class="button secondary" type="button" data-close>${escapeHtml(t('Cancel'))}</button><button class="button danger" type="button" data-confirm-delete-people>${escapeHtml(t(count === 1 ? 'Delete person' : 'Delete people'))}</button></div></div>`);

    modalBackdrop.querySelector('[data-confirm-delete-people]')
        ?.addEventListener('click', () => deletePeopleRecords(validIds));
}

function deletePeopleRecords(personIds)
{
    const requestedIds = [...new Set(Array.isArray(personIds) ? personIds.filter(Boolean) : [])];
    const validIds = requestedIds.filter(personId => Boolean(getPerson(personId)));
    if (!validIds.length) return;

    const deletedIds = new Set(validIds);
    removeSourceLinksForTargets(
        'person',
        [...deletedIds]
    );
    const partnerAFields = ['partnerAId'];
    const partnerBFields = ['partnerBId'];
    const partnerAHints = ['partnerARoleHint'];
    const partnerBHints = ['partnerBRoleHint'];

    const now = new Date().toISOString();
    sampleData.media.forEach(photo =>
    {
        const nextPersonIds = (photo.personIds || []).filter(personId => !deletedIds.has(personId));
        if (nextPersonIds.length !== (photo.personIds || []).length)
        {
            photo.personIds = nextPersonIds;
            photo.updatedAt = now;
        }
        if (photo.personRegions && Object.keys(photo.personRegions).some(id => deletedIds.has(id)))
        {
            photo.personRegions = Object.fromEntries(Object.entries(photo.personRegions).filter(([id]) => !deletedIds.has(id)));
            photo.updatedAt = now;
        }
    });

    for (const records of [sampleData.archiveFiles, sampleData.notes])
    {
        for (const record of records)
        {
            if (!record.linkedPersonIds?.some(id => deletedIds.has(id))) continue;
            record.linkedPersonIds = record.linkedPersonIds.filter(id => !deletedIds.has(id));
            record.updatedAt = now;
        }
    }
    for (const file of sampleData.archiveFiles)
    {
        if (!file.personRegions || !Object.keys(file.personRegions).some(id => deletedIds.has(id))) continue;
        file.personRegions = Object.fromEntries(Object.entries(file.personRegions).filter(([id]) => !deletedIds.has(id)));
        file.updatedAt = now;
    }
    for (const board of sampleData.boards)
    {
        for (const person of board.diagram.people)
        {
            if (!deletedIds.has(person.treePersonId)) continue;
            person.treePersonId = null;
            person.syncState = 'local';
            board.modifiedAt = now;
        }
    }

    sampleData.people = sampleData.people.filter(person => !deletedIds.has(person.id));

    for (const filter of sampleData.placeSavedFilters)
    {
        if (deletedIds.has(filter.filters?.personId)) filter.filters.personId = '';
    }

    sampleData.projects.forEach(project =>
    {
        if (!deletedIds.has(project.defaultPersonId)) return;
        project.defaultPersonId = getPeople(project.id)[0]?.id || '';
    });

    Object.entries(state.treeProjectViews || {}).forEach(
        ([projectId, view]) =>
        {
            if (deletedIds.has(view.focusPersonId))
            {
                view.focusPersonId = treeDefaultPersonId(projectId);
            }

        }
    );

    sampleData.families = centralFamilyRecords().map(family =>
    {
        const removedPartnerA = partnerAFields.some(field => deletedIds.has(family[field]));
        const removedPartnerB = partnerBFields.some(field => deletedIds.has(family[field]));

        partnerAFields.forEach(field =>
        {
            if (deletedIds.has(family[field])) family[field] = '';
        });
        partnerBFields.forEach(field =>
        {
            if (deletedIds.has(family[field])) family[field] = '';
        });
        if (removedPartnerA) partnerAHints.forEach(field =>
        {
            family[field] = '';
        });
        if (removedPartnerB) partnerBHints.forEach(field =>
        {
            family[field] = '';
        });

        unlinkSetFamilyChildren(
            family,
            unlinkFamilyChildrenIds(family).filter(personId => !deletedIds.has(personId))
        );

        family.parentChildTypes = Object.fromEntries(
            Object.entries(sanitizeParentChildTypes(family.parentChildTypes))
                .filter(([key]) => !key.split('|').some(personId => deletedIds.has(personId)))
        );

        return family;
    }).filter(family =>
    {
        const memberIds = new Set([
            familyPartnerAId(family),
            familyPartnerBId(family),
            ...unlinkFamilyChildrenIds(family)
        ].filter(Boolean));
        return memberIds.size >= 2;
    });

    const survivingFamilyIds = new Set(sampleData.families.map(family => family.id));
    sampleData.events = (sampleData.events || []).map(event => ({
        ...event,
        personIds: Array.isArray(event.personIds)
            ? event.personIds.filter(personId => !deletedIds.has(personId))
            : event.personIds,
        relatedPersonIds: Array.isArray(event.relatedPersonIds)
            ? event.relatedPersonIds.filter(personId => !deletedIds.has(personId))
            : event.relatedPersonIds
    })).filter(event =>
    {
        if (event.familyId && !survivingFamilyIds.has(event.familyId)) return false;
        return !Array.isArray(event.personIds) || event.personIds.length > 0;
    });

    sampleData.links = (sampleData.links || []).filter(link =>
        !(link.fromType === 'person' && deletedIds.has(link.fromId))
        && !(link.toType === 'person' && deletedIds.has(link.toId))
    );

    clearPeopleSelection();
    const fallbackId = treeDefaultPersonId(currentProjectId());
    if (!getPerson(state.selectedPeopleId)) state.selectedPeopleId = fallbackId;
    if (!getPerson(state.selectedPersonId)) state.selectedPersonId = fallbackId;
    if (deletedIds.has(state.treeCenterTargetId)) state.treeCenterTargetId = fallbackId;

    rebuildSampleEventsAndPruneSourceLinks();
    markPrototypeSessionEdited();
    closeModal();
    render();
    showToast(validIds.length === 1 ? 'Person deleted.' : `${validIds.length} people deleted.`);
}
function bindPeopleToolbarControls(root = main)
{
    root.querySelector('[data-people-mobile-search]')?.addEventListener('click', () =>
    {
        peopleMobileSearchOpen = true;
        root.querySelector('.people-normal-toolbar')?.classList.add('mobile-search-open');
        root.querySelector('#peopleSearch')?.focus();
    });
    root.querySelector('[data-people-mobile-search-close]')?.addEventListener('click', () =>
    {
        peopleMobileSearchOpen = false;
        root.querySelector('.people-normal-toolbar')?.classList.remove('mobile-search-open');
        root.querySelector('[data-people-mobile-search]')?.focus();
    });
    bindSearchInput(root, '#peopleSearch', 'peopleSearch', () =>
    {
        clearPeopleSelection();
        renderPeople();
    });
    bindAppSortControl(root, {
        id: 'peopleSort',
        options: APP_SORT_OPTIONS.people,
        getField: () => state.peopleSort,
        getDirection: () =>
            state.peopleSortDirection,

        onChange: ({
            field,
            direction
        }) =>
        {
            state.peopleSort = field;
            state.peopleSortDirection =
                direction;

            renderPeople();
        }
    });
    root.querySelector('#peopleColumnsButton')?.addEventListener('click', openPeopleColumnsModal);
    root.querySelector('#peopleFilterButton')?.addEventListener('click', event => openPeopleFilterPopover(event.currentTarget));
    root.querySelector('#peopleClearFilters')?.addEventListener('click', clearPeopleFilters);
    root.querySelector('#peopleSaveView')?.addEventListener('click', openSavePeopleViewModal);
    root.querySelectorAll('[data-people-remove-filter]').forEach(button =>
    {
        button.addEventListener('click', () => removePeopleFilter(button.dataset.peopleRemoveFilter));
    });
    root.querySelector('#addPeoplePerson')?.addEventListener('click', () => openAddPersonModal('Add person', 'Create a new person in this project'));
    root.querySelector('[data-people-bulk-add-board]')?.addEventListener('click', () => openGeneographBoardChooser(state.peopleSelectedIds));
    root.querySelector('[data-people-bulk-delete]')?.addEventListener('click', () => openDeletePeopleConfirm(state.peopleSelectedIds));
    root.querySelector('[data-people-bulk-clear]')?.addEventListener('click', () =>
    {
        clearPeopleSelection();
        refreshPeopleSelectionControls();
        main.querySelector('#peopleSearch')?.focus({ preventScroll: true });
    });
}

function refreshPeopleSelectionControls()
{
    const selectedIds = peopleSelectedIdSet();
    const checkboxes = [...main.querySelectorAll('[data-people-select-id]')];
    const visibleIds = new Set(checkboxes.map(checkbox => checkbox.dataset.peopleSelectId));
    const visibleSelected = [...visibleIds].filter(id => selectedIds.has(id)).length;

    for (const checkbox of checkboxes)
    {
        checkbox.checked = selectedIds.has(checkbox.dataset.peopleSelectId);
        checkbox.closest('[data-people-row]')?.classList.toggle('is-selected', checkbox.checked);
    }

    main.querySelectorAll('[data-people-select-visible]').forEach(checkbox =>
    {
        checkbox.checked = visibleIds.size > 0 && visibleSelected === visibleIds.size;
        checkbox.indeterminate = visibleSelected > 0 && !checkbox.checked;
        checkbox.disabled = visibleIds.size === 0;
    });

    const slot = main.querySelector('.people-toolbar-slot');
    const summary = slot?.querySelector('.people-bulk-summary');
    if (selectedIds.size && summary)
    {
        summary.textContent = `${selectedIds.size} selected`;
        localizeUI(summary);
    }
    else if (slot && Boolean(summary) !== Boolean(selectedIds.size))
    {
        slot.innerHTML = selectedIds.size ? renderPeopleBulkToolbar() : renderPeopleNormalToolbar();
        localizeUI(slot);
        bindPeopleToolbarControls(slot);
    }
}

function bindPeopleSelectionControls(rows)
{
    const selectionState = peopleVisibleSelectionState(rows);
    main.querySelectorAll('[data-people-select-visible]').forEach(headerCheckbox =>
    {
        headerCheckbox.checked = selectionState.allVisibleSelected;
        headerCheckbox.indeterminate = selectionState.someVisibleSelected && !selectionState.allVisibleSelected;
        headerCheckbox.disabled = selectionState.visibleIds.length === 0;
        headerCheckbox.addEventListener('click', event =>
        {
            event.stopPropagation();
            const { visibleIds, allVisibleSelected } = peopleVisibleSelectionState(rows);
            const selectedIds = peopleSelectedIdSet();
            visibleIds.forEach(personId =>
            {
                if (allVisibleSelected) selectedIds.delete(personId);
                else selectedIds.add(personId);
            });
            setPeopleSelection([...selectedIds]);
            refreshPeopleSelectionControls();
        });
    });

    main.querySelectorAll('[data-people-select-id]').forEach(checkbox =>
    {
        checkbox.addEventListener('click', event =>
        {
            event.stopPropagation();
            const personId = checkbox.dataset.peopleSelectId;
            togglePeopleSelection(personId, { shiftKey: event.shiftKey, rows });
            refreshPeopleSelectionControls();
            previewPeoplePerson(personId);
        });
    });
}

function updatePeoplePreviewRows(
    personId
)
{
    main
        .querySelectorAll(
            '[data-people-row]'
        )
        .forEach(row =>
        {
            const isPreviewed =
                row.dataset.peopleRow
            === personId;

            row.classList.toggle(
                'is-previewed',
                isPreviewed
            );

            if (isPreviewed)
            {
                row.setAttribute(
                    'aria-current',
                    'true'
                );
            }
            else
            {
                row.removeAttribute(
                    'aria-current'
                );
            }
        });
}

function previewPeoplePerson(
    personId
)
{
    const person =
        getPerson(personId);

    if (
        !person
        || person.projectId
          !== currentProjectId()
    )
    {
        return;
    }

    if (
        state.selectedPeopleId
        === personId
    )
    {
        return;
    }

    state.selectedPeopleId =
        personId;

    state.selectedPersonId =
        personId;

    resetPersonSidebarSections();

    /*
      * Update only the row preview styling.
      * The table DOM and its scroll position
      * remain untouched.
      */
    updatePeoplePreviewRows(
        personId
    );

    /*
      * Replace only the right-side panel.
      * A different person's panel begins
      * at the top.
      */
    rerenderPersonSidebarContext(
        'people',
        {
            preserveScroll: false
        }
    );
}

function bindPeopleTableNavigation(
    rows
)
{
    main
        .querySelectorAll(
            '[data-people-row]'
        )
        .forEach(row =>
        {
            const previewPerson = () =>
            {
                previewPeoplePerson(
                    row.dataset.peopleRow
                );
            };

            row.addEventListener(
                'click',
                event =>
                {
                    if (
                        event.target.closest(
                            [
                                'button',
                                'input',
                                'select',
                                'a',
                                '[data-people-select-id]'
                            ].join(',')
                        )
                    )
                    {
                        return;
                    }

                    previewPerson();
                }
            );

            row.addEventListener(
                'keydown',
                event =>
                {
                    if (
                        event.target !== row
                || event.key !== 'Enter'
                    )
                    {
                        return;
                    }

                    event.preventDefault();

                    previewPerson();
                }
            );
        });
}

function bindPeopleRowActions(rows)
{
    main.querySelectorAll('[data-people-open-profile]').forEach(button => button.addEventListener('click', () => openPeopleProfileFromRow(button.dataset.peopleOpenProfile)));
    main.querySelectorAll('[data-people-row-menu]').forEach(button =>
    {
        button.addEventListener('click', event =>
        {
            event.stopPropagation();
            openPeopleActionsMenu(button.dataset.peopleRowMenu, button, { includeProfile: true });
        });
    });
}

function bindPeoplePaginationControls()
{
    const pageSizeSelect = main.querySelector('#peopleRowsPerPage');
    if (pageSizeSelect) bindPageSizeControl(pageSizeSelect, main);
    main
        .querySelectorAll(
            '[data-people-page]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    if (
                        button.disabled
                    )
                    {
                        return;
                    }

                    const nextPage =
                        Number(
                            button.dataset
                                .peoplePage
                        );

                    if (
                        !Number.isInteger(
                            nextPage
                        )
                || nextPage < 1
                    )
                    {
                        return;
                    }

                    state.peoplePage =
                        nextPage;

                    renderPeople();
                }
            );
        });

    main
        .querySelector(
            '#peopleRowsPerPage'
        )
        ?.addEventListener(
            'change',
            event =>
            {
                const rowsPerPage =
                    normalizePeopleRowsPerPage(
                        event.currentTarget.value
                    );

                state.peopleRowsPerPage =
                    rowsPerPage;

                /*
            * Reset to page 1 because the previous page number
            * may represent a completely different item range.
            */
                state.peoplePage = 1;

                renderPeople();
            }
        );
}

function bindPeopleControls(
    rows
)
{
    main.querySelector('[data-people-add-first]')?.addEventListener('click', () => openAddPersonModal('Add person', 'Create a new person in this project'));
    main.querySelector('[data-people-clear-empty]')?.addEventListener('click', () =>
    {
        state.peopleSearch = '';
        state.peopleFilters = peopleFiltersWithDefaults(defaultPeopleFilters);
        state.peopleSavedViewId = '';
        state.peopleSavedView = 'All people';
        state.peoplePage = 1;
        renderPeople();
    });
    bindPeopleSidebar(main);

    bindPeopleToolbarControls();
    observePeopleTableColumns();

    bindPeoplePaginationControls();

    bindPeopleSelectionControls(
        rows
    );

    bindPeopleTableNavigation(
        rows
    );

    bindPeopleRowActions(
        rows
    );

    bindPersonSidebar(
        main,
        'people'
    );

    bindToasts(main);
}

function bindPeopleSidebar(root)
{
    root.querySelectorAll('[data-saved-view]').forEach(button =>
    {
        button.addEventListener('click', () =>
        {
            applyPeopleSavedView(button.dataset.savedView);
        });
    });

    root.querySelectorAll('[data-saved-view-menu]').forEach(button =>
    {
        button.addEventListener('click', event =>
        {
            event.preventDefault();
            event.stopPropagation();

            openPeopleSavedViewMenu(
                button.dataset.savedViewMenu,
                button
            );
        });
    });

    root
        .querySelector('#peopleSidebarSaveView')
        ?.addEventListener('click', openCreatePeopleFilterModal);

    root
        .querySelector('[data-people-side]')
        ?.addEventListener('click', () =>
        {
            clearPeopleSelection();
            state.peopleView = 'directory';
            state.peopleSide = 'people';
            state.peopleSavedViewId = '';
            state.peopleSavedView = 'All people';
            state.peopleFilters =
                peopleFiltersWithDefaults(
                    defaultPeopleFilters
                );

            renderPeople();
            renderTopbar();
        });

    root
        .querySelector('[data-open-profile]')
        ?.addEventListener('click', () =>
        {
            appNavigationMarkIntent();
            clearPeopleSelection();
            state.peopleView = 'profile';
            renderPeople();
            renderTopbar();
        });

    root.querySelectorAll('[data-placeholder-view]').forEach(button =>
    {
        button.addEventListener('click', () =>
        {
            showToast(
                `${button.dataset.placeholderView} will be built in a later People iteration.`
            );
        });
    });

    bindToasts(root);
}

function connectedSourceFilterOptions()
{
    return archiveProjectSources()
        .map(source => ({
            value: source.id,
            label: source.title || source.id
        }))
        .sort((a, b) =>
            a.label.localeCompare(
                b.label,
                state.language === 'ru' ? 'ru' : 'en'
            )
        );
}

