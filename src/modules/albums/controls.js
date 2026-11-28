
function navigateAlbumsView(view, albumId)
{
    if (typeof appPerf === 'undefined' || !appPerf.enabled('Albums')) return navigateAlbumsViewWithDiagnosticsBody(view, albumId);
    return appPerf.run('Albums', 'navigation', () => navigateAlbumsViewWithDiagnosticsBody(view, albumId));
}

function navigateAlbumsViewWithDiagnosticsBody(view, albumId = null)
{
    if (!['all', 'favorites', 'unassigned', 'albums', 'album'].includes(view)) return;

    runAfterAlbumsPhotoEditGuard(() =>
    {
        if (view === 'album' && !getProjectAlbums().some(album => album.id === albumId))
        {
            return;
        }
        appNavigationMarkIntent();
        state.albumsView = view;
        state.activeAlbumId = view === 'album' ? albumId : null;
        state.selectedPhotoIds = [];
        resetAlbumsPage();
        renderAlbums();
    });
}

function openAlbumSidebarMenu(albumId, anchor)
{
    closeMenu();
    const menu = document.createElement('div');
    menu.className = 'menu-popover app-action-menu'; menu.id = 'projectMenu';
    menu.innerHTML = `<button type="button" data-album-action="open">Open album</button><button type="button" data-album-action="edit">Edit album</button><button class="danger" type="button" data-album-action="delete">Delete album</button>`;
    document.body.appendChild(menu);
    positionAnchoredActionMenu(menu, anchor);
    menu.addEventListener('click', event =>
    {
        const action = event.target.closest('[data-album-action]')?.dataset.albumAction; if (!action) return; anchor.focus({ preventScroll: true }); closeMenu();
        if (action === 'open')
        {
            navigateAlbumsView('album', albumId);
            return;
        }
        state.albumsView = 'album';
        state.activeAlbumId = albumId;
        if (action === 'edit') openEditAlbumModal();
        else if (action === 'delete') openDeleteAlbumConfirm(albumId);
    });
    bindMenuLifecycle(anchor);
}

