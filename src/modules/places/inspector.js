const PLACE_INSPECTOR_LIMITS =
    Object.freeze({
        personGroups: 5,
        eventsPerPerson: 3
    });

function placesInspectorSectionState()
{
    const defaults = {
        names: true,
        events: true,
        photos: false,
        files: false,
        notes: false,
        sources: false
    };

    state.placesInspectorSections = {
        ...defaults,
        ...(
            state.placesInspectorSections
          || {}
        )
    };

    return state
        .placesInspectorSections;
}

function placesInspectorSectionIsOpen(
    key
)
{
    return Boolean(
        placesInspectorSectionState()[
            key
        ]
    );
}

function placeInspectorCountLabel(
    count,
    singular,
    plural = `${singular}s`
)
{
    return `${count} ${
        count === 1
            ? singular
            : plural
    }`;
}

function placeInspectorPersonName(
    person
)
{
    return (
        formatPersonFullName(person)
        || person?.name
        || 'Unnamed person'
    );
}

function placeInspectorEventLabel(
    event
)
{
    if (event?.title)
    {
        return translateText(event.title);
    }

    if (event?.eventType)
    {
        return event.eventType;
    }

    if (event?.typeLabel)
    {
        return event.typeLabel;
    }

    if (
        typeof placeEventTypeLabel
          === 'function'
    )
    {
        return placeEventTypeLabel(
            event?.type
        );
    }

    return event?.type
        || 'Event';
}

function placeInspectorEventDateLabel(
    event
)
{
    const label =
        formatGenealogyDateLabel(
            event?.date || event
        )
        || event?.dateLabel
        || event?.date?.dateLabel
        || 'Date unknown';

    /*
      * Use natural day formatting in the compact
      * inspector: "2 Jan" rather than "02 Jan".
      */
    return String(label)
        .replace(
            /^0(?=\d(?:\s|[./-]))/,
            ''
        );
}

function placeInspectorEventSortValue(event)
{
    return genealogyDateSortValue(event);
}

function placeInspectorEventOwnerIds(
    event
)
{
    const personIds = [
        ...new Set(
            (
                Array.isArray(
                    event?.personIds
                )
                    ? event.personIds
                    : []
            ).filter(Boolean)
        )
    ];

    if (personIds.length)
    {
        return personIds;
    }

    /*
      * Fall back to related people only for records
      * that do not define a primary event owner.
      */
    return [
        ...new Set(
            (
                Array.isArray(
                    event?.relatedPersonIds
                )
                    ? event.relatedPersonIds
                    : []
            ).filter(Boolean)
        )
    ];
}

function placeInspectorEventRelatedPeople(
    event,
    personId
)
{
    const relatedIds = [
        ...new Set([
            ...(
                Array.isArray(
                    event?.personIds
                )
                    ? event.personIds
                    : []
            ),

            ...(
                Array.isArray(
                    event?.relatedPersonIds
                )
                    ? event.relatedPersonIds
                    : []
            )
        ])
    ]
        .filter(id =>
            id
          && id !== personId
        );

    return relatedIds
        .map(id =>
            getPerson(id)
        )
        .filter(Boolean);
}

function placeInspectorChildRoleLabel(
    person
)
{
    if (
        person?.gender === 'female'
    )
    {
        return 'Daughter';
    }

    if (
        person?.gender === 'male'
    )
    {
        return 'Son';
    }

    return 'Child';
}

function placeInspectorEventPresentation(
    event,
    personId
)
{
    const date =
        placeInspectorEventDateLabel(
            event
        );

    if (
        event?.type === 'childBirth'
    )
    {
        const child =
            (
                event.relatedPersonIds
            || []
            )
                .map(id =>
                    getPerson(id)
                )
                .find(Boolean);

        const relationship =
            child
                ? `${
                    placeInspectorChildRoleLabel(
                        child
                    )
                } ${
                    placeInspectorPersonName(
                        child
                    )
                }`
                : String(
                    event.description || ''
                ).trim();

        return {
            title:
            event.title
            || 'Birth of child',

            date,

            relationship
        };
    }

    if (
        event?.type === 'marriage'
    )
    {
        const spouses =
            placeInspectorEventRelatedPeople(
                event,
                personId
            );

        return {
            title:
            translateText(event.title || 'Marriage'),

            date,

            relationship:
            spouses.length
                ? `${
                    spouses.length === 1
                        ? 'Spouse'
                        : 'Spouses'
                } ${
                    spouses
                        .map(
                            placeInspectorPersonName
                        )
                        .join(' and ')
                }`
                : ''
        };
    }

    const relatedPeople =
        placeInspectorEventRelatedPeople(
            event,
            personId
        );

    return {
        title:
          placeInspectorEventLabel(
              event
          ),

        date,

        relationship:
          relatedPeople.length
              ? `Related to ${
                  relatedPeople
                      .map(
                          placeInspectorPersonName
                      )
                      .join(', ')
              }`
              : ''
    };
}

