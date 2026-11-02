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

const PHOTO_UPLOAD_MAX_BYTES = 20 * 1024 * 1024;
const PHOTO_UPLOAD_ALLOWED_TYPES = Object.freeze([
    'image/jpeg',
    'image/png',
    'image/webp'
]);

function resetPersonPhotoPickerState()
{
    state.personPhotoPicker = {
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
        region: null,
        dirty: false
    };
}

function personPhotoPickerPerson()
{
    return getPerson(state.personPhotoPicker?.personId) || null;
}

function personPhotoUploadDraftAsPhoto(draft = state.personPhotoPicker?.uploadDraft)
{
    if (!draft) return null;
    return {
        id: 'person-photo-upload-draft',
        projectId: personPhotoPickerPerson()?.projectId || '',
        kind: 'photo',
        title: draft.filename,
        filename: draft.filename,
        src: draft.src,
        mimeType: draft.mimeType,
        width: draft.width,
        height: draft.height,
        sizeBytes: draft.sizeBytes,

        personIds: [],
        albumIds: [],
        date: emptyGenealogyDate('Exact date'),
        placeId: null,
        placeText: '',
        address: '',
        caption: '',
        favorite: false,
        createdAt: '',
        updatedAt: ''
    };
}

function personPhotoPickerSourcePhoto()
{
    if (state.personPhotoPicker.sourceTab === 'upload')
    {
        return personPhotoUploadDraftAsPhoto();
    }
    const person = personPhotoPickerPerson();
    return getPhoto(state.personPhotoPicker.selectedPhotoId, {
        projectId: person?.projectId || ''
    });
}

function personPhotoPickerProjectPhotos()
{
    const person =
        personPhotoPickerPerson();

    if (!person)
    {
        return [];
    }

    const query =
        state.personPhotoPicker
            .search
            .trim()
            .toLowerCase();

    return getProjectPhotos(
        person.projectId
    ).filter(photo =>
    {
        if (
            state.personPhotoPicker
                .projectScope === 'tagged'
          && !photoIsTaggedWithPerson(
              photo,
              person
          )
        )
        {
            return false;
        }

        return (
            !query
          || photoSearchText(
              photo
          ).includes(query)
        );
    });
}

function personPhotoPickerHasSource()
{
    return Boolean(personPhotoPickerSourcePhoto());
}

function renderPersonPhotoCandidate(photo, person)
{
    const selected = photo.id === state.personPhotoPicker.selectedPhotoId;
    const current = photo.id === person.primaryPhotoId;
    const tagged =
        photoIsTaggedWithPerson(
            photo,
            person
        );
    return `<button class="person-photo-candidate" type="button" data-person-photo-candidate="${escapeHtml(photo.id)}" aria-pressed="${selected}">
        <span class="person-photo-candidate-preview">
          ${renderPhotoThumbnail(photo, { label: photo.title || photo.filename })}
          ${current ? '<span class="person-photo-current-badge">Current photo</span>' : ''}
          ${tagged ? '' : '<span class="person-photo-untagged-badge">Not tagged</span>'}
        </span>
        <span class="person-photo-candidate-copy">
          <strong>${escapeHtml(photo.title || photo.filename)}</strong>
          <span>${escapeHtml(formatPhotoDate(photo) || 'Unknown date')}</span>
        </span>
      </button>`;
}

function renderPersonPhotoProjectResults()
{
    const person = personPhotoPickerPerson();
    if (!person) return '';
    const allProjectPhotos = getProjectPhotos(person.projectId);
    const photos = personPhotoPickerProjectPhotos();
    const selectedPhoto = getPhoto(state.personPhotoPicker.selectedPhotoId, {
        projectId: person.projectId
    });
    const selectedIsUntagged = selectedPhoto
        && !(selectedPhoto.personIds || []).includes(person.id);

    if (!allProjectPhotos.length)
    {
        return `<div class="person-photo-empty"><div>
          <strong>Upload the first photo for this project.</strong>
          <button class="button primary" type="button" data-person-photo-show-upload>Upload new photo</button>
        </div></div>`;
    }

    if (!photos.length)
    {
        const hasSearch = Boolean(state.personPhotoPicker.search.trim());
        const taggedScope = state.personPhotoPicker.projectScope === 'tagged';
        const message = hasSearch
            ? 'No matching project photos.'
            : `No photos are tagged with ${person.names?.display || 'this person'}.`;
        return `<div class="person-photo-empty"><div>
          <strong>${escapeHtml(message)}</strong>
          <div class="person-photo-empty-actions">
            ${hasSearch ? '<button class="button secondary" type="button" data-person-photo-clear-search>Clear search</button>' : ''}
            ${taggedScope ? '<button class="button secondary" type="button" data-person-photo-browse-all>Browse all project photos</button>' : ''}
            <button class="button primary" type="button" data-person-photo-show-upload>Upload new photo</button>
          </div>
        </div></div>`;
    }

    return `${selectedIsUntagged ? `<div class="person-photo-picker-notice">${escapeHtml(person.names?.display || 'This person')} will also be tagged in this photo.</div>` : ''}
        <div class="person-photo-candidate-grid">${photos.map(photo => renderPersonPhotoCandidate(photo, person)).join('')}</div>`;
}

function renderPersonPhotoProjectPanel()
{
    return `
        <div class="person-photo-project-panel">
          <div class="person-photo-project-controls">
            <label
              class="search-input"
              aria-label="Search project photos">
              ${icon.search}

              <input
                data-person-photo-search
                type="search"
                value="${escapeHtml(
                    state.personPhotoPicker.search
                )}"
                placeholder="Search project photos">
            </label>

            <div
              class="person-photo-scope-switch"
              role="group"
              aria-label="Project photo scope">
              <button
                class="person-photo-scope-button"
                type="button"
                data-person-photo-scope="tagged"
                aria-pressed="${
                    state.personPhotoPicker
                        .projectScope === 'tagged'
                }">
                Tagged with this person
              </button>

              <button
                class="person-photo-scope-button"
                type="button"
                data-person-photo-scope="all"
                aria-pressed="${
                    state.personPhotoPicker
                        .projectScope === 'all'
                }">
                All photos
              </button>
            </div>
          </div>

          <div
            class="person-photo-project-results"
            data-person-photo-project-results>
            ${renderPersonPhotoProjectResults()}
          </div>
        </div>
      `;
}

function renderPersonPhotoUploadPanel()
{
    const draftPhoto = personPhotoUploadDraftAsPhoto();
    const maxMegabytes = Math.round(PHOTO_UPLOAD_MAX_BYTES / (1024 * 1024));
    return `<div class="person-photo-upload-dropzone" data-person-photo-dropzone>
        <input type="file" accept="${PHOTO_UPLOAD_ALLOWED_TYPES.join(',')}" data-person-photo-file hidden>
        ${draftPhoto ? `<div class="person-photo-upload-preview">
          <div class="person-photo-upload-thumb">${renderPhotoThumbnail(draftPhoto, { label: draftPhoto.filename })}</div>
          <div class="person-photo-upload-copy">
            <strong>${escapeHtml(draftPhoto.filename)}</strong>
            <span class="muted">${escapeHtml(`${draftPhoto.width} x ${draftPhoto.height} - ${formatMediaBytes(draftPhoto.sizeBytes)}`)}</span>
            <button class="button secondary" type="button" data-person-photo-choose-file>Choose a different photo</button>
          </div>
        </div>` : `<div class="person-photo-upload-prompt">
          ${icon.import}
          <strong>Drop a photo here</strong>
          <p>JPEG, PNG, or WebP up to ${maxMegabytes} MB.</p>
          <button class="button primary" type="button" data-person-photo-choose-file>Choose photo</button>
        </div>`}
      </div>
      ${state.personPhotoPicker.uploadError ? `<div class="person-photo-upload-error" role="alert">${escapeHtml(state.personPhotoPicker.uploadError)}</div>` : ''}`;
}

function renderPersonPhotoChooseStage()
{
    const person =
        personPhotoPickerPerson();

    const hasStoredPrimaryReference =
        Boolean(
            person?.primaryPhotoId
        );

    return `
        <div
          class="person-photo-picker-tabs"
          role="tablist"
          aria-label="Photo source">

          <button
            class="person-photo-picker-tab"
            type="button"
            role="tab"
            data-person-photo-tab="project"
            aria-selected="${
                state.personPhotoPicker
                    .sourceTab === 'project'
            }">
            Project photos
          </button>

          <button
            class="person-photo-picker-tab"
            type="button"
            role="tab"
            data-person-photo-tab="upload"
            aria-selected="${
                state.personPhotoPicker
                    .sourceTab === 'upload'
            }">
            Upload new
          </button>
        </div>

        <div role="tabpanel">
          ${
                state.personPhotoPicker
                    .sourceTab === 'project'
                    ? renderPersonPhotoProjectPanel()
                    : renderPersonPhotoUploadPanel()
            }
        </div>

        <div class="modal-footer">
          <div>
            ${
                hasStoredPrimaryReference
                    ? `
                  <button
                    class="button secondary"
                    type="button"
                    data-person-photo-remove-current>
                    Remove current photo
                  </button>
                `
                    : ''
            }
          </div>

          <div class="modal-footer-actions">
            <button
              class="button secondary"
              type="button"
              data-close>
              Cancel
            </button>

            <button
              class="button primary"
              type="button"
              data-person-photo-continue
              ${
                    personPhotoPickerHasSource()
                        ? ''
                        : 'disabled'
                }>
              Continue
            </button>
          </div>
        </div>
      `;
}

function renderPersonPhotoRegionMedia(
    photo,
    region,
    className = ''
)
{
    scheduleFaceRegionPosition();
    return `
        <span
          class="person-photo-region-preview ${
                escapeHtml(className)
            }"
          data-face-region-media data-face-region="${faceRegionAttribute(region)}">
          ${photo.src ? `<img src="${escapeHtml(photo.src)}" alt="" draggable="false">` : renderPhotoThumbnail(photo)}
        </span>
      `;
}

function renderFaceRegionSelector(photo, region, label = 'Select face area', otherRegions = [], boxLabel = 'Face area. Arrow keys move; Shift and arrow keys resize.', activeName = '')
{
    const rect = normalizeFaceRegion(region, FACE_REGION_MIN);
    const aspect = (Number(photo.width) || 1) / (Number(photo.height) || 1);
    return `<div class="face-region-selector" data-face-region-selector style="--photo-aspect:${aspect};aspect-ratio:${aspect};width:min(100%,calc(52vh * ${aspect}),${520 * aspect}px)" aria-label="${escapeHtml(t(label))}">
        ${photo.src ? `<img src="${escapeHtml(photo.src)}" alt="" draggable="false">` : renderPhotoThumbnail(photo)}
        ${otherRegions.map(({ region: other, name, personId }) => {
            const bounds = normalizeFaceRegion(other, FACE_REGION_MIN);
            return bounds ? `<span class="face-region-other${bounds.y + bounds.height > .8 ? ' label-above' : ''}" data-face-region-other ${personId ? `data-person-id="${escapeHtml(personId)}" tabindex="0" role="button" aria-label="${escapeHtml(localizedDataFieldValue(name))}"` : 'aria-hidden="true"'} title="${escapeHtml(localizedDataFieldValue(name))}" style="left:${bounds.x * 100}%;top:${bounds.y * 100}%;width:${bounds.width * 100}%;height:${bounds.height * 100}%">${personId ? `<span class="face-region-name">${escapeHtml(localizedDataFieldValue(name))}</span>` : ''}</span>` : '';
        }).join('')}
        ${rect ? `<div class="face-region-box${rect.y + rect.height > .8 ? ' label-above' : ''}" data-face-region-box tabindex="0" role="group" aria-label="${escapeHtml(t(boxLabel))}" style="left:${rect.x * 100}%;top:${rect.y * 100}%;width:${rect.width * 100}%;height:${rect.height * 100}%">${activeName ? `<span class="face-region-name">${escapeHtml(localizedDataFieldValue(activeName))}</span>` : ''}<span class="face-region-handle" data-face-region-resize aria-hidden="true"></span></div>` : ''}
      </div>`;
}

function bindFaceRegionSelector(root, getRegion, setRegion, boxLabel = 'Face area. Arrow keys move; Shift and arrow keys resize.', onCommit = null)
{
    const stage = root.querySelector('[data-face-region-selector]');
    if (!stage) return;
    let drag = null;
    const update = region =>
    {
        let normalized = normalizeFaceRegion(region, FACE_REGION_MIN);
        normalized = normalizeFaceRegion(setRegion(normalized) || normalized, FACE_REGION_MIN);
        let box = stage.querySelector('[data-face-region-box]');
        if (!box && normalized)
        {
            box = document.createElement('div');
            box.className = 'face-region-box';
            box.dataset.faceRegionBox = '';
            box.tabIndex = 0;
            box.setAttribute('role', 'group');
            box.setAttribute('aria-label', t(boxLabel));
            box.innerHTML = '<span class="face-region-handle" data-face-region-resize aria-hidden="true"></span>';
            stage.appendChild(box);
        }
        if (box && normalized)
        {
            Object.assign(box.style, {
                left: `${normalized.x * 100}%`, top: `${normalized.y * 100}%`,
                width: `${normalized.width * 100}%`, height: `${normalized.height * 100}%`
            });
        }
        else if (box) box.remove();
    };
    stage.addEventListener('pointerdown', event =>
    {
        if (event.button !== 0 || event.target.closest('[data-face-region-other]')) return;
        const bounds = stage.getBoundingClientRect();
        const box = event.target.closest('[data-face-region-box]');
        const current = getRegion();
        const mode = event.target.closest('[data-face-region-resize]') ? 'resize' : box ? 'move' : 'draw';
        const x = (event.clientX - bounds.left) / bounds.width;
        const y = (event.clientY - bounds.top) / bounds.height;
        drag = { mode, x, y, start: current || FACE_REGION_DEFAULT, previous: current };
        if (mode === 'draw') update({ x, y, width: FACE_REGION_MIN, height: FACE_REGION_MIN });
        stage.setPointerCapture(event.pointerId);
        event.preventDefault();
    });
    stage.addEventListener('pointermove', event =>
    {
        if (!drag) return;
        const bounds = stage.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width;
        const y = (event.clientY - bounds.top) / bounds.height;
        if (drag.mode === 'move') update({ ...drag.start, x: drag.start.x + x - drag.x, y: drag.start.y + y - drag.y });
        else if (drag.mode === 'resize') update({ ...drag.start, width: x - drag.start.x, height: y - drag.start.y });
        else update({ x: Math.min(drag.x, x), y: Math.min(drag.y, y), width: Math.abs(x - drag.x), height: Math.abs(y - drag.y) });
    });
    const finish = event =>
    {
        if (!drag) return;
        const gesture = drag;
        drag = null;
        if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);
        if (event.type === 'pointercancel') update(gesture.previous);
        else onCommit?.({ keyboard: false });
    };
    stage.addEventListener('pointerup', finish);
    stage.addEventListener('pointercancel', finish);
    stage.addEventListener('keydown', event =>
    {
        if (!event.target.matches('[data-face-region-box]') || !event.key.startsWith('Arrow')) return;
        const rect = getRegion();
        if (!rect) return;
        const step = event.ctrlKey ? 0.01 : 0.025;
        const dx = event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0;
        const dy = event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0;
        update(event.shiftKey ? { ...rect, width: rect.width + dx, height: rect.height + dy } : { ...rect, x: rect.x + dx, y: rect.y + dy });
        onCommit?.({ keyboard: true });
        event.preventDefault();
    });
}

function renderPersonPhotoAdjustStage()
{
    const photo = personPhotoPickerSourcePhoto();
    if (!photo) return '<div class="panel-muted">The selected photo is no longer available.</div>';
    const region = normalizeFaceRegion(state.personPhotoPicker.region, FACE_REGION_MIN) || FACE_REGION_DEFAULT;
    return `<div class="person-photo-adjust-layout">
        <div class="person-photo-crop-column">
          ${renderFaceRegionSelector(photo, region)}
          <p class="person-photo-crop-hint">Drag to select a face. Move the box or drag its corner to adjust it.</p>
          <button class="person-photo-tool-button" type="button" data-person-photo-reset>Reset area</button>
        </div>
        <aside class="person-photo-preview-column" aria-label="Avatar previews">
          <div class="person-photo-preview-card"><strong>Family Tree preview</strong><div class="person-photo-preview-avatar tree">${renderPersonPhotoRegionMedia(photo, region)}</div></div>
          <div class="person-photo-preview-card"><strong>Profile preview</strong><div class="person-photo-preview-avatar profile">${renderPersonPhotoRegionMedia(photo, region)}</div></div>
        </aside>
      </div>`;
}

function renderPersonPhotoPickerModal()
{
    const person =
        personPhotoPickerPerson();

    if (!person) return;

    const adjust =
        state.personPhotoPicker.step
        === 'adjust';

    openModal(`
        <div
          class="
            modal
            person-photo-picker-modal
          "
          data-person-photo-picker
          role="dialog"
          aria-modal="true"
          aria-labelledby="personPhotoPickerTitle">

          <div class="modal-header">
            <div>
              <h2 id="personPhotoPickerTitle">
                Change photo for ${
                    escapeHtml(
                        person.names?.display
                    || 'Person'
                    )
                }
              </h2>

              <p>
                This photo will appear in Family Tree,
                People, and Profile.
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
            class="
              modal-body
              person-photo-picker-body
            ">
            <div
              class="person-photo-picker-step"
              aria-label="${
                    adjust
                        ? 'Adjust photo'
                        : 'Choose photo'
                }">
              ${
                    adjust
                        ? 'Adjust photo'
                        : 'Choose photo'
                }
            </div>

            ${
                adjust
                    ? renderPersonPhotoAdjustStage()
                    : renderPersonPhotoChooseStage()
            }
          </div>
          ${adjust ? `<div class="modal-footer">
            <button class="button secondary" type="button" data-person-photo-back>Back</button>
            <div class="modal-footer-actions">
              <button class="button secondary" type="button" data-close>Cancel</button>
              <button class="button primary" type="button" data-person-photo-use>Use photo</button>
            </div>
          </div>` : ''}
        </div>
      `);

    bindPersonPhotoPickerModal();
}

function bindPersonPhotoProjectResultActions(root = modalBackdrop)
{
    root.querySelectorAll('[data-person-photo-candidate]').forEach(button => button.addEventListener('click', () =>
    {
        const nextId = button.dataset.personPhotoCandidate;
        if (nextId !== state.personPhotoPicker.selectedPhotoId)
        {
            state.personPhotoPicker.selectedPhotoId = nextId;
            if (nextId !== state.personPhotoPicker.initialPhotoId) state.personPhotoPicker.dirty = true;
        }
        renderPersonPhotoPickerModal();
    }));
    root.querySelector('[data-person-photo-clear-search]')?.addEventListener('click', () =>
    {
        state.personPhotoPicker.search = '';
        renderPersonPhotoPickerModal();
    });
    root.querySelectorAll('[data-person-photo-browse-all]').forEach(button => button.addEventListener('click', () =>
    {
        state.personPhotoPicker.sourceTab = 'project';
        state.personPhotoPicker.projectScope = 'all';
        state.personPhotoPicker.search = '';
        renderPersonPhotoPickerModal();
    }));
    root.querySelectorAll('[data-person-photo-show-upload]').forEach(button => button.addEventListener('click', () =>
    {
        state.personPhotoPicker.sourceTab = 'upload';
        renderPersonPhotoPickerModal();
    }));
}

function updatePersonPhotoProjectResults()
{
    const host = modalBackdrop.querySelector('[data-person-photo-project-results]');
    if (!host) return;
    host.innerHTML = renderPersonPhotoProjectResults();
    bindPersonPhotoProjectResultActions(host);
}

function readPersonPhotoFile(file)
{
    return new Promise((resolve, reject) =>
    {
        const reader = new FileReader();
        reader.addEventListener('load', () => resolve(String(reader.result || '')));
        reader.addEventListener('error', () => reject(new Error('File cannot be read.')));
        reader.readAsDataURL(file);
    });
}

function loadPersonPhotoDimensions(src)
{
    return new Promise((resolve, reject) =>
    {
        const image = new Image();
        image.addEventListener('load', () => resolve({ width: image.naturalWidth, height: image.naturalHeight }));
        image.addEventListener('error', () => reject(new Error('File cannot be read as an image.')));
        image.src = src;
    });
}

async function processPersonPhotoUpload(file)
{
    if (!state.personPhotoPicker.open || !file) return;
    state.personPhotoPicker.uploadError = '';
    if (!PHOTO_UPLOAD_ALLOWED_TYPES.includes(file.type))
    {
        state.personPhotoPicker.uploadError = 'Unsupported file type. Choose a JPEG, PNG, or WebP image.';
        renderPersonPhotoPickerModal();
        return;
    }
    if (file.size > PHOTO_UPLOAD_MAX_BYTES)
    {
        state.personPhotoPicker.uploadError = `Photo is too large. Choose a file smaller than ${Math.round(PHOTO_UPLOAD_MAX_BYTES / (1024 * 1024))} MB.`;
        renderPersonPhotoPickerModal();
        return;
    }
    const pickerPersonId = state.personPhotoPicker.personId;
    try
    {
        const src = await readPersonPhotoFile(file);
        const dimensions = await loadPersonPhotoDimensions(src);
        if (!dimensions.width || !dimensions.height) throw new Error('Photo has invalid or missing image dimensions.');
        if (!state.personPhotoPicker.open || state.personPhotoPicker.personId !== pickerPersonId) return;
        state.personPhotoPicker.uploadDraft = {
            file,
            src,
            filename: file.name || 'Uploaded photo',
            mimeType: file.type,
            width: dimensions.width,
            height: dimensions.height,
            sizeBytes: file.size
        };
        state.personPhotoPicker.selectedPhotoId = null;
        state.personPhotoPicker.uploadError = '';
        state.personPhotoPicker.dirty = true;
    }
    catch (error)
    {
        state.personPhotoPicker.uploadDraft = null;
        state.personPhotoPicker.uploadError = error?.message || 'File cannot be read.';
    }
    renderPersonPhotoPickerModal();
}

function initializePersonPhotoRegion()
{
    const person = personPhotoPickerPerson();
    const source = personPhotoPickerSourcePhoto();
    if (!person || !source) return false;
    state.personPhotoPicker.region = normalizeFaceRegion(photoPersonRegion(source, person.id), FACE_REGION_MIN) || { ...FACE_REGION_DEFAULT };
    state.personPhotoPicker.step = 'adjust';
    return true;
}

function photoUploadFileSignature(
    file
)
{
    return [
        file?.name || '',
        file?.size || 0,
        file?.type || '',
        file?.lastModified || 0
    ].join(':');
}

async function createPhotoUploadDraft(
    file,
    {
        idPrefix =
            'photo-upload-draft'
    } = {}
)
{
    if (
        !PHOTO_UPLOAD_ALLOWED_TYPES
            .includes(file.type)
    )
    {
        throw new Error(
            `${
                file.name || 'File'
            } — unsupported file type`
        );
    }

    if (
        file.size
          > PHOTO_UPLOAD_MAX_BYTES
    )
    {
        throw new Error(
            `${
                file.name || 'File'
            } — larger than ${
                Math.round(
                    PHOTO_UPLOAD_MAX_BYTES
              / (1024 * 1024)
                )
            } MB`
        );
    }

    const src =
        await readPersonPhotoFile(
            file
        );

    const dimensions =
        await loadPersonPhotoDimensions(
            src
        );

    if (
        !dimensions.width
        || !dimensions.height
    )
    {
        throw new Error(
            `${
                file.name || 'File'
            } — invalid image dimensions`
        );
    }

    return {
        id:
          `${idPrefix}-${
              Date.now()
          }-${
              Math.random()
                  .toString(36)
                  .slice(2, 9)
          }`,

        signature:
          photoUploadFileSignature(
              file
          ),

        file,
        src,

        filename:
          file.name
          || 'Uploaded photo',

        mimeType:
          file.type,

        width:
          dimensions.width,

        height:
          dimensions.height,

        sizeBytes:
          file.size
    };
}

function photoUploadDraftIsValid(
    draft
)
{
    return Boolean(
        draft
        && PHOTO_UPLOAD_ALLOWED_TYPES
            .includes(
                draft.mimeType
            )
        && Number(
            draft.sizeBytes
        ) <= PHOTO_UPLOAD_MAX_BYTES
        && Number(
            draft.width
        ) > 0
        && Number(
            draft.height
        ) > 0
        && draft.src
    );
}

function uniquePhotoUploadId(
    prefix =
        'photo-upload'
)
{
    const safePrefix =
        String(prefix)
            .replace(
                /[^a-z0-9_-]+/gi,
                '-'
            );

    const base =
        `${safePrefix}-${Date.now()}`;

    let id = base;
    let suffix = 2;

    while (getPhoto(id))
    {
        id =
            `${base}-${suffix}`;

        suffix += 1;
    }

    return id;
}

function createMediaFromPhotoUpload({
    projectId,
    draft,
    personIds = [],
    idPrefix =
        'photo-upload'
})
{
    if (
        !projectId
        || !photoUploadDraftIsValid(
            draft
        )
    )
    {
        return null;
    }

    const now =
        new Date()
            .toISOString();

    const title =
        String(
            draft.filename
          || 'Uploaded photo'
        )
            .replace(
                /\.[^.]+$/,
                ''
            )
        || 'Uploaded photo';

    const photo = {
        id:
          uniquePhotoUploadId(
              idPrefix
          ),

        projectId,
        kind:
          'photo',

        title,

        filename:
          draft.filename,

        src:
          draft.src,

        mimeType:
          draft.mimeType,

        width:
          draft.width,

        height:
          draft.height,

        sizeBytes:
          draft.sizeBytes,



        personIds:
          [
              ...new Set(
                  personIds
              )
          ].filter(personId =>
              getPerson(personId)
                  ?.projectId
              === projectId
          ),

        albumIds:
          [],

        date:
          emptyGenealogyDate(
              'Exact date'
          ),

        placeId:
          null,

        placeText:
          '',

        caption:
          '',

        favorite:
          false,

        createdAt:
          now,

        updatedAt:
          now
    };

    sampleData.media.push(
        photo
    );

    return photo;
}

function ensurePhotoPersonTag(photo, person)
{
    photo.personIds = [...new Set([...(photo.personIds || []), person.id])]
        .filter(personId => getPerson(personId)?.projectId === photo.projectId);
    photo.updatedAt = new Date().toISOString();
}

function resetPersonPhotosAdderState()
{
    state.personPhotosAdder = {
        open: false,
        personId: null,
        sourceTab: 'project',
        search: '',
        selectedProjectPhotoIds: [],
        uploadDrafts: [],
        uploadErrors: [],
        nested: false,
        draftTarget: null
    };
}

function personPhotosAdderPerson()
{
    if (state.personPhotosAdder?.draftTarget?.person)
    {
        return state.personPhotosAdder.draftTarget.person;
    }

    return getPerson(
        state.personPhotosAdder?.personId
    ) || null;
}

function personPhotosAdderPhotoAlreadyAdded(
    photo
)
{
    const draftTarget =
        state.personPhotosAdder
            ?.draftTarget;

    if (draftTarget)
    {
        return (
            draftTarget
                .existingPhotoIds
          || []
        ).includes(
            photo?.id
        );
    }

    const person =
        personPhotosAdderPerson();

    return photoIsTaggedWithPerson(
        photo,
        person
    );
}

function personPhotosAdderSelectedIds()
{
    return new Set(
        state.personPhotosAdder
            ?.selectedProjectPhotoIds
          || []
    );
}

function personPhotosAdderPendingCount()
{
    return (
        personPhotosAdderSelectedIds().size
        + (
            state.personPhotosAdder
                ?.uploadDrafts?.length
          || 0
        )
    );
}

function personPhotosAdderCountLabel(
    count = personPhotosAdderPendingCount()
)
{
    return `${count} ${
        count === 1
            ? 'photo'
            : 'photos'
    } selected`;
}

function personPhotosAdderActionLabel(
    count = personPhotosAdderPendingCount()
)
{
    if (!count)
    {
        return 'Add photos';
    }

    return `Add ${count} ${
        count === 1
            ? 'photo'
            : 'photos'
    }`;
}

function personPhotosAdderProjectPhotos()
{
    const person =
        personPhotosAdderPerson();

    if (!person)
    {
        return [];
    }

    const query = String(
        state.personPhotosAdder.search || ''
    )
        .trim()
        .toLowerCase();

    return getProjectPhotos(
        person.projectId
    )
        .filter(photo =>
            !query
          || photoSearchText(photo)
              .includes(query)
        )
        .map((photo, index) => ({
            photo,
            index,
            alreadyTagged:
            (
                photo.personIds || []
            ).includes(person.id)
        }))
        .sort((a, b) =>
            Number(a.alreadyTagged)
          - Number(b.alreadyTagged)
          || a.index - b.index
        )
        .map(item => item.photo);
}

function renderPersonPhotosAdderCandidate(
    photo,
    person
)
{
    const alreadyTagged =
        (
            photo.personIds || []
        ).includes(person.id);

    const selected =
        !alreadyTagged
        && personPhotosAdderSelectedIds()
            .has(photo.id);

    const title =
        photo.title
        || photo.filename
        || 'Untitled photo';

    const date =
        formatPhotoDate(photo)
        || 'Unknown date';

    return `
        <button
          class="
            person-photo-candidate
            person-photos-adder-candidate
          "
          type="button"
          data-person-photos-adder-candidate="${
                escapeHtml(photo.id)
            }"
          aria-pressed="${selected}"
          aria-label="${escapeHtml(
                alreadyTagged
                    ? `${title} is already tagged with this person`
                    : `${
                        selected
                            ? 'Deselect'
                            : 'Select'
                    } ${title}`
            )}"
          ${
                alreadyTagged
                    ? 'disabled aria-disabled="true"'
                    : ''
            }>

          <span
            class="
              person-photo-candidate-preview
            ">
            ${renderPhotoThumbnail(
                photo,
                {
                    label: title
                }
            )}

            ${
                alreadyTagged
                    ? `
                  <span
                    class="
                      person-photos-adder-status-badge
                    ">
                    Already added
                  </span>
                `
                    : ''
            }

            <span
              class="
                person-photos-adder-check
              "
              data-person-photos-adder-check
              ${selected ? '' : 'hidden'}
              aria-hidden="true">
              ${icon.check}
            </span>
          </span>

          <span
            class="
              person-photo-candidate-copy
            ">
            <strong>
              ${escapeHtml(title)}
            </strong>

            <span>
              ${escapeHtml(date)}
            </span>
          </span>
        </button>
      `;
}

function renderPersonPhotosAdderProjectResults()
{
    const person =
        personPhotosAdderPerson();

    if (!person)
    {
        return '';
    }

    const allProjectPhotos =
        getProjectPhotos(
            person.projectId
        );

    const photos =
        personPhotosAdderProjectPhotos();

    if (!allProjectPhotos.length)
    {
        return `
          <div class="person-photo-empty">
            <div>
              <strong>
                This project has no photos yet.
              </strong>

              <button
                class="button primary"
                type="button"
                data-person-photos-adder-show-upload>
                Upload new photos
              </button>
            </div>
          </div>
        `;
    }

    if (!photos.length)
    {
        return `
          <div class="person-photo-empty">
            <div>
              <strong>
                No photos match this search.
              </strong>

              <div
                class="
                  person-photo-empty-actions
                ">
                <button
                  class="button secondary"
                  type="button"
                  data-person-photos-adder-clear-search>
                  Clear search
                </button>

                <button
                  class="button primary"
                  type="button"
                  data-person-photos-adder-show-upload>
                  Upload new photos
                </button>
              </div>
            </div>
          </div>
        `;
    }

    return `
        <div
          class="
            person-photo-candidate-grid
            person-photos-adder-grid
          ">
          ${photos
                .map(photo =>
                    renderPersonPhotosAdderCandidate(
                        photo,
                        person
                    )
                )
                .join('')}
        </div>
      `;
}

function renderPersonPhotosAdderProjectPanel()
{
    return `
        <div
          class="
            person-photo-project-panel
            person-photos-adder-project-panel
          ">

          <div
            class="
              person-photo-project-controls
              person-photos-adder-project-controls
            ">
            <label
              class="search-input"
              aria-label="Search project photos">
              ${icon.search}

              <input
                data-person-photos-adder-search
                type="search"
                value="${escapeHtml(
                    state.personPhotosAdder
                        .search
                )}"
                placeholder="Search project photos"
                autocomplete="off">
            </label>
          </div>

          <div
            class="
              person-photo-project-results
            "
            data-person-photos-adder-project-results>
            ${renderPersonPhotosAdderProjectResults()}
          </div>
        </div>
      `;
}

