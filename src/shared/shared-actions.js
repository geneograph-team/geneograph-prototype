function renderModulePlaceholder()
{
    sidebar.innerHTML = `<div class="side-section-title">Current project</div><button class="side-link" type="button" data-back-project>${icon.home}<span>Project overview</span></button>`;
    sidebar.querySelector('[data-back-project]').addEventListener('click', () => navigateToProjectModule(currentProjectId(), 'Projects'));
    main.innerHTML = `<div class="placeholder"><div class="placeholder-card"><h1>${escapeHtml(state.activeModule)}</h1><p>This module will be built in a later iteration. The Projects tab already exposes it once a project is open.</p></div></div>`;
}

function projectDateTimestamp(value)
{
    if (value instanceof Date)
    {
        const timestamp = value.getTime();

        return Number.isFinite(timestamp)
            ? timestamp
            : null;
    }

    if (
        typeof value === 'number'
        && Number.isFinite(value)
    )
    {
        return value;
    }

    const source =
        String(value || '').trim();

    if (!source)
    {
        return null;
    }

    const timestamp =
        Date.parse(source);

    return Number.isFinite(timestamp)
        ? timestamp
        : null;
}

function formatProjectDate(
    value,
    fallback = t('Unknown')
)
{
    const timestamp =
        projectDateTimestamp(value);

    if (timestamp === null)
    {
        return fallback;
    }

    const date =
        new Date(timestamp);

    const locale =
        state.language === 'ru'
            ? 'ru-RU'
            : 'en-GB';

    return new Intl.DateTimeFormat(
        locale,
        {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        }
    )
        .format(date)
        .replace(
            /\s?г\.$/u,
            ''
        );
}

function projectModifiedTimestamp(project)
{
    const preferred = Date.parse(project?.modifiedAt || '');
    if (Number.isFinite(preferred)) return preferred;
    const legacy = Date.parse(project?.modified || '');
    return Number.isFinite(legacy) ? legacy : Number.NEGATIVE_INFINITY;
}

function projectCreatedTimestamp(project)
{
    const preferred =
        Date.parse(
            project?.createdAt || ''
        );

    if (
        Number.isFinite(preferred)
    )
    {
        return preferred;
    }

    const legacy =
        Date.parse(
            project?.created || ''
        );

    return Number.isFinite(legacy)
        ? legacy
        : Number.NEGATIVE_INFINITY;
}

function formatProjectCreated(
    project,
    prefix = 'Created'
)
{
    const timestamp =
        projectCreatedTimestamp(
            project
        );

    return `${t(prefix)} ${
        formatProjectDate(
            timestamp,
            t('Unknown')
        )
    }`;
}

function formatProjectModified(
    project,
    prefix = 'Modified'
)
{
    const timestamp =
        projectModifiedTimestamp(
            project
        );

    return `${t(prefix)} ${
        formatProjectDate(
            timestamp,
            t('Unknown')
        )
    }`;
}

function touchProjectModified(project)
{
    if (project) project.modifiedAt = new Date().toISOString();
}

function updateProjectName(projectId, value)
{
    const project = sampleData.projects.find(item => item.id === projectId);
    const name = cleanEditFieldValue(value);
    if (!project || !name) return false;
    project.name = name;
    touchProjectModified(project);
    return true;
}

const PROJECT_COVER_STYLES = [
    'paper',
    'tree',
    'golden-tree',
    'photo'
];
const GOLDEN_TREE_COVER_SRC = 'assets/covers/panoramic-golden-family-tree-landscape.jpg';

function normalizeProjectCoverPosition(position)
{
    const clamp = value => Math.max(0, Math.min(100, Number(value)));
    return {
        x: Number.isFinite(Number(position?.x)) ? clamp(position.x) : 50,
        y: Number.isFinite(Number(position?.y)) ? clamp(position.y) : 50
    };
}

function isProjectCoverStyle(
    coverStyle
)
{
    return PROJECT_COVER_STYLES
        .includes(coverStyle);
}

function normalizeProjectCoverStyle(
    coverStyle
)
{
    return isProjectCoverStyle(
        coverStyle
    )
        ? coverStyle
        : 'paper';
}

function projectCoverImageSource(project)
{
    if (project?.cover === 'golden-tree') return GOLDEN_TREE_COVER_SRC;
    if (!project || project.cover !== 'photo') return '';
    const photo = project.coverPhotoId
        ? getPhoto(project.coverPhotoId, { projectId: project.id })
        : null;
    return photo?.src || project.coverImageSrc || '';
}

function resolvedProjectCoverStyle(project)
{
    const style = normalizeProjectCoverStyle(project?.cover);
    return style === 'photo' && !projectCoverImageSource(project) ? 'paper' : style;
}

