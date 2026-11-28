let mobileSurface = null;
let mobileSurfaceReturnFocus = null;
let mobileBodyOverflow = '';
let mobileDetailModule = null;
let mobileDetailsCloseButton = null;

function mountPlacesMobileDetailsClose()
{
    if (mobileSurface !== 'details' || state.activeModule !== 'Places' || innerWidth > 900)
    {
        return;
    }
    const toolbar = main.querySelector('.places-inspector-toolbar');
    if (toolbar && mobileDetailsCloseButton)
    {
        toolbar.appendChild(mobileDetailsCloseButton);
    }
}

function mobileDetailTarget()
{
    const selectors = {
        'Family Tree': '.tree-inspector',
        People: '.people-person-sidebar',
        Albums: '.albums-detail:not(.collapsed)',
        Archive: '.archive-inspector',
        Places: '.places-inspector',
        Geneograph: '.geneo-inspector:not(.collapsed)'
    };
    return main.querySelector(selectors[state.activeModule] || '.no-mobile-detail');
}

function expandMobileDetailTarget()
{
    if (state.activeModule === 'Family Tree' && state.treeInspectorCollapsed)
    {
        state.treeInspectorCollapsed = false;
        renderFamilyTreePreserveScroll();
    }
    else if (state.activeModule === 'People' && state.peoplePreviewCollapsed)
    {
        state.peoplePreviewCollapsed = false;
        renderPeople();
    }
    else if (state.activeModule === 'Albums' && state.albumsDetailCollapsed)
    {
        state.albumsDetailCollapsed = false;
        renderAlbumsPreserveViewport();
    }
    else if (state.activeModule === 'Archive' && state.archiveInspectorCollapsed)
    {
        state.archiveInspectorCollapsed = false;
        renderArchive();
    }
    else if (state.activeModule === 'Places' && state.placesInspectorCollapsed)
    {
        state.placesInspectorCollapsed = false;
        renderPlaces();
    }
    else if (state.activeModule === 'Geneograph' && state.geneoInspectorCollapsed)
    {
        state.geneoInspectorCollapsed = false;
        renderGeneographEditorPreserveScroll();
    }
}

function closeMobileSurface(restoreFocus = true)
{
    if (!mobileSurface) return;
    const wasSections = mobileSurface === 'sections';
    mobileSurface = null;
    document.querySelector('#mobileSurfaceBackdrop')?.remove();
    document.querySelector('#mobileModuleDrawer')?.remove();
    document.querySelector('#mobileSectionsHeader')?.remove();
    mobileDetailsCloseButton?.remove();
    mobileDetailsCloseButton = null;
    document.body.classList.remove('mobile-surface-open', 'mobile-sections-open', 'mobile-details-open', 'mobile-person-details-open');
    mobileDetailModule = null;
    topbar.querySelectorAll('[data-mobile-menu], [data-mobile-sections], [data-mobile-details]')
        .forEach(button => button.setAttribute('aria-expanded', 'false'));
    document.body.style.overflow = mobileBodyOverflow;
    if (wasSections)
    {
        sidebar.removeAttribute('role');
        sidebar.removeAttribute('aria-modal');
        sidebar.removeAttribute('aria-label');
    }
    document.removeEventListener('keydown', handleMobileSurfaceKeydown, true);
    if (restoreFocus && mobileSurfaceReturnFocus?.isConnected)
        mobileSurfaceReturnFocus.focus({ preventScroll: true });
    mobileSurfaceReturnFocus = null;
}

function handleMobileSurfaceKeydown(event)
{
    if (!mobileSurface) return;
    if (modalBackdrop.classList.contains('open')) return;
    if (event.key === 'Escape')
    {
        const renameInput = event.target.closest?.('#archiveFileNameInput, #albumsPhotoNameInput');
        if (renameInput)
        {
            event.preventDefault();
            event.stopImmediatePropagation();
            document.getElementById(renameInput.id === 'archiveFileNameInput' ? 'archiveCancelFileName' : 'albumsCancelPhotoName')?.click();
            return;
        }
        const itemFilter = document.querySelector('[data-geneo-item-filter-menu]:not([hidden])');
        if (itemFilter)
        {
            event.preventDefault();
            event.stopImmediatePropagation();
            state.geneoItemFilterOpen = false;
            itemFilter.hidden = true;
            const trigger = document.querySelector('[data-geneo-item-filter-trigger]');
            trigger?.setAttribute('aria-expanded', 'false');
            trigger?.focus({ preventScroll: true });
            return;
        }
        event.preventDefault();
        event.stopImmediatePropagation();
        if (document.querySelector('.mobile-choice-sheet'))
        {
            const anchor = menuLifecycleAnchor;
            closeMenu();
            if (anchor?.isConnected) anchor.focus();
            return;
        }
        if (['Albums', 'Places'].includes(state.activeModule) && document.getElementById('projectMenu'))
        {
            closeMenu();
            return;
        }
        if (mobileSurface === 'details' && ['Family Tree', 'People', 'Albums'].includes(state.activeModule)
            && (document.getElementById('projectMenu') || document.getElementById('relativePopover')))
        {
            closeMenu();
            return;
        }
        closeMobileSurface();
        return;
    }
    if (event.key !== 'Tab') return;
    if (document.querySelector('.mobile-choice-sheet')) return;
    if (modalBackdrop.classList.contains('open')) return;
    const surface = mobileSurface === 'sections' ? sidebar : mobileSurface === 'details' ? mobileDetailTarget() : document.querySelector('#mobileModuleDrawer');
    if (!surface) return;
    const focusable = [...surface.querySelectorAll('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), [tabindex="0"]')]
        .filter(item => item.getClientRects().length);
    if (mobileSurface === 'details') focusable.unshift(document.querySelector('#mobileDetailsClose'));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first)
    {
        event.preventDefault(); last.focus();
    }
    else if (!event.shiftKey && document.activeElement === last)
    {
        event.preventDefault(); first.focus();
    }
}

function openMobileSurface(kind)
{
    if (window.innerWidth > (kind === 'details' ? 1180 : 900)) return;
    if (kind === 'details') expandMobileDetailTarget();
    if (mobileSurface === kind)
    {
        closeMobileSurface();
        return;
    }
    closeMobileSurface(false);
    mobileSurface = kind;
    mobileSurfaceReturnFocus = document.activeElement;
    mobileSurfaceReturnFocus?.setAttribute?.('aria-expanded', 'true');
    mobileBodyOverflow = document.body.style.overflow;
    document.body.classList.add('mobile-surface-open');
    document.body.style.overflow = 'hidden';

    const backdrop = document.createElement('div');
    backdrop.id = 'mobileSurfaceBackdrop';
    backdrop.className = 'mobile-surface-backdrop';
    bindIntentionalBackdropDismiss(backdrop, () => closeMobileSurface());
    document.body.appendChild(backdrop);

    if (kind === 'details')
    {
        if (!mobileDetailTarget())
        {
            closeMobileSurface();
            return;
        }
        mobileDetailModule = state.activeModule;
        document.body.classList.add('mobile-details-open');
        if (['Family Tree', 'People'].includes(state.activeModule)) document.body.classList.add('mobile-person-details-open');
        const close = document.createElement('button');
        close.id = 'mobileDetailsClose';
        close.type = 'button';
        close.setAttribute('aria-label', t('Close details'));
        close.innerHTML = `${icon.close}<span>${escapeHtml(t('Close'))}</span>`;
        close.addEventListener('click', () => closeMobileSurface());
        mobileDetailsCloseButton = close;
        document.body.appendChild(close);
        mountPlacesMobileDetailsClose();
        close.focus();
    }
    else if (kind === 'sections')
    {
        document.body.classList.add('mobile-sections-open');
        sidebar.setAttribute('role', 'dialog');
        sidebar.setAttribute('aria-modal', 'true');
        const moduleName = t(state.activeModule);
        sidebar.setAttribute('aria-label', `${moduleName} ${t('Navigation')}`);
        sidebar.insertAdjacentHTML('afterbegin', `<div class="mobile-drawer-heading" id="mobileSectionsHeader"><strong>${escapeHtml(moduleName)}</strong><button type="button" data-mobile-close aria-label="${escapeHtml(t('Close'))}">${icon.close}</button></div>`);
        sidebar.querySelector('[data-mobile-close]')?.addEventListener('click', () => closeMobileSurface());
        sidebar.querySelector('[data-mobile-close]')?.focus();
    }
    else
    {
        const drawer = document.createElement('div');
        drawer.id = 'mobileModuleDrawer';
        drawer.className = 'mobile-module-drawer';
        drawer.setAttribute('role', 'dialog');
        drawer.setAttribute('aria-modal', 'true');
        drawer.setAttribute('aria-label', t('Modules'));
        const icons = { 'Family Tree': icon.tree, People: icon.people, Geneograph: icon.whiteboard, Albums: icon.image, Archive: icon.archive, Notes: icon.note, Places: icon.mapPin };
        drawer.innerHTML = `<div class="mobile-drawer-heading"><strong>${escapeHtml(t('Modules'))}</strong><button type="button" data-mobile-close aria-label="${escapeHtml(t('Close'))}">${icon.close}</button></div>
            <nav aria-label="${escapeHtml(t('Modules'))}">
                <button type="button" data-mobile-destination="library" ${!state.projectOpen ? 'aria-current="page"' : ''}>${icon.home}<span>${escapeHtml(t('All projects'))}</span></button>
                ${state.projectOpen ? `<button type="button" data-mobile-destination="overview" ${state.activeModule === 'Projects' ? 'aria-current="page"' : ''}>${icon.grid}<span>${escapeHtml(t('Project overview'))}</span></button>
                    ${modules.map(module => `<button type="button" data-mobile-destination="${escapeHtml(module)}" ${state.activeModule === module ? 'aria-current="page"' : ''}>${icons[module] || icon.grid}<span>${escapeHtml(t(module))}</span></button>`).join('')}` : ''}
            </nav>`;
        document.body.appendChild(drawer);
        drawer.querySelector('[data-mobile-close]').addEventListener('click', () => closeMobileSurface());
        drawer.querySelectorAll('[data-mobile-destination]').forEach(button => button.addEventListener('click', () =>
        {
            const destination = button.dataset.mobileDestination;
            closeMobileSurface(false);
            const focusDestination = () => requestAnimationFrame(() =>
            {
                main.tabIndex = -1;
                main.focus({ preventScroll: true });
            });
            if (destination === 'library')
            {
                if (state.activeModule === 'Family Tree') captureTreeCanvasScroll(currentProjectId());
                if (state.activeModule === 'Geneograph' && state.geneoView === 'board') captureGeneographViewport();
                runAfterProjectSettingsGuard(() =>
                {
                    state.projectOpen = false;
                    state.currentProjectId = null;
                    state.activeModule = 'Projects';
                    render();
                    focusDestination();
                });
            }
            else
            {
                const moduleName = destination === 'overview' ? 'Projects' : destination;
                if (state.activeModule === 'Projects' && state.openSide === 'settings')
                {
                    runAfterProjectSettingsGuard(() =>
                    {
                        navigateToProjectModuleCommit(currentProjectId(), moduleName);
                        focusDestination();
                    });
                }
                else
                {
                    navigateToProjectModule(currentProjectId(), moduleName);
                    focusDestination();
                }
            }
        }));
        drawer.querySelector('[data-mobile-close]').focus();
    }
    document.addEventListener('keydown', handleMobileSurfaceKeydown, true);
}

