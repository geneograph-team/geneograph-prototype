function archiveInspectorToolbarContext()
{
    if (
        state.archiveView
          === 'sources'
    )
    {
        const source =
            archiveSourceById(
                state.archiveSelectedSourceId
            );

        return source
            ? {
                type:
                'source',

                id:
                source.id,

                label:
                source.title
                || 'Source',

                favorite:
                Boolean(
                    source.favorite
                ),

                supportsFavourite:
                true
            }
            : null;
    }

    const file =
        archiveFileById(
            state.archiveSelectedFileId
        );

    if (file)
    {
        return {
            type:
            'file',

            id:
            file.id,

            label:
            file.name
            || 'File',

            favorite:
            Boolean(
                file.favorite
            ),

            supportsFavourite:
            true
        };
    }

    const selectedFolder =
        archiveFolderById(
            state.archiveSelectedFolderItemId
        );

    if (selectedFolder)
    {
        return {
            type:
            'folder',

            id:
            selectedFolder.id,

            label:
            selectedFolder.name
            || 'Folder',

            folderMode:
            'selected',

            favorite:
            Boolean(selectedFolder.favorite),

            supportsFavourite:
            true
        };
    }

    const currentFolder =
        archiveFolderById(
            state.archiveSelectedFolderId
        );

    if (currentFolder)
    {
        return {
            type:
            'folder',

            id:
            currentFolder.id,

            label:
            currentFolder.name
            || 'Folder',

            folderMode:
            'current',

            favorite:
            Boolean(currentFolder.favorite),

            supportsFavourite:
            true
        };
    }

    /*
        The virtual Files root is a location, not
        a stored record, so it has no favourite or
        more-actions control.
      */

    return null;
}

function renderArchiveInspectorRenameButton(
    context
)
{
    if (
        context?.type !== 'folder'
    )
    {
        return '';
    }

    return `
        <button
          class="
            archive-inspector-action
          "
          type="button"
          data-archive-inspector-rename-folder="${escapeHtml(
                context.id
            )}"
          aria-label="Rename folder"
          title="Rename folder">

          ${icon.edit}
        </button>
      `;
}

function renderArchiveInspectorMoveButton(
    context
)
{
    if (
        !context
        || ![
            'file',
            'folder'
        ].includes(
            context.type
        )
    )
    {
        return '';
    }

    const itemLabel =
        context.type === 'file'
            ? 'file'
            : 'folder';

    return `
        <button
          class="
            archive-inspector-action
          "
          type="button"
          data-archive-inspector-move="${escapeHtml(
                context.type
            )}"
          data-archive-inspector-move-id="${escapeHtml(
                context.id
            )}"
          aria-label="Move ${escapeHtml(
                itemLabel
            )}"
          title="Move ${escapeHtml(
                itemLabel
            )}">

          ${icon.movefolder}
        </button>
      `;
}

function renderArchiveInspectorFavouriteButton(
    context
)
{
    if (
        !context
        || !context.supportsFavourite
    )
    {
        return '';
    }

    const actionLabel =
        context.favorite
            ? 'Remove from favourites'
            : 'Add to favourites';

    const dataAttribute =
        context.type
          === 'source'
            ? `
              data-archive-source-favorite="${escapeHtml(
                    context.id
                )}"
            `
            : context.type === 'folder'
              ? `data-archive-toggle-folder-favorite="${escapeHtml(context.id)}"`
            : `
              data-archive-toggle-favorite="${escapeHtml(
                    context.id
                )}"
            `;

    return `
        <button
          class="
            archive-inspector-action
            ${
                context.favorite
                    ? 'active'
                    : ''
            }
          "
          type="button"
          ${dataAttribute}
          aria-label="${escapeHtml(
                actionLabel
            )}"
          aria-pressed="${String(
                context.favorite
            )}"
          title="${escapeHtml(
                actionLabel
            )}">

          ${icon.star}
        </button>
      `;
}

function renderArchiveInspectorToolbar()
{
    const context =
        archiveInspectorToolbarContext();

    const editing =
        context?.type === 'file'
        && archiveFileEditIsActive(
            context.id
        );

    const collapseButton = `
        <button
          class="
            people-collapse-button
            people-sidebar-toggle-icon
            archive-inspector-collapse
          "
          type="button"
          data-archive-inspector-collapse="true"
          aria-label="Collapse Archive inspector"
          title="Collapse inspector">

          ${icon.doublechevronSidebar}
        </button>
      `;

    if (editing)
    {
        return `
          <div
            class="
              archive-inspector-toolbar
            "
            role="toolbar"
            aria-label="Edit Archive file">

            ${collapseButton}
          </div>
        `;
    }

    return `
        <div
          class="
            archive-inspector-toolbar
          "
          role="toolbar"
          aria-label="Archive inspector actions">

          ${collapseButton}

          <span
            class="
              archive-inspector-toolbar-spacer
            "
            aria-hidden="true">
          </span>


          ${renderArchiveInspectorMoveButton(
                context
            )}

          ${renderArchiveInspectorFavouriteButton(
                context
            )}
          ${
                context
                    ? `
                <button
                  class="
                    archive-inspector-action
                  "
                  type="button"
                  data-archive-row-actions="${escapeHtml(
                        context.type
                    )}"
                  data-archive-row-id="${escapeHtml(
                        context.id
                    )}"
                  aria-label="More actions for ${escapeHtml(
                        context.label
                    )}"
                  aria-haspopup="menu"
                  aria-expanded="false"
                  title="More actions">

                  ${icon.more}
                </button>
              `
                    : ''
            }
        </div>
      `;
}