function projectCoverCssUrl(source)
{
    return new URL(String(source).replace(/['"\\\r\n]/g, ''), document.baseURI).href;
}

function projectHeroCoverStyleAttribute(project)
{
    const source = projectCoverImageSource(project);
    if (!source) return '';
    const position = normalizeProjectCoverPosition(project.coverPosition);
    return `--project-hero-cover:url('${projectCoverCssUrl(source)}');--cover-position:${position.x}% ${position.y}%`;
}

function projectCoverStyleAttribute(
    coverStyle,
    photoSource = '',
    position = null
)
{
    const normalizedCover =
        normalizeProjectCoverStyle(
            coverStyle
        );

    if (
        normalizedCover === 'paper'
    )
    {
        return `--cover:url('${projectCoverCssUrl('assets/covers/archival-project-cover.jpg')}');background-size:cover;background-position:center;`;
    }

    const imageSource = normalizedCover === 'golden-tree'
        ? GOLDEN_TREE_COVER_SRC : photoSource;
    if ((normalizedCover === 'photo' || normalizedCover === 'golden-tree') && imageSource)
    {
        const safeSource = projectCoverCssUrl(imageSource);
        const point = normalizeProjectCoverPosition(position);
        return `--cover:url('${safeSource}');background-color:var(--surface-card);background-size:cover;background-position:${point.x}% ${point.y}%;`;
    }

    if (normalizedCover === 'photo') return projectCoverStyleAttribute('paper');

    return `--cover:url('${projectCoverCssUrl('assets/covers/full-tree-project-cover.png')}');background-color:var(--surface-card);background-size:contain;background-position:center;`;
}

function updateProjectCoverPreview(
    preview,
    coverStyle,
    photoSource = '',
    position = null
)
{
    if (!preview)
    {
        return;
    }

    const normalizedCover =
        normalizeProjectCoverStyle(
            coverStyle
        );

    preview.classList.toggle(
        'tree',
        normalizedCover === 'tree'
    );

    preview.style.cssText =
        projectCoverStyleAttribute(
            normalizedCover,
            photoSource,
            position
        );

    preview.dataset.coverStyle =
        normalizedCover;
}

function bindProjectCoverPositioner(preview, { getSource, getPosition, onChange, resetButton })
{
    if (!preview) return () => {};
    let image = null;
    let loadedSource = '';
    let drag = null;
    const refresh = () =>
    {
        const source = getSource();
        if (source !== loadedSource)
        {
            loadedSource = source;
            image = null;
            if (source)
            {
                const next = new Image();
                next.onload = () =>
                {
                    if (loadedSource !== source) return;
                    image = next;
                    refresh();
                };
                next.onerror = () => { if (loadedSource === source) refreshState(false); };
                next.src = source;
            }
        }
        refreshState(true);
    };
    const overflow = () =>
    {
        if (!image || !preview.clientWidth || !preview.clientHeight) return { x: 0, y: 0 };
        const scale = Math.max(preview.clientWidth / image.naturalWidth, preview.clientHeight / image.naturalHeight);
        return {
            x: Math.max(0, image.naturalWidth * scale - preview.clientWidth),
            y: Math.max(0, image.naturalHeight * scale - preview.clientHeight)
        };
    };
    const refreshState = () =>
    {
        const extra = overflow();
        const movable = extra.x > 1 || extra.y > 1;
        preview.classList.toggle('cover-positionable', movable);
        preview.tabIndex = movable ? 0 : -1;
        if (resetButton) resetButton.hidden = !movable;
    };
    preview.addEventListener('pointerdown', event =>
    {
        const extra = overflow();
        if (event.button !== 0 || (!extra.x && !extra.y)) return;
        drag = { x: event.clientX, y: event.clientY, position: normalizeProjectCoverPosition(getPosition()), extra };
        preview.setPointerCapture(event.pointerId);
        preview.classList.add('is-dragging');
        event.preventDefault();
    });
    preview.addEventListener('pointermove', event =>
    {
        if (!drag) return;
        const next = {
            x: drag.extra.x ? drag.position.x - (event.clientX - drag.x) / drag.extra.x * 100 : 50,
            y: drag.extra.y ? drag.position.y - (event.clientY - drag.y) / drag.extra.y * 100 : 50
        };
        onChange(normalizeProjectCoverPosition(next));
    });
    const endDrag = () =>
    {
        drag = null;
        preview.classList.remove('is-dragging');
    };
    preview.addEventListener('pointerup', endDrag);
    preview.addEventListener('pointercancel', endDrag);
    preview.addEventListener('keydown', event =>
    {
        const extra = overflow();
        const delta = event.shiftKey ? 1 : 5;
        const position = normalizeProjectCoverPosition(getPosition());
        if (event.key === 'ArrowLeft' && extra.x) position.x += delta;
        else if (event.key === 'ArrowRight' && extra.x) position.x -= delta;
        else if (event.key === 'ArrowUp' && extra.y) position.y += delta;
        else if (event.key === 'ArrowDown' && extra.y) position.y -= delta;
        else return;
        event.preventDefault();
        onChange(normalizeProjectCoverPosition(position));
    });
    resetButton?.addEventListener('click', () => onChange({ x: 50, y: 50 }));
    const observer = new ResizeObserver(refresh);
    observer.observe(preview);
    refresh();
    return refresh;
}

function setProjectCover(
    projectId,
    coverStyle,
    selection = {}
)
{
    const project =
        sampleData.projects.find(
            item =>
                item.id === projectId
        );

    if (
        !project
        || !isProjectCoverStyle(
            coverStyle
        )
    )
    {
        return false;
    }

    if (coverStyle === 'photo')
    {
        const photo = selection.photoId
            ? getPhoto(selection.photoId, { projectId })
            : null;
        const src = photo?.src || selection.imageSrc || '';
        if (!src) return false;
        project.coverPhotoId = photo?.id || '';
        project.coverImageSrc = photo ? '' : src;
    }
    else
    {
        project.coverPhotoId = '';
        project.coverImageSrc = '';
    }

    project.cover =
        coverStyle;
    project.coverPosition = normalizeProjectCoverPosition(selection.position);

    touchProjectModified(
        project
    );

    return true;
}

function commitProjectCoverSelection(projectId, selection)
{
    if (selection.uploadDraft)
    {
        if (!photoUploadDraftIsValid(selection.uploadDraft)) return false;
        if (selection.addToAlbums)
        {
            const photo = createMediaFromPhotoUpload({
                projectId, draft: selection.uploadDraft, idPrefix: 'project-cover-photo'
            });
            return Boolean(photo && setProjectCover(projectId, 'photo', { photoId: photo.id, position: selection.position }));
        }
        return setProjectCover(projectId, 'photo', { imageSrc: selection.uploadDraft.src, position: selection.position });
    }
    return setProjectCover(projectId, 'photo', selection);
}

function openProjectCoverPhotoPicker(projectId, { onSelect, nested = false, selection = null } = {})
{
    const project = sampleData.projects.find(item => item.id === projectId);
    if (!project || typeof onSelect !== 'function') return;
    let chosen = selection ? {
        ...selection, position: normalizeProjectCoverPosition(selection.position)
    } : {
        photoId: project.coverPhotoId || '', imageSrc: project.coverImageSrc || '',
        position: normalizeProjectCoverPosition(project.coverPosition)
    };
    let query = '';
    let uploadRequest = 0;
    const photos = () => sampleData.media.filter(media =>
        media.projectId === projectId && media.kind === 'photo' && media.src);
    const source = () => chosen.uploadDraft?.src
        || (chosen.photoId ? getPhoto(chosen.photoId, { projectId })?.src : '')
        || chosen.imageSrc || '';
    const renderGrid = () =>
    {
        const matches = photos().filter(photo =>
            `${localizedDataFieldValue(photo.title || '')} ${photo.title || ''} ${photo.filename || ''}`
                .toLocaleLowerCase().includes(query.toLocaleLowerCase()));
        return matches.length ? matches.map(photo => {
            const title = localizedDataFieldValue(photo.title || photo.filename);
            return `
            <button type="button" class="project-cover-photo-item" data-cover-photo-id="${escapeHtml(photo.id)}"
                aria-pressed="${String(chosen.photoId === photo.id && !chosen.uploadDraft)}"
                title="${escapeHtml(title)}">
                ${renderPhotoThumbnail(photo, { label: title })}
                <span>${escapeHtml(title)}</span>
            </button>`;
        }).join('') : `<p class="project-cover-photo-empty">${escapeHtml(t(query ? 'No matching photos.' : 'No photos in this project yet.'))}</p>`;
    };

    (nested ? openNestedModal : openModal)(`<div class="modal project-cover-photo-modal" role="dialog" aria-modal="true" aria-labelledby="coverPhotoPickerTitle">
        <div class="modal-header"><div><h2 id="coverPhotoPickerTitle">Choose cover photo</h2><p>Select a project photo or upload a new image.</p></div>
            <button class="close-button" type="button" data-close aria-label="Close">${icon.close}</button></div>
        <div class="project-cover-photo-body">
            <div class="project-cover-photo-library">
                <label class="project-cover-photo-search-label" for="coverPhotoSearch">Search photos</label>
                <div class="app-search-field project-cover-photo-search">${icon.search}<input id="coverPhotoSearch" data-cover-photo-search type="search" placeholder="Search photos" autocomplete="off"></div>
                <div class="project-cover-photo-grid" data-cover-photo-grid>${renderGrid()}</div>
                <input data-cover-photo-file type="file" accept="image/jpeg,image/png,image/webp" hidden>
                <button type="button" class="button secondary project-cover-photo-upload" data-cover-photo-upload>${icon.plus} Upload new photo</button>
                <label class="project-cover-photo-albums" data-cover-photo-albums hidden><input type="checkbox" data-cover-photo-add-albums> Add to Albums</label>
                <p class="project-cover-photo-error" data-cover-photo-error role="alert" hidden></p>
            </div>
            <div class="project-cover-photo-preview-pane"><h3>Cover preview</h3><div class="project-cover-preview project-cover-photo-preview" data-cover-photo-preview role="group" aria-label="Drag to position cover; use arrow keys to adjust"></div><button class="project-cover-reset" type="button" data-cover-photo-reset hidden>Reset position</button></div>
        </div>
        <div class="modal-footer"><button class="button secondary" type="button" data-close>Cancel</button>
            <button class="button primary" type="button" data-cover-photo-confirm>Use photo</button></div>
    </div>`);

    const modal = modalBackdrop.querySelector('.project-cover-photo-modal');
    const grid = modal.querySelector('[data-cover-photo-grid]');
    const preview = modal.querySelector('[data-cover-photo-preview]');
    const albumsChoice = modal.querySelector('[data-cover-photo-albums]');
    const confirm = modal.querySelector('[data-cover-photo-confirm]');
    const error = modal.querySelector('[data-cover-photo-error]');
    const positioner = bindProjectCoverPositioner(preview, {
        getSource: source,
        getPosition: () => chosen.position,
        onChange: position =>
        {
            chosen.position = position;
            updateProjectCoverPreview(preview, 'photo', source(), position);
        },
        resetButton: modal.querySelector('[data-cover-photo-reset]')
    });
    const refresh = () =>
    {
        grid.innerHTML = renderGrid();
        updateProjectCoverPreview(preview, 'photo', source(), chosen.position);
        positioner();
        albumsChoice.hidden = !chosen.uploadDraft;
        modal.querySelector('[data-cover-photo-add-albums]').checked = Boolean(chosen.addToAlbums);
        confirm.disabled = !source();
    };
    modal.querySelector('[data-cover-photo-search]').addEventListener('input', event =>
    {
        query = event.target.value;
        grid.innerHTML = renderGrid();
    });
    grid.addEventListener('click', event =>
    {
        const button = event.target.closest('[data-cover-photo-id]');
        if (!button) return;
        uploadRequest += 1;
        chosen = { photoId: button.dataset.coverPhotoId, position: { x: 50, y: 50 } };
        error.hidden = true;
        refresh();
    });
    const fileInput = modal.querySelector('[data-cover-photo-file]');
    modal.querySelector('[data-cover-photo-upload]').addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', async () =>
    {
        const file = fileInput.files?.[0];
        if (!file) return;
        const request = ++uploadRequest;
        try
        {
            const draft = await createPhotoUploadDraft(file, { idPrefix: 'project-cover-draft' });
            if (!modal.isConnected || request !== uploadRequest) return;
            chosen = { uploadDraft: draft, addToAlbums: false, position: { x: 50, y: 50 } };
            error.hidden = true;
            refresh();
        }
        catch (_error)
        {
            if (!modal.isConnected || request !== uploadRequest) return;
            error.textContent = t('Choose a JPEG, PNG, or WebP image under 20 MB.');
            error.hidden = false;
        }
        fileInput.value = '';
    });
    modal.querySelector('[data-cover-photo-add-albums]').addEventListener('change', event =>
    {
        chosen.addToAlbums = event.target.checked;
    });
    confirm.addEventListener('click', () =>
    {
        if (!source()) return;
        closeModal();
        onSelect({ ...chosen });
    });
    refresh();
}

function formatProjectCount(count)
{
    const value = Number.isFinite(Number(count)) ? Number(count) : 0;
    return `${value} ${value === 1 ? 'project' : 'projects'}`;
}

function projectModuleIcon(moduleName)
{
    if (moduleName === 'Projects') return icon.home;
    if (moduleName === 'Family Tree') return icon.tree;
    if (moduleName === 'People') return icon.people;
    if (moduleName === 'Geneograph') return icon.whiteboard;
    if (moduleName === 'Albums') return icon.image;
    if (moduleName === 'Archive') return icon.file;
    if (moduleName === 'Notes') return icon.note;
    if (moduleName === 'Places') return icon.mapPin;
    if (moduleName === 'Publish') return icon.export;
    return icon.home;
}

function normalizeProjectContinuation(value)
{
    if (!value || typeof value !== 'object') return null;
    const project = sampleData.projects.find(item => item.id === value.projectId && !item.deleted && item.available !== false);
    const moduleName = value.module === 'Projects' || modules.includes(value.module) ? value.module : '';
    const openedAt = Date.parse(value.openedAt || '');
    if (!project || !moduleName || !Number.isFinite(openedAt)) return null;
    return { projectId: project.id, module: moduleName, openedAt: new Date(openedAt).toISOString() };
}

function clearProjectContinuation()
{
    state.projectContinuation = null;
    try
    {
        localStorage.removeItem(PROJECT_CONTINUATION_STORAGE_KEY);
    }
    catch (error)
    {}
}

function readProjectContinuation()
{
    let storedValue = null;
    try
    {
        storedValue = localStorage.getItem(PROJECT_CONTINUATION_STORAGE_KEY);
    }
    catch (error)
    {}
    if (storedValue == null)
    {
        const fallback = normalizeProjectContinuation(sampleData.projectContinuation);
        if (fallback)
        {
            try
            {
                localStorage.setItem(PROJECT_CONTINUATION_STORAGE_KEY, JSON.stringify(fallback));
            }
            catch (error)
            {}
        }
        return fallback;
    }
    try
    {
        const normalized = normalizeProjectContinuation(JSON.parse(storedValue));
        if (!normalized) clearProjectContinuation();
        return normalized;
    }
    catch (error)
    {
        clearProjectContinuation();
        return null;
    }
}

function persistProjectContinuation(value)
{
    const normalized = normalizeProjectContinuation(value);
    if (!normalized)
    {
        clearProjectContinuation();
        return null;
    }
    state.projectContinuation = normalized;
    try
    {
        localStorage.setItem(PROJECT_CONTINUATION_STORAGE_KEY, JSON.stringify(normalized));
    }
    catch (error)
    {}
    return normalized;
}

function resolveProjectContinuation()
{
    const normalized = normalizeProjectContinuation(state.projectContinuation);
    if (!normalized)
    {
        if (state.projectContinuation) clearProjectContinuation();
        return null;
    }
    const project = sampleData.projects.find(item => item.id === normalized.projectId);
    return { ...normalized, project, icon: projectModuleIcon(normalized.module) };
}

function formatContinuationOpenedAt(
    value
)
{
    return `${
        t('Last opened')
    } ${
        formatProjectDate(
            value,
            t('Unknown')
        )
    }`;
}

function resetProjectModuleState(projectId)
{
    const people = getPeople(projectId);
    const firstPersonId = people[0]?.id || '';
    const firstPhotoId = getProjectPhotos(projectId)[0]?.id || '';
    const firstPlaceId = projectPlaces(projectId)[0]?.id || null;

    clearPeopleSelection();
    state.selectedPersonId = firstPersonId;
    state.treeCenterTargetId = firstPersonId;
    state.selectedPeopleId = firstPersonId;
    state.peopleView = 'directory';
    state.peopleSide = 'people';
    state.peopleSelectedIds = [];
    state.peopleSelectionAnchorId = '';
    state.peopleSearch = '';
    state.peoplePage = 1;
    state.peoplePaginationQueryKey = '';
    state.peopleSavedView = 'All people';
    state.peopleSavedViewId = '';
    state.peopleFilters = {
        surnames: [],
        birthPlaceIds: [],
        birthYear: { mode: '', from: '', to: '' },
        living: 'Any'
    };
    state.peopleProfileEditing = false;

    const treeView = treeProjectViewState(projectId);
    const validTreeFocus = people.some(person => person.id === treeView.focusPersonId)
        ? treeView.focusPersonId
        : treeDefaultPersonId(projectId);
    treeView.focusPersonId = validTreeFocus;
    treeView.recentPersonIds = validTreeFocus ? [validTreeFocus] : [];

    cancelGeneographPencilStroke?.();
    clearGeneographConnectionClick?.();
    state.geneoView = 'home';
    state.geneoLibraryView = 'all';
    state.geneoActiveCollectionId = null;
    state.geneoBoardSearch = '';
    state.selectedGeneoBoardId = null;
    state.selectedGeneoNodeId = null;
    state.selectedGeneoNodeIds = [];
    state.selectedGeneoConnectionId = null;
    state.selectedGeneoConnectionIds = [];
    state.selectedGeneoWaypointIndex = null;
    state.geneoConnectionDraft = null;
    state.geneoInlineEditNodeId = null;
    state.geneoLayerSearch = '';
    state.geneoTool = 'pan';

    state.albumsView = 'all';
    state.activeAlbumId = null;
    state.albumsSearch = '';
    state.albumsFilters = {
        personId: '',
        placeId: '',
        dateRange: '',
        favouriteOnly: false
    };
    state.albumsPage = 1;
    state.selectedPhotoId = firstPhotoId;
    state.selectedPhotoIds = [];
    state.albumsDetailEditing = false;
    state.albumsDetailEditOriginal = null;
    state.albumsDetailDraft = null;

    state.archiveView = 'files';
    resetArchiveImageSession();
    state.archiveFileLayout = 'details';
    state.archiveSelectedFolderId = null;
    state.archiveSelectedFolderItemId = null;
    state.archiveSelectedFileId = null;
    state.archiveSelectedSourceId = null;
    state.archiveSelectedFileIds = [];
    state.archiveSelectedFolderIds = [];
    state.archiveSearch = '';
    state.archiveFileFilters = {
        scope: 'all',
        fileType: 'all',
        connections: 'all',
        personIds: [],
        placeIds: [],
        documentYears: {
            mode: '',
            from: '',
            to: ''
        },
        favouriteOnly: false
    };

    state.archiveFilterPresentation = 'flat';
    state.archiveFilterScopeFolderId = null;
    state.archiveSourceCategoryFilter = 'all';
    state.archiveSourceConnectionFilter = 'all';
    state.archiveSourceFavouriteOnly = false;
    state.archiveSourceTargetFilter = null;
    state.archiveFileEditing = false;
    state.archiveFileEditOriginal = null;
    state.archiveFileEditDraft = null;
    state.archiveExpandedFolders = {};
    state.archiveNavigationBackStack = [];
    state.archiveNavigationForwardStack = [];
    state.archivePendingTreeRevealId = null;

    clearNotesContext();
    state.notesView = 'all';
    state.notesActiveCollectionId = null;
    state.selectedNoteId = null;
    state.notesSearch = '';
    state.notesRightCollapsed = true;
    state.notesMobilePane = 'browser';
    state.notesSaveStatus = 'Saved';
    state.notesFilters = {
        ...defaultNotesFilters
    };

    state.placesView = 'all';
    state.placesSavedFilterId = '';
    state.placesFilters = { ...defaultPlaceFilters };
    state.placesSearch = '';
    state.placesReviewFocusId = '';
    state.selectedPlaceId = firstPlaceId;
    clearPlacesRoute();
    state.placesMapView = {
        center: null,
        zoom: PLACES_MAP_CONFIG.defaultZoom,
        userMoved: false,
        lastFitKey: ''
    };

    state.publishView = 'home';
    state.publishSide = 'drafts';
    state.publishSearch = '';
    state.publishSelectedDraftId = null;
    state.publishWizardStep = 'type';
    state.publishOutputType = 'report';
    state.publishScopeMode = 'person';
    state.publishFocusPersonId = firstPersonId;
    state.publishGenerations = 4;
    state.publishFormat = 'PDF';
    state.unreadNotifications = projectNotifications(projectId).length;
}

function activateProject(projectId, {
    moduleName = 'Projects',
    renderNow = true,
    reset = true
} = {})
{
    const project = validProjectById(projectId);
    const nextModule = moduleName === 'Projects' || modules.includes(moduleName)
        ? moduleName
        : 'Projects';

    if (!project) return false;

    const projectChanged = state.currentProjectId !== project.id;
    if (
        state.activeModule === 'Geneograph'
        && state.geneoView === 'board'
        && (nextModule !== 'Geneograph' || projectChanged)
    )
    {
        captureGeneographViewport();
    }

    const leavingFamilyTree =
        state.activeModule
          === 'Family Tree'
        && (
            nextModule
            !== 'Family Tree'
          || projectChanged
        );

    if (leavingFamilyTree)
    {
        captureTreeCanvasScroll(
            state.currentProjectId
        );
    }

    closeMenu();
    state.projectOpen = true;
    state.currentProjectId = project.id;
    state.selectedProjectId = project.id;

    if (reset && projectChanged)
    {
        resetProjectModuleState(project.id);
    }
    else if (projectChanged)
    {
        state.peopleSearch = '';
        state.peopleFilters = peopleFiltersWithDefaults(defaultPeopleFilters);
        state.peopleSavedViewId = '';
        state.peopleSavedView = 'All people';
        state.peoplePage = 1;
        state.peoplePaginationQueryKey = '';
        state.peopleSelectedIds = [];
        state.peopleSelectionAnchorId = '';
    }

    state.activeModule = nextModule;
    if (nextModule === 'Projects') state.openSide = 'overview';
    persistProjectContinuation({
        projectId: project.id,
        module: nextModule,
        openedAt: new Date().toISOString()
    });

    if (renderNow) render();
    return true;
}

function navigateToProjectModuleCommit(projectId, moduleName = 'Projects')
{
    return activateProject(projectId, { moduleName });
}

function navigateToProjectModule(
    projectId,
    moduleName = 'Projects'
)
{
    const leavingCurrentArchive =
        state.activeModule
          === 'Archive'
        && state.archiveFileEditing
        && (
            projectId
            !== currentProjectId()
          || moduleName
            !== 'Archive'
        );

    if (state.activeModule === 'Projects' && state.openSide === 'settings')
    {
        runAfterProjectSettingsGuard(() => navigateToProjectModuleCommit(projectId, moduleName));
        return true;
    }

    if (
        leavingCurrentArchive
    )
    {
        runAfterArchiveFileEditGuard(
            () =>
            {
                navigateToProjectModuleCommit(
                    projectId,
                    moduleName
                );
            }
        );

        /*
          Navigation may be deferred until the user
          confirms the discard dialog.
        */
        return true;
    }

    return navigateToProjectModuleCommit(
        projectId,
        moduleName
    );
}

function filteredProjects()
{
    const peopleCounts =
        new Map(
            sampleData.projects.map(
                project => [
                    project.id,
                    getProjectPeopleCount(
                        project.id
                    )
                ]
            )
        );

    let list = [
        ...sampleData.projects
    ];

    const query =
        state.search
            .trim()
            .toLowerCase();

    if (query)
    {
        list =
            list.filter(project =>
                `${
                    project.name
                } ${
                    project.status
                } ${
                    project.desc
                }`
                    .toLowerCase()
                    .includes(query)
            );
    }

    return appSortRecords(list, {
        field:
          state.sort,

        direction:
          state.sortDirection,

        extractors: {
            name: {
                type: 'text',
                get: project =>
                    project.name
            },

            updated: {
                type: 'number',
                get:
              projectModifiedTimestamp
            },

            created: {
                type: 'number',
                get:
              projectCreatedTimestamp
            },

            people: {
                type: 'number',
                get: project =>
                    peopleCounts.get(
                        project.id
                    ) ?? 0
            }
        },

        getFallback:
          project => project.name
    });
}

function bindStartupCreateTile()
{
    main.querySelector('[data-startup-create]')?.addEventListener('click', openCreateModal);
}

function bindProjectControls()
{
    bindSearchInput(main, '#projectSearch', 'search', renderStartup);
    bindAppSortControl(main, {
        id: 'sortProjects',
        options: APP_SORT_OPTIONS.projects,
        getField: () => state.sort,
        getDirection: () =>
            state.sortDirection,

        onChange: ({
            field,
            direction
        }) =>
        {
            state.sort = field;
            state.sortDirection = direction;
            renderStartup();
        }
    });
    main.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () =>
    {
        state.viewMode = button.dataset.view; renderStartup();
    }));
    main.querySelectorAll('[data-open]').forEach(button => button.addEventListener('click', e =>
    {
        e.stopPropagation(); openProject(button.dataset.open);
    }));
    main.querySelectorAll('[data-menu]').forEach(button => button.addEventListener('click', e =>
    {
        e.stopPropagation(); openProjectMenu(button.dataset.menu, button);
    }));
    main.querySelector('[data-continue-project]')?.addEventListener('click', event =>
    {
        const button = event.currentTarget;
        navigateToProjectModule(button.dataset.continueProject, button.dataset.continueModule);
    });
    main.querySelector('[data-clear-project-search]')?.addEventListener('click', () =>
    {
        state.search = '';
        renderStartup();
        restoreSearchInputFocus('#projectSearch');
    });
    main.querySelector('[data-startup-empty-create]')?.addEventListener('click', openCreateModal);
    bindStartupCreateTile();
    bindToasts(main);
}