window.addEventListener('resize', () =>
{
    if (window.innerWidth > (mobileSurface === 'details' ? 1180 : 900)) closeMobileSurface(false);
});

sidebar.addEventListener('click', event =>
{
    if (mobileSurface !== 'sections') return;
    const button = event.target.closest('button');
    if (!button || (state.activeModule === 'Albums' && button.closest('[data-album-menu]'))
        || (state.activeModule === 'Places' && button.matches('[data-place-menu], [data-place-saved-filter-menu], #placesSavedFilterPlus'))
        || button.matches('[data-geneo-item-filter-clear], [data-geneo-toggle-connection-visible], [data-geneo-toggle-visible], [data-geneo-toggle-lock]')
        || (button.hasAttribute('aria-expanded') && !button.hasAttribute('aria-haspopup'))) return;
    requestAnimationFrame(() =>
    {
        if (mobileSurface === 'sections' && !modalBackdrop.classList.contains('open'))
            closeMobileSurface(false);
    });
}, true);

main.addEventListener('click', event =>
{
    if (event.target.closest('[data-mobile-open-details]'))
    {
        event.preventDefault();
        event.stopPropagation();
        openMobileSurface('details');
        return;
    }
    if (mobileSurface !== 'details' || ['Family Tree', 'People', 'Albums', 'Places'].includes(state.activeModule) || !mobileDetailTarget()?.contains(event.target)
        || !event.target.closest('button[aria-haspopup]')) return;
    requestAnimationFrame(() =>
    {
        if (mobileSurface === 'details' && !modalBackdrop.classList.contains('open'))
            closeMobileSurface(false);
    });
}, true);

const appNavigation = { current: null, back: [], forward: [], intent: null, activeTarget: null, restoring: false };

function appNavigationSnapshot()
{
    if (!state.projectOpen) return { projectId: null, module: 'Projects' };
    const location = { projectId: state.currentProjectId, module: state.activeModule };
    if (location.module === 'Projects') location.view = state.openSide;
    if (location.module === 'Family Tree')
    {
        location.focusPersonId = treeProjectViewState().focusPersonId;
        location.personId = state.selectedPersonId || location.focusPersonId;
        location.treeZoom = state.treeZoom;
        location.treeScroll = getTreeCanvasScroll() || treeProjectViewState().canvasScroll;
    }
    if (location.module === 'People')
    {
        location.view = state.peopleView;
        if (location.view === 'profile') location.personId = state.selectedPeopleId;
    }
    if (location.module === 'Geneograph')
    {
        location.view = state.geneoView;
        if (location.view === 'board') location.boardId = state.selectedGeneoBoardId;
    }
    if (location.module === 'Albums')
    {
        location.view = state.albumsView;
        if (location.view === 'album') location.albumId = state.activeAlbumId;
        const target = appNavigation.intent?.target || appNavigation.activeTarget;
        if (target?.type === 'photo' && target.id === state.selectedPhotoId) location.photoId = target.id;
    }
    if (location.module === 'Archive')
    {
        location.archive = archiveCurrentLocationSnapshot();
        location.archiveView = state.archiveView;
        if (state.archiveView === 'sources') location.sourceId = state.archiveSelectedSourceId;
    }
    if (location.module === 'Notes')
    {
        location.view = state.notesView;
        location.collectionId = state.notesActiveCollectionId;
        if (state.selectedNoteId && !state.notesRightCollapsed) location.noteId = state.selectedNoteId;
    }
    if (location.module === 'Places')
    {
        location.view = state.placesView;
        const target = appNavigation.intent?.target || appNavigation.activeTarget;
        if (target?.type === 'place' && target.id === state.selectedPlaceId) location.placeId = target.id;
    }
    if (location.module === 'Publish') location.view = state.publishView;
    return location;
}

function appNavigationKey(location)
{
    if (!location) return '';
    const { archive, treeZoom, treeScroll, ...rest } = location;
    return JSON.stringify(archive ? { ...rest, archive: [archive.view, archive.folderId, archive.selectedFileId] } : rest);
}

function appNavigationMarkIntent(target = null)
{
    if (appNavigation.current && state.projectOpen) appNavigation.current = appNavigationSnapshot();
    appNavigation.activeTarget = null;
    appNavigation.intent = { target };
}

function appNavigationObserve()
{
    const next = appNavigationSnapshot();
    const previous = appNavigation.current;
    if (previous && previous.projectId !== next.projectId)
    {
        appNavigation.back = [];
        appNavigation.forward = [];
        appNavigation.activeTarget = null;
        appNavigation.current = next;
    }
    else if (!previous) appNavigation.current = next;
    else if (appNavigationKey(previous) !== appNavigationKey(next))
    {
        if (!appNavigation.restoring && (appNavigation.intent || previous.module !== next.module))
        {
            appNavigation.back.push(previous);
            if (appNavigation.back.length > 50) appNavigation.back.shift();
            appNavigation.forward = [];
        }
        appNavigation.current = next;
    }
    else appNavigation.current = next;
    if (!appNavigation.restoring && (previous?.module !== next.module || previous?.view !== next.view)) appNavigation.activeTarget = null;
    if (appNavigation.intent?.target) appNavigation.activeTarget = appNavigation.intent.target;
    appNavigation.intent = null;
    appNavigationUpdateControls();
}

function appNavigationValid(location)
{
    if (!state.projectOpen || location.projectId !== state.currentProjectId || !validProjectById(location.projectId)) return false;
    const projectId = location.projectId;
    if (location.personId && !getPeople(projectId).some(person => person.id === location.personId && !person.deleted)) return false;
    if (location.focusPersonId && !getPeople(projectId).some(person => person.id === location.focusPersonId && !person.deleted)) return false;
    if (location.boardId && !getGeneographBoard(location.boardId, { projectId })) return false;
    if (location.albumId && !(sampleData.albums || []).some(album => album.id === location.albumId && album.projectId === projectId)) return false;
    if (location.photoId && !getPhoto(location.photoId, { projectId })) return false;
    if (location.noteId && !getNote(location.noteId, { projectId })) return false;
    if (location.placeId && !(sampleData.places || []).some(place => place.id === location.placeId && place.projectId === projectId)) return false;
    if (location.archive?.folderId && !archiveFolderById(location.archive.folderId, projectId)) return false;
    if (location.archive?.selectedFileId && !archiveFileById(location.archive.selectedFileId, projectId)) return false;
    if (location.sourceId && !archiveSourceById(location.sourceId, projectId)) return false;
    return true;
}

