const state = {
    projectOpen: false,
    currentProjectId: null,
    selectedProjectId: 'p1',
    activeModule: 'Projects',
    viewMode: 'grid',
    search: '',
    openSide: 'overview',
    projectContinuation: null,
    treeZoom: 100,
    selectedPersonId: 'silver',
    treeProjectViews: {},
    treeCenterTargetId: 'silver',
    treeInspectorCollapsed: false,
    inspectorSections: {
        insights: false,
        timeline: false,
        relationships: false,
        photos: false,
        archive: false,
        notes: false,
        sources: false,
        record: false
    },
    peopleView: 'directory',
    peopleSide: 'people',
    selectedPeopleId: 'silver',
    peopleSelectedIds: [],
    peopleSelectionAnchorId: '',
    peopleSearch: '',
    peoplePage: 1,
    peopleRowsPerPage: 25,
    peoplePaginationQueryKey: '',
    peopleSavedView: 'All people',
    peopleSavedViewId: '',
    peopleFilters: {
        surnames: [],
        birthPlaceIds: [],
        birthYear: {
            mode: '',
            from: '',
            to: ''
        },
        living: 'Any'
    },
    peopleVisibleColumns: {},
    peoplePreviewCollapsed: false,
    peopleProfileEditTab: 'main',
    geneoView: 'home',
    geneoLibraryView: 'all',
    geneoActiveCollectionId: null,
    geneoBoardSearch: '',
    geneoBoardViewMode: 'grid',
    selectedGeneoBoardId: 'gb1',
    selectedGeneoNodeId: null,
    selectedGeneoNodeIds: [],
    selectedGeneoConnectionId: null,
    selectedGeneoConnectionIds: [],
    selectedGeneoWaypointIndex: null,
    geneoTool: 'pan',
    geneoPlacementReturnTool: null,
    geneoContentKind: 'sticky',
    geneoPersonGender: 'male',
    geneoShapeKind: 'rectangle',
    geneoConnectionDraft: null,
    geneoInlineEditNodeId: null,
    geneoInlineEditSelectAll: false,
    geneoInlineEditSurface: 'canvas',
    geneoLayerRename: null,
    geneoZoom: 40,
    geneoBoardViewports: {},
    geneoInspectorCollapsed: false,
    geneoLayerSearch: '',
    geneoItemFilter: { types: [], status: 'all' },
    geneoInspectorSections: {
        canvas: {
            appearance: true,
            personCards: true
        },

        person: {
            content: true,
            familyTreeLink: true,
            card: true,
            appearance: true,
            layout: true
        },

        text: {
            content: true,
            appearance: true,
            layout: true
        },

        sticky: {
            content: true,
            appearance: true,
            layout: true
        },

        image: {
            imageSource: true,
            appearance: true,
            layout: true
        },

        panel: {
            content: true,
            appearance: true,
            layout: true
        },

        place: {
            content: true,
            appearance: true,
            layout: true
        },

        shape: {
            content: true,
            appearance: true,
            layout: true
        },

        drawing: {
            appearance: true,
            layout: true
        },

        node: {
            content: true,
            appearance: true,
            layout: true
        },

        connection: {
            connection: true,
            relationship: true,
            appearance: true
        },

        multi: {
            selection: true,
            personCards: true
        }
    },
    geneoCollapsedPanels: {},
    geneoImagePicker: {
        open: false,
        mode: 'add',
        nodeId: null,
        sourceTab: 'project',
        addView: 'results',
        albumScopeId: '',
        imageSort: 'name',
        imageFavoriteOnly: false,
        search: '',
        selectedProjectPhotoIds: [],
        uploadDrafts: [],
        addUploadsToAlbum: false,
        uploadAlbumId: '',
        uploadErrors: [],
        uploadBusy: false
    },
    albumsView: 'all',
    activeAlbumId: null,
    albumsSearch: '',
    albumsBrowserSearch: '',
    albumsFilters: { personId: '', placeId: '', dateRange: '', favouriteOnly: false },
    albumsViewMode: 'grid',
    albumsPage: 1,
    albumsRowsPerPage: 10,
    albumsGridWidth: 0,
    selectedPhotoId: 'photo-silver-portrait',
    selectedPhotoIds: [],
    albumsDetailCollapsed: false,
    albumsDetailEditing: false,
    albumsDetailEditOriginal: null,
    albumsDetailDraft: null,
    albumsDetailSections: {
        details: true,
        albums: true,
        people: false,
        notes: false,
        sources: false,
        metadata: false
    },
    personPhotoPicker: {
        open: false,
        personId: null,
        step: 'choose',
        sourceTab: 'project',
        projectScope: 'tagged',
        search: '',
        selectedPhotoId: null,
        initialPhotoId: null,
        uploadDraft: null,
        uploadError: '',
        crop: null,
        dirty: false
    },
    personPhotosAdder: {
        open: false,
        personId: null,
        sourceTab: 'project',
        search: '',
        selectedProjectPhotoIds: [],
        uploadDrafts: [],
        uploadErrors: []
    },
    archiveView: 'files',
    archiveFileLayout: 'details',
    archiveSelectedFolderId: null,
    archiveSelectedFolderItemId: null,
    archiveSelectedFileId: null,
    archiveSelectedSourceId: 'as1',
    archiveSourceExpandedGroups: {},
    archiveSelectedFileIds: [],
    archiveSelectedFolderIds: [],
    archiveSearch: '',
    archiveFileFilters: {
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
    },
    archiveFilterPresentation: 'flat',
    archiveFilterScopeFolderId: null,
    archiveSourceCategoryFilter: 'all',
    archiveSourceConnectionFilter: 'all',
    archiveSourceFavouriteOnly: false,
    archiveSourceTargetFilter: null,
    archiveInspectorCollapsed: false,
    archiveFileEditing: false,
    archiveFileEditOriginal: null,
    archiveFileEditDraft: null,
    archiveInspectorSections: {
        details: true,
        sources: false,
        people: false,
        events: false,
        notes: false,
        places: false,
        metadata: false,
        'source-details': true,
        'source-file': false,
        'source-photo': false,
        'source-person': false,
        'source-event': false,
        'source-note': false,
        'source-place': false
    },
    archiveExpandedFolders: {
        pawford: true,
        fond12: true,
        opis3: true,
        documents:
          true
    },
    archiveNavigationBackStack: [],
    archiveNavigationForwardStack: [],
    archivePendingTreeRevealId: null,
    notesView: 'all',
    notesActiveCollectionId: null,
    selectedNoteId: null,
    notesSearch: '',
    notesMobileSearchOpen: false,
    notesContext: null,
    notesMobilePane: 'browser',
    notesSaveStatus: 'Saved',

    notesRightCollapsed: true,
    notesBrowserWidth: 550,

    notesFilters: {
        personId: '',
        placeId: '',
        sourceId: '',
        hasNotes: false,
        hasPhotos: false,
        hasFiles: false,
        hasEvents: false,
        noCollections: false
    },

    notesEditorSections: {
        collections: true,
        checklist: true,
        people: false,
        places: false,
        events: false,
        photos: false,
        sources: false,
        files: false,
        related: false,
        info: false
    },
    placesView: 'all',
    placesSavedFilterId: '',
    selectedPlaceId: 'place-pawford',
    selectedPlaceReviewPairKey: '',
    placesSearch: '',
    placesReviewFocusId: '',
    placesReviewExpandedGroups: {
        invalid_coordinates: true,
        missing_coordinates: true,
        unlinked: true,
        dismissed: false
    },
    placesViewMode: 'map',
    placesInspectorCollapsed: false,
    placesInspectorSections: {
        names: true,
        events: true,
        photos: false,
        files: false,
        notes: false,
        sources: false
    },
    placesInspectorShowAllEvents: false,
    placesMapView: {
        center: null,
        zoom: PLACES_MAP_CONFIG.defaultZoom,
        userMoved: false,
        lastFitKey: ''
    },
    placesRouteMode: 'none',
    placesRoutePersonId: '',
    placesRouteSurname: '',
    placesShowRoute: false,
    placesMapInfoExpanded: false,
    placesFilters: {
        ...defaultPlaceFilters
    },
    placesExpandedCountries: ['England'],
    publishView: 'home',
    publishSide: 'drafts',
    publishSearch: '',
    publishSelectedDraftId: 'pub1',
    publishWizardStep: 'type',
    publishOutputType: 'report',
    publishScopeMode: 'person',
    publishFocusPersonId: 'silver',
    publishGenerations: 4,
    publishFormat: 'PDF',
    publishSettings: {
        includePhotos: true,
        includeDatesPlaces: true,
        includeSources: true,
        includeNotes: false,
        includeArchiveRefs: true,
        includeLivingPeople: false,
        anonymizeLiving: true,
        includePrivateNotes: false,
        includeUnsourcedFacts: false
    },
    sort: 'updated',
    sortDirection: 'descending',

    peopleSort: 'updated',
    peopleSortDirection: 'descending',

    geneoBoardSort: 'updated',
    geneoBoardSortDirection: 'descending',

    albumsSort: 'updated',
    albumsSortDirection: 'descending',

    archiveFileSort: 'name',
    archiveFileSortDirection: 'ascending',

    archiveSourceSort: 'name',
    archiveSourceSortDirection: 'ascending',

    notesSort: 'updated',
    notesSortDirection: 'descending',

    placesSort: 'name',
    placesSortDirection: 'ascending',
    topbarPopover: null,
    userSignedIn: true,
    unreadNotifications: 5,
    globalSettingsSection: 'general',
    language: initialLanguage()
};

