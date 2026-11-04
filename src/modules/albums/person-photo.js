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
        filters: { favorite: false, person: '', tagged: true },
        sort: 'name',
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

    const filters = state.personPhotoPicker.filters || {};
    return getProjectPhotos(
        person.projectId
    ).filter(photo =>
    {
        if (photo.id === person.primaryPhotoId) return true;
        return (!filters.tagged || photoIsTaggedWithPerson(photo, person))
            && (!filters.favorite || photo.favorite)
            && (!filters.person || getPhotoPeople(photo).some(linked => linked.id === filters.person))
            && (!query || photoSearchText(photo).includes(query));
    }).sort((a, b) => state.personPhotoPicker.sort === 'updated'
        ? String(b.updatedAt || '').localeCompare(String(a.updatedAt || ''))
        : state.personPhotoPicker.sort === 'date'
            ? String(formatPhotoDate(b)).localeCompare(String(formatPhotoDate(a)))
            : (a.title || a.filename || '').localeCompare(b.title || b.filename || '', state.language === 'ru' ? 'ru' : 'en'));
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
    const title = localizedDataFieldValue(photo.title || photo.filename || 'Photo');
    return `<article class="rp-record ${selected ? 'is-selected' : ''}"><button class="rp-record-select" type="button" data-person-photo-candidate="${escapeHtml(photo.id)}" aria-pressed="${selected}" aria-label="${escapeHtml(title)}">
        <span class="rp-thumbnail">${renderPhotoThumbnail(photo, { label: title })}</span>
        <span class="rp-record-copy"><strong title="${escapeHtml(title)}">${escapeHtml(title)}</strong>
          ${photo.caption ? `<span class="rp-description">${escapeHtml(localizedDataFieldValue(photo.caption))}</span>` : ''}
          ${current ? `<small>${escapeHtml(t('Current photo'))}</small>` : ''}
          ${tagged ? '' : `<small>${escapeHtml(t('Not tagged'))}</small>`}</span>
        <span class="rp-selection-mark" aria-hidden="true">${icon.check}</span>
      </button></article>`;
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
        const taggedScope = Boolean(state.personPhotoPicker.filters?.tagged);
        const message = hasSearch
            ? 'No matching project photos.'
            : taggedScope ? `No photos are tagged with ${person.names?.display || 'this person'}.` : 'No matching project photos.';
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
        <div class="rp-results rp-photo-grid">${photos.map(photo => renderPersonPhotoCandidate(photo, person)).join('')}</div>`;
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
    return `<div class="person-photo-upload-dropzone upload-dropzone" data-person-photo-dropzone>
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