function renderArchiveInspectorCollapsed()
{
    return `
        <aside
          class="
            archive-inspector-collapsed
          "
          aria-label="Archive inspector collapsed">

          <button
            class="
              people-collapse-button
              people-sidebar-toggle-icon
              archive-inspector-restore
            "
            type="button"
            data-archive-inspector-collapse="false"
            aria-label="Open Archive inspector"
            title="Open inspector">

            ${icon.doublechevronSidebar}
          </button>
        </aside>
      `;
}

function renderArchiveRootInspector()
{
    const favoritesView =
        state.archiveView
          === 'favorites';

    return renderArchiveInspectorShell({
        title:
          favoritesView
              ? 'Favourites'
              : ARCHIVE_ROOT_LABEL,

        subtitle:
          'No item selected',

        content:
          renderInspectorSectionEmpty(
              'Select a file or folder to view its details.'
          )
    });
}

function renderArchiveInspector()
{
    if (
        state.archiveView
          === 'sources'
    )
    {
        return renderArchiveSourceInspector();
    }

    const file =
        archiveFileById(
            state.archiveSelectedFileId
        );

    if (file)
    {
        return renderArchiveFileInspector(
            file
        );
    }

    const selectedFolder =
        archiveFolderById(
            state.archiveSelectedFolderItemId
        );

    if (selectedFolder)
    {
        return renderArchiveFolderInspector(
            selectedFolder,
            {
                mode:
              'selected'
            }
        );
    }

    const currentFolder =
        archiveFolderById(
            state.archiveSelectedFolderId
        );

    return currentFolder
        ? renderArchiveFolderInspector(
            currentFolder,
            {
                mode:
                'current'
            }
        )
        : renderArchiveRootInspector();
}

function renderArchiveInspectorHeader(
    title,
    subtitle = '',
    titleAction = ''
)
{
    return `
        <div
          class="
            archive-inspector-head
          ">

          <div
            class="
              archive-inspector-head-copy
            ">

            <div class="archive-inspector-title-row">
              <h2>
                ${escapeHtml(title)}
              </h2>
              ${titleAction}
            </div>

            ${
                subtitle
                    ? `
                  <p>
                    ${escapeHtml(
                        subtitle
                    )}
                  </p>
                `
                    : ''
            }
          </div>
        </div>
      `;
}

function renderArchiveInspectorShell({
    content,
    title = '',
    subtitle = '',
    titleAction = '',
    showHeader = true,
    bodyClass =
        'archive-inspector-body',
    className = ''
})
{
    return `
        <aside
          class="
            archive-inspector
            ${className}
          "
          aria-label="Archive inspector">

          ${renderArchiveInspectorToolbar()}

          <div
            class="
              archive-inspector-scroll
            ">

            ${
                showHeader
                    ? renderArchiveInspectorHeader(
                        title,
                        subtitle,
                        titleAction
                    )
                    : ''
            }

            <div
              class="${escapeHtml(
                    bodyClass
                )}">

              ${content}
            </div>
          </div>
        </aside>
      `;
}

function renderArchivePreview(
    file
)
{
    const imageSource = archiveImageSource(file);
    if (archiveFileKind(file) !== 'img' || !imageSource) return '';
    const regions = archiveMarkedRegions(file);
    return `
          <button type="button" data-archive-open-file="${escapeHtml(file.id)}" aria-label="${escapeHtml(t('Open file'))}"
            class="
              archive-file-preview
            ">

            <img
              class="
                archive-file-preview-image
              "
              src="${escapeHtml(
                    imageSource
                )}"
              alt="">
            ${regions.map(({ personId, name }) => `<span class="archive-person-region-highlight" data-archive-region-box="${escapeHtml(personId)}" data-archive-region-ready="false" title="${escapeHtml(name)}" aria-hidden="true" hidden></span>`).join('')}
            <span class="archive-person-floating-preview" data-archive-person-floating hidden aria-hidden="true">
              <img class="archive-file-preview-image" src="${escapeHtml(imageSource)}" alt="">
              <span class="archive-person-region-highlight" data-archive-floating-region-highlight hidden></span>
            </span>
          </button>
        `;
}

function renderArchiveFileOpenAction(
    file
)
{
    if (!archiveCanViewFile(file)) return '';
    return `
        <button
          class="
            button
            secondary
            archive-file-open
          "
          type="button"
          data-archive-open-file="${escapeHtml(
                file.id
            )}">

          Open file
        </button>
      `;
}

function renderArchiveFileIdentity(
    file,
    editing
)
{
    const summary =
        [
            archiveFileTypeLabel(
                file
            ),

            file.size
          || (
              Number.isFinite(
                  Number(
                      file.sizeBytes
                  )
              )
                  ? formatMediaBytes(
                      file.sizeBytes
                  )
                  : ''
          )
        ]
            .filter(Boolean)
            .join(' · ');
    const summaryHtml = `<p class="archive-file-summary" ${archiveFileKind(file) === 'img' ? `data-archive-image-summary data-size="${escapeHtml(file.size || (Number.isFinite(Number(file.sizeBytes)) ? formatMediaBytes(file.sizeBytes) : ''))}"` : ''} title="${escapeHtml(summary || 'File')}">${escapeHtml(summary || 'File')}</p>`;

    return `
        <div
          class="
            archive-file-identity
          ">

          ${state.archiveFileNameEditingId === file.id ? `
            <div class="inspector-name-editor">
              <input id="archiveFileNameInput" maxlength="220" aria-label="${escapeHtml(t('File name'))}" value="${escapeHtml(file.name || '')}">
              <div class="inspector-name-editor-footer">${summaryHtml}<div class="inspector-name-editor-actions">
                <button class="inspector-name-edit-button inspector-name-save" type="button" id="archiveSaveFileName" aria-label="${escapeHtml(t('Save'))}" title="${escapeHtml(t('Save'))}">${icon.check}<span>${escapeHtml(t('Save'))}</span></button>
                <button class="inspector-name-edit-button inspector-name-cancel" type="button" id="archiveCancelFileName" aria-label="${escapeHtml(t('Cancel'))}" title="${escapeHtml(t('Cancel'))}">${icon.close}<span>${escapeHtml(t('Cancel'))}</span></button>
              </div>
              </div>
            </div>` : `
            <div class="inspector-name-heading"><h2 title="${escapeHtml(file.name || 'Untitled file')}" data-user-content>${escapeHtml(file.name || 'Untitled file')}</h2><button class="inspector-name-command" type="button" id="archiveRenameFile" aria-label="${escapeHtml(t('Rename file'))}" title="${escapeHtml(t('Rename file'))}">${icon.edit}</button></div>${summaryHtml}`}
        </div>
      `;
}