function openProject(id)
{
    navigateToProjectModule(id, 'Projects');
}

function currentProject()
{
    return validProjectById(state.currentProjectId);
}

function uniqueProjectId()
{
    const base = `project-${Date.now().toString(36)}`;
    let candidate = base;
    let suffix = 2;
    while (sampleData.projects.some(project => project.id === candidate))
    {
        candidate = `${base}-${suffix}`;
        suffix += 1;
    }
    return candidate;
}

function uniqueProjectCopyName(projectName)
{
    const base = `${cleanEditFieldValue(projectName) || 'Untitled project'} copy`;
    const names = new Set(sampleData.projects.map(project => project.name.toLocaleLowerCase()));
    if (!names.has(base.toLocaleLowerCase())) return base;
    let suffix = 2;
    while (names.has(`${base} ${suffix}`.toLocaleLowerCase())) suffix += 1;
    return `${base} ${suffix}`;
}

function bindProjectActionModalReturnFocus(anchor)
{
    if (!anchor?.isConnected) return;
    modalBackdrop.querySelectorAll('[data-close]').forEach(button =>
    {
        button.addEventListener('click', () =>
        {
            if (anchor.isConnected) anchor.focus();
        }, { once: true });
    });
}

function openRenameProjectModal(projectId, anchor = null)
{
    const project = sampleData.projects.find(item => item.id === projectId);
    if (!project) return;
    openModal(`<div class="modal" role="dialog" aria-modal="true" aria-labelledby="renameProjectTitle">
        <div class="modal-header"><div><h2 id="renameProjectTitle">Rename project</h2><p>Update the project name shown throughout GeneoGraph.</p></div><button class="close-button" type="button" data-close aria-label="Close">${icon.close}</button></div>
        <form id="renameProjectForm">
          <div class="modal-body form-grid"><div class="field"><label for="renameProjectName">Project name</label><input id="renameProjectName" 
            value="${escapeHtml(
                localizedDataFieldValue(
                    project.name
                )
            )}"
             autocomplete="off" required></div></div>
          <div class="modal-footer"><button class="button secondary" type="button" data-close>Cancel</button><button class="button primary" type="submit">Save changes</button></div>
        </form>
      </div>`);
    bindProjectActionModalReturnFocus(anchor);
    const input = modalBackdrop.querySelector('#renameProjectName');
    input?.focus();
    input?.select();
    modalBackdrop.querySelector('#renameProjectForm')?.addEventListener('submit', event =>
    {
        event.preventDefault();
        const name =
            cleanEditFieldValue(
                collectLocalizedDataFieldValue(
                    input,
                    project.name
                )
            );
        if (!name)
        {
            input?.setCustomValidity('Project name cannot be empty.');
            input?.reportValidity();
            return;
        }
        input.setCustomValidity('');
        updateProjectName(project.id, name);
        closeModal();
        renderStartup();
        showToast('Project renamed.');
    });
}

function duplicateProject(projectId)
{
    const project = sampleData.projects.find(item => item.id === projectId);
    if (!project) return null;
    const now = new Date();
    const timestamp = now.toISOString();
    const copy = {
        id: uniqueProjectId(),
        name: uniqueProjectCopyName(project.name),
        createdAt: timestamp,
        modifiedAt: timestamp,
        status: project.status || 'Local project',
        cover: resolvedProjectCoverStyle(project),
        coverImageSrc: project.cover === 'photo' ? projectCoverImageSource(project) : '',
        coverPosition: normalizeProjectCoverPosition(project.coverPosition),
        files: 0,
        notes: 0,
        desc: project.desc || ''
    };
    sampleData.projects.unshift(copy);
    state.selectedProjectId = copy.id;
    renderStartup();
    showToast('Project duplicated.');
    return copy;
}