function renderPersonPhotoSharedChooseModal(person)
{
    const picker = state.personPhotoPicker;
    const upload = picker.sourceTab === 'upload';
    const filters = picker.filters || { favorite: false, person: '', tagged: true };
    openModal(`<section class="modal resource-picker person-photo-shared-modal ${upload ? `rp-upload-staging ${picker.uploadDraft ? 'has-items' : ''}` : ''}"
      data-resource-picker="photos" data-person-photo-picker role="dialog" aria-modal="true" aria-labelledby="personPhotoPickerTitle">
      <header class="modal-header"><div><h2 id="personPhotoPickerTitle">${escapeHtml(t('Change photo for {name}').replace('{name}', person.names?.display || 'Person'))}</h2>
        <p>${escapeHtml(t('This photo will appear in Family Tree, People, and Profile.'))}</p></div>
        <button class="close-button" type="button" data-close aria-label="${escapeHtml(t('Close'))}">${icon.close}</button></header>
      <div class="rp-toolbar">
        <button class="button secondary" type="button" data-person-photo-tab="project">${icon.folder}<span>${escapeHtml(rpText('Browse', 'Обзор'))}</span></button>
        <label class="app-search-field rp-search">${icon.search}<input type="search" data-person-photo-search value="${escapeHtml(picker.search)}" aria-label="${escapeHtml(t('Search'))}" placeholder="${escapeHtml(t('Search'))}"></label>
        <button class="icon-button ${filters.tagged ? 'is-active' : ''}" type="button" data-person-photo-filter-button aria-label="${escapeHtml(t('Filters'))}" aria-expanded="false" aria-pressed="${Boolean(filters.tagged)}" title="${escapeHtml(t('Filters'))}">${icon.filter}</button>
        <div class="rp-sort">${icon.sortLines}<select data-person-photo-sort aria-label="${escapeHtml(rpText('Sort', 'Сортировка'))}">
          <option value="name" ${picker.sort === 'name' ? 'selected' : ''}>${escapeHtml(t('Name'))}</option>
          <option value="updated" ${picker.sort === 'updated' ? 'selected' : ''}>${escapeHtml(t('Recently updated'))}</option>
          <option value="date" ${picker.sort === 'date' ? 'selected' : ''}>${escapeHtml(rpText('Photo date', 'Дата фотографии'))}</option>
        </select><span class="rp-sort-chevron" aria-hidden="true">${icon.chevron}</span></div>
        <button class="button secondary rp-create" type="button" data-person-photo-show-upload>${icon.plus}<span>${escapeHtml(rpText('Upload photos', 'Загрузить фотографии'))}</span></button>
      </div>
      <nav class="rp-path" aria-label="${escapeHtml(t('Location'))}"><span class="rp-path-icon" aria-hidden="true">${icon.folder}</span><span aria-current="page">${escapeHtml(upload ? rpText('Upload photos', 'Загрузить фотографии') : rpText('All photos', 'Все фотографии'))}</span></nav>
      <div class="rp-content" tabindex="-1">${upload ? renderPersonPhotoUploadPanel() : `<div data-person-photo-project-results>${renderPersonPhotoProjectResults()}</div>`}</div>
      <footer class="modal-footer"><div>${person.primaryPhotoId ? `<button class="button secondary" type="button" data-person-photo-remove-current>${escapeHtml(t('Remove current photo'))}</button>` : ''}</div>
        <div class="modal-footer-actions"><button class="button secondary" type="button" data-close>${escapeHtml(t('Cancel'))}</button>
          <button class="button primary" type="button" data-person-photo-continue ${personPhotoPickerHasSource() ? '' : 'disabled'}>${escapeHtml(t('Continue'))}</button></div></footer>
    </section>`);
    rpEnhanceSortControl(modalBackdrop.querySelector('.person-photo-shared-modal'), '[data-person-photo-sort]');
    bindPersonPhotoPickerModal();
    const root = modalBackdrop.querySelector('.person-photo-shared-modal');
    root.querySelector('[data-person-photo-filter-button]').addEventListener('click', () =>
    {
        const existing = root.querySelector('.rp-filter-panel');
        if (existing) { existing.remove(); return; }
        const panel = document.createElement('section');
        panel.className = 'rp-filter-panel';
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-label', t('Filters'));
        panel.innerHTML = `<h3>${escapeHtml(t('Filters'))}</h3>${rpPhotoFilterFieldsMarkup(person.projectId, filters, { tagged: true })}
          <div class="rp-filter-actions"><button class="button secondary" type="button" data-person-photo-clear-filters>${escapeHtml(t('Clear filters'))}</button>
          <button class="button secondary" type="button" data-person-photo-done-filters>${escapeHtml(t('Done'))}</button></div>`;
        root.append(panel);
        const trigger = root.querySelector('[data-person-photo-filter-button]');
        const bounds = root.getBoundingClientRect();
        const target = trigger.getBoundingClientRect();
        panel.style.top = `${target.bottom - bounds.top + 8}px`;
        panel.style.right = bounds.width <= 600 ? '12px' : '24px';
        panel.style.maxHeight = `${Math.max(180, bounds.bottom - target.bottom - 100)}px`;
        trigger.setAttribute('aria-expanded', 'true');
        rpBindPhotoFilterFields(panel.querySelector('.rp-photo-filters'), filters, values =>
        {
            picker.filters = values;
            trigger.classList.toggle('is-active', Boolean(values.tagged));
            trigger.setAttribute('aria-pressed', String(Boolean(values.tagged)));
            updatePersonPhotoProjectResults();
        });
        panel.querySelector('[data-person-photo-clear-filters]').addEventListener('click', () =>
        {
            picker.filters = { favorite: false, person: '', tagged: false };
            trigger.classList.remove('is-active');
            trigger.setAttribute('aria-pressed', 'false');
            panel.remove();
            trigger.setAttribute('aria-expanded', 'false');
            updatePersonPhotoProjectResults();
        });
        panel.querySelector('[data-person-photo-done-filters]').addEventListener('click', () =>
        {
            panel.remove();
            trigger.setAttribute('aria-expanded', 'false');
            trigger.focus();
        });
        panel.addEventListener('keydown', event =>
        {
            if (event.key !== 'Escape') return;
            event.stopPropagation();
            panel.remove(); trigger.setAttribute('aria-expanded', 'false'); trigger.focus();
        });
        panel.querySelector('input')?.focus();
    });
    root.addEventListener('pointerdown', event =>
    {
        if (event.target.closest('.rp-filter-panel,[data-person-photo-filter-button]')) return;
        root.querySelector('.rp-filter-panel')?.remove();
        root.querySelector('[data-person-photo-filter-button]').setAttribute('aria-expanded', 'false');
    });
}

function renderPersonPhotoPickerModal()
{
    const person =
        personPhotoPickerPerson();

    if (!person) return;

    const adjust =
        state.personPhotoPicker.step
        === 'adjust';

    if (!adjust)
    {
        renderPersonPhotoSharedChooseModal(person);
        return;
    }

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
        updatePersonPhotoProjectResults();
        const continueButton = modalBackdrop.querySelector('[data-person-photo-continue]');
        if (continueButton) continueButton.disabled = !personPhotoPickerHasSource();
        modalBackdrop.querySelector(`[data-person-photo-candidate="${CSS.escape(nextId)}"]`)?.focus({ preventScroll: true });
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
        state.personPhotoPicker.filters = { favorite: false, person: '', tagged: false };
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
    modalBackdrop.querySelector('[data-person-photo-sort]')?.addEventListener('change', event =>
    {
        state.personPhotoPicker.sort = event.target.value;
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
    const hasTaggedPhotos = projectPhotos.some(photo => photoIsTaggedWithPerson(photo, person));
    const activePrimary = getPhoto(person.primaryPhotoId, { projectId: person.projectId });
    resetPersonPhotoPickerState();
    Object.assign(state.personPhotoPicker, {
        open: true,
        personId: person.id,
        sourceTab: projectPhotos.length ? 'project' : 'upload',
        projectScope: hasTaggedPhotos ? 'tagged' : 'all',
        filters: { favorite: false, person: '', tagged: hasTaggedPhotos },
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

