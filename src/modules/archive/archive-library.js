function renderArchive()
{
    appNavigationObserve();
    workspace.classList.remove(
        'no-sidebar'
    );

    archivePruneNavigationHistory();
    ensureArchiveSelection();

    renderArchiveSidebar();
    renderArchiveMain();
}

function renderArchivePreservingSourceInspectorScroll()
{
    if (
        state.archiveView !== 'sources'
        || !state.archiveSelectedSourceId
    )
    {
        renderArchive();
        return;
    }

    const sourceId =
        state.archiveSelectedSourceId;

    const currentScroller =
        main.querySelector(
            '.archive-inspector-scroll'
        );

    const previousScrollTop =
        currentScroller?.scrollTop
        || 0;

    renderArchive();

    requestAnimationFrame(() =>
    {
        /*
          Do not restore an old position if rendering
          changed the selected Source or left Sources.
        */
        if (
            state.archiveView !== 'sources'
          || state.archiveSelectedSourceId
            !== sourceId
        )
        {
            return;
        }

        const nextScroller =
            main.querySelector(
                '.archive-inspector-scroll'
            );

        if (!nextScroller)
        {
            return;
        }

        const maximumScrollTop =
            Math.max(
                0,
                nextScroller.scrollHeight
              - nextScroller.clientHeight
            );

        nextScroller.scrollTop =
            Math.min(
                previousScrollTop,
                maximumScrollTop
            );
    });
}

function renderArchivePreservingFileInspectorScroll()
{
    if (
        !archiveIsLocationView(
            state.archiveView
        )
        || !state.archiveSelectedFileId
    )
    {
        renderArchive();
        return;
    }

    const fileId =
        state.archiveSelectedFileId;

    const currentScroller =
        main.querySelector(
            '.archive-inspector-scroll'
        );

    const previousScrollTop =
        currentScroller?.scrollTop
        || 0;

    renderArchive();

    requestAnimationFrame(() =>
    {
        /*
          Do not restore the previous position if the
          selected file or Archive view changed while
          the inspector was rendering.
        */
        if (
            !archiveIsLocationView(
                state.archiveView
            )
          || state.archiveSelectedFileId
            !== fileId
        )
        {
            return;
        }

        const nextScroller =
            main.querySelector(
                '.archive-inspector-scroll'
            );

        if (!nextScroller)
        {
            return;
        }

        const maximumScrollTop =
            Math.max(
                0,
                nextScroller.scrollHeight
              - nextScroller.clientHeight
            );

        nextScroller.scrollTop =
            Math.min(
                previousScrollTop,
                maximumScrollTop
            );
    });
}

function renderArchiveSidebarNavItem(
    id,
    label,
    svg
)
{
    const active =
        id === 'files'
            ? state.archiveView === 'files'
            && archiveIsRootLocation(
                state.archiveSelectedFolderId
            )
            : state.archiveView === id;

    return `
        <button
          class="
            side-link
            ${active ? 'active' : ''}
          "
          type="button"
          data-archive-view="${escapeHtml(id)}"
          aria-current="${
                active
                    ? 'page'
                    : 'false'
            }">

          ${svg}

          <span>
            ${escapeHtml(label)}
          </span>
        </button>
      `;
}