function appNavigationDestination(direction)
{
    return appNavigation[direction].slice().reverse().find(appNavigationValid) || null;
}

function appNavigationLabel(location)
{
    if (!location) return '';
    const details = [
        location.personId && getPerson(location.personId)?.name,
        location.boardId && getGeneographBoard(location.boardId, { projectId: location.projectId })?.name,
        location.albumId && (sampleData.albums || []).find(album => album.id === location.albumId)?.name,
        location.photoId && getPhoto(location.photoId, { projectId: location.projectId })?.name,
        location.noteId && getNote(location.noteId, { projectId: location.projectId })?.title,
        location.placeId && (sampleData.places || []).find(place => place.id === location.placeId)?.name,
        location.archive?.selectedFileId && archiveFileById(location.archive.selectedFileId, location.projectId)?.name,
        location.sourceId && archiveSourceById(location.sourceId, location.projectId)?.name
    ];
    const view = location.module === 'People' && location.view === 'profile' ? t('Profile')
        : location.module === 'Geneograph' && location.view === 'board' ? t('Board')
        : location.module === 'Archive' && location.archiveView === 'sources' ? t('Sources')
        : location.module === 'Albums' && location.view === 'album' ? t('Album') : '';
    return [t(location.module), view, ...details].filter(Boolean).join(': ');
}

function appNavigationUpdateControls()
{
    for (const direction of ['back', 'forward'])
    {
        const button = topbar.querySelector(`[data-app-navigation="${direction}"]`);
        if (!button) continue;
        const target = appNavigationDestination(direction);
        button.disabled = !target;
        button.title = target ? `${t(direction === 'back' ? 'Back to' : 'Forward to')} ${appNavigationLabel(target)}` : t(direction === 'back' ? 'No previous destination' : 'No next destination');
        button.setAttribute('aria-label', button.title);
    }
}

function appNavigationRestore(location)
{
    if (!appNavigationValid(location)) return;
    activateProject(location.projectId, { moduleName: location.module, renderNow: false });
    if (location.module === 'Projects') state.openSide = location.view || 'overview';
    if (location.module === 'Family Tree' && location.personId)
    {
        treeProjectViewState(location.projectId).focusPersonId = location.focusPersonId || location.personId;
        state.selectedPersonId = location.personId;
        state.treeZoom = location.treeZoom || state.treeZoom;
        state.treeCenterTargetId = location.treeScroll ? '' : location.personId;
        if (location.treeScroll) treeProjectViewState(location.projectId).canvasScroll = location.treeScroll;
    }
    if (location.module === 'People')
    {
        state.peopleView = location.view || 'directory';
        state.peopleSide = state.peopleView === 'profile' ? 'profile' : 'people';
        if (location.personId) { state.selectedPeopleId = location.personId; state.selectedPersonId = location.personId; }
    }
    if (location.module === 'Geneograph')
    {
        state.geneoView = location.view || 'home';
        if (location.boardId)
        {
            openGeneographBoard(location.boardId);
            return;
        }
    }
    if (location.module === 'Albums')
    {
        state.albumsView = location.view || 'all';
        state.activeAlbumId = location.albumId || null;
        if (location.photoId) state.selectedPhotoId = location.photoId;
        state.albumsDetailCollapsed = !location.photoId;
    }
    if (location.module === 'Archive' && location.archive)
    {
        archiveApplyLocationSnapshot(location.archive);
        if (location.archiveView === 'sources')
        {
            state.archiveView = 'sources';
            state.archiveSelectedSourceId = location.sourceId || null;
        }
    }
    if (location.module === 'Notes')
    {
        state.notesView = location.view || 'all';
        state.notesActiveCollectionId = location.collectionId || null;
        state.selectedNoteId = location.noteId || null;
        state.notesRightCollapsed = !location.noteId;
        state.notesMobilePane = location.noteId ? 'editor' : 'browser';
    }
    if (location.module === 'Places')
    {
        state.placesView = location.view || 'all';
        state.selectedPlaceId = location.placeId || null;
    }
    if (location.module === 'Publish') state.publishView = location.view || 'home';
    render();
}

function appNavigationGo(direction)
{
    if (!state.projectOpen || modalBackdrop.classList.contains('open')) return;
    const target = appNavigationDestination(direction);
    if (!target) return;
    const commit = () =>
    {
        let entry;
        do { entry = appNavigation[direction].pop(); } while (entry && !appNavigationValid(entry));
        if (!entry) return;
        const other = direction === 'back' ? 'forward' : 'back';
        if (appNavigation.current) appNavigation[other].push(appNavigation.current);
        appNavigation.restoring = true;
        try
        {
            appNavigation.activeTarget = entry.photoId ? { type: 'photo', id: entry.photoId }
                : entry.placeId ? { type: 'place', id: entry.placeId } : null;
            appNavigationRestore(entry);
            appNavigation.current = entry;
        }
        finally { appNavigation.restoring = false; appNavigationUpdateControls(); }
    };
    if (state.activeModule === 'Projects' && state.openSide === 'settings') runAfterProjectSettingsGuard(commit);
    else if (state.activeModule === 'Archive') runAfterArchiveFileEditGuard(commit);
    else commit();
}

document.addEventListener('keydown', event =>
{
    if (!state.projectOpen || !event.altKey || event.ctrlKey || event.metaKey || event.shiftKey
        || !['ArrowLeft', 'ArrowRight'].includes(event.key)
        || event.target.closest('input, textarea, select, [contenteditable="true"]')
        || modalBackdrop.classList.contains('open')) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    appNavigationGo(event.key === 'ArrowLeft' ? 'back' : 'forward');
}, true);

function render()
{
    if (!appPerf.enabled(state.activeModule)) return renderApplicationShell();
    return appPerf.run(state.activeModule, 'shellRender', renderApplicationShell);
}

function renderApplicationShell()
{
    cancelSharedSearch();
    if (typeof pruneGedcomPlaceMatchingJobs === 'function') pruneGedcomPlaceMatchingJobs();
    setProjectReadModelActive(state.projectOpen ? currentProjectId() : null);
    if (state.projectOpen) invalidateLinkedPlaceDismissals([currentProjectId()]);
    if (state.activeModule !== 'Family Tree')
    {
        exitTreeFullscreen();
        disposeTreeElkLayout();
        disposeTreeRenderer();
    }
    if (typeof archiveDiagnosticReset === 'function' && state.activeModule !== 'Archive' && archiveDiagnosticRoot) archiveDiagnosticReset();
    if (typeof archiveImageSyncLifecycle === 'function') archiveImageSyncLifecycle();
    appNavigationObserve();
    if (mobileSurface !== 'details' || mobileDetailModule !== state.activeModule)
        closeMobileSurface(false);
    geneoProductTourOnRender();
    closeMenu();

    if (state.activeModule !== 'Notes')
    {
        destroyNotesRichTextEditor();
        disconnectNotesCollectionRowsObserver();
    }

    if (state.activeModule !== 'People' && state.peopleSelectedIds.length)
    {
        clearPeopleSelection();
    }
    if (state.activeModule !== 'Albums')
    {
        disconnectAlbumsGridResizeObserver();
    }
    if (state.activeModule !== 'Places')
    {
        destroyPlacesMap();
        if (placeEditorDraft) resetPlaceEditorDraft();
    }
    applyLanguage();
    main.classList.remove('people-profile-main');
    renderTopbar();
    if (mobileSurface === 'details') requestAnimationFrame(() =>
    {
        if (mobileSurface === 'details' && !mobileDetailTarget()) closeMobileSurface(false);
    });
    workspace.classList.toggle('no-sidebar', state.activeModule === 'Family Tree');
    if (state.activeModule === 'Family Tree')
    {
        renderFamilyTree();
        return;
    }
    if (state.activeModule === 'People')
    {
        renderPeople();
        return;
    }
    if (state.activeModule === 'Geneograph')
    {
        renderGeneograph();
        return;
    }
    if (state.activeModule === 'Albums')
    {
        renderAlbums();
        return;
    }
    if (state.activeModule === 'Archive')
    {
        renderArchive();
        return;
    }
    if (state.activeModule === 'Notes')
    {
        renderNotes();
        return;
    }
    if (state.activeModule === 'Places')
    {
        renderPlaces();
        return;
    }
    if (state.activeModule === 'Publish')
    {
        renderPublish();
        return;
    }
    if (state.activeModule !== 'Projects')
    {
        renderModulePlaceholder();
        return;
    }
    if (state.projectOpen) renderOpenProject();
    else renderStartup();
}

