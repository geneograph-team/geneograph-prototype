function treePersonToPeopleRecordId(person)
{
    return person && getPerson(person.id) ? person.id : null;
}

const CONNECTED_NOTES_PREVIEW_LIMIT = 3;

const PERSON_PANEL_PREVIEW_LIMITS =
    Object.freeze({
        photos: 3,
        archive: 3,
        notes: CONNECTED_NOTES_PREVIEW_LIMIT
    });

function personResourceDisplayName(person)
{
    return (
        person?.names?.display
        || person?.name
        || 'Person'
    );
}

function resourceLabelsIncludePerson(
    labels,
    person
)
{
    const name =
        personResourceDisplayName(person);

    return (labels || []).some(
        label =>
            String(label || '').trim()
          === name
    );
}

function getArchiveFilesForPerson(
    personId,
    {
        includeDeleted =
            false
    } = {}
)
{
    const person =
        getPerson(
            personId
        );

    if (!person)
    {
        return [];
    }

    const projectId =
        person.projectId
        || currentProjectId();

    return (
        sampleData.archiveFiles
        || []
    )
        .filter(file =>
            (
                includeDeleted
            || !file.deleted
            )
          && (
              !file.projectId
            || file.projectId
              === projectId
          )
        )
        .filter(file =>
            (
                file.linkedPersonIds
            || []
            ).includes(
                person.id
            )
        );
}

function openPersonFilesModal(
    personId
)
{
    const person =
        getPerson(
            personId
        );

    if (!person)
    {
        showToast(
            'Person record not found.'
        );

        return;
    }

    const name =
        person.names?.display
        || person.name
        || 'this person';

    const existingFileIds =
        getArchiveFilesForPerson(
            person.id
        ).map(file =>
            file.id
        );

    openConnectedFilesModal({
        projectId:
          person.projectId
          || currentProjectId(),

        title:
          `Add files to ${name}`,

        subtitle:
          name,

        existingFileIds,

        onSave:
          (fileIds, context) =>
          {
              const currentPerson =
                  getPerson(
                      person.id
                  );

              if (!currentPerson)
              {
                  return {
                      ok:
                  false
                  };
              }

              const writes =
                  context.changes.decisions.map(({ id: fileId, linked }) => ({
                      ownerType:
                  'file',

                      ownerId:
                  fileId,

                      entityType:
                  'person',

                      entityId:
                  currentPerson.id,

                      shouldLink:
                  linked
                  }));

              const committed =
                  archiveSetConnectionsAtomically(
                      writes
                  );

              return {
                  ...committed,

                  ok:
                committed.ok
              };
          },

        afterSave:
          () =>
          {
              renderAfterPersonConnectedResourcesChanged();
          },

        successMessage:
          count =>
              `${count} ${
                  count === 1
                      ? 'file'
                      : 'files'
              } added to ${name}.`
    });
}

function getNotesForPerson(
    personId,
    options = {}
)
{
    return getNotesForEntity(
        'person',
        personId,
        options
    );
}

function renderPersonPhotoUnlinkButton(
    photo,
    personId
)
{
    if (!photo?.id || !personId)
    {
        return '';
    }

    const photoLabel =
        photo.title
        || photo.filename
        || 'Photo';

    const personLabel =
        getPerson(personId)
            ?.names?.display
        || 'this person';

    return `
        <button
          class="
            connected-note-unlink
            connected-photo-unlink
          "
          type="button"
          data-person-photo-unlink="${escapeHtml(
                photo.id
            )}"
          data-person-photo-unlink-person="${escapeHtml(
                personId
            )}"
          aria-label="Unlink ${escapeHtml(
                photoLabel
            )} from ${escapeHtml(
                personLabel
            )}"
          title="Unlink photo">

          ${icon.unlink}
        </button>
      `;
}

function renderFamilyPhotos(person)
{
    const photos =
        getPhotosForPerson(
            person?.id
        ).slice(
            0,
            PERSON_PANEL_PREVIEW_LIMITS
                .photos
        );

    if (!photos.length)
    {
        return `
          <div class="panel-muted">
            No photos linked to this person.
          </div>
        `;
    }

    return `
        <div class="connected-photo-grid">
          ${photos
                .map(photo =>
                {
                    const label =
                        photo.title
                || photo.filename
                || 'Photo';

                    return `
                <div
                  class="
                    person-connected-photo-item
                    family-connected-photo-item
                  ">

                  <button
                    class="connected-photo-button"
                    type="button"
                    data-family-photo="${escapeHtml(
                        photo.id
                    )}"
                    title="${escapeHtml(
                        label
                    )}"
                    aria-label="Open ${escapeHtml(
                        label
                    )}">

                    ${renderPhotoThumbnail(
                        photo,
                        { label }
                    )}
                  </button>

                  ${renderPersonPhotoUnlinkButton(
                        photo,
                        person.id
                    )}
                </div>
              `;
                })
                .join('')}
        </div>
      `;
}

