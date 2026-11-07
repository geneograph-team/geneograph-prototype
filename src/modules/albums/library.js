function albumContext()
{
    if (
        state.albumsView === 'album'
    )
    {
        const album =
            getProjectAlbums()
                .find(
                    item =>
                        item.id
                  === state.activeAlbumId
                );

        return {
            title:
            album?.name
            || 'Album',

            subtitle:
            album?.description
            || 'Album photos',

            empty:
            'This album has no photos yet.'
        };
    }

    const contexts = {
        favorites: {
            title:
            'Favourites',

            subtitle:
            'Photos marked as favourites.',

            empty:
            'No favorite photos yet.'
        },

        unassigned: {
            title:
            'Not in an album',

            subtitle:
            'Photos waiting to be organized.',

            empty:
            'Every active photo belongs to an album.'
        }
    };

    return (
        contexts[state.albumsView]
        || {
            title:
            'All photos',

            subtitle:
            'Your photos and visual memories.',

            empty:
            'No photos match this view.'
        }
    );
}

function photoSearchText(photo)
{
    return [
        photo.title,
        photo.filename,
        photo.caption,
        photo.placeText,
        getPlaceDisplay(photo.placeId),
        ...getPhotoPeople(photo).map(person => person.names?.display || ''),
        ...(photo.albumIds || []).map(getAlbumName)
    ].join(' ').toLowerCase();
}

function filteredAlbumPhotos()
{
    let photos =
        getProjectPhotos(
            currentProjectId()
        );

    if (
        state.albumsView === 'album'
    )
    {
        photos =
            photos.filter(
                photo =>
                    (
                        photo.albumIds || []
                    ).includes(
                        state.activeAlbumId
                    )
            );
    }
    else if (
        state.albumsView
          === 'favorites'
    )
    {
        photos =
            photos.filter(
                photo =>
                    photo.favorite
            );
    }
    else if (
        state.albumsView
          === 'unassigned'
    )
    {
        photos =
            photos.filter(
                photo =>
                    !(
                        photo.albumIds || []
                    ).length
            );
    }

    const query =
        String(
            state.albumsSearch || ''
        )
            .trim()
            .toLowerCase();

    if (query)
    {
        photos =
            photos.filter(
                photo =>
                    photoSearchText(
                        photo
                    ).includes(query)
            );
    }

    const filters =
        state.albumsFilters
        || defaultAlbumFilters;
    if (filters.sourceId)
    {
        const linkedPhotoIds = new Set(
            archiveSourceConnectionRecords(
                archiveSourceById(filters.sourceId),
                'photo'
            ).map(photo => photo.id)
        );

        photos = photos.filter(photo =>
            linkedPhotoIds.has(photo.id)
        );
    }
    if (
        filters.personId === 'none'
    )
    {
        photos =
            photos.filter(
                photo =>
                    !(
                        photo.personIds || []
                    ).length
            );
    }
    else if (
        filters.personId
    )
    {
        photos =
            photos.filter(
                photo =>
                    (
                        photo.personIds || []
                    ).includes(
                        filters.personId
                    )
            );
    }

    if (
        filters.placeId === 'none'
    )
    {
        photos =
            photos.filter(
                photo =>
                    !photo.placeId
              && !photo.placeText
            );
    }
    else if (
        filters.placeId
    )
    {
        photos =
            photos.filter(
                photo =>
                    photo.placeId
                === filters.placeId
            );
    }

    if (
        filters.favouriteOnly
    )
    {
        photos =
            photos.filter(
                photo =>
                    photo.favorite
            );
    }

    if (
        filters.dateRange
          === 'dated'
    )
    {
        photos =
            photos.filter(
                photo =>
                    photoDateModel(photo).state === 'known'
            );
    }

    if (
        filters.dateRange
          === 'unknown'
    )
    {
        photos =
            photos.filter(
                photo =>
                    photoDateModel(photo).state !== 'known'
            );
    }
    return appSortRecords(photos, {
        field:
          state.albumsSort,

        direction:
          state.albumsSortDirection,

        extractors: {
            photoName: {
                type: 'text',
                get: photo =>
                    photo.title
            },

            updated: {
                type: 'number',
                get: photo =>
                    appSortTimestamp(
                        photo.updatedAt
                    )
            },

            added: {
                type: 'number',
                get: photo =>
                    appSortTimestamp(
                        photo.createdAt
                    )
            }
        },

        getFallback:
          photo =>
              photo.title
            || photo.filename
    });
}