// Explicit clear action only; ordinary typing never restores focus asynchronously.
function restoreSearchInputFocus(selector, selectionStart, selectionEnd)
{
    const input = document.querySelector(selector);
    if (!input) return;
    input.focus({ preventScroll: true });
    if (typeof input.setSelectionRange !== 'function') return;
    const valueLength = input.value.length;
    const start = Math.min(selectionStart ?? valueLength, valueLength);
    const end = Math.min(selectionEnd ?? start, valueLength);
    input.setSelectionRange(start, end);
}

// Shared view search: one pending refresh, scoped to the live input and view.
const sharedSearchBindings = new WeakMap();
let pendingSharedSearch = null;
let sharedSearchFrame = null;
let activeSharedSearch = null;

function sharedSearchScope()
{
    return [state.activeModule, state.currentProjectId, state.projectOpen, state.language];
}

function sharedSearchIsCurrent(update)
{
    return update.input.isConnected && update.root.contains(update.input)
        && main.contains(update.input) && main.querySelector(update.selector) === update.input
        && sharedSearchScope().every((value, index) => value === update.scope[index])
        && state[update.stateKey] === update.value && update.input.value === update.value;
}

function cancelSharedSearch()
{
    if (sharedSearchFrame !== null) cancelAnimationFrame(sharedSearchFrame);
    sharedSearchFrame = null;
    pendingSharedSearch = null;
}

function flushSharedSearch()
{
    const update = pendingSharedSearch;
    if (!update) return;
    if (!sharedSearchIsCurrent(update))
    {
        cancelSharedSearch();
        return;
    }
    // Do not replace the underlying view while a modal owns interaction.
    if (modalBackdrop.classList.contains('open')) return;
    cancelSharedSearch();
    activeSharedSearch = update;
    try
    {
        update.render();
    }
    finally
    {
        activeSharedSearch = null;
    }
}

function resumeSharedSearch()
{
    if (!pendingSharedSearch || sharedSearchFrame !== null) return;
    sharedSearchFrame = requestAnimationFrame(() =>
    {
        sharedSearchFrame = null;
        flushSharedSearch();
    });
}

function handleSearchInput(event, binding)
{
    const input = event.currentTarget;
    if (!input.isConnected || !binding.root.contains(input) || !main.contains(input)) return;
    // The native field owns the text and caret; accept its complete value immediately.
    state[binding.stateKey] = input.value;
    cancelSharedSearch();
    if (binding.composing || event.isComposing) return;
    pendingSharedSearch = { ...binding, input, value: input.value, scope: sharedSearchScope() };
    resumeSharedSearch();
}

function bindSearchInput(root, selector, stateKey, render)
{
    const input = root.querySelector(selector);
    if (!input) return;
    if (pendingSharedSearch && pendingSharedSearch.input !== input) cancelSharedSearch();
    let binding = sharedSearchBindings.get(input);
    if (binding)
    {
        Object.assign(binding, { root, selector, stateKey, render });
        return;
    }
    binding = { root, selector, stateKey, render, composing: false };
    sharedSearchBindings.set(input, binding);
    input.addEventListener('input', event => handleSearchInput(event, binding));
    input.addEventListener('compositionstart', () =>
    {
        binding.composing = true;
        if (pendingSharedSearch?.input === input) cancelSharedSearch();
    });
    input.addEventListener('compositionend', event =>
    {
        binding.composing = false;
        handleSearchInput(event, binding);
    });
    input.addEventListener('keydown', event =>
    {
        // Publish the latest result set before native keyboard navigation.
        if (!binding.composing && !event.isComposing && ['Tab', 'Enter'].includes(event.key)
            && pendingSharedSearch?.input === input) flushSharedSearch();
    });
}

// The consumer still produces its ordinary complete markup. During its search
// refresh, keep the input and passive ancestor path connected, replacing only
// sibling regions. Optional retained leaves belong to existing consumer lifecycles
// (e.g. the Places map). This is not a general-purpose DOM reconciler.
function replaceSharedSearchBranch(root, nextRoot, retained = [])
{
    const search = activeSharedSearch;
    if (!search || !root.contains(search.input)) return false;
    const nextInput = nextRoot.querySelector(search.selector);
    if (!nextInput) return false;
    const pairs = new Map([[root, nextRoot]]);
    const reverse = new Map([[nextRoot, root]]);
    const leaves = new Set();
    for (const [oldLeaf, newLeaf] of [[search.input, nextInput], ...retained])
    {
        if (!oldLeaf || !newLeaf || !root.contains(oldLeaf) || !nextRoot.contains(newLeaf)) return false;
        leaves.add(oldLeaf);
        let current = oldLeaf, next = newLeaf;
        while (current !== root && next !== nextRoot)
        {
            if (!current || !next || current.nodeName !== next.nodeName
                || (pairs.has(current) && pairs.get(current) !== next)
                || (reverse.has(next) && reverse.get(next) !== current)) return false;
            pairs.set(current, next);
            reverse.set(next, current);
            current = current.parentNode;
            next = next.parentNode;
        }
        if (current !== root || next !== nextRoot) return false;
    }
    // Preflight every retained branch before mutating anything. A real view
    // transition may have a different structure; normal search views do not.
    for (const [current, next] of pairs)
    {
        if (leaves.has(current)) continue;
        const oldOrder = [...current.childNodes].filter(child => pairs.has(child));
        const newOrder = [...next.childNodes].filter(child => reverse.has(child)).map(child => reverse.get(child));
        if (oldOrder.length !== newOrder.length || oldOrder.some((child, index) => child !== newOrder[index])) return false;
    }
    function updateBranch(current)
    {
        if (leaves.has(current)) return;
        const next = pairs.get(current);
        if (current !== root || next.nodeType === current.nodeType)
        {
            for (const attribute of [...current.attributes])
                if (!next.hasAttribute(attribute.name)) current.removeAttribute(attribute.name);
            for (const attribute of next.attributes)
                if (current.getAttribute(attribute.name) !== attribute.value) current.setAttribute(attribute.name, attribute.value);
        }
        for (const child of [...current.childNodes])
            if (!pairs.has(child)) child.remove();
        let anchor = current.firstChild;
        for (const child of [...next.childNodes])
        {
            const kept = reverse.get(child);
            if (kept)
            {
                updateBranch(kept);
                anchor = kept.nextSibling;
            }
            else current.insertBefore(child, anchor);
        }
    }
    updateBranch(root);
    return true;
}

function replaceSharedSearchMarkup(root, markup)
{
    if (activeSharedSearch && root.contains(activeSharedSearch.input))
    {
        const template = document.createElement('template');
        template.innerHTML = markup;
        if (replaceSharedSearchBranch(root, template.content)) return;
    }
    if (pendingSharedSearch && root.contains(pendingSharedSearch.input)) cancelSharedSearch();
    root.innerHTML = markup;
}

