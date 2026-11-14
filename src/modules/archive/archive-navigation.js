const defaultArchiveFileFilters =
    Object.freeze({
        scope: 'all',
        fileType: 'all',
        connections: 'all',
        sourceId: '',
        personIds:
          Object.freeze([]),
        placeIds:
          Object.freeze([]),
        documentYears:
          Object.freeze({
              mode:
              '',
              from:
              '',
              to:
              ''
          }),

        favouriteOnly:
          false
    });

function archiveFilePersonIds(
    file
)
{
    return archiveUniqueIds(
        file?.linkedPersonIds
        || []
    );
}

function archiveFilePlaceIds(
    file
)
{
    const documentPlace =
        archiveDocumentPlace(
            file
        );

    return archiveUniqueIds([
        documentPlace.placeId,

        ...(
            file?.linkedPlaceIds
          || []
        ),

        ...(
            file?.placeIds
          || []
        )
    ]);
}

function archiveSetFilePlaces(file, placeIds, { resolveLegacy = false } = {})
{
    const ids = archiveUniqueIds(placeIds || []);
    if (!file || ids.some(id => !getPlace(id) || getPlace(id).deleted || getPlace(id).projectId !== file.projectId)) return false;
    const legacyText = !file.documentPlaceId
        ? String(file.documentPlaceText || '').trim()
        : '';
    const matchedLegacy = ids.some(id => normalizePlaceLookupText(getPlace(id)?.name || '')
        === normalizePlaceLookupText(legacyText));
    file.linkedPlaceIds = [...ids];
    file.placeIds = [...ids];
    file.documentPlaceId = null;
    file.documentPlaceText = ((resolveLegacy && ids.length) || matchedLegacy) ? '' : legacyText;
    file.updatedAt = new Date().toISOString();
    file.updated = 'Just now';
    return true;
}

function archiveFilterCollator()
{
    return new Intl.Collator(
        state.language === 'ru'
            ? 'ru'
            : 'en',
        {
            sensitivity:
            'base'
        }
    );
}

function archivePersonFilterOptions()
{
    const files =
        archiveProjectFiles();

    const counts =
        new Map();

    files.forEach(file =>
    {
        archiveFilePersonIds(
            file
        ).forEach(personId =>
        {
            counts.set(
                personId,
                (
                    counts.get(personId)
              || 0
                ) + 1
            );
        });
    });

    return getPeople(
        currentProjectId()
    )
        .filter(person =>
            counts.has(person.id)
        )
        .map(person => ({
            value:
            person.id,

            label:
            personResourceDisplayName(
                person
            ),

            count:
            counts.get(person.id)
            || 0
        }))
        .sort(
            (left, right) =>
                archiveFilterCollator()
                    .compare(
                        left.label,
                        right.label
                    )
        );
}

function archivePlaceFilterOptions()
{
    const files =
        archiveProjectFiles();

    const counts =
        new Map();

    files.forEach(file =>
    {
        archiveFilePlaceIds(
            file
        ).forEach(placeId =>
        {
            counts.set(
                placeId,
                (
                    counts.get(placeId)
              || 0
                ) + 1
            );
        });
    });

    return [
        ...counts.entries()
    ]
        .map(([
            placeId,
            count
        ]) =>
        {
            const place =
                getPlace(placeId);

            return {
                value:
              placeId,

                label:
              getPlaceDisplay(
                  placeId
              )
              || place?.name
              || placeId,

                /*
            * Alternative names improve searching,
            * but are not displayed or localized.
            */
                keywords:
              place?.alternativeNames
              || [],

                count
            };
        })
        .sort(
            (left, right) =>
                archiveFilterCollator()
                    .compare(
                        left.label,
                        right.label
                    )
        );
}

