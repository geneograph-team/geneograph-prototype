function renderPlaces()
{
    appNavigationObserve();
    if (
        ![
            'all',
            'review'
        ].includes(state.placesView)
    )
    {
        state.placesView = 'all';
    }

    if (
        ![
            'map',
            'list'
        ].includes(
            state.placesViewMode
        )
    )
    {
        state.placesViewMode =
            'map';
    }

    state.placesFilters =
        placeFiltersWithDefaults();

    if (state.placesView === 'review')
    {
        destroyPlacesMap();
    }

    renderPlacesSidebar();
    renderPlacesMain();
}

function renderPlacesSidebar()
{
    const issueCount =
        getPlacesNeedingReview().length;

    const savedFilters =
        placeSavedFiltersForProject();

    const savedFilterMarkup =
        savedFilters
            .map(savedFilter =>
            {
                const active =
                    state.placesSavedFilterId
                === savedFilter.id;

                return `
              <div
                class="
                  people-saved-filter-row
                  ${active ? 'active' : ''}
                ">

                <button
                  class="
                    people-saved-filter-main
                  "
                  type="button"
                  data-place-saved-filter="${
                        escapeHtml(
                            savedFilter.id
                        )
                    }"
                  title="${
                        escapeHtml(
                            savedFilter.name
                        )
                    }">

                  ${icon.folder}

                  <span
                    class="
                      people-saved-filter-name
                    ">
                    ${
                        escapeHtml(
                            savedFilter.name
                        )
                    }
                  </span>
                </button>

                <button
                  class="
                    more-button
                    people-saved-filter-more
                  "
                  type="button"
                  data-place-saved-filter-menu="${
                        escapeHtml(
                            savedFilter.id
                        )
                    }"
                  aria-label="Actions for ${
                        escapeHtml(
                            savedFilter.name
                        )
                    }"
                  aria-haspopup="menu">

                  ${icon.more}
                </button>
              </div>
            `;
            })
            .join('');

    sidebar.innerHTML = `
        <nav
          class="places-sidebar"
          aria-label="Places navigation">

          <div class="places-sidebar-section">
            <div class="side-section-title">
              Navigation
            </div>

            <div class="side-nav places-nav">
              <button
                class="side-link ${
                    state.placesView === 'all'
                  && !state.placesSavedFilterId
                  && !hasActivePlaceFilters()
                        ? 'active'
                        : ''
                }"
                type="button"
                data-places-view="all">

                ${icon.mapPin}
                <span>All places</span>
              </button>

              <button
                class="side-link ${
                    state.placesView === 'review'
                        ? 'active'
                        : ''
                }"
                type="button"
                data-places-view="review">

                ${icon.warning}
                <span>Needs review</span>

                <span class="badge">
                  ${issueCount}
                </span>
              </button>
            </div>
          </div>

          ${state.placesView === 'review' ? '' : `<div class="places-sidebar-section">
            <div class="side-section-title">
              Countries
            </div>

            <div
              class="places-country-tree"
              aria-label="Places by country">
              ${renderPlacesCountryTree()}
            </div>
          </div>

          <div class="places-sidebar-section">
            <div
              class="
                side-section-title
                with-add
              ">

              <span>Saved filters</span>

              <button
                class="side-add-button"
                type="button"
                id="placesSavedFilterPlus"
                aria-label="Create saved filter"
                title="Create saved filter">

                ${icon.plus}
              </button>
            </div>

            <div
              class="
                side-nav
                places-saved-filter-list
              ">

              ${
                    savedFilterMarkup
                || `
                  <p
                    class="
                      places-sidebar-empty
                    ">
                    No saved filters
                  </p>
                `
                }
            </div>
          </div>`}
        </nav>
      `;

    bindPlacesSidebarControls();
}

function renderPlacesCountryTree()
{
    const countries = new Map();
    filteredPlaces().forEach(place =>
    {
        const country = placeCountry(place) || 'Unknown country';
        if (!countries.has(country)) countries.set(country, []);
        countries.get(country).push(place);
    });
    return [...countries.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([country, places]) =>
    {
        const expanded = state.placesExpandedCountries?.includes(country);
        return `<div class="places-country-group">
          <button class="places-country-row" type="button" data-place-country-disclosure="${escapeHtml(country)}" aria-expanded="${expanded}"><span>${escapeHtml(country)}</span>${icon.chevron}</button>
          <div class="places-country-children" ${expanded ? '' : 'hidden'}>${places.sort((a, b) => a.name.localeCompare(b.name)).map(place => `<div class="places-country-place ${state.selectedPlaceId === place.id ? 'active' : ''}" data-place-tree-item="${escapeHtml(place.id)}"><button type="button" data-place-tree-select="${escapeHtml(place.id)}">${icon.mapPin}<span>${escapeHtml(placePrimaryName(place))}</span></button><button class="places-row-more" type="button" data-place-menu="${escapeHtml(place.id)}" aria-label="Actions for ${escapeHtml(placePrimaryName(place))}">${icon.more}</button></div>`).join('')}</div>
        </div>`;
    }).join('') || '<p class="places-sidebar-empty">No places</p>';
}

function bindPlacesSidebarControls()
{
    sidebar
        .querySelectorAll(
            '[data-places-view]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    state.placesView =
                        button.dataset
                            .placesView;

                    state.placesSavedFilterId =
                        '';

                    state.placesFilters = {
                        ...defaultPlaceFilters
                    };

                    state.placesSearch = '';

                    renderPlaces();
                }
            );
        });

    sidebar
        .querySelectorAll(
            '[data-place-country-disclosure]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    const country =
                        button.dataset
                            .placeCountryDisclosure;

                    const expanded =
                        new Set(
                            state
                                .placesExpandedCountries
                  || []
                        );

                    if (expanded.has(country))
                    {
                        expanded.delete(country);
                    }
                    else
                    {
                        expanded.add(country);
                    }

                    state.placesExpandedCountries =
                        [...expanded];

                    renderPlacesSidebar();
                }
            );
        });

    sidebar
        .querySelectorAll(
            '[data-place-tree-select]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    selectPlace(
                        button.dataset
                            .placeTreeSelect,
                        { focusMap: false }
                    );
                }
            );

            button.addEventListener(
                'dblclick',
                () =>
                {
                    showPlaceOnMap(
                        button.dataset
                            .placeTreeSelect
                    );
                }
            );
        });

    sidebar
        .querySelectorAll(
            '[data-place-menu]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                event =>
                {
                    event.stopPropagation();

                    openPlaceActionsMenu(
                        button.dataset
                            .placeMenu,
                        button
                    );
                }
            );
        });

    sidebar
        .querySelectorAll(
            '[data-place-saved-filter]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    applyPlaceSavedFilter(
                        button.dataset
                            .placeSavedFilter
                    );
                }
            );
        });

    sidebar
        .querySelectorAll(
            '[data-place-saved-filter-menu]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                event =>
                {
                    event.stopPropagation();

                    openPlaceSavedFilterMenu(
                        button.dataset
                            .placeSavedFilterMenu,
                        button
                    );
                }
            );
        });

    sidebar
        .querySelector(
            '#placesSavedFilterPlus'
        )
        ?.addEventListener(
            'click',
            openCreatePlaceSavedFilterModal
        );
}

