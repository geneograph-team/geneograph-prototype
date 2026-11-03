function openNewAlbumModal()
{
    openModal(`
        <div
          class="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="newAlbumTitle">

          <div class="modal-header">
            <div>
              <h2 id="newAlbumTitle">
                New album
              </h2>

              <p>
                Create a named group of photos.
              </p>
            </div>

            <button
              class="close-button"
              type="button"
              data-close>
              ${icon.close}
            </button>
          </div>

          <form id="newAlbumForm">
            <div class="modal-body form-grid">
              <div class="field">
                <label for="albumName">
                  Album name
                </label>

                <input
                  id="albumName"
                  required
                  placeholder="e.g. Whiskerfield family photos">
              </div>

              <div class="field">
                <label for="albumDescription">
                  Description
                </label>

                <textarea
                  id="albumDescription"
                  placeholder="e.g. Portraits, documents, and family photos connected to the Whiskerfield family."></textarea>
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
                class="button primary"
                type="submit">
                Create album
              </button>
            </div>
          </form>
        </div>
      `);

    modalBackdrop
        .querySelector(
            '#newAlbumForm'
        )
        ?.addEventListener(
            'submit',
            event =>
            {
                event.preventDefault();
                const projectId = requireActiveProjectId();
                if (!projectId) return;

                const album = {
                    id:
                `album-${Date.now()}`,

                    projectId,

                    name:
                modalBackdrop
                    .querySelector(
                        '#albumName'
                    )
                    .value
                    .trim(),

                    description:
                modalBackdrop
                    .querySelector(
                        '#albumDescription'
                    )
                    .value
                    .trim(),

                    createdAt:
                new Date()
                    .toISOString()
                };

                if (!album.name)
                {
                    return;
                }

                sampleData.albums.push(
                    album
                );

                state.albumsView =
                    'album';

                state.activeAlbumId =
                    album.id;

                closeModal();
                renderAlbums();

                showToast(
                    'Album created.'
                );
            }
        );
}

function openEditAlbumModal()
{
    const album =
        getProjectAlbums()
            .find(item =>
                item.id === state.activeAlbumId
            );

    if (!album)
    {
        return;
    }

    const sourceName =
        album.name || '';

    const sourceDescription =
        album.description || '';

    openModal(`
        <div
          class="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="editAlbumTitle">

          <div class="modal-header">
            <div>
              <h2 id="editAlbumTitle">
                Edit album
              </h2>

              <p>
                ${escapeHtml(
                    album.name
                )}
              </p>
            </div>

            <button
              class="close-button"
              type="button"
              data-close>
              ${icon.close}
            </button>
          </div>

          <form id="editAlbumForm">
            <div class="modal-body form-grid">
              <div class="field">
                <label for="editAlbumName">
                  Album name
                </label>

                <input
                  id="editAlbumName"
                  required
                  data-source-value="${escapeHtml(
                        sourceName
                    )}"
                  value="${escapeHtml(
                        localizedDataFieldValue(
                            sourceName
                        )
                    )}">
              </div>

              <div class="field">
                <label for="editAlbumDescription">
                  Description
                </label>

                <textarea
                  id="editAlbumDescription"
                  data-source-value="${escapeHtml(
                        sourceDescription
                    )}">${escapeHtml(
                        localizedDataFieldValue(
                            sourceDescription
                        )
                    )}</textarea>
              </div>
            </div>

            <div class="modal-footer">
              <button
                class="button danger"
                type="button"
                id="deleteAlbumButton">
                Delete album
              </button>

              <button
                class="button secondary"
                type="button"
                data-close>
                Cancel
              </button>

              <button
                class="button primary"
                type="submit">
                Save
              </button>
            </div>
          </form>
        </div>
      `);

    modalBackdrop
        .querySelector('#editAlbumForm')
        ?.addEventListener(
            'submit',
            event =>
            {
                event.preventDefault();

                const nameInput =
                    modalBackdrop.querySelector(
                        '#editAlbumName'
                    );

                const descriptionInput =
                    modalBackdrop.querySelector(
                        '#editAlbumDescription'
                    );

                const nextName =
                    collectLocalizedDataFieldValue(
                        nameInput,
                        nameInput?.dataset.sourceValue
                ?? sourceName
                    ).trim();

                const nextDescription =
                    collectLocalizedDataFieldValue(
                        descriptionInput,
                        descriptionInput?.dataset.sourceValue
                ?? sourceDescription
                    ).trim();

                album.name =
                    nextName || sourceName;

                album.description =
                    nextDescription;

                closeModal();
                renderAlbums();

                showToast(
                    'Album updated.'
                );
            }
        );

    modalBackdrop
        .querySelector('#deleteAlbumButton')
        ?.addEventListener(
            'click',
            () =>
                openDeleteAlbumConfirm(
                    album.id
                )
        );
}