function openProjectCoverModal(
    projectId,
    anchor = null
)
{
    const project =
        sampleData.projects.find(
            item =>
                item.id === projectId
        );

    if (!project)
    {
        return;
    }

    let selectedCover = resolvedProjectCoverStyle(project);
    let selectedPosition = normalizeProjectCoverPosition(project.coverPosition);
    let selectedPhoto = {
        photoId: project.coverPhotoId || '', imageSrc: project.coverImageSrc || '',
        position: selectedPosition
    };

    const initialPreviewStyle =
        projectCoverStyleAttribute(
            selectedCover,
            projectCoverImageSource(project),
            selectedPosition
        );

    openModal(`
        <div
          class="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="projectCoverTitle">

          <div class="modal-header">
            <div>
              <h2 id="projectCoverTitle">
                Update cover
              </h2>

              <p>
                Choose the cover shown
                on this project card.
              </p>
            </div>

            <button
              class="close-button"
              type="button"
              data-close
              aria-label="Close">
              ${icon.close}
            </button>
          </div>

          <div
            class="modal-body project-cover-modal-body">

            <div class="project-cover-preview project-cover-modal-preview
                ${selectedCover === 'tree'
                        ? 'tree'
                        : ''
                }"
              data-project-cover-preview
              data-cover-style="${
                    escapeHtml(
                        selectedCover
                    )
                }"
              style="${
                    initialPreviewStyle
                }"
              role="group"
              aria-label="${
                    escapeHtml(
                        'Drag to position cover; use arrow keys to adjust'
                    )
                }">
            </div>



            <div
              class="project-cover-options"
              role="group"
              aria-label="Cover style">
              <button
                class="project-cover-option ${
                    selectedCover === 'paper'
                        ? 'active'
                        : ''
                }"
                type="button"
                data-project-cover-choice="paper"
                aria-pressed="${
                    selectedCover === 'paper'
                        ? 'true'
                        : 'false'
                }">
                Archival paper
              </button>

              <button
                class="project-cover-option ${
                    selectedCover === 'tree'
                        ? 'active'
                        : ''
                }"
                type="button"
                data-project-cover-choice="tree"
                aria-pressed="${
                    selectedCover === 'tree'
                        ? 'true'
                        : 'false'
                }">
                Family tree
              </button>

              <button
                class="project-cover-option ${selectedCover === 'golden-tree' ? 'active' : ''}"
                type="button"
                data-project-cover-choice="golden-tree"
                aria-pressed="${selectedCover === 'golden-tree'}">
                Ancestry
              </button>

              <button
                class="project-cover-option ${
                    selectedCover === 'photo'
                        ? 'active'
                        : ''
                }"
                type="button"
                data-project-cover-choice="photo"
                aria-pressed="${
                    selectedCover === 'photo'
                        ? 'true'
                        : 'false'
                }">
                Photo
              </button>
            </div>
          </div>

          <div class="modal-footer">
            <button class="project-cover-reset project-cover-modal-reset" type="button" data-project-cover-reset hidden>Reset position</button>
            <button
              class="button secondary"
              type="button"
              data-close>
              Cancel
            </button>

            <button
              class="button primary"
              type="button"
              data-save-project-cover>
              Save changes
            </button>
          </div>
        </div>
      `);

    bindProjectActionModalReturnFocus(
        anchor
    );

    const preview =
        modalBackdrop.querySelector(
            '[data-project-cover-preview]'
        );
    const currentPhotoSource = () => selectedPhoto.uploadDraft?.src
        || (selectedPhoto.photoId ? getPhoto(selectedPhoto.photoId, { projectId: project.id })?.src : '')
        || selectedPhoto.imageSrc || '';
    const activeSource = () => selectedCover === 'golden-tree'
        ? GOLDEN_TREE_COVER_SRC : selectedCover === 'photo' ? currentPhotoSource() : '';
    const positioner = bindProjectCoverPositioner(preview, {
        getSource: activeSource,
        getPosition: () => selectedPosition,
        onChange: position =>
        {
            selectedPosition = position;
            updateProjectCoverPreview(preview, selectedCover, activeSource(), position);
        },
        resetButton: modalBackdrop.querySelector('[data-project-cover-reset]')
    });

    modalBackdrop
        .querySelectorAll(
            '[data-project-cover-choice]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    const nextCover =
                        String(
                            button.dataset
                                .projectCoverChoice
                  || ''
                        ).trim();

                    if (
                        !isProjectCoverStyle(
                            nextCover
                        )
                    )
                    {
                        return;
                    }

                    if (nextCover === 'photo')
                    {
                        openProjectCoverPhotoPicker(project.id, {
                            nested: true,
                            selection: selectedPhoto,
                            onSelect: choice =>
                            {
                                selectedPhoto = choice;
                                selectedCover = 'photo';
                                selectedPosition = normalizeProjectCoverPosition(choice.position);
                                modalBackdrop.querySelectorAll('[data-project-cover-choice]').forEach(option =>
                                {
                                    const active = option.dataset.projectCoverChoice === 'photo';
                                    option.classList.toggle('active', active);
                                    option.setAttribute('aria-pressed', String(active));
                                });
                                updateProjectCoverPreview(preview, 'photo', activeSource(), selectedPosition);
                                positioner();
                            }
                        });
                        return;
                    }

                    selectedCover =
                        nextCover;
                    selectedPosition = { x: 50, y: 50 };

                    modalBackdrop
                        .querySelectorAll(
                            '[data-project-cover-choice]'
                        )
                        .forEach(option =>
                        {
                            const active =
                                option.dataset
                                    .projectCoverChoice
                    === selectedCover;

                            option.classList.toggle(
                                'active',
                                active
                            );

                            option.setAttribute(
                                'aria-pressed',
                                String(active)
                            );
                        });

                    updateProjectCoverPreview(
                        preview,
                        selectedCover,
                        activeSource(),
                        selectedPosition
                    );
                    positioner();
                }
            );
        });

    modalBackdrop
        .querySelector(
            '[data-save-project-cover]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                const saved =
                    selectedCover === 'photo'
                        ? commitProjectCoverSelection(project.id, { ...selectedPhoto, position: selectedPosition })
                        : setProjectCover(project.id, selectedCover, { position: selectedPosition });

                if (!saved)
                {
                    return;
                }

                closeModal();
                renderStartup();

                showToast(
                    'Project cover updated.'
                );
            }
        );
}

function openDeleteProjectConfirm(projectId, anchor = null)
{
    const project = sampleData.projects.find(item => item.id === projectId);
    if (!project) return;
    const description = t('Delete {project} and all people, relationships, media, and research records owned by this project.')
        .replace('{project}', escapeHtml(localizedDataFieldValue(project.name)));
    openModal(`<div class="modal" role="dialog" aria-modal="true" aria-labelledby="deleteProjectTitle">
        <div class="modal-header"><div><h2 id="deleteProjectTitle">Delete project?</h2><p data-i18n-skip>${description}</p></div><button class="close-button" type="button" data-close aria-label="Close">${icon.close}</button></div>
        <div class="modal-body">
          <p class="project-delete-warning">This action cannot be undone.</p>
        </div>
        <div class="modal-footer"><button class="button secondary" type="button" data-close>Cancel</button><button class="button danger" type="button" data-confirm-project-delete>Delete project</button></div>
      </div>`);
    bindProjectActionModalReturnFocus(anchor);
    modalBackdrop.querySelector('[data-confirm-project-delete]')?.addEventListener('click', () => deleteProject(project.id));
}

function deleteProject(projectId)
{
    const project = sampleData.projects.find(item => item.id === projectId);
    if (!project) return false;

    const deletedBoardIds = new Set(
        (sampleData.boards || [])
            .filter(board => board.projectId === project.id)
            .map(board => board.id)
    );
    const projectCollections = [
        'people',
        'families',
        'relationships',
        'relationshipSeed',
        'educationSeed',
        'places',
        'placeSavedFilters',
        'placeIssues',
        'events',
        'media',
        'albums',
        'archiveFolders',
        'archiveFiles',
        'sources',
        'sourceLinks',
        'archiveImports',
        'archiveIssues',
        'noteCollections',
        'notes',
        'boardCollections',
        'boards',
        'links',
        'publishDrafts',
        'activity',
        'notifications'
    ];
    projectCollections.forEach(collectionName =>
    {
        if (!Array.isArray(sampleData[collectionName])) return;
        sampleData[collectionName] = sampleData[collectionName].filter(record => record?.projectId !== project.id);
    });
    sampleData.projects = sampleData.projects.filter(item => item.id !== project.id);

    if (sampleData.projectContinuation?.projectId === project.id) sampleData.projectContinuation = null;
    if (state.projectContinuation?.projectId === project.id) clearProjectContinuation();

    delete state.treeProjectViews[project.id];
    deletedBoardIds.forEach(boardId =>
    {
        delete state.geneoBoardViewports[boardId];
    });
    rebuildSampleEventsAndPruneSourceLinks();
    closeModal({ force: true });

    state.currentProjectId = null;
    state.projectOpen = false;
    state.activeModule = 'Projects';
    state.openSide = 'overview';

    state.selectedProjectId = '';
    render();
    showToast('Project deleted.');
    return true;
}

function openProjectMenu(id, anchor)
{
    closeMenu();
    const rect = anchor.getBoundingClientRect();
    const menu = document.createElement('div');
    menu.className = 'menu-popover project-action-menu';
    menu.id = 'projectMenu';
    menu.style.visibility = 'hidden';
    menu.innerHTML = `<button type="button" data-action="rename">${escapeHtml(t('Rename'))}</button><button type="button" data-action="duplicate">${escapeHtml(t('Duplicate'))}</button><button type="button" data-action="cover">${escapeHtml(t('Update cover'))}</button><button type="button" class="danger" data-action="delete">${escapeHtml(t('Delete'))}</button>`;
    document.body.appendChild(menu);
    const menuRect = menu.getBoundingClientRect();
    const margin = 12;
    menu.style.left = `${Math.max(margin, Math.min(rect.right - menuRect.width, window.innerWidth - menuRect.width - margin))}px`;
    menu.style.top = `${rect.bottom + 6 + menuRect.height <= window.innerHeight - margin
        ? rect.bottom + 6
        : Math.max(margin, rect.top - menuRect.height - 6)}px`;
    menu.style.visibility = 'visible';
    menu.addEventListener('click', e =>
    {
        const action = e.target.closest('[data-action]')?.dataset.action;
        if (!action) return;
        closeMenu();
        if (action === 'rename') openRenameProjectModal(id, anchor);
        if (action === 'duplicate') duplicateProject(id);
        if (action === 'cover') openProjectCoverModal(id, anchor);
        if (action === 'delete') openDeleteProjectConfirm(id, anchor);
    });
    bindMenuLifecycle(anchor);
}
let menuLifecycleController = null;
let menuLifecycleAnchor = null;
let lastInteractionWasKeyboard = false;
function bindPageSizeControl(pageSizeSelect, root)
{
    pageSizeSelect.hidden = true;
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'people-page-size-trigger';
    trigger.textContent = pageSizeSelect.value;
    trigger.setAttribute('aria-label', `${t('Rows per page')}: ${pageSizeSelect.value}`);
    trigger.setAttribute('aria-haspopup', 'menu');
    trigger.setAttribute('aria-expanded', 'false');
    pageSizeSelect.after(trigger);
    trigger.addEventListener('click', event =>
    {
        event.preventDefault();
        if (trigger.getAttribute('aria-expanded') === 'true')
        {
            closeMenu();
            return;
        }
        closeMenu();
        const menu = document.createElement('div');
        menu.id = 'projectMenu';
        menu.className = 'menu-popover people-page-size-menu';
        menu.setAttribute('role', 'menu');
        menu.setAttribute('aria-label', t('Rows per page'));
        menu.innerHTML = [...pageSizeSelect.options].map(option => `<button type="button" role="menuitemradio" aria-checked="${option.selected}" data-page-size="${option.value}"><span>${option.value}</span>${option.selected ? icon.check : ''}</button>`).join('');
        document.body.append(menu);
        const rect = trigger.getBoundingClientRect();
        menu.style.left = `${Math.max(12, Math.min(rect.left, innerWidth - menu.offsetWidth - 12))}px`;
        menu.style.top = `${Math.max(12, rect.top - menu.offsetHeight - 6)}px`;
        menu.addEventListener('click', click =>
        {
            const option = click.target.closest('[data-page-size]');
            if (!option) return;
            pageSizeSelect.value = option.dataset.pageSize;
            closeMenu();
            pageSizeSelect.dispatchEvent(new Event('change', { bubbles: true }));
            root.querySelector('.people-page-size-trigger')?.focus({ preventScroll: true });
        });
        bindMenuLifecycle(trigger);
        menu.querySelector('[aria-checked=true]')?.focus();
    });
}
function clearDismissedSplitFocus()
{
    document.querySelectorAll('.tool-split.escape-dismissed').forEach(split => split.classList.remove('escape-dismissed'));
}
function suppressSplitFocusAfterEscape(element)
{
    element?.closest?.('.tool-split')?.classList.add('escape-dismissed');
}
document.addEventListener('pointerdown', () => { lastInteractionWasKeyboard = false; clearDismissedSplitFocus(); }, true);
document.addEventListener('pointerdown', event =>
{
    const select = event.target.closest?.('select');
    if (!select?.matches(':open')) return;
    setTimeout(() =>
    {
        if (select.isConnected && !select.matches(':open')) select.blur();
    }, 0);
}, true);
document.addEventListener('keydown', event => {
    if (!event.altKey && !event.ctrlKey && !event.metaKey) lastInteractionWasKeyboard = true;
    if (event.key === 'Escape' && document.getElementById('projectMenu'))
        suppressSplitFocusAfterEscape(menuLifecycleAnchor);
    else if (event.key !== 'Escape') clearDismissedSplitFocus();
}, true);

function bindMenuLifecycle(anchor = null, { ignoreScrollWithin = null } = {})
{
    menuLifecycleController?.abort();

    const controller =
        new AbortController();

    menuLifecycleController =
        controller;

    menuLifecycleAnchor =
        anchor instanceof HTMLElement
            ? anchor
            : null;
    menuLifecycleAnchor?.setAttribute('aria-expanded', 'true');

    const activeMenu =
        document.getElementById('projectMenu')
        || document.getElementById('relativePopover');

    const eventIsInsideMenu =
        event =>
        {
            const target =
                event.target;

            return Boolean(
                activeMenu
            && target instanceof Node
            && activeMenu.contains(
                target
            )
            );
        };

    const closeOutside = event =>
    {
        if (
            eventIsInsideMenu(event)
          || anchor?.contains?.(
              event.target
          )
        )
        {
            return;
        }

        closeMenu();
    };

    const closeOnDocumentScroll =
        event =>
        {
            if (
                eventIsInsideMenu(event)
                || ignoreScrollWithin?.contains?.(event.target)
            )
            {
                return;
            }

            closeMenu();
        };

    setTimeout(() =>
    {
        if (
            controller.signal.aborted
        )
        {
            return;
        }

        document.addEventListener(
            'click',
            closeOutside,
            {
                signal:
              controller.signal
            }
        );
    }, 0);

    document.addEventListener(
        'scroll',
        closeOnDocumentScroll,
        {
            capture: true,
            signal:
            controller.signal
        }
    );

    document.addEventListener(
        'keydown',
        event =>
        {
            const sheet = document.querySelector('.mobile-choice-sheet');
            if (sheet && event.key === 'Tab')
            {
                const buttons = [...sheet.querySelectorAll('button:not(:disabled)')];
                const first = buttons[0];
                const last = buttons.at(-1);
                if (event.shiftKey && document.activeElement === first)
                {
                    event.preventDefault();
                    last?.focus();
                }
                else if (!event.shiftKey && document.activeElement === last)
                {
                    event.preventDefault();
                    first?.focus();
                }
            }
            if (
                event.key === 'Escape'
            )
            {
                closeMenu();
                if (anchor?.isConnected)
                {
                    if (anchor.closest('.tool-split')) suppressSplitFocusAfterEscape(anchor);
                    else if (sheet) anchor.focus({ preventScroll: true });
                }
            }
        },
        {
            signal:
            controller.signal
        }
    );

    window.addEventListener(
        'scroll',
        closeMenu,
        {
            signal:
            controller.signal
        }
    );

    window.addEventListener(
        'resize',
        closeMenu,
        {
            signal:
            controller.signal
        }
    );
}

