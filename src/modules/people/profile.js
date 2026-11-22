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
            events: group.events,

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

const profileConnectedCategories = [
    ['photos', 'Photos', 'image', 'Add photos', 'add-photos'],
    ['archive', 'Archive', 'archive', 'Add files', 'add-files'],
    ['notes', 'Notes', 'note', 'Add note', 'add-note'],
    ['places', 'Places', 'mapPin'],
    ['sources', 'Sources', 'archive', 'Add sources', 'add-sources']
];
const profileConnectedPageSize = 8;
let profileConnectedView;
let profileConnectedResizeObserver;

function profileConnectedRecords(person)
{
    const albums = getProjectAlbums(person.projectId);
    const places = getProfileConnectedPlaces(person.id).map(item => ({ ...item, record: getPlace(item.id) }));
    const knownPlaces = new Set(places.map(item => item.id));
    const placeFields = [person.birth, person.death, ...(person.attributes || []), ...(person.events || [])];
    for (const place of sampleData.places || [])
    {
        if (place.projectId !== person.projectId || knownPlaces.has(place.id)) continue;
        if (!placeFields.some(field => recordHasPlaceReference(field, place.id))) continue;
        places.push({ id: place.id, record: place, title: placeDisplayText(place) || t('Unnamed place'), meta: placeCountry(place), events: [] });
    }
    return {
        photos: getPhotosForPerson(person.id).map(photo => ({
            id: photo.id, record: photo, title: photo.title || photo.filename || t('Photo'),
            date: formatPhotoDate(photo),
            albumNames: albums.filter(album => (photo.albumIds || []).includes(album.id)).map(album => album.name)
        })),
        archive: getArchiveFilesForPerson(person.id).map(file => ({
            id: file.id, record: file, title: file.name, meta: connectedFileMeta(file)
        })),
        notes: getNotesForPerson(person.id).map(note => ({
            id: note.id, record: note, title: note.title, meta: formatProjectDate(note.updatedAt || note.createdAt, '')
        })),
        places,
        sources: sourcesForTarget('person', person.id, person.projectId).map(source => ({
            id: source.id, record: source, title: source.title, meta: connectedSourceDetailMeta(source)
        }))
    };
}

function profileConnectedSelection(person, records)
{
    if (profileConnectedView?.personId !== person.id || profileConnectedView.projectId !== person.projectId)
    {
        profileConnectedView = { personId: person.id, projectId: person.projectId, expanded: new Set(), limits: {}, kind: '', id: '', index: 0 };
    }
    const view = profileConnectedView;
    const kind = records[view.kind]?.length ? view.kind : profileConnectedCategories.find(([key]) => records[key].length)?.[0];
    if (!kind)
    {
        view.kind = '';
        view.id = '';
        return view;
    }
    const categoryChanged = kind !== view.kind;
    const index = records[kind].findIndex(item => item.id === view.id);
    view.index = index >= 0 ? index : Math.min(categoryChanged ? 0 : view.index, records[kind].length - 1);
    view.kind = kind;
    view.id = records[kind][view.index].id;
    if (categoryChanged) view.expanded.add(kind);
    view.limits[kind] = Math.max(view.limits[kind] || profileConnectedPageSize, view.index + 1);
    return view;
}

function renderProfileConnectedCube(person)
{
    person = getPerson(person.id);
    if (!person) return '';
    return `<section class="profile-connected-cube profile-connected-card" data-profile-connected-explorer>
        <h3 class="profile-connected-head"><span class="profile-connected-title"><span class="profile-connected-icon">${icon.link}</span>${escapeHtml(t('Connected records'))}</span></h3>
        <div data-profile-connected-content>${renderProfileConnectedContent(person)}</div>
    </section>`;
}