function openDeleteAlbumConfirm(albumId)
{
    const album = getProjectAlbums().find(item => item.id === albumId);
    if (!album) return;
    openModal(`<div class="modal" role="dialog" aria-modal="true" aria-labelledby="deleteAlbumTitle"><div class="modal-header"><div><h2 id="deleteAlbumTitle">Delete album?</h2><p>${escapeHtml(album.name)}</p></div><button class="close-button" type="button" data-close>${icon.close}</button></div><div class="modal-body"><p>Photos remain in All photos. Album membership will be removed.</p></div><div class="modal-footer"><button class="button secondary" type="button" data-close>Cancel</button><button class="button danger" type="button" data-confirm-album-delete>Delete album</button></div></div>`);
    modalBackdrop.querySelector('[data-confirm-album-delete]')?.addEventListener('click', () =>
    {
        const albumIndex = sampleData.albums.findIndex(item => item.id === album.id);
        if (albumIndex >= 0) sampleData.albums.splice(albumIndex, 1);
        const now = new Date().toISOString();
        sampleData.media.forEach(photo =>
        {
            if (!(photo.albumIds || []).includes(album.id)) return;
            photo.albumIds = photo.albumIds.filter(id => id !== album.id);
            photo.updatedAt = now;
        });
        state.albumsView = 'all'; state.activeAlbumId = null; closeModal(); renderAlbums(); showToast('Album deleted. Photos remain in All photos.');
    });
}