function validProjectById(projectId)
{
    return (
        sampleData.projects || []
    ).find(project =>
        project.id === projectId
        && !project.deleted
        && project.available !== false
    ) || null;
}

function currentProjectId()
{
    const activeId =
        state.currentProjectId
        || '';

    return validProjectById(activeId)?.id || '';
}

function requireActiveProjectId()
{
    const projectId = currentProjectId();

    if (!projectId)
    {
        showToast('Open a project before creating records.');
        return '';
    }

    return projectId;
}


function treeFocusContext(projectId)
{
    const peopleById = new Map(sampleData.people.map(person => [person.id, person]));
    const lookupPerson = id => peopleById.get(id);
    return { projectId, people: getPeople(projectId), lookupPerson, editRevision: prototypeSessionEditRevision };
}

function treeContextFamilies(context)
{
    return context.families ??= getTreeFamiliesFromSampleData(context.projectId, context.lookupPerson);
}

function hydrateTreeProjection(projection, context)
{
    const { projectId, lookupPerson } = context;
    const counts = new Map(projection.people.map(person => [person.id, { photos: 0, files: 0, notes: 0 }]));
    const count = (ids, field) =>
    {
        for (const id of new Set(ids))
            if (counts.has(id)) counts.get(id)[field]++;
    };
    for (const photo of getProjectPhotos(projectId))
        if (Array.isArray(photo.personIds)) count(photo.personIds, 'photos');
    for (const file of sampleData.archiveFiles || [])
        if (!file.deleted && (!file.projectId || file.projectId === projectId))
            count(file.linkedPersonIds || [], 'files');
    if (projectId === currentProjectId())
        for (const note of getProjectNotes(projectId))
            count(noteEntityLinkedIds(note, 'person').filter(id => !lookupPerson(id)?.deleted), 'notes');

    const partnerFamilies = new Map();
    for (const family of centralFamilyRecords())
    {
        const ids = [familyPartnerAId(family), familyPartnerBId(family)];
        if (!ids.every(id => id && lookupPerson(id))) continue;
        for (const id of new Set(ids))
        {
            if (!counts.has(id)) continue;
            if (!partnerFamilies.has(id)) partnerFamilies.set(id, []);
            partnerFamilies.get(id).push(family);
        }
    }
    const display = { lookupPerson, counts, partnerFamilies };
    return { ...projection, editRevision: context.editRevision,
        people: projection.people.map(person => toTreePerson(person, display)) };
}

function currentTreePeople()
{
    const projectId = currentFamilyTreeProjectId();
    return projectId
        ? getTreePeopleFromSampleData(projectId)
        : [];
}

function currentTreeFamilies()
{
    const projectId = currentFamilyTreeProjectId();
    return projectId
        ? getTreeFamiliesFromSampleData(projectId)
        : [];
}

function personById(id)
{
    const centralPerson = getPerson(id);
    if (centralPerson) return toTreePerson(centralPerson);
    const first = getPeople(currentFamilyTreeProjectId())[0];
    return first ? toTreePerson(first) : null;
}

const TREE_ANCESTOR_GENERATION_MIN = 0;
const TREE_ANCESTOR_GENERATION_MAX = 8;
const TREE_DESCENDANT_GENERATION_MIN = 0;
const TREE_DESCENDANT_GENERATION_MAX = 5;

function treeDefaultPersonId(projectId = currentFamilyTreeProjectId())
{
    const project = sampleData.projects.find(item => item.id === projectId);
    const people = getPeople(projectId);
    return people.some(person => person.id === project?.defaultPersonId)
        ? project.defaultPersonId
        : people[0]?.id || '';
}


const TREE_DISPLAY_STORAGE_KEY = 'geneograph-tree-display-v1';

// Tree-only palette defaults, independent of the application brand palette.
const TREE_PALETTE_DEFAULTS = Object.freeze({
    light: Object.freeze({
        '1': '#3976ad', '2': '#b75e81', '3': '#278275', '4': '#ad782c',
        '5': '#7958b1', '6': '#ad503f', '7': '#548531', '8': '#3987a7',
        '9': '#9b6689', '10': '#697fbd', '11': '#8e8331', '12': '#328f9d',
        '13': '#a55778', '14': '#6a925f', '15': '#b76e39', '16': '#8177a2',
        'neutral': '#87938b', 'male': '#00639b', 'female': '#6c4f9d', 'unknown': '#675c55'
    }),
    dark: Object.freeze({
        '1': '#71b2eb', '2': '#e98eaf', '3': '#59c3b0', '4': '#e6b75b',
        '5': '#bba0f1', '6': '#ed927c', '7': '#a6c96b', '8': '#70c7e6',
        '9': '#d7a0d0', '10': '#9baee9', '11': '#d0c96b', '12': '#6dcfcb',
        '13': '#e9a2b4', '14': '#a1c49a', '15': '#efad79', '16': '#b6acd6',
        'neutral': '#828f86', 'male': '#59b4f2', 'female': '#bc93f1', 'unknown': '#d1c2b7'
    })
});

function normalizeTreePalette(raw)
{
    const result = {};
    for (const theme of ['light', 'dark'])
    {
        result[theme] = {};
        for (const [key, fallback] of Object.entries(TREE_PALETTE_DEFAULTS[theme]))
        {
            const color = raw?.[theme]?.[key];
            result[theme][key] = typeof color === 'string' && /^#[0-9a-f]{6}$/i.test(color)
                ? color.toLowerCase() : fallback;
        }
    }
    return result;
}

function resetTreePaletteColor(palette, theme, key)
{
    if (!Object.hasOwn(TREE_PALETTE_DEFAULTS, theme) || !Object.hasOwn(TREE_PALETTE_DEFAULTS[theme], key)) return;
    palette[theme][key] = TREE_PALETTE_DEFAULTS[theme][key];
}

function resetTreePaletteTheme(palette, theme)
{
    if (Object.hasOwn(TREE_PALETTE_DEFAULTS, theme)) palette[theme] = { ...TREE_PALETTE_DEFAULTS[theme] };
}

