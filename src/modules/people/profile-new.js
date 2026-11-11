/* Opt-in Profile New. Legacy Profile remains the destination of person links. */
const PROFILE_NEW_TABS = Object.freeze(['overview', 'photos', 'files', 'notes', 'places']);
function profileNewTabLabel(tab)
{
    return t({overview: 'Overview', photos: 'Photos', files: 'Files', notes: 'Notes', places: 'Places'}[tab] || 'Overview');
}
function profileNewCounts(person)
{
    return {photos: getPhotosForPerson(person.id).length,
        files: getArchiveFilesForPerson(person.id).length,
        notes: getNotesForPerson(person.id).length,
        places: getProfileConnectedPlaces(person.id).length};
}
function renderProfileNewTimeline(person)
{
    const events = getFamilyTreeTimelineEvents(person.id);
    const content = events.length
        ? '<div class="timeline profile-new-events">' + events.map(event => renderTimelineItem(event, person.id)).join('') + '</div>'
        : '<p class="profile-new-muted">' + escapeHtml(t('No timeline events recorded for this person.')) + '</p>';
    return '<section class="profile-new-sheet profile-new-timeline">' +
        '<header class="profile-new-sheet-head"><h2>' + icon.clock + escapeHtml(t('Life timeline')) +
        '</h2><span class="profile-new-count">' + events.length + '</span>' +
        '<div class="profile-new-arrows">' +
        '<button type="button" class="button secondary" data-profile-new-scroll="-1" aria-label="' + escapeHtml(t('Previous events')) + '">' + icon.chevron + '</button>' +
        '<button type="button" class="button secondary" data-profile-new-scroll="1" aria-label="' + escapeHtml(t('Next events')) + '">' + icon.chevron + '</button>' +
        '</div></header><div class="profile-new-timeline-scroll" role="region" tabindex="0" aria-label="' + escapeHtml(t('Life timeline')) + '">' +
        content + '</div></section>';
}
function renderProfileNewFamily(person)
{
    return '<section class="profile-new-sheet profile-new-family"><header class="profile-new-sheet-head"><h2>' +
        icon.peoplegroup + escapeHtml(t('Immediate family')) + '</h2><span class="profile-new-count">' +
        relationshipCount(person.id) + '</span></header><div class="profile-new-family-content">' +
        renderRelationships(person.id) + '</div></section>';
}
function renderProfileNewSummary(person)
{
    const counts = profileNewCounts(person);
    const details = peopleProfileDetailsFor(person);
    const central = getPerson(person.id);
    const rows = [];
    if (central?.birth?.placeId || person.birthPlace)
        rows.push([t('Birth place'), cleanEditFieldValue(getPlaceDisplay(central?.birth?.placeId)) || person.birthPlace]);
    if (person.living === 'Deceased' && (central?.death?.placeId || person.deathPlace))
        rows.push([t('Death place'), cleanEditFieldValue(getPlaceDisplay(central?.death?.placeId)) || person.deathPlace]);
    if (details.burialPlace) rows.push([t('Burial place'), details.burialPlace]);
    if (details.religion) rows.push([t('Religion'), details.religion]);
    getFamilyTreeTimelineEvents(person.id).forEach(event =>
    {
        if (rows.length >= 6 || ['birth', 'death', 'childBirth'].includes(event.type)) return;
        const detail = timelineEventDetail(event, person.id);
        const plain = String(detail || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        if (plain) rows.push([event.title, plain]);
    });
    const facts = rows.length
        ? '<dl class="profile-new-facts">' + rows.map(row => '<div><dt>' + escapeHtml(t(row[0])) +
          '</dt><dd>' + escapeHtml(row[1]) + '</dd></div>').join('') + '</dl>'
        : '<p class="profile-new-muted">' + escapeHtml(t('No recorded facts')) + '</p>';
    const latestNote = getNotesForPerson(person.id)[0];
    const recent = latestNote
        ? '<p class="profile-new-note-title">' + escapeHtml(latestNote.title || latestNote.name || t('Notes')) + '</p>' +
          '<button class="profile-new-text-link" type="button" data-profile-new-tab="notes">' +
          escapeHtml(t('Open connected notes')) + ' ' + icon.chevron + '</button>'
        : '<p class="profile-new-muted">' + escapeHtml(t('No linked notes')) + '</p>';
    const links = ['photos', 'files', 'notes', 'places'].map(tab =>
        '<button type="button" class="profile-new-link" data-profile-new-tab="' + tab + '"><strong>' +
        escapeHtml(profileNewTabLabel(tab)) + '</strong><span>' + counts[tab] + '</span></button>').join('');
    return '<section class="profile-new-sheet profile-new-summary"><header class="profile-new-sheet-head"><h2>' +
        icon.info + escapeHtml(t('Facts & connections')) + '</h2></header><div class="profile-new-summary-content">' +
        '<section><h3>' + escapeHtml(t('Recorded facts')) + '</h3>' + facts + '</section>' +
        '<section><h3>' + escapeHtml(t('Connected research')) + '</h3><div class="profile-new-links">' +
        links + '</div></section><section><h3>' + escapeHtml(t('Recent research note')) + '</h3>' +
        recent + '</section></div></section>';
}
function renderPeopleProfileNew(person)
{
    main.classList.add('people-profile-main');
    if (!person || person.deleted || person.projectId !== currentProjectId())
    {
        state.peopleView = 'directory';
        state.peopleSide = 'people';
        renderPeople();
        return;
    }
    const tab = PROFILE_NEW_TABS.includes(state.peopleProfileNewTab) ? state.peopleProfileNewTab : 'overview';
    state.peopleProfileNewTab = tab;
    const counts = profileNewCounts(person);
    const central = getPerson(person.id);
    const years = [formatGenealogyDateLabel(central?.birth || person.birth),
        formatGenealogyDateLabel(central?.death || person.death)].filter(Boolean).join(' – ');
    const tabs = PROFILE_NEW_TABS.map(name =>
        '<button type="button" role="tab" id="profileNewTab-' + name + '" class="profile-new-tab ' +
        (name === tab ? 'active' : '') + '" aria-selected="' + (name === tab) +
        '" tabindex="' + (name === tab ? '0' : '-1') +
        '" aria-controls="profileNewPanel" data-profile-new-tab="' + name + '">' +
        escapeHtml(profileNewTabLabel(name)) + (name === 'overview' ? '' : '<small>' + counts[name] + '</small>') + '</button>').join('');
    const panel = tab === 'overview'
        ? renderProfileNewTimeline(person) + '<div class="profile-new-columns">' +
          renderProfileNewFamily(person) + renderProfileNewSummary(person) + '</div>'
        : '<section class="profile-new-sheet profile-new-placeholder"><h2>' +
          escapeHtml(profileNewTabLabel(tab)) + '</h2><p>' +
          escapeHtml(t('This section is being prepared.')) + '</p></section>';
    main.innerHTML = '<div class="profile-new">' +
        '<button type="button" class="profile-new-back profile-new-text-link" data-profile-new-back>' +
        icon.arrow + escapeHtml(t('Back to people')) + '</button>' +
        '<header class="profile-new-hero"><div class="profile-new-avatar">' +
        renderEditablePersonAvatar(person, 'profile-hero-photo') + '</div>' +
        '<div class="profile-new-identity"><h1>' + escapeHtml(person.name) +
        '</h1><p>' + escapeHtml([years, t(person.living || '')].filter(Boolean).join(' · ')) +
        '</p></div><div class="profile-new-hero-actions">' +
        '<button type="button" class="button secondary" data-profile-new-edit>' +
        icon.edit + escapeHtml(t('Edit person')) + '</button>' +
        '<button type="button" class="button secondary" data-profile-new-relative>' +
        icon.plus + escapeHtml(t('Add relative')) + '</button></div></header>' +
        '<div class="profile-new-tabs" role="tablist" aria-label="' +
        escapeHtml(t('Profile New')) + '">' + tabs + '</div>' +
        '<div id="profileNewPanel" role="tabpanel" aria-labelledby="profileNewTab-' + tab + '">' +
        panel + '</div></div>';
    bindPeopleProfileNew(person);
}
function bindPeopleProfileNew(person)
{
    const root = main.querySelector('.profile-new');
    root.querySelector('[data-profile-new-back]')?.addEventListener('click', () =>
    {
        appNavigationMarkIntent();
        state.peopleView = 'directory';
        state.peopleSide = 'people';
        renderPeople();
        renderTopbar();
    });
    root.querySelector('[data-profile-new-edit]')?.addEventListener('click', () =>
    {
        appNavigationMarkIntent();
        state.peopleView = 'profile';
        state.peopleSide = 'profile';
        state.peopleProfileEditing = true;
        renderPeople();
        renderTopbar();
    });
    root.querySelector('[data-profile-new-relative]')?.addEventListener('click',
        event => openRelativePopover(event.currentTarget, person.id));
    root.querySelectorAll('[data-profile-new-tab]').forEach(button =>
        button.addEventListener('click', () =>
        {
            const next = button.dataset.profileNewTab;
            if (!PROFILE_NEW_TABS.includes(next)) return;
            state.peopleProfileNewTab = next;
            renderPeople();
            main.querySelector('#profileNewTab-' + next)?.focus({ preventScroll: true });
        }));
    root.querySelector('.profile-new-tabs')?.addEventListener('keydown', event =>
    {
        const tabs = [...root.querySelectorAll('.profile-new-tabs [role="tab"]')];
        const index = tabs.findIndex(button => button.getAttribute('aria-selected') === 'true');
        let next = index;
        if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
        if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = tabs.length - 1;
        if (next === index) return;
        event.preventDefault();
        tabs[next].click();
    });
    const track = root.querySelector('.profile-new-timeline-scroll');
    root.querySelectorAll('[data-profile-new-scroll]').forEach(button =>
        button.addEventListener('click', () =>
            track?.scrollBy({left: Number(button.dataset.profileNewScroll) *
                Math.max(260, track.clientWidth * .75), behavior: 'smooth'})));
    track?.addEventListener('keydown', event =>
    {
        if (event.target !== track || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
        event.preventDefault();
        track.scrollBy({left: event.key === 'ArrowRight' ? 240 : -240, behavior: 'smooth'});
    });
    bindRelationshipList(root, 'profile');
    bindTimelineSourceControls(root, {afterSave: renderAfterPersonConnectedResourcesChanged});
}