const archiveFileFilterSchema =
    Object.freeze([
        Object.freeze({
            key:
            'scope',

            label:
            'Location',

            control:
            'select',

            defaultValue:
            'all',

            options:
            Object.freeze([
                Object.freeze({
                    value:
                  'all',

                    label:
                  'All Archive'
                }),

                Object.freeze({
                    value:
                  'folder',

                    label:
                  'Current folder and subfolders'
                })
            ])
        }),

        Object.freeze({
            key:
            'fileType',

            label:
            'File type',

            control:
            'select',

            defaultValue:
            'all',

            options:
            Object.freeze([
                Object.freeze({
                    value:
                  'all',

                    label:
                  'All types'
                }),

                Object.freeze({
                    value:
                  'pdf',

                    label:
                  'PDF'
                }),

                Object.freeze({
                    value:
                  'img',

                    label:
                  'Images'
                }),

                Object.freeze({
                    value:
                  'doc',

                    label:
                  'Documents'
                }),

                Object.freeze({
                    value:
                  'sheet',

                    label:
                  'Spreadsheets'
                }),

                Object.freeze({
                    value:
                  'audio',

                    label:
                  'Audio'
                }),

                Object.freeze({
                    value:
                  'archive',

                    label:
                  'Archive files'
                })
            ])
        }),

        Object.freeze({
            key:
            'connections',

            label:
            'Connections',

            control:
            'select',

            defaultValue:
            'all',

            options:
            Object.freeze([
                Object.freeze({
                    value:
                  'all',

                    label:
                  'All files'
                }),

                Object.freeze({
                    value:
                  'linked',

                    label:
                  'Linked files'
                }),

                Object.freeze({
                    value:
                  'unlinked',

                    label:
                  'Unlinked files'
                })
            ])
        }),

        Object.freeze({
            key:
            'favouriteOnly',

            label:
            'Favourites',

            control:
            'boolean',

            defaultValue:
            false,

            checkboxLabel:
            'Favourites only'
        }),

        Object.freeze({
            key:
            'personIds',

            label:
            'People',

            control:
            'combobox',

            multiple:
            true,

            layout:
            'full',

            placeholder:
            'Search people',

            defaultValue:
            Object.freeze([]),

            getOptions:
            archivePersonFilterOptions
        }),

        Object.freeze({
            key:
            'placeIds',

            label:
            'Places',

            control:
            'combobox',

            multiple:
            true,

            layout:
            'full',

            placeholder:
            'Search places',

            defaultValue:
            Object.freeze([]),

            getOptions:
            archivePlaceFilterOptions
        }),

        Object.freeze({
            key:
            'documentYears',

            label:
            'Document date',

            control:
            'year-range',

            layout:
            'full',

            defaultValue:
            Object.freeze({
                mode:
                '',

                from:
                '',

                to:
                ''
            })
        }),
        Object.freeze({
            key: 'sourceId',
            label: 'Source',
            control: 'combobox',
            multiple: false,
            layout: 'full',
            placeholder: 'Search sources...',
            defaultValue: '',
            getOptions: connectedSourceFilterOptions
        }),
    ]);

const archiveSourceFilterSchema =
    Object.freeze([
        Object.freeze({
            key:
            'sourceCategory',

            label:
            'Source category',

            control:
            'select',

            defaultValue:
            'all',

            getOptions:
            () => [
                {
                    value:
                  'all',

                    label:
                  'All source categories'
                },

                ...SOURCE_CATEGORIES.map(
                    category => ({
                        value:
                    category.value,

                        label:
                    category.label
                    })
                ),
                {
                    value: 'uncategorized',
                    label: 'Not categorized'
                }
            ]
        }),
        Object.freeze({
            key:
            'sourceConnections',

            label:
            'Connection status',

            control:
            'select',

            defaultValue:
            'all',

            options:
            Object.freeze([
                Object.freeze({
                    value:
                  'all',

                    label:
                  'Any connection status'
                }),

                Object.freeze({
                    value:
                  'linked',

                    label:
                  'With connections'
                }),

                Object.freeze({
                    value:
                  'unlinked',

                    label:
                  'Without connections'
                })
            ])
        }),
        Object.freeze({
            key:
            'sourceFavouriteOnly',

            label:
            'Favourites',

            control:
            'boolean',

            defaultValue:
            false,

            checkboxLabel:
            'Favourite sources only'
        })
    ]);

function archiveFileFiltersWithDefaults(
    filters =
        state.archiveFileFilters
)
{
    return cloneSharedFilterValues(
        archiveFileFilterSchema,
        {
            ...defaultArchiveFileFilters,
            ...(filters || {})
        }
    );
}

