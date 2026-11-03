function renderAlbumsActiveFilterbar()
{
    const filters =
        state.albumsFilters
        || defaultAlbumFilters;

    const chips = [];
    if (filters.sourceId)
    {
        chips.push([
            'sourceId',
            archiveSourceById(filters.sourceId)?.title
            || translateText('Source')
        ]);
    }
    if (filters.personId)
    {
        chips.push([
            'personId',
            filters.personId === 'none'
                ? 'No people tagged'
                : getPersonDisplayName(
                    filters.personId
                )
        ]);
    }

    if (filters.placeId)
    {
        chips.push([
            'placeId',
            filters.placeId === 'none'
                ? 'No known place'
                : getPlaceDisplay(
                    filters.placeId
                )
        ]);
    }

    if (filters.dateRange)
    {
        chips.push([
            'dateRange',
            filters.dateRange === 'dated'
                ? 'Known date'
                : 'Unknown date'
        ]);
    }

    if (filters.favouriteOnly)
    {
        chips.push([
            'favouriteOnly',
            'Favourites only'
        ]);
    }

    if (!chips.length)
    {
        return '';
    }

    const chipMarkup = chips
        .map(([key, label]) => `
          <span
            class="filter-chip active-filter-chip">

            <span class="active-filter-chip-copy">
              ${escapeHtml(label)}
            </span>

            <button
              class="active-filter-chip-remove"
              type="button"
              data-albums-remove-filter="${escapeHtml(key)}"
              aria-label="Remove ${escapeHtml(label)} filter"
              title="Remove filter">
              ${icon.close}
            </button>
          </span>
        `)
        .join('');

    return `
        <div
          class="albums-active-filterbar"
          aria-label="Active Albums filters">

          ${chipMarkup}

          <span class="active-filter-actions">
            <button
              class="link"
              type="button"
              id="albumsClearFilters">
              Clear all
            </button>
          </span>
        </div>
      `;
}

let albumsFilterReturnFocus =
    null;

function closeAlbumsFilterPopover({
    restoreFocus = false
} = {})
{
    document
        .getElementById(
            'albumsFilterPopover'
        )
        ?.remove();
    document.getElementById('albumsFilterButton')?.setAttribute('aria-expanded', 'false');

    document.removeEventListener(
        'click',
        closeAlbumsFilterOnOutside
    );

    document.removeEventListener(
        'keydown',
        closeAlbumsFilterOnEscape
    );

    if (
        restoreFocus
        && albumsFilterReturnFocus
            ?.isConnected
    )
    {
        albumsFilterReturnFocus.focus({
            preventScroll:
            true
        });
    }

    albumsFilterReturnFocus =
        null;
}

function closeAlbumsFilterOnOutside(
    event
)
{
    const popover =
        document.getElementById(
            'albumsFilterPopover'
        );

    const trigger =
        document.getElementById(
            'albumsFilterButton'
        );

    if (!popover)
    {
        return;
    }

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
            : popover.contains(
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

    closeAlbumsFilterPopover();
}

function closeAlbumsFilterOnEscape(
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

    closeAlbumsFilterPopover({
        restoreFocus:
          true
    });
}

function openAlbumsFilterPopover(
    anchor
)
{
    if (document.getElementById('albumsFilterPopover'))
    {
        closeAlbumsFilterPopover();
        return;
    }
    closeAlbumsFilterPopover();
    closePeopleFilterPopover();
    closeMenu();

    albumsFilterReturnFocus =
        anchor;
    anchor.setAttribute('aria-expanded', 'true');

    const filters =
        albumsFiltersWithDefaults();

    const popover =
        document.createElement(
            'div'
        );

    popover.className =
        'shared-filter-panel albums-shared-filter-popover';

    popover.id =
        'albumsFilterPopover';

    popover.setAttribute(
        'role',
        'dialog'
    );

    popover.setAttribute(
        'aria-label',
        translateText(
            'Filter photos'
        )
    );

    popover.innerHTML = `
        <div
          class="
            shared-filter-panel-header
          ">

          <div>
            <h3>
              Filter photos
            </h3>

            <p>
              Use filters to narrow down
              the view.
            </p>
          </div>

          <button
            class="
              shared-filter-panel-close
            "
            type="button"
            aria-label="Close"
            data-albums-filter-close>

            ${icon.close}
          </button>
        </div>

        <div
          class="
            shared-filter-panel-body
          ">

          ${renderAlbumsFilterFields(
                filters,
                'albums-popover-filter'
            )}
        </div>

        <div
          class="
            shared-filter-panel-footer
          ">

          <button
            class="link"
            type="button"
            data-albums-filter-reset>
            Clear filters
          </button>

          <div
            class="
              shared-filter-panel-actions
            ">

            <button
              class="button secondary"
              type="button"
              data-albums-filter-cancel>
              Cancel
            </button>

            <button
              class="button primary"
              type="button"
              data-albums-filter-apply>
              Apply filters
            </button>
          </div>
        </div>
      `;

    document.body.appendChild(
        popover
    );

    localizeUI(popover);

    const controller =
        bindAlbumsFilterFields(
            popover,
            filters,
            'albums-popover-filter'
        );

    popover
        .querySelector(
            '[data-albums-filter-reset]'
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
            '[data-albums-filter-close]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                closeAlbumsFilterPopover({
                    restoreFocus:
                true
                });
            }
        );

    popover
        .querySelector(
            '[data-albums-filter-cancel]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                closeAlbumsFilterPopover({
                    restoreFocus:
                true
                });
            }
        );

    popover
        .querySelector(
            '[data-albums-filter-apply]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                state.albumsFilters =
                    controller?.getValues()
              || albumsFiltersWithDefaults();

                resetAlbumsPage();

                closeAlbumsFilterPopover();

                renderAlbums();
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
                    '[data-albums-filter-close]'
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
                closeAlbumsFilterOnOutside
            );

            document.addEventListener(
                'keydown',
                closeAlbumsFilterOnEscape
            );
        },
        0
    );
}

function removeAlbumFilter(
    key
)
{
    const definition =
        sharedFilterDefinitionByKey(
            albumsFilterSchema,
            key
        );

    if (!definition)
    {
        return;
    }

    const filters =
        albumsFiltersWithDefaults();

    filters[key] =
        definition.control
          === 'boolean'
            ? false
            : definition.defaultValue
              ?? '';

    state.albumsFilters =
        filters;

    resetAlbumsPage();
    renderAlbums();
}

function clearAlbumFilters()
{
    state.albumsFilters =
        albumsFiltersWithDefaults(
            defaultAlbumFilters
        );

    resetAlbumsPage();
    renderAlbums();
}