function treeDisplaySettings(projectId, raw = {})
{
    if (!raw || typeof raw !== 'object') raw = {};
    const number = (value, fallback, min, max) => typeof value === 'number' && Number.isFinite(value)
        ? clampNumber(Math.round(value), min, max) : fallback;
    const saved = raw.colors && typeof raw.colors === 'object' ? raw.colors : {};
    const hasReference = Object.hasOwn(saved, 'reference');
    const defaultId = sampleData.projects.find(project => project.id === projectId)?.defaultPersonId;
    const reference = hasReference ? saved.reference : defaultId;
    const channel = (value, choices, fallback) => choices.includes(value) ? value : fallback;
    return {
        orientation: raw.orientation === 'horizontal' ? 'horizontal' : 'vertical',
        ancestorGenerations: number(raw.ancestorGenerations, 5, TREE_ANCESTOR_GENERATION_MIN, TREE_ANCESTOR_GENERATION_MAX),
        descendantGenerations: number(raw.descendantGenerations, 3, TREE_DESCENDANT_GENERATION_MIN, TREE_DESCENDANT_GENERATION_MAX),
        showCousins: typeof raw.showCousins === 'boolean' ? raw.showCousins : true,
        colors: {
            reference: typeof reference === 'string' && getPerson(reference)?.projectId === projectId ? reference : '',
            preset: [2, 4, 8, 16].includes(saved.preset) ? saved.preset : 4,
            collateral: saved.collateral === true,
            fill: channel(saved.fill, ['neutral', 'gender', 'branch'], raw.colorFill === false ? 'neutral' : 'gender'),
            outline: channel(saved.outline, ['neutral', 'gender', 'branch'], 'gender'),
            connectors: channel(saved.connectors, ['neutral', 'branch'], 'neutral'),
            palette: normalizeTreePalette(saved.palette)
        }
    };
}

function readTreeDisplaySettings(projectId)
{
    let saved;
    try { saved = JSON.parse(localStorage.getItem(TREE_DISPLAY_STORAGE_KEY + ':' + projectId)); }
    catch (_error) {}
    return treeDisplaySettings(projectId, saved?.projectId === projectId ? saved.settings : undefined);
}

function saveTreeDisplaySettings(projectId, view)
{
    try
    {
        if (view)
            localStorage.setItem(TREE_DISPLAY_STORAGE_KEY + ':' + projectId,
                JSON.stringify({ projectId, settings: treeDisplaySettings(projectId, view) }));
        else localStorage.removeItem(TREE_DISPLAY_STORAGE_KEY + ':' + projectId);
    }
    catch (_error) {}
}

function setTreeOrientation(orientation)
{
    if (!['vertical', 'horizontal'].includes(orientation)) return;
    const projectId = currentFamilyTreeProjectId();
    const view = treeProjectViewState(projectId);
    if (view.orientation === orientation) return;
    captureTreeCanvasScroll(projectId);
    view.orientation = orientation;
    view.canvasScroll = null;
    state.treeCenterTargetId = '';
    const trace = treePerf.begin(projectId, 'orientation', view);
    saveTreeDisplaySettings(projectId, view);
    renderFamilyTree(null, trace);
}

function treeProjectViewState(projectId = currentFamilyTreeProjectId())
{
    if (!state.treeProjectViews[projectId])
    {
        const defaultPersonId = treeDefaultPersonId(projectId);

        state.treeProjectViews[projectId] = {
            focusPersonId: defaultPersonId,
            ...readTreeDisplaySettings(projectId),
            orientationBookmarks: new Map(),
            recentPersonIds:
            defaultPersonId
                ? [defaultPersonId]
                : [],
            canvasScroll: null
        };
    }

    const view = state.treeProjectViews[projectId];

    view.recentPersonIds = Array.isArray(view.recentPersonIds)
        ? view.recentPersonIds
        : [];

    return view;
}

function rememberTreeSelectedPerson(
    personId,
    projectId = currentFamilyTreeProjectId()
)
{
    const person = getPerson(personId);
    if (!person || person.projectId !== projectId) return [];

    const view = treeProjectViewState(projectId);
    view.recentPersonIds = [
        personId,
        ...view.recentPersonIds.filter(id => id !== personId)
    ]
        .filter(id =>
        {
            const candidate = getPerson(id);
            return candidate && candidate.projectId === projectId && !candidate.deleted;
        })
        .slice(0, 10);

    return view.recentPersonIds;
}

function treeRecentPeople(projectId = currentFamilyTreeProjectId())
{
    const view = treeProjectViewState(projectId);
    return view.recentPersonIds
        .map(id => getPerson(id))
        .filter(person => person && person.projectId === projectId && !person.deleted)
        .slice(0, 10);
}

function treeNavigationFocusForPerson(
    personId,
    {
        focusBranch = false,
        projectId = currentFamilyTreeProjectId(),
        preparation = {}
    } = {}
)
{
    const view = treeProjectViewState(projectId);

    if (focusBranch) return personId;
    if (treeSceneMatchesView(treeRenderRuntime, projectId, view))
        return treeRenderRuntime.scene.primaryByPerson.has(personId) ? view.focusPersonId : personId;
    const context = preparation.context ||= treeFocusContext(projectId);

    const projection = buildFamilyTreeProjection(
        context.people,
        treeContextFamilies(context),
        {
            focusPersonId: view.focusPersonId,
            ancestorGenerations: view.ancestorGenerations,
            descendantGenerations: view.descendantGenerations,
            showCousins: view.showCousins
        }
    );

    if (!projection.visiblePersonIds.has(personId)) return personId;
    preparation.projection = projection;
    return projection.focusPersonId;
}

function navigateFamilyTreeToPerson(
    personId,
    {
        focusBranch = false,
        center = true
    } = {}
)
{
    const projectId = currentFamilyTreeProjectId();
    const person = getPerson(personId);

    if (
        state.activeModule !== 'Family Tree'
        || !person
        || person.deleted
        || person.projectId !== projectId
    )
    {
        return false;
    }

    const view = treeProjectViewState(projectId);
    const trace = treePerf.begin(projectId, focusBranch ? 'focus' : 'selection', view);
    if (!focusBranch && treePerf.measure(trace, 'navigation', () => selectVisibleTreePerson(personId, { center })))
    {
        treePerf.finish(trace, 'completed');
        return true;
    }
    const preparation = {};
    const nextFocusPersonId = treePerf.measure(trace, 'navigation', () => treeNavigationFocusForPerson(
        personId,
        {
            focusBranch,
            projectId,
            preparation
        }
    ));

    const selectionChanged =
        state.selectedPersonId !== personId;

    const focusChanged =
        view.focusPersonId !== nextFocusPersonId;

    if (!selectionChanged && !focusChanged)
    {
        if (center) centerTreeOnPerson(personId);
        treePerf.finish(trace, 'unchanged');
        return false;
    }

    if (focusChanged) treePerf.kind(trace, 'focus');
    appNavigationMarkIntent();

    view.focusPersonId = nextFocusPersonId;
    state.selectedPersonId = personId;
    state.treeInspectorCollapsed = false;
    state.treeCenterTargetId = center ? personId : '';

    rememberTreeSelectedPerson(personId, projectId);

    if (center)
    {
        renderFamilyTree(null, trace, preparation);
    }
    else
    {
        renderFamilyTreePreserveScroll(trace, preparation);
    }

    return true;
}

function resolveTreeFocusPersonId(people, projectId = currentFamilyTreeProjectId())
{
    const ids = new Set((people || []).map(person => person.id));
    const view = treeProjectViewState(projectId);
    if (!ids.has(view.focusPersonId))
    {
        view.focusPersonId = ids.has(treeDefaultPersonId(projectId))
            ? treeDefaultPersonId(projectId)
            : people?.[0]?.id || '';
    }
    return view.focusPersonId;
}

function setTreeFocusPerson(personId, { center = true } = {})
{
    return navigateFamilyTreeToPerson(
        personId,
        {
            focusBranch: true,
            center
        }
    );
}

function treeSettingsPersonPreview(person, fallback = '')
{
    if (!person) return escapeHtml(fallback || t('Unknown'));
    return `<span class="tree-settings-person-preview">${renderPersonAvatar(person, 'tree-settings-person-avatar', { element: 'span' })}<strong data-i18n-skip>${escapeHtml(localizedDataFieldValue(formatPersonFullName(person)) || t('Unnamed person'))}</strong></span>`;
}