function archiveEffectiveFileFilters()
{
    const filters =
        archiveFileFiltersWithDefaults();

    /*
      * The Favourites sidebar item is a shortcut
      * into the same predicate, not a second
      * filtering implementation.
      */
    if (
        state.archiveView
          === 'favorites'
    )
    {
        filters.favouriteOnly =
            true;
    }

    return filters;
}

function archiveFileFilteringActive(
    filters =
        archiveEffectiveFileFilters()
)
{
    const structuredFilterActive =
        archiveFileFilterSchema
            .filter(definition =>
                definition.key !== 'scope'
            )
            .some(definition =>
                sharedFilterValueIsActive(
                    definition,
                    filters[
                        definition.key
                    ]
                )
            );

    return Boolean(
        String(
            state.archiveSearch || ''
        ).trim()
        || structuredFilterActive
    );
}

function archiveFileFilterCount()
{
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
        .length;
}

const ARCHIVE_NAVIGATION_HISTORY_LIMIT =
    50;

function archiveIsLocationView(
    view
)
{
    return (
        view === 'files'
        || view === 'favorites'
    );
}

function archiveNormalizeLocationSnapshot(
    snapshot = {}
)
{
    const view =
        snapshot.view === 'favorites'
            ? 'favorites'
            : 'files';

    const selectedFile =
        archiveFileById(
            snapshot.selectedFileId
        );

    const fileFilters =
        archiveFileFiltersWithDefaults(
            snapshot.fileFilters
        );

    if (view === 'favorites')
    {
        fileFilters.favouriteOnly =
            true;
    }

    return {
        view,

        folderId:
          archiveNormalizeFolderId(
              snapshot.folderId
          ),

        search:
          String(
              snapshot.search || ''
          ),

        fileFilters,

        filterPresentation:
          snapshot.filterPresentation
            === 'folders'
              ? 'folders'
              : 'flat',

        filterScopeFolderId:
          archiveNormalizeFolderId(
              snapshot.filterScopeFolderId
          ),

        selectedFileId:
          selectedFile?.id
          || null,

        inspectorCollapsed:
          Boolean(
              snapshot.inspectorCollapsed
          ),
        fileLayout: ['details', 'tiles', 'images'].includes(snapshot.fileLayout) ? snapshot.fileLayout : 'details'
    };
}

function archiveCurrentLocationSnapshot()
{
    return archiveNormalizeLocationSnapshot({
        fileLayout: state.archiveFileLayout,
        view:
          state.archiveView,

        folderId:
          state.archiveSelectedFolderId,

        search:
          state.archiveSearch,

        fileFilters:
          state.archiveFileFilters,

        filterPresentation:
          state.archiveFilterPresentation,

        filterScopeFolderId:
          state.archiveFilterScopeFolderId,

        selectedFileId:
          state.archiveSelectedFileId,

        inspectorCollapsed:
          state.archiveInspectorCollapsed
    });
}

function archiveLocationSnapshotKey(
    snapshot
)
{
    const normalized =
        archiveNormalizeLocationSnapshot(
            snapshot
        );

    return JSON.stringify([
        normalized.view,
        normalized.folderId,
        normalized.search,
        normalized.fileFilters,
        normalized.filterPresentation,
        normalized.filterScopeFolderId,
        normalized.selectedFileId,
        normalized.inspectorCollapsed
    ]);
}

function archivePushHistoryEntry(
    stack,
    snapshot
)
{
    const normalized =
        archiveNormalizeLocationSnapshot(
            snapshot
        );

    const previous =
        stack[
            stack.length - 1
        ];

    if (
        previous
        && archiveLocationSnapshotKey(
            previous
        )
          === archiveLocationSnapshotKey(
              normalized
          )
    )
    {
        return;
    }

    stack.push(
        normalized
    );

    if (
        stack.length
          > ARCHIVE_NAVIGATION_HISTORY_LIMIT
    )
    {
        stack.splice(
            0,
            stack.length
            - ARCHIVE_NAVIGATION_HISTORY_LIMIT
        );
    }
}

function archiveRememberCurrentLocation()
{
    if (
        !archiveIsLocationView(
            state.archiveView
        )
    )
    {
        return;
    }

    archivePushHistoryEntry(
        state.archiveNavigationBackStack,
        archiveCurrentLocationSnapshot()
    );
}

