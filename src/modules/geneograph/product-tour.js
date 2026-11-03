const GENEO_TOUR_STORAGE_KEY = 'geneograph.productTour';
const GENEO_TOUR_VERSION = 2;
const GENEO_TOUR_PROJECT_ID = 'p1';
const geneoTourSteps = [
    { id: 'projects-welcome', module: 'Projects', projectView: 'library', presentation: 'centered', title: "Welcome to Projects", body: "Projects bring your family tree, photographs, records, and notes into one workspace. This is where each family-history research begins." },
    { id: 'projects-actions', module: 'Projects', projectView: 'library', title: "Create or open a project", body: "Create family tree starts a blank project. Import GEDCOM and Open project are not available in this demo." },
    { id: 'projects-continue', module: 'Projects', projectView: 'library', title: "Continue your work", body: "Return to the last project and section you opened." },
    { id: 'projects-card', module: 'Projects', projectView: 'library', title: "Open the sample project", body: "The Whiskerfield Family Tree card introduces the sample project. Open it to explore the research inside." },
    { id: 'projects-hero', module: 'Projects', projectView: 'overview', title: "Your project at a glance", body: "The project overview shows its name, description, status, dates, and main actions." },
    { id: 'projects-tags', module: 'Projects', projectView: 'overview', title: "Research in numbers", body: "These counts show the people, photos, files, and notes in the project." },
    { id: 'projects-back', module: 'Projects', projectView: 'overview', title: "All projects", body: "All projects in Navigation returns to the project library. Your changes save automatically." },
    { id: 'projects-tabs', module: 'Projects', projectView: 'overview', title: "Move between modules", body: "The top tabs open the project's connected modules. The tour continues in Family Tree." },
    { id: 'tree-welcome', module: 'Family Tree', presentation: 'centered', title: "Welcome to Family Tree", body: "See family members across generations, discover how people are related, and explore different branches of the tree." },
    { id: 'tree-person-card', module: 'Family Tree', title: "Meet a person in the tree", body: "The card shows a photo, name, and key life dates. Select a card to learn more about that person." },
    { id: 'tree-focus-switch', module: 'Family Tree', title: "Explore another branch", body: "Focus on a different person to see their branch of the tree." },
    { id: 'tree-navigation', module: 'Family Tree', title: "Find a person", body: "Open the person picker to revisit recent people or search everyone in this project." },
    { id: 'tree-sidebar', module: 'Family Tree', title: "More about this person", body: "The right panel gives you more information about the selected person without taking you away from the tree." },
    { id: 'tree-sidebar-hero', module: 'Family Tree', title: "Person at a glance", body: "The top of the panel shows the person's photo, name, life details, and a link to their full profile." },
    { id: 'tree-sidebar-actions', module: 'Family Tree', title: "Edit this person", body: "Quick edit, add a relative, or connect someone already in the project as a new relative." },
    { id: 'tree-quick-edit-button', module: 'Family Tree', title: "Quick edit", body: "Quick edit opens the edit window without leaving the tree." },
    { id: 'tree-quick-edit-modal', module: 'Family Tree', title: "Edit person details", body: "Update names and life events in this window. Changes take effect when you save." },
    { id: 'tree-add-relative', module: 'Family Tree', title: "Add or connect a relative", body: "Choose a relationship, then add a new person or connect someone already in the project." },
    { id: 'tree-sections-overview', module: 'Family Tree', title: "Explore related details", body: "Expand these sections for insights, events, relationships, photos, files, notes, sources, and record details." },
    { id: 'tree-timeline', module: 'Family Tree', title: "Follow the timeline", body: "Dated events in the Timeline section trace this person's life in order." },
    { id: 'tree-relationships', module: 'Family Tree', title: "Explore relationships", body: "See selected person's parents, partner, and children here. You can edit relative connections, or unlink people without deleting their records." },
    { id: 'tree-relationship-actions', module: 'Family Tree', title: "Edit or unlink a connection", body: "Hover over a relative to reveal Edit and Unlink. Edit changes the relationship. Unlink removes the connection without deleting either person." },
    { id: 'tree-to-people', module: 'Family Tree', title: "Explore everyone in the project", body: "Open People to browse the full people list, or jump straight to the selected person’s profile from the right panel." },
    { id: 'people-welcome', module: 'People', presentation: 'centered', title: "Welcome to People", body: "This is where the people in your project come together, along with the relationships and details that shape their stories." },
    { id: 'people-navigation', module: 'People', title: "Navigation", body: "Use People to browse the directory, or Profile to see the selected person in greater detail." },
    { id: 'people-table', module: 'People', title: "Browse the directory", body: "Search and sort everyone in the project alongside key life details." },
    { id: 'people-columns', module: 'People', title: "Choose your columns", body: "Show the details you need and hide columns that are less useful right now." },
    { id: 'people-filters', module: 'People', title: "Filter the directory", body: "Find people by name, date, place, and other details." },
    { id: 'people-save-filter', module: 'People', title: "Save a filter", body: "This surname filter is just an example. Save filter keeps a useful selection for later." },
    { id: 'people-saved-filters', module: 'People', title: "Open saved filters", body: "Find your saved filters in the left panel. Open or edit them there." },
    { id: 'people-to-profile', module: 'People', title: "Open a full profile", body: "Click Profile on the left or View profile in the right panel to explore the selected person." },
    { id: 'people-profile-welcome', module: 'People', presentation: 'centered', title: "Inside a profile", body: "A profile brings a person's life details and connected research together." },
    { id: 'people-profile-hero', module: 'People', title: "Profile overview", body: "The top section shows the person’s photo, name, key life details, and available actions." },
    { id: 'people-profile-card', module: 'People', title: "Explore profile details", body: "Four tabs organize the person’s main information into clear sections." },
    { id: 'people-connected', module: 'People', title: "Explore related research", body: "Find photos, archive files, places, and notes connected to this person." },
    { id: 'people-to-geneograph', module: 'People', title: "Continue to Geneograph", body: "Next, see how your research comes together in a visual workspace." },
    { id: 'geneograph-welcome', module: 'Geneograph', presentation: 'centered', title: "Welcome to Geneograph", body: "Use visual boards to explore family relationships, connect evidence, and work through research ideas." },
    { id: 'geneograph-navigation', module: 'Geneograph', title: "Board navigation", body: "Use the navigation menu to view all boards, favourites, boards not in collection, or archived boards." },
    { id: 'geneograph-collections', module: 'Geneograph', title: "Organize boards", body: "Create collections to group related boards without changing what is on them." },
    { id: 'geneograph-create-actions', module: 'Geneograph', title: "Create a board", body: "Create a new board here, or import an editable .ggboard file to continue working on a saved board." },
    { id: 'geneograph-create-modal', module: 'Geneograph', title: "Set up a board", body: "Give the board a name, add an optional description, and choose its collections." },
    { id: 'geneograph-card', module: 'Geneograph', title: "Open the sample board", body: "This card shows the sample board and its details. Open it to explore the editor." },
    { id: 'geneograph-editor-welcome', module: 'Geneograph', presentation: 'centered', title: "Explore the board editor", body: "Build out your board by arranging people, connections, and research materials however you need." },
    { id: 'geneograph-all-boards', module: 'Geneograph', title: "Return to all boards", body: "All Boards opens the board library. Your edits save automatically." },
    { id: 'geneograph-current-board', module: 'Geneograph', title: "Board details", body: "The board name appears here. Use Edit board to change its name, description, or collections." },
    { id: 'geneograph-layers', module: 'Geneograph', title: "Find and manage items", body: "Search objects and connections together. Use the filter to narrow the list, or locate an item on the canvas." },
    { id: 'geneograph-objects', module: 'Geneograph', title: "See items on the canvas", body: "Here you can see a few items already placed on the canvas, including a panel and person cards." },
    { id: 'geneograph-topbar', module: 'Geneograph', title: "Board toolbar", body: "The toolbar helps you navigate the board and add the different kinds of items you need." },
    { id: 'geneograph-modes', module: 'Geneograph', title: "Select, move, or draw", body: "Switch between selecting objects, moving around the canvas, and drawing with the pencil." },
    { id: 'geneograph-connect', module: 'Geneograph', title: "Connect objects", body: "Draw a solid or dashed line between objects to connect them." },
    { id: 'geneograph-person', module: 'Geneograph', title: "Add a person", body: "People are central to family charts. Add a person to the canvas and connect them to other objects or people." },
    { id: 'geneograph-other-objects', module: 'Geneograph', title: "Add visual context", body: "Use supporting elements to organize the board and make relationships and ideas easier to follow." },
    { id: 'geneograph-sockets-intro', module: 'Geneograph', title: "Understand connections", body: "Each object has four connection sockets: top, right, bottom, and left. Lines attach to these points so objects stay connected as you arrange the board." },
    { id: 'geneograph-sockets-partners', module: 'Geneograph', title: "Connect partners", body: "Use the left and right sockets to connect partners. The sockets determine how the relationship is recorded, so using different connection points creates a different type of relationship." },
    { id: 'geneograph-sockets-children', module: 'Geneograph', title: "Connect parents and children", body: "Connect from a person’s bottom socket to another person’s top socket to create a parent-child relationship. The person at the top becomes the parent. The same rule applies when connecting from a couple’s socket." },
    { id: 'geneograph-sockets-context', module: 'Geneograph', title: "Connect research context", body: "Images, notes and other objects can connect through any of their sockets." },
    { id: 'geneograph-inspector', module: 'Geneograph', title: "Adjust the canvas and objects", body: "Use this panel to change canvas settings. When you select an object, the panel switches to settings for that object." },
    { id: 'geneograph-export', module: 'Geneograph', title: "Export your board", body: "Choose Editable board file to save a .ggboard copy you can import and edit later. PNG image saves a picture only. In this demo, export again after making changes to keep them across reloads." },
    { id: 'geneograph-to-albums', module: 'Geneograph', title: "Continue to Albums", body: "Next, see how photos become part of your family research." },
    { id: 'albums-welcome', module: 'Albums', presentation: 'centered', title: "Welcome to Albums", body: "Explore project photos, organize them into albums, and add the details that make each image meaningful." },
    { id: 'albums-photos', module: 'Albums', title: "Inspect photos", body: "Select a photo to view the image and its details." },
    { id: 'albums-navigation', module: 'Albums', title: "Browse your photos", body: "Use the navigation panel to switch between all photos, favourites, and photos not yet added to an album." },
    { id: 'albums-albums', module: 'Albums', title: "Organize with albums", body: "Open an existing album, or create a new one with the plus button." },
    { id: 'albums-filters', module: 'Albums', title: "Filter photos", body: "Use filters to narrow the photo list and find the images you need faster." },
    { id: 'albums-summary', module: 'Albums', title: "Explore photo details", body: "Use the right panel to view the selected photo and learn more about it." },
    { id: 'albums-actions', module: 'Albums', title: "Manage the photo", body: "Use these controls to update and manage the selected photo." },
    { id: 'albums-connections', module: 'Albums', title: "People in this photo", body: "See who is tagged in the photo. Hover over a name to highlight that person in the preview." },
    { id: 'albums-tag-person-modal', module: 'Albums', title: "Tag people in a photo", body: "Choose a person to tag them immediately. You can mark their area directly in the photo preview." },
    { id: 'albums-add-to-album-action', module: 'Albums', title: "Albums for this photo", body: "See which albums include the photo, add it to another album, or remove it from one." },
    { id: 'albums-add-to-album', module: 'Albums', title: "Choose an album", body: "Add photo to an existing album or create a new one." },
    { id: 'albums-to-archive', module: 'Albums', title: "Continue to Archive", body: "Next, move to Archive to explore the files and sources behind your research." },
    { id: 'archive-welcome', module: 'Archive', presentation: 'centered', title: "Welcome to Archive", body: "Organize your research files in one place and connect each file to the people it belongs to." },
    { id: 'archive-navigation', module: 'Archive', title: "Browse Archive", body: "Use the left navigation to open all files, favourites, or sources." },
    { id: 'archive-folders', module: 'Archive', title: "Organize with folders", body: "Build your own folder structure and use the folder tree to move through it." },
    { id: 'archive-location', module: 'Archive', title: "Move between folders", body: "The path shows your current folder. Use Back, Forward, Up, or the path to navigate." },
    { id: 'archive-table', module: 'Archive', title: "Explore folder contents", body: "The main area shows folders and files in your current location. Open folders and select files to explore your archive." },
    { id: 'archive-filters', module: 'Archive', title: "Filter your files", body: "Use filters to narrow the file list and find the materials you need faster." },
    { id: 'archive-folder-actions', module: 'Archive', title: "Create a folder", body: "Use the sidebar or top button to create a folder. Subfolder button will create a folder in current location." },
    { id: 'archive-folder-modal', module: 'Archive', title: "Choose a name and location", body: "Enter a name and choose the parent folder. The folder appears after you confirm." },
    { id: 'archive-inspector', module: 'Archive', title: "File details", body: "Select a file to view its details in the right panel." },
    { id: 'archive-file-actions', module: 'Archive', title: "File tools", body: "The toolbar helps you make changes to the selected file and manage it within the archive." },
    { id: 'archive-to-notes', module: 'Archive', title: "Continue to Notes", body: "Next, see how you can record thoughts and questions as your research develops." },
    { id: 'notes-welcome', module: 'Notes', presentation: 'centered', title: "Welcome to Notes", body: "Use notes to develop your research, record your thoughts, and connect ideas with related records." },
    { id: 'notes-navigation', module: 'Notes', title: "Note navigation", body: "Switch between all notes, favourites, and archived notes from the navigation panel." },
    { id: 'notes-collections', module: 'Notes', title: "Create note collections", body: "Group related notes by topic or any structure that works for you." },
    { id: 'notes-list-example', module: 'Notes', title: "Preview notes in the list", body: "Each note card shows its title along with a short preview, so you can quickly see what the note is about." },
    { id: 'notes-filters', module: 'Notes', title: "Filter your notes", body: "Use filters to narrow the note list and find the information you need faster." },
    { id: 'notes-editor-overview', module: 'Notes', title: "Edit the note", body: "Use the right panel to work with the note text and review its related information." },
    { id: 'notes-rich-text', module: 'Notes', title: "Format your note", body: "Use the editor to write your note, then add headings, lists, or emphasis to make important information easier to follow." },
    { id: 'notes-sections', module: 'Notes', title: "Connect the note to your research", body: "This area brings together the records and research related to the note, so you can see how it fits into the wider project." },
    { id: 'notes-checklist', module: 'Notes', title: "Plan next steps", body: "Add simple to-do items to the note and mark them complete as you work." },
    { id: 'notes-add-actions', module: 'Notes', title: "Connect an event", body: "Link the note to a related event so the research stays connected to the right part of the family story." },
    { id: 'notes-add-events', module: 'Notes', title: "Choose an event", body: "Find the event this note refers to and select it to create the connection." },
    { id: 'notes-to-places', module: 'Notes', title: "Continue to Places", body: "Next, see how the places in your research connect to people and events." },
    { id: 'places-welcome', module: 'Places', presentation: 'centered', title: "Welcome to Places", body: "Explore the places in your project on a map or in a list, and see how they connect to people and events." },
    { id: 'places-navigation', module: 'Places', title: "Place navigation", body: "Switch between all project places and those records that need your attention." },
    { id: 'places-countries', module: 'Places', title: "Browse recorded places", body: "Places are grouped by country. Expand or collapse each group to browse the locations recorded there." },
    { id: 'places-map', module: 'Places', title: "Explore places on the map", body: "See where your family story unfolded and open a location to view its details." },
    { id: 'places-routes', module: 'Places', title: "Explore routes", body: "Trace a person or surname through dated events tied to mapped places." },
    { id: 'places-list', module: 'Places', title: "Switch to the list", body: "Map and List show the same places. Use the list view to see the same places in a more structured format and review their details more easily." },
    { id: 'places-filters', module: 'Places', title: "Filter your places", body: "Use filters to narrow the list and find the places you need faster." },
    { id: 'places-save-filter', module: 'Places', title: "Save a filtered view", body: "Use Save filter to keep the current filtered list for quick access later." },
    { id: 'places-saved-filters', module: 'Places', title: "Open saved filters", body: "Your saved filters appear in the navigation panel, ready to open whenever you need them." },
    { id: 'places-add-button', module: 'Places', title: "Add a new place", body: "Create a new place record and add it to your project." },
    { id: 'places-add-modal', module: 'Places', title: "Find or enter a place", body: "Start typing a place name to search existing locations. Select a match, or enter your own place name if needed." },
    { id: 'places-add-coordinates', module: 'Places', title: "Set the map location", body: "Choose the position on the map, or enter the coordinates manually for a precise location." },
    { id: 'places-add-map', module: 'Places', title: "Place the marker", body: "Click the map to set or move the marker, then choose Use position to return to the Add place window with the coordinates filled in." },
    { id: 'places-add-create', module: 'Places', title: "Create the place", body: "Back in the Add place window, review the details and choose Create place to save the new location." },
    { id: 'places-inspector', module: 'Places', title: "Place details", body: "Use the right panel to review the place information and make changes when needed." },
    { id: 'places-actions', module: 'Places', title: "Manage the place", body: "Edit the place details, or open More actions for useful options related to this location." },
    { id: 'places-outro', module: 'Places', title: "Take the tour again", body: "Open Help and choose Take the tour to restart the tour or jump directly to any module you want to revisit." }
];
const geneoTourModules = ['Projects', 'Family Tree', 'People', 'Geneograph', 'Albums', 'Archive', 'Notes', 'Places'];
const geneoTourModuleIconNames = {
    Projects: 'home',
    'Family Tree': 'tree',
    People: 'people',
    Geneograph: 'whiteboard',
    Albums: 'image',
    Archive: 'archive',
    Notes: 'note',
    Places: 'mapPin'
};
const geneoTourLibrarySteps = new Set([
    'geneograph-welcome', 'geneograph-navigation', 'geneograph-collections',
    'geneograph-create-actions', 'geneograph-create-modal', 'geneograph-card'
]);
const geneoTourOptionalTargets = new Set(['projects-actions', 'projects-continue', 'projects-back', 'projects-tabs']);
const geneoTourSeedTargets = (() =>
{
    const diagram = getGeneographBoard('gb1', { projectId: GENEO_TOUR_PROJECT_ID })?.diagram;
    if (!diagram) return {};
    const personId = treePersonId => diagram.people.find(person => person.treePersonId === treePersonId)?.id;
    const silverId = personId('silver');
    const lunaId = personId('luna');
    return {
        panel: diagram.nodes.find(node => node.type === 'panel')?.id,
        silver: diagram.nodes.find(node => node.type === 'person' && node.personId === silverId)?.id,
        couple: diagram.families.find(family =>
            family.partnerIds.includes(silverId) && family.partnerIds.includes(lunaId))?.id,
        image: diagram.nodes.find(node => node.type === 'image')?.id,
        note: diagram.nodes.find(node => node.type === 'sticky'
            && node.text?.startsWith("Photo from Barnaby's family album"))?.id
    };
})();
const geneoTourNodeSelector = id => `[data-geneo-node="${id || ''}"]`;
const geneoTourSocketSelector = (id, port) => `[data-geneo-port-node="${id || ''}"][data-geneo-port="${port}"]`;
const geneoTourFamilySelector = id => `[data-geneo-family-junction="${id || ''}"]`;

