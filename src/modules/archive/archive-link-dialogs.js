function archiveFilesForLinkAction(
    fileIds
)
{
    const files =
        archiveUniqueIds(
            fileIds
        )
            .map(id =>
                archiveFileById(
                    id
                )
            )
            .filter(Boolean);

    if (!files.length)
    {
        return [];
    }

    const projectId =
        files[0].projectId
        || currentProjectId();

    return files.filter(file =>
        (
            file.projectId
          || currentProjectId()
        ) === projectId
    );
}

function archiveCommonFileConnectionIds(
    files,
    entityType
)
{
    if (!files.length)
    {
        return [];
    }

    const remainingSets =
        files
            .slice(1)
            .map(file =>
                new Set(
                    archiveConnectionIds(
                        'file',
                        file.id,
                        entityType
                    )
                )
            );

    return archiveUniqueIds(
        archiveConnectionIds(
            'file',
            files[0].id,
            entityType
        )
    ).filter(recordId =>
        remainingSets.every(set =>
            set.has(
                recordId
            )
        )
    );
}

function archiveCommitFileConnections({
    fileIds =
        [],

    entityType =
        '',

    recordIds =
        []
} = {})
{
    const normalizedFileIds =
        archiveUniqueIds(
            fileIds
        );

    const normalizedRecordIds =
        archiveUniqueIds(
            recordIds
        );

    const result = {
        ok:
          false,

        fileCount:
          normalizedFileIds.length,

        recordCount:
          normalizedRecordIds.length,

        changedFileCount:
          0,

        addedLinkCount:
          0,

        failedWrites:
          []
    };

    if (
        !normalizedFileIds.length
        || !normalizedRecordIds.length
    )
    {
        return result;
    }

    if (
        entityType === 'place'
        && normalizedRecordIds.length > 1
    )
    {
        result.failedWrites.push({
            fileId: '',
            recordId: '',
            reason: 'Archive files support one place'
        });

        return result;
    }

    const files =
        normalizedFileIds.map(fileId =>
            archiveFileById(fileId)
        );

    const records =
        normalizedRecordIds.map(recordId =>
            archiveConnectionRecord(
                entityType,
                recordId
            )
        );

    files.forEach((file, index) =>
    {
        if (!file)
        {
            result.failedWrites.push({
                fileId:
              normalizedFileIds[index],

                recordId: '',
                reason: 'File not found'
            });
        }
    });

    records.forEach((record, index) =>
    {
        if (!record)
        {
            result.failedWrites.push({
                fileId: '',
                recordId:
              normalizedRecordIds[index],

                reason: 'Linked record not found'
            });
        }
    });

    files.filter(Boolean).forEach(file =>
    {
        records.filter(Boolean).forEach(record =>
        {
            if (
                file.projectId
            && record.projectId
            && file.projectId
              !== record.projectId
            )
            {
                result.failedWrites.push({
                    fileId:
                file.id,

                    recordId:
                record.id,

                    reason:
                'Records belong to different projects'
                });
            }
        });
    });

    if (result.failedWrites.length)
    {
        console.warn(
            '[Archive bulk links]',
            result.failedWrites
        );

        return result;
    }

    const writes =
        files.flatMap(file =>
            normalizedRecordIds
                .filter(recordId =>
                    !archiveConnectionIds(
                        'file',
                        file.id,
                        entityType
                    ).includes(recordId)
                )
                .map(recordId => ({
                    ownerType: 'file',
                    ownerId: file.id,
                    entityType,
                    entityId: recordId,
                    shouldLink: true
                }))
        );

    if (!writes.length)
    {
        return result;
    }

    const committed =
        archiveSetConnectionsAtomically(
            writes
        );

    if (!committed.ok)
    {
        result.failedWrites.push({
            fileId: '',
            recordId: '',
            reason: 'Relationships were not written'
        });

        console.warn(
            '[Archive bulk links]',
            result.failedWrites
        );

        return result;
    }

    result.addedLinkCount =
        committed.changedCount;

    result.changedFileCount =
        new Set(
            writes.map(write =>
                write.ownerId
            )
        ).size;

    result.ok =
        result.addedLinkCount > 0;

    if (
        result.failedWrites.length
    )
    {
        console.warn(
            '[Archive bulk links]',
            result.failedWrites
        );
    }

    return result;
}

function archiveBulkLinkSubtitle(
    files
)
{
    if (
        files.length === 1
    )
    {
        return files[0].name
          || 'Untitled file';
    }

    return `${files.length} selected files`;
}

function finishArchiveBulkLinkAction(
    fileIds
)
{
    const normalizedFileIds =
        archiveUniqueIds(
            fileIds
        );

    const firstFile =
        normalizedFileIds
            .map(fileId =>
                archiveFileById(
                    fileId
                )
            )
            .find(Boolean);

    state.archiveSelectedFileIds =
        [];

    state.archiveSelectedFileId =
        firstFile?.id
        || state.archiveSelectedFileId;

    state.archiveInspectorCollapsed =
        false;

    renderArchive();
}

function openArchiveFilesNoteModal(
    fileIds
)
{
    if (archiveUniqueIds(fileIds).length > 1)
        return rpOpenArchiveResourcePicker({ ownerType: 'file', ownerIds: fileIds, entityType: 'note' });
    const files =
        archiveFilesForLinkAction(
            fileIds
        );

    const ids =
        files.map(file =>
            file.id
        );

    if (!files.length)
    {
        return;
    }

    const singleFile =
        files.length === 1
            ? files[0]
            : null;

    const existingNoteIds =
        singleFile
            ? archiveNoteIdsForFile(
                singleFile
            )
            : archiveCommonFileConnectionIds(
                files,
                'note'
            );

    openNoteLinkPickerModal({
        projectId:
          files[0].projectId
          || currentProjectId(),

        autoFocusSearch:
          false,

        title:
          singleFile
              ? 'Add note'
              : 'Add notes',

        description:
          singleFile
              ? `Link existing notes to “${
                  singleFile.name
                || 'this file'
              }”.`
              : `Link existing notes to ${
                  files.length
              } selected files.`,

        existingNoteIds,

        includeArchived:
          false,

        existingStatus:
          'Already linked',

        existingMetaLabel:
          singleFile
              ? 'already linked'
              : 'linked to all selected files',

        createLabel:
          'Create linked note',

        /*
          Creating a Note from an Archive context
          currently accepts one owner only. Preserve
          it for one file and hide it in bulk mode.
        */
        onCreate:
          singleFile
              ? () =>
                  openNewNoteForContext(
                      'archiveFile',
                      singleFile.id
                  )
              : null,

        onSave:
          (selectedNoteIds, context) =>
          {
              if (context?.changes) return rpCommitArchivePickerChanges('file', ids, 'note', selectedNoteIds, context);
              if (singleFile)
              {
                  const currentFile =
                      archiveFileById(
                          singleFile.id
                      );

                  if (!currentFile)
                  {
                      return false;
                  }

                  const result =
                      archiveCommitFileConnections({
                          fileIds: [
                              currentFile.id
                          ],

                          entityType:
                    'note',

                          recordIds:
                    selectedNoteIds
                      });

                  return result.ok
                      ? result
                      : false;
              }

              const result =
                  archiveCommitFileConnections({
                      fileIds:
                  ids,

                      entityType:
                  'note',

                      recordIds:
                  selectedNoteIds
                  });

              if (!result.ok)
              {
                  showToast(
                      'No notes were linked.'
                  );

                  return false;
              }

              return result;
          },

        afterSave:
          singleFile
              ? renderArchive
              : () =>
              {
                  finishArchiveBulkLinkAction(
                      ids
                  );
              },
    });
}

function openArchiveFileNoteModal(
    fileId
)
{
    openArchiveFilesNoteModal(
        [
            fileId
        ]
    );
}

function openArchiveFilePlacesModal(fileId, query = '', resolveLegacy = false)
{
    const file = archiveFileById(fileId);
    if (!file) return;
    openNotesPlacesModal({
        query,
        linkContext: {
            projectId: file.projectId,
            title: 'Add places',
            subtitle: file.name || 'Untitled file',
            initialPlaceIds: archiveFilePlaceIds(file),
            getPlaceIds: () => { const current = archiveFileById(fileId, file.projectId); return current ? archiveFilePlaceIds(current) : []; },
            suggestedPlaceIds: archiveFilePlaceIds(file),
            onSave: (nextPlaceIds, context) => {
                const current = archiveFileById(fileId, file.projectId);
                const next = context?.changes && current
                    ? rpApplyConnectionChanges(archiveFilePlaceIds(current), context) : nextPlaceIds;
                if (!current || !archiveSetFilePlaces(current, next, { resolveLegacy })) {
                    showToast(t('Places could not be updated.'));
                    return false;
                }
                return true;
            },
            afterSave: renderArchive
        }
    });
}