const ALBUMS_ROWS_PER_PAGE_OPTIONS =
    Object.freeze([
        10,
        25,
        50,
        100
    ]);

function normalizeAlbumsRowsPerPage(
    value = state.albumsRowsPerPage
)
{
    const parsedValue =
        Number(value);

    return ALBUMS_ROWS_PER_PAGE_OPTIONS
        .includes(parsedValue)
        ? parsedValue
        : 10;
}

function resetAlbumsPage()
{
    state.albumsPage = 1;
}

function getAlbumsPagination(
    totalCount
)
{
    const total =
        Math.max(
            0,
            Number(totalCount) || 0
        );

    const rowsPerPage =
        normalizeAlbumsRowsPerPage();

    state.albumsRowsPerPage =
        rowsPerPage;

    const totalPages =
        Math.max(
            1,
            Math.ceil(
                total / rowsPerPage
            )
        );

    const currentPage =
        Math.min(
            totalPages,
            Math.max(
                1,
                Math.trunc(
                    Number(state.albumsPage)
              || 1
                )
            )
        );

    /*
      * Clamp the stored page when deletions or filters
      * reduce the number of available pages.
      */
    state.albumsPage =
        currentPage;

    const startIndex =
        total
            ? (
                currentPage - 1
            ) * rowsPerPage
            : 0;

    const endIndex =
        Math.min(
            startIndex + rowsPerPage,
            total
        );

    return {
        totalCount:
          total,

        rowsPerPage,

        totalPages,

        currentPage,

        startIndex,

        endIndex,

        firstVisible:
          total
              ? startIndex + 1
              : 0,

        lastVisible:
          total
              ? endIndex
              : 0
    };
}

function getAlbumsListPage(
    photos = filteredAlbumPhotos()
)
{
    const source =
        Array.isArray(photos)
            ? photos
            : [];

    const pagination =
        getAlbumsPagination(
            source.length
        );

    return {
        pagination,

        photos:
          source.slice(
              pagination.startIndex,
              pagination.endIndex
          )
    };
}

function currentAlbumsPagePhotos()
{
    const photos =
        filteredAlbumPhotos();

    /*
      * Grid view remains unpaginated.
      */
    if (
        state.albumsViewMode !== 'list'
    )
    {
        return photos;
    }

    return getAlbumsListPage(
        photos
    ).photos;
}

function ensureSelectedAlbumPhotoOnListPage()
{
    if (
        state.albumsViewMode !== 'list'
    )
    {
        return;
    }

    const pagePhotos =
        currentAlbumsPagePhotos();

    const selectedIsOnPage =
        pagePhotos.some(photo =>
            photo.id === state.selectedPhotoId
        );

    if (selectedIsOnPage)
    {
        return;
    }

    const nextPhotoId =
        pagePhotos[0]?.id
        || null;

    if (
        nextPhotoId
          !== state.selectedPhotoId
    )
    {
        resetAlbumsPhotoEditState();
    }

    state.selectedPhotoId =
        nextPhotoId;
}

function renderAlbumsPagination(
    pagination
)
{
    if (
        pagination.totalPages <= 1
    )
    {
        return '';
    }

    /*
      * Reuse the existing pure page-token helper.
      * Do not rename or modify the People implementation.
      */
    const tokens =
        peoplePaginationTokens(
            pagination.currentPage,
            pagination.totalPages
        );

    return `
        <nav
          class="pagination"
          aria-label="Photo pages">

          <button
            class="
              page-button
              icon-rotate-left
            "
            type="button"
            data-albums-page="${
                pagination.currentPage - 1
            }"
            aria-label="Previous page"
            ${
                pagination.currentPage === 1
                    ? 'disabled'
                    : ''
            }>
            ${icon.chevron}
          </button>

          ${tokens.map(
                (token, index) =>
                {
                    if (
                        token === 'ellipsis'
                    )
                    {
                        return `
                  <span
                    class="pagination-ellipsis"
                    aria-hidden="true"
                    data-pagination-gap="${
                        index
                    }">
                    …
                  </span>
                `;
                    }

                    const active =
                        token
                  === pagination.currentPage;

                    return `
                <button
                  class="
                    page-button
                    ${active ? 'active' : ''}
                  "
                  type="button"
                  data-albums-page="${token}"
                  aria-label="Go to page ${token}"
                  ${
                        active
                            ? 'aria-current="page"'
                            : ''
                    }>
                  ${token}
                </button>
              `;
                }
            ).join('')}

          <button
            class="page-button"
            type="button"
            data-albums-page="${
                pagination.currentPage + 1
            }"
            aria-label="Next page"
            ${
                pagination.currentPage
                === pagination.totalPages
                    ? 'disabled'
                    : ''
            }>
            ${icon.chevron}
          </button>
        </nav>
      `;
}

