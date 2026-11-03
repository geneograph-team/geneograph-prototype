const archiveImageView = {
    projectId: null, scope: '', files: [], indices: new Map(), index: 0,
    mode: 'fit', zoom: 1, panX: .5, panY: .5, scroll: 0,
    expanded: false, stripHidden: false, cache: new Map(), thumbs: new Map(),
    dispose: null, token: 0, host: null, geometry: null, hoveredPersonId: null
};

function archiveImagesActive()
{
    return state.activeModule === 'Archive' && state.archiveView !== 'sources' && state.archiveFileLayout === 'images';
}

function archiveImageUnmount()
{
    archiveImageView.dispose?.();
    archiveImageView.dispose = null;
    archiveImageView.hoveredPersonId = null;
    archiveImageView.host = null;
    archiveImageView.token++;
}

function resetArchiveImageSession()
{
    archiveImageUnmount();
    archiveImageView.cache.forEach(entry => { entry.cancel?.(); entry.image.onload = null; entry.image.onerror = null; entry.image.src = ''; });
    Object.assign(archiveImageView, {
        projectId: currentProjectId(), scope: '', files: [], indices: new Map(), index: 0,
        mode: 'fit', zoom: 1, panX: .5, panY: .5, scroll: 0,
        expanded: false, stripHidden: false, cache: new Map(), thumbs: new Map(), geometry: null
    });
    document.body.classList.remove('archive-image-expanded');
}

function archiveImageSyncLifecycle()
{
    if (!archiveImagesActive())
    {
        archiveImageUnmount();
        archiveImageView.expanded = false;
        document.body.classList.remove('archive-image-expanded');
    }
    if (archiveImageView.projectId !== currentProjectId()) resetArchiveImageSession();
}

function archiveImageButton(action, label, artwork, extra = '')
{
    return `<button type="button" data-av-action="${action}" aria-label="${escapeHtml(t(label))}" title="${escapeHtml(t(label))}" ${extra}>${artwork}</button>`;
}

function renderArchiveImageView(files)
{
    const view = archiveImageView;
    if (view.projectId !== currentProjectId()) resetArchiveImageSession();
    const scope = JSON.stringify([state.archiveView, state.archiveSelectedFolderId, state.archiveSearch,
        state.archiveFileFilters, state.archiveFilterPresentation, state.archiveFilterScopeFolderId]);
    const sameScope = view.scope === scope;
    const oldIds = view.files.map(file => file.id);
    const oldIndex = view.index;
    view.files = files.filter(file => archiveFileKind(file) === 'img');
    view.indices = new Map(view.files.map((file, index) => [file.id, index]));
    view.index = view.indices.get(state.archiveSelectedFileId) ?? 0;
    if (sameScope && !view.indices.has(state.archiveSelectedFileId) && oldIds.length)
    {
        const successor = oldIds.slice(oldIndex).find(id => view.indices.has(id));
        const predecessor = oldIds.slice(0, oldIndex).reverse().find(id => view.indices.has(id));
        view.index = view.indices.get(successor || predecessor) ?? 0;
    }
    if (!sameScope) view.scroll = 0;
    view.scope = scope;
    if (view.files.length)
    {
        state.archiveSelectedFileId = view.files[view.index].id;
        state.archiveSelectedFolderItemId = null;
    }
    if (!view.files.length)
        return `<section class="archive-image-empty"><h2>${escapeHtml(t('No images in this view'))}</h2><p>${escapeHtml(t('Choose another folder or adjust your filters.'))}</p><button class="button secondary" type="button" data-archive-file-layout="details">${escapeHtml(t('Switch to Details'))}</button></section>`;
    return `<section class="archive-image-workspace" aria-label="${escapeHtml(t('Image view'))}">
        <div class="archive-image-stage" tabindex="0" role="region" aria-label="${escapeHtml(t('Image viewer'))}">
          <span class="archive-person-region-highlight is-active" data-av-person-region hidden aria-hidden="true"></span>
          ${archiveImageButton('previous', 'Previous image', icon.arrow)}${archiveImageButton('next', 'Next image', icon.arrow)}
          <div class="archive-image-status" data-av-status role="status"></div>
        </div>
        <div class="archive-image-tools">
          <div class="archive-image-zoom-tools">${archiveImageButton('fit', 'Fit image', icon.imageFit)}${archiveImageButton('width', 'Fit width', icon.imageFitWidth)}<span class="archive-image-tool-divider"></span>${archiveImageButton('out', 'Zoom out', icon.zoomOut)}<output data-av-zoom>100%</output>${archiveImageButton('in', 'Zoom in', icon.zoomIn)}</div>
          <div class="archive-image-position"><label>${escapeHtml(t('Image'))} <input data-av-position type="number" min="1" max="${view.files.length}" value="${view.index + 1}" aria-label="${escapeHtml(t('Image number'))}"></label><span>${escapeHtml(t('of'))} ${view.files.length.toLocaleString(state.language)}</span></div>
          <div class="archive-image-actions">${archiveImageButton('details', 'Details', icon.info)}${archiveImageButton('strip', 'Show or hide thumbnails', icon.grid, `aria-expanded="${!view.stripHidden}"`)}${archiveImageButton('expand', 'Expand viewer', icon.expand, 'aria-pressed="false"')}</div>
        </div>
        <div class="archive-image-filmstrip" data-av-strip tabindex="0" role="region" aria-label="${escapeHtml(t('Image thumbnails'))}" ${view.stripHidden ? 'hidden' : ''}><div data-av-track></div></div>
        <span class="sr-only" data-av-announcement aria-live="polite" aria-atomic="true"></span>
      </section>`;
}