function openArchiveFilesPlaceModal(
    fileIds
)
{
    if (archiveFilesForLinkAction(fileIds).length)
        return rpOpenArchiveResourcePicker({ ownerType: 'file', ownerIds: fileIds, entityType: 'place' });
    const files =
        archiveFilesForLinkAction(
            fileIds
        );

    if (!files.length)
    {
        return;
    }

    let selectedPlaceId = '';

    let selectedDraft = null;

    openModal(`
        <div
          class="modal notes-related-modal archive-link-picker-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="archivePlacePickerTitle">

          <div class="modal-header">
            <div>
              <h2 id="archivePlacePickerTitle">
                ${escapeHtml(t('Add places to files'))}
              </h2>
              <p>
                ${escapeHtml(t('Choose or create a place. Existing file places will stay linked.'))}
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

          <div class="modal-body form-grid">
            ${renderPlaceCombobox({
                id: 'archiveBulkPlaceInput',
                label: 'Find or create a place',
                value: '',
                selectedPlaceId: '',
                showAddress: false,
                inputAttrs: `data-place-project-id="${escapeHtml(files[0].projectId)}"`
            })}
          </div>

          <div class="modal-footer">
            <span
              class="archive-link-picker-status"
              data-archive-place-status
              aria-live="polite">
            </span>

            <div class="archive-modal-actions">
              <button
                class="button secondary"
                type="button"
                data-close>
                Cancel
              </button>

              <button
                class="button primary"
                type="button"
                data-archive-place-save>
                ${escapeHtml(t('Add place'))}
              </button>
            </div>
          </div>
        </div>
      `);

    const modal =
        modalBackdrop.querySelector(
            '.archive-link-picker-modal'
        );

    const status =
        modal.querySelector(
            '[data-archive-place-status]'
        );

    const save =
        modal.querySelector(
            '[data-archive-place-save]'
        );

    const updateStatus = () =>
    {
        const changedFiles =
            selectedPlaceId
                ? files.filter(file => !archiveFilePlaceIds(file).includes(selectedPlaceId)).length
                : 0;

        status.textContent =
            selectedPlaceId
                ? changedFiles
                    ? `${t('Files to link:')} ${changedFiles}`
                    : t('This place is already linked to every selected file')
                : selectedDraft?.text
                    ? `${t('Files to link:')} ${files.length}`
                    : t('Select a place');

        save.disabled =
            (!selectedPlaceId && !selectedDraft?.text)
          || (selectedPlaceId && changedFiles === 0);
    };

    bindPlaceComboboxes(modal);
    const placeInput = modal.querySelector('#archiveBulkPlaceInput');
    placeInput?.addEventListener('input', () =>
    {
        selectedDraft = readPlaceInputValue('#archiveBulkPlaceInput', modal);
        selectedPlaceId = selectedDraft.selectedPlaceId || '';
        updateStatus();
    });

    save.addEventListener(
        'click',
        () =>
        {
            if (save.disabled)
            {
                return;
            }

            let createdPlace = null;
            if (!selectedPlaceId && selectedDraft?.text)
            {
                const resolved = resolvePlaceAssignment(selectedDraft);
                selectedPlaceId = resolved.placeId;
                if (resolved.created) createdPlace = getPlace(resolved.placeId);
            }
            if (!selectedPlaceId) return;

            const changedFiles =
                files.filter(file =>
                    !archiveFilePlaceIds(file).includes(selectedPlaceId)
                );

            const writes = changedFiles.map(file => ({
                ownerType: 'file', ownerId: file.id,
                entityType: 'place', entityId: selectedPlaceId,
                shouldLink: true
            }));

            const committed =
                archiveSetConnectionsAtomically(
                    writes
                );

            if (!committed.ok)
            {
                if (createdPlace)
                {
                    const index = sampleData.places.indexOf(createdPlace);
                    if (index >= 0) sampleData.places.splice(index, 1);
                }
                showToast(
                    'The place could not be linked to every file.'
                );

                return;
            }

            const changedCount =
                changedFiles.length;

            closeModal();
            finishArchiveBulkLinkAction(
                files.map(file =>
                    file.id
                )
            );

            const message = rpLinkedCountMessage('files', changedCount);
            if (message) showToast(message);
        }
    );

    updateStatus();

    requestAnimationFrame(() =>
        modal
            .querySelector(
                '#archiveBulkPlaceInput'
            )
            ?.focus()
    );
}

function openArchiveSourcePeopleModal(
    sourceId
)
{
    const source =
        archiveSourceById(
            sourceId
        );

    if (!source)
    {
        showToast(
            'The source is no longer available.'
        );

        return;
    }

    const projectId =
        source.projectId
        || currentProjectId();

    const initialPersonIds =
        sourceTargetIds(
            source.id,
            'person',
            projectId
        );

    /*
        People connected to files from this source
        receive priority in Suggested people.
        All project people remain searchable.
      */
    const suggestedPersonIds =
        archiveUniqueIds(
            archiveFilesForSource(
                source.id
            ).flatMap(file =>
                file.linkedPersonIds
            || []
            )
        );

    openPeopleLinkModal({
        projectId,

        title:
          'Add people',

        subtitle:
          source.title
          || 'Untitled source',

        initialPersonIds,

        suggestedPersonIds,

        selectedHeading:
          'Linked people',

        saveLabel:
          'Save people',

        onSave:
          nextPersonIds =>
          {
              const currentSource =
                  archiveSourceById(
                      source.id,
                      projectId
                  );

              if (!currentSource)
              {
                  showToast(
                      'The source is no longer available.'
                  );

                  return false;
              }

              const currentIds =
                  new Set(
                      sourceTargetIds(
                          currentSource.id,
                          'person',
                          projectId
                      )
                  );

              const desiredIds =
                  new Set(
                      archiveUniqueIds(
                          nextPersonIds
                      )
                  );

              /*
              Save the entire edited selection:
              remove deselected people and add newly
              selected people in one atomic operation.
            */
              const writes = [
                  ...[...currentIds]
                      .filter(personId =>
                          !desiredIds.has(
                              personId
                          )
                      )
                      .map(personId => ({
                          ownerType:
                    'source',

                          ownerId:
                    currentSource.id,

                          entityType:
                    'person',

                          entityId:
                    personId,

                          shouldLink:
                    false
                      })),

                  ...[...desiredIds]
                      .filter(personId =>
                          !currentIds.has(
                              personId
                          )
                      )
                      .map(personId => ({
                          ownerType:
                    'source',

                          ownerId:
                    currentSource.id,

                          entityType:
                    'person',

                          entityId:
                    personId,

                          shouldLink:
                    true
                      }))
              ];

              const committed =
                  archiveSetConnectionsAtomically(
                      writes
                  );

              if (!committed.ok)
              {
                  showToast(
                      'People links could not be updated.'
                  );

                  return false;
              }

              /*
              Verify that the canonical sourceLinks
              collection now matches the modal state.
            */
              const savedIds =
                  new Set(
                      sourceTargetIds(
                          currentSource.id,
                          'person',
                          projectId
                      )
                  );

              const savedCorrectly =
                  savedIds.size
                === desiredIds.size
              && [...desiredIds].every(
                  personId =>
                      savedIds.has(
                          personId
                      )
              );

              if (!savedCorrectly)
              {
                  showToast(
                      'People links could not be updated.'
                  );

                  return false;
              }

              return committed;
          },

        afterSave:
          renderArchivePreservingSourceInspectorScroll,
    });
}

function openArchiveSourceEventsModal(
    sourceId
)
{
    const source =
        archiveSourceById(
            sourceId
        );

    if (!source)
    {
        showToast(
            'The source is no longer available.'
        );

        return;
    }

    const projectId =
        source.projectId
        || currentProjectId();

    const initiallyLinkedEventIds =
        sourceTargetIds(
            source.id,
            'event',
            projectId
        );

    /*
        People connected directly to the Source
        appear first in the Notes-style person list.
      */
    const primaryPersonIds =
        sourceTargetIds(
            source.id,
            'person',
            projectId
        );

    /*
        People connected through files from this
        Source are useful secondary suggestions.
      */
    const secondaryPersonIds =
        archiveUniqueIds(
            archiveFilesForSource(
                source.id
            ).flatMap(file =>
                file.linkedPersonIds
            || []
            )
        );

    openEventLinkModal({
        projectId,

        autoFocusSearch:
          false,

        title:
          'Add events',

        subtitle:
          source.title
          || 'Untitled source',

        initiallyLinkedEventIds,

        primaryPersonIds,

        secondaryPersonIds,

        alreadyLinkedTarget:
          'this source',

        onSave:
          selectedEventIds =>
          {
              const currentSource =
                  archiveSourceById(
                      source.id,
                      projectId
                  );

              if (!currentSource)
              {
                  showToast(
                      'The source is no longer available.'
                  );

                  return false;
              }

              const currentEventIds =
                  new Set(
                      sourceTargetIds(
                          currentSource.id,
                          'event',
                          projectId
                      )
                  );

              /*
              openEventLinkModal is additive:
              previously linked Events are disabled,
              and selectedEventIds contains new choices.
            */
              const eventIdsToAdd =
                  archiveUniqueIds(
                      selectedEventIds
                  ).filter(eventId =>
                      !currentEventIds.has(
                          eventId
                      )
                  );

              const writes =
                  eventIdsToAdd.map(
                      eventId => ({
                          ownerType:
                    'source',

                          ownerId:
                    currentSource.id,

                          entityType:
                    'event',

                          entityId:
                    eventId,

                          shouldLink:
                    true
                      })
                  );

              const committed =
                  archiveSetConnectionsAtomically(
                      writes
                  );

              if (!committed.ok)
              {
                  showToast(
                      'No events were linked.'
                  );

                  return false;
              }

              /*
              Verify the canonical sourceLinks data,
              including the unlikely case where the
              Source changed while the modal was open.
            */
              const savedEventIds =
                  new Set(
                      sourceTargetIds(
                          currentSource.id,
                          'event',
                          projectId
                      )
                  );

              const savedCorrectly =
                  selectedEventIds.every(
                      eventId =>
                          savedEventIds.has(
                              eventId
                          )
                  );

              if (!savedCorrectly)
              {
                  showToast(
                      'No events were linked.'
                  );

                  return false;
              }

              return {
                  ...committed,

                  addedLinkCount:
                eventIdsToAdd.length
              };
          },

        afterSave:
          renderArchivePreservingSourceInspectorScroll,
    });
}

