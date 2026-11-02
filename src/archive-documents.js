const archiveDocumentBytes = new Map();
const archiveDocumentExtensions = new Set(['txt', 'csv', 'pdf', 'docx']);
const archiveImageExtensions = new Set(['png', 'jpg', 'jpeg', 'webp']);
const archiveUploadedImageUrls = new Map();
const archiveDocumentMaxBytes = 20 * 1024 * 1024;
let archiveShowMarkedAreas = true;

function archiveImageSource(file) {
    return file?.assetUrl || file?.previewUrl || file?.src || file?.thumbnailUrl || '';
}

function archiveCanViewFile(file) {
    if (!file) return false;
    const extension = archiveDocumentExtension(file.name);
    if (archiveImageExtensions.has(extension)) return Boolean(archiveImageSource(file) || archiveDocumentBytes.has(file.id));
    return archiveDocumentExtensions.has(extension) && Boolean(file.assetUrl || archiveDocumentBytes.has(file.id));
}

function archiveMarkedRegions(file) {
    return Object.entries(file?.personRegions || {}).map(([personId, raw]) => {
        const region = normalizeFaceRegion(raw);
        const person = sampleData.people.find(item => item.id === personId && item.projectId === file.projectId);
        return region && person ? { personId, region, name: personResourceDisplayName(person) } : null;
    }).filter(Boolean);
}

function archiveUpdateRegionVisibility() {
    document.querySelectorAll('[data-archive-region-box]').forEach(box => {
        box.hidden = box.dataset.archiveRegionReady === 'false'
            || !box.classList.contains('is-active');
    });
}

function archiveDocumentExtension(name) {
    return String(name || '').split('.').pop().toLowerCase();
}

function archiveDocumentLabel(english, russian) {
    return state.language === 'ru' ? russian : english;
}

async function archiveDocumentBlob(file) {
    if (archiveDocumentBytes.has(file.id)) return archiveDocumentBytes.get(file.id);
    const source = archiveImageExtensions.has(archiveDocumentExtension(file.name)) ? archiveImageSource(file) : file.assetUrl;
    if (!source) throw new Error(archiveDocumentLabel('This file has no viewable original.', 'У этого файла нет доступного оригинала.'));
    const response = await fetch(source);
    if (!response.ok) throw new Error(archiveDocumentLabel('The sample file could not be loaded.', 'Не удалось загрузить образец файла.'));
    return response.blob();
}

function archiveDocumentDownload(file, blob) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function archiveReleaseDocument(fileId) {
    const url = archiveUploadedImageUrls.get(fileId);
    if (url) URL.revokeObjectURL(url);
    archiveUploadedImageUrls.delete(fileId);
    archiveDocumentBytes.delete(fileId);
}

async function archiveValidateImage(source, extension) {
    const bytes = new Uint8Array(await source.slice(0, 12).arrayBuffer());
    const png = extension === 'png' && [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value);
    const jpeg = ['jpg', 'jpeg'].includes(extension) && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    const webp = extension === 'webp' && String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF'
        && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
    if (!png && !jpeg && !webp) throw new Error(archiveDocumentLabel('Invalid image file', 'Недопустимый файл изображения'));
    const bitmap = await createImageBitmap(source);
    try {
        if (!bitmap.width || !bitmap.height) throw new Error('Empty image');
    } finally {
        bitmap.close();
    }
}

