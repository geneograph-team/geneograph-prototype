function renderPublish()
{
    renderPublishSidebar();
    if (state.publishView === 'wizard') renderPublishWizard();
    else renderPublishHome();
}

function renderPublishSidebar()
{
    const hasPeople = publishProjectPeople().length > 0;
    const nav = [
        ['drafts', 'Drafts', publishIcon('draft')],
        ['reports', 'Reports', publishIcon('report')],
        ['charts', 'Charts', publishIcon('chart')],
        ['exports', 'Exports', publishIcon('export')],
        ['recent', 'Recently exported', icon.clock]
    ];
    sidebar.innerHTML = `
        <div class="button-stack">
          <button class="button primary full" type="button" id="publishCreateOutput">${icon.plus} New Publication</button>
        </div>
        <div class="side-section-title">Publish</div>
        <div class="side-nav">
          ${nav.map(([id, label, ico]) => `<button class="side-link ${state.publishSide === id ? 'active' : ''}" type="button" data-publish-side="${id}">${ico}<span>${label}</span></button>`).join('')}
        </div>
        <div class="tip-card">
          <div class="tip-title">${publishIcon('shield')} Publishing checklist</div>
          <p>Review living people, private notes, unsourced facts, and source inclusion before exporting.</p>
        </div>
      `;
    sidebar.querySelector('#publishCreateOutput')?.addEventListener('click', () =>
    {
        openPublishWizard(hasPeople ? 'report' : 'export');
    });
    sidebar.querySelectorAll('[data-publish-side]').forEach(button => button.addEventListener('click', () =>
    {
        state.publishSide = button.dataset.publishSide;
        state.publishView = 'home';
        renderPublish();
    }));
}

function renderPublishHome()
{
    const filtered = filteredPublishDrafts();
    const showTemplates = state.publishSide === 'drafts';
    main.innerHTML = `
        <div class="publish-main">
          <div class="publish-page-head">
            <div><h1 class="app-page-title">Publish</h1><p>Create reports, charts, and export packages from your family history research.</p></div>
          </div>
          <div class="publish-toolbar">
            <div class="publish-toolbar-left">
              <label class="app-search-field" aria-label="Search publish drafts">${icon.search}<input id="publishSearch" type="search" placeholder="Search drafts and exports..." value="${escapeHtml(state.publishSearch)}"></label>
            </div>
            <div class="publish-toolbar-right">
              <button class="button secondary" type="button" data-toast="Template library is planned for a later Publish iteration.">Templates</button>
              <button class="button secondary" type="button" data-toast="Online publishing will be designed later.">Share settings</button>
            </div>
          </div>
          ${showTemplates ? `<div class="publish-section-title"><div><h2>Start a new publication</h2></div></div>
          <div class="publish-create-grid">
            ${publishTypes.map(type => renderPublishTypeCard(type, false)).join('')}
          </div>` : ''}
          <div class="publish-home-grid">
            <section>
              <div class="publish-section-title"><div><h2>${escapeHtml(publishSideTitle())}</h2><p>${filtered.length} item${filtered.length === 1 ? '' : 's'} shown</p></div></div>
              <div class="publish-draft-list">${filtered.length ? filtered.map(renderPublishDraftCard).join('') : renderPublishEmpty()}</div>
            </section>
            <aside class="publish-panel">
              <h3>Privacy & source readiness</h3>
              <div class="publish-readiness" style="margin-top:16px">
                ${renderPublishReadiness()}
              </div>
            </aside>
          </div>
        </div>`;
    bindSearchInput(main, '#publishSearch', 'publishSearch', renderPublishHome);
    main.querySelectorAll('[data-publish-type]').forEach(button => button.addEventListener('click', () => openPublishWizard(button.dataset.publishType)));
    main.querySelectorAll('[data-continue-draft]').forEach(button => button.addEventListener('click', () =>
    {
        const draft = getPublishDraft(button.dataset.continueDraft);
        if (draft) openPublishWizard(draft.type, draft.id);
    }));
    main.querySelectorAll('[data-publish-draft-menu]').forEach(button => button.addEventListener('click', e =>
    {
        e.stopPropagation();
        openPublishDraftMenu(button.dataset.publishDraftMenu, button);
    }));
    bindToasts(main);
}

