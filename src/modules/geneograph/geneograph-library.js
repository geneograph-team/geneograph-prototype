let geneoMobileBoardSearchOpen = false;

function renderGeneographHome()
{
    cancelGeneographPencilStroke();
    const filtered =
        filteredGeneographBoards();

    const libraryContext =
        geneographLibraryContext();

    const sectionTitle =
        libraryContext.title;

    const sectionIcon =
        libraryContext.icon;

    const sectionDescription =
        libraryContext.description;

    sidebar.innerHTML = `
        <nav
          class="
            geneo-sidebar
          "
          aria-label="Geneograph navigation">

          <div data-geneo-tour-target="library-navigation">
            <div
              class="
                side-section-title
              ">

              Navigation
            </div>

            <div class="side-nav">
              ${renderGeneoAllBoardsNavigationButton()}

              ${renderGeneoLibraryViewButton(
                    'favorites',
                    'Favourites',
                    icon.star
                )}
              ${renderGeneoLibraryViewButton(
                    'unassigned',
                    'Not in collection',
                    icon.folder
                )}

              ${renderGeneoLibraryViewButton(
                    'archived',
                    'Archived',
                    icon.archive
                )}
            </div>
          </div>

          <div data-geneo-tour-target="library-collections">
            <div
              class="
                side-section-title
                with-add
              ">

              <span>
                Collections
              </span>

              <button
                class="
                  side-add-button
                "
                type="button"
                data-geneo-add-collection
                aria-label="Create collection"
                title="Create collection">

                ${icon.plus}
              </button>
            </div>

            <div class="side-nav">
              ${renderGeneographCollectionSidebarRows()}
            </div>
          </div>

          <div
            class="
              geneo-sidebar-tip
            ">

            <div class="tip-card">
              <div class="tip-title">
                ${icon.tip}
                Tip of the day
              </div>

              <p>
                Use Geneograph boards to collect
                hypotheses before adding relationships
                to the structured Family Tree.
              </p>

              <button
                class="
                  link
                  tip-link
                "
                type="button"
                data-toast="
                  Geneograph learning center
                  will be added later.
                ">

                <span
                  class="
                    tip-link-text
                  ">

                  Learn more
                </span>

                <span
                  class="
                    tip-link-icon
                  "
                  aria-hidden="true">

                  ${icon.openlink}
                </span>
              </button>
            </div>
          </div>
        </nav>
      `;

    main.innerHTML = `
        <section
          class="
            geneo-home-page
          ">

          ${renderArchivePageHead({
                title:
              'Geneograph Visual Boards',

                subtitle:
              'Your personal space for research, visualizations and publications.',

                actions: `
              <button
                class="
                  button
                  secondary
                "
                type="button"
                data-geneo-import
                aria-label="${escapeHtml(t('Import board'))}">

                ${icon.import}
                <span>${escapeHtml(t('Import board'))}</span>
              </button>
              <input type="file" accept=".ggboard" data-geneo-import-file hidden>

              <button
                class="
                  button
                  primary
                "
                type="button"
                data-geneo-create>

                ${icon.plus}
                New board
              </button>
            `
            })}

          <div
            class="
              geneo-board-toolbar ${geneoMobileBoardSearchOpen ? 'mobile-search-open' : ''}
            ">

            <div
              class="
                geneo-board-toolbar-left
              ">

              <button class="geneo-mobile-search-trigger" type="button" data-geneo-mobile-search aria-label="${escapeHtml(t('Search boards'))}" title="${escapeHtml(t('Search boards'))}">${icon.search}</button>
              <label
                class="
                  app-search-field
                "
                aria-label="Search boards">

                ${icon.search}

                <input
                  id="geneoBoardSearch"
                  type="search"
                  placeholder="Search boards..."
                  value="${escapeHtml(
                        state.geneoBoardSearch
                    )}">
              </label>
              <button class="geneo-mobile-search-close" type="button" data-geneo-mobile-search-close aria-label="${escapeHtml(t('Close'))}" title="${escapeHtml(t('Close'))}">${icon.close}</button>
            </div>

            <div
              class="
                geneo-board-toolbar-right
              ">
              ${renderAppSortControl({
                    id: 'geneoBoardSort',
                    field: state.geneoBoardSort,
                    direction: state.geneoBoardSortDirection,
                    ariaLabel: 'Sort boards',
                    options: APP_SORT_OPTIONS.geneograph
                })}
              <button
                class="
                  toolbar-button
                  ${
                        state.geneoBoardViewMode
                      === 'grid'
                            ? 'active'
                            : ''
                    }
                "
                type="button"
                data-geneo-board-view="grid"
                aria-label="Grid view">

                ${icon.grid}
              </button>

              <button
                class="
                  toolbar-button
                  ${
                        state.geneoBoardViewMode
                      === 'list'
                            ? 'active'
                            : ''
                    }
                "
                type="button"
                data-geneo-board-view="list"
                aria-label="List view">

                ${icon.list}
              </button>
            </div>
          </div>

          <div
            class="
              geneo-board-section
            ">

            <h2
              class="
                section-heading
              ">

              ${sectionIcon}

              ${escapeHtml(
                    sectionTitle
                )}

              (${filtered.length})
            </h2>

            ${
                sectionDescription
                    ? `
                  <p
                    class="
                      geneo-board-section-description
                    ">

                    ${escapeHtml(
                        sectionDescription
                    )}
                  </p>
                `
                    : ''
            }

            ${renderGeneographBoardCollection(
                filtered
            )}
          </div>
        </section>
      `;

    bindGeneographHome();
}

function renderGeneoLibraryViewButton(
    view,
    label,
    iconHtml
)
{
    const active =
        state.geneoLibraryView
          === view;

    return `
        <button
          class="
            side-link
            ${active ? 'active' : ''}
          "
          type="button"
          data-geneo-library-view="${escapeHtml(
                view
            )}">

          ${iconHtml}

          <span>
            ${escapeHtml(
                label
            )}
          </span>
        </button>
      `;
}