function placeInspectorEventGroups(
    events
)
{
    const groups =
        new Map();

    const otherEvents =
        [];

    (
        Array.isArray(events)
            ? events
            : []
    ).forEach(event =>
    {
        const ownerIds =
            placeInspectorEventOwnerIds(
                event
            );

        let addedToPerson =
            false;

        ownerIds.forEach(personId =>
        {
            const person =
                getPerson(personId);

            if (!person)
            {
                return;
            }

            let group =
                groups.get(person.id);

            if (!group)
            {
                group = {
                    person,
                    events: []
                };

                groups.set(
                    person.id,
                    group
                );
            }

            group.events.push(
                event
            );

            addedToPerson =
                true;
        });

        if (!addedToPerson)
        {
            otherEvents.push(
                event
            );
        }
    });

    const sortedGroups =
        [...groups.values()]
            .map(group => ({
                ...group,

                events:
              group.events
                  .slice()
                  .sort(
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
                  )
            }))
            .sort(
                (
                    first,
                    second
                ) =>
                {
                    const firstDate =
                        first.events.length
                            ? placeInspectorEventSortValue(
                                first.events[0]
                            )
                            : Number.MAX_SAFE_INTEGER;

                    const secondDate =
                        second.events.length
                            ? placeInspectorEventSortValue(
                                second.events[0]
                            )
                            : Number.MAX_SAFE_INTEGER;

                    return (
                        firstDate
                - secondDate
                || placeInspectorPersonName(
                    first.person
                ).localeCompare(
                    placeInspectorPersonName(
                        second.person
                    )
                )
                    );
                }
            );

    otherEvents.sort(
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
    );

    return {
        groups:
          sortedGroups,

        otherEvents
    };
}

function renderPlaceInspectorEventRows(
    events,
    personId = '',
    showAll = false
)
{
    const source =
        Array.isArray(events)
            ? events
            : [];

    if (!source.length)
    {
        return `
          <span
            class="
              places-inspector-person-empty
            ">
            No dated events recorded.
          </span>
        `;
    }

    const visibleEvents =
        showAll
            ? source
            : source.slice(
                0,
                PLACE_INSPECTOR_LIMITS
                    .eventsPerPerson
            );

    return `
        <span
          class="
            places-inspector-event-list
          ">

          ${visibleEvents
                .map(event =>
                {
                    const presentation =
                        placeInspectorEventPresentation(
                            event,
                            personId
                        );

                    return `
                <span
                  class="
                    places-inspector-event-row
                  ">

                  <strong
                    class="
                      places-inspector-event-title
                    ">
                    ${escapeHtml(
                        presentation.title
                    )}
                  </strong>

                  <span
                    class="
                      places-inspector-event-meta
                    ">

                    <span
                      class="
                        places-inspector-event-date
                      ">
                      ${escapeHtml(
                            presentation.date
                        )}
                    </span>

                    ${
                        presentation.relationship
                            ? `
                          <span
                            class="
                              places-inspector-event-separator
                            "
                            aria-hidden="true">
                            ·
                          </span>

                          <span
                            class="
                              places-inspector-event-relationship
                            ">
                            ${escapeHtml(
                                presentation.relationship
                            )}
                          </span>
                        `
                            : ''
                    }
                  </span>
                </span>
              `;
                })
                .join('')}

          ${
                !showAll
            && source.length
              > visibleEvents.length
                    ? `
                <span
                  class="
                    places-inspector-more-count
                  ">
                  +${
                        source.length
                    - visibleEvents.length
                    } more events
                </span>
              `
                    : ''
            }
        </span>
      `;
}