function treePaletteRowsMarkup(palette, theme, preset, origins, originIds, peopleById)
{
    const row = (key, label, path = '', originId = '') =>
    {
        const slot = Number(key);
        const isBranch = Number.isInteger(slot) && slot >= 1 && slot <= 16;
        const enabled = isBranch && slot <= preset;
        const origin = peopleById.get(originId);
        const roles = Array.from(path, role => t(role === 'F' ? 'Father' : 'Mother')).join(' › ');
        const originName = origin ? localizedDataFieldValue(formatPersonFullName(origin)) || t('Unnamed person') : t('Vacant branch origin');
        const status = enabled ? t('Included in branch count') : t('Not included in branch count');
        const colorLabel = escapeHtml(label + ' · ' + t(theme === 'light' ? 'Light' : 'Dark'));
        return `<div class="tree-palette-row ${isBranch ? 'tree-palette-branch-row' : 'tree-palette-category-row'}">
            ${isBranch ? `<span class="tree-palette-slot-status ${enabled ? '' : 'inactive'}" role="img" aria-label="${escapeHtml(status)}" title="${escapeHtml(status)}">${enabled ? icon.eye : icon.eyeOff}</span>` : ''}
            <label class="tree-palette-label" for="tree-palette-${key}">
                <strong>${escapeHtml(label)}</strong>
                ${isBranch ? `<small>${escapeHtml(roles)} · <span data-i18n-skip>${escapeHtml(originName)}</span></small>` : ''}
            </label>
            <button class="geneo-paint-swatch tree-palette-color" id="tree-palette-${key}" type="button" data-tree-palette-color="${key}" data-tree-palette-label="${colorLabel}" data-color-value="${palette[theme][key]}" style="--geneo-paint-rendered:${palette[theme][key]}" aria-label="${colorLabel}" aria-haspopup="dialog" aria-expanded="false"><span aria-hidden="true"></span></button>
            <button class="tree-palette-reset" type="button" data-tree-palette-reset="${key}" title="${escapeHtml(t('Reset color') + ' · ' + label)}" aria-label="${escapeHtml(t('Reset color') + ' · ' + label)}">${icon.undo}</button>
        </div>`;
    };
    const hint = t('The eye indicates inclusion in the selected branch count, not visibility on the tree. All slots remain editable.');
    return `<h4>${escapeHtml(t('Gender and neutral colors'))}</h4><div class="tree-palette-category-grid">`
        + [['male', 'Male'], ['female', 'Female'], ['unknown', 'Unknown gender'], ['neutral', 'Neutral']]
            .map(([key, label]) => row(key, t(label))).join('')
        + `</div><h4 class="tree-palette-branch-heading">${escapeHtml(t('Branch colors'))}<span class="tree-palette-info-wrap"><span class="tree-palette-info" tabindex="0" aria-describedby="treePaletteEyeHint" aria-label="${escapeHtml(t('Branch colors'))}">${icon.info}</span><span class="tree-palette-tooltip" id="treePaletteEyeHint" role="tooltip">${escapeHtml(hint)}</span></span></h4>`
        + origins.map((path, index) => row(String(index + 1), t('Branch') + ' ' + (index + 1), path, originIds[index])).join('');
}

