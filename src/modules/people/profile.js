const PROFILE_CARD_SECTIONS = Object.freeze([
    Object.freeze({
        id: 'main',
        label: 'Main information'
    }),
    Object.freeze({
        id: 'education',
        label: 'Education'
    }),
    Object.freeze({
        id: 'work',
        label: 'Work'
    }),
    Object.freeze({
        id: 'other',
        label: 'Other'
    })
]);

function normalizeProfileCardSection(value)
{
    return PROFILE_CARD_SECTIONS.some(
        section => section.id === value
    )
        ? value
        : 'main';
}

function renderProfileHeroName(person, centralPerson)
{
    const names = centralPerson?.names;
    const maiden = normalizeNameSegment(
        names?.maiden
    );

    if (!maiden)
    {
        return escapeHtml(person.name);
    }

    const mainName = [
        names.prefix,
        names.first,
        names.middle,
        names.last
    ]
        .map(normalizeNameSegment)
        .filter(Boolean)
        .join(' ')
        .replace(/\s+/g, ' ');

    const suffix = normalizeNameSegment(
        names.suffix
    );

    return [
        mainName ? escapeHtml(mainName) : '',
        `<span class="profile-hero-maiden">(${escapeHtml(maiden)})</span>`,
        suffix ? escapeHtml(suffix) : ''
    ].filter(Boolean).join(' ');
}

function renderPeopleProfile(person)
{
    main.classList.add('people-profile-main');

    state.peopleProfileEditTab =
        normalizeProfileCardSection(
            state.peopleProfileEditTab
        );

    // Match chip placement to the life facts actually rendered.
    const hasDeathLifeRow =
        peopleHeroLifeSummaryItems(person).length > 1;

    const placeCount =
        getProfileConnectedPlaces(person.id).length;

    const eventCount =
        getFamilyTreeTimelineEvents(person.id).length;

    const centralPerson =
        getPerson(person.id);

    const sourceCount =
        centralPerson
            ? sourcesForTarget(
                'person',
                centralPerson.id,
                centralPerson.projectId
            ).length
            : 0;

    main.innerHTML = `
        <div class="person-profile">
          <header class="profile-hero profile-command-hero">
            <div class="profile-hero-content${hasDeathLifeRow ? ' profile-hero-content--with-death' : ''}">
              ${renderEditablePersonAvatar(
                    person,
                    'profile-hero-photo'
                )}

              <div class="profile-hero-copy">
                <h1>
                  ${renderProfileHeroName(person, centralPerson)}
                </h1>
              </div>

              ${renderPeopleHeroLifeSummary(
                    person,
                    {
                        includeBirthPlace: true,
                        includeDeathPlace: true,
                        showEventIcons: true
                    }
                )}

              <div
                class="
                  app-chip-row
                  app-chip-row--on-accent
                  person-profile-chips
                  profile-hero-tags
                ">

                ${renderLivingStatusChip(
                    person.living
                )}

                <span
                  class="
                    app-chip
                    app-chip--photos
                  ">

                  ${person.photos}
                  ${
                        person.photos === 1
                            ? 'photo'
                            : 'photos'
                    }
                </span>

                <span
                  class="
                    app-chip
                    app-chip--files
                  ">

                  ${person.files}
                  ${
                        person.files === 1
                            ? 'file'
                            : 'files'
                    }
                </span>

                <span
                  class="
                    app-chip
                    app-chip--notes
                  ">

                  ${person.notes}
                  ${
                        person.notes === 1
                            ? 'note'
                            : 'notes'
                    }
                </span>

                <span
                  class="
                    app-chip
                    app-chip--places
                  ">

                  ${placeCount}
                  ${placeCount === 1 ? 'place' : 'places'}
                </span>

                <span
                  class="
                    app-chip
                    app-chip--events
                  ">

                  ${eventCount}
                  ${eventCount === 1 ? 'event' : 'events'}
                </span>

                <span
                  class="
                    app-chip
                    app-chip--sources
                  ">

                  ${sourceCount}
                  ${sourceCount === 1 ? 'source' : 'sources'}
                </span>
              </div>
            </div>

            <div class="profile-hero-actions">
              <button class="button primary" type="button" id="profileEditButton">
                ${icon.edit}
                Edit profile
              </button>

              <button
                class="button secondary control-icon-button profile-hero-more-actions"
                type="button"
                id="profileMoreActions"
                aria-label="More actions"
                title="More actions"
                aria-haspopup="menu"
                aria-expanded="false">

                ${icon.more}
              </button>
            </div>
          </header>

          <div class="person-profile__top">
            ${renderProfileCard(person)}

            <div class="profile-family-slot">
              ${renderProfileFamilyHub(person)}
            </div>
          </div>

          <div class="person-profile__bottom">
            ${renderProfileConnectedCube(person)}
            ${renderProfileCompactTimeline(person)}
          </div>
        </div>
      `;

    bindPeopleProfileControls(person);
}