function openAddPhotosModal()
{
    const projectId =
        requireActiveProjectId();

    if (!projectId)
    {
        return;
    }

    /*
      * Capture the destination when the modal
      * opens. Switching state while files are
      * being read cannot redirect the upload.
      */
    const targetAlbumId =
        state.albumsView === 'album'
        && state.activeAlbumId
        && getProjectAlbums(
            projectId
        ).some(
            album =>
                album.id
            === state.activeAlbumId
        )
            ? state.activeAlbumId
            : '';

    let uploadDrafts = [];
    let uploadErrors = [];
    let processing = false;

    const renderUploadTile = draft => `
        <article class="rp-upload-tile">
          <span class="rp-upload-tile-preview"><img src="${escapeHtml(draft.src)}" alt=""></span>
          <strong title="${escapeHtml(draft.filename)}">${escapeHtml(draft.filename)}</strong>
          <small>${draft.width} × ${draft.height} · ${formatMediaBytes(draft.sizeBytes)}</small>
          <button class="rp-upload-remove" type="button"
            data-person-photos-adder-remove-upload="${escapeHtml(draft.id)}"
            aria-label="${escapeHtml(`Remove ${draft.filename}`)}">${icon.close}</button>
        </article>
      `;
    const renderUploadErrors = () =>
    {
        if (!uploadErrors.length)
        {
            return '';
        }

        return `
          <div
            class="
              person-photos-adder-upload-errors
            "
            role="alert">

            <strong>
              ${
                    uploadErrors.length === 1
                        ? 'One file could not be added:'
                        : `${
                            uploadErrors.length
                        } files could not be added:`
                }
            </strong>

            <ul>
              ${uploadErrors
                    .map(error => `
                  <li>
                    ${escapeHtml(error)}
                  </li>
                `)
                    .join('')}
            </ul>
          </div>
        `;
    };

    const processFiles =
        async fileList =>
        {
            if (processing)
            {
                return;
            }

            const knownSignatures =
                new Set(
                    uploadDrafts.map(
                        draft =>
                            draft.signature
                    )
                );

            const files =
                Array.from(
                    fileList || []
                ).filter(file =>
                {
                    const signature =
                        photoUploadFileSignature(
                            file
                        );

                    if (
                        knownSignatures.has(
                            signature
                        )
                    )
                    {
                        return false;
                    }

                    knownSignatures.add(
                        signature
                    );

                    return true;
                });

            if (!files.length)
            {
                return;
            }

            processing = true;

            const modal =
                modalBackdrop.querySelector(
                    '[data-albums-photo-upload]'
                );

            modal
                ?.querySelectorAll(
                    'button'
                )
                .forEach(button =>
                {
                    button.disabled = true;
                });

            const results =
                await Promise.all(
                    files.map(async file =>
                    {
                        try
                        {
                            return {
                                draft:
                      await createPhotoUploadDraft(
                          file,
                          {
                              idPrefix:
                            'albums-photo-upload-draft'
                          }
                      ),

                                error:
                      ''
                            };
                        }
                        catch (error)
                        {
                            return {
                                draft:
                      null,

                                error:
                      error?.message
                      || `${
                          file.name
                        || 'File'
                      } — could not be read`
                            };
                        }
                    })
                );

            processing = false;

            uploadDrafts = [
                ...uploadDrafts,

                ...results
                    .map(result =>
                        result.draft
                    )
                    .filter(Boolean)
            ];

            uploadErrors =
                results
                    .map(result =>
                        result.error
                    )
                    .filter(Boolean);

            renderDialog();
        };

    const commitUploads = () =>
    {
        if (
            processing
          || !uploadDrafts.length
        )
        {
            return;
        }

        if (
            uploadDrafts.some(
                draft =>
                    !photoUploadDraftIsValid(
                        draft
                    )
            )
        )
        {
            uploadErrors = [
                'One or more uploaded photos are no longer valid. Remove them and choose the files again.'
            ];

            renderDialog();
            return;
        }

        const createdPhotos =
            uploadDrafts
                .map(draft =>
                    createMediaFromPhotoUpload({
                        projectId,

                        draft,

                        personIds:
                  [],

                        idPrefix:
                  'photo-albums'
                    })
                )
                .filter(Boolean);

        if (!createdPhotos.length)
        {
            uploadErrors = [
                'No valid photos were added.'
            ];

            renderDialog();
            return;
        }

        if (targetAlbumId)
        {
            createdPhotos.forEach(photo =>
            {
                photo.albumIds = [
                    ...new Set([
                        ...(photo.albumIds || []),
                        targetAlbumId
                    ])
                ];
            });
        }

        const project =
            sampleData.projects.find(
                item =>
                    item.id === projectId
            );

        touchProjectModified(
            project
        );

        state.selectedPhotoIds = [];

        state.selectedPhotoId =
            createdPhotos[0].id;

        closeModal({
            force: true
        });

        renderAlbums();

        showToast(
            'Photos added'
        );
    };

    const bindDialog = () =>
    {
        const modal =
            modalBackdrop.querySelector(
                '[data-albums-photo-upload]'
            );

        if (!modal)
        {
            return;
        }

        const fileInput =
            modal.querySelector(
                '[data-albums-photo-upload-file]'
            );


        fileInput?.addEventListener(
            'change',
            () =>
            {
                processFiles(
                    fileInput.files
                );
            }
        );

        const dropzone =
            modal.querySelector(
                '[data-albums-photo-upload-dropzone]'
            );

        if (dropzone)
        {
            bindUploadDropzoneChooser(dropzone, fileInput);
            [
                'dragenter',
                'dragover'
            ].forEach(type =>
            {
                dropzone.addEventListener(
                    type,
                    event =>
                    {
                        event.preventDefault();

                        dropzone.classList.add(
                            'is-dragging'
                        );
                    }
                );
            });

            [
                'dragleave',
                'drop'
            ].forEach(type =>
            {
                dropzone.addEventListener(
                    type,
                    event =>
                    {
                        event.preventDefault();

                        dropzone.classList.remove(
                            'is-dragging'
                        );
                    }
                );
            });

            dropzone.addEventListener(
                'drop',
                event =>
                {
                    processFiles(
                        event.dataTransfer?.files
                    );
                }
            );
        }

        modal.addEventListener(
            'click',
            event =>
            {
                const removeButton =
                    event.target.closest(
                        '[data-person-photos-adder-remove-upload]'
                    );

                if (removeButton)
                {
                    const draftId =
                        removeButton.dataset
                            .personPhotosAdderRemoveUpload;

                    uploadDrafts =
                        uploadDrafts.filter(
                            draft =>
                                draft.id !== draftId
                        );

                    uploadErrors = [];

                    renderDialog();
                    return;
                }

                if (
                    event.target.closest(
                        '[data-albums-photo-upload-save]'
                    )
                )
                {
                    commitUploads();
                }
            }
        );
    };

    const renderDialog = () =>
    {
        const maxMegabytes =
            Math.round(
                PHOTO_UPLOAD_MAX_BYTES
            / (
                1024 * 1024
            )
            );

        const photoCount =
            uploadDrafts.length;

        openModal(`
          <div
            class="
              modal
              person-photo-picker-modal
              person-photos-adder-modal
              rp-upload-staging
              ${photoCount ? 'has-items' : ''}
            "
            data-albums-photo-upload
            role="dialog"
            aria-modal="true"
            aria-labelledby="
              albumsPhotoUploadTitle
            ">

            <div class="modal-header">
              <div>
                <h2
                  id="
                    albumsPhotoUploadTitle
                  ">
                  Add photos
                </h2>

                <p>${escapeHtml(t(targetAlbumId
                    ? 'New photos will be added to the current album.'
                    : 'New photos will be added to the current project.'))}</p>
              </div>

              <button
                class="close-button"
                type="button"
                data-close
                aria-label="
                  Close add photos dialog
                ">
                ${icon.close}
              </button>
            </div>

            <div
              class="
                modal-body
                person-photo-picker-body
                person-photos-adder-body
              ">

              <div
                class="
                  person-photos-adder-upload-panel
                ">

                <div
                  class="
                    person-photo-upload-dropzone
                  person-photos-adder-upload-dropzone upload-dropzone
                    ${
                        photoCount
                            ? 'has-drafts'
                            : ''
                    }
                  "
            data-albums-photo-upload-dropzone role="button" tabindex="0" aria-label="${escapeHtml(t('Choose photos'))}">

                  <input
                    type="file"
                    accept="${
                        PHOTO_UPLOAD_ALLOWED_TYPES
                            .join(',')
                    }"
                    multiple
                    data-albums-photo-upload-file
                    hidden>

${renderUploadDropzonePrompt(photoCount ? 'Add more photos' : 'Drop photos here or choose photos', state.language === 'ru' ? `JPEG, PNG или WebP, до ${maxMegabytes} МБ на файл.` : `JPEG, PNG, or WebP up to ${maxMegabytes} MB each.`)}
                </div>

                ${renderUploadErrors()}

                ${
                    photoCount
                        ? `
                      <div
                        class="
                          rp-upload-tiles
                        ">
                        ${uploadDrafts
                            .map(renderUploadTile)
                            .join('')}
                      </div>
                    `
                        : ''
                }
              </div>
            </div>

            <div
              class="
                modal-footer
                person-photos-adder-footer
              ">

              <p class="albums-photo-upload-notice">
                <span aria-hidden="true">${icon.warning}</span>
                <span>${escapeHtml(t('Uploaded files are available until page reload.'))}</span>
              </p>

              <div
                class="
                  modal-footer-actions
                ">

                <button
                  class="button secondary"
                  type="button"
                  data-close>
                  Cancel
                </button>

                <button
                  class="button primary"
                  type="button"
                  data-albums-photo-upload-save
                  ${
                        photoCount
                            ? ''
                            : 'disabled'
                    }>
                  ${
                        photoCount === 1
                            ? 'Add photo'
                            : 'Add photos'
                    }
                </button>
              </div>
            </div>
          </div>
        `);

        bindDialog();
    };

    renderDialog();
}