function openArchiveSourceNotesModal(
    sourceId
)
{
    const source =
        archiveSourceById(
            sourceId
        );

    if (!source)
    {
        showToast(
            'The source is no longer available.'
        );

        return;
    }

    const projectId =
        source.projectId
        || currentProjectId();

    const existingNoteIds =
        sourceTargetIds(
            source.id,
            'note',
            projectId
        );

    openNoteLinkPickerModal({
        projectId,

        autoFocusSearch:
          false,

        title:
          'Add notes',

        description:
          `Link existing notes to “${
              source.title
            || 'Untitled source'
          }”.`,

        helperText:
          'Linked notes remain available in the Notes module.',

        existingNoteIds,

        includeArchived:
          false,

        existingStatus:
          'Already linked',

        existingMetaLabel:
          'already linked',

        createLabel:
          'Create linked note',

        onCreate:
          () =>
          {
              const currentSource =
                  archiveSourceById(
                      source.id,
                      projectId
                  );

              if (!currentSource)
              {
                  showToast(
                      'The source is no longer available.'
                  );

                  return;
              }

              /*
              Source is already supported by the
              canonical Notes context model.
            */
              openNewNoteForContext(
                  'source',
                  currentSource.id
              );
          },

        onSave:
          (selectedNoteIds, context) =>
          {
              if (context?.changes) return rpCommitArchivePickerChanges('source', [source.id], 'note', selectedNoteIds, context);
              const currentSource =
                  archiveSourceById(
                      source.id,
                      projectId
                  );

              if (!currentSource)
              {
                  showToast(
                      'The source is no longer available.'
                  );

                  return false;
              }

              const currentNoteIds =
                  new Set(
                      sourceTargetIds(
                          currentSource.id,
                          'note',
                          projectId
                      )
                  );

              const noteIdsToAdd =
                  archiveUniqueIds(
                      selectedNoteIds
                  ).filter(noteId =>
                      !currentNoteIds.has(
                          noteId
                      )
                  );

              const writes =
                  noteIdsToAdd.map(
                      noteId => ({
                          ownerType:
                    'source',

                          ownerId:
                    currentSource.id,

                          entityType:
                    'note',

                          entityId:
                    noteId,

                          shouldLink:
                    true
                      })
                  );

              const committed =
                  archiveSetConnectionsAtomically(
                      writes
                  );

              if (!committed.ok)
              {
                  showToast(
                      'No notes were linked.'
                  );

                  return false;
              }

              return {
                  ...committed,

                  addedLinkCount:
                committed.changedCount
              };
          },

        afterSave:
          renderArchivePreservingSourceInspectorScroll,
    });
}

function openArchiveSourcePhotosModal(
    sourceId
)
{
    const source =
        archiveSourceById(
            sourceId
        );

    if (!source)
    {
        showToast(
            'The source is no longer available.'
        );

        return;
    }

    const projectId =
        source.projectId
        || currentProjectId();

    const initialPhotoIds =
        sourceTargetIds(
            source.id,
            'photo',
            projectId
        );

    openPhotoLinkModal({
        projectId,

        title:
          'Add photos to source',

        description:
          `Selected and uploaded photos will be linked to ${
              source.title
            || 'Untitled source'
          }.`,

        ownerLabel:
          'this source',

        initiallyLinkedPhotoIds:
          initialPhotoIds,

        uploadDraftIdPrefix:
          'source-photo-upload-draft',

        uploadedPhotoIdPrefix:
          `photo-source-${source.id}`,

        onSave:
          (addedIds, context) =>
          {
              if (context?.changes) return rpCommitArchivePickerChanges('source', [source.id], 'photo', addedIds, context);
              const currentSource =
                  archiveSourceById(
                      source.id,
                      projectId
                  );

              if (!currentSource)
              {
                  return false;
              }

              const currentIds =
                  new Set(
                      sourceTargetIds(
                          currentSource.id,
                          'photo',
                          projectId
                      )
                  );

              const photoIdsToAdd =
                  archiveUniqueIds(
                      addedIds
                  ).filter(photoId =>
                      !currentIds.has(
                          photoId
                      )
                  );

              const writes =
                  photoIdsToAdd.map(
                      photoId => ({
                          ownerType:
                    'source',

                          ownerId:
                    currentSource.id,

                          entityType:
                    'photo',

                          entityId:
                    photoId,

                          shouldLink:
                    true
                      })
                  );

              const committed =
                  archiveSetConnectionsAtomically(
                      writes
                  );

              if (!committed.ok)
              {
                  return false;
              }

              const savedIds =
                  new Set(
                      sourceTargetIds(
                          currentSource.id,
                          'photo',
                          projectId
                      )
                  );

              const savedCorrectly =
                  addedIds.every(
                      photoId =>
                          savedIds.has(
                              photoId
                          )
                  );

              return {
                  ...committed,
                  ok:
                savedCorrectly
              };
          },

        afterSave:
          renderArchivePreservingSourceInspectorScroll,
    });
}

function openArchiveSourcePlacesModal(
    sourceId
)
{
    const source =
        archiveSourceById(
            sourceId
        );

    if (!source)
    {
        showToast(
            'The source is no longer available.'
        );

        return;
    }

    const projectId =
        source.projectId
        || currentProjectId();

    const initialPlaceIds =
        sourceTargetIds(
            source.id,
            'place',
            projectId
        );

    const filePlaceIds =
        archiveFilesForSource(
            source.id
        )
            .flatMap(file => archiveFilePlaceIds(file));

    const notePlaceIds =
        sourceTargetIds(
            source.id,
            'note',
            projectId
        ).flatMap(noteId =>
        {
            const note =
                getNote(
                    noteId,
                    {
                        projectId,
                        includeArchived:
                  true
                    }
                );

            return note?.linkedPlaceIds
            || [];
        });

    const eventPlaceIds =
        sourceTargetIds(
            source.id,
            'event',
            projectId
        )
            .map(eventId =>
                archiveConnectionRecord(
                    'event',
                    eventId
                )?.placeId
            )
            .filter(Boolean);

    const suggestedPlaceIds =
        archiveUniqueIds([
            ...filePlaceIds,
            ...notePlaceIds,
            ...eventPlaceIds
        ]);

    openNotesPlacesModal({
        linkContext: {
            projectId,

            title:
            'Add places',

            subtitle:
            source.title
            || 'Untitled source',

            initialPlaceIds,

            suggestedPlaceIds,

            renderContext:
            renderArchivePreservingSourceInspectorScroll,

            onSave:
            (nextPlaceIds, context) =>
            {
                if (context?.changes) return rpCommitArchivePickerChanges('source', [source.id], 'place', nextPlaceIds, context);
                const currentSource =
                    archiveSourceById(
                        source.id,
                        projectId
                    );

                if (!currentSource)
                {
                    showToast(
                        'The source is no longer available.'
                    );

                    return false;
                }

                const currentIds =
                    new Set(
                        sourceTargetIds(
                            currentSource.id,
                            'place',
                            projectId
                        )
                    );

                const desiredIds =
                    new Set(
                        archiveUniqueIds(
                            nextPlaceIds
                        )
                    );

                const writes = [
                    ...[...currentIds]
                        .filter(placeId =>
                            !desiredIds.has(
                                placeId
                            )
                        )
                        .map(placeId => ({
                            ownerType:
                      'source',

                            ownerId:
                      currentSource.id,

                            entityType:
                      'place',

                            entityId:
                      placeId,

                            shouldLink:
                      false
                        })),

                    ...[...desiredIds]
                        .filter(placeId =>
                            !currentIds.has(
                                placeId
                            )
                        )
                        .map(placeId => ({
                            ownerType:
                      'source',

                            ownerId:
                      currentSource.id,

                            entityType:
                      'place',

                            entityId:
                      placeId,

                            shouldLink:
                      true
                        }))
                ];

                const committed =
                    archiveSetConnectionsAtomically(
                        writes
                    );

                if (!committed.ok)
                {
                    showToast(
                        'Place links could not be updated.'
                    );

                    return false;
                }

                const savedIds =
                    new Set(
                        sourceTargetIds(
                            currentSource.id,
                            'place',
                            projectId
                        )
                    );

                const savedCorrectly =
                    savedIds.size
                  === desiredIds.size
                && [...desiredIds].every(
                    placeId =>
                        savedIds.has(
                            placeId
                        )
                );

                if (!savedCorrectly)
                {
                    showToast(
                        'Place links could not be updated.'
                    );

                    return false;
                }

                return committed;
            },

            afterSave:
            renderArchivePreservingSourceInspectorScroll
        }
    });
}

function rpCommitArchivePickerChanges(ownerType, ownerIds, entityType, selectedIds, context)
{
    const decisions = context.changes?.decisions || [
        ...(context.changes?.addedIds || []).map(id => ({ id, linked: true })),
        ...(context.changes?.removedIds || []).map(id => ({ id, linked: false }))
    ];
    return archiveSetConnectionsAtomically(ownerIds.flatMap(ownerId => decisions.map(({ id, linked }) => ({
        ownerType, ownerId, entityType, entityId: id, shouldLink: linked
    }))));
}

