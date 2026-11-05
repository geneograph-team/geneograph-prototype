let notesEditorScrollMemory = null;
let notesBrowserScrollMemory = null;

function renderNotes()
{
    appNavigationObserve();
    destroyNotesRichTextEditor();

    const validNotesViews =
        new Set([
            'all',
            'favorites',
            'archived',
            'collection'
        ]);

    if (
        !validNotesViews.has(
            state.notesView
        )
    )
    {
        state.notesView =
            'all';

        state.notesActiveCollectionId =
            null;
    }

    if (
        state.notesView === 'collection'
        && !getNoteCollection(
            state.notesActiveCollectionId
        )
    )
    {
        state.notesView =
            'all';

        state.notesActiveCollectionId =
            null;
    }

    workspace.classList.remove(
        'no-sidebar'
    );

    renderNotesSidebar();

    const list =
        filteredNotes();

    ensureNotesSelection(list);

    const selected =
        selectedNote();

    const editorOpen =
        Boolean(
            selected
          && !state.notesRightCollapsed
        );

    const shellClasses = [
        'notes-shell',

        editorOpen
            ? 'editor-open'
            : '',

        state.notesRightCollapsed
        && selected
            ? 'right-collapsed'
            : '',

        `notes-mobile-${
            state.notesMobilePane
            === 'editor'
                ? 'editor'
                : 'browser'
        }`
    ]
        .filter(Boolean)
        .join(' ');

    const width =
        Math.max(
            360,
            Math.min(
                600,
                Number(
                    state.notesBrowserWidth
                ) || 440
            )
        );

    main.innerHTML = `
        <div
          class="${shellClasses}"
          style="
            --notes-browser-width:
              ${width}px;
          ">

          ${renderNotesBrowserPane(
                list
            )}

          ${renderNotesRightPanel(
                selected
            )}
        </div>
      `;

    bindNotesControls();

    if (editorOpen)
    {
        initializeNotesRichTextEditor(
            selected
        );
    }
}

