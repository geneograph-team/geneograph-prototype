// ---------- Shared upload dropzones ----------
function renderUploadDropzonePrompt(title, detail)
{
    return `<span class="upload-dropzone-icon" aria-hidden="true">${icon.import}</span><span class="upload-dropzone-copy"><strong>${escapeHtml(t(title))}</strong><span>${escapeHtml(detail)}</span></span>`;
}

function bindUploadDropzoneChooser(dropzone, input)
{
    if (!dropzone || !input || dropzone.dataset.uploadChooserBound) return;
    dropzone.dataset.uploadChooserBound = 'true';
    dropzone.addEventListener('click', event =>
    {
        if (event.target !== input && !input.disabled) input.click();
    });
    dropzone.addEventListener('keydown', event =>
    {
        if (event.target === dropzone && (event.key === 'Enter' || event.key === ' '))
        {
            event.preventDefault();
            if (!input.disabled) input.click();
        }
    });
}

// ---------- Canonical media access ----------
function getPhoto(
    photoId,
    {
        projectId = ''
    } = {}
)
{
    const photo =
        sampleData.media.find(
            item =>
                item.id === photoId
        )
        || null;

    if (
        !photo
        || (
            projectId
          && photo.projectId
            !== projectId
        )
    )
    {
        return null;
    }

    return photo;
}

function getProjectPhotos(
    projectId =
        currentProjectId()
)
{
    return projectId
        ? sampleData.media.filter(photo => photo.projectId === projectId)
        : [];
}

function getProjectAlbums(projectId = currentProjectId())
{
    return projectId
        ? sampleData.albums.filter(album => album.projectId === projectId)
        : [];
}

function photoIsTaggedWithPerson(
    photo,
    personOrId
)
{
    const personId =
        typeof personOrId === 'string'
            ? personOrId
            : personOrId?.id;

    return Boolean(
        personId
        && Array.isArray(
            photo?.personIds
        )
        && photo.personIds.includes(
            personId
        )
    );
}

function getPhotosForPerson(
    personId,
    options = {}
)
{
    const person =
        getPerson(personId);

    if (!person)
    {
        return [];
    }

    return getProjectPhotos(
        person.projectId,
        options
    ).filter(photo =>
        photoIsTaggedWithPerson(
            photo,
            person
        )
    );
}

function getPhotoPeople(photo)
{
    if (!photo) return [];
    return [...new Set(photo.personIds || [])]
        .map(getPerson)
        .filter(person => person && person.projectId === photo.projectId);
}

function getPersonPhotoCount(personId)
{
    return getPhotosForPerson(personId).length;
}

function getAlbumPhotoCount(albumId)
{
    const album = sampleData.albums.find(item => item.id === albumId);
    if (!album) return 0;
    return getProjectPhotos(album.projectId).filter(photo =>
        Array.isArray(photo.albumIds) && photo.albumIds.includes(albumId)
    ).length;
}

function getAlbumName(albumId)
{
    return sampleData.albums.find(album => album.id === albumId)?.name || '';
}

function getAlbumPreviewPhoto(albumId)
{
    const album =
        getProjectAlbums().find(
            item => item.id === albumId
        );

    if (!album) return null;

    return getProjectPhotos(
        album.projectId
    ).find(photo =>
        (photo.albumIds || [])
            .includes(album.id)
    ) || null;
}

function getAlbumSelectedPhotoMembership(
    albumId,
    photoIds
)
{
    const ids = [
        ...new Set(photoIds || [])
    ];

    const existingCount =
        ids.reduce(
            (count, photoId) =>
            {
                const photo =
                    getPhoto(
                        photoId,
                        {
                            projectId:
                    currentProjectId()
                        }
                    );

                return (
                    count
              + (
                  photo?.albumIds
                      ?.includes(albumId)
                      ? 1
                      : 0
              )
                );
            },
            0
        );

    return {
        selectedPhotoCount:
          ids.length,

        existingCount,

        missingCount:
          Math.max(
              0,
              ids.length
            - existingCount
          ),

        complete:
          ids.length > 0
          && existingCount
            === ids.length
    };
}

function albumPickerSearchText(album)
{
    return [
        album?.name || '',
        album?.description || ''
    ]
        .join(' ')
        .toLowerCase();
}

function addPhotosToAlbums(
    photoIds,
    albumIds
)
{
    const projectId =
        currentProjectId();

    const validAlbumIds =
        new Set(
            getProjectAlbums(projectId)
                .map(album => album.id)
        );

    const destinationIds = [
        ...new Set(albumIds || [])
    ].filter(albumId =>
        validAlbumIds.has(albumId)
    );

    const changedPhotoIds =
        new Set();

    const changedAlbumIds =
        new Set();

    let membershipCount = 0;

    const now =
        new Date().toISOString();

    [
        ...new Set(photoIds || [])
    ].forEach(photoId =>
    {
        const photo =
            getPhoto(
                photoId,
                {
                    projectId
                }
            );

        if (!photo) return;

        const currentIds =
            new Set(
                photo.albumIds || []
            );

        let changed = false;

        destinationIds.forEach(
            albumId =>
            {
                if (
                    currentIds.has(albumId)
                )
                {
                    return;
                }

                currentIds.add(albumId);
                changed = true;
                membershipCount += 1;

                changedAlbumIds.add(
                    albumId
                );
            }
        );

        if (!changed) return;

        photo.albumIds = [
            ...currentIds
        ];

        photo.updatedAt = now;

        changedPhotoIds.add(
            photo.id
        );
    });

    if (changedPhotoIds.size) markPrototypeSessionEdited();

    return {
        changedPhotoCount:
          changedPhotoIds.size,

        changedAlbumCount:
          changedAlbumIds.size,

        membershipCount
    };
}

function photoDateModel(photo)
{
    const date = photo?.date || {};
    return normalizeGenealogyDateInput({
        ...date,
        date: date.fromDate || date.date || '',
        date2: date.toDate || '',
        date2Label: date.toDate || ''
    }, date.dateType || 'Exact date');
}

function mediaDateFromGenealogyModel(value)
{
    return normalizeGenealogyDateInput(value);
}

function formatPhotoDate(photo)
{
    const model = photoDateModel(photo);
    if (model.dateType === 'Between')
    {
        const from = formatGenealogyDateStartLabel(model);
        const to = formatGenealogyDateEndLabel(model);
        return from && to ? `${from} - ${to}` : from || to || 'Unknown date';
    }
    return formatGenealogyDateLabel(model) || 'Unknown date';
}

function formatMediaBytes(sizeBytes)
{
    const bytes = Number(sizeBytes);
    if (!Number.isFinite(bytes) || bytes < 0) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 ** 2) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 ** 2)).toFixed(1)} MB`;
}

function formatMediaTimestamp(value)
{
    const timestamp = Date.parse(value || '');
    if (!Number.isFinite(timestamp)) return 'Unknown';
    return new Intl.DateTimeFormat(state.language === 'ru' ? 'ru-RU' : 'en-GB', {
        year: 'numeric', month: 'short', day: 'numeric'
    }).format(new Date(timestamp));
}