function renderGeneoAllBoardsNavigationButton({ editor = false } = {})
{
    const active = !editor && state.geneoLibraryView === 'all';
    return `
        <button
          class="side-link ${active ? 'active' : ''}"
          type="button"
          ${editor ? 'data-geneo-all-boards' : 'data-geneo-library-view="all"'}>
          ${icon.whiteboard}
          <span>All Boards</span>
        </button>
      `;
}

function renderGeneographCollectionSidebarRows()
{
    const collections =
        getProjectBoardCollections();

    if (!collections.length)
    {
        return `
          <div
            class="
              geneo-collection-sidebar-empty
            ">

            ${escapeHtml(t('No collections yet'))}
          </div>
        `;
    }

    return collections
        .map(collection =>
        {
            const active =
                state.geneoLibraryView
              === 'collection'
            && state
                .geneoActiveCollectionId
              === collection.id;

            return `
            <div
              class="
                sidebar-entity-row
                ${active ? 'active' : ''}
              ">

              <button
                class="
                  sidebar-entity-main
                "
                type="button"
                data-geneo-collection="${escapeHtml(
                    collection.id
                )}"
                title="${escapeHtml(
                    collection.name
                )}">

                ${icon.folder}

                <span
                  class="
                    sidebar-entity-name
                  ">

                  ${escapeHtml(
                        collection.name
                    )}
                </span>
              </button>

              <button
                class="
                  more-button
                  sidebar-entity-more
                "
                type="button"
                data-geneo-collection-menu="${escapeHtml(
                    collection.id
                )}"
                aria-label="Actions for ${escapeHtml(
                    collection.name
                )}"
                aria-haspopup="menu">

                ${icon.more}
              </button>
            </div>
          `;
        })
        .join('');
}

function filteredGeneographBoards()
{
    const projectId =
        currentProjectId();

    const query =
        state.geneoBoardSearch
            .trim()
            .toLowerCase();

    let list;

    if (
        state.geneoLibraryView
          === 'archived'
    )
    {
        list =
            getProjectBoards(
                projectId,
                {
                    includeArchived:
                true
                }
            ).filter(board =>
                board.archived
            );
    }
    else if (
        state.geneoLibraryView
          === 'collection'
    )
    {
        const collection =
            activeGeneographCollection();

        list =
            collection
                ? getBoardsForCollection(
                    collection.id,
                    {
                        projectId
                    }
                )
                : [];
    }
    else
    {
        list =
            getProjectBoards(
                projectId
            );

        if (
            state.geneoLibraryView
            === 'favorites'
        )
        {
            list =
                list.filter(board =>
                    board.favorite
                );
        }

        if (
            state.geneoLibraryView
            === 'unassigned'
        )
        {
            list =
                list.filter(board =>
                    !(
                        board.collectionIds
                || []
                    ).length
                );
        }
    }

    if (query)
    {
        list =
            list.filter(board =>
                geneographBoardSearchText(
                    board
                ).includes(
                    query
                )
            );
    }
    return appSortRecords(list, {
        field:
          state.geneoBoardSort,

        direction:
          state.geneoBoardSortDirection,

        extractors: {
            name: {
                type: 'text',
                get: board =>
                    board.title
            },

            updated: {
                type: 'number',
                get:
              geneographBoardModifiedTime
            },

            created: {
                type: 'number',
                get: board =>
                    appSortTimestamp(
                        board.createdAt
                    )
            }
        },

        getFallback:
          board => board.title
    });
}

function renderGeneographNewBoardTile()
{
    return `
        <div class="library-create-tile" data-geneo-create-tile>
          <button class="library-create-primary" type="button" data-geneo-create>
            <span class="library-create-icon" aria-hidden="true">${icon.plus}</span>
            <span class="library-create-copy"><strong>${escapeHtml(t('New board'))}</strong><span>${escapeHtml(t('A visual workspace for your research.'))}</span></span>
          </button>
          <div class="library-create-secondary">
            <button class="library-import-action" type="button" data-geneo-import>${icon.import}${escapeHtml(t('Import board...'))}</button>
          </div>
          <div class="library-drop-feedback" aria-hidden="true">${icon.import}<strong>${escapeHtml(t('Drop to import board'))}</strong></div>
        </div>
      `;
}

function renderGeneographBoardEmptyState()
{
    const query =
        state.geneoBoardSearch
            .trim();

    const context =
        geneographLibraryContext();

    const message =
        query
            ? 'No boards match this search.'
            : context.emptyMessage;

    return `
        <div class="panel">
          <div
            class="
              panel-body
              geneo-board-empty
            ">

            ${escapeHtml(
                message
            )}
          </div>
        </div>
      `;
}

function renderGeneographBoardCollection(
    list
)
{
    const viewClass =
        state.geneoBoardViewMode
          === 'list'
            ? 'geneo-board-list'
            : 'geneo-board-grid';

    const showNewBoardTile =
        !state.geneoBoardSearch
            .trim()
        && [
            'all',
            'collection',
            'unassigned'
        ].includes(
            state.geneoLibraryView
        );

    if (
        !list.length
        && !showNewBoardTile
    )
    {
        return renderGeneographBoardEmptyState();
    }

    return `
        <div
          class="${viewClass}">

          ${list
                .map(
                    renderGeneographBoardCard
                )
                .join('')}

          ${
                showNewBoardTile
                    ? renderGeneographNewBoardTile()
                    : ''
            }
        </div>
      `;
}