function openAddToAlbumModal()
{
    const projectId =
        currentProjectId();

    const photoIds = [
        ...new Set(
            state.selectedPhotoIds || []
        )
    ].filter(photoId =>
        Boolean(
            getPhoto(
                photoId,
                {
                    projectId
                }
            )
        )
    );

    if (!photoIds.length)
    {
        return;
    }

    let query = '';
    let createMode = false;

    const selectedAlbumIds =
        new Set(getProjectAlbums(projectId).filter(album => getAlbumSelectedPhotoMembership(album.id, photoIds).complete).map(album => album.id));
    const albumDecisions = new Map();
    let createdAlbumId = '';

    const createDraft = {
        name: '',
        description: ''
    };

    const allAlbums = () =>
        getProjectAlbums(
            projectId
        );

    const visibleAlbums = () =>
    {
        const normalizedQuery =
            query
                .trim()
                .toLowerCase();

        if (!normalizedQuery)
        {
            return allAlbums();
        }

        return allAlbums().filter(
            album =>
                album.id === createdAlbumId || albumPickerSearchText(
                    album
                ).includes(
                    normalizedQuery
                )
        );
    };

    const photoCountLabel = () =>
        translateText(
            `${photoIds.length} selected ${
                photoIds.length === 1
                    ? 'photo'
                    : 'photos'
            }`
        );

    const selectionLabel = () =>
    {
        return rpText(`${albumDecisions.size} changes`, `Изменений: ${albumDecisions.size}`);
    };

    const saveLabel = () =>
    {
        return t('Save changes');
    };

    const renderAlbumRow =
        album =>
        {
            const membership =
                getAlbumSelectedPhotoMembership(
                    album.id,
                    photoIds
                );

            const selected =
                selectedAlbumIds.has(
                    album.id
                );

            const previewPhoto =
                getAlbumPreviewPhoto(
                    album.id
                );

            const albumPhotoCount =
                getAlbumPhotoCount(
                    album.id
                );

            let membershipLabel = '';

            if (membership.complete)
            {
                membershipLabel =
                    translateText(
                        'Already added'
                    );
            }
            else if (
                membership.existingCount
            )
            {
                membershipLabel =
                    translateText(
                        `${membership.existingCount} of ${
                            membership.selectedPhotoCount
                        } already added`
                    );
            }

            return `
            <label
              class="
                album-picker-result
                ${
                    selected
                        ? 'is-selected'
                        : ''
                }
                ${
                    membership.complete
                        ? 'is-complete'
                        : ''
                }
              "
              data-album-picker-row="${
                    escapeHtml(album.id)
                }">

              <span
                class="
                  album-picker-cover
                ">
                ${
                    previewPhoto
                        ? renderPhotoThumbnail(
                            previewPhoto,
                            {
                                label:
                            album.name
                            }
                        )
                        : icon.folder
                }
              </span>

              <span
                class="
                  album-picker-copy
                ">
                <strong>
                  ${escapeHtml(
                        album.name
                    || 'Untitled album'
                    )}
                </strong>

                <span
                  class="
                    album-picker-description
                  ">
                  ${escapeHtml(
                        album.description
                    || 'No description'
                    )}
                </span>

                <span
                  class="
                    album-picker-meta
                  ">
                  <span>
                    ${albumPhotoCount}
                    ${
                        albumPhotoCount === 1
                            ? 'photo'
                            : 'photos'
                    }
                  </span>

                  ${
                        membershipLabel
                            ? `
                        <span
                          aria-hidden="true">
                          ·
                        </span>

                        <span
                          class="
                            album-picker-membership
                            ${
                                membership.complete
                                    ? 'complete'
                                    : ''
                            }
                          ">
                          ${escapeHtml(
                                membershipLabel
                            )}
                        </span>
                      `
                            : ''
                    }
                </span>
              </span>

              <input
                type="checkbox"
                value="${
                    escapeHtml(album.id)
                }"
                data-album-picker-choice
                ${
                    selected
                        ? 'checked'
                        : ''
                }
                ${
                    membership.complete
                        ? 'disabled'
                        : ''
                }
                aria-label="${
                    escapeHtml(
                        membership.complete
                            ? `${
                                album.name
                            } already contains all selected photos`
                            : `${
                                selected
                                    ? 'Remove'
                                    : 'Add'
                            } ${
                                album.name
                            }`
                    )
                }">
            </label>
          `;
        };

    const renderResults = () =>
    {
        const albums =
            visibleAlbums();

        if (albums.length)
        {
            return albums
                .map(renderAlbumRow)
                .join('');
        }

        if (query.trim())
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
                  No albums match this search
                </strong>

                <p>
                  Try another album name
                  or description.
                </p>

                <div
                  class="
                    album-picker-empty-actions
                  ">
                  <button
                    class="
                      button
                      secondary
                    "
                    type="button"
                    data-album-picker-clear-search>
                    Clear search
                  </button>

                  <button
                    class="
                      button
                      primary
                    "
                    type="button"
                    data-album-picker-create>
                    Create album
                  </button>
                </div>
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
                No albums yet
              </strong>

              <p>
                Create an album to
                organize the selected
                photos.
              </p>

              <button
                class="
                  button
                  primary
                "
                type="button"
                data-album-picker-create>
                Create album
              </button>
            </div>
          </div>
        `;
    };

    openModal(`
        <div
          class="
            modal
            photo-people-modal
            album-picker-modal
          "
          role="dialog"
          aria-modal="true"
          aria-labelledby="
            addToAlbumTitle
          ">

          <div class="modal-header">
            <div>
              <h2 id="addToAlbumTitle">
                Add to album
              </h2>

              <p>
                ${escapeHtml(
                    photoCountLabel()
                )}
              </p>
            </div>

            <button
              class="close-button"
              type="button"
              data-close
              aria-label="
                Close add to album dialog
              ">
              ${icon.close}
            </button>
          </div>

          <div
            class="
              album-picker-body
            ">

            <div
              class="
                album-picker-browse
              "
              data-album-picker-browse>

              <div
                class="
                  field
                  photo-people-search-field
                  album-picker-search
                ">
                <label
                  for="albumPickerSearch">
                  Find albums
                </label>

                <div
                  class="search-input">
                  ${icon.search}

                  <input
                    id="albumPickerSearch"
                    type="search"
                    data-album-picker-search
                    placeholder="Search albums"
                    autocomplete="off">
                </div>
              </div>

              <section
                class="
                  album-picker-results-panel
                ">

                <div
                  class="
                    album-picker-results-head
                  ">

                  <div
                    class="
                      album-picker-results-heading
                    ">
                    <strong
                      data-album-picker-results-title>
                      All albums
                    </strong>

                    <span
                      data-album-picker-results-meta>
                    </span>
                  </div>

                  <button
                    class="
                      button
                      secondary
                      compact
                      album-picker-new-button
                    "
                    type="button"
                    data-album-picker-create>
                    ${icon.plus}
                    New album
                  </button>
                </div>

                <div
                  class="
                    photo-people-results
                    album-picker-results
                  "
                  data-album-picker-results>
                </div>
              </section>
            </div>

            <form
              id="albumPickerCreateForm"
              class="album-picker-create"
              data-album-picker-create-form
              hidden>

              <div
                class="
                  album-picker-create-copy
                ">
                <strong>
                  Create a new album
                </strong>

                <span>
                  The new album will be
                  selected automatically.
                </span>
              </div>

              <div
                class="
                  album-picker-create-fields
                ">

                <div class="field">
                  <label
                    for="albumPickerName">
                    Album name
                  </label>

                  <input
                    id="albumPickerName"
                    data-album-picker-name
                    required
                    autocomplete="off"
                    placeholder="e.g. Whiskerfield family photos">
                </div>

                <div class="field">
                  <label
                    for="
                      albumPickerDescription
                    ">
                    Description
                  </label>

                  <textarea
                    id="albumPickerDescription"
                    data-album-picker-description
                    placeholder="e.g. Portraits, documents, and family photos connected to the Whiskerfield family.">
                  </textarea>
                </div>
              </div>
            </form>
          </div>

          <div
            class="
              modal-footer
              photo-people-footer
              album-picker-footer
            ">

            <span
              class="
                photo-people-selection-count
              "
              data-album-picker-count>
            </span>

            <div
              class="
                album-picker-footer-actions
              "
              data-album-picker-footer-actions>
            </div>
          </div>
        </div>
      `);

    const modal =
        modalBackdrop.querySelector(
            '.album-picker-modal'
        );

    if (!modal) return;

    rpInitMembershipPicker(modal);

    const browsePanel =
        modal.querySelector(
            '[data-album-picker-browse]'
        );

    const createPanel =
        modal.querySelector(
            '[data-album-picker-create-form]'
        );

    const resultsHost =
        modal.querySelector(
            '[data-album-picker-results]'
        );

    const resultsTitle =
        modal.querySelector(
            '[data-album-picker-results-title]'
        );

    const resultsMeta =
        modal.querySelector(
            '[data-album-picker-results-meta]'
        );

    const countElement =
        modal.querySelector(
            '[data-album-picker-count]'
        );

    const footerActions =
        modal.querySelector(
            '[data-album-picker-footer-actions]'
        );

    const searchInput =
        modal.querySelector(
            '[data-album-picker-search]'
        );

    const nameInput =
        modal.querySelector(
            '[data-album-picker-name]'
        );

    const descriptionInput =
        modal.querySelector(
            '[data-album-picker-description]'
        );

    const refreshFooter = () =>
    {
        if (
            !countElement
          || !footerActions
        )
        {
            return;
        }

        if (createMode)
        {
            countElement.textContent =
                t('Create a new album');

            footerActions.innerHTML = `
            <button
              class="button secondary"
              type="button"
              data-album-picker-back>
              ${escapeHtml(
                    t('Cancel')
                )}
            </button>

            <button
              class="
                button
                primary
                album-picker-save
              "
              type="submit"
              form="albumPickerCreateForm"
              data-album-picker-create-save
              ${
                    createDraft.name.trim()
                        ? ''
                        : 'disabled'
                }>
              ${escapeHtml(
                    t('Create and select')
                )}
            </button>
          `;

            return;
        }

        countElement.textContent =
            selectionLabel();

        footerActions.innerHTML = `
          <button
            class="button secondary"
            type="button"
            data-album-picker-cancel>
            ${escapeHtml(
                t('Cancel')
            )}
          </button>

          <button
            class="
              button
              primary
              album-picker-save
            "
            type="button"
            data-album-picker-save
            ${
                albumDecisions.size
                    ? ''
                    : 'disabled'
            }>
            ${escapeHtml(
                saveLabel()
            )}
          </button>
        `;
    };

    const refreshResults = () =>
    {
        const albums =
            visibleAlbums();

        const total =
            allAlbums().length;

        const hasQuery =
            Boolean(
                query.trim()
            );

        if (resultsTitle)
        {
            resultsTitle.textContent =
                t(
                    hasQuery
                        ? 'Search results'
                        : 'All albums'
                );
        }

        if (resultsMeta)
        {
            const source =
                hasQuery
                    ? `${albums.length} of ${total} albums`
                    : `${total} ${
                        total === 1
                            ? 'album'
                            : 'albums'
                    }`;

            resultsMeta.textContent =
                translateText(source);
        }

        if (resultsHost)
        {
            resultsHost.innerHTML =
                renderResults();

            localizeUI(
                resultsHost
            );
            rpRefreshMembershipRows(resultsHost);
            resultsHost.querySelectorAll('[data-album-picker-choice]').forEach(input =>
            {
                const membership = getAlbumSelectedPhotoMembership(input.value, photoIds);
                input.indeterminate = membership.existingCount > 0 && !membership.complete && !albumDecisions.has(input.value);
            });
        }

        refreshFooter();
    };

    const showBrowse = () =>
    {
        createMode = false;

        browsePanel.hidden = false;
        createPanel.hidden = true;

        refreshResults();

        requestAnimationFrame(
            () =>
            {
                modal.querySelector('.album-picker-new-button')?.focus({
                    preventScroll: true
                });
            }
        );
    };

    const showCreate = () =>
    {
        createMode = true;

        browsePanel.hidden = true;
        createPanel.hidden = false;

        if (nameInput)
        {
            nameInput.value =
                createDraft.name;
        }

        if (descriptionInput)
        {
            descriptionInput.value =
                createDraft.description;
        }

        refreshFooter();

        requestAnimationFrame(
            () =>
            {
                nameInput?.focus({
                    preventScroll: true
                });
            }
        );
    };

    const requestReturn = rpMembershipReturn(modal, { isCreating: () => createMode,
        isDirty: () => Boolean(createDraft.name.trim() || createDraft.description.trim()), returnToResults: () =>
        {
            createDraft.name = ''; createDraft.description = '';
            showBrowse();
        } });

    searchInput?.addEventListener(
        'input',
        event =>
        {
            query =
                event.currentTarget.value;

            refreshResults();
        }
    );

    nameInput?.addEventListener(
        'input',
        event =>
        {
            createDraft.name =
                event.currentTarget.value;

            refreshFooter();
        }
    );

    descriptionInput
        ?.addEventListener(
            'input',
            event =>
            {
                createDraft.description =
                    event.currentTarget.value;
            }
        );

    createPanel.addEventListener(
        'submit',
        event =>
        {
            event.preventDefault();

            const name =
                createDraft.name.trim();

            if (!name)
            {
                nameInput?.focus();
                return;
            }

            const album = {
                id:
              `album-${Date.now()}`,

                projectId,

                name,

                description:
              createDraft.description
                  .trim(),

                createdAt:
              new Date()
                  .toISOString()
            };

            sampleData.albums.push(
                album
            );

            selectedAlbumIds.add(
                album.id
            );

            createdAlbumId = album.id;
            albumDecisions.set(album.id, true);
            createDraft.name = '';
            createDraft.description = '';

            showBrowse();

            requestAnimationFrame(
                () =>
                {
                    modal
                        .querySelector(
                            `[data-album-picker-row="${
                                CSS.escape(album.id)
                            }"]`
                        )
                        ?.scrollIntoView({
                            block: 'nearest'
                        });
                }
            );
        }
    );

    modal.addEventListener(
        'change',
        event =>
        {
            const checkbox =
                event.target.closest(
                    '[data-album-picker-choice]'
                );

            if (!checkbox) return;

            const albumId =
                checkbox.value;

            if (checkbox.checked)
            {
                selectedAlbumIds.add(
                    albumId
                );
            }
            else
            {
                selectedAlbumIds.delete(
                    albumId
                );
            }

            const membership = getAlbumSelectedPhotoMembership(albumId, photoIds);
            if ((checkbox.checked && membership.complete) || (!checkbox.checked && !membership.existingCount)) albumDecisions.delete(albumId);
            else albumDecisions.set(albumId, checkbox.checked);

            refreshResults();
        }
    );

    modal.addEventListener(
        'click',
        event =>
        {
            if (
                event.target.closest(
                    '[data-album-picker-cancel]'
                )
            )
            {
                closeModal();
                return;
            }
            if (
                event.target.closest(
                    '[data-album-picker-create]'
                )
            )
            {
                showCreate();
                return;
            }

            if (
                event.target.closest(
                    '[data-album-picker-back]'
                )
            )
            {
                requestReturn();
                return;
            }

            if (
                event.target.closest(
                    '[data-album-picker-clear-search]'
                )
            )
            {
                query = '';

                if (searchInput)
                {
                    searchInput.value = '';
                }

                refreshResults();

                searchInput?.focus({
                    preventScroll: true
                });

                return;
            }

            if (
                event.target.closest(
                    '[data-album-picker-save]'
                )
            )
            {
                if (!albumDecisions.size) return;
                const photos = photoIds.map(id => getPhoto(id, { projectId }));
                if (currentProjectId() !== projectId || photos.some(photo => !photo || photo.projectId !== projectId)
                    || [...albumDecisions.keys()].some(id => !getProjectAlbums(projectId).some(album => album.id === id)))
                { showToast(rpText('The selected records are no longer available.', 'Выбранные записи больше недоступны.')); return; }
                const updates = photos.map(photo =>
                {
                    const ids = new Set(photo.albumIds || []);
                    albumDecisions.forEach((linked, id) => linked ? ids.add(id) : ids.delete(id));
                    return { photo, ids: [...ids] };
                });
                const updatedAt = new Date().toISOString();
                updates.forEach(({ photo, ids }) => { photo.albumIds = ids; photo.updatedAt = updatedAt; });

                state.selectedPhotoIds = [];

                closeModal();
                renderAlbums();

                showToast(rpText('Album memberships updated.', 'Связи с альбомами обновлены.'));
            }
        }
    );

    refreshResults();
}