function renderArchiveFileHero(
    file,
    editing
)
{
    const imageView = state.archiveFileLayout === 'images' && state.archiveView !== 'sources';
    const preview = imageView ? '' : renderArchivePreview(file);
    const openAction = imageView ? '' : renderArchiveFileOpenAction(file);
    const identity = renderArchiveFileIdentity(file, editing);
    return `
        <div
          class="
            archive-file-hero ${preview ? '' : 'no-preview'}
          ">
          ${preview}${openAction}${identity}
        </div>
      `;
}

function renderArchiveFileDetails(
    file,
    editing
)
{
    if (editing)
    {
        const draft =
            state.archiveFileEditDraft
          || archiveFileEditDraftFromFile(
              file
          );

        return `
          <div
            class="
              archive-file-form-grid
            ">
            ${renderGenealogyDateField(
                'archiveFileDocumentDate',
                'Date',
                draft.documentDate,
                {
                    inputId:
                  'archiveFileDocumentDateInput',

                    typeId:
                  'archiveFileDocumentDateType',

                    defaultDateType:
                  'Exact date',

                    className:
                  'genealogy-date-inline-range'
                }
            )}

            <div
              class="
                archive-file-field
              ">

              <label
                for="archiveFileDescription">

                ${escapeHtml(t('Details'))}
              </label>

              <textarea
                id="archiveFileDescription"
                maxlength="1200"
                placeholder="${escapeHtml(t('Add details'))}">${escapeHtml(
                    draft.description
                  || ''
                )}</textarea>
            </div>
            <div class="details-edit-actions"><button class="button secondary" type="button" id="archiveCancelFileEdit">${escapeHtml(t('Cancel'))}</button><button class="button primary" type="button" id="archiveSaveFileEdit">${escapeHtml(t('Save changes'))}</button></div>
          </div>
        `;
    }

    const dateLabel =
        formatGenealogyDateLabel(
            archiveDocumentDateModel(
                file
            )
        )
        || 'Date unknown';

    const description =
        String(
            file.description
          || ''
        ).trim()
        || 'No description';

    return `
        <dl
          class="
            archive-file-read-list
          ">

          <div
            class="
              archive-file-read-row
            ">

            <dt>
              Date
            </dt>

            <dd>
              ${escapeHtml(
                    dateLabel
                )}
            </dd>
          </div>

          <div
            class="
              archive-file-read-row
            ">

            <dt>
              ${escapeHtml(t('Details'))}
            </dt>
            <dd class="archive-file-read-description">${escapeHtml(
                translateText(description)
            )}</dd>
          </div>
        </dl>
      `;
}

function archiveFilePersonMeta(
    person
)
{
    const birth =
        formatGenealogyDateLabel(
            person?.birth
        );

    const death =
        formatGenealogyDateLabel(
            person?.death
        );

    if (
        birth
        && death
    )
    {
        return `${birth} – ${death}`;
    }

    if (birth)
    {
        return `Born ${birth}`;
    }

    if (death)
    {
        return `Died ${death}`;
    }

    return 'Person profile';
}

function renderArchiveFileConnectionRow({
    file,
    entityType,
    record,
    leadingHtml,
    readOnly = false
})
{
    const config =
        archiveEntityConfig(
            entityType
        );

    if (
        !config
        || !record
    )
    {
        return '';
    }

    const label =
        config.label(
            record
        );

    const meta =
        entityType === 'person'
            ? archiveFilePersonMeta(
                record
            )
            : config.meta(
                record
            );

    const mainContent = `
        ${leadingHtml}

        <span
          class="
            relation-row-copy
          ">

          <strong>
            ${escapeHtml(
                label
            )}
          </strong>

          <span>
            ${escapeHtml(
                meta
            )}
          </span>
        </span>
      `;

    return `
        <div
          class="
            relation-row
          " ${entityType === 'person' && normalizeFaceRegion(file.personRegions?.[record.id]) ? `data-archive-person-region="${escapeHtml(record.id)}"` : ''}>

          ${
                readOnly
                    ? `
                <div
                  class="
                    relation-row-main
                  " ${entityType === 'person' && normalizeFaceRegion(file.personRegions?.[record.id]) ? `tabindex="0" aria-label="${escapeHtml(record.name || '')}"` : ''}>

                  ${mainContent}
                </div>
              `
                    : `
                <button
                  class="
                    relation-row-main
                  "
                  type="button"
                  data-archive-open-connection="${escapeHtml(
                        entityType
                    )}"
                  data-archive-connection-id="${escapeHtml(
                        record.id
                    )}"
                  aria-label="Open ${escapeHtml(
                        label
                    )}">

                  ${mainContent}
                </button>
              `
            }

          ${
                readOnly
                    ? ''
                    : `
                <div
                  class="
                    relation-actions
                  ">

                  <button
                    class="
                      relation-action-button
                    "
                    type="button"
                    data-archive-unlink-owner-type="file"
                    data-archive-unlink-owner-id="${escapeHtml(
                        file.id
                    )}"
                    data-archive-unlink-type="${escapeHtml(
                        entityType
                    )}"
                    data-archive-unlink-id="${escapeHtml(
                        record.id
                    )}"
                    aria-label="Unlink ${escapeHtml(
                        label
                    )}"
                    title="Unlink">

                    ${icon.unlink}
                  </button>
                </div>
              `
            }
        </div>
      `;
}