function renderPlaceInspectorEvents(
    events
)
{
    if (!events.length)
    {
        return `
          <div
            class="
              places-inspector-section-empty
            ">
            No connected events.
          </div>
        `;
    }

    const {
        groups,
        otherEvents
    } =
        placeInspectorEventGroups(
            events
        );

    const showAll =
        Boolean(
            state
                .placesInspectorShowAllEvents
        );

    const visibleGroups =
        showAll
            ? groups
            : groups.slice(
                0,
                PLACE_INSPECTOR_LIMITS
                    .personGroups
            );

    const visibleOtherEvents =
        showAll
            ? otherEvents
            : otherEvents.slice(
                0,
                PLACE_INSPECTOR_LIMITS
                    .eventsPerPerson
            );

    const canToggle =
        groups.length
          > PLACE_INSPECTOR_LIMITS
              .personGroups
        || groups.some(group =>
            group.events.length
            > PLACE_INSPECTOR_LIMITS
                .eventsPerPerson
        )
        || otherEvents.length
          > PLACE_INSPECTOR_LIMITS
              .eventsPerPerson;

    const toggleMarkup =
        canToggle
            ? `
            <button
              class="
                panel-section-view-all
                places-inspector-events-toggle
              "
              type="button"
              data-place-events-toggle>
              <span>${showAll ? 'Show less' : 'View all events'}</span>
              <span class="panel-section-view-all-icon" aria-hidden="true">${icon.chevron}</span>
            </button>
          `
            : '';

    return `
        <div
          class="
            places-inspector-person-groups
          ">

          ${
                showAll
                    ? toggleMarkup
                    : ''
            }

          ${visibleGroups
                .map(group =>
                {
                    const eventCountLabel =
                        placeInspectorCountLabel(
                            group.events.length,
                            'connected event'
                        );

                    return `
                <button
                  class="
                    places-inspector-person-card
                  "
                  type="button"
                  data-place-connected-person="${
                        escapeHtml(
                            group.person.id
                        )
                    }"
                  aria-label="Open ${
                        escapeHtml(
                            placeInspectorPersonName(
                                group.person
                            )
                        )
                    } profile">

                  ${renderPersonAvatar(
                        group.person,
                        'places-inspector-person-avatar',
                        {
                            element:
                        'span'
                        }
                    )}

                  <span
                    class="
                      places-inspector-person-card-body
                    ">

                    <span
                      class="
                        places-inspector-person-card-header
                      ">

                      <span
                        class="
                          places-inspector-person-identity
                        ">

                        <strong>
                          ${escapeHtml(
                                placeInspectorPersonName(
                                    group.person
                                )
                            )}
                        </strong>

                        <span>
                          ${escapeHtml(
                                eventCountLabel
                            )}
                        </span>
                      </span>

                      <span
                        class="
                          places-inspector-person-chevron
                        "
                        aria-hidden="true">
                        ${icon.chevron}
                      </span>
                    </span>

                    ${renderPlaceInspectorEventRows(
                        group.events,
                        group.person.id,
                        showAll
                    )}
                  </span>
                </button>
              `;
                })
                .join('')}

          ${
                visibleOtherEvents.length
                    ? `
                <div
                  class="
                    places-inspector-other-events
                  ">

                  <strong>
                    Other events
                  </strong>

                  ${renderPlaceInspectorEventRows(
                        visibleOtherEvents,
                        '',
                        true
                    )}
                </div>
              `
                    : ''
            }

          ${toggleMarkup}
        </div>
      `;
}

function renderPlaceInspectorPhotos(
    photos
)
{
    if (!photos.length)
    {
        return `
          <div
            class="
              places-inspector-section-empty
            ">
            No connected photos.
          </div>
        `;
    }

    const visible =
        photos.slice(
            0,
            RIGHT_SIDEBAR_LIMITS.photos
        );

    return `
        <div class="connected-photo-grid">
          ${visible
                .map(photo =>
                {
                    const label =
                        photo.title
                || photo.filename
                || 'Photo';

                    return `
                <button
                  class="connected-photo-button"
                  type="button"
                  data-place-connected-photo="${
                        escapeHtml(photo.id)
                    }"
                  title="${
                        escapeHtml(label)
                    }"
                  aria-label="Open ${
                        escapeHtml(label)
                    }">

                  ${renderPhotoThumbnail(
                        photo,
                        { label }
                    )}
                </button>
              `;
                })
                .join('')}
        </div>

        <button
          class="panel-section-view-all"
          type="button"
          data-place-view-all-photos>
          <span>View all photos</span>
          <span
            class="panel-section-view-all-icon"
            aria-hidden="true">
            ${icon.chevron}
          </span>
        </button>
      `;
}

function renderPlaceInspectorFiles(
    files,
    placeId =
        ''
)
{
    if (!files.length)
    {
        return `
          <div
            class="
              places-inspector-section-empty
            ">

            No connected files.
          </div>
        `;
    }

    const visible =
        files.slice(
            0,
            RIGHT_SIDEBAR_LIMITS
                .files
        );

    return `
        ${renderConnectedFileList({
            files:
            visible,

            contextType:
            'place',

            contextId:
            placeId,

            emptyText:
            'No connected files.'
        })}

        <button
          class="
            panel-section-view-all
          "
          type="button"
          data-place-view-all-files>

          <span>
            View all files
          </span>

          <span
            class="
              panel-section-view-all-icon
            "
            aria-hidden="true">

            ${icon.chevron}
          </span>
        </button>
      `;
}