function renderTopbar()
{
    const showModules = state.projectOpen;
    const showSections = showModules && state.activeModule !== 'Family Tree';
    const showDetails = showModules && ['Family Tree', 'People', 'Albums', 'Archive', 'Places', 'Geneograph'].includes(state.activeModule)
        && !(state.activeModule === 'Family Tree' && !getPeople(currentFamilyTreeProjectId()).length)
        && !(state.activeModule === 'People' && !peopleProjectHasPeople())
        && !(state.activeModule === 'People' && state.peopleView === 'profile')
        && !(state.activeModule === 'Geneograph' && state.geneoView !== 'board');
    const signedLabel = state.userSignedIn ? 'SW' : 'IN';
    topbar.innerHTML = `
        ${showModules ? `<button class="mobile-menu-trigger" type="button" data-mobile-menu aria-label="${escapeHtml(t('Modules'))}" title="${escapeHtml(t('Modules'))}" aria-haspopup="dialog" aria-expanded="false">${icon.menu}</button>` : ''}
        ${showModules ? `<div class="app-navigation-controls" role="group" aria-label="${escapeHtml(t('App navigation'))}">
          <button type="button" data-app-navigation="back" aria-label="${escapeHtml(t('Back'))}" title="${escapeHtml(t('Back'))}" disabled>${icon.arrow}</button>
          <button type="button" data-app-navigation="forward" aria-label="${escapeHtml(t('Forward'))}" title="${escapeHtml(t('Forward'))}" disabled>${icon.arrow}</button>
        </div>` : ''}
        <button class="home-tab ${state.activeModule === 'Projects' ? 'active' : ''}" type="button" data-home aria-label="Projects home">${icon.home}</button>
        <button class="mobile-sections-trigger" type="button" data-mobile-sections aria-label="${escapeHtml(t('Sections'))}: ${escapeHtml(t(state.activeModule))}" title="${escapeHtml(t('Sections'))}" aria-haspopup="dialog" aria-expanded="false" ${showSections ? '' : 'hidden'}>${icon.sidebar}</button>
        <button class="mobile-details-trigger" type="button" data-mobile-details data-mobile-detail-module="${escapeHtml(state.activeModule)}" aria-label="${escapeHtml(t('Details'))}: ${escapeHtml(t(state.activeModule))}" title="${escapeHtml(t('Details'))}" aria-haspopup="dialog" aria-expanded="false" ${showDetails ? '' : 'hidden'}>${icon.inspector}</button>
        ${showModules ? `<nav class="topnav" aria-label="Project modules">
          ${modules.map(module => `
            <button
              class="tab ${
                    state.activeModule === module
                        ? 'active'
                        : ''
                }"
              type="button"
              data-module="${escapeHtml(module)}">
              ${escapeHtml(t(module))}
            </button>
          `).join('')}
          </nav>` : '<div style="flex:1"></div>'}
        <div class="top-actions">
          <button class="top-icon topbar-recording" type="button" data-topbar-recording ${appPerf.status().active ? '' : 'hidden'} aria-label="${escapeHtml(t('Stop recording and open Diagnostics'))}" title="${escapeHtml(t('Stop recording and open Diagnostics'))}">${icon.recording}</button>
          <button class="top-icon" type="button" data-topbar-help aria-haspopup="dialog" aria-label="Help">${icon.help}</button>
          ${showModules ? `<button class="top-icon has-dot" type="button" data-topbar-notifications aria-haspopup="dialog" aria-label="Notifications">${icon.bell}${state.unreadNotifications ? '<span class="topbar-dot" aria-hidden="true"></span>' : ''}</button>` : ''}
          <button class="top-icon" type="button" data-topbar-settings aria-haspopup="dialog" aria-label="Settings">${icon.settings}</button>
          <button class="avatar" type="button" data-topbar-profile aria-haspopup="dialog" aria-label="User profile">${signedLabel}</button>
        </div>
      `;
    topbar.querySelector('[data-home]')?.addEventListener('click', () =>
    {
        closeTopbarPopover();
        if (state.projectOpen) navigateToProjectModule(currentProjectId(), 'Projects');
        else
        {
            state.activeModule = 'Projects'; render();
        }
    });
    topbar.querySelectorAll('[data-app-navigation]').forEach(button => button.addEventListener('click', () => appNavigationGo(button.dataset.appNavigation)));
    appNavigationUpdateControls();
    topbar.querySelector('[data-mobile-menu]')?.addEventListener('click', () => openMobileSurface('modules'));
    topbar.querySelector('[data-mobile-sections]')?.addEventListener('click', () => openMobileSurface('sections'));
    topbar.querySelector('[data-mobile-details]')?.addEventListener('click', () => openMobileSurface('details'));
    topbar.querySelectorAll('[data-module]').forEach(button => button.addEventListener('click', () =>
    {
        closeTopbarPopover();
        if (state.projectOpen && state.activeModule === button.dataset.module)
        {
            if (button.dataset.module === 'Archive') archiveKeyboardReady(true);
            return;
        }
        navigateToProjectModule(currentProjectId(), button.dataset.module);
    }));
    topbar.querySelector('[data-topbar-recording]')?.addEventListener('click', () =>
    {
        appPerf.stop();
        syncDiagnosticsTopbar();
        topbar.querySelector('[data-topbar-settings]')?.focus();
        openGlobalSettingsModal('diagnostics');
    });
    topbar.querySelector('[data-topbar-help]')?.addEventListener('click', event =>
    {
        event.stopPropagation(); openTopbarPopover('help', event.currentTarget);
    });
    topbar.querySelector('[data-topbar-notifications]')?.addEventListener('click', event =>
    {
        event.stopPropagation(); openTopbarPopover('notifications', event.currentTarget);
    });
    topbar.querySelector('[data-topbar-settings]')?.addEventListener('click', event =>
    {
        event.stopPropagation(); closeTopbarPopover(); openGlobalSettingsModal();
    });
    topbar.querySelector('[data-topbar-profile]')?.addEventListener('click', event =>
    {
        event.stopPropagation(); openTopbarPopover('profile', event.currentTarget);
    });
    localizeUI(
        topbar,
        {
            suppressObserverReplay: true
        }
    );
}


function openTopbarPopover(type, anchor)
{
    closeMenu();
    closeTopbarPopover();
    const html = type === 'help' ? renderHelpPopover() : type === 'notifications' ? renderNotificationsPopover() : renderProfilePopover();
    const popover = document.createElement('div');
    popover.className = `topbar-popover ${type === 'notifications' ? 'wide' : ''}`;
    popover.id = 'topbarPopover';
    popover.setAttribute('role', 'dialog');
    popover.setAttribute('aria-label', type === 'help' ? 'Help center' : type === 'notifications' ? 'Notifications' : 'Profile menu');
    popover.innerHTML = html;
    document.body.appendChild(popover);
    const rect = anchor.getBoundingClientRect();
    const width = popover.offsetWidth || (type === 'notifications' ? 404 : 360);
    popover.style.top = `${rect.bottom + 8}px`;
    popover.style.left = `${Math.min(window.innerWidth - width - 12, Math.max(12, rect.right - width))}px`;
    bindTopbarPopover(popover, type);
    localizeUI(
        popover,
        {
            suppressObserverReplay: true
        }
    );
    setTimeout(() => document.addEventListener('click', closeTopbarPopoverOnOutside), 0);
}

function closeTopbarPopover()
{
    document.getElementById('topbarPopover')?.remove();
    document.removeEventListener('click', closeTopbarPopoverOnOutside);
}

function closeTopbarPopoverOnOutside(event)
{
    if (!event.target.closest('#topbarPopover') && !event.target.closest('[data-topbar-help], [data-topbar-notifications], [data-topbar-settings], [data-topbar-profile]')) closeTopbarPopover();
}

function geneographLandingUrl(path = '')
{
    const languagePath = state.language === 'ru' ? 'ru/' : '';
    return `https://geneograph.com/${languagePath}${path}`;
}

function renderHelpPopover()
{
    return `<div class="topbar-popover-header"><div><h2>Help center</h2><p>Find guides, shortcuts, and support for GeneoGraph.</p></div></div>
        <div class="topbar-popover-list">
            <button class="topbar-popover-row" type="button" data-help-tour>
                <span class="topbar-popover-icon topbar-topic-icon" aria-hidden="true">${icon.compass}</span>
                <span class="topbar-popover-copy"><strong>Take the tour</strong><span>Explore the sample project across GeneoGraph.</span></span>
                <span class="topbar-popover-arrow">${icon.chevron}</span>
            </button>
            <button class="topbar-popover-row help-center-unavailable" type="button" disabled>
                <span class="topbar-popover-icon topbar-topic-icon" aria-hidden="true">${icon.file}</span>
                <span class="topbar-popover-copy"><strong>Help center</strong><span>Coming later</span></span>
            </button>
        </div>
        <div class="topbar-popover-footer help-popover-footer">
            <a class="topbar-text-button" href="${geneographLandingUrl('contact.html')}" target="_blank" rel="noopener noreferrer" data-help-support>Contact support</a>
        </div>`;
}

function renderNotificationsPopover()
{
    const rows = projectNotifications().map(item => `<button class="topbar-popover-row" type="button" data-notification-id="${item.id}"><span class="topbar-popover-icon topbar-topic-icon ${item.tone === 'warn' ? 'warn' : item.tone === 'blue' ? 'blue' : item.tone === 'purple' ? 'purple' : ''}" aria-hidden="true">${item.icon}</span><span class="topbar-popover-copy"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.meta)}</span></span><span class="topbar-popover-arrow">${icon.chevron}</span></button>`).join('');
    return `<div class="topbar-popover-header"><div><h2>Notifications</h2><p>${state.unreadNotifications ? `${state.unreadNotifications} items need attention` : 'No unread notifications'}</p></div><button class="topbar-text-button" type="button" data-notifications-read>Mark all read</button></div><div class="topbar-popover-list">${rows}</div><div class="topbar-popover-footer"><button class="topbar-text-button" type="button" data-notifications-all>View all notifications</button></div>`;
}