function peopleProfileAssets(person)
{
    const archiveMap = {
        silver: [
            { type: 'PNG', name: 'Pawford household register', meta: 'Four linked people - Source assigned', fileId: 'af1' },
            { type: 'JPG', name: 'Silver kitten portrait', meta: 'Added Feb 20 2021 - Personal album', fileId: null },
            { type: 'PNG', name: 'Silver birth announcement', meta: 'Name marked in image', fileId: 'af7' },
            { type: 'PNG', name: 'Meowbridge marriage record', meta: 'Linked to Luna', fileId: 'af5' }
        ],
        luna: [
            { type: 'JPG', name: 'Luna Purrington portrait', meta: 'Added Apr 30 2026 - Personal album', fileId: null },
            { type: 'PNG', name: 'Meowbridge marriage record', meta: 'Name marked in image', fileId: 'af5' },
            { type: 'PNG', name: 'Daisy letter to Luna', meta: 'Family correspondence', fileId: 'af4' }
        ],
        barnaby: [
            { type: 'PNG', name: 'Pawford household register', meta: 'Name marked in image', fileId: 'af1' },
            { type: 'PNG', name: 'Pawford register index', meta: 'Page reference', fileId: 'af3' }
        ],
        daisy: [
            { type: 'PNG', name: 'Daisy birth record', meta: 'Name marked in image', fileId: 'af-birth-sample' },
            { type: 'PNG', name: 'Daisy letter to Luna', meta: 'Family correspondence', fileId: 'af4' },
            { type: 'JPG', name: 'Daisy Milkpaw scan', meta: 'Added May 2 2026 - Family album', fileId: null }
        ]
    };
    return {
        archive:
          archiveMap[person.id]
          || [
              {
                  type:
                'PDF',

                  name:
                'Linked archive file.pdf',

                  meta:
                'Added recently - Source assigned',

                  fileId:
                null
              }
          ]
    };
}

function splitProfileName(person)
{
    const centralPerson = getPerson(person?.id);
    const names = centralPerson?.names || {};

    return {
        first: normalizeNameSegment(
            names.first ?? person?.first ?? ''
        ),

        patronym: normalizeNameSegment(
            names.middle ?? ''
        ),

        surname: normalizeNameSegment(
            names.last ?? person?.surname ?? ''
        )
    };
}

function renderProfileInfoRow(label, value, { fullValue = false, userContent = false, multiline = false } = {})
{
    const tooltip = fullValue && value !== '-'
        ? ` tabindex="0" title="${escapeHtml(value)}"`
        : '';
    const attributes = value === '-' ? ' class="profile-info-placeholder"' : tooltip;
    return `
        <div class="profile-info-row${multiline ? ' profile-info-row-multiline' : ''}">
          <span>${escapeHtml(label)}</span>
          <strong${attributes}${userContent ? ' data-user-content' : ''}>${escapeHtml(value)}</strong>
        </div>
      `;
}

function renderProfileInfoRowRaw(label, html)
{
    return `
        <div class="profile-info-row">
          <span>${escapeHtml(label)}</span>
          <strong>${html}</strong>
        </div>
      `;
}

function renderProfileStatusValue(status)
{
    const safeStatus = status || 'Unknown';

    return `
        <span class="profile-status-inline">
          <span
            class="
              add-person-status-dot
              ${statusDotClass(safeStatus)}
            "
            aria-hidden="true">
          </span>

          ${escapeHtml(safeStatus)}
        </span>
      `;
}

function renderProfileCard(person)
{
    if (profileFactPersonId !== person.id)
    {
        profileFactPersonId = person.id;
        profileFactRecordIds.clear();
    }
    const activeSection = normalizeProfileCardSection(state.peopleProfileEditTab);

    return `
        <article class="profile-card profile-full-card" data-profile-card-root>
          <h3>
            <span class="section-title">${icon.people} Profile</span>
            <button class="panel-action profile-connected-action" type="button" data-profile-add-fact>
              ${icon.plus}<span>${escapeHtml(t('Add fact'))}</span>
            </button>
          </h3>
          <div class="profile-card-body">
            ${renderProfileCardTabs(activeSection)}
            ${renderProfileCardPanels(person, activeSection)}
          </div>
        </article>
      `;
}