function archiveImageLoad(file)
{
    const view = archiveImageView;
    const src = archiveImageSource(file);
    const key = `${file.id}:${src}`;
    if (view.cache.has(key)) return view.cache.get(key).promise;
    const image = new Image();
    image.decoding = 'async';
    const entry = { image, promise: null, cancel: null };
    entry.promise = new Promise((resolve, reject) =>
    {
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('Image unavailable'));
        entry.cancel = () => reject(new Error('Image request cancelled'));
        if (src) image.src = src;
        else reject(new Error('Image unavailable'));
    });
    // Neighbour failures are represented when that image becomes active.
    entry.promise.catch(() => {});
    view.cache.set(key, entry);
    return entry.promise;
}

function archiveImageTrimCache()
{
    const view = archiveImageView;
    const keep = new Set(view.files.slice(Math.max(0, view.index - 1), view.index + 2)
        .map(file => `${file.id}:${archiveImageSource(file)}`));
    for (const [key, entry] of view.cache)
    {
        if (keep.has(key)) continue;
        entry.cancel?.();
        entry.image.onload = null;
        entry.image.onerror = null;
        entry.image.src = '';
        view.cache.delete(key);
    }
}

function archiveImageLayout()
{
    const view = archiveImageView;
    const stage = view.host?.querySelector('.archive-image-stage');
    const image = stage?.querySelector('[data-av-image]');
    if (!image || image.hidden || !image.naturalWidth) return;
    const width = stage.clientWidth;
    const height = stage.clientHeight;
    const fit = Math.min((width - 24) / image.naturalWidth, (height - 24) / image.naturalHeight);
    const fitWidth = Math.max(1, width - 24) / image.naturalWidth;
    const scale = view.mode === 'fit' ? fit : view.mode === 'width' ? fitWidth : fitWidth * view.zoom;
    const w = image.naturalWidth * scale;
    const h = image.naturalHeight * scale;
    const left = w <= width ? (width - w) / 2 : -(w - width) * view.panX;
    const top = h <= height ? (height - h) / 2 : -(h - height) * view.panY;
    Object.assign(image.style, { width: `${w}px`, height: `${h}px`, transform: `translate(${left}px, ${top}px)` });
    view.geometry = { width, height, w, h, scale, fitWidth, left, top };
    archiveImageHighlight(view.hoveredPersonId);
    view.host.querySelector('[data-av-zoom]').value = `${Math.round(scale * 100)}%`;
    ['fit', 'width'].forEach(mode => view.host.querySelector(`[data-av-action="${mode}"]`)?.setAttribute('aria-pressed', String(view.mode === mode)));
}

function archiveImageHighlight(personId)
{
    const view = archiveImageView;
    view.hoveredPersonId = personId;
    const overlay = view.host?.querySelector('[data-av-person-region]');
    if (!overlay) return;
    const file = view.files[view.index];
    const region = normalizeFaceRegion(file?.personRegions?.[personId]);
    const image = view.host.querySelector('[data-av-image]');
    if (!personId || !region || !view.geometry || image?.hidden)
    {
        overlay.hidden = true;
        return;
    }
    const { left, top, w, h } = view.geometry;
    Object.assign(overlay.style, { left: `${left + region.x * w}px`, top: `${top + region.y * h}px`, width: `${region.width * w}px`, height: `${region.height * h}px` });
    overlay.hidden = false;
}