function archiveApplyLocationSnapshot(
    snapshot
)
{
    const normalized =
        archiveNormalizeLocationSnapshot(
            snapshot
        );

    state.archiveView =
        normalized.view;

    state.archiveSelectedFolderId =
        normalized.folderId;

    state.archiveSearch =
        normalized.search;

    state.archiveFileFilters =
        archiveFileFiltersWithDefaults(
            normalized.fileFilters
        );

    state.archiveFilterPresentation =
        normalized.filterPresentation;

    state.archiveFilterScopeFolderId =
        normalized.filterScopeFolderId;

    state.archiveSelectedFileId =
        normalized.selectedFileId;

    state.archiveSelectedFolderItemId =
        null;

    state.archiveSelectedFileIds =
        [];

    state.archiveSelectedFolderIds =
        [];

    state.archiveInspectorCollapsed =
        normalized.inspectorCollapsed;
    state.archiveFileLayout = normalized.fileLayout;
}

function archivePrepareTreeForLocation(
    folderId,
    {
        expandCurrent =
            false
    } = {}
)
{
    const normalizedFolderId =
        archiveNormalizeFolderId(
            folderId
        );

    if (!normalizedFolderId)
    {
        state.archivePendingTreeRevealId =
            null;

        return;
    }

    const path =
        archiveFolderAncestors(
            normalizedFolderId
        );

    const foldersToExpand =
        expandCurrent
            ? path
            : path.slice(
                0,
                -1
            );

    foldersToExpand.forEach(
        folder =>
        {
            state
                .archiveExpandedFolders[
                    folder.id
                ] = true;
        }
    );

    state.archivePendingTreeRevealId =
        normalizedFolderId;
}

function archiveNavigateToLocationCommit(
    location = {},
    {
        recordHistory =
            true,

        clearForward =
            true,

        expandCurrent =
            false,

        renderMode =
            'archive'
    } = {}
)
{
    const currentIsLocation =
        archiveIsLocationView(
            state.archiveView
        );

    const current =
        archiveCurrentLocationSnapshot();

    const base =
        currentIsLocation
            ? current
            : archiveNormalizeLocationSnapshot({
                fileLayout: state.archiveFileLayout,
                view:
                location.view
                || 'files',

                folderId:
                null,

                search:
                '',

                fileFilters:
                archiveFileFiltersWithDefaults(
                    state.archiveFileFilters
                ),

                filterPresentation:
                state.archiveFilterPresentation,

                filterScopeFolderId:
                state.archiveFilterScopeFolderId,

                selectedFileId:
                null,

                inspectorCollapsed:
                false
            });

    const target =
        archiveNormalizeLocationSnapshot({
            ...base,
            ...location
        });
    if (target.fileLayout === 'images' && target.selectedFileId
        && archiveFileKind(archiveFileById(target.selectedFileId)) !== 'img')
        target.fileLayout = 'details';

    const changed =
        !currentIsLocation
        || archiveLocationSnapshotKey(
            current
        )
          !== archiveLocationSnapshotKey(
              target
          );

    if (
        recordHistory
        && currentIsLocation
        && changed
    )
    {
        archivePushHistoryEntry(
            state.archiveNavigationBackStack,
            current
        );
    }

    if (
        clearForward
        && changed
    )
    {
        state.archiveNavigationForwardStack =
            [];
    }

    archiveApplyLocationSnapshot(
        target
    );

    archivePrepareTreeForLocation(
        target.folderId,
        {
            expandCurrent
        }
    );

    ensureArchiveSelection();

    if (
        renderMode === 'app'
    )
    {
        render();
    }
    else
    {
        renderArchive();
    }
}

function archiveNavigationCanGoBack()
{
    return Boolean(
        state
            .archiveNavigationBackStack
            .length
    );
}

function archiveNavigationCanGoForward()
{
    return Boolean(
        state
            .archiveNavigationForwardStack
            .length
    );
}

function archiveNavigationCanGoUp()
{
    return Boolean(
        archiveFolderById(
            state.archiveSelectedFolderId
        )
    );
}