function renderProfilePopover()
{
    if (!state.userSignedIn)
    {
        return `<div class="profile-popover-head">
          <div class="profile-popover-avatar">IN</div>
          <div>
            <strong>GeneoGraph account</strong>
            <span>You are not signed in.</span>
          </div>
        </div>
        <div class="topbar-popover-list">
          <button class="topbar-popover-row" type="button" data-profile-action="sign-in">
            <span class="topbar-popover-icon topbar-topic-icon" aria-hidden="true">${icon.profile}</span>
            <span class="topbar-popover-copy">
              <strong>Sign in</strong>
              <span>Connect your GeneoGraph account.</span>
            </span>
            <span class="topbar-popover-arrow" aria-hidden="true">${icon.chevron}</span>
          </button>
          <button class="topbar-popover-row" type="button" data-profile-action="create">
            <span class="topbar-popover-icon topbar-topic-icon blue" aria-hidden="true">${icon.plus}</span>
            <span class="topbar-popover-copy">
              <strong>Create account</strong>
              <span>Account creation is visual only.</span>
            </span>
            <span class="topbar-popover-arrow" aria-hidden="true">${icon.chevron}</span>
          </button>
        </div>`;
    }

    return `<div class="profile-popover-head">
        <div class="profile-popover-avatar">SW</div>
        <div>
          <strong>Silver Whiskerfield</strong>
          <span>silver@example.com</span>
            <span>Signed in</span>
          </span>
        </div>
      </div>
      <div class="topbar-popover-list">
        <button class="topbar-popover-row" type="button" data-profile-action="account">
          <span class="topbar-popover-icon topbar-topic-icon" aria-hidden="true">${icon.profile}</span>
          <span class="topbar-popover-copy">
            <strong>My account</strong>
            <span>Profile, subscription, and account details.</span>
          </span>
          <span class="topbar-popover-arrow" aria-hidden="true">${icon.chevron}</span>
        </button>
        <button class="topbar-popover-row" type="button" data-profile-action="account-settings">
          <span class="topbar-popover-icon topbar-topic-icon blue" aria-hidden="true">${icon.settings}</span>
          <span class="topbar-popover-copy">
            <strong>Account settings</strong>
            <span>Manage account preferences.</span>
          </span>
          <span class="topbar-popover-arrow" aria-hidden="true">${icon.chevron}</span>
        </button>
        <div class="topbar-divider"></div>
        <button class="topbar-popover-row" type="button" data-profile-action="sign-out">
          <span class="topbar-popover-icon topbar-topic-icon warn" aria-hidden="true">${icon.warning}</span>
          <span class="topbar-popover-copy">
            <strong>Sign out</strong>
            <span>Visual account action only.</span>
          </span>
          <span class="topbar-popover-arrow" aria-hidden="true">${icon.chevron}</span>
        </button>
      </div>`;
}

function bindTopbarPopover(popover, type)
{
    popover.querySelector('[data-help-tour]')?.addEventListener('click', () =>
    {
        closeTopbarPopover();
        startGeneoProductTour();
    });
    popover.querySelectorAll('[data-notification-id]').forEach(button => button.addEventListener('click', () => activateTopbarNotification(button.dataset.notificationId)));
    popover.querySelector('[data-notifications-read]')?.addEventListener('click', () =>
    {
        state.unreadNotifications = 0; closeTopbarPopover(); renderTopbar(); showToast('Notifications marked as read.');
    });
    popover.querySelector('[data-notifications-all]')?.addEventListener('click', () => showToast('Full notifications center is a placeholder.'));
    popover.querySelectorAll('[data-profile-action]').forEach(button => button.addEventListener('click', () => handleProfileAction(button.dataset.profileAction)));
}

function activateTopbarNotification(id)
{
    const item = projectNotifications().find(notification => notification.id === id);
    if (!item) return;
    closeTopbarPopover();
    if (item.openSide)
    {
        runAfterProjectSettingsGuard(() =>
        {
            state.activeModule = 'Projects';
            state.openSide = item.openSide;
            persistProjectContinuation({ projectId: currentProjectId(), module: 'Projects', openedAt: new Date().toISOString() });
            render();
        });
        return;
    }
    if (item.module && state.projectOpen)
    {
        if (item.module === 'Places' && item.placesView === 'review')
        {
            state.placesView = 'review';
            state.placesSearch = '';
        }
        navigateToProjectModule(currentProjectId(), item.module);
        return;
    }
    showToast(item.title);
}

function handleProfileAction(action)
{
    if (action === 'sign-out')
    {
        state.userSignedIn = false;
        closeTopbarPopover();
        renderTopbar();
        showToast('Signed out visually for this prototype.');
        return;
    }
    if (action === 'sign-in')
    {
        state.userSignedIn = true;
        closeTopbarPopover();
        renderTopbar();
        showToast('Signed in visually for this prototype.');
        return;
    }
    if (action === 'account-settings')
    {
        closeTopbarPopover();
        openGlobalSettingsModal('general');
        return;
    }
    showToast(`${action === 'account' ? 'My account' : 'Account'} flow is a visual placeholder.`);
}

function normalizeGlobalSettingsSection(section)
{
    return ['general', 'storage', 'diagnostics', 'about'].includes(section) ? section : 'general';
}

function openGlobalSettingsModal(section = state.globalSettingsSection)
{
    closeTopbarPopover();
    if (modalBackdrop.classList.contains('open')) closeModal();
    state.globalSettingsSection = normalizeGlobalSettingsSection(section);
    openModal(`<div class="modal global-settings-modal" role="dialog" aria-modal="true" aria-labelledby="globalSettingsTitle"><div class="modal-header"><div><h2 id="globalSettingsTitle">Global settings</h2><p>App-wide preferences for GeneoGraph. Project-specific settings stay inside each project.</p></div><button class="close-button" type="button" data-close aria-label="Close">${icon.close}</button></div><div class="modal-body"><div class="global-settings-layout"><nav class="global-settings-nav" aria-label="Global settings sections">${renderGlobalSettingsNav()}</nav><section class="global-settings-panel" aria-labelledby="globalSettingsPanelTitle" tabindex="0">${renderGlobalSettingsPanel(state.globalSettingsSection)}</section></div></div><div class="modal-footer"><button class="button secondary" type="button" data-close>Close</button></div></div>`);
    modalBackdrop.querySelectorAll('[data-global-settings-section]').forEach(button =>
        button.addEventListener('click', () => selectGlobalSettingsSection(button.dataset.globalSettingsSection)));
    bindGlobalSettingsPanel(modalBackdrop);
}

function selectGlobalSettingsSection(section, refresh = false)
{
    const panel = modalBackdrop.querySelector('.global-settings-panel');
    if (!panel) return;
    const next = normalizeGlobalSettingsSection(section);
    const same = next === state.globalSettingsSection;
    if (same && !refresh) return;
    const scrollTop = same ? panel.scrollTop : 0;
    state.globalSettingsSection = next;
    modalBackdrop.querySelectorAll('[data-global-settings-section]').forEach(button =>
    {
        const active = button.dataset.globalSettingsSection === next;
        button.classList.toggle('active', active);
        if (active) button.setAttribute('aria-current', 'true');
        else button.removeAttribute('aria-current');
    });
    panel.innerHTML = renderGlobalSettingsPanel(next);
    bindGlobalSettingsPanel(modalBackdrop);
    panel.scrollTop = scrollTop;
}

function bindGlobalSettingsPanel(root)
{
    root.querySelector('#globalThemeSelect')?.addEventListener('change', event =>
    {
        window.geneographTheme.setPreference(event.target.value);
    });
    root.querySelector('#globalLanguageSelect')?.addEventListener('change', event =>
    {
        setLanguage(event.target.value, false);
        render();
        if (root.querySelector('.global-settings-panel'))
        {
            selectGlobalSettingsSection(state.globalSettingsSection, true);
            root.querySelector('#globalLanguageSelect')?.focus({ preventScroll: true });
        }
        else openGlobalSettingsModal(state.globalSettingsSection);
        showToast('Interface language updated.');
    });
    root.querySelector('[data-global-settings-tour]')?.addEventListener('click', () =>
    {
        closeModal();
        startGeneoProductTour();
    });
    root.querySelector('[data-copy-build-info]')?.addEventListener('click', () => copyPrototypeBuildInfo(root));
    bindDiagnosticsSettings(root);
    localizeUI(root);
}

function renderGlobalSettingsNav()
{
    const sections = [
        ['general', 'General', icon.settings],
        ['storage', 'Storage & backup', icon.syncoffline],
        ['diagnostics', 'Diagnostics', icon.recording],
        ['about', 'About', icon.info]
    ];

    return sections.map(([id, label, glyph]) => `<button class="global-settings-nav-button ${state.globalSettingsSection === id ? 'active' : ''}" type="button" data-global-settings-section="${id}" ${state.globalSettingsSection === id ? 'aria-current="true"' : ''}>
        <span class="global-settings-nav-icon" aria-hidden="true">${glyph}</span>
        <span class="global-settings-nav-label">${escapeHtml(label)}</span>
      </button>`).join('');
}

