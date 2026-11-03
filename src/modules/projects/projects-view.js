function renderStartup()
{
    const projects = filteredProjects();
    const totalProjects = sampleData.projects.length;
    const searchQuery = state.search.trim();
    const continuation = resolveProjectContinuation();
    sidebar.innerHTML = `
        <div class="logo-lockup">
          <div class="large-logo">${icon.logo}</div>
          <div class="logo-text">
            <strong data-i18n-skip>GeneoGraph</strong>
            <span>Family history workspace</span>
          </div>
        </div>
        <div class="button-stack">
          <button class="button primary full" type="button" id="createProject">${icon.plus} Create family tree</button>
          <button class="button secondary full project-file-unavailable" type="button" id="importGedcom" disabled title="${escapeHtml(t('File import is unavailable in this prototype.'))}">${icon.import} Import GEDCOM</button>
          <button class="button secondary full project-file-unavailable" type="button" disabled title="${escapeHtml(t('File import is unavailable in this prototype.'))}">${icon.folder} Open project</button>
        </div>
        <div class="sidebar-spacer"></div>
        <div class="tip-card">
          <div class="tip-title">${icon.tip} Tip of the day</div>
          <p>${escapeHtml(t('Start a project to keep your family history and research together.'))}</p>
          <button class="link tip-link" type="button" data-toast="Learning center is outside this prototype.">
            <span class="tip-link-text">Learn more</span>
            <span class="tip-link-icon" aria-hidden="true">${icon.openlink}</span>
          </button>
        </div>
      `;
    sidebar.querySelector('#createProject').addEventListener('click', openCreateModal);
    bindToasts(sidebar);

    main.innerHTML = `
        <div class="page-grid startup-page">
          <section class="main-column">
            <div class="header-row">
              <div class="title"><h1 class="app-page-title">${escapeHtml(t('Welcome back!'))}</h1><p>${escapeHtml(t('Here you can create, open, and manage your family-history projects.'))}</p></div>
            </div>
            <div class="toolbar">
              <div class="toolbar-left">
                <label class="app-search-field" aria-label="Search projects">${icon.search}<input id="projectSearch" type="search" placeholder="Search projects..." value="${escapeHtml(state.search)}"></label>
              </div>
              <div class="toolbar-right">
                ${renderAppSortControl({
                    id: 'sortProjects',
                    field: state.sort,
                    direction: state.sortDirection,
                    ariaLabel: 'Sort projects',
                    options: APP_SORT_OPTIONS.projects,
                    className: 'projects-sort-field'
                })}
                <button class="toolbar-button ${state.viewMode === 'grid' ? 'active' : ''}" type="button" data-view="grid" aria-label="Grid view" aria-pressed="${state.viewMode === 'grid'}">${icon.grid}</button>
                <button class="toolbar-button ${state.viewMode === 'list' ? 'active' : ''}" type="button" data-view="list" aria-label="List view" aria-pressed="${state.viewMode === 'list'}">${icon.list}</button>
              </div>
            </div>
            ${renderStartupProjectsHeading(
                projects.length,
                totalProjects,
                Boolean(searchQuery)
            )}

            ${projects.length
                ? renderProjectCollection(
                    projects
                )
                : renderStartupProjectEmpty(
                    searchQuery,
                    totalProjects
                )}
          </section>
          <aside class="right-column">
            ${continuation ? renderStartupContinuation(continuation) : ''}
            ${renderStartupRecentActivityCard()}
            ${renderOfflineProjectsCard()}
          </aside>
        </div>
      `;
    bindProjectControls();
    bindStartupRightColumn();
    localizeUI(
        sidebar,
        {
            suppressObserverReplay: true
        }
    );

    localizeUI(
        main,
        {
            suppressObserverReplay: true
        }
    );
}

function renderStartupContinuation(context)
{
    return `<section class="startup-continue" aria-label="Continue where you left off">
        <span class="startup-continue-icon" aria-hidden="true">${context.icon}</span>
        <div class="startup-continue-copy">
          <span class="startup-continue-eyebrow">${escapeHtml(t('Continue where you left off'))}</span>
          <strong>${escapeHtml(context.project.name)}</strong>
          <span class="startup-continue-context">${escapeHtml(t(context.module))} · ${escapeHtml(formatContinuationOpenedAt(context.openedAt))}</span>
        </div>
        <button class="startup-continue-action" type="button" data-continue-project="${escapeHtml(context.project.id)}" data-continue-module="${escapeHtml(context.module)}">
          <span>${escapeHtml(t('Continue'))}</span>${icon.chevron}
        </button>
      </section>`;
}

function renderStartupProjectsHeading(visibleCount, totalCount, searchActive)
{
    const title = searchActive ? t('Search results') : t('All projects');
    const count = searchActive
        ? `${visibleCount} of ${formatProjectCount(totalCount)}`
        : formatProjectCount(totalCount);
    return `<div class="startup-projects-heading">
        <h2>${escapeHtml(title)}</h2>
        <span class="startup-projects-count">${escapeHtml(count)}</span>
      </div>`;
}

function renderStartupProjectEmpty(searchQuery, totalProjects)
{
    if (!totalProjects)
    {
        return `
          <section
            class="
              startup-project-empty
              is-library-empty">

            <div class="startup-project-empty-copy">

              <div class="startup-project-empty-title">

                <span class="startup-project-empty-title-icon"
                  aria-hidden="true">
                  ${icon.folder}
                </span>

                <h3>
                  ${escapeHtml(
                        t('No projects yet')
                    )}
                </h3>
              </div>

              <p>
                ${escapeHtml(
                    t(
                        'Create a project'
                    )
                )}
                <br>
                ${escapeHtml(
                    t(
                        'to begin your family-history workspace.'
                    )
                )}
              </p>

              <div class="startup-project-empty-actions">

                <button
                  class="button primary"
                  type="button"
                  data-startup-empty-create>
                  ${icon.plus}
                  ${escapeHtml(
                        t('Create family tree')
                    )}
                </button>

                <button
                  class="button secondary"
                  type="button"
                  data-startup-empty-import disabled title="${escapeHtml(t('File import is unavailable in this prototype.'))}">
                  ${icon.import}
                  ${escapeHtml(
                        t('Import GEDCOM')
                    )}
                </button>
              </div>
            </div>
          </section>
        `;
    }
    return `<section class="startup-project-empty">
        <div class="startup-project-empty-copy">
          <span class="startup-project-empty-icon" aria-hidden="true">${icon.search}</span>
          <h3>${escapeHtml(t('No projects match'))} “${escapeHtml(searchQuery)}”</h3>
          <p>${escapeHtml(t('Try another project name or clear the search.'))}</p>
          <div class="startup-project-empty-actions">
            <button class="button secondary" type="button" data-clear-project-search>Clear search</button>
          </div>
        </div>
      </section>`;
}