function archiveNavigateBackCommit()
{
    const target =
        state
            .archiveNavigationBackStack
            .pop();

    if (!target)
    {
        return;
    }

    if (
        archiveIsLocationView(
            state.archiveView
        )
    )
    {
        archivePushHistoryEntry(
            state.archiveNavigationForwardStack,
            archiveCurrentLocationSnapshot()
        );
    }

    archiveApplyLocationSnapshot(
        target
    );

    archivePrepareTreeForLocation(
        target.folderId
    );

    ensureArchiveSelection();
    renderArchive();
}

function archiveNavigateForwardCommit()
{
    const target =
        state
            .archiveNavigationForwardStack
            .pop();

    if (!target)
    {
        return;
    }

    if (
        archiveIsLocationView(
            state.archiveView
        )
    )
    {
        archivePushHistoryEntry(
            state.archiveNavigationBackStack,
            archiveCurrentLocationSnapshot()
        );
    }

    archiveApplyLocationSnapshot(
        target
    );

    archivePrepareTreeForLocation(
        target.folderId
    );

    ensureArchiveSelection();
    renderArchive();
}

function archiveNavigateUpCommit()
{
    const currentFolder =
        archiveFolderById(
            state.archiveSelectedFolderId
        );

    if (!currentFolder)
    {
        return;
    }

    const scopeRoot =
        archiveFileFilteringActive()
        && archiveEffectiveFileFilters()
            .scope === 'folder'
            ? archiveNormalizeFolderId(
                state.archiveFilterScopeFolderId
            )
            : null;

    if (
        scopeRoot
        && currentFolder.id === scopeRoot
    )
    {
        return;
    }

    archiveNavigateToLocationCommit({
        folderId:
          archiveFolderParentId(
              currentFolder
          ),

        selectedFileId:
          null,

        inspectorCollapsed:
          false
    });
}
/*
      Public navigation functions always protect
      an active file-edit draft.
    */

function archiveNavigateToLocation(
    location = {},
    options = {}
)
{
    runAfterArchiveFileEditGuard(
        () =>
        {
            archiveNavigateToLocationCommit(
                location,
                options
            );
        }
    );
}

function archiveNavigateBack()
{
    runAfterArchiveFileEditGuard(
        archiveNavigateBackCommit
    );
}

function archiveNavigateForward()
{
    runAfterArchiveFileEditGuard(
        archiveNavigateForwardCommit
    );
}

function archiveNavigateUp()
{
    runAfterArchiveFileEditGuard(
        archiveNavigateUpCommit
    );
}

function selectArchiveFolderItem(
    folderId
)
{
    const folder =
        archiveFolderById(
            folderId
        );

    if (!folder)
    {
        return;
    }

    runAfterArchiveFileEditGuard(
        () =>
        {
            state.archiveSelectedFolderItemId =
                folder.id;

            /*
            File and folder detail selection are
            mutually exclusive.
          */
            state.archiveSelectedFileId =
                null;

            state.archiveInspectorCollapsed =
                false;

            renderArchiveMain();
        }
    );
}