function renderFamilyArchiveItems(
    person
)
{
    const files =
        getArchiveFilesForPerson(
            person?.id
        ).slice(
            0,
            PERSON_PANEL_PREVIEW_LIMITS
                .archive
        );

    if (!files.length)
    {
        return `
          <div class="panel-muted">
            No archive files linked to this person.
          </div>
        `;
    }

    return renderConnectedFileList({
        files,

        contextType:
          'person',

        contextId:
          person?.id
          || '',

        emptyText:
          'No archive files linked to this person.'
    });
}

function renderFamilyNotes(
    person
)
{
    const notes =
        getNotesForPerson(
            person?.id
        );

    if (!notes.length)
    {
        return `
          <div class="panel-muted">
            No notes linked to this person.
          </div>
        `;
    }

    return renderConnectedNoteList({
        notes,

        contextType:
          'person',

        contextId:
          person?.id || '',

        limit:
          PERSON_PANEL_PREVIEW_LIMITS
              .notes,

        emptyText:
          'No notes linked to this person.'
    });
}

function openPersonNotesModal(
    personId,
    context = 'tree'
)
{
    const person =
        getPerson(
            personId
        );

    if (!person)
    {
        showToast(
            'Person record not found.'
        );

        return;
    }

    /*
        The same sidebar renderer is used by:
        - Family Tree: "tree"
        - People preview: "people"
      */
    const profileContext =
        context === 'profile';

    const sidebarContext =
        context === 'people'
            ? 'people'
            : 'tree';

    const personLabel =
        noteEntityLabel(
            'person',
            person
        )
        || person.names?.display
        || person.name
        || 'this person';

    const existingNoteIds =
        getNotesForPerson(
            person.id
        ).map(note =>
            note.id
        );

    openNoteLinkPickerModal({
        projectId:
          person.projectId
          || currentProjectId(),

        title:
          'Add note',

        targetLabel: personLabel,

        description:
          `Link existing notes to “${personLabel}”.`,

        searchPlaceholder:
          'Search by title, content, person, place, or source',

        existingNoteIds,

        /*
          Keep person-sidebar linking aligned with
          Albums: archived Notes are not offered as
          new links.
        */
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
              openNewNoteForContext(
                  'person',
                  person.id
              ),

        onSave:
          selectedNoteIds =>
          {
              const currentPerson =
                  getPerson(
                      person.id
                  );

              if (!currentPerson)
              {
                  showToast(
                      'The person is no longer available.'
                  );

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
                        person.projectId
                        || currentProjectId(),

                                  includeArchived:
                        false
                              }
                          );

                      if (!note)
                      {
                          return;
                      }

                      const currentPersonIds =
                          Array.isArray(
                              note.linkedPersonIds
                          )
                              ? note.linkedPersonIds
                              : [];

                      setNoteEntityLinks(
                          note.id,
                          'person',
                          [
                              ...new Set([
                                  ...currentPersonIds,
                                  currentPerson.id
                              ])
                          ],
                          {
                              projectId:
                      note.projectId
                          }
                      );
                  }
              );

              return true;
          },

        afterSave:
          () =>
          {
              if (profileContext)
              {
                  const profileScrollTop =
                      main.scrollTop;

                  renderPeople();

                  requestAnimationFrame(
                      () =>
                      {
                          main.scrollTop =
                              profileScrollTop;

                          main
                              .querySelector(
                                  '[data-profile-resource-action="add-note"]'
                              )
                              ?.focus({
                                  preventScroll: true
                              });
                      }
                  );

                  return;
              }

              /*
              Keep the Notes accordion open and refresh
              only the sidebar that launched the modal.
            */
              state.inspectorSections
                  .notes = true;

              rerenderPersonSidebarContext(
                  sidebarContext,
                  {
                      preserveScroll:
                  true,

                      scrollSectionId:
                  'notes',

                      focusSectionId:
                  'notes'
                  }
              );
          },

        successMessage:
          count =>
              `${count} ${
                  count === 1
                      ? 'note was'
                      : 'notes were'
              } linked to ${personLabel}.`
    });
}

function openFamilyPhoto(photoId)
{
    openAlbumsForPhoto(photoId);
}