function openProjectNameOverlay(
    anchor,
    project
)
{
    closeProjectNameOverlay();

    const sourceProjectName =
        project.name.replace(
            'Tree',
            'History'
        );

    const rect =
        anchor.getBoundingClientRect();

    const popover =
        document.createElement(
            'div'
        );

    popover.className =
        'project-name-popover';

    popover.id =
        'projectNamePopover';

    popover.style.top =
        `${
            Math.min(
                window.innerHeight
              - 230,
                rect.bottom + 8
            )
        }px`;

    popover.style.left =
        `${
            Math.min(
                window.innerWidth
              - 356,
                Math.max(
                    16,
                    rect.left - 12
                )
            )
        }px`;

    popover.innerHTML = `
        <h3>Edit project name</h3>

        <label>
          Project name

          <input
            id="projectNameInput"
            value="${escapeHtml(
                localizedDataFieldValue(
                    sourceProjectName
                )
            )}"
            autocomplete="off">
        </label>

        <div
          class="
            project-name-popover-actions
          ">
          <button
            class="button secondary"
            type="button"
            data-project-name-cancel>
            Cancel
          </button>

          <button
            class="button primary"
            type="button"
            data-project-name-save>
            Save
          </button>
        </div>
      `;

    document.body.appendChild(
        popover
    );

    /*
      * Localize synchronously rather than waiting for
      * MutationObserver.
      */
    localizeUI(popover);

    const input =
        popover.querySelector(
            '#projectNameInput'
        );

    input.focus();
    input.select();

    const save = () =>
    {
        const value =
            collectLocalizedDataFieldValue(
                input,
                sourceProjectName
            ).trim();

        if (!value)
        {
            showToast(
                'Project name cannot be empty.'
            );

            return;
        }

        updateProjectName(
            project.id,
            value
        );

        closeProjectNameOverlay();
        renderOpenProject();

        showToast(
            'Project name updated.'
        );
    };

    popover
        .querySelector(
            '[data-project-name-save]'
        )
        .addEventListener(
            'click',
            save
        );

    popover
        .querySelector(
            '[data-project-name-cancel]'
        )
        .addEventListener(
            'click',
            closeProjectNameOverlay
        );

    input.addEventListener(
        'keydown',
        event =>
        {
            if (
                event.key === 'Enter'
            )
            {
                event.preventDefault();
                save();
            }

            if (
                event.key === 'Escape'
            )
            {
                event.preventDefault();
                closeProjectNameOverlay();
            }
        }
    );

    setTimeout(
        () =>
            document.addEventListener(
                'click',
                closeProjectNameOverlayOnOutside
            ),
        0
    );
}

function closeProjectNameOverlayOnOutside(event)
{
    if (!event.target.closest('#projectNamePopover') && !event.target.closest('#editProjectTitle')) closeProjectNameOverlay();
}

function closeProjectNameOverlay()
{
    document.getElementById('projectNamePopover')?.remove();
    document.removeEventListener('click', closeProjectNameOverlayOnOutside);
}

