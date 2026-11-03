function albumsDetailSectionIsOpen(id)
{
    return state.albumsDetailSections?.[id] !== false;
}

function renderAlbumsDetailSection(
    id,
    title,
    content,
    actionHtml = '',
    meta = ''
)
{
    return renderInspectorSection(
        id,
        title,
        meta,
        content,
        actionHtml,
        {
            inlineAction:
            Boolean(actionHtml),

            alwaysShowAction:
            true,

            open:
            albumsDetailSectionIsOpen(
                id
            ),

            toggleAttribute:
            'data-albums-section-toggle',

            sectionId:
            `albums-detail-section-${id}`
        }
    );
}

function albumPhotoEditDraftFromPhoto(photo)
{
    return {
        photoId: photo.id,

        date: {
            ...photoDateModel(photo)
        },

        placeId:
          photo.placeId
          || '',

        placeText:
          photo.placeText
          || '',

        caption:
          photo.caption
          || ''
    };
}

function normalizedAlbumPhotoEditDraft(draft)
{
    return {
        date:
          mediaDateFromGenealogyModel(
              draft?.date || {}
          ),

        placeId:
          String(draft?.placeId || ''),

        placeText:
          String(draft?.placeText || '')
              .trim(),

        caption:
          String(draft?.caption || '')
              .trim()
    };
}

function collectAlbumsPhotoEditDraft()
{
    if (!state.albumsDetailEditing)
    {
        return null;
    }

    const date =
        collectGenealogyDateField(
            'albumPhotoDate'
        );

    if (!date)
    {
        return null;
    }

    const place =
        readPlaceInputValue(
            '#albumPhotoPlace',
            main
        ) || {
            text: '',
            selectedPlaceId: ''
        };

    const selectedPlace = place.selectedPlaceId
        ? getPlace(place.selectedPlaceId) : null;
    const unchangedSelectedPlace = selectedPlace
        && normalizePlaceLookupText(place.text)
            === normalizePlaceLookupText(placeDisplayText(selectedPlace));

    return {
        photoId:
          state.selectedPhotoId,

        date,

        placeId:
          place.selectedPlaceId
          || '',

        placeText:
          unchangedSelectedPlace
              ? (state.albumsDetailEditOriginal?.placeText || '')
              : place.text
          || '',

        caption:
          collectLocalizedDataFieldValue(
              main.querySelector(
                  '#albumPhotoCaption'
              ),
              main.querySelector(
                  '#albumPhotoCaption'
              )?.dataset.sourceValue
              || ''
          ).trim()
    };
}

function syncAlbumsPhotoEditDraftFromPane()
{
    const draft =
        collectAlbumsPhotoEditDraft();

    if (draft)
    {
        state.albumsDetailDraft = draft;
    }
}

function albumsPhotoEditIsDirty()
{
    if (
        !state.albumsDetailEditing
        || !state.albumsDetailEditOriginal
    )
    {
        return false;
    }

    const current =
        collectAlbumsPhotoEditDraft()
        || state.albumsDetailDraft;

    if (!current)
    {
        return true;
    }

    return JSON.stringify(
        normalizedAlbumPhotoEditDraft(current)
    ) !== JSON.stringify(
        normalizedAlbumPhotoEditDraft(
            state.albumsDetailEditOriginal
        )
    );
}

function resetAlbumsPhotoEditState()
{
    state.albumsDetailEditing = false;
    state.albumsDetailEditOriginal = null;
    state.albumsDetailDraft = null;
}

function beginAlbumsPhotoEdit()
{
    const photo = getPhoto(
        state.selectedPhotoId,
        {
            projectId: currentProjectId()
        }
    );

    if (!photo)
    {
        return;
    }

    const draft =
        albumPhotoEditDraftFromPhoto(photo);

    state.albumsDetailEditing = true;
    state.albumsDetailEditOriginal = {
        ...draft,
        date: { ...draft.date }
    };
    state.albumsDetailDraft = {
        ...draft,
        date: { ...draft.date }
    };

    state.albumsDetailSections.details =
        true;

    renderAlbums();
    requestAnimationFrame(() => main.querySelector('#albumPhotoDateInput')?.focus({ preventScroll: true }));
}

