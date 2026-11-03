function openCentralNoteInEditor(
    noteId
)
{
    openCentralNoteFromContext(
        noteId
    );
}

function openNoteLinkedEntity(
    type,
    id
)
{
    const note =
        selectedNote();

    if (!note)
    {
        return;
    }

    const record =
        noteEntityById(
            type,
            id,
            note.projectId
        );

    if (!record)
    {
        return;
    }

    openNoteEntity(
        type,
        record
    );
}

function bindNotesSidebarControls(
    root
)
{
    root
        .querySelector(
            '#notesAddCollection'
        )
        ?.addEventListener(
            'click',
            openNewCollectionModal
        );

    root
        .querySelectorAll(
            '[data-notes-view]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    clearNotesContext();

                    state.notesView =
                        button.dataset.notesView;

                    state.notesActiveCollectionId =
                        null;

                    state.selectedNoteId =
                        null;

                    state.notesRightCollapsed =
                        true;

                    state.notesMobilePane =
                        'browser';

                    renderNotes();
                }
            );
        });

    root
        .querySelectorAll(
            '[data-notes-collection]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    clearNotesContext();

                    state.notesView =
                        'collection';

                    state.notesActiveCollectionId =
                        button.dataset
                            .notesCollection;

                    state.selectedNoteId =
                        null;

                    state.notesRightCollapsed =
                        true;

                    state.notesMobilePane =
                        'browser';

                    renderNotes();
                }
            );
        });

    root
        .querySelectorAll(
            '[data-notes-collection-menu]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                event =>
                {
                    event.stopPropagation();

                    openNotesCollectionMenu(
                        button.dataset
                            .notesCollectionMenu,
                        button
                    );
                }
            );
        });

    root
        .querySelector(
            '[data-notes-tip]'
        )
        ?.addEventListener(
            'click',
            () =>
                showToast(
                    'Notes can link directly to people, places, events, photos, sources and files.'
                )
        );
}

function touchNote(
    note,
    {
        refreshPreview = true
    } = {}
)
{
    if (!note)
    {
        return null;
    }

    note.updatedAt =
        new Date().toISOString();

    setNotesSaveStatus(
        'Saving'
    );

    if (refreshPreview)
    {
        refreshNoteBrowserRow(
            note
        );
    }

    clearTimeout(
        touchNote.savedTimer
    );

    touchNote.savedTimer =
        setTimeout(
            () =>
                setNotesSaveStatus(
                    'Saved'
                ),
            450
        );

    return note;
}


function setNotesSaveStatus(
    status
)
{
    state.notesSaveStatus =
        status;

    const element =
        main.querySelector(
            '#notesSaveStatus'
        );

    if (!element)
    {
        return;
    }

    element.textContent =
        status;

    element.classList.toggle(
        'saving',
        status === 'Saving'
    );

    element.classList.toggle(
        'error',
        status === 'Error'
    );
}

function autoSizeNoteBody(
    textarea
)
{
    if (!textarea)
    {
        return;
    }

    textarea.style.height =
        'auto';

    const minimumHeight =
        Number.parseFloat(
            getComputedStyle(
                textarea
            ).minHeight
        ) || 160;

    textarea.style.height =
        `${Math.max(
            minimumHeight,
            textarea.scrollHeight
        )}px`;
}

function refreshNoteBrowserRow(
    note
)
{
    const row =
        main.querySelector(
            `[data-note-id="${
                CSS.escape(note.id)
            }"]`
        );

    if (!row)
    {
        return;
    }

    const title =
        row.querySelector(
            '.notes-row-title'
        );

    const excerpt =
        row.querySelector(
            '.notes-row-excerpt'
        );

    const collections =
        row.querySelector(
            '.notes-row-collections'
        );

    const metadata =
        row.querySelector(
            '.notes-row-metadata'
        );

    const favorite =
        row.querySelector(
            '[data-note-favorite]'
        );

    const menu =
        row.querySelector(
            '[data-note-menu]'
        );

    if (title)
    {
        title.textContent =
            note.title;

        title.title =
            note.title;
    }

    if (excerpt)
    {
        excerpt.textContent =
            noteExcerpt(
                note,
                180
            )
          || 'No note content';
    }

    if (collections)
    {
        collections.innerHTML =
            renderNoteBrowserCollectionChips(
                note
            );
    }

    if (metadata)
    {
        const value =
            noteBrowserMetadata(
                note
            );

        metadata.textContent =
            value;

        metadata.title =
            value;
    }

    if (favorite)
    {
        favorite.classList.toggle(
            'active',
            note.favorite
        );

        favorite.setAttribute(
            'aria-pressed',
            String(note.favorite)
        );

        favorite.setAttribute(
            'aria-label',
            note.favorite
                ? `Remove ${note.title} from favourites`
                : `Add ${note.title} to favourites`
        );
    }

    if (menu)
    {
        menu.setAttribute(
            'aria-label',
            `More actions for ${note.title}`
        );
    }
}