function renderOpenProject()
{
    appNavigationObserve();
    const project = currentProject();
    if (!project)
    {
        state.projectOpen = false;
        state.currentProjectId = null;
        renderStartup();
        return;
    }
    const projectTitle = project.name;

    const projectPhotoCount =
        getProjectPhotos(
            project.id
        ).length;

    const projectFileCount =
        connectedFilesForProject(
            project.id
        ).length;

    const projectNoteCount =
        getProjectNotes(
            project.id
        ).length;
    const projectPlaceCount =
        projectPlaces(
            project.id
        ).length;
    const projectSourceCount =
        (sampleData.sources || [])
            .filter(source => source.projectId === project.id)
            .length;
    sidebar.innerHTML = `
        <div class="logo-lockup">
          <div class="large-logo">${icon.logo}</div>
          <div class="logo-text">
            <strong data-i18n-skip>GeneoGraph</strong>
            <span>Family history workspace</span>
          </div>
        </div>
        <nav class="project-library-nav" aria-label="${escapeHtml(t('Navigation'))}">
          <div class="side-section-title">Navigation</div>
          <div class="side-nav">
            <button class="side-link" type="button" id="backToProjects">${icon.arrow}<span>All projects</span></button>
          </div>
        </nav>
        <div>
          <div class="side-section-title">Project</div>
          <div class="side-nav">
            <button class="side-link ${state.openSide === 'overview' ? 'active' : ''}" type="button" data-open-side="overview">${icon.home}<span>Project overview</span></button>
            <button class="side-link ${state.openSide === 'activity' ? 'active' : ''}" type="button" data-open-side="activity">${icon.clock}<span>Recent activity</span></button>
            <button class="side-link ${state.openSide === 'settings' ? 'active' : ''}" type="button" data-open-side="settings">${icon.settings}<span>Project settings</span></button>
          </div>
        </div>
        <div class="sidebar-spacer"></div>
      `;
    sidebar.querySelector('#backToProjects').addEventListener('click', () =>
    {
        runAfterProjectSettingsGuard(() =>
        {
            state.projectOpen = false; state.currentProjectId = null; state.activeModule = 'Projects'; render();
        });
    });
    sidebar.querySelectorAll('[data-open-side]').forEach(button => button.addEventListener('click', () =>
    {
        if (button.dataset.openSide === state.openSide) return;
        runAfterProjectSettingsGuard(() =>
        {
            state.openSide = button.dataset.openSide;
            persistProjectContinuation({ projectId: project.id, module: 'Projects', openedAt: new Date().toISOString() });
            renderOpenProject();
        });
    }));

    if (state.openSide === 'settings')
    {
        main.innerHTML = `<div class="project-settings-view">${renderProjectSettings(project)}</div>`;
        bindProjectSettingsControls();
        bindToasts(main);
        return;
    }

    projectSettingsDraft = null;

    main.innerHTML = state.openSide === 'settings' ? `
        <div class="page-grid open-project-page project-settings-page-grid">
          <section class="main-column project-settings-main">
            ${renderOpenProjectBody()}
          </section>
        </div>
      ` : `
        <div class="page-grid open-project-page project-wide-hero-page">
          <section class="main-column">
            <div class="project-hero${projectCoverImageSource(project) ? ' has-photo-cover' : ''}"
              ${projectCoverImageSource(project) ? `style="${projectHeroCoverStyleAttribute(project)}"` : ''}>
              <div class="project-hero-layout">
                <div class="hero-content">
                  <div class="project-title-row-open">
                    <h1>${escapeHtml(projectTitle)}</h1>
                    <button class="project-title-edit" type="button" id="editProjectTitle" aria-label="Edit project name">${icon.edit}</button>
                  </div>
                  <div class="meta-row project-hero-meta">
                    <span><span class="project-hero-meta-dot" aria-hidden="true"></span>${escapeHtml(project.status)}</span>
                    <span><span class="project-hero-meta-dot" aria-hidden="true"></span>${escapeHtml(formatProjectCreated(project))}</span>
                    <span><span class="project-hero-meta-dot" aria-hidden="true"></span>${escapeHtml(formatProjectModified(project, 'Last modified'))}</span>
                  </div>
                  <div class="project-desc">${escapeHtml(project.desc)}</div>
                  <div
                    class="
                      stat-chips
                      app-chip-row
                      app-chip-row--on-accent
                    ">
                    <button class="app-chip app-chip--people" type="button" data-open-project-module="People">
                      ${escapeHtml(
                            formatProjectPeopleCount(
                                project.id
                            )
                        )}
                    </button>

                    <button class="app-chip app-chip--photos" type="button" data-open-project-module="Albums">
                      ${projectPhotoCount}
                      ${projectPhotoCount === 1 ? 'photo' : 'photos'}
                    </button>

                    <button class="app-chip app-chip--files" type="button" data-open-project-module="Archive" data-open-project-archive-view="files">
                      ${projectFileCount}
                      ${projectFileCount === 1 ? 'file' : 'files'}
                    </button>

                    <button class="app-chip app-chip--notes" type="button" data-open-project-module="Notes">
                      ${projectNoteCount}
                      ${projectNoteCount === 1 ? 'note' : 'notes'}
                    </button>

                    <button class="app-chip app-chip--places" type="button" data-open-project-module="Places">
                      ${projectPlaceCount}
                      ${projectPlaceCount === 1 ? 'place' : 'places'}
                    </button>

                    <button class="app-chip app-chip--sources" type="button" data-open-project-module="Archive" data-open-project-archive-view="sources">
                      ${projectSourceCount}
                      ${projectSourceCount === 1 ? 'source' : 'sources'}
                    </button>
                  </div>
                </div>
                <div class="project-hero-actions" aria-label="Project actions">
                  <button class="project-hero-action-button" type="button" id="heroImportGedcom">${icon.import}<span>Import GEDCOM</span></button>
                  <button class="project-hero-action-button" type="button" data-toast="Export project options will be defined in the Publish module.">${icon.export}<span>Export project</span></button>
                  <button class="project-hero-action-button danger" type="button" id="deleteProject">${icon.trash}<span>Delete project</span></button>
                </div>
              </div>
            </div>
            ${renderOpenProjectBody()}
            ${state.openSide === 'overview' ? renderProjectGedcomDropzone() : ''}
          </section>
          <aside class="right-column">
            ${renderOpenProjectInsightsCard(project)}
            ${renderOpenProjectOfflineCard(project)}
          </aside>
        </div>
      `;
    document.getElementById('heroImportGedcom')?.addEventListener('click', openImportModal);
    document.getElementById('openDropzone')?.addEventListener('click', openImportModal);
    document.getElementById('deleteProject')?.addEventListener('click', () => openDeleteProjectConfirm(project.id));
    document.getElementById('editProjectTitle')?.addEventListener('click', event => openProjectNameOverlay(event.currentTarget, project));
    bindOpenProjectRightColumn();
    bindToasts(main);
    localizeUI(main, { suppressObserverReplay: true });
}

function renderOpenProjectBody()
{
    const project = currentProject();
    if (state.openSide === 'settings')
    {
        return renderProjectSettings(project);
    }
    if (state.openSide === 'activity')
    {
        return `<div class="panel activity-panel"><h2>Recent activity</h2><div class="panel-body">${renderActivityRows(8)}</div></div>`;
    }
    return `
        <div class="overview-grid">
          <div class="panel activity-panel"><h2>Recent activity</h2><div class="panel-body">${renderActivityRows(4)}
            <div class="project-activity-footer">
              <button class="link project-overview-link" type="button" data-open-side-main="activity">
                <span class="project-overview-link-text">View all</span>
                <span class="project-overview-link-icon" aria-hidden="true">${icon.openlink}</span>
              </button>
            </div>
            </div>
            </div>
          <div class="module-shortcuts">
            ${[
                ['Family Tree', icon.tree, 'Structured relationship canvas'],
                ['People', icon.people, 'Browse and clean records'],
                ['Albums', icon.image, 'Photos and albums'],
                ['Archive', icon.file, 'Files and sources']
            ].map(([label, svg, text]) => `<button class="shortcut-card" type="button" data-shortcut="${label}">${svg}<strong>${label}</strong><span>${text}</span></button>`).join('')}
          </div>
        </div>
      `;
}