function renderAlbumsListFooter(
    pagination
)
{
    const rangeLabel =
        pagination.totalCount
            ? `${
                pagination.firstVisible
            }–${
                pagination.lastVisible
            }`
            : '0';

    const noun =
        pagination.totalCount === 1
            ? 'photo'
            : 'photos';

    return `
        <div
          class="
            table-footer
            people-table-footer
            albums-list-footer
          ">

          <span
            class="people-table-footer-summary"
            aria-live="polite">
            Showing ${rangeLabel}
            of ${pagination.totalCount}
            ${noun}
          </span>

          ${renderAlbumsPagination(
                pagination
            )}

          <label
            class="people-rows-per-page"
            for="albumsRowsPerPage">

            <span
              class="people-rows-per-page-label">
              Rows per page
            </span>

            <span
              class="
                common-select-shell
                people-rows-select-shell
              ">

              <select
                class="
                  common-select
                  people-rows-select
                "
                id="albumsRowsPerPage"
                aria-label="Rows per page">

                ${ALBUMS_ROWS_PER_PAGE_OPTIONS
                    .map(option => `
                    <option
                      value="${option}"
                      ${
                            pagination.rowsPerPage
                          === option
                                ? 'selected'
                                : ''
                        }>
                      ${option}
                    </option>
                  `)
                    .join('')}
              </select>

              <span
                class="
                  common-select-chevron
                  people-rows-select-chevron
                "
                aria-hidden="true">
                ${icon.chevron}
              </span>
            </span>
          </label>
        </div>
      `;
}

function ensureSelectedAlbumPhoto()
{
    const visible =
        filteredAlbumPhotos();

    const currentIsVisible =
        visible.some(
            photo =>
                photo.id === state.selectedPhotoId
        );

    if (!currentIsVisible)
    {
        const nextPhotoId =
            visible[0]?.id
          || null;

        if (
            nextPhotoId
          !== state.selectedPhotoId
        )
        {
            resetAlbumsPhotoEditState();
        }

        state.selectedPhotoId =
            nextPhotoId;
    }

    const visibleIds =
        new Set(
            visible.map(photo => photo.id)
        );

    state.selectedPhotoIds =
        (state.selectedPhotoIds || [])
            .filter(
                id => visibleIds.has(id)
            );
}

function albumFilterCount(
    filters = state.albumsFilters
)
{
    const normalized =
        albumsFiltersWithDefaults(
            filters
        );

    return albumsFilterSchema
        .filter(definition =>
            sharedFilterValueIsActive(
                definition,
                normalized[
                    definition.key
                ]
            )
        )
        .length;
}

function albumsHaveActiveQuery()
{
    return Boolean(String(state.albumsSearch || '').trim() || albumFilterCount());
}

let albumsGridResizeObserver = null;
let albumsGridResizeFrame = null;

function disconnectAlbumsGridResizeObserver()
{
    albumsGridResizeObserver?.disconnect();
    albumsGridResizeObserver = null;
    if (albumsGridResizeFrame !== null)
    {
        cancelAnimationFrame(albumsGridResizeFrame);
        albumsGridResizeFrame = null;
    }
}

function updateAlbumsGridLayout()
{
    if (state.activeModule !== 'Albums' || state.albumsViewMode !== 'grid') return;
    const content = main.querySelector('.albums-content');
    if (!content?.querySelector('[data-albums-justified-grid]')) return;
    const photos = filteredAlbumPhotos();
    if (!photos.length) return;
    content.innerHTML = renderAlbumsGrid(photos);
    bindAlbumsCardControls(content);
}

function bindAlbumsGridResizeObserver()
{
    disconnectAlbumsGridResizeObserver();
    if (state.activeModule !== 'Albums' || state.albumsViewMode !== 'grid') return;
    const content = main.querySelector('.albums-content');
    if (!content?.querySelector('[data-albums-justified-grid]')) return;

    albumsGridResizeObserver = new ResizeObserver(entries =>
    {
        const width = entries[0]?.contentRect?.width;
        if (!Number.isFinite(width) || width <= 0) return;
        if (Math.abs(width - Number(state.albumsGridWidth || 0)) < 1.5) return;
        if (albumsGridResizeFrame !== null) cancelAnimationFrame(albumsGridResizeFrame);
        albumsGridResizeFrame = requestAnimationFrame(() =>
        {
            albumsGridResizeFrame = null;
            state.albumsGridWidth = width;
            updateAlbumsGridLayout();
        });
    });

    albumsGridResizeObserver.observe(content);
}