function personPhotosAdderDraftAsPhoto(
    draft
)
{
    const person =
        personPhotosAdderPerson();

    return {
        id: draft.id,
        projectId:
          person?.projectId || '',
        kind: 'photo',
        title:
          draft.filename
          || 'Uploaded photo',
        filename:
          draft.filename
          || 'Uploaded photo',
        src: draft.src,
        mimeType: draft.mimeType,
        width: draft.width,
        height: draft.height,
        sizeBytes: draft.sizeBytes,



        personIds:
          person?.id
              ? [person.id]
              : [],

        albumIds: [],

        date:
          emptyGenealogyDate(
              'Exact date'
          ),

        placeId: null,
        placeText: '',
        caption: '',
        favorite: false,
        createdAt: '',
        updatedAt: ''
    };
}


function renderPersonPhotosAdderUploadDraft(
    draft
)
{
    const photo =
        personPhotosAdderDraftAsPhoto(
            draft
        );

    const title =
        draft.filename
        || 'Uploaded photo';

    return `
        <article
          class="
            person-photo-candidate
            person-photos-adder-upload-card
          ">

          <span
            class="
              person-photo-candidate-preview
            ">
            ${renderPhotoThumbnail(
                photo,
                {
                    label: title
                }
            )}

            <button
              class="
                person-photos-adder-upload-remove
              "
              type="button"
              data-person-photos-adder-remove-upload="${
                    escapeHtml(draft.id)
                }"
              aria-label="${escapeHtml(
                    `Remove ${title}`
                )}"
              title="Remove upload">
              ${icon.close}
            </button>
          </span>

          <span
            class="
              person-photo-candidate-copy
            ">
            <strong>
              ${escapeHtml(title)}
            </strong>

            <span>
              ${escapeHtml(
                    `${
                        draft.width
                    } × ${
                        draft.height
                    } · ${
                        formatMediaBytes(
                            draft.sizeBytes
                        )
                    }`
                )}
            </span>
          </span>
        </article>
      `;
}

function renderPersonPhotosAdderUploadErrors()
{
    const errors =
        state.personPhotosAdder
            .uploadErrors || [];

    if (!errors.length)
    {
        return '';
    }

    return `
        <div
          class="
            person-photos-adder-upload-errors
          "
          role="alert">
          <strong>
            ${
                errors.length === 1
                    ? 'One file could not be added:'
                    : `${errors.length} files could not be added:`
            }
          </strong>

          <ul>
            ${errors
                .map(error => `
                <li>
                  ${escapeHtml(error)}
                </li>
              `)
                .join('')}
          </ul>
        </div>
      `;
}

function renderPersonPhotosAdderUploadPanel()
{
    const drafts =
        state.personPhotosAdder
            .uploadDrafts || [];

    const maxMegabytes =
        Math.round(
            PHOTO_UPLOAD_MAX_BYTES
          / (
              1024 * 1024
          )
        );

    return `
        <div
          class="
            person-photos-adder-upload-panel
          ">

          <div
            class="
              person-photo-upload-dropzone
                  person-photos-adder-upload-dropzone upload-dropzone
              ${drafts.length
                    ? 'has-drafts'
                    : ''}
            "
            data-person-photos-adder-dropzone role="button" tabindex="0" aria-label="${escapeHtml(t('Choose photos'))}">

            <input
              type="file"
              accept="${
                    PHOTO_UPLOAD_ALLOWED_TYPES
                        .join(',')
                }"
              multiple
              data-person-photos-adder-file
              hidden>

${renderUploadDropzonePrompt(drafts.length ? 'Add more photos' : 'Drop photos here or choose photos', state.language === 'ru' ? `JPEG, PNG или WebP, до ${maxMegabytes} МБ на файл.` : `JPEG, PNG, or WebP up to ${maxMegabytes} MB each.`)}
          </div>

          ${renderPersonPhotosAdderUploadErrors()}

          ${
                drafts.length
                    ? `
                <div
                  class="
                    person-photo-candidate-grid
                    person-photos-adder-upload-grid
                  ">
                  ${drafts
                        .map(
                            renderPersonPhotosAdderUploadDraft
                        )
                        .join('')}
                </div>
              `
                    : ''
            }
        </div>
      `;
}

function renderPersonPhotosAdderFooter()
{
    const count =
        personPhotosAdderPendingCount();

    return `
        <div
          class="
            modal-footer
            person-photos-adder-footer
          ">
          <span
            class="
              person-photos-adder-count
            "
            data-person-photos-adder-count>
            ${escapeHtml(
                personPhotosAdderCountLabel(
                    count
                )
            )}
          </span>

          <div
            class="
              modal-footer-actions
            ">
            <button
              class="button secondary"
              type="button"
              data-close>
              Cancel
            </button>

            <button
              class="button primary"
              type="button"
              data-person-photos-adder-save
              ${count ? '' : 'disabled'}>
              ${escapeHtml(
                    personPhotosAdderActionLabel(
                        count
                    )
                )}
            </button>
          </div>
        </div>
      `;
}

function renderPersonPhotosAdderModal()
{
    const person =
        personPhotosAdderPerson();

    if (!person)
    {
        resetPersonPhotosAdderState();
        return;
    }

    const sourceTab =
        state.personPhotosAdder
            .sourceTab === 'upload'
            ? 'upload'
            : 'project';

    state.personPhotosAdder
        .sourceTab = sourceTab;

    const name =
        person.names?.display
        || 'Person';

    const presentModal =
        state.personPhotosAdder.nested
        && !modalBackdrop.querySelector(
            '[data-person-photos-adder]'
        )
            ? openNestedModal
            : openModal;

    presentModal(`
        <div
          class="
            modal
            person-photo-picker-modal
            person-photos-adder-modal
          "
          data-person-photos-adder
          role="dialog"
          aria-modal="true"
          aria-labelledby="
            personPhotosAdderTitle
          ">

          <div class="modal-header">
            <div>
              <h2
                id="
                  personPhotosAdderTitle
                ">
                Add photos for
                ${escapeHtml(name)}
              </h2>

              <p>
                Selected and uploaded
                photos will be tagged
                with this person.
              </p>
            </div>

            <button
              class="close-button"
              type="button"
              data-close
              aria-label="Close add photos dialog">
              ${icon.close}
            </button>
          </div>

          <div
            class="
              modal-body
              person-photo-picker-body
              person-photos-adder-body">

            <div
              class="person-photo-picker-tabs"
              role="tablist"
              aria-label="Photo source">

              <button
                class="person-photo-picker-tab"
                type="button"
                role="tab"
                data-person-photos-adder-tab="project"
                aria-selected="${
                    sourceTab === 'project'
                }">
                Project photos
              </button>
              <button
                class="person-photo-picker-tab"
                type="button"
                role="tab"
                data-person-photos-adder-tab="upload"
                aria-selected="${
                    sourceTab === 'upload'
                }">
                Upload new
              </button>
            </div>

            <div
              role="tabpanel"
              aria-label="${
                    sourceTab === 'project'
                        ? 'Project photos'
                        : 'Upload new photos'
                }">
              ${
                    sourceTab === 'project'
                        ? renderPersonPhotosAdderProjectPanel()
                        : renderPersonPhotosAdderUploadPanel()
                }
            </div>
          </div>

          ${renderPersonPhotosAdderFooter()}
        </div>
      `);

    bindPersonPhotosAdderModal();
}

function updatePersonPhotosAdderProjectResults()
{
    const host =
        modalBackdrop.querySelector(
            '[data-person-photos-adder-project-results]'
        );

    if (!host)
    {
        return;
    }

    host.innerHTML =
        renderPersonPhotosAdderProjectResults();

    localizeUI(host);
}

function refreshPersonPhotosAdderSelectionUi()
{
    const modal =
        modalBackdrop.querySelector(
            '[data-person-photos-adder]'
        );

    if (!modal)
    {
        return;
    }

    const selectedIds =
        personPhotosAdderSelectedIds();

    modal
        .querySelectorAll(
            '[data-person-photos-adder-candidate]'
        )
        .forEach(card =>
        {
            const selected =
                selectedIds.has(
                    card.dataset
                        .personPhotosAdderCandidate
                );

            card.setAttribute(
                'aria-pressed',
                String(selected)
            );

            const title =
                card.querySelector(
                    '.person-photo-candidate-copy strong'
                )?.textContent
            || 'photo';

            card.setAttribute(
                'aria-label',
                `${
                    selected
                        ? 'Deselect'
                        : 'Select'
                } ${title}`
            );

            const check =
                card.querySelector(
                    '[data-person-photos-adder-check]'
                );

            if (check)
            {
                check.hidden = !selected;
            }
        });

    const count =
        personPhotosAdderPendingCount();

    const countElement =
        modal.querySelector(
            '[data-person-photos-adder-count]'
        );

    if (countElement)
    {
        countElement.textContent =
            translateText(
                personPhotosAdderCountLabel(
                    count
                )
            );
    }

    const saveButton =
        modal.querySelector(
            '[data-person-photos-adder-save]'
        );

    if (saveButton)
    {
        saveButton.disabled =
            count === 0;

        saveButton.textContent =
            translateText(
                personPhotosAdderActionLabel(
                    count
                )
            );
    }
}

async function processPersonPhotosAdderFiles(
    fileList
)
{
    if (
        !state.personPhotosAdder.open
    )
    {
        return;
    }

    const personId =
        state.personPhotosAdder.personId;

    const knownSignatures =
        new Set(
            (
                state.personPhotosAdder
                    .uploadDrafts || []
            ).map(draft =>
                draft.signature
            )
        );

    const files =
        Array.from(
            fileList || []
        ).filter(file =>
        {
            const signature =
                photoUploadFileSignature(
                    file
                );

            if (
                knownSignatures.has(
                    signature
                )
            )
            {
                return false;
            }

            knownSignatures.add(
                signature
            );

            return true;
        });

    if (!files.length)
    {
        return;
    }

    const results =
        await Promise.all(
            files.map(async file =>
            {
                try
                {
                    return {
                        draft:
                  await createPhotoUploadDraft(
                      file,
                      {
                          idPrefix:
                        'person-photo-upload-draft'
                      }
                  ),
                        error: ''
                    };
                }
                catch (error)
                {
                    return {
                        draft: null,

                        error:
                  error?.message
                  || `${
                      file.name || 'File'
                  } — could not be read`
                    };
                }
            })
        );

    if (
        !state.personPhotosAdder.open
        || state.personPhotosAdder
            .personId !== personId
    )
    {
        return;
    }

    const drafts =
        results
            .map(result =>
                result.draft
            )
            .filter(Boolean);

    state.personPhotosAdder
        .uploadDrafts = [
            ...state.personPhotosAdder
                .uploadDrafts,
            ...drafts
        ];

    state.personPhotosAdder
        .uploadErrors = results
            .map(result =>
                result.error
            )
            .filter(Boolean);

    renderPersonPhotosAdderModal();
}

function renderAfterPersonConnectedResourcesChanged()
{
    if (
        state.activeModule
        === 'Family Tree'
    )
    {
        /*
        * Only the person inspector changed.
        * Preserve the tree canvas and its
        * current viewport.
        */
        rerenderPersonSidebarContext(
            'tree'
        );

        return;
    }

    if (
        state.activeModule
        === 'People'
    )
    {
        if (
            state.peopleView
          === 'profile'
        )
        {
            /*
          * Profile needs its Photos card and
          * count rebuilt, but its page scroll
          * should remain stable.
          */
            const scrollTop =
                main.scrollTop;

            renderPeople();

            requestAnimationFrame(() =>
            {
                main.scrollTop =
                    scrollTop;
            });

            return;
        }

        /*
        * In the People directory, only the
        * right-side inspector needs updating.
        * Keeping the directory DOM intact also
        * preserves table scroll and focus.
        */
        rerenderPersonSidebarContext(
            'people'
        );

        return;
    }

    render();
}
function commitPersonPhotosAdder()
{
    const person =
        personPhotosAdderPerson();

    if (!person) return;

    const draftTarget =
        state.personPhotosAdder.draftTarget;

    const selectedProjectPhotos = [
        ...personPhotosAdderSelectedIds()
    ]
        .map(photoId =>
            getPhoto(photoId, {
                projectId: person.projectId
            })
        )
        .filter(photo =>
            photo
          && !personPhotosAdderPhotoAlreadyAdded(photo)
        );

    const uploadDrafts = [
        ...(state.personPhotosAdder.uploadDrafts || [])
    ];

    if (
        uploadDrafts.some(
            draft =>
                !photoUploadDraftIsValid(draft)
        )
    )
    {
        state.personPhotosAdder.uploadErrors = [
            'One or more uploaded photos are no longer valid. Remove them and choose the files again.'
        ];

        state.personPhotosAdder.sourceTab =
            'upload';

        renderPersonPhotosAdderModal();
        return;
    }

    const totalAdded =
        selectedProjectPhotos.length
        + uploadDrafts.length;

    if (!totalAdded) return;

    if (draftTarget)
    {
        const uploadedPhotos =
            uploadDrafts
                .map(draft =>
                    createMediaFromPhotoUpload({
                        projectId:
                  person.projectId,

                        draft,

                        personIds: [],

                        idPrefix:
                  'photo-person-draft'
                    })
                )
                .filter(Boolean);

        const nextPhotoIds = [
            ...new Set([
                ...(draftTarget.existingPhotoIds || []),

                ...selectedProjectPhotos.map(
                    photo => photo.id
                ),

                ...uploadedPhotos.map(
                    photo => photo.id
                )
            ])
        ];

        const onSave =
            draftTarget.onSave;

        closeModal({
            force: true
        });

        onSave?.(nextPhotoIds);
        return;
    }

    selectedProjectPhotos.forEach(photo =>
    {
        ensurePhotoPersonTag(
            photo,
            person
        );
    });

    uploadDrafts.forEach(draft =>
    {
        createMediaFromPhotoUpload({
            projectId:
            person.projectId,

            draft,

            personIds: [
                person.id
            ],

            idPrefix:
            `photo-${person.id}`
        });
    });

    markPersonUpdated(person);

    const name =
        person.names?.display
        || 'Person';

    closeModal({
        force: true
    });

    renderAfterPersonConnectedResourcesChanged();

    showToast(
        `${totalAdded} ${
            totalAdded === 1
                ? 'photo'
                : 'photos'
        } added to ${name}.`
    );
}

function bindPersonPhotosAdderModal()
{
    const modal =
        modalBackdrop.querySelector(
            '[data-person-photos-adder]'
        );

    if (!modal)
    {
        return;
    }

    const tabs = [
        ...modal.querySelectorAll(
            '[data-person-photos-adder-tab]'
        )
    ];

    tabs.forEach(
        (tab, index) =>
        {
            tab.addEventListener(
                'click',
                () =>
                {
                    const nextTab =
                        String(
                            tab.dataset
                                .personPhotosAdderTab
                  || ''
                        ).trim();

                    if (
                        ![
                            'project',
                            'upload'
                        ].includes(nextTab)
                || nextTab
                  === state
                      .personPhotosAdder
                      .sourceTab
                    )
                    {
                        return;
                    }

                    state.personPhotosAdder
                        .sourceTab = nextTab;

                    renderPersonPhotosAdderModal();
                }
            );

            tab.addEventListener(
                'keydown',
                event =>
                {
                    if (
                        ![
                            'ArrowLeft',
                            'ArrowRight'
                        ].includes(event.key)
                    )
                    {
                        return;
                    }

                    event.preventDefault();

                    const direction =
                        event.key
                  === 'ArrowRight'
                            ? 1
                            : -1;

                    const nextIndex =
                        (
                            index
                  + direction
                  + tabs.length
                        )
                % tabs.length;

                    const nextTab =
                        String(
                            tabs[nextIndex]
                                .dataset
                                .personPhotosAdderTab
                  || ''
                        ).trim();

                    if (
                        ![
                            'project',
                            'upload'
                        ].includes(nextTab)
                    )
                    {
                        return;
                    }

                    state.personPhotosAdder
                        .sourceTab = nextTab;

                    renderPersonPhotosAdderModal();

                    requestAnimationFrame(
                        () =>
                        {
                            modalBackdrop
                                .querySelector(
                                    `[data-person-photos-adder-tab="${
                                        CSS.escape(
                                            nextTab
                                        )
                                    }"]`
                                )
                                ?.focus();
                        }
                    );
                }
            );
        }
    );

    modal
        .querySelector(
            '[data-person-photos-adder-search]'
        )
        ?.addEventListener(
            'input',
            event =>
            {
                state.personPhotosAdder
                    .search =
                        event.currentTarget.value;

                updatePersonPhotosAdderProjectResults();
            }
        );

    const fileInput =
        modal.querySelector(
            '[data-person-photos-adder-file]'
        );


    fileInput?.addEventListener(
        'change',
        () =>
        {
            processPersonPhotosAdderFiles(
                fileInput.files
            );
        }
    );

    const dropzone =
        modal.querySelector(
            '[data-person-photos-adder-dropzone]'
        );

    if (dropzone)
    {
        bindUploadDropzoneChooser(dropzone, fileInput);
        [
            'dragenter',
            'dragover'
        ].forEach(type =>
        {
            dropzone.addEventListener(
                type,
                event =>
                {
                    event.preventDefault();

                    dropzone.classList.add(
                        'is-dragging'
                    );
                }
            );
        });

        [
            'dragleave',
            'drop'
        ].forEach(type =>
        {
            dropzone.addEventListener(
                type,
                event =>
                {
                    event.preventDefault();

                    dropzone.classList.remove(
                        'is-dragging'
                    );
                }
            );
        });

        dropzone.addEventListener(
            'drop',
            event =>
            {
                processPersonPhotosAdderFiles(
                    event.dataTransfer?.files
                );
            }
        );
    }

    modal.addEventListener(
        'click',
        event =>
        {
            const candidate =
                event.target.closest(
                    '[data-person-photos-adder-candidate]'
                );

            if (candidate)
            {
                const photoId =
                    candidate.dataset
                        .personPhotosAdderCandidate;

                const photo =
                    getPhoto(
                        photoId,
                        {
                            projectId:
                    personPhotosAdderPerson()
                        ?.projectId
                    || ''
                        }
                    );

                const person =
                    personPhotosAdderPerson();

                if (
                    !photo
              || !person
              || (
                  photo.personIds || []
              ).includes(person.id)
                )
                {
                    return;
                }

                const selectedIds =
                    personPhotosAdderSelectedIds();

                if (
                    selectedIds.has(photoId)
                )
                {
                    selectedIds.delete(
                        photoId
                    );
                }
                else
                {
                    selectedIds.add(
                        photoId
                    );
                }

                state.personPhotosAdder
                    .selectedProjectPhotoIds = [
                        ...selectedIds
                    ];

                refreshPersonPhotosAdderSelectionUi();
                return;
            }

            const removeUpload =
                event.target.closest(
                    '[data-person-photos-adder-remove-upload]'
                );

            if (removeUpload)
            {
                const draftId =
                    removeUpload.dataset
                        .personPhotosAdderRemoveUpload;

                state.personPhotosAdder
                    .uploadDrafts =
                        state.personPhotosAdder
                            .uploadDrafts
                            .filter(
                                draft =>
                                    draft.id
                    !== draftId
                            );

                state.personPhotosAdder
                    .uploadErrors = [];

                renderPersonPhotosAdderModal();
                return;
            }

            if (
                event.target.closest(
                    '[data-person-photos-adder-clear-search]'
                )
            )
            {
                state.personPhotosAdder
                    .search = '';

                const searchInput =
                    modal.querySelector(
                        '[data-person-photos-adder-search]'
                    );

                if (searchInput)
                {
                    searchInput.value = '';
                }

                updatePersonPhotosAdderProjectResults();

                searchInput?.focus({
                    preventScroll: true
                });

                return;
            }

            if (
                event.target.closest(
                    '[data-person-photos-adder-show-upload]'
                )
            )
            {
                state.personPhotosAdder
                    .sourceTab = 'upload';

                renderPersonPhotosAdderModal();
                return;
            }

            if (
                event.target.closest(
                    '[data-person-photos-adder-save]'
                )
            )
            {
                commitPersonPhotosAdder();
            }
        }
    );
}


function renderAfterPersonPrimaryPhotoChange()
{
    if (state.activeModule === 'Family Tree')
    {
        renderFamilyTreePreserveScroll();
        return;
    }
    if (state.activeModule === 'People')
    {
        const mainScrollTop = main.scrollTop;
        const tableWrap = main.querySelector('.people-table-wrap');
        const tableScrollTop = tableWrap?.scrollTop || 0;
        const tableScrollLeft = tableWrap?.scrollLeft || 0;
        renderPeople();
        requestAnimationFrame(() =>
        {
            main.scrollTop = mainScrollTop;
            const nextTableWrap = main.querySelector('.people-table-wrap');
            if (nextTableWrap)
            {
                nextTableWrap.scrollTop = tableScrollTop;
                nextTableWrap.scrollLeft = tableScrollLeft;
            }
        });
        return;
    }
    if (state.activeModule === 'Albums')
    {
        const mainScrollTop =
            main.scrollTop;

        const detailPane =
            main.querySelector(
                '.albums-detail'
            );

        const detailScrollTop =
            detailPane?.scrollTop
          || 0;

        renderAlbums();

        requestAnimationFrame(() =>
        {
            main.scrollTop =
                mainScrollTop;

            const nextDetailPane =
                main.querySelector(
                    '.albums-detail'
                );

            if (nextDetailPane)
            {
                nextDetailPane.scrollTop =
                    detailScrollTop;
            }
        });

        return;
    }
    render();
}

function applyPersonPrimaryPhoto({ personId, existingPhotoId = '', uploadDraft = null, region = null } = {})
{
    const person = getPerson(personId);
    if (!person) return false;
    let photo = null;
    if (uploadDraft)
    {
        if (
            !photoUploadDraftIsValid(
                uploadDraft
            )
        )
        {
            state.personPhotoPicker
                .uploadError =
                    'The uploaded photo is no longer valid. Choose it again.';

            state.personPhotoPicker.step =
                'choose';

            state.personPhotoPicker
                .sourceTab =
                    'upload';

            renderPersonPhotoPickerModal();

            return false;
        }

        photo =
            createMediaFromPhotoUpload({
                projectId:
              person.projectId,

                draft:
              uploadDraft,

                personIds: [
                    person.id
                ],

                idPrefix:
              `photo-${person.id}`
            });
    }
    else
    {
        photo =
            getPhoto(
                existingPhotoId,
                {
                    projectId:
                person.projectId
                }
            );
    }
    if (!photo) return false;
    ensurePhotoPersonTag(photo, person);
    setPhotoPersonRegion(photo, person.id, region);
    setPersonPrimaryPhoto(person.id, photo.id, null, { rerender: false, notify: false });
    const name = person.names?.display || 'Person';
    resetPersonPhotoPickerState();
    closeModal({ force: true });
    renderAfterPersonPrimaryPhotoChange();
    showToast(`Profile photo updated for ${name}.`);
    return true;
}

function removeCurrentPersonPhoto()
{
    const person = personPhotoPickerPerson();
    if (!person?.primaryPhotoId) return;
    const name = person.names?.display || 'Person';
    person.primaryPhotoId = '';
    person.primaryPhotoCrop = null;
    markPersonUpdated(person);
    resetPersonPhotoPickerState();
    closeModal({ force: true });
    renderAfterPersonPrimaryPhotoChange();
    showToast(`Profile photo removed for ${name}.`);
}

function bindPersonPhotoPickerModal()
{
    modalBackdrop.querySelectorAll('[data-person-photo-tab]').forEach(button =>
    {
        button.addEventListener('click', () =>
        {
            state.personPhotoPicker.sourceTab = button.dataset.personPhotoTab;
            state.personPhotoPicker.uploadError = '';
            renderPersonPhotoPickerModal();
        });
        button.addEventListener('keydown', event =>
        {
            if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
            event.preventDefault();
            state.personPhotoPicker.sourceTab = state.personPhotoPicker.sourceTab === 'project' ? 'upload' : 'project';
            renderPersonPhotoPickerModal();
            modalBackdrop.querySelector(`[data-person-photo-tab="${state.personPhotoPicker.sourceTab}"]`)?.focus();
        });
    });
    modalBackdrop.querySelectorAll('[data-person-photo-scope]').forEach(button => button.addEventListener('click', () =>
    {
        state.personPhotoPicker.projectScope = button.dataset.personPhotoScope;
        renderPersonPhotoPickerModal();
    }));
    modalBackdrop.querySelector('[data-person-photo-search]')?.addEventListener('input', event =>
    {
        state.personPhotoPicker.search = event.target.value;
        updatePersonPhotoProjectResults();
    });
    bindPersonPhotoProjectResultActions(modalBackdrop);
    const fileInput = modalBackdrop.querySelector('[data-person-photo-file]');
    modalBackdrop.querySelector('[data-person-photo-choose-file]')?.addEventListener('click', () => fileInput?.click());
    fileInput?.addEventListener('change', () => processPersonPhotoUpload(fileInput.files?.[0]));
    const dropzone = modalBackdrop.querySelector('[data-person-photo-dropzone]');
    if (dropzone)
    {
        ['dragenter', 'dragover'].forEach(type => dropzone.addEventListener(type, event =>
        {
            event.preventDefault();
            dropzone.classList.add('is-dragging');
        }));
        ['dragleave', 'drop'].forEach(type => dropzone.addEventListener(type, event =>
        {
            event.preventDefault();
            dropzone.classList.remove('is-dragging');
        }));
        dropzone.addEventListener('drop', event => processPersonPhotoUpload(event.dataTransfer?.files?.[0]));
    }
    modalBackdrop.querySelector('[data-person-photo-continue]')?.addEventListener('click', () =>
    {
        if (!initializePersonPhotoRegion()) return;
        renderPersonPhotoPickerModal();
    });
    modalBackdrop.querySelector('[data-person-photo-back]')?.addEventListener('click', () =>
    {
        state.personPhotoPicker.step = 'choose';
        renderPersonPhotoPickerModal();
    });
    modalBackdrop.querySelector('[data-person-photo-reset]')?.addEventListener('click', () =>
    {
        state.personPhotoPicker.region = { ...FACE_REGION_DEFAULT };
        renderPersonPhotoPickerModal();
    });
    modalBackdrop.querySelector('[data-person-photo-use]')?.addEventListener('click', () =>
    {
        const uploadDraft = state.personPhotoPicker.sourceTab === 'upload'
            ? state.personPhotoPicker.uploadDraft
            : null;
        applyPersonPrimaryPhoto({
            personId: state.personPhotoPicker.personId,
            existingPhotoId: uploadDraft ? '' : state.personPhotoPicker.selectedPhotoId,
            uploadDraft,
            region: state.personPhotoPicker.region
        });
    });
    modalBackdrop.querySelector('[data-person-photo-remove-current]')?.addEventListener('click', removeCurrentPersonPhoto);
    bindFaceRegionSelector(modalBackdrop,
        () => state.personPhotoPicker.region,
        region =>
        {
            state.personPhotoPicker.region = region;
            state.personPhotoPicker.dirty = true;
            modalBackdrop.querySelectorAll('.person-photo-region-preview').forEach(preview =>
            {
                preview.dataset.faceRegion = JSON.stringify(region);
                positionFaceRegionMedia(preview);
            });
        });
}

function openPersonPhotoPicker(personId)
{
    const person = getPerson(personId);
    if (!person) return;
    const projectPhotos = getProjectPhotos(person.projectId);
    const activePrimary = getPhoto(person.primaryPhotoId, { projectId: person.projectId });
    resetPersonPhotoPickerState();
    Object.assign(state.personPhotoPicker, {
        open: true,
        personId: person.id,
        sourceTab: projectPhotos.length ? 'project' : 'upload',
        projectScope: 'tagged',
        selectedPhotoId: activePrimary?.id || null,
        initialPhotoId: person.primaryPhotoId || null,
        region: photoPersonRegion(activePrimary, person.id)
    });
    renderPersonPhotoPickerModal();
}

function openPersonPhotoAdjuster(
    personId,
    photoId
)
{
    const person =
        getPerson(personId);

    const photo = getPhoto(
        photoId,
        {
            projectId:
            person?.projectId || ''
        }
    );

    const isValidRelationship =
        Boolean(
            person
          && photo
          && photo.projectId
            === person.projectId
          && (
              photo.personIds || []
          ).includes(person.id)
        );

    if (!isValidRelationship)
    {
        showToast(
            'The photo is no longer available for this person.'
        );

        return false;
    }

    resetPersonPhotoPickerState();

    Object.assign(
        state.personPhotoPicker,
        {
            open: true,
            personId: person.id,
            step: 'choose',
            sourceTab: 'project',
            projectScope: 'tagged',
            search: '',
            selectedPhotoId: photo.id,
            initialPhotoId:
            person.primaryPhotoId
            || null,
            uploadDraft: null,
            uploadError: '',
            dirty:
            photo.id
            !== person.primaryPhotoId
        }
    );

    if (!initializePersonPhotoRegion())
    {
        resetPersonPhotoPickerState();

        showToast(
            'The photo could not be prepared for adjustment.'
        );

        return false;
    }

    renderPersonPhotoPickerModal();

    return true;
}

function albumContext()
{
    if (
        state.albumsView === 'album'
    )
    {
        const album =
            getProjectAlbums()
                .find(
                    item =>
                        item.id
                  === state.activeAlbumId
                );

        return {
            title:
            album?.name
            || 'Album',

            subtitle:
            album?.description
            || 'Album photos',

            empty:
            'This album has no photos yet.'
        };
    }

    const contexts = {
        favorites: {
            title:
            'Favourites',

            subtitle:
            'Photos marked as favourites.',

            empty:
            'No favorite photos yet.'
        },

        unassigned: {
            title:
            'Not in an album',

            subtitle:
            'Photos waiting to be organized.',

            empty:
            'Every active photo belongs to an album.'
        }
    };

    return (
        contexts[state.albumsView]
        || {
            title:
            'All photos',

            subtitle:
            'Your photos and visual memories.',

            empty:
            'No photos match this view.'
        }
    );
}

function photoSearchText(photo)
{
    return [
        photo.title,
        photo.filename,
        photo.caption,
        photo.placeText,
        getPlaceDisplay(photo.placeId),
        ...getPhotoPeople(photo).map(person => person.names?.display || ''),
        ...(photo.albumIds || []).map(getAlbumName)
    ].join(' ').toLowerCase();
}

function filteredAlbumPhotos()
{
    let photos =
        getProjectPhotos(
            currentProjectId()
        );

    if (
        state.albumsView === 'album'
    )
    {
        photos =
            photos.filter(
                photo =>
                    (
                        photo.albumIds || []
                    ).includes(
                        state.activeAlbumId
                    )
            );
    }
    else if (
        state.albumsView
          === 'favorites'
    )
    {
        photos =
            photos.filter(
                photo =>
                    photo.favorite
            );
    }
    else if (
        state.albumsView
          === 'unassigned'
    )
    {
        photos =
            photos.filter(
                photo =>
                    !(
                        photo.albumIds || []
                    ).length
            );
    }

    const query =
        String(
            state.albumsSearch || ''
        )
            .trim()
            .toLowerCase();

    if (query)
    {
        photos =
            photos.filter(
                photo =>
                    photoSearchText(
                        photo
                    ).includes(query)
            );
    }

    const filters =
        state.albumsFilters
        || defaultAlbumFilters;
    if (filters.sourceId)
    {
        const linkedPhotoIds = new Set(
            archiveSourceConnectionRecords(
                archiveSourceById(filters.sourceId),
                'photo'
            ).map(photo => photo.id)
        );

        photos = photos.filter(photo =>
            linkedPhotoIds.has(photo.id)
        );
    }
    if (
        filters.personId === 'none'
    )
    {
        photos =
            photos.filter(
                photo =>
                    !(
                        photo.personIds || []
                    ).length
            );
    }
    else if (
        filters.personId
    )
    {
        photos =
            photos.filter(
                photo =>
                    (
                        photo.personIds || []
                    ).includes(
                        filters.personId
                    )
            );
    }

    if (
        filters.placeId === 'none'
    )
    {
        photos =
            photos.filter(
                photo =>
                    !photo.placeId
              && !photo.placeText
            );
    }
    else if (
        filters.placeId
    )
    {
        photos =
            photos.filter(
                photo =>
                    photo.placeId
                === filters.placeId
            );
    }

    if (
        filters.favouriteOnly
    )
    {
        photos =
            photos.filter(
                photo =>
                    photo.favorite
            );
    }

    if (
        filters.dateRange
          === 'dated'
    )
    {
        photos =
            photos.filter(
                photo =>
                    photoDateModel(photo).state === 'known'
            );
    }

    if (
        filters.dateRange
          === 'unknown'
    )
    {
        photos =
            photos.filter(
                photo =>
                    photoDateModel(photo).state !== 'known'
            );
    }
    return appSortRecords(photos, {
        field:
          state.albumsSort,

        direction:
          state.albumsSortDirection,

        extractors: {
            photoName: {
                type: 'text',
                get: photo =>
                    photo.title
            },

            updated: {
                type: 'number',
                get: photo =>
                    appSortTimestamp(
                        photo.updatedAt
                    )
            },

            added: {
                type: 'number',
                get: photo =>
                    appSortTimestamp(
                        photo.createdAt
                    )
            }
        },

        getFallback:
          photo =>
              photo.title
            || photo.filename
    });
}