function renderPlaceInspectorNotes(
    notes
)
{
    if (!notes.length)
    {
        return `
          <div
            class="
              places-inspector-section-empty
            ">
            No connected notes.
          </div>
        `;
    }

    const placeId =
        state.selectedPlaceId
        || '';

    const list =
        renderConnectedNoteList({
            notes,

            contextType:
            'place',

            contextId:
            placeId,

            limit:
            RIGHT_SIDEBAR_LIMITS
                .notes,

            emptyText:
            'No connected notes.'
        });

    return `
        ${list}

        <button
          class="
            panel-section-view-all
          "
          type="button"
          data-place-view-all-notes>

          <span>View all notes</span>

          <span
            class="
              panel-section-view-all-icon
            "
            aria-hidden="true">

            ${icon.chevron}
          </span>
        </button>
      `;
}

function renderPlaceInspectorSection({
    key,
    title,
    countLabel = '',
    content,
    actionHtml = ''
})
{
    const open =
        placesInspectorSectionIsOpen(
            key
        );

    return `
        <details
          class="
            places-inspector-section
            ${
                actionHtml
                    ? 'has-action'
                    : ''
            }
          "
          id="placeInspectorSection-${escapeHtml(
                key
            )}"
          data-place-inspector-section="${escapeHtml(
                key
            )}"
          ${open ? 'open' : ''}>

          <summary>
            <span>
              ${escapeHtml(title)}
            </span>

            <span
              class="
                places-inspector-section-summary-meta
              ">

              ${
                    countLabel
                        ? `
                    <span
                      class="
                        places-inspector-section-count
                      ">
                      ${escapeHtml(
                            countLabel
                        )}
                    </span>
                  `
                        : ''
                }

              <span
                class="
                  places-inspector-section-chevron
                "
                aria-hidden="true">
                ${icon.chevron}
              </span>
            </span>
          </summary>

          ${
                actionHtml
                    ? `
                <div
                  class="
                    places-inspector-section-action
                  ">
                  ${actionHtml}
                </div>
              `
                    : ''
            }

          <div
            class="
              places-inspector-section-body
            ">
            ${content}
          </div>
        </details>
      `;
}

function rerenderPlacesInspector({
    preserveScroll = true
} = {})
{
    const inspector =
        main.querySelector(
            '[data-places-inspector]'
        );

    if (!inspector)
    {
        return;
    }

    const previousScrollTop =
        inspector.scrollTop;

    const pair = state.placesView === 'review' && state.selectedPlaceReviewPairKey
        ? getPlaceDuplicatePairs().find(item => item.key === state.selectedPlaceReviewPairKey) : null;
    inspector.innerHTML = pair ? renderPlacesDuplicateInspector(pair)
        : renderPlacesInspector(getPlace(state.selectedPlaceId));

    bindPlacesInspectorControls(
        inspector
    );

    if (preserveScroll)
    {
        requestAnimationFrame(() =>
        {
            inspector.scrollTop =
                previousScrollTop;
        });
    }
}

function renderPlacesDuplicateInspector(pair)
{
    const collapsed = state.placesInspectorCollapsed;
    const toggle = `<button class="people-collapse-button ${collapsed
        ? 'person-sidebar-restore-button albums-detail-restore sidebar-toggle-icon sidebar-toggle-icon-restore'
        : 'people-sidebar-toggle-icon albums-detail-collapse'}" type="button"
        data-places-inspector-toggle aria-label="${escapeHtml(t(collapsed ? 'Expand place inspector' : 'Collapse place inspector'))}"
        aria-expanded="${!collapsed}">${icon.doublechevronSidebar}</button>`;
    if (collapsed) return toggle;
    const dismissed = Boolean(placeDuplicateDismissal(pair));
    const member = place => {
        const coordinates = normalizePlaceCoordinates(place);
        const position = coordinates ? `${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`
            : t('No coordinates');
        const radiusLabel = formatPlaceRadius(place.approximateRadiusMeters);
        const radius = radiusLabel ? ` · ${radiusLabel}` : '';
        const alternative = placeAlternativeNames(place)[0];
        return `<section class="places-pair-inspector-member" aria-label="${escapeHtml(place.name)}">
            <h3 data-i18n-skip>${escapeHtml(place.name)}</h3>
            ${alternative ? `<p data-i18n-skip>${escapeHtml(alternative)}</p>` : ''}
            <p>${escapeHtml(position + radius)}</p>
            <p>${escapeHtml(t('Linked records'))}: ${placeReviewConnectionTotal(place)}</p>
            <button class="button secondary" type="button" data-place-pair-view-place="${escapeHtml(place.id)}"
                aria-label="${escapeHtml(t('View Place'))}: ${escapeHtml(place.name)}">${escapeHtml(t('View Place'))}</button>
        </section>`;
    };
    return `<div class="albums-detail-toolbar places-inspector-toolbar">${toggle}</div>
        <div class="places-pair-inspector">
            <header><h2>${escapeHtml(t('Possible duplicate'))}</h2>
                <span>${escapeHtml(dismissed ? placeReviewT('Dismissed') : t('Needs review'))}</span></header>
            <p>${escapeHtml(pair.reasons.map(reason => t(reason)).join(' '))}</p>
            ${member(pair.left)}${member(pair.right)}
        </div>`;
}