function renderProfileConnectedContent(person)
{
    const records = profileConnectedRecords(person);
    const view = profileConnectedSelection(person, records);
    if (!view.kind)
    {
        return `<div class="profile-connected-empty">
            <p>${escapeHtml(t('No connected records'))}</p>
            <div>${profileConnectedCategories.slice(0, 3).map(([, , , label, action]) =>
                `<button class="button secondary" type="button" data-profile-resource-action="${action}">${icon.plus}${escapeHtml(t(label))}</button>`).join('')}</div>
        </div>`;
    }
    const selected = records[view.kind][view.index];
    return `<div class="profile-connected-layout">
        <div class="profile-connected-browser">${profileConnectedCategories.filter(([key]) => records[key].length).map(([key, label, glyph, addLabel, action]) =>
        {
            const expanded = view.expanded.has(key);
            const limit = view.limits[key] || profileConnectedPageSize;
            return `<section class="profile-connected-category">
                <div class="profile-connected-category-head">
                    <button type="button" class="panel-action" data-profile-category="${key}" aria-expanded="${expanded}" aria-controls="profile-connected-${key}">
                        ${icon.chevron}${escapeHtml(t(label))}<span>${records[key].length}</span>
                    </button>
                    ${expanded && action ? `<button type="button" class="panel-action" data-profile-resource-action="${action}" aria-label="${escapeHtml(t(addLabel))}">${renderPanelButtonLabel(icon.plus, 'Add')}</button>` : ''}
                </div>
                <div id="profile-connected-${key}" ${expanded ? '' : 'hidden'}>
                <div class="profile-connected-records${key === 'photos' ? ' is-photo-grid' : ''}">
                ${expanded ? records[key].slice(0, limit).map(item =>
                    `<button type="button" class="profile-connected-record" data-profile-record-kind="${key}" data-profile-record-id="${escapeHtml(item.id)}"
                        aria-pressed="${view.kind === key && view.id === item.id}" title="${escapeHtml(item.title)}">
                        <span class="profile-connected-record-icon">${key === 'photos' ? renderPhotoThumbnail(item.record) : renderProfileConnectedIcon(key, item.record, glyph)}</span>
                        <span class="profile-connected-record-copy"><strong>${escapeHtml(item.title)}</strong>${key !== 'photos' && item.meta ? `<small>${escapeHtml(item.meta)}</small>` : ''}</span>
                    </button>`).join('') : ''}
                </div>
                ${expanded && limit < records[key].length ? `<button class="panel-action" type="button" data-profile-more-records="${key}">${escapeHtml(t('Show more'))}</button>` : ''}
                </div>
            </section>`;
        }).join('')}</div>
        <section class="profile-connected-preview" aria-label="${escapeHtml(t('Preview'))}">
            <div class="profile-connected-preview-head">
                ${['photos', 'archive'].includes(view.kind) ? '' : `<h4>${escapeHtml(selected.title)}</h4>`}
                <div class="profile-connected-preview-actions">
                    ${view.kind === 'places'
                        ? `<button type="button" class="panel-action" data-profile-view-place>${renderPanelButtonLabel(icon.mapPin, 'Show on map')}</button>`
                        : `<button type="button" class="control-icon-button" data-profile-view-record aria-label="${escapeHtml(t('Open full view'))}" title="${escapeHtml(t('Open full view'))}">${icon.expand}</button>`}
                    ${view.kind !== 'places' ? `<button type="button" class="control-icon-button" data-profile-unlink-record aria-label="${escapeHtml(t('Unlink from person'))}" title="${escapeHtml(t('Unlink from person'))}">${icon.unlink}</button>` : ''}
                </div>
            </div>
            ${renderProfileConnectedRecord(view.kind, selected)}
        </section>
    </div>`;
}

function renderProfileConnectedIcon(kind, record, glyph)
{
    if (kind === 'archive') return archiveFileIcon(record);
    if (kind === 'notes') return renderRelatedNoteIcon();
    if (kind === 'places') return `<span class="notes-place-icon" aria-hidden="true">${icon[glyph]}</span>`;
    return `<span class="connected-source-icon-record" aria-hidden="true">${icon[glyph]}</span>`;
}