function renderProjectGedcomDropzone()
{
    return `<div class="dropzone" id="openDropzone">${icon.import}<div><strong>Drop a GEDCOM file here to import</strong><span>Supports .ged files</span></div></div>`;
}

let projectSettingsDraft = null;

function getProjectSettingsDraft(project)
{
    if (!projectSettingsDraft || projectSettingsDraft.projectId !== project.id)
    {
        projectSettingsDraft = {
            projectId: project.id,
            name: localizedDataFieldValue(project.name),
            description: localizedDataFieldValue(project.desc),
            cover: resolvedProjectCoverStyle(project),
            coverSelection: {
                photoId: project.coverPhotoId || '',
                imageSrc: project.coverImageSrc || '',
                position: normalizeProjectCoverPosition(project.coverPosition)
            }
        };
    }
    return projectSettingsDraft;
}

function projectSettingsCoverSource(draft)
{
    if (!draft) return '';
    if (draft.cover === 'golden-tree') return GOLDEN_TREE_COVER_SRC;
    if (draft.cover !== 'photo') return '';
    return draft.coverSelection.uploadDraft?.src
        || (draft.coverSelection.photoId
            ? getPhoto(draft.coverSelection.photoId, { projectId: draft.projectId })?.src
            : '')
        || draft.coverSelection.imageSrc || '';
}

function captureProjectSettingsFields()
{
    if (!projectSettingsDraft) return;
    projectSettingsDraft.name = main.querySelector('#settingsProjectName')?.value ?? projectSettingsDraft.name;
    projectSettingsDraft.description = main.querySelector('#settingsProjectDescription')?.value ?? projectSettingsDraft.description;
}

function projectSettingsHasUnsavedChanges()
{
    if (!state.projectOpen || state.activeModule !== 'Projects' || state.openSide !== 'settings' || !projectSettingsDraft) return false;
    const project = currentProject();
    if (!project || project.id !== projectSettingsDraft.projectId) return false;
    captureProjectSettingsFields();
    const draft = projectSettingsDraft;
    const savedPosition = normalizeProjectCoverPosition(project.coverPosition);
    const draftPosition = normalizeProjectCoverPosition(draft.coverSelection.position);
    return draft.name !== localizedDataFieldValue(project.name)
        || draft.description !== localizedDataFieldValue(project.desc)
        || draft.cover !== resolvedProjectCoverStyle(project)
        || (draft.cover === 'photo' && (draft.coverSelection.photoId || '') !== (project.coverPhotoId || ''))
        || (draft.cover === 'photo' && (draft.coverSelection.imageSrc || '') !== (project.coverImageSrc || ''))
        || (draft.cover === 'photo' && Boolean(draft.coverSelection.uploadDraft))
        || draftPosition.x !== savedPosition.x
        || draftPosition.y !== savedPosition.y;
}

function projectSettingsBeforeUnload(event)
{
    if (!projectSettingsHasUnsavedChanges()) return;
    event.preventDefault();
    event.returnValue = '';
}

function updateProjectSettingsDirtyState()
{
    const dirty = projectSettingsHasUnsavedChanges();
    const actions = main.querySelector('.project-settings-page-actions');
    if (actions) actions.hidden = !dirty;
    window.removeEventListener('beforeunload', projectSettingsBeforeUnload);
    if (dirty) window.addEventListener('beforeunload', projectSettingsBeforeUnload);
}

function runAfterProjectSettingsGuard(commit)
{
    if (!projectSettingsHasUnsavedChanges())
    {
        projectSettingsDraft = null;
        updateProjectSettingsDirtyState();
        commit();
        return;
    }
    openModal(`<div class="modal project-settings-discard-modal" role="dialog" aria-modal="true" aria-labelledby="projectSettingsDiscardTitle">
        <div class="modal-header"><h2 id="projectSettingsDiscardTitle">${escapeHtml(t('Unsaved project settings'))}</h2></div>
        <div class="modal-body"><p>${escapeHtml(t('Save your project settings before leaving?'))}</p></div>
        <div class="modal-footer">
          <button class="button secondary" type="button" data-close>${escapeHtml(t('Keep editing'))}</button>
          <button class="button danger" type="button" data-project-settings-discard>${escapeHtml(t('Discard and leave'))}</button>
          <button class="button primary" type="button" data-project-settings-save-leave>${escapeHtml(t('Save and leave'))}</button>
        </div></div>`);
    modalBackdrop.querySelector('[data-project-settings-discard]')?.addEventListener('click', () =>
    {
        closeModal({ force: true });
        projectSettingsDraft = null;
        updateProjectSettingsDirtyState();
        commit();
    });
    modalBackdrop.querySelector('[data-project-settings-save-leave]')?.addEventListener('click', () =>
    {
        closeModal({ force: true });
        if (saveProjectSettings()) commit();
    });
    modalBackdrop.querySelector('[data-close]')?.focus();
}