function openTreeSettingsModal()
{
    const projectId = currentFamilyTreeProjectId();
    const view = treeProjectViewState(projectId);
    const project = sampleData.projects.find(item => item.id === projectId);
    if (!project) return;
    let defaultPersonId = treeDefaultPersonId(projectId);
    const draft = treeDisplaySettings(projectId, view);
    const colors = draft.colors;
    let reference = colors.reference;
    let paletteTheme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
    let paletteGraph = null, palettePeople = null, referenceOptions = null;
    const personOptions = () => referenceOptions ||= getPeople(projectId).filter(person => !person.deleted).map(person => ({
        value: person.id, label: formatPersonFullName(person) || t('Unnamed person'), person
    }));
    const personField = (key, label, helpText = '') => ({
        key, label, helpText, control: 'combobox', layout: 'full', searchOnly: true, personSearch: true,
        placeholder: 'Search people', defaultValue: '',
        getOptions: personOptions,
        renderSelectedIdentity: (id, label) => treeSettingsPersonPreview(getPerson(id), label)
    });
    const defaultPicker = { schema: [personField('defaultPerson', 'Default person')],
        values: { defaultPerson: defaultPersonId }, prefix: 'tree-default-person' };
    const referencePicker = { schema: [personField('reference', 'Branch reference person',
        'Branch colors follow the ancestors of this person. This can differ from the default person and the current tree focus.')],
        values: { reference }, prefix: 'tree-branch-person' };
    const option = (value, selected, label = value) =>
        `<option value="${value}" ${value === selected ? 'selected' : ''}>${escapeHtml(t(label))}</option>`;
    const select = (id, options) => `<span class="common-select-shell"><select class="common-select" id="${id}">${options}</select><span class="common-select-chevron" aria-hidden="true">${icon.chevron}</span></span>`;
    const channel = (key, label, allowGender) => `<div class="field">
        <label for="tree-color-${key}">${escapeHtml(t(label))}</label>
        ${select('tree-color-' + key, option('neutral', colors[key], 'Neutral')
            + (allowGender ? option('gender', colors[key], 'Gender') : '') + option('branch', colors[key], 'Branch'))}
    </div>`;
    const sections = [['visibility', 'Visibility'], ['coloring', 'Coloring'], ['palette', 'Palette']];

    openModal(`<div class="modal tree-settings-modal" role="dialog" aria-modal="true" aria-labelledby="treeSettingsTitle">
        <div class="modal-header">
          <div><h2 id="treeSettingsTitle">${escapeHtml(t('Tree Settings'))}</h2>
            <p>${escapeHtml(t('Configure tree visibility, coloring and project palettes.'))}</p></div>
          <button class="close-button" type="button" data-close aria-label="${escapeHtml(t('Close'))}">${icon.close}</button>
        </div>
        <form id="treeSettingsForm">
          <div class="modal-body tree-settings-body global-settings-layout">
            <nav class="global-settings-nav tree-settings-nav" aria-label="${escapeHtml(t('Tree settings sections'))}">
              ${sections.map(([key, label], index) => `<button class="global-settings-nav-button ${index === 0 ? 'active' : ''}" type="button" data-tree-settings-section="${key}" ${index === 0 ? 'aria-current="true" data-modal-initial-focus' : ''} aria-controls="tree-settings-${key}">${escapeHtml(t(label))}</button>`).join('')}
            </nav>
            <div class="global-settings-panel tree-settings-panel">
              <section id="tree-settings-visibility" data-tree-settings-panel="visibility" aria-label="${escapeHtml(t('Visibility'))}">
                <h3>${escapeHtml(t('Default person'))}</h3>
                <div class="tree-branch-reference tree-settings-default">
                  ${renderSharedFilterFields(defaultPicker)}
                  <p class="tree-settings-help">${escapeHtml(t('The person used as the initial tree focus.'))}</p>
                </div>
                <h3>${escapeHtml(t('Visible generations'))}</h3>
                <div class="tree-settings-control-grid tree-settings-generation-grid">
                  <div class="field">
                    <label for="treeAncestorGenerations">${escapeHtml(t('Ancestor generations'))}</label>
                    <input id="treeAncestorGenerations" type="number" min="${TREE_ANCESTOR_GENERATION_MIN}" max="${TREE_ANCESTOR_GENERATION_MAX}" step="1" value="${draft.ancestorGenerations}">
                    <span class="field-help">${TREE_ANCESTOR_GENERATION_MIN}–${TREE_ANCESTOR_GENERATION_MAX} ${escapeHtml(t('generations'))}</span>
                  </div>
                  <div class="field">
                    <label for="treeDescendantGenerations">${escapeHtml(t('Descendant generations'))}</label>
                    <input id="treeDescendantGenerations" type="number" min="${TREE_DESCENDANT_GENERATION_MIN}" max="${TREE_DESCENDANT_GENERATION_MAX}" step="1" value="${draft.descendantGenerations}">
                    <span class="field-help">${TREE_DESCENDANT_GENERATION_MIN}–${TREE_DESCENDANT_GENERATION_MAX} ${escapeHtml(t('generations'))}</span>
                  </div>
                </div>
                <label class="tree-settings-check">
                  <input id="treeShowCousins" type="checkbox" ${draft.showCousins ? 'checked' : ''}>
                  <span><strong>${escapeHtml(t('Show extended family'))}</strong>
                    <small>${escapeHtml(t('Include aunts, uncles, cousins and their descendants.'))}</small></span>
                </label>
              </section>
              <section id="tree-settings-coloring" data-tree-settings-panel="coloring" aria-labelledby="tree-settings-coloring-title" hidden>
                <h3 id="tree-settings-coloring-title">${escapeHtml(t('Color channels'))}</h3>
                <div class="tree-settings-control-grid tree-color-channels">${channel('fill', 'Fill', true)}${channel('outline', 'Outline', true)}
                  ${channel('connectors', 'Connectors', false)}</div>
                <fieldset class="tree-branch-settings">
                  <legend>${escapeHtml(t('Branch coloring'))}</legend>
                  <div class="tree-branch-reference">${renderSharedFilterFields(referencePicker)}</div>
                  <div class="tree-settings-control-grid tree-branch-options">
                    <div class="field">
                      <label for="treeBranchPreset">${escapeHtml(t('Branch count'))}</label>
                      ${select('treeBranchPreset', TREE_BRANCH_PRESETS.map(value => option(value, colors.preset, String(value))).join(''))}
                    </div>
                    <label class="tree-settings-check"><input id="treeBranchCollateral" type="checkbox" ${colors.collateral ? 'checked' : ''}>
                      <span><strong>${escapeHtml(t('Include collateral relatives'))}</strong>
                        <small>${escapeHtml(t('Extend branch colors to collateral relatives without changing who is shown in the tree.'))}</small></span>
                    </label>
                  </div>
                </fieldset>
              </section>
              <section id="tree-settings-palette" data-tree-settings-panel="palette" aria-labelledby="tree-settings-palette-title" hidden>
                <h3 id="tree-settings-palette-title">${escapeHtml(t('Palette'))}</h3>
                <div class="tree-palette-toolbar">
                  <div class="field">
                    <label for="treePaletteTheme">${escapeHtml(t('Palette theme'))}</label>
                    ${select('treePaletteTheme', option('light', paletteTheme, 'Light') + option('dark', paletteTheme, 'Dark'))}
                  </div>
                  <button class="tree-palette-toolbar-action" type="button" data-tree-palette-reset-theme title="${escapeHtml(t('Reset theme palette'))}" aria-label="${escapeHtml(t('Reset theme palette'))}">${escapeHtml(t('Reset theme'))}</button>
                  <button class="tree-palette-toolbar-action" type="button" data-tree-palette-reset-all title="${escapeHtml(t('Reset entire palette'))}" aria-label="${escapeHtml(t('Reset entire palette'))}">${escapeHtml(t('Reset all'))}</button>
                </div>
                <div data-tree-palette-rows></div>
              </section>
            </div>
          </div>
          <div class="modal-footer">
            <button class="button secondary" type="button" data-close>${escapeHtml(t('Cancel'))}</button>
            <button class="button primary" type="submit">${escapeHtml(t('Apply settings'))}</button>
          </div>
        </form>
      </div>`);

    const form = modalBackdrop.querySelector('#treeSettingsForm');
    const presetInput = form.querySelector('#treeBranchPreset');
    const rows = form.querySelector('[data-tree-palette-rows]');
    const renderPalette = () =>
    {
        // Lazily prepare the reference graph once for this modal; only follow
        // the sixteen existing origin paths, not the full ancestry projection.
        if (!paletteGraph)
        {
            const people = getPeople(projectId);
            palettePeople = new Map(people.map(person => [person.id, person]));
            paletteGraph = treeBranchGraph(people, centralFamilyRecords().filter(family => family.projectId === projectId));
        }
        const { origins } = treeBranchPaths(16);
        const originIds = treeBranchOriginIds(paletteGraph, reference, origins);
        rows.innerHTML = treePaletteRowsMarkup(colors.palette, paletteTheme, Number(presetInput.value), origins, originIds, palettePeople);
    };
    const defaultBinding = bindSharedFilterFields(form, { ...defaultPicker, onChange: next => { defaultPersonId = next.defaultPerson; } });
    bindSharedFilterFields(form, { ...referencePicker, onChange: next => { reference = next.reference; } });
    const navButtons = [...form.querySelectorAll('[data-tree-settings-section]')];
    const panels = [...form.querySelectorAll('[data-tree-settings-panel]')];
    const panel = form.querySelector('.tree-settings-panel');
    const selectSection = section =>
    {
        const button = navButtons.find(candidate => candidate.dataset.treeSettingsSection === section);
        if (!button) return;
        closeGeneoDraftColorPicker({ restoreFocus: false });
        if (section === 'palette') renderPalette();
        for (const candidate of navButtons)
        {
            const active = candidate === button;
            candidate.classList.toggle('active', active);
            if (active) candidate.setAttribute('aria-current', 'true');
            else candidate.removeAttribute('aria-current');
        }
        for (const candidate of panels) candidate.hidden = candidate.dataset.treeSettingsPanel !== section;
        panel.scrollTop = 0;
    };
    navButtons.forEach(button => button.addEventListener('click', () => selectSection(button.dataset.treeSettingsSection)));
    // Native form validation still applies to controls in hidden sections.
    // Reveal the invalid field before the browser tries to focus it.
    form.addEventListener('invalid', event =>
    {
        const section = event.target.closest('[data-tree-settings-panel]');
        if (section?.hidden) selectSection(section.dataset.treeSettingsPanel);
    }, true);
    form.querySelector('#treePaletteTheme').addEventListener('change', event =>
    {
        closeGeneoDraftColorPicker({ restoreFocus: false });
        paletteTheme = event.target.value === 'dark' ? 'dark' : 'light';
        renderPalette();
    });
    const updateColorInputs = () =>
    {
        rows.querySelectorAll('[data-tree-palette-color]').forEach(button =>
        {
            const color = colors.palette[paletteTheme][button.dataset.treePaletteColor];
            button.dataset.colorValue = color;
            button.style.setProperty('--geneo-paint-rendered', color);
        });
    };
    rows.addEventListener('click', event =>
    {
        const reset = event.target.closest('[data-tree-palette-reset]');
        if (reset)
        {
            closeGeneoDraftColorPicker({ restoreFocus: false });
            resetTreePaletteColor(colors.palette, paletteTheme, reset.dataset.treePaletteReset);
            updateColorInputs();
            return;
        }
        const button = event.target.closest('[data-tree-palette-color]');
        if (!button) return;
        const key = button.dataset.treePaletteColor;
        const theme = paletteTheme;
        openGeneoDraftColorPicker({
            id: theme + '-' + key, label: button.dataset.treePaletteLabel,
            color: colors.palette[theme][key], defaultColor: TREE_PALETTE_DEFAULTS[theme][key],
            onChange: color =>
            {
                colors.palette[theme][key] = color.toLowerCase();
                updateColorInputs();
            }
        }, button);
    });
    form.querySelector('[data-tree-palette-reset-theme]').addEventListener('click', () =>
    {
        closeGeneoDraftColorPicker({ restoreFocus: false });
        resetTreePaletteTheme(colors.palette, paletteTheme);
        updateColorInputs();
    });
    form.querySelector('[data-tree-palette-reset-all]').addEventListener('click', () =>
    {
        closeGeneoDraftColorPicker({ restoreFocus: false });
        colors.palette = normalizeTreePalette();
        updateColorInputs();
    });
    form.addEventListener('submit', event =>
    {
        event.preventDefault();
        closeGeneoDraftColorPicker({ restoreFocus: false });
        if (currentFamilyTreeProjectId() !== projectId) { closeModal(); return; }
        const selectedDefault = getPerson(defaultPersonId);
        if ((!selectedDefault || selectedDefault.deleted || selectedDefault.projectId !== projectId)
            && (defaultPersonId || getPeople(projectId).some(person => !person.deleted)))
        {
            selectSection('visibility');
            showToast(t('Choose a default person for this project.'));
            defaultBinding?.focusFirst();
            return;
        }
        const previousStructure = [view.ancestorGenerations, view.descendantGenerations, view.showCousins];
        const ancestorValue = form.querySelector('#treeAncestorGenerations').valueAsNumber;
        const descendantValue = form.querySelector('#treeDescendantGenerations').valueAsNumber;
        draft.ancestorGenerations = Number.isFinite(ancestorValue) ? ancestorValue : view.ancestorGenerations;
        draft.descendantGenerations = Number.isFinite(descendantValue) ? descendantValue : view.descendantGenerations;
        draft.showCousins = form.querySelector('#treeShowCousins').checked;
        colors.reference = reference;
        colors.preset = Number(presetInput.value);
        colors.collateral = form.querySelector('#treeBranchCollateral').checked;
        for (const key of ['fill', 'outline', 'connectors']) colors[key] = form.querySelector('#tree-color-' + key).value;
        if (selectedDefault && project.defaultPersonId !== selectedDefault.id)
        {
            project.defaultPersonId = selectedDefault.id;
            touchProjectModified(project);
        }
        Object.assign(view, treeDisplaySettings(projectId, draft));
        saveTreeDisplaySettings(projectId, view);
        closeModal();
        if (view.ancestorGenerations !== previousStructure[0] || view.descendantGenerations !== previousStructure[1]
            || view.showCousins !== previousStructure[2])
        {
            state.treeCenterTargetId = view.focusPersonId;
            renderFamilyTree(null, treePerf.begin(projectId, 'depth', view));
        }
        else refreshTreeColors(treeRenderRuntime);
    });
}