function renderAlbumsPreserveViewport({
    focusPhotoId = '',
    focusTarget = ''
} = {})
{
    const scrollSelector =
        innerWidth <= 900
            ? '.albums-main'
            : '.albums-content';

    const content =
        main.querySelector(scrollSelector);

    const detail =
        main.querySelector(
            '.albums-detail'
        );

    const detailScrollTop =
        detail?.scrollTop || 0;

    const scrollTop =
        content?.scrollTop || 0;

    const scrollLeft =
        content?.scrollLeft || 0;

    renderAlbums();

    requestAnimationFrame(() =>
    {
        const nextContent =
            main.querySelector(scrollSelector);

        if (nextContent)
        {
            const maximumTop =
                Math.max(
                    0,
                    nextContent.scrollHeight
              - nextContent.clientHeight
                );

            const nextDetail =
                main.querySelector(
                    '.albums-detail'
                );

            if (nextDetail)
            {
                const maximumDetailTop =
                    Math.max(
                        0,
                        nextDetail.scrollHeight
              - nextDetail.clientHeight
                    );

                nextDetail.scrollTop =
                    Math.min(
                        detailScrollTop,
                        maximumDetailTop
                    );
            }

            const maximumLeft =
                Math.max(
                    0,
                    nextContent.scrollWidth
              - nextContent.clientWidth
                );

            nextContent.scrollTop =
                Math.min(
                    scrollTop,
                    maximumTop
                );

            nextContent.scrollLeft =
                Math.min(
                    scrollLeft,
                    maximumLeft
                );
        }

        if (!focusPhotoId)
        {
            return;
        }

        const escapedPhotoId =
            CSS.escape(focusPhotoId);

        const focusSelectors = {
            card:
            `[data-photo-id="${escapedPhotoId}"]`,

            selection:
            `[data-photo-check="${escapedPhotoId}"]`,

            favorite:
            `.albums-main [data-photo-fav="${escapedPhotoId}"]`,

            favoriteDetail:
            `.albums-detail [data-photo-fav="${escapedPhotoId}"]`
        };

        const selector =
            focusSelectors[focusTarget]
          || focusSelectors.card;

        main
            .querySelector(selector)
            ?.focus({
                preventScroll: true
            });
    });
}

function renderAlbums()
{
    appNavigationObserve();
    disconnectAlbumsGridResizeObserver();

    const scrollKey =
        `${state.albumsView}:${state.activeAlbumId || ''}`;
    const previousMain =
        main.querySelector('.albums-main');
    const previousDetailScrollTop = main.querySelector('.albums-detail')?.scrollTop || 0;
    const mobileScrollTop =
        innerWidth <= 900
        && previousMain?.dataset.albumsScrollKey === scrollKey
            ? previousMain.scrollTop
            : 0;

    ensureSelectedAlbumPhoto();
    ensureSelectedAlbumPhotoOnListPage();

    const selectedPhoto =
        getPhoto(
            state.selectedPhotoId,
            {
                projectId:
              currentProjectId()
            }
        );

    if (!selectedPhoto)
    {
        resetAlbumsPhotoEditState();
        state.albumsNameEditingId = '';
    }

    const shellClasses = [
        'albums-shell',

        selectedPhoto
        && state.albumsDetailCollapsed
            ? 'detail-collapsed'
            : '',

        !selectedPhoto
            ? 'no-detail'
            : '',

        state.albumsDetailEditing
            ? 'photo-editing'
            : ''
    ]
        .filter(Boolean)
        .join(' ');

    /*
        Generate both panes before modifying the DOM.

        If a rendering function throws, the existing
        workspace stays intact instead of showing a
        new sidebar beside stale module content.
      */
    const nextSidebarMarkup =
        renderAlbumsSidebar();

    const nextMainMarkup = `
        <div class="${shellClasses}">
          <section class="albums-main" data-albums-scroll-key="${escapeHtml(scrollKey)}">
            ${renderAlbumsMainMarkup()}
          </section>

          ${
                !selectedPhoto
                    ? ''
                    : state.albumsDetailCollapsed
                        ? renderAlbumsDetailCollapsed()
                        : renderAlbumsDetailPane()
            }
        </div>
      `;

    sidebar.innerHTML =
        nextSidebarMarkup;

    main.innerHTML =
        nextMainMarkup;
    const nextDetail = main.querySelector('.albums-detail');
    if (nextDetail) nextDetail.scrollTop = previousDetailScrollTop;

    if (innerWidth <= 900 && mobileScrollTop)
    {
        main.querySelector('.albums-main').scrollTop = mobileScrollTop;
    }

    bindAlbumsSidebar();
    bindAlbumsControls();
    bindAlbumsGridResizeObserver();
}

