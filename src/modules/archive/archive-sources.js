// ---------- Archive: genealogy file manager MVP ----------

sampleData.archiveFolders = [
    { id: 'pawford', projectId: 'p1', parentId: 'null', name: 'Family records', createdAt: '2026-01-04T10:00:00Z', updatedAt: '2026-06-02T10:00:00Z' },
    { id: 'fond12', projectId: 'p1', parentId: 'pawford', name: 'Births', createdAt: '2026-01-04T10:00:00Z', updatedAt: '2026-06-02T10:00:00Z' },
    { id: 'certificates', projectId: 'p1', parentId: 'pawford', name: 'Marriages', createdAt: '2026-01-04T10:00:00Z', updatedAt: '2026-05-19T10:00:00Z' },
    { id: 'interviews', projectId: 'p1', parentId: 'pawford', name: 'Correspondence', createdAt: '2026-01-04T10:00:00Z', updatedAt: '2026-04-05T10:00:00Z' },
    { id: 'documents', projectId: 'p1', parentId: 'null', name: 'Research trips', createdAt: '2026-01-04T10:00:00Z', updatedAt: '2026-05-19T10:00:00Z' },
    { id: 'opis3', projectId: 'p1', parentId: 'documents', name: 'Pawford', createdAt: '2026-01-04T10:00:00Z', updatedAt: '2026-06-02T10:00:00Z' },
    { id: 'delo44', projectId: 'p1', parentId: 'opis3', name: 'Register extracts', createdAt: '2026-01-04T10:00:00Z', updatedAt: '2026-06-02T10:00:00Z' },
    { id: 'delo45', projectId: 'p1', parentId: 'documents', name: 'Meowbridge', createdAt: '2026-01-04T10:00:00Z', updatedAt: '2026-05-28T10:00:00Z' },
    { id: 'albums-origin', projectId: 'p1', parentId: 'null', name: 'To identify', createdAt: '2026-01-04T10:00:00Z', updatedAt: '2026-03-29T10:00:00Z' },
    { id: 'unsorted', projectId: 'p1', parentId: 'null', name: 'Future research', createdAt: '2026-01-04T10:00:00Z', updatedAt: '2026-06-02T10:00:00Z' }
];

const SOURCE_CATEGORIES =
    Object.freeze([
        Object.freeze({
            value:
            'institution',

            label:
            'Archive, library, or institution',

            shortLabel:
            'Institutions'
        }),

        Object.freeze({
            value:
            'online',

            label:
            'Website or online database',

            shortLabel:
            'Online sources'
        }),

        Object.freeze({
            value:
            'publication',

            label:
            'Book, newspaper, or publication',

            shortLabel:
            'Publications'
        }),

        Object.freeze({
            value:
            'person',

            label:
            'Person, interview, or correspondence',

            shortLabel:
            'People & correspondence'
        }),

        Object.freeze({
            value:
            'private-collection',

            label:
            'Family or personal collection',

            shortLabel:
            'Family & personal'
        }),

        Object.freeze({
            value:
            'other',

            label:
            'Other source',

            shortLabel:
            'Other'
        })
    ]);

const SOURCE_CATEGORY_BY_VALUE =
    new Map(
        SOURCE_CATEGORIES.map(
            category => [
                category.value,
                category
            ]
        )
    );

function sourceCategoryLabel(
    value,
    fallback =
        'Not categorized'
)
{
    return SOURCE_CATEGORY_BY_VALUE
        .get(value)
        ?.label
        || fallback;
}

function localizedSourceCategoryLabel(
    value,
    fallback =
        'Not categorized'
)
{
    const label =
        sourceCategoryLabel(
            value,
            fallback
        );

    return label
        ? translateText(label)
        : '';
}