function openFamilyArchiveItem(
    fileId
)
{
    if (!fileId)
    {
        showToast(
            'Archive item preview is simulated.'
        );

        return;
    }

    const file =
        archiveFileById(
            fileId
        );

    openArchiveLocation(
        {
            view:
            'files',

            folderId:
            archiveFileFolderId(
                file
            ),

            search:
            '',

            fileFilters:
            archiveFileFiltersWithDefaults(
                {}
            ),

            filterPresentation:
            'flat',

            filterScopeFolderId:
            null,

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
}


function cleanFamilyTreeHeroDate(value)
{
    const clean = cleanGenealogyDateText(value);
    return clean && !/placeholder/i.test(clean) ? clean : 'Unknown date';
}

function cleanFamilyTreeHeroPlace(value)
{
    const clean = String(value || '').trim();
    if (!clean || /placeholder/i.test(clean)) return '';
    return clean;
}

function familyTreeHeroAgeSuffix(age)
{
    return age !== null && age !== undefined ? ` (${age} years)` : '';
}

function renderFamilyTreeHeroLifeDetails(person)
{
    const status = normalizeLivingStatus(person.status || person.living);
    const birthDate = parsePeoplePrototypeDate(person.birth);
    const deathDate = parsePeoplePrototypeDate(person.death);
    const central = person.id ? getPerson(person.id) : null;
    const birthAge = status === 'Deceased' ? null : genealogyAgeRange(central?.birth || person.birth);
    const deathAge = status === 'Deceased' ? genealogyAgeRange(central?.birth || person.birth, central?.death || person.death) : null;
    const rows = [
        {
            label: 'Born',
            date: `${cleanFamilyTreeHeroDate(person.birth)}${familyTreeHeroAgeSuffix(birthAge)}`,
            place: cleanFamilyTreeHeroPlace(person.place)
        }
    ];

    if (status === 'Deceased')
    {
        rows.push({
            label: 'Deceased',
            date: `${cleanFamilyTreeHeroDate(person.death)}${familyTreeHeroAgeSuffix(deathAge)}`,
            place: cleanFamilyTreeHeroPlace(person.deathPlace)
        });
    }

    return `<div class="tree-person-life">${rows.map(row => `<div class="tree-person-life-line"><div><strong>${escapeHtml(row.label)}:</strong> ${escapeHtml(row.date)}</div>${row.place ? `<div class="tree-person-life-place">${escapeHtml(row.place)}</div>` : ''}</div>`).join('')}</div>`;
}

function renderFamilyTreePersonHero(
    person
)
{
    const status =
        person.status
        || person.living;

    const photoCount =
        getPersonPhotoCount(
            person.id
        );

    const fileCount =
        getArchiveFilesForPerson(
            person.id
        ).length;

    const noteCount =
        getNotesForPerson(
            person.id
        ).length;

    const viewState = treeProjectViewState();
    const isFocusPerson = viewState.focusPersonId === person.id;

    return `
        <div
          class="
            people-hero
            tree-person-hero
          ">

          <div class="tree-person-hero-top">
            <div class="tree-person-hero-leading">
              <button
                class="
                  people-collapse-button
                  people-sidebar-toggle-icon
                  people-sidebar-toggle-collapse
                "
                type="button"
                id="collapseInspector"
                aria-label="Collapse person sidebar">

                ${icon.doublechevronSidebar}
              </button>

              ${isFocusPerson
                    ? `<span class="tree-focus-status" role="img" aria-label="Current focus person" title="Current focus person">${icon.focus}</span>`
                    : ''}
            </div>

            <div class="tree-person-hero-actions">
              <button
                class="text-action tree-person-hero-profile"
                type="button"
                data-tree-view-profile="${escapeHtml(person.id)}"
                aria-label="View ${escapeHtml(person.name)} profile">
                <span>View profile</span>
              </button>
            </div>
          </div>

          <div class="tree-person-hero-main">
            ${renderEditablePersonAvatar(
                person,
                'tree-person-hero-photo'
            )}

            <div class="tree-person-hero-copy">
              <h2>
                ${escapeHtml(
                    person.name
                )}
              </h2>

              ${renderFamilyTreeHeroLifeDetails(
                    person
                )}
            </div>
          </div>

          <div
            class="
              tree-person-hero-tags
              app-chip-row
              app-chip-row--on-accent
            ">

            ${renderLivingStatusChip(
                status
            )}

            <button
              class="
                app-chip
                app-chip--photos
              "
              type="button"
              data-person-chip-section="photos"
              aria-controls="section-photos"
              aria-label="Show ${photoCount} ${
                    photoCount === 1
                        ? 'photo'
                        : 'photos'
                }">

              ${
                    state.language === 'ru'
                        ? `${photoCount} фото`
                        : `${photoCount} ${photoCount === 1 ? 'photo' : 'photos'}`
                }
            </button>

            <button
              class="
                app-chip
                app-chip--files
              "
              type="button"
              data-person-chip-section="archive"
              aria-controls="section-archive"
              aria-label="Show ${fileCount} ${
                    fileCount === 1
                        ? 'file'
                        : 'files'
                }">

              ${fileCount}
              ${
                    fileCount === 1
                        ? 'file'
                        : 'files'
                }
            </button>

            <button
              class="
                app-chip
                app-chip--notes
              "
              type="button"
              data-person-chip-section="notes"
              aria-controls="section-notes"
              aria-label="Show ${noteCount} ${
                    noteCount === 1
                        ? 'note'
                        : 'notes'
                }">

              ${noteCount}
              ${
                    noteCount === 1
                        ? 'note'
                        : 'notes'
                }
            </button>
          </div>
        </div>
      `;
}

function personSidebarTreePerson(personOrId)
{
    const personId = typeof personOrId === 'string' ? personOrId : personOrId?.id;
    return personById(personId) || currentTreePeople()[0] || null;
}


function renderPersonSidebar(
    personOrId,
    context = 'tree'
)
{
    const isPeopleContext =
        context === 'people';

    const person =
        personSidebarTreePerson(
            personOrId
        );

    const contextAttribute = `
        data-person-sidebar-context="${
            escapeHtml(context)
        }"
      `;

    if (!person)
    {
        return `
          <aside
            class="
              tree-inspector
              family-person-pane
              ${
                    isPeopleContext
                        ? 'people-person-sidebar'
                        : ''
                }
            "
            ${contextAttribute}
            aria-label="Selected person details">
            <div class="panel-muted">
              Select a person to view details.
            </div>
          </aside>
        `;
    }

    if (
        !isPeopleContext
        && state.treeInspectorCollapsed
    )
    {
        return `
          <aside
            class="tree-inspector tree-inspector-collapsed"
            ${contextAttribute}
            aria-label="Collapsed person inspector">
            <button
              class="inspector-restore person-sidebar-restore-button sidebar-toggle-icon sidebar-toggle-icon-restore"
              type="button"
              id="restoreInspector"
              aria-label="Show person sidebar">
              ${icon.doublechevronSidebar}
            </button>
          </aside>
        `;
    }

    if (
        isPeopleContext
        && state.peoplePreviewCollapsed
    )
    {
        return `
          <aside
            class="
              tree-inspector
              family-person-pane
              people-person-sidebar
              collapsed
            "
            ${contextAttribute}
            aria-label="Selected person sidebar collapsed">

            <button
              class="
                inspector-restore
                person-sidebar-restore-button
                sidebar-toggle-icon
                sidebar-toggle-icon-restore
              "
              type="button"
              id="restoreInspector"
              aria-label="Show person sidebar">
              ${icon.doublechevronSidebar}
            </button>
          </aside>
        `;
    }

    const actionsContent = `<div class="panel-actions">
        <button class="button primary" type="button" id="quickEdit">
          ${renderPanelButtonLabel(icon.edit, 'Quick edit')}
        </button>
        <button class="button secondary" type="button" id="familyMoreActions" aria-haspopup="menu" aria-expanded="false">
          ${renderPanelButtonLabel(icon.more, 'More actions')}
        </button>
        <button class="button secondary" type="button" id="addRelative">
          ${renderPanelButtonLabel(icon.addperson, 'Add relative')}
        </button>
        <button class="button secondary" type="button" id="connectRelative">
          ${renderPanelButtonLabel(icon.link, 'Connect relative')}
        </button>
      </div>`;

    const timelineContent = renderFamilyTreeTimeline(person.id);
    const relationshipsContent =
        renderRelationships(person.id);

    const relationshipsCount =
        relationshipCount(person.id);
    const photosContent = renderFamilyPhotos(person);
    const archiveContent = renderFamilyArchiveItems(person);
    const notesContent =
        renderFamilyNotes(
            person
        );
    const photoCount = getPersonPhotoCount(person.id);
    const archiveCount = getArchiveFilesForPerson(person.id).length;
    const noteCount = getNotesForPerson(person.id).length;
    const centralPerson =
        getPerson(
            person.id
        );

    const personSources =
        centralPerson
            ? sourcesForTarget(
                'person',
                centralPerson.id,
                centralPerson.projectId
            )
            : [];

    const sourceCount =
        personSources.length;

    const sourcesContent =
        centralPerson
            ? renderConnectedSourceList({
                targetType:
                'person',

                targetId:
                centralPerson.id,

                projectId:
                centralPerson.projectId,

                sources:
                personSources,

                emptyText:
                'No sources linked to this person.'
            })
            : renderInspectorSectionEmpty(
                'No sources linked to this person.'
            );
    const contextClass = isPeopleContext ? ' people-person-sidebar' : '';

    return `
        <aside
          class="tree-inspector family-person-pane${contextClass}"
          ${contextAttribute}
          aria-label="Selected person details">
        ${renderFamilyTreePersonHero(person)}
        <div class="family-person-actions">${actionsContent}</div>
        ${renderInspectorSection('insights', 'Insights', 'No insights found', '<div class="panel-muted">No insights found for this person.</div>')}
        ${renderInspectorSection(
            'timeline',
            'Timeline',
            '',
            timelineContent,
            `<button
            class="panel-action"
            type="button"
            data-person-add-fact>
            ${renderPanelButtonLabel(
                icon.plus,
                'Add fact'
            )}
          </button>`,
            { inlineAction: true }
        )}
        ${renderInspectorSection(
            'relationships',
            'Relationships',
            translateCountPhrase(`${relationshipsCount} ${relationshipsCount === 1 ? 'connection' : 'connections'}`),
            relationshipsContent,
            `<button class="panel-action" type="button" data-manage-relationships="${escapeHtml(person.id)}" aria-label="${escapeHtml(t('Edit'))}" title="${escapeHtml(t('Edit'))}">${renderPanelButtonLabel(icon.edit, 'Edit')}</button>`,
            { inlineAction: true }
        )}
        ${renderInspectorSection(
            'photos',
            'Photos',
            state.language === 'ru'
                ? `${photoCount} фото`
                : `${photoCount} ${photoCount === 1 ? 'photo' : 'photos'}`,
            photosContent,
            `
            <button
              class="panel-action"
              type="button"
              data-person-add-photos="${
                    escapeHtml(person.id)
                }">
              ${renderPanelButtonLabel(
                    icon.plus,
                    'Add photos'
                )}
            </button>
          `,
            {
                inlineAction: true,

                footerHtml:
              renderPersonPanelViewAll({
                  resource: 'photos',
                  count: photoCount,
                  personId: person.id
              })
            }
        )}

        ${renderInspectorSection(
            'archive',
            'Archive',
            `${archiveCount} ${
                archiveCount === 1
                    ? 'file'
                    : 'files'
            }`,
            archiveContent,
            `
            <button
              class="panel-action"
              type="button"
              data-person-add-files="${escapeHtml(
                    person.id
                )}">

              ${renderPanelButtonLabel(
                    icon.plus,
                    'Add file'
                )}
            </button>
          `,
            {
                inlineAction: true,

                footerHtml:
              renderPersonPanelViewAll({
                  resource: 'archive',
                  count: archiveCount,
                  personId: person.id
              })
            }
        )}

        ${renderInspectorSection(
            'notes',
            'Notes',
            `${noteCount} ${
                noteCount === 1
                    ? 'note'
                    : 'notes'
            }`,
            notesContent,
            `
            <button
              class="panel-action"
              type="button"
              data-person-add-note="${escapeHtml(
                    person.id
                )}">
              ${renderPanelButtonLabel(
                    icon.plus,
                    'Add note'
                )}
            </button>
          `,
            {
                inlineAction: true,

                footerHtml:
              renderPersonPanelViewAll({
                  resource: 'notes',
                  count: noteCount,
                  personId: person.id
              })
            }
        )}
        ${renderInspectorSection(
            'sources',
            'Sources',
            `${sourceCount} ${
                sourceCount === 1
                    ? 'source'
                    : 'sources'
            }`,
            sourcesContent,
            centralPerson
                ? `
              <button
                class="panel-action"
                type="button"
                data-person-manage-sources="${escapeHtml(
                    centralPerson.id
                )}">

                ${renderPanelButtonLabel(
                    icon.plus,
                    'Add source'
                )}
              </button>
            `
                : '',
            {
                inlineAction:
              true
            }
        )}
      </aside>`;
}