function renderArchiveFilePeople(
    file,
    readOnly
)
{
    const people =
        (
            file.linkedPersonIds
          || []
        )
            .map(id =>
                getPerson(
                    id
                )
            )
            .filter(Boolean);

    if (!people.length)
    {
        return renderInspectorSectionEmpty(
            'No people linked to this file.'
        );
    }

    return `
        <div
          class="
            relationship-list
          ">

          ${people
                .map(person =>
                    renderArchiveFileConnectionRow({
                        file,
                        entityType:
                  'person',
                        record:
                  person,
                        leadingHtml:
                  renderPersonAvatar(
                      person,
                      'small-avatar',
                      {
                          element:
                        'span'
                      }
                  ),
                        readOnly
                    })
                )
                .join('')}
        </div>
      `;
}

function renderArchiveFilePlaces(file, readOnly)
{
    const places = archiveFilePlaceIds(file)
        .map(id => getPlace(id))
        .filter(place => place && !place.deleted && place.projectId === file.projectId);
    const legacyText = !file.documentPlaceId
        ? String(file.documentPlaceText || '').trim()
        : '';
    if (!places.length && !legacyText)
        return renderInspectorSectionEmpty('No places linked to this file.');
    return `<div class="relationship-list notes-place-list archive-file-place-list">
      ${places.map(place => {
        const name = placePrimaryName(place) || place.name || 'Unnamed place';
        const location = placeSecondaryName(place) || 'No broader place recorded';
        return `<div class="relation-row notes-place-item">
          ${readOnly ? `<div class="relation-row-main notes-place-main">` : `<button class="relation-row-main notes-place-main" type="button" data-archive-open-connection="place" data-archive-connection-id="${escapeHtml(place.id)}" aria-label="${escapeHtml(t('Open place:') + ' ' + name)}">`}
            <span class="notes-place-icon" aria-hidden="true">${icon.mapPin}</span>
            <span class="notes-place-copy"><strong>${escapeHtml(name)}</strong><span class="notes-place-secondary">${escapeHtml(location)}</span></span>
          ${readOnly ? '</div>' : '</button>'}
          ${readOnly ? '' : `<div class="relation-actions"><button class="relation-action-button" type="button" data-archive-unlink-owner-type="file" data-archive-unlink-owner-id="${escapeHtml(file.id)}" data-archive-unlink-type="place" data-archive-unlink-id="${escapeHtml(place.id)}" aria-label="${escapeHtml(t('Unlink') + ' ' + name)}" title="${escapeHtml(t('Unlink'))}">${icon.unlink}</button></div>`}
        </div>`;
      }).join('')}
      ${legacyText ? `<div class="archive-legacy-place"><span>${escapeHtml(legacyText)}</span><small>${escapeHtml(t('Place name not linked to a project place'))}</small>${readOnly ? '' : `<button class="panel-action" type="button" data-archive-resolve-file-place="${escapeHtml(file.id)}">${escapeHtml(t('Find place'))}</button>`}</div>` : ''}
    </div>`;
}

function archiveFileEventRecords(
    file
)
{
    return (
        file?.linkedEventIds
        || []
    )
        .map(id =>
            archiveConnectionRecord(
                'event',
                id
            )
        )
        .filter(event =>
            Boolean(
                eventRelationItemModel(
                    event
                )
            )
        );
}

function renderArchiveFileEvents(
    file,
    readOnly
)
{
    const events =
        archiveFileEventRecords(
            file
        );

    if (!events.length)
    {
        return renderInspectorSectionEmpty(
            'No events linked to this file.'
        );
    }

    return `
        <div
          class="
            relationship-list
            notes-event-list
          ">

          ${events
                .map(event =>
                    renderEventRelationItem({
                        event,

                        openAttributes:
                  `
                    data-archive-open-connection="event"
                    data-archive-connection-id="${escapeHtml(
                        event.id
                    )}"
                  `,

                        removeAttributes:
                  `
                    data-archive-unlink-owner-type="file"
                    data-archive-unlink-owner-id="${escapeHtml(
                        file.id
                    )}"
                    data-archive-unlink-type="event"
                    data-archive-unlink-id="${escapeHtml(
                        event.id
                    )}"
                  `,

                        removeContextLabel:
                  'file',

                        readOnly
                    })
                )
                .join('')}
        </div>
      `;
}

function archiveFileNoteRecords(
    file
)
{
    return archiveNoteIdsForFile(
        file
    )
        .map(id =>
            archiveConnectionRecord(
                'note',
                id
            )
        )
        .filter(Boolean);
}

function renderArchiveFileNotes(file, readOnly)
{
    const notes = archiveFileNoteRecords(file);

    if (!notes.length)
    {
        return renderInspectorSectionEmpty(
            'No notes linked to this file.'
        );
    }

    const items = notes.slice(0, CONNECTED_NOTES_PREVIEW_LIMIT).map(note =>
        renderRelatedNoteRelationItem({
            note,

            openAttributes: `
            data-archive-open-connection="note"
            data-archive-connection-id="${escapeHtml(note.id)}"
          `,

            removeAttributes: `
            data-archive-unlink-owner-type="file"
            data-archive-unlink-owner-id="${escapeHtml(file.id)}"
            data-archive-unlink-type="note"
            data-archive-unlink-id="${escapeHtml(note.id)}"
          `,

            removeContextLabel: 'file',
            readOnly
        })
    ).join('');

    return `
        <div class="relationship-list notes-related-list">
          ${items}
        </div>

        ${renderConnectedNotesFooter({
            contextType: 'archiveFile',
            contextId: file.id,
            count: notes.length
        })}
      `;
}