const geneoTourSecondarySelectors = {
    'tree-to-people': '.tree-person-hero-profile',
    'tree-add-relative': '.tree-inspector #addRelative',
    'people-columns': '#peopleColumnsButton',
    'people-filters': '#peopleFilterButton',
    'albums-filters': '#albumsFilterButton',
    'archive-filters': '#archiveFilterButton',
    'archive-inspector': '[data-archive-file-row="af1"]',
    'archive-folder-actions': '.archive-page-head [data-archive-create-folder]',
    'people-to-profile': '.people-layout .tree-person-hero-profile',
    'people-connected': '.profile-resource-card--archive',
    'notes-filters': '#notesFilterButton',
    'places-list': '.places-view-switch',
    'places-filters': '#placesFilterButton',
    'places-routes': '#placesRouteMenu',
    'places-add-coordinates': '#modalBackdrop [data-place-coordinate-details]',
    'places-add-map': '[data-places-coordinate-bar]',
    'places-outro': '[data-topbar-help]',
    'geneograph-export': '.geneo-editor-toolbar [data-geneo-export]',
    'geneograph-sockets-intro': geneoTourFamilySelector(geneoTourSeedTargets.couple),
    'geneograph-sockets-partners': geneoTourSocketSelector(geneoTourSeedTargets.silver, 'right'),
    'geneograph-sockets-children': geneoTourSocketSelector(geneoTourSeedTargets.silver, 'bottom'),
    'geneograph-sockets-context': geneoTourNodeSelector(geneoTourSeedTargets.note),
    'geneograph-other-objects': '#projectMenu.geneo-toolbar-overflow-menu [data-geneo-toolbar-action="image"]'
};
const geneoTourTertiarySelectors = {
    'people-connected': '.profile-resource-card--notes',
    'archive-folder-actions': '.archive-folder-inspector-actions [data-archive-create-folder]',
    'geneograph-sockets-children': geneoTourFamilySelector(geneoTourSeedTargets.couple)
};
const geneoTourQuaternarySelectors = {
    'people-connected': '.profile-resource-card--places'
};

const geneoTourRuntime = {
    active: false,
    invited: false,
    transitioning: false,
    index: -1,
    token: 0,
    root: null,
    target: null,
    secondaryTarget: null,
    tertiaryTarget: null,
    quaternaryTarget: null,
    fallback: false,
    optionalFallback: false,
    origin: null,
    returnFocus: null,
    observer: null,
    resizeObserver: null,
    positionFrame: 0,
    mobileScrollAdjusted: false,
    history: [],
    ownedPreview: null,
    openingPreview: false,
    geneoSocketsOrigin: null,
    peopleOrigin: null,
    albumsOrigin: null,
    albumsModalSelection: null,
    archiveOrigin: null,
    archiveOriginScroll: null,
    notesOrigin: null,
    notesOriginScroll: null,
    placesOrigin: null,
    placesOriginScroll: null,
    placesDraftCoordinates: null
};

function geneoTourReadStatus()
{
    try
    {
        const value = JSON.parse(localStorage.getItem(GENEO_TOUR_STORAGE_KEY) || 'null');
        return value?.version === GENEO_TOUR_VERSION ? value.status : 'unseen';
    }
    catch (_error)
    {
        return 'unseen';
    }
}

function geneoTourWriteStatus(status)
{
    try
    {
        localStorage.setItem(GENEO_TOUR_STORAGE_KEY, JSON.stringify({ version: GENEO_TOUR_VERSION, status }));
    }
    catch (_error)
    {
        // The session flag still prevents a repeated invitation.
    }
}

function geneoTourCaptureOrigin()
{
    if (state.activeModule === 'Family Tree') captureTreeCanvasScroll(state.currentProjectId);
    if (state.activeModule === 'Geneograph' && state.geneoView === 'board') captureGeneographViewport();
    const values = structuredClone(state);
    const scroll = {};
    ['.main', '.tree-canvas', '.tree-inspector', '[data-geneo-canvas-wrap]', '.notes-browser-pane', '.notes-browser-scroll',
        '.albums-sidebar', '.albums-main', '.albums-detail', '.archive-sidebar', '.archive-inspector-scroll',
        '.places-sidebar', '.places-inspector'].forEach(selector =>
    {
        const element = document.querySelector(selector);
        if (element) scroll[selector] = { x: element.scrollLeft, y: element.scrollTop };
    });
    scroll.page = { x: document.scrollingElement?.scrollLeft || 0,
        y: document.scrollingElement?.scrollTop || 0 };
    return { values, scroll };
}

function geneoTourRestoreOrigin(origin)
{
    if (!origin) return;
    Object.entries(origin.values).forEach(([key, value]) => { state[key] = structuredClone(value); });
    render();
    requestAnimationFrame(() =>
    {
        Object.entries(origin.scroll).forEach(([selector, point]) =>
        {
            const element = selector === 'page' ? document.scrollingElement : document.querySelector(selector);
            if (element) element.scrollTo(point.x, point.y);
        });
    });
}

function maybeOfferGeneoProductTour()
{
    if (geneoTourRuntime.active || geneoTourRuntime.invited || geneoTourReadStatus() !== 'unseen') return;
    if (state.activeModule !== 'Projects' || state.projectOpen) return;
    requestAnimationFrame(() =>
    {
        if (geneoTourRuntime.active || geneoTourRuntime.invited || state.projectOpen
            || state.activeModule !== 'Projects' || modalBackdrop.classList.contains('open')) return;
        geneoTourRuntime.invited = true;
        geneoTourWriteStatus('skipped');
        startGeneoProductTour();
    });
}

function startGeneoProductTour()
{
    if (geneoTourRuntime.active || modalBackdrop.classList.contains('open')) return false;
    if (!validProjectById(GENEO_TOUR_PROJECT_ID)) return false;
    geneoTourRuntime.origin = geneoTourCaptureOrigin();
    geneoTourRuntime.returnFocus = document.querySelector('[data-topbar-help]');
    geneoTourRuntime.active = true;
    geneoTourRuntime.invited = true;
    geneoTourRuntime.history = [];
    document.addEventListener('keydown', geneoTourOnKeydown, true);
    closeMenu();
    closeTopbarPopover();
    geneoTourRuntime.transitioning = true;
    state.activeModule = 'Projects';
    state.projectOpen = false;
    render();
    geneoTourRuntime.transitioning = false;
    geneoTourMoveTo(-1);
    return true;
}

function geneoTourResume({ index, history, origin, token })
{
    if (geneoTourRuntime.active || geneoTourRuntime.token !== token
        || modalBackdrop.classList.contains('open') || !validProjectById(GENEO_TOUR_PROJECT_ID)) return false;
    geneoTourRuntime.origin = origin;
    geneoTourRuntime.returnFocus = document.querySelector('[data-topbar-help]');
    geneoTourRuntime.history = [...history];
    geneoTourRuntime.index = -1;
    geneoTourRuntime.active = true;
    document.addEventListener('keydown', geneoTourOnKeydown, true);
    closeMenu();
    closeTopbarPopover();
    geneoTourMoveTo(index);
    return true;
}

function geneoTourPrepare(index)
{
    const step = geneoTourSteps[index];
    if (step.module === 'Notes' && !geneoTourRuntime.notesOrigin)
    {
        geneoTourRuntime.notesOrigin = Object.fromEntries([
            ...Object.keys(state).filter(key => key.startsWith('notes')),
            'selectedNoteId'
        ].map(key => [key, structuredClone(state[key])]));
        geneoTourRuntime.notesOriginScroll = Object.fromEntries(
            ['.main', '.notes-browser-pane', '.notes-browser-scroll', '.notes-right-pane'].map(selector =>
                [selector, document.querySelector(selector)?.scrollTop || 0]));
        geneoTourRuntime.notesOriginScroll.page = document.scrollingElement?.scrollTop || 0;
    }
    if (step.module === 'People' && !geneoTourRuntime.peopleOrigin)
    {
        geneoTourRuntime.peopleOrigin = Object.fromEntries([
            'peopleFilters', 'peopleSavedViewId', 'peopleSavedView', 'peopleSearch',
            'selectedPeopleId', 'selectedPersonId', 'peopleSelectedIds', 'peopleSelectionAnchorId',
            'peoplePage', 'peoplePaginationQueryKey', 'peopleView', 'peopleSide',
            'peoplePreviewCollapsed', 'peopleProfileEditing', 'peopleProfileEditTab'
        ].map(key => [key, structuredClone(state[key])]));
    }
    if (step.module === 'Projects' && step.projectView === 'library')
    {
        state.activeModule = 'Projects';
        state.projectOpen = false;
        state.search = '';
        render();
        return;
    }

    if (step.module === 'Family Tree' && state.activeModule === 'Family Tree' && currentProjectId() === GENEO_TOUR_PROJECT_ID)
    {
        captureTreeCanvasScroll(GENEO_TOUR_PROJECT_ID);
    }
    if (step.module === 'Albums' && !geneoTourRuntime.albumsOrigin)
    {
        geneoTourRuntime.albumsOrigin = Object.fromEntries([
            'albumsView', 'activeAlbumId', 'albumsSearch', 'albumsFilters',
            'albumsViewMode', 'selectedPhotoId', 'selectedPhotoIds',
            'albumsDetailCollapsed', 'albumsDetailSections'
        ].map(key => [key, structuredClone(state[key])]));
    }
    activateProject(GENEO_TOUR_PROJECT_ID, { moduleName: step.module, renderNow: false });
    if (step.module === 'Archive' && !geneoTourRuntime.archiveOrigin)
    {
        geneoTourRuntime.archiveOrigin = Object.fromEntries(Object.keys(state)
            .filter(key => key.startsWith('archive'))
            .map(key => [key, structuredClone(state[key])]));
        geneoTourRuntime.archiveOriginScroll = Object.fromEntries(
            ['.archive-sidebar', '.archive-inspector-scroll'].map(selector =>
                [selector, document.querySelector(selector)?.scrollTop || 0]));
    }
    if (step.module === 'Family Tree')
    {
        treeProjectViewState(GENEO_TOUR_PROJECT_ID).focusPersonId = 'silver';
        state.selectedPersonId = 'silver';
        state.treeInspectorCollapsed = false;
        if (['tree-sections-overview', 'tree-timeline', 'tree-relationships',
            'tree-relationship-actions'].includes(step.id))
        {
            ['insights', 'timeline', 'relationships', 'photos', 'archive', 'notes', 'sources', 'record']
                .forEach(section => { state.inspectorSections[section] = step.id === 'tree-timeline'
                    ? section === 'timeline' : ['tree-relationships', 'tree-relationship-actions'].includes(step.id)
                        && section === 'relationships'; });
        }
    }
    if (step.module === 'People')
    {
        const profile = ['people-profile-welcome', 'people-profile-hero', 'people-profile-card',
            'people-connected', 'people-to-geneograph'].includes(step.id);
        state.peopleView = profile ? 'profile' : 'directory';
        state.peopleSide = profile ? 'profile' : 'people';
        state.selectedPeopleId = 'silver';
        state.selectedPersonId = 'silver';
        state.peopleSelectedIds = [];
        state.peopleSelectionAnchorId = '';
        state.peoplePage = 1;
        state.peoplePaginationQueryKey = '';
        state.peopleSavedView = 'All people';
        state.peopleSearch = '';
        state.peoplePreviewCollapsed = false;
        state.peopleProfileEditing = false;
        state.peopleFilters = step.id === 'people-save-filter' || step.id === 'people-saved-filters'
            ? peopleFiltersWithDefaults({ surnames: ['Whiskerfield'] })
            : peopleFiltersWithDefaults({});
        state.peopleSavedViewId = null;
    }
    if (step.module === 'Albums')
    {
        state.albumsView = 'album';
        state.activeAlbumId = 'al-family';
        state.albumsSearch = '';
        state.albumsFilters = albumsFiltersWithDefaults({});
        state.albumsViewMode = 'grid';
        state.selectedPhotoId = 'photo-silver-luna-wedding';
        state.selectedPhotoIds = [];
        state.albumsDetailCollapsed = false;
        state.albumsDetailSections.details = true;
        if (['albums-connections', 'albums-tag-person-modal',
            'albums-add-to-album-action', 'albums-add-to-album'].includes(step.id))
        {
            state.albumsDetailSections.people = true;
            state.albumsDetailSections.albums = true;
        }
    }
    if (step.module === 'Archive')
    {
        state.archiveView = 'files';
        state.archiveFileLayout = 'details';
        const fileStop = ['archive-inspector', 'archive-file-actions', 'archive-to-notes'].includes(step.id);
        const folderStop = ['archive-location', 'archive-table', 'archive-filters',
            'archive-folder-actions', 'archive-folder-modal'].includes(step.id);
        state.archiveSelectedFolderId = fileStop ? 'delo44' : folderStop ? 'opis3' : null;
        state.archiveSelectedFolderItemId = ['archive-folder-actions', 'archive-folder-modal'].includes(step.id)
            ? 'delo44' : null;
        state.archiveSelectedFileId = fileStop ? 'af1' : null;
        state.archiveSelectedFileIds = [];
        state.archiveSelectedSourceId = null;
        state.archiveSearch = '';
        state.archiveFileFilters = archiveFileFiltersWithDefaults({});
        state.archiveFilterPresentation = 'folders';
        state.archiveFilterScopeFolderId = null;
        state.archiveExpandedFolders = { ...state.archiveExpandedFolders,
            documents: true, opis3: true };
        state.archiveNavigationBackStack = folderStop || fileStop
            ? [archiveNormalizeLocationSnapshot({ view: 'files', folderId: null })] : [];
        state.archiveNavigationForwardStack = [];
        state.archiveInspectorCollapsed = false;
        state.archiveFileEditing = false;
        state.archiveFileEditDraft = null;
        state.archiveInspectorSections.details = true;
    }
    if (step.module === 'Notes')
    {
        state.notesView = 'all';
        state.notesActiveCollectionId = null;
        state.selectedNoteId = 'note-daisy-parentage';
        state.notesRightCollapsed = false;
        state.notesMobilePane = ['notes-navigation', 'notes-collections', 'notes-list-example', 'notes-filters'].includes(step.id)
            ? 'browser' : 'editor';
        state.notesSearch = '';
        state.notesFilters = notesFiltersWithDefaults({});
        Object.keys(state.notesEditorSections).forEach(key =>
        {
            state.notesEditorSections[key] = step.id === 'notes-editor-overview' && key === 'collections'
                || step.id === 'notes-checklist' && key === 'checklist';
        });
    }
    if (step.module === 'Places')
    {
        if (!geneoTourRuntime.placesOrigin)
        {
            geneoTourRuntime.placesOrigin = Object.fromEntries([
                ...Object.keys(state).filter(key => key.startsWith('places')),
                'selectedPlaceId'
            ].map(key => [key, structuredClone(state[key])]));
            geneoTourRuntime.placesOriginScroll = Object.fromEntries(
                ['.main', '.places-sidebar', '.places-inspector'].map(selector =>
                    [selector, document.querySelector(selector)?.scrollTop || 0]));
        }
        state.placesView = 'all';
        state.placesViewMode = ['places-list', 'places-filters', 'places-save-filter',
            'places-saved-filters'].includes(step.id)
            ? 'list' : 'map';
        state.selectedPlaceId = 'place-meowbridge';
        state.placesInspectorCollapsed = false;
        state.placesFilters = { ...defaultPlaceFilters,
            ...(step.id === 'places-save-filter' ? { mapped: 'mapped' } : {}) };
        state.placesSavedFilterId = '';
    }
    if (step.module === 'Geneograph')
    {
        if (geneoTourLibrarySteps.has(step.id))
        {
            if (state.geneoView === 'board') captureGeneographViewport();
            state.geneoView = 'home';
            state.geneoLibraryView = 'all';
            state.geneoActiveCollectionId = null;
            render();
        }
        else if (state.geneoView !== 'board' || state.selectedGeneoBoardId !== 'gb1'
            || !main.querySelector('.geneo-editor'))
        {
            state.geneoInspectorCollapsed = false;
            openGeneographBoard('gb1');
        }
        else
        {
            const needsRender = state.geneoInspectorCollapsed
                || state.selectedGeneoNodeId || state.selectedGeneoConnectionId;
            state.geneoInspectorCollapsed = false;
            if (state.selectedGeneoNodeId || state.selectedGeneoConnectionId)
                selectGeneographCanvas();
            if (needsRender) renderGeneographEditorPreserveScroll({
                preserveInspectorScroll: true,
                preserveSidebarScroll: true
            });
        }
        const center = geneoCurrentViewportCenter();
        geneoTourApplyTreeReveal(step);
        if (center && document.body.classList.contains('geneo-tour-geneo-focus-canvas'))
            restoreGeneographViewportCenter(center);
        geneoTourApplySockets(step);
        return;
    }
    render();
    geneoTourApplyTreeReveal(step);
    if (step.module === 'Places') window.scrollTo(0, 0);
}