function openArchiveConnectionPicker({ ownerType, ownerIds, entityType })
{
    if (['photo', 'file', 'note', 'source', 'place'].includes(entityType))
    {
        return rpOpenArchiveResourcePicker({ ownerType, ownerIds, entityType });
    }
    const config = archiveEntityConfig(entityType);
    const ids = archiveUniqueIds(ownerIds);
    if (!config || !ids.length) return;
    const records = config.records();
    const existingSets = ids.map(ownerId => new Set(archiveConnectionIds(ownerType, ownerId, entityType)));
    const linkedToAll = recordId => existingSets.every(set => set.has(recordId));
    let query = '';
    const selected = new Set();
    openModal(`<div class="modal notes-related-modal archive-link-picker-modal" role="dialog" aria-modal="true" aria-labelledby="archiveLinkPickerTitle"><div class="modal-header"><div><h2 id="archiveLinkPickerTitle">${escapeHtml(config.addLabel)}</h2><p>Choose existing ${escapeHtml(config.title.toLowerCase())} to link. Linking does not move or duplicate records.</p></div><button class="close-button" type="button" data-close aria-label="Close">${icon.close}</button></div><div class="modal-body form-grid"><div class="archive-link-picker-toolbar"><label class="app-search-field archive-link-picker-search" aria-label="Search ${escapeHtml(config.title.toLowerCase())}">${icon.search}<input type="search" data-archive-link-search placeholder="Search ${escapeHtml(config.title.toLowerCase())}..." aria-label="Search ${escapeHtml(config.title.toLowerCase())}" autocomplete="off"></label>${entityType === 'source' ? `<button class="button secondary" type="button" aria-label="Create source" data-archive-create-source-from-picker>${icon.plus}<span class="source-create-full">Create source</span><span class="source-create-short">Create</span></button>` : ''}</div><div class="archive-modal-list" data-archive-link-results></div></div><div class="modal-footer"><span class="archive-link-picker-status" data-archive-link-count aria-live="polite">0 selected</span><div class="archive-modal-actions"><button class="button secondary" type="button" data-close>Cancel</button><button class="button primary" type="button" data-archive-link-save disabled>Add links</button></div></div></div>`);
    const modal = modalBackdrop.querySelector('.modal');
    const results = modal.querySelector('[data-archive-link-results]');
    const count = modal.querySelector('[data-archive-link-count]');
    const save = modal.querySelector('[data-archive-link-save]');
    const updateSelectionStatus = () =>
    {
        count.textContent = `${selected.size} selected`;
        save.disabled = selected.size === 0;
    };
    const refresh = () =>
    {
        const visible = records.filter(record => [config.label(record), config.meta(record)].join(' ').toLowerCase().includes(query.toLowerCase()));
        results.innerHTML = visible.length ? visible.map(record =>
        {
            const existing = linkedToAll(record.id);
            return `<label class="archive-modal-choice"><input type="checkbox" data-archive-link-choice value="${escapeHtml(record.id)}" ${existing ? 'checked disabled' : selected.has(record.id) ? 'checked' : ''}><span class="archive-modal-choice-copy"><strong>${escapeHtml(config.label(record))}</strong><span>${escapeHtml(config.meta(record))}</span></span><span>${existing ? 'Already linked' : ''}</span></label>`;
        }).join('') : `<div class="archive-section-empty">No matching ${escapeHtml(config.title.toLowerCase())}.</div>`;
        updateSelectionStatus();
    };
    modal.querySelector('[data-archive-link-search]')?.addEventListener('input', event =>
    {
        query = event.currentTarget.value; refresh();
    });
    modal.addEventListener('change', event =>
    {
        const input = event.target.closest('[data-archive-link-choice]');
        if (!input || input.disabled) return;
        if (input.checked) selected.add(input.value); else selected.delete(input.value);
        updateSelectionStatus();
    });
    modal
        .querySelector(
            '[data-archive-create-source-from-picker]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                closeModal();

                openArchiveSourceModal(
                    '',
                    {
                        onCreated:
                  createdSource =>
                  {
                      const committed =
                          archiveSetConnectionsAtomically(
                              ids.map(ownerId => ({
                                  ownerType,
                                  ownerId,
                                  entityType: 'source',
                                  entityId: createdSource.id,
                                  shouldLink: true
                              }))
                          );

                      if (
                          !committed.ok
                      || committed.changedCount
                        !== ids.length
                      )
                      {
                          showToast(
                              'Source created, but it could not be linked.'
                          );

                          return;
                      }

                      state.archiveSelectedFileIds =
                          [];

                      if (
                          ownerType === 'file'
                      )
                      {
                          state.archiveView =
                              'files';

                          state.archiveSelectedFileId =
                              ids[0]
                        || null;
                      }

                      renderArchive();

                      showToast(rpLinkedCountMessage('sources', 1));
                  }
                    }
                );
            }
        );
    save.addEventListener(
        'click',
        () =>
        {
            if (!selected.size)
            {
                return;
            }

            /*
            File bulk relationships use the verified
            Archive commit path.
          */
            if (
                ownerType === 'file'
            )
            {
                const result =
                    archiveCommitFileConnections({
                        fileIds:
                  ids,

                        entityType,

                        recordIds: [
                            ...selected
                        ]
                    });

                if (!result.ok)
                {
                    showToast(
                        `No ${
                            config.title.toLowerCase()
                        } were linked.`
                    );

                    return;
                }

                closeModal();

                finishArchiveBulkLinkAction(
                    ids
                );

                const kind = entityType === 'person' ? 'people' : 'events';
                const message = rpLinkedCountMessage(kind, selected.size);
                if (result.addedLinkCount > 0 && message) showToast(message);

                return;
            }

            /*
            Preserve the existing Source-inspector
            relationship workflow.
          */
            const writes =
                ids.flatMap(ownerId =>
                    [...selected]
                        .filter(recordId =>
                            !archiveConnectionIds(
                                ownerType,
                                ownerId,
                                entityType
                            ).includes(recordId)
                        )
                        .map(recordId => ({
                            ownerType,
                            ownerId,
                            entityType,
                            entityId: recordId,
                            shouldLink: true
                        }))
                );

            const committed =
                archiveSetConnectionsAtomically(
                    writes
                );

            const addedCount =
                committed.ok
                    ? committed.changedCount
                    : 0;

            if (!addedCount)
            {
                showToast(
                    'No links were added.'
                );

                return;
            }

            closeModal();

            if (
                ownerType === 'source'
            )
            {
                renderArchivePreservingSourceInspectorScroll();
            }
            else
            {
                renderArchive();
            }

            const kind = entityType === 'person' ? 'people' : 'events';
            const message = rpLinkedCountMessage(kind, new Set(writes.map(write => write.entityId)).size);
            if (message) showToast(message);
        }
    );
    refresh();
}

function openArchiveFilesSourceModal(
    fileIds
)
{
    const files =
        archiveFilesForLinkAction(
            fileIds
        );

    if (!files.length)
    {
        return;
    }

    /*
        A single selected file uses the same additive
        source picker as People, Albums, and Places.
      */
    if (files.length === 1)
    {
        const file =
            files[0];

        const fileLabel =
            file.name
          || file.title
          || 'this file';

        openSourcesForTargetModal({
            targetType:
            'file',

            autoFocusSearch:
            false,

            targetId:
            file.id,

            projectId:
            file.projectId,

            title:
            'Add sources',

            subtitle:
            `Connect existing sources to ${
                fileLabel
            }.`,

            afterSave:
            renderArchivePreservingFileInspectorScroll
        });

        return;
    }

    /*
        Keep the multi-owner Archive picker for bulk
        linking because the shared picker currently
        operates on one target record.
      */
    openArchiveConnectionPicker({
        ownerType:
          'file',

        ownerIds:
          files.map(file =>
              file.id
          ),

        entityType:
          'source'
    });
}

function openArchiveBulkLinkModal(
    fileIds,
    entityType
)
{
    const ids =
        archiveFilesForLinkAction(
            fileIds
        ).map(file =>
            file.id
        );

    if (!ids.length)
    {
        return;
    }

    if (
        entityType === 'person'
    )
    {
        openArchiveFilesPeopleModal(
            ids
        );

        return;
    }

    if (
        entityType === 'event'
    )
    {
        openArchiveFilesEventsModal(
            ids
        );

        return;
    }

    if (
        entityType === 'note'
    )
    {
        openArchiveFilesNoteModal(
            ids
        );

        return;
    }

    if (
        entityType === 'source'
    )
    {
        openArchiveFilesSourceModal(
            ids
        );

        return;
    }

    if (
        entityType === 'place'
    )
    {
        openArchiveFilesPlaceModal(
            ids
        );

        return;
    }
}

function openArchiveAddLinksMenu(
    fileIds
)
{
    const files =
        archiveFilesForLinkAction(
            fileIds
        );

    if (!files.length)
    {
        return;
    }

    const ids =
        files.map(file =>
            file.id
        );

    openModal(`
        <div
          class="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="archiveAddLinksTitle">

          <div class="modal-header">
            <div>
              <h2
                id="archiveAddLinksTitle">

                Add links
              </h2>

              <p>
                Connect the selected ${
                    ids.length === 1
                        ? 'file'
                        : 'files'
                } to genealogy records.
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

          <div class="modal-body">
            <div
              class="
                archive-action-grid
              ">

              <button
                class="button secondary"
                type="button"
                data-archive-link-menu="person">

                ${icon.profile}
                People
              </button>

              <button
                class="button secondary"
                type="button"
                data-archive-link-menu="event">

                ${icon.calendar}
                Events
              </button>

              <button
                class="button secondary"
                type="button"
                data-archive-link-menu="note">

                ${icon.note}
                Notes
              </button>

              <button
                class="button secondary"
                type="button"
                data-archive-link-menu="place">

                ${icon.mapPin}
                Places
              </button>

              <button
                class="button secondary"
                type="button"
                data-archive-link-menu="source">

                ${icon.archive}
                Sources
              </button>
            </div>
          </div>

          <div class="modal-footer">
            <button
              class="button secondary"
              type="button"
              data-close>

              Cancel
            </button>
          </div>
        </div>
      `);

    modalBackdrop
        .querySelectorAll(
            '[data-archive-link-menu]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    const entityType =
                        button.dataset
                            .archiveLinkMenu;

                    closeModal();

                    openArchiveBulkLinkModal(
                        ids,
                        entityType
                    );
                }
            );
        });
}