function renderArchiveFileSources(
    file,
    readOnly
)
{
    return renderConnectedSourceList({
        targetType:
          'file',

        targetId:
          file.id,

        projectId:
          file.projectId,

        /*
          The Archive inspector must show every
          connected source rather than the four-item
          preview used in some other panels.
        */
        limit:
          Number.POSITIVE_INFINITY,

        emptyText:
          'No sources linked to this file.',

        readOnly
    });
}

function renderArchiveFileMetadata(
    file
)
{
    const rows = [
        [
            'Folder',
            archiveFolderPath(
                file.folderId
            )
        ],

        [
            'Date added',
            archiveFormatDate(
                file.addedAt,
                file.added
            )
        ],

        [
            'Date modified',
            archiveFormatDate(
                file.updatedAt,
                file.updated
            )
        ],

        file.originalName
        && file.originalName
          !== file.name
            ? [
                'Original filename',
                file.originalName
            ]
            : null,

        file.mimeType
            ? [
                'MIME type',
                file.mimeType
            ]
            : null,

        [
            'File ID',
            file.id
        ]
    ].filter(Boolean);

    return `
        <div
          class="
            archive-file-metadata-list
          ">

          ${rows
                .map(([
                    label,
                    value
                ]) => `
              <div
                class="
                  archive-file-metadata-row
                ">

                <span>
                  ${escapeHtml(
                        label
                    )}
                </span>

                <strong>
                  ${escapeHtml(
                        value
                    || 'Unknown'
                    )}
                </strong>
              </div>
            `)
                .join('')}
        </div>
      `;
}

function renderArchiveSourceSection(
    sectionId,
    title,
    content,
    actionHtml = '',
    meta = '',
    footerHtml = ''
)
{
    const stateKey = `source-${sectionId}`;

    return renderInspectorSection(
        stateKey,
        title,
        meta,
        content,
        actionHtml,
        {
            inlineAction: Boolean(actionHtml),
            alwaysShowAction: true,
            open: archiveInspectorSectionIsOpen(stateKey),
            toggleAttribute: 'data-archive-section-toggle',
            sectionId: `archive-source-section-${sectionId}`,
            footerHtml
        }
    );
}

function archiveSourceConnectionRecords(
    source,
    entityType
)
{
    if (!source)
    {
        return [];
    }

    if (entityType === 'file')
    {
        return archiveFilesForSource(
            source.id
        );
    }

    return archiveConnectionIds(
        'source',
        source.id,
        entityType
    )
        .map(id =>
            archiveConnectionRecord(
                entityType,
                id
            )
        )
        .filter(Boolean);
}

function renderArchiveSourceSectionAction(
    source,
    entityType
)
{
    const config =
        archiveEntityConfig(
            entityType
        );

    if (!source || !config)
    {
        return '';
    }

    return `
        <button
          class="panel-action"
          type="button"
          data-archive-add-connection="${escapeHtml(
                entityType
            )}"
          data-archive-owner-type="source"
          data-archive-owner-id="${escapeHtml(
                source.id
            )}">

          ${renderPanelButtonLabel(
                icon.plus,
                config.addLabel
            )}
        </button>
      `;
}