function renderProfileConnectedRecord(kind, item, full = false)
{
    const record = item.record;
    const paragraph = text => text ? `<p>${escapeHtml(text)}</p>` : '';
    const meta = paragraph(item.meta);
    if (kind === 'photos')
    {
        return `${renderPhotoThumbnail(record, { className: 'profile-connected-media', label: item.title })}
            <div class="profile-connected-media-details">
                ${full ? '' : `<h4 data-user-content>${escapeHtml(item.title)}</h4>`}
                ${paragraph(record.caption)}
                <dl class="profile-connected-photo-details">
                    <div><dt>${escapeHtml(t('Date'))}</dt><dd>${escapeHtml(item.date)}</dd></div>
                    ${item.albumNames.length ? `<div><dt>${escapeHtml(t('Albums'))}</dt><dd>${item.albumNames.map(name => `<span class="profile-connected-album" data-user-content>${escapeHtml(name)}</span>`).join('')}</dd></div>` : ''}
                </dl>
            </div>`;
    }
    if (kind === 'archive')
    {
        const image = archiveImageExtensions.has(archiveDocumentExtension(record.name)) && archiveImageSource(record);
        const details = `<div class="profile-connected-media-details">
            <p class="profile-connected-file-meta">${escapeHtml([record.size, t(archiveFileTypeLabel(record))].filter(Boolean).join(' · '))}</p>
            ${full ? '' : `<h4 data-user-content>${escapeHtml(item.title)}</h4>`}
            ${paragraph(record.description)}
        </div>`;
        if (archiveCanViewFile(record) && !image)
        {
            return `<div data-document-tools hidden></div>
                <div class="archive-document-body" data-document-body>${paragraph(t('Loading document…'))}</div>
                ${details}`;
        }
        const badge = renderProfileArchiveBadge(record);
        const media = image
            ? `<div class="profile-connected-file-media">${renderPhotoThumbnail({ src: image }, { className: 'profile-connected-media', label: item.title })}${badge}</div>`
            : badge;
        return `${media}
            ${details}${!image ? paragraph(archiveDocumentLabel('No in-app viewer is available for this file.', 'Этот файл пока нельзя открыть в приложении.')) : ''}`;
    }
    if (kind === 'notes')
    {
        const body = record.body || (record.bodyDelta?.ops || []).map(op => typeof op.insert === 'string' ? op.insert : '').join('');
        return `<div class="profile-connected-note" data-profile-note-content data-user-content>${escapeHtml(body || t('No note content'))}</div>${meta}`;
    }
    if (kind === 'places')
    {
        const point = placeLatLng(record);
        const details = [placeSecondaryName(record), placeCountry(record)].filter(Boolean);
        const canLoadMap = point && placesMapAdapter.supportedProtocol();
        return `<div class="profile-connected-map-preview">
            <div class="profile-connected-map-fallback" data-profile-map-status>${icon.mapPin}
                <span>${escapeHtml(t(canLoadMap ? 'Loading map…' : point ? 'Map preview unavailable' : 'No coordinates'))}</span>
            </div>
            ${canLoadMap ? '<div class="profile-connected-map" data-profile-place-map></div>' : ''}
        </div>
            ${paragraph(point?.join(', '))}
            ${paragraph([...new Set(details)].join(' · '))}
            ${paragraph(record.description || record.notes)}
            ${full && item.events.length ? `<ul>${item.events.map(event => `<li>${escapeHtml([profileConnectedPlaceEventLabel(event), formatGenealogyDateLabel(event.date)].filter(Boolean).join(' · '))}</li>`).join('')}</ul>` : meta}`;
    }
    const references = [
        ...archiveFilesForSource(record.id).map(file => file.name),
        ...sourceLinksForSource(record.id, null, record.projectId).map(link =>
        {
            const target = sourceTargetRecord(link.targetType, link.targetId, record.projectId);
            return formatPersonFullName(target) || target?.title || target?.name;
        }).filter(Boolean)
    ];
    return `${renderArchiveSourceDetails(record, localizedSourceCategoryLabel(record.category), { allowPlaceNavigation: false })}
        ${full && references.length ? `<h4>${escapeHtml(t('References'))}</h4><ul>${[...new Set(references)].map(reference => `<li>${escapeHtml(reference)}</li>`).join('')}</ul>` : ''}`;
}

function renderProfileArchiveBadge(file)
{
    return `<div class="profile-connected-file-placeholder">${archiveFileIcon(file)}</div>`;
}

async function mountProfileConnectedMap(host, place)
{
    if (!host) return;
    const point = placeLatLng(place);
    if (!point) return;
    let map;
    let timer;
    let observer;
    const status = host.previousElementSibling;
    const cleanup = () =>
    {
        clearTimeout(timer);
        observer?.disconnect();
        map?.remove();
    };
    const showFallback = () =>
    {
        cleanup();
        host.hidden = true;
        if (status) status.querySelector('span').textContent = t('Map preview unavailable');
    };
    try
    {
        const library = await placesMapAdapter.load();
        if (!host.isConnected) return;
        map = placesMapAdapter.createMap(host, document.documentElement.dataset.theme);
        map.jumpTo({ center: placesMapAdapter.toLngLat(point), zoom: 12 });
        new library.Marker().setLngLat(placesMapAdapter.toLngLat(point)).addTo(map);
        observer = new MutationObserver(() =>
        {
            if (!host.isConnected) cleanup();
        });
        observer.observe(document.body, { childList: true, subtree: true });
        timer = setTimeout(showFallback, PLACES_MAP_CONFIG.loadTimeoutMs);
        map.once('load', () =>
        {
            clearTimeout(timer);
            host.classList.add('is-ready');
            if (status) status.hidden = true;
        });
    }
    catch (_error)
    {
        showFallback();
    }
}