function openArchiveUnlinkConfirm({
    ownerType,
    ownerId,
    entityType,
    entityId
})
{
    const config =
        archiveEntityConfig(
            entityType
        );

    const record =
        archiveConnectionRecord(
            entityType,
            entityId
        );

    const owner =
        ownerType === 'source'
            ? archiveSourceById(
                ownerId
            )
            : ownerType === 'file'
                ? archiveFileById(
                    ownerId
                )
                : null;

    if (
        !config
        || !record
        || !owner
    )
    {
        return;
    }

    const recordLabel =
        config.label(record);

    const ownerLabel =
        ownerType === 'source'
            ? (
                owner.title
              || 'Untitled source'
            )
            : (
                owner.name
              || owner.title
              || 'Untitled file'
            );

    const ownerKind =
        ownerType === 'source'
            ? 'source'
            : 'file';

    const relationshipCopy =
        state.language === 'ru'
            ? `Связь между «${recordLabel}» и ${
                ownerType === 'source'
                    ? 'источником'
                    : 'файлом'
            } «${ownerLabel}» будет удалена. Обе записи останутся в проекте.`
            : `“${recordLabel}” will no longer be linked to the ${ownerKind} “${ownerLabel}”. Neither record will be deleted.`;

    openModal(`
        <div
          class="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="archiveUnlinkTitle">

          <div class="modal-header">
            <div>
              <h2 id="archiveUnlinkTitle">
                ${escapeHtml(
                    t(
                        `Unlink ${config.singular}?`
                    )
                )}
              </h2>

              <p>
                ${escapeHtml(
                    recordLabel
                )}
              </p>
            </div>

            <button
              class="close-button"
              type="button"
              data-close
              aria-label="${escapeHtml(
                    t('Close')
                )}">
              ${icon.close}
            </button>
          </div>

          <div class="modal-body">
            <div class="unlink-relationship-warning">
              <strong>
                ${escapeHtml(
                    t(
                        'Only the connection will be removed.'
                    )
                )}
              </strong>

              <span>
                ${escapeHtml(
                    relationshipCopy
                )}
              </span>
            </div>
          </div>

          <div class="modal-footer">
            <button
              class="button secondary"
              type="button"
              data-close>
              ${escapeHtml(
                    t('Cancel')
                )}
            </button>

            <button
              class="button danger"
              type="button"
              data-archive-unlink-confirm>
              ${escapeHtml(
                    t('Unlink')
                )}
            </button>
          </div>
        </div>
      `);

    modalBackdrop
        .querySelector(
            '[data-archive-unlink-confirm]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                if (
                    !archiveSetConnection(
                        ownerType,
                        ownerId,
                        entityType,
                        entityId,
                        false
                    )
                )
                {
                    showToast(
                        'The link could not be removed.'
                    );

                    return;
                }

                if (ownerType === 'file' && entityType === 'person')
                {
                    const file = archiveFileById(ownerId);
                    if (file?.personRegions)
                    {
                        const regions = { ...file.personRegions };
                        delete regions[entityId];
                        file.personRegions = regions;
                    }
                }

                closeModal();

                if (
                    ownerType === 'source'
              && state.archiveView
                === 'sources'
                )
                {
                    renderArchivePreservingSourceInspectorScroll();
                }
                else
                {
                    renderArchive();
                }

                showToast(
                    'Link removed.'
                );
            }
        );
}

function deleteArchiveFilesPermanently(fileIds)
{
    const ids = new Set(fileIds);
    ids.forEach(archiveReleaseDocument);
    removeSourceLinksForTargets(
        'file',
        [...ids]
    );
    (sampleData.notes || []).forEach(note =>
    {
        note.linkedArchiveFileIds = (note.linkedArchiveFileIds || []).filter(id => !ids.has(id));
    });
    sampleData.archiveFiles = (sampleData.archiveFiles || []).filter(file => !ids.has(file.id));
    if (ids.size) markPrototypeSessionEdited();
    state.archiveSelectedFileIds = [];
    if (ids.has(state.archiveSelectedFileId)) state.archiveSelectedFileId = null;
}

function openArchiveDeleteFileConfirm(fileIds)
{
    const files = archiveUniqueIds(fileIds).map(id => archiveFileById(id)).filter(Boolean);
    if (!files.length) return;
    const label = files.length === 1 ? files[0].name : `${files.length} files`;
    const impact = files.length === 1
        ? 'The file and all links to People, Events, Notes, Places, and Sources will be removed. Connected records will not be deleted.'
        : 'The files and all links to People, Events, Notes, Places, and Sources will be removed. Connected records will not be deleted.';
    openModal(`<div class="modal" role="dialog" aria-modal="true" aria-labelledby="archiveDeleteFileTitle"><div class="modal-header"><div><h2 id="archiveDeleteFileTitle">Delete permanently?</h2><p>${escapeHtml(label)}</p></div><button class="close-button" type="button" data-close aria-label="Close">${icon.close}</button></div><div class="modal-body"><div class="archive-delete-summary"><strong>This action cannot be undone.</strong><span>${escapeHtml(t(impact))}</span></div></div><div class="modal-footer"><button class="button secondary" type="button" data-close>Cancel</button><button class="button danger" type="button" data-archive-delete-file-confirm>Delete permanently</button></div></div>`);
    modalBackdrop.querySelector('[data-archive-delete-file-confirm]')?.addEventListener('click', () =>
    {
        deleteArchiveFilesPermanently(files.map(file => file.id));
        closeModal();
        renderArchive();
        showToast(files.length === 1 ? 'File permanently deleted.' : 'Files permanently deleted.');
    });
}

function openArchiveDeleteFolderConfirm(folderId)
{
    const folder = archiveFolderById(folderId);
    if (!folder)
    {
        return;
    }
    const impact = archiveFolderImpact(folder.id);
    openModal(`<div class="modal" role="dialog" aria-modal="true" aria-labelledby="archiveDeleteFolderTitle"><div class="modal-header"><div><h2 id="archiveDeleteFolderTitle">Delete folder permanently?</h2><p>${escapeHtml(folder.name)}</p></div><button class="close-button" type="button" data-close aria-label="Close">${icon.close}</button></div><div class="modal-body"><div class="archive-delete-summary"><strong>This action cannot be undone.</strong><span>${impact.folders} nested ${impact.folders === 1 ? 'folder' : 'folders'} and ${impact.files} ${impact.files === 1 ? 'file' : 'files'} will be permanently deleted. Connections will be removed; connected genealogy records will remain.</span></div></div><div class="modal-footer"><button class="button secondary" type="button" data-close>Cancel</button><button class="button danger" type="button" data-archive-delete-folder-confirm>Delete permanently</button></div></div>`);
    modalBackdrop
        .querySelector(
            '[data-archive-delete-folder-confirm]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                const parentId =
                    archiveFolderParentId(
                        folder
                    );

                const ids =
                    new Set(
                        impact.folderIds
                    );

                deleteArchiveFilesPermanently(
                    archiveProjectFiles()
                        .filter(file =>
                            ids.has(
                                archiveFileFolderId(
                                    file
                                )
                            )
                        )
                        .map(file =>
                            file.id
                        )
                );

                sampleData.archiveFolders =
                    (
                        sampleData.archiveFolders
                || []
                    ).filter(item =>
                        !ids.has(
                            item.id
                        )
                    );
                if (ids.size) markPrototypeSessionEdited();

                closeModal();

                archiveNavigateToLocation(
                    {
                        view:
                  'files',

                        folderId:
                  parentId,

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
                        recordHistory:
                  false,

                        expandCurrent:
                  true
                    }
                );

                showToast(
                    'Folder permanently deleted.'
                );
            }
        );
}

function archiveEffectiveBulkItems(folderIds, fileIds)
{
    const selectedFolders = archiveUniqueIds(folderIds).map(id => archiveFolderById(id)).filter(Boolean);
    const descendantIds = new Set(selectedFolders.flatMap(folder => archiveFolderDescendantIds(folder.id)));
    const folders = selectedFolders.filter(folder => !selectedFolders.some(parent =>
        parent.id !== folder.id && archiveFolderDescendantIds(parent.id).includes(folder.id)));
    const files = archiveUniqueIds(fileIds).map(id => archiveFileById(id))
        .filter(file => file && !descendantIds.has(archiveFileFolderId(file)));
    return { folders, files };
}

function archiveCanMoveBulkItems(items, destinationId)
{
    if (destinationId && !archiveFolderById(destinationId)) return false;
    if (items.folders.some(folder => archiveFolderDescendantIds(folder.id).includes(destinationId))) return false;
    return items.folders.some(folder => archiveFolderParentId(folder) !== destinationId)
        || items.files.some(file => archiveFileFolderId(file) !== destinationId);
}

