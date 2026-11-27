let runtimeIdSequence = 0;

function createRuntimeId(
    prefix
)
{
    runtimeIdSequence += 1;

    const randomPart =
        typeof crypto !== 'undefined'
        && typeof crypto.randomUUID
          === 'function'
            ? crypto.randomUUID()
                .replaceAll('-', '')
                .slice(0, 10)
            : Math.random()
                .toString(36)
                .slice(2, 12);

    return `${prefix}-${
        Date.now().toString(36)
    }-${runtimeIdSequence.toString(36)}-${
        randomPart
    }`;
}

function noteTimestamp(
    note,
    field = 'updatedAt'
)
{
    const timestamp =
        Date.parse(
            note?.[field] || ''
        );

    return Number.isFinite(timestamp)
        ? timestamp
        : 0;
}

function getProjectNotes(
    projectId =
        currentProjectId(),
    {
        includeArchived = false
    } = {}
)
{
    return (
        sampleData.notes || []
    )
        .filter(note =>
            note.projectId
            === projectId
          && (
              includeArchived
            || !note.archived
          )
        )
        .slice()
        .sort(
            (first, second) =>
                noteTimestamp(
                    second,
                    'updatedAt'
                )
            - noteTimestamp(
                first,
                'updatedAt'
            )
        );
}

function getNote(
    noteId,
    {
        projectId =
            currentProjectId(),
        includeArchived = true
    } = {}
)
{
    const note =
        (
            sampleData.notes || []
        ).find(
            item =>
                item.id === noteId
        )
        || null;

    if (
        !note
        || (
            projectId
          && note.projectId
            !== projectId
        )
        || (
            !includeArchived
          && note.archived
        )
    )
    {
        return null;
    }

    return note;
}

function getProjectNoteCollections(
    projectId =
        currentProjectId()
)
{
    return (
        sampleData.noteCollections
        || []
    ).filter(
        collection =>
            collection.projectId
            === projectId
    );
}

function getNoteCollection(
    collectionId,
    {
        projectId =
            currentProjectId()
    } = {}
)
{
    const collection =
        (
            sampleData.noteCollections
          || []
        ).find(
            item =>
                item.id
              === collectionId
        )
        || null;

    if (
        !collection
        || (
            projectId
          && collection.projectId
            !== projectId
        )
    )
    {
        return null;
    }

    return collection;
}

function getCollectionsForNote(
    noteId,
    {
        projectId =
            currentProjectId()
    } = {}
)
{
    const note =
        getNote(
            noteId,
            {
                projectId,
                includeArchived: true
            }
        );

    if (!note)
    {
        return [];
    }

    return (
        note.collectionIds || []
    )
        .map(collectionId =>
            getNoteCollection(
                collectionId,
                {
                    projectId:
                note.projectId
                }
            )
        )
        .filter(Boolean);
}

function getNotesForCollection(
    collectionId,
    {
        projectId =
            currentProjectId(),
        includeArchived = false
    } = {}
)
{
    const collection =
        getNoteCollection(
            collectionId,
            {
                projectId
            }
        );

    if (!collection)
    {
        return [];
    }

    return getProjectNotes(
        collection.projectId,
        {
            includeArchived
        }
    ).filter(note =>
        (
            note.collectionIds || []
        ).includes(
            collection.id
        )
    );
}

function getNotesLinkedById(
    field,
    linkedId,
    {
        projectId =
            currentProjectId(),
        includeArchived = false
    } = {}
)
{
    if (!linkedId)
    {
        return [];
    }

    return getProjectNotes(
        projectId,
        {
            includeArchived
        }
    ).filter(note =>
        (
            note[field] || []
        ).includes(linkedId)
    );
}