function archiveOpenFolder(
    folderId
)
{
    const folder =
        archiveFolderById(
            folderId
        );

    if (!folder)
    {
        return;
    }

    archiveNavigateToLocation(
        {
            view: 'files',

            folderId:
            folder.id,

            fileFilters: state.archiveView === 'favorites'
                ? { ...archiveFileFiltersWithDefaults(), favouriteOnly: false }
                : archiveFileFiltersWithDefaults(),

            filterPresentation: 'folders',

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

function archivePruneNavigationHistory()
{
    const cleanStack =
        stack =>
        {
            const result = [];

            stack.forEach(
                snapshot =>
                {
                    const folderValid =
                        archiveIsRootLocation(
                            snapshot.folderId
                        )
                || Boolean(
                    archiveFolderById(
                        snapshot.folderId
                    )
                );

                    if (!folderValid)
                    {
                        return;
                    }

                    const normalized =
                        archiveNormalizeLocationSnapshot(
                            snapshot
                        );

                    const previous =
                        result[
                            result.length - 1
                        ];

                    if (
                        previous
                && archiveLocationSnapshotKey(
                    previous
                )
                  === archiveLocationSnapshotKey(
                      normalized
                  )
                    )
                    {
                        return;
                    }

                    result.push(
                        normalized
                    );
                }
            );

            return result.slice(
                -ARCHIVE_NAVIGATION_HISTORY_LIMIT
            );
        };

    state.archiveNavigationBackStack =
        cleanStack(
            state.archiveNavigationBackStack
          || []
        );

    state.archiveNavigationForwardStack =
        cleanStack(
            state.archiveNavigationForwardStack
          || []
        );
}

function openArchiveLocation(
    location,
    {
        recordHistory =
            true,

        expandCurrent =
            false
    } = {}
)
{
    state.activeModule =
        'Archive';

    archiveNavigateToLocation(
        location,
        {
            recordHistory,
            expandCurrent,
            renderMode:
            'app'
        }
    );
}

function archiveProjectFiles()
{
    const projectId = currentProjectId();
    return projectId
        ? (sampleData.archiveFiles || []).filter(file => file.projectId === projectId)
        : [];
}

function archiveProjectSources()
{
    const projectId = currentProjectId();
    return projectId
        ? (sampleData.sources || []).filter(source => source.projectId === projectId)
        : [];
}

function archiveFileKind(file)
{
    const value = String(file?.kind || file?.type || '').toLowerCase();
    if (value.includes('folder')) return 'folder';
    if (value.includes('pdf')) return 'pdf';
    if (value.includes('image') || value.includes('img') || /\.(jpg|jpeg|png|tif|tiff|webp)$/i.test(file?.name || '')) return 'img';
    if (value.includes('audio') || /\.(mp3|wav|m4a)$/i.test(file?.name || '')) return 'audio';
    if (value.includes('spreadsheet') || /\.(xlsx|xls|csv)$/i.test(file?.name || '')) return 'sheet';
    if (value.includes('document') || /\.(docx|doc|rtf|txt)$/i.test(file?.name || '')) return 'doc';
    if (/\.(zip|7z|rar)$/i.test(file?.name || '')) return 'archive';
    return 'file';
}

function archiveFileTypeLabel(file)
{
    const kind = archiveFileKind(file);
    return ({
        folder: 'Folder',
        pdf: 'PDF document',
        img: 'Image',
        audio: 'Audio',
        sheet: 'Spreadsheet',
        doc: 'Document',
        archive: 'Archive file',
        file: file?.type || 'File'
    })[kind];
}

function archiveFileIcon(file)
{
    const kind = archiveFileKind(file);
    if (kind === 'folder') return `<span class="archive-file-icon folder" aria-hidden="true">${icon.folderyellow}</span>`;
    const label = ({ pdf: 'PDF', img: 'IMG', audio: 'AUD', sheet: 'XLS', doc: 'DOC', archive: 'ZIP', file: 'FILE' })[kind];
    return `<span class="archive-file-icon ${kind}" aria-hidden="true">${escapeHtml(label)}</span>`;
}

function connectedFileMeta(
    file
)
{
    if (!file)
    {
        return 'Archive file';
    }

    return [
        archiveFileTypeLabel(
            file
        ),

        String(
            file.size || ''
        ).trim()
    ]
        .filter(Boolean)
        .join(' · ')
        || 'Archive file';
}

function connectedFileContextConfig(
    contextType
)
{
    return {
        person: {
            noun:
            'person',

            record:
            contextId =>
                getPerson(
                    contextId
                ),

            label:
            record =>
                record?.names?.display
              || record?.name
              || 'this person',

            isLinked:
            (
                file,
                contextId
            ) =>
                archiveConnectionIds(
                    'file',
                    file.id,
                    'person'
                ).includes(
                    contextId
                ),

            unlink:
            (
                file,
                contextId
            ) =>
                archiveSetConnection(
                    'file',
                    file.id,
                    'person',
                    contextId,
                    false
                )
        },

        note: {
            noun:
            'note',

            record:
            contextId =>
                getNote(
                    contextId,
                    {
                        includeArchived:
                    true
                    }
                ),

            label:
            record =>
                record?.title
              || 'Untitled note',

            isLinked:
            (
                file,
                contextId
            ) =>
                archiveConnectionIds(
                    'file',
                    file.id,
                    'note'
                ).includes(
                    contextId
                ),

            unlink:
            (
                file,
                contextId
            ) =>
                archiveSetConnection(
                    'file',
                    file.id,
                    'note',
                    contextId,
                    false
                )
        },

        place: {
            noun:
            'place',

            record:
            contextId =>
                getPlace(
                    contextId
                ),

            label:
            record =>
                record?.name
              || 'this place',

            isLinked:
            (
                file,
                contextId
            ) =>
                archiveConnectionIds(
                    'file',
                    file.id,
                    'place'
                ).includes(
                    contextId
                ),

            unlink:
            (
                file,
                contextId
            ) =>
                archiveSetConnection(
                    'file',
                    file.id,
                    'place',
                    contextId,
                    false
                )
        },

        source: {
            noun:
            'source',

            record:
            contextId =>
                archiveSourceById(
                    contextId
                ),

            label:
            record =>
                record?.title
              || 'Untitled source',

            isLinked:
            (
                file,
                contextId
            ) =>
                archiveConnectionIds(
                    'source',
                    contextId,
                    'file'
                ).includes(
                    file.id
                ),

            unlink:
            (
                file,
                contextId
            ) =>
                archiveSetConnection(
                    'source',
                    contextId,
                    'file',
                    file.id,
                    false
                )
        }
    }[
        contextType
    ] || null;
}

function renderConnectedFileItem({
    file,

    contextType =
        '',

    contextId =
        '',

    allowUnlink =
        true
} = {})
{
    if (!file)
    {
        return '';
    }

    const title =
        file.name
        || file.title
        || 'Untitled file';

    const meta =
        connectedFileMeta(
            file
        );

    const contextConfig =
        connectedFileContextConfig(
            contextType
        );

    const unlinkSupported =
        Boolean(
            allowUnlink
          && contextId
          && contextConfig
        );

    return `
        <div
          class="
            connected-file-item

            ${
                unlinkSupported
                    ? 'can-unlink'
                    : ''
            }
          ">

          <button
            class="
              connected-file-main
            "
            type="button"
            data-connected-file-id="${escapeHtml(
                file.id
            )}"
            aria-label="Open ${escapeHtml(
                title
            )} in Archive">

            ${archiveFileIcon(
                file
            )}

            <span
              class="
                connected-file-copy
              ">

              <strong
                class="
                  connected-file-title
                "
                title="${escapeHtml(
                    title
                )}">

                ${escapeHtml(
                    title
                )}
              </strong>

              <span
                class="
                  connected-file-meta
                "
                title="${escapeHtml(
                    meta
                )}">

                ${escapeHtml(
                    meta
                )}
              </span>
            </span>
          </button>

          ${
                unlinkSupported
                    ? `
                <button
                  class="
                    connected-file-unlink
                  "
                  type="button"
                  data-connected-file-unlink="${escapeHtml(
                        file.id
                    )}"
                  data-connected-file-context-type="${escapeHtml(
                        contextType
                    )}"
                  data-connected-file-context-id="${escapeHtml(
                        contextId
                    )}"
                  aria-label="Unlink ${escapeHtml(
                        title
                    )} from this ${escapeHtml(
                        contextConfig.noun
                    )}"
                  title="Unlink file">

                  ${icon.unlink}
                </button>
              `
                    : ''
            }
        </div>
      `;
}