function captureNotesInteractionState()
{
    const editor =
        main.querySelector(
            '.notes-right-pane'
        );

    const browser =
        main.querySelector(
            window.matchMedia('(max-width: 900px)').matches
                ? '.notes-browser-pane'
                : '.notes-browser-scroll'
        );

    const richTextInstance =
        notesRichTextRuntime
            .instance;

    const richTextRange =
        richTextInstance
        && notesRichTextRuntime
            .noteId
        && richTextInstance.hasFocus()
            ? richTextInstance
                .getSelection()
            : null;

    const richText =
        richTextRange
            ? {
                noteId:
                notesRichTextRuntime
                    .noteId,

                index:
                richTextRange.index,

                length:
                richTextRange.length,

                hadFocus:
                true
            }
            : null;

    const active =
        document.activeElement;

    const activeIsRichText =
        Boolean(
            richTextInstance
          && active
          && (
              active
              === richTextInstance.root
            || richTextInstance.root
                .contains(active)
          )
        );

    const focus =
        !activeIsRichText
        && active
        && main.contains(active)
            ? {
                id:
                active.id || '',

                checklistText:
                active.dataset
                    ?.noteChecklistText
                || '',

                selectionStart:
                typeof active.selectionStart
                  === 'number'
                    ? active.selectionStart
                    : null,

                selectionEnd:
                typeof active.selectionEnd
                  === 'number'
                    ? active.selectionEnd
                    : null
            }
            : null;

    return {
        editorScrollTop:
          editor?.scrollTop || 0,

        browserScrollTop:
          browser?.scrollTop || 0,

        richText,
        focus
    };
}

function restoreNotesInteractionState(
    snapshot,
    {
        focusSelector = '',
        select = false
    } = {}
)
{
    const editor =
        main.querySelector(
            '.notes-right-pane'
        );

    const browser =
        main.querySelector(
            window.matchMedia('(max-width: 900px)').matches
                ? '.notes-browser-pane'
                : '.notes-browser-scroll'
        );

    const editorScrollTop =
        snapshot?.editorScrollTop
        || 0;

    if (editor)
    {
        editor.scrollTop =
            editorScrollTop;
    }

    if (browser)
    {
        browser.scrollTop =
            snapshot?.browserScrollTop
          || 0;
    }

    const explicitTarget =
        focusSelector
            ? main.querySelector(
                focusSelector
            )
            : null;

    if (explicitTarget)
    {
        explicitTarget.focus({
            preventScroll: true
        });

        if (
            select
          && typeof explicitTarget.select
            === 'function'
        )
        {
            explicitTarget.select();
        }

        if (editor)
        {
            editor.scrollTop =
                editorScrollTop;
        }

        return;
    }

    const richText =
        snapshot?.richText;

    const richTextInstance =
        notesRichTextRuntime
            .instance;

    if (
        richText?.hadFocus
        && richTextInstance
        && richText.noteId
          === notesRichTextRuntime
              .noteId
    )
    {
        const documentLength =
            Math.max(
                1,
                richTextInstance
                    .getLength()
            );

        const maximumIndex =
            Math.max(
                0,
                documentLength - 1
            );

        const index =
            Math.max(
                0,
                Math.min(
                    Number(
                        richText.index
                    ) || 0,
                    maximumIndex
                )
            );

        const length =
            Math.max(
                0,
                Math.min(
                    Number(
                        richText.length
                    ) || 0,
                    maximumIndex - index
                )
            );

        richTextInstance.focus({
            preventScroll: true
        });

        richTextInstance.setSelection(
            index,
            length,
            'silent'
        );

        if (editor)
        {
            editor.scrollTop =
                editorScrollTop;
        }

        return;
    }

    let target =
        null;

    if (snapshot?.focus)
    {
        if (snapshot.focus.id)
        {
            target =
                main.querySelector(
                    `#${CSS.escape(
                        snapshot.focus.id
                    )}`
                );
        }
        else if (
            snapshot.focus
                .checklistText
        )
        {
            target =
                main.querySelector(
                    `[data-note-checklist-text="${
                        CSS.escape(
                            snapshot.focus
                                .checklistText
                        )
                    }"]`
                );
        }
    }

    if (!target)
    {
        return;
    }

    target.focus({
        preventScroll: true
    });

    if (
        select
        && typeof target.select
          === 'function'
    )
    {
        target.select();
    }
    else if (
        snapshot?.focus
        && typeof target.setSelectionRange
          === 'function'
        && snapshot.focus
            .selectionStart !== null
    )
    {
        target.setSelectionRange(
            snapshot.focus.selectionStart,
            snapshot.focus.selectionEnd
        );
    }

    if (editor)
    {
        editor.scrollTop =
            editorScrollTop;
    }
}

