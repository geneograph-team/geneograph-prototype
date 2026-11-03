function archiveInspectorSectionIsOpen(
    sectionId
)
{
    return state
        .archiveInspectorSections[
            sectionId
        ] !== false;
}

function renderArchiveFileSection(
    sectionId,
    title,
    content,
    actionHtml = '',
    meta = ''
)
{
    return renderInspectorSection(
        sectionId,
        title,
        meta,
        content,
        actionHtml,
        {
            inlineAction:
            Boolean(
                actionHtml
            ),

            alwaysShowAction:
            true,

            open:
            archiveInspectorSectionIsOpen(
                sectionId
            ),

            toggleAttribute:
            'data-archive-section-toggle',

            sectionId:
            `archive-file-section-${sectionId}`
        }
    );
}

function renderArchiveFileSectionAction(
    entityType,
    label,
    locked
)
{
    if (locked)
    {
        return '';
    }

    const attribute =
        {
            person:
            'data-archive-add-file-person',

            event:
            'data-archive-add-file-event',

            note:
            'data-archive-add-file-note',

            source:
            'data-archive-add-file-source'
        }[entityType];

    if (!attribute)
    {
        return '';
    }

    return `
        <button
          class="panel-action"
          type="button"
          ${attribute}>

          ${renderPanelButtonLabel(
                icon.plus,
                label
            )}
        </button>
      `;
}

function archiveSearchText(file)
{
    const people =
        archiveFilePersonIds(file)
            .map(id =>
                getPerson(id)
                    ?.names?.display
            || ''
            )
            .join(' ');

    const events =
        (
            file.linkedEventIds
          || []
        )
            .map(id =>
                archiveEventLabel(
                    archiveConnectionRecord(
                        'event',
                        id
                    )
                )
            )
            .join(' ');

    const notes =
        archiveNoteIdsForFile(file)
            .map(id =>
                archiveConnectionRecord(
                    'note',
                    id
                )?.title
            || ''
            )
            .join(' ');

    const places =
        archiveFilePlaceIds(file)
            .map(id =>
                getPlace(id)?.name
            || ''
            )
            .join(' ');

    const sources =
        sourceIdsForTarget(
            'file',
            file.id,
            file.projectId
        )
            .map(sourceId =>
                archiveSourceById(
                    sourceId,
                    file.projectId
                )?.title
            || ''
            )
            .join(' ');

    return [
        file.name,
        file.description,
        archiveFolderPath(
            file.folderId
        ),
        people,
        events,
        notes,
        places,
        sources
    ]
        .join(' ')
        .toLocaleLowerCase(
            state.language === 'ru'
                ? 'ru'
                : 'en'
        );
}

function archiveFileHasLinks(
    file
)
{
    if (!file)
    {
        return false;
    }

    return Boolean(
        archiveFilePersonIds(
            file
        ).length

        || (
            file.linkedEventIds
          || []
        ).length

        || archiveNoteIdsForFile(
            file
        ).length

        || archiveFilePlaceIds(
            file
        ).length

        || sourceIdsForTarget(
            'file',
            file.id,
            file.projectId
        ).length
    );
}