function renderArchiveSourceConnectionContent(
    source,
    entityType,
    records
)
{
    const config =
        archiveEntityConfig(
            entityType
        );

    if (!config)
    {
        return '';
    }

    const validRecords =
        (
            Array.isArray(
                records
            )
                ? records
                : []
        )
            .filter(Boolean);

    if (!validRecords.length)
    {
        return renderInspectorSectionEmpty(
            `No ${config.title.toLowerCase()} linked.`
        );
    }

    const previewLimits = {
        photo: PERSON_PANEL_PREVIEW_LIMITS.photos,
        file: PERSON_PANEL_PREVIEW_LIMITS.archive,
        note: CONNECTED_NOTES_PREVIEW_LIMIT
    };

    const visibleRecords = validRecords.slice(
        0,
        previewLimits[entityType] ?? 4
    );

    const openAttributes =
        recordId => `
          data-archive-open-connection="${escapeHtml(
                entityType
            )}"
          data-archive-connection-id="${escapeHtml(
                recordId
            )}"
        `;

    const removeAttributes =
        recordId => `
          data-archive-unlink-owner-type="source"
          data-archive-unlink-owner-id="${escapeHtml(
                source.id
            )}"
          data-archive-unlink-type="${escapeHtml(
                entityType
            )}"
          data-archive-unlink-id="${escapeHtml(
                recordId
            )}"
        `;

    const renderRelationRemoveAction =
        (
            recordId,
            label
        ) => `
          <div class="relation-actions">
            <button
              class="
                relation-action-button
                danger
              "
              type="button"
              ${removeAttributes(
                    recordId
                )}
              aria-label="Remove ${escapeHtml(
                    label
                )} from source"
              title="Remove link">

              ${icon.close}
            </button>
          </div>
        `;

    /*
        Notes uses the shared connected-file
        component for linked Archive files.
      */
    if (entityType === 'file')
    {
        return renderConnectedFileList({
            files:
            visibleRecords,

            contextType:
            'source',

            contextId:
            source.id,

            emptyText:
            'No files linked.'
        });
    }

    /*
        Reuse the Notes linked-photo grid.
      */
    if (entityType === 'photo')
    {
        return `
          <div
            class="
              connected-photo-grid
              notes-linked-photo-grid
            ">

            ${visibleRecords
                .map(photo =>
                {
                    const label =
                        config.label(
                            photo
                        );

                    return `
                  <div
                    class="
                      notes-linked-photo-item
                      person-connected-photo-item
                    ">

                    <button
                      class="connected-photo-button"
                      type="button"
                      ${openAttributes(
                            photo.id
                        )}
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
                      class="
                        connected-note-unlink
                        connected-photo-unlink
                      "
                      type="button"
                      ${removeAttributes(
                            photo.id
                        )}
                      aria-label="Unlink ${escapeHtml(
                            label
                        )} from source"
                      title="Unlink photo">

                      ${icon.unlink}
                    </button>
                  </div>
                `;
                })
                .join('')}
          </div>
        `;
    }

    /*
        Reuse the person rows from the
        Notes right-side panel.
      */
    if (entityType === 'person')
    {
        return `
          <div
            class="
              relationship-list
              notes-people-list
            ">

            ${visibleRecords
                .map(person =>
                {
                    const name =
                        person.names?.display
                  || person.name
                  || 'Unnamed person';

                    const dates =
                        albumPhotoPersonDates(
                            person
                        )
                  || config.meta(
                      person
                  );

                    return `
                  <div class="relation-row">
                    <button
                      class="relation-row-main"
                      type="button"
                      ${openAttributes(
                            person.id
                        )}
                      aria-label="Open profile for ${escapeHtml(
                            name
                        )}">

                      ${renderPersonAvatar(
                            person,
                            'small-avatar',
                            {
                                element:
                            'span'
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
                                dates
                            )}
                        </span>
                      </span>
                    </button>

                    ${renderRelationRemoveAction(
                        person.id,
                        name
                    )}
                  </div>
                `;
                })
                .join('')}
          </div>
        `;
    }

    /*
        renderEventRelationItem() is already
        shared by Notes and Archive.
      */
    if (entityType === 'event')
    {
        return `
          <div
            class="
              relationship-list
              notes-event-list
            ">

            ${visibleRecords
                .map(event =>
                    renderEventRelationItem({
                        event,

                        openAttributes:
                    openAttributes(
                        event.id
                    ),

                        removeAttributes:
                    removeAttributes(
                        event.id
                    ),

                        removeContextLabel:
                    'source'
                    })
                )
                .join('')}
          </div>
        `;
    }

    /*
        Related-note rows already have a
        reusable renderer.
      */
    if (entityType === 'note')
    {
        return `
          <div
            class="
              relationship-list
              notes-related-list
            ">

            ${visibleRecords
                .map(note =>
                    renderRelatedNoteRelationItem({
                        note,

                        openAttributes:
                    openAttributes(
                        note.id
                    ),

                        removeAttributes:
                    removeAttributes(
                        note.id
                    ),

                        removeContextLabel:
                    'source'
                    })
                )
                .join('')}
          </div>
        `;
    }

    /*
        Reuse the full place presentation
        from the Notes inspector.
      */
    if (entityType === 'place')
    {
        return `
          <div
            class="
              relationship-list
              notes-place-list
            ">

            ${visibleRecords
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
                      ${openAttributes(
                            place.id
                        )}
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

                    ${renderRelationRemoveAction(
                        place.id,
                        primaryName
                    )}
                  </div>
                `;
                })
                .join('')}
          </div>
        `;
    }

    /*
        Safe fallback for any connection type
        added to the Source inspector later.
      */
    return `
        <div class="notes-linked-list">
          ${visibleRecords
                .map(record =>
                {
                    const label =
                        config.label(
                            record
                        );

                    const metadata =
                        config.meta(
                            record
                        );

                    return `
                <div class="notes-linked-row">
                  <button
                    class="notes-linked-main"
                    type="button"
                    ${openAttributes(
                        record.id
                    )}
                    aria-label="Open ${escapeHtml(
                        label
                    )}">

                    <strong>
                      ${escapeHtml(
                            label
                        )}
                    </strong>

                    <span>
                      ${escapeHtml(
                            metadata
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
                      ${removeAttributes(
                            record.id
                        )}
                      aria-label="Remove ${escapeHtml(
                            label
                        )} from source"
                      title="Remove link">

                      ${icon.close}
                    </button>
                  </div>
                </div>
              `;
                })
                .join('')}
        </div>
      `;
}

function renderSourceConnectionViewAll(source, entityType, count)
{
    const labels = {
        photo: ['photo', 'photos'],
        file: ['file', 'files'],
        note: ['note', 'notes']
    };

    const nouns = labels[entityType];

    if (!source?.id || !count || !nouns) return '';

    const label = translateText(
        `View all ${count} ${count === 1 ? nouns[0] : nouns[1]}`
    );

    return `
        <button
          class="panel-section-view-all"
          type="button"
          data-source-connected-view-all="${escapeHtml(entityType)}"
          data-source-connected-owner="${escapeHtml(source.id)}">
          <span>${escapeHtml(label)}</span>
          <span
            class="panel-section-view-all-icon"
            aria-hidden="true">
            ${icon.chevron}
          </span>
        </button>
      `;
}

function renderArchiveSourceConnectionSection(
    source,
    entityType
)
{
    const config =
        archiveEntityConfig(
            entityType
        );

    if (!source || !config)
    {
        return '';
    }

    const records =
        archiveSourceConnectionRecords(
            source,
            entityType
        );
    const countLabel =
        state.language === 'ru'
        && entityType === 'photo'
            ? `${
                RU_NUMBER_FORMATTER.format(
                    records.length
                )
            } фото`
            : translateText(
                `${records.length} ${
                    records.length === 1
                        ? config.singular
                        : config.title.toLowerCase()
                }`
            );
    return renderArchiveSourceSection(
        entityType,
        config.title,
        renderArchiveSourceConnectionContent(
            source,
            entityType,
            records
        ),
        renderArchiveSourceSectionAction(
            source,
            entityType
        ),
        countLabel,
        renderSourceConnectionViewAll(
            source,
            entityType,
            records.length
        )
    );
}

function renderArchiveSourceDetails(
    source,
    categoryLabel
)
{
    const url =
        String(
            source.url
          || ''
        ).trim();

    const rows = [
        {
            label:
            'Category',

            value:
            categoryLabel
            || 'Not categorized'
        },
        {
            label:
            'Obtained from',

            value:
            source.providedBy
            || ''
        },
        {
            label:
            'Stored at',

            value:
            archiveSourceCustodialPlaceLabel(source)
            || '',

            placeId:
            archiveSourceCustodialPlace(source)?.id || ''
        },
        {
            label:
            'Where can it be found?',

            value:
            source.reference
            || ''
        },
        {
            label:
            'Website or link',

            value:
            url,

            isLink:
            /^https?:\/\//i.test(url)
        },
        {
            label:
            'Date accessed or received',

            value:
            source.accessedDate
                ? archiveFormatDate(
                    source.accessedDate
                )
                : ''
        }
    ];

    return `
        <dl
          class="
            archive-file-read-list
            archive-source-read-list
          ">

          ${rows
                .filter(row => String(row.value || '').trim())
                .map(row => `
              <div class="archive-file-read-row">
                <dt>
                  ${escapeHtml(
                        t(row.label)
                    )}
                </dt>

                <dd>
                  ${
                        row.placeId
                            ? `
                        <button
                          class="text-action"
                          type="button"
                          data-archive-open-connection="place"
                          data-archive-connection-id="${escapeHtml(row.placeId)}">
                          ${escapeHtml(row.value)}
                        </button>
                      `
                            : row.isLink
                            ? `
                        <a
                          class="
                            text-action
                            archive-source-url
                          "
                          href="${escapeHtml(
                                row.value
                            )}"
                          target="_blank"
                          rel="noopener noreferrer">

                          ${escapeHtml(
                                row.value
                            )}
                        </a>
                      `
                            : escapeHtml(
                                row.value
                            )
                    }
                </dd>
              </div>
            `)
                .join('')}
        </dl>

        ${
            source.notes
                ? `
              <div class="archive-source-notes">
                <strong>
                  Source notes
                </strong>

                <p>${escapeHtml(
                    source.notes
                )}</p>
              </div>
            `
                : ''
        }
      `;
}

function openArchiveSourceFilesModal(
    sourceId
)
{
    const source =
        archiveSourceById(
            sourceId
        );

    if (!source)
    {
        return;
    }

    const existingFileIds =
        archiveFilesForSource(
            source.id
        ).map(file =>
            file.id
        );

    openConnectedFilesModal({
        projectId:
          source.projectId
          || currentProjectId(),

        title:
          'Add files',

        subtitle:
          localizedDataFieldValue(source.title || 'Untitled source'),

        existingFileIds,

        onSave:
          (fileIds, context) =>
          {
              if (context?.changes) return rpCommitArchivePickerChanges('source', [source.id], 'file', fileIds, context);
              const currentSource =
                  archiveSourceById(
                      source.id
                  );

              if (!currentSource)
              {
                  return {
                      ok:
                  false
                  };
              }

              const writes =
                  fileIds.map(fileId => ({
                      ownerType:
                  'source',

                      ownerId:
                  currentSource.id,

                      entityType:
                  'file',

                      entityId:
                  fileId,

                      shouldLink:
                  true
                  }));

              const committed =
                  archiveSetConnectionsAtomically(
                      writes
                  );

              return {
                  ...committed,

                  ok:
                committed.ok
                && committed.changedCount
                  === writes.length
              };
          },

        afterSave:
          renderArchivePreservingSourceInspectorScroll,
    });
}

function renderArchiveFileInspector(
    file
)
{
    if (
        state.archiveFileEditing
        && state.archiveFileEditDraft
            ?.fileId !== file.id
    )
    {
        resetArchiveFileEditState();
    }

    const editing =
        archiveFileEditIsActive(
            file.id
        );

    const peopleCount =
        (
            file.linkedPersonIds
          || []
        ).length;

    const eventCount =
        archiveFileEventRecords(
            file
        ).length;

    const noteCount =
        archiveFileNoteRecords(
            file
        ).length;

    const sourceCount =
        sourceIdsForTarget(
            'file',
            file.id,
            file.projectId
        ).length;

    const placeCount = archiveFilePlaceIds(file).length;

    const content = `
        ${renderArchiveFileHero(
            file,
            editing
        )}

        ${renderArchiveFileSection(
            'details',
            'Details',
            renderArchiveFileDetails(
                file,
                editing
            ),
            editing ? '' : `<button class="panel-action" type="button" id="archiveEditFile">${renderPanelButtonLabel(icon.edit, 'Edit')}</button>`
        )}

        ${renderArchiveFileSection(
            'people',
            'People',
            renderArchiveFilePeople(
                file,
                editing
            ),
            renderArchiveFileSectionAction(
                'person',
                'Tag person',
                editing
            ),
            `${peopleCount} ${
                peopleCount === 1
                    ? 'person'
                    : 'people'
            }`
        )}

        ${renderArchiveFileSection(
            'events',
            'Events',
            renderArchiveFileEvents(
                file,
                editing
            ),
            renderArchiveFileSectionAction(
                'event',
                'Add event',
                editing
            ),
            `${eventCount} ${
                eventCount === 1
                    ? 'event'
                    : 'events'
            }`
        )}

        ${renderArchiveFileSection(
            'notes',
            'Notes',
            renderArchiveFileNotes(
                file,
                editing
            ),
            renderArchiveFileSectionAction(
                'note',
                'Add note',
                editing
            ),
            `${noteCount} ${
                noteCount === 1
                    ? 'note'
                    : 'notes'
            }`
        )}

        ${renderArchiveFileSection(
            'sources',
            'Sources',
            renderArchiveFileSources(
                file,
                editing
            ),
            renderArchiveFileSectionAction(
                'source',
                'Add source',
                editing
            ),
            `${sourceCount} ${
                sourceCount === 1
                    ? 'source'
                    : 'sources'
            }`
        )}

        ${renderArchiveFileSection(
            'places',
            'Places',
            renderArchiveFilePlaces(file, editing),
            editing ? '' : `<button class="panel-action" type="button" data-archive-add-file-place="${escapeHtml(file.id)}">${renderPanelButtonLabel(icon.plus, 'Add places')}</button>`,
            `${placeCount} ${placeCount === 1 ? 'place' : 'places'}`
        )}

        ${renderArchiveFileSection(
            'metadata',
            'File metadata',
            renderArchiveFileMetadata(
                file
            )
        )}
      `;

    return renderArchiveInspectorShell({
        showHeader:
          false,

        bodyClass:
          'archive-file-inspector-content',

        className:
          editing
              ? 'is-editing'
              : '',

        content
    });
}

function archiveFolderInspectorPath(
    folder
)
{
    if (!folder)
    {
        return 'Files';
    }

    const names =
        archiveFolderAncestors(
            folder.id
        )
            .map(item =>
                item?.name
            )
            .filter(Boolean);

    return [
        'Files',
        ...names
    ].join(
        ' / '
    );
}

function renderArchiveFolderInspector(
    folder,
    {
        mode =
            'current'
    } = {}
)
{
    if (!folder)
    {
        return renderArchiveRootInspector();
    }

    const selectedFolder =
        mode === 'selected';

    const impact =
        archiveFolderImpact(
            folder.id
        );

    const directFolders =
        archiveFolderChildren(
            folder.id
        ).length;

    const directFiles =
        archiveProjectFiles()
            .filter(file =>
                archiveFileFolderId(
                    file
                ) === folder.id
            )
            .length;

    const location =
        archiveFolderInspectorPath(
            folder
        );

    const body = `
        <div
          class="
            archive-inspector-actions
            archive-folder-inspector-actions
          ">

          <button
            class="
              button secondary
            "
            type="button"
            data-archive-create-folder
            data-archive-parent-folder="${escapeHtml(
                folder.id
            )}">

            ${icon.plus}
            New subfolder
          </button>

          <button
            class="
              button secondary
            "
            type="button"
            data-archive-add-files
            data-archive-parent-folder="${escapeHtml(
                folder.id
            )}">

            ${icon.plus}
            Add file
          </button>
        </div>

        <section
          class="
            archive-inspector-section
          ">

          <div
            class="
              archive-inspector-section-head
            ">

            <strong>
              Folder details
            </strong>
          </div>

          <div
            class="
              archive-inspector-section-body
            ">

          <div
            class="
              archive-kv-list
            ">

            <div
              class="
                archive-kv
              ">

              <span>
                Location
              </span>

              <span>
                ${escapeHtml(
                    location
                )}
              </span>
            </div>

            <div
              class="
                archive-kv
              ">

              <span>
                Created
              </span>

              <span>
                ${escapeHtml(
                    archiveFormatDate(
                        folder.createdAt
                    )
                )}
              </span>
            </div>

              <div
                class="
                  archive-kv
                ">

                <span>
                  Folders
                </span>

                <span>
                  ${directFolders}
                </span>
              </div>

              <div
                class="
                  archive-kv
                ">

                <span>
                  Files
                </span>

                <span>
                  ${directFiles}
                </span>
              </div>

              <div
                class="
                  archive-kv
                ">

                <span>
                  Nested files
                </span>

                <span>
                  ${impact.files}
                </span>
              </div>
            </div>
          </div>
        </section>
      `;

    return renderArchiveInspectorShell({
        title:
          folder.name,

        titleAction:
          renderArchiveInspectorRenameButton({
              type: 'folder',
              id: folder.id
          }),

        subtitle:
          selectedFolder
              ? 'Selected folder'
              : 'Current folder',

        content:
          body
    });
}

function renderArchiveSourceInspector()
{
    const source =
        archiveSourceById(
            state.archiveSelectedSourceId
        )
        || archiveFilteredSources()[0]
        || null;

    if (!source)
    {
        return renderArchiveInspectorShell({
            title:
            'Sources',

            subtitle:
            'No source selected',

            content:
            renderInspectorSectionEmpty(
                'Select or create a source record.'
            )
        });
    }

    const categoryLabel =
        localizedSourceCategoryLabel(
            source.category
        );

    const content = `
        ${renderArchiveSourceSection(
            'details',
            'Source details',
            renderArchiveSourceDetails(source, categoryLabel),
            `<button class="panel-action" type="button" data-archive-edit-source-details="${escapeHtml(source.id)}">${renderPanelButtonLabel(icon.edit, 'Edit')}</button>`
        )}

        ${renderArchiveSourceConnectionSection(source, 'person')}
        ${renderArchiveSourceConnectionSection(source, 'event')}
        ${renderArchiveSourceConnectionSection(source, 'photo')}
        ${renderArchiveSourceConnectionSection(source, 'file')}
        ${renderArchiveSourceConnectionSection(source, 'note')}
        ${renderArchiveSourceConnectionSection(source, 'place')}
      `;

    return renderArchiveInspectorShell({
        title:
          source.title,

        subtitle:
          categoryLabel,

        bodyClass:
          'archive-source-inspector-content',

        content
    });
}

