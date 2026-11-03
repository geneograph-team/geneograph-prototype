function archiveMoveFolderPath(
    folderId
)
{
    const folders =
        archiveFolderAncestors(
            folderId
        );

    return [
        ARCHIVE_ROOT_LABEL,

        ...folders.map(
            folder =>
                folder.name
        )
    ].join(
        ' / '
    );
}

function archiveMoveCurrentFolderState({
    movingFolder,
    files
})
{
    /*
        When moving a folder, the folder itself is
        the unavailable "Current folder" row.
      */
    if (movingFolder)
    {
        return {
            hasCurrentFolder:
            true,

            folderId:
            movingFolder.id
        };
    }

    /*
        A single current folder exists only when
        all selected files share the same folder.
      */
    const folderIds =
        [
            ...new Set(
                files.map(file =>
                    archiveFileFolderId(
                        file
                    )
                )
            )
        ];

    return {
        hasCurrentFolder:
          folderIds.length === 1,

        folderId:
          folderIds.length === 1
              ? folderIds[0]
              : null
    };
}

function archiveMoveNewFolderParentId({
    movingFolder,
    selectedId,
    currentFolderState
})
{
    /*
        Create inside the explicitly selected
        destination whenever one exists.
      */
    if (
        archiveMoveHasDestination(
            selectedId
        )
    )
    {
        return selectedId;
    }

    /*
        A new destination for a moving folder
        must not be created inside that folder.
        Default to its existing parent.
      */
    if (movingFolder)
    {
        return archiveFolderParentId(
            movingFolder
        );
    }

    /*
        For files from one location, creating a
        subfolder inside their current folder is
        a useful default.
      */
    if (
        currentFolderState
            .hasCurrentFolder
    )
    {
        return currentFolderState
            .folderId;
    }

    /*
        Mixed-origin bulk selection defaults to
        the Files root.
      */
    return null;
}

const ARCHIVE_FOLDER_DOUBLE_CLICK_MS =
    420;

let archiveLastFolderRowClick = {
    folderId:
        null,

    at:
        0
};

let archiveLastFileRowClick = { fileId: null, at: 0 };

function archiveFileRowWasDoubleClick(fileId)
{
    const now = performance.now();
    const repeated = archiveLastFileRowClick.fileId === fileId
        && now - archiveLastFileRowClick.at <= ARCHIVE_FOLDER_DOUBLE_CLICK_MS;
    archiveLastFileRowClick = { fileId, at: now };
    return repeated;
}

function archiveFolderRowWasDoubleClick(
    folderId
)
{
    const now =
        performance.now();

    const repeated =
        archiveLastFolderRowClick
            .folderId === folderId
        && now
          - archiveLastFolderRowClick.at
          <= ARCHIVE_FOLDER_DOUBLE_CLICK_MS;

    archiveLastFolderRowClick = {
        folderId,

        at:
          now
    };

    return repeated;
}

function resetArchiveFolderRowClick()
{
    archiveLastFolderRowClick = {
        folderId:
          null,

        at:
          0
    };
}

function archiveMoveInitialRevealFolderId({
    movingFolder,
    files,
    currentFolderState
})
{
    if (movingFolder)
    {
        return movingFolder.id;
    }

    if (
        currentFolderState
            .hasCurrentFolder
    )
    {
        return currentFolderState
            .folderId;
    }

    return archiveFileFolderId(
        files[0]
    );
}