async function archiveDocumentRenderPdf(blob, host, modal) {
    const pdfjs = await import('./vendor/pdfjs-5.6.205.min.mjs');
    pdfjs.GlobalWorkerOptions.workerSrc = new URL('./vendor/pdfjs-worker-5.6.205.min.mjs', location.href).href;
    const bytes = await blob.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: bytes, isEvalSupported: false, useSystemFonts: true }).promise;
    if (!pdf.numPages) throw new Error('Empty PDF');
    host.replaceChildren();
    const toolbar = modal.querySelector('[data-document-tools]');
    toolbar.hidden = false;
    toolbar.classList.add('archive-document-tools', 'archive-document-pdf-tools');
    toolbar.innerHTML = `<div class="archive-document-tool-group"><button class="button secondary" type="button" data-pdf-prev aria-label="${escapeHtml(archiveDocumentLabel('Previous page', 'Предыдущая страница'))}" title="${escapeHtml(archiveDocumentLabel('Previous page', 'Предыдущая страница'))}">${icon.arrow}</button><span data-pdf-page aria-live="polite"></span><button class="button secondary archive-pdf-next" type="button" data-pdf-next aria-label="${escapeHtml(archiveDocumentLabel('Next page', 'Следующая страница'))}" title="${escapeHtml(archiveDocumentLabel('Next page', 'Следующая страница'))}">${icon.arrow}</button></div><div class="archive-document-tool-group"><button class="button secondary" type="button" data-pdf-out aria-label="${escapeHtml(archiveDocumentLabel('Zoom out', 'Уменьшить'))}" title="${escapeHtml(archiveDocumentLabel('Zoom out', 'Уменьшить'))}">${icon.zoomOut}</button><span data-pdf-zoom aria-live="polite"></span><button class="button secondary" type="button" data-pdf-in aria-label="${escapeHtml(archiveDocumentLabel('Zoom in', 'Увеличить'))}" title="${escapeHtml(archiveDocumentLabel('Zoom in', 'Увеличить'))}">${icon.zoomIn}</button></div>`;
    const canvas = document.createElement('canvas');
    canvas.className = 'archive-document-pdf-canvas';
    const stage = document.createElement('div');
    stage.className = 'archive-document-pdf-stage';
    stage.append(canvas);
    host.append(stage);
    let pageNumber = 1;
    let zoom = 1;
    let renderSerial = 0;
    let renderTask = null;
    const render = async () => {
        const serial = ++renderSerial;
        const page = await pdf.getPage(pageNumber);
        if (serial !== renderSerial || !modal.isConnected) return;
        if (renderTask) {
            renderTask.cancel();
            try { await renderTask.promise; } catch (error) {
                if (error.name !== 'RenderingCancelledException') throw error;
            }
        }
        if (serial !== renderSerial || !modal.isConnected) return;
        const hostStyle = getComputedStyle(host);
        const available = Math.max(160, host.clientWidth
            - parseFloat(hostStyle.paddingLeft) - parseFloat(hostStyle.paddingRight) - 32);
        const natural = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: available / natural.width * zoom });
        if (serial !== renderSerial || !modal.isConnected) return;
        const ratio = Math.min(devicePixelRatio || 1, 2);
        canvas.width = Math.round(viewport.width * ratio);
        canvas.height = Math.round(viewport.height * ratio);
        canvas.style.width = `${Math.round(viewport.width)}px`;
        canvas.style.height = `${Math.round(viewport.height)}px`;
        const context = canvas.getContext('2d');
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
        renderTask = page.render({ canvasContext: context, viewport });
        await renderTask.promise;
        if (serial !== renderSerial || !modal.isConnected) return;
        toolbar.querySelector('[data-pdf-page]').textContent = `${pageNumber} / ${pdf.numPages}`;
        toolbar.querySelector('[data-pdf-zoom]').textContent = `${Math.round(zoom * 100)}%`;
        toolbar.querySelector('[data-pdf-prev]').disabled = pageNumber === 1;
        toolbar.querySelector('[data-pdf-next]').disabled = pageNumber === pdf.numPages;
    };
    toolbar.addEventListener('click', event => {
        const button = event.target.closest('button');
        if (!button) return;
        if (button.hasAttribute('data-pdf-prev')) pageNumber = Math.max(1, pageNumber - 1);
        if (button.hasAttribute('data-pdf-next')) pageNumber = Math.min(pdf.numPages, pageNumber + 1);
        if (button.hasAttribute('data-pdf-out')) zoom = Math.max(0.5, +(zoom - 0.25).toFixed(2));
        if (button.hasAttribute('data-pdf-in')) zoom = Math.min(2, +(zoom + 0.25).toFixed(2));
        render().catch(error => { if (modal.isConnected && error.name !== 'RenderingCancelledException') host.textContent = error.message; });
    });
    const observer = new ResizeObserver(() => {
        if (!modal.isConnected) { observer.disconnect(); return; }
        render().catch(error => { if (modal.isConnected && error.name !== 'RenderingCancelledException') host.textContent = error.message; });
    });
    await render();
    observer.observe(host);
    const cleanup = new MutationObserver(() => {
        if (modal.isConnected) return;
        observer.disconnect();
        renderTask?.cancel();
        pdf.destroy();
        cleanup.disconnect();
    });
    cleanup.observe(modalBackdrop, { childList: true });
}

