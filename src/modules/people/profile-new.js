const PEOPLE_PROFILE_NEW_TABS = Object.freeze([
    ['overview', 'Overview'],
    ['photos', 'Photos'],
    ['files', 'Files'],
    ['notes', 'Notes'],
    ['places', 'Places'],
    ['sources', 'Sources']
]);
let profileNewTimelineResizeObserver = null;

function profileNewTimelineEvents(personId)
{
    return getFamilyTreeTimelineEvents(personId)
        .filter(event => event.projectId === currentProjectId());
}

function profileNewFactDate(value)
{
    return hasGenealogyDateValue(value) ? formatGenealogyDateLabel(value) : '';
}

function profileNewFactPlace(record)
{
    const place = getPlace(record.placeId);
    return cleanEditFieldValue(place?.projectId === currentProjectId() && !place.deleted ? place.name : record.placeText);
}

function profileNewFactContext(record, includeType = false)
{
    const fromDate = hasGenealogyDateValue(record.fromDate) ? record.fromDate : record.date;
    const dates = [profileNewFactDate(fromDate), profileNewFactDate(record.toDate)].filter(Boolean);
    const type = includeType ? cleanEditFieldValue(record.institutionType || record.type) : '';
    return [type, dates.join(' – '), profileNewFactPlace(record)].filter(Boolean).join(' · ');
}

function profileNewFactEntries(person)
{
    const records = Array.isArray(person?.attributes) ? person.attributes.filter(record => record && !record.deleted) : [];
    const alternativeNames = cleanEditFieldValue(person?.profile?.alternativeNames);
    const religions = new Set();
    const seenRecords = new Set();
    const group = (title, entries) => ({ title, entries: entries.filter(Boolean) });
    const entry = (label, value, context = '', authoredLabel = false) => value ? { label, value, context, authoredLabel } : null;
    const byTag = tag => records.filter(record =>
    {
        if (record.tag !== tag) return false;
        const key = record.id ? `${tag}:${record.id}` : record;
        if (seenRecords.has(key)) return false;
        seenRecords.add(key);
        return true;
    });

    const identity = [entry('Alternative names', alternativeNames)];
    byTag('RELI').forEach(record =>
    {
        const value = cleanEditFieldValue(record.value);
        const key = value.toLocaleLowerCase();
        if (!value || religions.has(key)) return;
        religions.add(key);
        const predefined = RELIGION_VALUES.find(option => option.toLocaleLowerCase() === key);
        identity.push(entry('Religion', predefined ? t(predefined) : value));
    });

    const background = [
        ...byTag('OCCU').map(record => entry('Occupation', [
            cleanEditFieldValue(record.value) || cleanEditFieldValue(record.occupation),
            cleanEditFieldValue(record.company) || cleanEditFieldValue(record.agency)
        ].filter(Boolean).join(' — '), profileNewFactContext(record))),
        ...byTag('EDUC').map(record =>
        {
            const primary = [educationValueLabel(record), educationInstitutionLabel(record)].filter(Boolean).join(' — ');
            return entry('Education', primary || cleanEditFieldValue(record.institutionType || record.type),
                profileNewFactContext(record, Boolean(primary)));
        })
    ];
    const other = [
        ...byTag('FACT').map(record =>
        {
            const type = cleanEditFieldValue(record.type);
            const value = cleanEditFieldValue(record.value);
            return entry(type && value ? type : 'Custom fact', value || type, profileNewFactContext(record), Boolean(type && value));
        }),
        entry('Cause of death', cleanEditFieldValue(person?.death?.cause) || cleanEditFieldValue(person?.death?.reason))
    ];

    return [group('Identity & beliefs', identity), group('Background details', background), group('Other recorded facts', other)]
        .filter(item => item.entries.length);
}