function renderArchiveMoveItemSummary({
    movingFolder,
    files
})
{
    let itemIcon =
        files.length === 1 && archiveFileKind(files[0]) === 'img'
            ? icon.image
            : icon.file;

    let itemName =
        '';

    let itemMeta =
        '';

    if (movingFolder)
    {
        const impact =
            archiveFolderImpact(
                movingFolder.id
            );

        itemIcon =
            icon.folderyellow;

        itemName =
            movingFolder.name
          || 'Untitled folder';

        itemMeta =
            `${impact.files} ${
                impact.files === 1
                    ? 'file'
                    : 'files'
            } · ${impact.folders} ${
                impact.folders === 1
                    ? 'subfolder'
                    : 'subfolders'
            }`;
    }
    else if (
        files.length === 1
    )
    {
        const file =
            files[0];

        itemName =
            file.name
          || 'Untitled file';

        itemMeta =
            [
                archiveFileTypeLabel(
                    file
                ),

                file.size
            || ''
            ]
                .filter(Boolean)
                .join(' · ');
    }
    else
    {
        itemName =
            `${files.length} files`;

        itemMeta =
            'Selected files';
    }

    return `
        <div
          class="
            archive-move-item-summary
          ">

          <span
            class="
              archive-move-context-label
            ">

            ${movingFolder ? 'Folder to move' : files.length === 1 ? 'File to move' : 'Files to move'}
          </span>

          <div
            class="
              archive-move-item-row
            ">

            <span
              class="
                archive-move-item-icon
              "
              aria-hidden="true">

              ${itemIcon}
            </span>

            <span
              class="
                archive-move-item-copy
              ">

              <strong>
                ${escapeHtml(
                    itemName
                )}
              </strong>

              ${
                    itemMeta
                        ? `
                    <span>
                      ${escapeHtml(
                            itemMeta
                        )}
                    </span>
                  `
                        : ''
                }
            </span>


          </div>
        </div>
      `;
}

function archiveMoveSelectionStats({
    movingFolder,
    files,
    selectedId
})
{
    if (
        !archiveMoveHasDestination(
            selectedId
        )
    )
    {
        return {
            canMove:
            false,

            movableFiles:
            [],

            movableCount:
            0,

            alreadyThere:
            0
        };
    }

    if (movingFolder)
    {
        const currentParentId =
            archiveFolderParentId(
                movingFolder
            );

        const canMove =
            currentParentId
            !== selectedId;

        return {
            canMove,

            movableFiles:
            [],

            movableCount:
            canMove
                ? 1
                : 0,

            alreadyThere:
            canMove
                ? 0
                : 1
        };
    }

    const movableFiles =
        files.filter(file =>
            archiveFileFolderId(
                file
            ) !== selectedId
        );

    return {
        canMove:
          movableFiles.length > 0,

        movableFiles,

        movableCount:
          movableFiles.length,

        alreadyThere:
          files.length
          - movableFiles.length
    };
}

function archiveMoveHighlightMatch(
    label,
    query
)
{
    const normalizedLabel =
        String(
            label || ''
        );

    const normalizedQuery =
        String(
            query || ''
        )
            .trim();

    if (!normalizedQuery)
    {
        return escapeHtml(
            normalizedLabel
        );
    }

    const index =
        normalizedLabel
            .toLowerCase()
            .indexOf(
                normalizedQuery
                    .toLowerCase()
            );

    if (index < 0)
    {
        return escapeHtml(
            normalizedLabel
        );
    }

    const before =
        normalizedLabel.slice(
            0,
            index
        );

    const match =
        normalizedLabel.slice(
            index,
            index
            + normalizedQuery.length
        );

    const after =
        normalizedLabel.slice(
            index
            + normalizedQuery.length
        );

    return `
        ${escapeHtml(
            before
        )}<mark>${escapeHtml(
            match
        )}</mark>${escapeHtml(
            after
        )}
      `;
}

function renderArchiveMoveSelectedMark()
{
    return `
        <span
          class="
            archive-move-selected-mark
          "
          aria-hidden="true">

          ${icon.check}
        </span>
      `;
}