function renderPublishTypeCard(type, selectable = true)
{
    const unavailable = publishTypeNeedsPeople(type.id) && !publishProjectPeople().length;
    return `<button class="publish-type-card ${state.publishOutputType === type.id && selectable ? 'selected' : ''}" type="button" data-publish-type="${type.id}" ${unavailable ? 'disabled aria-disabled="true"' : ''}>
        <span class="publish-type-icon">${publishIcon(type.id)}</span>
        <h3>${escapeHtml(type.title)}</h3>
        <p>${escapeHtml(type.desc)}</p>
        ${unavailable ? `<span class="panel-muted">${escapeHtml(t('Add people before creating person-based publications.'))}</span>` : ''}
        <div class="publish-mini-list">${type.formats.map(format => `<span>${escapeHtml(format)}</span>`).join('')}</div>
      </button>`;
}

function renderPublishDraftCard(draft)
{
    const statusClass = draft.status === 'exported' || draft.privacy === 'Published' || draft.privacy === 'Ready to export' ? 'good' : draft.privacy === 'Needs review' || draft.privacy === 'Draft' ? 'warn' : 'blue';
    return `<article class="publish-card" data-publish-draft="${draft.id}">
        ${renderPublishPreviewThumb(draft)}
        <div class="publish-card-main">
          <h3>${escapeHtml(draft.title)}</h3>
          <p>${escapeHtml(draft.scope)}</p>
          <div class="publish-card-meta">
            ${(draft.details || []).slice(0, 4).map(detail => `<span>${escapeHtml(detail)}</span>`).join('')}
          </div>
          <div class="publish-card-meta publish-card-status-row">
            <span class="publish-chip ${statusClass}">${escapeHtml(draft.privacy || (draft.status === 'exported' ? 'Exported' : 'Draft'))}</span>
            <span class="publish-chip">${escapeHtml(draft.format)}</span>
            <span>${escapeHtml(draft.updated)}</span>
          </div>
        </div>
        <div class="publish-card-actions">
          <button class="button secondary" type="button" data-continue-draft="${draft.id}">${draft.status === 'exported' ? 'View' : 'Continue'}</button>
          <button class="more-button" type="button" aria-haspopup="menu" data-publish-draft-menu="${draft.id}" aria-label="Draft actions">${icon.more}</button>
        </div>
      </article>`;
}

function renderPublishPreviewThumb(draft)
{
    const kind = draft.preview || draft.type;
    if (kind === 'book')
    {
        return `<div class="publish-card-preview book"><div class="publish-cover-title">THE WHISKERFIELD<br>FAMILY</div><div class="publish-cover-subtitle">Our Story</div><div class="publish-cover-people"><span></span><span></span><span></span></div></div>`;
    }
    if (kind === 'chart')
    {
        return `<div class="publish-card-preview chart"><span class="node n1"></span><span class="node n2"></span><span class="node n3"></span><span class="node n4"></span><span class="node n5"></span></div>`;
    }
    if (kind === 'map')
    {
        return `<div class="publish-card-preview map"><span class="route r1"></span><span class="route r2"></span><span class="pin p1"></span><span class="pin p2"></span><span class="pin p3"></span></div>`;
    }
    if (kind === 'index')
    {
        return `<div class="publish-card-preview index"><div></div><div></div><div></div><div></div><div></div></div>`;
    }
    if (kind === 'biography')
    {
        return `<div class="publish-card-preview biography"><div class="portrait"></div><div class="bio-lines"><span></span><span></span><span></span></div></div>`;
    }
    return `<div class="publish-card-preview report"><div class="report-title">WHO WAS DAISY MILKPAW'S FATHER?</div><div class="report-layout"><span class="portrait"></span><span class="line l1"></span><span class="line l2"></span><span class="line l3"></span><span class="line l4"></span></div></div>`;
}

function renderPublishEmpty()
{
    return `<div class="publish-panel" style="text-align:center;padding:32px"><h3>No outputs here yet</h3><p style="color:var(--text-secondary);margin:8px 0 0">Use New Publication or open Drafts to start from a template.</p></div>`;
}