function renderConnectedFileList({
    files =
        [],

    limit =
        null,

    emptyText =
        'No files linked.',

    contextType =
        '',

    contextId =
        '',

    allowUnlink =
        true
} = {})
{
    const validFiles =
        (
            Array.isArray(
                files
            )
                ? files
                : []
        )
            .filter(Boolean);

    if (!validFiles.length)
    {
        return `
          <div
            class="
              connected-file-empty
            ">

            ${escapeHtml(
                emptyText
            )}
          </div>
        `;
    }

    /*
        null means "no extra limit".
        Do not convert null to Number(null) === 0.
      */
    const hasLimit =
        limit !== null
        && limit !== undefined
        && Number.isFinite(
            Number(
                limit
            )
        )
        && Number(
            limit
        ) >= 0;

    const visibleFiles =
        hasLimit
            ? validFiles.slice(
                0,
                Number(
                    limit
                )
            )
            : validFiles;

    return `
        <div
          class="
            connected-file-list
          ">

          ${visibleFiles
                .map(file =>
                    renderConnectedFileItem({
                        file,

                        contextType,

                        contextId,

                        allowUnlink
                    })
                )
                .join('')}
        </div>
      `;
}

function connectedFileRelationshipExists({
    fileId,
    contextType,
    contextId
})
{
    const file =
        archiveFileById(
            fileId
        );

    const config =
        connectedFileContextConfig(
            contextType
        );

    if (
        !file
        || !config
        || !contextId
    )
    {
        return false;
    }

    return Boolean(
        config.isLinked(
            file,
            contextId
        )
    );
}