function geneoTourApplySockets(step)
{
    if (!step?.id.startsWith('geneograph-sockets-')) return;
    const stage = main.querySelector('.geneo-canvas-stage');
    if (stage && !stage.classList.contains('show-sockets'))
    {
        stage.classList.add('show-sockets');
        stage.dataset.geneoTourSockets = 'true';
    }
}

function geneoTourClearTreeReveal({ keepSocketViewport = false } = {})
{
    if (geneoTourRuntime.geneoSocketsOrigin && !keepSocketViewport)
    {
        restoreGeneographViewportCenter(geneoTourRuntime.geneoSocketsOrigin);
        geneoTourRuntime.geneoSocketsOrigin = null;
    }
    main.querySelectorAll('.geneo-canvas-stage[data-geneo-tour-sockets]').forEach(stage =>
    {
        stage.classList.remove('show-sockets');
        delete stage.dataset.geneoTourSockets;
    });
    const canvasCenter = document.body.classList.contains('geneo-tour-geneo-focus-canvas')
        ? geneoCurrentViewportCenter() : null;
    document.body.classList.remove('geneo-tour-tree-sidebar', 'geneo-tour-tree-tabs',
        'geneo-tour-people-sidebar', 'geneo-tour-people-preview', 'geneo-tour-people-tabs',
        'geneo-tour-people-popover', 'geneo-tour-geneo-sidebar', 'geneo-tour-geneo-toolbar',
        'geneo-tour-geneo-focus-canvas',
        'geneo-tour-geneo-tabs', 'geneo-tour-albums-sidebar',
        'geneo-tour-albums-inspector', 'geneo-tour-albums-tabs',
        'geneo-tour-albums-popover', 'geneo-tour-archive-sidebar',
        'geneo-tour-archive-inspector', 'geneo-tour-archive-tabs',
        'geneo-tour-notes-sidebar', 'geneo-tour-notes-tabs', 'geneo-tour-notes-popover',
        'geneo-tour-places-sidebar', 'geneo-tour-places-inspector', 'geneo-tour-places-popover',
        'geneo-tour-tree-relationship-actions');
    if (canvasCenter) restoreGeneographViewportCenter(canvasCenter);
}

function geneoTourRestorePeopleState()
{
    if (!geneoTourRuntime.peopleOrigin) return;
    Object.entries(geneoTourRuntime.peopleOrigin).forEach(([key, value]) =>
    {
        state[key] = structuredClone(value);
    });
    geneoTourRuntime.peopleOrigin = null;
}

function geneoTourRestoreAlbumsState()
{
    if (!geneoTourRuntime.albumsOrigin) return;
    Object.entries(geneoTourRuntime.albumsOrigin).forEach(([key, value]) =>
    {
        state[key] = structuredClone(value);
    });
    geneoTourRuntime.albumsOrigin = null;
}

function geneoTourRestoreArchiveState()
{
    if (!geneoTourRuntime.archiveOrigin) return;
    Object.entries(geneoTourRuntime.archiveOrigin).forEach(([key, value]) =>
    {
        state[key] = structuredClone(value);
    });
    geneoTourRuntime.archiveOrigin = null;
    const scroll = geneoTourRuntime.archiveOriginScroll;
    geneoTourRuntime.archiveOriginScroll = null;
    if (state.activeModule === 'Archive')
    {
        renderArchive();
        requestAnimationFrame(() =>
        {
            Object.entries(scroll || {}).forEach(([selector, top]) =>
            {
                document.querySelector(selector)?.scrollTo(0, top);
            });
        });
    }
}

function geneoTourRestoreNotesState({ renderNow = true } = {})
{
    if (!geneoTourRuntime.notesOrigin) return;
    Object.entries(geneoTourRuntime.notesOrigin).forEach(([key, value]) =>
    {
        state[key] = structuredClone(value);
    });
    geneoTourRuntime.notesOrigin = null;
    const scroll = geneoTourRuntime.notesOriginScroll;
    geneoTourRuntime.notesOriginScroll = null;
    if (!renderNow && scroll?.page !== undefined)
        document.scrollingElement?.scrollTo(0, scroll.page);
    if (renderNow && state.activeModule === 'Notes')
    {
        renderNotes();
        requestAnimationFrame(() =>
        {
            Object.entries(scroll || {}).forEach(([selector, top]) =>
            {
                if (selector === 'page') document.scrollingElement?.scrollTo(0, top);
                else document.querySelector(selector)?.scrollTo(0, top);
            });
        });
    }
}

function geneoTourRestorePlacesState({ renderNow = true } = {})
{
    geneoTourRuntime.placesDraftCoordinates = null;
    if (!geneoTourRuntime.placesOrigin) return;
    Object.entries(geneoTourRuntime.placesOrigin).forEach(([key, value]) =>
    {
        state[key] = structuredClone(value);
    });
    geneoTourRuntime.placesOrigin = null;
    const scroll = geneoTourRuntime.placesOriginScroll;
    geneoTourRuntime.placesOriginScroll = null;
    if (renderNow && state.activeModule === 'Places')
    {
        renderPlaces();
        requestAnimationFrame(() =>
        {
            Object.entries(scroll || {}).forEach(([selector, top]) =>
            {
                document.querySelector(selector)?.scrollTo(0, top);
            });
        });
    }
}

function geneoTourApplyTreeReveal(step)
{
    if (step.module === 'Places')
    {
        if (['places-navigation', 'places-countries', 'places-saved-filters'].includes(step.id))
            document.body.classList.add('geneo-tour-places-sidebar');
        if (['places-inspector', 'places-actions'].includes(step.id))
            document.body.classList.add('geneo-tour-places-inspector');
        if (['places-filters', 'places-routes'].includes(step.id))
            document.body.classList.add('geneo-tour-places-popover');
        return;
    }
    if (step.module === 'Notes')
    {
        if (['notes-navigation', 'notes-collections'].includes(step.id))
            document.body.classList.add('geneo-tour-notes-sidebar');
        if (step.id === 'notes-filters')
            document.body.classList.add('geneo-tour-notes-popover');
        if (step.id === 'notes-to-places')
            document.body.classList.add('geneo-tour-notes-tabs');
        return;
    }
    if (step.module === 'Archive')
    {
        if (['archive-navigation', 'archive-folders'].includes(step.id)
            || (step.id === 'archive-folder-actions' && innerWidth > 1100))
            document.body.classList.add('geneo-tour-archive-sidebar');
        if (['archive-folder-actions', 'archive-inspector', 'archive-file-actions'].includes(step.id))
            document.body.classList.add('geneo-tour-archive-inspector');
        if (step.id === 'archive-to-notes') document.body.classList.add('geneo-tour-archive-tabs');
        return;
    }
    if (step.module === 'Albums')
    {
        if (step.id === 'albums-navigation' || step.id === 'albums-albums')
            document.body.classList.add('geneo-tour-albums-sidebar');
        if (['albums-summary', 'albums-actions', 'albums-connections',
            'albums-add-to-album-action'].includes(step.id))
            document.body.classList.add('geneo-tour-albums-inspector');
        if (step.id === 'albums-filters')
            document.body.classList.add('geneo-tour-albums-popover');
        if (step.id === 'albums-to-archive')
            document.body.classList.add('geneo-tour-albums-tabs');
        return;
    }
    if (step.module === 'People')
    {
        if (['people-navigation', 'people-saved-filters', 'people-to-profile'].includes(step.id))
            document.body.classList.add('geneo-tour-people-sidebar');
        if (step.id === 'people-to-profile') document.body.classList.add('geneo-tour-people-preview');
        if (step.id === 'people-to-geneograph') document.body.classList.add('geneo-tour-people-tabs');
        if (step.id === 'people-columns' || step.id === 'people-filters')
            document.body.classList.add('geneo-tour-people-popover');
        return;
    }
    if (step.module === 'Geneograph')
    {
        if (step.id === 'geneograph-objects' || step.id.startsWith('geneograph-sockets-'))
            document.body.classList.add('geneo-tour-geneo-focus-canvas');
        if (['geneograph-navigation', 'geneograph-collections', 'geneograph-all-boards',
            'geneograph-layers'].includes(step.id))
            document.body.classList.add('geneo-tour-geneo-sidebar');
        if (['geneograph-topbar', 'geneograph-modes', 'geneograph-connect',
            'geneograph-person', 'geneograph-other-objects', 'geneograph-export'].includes(step.id))
            document.body.classList.add('geneo-tour-geneo-toolbar');
        if (step.id === 'geneograph-to-albums') document.body.classList.add('geneo-tour-geneo-tabs');
        return;
    }
    if (step.module !== 'Family Tree') return;
    if (['tree-sidebar', 'tree-sidebar-hero', 'tree-sidebar-actions', 'tree-quick-edit-button',
        'tree-quick-edit-modal', 'tree-add-relative', 'tree-sections-overview', 'tree-timeline',
        'tree-relationships', 'tree-relationship-actions', 'tree-to-people'].includes(step.id))
        document.body.classList.add('geneo-tour-tree-sidebar');
    if (step.id === 'tree-relationship-actions')
        document.body.classList.add('geneo-tour-tree-relationship-actions');
    if (step.id === 'tree-to-people') document.body.classList.add('geneo-tour-tree-tabs');
}