function renderNotesSidebar()
{
    const item = (
        view,
        label,
        svg
    ) => `
        <button
          class="side-link ${
                state.notesView === view
                    ? 'active'
                    : ''
            }"
          type="button"
          data-notes-view="${view}">

          ${svg}

          <span>${label}</span>
        </button>
      `;

    const collectionRows =
        getProjectNoteCollections()
            .map(collection =>
            {
                const active =
                    state.notesView
                === 'collection'
              && state
                  .notesActiveCollectionId
                === collection.id;

                return `
              <div
                class="
                  sidebar-entity-row
                  ${active ? 'active' : ''}
                ">

                <button
                  class="sidebar-entity-main"
                  type="button"
                  data-notes-collection="${escapeHtml(
                        collection.id
                    )}"
                  title="${escapeHtml(
                        collection.name
                    )}">

                  ${icon.folder}

                  <span class="sidebar-entity-name">
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
                  data-notes-collection-menu="${escapeHtml(
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

    sidebar.innerHTML = `
        <nav
          class="notes-sidebar"
          aria-label="Notes navigation">

          <div data-notes-tour-target="navigation">
            <div class="side-section-title">
              Navigation
            </div>

            <div class="side-nav">
              ${item(
                    'all',
                    'All notes',
                    icon.note
                )}

              ${item(
                    'favorites',
                    'Favourites',
                    icon.star
                )}

              ${item(
                    'archived',
                    'Archived',
                    icon.archive
                )}
            </div>
          </div>

          <div data-notes-tour-target="collections">
            <div
              class="
                side-section-title
                with-add
              ">

              <span>Collections</span>

              <button
                class="side-add-button"
                type="button"
                id="notesAddCollection"
                aria-label="Create collection"
                title="Create collection">

                ${icon.plus}
              </button>
            </div>

            <div class="side-nav">
              ${collectionRows || `<div class="sidebar-entity-empty">${escapeHtml(t('No collections yet'))}</div>`}
            </div>
          </div>

          <div class="notes-sidebar-tip">
            <div class="tip-card">
              <div class="tip-title">
                ${icon.tip}
                <span>Tip of the day</span>
              </div>

              <p>
                Link notes to people, places,
                sources and files to keep your
                research connected.
              </p>

              <button
                class="text-action tip-link"
                type="button"
                data-notes-tip>
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
          </div>
        </nav>
      `;

    bindNotesSidebarControls(
        sidebar
    );
}

function renderNotesContextFilterBar()
{
    const context =
        activeNotesContext();

    if (!context)
    {
        return '';
    }

    const copy =
        `${context.label}: ${context.name}`;

    return `
        <div
          class="resource-person-filterbar"
          aria-label="Active Notes filter">

          <span
            class="
              filter-chip
              active-filter-chip
            ">

            <span
              class="
                active-filter-chip-copy
              ">
              <strong>
                ${escapeHtml(
                    context.label
                )}:
              </strong>

              ${escapeHtml(
                    context.name
                )}
            </span>

            <button
              class="
                active-filter-chip-remove
              "
              type="button"
              data-clear-notes-context-filter
              aria-label="${escapeHtml(
                    `Remove ${copy} filter`
                )}"
              title="Remove filter">

              ${icon.close}
            </button>
          </span>
        </div>
      `;
}

function renderNotesBrowserPane(
    list
)
{
    const browserSubtitle =
        notesBrowserSubtitle();
    const filterCount =
        notesFilterCount();

    return `
        <section
          class="notes-browser-pane"
          aria-label="Notes browser">

          <header class="notes-browser-header">
            <div class="notes-browser-top">
              <div class="notes-browser-title">
                <h1 class="app-page-title">
                  ${escapeHtml(
                        notesTitle()
                    )}
                </h1>

                <p class="notes-browser-subtitle">
                  ${escapeHtml(
                        browserSubtitle
                    )}
                </p>
              </div>

              <div class="notes-browser-actions">
                <button
                  class="button primary"
                  type="button"
                  id="notesNewNoteButton">
                  ${icon.plus}
                  Add note
                </button>
              </div>

            ${renderNotesContextFilterBar()}

            <div class="notes-toolbar-line ${state.notesMobileSearchOpen ? 'search-open' : ''}">
              <button class="notes-mobile-search-toggle notes-control-button" type="button" id="notesMobileSearchToggle" aria-label="Search notes" title="Search notes">
                ${icon.search}
              </button>
              <div class="notes-toolbar-search">
                <label
                  class="app-search-field"
                  aria-label="Search notes">

                  ${icon.search}

                  <input
                    id="notesSearch"
                    type="search"
                    placeholder="Search notes..."
                    value="${escapeHtml(
                        state.notesSearch
                    )}">
                </label>
              </div>

              <div class="notes-toolbar-actions">
              <button
                class="
                  module-filter-button
                  notes-filter-button
                  ${
                        filterCount
                            ? 'active'
                            : ''
                    }
                "
                type="button"
                id="notesFilterButton"
                aria-haspopup="menu"
                aria-expanded="false"
                aria-label="${
                    filterCount
                        ? `Filter notes, ${filterCount} active`
                        : 'Filter notes'
                }"
                title="Filter notes">

                <span
                  class="module-filter-icon"
                  aria-hidden="true">

                  ${
                        filterCount
                            ? icon.filterclear
                            : icon.filter
                    }
                </span>

                <span class="notes-control-label">
                  Filter
                </span>

                ${
                    filterCount
                        ? `
                      <span class="module-filter-count">
                        ${filterCount}
                      </span>
                    `
                        : ''
                }
              </button>
              ${renderAppSortControl({
                    id: 'notesSort',
                    field: state.notesSort,
                    direction: state.notesSortDirection,
                    ariaLabel: 'Sort notes',
                    options: APP_SORT_OPTIONS.notes
                })}
              </div>

              <button class="notes-mobile-search-close notes-control-button" type="button" id="notesMobileSearchClose" aria-label="Close search" title="Close search">
                ${icon.close}
              </button>

              <button class="button primary notes-mobile-add" type="button" id="notesMobileNewNoteButton" aria-label="Add note" title="Add note">
                ${icon.plus}
                <span class="notes-mobile-add-full">Add note</span>
                <span class="notes-mobile-add-short">Add</span>
              </button>
            </div>

            ${renderNotesActiveFilters()}
          </header>

          <div class="notes-browser-scroll">
            ${
                list.length
                    ? renderNotesListView(
                        list
                    )
                    : renderNotesBrowserEmpty()
            }
          </div>
        </section>
      `;
}

function notesBrowserSubtitle()
{
    return 'Capture, organize and connect research notes across your family history.';
}

function formatNoteCollectionSummary(
    note
)
{
    const collections =
        getCollectionsForNote(
            note.id,
            {
                projectId:
              note.projectId
            }
        );

    if (!collections.length)
    {
        return 'No collections';
    }

    const visibleNames =
        collections
            .slice(0, 2)
            .map(
                collection =>
                    collection.name
            );

    const hiddenCount =
        collections.length
        - visibleNames.length;

    return [
        visibleNames.join(' · '),

        hiddenCount > 0
            ? `+${hiddenCount}`
            : ''
    ]
        .filter(Boolean)
        .join(' · ');
}

function formatNoteRelativeUpdatedAt(
    note
)
{
    const timestamp =
        Date.parse(
            note?.updatedAt || ''
        );

    if (
        !Number.isFinite(
            timestamp
        )
    )
    {
        return 'Updated date unknown';
    }

    const date =
        new Date(timestamp);

    const now =
        new Date();

    const noteDay =
        new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate()
        );

    const today =
        new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
        );

    const dayDifference =
        Math.round(
            (
                today.getTime()
            - noteDay.getTime()
            )
          / 86400000
        );

    if (dayDifference === 0)
    {
        return 'Updated today';
    }

    if (dayDifference === 1)
    {
        return 'Updated yesterday';
    }

    return `Updated ${
        formatNoteUpdatedAt(
            note
        )
    }`;
}

function noteEntityCountItems(
    note
)
{
    return Object.entries(
        NOTE_ENTITY_TYPES
    )
        .map(([
            type,
            config
        ]) => ({
            type,
            config,

            count:
            new Set(
                noteEntityLinkedIds(
                    note,
                    type
                )
            ).size
        }))
        .filter(
            item =>
                item.count > 0
        );
}

function renderNoteBrowserCollectionChips(
    note
)
{
    const collections =
        getCollectionsForNote(
            note.id,
            {
                projectId:
              note.projectId
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
        collections.slice(0, 2);

    const hiddenCount =
        collections.length
        - visible.length;

    return [
        ...visible.map(collection => `
          <span
            class="notes-row-collection-chip"
            title="${escapeHtml(
                collection.name
            )}">
            ${escapeHtml(
                collection.name
            )}
          </span>
        `),

        hiddenCount > 0
            ? `
            <span
              class="notes-row-collection-chip"
              title="${escapeHtml(
                    collections
                        .slice(2)
                        .map(collection =>
                            collection.name
                        )
                        .join(', ')
                )}">
              +${hiddenCount}
            </span>
          `
            : ''
    ]
        .filter(Boolean)
        .join('');
}

function noteBrowserMetadata(
    note
)
{
    return formatNoteRelativeUpdatedAt(note);
}

const defaultNotesFilters = Object.freeze({
    personId: '',
    placeId: '',
    sourceId: '',
    hasNotes: false,
    hasPhotos: false,
    hasFiles: false,
    hasEvents: false,
    noCollections: false
});

function notesFilterEntityOptions(type)
{
    const projectId = currentProjectId();
    const entities = type === 'person'
        ? getPeople(projectId)
        : (sampleData.places || []).filter(place => place.projectId === projectId);

    return entities
        .map(entity => ({
            value: entity.id,
            label: type === 'person'
                ? personResourceDisplayName(entity)
                : getPlaceDisplay(entity.id)
        }))
        .sort((left, right) => left.label.localeCompare(
            right.label,
            state.language === 'ru' ? 'ru' : 'en'
        ));
}

const notesFilterSchema = Object.freeze([
    { key: 'personId', label: 'Person', control: 'combobox', multiple: false,
        layout: 'full', placeholder: 'Search people', defaultValue: '',
        getOptions: () => notesFilterEntityOptions('person') },
    { key: 'placeId', label: 'Place', control: 'combobox', multiple: false,
        layout: 'full', placeholder: 'Search places', defaultValue: '',
        getOptions: () => notesFilterEntityOptions('place') },
    { key: 'sourceId', label: 'Source', control: 'combobox', multiple: false,
        layout: 'full', placeholder: 'Search sources...', defaultValue: '',
        getOptions: connectedSourceFilterOptions },
    { key: 'hasNotes', label: 'Connected notes', control: 'boolean',
        defaultValue: false },
    { key: 'hasPhotos', label: 'Connected photos', control: 'boolean',
        defaultValue: false },
    { key: 'hasFiles', label: 'Connected files', control: 'boolean',
        defaultValue: false },
    { key: 'hasEvents', label: 'Connected events', control: 'boolean',
        defaultValue: false },
    { key: 'noCollections', label: 'No collections', control: 'boolean',
        defaultValue: false }
]);

function notesFiltersWithDefaults(filters = state.notesFilters)
{
    return cloneSharedFilterValues(notesFilterSchema, {
        ...defaultNotesFilters,
        ...(filters || {})
    });
}

function noteMatchesNotesFilters(note, filters, projectId)
{
    if (filters.personId && !(note.linkedPersonIds || []).includes(filters.personId))
    {
        return false;
    }

    if (filters.placeId && !(note.linkedPlaceIds || []).includes(filters.placeId))
    {
        return false;
    }

    if (filters.sourceId && !sourceIdsForTarget('note', note.id, projectId).includes(filters.sourceId))
    {
        return false;
    }

    return !(
        (filters.hasNotes && !(note.relatedNoteIds || []).length)
        || (filters.hasPhotos && !(note.linkedPhotoIds || []).length)
        || (filters.hasFiles && !(note.linkedArchiveFileIds || []).length)
        || (filters.hasEvents && !(note.linkedEventIds || []).length)
        || (filters.noCollections && (note.collectionIds || []).length)
    );
}

function notesFilterCount()
{
    return Object.values(notesFiltersWithDefaults()).filter(Boolean).length;
}

function notesActiveFilterDescriptors()
{
    const filters = notesFiltersWithDefaults();

    return notesFilterSchema
        .filter(definition => Boolean(filters[definition.key]))
        .map(definition => {
            const value = filters[definition.key];
            const option = definition.control === 'combobox'
                ? sharedFilterOptions(definition).find(item => item.value === value)
                : null;

            return {
                key: definition.key,
                label: option?.label || definition.label
            };
        });
}

function renderNotesActiveFilters()
{
    const filters =
        notesActiveFilterDescriptors();

    if (!filters.length)
    {
        return '';
    }

    return `
        <div
          class="notes-active-filters"
          aria-label="Active note filters">

          ${filters
                .map(filter => `
              <button
                class="notes-active-filter-chip"
                type="button"
                data-clear-notes-filter="${escapeHtml(
                    filter.key
                )}"
                aria-label="Remove ${escapeHtml(
                    filter.label
                )} filter">
                ${escapeHtml(
                    filter.label
                )}
                ${icon.close}
              </button>
            `)
                .join('')}
        </div>
      `;
}

function openNotesFilterMenu(anchor)
{
    if (document.getElementById('projectMenu')?.classList.contains('notes-filter-popover'))
    {
        closeMenu();
        return;
    }

    closeMenu();

    const rect = anchor.getBoundingClientRect();
    const menu = document.createElement('div');
    menu.className = 'notes-filter-popover';
    menu.id = 'projectMenu';
    menu.innerHTML = `
        <div class="notes-filter-popover-head">
          <strong>Filter notes</strong>
          <span>Narrow the current Notes view.</span>
        </div>
        <div class="notes-filter-popover-body">
          ${renderSharedFilterFields({
              schema: notesFilterSchema,
              values: notesFiltersWithDefaults(),
              prefix: 'notes-popover-filter'
          })}
        </div>
        <div class="notes-filter-popover-footer">
          <button class="button secondary" type="button" data-notes-filter-reset>Reset</button>
          <button class="button primary" type="button" data-notes-filter-apply>Apply filters</button>
        </div>
    `;

    document.body.appendChild(menu);
    localizeUI(menu);
    anchor.setAttribute('aria-expanded', 'true');

    const controller = bindSharedFilterFields(menu, {
        schema: notesFilterSchema,
        values: notesFiltersWithDefaults(),
        prefix: 'notes-popover-filter'
    });

    const menuRect = menu.getBoundingClientRect();
    const gap = 6;
    const inset = 12;
    const below = Math.max(0, window.innerHeight - rect.bottom - gap - inset);
    const above = Math.max(0, rect.top - gap - inset);
    const placeBelow = menuRect.height <= below || below >= above;
    const available = placeBelow ? below : above;
    if (menuRect.height > available) menu.style.maxHeight = `${available}px`;
    menu.style.left = `${Math.max(inset, Math.min(window.innerWidth - menuRect.width - inset,
        rect.right - menuRect.width))}px`;
    menu.style.top = `${placeBelow ? rect.bottom + gap : rect.top - gap - menu.offsetHeight}px`;

    menu.querySelector('[data-notes-filter-reset]')?.addEventListener('click', () =>
    {
        state.notesFilters = { ...defaultNotesFilters };
        closeMenu();
        renderNotes();
    });

    menu.querySelector('[data-notes-filter-apply]')?.addEventListener('click', () =>
    {
        state.notesFilters = controller?.getValues() || notesFiltersWithDefaults();
        closeMenu();
        renderNotes();
    });

    bindMenuLifecycle(anchor);
}

function formatConnectedNoteMetadata(
    note
)
{
    return [
        formatNoteCollectionSummary(
            note
        ),

        formatNoteRelativeUpdatedAt(
            note
        )
    ]
        .filter(Boolean)
        .join(' · ');
}

function renderConnectedNoteList({
    notes = [],

    contextType = '',

    contextId = '',

    limit = CONNECTED_NOTES_PREVIEW_LIMIT,

    emptyText =
        'No connected notes.',

    allowUnlink =
        true
})
{
    const visible = notes.slice(
        0,
        Math.min(limit, CONNECTED_NOTES_PREVIEW_LIMIT)
    );

    if (!visible.length)
    {
        return `
          <div class="connected-note-empty">
            ${escapeHtml(
                emptyText
            )}
          </div>
        `;
    }

    const contextConfig =
        getNoteEntityConfig(
            contextType
        );

    const unlinkSupported =
        Boolean(
            allowUnlink
          && contextId
          && contextConfig
        );

    const contextNoun =
        contextConfig?.singular
        || String(
            contextConfig
                ?.contextLabel
          || 'item'
        ).toLowerCase();

    return `
        <div class="relationship-list notes-related-list connected-note-list">
          ${visible.map(note => renderRelatedNoteRelationItem({
              note,
              openAttributes: `
                data-connected-note-id="${escapeHtml(note.id)}"
                data-connected-note-context-type="${escapeHtml(contextType)}"
                data-connected-note-context-id="${escapeHtml(contextId)}"
              `,
              removeAttributes: unlinkSupported ? `
                data-connected-note-unlink="${escapeHtml(note.id)}"
                data-connected-note-context-type="${escapeHtml(contextType)}"
                data-connected-note-context-id="${escapeHtml(contextId)}"
              ` : '',
              removeContextLabel: contextNoun
          })).join('')}
        </div>
      `;
}

function connectedNoteContextRecord(
    contextType,
    contextId,
    projectId
)
{
    return noteEntityById(
        contextType,
        contextId,
        projectId
    );
}

function connectedNoteContextName(
    contextType,
    record
)
{
    return (
        noteEntityLabel(
            contextType,
            record
        )
        || 'this item'
    );
}

function connectedNoteContextNoun(
    contextType
)
{
    const config =
        getNoteEntityConfig(
            contextType
        );

    return (
        config?.singular
        || String(
            config?.contextLabel
          || 'item'
        ).toLowerCase()
    );
}

function unlinkConnectedNote({
    noteId,
    contextType,
    contextId
})
{
    const note =
        getNote(
            noteId,
            {
                projectId:
              currentProjectId(),

                includeArchived:
              true
            }
        );

    const config =
        getNoteEntityConfig(
            contextType
        );

    if (
        !note
        || !config
        || !contextId
    )
    {
        return false;
    }

    const currentIds =
        Array.isArray(
            note[
                config.field
            ]
        )
            ? note[
                config.field
            ]
            : [];

    if (
        !currentIds.includes(
            contextId
        )
    )
    {
        return false;
    }

    const updatedNote =
        setNoteEntityLinks(
            note.id,
            contextType,
            currentIds.filter(
                id =>
                    id !== contextId
            ),
            {
                projectId:
              note.projectId
            }
        );

    return Boolean(
        updatedNote
    );
}

function openConnectedNoteUnlinkConfirm({
    noteId,
    contextType,
    contextId,
    onUnlinked =
        null
})
{
    const contextConfig =
        getNoteEntityConfig(
            contextType
        );

    if (
        !contextConfig
        || !contextId
    )
    {
        return;
    }
    const note =
        getNote(
            noteId,
            {
                projectId:
              currentProjectId(),

                includeArchived:
              true
            }
        );

    if (!note)
    {
        showToast(
            'Note not found.'
        );

        return;
    }

    const config =
        getNoteEntityConfig(
            contextType
        );

    const linkedIds =
        config
            ? note[
                config.field
            ] || []
            : [];

    if (
        !config
        || !linkedIds.includes(
            contextId
        )
    )
    {
        showToast(
            'This note is no longer linked.'
        );

        return;
    }

    const contextRecord =
        connectedNoteContextRecord(
            contextType,
            contextId,
            note.projectId
        );

    if (!contextRecord)
    {
        showToast(
            'Linked record not found.'
        );

        return;
    }

    const noteTitle =
        note.title
        || 'Untitled note';

    const contextName =
        connectedNoteContextName(
            contextType,
            contextRecord
        );

    const contextNoun =
        connectedNoteContextNoun(
            contextType
        );

    openModal(`
        <div
          class="
            modal
            connected-note-unlink-modal
          "
          role="dialog"
          aria-modal="true"
          aria-labelledby="connectedNoteUnlinkTitle">

          <div class="modal-header">
            <div>
              <h2 id="connectedNoteUnlinkTitle">
                Unlink note from ${escapeHtml(
                    contextNoun
                )}?
              </h2>

              <p>
                ${escapeHtml(
                    noteTitle
                )}
              </p>
            </div>

            <button
              class="close-button"
              type="button"
              data-close
              aria-label="Close unlink confirmation">

              ${icon.close}
            </button>
          </div>

          <div
            class="
              modal-body
              unlink-relationship-body
            ">

            <div
              class="
                unlink-relationship-warning
                connected-note-unlink-warning
              ">

              <strong>
                The note will not be deleted.
              </strong>

              <span>
                Only the connection between
                “${escapeHtml(
                    noteTitle
                )}” and
                “${escapeHtml(
                    contextName
                )}” will be removed.
                The note will remain available in
                Notes and keep all its other links.
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
              data-confirm-connected-note-unlink>
              Unlink note
            </button>
          </div>
        </div>
      `);

    modalBackdrop
        .querySelector(
            '[data-confirm-connected-note-unlink]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                const unlinked =
                    unlinkConnectedNote({
                        noteId:
                  note.id,

                        contextType,

                        contextId
                    });

                /*
              Close first so the modal can return
              focus before the sidebar is rerendered.
              The module callback then establishes
              the final stable focus target.
            */
                closeModal();

                if (!unlinked)
                {
                    showToast(
                        'The note could not be unlinked.'
                    );

                    return;
                }

                onUnlinked?.({
                    noteId:
                note.id,

                    contextType,

                    contextId
                });

                showToast(
                    `Note unlinked from ${contextNoun}.`
                );
            }
        );
}

function bindConnectedNoteLinks(
    root,
    {
        onUnlinked =
            null
    } = {}
)
{
    root
        .querySelectorAll(
            '[data-connected-note-id]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    openCentralNoteFromContext(
                        button.dataset
                            .connectedNoteId,

                        {
                            type:
                    button.dataset
                        .connectedNoteContextType
                    || '',

                            id:
                    button.dataset
                        .connectedNoteContextId
                    || ''
                        }
                    );
                }
            );
        });

    root
        .querySelectorAll(
            '[data-connected-note-unlink]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                event =>
                {
                    event.preventDefault();
                    event.stopPropagation();

                    openConnectedNoteUnlinkConfirm({
                        noteId:
                  button.dataset
                      .connectedNoteUnlink,

                        contextType:
                  button.dataset
                      .connectedNoteContextType
                  || '',

                        contextId:
                  button.dataset
                      .connectedNoteContextId
                  || '',

                        onUnlinked:
                  payload =>
                  {
                      if (
                          typeof onUnlinked
                      === 'function'
                      )
                      {
                          onUnlinked(
                              payload
                          );

                          return;
                      }

                      /*
                      Shared fallback for modules that use
                      connected Note rows but do not yet have
                      a viewport-preserving local renderer.
                    */
                      render();
                  }
                    });
                }
            );
        });
}

function renderNotesListView(
    list
)
{
    return `
        <div
          class="notes-list"
          role="list">

          ${list
                .map(
                    renderNoteListRow
                )
                .join('')}
        </div>
      `;
}

function renderNoteListRow(
    note
)
{
    const selected =
        note.id
          === state.selectedNoteId;

    const metadata =
        noteBrowserMetadata(
            note
        );

    return `
        <article
          class="notes-row ${
                selected ? 'active' : ''
            }"
          role="listitem"
          data-note-id="${escapeHtml(
                note.id
            )}">

          <button
            class="notes-row-favorite ${
                note.favorite ? 'active' : ''
            }"
            type="button"
            data-note-favorite="${escapeHtml(
                note.id
            )}"
            aria-pressed="${note.favorite}"
            aria-label="${escapeHtml(
                note.favorite
                    ? `Remove ${note.title} from favourites`
                    : `Add ${note.title} to favourites`
            )}"
            title="${
                note.favorite
                    ? 'Remove from favourites'
                    : 'Add to favourites'
            }">
            ${icon.star}
          </button>

          <button
            class="notes-row-open"
            type="button"
            data-note-row="${escapeHtml(
                note.id
            )}"
            ${
                selected
                    ? 'aria-current="true"'
                    : ''
            }>
            <span
              class="notes-row-title"
              title="${escapeHtml(
                    note.title
                )}">
              ${escapeHtml(
                    note.title
                )}
            </span>

            <span class="notes-row-excerpt">
              ${escapeHtml(
                    noteExcerpt(
                        note,
                        180
                    )
                || 'No note content'
                )}
            </span>

            <span class="notes-row-footer">
              <span class="notes-row-collections">
                ${renderNoteBrowserCollectionChips(
                    note
                )}
              </span>

              <span
                class="notes-row-metadata"
                title="${escapeHtml(
                    metadata
                )}">
                ${escapeHtml(
                    metadata
                )}
              </span>
            </span>
          </button>

          <button
            class="notes-row-menu"
            type="button"
            aria-haspopup="menu"
            data-note-menu="${escapeHtml(
                note.id
            )}"
            aria-label="${escapeHtml(
                `More actions for ${note.title}`
            )}">
            ${icon.more}
          </button>
        </article>
      `;
}

function renderNotesBrowserEmpty()
{
    if (
        state.notesSearch.trim()
    )
    {
        return `
          <div class="notes-empty">
            <div class="notes-empty-card">
              <h2>No results</h2>

              <p>
                Try a different search
                term or clear the search.
              </p>

              <button
                class="button secondary"
                type="button"
                id="notesClearSearch">
                Clear search
              </button>
            </div>
          </div>
        `;
    }

    const copy =
        state.notesView === 'archived'
            ? [
                'No archived notes',
                'Archived notes will appear here.'
            ]
            : [
                'No notes here',
                'Create a note to start collecting research thoughts.'
            ];

    return `
        <div class="notes-empty">
          <div class="notes-empty-card">
            ${icon.note}
            <h2>${copy[0]}</h2>
            <p>${copy[1]}</p>
            ${state.notesView === 'archived' ? '' : `<button class="button primary" type="button" id="notesEmptyCreate">${icon.plus} ${escapeHtml(t('Add note'))}</button>`}
          </div>
        </div>
      `;
}

function renderNotesRightPanel(
    note
)
{
    if (!note)
    {
        return '';
    }

    if (
        state.notesRightCollapsed
    )
    {
        return `
          <aside
            class="notes-right-rail"
            aria-label="Collapsed note editor">
            <button
              class="notes-editor-restore"
              type="button"
              id="notesToggleRight"
              aria-expanded="false"
              aria-controls="notesRightPane"
              aria-label="Show note editor"
              title="Show note editor">
              ${icon.doublechevronSidebar}
            </button>
          </aside>
        `;
    }

    return `
        <div
          class="notes-resizer"
          id="notesResizer"
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize notes browser"
          aria-valuemin="360"
          aria-valuemax="600"
          aria-valuenow="${Math.round(
                state.notesBrowserWidth
            || 440
            )}"
          tabindex="0">
        </div>

        <aside
          class="notes-right-pane"
          id="notesRightPane"
          aria-label="Note editor">
          ${renderNoteEditorContent(
                note
            )}
        </aside>
      `;
}


function noteEditorSectionIsOpen(
    id
)
{
    return (
        state.notesEditorSections?.[
            id
        ] !== false
    );
}

function renderNoteEditorSection({
    id,
    title,
    meta = '',
    action = '',
    body
})
{
    return `
        <div
          class="notes-panel-section"
          data-note-editor-section="${escapeHtml(
                id
            )}">
          ${renderInspectorSection(
                id,
                title,
                meta,
                body,
                action,
                {
                    open:
                noteEditorSectionIsOpen(
                    id
                ),

                    toggleAttribute:
                'data-note-editor-section-toggle',

                    sectionId:
                `noteEditorSection-${
                    id
                }`,

                    inlineAction:
                Boolean(action),

                    alwaysShowAction:
                Boolean(action)
                }
            )}
        </div>
      `;
}

function renderNoteSummaryChips(
    note
)
{
    const NOTE_SUMMARY_CHIP_ORDER =
        Object.freeze([
            'people',
            'events',
            'photos',
            'files',
            'related',
            'places',
            'sources'
        ]);
    const items =
        noteEntityCountItems(
            note
        )
            .map(item => ({
                sectionKey:
              item.config.sectionKey,

                tone:
              item.config.chipTone,

                count:
              item.count,

                label:
              item.count === 1
                  ? item.config.singular
                  : item.config.plural
            }));

    const relatedCount =
        new Set(
            note.relatedNoteIds || []
        ).size;

    if (relatedCount)
    {
        items.push({
            sectionKey:
            'related',

            tone:
            'notes',

            count:
            relatedCount,

            label:
            relatedCount === 1
                ? 'note'
                : 'notes'
        });
    }

    items.sort(
        (
            first,
            second
        ) =>
        {
            const firstIndex =
                NOTE_SUMMARY_CHIP_ORDER
                    .indexOf(
                        first.sectionKey
                    );

            const secondIndex =
                NOTE_SUMMARY_CHIP_ORDER
                    .indexOf(
                        second.sectionKey
                    );

            return (
                (
                    firstIndex === -1
                        ? NOTE_SUMMARY_CHIP_ORDER
                            .length
                        : firstIndex
                )
            -
            (
                secondIndex === -1
                    ? NOTE_SUMMARY_CHIP_ORDER
                        .length
                    : secondIndex
            )
            );
        }
    );

    if (!items.length)
    {
        return '';
    }

    return `
        <div
          class="notes-summary-chips app-chip-row"
          aria-label="Note connections">
          ${items
                .map(item => `
              <button
                class="
                  app-chip
                  app-chip--${escapeHtml(
                        item.tone
                    )}
                "
                type="button"
                data-note-summary-section="${escapeHtml(
                    item.sectionKey
                )}"
                aria-label="Show ${item.count} ${escapeHtml(
                    item.label
                )}">
                ${item.count}
                ${escapeHtml(
                    item.label
                )}
              </button>
            `)
                .join('')}
        </div>
      `;
}

function noteBodyWordCount(
    note
)
{
    const body =
        String(
            note?.body || ''
        )
            .trim();

    return body
        ? body
            .split(/\s+/)
            .length
        : 0;
}

function formatNoteInfoDate(
    value
)
{
    const timestamp =
        Date.parse(
            value || ''
        );

    if (
        !Number.isFinite(
            timestamp
        )
    )
    {
        return 'Unknown';
    }

    return new Intl
        .DateTimeFormat(
            undefined,
            {
                dateStyle:
              'medium',

                timeStyle:
              'short'
            }
        )
        .format(
            new Date(
                timestamp
            )
        );
}

function renderNoteEditorContent(
    note
)
{
    /*
        Do not derive visual order from the property
        order of NOTE_ENTITY_TYPES. The data registry
        and the editor layout serve different purposes.
      */
    const primaryLinkedSections =
        [
            'person',
            'event',
            'photo',
            'archiveFile'
        ]
            .map(type =>
                renderNoteLinkedEntitySection(
                    note,
                    type
                )
            )
            .join('');

    const secondaryLinkedSections =
        [
            'place',
            'source'
        ]
            .map(type =>
                renderNoteLinkedEntitySection(
                    note,
                    type
                )
            )
            .join('');

    return `
        <article class="notes-editor-card">
          <header class="notes-editor-header">
            <div class="notes-editor-topline">
              <div class="notes-editor-navigation">
                <button
                  class="notes-editor-back"
                  type="button"
                  id="notesBackToBrowser"
                  aria-label="Back to notes"
                  title="Back to notes">
                  ${icon.arrow}
                </button>

                <button
                  class="notes-editor-collapse"
                  type="button"
                  id="notesToggleRight"
                  aria-expanded="true"
                  aria-controls="notesRightPane"
                  aria-label="Collapse note editor"
                  title="Collapse note editor">
                  ${icon.doublechevronSidebar}
                </button>
              </div>

              <div class="notes-editor-actions">
                <span
                  class="notes-save-status ${
                        state.notesSaveStatus
                            .toLowerCase()
                    }"
                  id="notesSaveStatus"
                  role="status"
                  aria-live="polite">
                  ${escapeHtml(
                        state.notesSaveStatus
                    )}
                </span>

                <button
                  class="control-icon-button notes-icon-button ${
                        note.favorite
                            ? 'active'
                            : ''
                    }"
                  type="button"
                  id="notesFavoriteButton"
                  aria-pressed="${note.favorite}"
                  aria-label="${
                        note.favorite
                            ? 'Remove from favourites'
                            : 'Add to favourites'
                    }"
                  title="${
                        note.favorite
                            ? 'Remove from favourites'
                            : 'Add to favourites'
                    }">
                  ${icon.star}
                </button>

                <button
                  class="control-icon-button notes-icon-button"
                  type="button"
                  id="notesEditorMenuButton"
                  aria-haspopup="menu"
                  aria-label="More note actions"
                  title="More note actions">
                  ${icon.more}
                </button>
              </div>
            </div>

            <input
              class="notes-title-input"
              id="notesTitleInput"
              data-source-value="${escapeHtml(note.title)}"
              value="${escapeHtml(
                    localizedDataFieldValue(note.title)
                )}"
              placeholder="Untitled note"
              aria-label="Note title">

            ${renderNoteSummaryChips(
                note
            )}
          </header>

          <div class="notes-editor-body">
            <div class="notes-editor-writing">
              <div class="notes-rich-editor-shell">
                <span
                  class="notes-rich-editor-label"
                  id="notesBodyLabel">
                  Note body
                </span>

                ${renderRichTextToolbar({
                    id:
                    'notesRichTextToolbar',

                    ariaLabel:
                    'Note formatting'
                })}

                <div
                  id="notesRichTextEditor"
                  aria-labelledby="notesBodyLabel">
                </div>

                <textarea
                  class="notes-body-input"
                  id="notesBodyInput"
                  data-source-value="${escapeHtml(note.body)}"
                  aria-label="Note body"
                  placeholder="Start writing…"
                  hidden>${escapeHtml(
                        localizedNoteBodyText(note.body)
                    )}</textarea>
              </div>
            </div>

            <div class="notes-editor-sections">
              ${renderNoteCollectionsSection(
                    note
                )}

              ${renderNoteChecklistSection(
                    note
                )}

              ${primaryLinkedSections}

              ${renderNoteRelatedSection(
                    note
                )}

              ${secondaryLinkedSections}

              ${renderNoteInfoSection(
                    note
                )}
            </div>
          </div>
        </article>
      `;
}

function renderNoteCollectionsSection(
    note
)
{
    const collections =
        getCollectionsForNote(
            note.id,
            {
                projectId:
              note.projectId
            }
        );

    const rows =
        collections.length
            ? `
            <div class="notes-collection-assignment-list">
              ${collections
                    .map(collection => `
                  <div class="notes-collection-assignment">
                    ${icon.folder}

                    <span
                      class="notes-collection-assignment-name"
                      title="${escapeHtml(
                            collection.name
                        )}">
                      ${escapeHtml(
                            collection.name
                        )}
                    </span>

                    <button
                      class="notes-collection-remove"
                      type="button"
                      data-note-remove-collection="${escapeHtml(
                            collection.id
                        )}"
                      aria-label="Remove ${escapeHtml(
                            collection.name
                        )} from this note"
                      title="Remove from this note">
                      ${icon.close}
                    </button>
                  </div>
                `)
                    .join('')}
            </div>
          `
            : `
            <span class="notes-section-empty">
              This note is not in a collection.
            </span>
          `;

    return renderNoteEditorSection({
        id:
          'collections',

        title:
          'Collections',

        meta:
          `${collections.length} ${
              collections.length === 1
                  ? 'collection'
                  : 'collections'
          }`,

        action: `
          <button
            class="panel-action"
            type="button"
            id="notesManageCollections"
            aria-label="Add to collection">
            <span class="panel-button-label">
              <span class="panel-button-icon" aria-hidden="true">${icon.plus}</span>
              <span class="panel-button-text notes-collection-add-full">Add to collection</span>
              <span class="panel-button-text notes-collection-add-short">Add</span>
            </span>
          </button>
        `,

        body:
          rows
    });
}


function renderNoteChecklistSection(
    note
)
{
    const items =
        note.checklist || [];

    const completed =
        items.filter(
            item => item.done
        ).length;

    const rows =
        items.length
            ? `
            <div class="notes-checklist-list">
              ${items
                    .map(item => `
                  <div
                    class="notes-checklist-row ${
                        item.done
                            ? 'done'
                            : ''
                    }">
                    <input
                      type="checkbox"
                      data-note-checklist-toggle="${escapeHtml(
                            item.id
                        )}"
                      aria-label="Complete ${escapeHtml(
                            item.text
                        )}"
                      ${
                            item.done
                                ? 'checked'
                                : ''
                        }>

                    <input
                      class="notes-checklist-text"
                      type="text"
                      maxlength="240"
                      data-note-checklist-text="${escapeHtml(
                            item.id
                        )}"
                      data-source-value="${escapeHtml(item.text)}"
                      value="${escapeHtml(
                            localizedDataFieldValue(item.text)
                        )}"
                      aria-label="Checklist item">

                    <button
                      class="notes-checklist-delete"
                      type="button"
                      data-note-checklist-delete="${escapeHtml(
                            item.id
                        )}"
                      aria-label="Delete checklist item"
                      title="Delete checklist item">
                      ${icon.trash}
                    </button>
                  </div>
                `)
                    .join('')}
            </div>
          `
            : `
            <span class="notes-section-empty">
              No checklist items.
            </span>
          `;

    return renderNoteEditorSection({
        id:
          'checklist',

        title:
          'Checklist',

        meta:
          items.length
              ? `${completed} of ${
                  items.length
              } complete`
              : 'No items',

        action: `
          <button
            class="panel-action"
            type="button"
            id="notesAddChecklistItem">
            ${renderPanelButtonLabel(
                icon.plus,
                'Add item'
            )}
          </button>
        `,

        body:
          rows
    });
}

function eventRelationItemModel(
    event
)
{
    if (!event)
    {
        return null;
    }

    const owner =
        placeInspectorEventOwnerIds(
            event
        )
            .map(personId =>
                getPerson(
                    personId
                )
            )
            .find(person =>
                person
            && !person.deleted
            && (
                !event.projectId
              || person.projectId
                === event.projectId
            )
            );

    /*
        Events without a valid owner cannot use
        the Notes event-row presentation.
      */
    if (!owner)
    {
        return null;
    }

    const ownerName =
        personResourceDisplayName(
            owner
        )
        || owner.names?.display
        || 'Unnamed person';

    const presentation =
        placeInspectorEventPresentation(
            event,
            owner.id
        );

    const eventTitle =
        presentation.title
        || placeInspectorEventLabel(
            event
        )
        || 'Event';

    const eventDate =
        presentation.date
        || 'Date unknown';

    const eventPlace =
        timelinePlaceLabel(
            event
        );

    const datePlaceLabel =
        [
            eventDate,
            eventPlace
        ]
            .filter(Boolean)
            .join(' · ');

    const relatedPeople =
        placeInspectorEventRelatedPeople(
            event,
            owner.id
        );

    let relationshipLabel =
        '';

    if (
        event.type
          === 'childBirth'
    )
    {
        relationshipLabel =
            presentation.relationship
          || '';
    }
    else if (
        relatedPeople.length === 1
    )
    {
        relationshipLabel =
            `With ${
                personResourceDisplayName(
                    relatedPeople[0]
                )
            || relatedPeople[0]
                .names?.display
            || 'another person'
            }`;
    }
    else if (
        relatedPeople.length > 1
    )
    {
        const firstName =
            personResourceDisplayName(
                relatedPeople[0]
            )
          || relatedPeople[0]
              .names?.display
          || 'another person';

        relationshipLabel =
            `With ${firstName} + ${
                relatedPeople.length - 1
            } ${
                relatedPeople.length === 2
                    ? 'person'
                    : 'people'
            }`;
    }
    else
    {
        relationshipLabel =
            presentation.relationship
          || '';
    }

    return {
        owner,
        ownerName,
        eventTitle,
        datePlaceLabel,
        relationshipLabel
    };
}

function renderEventRelationItem({
    event,
    openAttributes =
        '',
    removeAttributes =
        '',
    removeContextLabel =
        'item',
    readOnly =
        false
} = {})
{
    const model =
        eventRelationItemModel(
            event
        );

    if (!model)
    {
        return '';
    }

    const {
        owner,
        ownerName,
        eventTitle,
        datePlaceLabel,
        relationshipLabel
    } = model;

    const content = `
        <span
          class="
            notes-event-avatar
          "
          aria-hidden="true">

          ${renderPersonAvatar(
                owner,
                'small-avatar notes-event-owner-avatar',
                {
                    element:
                'span',

                    attrs:
                'aria-hidden="true"'
                }
            )}

          <span
            class="
              notes-event-avatar-badge
            ">

            ${timelineEventIcon(
                event
            )}
          </span>
        </span>

        <span
          class="
            notes-event-copy
          ">

          <span
            class="
              notes-event-owner
            ">

            ${escapeHtml(
                ownerName
            )}
          </span>

          <strong
            class="
              notes-event-title
            ">

            ${escapeHtml(
                eventTitle
            )}
          </strong>

          <span
            class="
              notes-event-date-place
            ">

            ${escapeHtml(
                datePlaceLabel
            )}
          </span>

          ${
                relationshipLabel
                    ? `
                <span
                  class="
                    notes-event-relationship
                  ">

                  ${escapeHtml(
                        relationshipLabel
                    )}
                </span>
              `
                    : ''
            }
        </span>
      `;

    return `
        <div
          class="
            relation-row
            notes-event-item
          ">

          ${
                readOnly
                    ? `
                <div
                  class="
                    relation-row-main
                    notes-event-main
                  ">

                  ${content}
                </div>
              `
                    : `
                <button
                  class="
                    relation-row-main
                    notes-event-main
                  "
                  type="button"
                  ${openAttributes}
                  aria-label="Open ${escapeHtml(
                        eventTitle
                    )} for ${escapeHtml(
                        ownerName
                    )}">

                  ${content}
                </button>
              `
            }

          ${
                !readOnly
            && removeAttributes
                    ? `
                <div
                  class="
                    relation-actions
                  ">

                  <button
                    class="
                      relation-action-button
                      danger
                    "
                    type="button"
                    ${removeAttributes}
                    aria-label="${escapeHtml(t('Unlink'))} ${escapeHtml(
                        eventTitle
                    )}"
                    title="${escapeHtml(t('Unlink'))}">

                    ${icon.unlink}
                  </button>
                </div>
              `
                    : ''
            }
        </div>
      `;
}

function renderNoteLinkedRecordRows(
    type,
    config,
    records,
    noteId =
        ''
)
{
    if (type === 'person')
    {
        return `
          <div
            class="
              relationship-list
              notes-people-list
            ">
            ${records
                .map(person =>
                {
                    const name =
                        person.names?.display
                  || 'Unnamed person';

                    return `
                  <div class="relation-row">
                    <button
                      class="relation-row-main"
                      type="button"
                      data-note-linked-open
                      data-note-linked-type="person"
                      data-note-linked-id="${escapeHtml(
                            person.id
                        )}"
                      aria-label="Open profile for ${escapeHtml(
                            name
                        )}">

                      ${renderPersonAvatar(
                            person,
                            'small-avatar',
                            {
                                element: 'span'
                            }
                        )}

                      <span class="relation-row-copy">
                        <strong>
                          ${escapeHtml(
                                name
                            )}
                        </strong>

                        <span>
                          ${escapeHtml(
                                albumPhotoPersonDates(
                                    person
                                )
                            )}
                        </span>
                      </span>
                    </button>

                    <div class="relation-actions">
                      <button
                        class="
                          relation-action-button
                          danger
                        "
                        type="button"
                        data-note-linked-remove
                        data-note-linked-type="person"
                        data-note-linked-id="${escapeHtml(
                            person.id
                        )}"
                        aria-label="${escapeHtml(t('Unlink'))} ${escapeHtml(
                            name
                        )}"
                        title="${escapeHtml(t('Unlink'))}">

                        ${icon.unlink}
                      </button>
                    </div>
                  </div>
                `;
                })
                .join('')}
          </div>
        `;
    }

    if (type === 'place')
    {
        return `
          <div
            class="
              relationship-list
              notes-place-list
            ">

            ${records
                .map(place =>
                {
                    const primaryName =
                        placePrimaryName(
                            place
                        )
                  || place.name
                  || 'Unnamed place';

                    const secondaryName =
                        placeSecondaryName(
                            place
                        )
                  || 'No broader place recorded';

                    return `
                  <div
                    class="
                      relation-row
                      notes-place-item
                    ">

                    <button
                      class="
                        relation-row-main
                        notes-place-main
                      "
                      type="button"
                      data-note-linked-open
                      data-note-linked-type="place"
                      data-note-linked-id="${escapeHtml(
                            place.id
                        )}"
                      aria-label="${escapeHtml(t('Open place:') + ' ' + primaryName)}">

                      <span
                        class="notes-place-icon"
                        aria-hidden="true">

                        ${icon.mapPin}
                      </span>

                      <span class="notes-place-copy">

                        <strong>
                          ${escapeHtml(
                                primaryName
                            )}
                        </strong>

                        <span class="notes-place-secondary">
                          ${escapeHtml(
                                secondaryName
                            )}
                        </span>

                      </span>
                    </button>

                    <div class="relation-actions">
                      <button
                        class="
                          relation-action-button
                          danger
                        "
                        type="button"
                        data-note-linked-remove
                        data-note-linked-type="place"
                        data-note-linked-id="${escapeHtml(
                            place.id
                        )}"
                        aria-label="${escapeHtml(t('Unlink'))} ${escapeHtml(
                            primaryName
                        )}"
                        title="${escapeHtml(t('Unlink'))}">

                        ${icon.unlink}
                      </button>
                    </div>
                  </div>
                `;
                })
                .join('')}
          </div>
        `;
    }

    if (
        type === 'event'
    )
    {
        return `
          <div
            class="
              relationship-list
              notes-event-list
            ">

            ${records
                .map(event =>
                    renderEventRelationItem({
                        event,

                        openAttributes:
                    `
                      data-note-linked-open
                      data-note-linked-type="event"
                      data-note-linked-id="${escapeHtml(
                            event.id
                        )}"
                    `,

                        removeAttributes:
                    `
                      data-note-linked-remove
                      data-note-linked-type="event"
                      data-note-linked-id="${escapeHtml(
                            event.id
                        )}"
                    `,

                        removeContextLabel:
                    'note'
                    })
                )
                .join('')}
          </div>
        `;
    }

    if (
        type === 'archiveFile'
    )
    {
        return renderConnectedFileList({
            files:
            records,

            contextType:
            'note',

            contextId:
            noteId,

            emptyText:
            'No files linked to this note.'
        });
    }

    if (
        type === 'source'
    )
    {
        const note =
            getNote(
                noteId,
                {
                    includeArchived:
                true
                }
            );

        return renderConnectedSourceList({
            targetType:
            'note',

            targetId:
            noteId,

            projectId:
            note?.projectId
            || records[0]?.projectId
            || currentProjectId(),

            sources:
            records,

            /*
            Notes should display every connected
            source, not a shortened preview.
          */
            limit:
            Number.POSITIVE_INFINITY,

            emptyText:
            'No sources linked to this note.'
        });
    }

    return `
        <div class="notes-linked-list">
          ${records
                .map(record => `
              <div class="notes-linked-row">
                <button
                  class="notes-linked-main"
                  type="button"
                  data-note-linked-open
                  data-note-linked-type="${escapeHtml(
                        type
                    )}"
                  data-note-linked-id="${escapeHtml(
                        record.id
                    )}">

                  <strong>
                    ${escapeHtml(
                        noteEntityLabel(
                            type,
                            record
                        )
                    )}
                  </strong>

                  <span>
                    ${escapeHtml(
                        noteEntityMeta(
                            type,
                            record
                        )
                    )}
                  </span>
                </button>

                <div class="notes-linked-actions">
                  <button
                    class="
                      notes-linked-action
                      danger
                    "
                    type="button"
                    data-note-linked-remove
                    data-note-linked-type="${escapeHtml(
                        type
                    )}"
                    data-note-linked-id="${escapeHtml(
                        record.id
                    )}"
                    aria-label="Remove ${escapeHtml(
                        config.singular
                    )} link"
                    title="Remove link">

                    ${icon.close}
                  </button>
                </div>
              </div>
            `)
                .join('')}
        </div>
      `;
}

function renderNoteLinkedPhotoGrid(
    records
)
{
    return `
        <div
          class="
            connected-photo-grid
            notes-linked-photo-grid
          ">

          ${records
                .map(photo =>
                {
                    const label =
                        noteEntityLabel(
                            'photo',
                            photo
                        );

                    return `
                <div class="person-connected-photo-item">
                  <button
                    class="connected-photo-button"
                    type="button"
                    data-note-linked-open
                    data-note-linked-type="photo"
                    data-note-linked-id="${escapeHtml(
                        photo.id
                    )}"
                    title="${escapeHtml(
                        label
                    )}"
                    aria-label="Open ${escapeHtml(
                        label
                    )} in Albums">

                    ${renderPhotoThumbnail(
                        photo,
                        {
                            label
                        }
                    )}
                  </button>

                  <button
                    class="connected-photo-unlink"
                    type="button"
                    data-note-linked-remove
                    data-note-linked-type="photo"
                    data-note-linked-id="${escapeHtml(
                        photo.id
                    )}"
                    aria-label="${escapeHtml(t('Unlink'))} ${escapeHtml(label)}"
                    title="${escapeHtml(t('Unlink'))}">

                    ${icon.unlink}
                  </button>
                </div>
              `;
                })
                .join('')}
        </div>
      `;
}

function renderNoteLinkedEntitySection(
    note,
    type
)
{
    const config =
        getNoteEntityConfig(
            type
        );

    if (!config)
    {
        return '';
    }

    const records =
        noteEntityRecordsForNote(
            note,
            type
        );

    const countLabel =
        `${records.length} ${
            records.length === 1
                ? config.singular
                : config.plural
        }`;

    const rows =
        type === 'source'
            ? renderConnectedSourceList({
                targetType:
                'note',

                targetId:
                note.id,

                projectId:
                note.projectId,

                sources:
                records,

                emptyText:
                'No sources linked to this note.'
            })
            : records.length
                ? (
                    type === 'photo'
                        ? renderNoteLinkedPhotoGrid(
                            records
                        )
                        : renderNoteLinkedRecordRows(
                            type,
                            config,
                            records,
                            note.id
                        )
                )
                : `
              <span class="notes-section-empty">
                No ${escapeHtml(
                    config.plural
                )} linked to this note.
              </span>
            `;

    return renderNoteEditorSection({
        id:
          config.sectionKey,

        title:
          config.title,

        meta:
          countLabel,

        action: `
          <button
            class="panel-action"
            type="button"
            data-note-manage-links="${escapeHtml(
                type
            )}">

            ${renderPanelButtonLabel(
                icon.plus,
                type === 'person'
                    ? 'Tag person'
                    : `Add ${config.singular}`
            )}
          </button>
        `,

        body:
          rows
    });
}

function renderRelatedNoteIcon(
    className = ''
)
{
    return `
        <span
          class="notes-related-icon ${escapeHtml(
                className
            )}"
          aria-hidden="true">

          <span class="notes-related-icon-document">
            ${icon.note}
          </span>

          <span class="notes-related-icon-link">
            ${icon.link}
          </span>
        </span>
      `;
}

function renderRelatedNoteRelationItem({
    note,
    openAttributes =
        '',
    removeAttributes =
        '',
    removeContextLabel =
        'item',
    readOnly =
        false
} = {})
{
    if (!note)
    {
        return '';
    }

    const title =
        note.title
        || 'Untitled note';

    const excerpt =
        noteExcerpt(
            note,
            120
        )
        || 'No note content';

    const metadata =
        relatedNotePermanentMetadata(
            note
        );

    const content = `
        ${renderRelatedNoteIcon()}

        <span
          class="
            notes-related-copy
          ">

          <span
            class="
              notes-related-title-line
            ">

            <strong
              class="
                notes-related-title
              "
              title="${escapeHtml(title)}">

              ${escapeHtml(
                    title
                )}
            </strong>

            ${
                note.archived
                    ? `
                  <span
                    class="
                      notes-related-archived-badge
                    ">

                    Archived
                  </span>
                `
                    : ''
            }
          </span>

          <span
            class="
              notes-related-excerpt
            ">

            ${escapeHtml(
                excerpt
            )}
          </span>

          <span
            class="
              notes-related-meta
            "
            title="${escapeHtml(metadata)}">

            ${escapeHtml(
                metadata
            )}
          </span>
        </span>
      `;

    return `
        <div
          class="
            relation-row
            notes-related-item
          ">

          ${
                readOnly
                    ? `
                <div
                  class="
                    relation-row-main
                    notes-related-main
                  ">

                  ${content}
                </div>
              `
                    : `
                <button
                  class="
                    relation-row-main
                    notes-related-main
                  "
                  type="button"
                  ${openAttributes}
                  aria-label="Open ${escapeHtml(
                        title
                    )}">

                  ${content}
                </button>
              `
            }

          ${
                !readOnly
            && removeAttributes
                    ? `
                <div
                  class="
                    relation-actions
                  ">

                  <button
                    class="
                      relation-action-button
                      danger
                    "
                    type="button"
                    ${removeAttributes}
                    aria-label="${escapeHtml(t('Unlink'))} ${escapeHtml(
                        title
                    )}"
                    title="${escapeHtml(t('Unlink'))}">

                    ${icon.unlink}
                  </button>
                </div>
              `
                    : ''
            }
        </div>
      `;
}

function renderRelatedNoteCollectionChips(
    note,
    limit = 2
)
{
    const collections =
        getCollectionsForNote(
            note.id,
            {
                projectId:
              note.projectId
            }
        );

    if (!collections.length)
    {
        return '';
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
        <span class="notes-related-collection-chips">
          ${visible
                .map(collection => `
              <span class="notes-related-collection-chip">
                ${escapeHtml(
                    collection.name
                )}
              </span>
            `)
                .join('')}

          ${
                hiddenCount > 0
                    ? `
                <span class="notes-related-collection-chip">
                  +${hiddenCount}
                </span>
              `
                    : ''
            }
        </span>
      `;
}

