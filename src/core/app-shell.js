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
            if (destination === 'library')
            {
                if (state.activeModule === 'Family Tree') captureTreeCanvasScroll(currentProjectId());
                if (state.activeModule === 'Geneograph' && state.geneoView === 'board') captureGeneographViewport();
                state.projectOpen = false;
                state.currentProjectId = null;
                state.activeModule = 'Projects';
                render();
            }
            else navigateToProjectModule(currentProjectId(), destination === 'overview' ? 'Projects' : destination);
            requestAnimationFrame(() =>
            {
                main.tabIndex = -1;
                main.focus({ preventScroll: true });
            });
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
    if (location.placeId && !(sampleData.places || []).some(place => place.id === location.placeId && place.projectId === projectId && !place.deleted)) return false;
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
    if (state.activeModule === 'Archive') runAfterArchiveFileEditGuard(commit);
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
    if (typeof archiveImageSyncLifecycle === 'function') archiveImageSyncLifecycle();
    appNavigationObserve();
    if (mobileSurface !== 'details' || mobileDetailModule !== state.activeModule)
        closeMobileSurface(false);
    geneoProductTourOnRender();
    closeMenu();
    disposeTreeSearch();

    if (state.activeModule !== 'Notes')
    {
        destroyNotesRichTextEditor();
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

function restoreSearchInputFocus(selector, selectionStart, selectionEnd)
{
    requestAnimationFrame(() =>
    {
        const input = document.querySelector(selector);
        if (!input) return;
        input.focus({ preventScroll: true });
        if (typeof input.setSelectionRange !== 'function') return;
        const valueLength = input.value.length;
        const start = Math.min(selectionStart ?? valueLength, valueLength);
        const end = Math.min(selectionEnd ?? start, valueLength);
        input.setSelectionRange(start, end);
    });
}

function handleSearchInput(event, { stateKey, render, selector })
{
    const input = event.target;
    const nextValue = input.value;
    const fallbackPosition = nextValue.length;
    const selectionStart = typeof input.selectionStart === 'number' ? input.selectionStart : fallbackPosition;
    const selectionEnd = typeof input.selectionEnd === 'number' ? input.selectionEnd : selectionStart;
    state[stateKey] = nextValue;
    render();
    restoreSearchInputFocus(selector || `#${input.id}`, selectionStart, selectionEnd);
}

function bindSearchInput(root, selector, stateKey, render)
{
    root.querySelector(selector)?.addEventListener('input', event => handleSearchInput(event, { stateKey, render, selector }));
}

function renderTopbar()
{
    const showModules = state.projectOpen;
    const showSections = showModules && state.activeModule !== 'Family Tree';
    const showDetails = showModules && ['Family Tree', 'People', 'Albums', 'Archive', 'Places', 'Geneograph'].includes(state.activeModule)
        && !(state.activeModule === 'Family Tree' && !currentTreePeople().length)
        && !(state.activeModule === 'People' && !currentPeopleRecords().length)
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
          ${showModules ? `<div class="global-search">${icon.search}<span>Search anything...</span><span class="shortcut">Ctrl + K</span></div>` : ''}
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
        if (state.projectOpen && state.activeModule === button.dataset.module) return;
        navigateToProjectModule(currentProjectId(), button.dataset.module);
    }));
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
            <a class="topbar-text-button" href="https://geneograph.com/contact.html" target="_blank" rel="noopener noreferrer" data-help-support>Contact support</a>
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
        state.activeModule = 'Projects';
        state.openSide = item.openSide;
        persistProjectContinuation({ projectId: currentProjectId(), module: 'Projects', openedAt: new Date().toISOString() });
        render();
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

let globalSettingsStartupPreview = 'picker';