function archiveDocumentRenderCsv(text, host) {
    if (!window.Papa) throw new Error('CSV parser unavailable');
    const parsed = Papa.parse(text, { delimiter: ',', skipEmptyLines: true });
    if (parsed.errors.length) throw new Error(parsed.errors[0].message);
    const [heading = [], ...rows] = parsed.data;
    const table = document.createElement('table');
    table.className = 'archive-document-table';
    const head = table.createTHead().insertRow();
    heading.forEach(value => { const cell = document.createElement('th'); cell.textContent = value; head.append(cell); });
    const body = table.createTBody();
    let index = 0;
    const append = () => {
        const end = Math.min(index + 150, rows.length);
        for (; index < end; index++) {
            const row = body.insertRow();
            rows[index].forEach(value => { const cell = row.insertCell(); cell.textContent = value; });
        }
    };
    append();
    host.append(table);
    host.addEventListener('scroll', () => {
        if (host.scrollTop + host.clientHeight >= host.scrollHeight - 400 && index < rows.length) append();
    }, { passive: true });
}

function openArchiveImagePeopleModal(fileId, { mode = 'preview' } = {}) {
    const file = archiveFileById(fileId);
    if (!file || !archiveCanViewFile(file)) return;
    openUnifiedImagePeopleModal(file.id, {
        mode,
        archiveFile: file,
        imageSrc: archiveImageSource(file)
    });
}

async function openArchiveDocumentViewer(fileId) {
    const file = archiveFileById(fileId);
    if (!file) return;
    const extension = archiveDocumentExtension(file.name);
    if (archiveImageExtensions.has(extension)) {
        if (archiveCanViewFile(file)) openArchiveImagePeopleModal(fileId);
        else showToast(archiveDocumentLabel('No in-app viewer is available for this file.', 'Этот файл пока нельзя открыть в приложении.'));
        return;
    }
    if (!archiveCanViewFile(file)) {
        showToast(archiveDocumentLabel('No in-app viewer is available for this file.', 'Этот файл пока нельзя открыть в приложении.'));
        return;
    }
    openModal(`<div class="modal archive-document-modal" role="dialog" aria-modal="true" aria-labelledby="archiveDocumentTitle"><div class="modal-header"><div><h2 id="archiveDocumentTitle" data-user-content>${escapeHtml(file.name)}</h2><p>${escapeHtml(extension.toUpperCase())}</p></div><button class="close-button" type="button" data-close aria-label="Close">${icon.close}</button></div><div class="archive-document-tools" data-document-tools hidden></div><div class="modal-body archive-document-body" data-document-body data-user-content><p>${escapeHtml(archiveDocumentLabel('Loading document…', 'Загрузка документа…'))}</p></div></div>`);
    const modal = modalBackdrop.querySelector('.archive-document-modal');
    const host = modal?.querySelector('[data-document-body]');
    if (!host) return;
    try {
        const blob = await archiveDocumentBlob(file);
        if (!modal.isConnected) return;
        host.replaceChildren();
        if (extension === 'txt') {
            const pre = document.createElement('pre');
            pre.className = 'archive-document-text';
            pre.textContent = await blob.text();
            host.append(pre);
        } else if (extension === 'csv') {
            archiveDocumentRenderCsv(await blob.text(), host);
        } else if (extension === 'docx') {
            if (!window.mammoth || !window.DOMPurify) throw new Error('Document viewer unavailable');
            const converted = await mammoth.convertToHtml({ arrayBuffer: await blob.arrayBuffer() }, { externalFileAccess: false });
            const article = document.createElement('article');
            article.className = 'archive-document-article';
            article.innerHTML = DOMPurify.sanitize(converted.value, { USE_PROFILES: { html: true }, FORBID_TAGS: ['iframe', 'object', 'embed', 'form'] });
            host.append(article);
        } else {
            await archiveDocumentRenderPdf(blob, host, modal);
        }
    } catch (error) {
        if (modal.isConnected) host.textContent = `${archiveDocumentLabel('This document could not be opened:', 'Не удалось открыть документ:')} ${error.message}`;
    }
}