sampleData.sources = [
    {
        id:
          'as1',

        projectId:
          'p1',

        title:
          'Pawford County Archive — parish and household registers',

        category:
          'institution',

        providedBy:
          'Pawford County Archive',

        location:
          'North Yorkshire, England',

        reference:
          'Register collection 12 / household series 3',

        url:
          '',

        accessedDate:
          '2026-05-24',

        notes:
          'County archive material used for Pawford household and parish research.',

        favorite:
          true,

        createdAt:
          '2026-01-04T10:00:00Z',

        updatedAt:
          '2026-06-02T10:00:00Z'
    },

    {
        id:
          'as2',

        projectId:
          'p1',

        title:
          'Pawford birth announcements, 1990–2000',

        category:
          'institution',

        providedBy:
          'Pawford County Archive',

        location:
          'Pawford, North Yorkshire, England',

        reference:
          'Birth notices collection, 1990–2000',

        url:
          '',

        accessedDate:
          '2026-05-28',

        notes:
          'Announcement extracts used to verify names and birth dates.',

        favorite:
          false,

        createdAt:
          '2026-02-01T10:00:00Z',

        updatedAt:
          '2026-05-28T10:00:00Z'
    },

    {
        id:
          'as3',

        projectId:
          'p1',

        title:
          'Meowbridge marriage certificate held in family documents',

        category:
          'private-collection',

        providedBy:
          'Whiskerfield family documents',

        location:
          'Pawford, North Yorkshire, England',

        reference:
          'Certificate folder, item 2',

        url:
          '',

        accessedDate:
          '',

        notes:
          'Original certificate scan retained by the family.',

        favorite:
          true,

        createdAt:
          '2026-03-01T10:00:00Z',

        updatedAt:
          '2026-05-19T10:00:00Z'
    },

    {
        id:
          'as4',

        projectId:
          'p1',

        title:
          'Interview with Luna Purrington, 2 April 2026',

        category:
          'person',

        providedBy:
          'Luna Purrington',

        location:
          'Online interview',

        reference:
          'Audio interview 2026-04-02',

        url:
          '',

        accessedDate:
          '2026-04-02',

        notes:
          'Recorded family-history interview covering stories from 1940 to 1990.',

        favorite:
          false,

        createdAt:
          '2026-04-02T10:00:00Z',

        updatedAt:
          '2026-04-05T10:00:00Z'
    },

    {
        id:
          'as5',

        projectId:
          'p1',

        title:
          'Whiskerfield family reference collection',

        category:
          'private-collection',

        providedBy:
          'Silver Whiskerfield',

        location:
          'Pawford, North Yorkshire, England',

        reference:
          'Reference box A',

        url:
          '',

        accessedDate:
          '',

        notes:
          'Mixed family reference material, clippings, and album documentation.',

        favorite:
          false,

        createdAt:
          '2026-03-20T10:00:00Z',

        updatedAt:
          '2026-03-29T10:00:00Z'
    },

    {
        id:
          'as6',

        projectId:
          'p1',

        title:
          'Regional genealogy database — Pawford records',

        category:
          'online',

        providedBy:
          'Regional genealogy database',

        location:
          '',

        reference:
          'Pawford record collection, 1900–1950',

        url:
          'https://example.org/pawford-records',

        accessedDate:
          '2026-06-01',

        notes:
          'Online index and document extracts for the Pawford area.',

        favorite:
          false,

        createdAt:
          '2026-06-01T10:00:00Z',

        updatedAt:
          '2026-06-01T10:00:00Z'
    }
];

function sourceCategoryShortLabel(
    value,
    fallback =
        'Not categorized'
)
{
    return SOURCE_CATEGORY_BY_VALUE
        .get(value)
        ?.shortLabel
        || fallback;
}

function localizedSourceCategoryShortLabel(
    value,
    fallback =
        'Not categorized'
)
{
    const label =
        sourceCategoryShortLabel(
            value,
            fallback
        );

    return label
        ? translateText(label)
        : '';
}