function cancelAlbumsPhotoEdit()
{
    runAfterAlbumsPhotoEditGuard(() =>
    {
        resetAlbumsPhotoEditState();
        renderAlbums();
        requestAnimationFrame(() => main.querySelector('#albumsEditPhoto')?.focus({ preventScroll: true }));
    });
}

function saveAlbumsPhotoEdit()
{
    const photo = getPhoto(
        state.selectedPhotoId,
        {
            projectId: currentProjectId()
        }
    );

    if (!photo)
    {
        resetAlbumsPhotoEditState();
        renderAlbums();
        return;
    }

    const draft =
        collectAlbumsPhotoEditDraft();

    if (!draft)
    {
        showToast(
            'Check the historical date before saving.'
        );
        return;
    }

    photo.date =
        mediaDateFromGenealogyModel(
            draft.date
        );

    const placeInput = readPlaceInputValue('#albumPhotoPlace', main);
    const place = resolvePlaceInputValue(
        placeInput.text,
        placeInput.selectedPlaceId,
        placeInput.address,
        { projectId: placeInput.projectId, coordinates: placeInput.coordinates }
    );
    photo.placeId = place.placeId || null;
    photo.placeText = place.placeText || '';

    photo.caption =
        draft.caption
        || '';

    photo.updatedAt =
        new Date().toISOString();

    resetAlbumsPhotoEditState();
    renderAlbums();
    requestAnimationFrame(() => main.querySelector('#albumsEditPhoto')?.focus({ preventScroll: true }));
    showToast('Photo updated.');
}

function runAfterAlbumsPhotoEditGuard(
    action
)
{
    if (state.albumsNameEditingId)
    {
        const input = main.querySelector('#albumsPhotoNameInput');
        const value = input?.value.trim() || '';
        if (value !== state.albumsNameOriginal)
        {
            openModal(`<div class="modal" role="dialog" aria-modal="true" aria-labelledby="discardPhotoNameTitle"><div class="modal-header"><h2 id="discardPhotoNameTitle">${escapeHtml(t('Discard changes?'))}</h2></div><div class="modal-body"><p>${escapeHtml(t('Your unsaved photo name will be lost.'))}</p></div><div class="modal-footer"><button class="button secondary" type="button" data-close>${escapeHtml(t('Continue editing'))}</button><button class="button danger" type="button" data-discard-photo-name>${escapeHtml(t('Discard changes'))}</button></div></div>`);
            modalBackdrop.querySelector('[data-discard-photo-name]')?.addEventListener('click', () =>
            {
                closeModal();
                state.albumsNameEditingId = '';
                state.albumsNameOriginal = '';
                action();
            });
            return;
        }
        state.albumsNameEditingId = '';
        state.albumsNameOriginal = '';
        action();
        return;
    }
    if (!state.albumsDetailEditing)
    {
        action();
        return;
    }

    if (!albumsPhotoEditIsDirty())
    {
        resetAlbumsPhotoEditState();
        action();
        return;
    }

    openModal(`
        <div
          class="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="discardPhotoEditTitle">

          <div class="modal-header">
            <div>
              <h2 id="discardPhotoEditTitle">
                Discard photo changes?
              </h2>

              <p>
                Your unsaved detail changes will be lost.
              </p>
            </div>

            <button
              class="close-button"
              type="button"
              data-close>
              ${icon.close}
            </button>
          </div>

          <div class="modal-footer">
            <button
              class="button secondary"
              type="button"
              data-close>
              Continue editing
            </button>

            <button
              class="button danger"
              type="button"
              data-discard-photo-edit>
              Discard changes
            </button>
          </div>
        </div>
      `);

    modalBackdrop
        .querySelector(
            '[data-discard-photo-edit]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                closeModal();
                resetAlbumsPhotoEditState();
                action();
            }
        );
}

function beginAlbumsPhotoRename()
{
    const photo = getPhoto(state.selectedPhotoId, { projectId: currentProjectId() });
    if (!photo) return;
    state.albumsNameEditingId = photo.id;
    state.albumsNameOriginal = photo.title || photo.filename || '';
    renderAlbums();
    requestAnimationFrame(() => main.querySelector('#albumsPhotoNameInput')?.focus({ preventScroll: true }));
}

