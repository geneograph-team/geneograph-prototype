const PEOPLE_PROFILE_NEW_TABS = Object.freeze([
    ['overview', 'Overview'],
    ['photos', 'Photos'],
    ['files', 'Files'],
    ['notes', 'Notes'],
    ['places', 'Places'],
    ['sources', 'Sources']
]);

function renderPeopleProfileNew(person)
{
    if (!person) return;
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
            <div class="profile-hero-copy"><h1>${escapeHtml(person.name)}</h1></div>
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
              <h2 id="profile-new-timeline-title">${escapeHtml(t('Timeline'))}</h2>
              <div class="profile-new-timeline-body"></div>
            </section>
            <div class="profile-new-lower">
              <section class="profile-new-card profile-new-relatives" aria-labelledby="profile-new-relatives-title">
                <h2 id="profile-new-relatives-title">${escapeHtml(t('Relatives'))}</h2>
                <div class="profile-new-relatives-body"></div>
              </section>
              <section class="profile-new-card profile-new-facts" aria-labelledby="profile-new-facts-title">
                <h2 id="profile-new-facts-title">${escapeHtml(t('Facts & connections'))}</h2>
                <div class="profile-new-facts-body"></div>
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