const ALBUMS_ROWS_PER_PAGE_OPTIONS =
    Object.freeze([
        10,
        25,
        50,
        100
    ]);

function normalizeAlbumsRowsPerPage(
    value = state.albumsRowsPerPage
)
{
    const parsedValue =
        Number(value);

    return ALBUMS_ROWS_PER_PAGE_OPTIONS
        .includes(parsedValue)
        ? parsedValue
        : 25;
}

function resetAlbumsPage()
{
    state.albumsPage = 1;
}

function getAlbumsPagination(
    totalCount
)
{
    const total =
        Math.max(
            0,
            Number(totalCount) || 0
        );

    const rowsPerPage =
        normalizeAlbumsRowsPerPage();

    state.albumsRowsPerPage =
        rowsPerPage;

    const totalPages =
        Math.max(
            1,
            Math.ceil(
                total / rowsPerPage
            )
        );

    const currentPage =
        Math.min(
            totalPages,
            Math.max(
                1,
                Math.trunc(
                    Number(state.albumsPage)
              || 1
                )
            )
        );

    /*
      * Clamp the stored page when deletions or filters
      * reduce the number of available pages.
      */
    state.albumsPage =
        currentPage;

    const startIndex =
        total
            ? (
                currentPage - 1
            ) * rowsPerPage
            : 0;

    const endIndex =
        Math.min(
            startIndex + rowsPerPage,
            total
        );

    return {
        totalCount:
          total,

        rowsPerPage,

        totalPages,

        currentPage,

        startIndex,

        endIndex,

        firstVisible:
          total
              ? startIndex + 1
              : 0,

        lastVisible:
          total
              ? endIndex
              : 0
    };
}

function getAlbumsListPage(
    photos = filteredAlbumPhotos()
)
{
    const source =
        Array.isArray(photos)
            ? photos
            : [];

    const pagination =
        getAlbumsPagination(
            source.length
        );

    return {
        pagination,

        photos:
          source.slice(
              pagination.startIndex,
              pagination.endIndex
          )
    };
}

function currentAlbumsPagePhotos()
{
    const photos =
        filteredAlbumPhotos();

    /*
      * Grid view remains unpaginated.
      */
    if (
        state.albumsViewMode !== 'list'
    )
    {
        return photos;
    }

    return getAlbumsListPage(
        photos
    ).photos;
}

function ensureSelectedAlbumPhotoOnListPage()
{
    if (
        state.albumsViewMode !== 'list'
    )
    {
        return;
    }

    const pagePhotos =
        currentAlbumsPagePhotos();

    const selectedIsOnPage =
        pagePhotos.some(photo =>
            photo.id === state.selectedPhotoId
        );

    if (selectedIsOnPage)
    {
        return;
    }

    const nextPhotoId =
        pagePhotos[0]?.id
        || null;

    if (
        nextPhotoId
          !== state.selectedPhotoId
    )
    {
        resetAlbumsPhotoEditState();
    }

    state.selectedPhotoId =
        nextPhotoId;
}

function renderAlbumsPagination(
    pagination
)
{
    if (
        pagination.totalPages <= 1
    )
    {
        return '';
    }

    /*
      * Reuse the existing pure page-token helper.
      * Do not rename or modify the People implementation.
      */
    const tokens =
        peoplePaginationTokens(
            pagination.currentPage,
            pagination.totalPages
        );

    return `
        <nav
          class="pagination"
          aria-label="Photo pages">

          <button
            class="
              page-button
              icon-rotate-left
            "
            type="button"
            data-albums-page="${
                pagination.currentPage - 1
            }"
            aria-label="Previous page"
            ${
                pagination.currentPage === 1
                    ? 'disabled'
                    : ''
            }>
            ${icon.chevron}
          </button>

          ${tokens.map(
                (token, index) =>
                {
                    if (
                        token === 'ellipsis'
                    )
                    {
                        return `
                  <span
                    class="pagination-ellipsis"
                    aria-hidden="true"
                    data-pagination-gap="${
                        index
                    }">
                    …
                  </span>
                `;
                    }

                    const active =
                        token
                  === pagination.currentPage;

                    return `
                <button
                  class="
                    page-button
                    ${active ? 'active' : ''}
                  "
                  type="button"
                  data-albums-page="${token}"
                  aria-label="Go to page ${token}"
                  ${
                        active
                            ? 'aria-current="page"'
                            : ''
                    }>
                  ${token}
                </button>
              `;
                }
            ).join('')}

          <button
            class="page-button"
            type="button"
            data-albums-page="${
                pagination.currentPage + 1
            }"
            aria-label="Next page"
            ${
                pagination.currentPage
                === pagination.totalPages
                    ? 'disabled'
                    : ''
            }>
            ${icon.chevron}
          </button>
        </nav>
      `;
}

function renderAlbumsListFooter(
    pagination
)
{
    const rangeLabel =
        pagination.totalCount
            ? `${
                pagination.firstVisible
            }–${
                pagination.lastVisible
            }`
            : '0';

    const noun =
        pagination.totalCount === 1
            ? 'photo'
            : 'photos';

    return `
        <div
          class="
            table-footer
            people-table-footer
            albums-list-footer
          ">

          <span
            class="people-table-footer-summary"
            aria-live="polite">
            Showing ${rangeLabel}
            of ${pagination.totalCount}
            ${noun}
          </span>

          ${renderAlbumsPagination(
                pagination
            )}

          <label
            class="people-rows-per-page"
            for="albumsRowsPerPage">

            <span
              class="people-rows-per-page-label">
              Rows per page
            </span>

            <span
              class="
                common-select-shell
                people-rows-select-shell
              ">

              <select
                class="
                  common-select
                  people-rows-select
                "
                id="albumsRowsPerPage"
                aria-label="Rows per page">

                ${ALBUMS_ROWS_PER_PAGE_OPTIONS
                    .map(option => `
                    <option
                      value="${option}"
                      ${
                            pagination.rowsPerPage
                          === option
                                ? 'selected'
                                : ''
                        }>
                      ${option}
                    </option>
                  `)
                    .join('')}
              </select>

              <span
                class="
                  common-select-chevron
                  people-rows-select-chevron
                "
                aria-hidden="true">
                ${icon.chevron}
              </span>
            </span>
          </label>
        </div>
      `;
}

function ensureSelectedAlbumPhoto()
{
    const visible =
        filteredAlbumPhotos();

    const currentIsVisible =
        visible.some(
            photo =>
                photo.id === state.selectedPhotoId
        );

    if (!currentIsVisible)
    {
        const nextPhotoId =
            visible[0]?.id
          || null;

        if (
            nextPhotoId
          !== state.selectedPhotoId
        )
        {
            resetAlbumsPhotoEditState();
        }

        state.selectedPhotoId =
            nextPhotoId;
    }

    const visibleIds =
        new Set(
            visible.map(photo => photo.id)
        );

    state.selectedPhotoIds =
        (state.selectedPhotoIds || [])
            .filter(
                id => visibleIds.has(id)
            );
}

function albumFilterCount(
    filters = state.albumsFilters
)
{
    const normalized =
        albumsFiltersWithDefaults(
            filters
        );

    return albumsFilterSchema
        .filter(definition =>
            sharedFilterValueIsActive(
                definition,
                normalized[
                    definition.key
                ]
            )
        )
        .length;
}

function albumsHaveActiveQuery()
{
    return Boolean(String(state.albumsSearch || '').trim() || albumFilterCount());
}

let albumsGridResizeObserver = null;
let albumsGridResizeFrame = null;

function disconnectAlbumsGridResizeObserver()
{
    albumsGridResizeObserver?.disconnect();
    albumsGridResizeObserver = null;
    if (albumsGridResizeFrame !== null)
    {
        cancelAnimationFrame(albumsGridResizeFrame);
        albumsGridResizeFrame = null;
    }
}

function updateAlbumsGridLayout()
{
    if (state.activeModule !== 'Albums' || state.albumsViewMode !== 'grid') return;
    const content = main.querySelector('.albums-content');
    if (!content?.querySelector('[data-albums-justified-grid]')) return;
    const photos = filteredAlbumPhotos();
    if (!photos.length) return;
    content.innerHTML = renderAlbumsGrid(photos);
    bindAlbumsCardControls(content);
}

function bindAlbumsGridResizeObserver()
{
    disconnectAlbumsGridResizeObserver();
    if (state.activeModule !== 'Albums' || state.albumsViewMode !== 'grid') return;
    const content = main.querySelector('.albums-content');
    if (!content?.querySelector('[data-albums-justified-grid]')) return;

    albumsGridResizeObserver = new ResizeObserver(entries =>
    {
        const width = entries[0]?.contentRect?.width;
        if (!Number.isFinite(width) || width <= 0) return;
        if (Math.abs(width - Number(state.albumsGridWidth || 0)) < 1.5) return;
        if (albumsGridResizeFrame !== null) cancelAnimationFrame(albumsGridResizeFrame);
        albumsGridResizeFrame = requestAnimationFrame(() =>
        {
            albumsGridResizeFrame = null;
            state.albumsGridWidth = width;
            updateAlbumsGridLayout();
        });
    });

    albumsGridResizeObserver.observe(content);
}

function renderAlbumsPreserveViewport({
    focusPhotoId = '',
    focusTarget = ''
} = {})
{
    const scrollSelector =
        innerWidth <= 900
            ? '.albums-main'
            : '.albums-content';

    const content =
        main.querySelector(scrollSelector);

    const detail =
        main.querySelector(
            '.albums-detail'
        );

    const detailScrollTop =
        detail?.scrollTop || 0;

    const scrollTop =
        content?.scrollTop || 0;

    const scrollLeft =
        content?.scrollLeft || 0;

    renderAlbums();

    requestAnimationFrame(() =>
    {
        const nextContent =
            main.querySelector(scrollSelector);

        if (nextContent)
        {
            const maximumTop =
                Math.max(
                    0,
                    nextContent.scrollHeight
              - nextContent.clientHeight
                );

            const nextDetail =
                main.querySelector(
                    '.albums-detail'
                );

            if (nextDetail)
            {
                const maximumDetailTop =
                    Math.max(
                        0,
                        nextDetail.scrollHeight
              - nextDetail.clientHeight
                    );

                nextDetail.scrollTop =
                    Math.min(
                        detailScrollTop,
                        maximumDetailTop
                    );
            }

            const maximumLeft =
                Math.max(
                    0,
                    nextContent.scrollWidth
              - nextContent.clientWidth
                );

            nextContent.scrollTop =
                Math.min(
                    scrollTop,
                    maximumTop
                );

            nextContent.scrollLeft =
                Math.min(
                    scrollLeft,
                    maximumLeft
                );
        }

        if (!focusPhotoId)
        {
            return;
        }

        const escapedPhotoId =
            CSS.escape(focusPhotoId);

        const focusSelectors = {
            card:
            `[data-photo-id="${escapedPhotoId}"]`,

            selection:
            `[data-photo-check="${escapedPhotoId}"]`,

            favorite:
            `.albums-main [data-photo-fav="${escapedPhotoId}"]`,

            favoriteDetail:
            `.albums-detail [data-photo-fav="${escapedPhotoId}"]`
        };

        const selector =
            focusSelectors[focusTarget]
          || focusSelectors.card;

        main
            .querySelector(selector)
            ?.focus({
                preventScroll: true
            });
    });
}

function renderAlbums()
{
    appNavigationObserve();
    disconnectAlbumsGridResizeObserver();

    const scrollKey =
        `${state.albumsView}:${state.activeAlbumId || ''}`;
    const previousMain =
        main.querySelector('.albums-main');
    const previousDetailScrollTop = main.querySelector('.albums-detail')?.scrollTop || 0;
    const mobileScrollTop =
        innerWidth <= 900
        && previousMain?.dataset.albumsScrollKey === scrollKey
            ? previousMain.scrollTop
            : 0;

    ensureSelectedAlbumPhoto();
    ensureSelectedAlbumPhotoOnListPage();

    const selectedPhoto =
        getPhoto(
            state.selectedPhotoId,
            {
                projectId:
              currentProjectId()
            }
        );

    if (!selectedPhoto)
    {
        resetAlbumsPhotoEditState();
        state.albumsNameEditingId = '';
    }

    const shellClasses = [
        'albums-shell',

        selectedPhoto
        && state.albumsDetailCollapsed
            ? 'detail-collapsed'
            : '',

        !selectedPhoto
            ? 'no-detail'
            : '',

        state.albumsDetailEditing
            ? 'photo-editing'
            : ''
    ]
        .filter(Boolean)
        .join(' ');

    /*
        Generate both panes before modifying the DOM.

        If a rendering function throws, the existing
        workspace stays intact instead of showing a
        new sidebar beside stale module content.
      */
    const nextSidebarMarkup =
        renderAlbumsSidebar();

    const nextMainMarkup = `
        <div class="${shellClasses}">
          <section class="albums-main" data-albums-scroll-key="${escapeHtml(scrollKey)}">
            ${renderAlbumsMainMarkup()}
          </section>

          ${
                !selectedPhoto
                    ? ''
                    : state.albumsDetailCollapsed
                        ? renderAlbumsDetailCollapsed()
                        : renderAlbumsDetailPane()
            }
        </div>
      `;

    sidebar.innerHTML =
        nextSidebarMarkup;

    main.innerHTML =
        nextMainMarkup;
    const nextDetail = main.querySelector('.albums-detail');
    if (nextDetail) nextDetail.scrollTop = previousDetailScrollTop;

    if (innerWidth <= 900 && mobileScrollTop)
    {
        main.querySelector('.albums-main').scrollTop = mobileScrollTop;
    }

    bindAlbumsSidebar();
    bindAlbumsControls();
    bindAlbumsGridResizeObserver();
}

function renderAlbumsSidebar()
{
    const projectAlbums =
        getProjectAlbums();

    return `
        <nav
          class="albums-sidebar"
          aria-label="Albums navigation">

          <div data-albums-tour-target="navigation">
            <div class="side-section-title">
              Navigation
            </div>

            <div class="side-nav">
              <button
                class="side-link ${
                    state.albumsView === 'all'
                        ? 'active'
                        : ''
                }"
                type="button"
                data-albums-view="all">

                ${icon.image}
                <span>All photos</span>
              </button>

              <button
                class="side-link ${
                    state.albumsView === 'favorites'
                        ? 'active'
                        : ''
                }"
                type="button"
                data-albums-view="favorites">

                ${icon.star}
                <span>Favourites</span>
              </button>

              <button
                class="side-link ${
                    state.albumsView === 'unassigned'
                        ? 'active'
                        : ''
                }"
                type="button"
                data-albums-view="unassigned">

                ${icon.folder}
                <span>Not in an album</span>
              </button>
            </div>
          </div>

          <div data-albums-tour-target="albums">
            <div
              class="
                side-section-title
                with-add
              ">

              <span>Albums</span>

              <button
                class="side-add-button"
                type="button"
                id="albumsNewAlbum"
                aria-label="Create album"
                title="Create album">

                ${icon.plus}
              </button>
            </div>

            <div class="side-nav">
              ${projectAlbums.length ? projectAlbums
                    .map(album =>
                    {
                        const isActive =
                            state.albumsView
                      === 'album'
                    && state.activeAlbumId
                      === album.id;

                        return `
                    <div
                      class="
                        sidebar-entity-row
                        ${
                            isActive
                                ? 'active'
                                : ''
                        }
                      ">

                      <button
                        class="
                          sidebar-entity-main
                        "
                        type="button"
                        data-album-open="${escapeHtml(
                            album.id
                        )}"
                        title="${escapeHtml(
                            album.name
                        )}">

                        ${icon.folder}

                        <span
                          class="
                            sidebar-entity-name
                          ">
                          ${escapeHtml(
                                album.name
                            )}
                        </span>
                      </button>

                      <button
                        class="
                          more-button
                          sidebar-entity-more
                        "
                        type="button"
                        data-album-menu="${escapeHtml(
                            album.id
                        )}"
                        aria-label="Actions for ${escapeHtml(
                            album.name
                        )}"
                        aria-haspopup="menu">

                        ${icon.more}
                      </button>
                    </div>
                  `;
                    })
                    .join('') : `<div class="sidebar-entity-empty">${escapeHtml(t('No albums yet'))}</div>`}
            </div>
          </div>

          <div class="tip-card albums-sidebar-tip">
            <div class="tip-title">
              ${icon.tip}
              <span>Tip of the day</span>
            </div>

            <p>
              Add people, dates, and places
              as you identify them. Even
              partial details make photos
              easier to find later.
            </p>

            <button
              class="link tip-link"
              type="button"
              data-toast="More photo organization guidance will be added later.">

              <span class="tip-link-text">
                Learn more
              </span>

              <span
                class="tip-link-icon"
                aria-hidden="true">

                ${icon.openlink}
              </span>
            </button>
          </div>
        </nav>
      `;
}

function renderAlbumsMainMarkup()
{
    const photos = filteredAlbumPhotos();
    const context = albumContext();
    const activeFilterCount = albumFilterCount();
    const activeFilters = renderAlbumsActiveFilterbar();
    const listPage =
        state.albumsViewMode === 'list'
            ? getAlbumsListPage(photos)
            : null;
    const visiblePhotos =
        listPage
            ? listPage.photos
            : photos;
    return `<header class="albums-header">
        <div class="albums-title"><h1 class="app-page-title">${escapeHtml(context.title)}</h1><p>${escapeHtml(context.subtitle)}</p></div>
        <div class="albums-header-actions">
          <button
            class="button primary"
            type="button"
            id="albumsAddPhotos"
            aria-label="Add photos"
            title="Add photos">

            ${icon.plus}
            <span>Add photos</span>
          </button>
        </div>
      </header>
      <div
        class="albums-toolbar"
        aria-label="Photo controls">

        <div class="albums-toolbar-left">
          <label
            class="app-search-field"
            aria-label="Search photos">
            ${icon.search}

            <input
              id="albumsSearch"
              type="search"
              value="${escapeHtml(state.albumsSearch || '')}"
              placeholder="Search photos...">
          </label>
          <button class="button primary albums-mobile-add-photos" type="button" id="albumsMobileAddPhotos" aria-label="${escapeHtml(t('Add photos'))}" title="${escapeHtml(t('Add photos'))}">
            ${icon.plus}<span class="albums-add-label-full">${escapeHtml(t('Add photos'))}</span><span class="albums-add-label-short">${escapeHtml(t('Add'))}</span>
          </button>
        </div>

        <div class="albums-toolbar-right">
          <button
            class="albums-filter-button ${
                activeFilterCount ? 'active' : ''
            }"
            type="button"
            id="albumsFilterButton"
            aria-label="${
                activeFilterCount
                    ? `Filters, ${activeFilterCount} active`
                    : 'Open photo filters'
            }"
            aria-expanded="false">
            <span
              class="albums-filter-icon"
              aria-hidden="true">
              ${
                    activeFilterCount
                        ? icon.filterclear
                        : icon.filter
                }
            </span>

            <span>Filters</span>

            ${
                activeFilterCount
                    ? `<span class="albums-filter-count">
                    ${activeFilterCount}
                  </span>`
                    : ''
            }
          </button>
          ${renderAppSortControl({
                id: 'albumsSort',
                field: state.albumsSort,
                direction: state.albumsSortDirection,
                ariaLabel: 'Sort photos',
                options: APP_SORT_OPTIONS.albums
            })}
          <div
            class="albums-view-switch"
            role="group"
            aria-label="View mode">

            <button
              class="toolbar-button albums-view-button ${
                    state.albumsViewMode === 'grid'
                        ? 'active'
                        : ''
                }"
              type="button"
              data-albums-mode="grid"
              aria-label="Grid view"
              aria-pressed="${
                    state.albumsViewMode === 'grid'
                }">
              ${icon.grid}
            </button>

            <button
              class="toolbar-button albums-view-button ${
                    state.albumsViewMode === 'list'
                        ? 'active'
                        : ''
                }"
              type="button"
              data-albums-mode="list"
              aria-label="List view"
              aria-pressed="${
                    state.albumsViewMode === 'list'
                }">
              ${icon.list}
            </button>
          </div>
        </div>
      </div>
      ${activeFilters}
      ${
            state.selectedPhotoIds.length
                ? renderAlbumsSelectionBar()
                : ''
        }
      <div class="albums-content">
        ${
            photos.length
                ? state.albumsViewMode === 'list'
                    ? renderAlbumsList(
                        visiblePhotos
                    )
                    : renderAlbumsGrid(
                        photos
                    )
                : renderAlbumsEmpty(
                    context
                )
        }

        ${
            listPage
          && photos.length
                ? renderAlbumsListFooter(
                    listPage.pagination
                )
                : ''
        }
      </div>`;
}

function renderAlbumsSelectionBar()
{
    const count =
        state.selectedPhotoIds.length;

    const selectAllAction =
        state.albumsViewMode
          === 'list'
            ? ''
            : `
              <button
                class="button secondary"
                type="button"
                id="albumsSelectAll">
                ${escapeHtml(t('Select all'))}
              </button>
            `;

    return `
        <div class="albums-selection-bar">
          <span class="albums-selection-copy">
            ${count} selected
          </span>

          <div class="albums-selection-actions">
            ${selectAllAction}

            <button
              class="button secondary"
              type="button"
              id="albumsAddSelectedToAlbum">
              Add to album
            </button>

            ${
                state.albumsView === 'album'
                    ? `
                  <button
                    class="button secondary"
                    type="button"
                    id="albumsRemoveFromCurrent">
                    Remove from album
                  </button>
                `
                    : ''
            }

            <button
              class="button danger"
              type="button"
              id="albumsDeleteSelected">
              Delete
            </button>

            <button
              class="button secondary"
              type="button"
              id="albumsCancelSelection">
              ${escapeHtml(t('Clear'))}
            </button>
          </div>
        </div>
      `;
}

function renderAlbumsPhotoCard(photo, selectedIds, width = 0)
{
    const names = getPhotoPeople(photo)
        .map(person => person.names?.display)
        .filter(Boolean);
    const selected = selectedIds.has(photo.id);
    const widthStyle = width > 0
        ? ` style="--albums-card-width:${width}px"`
        : '';

    return `<article class="album-photo-card ${state.selectedPhotoId === photo.id ? 'selected-detail' : ''} ${selected ? 'is-checked' : ''}"${widthStyle} tabindex="0" data-photo-id="${escapeHtml(photo.id)}" aria-selected="${selected}">
        <div class="albums-thumb">
          ${renderPhotoThumbnail(
                photo,
                {
                    label:
                photo.title
                }
            )}

          <button
            class="albums-check"
            type="button"
            data-photo-check="${escapeHtml(
                photo.id
            )}"
            aria-pressed="${selected}"
            aria-label="${
                selected
                    ? 'Deselect'
                    : 'Select'
            } ${escapeHtml(
                photo.title
            )}">

            ${
                selected
                    ? icon.check
                    : ''
            }
          </button>

          <button
            class="
              albums-fav-button
              ${
                    photo.favorite
                        ? 'active'
                        : ''
                }
            "
            type="button"
            data-photo-fav="${escapeHtml(
                photo.id
            )}"
            aria-pressed="${photo.favorite}"
            aria-label="${
                photo.favorite
                    ? 'Remove from favourites'
                    : 'Mark as favorite'
            }">

            ${icon.star}
          </button>
        </div>
        <div class="albums-card-body">
          <strong
            class="albums-card-title"
            title="${escapeHtml(
                photo.title || photo.filename
            )}">
            ${escapeHtml(
                photo.title || photo.filename
            )}
          </strong>

          <span class="albums-card-people">
            ${escapeHtml(
                names.join(', ')
              || 'No people tagged'
            )}
          </span>

          <div class="albums-card-footer">
            <span>
              ${escapeHtml(
                    formatPhotoDate(photo)
                )}
            </span>

            ${state.selectedPhotoId === photo.id ? `<button class="mobile-item-details" type="button" data-mobile-open-details>${icon.info}<span>${escapeHtml(t('Details'))}</span></button>` : ''}

            <button
              class="albums-card-more"
              type="button"
              data-photo-more="${escapeHtml(
                    photo.id
                )}"
              aria-label="Photo actions">
              ${icon.more}
            </button>
          </div>
        </div>
      </article>`;
}

function renderAlbumsGrid(photos)
{
    const selectedIds = new Set(state.selectedPhotoIds || []);
    const measuredWidth = Number(state.albumsGridWidth);
    const hasMeasuredWidth = Number.isFinite(measuredWidth) && measuredWidth > 0;

    if (!hasMeasuredWidth)
    {
        return `<div class="albums-justified-grid is-measuring" data-albums-justified-grid><div class="albums-justified-row">${photos.map(photo => renderAlbumsPhotoCard(photo, selectedIds)).join('')}</div></div>`;
    }

    const rows = buildJustifiedPhotoRows(photos, measuredWidth);
    return `<div class="albums-justified-grid" data-albums-justified-grid>${rows.map(row => `<div class="albums-justified-row ${row.justified ? 'is-justified' : 'is-incomplete'}" style="--albums-row-preview-height:${row.height}px">${row.items.map(item => renderAlbumsPhotoCard(item.photo, selectedIds, item.width)).join('')}</div>`).join('')}</div>`;
}

function renderAlbumsList(photos)
{
    const selectedIds =
        new Set(
            state.selectedPhotoIds || []
        );

    const header = `
        <div
          class="
            albums-list-row
            header
          "
          role="row">

          <input
            class="
              albums-select-checkbox
            "
            type="checkbox"
            data-albums-select-visible
            aria-label="
              Select all visible photos
            ">

          <span class="albums-mobile-select-all">${escapeHtml(t('Select all visible photos'))}</span>

          <span>Photo</span>
          <span>People</span>
          <span>Date</span>
          <span>Place</span>

          <span
            class="
              albums-list-favourite-heading
            "
            aria-label="Favorite"
            title="Favorite">
            ${icon.star}
          </span>

          <span
            aria-hidden="true">
          </span>
        </div>
      `;

    const rows =
        photos.map(photo =>
        {
            const selected =
                selectedIds.has(
                    photo.id
                );

            const title =
                photo.title
            || photo.filename
            || 'Untitled photo';

            const people =
                getPhotoPeople(photo)
                    .map(person =>
                        person.names?.display
                    )
                    .filter(Boolean)
                    .join(', ')
            || 'No people';

            const favoriteLabel =
                photo.favorite
                    ? 'Remove from favourites'
                    : 'Mark as favourite';

            const favoriteControl = `
            <button
              class="
                albums-list-favourite
                ${
                    photo.favorite
                        ? 'active'
                        : ''
                }
              "
              type="button"
              data-photo-fav="${
                    escapeHtml(photo.id)
                }"
              aria-pressed="${
                    photo.favorite
                        ? 'true'
                        : 'false'
                }"
              aria-label="${
                    escapeHtml(
                        favoriteLabel
                    )
                }"
              title="${
                    escapeHtml(
                        favoriteLabel
                    )
                }">
              ${icon.star}
            </button>
          `;

            return `
            <div
              class="
                albums-list-row
                ${
                    state.selectedPhotoId
                    === photo.id
                        ? 'selected-detail'
                        : ''
                }
                ${
                    selected
                        ? 'is-checked'
                        : ''
                }
              "
              role="row"
              tabindex="0"
              data-photo-id="${
                    escapeHtml(photo.id)
                }"
              aria-selected="${
                    selected
                        ? 'true'
                        : 'false'
                }">

              <input
                class="
                  albums-select-checkbox
                "
                type="checkbox"
                data-photo-check="${
                    escapeHtml(photo.id)
                }"
                aria-label="${
                    escapeHtml(
                        `${
                            selected
                                ? 'Deselect'
                                : 'Select'
                        } ${title}`
                    )
                }"
                ${
                    selected
                        ? 'checked'
                        : ''
                }>

              <span
                class="
                  albums-list-thumb
                ">
                ${renderPhotoThumbnail(
                    photo,
                    {
                        label: title
                    }
                )}
              </span>

              <span
                class="
                  albums-list-title
                ">
                <strong title="${escapeHtml(title)}">
                  ${escapeHtml(title)}
                </strong>

                <span>
                  ${escapeHtml(
                        formatMediaBytes(
                            photo.sizeBytes
                        )
                    )}
                </span>
              </span>

              <span class="albums-list-people"><span class="albums-mobile-cell-label">${escapeHtml(t('People'))}</span><span>${escapeHtml(people)}</span></span>

              <span class="albums-list-date"><span class="albums-mobile-cell-label">${escapeHtml(t('Date'))}</span><span>${escapeHtml(
                    formatPhotoDate(photo)
                )}</span></span>

              <span class="albums-list-place"><span class="albums-mobile-cell-label">${escapeHtml(t('Place'))}</span><span>${escapeHtml(
                    getPlaceDisplay(
                        photo.placeId
                    )
                  || photo.placeText
                  || 'Unknown'
                )}</span></span>

              ${favoriteControl}

              <button
                class="albums-row-more"
                type="button"
                data-photo-more="${
                    escapeHtml(photo.id)
                }"
                aria-label="${
                    escapeHtml(
                        `Actions for ${title}`
                    )
                }"
                aria-haspopup="menu">
                ${icon.more}
              </button>
            </div>
          `;
        }).join('');

    return `
        <div
          class="albums-list"
          role="table"
          aria-label="Photos">
          ${header}
          ${rows}
        </div>
      `;
}

function renderAlbumsEmpty(
    context
)
{
    const filtered =
        albumsHaveActiveQuery();

    const copy =
        filtered
            ? 'Try a different search or clear the active filters.'
            : 'Add a photo to begin organizing this collection.';

    const action =
        filtered
            ? `
            <button
              class="button secondary"
              type="button"
              id="albumsEmptyClear">
              Clear search and filters
            </button>
          `
            : `
            <button
              class="button primary"
              type="button"
              id="albumsEmptyAction">
              Add photos
            </button>
          `;

    return `
        <div class="albums-empty">
          <div class="albums-empty-card">
            ${icon.image}

            <h2>
              ${escapeHtml(
                    context.empty
                )}
            </h2>

            <p>
              ${escapeHtml(copy)}
            </p>

            ${action}
          </div>
        </div>
      `;
}

function albumsDetailSectionIsOpen(id)
{
    return state.albumsDetailSections?.[id] !== false;
}

function renderAlbumsDetailSection(
    id,
    title,
    content,
    actionHtml = '',
    meta = ''
)
{
    return renderInspectorSection(
        id,
        title,
        meta,
        content,
        actionHtml,
        {
            inlineAction:
            Boolean(actionHtml),

            alwaysShowAction:
            true,

            open:
            albumsDetailSectionIsOpen(
                id
            ),

            toggleAttribute:
            'data-albums-section-toggle',

            sectionId:
            `albums-detail-section-${id}`
        }
    );
}

function albumPhotoEditDraftFromPhoto(photo)
{
    return {
        photoId: photo.id,

        date: {
            ...photoDateModel(photo)
        },

        placeId:
          photo.placeId
          || '',

        placeText:
          photo.placeText
          || '',

        caption:
          photo.caption
          || ''
    };
}

function normalizedAlbumPhotoEditDraft(draft)
{
    return {
        date:
          mediaDateFromGenealogyModel(
              draft?.date || {}
          ),

        placeId:
          String(draft?.placeId || ''),

        placeText:
          String(draft?.placeText || '')
              .trim(),

        caption:
          String(draft?.caption || '')
              .trim()
    };
}