function renderProjectSettings(project)
{
    const draft = getProjectSettingsDraft(project);
    const title = project.name;

    const localizedTitle = draft.name;

    const localizedDescription = draft.description;
    const coverStyle = draft.cover;

    const safeFileTitle =
        title
            .replace(
                /[^a-zA-Z0-9\s-]/g,
                ''
            )
            .trim()
            .replace(
                /\s+/g,
                ' '
            );

    const projectPath =
        project.projectPath
        || `C:\\Users\\Username\\Documents\\GeneoGraph\\${
            safeFileTitle || 'Family History'
        }.ggproj`;

    const lastBackup =
        project.lastBackupAt
            ? formatProjectDate(
                project.lastBackupAt
            )
            : t('Not created yet');

    const coverStyleAttr =
        projectCoverStyleAttribute(
            coverStyle,
            projectSettingsCoverSource(draft),
            draft.coverSelection.position
        );
    return `<div class="project-settings-page">
        <div class="project-settings-section-one">
          <section class="project-settings-section project-settings-card project-settings-identity-card">
            <h3>Project identity</h3>
            <div class="project-settings-section-body project-settings-identity-body">
              <div class="project-settings-form project-settings-identity-form">
                <div class="project-settings-field"><label for="settingsProjectName">Project name</label>
                <input
                  id="settingsProjectName"
                  value="${escapeHtml(
                        localizedTitle
                    )}">
                  </div>
                <div class="project-settings-field project-settings-description-field"><label for="settingsProjectDescription">Project description</label>
                <textarea
                  id="settingsProjectDescription">${escapeHtml(
                        localizedDescription
                    )}</textarea>
                  </div>
              </div>
            </div>
          </section>
          <section class="project-settings-section project-settings-card project-settings-cover-card">
            <h3>Cover image</h3>
            <div class="project-settings-section-body">
              <div class="project-cover-preview ${coverStyle === 'tree' ? 'tree' : ''}" id="projectCoverPreview" style="${coverStyleAttr}" role="group" aria-label="Drag to position cover; use arrow keys to adjust"></div>
              <button class="project-cover-reset" type="button" id="projectCoverReset" hidden>Reset position</button>
              <div class="project-cover-options" role="group" aria-label="Cover style">
                <button class="project-cover-option ${coverStyle === 'paper' ? 'active' : ''}" type="button" data-cover-style="paper">Archival paper</button>
                <button class="project-cover-option ${coverStyle === 'tree' ? 'active' : ''}" type="button" data-cover-style="tree">Full tree</button>
                <button class="project-cover-option ${coverStyle === 'golden-tree' ? 'active' : ''}" type="button" data-cover-style="golden-tree">Family tree</button>
                <button class="project-cover-option ${coverStyle === 'photo' ? 'active' : ''}" type="button" data-cover-photo>Photo</button>
              </div>
            </div>
          </section>
        </div>
        <section class="project-settings-section project-settings-full-card">
          <h3>Project location</h3>
          <div class="project-settings-section-body project-location-body">
            <div class="project-location-summary">
              <span class="project-location-status">Sample project</span>
              <span class="project-location-muted">Cloud backup disabled</span>
            </div>
            <div
              class="project-location-path"
              data-i18n-skip
              title="${escapeHtml(
                    projectPath
                )}">
              ${escapeHtml(
                    projectPath
                )}
            </div>
            <div class="project-location-meta">
              <div class="project-settings-kv"><span>Last local backup</span><span>${escapeHtml(lastBackup)}</span></div>
              <div class="project-settings-kv"><span>Cloud backup</span><span>Disabled</span></div>
            </div>
            <div class="project-location-actions">
              <button class="button secondary project-settings-unavailable" type="button" id="viewProjectFolder">${icon.folder} View in folder</button>
              <button class="button secondary" type="button" id="moveProjectLocation">${icon.movefolder} Move project</button>
              <button class="button secondary project-settings-unavailable" type="button" id="createProjectBackup">${icon.file} Create local backup</button>
              <button class="button secondary project-settings-unavailable" type="button" id="enableProjectSync">${icon.sync} Sync now</button>
            </div>
          </div>
        </section>
        <section class="project-settings-section project-settings-full-card">
          <div class="project-settings-section-heading"><h3>Data and privacy</h3><span class="project-settings-coming-later">Coming later</span></div>
          <div class="project-settings-section-body">
            <div class="project-privacy-grid">
              <div class="project-settings-field project-settings-select-field">
                <label for="settingsLivingProtection">Living-person protection</label>
                <select id="settingsLivingProtection" disabled>
                  <option selected>On</option>
                  <option>Off</option>
                </select>
                <span class="project-settings-select-chevron" aria-hidden="true">${icon.chevron}</span>
              </div>

              <div class="project-settings-field project-settings-select-field">
                <label for="settingsPublishLiving">Publish living people</label>
                <select id="settingsPublishLiving" disabled>
                  <option selected>Hide by default</option>
                  <option>Anonymize names</option>
                  <option>Include with warning</option>
                </select>
                <span class="project-settings-select-chevron" aria-hidden="true">${icon.chevron}</span>
              </div>

              <div class="project-settings-field project-settings-select-field">
                <label for="settingsPrivateNotes">Private notes in exports</label>
                <select id="settingsPrivateNotes" disabled>
                  <option selected>Exclude by default</option>
                  <option>Include with warning</option>
                </select>
                <span class="project-settings-select-chevron" aria-hidden="true">${icon.chevron}</span>
              </div>

              <div class="project-settings-field project-settings-select-field">
                <label for="settingsDateFormat">Date format</label>
                <select id="settingsDateFormat" disabled>
                  <option selected>
                    DD MMM YYYY
                  </option>
                  <option>
                    DD.MM.YYYY
                  </option>
                  <option>
                    YYYY-MM-DD
                  </option>
                </select>
                <span class="project-settings-select-chevron" aria-hidden="true">${icon.chevron}</span>
              </div>
            </div>
          </div>
        </section>
        <div class="project-settings-actions project-settings-page-actions" hidden><button class="button secondary" type="button" id="resetProjectSettings">Reset changes</button><button class="button primary" type="button" id="saveProjectSettings">Save changes</button></div>
      </div>`;
}


