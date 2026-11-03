let archiveDragItem = null;
let archiveDragExpandTimer = null;

function archiveBindDragAutoscroll(scroller)
{
    if (!scroller) return;
    scroller.addEventListener('dragover', event => {
        if (!archiveDragItem) return;
        const bounds = scroller.getBoundingClientRect();
        if (event.clientY < bounds.top + 36) scroller.scrollTop -= 16;
        else if (event.clientY > bounds.bottom - 36) scroller.scrollTop += 16;
    });
}

function archiveClearDragExpandTimer()
{
    clearTimeout(archiveDragExpandTimer);
    archiveDragExpandTimer = null;
}

function archiveCanDropInto(folderId)
{
    return Boolean(archiveDragItem) && archiveCanMoveBulkItems(
        archiveEffectiveBulkItems(archiveDragItem.folderIds, archiveDragItem.fileIds), folderId);
}

function archiveMoveDraggedItems(folderId)
{
    if (!archiveCanDropInto(folderId)) return;
    const items = archiveEffectiveBulkItems(archiveDragItem.folderIds, archiveDragItem.fileIds);
    archiveDragItem = null;
    archiveMoveBulkItems(items, folderId);
}

function archiveBindDropTarget(element, folderId)
{
    if (!element) return;
    element.addEventListener('dragover', event => {
        if (!archiveDragItem) return;
        event.preventDefault();
        const valid = archiveCanDropInto(folderId);
        event.dataTransfer.dropEffect = valid ? 'move' : 'none';
        element.classList.toggle('archive-drop-target', valid);
        element.classList.toggle('archive-drop-invalid', !valid);
        if (valid && element.matches('[data-archive-folder]')
            && !state.archiveExpandedFolders[folderId]
            && archiveFolderChildren(folderId).length && !archiveDragExpandTimer)
        {
            archiveDragExpandTimer = setTimeout(() => {
                archiveDragExpandTimer = null;
                if (!archiveDragItem) return;
                state.archiveExpandedFolders[folderId] = true;
                renderArchiveSidebar();
            }, 650);
        }
    });
    element.addEventListener('dragleave', event => {
        if (!element.contains(event.relatedTarget))
        {
            element.classList.remove('archive-drop-target', 'archive-drop-invalid');
            archiveClearDragExpandTimer();
        }
    });
    element.addEventListener('drop', event => {
        if (!archiveDragItem) return;
        event.preventDefault();
        event.stopPropagation();
        archiveClearDragExpandTimer();
        element.classList.remove('archive-drop-target', 'archive-drop-invalid');
        archiveMoveDraggedItems(folderId);
    });
}

let archiveRegionResizeObserver = null;
let archiveToolbarResizeObserver = null;

function fitArchiveToolbar(root)
{
    archiveToolbarResizeObserver?.disconnect();
    const toolbar = root.querySelector('.archive-files-toolbar');
    if (!toolbar) return;

    // Measure translated controls, rather than guessing their width from breakpoints.
    const update = () =>
    {
        if (!toolbar.isConnected) return;
        const available = toolbar.getBoundingClientRect().width;
        const focusedControl = toolbar.contains(document.activeElement) ? document.activeElement : null;
        const expanded = toolbar.classList.contains('mobile-search-open');
        toolbar.classList.remove('mobile-search-open');
        const gap = parseFloat(getComputedStyle(toolbar).columnGap) || 8;
        const widths = [];
        const group = toolbar.querySelector('.archive-toolbar-main');
        const search = toolbar.querySelector('.archive-toolbar-left');
        const groupStyle = group.getAttribute('style');
        const searchStyle = search.getAttribute('style');
        group.style.cssText = 'display:flex;flex:none;width:max-content;min-width:0;flex-wrap:nowrap;';
        for (let density = 0; density <= 4; density++)
        {
            toolbar.dataset.density = density;
            search.style.cssText = `flex:none;width:${density ? 44 : 160}px;min-width:${density ? 44 : 160}px;`;
            const controls = ['#archiveFilterButton', '.app-sort-field', '.archive-layout-switch', '.archive-toolbar-create'];
            widths.push(Math.ceil((density ? 44 : 160) + gap * 4 + controls.reduce((sum, selector) =>
                sum + toolbar.querySelector(selector).getBoundingClientRect().width, 0)));
        }
        if (groupStyle === null) group.removeAttribute('style'); else group.setAttribute('style', groupStyle);
        if (searchStyle === null) search.removeAttribute('style'); else search.setAttribute('style', searchStyle);
        toolbar.classList.toggle('mobile-search-open', expanded);
        const density = widths.findIndex(width => width <= available);
        toolbar.dataset.density = String(density < 0 ? 4 : density);
        toolbar.dataset.fitWidths = widths.join(',');
        if (focusedControl?.getClientRects().length) focusedControl.focus({ preventScroll: true });
        else if (focusedControl?.matches('[data-archive-search], [data-archive-mobile-search-open]'))
        {
            const fallback = toolbar.querySelector(density === 0 ? '[data-archive-search]' : '[data-archive-mobile-search-open]');
            fallback?.focus({ preventScroll: true });
        }
    };
    update();
    archiveToolbarResizeObserver = new ResizeObserver(update);
    archiveToolbarResizeObserver.observe(toolbar);
    archiveToolbarResizeObserver.observe(toolbar.querySelector('.archive-toolbar-create'));
    archiveToolbarResizeObserver.observe(toolbar.querySelector('.app-sort-field'));
    document.fonts?.ready.then(update);
}