function geneoTourTarget(index)
{
    const id = geneoTourSteps[index]?.id;
    const selectors = {
        'projects-actions': '.button-stack',
        'projects-continue': '.startup-continue',
        'projects-card': '[data-project-id="p1"]',
        'projects-hero': '.project-hero',
        'projects-tags': '.project-hero .stat-chips',
        'projects-back': '#backToProjects',
        'projects-tabs': '.topnav',
        'tree-person-card': '.tree-person-card[data-person-id="silver"]',
        'tree-focus-switch': '[data-tree-card-focus="luna"]',
        'tree-navigation': '[data-tree-person-picker]',
        'tree-sidebar': '.tree-inspector',
        'tree-sidebar-hero': '.tree-inspector .tree-person-hero',
        'tree-sidebar-actions': '.tree-inspector .panel-actions',
        'tree-quick-edit-button': '.tree-inspector #quickEdit',
        'tree-quick-edit-modal': '#modalBackdrop .add-person-modal',
        'tree-add-relative': '#relativePopover',
        'tree-sections-overview': '.tree-inspector .panel-section',
        'tree-timeline': '.tree-inspector [data-toggle-section="timeline"]',
        'tree-relationships': '.tree-inspector [data-toggle-section="relationships"]',
        'tree-relationship-actions': '.tree-inspector #section-relationships [data-relationship-related-person-id="luna"] .relation-actions',
        'tree-to-people': '.topnav [data-module="People"]',
        'people-navigation': '.side-nav [data-people-side="people"]',
        'people-table': '.people-table-wrap',
        'people-columns': '#peopleColumnsPopover',
        'people-filters': '#peopleFilterPopover',
        'people-save-filter': '#peopleSaveView',
        'people-saved-filters': '.people-saved-filter-row',
        'people-to-profile': '.side-nav [data-open-profile]',
        'people-profile-hero': '.profile-hero',
        'people-profile-card': '[data-profile-card-root]',
        'people-connected': '.profile-resource-card--photos',
        'people-to-geneograph': '.topnav [data-module="Geneograph"]',
        'albums-photos': '.albums-justified-grid .albums-justified-row',
        'albums-navigation': '[data-albums-tour-target="navigation"]',
        'albums-albums': '[data-albums-tour-target="albums"]',
        'albums-filters': '#albumsFilterPopover',
        'albums-summary': '.albums-detail-toolbar',
        'albums-actions': '#albumsEditPhoto',
        'albums-connections': '[data-albums-section-toggle="people"]',
        'albums-tag-person-modal': '#modalBackdrop .photo-people-modal',
        'albums-add-to-album-action': '#albumsLinkAlbum',
        'albums-add-to-album': '#modalBackdrop .album-picker-modal',
        'albums-to-archive': '.topnav [data-module="Archive"]',
        'archive-navigation': '.archive-sidebar-section',
        'archive-folders': '.archive-sidebar-tree-section',
        'archive-location': '.archive-location-row',
        'archive-table': '.archive-table-wrap',
        'archive-filters': '#archiveFilterPopover',
        'archive-folder-actions': '.archive-sidebar [data-archive-create-folder]',
        'archive-folder-modal': '#modalBackdrop .archive-create-folder-modal',
        'archive-inspector': '.archive-file-preview',
        'archive-file-actions': '#archiveEditFile',
        'archive-to-notes': '.topnav [data-module="Notes"]',
        'notes-navigation': '[data-notes-tour-target="navigation"]',
        'notes-collections': '[data-notes-tour-target="collections"]',
        'notes-list-example': '[data-note-id="note-daisy-parentage"]',
        'notes-filters': '#projectMenu.notes-filter-popover',
        'notes-editor-overview': '.notes-editor-header',
        'notes-rich-text': '.notes-rich-editor-shell',
        'notes-sections': '.notes-editor-sections',
        'notes-checklist': '[data-note-editor-section="checklist"]',
        'notes-add-actions': '[data-note-editor-section="events"] [data-note-manage-links="event"]',
        'notes-add-events': '#modalBackdrop [aria-labelledby="notesEventsTitle"]',
        'notes-to-places': '.topnav [data-module="Places"]',
        'places-navigation': '.places-nav',
        'places-countries': '.places-country-tree',
        'places-list': '.places-list-panel',
        'places-filters': '#placesFilterPopover',
        'places-save-filter': '#placesSaveFilter',
        'places-saved-filters': '.places-saved-filter-list',
        'places-add-button': '#placesAddPlace',
        'places-add-modal': '#modalBackdrop .place-editor-modal',
        'places-add-coordinates': '#modalBackdrop [data-place-choose-map]',
        'places-add-map': '.places-leaflet-marker-icon.draft',
        'places-add-create': '#modalBackdrop [data-place-editor] [type="submit"]',
        'places-routes': '#projectMenu.places-route-popover',
        'places-inspector': '[data-places-inspector]',
        'places-actions': '[data-places-inspector-edit="place-meowbridge"]',
        'places-outro': '#topbarPopover [data-help-tour]',
        'places-map': '.places-map-panel',
        'geneograph-navigation': '[data-geneo-tour-target="library-navigation"]',
        'geneograph-collections': '[data-geneo-tour-target="library-collections"]',
        'geneograph-create-actions': '.geneo-home-page .archive-page-actions',
        'geneograph-create-modal': '#modalBackdrop .geneo-board-create-modal',
        'geneograph-card': '[data-geneo-board-id="gb1"]',
        'geneograph-all-boards': '[data-geneo-all-boards]',
        'geneograph-current-board': '.geneo-inspector:not(.collapsed) .geneo-inspector-header',
        'geneograph-layers': '.geneo-board-panel .geneo-layers',
        'geneograph-objects': geneoTourNodeSelector(geneoTourSeedTargets.panel),
        'geneograph-topbar': '.geneo-editor-toolbar',
        'geneograph-modes': '.geneo-editor-toolbar .geneo-tool-group',
        'geneograph-connect': '[data-geneo-toolbar-item="connect"]',
        'geneograph-person': '[data-geneo-toolbar-item="person"]',
        'geneograph-other-objects': '[data-geneo-toolbar-item="place"]',
        'geneograph-sockets-intro': geneoTourNodeSelector(geneoTourSeedTargets.silver),
        'geneograph-sockets-partners': geneoTourSocketSelector(geneoTourSeedTargets.silver, 'left'),
        'geneograph-sockets-children': geneoTourSocketSelector(geneoTourSeedTargets.silver, 'top'),
        'geneograph-sockets-context': geneoTourNodeSelector(geneoTourSeedTargets.image),
        'geneograph-inspector': '.geneo-inspector:not(.collapsed)',
        'geneograph-export': '#projectMenu.geneo-export-menu',
        'geneograph-to-albums': '.topnav [data-module="Albums"]'
    };
    const mobileGeneographTarget = innerWidth <= 900 && {
        'geneograph-person': '#projectMenu.geneo-toolbar-overflow-menu [data-geneo-toolbar-action="person"]',
        'geneograph-other-objects': '#projectMenu.geneo-toolbar-overflow-menu [data-geneo-toolbar-action="place"]',
        'geneograph-inspector': '[data-mobile-details]'
    }[id];
    const mobileArchiveTarget = innerWidth <= 900 && {
        'archive-location': '.archive-mobile-location',
        'archive-table': '.archive-mobile-items'
    }[id];
    const target = id === 'archive-folder-actions' && innerWidth <= 1100
        ? document.querySelector(geneoTourTertiarySelectors[id])
        : document.querySelector(mobileGeneographTarget || mobileArchiveTarget || selectors[id]);
    if (id === 'places-add-map' && (!window.L || !placesMapRuntime.map))
        return document.querySelector('[data-places-map-status]:not([hidden])');
    if (id === 'people-saved-filters') return target?.parentElement?.parentElement || null;
    if (['places-navigation', 'places-countries', 'places-saved-filters'].includes(id))
        return target?.closest('.places-sidebar-section') || target;
    if (id === 'places-map' && (!window.L || !target || !target.getBoundingClientRect().width
        || document.querySelector('[data-places-map-status]:not([hidden])')))
        return document.querySelector('[data-places-inspector] .places-inspector-summary');
    if (target?.getBoundingClientRect().width) return target;
    if (id === 'people-table') return document.querySelector('[data-person-sidebar-context="people"]');
    return target;
}

function geneoTourFirstVisible(...selectors)
{
    return selectors.map(selector => main.querySelector(selector))
        .find(element => element?.getBoundingClientRect().width > 0) || null;
}

function geneoTourWaitForTarget(index, token)
{
    return new Promise(resolve =>
    {
        let observer = null;
        let timer = null;
        const check = () =>
        {
            if (token !== geneoTourRuntime.token || !geneoTourRuntime.active) return finish(null);
            const target = geneoTourTarget(index);
            if (target?.isConnected && target.getBoundingClientRect().width > 0) finish(target);
        };
        const finish = target =>
        {
            observer?.disconnect();
            clearTimeout(timer);
            resolve(target);
        };
        observer = new MutationObserver(check);
        observer.observe(document.body, { childList: true, subtree: true });
        timer = setTimeout(() => finish(null), 2500);
        check();
    });
}

function geneoTourDestroyOverlay({ keepInert = false } = {})
{
    geneoTourRuntime.observer?.disconnect();
    geneoTourRuntime.resizeObserver?.disconnect();
    geneoTourRuntime.observer = null;
    geneoTourRuntime.resizeObserver = null;
    cancelAnimationFrame(geneoTourRuntime.positionFrame);
    geneoTourRuntime.positionFrame = 0;
    geneoTourRuntime.root?.remove();
    geneoTourRuntime.root = null;
    geneoTourRuntime.secondaryTarget = null;
    geneoTourRuntime.tertiaryTarget = null;
    geneoTourRuntime.quaternaryTarget = null;
    if (!keepInert)
    {
        document.querySelector('.app').inert = false;
        modalBackdrop.inert = false;
    }
    document.removeEventListener('scroll', geneoTourQueuePosition, true);
    window.removeEventListener('resize', geneoTourOnResize);
}

function geneoTourClosePreview()
{
    if (geneoTourRuntime.ownedPreview === 'relative')
        closeMenu();
    if (geneoTourRuntime.ownedPreview === 'places-map-selection')
    {
        cancelPlacesMapEditing({ reopenEditor: false });
        resetPlaceEditorDraft();
    }
    if (geneoTourRuntime.ownedPreview === 'modal' && modalBackdrop.classList.contains('open'))
        closeModal({ force: true });
    if (geneoTourRuntime.ownedPreview === 'people-columns') closePeopleColumnsPopover();
    if (geneoTourRuntime.ownedPreview === 'people-filters') closePeopleFilterPopover();
    if (geneoTourRuntime.ownedPreview === 'albums-filters') closeAlbumsFilterPopover();
    if (geneoTourRuntime.ownedPreview === 'archive-filters') closeArchiveFilterPopover();
    if (geneoTourRuntime.ownedPreview === 'notes-filters') closeMenu();
    if (['geneograph-export', 'geneograph-toolbar-overflow'].includes(geneoTourRuntime.ownedPreview)) closeMenu();
    if (geneoTourRuntime.ownedPreview === 'places-filters') closePlacesFilterPopover();
    if (geneoTourRuntime.ownedPreview === 'places-routes') closeMenu();
    if (geneoTourRuntime.ownedPreview === 'places-help') closeTopbarPopover();
    if (geneoTourRuntime.albumsModalSelection)
    {
        state.selectedPhotoIds = geneoTourRuntime.albumsModalSelection;
        geneoTourRuntime.albumsModalSelection = null;
    }
    geneoTourRuntime.ownedPreview = null;
}

function geneoTourExamplePlaceCoordinates()
{
    if (geneoTourRuntime.placesDraftCoordinates)
        return { ...geneoTourRuntime.placesDraftCoordinates };
    const coordinates = getPlace('place-meowbridge')?.coordinates;
    return coordinates ? { lat: coordinates.lat + .015, lng: coordinates.lng + .015 } : null;
}

function geneoTourOpenPreview(step)
{
    if (innerWidth <= 900 && ['geneograph-person', 'geneograph-other-objects'].includes(step.id))
    {
        const anchor = main.querySelector('[data-geneo-toolbar-overflow]');
        if (!anchor) return;
        openGeneoToolbarOverflowMenu(anchor);
        const menu = document.querySelector('#projectMenu.geneo-toolbar-overflow-menu');
        if (menu)
        {
            menuLifecycleController?.abort();
            menu.inert = true;
            geneoTourRuntime.ownedPreview = 'geneograph-toolbar-overflow';
        }
    }
    if (step.id === 'geneograph-export')
    {
        const anchor = main.querySelector('[data-geneo-export]');
        if (!anchor) return;
        openGeneographExportMenu(anchor);
        const menu = document.querySelector('#projectMenu.geneo-export-menu');
        if (menu)
        {
            menuLifecycleController?.abort();
            menu.inert = true;
            geneoTourRuntime.ownedPreview = 'geneograph-export';
        }
    }
    if (step.id === 'archive-filters')
    {
        const anchor = document.getElementById('archiveFilterButton');
        if (!anchor) return;
        openArchiveFilterPopover(anchor);
        const popover = document.getElementById('archiveFilterPopover');
        if (popover)
        {
            popover.inert = true;
            geneoTourRuntime.ownedPreview = 'archive-filters';
        }
    }
    if (step.id === 'places-filters')
    {
        const anchor = document.getElementById('placesFilterButton');
        if (!anchor) return;
        openPlacesFilterPopover(anchor);
        const popover = document.getElementById('placesFilterPopover');
        if (popover)
        {
            popover.inert = true;
            if (innerWidth <= 640)
            {
                popover.style.maxHeight = 'min(38vh, 240px)';
                const rect = anchor.getBoundingClientRect();
                const below = rect.bottom + 8;
                popover.style.top = `${below + popover.offsetHeight <= innerHeight - 12
                    ? below : Math.max(64, rect.top - 8 - popover.offsetHeight)}px`;
            }
            document.removeEventListener('click', closePlacesFilterOnOutside);
            geneoTourRuntime.ownedPreview = 'places-filters';
        }
    }
    if (step.id === 'places-routes')
    {
        const anchor = document.getElementById('placesRouteMenu');
        if (!anchor) return;
        openPlacesRouteMenu(anchor);
        const popover = document.querySelector('#projectMenu.places-route-popover');
        if (popover)
        {
            popover.inert = true;
            menuLifecycleController?.abort();
            geneoTourRuntime.ownedPreview = 'places-routes';
        }
    }
    if (['places-add-modal', 'places-add-coordinates', 'places-add-create'].includes(step.id))
    {
        geneoTourRuntime.openingPreview = true;
        try
        {
            if (step.id === 'places-add-create')
                openPlaceModal(null, { initialCoordinates: window.L && placesMapRuntime.map
                    ? geneoTourExamplePlaceCoordinates() : null });
            else openPlaceModal(null);
            if (modalBackdrop.classList.contains('open'))
            {
                if (step.id === 'places-add-coordinates'
                    || step.id === 'places-add-create' && window.L && placesMapRuntime.map)
                    modalBackdrop.querySelector('[data-place-coordinate-details]').open = true;
                if (step.id === 'places-add-coordinates')
                {
                    const body = modalBackdrop.querySelector('.place-editor-body');
                    const details = modalBackdrop.querySelector('[data-place-coordinate-details]');
                    body.scrollTop += Math.max(0,
                        details.getBoundingClientRect().bottom - body.getBoundingClientRect().bottom + 8);
                }
                modalBackdrop.inert = true;
                geneoTourRuntime.ownedPreview = 'modal';
            }
        }
        finally
        {
            geneoTourRuntime.openingPreview = false;
        }
    }
    if (step.id === 'places-add-map' && window.L && placesMapRuntime.map)
    {
        geneoTourRuntime.openingPreview = true;
        try
        {
            geneoTourRuntime.placesDraftCoordinates = null;
            openPlaceModal();
            startPlaceEditorMapSelection();
            geneoTourRuntime.ownedPreview = 'places-map-selection';
            requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(() =>
            {
                const map = placesMapRuntime.map;
                if (geneoTourRuntime.ownedPreview !== 'places-map-selection' || !map) return;
                const mapRect = map.getContainer().getBoundingClientRect();
                const barTop = main.querySelector('[data-places-coordinate-bar]')?.getBoundingClientRect().top;
                const markerY = Math.max(40, Math.min(mapRect.height * .58,
                    (barTop || mapRect.bottom) - mapRect.top - 32));
                handlePlacesMapClick({ latlng: map.containerPointToLatLng([
                    mapRect.width * .55, markerY
                ]) });
                const pending = placesMapRuntime.pendingLatLng;
                if (pending)
                    geneoTourRuntime.placesDraftCoordinates = { lat: pending.lat, lng: pending.lng };
            })));
        }
        finally
        {
            geneoTourRuntime.openingPreview = false;
        }
    }
    if (step.id === 'places-outro')
    {
        const anchor = document.querySelector('[data-topbar-help]');
        if (!anchor) return;
        openTopbarPopover('help', anchor);
        const popover = document.getElementById('topbarPopover');
        if (popover)
        {
            popover.inert = true;
            document.removeEventListener('click', closeTopbarPopoverOnOutside);
            geneoTourRuntime.ownedPreview = 'places-help';
        }
    }
    if (step.id === 'notes-filters')
    {
        const anchor = document.getElementById('notesFilterButton');
        if (!anchor) return;
        openNotesFilterMenu(anchor);
        const popover = document.querySelector('#projectMenu.notes-filter-popover');
        if (popover)
        {
            popover.inert = true;
            menuLifecycleController?.abort();
            geneoTourRuntime.ownedPreview = 'notes-filters';
        }
    }
    if (step.id === 'notes-add-events')
    {
        geneoTourRuntime.openingPreview = true;
        try
        {
            openNotesEventsModal();
            if (modalBackdrop.classList.contains('open'))
            {
                modalBackdrop.inert = true;
                geneoTourRuntime.ownedPreview = 'modal';
            }
        }
        finally
        {
            geneoTourRuntime.openingPreview = false;
        }
    }
    if (step.id === 'archive-folder-modal')
    {
        geneoTourRuntime.openingPreview = true;
        try
        {
            openArchiveCreateFolderModal('delo44');
            if (modalBackdrop.classList.contains('open'))
            {
                modalBackdrop.inert = true;
                geneoTourRuntime.ownedPreview = 'modal';
            }
        }
        finally
        {
            geneoTourRuntime.openingPreview = false;
        }
    }
    if (step.id === 'albums-filters')
    {
        const anchor = document.getElementById('albumsFilterButton');
        if (!anchor) return;
        openAlbumsFilterPopover(anchor);
        const popover = document.getElementById('albumsFilterPopover');
        if (popover)
        {
            popover.inert = true;
            geneoTourRuntime.ownedPreview = 'albums-filters';
        }
    }
    if (step.id === 'albums-tag-person-modal')
    {
        geneoTourRuntime.openingPreview = true;
        try
        {
            openPhotoPeopleModal('photo-silver-luna-wedding');
            if (modalBackdrop.classList.contains('open'))
            {
                modalBackdrop.inert = true;
                geneoTourRuntime.ownedPreview = 'modal';
            }
        }
        finally
        {
            geneoTourRuntime.openingPreview = false;
        }
    }
    if (step.id === 'albums-add-to-album')
    {
        geneoTourRuntime.openingPreview = true;
        geneoTourRuntime.albumsModalSelection = [...(state.selectedPhotoIds || [])];
        try
        {
            state.selectedPhotoIds = ['photo-silver-luna-wedding'];
            openAddToAlbumModal();
            if (modalBackdrop.classList.contains('open'))
            {
                modalBackdrop.inert = true;
                geneoTourRuntime.ownedPreview = 'modal';
            }
        }
        finally
        {
            geneoTourRuntime.openingPreview = false;
            if (geneoTourRuntime.ownedPreview !== 'modal')
            {
                state.selectedPhotoIds = geneoTourRuntime.albumsModalSelection;
                geneoTourRuntime.albumsModalSelection = null;
            }
        }
    }
    if (step.id === 'geneograph-create-modal')
    {
        geneoTourRuntime.openingPreview = true;
        try
        {
            openCreateGeneographBoardModal();
            if (modalBackdrop.classList.contains('open'))
            {
                modalBackdrop.inert = true;
                geneoTourRuntime.ownedPreview = 'modal';
            }
        }
        finally
        {
            geneoTourRuntime.openingPreview = false;
        }
    }
    if (step.id === 'people-columns' || step.id === 'people-filters')
    {
        const columns = step.id === 'people-columns';
        const anchor = document.getElementById(columns ? 'peopleColumnsButton' : 'peopleFilterButton');
        if (!anchor) return;
        if (columns) openPeopleColumnsPopover(anchor);
        else openPeopleFilterPopover(anchor);
        const popover = document.getElementById(columns ? 'peopleColumnsPopover' : 'peopleFilterPopover');
        if (popover)
        {
            popover.inert = true;
            geneoTourRuntime.ownedPreview = columns ? 'people-columns' : 'people-filters';
        }
    }
    if (step.id === 'tree-add-relative')
    {
        const anchor = document.querySelector('#addRelative');
        if (!anchor) return;
        openRelativePopover(anchor, 'silver');
        const popover = document.querySelector('#relativePopover');
        if (popover)
        {
            popover.inert = true;
            menuLifecycleController?.abort();
            geneoTourRuntime.ownedPreview = 'relative';
        }
    }
    if (step.id === 'tree-quick-edit-modal')
    {
        geneoTourRuntime.openingPreview = true;
        try
        {
            openEditPersonModal('silver');
            if (modalBackdrop.classList.contains('open'))
            {
                modalBackdrop.inert = true;
                geneoTourRuntime.ownedPreview = 'modal';
            }
        }
        finally
        {
            geneoTourRuntime.openingPreview = false;
        }
    }
}