function bindAlbumsSidebar()
{
    sidebar.querySelectorAll('[data-albums-view]').forEach(button =>
    {
        button.addEventListener('click', () =>
            navigateAlbumsView(button.dataset.albumsView)
        );
    });

    sidebar.querySelectorAll('[data-album-open]').forEach(button =>
    {
        button.addEventListener('click', () =>
            navigateAlbumsView('album', button.dataset.albumOpen)
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
            if (card.albumsCardBound) return;
            card.albumsCardBound = true;
            if (card.classList.contains('albums-list-row')) card.addEventListener('focusin', () =>
                albumsPreviewRuntime.prioritize(card.querySelector('[data-albums-preview-host]')));
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

                        albumsAction('selection', () => renderAlbumsPreserveViewport({
                            focusPhotoId: mobile ? '' : photoId,
                            focusTarget: 'card', reuseGrid: true, interaction: 'selection'
                        }));

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
            if (control.albumsCardBound) return;
            control.albumsCardBound = true;
            const toggleSelection = () =>
            {
                runAfterAlbumsPhotoEditGuard(() =>
                {
                    albumsAction('multiSelection', () => togglePhotoSelection(control.dataset.photoCheck));
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
            if (button.albumsCardBound) return;
            button.albumsCardBound = true;
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
            if (button.albumsCardBound) return;
            button.albumsCardBound = true;
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
    const pageSizeSelect = main.querySelector('#albumsRowsPerPage');
    if (pageSizeSelect) bindPageSizeControl(pageSizeSelect, main);

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

                    albumsAction('page', () =>
                    {
                        state.albumsPage = nextPage;
                        renderAlbums();
                    });
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
                albumsAction('pageSize', () =>
                {
                    state.albumsRowsPerPage = normalizeAlbumsRowsPerPage(event.currentTarget.value);
                    resetAlbumsPage();
                    renderAlbums();
                });
            }
        );
}

function bindAlbumsControls(photos)
{
    bindToasts(main);
    if (state.albumsView === 'albums')
    {
        const browserSearch = main.querySelector('#albumsBrowserSearch');
        browserSearch?.addEventListener('input', () =>
        {
            state.albumsBrowserSearch = browserSearch.value;
            const query = browserSearch.value.trim().toLocaleLowerCase();
            let visibleCount = 0;
            main.querySelectorAll('[data-albums-browser-name]').forEach(item =>
            {
                const matches = item.dataset.albumsBrowserName
                    .toLocaleLowerCase().includes(query);
                item.hidden = !matches;
                if (matches) visibleCount += 1;
            });
            const empty = main.querySelector('[data-albums-browser-no-matches]');
            if (empty) empty.hidden = visibleCount > 0;
        });

        main.querySelectorAll('[data-albums-browser-open]').forEach(button =>
        {
            button.addEventListener('click', () =>
                navigateAlbumsView('album', button.dataset.albumsBrowserOpen)
            );
        });
        main.querySelectorAll('#albumsBrowserNew, #albumsBrowserEmptyNew')
            .forEach(button => button.addEventListener('click', () =>
                runAfterAlbumsPhotoEditGuard(openNewAlbumModal)
            ));
        return;
    }

    bindConnectedNotesFooters(main);
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
                albumsAction('search', () =>
                {
                    resetAlbumsPage();
                    renderAlbums();
                });
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

                albumsAction('sort', () =>
                {
                    resetAlbumsPage();
                    renderAlbums();
                });
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
                        albumsAction('layoutSwitch', () =>
                        {
                            state.albumsViewMode = button.dataset.albumsMode;
                            renderAlbums();
                        });
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

    syncAlbumsListSelectionHeader(main, photos, true);
    bindAlbumsDetailControls(main.querySelector('.albums-detail'));
    bindAlbumsSelectionChrome(main);
}

function syncAlbumsListSelectionHeader(root, photos, bind = false)
{
    const selectVisibleCheckbox = root.querySelector('[data-albums-select-visible]');

    if (selectVisibleCheckbox)
    {
        const visibleSelection = albumsVisibleSelectionState(currentAlbumsPagePhotos(photos));
        selectVisibleCheckbox.checked = visibleSelection.allVisibleSelected;
        selectVisibleCheckbox.indeterminate = visibleSelection.someVisibleSelected
          && !visibleSelection.allVisibleSelected;
        selectVisibleCheckbox.disabled = visibleSelection.visibleIds.length === 0;
        if (bind) selectVisibleCheckbox.addEventListener('click', event =>
        {
            event.stopPropagation();
            toggleAllVisibleAlbumPhotos();
        });
    }
}

function bindAlbumsDetailControls(root)
{
    if (!root) return;
    root
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

    root
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

    const detailPreview = root.querySelector('.albums-detail-preview-button');
    const faceHighlight = detailPreview?.querySelector('[data-albums-face-highlight]');
    const floatingPreview = root.querySelector('[data-albums-face-floating]');
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
        const pane = root;
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
        const image = preview.querySelector('.albums-detail-preview');
        if (!region || !image || !photo?.width || !photo?.height)
        {
            clearFaceHighlight();
            return;
        }
        faceHighlight.hidden = useFloating;
        const bounds = preview.getBoundingClientRect();
        const mountedImage = image.querySelector('.thumb-img');
        const imageWidth = mountedImage?.naturalWidth || photo.width;
        const imageHeight = mountedImage?.naturalHeight || photo.height;
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
    root.querySelectorAll('[data-albums-person-region]').forEach(row =>
    {
        row.addEventListener('pointerenter', () => highlightPerson(row.dataset.albumsPersonRegion));
        row.addEventListener('pointerleave', clearFaceHighlight);
        row.addEventListener('focusin', () => highlightPerson(row.dataset.albumsPersonRegion));
        row.addEventListener('focusout', event =>
        {
            if (!row.contains(event.relatedTarget)) clearFaceHighlight();
        });
    });

    root
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

    root.querySelectorAll('[data-photo-album-open]').forEach(button =>
    {
        button.addEventListener('click', () =>
            navigateAlbumsView('album', button.dataset.photoAlbumOpen)
        );
    });

    root
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

    root
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
                        state.albumsDetailCollapsed = false;
                        albumsAction('inspector', () => renderAlbumsPreserveViewport({ interaction: 'inspector' }));
                        return;
                    }

                    runAfterAlbumsPhotoEditGuard(
                        () =>
                        {
                            state.albumsDetailCollapsed = true;
                            albumsAction('inspector', () => renderAlbumsPreserveViewport({ interaction: 'inspector' }));
                        }
                    );
                }
            );
        });

    root
        .querySelectorAll(
            '[data-albums-section-toggle]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                event => albumsAction('inspector', () =>
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
                })
            );
        });

    root
        .querySelector('#albumsEditPhoto')
        ?.addEventListener(
            'click',
            () => runAfterAlbumsPhotoEditGuard(() => albumsAction('edit', beginAlbumsPhotoEdit))
        );
    root.querySelector('#albumsRenamePhoto')?.addEventListener('click', () =>
        runAfterAlbumsPhotoEditGuard(beginAlbumsPhotoRename));
    root.querySelector('#albumsSavePhotoName')?.addEventListener('click', saveAlbumsPhotoRename);
    root.querySelector('#albumsCancelPhotoName')?.addEventListener('click', () =>
        runAfterAlbumsPhotoEditGuard(() =>
        {
            renderAlbums();
            requestAnimationFrame(() => root.querySelector('#albumsRenamePhoto')?.focus({ preventScroll: true }));
        }));
    root.querySelector('#albumsPhotoNameInput')?.addEventListener('keydown', event =>
    {
        if (event.key === 'Enter') { event.preventDefault(); saveAlbumsPhotoRename(); }
        if (event.key === 'Escape') { event.preventDefault(); root.querySelector('#albumsCancelPhotoName')?.click(); }
    });

    root
        .querySelector(
            '#albumsCancelPhotoEdit'
        )
        ?.addEventListener(
            'click',
            cancelAlbumsPhotoEdit
        );

    root
        .querySelector(
            '#albumsSavePhotoEdit'
        )
        ?.addEventListener(
            'click',
            saveAlbumsPhotoEdit
        );

    root
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

    root
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

    root
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

    root
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

    root
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
        root.querySelector(
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
}

function bindAlbumsSelectionChrome(root)
{
    root.querySelectorAll('[data-albums-breadcrumb]').forEach(button =>
    {
        button.addEventListener('click', () =>
            navigateAlbumsView(button.dataset.albumsBreadcrumb)
        );
    });
    root
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

    root
        .querySelector(
            '#albumsCancelSelection'
        )
        ?.addEventListener(
            'click',
            () => clearAlbumSelection()
        );

    root
        .querySelector('#albumsSelectAll')
        ?.addEventListener(
            'click',
            () => toggleAllVisibleAlbumPhotos()
        );

    root
        .querySelector(
            '#albumsAddSelectedToAlbum'
        )
        ?.addEventListener(
            'click',
            openAddToAlbumModal
        );

    root
        .querySelector(
            '#albumsRemoveFromCurrent'
        )
        ?.addEventListener(
            'click',
            removeSelectedFromCurrentAlbum
        );
}