function renderPublishReadiness()
{
    const projectId = currentProjectId();
    const people = getPeople(projectId);
    const photos = getProjectPhotos(projectId);
    const sources = (sampleData.sources || []).filter(source => source.projectId === projectId);
    if (!people.length && !photos.length && !sources.length)
    {
        return `<div class="panel-muted">${escapeHtml(t('Start by adding a person or opening a project module.'))}</div>`;
    }
    const livingIds = new Set(people.filter(person => normalizeLivingStatus(person.livingStatus) === 'Living').map(person => person.id));
    const privacyPhotos = photos.filter(photo => (photo.personIds || []).some(personId => livingIds.has(personId))).length;
    const rows = [
        ['ok', 'Living people hidden', 'Export defaults hide living people and private details.'],
        privacyPhotos
            ? ['warn', `${privacyPhotos} ${privacyPhotos === 1 ? 'photo needs' : 'photos need'} privacy review`, 'Photos linked to living people should be reviewed before sharing.']
            : ['ok', 'Photo privacy ready', 'No photos linked to living people need review.'],
        sources.length
            ? ['ok', 'Sources can be included', `${sources.length} ${sources.length === 1 ? 'source is' : 'sources are'} available for this project.`]
            : ['warn', 'No sources yet', 'Add sources before creating a sourced publication.']
    ];
    return rows.map(([kind, title, copy]) => `<div class="publish-readiness-row"><span class="publish-readiness-icon ${kind === 'warn' ? 'warn' : ''}">${kind === 'warn' ? '!' : '?'}</span><div><strong>${escapeHtml(title)}</strong><span>${escapeHtml(copy)}</span></div></div>`).join('');
}

function renderPublishWizard()
{
    const type = publishTypes.find(t => t.id === state.publishOutputType) || publishTypes[0];
    if (publishTypeNeedsPeople(type.id) && !publishProjectPeople().length)
    {
        state.publishView = 'home';
        renderPublishHome();
        return;
    }
    main.innerHTML = `
        <div class="publish-main">
          <div class="publish-page-head">
            <div><h1 class="app-page-title">Create ${escapeHtml(type.title.toLowerCase())}</h1><p>Choose scope, content, privacy settings, and preview the output before exporting.</p></div>
            <button class="button secondary" type="button" id="publishBackHome">Back to Publish</button>
          </div>
          <div class="publish-stepper" aria-label="Publish steps">
            ${publishSteps().map((step, index) => `<button class="publish-step ${state.publishWizardStep === step.id ? 'active' : ''}" type="button" data-publish-step="${step.id}" aria-current="${state.publishWizardStep === step.id ? 'step' : 'false'}"><span class="num">${index + 1}</span>${step.label}</button>`).join('')}
          </div>
          <div class="publish-wizard">
            <section class="publish-wizard-panel">
              <div class="publish-wizard-head"><h2>${escapeHtml(publishStepTitle())}</h2><p>${escapeHtml(publishStepCopy())}</p></div>
              <div class="publish-wizard-body">${renderPublishStepBody()}</div>
              <div class="publish-wizard-footer">
                <button class="button secondary" type="button" id="publishStepBack">Back</button>
                <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end">
                  <button class="button secondary" type="button" id="publishSaveDraft">Save draft</button>
                  <button class="button primary" type="button" id="publishStepNext">${state.publishWizardStep === 'preview' ? 'Export' : 'Continue'}</button>
                </div>
              </div>
            </section>
            <aside class="publish-preview" aria-label="Publish preview">
              ${renderPublishPreview()}
            </aside>
          </div>
        </div>`;
    bindPublishWizardEvents();
}

function renderPublishStepBody()
{
    if (state.publishWizardStep === 'type')
    {
        return `<div class="publish-create-grid" style="grid-template-columns:1fr;gap:12px;margin:0">${publishTypes.map(type => renderPublishTypeCard(type, true)).join('')}</div>`;
    }
    if (state.publishWizardStep === 'scope') return renderPublishScopeStep();
    if (state.publishWizardStep === 'settings') return renderPublishSettingsStep();
    return renderPublishPrivacyStep();
}