function removePhotoFromAlbum(
    photoId,
    albumId
)
{
    const photo = getPhoto(
        photoId,
        {
            projectId: currentProjectId()
        }
    );

    if (
        !photo
        || !(photo.albumIds || [])
            .includes(albumId)
    )
    {
        return false;
    }

    photo.albumIds =
        photo.albumIds.filter(
            id => id !== albumId
        );

    photo.updatedAt =
        new Date().toISOString();

    return true;
}

function openRemovePhotoFromAlbumConfirm(
    photoId,
    albumId
)
{
    const photo =
        getPhoto(photoId);

    const album =
        getProjectAlbums()
            .find(item => item.id === albumId);

    if (!photo || !album)
    {
        return;
    }

    const leavesCurrentView =
        state.albumsView === 'album'
        && state.activeAlbumId === album.id;

    openModal(`
        <div
          class="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="removePhotoAlbumTitle">

          <div class="modal-header">
            <div>
              <h2 id="removePhotoAlbumTitle">
                Remove from album?
              </h2>

              <p>
                ${escapeHtml(album.name)}
              </p>
            </div>

            <button
              class="close-button"
              type="button"
              data-close>
              ${icon.close}
            </button>
          </div>

          <div class="modal-body">
            <p>
              Remove this photo from
              “${escapeHtml(album.name)}”?
            </p>

            <p>
              The photo will remain in All photos
              and in any other albums.
            </p>

            ${
                leavesCurrentView
                    ? `
                  <p>
                    It will disappear from the
                    current album after removal.
                  </p>
                `
                    : ''
            }
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
              data-confirm-photo-album-remove>
              Remove from album
            </button>
          </div>
        </div>
      `);

    modalBackdrop
        .querySelector(
            '[data-confirm-photo-album-remove]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                closeModal();

                if (
                    removePhotoFromAlbum(
                        photo.id,
                        album.id
                    )
                )
                {
                    ensureSelectedAlbumPhoto();
                    renderAlbums();

                    showToast(
                        `Removed from ${album.name}.`
                    );
                }
            }
        );
}

function removeSelectedFromCurrentAlbum()
{
    const ids = new Set(state.selectedPhotoIds || []);
    if (!state.activeAlbumId || !ids.size) return;
    const now = new Date().toISOString();
    let changed = 0;
    sampleData.media.forEach(photo =>
    {
        if (!ids.has(photo.id) || !(photo.albumIds || []).includes(state.activeAlbumId)) return;
        photo.albumIds = photo.albumIds.filter(id => id !== state.activeAlbumId);
        photo.updatedAt = now;
        changed += 1;
    });
    state.selectedPhotoIds = [];
    ensureSelectedAlbumPhoto();
    renderAlbums();
    showToast(`${changed} photo${changed === 1 ? '' : 's'} removed from this album.`);
}