function renderAlbumsSidebar()
{
    const projectAlbums =
        getProjectAlbums();

    return `
        <nav
          class="albums-sidebar"
          aria-label="Albums navigation">

          <div data-albums-tour-target="navigation">
            <div class="side-section-title">
              Navigation
            </div>

            <div class="side-nav">
              <button
                class="side-link ${
                    state.albumsView === 'all'
                        ? 'active'
                        : ''
                }"
                type="button"
                data-albums-view="all">

                ${icon.image}
                <span>All photos</span>
              </button>

              <button
                class="side-link ${
                    state.albumsView === 'favorites'
                        ? 'active'
                        : ''
                }"
                type="button"
                data-albums-view="favorites">

                ${icon.star}
                <span>Favourites</span>
              </button>

              <button
                class="side-link ${
                    state.albumsView === 'unassigned'
                        ? 'active'
                        : ''
                }"
                type="button"
                data-albums-view="unassigned">

                ${icon.folder}
                <span>Not in an album</span>
              </button>
            </div>
          </div>

          <div data-albums-tour-target="albums">
            <div
              class="
                side-section-title
                with-add
              ">

              <span>Albums</span>

              <button
                class="side-add-button"
                type="button"
                id="albumsNewAlbum"
                aria-label="Create album"
                title="Create album">

                ${icon.plus}
              </button>
            </div>

            <div class="side-nav">
              ${projectAlbums.length ? projectAlbums
                    .map(album =>
                    {
                        const isActive =
                            state.albumsView
                      === 'album'
                    && state.activeAlbumId
                      === album.id;

                        return `
                    <div
                      class="
                        sidebar-entity-row
                        ${
                            isActive
                                ? 'active'
                                : ''
                        }
                      ">

                      <button
                        class="
                          sidebar-entity-main
                        "
                        type="button"
                        data-album-open="${escapeHtml(
                            album.id
                        )}"
                        title="${escapeHtml(
                            album.name
                        )}">

                        ${icon.folder}

                        <span
                          class="
                            sidebar-entity-name
                          ">
                          ${escapeHtml(
                                album.name
                            )}
                        </span>
                      </button>

                      <button
                        class="
                          more-button
                          sidebar-entity-more
                        "
                        type="button"
                        data-album-menu="${escapeHtml(
                            album.id
                        )}"
                        aria-label="Actions for ${escapeHtml(
                            album.name
                        )}"
                        aria-haspopup="menu">

                        ${icon.more}
                      </button>
                    </div>
                  `;
                    })
                    .join('') : `<div class="sidebar-entity-empty">${escapeHtml(t('No albums yet'))}</div>`}
            </div>
          </div>

          <div class="tip-card albums-sidebar-tip">
            <div class="tip-title">
              ${icon.tip}
              <span>Tip of the day</span>
            </div>

            <p>
              Add people, dates, and places
              as you identify them. Even
              partial details make photos
              easier to find later.
            </p>

            <button
              class="text-action tip-link"
              type="button"
              data-toast="More photo organization guidance will be added later.">

              <span class="tip-link-text">
                Learn more
              </span>

              <span
                class="tip-link-icon"
                aria-hidden="true">

                ${icon.openlink}
              </span>
            </button>
          </div>
        </nav>
      `;
}