function timelineEventBoundaryRank(event)
{
    if (event?.type === 'birth') return 0;
    if (event?.type === 'death') return 2;
    return 1;
}

function compareTimelineEvents(a, b)
{
    const first = parseTimelineSortValue(a), second = parseTimelineSortValue(b);
    if (Number.isFinite(first) !== Number.isFinite(second)) return Number.isFinite(first) ? -1 : 1;
    const boundaryDiff = timelineEventBoundaryRank(a) - timelineEventBoundaryRank(b);
    if (boundaryDiff) return boundaryDiff;

    return (Number.isFinite(first) ? first - second : 0) || String(a.id).localeCompare(String(b.id));
}

function getFamilyTreeTimelineEvents(personId)
{
    return getEventsForPerson(personId)
        .slice()
        .sort(compareTimelineEvents);
}

function renderFamilyTreeTimeline(personId)
{
    const events = getFamilyTreeTimelineEvents(personId);

    if (!events.length)
    {
        return `<div class="panel-muted">No timeline events recorded for this person.</div>`;
    }

    return `<div class="timeline">
        ${events.map(event => renderTimelineItem(event, personId)).join('')}
      </div>`;
}

function parseTimelineSortValue(value)
{
    return genealogyDateSortValue(value);
}

function timelineDateLabel(event)
{
    return formatGenealogyDateLabel(event);
}