function saveAlbumsPhotoRename()
{
    const photo = getPhoto(state.albumsNameEditingId, { projectId: currentProjectId() });
    const input = main.querySelector('#albumsPhotoNameInput');
    const name = collectLocalizedDataFieldValue(input, input?.dataset.sourceValue || '').trim();
    if (!photo || !name)
    {
        input?.focus();
        showToast(t('Enter a photo name before saving.'));
        return;
    }
    photo.title = name;
    photo.updatedAt = new Date().toISOString();
    state.albumsNameEditingId = '';
    state.albumsNameOriginal = '';
    renderAlbums();
    requestAnimationFrame(() => main.querySelector('#albumsRenamePhoto')?.focus({ preventScroll: true }));
    showToast(t('Photo updated.'));
}

function knownPersonDateLabel(value)
{
    const label =
        cleanGenealogyDateText(
            formatGenealogyDateLabel(value)
        );

    if (
        !label
        || /^unknown/i.test(label)
    )
    {
        return '';
    }

    return label;
}

function albumPhotoPersonDates(person)
{
    const birth =
        knownPersonDateLabel(person?.birth);

    const death =
        knownPersonDateLabel(person?.death);

    const status =
        normalizeLivingStatus(
            person?.livingStatus
        );

    if (birth && death)
    {
        return `${birth} – ${death}`;
    }

    if (
        birth
        && status === 'Living'
    )
    {
        return `${birth} – Living`;
    }

    if (birth)
    {
        return `Born ${birth}`;
    }

    if (death)
    {
        return `Died ${death}`;
    }

    return 'Dates unknown';
}

function formatMediaFileType(photo)
{
    const mimeType =
        String(photo?.mimeType || '');

    const subtype =
        mimeType
            .split('/')
            .pop()
            .toLowerCase();

    const labels = {
        jpeg: 'JPEG',
        jpg: 'JPEG',
        png: 'PNG',
        gif: 'GIF',
        webp: 'WebP',
        tiff: 'TIFF',
        heic: 'HEIC'
    };

    return labels[subtype]
        || subtype.toUpperCase()
        || 'Unknown';
}

function renderAlbumsPhotoToolbar(
    photo,
    editing
)
{
    const collapseButton = `
        <button
          class="
            people-collapse-button
            people-sidebar-toggle-icon
            albums-detail-collapse
          "
          type="button"
          data-albums-detail-toggle
          aria-label="Collapse photo inspector">

          ${icon.doublechevronSidebar}
        </button>
      `;

    if (editing)
    {
        return `
          <div class="albums-detail-toolbar">
            ${collapseButton}
          </div>
        `;
    }

    return `
        <div class="albums-detail-toolbar">
          ${collapseButton}

          <span
            class="
              albums-detail-toolbar-spacer
            ">
          </span>

          <button
            class="
              albums-detail-action
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
            aria-label="${
                photo.favorite
                    ? 'Remove from favourites'
                    : 'Mark as favorite'
            }"
            aria-pressed="${photo.favorite}"
            title="${
                photo.favorite
                    ? 'Remove from favourites'
                    : 'Mark as favorite'
            }">

            ${icon.star}
          </button>

          <button
            class="albums-detail-action"
            type="button"
            id="albumsInspectorMore"
            aria-label="More photo actions"
            aria-haspopup="menu">

            ${icon.more}
          </button>
        </div>
      `;
}