function applyPlaceSavedFilter(
    savedFilterId
)
{
    const savedFilter =
        placeSavedFilterById(
            savedFilterId
        );

    if (!savedFilter)
    {
        showToast(
            'Saved filter not found.'
        );

        return;
    }

    state.placesView =
        'all';

    state.placesSavedFilterId =
        savedFilter.id;

    state.placesFilters = {
        ...defaultPlaceFilters,
        ...savedFilter.filters
    };

    renderPlaces();
}

function generatePlaceSavedFilterName(
    filters = state.placesFilters
)
{
    const entries =
        activePlaceFilterEntries(
            filters
        );

    if (!entries.length)
    {
        return 'Custom place filter';
    }

    return entries
        .slice(0, 2)
        .map(([, , value]) =>
            value
        )
        .join(' - ');
}

function setPlaceSavedFilterModalError(
    message = '',
    focusSelector = ''
)
{
    const error =
        modalBackdrop
            .querySelector(
                '[data-place-saved-filter-error]'
            );

    if (error)
    {
        error.textContent =
            message;

        error.hidden =
            !message;
    }

    if (
        message
        && focusSelector
    )
    {
        modalBackdrop
            .querySelector(
                focusSelector
            )
            ?.focus();
    }
}

function openPlaceSavedFilterModal({
    mode = 'create',
    savedFilterId = '',
    initialName = '',
    initialDescription = '',
    initialFilters =
        defaultPlaceFilters
} = {})
{
    const isEdit =
        mode === 'edit';

    const existing =
        isEdit
            ? placeSavedFilterById(
                savedFilterId
            )
            : null;

    if (
        isEdit
        && !existing
    )
    {
        showToast(
            'Saved filter not found.'
        );

        return;
    }

    const name =
        existing?.name
        || initialName;

    const description =
        existing?.description
        || initialDescription;

    const filters =
        placeFiltersWithDefaults(
            existing?.filters
          || initialFilters
        );

    const title =
        isEdit
            ? 'Edit filter'
            : 'Create filter';

    const subtitle =
        isEdit
            ? 'Update the name, description, or filter conditions.'
            : 'Create a reusable filter for Places.';

    const submitLabel =
        isEdit
            ? 'Save changes'
            : 'Create filter';

    openModal(`
        <div
          class="
            modal
            people-saved-view-modal
            places-saved-filter-modal
          "
          role="dialog"
          aria-modal="true"
          aria-labelledby="placeSavedFilterModalTitle">

          <div class="modal-header">
            <div>
              <h2
                id="placeSavedFilterModalTitle">
                ${escapeHtml(title)}
              </h2>

              <p>
                ${escapeHtml(subtitle)}
              </p>
            </div>

            <button
              class="close-button"
              type="button"
              data-close>
              ${icon.close}
            </button>
          </div>

          <form id="placeSavedFilterForm">
            <div
              class="
                modal-body
                people-saved-view-body
              ">

              <div
                class="
                  people-saved-view-identity
                ">

                <div class="field">
                  <label
                    for="placeSavedFilterName">
                    Name
                  </label>

                  <input
                    id="placeSavedFilterName"
                    required
                    maxlength="80"
                    value="${
                        escapeHtml(name)
                    }"
                    placeholder="e.g. Whiskerfield places">
                </div>

                <div class="field">
                  <label
                    for="placeSavedFilterDescription">
                    Description
                  </label>

                  <textarea
                    id="placeSavedFilterDescription"
                    placeholder="Optional description">${
                        escapeHtml(
                            description
                        )
                    }</textarea>
                </div>
              </div>

              <section
                class="
                  people-saved-view-filters
                "
                aria-labelledby="placeSavedFilterFieldsTitle">

                <div
                  class="
                    people-saved-view-section-header
                  ">

                  <div>
                    <h3
                      id="placeSavedFilterFieldsTitle">
                      Filters
                    </h3>

                    <p>
                      Choose at least one condition
                      for this saved filter.
                    </p>
                  </div>

                  <button
                    class="
                      panel-action
                      people-saved-view-clear
                    "
                    type="button"
                    data-place-saved-filter-clear>
                    Clear filters
                  </button>
                </div>

                <div class="people-filter-grid">
                  ${renderPlaceFilterFields(
                        filters,
                        'place-saved-filter'
                    )}
                </div>

                <p
                  class="
                    people-saved-view-error
                  "
                  data-place-saved-filter-error
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
                ${escapeHtml(
                    submitLabel
                )}
              </button>
            </div>
          </form>
        </div>
      `);

    const form =
        modalBackdrop
            .querySelector(
                '#placeSavedFilterForm'
            );

    const nameInput =
        modalBackdrop
            .querySelector(
                '#placeSavedFilterName'
            );

    nameInput?.focus();

    modalBackdrop
        .querySelector(
            '[data-place-saved-filter-clear]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                resetPlaceFilterFields(
                    form
                );

                setPlaceSavedFilterModalError();
            }
        );

    form?.addEventListener(
        'input',
        () =>
        {
            setPlaceSavedFilterModalError();
        }
    );

    form?.addEventListener(
        'change',
        () =>
        {
            setPlaceSavedFilterModalError();
        }
    );

    form?.addEventListener(
        'submit',
        event =>
        {
            event.preventDefault();

            const submittedName =
                nameInput
                    ?.value
                    .trim()
            || '';

            const submittedDescription =
                modalBackdrop
                    .querySelector(
                        '#placeSavedFilterDescription'
                    )
                    ?.value
                    .trim()
            || '';

            const submittedFilters =
                readPlaceFilterFields(
                    form
                );

            if (!submittedName)
            {
                setPlaceSavedFilterModalError(
                    'Enter a filter name.',
                    '#placeSavedFilterName'
                );

                return;
            }

            const yearError =
                placeFilterYearError(
                    submittedFilters
                );

            if (yearError)
            {
                setPlaceSavedFilterModalError(
                    yearError,
                    '[data-place-filter-input="yearFrom"]'
                );

                return;
            }

            if (
                !hasActivePlaceFilters(
                    submittedFilters
                )
            )
            {
                setPlaceSavedFilterModalError(
                    'Choose at least one filter option.',
                    '[data-place-filter-input]'
                );

                return;
            }

            const duplicate =
                placeSavedFiltersForProject()
                    .find(savedFilter =>
                        savedFilter.id
                  !== savedFilterId
                && savedFilter.name
                    .trim()
                    .toLowerCase()
                  === submittedName
                      .toLowerCase()
                    );

            if (duplicate)
            {
                setPlaceSavedFilterModalError(
                    'A saved filter with this name already exists.',
                    '#placeSavedFilterName'
                );

                return;
            }

            if (isEdit)
            {
                const wasActive =
                    state.placesSavedFilterId
                === existing.id;

                existing.name =
                    submittedName;

                existing.description =
                    submittedDescription;

                existing.filters = {
                    ...submittedFilters
                };

                existing.updatedAt =
                    new Date()
                        .toISOString();

                if (wasActive)
                {
                    state.placesFilters = {
                        ...submittedFilters
                    };
                }

                closeModal();
                renderPlaces();

                showToast(
                    'Filter updated.'
                );

                return;
            }

            const savedFilter = {
                id:
              uniquePlaceSavedFilterId(),

                projectId:
              currentProjectId(),

                name:
              submittedName,

                description:
              submittedDescription,

                filters: {
                    ...submittedFilters
                },

                createdAt:
              new Date()
                  .toISOString(),

                updatedAt:
              new Date()
                  .toISOString()
            };

            sampleData
                .placeSavedFilters
                .push(savedFilter);

            state.placesView =
                'all';

            state.placesSavedFilterId =
                savedFilter.id;

            state.placesFilters = {
                ...submittedFilters
            };

            closeModal();
            renderPlaces();

            showToast(
                'Filter created.'
            );
        }
    );
}

