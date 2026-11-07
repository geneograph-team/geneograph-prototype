const state = {
    projectOpen: false,
    currentProjectId: null,
    selectedProjectId: 'p1',
    activeModule: 'Projects',
    viewMode: 'grid',
    search: '',
    openSide: 'overview',
    projectContinuation: null,
    treeView: 'Classic',
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
    peopleVisibleColumns: { living: true, birth: true, birthPlace: true, death: true, deathPlace: true, updated: true },
    peoplePreviewCollapsed: false,
    peopleProfileEditing: false,
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
    geneoZoom: 83,
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
        'source-file': true,
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
    placesSearch: '',
    placesReviewFocusId: '',
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

    archiveSourceSort: 'updated',
    archiveSourceSortDirection: 'descending',

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

const TREE_ANCESTOR_GENERATION_MIN = 0;
const TREE_ANCESTOR_GENERATION_MAX = 6;
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

function treeProjectViewState(projectId = currentFamilyTreeProjectId())
{
    if (!state.treeProjectViews[projectId])
    {
        const defaultPersonId = treeDefaultPersonId(projectId);

        state.treeProjectViews[projectId] = {
            focusPersonId: defaultPersonId,
            ancestorGenerations: 4,
            descendantGenerations: 3,
            showCousins: true,
            colorFill: true,
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
        projectId = currentFamilyTreeProjectId()
    } = {}
)
{
    const view = treeProjectViewState(projectId);

    if (focusBranch) return personId;

    const projection = buildFamilyTreeProjection(
        currentTreePeople(),
        currentTreeFamilies(),
        {
            focusPersonId: view.focusPersonId,
            ancestorGenerations: view.ancestorGenerations,
            descendantGenerations: view.descendantGenerations,
            showCousins: view.showCousins
        }
    );

    return projection.visiblePersonIds.has(personId)
        ? view.focusPersonId
        : personId;
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
    const nextFocusPersonId = treeNavigationFocusForPerson(
        personId,
        {
            focusBranch,
            projectId
        }
    );

    const selectionChanged =
        state.selectedPersonId !== personId;

    const focusChanged =
        view.focusPersonId !== nextFocusPersonId;

    if (!selectionChanged && !focusChanged)
    {
        if (center) centerTreeOnPerson(personId);
        return false;
    }

    appNavigationMarkIntent();

    view.focusPersonId = nextFocusPersonId;
    state.selectedPersonId = personId;
    state.treeInspectorCollapsed = false;
    state.treeCenterTargetId = center ? personId : '';

    rememberTreeSelectedPerson(personId, projectId);

    if (center)
    {
        renderFamilyTree();
    }
    else
    {
        renderFamilyTreePreserveScroll();
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

function focusTreeBranchForRelative(personId)
{
    return navigateFamilyTreeToPerson(
        personId,
        {
            focusBranch: true,
            center: true
        }
    );
}

function openTreeRecentPeopleMenu(anchor)
{
    closeMenu();
    if (!anchor) return;
    anchor.setAttribute('aria-expanded', 'true');

    const people = treeRecentPeople();
    const rect = anchor.getBoundingClientRect();
    const menu = document.createElement('div');
    menu.className = 'menu-popover tree-recent-people-menu';
    menu.id = 'projectMenu';
    menu.setAttribute('role', 'menu');
    menu.setAttribute('aria-label', 'Recently selected people');
    menu.style.top = `${rect.bottom + 6}px`;
    menu.style.left = `${Math.max(12, Math.min(rect.left, window.innerWidth - 344))}px`;
    menu.innerHTML = `<div class="tree-recent-people-head">Recently selected people</div>
        ${people.length
            ? people.map(person => `<button class="tree-recent-person" type="button" role="menuitem" data-tree-recent-person="${escapeHtml(person.id)}">
              ${renderPersonAvatar(person, 'small-avatar')}
              <span><strong>${escapeHtml(connectPersonName(person))}</strong><small>${escapeHtml(connectPersonLifeLine(person))}</small></span>
              ${person.id === state.selectedPersonId ? `<span class="tree-recent-current" aria-label="Selected">${icon.check}</span>` : ''}
            </button>`).join('')
            : `<div class="tree-recent-people-empty">No recently selected people</div>`}`;

    document.body.appendChild(menu);
    localizeUI(menu, { suppressObserverReplay: true });

    menu.querySelectorAll('[data-tree-recent-person]').forEach(button =>
    {
        button.addEventListener('click', () =>
        {
            const personId = button.dataset.treeRecentPerson;

            closeMenu();

            navigateFamilyTreeToPerson(
                personId,
                {
                    focusBranch: false,
                    center: true
                }
            );
        });
    });

    bindMenuLifecycle(anchor);
    requestAnimationFrame(() => menu.querySelector('[role="menuitem"]')?.focus({ preventScroll: true }));
}

function openTreeSettingsModal()
{
    const projectId = currentFamilyTreeProjectId();
    const view = treeProjectViewState(projectId);
    const focusPerson = getPerson(view.focusPersonId);

    openModal(`<div class="modal tree-settings-modal" role="dialog" aria-modal="true" aria-labelledby="treeSettingsTitle">
        <div class="modal-header">
          <div>
            <h2 id="treeSettingsTitle">Tree Settings</h2>
            <p>Choose how much of the branch around the focus person is shown.</p>
          </div>
          <button class="close-button" type="button" data-close aria-label="Close">${icon.close}</button>
        </div>
        <form id="treeSettingsForm">
          <div class="modal-body tree-settings-body">
            <div class="tree-settings-focus">
              <span>Focus person</span>
              <strong>${escapeHtml(focusPerson?.names?.display || focusPerson?.name || 'Unknown')}</strong>
            </div>
            <div class="two-col-form tree-settings-generation-grid">
              <div class="field">
                <label for="treeAncestorGenerations">Ancestor generations</label>
                <input id="treeAncestorGenerations" type="number" min="${TREE_ANCESTOR_GENERATION_MIN}" max="${TREE_ANCESTOR_GENERATION_MAX}" step="1" value="${view.ancestorGenerations}">
                <span class="field-help">${TREE_ANCESTOR_GENERATION_MIN}–${TREE_ANCESTOR_GENERATION_MAX} generations</span>
              </div>
              <div class="field">
                <label for="treeDescendantGenerations">Descendant generations</label>
                <input id="treeDescendantGenerations" type="number" min="${TREE_DESCENDANT_GENERATION_MIN}" max="${TREE_DESCENDANT_GENERATION_MAX}" step="1" value="${view.descendantGenerations}">
                <span class="field-help">${TREE_DESCENDANT_GENERATION_MIN}–${TREE_DESCENDANT_GENERATION_MAX} generations</span>
              </div>
            </div>
            <label class="tree-settings-check">
              <input id="treeShowCousins" type="checkbox" ${view.showCousins ? 'checked' : ''}>
              <span>
                <strong>Show cousins of the focus person</strong>
                <small>Collateral branches are limited to cousins of the current focus person.</small>
              </span>
            </label>
            <label class="tree-settings-check">
              <input id="treeColorFill" type="checkbox" ${view.colorFill !== false ? 'checked' : ''}>
              <span>
                <strong>Color fill</strong>
                <small>Fill person cards with their gender color. Turn off to keep neutral cards with colored borders.</small>
              </span>
            </label>
          </div>
          <div class="modal-footer">
            <button class="button secondary" type="button" data-close>Cancel</button>
            <button class="button primary" type="submit">Apply settings</button>
          </div>
        </form>
      </div>`);

    modalBackdrop.querySelector('#treeSettingsForm')?.addEventListener('submit', event =>
    {
        event.preventDefault();
        const ancestorValue = Number(modalBackdrop.querySelector('#treeAncestorGenerations')?.value);
        const descendantValue = Number(modalBackdrop.querySelector('#treeDescendantGenerations')?.value);
        view.ancestorGenerations = clampNumber(
            Number.isFinite(ancestorValue) ? Math.round(ancestorValue) : view.ancestorGenerations,
            TREE_ANCESTOR_GENERATION_MIN,
            TREE_ANCESTOR_GENERATION_MAX
        );
        view.descendantGenerations = clampNumber(
            Number.isFinite(descendantValue) ? Math.round(descendantValue) : view.descendantGenerations,
            TREE_DESCENDANT_GENERATION_MIN,
            TREE_DESCENDANT_GENERATION_MAX
        );
        view.showCousins = Boolean(modalBackdrop.querySelector('#treeShowCousins')?.checked);
        view.colorFill = Boolean(modalBackdrop.querySelector('#treeColorFill')?.checked);
        state.treeCenterTargetId = view.focusPersonId;
        closeModal();
        renderFamilyTree();
    });
}

function treeParentFamilyContext(people, families, personId)
{
    const personIds = new Set(
        (people || []).map(person => person.id)
    );
    const parentIds = new Set();
    const ownFamilyIds = new Set();

    (families || []).forEach(family =>
    {
        if (!(family.children || []).includes(personId)) return;

        ownFamilyIds.add(family.id);

        [family.left, family.right].forEach(id =>
        {
            if (id && personIds.has(id)) parentIds.add(id);
        });
    });

    // Expand only through this person's recorded parents.
    // Newly discovered partners do not expand the scope again.
    const relatedFamilies = (families || []).filter(family =>
        ownFamilyIds.has(family.id)
        || [family.left, family.right].some(id =>
            id && parentIds.has(id)
        )
    );

    const siblingIds = new Set(
        relatedFamilies
            .flatMap(family => family.children || [])
            .filter(id => id !== personId && personIds.has(id))
    );

    return {
        parentIds,
        families: relatedFamilies,
        siblingIds
    };
}

function deriveTreeBranchRoles(
    people,
    families,
    focusPersonId,
    visiblePersonIds = null,
    visibleFamilyIds = null
)
{
    const projectPersonIds = new Set((people || []).map(person => person.id));
    const visibleIds = visiblePersonIds instanceof Set
        ? new Set([...visiblePersonIds].filter(id => projectPersonIds.has(id)))
        : new Set(projectPersonIds);
    const parentFamiliesByChild = new Map();
    const childFamiliesByParent = new Map();
    const partnerIdsByPerson = new Map();

    (families || []).forEach(family =>
    {
        const partners = [family.left, family.right].filter(id => projectPersonIds.has(id));
        const children = (family.children || []).filter(id => projectPersonIds.has(id));

        children.forEach(childId =>
        {
            if (!parentFamiliesByChild.has(childId)) parentFamiliesByChild.set(childId, []);
            parentFamiliesByChild.get(childId).push(family);
        });

        partners.forEach(parentId =>
        {
            if (!childFamiliesByParent.has(parentId)) childFamiliesByParent.set(parentId, []);
            childFamiliesByParent.get(parentId).push(family);
            if (!partnerIdsByPerson.has(parentId)) partnerIdsByPerson.set(parentId, new Set());
            partners.filter(id => id !== parentId).forEach(id => partnerIdsByPerson.get(parentId).add(id));
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
    const directDescendantIds = collectRelatives(focusPersonId, personId =>
        (childFamiliesByParent.get(personId) || [])
            .flatMap(family => family.children || [])
            .filter(Boolean)
    );
    const lineageRelativeIds = collectRelatives(focusPersonId, personId => [
        ...(parentFamiliesByChild.get(personId) || [])
            .flatMap(family => [family.left, family.right])
            .filter(Boolean),
        ...(childFamiliesByParent.get(personId) || [])
            .flatMap(family => family.children || [])
            .filter(Boolean)
    ]);
    const focusPartnerIds = new Set(partnerIdsByPerson.get(focusPersonId) || []);
    const directSiblingIds = treeParentFamilyContext(
        people,
        families,
        focusPersonId
    ).siblingIds;
    const householdSiblingIds = new Set(
        [...directSiblingIds].filter(personId =>
            (childFamiliesByParent.get(personId) || []).some(family =>
            {
                if (visibleFamilyIds instanceof Set && !visibleFamilyIds.has(family.id)) return false;
                const hasVisiblePartner = [family.left, family.right]
                    .some(id => id && id !== personId && visibleIds.has(id));
                const hasVisibleChild = (family.children || [])
                    .some(id => visibleIds.has(id));
                return hasVisiblePartner || hasVisibleChild;
            })
        )
    );
    const visibleRelativePartnerIds = new Set();
    lineageRelativeIds.forEach(personId =>
    {
        if (!visibleIds.has(personId)) return;
        (partnerIdsByPerson.get(personId) || []).forEach(partnerId =>
        {
            if (visibleIds.has(partnerId)) visibleRelativePartnerIds.add(partnerId);
        });
    });

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
        directAncestorIds,
        directDescendantIds,
        directSiblingIds,
        householdSiblingIds,
        lineageRelativeIds,
        focusPartnerIds,
        visibleRelativePartnerIds,
        placeholderPersonIds,
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

    const includeFamily = (family, { children = true } = {}) =>
    {
        if (!family) return;
        visibleFamilyIds.add(family.id);
        [family.left, family.right].filter(Boolean).forEach(id => visiblePersonIds.add(id));
        if (children) (family.children || []).forEach(id => visiblePersonIds.add(id));
    };

    let ancestorFrontier = focusPersonId ? [focusPersonId] : [];
    for (let depth = 1; depth <= ancestorGenerations && ancestorFrontier.length; depth += 1)
    {
        const next = [];
        ancestorFrontier.forEach(childId =>
        {
            (parentFamiliesByChild.get(childId) || []).forEach(family =>
            {
                includeFamily(family, { children: depth === 1 });
                [family.left, family.right].filter(Boolean).forEach(parentId => next.push(parentId));
            });
        });
        ancestorFrontier = [...new Set(next)];
    }

    let descendantFrontier = focusPersonId ? [focusPersonId] : [];
    for (let depth = 1; depth <= descendantGenerations && descendantFrontier.length; depth += 1)
    {
        const next = [];
        descendantFrontier.forEach(parentId =>
        {
            (childFamiliesByParent.get(parentId) || []).forEach(family =>
            {
                includeFamily(family);
                (family.children || []).forEach(childId => next.push(childId));
            });
        });
        descendantFrontier = [...new Set(next)];
    }

    (childFamiliesByParent.get(focusPersonId) || []).forEach(family =>
    {
        includeFamily(family, { children: descendantGenerations > 0 });
    });

    if (ancestorGenerations > 0)
    {
        const parentContext = treeParentFamilyContext(
            people,
            families,
            focusPersonId
        );

        // These children are siblings in the focused person's generation.
        // They remain visible even when descendantGenerations is zero.
        parentContext.families.forEach(family =>
        {
            includeFamily(family);
        });

        parentContext.siblingIds.forEach(siblingId =>
        {
            (childFamiliesByParent.get(siblingId) || []).forEach(family =>
            {
                const hasPartner = [family.left, family.right]
                    .some(id => id && id !== siblingId && peopleById.has(id));
                const hasChildren = (family.children || [])
                    .some(id => peopleById.has(id));
                if (!hasPartner && !hasChildren) return;
                includeFamily(family, { children: descendantGenerations > 0 });
            });
        });
    }

    if (options.showCousins && ancestorGenerations >= 2)
    {
        const focusParentIds = new Set(
            (parentFamiliesByChild.get(focusPersonId) || [])
                .flatMap(family => [family.left, family.right])
                .filter(Boolean)
        );

        focusParentIds.forEach(parentId =>
        {
            (parentFamiliesByChild.get(parentId) || []).forEach(grandparentFamily =>
            {
                includeFamily(grandparentFamily);
                (grandparentFamily.children || [])
                    .filter(relativeId => relativeId !== parentId)
                    .forEach(auntOrUncleId =>
                    {
                        (childFamiliesByParent.get(auntOrUncleId) || []).forEach(cousinFamily =>
                        {
                            includeFamily(cousinFamily);
                        });
                    });
            });
        });
    }

    const projectedFamilies = (families || [])
        .filter(family => visibleFamilyIds.has(family.id))
        .map(family => ({
            ...family,
            children: (family.children || []).filter(childId => visiblePersonIds.has(childId))
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
        coherentPersonIds,
        visibleFamilyIds
    );

    return {
        focusPersonId,
        people: (people || []).filter(person => coherentPersonIds.has(person.id)),
        families: projectedFamilies,
        visiblePersonIds: coherentPersonIds,
        visibleFamilyIds,
        branchRoles
    };
}

function currentPeopleRecords()
{
    return getPeopleRecordsFromSampleData(currentProjectId());
}

function normalizePlaceLookupText(value)
{
    return cleanEditFieldValue(value)
        .replace(/\s+/g, ' ')
        .replace(/[.,;:]+$/g, '')
        .toLowerCase();
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
        if (!place || place.deleted || place.projectId !== projectId) return false;

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
        updatedAt: now,
        deleted: false
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
        selectedPlace && !selectedPlace.deleted && selectedPlace.projectId === projectId &&
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

function syncPeopleRecordToSampleData(record)
{
    const person = getPerson(record?.id);
    const birthPlace = resolvePlaceInputValue(record.birthPlace, person.birth?.placeId);
    const deathPlace = resolvePlaceInputValue(record.deathPlace, person.death?.placeId);
    if (!person) return;
    person.names.first = record.first || person.names.first;
    person.names.last = record.surname || person.names.last;
    rebuildPersonDisplayName(person);
    person.gender = record.gender || person.gender;
    person.livingStatus = record.living || person.livingStatus;
    person.birth = {
        ...normalizeGenealogyDateInput({
            date: record.birth,
            dateLabel: record.birth,
            dateType: peopleProfileDetailsFor(record).birthDateType || person.birth?.dateType || 'Unknown',
            calendar: person.birth?.calendar,
            originalText: record.birth
        }, 'Unknown'),
        placeId: birthPlace.placeId || cleanDatePlaceId(person.birth?.placeId),
        placeText: birthPlace.placeText || person.birth?.placeText || '',
        address: person.birth?.address || ''
    };
    if (person.livingStatus === 'Deceased')
    {
        person.death = {
            ...normalizeGenealogyDateInput({
                date: record.death,
                dateLabel: record.death,
                dateType: peopleProfileDetailsFor(record).deathDateType || person.death?.dateType || 'Unknown',
                calendar: person.death?.calendar,
                originalText: record.death
            }, 'Unknown'),
            placeId: deathPlace.placeId,
            placeText: deathPlace.placeText,
            reason: person.death?.reason || '',
            burialPlaceId: cleanDatePlaceId(person.death?.burialPlaceId),
            burialPlaceText: person.death?.burialPlaceText || ''
        };
    }
    else
    {
        person.death = {
            ...emptyGenealogyDate('Exact date'),
            placeId: null,
            reason: '',
            burialPlaceId: null
        };
    }
    person.meta.updated = record.updated || person.meta.updated;
    rebuildSampleEventsAndPruneSourceLinks();
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