function renderAlbumsPhotoHero(
    photo,
    editing
)
{
    const summaryHtml = `<p class="albums-detail-summary">${escapeHtml(`${photo.width || 0} × ${photo.height || 0} · ${formatMediaBytes(photo.sizeBytes)}`)}</p>`;
    return `
        <div class="albums-detail-hero">
          <button
            class="
              albums-detail-preview-button
            "
            type="button"
            data-photo-open="${escapeHtml(
                photo.id
            )}"
            aria-label="Open full-size preview of ${escapeHtml(
                photo.title
              || photo.filename
              || 'photo'
            )}">

            ${renderPhotoThumbnail(
                photo,
                {
                    className:
                  'albums-detail-preview',

                    label:
                  photo.title
                  || photo.filename
                }
            )}
            <span class="albums-face-highlight" data-albums-face-highlight hidden aria-hidden="true"></span>
          </button>

          <button
            class="
              button
              secondary
              albums-detail-open
            "
            type="button"
            data-photo-open="${escapeHtml(
                photo.id
            )}">
            Open preview
          </button>

          <div class="albums-detail-identity">
            ${state.albumsNameEditingId === photo.id ? `
              <div class="inspector-name-editor">
                <input id="albumsPhotoNameInput" maxlength="180" aria-label="${escapeHtml(t('Photo name'))}" data-source-value="${escapeHtml(state.albumsNameOriginal || '')}" value="${escapeHtml(localizedDataFieldValue(state.albumsNameOriginal || ''))}">
                <div class="inspector-name-editor-footer">${summaryHtml}<div class="inspector-name-editor-actions">
                  <button class="inspector-name-edit-button inspector-name-save" type="button" id="albumsSavePhotoName">${icon.check}<span>${escapeHtml(t('Save'))}</span></button>
                  <button class="inspector-name-edit-button inspector-name-cancel" type="button" id="albumsCancelPhotoName">${icon.close}<span>${escapeHtml(t('Cancel'))}</span></button>
                </div></div>
              </div>` : `
              <div class="inspector-name-heading"><h2 title="${escapeHtml(photo.title || photo.filename || 'Untitled photo')}">${escapeHtml(photo.title || photo.filename || 'Untitled photo')}</h2><button class="inspector-name-command" type="button" id="albumsRenamePhoto" aria-label="${escapeHtml(t('Rename photo'))}" title="${escapeHtml(t('Rename photo'))}">${icon.edit}</button></div>${summaryHtml}`}

          </div>
        </div>
      `;
}

function renderAlbumsPhotoDetails(
    photo,
    editing
)
{
    if (editing)
    {
        const draft =
            state.albumsDetailDraft
          || albumPhotoEditDraftFromPhoto(photo);

        return `
          <div class="albums-form-grid">
            ${renderGenealogyDateField(
                'albumPhotoDate',
                'Date',
                draft.date,
                {
                    inputId:
                  'albumPhotoDateInput',
                    typeId:
                  'albumPhotoDateType',
                    defaultDateType:
                  'Exact date',
                    className:
                  'genealogy-date-inline-range'
                }
            )}

            ${renderPlaceCombobox({
                id: 'albumPhotoPlace',
                label: 'Place',
                value:
                getPlaceDisplay(
                    draft.placeId
                )
                || draft.placeText
                || '',
                selectedPlaceId:
                draft.placeId
                || '',
                showAddress: false,
                className: 'full'
            })}

            <div class="albums-field">
              <label for="albumPhotoCaption">
                ${escapeHtml(t('Details'))}
              </label>

              <textarea
                id="albumPhotoCaption"
                maxlength="500"
                data-source-value="${escapeHtml(draft.caption || '')}"
                placeholder="${escapeHtml(t('Add details'))}">${escapeHtml(
                    localizedDataFieldValue(
                        draft.caption || ''
                    )
                )}</textarea>
            </div>
            <div class="details-edit-actions">
              <button class="button secondary" type="button" id="albumsCancelPhotoEdit">${escapeHtml(t('Cancel'))}</button>
              <button class="button primary" type="button" id="albumsSavePhotoEdit">${escapeHtml(t('Save changes'))}</button>
            </div>
          </div>
        `;
    }

    const caption =
        String(photo.caption || '').trim()
        || t('Not recorded');

    return `
        <dl class="albums-detail-read-list">
          <div class="albums-detail-read-row">
            <dt>Date</dt>

            <dd>
              ${escapeHtml(
                    formatPhotoDate(photo)
                )}
            </dd>
          </div>

          <div class="albums-detail-read-row">
            <dt>Place</dt>

            <dd>
              ${escapeHtml(
                    getPlaceDisplay(photo.placeId)
                || photo.placeText
                || 'Unknown place'
                )}
            </dd>
          </div>

          <div class="albums-detail-read-row">
            <dt>${escapeHtml(t('Details'))}</dt>

            <dd class="albums-detail-read-caption">${escapeHtml(caption)}</dd>
          </div>
        </dl>
      `;
}