function renderNotesPreservingInteraction(
    options = {}
)
{
    const snapshot =
        captureNotesInteractionState();
    const mobileBrowser =
        window.matchMedia('(max-width: 900px)').matches
            ? main.querySelector('.notes-browser-pane')
            : null;
    const browserKey = [
        currentProjectId(),
        state.notesView,
        state.notesActiveCollectionId || '',
        state.notesSearch
    ].join('|');
    const editor =
        main.querySelector('.notes-right-pane');
    const noteId =
        state.selectedNoteId;

    if (editor?.getClientRects().length && noteId)
    {
        notesEditorScrollMemory = {
            noteId,
            top: snapshot.editorScrollTop
        };
    }
    else if (noteId && notesEditorScrollMemory?.noteId === noteId)
    {
        snapshot.editorScrollTop =
            notesEditorScrollMemory.top;
    }

    if (mobileBrowser?.getClientRects().length)
    {
        notesBrowserScrollMemory = {
            key: browserKey,
            top: snapshot.browserScrollTop
        };
    }
    else if (mobileBrowser && notesBrowserScrollMemory?.key === browserKey)
    {
        snapshot.browserScrollTop =
            notesBrowserScrollMemory.top;
    }

    renderNotes();

    requestAnimationFrame(
        () =>
            restoreNotesInteractionState(
                snapshot,
                options
            )
    );
}

function updateRelatedNoteLinks(
    noteId,
    relatedIds
)
{
    const note =
        getNote(
            noteId,
            {
                includeArchived:
              true
            }
        );

    if (!note)
    {
        return null;
    }

    const validIds =
        normalizeCentralNoteIdArray(
            relatedIds
        ).filter(id =>
        {
            const related =
                getNote(
                    id,
                    {
                        projectId:
                  note.projectId,

                        includeArchived:
                  true
                    }
                );

            return Boolean(
                related
            && related.id !== note.id
            );
        });

    const previous =
        new Set(
            note.relatedNoteIds || []
        );

    const next =
        new Set(validIds);

    previous.forEach(id =>
    {
        if (next.has(id))
        {
            return;
        }

        const related =
            getNote(
                id,
                {
                    projectId:
                note.projectId,

                    includeArchived:
                true
                }
            );

        if (related)
        {
            related.relatedNoteIds =
                related.relatedNoteIds
                    .filter(
                        itemId =>
                            itemId !== note.id
                    );

            touchNote(
                related,
                {
                    refreshPreview: false
                }
            );
        }
    });

    next.forEach(id =>
    {
        const related =
            getNote(
                id,
                {
                    projectId:
                note.projectId,

                    includeArchived:
                true
                }
            );

        if (
            related
          && !related.relatedNoteIds
              .includes(note.id)
        )
        {
            related.relatedNoteIds.push(
                note.id
            );

            related.relatedNoteIds =
                normalizeCentralNoteIdArray(
                    related.relatedNoteIds
                );

            touchNote(
                related,
                {
                    refreshPreview: false
                }
            );
        }
    });

    note.relatedNoteIds =
        validIds;

    touchNote(note);

    return note;
}