function renderProfileReadOnlyPanelContent(
    person,
    sectionId
)
{
    const activeSection =
        normalizeProfileCardSection(sectionId);

    const name = splitProfileName(person);
    const details = peopleProfileDetailsFor(person);

    const isDeceased =
        person.living === 'Deceased';

    const isFemale =
        person.gender === 'female';

    const centralPerson = getPerson(person.id);

    const birthLabel =
        formatGenealogyDateLabel(
            centralPerson?.birth || person.birth
        );

    const deathLabel =
        formatGenealogyDateLabel(
            centralPerson?.death || person.death
        );

    const deathPlaceLabel =
        cleanEditFieldValue(person.deathPlace);

    if (activeSection === 'education' || activeSection === 'work')
    {
        return renderRepeatableFactReadOnly(centralPerson, activeSection === 'education' ? 'EDUC' : 'OCCU');
    }

    if (activeSection === 'other')
    {
        return renderRepeatableFactReadOnly(centralPerson, 'FACT');
    }

    const religion = normalizeReligionValue(details.religion);
    const additionalRows = [
        ['Alternative names', details.alternativeNames, { fullValue: true, userContent: true }],
        ['Religion', religion === DEFAULT_RELIGION ? '' : religion],
        ['Baptism date', profileDetailDateLabel(details.baptismDate, '')],
        ['Baptism place', cleanEditFieldValue(details.baptismPlace), { fullValue: true }]
    ].filter(([, value]) => value);

    return `
        <div
          class="
            profile-readonly-grid
            profile-readonly-grid-tabbed
            main
          ">

          <section class="profile-info-block">
            <h4>${escapeHtml(t('Identity'))}</h4>
            ${renderProfileInfoRow(
                'Gender',
                isFemale
                    ? 'Female'
                    : person.gender === 'male'
                        ? 'Male'
                        : 'Unknown'
            )}
            ${renderProfileInfoRow(
                'First name',
                name.first || '-', { fullValue: true }
            )}

            ${renderProfileInfoRow(
                'Last name',
                name.surname || '-', { fullValue: true }
            )}

            ${renderProfileInfoRow(
                'Patronym',
                name.patronym || '-', { fullValue: true }
            )}

            ${isFemale
                ? renderProfileInfoRow(
                    'Maiden name',
                    details.maidenName || '-', { fullValue: true }
                )
                : ''}

            ${renderProfileInfoRow(
                'Prefix',
                details.prefix || '-', { fullValue: true }
            )}

            ${renderProfileInfoRow(
                'Suffix',
                details.suffix || '-', { fullValue: true }
            )}
          </section>

          <section class="profile-info-block">
            <h4>${escapeHtml(t('Vital records'))}</h4>

            ${renderProfileInfoRowRaw(
                'Living status',
                renderProfileStatusValue(
                    person.living || 'Unknown'
                )
            )}
            
            ${renderProfileInfoRow(
                'Birth date',
                birthLabel || '-'
            )}

            ${renderProfileInfoRow(
                'Birth place',
                person.birthPlace || '-', { fullValue: true }
            )}

            ${isDeceased
                ? `
                ${renderProfileInfoRow(
                    'Death date',
                    deathLabel || '-'
                )}

                ${renderProfileInfoRow(
                    'Death place',
                    deathPlaceLabel || '-', { fullValue: true }
                )}

                ${renderProfileInfoRow(
                    'Death reason',
                    details.deathReason || '-'
                )}

                ${renderProfileInfoRow(
                    'Burial place',
                    details.burialPlace || '-', { fullValue: true }
                )}
              `
                : ''}
          </section>

          <section class="profile-info-block">
            <h4>${escapeHtml(t('Additional information'))}</h4>
            ${additionalRows.length
                ? additionalRows.map(([label, value, options]) => renderProfileInfoRow(label, value, options)).join('')
                : `<p class="panel-muted">${escapeHtml(t('Not recorded'))}</p>`}
          </section>
        </div>
      `;
}

function renderProfileCardTabs(activeSection)
{
    const active =
        normalizeProfileCardSection(activeSection);

    return `
        <div
          class="profile-card-tabs"
          role="tablist"
          aria-label="Profile card sections">

          ${PROFILE_CARD_SECTIONS.map(section =>
            {
                const isActive =
                    section.id === active;

                const tabId =
                    `profile-card-tab-${section.id}`;

                const panelId =
                    `profile-card-panel-${section.id}`;

                return `
              <button
                class="
                  profile-card-tab
                  ${isActive ? 'active' : ''}
                "
                id="${escapeHtml(tabId)}"
                type="button"
                role="tab"
                aria-selected="${
                    isActive ? 'true' : 'false'
                }"
                aria-controls="${escapeHtml(panelId)}"
                tabindex="${isActive ? '0' : '-1'}"
                data-profile-card-tab="${
                    escapeHtml(section.id)
                }">
                ${escapeHtml(section.label)}
              </button>
            `;
            }).join('')}
        </div>
      `;
}

function renderProfileCardPanels(person, activeSection)
{
    const active =
        normalizeProfileCardSection(activeSection);

    return `
        <div class="profile-card-panel-stack">
          ${PROFILE_CARD_SECTIONS.map(section =>
            {
                const isActive =
                    section.id === active;

                const tabId =
                    `profile-card-tab-${section.id}`;

                const panelId =
                    `profile-card-panel-${section.id}`;

                const content = renderProfileReadOnlyPanelContent(person, section.id);

                return `
              <section
                class="
                  profile-card-panel
                  ${isActive ? 'active' : ''}
                "
                id="${escapeHtml(panelId)}"
                role="tabpanel"
                aria-labelledby="${escapeHtml(tabId)}"
                aria-hidden="${
                    isActive ? 'false' : 'true'
                }"
                data-profile-card-panel="${
                    escapeHtml(section.id)
                }"
                ${isActive ? '' : 'inert'}>
                ${content}
              </section>
            `;
            }).join('')}
        </div>
      `;
}