function renderProfileNewFacts(person)
{
    const groups = profileNewFactEntries(person);
    if (!groups.length)
        return `<p class="profile-new-facts-empty">${escapeHtml(t('No additional facts recorded.'))}</p>`;

    return groups.map(group => `
      <section class="profile-new-fact-group">
        <h3>${escapeHtml(t(group.title))}</h3>
        <div class="profile-new-fact-list">
          ${group.entries.map(item => `
            <div class="profile-new-fact-entry">
              <span class="profile-new-fact-label" ${item.authoredLabel ? 'data-user-content' : ''}>${escapeHtml(item.authoredLabel ? item.label : t(item.label))}</span>
              <span class="profile-new-fact-value" data-user-content>${escapeHtml(item.value)}</span>
              ${item.context ? `<span class="profile-new-fact-context" data-user-content>${escapeHtml(item.context)}</span>` : ''}
            </div>
          `).join('')}
        </div>
      </section>
    `).join('');
}

function renderProfileNewTimeline(person)
{
    const events = profileNewTimelineEvents(person.id);
    if (!events.length)
    {
        return `<p class="profile-new-timeline-empty">${escapeHtml(t('No timeline events recorded for this person.'))}</p>`;
    }

    return `<div class="profile-new-timeline-track" role="list">
      ${events.map(event => `
        <div class="profile-new-timeline-event" role="listitem">
          <button class="profile-new-timeline-event-button" type="button"
            data-profile-new-event="${escapeHtml(event.id)}"
            aria-label="${escapeHtml(`${event.title}. ${timelineEventDateLine(event) || t('Date unknown')}. ${timelinePlaceLabel(event)}`)}">
            <span class="profile-new-timeline-date">${timelineDateBlockHtml(event, person.id)}</span>
            <span class="profile-new-timeline-dot timeline-dot ${escapeHtml(timelineEventColor(event))}" aria-hidden="true">
              <span class="timeline-dot-icon">${timelineEventIcon(event)}</span>
            </span>
            <strong class="profile-new-timeline-title">${escapeHtml(event.title)}</strong>
            <span class="profile-new-timeline-detail">${timelineEventDetail(event, person.id)}</span>
          </button>
        </div>
      `).join('')}
    </div>`;
}

function openProfileNewEventDetails(personId, eventId)
{
    const event = profileNewTimelineEvents(personId).find(item => item.id === eventId);
    if (!event) return;

    openModal(`<div class="modal profile-new-event-dialog" role="dialog" aria-modal="true" aria-labelledby="profileNewEventTitle">
      <div class="modal-header">
        <div><h2 id="profileNewEventTitle">${escapeHtml(event.title)}</h2>
          <p>${escapeHtml(getPersonDisplayName(personId))}</p></div>
        <button type="button" class="close-button" data-close aria-label="${escapeHtml(t('Close'))}">${icon.close}</button>
      </div>
      <div class="modal-body"><div class="timeline">${renderTimelineItem(event, personId)}</div></div>
      <div class="modal-footer"><button class="button secondary" type="button" data-close>${escapeHtml(t('Close'))}</button></div>
    </div>`);
    bindTimelineSourceControls(modalBackdrop, {
        afterSave: () =>
        {
            renderPeople();
            if (modalBackdrop.querySelector('.profile-new-event-dialog'))
                openProfileNewEventDetails(personId, eventId);
        }
    });
    localizeUI(modalBackdrop);
}