function openCreatePlaceSavedFilterModal()
{
    openPlaceSavedFilterModal({
        mode: 'create',
        initialFilters: {
            ...defaultPlaceFilters
        }
    });
}

function openSaveCurrentPlaceFilterModal()
{
    if (!hasActivePlaceFilters())
    {
        showToast(
            'Add filters before saving a filter.'
        );

        return;
    }

    openPlaceSavedFilterModal({
        mode: 'create',
        initialName:
          generatePlaceSavedFilterName(),

        initialFilters:
          placeFiltersWithDefaults()
    });
}

function openEditPlaceSavedFilterModal(
    savedFilterId
)
{
    openPlaceSavedFilterModal({
        mode: 'edit',
        savedFilterId
    });
}

function openPlaceSavedFilterMenu(
    savedFilterId,
    anchor
)
{
    closeMenu();

    const savedFilter =
        placeSavedFilterById(
            savedFilterId
        );

    if (
        !savedFilter
        || !anchor
    )
    {
        return;
    }

    const rect =
        anchor
            .getBoundingClientRect();

    const menu =
        document.createElement(
            'div'
        );

    menu.className =
        'menu-popover';

    menu.id =
        'projectMenu';

    menu.setAttribute(
        'role',
        'menu'
    );

    menu.setAttribute(
        'aria-label',
        `Actions for ${savedFilter.name}`
    );

    menu.style.top =
        `${rect.bottom + 6}px`;

    menu.style.left =
        `${
            Math.max(
                12,
                rect.right - 190
            )
        }px`;

    menu.innerHTML = `
        <button
          type="button"
          role="menuitem"
          data-place-saved-filter-action="edit">
          Edit filter
        </button>

        <button
          class="danger"
          type="button"
          role="menuitem"
          data-place-saved-filter-action="delete">
          Delete filter
        </button>
      `;

    document.body
        .appendChild(menu);

    menu.addEventListener(
        'click',
        event =>
        {
            const action =
                event.target
                    .closest(
                        '[data-place-saved-filter-action]'
                    )
                    ?.dataset
                    .placeSavedFilterAction;

            if (!action)
            {
                return;
            }

            closeMenu();

            if (action === 'edit')
            {
                openEditPlaceSavedFilterModal(
                    savedFilter.id
                );
            }
            else if (
                action === 'delete'
            )
            {
                openDeletePlaceSavedFilterConfirm(
                    savedFilter.id
                );
            }
        }
    );

    bindMenuLifecycle(anchor);
}

function openDeletePlaceSavedFilterConfirm(
    savedFilterId
)
{
    const savedFilter =
        placeSavedFilterById(
            savedFilterId
        );

    if (!savedFilter)
    {
        showToast(
            'Saved filter not found.'
        );

        return;
    }

    openModal(`
        <div
          class="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="deletePlaceSavedFilterTitle">

          <div class="modal-header">
            <div>
              <h2
                id="deletePlaceSavedFilterTitle">
                Delete saved filter?
              </h2>

              <p>
                Places and linked records
                will not be deleted.
              </p>
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
              <strong>
                ${escapeHtml(
                    savedFilter.name
                )}
              </strong>
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
              id="confirmDeletePlaceSavedFilter">
              Delete filter
            </button>
          </div>
        </div>
      `);

    modalBackdrop
        .querySelector(
            '#confirmDeletePlaceSavedFilter'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                const wasActive =
                    state.placesSavedFilterId
                === savedFilter.id;

                sampleData
                    .placeSavedFilters =
                        (
                            sampleData
                                .placeSavedFilters
                  || []
                        )
                            .filter(item =>
                                item.id
                      !== savedFilter.id
                            );

                if (wasActive)
                {
                    state.placesSavedFilterId =
                        '';

                    state.placesFilters = {
                        ...defaultPlaceFilters
                    };

                    state.placesView =
                        'all';
                }

                closeModal();
                renderPlaces();

                showToast(
                    'Filter deleted.'
                );
            }
        );
}

function filteredPlaces()
{
    let list =
        projectPlaces();

    const filters =
        placeFiltersWithDefaults();

    const context =
        createPlaceFilterContext(list);

    list =
        list.filter(place =>
            placeMatchesFilters(
                place,
                filters,
                context
            )
        );

    const query =
        String(
            state.placesSearch || ''
        )
            .trim()
            .toLowerCase();

    if (query)
    {
        list =
            list.filter(place =>
                [
                    place.name,
                    placePrimaryName(place),
                    placeSecondaryName(place),
                    placeCountry(place),
                    ...placeAlternativeNames(
                        place
                    )
                ]
                    .join(' ')
                    .toLowerCase()
                    .includes(query)
            );
    }

    return appSortRecords(list, {
        field:
          state.placesSort,

        direction:
          state.placesSortDirection,

        extractors: {
            name: {
                type: 'text',

                get: place =>
                    placePrimaryName(place)
              || place.name
            },

            updated: {
                type: 'number',

                get: place =>
                    appSortTimestamp(
                        place.updatedAt
                    )
            },

            created: {
                type: 'number',

                get: place =>
                    appSortTimestamp(
                        place.createdAt
                    )
            }
        },

        getFallback:
          place => place.name
    });
}

function placesPageTitle()
{
    if (
        state.placesSavedFilterId
    )
    {
        return (
            placeSavedFilterById(
                state.placesSavedFilterId
            )?.name
          || 'Saved filter'
        );
    }

    if (
        hasActivePlaceFilters()
    )
    {
        return 'Filtered places';
    }

    return 'Places';
}

function placesPageSubtitle()
{
    if (
        state.placesSavedFilterId
    )
    {
        const savedFilter =
            placeSavedFilterById(
                state.placesSavedFilterId
            );

        return (
            savedFilter?.description
          || 'Explore places matching this saved genealogy filter.'
        );
    }

    if (
        hasActivePlaceFilters()
    )
    {
        return 'Explore places matching the active genealogy filters.';
    }

    return 'Map and organize the places connected to your family history.';
}