const NOTE_ENTITY_TYPES =
    Object.freeze({
        person: Object.freeze({
            field:
            'linkedPersonIds',

            sectionKey:
            'people',

            iconSvg:
            icon.people,

            chipTone:
            'people',

            contextLabel:
            'Person',

            title:
            'People',

            singular:
            'person',

            plural:
            'people',

            records:
            projectId =>
                (
                    sampleData.people || []
                ).filter(
                    person =>
                        person.projectId
                    === projectId
                  && !person.deleted
                ),

            label:
            record =>
                personResourceDisplayName(
                    record
                )
              || 'Unnamed person',

            meta:
            record =>
            {
                const dates = [
                    formatGenealogyDateLabel(
                        record.birth
                    ),

                    formatGenealogyDateLabel(
                        record.death
                    )
                ]
                    .filter(Boolean)
                    .join(' – ');

                return (
                    dates
                || 'Person record'
                );
            },

            open:
            record =>
            {
                openPlaceInspectorPerson(
                    record.id
                );
            }
        }),

        place: Object.freeze({
            field:
            'linkedPlaceIds',

            sectionKey:
            'places',

            iconSvg:
            icon.mapPin,

            chipTone:
            'places',

            contextLabel:
            'Place',

            title:
            'Places',

            singular:
            'place',

            plural:
            'places',

            records:
            projectId =>
                (
                    sampleData.places || []
                ).filter(
                    place =>
                        place.projectId
                    === projectId
                ),

            label:
            record =>
                placeDisplayText(
                    record
                )
              || 'Unnamed place',

            meta:
            () =>
                'Place record',

            open:
            record =>
            {
                state.activeModule =
                    'Places';

                state.placesView =
                    'all';

                state.selectedPlaceId =
                    record.id;

                state.placesInspectorCollapsed =
                    false;

                render();
            }
        }),

        event: Object.freeze({
            field:
            'linkedEventIds',

            sectionKey:
            'events',

            iconSvg:
            icon.calendar,

            chipTone:
            'events',

            contextLabel:
            'Event',

            title:
            'Events',

            singular:
            'event',

            plural:
            'events',

            records:
            projectId =>
                (
                    sampleData.events || []
                ).filter(
                    event =>
                        event.projectId
                    === projectId
                ),

            label:
            record =>
                record.title
              || record.typeLabel
              || record.type
              || 'Event',

            meta:
            record =>
                [
                    timelineDateLabel(
                        record
                    ),

                    record.placeId
                        ? getPlaceDisplay(
                            record.placeId
                        )
                        : record.placeText
                ]
                    .filter(Boolean)
                    .join(' · ')
              || 'Event record',

            open:
            record =>
            {
                const owner =
                    placeInspectorEventOwnerIds(
                        record
                    )
                        .map(personId =>
                            getPerson(
                                personId
                            )
                        )
                        .find(person =>
                            person
                    && !person.deleted
                    && (
                        !record.projectId
                      || person.projectId
                        === record.projectId
                    )
                        );

                if (!owner)
                {
                    showToast(
                        'This event has no valid person owner.'
                    );

                    return;
                }

                openPlaceInspectorPerson(
                    owner.id
                );
            }
        }),

        photo: Object.freeze({
            field:
            'linkedPhotoIds',

            sectionKey:
            'photos',

            iconSvg:
            icon.image,

            chipTone:
            'photos',

            contextLabel:
            'Photo',

            title:
            'Photos',

            singular:
            'photo',

            plural:
            'photos',

            records:
            projectId =>
                getProjectPhotos(
                    projectId
                ),

            label:
            record =>
                record.title
              || record.filename
              || 'Untitled photo',

            meta:
            record =>
                [
                    formatPhotoDate(
                        record
                    ),

                    getPlaceDisplay(
                        record.placeId
                    )
                || record.placeText
                ]
                    .filter(Boolean)
                    .join(' · ')
              || 'Photo',

            open:
            record =>
            {
                openAlbumsForPhoto(
                    record.id
                );
            }
        }),

        source: Object.freeze({
            field:
            null,

            sectionKey:
            'sources',

            iconSvg:
            icon.archive,

            chipTone:
            'sources',

            contextLabel:
            'Source',

            title:
            'Sources',

            singular:
            'source',

            plural:
            'sources',

            records:
            projectId =>
                (
                    sampleData.sources || []
                ).filter(
                    source =>
                        source.projectId
                    === projectId
                ),

            label:
            record =>
                record.title
              || record.name
              || record.citation
              || record.id,

            meta:
            record =>
                [
                    record.providedBy,
                    record.reference
                ]
                    .filter(Boolean)
                    .join(' · ')
              || 'Source record',

            open:
            record =>
            {
                state.activeModule =
                    'Archive';

                state.archiveView =
                    'sources';

                state.archiveSelectedSourceId =
                    record.id;

                state.archiveInspectorCollapsed =
                    false;

                render();
            }
        }),

        archiveFile: Object.freeze({
            field:
            'linkedArchiveFileIds',

            sectionKey:
            'files',

            iconSvg:
            icon.file,

            chipTone:
            'files',

            contextLabel:
            'File',

            title:
            'Archive',

            singular:
            'file',

            plural:
            'files',

            records:
            projectId =>
                (
                    sampleData.archiveFiles
                || []
                ).filter(
                    file =>
                        !file.deleted
                  && (
                      !file.projectId
                    || file.projectId
                      === projectId
                  )
                ),

            label:
            record =>
                record.name
              || record.title
              || record.id,

            meta:
            record =>
                record.type
              || record.kind
              || 'Archive file',

            open:
            record =>
            {
                openPlaceInspectorArchiveFile(
                    record.id
                );
            }
        })
    });

function getNoteEntityConfig(
    type
)
{
    return (
        NOTE_ENTITY_TYPES[type]
        || null
    );
}