function timelineYearFromValue(value)
{
    if (!value) return '';
    const date = normalizeGenealogyDateInput(value);
    const year = date.first?.year || date.second?.year;
    return year ? String(year).padStart(4, '0') : '';
}

function timelineYear(event)
{
    return timelineYearFromValue(event) || '—';
}

function timelinePlaceLabel(event)
{
    return cleanEditFieldValue(getPlaceDisplay(event?.placeId))
        || cleanEditFieldValue(event?.placeText);
}

function timelineEventIcon(event)
{
    const map = {
        birth: icon.birth,
        childBirth: icon.birth,
        marriage: icon.marriage,
        education: icon.education,
        occupation: icon.work,
        baptism: icon.baptism,
        burial: icon.mapPin,
        customFact: icon.info,
        death: icon.death
    };

    return map[event.type] || icon.clock;
}

function timelineEventColor(event)
{
    const map = {
        marriage: 'amber',
        education: 'blue',
        occupation: 'blue',
        baptism: 'blue',
        customFact: 'blue',
        burial: 'gray',
        death: 'gray'
    };

    return map[event.type] || '';
}

function timelineEventIsLasting(event)
{
    return event?.dateKind === 'span' || ['education', 'occupation'].includes(event?.type);
}

function timelineDateParts(value)
{
    const model = normalizeGenealogyDateInput(value);
    if (model.state !== 'known') return null;
    return { ...model.first, precision: model.first.year && model.first.month && model.first.day ? 'day' : 'partial' };
}