function collectAlbumsPhotoEditDraft()
{
    if (!state.albumsDetailEditing)
    {
        return null;
    }

    const date =
        collectGenealogyDateField(
            'albumPhotoDate'
        );

    if (!date)
    {
        return null;
    }

    const place =
        readPlaceInputValue(
            '#albumPhotoPlace',
            main
        ) || {
            text: '',
            selectedPlaceId: ''
        };

    const selectedPlace = place.selectedPlaceId
        ? getPlace(place.selectedPlaceId) : null;
    const unchangedSelectedPlace = selectedPlace
        && normalizePlaceLookupText(place.text)
            === normalizePlaceLookupText(placeDisplayText(selectedPlace));

    return {
        photoId:
          state.selectedPhotoId,

        date,

        placeId:
          place.selectedPlaceId
          || '',

        placeText:
          unchangedSelectedPlace
              ? (state.albumsDetailEditOriginal?.placeText || '')
              : place.text
          || '',

        caption:
          collectLocalizedDataFieldValue(
              main.querySelector(
                  '#albumPhotoCaption'
              ),
              main.querySelector(
                  '#albumPhotoCaption'
              )?.dataset.sourceValue
              || ''
          ).trim()
    };
}

function syncAlbumsPhotoEditDraftFromPane()
{
    const draft =
        collectAlbumsPhotoEditDraft();

    if (draft)
    {
        state.albumsDetailDraft = draft;
    }
}

function albumsPhotoEditIsDirty()
{
    if (
        !state.albumsDetailEditing
        || !state.albumsDetailEditOriginal
    )
    {
        return false;
    }

    const current =
        collectAlbumsPhotoEditDraft()
        || state.albumsDetailDraft;

    if (!current)
    {
        return true;
    }

    return JSON.stringify(
        normalizedAlbumPhotoEditDraft(current)
    ) !== JSON.stringify(
        normalizedAlbumPhotoEditDraft(
            state.albumsDetailEditOriginal
        )
    );
}

function resetAlbumsPhotoEditState()
{
    state.albumsDetailEditing = false;
    state.albumsDetailEditOriginal = null;
    state.albumsDetailDraft = null;
}

function beginAlbumsPhotoEdit()
{
    const photo = getPhoto(
        state.selectedPhotoId,
        {
            projectId: currentProjectId()
        }
    );

    if (!photo)
    {
        return;
    }

    const draft =
        albumPhotoEditDraftFromPhoto(photo);

    state.albumsDetailEditing = true;
    state.albumsDetailEditOriginal = {
        ...draft,
        date: { ...draft.date }
    };
    state.albumsDetailDraft = {
        ...draft,
        date: { ...draft.date }
    };

    state.albumsDetailSections.details =
        true;

    renderAlbums();
    requestAnimationFrame(() => main.querySelector('#albumPhotoDateInput')?.focus({ preventScroll: true }));
}

function cancelAlbumsPhotoEdit()
{
    runAfterAlbumsPhotoEditGuard(() =>
    {
        resetAlbumsPhotoEditState();
        renderAlbums();
        requestAnimationFrame(() => main.querySelector('#albumsEditPhoto')?.focus({ preventScroll: true }));
    });
}

function saveAlbumsPhotoEdit()
{
    const photo = getPhoto(
        state.selectedPhotoId,
        {
            projectId: currentProjectId()
        }
    );

    if (!photo)
    {
        resetAlbumsPhotoEditState();
        renderAlbums();
        return;
    }

    const draft =
        collectAlbumsPhotoEditDraft();

    if (!draft)
    {
        showToast(
            'Check the historical date before saving.'
        );
        return;
    }

    photo.date =
        mediaDateFromGenealogyModel(
            draft.date
        );

    const placeInput = readPlaceInputValue('#albumPhotoPlace', main);
    const place = resolvePlaceInputValue(
        placeInput.text,
        placeInput.selectedPlaceId,
        placeInput.address,
        { projectId: placeInput.projectId, coordinates: placeInput.coordinates }
    );
    photo.placeId = place.placeId || null;
    photo.placeText = place.placeText || '';

    photo.caption =
        draft.caption
        || '';

    photo.updatedAt =
        new Date().toISOString();

    resetAlbumsPhotoEditState();
    renderAlbums();
    requestAnimationFrame(() => main.querySelector('#albumsEditPhoto')?.focus({ preventScroll: true }));
    showToast('Photo updated.');
}

function runAfterAlbumsPhotoEditGuard(
    action
)
{
    if (state.albumsNameEditingId)
    {
        const input = main.querySelector('#albumsPhotoNameInput');
        const value = input?.value.trim() || '';
        if (value !== state.albumsNameOriginal)
        {
            openModal(`<div class="modal" role="dialog" aria-modal="true" aria-labelledby="discardPhotoNameTitle"><div class="modal-header"><h2 id="discardPhotoNameTitle">${escapeHtml(t('Discard changes?'))}</h2></div><div class="modal-body"><p>${escapeHtml(t('Your unsaved photo name will be lost.'))}</p></div><div class="modal-footer"><button class="button secondary" type="button" data-close>${escapeHtml(t('Continue editing'))}</button><button class="button danger" type="button" data-discard-photo-name>${escapeHtml(t('Discard changes'))}</button></div></div>`);
            modalBackdrop.querySelector('[data-discard-photo-name]')?.addEventListener('click', () =>
            {
                closeModal();
                state.albumsNameEditingId = '';
                state.albumsNameOriginal = '';
                action();
            });
            return;
        }
        state.albumsNameEditingId = '';
        state.albumsNameOriginal = '';
        action();
        return;
    }
    if (!state.albumsDetailEditing)
    {
        action();
        return;
    }

    if (!albumsPhotoEditIsDirty())
    {
        resetAlbumsPhotoEditState();
        action();
        return;
    }

    openModal(`
        <div
          class="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="discardPhotoEditTitle">

          <div class="modal-header">
            <div>
              <h2 id="discardPhotoEditTitle">
                Discard photo changes?
              </h2>

              <p>
                Your unsaved detail changes will be lost.
              </p>
            </div>

            <button
              class="close-button"
              type="button"
              data-close>
              ${icon.close}
            </button>
          </div>

          <div class="modal-footer">
            <button
              class="button secondary"
              type="button"
              data-close>
              Continue editing
            </button>

            <button
              class="button danger"
              type="button"
              data-discard-photo-edit>
              Discard changes
            </button>
          </div>
        </div>
      `);

    modalBackdrop
        .querySelector(
            '[data-discard-photo-edit]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                closeModal();
                resetAlbumsPhotoEditState();
                action();
            }
        );
}

function beginAlbumsPhotoRename()
{
    const photo = getPhoto(state.selectedPhotoId, { projectId: currentProjectId() });
    if (!photo) return;
    state.albumsNameEditingId = photo.id;
    state.albumsNameOriginal = photo.title || photo.filename || '';
    renderAlbums();
    requestAnimationFrame(() => main.querySelector('#albumsPhotoNameInput')?.focus({ preventScroll: true }));
}

function saveAlbumsPhotoRename()
{
    const photo = getPhoto(state.albumsNameEditingId, { projectId: currentProjectId() });
    const input = main.querySelector('#albumsPhotoNameInput');
    const name = collectLocalizedDataFieldValue(input, input?.dataset.sourceValue || '').trim();
    if (!photo || !name)
    {
        input?.focus();
        showToast(t('Enter a photo name before saving.'));
        return;
    }
    photo.title = name;
    photo.updatedAt = new Date().toISOString();
    state.albumsNameEditingId = '';
    state.albumsNameOriginal = '';
    renderAlbums();
    requestAnimationFrame(() => main.querySelector('#albumsRenamePhoto')?.focus({ preventScroll: true }));
    showToast(t('Photo updated.'));
}

function knownPersonDateLabel(value)
{
    const label =
        cleanGenealogyDateText(
            formatGenealogyDateLabel(value)
        );

    if (
        !label
        || /^unknown/i.test(label)
    )
    {
        return '';
    }

    return label;
}

function albumPhotoPersonDates(person)
{
    const birth =
        knownPersonDateLabel(person?.birth);

    const death =
        knownPersonDateLabel(person?.death);

    const status =
        normalizeLivingStatus(
            person?.livingStatus
        );

    if (birth && death)
    {
        return `${birth} – ${death}`;
    }

    if (
        birth
        && status === 'Living'
    )
    {
        return `${birth} – Living`;
    }

    if (birth)
    {
        return `Born ${birth}`;
    }

    if (death)
    {
        return `Died ${death}`;
    }

    return 'Dates unknown';
}

function formatMediaFileType(photo)
{
    const mimeType =
        String(photo?.mimeType || '');

    const subtype =
        mimeType
            .split('/')
            .pop()
            .toLowerCase();

    const labels = {
        jpeg: 'JPEG',
        jpg: 'JPEG',
        png: 'PNG',
        gif: 'GIF',
        webp: 'WebP',
        tiff: 'TIFF',
        heic: 'HEIC'
    };

    return labels[subtype]
        || subtype.toUpperCase()
        || 'Unknown';
}

function renderAlbumsPhotoToolbar(
    photo,
    editing
)
{
    const collapseButton = `
        <button
          class="
            people-collapse-button
            people-sidebar-toggle-icon
            albums-detail-collapse
          "
          type="button"
          data-albums-detail-toggle
          aria-label="Collapse photo inspector">

          ${icon.doublechevronSidebar}
        </button>
      `;

    if (editing)
    {
        return `
          <div class="albums-detail-toolbar">
            ${collapseButton}
          </div>
        `;
    }

    return `
        <div class="albums-detail-toolbar">
          ${collapseButton}

          <span
            class="
              albums-detail-toolbar-spacer
            ">
          </span>

          <button
            class="
              albums-detail-action
              ${
                    photo.favorite
                        ? 'active'
                        : ''
                }
            "
            type="button"
            data-photo-fav="${escapeHtml(
                photo.id
            )}"
            aria-label="${
                photo.favorite
                    ? 'Remove from favourites'
                    : 'Mark as favorite'
            }"
            aria-pressed="${photo.favorite}"
            title="${
                photo.favorite
                    ? 'Remove from favourites'
                    : 'Mark as favorite'
            }">

            ${icon.star}
          </button>

          <button
            class="albums-detail-action"
            type="button"
            id="albumsInspectorMore"
            aria-label="More photo actions"
            aria-haspopup="menu">

            ${icon.more}
          </button>
        </div>
      `;
}

function renderAlbumsPhotoHero(
    photo,
    editing
)
{
    const summaryHtml = `<p class="albums-detail-summary">${escapeHtml(`${photo.width || 0} × ${photo.height || 0} · ${formatMediaBytes(photo.sizeBytes)}`)}</p>`;
    return `
        <div class="albums-detail-hero">
          <button
            class="
              albums-detail-preview-button
            "
            type="button"
            data-photo-open="${escapeHtml(
                photo.id
            )}"
            aria-label="Open full-size preview of ${escapeHtml(
                photo.title
              || photo.filename
              || 'photo'
            )}">

            ${renderPhotoThumbnail(
                photo,
                {
                    className:
                  'albums-detail-preview',

                    label:
                  photo.title
                  || photo.filename
                }
            )}
            <span class="albums-face-highlight" data-albums-face-highlight hidden aria-hidden="true"></span>
          </button>

          <button
            class="
              button
              secondary
              albums-detail-open
            "
            type="button"
            data-photo-open="${escapeHtml(
                photo.id
            )}">
            Open preview
          </button>

          <div class="albums-detail-identity">
            ${state.albumsNameEditingId === photo.id ? `
              <div class="inspector-name-editor">
                <input id="albumsPhotoNameInput" maxlength="180" aria-label="${escapeHtml(t('Photo name'))}" data-source-value="${escapeHtml(state.albumsNameOriginal || '')}" value="${escapeHtml(localizedDataFieldValue(state.albumsNameOriginal || ''))}">
                <div class="inspector-name-editor-footer">${summaryHtml}<div class="inspector-name-editor-actions">
                  <button class="inspector-name-edit-button inspector-name-save" type="button" id="albumsSavePhotoName">${icon.check}<span>${escapeHtml(t('Save'))}</span></button>
                  <button class="inspector-name-edit-button inspector-name-cancel" type="button" id="albumsCancelPhotoName">${icon.close}<span>${escapeHtml(t('Cancel'))}</span></button>
                </div></div>
              </div>` : `
              <div class="inspector-name-heading"><h2 title="${escapeHtml(photo.title || photo.filename || 'Untitled photo')}">${escapeHtml(photo.title || photo.filename || 'Untitled photo')}</h2><button class="inspector-name-command" type="button" id="albumsRenamePhoto" aria-label="${escapeHtml(t('Rename photo'))}" title="${escapeHtml(t('Rename photo'))}">${icon.edit}</button></div>${summaryHtml}`}

          </div>
        </div>
      `;
}

function renderAlbumsPhotoDetails(
    photo,
    editing
)
{
    if (editing)
    {
        const draft =
            state.albumsDetailDraft
          || albumPhotoEditDraftFromPhoto(photo);

        return `
          <div class="albums-form-grid">
            ${renderGenealogyDateField(
                'albumPhotoDate',
                'Date',
                draft.date,
                {
                    inputId:
                  'albumPhotoDateInput',
                    typeId:
                  'albumPhotoDateType',
                    defaultDateType:
                  'Exact date',
                    className:
                  'genealogy-date-inline-range'
                }
            )}

            ${renderPlaceCombobox({
                id: 'albumPhotoPlace',
                label: 'Place',
                value:
                getPlaceDisplay(
                    draft.placeId
                )
                || draft.placeText
                || '',
                selectedPlaceId:
                draft.placeId
                || '',
                showAddress: false,
                className: 'full'
            })}

            <div class="albums-field">
              <label for="albumPhotoCaption">
                ${escapeHtml(t('Details'))}
              </label>

              <textarea
                id="albumPhotoCaption"
                maxlength="500"
                data-source-value="${escapeHtml(draft.caption || '')}"
                placeholder="${escapeHtml(t('Add details'))}">${escapeHtml(
                    localizedDataFieldValue(
                        draft.caption || ''
                    )
                )}</textarea>
            </div>
            <div class="details-edit-actions">
              <button class="button secondary" type="button" id="albumsCancelPhotoEdit">${escapeHtml(t('Cancel'))}</button>
              <button class="button primary" type="button" id="albumsSavePhotoEdit">${escapeHtml(t('Save changes'))}</button>
            </div>
          </div>
        `;
    }

    const caption =
        String(photo.caption || '').trim()
        || t('Not recorded');

    return `
        <dl class="albums-detail-read-list">
          <div class="albums-detail-read-row">
            <dt>Date</dt>

            <dd>
              ${escapeHtml(
                    formatPhotoDate(photo)
                )}
            </dd>
          </div>

          <div class="albums-detail-read-row">
            <dt>Place</dt>

            <dd>
              ${escapeHtml(
                    getPlaceDisplay(photo.placeId)
                || photo.placeText
                || 'Unknown place'
                )}
            </dd>
          </div>

          <div class="albums-detail-read-row">
            <dt>${escapeHtml(t('Details'))}</dt>

            <dd class="albums-detail-read-caption">${escapeHtml(caption)}</dd>
          </div>
        </dl>
      `;
}

function renderAlbumsPhotoPeople(
    photo,
    readOnly
)
{
    const people =
        getPhotoPeople(photo);

    if (!people.length)
    {
        return renderInspectorSectionEmpty(
            'No people tagged on this photo.'
        );
    }

    return `
        <div class="relationship-list">
          ${people.map(person =>
            {
                const name =
                    person.names?.display
              || 'Unnamed person';

                const mainContent = `
              ${renderPersonAvatar(
                    person,
                    'small-avatar',
                    {
                        element: 'span'
                    }
                )}

              <span class="relation-row-copy">
                <strong>
                  ${escapeHtml(name)}
                </strong>

                <span>
                  ${escapeHtml(
                        albumPhotoPersonDates(
                            person
                        )
                    )}
                </span>
              </span>
            `;

                return `
              <div class="relation-row" data-albums-person-region="${escapeHtml(person.id)}">
                ${
                    readOnly
                        ? `
                      <div class="relation-row-main">
                        ${mainContent}
                      </div>
                    `
                        : `
                      <button
                        class="relation-row-main"
                        type="button"
                        data-photo-person-open="${escapeHtml(person.id)}"
                        aria-label="Open profile for ${escapeHtml(name)}">
                        ${mainContent}
                      </button>
                    `
                }

                ${
                    readOnly
                        ? ''
                        : `
                      <div class="relation-actions">
                        <button
                          class="relation-action-button"
                          type="button"
                          data-albums-photo-person-menu="${escapeHtml(person.id)}"
                          aria-label="Actions for ${escapeHtml(name)}"
                          aria-haspopup="menu">
                          ${icon.more}
                        </button>
                      </div>
                    `
                }
              </div>
            `;
            }).join('')}
        </div>
      `;
}

function renderAlbumsPhotoAlbums(
    photo,
    readOnly
)
{
    const albums =
        (photo.albumIds || [])
            .map(id => ({
                id,
                name: getAlbumName(id)
            }))
            .filter(album => album.name);

    if (!albums.length)
    {
        return renderInspectorSectionEmpty(
            'This photo is not in an album.'
        );
    }

    return `
        <div class="albums-inspector-list">
          ${albums.map(album => `
            <div class="albums-inspector-row">
              ${
                    readOnly
                        ? `
                    <div class="albums-inspector-row-main">
                      ${icon.folder}

                      <span class="albums-inspector-row-name">
                        ${escapeHtml(album.name)}
                      </span>
                    </div>
                  `
                        : `
                    <button
                      class="albums-inspector-row-main"
                      type="button"
                      data-photo-album-open="${escapeHtml(album.id)}"
                      aria-label="Open ${escapeHtml(album.name)}">
                      ${icon.folder}

                      <span class="albums-inspector-row-name">
                        ${escapeHtml(album.name)}
                      </span>
                    </button>

                    <button
                      class="albums-inspector-remove"
                      type="button"
                      data-photo-remove-album="${escapeHtml(album.id)}"
                      aria-label="Remove photo from ${escapeHtml(album.name)}"
                      title="Remove from album">
                      ${icon.close}
                    </button>
                  `
                }
            </div>
          `).join('')}
        </div>
      `;
}

function renderConnectedNotesFooter({
    contextType,
    contextId,
    count
})
{
    if (!contextId || !count) return '';

    const label = translateText(
        `View all ${count} ${count === 1 ? 'note' : 'notes'}`
    );

    return `
        <div class="panel-section-footer">
          <button
            class="panel-section-view-all"
            type="button"
            data-connected-notes-view-all
            data-notes-context-type="${escapeHtml(contextType)}"
            data-notes-context-id="${escapeHtml(contextId)}">

            <span>${escapeHtml(label)}</span>

            <span
              class="panel-section-view-all-icon"
              aria-hidden="true">
              ${icon.chevron}
            </span>
          </button>
        </div>
      `;
}

function bindConnectedNotesFooters(root)
{
    root?.querySelectorAll('[data-connected-notes-view-all]')
        .forEach(button =>
        {
            button.onclick = event =>
            {
                event.preventDefault();
                event.stopPropagation();

                openNotesForContext(
                    button.dataset.notesContextType,
                    button.dataset.notesContextId
                );
            };
        });
}

function renderAlbumsPhotoNotes(
    photo,
    notes = getNotesForPhoto(photo.id, {
        projectId: photo.projectId,
        includeArchived: false
    })
)
{
    if (!notes.length)
    {
        return renderInspectorSectionEmpty(
            'No notes linked to this photo.'
        );
    }

    const items = renderConnectedNoteList({
        notes,
        contextType: 'photo',
        contextId: photo.id,
        emptyText: 'No notes linked to this photo.',
        allowUnlink: true
    });

    return `
        ${items}

        ${renderConnectedNotesFooter({
            contextType: 'photo',
            contextId: photo.id,
            count: notes.length
        })}
      `;
}

function openAlbumsPhotoNotesModal(
    photoId =
        state.selectedPhotoId
)
{
    const photo =
        getPhoto(
            photoId,
            {
                projectId:
              currentProjectId()
            }
        );

    if (!photo)
    {
        return;
    }

    /*
        Albums currently exposes only active Notes
        for normal linking. Archived Note links are
        preserved because this modal is additive and
        never removes existing relationships.
      */
    const existingNoteIds =
        getNotesForPhoto(
            photo.id,
            {
                projectId:
              photo.projectId,

                includeArchived:
              false
            }
        ).map(note =>
            note.id
        );

    const photoLabel =
        photo.title
        || photo.filename
        || 'this photo';

    openNoteLinkPickerModal({
        projectId:
          photo.projectId,

        title:
          'Add note',

        description:
          `Link existing notes to “${photoLabel}”.`,

        existingNoteIds,

        /*
          Preserve the current Albums rule:
          archived Notes are not offered for
          new photo links.
        */
        includeArchived:
          false,

        existingStatus:
          'Already linked',

        existingMetaLabel:
          'already linked',

        createLabel:
          'Create linked note',

        /*
          Retains the existing Albums capability
          to create a new Note already connected
          to the selected photo.
        */
        onCreate:
          () =>
              openNewNoteForContext(
                  'photo',
                  photo.id
              ),

        onSave:
          selectedNoteIds =>
          {
              const currentPhoto =
                  getPhoto(
                      photo.id,
                      {
                          projectId:
                    photo.projectId
                      }
                  );

              if (!currentPhoto)
              {
                  return false;
              }

              selectedNoteIds.forEach(
                  noteId =>
                  {
                      const note =
                          getNote(
                              noteId,
                              {
                                  projectId:
                        photo.projectId,

                                  includeArchived:
                        false
                              }
                          );

                      if (!note)
                      {
                          return;
                      }

                      setNotePhotoLinks(
                          note.id,
                          [
                              ...new Set([
                                  ...(
                                      note.linkedPhotoIds
                        || []
                                  ),

                                  photo.id
                              ])
                          ],
                          {
                              projectId:
                      photo.projectId
                          }
                      );
                  }
              );

              return true;
          },

        afterSave:
          renderAlbumsPreserveViewport,

        successMessage:
          count =>
              `${count} ${
                  count === 1
                      ? 'note was'
                      : 'notes were'
              } linked to the photo.`
    });
}

function renderAlbumsPhotoSources(
    photo
)
{
    return renderConnectedSourceList({
        targetType:
          'photo',

        targetId:
          photo.id,

        projectId:
          photo.projectId,

        emptyText:
          'No sources linked to this photo.'
    });
}

function renderAlbumsPhotoMetadata(photo)
{
    const rows = [
        [
            'File name',
            photo.filename
          || 'Unknown'
        ],
        [
            'File format',
            formatMediaFileType(photo)
        ],
        [
            'Dimensions',
            `${photo.width || 0} × ${
                photo.height || 0
            }`
        ],
        [
            'File size',
            formatMediaBytes(
                photo.sizeBytes
            )
        ],
        [
            'Added',
            formatMediaTimestamp(
                photo.createdAt
            )
        ],
        [
            'Last modified',
            formatMediaTimestamp(
                photo.updatedAt
            )
        ]
    ];

    return `
        <div class="albums-metadata-list">
          ${rows.map(([label, value]) => `
            <div class="albums-metadata-row">
              <span>${escapeHtml(label)}</span>
              <strong>${escapeHtml(value)}</strong>
            </div>
          `).join('')}
        </div>
      `;
}

function renderAlbumsDetailCollapsed()
{
    return `
        <aside
          class="albums-detail collapsed"
          aria-label="Collapsed photo inspector">

          <button
            class="people-collapse-button
              person-sidebar-restore-button
              albums-detail-restore
              sidebar-toggle-icon
              sidebar-toggle-icon-restore"
            type="button"
            data-albums-detail-toggle
            aria-label="Show photo inspector">
            ${icon.doublechevronSidebar}
          </button>
        </aside>
      `;
}

function renderAlbumsDetailPane()
{
    const photo =
        getPhoto(
            state.selectedPhotoId,
            {
                projectId:
              currentProjectId()
            }
        );

    if (!photo)
    {
        return '';
    }

    if (
        state.albumsDetailEditing
        && state.albumsDetailDraft
            ?.photoId !== photo.id
    )
    {
        resetAlbumsPhotoEditState();
    }

    const editing =
        state.albumsDetailEditing
        && state.albumsDetailDraft
            ?.photoId === photo.id;

    const actionsLocked =
        editing;

    const photoNotes =
        getNotesForPhoto(
            photo.id,
            {
                projectId:
              photo.projectId,

                includeArchived:
              false
            }
        );

    const photoSources =
        sourcesForTarget(
            'photo',
            photo.id,
            photo.projectId
        );

    const peopleCount =
        getPhotoPeople(photo).length;

    const albumCount =
        (photo.albumIds || [])
            .filter(id => getAlbumName(id))
            .length;

    const peopleAction =
        actionsLocked
            ? ''
            : `
            <button
              class="link"
              type="button"
              id="albumsTagPeople">

              ${renderPanelButtonLabel(
                    icon.plus,
                    'Tag person'
                )}
            </button>
          `;

    const albumAction =
        actionsLocked
            ? ''
            : `
            <button
              class="link"
              type="button"
              id="albumsLinkAlbum">

              ${renderPanelButtonLabel(
                    icon.plus,
                    'Add to album'
                )}
            </button>
          `;

    const notesAction =
        actionsLocked
            ? ''
            : `
            <button
              class="link"
              type="button"
              id="albumsManagePhotoNotes">

              ${renderPanelButtonLabel(
                    icon.plus,
                    'Add note'
                )}
            </button>
          `;

    const sourceAction =
        actionsLocked
            ? ''
            : `
            <button
              class="link"
              type="button"
              id="albumsManagePhotoSources">

              ${renderPanelButtonLabel(
                    icon.plus,
                    'Add source'
                )}
            </button>
          `;

    return `
        <aside
          class="
            albums-detail
            ${editing ? 'is-editing' : ''}
          "
          aria-label="Photo inspector"
          ${
                editing
                    ? 'data-albums-photo-edit-root'
                    : ''
            }>

          ${renderAlbumsPhotoToolbar(
                photo,
                editing
            )}

          ${renderAlbumsPhotoHero(
                photo,
                editing
            )}

          ${renderAlbumsDetailSection(
                'details',
                'Details',
                renderAlbumsPhotoDetails(
                    photo,
                    editing
                ),
                editing ? '' : `<button class="link" type="button" id="albumsEditPhoto">${renderPanelButtonLabel(icon.edit, 'Edit')}</button>`
            )}

          ${renderAlbumsDetailSection(
                'people',
                'People',
                renderAlbumsPhotoPeople(
                    photo,
                    actionsLocked
                ),
                peopleAction,
                `${peopleCount} ${
                    peopleCount === 1
                        ? 'person'
                        : 'people'
                }`
            )}

          ${renderAlbumsDetailSection(
                'albums',
                'Albums',
                renderAlbumsPhotoAlbums(
                    photo,
                    actionsLocked
                ),
                albumAction,
                `${albumCount} ${
                    albumCount === 1
                        ? 'album'
                        : 'albums'
                }`
            )}

          ${renderAlbumsDetailSection(
                'notes',
                'Notes',
                renderAlbumsPhotoNotes(
                    photo,
                    photoNotes
                ),
                notesAction,
                `${photoNotes.length} ${
                    photoNotes.length === 1
                        ? 'note'
                        : 'notes'
                }`
            )}

          ${renderAlbumsDetailSection(
                'sources',
                'Sources',
                renderAlbumsPhotoSources(
                    photo
                ),
                sourceAction,
                `${photoSources.length} ${
                    photoSources.length === 1
                        ? 'source'
                        : 'sources'
                }`
            )}

          ${renderAlbumsDetailSection(
                'metadata',
                'Metadata',
                renderAlbumsPhotoMetadata(
                    photo
                )
            )}
          <div class="albums-face-floating-preview" data-albums-face-floating hidden aria-hidden="true">
            ${renderPhotoThumbnail(photo, { className: 'albums-detail-preview', label: photo.title || photo.filename })}
            <span class="albums-face-highlight" data-albums-face-highlight></span>
          </div>
        </aside>
      `;
}

function renderAlbumsActiveFilterbar()
{
    const filters =
        state.albumsFilters
        || defaultAlbumFilters;

    const chips = [];
    if (filters.sourceId)
    {
        chips.push([
            'sourceId',
            archiveSourceById(filters.sourceId)?.title
            || translateText('Source')
        ]);
    }
    if (filters.personId)
    {
        chips.push([
            'personId',
            filters.personId === 'none'
                ? 'No people tagged'
                : getPersonDisplayName(
                    filters.personId
                )
        ]);
    }

    if (filters.placeId)
    {
        chips.push([
            'placeId',
            filters.placeId === 'none'
                ? 'No known place'
                : getPlaceDisplay(
                    filters.placeId
                )
        ]);
    }

    if (filters.dateRange)
    {
        chips.push([
            'dateRange',
            filters.dateRange === 'dated'
                ? 'Known date'
                : 'Unknown date'
        ]);
    }

    if (filters.favouriteOnly)
    {
        chips.push([
            'favouriteOnly',
            'Favourites only'
        ]);
    }

    if (!chips.length)
    {
        return '';
    }

    const chipMarkup = chips
        .map(([key, label]) => `
          <span
            class="filter-chip active-filter-chip">

            <span class="active-filter-chip-copy">
              ${escapeHtml(label)}
            </span>

            <button
              class="active-filter-chip-remove"
              type="button"
              data-albums-remove-filter="${escapeHtml(key)}"
              aria-label="Remove ${escapeHtml(label)} filter"
              title="Remove filter">
              ${icon.close}
            </button>
          </span>
        `)
        .join('');

    return `
        <div
          class="albums-active-filterbar"
          aria-label="Active Albums filters">

          ${chipMarkup}

          <span class="active-filter-actions">
            <button
              class="link"
              type="button"
              id="albumsClearFilters">
              Clear all
            </button>
          </span>
        </div>
      `;
}

let albumsFilterReturnFocus =
    null;

function closeAlbumsFilterPopover({
    restoreFocus = false
} = {})
{
    document
        .getElementById(
            'albumsFilterPopover'
        )
        ?.remove();
    document.getElementById('albumsFilterButton')?.setAttribute('aria-expanded', 'false');

    document.removeEventListener(
        'click',
        closeAlbumsFilterOnOutside
    );

    document.removeEventListener(
        'keydown',
        closeAlbumsFilterOnEscape
    );

    if (
        restoreFocus
        && albumsFilterReturnFocus
            ?.isConnected
    )
    {
        albumsFilterReturnFocus.focus({
            preventScroll:
            true
        });
    }

    albumsFilterReturnFocus =
        null;
}

function closeAlbumsFilterOnOutside(
    event
)
{
    const popover =
        document.getElementById(
            'albumsFilterPopover'
        );

    const trigger =
        document.getElementById(
            'albumsFilterButton'
        );

    if (!popover)
    {
        return;
    }

    const eventPath =
        typeof event.composedPath
          === 'function'
            ? event.composedPath()
            : [];

    const insidePopover =
        eventPath.length
            ? eventPath.includes(
                popover
            )
            : popover.contains(
                event.target
            );

    const insideTrigger =
        eventPath.length
            ? eventPath.includes(
                trigger
            )
            : trigger?.contains(
                event.target
            );

    if (
        insidePopover
        || insideTrigger
    )
    {
        return;
    }

    closeAlbumsFilterPopover();
}

function closeAlbumsFilterOnEscape(
    event
)
{
    if (
        event.key !== 'Escape'
    )
    {
        return;
    }

    event.preventDefault();

    closeAlbumsFilterPopover({
        restoreFocus:
          true
    });
}

