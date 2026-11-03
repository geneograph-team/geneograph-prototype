// ---------- Canonical Albums module ----------

const defaultAlbumFilters =
    Object.freeze({
        personId: '',
        placeId: '',
        dateRange: '',
        sourceId: '',
        favouriteOnly:
          false
    });

function albumsPersonFilterOptions()
{
    const projectId =
        currentProjectId();

    const photos =
        getProjectPhotos(projectId);

    const counts =
        new Map();

    let untaggedCount = 0;

    photos.forEach(photo =>
    {
        const personIds =
            Array.isArray(
                photo.personIds
            )
                ? [
                    ...new Set(
                        photo.personIds
                    )
                ]
                : [];

        if (!personIds.length)
        {
            untaggedCount += 1;
        }

        personIds.forEach(personId =>
        {
            const person =
                getPerson(personId);

            if (
                !person
            || person.projectId
              !== projectId
            )
            {
                return;
            }

            counts.set(
                personId,
                (
                    counts.get(personId)
              || 0
                ) + 1
            );
        });
    });

    const collator =
        new Intl.Collator(
            state.language === 'ru'
                ? 'ru'
                : 'en',
            {
                sensitivity:
              'base'
            }
        );

    const people =
        getPeople(projectId)
            .filter(person =>
                counts.has(person.id)
            )
            .map(person => ({
                value:
              person.id,

                label:
              person.names?.display
              || 'Unnamed person',

                count:
              counts.get(person.id)
              || 0
            }))
            .sort(
                (left, right) =>
                    collator.compare(
                        left.label,
                        right.label
                    )
            );

    return [
        {
            value:
            'none',

            label:
            'No people tagged',

            count:
            untaggedCount
        },

        ...people
    ];
}

function albumsPlaceFilterOptions()
{
    const photos =
        getProjectPhotos(
            currentProjectId()
        );

    const counts =
        new Map();

    let unknownCount = 0;

    photos.forEach(photo =>
    {
        const placeId =
            String(
                photo.placeId || ''
            ).trim();

        if (!placeId)
        {
            if (
                !String(
                    photo.placeText || ''
                ).trim()
            )
            {
                unknownCount += 1;
            }

            return;
        }

        counts.set(
            placeId,
            (
                counts.get(placeId)
            || 0
            ) + 1
        );
    });

    const collator =
        new Intl.Collator(
            state.language === 'ru'
                ? 'ru'
                : 'en',
            {
                sensitivity:
              'base'
            }
        );

    const places = [
        ...counts.entries()
    ]
        .map(([
            placeId,
            count
        ]) =>
        {
            const place =
                sampleData.places.find(
                    item =>
                        item.id === placeId
                );

            return {
                value:
              placeId,

                label:
              getPlaceDisplay(
                  placeId
              ),

                /*
            * Alternative names improve searching,
            * but are not displayed or localized.
            */
                keywords:
              place?.alternativeNames
              || [],

                count
            };
        })
        .sort(
            (left, right) =>
                collator.compare(
                    left.label,
                    right.label
                )
        );

    return [
        {
            value:
            'none',

            label:
            'No known place',

            count:
            unknownCount
        },

        ...places
    ];
}

const albumsFilterSchema =
    Object.freeze([
        Object.freeze({
            key:
            'personId',

            label:
            'Person',

            control:
            'combobox',

            multiple:
            false,

            layout:
            'full',

            placeholder:
            'Search people',

            defaultValue:
            '',

            getOptions:
            albumsPersonFilterOptions
        }),

        Object.freeze({
            key:
            'placeId',

            label:
            'Place',

            control:
            'combobox',

            multiple:
            false,

            layout:
            'full',

            placeholder:
            'Search places',

            defaultValue:
            '',

            getOptions:
            albumsPlaceFilterOptions
        }),

        Object.freeze({
            key: 'sourceId',
            label: 'Source',
            control: 'combobox',
            multiple: false,
            layout: 'full',
            placeholder: 'Search sources...',
            defaultValue: '',
            getOptions: connectedSourceFilterOptions
        }),

        Object.freeze({
            key:
            'dateRange',

            label:
            'Date',

            control:
            'select',

            defaultValue:
            '',

            options:
            Object.freeze([
                Object.freeze({
                    value:
                  '',

                    label:
                  'Any date'
                }),

                Object.freeze({
                    value:
                  'dated',

                    label:
                  'Known date'
                }),

                Object.freeze({
                    value:
                  'unknown',

                    label:
                  'Unknown date'
                })
            ])
        }),

        Object.freeze({
            key:
            'favouriteOnly',

            label:
            'Favourites',

            control:
            'boolean',

            defaultValue:
            false,

            checkboxLabel:
            'Favourites only'
        })
    ]);