function deriveTreeBranchRoles(
    people,
    families,
    focusPersonId,
    visiblePersonIds = null
)
{
    const projectPersonIds = new Set((people || []).map(person => person.id));
    const visibleIds = visiblePersonIds instanceof Set
        ? new Set([...visiblePersonIds].filter(id => projectPersonIds.has(id)))
        : new Set(projectPersonIds);
    const parentFamiliesByChild = new Map();

    (families || []).forEach(family =>
    {
        const children = (family.children || []).filter(id => projectPersonIds.has(id));

        children.forEach(childId =>
        {
            if (!parentFamiliesByChild.has(childId)) parentFamiliesByChild.set(childId, []);
            parentFamiliesByChild.get(childId).push(family);
        });
    });

    const collectRelatives = (startId, nextIds) =>
    {
        const collected = new Set();
        const queue = startId ? [startId] : [];
        const visited = new Set(queue);
        while (queue.length)
        {
            const personId = queue.shift();
            nextIds(personId).forEach(relativeId =>
            {
                if (!projectPersonIds.has(relativeId) || visited.has(relativeId)) return;
                visited.add(relativeId);
                collected.add(relativeId);
                queue.push(relativeId);
            });
        }
        return collected;
    };

    const directAncestorIds = collectRelatives(focusPersonId, personId =>
        (parentFamiliesByChild.get(personId) || [])
            .flatMap(family => [family.left, family.right])
            .filter(Boolean)
    );
    const placeholderPersonIds = new Set([focusPersonId, ...directAncestorIds]);
    [...placeholderPersonIds].forEach(id =>
    {
        if (!visibleIds.has(id)) placeholderPersonIds.delete(id);
    });

    // Every visible person can become the focus.
    // The current focus already has its in-card focus badge.
    const focusActionPersonIds = new Set(
        [...visibleIds].filter(id => id !== focusPersonId)
    );

    const parentPresenceByPerson = new Map();
    placeholderPersonIds.forEach(personId =>
    {
        const parentFamilies = parentFamiliesByChild.get(personId) || [];
        parentPresenceByPerson.set(personId, {
            father: parentFamilies.some(family => Boolean(family.left)),
            mother: parentFamilies.some(family => Boolean(family.right))
        });
    });

    return {
        focusActionPersonIds,
        parentPresenceByPerson
    };
}

function buildFamilyTreeProjection(people, families, options = {})
{
    const peopleById = new Map((people || []).map(person => [person.id, person]));
    const familyById = new Map((families || []).map(family => [family.id, family]));
    const parentFamiliesByChild = new Map();
    const childFamiliesByParent = new Map();

    familyById.forEach(family =>
    {
        (family.children || []).forEach(childId =>
        {
            if (!parentFamiliesByChild.has(childId)) parentFamiliesByChild.set(childId, []);
            parentFamiliesByChild.get(childId).push(family);
        });
        [family.left, family.right].filter(Boolean).forEach(parentId =>
        {
            if (!childFamiliesByParent.has(parentId)) childFamiliesByParent.set(parentId, []);
            childFamiliesByParent.get(parentId).push(family);
        });
    });

    const focusPersonId = peopleById.has(options.focusPersonId)
        ? options.focusPersonId
        : people?.[0]?.id || '';
    const ancestorGenerations = clampNumber(
        Number(options.ancestorGenerations) || 0,
        TREE_ANCESTOR_GENERATION_MIN,
        TREE_ANCESTOR_GENERATION_MAX
    );
    const descendantGenerations = clampNumber(
        Number(options.descendantGenerations) || 0,
        TREE_DESCENDANT_GENERATION_MIN,
        TREE_DESCENDANT_GENERATION_MAX
    );
    const visiblePersonIds = new Set(focusPersonId ? [focusPersonId] : []);
    const visibleFamilyIds = new Set();

    const familyChildren = new Map();
    const includeFamily = (family, children = family.children || []) =>
    {
        visibleFamilyIds.add(family.id);
        [family.left, family.right].filter(Boolean).forEach(id => visiblePersonIds.add(id));
        if (!familyChildren.has(family.id)) familyChildren.set(family.id, new Set());
        for (const childId of children)
        {
            visiblePersonIds.add(childId);
            familyChildren.get(family.id).add(childId);
        }
    };

    let ancestorFrontier = focusPersonId ? [focusPersonId] : [];
    for (let depth = 1; depth <= ancestorGenerations && ancestorFrontier.length; depth += 1)
    {
        const next = [];
        ancestorFrontier.forEach(childId =>
        {
            (parentFamiliesByChild.get(childId) || []).forEach(family =>
            {
                includeFamily(family, depth === 1 ? family.children : [childId]);
                [family.left, family.right].filter(Boolean).forEach(parentId => next.push(parentId));
            });
        });
        ancestorFrontier = [...new Set(next)];
    }

    const roots = new Set(focusPersonId ? [focusPersonId] : []);
    const ownFamilies = parentFamiliesByChild.get(focusPersonId) || [];
    const recordedParents = new Set(ownFamilies.flatMap(family => [family.left, family.right])
        .filter(id => peopleById.has(id)));
    const siblingRoots = new Set();
    if (ancestorGenerations >= 1)
    {
        const siblingFamilies = new Set(ownFamilies);
        for (const parentId of recordedParents)
            for (const family of childFamiliesByParent.get(parentId) || []) siblingFamilies.add(family);
        for (const family of siblingFamilies)
        {
            includeFamily(family);
            for (const id of family.children || [])
                if (id !== focusPersonId && peopleById.has(id)) siblingRoots.add(id);
        }
    }

    if (options.showCousins && ancestorGenerations >= 2)
    {
        for (const parentId of recordedParents)
            for (const family of parentFamiliesByChild.get(parentId) || [])
            {
                includeFamily(family);
                for (const id of family.children || [])
                    if (id !== parentId && peopleById.has(id)) roots.add(id);
            }
    }

    // Seed all roots at the same distance so the first visit always has the
    // largest remaining budget. Partners are admitted without joining the queue.
    const siblingOnly = new Set([...siblingRoots].filter(id => !roots.has(id)));
    for (const id of siblingRoots) roots.add(id);
    let frontier = [...roots];
    const visited = new Set(frontier);
    for (let depth = 0; frontier.length && (depth === 0 || depth < descendantGenerations); depth++)
    {
        const next = [];
        for (const parentId of frontier)
            for (const family of childFamiliesByParent.get(parentId) || [])
            {
                const children = (family.children || []).filter(id => peopleById.has(id));
                if (depth === 0 && siblingOnly.has(parentId) && !children.length
                    && ![family.left, family.right].some(id => id !== parentId && peopleById.has(id))) continue;
                includeFamily(family, depth < descendantGenerations ? children : []);
                if (depth >= descendantGenerations) continue;
                for (const childId of children)
                {
                    if (visited.has(childId)) continue;
                    visited.add(childId);
                    next.push(childId);
                }
            }
        frontier = next;
    }

    const projectedFamilies = (families || [])
        .filter(family => visibleFamilyIds.has(family.id))
        .map(family => ({
            ...family,
            recordedChildCount: (family.children || []).length,
            children: (family.children || []).filter(childId => familyChildren.get(family.id).has(childId))
        }));
    const coherentPersonIds = new Set(visiblePersonIds);
    projectedFamilies.forEach(family =>
    {
        [family.left, family.right, ...(family.children || [])]
            .filter(Boolean)
            .forEach(id => coherentPersonIds.add(id));
    });

    const branchRoles = deriveTreeBranchRoles(
        people,
        families,
        focusPersonId,
        coherentPersonIds
    );

    return {
        focusPersonId,
        people: (people || []).filter(person => coherentPersonIds.has(person.id)),
        families: projectedFamilies,
        visiblePersonIds: coherentPersonIds,
        visibleFamilyIds,
        branchRoles: { ...branchRoles, ancestorGenerations,
            recordedParentFamilyCountByPerson: new Map([...coherentPersonIds].map(id => [id, (parentFamiliesByChild.get(id) || []).length])) }
    };
}