function renderAlbumsMainMarkup()
{
    const photos = filteredAlbumPhotos();
    const context = albumContext();
    const activeFilterCount = albumFilterCount();
    const activeFilters = renderAlbumsActiveFilterbar();
    const listPage =
        state.albumsViewMode === 'list'
            ? getAlbumsListPage(photos)
            : null;
    const visiblePhotos =
        listPage
            ? listPage.photos
            : photos;
    return `<header class="albums-header">
        <div class="albums-title"><h1 class="app-page-title">${escapeHtml(context.title)}</h1><p>${escapeHtml(context.subtitle)}</p></div>
        <div class="albums-header-actions">
          <button
            class="button primary"
            type="button"
            id="albumsAddPhotos"
            aria-label="Add photos"
            title="Add photos">

            ${icon.plus}
            <span>Add photos</span>
          </button>
        </div>
      </header>
      <div
        class="albums-toolbar"
        aria-label="Photo controls">

        <div class="albums-toolbar-left">
          <label
            class="app-search-field"
            aria-label="Search photos">
            ${icon.search}

            <input
              id="albumsSearch"
              type="search"
              value="${escapeHtml(state.albumsSearch || '')}"
              placeholder="Search photos...">
          </label>
          <button class="button primary albums-mobile-add-photos" type="button" id="albumsMobileAddPhotos" aria-label="${escapeHtml(t('Add photos'))}" title="${escapeHtml(t('Add photos'))}">
            ${icon.plus}<span class="albums-add-label-full">${escapeHtml(t('Add photos'))}</span><span class="albums-add-label-short">${escapeHtml(t('Add'))}</span>
          </button>
        </div>

        <div class="albums-toolbar-right">
          <button
            class="albums-filter-button ${
                activeFilterCount ? 'active' : ''
            }"
            type="button"
            id="albumsFilterButton"
            aria-label="${
                activeFilterCount
                    ? `Filters, ${activeFilterCount} active`
                    : 'Open photo filters'
            }"
            aria-expanded="false">
            <span
              class="albums-filter-icon"
              aria-hidden="true">
              ${
                    activeFilterCount
                        ? icon.filterclear
                        : icon.filter
                }
            </span>

            <span>Filters</span>

            ${
                activeFilterCount
                    ? `<span class="albums-filter-count">
                    ${activeFilterCount}
                  </span>`
                    : ''
            }
          </button>
          ${renderAppSortControl({
                id: 'albumsSort',
                field: state.albumsSort,
                direction: state.albumsSortDirection,
                ariaLabel: 'Sort photos',
                options: APP_SORT_OPTIONS.albums
            })}
          <div
            class="albums-view-switch"
            role="group"
            aria-label="View mode">

            <button
              class="toolbar-button albums-view-button ${
                    state.albumsViewMode === 'grid'
                        ? 'active'
                        : ''
                }"
              type="button"
              data-albums-mode="grid"
              aria-label="Grid view"
              aria-pressed="${
                    state.albumsViewMode === 'grid'
                }">
              ${icon.grid}
            </button>

            <button
              class="toolbar-button albums-view-button ${
                    state.albumsViewMode === 'list'
                        ? 'active'
                        : ''
                }"
              type="button"
              data-albums-mode="list"
              aria-label="List view"
              aria-pressed="${
                    state.albumsViewMode === 'list'
                }">
              ${icon.list}
            </button>
          </div>
        </div>
      </div>
      ${activeFilters}
      ${
            state.selectedPhotoIds.length
                ? renderAlbumsSelectionBar()
                : ''
        }
      <div class="albums-content">
        ${
            photos.length
                ? state.albumsViewMode === 'list'
                    ? renderAlbumsList(
                        visiblePhotos
                    )
                    : renderAlbumsGrid(
                        photos
                    )
                : renderAlbumsEmpty(
                    context
                )
        }
      </div>
        ${
            listPage
          && photos.length
                ? renderAlbumsListFooter(
                    listPage.pagination
                )
                : ''
        }
      `;
}

function renderAlbumsSelectionBar()
{
    const count =
        state.selectedPhotoIds.length;

    const selectAllAction =
        state.albumsViewMode
          === 'list'
            ? ''
            : `
              <button
                class="button secondary"
                type="button"
                id="albumsSelectAll">
                ${escapeHtml(t('Select all'))}
              </button>
            `;

    return `
        <div class="albums-selection-bar">
          <span class="albums-selection-copy">
            ${count} selected
          </span>

          <div class="albums-selection-actions">
            ${selectAllAction}

            <button
              class="button secondary"
              type="button"
              id="albumsAddSelectedToAlbum">
              Add to album
            </button>

            ${
                state.albumsView === 'album'
                    ? `
                  <button
                    class="button secondary"
                    type="button"
                    id="albumsRemoveFromCurrent">
                    Remove from album
                  </button>
                `
                    : ''
            }

            <button
              class="button danger"
              type="button"
              id="albumsDeleteSelected">
              Delete
            </button>

            <button
              class="button secondary"
              type="button"
              id="albumsCancelSelection">
              ${escapeHtml(t('Clear'))}
            </button>
          </div>
        </div>
      `;
}