function renderPublishScopeStep()
{
    const people = publishProjectPeople();
    const focusPerson = publishFocusPerson();
    if (focusPerson) state.publishFocusPersonId = focusPerson.id;
    const options =
        state.publishOutputType === 'chart'
            ? [
                [
                    'ancestor',
                    'Ancestor chart',
                    'Show ancestors of the focus person.'
                ],
                [
                    'descendant',
                    'Descendant chart',
                    'Show descendants from the focus person.'
                ],
                [
                    'snapshot',
                    'Family tree snapshot',
                    'Use the current tree view as the output scope.'
                ],
                [
                    'fan',
                    'Fan chart placeholder',
                    'A later chart style for compact ancestry.'
                ]
            ]
            : state.publishOutputType === 'export'
                ? [
                    [
                        'project',
                        'Whole project',
                        'Export all people, sources, places, notes, and relationships.'
                    ],
                    [
                        'people',
                        'Selected people',
                        'Choose a smaller set of people for sharing.'
                    ]
                ]
                : [
                    [
                        'person',
                        'One person',
                        'A focused profile report for one person.'
                    ],
                    [
                        'ancestors',
                        'Ancestors of person',
                        'Ancestor narrative with configured generations.'
                    ],
                    [
                        'descendants',
                        'Descendants of person',
                        'Descendant report from the focus person.'
                    ]
                ];

    return `
        <div class="publish-form-grid">
          <div class="publish-option-list">
            ${options
                .map(
                    ([id, title, copy]) => `
                  <button
                    class="
                      publish-option
                      ${
                            state.publishScopeMode === id
                                ? 'active'
                                : ''
                        }
                    "
                    type="button"
                    data-publish-scope="${id}">

                    <span
                      class="publish-type-icon"
                      style="width:34px;height:34px">
                      ${publishIcon(
                            state.publishOutputType
                        )}
                    </span>

                    <span>
                      <strong>
                        ${escapeHtml(title)}
                      </strong>

                      <span>
                        ${escapeHtml(copy)}
                      </span>
                    </span>
                  </button>
                `
                )
                .join('')}
          </div>

          <div class="publish-form-row">
            <div class="publish-field">
              <label>Focus person</label>

              <select id="publishFocusPerson" ${people.length ? '' : 'disabled'}>
                ${people.length
                    ? people.map(person => `<option value="${escapeHtml(person.id)}" ${person.id === state.publishFocusPersonId ? 'selected' : ''}>${escapeHtml(person.names?.display || 'Unknown')}</option>`).join('')
                    : '<option value="">No people</option>'}
              </select>
            </div>

            <div class="publish-field">
              <label>Generations</label>

              <select id="publishGenerations">
                <option
                  value="3"
                  ${
                        state.publishGenerations == 3
                            ? 'selected'
                            : ''
                    }>
                  3 generations
                </option>

                <option
                  value="4"
                  ${
                        state.publishGenerations == 4
                            ? 'selected'
                            : ''
                    }>
                  4 generations
                </option>

                <option
                  value="5"
                  ${
                        state.publishGenerations == 5
                            ? 'selected'
                            : ''
                    }>
                  5 generations
                </option>

                <option
                  value="6"
                  ${
                        state.publishGenerations == 6
                            ? 'selected'
                            : ''
                    }>
                  6 generations
                </option>
              </select>
            </div>
          </div>
        </div>
      `;
}

function renderPublishSettingsStep()
{
    const settings = [
        ['includePhotos', 'Include photos'],
        ['includeDatesPlaces', 'Include dates and places'],
        ['includeSources', 'Include sources and citations'],
        ['includeNotes', 'Include public notes'],
        ['includeArchiveRefs', 'Include archive file references'],
        ['includeLivingPeople', 'Include living people'],
        ['anonymizeLiving', 'Replace living names with "Living person"'],
        ['includePrivateNotes', 'Include private notes'],
        ['includeUnsourcedFacts', 'Include unsourced facts']
    ];
    return `<div class="publish-check-list">${settings.map(([key, label]) => `<label class="publish-check"><span>${escapeHtml(label)}</span><input type="checkbox" data-publish-setting="${key}" ${state.publishSettings[key] ? 'checked' : ''}></label>`).join('')}</div>`;
}

