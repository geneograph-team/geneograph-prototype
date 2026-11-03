function openPeopleProfileFromRow(personId)
{
    const person = currentPeopleRecords().find(item => item.id === personId);
    if (!person)
    {
        showToast('Person record not found.');
        return;
    }
    appNavigationMarkIntent();
    state.selectedPeopleId = personId;
    state.selectedPersonId = personId;
    state.peopleView = 'profile';
    state.peopleSide = 'profile';
    state.peoplePreviewCollapsed = false;
    navigateToProjectModule(currentProjectId(), 'People');
}

function showPersonInFamilyTree(personId)
{
    const person = getPerson(personId);
    if (!person || person.deleted || person.projectId !== currentProjectId())
    {
        showToast('This person is not currently shown in the sample Family Tree.'); return;
    }
    appNavigationMarkIntent();
    treeProjectViewState().focusPersonId = personId;
    state.activeModule = 'Family Tree';
    state.selectedPersonId = personId;
    rememberTreeSelectedPerson(personId);
    state.treeCenterTargetId = personId;
    state.treeInspectorCollapsed = false;
    render();
}

function resetPersonSidebarSections()
{
    ['insights', 'timeline', 'relationships', 'photos', 'archive', 'notes', 'record'].forEach(key =>
    {
        state.inspectorSections[key] = false;
    });
}

function personSidebarSelectedId(context)
{
    return context === 'people' ? state.selectedPeopleId : state.selectedPersonId;
}

function syncPersonSidebarSelection(personId, context)
{
    if (!personId) return;
    state.selectedPersonId = personId;
    if (context === 'tree') rememberTreeSelectedPerson(personId);
    if (context === 'people') state.selectedPeopleId = personId;
}

const personSidebarScrollByContext = {
    tree: 0,
    people: 0
};

function getPersonSidebarElement(
    context
)
{
    return main.querySelector(
        `[data-person-sidebar-context="${
            CSS.escape(context)
        }"]`
    );
}

function syncPersonSidebarLayoutState(
    context
)
{
    if (context === 'people')
    {
        main
            .querySelector('.people-layout')
            ?.classList.toggle(
                'preview-collapsed',
                Boolean(
                    state.peoplePreviewCollapsed
                )
            );

        return;
    }

    main
        .querySelector('.tree-workspace')
        ?.classList.toggle(
            'inspector-collapsed',
            Boolean(
                state.treeInspectorCollapsed
            )
        );
}

function personSidebarCanProvideScroll(
    panel
)
{
    return Boolean(
        panel
        && !panel.classList.contains(
            'collapsed'
        )
        && panel.getClientRects().length
    );
}

function createPersonSidebarElement(
    context
)
{
    const template =
        document.createElement(
            'template'
        );

    template.innerHTML =
        renderPersonSidebar(
            personSidebarSelectedId(
                context
            ),
            context
        ).trim();

    return (
        template.content.firstElementChild
        || null
    );
}