function bindProfileNewTimeline(person)
{
    profileNewTimelineResizeObserver?.disconnect();
    profileNewTimelineResizeObserver = null;
    const scroller = main.querySelector('.profile-new-timeline-body');
    if (!scroller) return;
    const events = [...scroller.querySelectorAll('[data-profile-new-event]')];
    const previous = main.querySelector('[data-profile-new-timeline-previous]');
    const next = main.querySelector('[data-profile-new-timeline-next]');
    const update = () =>
    {
        const overflow = scroller.scrollWidth > scroller.clientWidth + 2;
        previous.hidden = next.hidden = !overflow;
        previous.disabled = !overflow || scroller.scrollLeft <= 2;
        next.disabled = !overflow || scroller.scrollLeft + scroller.clientWidth >= scroller.scrollWidth - 2;
    };
    scroller.addEventListener('scroll', update, { passive: true });
    previous?.addEventListener('click', () => scroller.scrollBy({ left: -scroller.clientWidth * .75, behavior: 'smooth' }));
    next?.addEventListener('click', () => scroller.scrollBy({ left: scroller.clientWidth * .75, behavior: 'smooth' }));
    scroller.addEventListener('keydown', event =>
    {
        if (event.target !== scroller || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
        event.preventDefault();
        scroller.scrollBy({ left: (event.key === 'ArrowRight' ? 1 : -1) * 220, behavior: 'smooth' });
    });
    events.forEach((button, index) =>
    {
        button.addEventListener('click', () => openProfileNewEventDetails(person.id, button.dataset.profileNewEvent));
        button.addEventListener('keydown', event =>
        {
            let target = index;
            if (event.key === 'ArrowRight') target = Math.min(index + 1, events.length - 1);
            else if (event.key === 'ArrowLeft') target = Math.max(index - 1, 0);
            else if (event.key === 'Home') target = 0;
            else if (event.key === 'End') target = events.length - 1;
            else return;
            event.preventDefault();
            events[target].focus();
        });
    });
    profileNewTimelineResizeObserver = new ResizeObserver(update);
    profileNewTimelineResizeObserver.observe(scroller);
    requestAnimationFrame(update);
}

function renderPeopleProfileNew(person)
{
    if (!person) return;
    const centralPerson = getPerson(person.id);
    if (!centralPerson || centralPerson.projectId !== currentProjectId() || centralPerson.deleted) return;
    profileNewTimelineResizeObserver?.disconnect();
    main.classList.remove('people-profile-main');
    main.classList.add('people-profile-new-main');

    const active = PEOPLE_PROFILE_NEW_TABS.some(([id]) => id === state.peopleProfileNewTab)
        ? state.peopleProfileNewTab : 'overview';
    state.peopleProfileNewTab = active;
    const tabName = PEOPLE_PROFILE_NEW_TABS.find(([id]) => id === active)[1];
    const overview = active === 'overview';

    main.innerHTML = `
      <div class="profile-new">
        <header class="profile-hero profile-new-hero">
          <div class="profile-hero-content">
            ${renderEditablePersonAvatar(person, 'profile-hero-photo')}
            <div class="profile-hero-copy">
              <h1>${escapeHtml(formatPersonFullName(centralPerson) || person.name)}</h1>
              ${cleanEditFieldValue(centralPerson.names?.maiden) ? `<p class="profile-new-maiden"><span>${escapeHtml(t('Maiden name'))}:</span> <span data-user-content>${escapeHtml(centralPerson.names.maiden)}</span></p>` : ''}
            </div>
            ${renderPeopleHeroLifeSummary(person, {
                includeBirthPlace: true,
                includeDeathPlace: true
            })}
            <div class="app-chip-row app-chip-row--on-accent profile-hero-tags">
              ${renderLivingStatusChip(person.living)}
              <span class="app-chip app-chip--photos">${Number(person.photos) || 0} ${escapeHtml(t('Photos'))}</span>
              <span class="app-chip app-chip--files">${Number(person.files) || 0} ${escapeHtml(t('Files'))}</span>
              <span class="app-chip app-chip--notes">${Number(person.notes) || 0} ${escapeHtml(t('Notes'))}</span>
            </div>
          </div>
          <div class="profile-hero-actions">
            <button class="button primary" type="button" id="profileNewEdit">${icon.edit}<span>${escapeHtml(t('Edit profile'))}</span></button>
            <button class="button secondary profile-new-more" type="button" id="profileNewMore" aria-label="${escapeHtml(t('More actions'))}" aria-haspopup="menu">${icon.more}</button>
          </div>
        </header>
        <div class="profile-new-tabs" role="tablist" aria-label="${escapeHtml(t('Profile sections'))}">
          ${PEOPLE_PROFILE_NEW_TABS.map(([id, label]) => `
            <button type="button" role="tab" id="profile-new-tab-${id}"
              aria-controls="profile-new-panel" aria-selected="${id === active}"
              tabindex="${id === active ? '0' : '-1'}" data-profile-new-tab="${id}">${escapeHtml(t(label))}</button>
          `).join('')}
        </div>
        <div class="profile-new-panel" id="profile-new-panel" role="tabpanel"
          aria-labelledby="profile-new-tab-${active}" tabindex="0">
          ${overview ? `
            <section class="profile-new-card profile-new-timeline" aria-labelledby="profile-new-timeline-title">
              <div class="profile-new-timeline-header">
                <h2 id="profile-new-timeline-title">${escapeHtml(t('Timeline'))}</h2>
                <div class="profile-new-timeline-actions">
                  <button type="button" data-profile-new-timeline-previous aria-label="${escapeHtml(t('Previous events'))}" hidden>${icon.arrow}</button>
                  <button type="button" data-profile-new-timeline-next aria-label="${escapeHtml(t('Next events'))}" hidden>${icon.chevron}</button>
                  <button type="button" data-profile-new-add-fact aria-label="${escapeHtml(t('Add fact'))}">${icon.plus}<span>${escapeHtml(t('Add fact'))}</span></button>
                </div>
              </div>
              <div class="profile-new-timeline-body" tabindex="0" aria-label="${escapeHtml(t('Timeline events'))}">
                ${renderProfileNewTimeline(person)}
              </div>
            </section>
            <div class="profile-new-lower">
              <section class="profile-new-card profile-new-relatives" aria-labelledby="profile-new-relatives-title">
                <div class="profile-new-relatives-inner">
                  <h2 id="profile-new-relatives-title">${escapeHtml(t('Relatives'))}<span class="profile-new-relatives-count">${relationshipCount(person.id)}</span></h2>
                  <div class="profile-new-relatives-body">${renderRelationships(person.id)}</div>
                </div>
              </section>
              <section class="profile-new-card profile-new-facts" aria-labelledby="profile-new-facts-title">
                <h2 id="profile-new-facts-title">${escapeHtml(t('Additional facts'))}</h2>
                <div class="profile-new-facts-body">${renderProfileNewFacts(centralPerson)}</div>
              </section>
            </div>
          ` : `
            <section class="profile-new-card profile-new-placeholder" aria-labelledby="profile-new-placeholder-title">
              <h2 id="profile-new-placeholder-title">${escapeHtml(t(tabName))}</h2>
              <p>${escapeHtml(t('This section is coming in a later stage.'))}</p>
            </section>
          `}
        </div>
      </div>`;

    main.querySelector('#profileNewEdit')?.addEventListener('click', () => openEditPersonModal(person.id));
    main.querySelector('#profileNewMore')?.addEventListener('click', event =>
        openPeopleActionsMenu(person.id, event.currentTarget, { includeProfile: false }));
    main.querySelector('[data-profile-new-add-fact]')?.addEventListener('click', () => openAddFactOverlay(person));
    if (overview)
    {
        bindProfileNewTimeline(person);
        bindRelationshipList(main, 'profile');
    }

    const tabs = [...main.querySelectorAll('[data-profile-new-tab]')];
    function activateTab(id, focus)
    {
        if (id === state.peopleProfileNewTab) return;
        state.peopleProfileNewTab = id;
        renderPeople();
        if (focus) main.querySelector(`[data-profile-new-tab="${id}"]`)?.focus();
    }
    tabs.forEach((tab, index) =>
    {
        tab.addEventListener('click', () => activateTab(tab.dataset.profileNewTab, false));
        tab.addEventListener('keydown', event =>
        {
            let next = index;
            if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
            else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
            else if (event.key === 'Home') next = 0;
            else if (event.key === 'End') next = tabs.length - 1;
            else return;
            event.preventDefault();
            const id = tabs[next].dataset.profileNewTab;
            if (id === active) tabs[next].focus();
            else activateTab(id, true);
        });
    });
}