function renderPublishPrivacyStep()
{
    const projectId = currentProjectId();
    const people = getPeople(projectId);
    const livingIds = new Set(people.filter(person => normalizeLivingStatus(person.livingStatus) === 'Living').map(person => person.id));
    const privacyPhotoCount = getProjectPhotos(projectId).filter(photo =>
        (photo.personIds || []).some(personId => livingIds.has(personId))
    ).length;
    const sourceCount = (sampleData.sources || []).filter(source => source.projectId === projectId).length;
    return `<div class="publish-form-grid">
        <div class="publish-warning-list">
          <div class="publish-warning good"><strong>${icon.check}</strong><span>Living people will be hidden unless you explicitly include them.</span></div>
          <div class="publish-warning good"><strong>${icon.check}</strong><span>Private notes are excluded by default.</span></div>
          ${privacyPhotoCount ? `<div class="publish-warning"><strong>${icon.warning}</strong><span>${privacyPhotoCount} ${privacyPhotoCount === 1 ? 'photo is' : 'photos are'} linked to living people and should be reviewed.</span></div>` : ''}
          ${sourceCount ? '' : '<div class="publish-warning"><strong>!</strong><span>No sources are available in this project.</span></div>'}
        </div>
        <div class="publish-field"><label>Output format</label><select id="publishFormat"><option ${state.publishFormat === 'PDF' ? 'selected' : ''}>PDF</option><option ${state.publishFormat === 'PNG' ? 'selected' : ''}>PNG</option><option ${state.publishFormat === 'GEDCOM' ? 'selected' : ''}>GEDCOM</option><option ${state.publishFormat === 'GEDZip' ? 'selected' : ''}>GEDZip</option></select></div>
      </div>`;
}

function renderPublishPreview()
{
    const type = publishTypes.find(t => t.id === state.publishOutputType) || publishTypes[0];
    return `<div class="publish-preview-head"><div><h3>${escapeHtml(type.title)} preview</h3><span>${escapeHtml(publishScopeLabel())}</span></div><span class="publish-chip ${state.publishOutputType === 'export' ? 'purple' : 'good'}">${escapeHtml(state.publishFormat)}</span></div>${state.publishOutputType === 'chart' ? renderPublishChartPreview() : state.publishOutputType === 'export' ? renderPublishPackagePreview() : renderPublishReportPreview()}`;
}

function renderPublishReportPreview()
{
    const project = currentProject();
    const person = publishFocusPerson();
    if (!project || !person) return `<div class="panel-muted">${escapeHtml(t('Add people before creating person-based publications.'))}</div>`;
    const personName = person.names?.display || 'Unknown';
    const birth = formatGenealogyDateLabel(person.birth) || 'Birth date unknown';
    const birthPlace = person.birth?.placeId
        ? getPlaceDisplay(person.birth.placeId)
        : person.birth?.placeText || 'Place unknown';
    const sourceCount =
        sourceIdsForTarget(
            'person',
            person.id,
            person.projectId
        ).length;
    const noteCount = getNotesForPerson(person.id, { includeArchived: true }).length;
    return `<div class="publish-report-page">
        <h2>${escapeHtml(project.name)}</h2>
        <div class="muted-line">Prepared from GeneoGraph research - ${escapeHtml(personName)}</div>
        <p><strong>${escapeHtml(personName)}</strong> · ${escapeHtml(birth)} · ${escapeHtml(birthPlace)}</p>
        <div class="publish-report-section"><strong>Research summary</strong><p>${sourceCount} ${sourceCount === 1 ? 'source' : 'sources'} and ${noteCount} ${noteCount === 1 ? 'note' : 'notes'} are linked to this person.</p></div>
        <div class="publish-report-section publish-footnote">Generated from the active project only.</div>
      </div>`;
}