function duplicateCentralNote(
    noteId
)
{
    const note =
        getNote(
            noteId,
            {
                includeArchived:
              true
            }
        );

    if (!note)
    {
        return null;
    }

    const now =
        new Date().toISOString();

    const copiedSourceIds =
        noteEntityLinkedIds(
            note,
            'source'
        );

    const copy =
        normalizeCentralNoteRecord({
            ...note,

            id:
            createRuntimeId(
                'note'
            ),

            title:
            `${note.title} copy`,

            bodyDelta:
            cloneRichTextDelta(
                note.bodyDelta
            ),

            bodyFormat:
            note.bodyDelta
                ? 'quill-delta-v1'
                : '',

            collectionIds: [
                ...note.collectionIds
            ],

            favorite:
            false,

            archived:
            false,

            checklist:
            note.checklist.map(
                item => ({
                    ...item,

                    id:
                  createRuntimeId(
                      'note-check'
                  )
                })
            ),

            linkedPersonIds: [
                ...note.linkedPersonIds
            ],

            linkedPlaceIds: [
                ...note.linkedPlaceIds
            ],

            linkedEventIds: [
                ...note.linkedEventIds
            ],

            linkedPhotoIds: [
                ...note.linkedPhotoIds
            ],

            linkedArchiveFileIds: [
                ...note.linkedArchiveFileIds
            ],

            relatedNoteIds:
            [],

            createdAt:
            now,

            updatedAt:
            now
        });

    sampleData.notes.unshift(
        copy
    );

    setNoteEntityLinks(
        copy.id,
        'source',
        copiedSourceIds,
        {
            projectId:
            copy.projectId,

            touchUpdatedAt:
            false
        }
    );

    state.notesView =
        'all';

    state.notesActiveCollectionId =
        null;

    state.selectedNoteId =
        copy.id;

    state.notesRightCollapsed =
        false;

    state.notesMobilePane =
        'editor';

    state.notesSaveStatus =
        'Saved';

    return copy;
}

function bindNotesBrowserControls()
{
    bindSearchInput(
        main,
        '#notesSearch',
        'notesSearch',
        renderNotes
    );

    const mobileSearchToggle =
        main.querySelector('#notesMobileSearchToggle');
    const mobileSearchClose =
        main.querySelector('#notesMobileSearchClose');
    const mobileToolbar =
        main.querySelector('.notes-toolbar-line');

    mobileSearchToggle?.addEventListener('click', () =>
    {
        state.notesMobileSearchOpen = true;
        mobileToolbar?.classList.add('search-open');
        main.querySelector('#notesSearch')?.focus();
    });

    mobileSearchClose?.addEventListener('click', () =>
    {
        state.notesMobileSearchOpen = false;
        mobileToolbar?.classList.remove('search-open');
        mobileSearchToggle?.focus();
    });

    main
        .querySelector(
            '[data-clear-notes-context-filter]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                clearNotesContext();
                state.selectedNoteId =
                    null;
                state.notesRightCollapsed =
                    true;
                state.notesMobilePane =
                    'browser';
                renderNotes();
            }
        );

    main
        .querySelector(
            '#notesFilterButton'
        )
        ?.addEventListener(
            'click',
            event =>
            {
                event.stopPropagation();
                openNotesFilterMenu(
                    event.currentTarget
                );
            }
        );
    bindAppSortControl(main, {
        id: 'notesSort',
        options: APP_SORT_OPTIONS.notes,
        getField: () => state.notesSort,
        getDirection: () =>
            state.notesSortDirection,

        onChange: ({
            field,
            direction
        }) =>
        {
            state.notesSort = field;
            state.notesSortDirection =
                direction;

            renderNotes();
        }
    });
    main
        .querySelectorAll(
            '[data-clear-notes-filter]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    const key =
                        button.dataset
                            .clearNotesFilter;

                    if (
                        !state.notesFilters
                || !(key in state.notesFilters)
                    )
                    {
                        return;
                    }

                    state.notesFilters[key] =
                        notesFilterSchema.find(definition => definition.key === key)
                            ?.control === 'boolean' ? false : '';

                    renderNotes();
                }
            );
        });

    main
        .querySelector(
            '#notesClearSearch'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                state.notesSearch =
                    '';
                renderNotes();
            }
        );

    main
        .querySelector(
            '#notesNewNoteButton'
        )
        ?.addEventListener(
            'click',
            () =>
                createCentralNote()
        );

    main
        .querySelector('#notesMobileNewNoteButton')
        ?.addEventListener('click', () => createCentralNote());

    main.querySelector('#notesEmptyCreate')?.addEventListener('click', createCentralNote);

    main
        .querySelectorAll(
            '[data-note-row]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    appNavigationMarkIntent();
                    state.selectedNoteId =
                        button.dataset.noteRow;

                    state.notesRightCollapsed =
                        false;

                    state.notesMobilePane =
                        'editor';

                    state.notesSaveStatus =
                        'Saved';

                    renderNotesPreservingInteraction();
                }
            );
        });

    main
        .querySelectorAll(
            '[data-note-favorite]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                event =>
                {
                    event.stopPropagation();

                    const note =
                        getNote(
                            button.dataset
                                .noteFavorite,
                            {
                                includeArchived:
                      true
                            }
                        );

                    if (!note)
                    {
                        return;
                    }

                    note.favorite =
                        !note.favorite;
                    touchNote(note);
                    renderNotesPreservingInteraction();

                    showToast(
                        note.favorite
                            ? 'Added to favourites.'
                            : 'Removed from favourites.'
                    );
                }
            );
        });

    main
        .querySelectorAll(
            '[data-note-menu]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                event =>
                {
                    event.stopPropagation();
                    openNotesMenu(
                        button.dataset.noteMenu,
                        button
                    );
                }
            );
        });
}