function noteEntityLinkedIds(
    note,
    type
)
{
    const config =
        getNoteEntityConfig(
            type
        );

    if (!note || !config)
    {
        return [];
    }

    if (type === 'source')
    {
        return sourceIdsForTarget(
            'note',
            note.id,
            note.projectId
        );
    }

    return normalizeCentralNoteIdArray(
        note[config.field] || []
    );
}

function noteEntityRecordsForNote(
    note,
    type
)
{
    if (
        !note
        || !getNoteEntityConfig(type)
    )
    {
        return [];
    }

    return noteEntityLinkedIds(
        note,
        type
    )
        .map(id =>
            noteEntityById(
                type,
                id,
                note.projectId
            )
        )
        .filter(Boolean);
}

function noteEntityRecords(
    type,
    projectId =
        currentProjectId()
)
{
    const config =
        getNoteEntityConfig(type);

    if (!config)
    {
        return [];
    }

    return config
        .records(projectId)
        .slice()
        .sort(
            (
                first,
                second
            ) =>
                config
                    .label(first)
                    .localeCompare(
                        config.label(second)
                    )
        );
}

function noteEntityById(
    type,
    id,
    projectId =
        currentProjectId()
)
{
    if (!id)
    {
        return null;
    }

    const config =
        getNoteEntityConfig(type);

    if (!config)
    {
        return null;
    }

    return (
        config
            .records(projectId)
            .find(
                record =>
                    record.id === id
            )
        || null
    );
}

function noteEntityLabel(
    type,
    record
)
{
    const config =
        getNoteEntityConfig(type);

    return (
        config && record
            ? config.label(record)
            : ''
    );
}

function noteEntityMeta(
    type,
    record
)
{
    const config =
        getNoteEntityConfig(type);

    return (
        config && record
            ? config.meta(record)
            : ''
    );
}

function openNoteEntity(
    type,
    record
)
{
    const config =
        getNoteEntityConfig(type);

    if (!config || !record)
    {
        return;
    }

    config.open(record);
}

function getNotesForEntity(
    type,
    id,
    {
        projectId =
            currentProjectId(),

        includeArchived =
            false
    } = {}
)
{
    const record =
        noteEntityById(
            type,
            id,
            projectId
        );

    if (!record)
    {
        return [];
    }

    return getProjectNotes(
        projectId,
        {
            includeArchived
        }
    ).filter(note =>
        noteEntityLinkedIds(
            note,
            type
        ).includes(
            id
        )
    );
}

function getNotesForEvent(
    eventId,
    options = {}
)
{
    return getNotesForEntity(
        'event',
        eventId,
        options
    );
}

function getNotesForSource(
    sourceId,
    options = {}
)
{
    return getNotesForEntity(
        'source',
        sourceId,
        options
    );
}

function getNotesForArchiveFile(
    fileId,
    options = {}
)
{
    return getNotesForEntity(
        'archiveFile',
        fileId,
        options
    );
}

function getNotesForPhoto(
    photoId,
    options = {}
)
{
    return getNotesForEntity(
        'photo',
        photoId,
        options
    );
}

function getPhotosForNote(
    noteId,
    {
        projectId =
            currentProjectId()
    } = {}
)
{
    const note =
        getNote(
            noteId,
            {
                projectId,
                includeArchived: true
            }
        );

    if (!note)
    {
        return [];
    }

    return (
        note.linkedPhotoIds || []
    )
        .map(photoId =>
            getPhoto(
                photoId,
                {
                    projectId:
                note.projectId
                }
            )
        )
        .filter(Boolean);
}

/*
      Shared mutation path for every
      Note-to-entity relationship.
    */
function setNoteEntityLinks(
    noteId,
    type,
    linkedIds,
    {
        projectId =
            currentProjectId(),

        touchUpdatedAt =
            true,

        refreshPreview =
            true
    } = {}
)
{
    const note =
        getNote(
            noteId,
            {
                projectId,
                includeArchived:
              true
            }
        );

    const config =
        getNoteEntityConfig(
            type
        );

    if (!note || !config)
    {
        return null;
    }

    // Validation only needs membership, not sorted display labels.
    const validIds = type === 'person'
        ? projectPeopleIndex(acquireProjectReadModel(note.projectId)).eligibleById
        : new Set(noteEntityRecords(type, note.projectId).map(record => record.id));

    const nextIds =
        normalizeCentralNoteIdArray(
            linkedIds
        ).filter(id =>
            validIds.has(id)
        );

    const currentIds =
        noteEntityLinkedIds(
            note,
            type
        );

    const unchanged =
        nextIds.length
          === currentIds.length
        && nextIds.every(
            (
                id,
                index
            ) =>
                id === currentIds[index]
        );

    if (unchanged)
    {
        return note;
    }

    if (type === 'source')
    {
        const savedIds =
            setSourceIdsForTarget(
                'note',
                note.id,
                nextIds,
                {
                    projectId:
                note.projectId
                }
            );

        if (!savedIds)
        {
            return null;
        }
    }
    else
    {
        note[config.field] =
            nextIds;
    }

    if (touchUpdatedAt)
    {
        if (type === 'source') markPrototypeSessionEdited(note.projectId, ['sources']);
        if (
            state.activeModule === 'Notes'
          && state.selectedNoteId
            === note.id
        )
        {
            touchNote(
                note,
                {
                    refreshPreview
                }
            );
        }
        else
        {
            note.updatedAt =
                new Date().toISOString();
            markPrototypeSessionEdited(note.projectId, ['notes']);
        }
    }

    return note;
}