sampleData.archiveFiles = [
    {
        id: 'af1', projectId: 'p1', folderId: 'delo44', name: 'pawford_household_register_2004.png', kind: 'img', type: 'Image', mimeType: 'image/png', size: '2.7 MB', sizeBytes: 2782928,
        previewUrl: 'assets/documents/pawford-household-register-sample.png', favorite: true,
        description: 'Sample register table with four family names on separate lines.',
        documentDate: { type: 'Exact date', value: '2004' }, linkedPersonIds: ['barnaby', 'daisy', 'silver', 'luna'],
        personRegions: { barnaby: { x: 0.05, y: 0.43, width: 0.29, height: 0.06 }, daisy: { x: 0.05, y: 0.54, width: 0.28, height: 0.06 }, silver: { x: 0.05, y: 0.66, width: 0.29, height: 0.06 }, luna: { x: 0.05, y: 0.78, width: 0.27, height: 0.06 } },
        linkedEventIds: [], linkedNoteIds: [], linkedPlaceIds: ['place-pawford'], placeIds: ['place-pawford'],
        addedAt: '2026-06-02T09:20:00Z', updatedAt: '2026-06-02T09:20:00Z', added: 'Jun 2, 2026', updated: 'Jun 2, 2026'
    },
    {
        id: 'af2', projectId: 'p1', folderId: 'albums-origin', name: 'unidentified_studio_portrait.jpg', kind: 'img', type: 'Image', mimeType: 'image/jpeg', size: '153 KB', sizeBytes: 156569,
        previewUrl: 'assets/photos/unidentified-studio-portrait.jpg', favorite: false,
        description: 'Unidentified studio portrait awaiting a person link and date.',
        documentDate: { type: 'Unknown', value: '' }, linkedPersonIds: [], linkedEventIds: [], linkedNoteIds: [], linkedPlaceIds: [], placeIds: [],
        addedAt: '2026-06-02T08:40:00Z', updatedAt: '2026-06-02T08:40:00Z', added: 'Jun 2, 2026', updated: 'Jun 2, 2026'
    },
    {
        id: 'af3', projectId: 'p1', folderId: 'opis3', name: 'pawford_register_index_page_12.png', kind: 'img', type: 'Image', mimeType: 'image/png', size: '2.5 MB', sizeBytes: 2592368,
        previewUrl: 'assets/documents/pawford-register-index-sample.png', favorite: false,
        description: 'Name index pointing to the household register page.',
        documentDate: { type: 'Unknown', value: '' }, linkedPersonIds: ['barnaby', 'silver'],
        personRegions: { barnaby: { x: 0.14, y: 0.47, width: 0.55, height: 0.06 }, silver: { x: 0.14, y: 0.66, width: 0.55, height: 0.06 } },
        linkedEventIds: [], linkedNoteIds: [], linkedPlaceIds: ['place-pawford'], placeIds: ['place-pawford'],
        addedAt: '2026-06-01T14:10:00Z', updatedAt: '2026-06-01T14:10:00Z', added: 'Jun 1, 2026', updated: 'Jun 1, 2026'
    },
    {
        id: 'af4', projectId: 'p1', folderId: 'interviews', name: 'daisy_letter_to_luna_2006.png', kind: 'img', type: 'Image', mimeType: 'image/png', size: '2.5 MB', sizeBytes: 2619679,
        previewUrl: 'assets/documents/daisy-letter-sample.png', favorite: false,
        description: 'Sample family letter from Daisy to Luna about preserving photographs.',
        documentDate: { type: 'Exact date', value: '12 Apr 2006' }, linkedPersonIds: ['daisy', 'luna'],
        personRegions: { daisy: { x: 0.07, y: 0.71, width: 0.48, height: 0.15 }, luna: { x: 0.07, y: 0.24, width: 0.14, height: 0.05 } },
        linkedEventIds: [], linkedNoteIds: [], linkedPlaceIds: ['place-pawford'], placeIds: ['place-pawford'],
        addedAt: '2026-05-28T12:00:00Z', updatedAt: '2026-05-28T12:00:00Z', added: 'May 28, 2026', updated: 'May 28, 2026'
    },
    {
        id: 'af5', projectId: 'p1', folderId: 'certificates', name: 'silver_luna_marriage_record_2023.png', kind: 'img', type: 'Image', mimeType: 'image/png', size: '2.3 MB', sizeBytes: 2427635,
        previewUrl: 'assets/documents/silver-luna-marriage-record-sample.png', favorite: true,
        description: 'Sample marriage extract for Silver and Luna in Meowbridge.',
        documentDate: { type: 'Exact date', value: '18 Aug 2023' }, linkedPersonIds: ['silver', 'luna'],
        personRegions: { silver: { x: 0.065, y: 0.56, width: 0.22, height: 0.06 }, luna: { x: 0.32, y: 0.56, width: 0.2, height: 0.06 } },
        linkedEventIds: ['event-rel-silver-luna-partner-rel-silver-luna-partner-marriage'], linkedNoteIds: [], linkedPlaceIds: ['place-meowbridge'], placeIds: ['place-meowbridge'],
        addedAt: '2026-05-19T10:00:00Z', updatedAt: '2026-05-19T10:00:00Z', added: 'May 19, 2026', updated: 'May 19, 2026'
    },
    {
        id: 'af7', projectId: 'p1', folderId: 'fond12', name: 'silver_birth_announcement_1998.png', kind: 'img', type: 'Image', mimeType: 'image/png', size: '2.3 MB', sizeBytes: 2379200,
        previewUrl: 'assets/documents/silver-birth-announcement-sample-v2.png', favorite: false,
        description: 'Sample birth announcement for Silver Whiskerfield.',
        documentDate: { type: 'Exact date', value: '03 Mar 1998' }, linkedPersonIds: ['silver'],
        personRegions: { silver: { x: 0.23, y: 0.36, width: 0.54, height: 0.13 } },
        linkedEventIds: ['event-silver-birth'], linkedNoteIds: [], linkedPlaceIds: ['place-pawford'], placeIds: ['place-pawford'],
        addedAt: '2026-03-29T10:00:00Z', updatedAt: '2026-03-29T10:00:00Z', added: 'Mar 29, 2026', updated: 'Mar 29, 2026'
    },
    {
        id: 'af-birth-sample', projectId: 'p1', folderId: 'fond12', name: 'daisy_birth_record_1949.png', kind: 'img', type: 'Image', mimeType: 'image/png', size: '2.2 MB', sizeBytes: 2347971,
        previewUrl: 'assets/documents/daisy-birth-record-sample.png', favorite: false,
        description: 'Illustrative birth-record extract for Daisy Whiskerfield.',
        documentDate: { type: 'Exact date', value: '03 Jun 1949' }, linkedPersonIds: ['daisy'], personRegions: { daisy: { x: 0.14, y: 0.36, width: 0.72, height: 0.12 } },
        linkedEventIds: ['event-daisy-birth'], linkedNoteIds: [], linkedPlaceIds: ['place-pawford'], placeIds: ['place-pawford'],
        addedAt: '2026-06-02T09:25:00Z', updatedAt: '2026-06-02T09:25:00Z', added: 'Jun 2, 2026', updated: 'Jun 2, 2026'
    },
    {
        id: 'af-letter-transcription', projectId: 'p1', folderId: 'interviews', name: 'daisy_letter_transcription.txt', kind: 'doc', type: 'Text', mimeType: 'text/plain', assetUrl: 'assets/documents/daisy_letter_transcription.txt', size: '1 KB', favorite: false,
        description: 'Transcription of Daisy’s letter to Luna.', linkedPersonIds: ['daisy', 'luna'], linkedEventIds: [], linkedNoteIds: [], linkedPlaceIds: ['place-pawford'], placeIds: ['place-pawford'],
        addedAt: '2026-06-02T09:30:00Z', updatedAt: '2026-06-02T09:30:00Z'
    },
    {
        id: 'af-pawford-trip', projectId: 'p1', folderId: 'opis3', name: 'pawford_visit_notes.docx', kind: 'doc', type: 'Document', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', assetUrl: 'assets/documents/pawford_visit_notes.docx', size: '37 KB', sizeBytes: 37210, favorite: false,
        description: 'Research notes from a visit to Pawford.', linkedPersonIds: ['barnaby', 'daisy'], linkedEventIds: [], linkedNoteIds: [], linkedPlaceIds: ['place-pawford'], placeIds: ['place-pawford'],
        addedAt: '2026-06-02T09:31:00Z', updatedAt: '2026-06-02T09:31:00Z'
    },
    {
        id: 'af-household-csv', projectId: 'p1', folderId: 'delo44', name: 'pawford_household_index.csv', kind: 'sheet', type: 'CSV', mimeType: 'text/csv', assetUrl: 'assets/documents/pawford_household_index.csv', size: '1 KB', favorite: false,
        description: 'Searchable transcription of the household register index.', linkedPersonIds: ['barnaby', 'daisy', 'silver', 'luna'], linkedEventIds: [], linkedNoteIds: [], linkedPlaceIds: ['place-pawford'], placeIds: ['place-pawford'],
        addedAt: '2026-06-02T09:32:00Z', updatedAt: '2026-06-02T09:32:00Z'
    },
    {
        id: 'af-marriage-packet', projectId: 'p1', folderId: 'certificates', name: 'silver_luna_marriage_packet.pdf', kind: 'pdf', type: 'PDF', mimeType: 'application/pdf', assetUrl: 'assets/documents/silver_luna_marriage_packet.pdf', size: '4 KB', sizeBytes: 3229, favorite: false,
        description: 'Research packet for Silver and Luna’s marriage.', linkedPersonIds: ['silver', 'luna'], linkedEventIds: ['event-rel-silver-luna-partner-rel-silver-luna-partner-marriage'], linkedNoteIds: [], linkedPlaceIds: ['place-meowbridge'], placeIds: ['place-meowbridge'],
        addedAt: '2026-06-02T09:33:00Z', updatedAt: '2026-06-02T09:33:00Z'
    }
];