function placeDisplayText(place)
{
    return cleanEditFieldValue(place?.name);
}

function findExactPlaceMatch(text, projectId = currentProjectId())
{
    const normalized = normalizePlaceLookupText(text);
    if (!normalized || !projectId) return null;

    return sampleData.places.find(place =>
    {
        if (!place || place.projectId !== projectId) return false;

        const values = [
            place.name,
            placePrimaryName(place),
            placeSecondaryName(place),
            ...placeAlternativeNames(place)
        ];

        return values.some(value => normalizePlaceLookupText(value) === normalized);
    }) || null;
}

function samplePlaceIdFromDisplay(display)
{
    return findExactPlaceMatch(display)?.id || null;
}
function slugFromPlaceText(text)
{
    return normalizePlaceLookupText(text)
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'place';
}

function uniquePlaceIdFromText(text)
{
    const base = `place-${slugFromPlaceText(text)}`;
    let id = base;
    let counter = 2;

    while (sampleData.places.some(place => place.id === id))
    {
        id = `${base}-${counter}`;
        counter += 1;
    }

    return id;
}

function createPlaceFromText(text, { projectId = currentProjectId(), coordinates = null } = {})
{
    const display = cleanEditFieldValue(text);
    if (!display) return null;

    if (!projectId || projectId !== currentProjectId()) return null;

    const exact = findExactPlaceMatch(display, projectId);
    if (exact) return exact;

    const now =
        new Date().toISOString();
    const place = {
        id: uniquePlaceIdFromText(display),
        projectId,
        name: display,
        alternativeNames: [],
        coordinates: coordinates && validLatitude(coordinates.lat) && validLongitude(coordinates.lng)
            ? { lat: Number(coordinates.lat), lng: Number(coordinates.lng) }
            : null,
        createdAt: now,
        updatedAt: now
    };

    sampleData.places.push(place);
    return place;
}

function resolvePlaceInputValue(text, selectedPlaceId = '', address = '', options = {})
{
    const placeText = cleanEditFieldValue(text);
    const normalizedAddress = cleanEditFieldValue(address);
    const projectId = options.projectId === currentProjectId()
        ? options.projectId
        : currentProjectId();

    if (!placeText)
    {
        return {
            placeId: null,
            placeText: '',
            address: normalizedAddress,
            created: false
        };
    }

    const selectedPlace = selectedPlaceId ? getPlace(selectedPlaceId) : null;
    if (
        selectedPlace && selectedPlace.projectId === projectId &&
        normalizePlaceLookupText(placeText) === normalizePlaceLookupText(placeDisplayText(selectedPlace))
    )
    {
        return {
            placeId: selectedPlace.id,
            placeText,
            address: normalizedAddress,
            created: false
        };
    }

    const exact = findExactPlaceMatch(placeText, projectId);
    if (exact)
    {
        return {
            placeId: exact.id,
            placeText,
            address: normalizedAddress,
            created: false
        };
    }

    const created = createPlaceFromText(placeText, {
        projectId,
        coordinates: options.coordinates
    });

    return {
        placeId: created?.id || null,
        placeText,
        address: normalizedAddress,
        created: Boolean(created)
    };
}

function resolvePlaceInputSelector(selector, root = modalBackdrop)
{
    const input = root?.querySelector(selector);
    const addressInput = input?.closest('[data-place-combobox]')?.querySelector('[data-place-address]');
    const value = collectLocalizedDataFieldValue(
        input,
        input?.dataset.sourceValue || ''
    );
    const address = collectLocalizedDataFieldValue(
        addressInput,
        addressInput?.dataset.sourceValue || ''
    );
    let coordinates = null;
    try { coordinates = JSON.parse(input?.dataset.placeCoordinates || 'null'); } catch (_) {}
    return resolvePlaceInputValue(value, input?.dataset.placeId || '', address, {
        projectId: input?.dataset.placeProjectId || currentProjectId(),
        coordinates
    });
}

function readPlaceInputValue(selector, root = document)
{
    const input = root?.querySelector(selector);

    let coordinates = null;
    try { coordinates = JSON.parse(input?.dataset.placeCoordinates || 'null'); } catch (_) {}
    return {
        text: collectLocalizedDataFieldValue(
            input,
            input?.dataset.sourceValue || ''
        ).trim(),
        selectedPlaceId: input?.dataset.placeId || '',
        coordinates,
        projectId: input?.dataset.placeProjectId || currentProjectId(),
        address: (() =>
        {
            const addressInput = input?.closest('[data-place-combobox]')?.querySelector('[data-place-address]');
            return collectLocalizedDataFieldValue(
                addressInput,
                addressInput?.dataset.sourceValue || ''
            ).trim();
        })()
    };
}

function resolvePlaceAssignment(value, currentPlaceId = '')
{
    if (value && typeof value === 'object')
    {
        return resolvePlaceInputValue(
            value.text || '',
            value.selectedPlaceId || currentPlaceId || '',
            value.address || '',
            { projectId: value.projectId || currentProjectId(), coordinates: value.coordinates }
        );
    }

    return resolvePlaceInputValue(value || '', currentPlaceId || '');
}

function placeInputDisplayValue(placeId, fallbackText = '')
{
    return cleanEditFieldValue(getPlaceDisplay(placeId)) || cleanEditFieldValue(fallbackText);
}

const topbar = document.getElementById('topbar');
const sidebar = document.getElementById('sidebar');
const main = document.getElementById('main');
const modalBackdrop = document.getElementById('modalBackdrop');
const toast = document.getElementById('toast');
const workspace = document.querySelector('.workspace');

const INTENTIONAL_BACKDROP_DRAG_THRESHOLD = 6;