function openAlbumsFilterPopover(
    anchor
)
{
    if (document.getElementById('albumsFilterPopover'))
    {
        closeAlbumsFilterPopover();
        return;
    }
    closeAlbumsFilterPopover();
    closePeopleFilterPopover();
    closeMenu();

    albumsFilterReturnFocus =
        anchor;
    anchor.setAttribute('aria-expanded', 'true');

    const filters =
        albumsFiltersWithDefaults();

    const popover =
        document.createElement(
            'div'
        );

    popover.className =
        'shared-filter-panel albums-shared-filter-popover';

    popover.id =
        'albumsFilterPopover';

    popover.setAttribute(
        'role',
        'dialog'
    );

    popover.setAttribute(
        'aria-label',
        translateText(
            'Filter photos'
        )
    );

    popover.innerHTML = `
        <div
          class="
            shared-filter-panel-header
          ">

          <div>
            <h3>
              Filter photos
            </h3>

            <p>
              Use filters to narrow down
              the view.
            </p>
          </div>

          <button
            class="
              shared-filter-panel-close
            "
            type="button"
            aria-label="Close"
            data-albums-filter-close>

            ${icon.close}
          </button>
        </div>

        <div
          class="
            shared-filter-panel-body
          ">

          ${renderAlbumsFilterFields(
                filters,
                'albums-popover-filter'
            )}
        </div>

        <div
          class="
            shared-filter-panel-footer
          ">

          <button
            class="link"
            type="button"
            data-albums-filter-reset>
            Clear filters
          </button>

          <div
            class="
              shared-filter-panel-actions
            ">

            <button
              class="button secondary"
              type="button"
              data-albums-filter-cancel>
              Cancel
            </button>

            <button
              class="button primary"
              type="button"
              data-albums-filter-apply>
              Apply filters
            </button>
          </div>
        </div>
      `;

    document.body.appendChild(
        popover
    );

    localizeUI(popover);

    const controller =
        bindAlbumsFilterFields(
            popover,
            filters,
            'albums-popover-filter'
        );

    popover
        .querySelector(
            '[data-albums-filter-reset]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                controller?.reset();
            }
        );

    popover
        .querySelector(
            '[data-albums-filter-close]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                closeAlbumsFilterPopover({
                    restoreFocus:
                true
                });
            }
        );

    popover
        .querySelector(
            '[data-albums-filter-cancel]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                closeAlbumsFilterPopover({
                    restoreFocus:
                true
                });
            }
        );

    popover
        .querySelector(
            '[data-albums-filter-apply]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                state.albumsFilters =
                    controller?.getValues()
              || albumsFiltersWithDefaults();

                resetAlbumsPage();

                closeAlbumsFilterPopover();

                renderAlbums();
            }
        );

    positionSharedFilterPanel(
        popover,
        anchor
    );

    requestAnimationFrame(
        () =>
        {
            popover
                .querySelector(
                    '[data-albums-filter-close]'
                )
                ?.focus({
                    preventScroll:
                true
                });
        }
    );

    setTimeout(
        () =>
        {
            document.addEventListener(
                'click',
                closeAlbumsFilterOnOutside
            );

            document.addEventListener(
                'keydown',
                closeAlbumsFilterOnEscape
            );
        },
        0
    );
}

function removeAlbumFilter(
    key
)
{
    const definition =
        sharedFilterDefinitionByKey(
            albumsFilterSchema,
            key
        );

    if (!definition)
    {
        return;
    }

    const filters =
        albumsFiltersWithDefaults();

    filters[key] =
        definition.control
          === 'boolean'
            ? false
            : definition.defaultValue
              ?? '';

    state.albumsFilters =
        filters;

    resetAlbumsPage();
    renderAlbums();
}

function clearAlbumFilters()
{
    state.albumsFilters =
        albumsFiltersWithDefaults(
            defaultAlbumFilters
        );

    resetAlbumsPage();
    renderAlbums();
}

function openPhotoLightbox(photoId)
{
    openPhotoPeopleModal(photoId, { mode: 'preview' });
}

let albumsShowMarkedAreas = true;
let albumsPhotoEscapeCleanup = null;

function openPhotoPeopleModal(photoId, options = {})
{
    openUnifiedImagePeopleModal(photoId, options);
}

function openUnifiedImagePeopleModal(photoId, { mode = 'tag', activePersonId = null, archiveFile = null, imageSrc = null, onClose = null } = {})
{
    const entryFocus = document.activeElement;
    const sidebarTrigger = entryFocus?.matches('#albumsTagPeople') ? '#albumsTagPeople'
        : entryFocus?.matches('[data-archive-add-file-person]') ? '[data-archive-add-file-person]' : '';
    albumsPhotoEscapeCleanup?.();
    albumsPhotoEscapeCleanup = null;
    const archiveMode = Boolean(archiveFile);
    const photo = archiveMode ? {
        id: archiveFile.id,
        projectId: archiveFile.projectId,
        personIds: archiveFile.linkedPersonIds || [],
        personRegions: archiveFile.personRegions || {},
        src: imageSrc || archiveImageSource(archiveFile),
        title: archiveFile.name,
        caption: archiveFile.description || ''
    } : getPhoto(
        photoId,
        {
            projectId: currentProjectId()
        }
    );

    if (!photo) return;

    const savePeople = ids => {
        if (archiveMode) return setArchiveFileConnectionIds(photo.id, 'person', ids);
        setPhotoPersonIds(photo.id, ids, { rerender: false });
        return true;
    };
    const saveRegion = (personId, region) => {
        if (archiveMode) {
            const file = archiveFileById(photo.id);
            if (!file) return false;
            const next = { ...(file.personRegions || {}) };
            if (region) next[personId] = region;
            else delete next[personId];
            file.personRegions = next;
            return true;
        }
        setPhotoPersonRegion(photo, personId, region);
        return true;
    };
    const refreshOwner = () => archiveMode ? renderArchivePreservingFileInspectorScroll() : render();
    const markedAreasVisible = () => archiveMode ? archiveShowMarkedAreas : albumsShowMarkedAreas;

    const selectedIds = new Set(
        [
            ...new Set(
                photo.personIds || []
            )
        ].filter(personId =>
            getPerson(personId)?.projectId
            === photo.projectId
        )
    );

    const regions = { ...(photo.personRegions || {}) };
    let activeRegionPersonId = selectedIds.has(activePersonId)
        ? activePersonId
        : null;

    let query = '';
    let modalMode = activeRegionPersonId ? 'preview' : mode;
    let taggingReturn = modalMode === 'tag' ? 'close' : 'preview';
    let highlightedPersonId = null;
    let imageLoadError = false;

    const personName = person =>
        connectPersonName(person);

    const personContext = person =>
        getPlaceEventDisplay(person?.birth)
        || getPlaceEventDisplay(person?.death)
        || '';

    const personSearchText = person => [
        personName(person),
        person?.names?.first,
        person?.names?.middle,
        person?.names?.last,
        person?.names?.maiden,
        albumPhotoPersonDates(person),
        getPlaceEventDisplay(
            person?.birth
        ),
        getPlaceEventDisplay(
            person?.death
        )
    ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

    const getCandidates = () =>
    {
        const normalizedQuery =
            query.trim().toLowerCase();

        const photoAlbumIds =
            new Set(photo.albumIds || []);

        const photoPlace = String(
            getPlaceDisplay(
                photo.placeId
            )
          || photo.placeText
          || ''
        ).toLowerCase();

        const projectPhotos = archiveMode ? [] :
            getProjectPhotos(
                photo.projectId
            ).filter(item =>
                item.id !== photo.id
            );

        const ranked =
            getPeople(photo.projectId)
                .filter(person =>
                    person?.id
              && !person.deleted
                )
                .filter(person =>
                    !selectedIds.has(
                        person.id
                    )
                )
                .filter(person =>
                    !normalizedQuery
              || personSearchText(
                  person
              ).includes(
                  normalizedQuery
              )
                )
                .map(person =>
                {
                    const displayName =
                        personName(
                            person
                        ).toLowerCase();

                    const nameParts = [
                        person?.names?.first,
                        person?.names?.middle,
                        person?.names?.last,
                        person?.names?.maiden
                    ]
                        .filter(Boolean)
                        .map(value =>
                            String(
                                value
                            ).toLowerCase()
                        );

                    let score = 0;

                    if (normalizedQuery)
                    {
                        if (
                            displayName
                    === normalizedQuery
                        )
                        {
                            score = 500;
                        }
                        else if (
                            displayName.startsWith(
                                normalizedQuery
                            )
                        )
                        {
                            score = 400;
                        }
                        else if (
                            nameParts.some(value =>
                                value.startsWith(
                                    normalizedQuery
                                )
                            )
                        )
                        {
                            score = 300;
                        }
                        else if (
                            displayName.includes(
                                normalizedQuery
                            )
                        )
                        {
                            score = 200;
                        }
                        else
                        {
                            score = 100;
                        }

                        score += Math.min(
                            getPersonPhotoCount(
                                person.id
                            ),
                            50
                        );
                    }
                    else
                    {
                        let taggedPhotos = 0;
                        let sharedAlbums = 0;
                        let coTaggedPhotos = 0;

                        projectPhotos.forEach(
                            item =>
                            {
                                const personIds =
                                    item.personIds || [];

                                if (
                                    !personIds.includes(
                                        person.id
                                    )
                                )
                                {
                                    return;
                                }

                                taggedPhotos += 1;

                                if (
                                    photoAlbumIds.size
                      && (
                          item.albumIds || []
                      ).some(albumId =>
                          photoAlbumIds.has(
                              albumId
                          )
                      )
                                )
                                {
                                    sharedAlbums += 1;
                                }

                                if (
                                    selectedIds.size
                      && personIds.some(
                          personId =>
                              selectedIds.has(
                                  personId
                              )
                      )
                                )
                                {
                                    coTaggedPhotos += 1;
                                }
                            }
                        );

                        const personPlaces = [
                            getPlaceEventDisplay(
                                person?.birth
                            ),
                            getPlaceEventDisplay(
                                person?.death
                            )
                        ]
                            .filter(Boolean)
                            .map(value =>
                                String(
                                    value
                                ).toLowerCase()
                            );

                        score =
                            coTaggedPhotos * 1000
                  + sharedAlbums * 100
                  + (
                      photoPlace
                    && personPlaces
                        .includes(
                            photoPlace
                        )
                          ? 50
                          : 0
                  )
                  + taggedPhotos;
                    }

                    return {
                        person,
                        score
                    };
                })
                .sort((a, b) =>
                    b.score - a.score
              || personName(
                  a.person
              ).localeCompare(
                  personName(
                      b.person
                  )
              )
                );

        return {
            total: ranked.length,

            people: ranked
                .map(item =>
                    item.person
                )
        };
    };

    const renderResults =
        candidates =>
        {
            if (
                !candidates.people.length
            )
            {
                return `
              <div
                class="
                  photo-people-empty
                ">
                ${escapeHtml(t(query.trim() ? 'No matching people.' : 'No people available to tag'))}
              </div>
            `;
            }

            return candidates.people
                .map(person =>
                {
                    return renderPersonRow(person, false);
                })
                .join('');
        };

    openModal(`
        <div
          class="
            modal
            photo-people-modal
            albums-tag-people-modal
            albums-lightbox-modal
            ${archiveMode ? 'archive-unified-image-modal' : ''}
          "
          role="dialog"
          aria-modal="true"
          aria-labelledby="
            photoPeopleTitle
          ">

          <div class="modal-header">
            <div>
              <h2 id="photoPeopleTitle">
                ${escapeHtml(photo.title || photo.filename || t('Untitled photo'))}
              </h2>

              <p>
                ${escapeHtml(archiveMode ? 'Image' : formatPhotoDate(photo))}
              </p>
            </div>

            <button
              class="close-button"
              type="button"
              data-close
              aria-label="
                Close tag people dialog
              ">
              ${icon.close}
            </button>
          </div>

          <div
            class="
              photo-people-body
            ">
            <div class="photo-people-sidebar">
            <section class="albums-unified-preview" data-albums-preview-panel></section>
            <div class="photo-people-search-head"><h3>${escapeHtml(t('Tag a person'))}</h3></div>
            <div
              class="
                field
                photo-people-search-field
              ">
              <div
                class="search-input">
                ${icon.search}

                <input
                  id="photoPeopleSearch"
                  type="search"
                  data-photo-people-search aria-label="${escapeHtml(t('Search people'))}" placeholder="${escapeHtml(t('Search people...'))}" autocomplete="off">
              </div>
            </div>

            <section
              class="
                photo-people-results-panel
              ">

              <div
                class="
                  photo-people-results-head
                ">
                <strong
                  data-photo-people-results-title>
                </strong>

              </div>

              <div
                class="
                  photo-people-results
                "
                data-photo-people-choices>
              </div>
            </section>
            </div>

            <section class="photo-people-workspace" aria-label="Photo and face areas">
              <div class="photo-people-region-panel" data-photo-people-region-panel></div>
              <div class="albums-unified-preview-stage" data-albums-preview-stage></div>
              ${archiveMode && !photo.caption ? '' : `<p class="albums-lightbox-caption">${escapeHtml(photo.caption || t('No caption.'))}</p>`}
            </section>
          </div>

          <div
            class="
              modal-footer
              photo-people-footer
            ">

            <div class="albums-preview-footer-tools">
              <button type="button" class="button primary albums-lightbox-tag" data-lightbox-tag>${icon.plus}<span>${escapeHtml(t(archiveMode ? 'Tag person' : 'Tag people'))}</span></button>
              <label class="albums-marked-toggle"><input type="checkbox" data-albums-show-marked ${markedAreasVisible() ? 'checked' : ''}><span>${escapeHtml(t('Show marked areas'))}</span></label>
            </div>
            <div
              class="
                photo-people-footer-actions
              ">
              <button type="button" class="button secondary albums-search-cancel" data-albums-search-back>${escapeHtml(t('Cancel'))}</button>
              <button type="button" class="button secondary albums-preview-done" data-close>${escapeHtml(t('Done'))}</button>
            </div>
          </div>
        </div>
      `);

    const modal =
        modalBackdrop.querySelector(
            '.photo-people-modal'
        );

    if (!modal) return;

    const imageView = { zoom: 1, x: 0, y: 0, drawing: false, space: false, pointers: new Map(), drag: null, regionDrag: null };
    const viewLabel = (english, russian) => archiveDocumentLabel(english, russian);
    const viewTools = `<div class="photo-image-tools" role="toolbar" aria-label="${escapeHtml(viewLabel('Image view', 'Просмотр изображения'))}">
        <button type="button" data-image-zoom-out title="${escapeHtml(viewLabel('Zoom out', 'Уменьшить'))}" aria-label="${escapeHtml(viewLabel('Zoom out', 'Уменьшить'))}">${icon.zoomOut}</button>
        <output data-image-zoom aria-live="polite">100%</output>
        <button type="button" data-image-zoom-in title="${escapeHtml(viewLabel('Zoom in', 'Увеличить'))}" aria-label="${escapeHtml(viewLabel('Zoom in', 'Увеличить'))}">${icon.zoomIn}</button>
        <button type="button" data-image-fit title="${escapeHtml(viewLabel('Fit image', 'Вписать изображение'))}" aria-label="${escapeHtml(viewLabel('Fit image', 'Вписать изображение'))}">${escapeHtml(viewLabel('Fit', 'Вписать'))}</button>
    </div>`;
    const imageViewport = () => modal.querySelector('[data-image-viewport]');
    const imagePoint = (clientX, clientY) => {
        const rect = imageViewport()?.querySelector('[data-image-surface]')?.getBoundingClientRect();
        return rect?.width && rect?.height ? { x: (clientX - rect.left) / rect.width, y: (clientY - rect.top) / rect.height } : null;
    };
    const imagePixel = () => {
        const image = imageViewport()?.querySelector('[data-image-surface] img');
        return { width: 1 / Math.max(1, image?.naturalWidth || 1), height: 1 / Math.max(1, image?.naturalHeight || 1) };
    };
    const projectImageRegions = () => {
        const viewport = imageViewport();
        const rect = viewport?.querySelector('[data-image-surface]')?.getBoundingClientRect();
        if (!rect) return;
        const bounds = viewport.getBoundingClientRect();
        viewport.querySelectorAll('[data-image-region]').forEach(box => {
            const id = box.dataset.imageRegion;
            const region = normalizeFaceRegion(regions[id]);
            if (!region) { box.hidden = true; return; }
            box.hidden = false;
            Object.assign(box.style, {
                left: `${rect.left - bounds.left + region.x * rect.width}px`,
                top: `${rect.top - bounds.top + region.y * rect.height}px`,
                width: `${region.width * rect.width}px`,
                height: `${region.height * rect.height}px`
            });
            const label = box.querySelector('.face-region-name, .albums-lightbox-face-name');
            if (label) {
                label.style.left = '0px';
                const display = label.style.display;
                const visibility = label.style.visibility;
                label.style.display = 'block';
                label.style.visibility = 'hidden';
                const labelWidth = label.getBoundingClientRect().width;
                label.style.display = display;
                label.style.visibility = visibility;
                const left = rect.left - bounds.left + region.x * rect.width;
                const top = rect.top - bounds.top + (region.y + region.height) * rect.height;
                label.style.left = `${Math.max(-left + 4, Math.min(0, bounds.width - left - labelWidth - 4))}px`;
                box.classList.toggle('label-above', top + 42 > bounds.height);
            }
            const handle = box.querySelector('[data-face-region-resize]');
            if (handle) {
                const left = rect.left - bounds.left + (region.x + region.width) * rect.width;
                const top = rect.top - bounds.top + (region.y + region.height) * rect.height;
                handle.style.left = `${left + 34 <= bounds.width ? region.width * rect.width + 6 : -34}px`;
                handle.style.top = `${top + 34 <= bounds.height ? region.height * rect.height + 6 : -34}px`;
            }
        });
    };
    const syncImageMode = () => {
        const viewport = imageViewport();
        if (!viewport) return;
        viewport.classList.toggle('is-panning', imageView.space || (imageView.zoom > 1 && !imageView.drawing));
        viewport.classList.toggle('is-drawing', imageView.drawing);
        const mark = modal.querySelector('[data-photo-people-add-region]');
        if (mark) mark.setAttribute('aria-pressed', String(imageView.drawing));
    };
    const syncImageView = () => {
        const viewport = imageViewport();
        const surface = viewport?.querySelector('[data-image-surface]');
        const image = surface?.querySelector('img');
        if (!image?.naturalWidth || !image.naturalHeight) return;
        const bounds = viewport.getBoundingClientRect();
        const fit = Math.min(bounds.width / image.naturalWidth, bounds.height / image.naturalHeight);
        if (!Number.isFinite(fit) || fit <= 0) return;
        const width = image.naturalWidth * fit;
        const height = image.naturalHeight * fit;
        imageView.x = Math.max(-Math.max(0, (width * imageView.zoom - bounds.width) / 2), Math.min(Math.max(0, (width * imageView.zoom - bounds.width) / 2), imageView.x));
        imageView.y = Math.max(-Math.max(0, (height * imageView.zoom - bounds.height) / 2), Math.min(Math.max(0, (height * imageView.zoom - bounds.height) / 2), imageView.y));
        surface.style.width = `${width}px`;
        surface.style.height = `${height}px`;
        surface.style.transform = `translate(-50%, -50%) translate(${imageView.x}px, ${imageView.y}px) scale(${imageView.zoom})`;
        modal.querySelector('[data-image-zoom]').textContent = `${Math.round(imageView.zoom * 100)}%`;
        syncImageMode();
        projectImageRegions();
    };
    const zoomImage = (next, clientX, clientY) => {
        const viewport = imageViewport();
        if (!viewport) return;
        const bounds = viewport.getBoundingClientRect();
        const zoom = Math.max(1, Math.min(8, next));
        const cx = clientX - bounds.left - bounds.width / 2;
        const cy = clientY - bounds.top - bounds.height / 2;
        const ratio = zoom / imageView.zoom;
        imageView.x = cx - (cx - imageView.x) * ratio;
        imageView.y = cy - (cy - imageView.y) * ratio;
        imageView.zoom = zoom;
        if (zoom === 1) { imageView.x = imageView.y = 0; imageView.drawing = false; }
        syncImageView();
    };
    const fitImageView = () => { imageView.zoom = 1; imageView.x = imageView.y = 0; imageView.drawing = false; syncImageView(); };
    const viewResize = new ResizeObserver(syncImageView);
    const bindImageView = () => {
        const viewport = imageViewport();
        if (!viewport) return;
        viewResize.disconnect();
        viewResize.observe(viewport);
        const image = viewport.querySelector('img');
        if (image?.complete) syncImageView();
        else image?.addEventListener('load', syncImageView, { once: true });
    };
    modal.addEventListener('wheel', event => {
        if (!event.target.closest('[data-image-viewport]')) return;
        event.preventDefault();
        if (imageView.regionDrag) return;
        zoomImage(imageView.zoom * Math.exp(-event.deltaY * 0.002), event.clientX, event.clientY);
    }, { passive: false });
    modal.addEventListener('pointerdown', event => {
        const viewport = event.target.closest('[data-image-viewport]');
        if (!viewport || event.target.closest('.photo-image-tools')) return;
        if (event.pointerType === 'touch') {
            imageView.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
            if (imageView.pointers.size === 2) {
                const firstId = [...imageView.pointers.keys()][0];
                if (imageView.regionDrag) {
                    const previous = imageView.regionDrag.previous;
                    if (previous) regions[activeRegionPersonId] = previous;
                    else delete regions[activeRegionPersonId];
                    imageView.regionDrag = null;
                    imageView.drawing = false;
                    projectImageRegions();
                    syncImageMode();
                }
                const points = [...imageView.pointers.values()];
                imageView.pinch = { distance: Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y), zoom: imageView.zoom };
            }
        }
        const activeBox = event.target.closest('[data-face-region-box]');
        const otherBox = event.target.closest('[data-face-region-other], [data-lightbox-face]');
        const forcePan = event.button === 1 || imageView.space || imageView.pointers.size > 1;
        const canEdit = modalMode === 'preview' && selectedIds.has(activeRegionPersonId);
        if (!forcePan && canEdit && !otherBox && (activeBox || imageView.zoom === 1 || imageView.drawing)) {
            const point = imagePoint(event.clientX, event.clientY);
            if (!point) return;
            const current = normalizeFaceRegion(regions[activeRegionPersonId]);
            const mode = event.target.closest('[data-face-region-resize]') ? 'resize' : activeBox ? 'move' : 'draw';
            imageView.regionDrag = { id: event.pointerId, mode, point, start: current, previous: current, moved: false };
            if (mode === 'draw') {
                const pixel = imagePixel();
                regions[activeRegionPersonId] = normalizeFaceRegion({ x: point.x, y: point.y, width: pixel.width, height: pixel.height });
            }
            projectImageRegions();
            viewport.setPointerCapture(event.pointerId);
            event.preventDefault();
            event.stopPropagation();
            return;
        }
        if (!forcePan && !(imageView.zoom > 1 && !otherBox)) return;
        event.preventDefault();
        event.stopPropagation();
        imageView.drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
        viewport.setPointerCapture(event.pointerId);
    }, true);
    modal.addEventListener('pointermove', event => {
        if (!imageView.pointers.has(event.pointerId) && imageView.drag?.id !== event.pointerId && imageView.regionDrag?.id !== event.pointerId) return;
        if (imageView.pointers.has(event.pointerId)) imageView.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
        if (imageView.pointers.size === 2 && imageView.pinch) {
            const points = [...imageView.pointers.values()];
            const distance = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
            zoomImage(imageView.zoom * distance / (imageView.pinch.distance || distance), (points[0].x + points[1].x) / 2, (points[0].y + points[1].y) / 2);
            imageView.pinch.distance = distance;
            return;
        }
        if (imageView.regionDrag?.id === event.pointerId) {
            const drag = imageView.regionDrag;
            const point = imagePoint(event.clientX, event.clientY);
            if (!point) return;
            const pixel = imagePixel();
            drag.moved ||= Math.abs(point.x - drag.point.x) >= pixel.width && Math.abs(point.y - drag.point.y) >= pixel.height;
            const start = drag.start || FACE_REGION_DEFAULT;
            const next = drag.mode === 'move' ? { ...start, x: start.x + point.x - drag.point.x, y: start.y + point.y - drag.point.y }
                : drag.mode === 'resize' ? { ...start, width: Math.max(pixel.width, point.x - start.x), height: Math.max(pixel.height, point.y - start.y) }
                : { x: Math.min(drag.point.x, point.x), y: Math.min(drag.point.y, point.y), width: Math.max(pixel.width, Math.abs(point.x - drag.point.x)), height: Math.max(pixel.height, Math.abs(point.y - drag.point.y)) };
            regions[activeRegionPersonId] = normalizeFaceRegion(next);
            projectImageRegions();
            return;
        }
        if (!imageView.drag || imageView.drag.id !== event.pointerId) return;
        imageView.x += event.clientX - imageView.drag.x;
        imageView.y += event.clientY - imageView.drag.y;
        imageView.drag.x = event.clientX;
        imageView.drag.y = event.clientY;
        syncImageView();
    });
    const endImagePointer = event => {
        if (imageView.regionDrag?.id === event.pointerId) {
            const drag = imageView.regionDrag;
            imageView.regionDrag = null;
            imageView.drawing = false;
            if (event.type === 'pointercancel') {
                if (drag.previous) regions[activeRegionPersonId] = drag.previous;
                else delete regions[activeRegionPersonId];
                projectImageRegions();
            } else if (drag.moved || drag.mode !== 'draw') commitRegion();
            else {
                if (drag.previous) regions[activeRegionPersonId] = drag.previous;
                else delete regions[activeRegionPersonId];
                projectImageRegions();
            }
            syncImageMode();
        }
        imageView.pointers.delete(event.pointerId);
        if (imageView.pointers.size < 2) imageView.pinch = null;
        if (imageView.drag?.id === event.pointerId) imageView.drag = null;
    };
    modal.addEventListener('pointerup', endImagePointer);
    modal.addEventListener('pointercancel', endImagePointer);
    const imageKeyDown = event => {
        if (event.code === 'Space' && !/^(INPUT|TEXTAREA)$/.test(event.target.tagName)) {
            imageView.space = true;
            syncImageView();
            if (event.target.closest('[data-image-viewport]')) event.preventDefault();
        }
    };
    const imageKeyUp = event => { if (event.code === 'Space') { imageView.space = false; syncImageView(); } };
    window.addEventListener('keydown', imageKeyDown);
    window.addEventListener('keyup', imageKeyUp);

    const renderPersonRow = (person, tagged) => {
        const id = escapeHtml(person.id);
        const name = localizedDataFieldValue(personName(person));
        const status = tagged ? t(normalizeFaceRegion(regions[person.id]) ? 'Marked area' : 'No area') : (albumPhotoPersonDates(person) || t('Dates unknown'));
        return `<div class="albums-unified-person-row${activeRegionPersonId === person.id && modalMode === 'preview' ? ' is-active' : ''}">
            <button type="button" class="albums-unified-person-main" ${tagged ? `data-lightbox-person="${id}" data-photo-people-region="${id}" aria-pressed="${activeRegionPersonId === person.id}"` : `data-photo-people-choice="${id}"`} aria-label="${escapeHtml(name)}">
                ${renderPersonAvatar(person, 'small-avatar', { element: 'span' })}
                <span class="albums-unified-person-copy"><strong>${escapeHtml(name)}</strong><small>${escapeHtml(status)}</small></span>
            </button>
            <button type="button" class="albums-unified-person-action" ${tagged ? `data-photo-people-remove="${id}" aria-label="${escapeHtml(`${t('Remove tag')} ${name}`)}"` : `data-photo-people-choice="${id}" aria-label="${escapeHtml(`${t('Tag people')}: ${name}`)}"`}>${tagged ? icon.close : icon.plus}</button>
        </div>`;
    };
    const previewRows = () => {
        const people = [...selectedIds].map(getPerson).filter(person => person?.projectId === photo.projectId);
        return [true, false].map(marked => {
            const group = people.filter(person => Boolean(normalizeFaceRegion(regions[person.id])) === marked);
            if (!group.length) return '';
            return `<div class="albums-unified-group"><strong>${escapeHtml(t(marked ? 'Marked area' : 'No area'))}</strong>${group.map(person => renderPersonRow(person, true)).join('')}</div>`;
        }).join('') || `<p class="albums-lightbox-empty">${escapeHtml(t(archiveMode ? 'No people tagged to this file yet.' : 'No people tagged yet.'))}</p>`;
    };
    const commitRegion = ({ keyboard = false } = {}) => {
        if (!selectedIds.has(activeRegionPersonId)) return;
        saveRegion(activeRegionPersonId, regions[activeRegionPersonId] || null);
        refreshOwner();
        if (!keyboard) {
            refresh();
            modal.querySelector('[data-face-region-box]')?.focus({ preventScroll: true });
        }
    };
    const refreshPreview = () => {
        modal.classList.toggle('is-preview', modalMode === 'preview');
        modal.classList.toggle('is-tagging', modalMode === 'tag');
        modal.querySelector('[data-albums-preview-panel]').innerHTML = `<button type="button" class="button secondary albums-search-people" data-albums-search-people>${icon.search}<span>${escapeHtml(t('Search people'))}</span></button><div class="albums-lightbox-people-header"><h3>${escapeHtml(t('Tagged people'))}</h3><span>${selectedIds.size}</span></div><div class="albums-lightbox-people-list">${previewRows()}</div>`;
        const stage = modal.querySelector('[data-albums-preview-stage]');
        const active = modalMode === 'preview' && selectedIds.has(activeRegionPersonId);
        const imageContent = imageLoadError
            ? `<p class="photo-people-image-error" role="alert">${escapeHtml(archiveDocumentLabel('Image could not be displayed.', 'Не удалось показать изображение.'))}</p>`
            : active && photo.src
            ? `<div class="face-region-selector" data-face-region-selector><img src="${escapeHtml(photo.src)}" alt="" draggable="false"></div>`
            : photo.src ? `<div class="albums-lightbox-image-wrap"><img class="albums-lightbox-image" src="${escapeHtml(photo.src)}" alt="${escapeHtml(photo.title || photo.filename)}" draggable="false"></div>`
            : renderPhotoThumbnail(photo, { className: 'albums-lightbox-photo', label: photo.title || photo.filename });
        const regionBoxes = [...selectedIds].map(id => {
            const region = normalizeFaceRegion(regions[id]);
            if (!region && !(active && id === activeRegionPersonId)) return '';
            const name = escapeHtml(localizedDataFieldValue(personName(getPerson(id))));
            if (active && id === activeRegionPersonId) return `<div class="face-region-box" data-face-region-box data-image-region="${escapeHtml(id)}" tabindex="0" role="group" aria-label="${escapeHtml(viewLabel('Area. Arrows move; Shift resizes; Alt adjusts one image pixel.', 'Область. Стрелки перемещают; Shift изменяет размер; Alt изменяет на один пиксель изображения.'))}"><span class="face-region-name">${name}</span><span class="face-region-handle" data-face-region-resize aria-hidden="true"></span></div>`;
            if (active) return `<span class="face-region-other${!markedAreasVisible() && highlightedPersonId !== id ? ' is-concealed' : ''}" data-face-region-other data-image-region="${escapeHtml(id)}" data-person-id="${escapeHtml(id)}" tabindex="0" role="button" aria-label="${name}"><span class="face-region-name">${name}</span></span>`;
            return `<span class="albums-lightbox-face${highlightedPersonId === id ? ' is-active' : ''}${!markedAreasVisible() && highlightedPersonId !== id ? ' is-concealed' : ''}" data-lightbox-face="${escapeHtml(id)}" data-image-region="${escapeHtml(id)}" role="img" tabindex="0" aria-label="${name}"><span class="albums-lightbox-face-name" data-lightbox-face-name>${name}</span></span>`;
        }).join('');
        stage.innerHTML = photo.src && !imageLoadError
            ? `<div class="photo-image-viewport" data-image-viewport tabindex="-1"><div class="photo-image-surface" data-image-surface>${imageContent}</div><div class="photo-image-regions" data-image-regions>${regionBoxes}</div>${viewTools}</div>`
            : imageContent;
        bindImageView();
        syncImageMode();
        if (archiveMode) {
            stage.querySelector('img')?.addEventListener('error', () => {
                if (!modal.isConnected) return;
                imageLoadError = true;
                refresh();
            }, { once: true });
        }
        modal.classList.toggle('is-searching', modalMode === 'tag');
    };
    const highlightPerson = id => {
        highlightedPersonId = id;
        modal.querySelectorAll('.albums-unified-person-row').forEach(row => row.classList.toggle('is-hovered', row.querySelector('[data-lightbox-person]')?.dataset.lightboxPerson === id));
        modal.querySelectorAll('[data-lightbox-face]').forEach(box => {
            const active = box.dataset.lightboxFace === id;
            box.classList.toggle('is-concealed', !markedAreasVisible() && !active);
            box.classList.toggle('is-active', active);
        });
        modal.querySelectorAll('[data-face-region-other][data-person-id]').forEach(box => {
            const active = box.dataset.personId === id;
            box.classList.toggle('is-hovered', active);
            box.classList.toggle('is-concealed', !markedAreasVisible() && !active);
        });
        modal.querySelector('[data-face-region-box]')?.classList.toggle('is-hovered', Boolean(id && id === activeRegionPersonId));
    };

    const refresh = () =>
    {
        refreshPreview();
        const candidates =
            getCandidates();

        const queryActive =
            Boolean(query.trim());

        const regionPanel = modal.querySelector('[data-photo-people-region-panel]');
        const activePerson = selectedIds.has(activeRegionPersonId) ? getPerson(activeRegionPersonId) : null;
        regionPanel.hidden = modalMode !== 'preview' || !activePerson;
        regionPanel.innerHTML = activePerson ? `<div class="photo-people-region-heading">
            <div class="photo-people-region-title"><strong>${escapeHtml(t('Mark area'))}</strong><span>${escapeHtml(localizedDataFieldValue(personName(activePerson)))}</span></div>
            <div class="photo-people-region-actions">
              ${archiveMode ? '' : `<label class="photo-people-primary-choice" title="${!regions[activePerson.id] ? escapeHtml(t('Select a face area first.')) : ''}"><input type="checkbox" data-photo-people-primary ${activePerson.primaryPhotoId === photo.id ? 'checked' : ''} ${!regions[activePerson.id] && activePerson.primaryPhotoId !== photo.id ? 'disabled' : ''}> ${escapeHtml(t('Use as profile photo'))}</label>`}
              ${photo.src && !imageLoadError ? `<button class="button secondary" type="button" ${regions[activePerson.id] ? 'data-photo-people-clear-region' : 'data-photo-people-add-region'}>${escapeHtml(t(regions[activePerson.id] ? 'Clear area' : 'Mark area'))}</button>` : ''}
            </div>
          </div>` : '';

        modal
            .querySelector(
                '[data-photo-people-results-title]'
            )
            .textContent =
                queryActive
                    ? t('Matching people')
                    : t('All people');

        modal
            .querySelector(
                '[data-photo-people-choices]'
            )
            .innerHTML =
                renderResults(
                    candidates
                );

        highlightPerson(highlightedPersonId);
        localizeUI(modal);
    };

    const confirmPreviewRemoval = personId => {
        if (document.getElementById('photoPeoplePreviewRemovalOverlay')) return;
        const person = getPerson(personId);
        if (!person) return;
        const isPrimary = !archiveMode && person.primaryPhotoId === photo.id;
        const overlay = document.createElement('div');
        overlay.id = 'photoPeoplePreviewRemovalOverlay';
        overlay.className = 'add-person-mini-backdrop';
        overlay.innerHTML = `<div class="add-person-mini-card" role="alertdialog" aria-modal="true" aria-labelledby="photoPeoplePreviewRemovalTitle">
            <div class="add-person-mini-head"><h3 id="photoPeoplePreviewRemovalTitle">${escapeHtml(t('Remove tag'))}?</h3></div>
            <div class="add-person-mini-body"><p>${escapeHtml(`${t('Remove tag')} ${localizedDataFieldValue(personName(person))}?`)}</p>
            ${isPrimary ? `<p>${escapeHtml(t("This photo is the person's primary photo. Removing the tag will clear the primary photo."))}</p>` : ''}</div>
            <div class="add-person-mini-footer"><button type="button" class="button secondary" data-keep>${escapeHtml(t('Cancel'))}</button><button type="button" class="button danger" data-remove>${escapeHtml(t('Remove tag'))}</button></div>
        </div>`;
        const close = () => {
            overlay.remove();
            modal.querySelector(`[data-photo-people-remove="${CSS.escape(personId)}"]`)?.focus({ preventScroll: true });
        };
        overlay.addEventListener('click', event => {
            if (event.target === overlay || event.target.closest('[data-keep]')) close();
            if (event.target.closest('[data-remove]')) {
                overlay.remove();
                selectedIds.delete(personId);
                if (!savePeople([...selectedIds])) {
                    selectedIds.add(personId);
                    showToast(t('The link could not be saved.'));
                    refresh();
                    return;
                }
                delete regions[personId];
                if (activeRegionPersonId === personId) activeRegionPersonId = null;
                refreshOwner();
                refresh();
                modal.querySelector('[data-lightbox-tag]')?.focus({ preventScroll: true });
            }
        });
        overlay.addEventListener('keydown', event => {
            if (event.key === 'Escape') { event.stopPropagation(); close(); }
        });
        document.body.appendChild(overlay);
        overlay.querySelector('[data-keep]')?.focus();
    };

    const returnFromSearch = () => {
        if (taggingReturn === 'close')
        {
            closeModal();
            return;
        }
        modalMode = 'preview';
        refresh();
        modal.querySelector('.photo-people-body').scrollTop = 0;
        modal.querySelector(innerWidth <= 760 ? '[data-close]' : '[data-lightbox-tag]')?.focus({ preventScroll: true });
    };
    const focusActiveArea = () => {
        modal.querySelector('.photo-people-body').scrollTop = 0;
        (modal.querySelector('[data-face-region-box]') || modal.querySelector('[data-photo-people-add-region]')
            || modal.querySelector('[data-photo-people-clear-region]'))
            ?.focus({ preventScroll: true });
    };
    const onSearchEscape = event => {
        if (event.key !== 'Escape' || !modal.isConnected || (modalMode !== 'tag' && !imageView.drawing)) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        if (imageView.drawing) { imageView.drawing = false; syncImageMode(); }
        else returnFromSearch();
    };
    const observer = new MutationObserver(() => {
        if (!modal.isConnected) cleanupEscape();
    });
    const cleanupEscape = () => {
        window.removeEventListener('keydown', onSearchEscape, true);
        window.removeEventListener('keydown', imageKeyDown);
        window.removeEventListener('keyup', imageKeyUp);
        viewResize.disconnect();
        observer.disconnect();
        onClose?.();
        if (sidebarTrigger) requestAnimationFrame(() =>
        {
            if (!modalBackdrop.classList.contains('open'))
                (entryFocus?.isConnected ? entryFocus : main.querySelector(sidebarTrigger))?.focus({ preventScroll: true });
        });
        if (albumsPhotoEscapeCleanup === cleanupEscape) albumsPhotoEscapeCleanup = null;
    };
    observer.observe(modalBackdrop, { childList: true });
    window.addEventListener('keydown', onSearchEscape, true);
    albumsPhotoEscapeCleanup = cleanupEscape;
    modalBackdrop.beforeClose = () => {
        cleanupEscape();
        return true;
    };

    modal
        .querySelector(
            '[data-photo-people-search]'
        )
        ?.addEventListener(
            'input',
            event =>
            {
                query =
                    event.currentTarget.value;

                refresh();
            }
        );

    modal.addEventListener(
        'change',
        event =>
        {
            if (event.target.matches('[data-albums-show-marked]')) {
                if (archiveMode) archiveShowMarkedAreas = event.target.checked;
                else albumsShowMarkedAreas = event.target.checked;
                highlightPerson(highlightedPersonId);
                return;
            }
            if (event.target.matches('[data-photo-people-primary]'))
            {
                const person = getPerson(activeRegionPersonId);
                if (!person || !selectedIds.has(person.id)) return;
                if (event.target.checked) {
                    if (!normalizeFaceRegion(regions[person.id])) {
                        event.target.checked = false;
                        return;
                    }
                    setPersonPrimaryPhoto(person.id, photo.id, null, { rerender: false, notify: false });
                } else if (person.primaryPhotoId === photo.id) {
                    person.primaryPhotoId = '';
                    person.primaryPhotoCrop = null;
                    markPersonUpdated(person);
                }
                render();
                return;
            }
        }
    );

    modal.addEventListener(
        'click',
        event =>
        {
            if (event.target.closest('[data-image-zoom-out], [data-image-zoom-in], [data-image-fit]')) {
                const viewport = imageViewport();
                if (!viewport) return;
                const bounds = viewport.getBoundingClientRect();
                const cx = bounds.left + bounds.width / 2;
                const cy = bounds.top + bounds.height / 2;
                if (event.target.closest('[data-image-zoom-out]')) zoomImage(imageView.zoom / 1.25, cx, cy);
                else if (event.target.closest('[data-image-zoom-in]')) zoomImage(imageView.zoom * 1.25, cx, cy);
                else fitImageView();
                return;
            }
            if (event.target.closest('[data-lightbox-tag]')) {
                taggingReturn = 'preview';
                modalMode = 'tag';
                refresh();
                modal.querySelector('[data-photo-people-search]')?.focus({ preventScroll: true });
                return;
            }
            if (event.target.closest('[data-albums-search-back]')) {
                returnFromSearch();
                return;
            }
            if (event.target.closest('[data-albums-search-people]')) {
                taggingReturn = 'preview';
                modalMode = 'tag';
                refresh();
                modal.querySelector('[data-photo-people-search]')?.focus({ preventScroll: true });
                return;
            }
            const choice = event.target.closest('[data-photo-people-choice]');
            if (choice)
            {
                const personId = choice.dataset.photoPeopleChoice;
                selectedIds.add(personId);
                if (!savePeople([...selectedIds])) {
                    selectedIds.delete(personId);
                    showToast(t('The link could not be saved.'));
                    return;
                }
                activeRegionPersonId = personId;
                highlightedPersonId = null;
                modalMode = 'preview';
                refreshOwner();
                refresh();
                focusActiveArea();
                return;
            }
            const remove =
                event.target.closest(
                    '[data-photo-people-remove]'
                );

            if (remove)
            {
                confirmPreviewRemoval(remove.dataset.photoPeopleRemove);
                return;
            }
            const regionButton = event.target.closest('[data-photo-people-region]');
            const otherRegion = event.target.closest('[data-face-region-other][data-person-id]');
            const previewRegion = event.target.closest('[data-lightbox-face]');
            if (otherRegion || previewRegion) {
                activeRegionPersonId = otherRegion?.dataset.personId || previewRegion.dataset.lightboxFace;
                highlightedPersonId = null;
                refresh();
                focusActiveArea();
                return;
            }
            if (regionButton)
            {
                activeRegionPersonId = activeRegionPersonId === regionButton.dataset.photoPeopleRegion
                    ? null : regionButton.dataset.photoPeopleRegion;
                highlightedPersonId = null;
                refresh();
                if (activeRegionPersonId) focusActiveArea();
                else modal.querySelector('[data-lightbox-tag]')?.focus({ preventScroll: true });
                return;
            }
            if (event.target.closest('[data-photo-people-clear-region]'))
            {
                delete regions[activeRegionPersonId];
                saveRegion(activeRegionPersonId, null);
                refreshOwner();
                refresh();
                modal.querySelector(`[data-photo-people-region="${CSS.escape(activeRegionPersonId)}"]`)?.focus();
                return;
            }
            if (event.target.closest('[data-photo-people-add-region]'))
            {
                if (imageView.zoom > 1 && event.detail !== 0) {
                    imageView.drawing = true;
                    syncImageMode();
                    imageViewport()?.focus({ preventScroll: true });
                    return;
                }
                regions[activeRegionPersonId] = { ...FACE_REGION_DEFAULT };
                saveRegion(activeRegionPersonId, regions[activeRegionPersonId]);
                refreshOwner();
                refresh();
                modal.querySelector('[data-face-region-box]')?.focus();
                return;
            }
        }
    );

    const highlightedTarget = target => target.closest?.('[data-lightbox-person], [data-lightbox-face], [data-face-region-other][data-person-id], [data-face-region-box]');
    const targetPersonId = target => target.dataset.lightboxPerson || target.dataset.lightboxFace || target.dataset.personId || (target.matches('[data-face-region-box]') ? activeRegionPersonId : null);
    modal.addEventListener('pointerover', event => {
        const target = highlightedTarget(event.target);
        if (target) highlightPerson(targetPersonId(target));
    });
    modal.addEventListener('pointerout', event => {
        const target = highlightedTarget(event.target);
        if (target && !target.contains(event.relatedTarget) && !target.matches(':focus')) highlightPerson(null);
    });
    modal.addEventListener('focusin', event => {
        const target = highlightedTarget(event.target);
        if (target) highlightPerson(targetPersonId(target));
    });
    modal.addEventListener('focusout', event => {
        const target = highlightedTarget(event.target);
        if (target && !target.matches(':hover')) highlightPerson(null);
    });
    modal.addEventListener('keydown', event => {
        if (event.target.matches('[data-face-region-box]') && event.key.startsWith('Arrow')) {
            const region = normalizeFaceRegion(regions[activeRegionPersonId]);
            if (!region) return;
            const pixel = imagePixel();
            const stepX = event.altKey ? pixel.width : event.ctrlKey ? .01 : .025;
            const stepY = event.altKey ? pixel.height : event.ctrlKey ? .01 : .025;
            const dx = event.key === 'ArrowLeft' ? -stepX : event.key === 'ArrowRight' ? stepX : 0;
            const dy = event.key === 'ArrowUp' ? -stepY : event.key === 'ArrowDown' ? stepY : 0;
            regions[activeRegionPersonId] = normalizeFaceRegion(event.shiftKey
                ? { ...region, width: Math.max(pixel.width, region.width + dx), height: Math.max(pixel.height, region.height + dy) }
                : { ...region, x: region.x + dx, y: region.y + dy });
            projectImageRegions();
            commitRegion({ keyboard: true });
            event.preventDefault();
            return;
        }
        const region = event.target.closest('[data-face-region-other][data-person-id], [data-lightbox-face]');
        if (region && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            region.click();
        }
    });

    refresh();

    const initialFocus = modal.querySelector(
        modalMode === 'preview' && activeRegionPersonId
            ? regions[activeRegionPersonId] ? '[data-face-region-box]' : '[data-photo-people-add-region]'
            : modalMode === 'preview' || innerWidth <= 900
                ? '[data-close]'
                : '[data-photo-people-search]'
    );
    initialFocus?.setAttribute('data-modal-initial-focus', '');
    initialFocus?.focus({
            preventScroll: true
        });
}

