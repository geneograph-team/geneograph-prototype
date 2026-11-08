function openPeopleLinkModal({
    projectId,
    title =
        'Add people',
    subtitle =
        '',
    initialPersonIds =
        [],
    /*
        Used by additive workflows such as Archive
        bulk linking. These People are linked to
        every selected owner and cannot be removed
        from this modal.
      */
    existingPersonIds =
        [],

    suggestedPersonIds =
        [],

    selectedHeading =
        'Linked people',

    imageArea =
        null,

    saveLabel =
        'Save people',

    onSave,
    afterSave =
        () =>
        {}
} = {})
{
    if (
        !projectId
        || typeof onSave
          !== 'function'
    )
    {
        return;
    }

    const initialSelectedIds =
        new Set(
            (
                initialPersonIds
            || []
            ).filter(personId =>
            {
                const person =
                    getPerson(
                        personId
                    );

                return (
                    person
              && !person.deleted
              && person.projectId
                === projectId
                );
            })
        );

    const existingPersonIdSet =
        new Set(
            (
                existingPersonIds
          || []
            ).filter(personId =>
            {
                const person =
                    getPerson(
                        personId
                    );

                return (
                    person
            && !person.deleted
            && person.projectId
              === projectId
                );
            })
        );

    const selectedIds =
        new Set(
            initialSelectedIds
        );

    const initialRegions = imageArea ? { ...(imageArea.regions || {}) } : null;
    const regions = imageArea ? { ...initialRegions } : null;
    let activeAreaPersonId = imageArea ? [...selectedIds][0] || null : null;

    const areaChanged = () => imageArea && JSON.stringify(
        Object.fromEntries([...selectedIds].map(id => [id, normalizeFaceRegion(regions[id])]).filter(([, region]) => region))
    ) !== JSON.stringify(
        Object.fromEntries([...selectedIds].map(id => [id, normalizeFaceRegion(initialRegions[id])]).filter(([, region]) => region))
    );

    let query = '';

    const personName =
        person =>
            personResourceDisplayName(
                person
            )
          || 'Unnamed person';

    const personSearchText =
        person =>
            [
                personName(person),
                person?.names?.first,
                person?.names?.middle,
                person?.names?.last,
                person?.names?.maiden,
                albumPhotoPersonDates(
                    person
                ),
                getPlaceEventDisplay(
                    person?.birth
                ),
                getPlaceEventDisplay(
                    person?.death
                )
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

    const selectionChanged =
        () =>
            initialSelectedIds.size
            !== selectedIds.size
          || [
              ...initialSelectedIds
          ].some(personId =>
              !selectedIds.has(
                  personId
              )
          );

    /*
        People appearing in photos already
        linked to this Note are suggested first.
      */
    const suggestedPersonIdSet =
        new Set(
            suggestedPersonIds
          || []
        );

    const getCandidates = () =>
    {
        const normalizedQuery =
            query
                .trim()
                .toLowerCase();

        const ranked =
            getPeople(
                projectId
            )
                .filter(person =>
                    person?.id
              && !person.deleted
                )
                .filter(person =>
                    !selectedIds.has(
                        person.id
                    )
                )
            /*
              Existing links stay out of the default
              suggestions, but remain discoverable through
              an explicit search.
            */
                .filter(person =>
                    !existingPersonIdSet.has(
                        person.id
                    )
              || Boolean(
                  normalizedQuery
              )
                )

                .filter(person =>
                    !normalizedQuery
              || personSearchText(
                  person
              ).includes(
                  normalizedQuery
              )
                )
                .map(person =>
                {
                    const displayName =
                        personName(
                            person
                        ).toLowerCase();

                    const nameParts = [
                        person?.names?.first,
                        person?.names?.middle,
                        person?.names?.last,
                        person?.names?.maiden
                    ]
                        .filter(Boolean)
                        .map(value =>
                            String(
                                value
                            ).toLowerCase()
                        );

                    let score = 0;

                    if (normalizedQuery)
                    {
                        if (
                            displayName
                    === normalizedQuery
                        )
                        {
                            score = 500;
                        }
                        else if (
                            displayName.startsWith(
                                normalizedQuery
                            )
                        )
                        {
                            score = 400;
                        }
                        else if (
                            nameParts.some(value =>
                                value.startsWith(
                                    normalizedQuery
                                )
                            )
                        )
                        {
                            score = 300;
                        }
                        else if (
                            displayName.includes(
                                normalizedQuery
                            )
                        )
                        {
                            score = 200;
                        }
                        else
                        {
                            score = 100;
                        }
                    }
                    else if (
                        suggestedPersonIdSet.has(
                            person.id
                        )
                    )
                    {
                        score += 1000;
                    }

                    score += Math.min(
                        getPersonPhotoCount(
                            person.id
                        ),
                        50
                    );

                    return {
                        person,
                        score
                    };
                })
                .sort(
                    (
                        first,
                        second
                    ) =>
                        second.score
                  - first.score
                || personName(
                    first.person
                ).localeCompare(
                    personName(
                        second.person
                    )
                )
                );

        return {
            total:
            ranked.length,

            people:
            ranked
                .slice(0, 5)
                .map(item =>
                    item.person
                )
        };
    };

    const renderSelected = () =>
    {
        const people = [
            ...selectedIds
        ]
            .map(getPerson)
            .filter(person =>
                person
            && !person.deleted
            && person.projectId
              === projectId
            );

        if (!people.length)
        {
            return imageArea ? '' : `
          <div class="photo-people-selected-head">
            <strong>${escapeHtml(selectedHeading)}</strong>
            <span>0</span>
          </div>
          <p class="notes-people-empty-selected">${escapeHtml(t('No people tagged'))}</p>`;
        }

        return `
          <div class="photo-people-selected-head">
            <strong>
              ${escapeHtml(
                    selectedHeading
                )}
            </strong>

            <span>
              ${people.length}
            </span>
          </div>

          <div class="photo-people-selected-list">
            ${people
                .map(person =>
                {
                    const name =
                        personName(person);

                    return `
                  <button
                    class="photo-people-selected-chip"
                    type="button"
                    data-notes-people-remove="${escapeHtml(
                        person.id
                    )}"
                    aria-label="${escapeHtml(
                        `Remove ${name}`
                    )}">

                    ${renderPersonAvatar(
                        person,
                        'photo-people-chip-avatar',
                        {
                            element:
                          'span'
                        }
                    )}

                    <span class="photo-people-selected-name">
                      ${escapeHtml(
                            name
                        )}
                    </span>

                    <span
                      class="photo-people-selected-remove"
                      aria-hidden="true">

                      ${icon.close}
                    </span>
                  </button>
                `;
                })
                .join('')}
          </div>
        `;
    };

    const renderResults =
        candidates =>
        {
            if (
                !candidates.people.length
            )
            {
                return `
              <div class="photo-people-empty">
                ${
                    query.trim()
                        ? `
                      No matching people
                      found. Try another
                      name, date, place.
                    `
                        : `
                      No additional people
                      to suggest.
                    `
                }
              </div>
            `;
            }

            return candidates.people
                .map(person =>
                {
                    const name =
                        personName(
                            person
                        );

                    const alreadyLinked =
                        existingPersonIdSet.has(
                            person.id
                        );

                    const dates =
                        albumPhotoPersonDates(
                            person
                        )
                || 'Dates unknown';

                    return `
                <label
                  class="
                    photo-people-result

                    ${
                        alreadyLinked
                            ? 'is-already-linked'
                            : ''
                    }
                  "
                  ${
                        alreadyLinked
                            ? `
                        title="
                          Already linked to all
                          selected files
                        "
                      `
                            : ''
                    }>

                  ${renderPersonAvatar(
                        person,
                        'photo-people-result-avatar',
                        {
                            element:
                        'span'
                        }
                    )}

                  <span
                    class="
                      photo-people-result-copy
                    ">

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

                  <input
                    type="checkbox"
                    value="${escapeHtml(
                        person.id
                    )}"
                    data-notes-people-choice
                    ${
                        alreadyLinked
                            ? 'checked disabled'
                            : ''
                    }
                    aria-label="${escapeHtml(
                        alreadyLinked
                            ? `${name} is already linked`
                            : `Add ${name}`
                    )}">
                </label>
              `;
                })
                .join('');
        };

    const selectedPanelMarkup = `<section
              class="photo-people-selected-panel"
              data-notes-people-selected-panel
              hidden>
            </section>`;

    openModal(`
        <div
          class="
            modal
            photo-people-modal
            notes-people-modal
            ${imageArea ? 'archive-person-area-modal' : ''}
          "
          role="dialog"
          aria-modal="true"
          aria-labelledby="notesPeopleTitle">

          <div class="modal-header">
            <div>
              <h2 id="notesPeopleTitle">
                ${escapeHtml(
                    title
                )}
              </h2>

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

            <button
              class="close-button"
              type="button"
              data-close
              aria-label="${escapeHtml(t('Close'))}">

              ${icon.close}
            </button>
          </div>

          <div class="photo-people-body">
            ${imageArea ? '<div class="archive-person-area-list">' : ''}
            ${imageArea ? '' : '<div class="notes-person-search-column">'}

            <div
              class="
                field
                photo-people-search-field
              ">

              <label for="notesPeopleSearch">
                Find people
              </label>

              <div class="search-input">
                ${icon.search}

                <input
                  id="notesPeopleSearch"
                  type="search"
                  data-notes-people-search
                  placeholder="Search by name, dates, place, or branch"
                  autocomplete="off">
              </div>
            </div>

            ${imageArea ? selectedPanelMarkup : ''}

            <section class="photo-people-results-panel">
              <div
                class="photo-people-results"
                data-notes-people-choices>
              </div>
            </section>
            ${imageArea ? '' : '</div>'}
            ${imageArea ? '' : selectedPanelMarkup}
            ${imageArea ? '</div><section class="archive-person-area-workspace" data-archive-person-area-workspace></section>' : ''}
          </div>

          <div
            class="
              modal-footer
              photo-people-footer
            ">

            <span
              class="photo-people-selection-count"
              data-notes-people-selection-count
              aria-live="polite">
            </span>

            <div class="photo-people-footer-actions">

              <button
                class="button secondary"
                type="button"
                data-close>
                Cancel
              </button>

              <button
                class="
                  button
                  primary
                  photo-people-save
                "
                type="button"
                data-notes-people-save
                disabled>
                  ${escapeHtml(
                        saveLabel
                    )}
              </button>
            </div>
          </div>
        </div>
      `);

    const modal =
        modalBackdrop.querySelector(
            '.notes-people-modal'
        );

    if (!modal)
    {
        return;
    }

    const renderAreaWorkspace = () =>
    {
        if (!imageArea) return;
        if (!selectedIds.has(activeAreaPersonId)) activeAreaPersonId = [...selectedIds][0] || null;
        const workspace = modal.querySelector('[data-archive-person-area-workspace]');
        const activePerson = activeAreaPersonId ? getPerson(activeAreaPersonId) : null;
        const otherRegions = [...selectedIds]
            .filter(id => id !== activeAreaPersonId && regions[id])
            .map(id => ({ name: personName(getPerson(id)), region: regions[id] }));
        workspace.innerHTML = `<div class="archive-person-area-heading">
            <strong>${escapeHtml(t('Mark area in image'))}</strong>
            ${activePerson ? `<button class="panel-action" type="button" data-archive-person-area-clear ${regions[activeAreaPersonId] ? '' : 'disabled'}>${escapeHtml(t('Clear area'))}</button>` : ''}
          </div>
          ${activePerson ? `<label class="archive-person-area-choice"><span>${escapeHtml(t('Person'))}</span>
            <span class="common-select-shell"><select class="common-select" data-archive-person-area-person>${[...selectedIds].map(id => `<option value="${escapeHtml(id)}" ${id === activeAreaPersonId ? 'selected' : ''}>${escapeHtml(personName(getPerson(id)))}</option>`).join('')}</select><span class="common-select-chevron" aria-hidden="true">${icon.chevron}</span></span></label>` : `<p>${escapeHtml(t('Choose a person to mark an area.'))}</p>`}
          <div class="archive-person-area-stage">${renderFaceRegionSelector(imageArea,
              activePerson ? regions[activeAreaPersonId] : null,
              activePerson ? `${t('Marked area for')} ${personName(activePerson)}` : t('Archive image'), otherRegions,
              'Image area. Arrow keys move; Shift and arrow keys resize.')}</div>
          <p class="archive-person-area-hint">${escapeHtml(t('Drag on the image to mark a name or other evidence. Move or resize the box to adjust it.'))}</p>`;
        if (activePerson) bindFaceRegionSelector(workspace,
            () => normalizeFaceRegion(regions[activeAreaPersonId]),
            region => {
                if (region) regions[activeAreaPersonId] = region;
                else delete regions[activeAreaPersonId];
                modal.querySelector('[data-notes-people-save]').disabled = !(selectionChanged() || areaChanged());
                workspace.querySelector('[data-archive-person-area-clear]').disabled = !region;
            }, 'Image area. Arrow keys move; Shift and arrow keys resize.');
    };

    const refresh = () =>
    {
        const selectedHtml =
            renderSelected();

        const selectedPanel =
            modal.querySelector(
                '[data-notes-people-selected-panel]'
            );

        const candidates =
            getCandidates();

        selectedPanel.hidden =
            imageArea && !selectedHtml;

        selectedPanel.innerHTML =
            selectedHtml;

        modal
            .querySelector(
                '[data-notes-people-choices]'
            )
            .innerHTML =
                renderResults(
                    candidates
                );

        modal
            .querySelector(
                '[data-notes-people-selection-count]'
            )
            .textContent =
                `${selectedIds.size} ${
                    selectedIds.size === 1
                        ? 'person'
                        : 'people'
                } selected`;

        modal
            .querySelector(
                '[data-notes-people-save]'
            )
            .disabled =
                !(selectionChanged() || areaChanged());

        renderAreaWorkspace();

        localizeUI(
            modal
        );
    };

    modal
        .querySelector(
            '[data-notes-people-search]'
        )
        ?.addEventListener(
            'input',
            event =>
            {
                query =
                    event.currentTarget.value;

                refresh();
            }
        );

    modal.addEventListener(
        'change',
        event =>
        {
            if (event.target.matches('[data-archive-person-area-person]'))
            {
                activeAreaPersonId = event.target.value;
                renderAreaWorkspace();
                return;
            }
            const input =
                event.target.closest(
                    '[data-notes-people-choice]'
                );

            if (
                !input
            || input.disabled
            )
            {
                return;
            }

            const choiceIndex = [
                ...modal.querySelectorAll(
                    '[data-notes-people-choice]'
                )
            ].indexOf(input);

            selectedIds.add(
                input.value
            );

            if (imageArea) activeAreaPersonId = input.value;

            refresh();

            restoreModalChoiceFocus({
                modal,
                selector:
              '[data-notes-people-choice]',
                value:
              input.value,
                index:
              choiceIndex,
                fallbackSelector:
              '[data-notes-people-search]'
            });
        }
    );

    modal.addEventListener(
        'click',
        event =>
        {
            const remove =
                event.target.closest(
                    '[data-notes-people-remove]'
                );

            if (remove)
            {
                selectedIds.delete(
                    remove.dataset
                        .notesPeopleRemove
                );

                if (imageArea) delete regions[remove.dataset.notesPeopleRemove];

                refresh();
                return;
            }

            if (event.target.closest('[data-archive-person-area-clear]'))
            {
                delete regions[activeAreaPersonId];
                refresh();
                return;
            }

            if (
                event.target.closest(
                    '[data-notes-people-save]'
                )
            )
            {
                if (
                    !(selectionChanged() || areaChanged())
                )
                {
                    return;
                }

                const nextIds =
                    [
                        ...selectedIds
                    ];

                const saved =
                    onSave(
                        nextIds,
                        imageArea ? Object.fromEntries(nextIds.map(id => [id, normalizeFaceRegion(regions[id])]).filter(([, region]) => region)) : null
                    );

                if (
                    saved === false
                )
                {
                    return;
                }

                closeModal();

                afterSave();

                const added = [...selectedIds].filter(id =>
                    !initialSelectedIds.has(id) && !existingPersonIdSet.has(id)).length;
                const removed = [...initialSelectedIds].filter(id => !selectedIds.has(id)).length;
                const message = rpLinkChangeMessage('people', added, removed)
                    || (areaChanged() ? rpText('Connections updated.', 'Связи обновлены.') : '');
                if (message) showToast(message);
            }
        }
    );

    refresh();

    if (!imageArea)
    {
        modal.querySelector('[data-notes-people-search]')?.focus({ preventScroll: true });
    }
}

