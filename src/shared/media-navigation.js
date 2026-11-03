function openAlbumsForPhoto(
    photoId
)
{
    const photo =
        getPhoto(
            photoId
        );

    if (!photo)
    {
        showToast(
            'The photo is no longer available.'
        );

        return;
    }

    appNavigationMarkIntent({ type: 'photo', id: photoId });

    state.activeModule =
        'Albums';

    state.albumsView =
        'all';

    state.activeAlbumId =
        null;

    resetAlbumsPage();

    state.albumsFilters = {
        ...defaultAlbumFilters
    };

    state.selectedPhotoId =
        photo.id;

    state.selectedPhotoIds =
        [];

    state.albumsDetailCollapsed =
        false;

    render();
}

function openAlbumsForPerson(personId)
{
    const person = getPerson(personId);
    if (!person) return;
    state.activeModule = 'Albums';
    state.albumsView = 'all';
    state.activeAlbumId = null;
    resetAlbumsPage();
    state.albumsFilters = { ...defaultAlbumFilters, personId };
    state.albumsSearch = '';
    state.selectedPhotoIds = [];
    state.selectedPhotoId = getPhotosForPerson(personId)[0]?.id || null;
    state.albumsDetailCollapsed = false;
    render();
}

function openPlaceInspectorPerson(
    personId
)
{
    const person =
        getPerson(personId);

    if (!person)
    {
        showToast(
            'This person is not linked to a People profile.'
        );

        return;
    }

    state.activeModule =
        'People';

    state.selectedPeopleId =
        person.id;

    state.selectedPersonId =
        person.id;

    state.peopleView =
        'profile';

    state.peopleSide =
        'profile';

    render();
}

function openAlbumsForPlace(
    placeId
)
{
    const place =
        getPlace(placeId);

    if (!place)
    {
        return;
    }

    const photos =
        getPhotosForPlace(
            place.id
        );

    state.activeModule =
        'Albums';

    state.albumsView =
        'all';

    state.activeAlbumId =
        null;

    resetAlbumsPage();

    state.albumsFilters = {
        ...defaultAlbumFilters,
        placeId:
          place.id
    };

    state.albumsSearch =
        '';

    state.selectedPhotoIds =
        [];

    state.selectedPhotoId =
        photos[0]?.id
        || null;

    state.albumsDetailCollapsed =
        false;

    render();
}

function openPlaceInspectorArchiveFile(
    fileId
)
{
    if (!fileId)
    {
        return;
    }

    state.archiveSearch =
        '';

    openFamilyArchiveItem(
        fileId
    );
}

function openArchiveForPlace(
    placeId
)
{
    const place =
        getPlace(placeId);

    if (!place)
    {
        return;
    }

    const files =
        getArchiveFilesForPlace(
            place.id
        );

    openArchiveLocation({
        view:
          'files',

        folderId:
          null,

        search:
          '',

        fileFilters: {
            ...defaultArchiveFileFilters,
            placeIds: [
                place.id
            ]
        },

        filterPresentation:
          'flat',

        filterScopeFolderId:
          null,

        selectedFileId:
          files[0]?.id
          || null,

        inspectorCollapsed:
          false
    });
}

function openNotesForPlace(
    placeId
)
{
    openNotesForContext(
        'place',
        placeId
    );
}

function openArchiveForPerson(
    personId
)
{
    const person =
        getPerson(personId);

    if (!person)
    {
        return;
    }

    const files =
        getArchiveFilesForPerson(
            person.id
        );

    openArchiveLocation({
        view:
          'files',

        folderId:
          null,

        search:
          '',

        fileFilters: {
            ...defaultArchiveFileFilters,
            personIds: [
                person.id
            ]
        },

        filterPresentation:
          'flat',

        filterScopeFolderId:
          null,

        selectedFileId:
          files[0]?.id
          || null,

        inspectorCollapsed:
          true
    });
}

function openNotesForPerson(
    personId
)
{
    openNotesForContext(
        'person',
        personId
    );
}