function openAddPersonPhotoDraftModal({
    projectId =
        currentProjectId(),

    selectedPhotoIds = [],

    subjectLabel =
        'New person',

    onSave = null
} = {})
{
    if (!projectId)
    {
        return;
    }

    const selectedIds =
        new Set(
            [
                ...new Set(
                    selectedPhotoIds || []
                )
            ].filter(photoId =>
                Boolean(
                    getPhoto(
                        photoId,
                        {
                            projectId
                        }
                    )
                )
            )
        );

    let query = '';

    document
        .getElementById(
            'addPersonPhotoDraftOverlay'
        )
        ?.remove();

    const overlay =
        document.createElement(
            'div'
        );

    overlay.id =
        'addPersonPhotoDraftOverlay';

    overlay.className =
        'add-person-mini-backdrop';

    const filteredPhotos = () =>
    {
        const normalizedQuery =
            query
                .trim()
                .toLowerCase();

        return getProjectPhotos(
            projectId
        ).filter(photo =>
            !normalizedQuery
          || photoSearchText(photo)
              .includes(
                  normalizedQuery
              )
        );
    };

    const renderCandidate =
        photo =>
        {
            const selected =
                selectedIds.has(
                    photo.id
                );

            const title =
                photo.title
            || photo.filename
            || 'Untitled photo';

            return `
            <button
              class="
                person-photo-candidate
                person-photos-adder-candidate
              "
              type="button"
              data-add-person-photo-draft-candidate="${
                    escapeHtml(
                        photo.id
                    )
                }"
              aria-pressed="${
                    selected
                }"
              aria-label="${
                    escapeHtml(
                        `${
                            selected
                                ? 'Deselect'
                                : 'Select'
                        } ${title}`
                    )
                }">

              <span
                class="
                  person-photo-candidate-preview
                ">
                ${renderPhotoThumbnail(
                    photo,
                    {
                        label: title
                    }
                )}

                <span
                  class="
                    person-photos-adder-check
                  "
                  data-add-person-photo-draft-check
                  ${
                        selected
                            ? ''
                            : 'hidden'
                    }
                  aria-hidden="true">
                  ${icon.check}
                </span>
              </span>

              <span
                class="
                  person-photo-candidate-copy
                ">
                <strong>
                  ${escapeHtml(title)}
                </strong>

                <span>
                  ${escapeHtml(
                        formatPhotoDate(
                            photo
                        )
                    || 'Unknown date'
                    )}
                </span>
              </span>
            </button>
          `;
        };

    const renderResults = () =>
    {
        const photos =
            filteredPhotos();

        if (photos.length)
        {
            return `
            <div
              class="
                person-photo-candidate-grid
                person-photos-adder-grid
              ">
              ${photos
                    .map(
                        renderCandidate
                    )
                    .join('')}
            </div>
          `;
        }

        const hasSearch =
            Boolean(
                query.trim()
            );

        return `
          <div
            class="
              person-photo-empty
            ">
            <div>
              <strong>
                ${
                    hasSearch
                        ? 'No photos match this search.'
                        : 'This project has no photos yet.'
                }
              </strong>

              ${
                    hasSearch
                        ? `
                    <button
                      class="
                        button
                        secondary
                      "
                      type="button"
                      data-add-person-photo-draft-clear-search>
                      Clear search
                    </button>
                  `
                        : ''
                }
            </div>
          </div>
        `;
    };

    const selectionLabel = () =>
    {
        const count =
            selectedIds.size;

        return `${count} ${
            count === 1
                ? 'photo'
                : 'photos'
        } selected`;
    };

    overlay.innerHTML = `
        <div
          class="
            modal
            person-photo-picker-modal
            person-photos-adder-modal
          "
          role="dialog"
          aria-modal="true"
          aria-labelledby="
            addPersonPhotoDraftTitle
          ">

          <div class="modal-header">
            <div>
              <h2
                id="
                  addPersonPhotoDraftTitle
                ">
                Select photos
              </h2>

              <p>
                ${escapeHtml(
                    subjectLabel
                )}
              </p>
            </div>

            <button
              class="close-button"
              type="button"
              data-add-person-photo-draft-close
              aria-label="
                Close photo selector
              ">
              ${icon.close}
            </button>
          </div>

          <div
            class="
              modal-body
              person-photo-picker-body
              person-photos-adder-body
            ">

            <div
              class="
                person-photo-picker-step
              ">
              Project photos
            </div>

            <div
              class="
                person-photo-project-panel
              ">

              <div
                class="
                  person-photo-project-controls
                  person-photos-adder-project-controls
                ">

                <label
                  class="search-input"
                  aria-label="
                    Search project photos
                  ">
                  ${icon.search}

                  <input
                    type="search"
                    data-add-person-photo-draft-search
                    placeholder="
                      Search project photos
                    "
                    autocomplete="off">
                </label>
              </div>

              <div
                class="
                  person-photo-project-results
                "
                data-add-person-photo-draft-results>
                  ${renderResults()}
              </div>
            </div>

            <div
              class="
                modal-footer
                person-photos-adder-footer
              ">

              <span
                class="
                  person-photos-adder-count
                "
                data-add-person-photo-draft-count>
                ${escapeHtml(
                    selectionLabel()
                )}
              </span>

              <div
                class="
                  modal-footer-actions
                ">
                <button
                  class="
                    button
                    secondary
                  "
                  type="button"
                  data-add-person-photo-draft-close>
                  Cancel
                </button>

                <button
                  class="
                    button
                    primary
                  "
                  type="button"
                  data-add-person-photo-draft-save>
                  Save selection
                </button>
              </div>
            </div>
          </div>
        </div>
      `;

    document.body.appendChild(
        overlay
    );

    let backdropDismissBinding = null;

    const closeSelector = () =>
    {
        backdropDismissBinding?.destroy();
        backdropDismissBinding = null;
        overlay.remove();
    };

    backdropDismissBinding =
        bindIntentionalBackdropDismiss(
            overlay,
            closeSelector
        );

    const resultsHost =
        overlay.querySelector(
            '[data-add-person-photo-draft-results]'
        );

    const countElement =
        overlay.querySelector(
            '[data-add-person-photo-draft-count]'
        );

    const searchInput =
        overlay.querySelector(
            '[data-add-person-photo-draft-search]'
        );

    const refreshResults = () =>
    {
        if (resultsHost)
        {
            resultsHost.innerHTML =
                renderResults();

            localizeUI(
                resultsHost
            );
        }

        if (countElement)
        {
            countElement.textContent =
                selectionLabel();
        }
    };

    overlay.addEventListener(
        'click',
        event =>
        {
            if (
                event.target.closest(
                    '[data-add-person-photo-draft-close]'
                )
            )
            {
                closeSelector();
                return;
            }

            const candidate =
                event.target.closest(
                    '[data-add-person-photo-draft-candidate]'
                );

            if (candidate)
            {
                const photoId =
                    candidate.dataset
                        .addPersonPhotoDraftCandidate;

                if (
                    selectedIds.has(
                        photoId
                    )
                )
                {
                    selectedIds.delete(
                        photoId
                    );
                }
                else
                {
                    selectedIds.add(
                        photoId
                    );
                }

                refreshResults();
                return;
            }

            if (
                event.target.closest(
                    '[data-add-person-photo-draft-clear-search]'
                )
            )
            {
                query = '';

                if (searchInput)
                {
                    searchInput.value = '';
                }

                refreshResults();

                searchInput?.focus({
                    preventScroll: true
                });

                return;
            }

            if (
                event.target.closest(
                    '[data-add-person-photo-draft-save]'
                )
            )
            {
                const photoIds = [
                    ...selectedIds
                ];

                closeSelector();

                if (
                    typeof onSave
              === 'function'
                )
                {
                    onSave(photoIds);
                }
            }
        }
    );

    searchInput?.addEventListener(
        'input',
        event =>
        {
            query =
                event.currentTarget
                    .value;

            refreshResults();
        }
    );

    localizeUI(overlay);

    searchInput?.focus({
        preventScroll: true
    });
}

function bindPersonPhotoUnlinkButtons(
    root
)
{
    root
        ?.querySelectorAll(
            '[data-person-photo-unlink]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                event =>
                {
                    event.preventDefault();
                    event.stopPropagation();

                    const photoId =
                        button.dataset
                            .personPhotoUnlink;

                    const personId =
                        button.dataset
                            .personPhotoUnlinkPerson;

                    if (!photoId || !personId)
                    {
                        return;
                    }

                    removePhotoPersonTag(
                        photoId,
                        personId
                    );
                }
            );
        });
}

function openPhotoUnlinkConfirm({
    photo,
    contextLabel,
    primaryPhoto = false,
    onConfirm,
    onCancel = null,
    modalOpener = openModal
})
{
    if (!photo || typeof onConfirm !== 'function') return;

    const ru = state.language === 'ru';
    const photoLabel =
        photo.title || photo.filename || photo.name
        || (ru ? 'Фото без названия' : 'Untitled photo');

    const title = ru ? 'Отвязать фото?' : 'Unlink photo?';

    const message = ru
        ? `Связь фото с «${contextLabel}» будет удалена. Фото останется в альбомах, а остальные связи сохранятся.`
        : `This photo will no longer be linked to “${contextLabel}”. It will remain in Albums and keep its other connections.`;

    const primaryMessage = ru
        ? 'Это фото также перестанет быть основным фото человека.'
        : 'This will also clear the person’s primary photo.';

    modalOpener(`
        <div
          class="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="photoUnlinkTitle">

          <div class="modal-header">
            <div>
              <h2 id="photoUnlinkTitle">${escapeHtml(title)}</h2>
              <p>${escapeHtml(photoLabel)}</p>
            </div>

            <button
              class="close-button"
              type="button"
              data-close
              aria-label="${escapeHtml(ru ? 'Закрыть' : 'Close')}">
              ${icon.close}
            </button>
          </div>

          <div class="modal-body">
            <p>${escapeHtml(message)}</p>
            ${primaryPhoto
                ? `<p><strong>${escapeHtml(primaryMessage)}</strong></p>`
                : ''}
          </div>

          <div class="modal-footer">
            <button class="button secondary" type="button" data-close>
              ${ru ? 'Отмена' : 'Cancel'}
            </button>

            <button
              class="button danger"
              type="button"
              data-confirm-photo-unlink>
              ${ru ? 'Отвязать' : 'Unlink'}
            </button>
          </div>
        </div>
      `);

    const confirmation = modalBackdrop.querySelector('[data-confirm-photo-unlink]')?.closest('.modal');
    let confirmed = false;
    if (onCancel && confirmation)
    {
        const observer = new MutationObserver(() =>
        {
            if (confirmation.isConnected) return;
            observer.disconnect();
            if (!confirmed) onCancel();
        });
        observer.observe(modalBackdrop, { childList: true, subtree: true });
    }
    modalBackdrop
        .querySelector('[data-confirm-photo-unlink]')
        ?.addEventListener('click', event =>
        {
            event.currentTarget.disabled = true;
            confirmed = true;
            closeModal();
            onConfirm();
        }, { once: true });
}

function removePhotoPersonTag(photoId, personId)
{
    const photo = getPhoto(photoId);
    const person = getPerson(personId);

    if (!photo || !person) return;

    openPhotoUnlinkConfirm({
        photo,

        contextLabel:
          person.names?.display
          || person.name
          || (state.language === 'ru' ? 'Человек' : 'Person'),

        primaryPhoto: person.primaryPhotoId === photo.id,

        onConfirm: () =>
        {
            const currentPhoto = getPhoto(photoId);
            const currentPerson = getPerson(personId);

            if (!currentPhoto || !currentPerson) return;

            const removed = setPhotoPersonIds(
                currentPhoto.id,
                (currentPhoto.personIds || []).filter(
                    id => id !== personId
                ),
                { rerender: false }
            );

            if (!removed) return;

            renderAfterPersonConnectedResourcesChanged();
            showToast('Person tag removed.');
        }
    });
}

function toggleAlbumPhotoFavourite(
    photoId,
    {
        focusTarget = 'favorite'
    } = {}
)
{
    const photo =
        getPhoto(
            photoId,
            {
                projectId:
              currentProjectId()
            }
        );

    if (!photo)
    {
        return;
    }

    photo.favorite =
        !photo.favorite;
    photo.favoriteUpdatedAt =
        new Date().toISOString();

    renderAlbumsPreserveViewport({
        focusPhotoId: photo.id,
        focusTarget
    });
}

function togglePhotoSelection(
    photoId
)
{
    const selected =
        new Set(
            state.selectedPhotoIds || []
        );

    selected.has(photoId)
        ? selected.delete(photoId)
        : selected.add(photoId);

    state.selectedPhotoIds = [
        ...selected
    ];

    state.selectedPhotoId =
        photoId;

    renderAlbumsPreserveViewport({
        focusPhotoId: photoId,
        focusTarget: 'selection'
    });
}

function albumsVisibleSelectionState(photos = currentAlbumsPagePhotos())
{
    const visibleIds = (Array.isArray(photos) ? photos : [])
        .map(photo => photo?.id)
        .filter(Boolean);
    const selectedIds = new Set(state.selectedPhotoIds || []);
    const selectedVisibleIds = visibleIds.filter(id => selectedIds.has(id));

    return {
        visibleIds,
        selectedVisibleIds,
        allVisibleSelected: visibleIds.length > 0
          && selectedVisibleIds.length === visibleIds.length,
        someVisibleSelected: selectedVisibleIds.length > 0
    };
}

function toggleAllVisibleAlbumPhotos(photos = currentAlbumsPagePhotos())
{
    const selection = albumsVisibleSelectionState(photos);
    const selectedIds = new Set(state.selectedPhotoIds || []);

    selection.visibleIds.forEach(id =>
    {
        if (selection.allVisibleSelected)
        {
            selectedIds.delete(id);
        }
        else
        {
            selectedIds.add(id);
        }
    });

    state.selectedPhotoIds = [...selectedIds];
    renderAlbumsPreserveViewport();
}

function clearAlbumSelection(
    rerender = true
)
{
    state.selectedPhotoIds = [];

    if (rerender)
    {
        renderAlbumsPreserveViewport();
    }
}

function getAlbumMutationPhotos(
    photoIds
)
{
    const ids =
        new Set(
            (
                Array.isArray(photoIds)
                    ? photoIds
                    : [photoIds]
            ).filter(Boolean)
        );

    return sampleData.media.filter(
        photo =>
            ids.has(photo.id)
          && photo.projectId
            === currentProjectId()
    );
}

function deletePhotosPermanently(
    photoIds
)
{
    const photos =
        getAlbumMutationPhotos(
            photoIds
        );

    if (!photos.length)
    {
        return;
    }

    const ids =
        new Set(
            photos.map(
                photo =>
                    photo.id
            )
        );

    sampleData.projects.forEach(project =>
    {
        if (!ids.has(project.coverPhotoId)) return;
        project.cover = 'paper';
        project.coverPhotoId = '';
        project.coverImageSrc = '';
        touchProjectModified(project);
    });

    sampleData.people.forEach(
        person =>
        {
            if (
                ids.has(
                    person.primaryPhotoId
                )
            )
            {
                person.primaryPhotoId =
                    '';

                person.primaryPhotoCrop =
                    null;
            }

            (
                person.events || []
            ).forEach(event =>
            {
                event.mediaIds =
                    (
                        event.mediaIds || []
                    ).filter(
                        mediaId =>
                            !ids.has(mediaId)
                    );
            });

            (
                person.attributes || []
            ).forEach(attribute =>
            {
                attribute.mediaIds =
                    (
                        attribute.mediaIds
                || []
                    ).filter(
                        mediaId =>
                            !ids.has(mediaId)
                    );
            });
        }
    );

    removeSourceLinksForTargets(
        'photo',
        [...ids]
    );

    centralFamilyRecords()
        .forEach(family =>
        {
            (
                family.events || []
            ).forEach(event =>
            {
                event.mediaIds =
                    (
                        event.mediaIds || []
                    ).filter(
                        mediaId =>
                            !ids.has(mediaId)
                    );
            });

            (
                family.attributes || []
            ).forEach(attribute =>
            {
                attribute.mediaIds =
                    (
                        attribute.mediaIds
                || []
                    ).filter(
                        mediaId =>
                            !ids.has(mediaId)
                    );
            });
        });

    (
        sampleData.events || []
    ).forEach(event =>
    {
        event.mediaIds =
            (
                event.mediaIds || []
            ).filter(
                mediaId =>
                    !ids.has(mediaId)
            );
    });

    sampleData.links =
        (
            sampleData.links || []
        ).filter(link =>
        {
            const mediaSource =
                (
                    link.sourceType
                === 'media'
              && ids.has(
                  link.sourceId
              )
                )
            || (
                link.fromType
                === 'media'
              && ids.has(
                  link.fromId
              )
            );

            const mediaTarget =
                (
                    link.targetType
                === 'media'
              && ids.has(
                  link.targetId
              )
                )
            || (
                link.toType
                === 'media'
              && ids.has(
                  link.toId
              )
            );

            return (
                !mediaSource
            && !mediaTarget
            );
        });

    removePhotosFromAllNotes(
        [...ids]
    );

    for (
        let index =
            sampleData.media.length - 1;
        index >= 0;
        index -= 1
    )
    {
        if (
            ids.has(
                sampleData.media[index].id
            )
        )
        {
            sampleData.media.splice(
                index,
                1
            );
        }
    }

    state.selectedPhotoIds =
        (
            state.selectedPhotoIds || []
        ).filter(
            photoId =>
                !ids.has(photoId)
        );

    if (
        ids.has(
            state.selectedPhotoId
        )
    )
    {
        state.selectedPhotoId =
            null;

        resetAlbumsPhotoEditState();
    }

    if (
        state.personPhotoPicker
    )
    {
        if (
            ids.has(
                state.personPhotoPicker
                    .selectedPhotoId
            )
        )
        {
            state.personPhotoPicker
                .selectedPhotoId =
                    null;
        }

        if (
            ids.has(
                state.personPhotoPicker
                    .initialPhotoId
            )
        )
        {
            state.personPhotoPicker
                .initialPhotoId =
                    null;
        }
    }

    if (
        state.personPhotosAdder
    )
    {
        state.personPhotosAdder
            .selectedProjectPhotoIds =
                (
                    state.personPhotosAdder
                        .selectedProjectPhotoIds
            || []
                ).filter(
                    photoId =>
                        !ids.has(photoId)
                );
    }

    sampleData.events =
        rebuildSampleEventsAndPruneSourceLinks();

    ensureSelectedAlbumPhoto();
    renderAlbums();

    showToast(
        `${photos.length} photo${
            photos.length === 1
                ? ''
                : 's'
        } permanently deleted.`
    );
}

function openDeletePhotoConfirm(
    photoIds
)
{
    const photos =
        getAlbumMutationPhotos(
            photoIds
        );

    if (!photos.length)
    {
        return;
    }

    const ids =
        photos.map(
            photo =>
                photo.id
        );

    const count =
        photos.length;

    const title =
        state.language === 'ru'
            ? count === 1 ? t('Delete photo permanently?')
                : `Удалить ${count} ${{ one: 'фотографию', few: 'фотографии', many: 'фотографий', other: 'фотографии' }[new Intl.PluralRules('ru').select(count)]} безвозвратно?`
            : count === 1 ? 'Delete photo permanently?' : `Delete ${count} photos permanently?`;

    openModal(`
        <div
          class="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="deletePhotoTitle">

          <div class="modal-header">
            <div>
              <h2 id="deletePhotoTitle">
                ${escapeHtml(title)}
              </h2>

              <p>
                This action cannot be undone.
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

          <div class="modal-body">
            <div class="albums-delete-copy">
              ${
                    count === 1
                        ? `
                    <strong>
                      ${escapeHtml(
                            photos[0].title
                        || photos[0].filename
                        || 'Untitled photo'
                        )}
                    </strong>
                  `
                        : `
                    <strong>
                      ${escapeHtml(translateCountPhrase(`${count} photos selected`))}
                    </strong>
                  `
                }

              <p>
                ${escapeHtml(t(count === 1 ? 'The photo will be removed from Albums and all other linked records.' : 'The photos will be removed from Albums and all other linked records.'))}
              </p>

              <p>
                Any affected primary-photo
                assignments will be cleared.
              </p>
            </div>
          </div>

          <div class="modal-footer">
            <button
              class="button secondary"
              type="button"
              data-close>
              Cancel
            </button>

            <button
              class="button danger"
              type="button"
              data-confirm-photo-delete>
              Delete permanently
            </button>
          </div>
        </div>
      `);

    modalBackdrop
        .querySelector(
            '[data-confirm-photo-delete]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                closeModal();

                deletePhotosPermanently(
                    ids
                );
            }
        );
}