function renderPrototypeBuildInfo()
{
    const version = prototypeBuildCopyText();
    const copyLabel = escapeHtml(t('Copy version information'));
    return `<div class="global-settings-row about-version-row"><div><strong>${escapeHtml(t('Version'))}</strong>
        <span class="about-version-value">${escapeHtml(version)}</span>
        <input class="about-version-copy-fallback" type="text" readonly hidden data-build-copy-fallback aria-label="${escapeHtml(t('Version information'))}"></div>
        <button class="control-icon-button about-version-copy" type="button" data-copy-build-info aria-label="${copyLabel}" title="${copyLabel}">${icon.copy}</button></div>`;
}

function prototypeBuildCopyText()
{
    const info = geneographBuildInfo;
    if (info.version) return info.version + '-' + info.shortRevision;
    if (info.shortRevision) return t('Development build') + ' (' + info.shortRevision + ')';
    return t('Local development build');
}

async function copyPrototypeBuildInfo(root)
{
    const value = prototypeBuildCopyText();
    try
    {
        if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
        await navigator.clipboard.writeText(value);
        showToast('Version information copied.');
    }
    catch
    {
        const field = root.querySelector('[data-build-copy-fallback]');
        if (!field) return;
        field.hidden = false;
        field.value = value;
        field.focus();
        field.select();
        showToast('Copy the selected version information manually.');
    }
}

function renderGlobalSettingsGroup(label, content, className = '')
{
    return `<div class="global-settings-group ${className}"><h4>${escapeHtml(t(label))}</h4><div class="global-settings-section">${content}</div></div>`;
}

function renderGlobalSettingsPanel(section)
{
    if (section === 'diagnostics') return diagnosticsSettingsMarkup();
    if (section === 'storage') return `<h3 id='globalSettingsPanelTitle'>Storage & backup</h3><p>Backup and sync are not available in this demo.</p><div class='global-settings-section'><div class='global-settings-row'><div><strong>Local backups</strong><span>This demo cannot create backup files.</span></div></div><div class='global-settings-row'><div><strong>Cloud sync</strong><span>This demo does not connect to cloud storage.</span></div></div></div>`;
    if (section === 'about') return `<h3 id='globalSettingsPanelTitle'>About GeneoGraph</h3><p>Prototype information and useful links.</p>
        ${renderGlobalSettingsGroup('Application', renderPrototypeBuildInfo() + `<div class='global-settings-row'><div><strong>GeneoGraph website</strong><span>Learn more about GeneoGraph.</span></div><a class='text-action about-link' href='${geneographLandingUrl()}' target='_blank' rel='noopener noreferrer'>Visit website</a></div>`, 'about-settings')}
        ${renderGlobalSettingsGroup('Legal & credits', `<div class='global-settings-row'><div><strong>Privacy policy</strong><span>Read how GeneoGraph handles privacy.</span></div><a class='text-action about-link' href='${geneographLandingUrl('legal.html#privacy')}' target='_blank' rel='noopener noreferrer'>Read policy</a></div><div class='global-settings-row'><div><strong>${escapeHtml(t('Open-source licenses'))}</strong><span>${escapeHtml(t('Application license and third-party notices.'))}</span></div><a class='text-action about-link' href='${geneographLandingUrl('legal.html#licenses')}' target='_blank' rel='noopener noreferrer'>${escapeHtml(t('View licenses'))}</a></div><div class='global-settings-row'><div><strong>${escapeHtml(t('Data providers'))}</strong><span>${escapeHtml(t('Place search providers'))}: <a href='https://www.geoapify.com/' target='_blank' rel='noopener noreferrer'>Powered by Geoapify</a> · <a href='https://locationiq.com' target='_blank' rel='noopener noreferrer'>Search by LocationIQ.com</a>. ${escapeHtml(t('Map data'))}: <a href='https://openfreemap.org/' target='_blank' rel='noopener noreferrer'>OpenFreeMap</a> · <a href='https://www.openstreetmap.org/copyright' target='_blank' rel='noopener noreferrer'>OpenStreetMap</a>.</span></div></div>`, 'about-settings')}`;
    return `<h3 id='globalSettingsPanelTitle'>General</h3><p>Basic app-wide preferences.</p>
        ${renderGlobalSettingsGroup('Appearance', `<div class='global-settings-row'><div><strong>Interface theme</strong><span>Choose the app appearance.</span></div><span class='common-select-shell global-settings-select-shell'><select class='common-select' id='globalThemeSelect' aria-label='Interface theme'><option value='system' ${window.geneographTheme.getPreference() === 'system' ? 'selected' : ''}>System</option><option value='dark' ${window.geneographTheme.getPreference() === 'dark' ? 'selected' : ''}>Dark</option><option value='light' ${window.geneographTheme.getPreference() === 'light' ? 'selected' : ''}>Light</option></select><span class='common-select-chevron' aria-hidden='true'>${icon.chevron}</span></span></div>`)}
        ${renderGlobalSettingsGroup('Regional preferences', `<div class='global-settings-row'><div><strong>Language</strong><span>App interface language.</span></div><span class='common-select-shell global-settings-select-shell'><select class='common-select' id='globalLanguageSelect' aria-label='Language'><option value='en' ${state.language === 'en' ? 'selected' : ''}>English</option><option value='ru' ${state.language === 'ru' ? 'selected' : ''}>Русский</option></select><span class='common-select-chevron' aria-hidden='true'>${icon.chevron}</span></span></div>`)}
        ${renderGlobalSettingsGroup('Product tour', `<div class='global-settings-row'><div><span>Explore the sample project across GeneoGraph.</span></div><button class='button secondary' type='button' data-global-settings-tour>Take the tour</button></div>`)}`;
}


function syncDiagnosticsTopbar()
{
    const button = topbar.querySelector('[data-topbar-recording]');
    if (button) button.hidden = !appPerf.status().active;
}

function diagnosticsView(status, config)
{
    const ready = !status.active && !status.count;
    return {
        ready, active: status.active, results: !status.active && status.count > 0,
        canStart: config.scope !== 'selected' || config.modules.length > 0,
        confirmNew: !status.active && status.count > 0 && !status.exported,
        heading: status.active ? 'Recording in progress' : ready ? 'Ready to record'
            : status.exported ? 'Recording exported' : 'Recording ready to export',
        description: status.active ? 'You can continue using GeneoGraph while recording.'
            : ready ? status.emptyStop ? 'No operations were recorded. Start a new recording to try again.'
                : 'Start recording to measure application performance.'
            : 'Your recording is complete and can be exported for review.'
    };
}

function diagnosticsStartFresh(recording, confirmed = false)
{
    const status = appPerf.status(), view = diagnosticsView(status, appPerf.settings());
    if (status.recording !== recording || status.active || !view.canStart || (view.confirmNew && !confirmed)) return false;
    appPerf.clear();
    const started = appPerf.start();
    if (started && typeof archiveDiagnosticAttachCurrent === 'function') archiveDiagnosticAttachCurrent();
    return started;
}

function diagnosticsModeDescription(mode)
{
    return mode === 'basic' ? 'Operation durations and outcomes.'
        : 'Operation durations, outcomes, available stage timings and counters.';
}