function albumsFiltersWithDefaults(
    filters = state.albumsFilters
)
{
    return cloneSharedFilterValues(
        albumsFilterSchema,
        {
            ...defaultAlbumFilters,
            ...(filters || {})
        }
    );
}

function renderAlbumsFilterFields(
    filters = defaultAlbumFilters,
    prefix = 'albums-filter'
)
{
    return renderSharedFilterFields({
        schema:
          albumsFilterSchema,

        values:
          albumsFiltersWithDefaults(
              filters
          ),

        prefix
    });
}

function bindAlbumsFilterFields(
    root,
    filters,
    prefix,
    onChange =
        () =>
        {}
)
{
    return bindSharedFilterFields(
        root,
        {
            schema:
            albumsFilterSchema,

            values:
            albumsFiltersWithDefaults(
                filters
            ),

            prefix,
            onChange
        }
    );
}

function personPrimaryPhotoId(person)
{
    const centralPerson = getPerson(person?.id) || person;
    const photo = getPhoto(centralPerson?.primaryPhotoId, {
        projectId: centralPerson?.projectId || ''
    });
    return photo?.id || '';
}

function personAvatarInitials(person)
{
    return person?.names?.initials || person?.initials || person?.short || '??';
}

function personAvatarClass(person)
{
    return person?.avatarClass || person?.avatar || '';
}

function personPhotoCropStyle(
    cropValue
)
{
    const crop =
        normalizePersonPhotoCrop(
            cropValue
        );

    return [
        `--person-photo-shift-x:${
            (0.5 - crop.centerX) * 100
        }%`,
        `--person-photo-shift-y:${
            (0.5 - crop.centerY) * 100
        }%`,
        `--person-photo-zoom:${
            crop.zoom
        }`,
        `--person-photo-rotation:${
            crop.rotation
        }deg`
    ].join(';');
}

function faceRegionAttribute(region)
{
    const rect = normalizeFaceRegion(region);
    return rect ? escapeHtml(JSON.stringify(rect)) : '';
}

function positionFaceRegionMedia(media)
{
    const region = normalizeFaceRegion(JSON.parse(media.dataset.faceRegion || 'null'));
    const image = media.querySelector('img.thumb-img, img');
    const target = media.querySelector('.photo-thumbnail') || image;
    if (!region || !image?.naturalWidth || !image?.naturalHeight || !target || !media.clientWidth || !media.clientHeight) return;
    const width = media.clientWidth;
    const height = media.clientHeight;
    const scale = Math.max(width / (region.width * image.naturalWidth), height / (region.height * image.naturalHeight));
    const imageWidth = image.naturalWidth * scale;
    const imageHeight = image.naturalHeight * scale;
    Object.assign(target.style, {
        width: `${imageWidth}px`, height: `${imageHeight}px`,
        left: `${width / 2 - (region.x + region.width / 2) * imageWidth}px`,
        top: `${height / 2 - (region.y + region.height / 2) * imageHeight}px`
    });
}

let faceRegionPositionScheduled = false;
function scheduleFaceRegionPosition()
{
    if (faceRegionPositionScheduled) return;
    faceRegionPositionScheduled = true;
    requestAnimationFrame(() =>
    {
        faceRegionPositionScheduled = false;
        document.querySelectorAll('[data-face-region-media]').forEach(media =>
        {
            positionFaceRegionMedia(media);
            const image = media.querySelector('img.thumb-img, img');
            if (image && !image.dataset.faceRegionBound)
            {
                image.dataset.faceRegionBound = 'true';
                image.addEventListener('load', () => positionFaceRegionMedia(media));
                if (!image.naturalWidth)
                {
                    setTimeout(() => positionFaceRegionMedia(media), 120);
                    setTimeout(() => positionFaceRegionMedia(media), 800);
                }
            }
        });
    });
}