function timelineAgeAtEvent(event, personId)
{
    if (!event || event.type === 'birth' || timelineEventIsLasting(event)) return null;

    const person = getPerson(personId);
    if (!person?.birth) return null;

    return genealogyAgeRange(person.birth, event);
}

function timelineAgeLabel(event, personId)
{
    const age = timelineAgeAtEvent(event, personId);
    return age === null ? '' : `Age: ${age}`;
}

function timelineDateBlockHtml(event, personId)
{
    if (timelineEventIsLasting(event))
    {
        const fromYear = timelineYearFromValue(event.fromDate || event);
        const toYear = timelineYearFromValue(event.toDate);

        if (fromYear && toYear)
        {
            return `<span class="timeline-date-range">
            <span>${escapeHtml(fromYear)}</span>
            <span class="timeline-date-separator">to</span>
            <span>${escapeHtml(toYear)}</span>
          </span>`;
        }

        if (fromYear) return escapeHtml(fromYear);
        if (toYear) return escapeHtml(toYear);

        return '—';
    }

    const year = timelineYear(event);
    const hasYear = Boolean(
        timelineYearFromValue(event)
    );

    const age = hasYear
        ? timelineAgeLabel(event, personId)
        : '';

    return `${escapeHtml(year)}${age ? `<span>${escapeHtml(age)}</span>` : ''}`;
}

function timelineEventDateLine(event)
{
    if (timelineEventIsLasting(event))
    {
        return timelineDateRangeLabel(event.fromDate, event.toDate)
          || '';
    }

    return timelineDateLabel(event) || '';
}

function timelineEventDatePlaceLines(event)
{
    const date = timelineEventDateLine(event);
    const place = timelinePlaceLabel(event);

    return [...date.split('\n'), place].filter(Boolean);
}

function timelineDetailLines(...values)
{
    return values
        .flat()
        .map(value => cleanEditFieldValue(value))
        .filter(Boolean)
        .map(escapeHtml)
        .join('<br>');
}

function timelineOtherPersonNames(event, personId)
{
    return (event.personIds || [])
        .filter(id => id && id !== personId)
        .map(getPersonDisplayName)
        .filter(Boolean);
}

function timelineEventDetail(event, personId)
{
    const datePlaceLines = timelineEventDatePlaceLines(event);

    if (event.type === 'childBirth')
    {
        return timelineDetailLines(event.description, datePlaceLines);
    }

    if (event.type === 'marriage')
    {
        const otherNames = timelineOtherPersonNames(event, personId);
        const withLine = otherNames.length
            ? `With ${otherNames.join(' and ')}`
            : event.description;

        return timelineDetailLines(withLine, datePlaceLines);
    }

    if (event.type === 'education')
    {
        return timelineDetailLines(
            event.institutionName,
            event.educationValue,
            datePlaceLines
        );
    }

    if (event.type === 'occupation')
    {
        return timelineDetailLines(
            event.occupation,
            event.company,
            datePlaceLines
        );
    }
    if (event.type === 'customFact')
    {
        return timelineDetailLines(
            event.description,
            datePlaceLines,
            event.notes
        );
    }

    return timelineDetailLines(datePlaceLines);
}