function renderArchiveMoveTreeFolderRows({
    parentId,
    depth,
    selectedId,
    expandedIds,
    movingFolderId,
    currentFolderState
})
{
    return archiveFolderChildren(
        parentId
    )
        .map(folder =>
        {
            const isMovingFolder =
                folder.id
              === movingFolderId;

            const isCurrentFolder =
                Boolean(
                    currentFolderState
                        ?.hasCurrentFolder
              && folder.id
                === currentFolderState
                    .folderId
                );

            const children =
                archiveFolderChildren(
                    folder.id
                );

            const hasChildren =
                children.length > 0;

            const expanded =
                expandedIds.has(
                    folder.id
                );

            const selected =
                archiveMoveHasDestination(
                    selectedId
                )
            && selectedId
              === folder.id;

            return `
            <div
              class="
                archive-move-tree-row
              "
              style="
                --archive-move-depth:
                  ${depth};
              ">

              ${
                    hasChildren
                && !isMovingFolder
                        ? `
                    <button
                      class="
                        archive-move-tree-toggle
                        ${
                            expanded
                                ? 'is-expanded'
                                : ''
                        }
                      "
                      type="button"
                      data-archive-move-toggle="${escapeHtml(
                            folder.id
                        )}"
                      aria-label="${
                            expanded
                                ? 'Collapse'
                                : 'Expand'
                        } ${escapeHtml(
                            folder.name
                        )}"
                      aria-expanded="${String(
                            expanded
                        )}">

                      ${icon.chevron}
                    </button>
                  `
                        : `
                    <span
                      class="
                        archive-move-tree-toggle
                        is-placeholder
                      "
                      aria-hidden="true">
                    </span>
                  `
                }

              <button
                class="
                  archive-move-tree-main

                  ${
                        selected
                            ? 'is-selected'
                            : ''
                    }

                  ${
                        isCurrentFolder
                            ? 'is-current-folder'
                            : ''
                    }
                "
                type="button"
                data-archive-move-select="${escapeHtml(
                    folder.id
                )}"
                aria-pressed="${String(
                    selected
                )}"
                ${
                    isCurrentFolder
                        ? 'disabled aria-disabled="true"'
                        : ''
                }>

                ${icon.folderyellow}

                <span
                  class="
                    archive-move-folder-copy
                  ">

                  <strong>
                    ${escapeHtml(
                        folder.name
                    )}
                  </strong>

                  ${
                        isCurrentFolder
                            ? `
                        <span>
                          ${escapeHtml(t(movingFolderId ? 'Cannot move a folder into itself' : 'Already in this folder'))}
                        </span>
                      `
                            : ''
                    }
                </span>

                ${
                    selected
                        ? renderArchiveMoveSelectedMark()
                        : ''
                }
              </button>
            </div>

            ${
                hasChildren
              && expanded
              && !isMovingFolder
                    ? renderArchiveMoveTreeFolderRows({
                        parentId:
                      folder.id,

                        depth:
                      depth + 1,

                        selectedId,

                        expandedIds,

                        movingFolderId,

                        currentFolderState
                    })
                    : ''
            }
          `;
        })
        .join('');
}

function renderArchiveMoveTree({
    selectedId,
    expandedIds,
    movingFolderId,
    currentFolderState
})
{
    const rootExpanded =
        expandedIds.has(
            null
        );

    const rootCurrent =
        Boolean(
            currentFolderState
                ?.hasCurrentFolder
          && archiveIsRootLocation(
              currentFolderState
                  .folderId
          )
        );

    const rootSelected =
        archiveMoveHasDestination(
            selectedId
        )
        && archiveIsRootLocation(
            selectedId
        );

    const rootHasChildren =
        archiveFolderChildren(
            null
        ).length > 0;

    return `
        <div
          class="
            archive-move-tree
          ">

          <div
            class="
              archive-move-tree-row
            "
            style="
              --archive-move-depth:
                0;
            ">

            ${
                rootHasChildren
                    ? `
                  <button
                    class="
                      archive-move-tree-toggle
                      ${
                            rootExpanded
                                ? 'is-expanded'
                                : ''
                        }
                    "
                    type="button"
                    data-archive-move-toggle="${ARCHIVE_ROOT_PICKER_VALUE}"
                    aria-label="${
                        rootExpanded
                            ? `Collapse ${ARCHIVE_ROOT_LABEL}`
                            : `Expand ${ARCHIVE_ROOT_LABEL}`
                    }"
                    aria-expanded="${String(
                        rootExpanded
                    )}">

                    ${icon.chevron}
                  </button>
                `
                    : `
                  <span
                    class="
                      archive-move-tree-toggle
                      is-placeholder
                    "
                    aria-hidden="true">
                  </span>
                `
            }

            <button
              class="
                archive-move-tree-main

                ${
                    rootSelected
                        ? 'is-selected'
                        : ''
                }

                ${
                    rootCurrent
                        ? 'is-current-folder'
                        : ''
                }
              "
              type="button"
              data-archive-move-select="${ARCHIVE_ROOT_PICKER_VALUE}"
              aria-pressed="${String(
                    rootSelected
                )}"
              ${
                    rootCurrent
                        ? 'disabled aria-disabled="true"'
                        : ''
                }>

              ${icon.folderyellow}

              <span
                class="
                  archive-move-folder-copy
                ">

                <strong>
                  ${ARCHIVE_ROOT_LABEL}
                </strong>

                <span>
                  ${
                        rootCurrent
                            ? t(movingFolderId ? 'Cannot move a folder into itself' : 'Already in this folder')
                            : 'Top level'
                    }
                </span>
              </span>

              ${
                    rootSelected
                        ? renderArchiveMoveSelectedMark()
                        : ''
                }
            </button>
          </div>

          ${
                rootExpanded
                    ? renderArchiveMoveTreeFolderRows({
                        parentId:
                    null,

                        depth:
                    1,

                        selectedId,

                        expandedIds,

                        movingFolderId,

                        currentFolderState
                    })
                    : ''
            }
        </div>
      `;
}