function renderPlaceAttention({
    place,
    title,
    description,
    ariaLabel = title,
    issueCount = 0,
    showOpenReview = true,
    actions = ''
})
{
    return `<div class="places-attention" role="group" aria-label="${escapeHtml(ariaLabel)}">
        <div class="places-attention-header">
            <div class="places-attention-copy">
                ${icon.warning}
                <span><strong>${escapeHtml(title)}</strong>${issueCount > 1 ? `<small>${issueCount} issues</small>` : ''}</span>
            </div>
            ${showOpenReview ? `<button class="places-attention-open" type="button"
                data-place-review-view="${escapeHtml(place.id)}"
                aria-label="${escapeHtml(t('Open review'))}: ${escapeHtml(placePrimaryName(place))}">
                ${icon.openlink}<span>${escapeHtml(t('Open review'))}</span>
            </button>` : ''}
        </div>
        <p class="places-attention-description">${escapeHtml(description)}</p>
        ${actions ? `<div class="places-attention-actions">${actions}</div>` : ''}
    </div>`;
}

function renderPlacesInspector(
    place, owners
)
{
    if (
        state.placesInspectorCollapsed
    )
    {
        return `
          <button
            class="
              people-collapse-button
              person-sidebar-restore-button
              albums-detail-restore
              sidebar-toggle-icon
              sidebar-toggle-icon-restore
            "
            type="button"
            data-places-inspector-toggle
            aria-label="Expand place inspector"
            aria-expanded="false"
            title="Expand place inspector">
            ${icon.doublechevronSidebar}
          </button>
        `;
    }

    const collapseButton = `
        <button
          class="
            people-collapse-button
            people-sidebar-toggle-icon
            albums-detail-collapse
          "
          type="button"
          data-places-inspector-toggle
          aria-label="Collapse place inspector"
          aria-expanded="true"
          title="Collapse place inspector">
          ${icon.doublechevronSidebar}
        </button>
      `;

    const toolbar = `
        <div
          class="
            albums-detail-toolbar
            places-inspector-toolbar
          ">

          ${collapseButton}

          <span
            class="
              albums-detail-toolbar-spacer
            ">
          </span>

          ${
                place
                    ? `
                <button
                  class="
                    albums-detail-action
                  "
                  type="button"
                  data-places-inspector-edit="${
                        escapeHtml(place.id)
                    }"
                  aria-label="Edit place"
                  title="Edit place">
                  ${icon.edit}
                </button>

                <button
                  class="
                    albums-detail-action
                  "
                  type="button"
                  data-place-menu="${
                        escapeHtml(place.id)
                    }"
                  aria-label="More actions for ${
                        escapeHtml(
                            placePrimaryName(place)
                        )
                    }"
                  aria-haspopup="menu"
                  title="More actions">
                  ${icon.more}
                </button>
              `
                    : ''
            }
        </div>
      `;

    if (!place)
    {
        return `
          ${toolbar}

          <div
            class="
              places-inspector-empty
            ">

            <strong>
              No place selected
            </strong>

            <span>
              Select a place to view
              its information.
            </span>
          </div>
        `;
    }

    const associations = placeAssociationIndex(place.projectId);
    const people = associations.peopleByPlaceId.get(place.id) || [];
    const events = associations.eventsByPlaceId.get(place.id) || [];

    const photos =
        getPhotosForPlace(
            place.id
        );

    const files =
        getArchiveFilesForPlace(
            place.id
        );

    const notes =
        getNotesForPlace(
            place.id
        );

    const sources =
        sourcesForTarget(
            'place',
            place.id,
            place.projectId
        );

    const alternatives =
        placeAlternativeNames(
            place
        );

    const reviewIssues =
        getActivePlaceReviewIssues(place, owners);

    const duplicatePairs = getPlaceDuplicatePairs(place.projectId).filter(pair =>
        (pair.left.id === place.id || pair.right.id === place.id) && !placeDuplicateDismissal(pair));

    const firstReviewIssue =
        reviewIssues[0] || null;

    const bannerOwnsCoordinateAction =
        Boolean(
            firstReviewIssue
          && PLACE_REVIEW_COORDINATE_ISSUE_TYPES.includes(
              firstReviewIssue.type
          )
        );

    const hasCoordinates =
        placeHasCoordinates(
            place
        );
    const approximate = placeHasApproximateArea(place);

    const tags = [
        {
            key: 'people',
            target: 'events',
            label:
            placeInspectorCountLabel(
                people.length,
                'person',
                'people'
            )
        },
        {
            key: 'events',
            target: 'events',
            label:
            placeInspectorCountLabel(
                events.length,
                'event'
            )
        },
        {
            key: 'photos',
            target: 'photos',
            label:
            placeInspectorCountLabel(
                photos.length,
                'photo'
            )
        },
        {
            key: 'files',
            target: 'files',
            label:
            placeInspectorCountLabel(
                files.length,
                'file'
            )
        },
        {
            key: 'notes',
            target: 'notes',
            label:
            placeInspectorCountLabel(
                notes.length,
                'note'
            )
        },
        {
            key:
            'sources',

            target:
            'sources',

            label:
            placeInspectorCountLabel(
                sources.length,
                'source'
            )
        }
    ];

    const namesContent =
        alternatives.length
            ? `
            <div
              class="
                places-inspector-name-list
              ">
              ${alternatives
                    .map(name => `
                  <span>
                    ${escapeHtml(name)}
                  </span>
                `)
                    .join('')}
            </div>
          `
            : `
            <div
              class="
                places-inspector-section-empty
              ">
              No historical or
              alternative names recorded.
            </div>
          `;

    return `
        ${toolbar}

        <div
          class="
            places-inspector-content
          ">

          <section
            class="
              places-inspector-summary
            ">

            <h2>
              ${escapeHtml(
                    placePrimaryName(place)
                )}
            </h2>

            <p>
              ${escapeHtml(
                    placeSecondaryName(place)
                || 'No broader place recorded'
                )}
            </p>

            <div class="places-inspector-mobile-meta">
              <span>${escapeHtml(t('Country'))}: ${escapeHtml(placeCountry(place) || 'Unknown')}</span>
              <span>${escapeHtml(t('Updated'))}: ${escapeHtml(formatPlaceUpdatedAt(place.updatedAt))}</span>
            </div>

            <div
              class="
                places-inspector-tags
                app-chip-row
              "
              aria-label="Connected records">

              ${tags
                    .map(tag => `
                  <button
                    class="
                      app-chip
                      app-chip--${escapeHtml(
                            tag.key
                        )}
                    "
                    type="button"
                    data-place-inspector-jump="${
                        escapeHtml(
                            tag.target
                        )
                    }"
                    aria-controls="placeInspectorSection-${
                        escapeHtml(
                            tag.target
                        )
                    }">
                    ${escapeHtml(
                        tag.label
                    )}
                  </button>
                `)
                    .join('')}
            </div>

            ${firstReviewIssue ? renderPlaceAttention({
                place,
                title: firstReviewIssue.title,
                description: firstReviewIssue.description,
                ariaLabel: `Needs review: ${firstReviewIssue.title}`,
                issueCount: reviewIssues.length,
                showOpenReview: state.placesView !== 'review',
                actions: `
                    <button class="${firstReviewIssue.type === 'unlinked' ? 'button danger' : 'places-attention-fix'}" type="button"
                        data-place-review-fix="${escapeHtml(place.id)}"
                        data-place-review-type="${escapeHtml(firstReviewIssue.type)}">
                        ${firstReviewIssue.type === 'unlinked' ? icon.trash : icon.mapPin}
                        <span>${escapeHtml(t(firstReviewIssue.actionLabel))}</span>
                    </button>
                    <button class="places-attention-dismiss" type="button"
                        data-place-review-dismiss="${escapeHtml(place.id)}"
                        data-place-review-type="${escapeHtml(firstReviewIssue.type)}">
                        ${icon.close}
                        <span>${escapeHtml(firstReviewIssue.type === 'unlinked' ? t('Keep') : placeReviewT('Dismiss'))}</span>
                    </button>`
            }) : ''}
            ${duplicatePairs.length ? renderPlaceAttention({
                place,
                title: t('Possible duplicates'),
                description: duplicatePairs.map(pair =>
                    pair.left.id === place.id ? pair.right.name : pair.left.name).join(', ')
            }) : ''}
          </section>

          <div
            class="
              places-inspector-coordinate-row
            ">

            <span
              class="
                places-inspector-coordinate-label
              ">
              ${escapeHtml(t(approximate ? 'Representative center' : 'Coordinates'))}
            </span>

            <strong>
              ${escapeHtml(
                    hasCoordinates
                        ? formatPlaceCoordinates(
                            place
                        )
                        : t('Not on map')
                )}
            </strong>

            ${bannerOwnsCoordinateAction ? '' : `
              <button
                class="
                  places-inspector-coordinate-action
                "
                type="button"
                data-places-edit-position="${
                    escapeHtml(place.id)
                }"
                aria-label="${
                    hasCoordinates
                        ? 'Edit position'
                        : 'Add position'
                }"
                title="${
                    hasCoordinates
                        ? 'Edit position'
                        : 'Add position'
                }">

                ${icon.edit}

                <span>
                  ${
                        hasCoordinates
                            ? 'Edit'
                            : 'Add'
                    }
                </span>
              </button>
            `}
          </div>

          ${approximate ? `<div class="places-inspector-approximate" role="note">
            ${icon.info}
            <span><strong>${escapeHtml(t('Approximate location'))}</strong>
              · ${escapeHtml(t('Radius'))}: ${escapeHtml(formatPlaceRadius(place.approximateRadiusMeters))}.
              ${escapeHtml(t('The circle marks a possible location, not a boundary.'))}</span>
          </div>` : ''}

          ${renderPlaceInspectorSection({
                key:
              'names',

                title:
              'Historical / alternative names',

                countLabel:
              placeInspectorCountLabel(
                  alternatives.length,
                  'name'
              ),

                content:
              namesContent
            })}

          ${renderPlaceInspectorSection({
                key:
              'events',
                title:
              'Connected events',
                countLabel:
              placeInspectorCountLabel(
                  events.length,
                  'event'
              ),
                content:
              renderPlaceInspectorEvents(
                  events
              )
            })}

          ${renderPlaceInspectorSection({
                key:
              'photos',

                title:
              'Connected photos',

                countLabel:
              placeInspectorCountLabel(
                  photos.length,
                  'photo'
              ),

                content:
              renderPlaceInspectorPhotos(
                  photos
              )
            })}

          ${renderPlaceInspectorSection({
                key:
              'files',

                title:
              'Connected files',

                countLabel:
              placeInspectorCountLabel(
                  files.length,
                  'file'
              ),

                content:
              renderPlaceInspectorFiles(
                  files,
                  place.id
              )
            })}

          ${renderPlaceInspectorSection({
                key:
              'notes',

                title:
              'Connected notes',

                countLabel:
              placeInspectorCountLabel(
                  notes.length,
                  'note'
              ),

                content:
              renderPlaceInspectorNotes(
                  notes
              )
            })}
          ${renderPlaceInspectorSection({
                key:
              'sources',

                title:
              'Connected sources',

                countLabel:
              placeInspectorCountLabel(
                  sources.length,
                  'source'
              ),

                content:
              renderConnectedSourceList({
                  targetType:
                  'place',

                  targetId:
                  place.id,

                  projectId:
                  place.projectId,

                  sources,

                  limit: RIGHT_SIDEBAR_LIMITS.sources,

                  emptyText:
                  'No sources linked to this place.'
              })
            })}
        </div>
      `;
}