function setNotePhotoLinks(
    noteId,
    photoIds,
    options = {}
)
{
    return setNoteEntityLinks(
        noteId,
        'photo',
        photoIds,
        options
    );
}

function removePhotosFromAllNotes(
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

    if (!ids.size)
    {
        return;
    }

    const now =
        new Date()
            .toISOString();

    sampleData.notes.forEach(
        note =>
        {
            const current =
                note.linkedPhotoIds || [];

            const next =
                current.filter(
                    photoId =>
                        !ids.has(photoId)
                );

            if (
                next.length
              === current.length
            )
            {
                return;
            }

            note.linkedPhotoIds =
                next;

            note.updatedAt =
                now;
        }
    );
}

function clearNotesContext()
{
    state.notesContext =
        null;
}

function setNotesContext(
    type,
    id,
    {
        projectId =
            currentProjectId()
    } = {}
)
{
    const record =
        noteEntityById(
            type,
            id,
            projectId
        );

    if (!record)
    {
        clearNotesContext();

        return null;
    }

    state.notesContext = {
        type,
        id:
          record.id,

        projectId
    };

    return record;
}

function activeNotesContext()
{
    const context =
        state.notesContext;

    if (!context)
    {
        return null;
    }

    if (
        context.projectId
          !== currentProjectId()
    )
    {
        clearNotesContext();

        return null;
    }

    const config =
        getNoteEntityConfig(
            context.type
        );

    const record =
        noteEntityById(
            context.type,
            context.id,
            context.projectId
        );

    if (!config || !record)
    {
        clearNotesContext();

        return null;
    }

    return {
        ...context,

        field:
          config.field,

        label:
          config.contextLabel,

        name:
          config.label(record),

        record
    };
}

function getNotesForContext(
    type,
    id,
    options = {}
)
{
    return getNotesForEntity(
        type,
        id,
        options
    );
}

function openNotesForContext(
    type,
    id
)
{
    const record =
        setNotesContext(
            type,
            id
        );

    if (!record)
    {
        return;
    }

    state.activeModule =
        'Notes';

    state.notesView =
        'all';

    state.notesActiveCollectionId =
        null;

    state.selectedNoteId =
        null;

    state.notesSearch =
        '';

    state.notesRightCollapsed =
        true;

    render();
}

function openCentralNoteFromContext(
    noteId,
    {
        type = '',
        id = ''
    } = {}
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
        return;
    }

    appNavigationMarkIntent();

    state.activeModule =
        'Notes';

    clearNotesContext();

    const config =
        getNoteEntityConfig(type);

    if (
        config
        && id
        && noteEntityLinkedIds(
            note,
            type
        ).includes(id)
    )
    {
        setNotesContext(
            type,
            id,
            {
                projectId:
              note.projectId
            }
        );
    }

    state.notesView =
        note.archived
            ? 'archived'
            : 'all';

    state.notesActiveCollectionId =
        null;

    state.selectedNoteId =
        note.id;

    state.notesSearch =
        '';

    state.notesRightCollapsed =
        false;

    state.notesMobilePane =
        'editor';

    render();
}

function openNewNoteForContext(
    type,
    id
)
{
    const record =
        noteEntityById(
            type,
            id
        );

    if (!record)
    {
        return null;
    }

    return createCentralNote({
        contextType:
          type,

        contextId:
          record.id
    });
}


function getRelatedNotes(
    noteId,
    {
        projectId =
            currentProjectId(),
        includeArchived = false
    } = {}
)
{
    const note =
        getNote(
            noteId,
            {
                projectId,
                includeArchived: true
            }
        );

    if (!note)
    {
        return [];
    }

    const relatedIds =
        new Set(
            note.relatedNoteIds || []
        );

    return getProjectNotes(
        note.projectId,
        {
            includeArchived
        }
    ).filter(relatedNote =>
        relatedIds.has(
            relatedNote.id
        )
    );
}

