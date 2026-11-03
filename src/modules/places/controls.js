function bindPlaceListRows(root, { showOnMapOnDoubleClick = false } = {})
{
    root.querySelectorAll('.places-list-panel [data-place-id]').forEach(row =>
    {
        row.addEventListener('click', event =>
        {
            if (event.target.closest('button,input,select,a')) return;
            selectPlace(row.dataset.placeId, { focusMap: false });
        });
        row.addEventListener('keydown', event =>
        {
            if (!['Enter', ' '].includes(event.key) || event.target.closest('button,input,select,a')) return;
            event.preventDefault();
            selectPlace(row.dataset.placeId, { focusMap: false });
        });
        if (showOnMapOnDoubleClick)
        {
            row.addEventListener('dblclick', event =>
            {
                if (event.target.closest('button,input,select,a')) return;
                showPlaceOnMap(row.dataset.placeId);
            });
        }
    });
}

function bindPlaceListMenus(root)
{
    root.querySelectorAll('.places-list-panel [data-place-menu]').forEach(button =>
    {
        button.addEventListener('click', event =>
        {
            event.stopPropagation();
            openPlaceActionsMenu(button.dataset.placeMenu, button);
        });
    });
}

function bindPlacesControls(list)
{
    bindSearchInput(
        main,
        '#placesSearch',
        'placesSearch',
        renderPlaces
    );
    main.querySelector('#placesAddPlace')?.addEventListener('click', () => openPlaceModal());
    main.querySelector('#placesMobileAddPlace')?.addEventListener('click', () => openPlaceModal());
    main.querySelector('#placesFilterButton')?.addEventListener('click', event =>
    {
        openPlacesFilterPopover(event.currentTarget);
    });
    bindAppSortControl(main, {
        id: 'placesSort',
        options: APP_SORT_OPTIONS.places,
        getField: () => state.placesSort,
        getDirection: () =>
            state.placesSortDirection,

        onChange: ({
            field,
            direction
        }) =>
        {
            state.placesSort = field;
            state.placesSortDirection =
                direction;

            renderPlacesMain();
        }
    });
    main
        .querySelector(
            '#placesClearFilters'
        )
        ?.addEventListener(
            'click',
            clearPlaceFilters
        );

    main
        .querySelector(
            '#placesSaveFilter'
        )
        ?.addEventListener(
            'click',
            openSaveCurrentPlaceFilterModal
        );

    main
        .querySelectorAll(
            '[data-places-remove-filter]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    removePlaceFilter(
                        button.dataset
                            .placesRemoveFilter
                    );
                }
            );
        });
    main.querySelectorAll('[data-places-mode]').forEach(button => button.addEventListener('click', () =>
    {
        if (placesMapRuntime.mode !== 'browse') cancelPlacesMapEditing();
        state.placesViewMode = button.dataset.placesMode;
        if (state.placesViewMode === 'list') destroyPlacesMap();
        renderPlacesMain();
    }));
    bindPlaceListRows(main, { showOnMapOnDoubleClick: state.placesViewMode === 'list' });
    bindPlaceListMenus(main);
    main.querySelectorAll('[data-place-review-link]').forEach(button => button.addEventListener('click', event =>
    {
        event.stopPropagation();
        openPlacesNeedsReview(button.dataset.placeReviewLink);
    }));
    main
        .querySelector(
            '#placesRouteMenu'
        )
        ?.addEventListener(
            'click',
            event =>
            {
                openPlacesRouteMenu(
                    event.currentTarget
                );
            }
        );
    main.querySelector('[data-route-change]')?.addEventListener('click', event =>
    {
        openPlacesRouteMenu(event.currentTarget);
    });
    main.querySelector('[data-route-panel-clear]')?.addEventListener('click', () =>
    {
        clearPlacesRoute();
        renderPlacesMain();
    });
    bindPlacesInspectorControls(main.querySelector('[data-places-inspector]') || main);
    if (state.placesViewMode === 'map')
    {
        bindPlacesMapEditingControls();
        main.querySelector('[data-map-zoom-in]')?.addEventListener('click', () => placesMapRuntime.map?.zoomIn());
        main.querySelector('[data-map-zoom-out]')?.addEventListener('click', () => placesMapRuntime.map?.zoomOut());
        main.querySelector('[data-map-fit]')?.addEventListener('click', () => fitPlacesMap(list));
    }
    bindToasts(main);
}

function closePlacesFilterPopover()
{
    document
        .getElementById(
            'placesFilterPopover'
        )
        ?.remove();

    document
        .getElementById(
            'placesFilterButton'
        )
        ?.setAttribute(
            'aria-expanded',
            'false'
        );

    document.removeEventListener(
        'click',
        closePlacesFilterOnOutside
    );

    document.removeEventListener(
        'keydown',
        closePlacesFilterOnEscape
    );
}

function closePlacesFilterOnOutside(
    event
)
{
    if (
        !event.target.closest(
            '#placesFilterPopover'
        )
        && !event.target.closest(
            '#placesFilterButton'
        )
    )
    {
        closePlacesFilterPopover();
    }
}

function closePlacesFilterOnEscape(
    event
)
{
    if (event.key === 'Escape')
    {
        closePlacesFilterPopover();
    }
}

function setPlacesFilterPopoverError(
    popover,
    message = ''
)
{
    const error =
        popover.querySelector(
            '[data-place-filter-error]'
        );

    if (!error)
    {
        return;
    }

    error.textContent =
        message;

    error.hidden =
        !message;
}