function closeMenu()
{
    menuLifecycleController?.abort();

    menuLifecycleController =
        null;

    menuLifecycleAnchor
        ?.setAttribute(
            'aria-expanded',
            'false'
        );

    menuLifecycleAnchor =
        null;
    document.getElementById('mobileChoiceBackdrop')?.remove();
    document.getElementById('placesRouteMenu')?.setAttribute('aria-expanded', 'false');
    document.getElementById('projectMenu')?.remove();
    document.getElementById('relativePopover')?.remove();
    document.getElementById('topbarPopover')?.remove();
    document.getElementById('peopleColumnsPopover')?.remove();
    document
        .getElementById(
            'peopleFilterPopover'
        )
        ?.remove();

    if (
        typeof closePlacesFilterPopover
          === 'function'
    )
    {
        closePlacesFilterPopover();
    }
    state.topbarPopover = null;

    if (typeof closeProjectNameOverlay === 'function')
    {
        closeProjectNameOverlay();
    }

    document.removeEventListener('click', closeMenu);
    document.removeEventListener('scroll', closeMenu, true);
    document.removeEventListener('click', closeTopbarPopoverOnOutside);
}

function mountMobileChoiceSheet(popover, anchor, title)
{
    if (window.innerWidth > 900) return;

    const backdrop = document.createElement('div');
    backdrop.id = 'mobileChoiceBackdrop';
    backdrop.className = 'mobile-choice-backdrop';
    backdrop.addEventListener('click', () =>
    {
        closeMenu();
        if (lastInteractionWasKeyboard && anchor?.isConnected) anchor.focus({ preventScroll: true });
    });
    document.body.insertBefore(backdrop, popover);

    popover.classList.add('mobile-choice-sheet');
    popover.setAttribute('role', 'dialog');
    popover.setAttribute('aria-modal', 'true');
    popover.setAttribute('aria-label', title);
    popover.removeAttribute('data-arrow-side');

    if (!popover.querySelector('.relative-popover-body'))
    {
        const body = document.createElement('div');
        body.className = 'mobile-choice-body';
        while (popover.firstChild) body.appendChild(popover.firstChild);
        popover.appendChild(body);
    }

    const heading = document.createElement('div');
    heading.className = 'mobile-choice-heading';
    heading.innerHTML = `<strong>${escapeHtml(title)}</strong><button type="button" aria-label="${escapeHtml(t('Close'))}" title="${escapeHtml(t('Close'))}">${icon.close}</button>`;
    popover.prepend(heading);
    heading.querySelector('button').addEventListener('click', () =>
    {
        closeMenu();
        if (lastInteractionWasKeyboard && anchor?.isConnected) anchor.focus({ preventScroll: true });
    });
    if (!geneoTourRuntime.active)
        requestAnimationFrame(() => heading.querySelector('button')?.focus({ preventScroll: true }));
}

function createBlankProject({ name, description = '' })
{
    const normalizedName = String(name || '').trim();
    if (!normalizedName) return null;

    const now = new Date().toISOString();
    const project = {
        id: uniqueProjectId(),
        name: normalizedName,
        desc: String(description || '').trim(),
        createdAt: now,
        modifiedAt: now,
        status: 'Local project',
        cover: 'paper',
        defaultPersonId: null,
        files: 0,
        notes: 0
    };

    sampleData.projects.push(project);
    return project;
}

function openCreateModal()
{
    openModal(`
        <div class="modal" role="dialog" aria-modal="true" aria-labelledby="createTitle">
          <div class="modal-header"><div><h2 id="createTitle">New project</h2><p>Start a new GeneoGraph project for a family line or research case.</p></div><button class="close-button" type="button" data-close>${icon.close}</button></div>
            <form id="createForm"><div class="modal-body form-grid">
              <div class="field">
                <label for="projectName">Project name</label>
                <input id="projectName" required placeholder="e.g. Whiskerfield Family History">
              </div>

              <div class="field">
                <label for="projectDesc">Description</label>
                <textarea id="projectDesc" placeholder="Family line, location, archive focus, or research goal"></textarea>
              </div>

            </div><div class="modal-footer">
                <button class="button secondary" type="button" data-close>Cancel</button><button class="button primary" type="submit">Create project</button></div></form>
        </div>`);
    document.getElementById('projectName')?.focus({ preventScroll: true });
    const createForm = document.getElementById('createForm');
    const nameInput = document.getElementById('projectName');
    const descriptionInput = document.getElementById('projectDesc');

    createForm.addEventListener('submit', event =>
    {
        event.preventDefault();
        const name = String(nameInput?.value || '').trim();

        nameInput?.setCustomValidity('');
        if (!name)
        {
            nameInput?.setCustomValidity(t('Project name is required.'));
            nameInput?.reportValidity();
            nameInput?.focus({ preventScroll: true });
            return;
        }

        const project = createBlankProject({
            name,
            description: descriptionInput?.value || ''
        });
        if (!project) return;

        closeModal({ force: true });
        activateProject(project.id, { moduleName: 'Projects' });
        showToast('Project created.');
    });

    nameInput?.addEventListener('input', () =>
    {
        nameInput.setCustomValidity('');
    });
}

function openImportModal()
{
    openModal(`
        <div class="modal" role="dialog" aria-modal="true" aria-labelledby="importTitle">
          <div class="modal-header"><div><h2 id="importTitle">Import GEDCOM</h2><p>${escapeHtml(t('File import is unavailable in this prototype.'))}</p></div><button class="close-button" type="button" data-close>${icon.close}</button></div>
          <div class="modal-footer"><button class="button secondary" type="button" data-close>Close</button><button class="button primary" type="button" disabled>Choose file</button></div>
        </div>`);
}


let modalReturnFocus = null;

const MODAL_FOCUSABLE_SELECTOR = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
].join(',');

function modalFocusableElements()
{
    return [
        ...modalBackdrop.querySelectorAll(
            MODAL_FOCUSABLE_SELECTOR
        )
    ].filter(element =>
        !element.hidden
        && element.offsetParent !== null
    );
}

function setApplicationInert(
    inert
)
{
    const app =
        document.querySelector(
            '.app'
        );

    if (!app)
    {
        return;
    }

    app.inert =
        inert;
}

function handleModalKeydown(
    event
)
{
    if (
        !modalBackdrop.classList
            .contains('open')
    )
    {
        return;
    }

    if (genealogyDatePopover)
    {
        if (event.key === 'Escape')
        {
            event.preventDefault(); event.stopImmediatePropagation(); closeGenealogyDateEditor();
        }
        if (genealogyDatePopover?.contains(event.target) || event.key === 'Escape') return;
    }

    if (event.key === 'Escape')
    {
        event.preventDefault();
        event.stopImmediatePropagation();

        if (document.querySelector('.manage-relative-menu'))
        {
            const anchor = menuLifecycleAnchor;
            closeMenu();
            anchor?.focus({ preventScroll: true });
            return;
        }

        const addPersonDiscard = document.getElementById('addPersonDiscardOverlay');
        if (addPersonDiscard)
        {
            addPersonDiscard.querySelector('[data-add-person-continue-editing]')?.click();
            return;
        }

        if (modalBackdrop.querySelector('[data-place-duplicate-menu]'))
        {
            const anchor = menuLifecycleAnchor;

            event.stopPropagation();
            closeMenu();
            anchor?.focus({ preventScroll: true });
            return;
        }

        closeModal({ escapeDismissed: true });
        return;
    }

    if (event.key !== 'Tab')
    {
        return;
    }

    const focusable =
        modalFocusableElements();

    if (!focusable.length)
    {
        event.preventDefault();
        modalBackdrop.focus();
        return;
    }

    const first =
        focusable[0];

    const last =
        focusable[
            focusable.length - 1
        ];

    if (
        event.shiftKey
        && document.activeElement
          === first
    )
    {
        event.preventDefault();
        last.focus();
    }
    else if (
        !event.shiftKey
        && document.activeElement
          === last
    )
    {
        event.preventDefault();
        first.focus();
    }
}

const SEMANTIC_SINGLE_ID_ATTRIBUTES =
    [
        'id',
        'for'
    ];

const SEMANTIC_ID_REFERENCE_ATTRIBUTES =
    [
        'aria-labelledby',
        'aria-describedby',
        'aria-controls',
        'aria-owns'
    ];

function normalizeRenderedSemanticAttributes(
    root
)
{
    root
        .querySelectorAll(
            `
            [id],
            [for],
            [aria-labelledby],
            [aria-describedby],
            [aria-controls],
            [aria-owns]
          `
        )
        .forEach(element =>
        {
            SEMANTIC_SINGLE_ID_ATTRIBUTES
                .forEach(attribute =>
                {
                    const value =
                        element.getAttribute(
                            attribute
                        );

                    if (value === null)
                    {
                        return;
                    }

                    const normalized =
                        value.replace(
                            /\s+/g,
                            ''
                        );

                    element.setAttribute(
                        attribute,
                        normalized
                    );
                });

            SEMANTIC_ID_REFERENCE_ATTRIBUTES
                .forEach(attribute =>
                {
                    const value =
                        element.getAttribute(
                            attribute
                        );

                    if (value === null)
                    {
                        return;
                    }

                    const normalized =
                        value
                            .trim()
                            .split(/\s+/)
                            .filter(Boolean)
                            .join(' ');

                    element.setAttribute(
                        attribute,
                        normalized
                    );
                });
        });
}

function validateRenderedSemanticReferences(
    root
)
{
    SEMANTIC_ID_REFERENCE_ATTRIBUTES
        .forEach(attribute =>
        {
            root
                .querySelectorAll(
                    `[${attribute}]`
                )
                .forEach(element =>
                {
                    const references =
                        (
                            element.getAttribute(
                                attribute
                            ) || ''
                        )
                            .split(/\s+/)
                            .filter(Boolean);

                    references.forEach(id =>
                    {
                        if (
                            !document
                                .getElementById(id)
                        )
                        {
                            console.warn(
                                `Missing ${attribute} target: ${id}`,
                                element
                            );
                        }
                    });
                });
        });

    root
        .querySelectorAll(
            '[for]'
        )
        .forEach(label =>
        {
            const id =
                label.getAttribute(
                    'for'
                );

            if (
                id
            && !document
                .getElementById(id)
            )
            {
                console.warn(
                    `Missing label target: ${id}`,
                    label
                );
            }
        });
}

const nestedModalFrames = [];

function openNestedModal(html)
{
    if (!modalBackdrop.classList.contains('open'))
    {
        openModal(html);
        return;
    }

    const activeElement = document.activeElement instanceof HTMLElement
        ? document.activeElement : null;
    const content =
        document.createDocumentFragment();

    while (modalBackdrop.firstChild)
    {
        content.appendChild(
            modalBackdrop.firstChild
        );
    }

    nestedModalFrames.push({
        content,
        beforeClose: modalBackdrop.beforeClose,
        afterClose: modalBackdrop.afterClose,
        activeElement
    });

    openModal(html);
}