function openPlacesNeedsReview(placeId = '')
{
    state.placesView = 'review';
    state.placesSavedFilterId = '';
    state.placesFilters = { ...defaultPlaceFilters };
    if (placeId) state.selectedPlaceId = placeId;
    state.placesReviewFocusId = placeId;
    renderPlaces();
}

function selectedPlaceFromVisibleList(list)
{
    const selected = selectedPlaceFromList(list);
    state.selectedPlaceId = selected?.id || null;
    return selected;
}

function placesInspectorShellClasses()
{
    return [
        'places-shell',
        state.placesInspectorCollapsed ? 'inspector-collapsed' : ''
    ].filter(Boolean).join(' ');
}

function renderPlacesInspectorAside(place)
{
    return `<aside class="places-inspector ${state.placesInspectorCollapsed ? 'collapsed' : ''}" data-places-inspector aria-label="Selected place inspector">${renderPlacesInspector(place)}</aside>`;
}

function placeReviewMatchesSearch(item, query)
{
    if (!query) return true;
    const { place, issue, dismissal } = item;
    const label = issue.type === 'invalid_coordinates'
        ? t('Coordinates need correction')
        : t('Missing map positions');
    return [
        placePrimaryName(place),
        placeSecondaryName(place),
        ...placeAlternativeNames(place),
        t(issue.title),
        label,
        dismissal ? t('Dismissed') : '',
        dismissal ? placeReviewDismissalReason(dismissal) : '',
        dismissal ? t(placeReviewDismissalReason(dismissal)) : ''
    ].join(' ').toLowerCase().includes(query);
}

function placesReviewGroups()
{
    const query = String(state.placesSearch || '').trim().toLowerCase();
    const active = getPlacesNeedingReview()
        .flatMap(place => getActivePlaceReviewIssues(place)
            .map(issue => ({ place, issue, dismissal: null })));
    const dismissed = getDismissedPlaceReviewItems()
        .map(({ place, issue, review }) => ({
            place, issue: review, dismissal: issue
        }));
    const sort = items => items
        .filter(item => placeReviewMatchesSearch(item, query))
        .sort((a, b) => placePrimaryName(a.place)
            .localeCompare(placePrimaryName(b.place)));

    const groups = [
        {
            key: 'invalid_coordinates',
            title: 'Coordinates need correction',
            description: 'The saved coordinates are incomplete or outside the valid range.',
            empty: 'No coordinates need correction.',
            items: sort(active.filter(item => item.issue.type === 'invalid_coordinates'))
        },
        {
            key: 'missing_coordinates',
            title: 'Missing map positions',
            description: 'These places have no identified map position. An exact position is optional.',
            empty: 'No map positions are missing.',
            items: sort(active.filter(item => item.issue.type === 'missing_coordinates'))
        },
        {
            key: 'dismissed',
            title: 'Dismissed',
            description: 'Dismissed warnings can be restored or given an updated reason.',
            empty: 'No dismissed review items.',
            items: sort(dismissed)
        }
    ];
    const dismissedGroup = groups.pop();
    groups.sort((left, right) => right.items.length - left.items.length);
    groups.push(dismissedGroup);

    return { activeCount: active.length, groups };
}

function placeReviewConnectionTotal(place)
{
    return Object.values(getPlaceConnectionCounts(place.id))
        .reduce((total, count) => total + Number(count || 0), 0);
}

function renderPlaceReviewListRow(item)
{
    const { place, issue, dismissal } = item;
    const placeId = escapeHtml(place.id);
    const issueType = escapeHtml(issue.type);
    const placeName = escapeHtml(placePrimaryName(place));
    const linked = placeReviewConnectionTotal(place);
    const selected = place.id === state.selectedPlaceId;
    const issueLabel = issue.type === 'invalid_coordinates'
        ? t('Coordinates need correction')
        : t('Missing map positions');
    const actions = dismissal
        ? `<button class="button ghost places-review-quiet-button" type="button"
              data-place-review-edit-reason="${placeId}"
              data-place-review-type="${issueType}">${escapeHtml(t('Edit reason'))}</button>
            <button class="button secondary places-review-restore-button" type="button"
              data-place-review-restore="${placeId}"
              data-place-review-type="${issueType}">${escapeHtml(t('Restore'))}</button>`
        : `<button class="button secondary places-review-position-button" type="button"
              data-place-review-fix="${placeId}"
              data-place-review-type="${issueType}">
              <span class="places-review-position-icon" aria-hidden="true">${icon.mapPin}</span>
              <span>${escapeHtml(t(issue.actionLabel))}</span></button>
            <button class="button ghost places-review-quiet-button" type="button"
              data-place-review-dismiss="${placeId}"
              data-place-review-type="${issueType}">${escapeHtml(t('Dismiss'))}</button>`;
    const reason = dismissal ? placeReviewDismissalReason(dismissal) : '';
    const localizedReason = reason === PLACE_REVIEW_DEFAULT_MISSING_REASON
        ? t(reason)
        : reason;
    const reasonMarkup = dismissal
        ? `<div class="places-review-reason" data-place-review-reason-editor>
              <p data-place-review-reason-display>
                <strong>${escapeHtml(t('Reason'))}:</strong>
                ${escapeHtml(localizedReason || t('No reason provided'))}
              </p>
              <form hidden data-place-review-reason-form
                data-place-review-place="${placeId}" data-place-review-type="${issueType}">
                <label for="placeReviewReason-${placeId}-${issueType}">${escapeHtml(t('Reason'))}</label>
                <textarea id="placeReviewReason-${placeId}-${issueType}" maxlength="240"
                  rows="2">${escapeHtml(localizedReason)}</textarea>
                <div class="places-review-reason-actions">
                  <button class="button primary" type="submit">${escapeHtml(t('Save reason'))}</button>
                  <button class="button secondary" type="button" data-place-review-cancel-reason>
                    ${escapeHtml(t('Cancel'))}
                  </button>
                </div>
              </form>
            </div>`
        : '';
    return `<div class="places-list-row places-review-list-row
          ${selected ? 'active' : ''}" data-place-id="${placeId}"
          role="listitem" tabindex="0"
          aria-label="${placeName}" ${selected ? 'aria-current="true"' : ''}>
        <div class="places-review-place-info">
          <strong>${placeName}</strong>
          <span>${escapeHtml(placeSecondaryName(place) || t('No broader place recorded'))}</span>
          <small>${escapeHtml(t('Linked records'))}: ${linked}</small>
          ${dismissal ? `<small class="places-review-issue-type">${escapeHtml(issueLabel)}</small>` : ''}
          ${reasonMarkup}
        </div>
        <div class="places-review-row-actions">${actions}</div>
      </div>`;
}