sampleData.archiveImports = [];
sampleData.archiveIssues = [];

function archiveFolderById(id, projectId = currentProjectId())
{
    if (!id || !projectId) return null;
    return (sampleData.archiveFolders || []).find(folder =>
        folder.id === id
        && folder.projectId === projectId
    ) || null;
}

function archiveFileById(id, projectId = currentProjectId())
{
    if (!id || !projectId) return null;
    return (sampleData.archiveFiles || []).find(file =>
        file.id === id
        && file.projectId === projectId
    ) || null;
}

function archiveSourceById(id, projectId = currentProjectId())
{
    if (!id || !projectId) return null;
    return (sampleData.sources || []).find(source =>
        source.id === id
        && source.projectId === projectId
    ) || null;
}

const SOURCE_LINK_TARGET_TYPES =
    Object.freeze([
        'file',
        'photo',
        'person',
        'event',
        'note',
        'place'
    ]);

function sourceTargetRecord(
    targetType,
    targetId,
    projectId =
        currentProjectId()
)
{
    if (
        !SOURCE_LINK_TARGET_TYPES.includes(
            targetType
        )
        || !targetId
    )
    {
        return null;
    }

    let record =
        null;

    if (targetType === 'file')
    {
        record =
            archiveFileById(
                targetId,
                projectId
            );
    }
    else if (
        targetType === 'photo'
    )
    {
        record =
            getPhoto(
                targetId,
                {
                    projectId
                }
            );
    }
    else if (
        targetType === 'person'
    )
    {
        record =
            getPerson(
                targetId
            );
    }
    else if (
        targetType === 'event'
    )
    {
        record =
            (
                sampleData.events || []
            ).find(event =>
                event.id === targetId
            )
          || null;
    }
    else if (
        targetType === 'note'
    )
    {
        record =
            getNote(
                targetId,
                {
                    projectId,
                    includeArchived:
                true
                }
            );
    }
    else if (
        targetType === 'place'
    )
    {
        record =
            getPlace(
                targetId
            );
    }

    if (
        !record
        || (
            projectId
          && record.projectId
          && record.projectId
            !== projectId
        )
    )
    {
        return null;
    }

    return record;
}

function sourceLinksForProject(
    projectId =
        currentProjectId()
)
{
    return (
        sampleData.sourceLinks || []
    ).filter(link =>
        !projectId
        || link.projectId
          === projectId
    );
}

function sourceLinksForSource(
    sourceId,
    targetType = '',
    projectId =
        currentProjectId()
)
{
    return sourceLinksForProject(
        projectId
    ).filter(link =>
        link.sourceId === sourceId
        && (
            !targetType
          || link.targetType
            === targetType
        )
    );
}

function sourceLinksForTarget(
    targetType,
    targetId,
    projectId =
        currentProjectId()
)
{
    return sourceLinksForProject(
        projectId
    ).filter(link =>
        link.targetType === targetType
        && link.targetId === targetId
    );
}