function archiveMoveBulkItems(items, destinationId)
{
    if (!archiveCanMoveBulkItems(items, destinationId)) return false;
    const folderSnapshots = items.folders.map(folder => ({ id: folder.id,
        parentId: archiveFolderParentId(folder), updatedAt: folder.updatedAt }));
    const fileSnapshots = items.files.map(file => ({ id: file.id,
        folderId: archiveFileFolderId(file), updatedAt: file.updatedAt, updated: file.updated }));
    const now = new Date().toISOString();
    items.folders.forEach(folder => { folder.parentId = destinationId; folder.updatedAt = now; });
    items.files.forEach(file => { file.folderId = destinationId; file.updatedAt = now; file.updated = 'Just now'; });
    markPrototypeSessionEdited();
    state.archiveSelectedFolderIds = [];
    state.archiveSelectedFileIds = [];
    state.archiveSelectedFolderItemId = null;
    state.archiveSelectedFileId = null;
    renderArchive();
    showActionToast({
        message: `${t('Moved selected items to')} ${archiveMoveFolderPath(destinationId)}.`,
        actions: [{ label: 'Undo', onClick: () => {
            folderSnapshots.forEach(snapshot => {
                const folder = archiveFolderById(snapshot.id);
                if (folder) { folder.parentId = snapshot.parentId; folder.updatedAt = snapshot.updatedAt; }
            });
            fileSnapshots.forEach(snapshot => {
                const file = archiveFileById(snapshot.id);
                if (file) { file.folderId = snapshot.folderId; file.updatedAt = snapshot.updatedAt; file.updated = snapshot.updated; }
            });
            renderArchive();
            showToast('Move undone.');
        }}]
    });
    return true;
}

function openArchiveBulkMoveModal(folderIds, fileIds)
{
    const items = archiveEffectiveBulkItems(folderIds, fileIds);
    if (!items.folders.length && !items.files.length) return;

    let selectedId = ARCHIVE_MOVE_NO_DESTINATION;
    let query = '';
    let searchExpanded = false;
    let creatingFolder = false;
    const expandedIds = new Set([null]);

    openModal(`<div class="modal archive-move-modal resource-picker" role="dialog"
        aria-modal="true" aria-labelledby="archiveBulkMoveTitle">
        <div class="modal-header"><div><h2 id="archiveBulkMoveTitle">${escapeHtml(t('Move selected items'))}</h2>
        <p>${escapeHtml(t('Choose a destination folder.'))}</p></div>
        <button class="close-button" type="button" data-close aria-label="${escapeHtml(t('Close'))}">${icon.close}</button></div>
        <div class="modal-body">
            <div class="archive-move-item-summary">
                <span class="archive-move-context-label">${escapeHtml(t('Moving'))}</span>
                <div class="archive-move-item-row">
                    <span class="archive-move-item-icon" aria-hidden="true">${items.folders.length ? icon.folderyellow : icon.file}</span>
                    <span class="archive-move-item-copy"><strong>${escapeHtml(archiveBulkSelectionLabel())}</strong></span>
                </div>
            </div>
            <div class="archive-move-content" data-archive-bulk-move-content></div>
        </div>
        <div class="modal-footer">
            <button class="button secondary" type="button" data-close>${escapeHtml(t('Cancel'))}</button>
            <button class="button primary" type="button" data-archive-bulk-move-confirm disabled>${escapeHtml(t('Move here'))}</button>
        </div>
    </div>`);

    const modal = modalBackdrop.querySelector('.archive-move-modal');
    const contentRoot = modal?.querySelector('[data-archive-bulk-move-content]');
    const confirm = modal?.querySelector('[data-archive-bulk-move-confirm]');
    const canUse = folderId => archiveCanMoveBulkItems(items, folderId);
    const canCreateInside = folderId => !items.folders.some(folder =>
        archiveFolderDescendantIds(folder.id).includes(folderId));

    const renderPicker = ({ focusSearch = false, focusFolderName = false } = {}) =>
    {
        if (!contentRoot) return;
        const hasDestination = archiveMoveHasDestination(selectedId);
        const breadcrumbs = hasDestination
            ? [{ id: ARCHIVE_ROOT_PICKER_VALUE, name: t('All files') },
                ...archiveFolderAncestors(selectedId).map(folder => ({ id: folder.id, name: folder.name }))]
            : [{ id: ARCHIVE_ROOT_PICKER_VALUE, name: t('Choose a folder') }];
        const currentCrumb = breadcrumbs.at(-1);
        const fullPath = breadcrumbs.map(crumb => crumb.name).join(' / ');
        const newFolderParentId = hasDestination ? selectedId : null;

        contentRoot.innerHTML = `
            <div class="archive-create-folder-path-row">
                <div class="archive-create-folder-path-context">
                    <span class="archive-create-folder-path-label">${escapeHtml(t('Destination'))}</span>
                    <nav class="rp-path archive-folder-path" aria-label="${escapeHtml(t('Destination'))}" aria-live="polite">
                        <span class="rp-path-icon" aria-hidden="true">${icon.folderyellow}</span>
                        ${breadcrumbs.slice(0, -1).map((crumb, index) => `<button class="${index ? 'archive-folder-crumb-intermediate' : ''}" type="button" data-archive-bulk-move-crumb="${escapeHtml(crumb.id)}" title="${escapeHtml(crumb.name)}">${escapeHtml(crumb.name)}</button><span class="${index ? 'archive-folder-crumb-intermediate' : ''}" aria-hidden="true">${icon.chevron}</span>`).join('')}
                        <span aria-current="page" class="${hasDestination ? '' : 'is-placeholder'}" title="${escapeHtml(fullPath)}">${escapeHtml(currentCrumb.name)}</span>
                    </nav>
                </div>
                <div class="archive-folder-inline-search ${searchExpanded ? 'is-expanded' : ''}">
                    <button type="button" class="icon-button" data-archive-bulk-move-search-toggle
                        aria-label="${escapeHtml(t(searchExpanded ? 'Close search' : 'Search folders'))}" aria-expanded="${searchExpanded}" aria-controls="archiveBulkMoveSearch" title="${escapeHtml(t(searchExpanded ? 'Close search' : 'Search folders'))}">${icon.search}</button>
                    <input id="archiveBulkMoveSearch" type="search" data-archive-bulk-move-search
                        aria-label="${escapeHtml(t('Search folders'))}" placeholder="${escapeHtml(t('Search folders'))}" value="${escapeHtml(query)}" ${searchExpanded ? '' : 'hidden'}>
                </div>
                <button class="button secondary archive-move-item-action" type="button" data-archive-bulk-move-new-folder>
                    ${icon.plus}<span>${escapeHtml(t('New folder'))}</span>
                </button>
            </div>
            ${creatingFolder ? `<form class="archive-move-new-folder-form" data-archive-bulk-move-new-folder-form>
                <div class="archive-move-new-folder-context"><span>${escapeHtml(t('Create inside'))}</span>
                    <strong>${escapeHtml(archiveMoveFolderPath(newFolderParentId))}</strong></div>
                <div class="archive-move-new-folder-fields">
                    <input data-archive-bulk-move-new-folder-name required maxlength="160"
                        aria-label="${escapeHtml(t('Folder name'))}" placeholder="${escapeHtml(t('Folder name'))}">
                    <button class="button secondary" type="button" data-archive-bulk-move-cancel-new-folder>${escapeHtml(t('Cancel'))}</button>
                    <button class="button primary" type="submit">${escapeHtml(t('Create'))}</button>
                </div>
            </form>` : ''}
            ${renderArchiveMovePicker({
                query, selectedId, expandedIds, movingFolder: null, currentFolderState: null
            })}`;

        contentRoot.querySelectorAll('[data-archive-move-select]').forEach(button =>
        {
            const destinationId = archiveFolderIdFromChoice(button.dataset.archiveMoveSelect);
            if (canUse(destinationId)) return;
            button.disabled = true;
            button.setAttribute('aria-disabled', 'true');
            button.title = t('Cannot move selected items here');
        });
        confirm.disabled = !hasDestination || !canUse(selectedId);
        localizeUI(modal, { suppressObserverReplay: true });
        requestAnimationFrame(() =>
        {
            if (focusSearch)
            {
                const input = modal.querySelector('[data-archive-bulk-move-search]');
                input?.focus();
                input?.setSelectionRange(input.value.length, input.value.length);
            }
            if (focusFolderName) modal.querySelector('[data-archive-bulk-move-new-folder-name]')?.focus();
        });
    };

    modal?.addEventListener('input', event =>
    {
        if (!event.target.matches('[data-archive-bulk-move-search]')) return;
        query = event.target.value;
        renderPicker({ focusSearch: true });
    });

    modal?.addEventListener('submit', event =>
    {
        const form = event.target.closest('[data-archive-bulk-move-new-folder-form]');
        if (!form) return;
        event.preventDefault();
        const parentId = archiveMoveHasDestination(selectedId) ? selectedId : null;
        if (!canCreateInside(parentId)) return;
        const nameInput = form.querySelector('[data-archive-bulk-move-new-folder-name]');
        const folder = createArchiveFolderRecord(nameInput?.value.trim() || '', parentId);
        if (!folder) { nameInput?.focus(); return; }
        expandedIds.add(parentId);
        selectedId = folder.id;
        query = '';
        searchExpanded = false;
        creatingFolder = false;
        renderPicker();
    });

    modal?.addEventListener('click', event =>
    {
        if (event.target.closest('[data-archive-bulk-move-search-toggle]'))
        {
            searchExpanded = !searchExpanded;
            if (!searchExpanded) query = '';
            renderPicker({ focusSearch: searchExpanded });
            return;
        }
        const crumb = event.target.closest('[data-archive-bulk-move-crumb]');
        if (crumb)
        {
            const id = archiveFolderIdFromChoice(crumb.dataset.archiveBulkMoveCrumb);
            if (!canUse(id)) return;
            selectedId = id;
            query = '';
            searchExpanded = false;
            renderPicker();
            return;
        }
        const toggle = event.target.closest('[data-archive-move-toggle]');
        if (toggle)
        {
            const id = archiveFolderIdFromChoice(toggle.dataset.archiveMoveToggle);
            if (expandedIds.has(id)) expandedIds.delete(id);
            else expandedIds.add(id);
            renderPicker();
            return;
        }
        const destination = event.target.closest('[data-archive-move-select]');
        if (destination)
        {
            if (destination.disabled) return;
            const id = archiveFolderIdFromChoice(destination.dataset.archiveMoveSelect);
            if (!canUse(id)) return;
            selectedId = id;
            renderPicker();
            return;
        }
        if (event.target.closest('[data-archive-bulk-move-new-folder]'))
        {
            const parentId = archiveMoveHasDestination(selectedId) ? selectedId : null;
            if (!canCreateInside(parentId)) return;
            creatingFolder = true;
            renderPicker({ focusFolderName: true });
            return;
        }
        if (event.target.closest('[data-archive-bulk-move-cancel-new-folder]'))
        {
            creatingFolder = false;
            renderPicker();
            return;
        }
        if (event.target.closest('[data-archive-bulk-move-confirm]'))
        {
            if (!archiveMoveHasDestination(selectedId) || !canUse(selectedId)) return;
            closeModal();
            archiveMoveBulkItems(items, selectedId);
        }
    });

    renderPicker();
}
function openArchiveBulkDeleteConfirm(folderIds, fileIds)
{
    const items = archiveEffectiveBulkItems(folderIds, fileIds);
    const deletedFolderIds = new Set(items.folders.flatMap(folder => archiveFolderDescendantIds(folder.id)));
    const deletedFiles = new Set([...items.files.map(file => file.id),
        ...archiveProjectFiles().filter(file => deletedFolderIds.has(archiveFileFolderId(file))).map(file => file.id)]);
    if (!deletedFolderIds.size && !deletedFiles.size) return;
    openModal(`<div class="modal" role="dialog" aria-modal="true" aria-labelledby="archiveBulkDeleteTitle">
        <div class="modal-header"><div><h2 id="archiveBulkDeleteTitle">${escapeHtml(t('Delete permanently?'))}</h2>
        <p>${escapeHtml(translateCountPhrase(`${deletedFolderIds.size} ${deletedFolderIds.size === 1 ? 'folder' : 'folders'}`))}, ${escapeHtml(translateCountPhrase(`${deletedFiles.size} ${deletedFiles.size === 1 ? 'file' : 'files'}`))}</p></div>
        <button class="close-button" type="button" data-close aria-label="${escapeHtml(t('Close'))}">${icon.close}</button></div>
        <div class="modal-body"><div class="archive-delete-summary"><strong>${escapeHtml(t('This action cannot be undone.'))}</strong>
        <span>${escapeHtml(t('Selected folders, their contents, selected files, and file links will be removed. Connected genealogy records will remain.'))}</span></div></div>
        <div class="modal-footer"><button class="button secondary" type="button" data-close>${escapeHtml(t('Cancel'))}</button>
        <button class="button danger" type="button" data-archive-bulk-delete-confirm>${escapeHtml(t('Delete permanently'))}</button></div></div>`);
    modalBackdrop.querySelector('[data-archive-bulk-delete-confirm]')?.addEventListener('click', () => {
        deleteArchiveFilesPermanently([...deletedFiles]);
        sampleData.archiveFolders = (sampleData.archiveFolders || []).filter(folder => !deletedFolderIds.has(folder.id));
        if (deletedFolderIds.size) markPrototypeSessionEdited();
        state.archiveSelectedFolderIds = [];
        state.archiveSelectedFileIds = [];
        state.archiveSelectedFolderItemId = null;
        const current = state.archiveSelectedFolderId;
        if (current && deletedFolderIds.has(current)) state.archiveSelectedFolderId = null;
        closeModal();
        renderArchive();
        showToast(t('Selected Archive items permanently deleted.'));
    });
}