function bindProjectSettingsControls()
{
    if (state.openSide !== 'settings') return;
    main.querySelector('#saveProjectSettings')?.addEventListener('click', saveProjectSettings);
    main.querySelector('#resetProjectSettings')?.addEventListener('click', () => { projectSettingsDraft = null; updateProjectSettingsDirtyState(); renderOpenProject(); });
    main.querySelectorAll('#settingsProjectName, #settingsProjectDescription').forEach(control =>
        control.addEventListener('input', updateProjectSettingsDirtyState));
    updateProjectSettingsDirtyState();
    main.querySelector('#viewProjectFolder')?.addEventListener('click', () => showToast('Opening a project folder is not available yet.'));
    main.querySelector('#moveProjectLocation')?.addEventListener('click', openMoveProjectModal);
    main.querySelector('#createProjectBackup')?.addEventListener('click', () => showToast('Creating a local backup is not available yet.'));
    main.querySelector('#enableProjectSync')?.addEventListener('click', () => showToast('Cloud sync is not available yet.'));
    const coverPreview = main.querySelector('#projectCoverPreview');
    bindProjectCoverPositioner(coverPreview, {
        getSource: () => projectSettingsCoverSource(projectSettingsDraft),
        getPosition: () => projectSettingsDraft?.coverSelection?.position,
        onChange: position =>
        {
            if (!projectSettingsDraft || !coverPreview?.isConnected) return;
            projectSettingsDraft.coverSelection.position = position;
            updateProjectCoverPreview(coverPreview, projectSettingsDraft.cover, projectSettingsCoverSource(projectSettingsDraft), position);
            updateProjectSettingsDirtyState();
        },
        resetButton: main.querySelector('#projectCoverReset')
    });
    main.querySelectorAll('[data-cover-style]').forEach(button => button.addEventListener('click', () =>
    {
        captureProjectSettingsFields();
        projectSettingsDraft.cover = button.dataset.coverStyle;
        projectSettingsDraft.coverSelection.position = { x: 50, y: 50 };
        renderOpenProject();
    }));
    main.querySelector('[data-cover-photo]')?.addEventListener('click', () =>
        openProjectCoverPhotoPicker(currentProjectId(), {
            selection: projectSettingsDraft.coverSelection,
            onSelect: selection =>
            {
                captureProjectSettingsFields();
                projectSettingsDraft.cover = 'photo';
                projectSettingsDraft.coverSelection = selection;
                renderOpenProject();
            }
        }));
}


function saveProjectSettings()
{
    const project =
        currentProject();

    const sourceName =
        project.name.replace(
            'Tree',
            'History'
        );

    const nameControl =
        main.querySelector(
            '#settingsProjectName'
        );

    const descriptionControl =
        main.querySelector(
            '#settingsProjectDescription'
        );

    const name = cleanEditFieldValue(collectLocalizedDataFieldValue(nameControl, sourceName));

    const description =
        cleanEditFieldValue(
            collectLocalizedDataFieldValue(
                descriptionControl,
                project.desc
            )
        );

    if (!name)
    {
        showToast(
            'Project name cannot be empty.'
        );
        nameControl?.focus();
        return false;
    }

    const draft = projectSettingsDraft;
    if (draft.cover === 'photo')
    {
        if (!commitProjectCoverSelection(project.id, draft.coverSelection))
        {
            showToast('Choose a cover photo before saving.');
            main.querySelector('[data-cover-photo]')?.focus();
            return false;
        }
    }
    else setProjectCover(project.id, draft.cover, { position: draft.coverSelection.position });

    updateProjectName(
        project.id,
        name
    );

    project.desc = description;

    projectSettingsDraft = null;
    updateProjectSettingsDirtyState();
    renderOpenProject();

    showToast(
        'Project settings saved.'
    );
    return true;
}

function openMoveProjectModal()
{
    const project = currentProject();
    if (!project) return;
    const title = project.name;
    const safeTitle = title.replace(/[^a-zA-Z0-9\s-]/g, '').trim().replace(/\s+/g, ' ') || 'Family History';
    const currentPath = project.projectPath || `C:\\Users\\Username\\Documents\\GeneoGraph\\${safeTitle}.ggproj`;
    openModal(`<div class="modal" role="dialog" aria-modal="true" aria-labelledby="moveProjectTitle">
        <div class="modal-header"><div><h2 id="moveProjectTitle">Move project</h2><p>Project files cannot be moved in this demo. The path below is an example only.</p></div><button class="close-button" type="button" data-close>${icon.close}</button></div>
        <div class="modal-body form-grid">
          <div class="field"><label>Current location</label><input value="${escapeHtml(currentPath)}" disabled></div>
          <div class="field"><label for="newProjectLocation">New location</label><input id="newProjectLocation" value="C:\\Users\\Username\\Documents\\GeneoGraph\\Moved projects\\${escapeHtml(safeTitle)}.ggproj" disabled></div>
          <div class="project-location-note">Moving a project would relocate the local project package and keep existing people, sources, photos, archive files, notes, boards, and settings together.</div>
        </div>
        <div class="modal-footer"><button class="button secondary" type="button" data-close>Cancel</button><button class="button primary" type="button" id="confirmMoveProject" disabled>Move project</button></div>
      </div>`);
}


function renderStartupCreateTile()
{
    return `
        <div class="library-create-tile" data-project-create-tile>
          <button class="library-create-primary" type="button" data-startup-create>
            <span class="library-create-icon" aria-hidden="true">${icon.plus}</span>
            <span class="library-create-copy"><strong>${escapeHtml(t('Create family tree'))}</strong><span>${escapeHtml(t('Your family history and research, together.'))}</span></span>
          </button>
          <div class="library-create-secondary">
            <button class="library-import-action" type="button" disabled title="${escapeHtml(t('File import is unavailable in this prototype.'))}">${icon.import}${escapeHtml(t('Choose file...'))}</button>
          </div>
        </div>
      `;
}

function renderProjectCollection(
    list
)
{
    const cls =
        state.viewMode === 'grid'
            ? 'project-grid'
            : 'project-list';

    return `
        <div class="${cls}">
          ${list
                .map(renderProjectCard)
                .join('')}

          ${renderStartupCreateTile()}
        </div>
      `;
}