function renderAlbumsPhotoPeople(
    photo,
    readOnly
)
{
    const people =
        getPhotoPeople(photo);

    if (!people.length)
    {
        return renderInspectorSectionEmpty(
            'No people tagged on this photo.'
        );
    }

    return `
        <div class="relationship-list">
          ${people.map(person =>
            {
                const name =
                    person.names?.display
              || 'Unnamed person';

                const mainContent = `
              ${renderPersonAvatar(
                    person,
                    'small-avatar',
                    {
                        element: 'span'
                    }
                )}

              <span class="relation-row-copy">
                <strong>
                  ${escapeHtml(name)}
                </strong>

                <span>
                  ${escapeHtml(
                        albumPhotoPersonDates(
                            person
                        )
                    )}
                </span>
              </span>
            `;

                return `
              <div class="relation-row" data-albums-person-region="${escapeHtml(person.id)}">
                ${
                    readOnly
                        ? `
                      <div class="relation-row-main">
                        ${mainContent}
                      </div>
                    `
                        : `
                      <button
                        class="relation-row-main"
                        type="button"
                        data-photo-person-open="${escapeHtml(person.id)}"
                        aria-label="Open profile for ${escapeHtml(name)}">
                        ${mainContent}
                      </button>
                    `
                }

                ${
                    readOnly
                        ? ''
                        : `
                      <div class="relation-actions">
                        <button
                          class="relation-action-button"
                          type="button"
                          data-albums-photo-person-menu="${escapeHtml(person.id)}"
                          aria-label="Actions for ${escapeHtml(name)}"
                          aria-haspopup="menu">
                          ${icon.more}
                        </button>
                      </div>
                    `
                }
              </div>
            `;
            }).join('')}
        </div>
      `;
}

function renderAlbumsPhotoAlbums(
    photo,
    readOnly
)
{
    const albums =
        (photo.albumIds || [])
            .map(id => ({
                id,
                name: getAlbumName(id)
            }))
            .filter(album => album.name);

    if (!albums.length)
    {
        return renderInspectorSectionEmpty(
            'This photo is not in an album.'
        );
    }

    return `
        <div class="albums-inspector-list">
          ${albums.map(album => `
            <div class="albums-inspector-row">
              ${
                    readOnly
                        ? `
                    <div class="albums-inspector-row-main">
                      ${icon.folder}

                      <span class="albums-inspector-row-name">
                        ${escapeHtml(album.name)}
                      </span>
                    </div>
                  `
                        : `
                    <button
                      class="albums-inspector-row-main"
                      type="button"
                      data-photo-album-open="${escapeHtml(album.id)}"
                      aria-label="Open ${escapeHtml(album.name)}">
                      ${icon.folder}

                      <span class="albums-inspector-row-name">
                        ${escapeHtml(album.name)}
                      </span>
                    </button>

                    <button
                      class="albums-inspector-remove"
                      type="button"
                      data-photo-remove-album="${escapeHtml(album.id)}"
                      aria-label="Remove photo from ${escapeHtml(album.name)}"
                      title="Remove from album">
                      ${icon.close}
                    </button>
                  `
                }
            </div>
          `).join('')}
        </div>
      `;
}

function renderConnectedNotesFooter({
    contextType,
    contextId,
    count
})
{
    if (!contextId || !count) return '';

    const label = translateText(
        `View all ${count} ${count === 1 ? 'note' : 'notes'}`
    );

    return `
        <div class="panel-section-footer">
          <button
            class="panel-section-view-all"
            type="button"
            data-connected-notes-view-all
            data-notes-context-type="${escapeHtml(contextType)}"
            data-notes-context-id="${escapeHtml(contextId)}">

            <span>${escapeHtml(label)}</span>

            <span
              class="panel-section-view-all-icon"
              aria-hidden="true">
              ${icon.chevron}
            </span>
          </button>
        </div>
      `;
}

function bindConnectedNotesFooters(root)
{
    root?.querySelectorAll('[data-connected-notes-view-all]')
        .forEach(button =>
        {
            button.onclick = event =>
            {
                event.preventDefault();
                event.stopPropagation();

                openNotesForContext(
                    button.dataset.notesContextType,
                    button.dataset.notesContextId
                );
            };
        });
}

function renderAlbumsPhotoNotes(
    photo,
    notes = getNotesForPhoto(photo.id, {
        projectId: photo.projectId,
        includeArchived: false
    })
)
{
    if (!notes.length)
    {
        return renderInspectorSectionEmpty(
            'No notes linked to this photo.'
        );
    }

    const items = renderConnectedNoteList({
        notes,
        contextType: 'photo',
        contextId: photo.id,
        emptyText: 'No notes linked to this photo.',
        allowUnlink: true
    });

    return `
        ${items}

        ${renderConnectedNotesFooter({
            contextType: 'photo',
            contextId: photo.id,
            count: notes.length
        })}
      `;
}