function renderPlaceReviewGroup(group, query)
{
    const isOpen = group.items.length > 0
        && (Boolean(query) || Boolean(state.placesReviewExpandedGroups?.[group.key]));
    return `<details class="places-review-group"
        data-place-review-group="${group.key}" ${isOpen ? 'open' : ''}>
        <summary>
          <strong>${escapeHtml(t(group.title))}</strong>
          <span class="places-review-group-count ${group.key !== 'dismissed' && group.items.length > 0 ? 'is-warning' : ''}">
            ${group.items.length}
          </span>
        </summary>
        <div class="places-review-group-body">
          ${group.items.length
            ? `<p class="places-review-group-description">
                ${icon.info}
                <span>${escapeHtml(t(group.description))}</span>
              </p>`
            : ''}
          ${group.items.length
            ? `<div class="places-review-rows" role="list">
                ${group.items.map(renderPlaceReviewListRow).join('')}
              </div>`
            : `<p class="places-review-group-empty">${escapeHtml(t(group.empty))}</p>`}
        </div>
      </details>`;
}

function renderPlacesNeedsReviewPage()
{
    const review = placesReviewGroups();
    const query = String(state.placesSearch || '').trim();
    const visiblePlaces = review.groups.flatMap(group => group.items.map(item => item.place));
    const selected = selectedPlaceFromVisibleList(visiblePlaces);
    const matches = review.groups.reduce((sum, group) => sum + group.items.length, 0);
    const noResults = query && !matches
        ? `<p class="places-review-no-results" role="status">
            ${escapeHtml(t('No matching review items'))}. ${escapeHtml(t('Try a different search.'))}
          </p>`
        : '';

    main.innerHTML = `<div class="${placesInspectorShellClasses()}">
        <section class="places-main"><div class="places-review-shell">
          <header class="places-page-head places-review-head">
            <div class="places-title"><h1 class="app-page-title">${escapeHtml(t('Needs review'))}</h1>
              <p>${escapeHtml(t('Places with details that may need your attention.'))}</p>
            </div>
            <strong class="places-review-total">${escapeHtml(t('Active items'))}:
              ${review.activeCount}</strong>
          </header>
          <div class="places-review-controls">
            <label class="app-search-field" aria-label="${escapeHtml(t('Search places needing review'))}">
              ${icon.search}<input id="placesReviewSearch" type="search"
                placeholder="${escapeHtml(t('Search review items...'))}"
                value="${escapeHtml(state.placesSearch || '')}">
            </label>
          </div>
          <div class="places-review-content">
            ${noResults}
            <div class="places-list-panel places-review-list-panel"
              role="region" aria-label="${escapeHtml(t('Places needing review'))}">
              ${review.groups.map(group => renderPlaceReviewGroup(group, query)).join('')}
            </div>
          </div>
        </div></section>
        ${renderPlacesInspectorAside(selected)}
      </div>`;

    bindPlacesNeedsReviewControls();
    const focusId = state.placesReviewFocusId;
    state.placesReviewFocusId = '';
    if (focusId) requestAnimationFrame(() =>
    {
        const row = main.querySelector(`.places-review-list-panel [data-place-id="${CSS.escape(focusId)}"]`);
        const details = row?.closest('[data-place-review-group]');
        if (details)
        {
            details.open = true;
            state.placesReviewExpandedGroups[details.dataset.placeReviewGroup] = true;
        }
        row?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        row?.focus({ preventScroll: true });
    });
}

function rerenderPlacesReviewAfterAction(focusPlaceId = '', groupKey = '')
{
    const scrollTop = main.querySelector('.places-review-list-panel')?.scrollTop || 0;
    renderPlaces();
    const panel = main.querySelector('.places-review-list-panel');
    if (panel) panel.scrollTop = scrollTop;
    const group = groupKey && panel?.querySelector(
        `[data-place-review-group="${CSS.escape(groupKey)}"]`
    );
    const row = focusPlaceId && group?.querySelector(
        `[data-place-id="${CSS.escape(focusPlaceId)}"]`
    );
    if (row)
    {
        group.open = true;
        state.placesReviewExpandedGroups[groupKey] = true;
    }
    (row || group?.querySelector('summary'))?.focus({ preventScroll: true });
}

function bindPlacesNeedsReviewControls()
{
    bindSearchInput(main, '#placesReviewSearch', 'placesSearch', renderPlaces);
    bindPlaceListRows(main);

    main.querySelectorAll('[data-place-review-group]').forEach(details =>
    {
        details.addEventListener('toggle', () =>
        {
            state.placesReviewExpandedGroups[details.dataset.placeReviewGroup] = details.open;
        });
    });

    main.querySelectorAll('[data-place-review-fix]').forEach(button => button.addEventListener('click', () =>
    {
        const placeId = button.dataset.placeReviewFix;
        selectPlace(placeId, { focusMap: false });
        openPlaceModalForCoordinateReview(placeId);
    }));

    main.querySelectorAll('[data-place-review-dismiss]').forEach(button => button.addEventListener('click', () =>
    {
        const placeId = button.dataset.placeReviewDismiss;
        const groupKey = button.dataset.placeReviewType;
        if (!dismissPlaceReviewIssue(placeId, groupKey)) return;
        rerenderPlacesReviewAfterAction('', groupKey);
        showToast(t('Review item dismissed.'));
    }));

    main.querySelectorAll('[data-place-review-restore]').forEach(button => button.addEventListener('click', () =>
    {
        const placeId = button.dataset.placeReviewRestore;
        const groupKey = button.dataset.placeReviewType;
        if (!restorePlaceReviewIssue(placeId, groupKey)) return;
        rerenderPlacesReviewAfterAction(placeId, groupKey);
        showToast(t('Review item restored.'));
    }));

    main.querySelectorAll('[data-place-review-reason-editor]').forEach(editor =>
    {
        editor.addEventListener('click', event => event.stopPropagation());
        editor.addEventListener('keydown', event => event.stopPropagation());
    });
    main.querySelectorAll('[data-place-review-edit-reason]').forEach(button => button.addEventListener('click', () =>
    {
        const row = button.closest('.places-review-list-row');
        const form = row?.querySelector('[data-place-review-reason-form]');
        const display = row?.querySelector('[data-place-review-reason-display]');
        if (!form || !display) return;
        form.hidden = false;
        display.hidden = true;
        button.hidden = true;
        form.querySelector('textarea')?.focus();
    }));
    main.querySelectorAll('[data-place-review-reason-form]').forEach(form =>
    {
        const cancel = () =>
        {
            form.hidden = true;
            const display = form.closest('.places-review-list-row')
                ?.querySelector('[data-place-review-reason-display]');
            if (display) display.hidden = false;
            const edit = form.closest('.places-review-list-row')
                ?.querySelector('[data-place-review-edit-reason]');
            if (edit)
            {
                edit.hidden = false;
                edit.focus();
            }
        };
        form.addEventListener('submit', event =>
        {
            event.preventDefault();
            const placeId = form.dataset.placeReviewPlace;
            const issueType = form.dataset.placeReviewType;
            const entered = form.querySelector('textarea')?.value || '';
            const reason = issueType === 'missing_coordinates'
                && entered.trim() === t(PLACE_REVIEW_DEFAULT_MISSING_REASON)
                ? PLACE_REVIEW_DEFAULT_MISSING_REASON
                : entered;
            if (!updatePlaceReviewDismissalReason(placeId, issueType, reason)) return;
            rerenderPlacesReviewAfterAction(placeId, 'dismissed');
            main.querySelector(`[data-place-review-edit-reason="${CSS.escape(placeId)}"]`)
                ?.focus({ preventScroll: true });
            showToast(t('Review reason saved.'));
        });
        form.querySelector('[data-place-review-cancel-reason]')
            ?.addEventListener('click', cancel);
        form.addEventListener('keydown', event =>
        {
            if (event.key !== 'Escape') return;
            event.stopPropagation();
            event.preventDefault();
            cancel();
        });
    });

    bindPlacesInspectorControls(main.querySelector('[data-places-inspector]') || main);
    bindToasts(main);
}