function rerenderPersonSidebarContext(
    context,
    {
        focusSectionId = '',
        scrollSectionId = '',
        preserveScroll = true
    } = {}
)
{
    const currentPanel =
        getPersonSidebarElement(
            context
        );

    /*
      * Safe fallback for an incomplete or
      * unexpected module render.
      */
    if (!currentPanel)
    {
        if (context === 'people')
        {
            renderPeople();
        }
        else
        {
            renderFamilyTreePreserveScroll();
        }

        return;
    }

    /*
      * Accordion changes preserve the current
      * inspector position. Selecting another
      * person intentionally starts the new
      * inspector at the top.
      */
    if (
        preserveScroll
        && personSidebarCanProvideScroll(
            currentPanel
        )
    )
    {
        personSidebarScrollByContext[
            context
        ] = currentPanel.scrollTop;
    }
    else if (!preserveScroll)
    {
        personSidebarScrollByContext[
            context
        ] = 0;
    }

    const nextPanel =
        createPersonSidebarElement(
            context
        );

    if (!nextPanel) return;

    syncPersonSidebarLayoutState(
        context
    );

    currentPanel.replaceWith(
        nextPanel
    );

    bindPersonSidebar(
        nextPanel,
        context
    );

    requestAnimationFrame(() =>
    {
        if (
            !nextPanel.classList.contains(
                'collapsed'
            )
          && nextPanel.getClientRects()
              .length
        )
        {
            const maximumScroll =
                Math.max(
                    0,
                    nextPanel.scrollHeight
              - nextPanel.clientHeight
                );

            const requestedScroll =
                preserveScroll
                    ? (
                        personSidebarScrollByContext[
                            context
                        ] || 0
                    )
                    : 0;

            nextPanel.scrollTop =
                Math.min(
                    requestedScroll,
                    maximumScroll
                );
        }

        if (scrollSectionId)
        {
            const sectionBody =
                nextPanel.querySelector(
                    `#section-${
                        CSS.escape(
                            scrollSectionId
                        )
                    }`
                );

            const section =
                sectionBody?.closest(
                    '.panel-section'
                );

            if (section)
            {
                const panelRect =
                    nextPanel
                        .getBoundingClientRect();

                const sectionRect =
                    section
                        .getBoundingClientRect();

                const targetTop =
                    nextPanel.scrollTop
              + sectionRect.top
              - panelRect.top
              - 12;

                nextPanel.scrollTo({
                    top:
                Math.max(
                    0,
                    targetTop
                ),

                    behavior:
                'smooth'
                });
            }
        }

        if (focusSectionId)
        {
            nextPanel
                .querySelector(
                    `[data-toggle-section="${
                        CSS.escape(
                            focusSectionId
                        )
                    }"]`
                )
                ?.focus({
                    preventScroll: true
                });
        }
    });
}

function relationshipContextFromRow(
    row,
    sidebarContext
)
{
    return {
        sidebarContext,
        kind:
          row?.dataset.relationshipKind || '',
        personId:
          row?.dataset.relationshipPersonId || '',
        relatedPersonId:
          row?.dataset.relationshipRelatedPersonId
          || '',
        familyId:
          row?.dataset.relationshipFamilyId || ''
    };
}

function selectRelationshipPerson(
    personId,
    context = 'tree'
)
{
    if (!personId || !getPerson(personId))
    {
        showToast('Person record not found.');
        return;
    }

    if (context === 'profile')
    {
        openProfileFamilyMember(personId);
        return;
    }

    if (context === 'tree')
    {
        navigateFamilyTreeToPerson(
            personId,
            {
                focusBranch: false,
                center: true
            }
        );
        return;
    }

    syncPersonSidebarSelection(
        personId,
        context
    );

    if (context === 'people')
    {
        state.peoplePreviewCollapsed = false;
        renderPeople();
    }
}

function bindRelationshipList(
    root,
    context = 'tree'
)
{
    root
        .querySelectorAll(
            '[data-select-relationship-person]'
        )
        .forEach(button =>
        {
            button.addEventListener('click', () =>
            {
                selectRelationshipPerson(
                    button.dataset.selectRelationshipPerson,
                    context
                );
            });
        });

    root
        .querySelectorAll('[data-edit-relationship]')
        .forEach(button =>
        {
            button.addEventListener('click', event =>
            {
                event.stopPropagation();

                const row = button.closest(
                    '[data-relationship-row]'
                );

                openRelationshipEditModal(
                    relationshipContextFromRow(
                        row,
                        context
                    )
                );
            });
        });

    root
        .querySelectorAll('[data-unlink-relationship]')
        .forEach(button =>
        {
            button.addEventListener('click', event =>
            {
                event.stopPropagation();

                const row = button.closest(
                    '[data-relationship-row]'
                );

                const relationshipContext =
                    relationshipContextFromRow(
                        row,
                        context
                    );

                if (relationshipContext.personId)
                {
                    syncPersonSidebarSelection(
                        relationshipContext.personId,
                        context
                    );
                }

                openUnlinkRelationshipModal(
                    relationshipContext
                );
            });
        });
}