function renderAlbumsPhotoCard(photo, selectedIds, width = 0)
{
    const names = getPhotoPeople(photo)
        .map(person => person.names?.display)
        .filter(Boolean);
    const selected = selectedIds.has(photo.id);
    const widthStyle = width > 0
        ? ` style="--albums-card-width:${width}px"`
        : '';

    return `<article class="album-photo-card ${state.selectedPhotoId === photo.id ? 'selected-detail' : ''} ${selected ? 'is-checked' : ''}"${widthStyle} tabindex="0" data-photo-id="${escapeHtml(photo.id)}" aria-selected="${selected}">
        <div class="albums-thumb">
          ${renderPhotoThumbnail(
                photo,
                {
                    label:
                photo.title
                }
            )}

          <button
            class="albums-check"
            type="button"
            data-photo-check="${escapeHtml(
                photo.id
            )}"
            aria-pressed="${selected}"
            aria-label="${
                selected
                    ? 'Deselect'
                    : 'Select'
            } ${escapeHtml(
                photo.title
            )}">

            ${
                selected
                    ? icon.check
                    : ''
            }
          </button>

          <button
            class="
              albums-fav-button
              ${
                    photo.favorite
                        ? 'active'
                        : ''
                }
            "
            type="button"
            data-photo-fav="${escapeHtml(
                photo.id
            )}"
            aria-pressed="${photo.favorite}"
            aria-label="${
                photo.favorite
                    ? 'Remove from favourites'
                    : 'Mark as favorite'
            }">

            ${icon.star}
          </button>
        </div>
        <div class="albums-card-body">
          <strong
            class="albums-card-title"
            title="${escapeHtml(
                photo.title || photo.filename
            )}">
            ${escapeHtml(
                photo.title || photo.filename
            )}
          </strong>

          <span class="albums-card-people">
            ${escapeHtml(
                names.join(', ')
              || 'No people tagged'
            )}
          </span>

          <div class="albums-card-footer">
            <span>
              ${escapeHtml(
                    formatPhotoDate(photo)
                )}
            </span>

            ${state.selectedPhotoId === photo.id ? `<button class="mobile-item-details" type="button" data-mobile-open-details>${icon.info}<span>${escapeHtml(t('Details'))}</span></button>` : ''}

            <button
              class="albums-card-more"
              type="button"
              data-photo-more="${escapeHtml(
                    photo.id
                )}"
              aria-label="Photo actions">
              ${icon.more}
            </button>
          </div>
        </div>
      </article>`;
}

function renderAlbumsGrid(photos)
{
    const selectedIds = new Set(state.selectedPhotoIds || []);
    const selectionClass = selectedIds.size ? ' is-selecting' : '';
    const measuredWidth = Number(state.albumsGridWidth);
    const hasMeasuredWidth = Number.isFinite(measuredWidth) && measuredWidth > 0;

    if (!hasMeasuredWidth)
    {
        return `<div class="albums-justified-grid is-measuring${selectionClass}" data-albums-justified-grid><div class="albums-justified-row">${photos.map(photo => renderAlbumsPhotoCard(photo, selectedIds)).join('')}</div></div>`;
    }

    const rows = buildJustifiedPhotoRows(photos, measuredWidth);
    return `<div class="albums-justified-grid${selectionClass}" data-albums-justified-grid>${rows.map(row => `<div class="albums-justified-row ${row.justified ? 'is-justified' : 'is-incomplete'}" style="--albums-row-preview-height:${row.height}px">${row.items.map(item => renderAlbumsPhotoCard(item.photo, selectedIds, item.width)).join('')}</div>`).join('')}</div>`;
}