function diagnosticsSettingsMarkup()
{
    const config = appPerf.settings();
    const disabled = appPerf.status().active ? 'disabled' : '';
    const label = text => escapeHtml(t(text));
    const option = (value, text, selected) =>
        '<option value="' + value + '"' + (selected ? ' selected' : '') + '>' + label(text) + '</option>';
    const select = (id, options) =>
        '<span class="common-select-shell global-settings-select-shell"><select class="common-select" id="'
        + id + '"' + (id === 'diagnosticsMode' ? ' aria-describedby="diagnosticsModeDescription"' : '') + ' ' + disabled + '>' + options + '</select><span class="common-select-chevron" aria-hidden="true">'
        + icon.chevron + '</span></span>';
    const button = (action, style, artwork, text) => '<button class="button ' + style
        + '" type="button" data-performance-' + action + ' hidden>' + artwork + label(text) + '</button>';
    return '<h3 id="globalSettingsPanelTitle">' + label('Diagnostics') + '</h3>'
        + '<p>' + label('Record anonymous application timings locally. Export manually; no genealogy data is included.') + '</p>'
        + '<div class="global-settings-section diagnostics-settings" data-diagnostics-settings><div class="diagnostics-configuration">'
        + '<div class="global-settings-row"><label for="diagnosticsScope">' + label('Recording scope') + '</label>'
        + select('diagnosticsScope', option('all', 'Entire application', config.scope === 'all')
            + option('selected', 'Selected modules', config.scope === 'selected')) + '</div>'
        + '<fieldset class="diagnostics-modules" aria-label="' + label('Selected modules') + '" data-diagnostics-modules ' + (config.scope === 'all' ? 'hidden' : '') + ' ' + disabled + '>'
        + '<div class="diagnostics-module-actions"><span class="diagnostics-modules-caption">' + label('Modules') + '</span><button type="button" class="text-action" data-diagnostics-all>'
        + label('Select all') + '</button><button type="button" class="text-action" data-diagnostics-none>'
        + label('Unselect all') + '</button></div><div class="diagnostics-module-grid">'
        + appPerf.selectableModules.map(module => '<label class="checkbox-row"><input type="checkbox" data-diagnostics-module value="' + escapeHtml(module)
            + '" ' + (config.modules.includes(module) ? 'checked' : '') + '>' + label(module) + '</label>').join('')
        + '</div><p class="field-help diagnostics-hint" data-diagnostics-hint hidden>' + label('Select at least one module to start recording.') + '</p></fieldset>'
        + '<div class="global-settings-row"><div class="diagnostics-mode-copy"><label for="diagnosticsMode">' + label('Recording mode') + '</label>'
        + '<p class="field-help" id="diagnosticsModeDescription">' + label(diagnosticsModeDescription(config.mode)) + '</p></div>'
        + select('diagnosticsMode', option('basic', 'Basic', config.mode === 'basic')
            + option('detailed', 'Detailed', config.mode === 'detailed')) + '</div></div>'
        + '<div class="diagnostics-status">'
        + '<div class="diagnostics-status-heading" role="status"><span data-performance-indicator aria-hidden="true"></span><strong data-performance-status></strong></div>'
        + '<div class="diagnostics-metrics" data-performance-metrics hidden>'
        + '<div><span>' + label('Operations recorded') + '</span><strong data-performance-count></strong></div>'
        + '<div data-performance-drop-metric><span>' + label('Dropped operations') + '</span><strong data-performance-dropped></strong></div></div>'
        + '<p class="field-help diagnostics-warning" data-performance-warning hidden>' + label('The recording buffer is full. Older operations have been replaced.') + '</p>'
        + '<p class="field-help" data-performance-description></p>'
        + '<div class="diagnostics-actions">'
        + button('start', 'primary', icon.play, 'Start recording')
        + button('stop', 'danger-filled', icon.stopSquare, 'Stop recording')
        + button('export', 'primary', icon.download, 'Export recording')
        + button('new', 'secondary', icon.play, 'New recording')
        + button('clear', 'ghost diagnostics-discard', icon.trash, 'Discard recording')
        + '</div></div></div>';
}

function bindDiagnosticsSettings(root)
{
    const panel = root.querySelector('[data-diagnostics-settings]');
    if (!panel) return;
    const q = selector => panel.querySelector(selector);
    const scope = q('#diagnosticsScope'), mode = q('#diagnosticsMode');
    const moduleFields = q('[data-diagnostics-modules]');
    const moduleInputs = [...panel.querySelectorAll('[data-diagnostics-module]')];
    const all = q('[data-diagnostics-all]'), none = q('[data-diagnostics-none]');
    const start = q('[data-performance-start]'), stop = q('[data-performance-stop]');
    const fresh = q('[data-performance-new]'), discard = q('[data-performance-clear]'), exportButton = q('[data-performance-export]');
    const statusText = q('[data-performance-status]'), countText = q('[data-performance-count]'), droppedText = q('[data-performance-dropped]');
    const dropMetric = q('[data-performance-drop-metric]'), warning = q('[data-performance-warning]');
    let timer = null;
    const updateText = (element, value) =>
    {
        const text = String(value);
        if (element.textContent !== text) element.textContent = text;
    };
    const updateCounts = status =>
    {
        updateText(countText, status.count);
        updateText(droppedText, status.dropped);
        dropMetric.hidden = status.active && status.dropped === 0;
        dropMetric.classList.toggle('diagnostics-warning', status.dropped > 0);
        warning.hidden = status.dropped === 0;
    };
    const update = () =>
    {
        const status = appPerf.status(), config = appPerf.settings(), view = diagnosticsView(status, config);
        scope.value = config.scope;
        mode.value = config.mode;
        updateText(q('#diagnosticsModeDescription'), t(diagnosticsModeDescription(config.mode)));
        scope.disabled = mode.disabled = moduleFields.disabled = status.active;
        moduleInputs.forEach(input => { input.checked = config.modules.includes(input.value); });
        moduleFields.hidden = config.scope === 'all';
        all.disabled = status.active || config.modules.length === appPerf.selectableModules.length;
        none.disabled = status.active || config.modules.length === 0;
        q('[data-diagnostics-hint]').hidden = config.scope === 'all' || config.modules.length > 0;
        start.hidden = !view.ready;
        stop.hidden = !view.active;
        fresh.hidden = discard.hidden = exportButton.hidden = !view.results;
        start.disabled = fresh.disabled = !view.canStart;
        const indicator = q('[data-performance-indicator]');
        const indicatorState = view.active ? 'active' : view.results ? 'success' : 'neutral';
        if (indicator.dataset.state !== indicatorState)
        {
            indicator.dataset.state = indicatorState;
            indicator.innerHTML = view.results ? icon.check : '';
        }
        updateText(statusText, t(view.heading));
        updateText(q('[data-performance-description]'), t(view.description));
        q('[data-performance-metrics]').hidden = view.ready;
        updateCounts(status);
        syncDiagnosticsTopbar();
        if (view.active && timer === null)
            timer = setInterval(() =>
            {
                if (!panel.isConnected || !root.classList.contains('open') || !appPerf.status().active)
                {
                    clearInterval(timer);
                    timer = null;
                    if (panel.isConnected && root.classList.contains('open')) update();
                    return;
                }
                updateCounts(appPerf.status());
            }, 500);
    };
    const configure = () =>
    {
        appPerf.configure({ scope: scope.value, mode: mode.value,
            modules: moduleInputs.filter(input => input.checked).map(input => input.value) });
        update();
    };
    const selectModules = modules =>
    {
        appPerf.configure({ modules });
        update();
        // Bulk action may become disabled; keep focus in the same controls.
        (all.disabled ? none : all).focus({ preventScroll: true });
    };
    scope.addEventListener('change', configure);
    mode.addEventListener('change', configure);
    moduleInputs.forEach(input => input.addEventListener('change', configure));
    all.addEventListener('click', () => selectModules(appPerf.selectableModules));
    none.addEventListener('click', () => selectModules([]));
    const confirm = (title, message, action, onConfirm) =>
    {
        openNestedModal('<section class="modal" role="dialog" aria-modal="true" aria-labelledby="diagnosticsConfirmTitle">'
            + '<header class="modal-header"><h2 id="diagnosticsConfirmTitle">' + escapeHtml(t(title)) + '</h2></header>'
            + '<div class="modal-body"><p>' + escapeHtml(t(message)) + '</p></div>'
            + '<footer class="modal-footer"><button type="button" class="button secondary" data-close>' + escapeHtml(t('Cancel'))
            + '</button><button type="button" class="button danger" data-diagnostics-confirm>'
            + escapeHtml(t(action)) + '</button></footer></section>');
        modalBackdrop.querySelector('[data-diagnostics-confirm]').addEventListener('click', () =>
        {
            closeModal({ force: true });
            onConfirm();
            update();
            requestAnimationFrame(() => (appPerf.status().active ? stop : appPerf.status().count ? exportButton : start).focus({ preventScroll: true }));
        });
    };
    const begin = () =>
    {
        const status = appPerf.status(), view = diagnosticsView(status, appPerf.settings());
        if (!view.canStart || status.active) return;
        if (view.confirmNew)
            confirm('Replace unexported recording?', 'The retained recording will be discarded without exporting.',
                'New recording', () => diagnosticsStartFresh(status.recording, true));
        else if (diagnosticsStartFresh(status.recording))
        {
            update();
            stop.focus({ preventScroll: true });
        }
    };
    start.addEventListener('click', begin);
    fresh.addEventListener('click', begin);
    stop.addEventListener('click', () =>
    {
        appPerf.stop();
        update();
        (appPerf.status().count ? exportButton : start).focus({ preventScroll: true });
    });
    discard.addEventListener('click', () =>
    {
        const status = appPerf.status();
        if (status.active || !status.count) return;
        confirm('Discard recording?', 'The retained performance recording will be permanently discarded.', 'Discard recording', () =>
        {
            const current = appPerf.status();
            if (!current.active && current.recording === status.recording) appPerf.clear();
        });
    });
    exportButton.addEventListener('click', () =>
    {
        if (!appPerf.download()) showToast(t('Recording could not be exported.'));
        update();
    });
    update();
}