function renderGeneographBoardCollectionChips(
    board,
    limit = 2
)
{
    const collections =
        getCollectionsForBoard(
            board.id,
            {
                projectId:
              board.projectId
            }
        );

    if (!collections.length)
    {
        return `
          <div
            class="
              geneo-board-collections
            ">

            <span
              class="
                geneo-board-collection-chip
                no-collection
              "
              title="No collection assigned">

              No collection
            </span>
          </div>
        `;
    }

    const visible =
        collections.slice(
            0,
            limit
        );

    const hiddenCount =
        collections.length
        - visible.length;

    return `
        <div
          class="
            geneo-board-collections
          ">

          ${visible
                .map(collection => `
              <span
                class="
                  geneo-board-collection-chip
                "
                title="
                ${escapeHtml(
                    localizedDataFieldValue(collection.name)
                )}
                ">
                ${escapeHtml(
                    localizedDataFieldValue(collection.name)
                )}
              </span>
            `)
                .join('')}

          ${
                hiddenCount > 0
                    ? `
                <span
                  class="
                    geneo-board-collection-chip
                    count
                  "
                  title="${hiddenCount} more collections">

                  +${hiddenCount}
                </span>
              `
                    : ''
            }
        </div>
      `;
}

function renderGeneographBoardCard(
    board
)
{
    const favouriteLabel =
        board.favorite
            ? `Remove ${board.title} from favourites`
            : `Add ${board.title} to favourites`;

    return `
        <article
          class="
            geneo-board-card
          "
          data-geneo-board-id="${escapeHtml(
                board.id
            )}">

          <div
            class="
              geneo-thumb
            ">
            ${renderGeneographBoardPreview(board, state.geneoBoardViewMode === 'list' ? 'square' : 'wide')}
            <div class="geneo-board-cover-shade"></div>
            <h3 class="geneo-board-cover-title">${escapeHtml(board.title)}</h3>
          </div>

          <button class="geneo-board-open-area" type="button" data-geneo-open-board="${escapeHtml(board.id)}" aria-label="Open ${escapeHtml(board.title)}" title="${escapeHtml(board.title)}"></button>

          <button class="geneo-star ${board.favorite ? 'active' : ''}" type="button" data-geneo-fav="${escapeHtml(board.id)}" aria-label="${escapeHtml(favouriteLabel)}" aria-pressed="${board.favorite ? 'true' : 'false'}">${icon.star}</button>

          <button class="geneo-more" type="button" data-geneo-board-menu="${escapeHtml(board.id)}" aria-label="More actions for ${escapeHtml(board.title)}" aria-haspopup="menu" aria-expanded="false">${icon.more}</button>

          <div
            class="
              geneo-board-body
            ">
          <h3 title="${escapeHtml(board.title)}">
            ${escapeHtml(
                board.title
            )}
          </h3>

          ${renderGeneographBoardCollectionChips(
                board
            )}
            <div class="geneo-board-modified geneo-board-modified-list">${escapeHtml(formatProjectModified(board))}</div>
          </div>

          <div
            class="
              geneo-board-footer
            ">

            <div class="geneo-board-modified geneo-board-modified-grid" title="${escapeHtml(formatProjectModified(board))}">${escapeHtml(formatProjectModified(board))}</div>

            <button
              class="
                small-open
              "
              type="button"
              data-geneo-open-board="${escapeHtml(
                    board.id
                )}">

              Open
            </button>

          </div>
        </article>
      `;
}

function geneographCanvasCountLabel(count)
{
    if (state.language !== 'ru')
    {
        return `${count} ${count === 1 ? 'canvas' : 'canvases'}`;
    }

    const form = new Intl.PluralRules('ru').select(count);
    const noun = {
        one: 'холст',
        few: 'холста',
        many: 'холстов',
        other: 'холста'
    }[form];

    return `${count} ${noun}`;
}