function bindNotesSplitPaneControls()
{
    main
        .querySelector(
            '#notesBackToBrowser'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                state.notesMobilePane =
                    'browser';

                renderNotesPreservingInteraction();
            }
        );

    main
        .querySelector(
            '#notesToggleRight'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                state.notesRightCollapsed =
                    !state.notesRightCollapsed;

                if (
                    !state.notesRightCollapsed
                )
                {
                    state.notesMobilePane =
                        'editor';
                }

                renderNotesPreservingInteraction();
            }
        );

    const resizer =
        main.querySelector(
            '#notesResizer'
        );

    if (!resizer)
    {
        return;
    }

    let startX = 0;
    let startWidth = 0;

    const setBrowserWidth =
        value =>
        {
            const next =
                Math.max(
                    360,
                    Math.min(
                        600,
                        value
                    )
                );

            state.notesBrowserWidth =
                next;

            main
                .querySelector(
                    '.notes-shell'
                )
                ?.style.setProperty(
                    '--notes-browser-width',
                    `${next}px`
                );

            resizer.setAttribute(
                'aria-valuenow',
                String(
                    Math.round(next)
                )
            );
        };

    const move = event =>
    {
        setBrowserWidth(
            startWidth
          + event.clientX
          - startX
        );
    };

    const stop = event =>
    {
        resizer.classList.remove(
            'dragging'
        );
        resizer
            .releasePointerCapture
            ?.(
                event.pointerId
            );
        resizer.removeEventListener(
            'pointermove',
            move
        );
        resizer.removeEventListener(
            'pointerup',
            stop
        );
        resizer.removeEventListener(
            'pointercancel',
            stop
        );
    };

    resizer.addEventListener(
        'pointerdown',
        event =>
        {
            event.preventDefault();
            startX = event.clientX;
            startWidth =
                Math.max(
                    320,
                    Math.min(
                        520,
                        Number(
                            state.notesBrowserWidth
                        ) || 360
                    )
                );
            resizer.classList.add(
                'dragging'
            );
            resizer
                .setPointerCapture
                ?.(
                    event.pointerId
                );
            resizer.addEventListener(
                'pointermove',
                move
            );
            resizer.addEventListener(
                'pointerup',
                stop
            );
            resizer.addEventListener(
                'pointercancel',
                stop
            );
        }
    );

    resizer.addEventListener(
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

            setBrowserWidth(
                (
                    Number(
                        state.notesBrowserWidth
                    ) || 440
                )
            + (
                event.key
                  === 'ArrowRight'
                    ? 24
                    : -24
            )
            );
        }
    );
}