function openArchiveDeleteSourceConfirm(sourceId)
{
    const source = archiveSourceById(sourceId);
    if (!source) return;
    openModal(`<div class="modal" role="dialog" aria-modal="true" aria-labelledby="archiveDeleteSourceTitle"><div class="modal-header"><div><h2 id="archiveDeleteSourceTitle">Delete source permanently?</h2><p>${escapeHtml(source.title)}</p></div><button class="close-button" type="button" data-close aria-label="Close">${icon.close}</button></div><div class="modal-body"><div class="archive-delete-summary"><strong>The Source record cannot be restored.</strong><span>Its connections will be removed. Linked files, Photos, People, Events, Notes, and Places will not be deleted.</span></div></div><div class="modal-footer"><button class="button secondary" type="button" data-close>Cancel</button><button class="button danger" type="button" data-archive-delete-source-confirm>Delete permanently</button></div></div>`);
    modalBackdrop.querySelector('[data-archive-delete-source-confirm]')?.addEventListener('click', () =>
    {
        removeSourceLinksForSource(
            source.id
        );
        sampleData.sources = (sampleData.sources || []).filter(item => item.id !== source.id);
        markPrototypeSessionEdited();
        state.archiveSelectedSourceId = null;
        closeModal();
        renderArchive();
        showToast('Source permanently deleted.');
    });
}

function openArchiveItemActionsPopover(
    type,
    id,
    anchor,
    point = null
)
{
    if (
        !(anchor instanceof HTMLElement)
    )
    {
        return;
    }

    const file =
        type === 'file'
            ? archiveFileById(
                id
            )
            : null;

    const folder =
        type === 'folder'
            ? archiveFolderById(
                id
            )
            : null;
    const folderIsCurrentLocation =
        Boolean(
            folder
          && folder.id
            === archiveNormalizeFolderId(
                state.archiveSelectedFolderId
            )
        );
    const source =
        type === 'source'
            ? archiveSourceById(
                id
            )
            : null;
    const sourceMenuInInspector =
        Boolean(
            source
          && anchor.closest(
              '.archive-inspector-toolbar'
          )
        );
    const item =
        file
        || folder
        || source;

    if (!item)
    {
        return;
    }

    /*
        Clicking the active More button again
        closes its menu instead of reopening it.
      */
    const alreadyOpen =
        anchor.getAttribute(
            'aria-expanded'
        ) === 'true'
        && Boolean(
            document.getElementById(
                'projectMenu'
            )
        );

    closeMenu();

    if (alreadyOpen)
    {
        return;
    }

    const label =
        file?.name
        || folder?.name
        || source?.title
        || 'Item';

    const menu =
        document.createElement(
            'div'
        );

    menu.className =
        'menu-popover';

    menu.id =
        'projectMenu';

    menu.setAttribute(
        'role',
        'menu'
    );

    menu.setAttribute(
        'aria-label',
        `More actions for ${label}`
    );

    if (file)
    {
        menu.innerHTML = `
          <button type="button" role="menuitem" data-archive-item-action="favorite">${escapeHtml(t(file.favorite ? 'Remove from favourites' : 'Add to favourites'))}</button>
          <button
            type="button"
            role="menuitem"
            data-archive-item-action="rename">

            Rename
          </button>

          <button
            type="button"
            role="menuitem"
            data-archive-item-action="move">

            Move
          </button>

          <button
            class="danger"
            type="button"
            role="menuitem"
            data-archive-item-action="delete">

            Delete permanently
          </button>
        `;
    }

    if (folder)
    {
        menu.innerHTML = `
          ${innerWidth <= 900 ? `<button type="button" role="menuitem" data-archive-item-action="details">${escapeHtml(t('Details'))}</button>` : ''}
          <button type="button" role="menuitem" data-archive-item-action="favorite">${escapeHtml(t(folder.favorite ? 'Remove from favourites' : 'Add to favourites'))}</button>
          ${
                folderIsCurrentLocation
                    ? ''
                    : `
                <button
                  type="button"
                  role="menuitem"
                  data-archive-item-action="open">

                  Open folder
                </button>
              `
            }

          <button
            type="button"
            role="menuitem"
            data-archive-item-action="rename">

            Rename
          </button>

          <button
            type="button"
            role="menuitem"
            data-archive-item-action="move">

            Move
          </button>

          <button
            class="danger"
            type="button"
            role="menuitem"
            data-archive-item-action="delete">

            Delete permanently
          </button>
        `;
    }

    if (source)
    {
        menu.innerHTML =
            sourceMenuInInspector
                ? `
              <button
                class="danger"
                type="button"
                role="menuitem"
                data-archive-item-action="delete">

                Delete permanently
              </button>
            `
                : `
              <button
                type="button"
                role="menuitem"
                data-archive-item-action="edit">

                Edit source
              </button>

              <button
                type="button"
                role="menuitem"
                data-archive-item-action="favorite">

                ${
                    source.favorite
                        ? 'Remove from favourites'
                        : 'Add to favourites'
                }
              </button>

              <button
                class="danger"
                type="button"
                role="menuitem"
                data-archive-item-action="delete">

                Delete permanently
              </button>
            `;
    }

    document.body.appendChild(
        menu
    );
    localizeUI(menu);

    /*
        Position after mounting so the actual
        menu dimensions are available.
      */
    const rect = point
        ? { left: point.x, right: point.x, top: point.y, bottom: point.y }
        : anchor.getBoundingClientRect();

    const viewportMargin =
        12;

    const gap =
        6;

    const left =
        Math.min(
            Math.max(viewportMargin, point ? point.x : rect.right - menu.offsetWidth),
            Math.max(viewportMargin, window.innerWidth - menu.offsetWidth - viewportMargin)
        );

    const belowTop =
        rect.bottom
        + gap;

    const top = point
        ? Math.min(Math.max(viewportMargin, point.y), Math.max(viewportMargin,
            window.innerHeight - menu.offsetHeight - viewportMargin))
        : belowTop + menu.offsetHeight <= window.innerHeight - viewportMargin
            ? belowTop
            : Math.max(viewportMargin, rect.top - menu.offsetHeight - gap);

    menu.style.left =
        `${left}px`;

    menu.style.top =
        `${top}px`;

    anchor.setAttribute(
        'aria-expanded',
        'true'
    );

    menu.addEventListener(
        'click',
        event =>
        {
            const actionButton =
                event.target.closest(
                    '[data-archive-item-action]'
                );

            if (!actionButton)
            {
                return;
            }

            const action =
                actionButton.dataset
                    .archiveItemAction;

            closeMenu();

            if (file)
            {
                if (action === 'favorite')
                {
                    file.favorite = !file.favorite;
                    renderArchive();
                    return;
                }
                if (
                    action === 'rename'
                )
                {
                    runAfterArchiveFileEditGuard(() => beginArchiveFileRename(file.id));

                    return;
                }

                if (
                    action === 'move'
                )
                {
                    openArchiveMoveModal({
                        fileIds:
                  [
                      file.id
                  ]
                    });

                    return;
                }

                if (
                    action === 'delete'
                )
                {
                    openArchiveDeleteFileConfirm(
                        [
                            file.id
                        ]
                    );
                }

                return;
            }

            if (folder)
            {
                if (action === 'favorite')
                {
                    folder.favorite = !folder.favorite;
                    renderArchive();
                    return;
                }
                if (action === 'details')
                {
                    selectArchiveFolderItem(folder.id);
                    main.querySelector(`[data-archive-row-id="${CSS.escape(folder.id)}"]`)?.focus({ preventScroll: true });
                    openMobileSurface('details');
                    return;
                }
                if (
                    action === 'open'
                )
                {
                    archiveOpenFolder(
                        folder.id
                    );

                    return;
                }

                if (
                    action === 'rename'
                )
                {
                    openArchiveRenameItemModal(
                        'folder',
                        folder.id
                    );

                    return;
                }

                if (
                    action === 'move'
                )
                {
                    openArchiveMoveModal({
                        folderId:
                  folder.id
                    });

                    return;
                }

                if (
                    action === 'delete'
                )
                {
                    openArchiveDeleteFolderConfirm(
                        folder.id
                    );
                }

                return;
            }

            if (source)
            {
                if (
                    action === 'edit'
                )
                {
                    openArchiveSourceModal(
                        source.id
                    );

                    return;
                }

                if (
                    action === 'favorite'
                )
                {
                    source.favorite =
                        !source.favorite;

                    renderArchive();

                    return;
                }

                if (
                    action === 'delete'
                )
                {
                    openArchiveDeleteSourceConfirm(
                        source.id
                    );
                }
            }
        }
    );

    bindMenuLifecycle(
        anchor
    );

    requestAnimationFrame(
        () =>
        {
            menu
                .querySelector(
                    '[role="menuitem"]'
                )
                ?.focus();
        }
    );
}