document.addEventListener('load', event =>
{
    const selectorImage = event.target.matches?.('[data-face-region-selector] > img') ? event.target : null;
    if (selectorImage?.naturalWidth && selectorImage?.naturalHeight)
    {
        const stage = selectorImage.parentElement;
        const aspect = selectorImage.naturalWidth / selectorImage.naturalHeight;
        stage.style.aspectRatio = String(aspect);
        stage.style.width = `min(100%, calc(52vh * ${aspect}), ${520 * aspect}px)`;
    }
    const media = event.target.closest?.('[data-face-region-media]');
    if (media) positionFaceRegionMedia(media);
}, true);
window.addEventListener('resize', () => document.querySelectorAll('[data-face-region-media]').forEach(positionFaceRegionMedia));
document.addEventListener('scroll', () => scheduleFaceRegionPosition(), true);

function renderPersonAvatar(
    person,
    className,
    {
        element = 'div',
        attrs = '',
        overlayHtml = '',
        preferCrop = false,
        faceRegionOverride = null
    } = {}
)
{
    const centralPerson =
        getPerson(person?.id)
        || person;

    const primaryPhoto =
        getPhoto(
            personPrimaryPhotoId(
                centralPerson
            ),
            {
                projectId:
              centralPerson?.projectId
              || ''
            }
        ) || person?.embeddedPhoto || null;

    const label =
        centralPerson?.names?.display
        || person?.name
        || 'Person';

    const classes = [
        'person-avatar',
        className,
        personAvatarClass(person),
        primaryPhoto
            ? 'has-photo'
            : ''
    ]
        .filter(Boolean)
        .join(' ');

    const faceRegion = normalizeFaceRegion(faceRegionOverride)
        || (preferCrop ? null : photoPersonRegion(primaryPhoto, centralPerson?.id));
    if (faceRegion) scheduleFaceRegionPosition();
    const content = primaryPhoto
        ? `
          <span
            class="person-avatar-viewport">
            <span
              class="person-avatar-media${faceRegion ? ' has-face-region' : ''}"
              ${faceRegion ? `data-face-region-media data-face-region="${faceRegionAttribute(faceRegion)}"` : `style="${escapeHtml(personPhotoCropStyle(
                        centralPerson
                            ?.primaryPhotoCrop
                    ))}"`}>
              ${renderPhotoThumbnail(
                    primaryPhoto,
                    {
                        className:
                    'person-avatar-photo',
                        label
                    }
                )}
            </span>
          </span>
        `
        : `
          <span
            class="person-avatar-initials"
            aria-hidden="true">
            ${escapeHtml(
                personAvatarInitials(person)
            )}
          </span>
        `;

    return `
        <${element}
          class="${escapeHtml(classes)}"
          ${attrs}>
          ${content}
          ${overlayHtml}
        </${element}>
      `;
}

function renderEditablePersonAvatar(person, className, options = {})
{
    const centralPerson = getPerson(person?.id) || person;
    if (!centralPerson?.id) return renderPersonAvatar(person, className, options);
    const name = centralPerson.names?.display || person?.name || 'Person';
    const hasPrimaryPhoto = Boolean(getPhoto(centralPerson.primaryPhotoId, {
        projectId: centralPerson.projectId
    }));
    const actionLabel = hasPrimaryPhoto ? 'Change photo' : 'Add photo';
    return `<div class="person-photo-control">
        ${renderPersonAvatar(person, className, options)}
        <button
          class="person-photo-edit-button"
          type="button"
          data-person-photo-edit="${escapeHtml(
                centralPerson.id
            )}"
          aria-label="${escapeHtml(
                `${actionLabel} for ${name}`
            )}"
          title="${escapeHtml(actionLabel)}">
          ${icon.camera}
        </button>
      </div>`;
}