function renderArchiveFolderTree(
    parentId = null,
    depth = 0
)
{
    const folders =
        archiveFolderChildren(
            parentId
        );

    return folders
        .map(folder =>
        {
            const children =
                archiveFolderChildren(
                    folder.id
                );

            const expanded =
                Boolean(
                    state
                        .archiveExpandedFolders[
                            folder.id
                        ]
                );

            const active =
                folder.id
            === archiveNormalizeFolderId(
                state.archiveSelectedFolderId
            );

            return `
            <div
              role="treeitem"
              aria-selected="${
                    active
                        ? 'true'
                        : 'false'
                }"
              ${
                    children.length
                        ? `aria-expanded="${String(
                            expanded
                        )}"`
                        : ''
                }>

              <div
                class="
                  archive-folder-row
                  ${
                        active
                            ? 'active'
                            : ''
                    }
                "
                style="padding-left:${
                    Math.max(
                        4,
                        depth * 14 + 4
                    )
                }px">

                ${
                    children.length
                        ? `
                      <button
                        class="
                          archive-folder-toggle
                          ${
                                expanded
                                    ? 'expanded'
                                    : ''
                            }
                        "
                        type="button"
                        data-archive-toggle-folder="${escapeHtml(
                            folder.id
                        )}"
                        aria-label="${
                            expanded
                                ? 'Collapse'
                                : 'Expand'
                        } ${escapeHtml(
                            folder.name
                        )}">

                        ${icon.chevron}
                      </button>
                    `
                        : `
                      <span
                        aria-hidden="true">
                      </span>
                    `
                }

                <button
                  class="
                    archive-folder-main
                  "
                  type="button"
                  data-archive-folder="${escapeHtml(
                        folder.id
                    )}"
                  title="${escapeHtml(
                        folder.name
                    )}">

                  ${icon.folderyellow}

                  <span>
                    ${escapeHtml(
                        folder.name
                    )}
                  </span>
                </button>
              </div>

              ${
                    children.length
                && expanded
                        ? `
                    <div role="group">
                      ${renderArchiveFolderTree(
                            folder.id,
                            depth + 1
                        )}
                    </div>
                  `
                        : ''
                }
            </div>
          `;
        })
        .join('');
}

function archiveRevealPendingFolderInSidebar()
{
    const folderId =
        state.archivePendingTreeRevealId;

    if (!folderId)
    {
        return;
    }

    requestAnimationFrame(
        () =>
        {
            const button =
                [
                    ...sidebar.querySelectorAll(
                        '[data-archive-folder]'
                    )
                ].find(item =>
                    item.dataset
                        .archiveFolder
                === folderId
                );

            button?.scrollIntoView({
                block:
              'nearest',

                inline:
              'nearest'
            });

            state.archivePendingTreeRevealId =
                null;
        }
    );
}

function openArchiveCreateFolderFromTrigger(
    button
)
{
    const parentId =
        button?.dataset
            .archiveParentFolder
        || state.archiveSelectedFolderId;

    runAfterArchiveFileEditGuard(
        () =>
        {
            openArchiveCreateFolderModal(
                parentId
            );
        }
    );
}

function renderArchiveSidebar()
{
    const sourceView =
        state.archiveView
          === 'sources';
    sidebar.innerHTML = `
          <nav
            class="archive-sidebar"
            aria-label="Archive navigation">

            <section class="archive-sidebar-section">
              <div class="side-section-title">
                Navigation
              </div>

              <div class="side-nav">
                ${renderArchiveSidebarNavItem(
                    'files',
                    ARCHIVE_ROOT_LABEL,
                    icon.folder
                )}

                ${renderArchiveSidebarNavItem(
                    'favorites',
                    'Favourites',
                    icon.star
                )}

                ${renderArchiveSidebarNavItem(
                    'sources',
                    'Sources',
                    icon.archive
                )}
              </div>
            </section>

            ${sourceView ? '' : `
            <section class="archive-sidebar-section archive-sidebar-tree-section">
              <div class="side-section-title with-add">
                <span>Folders</span>
                <button
                  class="side-add-button"
                  type="button"
                  data-archive-create-folder
                  aria-label="Create folder"
                  title="Create folder">
                  ${icon.plus}
                </button>
              </div>
              <div
                class="archive-folder-tree archive-sidebar-folder-tree"
                role="tree"
                aria-label="Archive folder tree">
                ${archiveFolderChildren().length
                    ? renderArchiveFolderTree()
                    : `<div class="sidebar-entity-empty">${escapeHtml(t('No folders yet'))}</div>`}
              </div>
            </section>
            `}
          </nav>
        `;

    sidebar
        .querySelectorAll(
            '[data-archive-view]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    const nextView =
                        button.dataset
                            .archiveView;

                    if (
                        nextView === 'sources'
                    )
                    {
                        runAfterArchiveFileEditGuard(
                            () =>
                            {
                                archiveRememberCurrentLocation();

                                state.archiveView =
                                    'sources';

                                state.archiveSearch =
                                    '';

                                state.archiveSelectedFileId =
                                    null;

                                state.archiveSelectedFileIds =
                                    [];

                                state.archiveInspectorCollapsed =
                                    false;
                                state.archiveSourceTargetFilter = null;
                                state.archiveSourceCategoryFilter = 'all';
                                state.archiveSourceConnectionFilter = 'all';
                                state.archiveSourceFavouriteOnly = false;
                                state.archiveSelectedSourceId = null;
                                ensureArchiveSelection();
                                renderArchive();
                            }
                        );

                        return;
                    }

                    archiveNavigateToLocation({
                        view:
                  nextView,

                        folderId:
                  null,

                        search:
                  '',

                        fileFilters: {
                            ...archiveFileFiltersWithDefaults(
                                state.archiveFileFilters
                            ),

                            favouriteOnly:
                    nextView === 'favorites'
                        },

                        filterPresentation:
                  nextView === 'favorites'
                      ? 'flat'
                      : state.archiveFilterPresentation,

                        filterScopeFolderId:
                  null,

                        selectedFileId:
                  null,

                        inspectorCollapsed:
                  false
                    });
                }
            );
        });

    sidebar
        .querySelector(
            '[data-archive-create-folder]'
        )
        ?.addEventListener(
            'click',
            event =>
            {
                event.stopPropagation();

                openArchiveCreateFolderFromTrigger(
                    event.currentTarget
                );
            }
        );

    sidebar
        .querySelectorAll(
            '[data-archive-toggle-folder]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                event =>
                {
                    event.stopPropagation();

                    const id =
                        button.dataset
                            .archiveToggleFolder;

                    state.archiveExpandedFolders[id] =
                        !state
                            .archiveExpandedFolders[id];

                    renderArchiveSidebar();
                }
            );
        });

    sidebar
        .querySelectorAll(
            '[data-archive-folder]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    archiveNavigateToLocation(
                        {
                            view:
                    state.archiveView
                      === 'favorites'
                        ? 'favorites'
                        : 'files',

                            folderId:
                    button.dataset
                        .archiveFolder,

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
                }
            );
        });

    sidebar.querySelectorAll('[data-archive-folder]').forEach(button =>
    {
        button.addEventListener('contextmenu', event =>
        {
            if (event.target.closest('input,[contenteditable="true"]')) return;
            event.preventDefault();
            openArchiveItemActionsPopover('folder', button.dataset.archiveFolder, button,
                { x: event.clientX, y: event.clientY });
        });
    });
    localizeUI(
        sidebar
    );

    if (innerWidth > 900)
    {
        sidebar.querySelectorAll('[data-archive-folder]').forEach(button =>
            archiveBindDropTarget(button, button.dataset.archiveFolder));
        archiveBindDropTarget(sidebar.querySelector('[data-archive-view="files"]'), null);
        archiveBindDragAutoscroll(sidebar.querySelector('.archive-sidebar-folder-tree'));
    }

    archiveRevealPendingFolderInSidebar();
}

function ensureArchiveVisibleSelection()
{
    if (
        state.archiveView === 'sources'
    )
    {
        const visibleSources =
            archiveFilteredSources();

        const visibleSourceIds =
            new Set(
                visibleSources.map(
                    source =>
                        source.id
                )
            );

        if (
            state.archiveSelectedSourceId
          && !visibleSourceIds.has(
              state.archiveSelectedSourceId
          )
        )
        {
            state.archiveSelectedSourceId =
                visibleSources[0]?.id
            || null;
        }

        return;
    }

    const visibleFiles =
        archiveVisibleFiles();

    const visibleFileIds =
        new Set(
            visibleFiles.map(
                file =>
                    file.id
            )
        );

    /*
        Do not retain hidden batch selections.
        Otherwise actions could affect files the
        user cannot currently see.
      */
    state.archiveSelectedFileIds =
        (
            state.archiveSelectedFileIds
          || []
        ).filter(
            fileId =>
                visibleFileIds.has(
                    fileId
                )
        );

    const visibleFolderIds = new Set(archiveVisibleChildFolders().map(folder => folder.id));
    state.archiveSelectedFolderIds = (state.archiveSelectedFolderIds || [])
        .filter(id => visibleFolderIds.has(id));

    if (
        state.archiveSelectedFileId
        && !visibleFileIds.has(
            state.archiveSelectedFileId
        )
    )
    {
        state.archiveSelectedFileId =
            null;
    }
}

let archiveSelectionAnchor = null;

function archiveVisibleMainItemKeys(root)
{
    return [...root.querySelectorAll('[data-archive-folder-row], [data-archive-file-row]')]
        .filter(row => row.getClientRects().length > 0)
        .map(row => row.dataset.archiveFolderRow
            ? `folder:${row.dataset.archiveFolderRow}`
            : `file:${row.dataset.archiveFileRow}`);
}

function archiveSelectDesktopItem(root, type, id, event)
{
    const key = `${type}:${id}`;
    const visible = archiveVisibleMainItemKeys(main.querySelector('.archive-shell') || root);
    const targetIndex = visible.indexOf(key);
    if (targetIndex < 0) return;
    if (event.shiftKey || event.ctrlKey || event.metaKey)
    {
        resetArchiveFolderRowClick();
        archiveLastFileRowClick = { fileId: null, at: 0 };
    }

    let selected;
    if (event.shiftKey && archiveSelectionAnchor && visible.includes(archiveSelectionAnchor))
    {
        const anchorIndex = visible.indexOf(archiveSelectionAnchor);
        selected = visible.slice(Math.min(anchorIndex, targetIndex), Math.max(anchorIndex, targetIndex) + 1);
    }
    else if (event.ctrlKey || event.metaKey)
    {
        selected = [
            ...(state.archiveSelectedFolderIds || []).map(folderId => `folder:${folderId}`),
            ...(state.archiveSelectedFileIds || []).map(fileId => `file:${fileId}`)
        ].filter(item => visible.includes(item));
        selected = selected.includes(key)
            ? selected.filter(item => item !== key)
            : [...selected, key];
        archiveSelectionAnchor = key;
    }
    else
    {
        selected = [key];
        archiveSelectionAnchor = key;
    }

    state.archiveSelectedFolderIds = selected.filter(item => item.startsWith('folder:')).map(item => item.slice(7));
    state.archiveSelectedFileIds = selected.filter(item => item.startsWith('file:')).map(item => item.slice(5));
    const inspected = selected.includes(key) ? key : selected.at(-1);
    state.archiveSelectedFolderItemId = inspected?.startsWith('folder:') ? inspected.slice(7) : null;
    state.archiveSelectedFileId = inspected?.startsWith('file:') ? inspected.slice(5) : null;
    state.archiveInspectorCollapsed = false;
    renderArchiveMain();
    main.querySelector(`[data-archive-${type}-row="${CSS.escape(id)}"]`)?.focus({ preventScroll: true });
}
let archiveRenderedLocationKey = null;

function renderArchiveMain()
{
    archiveImageUnmount();
    const locationKey = `${currentProjectId() || ''}:${state.archiveView}:${state.archiveSelectedFolderId || ''}`;
    if (archiveRenderedLocationKey !== null && locationKey !== archiveRenderedLocationKey)
    {
        archiveMobileSelectMode = false;
        archiveSelectionAnchor = null;
        state.archiveSelectedFileIds = [];
        state.archiveSelectedFolderIds = [];
    }
    ensureArchiveVisibleSelection();
    const previousScroll = main.querySelector('.archive-main')?.scrollTop || 0;
    const previousInspectorScroll = main.querySelector('.archive-inspector-scroll')?.scrollTop || 0;
    const previousPageScroll = document.scrollingElement?.scrollTop || 0;

    main.innerHTML = `
        <div
          class="
            archive-shell
            ${state.archiveFileLayout === 'images' && state.archiveView !== 'sources' ? 'archive-image-shell' : ''}

            ${
                state.archiveInspectorCollapsed
                    ? 'inspector-collapsed'
                    : ''
            }

            ${
                archiveFileEditIsActive()
                    ? 'file-editing'
                    : ''
            }
          ">

          <section
            class="archive-main"
            aria-label="Archive workspace">

            ${
                state.archiveView
                === 'sources'
                    ? renderArchiveSourcesView()
                    : renderArchiveFilesView()
            }
          </section>

          ${
                state.archiveInspectorCollapsed
                    ? renderArchiveInspectorCollapsed()
                    : renderArchiveInspector()
            }
        </div>
      `;

    bindArchiveControls();
    localizeUI(main);
    mountArchiveImageView();
    const nextInspectorScroll = main.querySelector('.archive-inspector-scroll');
    if (nextInspectorScroll) nextInspectorScroll.scrollTop = previousInspectorScroll;
    if (locationKey === archiveRenderedLocationKey)
    {
        main.querySelector('.archive-main').scrollTop = previousScroll;
        if (document.scrollingElement) document.scrollingElement.scrollTop = previousPageScroll;
    }
    archiveRenderedLocationKey = locationKey;
}

function renderArchivePageHead({
    title,
    subtitle,
    actions = ''
})
{
    return `
        <header
          class="
            archive-page-head
          ">

          <div
            class="
              archive-page-head-copy
            ">

            <h1 class="app-page-title">
              ${escapeHtml(
                    title
                )}
            </h1>

            <p>
              ${escapeHtml(
                    subtitle
                )}
            </p>
          </div>

          ${
                actions
                    ? `
                <div
                  class="
                    archive-page-actions
                  ">

                  ${actions}
                </div>
              `
                    : ''
            }
        </header>
      `;
}

function archiveFilesViewSubtitle(
    currentFolder,
    person
)
{
    if (person)
    {
        return `Files linked to ${
            personResourceDisplayName(
                person
            )
        }.`;
    }

    if (
        state.archiveView
          === 'favorites'
    )
    {
        return currentFolder
            ? `Favourites in ${
                currentFolder.name
            }.`
            : 'Files and folders marked as favourites.';
    }

    if (!currentFolder)
    {
        return 'Organize your research files and folders.';
    }

    return `Browse files and subfolders in ${
        currentFolder.name
    }.`;
}

function renderArchiveFilesHeaderActions()
{
    const favoritesView =
        state.archiveView
          === 'favorites';

    return `
        ${
            favoritesView
                ? ''
                : `
              <button
                class="
                  button secondary
                "
                type="button"
                data-archive-create-folder aria-label="${escapeHtml(t('New folder'))}" title="${escapeHtml(t('New folder'))}">

                ${icon.folder}
                <span>New folder</span>
              </button>
            `
        }

        <button
          class="
            button primary
          "
          type="button"
          data-archive-add-files aria-label="${escapeHtml(t('Add files'))}" title="${escapeHtml(t('Add files'))}">

          ${icon.plus}
          <span>Add files</span>
        </button>
      `;
}

function archiveSourcesViewSubtitle()
{
    return 'Document where your research files and information came from.';
}

function renderArchiveSourcesHeaderActions()
{
    return `
        <button
          class="
            button primary
          "
          type="button"
          data-archive-add-source>

          ${icon.plus}
          Add source
        </button>
      `;
}

function renderArchiveLocationButton(
    action,
    label,
    modifier,
    disabled
)
{
    return `
        <button
          class="
            archive-location-button
            ${modifier}
          "
          type="button"
          data-archive-nav-${action}
          aria-label="${escapeHtml(
                label
            )}"
          title="${escapeHtml(
                label
            )}"
          ${
                disabled
                    ? 'disabled aria-disabled="true"'
                    : ''
            }>

          ${icon.arrow}
        </button>
      `;
}

function renderArchiveBreadcrumbs()
{
    const folders =
        archiveFolderAncestors(
            state.archiveSelectedFolderId
        );

    const favoritesView =
        state.archiveView
          === 'favorites';

    const rootLabel =
        favoritesView
            ? 'Favourites'
            : ARCHIVE_ROOT_LABEL;

    const rootCurrent =
        !folders.length;

    return `
        <nav
          class="
            archive-breadcrumbs
          "
          aria-label="Folder path" title="${escapeHtml(archiveFolderPath(state.archiveSelectedFolderId) || t(rootLabel))}">
          <details class="archive-compact-path"><summary aria-label="${escapeHtml(t('Folder path'))}">${icon.folderyellow}</summary><div class="archive-compact-path-menu"><button type="button" data-archive-breadcrumb-root>${escapeHtml(t(rootLabel))}</button>${folders.map(folder => `<button type="button" data-archive-breadcrumb="${escapeHtml(folder.id)}">${escapeHtml(folder.name)}</button>`).join('')}</div></details>

          <span
            class="
              archive-breadcrumb-leading-icon
            "
            aria-hidden="true">

            ${
                favoritesView
                    ? icon.star
                    : icon.folderyellow
            }
          </span>

          <ol>
            <li
              class="
                archive-breadcrumb-item
                archive-breadcrumb-item--root
              ">

              ${
                    rootCurrent
                        ? `
                    <span
                      class="
                        archive-breadcrumb-current
                      "
                      aria-current="page"
                      title="${escapeHtml(
                            rootLabel
                        )}">

                      ${escapeHtml(
                            rootLabel
                        )}
                    </span>
                  `
                        : `
                    <button
                      type="button"
                      data-archive-breadcrumb-root
                      aria-label="Go to ${escapeHtml(
                            rootLabel
                        )} root"
                      title="${escapeHtml(
                            rootLabel
                        )}">

                      ${escapeHtml(
                            rootLabel
                        )}
                    </button>
                  `
                }
            </li>

            ${folders
                .map(
                    (
                        folder,
                        index
                    ) =>
                    {
                        const current =
                            index
                      === folders.length - 1;

                        return `
                    <li
                      class="
                        archive-breadcrumb-item
                        ${
                            current
                                ? 'archive-breadcrumb-item--current'
                                : 'archive-breadcrumb-item--middle'
                        }
                      ">

                      <span
                        class="
                          archive-breadcrumb-separator
                        "
                        aria-hidden="true">

                        ${icon.chevron}
                      </span>

                      ${
                            current
                                ? `
                            <span
                              class="
                                archive-breadcrumb-current
                              "
                              aria-current="page"
                              title="${escapeHtml(
                                    folder.name
                                )}">

                              ${escapeHtml(
                                    folder.name
                                )}
                            </span>
                          `
                                : `
                            <button
                              type="button"
                              data-archive-breadcrumb="${escapeHtml(
                                    folder.id
                                )}"
                              aria-label="Open ${escapeHtml(
                                    folder.name
                                )}"
                              title="${escapeHtml(
                                    folder.name
                                )}">

                              ${escapeHtml(
                                    folder.name
                                )}
                            </button>
                          `
                        }
                    </li>
                  `;
                    }
                )
                .join('')}
          </ol>
        </nav>
      `;
}

function renderArchiveLocationRow()
{
    return `
        <div
          class="
            archive-location-row
          ">

          <div
            class="
              archive-location-controls
            "
            role="toolbar"
            aria-label="Folder navigation">

            ${renderArchiveLocationButton(
                'back',
                'Go back',
                'archive-location-button--back',
                !archiveNavigationCanGoBack()
            )}

            ${renderArchiveLocationButton(
                'forward',
                'Go forward',
                'archive-location-button--forward',
                !archiveNavigationCanGoForward()
            )}

            ${renderArchiveLocationButton(
                'up',
                'Go up one level',
                'archive-location-button--up',
                !archiveNavigationCanGoUp()
            )}
          </div>

          ${renderArchiveBreadcrumbs()}
        </div>
      `;
}

function renderArchiveMobileLocation()
{
    const ancestors = archiveFolderAncestors(state.archiveSelectedFolderId);
    const current = ancestors[ancestors.length - 1];
    const name = state.archiveView === 'favorites' ? t('Favourites')
        : current?.name || t(ARCHIVE_ROOT_LABEL);
    return `<div class="archive-mobile-location">
        <button type="button" class="archive-mobile-back" data-archive-nav-back aria-label="${escapeHtml(t('Go back'))}" ${archiveNavigationCanGoBack() ? '' : 'disabled'}>${icon.arrow}</button>
        <div class="archive-mobile-location-name"><strong title="${escapeHtml(name)}">${escapeHtml(name)}</strong></div>
        <details class="archive-mobile-path"><summary aria-label="${escapeHtml(t('Current folder'))}: ${escapeHtml(name)}" title="${escapeHtml(t('Current folder'))}">${icon.folder}</summary>
            <div class="archive-mobile-path-menu"><button type="button" data-archive-breadcrumb-root>${escapeHtml(t(ARCHIVE_ROOT_LABEL))}</button>${ancestors.map(folder => `<button type="button" data-archive-breadcrumb="${escapeHtml(folder.id)}">${escapeHtml(folder.name)}</button>`).join('')}</div>
        </details>
    </div>`;
}

function renderArchiveFilterResultsBar(
    matchingCount
)
{
    if (
        !archiveFileFilteringActive()
    )
    {
        return '';
    }

    const fileLabel =
        `${matchingCount} ${
            matchingCount === 1
                ? 'file'
                : 'files'
        }`;

    return `
        <div
          class="archive-filter-results-bar">

          <strong>
            ${escapeHtml(fileLabel)}
          </strong>

          <div
            class="archive-filter-presentation"
            role="group"
            aria-label="Filtered result layout">

            <button
              type="button"
              class="${
                    state.archiveFilterPresentation
                  === 'flat'
                        ? 'active'
                        : ''
                }"
              data-archive-filter-presentation="flat"
              aria-pressed="${
                    state.archiveFilterPresentation
                  === 'flat'
                }">

              Files only
            </button>

            <button
              type="button"
              class="${
                    state.archiveFilterPresentation
                  === 'folders'
                        ? 'active'
                        : ''
                }"
              data-archive-filter-presentation="folders"
              aria-pressed="${
                    state.archiveFilterPresentation
                  === 'folders'
                }">

              Folder structure
            </button>
          </div>
        </div>
      `;
}

function archiveSelectedBulkItems()
{
    return {
        folders: (state.archiveSelectedFolderIds || []).map(id => archiveFolderById(id)).filter(Boolean),
        files: (state.archiveSelectedFileIds || []).map(id => archiveFileById(id)).filter(Boolean)
    };
}

function archiveBulkSelectionLabel()
{
    const { folders, files } = archiveSelectedBulkItems();
    const count = folders.length + files.length;
    if (state.language === 'ru') return `${t('Selected')}: ${count}`;
    const noun = folders.length && files.length ? (count === 1 ? 'item' : 'items')
        : folders.length ? (count === 1 ? 'folder' : 'folders')
            : (count === 1 ? 'file' : 'files');
    return `${count} ${noun} selected`;
}

function renderArchiveSelectionBar(files)
{
    const { folders, files: selectedFiles } = archiveSelectedBulkItems();
    if (folders.length + selectedFiles.length < 2) return '';
    const allFavorite = [...folders, ...selectedFiles].every(item => item.favorite);
    return `<div class="archive-selection-bar"><strong>${escapeHtml(archiveBulkSelectionLabel())}</strong><div class="archive-selection-actions">
        <button class="button secondary" type="button" data-archive-selection-action="move">${escapeHtml(t('Move'))}</button>
        <button class="button secondary" type="button" data-archive-selection-action="favorite">${escapeHtml(t(allFavorite ? 'Remove from favourites' : 'Add to favourites'))}</button>
        <button class="button secondary archive-selection-more" type="button" data-archive-selection-more aria-label="${escapeHtml(t('More actions'))}" aria-expanded="false">${icon.more}</button>
        <button class="button ghost archive-selection-clear" type="button" data-archive-selection-action="clear" aria-label="${escapeHtml(t('Clear selection'))}">${icon.close}</button>
        ${!folders.length ? `<button hidden type="button" data-archive-selection-action="links">${escapeHtml(t('Add links'))}</button>` : ''}
        <button hidden type="button" data-archive-selection-action="delete">${escapeHtml(t('Delete permanently'))}</button>
      </div></div>`;
}

function archiveSortFoldersForTable(
    folders
)
{
    return appSortRecords(folders, {
        field:
          state.archiveFileSort,

        direction:
          state.archiveFileSortDirection,

        extractors: {
            name: {
                type: 'text',
                get: folder =>
                    folder.name
            },

            updated: {
                type: 'number',
                get: folder =>
                    appSortTimestamp(
                        folder.updatedAt
                || folder.createdAt
                    )
            },

            added: {
                type: 'number',
                get: folder =>
                    appSortTimestamp(
                        folder.createdAt
                    )
            },

            /*
          * All these records have the same type.
          * The fallback name determines their
          * order within the Folder group.
          */
            type: {
                type: 'text',
                get: () => 'Folder'
            }
        },

        getFallback:
          folder => folder.name
    });
}

function renderArchiveTableGroupRow(
    label
)
{
    return `
        <tr
          class="
            archive-table-group-row
          ">

          <th
            scope="rowgroup"
            colspan="7">

            ${escapeHtml(
                label
            )}
          </th>
        </tr>
      `;
}

function renderArchiveFolderTableRow(
    folder,
    matchingFileCount = null
)
{
    const directFiles =
        archiveProjectFiles()
            .filter(file =>
                archiveFileFolderId(
                    file
                ) === folder.id
            )
            .length;

    const childFolders =
        archiveFolderChildren(
            folder.id
        ).length;

    const filtering =
        Number.isFinite(
            matchingFileCount
        );

    const itemCount =
        filtering
            ? matchingFileCount
            : directFiles
            + childFolders;

    const itemLabel =
        filtering
            ? `${itemCount} ${
                itemCount === 1
                    ? 'matching file'
                    : 'matching files'
            }`
            : `${itemCount} ${
                itemCount === 1
                    ? 'item'
                    : 'items'
            }`;

    const detailSelected =
        state.archiveSelectedFolderItemId
          === folder.id;
    const checked = (state.archiveSelectedFolderIds || []).includes(folder.id);

    return `
        <tr
          class="
            archive-table-folder-row

            ${
                detailSelected
                    ? 'selected-detail'
                    : ''
            }
            ${checked ? 'is-checked' : ''}
          "
          data-archive-folder-row="${escapeHtml(
                folder.id
            )}"
          tabindex="0" aria-selected="${String(checked)}">

          <td class="archive-col-check"><input class="albums-select-checkbox" type="checkbox"
            data-archive-folder-checkbox="${escapeHtml(folder.id)}" ${checked ? 'checked' : ''}
            aria-label="${escapeHtml(t('Select'))}: ${escapeHtml(folder.name)}"></td>

          <td>
            <div
              class="
                archive-name-cell
              ">

              ${archiveFileIcon({
                    kind:
                  'folder'
                })}

              <div
                class="
                  archive-name-copy
                ">
                <div
                  class="
                    archive-folder-name-line
                  ">

                  <strong
                    title="${escapeHtml(
                        folder.name
                    )}">

                    ${escapeHtml(
                        folder.name
                    )}
                  </strong>
                </div>
              </div>
              <button class="archive-mobile-open-folder" type="button" data-archive-mobile-open-folder="${escapeHtml(folder.id)}" aria-label="${escapeHtml(t('Open folder'))}: ${escapeHtml(folder.name)}">${escapeHtml(t('Open'))}</button>
            </div>
          </td>

          <td>
            <span class="archive-mobile-cell-label">${escapeHtml(t('Type'))}: </span>Folder
          </td>

          <td>
            <span class="archive-mobile-cell-label">${escapeHtml(t('Size / Items'))}: </span>${escapeHtml(
                itemLabel
            )}
          </td>

          <td>
            <span class="archive-mobile-cell-label">${escapeHtml(t('Modified'))}: </span>${escapeHtml(
                archiveFormatDate(
                    folder.updatedAt
                || folder.createdAt
                )
            )}
          </td>

          <td style="text-align:center"><button class="archive-row-icon-button ${folder.favorite ? 'active' : ''}"
            type="button" data-archive-toggle-folder-favorite="${escapeHtml(folder.id)}"
            aria-label="${escapeHtml(t(folder.favorite ? 'Remove from favourites' : 'Add to favourites'))}">${icon.star}</button></td>

          <td>
            <button
              class="
                archive-row-icon-button
              "
              type="button"
              data-archive-row-actions="folder"
              data-archive-row-id="${escapeHtml(
                    folder.id
                )}"
              aria-label="Folder actions">

              ${icon.more}
            </button>
          </td>
        </tr>
      `;
}

function archiveVisibleSelectionState(
    files =
        archiveVisibleFiles()
)
{
    const folderIds = archiveVisibleChildFolders().map(folder => folder.id);
    const fileIds = (Array.isArray(files) ? files : []).map(file => file?.id).filter(Boolean);
    const selectedFolders = new Set(state.archiveSelectedFolderIds || []);
    const selectedFiles = new Set(state.archiveSelectedFileIds || []);
    const visibleIds = [...folderIds.map(id => `folder:${id}`), ...fileIds.map(id => `file:${id}`)];
    const selectedVisibleIds = visibleIds.filter(key => {
        const [kind, id] = key.split(':');
        return kind === 'folder' ? selectedFolders.has(id) : selectedFiles.has(id);
    });

    return {
        visibleIds,

        selectedVisibleIds,

        allVisibleSelected:
          visibleIds.length > 0
          && selectedVisibleIds.length
            === visibleIds.length,

        someVisibleSelected:
          selectedVisibleIds.length > 0
    };
}

function toggleAllVisibleArchiveFiles(
    files =
        archiveVisibleFiles()
)
{
    const selection =
        archiveVisibleSelectionState(
            files
        );

    const selectedFiles = new Set(state.archiveSelectedFileIds || []);
    const selectedFolders = new Set(state.archiveSelectedFolderIds || []);

    selection.visibleIds
        .forEach(key =>
        {
            const [kind, id] = key.split(':');
            const set = kind === 'folder' ? selectedFolders : selectedFiles;
            if (selection.allVisibleSelected) set.delete(id);
            else set.add(id);
        });

    state.archiveSelectedFileIds = [...selectedFiles];
    state.archiveSelectedFolderIds = [...selectedFolders];

    renderArchiveMain();
}

function toggleArchiveFileSelection(
    fileId
)
{
    const file =
        archiveFileById(
            fileId
        );

    if (!file)
    {
        return;
    }

    const selectedIds =
        new Set(
            state.archiveSelectedFileIds
          || []
        );

    if (
        selectedIds.has(
            file.id
        )
    )
    {
        selectedIds.delete(
            file.id
        );
    }
    else
    {
        selectedIds.add(
            file.id
        );
    }

    state.archiveSelectedFileIds = [
        ...selectedIds
    ];
    archiveSelectionAnchor = `file:${file.id}`;

    /*
        Match Albums: selecting through the checkbox
        also makes that record the inspector item.
      */

    state.archiveSelectedFolderItemId = null;
    state.archiveSelectedFileId =
        file.id;

    state.archiveInspectorCollapsed =
        false;

    renderArchiveMain();
}

function toggleArchiveFolderSelection(folderId)
{
    if (!archiveFolderById(folderId)) return;
    const selected = new Set(state.archiveSelectedFolderIds || []);
    if (selected.has(folderId)) selected.delete(folderId);
    else selected.add(folderId);
    state.archiveSelectedFolderIds = [...selected];
    archiveSelectionAnchor = `folder:${folderId}`;
    state.archiveSelectedFolderItemId = folderId;
    state.archiveSelectedFileId = null;
    state.archiveInspectorCollapsed = false;
    renderArchiveMain();
}

function renderArchiveFileTableRow(
    file,
    showPath = false
)
{
    const detailSelected =
        state.archiveSelectedFileId
          === file.id;

    const checked =
        state.archiveSelectedFileIds
            .includes(
                file.id
            );

    const secondaryLabel = showPath ? archiveFolderPath(file.folderId) : '';

    return `
        <tr
          class="
            archive-table-file-row
            ${
                detailSelected
                    ? 'selected-detail'
                    : ''
            }

            ${
                checked
                    ? 'is-checked'
                    : ''
            }
          "
          data-archive-file-row="${escapeHtml(
                file.id
            )}"
          tabindex="0"
          aria-selected="${String(
                checked
            )}">

          <td
            class="
              archive-col-check
            ">

            <input
              class="
                albums-select-checkbox
              "
              type="checkbox"
              data-archive-file-checkbox="${escapeHtml(
                    file.id
                )}"
              ${
                    checked
                        ? 'checked'
                        : ''
                }
              aria-label="${escapeHtml(
                    `${
                        checked
                            ? 'Deselect'
                            : 'Select'
                    } ${file.name}`
                )}">
          </td>

          <td>
            <div
              class="
                archive-name-cell
              ">

              ${archiveFileIcon(
                    file
                )}

              <div
                class="
                  archive-name-copy
                ">

                <strong
                  title="${escapeHtml(
                        file.name
                    )}">

                  ${escapeHtml(
                        file.name
                    )}
                </strong>

                ${secondaryLabel ? `<span>${escapeHtml(secondaryLabel)}</span>` : ''}
              </div>
            </div>
          </td>

          <td>
            <span class="archive-mobile-cell-label">${escapeHtml(t('Type'))}: </span>${escapeHtml(
                archiveFileTypeLabel(
                    file
                )
            )}
          </td>

          <td>
            <span class="archive-mobile-cell-label">${escapeHtml(t('Size / Items'))}: </span>${escapeHtml(
                file.size
              || '—'
            )}
          </td>

          <td>
            <span class="archive-mobile-cell-label">${escapeHtml(t('Modified'))}: </span>${escapeHtml(
                archiveFormatDate(
                    file.updatedAt,
                    file.updated
                || 'Unknown'
                )
            )}
          </td>

          <td
            style="
              text-align:
                center;
            ">

            <button
              class="
                archive-row-icon-button
                ${
                    file.favorite
                        ? 'active'
                        : ''
                }
              "
              type="button"
              data-archive-toggle-favorite="${escapeHtml(
                    file.id
                )}"
              aria-label="${
                    file.favorite
                        ? 'Remove from favourites'
                        : 'Add to favourites'
                }">

              ${icon.star}
            </button>
          </td>

          <td>
            <button
              class="
                archive-row-icon-button
              "
              type="button"
              data-archive-row-actions="file"
              data-archive-row-id="${escapeHtml(
                    file.id
                )}"
              aria-label="File actions">

              ${icon.more}
            </button>
          </td>
        </tr>
      `;
}

function renderArchiveFileTableDesktop(
    files,
    folders,
    showPaths = false,
    matchingCountByFolder = new Map()
)
{
    const sortedFolders =
        archiveSortFoldersForTable(
            folders
        );

    const sortHeader = (field, label) => `<button type="button" class="archive-column-sort ${state.archiveFileSort === field ? 'is-active' : ''}" data-archive-column-sort="${field}" aria-label="${escapeHtml(t(`Sort by ${label}`))}">${escapeHtml(t(label))}</button>`;

    const showGroupLabels =
        Boolean(
            sortedFolders.length
          && files.length
        );

    const folderRows = `
        ${
            showGroupLabels
                ? renderArchiveTableGroupRow(
                    'Folders'
                )
                : ''
        }

        ${sortedFolders
            .map(folder =>
                renderArchiveFolderTableRow(
                    folder,
                    matchingCountByFolder.has(
                        folder.id
                    )
                        ? matchingCountByFolder.get(
                            folder.id
                        )
                        : null
                )
            )
            .join('')}
      `;

    const fileRows = `
        ${
            showGroupLabels
                ? renderArchiveTableGroupRow(
                    'Files'
                )
                : ''
        }

        ${files
            .map(file =>
                renderArchiveFileTableRow(
                    file,
                    showPaths
                )
            )
            .join('')}
      `;

    return `
        <div
          class="
            archive-table-wrap
          ">

          <table
            class="
              archive-table
            "
            aria-label="Archive files and folders">

            <thead>
              <tr>
                <th
                  class="
                    archive-col-check
                  ">

                <input
                  class="
                    albums-select-checkbox
                  "
                  type="checkbox"
                  data-archive-select-all
                  aria-label="${escapeHtml(t('Select all visible items'))}">
                <span class="archive-mobile-select-all">${escapeHtml(t('Select all visible items'))}</span>
                </th>

                <th
                  class="
                    archive-col-name
                  " ${state.archiveFileSort === 'name' ? `aria-sort="${state.archiveFileSortDirection === 'ascending' ? 'ascending' : 'descending'}"` : ''}>
                  ${sortHeader('name', 'Name')}
                </th>

                <th
                  class="
                    archive-col-type
                  " ${state.archiveFileSort === 'type' ? `aria-sort="${state.archiveFileSortDirection === 'ascending' ? 'ascending' : 'descending'}"` : ''}>
                  ${sortHeader('type', 'Type')}
                </th>

                <th
                  class="
                    archive-col-size
                  ">
                  Size / Items
                </th>

                <th
                  class="
                    archive-col-modified
                  " ${state.archiveFileSort === 'updated' ? `aria-sort="${state.archiveFileSortDirection === 'ascending' ? 'ascending' : 'descending'}"` : ''}>
                  ${sortHeader('updated', 'Modified')}
                </th>

                <th
                  class="
                    archive-col-favorite
                  "
                  aria-label="Favourite">

                  ${icon.star}
                </th>

                <th
                  class="
                    archive-col-actions
                  ">
                </th>
              </tr>
            </thead>

            <tbody>
              ${folderRows}
              ${fileRows}
            </tbody>
          </table>
        </div>
      `;
}

function renderArchiveMobileItems(files, folders, showPaths)
{
    const selecting = archiveMobileSelectMode || state.archiveSelectedFileIds.length > 0
        || (state.archiveSelectedFolderIds || []).length > 0;
    const folderRows = folders.map(folder => {
        const checked = (state.archiveSelectedFolderIds || []).includes(folder.id);
        return `<li class="archive-mobile-item archive-mobile-folder ${checked ? 'is-checked' : ''}">
            ${selecting ? `<input class="albums-select-checkbox" type="checkbox" data-archive-folder-checkbox="${escapeHtml(folder.id)}" ${checked ? 'checked' : ''} aria-label="${escapeHtml(t('Select'))}: ${escapeHtml(folder.name)}">` : ''}
            <button type="button" class="archive-mobile-item-main" data-archive-mobile-folder="${escapeHtml(folder.id)}" title="${escapeHtml(folder.name)}">
                ${archiveFileIcon({ kind: 'folder' })}
                <span class="archive-mobile-item-copy"><strong>${escapeHtml(folder.name)}</strong>${folder.favorite ? `<small>${escapeHtml(t('Favourite'))}</small>` : ''}</span>
            </button>
            <button type="button" class="archive-mobile-item-more" data-archive-row-actions="folder" data-archive-row-id="${escapeHtml(folder.id)}" aria-label="${escapeHtml(t('Folder actions'))}: ${escapeHtml(folder.name)}">${icon.more}</button>
        </li>`;
    }).join('');
    const fileRows = files.map(file => {
        const checked = state.archiveSelectedFileIds.includes(file.id);
        const metadata = showPaths ? archiveFolderPath(file.folderId)
            : [file.size, archiveFormatDate(file.updatedAt || file.createdAt)].filter(Boolean).join(' · ');
        return `<li class="archive-mobile-item archive-mobile-file ${checked ? 'is-checked' : ''}">
            ${selecting ? `<input class="albums-select-checkbox" type="checkbox" data-archive-file-checkbox="${escapeHtml(file.id)}" ${checked ? 'checked' : ''} aria-label="${escapeHtml(t('Select'))}: ${escapeHtml(file.name)}">` : ''}
            <button type="button" class="archive-mobile-item-main" data-archive-mobile-file="${escapeHtml(file.id)}" title="${escapeHtml(file.name)}">
                ${archiveFileIcon(file)}
                <span class="archive-mobile-item-copy"><strong>${escapeHtml(file.name)}</strong><small>${escapeHtml(metadata)}</small></span>
            </button>
            <button type="button" class="archive-mobile-item-more" data-archive-row-actions="file" data-archive-row-id="${escapeHtml(file.id)}" aria-label="${escapeHtml(t('File actions'))}: ${escapeHtml(file.name)}">${icon.more}</button>
        </li>`;
    }).join('');
    return `<div class="archive-mobile-items" aria-label="${escapeHtml(t('Archive files and folders'))}">
        ${folders.length || files.length ? `<div class="archive-mobile-section-head"><button type="button" data-archive-mobile-select>${escapeHtml(t(selecting ? 'Cancel' : 'Select'))}</button></div>${selecting ? `<label class="archive-mobile-select-all"><input type="checkbox" class="albums-select-checkbox" data-archive-select-all> ${escapeHtml(t('Select all'))}</label>` : ''}` : ''}
        ${folders.length ? `<section aria-label="${escapeHtml(t('Folders'))}"><h2>${escapeHtml(t('Folders'))}</h2><ul>${folderRows}</ul></section>` : ''}
        ${files.length ? `<section aria-label="${escapeHtml(t('Files'))}"><h2>${escapeHtml(t('Files'))}</h2><ul>${fileRows}</ul></section>` : ''}
    </div>`;
}

function renderArchiveFileTiles(files, folders)
{
    const bulkActive = (state.archiveSelectedFolderIds || []).length
        + (state.archiveSelectedFileIds || []).length > 1;
    const folderTiles = archiveSortFoldersForTable(folders).map(folder => {
        const checked = bulkActive && (state.archiveSelectedFolderIds || []).includes(folder.id);
        return `<div class="archive-tile ${checked ? 'is-checked' : ''} ${state.archiveSelectedFolderItemId === folder.id ? 'selected-detail' : ''}"
            data-archive-folder-row="${escapeHtml(folder.id)}" tabindex="0" aria-label="${escapeHtml(folder.name)}">
            ${bulkActive ? `<input class="albums-select-checkbox archive-tile-select" type="checkbox" data-archive-folder-checkbox="${escapeHtml(folder.id)}" ${checked ? 'checked' : ''} aria-label="${escapeHtml(t('Select'))}: ${escapeHtml(folder.name)}">` : ''}
            <button class="archive-row-icon-button archive-tile-more" type="button" data-archive-row-actions="folder" data-archive-row-id="${escapeHtml(folder.id)}" aria-label="${escapeHtml(t('Folder actions'))}: ${escapeHtml(folder.name)}">${icon.more}</button>
            <div class="archive-tile-art">${archiveFileIcon({ kind: 'folder' })}</div>
            <div class="archive-tile-copy">
                <div class="archive-tile-name-row"><strong title="${escapeHtml(folder.name)}">${escapeHtml(folder.name)}</strong>
                    ${folder.favorite ? `<span class="archive-tile-favorite" aria-label="${escapeHtml(t('Favourite'))}">${icon.star}</span>` : ''}</div>
            </div>
        </div>`;
    }).join('');
    const fileTiles = files.map(file => {
        const checked = bulkActive && (state.archiveSelectedFileIds || []).includes(file.id);
        const source = archiveFileKind(file) === 'img'
            ? file.previewUrl || file.thumbnailUrl || file.src : '';
        const art = `${archiveFileIcon(file)}${source ? `<img src="${escapeHtml(source)}" alt="" loading="lazy">` : ''}`;
        return `<div class="archive-tile ${checked ? 'is-checked' : ''} ${state.archiveSelectedFileId === file.id ? 'selected-detail' : ''}"
            data-archive-file-row="${escapeHtml(file.id)}" tabindex="0" aria-label="${escapeHtml(file.name)}">
            ${bulkActive ? `<input class="albums-select-checkbox archive-tile-select" type="checkbox" data-archive-file-checkbox="${escapeHtml(file.id)}" ${checked ? 'checked' : ''} aria-label="${escapeHtml(t('Select'))}: ${escapeHtml(file.name)}">` : ''}
            <button class="archive-row-icon-button archive-tile-more" type="button" data-archive-row-actions="file" data-archive-row-id="${escapeHtml(file.id)}" aria-label="${escapeHtml(t('File actions'))}: ${escapeHtml(file.name)}">${icon.more}</button>
            <div class="archive-tile-art">${art}</div>
            <div class="archive-tile-copy">
                <div class="archive-tile-name-row"><strong title="${escapeHtml(file.name)}">${escapeHtml(file.name)}</strong>
                    ${file.favorite ? `<span class="archive-tile-favorite" aria-label="${escapeHtml(t('Favourite'))}">${icon.star}</span>` : ''}</div>
            </div>
        </div>`;
    }).join('');
    return `<div class="archive-tiles" aria-label="${escapeHtml(t('Archive files and folders'))}">
        ${folders.length ? `<section><h2>${escapeHtml(t('Folders'))}</h2><div class="archive-tile-grid">${folderTiles}</div></section>` : ''}
        ${files.length ? `<section><h2>${escapeHtml(t('Files'))}</h2><div class="archive-tile-grid">${fileTiles}</div></section>` : ''}
    </div>`;
}
function renderArchiveEmpty(
    title,
    copy,
    action = ''
)
{
    return `
        <div class="archive-empty">
          <div>
            <h2>
              ${escapeHtml(
                    title
                )}
            </h2>

            <p>
              ${escapeHtml(
                    copy
                )}
            </p>

            ${action}
          </div>
        </div>
      `;
}

function renderArchiveFileDropzone(
    folder = null
)
{
    const folderName =
        folder?.name
        || 'Files';

    return `
        <button
          class="
            archive-empty
            archive-empty-dropzone
          "
          type="button"
          data-archive-empty-add-files
          aria-label="${escapeHtml(
                `Add files to ${folderName}`
            )}">

          <span
            class="
              archive-empty-dropzone-content
            ">

            <span
              class="
                archive-empty-dropzone-icon
              "
              aria-hidden="true">

              ${icon.import}
            </span>

            <strong
              class="
                archive-empty-dropzone-title
              ">

              Drop files here
            </strong>

            <span
              class="
                archive-empty-dropzone-copy
              ">

              ${escapeHtml(
                    folder
                        ? `Drop files here to add them to “${folder.name}”, or click to choose files.`
                        : 'Drop files here to add them to Archive, or click to choose files.'
                )}
            </span>

            <span
              class="
                button primary archive-empty-dropzone-action
              ">

              Click to choose files
            </span>
          </span>
        </button>
      `;
}

function renderArchiveFilesView()
{
    const matchingFiles =
        archiveMatchingFiles();

    const files =
        archiveVisibleFiles(
            matchingFiles
        );

    const folders =
        archiveVisibleChildFolders(
            matchingFiles
        );

    const projection =
        archiveFolderMatchProjection(
            matchingFiles
        );

    const filtering =
        archiveFileFilteringActive();

    const flatResults =
        filtering
        && state.archiveFilterPresentation
          === 'flat';

    const currentFolder =
        archiveFolderById(
            state.archiveSelectedFolderId
        );

    const hasRows =
        files.length
        || folders.length;

    const emptyTitle =
        flatResults
            ? 'No files match these filters.'
            : 'No folders contain matching files.';

    const emptyCopy =
        'Change or clear the active filters and try again.';

    return `
        <div class="archive-page archive-files-page">
          <div class="archive-file-navigation">
            ${renderArchiveToolbar()}
            ${renderArchiveLocationRow()}
          </div>

          ${renderArchiveActiveFilterbar()}

          ${renderArchiveFilterResultsBar(
                matchingFiles.length
            )}

          ${renderArchiveSelectionBar(
                files
            )}

          ${archiveMobileSelectMode || state.archiveSelectedFileIds.length || (state.archiveSelectedFolderIds || []).length ? `<div class="archive-mobile-bulk"><strong>${escapeHtml(archiveBulkSelectionLabel())}</strong><button type="button" data-archive-mobile-bulk-actions ${state.archiveSelectedFileIds.length || (state.archiveSelectedFolderIds || []).length ? '' : 'disabled'}>${escapeHtml(t('Actions'))}</button><button type="button" data-archive-mobile-select aria-label="${escapeHtml(t('Cancel'))}">${icon.close}</button></div>` : ''}

          ${
                state.archiveFileLayout === 'images'
                    ? renderArchiveImageView(files)
                    : hasRows
                    ? `${renderArchiveMobileItems(files, archiveSortFoldersForTable(folders), flatResults)}${state.archiveFileLayout === 'tiles'
                        ? renderArchiveFileTiles(files, folders)
                        : renderArchiveFileTableDesktop(files, folders, flatResults, projection.matchingCountByFolder)}`
                    : filtering
                        ? renderArchiveEmpty(
                            emptyTitle,
                            emptyCopy
                        )
                        : renderArchiveFileDropzone(
                            currentFolder
                        )
            }
        </div>
      `;
}

function archiveToolbarIsSources()
{
    return state.archiveView
        === 'sources';
}

function archiveToolbarFilterCount()
{
    if (
        archiveToolbarIsSources()
    )
    {
        return [
            state.archiveSourceCategoryFilter
            && state.archiveSourceCategoryFilter
              !== 'all',

            state.archiveSourceConnectionFilter
            && state.archiveSourceConnectionFilter
              !== 'all',

            state.archiveSourceFavouriteOnly
        ]
            .filter(Boolean)
            .length;
    }

    return [
        Boolean(
            currentArchiveSourceTargetFilter()
        ),
        state.archiveSearchScope
          === 'all',

        state.archiveFileTypeFilter
          && state.archiveFileTypeFilter
            !== 'all',

        state.archiveLinkFilter
          && state.archiveLinkFilter
            !== 'all'
    ]
        .filter(Boolean)
        .length;
}

function archiveToolbarSearchPlaceholder()
{
    if (
        archiveToolbarIsSources()
    )
    {
        return 'Search sources...';
    }

    if (
        state.archiveView
          === 'favorites'
    )
    {
        return state.archiveSearchScope
          === 'all'
            ? 'Search favourites'
            : 'Search favourites in this folder';
    }

    return state.archiveSearchScope
        === 'all'
        ? 'Search all files...'
        : 'Search this folder...';
}

let archiveMobileSearchOpen = false;
let archiveMobileSelectMode = false;

function renderArchiveToolbar()
{
    const sourcesView =
        archiveToolbarIsSources();

    const activeFilterCount =
        archiveToolbarFilterCount();

    const searchPlaceholder =
        archiveToolbarSearchPlaceholder();

    return `
        <div
          class="
            archive-toolbar ${sourcesView ? '' : 'archive-files-toolbar'} ${archiveMobileSearchOpen ? 'mobile-search-open' : ''}
          "
          aria-label="${
                sourcesView
                    ? 'Source controls'
                    : 'File controls'
            }">

          ${sourcesView ? '' : '<div class="archive-toolbar-main">'}
          <div
            class="
              archive-toolbar-left
            ">

            ${sourcesView ? '' : `<button class="archive-mobile-search-trigger ${state.archiveSearch?.trim() ? 'has-query' : ''}" type="button" data-archive-mobile-search-open aria-expanded="${archiveMobileSearchOpen}" aria-controls="archiveSearch" aria-label="${escapeHtml(t('Search files') + (state.archiveSearch?.trim() ? `: ${state.archiveSearch.trim()}` : ''))}" title="${escapeHtml(t('Search files') + (state.archiveSearch?.trim() ? `: ${state.archiveSearch.trim()}` : ''))}">${icon.search}</button>`}

            <label
              class="
                app-search-field
              "
              aria-label="${
                    sourcesView
                        ? 'Search sources'
                        : 'Search files'
                }">

              ${icon.search}

              <input
                id="archiveSearch"
                type="search"
                data-archive-search
                value="${escapeHtml(
                    state.archiveSearch
                  || ''
                )}"
                placeholder="${escapeHtml(
                    searchPlaceholder
                )}">
            </label>
            ${sourcesView ? '' : `<button class="archive-mobile-search-close" type="button" data-archive-mobile-search-close aria-label="${escapeHtml(t('Close'))}" title="${escapeHtml(t('Close'))}">${icon.close}</button>`}
          </div>

          <div
            class="
              archive-toolbar-right
            ">

            <button
              class="
                module-filter-button
                ${
                    activeFilterCount
                        ? 'active'
                        : ''
                }
              "
              type="button"
              id="archiveFilterButton"
              aria-label="${
                    activeFilterCount
                        ? `Filters, ${activeFilterCount} active`
                        : sourcesView
                            ? 'Open source filters'
                            : 'Open file filters'
                }"
              aria-expanded="false">

              <span
                class="
                  module-filter-icon
                "
                aria-hidden="true">

                ${
                    activeFilterCount
                        ? icon.filterclear
                        : icon.filter
                }
              </span>

              <span>
                Filters
              </span>

              ${
                    activeFilterCount
                        ? `
                    <span
                      class="
                        module-filter-count
                      ">

                      ${activeFilterCount}
                    </span>
                  `
                        : ''
                }
            </button>
            ${renderAppSortControl({
                id: 'archiveSort',
                field:
                sourcesView
                    ? state.archiveSourceSort
                    : state.archiveFileSort,
                direction:
                sourcesView
                    ? state.archiveSourceSortDirection
                    : state.archiveFileSortDirection,
                ariaLabel:
                sourcesView
                    ? 'Sort sources'
                    : 'Sort files',
                options:
                sourcesView
                    ? APP_SORT_OPTIONS.archiveSources
                    : APP_SORT_OPTIONS.archiveFiles
            })}
            ${sourcesView ? '' : `<div class="archive-layout-switch" role="group" aria-label="${escapeHtml(t('File view'))}">
                <button class="toolbar-button archive-layout-button ${state.archiveFileLayout === 'details' ? 'active' : ''}" type="button" data-archive-file-layout="details" aria-label="${escapeHtml(t('Details view'))}" title="${escapeHtml(t('Details view'))}" aria-pressed="${state.archiveFileLayout === 'details'}">${icon.list}</button>
                <button class="toolbar-button archive-layout-button ${state.archiveFileLayout === 'tiles' ? 'active' : ''}" type="button" data-archive-file-layout="tiles" aria-label="${escapeHtml(t('Icons view'))}" title="${escapeHtml(t('Icons view'))}" aria-pressed="${state.archiveFileLayout === 'tiles'}">${icon.grid}</button>
                <button class="toolbar-button archive-layout-button ${state.archiveFileLayout === 'images' ? 'active' : ''}" type="button" data-archive-file-layout="images" aria-label="${escapeHtml(t('Image view'))}" title="${escapeHtml(t('Image view'))}" aria-pressed="${state.archiveFileLayout === 'images'}">${icon.archiveImages}</button>
            </div>`}
            ${sourcesView ? '' : `<label class="archive-view-picker" title="${escapeHtml(t('File view'))}">${state.archiveFileLayout === 'images' ? icon.archiveImages : state.archiveFileLayout === 'tiles' ? icon.grid : icon.list}<select data-archive-layout-select aria-label="${escapeHtml(t('File view'))}">${[['details', 'Details view'], ['tiles', 'Icons view'], ['images', 'Image view']].map(([value, label]) => `<option value="${value}" ${state.archiveFileLayout === value ? 'selected' : ''}>${escapeHtml(t(label))}</option>`).join('')}</select>${icon.chevron}</label>`}
            ${sourcesView ? '' : '</div></div><div class="archive-toolbar-create">'}
            ${sourcesView ? '' : `<div class="archive-file-create-actions">${renderArchiveFilesHeaderActions()}</div>`}
            ${sourcesView ? '' : `<button class="button primary archive-mobile-add-files" type="button" data-archive-mobile-add-menu aria-label="${escapeHtml(t('Add'))}" aria-expanded="false">${icon.plus}<span>${escapeHtml(t('Add'))}</span></button>`}
          </div>
        </div>
      `;
}

let archiveFilterReturnFocus =
    null;

function closeArchiveFilterPopover({
    restoreFocus =
        false
} = {})
{
    document
        .getElementById(
            'archiveFilterPopover'
        )
        ?.remove();
    document.getElementById('archiveFilterButton')?.setAttribute('aria-expanded', 'false');

    document.removeEventListener(
        'click',
        closeArchiveFilterOnOutside
    );

    document.removeEventListener(
        'keydown',
        closeArchiveFilterOnEscape
    );

    if (
        restoreFocus
        && archiveFilterReturnFocus
            ?.isConnected
    )
    {
        archiveFilterReturnFocus.focus({
            preventScroll:
            true
        });
    }

    archiveFilterReturnFocus =
        null;
}

function closeArchiveFilterOnOutside(
    event
)
{
    const panel =
        document.getElementById(
            'archiveFilterPopover'
        );

    const trigger =
        document.getElementById(
            'archiveFilterButton'
        );

    if (!panel)
    {
        return;
    }

    const path =
        typeof event.composedPath
          === 'function'
            ? event.composedPath()
            : [];

    const insidePanel =
        path.length
            ? path.includes(panel)
            : panel.contains(
                event.target
            );

    const insideTrigger =
        path.length
            ? path.includes(trigger)
            : trigger?.contains(
                event.target
            );

    if (
        insidePanel
        || insideTrigger
    )
    {
        return;
    }

    closeArchiveFilterPopover();
}

function closeArchiveFilterOnEscape(
    event
)
{
    if (event.key !== 'Escape')
    {
        return;
    }

    event.preventDefault();

    closeArchiveFilterPopover({
        restoreFocus:
          true
    });
}

function openArchiveFilterPopover(
    anchor
)
{
    if (document.getElementById('archiveFilterPopover'))
    {
        closeArchiveFilterPopover();
        return;
    }
    closeArchiveFilterPopover();
    closeAlbumsFilterPopover();
    closePeopleFilterPopover();
    closeMenu();

    archiveFilterReturnFocus =
        anchor;
    anchor.setAttribute('aria-expanded', 'true');

    const sourcesView =
        archiveToolbarIsSources();

    const schema =
        sourcesView
            ? archiveSourceFilterSchema
            : archiveFileFilterSchema;

    const values =
        sourcesView
            ? {
                sourceCategory:
                state.archiveSourceCategoryFilter
                || 'all',

                sourceConnections:
                state.archiveSourceConnectionFilter
                || 'all',

                sourceFavouriteOnly:
                Boolean(
                    state.archiveSourceFavouriteOnly
                )
            }
            : archiveFileFiltersWithDefaults();

    const prefix =
        sourcesView
            ? 'archive-source-filter'
            : 'archive-file-filter';

    const panel =
        document.createElement(
            'div'
        );

    panel.className =
        'shared-filter-panel archive-shared-filter-popover';

    panel.id =
        'archiveFilterPopover';

    panel.setAttribute(
        'role',
        'dialog'
    );

    panel.setAttribute(
        'aria-label',
        translateText(
            sourcesView
                ? 'Filter sources'
                : 'Filter files'
        )
    );

    panel.innerHTML = `
        <div class="shared-filter-panel-header">
          <div>
            <h3>
              ${
                    sourcesView
                        ? 'Filter sources'
                        : 'Filter files'
                }
            </h3>

            <p>
              ${
                    sourcesView
                        ? 'Narrow sources by category, connection status, or favourite status.'
                        : 'Filter files across Archive and choose how results are displayed.'
                }
            </p>
          </div>

          <button
            class="control-icon-button shared-filter-panel-close"
            type="button"
            aria-label="Close"
            data-archive-filter-close>

            ${icon.close}
          </button>
        </div>

        <div class="shared-filter-panel-body">
          ${renderSharedFilterFields({
                schema,
                values,
                prefix
            })}
        </div>

        <div class="shared-filter-panel-footer">
          <button
            class="text-action"
            type="button"
            data-archive-filter-reset>

            Clear filters
          </button>

          <div class="shared-filter-panel-actions">
            <button
              class="button secondary"
              type="button"
              data-archive-filter-cancel>

              Cancel
            </button>

            <button
              class="button primary"
              type="button"
              data-archive-filter-apply>

              Apply filters
            </button>
          </div>
        </div>
      `;

    document.body.appendChild(
        panel
    );

    localizeUI(panel);

    const controller =
        bindSharedFilterFields(
            panel,
            {
                schema,
                values,
                prefix
            }
        );

    panel
        .querySelector(
            '[data-archive-filter-reset]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                controller?.reset();
            }
        );

    panel
        .querySelector(
            '[data-archive-filter-close]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                closeArchiveFilterPopover({
                    restoreFocus:
                true
                });
            }
        );

    panel
        .querySelector(
            '[data-archive-filter-cancel]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                closeArchiveFilterPopover({
                    restoreFocus:
                true
                });
            }
        );

    panel
        .querySelector(
            '[data-archive-filter-apply]'
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

                const nextValues =
                    controller?.getValues()
              || values;

                if (sourcesView)
                {
                    state.archiveSourceCategoryFilter =
                        nextValues.sourceCategory
                || 'all';

                    state.archiveSourceConnectionFilter =
                        nextValues.sourceConnections
                || 'all';

                    state.archiveSourceFavouriteOnly =
                        Boolean(
                            nextValues
                                .sourceFavouriteOnly
                        );

                    state.archiveSelectedSourceId =
                        null;
                }
                else
                {
                    const wasFiltering =
                        archiveFileFilteringActive();

                    state.archiveFileFilters =
                        archiveFileFiltersWithDefaults(
                            nextValues
                        );

                    state.archiveFilterScopeFolderId =
                        nextValues.scope === 'folder'
                            ? archiveNormalizeFolderId(
                                state.archiveSelectedFolderId
                            )
                            : null;

                    if (
                        state.archiveView
                  === 'favorites'
                && !nextValues
                    .favouriteOnly
                    )
                    {
                        state.archiveView =
                            'files';
                    }

                    /*
              * Start a newly filtered hierarchy at
              * its logical root.
              */
                    if (
                        !wasFiltering
                || state.archiveFilterPresentation
                  === 'folders'
                    )
                    {
                        state.archiveSelectedFolderId =
                            nextValues.scope === 'folder'
                                ? state
                                    .archiveFilterScopeFolderId
                                : null;
                    }

                    state.archiveSelectedFolderItemId =
                        null;

                    state.archiveSelectedFileId =
                        null;

                    state.archiveSelectedFileIds =
                        [];
                }

                closeArchiveFilterPopover();
                renderArchive();
            }
        );

    positionSharedFilterPanel(
        panel,
        anchor
    );

    requestAnimationFrame(() =>
    {
        if (window.innerWidth <= 640)
            panel.querySelector('[data-archive-filter-close]')?.focus({ preventScroll: true });
        else
            panel.querySelector('[data-shared-filter-select]')?.focus({ preventScroll: true });
    });

    setTimeout(() =>
    {
        document.addEventListener(
            'click',
            closeArchiveFilterOnOutside
        );

        document.addEventListener(
            'keydown',
            closeArchiveFilterOnEscape
        );
    }, 0);
}

function archiveActiveToolbarFilters()
{
    if (
        archiveToolbarIsSources()
    )
    {
        const filters =
            [];

        const targetFilter =
            currentArchiveSourceTargetFilter();

        if (targetFilter)
        {
            filters.push({
                key:
              'sourceTarget',

                label:
              `${t('Connected to')}: ${
                  connectedSourceTargetLabel(
                      targetFilter.targetType,
                      targetFilter.target
                  )
              }`
            });
        }
        if (
            state.archiveSourceCategoryFilter
          && state.archiveSourceCategoryFilter
            !== 'all'
        )
        {
            filters.push({
                key:
              'sourceCategory',

                label:
              localizedSourceCategoryLabel(
                  state
                      .archiveSourceCategoryFilter
              )
            });
        }
        if (
            state.archiveSourceConnectionFilter
          && state.archiveSourceConnectionFilter
            !== 'all'
        )
        {
            filters.push({
                key:
              'sourceConnections',

                label:
              state.archiveSourceConnectionFilter
                === 'linked'
                  ? translateText(
                      'With connections'
                  )
                  : translateText(
                      'Without connections'
                  )
            });
        }
        if (
            state.archiveSourceFavouriteOnly
        )
        {
            filters.push({
                key:
              'sourceFavouriteOnly',

                label:
              translateText(
                  'Favourite sources'
              )
            });
        }

        return filters;
    }

    const filters =
        archiveEffectiveFileFilters();

    return archiveFileFilterSchema
        .filter(definition =>
            sharedFilterValueIsActive(
                definition,
                filters[
                    definition.key
                ]
            )
        )
        .map(definition =>
        {
            let label;

            if (
                definition.control
              === 'boolean'
            )
            {
                label =
                    definition.checkboxLabel
              || definition.label;
            }
            else
            {
                label =
                    sharedFilterDisplayValue(
                        definition,
                        filters[
                            definition.key
                        ]
                    );
            }

            return {
                key:
              definition.key,

                label
            };
        });
}

function renderArchiveActiveFilterbar()
{
    const filters =
        archiveActiveToolbarFilters();

    if (!filters.length)
    {
        return '';
    }

    return `
        <div
          class="
            module-active-filterbar
          "
          aria-label="Active Archive filters">

          ${filters
                .map(filter => `
              <span
                class="
                  filter-chip
                  active-filter-chip
                ">

                <span
                  class="
                    active-filter-chip-copy
                  ">

                  ${escapeHtml(
                        filter.label
                    )}
                </span>

                <button
                  class="
                    active-filter-chip-remove
                  "
                  type="button"
                  data-archive-remove-filter="${escapeHtml(
                        filter.key
                    )}"
                  aria-label="Remove ${escapeHtml(
                        filter.label
                    )} filter"
                  title="Remove filter">

                  ${icon.close}
                </button>
              </span>
            `)
                .join('')}

          <span
            class="
              active-filter-actions
            ">

            <button
              class="text-action"
              type="button"
              id="archiveClearFilters">

              Clear all
            </button>
          </span>
        </div>
      `;
}

function removeArchiveToolbarFilter(
    key
)
{
    if (key === 'sourceTarget')
    {
        state.archiveSourceTargetFilter =
            null;

        state.archiveSelectedSourceId =
            null;

        renderArchive();

        return;
    }
    if (
        key === 'sourceCategory'
    )
    {
        state.archiveSourceCategoryFilter =
            'all';

        state.archiveSelectedSourceId =
            null;

        renderArchive();

        return;
    }
    if (
        key === 'sourceConnections'
    )
    {
        state.archiveSourceConnectionFilter =
            'all';

        state.archiveSelectedSourceId =
            null;

        renderArchive();

        return;
    }
    if (
        key === 'sourceFavouriteOnly'
    )
    {
        state.archiveSourceFavouriteOnly =
            false;

        state.archiveSelectedSourceId =
            null;

        renderArchive();

        return;
    }

    const definition =
        sharedFilterDefinitionByKey(
            archiveFileFilterSchema,
            key
        );

    if (!definition)
    {
        return;
    }

    const defaults =
        archiveFileFiltersWithDefaults(
            {}
        );

    state.archiveFileFilters = {
        ...archiveFileFiltersWithDefaults(),
        [key]:
          defaults[key]
    };

    if (key === 'scope')
    {
        state.archiveFilterScopeFolderId =
            null;
    }

    if (
        key === 'favouriteOnly'
        && state.archiveView
          === 'favorites'
    )
    {
        state.archiveView =
            'files';
    }

    state.archiveSelectedFileId =
        null;

    state.archiveSelectedFileIds =
        [];

    renderArchive();
}

function clearArchiveToolbarFilters()
{
    if (
        archiveToolbarIsSources()
    )
    {
        state.archiveSourceCategoryFilter =
            'all';
        state.archiveSourceConnectionFilter =
            'all';
        state.archiveSourceFavouriteOnly =
            false;
        state.archiveSourceTargetFilter = null;
        state.archiveSelectedSourceId =
            null;
    }
    else
    {
        state.archiveFileFilters =
            archiveFileFiltersWithDefaults(
                {}
            );

        state.archiveFilterScopeFolderId =
            null;

        state.archiveFilterPresentation =
            'flat';

        if (
            state.archiveView
            === 'favorites'
        )
        {
            state.archiveView =
                'files';
        }

        state.archiveSelectedFileId =
            null;

        state.archiveSelectedFileIds =
            [];
    }

    renderArchive();
}

function archiveSourceConnectionCount(
    source
)
{
    if (!source)
    {
        return 0;
    }

    return sourceLinksForSource(
        source.id,
        '',
        source.projectId
    ).length;
}

function archiveSourceOriginLabel(
    source
)
{
    if (!source)
    {
        return 'Source record';
    }

    const values =
        [
            source.providedBy,
            source.location
        ]
            .map(value =>
                String(value || '').trim()
            )
            .filter(
                (
                    value,
                    index,
                    records
                ) =>
                    value
              && records.indexOf(value)
                === index
            );

    return values.join(' · ');
}

function archiveSourceWebsiteHost(
    value
)
{
    const normalized =
        String(value || '').trim();

    if (!normalized)
    {
        return '';
    }

    try
    {
        return new URL(
            normalized
        )
            .hostname
            .replace(
                /^www\./i,
                ''
            );
    }
    catch
    {
        return normalized;
    }
}

function archiveSourceReferenceLabel(
    source
)
{
    if (!source)
    {
        return '';
    }

    const values =
        [
            source.reference,
            archiveSourceWebsiteHost(
                source.url
            )
        ]
            .map(value =>
                String(value || '').trim()
            )
            .filter(
                (
                    value,
                    index,
                    records
                ) =>
                    value
              && records.indexOf(value)
                === index
            );

    return values.join(' · ');
}


function archiveSourceCategoryGroups(sources)
{
    const groups = [
        ...SOURCE_CATEGORIES.map(category => ({
            key: category.value,
            label: category.label,
            sources: []
        })),
        { key: 'uncategorized', label: 'Not categorized', sources: [] }
    ];
    const byCategory = new Map(groups.map(group => [group.key, group]));
    const locale = state.language === 'ru' ? 'ru' : 'en';

    (sources || []).forEach(source =>
    {
        const key = SOURCE_CATEGORY_BY_VALUE.has(source.category)
            ? source.category : 'uncategorized';
        byCategory.get(key).sources.push(source);
    });
    groups.forEach(group => group.sources.sort((left, right) =>
        String(left.title || '').localeCompare(
            String(right.title || ''), locale,
            { sensitivity: 'base', numeric: true }
        ) || String(left.id).localeCompare(String(right.id))
    ));
    return groups.filter(group => group.sources.length > 0);
}

function archiveSourceGroupPreferences()
{
    const projectId = currentProjectId();
    const preferences = state.archiveSourceExpandedGroups;

    if (!Object.prototype.hasOwnProperty.call(preferences, projectId))
    {
        const groups = archiveSourceCategoryGroups(archiveProjectSources());
        const largest = groups.reduce((best, group) =>
            !best || group.sources.length > best.sources.length ? group : best,
        null);
        preferences[projectId] = largest ? { [largest.key]: true } : {};
    }

    return preferences[projectId];
}

function renderArchiveSourceRow(source)
{
    const selected = state.archiveSelectedSourceId === source.id;
    const summary = [
        archiveSourceOriginLabel(source),
        archiveSourceReferenceLabel(source)
    ].filter(Boolean).join(' · ');
    const connectionCount = archiveSourceConnectionCount(source);
    const connectionsLabel = `${t('Connections')}: ${connectionCount}`;

    return `
        <div class="archive-source-entry ${selected ? 'selected-detail' : ''}"
          data-archive-source-row="${escapeHtml(source.id)}"
          role="listitem" tabindex="0" aria-label="${escapeHtml(source.title)}"
          ${selected ? 'aria-current="true"' : ''}>
          <div class="archive-source-entry-main">
            <strong title="${escapeHtml(source.title)}">${escapeHtml(source.title)}</strong>
            ${summary
                ? `<span title="${escapeHtml(summary)}">${escapeHtml(summary)}</span>`
                : ''}
          </div>
          <span class="archive-source-entry-connections"
            title="${escapeHtml(connectionsLabel)}"
            aria-label="${escapeHtml(connectionsLabel)}">
            <span>${escapeHtml(t('Connections'))}:</span>
            <strong>${connectionCount}</strong>
          </span>
          <div class="archive-source-entry-actions">
            <button class="archive-row-icon-button ${source.favorite ? 'active' : ''}"
              type="button" data-archive-source-favorite="${escapeHtml(source.id)}"
              aria-label="${escapeHtml(t(source.favorite
                  ? 'Remove source from favourites'
                  : 'Add source to favourites'))}">
              ${icon.star}
            </button>
            <button class="archive-row-icon-button" type="button"
              data-archive-row-actions="source"
              data-archive-row-id="${escapeHtml(source.id)}"
              aria-label="${escapeHtml(t('Source actions'))}">
              ${icon.more}
            </button>
          </div>
        </div>
      `;
}

function archiveSourceResultsNarrowed()
{
    return Boolean(
        String(state.archiveSearch || '').trim()
        || state.archiveSourceCategoryFilter !== 'all'
        || state.archiveSourceConnectionFilter !== 'all'
        || state.archiveSourceFavouriteOnly
        || state.archiveSourceTargetFilter
    );
}

function renderArchiveSourceGroups(sources)
{
    const groups = archiveSourceCategoryGroups(sources);
    const expanded = archiveSourceGroupPreferences();
    const revealing = archiveSourceResultsNarrowed();

    return `
        <div class="archive-source-groups" role="region"
          aria-label="${escapeHtml(t('Sources'))}">
          ${groups.map(group => `
            <details class="archive-source-group"
              data-archive-source-group="${escapeHtml(group.key)}"
              ${revealing || expanded[group.key] ? 'open' : ''}>
              <summary>
                <strong>${escapeHtml(t(group.label))}</strong>
                <span class="archive-source-group-count">${group.sources.length}</span>
              </summary>
              <div class="archive-source-group-rows" role="list">
                ${group.sources.map(renderArchiveSourceRow).join('')}
              </div>
            </details>
          `).join('')}
        </div>
      `;
}

function renderArchiveSourcesView()
{
    const sources =
        archiveFilteredSources();

    return `
        <div
          class="
            archive-page
          ">

          ${renderArchivePageHead({
                title:
              'Sources',

                subtitle:
              archiveSourcesViewSubtitle(),

                actions:
              renderArchiveSourcesHeaderActions()
            })}

          ${renderArchiveToolbar()}

          ${renderArchiveActiveFilterbar()}

          ${
                sources.length
                    ? renderArchiveSourceGroups(
                        sources
                    )
                    : renderArchiveEmpty(
                        'No sources found',

                        state.archiveSearch
                            ? 'Try a different search term or source type.'
                            : 'Create a lightweight source record to document where files and information came from.'
                    )
            }
        </div>
      `;
}