function openAlbumPhotoMenu(
    photoId,
    anchor
)
{
    const photo =
        getPhoto(
            photoId,
            {
                projectId:
              currentProjectId()
            }
        );

    if (!photo || !anchor)
    {
        return;
    }

    const favoriteLabel =
        photo.favorite
            ? 'Remove from favourites'
            : 'Mark as favourite';

    mountAlbumsActionMenu(
        anchor,
        `
        <button
          type="button"
          role="menuitem"
          data-photo-action="open">
          Open
        </button>

        <button
          type="button"
          role="menuitem"
          data-photo-action="favorite">
          ${escapeHtml(
                favoriteLabel
            )}
        </button>

        <button
          type="button"
          role="menuitem"
          data-photo-action="people">
          Tag people
        </button>

        <button
          type="button"
          role="menuitem"
          data-photo-action="album">
          Add to album
        </button>

        <button
          class="danger"
          type="button"
          role="menuitem"
          data-photo-action="delete">
          Delete photo
        </button>
      `,
        'data-photo-action',
        action =>
        {
            if (action === 'open')
            {
                openPhotoLightbox(
                    photo.id
                );

                return;
            }

            if (
                action === 'favorite'
            )
            {
                toggleAlbumPhotoFavourite(
                    photo.id
                );

                return;
            }

            if (action === 'people')
            {
                openPhotoPeopleModal(
                    photo.id
                );

                return;
            }

            if (action === 'album')
            {
                state.selectedPhotoIds = [
                    photo.id
                ];

                openAddToAlbumModal();

                return;
            }

            if (action === 'delete')
            {
                openDeletePhotoConfirm([
                    photo.id
                ]);
            }
        },
        'albums-photo-action-menu'
    );
}

function mountAlbumsActionMenu(
    anchor,
    markup,
    attributeName,
    onAction,
    className = ''
)
{
    closeMenu();

    const rect =
        anchor.getBoundingClientRect();

    const menu =
        document.createElement('div');

    menu.className =
        `menu-popover ${className}`.trim();
    menu.id = 'projectMenu';
    menu.setAttribute('role', 'menu');

    menu.style.visibility = 'hidden';
    menu.style.top =
        `${rect.bottom + 6}px`;
    menu.style.left = '0px';

    menu.innerHTML = markup;

    document.body.appendChild(menu);

    const margin = 12;
    const menuRect =
        menu.getBoundingClientRect();

    menu.style.left = `${
        Math.max(
            margin,
            Math.min(
                rect.right - menuRect.width,
                window.innerWidth
              - menuRect.width
              - margin
            )
        )
    }px`;

    const below =
        rect.bottom + 6;

    menu.style.top = `${
        below + menuRect.height
          <= window.innerHeight - margin
            ? below
            : Math.max(
                margin,
                rect.top
                  - menuRect.height
                  - 6
            )
    }px`;

    menu.style.visibility = 'visible';

    menu.addEventListener(
        'click',
        event =>
        {
            const target =
                event.target.closest(
                    `[${attributeName}]`
                );

            const action =
                target?.getAttribute(
                    attributeName
                );

            if (!action) return;

            anchor.focus({ preventScroll: true });
            closeMenu();
            onAction(action);
        }
    );

    setTimeout(() =>
    {
        document.addEventListener(
            'click',
            closeMenu
        );

        document.addEventListener(
            'scroll',
            closeMenu,
            true
        );
    }, 0);
}

function openAlbumsInspectorMenu(
    photoId,
    anchor
)
{
    const photo =
        getPhoto(
            photoId,
            {
                projectId:
              currentProjectId()
            }
        );

    if (!photo)
    {
        return;
    }

    mountAlbumsActionMenu(
        anchor,
        `
          <button
            type="button"
            role="menuitem"
            data-albums-inspector-action="save-copy">
            Save copy
          </button>

          <button
            type="button"
            role="menuitem"
            data-albums-inspector-action="album">
            Add to album
          </button>

          <button
            class="danger"
            type="button"
            role="menuitem"
            data-albums-inspector-action="delete">
            Delete photo
          </button>
        `,
        'data-albums-inspector-action',
        action =>
        {
            if (
                action === 'save-copy'
            )
            {
                showToast(
                    'Save copy will be available when real photo files are implemented.'
                );

                return;
            }

            if (action === 'album')
            {
                state.selectedPhotoIds = [
                    photo.id
                ];

                openAddToAlbumModal();

                return;
            }

            if (action === 'delete')
            {
                openDeletePhotoConfirm([
                    photo.id
                ]);
            }
        }
    );
}

function clearPersonPrimaryPhoto(
    personId,
    photoId
)
{
    const person =
        getPerson(personId);

    if (
        !person
        || person.primaryPhotoId
          !== photoId
    )
    {
        return;
    }

    person.primaryPhotoId = '';
    person.primaryPhotoCrop = null;

    renderAlbums();
    showToast(
        'Primary photo removed.'
    );
}

function openAlbumsPhotoPersonMenu(
    photoId,
    personId,
    anchor
)
{
    const photo =
        getPhoto(photoId);

    const person =
        getPerson(personId);

    if (!photo || !person)
    {
        return;
    }

    const isPrimary =
        person.primaryPhotoId
          === photo.id;

    const needsFaceRegion = (photo.personIds || []).includes(person.id)
        && !photoPersonRegion(photo, person.id);

    mountAlbumsActionMenu(
        anchor,
        `
          <button
            type="button"
            role="menuitem"
            data-albums-person-action="tree">
            Show in Family Tree
          </button>

          <button
            type="button"
            role="menuitem"
            data-albums-person-action="profile">
            Open profile
          </button>

          ${needsFaceRegion ? `
          <button
            type="button"
            role="menuitem"
            data-albums-person-action="select-face">
            Select face
          </button>` : ''}

          <button
            type="button"
            role="menuitem"
            data-albums-person-action="primary">
            ${
                isPrimary
                    ? 'Remove as primary photo'
                    : 'Use as primary photo'
            }
          </button>

          <button
            class="danger"
            type="button"
            role="menuitem"
            data-albums-person-action="remove">
            Remove tag
          </button>
        `,
        'data-albums-person-action',
        action =>
        {
            if (action === 'tree')
            {
                showPersonInFamilyTree(
                    person.id
                );
            }

            if (action === 'profile')
            {
                openPeopleProfileFromRow(
                    person.id
                );
            }

            if (action === 'select-face')
            {
                openPhotoPeopleModal(photo.id, { activePersonId: person.id });
            }

            if (action === 'primary')
            {
                if (isPrimary)
                {
                    clearPersonPrimaryPhoto(
                        person.id,
                        photo.id
                    );
                }
                else
                {
                    openPersonPhotoAdjuster(
                        person.id,
                        photo.id
                    );
                }
            }

            if (action === 'remove')
            {
                removePhotoPersonTag(
                    photo.id,
                    person.id
                );
            }
        }
    );
}

function openNewAlbumModal()
{
    openModal(`
        <div
          class="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="newAlbumTitle">

          <div class="modal-header">
            <div>
              <h2 id="newAlbumTitle">
                New album
              </h2>

              <p>
                Create a named group of photos.
              </p>
            </div>

            <button
              class="close-button"
              type="button"
              data-close>
              ${icon.close}
            </button>
          </div>

          <form id="newAlbumForm">
            <div class="modal-body form-grid">
              <div class="field">
                <label for="albumName">
                  Album name
                </label>

                <input
                  id="albumName"
                  required
                  placeholder="e.g. Whiskerfield family photos">
              </div>

              <div class="field">
                <label for="albumDescription">
                  Description
                </label>

                <textarea
                  id="albumDescription"
                  placeholder="e.g. Portraits, documents, and family photos connected to the Whiskerfield family."></textarea>
              </div>
            </div>

            <div class="modal-footer">
              <button
                class="button secondary"
                type="button"
                data-close>
                Cancel
              </button>

              <button
                class="button primary"
                type="submit">
                Create album
              </button>
            </div>
          </form>
        </div>
      `);

    modalBackdrop
        .querySelector(
            '#newAlbumForm'
        )
        ?.addEventListener(
            'submit',
            event =>
            {
                event.preventDefault();
                const projectId = requireActiveProjectId();
                if (!projectId) return;

                const album = {
                    id:
                `album-${Date.now()}`,

                    projectId,

                    name:
                modalBackdrop
                    .querySelector(
                        '#albumName'
                    )
                    .value
                    .trim(),

                    description:
                modalBackdrop
                    .querySelector(
                        '#albumDescription'
                    )
                    .value
                    .trim(),

                    createdAt:
                new Date()
                    .toISOString()
                };

                if (!album.name)
                {
                    return;
                }

                sampleData.albums.push(
                    album
                );

                state.albumsView =
                    'album';

                state.activeAlbumId =
                    album.id;

                closeModal();
                renderAlbums();

                showToast(
                    'Album created.'
                );
            }
        );
}

function openEditAlbumModal()
{
    const album =
        getProjectAlbums()
            .find(item =>
                item.id === state.activeAlbumId
            );

    if (!album)
    {
        return;
    }

    const sourceName =
        album.name || '';

    const sourceDescription =
        album.description || '';

    openModal(`
        <div
          class="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="editAlbumTitle">

          <div class="modal-header">
            <div>
              <h2 id="editAlbumTitle">
                Edit album
              </h2>

              <p>
                ${escapeHtml(
                    album.name
                )}
              </p>
            </div>

            <button
              class="close-button"
              type="button"
              data-close>
              ${icon.close}
            </button>
          </div>

          <form id="editAlbumForm">
            <div class="modal-body form-grid">
              <div class="field">
                <label for="editAlbumName">
                  Album name
                </label>

                <input
                  id="editAlbumName"
                  required
                  data-source-value="${escapeHtml(
                        sourceName
                    )}"
                  value="${escapeHtml(
                        localizedDataFieldValue(
                            sourceName
                        )
                    )}">
              </div>

              <div class="field">
                <label for="editAlbumDescription">
                  Description
                </label>

                <textarea
                  id="editAlbumDescription"
                  data-source-value="${escapeHtml(
                        sourceDescription
                    )}">${escapeHtml(
                        localizedDataFieldValue(
                            sourceDescription
                        )
                    )}</textarea>
              </div>
            </div>

            <div class="modal-footer">
              <button
                class="button danger"
                type="button"
                id="deleteAlbumButton">
                Delete album
              </button>

              <button
                class="button secondary"
                type="button"
                data-close>
                Cancel
              </button>

              <button
                class="button primary"
                type="submit">
                Save
              </button>
            </div>
          </form>
        </div>
      `);

    modalBackdrop
        .querySelector('#editAlbumForm')
        ?.addEventListener(
            'submit',
            event =>
            {
                event.preventDefault();

                const nameInput =
                    modalBackdrop.querySelector(
                        '#editAlbumName'
                    );

                const descriptionInput =
                    modalBackdrop.querySelector(
                        '#editAlbumDescription'
                    );

                const nextName =
                    collectLocalizedDataFieldValue(
                        nameInput,
                        nameInput?.dataset.sourceValue
                ?? sourceName
                    ).trim();

                const nextDescription =
                    collectLocalizedDataFieldValue(
                        descriptionInput,
                        descriptionInput?.dataset.sourceValue
                ?? sourceDescription
                    ).trim();

                album.name =
                    nextName || sourceName;

                album.description =
                    nextDescription;

                closeModal();
                renderAlbums();

                showToast(
                    'Album updated.'
                );
            }
        );

    modalBackdrop
        .querySelector('#deleteAlbumButton')
        ?.addEventListener(
            'click',
            () =>
                openDeleteAlbumConfirm(
                    album.id
                )
        );
}

function openDeleteAlbumConfirm(albumId)
{
    const album = getProjectAlbums().find(item => item.id === albumId);
    if (!album) return;
    openModal(`<div class="modal" role="dialog" aria-modal="true" aria-labelledby="deleteAlbumTitle"><div class="modal-header"><div><h2 id="deleteAlbumTitle">Delete album?</h2><p>${escapeHtml(album.name)}</p></div><button class="close-button" type="button" data-close>${icon.close}</button></div><div class="modal-body"><p>Photos remain in All photos. Album membership will be removed.</p></div><div class="modal-footer"><button class="button secondary" type="button" data-close>Cancel</button><button class="button danger" type="button" data-confirm-album-delete>Delete album</button></div></div>`);
    modalBackdrop.querySelector('[data-confirm-album-delete]')?.addEventListener('click', () =>
    {
        const albumIndex = sampleData.albums.findIndex(item => item.id === album.id);
        if (albumIndex >= 0) sampleData.albums.splice(albumIndex, 1);
        const now = new Date().toISOString();
        sampleData.media.forEach(photo =>
        {
            if (!(photo.albumIds || []).includes(album.id)) return;
            photo.albumIds = photo.albumIds.filter(id => id !== album.id);
            photo.updatedAt = now;
        });
        state.albumsView = 'all'; state.activeAlbumId = null; closeModal(); renderAlbums(); showToast('Album deleted. Photos remain in All photos.');
    });
}

function openAddPhotosModal()
{
    const projectId =
        requireActiveProjectId();

    if (!projectId)
    {
        return;
    }

    /*
      * Capture the destination when the modal
      * opens. Switching state while files are
      * being read cannot redirect the upload.
      */
    const targetAlbumId =
        state.albumsView === 'album'
        && state.activeAlbumId
        && getProjectAlbums(
            projectId
        ).some(
            album =>
                album.id
            === state.activeAlbumId
        )
            ? state.activeAlbumId
            : '';

    let uploadDrafts = [];
    let uploadErrors = [];
    let processing = false;

    const renderUploadTile = draft => `
        <article class="rp-upload-tile">
          <span class="rp-upload-tile-preview"><img src="${escapeHtml(draft.src)}" alt=""></span>
          <strong title="${escapeHtml(draft.filename)}">${escapeHtml(draft.filename)}</strong>
          <small>${draft.width} × ${draft.height} · ${formatMediaBytes(draft.sizeBytes)}</small>
          <button class="rp-upload-remove" type="button"
            data-person-photos-adder-remove-upload="${escapeHtml(draft.id)}"
            aria-label="${escapeHtml(`Remove ${draft.filename}`)}">${icon.close}</button>
        </article>
      `;
    const renderUploadErrors = () =>
    {
        if (!uploadErrors.length)
        {
            return '';
        }

        return `
          <div
            class="
              person-photos-adder-upload-errors
            "
            role="alert">

            <strong>
              ${
                    uploadErrors.length === 1
                        ? 'One file could not be added:'
                        : `${
                            uploadErrors.length
                        } files could not be added:`
                }
            </strong>

            <ul>
              ${uploadErrors
                    .map(error => `
                  <li>
                    ${escapeHtml(error)}
                  </li>
                `)
                    .join('')}
            </ul>
          </div>
        `;
    };

    const processFiles =
        async fileList =>
        {
            if (processing)
            {
                return;
            }

            const knownSignatures =
                new Set(
                    uploadDrafts.map(
                        draft =>
                            draft.signature
                    )
                );

            const files =
                Array.from(
                    fileList || []
                ).filter(file =>
                {
                    const signature =
                        photoUploadFileSignature(
                            file
                        );

                    if (
                        knownSignatures.has(
                            signature
                        )
                    )
                    {
                        return false;
                    }

                    knownSignatures.add(
                        signature
                    );

                    return true;
                });

            if (!files.length)
            {
                return;
            }

            processing = true;

            const modal =
                modalBackdrop.querySelector(
                    '[data-albums-photo-upload]'
                );

            modal
                ?.querySelectorAll(
                    'button'
                )
                .forEach(button =>
                {
                    button.disabled = true;
                });

            const results =
                await Promise.all(
                    files.map(async file =>
                    {
                        try
                        {
                            return {
                                draft:
                      await createPhotoUploadDraft(
                          file,
                          {
                              idPrefix:
                            'albums-photo-upload-draft'
                          }
                      ),

                                error:
                      ''
                            };
                        }
                        catch (error)
                        {
                            return {
                                draft:
                      null,

                                error:
                      error?.message
                      || `${
                          file.name
                        || 'File'
                      } — could not be read`
                            };
                        }
                    })
                );

            processing = false;

            uploadDrafts = [
                ...uploadDrafts,

                ...results
                    .map(result =>
                        result.draft
                    )
                    .filter(Boolean)
            ];

            uploadErrors =
                results
                    .map(result =>
                        result.error
                    )
                    .filter(Boolean);

            renderDialog();
        };

    const commitUploads = () =>
    {
        if (
            processing
          || !uploadDrafts.length
        )
        {
            return;
        }

        if (
            uploadDrafts.some(
                draft =>
                    !photoUploadDraftIsValid(
                        draft
                    )
            )
        )
        {
            uploadErrors = [
                'One or more uploaded photos are no longer valid. Remove them and choose the files again.'
            ];

            renderDialog();
            return;
        }

        const createdPhotos =
            uploadDrafts
                .map(draft =>
                    createMediaFromPhotoUpload({
                        projectId,

                        draft,

                        personIds:
                  [],

                        idPrefix:
                  'photo-albums'
                    })
                )
                .filter(Boolean);

        if (!createdPhotos.length)
        {
            uploadErrors = [
                'No valid photos were added.'
            ];

            renderDialog();
            return;
        }

        if (targetAlbumId)
        {
            createdPhotos.forEach(photo =>
            {
                photo.albumIds = [
                    ...new Set([
                        ...(photo.albumIds || []),
                        targetAlbumId
                    ])
                ];
            });
        }

        const project =
            sampleData.projects.find(
                item =>
                    item.id === projectId
            );

        touchProjectModified(
            project
        );

        state.selectedPhotoIds = [];

        state.selectedPhotoId =
            createdPhotos[0].id;

        closeModal({
            force: true
        });

        renderAlbums();

        showToast(
            'Photos added'
        );
    };

    const bindDialog = () =>
    {
        const modal =
            modalBackdrop.querySelector(
                '[data-albums-photo-upload]'
            );

        if (!modal)
        {
            return;
        }

        const fileInput =
            modal.querySelector(
                '[data-albums-photo-upload-file]'
            );


        fileInput?.addEventListener(
            'change',
            () =>
            {
                processFiles(
                    fileInput.files
                );
            }
        );

        const dropzone =
            modal.querySelector(
                '[data-albums-photo-upload-dropzone]'
            );

        if (dropzone)
        {
            bindUploadDropzoneChooser(dropzone, fileInput);
            [
                'dragenter',
                'dragover'
            ].forEach(type =>
            {
                dropzone.addEventListener(
                    type,
                    event =>
                    {
                        event.preventDefault();

                        dropzone.classList.add(
                            'is-dragging'
                        );
                    }
                );
            });

            [
                'dragleave',
                'drop'
            ].forEach(type =>
            {
                dropzone.addEventListener(
                    type,
                    event =>
                    {
                        event.preventDefault();

                        dropzone.classList.remove(
                            'is-dragging'
                        );
                    }
                );
            });

            dropzone.addEventListener(
                'drop',
                event =>
                {
                    processFiles(
                        event.dataTransfer?.files
                    );
                }
            );
        }

        modal.addEventListener(
            'click',
            event =>
            {
                const removeButton =
                    event.target.closest(
                        '[data-person-photos-adder-remove-upload]'
                    );

                if (removeButton)
                {
                    const draftId =
                        removeButton.dataset
                            .personPhotosAdderRemoveUpload;

                    uploadDrafts =
                        uploadDrafts.filter(
                            draft =>
                                draft.id !== draftId
                        );

                    uploadErrors = [];

                    renderDialog();
                    return;
                }

                if (
                    event.target.closest(
                        '[data-albums-photo-upload-save]'
                    )
                )
                {
                    commitUploads();
                }
            }
        );
    };

    const renderDialog = () =>
    {
        const maxMegabytes =
            Math.round(
                PHOTO_UPLOAD_MAX_BYTES
            / (
                1024 * 1024
            )
            );

        const photoCount =
            uploadDrafts.length;

        openModal(`
          <div
            class="
              modal
              person-photo-picker-modal
              person-photos-adder-modal
              rp-upload-staging
              ${photoCount ? 'has-items' : ''}
            "
            data-albums-photo-upload
            role="dialog"
            aria-modal="true"
            aria-labelledby="
              albumsPhotoUploadTitle
            ">

            <div class="modal-header">
              <div>
                <h2
                  id="
                    albumsPhotoUploadTitle
                  ">
                  Add photos
                </h2>

                <p>${escapeHtml(t(targetAlbumId
                    ? 'New photos will be added to the current album.'
                    : 'New photos will be added to the current project.'))}</p>
              </div>

              <button
                class="close-button"
                type="button"
                data-close
                aria-label="
                  Close add photos dialog
                ">
                ${icon.close}
              </button>
            </div>

            <div
              class="
                modal-body
                person-photo-picker-body
                person-photos-adder-body
              ">

              <div
                class="
                  person-photos-adder-upload-panel
                ">

                <div
                  class="
                    person-photo-upload-dropzone
                  person-photos-adder-upload-dropzone upload-dropzone
                    ${
                        photoCount
                            ? 'has-drafts'
                            : ''
                    }
                  "
            data-albums-photo-upload-dropzone role="button" tabindex="0" aria-label="${escapeHtml(t('Choose photos'))}">

                  <input
                    type="file"
                    accept="${
                        PHOTO_UPLOAD_ALLOWED_TYPES
                            .join(',')
                    }"
                    multiple
                    data-albums-photo-upload-file
                    hidden>

${renderUploadDropzonePrompt(photoCount ? 'Add more photos' : 'Drop photos here or choose photos', state.language === 'ru' ? `JPEG, PNG или WebP, до ${maxMegabytes} МБ на файл.` : `JPEG, PNG, or WebP up to ${maxMegabytes} MB each.`)}
                </div>

                ${renderUploadErrors()}

                ${
                    photoCount
                        ? `
                      <div
                        class="
                          rp-upload-tiles
                        ">
                        ${uploadDrafts
                            .map(renderUploadTile)
                            .join('')}
                      </div>
                    `
                        : ''
                }
              </div>
            </div>

            <div
              class="
                modal-footer
                person-photos-adder-footer
              ">

              <p class="albums-photo-upload-notice">
                <span aria-hidden="true">${icon.warning}</span>
                <span>${escapeHtml(t('Uploaded files are available until page reload.'))}</span>
              </p>

              <div
                class="
                  modal-footer-actions
                ">

                <button
                  class="button secondary"
                  type="button"
                  data-close>
                  Cancel
                </button>

                <button
                  class="button primary"
                  type="button"
                  data-albums-photo-upload-save
                  ${
                        photoCount
                            ? ''
                            : 'disabled'
                    }>
                  ${
                        photoCount === 1
                            ? 'Add photo'
                            : 'Add photos'
                    }
                </button>
              </div>
            </div>
          </div>
        `);

        bindDialog();
    };

    renderDialog();
}

function openAddToAlbumModal()
{
    const projectId =
        currentProjectId();

    const photoIds = [
        ...new Set(
            state.selectedPhotoIds || []
        )
    ].filter(photoId =>
        Boolean(
            getPhoto(
                photoId,
                {
                    projectId
                }
            )
        )
    );

    if (!photoIds.length)
    {
        return;
    }

    let query = '';
    let createMode = false;

    const selectedAlbumIds =
        new Set(getProjectAlbums(projectId).filter(album => getAlbumSelectedPhotoMembership(album.id, photoIds).complete).map(album => album.id));
    const albumDecisions = new Map();
    let createdAlbumId = '';

    const createDraft = {
        name: '',
        description: ''
    };

    const allAlbums = () =>
        getProjectAlbums(
            projectId
        );

    const visibleAlbums = () =>
    {
        const normalizedQuery =
            query
                .trim()
                .toLowerCase();

        if (!normalizedQuery)
        {
            return allAlbums();
        }

        return allAlbums().filter(
            album =>
                album.id === createdAlbumId || albumPickerSearchText(
                    album
                ).includes(
                    normalizedQuery
                )
        );
    };

    const photoCountLabel = () =>
        translateText(
            `${photoIds.length} selected ${
                photoIds.length === 1
                    ? 'photo'
                    : 'photos'
            }`
        );

    const selectionLabel = () =>
    {
        return rpText(`${albumDecisions.size} changes`, `Изменений: ${albumDecisions.size}`);
    };

    const saveLabel = () =>
    {
        return t('Save changes');
    };

    const renderAlbumRow =
        album =>
        {
            const membership =
                getAlbumSelectedPhotoMembership(
                    album.id,
                    photoIds
                );

            const selected =
                selectedAlbumIds.has(
                    album.id
                );

            const previewPhoto =
                getAlbumPreviewPhoto(
                    album.id
                );

            const albumPhotoCount =
                getAlbumPhotoCount(
                    album.id
                );

            let membershipLabel = '';

            if (membership.complete)
            {
                membershipLabel =
                    translateText(
                        'Already added'
                    );
            }
            else if (
                membership.existingCount
            )
            {
                membershipLabel =
                    translateText(
                        `${membership.existingCount} of ${
                            membership.selectedPhotoCount
                        } already added`
                    );
            }

            return `
            <label
              class="
                album-picker-result
                ${
                    selected
                        ? 'is-selected'
                        : ''
                }
                ${
                    membership.complete
                        ? 'is-complete'
                        : ''
                }
              "
              data-album-picker-row="${
                    escapeHtml(album.id)
                }">

              <span
                class="
                  album-picker-cover
                ">
                ${
                    previewPhoto
                        ? renderPhotoThumbnail(
                            previewPhoto,
                            {
                                label:
                            album.name
                            }
                        )
                        : icon.folder
                }
              </span>

              <span
                class="
                  album-picker-copy
                ">
                <strong>
                  ${escapeHtml(
                        album.name
                    || 'Untitled album'
                    )}
                </strong>

                <span
                  class="
                    album-picker-description
                  ">
                  ${escapeHtml(
                        album.description
                    || 'No description'
                    )}
                </span>

                <span
                  class="
                    album-picker-meta
                  ">
                  <span>
                    ${albumPhotoCount}
                    ${
                        albumPhotoCount === 1
                            ? 'photo'
                            : 'photos'
                    }
                  </span>

                  ${
                        membershipLabel
                            ? `
                        <span
                          aria-hidden="true">
                          ·
                        </span>

                        <span
                          class="
                            album-picker-membership
                            ${
                                membership.complete
                                    ? 'complete'
                                    : ''
                            }
                          ">
                          ${escapeHtml(
                                membershipLabel
                            )}
                        </span>
                      `
                            : ''
                    }
                </span>
              </span>

              <input
                type="checkbox"
                value="${
                    escapeHtml(album.id)
                }"
                data-album-picker-choice
                ${
                    selected
                        ? 'checked'
                        : ''
                }
                ${
                    membership.complete
                        ? 'disabled'
                        : ''
                }
                aria-label="${
                    escapeHtml(
                        membership.complete
                            ? `${
                                album.name
                            } already contains all selected photos`
                            : `${
                                selected
                                    ? 'Remove'
                                    : 'Add'
                            } ${
                                album.name
                            }`
                    )
                }">
            </label>
          `;
        };

    const renderResults = () =>
    {
        const albums =
            visibleAlbums();

        if (albums.length)
        {
            return albums
                .map(renderAlbumRow)
                .join('');
        }

        if (query.trim())
        {
            return `
            <div
              class="
                album-picker-empty
              ">
              <div
                class="
                  album-picker-empty-card
                ">
                <strong>
                  No albums match this search
                </strong>

                <p>
                  Try another album name
                  or description.
                </p>

                <div
                  class="
                    album-picker-empty-actions
                  ">
                  <button
                    class="
                      button
                      secondary
                    "
                    type="button"
                    data-album-picker-clear-search>
                    Clear search
                  </button>

                  <button
                    class="
                      button
                      primary
                    "
                    type="button"
                    data-album-picker-create>
                    Create album
                  </button>
                </div>
              </div>
            </div>
          `;
        }

        return `
          <div
            class="
              album-picker-empty
            ">
            <div
              class="
                album-picker-empty-card
              ">
              <strong>
                No albums yet
              </strong>

              <p>
                Create an album to
                organize the selected
                photos.
              </p>

              <button
                class="
                  button
                  primary
                "
                type="button"
                data-album-picker-create>
                Create album
              </button>
            </div>
          </div>
        `;
    };

    openModal(`
        <div
          class="
            modal
            photo-people-modal
            album-picker-modal
          "
          role="dialog"
          aria-modal="true"
          aria-labelledby="
            addToAlbumTitle
          ">

          <div class="modal-header">
            <div>
              <h2 id="addToAlbumTitle">
                Add to album
              </h2>

              <p>
                ${escapeHtml(
                    photoCountLabel()
                )}
              </p>
            </div>

            <button
              class="close-button"
              type="button"
              data-close
              aria-label="
                Close add to album dialog
              ">
              ${icon.close}
            </button>
          </div>

          <div
            class="
              album-picker-body
            ">

            <div
              class="
                album-picker-browse
              "
              data-album-picker-browse>

              <div
                class="
                  field
                  photo-people-search-field
                  album-picker-search
                ">
                <label
                  for="albumPickerSearch">
                  Find albums
                </label>

                <div
                  class="search-input">
                  ${icon.search}

                  <input
                    id="albumPickerSearch"
                    type="search"
                    data-album-picker-search
                    placeholder="Search albums"
                    autocomplete="off">
                </div>
              </div>

              <section
                class="
                  album-picker-results-panel
                ">

                <div
                  class="
                    album-picker-results-head
                  ">

                  <div
                    class="
                      album-picker-results-heading
                    ">
                    <strong
                      data-album-picker-results-title>
                      All albums
                    </strong>

                    <span
                      data-album-picker-results-meta>
                    </span>
                  </div>

                  <button
                    class="
                      button
                      secondary
                      compact
                      album-picker-new-button
                    "
                    type="button"
                    data-album-picker-create>
                    ${icon.plus}
                    New album
                  </button>
                </div>

                <div
                  class="
                    photo-people-results
                    album-picker-results
                  "
                  data-album-picker-results>
                </div>
              </section>
            </div>

            <form
              id="albumPickerCreateForm"
              class="album-picker-create"
              data-album-picker-create-form
              hidden>

              <div
                class="
                  album-picker-create-copy
                ">
                <strong>
                  Create a new album
                </strong>

                <span>
                  The new album will be
                  selected automatically.
                </span>
              </div>

              <div
                class="
                  album-picker-create-fields
                ">

                <div class="field">
                  <label
                    for="albumPickerName">
                    Album name
                  </label>

                  <input
                    id="albumPickerName"
                    data-album-picker-name
                    required
                    autocomplete="off"
                    placeholder="e.g. Whiskerfield family photos">
                </div>

                <div class="field">
                  <label
                    for="
                      albumPickerDescription
                    ">
                    Description
                  </label>

                  <textarea
                    id="albumPickerDescription"
                    data-album-picker-description
                    placeholder="e.g. Portraits, documents, and family photos connected to the Whiskerfield family.">
                  </textarea>
                </div>
              </div>
            </form>
          </div>

          <div
            class="
              modal-footer
              photo-people-footer
              album-picker-footer
            ">

            <span
              class="
                photo-people-selection-count
              "
              data-album-picker-count>
            </span>

            <div
              class="
                album-picker-footer-actions
              "
              data-album-picker-footer-actions>
            </div>
          </div>
        </div>
      `);

    const modal =
        modalBackdrop.querySelector(
            '.album-picker-modal'
        );

    if (!modal) return;

    rpInitMembershipPicker(modal);

    const browsePanel =
        modal.querySelector(
            '[data-album-picker-browse]'
        );

    const createPanel =
        modal.querySelector(
            '[data-album-picker-create-form]'
        );

    const resultsHost =
        modal.querySelector(
            '[data-album-picker-results]'
        );

    const resultsTitle =
        modal.querySelector(
            '[data-album-picker-results-title]'
        );

    const resultsMeta =
        modal.querySelector(
            '[data-album-picker-results-meta]'
        );

    const countElement =
        modal.querySelector(
            '[data-album-picker-count]'
        );

    const footerActions =
        modal.querySelector(
            '[data-album-picker-footer-actions]'
        );

    const searchInput =
        modal.querySelector(
            '[data-album-picker-search]'
        );

    const nameInput =
        modal.querySelector(
            '[data-album-picker-name]'
        );

    const descriptionInput =
        modal.querySelector(
            '[data-album-picker-description]'
        );

    const refreshFooter = () =>
    {
        if (
            !countElement
          || !footerActions
        )
        {
            return;
        }

        if (createMode)
        {
            countElement.textContent =
                t('Create a new album');

            footerActions.innerHTML = `
            <button
              class="button secondary"
              type="button"
              data-album-picker-back>
              ${escapeHtml(
                    t('Cancel')
                )}
            </button>

            <button
              class="
                button
                primary
                album-picker-save
              "
              type="submit"
              form="albumPickerCreateForm"
              data-album-picker-create-save
              ${
                    createDraft.name.trim()
                        ? ''
                        : 'disabled'
                }>
              ${escapeHtml(
                    t('Create and select')
                )}
            </button>
          `;

            return;
        }

        countElement.textContent =
            selectionLabel();

        footerActions.innerHTML = `
          <button
            class="button secondary"
            type="button"
            data-album-picker-cancel>
            ${escapeHtml(
                t('Cancel')
            )}
          </button>

          <button
            class="
              button
              primary
              album-picker-save
            "
            type="button"
            data-album-picker-save
            ${
                albumDecisions.size
                    ? ''
                    : 'disabled'
            }>
            ${escapeHtml(
                saveLabel()
            )}
          </button>
        `;
    };

    const refreshResults = () =>
    {
        const albums =
            visibleAlbums();

        const total =
            allAlbums().length;

        const hasQuery =
            Boolean(
                query.trim()
            );

        if (resultsTitle)
        {
            resultsTitle.textContent =
                t(
                    hasQuery
                        ? 'Search results'
                        : 'All albums'
                );
        }

        if (resultsMeta)
        {
            const source =
                hasQuery
                    ? `${albums.length} of ${total} albums`
                    : `${total} ${
                        total === 1
                            ? 'album'
                            : 'albums'
                    }`;

            resultsMeta.textContent =
                translateText(source);
        }

        if (resultsHost)
        {
            resultsHost.innerHTML =
                renderResults();

            localizeUI(
                resultsHost
            );
            rpRefreshMembershipRows(resultsHost);
            resultsHost.querySelectorAll('[data-album-picker-choice]').forEach(input =>
            {
                const membership = getAlbumSelectedPhotoMembership(input.value, photoIds);
                input.indeterminate = membership.existingCount > 0 && !membership.complete && !albumDecisions.has(input.value);
            });
        }

        refreshFooter();
    };

    const showBrowse = () =>
    {
        createMode = false;

        browsePanel.hidden = false;
        createPanel.hidden = true;

        refreshResults();

        requestAnimationFrame(
            () =>
            {
                modal.querySelector('.album-picker-new-button')?.focus({
                    preventScroll: true
                });
            }
        );
    };

    const showCreate = () =>
    {
        createMode = true;

        browsePanel.hidden = true;
        createPanel.hidden = false;

        if (nameInput)
        {
            nameInput.value =
                createDraft.name;
        }

        if (descriptionInput)
        {
            descriptionInput.value =
                createDraft.description;
        }

        refreshFooter();

        requestAnimationFrame(
            () =>
            {
                nameInput?.focus({
                    preventScroll: true
                });
            }
        );
    };

    const requestReturn = rpMembershipReturn(modal, { isCreating: () => createMode,
        isDirty: () => Boolean(createDraft.name.trim() || createDraft.description.trim()), returnToResults: () =>
        {
            createDraft.name = ''; createDraft.description = '';
            showBrowse();
        } });

    searchInput?.addEventListener(
        'input',
        event =>
        {
            query =
                event.currentTarget.value;

            refreshResults();
        }
    );

    nameInput?.addEventListener(
        'input',
        event =>
        {
            createDraft.name =
                event.currentTarget.value;

            refreshFooter();
        }
    );

    descriptionInput
        ?.addEventListener(
            'input',
            event =>
            {
                createDraft.description =
                    event.currentTarget.value;
            }
        );

    createPanel.addEventListener(
        'submit',
        event =>
        {
            event.preventDefault();

            const name =
                createDraft.name.trim();

            if (!name)
            {
                nameInput?.focus();
                return;
            }

            const album = {
                id:
              `album-${Date.now()}`,

                projectId,

                name,

                description:
              createDraft.description
                  .trim(),

                createdAt:
              new Date()
                  .toISOString()
            };

            sampleData.albums.push(
                album
            );

            selectedAlbumIds.add(
                album.id
            );

            createdAlbumId = album.id;
            albumDecisions.set(album.id, true);
            createDraft.name = '';
            createDraft.description = '';

            showBrowse();

            requestAnimationFrame(
                () =>
                {
                    modal
                        .querySelector(
                            `[data-album-picker-row="${
                                CSS.escape(album.id)
                            }"]`
                        )
                        ?.scrollIntoView({
                            block: 'nearest'
                        });
                }
            );
        }
    );

    modal.addEventListener(
        'change',
        event =>
        {
            const checkbox =
                event.target.closest(
                    '[data-album-picker-choice]'
                );

            if (!checkbox) return;

            const albumId =
                checkbox.value;

            if (checkbox.checked)
            {
                selectedAlbumIds.add(
                    albumId
                );
            }
            else
            {
                selectedAlbumIds.delete(
                    albumId
                );
            }

            const membership = getAlbumSelectedPhotoMembership(albumId, photoIds);
            if ((checkbox.checked && membership.complete) || (!checkbox.checked && !membership.existingCount)) albumDecisions.delete(albumId);
            else albumDecisions.set(albumId, checkbox.checked);

            refreshResults();
        }
    );

    modal.addEventListener(
        'click',
        event =>
        {
            if (
                event.target.closest(
                    '[data-album-picker-cancel]'
                )
            )
            {
                closeModal();
                return;
            }
            if (
                event.target.closest(
                    '[data-album-picker-create]'
                )
            )
            {
                showCreate();
                return;
            }

            if (
                event.target.closest(
                    '[data-album-picker-back]'
                )
            )
            {
                requestReturn();
                return;
            }

            if (
                event.target.closest(
                    '[data-album-picker-clear-search]'
                )
            )
            {
                query = '';

                if (searchInput)
                {
                    searchInput.value = '';
                }

                refreshResults();

                searchInput?.focus({
                    preventScroll: true
                });

                return;
            }

            if (
                event.target.closest(
                    '[data-album-picker-save]'
                )
            )
            {
                if (!albumDecisions.size) return;
                const photos = photoIds.map(id => getPhoto(id, { projectId }));
                if (currentProjectId() !== projectId || photos.some(photo => !photo || photo.projectId !== projectId)
                    || [...albumDecisions.keys()].some(id => !getProjectAlbums(projectId).some(album => album.id === id)))
                { showToast(rpText('The selected records are no longer available.', 'Выбранные записи больше недоступны.')); return; }
                const updates = photos.map(photo =>
                {
                    const ids = new Set(photo.albumIds || []);
                    albumDecisions.forEach((linked, id) => linked ? ids.add(id) : ids.delete(id));
                    return { photo, ids: [...ids] };
                });
                const updatedAt = new Date().toISOString();
                updates.forEach(({ photo, ids }) => { photo.albumIds = ids; photo.updatedAt = updatedAt; });

                state.selectedPhotoIds = [];

                closeModal();
                renderAlbums();

                showToast(rpText('Album memberships updated.', 'Связи с альбомами обновлены.'));
            }
        }
    );

    refreshResults();
}