function profileResourceNoun(count, singular, plural)
{
    return count === 1 ? singular : plural;
}

function renderProfileResourceEmpty(message)
{
    return `
        <div class="profile-resource-empty">
          ${escapeHtml(message)}
        </div>
      `;
}

function renderProfileResourceCard({
    type,
    iconSvg,
    title,
    count,
    singular,
    plural,
    addLabel,
    addToast,
    addAction = '',
    showFooter = true,
    body
})
{
    const noun = profileResourceNoun(
        count,
        singular,
        plural
    );

    return `
        <article
          class="
            profile-resource-card
            profile-connected-card
            profile-resource-card--${type}
          ">

          <h3 class="profile-connected-head">
            <span class="profile-connected-title">
              <span class="profile-connected-icon">
                ${iconSvg}
              </span>

              <span>${escapeHtml(title)}</span>

              <span
                class="profile-resource-count"
                aria-label="${escapeHtml(`${count} ${noun}`)}">
                ${count}
              </span>
            </span>

            ${addLabel
                    ? `
                <span class="profile-connected-actions">
                  <button
                    class="panel-action profile-connected-action"
                    type="button"
                    ${
                        addAction
                            ? `data-profile-resource-action="${escapeHtml(addAction)}"`
                            : `data-toast="${escapeHtml(addToast || '')}"`
                    }>

                    ${icon.plus}

                    <span>
                      ${escapeHtml(addLabel)}
                    </span>
                  </button>
                </span>
              `
                    : ''
            }
          </h3>

          <div class="profile-resource-card__body">
            ${body}
          </div>

          ${showFooter && count > 0
                ? `
              <button
                class="profile-resource-card__footer"
                type="button"
                data-profile-view-all="${type}">
                <span>
                  View all ${count} ${escapeHtml(noun)}
                </span>

                ${icon.chevron}
              </button>
            `
                : ''}
        </article>
      `;
}

function profileArchiveAddedLabel(item)
{
    const meta = String(item?.meta || '').trim();

    if (!meta) return 'Added recently';

    return meta.split(/\s+-\s+/)[0]
        || 'Added recently';
}

function profileConnectedPlaceEventLabel(
    event
)
{
    return (
        cleanEditFieldValue(
            event?.title
        )
        || cleanEditFieldValue(
            event?.type
        )
        || t('Event')
    );
}

function profileConnectedPlaceMeta(
    events
)
{
    const labels = [
        ...new Set(
            events
                .map(
                    profileConnectedPlaceEventLabel
                )
                .filter(Boolean)
        )
    ];

    const visibleLabels =
        labels.slice(0, 2);

    const remainingCount =
        labels.length
        - visibleLabels.length;

    return [
        visibleLabels.join(' · '),

        remainingCount > 0
            ? `+${remainingCount} ${t('more')}`
            : ''
    ]
        .filter(Boolean)
        .join(' · ')
        || t('Linked event');
}

function getProfileConnectedPlaces(
    personId
)
{
    const person =
        getPerson(personId);

    if (!person)
    {
        return [];
    }

    const groupedPlaces =
        new Map();

    (sampleData.events || [])
        .forEach(event =>
        {
            if (
                event?.projectId
              !== person.projectId
            )
            {
                return;
            }

            if (
                !Array.isArray(
                    event.personIds
                )
            || !event.personIds.includes(
                person.id
            )
            )
            {
                return;
            }

            const place =
                getPlace(event.placeId);

            if (
                !place
            || place.projectId
              !== person.projectId
            )
            {
                return;
            }

            const existing =
                groupedPlaces.get(place.id)
            || {
                id: place.id,
                place,
                events: [],
                sortValue:
                Number.POSITIVE_INFINITY
            };

            existing.events.push(event);

            existing.sortValue =
                Math.min(
                    existing.sortValue,
                    parseTimelineSortValue(
                        event
                    )
                );

            groupedPlaces.set(
                place.id,
                existing
            );
        });

    return [
        ...groupedPlaces.values()
    ]
        .map(group => ({
            id: group.place.id,

            title:
            placeDisplayText(
                group.place
            )
            || t('Unnamed place'),

            meta:
            profileConnectedPlaceMeta(
                group.events
            ),

            hasCoordinates:
            placeHasCoordinates(
                group.place
            ),

            sortValue:
            group.sortValue
        }))
        .sort(
            (first, second) =>
                first.sortValue
              - second.sortValue
            || first.title.localeCompare(
                second.title
            )
        );
}