function renderProjectCard(project)
{
    const coverStyle = resolvedProjectCoverStyle(project);

    const coverClass =
        coverStyle === 'tree'
            ? 'tree'
            : '';

    const coverStyleAttr =
        projectCoverStyleAttribute(
            coverStyle,
            projectCoverImageSource(project),
            project.coverPosition
        );
    const peopleCountLabel =
        formatProjectPeopleCount(
            project.id
        );
    return `
        <article class="project-card ${state.viewMode === 'list' ? 'list-card' : ''}" data-project-id="${escapeHtml(project.id)}">
          <div
            class="project-cover ${coverClass}"
            style="${coverStyleAttr}">
            <div class="project-cover-shade" aria-hidden="true"></div>
            <h3 class="project-cover-title">${escapeHtml(project.name)}</h3>
          </div>
          <button class="project-card-open-area" type="button" data-open="${escapeHtml(project.id)}" aria-label="Open ${escapeHtml(project.name)}" title="${escapeHtml(project.name)}"></button>
          <button class="project-more" type="button" data-menu="${escapeHtml(project.id)}" aria-label="More actions for ${escapeHtml(project.name)}">${icon.more}</button>
          <div class="project-body">
            <div class="project-title-row">
              <h3 title="${escapeHtml(project.name)}">
                ${escapeHtml(project.name)}
              </h3>
            </div>
            <div class="project-meta">
              <span title="${escapeHtml(peopleCountLabel)}">
                ${icon.peoplegroup}
                ${escapeHtml(
                    peopleCountLabel
                )}
              </span>
            </div>
            <div class="modified" title="${escapeHtml(formatProjectModified(project))}">${escapeHtml(formatProjectModified(project))}</div>
          </div>
          <div class="project-footer"><button class="small-open" type="button" data-open="${escapeHtml(project.id)}" aria-label="Open ${escapeHtml(project.name)}">Open</button></div>
        </article>
      `;
}

function renderStartupRecentActivityCard()
{
    const items = [
        {
            projectId: 'p1',
            project: 'Whiskerfield Family Tree',
            module: 'Albums',
            context: 'Albums',
            icon: icon.image,
            tone: 'red',
            title: '4 photos added',
            detail:
            'Whiskerfield family album photos are ready to organize',
            occurredAt:
            '2026-05-24T10:42:00Z'
        },
        {
            projectId: 'p1',
            project: 'Whiskerfield Family Tree',
            module: 'People',
            context: 'People',
            icon: icon.people,
            tone: 'purple',
            title: 'Profile updated',
            detail:
            'Luna Purrington now has a verified birth place',
            occurredAt:
            '2026-05-23T18:20:00Z'
        },
        {
            projectId: 'p1',
            project: 'Whiskerfield Family Tree',
            module: 'Family Tree',
            context: 'Family Tree',
            icon: icon.import,
            tone: 'amber',
            title: 'GEDCOM import reviewed',
            detail:
            '17 people were added to the project',
            occurredAt:
            '2026-05-22T10:42:00Z'
        }
    ].filter(item =>
        sampleData.projects.some(
            project =>
                project.id ===
            item.projectId
        )
    );

    if (!items.length)
    {
        return '';
    }

    return `
        <div class="right-card">
          <h2>
            ${escapeHtml(
                translateText(
                    'Recent activity'
                )
            )}
          </h2>

          <div
            class="
              startup-action-list
            ">

            ${items
                .map(item =>
                {
                    const title =
                        translateText(
                            item.title
                        );

                    const projectName =
                        translateText(
                            item.project
                        );

                    const context =
                        translateText(
                            item.context
                        );

                    const detail =
                        translateText(
                            item.detail
                        );

                    const date =
                        formatProjectDate(
                            item.occurredAt
                        );

                    const ariaLabel =
                        translateAttributeValue(
                            `Open ${item.project} ${item.context} activity`
                        );

                    return `
                  <button
                    class="
                      startup-action-row
                      startup-activity-row
                    "
                    type="button"
                    data-startup-open-module="${
                        escapeHtml(
                            item.module
                        )
                    }"
                    data-startup-project="${
                        escapeHtml(
                            item.projectId
                        )
                    }"
                    aria-label="${
                        escapeHtml(
                            ariaLabel
                        )
                    }">

                    <span
                      class="
                        startup-action-icon
                        ${item.tone}
                      ">
                      ${item.icon}
                    </span>

                    <span
                      class="
                        startup-action-copy
                      ">

                      <strong>
                        ${escapeHtml(
                            title
                        )}
                      </strong>

                      <span
                        class="
                          startup-action-project
                        ">
                        ${escapeHtml(
                            projectName
                        )}
                        ·
                        ${escapeHtml(
                            context
                        )}
                      </span>

                      <span>
                        ${escapeHtml(
                            detail
                        )}
                        ·
                        ${escapeHtml(
                            date
                        )}
                      </span>
                    </span>

                    <span
                      class="
                        startup-activity-chevron
                      "
                      aria-hidden="true">
                      ›
                    </span>
                  </button>
                `;
                })
                .join('')}
          </div>
        </div>
      `;
}

function renderOfflineProjectsCard()
{
    return `<div class="right-card offline-project-card"><div class="offline-card-titlebar"><h2>Sync status</h2><button class="link" type="button" data-toast="Cloud sync is optional. Your current projects are stored locally.">Sync now</button></div><div class="offline-card-body">
        <div class="offline-card-main"><div class="sync-icon offline-icon">${icon.syncoffline}</div><div><strong>All files are stored locally</strong><span>Your projects, photos, archive files, notes, and boards stay on this device.</span></div></div>
        <div class="offline-card-footer"><span>Enable cloud sync to protect your files.</span></div>
      </div></div>`;
}

function bindStartupRightColumn()
{
    main.querySelectorAll('[data-startup-open-module]').forEach(row =>
    {
        row.addEventListener('click', event =>
        {
            event.stopPropagation();
            openStartupProjectModule(row.dataset.startupProject || '', row.dataset.startupOpenModule || 'Projects');
        });
        row.addEventListener('keydown', event =>
        {
            if (event.key === 'Enter' || event.key === ' ')
            {
                event.preventDefault();
                event.stopPropagation();
                openStartupProjectModule(row.dataset.startupProject || '', row.dataset.startupOpenModule || 'Projects');
            }
        });
    });
    bindToasts(main);
}

function openStartupProjectModule(projectId, moduleName)
{
    navigateToProjectModule(projectId, moduleName);
}