async function archiveImportFiles(selected, { projectId = currentProjectId(), folderId = null, onResult = () => {} } = {}) {
    const ids = [];
    if (!projectId || (folderId && !archiveFolderById(folderId, projectId))) return ids;
    for (const source of Array.from(selected || [])) {
        const report = (status, message) => onResult(source, status, message);
        report('uploading', archiveDocumentLabel('Importing...', 'Добавление...'));
        const extension = archiveDocumentExtension(source.name);
        if (!(archiveDocumentExtensions.has(extension) || archiveImageExtensions.has(extension)) || source.size > archiveDocumentMaxBytes || source.size === 0) {
            report('error', archiveDocumentLabel('Unsupported, empty, or over 20 MB.', 'Неподдерживаемый, пустой или больше 20 МБ.'));
            continue;
        }
        try {
            const signature = new Uint8Array(await source.slice(0, 5).arrayBuffer());
            if (extension === 'pdf' && String.fromCharCode(...signature) !== '%PDF-') throw new Error('Invalid PDF');
            if (extension === 'docx' && !(signature[0] === 80 && signature[1] === 75)) throw new Error('Invalid DOCX');
            if (extension === 'pdf') {
                const pdfjs = await import('./vendor/pdfjs-5.6.205.min.mjs');
                pdfjs.GlobalWorkerOptions.workerSrc = new URL('./vendor/pdfjs-worker-5.6.205.min.mjs', location.href).href;
                await pdfjs.getDocument({ data: await source.arrayBuffer(), isEvalSupported: false }).promise;
            }
            if (extension === 'csv') {
                const parsed = Papa.parse(await source.text(), { delimiter: ',', skipEmptyLines: true });
                if (parsed.errors.length) throw new Error(parsed.errors[0].message);
            }
            if (extension === 'docx') await mammoth.convertToHtml({ arrayBuffer: await source.arrayBuffer() }, { externalFileAccess: false });
            if (archiveImageExtensions.has(extension)) await archiveValidateImage(source, extension);
            const id = `af-upload-${crypto.randomUUID()}`;
            const now = new Date().toISOString();
            const image = archiveImageExtensions.has(extension);
            const kind = image ? 'img' : extension === 'pdf' ? 'pdf' : extension === 'csv' ? 'sheet' : 'doc';
            const previewUrl = image ? URL.createObjectURL(source) : '';
            sampleData.archiveFiles.push({ id, projectId, folderId, name: source.name, kind, type: image ? 'Image' : extension.toUpperCase(), mimeType: source.type, size: `${Math.max(1, Math.ceil(source.size / 1024))} KB`, sizeBytes: source.size, favorite: false, description: '', previewUrl, linkedPersonIds: [], linkedEventIds: [], linkedNoteIds: [], linkedPlaceIds: [], placeIds: [], addedAt: now, updatedAt: now });
            archiveDocumentBytes.set(id, source);
            if (image) archiveUploadedImageUrls.set(id, previewUrl);
            ids.push(id);
            report('success', archiveDocumentLabel('Added', 'Добавлен'));
        } catch (error) {
            report('error', `${archiveDocumentLabel('Could not read file', 'Не удалось прочитать файл')} (${error.message})`);
        }
    }
    return ids;
}

function archiveRollbackImportedFiles(ids) {
    const removed = new Set(ids);
    for (let index = sampleData.archiveFiles.length - 1; index >= 0; index--) {
        if (removed.has(sampleData.archiveFiles[index].id)) sampleData.archiveFiles.splice(index, 1);
    }
    ids.forEach(id => {
        archiveDocumentBytes.delete(id);
        const url = archiveUploadedImageUrls.get(id);
        if (url) URL.revokeObjectURL(url);
        archiveUploadedImageUrls.delete(id);
    });
}