function renderArchiveMoveSearchResults({
    query,
    selectedId,
    movingFolder,
    currentFolderState
})
{
    const normalizedQuery =
        String(
            query || ''
        )
            .trim()
            .toLowerCase();

    const blockedDescendantIds =
        new Set(
            movingFolder
                ? archiveFolderDescendantIds(
                    movingFolder.id,
                    {
                        includeSelf:
                    false
                    }
                )
                : []
        );

    const rootMatches =
        `${ARCHIVE_ROOT_LABEL} files top level`
            .toLowerCase()
            .includes(
                normalizedQuery
            );

    const rootCurrent =
        Boolean(
            currentFolderState
                ?.hasCurrentFolder
          && archiveIsRootLocation(
              currentFolderState
                  .folderId
          )
        );

    const rootSelected =
        archiveMoveHasDestination(
            selectedId
        )
        && archiveIsRootLocation(
            selectedId
        );

    const folders =
        archiveFlattenFolders()
            .map(item =>
                item.folder
            )
            .filter(folder =>
                !blockedDescendantIds.has(
                    folder.id
                )
            && String(
                folder.name || ''
            )
                .toLowerCase()
                .includes(
                    normalizedQuery
                )
            );

    if (
        !rootMatches
        && !folders.length
    )
    {
        return `
          <div
            class="
              archive-move-empty
            ">

            No folders match “${escapeHtml(
                query
            )}”.
          </div>
        `;
    }

    return `
        <div
          class="
            archive-move-search-results
          ">

          ${
                rootMatches
                    ? `
                <button
                  class="
                    archive-move-search-result

                    ${
                        rootSelected
                            ? 'is-selected'
                            : ''
                    }

                    ${
                        rootCurrent
                            ? 'is-current-folder'
                            : ''
                    }
                  "
                  type="button"
                  data-archive-move-select="${ARCHIVE_ROOT_PICKER_VALUE}"
                  aria-pressed="${String(
                        rootSelected
                    )}"
                  ${
                        rootCurrent
                            ? 'disabled aria-disabled="true"'
                            : ''
                    }>

                  ${icon.folderyellow}

                  <span
                    class="
                      archive-move-folder-copy
                    ">

                    <strong>
                      ${archiveMoveHighlightMatch(
                            ARCHIVE_ROOT_LABEL,
                            query
                        )}
                    </strong>

                    <span>
                      ${
                            rootCurrent
                                ? t(movingFolder ? 'Cannot move a folder into itself' : 'Already in this folder')
                                : 'Top level'
                        }
                    </span>
                  </span>

                  ${
                        rootSelected
                            ? renderArchiveMoveSelectedMark()
                            : ''
                    }
                </button>
              `
                    : ''
            }

          ${folders
                .map(folder =>
                {
                    const isCurrentFolder =
                        Boolean(
                            currentFolderState
                                ?.hasCurrentFolder
                  && folder.id
                    === currentFolderState
                        .folderId
                        );

                    const selected =
                        archiveMoveHasDestination(
                            selectedId
                        )
                && selectedId
                  === folder.id;

                    return `
                <button
                  class="
                    archive-move-search-result

                    ${
                        selected
                            ? 'is-selected'
                            : ''
                    }

                    ${
                        isCurrentFolder
                            ? 'is-current-folder'
                            : ''
                    }
                  "
                  type="button"
                  data-archive-move-select="${escapeHtml(
                        folder.id
                    )}"
                  aria-pressed="${String(
                        selected
                    )}"
                  ${
                        isCurrentFolder
                            ? 'disabled aria-disabled="true"'
                            : ''
                    }>

                  ${icon.folderyellow}

                  <span
                    class="
                      archive-move-folder-copy
                    ">

                    <strong>
                      ${archiveMoveHighlightMatch(
                            folder.name,
                            query
                        )}
                    </strong>

                    <span>
                      ${
                            isCurrentFolder
                                ? t(movingFolder ? 'Cannot move a folder into itself' : 'Already in this folder')
                                : escapeHtml(
                                    archiveMoveFolderPath(
                                        archiveFolderParentId(
                                            folder
                                        )
                                    )
                                )
                        }
                    </span>
                  </span>

                  ${
                        selected
                            ? renderArchiveMoveSelectedMark()
                            : ''
                    }
                </button>
              `;
                })
                .join('')}
        </div>
      `;
}