function restoreNestedModalFrame()
{
    const frame =
        nestedModalFrames.pop();

    if (!frame) return false;

    modalBackdropDismissBinding?.destroy();
    modalBackdropDismissBinding = null;

    modalBackdrop.innerHTML = '';
    modalBackdrop.appendChild(frame.content);
    modalBackdrop.beforeClose = frame.beforeClose || null;
    modalBackdrop.afterClose = frame.afterClose || null;

    modalBackdropDismissBinding =
        bindIntentionalBackdropDismiss(
            modalBackdrop,
            () => { if (!modalBackdrop.querySelector('.add-person-modal')) closeModal(); }
        );

    requestAnimationFrame(() =>
    {
        if (frame.activeElement?.isConnected)
        {
            frame.activeElement.focus({
                preventScroll: true
            });
            return;
        }

        modalFocusableElements()[0]?.focus({
            preventScroll: true
        });
    });

    return true;
}

function openModal(
    html
)
{
    if (!(mobileSurface === 'details' && ['Family Tree', 'People', 'Albums', 'Archive', 'Places'].includes(state.activeModule))
        && !(mobileSurface === 'sections' && ['Albums', 'Archive', 'Places'].includes(state.activeModule)))
    {
        closeMobileSurface();
    }
    if (geneoTourRuntime.active && !geneoTourRuntime.openingPreview)
        geneoTourClose({ offerRestore: false });
    const activeBeforeMenuClose =
        document.activeElement;

    const preferredReturnFocus =
        activeBeforeMenuClose
          instanceof Element
        && activeBeforeMenuClose.closest(
            '.menu-popover'
        )
        && menuLifecycleAnchor
            ? menuLifecycleAnchor
            : (
                activeBeforeMenuClose
              instanceof HTMLElement
                    ? activeBeforeMenuClose
                    : null
            );

    closeMenu();

    if (
        !modalBackdrop.classList
            .contains('open')
    )
    {
        modalReturnFocus =
            preferredReturnFocus;
    }

    /*
      * Reopening or replacing modal content starts with completely
      * fresh backdrop-gesture state.
      */
    modalBackdropDismissBinding?.destroy();
    modalBackdropDismissBinding = null;

    document.removeEventListener(
        'keydown',
        handleModalKeydown,
        true
    );

    modalBackdrop.innerHTML =
        html;
    modalBackdrop.beforeClose = null;
    modalBackdrop.afterClose = null;

    normalizeRenderedSemanticAttributes(
        modalBackdrop
    );

    modalBackdrop.classList.add(
        'open'
    );

    modalBackdrop.removeAttribute(
        'aria-hidden'
    );

    modalBackdrop.setAttribute(
        'tabindex',
        '-1'
    );

    setApplicationInert(
        true
    );

    modalBackdrop
        .querySelectorAll(
            '[data-close]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                closeModal
            );
        });

    modalBackdropDismissBinding =
        bindIntentionalBackdropDismiss(
            modalBackdrop,
            () => { if (!modalBackdrop.querySelector('.add-person-modal')) closeModal(); }
        );

    document.addEventListener(
        'keydown',
        handleModalKeydown,
        true
    );

    localizeUI(
        modalBackdrop,
        {
            suppressObserverReplay: true
        }
    );

    validateRenderedSemanticReferences(
        modalBackdrop
    );

    requestAnimationFrame(() =>
    {
        const initial =
            modalBackdrop.querySelector(
                '[data-modal-initial-focus], [autofocus]'
            )
          || modalFocusableElements()[0]
          || modalBackdrop;

        initial.focus();
    });
}

function openPersonPhotoDiscardConfirm()
{
    if (
        document.getElementById(
            'personPhotoDiscardOverlay'
        )
    )
    {
        return;
    }

    const overlay =
        document.createElement('div');

    overlay.className =
        'add-person-mini-backdrop';

    overlay.id =
        'personPhotoDiscardOverlay';

    overlay.innerHTML = `
        <div class="add-person-mini-card" role="alertdialog" aria-modal="true" aria-labelledby="personPhotoDiscardTitle">
          <div class="add-person-mini-head">
            <div>
              <h3 id="personPhotoDiscardTitle">Discard photo changes?</h3>
              <p>Your selected photo and crop adjustments will not be saved.</p>
            </div>
          </div>

          <div class="add-person-mini-footer">
            <button class="button secondary" type="button" data-person-photo-continue-editing>Continue editing</button>
            <button class="button danger" type="button" data-person-photo-discard>Discard changes</button>
          </div>
        </div>
      `;

    let backdropDismissBinding = null;

    const removeOverlay = () =>
    {
        backdropDismissBinding?.destroy();
        backdropDismissBinding = null;
        overlay.remove();
    };

    document.body.appendChild(overlay);

    backdropDismissBinding =
        bindIntentionalBackdropDismiss(
            overlay,
            removeOverlay
        );

    overlay
        .querySelector(
            '[data-person-photo-continue-editing]'
        )
        ?.addEventListener(
            'click',
            removeOverlay
        );

    overlay
        .querySelector(
            '[data-person-photo-discard]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                removeOverlay();
                resetPersonPhotoPickerState();
                closeModal({
                    force: true
                });
            }
        );

    overlay
        .querySelector(
            '[data-person-photo-continue-editing]'
        )
        ?.focus();
}

function closeModal(options = {})
{
    if (!options?.force && modalBackdrop.beforeClose?.() === false) return;
    if (genealogyDatePopover) closeGenealogyDateEditor();
    modalBackdrop.beforeClose = null;
    if (document.querySelector('[data-place-duplicate-menu]'))
    {
        closeMenu();
    }
    const {
        force = false,
        preservePlaceEditor = false,
        escapeDismissed = false
    } = options || {};

    const returnToPlaceEditor = Boolean(
        !force
        && placeEditorDraft
        && modalBackdrop.querySelector('[data-place-delete-confirm][data-return-to-place-editor]')
    );
    if (returnToPlaceEditor)
    {
        openPlaceModal(placeEditorDraft.placeId, { draft: placeEditorDraft });
        return;
    }
    const closingPlaceEditor = Boolean(
        placeEditorDraft
        && modalBackdrop.querySelector('[data-place-editor]')
    );
    const cancelledPlaceEditorCompletion =
        closingPlaceEditor
        && !force
        && !preservePlaceEditor
            ? placeEditorCompletion
            : null;
    const closingPersonPhotoPicker = Boolean(
        state.personPhotoPicker?.open
        && modalBackdrop.querySelector('[data-person-photo-picker]')
    );
    const closingPersonPhotosAdder =
        Boolean(
            state.personPhotosAdder?.open
          && modalBackdrop.querySelector(
              '[data-person-photos-adder]'
          )
        );
    const closingGeneographImagePicker = Boolean(
        state.geneoImagePicker?.open
        && modalBackdrop.querySelector('[data-geneo-image-picker]')
    );
    if (closingPersonPhotoPicker && state.personPhotoPicker.dirty && !force)
    {
        openPersonPhotoDiscardConfirm();
        return;
    }
    if (closingPersonPhotoPicker) resetPersonPhotoPickerState();
    if (closingPersonPhotosAdder)
    {
        resetPersonPhotosAdderState();
    }
    if (closingGeneographImagePicker)
    {
        resetGeneographImagePickerState();
    }
    if (
        closingPlaceEditor
        && !preservePlaceEditor
    )
    {
        resetPlaceEditorDraft();
    }
    const afterClose = modalBackdrop.afterClose;
    modalBackdrop.afterClose = null;
    if (nestedModalFrames.length)
    {
        restoreNestedModalFrame();
        cancelledPlaceEditorCompletion?.onCancel?.();
        return;
    }

    nestedModalFrames.length = 0;
    document.getElementById('personPhotoDiscardOverlay')?.remove();
    document.getElementById('addPersonMiniOverlay')?.remove();
    document.getElementById('addPersonDiscardOverlay')?.remove();

    modalBackdropDismissBinding?.destroy();
    modalBackdropDismissBinding = null;

    modalBackdrop.classList.remove('open');
    modalBackdrop.setAttribute('aria-hidden', 'true');
    modalBackdrop.removeAttribute('tabindex');
    if (modalBackdrop.querySelector('.geneo-family-review')) geneoTreeImportDraft = null;
    modalBackdrop.innerHTML = '';

    document.removeEventListener(
        'keydown',
        handleModalKeydown,
        true
    );

    setApplicationInert(false);
    if (afterClose && !options.skipAfterClose) queueMicrotask(afterClose);

    const returnTarget = modalReturnFocus;
    modalReturnFocus = null;
    if (escapeDismissed) suppressSplitFocusAfterEscape(returnTarget);

    requestAnimationFrame(
        () =>
        {
            if (
                returnTarget
                    ?.isConnected
            )
            {
                if ((!escapeDismissed || !returnTarget.closest?.('.tool-split')) && (lastInteractionWasKeyboard || !returnTarget.closest?.('.tool-split')))
                    returnTarget.focus({ preventScroll: true });
            }

            cancelledPlaceEditorCompletion
                ?.onCancel
                ?.();
        }
    );
}

function bindToasts(
    root
)
{
    root
        .querySelectorAll(
            '[data-toast]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    showToast(
                        button.dataset
                            .toast
                    );
                }
            );
        });
}

function hideToast()
{
    clearTimeout(
        showToast.timer
    );

    toast.classList.remove(
        'show'
    );

    toast.innerHTML =
        '';
}

function showActionToast({
    message,
    actions = [],
    duration = 6200
} = {})
{
    clearTimeout(
        showToast.timer
    );

    const translatedMessage =
        translateAttributeValue(
            message
        );

    toast.innerHTML = `
        <span
          class="
            toast-message
          ">

          ${escapeHtml(
                translatedMessage
            )}
        </span>

        ${
            actions.length
                ? `
              <span
                class="
                  toast-actions
                "
                aria-label="Notification actions">
              </span>
            `
                : ''
        }
      `;

    const actionsRoot =
        toast.querySelector(
            '.toast-actions'
        );

    actions.forEach(action =>
    {
        const button =
            document.createElement(
                'button'
            );

        button.className =
            'toast-action';

        button.type =
            'button';

        button.textContent =
            translateAttributeValue(
                action.label
            );

        button.addEventListener(
            'click',
            () =>
            {
                hideToast();

                action.onClick?.();
            }
        );

        actionsRoot?.appendChild(
            button
        );
    });

    toast.classList.add(
        'show'
    );

    showToast.timer =
        setTimeout(
            hideToast,
            duration
        );
}

function showToast(
    message
)
{
    showActionToast({
        message,
        duration:
          2600
    });
}
function escapeHtml(value)
{
    return String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll('\'','&#039;');
}
function capitalize(value)
{
    return value.charAt(0).toUpperCase() + value.slice(1);
}

function normalizePlaceSavedFilters()
{
    const source =
        Array.isArray(
            sampleData.placeSavedFilters
        )
            ? sampleData.placeSavedFilters
            : [];

    const usedIds =
        new Set();

    let nextId =
        Date.now();

    const now =
        new Date().toISOString();

    sampleData.placeSavedFilters =
        source
            .filter(savedFilter =>
                savedFilter
            && typeof savedFilter === 'object'
            && !Array.isArray(savedFilter)
            )
            .map(savedFilter =>
            {
                let id =
                    String(
                        savedFilter.id || ''
                    ).trim();

                while (
                    !id
              || usedIds.has(id)
                )
                {
                    id =
                        `place-saved-filter-${nextId}`;

                    nextId += 1;
                }

                usedIds.add(id);

                const createdAt =
                    Number.isFinite(
                        Date.parse(
                            savedFilter.createdAt || ''
                        )
                    )
                        ? savedFilter.createdAt
                        : now;

                const updatedAt =
                    Number.isFinite(
                        Date.parse(
                            savedFilter.updatedAt || ''
                        )
                    )
                        ? savedFilter.updatedAt
                        : createdAt;

                return {
                    ...savedFilter,

                    id,

                    projectId:
                String(
                    savedFilter.projectId
                  || ''
                ),

                    name:
                String(
                    savedFilter.name || ''
                ).trim()
                || 'Unnamed filter',

                    description:
                String(
                    savedFilter.description
                  || ''
                ),

                    filters:
                placeFiltersWithDefaults(
                    savedFilter.filters
                ),

                    createdAt,
                    updatedAt
                };
            });
}

function normalizePlaceIssueDismissals()
{
    const seen = new Set();
    sampleData.placeIssues = (sampleData.placeIssues || []).filter(issue =>
    {
        if (!issue || issue.status !== 'dismissed') return false;
        if (!PLACE_REVIEW_COORDINATE_ISSUE_TYPES.includes(issue.type)) return false;
        const place = getPlace(issue.placeId);
        if (!place || place.deleted || place.projectId !== issue.projectId) return false;
        const key = `${issue.projectId}:${issue.placeId}:${issue.type}`;
        if (seen.has(key)) return false;
        seen.add(key);
        issue.id = String(issue.id || `place-issue-dismissal-${Date.now()}-${seen.size}`);
        issue.dismissedAt = Number.isFinite(Date.parse(issue.dismissedAt || ''))
            ? issue.dismissedAt
            : new Date().toISOString();
        return true;
    });
}