function mountProfileConnectedPreview(explorer)
{
    const layout = explorer.querySelector('.profile-connected-layout');
    const preview = explorer.querySelector('.profile-connected-preview');
    if (layout && preview)
    {
        const selectedRow = layout.querySelector('[data-profile-record-id][aria-pressed="true"]');
        if (selectedRow && getComputedStyle(layout).gridTemplateColumns.split(' ').length === 1)
        {
            if (selectedRow.nextElementSibling !== preview) selectedRow.after(preview);
        }
        else if (preview.parentElement !== layout) layout.append(preview);
    }
    if (!preview || preview.dataset.mounted) return;
    preview.dataset.mounted = 'true';
    const { kind, id, personId } = profileConnectedView;
    const person = getPerson(personId);
    const item = person && profileConnectedRecords(person)[kind]?.find(record => record.id === id);
    if (item) mountProfileConnectedContent(preview, kind, item, true);
}

function mountProfileConnectedContent(host, kind, item, preview = false)
{
    if (host.querySelector('[data-document-body]'))
        renderArchiveDocumentContent(item.record, host, {
            preview,
            onError: body => body.insertAdjacentHTML('afterbegin', renderProfileArchiveBadge(item.record))
        });
    const noteHost = host.querySelector('[data-profile-note-content]');
    if (noteHost && window.Quill && item.record.bodyDelta)
    {
        const note = document.createElement('div');
        try
        {
            const quill = new window.Quill(note, { readOnly: true, modules: { toolbar: false } });
            quill.setContents(localizedNoteBodyDelta(cloneRichTextDelta(item.record.bodyDelta)), 'silent');
            noteHost.replaceChildren(note);
        }
        catch (_error) { /* Plain text remains available. */ }
    }
    if (kind === 'places') mountProfileConnectedMap(host.querySelector('[data-profile-place-map]'), item.record);
}

function openProfileConnectedViewer(person, explorer)
{
    const view = profileConnectedView;
    const category = view.kind;
    const records = profileConnectedRecords(person)[category];
    if (!records?.length) return;
    const scrollTop = main.scrollTop;
    openModal(`<div class="modal profile-connected-viewer" role="dialog" aria-modal="true" aria-labelledby="profile-connected-viewer-title">
        <div class="modal-header"><h2 id="profile-connected-viewer-title" data-user-content></h2>
            <button class="close-button" type="button" data-close aria-label="${escapeHtml(t('Close'))}">${icon.close}</button>
        </div>
        <div class="modal-body" data-profile-viewer-body></div>
        <div class="modal-footer">
            <button class="button secondary" type="button" data-profile-viewer-step="-1">${escapeHtml(t('Previous record'))}</button>
            <span data-profile-viewer-count role="status"></span>
            <button class="button secondary" type="button" data-profile-viewer-step="1">${escapeHtml(t('Next record'))}</button>
        </div>
    </div>`);
    const modal = modalBackdrop.querySelector('.profile-connected-viewer');
    const body = modal.querySelector('[data-profile-viewer-body]');
    const previous = modal.querySelector('[data-profile-viewer-step="-1"]');
    const next = modal.querySelector('[data-profile-viewer-step="1"]');
    let index = view.index;
    const show = () =>
    {
        const item = records[index];
        modal.querySelector('h2').textContent = item.title;
        const content = document.createElement('div');
        content.innerHTML = renderProfileConnectedRecord(category, item, true);
        body.replaceChildren(content);
        body.scrollTop = 0;
        previous.disabled = index === 0;
        next.disabled = index === records.length - 1;
        modal.querySelector('[data-profile-viewer-count]').textContent =
            t('{current} of {total}').replace('{current}', index + 1).replace('{total}', records.length);
        localizeUI(content);
        mountProfileConnectedContent(content, category, item);
    };
    [previous, next].forEach(button => button.addEventListener('click', () =>
    {
        const target = index + Number(button.dataset.profileViewerStep);
        if (target < 0 || target >= records.length) return;
        index = target;
        show();
        if (button.disabled) (button === next ? previous : next).focus();
    }));
    modalBackdrop.afterClose = () =>
    {
        if (!explorer.isConnected) return;
        view.index = index;
        view.id = records[index].id;
        view.expanded.add(category);
        explorer.querySelector('[data-profile-connected-content]').innerHTML = renderProfileConnectedContent(person);
        localizeUI(explorer);
        mountProfileConnectedPreview(explorer);
        explorer.querySelector('[data-profile-view-record]')?.focus({ preventScroll: true });
        main.scrollTop = scrollTop;
    };
    show();
}