function noteExcerpt(
    note,
    maxLength = 160
)
{
    const text =
        String(
            localizedNoteBodyText(note?.body || '')
        )
            .replace(/\s+/g, ' ')
            .trim();

    if (
        !text
        || text.length <= maxLength
    )
    {
        return text;
    }

    const draft =
        text.slice(
            0,
            maxLength + 1
        );

    const boundary =
        draft.lastIndexOf(' ');

    const clipped =
        boundary > maxLength * 0.65
            ? draft.slice(0, boundary)
            : draft.slice(0, maxLength);

    return `${clipped.trim()}…`;
}

function noteExternalEntityCount(
    note
)
{
    return Object.keys(
        NOTE_ENTITY_TYPES
    ).reduce(
        (
            total,
            type
        ) =>
            total
          + new Set(
              noteEntityLinkedIds(
                  note,
                  type
              )
          ).size,

        0
    );
}

function noteLinkedEntityCount(
    note
)
{
    return (
        noteExternalEntityCount(
            note
        )
        + new Set(
            note?.relatedNoteIds
            || []
        ).size
    );
}

function formatNoteUpdatedAt(
    note
)
{
    const timestamp =
        Date.parse(
            note?.updatedAt || ''
        );

    if (
        !Number.isFinite(timestamp)
    )
    {
        return 'Unknown date';
    }

    return new Intl.DateTimeFormat(
        state.language === 'ru' ? 'ru-RU' : 'en-GB',
        {
            dateStyle: 'medium'
        }
    ).format(
        new Date(timestamp)
    );
}

function setNoteCollections(
    noteId,
    collectionIds,
    {
        projectId =
            currentProjectId(),
        touchUpdatedAt = true
    } = {}
)
{
    const note =
        getNote(
            noteId,
            {
                projectId,
                includeArchived: true
            }
        );

    if (!note)
    {
        return null;
    }

    const validCollectionIds =
        new Set(
            getProjectNoteCollections(
                note.projectId
            ).map(
                collection =>
                    collection.id
            )
        );

    const nextCollectionIds =
        normalizeCentralNoteIdArray(
            Array.isArray(collectionIds)
                ? collectionIds
                : []
        ).filter(collectionId =>
            validCollectionIds.has(
                collectionId
            )
        );

    const unchanged =
        nextCollectionIds.length
          === note.collectionIds.length
        && nextCollectionIds.every(
            (
                collectionId,
                index
            ) =>
                collectionId
              === note.collectionIds[
                  index
              ]
        );

    if (unchanged)
    {
        return note;
    }

    note.collectionIds =
        nextCollectionIds;
    if (touchUpdatedAt) markPrototypeSessionEdited();

    if (touchUpdatedAt)
    {
        note.updatedAt =
            new Date().toISOString();
    }

    return note;
}

function addNoteToCollection(
    noteId,
    collectionId,
    options = {}
)
{
    const note =
        getNote(
            noteId,
            {
                projectId:
              options.projectId
              || currentProjectId(),
                includeArchived: true
            }
        );

    if (!note)
    {
        return null;
    }

    return setNoteCollections(
        note.id,
        [
            ...note.collectionIds,
            collectionId
        ],
        options
    );
}

function removeNoteFromCollection(
    noteId,
    collectionId,
    options = {}
)
{
    const note =
        getNote(
            noteId,
            {
                projectId:
              options.projectId
              || currentProjectId(),
                includeArchived: true
            }
        );

    if (!note)
    {
        return null;
    }

    return setNoteCollections(
        note.id,
        note.collectionIds.filter(
            id =>
                id !== collectionId
        ),
        options
    );
}

function rememberNotesEditorContent(note)
{
    notesRichTextRuntime.content = { note, body: note.body, delta: note.bodyDelta, format: note.bodyFormat, language: state.language };
}

function notesEditorContentMatches(note)
{
    const content = notesRichTextRuntime.content;
    return content?.note === note && content.body === note.body && content.delta === note.bodyDelta
        && content.format === note.bodyFormat && content.language === state.language;
}

function destroyNotesRichTextEditor()
{
    notesRichTextRuntime.content = null;
    const instance =
        notesRichTextRuntime
            .instance;

    if (
        instance
        && notesRichTextRuntime
            .textChangeHandler
    )
    {
        instance.off(
            'text-change',
            notesRichTextRuntime
                .textChangeHandler
        );
    }

    if (
        instance
        && notesRichTextRuntime
            .selectionChangeHandler
    )
    {
        instance.off(
            'selection-change',
            notesRichTextRuntime
                .selectionChangeHandler
        );
    }

    notesRichTextRuntime.instance =
        null;

    notesRichTextRuntime.noteId =
        '';

    notesRichTextRuntime.toolbarElement =
        null;

    notesRichTextRuntime.editorElement =
        null;

    notesRichTextRuntime.fallbackElement =
        null;

    notesRichTextRuntime.textChangeHandler =
        null;

    notesRichTextRuntime.selectionChangeHandler =
        null;

    notesRichTextRuntime.lastSelection =
        null;

    notesRichTextRuntime.initializing =
        false;

    notesRichTextRuntime.fallbackActive =
        false;
}