function renderOpenProjectInsightsCard(project)
{
    const projectPeople = getPeople(project.id);
    const projectFiles = (sampleData.archiveFiles || []).filter(file => file.projectId === project.id);
    const projectPhotos = getProjectPhotos(project.id);
    const projectPlaceRecords = projectPlaces(project.id);
    const missingFacts = projectPeople.filter(person =>
        !formatGenealogyDateLabel(person.birth)
        || (!person.birth?.placeId && !person.birth?.placeText)
    ).length;
    const missingSourceData = projectFiles.filter(file =>
        !sourceIdsForTarget(
            'file',
            file.id,
            file.projectId
        ).length
    ).length;
    const unsortedPhotos = projectPhotos.filter(photo => !(photo.albumIds || []).length).length;
    const placeCleanup = projectPlaceRecords.filter(place =>
        getActivePlaceReviewIssues(place).length
    ).length;
    const items = [
        missingFacts ? { module: 'People', icon: icon.people, tone: 'purple', title: 'Missing facts', detail: `${missingFacts} ${missingFacts === 1 ? 'person is' : 'people are'} missing birth details.` } : null,
        missingSourceData ? { module: 'Archive', icon: icon.file, tone: 'amber', title: 'Missing source data', detail: `${missingSourceData} archive ${missingSourceData === 1 ? 'file is' : 'files are'} missing source information.` } : null,
        unsortedPhotos ? { module: 'Albums', icon: icon.image, tone: 'red', title: 'Unsorted photos', detail: `${unsortedPhotos} ${unsortedPhotos === 1 ? 'photo is' : 'photos are'} not assigned to an album.` } : null,
        placeCleanup ? { module: 'Places', icon: icon.mapPin, tone: 'blue', title: 'Place cleanup', detail: `${placeCleanup} ${placeCleanup === 1 ? 'place needs' : 'places need'} review.` } : null
    ].filter(Boolean);
    return `<div class="right-card"><h2 class="project-insights-heading"><span aria-hidden="true">${icon.tip}</span>Project insights</h2><div class="startup-action-list">
        ${items.length ? items.map(item => `<button class="startup-action-row project-insight-row" type="button" data-open-project-module="${item.module}" aria-label="Open ${escapeHtml(item.module)} for ${escapeHtml(item.title)}">
          <div class="startup-action-icon ${item.tone}">${item.icon}</div>
          <div class="startup-action-copy"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.detail)}</span></div>
          <span class="project-insight-chevron" aria-hidden="true">${icon.chevron}</span>
        </button>`).join('') : `<div class="project-insights-empty">${escapeHtml(t('Start by adding a person or opening a project module.'))}</div>`}
      </div></div>`;
}

function renderOpenProjectOfflineCard(project)
{
    return `<div class="right-card offline-project-card">
        <div class="offline-card-titlebar"><h2>Sync status</h2><button class="link" type="button" data-toast="Cloud sync is optional. This project is currently stored locally.">Sync now</button></div>
        <div class="offline-card-body">
          <div class="offline-card-main"><div class="sync-icon offline-icon">${icon.syncoffline}</div><div><strong>Offline project</strong><span>Cloud backup is disabled. Project files, photos, archive files, notes, and boards stay on this device.</span></div></div>
        <button class="offline-card-learn link project-overview-link" type="button" data-toast="Cloud backup help is a placeholder for a later flow.">
          <span class="project-overview-link-text">Learn more about cloud backup</span>
          <span class="project-overview-link-icon" aria-hidden="true">${icon.openlink}</span>
        </button>
        </div>
      </div>`;
}

function bindOpenProjectRightColumn()
{
    const openModule = element =>
    {
        const moduleName = element.dataset.openProjectModule;
        if (!moduleName) return;
        const archiveView = element.dataset.openProjectArchiveView;
        if (moduleName === 'Archive' && (archiveView === 'files' || archiveView === 'sources'))
        {
            state.archiveView = archiveView;
        }
        navigateToProjectModule(currentProjectId(), moduleName);
    };
    main.querySelectorAll('[data-open-project-module]').forEach(element =>
    {
        element.addEventListener('click', event =>
        {
            event.stopPropagation();
            openModule(element);
        });
        element.addEventListener('keydown', event =>
        {
            if (event.key === 'Enter' || event.key === ' ')
            {
                event.preventDefault();
                event.stopPropagation();
                openModule(element);
            }
        });
    });
    main.querySelectorAll('[data-shortcut]').forEach(button =>
    {
        button.addEventListener('click', () =>
        {
            navigateToProjectModule(currentProjectId(), button.dataset.shortcut);
        });
    });
    main.querySelectorAll('[data-open-side-main]').forEach(button =>
    {
        button.addEventListener('click', () =>
        {
            state.openSide = button.dataset.openSideMain;
            persistProjectContinuation({ projectId: currentProjectId(), module: 'Projects', openedAt: new Date().toISOString() });
            renderOpenProject();
        });
    });
}


function renderActivityRows(count)
{
    const activityIcons = {
        Albums: icon.image,
        People: icon.people,
        'Family Tree': icon.tree,
        Notes: icon.note,
        Archive: icon.file,
        Places: icon.mapPin,
        Geneograph: icon.geneograph
    };
    const rows = (sampleData.activity || [])
        .filter(row => row.projectId === currentProjectId())
        .slice()
        .sort((first, second) => Date.parse(second.occurredAt || '') - Date.parse(first.occurredAt || ''));
    if (!rows.length)
    {
        return `<div class="project-activity-empty"><strong>${escapeHtml(t('No project activity yet'))}</strong><span>${escapeHtml(t('Activity will appear as you add and edit project records.'))}</span></div>`;
    }
    return `<div class="project-activity-list">${rows.slice(0,count).map(row => `<button class="project-activity-row" type="button" data-open-project-module="${row.module}">
        <span class="project-activity-icon ${row.tone || ''}">${activityIcons[row.module] || icon.clock}</span>
        <span class="project-activity-copy"><strong>${escapeHtml(row.title)}</strong><span>${escapeHtml(row.detail)}</span></span>
        <span class="project-activity-time">${escapeHtml(formatProjectDate(row.occurredAt))}</span>
      </button>`).join('')}</div>`;
}