function renderPublishChartPreview()
{
    const person = publishFocusPerson();
    if (!person) return `<div class="panel-muted">${escapeHtml(t('Add people before creating person-based publications.'))}</div>`;
    const family = currentTreeFamilies().find(item => (item.children || []).includes(person.id));
    const parentIds = [family?.left, family?.right].filter(Boolean);
    const parentCards = parentIds.map((personId, index) =>
    {
        const parent = getPerson(personId);
        return `<div class="publish-chart-card" style="left:${index ? 470 : 170}px;top:118px"><strong>${escapeHtml(parent?.names?.display || 'Unknown')}</strong><span>Parent</span></div>`;
    }).join('');
    return `<div class="publish-chart-preview">
        ${parentCards}
        <div class="publish-chart-card" style="left:300px;top:300px;border-color:rgba(98,217,154,.8)"><strong>${escapeHtml(person.names?.display || 'Unknown')}</strong><span>Focus person</span></div>
        <div class="publish-chip" style="position:absolute;left:24px;bottom:24px">Page 1 - Fit to printable area</div>
      </div>`;
}

function renderPublishPackagePreview()
{
    const projectId = currentProjectId();
    const peopleCount = getPeople(projectId).length;
    const sourceCount = (sampleData.sources || []).filter(source => source.projectId === projectId).length;
    const noteCount = getProjectNotes(projectId, { includeArchived: true }).length;
    const photoCount = getProjectPhotos(projectId).length;
    const fileCount = (sampleData.archiveFiles || []).filter(file => file.projectId === projectId).length;
    const rows = [
        ['People', `${peopleCount} records`],
        ['Sources', `${sourceCount} source records`],
        ['Notes', state.publishSettings.includeNotes ? `${noteCount} included` : 'Excluded'],
        ['Photos', state.publishSettings.includePhotos ? `${photoCount} included` : 'Excluded'],
        ['Archive files', state.publishSettings.includeArchiveRefs ? `${fileCount} references` : 'Excluded'],
        ['Living people', state.publishSettings.includeLivingPeople ? 'Included' : 'Hidden'],
        ['Private notes', state.publishSettings.includePrivateNotes ? 'Included' : 'Excluded'],
        ['Format', state.publishFormat]
    ];
    return `<div class="publish-package-preview">${rows.map(([k,v]) => `<div class="publish-package-row"><span>${escapeHtml(k)}</span><span>${escapeHtml(v)}</span></div>`).join('')}</div>`;
}

function bindPublishWizardEvents()
{
    main.querySelector('#publishBackHome')?.addEventListener('click', () =>
    {
        state.publishView = 'home'; renderPublish();
    });
    main.querySelectorAll('[data-publish-step]').forEach(button => button.addEventListener('click', () =>
    {
        state.publishWizardStep = button.dataset.publishStep; renderPublishWizard();
    }));
    main.querySelectorAll('[data-publish-type]').forEach(button => button.addEventListener('click', () =>
    {
        state.publishOutputType = button.dataset.publishType; state.publishScopeMode = defaultPublishScope(); state.publishFormat = defaultPublishFormat(); renderPublishWizard();
    }));
    main.querySelectorAll('[data-publish-scope]').forEach(button => button.addEventListener('click', () =>
    {
        state.publishScopeMode = button.dataset.publishScope; renderPublishWizard();
    }));
    main.querySelector('#publishFocusPerson')?.addEventListener('change', event =>
    {
        state.publishFocusPersonId = event.target.value;
        renderPublishWizard();
    });
    main.querySelector('#publishGenerations')?.addEventListener('change', e =>
    {
        state.publishGenerations = Number(e.target.value); renderPublishWizard();
    });
    main.querySelector('#publishFormat')?.addEventListener('change', e =>
    {
        state.publishFormat = e.target.value; renderPublishWizard();
    });
    main.querySelectorAll('[data-publish-setting]').forEach(input => input.addEventListener('change', () =>
    {
        state.publishSettings[input.dataset.publishSetting] = input.checked; renderPublishWizard();
    }));
    main.querySelector('#publishStepBack')?.addEventListener('click', () => movePublishStep(-1));
    main.querySelector('#publishStepNext')?.addEventListener('click', () => movePublishStep(1));
    main.querySelector('#publishSaveDraft')?.addEventListener('click', () => savePublishDraft(false));
}