function sourceTargetIds(
    sourceId,
    targetType,
    projectId =
        currentProjectId()
)
{
    return archiveUniqueIds(
        sourceLinksForSource(
            sourceId,
            targetType,
            projectId
        ).map(link =>
            link.targetId
        )
    );
}

function sourceIdsForTarget(
    targetType,
    targetId,
    projectId =
        currentProjectId()
)
{
    return archiveUniqueIds(
        sourceLinksForTarget(
            targetType,
            targetId,
            projectId
        ).map(link =>
            link.sourceId
        )
    );
}

function connectedSourceTargetLabel(
    targetType,
    target
)
{
    if (!target)
    {
        return 'record';
    }

    if (targetType === 'person')
    {
        return (
            personResourceDisplayName(target)
          || target.name
          || 'person'
        );
    }

    if (targetType === 'photo')
    {
        return (
            target.title
          || target.filename
          || 'photo'
        );
    }

    if (targetType === 'file')
    {
        return (
            target.name
          || target.title
          || 'file'
        );
    }

    if (targetType === 'event')
    {
        return (
            target.title
          || target.typeLabel
          || target.type
          || 'event'
        );
    }

    if (targetType === 'note')
    {
        return (
            target.title
          || 'note'
        );
    }

    if (targetType === 'place')
    {
        return (
            placeDisplayText(target)
          || target.name
          || 'place'
        );
    }

    return (
        target.title
        || target.name
        || 'record'
    );
}

function currentArchiveSourceTargetFilter()
{
    const filter =
        state.archiveSourceTargetFilter;

    if (
        !filter
        || !SOURCE_LINK_TARGET_TYPES.includes(
            filter.targetType
        )
        || !filter.targetId
        || filter.projectId
          !== currentProjectId()
    )
    {
        return null;
    }

    const target =
        sourceTargetRecord(
            filter.targetType,
            filter.targetId,
            filter.projectId
        );

    return target
        ? {
            ...filter,
            target
        }
        : null;
}

function openArchiveSourcesForTarget({
    targetType,
    targetId,
    projectId =
        currentProjectId()
})
{
    const target =
        sourceTargetRecord(
            targetType,
            targetId,
            projectId
        );

    if (!target)
    {
        showToast(
            'The connected record is no longer available.'
        );

        return;
    }

    const sourceIds =
        sourceIdsForTarget(
            targetType,
            targetId,
            projectId
        );

    const activated =
        activateProject(
            projectId,
            {
                moduleName:
              'Archive',

                renderNow:
              false,

                reset:
              false
            }
        );

    if (!activated)
    {
        return;
    }

    state.archiveView =
        'sources';

    state.archiveSearch =
        '';

    state.archiveSourceCategoryFilter =
        'all';

    state.archiveSourceConnectionFilter =
        'all';

    state.archiveSourceFavouriteOnly =
        false;

    state.archiveSourceTargetFilter = {
        targetType,
        targetId,
        projectId
    };

    state.archiveSelectedSourceId =
        sourceIds[0]
        || null;

    state.archiveSelectedFileId =
        null;

    state.archiveSelectedFileIds =
        [];

    state.archiveInspectorCollapsed =
        false;

    render();
}

function archiveEventEvidencePeople(event, projectId)
{
    if (!event || event.projectId !== projectId || !Array.isArray(event.personIds))
    {
        return null;
    }

    const people = [...new Set(event.personIds)].map(personId => getPerson(personId));
    return people.every(person => person && person.projectId === projectId)
        ? people
        : null;
}

function backfillEventEvidencePeople()
{
    (sampleData.archiveFiles || []).forEach(file =>
    {
        (file.linkedEventIds || []).forEach(eventId =>
        {
            const event = archiveConnectionRecord('event', eventId);
            const people = archiveEventEvidencePeople(event, file.projectId);
            if (people)
            {
                file.linkedPersonIds = [...new Set([
                    ...(file.linkedPersonIds || []),
                    ...people.map(person => person.id)
                ])];
            }
        });
    });

    (sampleData.sourceLinks || []).filter(link => link.targetType === 'event').forEach(link =>
    {
        const source = archiveSourceById(link.sourceId, link.projectId);
        const event = archiveConnectionRecord('event', link.targetId);
        const people = source && archiveEventEvidencePeople(event, link.projectId);
        if (!people) return;
        people.forEach(person =>
        {
            if (!sourceIdsForTarget('person', person.id, link.projectId).includes(link.sourceId))
            {
                sampleData.sourceLinks.push({
                    id: createRuntimeId('source-link'),
                    projectId: link.projectId,
                    sourceId: link.sourceId,
                    targetType: 'person',
                    targetId: person.id
                });
            }
        });
    });
}