function openPlacesFilterPopover(
    anchor
)
{
    if (document.getElementById('placesFilterPopover'))
    {
        closePlacesFilterPopover();
        return;
    }
    closePlacesFilterPopover();
    closeMenu();
    const filters =
        placeFiltersWithDefaults();
    const popover =
        document.createElement(
            'div'
        );
    popover.className = `
        people-filter-popover
        places-filter-popover
      `;
    popover.id =
        'placesFilterPopover';
    popover.setAttribute(
        'role',
        'dialog'
    );
    popover.setAttribute(
        'aria-label',
        'Filter places'
    );
    popover.innerHTML = `
        <div
          class="people-filter-popover-header">

          <h3>Filter places</h3>

          <p>
            Refine places by people,
            surnames, dates, event type,
            country, map status, and review.
          </p>
        </div>

        <div class="people-filter-grid">
          ${renderPlaceFilterFields(
                filters,
                'places-popover-filter'
            )}
        </div>

        <p
          class="places-filter-error"
          data-place-filter-error
          role="alert"
          hidden>
        </p>

        <div class="people-filter-footer">
          <button
            class="button secondary"
            type="button"
            data-place-filter-reset>
            Reset
          </button>

          <button
            class="button primary"
            type="button"
            data-place-filter-apply>
            Apply filters
          </button>
        </div>
      `;

    document.body
        .appendChild(popover);

    const rect =
        anchor
            .getBoundingClientRect();

    const margin = 12;

    const left =
        Math.min(
            Math.max(
                margin,
                rect.right
              - popover.offsetWidth
            ),
            Math.max(
                margin,
                window.innerWidth
              - popover.offsetWidth
              - margin
            )
        );

    const below =
        rect.bottom + 8;

    const spaceBelow = window.innerHeight - margin - below;
    const spaceAbove = rect.top - 8 - margin;
    const placeBelow = popover.offsetHeight <= spaceBelow || spaceBelow >= spaceAbove;
    popover.style.maxHeight = `${Math.max(0, placeBelow ? spaceBelow : spaceAbove)}px`;
    const top = placeBelow ? below : rect.top - 8 - popover.offsetHeight;

    popover.style.left =
        `${left}px`;

    popover.style.top =
        `${top}px`;

    anchor.setAttribute(
        'aria-expanded',
        'true'
    );

    popover
        .querySelector(
            '[data-place-filter-reset]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                resetPlaceFilterFields(
                    popover
                );

                setPlacesFilterPopoverError(
                    popover
                );
            }
        );

    popover
        .querySelector(
            '[data-place-filter-apply]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                const submitted =
                    readPlaceFilterFields(
                        popover
                    );

                const yearError =
                    placeFilterYearError(
                        submitted
                    );

                if (yearError)
                {
                    setPlacesFilterPopoverError(
                        popover,
                        yearError
                    );

                    popover
                        .querySelector(
                            '[data-place-filter-input="yearFrom"]'
                        )
                        ?.focus();

                    return;
                }

                state.placesFilters = {
                    ...submitted
                };

                state.placesSavedFilterId =
                    '';
                closePlacesFilterPopover();
                renderPlaces();
            }
        );

    popover.addEventListener(
        'input',
        () =>
        {
            setPlacesFilterPopoverError(
                popover
            );
        }
    );

    popover.addEventListener(
        'change',
        () =>
        {
            setPlacesFilterPopoverError(
                popover
            );
        }
    );

    setTimeout(() =>
    {
        document.addEventListener(
            'click',
            closePlacesFilterOnOutside
        );

        document.addEventListener(
            'keydown',
            closePlacesFilterOnEscape
        );
    }, 0);
}

function openPlaceActionsMenu(
    placeId,
    anchor
)
{
    const place =
        getPlace(placeId);

    if (
        !place
        || !anchor
    )
    {
        return;
    }

    closeMenu();

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
        `${
            Math.max(
                12,
                Math.min(
                    window.innerWidth - 220,
                    rect.right - 200
                )
            )
        }px`;

    const hasCoordinates =
        placeHasCoordinates(
            place
        );

    menu.innerHTML = `
        <button
          type="button"
          data-action="map">
          Show on map
        </button>

        <button
          type="button"
          data-action="edit">
          Edit place
        </button>

        ${
            hasCoordinates
                ? `
              <button
                type="button"
                data-action="copy-coordinates">
                Copy coordinates
              </button>
            `
                : ''
        }

        <button
          class="danger"
          type="button"
          data-action="delete">
          Delete place
        </button>
      `;

    document.body.appendChild(
        menu
    );

    menu.addEventListener(
        'click',
        async event =>
        {
            const action =
                event.target
                    .closest(
                        '[data-action]'
                    )
                    ?.dataset
                    .action;

            if (!action)
            {
                return;
            }

            if (action === 'map')
            {
                showPlaceOnMap(
                    place.id
                );

                return;
            }

            if (action === 'edit')
            {
                closeMenu();

                openPlaceModal(
                    place.id
                );

                return;
            }

            if (action === 'delete')
            {
                closeMenu();

                openDeletePlaceModal(
                    place.id
                );

                return;
            }

            if (
                action
              === 'copy-coordinates'
            )
            {
                const coordinates =
                    formatPlaceCoordinates(
                        place
                    );

                closeMenu();

                try
                {
                    await navigator
                        .clipboard
                        .writeText(
                            coordinates
                        );

                    showToast(
                        'Coordinates copied.'
                    );
                }
                catch
                {
                    showToast(
                        coordinates
                    );
                }
            }
        }
    );

    bindMenuLifecycle(anchor);
}