function archiveImageRenderStrip()
{
    const view = archiveImageView;
    const strip = view.host?.querySelector('[data-av-strip]');
    if (!strip || strip.hidden) return;
    const track = strip.querySelector('[data-av-track]');
    const slot = 88;
    track.style.width = `${view.files.length * slot}px`;
    const start = Math.max(0, Math.floor(strip.scrollLeft / slot) - 3);
    const end = Math.min(view.files.length, Math.ceil((strip.scrollLeft + strip.clientWidth) / slot) + 3);
    const focused = document.activeElement?.closest('[data-av-index]');
    const focusedIndex = focused && track.contains(focused) ? Number(focused.dataset.avIndex) : -1;
    const desired = new Set(Array.from({ length: end - start }, (_, index) => index + start));
    if (focusedIndex >= 0) desired.add(focusedIndex);
    track.querySelectorAll('[data-av-index]').forEach(button =>
    {
        if (!desired.has(Number(button.dataset.avIndex))) button.remove();
    });
    for (const index of desired)
    {
        const file = view.files[index];
        if (!file) continue;
        let button = track.querySelector(`[data-av-index="${index}"]`);
        if (!button)
        {
            button = document.createElement('button');
            button.type = 'button';
            button.dataset.avIndex = index;
            button.style.left = `${index * slot}px`;
            const src = file.thumbnailUrl || file.previewUrl || view.thumbs.get(file.id);
            button.innerHTML = `${src ? `<img src="${escapeHtml(src)}" alt="" loading="lazy" decoding="async">` : icon.image}<span>${index + 1}</span>`;
            button.querySelector('img')?.addEventListener('error', event => { event.currentTarget.remove(); });
            track.appendChild(button);
        }
        button.title = file.name || t('Image');
        button.setAttribute('aria-label', `${t('Image')} ${index + 1}: ${file.name || ''}`);
        button.setAttribute('aria-current', String(index === view.index));
        button.tabIndex = index === view.index ? 0 : -1;
    }
}

function archiveImageRevealThumbnail()
{
    const view = archiveImageView;
    const strip = view.host?.querySelector('[data-av-strip]');
    if (!strip || strip.hidden) return;
    const left = view.index * 88;
    if (left < strip.scrollLeft || left + 88 > strip.scrollLeft + strip.clientWidth)
        strip.scrollLeft = Math.max(0, left - (strip.clientWidth - 88) / 2);
    view.scroll = strip.scrollLeft;
    archiveImageRenderStrip();
}

async function archiveImageShow()
{
    const view = archiveImageView;
    const host = view.host;
    if (!host) return;
    const file = view.files[view.index];
    if (!file) return;
    const token = ++view.token;
    const image = host.querySelector('[data-av-image]');
    const status = host.querySelector('[data-av-status]');
    image.hidden = true;
    archiveImageHighlight(null);
    status.textContent = t('Loading image...');
    status.hidden = false;
    host.querySelector('[data-av-position]').value = view.index + 1;
    host.querySelector('[data-av-action="previous"]').disabled = view.index === 0;
    host.querySelector('[data-av-action="next"]').disabled = view.index === view.files.length - 1;
    host.querySelector('[data-av-announcement]').textContent = `${t('Image')} ${view.index + 1} ${t('of')} ${view.files.length}: ${file.name}`;
    archiveImageRevealThumbnail();
    archiveImageTrimCache();
    for (const neighbour of [view.files[view.index - 1], view.files[view.index + 1]].filter(Boolean))
        archiveImageLoad(neighbour).catch(() => {});
    try
    {
        const loaded = await archiveImageLoad(file);
        if (token !== view.token || !host.isConnected) return;
        image.src = loaded.src;
        image.alt = file.name || t('Image');
        await image.decode().catch(() => {});
        if (token !== view.token || !host.isConnected) return;
        image.hidden = false;
        status.hidden = true;
        archiveImageLayout();
        if (!view.thumbs.has(file.id))
        {
            try
            {
                const canvas = document.createElement('canvas');
                canvas.width = 96;
                canvas.height = Math.max(1, Math.round(96 * loaded.naturalHeight / loaded.naturalWidth));
                if (canvas.height > 128) { canvas.width = Math.max(1, Math.round(128 * loaded.naturalWidth / loaded.naturalHeight)); canvas.height = 128; }
                canvas.getContext('2d').drawImage(loaded, 0, 0, canvas.width, canvas.height);
                view.thumbs.set(file.id, canvas.toDataURL('image/jpeg', .65));
                if (view.thumbs.size > 100) view.thumbs.delete(view.thumbs.keys().next().value);
                const button = host.querySelector(`[data-av-index="${view.index}"]`);
                if (button && !button.querySelector('img'))
                {
                    const thumb = document.createElement('img');
                    thumb.alt = '';
                    thumb.src = view.thumbs.get(file.id);
                    button.querySelector('svg')?.replaceWith(thumb);
                }
            }
            catch (_) { /* Cross-origin originals can still be read without generating thumbnails. */ }
        }
    }
    catch (_)
    {
        if (token !== view.token || !host.isConnected) return;
        status.innerHTML = `<p>${escapeHtml(t('This image could not be loaded.'))}</p><button type="button" class="button secondary" data-av-action="retry">${escapeHtml(t('Retry'))}</button>`;
    }
}