function bindPersonSidebar(root, context = 'tree')
{
    const selectedId = personSidebarSelectedId(context);
    const selected = personSidebarTreePerson(selectedId);
    root
        .querySelectorAll(
            '[data-person-chip-section]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    const sectionId =
                        button.dataset
                            .personChipSection;

                    if (!sectionId)
                    {
                        return;
                    }

                    state.inspectorSections[
                        sectionId
                    ] = true;

                    rerenderPersonSidebarContext(
                        context,
                        {
                            focusSectionId:
                    sectionId,

                            scrollSectionId:
                    sectionId
                        }
                    );
                }
            );
        });
    root.querySelector('#quickEdit')?.addEventListener('click', () =>
    {
        if (!selected?.id) return;
        syncPersonSidebarSelection(selected.id, context);
        openEditPersonModal(selected.id);
    });
    root.querySelector('#familyMoreActions')?.addEventListener('click', event =>
    {
        if (!selected) return;
        event.stopPropagation();
        syncPersonSidebarSelection(selected.id, context);
        openPeopleActionsMenu(selected.id, event.currentTarget, { includeProfile: true });
    });
    root.querySelector('[data-manage-relationships]')?.addEventListener('click', () =>
    {
        if (!selected?.id) return;
        syncPersonSidebarSelection(selected.id, context);
        openManageRelationshipsModal(selected.id, context);
    });
    root
        .querySelector('#addRelative')
        ?.addEventListener(
            'click',
            event =>
            {
                if (!selected?.id) return;

                syncPersonSidebarSelection(
                    selected.id,
                    context
                );

                openRelativePopover(
                    event.currentTarget,
                    selected.id
                );
            }
        );
    root.querySelector('#connectRelative')?.addEventListener('click', () =>
    {
        if (!selected?.id) return;
        syncPersonSidebarSelection(selected.id, context);
        openConnectRelativeModal(selected.id, { relationshipType: 'parent' });
    });
    root
        .querySelector(
            '[data-person-add-fact]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                if (!selected?.id) return;

                syncPersonSidebarSelection(
                    selected.id,
                    context
                );

                openAddFactOverlay(
                    getPerson(selected.id)
                );
            }
        );
    root
        .querySelectorAll(
            '[data-family-photo]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                    openFamilyPhoto(
                        button.dataset.familyPhoto
                    )
            );
        });
    bindTimelineSourceControls(
        root,
        {
            afterSave:
            () =>
                rerenderPersonSidebarContext(
                    context,
                    {
                        preserveScroll:
                    true,

                        focusSectionId:
                    'timeline'
                    }
                )
        }
    );
    bindPersonPhotoUnlinkButtons(
        root
    );
    root
        .querySelectorAll(
            '[data-person-add-photos]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    const personId =
                        button.dataset
                            .personAddPhotos;

                    if (!personId)
                    {
                        return;
                    }

                    openAddPhotosToPersonModal(
                        personId
                    );
                }
            );
        });
    root
        .querySelectorAll(
            '[data-person-add-files]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    const personId =
                        button.dataset
                            .personAddFiles;

                    if (!personId)
                    {
                        return;
                    }

                    openPersonFilesModal(
                        personId
                    );
                }
            );
        });
    const addNoteButton =
        root.querySelector(
            '[data-person-add-note]'
        );

    addNoteButton
        ?.addEventListener(
            'click',
            () =>
            {
                openPersonNotesModal(
                    addNoteButton.dataset
                        .personAddNote,

                    context
                );
            }
        );
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
                !== 'person'
                )
                {
                    return;
                }

                state.inspectorSections
                    .archive = true;

                rerenderPersonSidebarContext(
                    context,
                    {
                        preserveScroll:
                    true,

                        focusSectionId:
                    'archive'
                    }
                );
            }
        }
    );
    bindConnectedNoteLinks(
        root,
        {
            onUnlinked:
            ({
                contextType
            }) =>
            {
                if (
                    contextType
                !== 'person'
                )
                {
                    return;
                }

                state.inspectorSections
                    .notes = true;

                /*
                Use the actual sidebar context:
                - "tree" for Family Tree
                - "people" for People
              */
                rerenderPersonSidebarContext(
                    context,
                    {
                        preserveScroll:
                    true,

                        focusSectionId:
                    'notes'
                    }
                );
            }
        }
    );
    bindConnectedSourceLinks(
        root,
        {
            onUnlinked:
            ({
                targetType
            }) =>
            {
                if (
                    targetType
                  !== 'person'
                )
                {
                    return;
                }

                state.inspectorSections
                    .sources = true;

                rerenderPersonSidebarContext(
                    context,
                    {
                        preserveScroll:
                    true,

                        focusSectionId:
                    'sources'
                    }
                );
            }
        }
    );

    root
        .querySelector(
            '[data-person-manage-sources]'
        )
        ?.addEventListener(
            'click',
            event =>
            {
                const personId =
                    event.currentTarget
                        .dataset
                        .personManageSources;

                const centralPerson =
                    getPerson(
                        personId
                    );

                if (!centralPerson)
                {
                    return;
                }

                openSourcesForTargetModal({
                    targetType:
                'person',

                    targetId:
                centralPerson.id,

                    projectId:
                centralPerson.projectId,

                    title:
                'Add sources',

                    subtitle:
                `Connect existing sources to ${
                    centralPerson.names?.display
                  || 'this person'
                }.`,

                    afterSave:
                () =>
                {
                    state.inspectorSections
                        .sources = true;

                    rerenderPersonSidebarContext(
                        context,
                        {
                            preserveScroll:
                        true,

                            focusSectionId:
                        'sources'
                        }
                    );
                }
                });
            }
        );
    root
        .querySelectorAll(
            '[data-person-resource-view]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    const resource =
                        button.dataset
                            .personResourceView;

                    const personId =
                        button.dataset
                            .personResourcePerson;

                    if (!personId) return;

                    if (state.activeModule === 'Family Tree')
                    {
                        captureTreeCanvasScroll(currentProjectId());
                    }

                    if (
                        resource === 'photos'
                    )
                    {
                        openAlbumsForPerson(
                            personId
                        );

                        return;
                    }

                    if (
                        resource === 'archive'
                    )
                    {
                        openArchiveForPerson(
                            personId
                        );

                        return;
                    }

                    if (
                        resource === 'notes'
                    )
                    {
                        openNotesForPerson(
                            personId
                        );
                    }
                }
            );
        });
    root.querySelector('#collapseInspector')?.addEventListener('click', () =>
    {
        if (context === 'people') state.peoplePreviewCollapsed = true;
        else state.treeInspectorCollapsed = true;
        rerenderPersonSidebarContext(context);
    });
    root.querySelector('#restoreInspector')?.addEventListener('click', () =>
    {
        if (context === 'people') state.peoplePreviewCollapsed = false;
        else state.treeInspectorCollapsed = false;
        rerenderPersonSidebarContext(context);
    });
    root.querySelector('[data-tree-view-profile]')?.addEventListener('click', event =>
    {
        const personId = event.currentTarget.dataset.treeViewProfile;
        if (personId) openPeopleProfileFromRow(personId);
    });
    root
        .querySelectorAll(
            '[data-toggle-section]'
        )
        .forEach(button =>
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

                    const id =
                        button.dataset
                            .toggleSection;

                    if (!id) return;

                    state.inspectorSections[
                        id
                    ] = !sectionIsOpen(id);

                    rerenderPersonSidebarContext(
                        context,
                        {
                            focusSectionId: id
                        }
                    );
                }
            )
        );
    bindRelationshipList(root, context);
    bindToasts(root);
}