function bindArchiveControls(root = main.querySelector('.archive-shell'))
{
    if (!root) return;
    fitArchiveToolbar(root);
    root.querySelector('.archive-compact-path')?.addEventListener('keydown', event => {
        if (event.key !== 'Escape') return;
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.open = false;
        event.currentTarget.querySelector('summary')?.focus({ preventScroll: true });
    });
    root.addEventListener('click', event => {
        root.querySelectorAll('.archive-compact-path[open]').forEach(path => {
            if (!path.contains(event.target)) path.open = false;
        });
    });
    archiveRegionResizeObserver?.disconnect();
    const previewImage = root.querySelector('.archive-file-preview > .archive-file-preview-image');
    const updateImageSummary = () =>
    {
        if (!previewImage?.naturalWidth || !previewImage?.naturalHeight) return;
        const summary = root.querySelector('[data-archive-image-summary]');
        if (!summary) return;
        summary.textContent = [`${previewImage.naturalWidth} × ${previewImage.naturalHeight}`, summary.dataset.size].filter(Boolean).join(' · ');
        summary.title = summary.textContent;
    };
    previewImage?.addEventListener('load', updateImageSummary);
    updateImageSummary();
    const regionBoxes = [...root.querySelectorAll('.archive-file-preview > [data-archive-region-box]')];
    const regionPreview = regionBoxes[0]?.closest('.archive-file-preview');
    const regionImage = regionPreview?.querySelector(':scope > .archive-file-preview-image');
    const floatingPreview = regionPreview?.querySelector('[data-archive-person-floating]');
    const floatingImage = floatingPreview?.querySelector('.archive-file-preview-image');
    const floatingHighlight = floatingPreview?.querySelector('[data-archive-floating-region-highlight]');
    let activeRegionPersonId = null;
    const clearPersonRegion = () => {
        activeRegionPersonId = null;
        if (archiveImagesActive()) archiveImageHighlight(null);
        regionBoxes.forEach(box => box.classList.remove('is-active'));
        archiveUpdateRegionVisibility();
        if (floatingHighlight) floatingHighlight.hidden = true;
        if (floatingPreview) floatingPreview.hidden = true;
    };
    const positionPersonRegion = (highlight, preview, image, region) => {
        if (!highlight || !image?.naturalWidth || !image?.naturalHeight) return false;
        const imageBounds = image.getBoundingClientRect();
        const previewBounds = preview.getBoundingClientRect();
        const scale = Math.min(imageBounds.width / image.naturalWidth,
            imageBounds.height / image.naturalHeight);
        const imageWidth = image.naturalWidth * scale;
        const imageHeight = image.naturalHeight * scale;
        Object.assign(highlight.style, {
            left: `${imageBounds.left - previewBounds.left + (imageBounds.width - imageWidth) / 2 + region.x * imageWidth}px`,
            top: `${imageBounds.top - previewBounds.top + (imageBounds.height - imageHeight) / 2 + region.y * imageHeight}px`,
            width: `${region.width * imageWidth}px`,
            height: `${region.height * imageHeight}px`
        });
        highlight.hidden = false;
        return true;
    };
    const showPersonRegion = personId => {
        activeRegionPersonId = personId;
        if (archiveImagesActive())
        {
            archiveImageHighlight(personId);
            return;
        }
        const file = archiveFileById(state.archiveSelectedFileId);
        const region = normalizeFaceRegion(file?.personRegions?.[personId]);
        if (!region || !regionPreview)
        {
            clearPersonRegion();
            return;
        }
        regionBoxes.forEach(box => box.classList.toggle('is-active', box.dataset.archiveRegionBox === personId));
        archiveUpdateRegionVisibility();
        const inspector = regionPreview.closest('.archive-inspector');
        const scroll = inspector?.querySelector('.archive-inspector-scroll');
        const previewBounds = regionPreview.getBoundingClientRect();
        const scrollBounds = scroll?.getBoundingClientRect();
        const useFloating = Boolean(floatingPreview && scrollBounds
            && previewBounds.bottom < scrollBounds.top + 80);
        if (useFloating)
        {
            const inspectorBounds = inspector.getBoundingClientRect();
            Object.assign(floatingPreview.style, {
                left: `${inspectorBounds.left + 16}px`,
                top: `${scrollBounds.top + 12}px`,
                width: `${inspectorBounds.width - 32}px`
            });
            floatingPreview.hidden = false;
            positionPersonRegion(floatingHighlight, floatingPreview, floatingImage, region);
        }
        else
        {
            floatingPreview.hidden = true;
        }
    };
    const positionAllRegions = () => {
        const file = archiveFileById(state.archiveSelectedFileId);
        regionBoxes.forEach(box => {
            const region = normalizeFaceRegion(file?.personRegions?.[box.dataset.archiveRegionBox]);
            if (region && positionPersonRegion(box, regionPreview, regionImage, region)) box.dataset.archiveRegionReady = 'true';
        });
        archiveUpdateRegionVisibility();
        if (activeRegionPersonId) showPersonRegion(activeRegionPersonId);
    };
    regionImage?.addEventListener('load', positionAllRegions);
    if (regionImage?.complete) positionAllRegions();
    if (regionPreview) {
        archiveRegionResizeObserver = new ResizeObserver(positionAllRegions);
        archiveRegionResizeObserver.observe(regionPreview);
    }
    floatingImage?.addEventListener('load', () => {
        if (activeRegionPersonId) showPersonRegion(activeRegionPersonId);
    });
    root.querySelectorAll('[data-archive-person-region]').forEach(row => {
        const personId = row.dataset.archivePersonRegion;
        row.addEventListener('pointerenter', () => showPersonRegion(personId));
        row.addEventListener('pointerleave', clearPersonRegion);
        row.addEventListener('focusin', () => showPersonRegion(personId));
        row.addEventListener('focusout', event => {
            if (!row.contains(event.relatedTarget)) clearPersonRegion();
        });
    });
    if (innerWidth > 900 && state.archiveView !== 'sources')
    {
        archiveBindDragAutoscroll(root.querySelector('.archive-main'));
        root.querySelectorAll('[data-archive-file-row], [data-archive-folder-row]').forEach(row => {
            row.draggable = true;
            row.addEventListener('dragstart', event => {
                if (event.target.closest('button,input,select,a')) { event.preventDefault(); return; }
                const fileId = row.dataset.archiveFileRow;
                const folderId = row.dataset.archiveFolderRow;
                const inSelection = fileId ? state.archiveSelectedFileIds.includes(fileId)
                    : (state.archiveSelectedFolderIds || []).includes(folderId);
                archiveDragItem = inSelection
                    ? { fileIds: state.archiveSelectedFileIds.slice(), folderIds: (state.archiveSelectedFolderIds || []).slice() }
                    : { fileIds: fileId ? [fileId] : [], folderIds: folderId ? [folderId] : [] };
                event.dataTransfer.effectAllowed = 'move';
                event.dataTransfer.setData('text/plain', 'Geneograph Archive item');
                row.classList.add('archive-is-dragging');
            });
            row.addEventListener('dragend', () => {
                archiveDragItem = null;
                archiveClearDragExpandTimer();
                document.querySelectorAll('.archive-drop-target, .archive-drop-invalid, .archive-is-dragging')
                    .forEach(item => item.classList.remove('archive-drop-target', 'archive-drop-invalid', 'archive-is-dragging'));
            });
        });
        root.querySelectorAll('[data-archive-folder-row]').forEach(row =>
            archiveBindDropTarget(row, row.dataset.archiveFolderRow));
        root.querySelectorAll('[data-archive-breadcrumb]').forEach(button =>
            archiveBindDropTarget(button, button.dataset.archiveBreadcrumb));
        archiveBindDropTarget(root.querySelector('[data-archive-breadcrumb-root]'), null);
    }
    root.querySelectorAll('.archive-tile-art img').forEach(image => image.addEventListener('error', () => image.remove()));
    root.querySelectorAll('[data-archive-file-layout]').forEach(button => button.addEventListener('click', () => {
        runAfterArchiveFileEditGuard(() => {
            resetArchiveFolderRowClick();
            state.archiveFileLayout = button.dataset.archiveFileLayout;
            renderArchiveMain();
            main.querySelector(`[data-archive-file-layout="${state.archiveFileLayout}"]`)?.focus({ preventScroll: true });
            if (state.archiveFileLayout !== 'images' && state.archiveSelectedFileId)
                main.querySelector(`[data-archive-file-row="${CSS.escape(state.archiveSelectedFileId)}"]`)?.scrollIntoView({ block: 'nearest' });
        });
    }));
    root.querySelector('[data-archive-layout-select]')?.addEventListener('change', event => {
        const layout = event.currentTarget.value;
        event.currentTarget.value = state.archiveFileLayout;
        runAfterArchiveFileEditGuard(() => {
            resetArchiveFolderRowClick();
            state.archiveFileLayout = layout;
            renderArchiveMain();
            main.querySelector('[data-archive-layout-select]')?.focus({ preventScroll: true });
            if (layout !== 'images' && state.archiveSelectedFileId)
                main.querySelector(`[data-archive-file-row="${CSS.escape(state.archiveSelectedFileId)}"]`)?.scrollIntoView({ block: 'nearest' });
        });
    });
    root.querySelectorAll('[data-archive-column-sort]').forEach(button => button.addEventListener('click', () => {
        const field = button.dataset.archiveColumnSort;
        state.archiveFileSortDirection = state.archiveFileSort === field && state.archiveFileSortDirection === 'ascending'
            ? 'descending' : 'ascending';
        state.archiveFileSort = field;
        renderArchiveMain();
        main.querySelector(`[data-archive-column-sort="${field}"]`)?.focus({ preventScroll: true });
    }));
    root.querySelector('[data-archive-mobile-add-menu]')?.addEventListener('click', event =>
        openArchiveMobileChoiceMenu(event.currentTarget, 'add'));
    root.querySelector('[data-archive-mobile-bulk-actions]')?.addEventListener('click', event =>
        openArchiveMobileChoiceMenu(event.currentTarget, 'bulk'));
    root.querySelector('[data-archive-selection-more]')?.addEventListener('click', event =>
        openArchiveMobileChoiceMenu(event.currentTarget, 'bulk-desktop'));
    root.querySelectorAll('[data-archive-mobile-select]').forEach(button => button.addEventListener('click', () => {
        archiveMobileSelectMode = !archiveMobileSelectMode;
        if (!archiveMobileSelectMode) {
            state.archiveSelectedFileIds = [];
            state.archiveSelectedFolderIds = [];
        }
        renderArchiveMain();
    }));
    root.querySelectorAll('[data-archive-mobile-folder]').forEach(button => button.addEventListener('click', () => {
        if (archiveMobileSelectMode) toggleArchiveFolderSelection(button.dataset.archiveMobileFolder);
        else archiveOpenFolder(button.dataset.archiveMobileFolder);
    }));
    root.querySelectorAll('[data-archive-mobile-file]').forEach(button => button.addEventListener('click', () => {
        const id = button.dataset.archiveMobileFile;
        if (archiveMobileSelectMode)
        {
            toggleArchiveFileSelection(id);
            return;
        }
        runAfterArchiveFileEditGuard(() => {
            state.archiveSelectedFolderItemId = null;
            state.archiveSelectedFileId = id;
            state.archiveInspectorCollapsed = false;
            renderArchiveMain();
            if (innerWidth <= 900)
            {
                main.querySelector(`[data-archive-mobile-file="${CSS.escape(id)}"]`)?.focus({ preventScroll: true });
                openMobileSurface('details');
            }
        });
    }));
    root.querySelectorAll('.archive-mobile-file').forEach(row => {
        let timer;
        let start;
        let suppressClick;
        row.addEventListener('pointerdown', event => {
            if (event.pointerType !== 'touch' || event.target.closest('.archive-mobile-item-more, input')) return;
            start = { x: event.clientX, y: event.clientY };
            timer = setTimeout(() => {
                const holdPoint = start;
                archiveMobileSelectMode = true;
                row.querySelector('[data-archive-mobile-file]')?.click();
                start = null;
                suppressClick = click => {
                    if (Math.hypot(click.clientX - holdPoint.x, click.clientY - holdPoint.y) > 18) return;
                    click.preventDefault();
                    click.stopImmediatePropagation();
                    document.removeEventListener('click', suppressClick, true);
                };
                document.addEventListener('click', suppressClick, true);
                setTimeout(() => document.removeEventListener('click', suppressClick, true), 250);
            }, 500);
        });
        row.addEventListener('pointermove', event => {
            if (start && Math.hypot(event.clientX - start.x, event.clientY - start.y) > 8) clearTimeout(timer);
        });
        for (const name of ['pointerup', 'pointercancel']) row.addEventListener(name, () => clearTimeout(timer));
    });
    root
        .querySelectorAll('[data-source-connected-view-all]')
        .forEach(button =>
        {
            button.onclick = event =>
            {
                event.preventDefault();
                event.stopPropagation();

                openSourceConnectedItems(
                    button.dataset.sourceConnectedOwner,
                    button.dataset.sourceConnectedViewAll
                );
            };
        });
    bindConnectedNotesFooters(root);
    bindConnectedFileLinks(
        root,
        {
            onUnlinked:
            ({
                contextType
            }) =>
            {
                if (
                    contextType
                !== 'source'
                )
                {
                    return;
                }

                renderArchivePreservingSourceInspectorScroll();
            }
        }
    );

    bindConnectedSourceLinks(
        root,
        {
            onUnlinked:
            ({
                targetType,
                targetId
            }) =>
            {
                if (
                    targetType !== 'file'
                || targetId
                  !== state.archiveSelectedFileId
                )
                {
                    renderArchive();
                    return;
                }

                renderArchivePreservingFileInspectorScroll();
            }
        }
    );

    bindGenealogyDateFields(
        root
    );

    bindPlaceComboboxes(
        root
    );
    root
        .querySelector(
            '[data-archive-inspector-rename-folder]'
        )
        ?.addEventListener(
            'click',
            event =>
            {
                const folderId =
                    event.currentTarget
                        .dataset
                        .archiveInspectorRenameFolder;

                if (!folderId)
                {
                    return;
                }

                openArchiveRenameItemModal(
                    'folder',
                    folderId
                );
            }
        );
    root
        .querySelector(
            '[data-archive-inspector-move]'
        )
        ?.addEventListener(
            'click',
            event =>
            {
                const button =
                    event.currentTarget;

                const type =
                    button.dataset
                        .archiveInspectorMove;

                const id =
                    button.dataset
                        .archiveInspectorMoveId;

                if (
                    !type
            || !id
                )
                {
                    return;
                }

                if (
                    type === 'file'
                )
                {
                    openArchiveMoveModal({
                        fileIds: [
                            id
                        ]
                    });

                    return;
                }

                if (
                    type === 'folder'
                )
                {
                    openArchiveMoveModal({
                        folderId:
                id
                    });
                }
            }
        );

    root
        .querySelector(
            '#archiveEditFile'
        )
        ?.addEventListener(
            'click',
            () => runAfterArchiveFileEditGuard(beginArchiveFileEdit)
        );
    root.querySelector('#archiveRenameFile')?.addEventListener('click', () =>
        runAfterArchiveFileEditGuard(() => beginArchiveFileRename(state.archiveSelectedFileId)));
    root.querySelector('#archiveSaveFileName')?.addEventListener('click', saveArchiveFileRename);
    root.querySelector('#archiveCancelFileName')?.addEventListener('click', () =>
        runAfterArchiveFileEditGuard(() =>
        {
            renderArchiveMain();
            requestAnimationFrame(() => main.querySelector('#archiveRenameFile')?.focus({ preventScroll: true }));
        }));
    root.querySelector('#archiveFileNameInput')?.addEventListener('keydown', event =>
    {
        if (event.key === 'Enter') { event.preventDefault(); saveArchiveFileRename(); }
        if (event.key === 'Escape') { event.preventDefault(); root.querySelector('#archiveCancelFileName')?.click(); }
    });
    root
        .querySelector(
            '#archiveCancelFileEdit'
        )
        ?.addEventListener(
            'click',
            cancelArchiveFileEdit
        );

    root
        .querySelector(
            '#archiveSaveFileEdit'
        )
        ?.addEventListener(
            'click',
            saveArchiveFileEdit
        );
    root.querySelector('[data-archive-add-file-place]')?.addEventListener('click', event =>
        openArchiveFilePlacesModal(event.currentTarget.dataset.archiveAddFilePlace));
    root.querySelector('[data-archive-resolve-file-place]')?.addEventListener('click', event =>
    {
        const file = archiveFileById(event.currentTarget.dataset.archiveResolveFilePlace);
        if (file) openArchiveFilePlacesModal(file.id, file.documentPlaceText || '', true);
    });
    root.querySelector('[data-archive-edit-source-details]')?.addEventListener('click', event =>
        beginArchiveSourceDetailEdit(event.currentTarget.dataset.archiveEditSourceDetails));
    root.querySelector('#archiveCancelSourceDetailEdit')?.addEventListener('click', cancelArchiveSourceDetailEdit);
    root.querySelector('#archiveSaveSourceDetailEdit')?.addEventListener('click', saveArchiveSourceDetailEdit);
    root.querySelector('.archive-source-details-form')?.addEventListener('input', () =>
    {
        state.archiveSourceEditDraft = collectArchiveSourceDetailDraft(root);
    });
    root.querySelector('.archive-source-details-form')?.addEventListener('change', () =>
    {
        state.archiveSourceEditDraft = collectArchiveSourceDetailDraft(root);
    });
    root
        .querySelectorAll(
            '[data-archive-section-toggle]'
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
                            .archiveSectionToggle;

                    const open =
                        !archiveInspectorSectionIsOpen(
                            sectionId
                        );

                    state.archiveInspectorSections[
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
                        '[data-archive-section-toggle]'
                    ).forEach(toggle =>
                        toggle.setAttribute(
                            'aria-expanded',
                            String(open)
                        )
                    );

                    if (body)
                    {
                        body.hidden =
                            !open;
                    }
                }
            );
        });
    root
        .querySelector(
            '[data-archive-add-file-person]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                openArchiveFilePeopleModal(
                    state.archiveSelectedFileId
                );
            }
        );
    root
        .querySelector(
            '[data-archive-add-file-event]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                openArchiveFileEventsModal(
                    state.archiveSelectedFileId
                );
            }
        );

    root
        .querySelector(
            '[data-archive-add-file-note]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                openArchiveFileNoteModal(
                    state.archiveSelectedFileId
                );
            }
        );

    root
        .querySelector(
            '[data-archive-add-file-source]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                const fileId =
                    state.archiveSelectedFileId;

                if (!fileId)
                {
                    return;
                }

                openArchiveFilesSourceModal([
                    fileId
                ]);
            }
        );
    root.querySelector('[data-archive-search]')?.addEventListener('input', event =>
    {
        const value = event.currentTarget.value;
        const selectionStart = event.currentTarget.selectionStart;
        event.currentTarget.value = state.archiveSearch || '';
        runAfterArchiveFileEditGuard(() => {
            state.archiveSearch = value;
            renderArchiveMain();
            requestAnimationFrame(() =>
            {
                const input = main.querySelector('[data-archive-search]');
                if (!input) return;
                input.focus({ preventScroll: true });
                const position = Math.min(selectionStart ?? value.length, input.value.length);
                input.setSelectionRange(position, position);
            });
        });
    });
    root.querySelector('[data-archive-mobile-search-open]')?.addEventListener('click', () =>
    {
        archiveMobileSearchOpen = true;
        renderArchiveMain();
        main.querySelector('[data-archive-search]')?.focus({ preventScroll: true });
    });
    const closeExpandedArchiveSearch = () =>
    {
        archiveMobileSearchOpen = false;
        renderArchiveMain();
        const trigger = main.querySelector('[data-archive-mobile-search-open]');
        const target = trigger?.getClientRects().length ? trigger : main.querySelector('[data-archive-search]');
        target?.focus({ preventScroll: true });
    };
    root.querySelector('[data-archive-mobile-search-close]')?.addEventListener('click', closeExpandedArchiveSearch);
    root.querySelector('[data-archive-search]')?.addEventListener('keydown', event =>
    {
        if (event.key !== 'Escape' || !archiveMobileSearchOpen) return;
        event.preventDefault();
        event.stopPropagation();
        closeExpandedArchiveSearch();
    });
    const sortingSources =
        archiveToolbarIsSources();

    bindAppSortControl(root, {
        id: 'archiveSort',

        options:
          sortingSources
              ? APP_SORT_OPTIONS
                  .archiveSources
              : APP_SORT_OPTIONS
                  .archiveFiles,

        getField: () =>
            sortingSources
                ? state.archiveSourceSort
                : state.archiveFileSort,

        getDirection: () =>
            sortingSources
                ? state
                    .archiveSourceSortDirection
                : state
                    .archiveFileSortDirection,

        onChange: ({
            field,
            direction
        }) =>
        {
            runAfterArchiveFileEditGuard(() => {
            if (sortingSources)
            {
                state.archiveSourceSort =
                    field;

                state
                    .archiveSourceSortDirection =
                        direction;
            }
            else
            {
                state.archiveFileSort =
                    field;

                state
                    .archiveFileSortDirection =
                        direction;
            }

            renderArchiveMain();
            });
        }
    });
    root.querySelector('#archiveFilterButton') ?.addEventListener('click', event =>
    {
        const anchor = event.currentTarget;
        runAfterArchiveFileEditGuard(() => openArchiveFilterPopover(anchor));
    });
    root
        .querySelectorAll(
            '[data-archive-filter-presentation]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    const presentation =
                        button.dataset
                            .archiveFilterPresentation;

                    if (
                        presentation !== 'flat'
                && presentation !== 'folders'
                    )
                    {
                        return;
                    }

                    runAfterArchiveFileEditGuard(() => {
                    state.archiveFilterPresentation =
                        presentation;

                    if (
                        presentation === 'folders'
                    )
                    {
                        const filters =
                            archiveEffectiveFileFilters();

                        state.archiveSelectedFolderId =
                            filters.scope === 'folder'
                                ? archiveNormalizeFolderId(
                                    state
                                        .archiveFilterScopeFolderId
                                )
                                : null;
                    }

                    state.archiveSelectedFolderItemId =
                        null;

                    state.archiveSelectedFileId =
                        null;

                    state.archiveSelectedFileIds =
                        [];

                    renderArchive();
                    });
                }
            );
        });
    root.querySelectorAll('[data-archive-remove-filter]').forEach(button =>
    {
        button.addEventListener('click', () =>
        {
            runAfterArchiveFileEditGuard(() => removeArchiveToolbarFilter(button.dataset.archiveRemoveFilter));
        });
    });
    root
        .querySelector(
            '#archiveClearFilters'
        )
        ?.addEventListener(
            'click',
            () => runAfterArchiveFileEditGuard(clearArchiveToolbarFilters)
        );
    root.querySelectorAll('[data-archive-nav-back]').forEach(button =>
        button.addEventListener('click', archiveNavigateBack));

    root
        .querySelector(
            '[data-archive-nav-forward]'
        )
        ?.addEventListener(
            'click',
            archiveNavigateForward
        );

    root
        .querySelector(
            '[data-archive-nav-up]'
        )
        ?.addEventListener(
            'click',
            archiveNavigateUp
        );
    root
        .querySelectorAll(
            '[data-archive-add-files]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                openArchiveAddFilesModal
            );
        });
    const emptyFileDropzone =
        root.querySelector(
            '[data-archive-empty-add-files]'
        );

    emptyFileDropzone
        ?.addEventListener(
            'click',
            openArchiveAddFilesModal
        );
    if (
        emptyFileDropzone
    )
    {
        emptyFileDropzone
            .addEventListener(
                'dragenter',
                event =>
                {
                    event.preventDefault();

                    emptyFileDropzone
                        .classList
                        .add(
                            'is-drag-over'
                        );
                }
            );

        emptyFileDropzone
            .addEventListener(
                'dragover',
                event =>
                {
                    event.preventDefault();

                    emptyFileDropzone
                        .classList
                        .add(
                            'is-drag-over'
                        );
                }
            );

        emptyFileDropzone
            .addEventListener(
                'dragleave',
                event =>
                {
                    if (
                        emptyFileDropzone
                            .contains(
                                event.relatedTarget
                            )
                    )
                    {
                        return;
                    }

                    emptyFileDropzone
                        .classList
                        .remove(
                            'is-drag-over'
                        );
                }
            );

        emptyFileDropzone
            .addEventListener(
                'drop',
                event =>
                {
                    event.preventDefault();

                    emptyFileDropzone
                        .classList
                        .remove(
                            'is-drag-over'
                        );

                    openArchiveAddFilesModal();
                }
            );
    }
    root
        .querySelectorAll(
            '[data-archive-create-folder]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    openArchiveCreateFolderFromTrigger(
                        button
                    );
                }
            );
        });
    root.querySelectorAll('[data-archive-add-source]').forEach(button => button.addEventListener('click', () => openArchiveSourceModal()));
    root
        .querySelectorAll(
            '[data-archive-breadcrumb-root]'
        )
        .forEach(button => button.addEventListener(
            'click',
            () =>
            {
                archiveNavigateToLocation({
                    folderId:
                null,

                    search:
                '',

                    searchScope:
                'folder',

                    personFilterId:
                '',

                    selectedFileId:
                null,

                    inspectorCollapsed:
                false
                });
            }
        ));

    root
        .querySelectorAll(
            '[data-archive-breadcrumb]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    archiveNavigateToLocation({
                        folderId:
                  button.dataset
                      .archiveBreadcrumb,

                        search:
                  '',

                        searchScope:
                  'folder',

                        personFilterId:
                  '',

                        selectedFileId:
                  null,

                        inspectorCollapsed:
                  false
                    });
                }
            );
        });
    root
        .querySelectorAll(
            '[data-archive-file-row]'
        )
        .forEach(row =>
        {
            const open =
                () =>
                {
                    runAfterArchiveFileEditGuard(
                        () =>
                        {
                            state.archiveSelectedFolderItemId =
                                null;
                            state.archiveSelectedFileId =
                                row.dataset
                                    .archiveFileRow;
                            state.archiveInspectorCollapsed =
                                false;

                            renderArchiveMain();
                        }
                    );
                };

            row.addEventListener(
                'click',
                event =>
                {
                    if (
                        !event.target.closest(
                            'button,input,select,a'
                        )
                    )
                    {
                        if (innerWidth > 900)
                        {
                            if (!event.shiftKey && !event.ctrlKey && !event.metaKey
                                && archiveFileRowWasDoubleClick(row.dataset.archiveFileRow))
                                openArchiveDocumentViewer(row.dataset.archiveFileRow);
                            else runAfterArchiveFileEditGuard(() =>
                                archiveSelectDesktopItem(root, 'file', row.dataset.archiveFileRow, event));
                        }
                        else open();
                    }
                }
            );

            row.addEventListener(
                'keydown',
                event =>
                {
                    if (
                        event.key === 'Enter'
                    )
                    {
                        event.preventDefault();
                        open();
                    }
                    else if (innerWidth > 900 && (event.key === ' ' || event.key === 'Spacebar'))
                    {
                        event.preventDefault();
                        open();
                    }
                }
            );
        });
    root
        .querySelectorAll(
            '[data-archive-folder-row]'
        )
        .forEach(row =>
        {
            const folderId =
                row.dataset
                    .archiveFolderRow;
            let holdTimer = null;
            let holdOrigin = null;
            let held = false;
            const cancelHold = () => { clearTimeout(holdTimer); holdTimer = null; };
            const showFolderDetails = () =>
            {
                selectArchiveFolderItem(folderId);
                if (state.archiveSelectedFolderItemId === folderId) openMobileSurface('details');
            };

            row.addEventListener('pointerdown', event =>
            {
                if (innerWidth > 900 || event.pointerType !== 'touch'
                    || event.target.closest('button,input,select,a')) return;
                holdOrigin = { x: event.clientX, y: event.clientY };
                held = false;
                cancelHold();
                holdTimer = setTimeout(() =>
                {
                    held = true;
                    showFolderDetails();
                }, 450);
            });
            row.addEventListener('pointermove', event =>
            {
                if (holdOrigin && Math.hypot(event.clientX - holdOrigin.x,
                    event.clientY - holdOrigin.y) > 8) cancelHold();
            });
            row.addEventListener('pointerup', cancelHold);
            row.addEventListener('pointercancel', cancelHold);
            row.addEventListener('contextmenu', event =>
            {
                if (innerWidth <= 900 && held) event.preventDefault();
            });

            row.addEventListener(
                'click',
                event =>
                {
                    if (held)
                    {
                        held = false;
                        event.preventDefault();
                        return;
                    }
                    if (
                        event.target.closest(
                            'button,input,select,a'
                        )
                    )
                    {
                        return;
                    }

                    if (innerWidth <= 900)
                    {
                        archiveOpenFolder(folderId);
                        return;
                    }

                    /*
                First click:
                select and inspect.

                Second quick click on the same folder:
                open the folder.
              */
                    if (!event.shiftKey && !event.ctrlKey && !event.metaKey &&
                        archiveFolderRowWasDoubleClick(
                            folderId
                        )
                    )
                    {
                        resetArchiveFolderRowClick();

                        archiveOpenFolder(
                            folderId
                        );

                        return;
                    }

                    runAfterArchiveFileEditGuard(() =>
                        archiveSelectDesktopItem(root, 'folder', folderId, event));
                }
            );

            row.addEventListener(
                'keydown',
                event =>
                {
                    if (
                        event.key === 'Enter'
                    )
                    {
                        event.preventDefault();

                        resetArchiveFolderRowClick();

                        archiveOpenFolder(
                            folderId
                        );

                        return;
                    }

                    if (
                        event.key === ' '
                || event.key
                  === 'Spacebar'
                    )
                    {
                        event.preventDefault();

                        resetArchiveFolderRowClick();

                        if (innerWidth <= 900) showFolderDetails();
                        else showFolderDetails();
                    }
                }
            );
        });
    root.querySelectorAll('[data-archive-file-row], [data-archive-folder-row]').forEach(row =>
    {
        row.addEventListener('contextmenu', event =>
        {
            if (innerWidth <= 900 || event.target.closest('button,input,select,a,[contenteditable="true"]')) return;
            event.preventDefault();
            const type = row.dataset.archiveFolderRow ? 'folder' : 'file';
            const id = row.dataset.archiveFolderRow || row.dataset.archiveFileRow;
            const inSelection = type === 'folder'
                ? (state.archiveSelectedFolderIds || []).includes(id)
                : state.archiveSelectedFileIds.includes(id);
            if (!inSelection)
            {
                archiveSelectDesktopItem(root, type, id,
                    { shiftKey: false, ctrlKey: false, metaKey: false });
            }
            const anchor = main.querySelector(`[data-archive-${type}-row="${CSS.escape(id)}"]`);
            if (!anchor) return;
            const count = (state.archiveSelectedFolderIds || []).length + state.archiveSelectedFileIds.length;
            const point = { x: event.clientX, y: event.clientY };
            if (inSelection && count > 1)
                openArchiveMobileChoiceMenu(anchor, 'bulk-context', point);
            else
                openArchiveItemActionsPopover(type, id, anchor, point);
        });
    });
    root.querySelectorAll('[data-archive-mobile-open-folder]').forEach(button => button.addEventListener('click', event =>
    {
        event.stopPropagation();
        archiveOpenFolder(button.dataset.archiveMobileOpenFolder);
    }));
    root.querySelectorAll('[data-archive-source-row]').forEach(row =>
    {
        const open = () =>
        {
            runAfterArchiveSourceDetailEditGuard(() =>
            {
                state.archiveSelectedSourceId = row.dataset.archiveSourceRow;
                state.archiveInspectorCollapsed = false;
                renderArchiveMain();
            });
        };
        row.addEventListener('click', event =>
        {
            if (!event.target.closest('button,input,select,a')) open();
        });
        row.addEventListener('keydown', event =>
        {
            if (event.key === 'Enter')
            {
                event.preventDefault(); open();
            }
        });
    });
    root
        .querySelectorAll(
            '[data-archive-file-checkbox]'
        )
        .forEach(input =>
        {
            /*
            Prevent checkbox interaction from also
            activating the table row.
          */
            input.addEventListener(
                'click',
                event =>
                {
                    event.stopPropagation();
                }
            );

            input.addEventListener(
                'change',
                () =>
                {
                    toggleArchiveFileSelection(
                        input.dataset
                            .archiveFileCheckbox
                    );
                }
            );
        });
    root.querySelectorAll('[data-archive-folder-checkbox]').forEach(input => {
        input.addEventListener('click', event => event.stopPropagation());
        input.addEventListener('change', () => toggleArchiveFolderSelection(input.dataset.archiveFolderCheckbox));
    });
    const visibleSelection =
        archiveVisibleSelectionState();

    root.querySelectorAll('[data-archive-select-all]').forEach(selectVisibleCheckbox => {
        selectVisibleCheckbox.checked =
            visibleSelection
                .allVisibleSelected;

        selectVisibleCheckbox.indeterminate =
            visibleSelection
                .someVisibleSelected
          && !visibleSelection
              .allVisibleSelected;

        selectVisibleCheckbox.disabled =
            visibleSelection
                .visibleIds
                .length === 0;

        selectVisibleCheckbox
            .addEventListener(
                'click',
                event =>
                {
                    event.stopPropagation();

                    toggleAllVisibleArchiveFiles();
                }
            );
    });
    root.querySelectorAll('[data-archive-toggle-favorite]').forEach(button => button.addEventListener('click', event =>
    {
        event.stopPropagation();
        const file = archiveFileById(button.dataset.archiveToggleFavorite);
        if (file)
        {
            file.favorite = !file.favorite; renderArchive();
        }
    }));
    root.querySelectorAll('[data-archive-toggle-folder-favorite]').forEach(button => button.addEventListener('click', event => {
        event.stopPropagation();
        const folder = archiveFolderById(button.dataset.archiveToggleFolderFavorite);
        if (folder) { folder.favorite = !folder.favorite; renderArchive(); }
    }));
    root.querySelectorAll('[data-archive-source-favorite]').forEach(button => button.addEventListener('click', event =>
    {
        event.stopPropagation();
        const source = archiveSourceById(button.dataset.archiveSourceFavorite);
        if (source)
        {
            source.favorite = !source.favorite; renderArchive();
        }
    }));
    root
        .querySelectorAll(
            '[data-archive-row-actions]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                event =>
                {
                    event.stopPropagation();

                    openArchiveItemActionsPopover(
                        button.dataset
                            .archiveRowActions,

                        button.dataset
                            .archiveRowId,

                        button
                    );
                }
            );
        });
    root.querySelectorAll('[data-archive-selection-action]').forEach(button => button.addEventListener('click', () =>
    {
        const ids = state.archiveSelectedFileIds.slice();
        const folderIds = (state.archiveSelectedFolderIds || []).slice();
        if (button.dataset.archiveSelectionAction === 'clear')
        {
            state.archiveSelectedFileIds = [];
            state.archiveSelectedFolderIds = [];
            renderArchiveMain();
        }
        if (button.dataset.archiveSelectionAction === 'move') {
            if (folderIds.length) openArchiveBulkMoveModal(folderIds, ids);
            else openArchiveMoveModal({ fileIds: ids });
        }
        if (button.dataset.archiveSelectionAction === 'links' && !folderIds.length) openArchiveAddLinksMenu(ids);
        if (button.dataset.archiveSelectionAction === 'favorite')
        {
            const records = [...ids.map(id => archiveFileById(id)),
                ...folderIds.map(id => archiveFolderById(id))].filter(Boolean);
            const allFavorite = records.every(record => record.favorite);
            ids.forEach(id =>
            {
                const file = archiveFileById(id); if (file) file.favorite = !allFavorite;
            });
            folderIds.forEach(id => {
                const folder = archiveFolderById(id); if (folder) folder.favorite = !allFavorite;
            });
            state.archiveSelectedFileIds = [];
            state.archiveSelectedFolderIds = [];
            renderArchive();
        }
        if (button.dataset.archiveSelectionAction === 'delete') {
            if (folderIds.length) openArchiveBulkDeleteConfirm(folderIds, ids);
            else openArchiveDeleteFileConfirm(ids);
        }
    }));
    root
        .querySelectorAll(
            '[data-archive-inspector-collapse]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    const collapsed =
                        button.dataset
                            .archiveInspectorCollapse
                === 'true';

                    runAfterArchiveFileEditGuard(
                        () =>
                        {
                            state.archiveInspectorCollapsed =
                                collapsed;

                            renderArchiveMain();
                        }
                    );
                }
            );
        });
    root.querySelectorAll('[data-archive-open-file]').forEach(button => button.addEventListener('click', () => openArchiveDocumentViewer(button.dataset.archiveOpenFile)));
    root.querySelectorAll('[data-archive-delete-source]').forEach(button => button.addEventListener('click', () => openArchiveDeleteSourceConfirm(button.dataset.archiveDeleteSource)));
    root.querySelectorAll('[data-archive-edit-source]').forEach(button => button.addEventListener('click', () => openArchiveSourceModal(button.dataset.archiveEditSource)));
    root
        .querySelectorAll(
            '[data-archive-add-connection]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    const ownerType =
                        button.dataset
                            .archiveOwnerType;

                    const ownerId =
                        button.dataset
                            .archiveOwnerId;

                    const entityType =
                        button.dataset
                            .archiveAddConnection;

                    /*
                Sources use the specialized shared
                relationship modals for People and Files.
              */
                    if (
                        ownerType === 'source'
                    )
                    {
                        if (
                            entityType === 'photo'
                        )
                        {
                            openArchiveSourcePhotosModal(
                                ownerId
                            );

                            return;
                        }
                        if (
                            entityType === 'person'
                        )
                        {
                            openArchiveSourcePeopleModal(
                                ownerId
                            );

                            return;
                        }

                        if (
                            entityType === 'event'
                        )
                        {
                            openArchiveSourceEventsModal(
                                ownerId
                            );

                            return;
                        }

                        if (
                            entityType === 'note'
                        )
                        {
                            openArchiveSourceNotesModal(
                                ownerId
                            );

                            return;
                        }

                        if (
                            entityType === 'place'
                        )
                        {
                            openArchiveSourcePlacesModal(
                                ownerId
                            );

                            return;
                        }

                        if (
                            entityType === 'file'
                        )
                        {
                            openArchiveSourceFilesModal(
                                ownerId
                            );

                            return;
                        }
                    }

                    openArchiveConnectionPicker({
                        ownerType,

                        ownerIds: [
                            ownerId
                        ],

                        entityType
                    });
                }
            );
        });
    root.querySelectorAll('[data-archive-unlink-id]').forEach(button => button.addEventListener('click', () => openArchiveUnlinkConfirm({ ownerType: button.dataset.archiveUnlinkOwnerType, ownerId: button.dataset.archiveUnlinkOwnerId, entityType: button.dataset.archiveUnlinkType, entityId: button.dataset.archiveUnlinkId })));
    root.querySelectorAll('[data-archive-open-connection]').forEach(button => button.addEventListener('click', () => openArchiveConnectedRecord(button.dataset.archiveOpenConnection, button.dataset.archiveConnectionId)));
    root.addEventListener(
        'keydown',
        event =>
        {
            if (
                !archiveIsLocationView(
                    state.archiveView
                )
            )
            {
                return;
            }

            if (
                !event.altKey
            || event.ctrlKey
            || event.metaKey
            || event.shiftKey
            )
            {
                return;
            }

            if (
                event.target.closest(
                    `
                input,
                textarea,
                select,
                [contenteditable="true"]
              `
                )
            )
            {
                return;
            }

            if (
                event.key === 'ArrowUp'
            && archiveNavigationCanGoUp()
            )
            {
                event.preventDefault();
                archiveNavigateUp();
            }
        }
    );
    lockArchiveWorkspaceDuringFileEdit(
        root
    );
    bindToasts(root);
}