function renderPlacesMain()
{
    if (state.placesView === 'review')
    {
        renderPlacesNeedsReviewPage();
        return;
    }

    const list =
        filteredPlaces();

    const selected =
        selectedPlaceFromVisibleList(list);

    const isPlacesListView =
        state.placesViewMode === 'list';
    const activeFilterCount =
        activePlaceFilterCount();
    const hasActiveFilters =
        activeFilterCount > 0;
    const route =
        normalizePlacesRouteSelection();
    const routeIsShown =
        !isPlacesListView
        && state.placesShowRoute
        && route.configured;
    const shellClasses =
        placesInspectorShellClasses();

    main.innerHTML = `
        <div class="${shellClasses}">
          <section class="places-main">
            <div class="places-page">
              <header class="places-page-head">
                <div class="places-title">
                  <h1 class="app-page-title">
                    ${escapeHtml(placesPageTitle())}
                  </h1>

                  <p>
                    ${escapeHtml(
                        typeof placesPageSubtitle
                        === 'function'
                            ? placesPageSubtitle()
                            : 'Map and organize the places connected to your family history.'
                    )}
                  </p>
                </div>

                <div class="places-header-actions">
                  <button
                    class="button primary"
                    type="button"
                    id="placesAddPlace"
                    aria-label="Add place"
                    title="Add place">
                    ${icon.plus}
                    <span>Add place</span>
                  </button>
                </div>
              </header>

              <div
                class="places-toolbar"
                aria-label="Place controls">

                <div class="places-toolbar-left">
                  <label
                    class="app-search-field"
                    aria-label="Search places">

                    ${icon.search}

                    <input
                      id="placesSearch"
                      type="search"
                      placeholder="Search places..."
                      value="${escapeHtml(
                            state.placesSearch || ''
                        )}">
                  </label>
                </div>
                <div class="places-toolbar-right">
                  <button
                    class="
                      button
                      people-filter-button
                      places-filter-button
                      ${
                            hasActiveFilters
                                ? 'active'
                                : ''
                        }
                    "
                    type="button"
                    id="placesFilterButton"
                    aria-haspopup="dialog"
                    aria-controls="placesFilterPopover"
                    aria-expanded="false"
                    aria-label="${
                        hasActiveFilters
                            ? `Filters, ${activeFilterCount} active`
                            : 'Open place filters'
                    }">

                    <span
                      class="people-filter-icon"
                      aria-hidden="true">

                      ${
                            hasActiveFilters
                                ? icon.filterclear
                                : icon.filter
                        }
                    </span>

                    <span>Filters</span>

                    ${
                        hasActiveFilters
                            ? `
                          <span
                            class="people-filter-count">
                            ${activeFilterCount}
                          </span>
                        `
                            : ''
                    }
                  </button>
                  <button
                    class="button primary places-mobile-add"
                    type="button"
                    id="placesMobileAddPlace"
                    aria-label="Add place"
                    title="Add place">
                    ${icon.plus}
                    <span class="places-mobile-add-full">Add place</span>
                    <span class="places-mobile-add-short">Add</span>
                  </button>
                  ${
                        isPlacesListView
                            ? renderAppSortControl({
                                id:
                            'placesSort',

                                field:
                            state.placesSort,

                                direction:
                            state.placesSortDirection,

                                ariaLabel:
                            'Sort places',

                                options:
                            APP_SORT_OPTIONS.places
                            })
                            : ''
                    }
                  ${!isPlacesListView ? `
                        <button
                          class="
                            button
                            people-filter-button
                            places-route-toolbar-button
                            ${routeIsShown ? 'active' : ''}
                          "
                          type="button"
                          id="placesRouteMenu"
                          aria-label="Route settings"
                          aria-haspopup="dialog"
                          aria-expanded="false"
                          title="Route settings">

                          ${icon.link}

                          <span>Routes</span>
                        </button>
                      `
                            : ''
                    }

                  <div
                    class="albums-view-switch places-view-switch"
                    role="group"
                    aria-label="Places view mode">

                    <button
                      class="
                        toolbar-button
                        albums-view-button
                        places-view-button
                        ${
                            state.placesViewMode === 'map'
                                ? 'active'
                                : ''
                        }
                      "
                      type="button"
                      data-places-mode="map"
                      aria-label="Map view"
                      title="Map view"
                      aria-pressed="${
                            state.placesViewMode === 'map'
                        }">

                      ${icon.map}
                    </button>

                    <button
                      class="
                        toolbar-button
                        albums-view-button
                        places-view-button
                        ${
                            state.placesViewMode === 'list'
                                ? 'active'
                                : ''
                        }
                      "
                      type="button"
                      data-places-mode="list"
                      aria-label="List view"
                      title="List view"
                      aria-pressed="${
                            state.placesViewMode === 'list'
                        }">

                      ${icon.list}
                    </button>
                  </div>
                </div>
              </div>

              ${renderPlacesActiveFilters()}

              ${
                    state.placesViewMode === 'list'
                        ? renderPlacesListPanel(list)
                        : `
                    <div class="places-content map">
                      ${renderPlacesMapShell(list)}
                    </div>
                  `
                }
            </div>
          </section>

          ${renderPlacesInspectorAside(selected)}
        </div>
      `;
    bindPlacesControls(list);
    mountPlacesMobileDetailsClose();
    if (state.placesViewMode === 'map') requestAnimationFrame(() => mountPlacesMap(list));
}

function placeFilterRecordPlaceIds(record)
{
    return [
        record?.placeId,
        record?.birthPlaceId,
        record?.deathPlaceId,
        record?.burialPlaceId,
        ...(
            Array.isArray(record?.placeIds)
                ? record.placeIds
                : []
        )
    ].filter(Boolean);
}