function openAlbumsPhotoNotesModal(
    photoId =
        state.selectedPhotoId
)
{
    const photo =
        getPhoto(
            photoId,
            {
                projectId:
              currentProjectId()
            }
        );

    if (!photo)
    {
        return;
    }

    /*
        Albums currently exposes only active Notes
        for normal linking. Archived Note links are
        preserved because this modal is additive and
        never removes existing relationships.
      */
    const existingNoteIds =
        getNotesForPhoto(
            photo.id,
            {
                projectId:
              photo.projectId,

                includeArchived:
              false
            }
        ).map(note =>
            note.id
        );

    const photoLabel =
        photo.title
        || photo.filename
        || 'this photo';

    openNoteLinkPickerModal({
        projectId:
          photo.projectId,

        title:
          'Add note',

        description:
          `Link existing notes to “${photoLabel}”.`,

        existingNoteIds,

        /*
          Preserve the current Albums rule:
          archived Notes are not offered for
          new photo links.
        */
        includeArchived:
          false,

        existingStatus:
          'Already linked',

        existingMetaLabel:
          'already linked',

        createLabel:
          'Create linked note',

        /*
          Retains the existing Albums capability
          to create a new Note already connected
          to the selected photo.
        */
        onCreate:
          () =>
              openNewNoteForContext(
                  'photo',
                  photo.id
              ),

        onSave:
          selectedNoteIds =>
          {
              const currentPhoto =
                  getPhoto(
                      photo.id,
                      {
                          projectId:
                    photo.projectId
                      }
                  );

              if (!currentPhoto)
              {
                  return false;
              }

              selectedNoteIds.forEach(
                  noteId =>
                  {
                      const note =
                          getNote(
                              noteId,
                              {
                                  projectId:
                        photo.projectId,

                                  includeArchived:
                        false
                              }
                          );

                      if (!note)
                      {
                          return;
                      }

                      setNotePhotoLinks(
                          note.id,
                          [
                              ...new Set([
                                  ...(
                                      note.linkedPhotoIds
                        || []
                                  ),

                                  photo.id
                              ])
                          ],
                          {
                              projectId:
                      photo.projectId
                          }
                      );
                  }
              );

              return true;
          },

        afterSave:
          renderAlbumsPreserveViewport,

        successMessage:
          count =>
              `${count} ${
                  count === 1
                      ? 'note was'
                      : 'notes were'
              } linked to the photo.`
    });
}

function renderAlbumsPhotoSources(
    photo
)
{
    return renderConnectedSourceList({
        targetType:
          'photo',

        targetId:
          photo.id,

        projectId:
          photo.projectId,

        emptyText:
          'No sources linked to this photo.'
    });
}

function renderAlbumsPhotoMetadata(photo)
{
    const rows = [
        [
            'File name',
            photo.filename
          || 'Unknown'
        ],
        [
            'File format',
            formatMediaFileType(photo)
        ],
        [
            'Dimensions',
            `${photo.width || 0} × ${
                photo.height || 0
            }`
        ],
        [
            'File size',
            formatMediaBytes(
                photo.sizeBytes
            )
        ],
        [
            'Added',
            formatMediaTimestamp(
                photo.createdAt
            )
        ],
        [
            'Last modified',
            formatMediaTimestamp(
                photo.updatedAt
            )
        ]
    ];

    return `
        <div class="albums-metadata-list">
          ${rows.map(([label, value]) => `
            <div class="albums-metadata-row">
              <span>${escapeHtml(label)}</span>
              <strong>${escapeHtml(value)}</strong>
            </div>
          `).join('')}
        </div>
      `;
}

function renderAlbumsDetailCollapsed()
{
    return `
        <aside
          class="albums-detail collapsed"
          aria-label="Collapsed photo inspector">

          <button
            class="people-collapse-button
              person-sidebar-restore-button
              albums-detail-restore
              sidebar-toggle-icon
              sidebar-toggle-icon-restore"
            type="button"
            data-albums-detail-toggle
            aria-label="Show photo inspector">
            ${icon.doublechevronSidebar}
          </button>
        </aside>
      `;
}