function setSourceIdsForTarget(
    targetType,
    targetId,
    nextSourceIds,
    {
        projectId =
            currentProjectId()
    } = {}
)
{
    const target =
        sourceTargetRecord(
            targetType,
            targetId,
            projectId
        );

    if (!target)
    {
        return null;
    }

    const targetProjectId =
        target.projectId
        || projectId;

    const normalizedSourceIds =
        archiveUniqueIds(
            nextSourceIds
        );

    const eventPeople = targetType === 'event'
        ? archiveEventEvidencePeople(target, targetProjectId)
        : null;

    if (targetType === 'event' && !eventPeople)
    {
        return null;
    }

    const sources =
        normalizedSourceIds.map(
            sourceId =>
                archiveSourceById(
                    sourceId,
                    targetProjectId
                )
        );

    if (
        sources.some(source =>
            !source
        )
    )
    {
        return null;
    }

    const desiredIds =
        new Set(
            normalizedSourceIds
        );

    const currentLinks =
        sourceLinksForTarget(
            targetType,
            targetId,
            targetProjectId
        );

    const affectedSourceIds =
        new Set([
            ...currentLinks.map(link =>
                link.sourceId
            ),
            ...normalizedSourceIds
        ]);

    sampleData.sourceLinks =
        (
            sampleData.sourceLinks || []
        ).filter(link =>
        {
            const sameTarget =
                link.projectId
              === targetProjectId
            && link.targetType
              === targetType
            && link.targetId
              === targetId;

            return (
                !sameTarget
            || desiredIds.has(
                link.sourceId
            )
            );
        });

    const retainedIds =
        new Set(
            sourceIdsForTarget(
                targetType,
                targetId,
                targetProjectId
            )
        );

    const newlyLinkedSourceIds = normalizedSourceIds.filter(sourceId => !retainedIds.has(sourceId));

    normalizedSourceIds.forEach(
        sourceId =>
        {
            if (
                retainedIds.has(
                    sourceId
                )
            )
            {
                return;
            }

            sampleData.sourceLinks.push({
                id:
              createRuntimeId(
                  'source-link'
              ),

                projectId:
              targetProjectId,

                sourceId,
                targetType,
                targetId
            });
        }
    );

    if (eventPeople)
    {
        newlyLinkedSourceIds.forEach(sourceId => eventPeople.forEach(person =>
        {
            if (!sourceIdsForTarget('person', person.id, targetProjectId).includes(sourceId))
            {
                sampleData.sourceLinks.push({
                    id: createRuntimeId('source-link'),
                    projectId: targetProjectId,
                    sourceId,
                    targetType: 'person',
                    targetId: person.id
                });
            }
        }));
    }

    const now =
        new Date().toISOString();

    affectedSourceIds.forEach(
        sourceId =>
        {
            const source =
                archiveSourceById(
                    sourceId,
                    targetProjectId
                );

            if (source)
            {
                source.updatedAt =
                    now;
            }
        }
    );

    target.updatedAt =
        now;

    if (targetType === 'file')
    {
        target.updated =
            'Just now';
    }

    return sourceIdsForTarget(
        targetType,
        targetId,
        targetProjectId
    );
}

function setSourceLink(
    sourceId,
    targetType,
    targetId,
    shouldLink = true,
    {
        projectId =
            currentProjectId()
    } = {}
)
{
    const currentIds =
        sourceIdsForTarget(
            targetType,
            targetId,
            projectId
        );

    const nextIds =
        shouldLink
            ? archiveUniqueIds([
                ...currentIds,
                sourceId
            ])
            : currentIds.filter(id =>
                id !== sourceId
            );

    const savedIds =
        setSourceIdsForTarget(
            targetType,
            targetId,
            nextIds,
            {
                projectId
            }
        );

    if (!savedIds)
    {
        return false;
    }

    return shouldLink
        ? savedIds.includes(
            sourceId
        )
        : !savedIds.includes(
            sourceId
        );
}

function sourcesForTarget(
    targetType,
    targetId,
    projectId =
        currentProjectId()
)
{
    if (
        !sourceTargetRecord(
            targetType,
            targetId,
            projectId
        )
    )
    {
        return [];
    }

    return sourceIdsForTarget(
        targetType,
        targetId,
        projectId
    )
        .map(sourceId =>
            archiveSourceById(
                sourceId,
                projectId
            )
        )
        .filter(Boolean);
}

function connectedSourceMeta(
    source
)
{
    return [
        localizedSourceCategoryLabel(
            source?.category,
            ''
        ),

        source?.providedBy,

        source?.reference
    ]
        .filter(Boolean)
        .slice(0, 2)
        .join(' · ')
        || 'Source record';
}

function connectedSourceOrigin(
    source
)
{
    return String(
        source?.providedBy
        || source?.location
        || ''
    ).trim()
      || 'Origin not specified';
}

function connectedSourceDetailMeta(
    source
)
{
    const category =
        localizedSourceCategoryLabel(
            source?.category,
            ''
        );

    const reference =
        String(
            source?.reference
          || ''
        ).trim();

    const accessed =
        source?.accessedDate
            ? `Accessed ${
                archiveFormatDate(
                    source.accessedDate
                )
            }`
            : '';

    return [
        category,

        /*
          Where-found information is more useful in
          a connected item than the accessed date.
          Use the date only as a fallback.
        */
        reference || accessed
    ]
        .filter(Boolean)
        .join(' · ')
        || 'Source record';
}