function geneoTourClose({ completed = false, offerRestore = true } = {})
{
    if (!geneoTourRuntime.active) return;
    const index = geneoTourRuntime.index;
    const origin = geneoTourRuntime.origin;
    const history = [...geneoTourRuntime.history];
    geneoTourRuntime.active = false;
    geneoTourRuntime.token += 1;
    geneoTourRuntime.transitioning = false;
    geneoTourClosePreview();
    geneoTourRuntime.placesDraftCoordinates = null;
    geneoTourRestorePeopleState();
    geneoTourRestoreAlbumsState();
    geneoTourRestoreArchiveState();
    geneoTourRestoreNotesState();
    geneoTourRestorePlacesState();
    geneoTourDestroyOverlay();
    geneoTourClearTreeReveal();
    if (state.activeModule === 'People') renderPeople();
    if (state.activeModule === 'Albums') renderAlbums();
    document.removeEventListener('keydown', geneoTourOnKeydown, true);
    geneoTourWriteStatus(completed ? 'completed' : 'skipped');
    const focusTarget = geneoTourRuntime.returnFocus?.isConnected
        ? geneoTourRuntime.returnFocus : document.querySelector('[data-topbar-help]');
    focusTarget?.focus({ preventScroll: true });
    if (!completed && offerRestore && index < 0 && origin)
        geneoTourRestoreOrigin(origin);
    else if (!completed && offerRestore && index >= 0 && origin)
    {
        const token = geneoTourRuntime.token;
        showActionToast({
            message: t('Tour closed.'),
            actions: [{ label: t('Resume tour'),
                onClick: () => geneoTourResume({ index, history, origin, token }) }],
            duration: 9000
        });
    }
}