function relatedNotePermanentMetadata(
    note
)
{
    return formatConnectedNoteMetadata(note);
}

function renderNoteRelatedSection(
    note
)
{
    const related =
        getRelatedNotes(
            note.id,
            {
                projectId:
              note.projectId,

                includeArchived:
              true
            }
        )
            .slice()
            .sort((first, second) =>
                Number(Boolean(first.archived))
            - Number(Boolean(second.archived))
            || String(first.title || '')
                .localeCompare(
                    String(second.title || '')
                )
            );

    const rows =
        related.length
            ? `
            <div
              class="
                relationship-list
                notes-related-list
              ">
              ${related
                    .slice(0, CONNECTED_NOTES_PREVIEW_LIMIT)
                    .map(item =>
                        renderRelatedNoteRelationItem({
                            note:
                      item,

                            openAttributes:
                      `
                        data-note-related-open="${escapeHtml(
                            item.id
                        )}"
                      `,

                            removeAttributes:
                      `
                        data-note-related-remove="${escapeHtml(
                            item.id
                        )}"
                      `,

                            removeContextLabel:
                      'note'
                        })
                    )
                    .join('')}
            </div>
          `
            : `
            <span class="notes-section-empty">
              No related notes.
            </span>
          `;

    return renderNoteEditorSection({
        id:
          'related',

        title:
          'Related notes',

        meta:
          `${related.length} ${
              related.length === 1
                  ? 'note'
                  : 'notes'
          }`,

        action: `
          <button
            class="panel-action"
            type="button"
            id="notesManageRelated">

            ${renderPanelButtonLabel(
                icon.plus,
                'Add note'
            )}
          </button>
        `,

        body:
          rows
    });
}

function renderNoteInfoSection(
    note
)
{
    const body =
        String(
            note.body || ''
        );

    return renderNoteEditorSection({
        id:
          'info',

        title:
          'Note info',

        body: `
          <div class="notes-info-grid">
            <div class="notes-info-row">
              <span>Created</span>
              <strong>
                ${escapeHtml(
                    formatNoteInfoDate(
                        note.createdAt
                    )
                )}
              </strong>
            </div>

            <div class="notes-info-row">
              <span>Updated</span>
              <strong>
                ${escapeHtml(
                    formatNoteInfoDate(
                        note.updatedAt
                    )
                )}
              </strong>
            </div>

            <div class="notes-info-row">
              <span>Words</span>
              <strong>
                ${noteBodyWordCount(
                    note
                )}
              </strong>
            </div>

            <div class="notes-info-row">
              <span>Characters</span>
              <strong>
                ${body.length}
              </strong>
            </div>
          </div>
        `
    });
}