function renderAlbumsDetailPane()
{
    const photo =
        getPhoto(
            state.selectedPhotoId,
            {
                projectId:
              currentProjectId()
            }
        );

    if (!photo)
    {
        return '';
    }

    if (
        state.albumsDetailEditing
        && state.albumsDetailDraft
            ?.photoId !== photo.id
    )
    {
        resetAlbumsPhotoEditState();
    }

    const editing =
        state.albumsDetailEditing
        && state.albumsDetailDraft
            ?.photoId === photo.id;

    const actionsLocked =
        editing;

    const photoNotes =
        getNotesForPhoto(
            photo.id,
            {
                projectId:
              photo.projectId,

                includeArchived:
              false
            }
        );

    const photoSources =
        sourcesForTarget(
            'photo',
            photo.id,
            photo.projectId
        );

    const peopleCount =
        getPhotoPeople(photo).length;

    const albumCount =
        (photo.albumIds || [])
            .filter(id => getAlbumName(id))
            .length;

    const peopleAction =
        actionsLocked
            ? ''
            : `
            <button
              class="link"
              type="button"
              id="albumsTagPeople">

              ${renderPanelButtonLabel(
                    icon.plus,
                    'Tag person'
                )}
            </button>
          `;

    const albumAction =
        actionsLocked
            ? ''
            : `
            <button
              class="link"
              type="button"
              id="albumsLinkAlbum">

              ${renderPanelButtonLabel(
                    icon.plus,
                    'Add to album'
                )}
            </button>
          `;

    const notesAction =
        actionsLocked
            ? ''
            : `
            <button
              class="link"
              type="button"
              id="albumsManagePhotoNotes">

              ${renderPanelButtonLabel(
                    icon.plus,
                    'Add note'
                )}
            </button>
          `;

    const sourceAction =
        actionsLocked
            ? ''
            : `
            <button
              class="link"
              type="button"
              id="albumsManagePhotoSources">

              ${renderPanelButtonLabel(
                    icon.plus,
                    'Add source'
                )}
            </button>
          `;

    return `
        <aside
          class="
            albums-detail
            ${editing ? 'is-editing' : ''}
          "
          aria-label="Photo inspector"
          ${
                editing
                    ? 'data-albums-photo-edit-root'
                    : ''
            }>

          ${renderAlbumsPhotoToolbar(
                photo,
                editing
            )}

          ${renderAlbumsPhotoHero(
                photo,
                editing
            )}

          ${renderAlbumsDetailSection(
                'details',
                'Details',
                renderAlbumsPhotoDetails(
                    photo,
                    editing
                ),
                editing ? '' : `<button class="link" type="button" id="albumsEditPhoto">${renderPanelButtonLabel(icon.edit, 'Edit')}</button>`
            )}

          ${renderAlbumsDetailSection(
                'people',
                'People',
                renderAlbumsPhotoPeople(
                    photo,
                    actionsLocked
                ),
                peopleAction,
                `${peopleCount} ${
                    peopleCount === 1
                        ? 'person'
                        : 'people'
                }`
            )}

          ${renderAlbumsDetailSection(
                'albums',
                'Albums',
                renderAlbumsPhotoAlbums(
                    photo,
                    actionsLocked
                ),
                albumAction,
                `${albumCount} ${
                    albumCount === 1
                        ? 'album'
                        : 'albums'
                }`
            )}

          ${renderAlbumsDetailSection(
                'notes',
                'Notes',
                renderAlbumsPhotoNotes(
                    photo,
                    photoNotes
                ),
                notesAction,
                `${photoNotes.length} ${
                    photoNotes.length === 1
                        ? 'note'
                        : 'notes'
                }`
            )}

          ${renderAlbumsDetailSection(
                'sources',
                'Sources',
                renderAlbumsPhotoSources(
                    photo
                ),
                sourceAction,
                `${photoSources.length} ${
                    photoSources.length === 1
                        ? 'source'
                        : 'sources'
                }`
            )}

          ${renderAlbumsDetailSection(
                'metadata',
                'Metadata',
                renderAlbumsPhotoMetadata(
                    photo
                )
            )}
          <div class="albums-face-floating-preview" data-albums-face-floating hidden aria-hidden="true">
            ${renderPhotoThumbnail(photo, { className: 'albums-detail-preview', label: photo.title || photo.filename })}
            <span class="albums-face-highlight" data-albums-face-highlight></span>
          </div>
        </aside>
      `;
}