const timelineExpandedEvidence = new Set();

function timelineEvidenceFiles(event)
{
    return (sampleData.archiveFiles || []).filter(file =>
        file.projectId === event.projectId
        && (file.linkedEventIds || []).includes(event.id));
}

function timelineEvidenceCount(count, singular, plural, ruForms)
{
    if (state.language !== 'ru') return `${count} ${count === 1 ? singular : plural}`;
    const form = count % 10 === 1 && count % 100 !== 11 ? 0
        : count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 12 || count % 100 > 14) ? 1 : 2;
    return `${count} ${ruForms[form]}`;
}

function renderTimelineItem(
    event,
    personId
)
{
    const sources =
        sourcesForTarget(
            'event',
            event.id,
            event.projectId
        );
    const files = timelineEvidenceFiles(event);
    const key = `${event.projectId}:${event.id}`;
    const expanded = timelineExpandedEvidence.has(key);
    const panelId = `timeline-evidence-${escapeHtml(event.id)}`;

    return `
        <div class="timeline-item">
          <div class="timeline-date">
            ${timelineDateBlockHtml(
                event,
                personId
            )}
            ${event.editTarget ? `<button type="button" class="panel-action timeline-edit-fact" data-timeline-edit-fact="${escapeHtml(event.id)}" data-timeline-person="${escapeHtml(personId)}" aria-label="${escapeHtml(`${t(event.type === 'childBirth' ? "Edit child's birth" : 'Edit fact')}: ${getPersonDisplayName(event.editTarget.personId)}`)}" ${expanded ? '' : 'hidden'}>${icon.edit}${escapeHtml(t('Edit'))}</button>` : ''}
          </div>

          <div
            class="
              timeline-dot
              ${escapeHtml(
                    timelineEventColor(
                        event
                    )
                )}
            ">

            <span
              class="timeline-dot-icon"
              aria-hidden="true">
              ${timelineEventIcon(
                    event
                )}
            </span>
          </div>

          <div class="timeline-copy">
            <button class="timeline-evidence-toggle" type="button"
              data-timeline-evidence-toggle="${escapeHtml(event.id)}"
              data-event-project="${escapeHtml(event.projectId)}"
              aria-expanded="${expanded}" aria-controls="${panelId}">
              <strong>${escapeHtml(event.title)}</strong>
              <span class="timeline-evidence-chevron" aria-hidden="true">${icon.chevron}</span>
            </button>

            <span>
              ${String(
                    timelineEventDetail(
                        event,
                        personId
                    )
                || ''
                )}
            </span>

            ${files.length || sources.length ? `<span class="timeline-evidence-summary">${files.length ? timelineEvidenceCount(files.length, 'file', 'files', ['файл', 'файла', 'файлов']) : ''}${files.length && sources.length ? ' · ' : ''}${sources.length ? timelineEvidenceCount(sources.length, 'citation', 'citations', ['источник', 'источника', 'источников']) : ''}</span>` : ''}
          </div>
            <div id="${panelId}" class="timeline-evidence" ${expanded ? '' : 'hidden'}>
              <div class="timeline-evidence-heading"><strong>Evidence files</strong><button type="button" class="panel-action" data-event-add-file="${escapeHtml(event.id)}" data-event-project="${escapeHtml(event.projectId)}">${icon.plus} Add file</button></div>
              ${files.length ? files.map(file => `<div class="timeline-evidence-row"><span class="timeline-evidence-file-icon" aria-hidden="true">${icon.file}</span>${archiveCanViewFile(file) ? `<button type="button" class="text-action timeline-evidence-name" data-user-content data-event-open-file="${escapeHtml(file.id)}" title="${escapeHtml(file.name)}" aria-label="${escapeHtml(file.name)}">${escapeHtml(file.name)}</button>` : `<span class="timeline-evidence-name" data-user-content tabindex="0" title="${escapeHtml(file.name)}">${escapeHtml(file.name)}</span>`}<button type="button" class="relation-action-button" data-event-unlink-file="${escapeHtml(file.id)}" data-event-id="${escapeHtml(event.id)}" aria-label="Unlink ${escapeHtml(file.name)}" title="${escapeHtml(state.language === 'ru' ? 'Убрать связь' : 'Unlink file')}">${icon.close}</button></div>`).join('') : '<span class="timeline-evidence-empty">No files linked</span>'}
              <div class="timeline-evidence-heading"><strong>Citations</strong><button type="button" class="panel-action" data-event-manage-sources="${escapeHtml(event.id)}" data-event-source-project="${escapeHtml(event.projectId)}">${icon.plus} Add source</button></div>
              ${sources.length ? sources.map(source => `<div class="timeline-evidence-row"><span class="timeline-evidence-file-icon" aria-hidden="true">${icon.archive}</span><span class="timeline-evidence-name" data-user-content tabindex="0" title="${escapeHtml(source.title || 'Untitled source')}">${escapeHtml(source.title || 'Untitled source')}</span><button type="button" class="relation-action-button" data-event-unlink-source="${escapeHtml(source.id)}" data-event-id="${escapeHtml(event.id)}" data-event-project="${escapeHtml(event.projectId)}" aria-label="Unlink ${escapeHtml(source.title || 'source')}" title="${escapeHtml(state.language === 'ru' ? 'Убрать связь' : 'Unlink source')}">${icon.close}</button></div>`).join('') : '<span class="timeline-evidence-empty">No citations linked</span>'}
            </div>
        </div>
      `;
}

function bindTimelineSourceControls(
    root,
    {
        afterSave =
            null
    } = {}
)
{
    root?.querySelectorAll('[data-timeline-edit-fact]').forEach(button => button.addEventListener('click', () =>
    {
        const event = sampleData.events.find(item => item.id === button.dataset.timelineEditFact && item.projectId === currentProjectId());
        if (!event?.editTarget) return;
        const target = { ...event.editTarget, timelineEventId: event.id };
        if (target.kind === 'relationship') target.personId = button.dataset.timelinePerson;
        openTimelinePersonEditor(target);
    }));
    root?.querySelectorAll('[data-timeline-evidence-toggle]').forEach(button =>
        button.addEventListener('click', () => {
            const key = `${button.dataset.eventProject}:${button.dataset.timelineEvidenceToggle}`;
            const expanded = !timelineExpandedEvidence.has(key);
            if (expanded) timelineExpandedEvidence.add(key);
            else timelineExpandedEvidence.delete(key);
            button.setAttribute('aria-expanded', String(expanded));
            const panel = button.closest('.timeline-item')?.querySelector('.timeline-evidence');
            if (panel) panel.hidden = !expanded;
            const edit = button.closest('.timeline-item')?.querySelector('[data-timeline-edit-fact]');
            if (edit) edit.hidden = !expanded;
        }));
    root?.querySelectorAll('[data-event-add-file]').forEach(button =>
        button.addEventListener('click', () => {
            const eventId = button.dataset.eventAddFile;
            const projectId = button.dataset.eventProject;
            const event = sourceTargetRecord('event', eventId, projectId);
            if (!event) return showToast('The event is no longer available.');
            openConnectedFilesModal({ projectId, title: 'Add evidence file',
                subtitle: `Connect Archive files to ${event.title}.`,
                existingFileIds: timelineEvidenceFiles(event).map(file => file.id),
                onSave: (ids, context) => archiveSetConnectionsAtomically(context.changes.decisions.map(({ id, linked }) => ({ ownerType: 'file', ownerId: id, entityType: 'event', entityId: eventId, shouldLink: linked }))),
                afterSave } );
        }));
    root?.querySelectorAll('[data-event-open-file]').forEach(button =>
        button.addEventListener('click', () => openArchiveDocumentViewer(button.dataset.eventOpenFile)));
    root?.querySelectorAll('[data-event-unlink-file]').forEach(button =>
        button.addEventListener('click', () => {
            if (archiveSetConnection('file', button.dataset.eventUnlinkFile, 'event', button.dataset.eventId, false)) afterSave?.();
        }));
    root?.querySelectorAll('[data-event-unlink-source]').forEach(button =>
        button.addEventListener('click', () => {
            if (setSourceLink(button.dataset.eventUnlinkSource, 'event', button.dataset.eventId, false, { projectId: button.dataset.eventProject })) afterSave?.();
        }));
    root
        ?.querySelectorAll(
            '[data-event-manage-sources]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    const eventId =
                        button.dataset
                            .eventManageSources;

                    const projectId =
                        button.dataset
                            .eventSourceProject
                  || currentProjectId();

                    const event =
                        sourceTargetRecord(
                            'event',
                            eventId,
                            projectId
                        );

                    if (!event)
                    {
                        showToast(
                            'The event is no longer available.'
                        );

                        return;
                    }

                    openSourcesForTargetModal({
                        targetType:
                  'event',

                        targetId:
                  event.id,

                        projectId,

                        title:
                  'Add sources',

                        subtitle:
                  `Connect existing sources to ${
                      event.title
                    || 'this event'
                  }.`,

                        afterSave
                    });
                }
            );
        });
}