function plainTextFromQuill(
    instance
)
{
    if (!instance)
    {
        return '';
    }

    const text =
        String(
            instance.getText() || ''
        );

    return text.endsWith('\n')
        ? text.slice(0, -1)
        : text;
}

function createRichTextQuill({
    editorHost,
    toolbar,
    bounds,
    placeholder =
        'Start writing…',

    toolbarLabel =
        'Text formatting',

    editorLabel =
        'Rich text'
})
{
    if (
        !editorHost
        || !toolbar
        || typeof window.Quill
          !== 'function'
    )
    {
        return null;
    }

    const instance =
        new window.Quill(
            editorHost,
            {
                theme: 'snow',

                placeholder: t(placeholder),

                bounds,

                formats: [
                    'header',
                    'size',

                    'bold',
                    'italic',
                    'underline',
                    'strike',

                    'color',
                    'background',

                    'blockquote',
                    'list',
                    'align',
                    'indent',

                    'link'
                ],

                modules: {
                    toolbar: {
                        container:
                  toolbar
                    },

                    history: {
                        delay: 1000,
                        maxStack: 100,
                        userOnly: true
                    }
                }
            }
        );

    prepareRichTextAccessibility(
        instance,
        toolbar,
        {
            toolbarLabel,
            editorLabel
        }
    );

    configureRichTextLinkControl(
        instance
    );

    return instance;
}

function prepareRichTextAccessibility(
    instance,
    toolbar,
    {
        toolbarLabel =
            'Text formatting',

        editorLabel =
            'Rich text'
    } = {}
)
{
    if (!instance || !toolbar)
    {
        return;
    }

    toolbar.setAttribute(
        'role',
        'toolbar'
    );

    toolbar.setAttribute(
        'aria-label',
        toolbarLabel
    );

    const controlLabels = [
        [
            'button.ql-bold',
            'Bold'
        ],

        [
            'button.ql-italic',
            'Italic'
        ],

        [
            'button.ql-underline',
            'Underline'
        ],

        [
            'button.ql-strike',
            'Strikethrough'
        ],

        [
            'button.ql-list[value="bullet"]',
            'Bulleted list'
        ],

        [
            'button.ql-list[value="ordered"]',
            'Numbered list'
        ],

        [
            'button.ql-indent[value="-1"]',
            'Decrease indent'
        ],

        [
            'button.ql-indent[value="+1"]',
            'Increase indent'
        ],

        [
            'button.ql-blockquote',
            'Block quote'
        ],

        [
            'button.ql-link',
            'Link'
        ],

        [
            'button.ql-clean',
            'Clear formatting'
        ]
    ];

    controlLabels.forEach(([
        selector,
        label
    ]) =>
    {
        const control =
            toolbar.querySelector(
                selector
            );

        if (!control)
        {
            return;
        }

        control.setAttribute(
            'aria-label',
            label
        );

        control.setAttribute(
            'title',
            label
        );
    });

    const pickerLabels = [
        [
            '.ql-picker.ql-header',
            'Text style'
        ],

        [
            '.ql-picker.ql-size',
            'Font size'
        ],

        [
            '.ql-picker.ql-color',
            'Text color'
        ],

        [
            '.ql-picker.ql-background',
            'Highlight color'
        ],

        [
            '.ql-picker.ql-align',
            'Alignment'
        ]
    ];

    pickerLabels.forEach(([
        selector,
        label
    ]) =>
    {
        const picker =
            toolbar.querySelector(
                selector
            );

        const pickerLabel =
            picker?.querySelector(
                '.ql-picker-label'
            );

        if (!pickerLabel)
        {
            return;
        }

        pickerLabel.setAttribute(
            'aria-label',
            label
        );

        pickerLabel.setAttribute(
            'title',
            label
        );
    });

    const sizeLabels = {
        small: 'Small',
        large: 'Large',
        huge: 'Huge'
    };

    toolbar
        .querySelectorAll(
            '.ql-picker.ql-size .ql-picker-item'
        )
        .forEach(item =>
        {
            const value =
                item.dataset.value || '';

            const label =
                sizeLabels[value]
            || 'Normal';

            item.setAttribute(
                'aria-label',
                label
            );

            item.setAttribute(
                'title',
                label
            );
        });

    const alignmentLabels = {
        center: 'Center',
        right: 'Right',
        justify: 'Justify'
    };

    toolbar
        .querySelectorAll(
            '.ql-picker.ql-align .ql-picker-item'
        )
        .forEach(item =>
        {
            const value =
                item.dataset.value || '';

            const label =
                alignmentLabels[value]
            || 'Left';

            item.setAttribute(
                'aria-label',
                label
            );

            item.setAttribute(
                'title',
                label
            );
        });

    [
        [
            '.ql-picker.ql-color',
            'Text color',
            'Default text color'
        ],

        [
            '.ql-picker.ql-background',
            'Highlight',
            'No highlight'
        ]
    ].forEach(([
        selector,
        prefix,
        defaultLabel
    ]) =>
    {
        toolbar
            .querySelectorAll(
                `${selector} .ql-picker-item`
            )
            .forEach(item =>
            {
                const value =
                    item.dataset.value || '';

                const label =
                    value
                        ? `${prefix} ${value}`
                        : defaultLabel;

                item.setAttribute(
                    'aria-label',
                    label
                );

                item.setAttribute(
                    'title',
                    label
                );
            });
    });

    instance.root.setAttribute(
        'aria-label',
        editorLabel
    );

    instance.root.setAttribute(
        'aria-multiline',
        'true'
    );

    instance.root.setAttribute(
        'spellcheck',
        'true'
    );
}