function bindProfileConnectedExplorer(person)
{
    person = getPerson(person.id);
    const explorer = main.querySelector('[data-profile-connected-explorer]');
    if (!explorer || !person) return;
    profileConnectedResizeObserver?.disconnect();
    const observer = new ResizeObserver(() =>
    {
        if (explorer.isConnected) mountProfileConnectedPreview(explorer);
        else observer.disconnect();
    });
    profileConnectedResizeObserver = observer;
    observer.observe(explorer);
    mountProfileConnectedPreview(explorer);
    explorer.addEventListener('click', event =>
    {
        const button = event.target.closest('button');
        if (!button) return;
        const view = profileConnectedView;
        const { profileCategory, profileRecordKind, profileRecordId, profileMoreRecords, profileResourceAction } = button.dataset;
        if (button.hasAttribute('data-profile-view-place'))
        {
            state.placesView = 'all';
            showPlaceOnMap(view.id);
            return;
        }
        if (button.hasAttribute('data-profile-view-record'))
        {
            openProfileConnectedViewer(person, explorer);
            return;
        }
        if (button.hasAttribute('data-profile-unlink-record'))
        {
            const context = { contextType: 'person', contextId: person.id, onUnlinked: renderAfterPersonConnectedResourcesChanged };
            if (view.kind === 'photos') removePhotoPersonTag(view.id, person.id);
            if (view.kind === 'archive') openConnectedFileUnlinkConfirm({ ...context, fileId: view.id });
            if (view.kind === 'notes') openConnectedNoteUnlinkConfirm({ ...context, noteId: view.id });
            if (view.kind === 'sources') openConnectedSourceUnlinkConfirm({
                sourceId: view.id, targetType: 'person', targetId: person.id,
                projectId: person.projectId, onUnlinked: renderAfterPersonConnectedResourcesChanged
            });
            return;
        }
        if (profileResourceAction)
        {
            if (profileResourceAction === 'add-photos') openAddPhotosToPersonModal(person.id);
            if (profileResourceAction === 'add-files') openPersonFilesModal(person.id);
            if (profileResourceAction === 'add-note') openPersonNotesModal(person.id, 'profile');
            if (profileResourceAction === 'add-sources') openSourcesForTargetModal({
                targetType: 'person', targetId: person.id, projectId: person.projectId,
                title: 'Add sources', subtitle: formatPersonFullName(person) || person.name,
                afterSave: renderAfterPersonConnectedResourcesChanged
            });
            return;
        }
        let focus;
        if (profileCategory)
        {
            if (view.expanded.has(profileCategory)) view.expanded.delete(profileCategory);
            else view.expanded.add(profileCategory);
            focus = `[data-profile-category="${profileCategory}"]`;
        }
        else if (profileMoreRecords)
        {
            const oldLimit = view.limits[profileMoreRecords] || profileConnectedPageSize;
            view.limits[profileMoreRecords] = oldLimit + profileConnectedPageSize;
            focus = `#profile-connected-${profileMoreRecords} .profile-connected-record:nth-of-type(${oldLimit + 1})`;
        }
        else if (profileRecordKind)
        {
            view.kind = profileRecordKind;
            view.id = profileRecordId;
            focus = '[data-profile-record-id][aria-pressed="true"]';
        }
        else return;
        explorer.querySelector('[data-profile-connected-content]').innerHTML = renderProfileConnectedContent(person);
        localizeUI(explorer);
        mountProfileConnectedPreview(explorer);
        explorer.querySelector(focus)?.focus({ preventScroll: true });
    });
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
    bindProfileConnectedExplorer(person);
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