function bindNoteEditorControls()
{
    const note =
        selectedNote();

    if (!note)
    {
        return;
    }

    bindConnectedFileLinks(
        main,
        {
            onUnlinked:
            ({
                contextType
            }) =>
            {
                if (
                    contextType
                !== 'note'
                )
                {
                    return;
                }

                renderNotesPreservingInteraction();
            }
        }
    );
    bindConnectedSourceLinks(
        main,
        {
            onUnlinked:
            ({
                targetType,
                targetId
            }) =>
            {
                if (
                    targetType !== 'note'
                || targetId !== note.id
                )
                {
                    return;
                }

                renderNotesPreservingInteraction();
            }
        }
    );
    const titleInput =
        main.querySelector(
            '#notesTitleInput'
        );

    titleInput
        ?.addEventListener(
            'input',
            event =>
            {
                note.title =
                    event.target.value;
                touchNote(note);
            }
        );

    titleInput
        ?.addEventListener(
            'blur',
            event =>
            {
                const title =
                    collectLocalizedDataFieldValue(
                        event.target,
                        event.target.dataset.sourceValue
                  || ''
                    ).trim()
              || 'Untitled note';

                note.title = title;
                event.target.value =
                    localizedDataFieldValue(
                        title
                    );
                event.target.dataset.sourceValue =
                    title;
                touchNote(note);
            }
        );

    main
        .querySelector(
            '#notesFavoriteButton'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                note.favorite =
                    !note.favorite;
                touchNote(note);
                renderNotesPreservingInteraction();
                showToast(
                    note.favorite
                        ? 'Added to favourites.'
                        : 'Removed from favourites.'
                );
            }
        );

    main
        .querySelector(
            '#notesEditorMenuButton'
        )
        ?.addEventListener(
            'click',
            event =>
            {
                event.stopPropagation();
                openNotesMenu(
                    note.id,
                    event.currentTarget
                );
            }
        );

    main
        .querySelector(
            '#notesManageCollections'
        )
        ?.addEventListener(
            'click',
            () =>
                openNoteCollectionsModal(
                    note.id
                )
        );

    main
        .querySelectorAll(
            '[data-note-remove-collection]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    removeNoteFromCollection(
                        note.id,
                        button.dataset
                            .noteRemoveCollection,
                        {
                            projectId:
                    note.projectId
                        }
                    );
                    renderNotesPreservingInteraction();
                    showToast(
                        'Removed from collection.'
                    );
                }
            );
        });

    main
        .querySelector(
            '#notesAddChecklistItem'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                const itemId =
                    createRuntimeId(
                        'note-check'
                    );

                note.checklist.push({
                    id:
                itemId,
                    text:
                'New checklist item',
                    done:
                false
                });

                touchNote(note);
                renderNotesPreservingInteraction({
                    focusSelector:
                `[data-note-checklist-text="${
                    CSS.escape(itemId)
                }"]`,
                    select:
                true
                });
            }
        );

    main
        .querySelectorAll(
            '[data-note-checklist-toggle]'
        )
        .forEach(input =>
        {
            input.addEventListener(
                'change',
                () =>
                {
                    const item =
                        note.checklist.find(
                            checklistItem =>
                                checklistItem.id
                    === input.dataset
                        .noteChecklistToggle
                        );

                    if (!item)
                    {
                        return;
                    }

                    item.done =
                        input.checked;
                    touchNote(note);
                    renderNotesPreservingInteraction();
                }
            );
        });

    main
        .querySelectorAll(
            '[data-note-checklist-text]'
        )
        .forEach(input =>
        {
            const originalText =
                input.value;

            input.addEventListener(
                'change',
                () =>
                {
                    const item =
                        note.checklist.find(
                            checklistItem =>
                                checklistItem.id
                    === input.dataset
                        .noteChecklistText
                        );

                    if (!item)
                    {
                        return;
                    }

                    const text =
                        collectLocalizedDataFieldValue(
                            input,
                            input.dataset.sourceValue
                    || ''
                        ).trim();

                    if (!text)
                    {
                        input.value =
                            item.text
                  || originalText;
                        return;
                    }

                    item.text = text;
                    input.value =
                        localizedDataFieldValue(
                            text
                        );
                    input.dataset.sourceValue =
                        text;
                    touchNote(note);
                }
            );

            input.addEventListener(
                'keydown',
                event =>
                {
                    if (event.key === 'Enter')
                    {
                        event.preventDefault();
                        input.blur();
                    }

                    if (event.key === 'Escape')
                    {
                        input.value =
                            originalText;
                        input.blur();
                    }
                }
            );
        });

    main
        .querySelectorAll(
            '[data-note-checklist-delete]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    note.checklist =
                        note.checklist.filter(
                            item =>
                                item.id
                    !== button.dataset
                        .noteChecklistDelete
                        );
                    touchNote(note);
                    renderNotesPreservingInteraction();
                }
            );
        });

    main
        .querySelectorAll(
            '[data-note-editor-section-toggle]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    const sectionKey =
                        button.dataset
                            .noteEditorSectionToggle;

                    state.notesEditorSections[
                        sectionKey
                    ] =
                        !noteEditorSectionIsOpen(
                            sectionKey
                        );

                    renderNotesPreservingInteraction({
                        focusSelector:
                  `[data-note-editor-section-toggle="${
                      CSS.escape(
                          sectionKey
                      )
                  }"]`
                    });
                }
            );
        });

    main
        .querySelectorAll(
            '[data-note-summary-section]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    const sectionKey =
                        button.dataset
                            .noteSummarySection;

                    if (!sectionKey)
                    {
                        return;
                    }

                    state.notesEditorSections[
                        sectionKey
                    ] =
                        true;

                    const escapedSectionKey =
                        CSS.escape(
                            sectionKey
                        );

                    renderNotesPreservingInteraction({
                        focusSelector:
                    `[data-note-editor-section-toggle="${escapedSectionKey}"]`
                    });

                    /*
                  renderNotesPreservingInteraction()
                  registers its restoration callback
                  first. This callback is registered
                  afterward, so it runs after the
                  previous scroll position and focus
                  have been restored.
                */
                    requestAnimationFrame(
                        () =>
                        {
                            const editorPane =
                                main.querySelector(
                                    '.notes-right-pane'
                                );

                            const section =
                                editorPane
                                    ?.querySelector(
                                        `[data-note-editor-section="${escapedSectionKey}"]`
                                    );

                            if (
                                !editorPane
                      || !section
                            )
                            {
                                return;
                            }

                            const stickyHeader =
                                editorPane.querySelector(
                                    '.notes-editor-header'
                                );

                            const headerHeight =
                                stickyHeader
                                    ?.getBoundingClientRect()
                                    .height
                      || 0;

                            /*
                      Leave a small visible gap below
                      the sticky Note header.
                    */
                            const scrollOffset =
                                Math.ceil(
                                    headerHeight
                                )
                      + 12;

                            section.style
                                .scrollMarginTop =
                                    `${scrollOffset}px`;

                            section.scrollIntoView({
                                block:
                        'start',

                                inline:
                        'nearest',

                                behavior:
                        'smooth'
                            });
                        }
                    );
                }
            );
        });

    main
        .querySelectorAll(
            '[data-note-manage-links]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () => openNotesLinkEntityModal(button.dataset.noteManageLinks)
            );
        });

    main
        .querySelectorAll(
            '[data-note-linked-open]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                    openNoteLinkedEntity(
                        button.dataset
                            .noteLinkedType,
                        button.dataset
                            .noteLinkedId
                    )
            );
        });

    main
        .querySelectorAll('[data-note-linked-remove]')
        .forEach(button =>
        {
            button.addEventListener('click', event =>
            {
                event.preventDefault();
                event.stopPropagation();

                const type = button.dataset.noteLinkedType;
                const id = button.dataset.noteLinkedId;
                const config = getNoteEntityConfig(type);

                if (!config) return;

                const unlink = () =>
                {
                    setNoteEntityLinks(
                        note.id,
                        type,
                        noteEntityLinkedIds(note, type).filter(
                            linkedId => linkedId !== id
                        ),
                        { projectId: note.projectId }
                    );

                    renderNotesPreservingInteraction();
                    showToast('Link removed.');
                };

                if (type === 'photo')
                {
                    const photo = getPhoto(id);
                    if (!photo) return;

                    openPhotoUnlinkConfirm({
                        photo,
                        contextLabel:
                  note.title
                  || (state.language === 'ru'
                      ? 'Заметка без названия'
                      : 'Untitled note'),
                        onConfirm: unlink
                    });

                    return;
                }

                unlink();
            });
        });

    main
        .querySelector(
            '#notesManageRelated'
        )
        ?.addEventListener(
            'click',
            openNotesRelatedModal
        );

    main
        .querySelectorAll(
            '[data-note-related-open]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                    openCentralNoteInEditor(
                        button.dataset
                            .noteRelatedOpen
                    )
            );
        });

    main
        .querySelectorAll(
            '[data-note-related-remove]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    updateRelatedNoteLinks(
                        note.id,
                        note.relatedNoteIds
                            .filter(
                                relatedId =>
                                    relatedId
                      !== button.dataset
                          .noteRelatedRemove
                            )
                    );

                    renderNotesPreservingInteraction();

                    showToast(
                        'Relationship removed from both notes.'
                    );
                }
            );
        });
}

function bindNotesControls()
{
    bindToasts(main);
    bindNotesBrowserControls();
    bindNotesSplitPaneControls();
    bindNoteEditorControls();
}