function archiveImageNavigate(index, focusThumbnail = false, focusViewer = false)
{
    const view = archiveImageView;
    if (!Number.isInteger(index) || index < 0 || index >= view.files.length || index === view.index) return;
    const id = view.files[index].id;
    runAfterArchiveFileEditGuard(() =>
    {
        const currentIndex = view.indices.get(id);
        if (currentIndex === undefined || !archiveFileById(id)) return;
        view.index = currentIndex;
        state.archiveSelectedFileId = id;
        state.archiveSelectedFolderItemId = null;
        const inspector = main.querySelector('.archive-inspector');
        if (inspector)
        {
            const scroll = inspector.querySelector('.archive-inspector-scroll')?.scrollTop || 0;
            inspector.outerHTML = renderArchiveFileInspector(view.files[view.index]);
            const next = main.querySelector('.archive-inspector');
            bindArchiveControls(next);
            localizeUI(next);
            next.querySelector('.archive-inspector-scroll').scrollTop = scroll;
        }
        const restoreViewerFocus = focusViewer || Boolean(document.activeElement?.matches('.archive-image-stage > button'));
        archiveImageShow();
        if (restoreViewerFocus) view.host?.querySelector('.archive-image-stage')?.focus({ preventScroll: true });
        if (focusThumbnail) view.host?.querySelector(`[data-av-index="${view.index}"]`)?.focus({ preventScroll: true });
        appNavigationObserve();
    });
}

function archiveImageSetExpanded(expanded)
{
    archiveImageView.expanded = expanded;
    document.body.classList.toggle('archive-image-expanded', expanded);
    const button = archiveImageView.host?.querySelector('[data-av-action="expand"]');
    button?.setAttribute('aria-pressed', String(expanded));
    button?.setAttribute('aria-label', t(expanded ? 'Restore viewer' : 'Expand viewer'));
    if (button) button.title = t(expanded ? 'Restore viewer' : 'Expand viewer');
    requestAnimationFrame(() => { archiveImageLayout(); archiveImageRevealThumbnail(); });
}