function createPlaceFilterContext(
    places = projectPlaces()
)
{
    const projectId =
        currentProjectId();

    const placeIds =
        new Set(
            places.map(place =>
                place.id
            )
        );

    const eventsByPlaceId =
        new Map();

    const peopleByPlaceId =
        new Map();

    places.forEach(place =>
    {
        eventsByPlaceId.set(
            place.id,
            []
        );

        peopleByPlaceId.set(
            place.id,
            getPeopleForPlace(
                place.id,
                {
                    projectId
                }
            )
        );
    });

    (
        sampleData.events || []
    )
        .filter(event =>
            event.projectId
            === projectId
        )
        .forEach(event =>
        {
            placeFilterRecordPlaceIds(
                event
            ).forEach(placeId =>
            {
                if (!placeIds.has(placeId))
                {
                    return;
                }

                eventsByPlaceId
                    .get(placeId)
                    ?.push(event);
            });
        });

    return {
        eventsByPlaceId,
        peopleByPlaceId
    };
}

function placeFilterDateText(value)
{
    if (
        value === null
        || value === undefined
    )
    {
        return '';
    }

    if (
        typeof value === 'string'
        || typeof value === 'number'
    )
    {
        return String(value);
    }

    return (
        formatGenealogyDateLabel(value)
        || ''
    );
}

function placeEventYearRange(event)
{
    const values = [
        event?.dateLabel,
        event?.date,
        event?.date2Label,
        event?.date2,
        event?.dateRangeLabel,
        event?.fromDate,
        event?.toDate,

        typeof formatGenealogyDateStartLabel
          === 'function'
            ? formatGenealogyDateStartLabel(
                event
            )
            : '',

        typeof formatGenealogyDateEndLabel
          === 'function'
            ? formatGenealogyDateEndLabel(
                event
            )
            : ''
    ];

    const years =
        values
            .map(placeFilterDateText)
            .flatMap(value =>
                String(value)
                    .match(
                        /\b[1-9]\d{2,3}\b/g
                    )
            || []
            )
            .map(Number)
            .filter(year =>
                Number.isInteger(year)
            && year >= 1
            && year <= 9999
            );

    if (!years.length)
    {
        return null;
    }

    return {
        from: Math.min(...years),
        to: Math.max(...years)
    };
}

function placeEventMatchesDateRange(
    event,
    filters
)
{
    const normalized =
        placeFiltersWithDefaults(filters);

    if (
        !normalized.yearFrom
        && !normalized.yearTo
    )
    {
        return true;
    }

    const range =
        placeEventYearRange(event);

    if (!range)
    {
        return false;
    }

    const filterFrom =
        normalized.yearFrom
            ? Number(normalized.yearFrom)
            : Number.NEGATIVE_INFINITY;

    const filterTo =
        normalized.yearTo
            ? Number(normalized.yearTo)
            : Number.POSITIVE_INFINITY;

    return (
        range.from <= filterTo
        && range.to >= filterFrom
    );
}

function eventLinkedPersonIds(event)
{
    return new Set([
        ...(
            Array.isArray(event?.personIds)
                ? event.personIds
                : []
        ),

        ...(
            Array.isArray(
                event?.relatedPersonIds
            )
                ? event.relatedPersonIds
                : []
        )
    ]);
}

function placeMatchesFilters(
    place,
    filters,
    context
)
{
    const normalized =
        placeFiltersWithDefaults(filters);

    if (
        normalized.country
        && placeCountry(place)
          !== normalized.country
    )
    {
        return false;
    }

    if (
        normalized.mapped === 'mapped'
        && !placeHasCoordinates(place)
    )
    {
        return false;
    }

    if (
        normalized.mapped === 'unmapped'
        && placeHasCoordinates(place)
    )
    {
        return false;
    }

    const linkedPeople =
        context.peopleByPlaceId
            .get(place.id)
        || [];

    const hasPersonCondition =
        Boolean(
            normalized.personId
          || normalized.surname
        );

    const matchingPeople =
        linkedPeople.filter(person =>
        {
            if (
                normalized.personId
            && person.id
              !== normalized.personId
            )
            {
                return false;
            }

            if (
                normalized.surname
            && placeFilterPersonSurname(
                person
            ).toLowerCase()
              !== normalized.surname
                  .toLowerCase()
            )
            {
                return false;
            }

            return true;
        });

    if (
        hasPersonCondition
        && !matchingPeople.length
    )
    {
        return false;
    }

    const hasEventCondition =
        Boolean(
            normalized.eventType
          || normalized.yearFrom
          || normalized.yearTo
        );

    if (hasEventCondition)
    {
        const linkedEvents =
            context.eventsByPlaceId
                .get(place.id)
          || [];

        const matchingPersonIds =
            new Set(
                matchingPeople.map(person =>
                    person.id
                )
            );

        const eventMatches =
            linkedEvents.some(event =>
            {
                if (
                    normalized.eventType
              && event.type
                !== normalized.eventType
                )
                {
                    return false;
                }

                if (
                    !placeEventMatchesDateRange(
                        event,
                        normalized
                    )
                )
                {
                    return false;
                }

                /*
            * When person/surname and event/date
            * filters are combined, require one
            * event associated with the matching
            * person rather than unrelated records
            * at the same place.
            */
                if (
                    hasPersonCondition
                )
                {
                    const eventPeople =
                        eventLinkedPersonIds(
                            event
                        );

                    if (
                        ![
                            ...matchingPersonIds
                        ].some(personId =>
                            eventPeople.has(personId)
                        )
                    )
                    {
                        return false;
                    }
                }

                return true;
            });

        if (!eventMatches)
        {
            return false;
        }
    }

    return true;
}

function renderPlacesListPanel(list)
{
    if (!list.length) return '<div class="places-empty"><strong>No places found</strong><span>Try clearing the search or filters.</span></div>';
    return `
        <div class="places-list-panel">

          <div class="places-list-head">
            <span>Place</span>
            <span>Country</span>
            <span>Map</span>
            <span>Linked people</span>
            <span>Updated</span>
            <span>Actions</span>
          </div>

          ${list.map(place =>
            {
                const counts =
                    getPlaceConnectionCounts(
                        place.id
                    );

                const linkedPeople = counts.people;
                const issueCount = getActivePlaceReviewIssues(place).length;
                const reviewIndicator = issueCount
                    ? `<button class="places-list-review" type="button" data-place-review-link="${escapeHtml(place.id)}">${issueCount > 1 ? `${issueCount} issues` : 'Needs review'}</button>`
                    : '';
                return `<div class="places-list-row ${place.id === state.selectedPlaceId ? 'active' : ''}" data-place-id="${escapeHtml(place.id)}" tabindex="0" role="row" aria-selected="${place.id === state.selectedPlaceId}"><div><strong>${escapeHtml(placePrimaryName(place))}</strong><span>${escapeHtml(placeSecondaryName(place) || 'No broader place recorded')}</span><small class="places-list-mobile-status">${escapeHtml(t(placeHasCoordinates(place) ? 'On map' : 'Not on map'))}</small>${reviewIndicator}</div><span class="places-list-country">${escapeHtml(placeCountry(place) || 'Unknown')}</span><span class="places-list-map-state">${placeHasCoordinates(place) ? 'On map' : 'Not on map'}</span><span class="places-list-people"><span class="places-list-people-mobile-label">${escapeHtml(t('Linked people'))}: </span>${linkedPeople}</span><span class="places-list-updated">${escapeHtml(formatPlaceUpdatedAt(place.updatedAt))}</span>${place.id === state.selectedPlaceId ? `<button class="mobile-item-details" type="button" data-mobile-open-details aria-label="${escapeHtml(t('Details'))}">${icon.info}<span>${escapeHtml(t('Details'))}</span></button>` : ''}<button class="places-row-more" type="button" data-place-menu="${escapeHtml(place.id)}" aria-label="More actions for ${escapeHtml(place.name)}" aria-haspopup="menu">${icon.more}</button></div>`;
            }).join('')}</div>`;
}