function openConnectedSource(
    sourceId,
    projectId =
        currentProjectId()
)
{
    const source =
        archiveSourceById(
            sourceId,
            projectId
        );

    if (!source)
    {
        showToast(
            'The source is no longer available.'
        );

        return;
    }

    if (
        state.activeModule === 'Archive'
        && typeof archiveRememberCurrentLocation
          === 'function'
    )
    {
        archiveRememberCurrentLocation();
    }

    state.activeModule =
        'Archive';

    state.archiveView =
        'sources';

    state.archiveSearch =
        '';

    state.archiveSourceCategoryFilter =
        'all';

    state.archiveSourceConnectionFilter =
        'all';

    state.archiveSourceFavouriteOnly =
        false;

    state.archiveSelectedSourceId =
        source.id;

    state.archiveInspectorCollapsed =
        false;

    state.archiveSelectedFileIds =
        [];

    render();
}
function renderConnectedSourceList({
    targetType,
    targetId,

    projectId =
        currentProjectId(),

    sources =
        sourcesForTarget(
            targetType,
            targetId,
            projectId
        ),

    emptyText =
        'No sources linked.',

    readOnly =
        false
})
{
    const validSources =
        (
            Array.isArray(sources)
                ? sources
                : []
        ).filter(Boolean);

    const visibleSources =
        validSources.slice(0, 4);

    if (!visibleSources.length)
    {
        return renderInspectorSectionEmpty(
            emptyText
        );
    }

    const sourceItems =
        visibleSources
            .map(source =>
            {
                const title =
                    source.title
              || 'Untitled source';

                const sourceProjectId =
                    source.projectId
              || projectId;

                const origin =
                    connectedSourceOrigin(
                        source
                    );

                const metadata =
                    connectedSourceDetailMeta(
                        source
                    );

                const mainContent = `
              <span
                class="connected-source-icon"
                aria-hidden="true">

                <span
                  class="connected-source-icon-record">
                  ${icon.archive}
                </span>

                <span
                  class="connected-source-icon-link">
                  ${icon.link}
                </span>
              </span>

              <span class="connected-source-copy">
                <strong
                  class="connected-source-title"
                  title="${escapeHtml(title)}">

                  ${escapeHtml(title)}
                </strong>

                <span
                  class="connected-source-origin"
                  title="${escapeHtml(origin)}">

                  ${escapeHtml(origin)}
                </span>

                <span
                  class="connected-source-meta"
                  title="${escapeHtml(metadata)}">

                  ${escapeHtml(metadata)}
                </span>
              </span>
            `;

                return `
              <div
                class="
                  relation-row
                  connected-source-item
                ">

                ${
                    readOnly
                        ? `
                      <div
                        class="
                          relation-row-main
                          connected-source-main
                        ">

                        ${mainContent}
                      </div>
                    `
                        : `
                      <button
                        class="
                          relation-row-main
                          connected-source-main
                        "
                        type="button"
                        data-connected-source-open="${escapeHtml(
                            source.id
                        )}"
                        data-connected-source-project="${escapeHtml(
                            sourceProjectId
                        )}"
                        aria-label="Open source ${escapeHtml(
                            title
                        )}">

                        ${mainContent}
                      </button>
                    `
                }

                ${
                    readOnly
                        ? ''
                        : `
                      <div class="relation-actions">
                        <button
                          class="
                            relation-action-button
                            danger
                          "
                          type="button"
                          data-connected-source-unlink="${escapeHtml(
                                source.id
                            )}"
                          data-connected-source-target-type="${escapeHtml(
                                targetType
                            )}"
                          data-connected-source-target-id="${escapeHtml(
                                targetId
                            )}"
                          data-connected-source-project="${escapeHtml(
                                sourceProjectId
                            )}"
                          aria-label="Unlink ${escapeHtml(
                                title
                            )}"
                          title="Unlink source">

                          ${icon.unlink}
                        </button>
                      </div>
                    `
                }
              </div>
            `;
            })
            .join('');

    return `
        <div
          class="relationship-list connected-source-list"
          data-connected-source-list>
          ${sourceItems}
        </div>

        <div class="panel-section-footer">
          <button
            class="panel-section-view-all"
            type="button"
            data-connected-source-view-all
            data-connected-source-target-type="${escapeHtml(targetType)}"
            data-connected-source-target-id="${escapeHtml(targetId)}"
            data-connected-source-project="${escapeHtml(projectId)}"
            aria-label="View all ${validSources.length} sources">

            <span>View all sources</span>

            <span
              class="panel-section-view-all-icon"
              aria-hidden="true">
              ${icon.chevron}
            </span>
          </button>
        </div>
      `;
}

