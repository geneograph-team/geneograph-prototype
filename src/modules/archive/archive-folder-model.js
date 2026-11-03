const ARCHIVE_ROOT_PICKER_VALUE =
    '__archive_root__';

const ARCHIVE_ROOT_LABEL =
    'All files';

const ARCHIVE_MOVE_NO_DESTINATION =
    '__archive_move_no_destination__';

function archiveMoveHasDestination(
    folderId
)
{
    return folderId
        !== ARCHIVE_MOVE_NO_DESTINATION;
}

function archiveIsRootLocation(
    folderId
)
{
    return (
        folderId === null
        || folderId === undefined
        || folderId === ''
    );
}

function archiveNormalizeFolderId(
    folderId
)
{
    if (
        archiveIsRootLocation(
            folderId
        )
    )
    {
        return null;
    }

    return archiveFolderById(
        folderId
    )?.id
      || null;
}

function archiveFileFolderId(
    file
)
{
    return archiveNormalizeFolderId(
        file?.folderId
    );
}

function archiveFolderParentId(
    folder
)
{
    if (!folder)
    {
        return null;
    }

    return archiveNormalizeFolderId(
        folder.parentId
        ?? folder.parent
        ?? null
    );
}

function archiveFolderChildren(
    folderId = null
)
{
    const rootLocation =
        archiveIsRootLocation(
            folderId
        );

    if (
        !rootLocation
        && !archiveFolderById(
            folderId
        )
    )
    {
        return [];
    }

    const parentId =
        rootLocation
            ? null
            : folderId;

    return (
        sampleData.archiveFolders
        || []
    )
        .filter(folder =>
            folder.projectId === currentProjectId()
          &&
          archiveFolderParentId(
              folder
          ) === parentId
        )
        .sort((a, b) =>
            String(
                a.name || ''
            ).localeCompare(
                String(
                    b.name || ''
                )
            )
        );
}

function archiveFolderAncestors(
    folderId
)
{
    if (
        archiveIsRootLocation(
            folderId
        )
    )
    {
        return [];
    }

    const result = [];
    const seen =
        new Set();

    let current =
        archiveFolderById(
            folderId
        );

    while (
        current
        && !seen.has(
            current.id
        )
    )
    {
        result.unshift(
            current
        );

        seen.add(
            current.id
        );

        current =
            archiveFolderById(
                archiveFolderParentId(
                    current
                )
            );
    }

    return result;
}

function archiveFolderPath(
    folderId
)
{
    const folders =
        archiveFolderAncestors(
            folderId
        );

    if (!folders.length)
    {
        return ARCHIVE_ROOT_LABEL;
    }

    return folders
        .map(folder =>
            translateText(folder.name)
        )
        .join(' / ');
}

/*
      Returns every physical folder inside a
      location. At the virtual root, null is also
      included so root-level files belong to the
      scope.
    */

function archiveFolderScopeIds(
    folderId
)
{
    const ids =
        new Set();

    const visit =
        id =>
        {
            ids.add(
                id
            );

            archiveFolderChildren(
                id
            ).forEach(child =>
                visit(
                    child.id
                )
            );
        };

    if (
        archiveIsRootLocation(
            folderId
        )
    )
    {
        ids.add(
            null
        );

        archiveFolderChildren(
            null
        ).forEach(child =>
            visit(
                child.id
            )
        );

        return ids;
    }

    const normalizedId =
        archiveNormalizeFolderId(
            folderId
        );

    if (normalizedId)
    {
        visit(
            normalizedId
        );
    }

    return ids;
}

/*
      This helper is for real-folder operations
      such as delete and move. The virtual root is
      deliberately excluded.
    */

function archiveFolderDescendantIds(
    folderId,
    {
        includeSelf =
            true
    } = {}
)
{
    const folder =
        archiveFolderById(
            folderId
        );

    if (!folder)
    {
        return [];
    }

    const ids = [];

    const visit =
        id =>
        {
            if (
                !ids.includes(
                    id
                )
            )
            {
                ids.push(
                    id
                );
            }

            archiveFolderChildren(
                id
            ).forEach(child =>
                visit(
                    child.id
                )
            );
        };

    visit(
        folder.id
    );

    return includeSelf
        ? ids
        : ids.filter(
            id =>
                id !== folder.id
        );
}

function archiveFlattenFolders(
    parentId = null,
    depth = 0
)
{
    return archiveFolderChildren(
        parentId
    )
        .flatMap(folder => [
            {
                folder,
                depth
            },

            ...archiveFlattenFolders(
                folder.id,
                depth + 1
            )
        ]);
}

function archiveFolderImpact(
    folderId
)
{
    const folder =
        archiveFolderById(
            folderId
        );

    if (!folder)
    {
        return {
            folderIds:
            [],

            folders:
            0,

            files:
            0
        };
    }

    const descendantIds =
        new Set(
            archiveFolderDescendantIds(
                folder.id
            )
        );

    return {
        folderIds:
          [
              ...descendantIds
          ],

        folders:
          Math.max(
              0,
              descendantIds.size - 1
          ),

        files:
          archiveProjectFiles()
              .filter(file =>
                  descendantIds.has(
                      archiveFileFolderId(
                          file
                      )
                  )
              )
              .length
    };
}

function archiveFolderIdFromChoice(
    value
)
{
    return value
        === ARCHIVE_ROOT_PICKER_VALUE
        ? null
        : archiveNormalizeFolderId(
            value
        );
}