function renderProfileConnectedSources(
    person
)
{
    const centralPerson =
        getPerson(
            person.id
        );

    const sources =
        centralPerson
            ? sourcesForTarget(
                'person',
                centralPerson.id,
                centralPerson.projectId
            )
            : [];

    const body =
        centralPerson
            ? renderConnectedSourceList({
                targetType:
                'person',

                targetId:
                centralPerson.id,

                projectId:
                centralPerson.projectId,

                sources,

                emptyText:
                'No sources linked to this person.'
            })
            : renderProfileResourceEmpty(
                'No sources linked to this person.'
            );

    return renderProfileResourceCard({
        type:
          'sources',

        iconSvg:
          icon.archive,

        title:
          'Sources',

        count:
          sources.length,

        singular:
          'source',

        plural:
          'sources',

        addLabel:
          'Add source',

        addAction:
          'add-sources',

        showFooter:
          false,

        body
    });
}

function renderProfileConnectedCube(
    person
)
{
    return `
        <section
          class="profile-connected-cube"
          aria-label="Connected profile items">

          ${renderProfileConnectedPhotos(
                person
            )}
          ${renderProfileConnectedFiles(
                person
            )}
          ${renderProfileConnectedNotes(
                person
            )}
          ${renderProfileConnectedPlaces(
                person
            )}
        </section>
      `;
}

function renderProfileCompactTimeline(person)
{
    const timelineContent =
        renderFamilyTreeTimeline(person.id);

    return `
        <section
          class="profile-compact-timeline profile-connected-card"
          aria-label="Timeline">

          <h3 class="profile-connected-head profile-timeline-head">
            <span class="profile-connected-title">
              <span class="profile-connected-icon">
                ${icon.clock}
              </span>

              <span>Timeline</span>
            </span>

          </h3>

          <div class="profile-compact-timeline-list">
            ${timelineContent}
          </div>
        </section>
      `;
}

function renderProfileConnectedPhotos(person)
{
    const photos = getPhotosForPerson(person.id);
    const hasOverflow = photos.length > 3;
    const trackId = `profilePhotoTrack-${person.id}`;

    const body = photos.length
        ? `
          <div
            class="
              profile-photo-carousel
              ${hasOverflow ? 'has-overflow' : ''}
            "
            data-profile-photo-carousel>

            ${hasOverflow
                ? `
                <button
                  class="
                    profile-photo-carousel-button
                    previous
                  "
                  type="button"
                  data-profile-photo-prev
                  aria-label="Previous photos"
                  aria-controls="${escapeHtml(trackId)}"
                  disabled>
                  ${icon.arrow}
                </button>
              `
                : ''}

            <div
              class="profile-photo-track"
              id="${escapeHtml(trackId)}"
              data-profile-photo-track
              aria-label="Photos for ${escapeHtml(person.name)}">

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
                        profile-photo-item
                      ">

                      <button
                        class="profile-photo-thumb"
                        type="button"
                        data-profile-photo="${escapeHtml(
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

            ${hasOverflow
                ? `
                <button
                  class="
                    profile-photo-carousel-button
                    next
                  "
                  type="button"
                  data-profile-photo-next
                  aria-label="Next photos"
                  aria-controls="${escapeHtml(trackId)}">
                  ${icon.chevron}
                </button>
              `
                : ''}
          </div>
        `
        : renderProfileResourceEmpty('No photos yet');

    return renderProfileResourceCard({
        type: 'photos',
        iconSvg: icon.image,
        title: 'Photos',
        count: photos.length,
        singular: 'photo',
        plural: 'photos',
        addLabel: 'Add photos',
        addAction: 'add-photos',
        body
    });
}

function renderProfileConnectedFiles(
    person
)
{
    const files =
        getArchiveFilesForPerson(
            person.id
        );

    const preview =
        files.slice(
            0,
            3
        );

    const body =
        preview.length
            ? renderConnectedFileList({
                files:
              preview,

                contextType:
              'person',

                contextId:
              person.id,

                emptyText:
              'No archive files linked'
            })
            : renderProfileResourceEmpty(
                'No archive files linked'
            );

    return renderProfileResourceCard({
        type:
          'archive',

        iconSvg:
          icon.file,

        title:
          'Archive',

        count:
          files.length,

        singular:
          'file',

        plural:
          'files',

        addLabel:
          'Add file',

        addAction:
          'add-files',

        body
    });
}

function renderProfileNoteRows(
    person,
    notes =
        getNotesForPerson(
            person.id
        )
)
{
    const preview =
        notes.slice(
            0,
            3
        );

    if (!preview.length)
    {
        return renderProfileResourceEmpty(
            'No notes yet'
        );
    }

    return renderConnectedNoteList({
        notes: preview,
        contextType: 'person',
        contextId: person.id,
        limit: 3
    });
}