function lockArchiveWorkspaceDuringFileEdit(
    root
)
{
    if (
        !archiveFileEditIsActive()
    )
    {
        return;
    }

    root
        .querySelectorAll(`
          .archive-main
          button,

          .archive-main
          input,

          .archive-main
          select
        `)
        .forEach(control =>
        {
            control.disabled =
                true;

            control.setAttribute(
                'aria-disabled',
                'true'
            );
        });
}

function openArchiveCreateSourceModal(prefill = '')
{
    openArchiveSourceModal();
    if (prefill)
    {
        requestAnimationFrame(() =>
        {
            const input = modalBackdrop.querySelector('[data-archive-source-title]');
            if (input && !input.value) input.value = `${prefill} source`;
        });
    }
}

function openArchiveAssignSourceModal()
{
    const ids = state.archiveSelectedFileIds.length ? state.archiveSelectedFileIds : [state.archiveSelectedFileId].filter(Boolean);
    openArchiveConnectionPicker({ ownerType: 'file', ownerIds: ids, entityType: 'source' });
}

function openArchiveLinkPersonModal()
{
    const ids = state.archiveSelectedFileIds.length ? state.archiveSelectedFileIds : [state.archiveSelectedFileId].filter(Boolean);
    openArchiveConnectionPicker({ ownerType: 'file', ownerIds: ids, entityType: 'person' });
}