function removePhotoFromAlbum(
    photoId,
    albumId
)
{
    const photo = getPhoto(
        photoId,
        {
            projectId: currentProjectId()
        }
    );

    if (
        !photo
        || !(photo.albumIds || [])
            .includes(albumId)
    )
    {
        return false;
    }

    photo.albumIds =
        photo.albumIds.filter(
            id => id !== albumId
        );

    photo.updatedAt =
        new Date().toISOString();

    return true;
}

function openRemovePhotoFromAlbumConfirm(
    photoId,
    albumId
)
{
    const photo =
        getPhoto(photoId);

    const album =
        getProjectAlbums()
            .find(item => item.id === albumId);

    if (!photo || !album)
    {
        return;
    }

    const leavesCurrentView =
        state.albumsView === 'album'
        && state.activeAlbumId === album.id;

    openModal(`
        <div
          class="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="removePhotoAlbumTitle">

          <div class="modal-header">
            <div>
              <h2 id="removePhotoAlbumTitle">
                Remove from album?
              </h2>

              <p>
                ${escapeHtml(album.name)}
              </p>
            </div>

            <button
              class="close-button"
              type="button"
              data-close>
              ${icon.close}
            </button>
          </div>

          <div class="modal-body">
            <p>
              Remove this photo from
              “${escapeHtml(album.name)}”?
            </p>

            <p>
              The photo will remain in All photos
              and in any other albums.
            </p>

            ${
                leavesCurrentView
                    ? `
                  <p>
                    It will disappear from the
                    current album after removal.
                  </p>
                `
                    : ''
            }
          </div>

          <div class="modal-footer">
            <button
              class="button secondary"
              type="button"
              data-close>
              Cancel
            </button>

            <button
              class="button danger"
              type="button"
              data-confirm-photo-album-remove>
              Remove from album
            </button>
          </div>
        </div>
      `);

    modalBackdrop
        .querySelector(
            '[data-confirm-photo-album-remove]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                closeModal();

                if (
                    removePhotoFromAlbum(
                        photo.id,
                        album.id
                    )
                )
                {
                    ensureSelectedAlbumPhoto();
                    renderAlbums();

                    showToast(
                        `Removed from ${album.name}.`
                    );
                }
            }
        );
}

function removeSelectedFromCurrentAlbum()
{
    const ids = new Set(state.selectedPhotoIds || []);
    if (!state.activeAlbumId || !ids.size) return;
    const now = new Date().toISOString();
    let changed = 0;
    sampleData.media.forEach(photo =>
    {
        if (!ids.has(photo.id) || !(photo.albumIds || []).includes(state.activeAlbumId)) return;
        photo.albumIds = photo.albumIds.filter(id => id !== state.activeAlbumId);
        photo.updatedAt = now;
        changed += 1;
    });
    state.selectedPhotoIds = [];
    ensureSelectedAlbumPhoto();
    renderAlbums();
    showToast(`${changed} photo${changed === 1 ? '' : 's'} removed from this album.`);
}

function openAlbumSidebarMenu(albumId, anchor)
{
    closeMenu();
    const rect = anchor.getBoundingClientRect();
    const menu = document.createElement('div');
    menu.className = 'menu-popover'; menu.id = 'projectMenu'; menu.style.top = `${rect.bottom + 6}px`; menu.style.left = `${Math.max(12, rect.right - 190)}px`;
    menu.innerHTML = `<button type="button" data-album-action="open">Open album</button><button type="button" data-album-action="edit">Edit album</button><button class="danger" type="button" data-album-action="delete">Delete album</button>`;
    document.body.appendChild(menu);
    menu.addEventListener('click', event =>
    {
        const action = event.target.closest('[data-album-action]')?.dataset.albumAction; if (!action) return; anchor.focus({ preventScroll: true }); closeMenu(); state.albumsView = 'album'; state.activeAlbumId = albumId; if (action === 'edit') openEditAlbumModal(); else if (action === 'delete') openDeleteAlbumConfirm(albumId); else renderAlbums();
    });
    bindMenuLifecycle(anchor);
}

function bindAlbumsSidebar()
{
    sidebar
        .querySelectorAll(
            '[data-albums-view]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    runAfterAlbumsPhotoEditGuard(
                        () =>
                        {
                            state.albumsView =
                                button.dataset.albumsView;

                            state.activeAlbumId = null;
                            state.selectedPhotoIds = [];
                            resetAlbumsPage();
                            renderAlbums();
                        }
                    );
                }
            );
        });

    sidebar
        .querySelectorAll(
            '[data-album-open]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    runAfterAlbumsPhotoEditGuard(
                        () =>
                        {
                            appNavigationMarkIntent();
                            state.albumsView =
                                'album';

                            state.activeAlbumId =
                                button.dataset.albumOpen;

                            state.selectedPhotoIds = [];

                            resetAlbumsPage();
                            renderAlbums();
                        }
                    );
                }
            );
        });

    sidebar
        .querySelectorAll(
            '[data-album-menu]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                event =>
                {
                    event.stopPropagation();

                    runAfterAlbumsPhotoEditGuard(
                        () =>
                        {
                            openAlbumSidebarMenu(
                                button.dataset.albumMenu,
                                button
                            );
                        }
                    );
                }
            );
        });

    sidebar
        .querySelector('#albumsNewAlbum')
        ?.addEventListener(
            'click',
            () =>
            {
                runAfterAlbumsPhotoEditGuard(
                    openNewAlbumModal
                );
            }
        );

    bindToasts(sidebar);
}

let albumsLastPhotoCardClick = { photoId: null, at: 0 };

function albumsPhotoCardWasDoubleClick(photoId)
{
    const now = performance.now();
    const repeated = albumsLastPhotoCardClick.photoId === photoId
        && now - albumsLastPhotoCardClick.at <= 420;
    albumsLastPhotoCardClick = { photoId, at: now };
    return repeated;
}

function bindAlbumsCardControls(root = main)
{
    root
        .querySelectorAll('[data-photo-id]')
        .forEach(card =>
        {
            const selectPhoto = () =>
            {
                runAfterAlbumsPhotoEditGuard(
                    () =>
                    {
                        const photoId =
                            card.dataset.photoId;

                        state.selectedPhotoId =
                            photoId;

                        const mobile = innerWidth <= 900;

                        renderAlbumsPreserveViewport({
                            focusPhotoId: mobile ? '' : photoId,
                            focusTarget: 'card'
                        });

                        if (mobile)
                        {
                            main.querySelector(`[data-photo-id="${CSS.escape(photoId)}"]`)
                                ?.focus({ preventScroll: true });
                            openMobileSurface('details');
                        }
                    }
                );
            };

            card.addEventListener('click', event =>
            {
                if (event.target.closest('button,input,a,select')) return;
                const photoId = card.dataset.photoId;
                if (!event.shiftKey && !event.ctrlKey && !event.metaKey
                    && albumsPhotoCardWasDoubleClick(photoId))
                    runAfterAlbumsPhotoEditGuard(() => openPhotoLightbox(photoId));
                else selectPhoto();
            });

            card.addEventListener('keydown', event =>
            {
                if (event.key !== 'Enter' && event.key !== ' ') return;
                if (event.target.closest('button,input,a,select')) return;
                event.preventDefault();
                selectPhoto();
            });
        });

    root
        .querySelectorAll('[data-photo-check]')
        .forEach(control =>
        {
            const toggleSelection = () =>
            {
                runAfterAlbumsPhotoEditGuard(() =>
                {
                    togglePhotoSelection(control.dataset.photoCheck);
                });
            };

            if (control.matches('input[type="checkbox"]'))
            {
                control.addEventListener('click', event => event.stopPropagation());
                control.addEventListener('change', toggleSelection);
                return;
            }

            control.addEventListener('click', event =>
            {
                event.stopPropagation();
                toggleSelection();
            });
        });

    root
        .querySelectorAll(
            '[data-photo-fav]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                event =>
                {
                    event.stopPropagation();

                    const focusTarget =
                        button.closest(
                            '.albums-detail'
                        )
                            ? 'favoriteDetail'
                            : 'favorite';

                    runAfterAlbumsPhotoEditGuard(
                        () =>
                        {
                            toggleAlbumPhotoFavourite(
                                button.dataset.photoFav,
                                {
                                    focusTarget
                                }
                            );
                        }
                    );
                }
            );
        });

    root
        .querySelectorAll('[data-photo-more]')
        .forEach(button =>
        {
            button.addEventListener('click', event =>
            {
                event.stopPropagation();
                runAfterAlbumsPhotoEditGuard(() =>
                {
                    openAlbumPhotoMenu(button.dataset.photoMore, button);
                });
            });
        });
}

function bindAlbumsPaginationControls()
{
    main
        .querySelectorAll(
            '[data-albums-page]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    if (button.disabled)
                    {
                        return;
                    }

                    const nextPage =
                        Number(
                            button.dataset
                                .albumsPage
                        );

                    if (
                        !Number.isInteger(
                            nextPage
                        )
                || nextPage < 1
                    )
                    {
                        return;
                    }

                    state.albumsPage =
                        nextPage;

                    renderAlbums();
                }
            );
        });

    main
        .querySelector(
            '#albumsRowsPerPage'
        )
        ?.addEventListener(
            'change',
            event =>
            {
                state.albumsRowsPerPage =
                    normalizeAlbumsRowsPerPage(
                        event.currentTarget.value
                    );

                resetAlbumsPage();
                renderAlbums();
            }
        );
}

function bindAlbumsControls()
{
    bindConnectedNotesFooters(main);
    bindToasts(main);
    bindGenealogyDateFields(main);
    bindPlaceComboboxes(main);
    bindConnectedNoteLinks(
        main,
        {
            onUnlinked:
            ({
                contextType
            }) =>
            {
                if (
                    contextType
                !== 'photo'
                )
                {
                    return;
                }

                renderAlbumsPreserveViewport();

                /*
                The removed row no longer exists.
                Return keyboard focus to the stable
                Add note action.
              */
                requestAnimationFrame(
                    () =>
                    {
                        main
                            .querySelector(
                                '#albumsManagePhotoNotes'
                            )
                            ?.focus({
                                preventScroll:
                        true
                            });
                    }
                );
            }
        }
    );
    bindConnectedSourceLinks(
        main,
        {
            onUnlinked:
            ({
                targetType
            }) =>
            {
                if (
                    targetType !== 'photo'
                )
                {
                    return;
                }

                renderAlbumsPreserveViewport();
            }
        }
    );

    const browsingLocked =
        state.albumsDetailEditing;

    const lockableControls =
        main.querySelectorAll(`
          #albumsSearch,
          #albumsFilterButton,
          #albumsSort,
          [data-albums-mode],
          #albumsAddPhotos,
          #albumsMobileAddPhotos,
          #albumsClearFilters,
          [data-albums-remove-filter],
          [data-albums-page],
          #albumsRowsPerPage
        `);

    if (browsingLocked)
    {
        lockableControls.forEach(
            control =>
            {
                if (
                    'disabled' in control
                )
                {
                    control.disabled = true;
                }
                else
                {
                    control.setAttribute(
                        'aria-disabled',
                        'true'
                    );
                }
            }
        );
    }
    else
    {
        bindSearchInput(
            main,
            '#albumsSearch',
            'albumsSearch',
            () =>
            {
                resetAlbumsPage();
                renderAlbums();
            }
        );

        bindAppSortControl(main, {
            id: 'albumsSort',
            options: APP_SORT_OPTIONS.albums,
            getField: () => state.albumsSort,
            getDirection: () =>
                state.albumsSortDirection,

            onChange: ({
                field,
                direction
            }) =>
            {
                state.albumsSort = field;
                state.albumsSortDirection =
                    direction;

                resetAlbumsPage();
                renderAlbums();
            }
        });

        main
            .querySelector(
                '#albumsFilterButton'
            )
            ?.addEventListener(
                'click',
                event =>
                {
                    openAlbumsFilterPopover(
                        event.currentTarget
                    );
                }
            );

        main
            .querySelector(
                '#albumsClearFilters'
            )
            ?.addEventListener(
                'click',
                clearAlbumFilters
            );

        main
            .querySelectorAll(
                '[data-albums-remove-filter]'
            )
            .forEach(button =>
            {
                button.addEventListener(
                    'click',
                    () =>
                    {
                        removeAlbumFilter(
                            button.dataset
                                .albumsRemoveFilter
                        );
                    }
                );
            });

        main
            .querySelectorAll(
                '[data-albums-mode]'
            )
            .forEach(button =>
            {
                button.addEventListener(
                    'click',
                    () =>
                    {
                        state.albumsViewMode =
                            button.dataset.albumsMode;

                        renderAlbums();
                    }
                );
            });
        bindAlbumsPaginationControls();
        main.querySelectorAll('#albumsAddPhotos, #albumsMobileAddPhotos')
            .forEach(button => button.addEventListener('click', openAddPhotosModal));

        main
            .querySelector('#albumsEmptyAction')
            ?.addEventListener(
                'click',
                openAddPhotosModal
            );
    }

    main
        .querySelector('#albumsEmptyClear')
        ?.addEventListener(
            'click',
            () =>
            {
                state.albumsSearch = '';

                state.albumsFilters = {
                    ...defaultAlbumFilters
                };
                resetAlbumsPage();
                renderAlbums();
            }
        );

    bindAlbumsCardControls(main);

    const visibleSelection = albumsVisibleSelectionState();
    const selectVisibleCheckbox = main.querySelector(
        '[data-albums-select-visible]'
    );

    if (selectVisibleCheckbox)
    {
        selectVisibleCheckbox.checked = visibleSelection.allVisibleSelected;
        selectVisibleCheckbox.indeterminate = visibleSelection.someVisibleSelected
          && !visibleSelection.allVisibleSelected;
        selectVisibleCheckbox.disabled = visibleSelection.visibleIds.length === 0;
        selectVisibleCheckbox.addEventListener('click', event =>
        {
            event.stopPropagation();
            toggleAllVisibleAlbumPhotos();
        });
    }

    main
        .querySelectorAll(
            '[data-photo-open]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    openPhotoLightbox(
                        button.dataset.photoOpen
                    );
                }
            );
        });

    main
        .querySelectorAll(
            '[data-photo-person-open]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    openPeopleProfileFromRow(
                        button.dataset.photoPersonOpen
                    );
                }
            );
        });

    const detailPreview = main.querySelector('.albums-detail-preview-button');
    const faceHighlight = detailPreview?.querySelector('[data-albums-face-highlight]');
    const floatingPreview = main.querySelector('[data-albums-face-floating]');
    const clearFaceHighlight = () =>
    {
        if (faceHighlight) faceHighlight.hidden = true;
        if (floatingPreview) floatingPreview.hidden = true;
    };
    const highlightPerson = personId =>
    {
        if (!faceHighlight || !detailPreview) return;
        const photo = getPhoto(state.selectedPhotoId, { projectId: currentProjectId() });
        const region = photoPersonRegion(photo, personId);
        const pane = main.querySelector('.albums-detail');
        const previewRect = detailPreview.getBoundingClientRect();
        const paneRect = pane?.getBoundingClientRect();
        const useFloating = Boolean(floatingPreview && paneRect && previewRect.bottom < paneRect.top + 80);
        if (useFloating)
        {
            Object.assign(floatingPreview.style, {
                left: `${paneRect.left + 16}px`, top: `${paneRect.top + 16}px`, width: `${paneRect.width - 32}px`
            });
            floatingPreview.hidden = false;
        }
        else if (floatingPreview) floatingPreview.hidden = true;
        const preview = useFloating ? floatingPreview : detailPreview;
        const highlight = useFloating ? floatingPreview.querySelector('[data-albums-face-highlight]') : faceHighlight;
        const image = preview.querySelector('.albums-detail-preview .thumb-img');
        if (!region || !image || !photo?.width || !photo?.height)
        {
            clearFaceHighlight();
            return;
        }
        faceHighlight.hidden = useFloating;
        const bounds = preview.getBoundingClientRect();
        const imageWidth = image.naturalWidth || photo.width;
        const imageHeight = image.naturalHeight || photo.height;
        const scale = Math.min(image.clientWidth / imageWidth, image.clientHeight / imageHeight);
        const width = imageWidth * scale;
        const height = imageHeight * scale;
        const left = (image.clientWidth - width) / 2 + region.x * width;
        const top = (image.clientHeight - height) / 2 + region.y * height;
        Object.assign(highlight.style, {
            left: `${left / bounds.width * 100}%`, top: `${top / bounds.height * 100}%`,
            width: `${region.width * width / bounds.width * 100}%`,
            height: `${region.height * height / bounds.height * 100}%`
        });
        highlight.hidden = false;
    };
    main.querySelectorAll('[data-albums-person-region]').forEach(row =>
    {
        row.addEventListener('pointerenter', () => highlightPerson(row.dataset.albumsPersonRegion));
        row.addEventListener('pointerleave', clearFaceHighlight);
        row.addEventListener('focusin', () => highlightPerson(row.dataset.albumsPersonRegion));
        row.addEventListener('focusout', event =>
        {
            if (!row.contains(event.relatedTarget)) clearFaceHighlight();
        });
    });

    main
        .querySelectorAll(
            '[data-albums-photo-person-menu]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                event =>
                {
                    event.stopPropagation();

                    openAlbumsPhotoPersonMenu(
                        state.selectedPhotoId,
                        button.dataset
                            .albumsPhotoPersonMenu,
                        button
                    );
                }
            );
        });

    main
        .querySelectorAll(
            '[data-photo-album-open]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    appNavigationMarkIntent();
                    state.albumsView = 'album';

                    state.activeAlbumId =
                        button.dataset.photoAlbumOpen;

                    state.selectedPhotoIds = [];

                    resetAlbumsPage();
                    renderAlbums();
                }
            );
        });

    main
        .querySelectorAll(
            '[data-photo-remove-album]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    openRemovePhotoFromAlbumConfirm(
                        state.selectedPhotoId,
                        button.dataset.photoRemoveAlbum
                    );
                }
            );
        });

    main
        .querySelectorAll(
            '[data-albums-detail-toggle]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    if (
                        state.albumsDetailCollapsed
                    )
                    {
                        state.albumsDetailCollapsed =
                            false;

                        renderAlbums();
                        return;
                    }

                    runAfterAlbumsPhotoEditGuard(
                        () =>
                        {
                            state.albumsDetailCollapsed =
                                true;

                            renderAlbums();
                        }
                    );
                }
            );
        });

    main
        .querySelectorAll(
            '[data-albums-section-toggle]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                event =>
                {
                    if (
                        event.target.closest(
                            '.link'
                        )
                    )
                    {
                        return;
                    }

                    const sectionId =
                        button.dataset
                            .albumsSectionToggle;

                    const open =
                        !albumsDetailSectionIsOpen(
                            sectionId
                        );

                    state.albumsDetailSections[
                        sectionId
                    ] = open;

                    const section =
                        button.closest(
                            '.panel-section'
                        );

                    const body =
                        section?.querySelector(
                            '.panel-section-body'
                        );

                    section
                        ?.classList
                        .toggle(
                            'is-open',
                            open
                        );

                    section?.querySelectorAll(
                        '[data-albums-section-toggle]'
                    ).forEach(toggle =>
                        toggle.setAttribute(
                            'aria-expanded',
                            String(open)
                        )
                    );

                    if (body)
                    {
                        body.hidden = !open;
                    }
                }
            );
        });

    main
        .querySelector('#albumsEditPhoto')
        ?.addEventListener(
            'click',
            () => runAfterAlbumsPhotoEditGuard(beginAlbumsPhotoEdit)
        );
    main.querySelector('#albumsRenamePhoto')?.addEventListener('click', () =>
        runAfterAlbumsPhotoEditGuard(beginAlbumsPhotoRename));
    main.querySelector('#albumsSavePhotoName')?.addEventListener('click', saveAlbumsPhotoRename);
    main.querySelector('#albumsCancelPhotoName')?.addEventListener('click', () =>
        runAfterAlbumsPhotoEditGuard(() =>
        {
            renderAlbums();
            requestAnimationFrame(() => main.querySelector('#albumsRenamePhoto')?.focus({ preventScroll: true }));
        }));
    main.querySelector('#albumsPhotoNameInput')?.addEventListener('keydown', event =>
    {
        if (event.key === 'Enter') { event.preventDefault(); saveAlbumsPhotoRename(); }
        if (event.key === 'Escape') { event.preventDefault(); main.querySelector('#albumsCancelPhotoName')?.click(); }
    });

    main
        .querySelector(
            '#albumsCancelPhotoEdit'
        )
        ?.addEventListener(
            'click',
            cancelAlbumsPhotoEdit
        );

    main
        .querySelector(
            '#albumsSavePhotoEdit'
        )
        ?.addEventListener(
            'click',
            saveAlbumsPhotoEdit
        );

    main
        .querySelector(
            '#albumsInspectorMore'
        )
        ?.addEventListener(
            'click',
            event =>
            {
                openAlbumsInspectorMenu(
                    state.selectedPhotoId,
                    event.currentTarget
                );
            }
        );

    main
        .querySelector('#albumsTagPeople')
        ?.addEventListener(
            'click',
            () =>
            {
                openPhotoPeopleModal(
                    state.selectedPhotoId
                );
            }
        );

    main
        .querySelector('#albumsLinkAlbum')
        ?.addEventListener(
            'click',
            () =>
            {
                state.selectedPhotoIds = [
                    state.selectedPhotoId
                ];

                openAddToAlbumModal();
            }
        );

    main
        .querySelector(
            '#albumsManagePhotoNotes'
        )
        ?.addEventListener(
            'click',
            () =>
                openAlbumsPhotoNotesModal(
                    state.selectedPhotoId
                )
        );

    main
        .querySelector(
            '#albumsManagePhotoSources'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                const photo =
                    getPhoto(
                        state.selectedPhotoId,
                        {
                            projectId:
                    currentProjectId()
                        }
                    );

                if (!photo)
                {
                    return;
                }

                openSourcesForTargetModal({
                    targetType:
                'photo',

                    targetId:
                photo.id,

                    projectId:
                photo.projectId,

                    title:
                'Add sources',

                    subtitle:
                `Connect existing sources to ${
                    photo.title
                  || photo.filename
                  || 'this photo'
                }.`,

                    afterSave:
                renderAlbumsPreserveViewport
                });
            }
        );

    const editRoot =
        main.querySelector(
            '[data-albums-photo-edit-root]'
        );

    editRoot
        ?.addEventListener(
            'input',
            syncAlbumsPhotoEditDraftFromPane
        );

    editRoot
        ?.addEventListener(
            'change',
            syncAlbumsPhotoEditDraftFromPane
        );

    main
        .querySelector(
            '#albumsDeleteSelected'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                openDeletePhotoConfirm(
                    state.selectedPhotoIds
                );
            }
        );

    main
        .querySelector(
            '#albumsCancelSelection'
        )
        ?.addEventListener(
            'click',
            () => clearAlbumSelection()
        );

    main
        .querySelector('#albumsSelectAll')
        ?.addEventListener(
            'click',
            () => toggleAllVisibleAlbumPhotos()
        );

    main
        .querySelector(
            '#albumsAddSelectedToAlbum'
        )
        ?.addEventListener(
            'click',
            openAddToAlbumModal
        );

    main
        .querySelector(
            '#albumsRemoveFromCurrent'
        )
        ?.addEventListener(
            'click',
            removeSelectedFromCurrentAlbum
        );
}

const GENEO_WORLD_LIMIT = 1000000;
const GENEO_CANVAS_MARGIN = 900;
const GENEO_CANVAS_EDGE_THRESHOLD = 160;
const GENEO_CANVAS_EXPANSION = 1200;

function createGeneoCanvasRuntime(boardId = '')
{
    return {
        boardId,
        objectHighlight: 'none',
        bounds: null,
        connectionClick: null,
        connectionPreviewPoint: null,
        connectionPreviewFrame: null,
        zoomFrame: null,
        zoomDelta: 0,
        zoomClientX: 0,
        zoomClientY: 0,
        zoomSettleFrame: null,
        edgeExpansionFrame: null,
        viewportReleaseFrame: null,
        viewportRestoreToken: 0,
        pendingEdgeExpansion: false,
        suppressEdgeExpansion: false,
        zooming: false,
        suppressNodeClick: false,
        autoPersonHeightSignatures:
          new Map()
    };
}

function createGeneoPaintRuntime()
{
    return {
        target: null,
        opener: null,
        popover: null,
        controller: null,
        interaction: null,
        hsv: null,
        invalidHex: false
    };
}

sampleData.boardCollections = [
    {
        id:
          'board-col-research-theory',

        projectId:
          'p1',

        name:
          'Research theory',

        description:
          'Boards for hypotheses, theories and unresolved research questions.'
    },

    {
        id:
          'board-col-tree-design',

        projectId:
          'p1',

        name:
          'Tree design',

        description:
          'Visual family-tree layouts and structural explorations.'
    },

    {
        id:
          'board-col-publication',

        projectId:
          'p1',

        name:
          'Publication',

        description:
          'Layouts and visual material prepared for publication.'
    }
];