function renderProfileConnectedNotes(
    person
)
{
    const notes =
        getNotesForPerson(
            person.id
        );

    return renderProfileResourceCard({
        type:
          'notes',

        iconSvg:
          icon.note,

        title:
          'Notes',

        count:
          notes.length,

        singular:
          'note',

        plural:
          'notes',

        addLabel:
          'Add note',

        addAction:
          'add-note',

        body:
          renderProfileNoteRows(
              person,
              notes
          )
    });
}

function renderProfileConnectedPlaces(
    person
)
{
    const places =
        getProfileConnectedPlaces(
            person.id
        );

    const preview =
        places.slice(0, 3);

    const coordinateWarning =
        t(
            'Location has no coordinates'
        );

    const body = preview.length
        ? `
          <div
            class="
              profile-resource-list
            ">

            ${preview
                .map(place =>
                {
                    const accessibleLabel = [
                        `Open ${place.title}`,

                        !place.hasCoordinates
                            ? coordinateWarning
                            : ''
                    ]
                        .filter(Boolean)
                        .join('. ');

                    return `
                  <button
                    class="
                      profile-resource-row
                      profile-place-preview-row
                    "
                    type="button"
                    data-profile-place="${escapeHtml(
                        place.id
                    )}"
                    aria-label="${escapeHtml(
                        accessibleLabel
                    )}">

                    <span
                      class="
                        profile-place-preview-title
                      ">

                      <strong>
                        ${escapeHtml(
                            place.title
                        )}
                      </strong>

                      ${
                            !place.hasCoordinates
                                ? `
                            <span
                              class="
                                profile-place-coordinate-warning
                              "
                              role="img"
                              aria-label="${escapeHtml(
                                    coordinateWarning
                                )}"
                              title="${escapeHtml(
                                    coordinateWarning
                                )}">
                              ${icon.warning}
                            </span>
                          `
                                : ''
                        }
                    </span>

                    <small
                      class="
                        profile-place-preview-meta
                      ">
                      ${escapeHtml(
                            place.meta
                        )}
                    </small>
                  </button>
                `;
                })
                .join('')}
          </div>
        `
        : renderProfileResourceEmpty(
            'No places linked'
        );

    return renderProfileResourceCard({
        type: 'places',
        iconSvg: icon.mapPin,
        title: 'Places',
        count: places.length,
        singular: 'place',
        plural: 'places',
        body
    });
}

function renderProfileFamilyHub(person)
{
    return `
        <section
          class="profile-side-card profile-family-hub"
          aria-label="Family relationships">

          <h3 class="profile-family-head">
            <span class="section-title profile-family-title">
              <span
                class="profile-family-title-icon"
                aria-hidden="true">
                ${icon.peoplegroup}
              </span>

              <span>Family</span>
            </span>

            <button class="panel-action profile-connected-action" type="button" data-profile-add-relative aria-haspopup="dialog" aria-expanded="false">
              ${icon.plus}<span>${escapeHtml(t('Add relative'))}</span>
            </button>
          </h3>

          <div class="profile-family-scroll">
            ${renderRelationships(person.id)}
          </div>
        </section>
      `;
}

function updateProfilePhotoCarousel(carousel)
{
    const track = carousel?.querySelector(
        '[data-profile-photo-track]'
    );

    const previous = carousel?.querySelector(
        '[data-profile-photo-prev]'
    );

    const next = carousel?.querySelector(
        '[data-profile-photo-next]'
    );

    if (!track || !previous || !next) return;

    previous.disabled = track.scrollLeft <= 2;

    next.disabled =
        track.scrollLeft + track.clientWidth
        >= track.scrollWidth - 2;
}

function bindProfilePhotoCarousels(root = main)
{
    root
        .querySelectorAll('[data-profile-photo-carousel]')
        .forEach(carousel =>
        {
            const track = carousel.querySelector(
                '[data-profile-photo-track]'
            );

            const previous = carousel.querySelector(
                '[data-profile-photo-prev]'
            );

            const next = carousel.querySelector(
                '[data-profile-photo-next]'
            );

            /*
          * Carousels with three or fewer photos do not render
          * navigation buttons.
          */
            if (!track || !previous || !next) return;

            const scrollTrack = direction =>
            {
                track.scrollBy({
                    left:
                Math.max(track.clientWidth * .82, 160)
                * direction,
                    behavior: 'smooth'
                });
            };

            previous.addEventListener('click', () =>
            {
                scrollTrack(-1);
            });

            next.addEventListener('click', () =>
            {
                scrollTrack(1);
            });

            track.addEventListener(
                'scroll',
                () => updateProfilePhotoCarousel(carousel),
                { passive: true }
            );

            requestAnimationFrame(() =>
            {
                updateProfilePhotoCarousel(carousel);
            });
        });
}

