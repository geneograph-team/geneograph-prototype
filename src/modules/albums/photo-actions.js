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