function bindIntentionalBackdropDismiss(
    backdrop,
    onDismiss,
    options = {}
)
{
    const dragThreshold = Number.isFinite(options.dragThreshold)
        ? Math.max(0, options.dragThreshold)
        : INTENTIONAL_BACKDROP_DRAG_THRESHOLD;

    const thresholdSquared =
        dragThreshold * dragThreshold;

    let gesture = null;

    const reset = () =>
    {
        gesture = null;
    };

    const handlePointerDown = event =>
    {
        /*
        * Beginning a new gesture always clears any state that
        * may have survived an interrupted previous gesture.
        */
        reset();

        if (
            event.target !== backdrop ||
          event.isPrimary === false ||
          event.button !== 0
        )
        {
            return;
        }

        gesture = {
            startedOnBackdrop: true,
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            moved: false
        };
    };

    const handlePointerMove = event =>
    {
        if (
            !gesture ||
          event.pointerId !== gesture.pointerId
        )
        {
            return;
        }

        const deltaX =
            event.clientX - gesture.startX;

        const deltaY =
            event.clientY - gesture.startY;

        if (
            deltaX * deltaX + deltaY * deltaY >
          thresholdSquared
        )
        {
            gesture.moved = true;
        }
    };

    const handlePointerUp = event =>
    {
        if (
            !gesture ||
          event.pointerId !== gesture.pointerId
        )
        {
            return;
        }

        const deltaX =
            event.clientX - gesture.startX;

        const deltaY =
            event.clientY - gesture.startY;

        const stayedWithinThreshold =
            !gesture.moved &&
          deltaX * deltaX + deltaY * deltaY <=
            thresholdSquared;

        const shouldDismiss =
            gesture.startedOnBackdrop &&
          event.target === backdrop &&
          stayedWithinThreshold;

        /*
        * Reset before invoking the callback because onDismiss
        * may replace or remove the backdrop synchronously.
        */
        reset();

        if (shouldDismiss)
        {
            onDismiss?.(event);
        }
    };

    const handlePointerCancel = () =>
    {
        reset();
    };

    backdrop.addEventListener(
        'pointerdown',
        handlePointerDown
    );

    backdrop.addEventListener(
        'pointermove',
        handlePointerMove
    );

    backdrop.addEventListener(
        'pointerup',
        handlePointerUp
    );

    backdrop.addEventListener(
        'pointercancel',
        handlePointerCancel
    );

    return {
        reset,

        destroy()
        {
            reset();

            backdrop.removeEventListener(
                'pointerdown',
                handlePointerDown
            );

            backdrop.removeEventListener(
                'pointermove',
                handlePointerMove
            );

            backdrop.removeEventListener(
                'pointerup',
                handlePointerUp
            );

            backdrop.removeEventListener(
                'pointercancel',
                handlePointerCancel
            );
        }
    };
}

let modalBackdropDismissBinding = null;

const notesRichTextRuntime = {
    instance:
        null,

    noteId:
        '',

    toolbarElement:
        null,

    editorElement:
        null,

    fallbackElement:
        null,

    textChangeHandler:
        null,

    selectionChangeHandler:
        null,

    lastSelection:
        null,

    initializing:
        false,

    fallbackActive:
        false,

    fallbackToastShown:
        false
};

const geneoRichTextRuntime = {
    nodeId: '',

    instances: {
        canvas: null,
        inspector: null
    },

    textChangeHandlers: {
        canvas: null,
        inspector: null
    },

    fallbackElements: {
        canvas: null,
        inspector: null
    },

    outsidePointerHandler: null,
    keydownHandler: null,

    draftDelta: null,
    draftText: '',

    syncing: false,
    fallbackActive: false
};

const localizationObserver =
    new MutationObserver(
        records =>
        {
            if (
                state.language !== 'ru'
            )
            {
                return;
            }

            records.forEach(record =>
            {
                if (
                    localizationMutationIsHandled(
                        record.target
                    )
                )
                {
                    return;
                }

                if (
                    record.type
                === 'childList'
                )
                {
                    record.addedNodes
                        .forEach(node =>
                        {
                            if (
                                node.nodeType
                      === Node.ELEMENT_NODE
                    || node.nodeType
                      === Node.TEXT_NODE
                    || node.nodeType
                      === Node.DOCUMENT_FRAGMENT_NODE
                            )
                            {
                                localizeUI(node);
                            }
                        });

                    return;
                }

                if (
                    record.type
                === 'characterData'
                )
                {
                    localizeTextNode(
                        record.target
                    );

                    return;
                }

                if (
                    record.type
                === 'attributes'
              && record.target
                instanceof Element
              && record.attributeName
                )
                {
                    localizeElementAttribute(
                        record.target,
                        record.attributeName
                    );
                }
            });
        }
    );

localizationObserver.observe(
    document.body,
    {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: [
            ...LOCALIZABLE_DOM_ATTRIBUTES
        ]
    }
);

sampleData.notifications = [
    {
        id: 'archive-files-added',
        tone: 'green',
        icon: icon.archive,
        title: 'Archive files are ready to organize',
        meta: 'Archive · Files',
        module: 'Archive'
    },
    {
        id: 'unsorted-photos',
        tone: 'green',
        icon: icon.image,
        title: '8 photos are not assigned to an album',
        meta: 'Albums - Cleanup',
        module: 'Albums'
    },
    {
        id: 'needs-review-places',
        tone: 'blue',
        icon: icon.mapPin,
        title: 'Places may need review',
        meta: 'Places - Review',
        module: 'Places',
        placesView: 'review'
    },
    {
        id: 'backup-reminder',
        tone: 'warn',
        icon: icon.syncoffline,
        title: 'Local backup recommended',
        meta: 'Project settings - Stored locally',
        module: 'Projects',
        openSide: 'settings'
    },
    {
        id: 'publish-privacy',
        tone: 'purple',
        icon: icon.people,
        title: 'Living people are hidden by default in exports',
        meta: 'Publish - Privacy reminder',
        module: 'Publish'
    }
].map(notification => ({
    ...notification,
    projectId: 'p1'
}));

sampleData.activity = [
    { id: 'activity-photos-added', projectId: 'p1', module: 'Albums', tone: 'red', title: 'Photos added', detail: '4 photos added to Family photos', occurredAt: '2026-05-24T10:42:00Z' },
    { id: 'activity-person-updated', projectId: 'p1', module: 'People', tone: 'purple', title: 'Person updated', detail: 'Luna Purrington profile updated', occurredAt: '2026-05-23T10:42:00Z' },
    { id: 'activity-gedcom-imported', projectId: 'p1', module: 'Family Tree', tone: 'amber', title: 'GEDCOM imported', detail: '24 people imported from GEDCOM', occurredAt: '2026-05-25T09:00:00Z' },
    { id: 'activity-note-added', projectId: 'p1', module: 'Notes', tone: '', title: 'Research note added', detail: 'Surname origin note updated', occurredAt: '2026-05-21T11:00:00Z' },
    { id: 'activity-relationship-connected', projectId: 'p1', module: 'Family Tree', tone: '', title: 'Relationship connected', detail: 'Luna Purrington was connected to the tree', occurredAt: '2026-05-18T12:00:00Z' },
    { id: 'activity-file-linked', projectId: 'p1', module: 'Archive', tone: 'amber', title: 'Archive file linked', detail: 'Pawford household register linked to Silver Whiskerfield', occurredAt: '2026-05-14T09:00:00Z' },
    { id: 'activity-duplicate-reviewed', projectId: 'p1', module: 'People', tone: '', title: 'Duplicate reviewed', detail: 'Possible duplicate was marked reviewed', occurredAt: '2026-05-10T14:00:00Z' },
    { id: 'activity-photo-tags', projectId: 'p1', module: 'Albums', tone: 'red', title: 'Photo tags added', detail: 'Three portraits were linked to people', occurredAt: '2026-05-07T15:00:00Z' }
];

function projectNotifications(projectId = currentProjectId())
{
    if (!projectId) return [];
    return (sampleData.notifications || []).filter(notification =>
        notification.projectId === projectId
    );
}