function activateProfileCardSection(
    card,
    sectionId,
    {
        focusTab = false
    } = {}
)
{
    if (!card) return;

    const activeSection =
        normalizeProfileCardSection(sectionId);

    state.peopleProfileEditTab =
        activeSection;

    const tabs = [
        ...card.querySelectorAll(
            '[data-profile-card-tab]'
        )
    ];

    const panels = [
        ...card.querySelectorAll(
            '[data-profile-card-panel]'
        )
    ];

    tabs.forEach(tab =>
    {
        const isActive =
            tab.dataset.profileCardTab
          === activeSection;

        tab.classList.toggle(
            'active',
            isActive
        );

        tab.setAttribute(
            'aria-selected',
            isActive ? 'true' : 'false'
        );

        tab.tabIndex = isActive ? 0 : -1;
    });

    panels.forEach(panel =>
    {
        const isActive =
            panel.dataset.profileCardPanel
          === activeSection;

        panel.classList.toggle(
            'active',
            isActive
        );

        panel.setAttribute(
            'aria-hidden',
            isActive ? 'false' : 'true'
        );

        if (isActive)
        {
            panel.removeAttribute('inert');
        }
        else
        {
            panel.setAttribute('inert', '');
        }
    });

    if (focusTab)
    {
        card.querySelector(
            `[data-profile-card-tab="${
                CSS.escape(activeSection)
            }"]`
        )?.focus();
    }
}

function bindProfileCardTabs(card)
{
    if (!card) return;

    const tabs = [
        ...card.querySelectorAll(
            '[data-profile-card-tab]'
        )
    ];

    tabs.forEach((tab, index) =>
    {
        tab.addEventListener('click', () =>
        {
            activateProfileCardSection(
                card,
                tab.dataset.profileCardTab
            );
        });

        tab.addEventListener(
            'keydown',
            event =>
            {
                const handledKeys = [
                    'ArrowLeft',
                    'ArrowRight',
                    'Home',
                    'End'
                ];

                if (
                    !handledKeys.includes(event.key)
                )
                {
                    return;
                }

                event.preventDefault();

                let nextIndex = index;

                if (event.key === 'ArrowLeft')
                {
                    nextIndex =
                        (index - 1 + tabs.length)
                % tabs.length;
                }

                if (event.key === 'ArrowRight')
                {
                    nextIndex =
                        (index + 1)
                % tabs.length;
                }

                if (event.key === 'Home')
                {
                    nextIndex = 0;
                }

                if (event.key === 'End')
                {
                    nextIndex = tabs.length - 1;
                }

                activateProfileCardSection(
                    card,
                    tabs[nextIndex]
                        .dataset.profileCardTab,
                    {
                        focusTab: true
                    }
                );
            }
        );
    });
}