function unlinkConnectedFileRelationship({
    fileId,
    contextType,
    contextId
})
{
    const file =
        archiveFileById(
            fileId
        );

    const config =
        connectedFileContextConfig(
            contextType
        );

    if (
        !file
        || !config
        || !contextId
    )
    {
        return false;
    }

    if (
        !config.isLinked(
            file,
            contextId
        )
    )
    {
        return false;
    }

    return Boolean(
        config.unlink(
            file,
            contextId
        )
    );
}

function openConnectedFileUnlinkConfirm({
    fileId,
    contextType,
    contextId,
    onUnlinked =
        null
} = {})
{
    const file =
        archiveFileById(
            fileId
        );

    const config =
        connectedFileContextConfig(
            contextType
        );

    if (
        !file
        || !config
        || !contextId
    )
    {
        return;
    }

    if (
        !connectedFileRelationshipExists({
            fileId,
            contextType,
            contextId
        })
    )
    {
        showToast(
            'This file is no longer linked.'
        );

        return;
    }

    const contextRecord =
        config.record(
            contextId
        );

    if (!contextRecord)
    {
        showToast(
            'Linked record not found.'
        );

        return;
    }

    const fileName =
        file.name
        || file.title
        || 'Untitled file';

    const contextName =
        config.label(
            contextRecord
        );

    openModal(`
        <div
          class="
            modal
            connected-file-unlink-modal
          "
          role="dialog"
          aria-modal="true"
          aria-labelledby="connectedFileUnlinkTitle">

          <div class="modal-header">
            <div>
              <h2
                id="connectedFileUnlinkTitle">

                Unlink file from
                ${escapeHtml(
                    config.noun
                )}?
              </h2>

              <p>
                ${escapeHtml(
                    fileName
                )}
              </p>
            </div>

            <button
              class="
                close-button
              "
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
                connected-file-unlink-warning
              ">

              <strong>
                The file will not be deleted.
              </strong>

              <span>
                Only the connection between
                “${escapeHtml(
                    fileName
                )}” and
                “${escapeHtml(
                    contextName
                )}” will be removed.
                The file will remain available
                in Archive and keep all its
                other connections.
              </span>
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
                danger
              "
              type="button"
              data-confirm-connected-file-unlink>

              Unlink file
            </button>
          </div>
        </div>
      `);

    modalBackdrop
        .querySelector(
            '[data-confirm-connected-file-unlink]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                const unlinked =
                    unlinkConnectedFileRelationship({
                        fileId:
                  file.id,

                        contextType,

                        contextId
                    });

                /*
              Match the Connected Note flow:
              close before rerendering the source
              inspector.
            */
                closeModal();

                if (!unlinked)
                {
                    showToast(
                        'The file could not be unlinked.'
                    );

                    return;
                }

                if (
                    typeof onUnlinked
              === 'function'
                )
                {
                    onUnlinked({
                        fileId:
                  file.id,

                        contextType,

                        contextId
                    });
                }
                else
                {
                    render();
                }

                showToast(
                    `File unlinked from ${
                        config.noun
                    }.`
                );
            }
        );
}

function bindConnectedFileLinks(
    root,
    {
        onUnlinked =
            null
    } = {}
)
{
    if (!root)
    {
        return;
    }

    root
        .querySelectorAll(
            '[data-connected-file-id]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    openFamilyArchiveItem(
                        button.dataset
                            .connectedFileId
                    );
                }
            );
        });

    root
        .querySelectorAll(
            '[data-connected-file-unlink]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                event =>
                {
                    event.preventDefault();
                    event.stopPropagation();

                    openConnectedFileUnlinkConfirm({
                        fileId:
                  button.dataset
                      .connectedFileUnlink,

                        contextType:
                  button.dataset
                      .connectedFileContextType
                  || '',

                        contextId:
                  button.dataset
                      .connectedFileContextId
                  || '',

                        onUnlinked
                    });
                }
            );
        });
}