function geneoTourOnKeydown(event)
{
    if (!geneoTourRuntime.active) return;
    if (event.key === 'Escape')
    {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (geneoTourRuntime.root?.classList.contains('is-module-map')) geneoTourCloseModuleMap();
        else geneoTourClose();
        return;
    }
    if (!geneoTourRuntime.root) return;
    if (event.key === 'Tab')
    {
        const controls = [...geneoTourRuntime.root.querySelectorAll('button:not([disabled])')]
            .filter(control => control.getClientRects().length);
        const first = controls[0];
        const last = controls.at(-1);
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
    event.stopPropagation();
}

function geneoTourCardCopy()
{
    const index = geneoTourRuntime.index;
    const step = geneoTourSteps[index];
    const copyId = index < 0 ? 'welcome' : index >= geneoTourSteps.length ? 'finish' : step.id;
    const russian = state.language === 'ru' ? RU_TOUR_CARD_COPY[copyId] : null;
    const title = russian?.title || (index < 0 ? 'Explore a family story'
        : index >= geneoTourSteps.length ? 'Explore on your own' : step.title);
    let body = russian?.body || (index < 0
        ? 'Follow a sample family through eight connected modules. You can skip to any module by clicking on the module name at the top of the tour card.'
        : index >= geneoTourSteps.length
            ? 'The tour is complete. Now explore the demo at your own pace and try the features you’ve just seen.'
            : step.body);
    if (step?.id === 'places-add-map' && (!window.L || !placesMapRuntime.map))
        body = t('Map placement is unavailable here. When the map loads, click to position a draft marker, then choose Use position to return its coordinates to the place window.');
    if (step?.id === 'places-add-create' && (!window.L || !placesMapRuntime.map))
        body = t('After choosing a map position, this window reopens with coordinates. Create place saves the new record. Map placement was unavailable here, so the tour will not create one.');
    return { title, body };
}

function geneoTourOpenModuleMap()
{
    const root = geneoTourRuntime.root;
    if (!root || geneoTourRuntime.transitioning) return;
    root.classList.add('is-module-map', 'is-unanchored');
    root.querySelector('[data-geneo-tour-step-view]').hidden = true;
    root.querySelector('[data-geneo-tour-map-view]').hidden = false;
    root.querySelector('.geneo-tour-card').setAttribute('aria-labelledby', 'geneoTourMapTitle');
    root.querySelector('.geneo-tour-card').removeAttribute('aria-describedby');
    geneoTourPosition();
    const current = root.querySelector('[data-geneo-tour-module].is-current');
    const list = root.querySelector('.geneo-tour-map-list');
    if (current)
    {
        list.scrollTop = current.offsetTop - list.offsetTop - (list.clientHeight - current.offsetHeight) / 2;
        current.focus({ preventScroll: true });
    }
}

function geneoTourCloseModuleMap()
{
    const root = geneoTourRuntime.root;
    if (!root) return;
    root.classList.remove('is-module-map', 'is-unanchored');
    root.querySelector('[data-geneo-tour-step-view]').hidden = false;
    root.querySelector('[data-geneo-tour-map-view]').hidden = true;
    root.querySelector('.geneo-tour-card').setAttribute('aria-labelledby', 'geneoTourTitle');
    root.querySelector('.geneo-tour-card').setAttribute('aria-describedby', 'geneoTourBody');
    geneoTourPosition();
    root.querySelector('[data-geneo-tour-action="browse-modules"]')?.focus({ preventScroll: true });
}

function geneoTourRefreshCopy()
{
    const root = geneoTourRuntime.root;
    if (!root) return;
    const { title, body } = geneoTourCardCopy();
    root.querySelector('[data-geneo-tour-title]').textContent = title;
    root.querySelector('[data-geneo-tour-body]').textContent = body;
    const moduleName = root.querySelector('[data-geneo-tour-module-name]');
    if (moduleName)
    {
        const currentModule = geneoTourSteps[geneoTourRuntime.index].module;
        moduleName.textContent = t(currentModule);
        const browse = root.querySelector('[data-geneo-tour-action="browse-modules"]');
        browse.setAttribute('aria-label', `${t('Browse modules')}: ${t(currentModule)}`);
        browse.title = t('Browse modules');
        root.querySelector('[data-geneo-tour-map-title]').textContent = t('Browse modules');
        root.querySelector('[data-geneo-tour-map-return]').textContent = t('Return to tour');
        root.querySelectorAll('[data-geneo-tour-module]').forEach(button =>
        {
            const isCurrent = button.dataset.geneoTourModule === currentModule;
            button.querySelector('.geneo-tour-map-name').textContent = t(button.dataset.geneoTourModule);
            button.classList.toggle('is-current', isCurrent);
            if (isCurrent) button.setAttribute('aria-current', 'step');
            else button.removeAttribute('aria-current');
        });
    }
    root.querySelectorAll('[data-geneo-tour-label]').forEach(button =>
    {
        const nextModule = geneoTourSteps[geneoTourRuntime.index + 1]?.module;
        const currentModule = geneoTourSteps[geneoTourRuntime.index]?.module;
        const crossesModule = button.dataset.geneoTourAction === 'next'
            && nextModule && nextModule !== currentModule;
        button.textContent = crossesModule ? t('Next') : t(button.dataset.geneoTourLabel);
        if (crossesModule)
        {
            const destination = t('Continue to {module}').replace('{module}', t(nextModule));
            button.setAttribute('aria-label', destination);
            button.title = destination;
        }
        else if (button.dataset.geneoTourAction === 'next')
        {
            button.removeAttribute('aria-label');
            button.removeAttribute('title');
        }
    });
    root.querySelector('.geneo-tour-close').setAttribute('aria-label', t('Skip tour'));
    geneoTourQueuePosition();
}

function geneoTourRenderOverlay(target = null)
{
    geneoTourDestroyOverlay({ keepInert: true });
    const index = geneoTourRuntime.index;
    const outerScreen = index < 0 || index >= geneoTourSteps.length;
    const projectIntro = geneoTourSteps[index]?.presentation === 'centered';
    const centered = outerScreen || projectIntro;
    const actions = outerScreen
        ? index < 0
            ? [['dismiss', 'Explore on my own'], ['start', 'Start tour']]
            : [['restart', 'Start again'], ['finish', 'Explore the demo']]
        : [['back', 'Back'], ['next', index === geneoTourSteps.length - 1 ? 'Finish tour' : 'Next']];
    const root = document.createElement('div');
    root.className = `geneo-tour${centered ? ' is-centered' : ''}${index < 0 ? ' is-welcome' : ''}${index >= geneoTourSteps.length ? ' is-finish' : ''}${projectIntro ? ' is-project-intro' : ''}${geneoTourSteps[index]?.id === 'places-routes' ? ' is-places-routes' : ''}${geneoTourSteps[index]?.id === 'places-filters' ? ' is-places-filters' : ''}${geneoTourSteps[index]?.id === 'places-add-map' ? ' is-places-add-map' : ''}${geneoTourSteps[index]?.id === 'places-add-modal' ? ' is-places-add-modal' : ''}${['tree-quick-edit-modal', 'geneograph-create-modal', 'albums-tag-person-modal', 'albums-add-to-album', 'archive-folder-modal', 'notes-add-events', 'places-add-modal', 'places-add-coordinates', 'places-add-create'].includes(geneoTourSteps[index]?.id) ? ' is-modal-stop' : ''}`;
    root.dataset.geneoTour = '';
    root.innerHTML = `
        <div class="geneo-tour-scrim" data-geneo-tour-scrim></div>
        <div class="geneo-tour-scrim" data-geneo-tour-scrim></div>
        <div class="geneo-tour-scrim" data-geneo-tour-scrim></div>
        <div class="geneo-tour-scrim" data-geneo-tour-scrim></div>
        <div class="geneo-tour-target-block" data-geneo-tour-block></div>
        <div class="geneo-tour-target-block" data-geneo-tour-block-secondary hidden></div>
        <div class="geneo-tour-target-block" data-geneo-tour-block-tertiary hidden></div>
        <div class="geneo-tour-target-block" data-geneo-tour-block-quaternary hidden></div>
        <section class="geneo-tour-card" role="dialog" aria-modal="true" aria-labelledby="geneoTourTitle" aria-describedby="geneoTourBody">
            <div class="geneo-tour-card-head">
                ${outerScreen ? '' : `<div class="geneo-tour-chapter"><button class="geneo-tour-browse" type="button" data-geneo-tour-action="browse-modules">${icon.grid}<span data-geneo-tour-module-name aria-live="polite"></span></button></div>`}
                ${outerScreen ? '' : '<h2 class="geneo-tour-map-title" id="geneoTourMapTitle" data-geneo-tour-map-title></h2>'}
                <button class="geneo-tour-close" type="button" aria-label="${escapeHtml(t('Skip tour'))}" data-geneo-tour-action="skip">${icon.close}</button>
            </div>
            <div data-geneo-tour-step-view>
                ${index < 0 ? `<div class="geneo-tour-welcome"><span class="geneo-tour-brand">${icon.logo}<strong>GeneoGraph</strong></span><div class="geneo-tour-cover" aria-hidden="true"></div></div>` : ''}
                <h2 id="geneoTourTitle" data-geneo-tour-title></h2>
                <p id="geneoTourBody" data-geneo-tour-body></p>
                <p class="geneo-tour-fallback" data-geneo-tour-fallback hidden>${escapeHtml(t('This part of the sample is unavailable. Continue to the next stop.'))}</p>
                <div class="geneo-tour-actions">${actions.map(([action, label]) => `<button class="button ${action === 'next' || action === 'start' || action === 'finish' ? 'primary' : 'secondary'}" type="button" data-geneo-tour-action="${action}" data-geneo-tour-label="${escapeHtml(label)}"></button>`).join('')}</div>
            </div>
            ${outerScreen ? '' : `<div class="geneo-tour-map" data-geneo-tour-map-view hidden><div class="geneo-tour-map-list">${geneoTourModules.map(module => `<button type="button" data-geneo-tour-module="${escapeHtml(module)}"><span class="geneo-tour-map-icon" aria-hidden="true">${icon[geneoTourModuleIconNames[module]]}</span><span class="geneo-tour-map-name"></span><span class="geneo-tour-map-current" aria-hidden="true">${icon.check}</span></button>`).join('')}</div><button class="geneo-tour-map-return" type="button" data-geneo-tour-action="return-to-tour" data-geneo-tour-map-return></button></div>`}
        </section>`;
    document.body.appendChild(root);
    geneoTourRuntime.root = root;
    root.addEventListener('click', event => event.stopPropagation());
    root.addEventListener('pointerdown', event => event.stopPropagation());
    geneoTourRuntime.target = target;
    const secondarySelector = (geneoTourSteps[index]?.id === 'archive-folder-actions'
        || geneoTourSteps[index]?.id === 'archive-inspector') && innerWidth <= 1100
        ? null : geneoTourSecondarySelectors[geneoTourSteps[index]?.id];
    geneoTourRuntime.secondaryTarget = secondarySelector ? document.querySelector(secondarySelector) : null;
    const tertiarySelector = innerWidth > 1100 || geneoTourSteps[index]?.id === 'people-connected'
        ? geneoTourTertiarySelectors[geneoTourSteps[index]?.id] : null;
    geneoTourRuntime.tertiaryTarget = tertiarySelector ? document.querySelector(tertiarySelector) : null;
    const quaternarySelector = geneoTourQuaternarySelectors[geneoTourSteps[index]?.id];
    geneoTourRuntime.quaternaryTarget = quaternarySelector ? document.querySelector(quaternarySelector) : null;
    document.querySelector('.app').inert = true;
    modalBackdrop.inert = true;
    document.addEventListener('scroll', geneoTourQueuePosition, true);
    window.addEventListener('resize', geneoTourOnResize);
    root.querySelectorAll('[data-geneo-tour-action]').forEach(button => button.addEventListener('click', () =>
    {
        const action = button.dataset.geneoTourAction;
        if (action === 'dismiss' || action === 'skip') geneoTourClose();
        else if (action === 'finish') geneoTourClose({ completed: true, offerRestore: false });
        else if (action === 'restart')
        {
            geneoTourClose({ completed: true, offerRestore: false });
            startGeneoProductTour();
        }
        else if (action === 'start') geneoTourNavigate(0);
        else if (action === 'back') geneoTourNavigate(geneoTourRuntime.history.pop() ?? -1, false);
        else if (action === 'next') geneoTourNavigate(index + 1);
        else if (action === 'browse-modules') geneoTourOpenModuleMap();
        else if (action === 'return-to-tour') geneoTourCloseModuleMap();
    }));
    root.querySelectorAll('[data-geneo-tour-module]').forEach(button => button.addEventListener('click', () =>
    {
        const targetIndex = geneoTourSteps.findIndex(step => step.module === button.dataset.geneoTourModule);
        if (button.dataset.geneoTourModule === geneoTourSteps[index].module) geneoTourCloseModuleMap();
        else if (targetIndex >= 0) geneoTourNavigate(targetIndex);
    }));
    root.querySelector('.geneo-tour-close').hidden = index < 0 || index >= geneoTourSteps.length;
    root.querySelector('[data-geneo-tour-fallback]').hidden = !geneoTourRuntime.fallback || geneoTourRuntime.optionalFallback;
    geneoTourRefreshCopy();
    geneoTourRuntime.observer = new MutationObserver(geneoTourQueuePosition);
    geneoTourRuntime.observer.observe(main, { childList: true, subtree: true });
    geneoTourRuntime.resizeObserver = new ResizeObserver(geneoTourQueuePosition);
    geneoTourRuntime.resizeObserver.observe(root.querySelector('.geneo-tour-card'));
    if (target) geneoTourRuntime.resizeObserver.observe(target);
    if (geneoTourRuntime.secondaryTarget) geneoTourRuntime.resizeObserver.observe(geneoTourRuntime.secondaryTarget);
    if (geneoTourRuntime.tertiaryTarget) geneoTourRuntime.resizeObserver.observe(geneoTourRuntime.tertiaryTarget);
    if (geneoTourRuntime.quaternaryTarget) geneoTourRuntime.resizeObserver.observe(geneoTourRuntime.quaternaryTarget);
    root.querySelector('[data-geneo-tour-action="start"], [data-geneo-tour-action="next"], [data-geneo-tour-action="finish"]')?.focus({ preventScroll: true });
    geneoTourPosition();
    document.fonts.ready.then(geneoTourQueuePosition);
}

function geneoTourQueuePosition()
{
    if (!geneoTourRuntime.root || geneoTourRuntime.positionFrame) return;
    geneoTourRuntime.positionFrame = requestAnimationFrame(() =>
    {
        geneoTourRuntime.positionFrame = 0;
        geneoTourPosition();
    });
}

function geneoTourOnResize()
{
    const stepId = geneoTourSteps[geneoTourRuntime.index]?.id;
    if (!['notes-rich-text', 'notes-sections', 'notes-checklist', 'notes-add-actions'].includes(stepId))
    {
        geneoTourQueuePosition();
        return;
    }
    requestAnimationFrame(() =>
    {
        if (!geneoTourRuntime.active || geneoTourSteps[geneoTourRuntime.index]?.id !== stepId
            || !geneoTourRuntime.target?.isConnected) return;
        if (stepId === 'notes-rich-text')
        {
            main.querySelector('.notes-right-pane')?.scrollTo(0, 0);
            if (innerWidth <= 1100) document.scrollingElement?.scrollTo(0, 0);
        }
        else geneoTourAlignNotesTarget(geneoTourRuntime.target);
        geneoTourQueuePosition();
    });
}

function geneoTourPaintScrims(root, holes)
{
    let regions = [{ left: 0, top: 0, right: innerWidth, bottom: innerHeight }];
    holes.forEach(hole =>
    {
        regions = regions.flatMap(region =>
        {
            const left = Math.max(region.left, hole.left);
            const top = Math.max(region.top, hole.top);
            const right = Math.min(region.right, hole.right);
            const bottom = Math.min(region.bottom, hole.bottom);
            if (right <= left || bottom <= top) return [region];
            return [
                { left: region.left, top: region.top, right: region.right, bottom: top },
                { left: region.left, top: bottom, right: region.right, bottom: region.bottom },
                { left: region.left, top, right: left, bottom },
                { left: right, top, right: region.right, bottom }
            ].filter(part => part.right > part.left && part.bottom > part.top);
        });
    });
    const scrims = [...root.querySelectorAll('[data-geneo-tour-scrim]')];
    while (scrims.length < regions.length)
    {
        const scrim = document.createElement('div');
        scrim.className = 'geneo-tour-scrim';
        scrim.dataset.geneoTourScrim = '';
        root.insertBefore(scrim, root.querySelector('[data-geneo-tour-block]'));
        scrims.push(scrim);
    }
    scrims.forEach((scrim, index) =>
    {
        const region = regions[index];
        scrim.style.cssText = region
            ? `left:${region.left}px;top:${region.top}px;width:${region.right - region.left}px;height:${region.bottom - region.top}px`
            : 'display:none';
    });
}

function geneoTourPosition()
{
    const root = geneoTourRuntime.root;
    if (!root) return;
    const block = root.querySelector('[data-geneo-tour-block]');
    const secondaryBlock = root.querySelector('[data-geneo-tour-block-secondary]');
    const tertiaryBlock = root.querySelector('[data-geneo-tour-block-tertiary]');
    const quaternaryBlock = root.querySelector('[data-geneo-tour-block-quaternary]');
    const card = root.querySelector('.geneo-tour-card');
    if (!root.classList.contains('is-centered') && !geneoTourRuntime.target?.isConnected)
    {
        geneoTourRuntime.target = geneoTourTarget(geneoTourRuntime.index);
        if (geneoTourRuntime.target) geneoTourRuntime.resizeObserver?.observe(geneoTourRuntime.target);
        else if (!geneoTourRuntime.optionalFallback)
        {
            geneoTourRuntime.fallback = true;
            root.querySelector('[data-geneo-tour-fallback]').hidden = false;
            console.warn(`GeneoGraph tour target unavailable after render: ${geneoTourSteps[geneoTourRuntime.index].id}`);
        }
    }
    const target = geneoTourRuntime.target;
    if (geneoTourRuntime.secondaryTarget && !geneoTourRuntime.secondaryTarget.isConnected)
    {
        const selector = geneoTourSecondarySelectors[geneoTourSteps[geneoTourRuntime.index]?.id];
        geneoTourRuntime.secondaryTarget = selector ? document.querySelector(selector) : null;
        if (geneoTourRuntime.secondaryTarget)
            geneoTourRuntime.resizeObserver?.observe(geneoTourRuntime.secondaryTarget);
    }
    if (geneoTourRuntime.tertiaryTarget && !geneoTourRuntime.tertiaryTarget.isConnected)
    {
        const selector = geneoTourTertiarySelectors[geneoTourSteps[geneoTourRuntime.index]?.id];
        geneoTourRuntime.tertiaryTarget = selector ? document.querySelector(selector) : null;
        if (geneoTourRuntime.tertiaryTarget)
            geneoTourRuntime.resizeObserver?.observe(geneoTourRuntime.tertiaryTarget);
    }
    if (geneoTourRuntime.quaternaryTarget && !geneoTourRuntime.quaternaryTarget.isConnected)
    {
        const selector = geneoTourQuaternarySelectors[geneoTourSteps[geneoTourRuntime.index]?.id];
        geneoTourRuntime.quaternaryTarget = selector ? document.querySelector(selector) : null;
        if (geneoTourRuntime.quaternaryTarget)
            geneoTourRuntime.resizeObserver?.observe(geneoTourRuntime.quaternaryTarget);
    }
    const centered = root.classList.contains('is-centered') || root.classList.contains('is-module-map')
        || !target?.isConnected || geneoTourRuntime.fallback;
    if (centered)
    {
        if (!root.classList.contains('is-centered')) root.classList.add('is-unanchored');
        geneoTourPaintScrims(root, []);
        block.hidden = true;
        secondaryBlock.hidden = true;
        tertiaryBlock.hidden = true;
        quaternaryBlock.hidden = true;
        card.style.left = '';
        card.style.top = '';
        return;
    }
    const stepId = geneoTourSteps[geneoTourRuntime.index]?.id;
    if (stepId === 'people-columns' || stepId === 'people-filters')
    {
        const popover = target;
        const anchor = geneoTourRuntime.secondaryTarget;
        if (popover?.isConnected && anchor?.isConnected)
        {
            const anchorRect = anchor.getBoundingClientRect();
            const top = anchorRect.bottom + 8;
            if (innerWidth > 640)
            {
                const width = Math.min(stepId === 'people-columns' ? 360 : 560,
                    innerWidth - card.offsetWidth - 44);
                popover.style.width = `${width}px`;
                popover.style.left = `${Math.max(card.offsetWidth + 24,
                    Math.min(anchorRect.left, innerWidth - width - 12))}px`;
            }
            else
            {
                popover.style.width = '';
                popover.style.left = `${Math.max(12,
                    Math.min(anchorRect.left, innerWidth - popover.offsetWidth - 12))}px`;
            }
            popover.style.top = `${top}px`;
            const space = innerWidth <= 640
                ? innerHeight - card.offsetHeight - top - 24
                : innerHeight - top - 12;
            popover.style.maxHeight = `${Math.max(160, space)}px`;
        }
    }
    if (stepId === 'places-filters' && innerWidth > 640)
    {
        const popover = geneoTourRuntime.target;
        const desiredLeft = card.offsetWidth + 26;
        if (popover?.id === 'placesFilterPopover')
        {
            if (innerWidth <= 1000) popover.style.width = `${innerWidth <= 850 ? 480 : 520}px`;
            if (desiredLeft <= geneoTourRuntime.secondaryTarget?.getBoundingClientRect().right
                && desiredLeft + popover.offsetWidth <= innerWidth - 12)
                popover.style.left = `${Math.max(parseFloat(popover.style.left) || 0, desiredLeft)}px`;
        }
    }
    if (stepId === 'places-routes' && innerWidth > 640)
    {
        const popover = geneoTourRuntime.target;
        const desiredLeft = card.offsetWidth + 26;
        if (popover?.classList.contains('places-route-popover')
            && desiredLeft <= geneoTourRuntime.secondaryTarget?.getBoundingClientRect().right
            && desiredLeft + popover.offsetWidth <= innerWidth - 12)
            popover.style.left = `${Math.max(parseFloat(popover.style.left) || 0, desiredLeft)}px`;
    }
    const rect = geneoTourTargetRect(target);
    const padding = stepId === 'places-add-modal'
        && innerWidth >= 1260 && innerWidth <= 1280
        ? 2 : ['people-columns', 'people-filters', 'albums-filters', 'archive-filters',
        'notes-filters', 'places-filters', 'places-routes', 'places-actions',
        'places-add-coordinates'].includes(stepId) ? 2 : 8;
    const toHole = bounds => ({
        left: Math.max(8, Math.min(innerWidth - 8, bounds.left - padding)),
        top: Math.max(8, Math.min(innerHeight - 8, bounds.top - padding)),
        right: Math.max(9, Math.min(innerWidth - 8, bounds.right + padding)),
        bottom: Math.max(9, Math.min(innerHeight - 8, bounds.bottom + padding))
    });
    const primary = toHole(rect);
    if (stepId === 'archive-inspector' && innerWidth > 1100 && !geneoTourRuntime.secondaryTarget)
    {
        geneoTourRuntime.secondaryTarget = document.querySelector(geneoTourSecondarySelectors[stepId]);
        if (geneoTourRuntime.secondaryTarget)
            geneoTourRuntime.resizeObserver?.observe(geneoTourRuntime.secondaryTarget);
    }
    const secondaryTarget = geneoTourRuntime.secondaryTarget;
    const secondaryRect = secondaryTarget?.isConnected
        ? geneoTourSecondaryRect(secondaryTarget, stepId) : null;
    const compactConnected = geneoTourSteps[geneoTourRuntime.index]?.id === 'people-connected'
        && innerWidth <= 1280;
    const secondary = !compactConnected && !(stepId === 'archive-inspector' && innerWidth <= 1100)
        && !(stepId === 'places-add-coordinates' && innerWidth >= 1260 && innerWidth <= 1280)
        && secondaryRect?.width && secondaryRect.bottom > 0 && secondaryRect.top < innerHeight
        ? toHole(secondaryRect) : null;
    const tertiaryRect = geneoTourRuntime.tertiaryTarget?.isConnected
        ? geneoTourRuntime.tertiaryTarget.getBoundingClientRect() : null;
    let tertiary = !compactConnected && tertiaryRect?.width && tertiaryRect.bottom > 0 && tertiaryRect.top < innerHeight
        ? toHole(tertiaryRect) : null;
    const quaternaryRect = geneoTourRuntime.quaternaryTarget?.isConnected
        ? geneoTourRuntime.quaternaryTarget.getBoundingClientRect() : null;
    let quaternary = !compactConnected && quaternaryRect?.width && quaternaryRect.bottom > 0 && quaternaryRect.top < innerHeight
        ? toHole(quaternaryRect) : null;
    const desktopConnected = stepId === 'people-connected' && innerWidth > 1280;
    const meaningful = hole => hole && hole.right - hole.left >= 80 && hole.bottom - hole.top >= 80;
    if (desktopConnected && (!meaningful(tertiary) || !meaningful(quaternary)))
        tertiary = quaternary = null;
    let holes = [primary, ...(secondary ? [secondary] : []), ...(tertiary ? [tertiary] : []),
        ...(quaternary ? [quaternary] : [])];
    geneoTourPaintScrims(root, holes);
    const { left: x, top: y, right, bottom } = primary;
    block.hidden = false;
    block.style.cssText = `left:${x}px;top:${y}px;width:${right - x}px;height:${bottom - y}px`;
    secondaryBlock.hidden = !secondary;
    if (secondary)
        secondaryBlock.style.cssText = `left:${secondary.left}px;top:${secondary.top}px;width:${secondary.right - secondary.left}px;height:${secondary.bottom - secondary.top}px`;
    tertiaryBlock.hidden = !tertiary;
    if (tertiary)
        tertiaryBlock.style.cssText = `left:${tertiary.left}px;top:${tertiary.top}px;width:${tertiary.right - tertiary.left}px;height:${tertiary.bottom - tertiary.top}px`;
    quaternaryBlock.hidden = !quaternary;
    if (quaternary)
        quaternaryBlock.style.cssText = `left:${quaternary.left}px;top:${quaternary.top}px;width:${quaternary.right - quaternary.left}px;height:${quaternary.bottom - quaternary.top}px`;
    if (innerWidth <= 640)
    {
        const sheetHeight = card.offsetHeight;
        const bottomSheetTop = innerHeight - sheetHeight;
        const topOverlap = Math.max(0, Math.min(bottom, sheetHeight) - y);
        const bottomOverlap = Math.max(0, bottom - Math.max(y, bottomSheetTop));
        if (topOverlap > 0 && bottomOverlap > 0 && !geneoTourRuntime.mobileScrollAdjusted)
        {
            geneoTourRuntime.mobileScrollAdjusted = true;
            const upward = bottom - bottomSheetTop + 8;
            const downward = sheetHeight - y + 8;
            if (rect.top - upward >= 56 && geneoTourScrollTarget(target, upward)) return;
            if (rect.bottom + downward <= innerHeight - 8 && geneoTourScrollTarget(target, -downward)) return;
        }
        root.classList.toggle('is-top-sheet', topOverlap < bottomOverlap);
        if (geneoTourSteps[geneoTourRuntime.index]?.id === 'places-add-coordinates')
            root.classList.add('is-top-sheet');
        if (['notes-editor-overview', 'notes-rich-text', 'notes-sections',
            'notes-checklist', 'notes-add-actions'].includes(geneoTourSteps[geneoTourRuntime.index]?.id))
            root.classList.remove('is-top-sheet');
        card.style.left = '';
        card.style.top = '';
        return;
    }
    root.classList.remove('is-top-sheet');
    const width = card.offsetWidth;
    const height = card.offsetHeight;
    const preferred = [];
    if (desktopConnected && meaningful(primary) && meaningful(secondary))
        preferred.push([Math.max(...holes.map(hole => hole.right)) + 12,
            Math.max(12, Math.min(y, innerHeight - height - 12))]);
    if (['geneograph-sockets-intro', 'geneograph-sockets-children', 'geneograph-sockets-context'].includes(stepId) && innerWidth > 640)
        preferred.push([Math.min(...holes.map(hole => hole.left)) - width - 12,
            Math.max(12, Math.min(y, innerHeight - height - 12))]);
    if (stepId === 'notes-rich-text' && innerWidth > 640 && innerWidth <= 1100)
        preferred.push([right + 12, Math.max(12, Math.min(y, innerHeight - height - 12))]);
    if (stepId === 'notes-add-actions' && innerWidth > 640)
        preferred.push([x - width - 12, Math.max(12, Math.min(y, innerHeight - height - 12))]);
    if (stepId === 'places-filters' && innerWidth > 640)
        preferred.push([x - width - 12, Math.max(12, Math.min(y, innerHeight - height - 12))]);
    if (stepId === 'places-routes' && innerWidth > 640)
        preferred.push([x - width - 12, Math.max(12, Math.min(y, innerHeight - height - 12))]);
    if (stepId === 'places-add-coordinates' && innerWidth > 640)
    {
        preferred.push([Math.max(right, secondary?.right || 0) + 8,
            Math.max(12, Math.min(y, innerHeight - height - 12))]);
        preferred.push([Math.min(x, innerWidth - width - 12), y - height - 8]);
    }
    if (stepId === 'places-add-map' && innerWidth > 640)
        preferred.push([Math.min(x, innerWidth - width - 12), y - height - 8]);
    const candidates = [...preferred,
        [Math.min(x, innerWidth - width - 12), bottom + 12],
        [Math.min(x, innerWidth - width - 12), y - height - 12],
        [right + 12, Math.min(y, innerHeight - height - 12)],
        [x - width - 12, Math.min(y, innerHeight - height - 12)]
    ];
    const fits = areas => ([left, top]) => left >= 12 && top >= 12
        && left + width <= innerWidth - 12 && top + height <= innerHeight - 12
        && !areas.some(hole => left < hole.right && left + width > hole.left
            && top < hole.bottom && top + height > hole.top);
    let position = candidates.find(fits(holes));
    if (!position && desktopConnected && tertiary && meaningful(primary) && meaningful(secondary))
    {
        tertiary = quaternary = null;
        holes = [primary, secondary];
        position = candidates.find(fits(holes));
        if (position)
        {
            geneoTourPaintScrims(root, holes);
            tertiaryBlock.hidden = true;
            quaternaryBlock.hidden = true;
        }
    }
    if (!position)
    {
        if (stepId === 'notes-add-events' && innerWidth > 640)
        {
            const pane = target.querySelector('.notes-event-person-pane')?.getBoundingClientRect();
            const search = target.querySelector('.notes-event-search-field')?.getBoundingClientRect();
            const firstResult = target.querySelector('.notes-event-person-result')?.getBoundingClientRect();
            if (pane && search)
            {
                const partial = {
                    left: primary.left,
                    top: primary.top,
                    right: Math.min(primary.right, pane.right + padding),
                    bottom: Math.min(primary.bottom, pane.bottom + padding,
                        Math.max(search.bottom, firstResult?.bottom || search.bottom) + padding)
                };
                const cardLeft = partial.right + 12;
                const cardTop = Math.max(12, Math.min(partial.top, innerHeight - height - 12));
                if (partial.right - partial.left >= 200 && partial.bottom - partial.top >= 80
                    && cardLeft + width <= innerWidth - 12 && cardTop + height <= innerHeight - 12)
                {
                    geneoTourPaintScrims(root, [partial]);
                    block.style.cssText = `left:${partial.left}px;top:${partial.top}px;width:${partial.right - partial.left}px;height:${partial.bottom - partial.top}px`;
                    root.classList.remove('is-unanchored');
                    card.style.left = `${cardLeft}px`;
                    card.style.top = `${cardTop}px`;
                    return;
                }
            }
        }
        if (stepId === 'archive-inspector' && secondary)
        {
            const left = Math.max(12, Math.min(secondary.left, innerWidth - width - 12));
            const positions = [secondary.bottom + 12, secondary.top - height - 12];
            const top = positions.find(candidate => candidate >= 12 && candidate + height <= innerHeight - 12
                && !holes.some(hole => left < hole.right && left + width > hole.left
                    && candidate < hole.bottom && candidate + height > hole.top));
            if (top !== undefined)
            {
                root.classList.remove('is-unanchored');
                card.style.left = `${left}px`;
                card.style.top = `${top}px`;
                return;
            }
        }
        if (stepId === 'people-profile-card' && innerWidth > 640 && innerWidth <= 1280)
        {
            const cardLeft = innerWidth - width - 12;
            const partial = { ...primary, right: Math.min(primary.right, cardLeft - 12),
                bottom: Math.min(innerHeight - 8, Math.max(primary.bottom, rect.bottom)) };
            if (partial.right - partial.left >= 200 && partial.bottom - partial.top >= 80)
            {
                geneoTourPaintScrims(root, [partial]);
                block.style.cssText = `left:${partial.left}px;top:${partial.top}px;width:${partial.right - partial.left}px;height:${partial.bottom - partial.top}px`;
                root.classList.remove('is-unanchored');
                card.style.left = `${cardLeft}px`;
                card.style.top = `${Math.max(12, Math.min(innerHeight - height - 12, partial.top))}px`;
                return;
            }
        }
        if (['tree-quick-edit-modal', 'geneograph-create-modal', 'albums-tag-person-modal', 'albums-add-to-album', 'archive-folder-modal'].includes(geneoTourSteps[geneoTourRuntime.index]?.id) && innerWidth > 640)
        {
            root.classList.remove('is-unanchored');
            card.style.left = `${innerWidth - width - 12}px`;
            card.style.top = `${Math.max(12, Math.min(innerHeight - height - 12, y + (bottom - y - height) / 2))}px`;
            return;
        }
        root.classList.add('is-unanchored');
        geneoTourPaintScrims(root, []);
        block.hidden = true;
        secondaryBlock.hidden = true;
        tertiaryBlock.hidden = true;
        quaternaryBlock.hidden = true;
        card.style.left = '';
        card.style.top = '';
        return;
    }
    root.classList.remove('is-unanchored');
    card.style.left = `${position[0]}px`;
    card.style.top = `${position[1]}px`;
}

function geneoTourScrollTarget(target, delta, allowPartial = false, instant = false)
{
    for (let parent = target.parentElement; parent; parent = parent.parentElement)
    {
        if (!/(auto|scroll)/.test(getComputedStyle(parent).overflowY)
            || parent.scrollHeight <= parent.clientHeight + 1) continue;
        const before = parent.scrollTop;
        if (instant) parent.scrollTo({ top: before + delta, behavior: 'instant' });
        else parent.scrollTop += delta;
        const moved = Math.abs(parent.scrollTop - before);
        if (instant && moved < 1) continue;
        if (moved < Math.abs(delta) - 2 && !allowPartial)
        {
            if (instant) parent.scrollTo({ top: before, behavior: 'instant' });
            else parent.scrollTop = before;
            continue;
        }
        geneoTourQueuePosition();
        return true;
    }
    const page = document.scrollingElement;
    if (!page || page.scrollHeight <= page.clientHeight + 1) return false;
    const before = page.scrollTop;
    if (instant) page.scrollTo({ top: before + delta, behavior: 'instant' });
    else page.scrollTop += delta;
    const moved = Math.abs(page.scrollTop - before);
    if (instant && moved < 1) return false;
    if (moved < Math.abs(delta) - 2 && !allowPartial)
    {
        if (instant) page.scrollTo({ top: before, behavior: 'instant' });
        else page.scrollTop = before;
        return false;
    }
    geneoTourQueuePosition();
    return true;
}

function geneoTourAlignNotesTarget(target)
{
    const pane = main.querySelector('.notes-right-pane');
    if (!pane || !target) return;
    if (innerWidth > 1100)
    {
        if (document.scrollingElement) document.scrollingElement.scrollTop = 0;
        const header = main.querySelector('.notes-editor-header')?.getBoundingClientRect();
        const boundary = (header?.bottom || pane.getBoundingClientRect().top) + 12;
        pane.scrollTop += target.getBoundingClientRect().top - boundary;
    }
    else
    {
        const boundary = pane.getBoundingClientRect().top + 12;
        pane.scrollTop += target.getBoundingClientRect().top - boundary;
    }
}

function geneoTourTargetRect(target)
{
    const rect = target.getBoundingClientRect();
    const stepId = geneoTourSteps[geneoTourRuntime.index]?.id;
    if (stepId === 'places-add-coordinates')
    {
        const body = modalBackdrop.querySelector('.place-editor-body')?.getBoundingClientRect();
        const details = geneoTourRuntime.secondaryTarget?.getBoundingClientRect();
        if (body)
        {
            const buttonTop = Math.max(rect.top, body.top);
            const buttonBottom = Math.min(rect.bottom, body.bottom);
            if (details && innerWidth >= 1260 && innerWidth <= 1280)
                return { left: Math.min(rect.left, details.left),
                    top: Math.max(body.top, Math.min(buttonTop, details.top)),
                    right: Math.max(rect.right, details.right),
                    bottom: Math.min(body.bottom, Math.max(buttonBottom, details.bottom)) };
            return { left: rect.left, right: rect.right,
                top: buttonTop, bottom: buttonBottom };
        }
    }
    if (stepId === 'places-actions')
    {
        const more = target.closest('.places-inspector-toolbar')
            ?.querySelector('[data-place-menu="place-meowbridge"]')?.getBoundingClientRect();
        if (more) return { left: Math.min(rect.left, more.left), top: Math.min(rect.top, more.top),
            right: Math.max(rect.right, more.right), bottom: Math.max(rect.bottom, more.bottom) };
    }
    if (typeof innerWidth !== 'undefined' && innerWidth <= 640
        && ['places-countries', 'places-list'].includes(stepId))
    {
        const top = Math.max(64, rect.top);
        return { left: rect.left, right: rect.right, top,
            bottom: Math.min(rect.bottom, top + 210) };
    }
    if (['notes-editor-overview', 'notes-rich-text', 'notes-sections', 'notes-checklist'].includes(stepId))
    {
        const pane = main.querySelector('.notes-right-pane')?.getBoundingClientRect();
        const header = main.querySelector('.notes-editor-header')?.getBoundingClientRect();
        const collections = main.querySelector('[data-note-editor-section="collections"]')?.getBoundingClientRect();
        if (pane)
        {
            const bottom = stepId === 'notes-editor-overview' && collections
                ? collections.bottom : rect.bottom;
            const visibleTop = stepId === 'notes-sections' || stepId === 'notes-checklist'
                ? innerWidth > 1100 ? Math.max(pane.top, (header?.bottom || pane.top) + 12) : 64
                : pane.top;
            const top = Math.max(rect.top, visibleTop);
            const sheetTop = innerWidth <= 640 && ['notes-rich-text', 'notes-sections', 'notes-checklist'].includes(stepId)
                ? innerHeight - (geneoTourRuntime.root?.querySelector('.geneo-tour-card')?.offsetHeight || 0) - 12
                : innerHeight - 8;
            const compactFocus = ['notes-rich-text', 'notes-sections', 'notes-checklist'].includes(stepId)
                && innerWidth > 640 && innerWidth <= 1100;
            const left = compactFocus
                ? rect.left : pane.left;
            const right = compactFocus
                ? Math.min(rect.right, innerWidth - (geneoTourRuntime.root?.querySelector('.geneo-tour-card')?.offsetWidth || 360) - 32)
                : pane.right;
            return { left, right, top,
                bottom: Math.max(top + 40, Math.min(bottom, pane.bottom, sheetTop)) };
        }
    }
    if (stepId === 'archive-inspector')
    {
        const details = main.querySelector('#archive-file-section-details')?.getBoundingClientRect();
        const inspector = main.querySelector('.archive-inspector-scroll')?.getBoundingClientRect();
        if (details && inspector)
        {
            const top = Math.max(rect.top, inspector.top);
            return { left: inspector.left, right: inspector.right, top,
                bottom: Math.max(top + 40, Math.min(details.bottom, inspector.bottom)) };
        }
    }
    if (stepId === 'archive-file-actions')
    {
        const last = main.querySelector('.archive-inspector-toolbar [data-archive-row-actions="file"]')
            ?.getBoundingClientRect();
        if (last) return { left: rect.left, top: Math.min(rect.top, last.top),
            right: last.right, bottom: Math.max(rect.bottom, last.bottom) };
    }
    if (stepId === 'archive-table')
        return { left: rect.left, right: rect.right, top: Math.max(rect.top, 64),
            bottom: Math.min(rect.bottom, innerHeight - 64) };
    if (stepId === 'albums-photos')
    {
        const viewport = main.querySelector(innerWidth <= 900 ? '.albums-main' : '.albums-content')?.getBoundingClientRect();
        return viewport ? { left: Math.max(rect.left, viewport.left), top: Math.max(rect.top, viewport.top),
            right: Math.min(rect.right, viewport.right), bottom: Math.min(rect.bottom, viewport.bottom) } : rect;
    }
    if (stepId === 'albums-summary')
    {
        const inspector = main.querySelector('.albums-detail')?.getBoundingClientRect();
        const end = main.querySelector('[data-albums-section-toggle="details"]')?.closest('.panel-section');
        const endRect = end?.getBoundingClientRect();
        if (inspector && endRect)
        {
            const top = Math.max(rect.top, inspector.top);
            const visibleBottom = innerWidth <= 640
                ? Math.min(inspector.bottom, innerHeight * .66)
                : Math.min(inspector.bottom, innerHeight - 8);
            return { left: inspector.left, right: inspector.right, top,
                bottom: Math.max(top + 40, Math.min(endRect.bottom, visibleBottom)) };
        }
    }
    if (['albums-connections', 'albums-add-to-album-action'].includes(stepId))
    {
        const section = target.closest('.panel-section')?.getBoundingClientRect();
        const inspector = main.querySelector('.albums-detail')?.getBoundingClientRect();
        if (section && inspector)
        {
            const top = Math.max(section.top, inspector.top);
            const bottom = Math.min(section.bottom, inspector.bottom, innerHeight - 8);
            return { left: inspector.left, right: inspector.right, top,
                bottom: Math.max(top + 1, bottom) };
        }
    }
    if (stepId === 'albums-actions')
    {
        const last = main.querySelector('#albumsInspectorMore')?.getBoundingClientRect();
        if (last) return { left: rect.left, top: Math.min(rect.top, last.top),
            right: last.right, bottom: Math.max(rect.bottom, last.bottom) };
    }
    if (stepId === 'people-table')
        return { left: rect.left, right: rect.right, top: Math.max(rect.top, 72),
            bottom: Math.min(rect.bottom, innerHeight - 80) };
    if (stepId === 'people-navigation')
    {
        const other = main.closest('.workspace')?.querySelector('.side-nav [data-open-profile]')?.getBoundingClientRect();
        const heading = target.closest('.side-nav')?.previousElementSibling?.getBoundingClientRect();
        return other ? { left: Math.min(rect.left, other.left, heading?.left ?? rect.left),
            top: Math.min(rect.top, other.top, heading?.top ?? rect.top),
            right: Math.max(rect.right, other.right), bottom: Math.max(rect.bottom, other.bottom) } : rect;
    }
    if (innerWidth <= 1280 && ['people-profile-card', 'people-connected'].includes(stepId))
    {
        const visibleTop = Math.max(72, rect.top);
        return { left: rect.left, right: rect.right, top: visibleTop,
            bottom: Math.min(rect.bottom, innerHeight - 8, Math.max(visibleTop + 80, innerHeight * .58)) };
    }
    if (stepId === 'tree-timeline')
    {
        const section = target.closest('.panel-section')?.getBoundingClientRect() || rect;
        return innerWidth <= 640
            ? { ...section.toJSON(), bottom: Math.max(section.top + 40, Math.min(section.bottom, innerHeight * .66)) }
            : section;
    }
    if (stepId === 'tree-relationships')
    {
        const inspector = main.querySelector('.tree-inspector')?.getBoundingClientRect();
        const section = target.closest('.panel-section')?.getBoundingClientRect() || rect;
        if (inspector) return { left: section.left, right: section.right,
            top: Math.max(section.top, inspector.top), bottom: Math.min(section.bottom, inspector.bottom) };
    }
    if (stepId === 'tree-add-relative' && innerWidth <= 640)
        return { ...rect.toJSON(), bottom: Math.max(rect.top + 40, Math.min(rect.bottom, innerHeight * .66)) };
    if (stepId === 'tree-sections-overview')
    {
        const sections = [...main.querySelectorAll('.tree-inspector .panel-section')];
        const inspector = main.querySelector('.tree-inspector')?.getBoundingClientRect();
        const last = sections.at(-1)?.getBoundingClientRect();
        if (inspector && last)
            return { left: inspector.left, right: inspector.right,
                top: Math.max(inspector.top, rect.top), bottom: Math.min(inspector.bottom, last.bottom) };
    }
    if (stepId === 'geneograph-other-objects')
    {
        const last = main.querySelector('[data-geneo-toolbar-item="shape"]')?.getBoundingClientRect();
        const tools = main.querySelector('.geneo-editor-toolbar-left')?.getBoundingClientRect();
        if (last && tools) return { left: Math.max(rect.left, tools.left),
            top: Math.min(rect.top, last.top), right: Math.min(last.right, tools.right),
            bottom: Math.max(rect.bottom, last.bottom) };
    }
    if (stepId === 'geneograph-layers')
    {
        const search = sidebar.querySelector('.geneo-layer-tools')?.getBoundingClientRect();
        const rows = [...sidebar.querySelectorAll('.geneo-layer-list .geneo-layer-row')];
        const last = rows[Math.min(2, rows.length - 1)]?.getBoundingClientRect();
        const panel = sidebar.getBoundingClientRect();
        if (search && last) return { left: Math.max(search.left, panel.left),
            top: Math.max(search.top - 8, panel.top), right: Math.min(last.right, panel.right),
            bottom: Math.min(last.bottom + 8, panel.bottom) };
    }
    if (stepId === 'geneograph-objects' && innerWidth > 640 && innerWidth <= 1400)
    {
        const viewport = main.querySelector('.geneo-canvas-viewport')?.getBoundingClientRect();
        const cardHeight = geneoTourRuntime.root?.querySelector('.geneo-tour-card')?.offsetHeight || 240;
        if (viewport)
        {
            const top = Math.max(rect.top, viewport.top);
            const focusHeight = Math.max(80, Math.min(230, innerHeight - top - cardHeight - 40));
            return { left: Math.max(rect.left, viewport.left), top,
                right: Math.min(rect.right, viewport.right),
                bottom: Math.min(rect.bottom, viewport.bottom, top + focusHeight) };
        }
    }
    if (stepId === 'geneograph-objects' || stepId === 'geneograph-layers')
    {
        const viewport = stepId === 'geneograph-objects'
            ? main.querySelector('.geneo-canvas-viewport')?.getBoundingClientRect()
            : main.querySelector('.geneo-board-panel')?.getBoundingClientRect();
        if (viewport) return { left: Math.max(rect.left, viewport.left),
            top: Math.max(rect.top, viewport.top), right: Math.min(rect.right, viewport.right),
            bottom: Math.min(rect.bottom, viewport.bottom) };
    }
    return rect;
}

function geneoTourSecondaryRect(target, stepId)
{
    const rect = target.getBoundingClientRect();
    if (stepId === 'places-add-coordinates')
    {
        const body = modalBackdrop.querySelector('.place-editor-body')?.getBoundingClientRect();
        if (body) return { left: rect.left, right: rect.right,
            top: Math.max(rect.top, body.top), bottom: Math.min(rect.bottom, body.bottom),
            width: rect.width };
    }
    if (stepId !== 'archive-inspector') return rect;
    const table = main.querySelector('.archive-table-wrap')?.getBoundingClientRect();
    const inspector = main.querySelector('.archive-inspector')?.getBoundingClientRect();
    if (!table) return rect;
    const left = Math.max(rect.left, table.left);
    const right = Math.min(rect.right, table.right, inspector ? inspector.left - 12 : innerWidth - 8);
    return { left, top: Math.max(rect.top, table.top), right: Math.max(left, right),
        bottom: Math.min(rect.bottom, table.bottom), width: Math.max(0, right - left) };
}

function geneoTourNavigate(index, remember = true)
{
    if (geneoTourRuntime.transitioning) return;
    if (remember) geneoTourRuntime.history.push(geneoTourRuntime.index);
    geneoTourMoveTo(index);
}

function geneoTourFocusBoard(stepId)
{
    if (stepId !== 'geneograph-objects' && !stepId.startsWith('geneograph-sockets-')) return;
    const nodes = selectedGeneographDiagram()?.nodes || [];
    const node = id => nodes.find(item => item.id === id);
    const centerOf = item => ({ x: item.x + item.width / 2, y: item.y + item.height / 2 });
    let center = null;
    if (stepId === 'geneograph-objects' && node(geneoTourSeedTargets.panel))
        center = centerOf(node(geneoTourSeedTargets.panel));
    else if (stepId === 'geneograph-sockets-context')
    {
        const image = node(geneoTourSeedTargets.image);
        const note = node(geneoTourSeedTargets.note);
        if (image && note) center = {
            x: (Math.min(image.x, note.x) + Math.max(image.x + image.width, note.x + note.width)) / 2,
            y: (Math.min(image.y, note.y) + Math.max(image.y + image.height, note.y + note.height)) / 2
        };
    }
    else if (node(geneoTourSeedTargets.silver))
        center = centerOf(node(geneoTourSeedTargets.silver));
    if (!center) return;
    if (stepId.startsWith('geneograph-sockets-'))
        geneoTourRuntime.geneoSocketsOrigin ||= geneoCurrentViewportCenter();
    const zoom = stepId === 'geneograph-sockets-context' && innerWidth <= 640 ? 33 : 78;
    setGeneographZoom(zoom, { center });
    restoreGeneographViewportCenter(center);
}

function geneoTourAlignSocketFocus(stepId, target)
{
    const viewport = main.querySelector('.geneo-canvas-viewport')?.getBoundingClientRect();
    const wrap = main.querySelector('[data-geneo-canvas-wrap]');
    const secondary = document.querySelector(geneoTourSecondarySelectors[stepId]);
    const tertiarySelector = geneoTourTertiarySelectors[stepId];
    const tertiary = tertiarySelector ? document.querySelector(tertiarySelector) : null;
    if (!viewport || !wrap || !target || !secondary || (tertiarySelector && !tertiary)) return;
    const bounds = [target, secondary, tertiary].filter(Boolean).map(item => item.getBoundingClientRect());
    const left = Math.min(...bounds.map(rect => rect.left));
    const right = Math.max(...bounds.map(rect => rect.right));
    const top = Math.min(...bounds.map(rect => rect.top));
    const bottom = Math.max(...bounds.map(rect => rect.bottom));
    const desiredLeft = ['geneograph-sockets-intro', 'geneograph-sockets-children'].includes(stepId) && innerWidth > 640
        ? viewport.left + 380 : viewport.left + 16;
    const desiredRight = viewport.right - 16;
    let horizontal = 0;
    if (left < desiredLeft) horizontal = left - desiredLeft;
    else if (right > desiredRight) horizontal = right - desiredRight;
    const vertical = top < viewport.top + 12 ? top - viewport.top - 12
        : bottom > viewport.bottom - 12 ? bottom - viewport.bottom + 12 : 0;
    if (!horizontal && !vertical) return;
    if (!geneoTourRuntime.geneoSocketsOrigin)
        geneoTourRuntime.geneoSocketsOrigin = geneoCurrentViewportCenter();
    wrap.scrollLeft += horizontal;
    wrap.scrollTop += vertical;
}

async function geneoTourMoveTo(index)
{
    if (!geneoTourRuntime.active || geneoTourRuntime.transitioning) return;
    geneoTourRuntime.transitioning = true;
    const token = ++geneoTourRuntime.token;
    const leavingPeople = geneoTourSteps[geneoTourRuntime.index]?.module === 'People'
        && geneoTourSteps[index]?.module !== 'People';
    const leavingAlbums = geneoTourSteps[geneoTourRuntime.index]?.module === 'Albums'
        && geneoTourSteps[index]?.module !== 'Albums';
    const leavingArchive = geneoTourSteps[geneoTourRuntime.index]?.module === 'Archive'
        && geneoTourSteps[index]?.module !== 'Archive';
    const leavingNotes = geneoTourSteps[geneoTourRuntime.index]?.module === 'Notes'
        && geneoTourSteps[index]?.module !== 'Notes';
    const leavingPlaces = geneoTourSteps[geneoTourRuntime.index]?.module === 'Places'
        && geneoTourSteps[index]?.module !== 'Places';
    geneoTourDestroyOverlay({ keepInert: true });
    geneoTourClosePreview();
    if (leavingPeople) geneoTourRestorePeopleState();
    if (leavingAlbums) geneoTourRestoreAlbumsState();
    if (leavingArchive) geneoTourRestoreArchiveState();
    if (leavingNotes) geneoTourRestoreNotesState({ renderNow: false });
    if (leavingPlaces) geneoTourRestorePlacesState({ renderNow: index >= geneoTourSteps.length });
    const keepSocketViewport = geneoTourSteps[geneoTourRuntime.index]?.id.startsWith('geneograph-sockets-')
        && geneoTourSteps[index]?.id.startsWith('geneograph-sockets-');
    geneoTourClearTreeReveal({ keepSocketViewport });
    geneoTourRuntime.index = index;
    geneoTourRuntime.fallback = false;
    geneoTourRuntime.optionalFallback = false;
    geneoTourRuntime.mobileScrollAdjusted = false;
    if (index < 0 || index >= geneoTourSteps.length)
    {
        geneoTourRenderOverlay();
        geneoTourRuntime.transitioning = false;
        return;
    }
    try
    {
        geneoTourPrepare(index);
        if (geneoTourSteps[index].id === 'tree-add-relative')
            await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        if (geneoTourSteps[index].id === 'places-add-map')
            await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        geneoTourOpenPreview(geneoTourSteps[index]);
    }
    catch (error)
    {
        console.warn(`GeneoGraph tour could not prepare ${geneoTourSteps[index].id}:`, error);
    }
    if (geneoTourSteps[index].presentation === 'centered')
    {
        geneoTourRenderOverlay();
        geneoTourRuntime.transitioning = false;
        return;
    }
    const optionalTarget = geneoTourOptionalTargets.has(geneoTourSteps[index].id);
    const mountedTarget = optionalTarget ? geneoTourTarget(index) : null;
    if (optionalTarget && (!mountedTarget?.isConnected || !mountedTarget.getBoundingClientRect().width))
    {
        geneoTourRuntime.fallback = true;
        geneoTourRuntime.optionalFallback = true;
        geneoTourRenderOverlay();
        geneoTourRuntime.transitioning = false;
        return;
    }
    const target = await geneoTourWaitForTarget(index, token);
    if (token !== geneoTourRuntime.token || !geneoTourRuntime.active) return;
    if (!target)
    {
        geneoTourRuntime.fallback = true;
        console.warn(`GeneoGraph tour target unavailable: ${geneoTourSteps[index].id}`);
    }
    else
    {
        geneoTourFocusBoard(geneoTourSteps[index].id);
        if (geneoTourSteps[index].id === 'tree-person-card')
        {
            await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
            centerTreeOnPerson('silver');
        }
        else if (geneoTourSteps[index].id === 'tree-focus-switch')
        {
            await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
            centerTreeOnPerson('luna');
        }
        else if (['tree-sections-overview', 'tree-timeline', 'tree-relationships',
            'tree-relationship-actions'].includes(geneoTourSteps[index].id))
        {
            const inspector = main.querySelector('.tree-inspector');
            const scrollTarget = geneoTourSteps[index].id === 'tree-relationship-actions'
                ? target : target.closest('.panel-section');
            if (inspector && scrollTarget)
                inspector.scrollTop += scrollTarget.getBoundingClientRect().top
                    - inspector.getBoundingClientRect().top
                    - (geneoTourSteps[index].id === 'tree-relationship-actions' ? 96 : 8);
        }
        else if (geneoTourSteps[index].id === 'tree-to-people')
            main.querySelector('.tree-inspector')?.scrollTo(0, 0);
        else if (geneoTourSteps[index].id === 'people-profile-card'
            || geneoTourSteps[index].id === 'people-connected')
        {
            const rect = target.getBoundingClientRect();
            if (geneoTourSteps[index].id === 'people-profile-card' || innerWidth <= 1280)
                geneoTourScrollTarget(target, rect.top - Math.max(80, innerHeight * .16), true, true);
            else if (geneoTourSteps[index].id === 'people-connected')
            {
                const last = main.querySelector('.profile-resource-card--places')?.getBoundingClientRect();
                if (last) geneoTourScrollTarget(target, (rect.top + last.bottom) / 2 - innerHeight / 2,
                    true, true);
            }
        }
        else if (geneoTourSteps[index].id === 'albums-summary' || geneoTourSteps[index].id === 'albums-actions')
            main.querySelector('.albums-detail')?.scrollTo(0, 0);
        else if (['albums-connections', 'albums-add-to-album-action'].includes(geneoTourSteps[index].id))
        {
            const inspector = main.querySelector('.albums-detail');
            const section = target.closest('.panel-section');
            if (inspector && section)
            {
                const toolbarBottom = inspector.querySelector('.albums-detail-toolbar')?.getBoundingClientRect().bottom
                    || inspector.getBoundingClientRect().top;
                inspector.scrollTop += section.getBoundingClientRect().top - toolbarBottom - 20;
            }
        }
        else if (geneoTourSteps[index].id === 'places-list')
            window.scrollTo(0, 0);
        else if (geneoTourSteps[index].id === 'notes-list-example')
            target.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' });
        else if (['notes-editor-overview', 'notes-rich-text'].includes(geneoTourSteps[index].id))
        {
            main.querySelector('.notes-right-pane')?.scrollTo(0, 0);
            if (innerWidth <= 1100) document.scrollingElement?.scrollTo(0, 0);
        }
        else if (geneoTourSteps[index].id === 'notes-to-places' && innerWidth <= 900)
            target.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'instant' });
        else if (geneoTourSteps[index].id === 'archive-inspector'
            || geneoTourSteps[index].id === 'archive-file-actions')
            main.querySelector('.archive-inspector-scroll')?.scrollTo(0, 0);
        else if (geneoTourSteps[index].id === 'archive-to-notes' && innerWidth <= 900)
            target.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'instant' });
        else if (geneoTourSteps[index].id === 'albums-to-archive' && innerWidth <= 900)
            target.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'instant' });
        else if (geneoTourSteps[index].id === 'people-to-geneograph' && innerWidth <= 900)
            target.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'instant' });
        else if (geneoTourSteps[index].id === 'geneograph-layers')
        {
            const search = sidebar.querySelector('#geneoLayerSearch');
            if (search)
                sidebar.scrollTop += search.getBoundingClientRect().top
                    - sidebar.getBoundingClientRect().top - 88;
        }
        else if (['geneograph-sockets-intro', 'geneograph-sockets-partners', 'geneograph-sockets-children'].includes(geneoTourSteps[index].id))
            geneoTourAlignSocketFocus(geneoTourSteps[index].id, target);
        else if (geneoTourSteps[index].id === 'geneograph-sockets-context')
        {
            const nodes = selectedGeneographDiagram()?.nodes || [];
            const image = nodes.find(node => node.id === geneoTourSeedTargets.image);
            const note = nodes.find(node => node.id === geneoTourSeedTargets.note);
            if (image && note)
            {
                geneoTourRuntime.geneoSocketsOrigin ||= geneoCurrentViewportCenter();
                restoreGeneographViewportCenter({
                    x: (Math.min(image.x, note.x) + Math.max(image.x + image.width, note.x + note.width)) / 2,
                    y: (Math.min(image.y, note.y) + Math.max(image.y + image.height, note.y + note.height)) / 2
                });
            }
        }
        else if (geneoTourSteps[index].id === 'geneograph-objects' || !target.getBoundingClientRect().width)
            target.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' });
        else if (geneoTourSteps[index].id === 'geneograph-to-albums' && innerWidth <= 900)
            target.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'instant' });
        else if (document.body.classList.contains('geneo-tour-geneo-toolbar'))
            target.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'instant' });
        else if (target.getBoundingClientRect().top < 60 || target.getBoundingClientRect().bottom > innerHeight - 40)
        {
            target.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' });
        }
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    }
    if (token !== geneoTourRuntime.token || !geneoTourRuntime.active) return;
    if (target && ['notes-sections', 'notes-checklist', 'notes-add-actions'].includes(geneoTourSteps[index].id))
    {
        geneoTourAlignNotesTarget(target);
        await new Promise(resolve => requestAnimationFrame(resolve));
    }
    if (token !== geneoTourRuntime.token || !geneoTourRuntime.active) return;
    geneoTourApplySockets(geneoTourSteps[index]);
    geneoTourRenderOverlay(target?.isConnected ? target : geneoTourTarget(index));
    geneoTourRuntime.transitioning = false;
}

function geneoProductTourOnRender()
{
    if (!geneoTourRuntime.active || geneoTourRuntime.transitioning) return;
    const step = geneoTourSteps[geneoTourRuntime.index];
    geneoTourApplySockets(step);
    const expectedModule = step?.module || (geneoTourRuntime.index < 0 ? 'Projects' : 'Geneograph');
    if (expectedModule && state.activeModule !== expectedModule)
    {
        geneoTourClose({ offerRestore: false });
        return;
    }
    queueMicrotask(geneoTourRefreshCopy);
}