function bindPlacesInspectorControls(
    root
)
{
    root.querySelectorAll('[data-place-pair-view-place]').forEach(button => button.addEventListener('click', () =>
    {
        const place = getPlace(button.dataset.placePairViewPlace);
        if (!place || place.projectId !== currentProjectId()) return;
        const scrollTop = main.querySelector('.places-review-list-panel')?.scrollTop || 0;
        state.selectedPlaceReviewPairKey = '';
        state.selectedPlaceId = place.id;
        renderPlaces();
        const panel = main.querySelector('.places-review-list-panel');
        if (panel) panel.scrollTop = scrollTop;
    }));
    bindConnectedNoteLinks(
        root
    );
    bindConnectedFileLinks(
        root,
        {
            onUnlinked:
            ({
                contextType
            }) =>
            {
                if (
                    contextType
                !== 'place'
                )
                {
                    return;
                }

                rerenderPlacesInspector({
                    preserveScroll:
                  true
                });
            }
        }
    );
    bindConnectedSourceLinks(
        root,
        {
            onUnlinked:
            ({
                targetType
            }) =>
            {
                if (
                    targetType !== 'place'
                )
                {
                    return;
                }

                placesInspectorSectionState()
                    .sources = true;

                rerenderPlacesInspector({
                    preserveScroll:
                  true
                });
            }
        }
    );
    root
        .querySelector(
            '[data-places-inspector-toggle]'
        )
        ?.addEventListener(
            'click',
            togglePlacesInspector
        );

    root
        .querySelector(
            '[data-places-inspector-edit]'
        )
        ?.addEventListener(
            'click',
            event =>
            {
                openPlaceModal(
                    event.currentTarget
                        .dataset
                        .placesInspectorEdit
                );
            }
        );

    root
        .querySelector(
            '[data-place-menu]'
        )
        ?.addEventListener(
            'click',
            event =>
            {
                event.stopPropagation();

                openPlaceActionsMenu(
                    event.currentTarget
                        .dataset
                        .placeMenu,

                    event.currentTarget
                );
            }
        );

    root
        .querySelector(
            '[data-places-edit-position]'
        )
        ?.addEventListener(
            'click',
            event =>
            {
                const placeId = event.currentTarget.dataset.placesEditPosition;
                if (innerWidth <= 900)
                {
                    if (mobileSurface === 'details') closeMobileSurface(false);
                    showPlaceOnMap(placeId, { editPosition: true });
                }
                else
                {
                    enterPlacesMapMoveMode(placeId);
                }
            }
        );

    root.querySelector('[data-place-review-fix]')?.addEventListener('click', event =>
    {
        const button = event.currentTarget;
        if (button.dataset.placeReviewType === 'unlinked') openDeletePlaceModal(button.dataset.placeReviewFix, { unlinkedOnly: true });
        else openPlaceModalForCoordinateReview(button.dataset.placeReviewFix);
    });

    root.querySelectorAll('[data-place-review-view]').forEach(button => button.addEventListener('click', event =>
    {
        openPlacesNeedsReview(event.currentTarget.dataset.placeReviewView);
    }));

    root.querySelector('[data-place-review-dismiss]')?.addEventListener('click', event =>
    {
        const button = event.currentTarget;
        if (!dismissPlaceReviewIssue(button.dataset.placeReviewDismiss, button.dataset.placeReviewType)) return;
        if (state.placesView === 'review')
        {
            rerenderPlacesReviewAfterAction('', button.dataset.placeReviewType);
        }
        else renderPlaces();
        showToast(t('Review item dismissed.'));
    });

    root
        .querySelectorAll(
            '[data-place-inspector-section]'
        )
        .forEach(details =>
        {
            details.addEventListener(
                'toggle',
                () =>
                {
                    const key =
                        details.dataset
                            .placeInspectorSection;

                    if (!key)
                    {
                        return;
                    }

                    placesInspectorSectionState()[
                        key
                    ] = details.open;
                }
            );
        });

    root
        .querySelectorAll(
            '[data-place-inspector-jump]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    const key =
                        button.dataset
                            .placeInspectorJump;

                    if (!key)
                    {
                        return;
                    }

                    placesInspectorSectionState()[
                        key
                    ] = true;

                    rerenderPlacesInspector();

                    requestAnimationFrame(() =>
                    {
                        main
                            .querySelector(
                                `#placeInspectorSection-${key}`
                            )
                            ?.scrollIntoView({
                                behavior:
                      'smooth',

                                block:
                      'start'
                            });
                    });
                }
            );
        });

    root
        .querySelectorAll(
            '[data-place-connected-person]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    openPlaceInspectorPerson(
                        button.dataset
                            .placeConnectedPerson
                    );
                }
            );
        });

    root
        .querySelectorAll(
            '[data-place-connected-photo]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    openAlbumsForPhoto(
                        button.dataset
                            .placeConnectedPhoto
                    );
                }
            );
        });
    root
        .querySelector(
            '[data-place-view-all-photos]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                openAlbumsForPlace(
                    state.selectedPlaceId
                );
            }
        );

    root
        .querySelector(
            '[data-place-view-all-files]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                openArchiveForPlace(
                    state.selectedPlaceId
                );
            }
        );

    root
        .querySelector(
            '[data-place-view-all-notes]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                openNotesForPlace(
                    state.selectedPlaceId
                );
            }
        );

    root
        .querySelector(
            '[data-place-events-toggle]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                state
                    .placesInspectorShowAllEvents =
                        !state
                            .placesInspectorShowAllEvents;

                rerenderPlacesInspector();
            }
        );
}

function togglePlacesInspector()
{
    state.placesInspectorCollapsed =
        !state.placesInspectorCollapsed;

    const shell =
        main.querySelector(
            '.places-shell'
        );

    const inspector =
        main.querySelector(
            '[data-places-inspector]'
        );

    shell
        ?.classList
        .toggle(
            'inspector-collapsed',
            state.placesInspectorCollapsed
        );

    inspector
        ?.classList
        .toggle(
            'collapsed',
            state.placesInspectorCollapsed
        );

    rerenderPlacesInspector({
        preserveScroll:
          false
    });

    requestAnimationFrame(() =>
    {
        requestAnimationFrame(() =>
        {
            placesMapRuntime
                .map
                ?.invalidateSize({
                    pan: false
                });
        });
    });
}