function bindPeopleProfileControls(person)
{
    bindRepeatableFacts(main);
    bindToasts(main);

    bindRelationshipList(main, 'profile');
    bindProfilePhotoCarousels(main);
    bindPersonPhotoUnlinkButtons(main);
    bindConnectedNoteLinks(
        main
    );
    bindConnectedFileLinks(
        main,
        {
            onUnlinked:
            ({
                contextType
            }) =>
            {
                if (
                    contextType
                !== 'person'
                )
                {
                    return;
                }

                renderAfterPersonConnectedResourcesChanged();
            }
        }
    );
    bindTimelineSourceControls(
        main,
        {
            afterSave:
            renderAfterPersonConnectedResourcesChanged
        }
    );
    bindConnectedSourceLinks(
        main,
        {
            onUnlinked:
            ({
                targetType
            }) =>
            {
                if (
                    targetType
                  === 'person'
                )
                {
                    renderAfterPersonConnectedResourcesChanged();
                }
            }
        }
    );
    const profileCard = main.querySelector(
        '[data-profile-card-root]'
    );
    bindProfileCardTabs(profileCard);
    profileCard?.addEventListener('click', event =>
    {
        const add = event.target.closest('[data-profile-new-fact]');
        if (add)
        {
            openTimelinePersonEditor({ kind: 'newAttribute', personId: person.id, tag: add.dataset.profileNewFact });
            return;
        }

        const step = event.target.closest('[data-profile-fact-step]');
        if (!step || step.disabled) return;
        const panel = step.closest('[data-profile-card-panel]');
        const tag = step.closest('[data-profile-fact-tag]').dataset.profileFactTag;
        const direction = step.dataset.profileFactStep;
        const hadFocus = document.activeElement === step;
        panel.innerHTML = renderRepeatableFactReadOnly(person, tag, step.dataset.profileFactId);
        localizeUI(panel);
        if (hadFocus)
        {
            const nextFocus = panel.querySelector(`[data-profile-fact-step="${direction}"]:enabled`)
                || panel.querySelector('[data-profile-fact-step]:enabled');
            nextFocus?.focus({ preventScroll: true });
        }
    });
    main.querySelector('#profileEditButton')?.addEventListener('click', () =>
    {
        const currentPerson = getPerson(person.id);
        if (currentPerson && !currentPerson.deleted && currentPerson.projectId === currentProjectId())
            openEditPersonModal(currentPerson.id);
    });
    main
        .querySelector('#profileMoreActions')
        ?.addEventListener(
            'click',
            event =>
            {
                openPeopleActionsMenu(
                    person.id,
                    event.currentTarget,
                    {
                        includeProfile: false
                    }
                );
            }
        );
    profileCard?.querySelector('[data-profile-add-fact]')?.addEventListener('click', () =>
    {
        const tab = normalizeProfileCardSection(state.peopleProfileEditTab);
        const tag = { education: 'EDUC', work: 'OCCU', other: 'FACT' }[tab];
        const target = tag ? { kind: 'newAttribute', tag } : { kind: 'additionalFacts' };
        openTimelinePersonEditor({ ...target, personId: person.id });
    });
    main.querySelector('[data-profile-add-relative]')?.addEventListener('click', event =>
        openRelativePopover(event.currentTarget, person.id));
    main.querySelectorAll('[data-profile-photo]').forEach(button => button.addEventListener('click', () => openProfilePhoto(button.dataset.profilePhoto)));
    main.querySelector('[data-profile-resource-action="add-photos"]') ?.addEventListener('click', () => openAddPhotosToPersonModal(person.id));
    main
        .querySelector(
            '[data-profile-resource-action="add-files"]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                openPersonFilesModal(
                    person.id
                );
            }
        );
    main
        .querySelector(
            '[data-profile-resource-action="add-note"]'
        )
        ?.addEventListener(
            'click',
            () =>
                openPersonNotesModal(
                    person.id,
                    'profile'
                )
        );
    main
        .querySelector(
            '[data-profile-resource-action="add-sources"]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                const centralPerson =
                    getPerson(
                        person.id
                    );

                if (!centralPerson)
                {
                    return;
                }

                openSourcesForTargetModal({
                    targetType:
                'person',

                    targetId:
                centralPerson.id,

                    projectId:
                centralPerson.projectId,

                    title:
                'Add sources',

                    subtitle:
                `Connect existing sources to ${
                    centralPerson.names?.display
                  || 'this person'
                }.`,

                    afterSave:
                renderAfterPersonConnectedResourcesChanged
                });
            }
        );
    main.querySelectorAll('[data-profile-place]').forEach(button => button.addEventListener('click', () => openProfilePlace(button.dataset.profilePlace)));
    const profileViewAllActions = {
        archive:
          () =>
              openProfileAllArchive(
                  person.id
              ),

        notes:
          () =>
              openProfileAllNotes(
                  person.id
              ),

        photos:
          () =>
              openProfileAllPhotos(
                  person.id
              ),

        places:
          () =>
              openProfileAllPlaces(
                  person.id
              )
    };

    main
        .querySelectorAll('[data-profile-view-all]')
        .forEach(button =>
        {
            button.addEventListener('click', () =>
            {
                profileViewAllActions[
                    button.dataset.profileViewAll
                ]?.();
            });
        });
}

function openProfileArchiveFile(fileId)
{
    if (!fileId)
    {
        showToast('Archive item preview is simulated.'); return;
    }
    openFamilyArchiveItem(fileId);
}

function openProfilePhoto(photoId)
{
    openAlbumsForPhoto(photoId);
}

function openProfilePlace(placeId)
{
    if (!placeId)
    {
        showToast('Place record not found.');
        return;
    }

    appNavigationMarkIntent({ type: 'place', id: placeId });

    state.activeModule = 'Places';
    state.placesView = 'all';
    state.selectedPlaceId = placeId;
    render();
}

function openProfileAllArchive(
    personId =
        state.selectedPeopleId
)
{
    openArchiveForPerson(
        personId
    );
}

function openProfileAllNotes(
    personId =
        state.selectedPeopleId
)
{
    openNotesForContext(
        'person',
        personId
    );
}

function openProfileAllPhotos(personId = state.selectedPeopleId)
{
    openAlbumsForPerson(personId);
}

function openProfileAllPlaces(
    personId =
        state.selectedPeopleId
)
{
    const person =
        getPerson(personId);

    state.activeModule = 'Places';
    state.placesView = 'all';

    state.placesSavedFilterId =
        '';

    state.placesFilters = {
        ...defaultPlaceFilters,

        personId:
          person?.id || ''
    };

    state.selectedPlaceId = null;
    state.placesSearch = '';

    render();
}

function openProfileFamilyMember(
    personId
)
{
    if (!personId)
    {
        showToast(
            'Placeholder family member; add a linked person later.'
        );

        return;
    }

    if (!getPerson(personId))
    {
        showToast(
            'This family member is not linked to a People profile yet.'
        );

        return;
    }

    state.selectedPeopleId =
        personId;

    state.selectedPersonId =
        personId;

    state.peopleView =
        'profile';

    state.peopleSide =
        'profile';

    renderPeople();
}