function movePublishStep(delta)
{
    const steps = publishSteps().map(s => s.id);
    const idx = steps.indexOf(state.publishWizardStep);
    if (delta > 0 && state.publishWizardStep === 'preview')
    {
        savePublishDraft(true);
        return;
    }
    const next = Math.max(0, Math.min(steps.length - 1, idx + delta));
    state.publishWizardStep = steps[next];
    renderPublishWizard();
}

function savePublishDraft(exported)
{
    const type = publishTypes.find(t => t.id === state.publishOutputType) || publishTypes[0];
    const projectId = requireActiveProjectId();
    const focusPerson = publishFocusPerson();
    if (!projectId || (publishTypeNeedsPeople(type.id) && !focusPerson)) return;
    const focusName = focusPerson?.names?.display || currentProject()?.name || 'Project';
    const draft = {
        id: `pub-${Date.now()}`,
        projectId,
        focusPersonId: focusPerson?.id || null,
        title: `${focusName.split(' ')[0]} ${type.label.toLowerCase()} ${exported ? 'export' : 'draft'}`,
        type: state.publishOutputType,
        scope: publishScopeLabel(),
        updated: 'Just now',
        privacy: state.publishSettings.includeLivingPeople ? 'Needs review' : 'Living hidden',
        sources: state.publishSettings.includeSources ? 'Sources included' : 'Sources excluded',
        format: state.publishFormat,
        status: exported ? 'exported' : 'draft',
        preview: state.publishOutputType === 'chart' ? 'chart' : state.publishOutputType === 'export' ? 'index' : 'report',
        details: state.publishOutputType === 'chart' ? ['A3 layout', '4 generations', 'Printable'] : state.publishOutputType === 'export' ? ['GEDCOM package', 'Sources included', 'Media refs'] : ['18 pages', 'Sources included', 'Privacy checked']
    };
    sampleData.publishDrafts.unshift(draft);
    state.publishSelectedDraftId = draft.id;
    state.publishSide = exported ? 'recent' : 'drafts';
    state.publishView = 'home';
    renderPublish();
    showToast(exported ? `${type.title} export simulated.` : 'Draft saved.');
}

function openPublishWizard(type = 'report', draftId = null)
{
    const draft = draftId ? getPublishDraft(draftId) : null;
    if (publishTypeNeedsPeople(draft?.type || type) && !publishProjectPeople().length)
    {
        showToast('Add people before creating person-based publications.');
        return;
    }
    state.publishView = 'wizard';
    state.publishOutputType = draft?.type || type;
    state.publishFocusPersonId = draft?.focusPersonId || publishFocusPerson()?.id || '';
    state.publishScopeMode = defaultPublishScope();
    state.publishFormat = draft?.format || defaultPublishFormat();
    state.publishWizardStep = 'type';
    state.publishSelectedDraftId = draftId;
    renderPublish();
}

function openPublishDraftMenu(draftId, anchor)
{
    closeMenu();
    const draft = getPublishDraft(draftId);
    if (!draft) return;
    const rect = anchor.getBoundingClientRect();
    const menu = document.createElement('div');
    menu.className = 'menu-popover';
    menu.id = 'projectMenu';
    menu.style.top = `${rect.bottom + 6}px`;
    menu.style.left = `${Math.max(12, rect.right - 190)}px`;
    menu.innerHTML = `<button type="button" data-action="continue">${draft.status === 'exported' ? 'View summary' : 'Continue draft'}</button><button type="button" data-action="duplicate">Duplicate</button><button type="button" class="danger" data-action="delete">Delete</button>`;
    document.body.appendChild(menu);
    menu.addEventListener('click', e =>
    {
        const action = e.target.closest('[data-action]')?.dataset.action;
        if (action === 'continue') openPublishWizard(draft.type, draft.id);
        if (action === 'duplicate')
        {
            sampleData.publishDrafts.unshift({ ...draft, id: `pub-${Date.now()}`, projectId: currentProjectId(), title: `${draft.title} copy`, updated: 'Just now', status: 'draft' });
            renderPublishHome();
            showToast('Draft duplicated.');
        }
        if (action === 'delete') openDeletePublishDraftModal(draft.id);
        closeMenu();
    });
    bindMenuLifecycle(anchor);
}