function configureRichTextLinkControl(
    instance
)
{
    if (!instance)
    {
        return;
    }

    const toolbarModule =
        instance.getModule(
            'toolbar'
        );

    const tooltip =
        instance.theme
            ?.tooltip;

    if (
        !toolbarModule
        || !tooltip
    )
    {
        return;
    }

    const getLinkInput =
        () =>
            tooltip.textbox
          || tooltip.root
              ?.querySelector(
                  'input[type="text"]'
              )
          || null;

    const prepareLinkInput =
        () =>
        {
            const input =
                getLinkInput();

            if (!input)
            {
                return null;
            }

            input.placeholder =
                'Paste or enter a URL';

            input.setAttribute(
                'aria-label',
                'Link URL'
            );

            input.setAttribute(
                'autocomplete',
                'url'
            );

            input.setAttribute(
                'inputmode',
                'url'
            );

            return input;
        };

    /*
        Override Quill Snow's default handler.

        The standard handler copies selected
        editor text into the URL input. For
        GeneoGraph, new links should begin with
        an empty URL field.
      */
    toolbarModule.addHandler(
        'link',
        value =>
        {
            /*
            Quill passes false when the active
            Link button is clicked. Preserve
            the normal unlink behaviour.
          */
            if (!value)
            {
                instance.format(
                    'link',
                    false,
                    'user'
                );

                return;
            }

            /*
            focus=true restores Quill's saved
            selection after the toolbar button
            receives focus.
          */
            const range =
                instance.getSelection(
                    true
                );

            if (
                !range
            || range.length === 0
            )
            {
                showToast(
                    'Select text before adding a link.'
                );

                return;
            }

            /*
            Open Quill's normal link editor,
            but pass an empty preview value
            instead of the selected word.
          */
            tooltip.edit(
                'link',
                ''
            );

            const input =
                prepareLinkInput();

            if (!input)
            {
                return;
            }

            input.value =
                '';

            requestAnimationFrame(
                () =>
                {
                    input.focus();

                    if (
                        typeof input
                            .setSelectionRange
                  === 'function'
                    )
                    {
                        input.setSelectionRange(
                            0,
                            0
                        );
                    }
                }
            );
        }
    );

    prepareLinkInput();
}

function bindNotesBodyFallback(
    note,
    {
        announce = true
    } = {}
)
{
    const shell =
        main.querySelector(
            '.notes-rich-editor-shell'
        );

    const toolbar =
        main.querySelector(
            '#notesRichTextToolbar'
        );

    const editorHost =
        main.querySelector(
            '#notesRichTextEditor'
        );

    const textarea =
        main.querySelector(
            '#notesBodyInput'
        );

    if (!textarea)
    {
        return;
    }

    toolbar?.setAttribute(
        'hidden',
        ''
    );

    editorHost?.setAttribute(
        'hidden',
        ''
    );

    textarea.hidden =
        false;

    textarea.value =
        localizedNoteBodyText(
            String(
                note?.body || ''
            )
        );

    shell?.classList.add(
        'is-fallback'
    );

    notesRichTextRuntime.fallbackActive =
        true;

    notesRichTextRuntime.noteId =
        note?.id || '';

    notesRichTextRuntime.fallbackElement =
        textarea;
    rememberNotesEditorContent(note);

    textarea.addEventListener(
        'input',
        event =>
        {
            if (notesRichTextRuntime.fallbackElement !== textarea) return;
            const currentNote =
                getNote(
                    note.id,
                    {
                        projectId:
                  note.projectId,

                        includeArchived:
                  true
                    }
                );

            if (!currentNote)
            {
                return;
            }

            currentNote.body =
                event.currentTarget.value;

            currentNote.bodyDelta =
                null;

            currentNote.bodyFormat =
                '';

            autoSizeNoteBody(event.currentTarget);
            rememberNotesEditorContent(currentNote);
            touchNote(currentNote, { bodyOnly: true });
        }
    );

    autoSizeNoteBody(
        textarea
    );

    if (
        announce
        && !notesRichTextRuntime
            .fallbackToastShown
    )
    {
        notesRichTextRuntime.fallbackToastShown =
            true;

        showToast(
            'Rich text is unavailable. Note opened in plain-text mode.'
        );
    }
}