function archiveDocumentYearInterval(
    file
)
{
    const model =
        archiveDocumentDateModel(
            file
        );

    const text = [
        model.date,
        model.dateLabel,
        model.originalText,
        model.date2,
        model.date2Label
    ]
        .filter(Boolean)
        .join(' ');

    const years =
        (
            text.match(
                /\b\d{4}\b/g
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

    const type =
        String(
            model.dateType || ''
        )
            .trim()
            .toLowerCase();

    const firstYear =
        years[0];

    if (type === 'before')
    {
        return {
            from:
            1,

            to:
            Math.max(
                1,
                firstYear - 1
            )
        };
    }

    if (type === 'after')
    {
        return {
            from:
            Math.min(
                9999,
                firstYear + 1
            ),

            to:
            9999
        };
    }

    if (
        type === 'between'
        && years.length >= 2
    )
    {
        return {
            from:
            Math.min(
                years[0],
                years[1]
            ),

            to:
            Math.max(
                years[0],
                years[1]
            )
        };
    }

    return {
        from:
          firstYear,

        to:
          firstYear
    };
}

function archiveDocumentYearMatches(
    file,
    value
)
{
    const range =
        normalizeSharedFilterYearRange(
            value
        );

    if (!range.mode)
    {
        return true;
    }

    if (
        sharedFilterYearRangeError(
            range
        )
    )
    {
        return false;
    }

    const fileInterval =
        archiveDocumentYearInterval(
            file
        );

    if (!fileInterval)
    {
        return false;
    }

    const fromYear =
        sharedFilterYearNumber(
            range.from
        );

    let filterFrom = 1;
    let filterTo = 9999;

    if (range.mode === 'before')
    {
        filterTo =
            Math.max(
                1,
                fromYear - 1
            );
    }

    if (range.mode === 'after')
    {
        filterFrom =
            Math.min(
                9999,
                fromYear + 1
            );
    }

    if (range.mode === 'between')
    {
        filterFrom =
            fromYear;

        filterTo =
            sharedFilterYearNumber(
                range.to
            );
    }

    /*
      * Historical date ranges match when they
      * overlap the requested period.
      */
    return (
        fileInterval.from
          <= filterTo

        && fileInterval.to
          >= filterFrom
    );
}

function archiveFileMatchesFilters(
    file,
    filters,
    query
)
{
    if (
        filters.sourceId
        && !archiveFilesForSource(filters.sourceId)
            .some(linkedFile => linkedFile.id === file.id)
    )
    {
        return false;
    }
    if (
        query
        && !archiveSearchText(
            file
        ).includes(query)
    )
    {
        return false;
    }

    if (
        filters.fileType !== 'all'
        && archiveFileKind(file)
          !== filters.fileType
    )
    {
        return false;
    }

    if (
        filters.connections === 'linked'
        && !archiveFileHasLinks(file)
    )
    {
        return false;
    }

    if (
        filters.connections === 'unlinked'
        && archiveFileHasLinks(file)
    )
    {
        return false;
    }

    if (
        filters.favouriteOnly
        && !file.favorite
    )
    {
        return false;
    }

    if (
        filters.personIds.length
        && !archiveFilePersonIds(file)
            .some(personId =>
                filters.personIds.includes(
                    personId
                )
            )
    )
    {
        return false;
    }

    if (
        filters.placeIds.length
        && !archiveFilePlaceIds(file)
            .some(placeId =>
                filters.placeIds.includes(
                    placeId
                )
            )
    )
    {
        return false;
    }

    if (
        !archiveDocumentYearMatches(
            file,
            filters.documentYears
        )
    )
    {
        return false;
    }

    return true;
}

function archiveSortFilteredFiles(
    files
)
{
    return appSortRecords(files, {
        field:
          state.archiveFileSort,

        direction:
          state.archiveFileSortDirection,

        extractors: {
            name: {
                type:
              'text',

                get:
              file => file.name
            },

            updated: {
                type:
              'number',

                get:
              file =>
                  appSortTimestamp(
                      file.updatedAt
                  )
            },

            added: {
                type:
              'number',

                get:
              file =>
                  appSortTimestamp(
                      file.addedAt
                  )
            },

            type: {
                type:
              'text',

                get:
              archiveFileTypeLabel
            }
        },

        getFallback:
          file => file.name
    });
}

function archiveMatchingFiles()
{
    const filters =
        archiveEffectiveFileFilters();

    const query =
        String(
            state.archiveSearch || ''
        )
            .trim()
            .toLocaleLowerCase(
                state.language === 'ru'
                    ? 'ru'
                    : 'en'
            );

    /*
      * Without a filter, Archive remains ordinary
      * direct-folder browsing.
      */
    if (
        !archiveFileFilteringActive(
            filters
        )
    )
    {
        return archiveSortFilteredFiles(
            archiveProjectFiles()
                .filter(file =>
                    archiveFileFolderId(
                        file
                    ) ===
              archiveNormalizeFolderId(
                  state.archiveSelectedFolderId
              )
                )
        );
    }

    let files =
        archiveProjectFiles();

    if (filters.scope === 'folder')
    {
        const scopeRoot =
            archiveNormalizeFolderId(
                state.archiveFilterScopeFolderId
            );

        const scopeIds =
            archiveFolderScopeIds(
                scopeRoot
            );

        files =
            files.filter(file =>
                scopeIds.has(
                    archiveFileFolderId(
                        file
                    )
                )
            );
    }

    return archiveSortFilteredFiles(
        files.filter(file =>
            archiveFileMatchesFilters(
                file,
                filters,
                query
            )
        )
    );
}

function archiveFolderMatchProjection(
    matchingFiles =
        archiveMatchingFiles()
)
{
    const visibleFolderIds =
        new Set();

    const matchingCountByFolder =
        new Map();

    const filters =
        archiveEffectiveFileFilters();

    const scopeRoot =
        filters.scope === 'folder'
            ? archiveNormalizeFolderId(
                state.archiveFilterScopeFolderId
            )
            : null;

    matchingFiles.forEach(file =>
    {
        let folderId =
            archiveFileFolderId(
                file
            );

        while (folderId)
        {
            visibleFolderIds.add(
                folderId
            );

            matchingCountByFolder.set(
                folderId,
                (
                    matchingCountByFolder.get(
                        folderId
                    )
              || 0
                ) + 1
            );

            if (
                scopeRoot
            && folderId === scopeRoot
            )
            {
                break;
            }

            const folder =
                archiveFolderById(
                    folderId
                );

            folderId =
                archiveFolderParentId(
                    folder
                );
        }
    });

    return {
        visibleFolderIds,
        matchingCountByFolder
    };
}

function archiveVisibleFiles(
    matchingFiles =
        archiveMatchingFiles()
)
{
    if (
        !archiveFileFilteringActive()
        || state.archiveFilterPresentation
          === 'flat'
    )
    {
        return matchingFiles;
    }

    const folderId =
        archiveNormalizeFolderId(
            state.archiveSelectedFolderId
        );

    return matchingFiles.filter(file =>
        archiveFileFolderId(
            file
        ) === folderId
    );
}

function archiveVisibleChildFolders(
    matchingFiles =
        archiveMatchingFiles()
)
{
    if (state.archiveView === 'favorites' && !state.archiveSelectedFolderId)
    {
        const query = String(state.archiveSearch || '').trim().toLocaleLowerCase();
        return (sampleData.archiveFolders || []).filter(folder =>
            folder.projectId === currentProjectId() && folder.favorite
            && (!query || folder.name.toLocaleLowerCase().includes(query)));
    }

    if (
        !archiveFileFilteringActive()
    )
    {
        return archiveFolderChildren(
            archiveNormalizeFolderId(
                state.archiveSelectedFolderId
            )
        );
    }

    if (
        state.archiveFilterPresentation
          === 'flat'
    )
    {
        return [];
    }

    const projection =
        archiveFolderMatchProjection(
            matchingFiles
        );

    return archiveFolderChildren(
        archiveNormalizeFolderId(
            state.archiveSelectedFolderId
        )
    ).filter(folder =>
        projection.visibleFolderIds.has(
            folder.id
        )
    );
}

function archiveSourceConnectedSearchText(
    source
)
{
    if (!source)
    {
        return '';
    }

    return sourceLinksForSource(
        source.id,
        '',
        source.projectId
    )
        .flatMap(link =>
        {
            const record =
                sourceTargetRecord(
                    link.targetType,
                    link.targetId,
                    link.projectId
                );

            const config =
                archiveEntityConfig(
                    link.targetType
                );

            if (!record || !config)
            {
                return [];
            }

            return [
                config.title,
                config.singular,
                config.label(
                    record
                ),
                config.meta(
                    record
                )
            ];
        })
        .filter(Boolean)
        .join(' ');
}

function archiveSourceSearchText(
    source
)
{
    return [
        source?.title,

        sourceCategoryLabel(
            source?.category,
            ''
        ),

        localizedSourceCategoryLabel(
            source?.category,
            ''
        ),

        source?.providedBy,
        source?.location,
        source?.reference,
        source?.url,
        source?.notes,

        archiveSourceConnectedSearchText(
            source
        )
    ]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase(
            state.language === 'ru'
                ? 'ru'
                : 'en'
        );
}

function archiveFilteredSources()
{
    const query =
        String(
            state.archiveSearch || ''
        )
            .trim()
            .toLocaleLowerCase(
                state.language === 'ru'
                    ? 'ru'
                    : 'en'
            );

    let sources =
        archiveProjectSources();

    const targetFilter =
        currentArchiveSourceTargetFilter();

    if (targetFilter)
    {
        const connectedSourceIds =
            new Set(
                sourceIdsForTarget(
                    targetFilter.targetType,
                    targetFilter.targetId,
                    targetFilter.projectId
                )
            );

        sources =
            sources.filter(source =>
                connectedSourceIds.has(
                    source.id
                )
            );
    }

    if (
        state.archiveSourceCategoryFilter
        && state.archiveSourceCategoryFilter
          !== 'all'
    )
    {
        sources =
            sources.filter(source =>
                source.category
              === state
                  .archiveSourceCategoryFilter
            );
    }
    if (
        state.archiveSourceConnectionFilter
          === 'linked'
    )
    {
        sources =
            sources.filter(source =>
                archiveSourceConnectionCount(
                    source
                ) > 0
            );
    }

    if (
        state.archiveSourceConnectionFilter
          === 'unlinked'
    )
    {
        sources =
            sources.filter(source =>
                archiveSourceConnectionCount(
                    source
                ) === 0
            );
    }
    if (
        state.archiveSourceFavouriteOnly
    )
    {
        sources =
            sources.filter(source =>
                source.favorite
            );
    }

    if (query)
    {
        sources =
            sources.filter(source =>
                archiveSourceSearchText(
                    source
                ).includes(
                    query
                )
            );
    }

    return appSortRecords(
        sources,
        {
            field:
            state.archiveSourceSort,

            direction:
            state.archiveSourceSortDirection,

            extractors: {
                name: {
                    type:
                'text',

                    get:
                source =>
                    source.title
                },

                updated: {
                    type:
                'number',

                    get:
                source =>
                    appSortTimestamp(
                        source.updatedAt
                    )
                },

                created: {
                    type:
                'number',

                    get:
                source =>
                    appSortTimestamp(
                        source.createdAt
                    )
                }
            },

            getFallback:
            source =>
                source.title
        }
    );
}

function ensureArchiveSelection()
{
    state.archiveSelectedFolderId =
        archiveNormalizeFolderId(
            state.archiveSelectedFolderId
        );

    state.archiveSelectedFileIds =
        archiveUniqueIds(
            state.archiveSelectedFileIds
        )
            .filter(id =>
                archiveFileById(
                    id
                )
            );

    state.archiveSelectedFolderIds = archiveUniqueIds(state.archiveSelectedFolderIds || [])
        .filter(id => archiveFolderById(id));

    if (state.archiveView === 'sources') state.archiveSelectedFolderIds = [];

    if (
        (
            state.archiveView
            === 'files'
          || state.archiveView
            === 'favorites'
        )
        && state.archiveSelectedFileId
        && !archiveFileById(
            state.archiveSelectedFileId
        )
    )
    {
        state.archiveSelectedFileId =
            null;
    }

    /*
        A selected folder item is valid only when
        it is a direct child of the current Files
        location and folders are actually visible.
      */
    const selectedFolderItem =
        archiveFolderById(
            state.archiveSelectedFolderItemId
        );

    const currentFolderId =
        archiveNormalizeFolderId(
            state.archiveSelectedFolderId
        );

    const folderItemVisible =
        state.archiveView === 'files'
        && !archiveFileFilteringActive()
        && selectedFolderItem
        && archiveFolderParentId(
            selectedFolderItem
        ) === currentFolderId;

    if (
        !folderItemVisible
        || state.archiveSelectedFileId
    )
    {
        state.archiveSelectedFolderItemId =
            null;
    }

    if (
        state.archiveView
          === 'sources'
        && state.archiveSelectedSourceId
        && !archiveSourceById(
            state.archiveSelectedSourceId
        )
    )
    {
        state.archiveSelectedSourceId =
            null;
    }

    if (
        state.archiveView
          === 'sources'
    )
    {
        state.archiveSelectedFolderItemId =
            null;
    }

    if (
        state.archiveView
          === 'sources'
        && !state.archiveSelectedSourceId
    )
    {
        state.archiveSelectedSourceId =
            archiveFilteredSources()[0]?.id
          || null;
    }
}