function openDeletePublishDraftModal(draftId)
{
    const draft = getPublishDraft(draftId);
    if (!draft) return;
    openModal(`<div class="modal" role="dialog" aria-modal="true" aria-labelledby="deletePublishDraftTitle"><div class="modal-header"><div><h2 id="deletePublishDraftTitle">Delete output?</h2><p>This removes the draft or exported summary from the Publish list. No real files are affected in this prototype.</p></div><button class="close-button" type="button" data-close>${icon.close}</button></div><div class="modal-body"><div class="notes-evidence-card"><strong>${escapeHtml(draft.title)}</strong><span>${escapeHtml(draft.scope)}</span></div></div><div class="modal-footer"><button class="button secondary" type="button" data-close>Cancel</button><button class="button danger" type="button" id="publishConfirmDeleteDraft">Delete output</button></div></div>`);
    modalBackdrop.querySelector('#publishConfirmDeleteDraft')?.addEventListener('click', () =>
    {
        const idx = sampleData.publishDrafts.findIndex(d => d.id === draftId && d.projectId === currentProjectId());
        if (idx >= 0) sampleData.publishDrafts.splice(idx, 1);
        closeModal();
        renderPublish();
        showToast('Output deleted.');
    });
}

function filteredPublishDrafts()
{
    let list = getProjectPublishDrafts();
    if (state.publishSide === 'drafts') list = list.filter(d => d.status === 'draft');
    if (state.publishSide === 'reports') list = list.filter(d => d.type === 'report');
    if (state.publishSide === 'charts') list = list.filter(d => d.type === 'chart');
    if (state.publishSide === 'exports') list = list.filter(d => d.type === 'export');
    if (state.publishSide === 'recent') list = list.filter(d => d.status === 'exported');
    const q = state.publishSearch.trim().toLowerCase();
    if (q) list = list.filter(d => `${d.title} ${d.scope} ${d.type} ${d.format} ${d.privacy}`.toLowerCase().includes(q));
    return list;
}

function publishSideTitle()
{
    const map = { drafts: 'Drafts', reports: 'Reports', charts: 'Charts', exports: 'Data exports', recent: 'Recently exported' };
    return map[state.publishSide] || 'Drafts';
}

function publishSteps()
{
    return [{ id: 'type', label: 'Type' }, { id: 'scope', label: 'Scope' }, { id: 'settings', label: 'Settings' }, { id: 'preview', label: 'Preview' }];
}

function publishStepTitle()
{
    const map = { type: 'Choose output type', scope: 'Choose scope', settings: 'Content and privacy settings', preview: 'Preview and export' };
    return map[state.publishWizardStep] || 'Publish';
}

function publishStepCopy()
{
    const map = {
        type: 'Select the kind of output you want to create.',
        scope: 'Define who or what this output should include.',
        settings: 'Choose the content, source, and privacy options.',
        preview: 'Review warnings and the simulated output before exporting.'
    };
    return map[state.publishWizardStep] || '';
}

function publishScopeLabel()
{
    const mode = state.publishScopeMode.replaceAll('-', ' ');
    const focusName = publishFocusPerson()?.names?.display || currentProject()?.name || 'Project';
    return `${capitalize(mode)} - ${focusName} - ${state.publishGenerations} generations`;
}

function defaultPublishFormat()
{
    if (state.publishOutputType === 'chart') return 'PDF';
    if (state.publishOutputType === 'export') return 'GEDCOM';
    return 'PDF';
}

function defaultPublishScope()
{
    if (state.publishOutputType === 'chart') return 'ancestor';
    if (state.publishOutputType === 'export') return 'project';
    return 'person';
}

function publishIcon(kind)
{
    if (kind === 'report' || kind === 'draft') return icon.file;
    if (kind === 'chart') return icon.tree;
    if (kind === 'export') return icon.export;
    if (kind === 'shield') return icon.check;
    return icon.placeholder;
}