function mountArchiveImageView()
{
    archiveImageSyncLifecycle();
    const view = archiveImageView;
    const host = main.querySelector('.archive-image-workspace');
    if (!host) return;
    view.host = host;
    const strip = host.querySelector('[data-av-strip]');
    const stage = host.querySelector('.archive-image-stage');
    const image = document.createElement('img');
    image.dataset.avImage = '';
    image.alt = '';
    image.draggable = false;
    image.hidden = true;
    stage.prepend(image);
    archiveImageRenderStrip();
    strip.scrollLeft = view.scroll;
    strip.addEventListener('scroll', () => { view.scroll = strip.scrollLeft; archiveImageRenderStrip(); }, { passive: true });
    host.addEventListener('click', event =>
    {
        const thumb = event.target.closest('[data-av-index]');
        if (thumb) { archiveImageNavigate(Number(thumb.dataset.avIndex)); return; }
        const action = event.target.closest('[data-av-action]')?.dataset.avAction;
        if (action === 'previous') archiveImageNavigate(view.index - 1, false, true);
        if (action === 'next') archiveImageNavigate(view.index + 1, false, true);
        if (action === 'fit' || action === 'width')
        {
            view.mode = action;
            view.panX = .5;
            view.panY = action === 'width' ? 0 : .5;
            archiveImageLayout();
        }
        if (action === 'in' || action === 'out') zoomBy(action === 'in' ? 1.25 : .8);
        if (action === 'expand') archiveImageSetExpanded(!view.expanded);
        if (action === 'details') openMobileSurface('details');
        if (action === 'strip')
        {
            view.stripHidden = !view.stripHidden;
            strip.hidden = view.stripHidden;
            host.querySelector('[data-av-action="strip"]').setAttribute('aria-expanded', String(!view.stripHidden));
            archiveImageRevealThumbnail();
        }
        if (action === 'retry')
        {
            const file = view.files[view.index];
            view.cache.delete(`${file.id}:${archiveImageSource(file)}`);
            archiveImageShow();
        }
    });
    const position = host.querySelector('[data-av-position]');
    const commitPosition = () =>
    {
        const value = Number(position.value);
        if (Number.isInteger(value) && value >= 1 && value <= view.files.length) archiveImageNavigate(value - 1);
        position.value = view.index + 1;
    };
    position.addEventListener('change', commitPosition);
    position.addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); commitPosition(); } });
    host.addEventListener('keydown', event =>
    {
        if (modalBackdrop.classList.contains('open') || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey
            || event.target.closest('input, textarea, select, [contenteditable="true"]')
            || !event.target.closest('.archive-image-stage, [data-av-strip], .archive-image-tools')) return;
        if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
        event.preventDefault();
        archiveImageNavigate(view.index + (event.key === 'ArrowRight' ? 1 : -1), Boolean(event.target.closest('[data-av-strip]')));
    });
    function zoomBy(factor, anchor = null)
    {
        const geometry = view.geometry;
        if (!geometry) return;
        const point = anchor || { x: geometry.width / 2, y: geometry.height / 2 };
        const imageX = (point.x - geometry.left) / geometry.w;
        const imageY = (point.y - geometry.top) / geometry.h;
        view.zoom = Math.max(.1, Math.min(8, (view.mode === 'manual' ? view.zoom : geometry.scale / geometry.fitWidth) * factor));
        view.mode = 'manual';
        const ratio = geometry.fitWidth * view.zoom / geometry.scale;
        const w = geometry.w * ratio;
        const h = geometry.h * ratio;
        view.panX = Math.max(0, Math.min(1, (imageX * w - point.x) / Math.max(1, w - geometry.width)));
        view.panY = Math.max(0, Math.min(1, (imageY * h - point.y) / Math.max(1, h - geometry.height)));
        archiveImageLayout();
    }
    const pointers = new Map();
    let drag = null;
    stage.addEventListener('pointerdown', event =>
    {
        if (event.button !== 0 || !view.geometry || event.target.closest('button')) return;
        stage.setPointerCapture(event.pointerId);
        stage.focus({ preventScroll: true });
        pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
        drag = { x: event.clientX, y: event.clientY, panX: view.panX, panY: view.panY };
        if (pointers.size === 2)
        {
            const [a, b] = [...pointers.values()];
            drag = { ...drag, distance: Math.hypot(a.x - b.x, a.y - b.y), zoom: view.geometry.scale / view.geometry.fitWidth };
        }
    });
    stage.addEventListener('pointermove', event =>
    {
        if (!pointers.has(event.pointerId) || !drag) return;
        pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
        if (pointers.size === 2 && drag.distance)
        {
            const [a, b] = [...pointers.values()];
            view.mode = 'manual';
            view.zoom = Math.max(.1, Math.min(8, drag.zoom * Math.hypot(a.x - b.x, a.y - b.y) / drag.distance));
        }
        else
        {
            const { w, h, width, height } = view.geometry;
            view.panX = Math.max(0, Math.min(1, drag.panX - (event.clientX - drag.x) / Math.max(1, w - width)));
            view.panY = Math.max(0, Math.min(1, drag.panY - (event.clientY - drag.y) / Math.max(1, h - height)));
        }
        archiveImageLayout();
    });
    const end = event => { pointers.delete(event.pointerId); drag = null; };
    stage.addEventListener('pointerup', end);
    stage.addEventListener('pointercancel', end);
    stage.addEventListener('wheel', event =>
    {
        if (event.target.closest('button') || !view.geometry || image.hidden || modalBackdrop.classList.contains('open')) return;
        event.preventDefault();
        const bounds = stage.getBoundingClientRect();
        const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? bounds.height : 1);
        zoomBy(Math.exp(-Math.max(-200, Math.min(200, delta)) * .002), { x: event.clientX - bounds.left, y: event.clientY - bounds.top });
    }, { passive: false });
    const observer = new ResizeObserver(() => { archiveImageLayout(); archiveImageRenderStrip(); });
    observer.observe(stage);
    observer.observe(strip);
    view.dispose = () => observer.disconnect();
    archiveImageSetExpanded(view.expanded);
    archiveImageShow();
}

document.addEventListener('keydown', event =>
{
    if (event.key !== 'Escape' || !archiveImagesActive() || !archiveImageView.expanded
        || modalBackdrop.classList.contains('open') || document.querySelector('.common-menu, .dropdown-menu')) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    archiveImageSetExpanded(false);
    archiveImageView.host?.querySelector('[data-av-action="expand"]')?.focus({ preventScroll: true });
}, true);