function initializeNotesRichTextEditor(note)
{
    if (typeof appPerf === 'undefined' || !appPerf.enabled('Notes')) return initializeNotesRichTextEditorWithDiagnosticsBody(note);
    const trace = appPerf.currentDetailed('Notes');
    if (!trace) return appPerf.run('Notes', 'editor', () =>
        appPerf.measure(appPerf.currentDetailed('Notes'), 'editor', () => initializeNotesRichTextEditorWithDiagnosticsBody(note)));
    const result = appPerf.measure(trace, 'editor', () => initializeNotesRichTextEditorWithDiagnosticsBody(note));
    return result;
}

function initializeNotesRichTextEditorWithDiagnosticsBody(
    note
)
{
    if (!note)
    {
        return;
    }

    const shell =
        main.querySelector(
            '.notes-rich-editor-shell'
        );

    const toolbar =
        main.querySelector(
            '#notesRichTextToolbar'
        );

    const editorHost =
        main.querySelector(
            '#notesRichTextEditor'
        );

    const fallback =
        main.querySelector(
            '#notesBodyInput'
        );

    if (
        !shell
        || !toolbar
        || !editorHost
        || !fallback
    )
    {
        return;
    }

    if (
        typeof window.Quill
          !== 'function'
    )
    {
        bindNotesBodyFallback(
            note
        );

        return;
    }

    notesRichTextRuntime.initializing =
        true;

    try
    {
        toolbar.hidden =
            false;

        editorHost.hidden =
            false;

        fallback.hidden =
            true;

        shell.classList.remove(
            'is-fallback'
        );

        const instance =
            createRichTextQuill({
                editorHost,
                toolbar,
                bounds: shell,

                placeholder:
              'Start writing…',

                toolbarLabel:
              'Note formatting',

                editorLabel:
              'Note body'
            });

        if (!instance)
        {
            bindNotesBodyFallback(
                note
            );

            notesRichTextRuntime.initializing =
                false;

            return;
        }

        const storedDelta =
            cloneRichTextDelta(
                note.bodyDelta
            );

        if (storedDelta)
        {
            instance.setContents(
                localizedNoteBodyDelta(storedDelta),
                'silent'
            );
        }
        else
        {
            instance.setText(
                localizedNoteBodyText(
                    String(
                        note.body || ''
                    )
                ),
                'silent'
            );
        }

        instance.history.clear();

        notesRichTextRuntime.instance =
            instance;

        notesRichTextRuntime.noteId =
            note.id;

        notesRichTextRuntime.toolbarElement =
            toolbar;

        notesRichTextRuntime.editorElement =
            editorHost;

        notesRichTextRuntime.fallbackElement =
            fallback;

        notesRichTextRuntime.fallbackActive =
            false;
        rememberNotesEditorContent(note);

        const textChangeHandler = (
            delta,
            oldDelta,
            source
        ) =>
        {
            if (
                source !== 'user'
            || notesRichTextRuntime
                .instance !== instance
            || notesRichTextRuntime
                .noteId !== note.id
            )
            {
                return;
            }

            const currentNote =
                getNote(
                    note.id,
                    {
                        projectId:
                  note.projectId,

                        includeArchived:
                  true
                    }
                );

            if (!currentNote)
            {
                return;
            }

            currentNote.bodyDelta =
                normalizeRichTextDelta(
                    instance.getContents()
                );

            currentNote.bodyFormat =
                currentNote.bodyDelta
                    ? 'quill-delta-v1'
                    : '';

            currentNote.body =
                plainTextFromQuill(instance);
            rememberNotesEditorContent(currentNote);
            touchNote(currentNote, { bodyOnly: true });
        };

        const selectionChangeHandler =
            range =>
            {
                notesRichTextRuntime.lastSelection =
                    range
                        ? {
                            index:
                      range.index,

                            length:
                      range.length
                        }
                        : null;
            };

        notesRichTextRuntime.textChangeHandler =
            textChangeHandler;

        notesRichTextRuntime.selectionChangeHandler =
            selectionChangeHandler;

        instance.on(
            'text-change',
            textChangeHandler
        );

        instance.on(
            'selection-change',
            selectionChangeHandler
        );

        notesRichTextRuntime.initializing =
            false;
    }
    catch (error)
    {
        console.warn(
            '[Notes rich text]',
            error
        );

        destroyNotesRichTextEditor();

        bindNotesBodyFallback(
            note
        );
    }
}