function openGlobalSettingsModal(section = state.globalSettingsSection, preservePreview = false)
{
    closeTopbarPopover();
    if (modalBackdrop.classList.contains('open')) closeModal();
    if (!preservePreview) globalSettingsStartupPreview = 'picker';
    state.globalSettingsSection = ['general', 'storage', 'about'].includes(section) ? section : 'general';
    openModal(`<div class="modal global-settings-modal" role="dialog" aria-modal="true" aria-labelledby="globalSettingsTitle"><div class="modal-header"><div><h2 id="globalSettingsTitle">Global settings</h2><p>App-wide preferences for GeneoGraph. Project-specific settings stay inside each project.</p></div><button class="close-button" type="button" data-close>${icon.close}</button></div><div class="modal-body" style="padding:0"><div class="global-settings-layout"><nav class="global-settings-nav" aria-label="Global settings sections">${renderGlobalSettingsNav()}</nav><section class="global-settings-panel">${renderGlobalSettingsPanel(state.globalSettingsSection)}</section></div></div><div class="modal-footer"><button class="button secondary" type="button" data-close>Close</button></div></div>`);
    modalBackdrop.querySelectorAll('[data-global-settings-section]').forEach(button => button.addEventListener('click', () => openGlobalSettingsModal(button.dataset.globalSettingsSection, true)));
    modalBackdrop.querySelector('#globalStartupPreview')?.addEventListener('change', event =>
    {
        globalSettingsStartupPreview = event.target.value;
    });
    modalBackdrop.querySelector('#globalLanguageSelect')?.addEventListener('change', event =>
    {
        setLanguage(event.target.value, false);
        render();
        openGlobalSettingsModal(state.globalSettingsSection, true);
        showToast(
            'Interface language updated.'
        );
    });
    modalBackdrop.querySelector('[data-global-settings-tour]')?.addEventListener('click', () =>
    {
        closeModal();
        startGeneoProductTour();
    });
    localizeUI(modalBackdrop);
}

function renderGlobalSettingsNav()
{
    const sections = [
        ['general', 'General', icon.settings],
        ['storage', 'Storage & backup', icon.syncoffline],
        ['about', 'About', icon.info]
    ];

    return sections.map(([id, label, glyph]) => `<button class="global-settings-nav-button ${state.globalSettingsSection === id ? 'active' : ''}" type="button" data-global-settings-section="${id}">
        <span class="global-settings-nav-icon" aria-hidden="true">${glyph}</span>
        <span class="global-settings-nav-label">${escapeHtml(label)}</span>
      </button>`).join('');
}

function renderGlobalSettingsPanel(section)
{
    if (section === 'storage') return `<h3>Storage & backup</h3><p>Backup and sync are not available in this demo.</p><div class='global-settings-section'><div class='global-settings-row'><div><strong>Local backups</strong><span>This demo cannot create backup files.</span></div></div><div class='global-settings-row'><div><strong>Cloud sync</strong><span>This demo does not connect to cloud storage.</span></div></div></div>`;
    if (section === 'about') return `<h3>About GeneoGraph</h3><p>Prototype information and useful links.</p><div class='global-settings-section'><div class='global-settings-row'><div><strong>GeneoGraph prototype</strong><span>Version 0.1 prototype - local-first genealogy workspace</span></div></div><div class='global-settings-row'><div><strong>Product tour</strong><span>Explore the sample project across GeneoGraph.</span></div><button class='button secondary' type='button' data-global-settings-tour>Take the tour</button></div><div class='global-settings-row'><div><strong>Help center</strong><span>Coming soon</span></div><button class='button secondary global-settings-unavailable' type='button' disabled>Open</button></div><div class='global-settings-row'><div><strong>Privacy policy</strong><span>Read how GeneoGraph handles privacy.</span></div><a class='button secondary' href='https://geneograph.com/privacy.html' target='_blank' rel='noopener noreferrer'>Read policy</a></div><div class='global-settings-row'><div><strong>Contact us</strong><span>Get in touch with the GeneoGraph team.</span></div><a class='button secondary' href='https://geneograph.com/contact.html' target='_blank' rel='noopener noreferrer'>Contact us</a></div><div class='global-settings-row'><div><strong>GeneoGraph website</strong><span>Learn more about GeneoGraph.</span></div><a class='button secondary' href='https://geneograph.com/' target='_blank' rel='noopener noreferrer'>Visit website</a></div></div>`;
    return `<h3>General</h3><p>Basic app-wide preferences.</p><div class='global-settings-section'><div class='global-settings-row'><div><strong>Interface theme</strong><span>GeneoGraph currently uses the dark theme.</span></div><span class='global-settings-value'>Dark</span></div><div class='global-settings-row'><div><strong>Startup behavior</strong><span>Preview only; this choice does not change what opens when the demo starts.</span></div><select class='global-settings-control' id='globalStartupPreview' aria-label='Startup behavior'><option value='picker' ${globalSettingsStartupPreview === 'picker' ? 'selected' : ''}>Show project picker</option><option value='last' ${globalSettingsStartupPreview === 'last' ? 'selected' : ''}>Open last project</option></select></div><div class='global-settings-row'><div><strong>Language</strong><span>App interface language.</span></div><select class='global-settings-control' id='globalLanguageSelect' aria-label='Language'><option value='en' ${state.language === 'en' ? 'selected' : ''}>English</option><option value='ru' ${state.language === 'ru' ? 'selected' : ''}>Русский</option></select></div><div class='global-settings-row'><div><strong>Time zone</strong><span>Used for activity timestamps.</span></div><span class='global-settings-value'>System default</span></div></div>`;
}