function normalizeCentralPlaceRecords()
{
    sampleData.places.forEach(place =>
    {
        place.projectId = String(place.projectId || '');
        const legacyName = String(place.name || '').trim();
        const legacyDisplay = String(place.display || '').trim();
        const legacyHierarchy = place.hierarchy && typeof place.hierarchy === 'object' && !Array.isArray(place.hierarchy)
            ? [place.hierarchy.locality, place.hierarchy.county || place.hierarchy.region, place.hierarchy.nation || place.hierarchy.country].filter(Boolean).join(', ')
            : String(place.hierarchy || '').trim();
        const fullName = legacyDisplay.includes(',')
            ? legacyDisplay
            : (legacyName.includes(',') ? legacyName : (legacyHierarchy || legacyName));
        place.name = fullName || legacyName || 'Unnamed place';
        const candidates = [
            ...(Array.isArray(place.alternativeNames) ? place.alternativeNames : []),
            ...(Array.isArray(place.aliases) ? place.aliases : []),
            ...(legacyName && legacyName !== place.name ? [legacyName] : [])
        ];
        place.alternativeNames = normalizePlaceAlternativeNames(candidates, place.name);
        place.deleted = Boolean(place.deleted);
        const normalizedCoordinates = normalizePlaceCoordinates(place);
        if (normalizedCoordinates)
        {
            place.coordinates = normalizedCoordinates;
        }
        else if (place.coordinates && typeof place.coordinates === 'object')
        {
            place.coordinates = {
                lat: place.coordinates.lat ?? '',
                lng: place.coordinates.lng ?? ''
            };
        }
        else
        {
            place.coordinates = null;
        }
        place.updatedAt = Number.isFinite(Date.parse(place.updatedAt || '')) ? place.updatedAt : new Date().toISOString();
        delete place.display;
        delete place.type;
        delete place.hierarchy;
        delete place.coordinateStatus;
        delete place.coordinateAccuracy;
        delete place.coordinateSource;
        delete place.coordinateProvider;
        delete place.externalPlaceId;
        delete place.boundingBox;
        delete place.coordinateReference;
        delete place.markerType;
        delete place.aliases;
        delete place.collections;
        delete place.topEvents;
        delete place.coords;
        delete place.x;
        delete place.y;
        delete place.status;
        delete place.statusLabel;
        delete place.updated;
        delete place.people;
        delete place.events;
        delete place.files;
        delete place.photos;
        delete place.notes;
    });
}

function normalizeEventPlaceAddresses()
{
    const normalizeRecord = record =>
    {
        if (record && typeof record === 'object' && ('placeId' in record || 'placeText' in record))
        {
            record.address = typeof record.address === 'string' ? record.address : '';
        }
    };
    sampleData.people.forEach(person =>
    {
        normalizeRecord(person.birth);
        normalizeRecord(person.death);
        if (person.death && ('burialPlaceId' in person.death || 'burialPlaceText' in person.death))
        {
            person.death.burialAddress = typeof person.death.burialAddress === 'string' ? person.death.burialAddress : '';
        }
        (person.attributes || []).forEach(normalizeRecord);
        (person.events || []).forEach(normalizeRecord);
    });
    sampleData.families.forEach(family => (family.events || []).forEach(normalizeRecord));
    (sampleData.educationSeed || []).forEach(normalizeRecord);
}

function normalizeCentralNoteIdArray(
    value
)
{
    if (!Array.isArray(value))
    {
        return [];
    }

    return [
        ...new Set(
            value
                .map(item =>
                    String(
                        item || ''
                    ).trim()
                )
                .filter(Boolean)
        )
    ];
}

function renderRichTextToolbar({
    id,
    className = '',
    ariaLabel = 'Text formatting'
} = {})
{
    const resolvedId =
        String(
            id || 'richTextToolbar'
        );

    const classes = [
        'rich-text-toolbar',
        className
    ]
        .filter(Boolean)
        .join(' ');

    return `
        <div
          class="${escapeHtml(classes)}"
          id="${escapeHtml(resolvedId)}"
          role="toolbar"
          aria-label="${escapeHtml(
                ariaLabel
            )}">

          <span class="ql-formats">
            <select
              class="ql-header"
              aria-label="Text style"
              title="Text style">
              <option value="" selected>
                Normal
              </option>

              <option value="2">
                Heading 2
              </option>

              <option value="3">
                Heading 3
              </option>
            </select>

            <select
              class="ql-size"
              aria-label="Font size"
              title="Font size">
              <option value="small">
                Small
              </option>

              <option value="" selected>
                Normal
              </option>

              <option value="large">
                Large
              </option>

              <option value="huge">
                Huge
              </option>
            </select>
          </span>

          <span class="ql-formats">
            <button
              class="ql-bold"
              type="button"
              aria-label="Bold"
              title="Bold">
            </button>

            <button
              class="ql-italic"
              type="button"
              aria-label="Italic"
              title="Italic">
            </button>

            <button
              class="ql-underline"
              type="button"
              aria-label="Underline"
              title="Underline">
            </button>

            <button
              class="ql-strike"
              type="button"
              aria-label="Strikethrough"
              title="Strikethrough">
            </button>
          </span>

          <span class="ql-formats">
            <select
              class="ql-color"
              aria-label="Text color"
              title="Text color">
            </select>

            <select
              class="ql-background"
              aria-label="Highlight color"
              title="Highlight color">
            </select>
          </span>

          <span class="ql-formats">
            <button
              class="ql-list"
              type="button"
              value="bullet"
              aria-label="Bulleted list"
              title="Bulleted list">
            </button>

            <button
              class="ql-list"
              type="button"
              value="ordered"
              aria-label="Numbered list"
              title="Numbered list">
            </button>

            <button
              class="ql-indent"
              type="button"
              value="-1"
              aria-label="Decrease indent"
              title="Decrease indent">
            </button>

            <button
              class="ql-indent"
              type="button"
              value="+1"
              aria-label="Increase indent"
              title="Increase indent">
            </button>
          </span>

          <span class="ql-formats">
            <select
              class="ql-align"
              aria-label="Alignment"
              title="Alignment">
            </select>
          </span>

          <span class="ql-formats">
            <button
              class="ql-blockquote"
              type="button"
              aria-label="Block quote"
              title="Block quote">
            </button>

            <button
              class="ql-link"
              type="button"
              aria-label="Link"
              title="Link">
            </button>

            <button
              class="ql-clean"
              type="button"
              aria-label="Clear formatting"
              title="Clear formatting">
            </button>
          </span>
        </div>
      `;
}

function richTextSafeLinkUrl(
    value
)
{
    const raw =
        String(value || '').trim();

    if (!raw)
    {
        return '';
    }

    try
    {
        const url =
            new URL(
                raw,
                window.location.href
            );

        if (
            ![
                'http:',
                'https:',
                'mailto:'
            ].includes(url.protocol)
        )
        {
            return '';
        }

        return url.href;
    }
    catch
    {
        return '';
    }
}

function renderRichTextInline(
    value,
    attributes = {}
)
{
    let html =
        escapeHtml(
            String(value || '')
        );

    if (attributes.bold === true)
    {
        html =
            `<strong>${html}</strong>`;
    }

    if (attributes.italic === true)
    {
        html =
            `<em>${html}</em>`;
    }

    if (
        attributes.underline
          === true
    )
    {
        html =
            `<u>${html}</u>`;
    }

    if (
        attributes.strike
          === true
    )
    {
        html =
            `<s>${html}</s>`;
    }

    const classes = [];

    const size =
        normalizeRichTextSize(
            attributes.size
        );

    if (size)
    {
        classes.push(
            `rich-text-size-${size}`
        );
    }

    const styles = [];

    const color =
        normalizeRichTextColor(
            attributes.color
        );

    if (color)
    {
        styles.push(
            `color:${color}`
        );
    }

    const background =
        normalizeRichTextColor(
            attributes.background
        );

    if (background)
    {
        styles.push(
            `background-color:${background}`
        );
    }

    if (
        classes.length
        || styles.length
    )
    {
        const classAttribute =
            classes.length
                ? ` class="${escapeHtml(
                    classes.join(' ')
                )}"`
                : '';

        const styleAttribute =
            styles.length
                ? ` style="${escapeHtml(
                    styles.join(';')
                )}"`
                : '';

        html =
            `<span${classAttribute}${styleAttribute}>${html}</span>`;
    }

    const href =
        richTextSafeLinkUrl(
            attributes.link
        );

    if (href)
    {
        html = `
          <a
            href="${escapeHtml(href)}"
            target="_blank"
            rel="noopener noreferrer">
            ${html}
          </a>
        `;
    }

    return html;
}

function renderPlainRichTextHtml(
    value
)
{
    return String(value || '')
        .split(/\r?\n/)
        .map(line => `
          <p>
            ${
                line
                    ? escapeHtml(line)
                    : '<br>'
            }
          </p>
        `)
        .join('');
}

function richTextBlockClassNames(
    attributes = {}
)
{
    const classes = [];

    const alignment =
        normalizeRichTextAlignment(
            attributes.align
        );

    if (alignment)
    {
        classes.push(
            `rich-text-align-${alignment}`
        );
    }

    const indent =
        normalizeRichTextIndent(
            attributes.indent
        );

    if (indent)
    {
        classes.push(
            `rich-text-indent-${indent}`
        );
    }

    return classes;
}

function richTextBlockClassAttribute(
    attributes = {}
)
{
    const classes =
        richTextBlockClassNames(
            attributes
        );

    return classes.length
        ? ` class="${escapeHtml(
            classes.join(' ')
        )}"`
        : '';
}

function renderRichTextDeltaHtml(
    value,
    fallbackText = ''
)
{
    const delta =
        normalizeRichTextDelta(
            value
        );

    if (!delta)
    {
        return (
            renderPlainRichTextHtml(
                fallbackText
            )
        );
    }

    const lines = [];
    let fragments = [];

    delta.ops.forEach(operation =>
    {
        const attributes =
            operation.attributes || {};

        const parts =
            operation.insert.split('\n');

        parts.forEach(
            (part, index) =>
            {
                if (part)
                {
                    fragments.push(
                        renderRichTextInline(
                            part,
                            attributes
                        )
                    );
                }

                if (
                    index
              < parts.length - 1
                )
                {
                    lines.push({
                        html:
                  fragments.join(''),

                        attributes: {
                            header:
                    attributes.header,

                            list:
                    attributes.list,

                            blockquote:
                    attributes.blockquote,

                            align:
                    attributes.align,

                            indent:
                    attributes.indent
                        }
                    });

                    fragments = [];
                }
            }
        );
    });

    if (fragments.length)
    {
        lines.push({
            html:
            fragments.join(''),

            attributes: {}
        });
    }

    if (!lines.length)
    {
        return (
            renderPlainRichTextHtml(
                fallbackText
            )
        );
    }

    let html = '';
    let activeList = null;
    let listItems = [];

    const flushList = () =>
    {
        if (!activeList)
        {
            return;
        }

        const tag =
            activeList === 'ordered'
                ? 'ol'
                : 'ul';

        html += `
          <${tag}>
            ${listItems.join('')}
          </${tag}>
        `;

        activeList = null;
        listItems = [];
    };

    lines.forEach(line =>
    {
        const content =
            line.html || '<br>';

        const attributes =
            line.attributes || {};

        const classAttribute =
            richTextBlockClassAttribute(
                attributes
            );

        if (attributes.list)
        {
            if (
                activeList
            && activeList
              !== attributes.list
            )
            {
                flushList();
            }

            activeList =
                attributes.list;

            listItems.push(
                `<li${classAttribute}>${content}</li>`
            );

            return;
        }

        flushList();

        if (attributes.header === 2)
        {
            html +=
                `<h2${classAttribute}>${content}</h2>`;

            return;
        }

        if (attributes.header === 3)
        {
            html +=
                `<h3${classAttribute}>${content}</h3>`;

            return;
        }

        if (
            attributes.blockquote
            === true
        )
        {
            html +=
                `<blockquote${classAttribute}>${content}</blockquote>`;

            return;
        }

        html +=
            `<p${classAttribute}>${content}</p>`;
    });

    flushList();

    return html;
}

