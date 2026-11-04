    // Media adapters share selection and modal lifecycle with resource-picker.js.
    function rpMediaSaved(result)
    {
        return result === true || Boolean(result && typeof result === 'object' && result.ok !== false);
    }

    function rpMediaValidIds(ids, records)
    {
        const valid = new Set(records.map(record => record.id));
        return [...new Set(ids || [])].filter(id => valid.has(id));
    }

    function rpMediaFavoriteFilter()
    {
        return { key: 'favorite', label: rpText('Favorites only', 'Только избранное'), type: 'checkbox' };
    }

    function rpPhotoMatchesDates(photo, values)
    {
        if (!values.dateFrom && !values.dateTo) return true;
        const boundary = value =>
        {
            const [year, month, day] = value.split('-').map(Number);
            return isValidGregorianDate(year, month, day) ? genealogyDayNumber(year, month, day) : NaN;
        };
        const from = values.dateFrom ? boundary(values.dateFrom) : -Infinity;
        const to = values.dateTo ? boundary(values.dateTo) : Infinity;
        if (Number.isNaN(from) || Number.isNaN(to) || from > to) return false;
        const model = photoDateModel(photo);
        // Circa dates have no exact bounds; use their stated partial date.
        const bounds = genealogyDateBounds(model) || (model.state === 'known' ? genealogyPartBounds(model.first, model.calendar) : null);
        return Boolean(bounds && bounds.min <= to && bounds.max >= from);
    }

    function rpMediaAfterCommit(config, ids, result, session)
    {
        config.afterSave?.(ids, result, session);
        const changes = session?.getChanges?.();
        const message = changes?.removedIds.length ? rpText('Connections updated.', 'Связи обновлены.')
            : typeof config.successMessage === 'function' ? config.successMessage(changes?.addedIds.length ?? ids.length, result) : config.successMessage;
        if (message) showToast(message);
    }

    function rpMediaThumbnail(source, title)
    {
        const missingLabel = `${title} · ${rpText('Image unavailable', 'Изображение недоступно')}`;
        return `<span class="rp-media-thumbnail${source ? ' has-image' : ' is-placeholder'}" role="img" data-missing-label="${escapeHtml(missingLabel)}" aria-label="${escapeHtml(source ? title : missingLabel)}">${source ? `<img src="${escapeHtml(source)}" alt="${escapeHtml(title)}" loading="lazy" onerror="this.parentElement.setAttribute('aria-label',this.parentElement.dataset.missingLabel);this.parentElement.classList.remove('has-image');this.parentElement.classList.add('is-placeholder');this.remove()">` : ''}${icon.photo || icon.file || ''}</span>`;
    }

    function rpMediaPreview(html, title, date = '')
    {
        return `<section class="rp-media-preview" aria-label="${escapeHtml(title)}">
            <header class="rp-media-preview-header"><div class="rp-media-preview-identity"><h3>${escapeHtml(title)}</h3>${date ? `<p>${escapeHtml(date)}</p>` : ''}</div>
            <div class="rp-media-preview-tools" role="toolbar" aria-label="${escapeHtml(rpText('Zoom', 'Масштаб'))}">
                <button type="button" class="icon-button" data-rp-media-zoom="out" aria-label="${escapeHtml(rpText('Zoom out', 'Уменьшить'))}" title="${escapeHtml(rpText('Zoom out', 'Уменьшить'))}">${icon.zoomOut}</button>
                <button type="button" class="button secondary" data-rp-media-zoom="fit">${escapeHtml(rpText('Fit', 'Вписать'))}</button>
                <button type="button" class="icon-button" data-rp-media-zoom="in" aria-label="${escapeHtml(rpText('Zoom in', 'Увеличить'))}" title="${escapeHtml(rpText('Zoom in', 'Увеличить'))}">${icon.zoomIn}</button>
            </div></header>
            <div class="rp-media-preview-stage" data-rp-media-stage style="height:360px;max-height:50vh;overflow:auto;display:grid;place-items:center">${html}</div>
        </section>`;
    }

    function rpBindMediaPreview(root)
    {
        const stage = root.querySelector('[data-rp-media-stage]');
        const image = stage?.querySelector('img');
        if (!image) return;
        const frame = image.parentElement;
        if (frame !== stage)
        {
            frame.style.position = 'relative';
            frame.style.width = '100%';
            frame.style.height = `${stage.clientHeight}px`;
            frame.style.display = 'grid';
            frame.style.placeItems = 'center';
            frame.style.overflow = 'visible';
        }
        let zoom = 1;
        const update = () =>
        {
            if (frame !== stage) frame.style.height = `${stage.clientHeight}px`;
            image.style.maxWidth = zoom === 1 ? '100%' : 'none';
            image.style.maxHeight = zoom === 1 ? `${stage.clientHeight}px` : 'none';
            image.style.objectFit = 'contain';
            image.style.position = 'static';
            image.style.transform = 'none';
            image.style.width = zoom === 1 ? 'auto' : `${image.naturalWidth * zoom}px`;
            image.style.height = zoom === 1 ? 'auto' : `${image.naturalHeight * zoom}px`;
        };
        image.addEventListener('load', update);
        update();
        const resize = new ResizeObserver(update);
        resize.observe(stage);
        const cleanup = new MutationObserver(() =>
        {
            if (stage.isConnected) return;
            resize.disconnect();
            cleanup.disconnect();
        });
        cleanup.observe(modalBackdrop, { childList: true, subtree: true });
        root.querySelectorAll('[data-rp-media-zoom]').forEach(button => button.addEventListener('click', () =>
        {
            const action = button.dataset.rpMediaZoom;
            zoom = action === 'fit' ? 1 : Math.max(0.1, Math.min(4, zoom * (action === 'in' ? 1.25 : 0.8)));
            update();
        }));
    }

    function rpCreatePhotoUpload(session, config)
    {
        const title = rpText('Upload photos', 'Загрузить фотографии');
        return session.openForm(`<form class="modal rp-upload-staging" data-rp-photo-upload>
            <div class="modal-header"><h2>${escapeHtml(title)}</h2><button type="button" class="close-button" data-close aria-label="${escapeHtml(rpText('Close', 'Закрыть'))}">${icon.close}</button></div>
            <div class="modal-body">
                <div class="upload-dropzone" data-rp-upload-dropzone tabindex="0" role="button" aria-label="${escapeHtml(title)}">
                    <input type="file" hidden multiple accept="${PHOTO_UPLOAD_ALLOWED_TYPES.join(',')}" data-rp-upload-input>
                    ${renderUploadDropzonePrompt(rpText('Choose photos', 'Выбрать фотографии'), `${rpText('JPEG, PNG, or WebP. Up to', 'JPEG, PNG или WebP. До')} ${Math.round(PHOTO_UPLOAD_MAX_BYTES / 1048576)} ${rpText('MB each', 'МБ на файл')}`)}
                </div>
                <div class="rp-upload-tiles" data-rp-upload-tiles aria-label="${escapeHtml(rpText('Selected photos', 'Выбранные фотографии'))}" hidden></div>
                <div class="rp-upload-errors" data-rp-upload-errors role="alert" hidden></div>
            </div>
            <div class="modal-footer"><p class="archive-document-import-notice"><span aria-hidden="true">${icon.warning}</span><span>${escapeHtml(t('Uploaded files are available until page reload.'))}</span></p><button type="button" class="button secondary" data-close>${escapeHtml(rpText('Cancel', 'Отмена'))}</button><button type="button" class="button primary" data-rp-upload-confirm disabled>${escapeHtml(rpText('Add photos', 'Добавить фотографии'))}</button></div>
        </form>`, root =>
        {
            const form = root.matches('[data-rp-photo-upload]') ? root : root.querySelector('[data-rp-photo-upload]');
            const input = form.querySelector('[data-rp-upload-input]');
            const dropzone = form.querySelector('[data-rp-upload-dropzone]');
            const tiles = form.querySelector('[data-rp-upload-tiles]');
            const errors = form.querySelector('[data-rp-upload-errors]');
            const confirm = form.querySelector('[data-rp-upload-confirm]');
            const drafts = [];
            let busy = false;
            bindUploadDropzoneChooser(dropzone, input);
            const render = () =>
            {
                form.classList.toggle('has-items', drafts.length > 0);
                tiles.hidden = !drafts.length;
                tiles.innerHTML = drafts.map(draft => `<article class="rp-upload-tile">
                    <span class="rp-upload-tile-preview"><img src="${escapeHtml(draft.src)}" alt=""></span>
                    <strong title="${escapeHtml(draft.filename)}">${escapeHtml(draft.filename)}</strong>
                    <small>${draft.width} × ${draft.height} · ${formatMediaBytes(draft.sizeBytes)}</small>
                    <button type="button" class="rp-upload-remove" data-rp-upload-remove="${escapeHtml(draft.id)}" aria-label="${escapeHtml(rpText('Remove', 'Убрать'))}: ${escapeHtml(draft.filename)}" ${busy ? 'disabled' : ''}>${icon.close}</button>
                </article>`).join('');
                dropzone.querySelector('.upload-dropzone-copy strong').textContent = drafts.length
                    ? rpText('Add more photos', 'Добавить ещё фотографии') : rpText('Choose photos', 'Выбрать фотографии');
                confirm.disabled = busy || !drafts.length;
            };
            const read = async files =>
            {
                if (busy || !files.length) return;
                busy = true;
                input.disabled = true;
                form.setAttribute('aria-busy', 'true');
                modalBackdrop.beforeClose = () => !busy;
                errors.hidden = true;
                errors.replaceChildren();
                try
                {
                    for (const file of files)
                    {
                        try
                        {
                            const draft = await createPhotoUploadDraft(file, { idPrefix: config.uploadDraftIdPrefix || 'rp-photo-draft' });
                            if (!photoUploadDraftIsValid(draft)) throw new Error(rpText('Invalid photo.', 'Недопустимая фотография.'));
                            drafts.push(draft);
                        }
                        catch (error)
                        {
                            errors.hidden = false;
                            const row = document.createElement('p');
                            row.textContent = `${file.name}: ${error.message}`;
                            errors.append(row);
                        }
                    }
                }
                finally
                {
                    busy = false;
                    input.disabled = false;
                    input.value = '';
                    form.setAttribute('aria-busy', 'false');
                    render();
                }
            };
            input.addEventListener('change', () => read([...input.files]));
            dropzone.addEventListener('dragover', event => event.preventDefault());
            dropzone.addEventListener('drop', event =>
            {
                event.preventDefault();
                read([...event.dataTransfer.files]);
            });
            tiles.addEventListener('click', event =>
            {
                const button = event.target.closest('[data-rp-upload-remove]');
                if (!button || busy) return;
                const index = drafts.findIndex(draft => draft.id === button.dataset.rpUploadRemove);
                if (index >= 0) drafts.splice(index, 1);
                render();
            });
            confirm.addEventListener('click', () =>
            {
                if (busy || !drafts.length) return;
                const ids = [];
                for (const draft of drafts)
                {
                    const photo = createMediaFromPhotoUpload({ projectId: config.projectId, draft, personIds: [], idPrefix: config.uploadedPhotoIdPrefix || 'rp-photo' });
                    if (photo) ids.push(photo.id);
                }
                if (ids.length) session.selectCreated(ids);
                closeModal();
            });
            form.addEventListener('submit', event => event.preventDefault());
            render();
        }, { title, primaryLabel: 'Done' });
    }

    function rpOpenPhotoResourcePicker(config = {})
    {
        const projectId = config.projectId || currentProjectId();
        if (!projectId) return null;
        const records = () => getProjectPhotos(projectId).filter(photo => !photo.deleted);
        const adapter = {
            kind: 'photos', projectId,
            title: config.title || 'Add photos',
            subtitle: config.targetLabel || config.subtitle || config.description || '',
            existingIds: rpMediaValidIds(config.existingPhotoIds || config.initiallyLinkedPhotoIds, records()),
            partialIds: rpMediaValidIds(config.partialIds || config.partialPhotoIds, records()),
            mode: config.mode || 'manage',
            records,
            name: photo => photo.title || photo.filename || rpText('Untitled photo', 'Без названия'),
            searchText: photo => [photo.title, photo.filename, photo.caption, photo.placeText, formatPhotoDate(photo), ...getPhotoPeople(photo).map(personResourceDisplayName)].join(' '),
            scopes: () => [
                { id: 'all', label: rpText('All photos', 'Все фотографии') },
                { id: 'unfiled', label: rpText('Unfiled', 'Без альбома') },
                ...getProjectAlbums(projectId).map(album => ({ id: `album:${album.id}`, label: album.title || album.name || rpText('Untitled album', 'Без названия') }))
            ],
            matchesScope: (photo, scopeId) => scopeId === 'all' || (scopeId === 'unfiled' ? !(photo.albumIds || []).some(id => getProjectAlbums(projectId).some(album => album.id === id)) : (photo.albumIds || []).includes(scopeId.slice(6))),
            filters: () => [rpMediaFavoriteFilter(),
                { key: 'person', label: rpText('Person', 'Человек'), type: 'select', options: [
                    { value: '', label: rpText('All people', 'Все люди') },
                    ...(sampleData.people || []).filter(person => person.projectId === projectId && !person.deleted)
                        .map(person => ({ value: person.id, label: personResourceDisplayName(person) }))
                        .sort((a, b) => a.label.localeCompare(b.label, state.language === 'ru' ? 'ru' : 'en', { numeric: true }))
                ] },
                { key: 'dateFrom', label: rpText('Date from', 'Дата с'), type: 'date' },
                { key: 'dateTo', label: rpText('Date to', 'Дата по'), type: 'date' }
            ],
            matchesFilters: (photo, values) => (!values.favorite || Boolean(photo.favorite))
                && (!values.person || getPhotoPeople(photo).some(person => person.id === values.person))
                && rpPhotoMatchesDates(photo, values),
            dateValue: photo => photoDateModel(photo).sortDate || '',
            describe: photo => ({ title: adapter.name(photo), description: photo.caption || '', meta: '', imageHtml: rpMediaThumbnail(photo.src, adapter.name(photo)) }),
            preview: photo => rpMediaPreview(rpMediaThumbnail(photo.src, adapter.name(photo)), adapter.name(photo), formatPhotoDate(photo) || '')
                + (photo.caption ? `<p>${escapeHtml(photo.caption)}</p>` : ''),
            bindPreview: rpBindMediaPreview,
            validate: session => typeof config.validate === 'function' ? config.validate(session) : true,
            create: session => rpCreatePhotoUpload(session, { ...config, projectId }),
            commit: async (ids, context) =>
            {
                const valid = new Set(records().map(photo => photo.id));
                if ((context.changes?.addedIds || ids).some(id => !valid.has(id))) return { ok: false, message: rpText('A photo is no longer available.', 'Фотография больше недоступна.') };
                if (typeof config.onSave !== 'function') return false;
                const result = await config.onSave(ids, context);
                if (result?.cancelled) return result;
                return rpMediaSaved(result) ? result : { ok: false, message: rpText('Photos could not be linked.', 'Не удалось связать фотографии.') };
            },
            afterCommit: (ids, result, session) => rpMediaAfterCommit(config, ids, result, session),
            successMessage: config.successMessage
        };
        return openResourcePicker(adapter, config);
    }

    function rpOpenPhotoPicker(options = {})
    {
        const person = options.personId ? getPerson(options.personId) : null;
        if (options.personId && !person) return null;
        const projectId = options.projectId || person?.projectId || currentProjectId();
        if (person && person.projectId !== projectId) return null;
        const existing = options.existingPhotoIds || (person ? getPhotosForPerson(person.id).map(photo => photo.id) : []);
        return rpOpenPhotoResourcePicker({
            ...options, projectId, existingPhotoIds: existing,
            subtitle: options.subtitle || options.subjectLabel || (person ? personResourceDisplayName(person) : ''),
            validate: session =>
            {
                if (person && getPerson(person.id)?.projectId !== projectId) return rpText('Person is no longer available.', 'Человек больше недоступен.');
                return options.validate?.(session) ?? true;
            },
            onSave: async (ids, context) =>
            {
                if (!person)
                {
                    if (typeof options.onSave !== 'function') return false;
                    const result = await options.onSave(ids, context);
                    return result === undefined ? true : result;
                }
                const current = getPerson(person.id);
                const decisions = context.changes.decisions;
                const photos = decisions.map(({ id }) => getPhoto(id, { projectId }));
                if (!current || current.projectId !== projectId || photos.some(photo => !photo || photo.deleted)) return false;
                if (decisions.some(({ id, linked }) => !linked && current.primaryPhotoId === id))
                {
                    const accepted = await new Promise(resolve => openPhotoUnlinkConfirm({
                        photo: getPhoto(current.primaryPhotoId, { projectId }),
                        contextLabel: personResourceDisplayName(current), primaryPhoto: true,
                        modalOpener: openNestedModal,
                        onConfirm: () => resolve(true), onCancel: () => resolve(false)
                    }));
                    if (!accepted) return { ok: false, cancelled: true };
                }
                if (getPerson(current.id) !== current || photos.some(photo => getPhoto(photo.id, { projectId }) !== photo || photo.deleted)) return false;
                // Validate the complete batch before any association changes.
                const snapshots = photos.map(photo => ({ photo, personIds: photo.personIds, personRegions: photo.personRegions, updatedAt: photo.updatedAt }));
                const primaryPhotoId = current.primaryPhotoId;
                const primaryPhotoCrop = current.primaryPhotoCrop;
                const updatedAt = current.updatedAt;
                const meta = current.meta ? { ...current.meta } : current.meta;
                try
                {
                    decisions.forEach(({ id, linked }, index) =>
                    {
                        const photo = photos[index];
                        if (linked) ensurePhotoPersonTag(photo, current);
                        else setPhotoPersonIds(id, (photo.personIds || []).filter(personId => personId !== current.id), { rerender: false });
                    });
                    markPersonUpdated(current);
                    return true;
                }
                catch (error)
                {
                    snapshots.forEach(snapshot => Object.assign(snapshot.photo, { personIds: snapshot.personIds, personRegions: snapshot.personRegions, updatedAt: snapshot.updatedAt }));
                    current.primaryPhotoId = primaryPhotoId;
                    current.primaryPhotoCrop = primaryPhotoCrop;
                    current.updatedAt = updatedAt;
                    current.meta = meta;
                    throw error;
                }
            },
            afterSave: (ids, result, session) =>
            {
                if (person) renderAfterPersonConnectedResourcesChanged();
                options.afterSave?.(ids, result, session);
            }
        });
    }

    function rpOpenPersonPhotoPicker(personId)
    {
        return rpOpenPhotoPicker({ personId });
    }

    function rpOpenDraftPhotoPicker(options = {})
    {
        return rpOpenPhotoPicker({ ...options, modalOpener: options.modalOpener || openNestedModal });
    }

    function rpOpenPhotoLinkPicker(options = {})
    {
        return rpOpenPhotoResourcePicker(options);
    }

    function rpFilePreview(file)
    {
        const meta = [connectedFileMeta(file), archiveFormatDate(file.date || file.addedAt, '')].filter(Boolean).join(' · ');
        const preview = renderArchivePreview(file);
        if (preview) return rpMediaPreview(rpMediaThumbnail(archiveImageSource(file), file.name || file.title || ''), file.name || file.title || '', meta);
        return `<section class="archive-document-modal rp-media-preview" data-rp-document-preview>
            <header class="rp-media-preview-header"><div class="rp-media-preview-identity"><h3>${escapeHtml(file.name || file.title || file.filename || rpText('Untitled file', 'Без названия'))}</h3>
            <p>${escapeHtml(meta)}</p></div>
            <div class="archive-document-tools rp-media-preview-tools" data-document-tools hidden></div></header>
            <div class="archive-document-body" data-document-body style="height:360px;max-height:50vh;overflow:auto" aria-live="polite"><p>${escapeHtml(rpText('Loading document...', 'Загрузка документа...'))}</p></div>
            <button type="button" class="button secondary" data-document-download>${icon.download || ''}<span>${escapeHtml(rpText('Download', 'Скачать'))}</span></button>
        </section>`;
    }

    async function rpBindFilePreview(root, file)
    {
        if (root.querySelector('[data-rp-media-stage]'))
        {
            rpBindMediaPreview(root);
            return;
        }
        const modal = root.querySelector('[data-rp-document-preview]');
        const host = modal?.querySelector('[data-document-body]');
        if (!host) return;
        const download = modal.querySelector('[data-document-download]');
        download.disabled = true;
        try
        {
            const blob = await archiveDocumentBlob(file);
            if (!modal.isConnected) return;
            download.disabled = false;
            download.addEventListener('click', () => archiveDocumentDownload(file, blob));
            const extension = archiveDocumentExtension(file.name || file.filename);
            host.replaceChildren();
            if (extension === 'txt')
            {
                const text = await blob.text();
                if (!modal.isConnected) return;
                const pre = document.createElement('pre');
                pre.className = 'archive-document-text';
                pre.textContent = text;
                host.append(pre);
            }
            else if (extension === 'csv')
            {
                const text = await blob.text();
                if (!modal.isConnected) return;
                archiveDocumentRenderCsv(text, host);
            }
            else if (extension === 'docx')
            {
                if (!window.mammoth || !window.DOMPurify) throw new Error(rpText('Document viewer unavailable.', 'Просмотр документов недоступен.'));
                const converted = await mammoth.convertToHtml({ arrayBuffer: await blob.arrayBuffer() }, { externalFileAccess: false });
                if (!modal.isConnected) return;
                const article = document.createElement('article');
                article.className = 'archive-document-article';
                article.innerHTML = DOMPurify.sanitize(converted.value, { USE_PROFILES: { html: true }, FORBID_TAGS: ['iframe', 'object', 'embed', 'form'], FORBID_ATTR: ['href', 'target'] });
                host.append(article);
            }
            else if (extension === 'pdf')
            {
                await archiveDocumentRenderPdf(blob, host, modal);
            }
            else
            {
                host.textContent = file.description || rpText('Preview is not available for this file type. Download the original file.', 'Предпросмотр недоступен. Скачайте оригинал файла.');
            }
        }
        catch (error)
        {
            if (modal.isConnected) host.textContent = `${rpText('This document could not be opened:', 'Не удалось открыть документ:')} ${error.message}`;
        }
    }

    function rpOpenFilePicker(options = {})
    {
        const projectId = options.projectId || currentProjectId();
        if (!projectId) return null;
        const records = () => connectedFilesForProject(projectId);
        const folders = () => (sampleData.archiveFolders || []).filter(folder => folder.projectId === projectId && !folder.deleted);
        const folderScope = (file, scopeId, session) =>
        {
            if (scopeId === 'all') return true;
            const target = scopeId === 'unfiled' ? null : scopeId.slice(7);
            let folderId = archiveFileFolderId(file);
            if (!String(session.query || '').trim() || target === null) return folderId === target;
            const visited = new Set();
            while (folderId && !visited.has(folderId))
            {
                if (folderId === target) return true;
                visited.add(folderId);
                folderId = archiveFolderParentId(folders().find(folder => folder.id === folderId) || {});
            }
            return false;
        };
        const adapter = {
            kind: 'files', projectId,
            title: options.title || 'Add files',
            subtitle: options.targetLabel || options.subtitle || '',
            mode: options.mode || 'manage',
            existingIds: rpMediaValidIds(options.existingFileIds, records()),
            partialIds: rpMediaValidIds(options.partialIds || options.partialFileIds, records()),
            records,
            name: file => file.title || file.name || file.filename || rpText('Untitled file', 'Без названия'),
            searchText: file => [file.title, file.name, file.filename, file.description, file.notes, archiveFileTypeLabel(file)].join(' '),
            scopes: () => [
                { id: 'all', label: rpText('All files', 'Все файлы') },
                { id: 'unfiled', label: rpText('Unfiled', 'Без папки') },
                ...folders().map(folder => ({ id: `folder:${folder.id}`, label: translateText(folder.name || folder.title || ''), parentId: archiveFolderParentId(folder) ? `folder:${archiveFolderParentId(folder)}` : 'all' }))
            ],
            matchesScope: folderScope,
            filters: () => [rpMediaFavoriteFilter(), { key: 'type', label: rpText('File type', 'Тип файла'), type: 'select', options: [{ value: '', label: rpText('All types', 'Все типы') }, ...[...new Set(records().map(archiveFileKind))].map(value => ({ value, label: archiveFileTypeLabel(records().find(file => archiveFileKind(file) === value)) }))] }],
            matchesFilters: (file, values) => (!values.favorite || Boolean(file.favorite)) && (!values.type || archiveFileKind(file) === values.type),
            describe: (file, session) => ({ title: adapter.name(file), description: file.description || '',
                meta: [connectedFileMeta(file), (session.scopeId === 'all' || session.query.trim()) && archiveFileFolderId(file) ? archiveFolderPath(archiveFileFolderId(file)) : ''].filter(Boolean).join(' · '), icon: archiveFileIcon(file) }),
            preview: rpFilePreview,
            bindPreview: rpBindFilePreview,
            validate: session => options.validate?.(session) ?? true,
            create: session => session.openEditor(modalOpener =>
            {
                openArchiveDocumentImport({
                    projectId,
                    folderId: session.scopeId.startsWith('folder:') ? session.scopeId.slice(7) : null,
                    modalOpener,
                    onImported: ids =>
                    {
                        session.selectCreated(ids);
                        return { ok: true };
                    }
                });
            }, { primaryLabel: 'Done' }),
            commit: async (ids, context) =>
            {
                const valid = new Set(records().map(file => file.id));
                if ((context.changes?.addedIds || ids).some(id => !valid.has(id)) || typeof options.onSave !== 'function') return false;
                const result = await options.onSave(ids, context);
                return rpMediaSaved(result) ? result : { ok: false, message: rpText('File connections could not be saved.', 'Не удалось сохранить связи файлов.') };
            },
            afterCommit: (ids, result, session) => rpMediaAfterCommit(options, ids, result, session),
            successMessage: options.successMessage
        };
        return openResourcePicker(adapter, options);
    }