function routeExcludedReasonSummary(route)
{
    const counts = route?.excludedByReason || {};
    return [
        counts.missingDate ? `${counts.missingDate} ${t('undated')}` : '',
        counts.missingYear ? `${counts.missingYear} ${t('without a known year')}` : '',
        counts.missingPlace ? `${counts.missingPlace} ${t('without place')}` : '',
        counts.missingCoordinates ? `${counts.missingCoordinates} ${t('unmapped')}` : ''
    ].filter(Boolean).join(' - ');
}

function renderPlacesRouteSummary()
{
    if (!state.placesShowRoute) return '';
    const route = normalizePlacesRouteSelection();
    if (!route.configured) return '';
    const metrics = [
        `${route.stops.length} ${t(route.stops.length === 1 ? 'stop' : 'stops')}`,
        `${route.distinctPlaceCount} ${t(route.distinctPlaceCount === 1 ? 'place' : 'places')}`,
        route.mode === 'surname'
            ? `${route.peopleCount} ${t(route.peopleCount === 1 ? 'person' : 'people')}`
            : '',
        route.dateSpan
    ].filter(Boolean).join(' - ');
    const excludedSummary = routeExcludedReasonSummary(route);
    return `
        <section class="places-route-summary ${route.available ? '' : 'is-unavailable'}" aria-live="polite" aria-label="${escapeHtml(t('Active route'))}">
          <div class="places-route-summary-head">
            <div class="places-route-summary-icon" aria-hidden="true">${route.available ? icon.link : icon.warning}</div>
            <div class="places-route-summary-title">
              <strong>${escapeHtml(route.subject)}</strong>
              <span>${escapeHtml(t(route.mode === 'surname' ? 'Surname route' : 'Person route'))}</span>
            </div>
            <div class="places-route-summary-actions">
              <button class="places-route-change" type="button" data-route-change>${escapeHtml(t('Change'))}</button>
              <button class="places-route-clear" type="button" data-route-panel-clear aria-label="${escapeHtml(t('Clear route'))}" title="${escapeHtml(t('Clear route'))}">${icon.close}</button>
            </div>
          </div>
          ${route.available
                ? `<div class="places-route-summary-metrics">${escapeHtml(metrics)}</div>`
                : `<div class="places-route-summary-warning">${escapeHtml(t('Route needs at least two dated, mapped places.'))}</div>`}
          ${route.available && routeHasApproximateStops(route)
                ? `<div class="places-route-summary-estimate" role="note">${icon.info}
                    <span>${escapeHtml(t('Route uses representative centers for approximate stops, not measured historical travel distances.'))}</span>
                  </div>` : ''}
          ${route.excludedCount > 0
                ? `<div class="places-route-summary-excluded">${route.excludedCount} ${escapeHtml(t(route.excludedCount === 1 ? 'event excluded' : 'events excluded'))}${excludedSummary ? ` - ${escapeHtml(excludedSummary)}` : ''}</div>`
                : ''}
        </section>`;
}

function renderPlacesMapShell(list)
{
    const route = normalizePlacesRouteSelection();
    return `
        <section
          class="places-map-panel"
          aria-label="Places map">

          <div
            id="placesVectorMap"
            class="places-vector-map">
          </div>

          ${renderPlacesRouteSummary()}

          <div class="places-map-navigation-wrap">
            <div
              class="places-map-legend"
              id="placesMapInfoPanel"
              role="region"
              aria-label="Map legend"
              ${
                    state.placesMapInfoExpanded
                        ? ''
                        : 'hidden'
                }>

              <strong class="places-map-legend-title">
                Map legend
              </strong>

              <div class="places-map-legend-item">
                <span
                  class="places-map-legend-marker"
                  aria-hidden="true">
                </span>

                <span>Place</span>
              </div>

              <div class="places-map-legend-item">
                <span
                  class="
                    places-map-legend-marker
                    selected
                  "
                  aria-hidden="true">
                </span>

                <span>Selected place</span>
              </div>

              ${list.some(placeHasApproximateArea)
                    || (state.placesShowRoute && route.available && routeHasApproximateStops(route))
                ? `<div class="places-map-legend-item">
                    <span class="places-map-legend-area" aria-hidden="true"></span>
                    <span>${escapeHtml(t('Approximate location'))}</span>
                  </div>` : ''}

              ${state.placesShowRoute && route.available ? `
                <div class="places-map-legend-item">
                  <span class="places-map-legend-route" aria-hidden="true"></span>
                  <span>${escapeHtml(t(route.mode === 'surname' ? 'Surname route' : 'Person route'))}</span>
                </div>` : ''}
            </div>

            <div
              class="places-map-navigation"
              aria-label="Map navigation">

              <button
                type="button"
                data-map-zoom-out
                aria-label="Zoom out"
                title="Zoom out">
                ${icon.minus || icon.close}
              </button>

              <button
                type="button"
                data-map-zoom-in
                aria-label="Zoom in"
                title="Zoom in">
                ${icon.plus}
              </button>

              <button
                type="button"
                data-map-fit
                aria-label="Centre map on places"
                title="Centre map on places">
                ${icon.mapCenter}
              </button>

              <button
                class="${
                    state.placesMapInfoExpanded
                        ? 'active'
                        : ''
                }"
                type="button"
                id="placesMapInfoToggle"
                aria-label="Show map legend"
                title="Map legend"
                aria-controls="placesMapInfoPanel"
                aria-expanded="${
                    state.placesMapInfoExpanded
                }">
                ${icon.help || icon.tip}
              </button>
            </div>
          </div>

          <div
            class="places-map-status"
            data-places-map-status
            hidden>
          </div>

          <div
            class="places-coordinate-bar"
            data-places-coordinate-bar
            hidden>

            <div class="places-coordinate-summary">
              <strong data-places-coordinate-output>
                No point selected
              </strong>

              <span
                data-places-map-instruction
                hidden>
              </span>
            </div>

            <button
              class="button secondary"
              type="button"
              id="placesUseMapCentre">
              Use map centre
            </button>

            <button
              class="button secondary"
              type="button"
              id="placesCopyCoordinates"
              disabled>
              Copy
            </button>

            <button
              class="button secondary"
              type="button"
              id="placesCancelMapEdit">
              Cancel
            </button>

            <button
              class="button primary"
              type="button"
              id="placesConfirmMapEdit"
              disabled>
              Use position
            </button>
          </div>
        </section>
      `;
}