function renderGeneographCollectionChoiceRows(
    projectId,
    selectedCollectionIds,
    query = ''
)
{
    const normalizedQuery =
        String(
            query || ''
        )
            .trim()
            .toLowerCase();

    const collections =
        getProjectBoardCollections(
            projectId
        )
            .filter(collection =>
            {
                if (!normalizedQuery)
                {
                    return true;
                }

                return `
              ${collection.name || ''}
              ${collection.description || ''}
              ${localizedDataFieldValue(collection.name || '')}
              ${localizedDataFieldValue(collection.description || '')}
            `
                    .toLowerCase()
                    .includes(
                        normalizedQuery
                    );
            });

    if (!collections.length)
    {
        if (normalizedQuery)
        {
            return `
            <div
              class="
                album-picker-empty
              ">

              <div
                class="
                  album-picker-empty-card
                ">

                <strong>
                  No collections match this search
                </strong>

                <p>
                  Try another collection name
                  or description.
                </p>

                <button
                  class="
                    button
                    secondary
                  "
                  type="button"
                  data-geneo-collection-clear-search>

                  Clear search
                </button>
              </div>
            </div>
          `;
        }

        return `
          <div
            class="
              album-picker-empty
            ">

            <div
              class="
                album-picker-empty-card
              ">

              <strong>
                No collections yet
              </strong>

              <p>
                Create a collection to organize
                this board.
              </p>

              <button
                class="
                  button
                  primary
                "
                type="button"
                data-geneo-inline-collection-toggle>

                Create collection
              </button>
            </div>
          </div>
        `;
    }

    return collections
        .map(collection =>
        {
            const selected =
                selectedCollectionIds.has(
                    collection.id
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
              "
              data-geneo-collection-row="${escapeHtml(
                    collection.id
                )}">

              <span
                class="
                  album-picker-copy
                ">

                <strong>
                  ${escapeHtml(
                        localizedDataFieldValue(collection.name)
                    || translateText('Untitled collection')
                    )}
                </strong>

                <span
                  class="
                    album-picker-description
                  ">
                  ${escapeHtml(
                        localizedDataFieldValue(collection.description)
                    || translateText('No description')
                    )}
                </span>

              </span>

              <input
                type="checkbox"
                value="${escapeHtml(
                    collection.id
                )}"
                data-geneo-collection-choice
                ${
                    selected
                        ? 'checked'
                        : ''
                }
                aria-label="${escapeHtml(
                    `${
                        selected
                            ? 'Remove'
                            : 'Add'
                    } ${
                        collection.name
                    }`
                )}">
            </label>
          `;
        })
        .join('');
}

function renderGeneographCollectionChooser({
    projectId =
        currentProjectId(),

    selectedCollectionIds =
        new Set()
} = {})
{
    return `
        <section
          class="
            geneo-collection-chooser
          "
          aria-labelledby="geneoCollectionChooserLabel">

          <div
            class="
              geneo-collection-chooser-head
            ">

            <h3
              id="geneoCollectionChooserLabel">

              Collections
            </h3>
          </div>

          <div
            class="
              album-picker-browse
              geneo-collection-browse
            "
            data-geneo-collection-browse>

            <div class="geneo-collection-search-row">
            <div
              class="
                field
                photo-people-search-field
                album-picker-search
              ">

              <div
                class="
                  search-input
                ">

                ${icon.search}

                <input
                  id="geneoCollectionSearch"
                  type="search"
                  data-geneo-collection-search
                  aria-label="Search collections"
                  placeholder="Search collections"
                  autocomplete="off">
              </div>
            </div>

            <button
              class="button secondary compact geneo-collection-new-button"
              type="button"
              data-geneo-inline-collection-toggle
              aria-label="New collection"
              title="New collection">
              ${icon.plus}<span>New collection</span>
            </button>
            </div>

            <section
              class="
                album-picker-results-panel
              ">

              <span class="geneo-collection-status" data-geneo-collection-results-meta role="status" aria-live="polite"></span>

              <div
                class="
                  photo-people-results
                  album-picker-results
                  geneo-collection-results
                "
                data-geneo-collection-choice-list>

                ${renderGeneographCollectionChoiceRows(
                    projectId,
                    selectedCollectionIds
                )}
              </div>
            </section>
          </div>

          <div
            class="
              album-picker-create
              geneo-collection-create-panel
            "
            data-geneo-inline-collection-panel
            hidden>

            <div
              class="
                album-picker-create-copy
              ">

              <strong>
                Create a new collection
              </strong>

              <span>
                Creates the collection immediately and selects it for this board. Canceling the board form will not delete it.
              </span>
            </div>

            <div
              class="
                album-picker-create-fields
              ">

              <div class="field">
                <label
                  for="geneoInlineCollectionName">

                  Collection name
                </label>

                <input
                  id="geneoInlineCollectionName"
                  type="text"
                  maxlength="120"
                  data-geneo-inline-collection-name
                  autocomplete="off"
                  placeholder="e.g. Pawford research">
              </div>

              <div class="field">
                <label
                  for="geneoInlineCollectionDescription">

                  Description
                </label>

                <textarea
                  id="geneoInlineCollectionDescription"
                  rows="3"
                  maxlength="500"
                  data-geneo-inline-collection-description
                  placeholder="Optional description"></textarea>
              </div>
            </div>

            <div
              class="
                geneo-inline-collection-actions
              ">

              <button
                class="
                  button
                  secondary
                "
                type="button"
                data-geneo-inline-collection-cancel>

                Back
              </button>

              <button
                class="
                  button
                  primary
                "
                type="button"
                data-geneo-inline-collection-create>

                Create and select
              </button>
            </div>
          </div>
        </section>
      `;
}

function bindGeneographCollectionChooser(
    root,
    {
        projectId =
            currentProjectId(),

        selectedCollectionIds
    }
)
{
    if (
        !root
        || !selectedCollectionIds
    )
    {
        return;
    }

    let query =
        '';

    const browsePanel =
        root.querySelector(
            '[data-geneo-collection-browse]'
        );

    const createPanel =
        root.querySelector(
            '[data-geneo-inline-collection-panel]'
        );

    const resultsHost =
        root.querySelector(
            '[data-geneo-collection-choice-list]'
        );

    const resultsMeta =
        root.querySelector(
            '[data-geneo-collection-results-meta]'
        );

    const searchInput =
        root.querySelector(
            '[data-geneo-collection-search]'
        );

    const nameInput =
        root.querySelector(
            '[data-geneo-inline-collection-name]'
        );

    const descriptionInput =
        root.querySelector(
            '[data-geneo-inline-collection-description]'
        );

    const visibleCollections =
        () =>
        {
            const normalizedQuery =
                query
                    .trim()
                    .toLowerCase();

            return getProjectBoardCollections(
                projectId
            ).filter(collection =>
            {
                if (!normalizedQuery)
                {
                    return true;
                }

                return `
              ${collection.name || ''}
              ${collection.description || ''}
              ${localizedDataFieldValue(collection.name || '')}
              ${localizedDataFieldValue(collection.description || '')}
            `
                    .toLowerCase()
                    .includes(
                        normalizedQuery
                    );
            });
        };

    const updateResultsMeta = () =>
    {
        const count = visibleCollections().length;
        const selected = selectedCollectionIds.size;

        if (resultsMeta)
        {
            resultsMeta.textContent = state.language === 'ru'
                ? `Коллекций: ${count} · Выбрано: ${selected}`
                : `${count} ${
                    count === 1 ? 'collection' : 'collections'
                } · ${selected} selected`;
        }
    };

    const renderResults =
        () =>
        {
            if (!resultsHost)
            {
                return;
            }

            resultsHost.innerHTML =
                renderGeneographCollectionChoiceRows(
                    projectId,
                    selectedCollectionIds,
                    query
                );

            localizeUI(resultsHost);
            updateResultsMeta();
        };

    const showBrowse =
        () =>
        {
            if (browsePanel)
            {
                browsePanel.hidden =
                    false;
            }

            if (createPanel)
            {
                createPanel.hidden =
                    true;
            }
        };

    const showCreate =
        () =>
        {
            if (browsePanel)
            {
                browsePanel.hidden =
                    true;
            }

            if (createPanel)
            {
                createPanel.hidden =
                    false;
            }

            requestAnimationFrame(
                () =>
                    nameInput?.focus()
            );
        };

    searchInput
        ?.addEventListener(
            'input',
            event =>
            {
                query =
                    event.currentTarget
                        .value;

                renderResults();
            }
        );

    root.addEventListener(
        'change',
        event =>
        {
            const checkbox =
                event.target.closest(
                    '[data-geneo-collection-choice]'
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

            checkbox
                .closest(
                    '[data-geneo-collection-row]'
                )
                ?.classList.toggle(
                    'is-selected',
                    checkbox.checked
                );

            updateResultsMeta();
        }
    );

    root.addEventListener(
        'click',
        event =>
        {
            if (
                event.target.closest(
                    '[data-geneo-inline-collection-toggle]'
                )
            )
            {
                event.preventDefault();

                showCreate();

                return;
            }

            if (
                event.target.closest(
                    '[data-geneo-inline-collection-cancel]'
                )
            )
            {
                event.preventDefault();

                showBrowse();

                searchInput?.focus();

                return;
            }

            if (
                event.target.closest(
                    '[data-geneo-collection-clear-search]'
                )
            )
            {
                event.preventDefault();

                query =
                    '';

                if (searchInput)
                {
                    searchInput.value =
                        '';
                }

                renderResults();

                searchInput?.focus();

                return;
            }

            if (
                !event.target.closest(
                    '[data-geneo-inline-collection-create]'
                )
            )
            {
                return;
            }

            event.preventDefault();

            const name =
                nameInput
                    ?.value
                    .trim()
            || '';

            const description =
                descriptionInput
                    ?.value
                    .trim()
            || '';

            if (!name)
            {
                nameInput?.focus();

                showToast(
                    'Enter a collection name.'
                );

                return;
            }

            const collection =
                createGeneographCollection({
                    name,
                    description,
                    projectId
                });

            if (!collection)
            {
                return;
            }

            selectedCollectionIds.add(
                collection.id
            );

            if (nameInput)
            {
                nameInput.value =
                    '';
            }

            if (descriptionInput)
            {
                descriptionInput.value =
                    '';
            }

            query =
                '';

            if (searchInput)
            {
                searchInput.value =
                    '';
            }

            showBrowse();

            renderResults();

            requestAnimationFrame(
                () =>
                {
                    root
                        .querySelector(
                            `[data-geneo-collection-row="${
                                CSS.escape(
                                    collection.id
                                )
                            }"]`
                        )
                        ?.scrollIntoView({
                            block:
                    'nearest'
                        });
                }
            );

            showToast(
                'Collection created.'
            );
        }
    );

    renderResults();
}