function renderAlbumsList(photos)
{
    const selectedIds =
        new Set(
            state.selectedPhotoIds || []
        );

    const header = `
        <div
          class="
            albums-list-row
            header
          "
          role="row">

          <input
            class="
              albums-select-checkbox
            "
            type="checkbox"
            data-albums-select-visible
            aria-label="
              Select all visible photos
            ">

          <span class="albums-mobile-select-all">${escapeHtml(t('Select all visible photos'))}</span>

          <span class="albums-list-photo-heading" role="columnheader" aria-colspan="2">Photo</span>
          <span role="columnheader">People</span>
          <span role="columnheader">Date</span>
          <span role="columnheader">Place</span>

          <span
            class="
              albums-list-favourite-heading
            "
            role="columnheader"
            aria-label="Favorite"
            title="Favorite">
            ${icon.star}
          </span>

          <span
            role="columnheader"
            aria-label="Actions">
          </span>
        </div>
      `;

    const rows =
        photos.map(photo =>
        {
            const selected =
                selectedIds.has(
                    photo.id
                );

            const title =
                photo.title
            || photo.filename
            || 'Untitled photo';

            const people =
                getPhotoPeople(photo)
                    .map(person =>
                        person.names?.display
                    )
                    .filter(Boolean)
                    .join(', ')
            || 'No people';

            const favoriteLabel =
                photo.favorite
                    ? 'Remove from favourites'
                    : 'Mark as favourite';

            const favoriteControl = `
            <button
              class="
                albums-list-favourite
                ${
                    photo.favorite
                        ? 'active'
                        : ''
                }
              "
              type="button"
              data-photo-fav="${
                    escapeHtml(photo.id)
                }"
              aria-pressed="${
                    photo.favorite
                        ? 'true'
                        : 'false'
                }"
              aria-label="${
                    escapeHtml(
                        favoriteLabel
                    )
                }"
              title="${
                    escapeHtml(
                        favoriteLabel
                    )
                }">
              ${icon.star}
            </button>
          `;

            return `
            <div
              class="
                albums-list-row
                ${
                    state.selectedPhotoId
                    === photo.id
                        ? 'selected-detail'
                        : ''
                }
                ${
                    selected
                        ? 'is-checked'
                        : ''
                }
              "
              role="row"
              tabindex="0"
              data-photo-id="${
                    escapeHtml(photo.id)
                }"
              aria-selected="${
                    selected
                        ? 'true'
                        : 'false'
                }">

              <input
                class="
                  albums-select-checkbox
                "
                type="checkbox"
                data-photo-check="${
                    escapeHtml(photo.id)
                }"
                aria-label="${
                    escapeHtml(
                        `${
                            selected
                                ? 'Deselect'
                                : 'Select'
                        } ${title}`
                    )
                }"
                ${
                    selected
                        ? 'checked'
                        : ''
                }>

              <span
                class="
                  albums-list-thumb
                " role="cell">
                ${renderPhotoThumbnail(
                    photo,
                    {
                        label: title
                    }
                )}
              </span>

              <span
                class="
                  albums-list-title
                " role="cell">
                <strong title="${escapeHtml(title)}">
                  ${escapeHtml(title)}
                </strong>

                <span>
                  ${escapeHtml(
                        formatMediaBytes(
                            photo.sizeBytes
                        )
                    )}
                </span>
              </span>

              <span class="albums-list-people" role="cell"><span class="albums-mobile-cell-label">${escapeHtml(t('People'))}</span><span>${escapeHtml(people)}</span></span>

              <span class="albums-list-date" role="cell"><span class="albums-mobile-cell-label">${escapeHtml(t('Date'))}</span><span>${escapeHtml(
                    formatPhotoDate(photo)
                )}</span></span>

              <span class="albums-list-place" role="cell"><span class="albums-mobile-cell-label">${escapeHtml(t('Place'))}</span><span>${escapeHtml(
                    getPlaceDisplay(
                        photo.placeId
                    )
                  || photo.placeText
                  || 'Unknown'
                )}</span></span>

              ${favoriteControl}

              <button
                class="albums-row-more"
                type="button"
                data-photo-more="${
                    escapeHtml(photo.id)
                }"
                aria-label="${
                    escapeHtml(
                        `Actions for ${title}`
                    )
                }"
                aria-haspopup="menu">
                ${icon.more}
              </button>
            </div>
          `;
        }).join('');

    return `
        <div
          class="albums-list"
          role="table"
          aria-label="Photos">
          ${header}
          ${rows}
        </div>
      `;
}

function renderAlbumsEmpty(
    context
)
{
    const filtered =
        albumsHaveActiveQuery();

    const copy =
        filtered
            ? 'Try a different search or clear the active filters.'
            : 'Add a photo to begin organizing this collection.';

    const action =
        filtered
            ? `
            <button
              class="button secondary"
              type="button"
              id="albumsEmptyClear">
              Clear search and filters
            </button>
          `
            : `
            <button
              class="button primary"
              type="button"
              id="albumsEmptyAction">
              Add photos
            </button>
          `;

    return `
        <div class="albums-empty">
          <div class="albums-empty-card">
            ${icon.image}

            <h2>
              ${escapeHtml(
                    context.empty
                )}
            </h2>

            <p>
              ${escapeHtml(copy)}
            </p>

            ${action}
          </div>
        </div>
      `;
}

