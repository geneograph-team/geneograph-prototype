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