function renderGeneographCollectionModal({
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
          class="
            modal
            geneo-collection-modal
          "
          role="dialog"
          aria-modal="true"
          aria-labelledby="${escapeHtml(
                titleId
            )}">

          <div class="modal-header">
            <div>
              <h2
                id="${escapeHtml(
                    titleId
                )}">

                ${escapeHtml(
                    title
                )}
              </h2>

              <p>
                ${escapeHtml(
                    intro
                )}
              </p>
            </div>

            <button
              class="
                close-button
              "
              type="button"
              data-close
              aria-label="Close">

              ${icon.close}
            </button>
          </div>

          <form
            class="
              geneo-collection-form
            "
            id="${escapeHtml(
                formId
            )}">

            <div
              class="
                modal-body
                form-grid
              ">

              <div class="field">
                <label
                  for="${escapeHtml(
                        nameId
                    )}">

                  Collection name
                </label>

                <input
                  id="${escapeHtml(
                        nameId
                    )}"
                  type="text"
                  required
                  maxlength="120"
                  autocomplete="off"
                  value="${escapeHtml(
                        name
                    )}"
                  placeholder="e.g. Pawford research">
              </div>

              <div class="field">
                <label
                  for="${escapeHtml(
                        descriptionId
                    )}">

                  Description
                </label>

                <textarea
                  id="${escapeHtml(
                        descriptionId
                    )}"
                  rows="4"
                  maxlength="500"
                  placeholder="Optional description">${escapeHtml(
                        description
                    )}</textarea>
              </div>
            </div>

            <div class="modal-footer">
              <button
                class="
                  button
                  secondary
                "
                type="button"
                data-close>

                Cancel
              </button>

              <button
                class="
                  button
                  primary
                "
                type="submit">

                ${escapeHtml(
                    submitLabel
                )}
              </button>
            </div>
          </form>
        </div>
      `;
}

function openNewGeneographCollectionModal()
{
    openModal(
        renderGeneographCollectionModal({
            titleId:
            'newGeneographCollectionTitle',

            title:
            'Create collection',

            intro:
            'Collections keep related boards together.',

            formId:
            'geneographCollectionForm',

            nameId:
            'geneographCollectionName',

            descriptionId:
            'geneographCollectionDescription',

            submitLabel:
            'Create collection'
        })
    );

    const form =
        modalBackdrop.querySelector(
            '#geneographCollectionForm'
        );

    const nameInput =
        modalBackdrop.querySelector(
            '#geneographCollectionName'
        );

    const descriptionInput =
        modalBackdrop.querySelector(
            '#geneographCollectionDescription'
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

            const description =
                descriptionInput
                    ?.value
                    .trim()
            || '';

            if (!name)
            {
                nameInput?.focus();

                showToast(
                    'Enter a collection name.'
                );

                return;
            }

            const collection =
                createGeneographCollection({
                    name,
                    description
                });

            if (!collection)
            {
                return;
            }

            state.geneoLibraryView =
                'collection';

            state.geneoActiveCollectionId =
                collection.id;

            closeModal();

            renderGeneographHome();

            showToast(
                'Collection created.'
            );
        }
    );

    requestAnimationFrame(
        () =>
            nameInput?.focus()
    );
}

function openEditGeneographCollectionModal(
    collectionId
)
{
    const collection =
        getBoardCollection(
            collectionId
        );

    if (!collection)
    {
        return;
    }

    openModal(
        renderGeneographCollectionModal({
            titleId:
            'editGeneographCollectionTitle',

            title:
            'Edit collection',

            intro:
            'Update the collection name and description. Boards stay in this collection.',

            formId:
            'geneographEditCollectionForm',

            nameId:
            'geneographEditCollectionName',

            descriptionId:
            'geneographEditCollectionDescription',

            name:
            collection.name,

            description:
            collection.description,

            submitLabel:
            'Save changes'
        })
    );

    const form =
        modalBackdrop.querySelector(
            '#geneographEditCollectionForm'
        );

    const nameInput =
        modalBackdrop.querySelector(
            '#geneographEditCollectionName'
        );

    const descriptionInput =
        modalBackdrop.querySelector(
            '#geneographEditCollectionDescription'
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

                showToast(
                    'Enter a collection name.'
                );

                return;
            }

            collection.name =
                name;

            collection.description =
                descriptionInput
                    ?.value
                    .trim()
            || '';

            closeModal();

            renderGeneographHome();

            showToast(
                'Collection updated.'
            );
        }
    );

    requestAnimationFrame(
        () =>
        {
            nameInput?.focus();
            nameInput?.select();
        }
    );
}

function openDeleteGeneographCollectionModal(
    collectionId
)
{
    const collection =
        getBoardCollection(
            collectionId
        );

    if (!collection)
    {
        return;
    }

    const affectedBoards =
        getBoardsForCollection(
            collection.id,
            {
                projectId:
              collection.projectId,

                includeArchived:
              true
            }
        );
    const ru = state.language === 'ru';

    const title = ru
        ? 'Удалить коллекцию?'
        : 'Delete collection?';

    const description = ru
        ? 'Коллекция будет удалена. Холсты и их связи с другими коллекциями сохранятся.'
        : 'The collection will be deleted. Its canvases and their links to other collections will remain.';

    const impact = ru
        ? 'Будет удалена только связь с этой коллекцией. Данные холстов сохранятся.'
        : 'Only membership in this collection will be removed. Canvas data will remain unchanged.';

    const collectionLabel =
        localizedDataFieldValue(collection.name)
        || (ru ? 'Коллекция без названия' : 'Untitled collection');

    openModal(`
        <div
          class="modal"
          data-i18n-skip
          role="dialog"
          aria-modal="true"
          aria-labelledby="deleteGeneographCollectionTitle">

          <div class="modal-header">
            <div>
              <h2 id="deleteGeneographCollectionTitle">
                ${escapeHtml(title)}
              </h2>
              <p>${escapeHtml(description)}</p>
            </div>

            <button
              class="close-button"
              type="button"
              data-close
              aria-label="${ru ? 'Закрыть' : 'Close'}">
              ${icon.close}
            </button>
          </div>

          <div class="modal-body">
            <div class="notes-evidence-card">
              <strong>${escapeHtml(collectionLabel)}</strong>
              <p>
                ${escapeHtml(
                    geneographCanvasCountLabel(affectedBoards.length)
                )}
              </p>
              <p>${escapeHtml(impact)}</p>
            </div>
          </div>

          <div class="modal-footer">
            <button class="button secondary" type="button" data-close>
              ${ru ? 'Отмена' : 'Cancel'}
            </button>

            <button
              class="button danger"
              type="button"
              id="geneographConfirmDeleteCollection">
              ${ru ? 'Удалить коллекцию' : 'Delete collection'}
            </button>
          </div>
        </div>
      `);

    modalBackdrop
        .querySelector(
            '#geneographConfirmDeleteCollection'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                affectedBoards.forEach(
                    board =>
                    {
                        removeBoardFromCollection(
                            board.id,
                            collection.id,
                            {
                                projectId:
                      collection.projectId,

                                touchModified:
                      false
                            }
                        );
                    }
                );

                const index =
                    sampleData
                        .boardCollections
                        .findIndex(item =>
                            item.id
                    === collection.id
                        );

                if (index >= 0)
                {
                    sampleData
                        .boardCollections
                        .splice(
                            index,
                            1
                        );
                }

                if (
                    state.geneoActiveCollectionId
                === collection.id
                )
                {
                    state.geneoLibraryView =
                        'all';

                    state.geneoActiveCollectionId =
                        null;
                }

                closeModal();

                renderGeneographHome();

                showToast(
                    'Collection deleted. Boards kept.'
                );
            }
        );
}

function openGeneographCollectionMenu(
    collectionId,
    anchor
)
{
    closeMenu();

    const collection =
        getBoardCollection(
            collectionId
        );

    if (
        !collection
        || !anchor
    )
    {
        return;
    }

    const rect =
        anchor
            .getBoundingClientRect();

    const menu =
        document
            .createElement(
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

            closeMenu();

            if (
                action === 'edit'
            )
            {
                openEditGeneographCollectionModal(
                    collection.id
                );

                return;
            }

            if (
                action === 'delete'
            )
            {
                openDeleteGeneographCollectionModal(
                    collection.id
                );
            }
        }
    );

    bindMenuLifecycle(
        anchor
    );
}

function bindGeneographHome()
{
    main.querySelectorAll('[data-geneo-import]').forEach(button =>
        button.addEventListener('click', () => main.querySelector('[data-geneo-import-file]')?.click()));
    main.querySelector('[data-geneo-import-file]')?.addEventListener('change', event =>
    {
        const file = event.currentTarget.files?.[0];
        event.currentTarget.value = '';
        if (file) importGeneographBoardFile(file);
    });
    const importTile = main.querySelector('[data-geneo-create-tile]');
    if (importTile)
    {
        ['dragenter', 'dragover'].forEach(type => importTile.addEventListener(type, event =>
        {
            if (!Array.from(event.dataTransfer?.types || []).includes('Files')) return;
            event.preventDefault();
            event.stopPropagation();
            event.dataTransfer.dropEffect = 'copy';
            importTile.classList.add('is-dragging');
        }));
        importTile.addEventListener('dragleave', event =>
        {
            if (!importTile.contains(event.relatedTarget)) importTile.classList.remove('is-dragging');
        });
        importTile.addEventListener('drop', event =>
        {
            event.preventDefault();
            event.stopPropagation();
            importTile.classList.remove('is-dragging');
            const file = event.dataTransfer?.files?.[0];
            if (file) importGeneographBoardFile(file);
        });
        importTile.addEventListener('dragend', () => importTile.classList.remove('is-dragging'));
    }
    main
        .querySelectorAll(
            '[data-geneo-create]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                openCreateGeneographBoardModal
            );
        });

    sidebar
        .querySelectorAll(
            '[data-geneo-library-view]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    state.geneoLibraryView =
                        button.dataset
                            .geneoLibraryView;

                    state.geneoActiveCollectionId =
                        null;

                    renderGeneographHome();
                }
            );
        });

    sidebar
        .querySelectorAll(
            '[data-geneo-collection]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    state.geneoLibraryView =
                        'collection';

                    state.geneoActiveCollectionId =
                        button.dataset
                            .geneoCollection;

                    renderGeneographHome();
                }
            );
        });

    sidebar
        .querySelector(
            '[data-geneo-add-collection]'
        )
        ?.addEventListener(
            'click',
            openNewGeneographCollectionModal
        );

    sidebar
        .querySelectorAll(
            '[data-geneo-collection-menu]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                event =>
                {
                    event.stopPropagation();

                    openGeneographCollectionMenu(
                        button.dataset
                            .geneoCollectionMenu,
                        button
                    );
                }
            );
        });

    main.querySelector('[data-geneo-mobile-search]')?.addEventListener('click', () =>
    {
        geneoMobileBoardSearchOpen = true;
        main.querySelector('.geneo-board-toolbar')?.classList.add('mobile-search-open');
        main.querySelector('#geneoBoardSearch')?.focus();
    });
    main.querySelector('[data-geneo-mobile-search-close]')?.addEventListener('click', () =>
    {
        geneoMobileBoardSearchOpen = false;
        main.querySelector('.geneo-board-toolbar')?.classList.remove('mobile-search-open');
        main.querySelector('[data-geneo-mobile-search]')?.focus();
    });
    bindSearchInput(
        main,
        '#geneoBoardSearch',
        'geneoBoardSearch',
        renderGeneographHome
    );
    bindAppSortControl(main, {
        id: 'geneoBoardSort',
        options:
          APP_SORT_OPTIONS.geneograph,
        getField: () =>
            state.geneoBoardSort,
        getDirection: () =>
            state.geneoBoardSortDirection,

        onChange: ({
            field,
            direction
        }) =>
        {
            state.geneoBoardSort = field;
            state.geneoBoardSortDirection =
                direction;

            renderGeneographHome();
        }
    });
    main
        .querySelectorAll(
            '[data-geneo-board-view]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    state.geneoBoardViewMode =
                        button.dataset
                            .geneoBoardView;

                    renderGeneographHome();
                }
            );
        });

    main
        .querySelectorAll(
            '[data-geneo-open-board]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                event =>
                {
                    event.stopPropagation();

                    openGeneographBoard(
                        button.dataset
                            .geneoOpenBoard
                    );
                }
            );
        });

    main
        .querySelectorAll(
            '[data-geneo-fav]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                event =>
                {
                    event.stopPropagation();

                    const board =
                        getGeneographBoard(
                            button.dataset
                                .geneoFav
                        );

                    if (board)
                    {
                        board.favorite =
                            !board.favorite;

                        touchGeneographBoard(
                            board
                        );
                    }

                    renderGeneographHome();
                }
            );
        });

    main
        .querySelectorAll(
            '[data-geneo-board-menu]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                event =>
                {
                    event.stopPropagation();

                    openGeneographBoardMenu(
                        button.dataset
                            .geneoBoardMenu,
                        button
                    );
                }
            );
        });

    bindToasts(
        sidebar
    );
}

function openGeneographBoard(id)
{
    appNavigationMarkIntent();
    cancelGeneographPencilStroke();
    closeGeneographObjectContextMenu();
    closeMenu();
    const previousBoard = selectedGeneographBoard();
    if (previousBoard?.id !== id) geneoObjectClipboard = null;
    if (previousBoard?.id !== id)
    {
        state.geneoLayerSearch = '';
        state.geneoItemFilter = { types: [], status: 'all' };
        state.geneoItemFilterOpen = false;
    }
    if (state.geneoView === 'board' && previousBoard?.id && previousBoard.id !== id) captureGeneographViewport(previousBoard.id);
    const savedViewport = geneoSavedViewport(id);
    state.selectedGeneoBoardId = id;
    state.geneoView = 'board';
    state.selectedGeneoNodeId = null;
    state.selectedGeneoNodeIds = [];
    state.selectedGeneoConnectionId = null;
    state.selectedGeneoConnectionIds = [];
    state.selectedGeneoWaypointIndex = null;
    cancelGeneographConnectionDraft();
    state.geneoTool = 'pan';
    state.geneoZoom = savedViewport?.zoom || 83;
    if (!savedViewport && window.innerWidth <= 900)
        state.geneoZoom = window.innerWidth <= 350 ? 42 : 50;
    state.geneoInlineEditNodeId = null;
    state.geneoLayerRename = null;
    geneoCanvasRuntime = createGeneoCanvasRuntime(id);
    if (!savedViewport && window.innerWidth <= 900)
    {
        const nodes = selectedGeneographDiagram()?.nodes || [];
        const panel = nodes.find(node => node.id === 'gn-panel') || nodes.find(node => node.type === 'panel');
        const household = panel ? nodes.filter(node => node.parentPanelId === panel.id) : [];
        const focus = household.length ? household : panel ? [panel] : [];
        geneoCanvasRuntime.initialMobileCenter = focus.length
            ? {
                x: (Math.min(...focus.map(node => node.x)) + Math.max(...focus.map(node => node.x + node.width))) / 2,
                y: (Math.min(...focus.map(node => node.y)) + Math.max(...focus.map(node => node.y + node.height))) / 2
            }
            : geneoContentCenter();
    }
    geneoHistoryRuntime = {
        boardId: id,
        undo: [],
        redo: []
    };
    render();
}

function deleteGeneographBoard(
    boardId,
    projectId = currentProjectId()
)
{
    // Recheck the project and record when confirmation is submitted.
    if (projectId !== currentProjectId()) return false;

    const board = getGeneographBoard(boardId, { projectId });
    if (!board) return false;

    const index = sampleData.boards.findIndex(item =>
        item.id === boardId && item.projectId === projectId
    );

    if (index < 0) return false;

    invalidateGeneographBoardPreview(boardId);

    const ownsEditorState =
        state.selectedGeneoBoardId === boardId
        || geneoCanvasRuntime.boardId === boardId;

    if (ownsEditorState)
    {
        geneoObjectClipboard = null;
        // Cancel pending editor interactions before removing the canvas.
        cancelGeneographPencilStroke();
        cancelGeneographConnectionDraft();
        geneoPointerState = null;

        state.selectedGeneoBoardId = null;
        state.selectedGeneoNodeId = null;
        state.selectedGeneoNodeIds = [];
        state.selectedGeneoConnectionId = null;
        state.selectedGeneoConnectionIds = [];
        state.selectedGeneoWaypointIndex = null;
        state.geneoInlineEditNodeId = null;
        state.geneoLayerRename = null;
        state.geneoTool = 'pan';

        geneoCanvasRuntime = createGeneoCanvasRuntime(null);
        geneoPaintRuntime = createGeneoPaintRuntime();
    }

    if (
        ownsEditorState
        || geneoHistoryRuntime.boardId === boardId
    )
    {
        geneoHistoryRuntime = {
            boardId: null,
            undo: [],
            redo: []
        };
    }

    clearGeneographViewport(boardId);

    // Remove the canvas container, not the records it references.
    sampleData.boards.splice(index, 1);

    return true;
}

function openDeleteGeneographBoardConfirm(boardId)
{
    const projectId = currentProjectId();
    const board = getGeneographBoard(boardId, { projectId });

    if (!board) return;

    const ru = state.language === 'ru';

    const title = ru
        ? 'Удалить холст?'
        : 'Delete canvas?';

    const boardTitle =
        localizedDataFieldValue(board.title)
        || (ru ? 'Холст без названия' : 'Untitled canvas');

    const explanation = ru
        ? 'Холст, его расположение объектов и содержимое, созданное только на этом холсте, будут удалены. Связанные записи проекта и другие холсты сохранятся.'
        : 'This canvas, its object layout, and content created only on this canvas will be deleted. Linked project records and other canvases will remain.';

    const warning = ru
        ? 'Это действие невозможно отменить.'
        : 'This action cannot be undone.';

    openModal(`
        <div
          class="modal"
          data-i18n-skip
          role="dialog"
          aria-modal="true"
          aria-labelledby="deleteGeneographBoardTitle">

          <div class="modal-header">
            <div>
              <h2 id="deleteGeneographBoardTitle">
                ${escapeHtml(title)}
              </h2>
              <p>${escapeHtml(boardTitle)}</p>
            </div>

            <button
              class="close-button"
              type="button"
              data-close
              aria-label="${ru ? 'Закрыть' : 'Close'}">
              ${icon.close}
            </button>
          </div>

          <div class="modal-body">
            <p>${escapeHtml(explanation)}</p>
            <p><strong>${escapeHtml(warning)}</strong></p>
          </div>

          <div class="modal-footer">
            <button
              class="button secondary"
              type="button"
              data-close>
              ${ru ? 'Отмена' : 'Cancel'}
            </button>

            <button
              class="button danger"
              type="button"
              data-confirm-geneo-board-delete>
              ${ru ? 'Удалить холст' : 'Delete canvas'}
            </button>
          </div>
        </div>
      `);

    modalBackdrop
        .querySelector('[data-confirm-geneo-board-delete]')
        ?.addEventListener('click', event =>
        {
            const button = event.currentTarget;
            button.disabled = true;

            const deleted = deleteGeneographBoard(
                boardId,
                projectId
            );

            closeModal();

            if (!deleted)
            {
                showToast(
                    ru
                        ? 'Холст недоступен. Обновите список и повторите попытку.'
                        : 'The canvas is unavailable. Refresh the list and try again.'
                );
                return;
            }

            // Keep the current collection/filter context.
            // Empty collections remain available.
            state.geneoView = 'home';
            renderGeneographHome();

            showToast(
                ru ? 'Холст удалён.' : 'Canvas deleted.'
            );
        }, { once: true });
}

function openGeneographBoardMenu(
    id,
    anchor
)
{
    closeMenu();

    const board =
        getGeneographBoard(
            id
        );

    if (
        !board
        || !anchor
    )
    {
        return;
    }

    const rect =
        anchor
            .getBoundingClientRect();

    const menu =
        document
            .createElement(
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
                rect.right - 190
            )
        }px`;

    menu.innerHTML = `
        <button
          type="button"
          data-action="edit">

          Edit
        </button>

        <button
          type="button"
          data-action="duplicate">

          Duplicate
        </button>

        <button
          type="button"
          data-action="archive">

          ${
                board.archived
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

            closeMenu();

            if (
                action === 'edit'
            )
            {
                openEditGeneographBoardModal(
                    board.id
                );

                return;
            }

            if (
                action === 'archive'
            )
            {
                const nextArchived =
                    !board.archived;

                const updatedBoard =
                    setGeneographBoardArchived(
                        board.id,
                        nextArchived,
                        {
                            projectId:
                    board.projectId
                        }
                    );

                if (!updatedBoard)
                {
                    return;
                }

                state.geneoLibraryView =
                    nextArchived
                        ? 'archived'
                        : 'all';

                state.geneoActiveCollectionId =
                    null;

                renderGeneographHome();

                showToast(
                    nextArchived
                        ? 'Board archived.'
                        : 'Board unarchived.'
                );

                return;
            }
            if (action === 'delete')
            {
                openDeleteGeneographBoardConfirm(board.id);
                return;
            }
            showToast(
                `${
                    capitalize(
                        action
                    )
                } board action simulated.`
            );
        }
    );

    bindMenuLifecycle(
        anchor
    );
}