function openNotesPeopleModal()
{
    const note =
        selectedNote();

    if (!note)
    {
        return;
    }

    const suggestedPersonIds =
        getPhotosForNote(
            note.id,
            {
                projectId:
              note.projectId
            }
        ).flatMap(photo =>
            photo.personIds
          || []
        );

    openPeopleLinkModal({
        projectId:
          note.projectId,

        title:
          'Tag person',

        subtitle:
          note.title
          || 'Untitled note',

        initialPersonIds:
          note.linkedPersonIds
          || [],

        suggestedPersonIds,

        onSave:
          nextPersonIds =>
          {
              const currentNote =
                  getNote(
                      note.id,
                      {
                          projectId:
                    note.projectId,

                          includeArchived:
                    true
                      }
                  );

              if (!currentNote)
              {
                  showToast(
                      'The note is no longer available.'
                  );

                  return false;
              }

              setNoteEntityLinks(
                  currentNote.id,
                  'person',
                  nextPersonIds,
                  {
                      projectId:
                  currentNote.projectId
                  }
              );

              return true;
          },

        afterSave:
          renderNotesPreservingInteraction,

    });
}

function openArchiveFilesPeopleModal(
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

    const singleFile =
        files.length === 1
            ? files[0]
            : null;

    if (singleFile && archiveFileKind(singleFile) === 'img' && archiveCanViewFile(singleFile)) {
        openArchiveImagePeopleModal(singleFile.id, { mode: 'tag' });
        return;
    }

    const projectId =
        files[0].projectId
        || currentProjectId();

    const suggestedPersonIds =
        archiveUniqueIds(
            files.flatMap(file =>
                archiveFileSuggestedPersonIds(
                    file
                )
            )
        );

    const commonPersonIds =
        singleFile
            ? []
            : archiveCommonFileConnectionIds(
                files,
                'person'
            );

    const launchPicker = imageArea => openPeopleLinkModal({
        projectId,

        imageArea,

        title:
          singleFile ? 'Tag person' : 'Add people',

        subtitle:
          archiveBulkLinkSubtitle(
              files
          ),

        /*
          Preserve the right-panel single-file
          behavior. Bulk mode is additive only.
        */
        initialPersonIds:
          singleFile
              ? singleFile.linkedPersonIds
              || []
              : [],

        existingPersonIds:
          commonPersonIds,

        suggestedPersonIds,

        selectedHeading:
          singleFile
              ? 'Linked people'
              : 'People to add',

        saveLabel:
          singleFile
              ? 'Save people'
              : 'Add people',

        onSave:
          (nextPersonIds, nextRegions) =>
          {
              if (singleFile)
              {
                  const currentFile =
                      archiveFileById(
                          singleFile.id
                      );

                  if (!currentFile)
                  {
                      showToast(
                          'The file is no longer available.'
                      );

                      return false;
                  }

                  const saved = setArchiveFileConnectionIds(
                      currentFile.id,
                      'person',
                      nextPersonIds
                  );
                  if (saved && nextRegions)
                  {
                      currentFile.personRegions = nextRegions;
                  }
                  return saved;
              }

              const result =
                  archiveCommitFileConnections({
                      fileIds:
                  ids,

                      entityType:
                  'person',

                      recordIds:
                  nextPersonIds
                  });

              if (!result.ok)
              {
                  showToast(
                      'No people were linked.'
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

    const imageSource = singleFile && archiveFileKind(singleFile) === 'img'
        ? singleFile.previewUrl || singleFile.src : '';
    if (!imageSource)
    {
        launchPicker(null);
        return;
    }
    const image = new Image();
    image.onload = () => {
        if (archiveFileById(singleFile.id) !== singleFile || currentProjectId() !== projectId) return;
        launchPicker({ src: imageSource, width: image.naturalWidth,
            height: image.naturalHeight, regions: singleFile.personRegions || {} });
    };
    image.onerror = () => launchPicker(null);
    image.src = imageSource;
}

function openArchiveFilePeopleModal(
    fileId
)
{
    openArchiveFilesPeopleModal(
        [
            fileId
        ]
    );
}


function openNotesPhotosModal()
{
    const note =
        selectedNote();

    if (!note)
    {
        return;
    }

    openPhotoLinkModal({
        projectId:
          note.projectId,

        title:
          'Add photos to note',

        targetLabel: localizedDataFieldValue(note.title || 'Untitled note'),

        description:
          `Selected and uploaded photos will be linked to ${
              note.title
            || 'Untitled note'
          }.`,

        ownerLabel:
          'this note',

        initiallyLinkedPhotoIds:
          getPhotosForNote(
              note.id,
              {
                  projectId:
                note.projectId
              }
          ).map(photo =>
              photo.id
          ),

        uploadDraftIdPrefix:
          'note-photo-upload-draft',

        uploadedPhotoIdPrefix:
          `photo-note-${note.id}`,

        onSave:
          (addedIds, context) =>
          {
              if (context?.changes)
              {
                  const current = getNote(note.id, { projectId: note.projectId, includeArchived: true });
                  return Boolean(current && setNotePhotoLinks(current.id,
                      rpApplyConnectionChanges(current.linkedPhotoIds || [], context), { projectId: current.projectId }));
              }
              const currentNote =
                  getNote(
                      note.id,
                      {
                          projectId:
                    note.projectId,

                          includeArchived:
                    true
                      }
                  );

              if (!currentNote)
              {
                  return false;
              }

              const nextIds =
                  archiveUniqueIds([
                      ...(
                          currentNote
                              .linkedPhotoIds
                  || []
                      ),

                      ...addedIds
                  ]);

              const savedNote =
                  setNotePhotoLinks(
                      currentNote.id,
                      nextIds,
                      {
                          projectId:
                    currentNote.projectId
                      }
                  );

              return Boolean(
                  savedNote
              )
            && addedIds.every(
                photoId =>
                    (
                        savedNote.linkedPhotoIds
                  || []
                    ).includes(
                        photoId
                    )
            );
          },

        afterSave:
          renderNotesPreservingInteraction,

    });
}


function openEventLinkModal({
    projectId,
    title =
        'Add events',
    subtitle =
        '',
    initiallyLinkedEventIds =
        [],
    primaryPersonIds =
        [],
    secondaryPersonIds =
        [],
    alreadyLinkedTarget =
        'this item',
    onSave,
    afterSave =
        () =>
        {},
    autoFocusSearch =
        true
} = {})
{
    if (
        !projectId
        || typeof onSave
          !== 'function'
    )
    {
        return;
    }

    const personName =
        person =>
            personResourceDisplayName(
                person
            )
          || person?.names?.display
          || 'Unnamed person';

    const normalizeSearch =
        value =>
            String(
                value || ''
            )
                .trim()
                .toLowerCase();

    const people =
        getPeople(
            projectId
        )
            .filter(person =>
                person?.id
            && !person.deleted
            && person.projectId
              === projectId
            )
            .slice();

    const peopleById =
        new Map(
            people.map(person => [
                person.id,
                person
            ])
        );

    /*
        Events without at least one valid
        Person owner are intentionally excluded.
      */
    const eventsById =
        new Map();

    const eventsByPersonId =
        new Map();

    noteEntityRecords(
        'event',
        projectId
    ).forEach(event =>
    {
        if (!event?.id)
        {
            return;
        }

        const ownerIds =
            placeInspectorEventOwnerIds(
                event
            ).filter(personId =>
                peopleById.has(
                    personId
                )
            );

        if (!ownerIds.length)
        {
            return;
        }

        eventsById.set(
            event.id,
            event
        );

        ownerIds.forEach(personId =>
        {
            if (
                !eventsByPersonId.has(
                    personId
                )
            )
            {
                eventsByPersonId.set(
                    personId,
                    []
                );
            }

            eventsByPersonId
                .get(personId)
                .push(event);
        });
    });

    eventsByPersonId.forEach(
        personEvents =>
        {
            personEvents.sort(
                (
                    first,
                    second
                ) =>
                    placeInspectorEventSortValue(
                        first
                    )
              - placeInspectorEventSortValue(
                  second
              )
              || placeInspectorEventLabel(
                  first
              ).localeCompare(
                  placeInspectorEventLabel(
                      second
                  )
              )
            );
        }
    );

    const initiallyLinkedIds =
        new Set(
            (
                initiallyLinkedEventIds
            || []
            ).filter(eventId =>
                eventsById.has(
                    eventId
                )
            )
        );

    /*
        Only newly selected Events are stored
        here. Existing links stay disabled.
      */
    const selectedIds =
        new Set();

    let query = '';
    let activePersonId = '';
    let mobilePane = 'people';

    const personEvents =
        personId =>
            eventsByPersonId.get(
                personId
            )
          || [];

    const personSearchText =
        person =>
            normalizeSearch(
                [
                    personName(person),
                    person?.names?.first,
                    person?.names?.middle,
                    person?.names?.last,
                    person?.names?.maiden,
                    albumPhotoPersonDates(
                        person
                    ),
                    getPlaceEventDisplay(
                        person?.birth
                    ),
                    getPlaceEventDisplay(
                        person?.death
                    )
                ]
                    .filter(Boolean)
                    .join(' ')
            );

    const eventSearchText =
        (
            event,
            person
        ) =>
        {
            const presentation =
                placeInspectorEventPresentation(
                    event,
                    person.id
                );

            const relatedNames =
                placeInspectorEventRelatedPeople(
                    event,
                    person.id
                )
                    .map(
                        personName
                    )
                    .join(' ');

            return normalizeSearch([
                presentation.title,
                presentation.date,
                presentation.relationship,
                timelinePlaceLabel(
                    event
                ),
                event?.title,
                event?.type,
                event?.typeLabel,
                event?.eventType,
                event?.description,
                event?.notes,
                event?.address,
                relatedNames
            ]
                .filter(Boolean)
                .join(' '));
        };

    const primaryPersonIdSet =
        new Set(
            (
                primaryPersonIds
            || []
            ).filter(personId =>
                peopleById.has(
                    personId
                )
            )
        );

    const secondaryPersonIdSet =
        new Set(
            (
                secondaryPersonIds
            || []
            ).filter(personId =>
                peopleById.has(
                    personId
                )
            )
        );

    const linkedEventOwnerIds =
        new Set();

    initiallyLinkedIds.forEach(
        eventId =>
        {
            const event =
                eventsById.get(
                    eventId
                );

            placeInspectorEventOwnerIds(
                event
            ).forEach(personId =>
            {
                if (
                    peopleById.has(
                        personId
                    )
                )
                {
                    linkedEventOwnerIds.add(
                        personId
                    );
                }
            });
        }
    );

    const personPriority =
        personId =>
        {
            if (
                primaryPersonIdSet.has(
                    personId
                )
            )
            {
                return 0;
            }

            if (
                secondaryPersonIdSet.has(
                    personId
                )
            )
            {
                return 1;
            }

            if (
                linkedEventOwnerIds.has(
                    personId
                )
            )
            {
                return 2;
            }

            return 3;
        };

    const candidatePeople =
        () =>
        {
            const normalizedQuery =
                normalizeSearch(
                    query
                );

            return people
                .map(person =>
                {
                    const allEvents =
                        personEvents(
                            person.id
                        );

                    const personText =
                        personSearchText(
                            person
                        );

                    const personMatched =
                        Boolean(
                            normalizedQuery
                  && personText.includes(
                      normalizedQuery
                  )
                        );

                    const matchingEvents =
                        normalizedQuery
                            ? allEvents.filter(
                                event =>
                                    eventSearchText(
                                        event,
                                        person
                                    ).includes(
                                        normalizedQuery
                                    )
                            )
                            : allEvents;

                    if (
                        normalizedQuery
                && !personMatched
                && !matchingEvents.length
                    )
                    {
                        return null;
                    }

                    const normalizedName =
                        normalizeSearch(
                            personName(person)
                        );

                    let matchRank = 0;

                    if (normalizedQuery)
                    {
                        if (
                            normalizedName
                    === normalizedQuery
                        )
                        {
                            matchRank = 0;
                        }
                        else if (
                            normalizedName.startsWith(
                                normalizedQuery
                            )
                        )
                        {
                            matchRank = 1;
                        }
                        else if (
                            personMatched
                        )
                        {
                            matchRank = 2;
                        }
                        else
                        {
                            /*
                    The query matched one or more
                    Events rather than the Person.
                  */
                            matchRank = 3;
                        }
                    }

                    return {
                        person,
                        allEvents,
                        matchingEvents,
                        personMatched,
                        matchRank,
                        priority:
                  personPriority(
                      person.id
                  )
                    };
                })
                .filter(Boolean)
                .sort(
                    (
                        first,
                        second
                    ) =>
                        first.matchRank
                  - second.matchRank
                || first.priority
                  - second.priority
                || personName(
                    first.person
                ).localeCompare(
                    personName(
                        second.person
                    )
                )
                );
        };

    const visibleEventsForPerson =
        person =>
        {
            const allEvents =
                personEvents(
                    person.id
                );

            const normalizedQuery =
                normalizeSearch(
                    query
                );

            if (
                !normalizedQuery
            || personSearchText(
                person
            ).includes(
                normalizedQuery
            )
            )
            {
                return allEvents;
            }

            return allEvents.filter(
                event =>
                    eventSearchText(
                        event,
                        person
                    ).includes(
                        normalizedQuery
                    )
            );
        };

    /*
        Automatically select a contextual Person,
        but do not select an arbitrary alphabetical
        Person when the Note has no context.
      */
    const preferredPersonIds = [
        ...primaryPersonIdSet,
        ...secondaryPersonIdSet,
        ...linkedEventOwnerIds
    ];

    activePersonId =
        preferredPersonIds.find(
            personId =>
                peopleById.has(
                    personId
                )
        )
        || '';

    if (activePersonId)
    {
        mobilePane =
            'events';
    }

    const renderPersonResults =
        candidates =>
        {
            if (!candidates.length)
            {
                return `
              <div class="notes-event-empty">
                <strong>
                  ${escapeHtml(t(people.length ? 'No people match this search' : 'No people in this project yet'))}
                </strong>

                <span>
                  ${escapeHtml(t(people.length ? 'Try another name, date, family branch, event, or place.' : 'Add a person to the project before linking events.'))}
                </span>

                ${people.length ? `<button
                  class="button secondary"
                  type="button"
                  data-notes-event-clear-search>
                  ${escapeHtml(t('Clear search'))}
                </button>` : ''}
              </div>
            `;
            }

            return candidates
                .map(candidate =>
                {
                    const person =
                        candidate.person;

                    const name =
                        personName(
                            person
                        );

                    const dates =
                        albumPhotoPersonDates(
                            person
                        )
                || 'Dates unknown';

                    const eventCount =
                        candidate.personMatched
                || !normalizeSearch(
                    query
                )
                            ? candidate
                                .allEvents
                                .length
                            : candidate
                                .matchingEvents
                                .length;

                    const eventCountLabel =
                        normalizeSearch(
                            query
                        )
                && !candidate
                    .personMatched
                            ? `${eventCount} matching ${
                                eventCount === 1
                                    ? 'event'
                                    : 'events'
                            }`
                            : `${eventCount} ${
                                eventCount === 1
                                    ? 'event'
                                    : 'events'
                            }`;

                    const active =
                        person.id
                  === activePersonId;

                    return `
                <button
                  class="
                    notes-event-person-result
                    ${
                        active
                            ? 'active'
                            : ''
                    }
                  "
                  type="button"
                  data-notes-event-person="${escapeHtml(
                        person.id
                    )}"
                  aria-pressed="${active}"
                  aria-label="View events for ${escapeHtml(
                        name
                    )}">

                  ${renderPersonAvatar(
                        person,
                        'notes-event-person-avatar',
                        {
                            element:
                        'span'
                        }
                    )}

                  <span class="notes-event-person-copy">
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

                    <span class="notes-event-person-count">
                      ${escapeHtml(
                            eventCountLabel
                        )}
                    </span>
                  </span>

                  <span
                    class="notes-event-person-chevron"
                    aria-hidden="true">
                    ${icon.chevron}
                  </span>
                </button>
              `;
                })
                .join('');
        };

    const renderEventRow =
        (
            event,
            person
        ) =>
        {
            const presentation =
                placeInspectorEventPresentation(
                    event,
                    person.id
                );

            const place =
                timelinePlaceLabel(
                    event
                );

            const alreadyLinked =
                initiallyLinkedIds.has(
                    event.id
                );

            const selected =
                selectedIds.has(
                    event.id
                );

            const ariaLabel =
                alreadyLinked
                    ? `${
                        presentation.title
                    } is already linked to ${
                        alreadyLinkedTarget
                    }`
                    : `${
                        selected
                            ? 'Remove'
                            : 'Add'
                    } ${
                        presentation.title
                    }`;

            return `
            <label
              class="
                notes-event-result
                ${
                    alreadyLinked
                        ? 'is-complete'
                        : ''
                }
                ${
                    selected
                        ? 'is-selected'
                        : ''
                }
              ">

              <span
                class="notes-event-result-icon"
                aria-hidden="true">
                ${timelineEventIcon(
                    event
                )}
              </span>

              <span class="notes-event-result-copy">
                <strong>
                  ${escapeHtml(
                        presentation.title
                    )}
                </strong>

                <span class="notes-event-result-date">
                  ${escapeHtml(
                        presentation.date
                    || 'Date unknown'
                    )}
                </span>

                ${
                    place
                        ? `
                      <span>
                        ${escapeHtml(
                            place
                        )}
                      </span>
                    `
                        : ''
                }

                ${
                    presentation
                        .relationship
                        ? `
                      <span class="notes-event-result-relationship">
                        ${escapeHtml(
                            presentation
                                .relationship
                        )}
                      </span>
                    `
                        : ''
                }
              </span>

              <span class="notes-event-result-end">
                ${
                    alreadyLinked
                        ? `
                      <span class="notes-event-already-added">
                        Already added
                      </span>
                    `
                        : ''
                }

                <input
                  type="checkbox"
                  value="${escapeHtml(
                        event.id
                    )}"
                  data-notes-event-choice
                  aria-label="${escapeHtml(
                        ariaLabel
                    )}"
                  ${
                        alreadyLinked
                    || selected
                            ? 'checked'
                            : ''
                    }
                  ${
                        alreadyLinked
                            ? 'disabled'
                            : ''
                    }>
              </span>
            </label>
          `;
        };

    const renderTimeline =
        person =>
        {
            if (!person)
            {
                return `
              <div class="notes-event-timeline-empty">
                <span
                  class="notes-event-timeline-empty-icon"
                  aria-hidden="true">
                  ${icon.calendar}
                </span>

                <strong>
                  ${escapeHtml(t('Select a person'))}
                </strong>

                <span>
                  Choose a Person to view
                  Events that belong to or
                  involve them.
                </span>
              </div>
            `;
            }

            const name =
                personName(
                    person
                );

            const allEvents =
                personEvents(
                    person.id
                );

            const visibleEvents =
                visibleEventsForPerson(
                    person
                );

            const dates =
                albumPhotoPersonDates(
                    person
                )
            || 'Dates unknown';

            const eventMeta =
                visibleEvents.length
              === allEvents.length
                    ? `${allEvents.length} recorded ${
                        allEvents.length === 1
                            ? 'event'
                            : 'events'
                    }`
                    : `${visibleEvents.length} matching of ${
                        allEvents.length
                    } events`;

            return `
            <div class="notes-event-person-header">

              <button
                class="
                  button
                  secondary
                  compact
                  notes-event-back
                "
                type="button"
                data-notes-event-back>
                ${icon.chevron}
                People
              </button>

              ${renderPersonAvatar(
                    person,
                    'notes-event-active-avatar',
                    {
                        element:
                    'span'
                    }
                )}

              <span class="notes-event-active-copy">
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

                <span>
                  ${escapeHtml(
                        eventMeta
                    )}
                </span>
              </span>
            </div>

            <div class="notes-event-results">
              ${
                    visibleEvents.length
                        ? visibleEvents
                            .map(event =>
                                renderEventRow(
                                    event,
                                    person
                                )
                            )
                            .join('')
                        : `
                    <div class="notes-event-empty">
                      <strong>
                        No events recorded for
                        ${escapeHtml(
                            name
                        )}
                      </strong>

                      <span>
                        Events must be created
                        from this Person’s
                        profile before they can
                        be linked to the Note.
                      </span>
                    </div>
                  `
                }
            </div>
          `;
        };

    openModal(`
        <div
          class="
            modal
            notes-events-modal
            ${
                mobilePane
                === 'events'
                    ? 'is-showing-events'
                    : 'is-showing-people'
            }
          "
          role="dialog"
          aria-modal="true"
          aria-labelledby="notesEventsTitle">

          <div class="modal-header">
            <div>
              <h2 id="notesEventsTitle">
                ${escapeHtml(
                    title
                )}
              </h2>

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

            <button
              class="close-button"
              type="button"
              data-close
              aria-label="Close add events dialog">
              ${icon.close}
            </button>
          </div>

          <div class="notes-event-picker-body">

            <div class="notes-event-picker-grid">

              <section
                class="notes-event-person-pane"
                aria-label="People">

                <div
                  class="
                    field
                    notes-event-search-field
                  ">

                  <label for="notesEventPersonSearch">
                    Find a person
                  </label>

                  <div class="search-input">
                    ${icon.search}

                    <input
                      id="notesEventPersonSearch"
                      type="search"
                      data-notes-event-search
                      placeholder="Search by person, event, date, or place"
                      autocomplete="off">
                  </div>
                </div>

                <div class="notes-event-person-results-head">
                  <strong
                    data-notes-event-person-title>
                    Suggested people
                  </strong>

                  <span
                    data-notes-event-person-meta>
                  </span>
                </div>

                <div
                  class="notes-event-person-results"
                  data-notes-event-person-results>
                </div>
              </section>

              <section
                class="notes-event-timeline-pane"
                data-notes-event-timeline
                aria-label="Person events">
              </section>
            </div>
          </div>

          <div
            class="
              modal-footer
              notes-event-picker-footer
            ">

            <span
              class="notes-event-selection-count"
              data-notes-event-count
              aria-live="polite">
              0 events selected
            </span>

            <div class="notes-event-footer-actions">
              <button
                class="button secondary"
                type="button"
                data-close>
                Cancel
              </button>

              <button
                class="button primary"
                type="button"
                data-notes-event-save
                disabled>
                Add events
              </button>
            </div>
          </div>
        </div>
      `);

    const modal =
        modalBackdrop.querySelector(
            '.notes-events-modal'
        );

    if (!modal)
    {
        return;
    }

    const searchInput =
        modal.querySelector(
            '[data-notes-event-search]'
        );

    const peopleTitle =
        modal.querySelector(
            '[data-notes-event-person-title]'
        );

    const peopleMeta =
        modal.querySelector(
            '[data-notes-event-person-meta]'
        );

    const peopleHost =
        modal.querySelector(
            '[data-notes-event-person-results]'
        );

    const timelineHost =
        modal.querySelector(
            '[data-notes-event-timeline]'
        );

    const countElement =
        modal.querySelector(
            '[data-notes-event-count]'
        );

    const saveButton =
        modal.querySelector(
            '[data-notes-event-save]'
        );

    const refreshPeople =
        candidates =>
        {
            peopleTitle.textContent =
                normalizeSearch(
                    query
                )
                    ? 'Search results'
                    : 'Suggested people';

            peopleMeta.textContent =
                `${candidates.length} ${
                    candidates.length === 1
                        ? 'person'
                        : 'people'
                }`;

            peopleHost.innerHTML =
                renderPersonResults(
                    candidates
                );
        };

    const refreshTimeline =
        () =>
        {
            const person =
                peopleById.get(
                    activePersonId
                )
            || null;

            timelineHost.innerHTML =
                renderTimeline(
                    person
                );
        };

    const refreshFooter =
        () =>
        {
            const count =
                selectedIds.size;

            countElement.textContent =
                `${count} ${
                    count === 1
                        ? 'event'
                        : 'events'
                } selected`;

            saveButton.disabled =
                count === 0;

            saveButton.textContent =
                count
                    ? `Add ${count} ${
                        count === 1
                            ? 'event'
                            : 'events'
                    }`
                    : 'Add events';
        };

    const refresh = () =>
    {
        const candidates =
            candidatePeople();

        const candidateIds =
            new Set(
                candidates.map(
                    candidate =>
                        candidate.person.id
                )
            );

        if (
            activePersonId
          && !candidateIds.has(
              activePersonId
          )
        )
        {
            activePersonId =
                '';

            mobilePane =
                'people';
        }

        modal.classList.toggle(
            'is-showing-events',
            mobilePane
            === 'events'
        );

        modal.classList.toggle(
            'is-showing-people',
            mobilePane
            === 'people'
        );

        refreshPeople(
            candidates
        );

        refreshTimeline();
        refreshFooter();

        localizeUI(
            modal
        );
    };

    searchInput?.addEventListener(
        'input',
        event =>
        {
            query =
                event.currentTarget
                    .value;

            mobilePane =
                'people';

            refresh();
        }
    );

    modal.addEventListener(
        'change',
        event =>
        {
            const input =
                event.target.closest(
                    '[data-notes-event-choice]'
                );

            if (
                !input
            || input.disabled
            )
            {
                return;
            }

            const eventId =
                input.value;

            const choiceIndex = [
                ...modal.querySelectorAll(
                    '[data-notes-event-choice]'
                )
            ].indexOf(input);

            if (input.checked)
            {
                selectedIds.add(eventId);
            }
            else
            {
                selectedIds.delete(eventId);
            }

            refresh();

            restoreModalChoiceFocus({
                modal,
                selector:
              '[data-notes-event-choice]',
                value:
              eventId,
                index:
              choiceIndex,
                fallbackSelector:
              '[data-notes-event-search]'
            });
        }
    );

    modal.addEventListener(
        'click',
        event =>
        {
            const personButton =
                event.target.closest(
                    '[data-notes-event-person]'
                );

            if (personButton)
            {
                activePersonId =
                    personButton.dataset
                        .notesEventPerson;

                mobilePane =
                    'events';

                refresh();

                return;
            }

            if (
                event.target.closest(
                    '[data-notes-event-back]'
                )
            )
            {
                mobilePane =
                    'people';

                refresh();

                requestAnimationFrame(
                    () =>
                    {
                        searchInput?.focus({
                            preventScroll:
                    true
                        });
                    }
                );

                return;
            }

            if (
                event.target.closest(
                    '[data-notes-event-clear-search]'
                )
            )
            {
                query = '';

                if (searchInput)
                {
                    searchInput.value =
                        '';
                }

                refresh();

                searchInput?.focus({
                    preventScroll:
                true
                });

                return;
            }

            if (
                event.target.closest(
                    '[data-notes-event-save]'
                )
            )
            {
                if (!selectedIds.size)
                {
                    return;
                }
                const nextIds =
                    [
                        ...selectedIds
                    ];

                const saved =
                    onSave(
                        nextIds
                    );

                if (
                    saved === false
                )
                {
                    return;
                }

                closeModal();
                afterSave();

                const message = rpLinkedCountMessage('events', nextIds.length);
                if (message) showToast(message);
            }
        }
    );

    refresh();

    requestAnimationFrame(
        () =>
        {
            if (
                autoFocusSearch
                && (window.innerWidth > 720
                    || mobilePane === 'people')
            )
            {
                searchInput?.focus({
                    preventScroll: true
                });
            }
        }
    );
}

function openNotesEventsModal()
{
    const note =
        selectedNote();

    if (!note)
    {
        return;
    }

    const secondaryPersonIds =
        getPhotosForNote(
            note.id,
            {
                projectId:
              note.projectId
            }
        )
            .flatMap(photo =>
                photo.personIds
            || []
            );

    openEventLinkModal({
        projectId:
          note.projectId,

        title:
          'Add events',

        subtitle:
          note.title
          || 'Untitled note',

        initiallyLinkedEventIds:
          note.linkedEventIds
          || [],

        primaryPersonIds:
          note.linkedPersonIds
          || [],

        secondaryPersonIds,

        alreadyLinkedTarget:
          'this note',

        onSave:
          selectedEventIds =>
          {
              const currentNote =
                  getNote(
                      note.id,
                      {
                          projectId:
                    note.projectId,

                          includeArchived:
                    true
                      }
                  );

              if (!currentNote)
              {
                  showToast(
                      'The note is no longer available.'
                  );

                  return false;
              }

              const nextEventIds =
                  archiveUniqueIds([
                      ...(
                          currentNote.linkedEventIds
                  || []
                      ),

                      ...selectedEventIds
                  ]);

              setNoteEntityLinks(
                  currentNote.id,
                  'event',
                  nextEventIds,
                  {
                      projectId:
                  currentNote.projectId
                  }
              );

              return true;
          },

        afterSave:
          renderNotesPreservingInteraction,

    });
}

function openArchiveFilesEventsModal(
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

    const singleFile =
        files.length === 1
            ? files[0]
            : null;

    const primaryPersonIds =
        archiveUniqueIds(
            files.flatMap(file =>
                file.linkedPersonIds
            || []
            )
        );

    const secondaryPersonIds =
        archiveUniqueIds(
            files.flatMap(file =>
                sourceIdsForTarget(
                    'file',
                    file.id,
                    file.projectId
                ).flatMap(sourceId =>
                    sourceTargetIds(
                        sourceId,
                        'person',
                        file.projectId
                    )
                )
            )
        );

    const initiallyLinkedEventIds =
        singleFile
            ? singleFile.linkedEventIds
            || []
            : archiveCommonFileConnectionIds(
                files,
                'event'
            );

    openEventLinkModal({
        projectId:
          files[0].projectId
          || currentProjectId(),

        autoFocusSearch:
          false,

        title:
          'Add events',

        subtitle:
          archiveBulkLinkSubtitle(
              files
          ),

        /*
          Events linked to all selected files are
          displayed as already linked. Events linked
          to only some files remain selectable.
        */
        initiallyLinkedEventIds,

        primaryPersonIds,

        secondaryPersonIds,

        alreadyLinkedTarget:
          singleFile
              ? 'this file'
              : 'all selected files',

        onSave:
          selectedEventIds =>
          {
              if (singleFile)
              {
                  const currentFile =
                      archiveFileById(
                          singleFile.id
                      );

                  if (!currentFile)
                  {
                      showToast(
                          'The file is no longer available.'
                      );

                      return false;
                  }

                  return setArchiveFileConnectionIds(
                      currentFile.id,
                      'event',
                      [
                          ...(
                              currentFile.linkedEventIds
                    || []
                          ),

                          ...selectedEventIds
                      ]
                  );
              }
              const result =
                  archiveCommitFileConnections({
                      fileIds:
                  ids,

                      entityType:
                  'event',

                      recordIds:
                  selectedEventIds
                  });

              if (!result.ok)
              {
                  showToast(
                      'No events were linked.'
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

function openArchiveFileEventsModal(
    fileId
)
{
    openArchiveFilesEventsModal(
        [
            fileId
        ]
    );
}

function openNoteFilesModal(
    noteId =
        state.selectedNoteId
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

    if (!note)
    {
        return;
    }

    const title =
        note.title
        || 'Untitled note';

    openConnectedFilesModal({
        projectId:
          note.projectId
          || currentProjectId(),

        title:
          'Add files',

        subtitle:
          localizedDataFieldValue(title),

        existingFileIds:
          note.linkedArchiveFileIds
          || [],

        onSave:
          (fileIds, context) =>
          {
              if (context?.changes)
              {
                  const current = getNote(note.id, { projectId: note.projectId, includeArchived: true });
                  return Boolean(current && setNoteEntityLinks(current.id, 'archiveFile',
                      rpApplyConnectionChanges(current.linkedArchiveFileIds || [], context), { projectId: current.projectId }));
              }
              const currentNote =
                  getNote(
                      note.id,
                      {
                          projectId:
                    note.projectId,

                          includeArchived:
                    true
                      }
                  );

              if (!currentNote)
              {
                  return {
                      ok:
                  false
                  };
              }

              const nextIds =
                  archiveUniqueIds([
                      ...(
                          currentNote
                              .linkedArchiveFileIds
                  || []
                      ),

                      ...fileIds
                  ]);

              setNoteEntityLinks(
                  currentNote.id,
                  'archiveFile',
                  nextIds,
                  {
                      projectId:
                  currentNote.projectId
                  }
              );

              const saved =
                  fileIds.every(fileId =>
                      (
                          currentNote
                              .linkedArchiveFileIds
                  || []
                      ).includes(
                          fileId
                      )
                  );

              return {
                  ok:
                saved,

                  changedCount:
                saved
                    ? fileIds.length
                    : 0
              };
          },

        afterSave:
          () =>
          {
              renderNotesPreservingInteraction();
          },


        autoFocusSearch:
          false
    });
}