function archiveBindStagedImport({ modal, input, drop, result, rows, chooseButton, doneButton, files, projectId, folderId, onImported }) {
    const queue = [];
    const tiles = document.createElement('div');
    tiles.className = 'rp-upload-tiles';
    tiles.setAttribute('aria-label', archiveDocumentLabel('Selected files', 'Выбранные файлы'));
    result.before(tiles);
    modal.classList.add('rp-upload-staging', 'is-staged');
    doneButton.textContent = archiveDocumentLabel('Cancel', 'Отмена');
    let importing = false;
    modalBackdrop.beforeClose = () => !importing;
    const release = item => { if (item.previewUrl) URL.revokeObjectURL(item.previewUrl); };
    const observer = new MutationObserver(() => {
        if (modal.isConnected) return;
        queue.forEach(release);
        observer.disconnect();
    });
    observer.observe(modalBackdrop, { childList: true, subtree: true });
    const showErrors = messages => {
        rows.innerHTML = messages.map(message => `<p class="archive-document-import-row error">${escapeHtml(message)}</p>`).join('');
        result.hidden = !messages.length;
    };
    const render = () => {
        modal.classList.toggle('has-items', queue.length > 0);
        tiles.hidden = !queue.length;
        tiles.innerHTML = queue.map(item => `<article class="rp-upload-tile">
            <span class="rp-upload-tile-preview">${item.previewUrl ? `<img src="${escapeHtml(item.previewUrl)}" alt="">` : archiveImageExtensions.has(archiveDocumentExtension(item.file.name)) ? icon.photo : icon.file}</span>
            <strong title="${escapeHtml(item.file.name)}">${escapeHtml(item.file.name)}</strong>
            <small>${Math.max(1, Math.ceil(item.file.size / 1024))} KB${item.error ? ` · ${escapeHtml(item.error)}` : ''}</small>
            <button type="button" class="rp-upload-remove" data-document-remove="${item.id}" aria-label="${escapeHtml(archiveDocumentLabel('Remove', 'Убрать'))}: ${escapeHtml(item.file.name)}" ${importing ? 'disabled' : ''}>${icon.close}</button>
        </article>`).join('');
        drop.querySelector('.upload-dropzone-copy strong').textContent = queue.length
            ? archiveDocumentLabel('Add more files', 'Добавить ещё файлы')
            : archiveDocumentLabel('Choose files', 'Выбрать файлы');
        chooseButton.textContent = archiveDocumentLabel('Add files', 'Добавить файлы');
        chooseButton.disabled = importing || !queue.length;
    };
    const receive = selected => {
        if (importing) return;
        const errors = [];
        for (const file of Array.from(selected || [])) {
            const extension = archiveDocumentExtension(file.name);
            if (!(archiveDocumentExtensions.has(extension) || archiveImageExtensions.has(extension)) || !file.size || file.size > archiveDocumentMaxBytes) {
                errors.push(`${file.name}: ${archiveDocumentLabel('Unsupported, empty, or over 20 MB.', 'Неподдерживаемый, пустой или больше 20 МБ.')}`);
                continue;
            }
            const previewUrl = archiveImageExtensions.has(extension) ? URL.createObjectURL(file) : '';
            queue.push({ id: crypto.randomUUID(), file, previewUrl, error: '' });
        }
        showErrors(errors);
        input.value = '';
        render();
    };
    bindUploadDropzoneChooser(drop, input);
    input.addEventListener('change', () => receive(input.files));
    drop.addEventListener('dragover', event => { event.preventDefault(); drop.classList.add('dragging'); });
    drop.addEventListener('dragleave', () => drop.classList.remove('dragging'));
    drop.addEventListener('drop', event => { event.preventDefault(); drop.classList.remove('dragging'); receive(event.dataTransfer.files); });
    tiles.addEventListener('click', event => {
        const button = event.target.closest('[data-document-remove]');
        if (!button || importing) return;
        const index = queue.findIndex(item => item.id === button.dataset.documentRemove);
        if (index >= 0) release(queue.splice(index, 1)[0]);
        render();
    });
    chooseButton.addEventListener('click', async () => {
        if (importing || !queue.length) return;
        if (folderId && !archiveFolderById(folderId, projectId)) {
            showErrors([archiveDocumentLabel('This folder is no longer available. Choose another folder.', 'Эта папка больше недоступна. Выберите другую папку.')]);
            return;
        }
        importing = true;
        modal.setAttribute('aria-busy', 'true');
        input.disabled = true;
        doneButton.disabled = true;
        drop.setAttribute('aria-disabled', 'true');
        render();
        const errors = [];
        const selected = [...queue];
        selected.forEach(item => { item.error = ''; });
        let shouldClose = false;
        try {
            const ids = await archiveImportFiles(selected.map(item => item.file), { projectId, folderId, onResult: (file, status, message) => {
                const item = selected.find(candidate => candidate.file === file);
                if (item && status === 'error') { item.error = message; errors.push(`${file.name}: ${message}`); }
            } });
            for (const item of selected.filter(item => !item.error)) {
                const index = queue.indexOf(item);
                if (index >= 0) release(queue.splice(index, 1)[0]);
            }
            if (ids.length) {
                let linked;
                try { linked = onImported ? await onImported(ids) : (renderArchiveMain(), { ok: true }); }
                catch (error) { linked = { ok: false, message: error.message }; }
                if (linked === false || linked?.ok === false) errors.push(linked?.message || archiveDocumentLabel('Files could not be linked.', 'Не удалось связать файлы.'));
            }
            showErrors(errors);
            shouldClose = !errors.length && ids.length > 0;
        }
        catch (error) {
            showErrors([error.message || archiveDocumentLabel('Files could not be added.', 'Не удалось добавить файлы.')]);
        }
        finally {
            importing = false;
            modal.setAttribute('aria-busy', 'false');
            input.disabled = false;
            doneButton.disabled = false;
            drop.setAttribute('aria-disabled', 'false');
            if (modal.isConnected) render();
        }
        if (shouldClose && modal.isConnected) closeModal();
    });
    if (files?.length) receive(files);
    render();
}
function openArchiveDocumentImport({ files = null, onImported = null, projectId = currentProjectId(), folderId = state.activeModule === 'Archive' ? state.archiveSelectedFolderId || null : null, destinationLabel = null, modalOpener = openModal } = {}) {
    const destination = destinationLabel || (folderId ? archiveFolderById(folderId, projectId)?.name : archiveDocumentLabel('All files', 'Все файлы'));
    modalOpener(`<div class="modal archive-document-import" role="dialog" aria-modal="true" aria-labelledby="archiveImportTitle"><div class="modal-header"><div><h2 id="archiveImportTitle">${escapeHtml(archiveDocumentLabel('Add files', 'Добавить файлы'))}</h2><p>${escapeHtml(archiveDocumentLabel('Adding to', 'Папка'))} <strong>${escapeHtml(destination || archiveDocumentLabel('All files', 'Все файлы'))}</strong></p></div><button class="close-button" type="button" data-close aria-label="Close">${icon.close}</button></div><div class="modal-body"><div class="archive-document-drop upload-dropzone" data-document-drop tabindex="0" role="button" aria-label="${escapeHtml(archiveDocumentLabel('Choose files or drop them here', 'Выберите файлы или перетащите их сюда'))}">${renderUploadDropzonePrompt(archiveDocumentLabel('Drop files here or choose files', 'Перетащите файлы сюда или выберите'), archiveDocumentLabel('PNG, JPEG, WebP, TXT, CSV, PDF, DOCX · Up to 20 MB each', 'PNG, JPEG, WebP, TXT, CSV, PDF, DOCX · До 20 МБ на файл'))}</div><input type="file" multiple accept=".png,.jpg,.jpeg,.webp,.txt,.csv,.pdf,.docx" data-document-input hidden><div class="archive-document-import-results" data-import-results data-user-content hidden><h3>${escapeHtml(archiveDocumentLabel('Import results', 'Результаты добавления'))}</h3><div data-import-rows></div></div></div><div class="modal-footer"><p class="archive-document-import-notice"><span aria-hidden="true">${icon.warning}</span><span>${escapeHtml(t('Uploaded files are available until page reload.'))}</span></p><span class="archive-document-import-summary" data-import-summary role="status" aria-live="polite"></span><button class="button secondary" type="button" data-close>${escapeHtml(archiveDocumentLabel('Done', 'Готово'))}</button><button class="button primary" type="button" data-document-choose>${escapeHtml(archiveDocumentLabel('Choose files', 'Выбрать файлы'))}</button></div></div>`);
    const modal = modalBackdrop.querySelector('.archive-document-import');
    if (!modal) return;
    const input = modal.querySelector('[data-document-input]');
    const drop = modal.querySelector('[data-document-drop]');
    const result = modal.querySelector('[data-import-results]');
    const rows = modal.querySelector('[data-import-rows]');
    const summary = modal.querySelector('[data-import-summary]');
    const chooseButton = modal.querySelector('[data-document-choose]');
    const doneButton = modal.querySelector('.modal-footer [data-close]');
    archiveBindStagedImport({ modal, input, drop, result, rows, chooseButton, doneButton, files, projectId, folderId, onImported });
}