function openArchiveMobileChoiceMenu(anchor, kind, point = null)
{
    const wasOpen = anchor.getAttribute('aria-expanded') === 'true'
        && Boolean(document.getElementById('projectMenu'));
    closeMenu();
    if (wasOpen) return;
    const menu = document.createElement('div');
    menu.id = 'projectMenu';
    menu.className = 'menu-popover';
    menu.setAttribute('role', 'menu');
    const { folders, files } = archiveSelectedBulkItems();
    const allFavorite = [...folders, ...files].every(item => item.favorite);
    const bulkChoices = `${(kind === 'bulk' || kind === 'bulk-context') ? `<button type="button" role="menuitem" data-archive-mobile-choice="move">${escapeHtml(t('Move'))}</button><button type="button" role="menuitem" data-archive-mobile-choice="favorite">${escapeHtml(t(allFavorite ? 'Remove from favourites' : 'Add to favourites'))}</button>` : ''}
        ${!folders.length ? `<button type="button" role="menuitem" data-archive-mobile-choice="links">${escapeHtml(t('Add links'))}</button>` : ''}
        <button class="danger" type="button" role="menuitem" data-archive-mobile-choice="delete">${escapeHtml(t('Delete permanently'))}</button>`;
    menu.innerHTML = kind === 'add'
        ? `<button type="button" role="menuitem" data-archive-mobile-choice="files">${escapeHtml(t('Add files'))}</button><button type="button" role="menuitem" data-archive-mobile-choice="folder">${escapeHtml(t('New folder'))}</button>`
        : bulkChoices;
    document.body.appendChild(menu);
    const rect = point ? { left: point.x, right: point.x, top: point.y, bottom: point.y } : anchor.getBoundingClientRect();
    menu.style.left = `${Math.max(12, Math.min(point ? point.x : rect.right - menu.offsetWidth, innerWidth - menu.offsetWidth - 12))}px`;
    menu.style.top = `${point
        ? Math.max(12, Math.min(point.y, innerHeight - menu.offsetHeight - 12))
        : rect.bottom + menu.offsetHeight + 8 < innerHeight ? rect.bottom + 6 : Math.max(12, rect.top - menu.offsetHeight - 6)}px`;
    menu.addEventListener('click', event => {
        const choice = event.target.closest('[data-archive-mobile-choice]')?.dataset.archiveMobileChoice;
        if (!choice) return;
        closeMenu();
        if (choice === 'files') openArchiveAddFilesModal();
        else if (choice === 'folder') openArchiveCreateFolderFromTrigger(anchor);
        else main.querySelector(`[data-archive-selection-action="${choice}"]`)?.click();
    });
    bindMenuLifecycle(anchor);
}

function openArchiveConnectedRecordCommit(
    type,
    id
)
{
    if (
        type === 'photo'
    )
    {
        openAlbumsForPhoto(
            id
        );

        return;
    }
    if (
        type === 'person'
    )
    {
        openPlaceInspectorPerson(
            id
        );

        return;
    }

    if (
        type === 'note'
    )
    {
        openCentralNoteFromContext(
            id,

            state.archiveView
            === 'sources'
                ? {
                    type:
                    'source',

                    id:
                    state.archiveSelectedSourceId
                    || ''
                }
                : {
                    type:
                    'archiveFile',

                    id:
                    state.archiveSelectedFileId
                    || ''
                }
        );

        return;
    }

    if (
        type === 'place'
    )
    {
        state.activeModule =
            'Places';

        state.placesView =
            'all';

        state.selectedPlaceId =
            id;

        render();

        return;
    }

    if (
        type === 'source'
    )
    {
        archiveRememberCurrentLocation();

        state.archiveView =
            'sources';

        state.archiveSelectedSourceId =
            id;

        state.archiveInspectorCollapsed =
            false;

        renderArchive();

        return;
    }

    if (
        type === 'file'
    )
    {
        const file =
            archiveFileById(
                id
            );

        archiveNavigateToLocationCommit(
            {
                view:
              'files',

                folderId:
              archiveFileFolderId(
                  file
              ),

                search:
              '',

                searchScope:
              'folder',

                personFilterId:
              '',

                selectedFileId:
              file?.id
              || null,

                inspectorCollapsed:
              false
            },
            {
                expandCurrent:
              true
            }
        );

        return;
    }

    if (
        type === 'event'
    )
    {
        const event =
            archiveConnectionRecord(
                'event',
                id
            );

        const personId =
            event?.personIds?.[0];

        if (personId)
        {
            openPlaceInspectorPerson(
                personId
            );
        }
        else
        {
            showToast(
                'Opening this event is simulated.'
            );
        }
    }
}

function openArchiveConnectedRecord(
    type,
    id
)
{
    runAfterArchiveFileEditGuard(
        () =>
        {
            openArchiveConnectedRecordCommit(
                type,
                id
            );
        }
    );
}

function openSourceConnectedItems(sourceId, entityType)
{
    const source = archiveSourceById(sourceId);
    if (!source) return;

    if (entityType === 'note')
    {
        openNotesForContext('source', source.id);
        return;
    }

    const records = archiveSourceConnectionRecords(
        source,
        entityType
    );

    if (entityType === 'photo')
    {
        state.activeModule = 'Albums';
        state.albumsView = 'all';
        state.activeAlbumId = null;

        state.albumsFilters = {
            ...defaultAlbumFilters,
            sourceId: source.id
        };

        state.albumsSearch = '';
        state.selectedPhotoIds = [];
        state.selectedPhotoId = records[0]?.id || null;
        state.albumsDetailCollapsed = false;

        resetAlbumsPage();
        render();
        return;
    }

    if (entityType === 'file')
    {
        openArchiveLocation({
            view: 'files',
            folderId: null,
            search: '',
            fileFilters: {
                ...defaultArchiveFileFilters,
                sourceId: source.id
            },
            filterPresentation: 'flat',
            filterScopeFolderId: null,
            selectedFileId: records[0]?.id || null,
            inspectorCollapsed: true
        });
    }
}