function openConnectedSourceUnlinkConfirm({
    sourceId,
    targetType,
    targetId,
    projectId = currentProjectId(),
    onUnlinked = null
})
{
    const source =
        archiveSourceById(sourceId, projectId);

    const target =
        sourceTargetRecord(
            targetType,
            targetId,
            projectId
        );

    if (!source || !target)
    {
        showToast(
            t('The source or connected record is no longer available.')
        );
        return;
    }

    const sourceLabel =
        source.title || t('Untitled source');

    const targetLabel =
        connectedSourceTargetLabel(targetType, target);

    const question = t(
        'Remove the connection between “{source}” and “{record}”?'
    ).replace(
        /\{source\}|\{record\}/g,
        token =>
            token === '{source}'
                ? sourceLabel
                : targetLabel
    );

    openModal(`
        <div
          class="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="connectedSourceUnlinkTitle"
          aria-describedby="connectedSourceUnlinkQuestion">

          <div class="modal-header">
            <div>
              <h2 id="connectedSourceUnlinkTitle">
                ${escapeHtml(t('Unlink source?'))}
              </h2>
            </div>

            <button
              class="close-button"
              type="button"
              data-close
              aria-label="${escapeHtml(t('Close'))}">
              ${icon.close}
            </button>
          </div>

          <div class="modal-body">
            <p id="connectedSourceUnlinkQuestion">
              ${escapeHtml(question)}
            </p>

            <div class="unlink-relationship-warning">
              <span>
                ${escapeHtml(t(
                    'Only this connection will be removed. Both records and their other connections will remain in the project.'
                ))}
              </span>
            </div>
          </div>

          <div class="modal-footer">
            <button
              class="button secondary"
              type="button"
              data-close>
              ${escapeHtml(t('Cancel'))}
            </button>

            <button
              class="button danger"
              type="button"
              data-connected-source-confirm-unlink>
              ${escapeHtml(t('Unlink'))}
            </button>
          </div>
        </div>
      `);

    const confirmButton =
        modalBackdrop.querySelector(
            '[data-connected-source-confirm-unlink]'
        );

    confirmButton?.addEventListener('click', () =>
    {
        // Recheck the records before committing the change.
        const currentSource =
            archiveSourceById(sourceId, projectId);

        const currentTarget =
            sourceTargetRecord(
                targetType,
                targetId,
                projectId
            );

        if (!currentSource || !currentTarget)
        {
            showToast(t(
                'The source or connected record is no longer available.'
            ));
            return;
        }

        confirmButton.disabled = true;

        const removed = setSourceLink(
            sourceId,
            targetType,
            targetId,
            false,
            { projectId }
        );

        if (!removed)
        {
            confirmButton.disabled = false;
            showToast(t(
                'The source link could not be removed.'
            ));
            return;
        }

        closeModal();

        if (typeof onUnlinked === 'function')
        {
            onUnlinked({
                sourceId,
                targetType,
                targetId,
                projectId
            });
        }

        showToast(t('Source unlinked.'));
    });
}

function bindConnectedSourceLinks(
    root,
    { onUnlinked = null } = {}
)
{
    if (!root)
    {
        return;
    }

    root.querySelectorAll(
        '[data-connected-source-view-all]'
    ).forEach(button =>
    {
        button.addEventListener('click', () =>
        {
            openArchiveSourcesForTarget({
                targetType:
              button.dataset.connectedSourceTargetType,
                targetId:
              button.dataset.connectedSourceTargetId,
                projectId:
              button.dataset.connectedSourceProject
              || currentProjectId()
            });
        });
    });

    root.querySelectorAll(
        '[data-connected-source-open]'
    ).forEach(button =>
    {
        button.addEventListener('click', () =>
        {
            openConnectedSource(
                button.dataset.connectedSourceOpen,
                button.dataset.connectedSourceProject
              || currentProjectId()
            );
        });
    });

    root.querySelectorAll(
        '[data-connected-source-unlink]'
    ).forEach(button =>
    {
        button.addEventListener('click', event =>
        {
            event.preventDefault();
            event.stopPropagation();

            openConnectedSourceUnlinkConfirm({
                sourceId:
              button.dataset.connectedSourceUnlink,
                targetType:
              button.dataset.connectedSourceTargetType,
                targetId:
              button.dataset.connectedSourceTargetId,
                projectId:
              button.dataset.connectedSourceProject
              || currentProjectId(),
                onUnlinked
            });
        });
    });
}


function removeSourceLinksForSource(
    sourceId
)
{
    sampleData.sourceLinks =
        (
            sampleData.sourceLinks || []
        ).filter(link =>
            link.sourceId !== sourceId
        );
}

function removeSourceLinksForTarget(
    targetType,
    targetId
)
{
    sampleData.sourceLinks =
        (
            sampleData.sourceLinks || []
        ).filter(link =>
            !(
                link.targetType
              === targetType
            && link.targetId
              === targetId
            )
        );
}

function removeSourceLinksForTargets(
    targetType,
    targetIds
)
{
    const ids =
        new Set(
            targetIds || []
        );

    sampleData.sourceLinks =
        (
            sampleData.sourceLinks || []
        ).filter(link =>
            !(
                link.targetType
              === targetType
            && ids.has(
                link.targetId
            )
            )
        );
}

function pruneInvalidSourceLinks()
{
    const seen =
        new Set();

    sampleData.sourceLinks =
        (
            sampleData.sourceLinks || []
        ).filter(link =>
        {
            if (
                !link
            || !link.id
            || !link.projectId
            || !link.sourceId
            || !link.targetId
            || !SOURCE_LINK_TARGET_TYPES
                .includes(
                    link.targetType
                )
            )
            {
                return false;
            }

            const source =
                archiveSourceById(
                    link.sourceId,
                    link.projectId
                );

            const target =
                sourceTargetRecord(
                    link.targetType,
                    link.targetId,
                    link.projectId
                );

            const key =
                [
                    link.projectId,
                    link.sourceId,
                    link.targetType,
                    link.targetId
                ].join('|');

            if (
                !source
            || !target
            || seen.has(key)
            )
            {
                return false;
            }

            seen.add(
                key
            );

            return true;
        });
}