function renderArchiveMovePicker({
    query,
    selectedId,
    expandedIds,
    movingFolder,
    currentFolderState
})
{
    return `
        <div
          class="
            archive-move-picker
            rp-content
          "
          data-archive-move-picker>

          ${
                String(
                    query || ''
                ).trim()
                    ? renderArchiveMoveSearchResults({
                        query,
                        selectedId,
                        movingFolder,
                        currentFolderState
                    })
                    : renderArchiveMoveTree({
                        selectedId,
                        expandedIds,

                        movingFolderId:
                    movingFolder?.id
                    || '',

                        currentFolderState
                    })
            }
        </div>
      `;
}

function openArchiveMoveModal({
    fileIds = [],
    folderId = ''
} = {})
{
    const movingFolder =
        folderId
            ? archiveFolderById(
                folderId
            )
            : null;

    const files =
        [
            ...new Set(
                fileIds
            )
        ]
            .map(id =>
                archiveFileById(
                    id
                )
            )
            .filter(Boolean);

    if (
        !movingFolder
        && !files.length
    )
    {
        return;
    }

    const currentFolderState =
        archiveMoveCurrentFolderState({
            movingFolder,
            files
        });

    let selectedId =
        ARCHIVE_MOVE_NO_DESTINATION;

    let query =
        '';

    let searchExpanded =
        false;

    let creatingFolder =
        false;

    const expandedIds =
        new Set([
            null
        ]);

    const revealFolderId =
        archiveMoveInitialRevealFolderId({
            movingFolder,
            files,
            currentFolderState
        });

    archiveFolderAncestors(
        revealFolderId
    ).forEach(folder =>
    {
        expandedIds.add(
            folder.id
        );
    });

    if (revealFolderId)
    {
        expandedIds.add(
            revealFolderId
        );
    }

    const title =
        movingFolder
            ? 'Move folder'
            : files.length === 1
                ? 'Move file'
                : `Move ${files.length} files`;

    openModal(`
        <div
          class="
            modal
            archive-move-modal
            resource-picker
          "
          role="dialog"
          aria-modal="true"
          aria-labelledby="archiveMoveTitle">

          <div class="modal-header">
            <div>
              <h2
                id="archiveMoveTitle">

                ${escapeHtml(
                    title
                )}
              </h2>

              <p>
                Choose a destination folder.
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

          <div
            class="
              modal-body
            ">

            ${renderArchiveMoveItemSummary({
                movingFolder,
                files
            })}

            <div
              class="
                archive-move-content
              "
              data-archive-move-content>
            </div>
          </div>

          <div
            class="
              modal-footer
            "
            data-archive-move-footer>
          </div>
        </div>
      `);

    const modal =
        modalBackdrop.querySelector(
            '.archive-move-modal'
        );

    const contentRoot =
        modal?.querySelector(
            '[data-archive-move-content]'
        );

    const footerRoot =
        modal?.querySelector(
            '[data-archive-move-footer]'
        );

    const getNewFolderParentId =
        () =>
            archiveMoveNewFolderParentId({
                movingFolder,
                selectedId,
                currentFolderState
            });

    const renderMoveContent =
        ({
            focusSearch =
                false,

            focusFolderName =
                false
        } = {}) =>
        {
            const stats =
                archiveMoveSelectionStats({
                    movingFolder,
                    files,
                    selectedId
                });

            const hasDestination =
                archiveMoveHasDestination(
                    selectedId
                );

            const breadcrumbs = hasDestination
                ? [
                    { id: ARCHIVE_ROOT_PICKER_VALUE, name: t('All files') },
                    ...archiveFolderAncestors(selectedId).map(folder => ({ id: folder.id, name: folder.name }))
                ]
                : [{ id: ARCHIVE_ROOT_PICKER_VALUE, name: t('Choose a folder') }];
            const currentCrumb = breadcrumbs.at(-1);
            const fullPath = breadcrumbs.map(crumb => crumb.name).join(' / ');

            const newFolderParentId =
                getNewFolderParentId();

            const newFolderParentPath =
                archiveMoveFolderPath(
                    newFolderParentId
                );

            if (contentRoot)
            {
                contentRoot.innerHTML = `
              <div class="archive-create-folder-path-row">
                <div class="archive-create-folder-path-context">
                  <span class="archive-create-folder-path-label">${escapeHtml(t('Destination'))}</span>
                  <nav class="rp-path archive-folder-path" aria-label="${escapeHtml(t('Destination'))}" aria-live="polite">
                    <span class="rp-path-icon" aria-hidden="true">${icon.folderyellow}</span>
                    ${breadcrumbs.slice(0, -1).map((crumb, index) => `<button class="${index ? 'archive-folder-crumb-intermediate' : ''}" type="button" data-archive-move-crumb="${escapeHtml(crumb.id)}" title="${escapeHtml(crumb.name)}">${escapeHtml(crumb.name)}</button><span class="${index ? 'archive-folder-crumb-intermediate' : ''}" aria-hidden="true">${icon.chevron}</span>`).join('')}
                    <span aria-current="page" class="${hasDestination ? '' : 'is-placeholder'}" title="${escapeHtml(fullPath)}">${escapeHtml(currentCrumb.name)}</span>
                  </nav>
                </div>
                <div class="archive-folder-inline-search ${searchExpanded ? 'is-expanded' : ''}">
                  <button type="button" class="icon-button" data-archive-move-search-toggle
                    aria-label="${escapeHtml(t(searchExpanded ? 'Close search' : 'Search folders'))}" aria-expanded="${searchExpanded}" aria-controls="archiveMoveSearch" title="${escapeHtml(t(searchExpanded ? 'Close search' : 'Search folders'))}">${icon.search}</button>
                  <input id="archiveMoveSearch" type="search" data-archive-move-search
                    aria-label="${escapeHtml(t('Search folders'))}" placeholder="${escapeHtml(t('Search folders'))}" value="${escapeHtml(query)}" ${searchExpanded ? '' : 'hidden'}>
                </div>
                <button class="button secondary archive-move-item-action" type="button"
                  data-archive-move-new-folder aria-label="Create a new destination folder">
                  ${icon.plus}<span>New folder</span>
                </button>
              </div>
              ${
                    creatingFolder
                        ? `
                    <form
                      class="
                        archive-move-new-folder-form
                      "
                      data-archive-move-new-folder-form>

                      <div
                        class="
                          archive-move-new-folder-context
                        ">

                        <span>
                          Create inside
                        </span>

                        <strong>
                          ${escapeHtml(
                                newFolderParentPath
                            )}
                        </strong>
                      </div>

                      <div
                        class="
                          archive-move-new-folder-fields
                        ">

                        <input
                          data-archive-move-new-folder-name
                          required
                          maxlength="160"
                          placeholder="Folder name">

                        <button
                          class="
                            button
                            secondary
                          "
                          type="button"
                          data-archive-move-cancel-new-folder>

                          Cancel
                        </button>

                        <button
                          class="
                            button
                            primary
                          "
                          type="submit">

                          Create
                        </button>
                      </div>
                    </form>
                  `
                        : ''
                }

              ${renderArchiveMovePicker({
                    query,
                    selectedId,
                    expandedIds,
                    movingFolder,
                    currentFolderState
                })}
            `;
            }

            if (footerRoot)
            {
                const buttonLabel =
                    !archiveMoveHasDestination(selectedId)
              || movingFolder
              || files.length === 1
                        ? 'Move here'
                        : `Move ${stats.movableCount} files`;

                footerRoot.innerHTML = `
              <button
                class="button secondary"
                type="button"
                data-close>
                Cancel
              </button>

              <button
                class="button primary"
                type="button"
                data-archive-move-confirm
                ${stats.canMove ? '' : 'disabled aria-disabled="true"'}>
                ${escapeHtml(buttonLabel)}
              </button>
            `;

                // The footer is recreated on every render, so bind its new button.
                footerRoot
                    .querySelector('[data-close]')
                    ?.addEventListener('click', closeModal);
            }

            // Translate after both the folder picker and footer have been rendered.
            localizeUI(modal, {
                suppressObserverReplay: true
            });

            requestAnimationFrame(
                () =>
                {
                    if (focusSearch)
                    {
                        const searchInput =
                            modal?.querySelector(
                                '[data-archive-move-search]'
                            );

                        searchInput?.focus();

                        const end =
                            searchInput?.value
                                .length
                  || 0;

                        searchInput?.setSelectionRange(
                            end,
                            end
                        );
                    }

                    if (focusFolderName)
                    {
                        modal
                            ?.querySelector(
                                '[data-archive-move-new-folder-name]'
                            )
                            ?.focus();
                    }
                }
            );
        };

    const commitMove =
        () =>
        {
            if (
                !archiveMoveHasDestination(
                    selectedId
                )
            )
            {
                return;
            }
            if (
                selectedId
            && !archiveFolderById(
                selectedId
            )
            )
            {
                return;
            }

            const stats =
                archiveMoveSelectionStats({
                    movingFolder,
                    files,
                    selectedId
                });

            if (!stats.canMove)
            {
                return;
            }

            const destinationPath =
                archiveMoveFolderPath(
                    selectedId
                );

            const now =
                new Date()
                    .toISOString();

            const folderSnapshot =
                movingFolder
                    ? {
                        id:
                    movingFolder.id,

                        parentId:
                    archiveFolderParentId(
                        movingFolder
                    ),

                        updatedAt:
                    movingFolder.updatedAt
                    }
                    : null;

            const fileSnapshots =
                stats.movableFiles
                    .map(file => ({
                        id:
                  file.id,

                        folderId:
                  archiveFileFolderId(
                      file
                  ),

                        updatedAt:
                  file.updatedAt,

                        updated:
                  file.updated
                    }));

            if (movingFolder)
            {
                movingFolder.parentId =
                    selectedId;

                movingFolder.updatedAt =
                    now;

                if (selectedId)
                {
                    state.archiveExpandedFolders[
                        selectedId
                    ] = true;
                }
            }
            else
            {
                stats.movableFiles
                    .forEach(file =>
                    {
                        file.folderId =
                            selectedId;

                        file.updatedAt =
                            now;

                        file.updated =
                            'Just now';
                    });

                state.archiveSelectedFileIds =
                    [];

                if (
                    stats.movableFiles
                        .some(file =>
                            file.id
                    === state.archiveSelectedFileId
                        )
                )
                {
                    state.archiveSelectedFileId =
                        null;
                }
            }

            const movedCount =
                movingFolder
                    ? 1
                    : stats.movableCount;

            const movedMessage =
                movingFolder
                    ? `${
                        movingFolder.name
                  || 'Folder'
                    } moved to ${destinationPath}.`
                    : movedCount === 1
                        ? `${
                            stats.movableFiles[0]
                                ?.name
                    || 'File'
                        } moved to ${destinationPath}.`
                        : `${movedCount} files moved to ${destinationPath}.`;

            const openFolderId =
                movingFolder
                    ? movingFolder.id
                    : selectedId;

            closeModal();
            renderArchive();

            showActionToast({
                message:
              movedMessage,

                actions: [
                    {
                        label:
                  'Undo',

                        onClick:
                  () =>
                  {
                      if (folderSnapshot)
                      {
                          const folder =
                              archiveFolderById(
                                  folderSnapshot.id
                              );

                          if (folder)
                          {
                              folder.parentId =
                                  folderSnapshot.parentId;

                              folder.updatedAt =
                                  folderSnapshot.updatedAt;
                          }
                      }

                      fileSnapshots
                          .forEach(snapshot =>
                          {
                              const file =
                                  archiveFileById(
                                      snapshot.id
                                  );

                              if (!file)
                              {
                                  return;
                              }

                              file.folderId =
                                  snapshot.folderId;

                              file.updatedAt =
                                  snapshot.updatedAt;

                              file.updated =
                                  snapshot.updated;
                          });

                      renderArchive();

                      showToast(
                          'Move undone.'
                      );
                  }
                    },

                    {
                        label:
                  'Open folder',

                        onClick:
                  () =>
                  {
                      archiveNavigateToLocation(
                          {
                              view:
                          'files',

                              folderId:
                          openFolderId,

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
                    }
                ]
            });
        };

    modal?.addEventListener(
        'input',
        event =>
        {
            const searchInput =
                event.target.closest(
                    '[data-archive-move-search]'
                );

            if (!searchInput)
            {
                return;
            }

            query =
                searchInput.value;

            renderMoveContent({
                focusSearch:
              true
            });
        }
    );

    modal?.addEventListener(
        'submit',
        event =>
        {
            const form =
                event.target.closest(
                    '[data-archive-move-new-folder-form]'
                );

            if (!form)
            {
                return;
            }

            event.preventDefault();

            const name =
                form
                    .querySelector(
                        '[data-archive-move-new-folder-name]'
                    )
                    ?.value
                    .trim()
            || '';

            const parentId =
                getNewFolderParentId();

            const folder =
                createArchiveFolderRecord(
                    name,
                    parentId
                );

            if (!folder)
            {
                form
                    .querySelector(
                        '[data-archive-move-new-folder-name]'
                    )
                    ?.focus();

                return;
            }

            expandedIds.add(
                parentId
            );

            selectedId =
                folder.id;

            query =
                '';

            creatingFolder =
                false;

            renderMoveContent();
        }
    );

    modal?.addEventListener(
        'click',
        event =>
        {
            const searchToggle = event.target.closest('[data-archive-move-search-toggle]');
            if (searchToggle)
            {
                searchExpanded = !searchExpanded;
                if (!searchExpanded) query = '';
                renderMoveContent({ focusSearch: searchExpanded });
                if (!searchExpanded)
                {
                    requestAnimationFrame(() => modal?.querySelector('[data-archive-move-search-toggle]')?.focus());
                }
                return;
            }

            const crumb = event.target.closest('[data-archive-move-crumb]');
            if (crumb)
            {
                const nextId = archiveFolderIdFromChoice(crumb.dataset.archiveMoveCrumb);
                const blocked = movingFolder
                    && archiveFolderDescendantIds(movingFolder.id).includes(nextId);
                if (blocked || !archiveMoveSelectionStats({ movingFolder, files, selectedId: nextId }).canMove) return;
                selectedId = nextId;
                query = '';
                searchExpanded = false;
                renderMoveContent();
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

                renderMoveContent();

                return;
            }

            const destination =
                event.target.closest(
                    '[data-archive-move-select]'
                );

            if (destination)
            {
                if (
                    destination.disabled
              || destination.getAttribute(
                  'aria-disabled'
              ) === 'true'
                )
                {
                    return;
                }

                selectedId =
                    archiveFolderIdFromChoice(
                        destination.dataset
                            .archiveMoveSelect
                    );

                renderMoveContent();

                return;
            }

            if (
                event.target.closest(
                    '[data-archive-move-new-folder]'
                )
            )
            {
                if (
                    creatingFolder
                )
                {
                    modal
                        ?.querySelector(
                            '[data-archive-move-new-folder-name]'
                        )
                        ?.focus();

                    return;
                }

                creatingFolder =
                    true;

                renderMoveContent({
                    focusFolderName:
                true
                });

                return;
            }

            if (
                event.target.closest(
                    '[data-archive-move-cancel-new-folder]'
                )
            )
            {
                creatingFolder =
                    false;

                renderMoveContent();

                return;
            }

            if (
                event.target.closest(
                    '[data-archive-move-confirm]'
                )
            )
            {
                commitMove();
            }
        }
    );

    renderMoveContent();
}