function richTextDeltasEqual(
    first,
    second
)
{
    return (
        JSON.stringify(
            normalizeRichTextDelta(
                first
            )
        )
        ===
        JSON.stringify(
            normalizeRichTextDelta(
                second
            )
        )
    );
}

function normalizeRichTextColor(
    value
)
{
    const color =
        String(value || '')
            .trim()
            .toLowerCase();

    /*
       * Quill Snow's built-in color palettes
       * use hexadecimal CSS colors.
       */
    return (
        /^#[0-9a-f]{3}$/.test(color)
        || /^#[0-9a-f]{6}$/.test(color)
    )
        ? color
        : '';
}

function normalizeRichTextSize(
    value
)
{
    return [
        'small',
        'large',
        'huge'
    ].includes(value)
        ? value
        : '';
}

function normalizeRichTextAlignment(
    value
)
{
    return [
        'center',
        'right',
        'justify'
    ].includes(value)
        ? value
        : '';
}

function normalizeRichTextIndent(
    value
)
{
    const indent =
        Number(value);

    return (
        Number.isInteger(indent)
        && indent >= 1
        && indent <= 8
    )
        ? indent
        : 0;
}

function normalizeRichTextDelta(
    value
)
{
    if (
        !value
        || typeof value
          !== 'object'
        || !Array.isArray(
            value.ops
        )
    )
    {
        return null;
    }

    const normalizedOps =
        value.ops
            .map(operation =>
            {
                if (
                    !operation
              || typeof operation
                !== 'object'
              || typeof operation.insert
                !== 'string'
              || operation.insert
                === ''
                )
                {
                    return null;
                }

                const normalized = {
                    insert:
                operation.insert
                };

                const sourceAttributes =
                    operation.attributes
              && typeof operation.attributes
                === 'object'
                        ? operation.attributes
                        : null;

                if (!sourceAttributes)
                {
                    return normalized;
                }

                const attributes = {};

                if (
                    sourceAttributes.bold
                === true
                )
                {
                    attributes.bold =
                        true;
                }

                if (
                    sourceAttributes.italic
                === true
                )
                {
                    attributes.italic =
                        true;
                }

                if (
                    sourceAttributes.underline
                === true
                )
                {
                    attributes.underline =
                        true;
                }

                if (
                    sourceAttributes.strike
                === true
                )
                {
                    attributes.strike =
                        true;
                }

                const textColor =
                    normalizeRichTextColor(
                        sourceAttributes.color
                    );

                if (textColor)
                {
                    attributes.color =
                        textColor;
                }

                const backgroundColor =
                    normalizeRichTextColor(
                        sourceAttributes
                            .background
                    );

                if (backgroundColor)
                {
                    attributes.background =
                        backgroundColor;
                }

                const size =
                    normalizeRichTextSize(
                        sourceAttributes.size
                    );

                if (size)
                {
                    attributes.size =
                        size;
                }

                if (
                    sourceAttributes.blockquote
                === true
                )
                {
                    attributes.blockquote =
                        true;
                }

                if (
                    sourceAttributes.header
                === 2
              || sourceAttributes.header
                === 3
                )
                {
                    attributes.header =
                        sourceAttributes.header;
                }

                if (
                    sourceAttributes.list
                === 'bullet'
              || sourceAttributes.list
                === 'ordered'
                )
                {
                    attributes.list =
                        sourceAttributes.list;
                }

                const alignment =
                    normalizeRichTextAlignment(
                        sourceAttributes.align
                    );

                if (alignment)
                {
                    attributes.align =
                        alignment;
                }

                const indent =
                    normalizeRichTextIndent(
                        sourceAttributes.indent
                    );

                if (indent)
                {
                    attributes.indent =
                        indent;
                }

                if (
                    typeof sourceAttributes.link
                === 'string'
              && sourceAttributes.link.trim()
                )
                {
                    attributes.link =
                        sourceAttributes.link
                            .trim();
                }

                if (
                    Object.keys(
                        attributes
                    ).length
                )
                {
                    normalized.attributes =
                        attributes;
                }

                return normalized;
            })
            .filter(Boolean);

    return {
        ops:
          normalizedOps
    };
}

function cloneRichTextDelta(
    value
)
{
    return normalizeRichTextDelta(
        value
    );
}

function plainTextFromRichTextDelta(
    value
)
{
    const delta =
        normalizeRichTextDelta(
            value
        );

    if (!delta)
    {
        return '';
    }

    const text =
        delta.ops
            .map(operation =>
                operation.insert
            )
            .join('');

    return text.endsWith('\n')
        ? text.slice(0, -1)
        : text;
}

function normalizeCentralNoteTimestamp(
    value,
    fallback
)
{
    if (
        Number.isFinite(
            Date.parse(value || '')
        )
    )
    {
        return new Date(
            value
        ).toISOString();
    }

    return fallback;
}

function normalizeCentralNoteChecklist(
    note
)
{
    const source =
        Array.isArray(
            note.checklist
        )
            ? note.checklist
            : (
                Array.isArray(
                    note.tasks
                )
                    ? note.tasks
                    : []
            );

    return source
        .map((item, index) => ({
            id:
            String(
                item?.id
              || `${note.id}-check-${index + 1}`
            ).trim(),

            text:
            String(
                item?.text || ''
            ).trim(),

            done:
            Boolean(
                item?.done
            )
        }))
        .filter(item =>
            item.id
          && item.text
        );
}

function normalizeCentralNoteRecord(
    note
)
{
    const fallbackTimestamp =
        new Date().toISOString();

    note.id =
        String(
            note.id || ''
        ).trim();

    note.projectId =
        String(
            note.projectId || ''
        ).trim();

    note.title =
        String(
            note.title
          || 'Untitled note'
        ).trim()
        || 'Untitled note';

    note.body =
        typeof note.body === 'string'
            ? note.body
            : '';

    note.bodyDelta =
        normalizeRichTextDelta(
            note.bodyDelta
        );

    if (note.bodyDelta)
    {
        note.bodyFormat =
            'quill-delta-v1';

        note.body =
            plainTextFromRichTextDelta(
                note.bodyDelta
            );
    }
    else
    {
        note.bodyDelta =
            null;

        note.bodyFormat =
            '';
    }

    note.collectionIds =
        normalizeCentralNoteIdArray([
            ...(
                Array.isArray(
                    note.collectionIds
                )
                    ? note.collectionIds
                    : []
            ),

            note.collectionId
        ]);

    note.favorite =
        Boolean(
            note.favorite
          ?? note.pinned
        );

    note.archived =
        Boolean(
            note.archived
        );

    note.checklist =
        normalizeCentralNoteChecklist(
            note
        );

    note.linkedPersonIds =
        normalizeCentralNoteIdArray([
            ...(
                Array.isArray(
                    note.linkedPersonIds
                )
                    ? note.linkedPersonIds
                    : []
            ),

            ...(
                Array.isArray(
                    note.personIds
                )
                    ? note.personIds
                    : []
            )
        ]);

    note.linkedPlaceIds =
        normalizeCentralNoteIdArray(
            note.linkedPlaceIds
        );

    note.linkedEventIds =
        normalizeCentralNoteIdArray(
            note.linkedEventIds
        );

    note.linkedPhotoIds =
        normalizeCentralNoteIdArray(
            note.linkedPhotoIds
        ).filter(photoId =>
            Boolean(
                getPhoto(
                    photoId,
                    {
                        projectId:
                  note.projectId
                    }
                )
            )
        );

    note.linkedArchiveFileIds =
        normalizeCentralNoteIdArray(
            note.linkedArchiveFileIds
        );

    note.relatedNoteIds =
        normalizeCentralNoteIdArray([
            ...(
                Array.isArray(
                    note.relatedNoteIds
                )
                    ? note.relatedNoteIds
                    : []
            ),

            ...(
                Array.isArray(
                    note.relatedNotes
                )
                    ? note.relatedNotes
                    : []
            )
        ]);

    note.createdAt =
        normalizeCentralNoteTimestamp(
            note.createdAt,
            fallbackTimestamp
        );

    note.updatedAt =
        normalizeCentralNoteTimestamp(
            note.updatedAt,
            note.createdAt
        );

    [
        'type',
        'status',
        'collectionId',
        'caseId',
        'confidence',
        'question',
        'conclusion',
        'evidence',
        'tasks',
        'deleted',
        'linkedPeople',
        'linkedPlaces',
        'linkedSources',
        'linkedSourceIds',
        'created',
        'updated',
        'sortRank',
        'excerpt',
        'pinned',
        'personIds',
        'relatedNotes',
        'tags'
    ].forEach(field =>
    {
        delete note[field];
    });

    return note;
}


function normalizeCentralNoteRelationships()
{
    const notesById =
        new Map(
            sampleData.notes.map(
                note => [note.id, note]
            )
        );

    sampleData.notes.forEach(note =>
    {
        note.relatedNoteIds =
            normalizeCentralNoteIdArray(
                note.relatedNoteIds
            ).filter(relatedId =>
            {
                const related =
                    notesById.get(relatedId);

                return Boolean(
                    related
              && related.id !== note.id
              && related.projectId
                === note.projectId
                );
            });
    });

    sampleData.notes.forEach(note =>
    {
        note.relatedNoteIds.forEach(
            relatedId =>
            {
                const related =
                    notesById.get(relatedId);

                if (
                    related
              && !related.relatedNoteIds
                  .includes(note.id)
                )
                {
                    related.relatedNoteIds.push(
                        note.id
                    );
                }
            }
        );
    });

    sampleData.notes.forEach(note =>
    {
        note.relatedNoteIds =
            normalizeCentralNoteIdArray(
                note.relatedNoteIds
            );
    });
}

function normalizeCentralNotes()
{
    sampleData.noteCollections =
        sampleData.noteCollections
            .filter(collection =>
                collection
            && typeof collection
              === 'object'
            )
            .map(collection =>
            {
                collection.id =
                    String(
                        collection.id || ''
                    ).trim();

                collection.projectId =
                    String(
                        collection.projectId || ''
                    ).trim();

                collection.name =
                    String(
                        collection.name || ''
                    ).trim();

                collection.description =
                    typeof collection.description
                === 'string'
                        ? collection.description
                            .trim()
                        : '';

                return collection;
            });

    sampleData.notes =
        sampleData.notes
            .filter(note =>
                note
            && typeof note
              === 'object'
            )
            .map(
                normalizeCentralNoteRecord
            );
}

function normalizeCentralRuntimeData()
{
    sampleData.projects = Array.isArray(sampleData.projects) ? sampleData.projects : [];
    sampleData.people = Array.isArray(sampleData.people) ? sampleData.people : [];
    sampleData.places = Array.isArray(sampleData.places) ? sampleData.places : [];
    sampleData.placeSavedFilters =
        Array.isArray(
            sampleData.placeSavedFilters
        )
            ? sampleData.placeSavedFilters
            : [];
    sampleData.placeIssues = Array.isArray(sampleData.placeIssues) ? sampleData.placeIssues : [];
    sampleData.sources = Array.isArray(sampleData.sources) ? sampleData.sources : [];
    sampleData.sourceLinks =
        Array.isArray(
            sampleData.sourceLinks
        )
            ? sampleData.sourceLinks
            : [];
    sampleData.archiveFiles = Array.isArray(sampleData.archiveFiles) ? sampleData.archiveFiles : [];
    sampleData.notes =
        Array.isArray(
            sampleData.notes
        )
            ? sampleData.notes
            : [];

    sampleData.noteCollections =
        Array.isArray(
            sampleData.noteCollections
        )
            ? sampleData.noteCollections
            : [];

    normalizeCentralNotes();
    sampleData.boardCollections =
        Array.isArray(
            sampleData.boardCollections
        )
            ? sampleData.boardCollections
            : [];

    sampleData.boards =
        Array.isArray(
            sampleData.boards
        )
            ? sampleData.boards
            : [];

    normalizeGeneographRuntimeData();
    sampleData.publishDrafts = Array.isArray(sampleData.publishDrafts) ? sampleData.publishDrafts : [];
    sampleData.notifications = Array.isArray(sampleData.notifications) ? sampleData.notifications : [];
    sampleData.activity = Array.isArray(sampleData.activity) ? sampleData.activity : [];
    normalizePlaceSavedFilters();
    normalizeCentralPlaceRecords();
    normalizePlaceIssueDismissals();
    normalizeEventPlaceAddresses();
    normalizeSampleGenealogyDates();
    normalizeAllGenealogyDateRecords();
    rebuildSampleEventsAndPruneSourceLinks();
    validateSampleData();
}

normalizeCentralRuntimeData();
state.projectContinuation = readProjectContinuation();
