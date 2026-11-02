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
        previewUrl: 'assets/pawford-household-register-sample.png', favorite: true,
        description: 'Sample register table with four family names on separate lines.',
        documentDate: { type: 'Exact date', value: '2004' }, linkedPersonIds: ['barnaby', 'daisy', 'silver', 'luna'],
        personRegions: { barnaby: { x: 0.05, y: 0.43, width: 0.29, height: 0.06 }, daisy: { x: 0.05, y: 0.54, width: 0.28, height: 0.06 }, silver: { x: 0.05, y: 0.66, width: 0.29, height: 0.06 }, luna: { x: 0.05, y: 0.78, width: 0.27, height: 0.06 } },
        linkedEventIds: [], linkedNoteIds: [], linkedPlaceIds: ['place-pawford'], placeIds: ['place-pawford'],
        addedAt: '2026-06-02T09:20:00Z', updatedAt: '2026-06-02T09:20:00Z', added: 'Jun 2, 2026', updated: 'Jun 2, 2026'
    },
    {
        id: 'af2', projectId: 'p1', folderId: 'albums-origin', name: 'unidentified_studio_portrait.jpg', kind: 'img', type: 'Image', mimeType: 'image/jpeg', size: '153 KB', sizeBytes: 156569,
        previewUrl: 'assets/unidentified-studio-portrait.jpg', favorite: false,
        description: 'Unidentified studio portrait awaiting a person link and date.',
        documentDate: { type: 'Unknown', value: '' }, linkedPersonIds: [], linkedEventIds: [], linkedNoteIds: [], linkedPlaceIds: [], placeIds: [],
        addedAt: '2026-06-02T08:40:00Z', updatedAt: '2026-06-02T08:40:00Z', added: 'Jun 2, 2026', updated: 'Jun 2, 2026'
    },
    {
        id: 'af3', projectId: 'p1', folderId: 'opis3', name: 'pawford_register_index_page_12.png', kind: 'img', type: 'Image', mimeType: 'image/png', size: '2.5 MB', sizeBytes: 2592368,
        previewUrl: 'assets/pawford-register-index-sample.png', favorite: false,
        description: 'Name index pointing to the household register page.',
        documentDate: { type: 'Unknown', value: '' }, linkedPersonIds: ['barnaby', 'silver'],
        personRegions: { barnaby: { x: 0.14, y: 0.47, width: 0.55, height: 0.06 }, silver: { x: 0.14, y: 0.66, width: 0.55, height: 0.06 } },
        linkedEventIds: [], linkedNoteIds: [], linkedPlaceIds: ['place-pawford'], placeIds: ['place-pawford'],
        addedAt: '2026-06-01T14:10:00Z', updatedAt: '2026-06-01T14:10:00Z', added: 'Jun 1, 2026', updated: 'Jun 1, 2026'
    },
    {
        id: 'af4', projectId: 'p1', folderId: 'interviews', name: 'daisy_letter_to_luna_2006.png', kind: 'img', type: 'Image', mimeType: 'image/png', size: '2.5 MB', sizeBytes: 2619679,
        previewUrl: 'assets/daisy-letter-sample.png', favorite: false,
        description: 'Sample family letter from Daisy to Luna about preserving photographs.',
        documentDate: { type: 'Exact date', value: '12 Apr 2006' }, linkedPersonIds: ['daisy', 'luna'],
        personRegions: { daisy: { x: 0.07, y: 0.71, width: 0.48, height: 0.15 }, luna: { x: 0.07, y: 0.24, width: 0.14, height: 0.05 } },
        linkedEventIds: [], linkedNoteIds: [], linkedPlaceIds: ['place-pawford'], placeIds: ['place-pawford'],
        addedAt: '2026-05-28T12:00:00Z', updatedAt: '2026-05-28T12:00:00Z', added: 'May 28, 2026', updated: 'May 28, 2026'
    },
    {
        id: 'af5', projectId: 'p1', folderId: 'certificates', name: 'silver_luna_marriage_record_2023.png', kind: 'img', type: 'Image', mimeType: 'image/png', size: '2.3 MB', sizeBytes: 2427635,
        previewUrl: 'assets/silver-luna-marriage-record-sample.png', favorite: true,
        description: 'Sample marriage extract for Silver and Luna in Meowbridge.',
        documentDate: { type: 'Exact date', value: '18 Aug 2023' }, linkedPersonIds: ['silver', 'luna'],
        personRegions: { silver: { x: 0.065, y: 0.56, width: 0.22, height: 0.06 }, luna: { x: 0.32, y: 0.56, width: 0.2, height: 0.06 } },
        linkedEventIds: ['event-rel-silver-luna-partner-rel-silver-luna-partner-marriage'], linkedNoteIds: [], linkedPlaceIds: ['place-meowbridge'], placeIds: ['place-meowbridge'],
        addedAt: '2026-05-19T10:00:00Z', updatedAt: '2026-05-19T10:00:00Z', added: 'May 19, 2026', updated: 'May 19, 2026'
    },
    {
        id: 'af7', projectId: 'p1', folderId: 'fond12', name: 'silver_birth_announcement_1998.png', kind: 'img', type: 'Image', mimeType: 'image/png', size: '2.3 MB', sizeBytes: 2379200,
        previewUrl: 'assets/silver-birth-announcement-sample-v2.png', favorite: false,
        description: 'Sample birth announcement for Silver Whiskerfield.',
        documentDate: { type: 'Exact date', value: '03 Mar 1998' }, linkedPersonIds: ['silver'],
        personRegions: { silver: { x: 0.23, y: 0.36, width: 0.54, height: 0.13 } },
        linkedEventIds: ['event-silver-birth'], linkedNoteIds: [], linkedPlaceIds: ['place-pawford'], placeIds: ['place-pawford'],
        addedAt: '2026-03-29T10:00:00Z', updatedAt: '2026-03-29T10:00:00Z', added: 'Mar 29, 2026', updated: 'Mar 29, 2026'
    },
    {
        id: 'af-birth-sample', projectId: 'p1', folderId: 'fond12', name: 'daisy_birth_record_1949.png', kind: 'img', type: 'Image', mimeType: 'image/png', size: '2.2 MB', sizeBytes: 2347971,
        previewUrl: 'assets/daisy-birth-record-sample.png', favorite: false,
        description: 'Illustrative birth-record extract for Daisy Whiskerfield.',
        documentDate: { type: 'Exact date', value: '03 Jun 1949' }, linkedPersonIds: ['daisy'], personRegions: { daisy: { x: 0.14, y: 0.36, width: 0.72, height: 0.12 } },
        linkedEventIds: ['event-daisy-birth'], linkedNoteIds: [], linkedPlaceIds: ['place-pawford'], placeIds: ['place-pawford'],
        addedAt: '2026-06-02T09:25:00Z', updatedAt: '2026-06-02T09:25:00Z', added: 'Jun 2, 2026', updated: 'Jun 2, 2026'
    },
    {
        id: 'af-letter-transcription', projectId: 'p1', folderId: 'interviews', name: 'daisy_letter_transcription.txt', kind: 'doc', type: 'Text', mimeType: 'text/plain', assetUrl: 'assets/daisy_letter_transcription.txt', size: '1 KB', favorite: false,
        description: 'Transcription of Daisy’s letter to Luna.', linkedPersonIds: ['daisy', 'luna'], linkedEventIds: [], linkedNoteIds: [], linkedPlaceIds: ['place-pawford'], placeIds: ['place-pawford'],
        addedAt: '2026-06-02T09:30:00Z', updatedAt: '2026-06-02T09:30:00Z'
    },
    {
        id: 'af-pawford-trip', projectId: 'p1', folderId: 'opis3', name: 'pawford_visit_notes.docx', kind: 'doc', type: 'Document', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', assetUrl: 'assets/pawford_visit_notes.docx', size: '37 KB', sizeBytes: 37210, favorite: false,
        description: 'Research notes from a visit to Pawford.', linkedPersonIds: ['barnaby', 'daisy'], linkedEventIds: [], linkedNoteIds: [], linkedPlaceIds: ['place-pawford'], placeIds: ['place-pawford'],
        addedAt: '2026-06-02T09:31:00Z', updatedAt: '2026-06-02T09:31:00Z'
    },
    {
        id: 'af-household-csv', projectId: 'p1', folderId: 'delo44', name: 'pawford_household_index.csv', kind: 'sheet', type: 'CSV', mimeType: 'text/csv', assetUrl: 'assets/pawford_household_index.csv', size: '1 KB', favorite: false,
        description: 'Searchable transcription of the household register index.', linkedPersonIds: ['barnaby', 'daisy', 'silver', 'luna'], linkedEventIds: [], linkedNoteIds: [], linkedPlaceIds: ['place-pawford'], placeIds: ['place-pawford'],
        addedAt: '2026-06-02T09:32:00Z', updatedAt: '2026-06-02T09:32:00Z'
    },
    {
        id: 'af-marriage-packet', projectId: 'p1', folderId: 'certificates', name: 'silver_luna_marriage_packet.pdf', kind: 'pdf', type: 'PDF', mimeType: 'application/pdf', assetUrl: 'assets/silver_luna_marriage_packet.pdf', size: '4 KB', sizeBytes: 3229, favorite: false,
        description: 'Research packet for Silver and Luna’s marriage.', linkedPersonIds: ['silver', 'luna'], linkedEventIds: ['event-rel-silver-luna-partner-rel-silver-luna-partner-marriage'], linkedNoteIds: [], linkedPlaceIds: ['place-meowbridge'], placeIds: ['place-meowbridge'],
        addedAt: '2026-06-02T09:33:00Z', updatedAt: '2026-06-02T09:33:00Z'
    }
];

sampleData.archiveFiles.forEach(file =>
{
    const place =
        archiveDocumentPlace(
            file
        );

    archiveApplyDocumentPlace(
        file,
        place.placeId,
        place.placeText
    );
});

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

const ARCHIVE_ROOT_PICKER_VALUE =
    '__archive_root__';

const ARCHIVE_ROOT_LABEL =
    'All files';

const ARCHIVE_MOVE_NO_DESTINATION =
    '__archive_move_no_destination__';

function archiveMoveHasDestination(
    folderId
)
{
    return folderId
        !== ARCHIVE_MOVE_NO_DESTINATION;
}

function archiveIsRootLocation(
    folderId
)
{
    return (
        folderId === null
        || folderId === undefined
        || folderId === ''
    );
}

function archiveNormalizeFolderId(
    folderId
)
{
    if (
        archiveIsRootLocation(
            folderId
        )
    )
    {
        return null;
    }

    return archiveFolderById(
        folderId
    )?.id
      || null;
}

function archiveFileFolderId(
    file
)
{
    return archiveNormalizeFolderId(
        file?.folderId
    );
}

function archiveFolderParentId(
    folder
)
{
    if (!folder)
    {
        return null;
    }

    return archiveNormalizeFolderId(
        folder.parentId
        ?? folder.parent
        ?? null
    );
}

function archiveFolderChildren(
    folderId = null
)
{
    const rootLocation =
        archiveIsRootLocation(
            folderId
        );

    if (
        !rootLocation
        && !archiveFolderById(
            folderId
        )
    )
    {
        return [];
    }

    const parentId =
        rootLocation
            ? null
            : folderId;

    return (
        sampleData.archiveFolders
        || []
    )
        .filter(folder =>
            folder.projectId === currentProjectId()
          &&
          archiveFolderParentId(
              folder
          ) === parentId
        )
        .sort((a, b) =>
            String(
                a.name || ''
            ).localeCompare(
                String(
                    b.name || ''
                )
            )
        );
}

function archiveFolderAncestors(
    folderId
)
{
    if (
        archiveIsRootLocation(
            folderId
        )
    )
    {
        return [];
    }

    const result = [];
    const seen =
        new Set();

    let current =
        archiveFolderById(
            folderId
        );

    while (
        current
        && !seen.has(
            current.id
        )
    )
    {
        result.unshift(
            current
        );

        seen.add(
            current.id
        );

        current =
            archiveFolderById(
                archiveFolderParentId(
                    current
                )
            );
    }

    return result;
}

function archiveFolderPath(
    folderId
)
{
    const folders =
        archiveFolderAncestors(
            folderId
        );

    if (!folders.length)
    {
        return ARCHIVE_ROOT_LABEL;
    }

    return folders
        .map(folder =>
            translateText(folder.name)
        )
        .join(' / ');
}

/*
      Returns every physical folder inside a
      location. At the virtual root, null is also
      included so root-level files belong to the
      scope.
    */

function archiveFolderScopeIds(
    folderId
)
{
    const ids =
        new Set();

    const visit =
        id =>
        {
            ids.add(
                id
            );

            archiveFolderChildren(
                id
            ).forEach(child =>
                visit(
                    child.id
                )
            );
        };

    if (
        archiveIsRootLocation(
            folderId
        )
    )
    {
        ids.add(
            null
        );

        archiveFolderChildren(
            null
        ).forEach(child =>
            visit(
                child.id
            )
        );

        return ids;
    }

    const normalizedId =
        archiveNormalizeFolderId(
            folderId
        );

    if (normalizedId)
    {
        visit(
            normalizedId
        );
    }

    return ids;
}

/*
      This helper is for real-folder operations
      such as delete and move. The virtual root is
      deliberately excluded.
    */

function archiveFolderDescendantIds(
    folderId,
    {
        includeSelf =
            true
    } = {}
)
{
    const folder =
        archiveFolderById(
            folderId
        );

    if (!folder)
    {
        return [];
    }

    const ids = [];

    const visit =
        id =>
        {
            if (
                !ids.includes(
                    id
                )
            )
            {
                ids.push(
                    id
                );
            }

            archiveFolderChildren(
                id
            ).forEach(child =>
                visit(
                    child.id
                )
            );
        };

    visit(
        folder.id
    );

    return includeSelf
        ? ids
        : ids.filter(
            id =>
                id !== folder.id
        );
}

function archiveFlattenFolders(
    parentId = null,
    depth = 0
)
{
    return archiveFolderChildren(
        parentId
    )
        .flatMap(folder => [
            {
                folder,
                depth
            },

            ...archiveFlattenFolders(
                folder.id,
                depth + 1
            )
        ]);
}

function archiveFolderImpact(
    folderId
)
{
    const folder =
        archiveFolderById(
            folderId
        );

    if (!folder)
    {
        return {
            folderIds:
            [],

            folders:
            0,

            files:
            0
        };
    }

    const descendantIds =
        new Set(
            archiveFolderDescendantIds(
                folder.id
            )
        );

    return {
        folderIds:
          [
              ...descendantIds
          ],

        folders:
          Math.max(
              0,
              descendantIds.size - 1
          ),

        files:
          archiveProjectFiles()
              .filter(file =>
                  descendantIds.has(
                      archiveFileFolderId(
                          file
                      )
                  )
              )
              .length
    };
}

function archiveFolderIdFromChoice(
    value
)
{
    return value
        === ARCHIVE_ROOT_PICKER_VALUE
        ? null
        : archiveNormalizeFolderId(
            value
        );
}

const defaultArchiveFileFilters =
    Object.freeze({
        scope: 'all',
        fileType: 'all',
        connections: 'all',
        sourceId: '',
        personIds:
          Object.freeze([]),
        placeIds:
          Object.freeze([]),
        documentYears:
          Object.freeze({
              mode:
              '',
              from:
              '',
              to:
              ''
          }),

        favouriteOnly:
          false
    });

function archiveFilePersonIds(
    file
)
{
    return archiveUniqueIds(
        file?.linkedPersonIds
        || []
    );
}

function archiveFilePlaceIds(
    file
)
{
    const documentPlace =
        archiveDocumentPlace(
            file
        );

    return archiveUniqueIds([
        documentPlace.placeId,

        ...(
            file?.linkedPlaceIds
          || []
        ),

        ...(
            file?.placeIds
          || []
        )
    ]);
}

function archiveSetFilePlaces(file, placeIds, { resolveLegacy = false } = {})
{
    const ids = archiveUniqueIds(placeIds || []);
    if (!file || ids.some(id => !getPlace(id) || getPlace(id).deleted || getPlace(id).projectId !== file.projectId)) return false;
    const legacyText = !file.documentPlaceId
        ? String(file.documentPlaceText || '').trim()
        : '';
    const matchedLegacy = ids.some(id => normalizePlaceLookupText(getPlace(id)?.name || '')
        === normalizePlaceLookupText(legacyText));
    file.linkedPlaceIds = [...ids];
    file.placeIds = [...ids];
    file.documentPlaceId = null;
    file.documentPlaceText = ((resolveLegacy && ids.length) || matchedLegacy) ? '' : legacyText;
    file.updatedAt = new Date().toISOString();
    file.updated = 'Just now';
    return true;
}

function archiveFilterCollator()
{
    return new Intl.Collator(
        state.language === 'ru'
            ? 'ru'
            : 'en',
        {
            sensitivity:
            'base'
        }
    );
}

function archivePersonFilterOptions()
{
    const files =
        archiveProjectFiles();

    const counts =
        new Map();

    files.forEach(file =>
    {
        archiveFilePersonIds(
            file
        ).forEach(personId =>
        {
            counts.set(
                personId,
                (
                    counts.get(personId)
              || 0
                ) + 1
            );
        });
    });

    return getPeople(
        currentProjectId()
    )
        .filter(person =>
            counts.has(person.id)
        )
        .map(person => ({
            value:
            person.id,

            label:
            personResourceDisplayName(
                person
            ),

            count:
            counts.get(person.id)
            || 0
        }))
        .sort(
            (left, right) =>
                archiveFilterCollator()
                    .compare(
                        left.label,
                        right.label
                    )
        );
}

function archivePlaceFilterOptions()
{
    const files =
        archiveProjectFiles();

    const counts =
        new Map();

    files.forEach(file =>
    {
        archiveFilePlaceIds(
            file
        ).forEach(placeId =>
        {
            counts.set(
                placeId,
                (
                    counts.get(placeId)
              || 0
                ) + 1
            );
        });
    });

    return [
        ...counts.entries()
    ]
        .map(([
            placeId,
            count
        ]) =>
        {
            const place =
                getPlace(placeId);

            return {
                value:
              placeId,

                label:
              getPlaceDisplay(
                  placeId
              )
              || place?.name
              || placeId,

                /*
            * Alternative names improve searching,
            * but are not displayed or localized.
            */
                keywords:
              place?.alternativeNames
              || [],

                count
            };
        })
        .sort(
            (left, right) =>
                archiveFilterCollator()
                    .compare(
                        left.label,
                        right.label
                    )
        );
}

const archiveFileFilterSchema =
    Object.freeze([
        Object.freeze({
            key:
            'scope',

            label:
            'Location',

            control:
            'select',

            defaultValue:
            'all',

            options:
            Object.freeze([
                Object.freeze({
                    value:
                  'all',

                    label:
                  'All Archive'
                }),

                Object.freeze({
                    value:
                  'folder',

                    label:
                  'Current folder and subfolders'
                })
            ])
        }),

        Object.freeze({
            key:
            'fileType',

            label:
            'File type',

            control:
            'select',

            defaultValue:
            'all',

            options:
            Object.freeze([
                Object.freeze({
                    value:
                  'all',

                    label:
                  'All types'
                }),

                Object.freeze({
                    value:
                  'pdf',

                    label:
                  'PDF'
                }),

                Object.freeze({
                    value:
                  'img',

                    label:
                  'Images'
                }),

                Object.freeze({
                    value:
                  'doc',

                    label:
                  'Documents'
                }),

                Object.freeze({
                    value:
                  'sheet',

                    label:
                  'Spreadsheets'
                }),

                Object.freeze({
                    value:
                  'audio',

                    label:
                  'Audio'
                }),

                Object.freeze({
                    value:
                  'archive',

                    label:
                  'Archive files'
                })
            ])
        }),

        Object.freeze({
            key:
            'connections',

            label:
            'Connections',

            control:
            'select',

            defaultValue:
            'all',

            options:
            Object.freeze([
                Object.freeze({
                    value:
                  'all',

                    label:
                  'All files'
                }),

                Object.freeze({
                    value:
                  'linked',

                    label:
                  'Linked files'
                }),

                Object.freeze({
                    value:
                  'unlinked',

                    label:
                  'Unlinked files'
                })
            ])
        }),

        Object.freeze({
            key:
            'favouriteOnly',

            label:
            'Favourites',

            control:
            'boolean',

            defaultValue:
            false,

            checkboxLabel:
            'Favourites only'
        }),

        Object.freeze({
            key:
            'personIds',

            label:
            'People',

            control:
            'combobox',

            multiple:
            true,

            layout:
            'full',

            placeholder:
            'Search people',

            defaultValue:
            Object.freeze([]),

            getOptions:
            archivePersonFilterOptions
        }),

        Object.freeze({
            key:
            'placeIds',

            label:
            'Places',

            control:
            'combobox',

            multiple:
            true,

            layout:
            'full',

            placeholder:
            'Search places',

            defaultValue:
            Object.freeze([]),

            getOptions:
            archivePlaceFilterOptions
        }),

        Object.freeze({
            key:
            'documentYears',

            label:
            'Document date',

            control:
            'year-range',

            layout:
            'full',

            defaultValue:
            Object.freeze({
                mode:
                '',

                from:
                '',

                to:
                ''
            })
        }),
        Object.freeze({
            key: 'sourceId',
            label: 'Source',
            control: 'combobox',
            multiple: false,
            layout: 'full',
            placeholder: 'Search sources...',
            defaultValue: '',
            getOptions: connectedSourceFilterOptions
        }),
    ]);

const archiveSourceFilterSchema =
    Object.freeze([
        Object.freeze({
            key:
            'sourceCategory',

            label:
            'Source category',

            control:
            'select',

            defaultValue:
            'all',

            getOptions:
            () => [
                {
                    value:
                  'all',

                    label:
                  'All source categories'
                },

                ...SOURCE_CATEGORIES.map(
                    category => ({
                        value:
                    category.value,

                        label:
                    category.label
                    })
                )
            ]
        }),
        Object.freeze({
            key:
            'sourceConnections',

            label:
            'Connection status',

            control:
            'select',

            defaultValue:
            'all',

            options:
            Object.freeze([
                Object.freeze({
                    value:
                  'all',

                    label:
                  'Any connection status'
                }),

                Object.freeze({
                    value:
                  'linked',

                    label:
                  'With connections'
                }),

                Object.freeze({
                    value:
                  'unlinked',

                    label:
                  'Without connections'
                })
            ])
        }),
        Object.freeze({
            key:
            'sourceFavouriteOnly',

            label:
            'Favourites',

            control:
            'boolean',

            defaultValue:
            false,

            checkboxLabel:
            'Favourite sources only'
        })
    ]);

function archiveFileFiltersWithDefaults(
    filters =
        state.archiveFileFilters
)
{
    return cloneSharedFilterValues(
        archiveFileFilterSchema,
        {
            ...defaultArchiveFileFilters,
            ...(filters || {})
        }
    );
}

function archiveEffectiveFileFilters()
{
    const filters =
        archiveFileFiltersWithDefaults();

    /*
      * The Favourites sidebar item is a shortcut
      * into the same predicate, not a second
      * filtering implementation.
      */
    if (
        state.archiveView
          === 'favorites'
    )
    {
        filters.favouriteOnly =
            true;
    }

    return filters;
}

function archiveFileFilteringActive(
    filters =
        archiveEffectiveFileFilters()
)
{
    const structuredFilterActive =
        archiveFileFilterSchema
            .filter(definition =>
                definition.key !== 'scope'
            )
            .some(definition =>
                sharedFilterValueIsActive(
                    definition,
                    filters[
                        definition.key
                    ]
                )
            );

    return Boolean(
        String(
            state.archiveSearch || ''
        ).trim()
        || structuredFilterActive
    );
}

function archiveFileFilterCount()
{
    const filters =
        archiveEffectiveFileFilters();

    return archiveFileFilterSchema
        .filter(definition =>
            sharedFilterValueIsActive(
                definition,
                filters[
                    definition.key
                ]
            )
        )
        .length;
}

const ARCHIVE_NAVIGATION_HISTORY_LIMIT =
    50;

function archiveIsLocationView(
    view
)
{
    return (
        view === 'files'
        || view === 'favorites'
    );
}

function archiveNormalizeLocationSnapshot(
    snapshot = {}
)
{
    const view =
        snapshot.view === 'favorites'
            ? 'favorites'
            : 'files';

    const selectedFile =
        archiveFileById(
            snapshot.selectedFileId
        );

    const fileFilters =
        archiveFileFiltersWithDefaults(
            snapshot.fileFilters
        );

    if (view === 'favorites')
    {
        fileFilters.favouriteOnly =
            true;
    }

    return {
        view,

        folderId:
          archiveNormalizeFolderId(
              snapshot.folderId
          ),

        search:
          String(
              snapshot.search || ''
          ),

        fileFilters,

        filterPresentation:
          snapshot.filterPresentation
            === 'folders'
              ? 'folders'
              : 'flat',

        filterScopeFolderId:
          archiveNormalizeFolderId(
              snapshot.filterScopeFolderId
          ),

        selectedFileId:
          selectedFile?.id
          || null,

        inspectorCollapsed:
          Boolean(
              snapshot.inspectorCollapsed
          ),
        fileLayout: ['details', 'tiles', 'images'].includes(snapshot.fileLayout) ? snapshot.fileLayout : 'details'
    };
}

function archiveCurrentLocationSnapshot()
{
    return archiveNormalizeLocationSnapshot({
        fileLayout: state.archiveFileLayout,
        view:
          state.archiveView,

        folderId:
          state.archiveSelectedFolderId,

        search:
          state.archiveSearch,

        fileFilters:
          state.archiveFileFilters,

        filterPresentation:
          state.archiveFilterPresentation,

        filterScopeFolderId:
          state.archiveFilterScopeFolderId,

        selectedFileId:
          state.archiveSelectedFileId,

        inspectorCollapsed:
          state.archiveInspectorCollapsed
    });
}

function archiveLocationSnapshotKey(
    snapshot
)
{
    const normalized =
        archiveNormalizeLocationSnapshot(
            snapshot
        );

    return JSON.stringify([
        normalized.view,
        normalized.folderId,
        normalized.search,
        normalized.fileFilters,
        normalized.filterPresentation,
        normalized.filterScopeFolderId,
        normalized.selectedFileId,
        normalized.inspectorCollapsed
    ]);
}

function archivePushHistoryEntry(
    stack,
    snapshot
)
{
    const normalized =
        archiveNormalizeLocationSnapshot(
            snapshot
        );

    const previous =
        stack[
            stack.length - 1
        ];

    if (
        previous
        && archiveLocationSnapshotKey(
            previous
        )
          === archiveLocationSnapshotKey(
              normalized
          )
    )
    {
        return;
    }

    stack.push(
        normalized
    );

    if (
        stack.length
          > ARCHIVE_NAVIGATION_HISTORY_LIMIT
    )
    {
        stack.splice(
            0,
            stack.length
            - ARCHIVE_NAVIGATION_HISTORY_LIMIT
        );
    }
}

function archiveRememberCurrentLocation()
{
    if (
        !archiveIsLocationView(
            state.archiveView
        )
    )
    {
        return;
    }

    archivePushHistoryEntry(
        state.archiveNavigationBackStack,
        archiveCurrentLocationSnapshot()
    );
}

function archiveApplyLocationSnapshot(
    snapshot
)
{
    const normalized =
        archiveNormalizeLocationSnapshot(
            snapshot
        );

    state.archiveView =
        normalized.view;

    state.archiveSelectedFolderId =
        normalized.folderId;

    state.archiveSearch =
        normalized.search;

    state.archiveFileFilters =
        archiveFileFiltersWithDefaults(
            normalized.fileFilters
        );

    state.archiveFilterPresentation =
        normalized.filterPresentation;

    state.archiveFilterScopeFolderId =
        normalized.filterScopeFolderId;

    state.archiveSelectedFileId =
        normalized.selectedFileId;

    state.archiveSelectedFolderItemId =
        null;

    state.archiveSelectedFileIds =
        [];

    state.archiveSelectedFolderIds =
        [];

    state.archiveInspectorCollapsed =
        normalized.inspectorCollapsed;
    state.archiveFileLayout = normalized.fileLayout;
}

function archivePrepareTreeForLocation(
    folderId,
    {
        expandCurrent =
            false
    } = {}
)
{
    const normalizedFolderId =
        archiveNormalizeFolderId(
            folderId
        );

    if (!normalizedFolderId)
    {
        state.archivePendingTreeRevealId =
            null;

        return;
    }

    const path =
        archiveFolderAncestors(
            normalizedFolderId
        );

    const foldersToExpand =
        expandCurrent
            ? path
            : path.slice(
                0,
                -1
            );

    foldersToExpand.forEach(
        folder =>
        {
            state
                .archiveExpandedFolders[
                    folder.id
                ] = true;
        }
    );

    state.archivePendingTreeRevealId =
        normalizedFolderId;
}

function archiveNavigateToLocationCommit(
    location = {},
    {
        recordHistory =
            true,

        clearForward =
            true,

        expandCurrent =
            false,

        renderMode =
            'archive'
    } = {}
)
{
    const currentIsLocation =
        archiveIsLocationView(
            state.archiveView
        );

    const current =
        archiveCurrentLocationSnapshot();

    const base =
        currentIsLocation
            ? current
            : archiveNormalizeLocationSnapshot({
                fileLayout: state.archiveFileLayout,
                view:
                location.view
                || 'files',

                folderId:
                null,

                search:
                '',

                fileFilters:
                archiveFileFiltersWithDefaults(
                    state.archiveFileFilters
                ),

                filterPresentation:
                state.archiveFilterPresentation,

                filterScopeFolderId:
                state.archiveFilterScopeFolderId,

                selectedFileId:
                null,

                inspectorCollapsed:
                false
            });

    const target =
        archiveNormalizeLocationSnapshot({
            ...base,
            ...location
        });
    if (target.fileLayout === 'images' && target.selectedFileId
        && archiveFileKind(archiveFileById(target.selectedFileId)) !== 'img')
        target.fileLayout = 'details';

    const changed =
        !currentIsLocation
        || archiveLocationSnapshotKey(
            current
        )
          !== archiveLocationSnapshotKey(
              target
          );

    if (
        recordHistory
        && currentIsLocation
        && changed
    )
    {
        archivePushHistoryEntry(
            state.archiveNavigationBackStack,
            current
        );
    }

    if (
        clearForward
        && changed
    )
    {
        state.archiveNavigationForwardStack =
            [];
    }

    archiveApplyLocationSnapshot(
        target
    );

    archivePrepareTreeForLocation(
        target.folderId,
        {
            expandCurrent
        }
    );

    ensureArchiveSelection();

    if (
        renderMode === 'app'
    )
    {
        render();
    }
    else
    {
        renderArchive();
    }
}

function archiveNavigationCanGoBack()
{
    return Boolean(
        state
            .archiveNavigationBackStack
            .length
    );
}

function archiveNavigationCanGoForward()
{
    return Boolean(
        state
            .archiveNavigationForwardStack
            .length
    );
}

function archiveNavigationCanGoUp()
{
    return Boolean(
        archiveFolderById(
            state.archiveSelectedFolderId
        )
    );
}

function archiveNavigateBackCommit()
{
    const target =
        state
            .archiveNavigationBackStack
            .pop();

    if (!target)
    {
        return;
    }

    if (
        archiveIsLocationView(
            state.archiveView
        )
    )
    {
        archivePushHistoryEntry(
            state.archiveNavigationForwardStack,
            archiveCurrentLocationSnapshot()
        );
    }

    archiveApplyLocationSnapshot(
        target
    );

    archivePrepareTreeForLocation(
        target.folderId
    );

    ensureArchiveSelection();
    renderArchive();
}

function archiveNavigateForwardCommit()
{
    const target =
        state
            .archiveNavigationForwardStack
            .pop();

    if (!target)
    {
        return;
    }

    if (
        archiveIsLocationView(
            state.archiveView
        )
    )
    {
        archivePushHistoryEntry(
            state.archiveNavigationBackStack,
            archiveCurrentLocationSnapshot()
        );
    }

    archiveApplyLocationSnapshot(
        target
    );

    archivePrepareTreeForLocation(
        target.folderId
    );

    ensureArchiveSelection();
    renderArchive();
}

function archiveNavigateUpCommit()
{
    const currentFolder =
        archiveFolderById(
            state.archiveSelectedFolderId
        );

    if (!currentFolder)
    {
        return;
    }

    const scopeRoot =
        archiveFileFilteringActive()
        && archiveEffectiveFileFilters()
            .scope === 'folder'
            ? archiveNormalizeFolderId(
                state.archiveFilterScopeFolderId
            )
            : null;

    if (
        scopeRoot
        && currentFolder.id === scopeRoot
    )
    {
        return;
    }

    archiveNavigateToLocationCommit({
        folderId:
          archiveFolderParentId(
              currentFolder
          ),

        selectedFileId:
          null,

        inspectorCollapsed:
          false
    });
}
/*
      Public navigation functions always protect
      an active file-edit draft.
    */

function archiveNavigateToLocation(
    location = {},
    options = {}
)
{
    runAfterArchiveFileEditGuard(
        () =>
        {
            archiveNavigateToLocationCommit(
                location,
                options
            );
        }
    );
}

function archiveNavigateBack()
{
    runAfterArchiveFileEditGuard(
        archiveNavigateBackCommit
    );
}

function archiveNavigateForward()
{
    runAfterArchiveFileEditGuard(
        archiveNavigateForwardCommit
    );
}

function archiveNavigateUp()
{
    runAfterArchiveFileEditGuard(
        archiveNavigateUpCommit
    );
}

function selectArchiveFolderItem(
    folderId
)
{
    const folder =
        archiveFolderById(
            folderId
        );

    if (!folder)
    {
        return;
    }

    runAfterArchiveFileEditGuard(
        () =>
        {
            state.archiveSelectedFolderItemId =
                folder.id;

            /*
            File and folder detail selection are
            mutually exclusive.
          */
            state.archiveSelectedFileId =
                null;

            state.archiveInspectorCollapsed =
                false;

            renderArchiveMain();
        }
    );
}

function archiveOpenFolder(
    folderId
)
{
    const folder =
        archiveFolderById(
            folderId
        );

    if (!folder)
    {
        return;
    }

    archiveNavigateToLocation(
        {
            view: 'files',

            folderId:
            folder.id,

            fileFilters: state.archiveView === 'favorites'
                ? { ...archiveFileFiltersWithDefaults(), favouriteOnly: false }
                : archiveFileFiltersWithDefaults(),

            filterPresentation: 'folders',

            selectedFileId:
            null,

            inspectorCollapsed:
            false
        },
        {
            expandCurrent:
            true
        }
    );
}

function archivePruneNavigationHistory()
{
    const cleanStack =
        stack =>
        {
            const result = [];

            stack.forEach(
                snapshot =>
                {
                    const folderValid =
                        archiveIsRootLocation(
                            snapshot.folderId
                        )
                || Boolean(
                    archiveFolderById(
                        snapshot.folderId
                    )
                );

                    if (!folderValid)
                    {
                        return;
                    }

                    const normalized =
                        archiveNormalizeLocationSnapshot(
                            snapshot
                        );

                    const previous =
                        result[
                            result.length - 1
                        ];

                    if (
                        previous
                && archiveLocationSnapshotKey(
                    previous
                )
                  === archiveLocationSnapshotKey(
                      normalized
                  )
                    )
                    {
                        return;
                    }

                    result.push(
                        normalized
                    );
                }
            );

            return result.slice(
                -ARCHIVE_NAVIGATION_HISTORY_LIMIT
            );
        };

    state.archiveNavigationBackStack =
        cleanStack(
            state.archiveNavigationBackStack
          || []
        );

    state.archiveNavigationForwardStack =
        cleanStack(
            state.archiveNavigationForwardStack
          || []
        );
}

function openArchiveLocation(
    location,
    {
        recordHistory =
            true,

        expandCurrent =
            false
    } = {}
)
{
    state.activeModule =
        'Archive';

    archiveNavigateToLocation(
        location,
        {
            recordHistory,
            expandCurrent,
            renderMode:
            'app'
        }
    );
}

function archiveProjectFiles()
{
    const projectId = currentProjectId();
    return projectId
        ? (sampleData.archiveFiles || []).filter(file => file.projectId === projectId)
        : [];
}

function archiveProjectSources()
{
    const projectId = currentProjectId();
    return projectId
        ? (sampleData.sources || []).filter(source => source.projectId === projectId)
        : [];
}

function archiveFileKind(file)
{
    const value = String(file?.kind || file?.type || '').toLowerCase();
    if (value.includes('folder')) return 'folder';
    if (value.includes('pdf')) return 'pdf';
    if (value.includes('image') || value.includes('img') || /\.(jpg|jpeg|png|tif|tiff|webp)$/i.test(file?.name || '')) return 'img';
    if (value.includes('audio') || /\.(mp3|wav|m4a)$/i.test(file?.name || '')) return 'audio';
    if (value.includes('spreadsheet') || /\.(xlsx|xls|csv)$/i.test(file?.name || '')) return 'sheet';
    if (value.includes('document') || /\.(docx|doc|rtf|txt)$/i.test(file?.name || '')) return 'doc';
    if (/\.(zip|7z|rar)$/i.test(file?.name || '')) return 'archive';
    return 'file';
}

function archiveFileTypeLabel(file)
{
    const kind = archiveFileKind(file);
    return ({
        folder: 'Folder',
        pdf: 'PDF document',
        img: 'Image',
        audio: 'Audio',
        sheet: 'Spreadsheet',
        doc: 'Document',
        archive: 'Archive file',
        file: file?.type || 'File'
    })[kind];
}

function archiveFileIcon(file)
{
    const kind = archiveFileKind(file);
    if (kind === 'folder') return `<span class="archive-file-icon folder" aria-hidden="true">${icon.folderyellow}</span>`;
    const label = ({ pdf: 'PDF', img: 'IMG', audio: 'AUD', sheet: 'XLS', doc: 'DOC', archive: 'ZIP', file: 'FILE' })[kind];
    return `<span class="archive-file-icon ${kind}" aria-hidden="true">${escapeHtml(label)}</span>`;
}

function connectedFileMeta(
    file
)
{
    if (!file)
    {
        return 'Archive file';
    }

    return [
        archiveFileTypeLabel(
            file
        ),

        String(
            file.size || ''
        ).trim()
    ]
        .filter(Boolean)
        .join(' · ')
        || 'Archive file';
}

function connectedFileContextConfig(
    contextType
)
{
    return {
        person: {
            noun:
            'person',

            record:
            contextId =>
                getPerson(
                    contextId
                ),

            label:
            record =>
                record?.names?.display
              || record?.name
              || 'this person',

            isLinked:
            (
                file,
                contextId
            ) =>
                archiveConnectionIds(
                    'file',
                    file.id,
                    'person'
                ).includes(
                    contextId
                ),

            unlink:
            (
                file,
                contextId
            ) =>
                archiveSetConnection(
                    'file',
                    file.id,
                    'person',
                    contextId,
                    false
                )
        },

        note: {
            noun:
            'note',

            record:
            contextId =>
                getNote(
                    contextId,
                    {
                        includeArchived:
                    true
                    }
                ),

            label:
            record =>
                record?.title
              || 'Untitled note',

            isLinked:
            (
                file,
                contextId
            ) =>
                archiveConnectionIds(
                    'file',
                    file.id,
                    'note'
                ).includes(
                    contextId
                ),

            unlink:
            (
                file,
                contextId
            ) =>
                archiveSetConnection(
                    'file',
                    file.id,
                    'note',
                    contextId,
                    false
                )
        },

        place: {
            noun:
            'place',

            record:
            contextId =>
                getPlace(
                    contextId
                ),

            label:
            record =>
                record?.name
              || 'this place',

            isLinked:
            (
                file,
                contextId
            ) =>
                archiveConnectionIds(
                    'file',
                    file.id,
                    'place'
                ).includes(
                    contextId
                ),

            unlink:
            (
                file,
                contextId
            ) =>
                archiveSetConnection(
                    'file',
                    file.id,
                    'place',
                    contextId,
                    false
                )
        },

        source: {
            noun:
            'source',

            record:
            contextId =>
                archiveSourceById(
                    contextId
                ),

            label:
            record =>
                record?.title
              || 'Untitled source',

            isLinked:
            (
                file,
                contextId
            ) =>
                archiveConnectionIds(
                    'source',
                    contextId,
                    'file'
                ).includes(
                    file.id
                ),

            unlink:
            (
                file,
                contextId
            ) =>
                archiveSetConnection(
                    'source',
                    contextId,
                    'file',
                    file.id,
                    false
                )
        }
    }[
        contextType
    ] || null;
}

function renderConnectedFileItem({
    file,

    contextType =
        '',

    contextId =
        '',

    allowUnlink =
        true
} = {})
{
    if (!file)
    {
        return '';
    }

    const title =
        file.name
        || file.title
        || 'Untitled file';

    const meta =
        connectedFileMeta(
            file
        );

    const contextConfig =
        connectedFileContextConfig(
            contextType
        );

    const unlinkSupported =
        Boolean(
            allowUnlink
          && contextId
          && contextConfig
        );

    return `
        <div
          class="
            connected-file-item

            ${
                unlinkSupported
                    ? 'can-unlink'
                    : ''
            }
          ">

          <button
            class="
              connected-file-main
            "
            type="button"
            data-connected-file-id="${escapeHtml(
                file.id
            )}"
            aria-label="Open ${escapeHtml(
                title
            )} in Archive">

            ${archiveFileIcon(
                file
            )}

            <span
              class="
                connected-file-copy
              ">

              <strong
                class="
                  connected-file-title
                "
                title="${escapeHtml(
                    title
                )}">

                ${escapeHtml(
                    title
                )}
              </strong>

              <span
                class="
                  connected-file-meta
                "
                title="${escapeHtml(
                    meta
                )}">

                ${escapeHtml(
                    meta
                )}
              </span>
            </span>
          </button>

          ${
                unlinkSupported
                    ? `
                <button
                  class="
                    connected-file-unlink
                  "
                  type="button"
                  data-connected-file-unlink="${escapeHtml(
                        file.id
                    )}"
                  data-connected-file-context-type="${escapeHtml(
                        contextType
                    )}"
                  data-connected-file-context-id="${escapeHtml(
                        contextId
                    )}"
                  aria-label="Unlink ${escapeHtml(
                        title
                    )} from this ${escapeHtml(
                        contextConfig.noun
                    )}"
                  title="Unlink file">

                  ${icon.unlink}
                </button>
              `
                    : ''
            }
        </div>
      `;
}

function renderConnectedFileList({
    files =
        [],

    limit =
        null,

    emptyText =
        'No files linked.',

    contextType =
        '',

    contextId =
        '',

    allowUnlink =
        true
} = {})
{
    const validFiles =
        (
            Array.isArray(
                files
            )
                ? files
                : []
        )
            .filter(Boolean);

    if (!validFiles.length)
    {
        return `
          <div
            class="
              connected-file-empty
            ">

            ${escapeHtml(
                emptyText
            )}
          </div>
        `;
    }

    /*
        null means "no extra limit".
        Do not convert null to Number(null) === 0.
      */
    const hasLimit =
        limit !== null
        && limit !== undefined
        && Number.isFinite(
            Number(
                limit
            )
        )
        && Number(
            limit
        ) >= 0;

    const visibleFiles =
        hasLimit
            ? validFiles.slice(
                0,
                Number(
                    limit
                )
            )
            : validFiles;

    return `
        <div
          class="
            connected-file-list
          ">

          ${visibleFiles
                .map(file =>
                    renderConnectedFileItem({
                        file,

                        contextType,

                        contextId,

                        allowUnlink
                    })
                )
                .join('')}
        </div>
      `;
}

function connectedFileRelationshipExists({
    fileId,
    contextType,
    contextId
})
{
    const file =
        archiveFileById(
            fileId
        );

    const config =
        connectedFileContextConfig(
            contextType
        );

    if (
        !file
        || !config
        || !contextId
    )
    {
        return false;
    }

    return Boolean(
        config.isLinked(
            file,
            contextId
        )
    );
}

function unlinkConnectedFileRelationship({
    fileId,
    contextType,
    contextId
})
{
    const file =
        archiveFileById(
            fileId
        );

    const config =
        connectedFileContextConfig(
            contextType
        );

    if (
        !file
        || !config
        || !contextId
    )
    {
        return false;
    }

    if (
        !config.isLinked(
            file,
            contextId
        )
    )
    {
        return false;
    }

    return Boolean(
        config.unlink(
            file,
            contextId
        )
    );
}

function openConnectedFileUnlinkConfirm({
    fileId,
    contextType,
    contextId,
    onUnlinked =
        null
} = {})
{
    const file =
        archiveFileById(
            fileId
        );

    const config =
        connectedFileContextConfig(
            contextType
        );

    if (
        !file
        || !config
        || !contextId
    )
    {
        return;
    }

    if (
        !connectedFileRelationshipExists({
            fileId,
            contextType,
            contextId
        })
    )
    {
        showToast(
            'This file is no longer linked.'
        );

        return;
    }

    const contextRecord =
        config.record(
            contextId
        );

    if (!contextRecord)
    {
        showToast(
            'Linked record not found.'
        );

        return;
    }

    const fileName =
        file.name
        || file.title
        || 'Untitled file';

    const contextName =
        config.label(
            contextRecord
        );

    openModal(`
        <div
          class="
            modal
            connected-file-unlink-modal
          "
          role="dialog"
          aria-modal="true"
          aria-labelledby="connectedFileUnlinkTitle">

          <div class="modal-header">
            <div>
              <h2
                id="connectedFileUnlinkTitle">

                Unlink file from
                ${escapeHtml(
                    config.noun
                )}?
              </h2>

              <p>
                ${escapeHtml(
                    fileName
                )}
              </p>
            </div>

            <button
              class="
                close-button
              "
              type="button"
              data-close
              aria-label="Close unlink confirmation">

              ${icon.close}
            </button>
          </div>

          <div
            class="
              modal-body
              unlink-relationship-body
            ">

            <div
              class="
                unlink-relationship-warning
                connected-file-unlink-warning
              ">

              <strong>
                The file will not be deleted.
              </strong>

              <span>
                Only the connection between
                “${escapeHtml(
                    fileName
                )}” and
                “${escapeHtml(
                    contextName
                )}” will be removed.
                The file will remain available
                in Archive and keep all its
                other connections.
              </span>
            </div>
          </div>

          <div class="modal-footer">
            <button
              class="
                button
                secondary
              "
              type="button"
              data-close>

              Cancel
            </button>

            <button
              class="
                button
                danger
              "
              type="button"
              data-confirm-connected-file-unlink>

              Unlink file
            </button>
          </div>
        </div>
      `);

    modalBackdrop
        .querySelector(
            '[data-confirm-connected-file-unlink]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                const unlinked =
                    unlinkConnectedFileRelationship({
                        fileId:
                  file.id,

                        contextType,

                        contextId
                    });

                /*
              Match the Connected Note flow:
              close before rerendering the source
              inspector.
            */
                closeModal();

                if (!unlinked)
                {
                    showToast(
                        'The file could not be unlinked.'
                    );

                    return;
                }

                if (
                    typeof onUnlinked
              === 'function'
                )
                {
                    onUnlinked({
                        fileId:
                  file.id,

                        contextType,

                        contextId
                    });
                }
                else
                {
                    render();
                }

                showToast(
                    `File unlinked from ${
                        config.noun
                    }.`
                );
            }
        );
}

function bindConnectedFileLinks(
    root,
    {
        onUnlinked =
            null
    } = {}
)
{
    if (!root)
    {
        return;
    }

    root
        .querySelectorAll(
            '[data-connected-file-id]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    openFamilyArchiveItem(
                        button.dataset
                            .connectedFileId
                    );
                }
            );
        });

    root
        .querySelectorAll(
            '[data-connected-file-unlink]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                event =>
                {
                    event.preventDefault();
                    event.stopPropagation();

                    openConnectedFileUnlinkConfirm({
                        fileId:
                  button.dataset
                      .connectedFileUnlink,

                        contextType:
                  button.dataset
                      .connectedFileContextType
                  || '',

                        contextId:
                  button.dataset
                      .connectedFileContextId
                  || '',

                        onUnlinked
                    });
                }
            );
        });
}

function archiveDateValue(value)
{
    if (value && typeof value === 'object') return genealogyDateSortValue(value);
    if (!value) return 0;
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

function archiveFormatDate(value, fallback = 'Unknown')
{
    if (value && typeof value === 'object') return formatGenealogyDateLabel(value) || t(fallback);
    const parsed = Date.parse(value || '');
    if (!Number.isFinite(parsed)) return value || fallback;
    return new Intl.DateTimeFormat(state.language === 'ru' ? 'ru' : 'en-US', {
        year: 'numeric', month: 'short', day: 'numeric'
    }).format(new Date(parsed));
}

function archiveUniqueIds(values)
{
    return [...new Set((values || []).filter(Boolean))];
}

function restoreModalChoiceFocus({
    modal,
    selector,
    value,
    index = 0,
    fallbackSelector = 'input[type="search"]'
})
{
    requestAnimationFrame(() =>
    {
        const choices = [
            ...(
                modal?.querySelectorAll(
                    selector
                ) || []
            )
        ].filter(choice =>
            !choice.disabled
        );

        const matchingChoice =
            choices.find(choice =>
                choice.value === value
            );

        const nextChoice =
            matchingChoice
          || choices[
              Math.min(
                  Math.max(index, 0),
                  Math.max(choices.length - 1, 0)
              )
          ];

        if (nextChoice)
        {
            nextChoice.focus();
            return;
        }

        modal
            ?.querySelector(
                fallbackSelector
            )
            ?.focus();
    });
}

function archiveEventLabel(event)
{
    if (!event) return 'Event';
    const people = (event.personIds || []).map(id => getPerson(id)?.names?.display).filter(Boolean);
    return [event.title || event.type || 'Event', people.join(' & ')].filter(Boolean).join(' · ');
}

function archiveEventMeta(event)
{
    const date = event?.dateLabel || event?.dateText || event?.sortDate || event?.date || '';
    const place = getPlaceDisplay(event?.placeId) || event?.placeText || '';
    return [date, place].filter(Boolean).join(' · ') || event?.description || 'Genealogy event';
}

function archiveNoteIdsForFile(file)
{
    const reciprocal = (sampleData.notes || [])
        .filter(note => (note.linkedArchiveFileIds || []).includes(file.id))
        .map(note => note.id);
    return archiveUniqueIds([...(file.linkedNoteIds || []), ...reciprocal]);
}

function archiveNoteIdsForSource(
    source
)
{
    return source
        ? sourceTargetIds(
            source.id,
            'note',
            source.projectId
        )
        : [];
}

function archiveFilesForSource(
    sourceId
)
{
    const source =
        archiveSourceById(
            sourceId
        );

    if (!source)
    {
        return [];
    }

    return sourceTargetIds(
        source.id,
        'file',
        source.projectId
    )
        .map(fileId =>
            archiveFileById(
                fileId,
                source.projectId
            )
        )
        .filter(Boolean);
}

function archiveConnectionIds(
    ownerType,
    ownerId,
    entityType
)
{
    if (ownerType === 'file')
    {
        const file =
            archiveFileById(
                ownerId
            );

        if (!file)
        {
            return [];
        }

        if (entityType === 'person')
        {
            return file.linkedPersonIds || [];
        }

        if (entityType === 'event')
        {
            return file.linkedEventIds || [];
        }

        if (entityType === 'note')
        {
            return archiveNoteIdsForFile(
                file
            );
        }

        if (entityType === 'place')
        {
            return archiveFilePlaceIds(file);
        }

        if (entityType === 'source')
        {
            return sourceIdsForTarget(
                'file',
                file.id,
                file.projectId
            );
        }
    }

    if (ownerType === 'source')
    {
        const source =
            archiveSourceById(
                ownerId
            );

        if (!source)
        {
            return [];
        }

        return sourceTargetIds(
            source.id,
            entityType,
            source.projectId
        );
    }

    return [];
}

function archiveEntityConfig(type)
{
    const projectId = currentProjectId();
    const configs = {
        person: {
            singular: 'person', title: 'People', addLabel: 'Add people',
            records: () => (sampleData.people || []).filter(person => !person.deleted && person.projectId === projectId),
            label: record => record?.names?.display || record?.name || 'Person',
            meta: record =>
                archiveFilePersonMeta(
                    record
                )
        },
        event: {
            singular: 'event', title: 'Events', addLabel: 'Add events',
            records: () => (sampleData.events || []).filter(event => event.projectId === projectId),
            label: archiveEventLabel,
            meta: archiveEventMeta
        },
        note: {
            singular: 'note', title: 'Notes', addLabel: 'Add notes',
            records: () => typeof getProjectNotes === 'function' ? getProjectNotes(projectId, { includeArchived: false }) : (sampleData.notes || []).filter(note => note.projectId === projectId && !note.archived),
            label: record => record?.title || 'Untitled note',
            meta: record => typeof noteExcerpt === 'function' ? (noteExcerpt(record, 90) || 'No note content') : 'Research note'
        },
        place: {
            singular: 'place', title: 'Places', addLabel: 'Add places',
            records: () => (sampleData.places || []).filter(place => !place.deleted && place.projectId === projectId),
            label: record => record?.name || 'Place',
            meta: record => (record?.alternativeNames || []).slice(0, 2).join(' · ') || 'Place record'
        },
        photo: {
            singular:
            'photo',

            title:
            'Photos',

            addLabel:
            'Add photos',

            records:
            () =>
                getProjectPhotos(
                    projectId
                ),

            label:
            record =>
                record?.title
              || record?.filename
              || 'Untitled photo',

            meta:
            record =>
                [
                    formatPhotoDate(
                        record
                    ),

                    record?.filename
                ]
                    .filter(Boolean)
                    .join(' · ')
              || 'Photo'
        },
        source: {
            singular: 'source', title: 'Sources', addLabel: 'Add sources',
            records: archiveProjectSources,
            label: record => record?.title || 'Untitled source',
            meta:
            record =>
                [
                    localizedSourceCategoryLabel(
                        record?.category,
                        ''
                    ),

                    record?.providedBy
                ]
                    .filter(Boolean)
                    .join(' · ')
              || 'Source record'
        },
        file: {
            singular: 'file', title: 'Files', addLabel: 'Add files',
            records: archiveProjectFiles,
            label: record => record?.name || 'Untitled file',
            meta: record => [archiveFileTypeLabel(record), archiveFolderPath(record?.folderId)].filter(Boolean).join(' · ')
        }
    };
    return configs[type] || null;
}

function archiveConnectionRecord(
    type,
    id
)
{
    if (type === 'person')
    {
        return getPerson(
            id
        );
    }

    if (type === 'event')
    {
        return (
            sampleData.events || []
        ).find(event =>
            event.id === id
        ) || null;
    }

    if (type === 'note')
    {
        return typeof getNote
          === 'function'
            ? getNote(
                id,
                {
                    includeArchived:
                    true
                }
            )
            : (
                sampleData.notes || []
            ).find(note =>
                note.id === id
            ) || null;
    }

    if (type === 'place')
    {
        return getPlace(
            id
        );
    }

    if (type === 'photo')
    {
        return getPhoto(
            id,
            {
                projectId:
              currentProjectId()
            }
        );
    }

    if (type === 'source')
    {
        return archiveSourceById(
            id
        );
    }

    if (type === 'file')
    {
        return archiveFileById(
            id
        );
    }

    return null;
}

function archiveSyncNoteLink(
    noteId,
    entityType,
    entityId,
    shouldLink
)
{
    if (entityType !== 'file')
    {
        return;
    }

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

    const nextIds =
        new Set(
            note.linkedArchiveFileIds
          || []
        );

    if (shouldLink)
    {
        nextIds.add(
            entityId
        );
    }
    else
    {
        nextIds.delete(
            entityId
        );
    }

    setNoteEntityLinks(
        note.id,
        'archiveFile',
        [...nextIds],
        {
            projectId:
            note.projectId
        }
    );
}

function archiveSetConnection(
    ownerType,
    ownerId,
    entityType,
    entityId,
    shouldLink
)
{
    if (
        ownerType === 'file'
        && entityType === 'source'
    )
    {
        const file =
            archiveFileById(
                ownerId
            );

        return Boolean(
            file
          && setSourceLink(
              entityId,
              'file',
              file.id,
              shouldLink,
              {
                  projectId:
                file.projectId
              }
          )
        );
    }

    if (ownerType === 'source')
    {
        const source =
            archiveSourceById(
                ownerId
            );

        if (
            !source
          || !SOURCE_LINK_TARGET_TYPES
              .includes(
                  entityType
              )
        )
        {
            return false;
        }

        return setSourceLink(
            source.id,
            entityType,
            entityId,
            shouldLink,
            {
                projectId:
              source.projectId
            }
        );
    }

    if (ownerType !== 'file')
    {
        return false;
    }

    const file =
        archiveFileById(
            ownerId
        );

    const record =
        archiveConnectionRecord(
            entityType,
            entityId
        );

    const eventPeople = entityType === 'event' && shouldLink
        ? archiveEventEvidencePeople(record, file?.projectId)
        : null;

    if (
        !file
        || (
            shouldLink
          && !record
        )
        || (
            record?.projectId
          && file.projectId
          && record.projectId
            !== file.projectId
        )
        || (entityType === 'event' && shouldLink && !eventPeople)
    )
    {
        return false;
    }

    if (entityType === 'place')
    {
        const currentIds = archiveFilePlaceIds(file);
        if (!shouldLink && !currentIds.includes(entityId)) return false;
        if (!archiveSetFilePlaces(file, shouldLink
            ? [...currentIds, entityId]
            : currentIds.filter(id => id !== entityId))) return false;
    }
    else
    {
        const field =
            ({
                person:
              'linkedPersonIds',

                event:
              'linkedEventIds',

                note:
              'linkedNoteIds'
            })[entityType];

        if (!field)
        {
            return false;
        }

        const ids =
            new Set(
                file[field] || []
            );

        if (shouldLink)
        {
            ids.add(
                entityId
            );
        }
        else
        {
            ids.delete(
                entityId
            );
        }

        file[field] =
            [...ids];

        if (entityType === 'event' && shouldLink && eventPeople)
        {
            file.linkedPersonIds = [...new Set([
                ...(file.linkedPersonIds || []),
                ...eventPeople.map(person => person.id)
            ])];
        }


        if (entityType === 'note')
        {
            archiveSyncNoteLink(
                entityId,
                'file',
                file.id,
                shouldLink
            );
        }
    }

    file.updatedAt =
        new Date().toISOString();

    file.updated =
        'Just now';

    const savedIds =
        archiveConnectionIds(
            'file',
            file.id,
            entityType
        );

    return shouldLink
        ? savedIds.includes(
            entityId
        )
        : !savedIds.includes(
            entityId
        );
}

function archiveSetConnectionsAtomically(
    writes = []
)
{
    const beforePeople = (sampleData.archiveFiles || []).map(file => [
        file,
        [...(file.linkedPersonIds || [])]
    ]);
    const beforeSourceLinks = [...(sampleData.sourceLinks || [])];
    const normalizedWrites =
        writes.map(write => ({
            ownerType:
            write?.ownerType || '',

            ownerId:
            String(write?.ownerId || '').trim(),

            entityType:
            write?.entityType || '',

            entityId:
            String(write?.entityId || '').trim(),

            shouldLink:
            write?.shouldLink !== false
        }));

    const valid =
        normalizedWrites.every(write =>
        {
            const owner =
                archiveConnectionRecord(
                    write.ownerType,
                    write.ownerId
                );

            const record =
                archiveConnectionRecord(
                    write.entityType,
                    write.entityId
                );

            if (
                !owner
            || !write.entityType
            || !write.entityId
            )
            {
                return false;
            }

            if (
                write.shouldLink
            && !record
            )
            {
                return false;
            }

            return !(
                write.shouldLink
            && owner.projectId
            && record?.projectId
            && owner.projectId
              !== record.projectId
            );
        });

    if (!valid)
    {
        return {
            ok: false,
            changedCount: 0
        };
    }

    const applied =
        [];

    for (const write of normalizedWrites)
    {
        const previousPlace =
            write.ownerType === 'file'
          && write.entityType === 'place'
                ? {
                    linkedPlaceIds: [...(archiveFileById(write.ownerId)?.linkedPlaceIds || [])],
                    placeIds: [...(archiveFileById(write.ownerId)?.placeIds || [])],
                    documentPlaceId: archiveFileById(write.ownerId)?.documentPlaceId,
                    documentPlaceText: archiveFileById(write.ownerId)?.documentPlaceText,
                    updatedAt: archiveFileById(write.ownerId)?.updatedAt,
                    updated: archiveFileById(write.ownerId)?.updated
                }
                : null;

        const wasLinked =
            archiveConnectionIds(
                write.ownerType,
                write.ownerId,
                write.entityType
            ).includes(
                write.entityId
            );

        if (
            wasLinked === write.shouldLink
        )
        {
            continue;
        }

        if (
            !archiveSetConnection(
                write.ownerType,
                write.ownerId,
                write.entityType,
                write.entityId,
                write.shouldLink
            )
        )
        {
            applied
                .slice()
                .reverse()
                .forEach(previous =>
                {
                    if (
                        previous.ownerType === 'file'
                && previous.entityType === 'place'
                    )
                    {
                        const file =
                            archiveFileById(
                                previous.ownerId
                            );

                        if (file)
                        {
                            file.linkedPlaceIds = [...(previous.previousPlace?.linkedPlaceIds || [])];
                            file.placeIds = [...(previous.previousPlace?.placeIds || [])];
                            file.documentPlaceId = previous.previousPlace?.documentPlaceId || null;
                            file.documentPlaceText = previous.previousPlace?.documentPlaceText || '';
                            file.updatedAt = previous.previousPlace?.updatedAt;
                            file.updated = previous.previousPlace?.updated;
                        }
                    }
                    else
                    {
                        archiveSetConnection(
                            previous.ownerType,
                            previous.ownerId,
                            previous.entityType,
                            previous.entityId,
                            previous.wasLinked
                        );
                    }
                });

            beforePeople.forEach(([file, ids]) => { file.linkedPersonIds = ids; });
            sampleData.sourceLinks = beforeSourceLinks;

            return {
                ok: false,
                changedCount: 0
            };
        }

        applied.push({
            ...write,
            wasLinked,
            previousPlace
        });
    }

    return {
        ok: true,
        changedCount:
          applied.length
    };
}

function archiveFileEditIsActive(
    fileId =
        state.archiveSelectedFileId
)
{
    return Boolean(
        state.archiveFileEditing
        && state.archiveFileEditDraft
            ?.fileId === fileId
    );
}

function archiveDocumentDateModel(
    file
)
{
    const stored =
        file?.documentDate
        || {};

    /*
        Canonical records already use the shared
        genealogy-date model.
      */
    if (
        stored.dateType
        || stored.date
        || stored.dateLabel
        || stored.originalText
    )
    {
        return normalizeGenealogyDateInput(
            stored,
            stored.dateType
          || 'Exact date'
        );
    }

    /*
        Convert the existing Archive prototype's
        { type, value } format.
      */
    const legacyType =
        String(
            stored.type || ''
        ).trim();

    const legacyValue =
        String(
            stored.value || ''
        ).trim();

    if (
        !legacyValue
        || legacyType === 'Unknown'
    )
    {
        return emptyGenealogyDate(
            'Exact date'
        );
    }

    let dateType =
        legacyType
        || 'Exact date';

    if (
        dateType === 'Between'
    )
    {
        const parts =
            legacyValue
                .split(
                    /\s+(?:-|to)\s+|[–—]/i
                )
                .map(value =>
                    value.trim()
                )
                .filter(Boolean);

        if (
            parts.length >= 2
        )
        {
            const parsed =
                parseGenealogyDateTextAsType(
                    parts[0],
                    'Between',
                    {
                        date2:
                  parts[1],

                        date2Label:
                  parts[1]
                    }
                );

            if (parsed.valid)
            {
                return parsed.value;
            }
        }
    }

    const parsed =
        parseGenealogyDateTextAsType(
            legacyValue,
            dateType
        );

    return parsed.valid
        ? parsed.value
        : {
            ...emptyGenealogyDate(
                dateType
            ),

            originalText:
              legacyValue
        };
}

function archiveDocumentPlace(
    file
)
{
    const placeId =
        Object.prototype.hasOwnProperty.call(file || {}, 'documentPlaceId')
            ? (file.documentPlaceId || '')
            : ((
            file?.linkedPlaceIds
          || []
        )[0]
        || (
            file?.placeIds
          || []
        )[0]
        || '');

    return {
        placeId,

        placeText:
          String(
              file?.documentPlaceText
            || ''
          ).trim()
    };
}

function archiveApplyDocumentPlace(
    file,
    placeId,
    placeText,
    relatedPlaceIds = archiveFilePlaceIds(file)
        .filter(id => id !== archiveDocumentPlace(file).placeId)
)
{
    const normalizedPlaceId =
        String(
            placeId || ''
        ).trim();

    file.documentPlaceId =
        normalizedPlaceId
        || null;

    file.documentPlaceText =
        String(
            placeText || ''
        ).trim();

    /*
        Preserve compatibility with Places and
        Archive search while making document place
        the single inspector concept.
      */
    file.linkedPlaceIds = archiveUniqueIds([
        normalizedPlaceId,
        ...relatedPlaceIds
    ].filter(Boolean));

    file.placeIds =
        [
            ...file.linkedPlaceIds
        ];
}

function archiveFileEditDraftFromFile(
    file
)
{
    return {
        fileId:
          file.id,

        description:
          file.description
          || '',

        documentDate: {
            ...archiveDocumentDateModel(
                file
            )
        }
    };
}

function normalizedArchiveFileEditDraft(
    draft
)
{
    return {
        description:
          String(
              draft?.description || ''
          ).trim(),

        documentDate:
          mediaDateFromGenealogyModel(
              draft?.documentDate
            || {}
          )
    };
}

function collectArchiveFileEditDraft({
    allowInvalidDate =
        false
} = {})
{
    if (
        !state.archiveFileEditing
    )
    {
        return null;
    }

    const documentDate =
        collectGenealogyDateField(
            'archiveFileDocumentDate',
            {
                allowInvalid:
              allowInvalidDate
            }
        );

    if (!documentDate)
    {
        return null;
    }

    return {
        fileId:
          state.archiveSelectedFileId,

        description:
          main
              .querySelector(
                  '#archiveFileDescription'
              )
              ?.value
              .trim()
          || '',

        documentDate
    };
}

function archiveFileEditIsDirty()
{
    if (
        !state.archiveFileEditing
        || !state.archiveFileEditOriginal
    )
    {
        return false;
    }

    const current =
        collectArchiveFileEditDraft({
            allowInvalidDate:
            true
        });

    /*
        An invalid live date is still an unsaved
        change and must trigger the discard guard.
      */
    if (
        !current
        || current.documentDate
            ?.invalid
    )
    {
        return true;
    }

    return JSON.stringify(
        normalizedArchiveFileEditDraft(
            current
        )
    ) !== JSON.stringify(
        normalizedArchiveFileEditDraft(
            state.archiveFileEditOriginal
        )
    );
}

function resetArchiveFileEditState()
{
    state.archiveFileEditing =
        false;

    state.archiveFileEditOriginal =
        null;

    state.archiveFileEditDraft =
        null;
}

function beginArchiveFileEdit()
{
    const file =
        archiveFileById(
            state.archiveSelectedFileId
        );

    if (!file)
    {
        return;
    }

    const draft =
        archiveFileEditDraftFromFile(
            file
        );

    state.archiveFileEditing =
        true;

    state.archiveFileEditOriginal = {
        ...draft,

        documentDate: {
            ...draft.documentDate
        }
    };

    state.archiveFileEditDraft = {
        ...draft,

        documentDate: {
            ...draft.documentDate
        }
    };

    state.archiveInspectorSections
        .details =
            true;

    renderArchiveMain();
    requestAnimationFrame(() => main.querySelector('#archiveFileDocumentDateInput')?.focus({ preventScroll: true }));
}

function cancelArchiveFileEdit()
{
    runAfterArchiveFileEditGuard(() =>
    {
        resetArchiveFileEditState();
        renderArchiveMain();
        requestAnimationFrame(() => main.querySelector('#archiveEditFile')?.focus({ preventScroll: true }));
    });
}

function saveArchiveFileEdit()
{
    const file =
        archiveFileById(
            state.archiveSelectedFileId
        );

    if (!file)
    {
        resetArchiveFileEditState();
        renderArchiveMain();

        return;
    }

    const draft =
        collectArchiveFileEditDraft();

    if (!draft)
    {
        showToast(
            'Check the historical date before saving.'
        );

        return;
    }

    file.description =
        draft.description
        || '';

    /*
        Store the canonical genealogy-date model.
        The old { type, value } representation is
        no longer written.
      */
    file.documentDate =
        normalizeGenealogyDateInput(
            draft.documentDate,
            draft.documentDate
                ?.dateType
          || 'Exact date'
        );

    file.updatedAt =
        new Date()
            .toISOString();

    file.updated =
        'Just now';

    resetArchiveFileEditState();
    renderArchive();
    requestAnimationFrame(() => main.querySelector('#archiveEditFile')?.focus({ preventScroll: true }));
    showToast(
        'File updated.'
    );
}

function runAfterArchiveFileEditGuard(
    action
)
{
    if (state.archiveFileNameEditingId)
    {
        const value = main.querySelector('#archiveFileNameInput')?.value.trim() || '';
        if (value !== state.archiveFileNameOriginal)
        {
            openModal(`<div class="modal" role="dialog" aria-modal="true" aria-labelledby="archiveDiscardFileNameTitle"><div class="modal-header"><h2 id="archiveDiscardFileNameTitle">${escapeHtml(t('Discard changes?'))}</h2></div><div class="modal-body"><p>${escapeHtml(t('Your unsaved file name will be lost.'))}</p></div><div class="modal-footer"><button class="button secondary" type="button" data-close>${escapeHtml(t('Continue editing'))}</button><button class="button danger" type="button" data-discard-file-name>${escapeHtml(t('Discard changes'))}</button></div></div>`);
            modalBackdrop.querySelector('[data-discard-file-name]')?.addEventListener('click', () =>
            {
                closeModal();
                state.archiveFileNameEditingId = '';
                state.archiveFileNameOriginal = '';
                action();
            });
            return;
        }
        state.archiveFileNameEditingId = '';
        state.archiveFileNameOriginal = '';
        action();
        return;
    }
    if (state.archiveSourceEditingId)
    {
        runAfterArchiveSourceDetailEditGuard(action);
        return;
    }
    if (
        !state.archiveFileEditing
    )
    {
        action();

        return;
    }

    if (
        !archiveFileEditIsDirty()
    )
    {
        resetArchiveFileEditState();
        action();

        return;
    }

    openModal(`
        <div
          class="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="discardArchiveFileEditTitle">

          <div class="modal-header">
            <div>
              <h2
                id="discardArchiveFileEditTitle">
                Discard file changes?
              </h2>

              <p>
                Your unsaved detail changes will be lost.
              </p>
            </div>

            <button
              class="close-button"
              type="button"
              data-close
              aria-label="Close">

              ${icon.close}
            </button>
          </div>

          <div class="modal-footer">
            <button
              class="button secondary"
              type="button"
              data-close>

              Continue editing
            </button>

            <button
              class="button danger"
              type="button"
              data-discard-archive-file-edit>

              Discard changes
            </button>
          </div>
        </div>
      `);

    modalBackdrop
        .querySelector(
            '[data-discard-archive-file-edit]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                closeModal();
                resetArchiveFileEditState();
                action();
            }
        );
}

function beginArchiveFileRename(fileId)
{
    const file = archiveFileById(fileId);
    if (!file) return;
    state.archiveView = 'files';
    state.archiveSelectedFolderId = archiveFileFolderId(file);
    state.archiveSelectedFileId = file.id;
    state.archiveInspectorCollapsed = false;
    state.archiveFileNameEditingId = file.id;
    state.archiveFileNameOriginal = file.name || '';
    renderArchiveMain();
    if (innerWidth <= 900 && !document.body.classList.contains('mobile-details-open'))
        openMobileSurface('details');
    requestAnimationFrame(() => main.querySelector('#archiveFileNameInput')?.focus({ preventScroll: true }));
}

function saveArchiveFileRename()
{
    const file = archiveFileById(state.archiveFileNameEditingId);
    const input = main.querySelector('#archiveFileNameInput');
    const name = input?.value.trim() || '';
    if (!file || !name)
    {
        input?.focus();
        showToast(t('Enter a file name before saving.'));
        return;
    }
    file.name = name;
    file.updatedAt = new Date().toISOString();
    file.updated = 'Just now';
    state.archiveFileNameEditingId = '';
    state.archiveFileNameOriginal = '';
    renderArchiveMain();
    requestAnimationFrame(() => main.querySelector('#archiveRenameFile')?.focus({ preventScroll: true }));
    showToast(t('File renamed.'));
}

function archiveInspectorSectionIsOpen(
    sectionId
)
{
    return state
        .archiveInspectorSections[
            sectionId
        ] !== false;
}

function renderArchiveFileSection(
    sectionId,
    title,
    content,
    actionHtml = '',
    meta = ''
)
{
    return renderInspectorSection(
        sectionId,
        title,
        meta,
        content,
        actionHtml,
        {
            inlineAction:
            Boolean(
                actionHtml
            ),

            alwaysShowAction:
            true,

            open:
            archiveInspectorSectionIsOpen(
                sectionId
            ),

            toggleAttribute:
            'data-archive-section-toggle',

            sectionId:
            `archive-file-section-${sectionId}`
        }
    );
}

function renderArchiveFileSectionAction(
    entityType,
    label,
    locked
)
{
    if (locked)
    {
        return '';
    }

    const attribute =
        {
            person:
            'data-archive-add-file-person',

            event:
            'data-archive-add-file-event',

            note:
            'data-archive-add-file-note',

            source:
            'data-archive-add-file-source'
        }[entityType];

    if (!attribute)
    {
        return '';
    }

    return `
        <button
          class="link"
          type="button"
          ${attribute}>

          ${renderPanelButtonLabel(
                icon.plus,
                label
            )}
        </button>
      `;
}

function archiveSearchText(file)
{
    const people =
        archiveFilePersonIds(file)
            .map(id =>
                getPerson(id)
                    ?.names?.display
            || ''
            )
            .join(' ');

    const events =
        (
            file.linkedEventIds
          || []
        )
            .map(id =>
                archiveEventLabel(
                    archiveConnectionRecord(
                        'event',
                        id
                    )
                )
            )
            .join(' ');

    const notes =
        archiveNoteIdsForFile(file)
            .map(id =>
                archiveConnectionRecord(
                    'note',
                    id
                )?.title
            || ''
            )
            .join(' ');

    const places =
        archiveFilePlaceIds(file)
            .map(id =>
                getPlace(id)?.name
            || ''
            )
            .join(' ');

    const sources =
        sourceIdsForTarget(
            'file',
            file.id,
            file.projectId
        )
            .map(sourceId =>
                archiveSourceById(
                    sourceId,
                    file.projectId
                )?.title
            || ''
            )
            .join(' ');

    return [
        file.name,
        file.description,
        archiveFolderPath(
            file.folderId
        ),
        people,
        events,
        notes,
        places,
        sources
    ]
        .join(' ')
        .toLocaleLowerCase(
            state.language === 'ru'
                ? 'ru'
                : 'en'
        );
}

function archiveFileHasLinks(
    file
)
{
    if (!file)
    {
        return false;
    }

    return Boolean(
        archiveFilePersonIds(
            file
        ).length

        || (
            file.linkedEventIds
          || []
        ).length

        || archiveNoteIdsForFile(
            file
        ).length

        || archiveFilePlaceIds(
            file
        ).length

        || sourceIdsForTarget(
            'file',
            file.id,
            file.projectId
        ).length
    );
}

function archiveDocumentYearInterval(
    file
)
{
    const model =
        archiveDocumentDateModel(
            file
        );

    const text = [
        model.date,
        model.dateLabel,
        model.originalText,
        model.date2,
        model.date2Label
    ]
        .filter(Boolean)
        .join(' ');

    const years =
        (
            text.match(
                /\b\d{4}\b/g
            )
          || []
        )
            .map(Number)
            .filter(year =>
                Number.isInteger(year)
            && year >= 1
            && year <= 9999
            );

    if (!years.length)
    {
        return null;
    }

    const type =
        String(
            model.dateType || ''
        )
            .trim()
            .toLowerCase();

    const firstYear =
        years[0];

    if (type === 'before')
    {
        return {
            from:
            1,

            to:
            Math.max(
                1,
                firstYear - 1
            )
        };
    }

    if (type === 'after')
    {
        return {
            from:
            Math.min(
                9999,
                firstYear + 1
            ),

            to:
            9999
        };
    }

    if (
        type === 'between'
        && years.length >= 2
    )
    {
        return {
            from:
            Math.min(
                years[0],
                years[1]
            ),

            to:
            Math.max(
                years[0],
                years[1]
            )
        };
    }

    return {
        from:
          firstYear,

        to:
          firstYear
    };
}

function archiveDocumentYearMatches(
    file,
    value
)
{
    const range =
        normalizeSharedFilterYearRange(
            value
        );

    if (!range.mode)
    {
        return true;
    }

    if (
        sharedFilterYearRangeError(
            range
        )
    )
    {
        return false;
    }

    const fileInterval =
        archiveDocumentYearInterval(
            file
        );

    if (!fileInterval)
    {
        return false;
    }

    const fromYear =
        sharedFilterYearNumber(
            range.from
        );

    let filterFrom = 1;
    let filterTo = 9999;

    if (range.mode === 'before')
    {
        filterTo =
            Math.max(
                1,
                fromYear - 1
            );
    }

    if (range.mode === 'after')
    {
        filterFrom =
            Math.min(
                9999,
                fromYear + 1
            );
    }

    if (range.mode === 'between')
    {
        filterFrom =
            fromYear;

        filterTo =
            sharedFilterYearNumber(
                range.to
            );
    }

    /*
      * Historical date ranges match when they
      * overlap the requested period.
      */
    return (
        fileInterval.from
          <= filterTo

        && fileInterval.to
          >= filterFrom
    );
}

function archiveFileMatchesFilters(
    file,
    filters,
    query
)
{
    if (
        filters.sourceId
        && !archiveFilesForSource(filters.sourceId)
            .some(linkedFile => linkedFile.id === file.id)
    )
    {
        return false;
    }
    if (
        query
        && !archiveSearchText(
            file
        ).includes(query)
    )
    {
        return false;
    }

    if (
        filters.fileType !== 'all'
        && archiveFileKind(file)
          !== filters.fileType
    )
    {
        return false;
    }

    if (
        filters.connections === 'linked'
        && !archiveFileHasLinks(file)
    )
    {
        return false;
    }

    if (
        filters.connections === 'unlinked'
        && archiveFileHasLinks(file)
    )
    {
        return false;
    }

    if (
        filters.favouriteOnly
        && !file.favorite
    )
    {
        return false;
    }

    if (
        filters.personIds.length
        && !archiveFilePersonIds(file)
            .some(personId =>
                filters.personIds.includes(
                    personId
                )
            )
    )
    {
        return false;
    }

    if (
        filters.placeIds.length
        && !archiveFilePlaceIds(file)
            .some(placeId =>
                filters.placeIds.includes(
                    placeId
                )
            )
    )
    {
        return false;
    }

    if (
        !archiveDocumentYearMatches(
            file,
            filters.documentYears
        )
    )
    {
        return false;
    }

    return true;
}

function archiveSortFilteredFiles(
    files
)
{
    return appSortRecords(files, {
        field:
          state.archiveFileSort,

        direction:
          state.archiveFileSortDirection,

        extractors: {
            name: {
                type:
              'text',

                get:
              file => file.name
            },

            updated: {
                type:
              'number',

                get:
              file =>
                  appSortTimestamp(
                      file.updatedAt
                  )
            },

            added: {
                type:
              'number',

                get:
              file =>
                  appSortTimestamp(
                      file.addedAt
                  )
            },

            type: {
                type:
              'text',

                get:
              archiveFileTypeLabel
            }
        },

        getFallback:
          file => file.name
    });
}

function archiveMatchingFiles()
{
    const filters =
        archiveEffectiveFileFilters();

    const query =
        String(
            state.archiveSearch || ''
        )
            .trim()
            .toLocaleLowerCase(
                state.language === 'ru'
                    ? 'ru'
                    : 'en'
            );

    /*
      * Without a filter, Archive remains ordinary
      * direct-folder browsing.
      */
    if (
        !archiveFileFilteringActive(
            filters
        )
    )
    {
        return archiveSortFilteredFiles(
            archiveProjectFiles()
                .filter(file =>
                    archiveFileFolderId(
                        file
                    ) ===
              archiveNormalizeFolderId(
                  state.archiveSelectedFolderId
              )
                )
        );
    }

    let files =
        archiveProjectFiles();

    if (filters.scope === 'folder')
    {
        const scopeRoot =
            archiveNormalizeFolderId(
                state.archiveFilterScopeFolderId
            );

        const scopeIds =
            archiveFolderScopeIds(
                scopeRoot
            );

        files =
            files.filter(file =>
                scopeIds.has(
                    archiveFileFolderId(
                        file
                    )
                )
            );
    }

    return archiveSortFilteredFiles(
        files.filter(file =>
            archiveFileMatchesFilters(
                file,
                filters,
                query
            )
        )
    );
}

function archiveFolderMatchProjection(
    matchingFiles =
        archiveMatchingFiles()
)
{
    const visibleFolderIds =
        new Set();

    const matchingCountByFolder =
        new Map();

    const filters =
        archiveEffectiveFileFilters();

    const scopeRoot =
        filters.scope === 'folder'
            ? archiveNormalizeFolderId(
                state.archiveFilterScopeFolderId
            )
            : null;

    matchingFiles.forEach(file =>
    {
        let folderId =
            archiveFileFolderId(
                file
            );

        while (folderId)
        {
            visibleFolderIds.add(
                folderId
            );

            matchingCountByFolder.set(
                folderId,
                (
                    matchingCountByFolder.get(
                        folderId
                    )
              || 0
                ) + 1
            );

            if (
                scopeRoot
            && folderId === scopeRoot
            )
            {
                break;
            }

            const folder =
                archiveFolderById(
                    folderId
                );

            folderId =
                archiveFolderParentId(
                    folder
                );
        }
    });

    return {
        visibleFolderIds,
        matchingCountByFolder
    };
}

function archiveVisibleFiles(
    matchingFiles =
        archiveMatchingFiles()
)
{
    if (
        !archiveFileFilteringActive()
        || state.archiveFilterPresentation
          === 'flat'
    )
    {
        return matchingFiles;
    }

    const folderId =
        archiveNormalizeFolderId(
            state.archiveSelectedFolderId
        );

    return matchingFiles.filter(file =>
        archiveFileFolderId(
            file
        ) === folderId
    );
}

function archiveVisibleChildFolders(
    matchingFiles =
        archiveMatchingFiles()
)
{
    if (state.archiveView === 'favorites' && !state.archiveSelectedFolderId)
    {
        const query = String(state.archiveSearch || '').trim().toLocaleLowerCase();
        return (sampleData.archiveFolders || []).filter(folder =>
            folder.projectId === currentProjectId() && folder.favorite
            && (!query || folder.name.toLocaleLowerCase().includes(query)));
    }

    if (
        !archiveFileFilteringActive()
    )
    {
        return archiveFolderChildren(
            archiveNormalizeFolderId(
                state.archiveSelectedFolderId
            )
        );
    }

    if (
        state.archiveFilterPresentation
          === 'flat'
    )
    {
        return [];
    }

    const projection =
        archiveFolderMatchProjection(
            matchingFiles
        );

    return archiveFolderChildren(
        archiveNormalizeFolderId(
            state.archiveSelectedFolderId
        )
    ).filter(folder =>
        projection.visibleFolderIds.has(
            folder.id
        )
    );
}

function archiveSourceConnectedSearchText(
    source
)
{
    if (!source)
    {
        return '';
    }

    return sourceLinksForSource(
        source.id,
        '',
        source.projectId
    )
        .flatMap(link =>
        {
            const record =
                sourceTargetRecord(
                    link.targetType,
                    link.targetId,
                    link.projectId
                );

            const config =
                archiveEntityConfig(
                    link.targetType
                );

            if (!record || !config)
            {
                return [];
            }

            return [
                config.title,
                config.singular,
                config.label(
                    record
                ),
                config.meta(
                    record
                )
            ];
        })
        .filter(Boolean)
        .join(' ');
}

function archiveSourceSearchText(
    source
)
{
    return [
        source?.title,

        sourceCategoryLabel(
            source?.category,
            ''
        ),

        localizedSourceCategoryLabel(
            source?.category,
            ''
        ),

        source?.providedBy,
        source?.location,
        source?.reference,
        source?.url,
        source?.notes,

        archiveSourceConnectedSearchText(
            source
        )
    ]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase(
            state.language === 'ru'
                ? 'ru'
                : 'en'
        );
}

function archiveFilteredSources()
{
    const query =
        String(
            state.archiveSearch || ''
        )
            .trim()
            .toLocaleLowerCase(
                state.language === 'ru'
                    ? 'ru'
                    : 'en'
            );

    let sources =
        archiveProjectSources();

    const targetFilter =
        currentArchiveSourceTargetFilter();

    if (targetFilter)
    {
        const connectedSourceIds =
            new Set(
                sourceIdsForTarget(
                    targetFilter.targetType,
                    targetFilter.targetId,
                    targetFilter.projectId
                )
            );

        sources =
            sources.filter(source =>
                connectedSourceIds.has(
                    source.id
                )
            );
    }

    if (
        state.archiveSourceCategoryFilter
        && state.archiveSourceCategoryFilter
          !== 'all'
    )
    {
        sources =
            sources.filter(source =>
                source.category
              === state
                  .archiveSourceCategoryFilter
            );
    }
    if (
        state.archiveSourceConnectionFilter
          === 'linked'
    )
    {
        sources =
            sources.filter(source =>
                archiveSourceConnectionCount(
                    source
                ) > 0
            );
    }

    if (
        state.archiveSourceConnectionFilter
          === 'unlinked'
    )
    {
        sources =
            sources.filter(source =>
                archiveSourceConnectionCount(
                    source
                ) === 0
            );
    }
    if (
        state.archiveSourceFavouriteOnly
    )
    {
        sources =
            sources.filter(source =>
                source.favorite
            );
    }

    if (query)
    {
        sources =
            sources.filter(source =>
                archiveSourceSearchText(
                    source
                ).includes(
                    query
                )
            );
    }

    return appSortRecords(
        sources,
        {
            field:
            state.archiveSourceSort,

            direction:
            state.archiveSourceSortDirection,

            extractors: {
                name: {
                    type:
                'text',

                    get:
                source =>
                    source.title
                },

                updated: {
                    type:
                'number',

                    get:
                source =>
                    appSortTimestamp(
                        source.updatedAt
                    )
                },

                created: {
                    type:
                'number',

                    get:
                source =>
                    appSortTimestamp(
                        source.createdAt
                    )
                }
            },

            getFallback:
            source =>
                source.title
        }
    );
}

function ensureArchiveSelection()
{
    state.archiveSelectedFolderId =
        archiveNormalizeFolderId(
            state.archiveSelectedFolderId
        );

    state.archiveSelectedFileIds =
        archiveUniqueIds(
            state.archiveSelectedFileIds
        )
            .filter(id =>
                archiveFileById(
                    id
                )
            );

    state.archiveSelectedFolderIds = archiveUniqueIds(state.archiveSelectedFolderIds || [])
        .filter(id => archiveFolderById(id));

    if (state.archiveView === 'sources') state.archiveSelectedFolderIds = [];

    if (
        (
            state.archiveView
            === 'files'
          || state.archiveView
            === 'favorites'
        )
        && state.archiveSelectedFileId
        && !archiveFileById(
            state.archiveSelectedFileId
        )
    )
    {
        state.archiveSelectedFileId =
            null;
    }

    /*
        A selected folder item is valid only when
        it is a direct child of the current Files
        location and folders are actually visible.
      */
    const selectedFolderItem =
        archiveFolderById(
            state.archiveSelectedFolderItemId
        );

    const currentFolderId =
        archiveNormalizeFolderId(
            state.archiveSelectedFolderId
        );

    const folderItemVisible =
        state.archiveView === 'files'
        && !archiveFileFilteringActive()
        && selectedFolderItem
        && archiveFolderParentId(
            selectedFolderItem
        ) === currentFolderId;

    if (
        !folderItemVisible
        || state.archiveSelectedFileId
    )
    {
        state.archiveSelectedFolderItemId =
            null;
    }

    if (
        state.archiveView
          === 'sources'
        && state.archiveSelectedSourceId
        && !archiveSourceById(
            state.archiveSelectedSourceId
        )
    )
    {
        state.archiveSelectedSourceId =
            null;
    }

    if (
        state.archiveView
          === 'sources'
    )
    {
        state.archiveSelectedFolderItemId =
            null;
    }

    if (
        state.archiveView
          === 'sources'
        && !state.archiveSelectedSourceId
    )
    {
        state.archiveSelectedSourceId =
            archiveFilteredSources()[0]?.id
          || null;
    }
}

function renderArchive()
{
    appNavigationObserve();
    workspace.classList.remove(
        'no-sidebar'
    );

    archivePruneNavigationHistory();
    ensureArchiveSelection();

    renderArchiveSidebar();
    renderArchiveMain();
}

function renderArchivePreservingSourceInspectorScroll()
{
    if (
        state.archiveView !== 'sources'
        || !state.archiveSelectedSourceId
    )
    {
        renderArchive();
        return;
    }

    const sourceId =
        state.archiveSelectedSourceId;

    const currentScroller =
        main.querySelector(
            '.archive-inspector-scroll'
        );

    const previousScrollTop =
        currentScroller?.scrollTop
        || 0;

    renderArchive();

    requestAnimationFrame(() =>
    {
        /*
          Do not restore an old position if rendering
          changed the selected Source or left Sources.
        */
        if (
            state.archiveView !== 'sources'
          || state.archiveSelectedSourceId
            !== sourceId
        )
        {
            return;
        }

        const nextScroller =
            main.querySelector(
                '.archive-inspector-scroll'
            );

        if (!nextScroller)
        {
            return;
        }

        const maximumScrollTop =
            Math.max(
                0,
                nextScroller.scrollHeight
              - nextScroller.clientHeight
            );

        nextScroller.scrollTop =
            Math.min(
                previousScrollTop,
                maximumScrollTop
            );
    });
}

function renderArchivePreservingFileInspectorScroll()
{
    if (
        !archiveIsLocationView(
            state.archiveView
        )
        || !state.archiveSelectedFileId
    )
    {
        renderArchive();
        return;
    }

    const fileId =
        state.archiveSelectedFileId;

    const currentScroller =
        main.querySelector(
            '.archive-inspector-scroll'
        );

    const previousScrollTop =
        currentScroller?.scrollTop
        || 0;

    renderArchive();

    requestAnimationFrame(() =>
    {
        /*
          Do not restore the previous position if the
          selected file or Archive view changed while
          the inspector was rendering.
        */
        if (
            !archiveIsLocationView(
                state.archiveView
            )
          || state.archiveSelectedFileId
            !== fileId
        )
        {
            return;
        }

        const nextScroller =
            main.querySelector(
                '.archive-inspector-scroll'
            );

        if (!nextScroller)
        {
            return;
        }

        const maximumScrollTop =
            Math.max(
                0,
                nextScroller.scrollHeight
              - nextScroller.clientHeight
            );

        nextScroller.scrollTop =
            Math.min(
                previousScrollTop,
                maximumScrollTop
            );
    });
}

function renderArchiveSidebarNavItem(
    id,
    label,
    svg
)
{
    const active =
        id === 'files'
            ? state.archiveView === 'files'
            && archiveIsRootLocation(
                state.archiveSelectedFolderId
            )
            : state.archiveView === id;

    return `
        <button
          class="
            side-link
            ${active ? 'active' : ''}
          "
          type="button"
          data-archive-view="${escapeHtml(id)}"
          aria-current="${
                active
                    ? 'page'
                    : 'false'
            }">

          ${svg}

          <span>
            ${escapeHtml(label)}
          </span>
        </button>
      `;
}

function renderArchiveFolderTree(
    parentId = null,
    depth = 0
)
{
    const folders =
        archiveFolderChildren(
            parentId
        );

    return folders
        .map(folder =>
        {
            const children =
                archiveFolderChildren(
                    folder.id
                );

            const expanded =
                Boolean(
                    state
                        .archiveExpandedFolders[
                            folder.id
                        ]
                );

            const active =
                folder.id
            === archiveNormalizeFolderId(
                state.archiveSelectedFolderId
            );

            return `
            <div
              role="treeitem"
              aria-selected="${
                    active
                        ? 'true'
                        : 'false'
                }"
              ${
                    children.length
                        ? `aria-expanded="${String(
                            expanded
                        )}"`
                        : ''
                }>

              <div
                class="
                  archive-folder-row
                  ${
                        active
                            ? 'active'
                            : ''
                    }
                "
                style="padding-left:${
                    Math.max(
                        4,
                        depth * 14 + 4
                    )
                }px">

                ${
                    children.length
                        ? `
                      <button
                        class="
                          archive-folder-toggle
                          ${
                                expanded
                                    ? 'expanded'
                                    : ''
                            }
                        "
                        type="button"
                        data-archive-toggle-folder="${escapeHtml(
                            folder.id
                        )}"
                        aria-label="${
                            expanded
                                ? 'Collapse'
                                : 'Expand'
                        } ${escapeHtml(
                            folder.name
                        )}">

                        ${icon.chevron}
                      </button>
                    `
                        : `
                      <span
                        aria-hidden="true">
                      </span>
                    `
                }

                <button
                  class="
                    archive-folder-main
                  "
                  type="button"
                  data-archive-folder="${escapeHtml(
                        folder.id
                    )}"
                  title="${escapeHtml(
                        folder.name
                    )}">

                  ${icon.folderyellow}

                  <span>
                    ${escapeHtml(
                        folder.name
                    )}
                  </span>
                </button>
              </div>

              ${
                    children.length
                && expanded
                        ? `
                    <div role="group">
                      ${renderArchiveFolderTree(
                            folder.id,
                            depth + 1
                        )}
                    </div>
                  `
                        : ''
                }
            </div>
          `;
        })
        .join('');
}

function archiveRevealPendingFolderInSidebar()
{
    const folderId =
        state.archivePendingTreeRevealId;

    if (!folderId)
    {
        return;
    }

    requestAnimationFrame(
        () =>
        {
            const button =
                [
                    ...sidebar.querySelectorAll(
                        '[data-archive-folder]'
                    )
                ].find(item =>
                    item.dataset
                        .archiveFolder
                === folderId
                );

            button?.scrollIntoView({
                block:
              'nearest',

                inline:
              'nearest'
            });

            state.archivePendingTreeRevealId =
                null;
        }
    );
}

function renderArchiveSourceFilters()
{
    const sources =
        archiveProjectSources();

    const populatedCategories =
        SOURCE_CATEGORIES.filter(
            category =>
                sources.some(source =>
                    source.category
                === category.value
                )
        );

    const button = ({
        value,
        label,
        active,
        title = ''
    }) => `
        <button
          class="
            archive-source-filter
            ${active ? 'active' : ''}
          "
          type="button"
          data-archive-source-filter="${escapeHtml(value)}"
          aria-pressed="${active ? 'true' : 'false'}"
          ${
                title
                    ? `title="${escapeHtml(title)}"`
                    : ''
            }>

          <span class="archive-source-filter-label">
            ${escapeHtml(label)}
          </span>
        </button>
      `;

    return `
        <div class="archive-source-browser">
          <div
            class="archive-source-filter-list"
            role="group"
            aria-label="Browse sources">

            ${button({
                value:
                'all',

                label:
                'All sources',

                active:
                state.archiveSourceCategoryFilter
                  === 'all'
            })}
          </div>

          ${
                populatedCategories.length
                    ? `
                <div>
                  <div class="side-section-title">
                    Source categories
                  </div>

                  <div
                    class="archive-source-filter-list"
                    role="group"
                    aria-label="Source categories">

                    ${populatedCategories
                        .map(category =>
                            button({
                                value:
                            category.value,

                                label:
                            category.shortLabel,

                                title:
                            category.label,

                                active:
                            state
                                .archiveSourceCategoryFilter
                              === category.value
                            })
                        )
                        .join('')}
                  </div>
                </div>
              `
                    : ''
            }
        </div>
      `;
}

function openArchiveCreateFolderFromTrigger(
    button
)
{
    const parentId =
        button?.dataset
            .archiveParentFolder
        || state.archiveSelectedFolderId;

    runAfterArchiveFileEditGuard(
        () =>
        {
            openArchiveCreateFolderModal(
                parentId
            );
        }
    );
}

function renderArchiveSidebar()
{
    const sourceView =
        state.archiveView
          === 'sources';
    sidebar.innerHTML = `
          <nav
            class="archive-sidebar"
            aria-label="Archive navigation">

            <section class="archive-sidebar-section">
              <div class="side-section-title">
                Navigation
              </div>

              <div class="side-nav">
                ${renderArchiveSidebarNavItem(
                    'files',
                    ARCHIVE_ROOT_LABEL,
                    icon.folder
                )}

                ${renderArchiveSidebarNavItem(
                    'favorites',
                    'Favourites',
                    icon.star
                )}

                ${renderArchiveSidebarNavItem(
                    'sources',
                    'Sources',
                    icon.archive
                )}
              </div>
            </section>

            <section
              class="
                archive-sidebar-section
                archive-sidebar-tree-section
              ">

              <div
                class="
                  side-section-title
                  ${
                        sourceView
                            ? ''
                            : 'with-add'
                    }
                ">

                <span>
                  ${
                        sourceView
                            ? 'Browse sources'
                            : 'Folders'
                    }
                </span>

                ${
                    sourceView
                        ? ''
                        : `
                      <button
                        class="side-add-button"
                        type="button"
                        data-archive-create-folder
                        aria-label="Create folder"
                        title="Create folder">

                        ${icon.plus}
                      </button>
                    `
                }
              </div>

              ${
                    sourceView
                        ? renderArchiveSourceFilters()
                        : `
                    <div
                      class="
                        archive-folder-tree
                        archive-sidebar-folder-tree
                      "
                      role="tree"
                      aria-label="Archive folder tree">

                      ${archiveFolderChildren().length
                            ? renderArchiveFolderTree()
                            : `<div class="sidebar-entity-empty">${escapeHtml(t('No folders yet'))}</div>`}
                    </div>
                  `
                }
            </section>
          </nav>
        `;

    sidebar
        .querySelectorAll(
            '[data-archive-view]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    const nextView =
                        button.dataset
                            .archiveView;

                    if (
                        nextView === 'sources'
                    )
                    {
                        runAfterArchiveFileEditGuard(
                            () =>
                            {
                                archiveRememberCurrentLocation();

                                state.archiveView =
                                    'sources';

                                state.archiveSearch =
                                    '';

                                state.archiveSelectedFileId =
                                    null;

                                state.archiveSelectedFileIds =
                                    [];

                                state.archiveInspectorCollapsed =
                                    false;
                                state.archiveSourceTargetFilter = null;
                                ensureArchiveSelection();
                                renderArchive();
                            }
                        );

                        return;
                    }

                    archiveNavigateToLocation({
                        view:
                  nextView,

                        folderId:
                  null,

                        search:
                  '',

                        fileFilters: {
                            ...archiveFileFiltersWithDefaults(
                                state.archiveFileFilters
                            ),

                            favouriteOnly:
                    nextView === 'favorites'
                        },

                        filterPresentation:
                  nextView === 'favorites'
                      ? 'flat'
                      : state.archiveFilterPresentation,

                        filterScopeFolderId:
                  null,

                        selectedFileId:
                  null,

                        inspectorCollapsed:
                  false
                    });
                }
            );
        });

    sidebar
        .querySelectorAll(
            '[data-archive-source-filter]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    const value =
                        button.dataset
                            .archiveSourceFilter;

                    if (
                        value !== 'all'
              && !SOURCE_CATEGORY_BY_VALUE
                  .has(value)
                    )
                    {
                        return;
                    }
                    state.archiveSourceTargetFilter = null;
                    state.archiveSourceCategoryFilter =
                        value;

                    state.archiveSelectedSourceId =
                        null;

                    renderArchive();
                }
            );
        });

    sidebar
        .querySelector(
            '[data-archive-create-folder]'
        )
        ?.addEventListener(
            'click',
            event =>
            {
                event.stopPropagation();

                openArchiveCreateFolderFromTrigger(
                    event.currentTarget
                );
            }
        );

    sidebar
        .querySelectorAll(
            '[data-archive-toggle-folder]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                event =>
                {
                    event.stopPropagation();

                    const id =
                        button.dataset
                            .archiveToggleFolder;

                    state.archiveExpandedFolders[id] =
                        !state
                            .archiveExpandedFolders[id];

                    renderArchiveSidebar();
                }
            );
        });

    sidebar
        .querySelectorAll(
            '[data-archive-folder]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    archiveNavigateToLocation(
                        {
                            view:
                    state.archiveView
                      === 'favorites'
                        ? 'favorites'
                        : 'files',

                            folderId:
                    button.dataset
                        .archiveFolder,

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
                        },
                        {
                            expandCurrent:
                    true
                        }
                    );
                }
            );
        });

    localizeUI(
        sidebar
    );

    if (innerWidth > 900)
    {
        sidebar.querySelectorAll('[data-archive-folder]').forEach(button =>
            archiveBindDropTarget(button, button.dataset.archiveFolder));
        archiveBindDropTarget(sidebar.querySelector('[data-archive-view="files"]'), null);
        archiveBindDragAutoscroll(sidebar.querySelector('.archive-sidebar-folder-tree'));
    }

    archiveRevealPendingFolderInSidebar();
}

function ensureArchiveVisibleSelection()
{
    if (
        state.archiveView === 'sources'
    )
    {
        const visibleSources =
            archiveFilteredSources();

        const visibleSourceIds =
            new Set(
                visibleSources.map(
                    source =>
                        source.id
                )
            );

        if (
            state.archiveSelectedSourceId
          && !visibleSourceIds.has(
              state.archiveSelectedSourceId
          )
        )
        {
            state.archiveSelectedSourceId =
                visibleSources[0]?.id
            || null;
        }

        return;
    }

    const visibleFiles =
        archiveVisibleFiles();

    const visibleFileIds =
        new Set(
            visibleFiles.map(
                file =>
                    file.id
            )
        );

    /*
        Do not retain hidden batch selections.
        Otherwise actions could affect files the
        user cannot currently see.
      */
    state.archiveSelectedFileIds =
        (
            state.archiveSelectedFileIds
          || []
        ).filter(
            fileId =>
                visibleFileIds.has(
                    fileId
                )
        );

    const visibleFolderIds = new Set(archiveVisibleChildFolders().map(folder => folder.id));
    state.archiveSelectedFolderIds = (state.archiveSelectedFolderIds || [])
        .filter(id => visibleFolderIds.has(id));

    if (
        state.archiveSelectedFileId
        && !visibleFileIds.has(
            state.archiveSelectedFileId
        )
    )
    {
        state.archiveSelectedFileId =
            null;
    }
}

let archiveRenderedLocationKey = null;

function renderArchiveMain()
{
    archiveImageUnmount();
    const locationKey = `${currentProjectId() || ''}:${state.archiveView}:${state.archiveSelectedFolderId || ''}`;
    if (archiveRenderedLocationKey !== null && locationKey !== archiveRenderedLocationKey)
    {
        archiveMobileSelectMode = false;
        state.archiveSelectedFileIds = [];
        state.archiveSelectedFolderIds = [];
    }
    ensureArchiveVisibleSelection();
    const previousScroll = main.querySelector('.archive-main')?.scrollTop || 0;
    const previousInspectorScroll = main.querySelector('.archive-inspector-scroll')?.scrollTop || 0;
    const previousPageScroll = document.scrollingElement?.scrollTop || 0;

    main.innerHTML = `
        <div
          class="
            archive-shell
            ${state.archiveFileLayout === 'images' && state.archiveView !== 'sources' ? 'archive-image-shell' : ''}

            ${
                state.archiveInspectorCollapsed
                    ? 'inspector-collapsed'
                    : ''
            }

            ${
                archiveFileEditIsActive()
                    ? 'file-editing'
                    : ''
            }
          ">

          <section
            class="archive-main"
            aria-label="Archive workspace">

            ${
                state.archiveView
                === 'sources'
                    ? renderArchiveSourcesView()
                    : renderArchiveFilesView()
            }
          </section>

          ${
                state.archiveInspectorCollapsed
                    ? renderArchiveInspectorCollapsed()
                    : renderArchiveInspector()
            }
        </div>
      `;

    bindArchiveControls();
    localizeUI(main);
    mountArchiveImageView();
    const nextInspectorScroll = main.querySelector('.archive-inspector-scroll');
    if (nextInspectorScroll) nextInspectorScroll.scrollTop = previousInspectorScroll;
    if (locationKey === archiveRenderedLocationKey)
    {
        main.querySelector('.archive-main').scrollTop = previousScroll;
        if (document.scrollingElement) document.scrollingElement.scrollTop = previousPageScroll;
    }
    archiveRenderedLocationKey = locationKey;
}

function renderArchivePageHead({
    title,
    subtitle,
    actions = ''
})
{
    return `
        <header
          class="
            archive-page-head
          ">

          <div
            class="
              archive-page-head-copy
            ">

            <h1 class="app-page-title">
              ${escapeHtml(
                    title
                )}
            </h1>

            <p>
              ${escapeHtml(
                    subtitle
                )}
            </p>
          </div>

          ${
                actions
                    ? `
                <div
                  class="
                    archive-page-actions
                  ">

                  ${actions}
                </div>
              `
                    : ''
            }
        </header>
      `;
}

function archiveFilesViewSubtitle(
    currentFolder,
    person
)
{
    if (person)
    {
        return `Files linked to ${
            personResourceDisplayName(
                person
            )
        }.`;
    }

    if (
        state.archiveView
          === 'favorites'
    )
    {
        return currentFolder
            ? `Favourites in ${
                currentFolder.name
            }.`
            : 'Files and folders marked as favourites.';
    }

    if (!currentFolder)
    {
        return 'Organize your research files and folders.';
    }

    return `Browse files and subfolders in ${
        currentFolder.name
    }.`;
}

function renderArchiveFilesHeaderActions()
{
    const favoritesView =
        state.archiveView
          === 'favorites';

    return `
        ${
            favoritesView
                ? ''
                : `
              <button
                class="
                  button secondary
                "
                type="button"
                data-archive-create-folder aria-label="${escapeHtml(t('New folder'))}" title="${escapeHtml(t('New folder'))}">

                ${icon.folder}
                <span>New folder</span>
              </button>
            `
        }

        <button
          class="
            button primary
          "
          type="button"
          data-archive-add-files aria-label="${escapeHtml(t('Add files'))}" title="${escapeHtml(t('Add files'))}">

          ${icon.plus}
          <span>Add files</span>
        </button>
      `;
}

function archiveSourcesViewSubtitle()
{
    return 'Document where your research files and information came from.';
}

function renderArchiveSourcesHeaderActions()
{
    return `
        <button
          class="
            button primary
          "
          type="button"
          data-archive-add-source>

          ${icon.plus}
          Add source
        </button>
      `;
}

function renderArchiveLocationButton(
    action,
    label,
    modifier,
    disabled
)
{
    return `
        <button
          class="
            archive-location-button
            ${modifier}
          "
          type="button"
          data-archive-nav-${action}
          aria-label="${escapeHtml(
                label
            )}"
          title="${escapeHtml(
                label
            )}"
          ${
                disabled
                    ? 'disabled aria-disabled="true"'
                    : ''
            }>

          ${icon.arrow}
        </button>
      `;
}

function renderArchiveBreadcrumbs()
{
    const folders =
        archiveFolderAncestors(
            state.archiveSelectedFolderId
        );

    const favoritesView =
        state.archiveView
          === 'favorites';

    const rootLabel =
        favoritesView
            ? 'Favourites'
            : ARCHIVE_ROOT_LABEL;

    const rootCurrent =
        !folders.length;

    return `
        <nav
          class="
            archive-breadcrumbs
          "
          aria-label="Folder path" title="${escapeHtml(archiveFolderPath(state.archiveSelectedFolderId) || t(rootLabel))}">
          <details class="archive-compact-path"><summary aria-label="${escapeHtml(t('Folder path'))}">${icon.folderyellow}</summary><div class="archive-compact-path-menu"><button type="button" data-archive-breadcrumb-root>${escapeHtml(t(rootLabel))}</button>${folders.map(folder => `<button type="button" data-archive-breadcrumb="${escapeHtml(folder.id)}">${escapeHtml(folder.name)}</button>`).join('')}</div></details>

          <span
            class="
              archive-breadcrumb-leading-icon
            "
            aria-hidden="true">

            ${
                favoritesView
                    ? icon.star
                    : icon.folderyellow
            }
          </span>

          <ol>
            <li
              class="
                archive-breadcrumb-item
                archive-breadcrumb-item--root
              ">

              ${
                    rootCurrent
                        ? `
                    <span
                      class="
                        archive-breadcrumb-current
                      "
                      aria-current="page"
                      title="${escapeHtml(
                            rootLabel
                        )}">

                      ${escapeHtml(
                            rootLabel
                        )}
                    </span>
                  `
                        : `
                    <button
                      type="button"
                      data-archive-breadcrumb-root
                      aria-label="Go to ${escapeHtml(
                            rootLabel
                        )} root"
                      title="${escapeHtml(
                            rootLabel
                        )}">

                      ${escapeHtml(
                            rootLabel
                        )}
                    </button>
                  `
                }
            </li>

            ${folders
                .map(
                    (
                        folder,
                        index
                    ) =>
                    {
                        const current =
                            index
                      === folders.length - 1;

                        return `
                    <li
                      class="
                        archive-breadcrumb-item
                        ${
                            current
                                ? 'archive-breadcrumb-item--current'
                                : 'archive-breadcrumb-item--middle'
                        }
                      ">

                      <span
                        class="
                          archive-breadcrumb-separator
                        "
                        aria-hidden="true">

                        ${icon.chevron}
                      </span>

                      ${
                            current
                                ? `
                            <span
                              class="
                                archive-breadcrumb-current
                              "
                              aria-current="page"
                              title="${escapeHtml(
                                    folder.name
                                )}">

                              ${escapeHtml(
                                    folder.name
                                )}
                            </span>
                          `
                                : `
                            <button
                              type="button"
                              data-archive-breadcrumb="${escapeHtml(
                                    folder.id
                                )}"
                              aria-label="Open ${escapeHtml(
                                    folder.name
                                )}"
                              title="${escapeHtml(
                                    folder.name
                                )}">

                              ${escapeHtml(
                                    folder.name
                                )}
                            </button>
                          `
                        }
                    </li>
                  `;
                    }
                )
                .join('')}
          </ol>
        </nav>
      `;
}

function renderArchiveLocationRow()
{
    return `
        <div
          class="
            archive-location-row
          ">

          <div
            class="
              archive-location-controls
            "
            role="toolbar"
            aria-label="Folder navigation">

            ${renderArchiveLocationButton(
                'back',
                'Go back',
                'archive-location-button--back',
                !archiveNavigationCanGoBack()
            )}

            ${renderArchiveLocationButton(
                'forward',
                'Go forward',
                'archive-location-button--forward',
                !archiveNavigationCanGoForward()
            )}

            ${renderArchiveLocationButton(
                'up',
                'Go up one level',
                'archive-location-button--up',
                !archiveNavigationCanGoUp()
            )}
          </div>

          ${renderArchiveBreadcrumbs()}
        </div>
      `;
}

function renderArchiveMobileLocation()
{
    const ancestors = archiveFolderAncestors(state.archiveSelectedFolderId);
    const current = ancestors[ancestors.length - 1];
    const name = state.archiveView === 'favorites' ? t('Favourites')
        : current?.name || t(ARCHIVE_ROOT_LABEL);
    return `<div class="archive-mobile-location">
        <button type="button" class="archive-mobile-back" data-archive-nav-back aria-label="${escapeHtml(t('Go back'))}" ${archiveNavigationCanGoBack() ? '' : 'disabled'}>${icon.arrow}</button>
        <div class="archive-mobile-location-name"><strong title="${escapeHtml(name)}">${escapeHtml(name)}</strong></div>
        <details class="archive-mobile-path"><summary aria-label="${escapeHtml(t('Current folder'))}: ${escapeHtml(name)}" title="${escapeHtml(t('Current folder'))}">${icon.folder}</summary>
            <div class="archive-mobile-path-menu"><button type="button" data-archive-breadcrumb-root>${escapeHtml(t(ARCHIVE_ROOT_LABEL))}</button>${ancestors.map(folder => `<button type="button" data-archive-breadcrumb="${escapeHtml(folder.id)}">${escapeHtml(folder.name)}</button>`).join('')}</div>
        </details>
    </div>`;
}

function renderArchiveFilterResultsBar(
    matchingCount
)
{
    if (
        !archiveFileFilteringActive()
    )
    {
        return '';
    }

    const fileLabel =
        `${matchingCount} ${
            matchingCount === 1
                ? 'file'
                : 'files'
        }`;

    return `
        <div
          class="archive-filter-results-bar">

          <strong>
            ${escapeHtml(fileLabel)}
          </strong>

          <div
            class="archive-filter-presentation"
            role="group"
            aria-label="Filtered result layout">

            <button
              type="button"
              class="${
                    state.archiveFilterPresentation
                  === 'flat'
                        ? 'active'
                        : ''
                }"
              data-archive-filter-presentation="flat"
              aria-pressed="${
                    state.archiveFilterPresentation
                  === 'flat'
                }">

              Files only
            </button>

            <button
              type="button"
              class="${
                    state.archiveFilterPresentation
                  === 'folders'
                        ? 'active'
                        : ''
                }"
              data-archive-filter-presentation="folders"
              aria-pressed="${
                    state.archiveFilterPresentation
                  === 'folders'
                }">

              Folder structure
            </button>
          </div>
        </div>
      `;
}

function archiveSelectedBulkItems()
{
    return {
        folders: (state.archiveSelectedFolderIds || []).map(id => archiveFolderById(id)).filter(Boolean),
        files: (state.archiveSelectedFileIds || []).map(id => archiveFileById(id)).filter(Boolean)
    };
}

function archiveBulkSelectionLabel()
{
    const { folders, files } = archiveSelectedBulkItems();
    const count = folders.length + files.length;
    if (state.language === 'ru') return `${t('Selected')}: ${count}`;
    const noun = folders.length && files.length ? (count === 1 ? 'item' : 'items')
        : folders.length ? (count === 1 ? 'folder' : 'folders')
            : (count === 1 ? 'file' : 'files');
    return `${count} ${noun} selected`;
}

function renderArchiveSelectionBar(files)
{
    const { folders, files: selectedFiles } = archiveSelectedBulkItems();
    if (!folders.length && !selectedFiles.length) return '';
    const allFavorite = [...folders, ...selectedFiles].every(item => item.favorite);
    return `<div class="archive-selection-bar"><strong>${escapeHtml(archiveBulkSelectionLabel())}</strong><div class="archive-selection-actions">
        <button class="button secondary" type="button" data-archive-selection-action="move">${escapeHtml(t('Move'))}</button>
        <button class="button secondary" type="button" data-archive-selection-action="favorite">${escapeHtml(t(allFavorite ? 'Remove from favourites' : 'Add to favourites'))}</button>
        <button class="button secondary archive-selection-more" type="button" data-archive-selection-more aria-label="${escapeHtml(t('More actions'))}" aria-expanded="false">${icon.more}</button>
        <button class="button ghost archive-selection-clear" type="button" data-archive-selection-action="clear" aria-label="${escapeHtml(t('Clear selection'))}">${icon.close}</button>
        ${!folders.length ? `<button hidden type="button" data-archive-selection-action="links">${escapeHtml(t('Add links'))}</button>` : ''}
        <button hidden type="button" data-archive-selection-action="delete">${escapeHtml(t('Delete permanently'))}</button>
      </div></div>`;
}

function archiveSortFoldersForTable(
    folders
)
{
    return appSortRecords(folders, {
        field:
          state.archiveFileSort,

        direction:
          state.archiveFileSortDirection,

        extractors: {
            name: {
                type: 'text',
                get: folder =>
                    folder.name
            },

            updated: {
                type: 'number',
                get: folder =>
                    appSortTimestamp(
                        folder.updatedAt
                || folder.createdAt
                    )
            },

            added: {
                type: 'number',
                get: folder =>
                    appSortTimestamp(
                        folder.createdAt
                    )
            },

            /*
          * All these records have the same type.
          * The fallback name determines their
          * order within the Folder group.
          */
            type: {
                type: 'text',
                get: () => 'Folder'
            }
        },

        getFallback:
          folder => folder.name
    });
}

function renderArchiveTableGroupRow(
    label
)
{
    return `
        <tr
          class="
            archive-table-group-row
          ">

          <th
            scope="rowgroup"
            colspan="7">

            ${escapeHtml(
                label
            )}
          </th>
        </tr>
      `;
}

function renderArchiveFolderTableRow(
    folder,
    matchingFileCount = null
)
{
    const directFiles =
        archiveProjectFiles()
            .filter(file =>
                archiveFileFolderId(
                    file
                ) === folder.id
            )
            .length;

    const childFolders =
        archiveFolderChildren(
            folder.id
        ).length;

    const filtering =
        Number.isFinite(
            matchingFileCount
        );

    const itemCount =
        filtering
            ? matchingFileCount
            : directFiles
            + childFolders;

    const itemLabel =
        filtering
            ? `${itemCount} ${
                itemCount === 1
                    ? 'matching file'
                    : 'matching files'
            }`
            : `${itemCount} ${
                itemCount === 1
                    ? 'item'
                    : 'items'
            }`;

    const detailSelected =
        state.archiveSelectedFolderItemId
          === folder.id;
    const checked = (state.archiveSelectedFolderIds || []).includes(folder.id);

    return `
        <tr
          class="
            archive-table-folder-row

            ${
                detailSelected
                    ? 'selected-detail'
                    : ''
            }
            ${checked ? 'is-checked' : ''}
          "
          data-archive-folder-row="${escapeHtml(
                folder.id
            )}"
          tabindex="0" aria-selected="${String(checked)}">

          <td class="archive-col-check"><input class="albums-select-checkbox" type="checkbox"
            data-archive-folder-checkbox="${escapeHtml(folder.id)}" ${checked ? 'checked' : ''}
            aria-label="${escapeHtml(t('Select'))}: ${escapeHtml(folder.name)}"></td>

          <td>
            <div
              class="
                archive-name-cell
              ">

              ${archiveFileIcon({
                    kind:
                  'folder'
                })}

              <div
                class="
                  archive-name-copy
                ">
                <div
                  class="
                    archive-folder-name-line
                  ">

                  <strong
                    title="${escapeHtml(
                        folder.name
                    )}">

                    ${escapeHtml(
                        folder.name
                    )}
                  </strong>
                </div>
              </div>
              <button class="archive-mobile-open-folder" type="button" data-archive-mobile-open-folder="${escapeHtml(folder.id)}" aria-label="${escapeHtml(t('Open folder'))}: ${escapeHtml(folder.name)}">${escapeHtml(t('Open'))}</button>
            </div>
          </td>

          <td>
            <span class="archive-mobile-cell-label">${escapeHtml(t('Type'))}: </span>Folder
          </td>

          <td>
            <span class="archive-mobile-cell-label">${escapeHtml(t('Size / Items'))}: </span>${escapeHtml(
                itemLabel
            )}
          </td>

          <td>
            <span class="archive-mobile-cell-label">${escapeHtml(t('Modified'))}: </span>${escapeHtml(
                archiveFormatDate(
                    folder.updatedAt
                || folder.createdAt
                )
            )}
          </td>

          <td style="text-align:center"><button class="archive-row-icon-button ${folder.favorite ? 'active' : ''}"
            type="button" data-archive-toggle-folder-favorite="${escapeHtml(folder.id)}"
            aria-label="${escapeHtml(t(folder.favorite ? 'Remove from favourites' : 'Add to favourites'))}">${icon.star}</button></td>

          <td>
            <button
              class="
                archive-row-icon-button
              "
              type="button"
              data-archive-row-actions="folder"
              data-archive-row-id="${escapeHtml(
                    folder.id
                )}"
              aria-label="Folder actions">

              ${icon.more}
            </button>
          </td>
        </tr>
      `;
}

function archiveVisibleSelectionState(
    files =
        archiveVisibleFiles()
)
{
    const folderIds = archiveVisibleChildFolders().map(folder => folder.id);
    const fileIds = (Array.isArray(files) ? files : []).map(file => file?.id).filter(Boolean);
    const selectedFolders = new Set(state.archiveSelectedFolderIds || []);
    const selectedFiles = new Set(state.archiveSelectedFileIds || []);
    const visibleIds = [...folderIds.map(id => `folder:${id}`), ...fileIds.map(id => `file:${id}`)];
    const selectedVisibleIds = visibleIds.filter(key => {
        const [kind, id] = key.split(':');
        return kind === 'folder' ? selectedFolders.has(id) : selectedFiles.has(id);
    });

    return {
        visibleIds,

        selectedVisibleIds,

        allVisibleSelected:
          visibleIds.length > 0
          && selectedVisibleIds.length
            === visibleIds.length,

        someVisibleSelected:
          selectedVisibleIds.length > 0
    };
}

function toggleAllVisibleArchiveFiles(
    files =
        archiveVisibleFiles()
)
{
    const selection =
        archiveVisibleSelectionState(
            files
        );

    const selectedFiles = new Set(state.archiveSelectedFileIds || []);
    const selectedFolders = new Set(state.archiveSelectedFolderIds || []);

    selection.visibleIds
        .forEach(key =>
        {
            const [kind, id] = key.split(':');
            const set = kind === 'folder' ? selectedFolders : selectedFiles;
            if (selection.allVisibleSelected) set.delete(id);
            else set.add(id);
        });

    state.archiveSelectedFileIds = [...selectedFiles];
    state.archiveSelectedFolderIds = [...selectedFolders];

    renderArchiveMain();
}

function toggleArchiveFileSelection(
    fileId
)
{
    const file =
        archiveFileById(
            fileId
        );

    if (!file)
    {
        return;
    }

    const selectedIds =
        new Set(
            state.archiveSelectedFileIds
          || []
        );

    if (
        selectedIds.has(
            file.id
        )
    )
    {
        selectedIds.delete(
            file.id
        );
    }
    else
    {
        selectedIds.add(
            file.id
        );
    }

    state.archiveSelectedFileIds = [
        ...selectedIds
    ];

    /*
        Match Albums: selecting through the checkbox
        also makes that record the inspector item.
      */

    state.archiveSelectedFolderItemId = null;
    state.archiveSelectedFileId =
        file.id;

    state.archiveInspectorCollapsed =
        false;

    renderArchiveMain();
}

function toggleArchiveFolderSelection(folderId)
{
    if (!archiveFolderById(folderId)) return;
    const selected = new Set(state.archiveSelectedFolderIds || []);
    if (selected.has(folderId)) selected.delete(folderId);
    else selected.add(folderId);
    state.archiveSelectedFolderIds = [...selected];
    state.archiveSelectedFolderItemId = folderId;
    state.archiveSelectedFileId = null;
    state.archiveInspectorCollapsed = false;
    renderArchiveMain();
}

function renderArchiveFileTableRow(
    file,
    showPath = false
)
{
    const detailSelected =
        state.archiveSelectedFileId
          === file.id;

    const checked =
        state.archiveSelectedFileIds
            .includes(
                file.id
            );

    const secondaryLabel = showPath ? archiveFolderPath(file.folderId) : '';

    return `
        <tr
          class="
            archive-table-file-row
            ${
                detailSelected
                    ? 'selected-detail'
                    : ''
            }

            ${
                checked
                    ? 'is-checked'
                    : ''
            }
          "
          data-archive-file-row="${escapeHtml(
                file.id
            )}"
          tabindex="0"
          aria-selected="${String(
                checked
            )}">

          <td
            class="
              archive-col-check
            ">

            <input
              class="
                albums-select-checkbox
              "
              type="checkbox"
              data-archive-file-checkbox="${escapeHtml(
                    file.id
                )}"
              ${
                    checked
                        ? 'checked'
                        : ''
                }
              aria-label="${escapeHtml(
                    `${
                        checked
                            ? 'Deselect'
                            : 'Select'
                    } ${file.name}`
                )}">
          </td>

          <td>
            <div
              class="
                archive-name-cell
              ">

              ${archiveFileIcon(
                    file
                )}

              <div
                class="
                  archive-name-copy
                ">

                <strong
                  title="${escapeHtml(
                        file.name
                    )}">

                  ${escapeHtml(
                        file.name
                    )}
                </strong>

                ${secondaryLabel ? `<span>${escapeHtml(secondaryLabel)}</span>` : ''}
              </div>
            </div>
          </td>

          <td>
            <span class="archive-mobile-cell-label">${escapeHtml(t('Type'))}: </span>${escapeHtml(
                archiveFileTypeLabel(
                    file
                )
            )}
          </td>

          <td>
            <span class="archive-mobile-cell-label">${escapeHtml(t('Size / Items'))}: </span>${escapeHtml(
                file.size
              || '—'
            )}
          </td>

          <td>
            <span class="archive-mobile-cell-label">${escapeHtml(t('Modified'))}: </span>${escapeHtml(
                archiveFormatDate(
                    file.updatedAt,
                    file.updated
                || 'Unknown'
                )
            )}
          </td>

          <td
            style="
              text-align:
                center;
            ">

            <button
              class="
                archive-row-icon-button
                ${
                    file.favorite
                        ? 'active'
                        : ''
                }
              "
              type="button"
              data-archive-toggle-favorite="${escapeHtml(
                    file.id
                )}"
              aria-label="${
                    file.favorite
                        ? 'Remove from favourites'
                        : 'Add to favourites'
                }">

              ${icon.star}
            </button>
          </td>

          <td>
            <button
              class="
                archive-row-icon-button
              "
              type="button"
              data-archive-row-actions="file"
              data-archive-row-id="${escapeHtml(
                    file.id
                )}"
              aria-label="File actions">

              ${icon.more}
            </button>
          </td>
        </tr>
      `;
}

function renderArchiveFileTableDesktop(
    files,
    folders,
    showPaths = false,
    matchingCountByFolder = new Map()
)
{
    const sortedFolders =
        archiveSortFoldersForTable(
            folders
        );

    const sortHeader = (field, label) => `<button type="button" class="archive-column-sort ${state.archiveFileSort === field ? 'is-active' : ''}" data-archive-column-sort="${field}" aria-label="${escapeHtml(t(`Sort by ${label}`))}">${escapeHtml(t(label))}</button>`;

    const showGroupLabels =
        Boolean(
            sortedFolders.length
          && files.length
        );

    const folderRows = `
        ${
            showGroupLabels
                ? renderArchiveTableGroupRow(
                    'Folders'
                )
                : ''
        }

        ${sortedFolders
            .map(folder =>
                renderArchiveFolderTableRow(
                    folder,
                    matchingCountByFolder.has(
                        folder.id
                    )
                        ? matchingCountByFolder.get(
                            folder.id
                        )
                        : null
                )
            )
            .join('')}
      `;

    const fileRows = `
        ${
            showGroupLabels
                ? renderArchiveTableGroupRow(
                    'Files'
                )
                : ''
        }

        ${files
            .map(file =>
                renderArchiveFileTableRow(
                    file,
                    showPaths
                )
            )
            .join('')}
      `;

    return `
        <div
          class="
            archive-table-wrap
          ">

          <table
            class="
              archive-table
            "
            aria-label="Archive files and folders">

            <thead>
              <tr>
                <th
                  class="
                    archive-col-check
                  ">

                <input
                  class="
                    albums-select-checkbox
                  "
                  type="checkbox"
                  data-archive-select-all
                  aria-label="${escapeHtml(t('Select all visible items'))}">
                <span class="archive-mobile-select-all">${escapeHtml(t('Select all visible items'))}</span>
                </th>

                <th
                  class="
                    archive-col-name
                  " ${state.archiveFileSort === 'name' ? `aria-sort="${state.archiveFileSortDirection === 'ascending' ? 'ascending' : 'descending'}"` : ''}>
                  ${sortHeader('name', 'Name')}
                </th>

                <th
                  class="
                    archive-col-type
                  " ${state.archiveFileSort === 'type' ? `aria-sort="${state.archiveFileSortDirection === 'ascending' ? 'ascending' : 'descending'}"` : ''}>
                  ${sortHeader('type', 'Type')}
                </th>

                <th
                  class="
                    archive-col-size
                  ">
                  Size / Items
                </th>

                <th
                  class="
                    archive-col-modified
                  " ${state.archiveFileSort === 'updated' ? `aria-sort="${state.archiveFileSortDirection === 'ascending' ? 'ascending' : 'descending'}"` : ''}>
                  ${sortHeader('updated', 'Modified')}
                </th>

                <th
                  class="
                    archive-col-favorite
                  "
                  aria-label="Favourite">

                  ${icon.star}
                </th>

                <th
                  class="
                    archive-col-actions
                  ">
                </th>
              </tr>
            </thead>

            <tbody>
              ${folderRows}
              ${fileRows}
            </tbody>
          </table>
        </div>
      `;
}

function renderArchiveMobileItems(files, folders, showPaths)
{
    const selecting = archiveMobileSelectMode || state.archiveSelectedFileIds.length > 0
        || (state.archiveSelectedFolderIds || []).length > 0;
    const folderRows = folders.map(folder => {
        const checked = (state.archiveSelectedFolderIds || []).includes(folder.id);
        return `<li class="archive-mobile-item archive-mobile-folder ${checked ? 'is-checked' : ''}">
            ${selecting ? `<input class="albums-select-checkbox" type="checkbox" data-archive-folder-checkbox="${escapeHtml(folder.id)}" ${checked ? 'checked' : ''} aria-label="${escapeHtml(t('Select'))}: ${escapeHtml(folder.name)}">` : ''}
            <button type="button" class="archive-mobile-item-main" data-archive-mobile-folder="${escapeHtml(folder.id)}" title="${escapeHtml(folder.name)}">
                ${archiveFileIcon({ kind: 'folder' })}
                <span class="archive-mobile-item-copy"><strong>${escapeHtml(folder.name)}</strong>${folder.favorite ? `<small>${escapeHtml(t('Favourite'))}</small>` : ''}</span>
            </button>
            <button type="button" class="archive-mobile-item-more" data-archive-row-actions="folder" data-archive-row-id="${escapeHtml(folder.id)}" aria-label="${escapeHtml(t('Folder actions'))}: ${escapeHtml(folder.name)}">${icon.more}</button>
        </li>`;
    }).join('');
    const fileRows = files.map(file => {
        const checked = state.archiveSelectedFileIds.includes(file.id);
        const metadata = showPaths ? archiveFolderPath(file.folderId)
            : [file.size, archiveFormatDate(file.updatedAt || file.createdAt)].filter(Boolean).join(' · ');
        return `<li class="archive-mobile-item archive-mobile-file ${checked ? 'is-checked' : ''}">
            ${selecting ? `<input class="albums-select-checkbox" type="checkbox" data-archive-file-checkbox="${escapeHtml(file.id)}" ${checked ? 'checked' : ''} aria-label="${escapeHtml(t('Select'))}: ${escapeHtml(file.name)}">` : ''}
            <button type="button" class="archive-mobile-item-main" data-archive-mobile-file="${escapeHtml(file.id)}" title="${escapeHtml(file.name)}">
                ${archiveFileIcon(file)}
                <span class="archive-mobile-item-copy"><strong>${escapeHtml(file.name)}</strong><small>${escapeHtml(metadata)}</small></span>
            </button>
            <button type="button" class="archive-mobile-item-more" data-archive-row-actions="file" data-archive-row-id="${escapeHtml(file.id)}" aria-label="${escapeHtml(t('File actions'))}: ${escapeHtml(file.name)}">${icon.more}</button>
        </li>`;
    }).join('');
    return `<div class="archive-mobile-items" aria-label="${escapeHtml(t('Archive files and folders'))}">
        ${folders.length || files.length ? `<div class="archive-mobile-section-head"><button type="button" data-archive-mobile-select>${escapeHtml(t(selecting ? 'Cancel' : 'Select'))}</button></div>${selecting ? `<label class="archive-mobile-select-all"><input type="checkbox" class="albums-select-checkbox" data-archive-select-all> ${escapeHtml(t('Select all'))}</label>` : ''}` : ''}
        ${folders.length ? `<section aria-label="${escapeHtml(t('Folders'))}"><h2>${escapeHtml(t('Folders'))}</h2><ul>${folderRows}</ul></section>` : ''}
        ${files.length ? `<section aria-label="${escapeHtml(t('Files'))}"><h2>${escapeHtml(t('Files'))}</h2><ul>${fileRows}</ul></section>` : ''}
    </div>`;
}

function renderArchiveFileTiles(files, folders, showPaths, matchingCountByFolder)
{
    const folderTiles = archiveSortFoldersForTable(folders).map(folder => {
        const checked = (state.archiveSelectedFolderIds || []).includes(folder.id);
        const count = matchingCountByFolder.get(folder.id);
        const itemCount = Number.isFinite(count) ? count
            : archiveProjectFiles().filter(file => archiveFileFolderId(file) === folder.id).length
                + archiveFolderChildren(folder.id).length;
        return `<div class="archive-tile ${checked ? 'is-checked' : ''} ${state.archiveSelectedFolderItemId === folder.id ? 'selected-detail' : ''}"
            data-archive-folder-row="${escapeHtml(folder.id)}" tabindex="0" aria-label="${escapeHtml(folder.name)}">
            <input class="albums-select-checkbox archive-tile-select" type="checkbox" data-archive-folder-checkbox="${escapeHtml(folder.id)}" ${checked ? 'checked' : ''} aria-label="${escapeHtml(t('Select'))}: ${escapeHtml(folder.name)}">
            <button class="archive-row-icon-button archive-tile-more" type="button" data-archive-row-actions="folder" data-archive-row-id="${escapeHtml(folder.id)}" aria-label="${escapeHtml(t('Folder actions'))}: ${escapeHtml(folder.name)}">${icon.more}</button>
            <div class="archive-tile-art">${archiveFileIcon({ kind: 'folder' })}</div>
            <div class="archive-tile-copy"><strong title="${escapeHtml(folder.name)}">${escapeHtml(folder.name)}</strong>
                <span>${itemCount} ${escapeHtml(t(Number.isFinite(count) ? (itemCount === 1 ? 'matching file' : 'matching files') : (itemCount === 1 ? 'item' : 'items')))}</span></div>
            ${folder.favorite ? `<span class="archive-tile-favorite" aria-label="${escapeHtml(t('Favourite'))}">${icon.star}</span>` : ''}
        </div>`;
    }).join('');
    const fileTiles = files.map(file => {
        const checked = state.archiveSelectedFileIds.includes(file.id);
        const source = archiveFileKind(file) === 'img'
            ? file.previewUrl || file.thumbnailUrl || file.src : '';
        const art = `${archiveFileIcon(file)}${source ? `<img src="${escapeHtml(source)}" alt="" loading="lazy">` : ''}`;
        const meta = showPaths ? archiveFolderPath(file.folderId)
            : [archiveFileTypeLabel(file), file.size].filter(Boolean).join(' · ');
        return `<div class="archive-tile ${checked ? 'is-checked' : ''} ${state.archiveSelectedFileId === file.id ? 'selected-detail' : ''}"
            data-archive-file-row="${escapeHtml(file.id)}" tabindex="0" aria-label="${escapeHtml(file.name)}">
            <input class="albums-select-checkbox archive-tile-select" type="checkbox" data-archive-file-checkbox="${escapeHtml(file.id)}" ${checked ? 'checked' : ''} aria-label="${escapeHtml(t('Select'))}: ${escapeHtml(file.name)}">
            <button class="archive-row-icon-button archive-tile-more" type="button" data-archive-row-actions="file" data-archive-row-id="${escapeHtml(file.id)}" aria-label="${escapeHtml(t('File actions'))}: ${escapeHtml(file.name)}">${icon.more}</button>
            <div class="archive-tile-art">${art}</div>
            <div class="archive-tile-copy"><strong title="${escapeHtml(file.name)}">${escapeHtml(file.name)}</strong><span>${escapeHtml(meta)}</span></div>
            ${file.favorite ? `<span class="archive-tile-favorite" aria-label="${escapeHtml(t('Favourite'))}">${icon.star}</span>` : ''}
        </div>`;
    }).join('');
    return `<div class="archive-tiles" aria-label="${escapeHtml(t('Archive files and folders'))}">
        ${folders.length ? `<section><h2>${escapeHtml(t('Folders'))}</h2><div class="archive-tile-grid">${folderTiles}</div></section>` : ''}
        ${files.length ? `<section><h2>${escapeHtml(t('Files'))}</h2><div class="archive-tile-grid">${fileTiles}</div></section>` : ''}
    </div>`;
}

function renderArchiveEmpty(
    title,
    copy,
    action = ''
)
{
    return `
        <div class="archive-empty">
          <div>
            <h2>
              ${escapeHtml(
                    title
                )}
            </h2>

            <p>
              ${escapeHtml(
                    copy
                )}
            </p>

            ${action}
          </div>
        </div>
      `;
}

function renderArchiveFileDropzone(
    folder = null
)
{
    const folderName =
        folder?.name
        || 'Files';

    return `
        <button
          class="
            archive-empty
            archive-empty-dropzone
          "
          type="button"
          data-archive-empty-add-files
          aria-label="${escapeHtml(
                `Add files to ${folderName}`
            )}">

          <span
            class="
              archive-empty-dropzone-content
            ">

            <span
              class="
                archive-empty-dropzone-icon
              "
              aria-hidden="true">

              ${icon.import}
            </span>

            <strong
              class="
                archive-empty-dropzone-title
              ">

              Drop files here
            </strong>

            <span
              class="
                archive-empty-dropzone-copy
              ">

              ${escapeHtml(
                    folder
                        ? `Drop files here to add them to “${folder.name}”, or click to choose files.`
                        : 'Drop files here to add them to Archive, or click to choose files.'
                )}
            </span>

            <span
              class="
                button primary archive-empty-dropzone-action
              ">

              Click to choose files
            </span>
          </span>
        </button>
      `;
}

function renderArchiveFilesView()
{
    const matchingFiles =
        archiveMatchingFiles();

    const files =
        archiveVisibleFiles(
            matchingFiles
        );

    const folders =
        archiveVisibleChildFolders(
            matchingFiles
        );

    const projection =
        archiveFolderMatchProjection(
            matchingFiles
        );

    const filtering =
        archiveFileFilteringActive();

    const flatResults =
        filtering
        && state.archiveFilterPresentation
          === 'flat';

    const currentFolder =
        archiveFolderById(
            state.archiveSelectedFolderId
        );

    const hasRows =
        files.length
        || folders.length;

    const emptyTitle =
        flatResults
            ? 'No files match these filters.'
            : 'No folders contain matching files.';

    const emptyCopy =
        'Change or clear the active filters and try again.';

    return `
        <div class="archive-page archive-files-page">
          <div class="archive-file-navigation">
            ${renderArchiveToolbar()}
            ${renderArchiveLocationRow()}
          </div>

          ${renderArchiveActiveFilterbar()}

          ${renderArchiveFilterResultsBar(
                matchingFiles.length
            )}

          ${renderArchiveSelectionBar(
                files
            )}

          ${archiveMobileSelectMode || state.archiveSelectedFileIds.length || (state.archiveSelectedFolderIds || []).length ? `<div class="archive-mobile-bulk"><strong>${escapeHtml(archiveBulkSelectionLabel())}</strong><button type="button" data-archive-mobile-bulk-actions ${state.archiveSelectedFileIds.length || (state.archiveSelectedFolderIds || []).length ? '' : 'disabled'}>${escapeHtml(t('Actions'))}</button><button type="button" data-archive-mobile-select aria-label="${escapeHtml(t('Cancel'))}">${icon.close}</button></div>` : ''}

          ${
                state.archiveFileLayout === 'images'
                    ? renderArchiveImageView(files)
                    : hasRows
                    ? `${renderArchiveMobileItems(files, archiveSortFoldersForTable(folders), flatResults)}${state.archiveFileLayout === 'tiles'
                        ? renderArchiveFileTiles(files, folders, flatResults, projection.matchingCountByFolder)
                        : renderArchiveFileTableDesktop(files, folders, flatResults, projection.matchingCountByFolder)}`
                    : filtering
                        ? renderArchiveEmpty(
                            emptyTitle,
                            emptyCopy
                        )
                        : renderArchiveFileDropzone(
                            currentFolder
                        )
            }
        </div>
      `;
}

function archiveToolbarIsSources()
{
    return state.archiveView
        === 'sources';
}

function archiveToolbarFilterCount()
{
    if (
        archiveToolbarIsSources()
    )
    {
        return [
            state.archiveSourceCategoryFilter
            && state.archiveSourceCategoryFilter
              !== 'all',

            state.archiveSourceConnectionFilter
            && state.archiveSourceConnectionFilter
              !== 'all',

            state.archiveSourceFavouriteOnly
        ]
            .filter(Boolean)
            .length;
    }

    return [
        Boolean(
            currentArchiveSourceTargetFilter()
        ),
        state.archiveSearchScope
          === 'all',

        state.archiveFileTypeFilter
          && state.archiveFileTypeFilter
            !== 'all',

        state.archiveLinkFilter
          && state.archiveLinkFilter
            !== 'all'
    ]
        .filter(Boolean)
        .length;
}

function archiveToolbarSearchPlaceholder()
{
    if (
        archiveToolbarIsSources()
    )
    {
        return 'Search sources...';
    }

    if (
        state.archiveView
          === 'favorites'
    )
    {
        return state.archiveSearchScope
          === 'all'
            ? 'Search favourites'
            : 'Search favourites in this folder';
    }

    return state.archiveSearchScope
        === 'all'
        ? 'Search all files...'
        : 'Search this folder...';
}

let archiveMobileSearchOpen = false;
let archiveMobileSelectMode = false;

function renderArchiveToolbar()
{
    const sourcesView =
        archiveToolbarIsSources();

    const activeFilterCount =
        archiveToolbarFilterCount();

    const searchPlaceholder =
        archiveToolbarSearchPlaceholder();

    return `
        <div
          class="
            archive-toolbar ${sourcesView ? '' : 'archive-files-toolbar'} ${archiveMobileSearchOpen ? 'mobile-search-open' : ''}
          "
          aria-label="${
                sourcesView
                    ? 'Source controls'
                    : 'File controls'
            }">

          ${sourcesView ? '' : '<div class="archive-toolbar-main">'}
          <div
            class="
              archive-toolbar-left
            ">

            ${sourcesView ? '' : `<button class="archive-mobile-search-trigger ${state.archiveSearch?.trim() ? 'has-query' : ''}" type="button" data-archive-mobile-search-open aria-expanded="${archiveMobileSearchOpen}" aria-controls="archiveSearch" aria-label="${escapeHtml(t('Search files') + (state.archiveSearch?.trim() ? `: ${state.archiveSearch.trim()}` : ''))}" title="${escapeHtml(t('Search files') + (state.archiveSearch?.trim() ? `: ${state.archiveSearch.trim()}` : ''))}">${icon.search}</button>`}

            <label
              class="
                app-search-field
              "
              aria-label="${
                    sourcesView
                        ? 'Search sources'
                        : 'Search files'
                }">

              ${icon.search}

              <input
                id="archiveSearch"
                type="search"
                data-archive-search
                value="${escapeHtml(
                    state.archiveSearch
                  || ''
                )}"
                placeholder="${escapeHtml(
                    searchPlaceholder
                )}">
            </label>
            ${sourcesView ? '' : `<button class="archive-mobile-search-close" type="button" data-archive-mobile-search-close aria-label="${escapeHtml(t('Close'))}" title="${escapeHtml(t('Close'))}">${icon.close}</button>`}
          </div>

          <div
            class="
              archive-toolbar-right
            ">

            <button
              class="
                module-filter-button
                ${
                    activeFilterCount
                        ? 'active'
                        : ''
                }
              "
              type="button"
              id="archiveFilterButton"
              aria-label="${
                    activeFilterCount
                        ? `Filters, ${activeFilterCount} active`
                        : sourcesView
                            ? 'Open source filters'
                            : 'Open file filters'
                }"
              aria-expanded="false">

              <span
                class="
                  module-filter-icon
                "
                aria-hidden="true">

                ${
                    activeFilterCount
                        ? icon.filterclear
                        : icon.filter
                }
              </span>

              <span>
                Filters
              </span>

              ${
                    activeFilterCount
                        ? `
                    <span
                      class="
                        module-filter-count
                      ">

                      ${activeFilterCount}
                    </span>
                  `
                        : ''
                }
            </button>
            ${renderAppSortControl({
                id: 'archiveSort',
                field:
                sourcesView
                    ? state.archiveSourceSort
                    : state.archiveFileSort,
                direction:
                sourcesView
                    ? state.archiveSourceSortDirection
                    : state.archiveFileSortDirection,
                ariaLabel:
                sourcesView
                    ? 'Sort sources'
                    : 'Sort files',
                options:
                sourcesView
                    ? APP_SORT_OPTIONS.archiveSources
                    : APP_SORT_OPTIONS.archiveFiles
            })}
            ${sourcesView ? '' : `<div class="archive-layout-switch" role="group" aria-label="${escapeHtml(t('File view'))}">
                <button class="toolbar-button archive-layout-button ${state.archiveFileLayout === 'details' ? 'active' : ''}" type="button" data-archive-file-layout="details" aria-label="${escapeHtml(t('Details view'))}" title="${escapeHtml(t('Details view'))}" aria-pressed="${state.archiveFileLayout === 'details'}">${icon.list}</button>
                <button class="toolbar-button archive-layout-button ${state.archiveFileLayout === 'tiles' ? 'active' : ''}" type="button" data-archive-file-layout="tiles" aria-label="${escapeHtml(t('Icons view'))}" title="${escapeHtml(t('Icons view'))}" aria-pressed="${state.archiveFileLayout === 'tiles'}">${icon.grid}</button>
                <button class="toolbar-button archive-layout-button ${state.archiveFileLayout === 'images' ? 'active' : ''}" type="button" data-archive-file-layout="images" aria-label="${escapeHtml(t('Image view'))}" title="${escapeHtml(t('Image view'))}" aria-pressed="${state.archiveFileLayout === 'images'}">${icon.archiveImages}</button>
            </div>`}
            ${sourcesView ? '' : `<label class="archive-view-picker" title="${escapeHtml(t('File view'))}">${state.archiveFileLayout === 'images' ? icon.archiveImages : state.archiveFileLayout === 'tiles' ? icon.grid : icon.list}<select data-archive-layout-select aria-label="${escapeHtml(t('File view'))}">${[['details', 'Details view'], ['tiles', 'Icons view'], ['images', 'Image view']].map(([value, label]) => `<option value="${value}" ${state.archiveFileLayout === value ? 'selected' : ''}>${escapeHtml(t(label))}</option>`).join('')}</select>${icon.chevron}</label>`}
            ${sourcesView ? '' : '</div></div><div class="archive-toolbar-create">'}
            ${sourcesView ? '' : `<div class="archive-file-create-actions">${renderArchiveFilesHeaderActions()}</div>`}
            ${sourcesView ? '' : `<button class="button primary archive-mobile-add-files" type="button" data-archive-mobile-add-menu aria-label="${escapeHtml(t('Add'))}" aria-expanded="false">${icon.plus}<span>${escapeHtml(t('Add'))}</span></button>`}
          </div>
        </div>
      `;
}

let archiveFilterReturnFocus =
    null;

function closeArchiveFilterPopover({
    restoreFocus =
        false
} = {})
{
    document
        .getElementById(
            'archiveFilterPopover'
        )
        ?.remove();
    document.getElementById('archiveFilterButton')?.setAttribute('aria-expanded', 'false');

    document.removeEventListener(
        'click',
        closeArchiveFilterOnOutside
    );

    document.removeEventListener(
        'keydown',
        closeArchiveFilterOnEscape
    );

    if (
        restoreFocus
        && archiveFilterReturnFocus
            ?.isConnected
    )
    {
        archiveFilterReturnFocus.focus({
            preventScroll:
            true
        });
    }

    archiveFilterReturnFocus =
        null;
}

function closeArchiveFilterOnOutside(
    event
)
{
    const panel =
        document.getElementById(
            'archiveFilterPopover'
        );

    const trigger =
        document.getElementById(
            'archiveFilterButton'
        );

    if (!panel)
    {
        return;
    }

    const path =
        typeof event.composedPath
          === 'function'
            ? event.composedPath()
            : [];

    const insidePanel =
        path.length
            ? path.includes(panel)
            : panel.contains(
                event.target
            );

    const insideTrigger =
        path.length
            ? path.includes(trigger)
            : trigger?.contains(
                event.target
            );

    if (
        insidePanel
        || insideTrigger
    )
    {
        return;
    }

    closeArchiveFilterPopover();
}

function closeArchiveFilterOnEscape(
    event
)
{
    if (event.key !== 'Escape')
    {
        return;
    }

    event.preventDefault();

    closeArchiveFilterPopover({
        restoreFocus:
          true
    });
}

function openArchiveFilterPopover(
    anchor
)
{
    if (document.getElementById('archiveFilterPopover'))
    {
        closeArchiveFilterPopover();
        return;
    }
    closeArchiveFilterPopover();
    closeAlbumsFilterPopover();
    closePeopleFilterPopover();
    closeMenu();

    archiveFilterReturnFocus =
        anchor;
    anchor.setAttribute('aria-expanded', 'true');

    const sourcesView =
        archiveToolbarIsSources();

    const schema =
        sourcesView
            ? archiveSourceFilterSchema
            : archiveFileFilterSchema;

    const values =
        sourcesView
            ? {
                sourceCategory:
                state.archiveSourceCategoryFilter
                || 'all',

                sourceConnections:
                state.archiveSourceConnectionFilter
                || 'all',

                sourceFavouriteOnly:
                Boolean(
                    state.archiveSourceFavouriteOnly
                )
            }
            : archiveFileFiltersWithDefaults();

    const prefix =
        sourcesView
            ? 'archive-source-filter'
            : 'archive-file-filter';

    const panel =
        document.createElement(
            'div'
        );

    panel.className =
        'shared-filter-panel archive-shared-filter-popover';

    panel.id =
        'archiveFilterPopover';

    panel.setAttribute(
        'role',
        'dialog'
    );

    panel.setAttribute(
        'aria-label',
        translateText(
            sourcesView
                ? 'Filter sources'
                : 'Filter files'
        )
    );

    panel.innerHTML = `
        <div class="shared-filter-panel-header">
          <div>
            <h3>
              ${
                    sourcesView
                        ? 'Filter sources'
                        : 'Filter files'
                }
            </h3>

            <p>
              ${
                    sourcesView
                        ? 'Narrow sources by category, connection status, or favourite status.'
                        : 'Filter files across Archive and choose how results are displayed.'
                }
            </p>
          </div>

          <button
            class="shared-filter-panel-close"
            type="button"
            aria-label="Close"
            data-archive-filter-close>

            ${icon.close}
          </button>
        </div>

        <div class="shared-filter-panel-body">
          ${renderSharedFilterFields({
                schema,
                values,
                prefix
            })}
        </div>

        <div class="shared-filter-panel-footer">
          <button
            class="link"
            type="button"
            data-archive-filter-reset>

            Clear filters
          </button>

          <div class="shared-filter-panel-actions">
            <button
              class="button secondary"
              type="button"
              data-archive-filter-cancel>

              Cancel
            </button>

            <button
              class="button primary"
              type="button"
              data-archive-filter-apply>

              Apply filters
            </button>
          </div>
        </div>
      `;

    document.body.appendChild(
        panel
    );

    localizeUI(panel);

    const controller =
        bindSharedFilterFields(
            panel,
            {
                schema,
                values,
                prefix
            }
        );

    panel
        .querySelector(
            '[data-archive-filter-reset]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                controller?.reset();
            }
        );

    panel
        .querySelector(
            '[data-archive-filter-close]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                closeArchiveFilterPopover({
                    restoreFocus:
                true
                });
            }
        );

    panel
        .querySelector(
            '[data-archive-filter-cancel]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                closeArchiveFilterPopover({
                    restoreFocus:
                true
                });
            }
        );

    panel
        .querySelector(
            '[data-archive-filter-apply]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                const errors =
                    controller?.getErrors()
              || [];

                if (errors.length)
                {
                    controller
                        ?.focusFirstInvalid();

                    return;
                }

                const nextValues =
                    controller?.getValues()
              || values;

                if (sourcesView)
                {
                    state.archiveSourceCategoryFilter =
                        nextValues.sourceCategory
                || 'all';

                    state.archiveSourceConnectionFilter =
                        nextValues.sourceConnections
                || 'all';

                    state.archiveSourceFavouriteOnly =
                        Boolean(
                            nextValues
                                .sourceFavouriteOnly
                        );

                    state.archiveSelectedSourceId =
                        null;
                }
                else
                {
                    const wasFiltering =
                        archiveFileFilteringActive();

                    state.archiveFileFilters =
                        archiveFileFiltersWithDefaults(
                            nextValues
                        );

                    state.archiveFilterScopeFolderId =
                        nextValues.scope === 'folder'
                            ? archiveNormalizeFolderId(
                                state.archiveSelectedFolderId
                            )
                            : null;

                    if (
                        state.archiveView
                  === 'favorites'
                && !nextValues
                    .favouriteOnly
                    )
                    {
                        state.archiveView =
                            'files';
                    }

                    /*
              * Start a newly filtered hierarchy at
              * its logical root.
              */
                    if (
                        !wasFiltering
                || state.archiveFilterPresentation
                  === 'folders'
                    )
                    {
                        state.archiveSelectedFolderId =
                            nextValues.scope === 'folder'
                                ? state
                                    .archiveFilterScopeFolderId
                                : null;
                    }

                    state.archiveSelectedFolderItemId =
                        null;

                    state.archiveSelectedFileId =
                        null;

                    state.archiveSelectedFileIds =
                        [];
                }

                closeArchiveFilterPopover();
                renderArchive();
            }
        );

    positionSharedFilterPanel(
        panel,
        anchor
    );

    requestAnimationFrame(() =>
    {
        if (window.innerWidth <= 640)
            panel.querySelector('[data-archive-filter-close]')?.focus({ preventScroll: true });
        else
            panel.querySelector('[data-shared-filter-select]')?.focus({ preventScroll: true });
    });

    setTimeout(() =>
    {
        document.addEventListener(
            'click',
            closeArchiveFilterOnOutside
        );

        document.addEventListener(
            'keydown',
            closeArchiveFilterOnEscape
        );
    }, 0);
}

function archiveActiveToolbarFilters()
{
    if (
        archiveToolbarIsSources()
    )
    {
        const filters =
            [];

        const targetFilter =
            currentArchiveSourceTargetFilter();

        if (targetFilter)
        {
            filters.push({
                key:
              'sourceTarget',

                label:
              `${t('Connected to')}: ${
                  connectedSourceTargetLabel(
                      targetFilter.targetType,
                      targetFilter.target
                  )
              }`
            });
        }
        if (
            state.archiveSourceCategoryFilter
          && state.archiveSourceCategoryFilter
            !== 'all'
        )
        {
            filters.push({
                key:
              'sourceCategory',

                label:
              localizedSourceCategoryLabel(
                  state
                      .archiveSourceCategoryFilter
              )
            });
        }
        if (
            state.archiveSourceConnectionFilter
          && state.archiveSourceConnectionFilter
            !== 'all'
        )
        {
            filters.push({
                key:
              'sourceConnections',

                label:
              state.archiveSourceConnectionFilter
                === 'linked'
                  ? translateText(
                      'With connections'
                  )
                  : translateText(
                      'Without connections'
                  )
            });
        }
        if (
            state.archiveSourceFavouriteOnly
        )
        {
            filters.push({
                key:
              'sourceFavouriteOnly',

                label:
              translateText(
                  'Favourite sources'
              )
            });
        }

        return filters;
    }

    const filters =
        archiveEffectiveFileFilters();

    return archiveFileFilterSchema
        .filter(definition =>
            sharedFilterValueIsActive(
                definition,
                filters[
                    definition.key
                ]
            )
        )
        .map(definition =>
        {
            let label;

            if (
                definition.control
              === 'boolean'
            )
            {
                label =
                    definition.checkboxLabel
              || definition.label;
            }
            else
            {
                label =
                    sharedFilterDisplayValue(
                        definition,
                        filters[
                            definition.key
                        ]
                    );
            }

            return {
                key:
              definition.key,

                label
            };
        });
}

function renderArchiveActiveFilterbar()
{
    const filters =
        archiveActiveToolbarFilters();

    if (!filters.length)
    {
        return '';
    }

    return `
        <div
          class="
            module-active-filterbar
          "
          aria-label="Active Archive filters">

          ${filters
                .map(filter => `
              <span
                class="
                  filter-chip
                  active-filter-chip
                ">

                <span
                  class="
                    active-filter-chip-copy
                  ">

                  ${escapeHtml(
                        filter.label
                    )}
                </span>

                <button
                  class="
                    active-filter-chip-remove
                  "
                  type="button"
                  data-archive-remove-filter="${escapeHtml(
                        filter.key
                    )}"
                  aria-label="Remove ${escapeHtml(
                        filter.label
                    )} filter"
                  title="Remove filter">

                  ${icon.close}
                </button>
              </span>
            `)
                .join('')}

          <span
            class="
              active-filter-actions
            ">

            <button
              class="link"
              type="button"
              id="archiveClearFilters">

              Clear all
            </button>
          </span>
        </div>
      `;
}

function removeArchiveToolbarFilter(
    key
)
{
    if (key === 'sourceTarget')
    {
        state.archiveSourceTargetFilter =
            null;

        state.archiveSelectedSourceId =
            null;

        renderArchive();

        return;
    }
    if (
        key === 'sourceCategory'
    )
    {
        state.archiveSourceCategoryFilter =
            'all';

        state.archiveSelectedSourceId =
            null;

        renderArchive();

        return;
    }
    if (
        key === 'sourceConnections'
    )
    {
        state.archiveSourceConnectionFilter =
            'all';

        state.archiveSelectedSourceId =
            null;

        renderArchive();

        return;
    }
    if (
        key === 'sourceFavouriteOnly'
    )
    {
        state.archiveSourceFavouriteOnly =
            false;

        state.archiveSelectedSourceId =
            null;

        renderArchive();

        return;
    }

    const definition =
        sharedFilterDefinitionByKey(
            archiveFileFilterSchema,
            key
        );

    if (!definition)
    {
        return;
    }

    const defaults =
        archiveFileFiltersWithDefaults(
            {}
        );

    state.archiveFileFilters = {
        ...archiveFileFiltersWithDefaults(),
        [key]:
          defaults[key]
    };

    if (key === 'scope')
    {
        state.archiveFilterScopeFolderId =
            null;
    }

    if (
        key === 'favouriteOnly'
        && state.archiveView
          === 'favorites'
    )
    {
        state.archiveView =
            'files';
    }

    state.archiveSelectedFileId =
        null;

    state.archiveSelectedFileIds =
        [];

    renderArchive();
}

function clearArchiveToolbarFilters()
{
    if (
        archiveToolbarIsSources()
    )
    {
        state.archiveSourceCategoryFilter =
            'all';
        state.archiveSourceConnectionFilter =
            'all';
        state.archiveSourceFavouriteOnly =
            false;
        state.archiveSourceTargetFilter = null;
        state.archiveSelectedSourceId =
            null;
    }
    else
    {
        state.archiveFileFilters =
            archiveFileFiltersWithDefaults(
                {}
            );

        state.archiveFilterScopeFolderId =
            null;

        state.archiveFilterPresentation =
            'flat';

        if (
            state.archiveView
            === 'favorites'
        )
        {
            state.archiveView =
                'files';
        }

        state.archiveSelectedFileId =
            null;

        state.archiveSelectedFileIds =
            [];
    }

    renderArchive();
}

function archiveSourceConnectionCount(
    source
)
{
    if (!source)
    {
        return 0;
    }

    return sourceLinksForSource(
        source.id,
        '',
        source.projectId
    ).length;
}

function archiveSourceOriginLabel(
    source
)
{
    if (!source)
    {
        return 'Source record';
    }

    const values =
        [
            source.providedBy,
            source.location
        ]
            .map(value =>
                String(value || '').trim()
            )
            .filter(
                (
                    value,
                    index,
                    records
                ) =>
                    value
              && records.indexOf(value)
                === index
            );

    return values.join(' · ')
        || 'Source record';
}

function archiveSourceWebsiteHost(
    value
)
{
    const normalized =
        String(value || '').trim();

    if (!normalized)
    {
        return '';
    }

    try
    {
        return new URL(
            normalized
        )
            .hostname
            .replace(
                /^www\./i,
                ''
            );
    }
    catch
    {
        return normalized;
    }
}

function archiveSourceReferenceLabel(
    source
)
{
    if (!source)
    {
        return 'Not specified';
    }

    const values =
        [
            source.reference,
            archiveSourceWebsiteHost(
                source.url
            )
        ]
            .map(value =>
                String(value || '').trim()
            )
            .filter(
                (
                    value,
                    index,
                    records
                ) =>
                    value
              && records.indexOf(value)
                === index
            );

    return values.join(' · ')
        || 'Not specified';
}

function renderArchiveSourceTable(
    sources
)
{
    return `
        <div class="archive-table-wrap">
          <table
            class="
              archive-table
              archive-source-table
            "
            aria-label="Sources">

            <thead>
              <tr>
                <th class="archive-col-name">
                  Source
                </th>

                <th class="archive-col-source-category">
                  Category
                </th>

                <th class="archive-col-source-reference">
                  Where found
                </th>

                <th class="archive-col-source-connections">
                  Connections
                </th>

                <th class="archive-col-source-accessed">
                  Accessed
                </th>

                <th
                  class="archive-col-favorite"
                  aria-label="Favourite">
                  ${icon.star}
                </th>

                <th class="archive-col-actions">
                </th>
              </tr>
            </thead>

            <tbody>
              ${sources.map(source =>
                {
                    const selected =
                        state.archiveSelectedSourceId
                    === source.id;

                    const categoryLabel =
                        localizedSourceCategoryShortLabel(
                            source.category
                        );

                    const fullCategoryLabel =
                        localizedSourceCategoryLabel(
                            source.category
                        );

                    const originLabel =
                        archiveSourceOriginLabel(
                            source
                        );

                    const referenceLabel =
                        archiveSourceReferenceLabel(
                            source
                        );

                    const connectionCount =
                        archiveSourceConnectionCount(
                            source
                        );

                    const accessedLabel =
                        source.accessedDate
                            ? archiveFormatDate(
                                source.accessedDate
                            )
                            : 'Not specified';

                    return `
                  <tr
                    class="
                      archive-source-row
                      ${
                            selected
                                ? 'selected-detail'
                                : ''
                        }
                    "
                    data-archive-source-row="${escapeHtml(source.id)}"
                    tabindex="0"
                    aria-selected="${
                        selected
                            ? 'true'
                            : 'false'
                    }">

                    <td>
                      <div class="archive-source-title-cell">
                        <strong
                          title="${escapeHtml(source.title)}">
                          ${escapeHtml(source.title)}
                        </strong>

                        <span
                          class="archive-source-origin"
                          title="${escapeHtml(originLabel)}">
                          ${escapeHtml(originLabel)}
                        </span>
                      </div>
                    </td>

                    <td>
                      <span
                        class="archive-source-category-text"
                        title="${escapeHtml(fullCategoryLabel)}">
                        ${escapeHtml(categoryLabel)}
                      </span>
                    </td>

                    <td>
                      <span
                        class="archive-source-reference-text"
                        title="${escapeHtml(referenceLabel)}">
                        ${escapeHtml(referenceLabel)}
                      </span>
                    </td>

                    <td
                      class="
                        archive-col-source-connections
                        archive-source-connections-cell
                      ">

                      <span class="archive-mobile-cell-label">${escapeHtml(t('Connections'))}: </span>${connectionCount}
                    </td>

                    <td>
                      <span
                        class="archive-source-accessed-text"
                        title="${escapeHtml(accessedLabel)}">
                        <span class="archive-mobile-cell-label">${escapeHtml(t('Accessed'))}: </span>${escapeHtml(accessedLabel)}
                      </span>
                    </td>

                    <td class="archive-source-favourite-cell">
                      <button
                        class="
                          archive-row-icon-button
                          ${
                                source.favorite
                                    ? 'active'
                                    : ''
                            }
                        "
                        type="button"
                        data-archive-source-favorite="${escapeHtml(source.id)}"
                        aria-label="${
                            source.favorite
                                ? 'Remove source from favourites'
                                : 'Add source to favourites'
                        }">
                        ${icon.star}
                      </button>
                    </td>

                    <td>
                      <button
                        class="
                          archive-row-icon-button
                          archive-source-row-actions
                        "
                        type="button"
                        data-archive-row-actions="source"
                        data-archive-row-id="${escapeHtml(source.id)}"
                        aria-label="Source actions">
                        ${icon.more}
                      </button>
                    </td>
                  </tr>
                `;
                }).join('')}
            </tbody>
          </table>
        </div>
      `;
}

function renderArchiveSourcesView()
{
    const sources =
        archiveFilteredSources();

    return `
        <div
          class="
            archive-page
          ">

          ${renderArchivePageHead({
                title:
              'Sources',

                subtitle:
              archiveSourcesViewSubtitle(),

                actions:
              renderArchiveSourcesHeaderActions()
            })}

          ${renderArchiveToolbar()}

          ${renderArchiveActiveFilterbar()}

          ${
                sources.length
                    ? renderArchiveSourceTable(
                        sources
                    )
                    : renderArchiveEmpty(
                        'No sources found',

                        state.archiveSearch
                            ? 'Try a different search term or source type.'
                            : 'Create a lightweight source record to document where files and information came from.'
                    )
            }
        </div>
      `;
}

function archiveInspectorToolbarContext()
{
    if (
        state.archiveView
          === 'sources'
    )
    {
        const source =
            archiveSourceById(
                state.archiveSelectedSourceId
            );

        return source
            ? {
                type:
                'source',

                id:
                source.id,

                label:
                source.title
                || 'Source',

                favorite:
                Boolean(
                    source.favorite
                ),

                supportsFavourite:
                true
            }
            : null;
    }

    const file =
        archiveFileById(
            state.archiveSelectedFileId
        );

    if (file)
    {
        return {
            type:
            'file',

            id:
            file.id,

            label:
            file.name
            || 'File',

            favorite:
            Boolean(
                file.favorite
            ),

            supportsFavourite:
            true
        };
    }

    const selectedFolder =
        archiveFolderById(
            state.archiveSelectedFolderItemId
        );

    if (selectedFolder)
    {
        return {
            type:
            'folder',

            id:
            selectedFolder.id,

            label:
            selectedFolder.name
            || 'Folder',

            folderMode:
            'selected',

            favorite:
            Boolean(selectedFolder.favorite),

            supportsFavourite:
            true
        };
    }

    const currentFolder =
        archiveFolderById(
            state.archiveSelectedFolderId
        );

    if (currentFolder)
    {
        return {
            type:
            'folder',

            id:
            currentFolder.id,

            label:
            currentFolder.name
            || 'Folder',

            folderMode:
            'current',

            favorite:
            Boolean(currentFolder.favorite),

            supportsFavourite:
            true
        };
    }

    /*
        The virtual Files root is a location, not
        a stored record, so it has no favourite or
        more-actions control.
      */

    return null;
}

function renderArchiveInspectorFolderOpenButton(
    context
)
{
    if (
        context?.type !== 'folder'
        || context.folderMode
          !== 'selected'
    )
    {
        return '';
    }

    return `
        <button
          class="
            archive-inspector-action
            archive-inspector-action-text
          "
          type="button"
          data-archive-inspector-open-folder="${escapeHtml(
                context.id
            )}"
          aria-label="Open folder"
          title="Open folder">

          Open
        </button>
      `;
}

function renderArchiveInspectorRenameButton(
    context
)
{
    if (
        context?.type !== 'folder'
    )
    {
        return '';
    }

    return `
        <button
          class="
            archive-inspector-action
          "
          type="button"
          data-archive-inspector-rename-folder="${escapeHtml(
                context.id
            )}"
          aria-label="Rename folder"
          title="Rename folder">

          ${icon.edit}
        </button>
      `;
}

function renderArchiveInspectorMoveButton(
    context
)
{
    if (
        !context
        || ![
            'file',
            'folder'
        ].includes(
            context.type
        )
    )
    {
        return '';
    }

    const itemLabel =
        context.type === 'file'
            ? 'file'
            : 'folder';

    return `
        <button
          class="
            archive-inspector-action
          "
          type="button"
          data-archive-inspector-move="${escapeHtml(
                context.type
            )}"
          data-archive-inspector-move-id="${escapeHtml(
                context.id
            )}"
          aria-label="Move ${escapeHtml(
                itemLabel
            )}"
          title="Move ${escapeHtml(
                itemLabel
            )}">

          ${icon.movefolder}
        </button>
      `;
}

function renderArchiveInspectorFavouriteButton(
    context
)
{
    if (
        !context
        || !context.supportsFavourite
    )
    {
        return '';
    }

    const actionLabel =
        context.favorite
            ? 'Remove from favourites'
            : 'Add to favourites';

    const dataAttribute =
        context.type
          === 'source'
            ? `
              data-archive-source-favorite="${escapeHtml(
                    context.id
                )}"
            `
            : context.type === 'folder'
              ? `data-archive-toggle-folder-favorite="${escapeHtml(context.id)}"`
            : `
              data-archive-toggle-favorite="${escapeHtml(
                    context.id
                )}"
            `;

    return `
        <button
          class="
            archive-inspector-action
            ${
                context.favorite
                    ? 'active'
                    : ''
            }
          "
          type="button"
          ${dataAttribute}
          aria-label="${escapeHtml(
                actionLabel
            )}"
          aria-pressed="${String(
                context.favorite
            )}"
          title="${escapeHtml(
                actionLabel
            )}">

          ${icon.star}
        </button>
      `;
}

function renderArchiveInspectorToolbar()
{
    const context =
        archiveInspectorToolbarContext();

    const editing =
        context?.type === 'file'
        && archiveFileEditIsActive(
            context.id
        );

    const collapseButton = `
        <button
          class="
            people-collapse-button
            people-sidebar-toggle-icon
            archive-inspector-collapse
          "
          type="button"
          data-archive-inspector-collapse="true"
          aria-label="Collapse Archive inspector"
          title="Collapse inspector">

          ${icon.doublechevronSidebar}
        </button>
      `;

    if (editing)
    {
        return `
          <div
            class="
              archive-inspector-toolbar
            "
            role="toolbar"
            aria-label="Edit Archive file">

            ${collapseButton}
          </div>
        `;
    }

    return `
        <div
          class="
            archive-inspector-toolbar
          "
          role="toolbar"
          aria-label="Archive inspector actions">

          ${collapseButton}

          <span
            class="
              archive-inspector-toolbar-spacer
            "
            aria-hidden="true">
          </span>

          ${renderArchiveInspectorFolderOpenButton(
                context
            )}

          ${renderArchiveInspectorRenameButton(
                context
            )}

          ${renderArchiveInspectorMoveButton(
                context
            )}

          ${renderArchiveInspectorFavouriteButton(
                context
            )}
          ${
                context
                    ? `
                <button
                  class="
                    archive-inspector-action
                  "
                  type="button"
                  data-archive-row-actions="${escapeHtml(
                        context.type
                    )}"
                  data-archive-row-id="${escapeHtml(
                        context.id
                    )}"
                  aria-label="More actions for ${escapeHtml(
                        context.label
                    )}"
                  aria-haspopup="menu"
                  aria-expanded="false"
                  title="More actions">

                  ${icon.more}
                </button>
              `
                    : ''
            }
        </div>
      `;
}

function renderArchiveInspectorCollapsed()
{
    return `
        <aside
          class="
            archive-inspector-collapsed
          "
          aria-label="Archive inspector collapsed">

          <button
            class="
              people-collapse-button
              people-sidebar-toggle-icon
              archive-inspector-restore
            "
            type="button"
            data-archive-inspector-collapse="false"
            aria-label="Open Archive inspector"
            title="Open inspector">

            ${icon.doublechevronSidebar}
          </button>
        </aside>
      `;
}

function renderArchiveRootInspector()
{
    const favoritesView =
        state.archiveView
          === 'favorites';

    return renderArchiveInspectorShell({
        title:
          favoritesView
              ? 'Favourites'
              : ARCHIVE_ROOT_LABEL,

        subtitle:
          'No item selected',

        content:
          renderInspectorSectionEmpty(
              'Select a file or folder to view its details.'
          )
    });
}

function renderArchiveInspector()
{
    if (
        state.archiveView
          === 'sources'
    )
    {
        return renderArchiveSourceInspector();
    }

    const file =
        archiveFileById(
            state.archiveSelectedFileId
        );

    if (file)
    {
        return renderArchiveFileInspector(
            file
        );
    }

    const selectedFolder =
        archiveFolderById(
            state.archiveSelectedFolderItemId
        );

    if (selectedFolder)
    {
        return renderArchiveFolderInspector(
            selectedFolder,
            {
                mode:
              'selected'
            }
        );
    }

    const currentFolder =
        archiveFolderById(
            state.archiveSelectedFolderId
        );

    return currentFolder
        ? renderArchiveFolderInspector(
            currentFolder,
            {
                mode:
                'current'
            }
        )
        : renderArchiveRootInspector();
}

function renderArchiveInspectorHeader(
    title,
    subtitle = ''
)
{
    return `
        <div
          class="
            archive-inspector-head
          ">

          <div
            class="
              archive-inspector-head-copy
            ">

            <h2>
              ${escapeHtml(
                    title
                )}
            </h2>

            ${
                subtitle
                    ? `
                  <p>
                    ${escapeHtml(
                        subtitle
                    )}
                  </p>
                `
                    : ''
            }
          </div>
        </div>
      `;
}

function renderArchiveInspectorShell({
    content,
    title = '',
    subtitle = '',
    showHeader = true,
    bodyClass =
        'archive-inspector-body',
    className = ''
})
{
    return `
        <aside
          class="
            archive-inspector
            ${className}
          "
          aria-label="Archive inspector">

          ${renderArchiveInspectorToolbar()}

          <div
            class="
              archive-inspector-scroll
            ">

            ${
                showHeader
                    ? renderArchiveInspectorHeader(
                        title,
                        subtitle
                    )
                    : ''
            }

            <div
              class="${escapeHtml(
                    bodyClass
                )}">

              ${content}
            </div>
          </div>
        </aside>
      `;
}

function renderArchivePreview(
    file
)
{
    const imageSource = archiveImageSource(file);
    if (archiveFileKind(file) !== 'img' || !imageSource) return '';
    const regions = archiveMarkedRegions(file);
    return `
          <button type="button" data-archive-open-file="${escapeHtml(file.id)}" aria-label="${escapeHtml(t('Open file'))}"
            class="
              archive-file-preview
            ">

            <img
              class="
                archive-file-preview-image
              "
              src="${escapeHtml(
                    imageSource
                )}"
              alt="">
            ${regions.map(({ personId, name }) => `<span class="archive-person-region-highlight" data-archive-region-box="${escapeHtml(personId)}" data-archive-region-ready="false" title="${escapeHtml(name)}" aria-hidden="true" hidden></span>`).join('')}
            <span class="archive-person-floating-preview" data-archive-person-floating hidden aria-hidden="true">
              <img class="archive-file-preview-image" src="${escapeHtml(imageSource)}" alt="">
              <span class="archive-person-region-highlight" data-archive-floating-region-highlight hidden></span>
            </span>
          </button>
        `;
}

function renderArchiveFileOpenAction(
    file
)
{
    if (!archiveCanViewFile(file)) return '';
    return `
        <button
          class="
            button
            secondary
            archive-file-open
          "
          type="button"
          data-archive-open-file="${escapeHtml(
                file.id
            )}">

          Open file
        </button>
      `;
}

function renderArchiveFileIdentity(
    file,
    editing
)
{
    const summary =
        [
            archiveFileTypeLabel(
                file
            ),

            file.size
          || (
              Number.isFinite(
                  Number(
                      file.sizeBytes
                  )
              )
                  ? formatMediaBytes(
                      file.sizeBytes
                  )
                  : ''
          )
        ]
            .filter(Boolean)
            .join(' · ');
    const summaryHtml = `<p class="archive-file-summary" ${archiveFileKind(file) === 'img' ? `data-archive-image-summary data-size="${escapeHtml(file.size || (Number.isFinite(Number(file.sizeBytes)) ? formatMediaBytes(file.sizeBytes) : ''))}"` : ''} title="${escapeHtml(summary || 'File')}">${escapeHtml(summary || 'File')}</p>`;

    return `
        <div
          class="
            archive-file-identity
          ">

          ${state.archiveFileNameEditingId === file.id ? `
            <div class="inspector-name-editor">
              <input id="archiveFileNameInput" maxlength="220" aria-label="${escapeHtml(t('File name'))}" value="${escapeHtml(file.name || '')}">
              <div class="inspector-name-editor-footer">${summaryHtml}<div class="inspector-name-editor-actions">
                <button class="inspector-name-edit-button inspector-name-save" type="button" id="archiveSaveFileName" aria-label="${escapeHtml(t('Save'))}" title="${escapeHtml(t('Save'))}">${icon.check}<span>${escapeHtml(t('Save'))}</span></button>
                <button class="inspector-name-edit-button inspector-name-cancel" type="button" id="archiveCancelFileName" aria-label="${escapeHtml(t('Cancel'))}" title="${escapeHtml(t('Cancel'))}">${icon.close}<span>${escapeHtml(t('Cancel'))}</span></button>
              </div>
              </div>
            </div>` : `
            <div class="inspector-name-heading"><h2 title="${escapeHtml(file.name || 'Untitled file')}" data-user-content>${escapeHtml(file.name || 'Untitled file')}</h2><button class="inspector-name-command" type="button" id="archiveRenameFile" aria-label="${escapeHtml(t('Rename file'))}" title="${escapeHtml(t('Rename file'))}">${icon.edit}</button></div>${summaryHtml}`}
        </div>
      `;
}

function renderArchiveFileHero(
    file,
    editing
)
{
    const imageView = state.archiveFileLayout === 'images' && state.archiveView !== 'sources';
    const preview = imageView ? '' : renderArchivePreview(file);
    const openAction = imageView ? '' : renderArchiveFileOpenAction(file);
    const identity = renderArchiveFileIdentity(file, editing);
    return `
        <div
          class="
            archive-file-hero ${preview ? '' : 'no-preview'}
          ">
          ${preview}${openAction}${identity}
        </div>
      `;
}

function renderArchiveFileDetails(
    file,
    editing
)
{
    if (editing)
    {
        const draft =
            state.archiveFileEditDraft
          || archiveFileEditDraftFromFile(
              file
          );

        return `
          <div
            class="
              archive-file-form-grid
            ">
            ${renderGenealogyDateField(
                'archiveFileDocumentDate',
                'Date',
                draft.documentDate,
                {
                    inputId:
                  'archiveFileDocumentDateInput',

                    typeId:
                  'archiveFileDocumentDateType',

                    defaultDateType:
                  'Exact date',

                    className:
                  'genealogy-date-inline-range'
                }
            )}

            <div
              class="
                archive-file-field
              ">

              <label
                for="archiveFileDescription">

                ${escapeHtml(t('Details'))}
              </label>

              <textarea
                id="archiveFileDescription"
                maxlength="1200"
                placeholder="${escapeHtml(t('Add details'))}">${escapeHtml(
                    draft.description
                  || ''
                )}</textarea>
            </div>
            <div class="details-edit-actions"><button class="button secondary" type="button" id="archiveCancelFileEdit">${escapeHtml(t('Cancel'))}</button><button class="button primary" type="button" id="archiveSaveFileEdit">${escapeHtml(t('Save changes'))}</button></div>
          </div>
        `;
    }

    const dateLabel =
        formatGenealogyDateLabel(
            archiveDocumentDateModel(
                file
            )
        )
        || 'Date unknown';

    const description =
        String(
            file.description
          || ''
        ).trim()
        || 'No description';

    return `
        <dl
          class="
            archive-file-read-list
          ">

          <div
            class="
              archive-file-read-row
            ">

            <dt>
              Date
            </dt>

            <dd>
              ${escapeHtml(
                    dateLabel
                )}
            </dd>
          </div>

          <div
            class="
              archive-file-read-row
            ">

            <dt>
              ${escapeHtml(t('Details'))}
            </dt>
            <dd class="archive-file-read-description">${escapeHtml(
                translateText(description)
            )}</dd>
          </div>
        </dl>
      `;
}

function archiveFilePersonMeta(
    person
)
{
    const birth =
        formatGenealogyDateLabel(
            person?.birth
        );

    const death =
        formatGenealogyDateLabel(
            person?.death
        );

    if (
        birth
        && death
    )
    {
        return `${birth} – ${death}`;
    }

    if (birth)
    {
        return `Born ${birth}`;
    }

    if (death)
    {
        return `Died ${death}`;
    }

    return 'Person profile';
}

function renderArchiveFileConnectionRow({
    file,
    entityType,
    record,
    leadingHtml,
    readOnly = false
})
{
    const config =
        archiveEntityConfig(
            entityType
        );

    if (
        !config
        || !record
    )
    {
        return '';
    }

    const label =
        config.label(
            record
        );

    const meta =
        entityType === 'person'
            ? archiveFilePersonMeta(
                record
            )
            : config.meta(
                record
            );

    const mainContent = `
        ${leadingHtml}

        <span
          class="
            relation-row-copy
          ">

          <strong>
            ${escapeHtml(
                label
            )}
          </strong>

          <span>
            ${escapeHtml(
                meta
            )}
          </span>
        </span>
      `;

    return `
        <div
          class="
            relation-row
          " ${entityType === 'person' && normalizeFaceRegion(file.personRegions?.[record.id]) ? `data-archive-person-region="${escapeHtml(record.id)}"` : ''}>

          ${
                readOnly
                    ? `
                <div
                  class="
                    relation-row-main
                  " ${entityType === 'person' && normalizeFaceRegion(file.personRegions?.[record.id]) ? `tabindex="0" aria-label="${escapeHtml(record.name || '')}"` : ''}>

                  ${mainContent}
                </div>
              `
                    : `
                <button
                  class="
                    relation-row-main
                  "
                  type="button"
                  data-archive-open-connection="${escapeHtml(
                        entityType
                    )}"
                  data-archive-connection-id="${escapeHtml(
                        record.id
                    )}"
                  aria-label="Open ${escapeHtml(
                        label
                    )}">

                  ${mainContent}
                </button>
              `
            }

          ${
                readOnly
                    ? ''
                    : `
                <div
                  class="
                    relation-actions
                  ">

                  <button
                    class="
                      relation-action-button
                    "
                    type="button"
                    data-archive-unlink-owner-type="file"
                    data-archive-unlink-owner-id="${escapeHtml(
                        file.id
                    )}"
                    data-archive-unlink-type="${escapeHtml(
                        entityType
                    )}"
                    data-archive-unlink-id="${escapeHtml(
                        record.id
                    )}"
                    aria-label="Unlink ${escapeHtml(
                        label
                    )}"
                    title="Unlink">

                    ${icon.unlink}
                  </button>
                </div>
              `
            }
        </div>
      `;
}

function renderArchiveFilePeople(
    file,
    readOnly
)
{
    const people =
        (
            file.linkedPersonIds
          || []
        )
            .map(id =>
                getPerson(
                    id
                )
            )
            .filter(Boolean);

    if (!people.length)
    {
        return renderInspectorSectionEmpty(
            'No people linked to this file.'
        );
    }

    return `
        <div
          class="
            relationship-list
          ">

          ${people
                .map(person =>
                    renderArchiveFileConnectionRow({
                        file,
                        entityType:
                  'person',
                        record:
                  person,
                        leadingHtml:
                  renderPersonAvatar(
                      person,
                      'small-avatar',
                      {
                          element:
                        'span'
                      }
                  ),
                        readOnly
                    })
                )
                .join('')}
        </div>
      `;
}

function renderArchiveFilePlaces(file, readOnly)
{
    const places = archiveFilePlaceIds(file)
        .map(id => getPlace(id))
        .filter(place => place && !place.deleted && place.projectId === file.projectId);
    const legacyText = !file.documentPlaceId
        ? String(file.documentPlaceText || '').trim()
        : '';
    if (!places.length && !legacyText)
        return renderInspectorSectionEmpty('No places linked to this file.');
    return `<div class="relationship-list notes-place-list archive-file-place-list">
      ${places.map(place => {
        const name = placePrimaryName(place) || place.name || 'Unnamed place';
        const location = placeSecondaryName(place) || 'No broader place recorded';
        return `<div class="relation-row notes-place-item">
          ${readOnly ? `<div class="relation-row-main notes-place-main">` : `<button class="relation-row-main notes-place-main" type="button" data-archive-open-connection="place" data-archive-connection-id="${escapeHtml(place.id)}" aria-label="${escapeHtml(t('Open place:') + ' ' + name)}">`}
            <span class="notes-place-icon" aria-hidden="true">${icon.mapPin}</span>
            <span class="notes-place-copy"><strong>${escapeHtml(name)}</strong><span class="notes-place-secondary">${escapeHtml(location)}</span></span>
          ${readOnly ? '</div>' : '</button>'}
          ${readOnly ? '' : `<div class="relation-actions"><button class="relation-action-button" type="button" data-archive-unlink-owner-type="file" data-archive-unlink-owner-id="${escapeHtml(file.id)}" data-archive-unlink-type="place" data-archive-unlink-id="${escapeHtml(place.id)}" aria-label="${escapeHtml(t('Unlink') + ' ' + name)}" title="${escapeHtml(t('Unlink'))}">${icon.unlink}</button></div>`}
        </div>`;
      }).join('')}
      ${legacyText ? `<div class="archive-legacy-place"><span>${escapeHtml(legacyText)}</span><small>${escapeHtml(t('Place name not linked to a project place'))}</small>${readOnly ? '' : `<button class="link" type="button" data-archive-resolve-file-place="${escapeHtml(file.id)}">${escapeHtml(t('Find place'))}</button>`}</div>` : ''}
    </div>`;
}

function archiveFileEventRecords(
    file
)
{
    return (
        file?.linkedEventIds
        || []
    )
        .map(id =>
            archiveConnectionRecord(
                'event',
                id
            )
        )
        .filter(event =>
            Boolean(
                eventRelationItemModel(
                    event
                )
            )
        );
}

function renderArchiveFileEvents(
    file,
    readOnly
)
{
    const events =
        archiveFileEventRecords(
            file
        );

    if (!events.length)
    {
        return renderInspectorSectionEmpty(
            'No events linked to this file.'
        );
    }

    return `
        <div
          class="
            relationship-list
            notes-event-list
          ">

          ${events
                .map(event =>
                    renderEventRelationItem({
                        event,

                        openAttributes:
                  `
                    data-archive-open-connection="event"
                    data-archive-connection-id="${escapeHtml(
                        event.id
                    )}"
                  `,

                        removeAttributes:
                  `
                    data-archive-unlink-owner-type="file"
                    data-archive-unlink-owner-id="${escapeHtml(
                        file.id
                    )}"
                    data-archive-unlink-type="event"
                    data-archive-unlink-id="${escapeHtml(
                        event.id
                    )}"
                  `,

                        removeContextLabel:
                  'file',

                        readOnly
                    })
                )
                .join('')}
        </div>
      `;
}

function archiveFileNoteRecords(
    file
)
{
    return archiveNoteIdsForFile(
        file
    )
        .map(id =>
            archiveConnectionRecord(
                'note',
                id
            )
        )
        .filter(Boolean);
}

function renderArchiveFileNotes(file, readOnly)
{
    const notes = archiveFileNoteRecords(file);

    if (!notes.length)
    {
        return renderInspectorSectionEmpty(
            'No notes linked to this file.'
        );
    }

    const items = notes.slice(0, CONNECTED_NOTES_PREVIEW_LIMIT).map(note =>
        renderRelatedNoteRelationItem({
            note,

            openAttributes: `
            data-archive-open-connection="note"
            data-archive-connection-id="${escapeHtml(note.id)}"
          `,

            removeAttributes: `
            data-archive-unlink-owner-type="file"
            data-archive-unlink-owner-id="${escapeHtml(file.id)}"
            data-archive-unlink-type="note"
            data-archive-unlink-id="${escapeHtml(note.id)}"
          `,

            removeContextLabel: 'file',
            readOnly
        })
    ).join('');

    return `
        <div class="relationship-list notes-related-list">
          ${items}
        </div>

        ${renderConnectedNotesFooter({
            contextType: 'archiveFile',
            contextId: file.id,
            count: notes.length
        })}
      `;
}

function renderArchiveFileSources(
    file,
    readOnly
)
{
    return renderConnectedSourceList({
        targetType:
          'file',

        targetId:
          file.id,

        projectId:
          file.projectId,

        /*
          The Archive inspector must show every
          connected source rather than the four-item
          preview used in some other panels.
        */
        limit:
          Number.POSITIVE_INFINITY,

        emptyText:
          'No sources linked to this file.',

        readOnly
    });
}

function renderArchiveFileMetadata(
    file
)
{
    const rows = [
        [
            'Folder',
            archiveFolderPath(
                file.folderId
            )
        ],

        [
            'Date added',
            archiveFormatDate(
                file.addedAt,
                file.added
            )
        ],

        [
            'Date modified',
            archiveFormatDate(
                file.updatedAt,
                file.updated
            )
        ],

        file.originalName
        && file.originalName
          !== file.name
            ? [
                'Original filename',
                file.originalName
            ]
            : null,

        file.mimeType
            ? [
                'MIME type',
                file.mimeType
            ]
            : null,

        [
            'File ID',
            file.id
        ]
    ].filter(Boolean);

    return `
        <div
          class="
            archive-file-metadata-list
          ">

          ${rows
                .map(([
                    label,
                    value
                ]) => `
              <div
                class="
                  archive-file-metadata-row
                ">

                <span>
                  ${escapeHtml(
                        label
                    )}
                </span>

                <strong>
                  ${escapeHtml(
                        value
                    || 'Unknown'
                    )}
                </strong>
              </div>
            `)
                .join('')}
        </div>
      `;
}

function renderArchiveSourceSection(
    sectionId,
    title,
    content,
    actionHtml = '',
    meta = '',
    footerHtml = ''
)
{
    const stateKey = `source-${sectionId}`;

    return renderInspectorSection(
        stateKey,
        title,
        meta,
        content,
        actionHtml,
        {
            inlineAction: Boolean(actionHtml),
            alwaysShowAction: true,
            open: archiveInspectorSectionIsOpen(stateKey),
            toggleAttribute: 'data-archive-section-toggle',
            sectionId: `archive-source-section-${sectionId}`,
            footerHtml
        }
    );
}

function archiveSourceConnectionRecords(
    source,
    entityType
)
{
    if (!source)
    {
        return [];
    }

    if (entityType === 'file')
    {
        return archiveFilesForSource(
            source.id
        );
    }

    return archiveConnectionIds(
        'source',
        source.id,
        entityType
    )
        .map(id =>
            archiveConnectionRecord(
                entityType,
                id
            )
        )
        .filter(Boolean);
}

function renderArchiveSourceSectionAction(
    source,
    entityType
)
{
    const config =
        archiveEntityConfig(
            entityType
        );

    if (!source || !config)
    {
        return '';
    }

    return `
        <button
          class="link"
          type="button"
          data-archive-add-connection="${escapeHtml(
                entityType
            )}"
          data-archive-owner-type="source"
          data-archive-owner-id="${escapeHtml(
                source.id
            )}">

          ${renderPanelButtonLabel(
                icon.plus,
                config.addLabel
            )}
        </button>
      `;
}

function renderArchiveSourceConnectionContent(
    source,
    entityType,
    records
)
{
    const config =
        archiveEntityConfig(
            entityType
        );

    if (!config)
    {
        return '';
    }

    const validRecords =
        (
            Array.isArray(
                records
            )
                ? records
                : []
        )
            .filter(Boolean);

    if (!validRecords.length)
    {
        return renderInspectorSectionEmpty(
            `No ${config.title.toLowerCase()} linked.`
        );
    }

    const previewLimits = {
        photo: PERSON_PANEL_PREVIEW_LIMITS.photos,
        file: PERSON_PANEL_PREVIEW_LIMITS.archive,
        note: CONNECTED_NOTES_PREVIEW_LIMIT
    };

    const visibleRecords = validRecords.slice(
        0,
        previewLimits[entityType] ?? 4
    );

    const openAttributes =
        recordId => `
          data-archive-open-connection="${escapeHtml(
                entityType
            )}"
          data-archive-connection-id="${escapeHtml(
                recordId
            )}"
        `;

    const removeAttributes =
        recordId => `
          data-archive-unlink-owner-type="source"
          data-archive-unlink-owner-id="${escapeHtml(
                source.id
            )}"
          data-archive-unlink-type="${escapeHtml(
                entityType
            )}"
          data-archive-unlink-id="${escapeHtml(
                recordId
            )}"
        `;

    const renderRelationRemoveAction =
        (
            recordId,
            label
        ) => `
          <div class="relation-actions">
            <button
              class="
                relation-action-button
                danger
              "
              type="button"
              ${removeAttributes(
                    recordId
                )}
              aria-label="Remove ${escapeHtml(
                    label
                )} from source"
              title="Remove link">

              ${icon.close}
            </button>
          </div>
        `;

    /*
        Notes uses the shared connected-file
        component for linked Archive files.
      */
    if (entityType === 'file')
    {
        return renderConnectedFileList({
            files:
            visibleRecords,

            contextType:
            'source',

            contextId:
            source.id,

            emptyText:
            'No files linked.'
        });
    }

    /*
        Reuse the Notes linked-photo grid.
      */
    if (entityType === 'photo')
    {
        return `
          <div
            class="
              connected-photo-grid
              notes-linked-photo-grid
            ">

            ${visibleRecords
                .map(photo =>
                {
                    const label =
                        config.label(
                            photo
                        );

                    return `
                  <div
                    class="
                      notes-linked-photo-item
                      person-connected-photo-item
                    ">

                    <button
                      class="connected-photo-button"
                      type="button"
                      ${openAttributes(
                            photo.id
                        )}
                      title="${escapeHtml(
                            label
                        )}"
                      aria-label="Open ${escapeHtml(
                            label
                        )} in Albums">

                      ${renderPhotoThumbnail(
                            photo,
                            {
                                label
                            }
                        )}
                    </button>

                    <button
                      class="
                        connected-note-unlink
                        connected-photo-unlink
                      "
                      type="button"
                      ${removeAttributes(
                            photo.id
                        )}
                      aria-label="Unlink ${escapeHtml(
                            label
                        )} from source"
                      title="Unlink photo">

                      ${icon.unlink}
                    </button>
                  </div>
                `;
                })
                .join('')}
          </div>
        `;
    }

    /*
        Reuse the person rows from the
        Notes right-side panel.
      */
    if (entityType === 'person')
    {
        return `
          <div
            class="
              relationship-list
              notes-people-list
            ">

            ${visibleRecords
                .map(person =>
                {
                    const name =
                        person.names?.display
                  || person.name
                  || 'Unnamed person';

                    const dates =
                        albumPhotoPersonDates(
                            person
                        )
                  || config.meta(
                      person
                  );

                    return `
                  <div class="relation-row">
                    <button
                      class="relation-row-main"
                      type="button"
                      ${openAttributes(
                            person.id
                        )}
                      aria-label="Open profile for ${escapeHtml(
                            name
                        )}">

                      ${renderPersonAvatar(
                            person,
                            'small-avatar',
                            {
                                element:
                            'span'
                            }
                        )}

                      <span class="relation-row-copy">
                        <strong>
                          ${escapeHtml(
                                name
                            )}
                        </strong>

                        <span>
                          ${escapeHtml(
                                dates
                            )}
                        </span>
                      </span>
                    </button>

                    ${renderRelationRemoveAction(
                        person.id,
                        name
                    )}
                  </div>
                `;
                })
                .join('')}
          </div>
        `;
    }

    /*
        renderEventRelationItem() is already
        shared by Notes and Archive.
      */
    if (entityType === 'event')
    {
        return `
          <div
            class="
              relationship-list
              notes-event-list
            ">

            ${visibleRecords
                .map(event =>
                    renderEventRelationItem({
                        event,

                        openAttributes:
                    openAttributes(
                        event.id
                    ),

                        removeAttributes:
                    removeAttributes(
                        event.id
                    ),

                        removeContextLabel:
                    'source'
                    })
                )
                .join('')}
          </div>
        `;
    }

    /*
        Related-note rows already have a
        reusable renderer.
      */
    if (entityType === 'note')
    {
        return `
          <div
            class="
              relationship-list
              notes-related-list
            ">

            ${visibleRecords
                .map(note =>
                    renderRelatedNoteRelationItem({
                        note,

                        openAttributes:
                    openAttributes(
                        note.id
                    ),

                        removeAttributes:
                    removeAttributes(
                        note.id
                    ),

                        removeContextLabel:
                    'source'
                    })
                )
                .join('')}
          </div>
        `;
    }

    /*
        Reuse the full place presentation
        from the Notes inspector.
      */
    if (entityType === 'place')
    {
        return `
          <div
            class="
              relationship-list
              notes-place-list
            ">

            ${visibleRecords
                .map(place =>
                {
                    const primaryName =
                        placePrimaryName(
                            place
                        )
                  || place.name
                  || 'Unnamed place';

                    const secondaryName =
                        placeSecondaryName(
                            place
                        )
                  || 'No broader place recorded';

                    return `
                  <div
                    class="
                      relation-row
                      notes-place-item
                    ">

                    <button
                      class="
                        relation-row-main
                        notes-place-main
                      "
                      type="button"
                      ${openAttributes(
                            place.id
                        )}
                      aria-label="${escapeHtml(t('Open place:') + ' ' + primaryName)}">

                      <span
                        class="notes-place-icon"
                        aria-hidden="true">

                        ${icon.mapPin}
                      </span>

                      <span class="notes-place-copy">
                        <strong>
                          ${escapeHtml(
                                primaryName
                            )}
                        </strong>

                        <span class="notes-place-secondary">
                          ${escapeHtml(
                                secondaryName
                            )}
                        </span>

                      </span>
                    </button>

                    ${renderRelationRemoveAction(
                        place.id,
                        primaryName
                    )}
                  </div>
                `;
                })
                .join('')}
          </div>
        `;
    }

    /*
        Safe fallback for any connection type
        added to the Source inspector later.
      */
    return `
        <div class="notes-linked-list">
          ${visibleRecords
                .map(record =>
                {
                    const label =
                        config.label(
                            record
                        );

                    const metadata =
                        config.meta(
                            record
                        );

                    return `
                <div class="notes-linked-row">
                  <button
                    class="notes-linked-main"
                    type="button"
                    ${openAttributes(
                        record.id
                    )}
                    aria-label="Open ${escapeHtml(
                        label
                    )}">

                    <strong>
                      ${escapeHtml(
                            label
                        )}
                    </strong>

                    <span>
                      ${escapeHtml(
                            metadata
                        )}
                    </span>
                  </button>

                  <div class="notes-linked-actions">
                    <button
                      class="
                        notes-linked-action
                        danger
                      "
                      type="button"
                      ${removeAttributes(
                            record.id
                        )}
                      aria-label="Remove ${escapeHtml(
                            label
                        )} from source"
                      title="Remove link">

                      ${icon.close}
                    </button>
                  </div>
                </div>
              `;
                })
                .join('')}
        </div>
      `;
}

function renderSourceConnectionViewAll(source, entityType, count)
{
    const labels = {
        photo: ['photo', 'photos'],
        file: ['file', 'files'],
        note: ['note', 'notes']
    };

    const nouns = labels[entityType];

    if (!source?.id || !count || !nouns) return '';

    const label = translateText(
        `View all ${count} ${count === 1 ? nouns[0] : nouns[1]}`
    );

    return `
        <button
          class="panel-section-view-all"
          type="button"
          data-source-connected-view-all="${escapeHtml(entityType)}"
          data-source-connected-owner="${escapeHtml(source.id)}">
          <span>${escapeHtml(label)}</span>
          <span
            class="panel-section-view-all-icon"
            aria-hidden="true">
            ${icon.chevron}
          </span>
        </button>
      `;
}

function renderArchiveSourceConnectionSection(
    source,
    entityType
)
{
    const config =
        archiveEntityConfig(
            entityType
        );

    if (!source || !config)
    {
        return '';
    }

    const records =
        archiveSourceConnectionRecords(
            source,
            entityType
        );
    const countLabel =
        state.language === 'ru'
        && entityType === 'photo'
            ? `${
                RU_NUMBER_FORMATTER.format(
                    records.length
                )
            } фото`
            : translateText(
                `${records.length} ${
                    records.length === 1
                        ? config.singular
                        : config.title.toLowerCase()
                }`
            );
    return renderArchiveSourceSection(
        entityType,
        config.title,
        renderArchiveSourceConnectionContent(
            source,
            entityType,
            records
        ),
        renderArchiveSourceSectionAction(
            source,
            entityType
        ),
        countLabel,
        renderSourceConnectionViewAll(
            source,
            entityType,
            records.length
        )
    );
}

function renderArchiveSourceDetails(
    source,
    categoryLabel
)
{
    if (state.archiveSourceEditingId === source.id)
    {
        const draft = state.archiveSourceEditDraft || source;
        return `<div class="archive-source-details-form archive-file-form-grid">
          <div class="archive-file-field"><label for="archiveSourceDetailTitle">${escapeHtml(t('Source name'))}</label><input id="archiveSourceDetailTitle" maxlength="220" value="${escapeHtml(draft.title || '')}"></div>
          <div class="archive-file-field"><label for="archiveSourceDetailCategory">${escapeHtml(t('Source category'))}</label><select id="archiveSourceDetailCategory" class="compact-select"><option value="">${escapeHtml(t('Choose category'))}</option>${SOURCE_CATEGORIES.map(category => `<option value="${escapeHtml(category.value)}" ${draft.category === category.value ? 'selected' : ''}>${escapeHtml(t(category.label))}</option>`).join('')}</select></div>
          <div class="archive-file-field"><label for="archiveSourceDetailProvidedBy">${escapeHtml(t('Where or who did it come from?'))}</label><input id="archiveSourceDetailProvidedBy" value="${escapeHtml(draft.providedBy || '')}"></div>
          <div class="archive-file-field"><label for="archiveSourceDetailLocation">${escapeHtml(t('Location'))}</label><input id="archiveSourceDetailLocation" value="${escapeHtml(draft.location || '')}"></div>
          <div class="archive-file-field"><label for="archiveSourceDetailReference">${escapeHtml(t('Where can it be found?'))}</label><input id="archiveSourceDetailReference" value="${escapeHtml(draft.reference || '')}"></div>
          <div class="archive-file-field"><label for="archiveSourceDetailUrl">${escapeHtml(t('Website or link'))}</label><input id="archiveSourceDetailUrl" type="url" value="${escapeHtml(draft.url || '')}"></div>
          ${renderGenealogyDateField('archiveSourceDetailAccessed', 'Date accessed or received', draft.accessedDate || '', { inputId: 'archiveSourceDetailAccessedInput', typeId: 'archiveSourceDetailAccessedType', defaultDateType: 'Exact date' })}
          <div class="archive-file-field"><label for="archiveSourceDetailNotes">${escapeHtml(t('Notes'))}</label><textarea id="archiveSourceDetailNotes">${escapeHtml(draft.notes || '')}</textarea></div>
          <div class="details-edit-actions"><button class="button secondary" type="button" id="archiveCancelSourceDetailEdit">${escapeHtml(t('Cancel'))}</button><button class="button primary" type="button" id="archiveSaveSourceDetailEdit">${escapeHtml(t('Save changes'))}</button></div>
        </div>`;
    }
    const url =
        String(
            source.url
          || ''
        ).trim();

    const rows = [
        {
            label:
            'Category',

            value:
            categoryLabel
            || 'Not specified'
        },
        {
            label:
            'Obtained from',

            value:
            source.providedBy
            || 'Not specified'
        },
        {
            label:
            'Location',

            value:
            source.location
            || 'Not specified'
        },
        {
            label:
            'Where can it be found?',

            value:
            source.reference
            || 'Not specified'
        },
        {
            label:
            'Website or link',

            value:
            url
            || 'Not specified',

            isLink:
            Boolean(
                url
            )
        },
        {
            label:
            'Date accessed or received',

            value:
            source.accessedDate
                ? archiveFormatDate(
                    source.accessedDate
                )
                : 'Not specified'
        }
    ];

    return `
        <dl
          class="
            archive-file-read-list
            archive-source-read-list
          ">

          ${rows
                .map(row => `
              <div class="archive-file-read-row">
                <dt>
                  ${escapeHtml(
                        row.label
                    )}
                </dt>

                <dd>
                  ${
                        row.isLink
                            ? `
                        <a
                          class="
                            link
                            archive-source-url
                          "
                          href="${escapeHtml(
                                row.value
                            )}"
                          target="_blank"
                          rel="noopener noreferrer">

                          ${escapeHtml(
                                row.value
                            )}
                        </a>
                      `
                            : escapeHtml(
                                row.value
                            )
                    }
                </dd>
              </div>
            `)
                .join('')}
        </dl>

        ${
            source.notes
                ? `
              <div class="archive-source-notes">
                <strong>
                  Source notes
                </strong>

                <p>${escapeHtml(
                    source.notes
                )}</p>
              </div>
            `
                : ''
        }
      `;
}

function collectArchiveSourceDetailDraft(root = main)
{
    const value = id => root.querySelector(`#${id}`)?.value?.trim() || '';
    const accessedModel = collectGenealogyDateField('archiveSourceDetailAccessed', { allowInvalid: true });
    const accessedDate = accessedModel?.invalid ? null : archiveSourceAccessedDateValue(accessedModel);
    return {
        title: value('archiveSourceDetailTitle'),
        category: value('archiveSourceDetailCategory'),
        providedBy: value('archiveSourceDetailProvidedBy'),
        location: value('archiveSourceDetailLocation'),
        reference: value('archiveSourceDetailReference'),
        url: value('archiveSourceDetailUrl'),
        accessedDate,
        notes: value('archiveSourceDetailNotes')
    };
}

function beginArchiveSourceDetailEdit(sourceId)
{
    const source = archiveSourceById(sourceId);
    if (!source || source.projectId !== currentProjectId()) return;
    state.archiveSourceEditingId = sourceId;
    state.archiveSourceEditOriginal = collectArchiveSourceSnapshot(source);
    state.archiveSourceEditDraft = { ...state.archiveSourceEditOriginal };
    state.archiveInspectorSections['source-details'] = true;
    renderArchiveMain();
    requestAnimationFrame(() => main.querySelector('#archiveSourceDetailTitle')?.focus({ preventScroll: true }));
}

function collectArchiveSourceSnapshot(source)
{
    return Object.fromEntries(['title', 'category', 'providedBy', 'location', 'reference', 'url', 'accessedDate', 'notes']
        .map(key => [key, String(source?.[key] || '')]));
}

function resetArchiveSourceDetailEdit()
{
    state.archiveSourceEditingId = '';
    state.archiveSourceEditOriginal = null;
    state.archiveSourceEditDraft = null;
}

function saveArchiveSourceDetailEdit()
{
    const source = archiveSourceById(state.archiveSourceEditingId);
    if (!source || source.projectId !== currentProjectId()) return;
    const draft = collectArchiveSourceDetailDraft();
    if (!draft.title)
    {
        main.querySelector('#archiveSourceDetailTitle')?.focus();
        showToast(t('Enter a source name before saving.'));
        return;
    }
    if (draft.accessedDate === null)
    {
        main.querySelector('#archiveSourceDetailAccessedInput')?.focus();
        showToast(t('Enter a valid date or the known date parts.'));
        return;
    }
    const urlInput = main.querySelector('#archiveSourceDetailUrl');
    if (draft.url && !urlInput?.checkValidity())
    {
        urlInput?.reportValidity();
        return;
    }
    Object.assign(source, draft, { updatedAt: new Date().toISOString() });
    resetArchiveSourceDetailEdit();
    renderArchiveMain();
    requestAnimationFrame(() => main.querySelector('[data-archive-edit-source-details]')?.focus({ preventScroll: true }));
    showToast(t('Source updated.'));
}

function cancelArchiveSourceDetailEdit()
{
    const current = collectArchiveSourceDetailDraft();
    if (JSON.stringify(current) !== JSON.stringify(state.archiveSourceEditOriginal))
    {
        openModal(`<div class="modal" role="dialog" aria-modal="true" aria-labelledby="archiveDiscardSourceTitle"><div class="modal-header"><h2 id="archiveDiscardSourceTitle">${escapeHtml(t('Discard changes?'))}</h2></div><div class="modal-body"><p>${escapeHtml(t('Your unsaved source details will be lost.'))}</p></div><div class="modal-footer"><button class="button secondary" type="button" data-close>${escapeHtml(t('Continue editing'))}</button><button class="button danger" type="button" id="archiveConfirmDiscardSource">${escapeHtml(t('Discard changes'))}</button></div></div>`);
        modalBackdrop.querySelector('#archiveConfirmDiscardSource')?.addEventListener('click', () =>
        {
            closeModal();
            resetArchiveSourceDetailEdit();
            renderArchiveMain();
            requestAnimationFrame(() => main.querySelector('[data-archive-edit-source-details]')?.focus({ preventScroll: true }));
        });
        return;
    }
    resetArchiveSourceDetailEdit();
    renderArchiveMain();
    requestAnimationFrame(() => main.querySelector('[data-archive-edit-source-details]')?.focus({ preventScroll: true }));
}

function runAfterArchiveSourceDetailEditGuard(action)
{
    if (!state.archiveSourceEditingId)
    {
        action();
        return;
    }
    if (JSON.stringify(collectArchiveSourceDetailDraft()) === JSON.stringify(state.archiveSourceEditOriginal))
    {
        resetArchiveSourceDetailEdit();
        action();
        return;
    }
    openModal(`<div class="modal" role="dialog" aria-modal="true" aria-labelledby="archiveDiscardSourceTitle"><div class="modal-header"><h2 id="archiveDiscardSourceTitle">${escapeHtml(t('Discard changes?'))}</h2></div><div class="modal-body"><p>${escapeHtml(t('Your unsaved source details will be lost.'))}</p></div><div class="modal-footer"><button class="button secondary" type="button" data-close>${escapeHtml(t('Continue editing'))}</button><button class="button danger" type="button" id="archiveConfirmDiscardSource">${escapeHtml(t('Discard changes'))}</button></div></div>`);
    modalBackdrop.querySelector('#archiveConfirmDiscardSource')?.addEventListener('click', () =>
    {
        closeModal();
        resetArchiveSourceDetailEdit();
        action();
    });
}

function openArchiveSourceFilesModal(
    sourceId
)
{
    const source =
        archiveSourceById(
            sourceId
        );

    if (!source)
    {
        return;
    }

    const existingFileIds =
        archiveFilesForSource(
            source.id
        ).map(file =>
            file.id
        );

    openConnectedFilesModal({
        projectId:
          source.projectId
          || currentProjectId(),

        title:
          'Add files',

        subtitle:
          localizedDataFieldValue(source.title || 'Untitled source'),

        existingFileIds,

        onSave:
          (fileIds, context) =>
          {
              if (context?.changes) return rpCommitArchivePickerChanges('source', [source.id], 'file', fileIds, context);
              const currentSource =
                  archiveSourceById(
                      source.id
                  );

              if (!currentSource)
              {
                  return {
                      ok:
                  false
                  };
              }

              const writes =
                  fileIds.map(fileId => ({
                      ownerType:
                  'source',

                      ownerId:
                  currentSource.id,

                      entityType:
                  'file',

                      entityId:
                  fileId,

                      shouldLink:
                  true
                  }));

              const committed =
                  archiveSetConnectionsAtomically(
                      writes
                  );

              return {
                  ...committed,

                  ok:
                committed.ok
                && committed.changedCount
                  === writes.length
              };
          },

        afterSave:
          renderArchivePreservingSourceInspectorScroll,

        successMessage:
          count =>
              `${count} ${
                  count === 1
                      ? 'file'
                      : 'files'
              } added to source.`
    });
}

function renderArchiveFileInspector(
    file
)
{
    if (
        state.archiveFileEditing
        && state.archiveFileEditDraft
            ?.fileId !== file.id
    )
    {
        resetArchiveFileEditState();
    }

    const editing =
        archiveFileEditIsActive(
            file.id
        );

    const peopleCount =
        (
            file.linkedPersonIds
          || []
        ).length;

    const eventCount =
        archiveFileEventRecords(
            file
        ).length;

    const noteCount =
        archiveFileNoteRecords(
            file
        ).length;

    const sourceCount =
        sourceIdsForTarget(
            'file',
            file.id,
            file.projectId
        ).length;

    const placeCount = archiveFilePlaceIds(file).length;

    const content = `
        ${renderArchiveFileHero(
            file,
            editing
        )}

        ${renderArchiveFileSection(
            'details',
            'Details',
            renderArchiveFileDetails(
                file,
                editing
            ),
            editing ? '' : `<button class="link" type="button" id="archiveEditFile">${renderPanelButtonLabel(icon.edit, 'Edit')}</button>`
        )}

        ${renderArchiveFileSection(
            'people',
            'People',
            renderArchiveFilePeople(
                file,
                editing
            ),
            renderArchiveFileSectionAction(
                'person',
                'Tag person',
                editing
            ),
            `${peopleCount} ${
                peopleCount === 1
                    ? 'person'
                    : 'people'
            }`
        )}

        ${renderArchiveFileSection(
            'events',
            'Events',
            renderArchiveFileEvents(
                file,
                editing
            ),
            renderArchiveFileSectionAction(
                'event',
                'Add event',
                editing
            ),
            `${eventCount} ${
                eventCount === 1
                    ? 'event'
                    : 'events'
            }`
        )}

        ${renderArchiveFileSection(
            'notes',
            'Notes',
            renderArchiveFileNotes(
                file,
                editing
            ),
            renderArchiveFileSectionAction(
                'note',
                'Add note',
                editing
            ),
            `${noteCount} ${
                noteCount === 1
                    ? 'note'
                    : 'notes'
            }`
        )}

        ${renderArchiveFileSection(
            'sources',
            'Sources',
            renderArchiveFileSources(
                file,
                editing
            ),
            renderArchiveFileSectionAction(
                'source',
                'Add source',
                editing
            ),
            `${sourceCount} ${
                sourceCount === 1
                    ? 'source'
                    : 'sources'
            }`
        )}

        ${renderArchiveFileSection(
            'places',
            'Places',
            renderArchiveFilePlaces(file, editing),
            editing ? '' : `<button class="link" type="button" data-archive-add-file-place="${escapeHtml(file.id)}">${renderPanelButtonLabel(icon.plus, 'Add places')}</button>`,
            `${placeCount} ${placeCount === 1 ? 'place' : 'places'}`
        )}

        ${renderArchiveFileSection(
            'metadata',
            'File metadata',
            renderArchiveFileMetadata(
                file
            )
        )}
      `;

    return renderArchiveInspectorShell({
        showHeader:
          false,

        bodyClass:
          'archive-file-inspector-content',

        className:
          editing
              ? 'is-editing'
              : '',

        content
    });
}

function archiveFolderInspectorPath(
    folder
)
{
    if (!folder)
    {
        return 'Files';
    }

    const names =
        archiveFolderAncestors(
            folder.id
        )
            .map(item =>
                item?.name
            )
            .filter(Boolean);

    return [
        'Files',
        ...names
    ].join(
        ' / '
    );
}

function renderArchiveFolderInspector(
    folder,
    {
        mode =
            'current'
    } = {}
)
{
    if (!folder)
    {
        return renderArchiveRootInspector();
    }

    const selectedFolder =
        mode === 'selected';

    const impact =
        archiveFolderImpact(
            folder.id
        );

    const directFolders =
        archiveFolderChildren(
            folder.id
        ).length;

    const directFiles =
        archiveProjectFiles()
            .filter(file =>
                archiveFileFolderId(
                    file
                ) === folder.id
            )
            .length;

    const location =
        archiveFolderInspectorPath(
            folder
        );

    const body = `
        <div
          class="
            archive-inspector-actions
            archive-folder-inspector-actions
          ">

          <button
            class="
              button secondary
            "
            type="button"
            data-archive-create-folder
            data-archive-parent-folder="${escapeHtml(
                folder.id
            )}">

            ${icon.plus}
            New subfolder
          </button>

          <button
            class="
              button secondary
            "
            type="button"
            data-archive-add-files
            data-archive-parent-folder="${escapeHtml(
                folder.id
            )}">

            ${icon.plus}
            Add file
          </button>
        </div>

        <section
          class="
            archive-inspector-section
          ">

          <div
            class="
              archive-inspector-section-head
            ">

            <strong>
              Folder details
            </strong>
          </div>

          <div
            class="
              archive-inspector-section-body
            ">

          <div
            class="
              archive-kv-list
            ">

            <div
              class="
                archive-kv
              ">

              <span>
                Location
              </span>

              <span>
                ${escapeHtml(
                    location
                )}
              </span>
            </div>

            <div
              class="
                archive-kv
              ">

              <span>
                Created
              </span>

              <span>
                ${escapeHtml(
                    archiveFormatDate(
                        folder.createdAt
                    )
                )}
              </span>
            </div>

              <div
                class="
                  archive-kv
                ">

                <span>
                  Folders
                </span>

                <span>
                  ${directFolders}
                </span>
              </div>

              <div
                class="
                  archive-kv
                ">

                <span>
                  Files
                </span>

                <span>
                  ${directFiles}
                </span>
              </div>

              <div
                class="
                  archive-kv
                ">

                <span>
                  Nested files
                </span>

                <span>
                  ${impact.files}
                </span>
              </div>
            </div>
          </div>
        </section>
      `;

    return renderArchiveInspectorShell({
        title:
          folder.name,

        subtitle:
          selectedFolder
              ? 'Selected folder'
              : 'Current folder',

        content:
          body
    });
}

function renderArchiveSourceInspector()
{
    const source =
        archiveSourceById(
            state.archiveSelectedSourceId
        )
        || archiveFilteredSources()[0]
        || null;

    if (!source)
    {
        return renderArchiveInspectorShell({
            title:
            'Sources',

            subtitle:
            'No source selected',

            content:
            renderInspectorSectionEmpty(
                'Select or create a source record.'
            )
        });
    }

    const categoryLabel =
        localizedSourceCategoryLabel(
            source.category
        );

    const content = `
        ${renderArchiveSourceSection(
            'details',
            'Source details',
            renderArchiveSourceDetails(source, categoryLabel),
            state.archiveSourceEditingId === source.id ? '' : `<button class="link" type="button" data-archive-edit-source-details="${escapeHtml(source.id)}">${renderPanelButtonLabel(icon.edit, 'Edit')}</button>`
        )}

        ${renderArchiveSourceConnectionSection(source, 'person')}
        ${renderArchiveSourceConnectionSection(source, 'event')}
        ${renderArchiveSourceConnectionSection(source, 'photo')}
        ${renderArchiveSourceConnectionSection(source, 'file')}
        ${renderArchiveSourceConnectionSection(source, 'note')}
        ${renderArchiveSourceConnectionSection(source, 'place')}
      `;

    return renderArchiveInspectorShell({
        title:
          source.title,

        subtitle:
          categoryLabel,

        bodyClass:
          'archive-source-inspector-content',

        content
    });
}

function openArchiveAddFilesModal()
{
    openArchiveDocumentImport();
}

function connectedFilesForProject(
    projectId =
        currentProjectId()
)
{
    return (
        sampleData.archiveFiles
        || []
    )
        .filter(file =>
            !file.deleted
          && Boolean(projectId)
          && file.projectId === projectId
        );
}

function connectedFilesSelectionLabel(
    count
)
{
    return `${count} ${
        count === 1
            ? 'file'
            : 'files'
    } selected`;
}

function connectedFilesActionLabel(
    count
)
{
    if (!count)
    {
        return 'Add files';
    }

    return `Add ${count} ${
        count === 1
            ? 'file'
            : 'files'
    }`;
}


function createArchiveFolderRecord(
    name,
    parentId = null
)
{
    const projectId = requireActiveProjectId();
    if (!projectId) return null;
    const normalizedName =
        String(
            name || ''
        ).trim();

    if (!normalizedName)
    {
        return null;
    }

    const normalizedParentId =
        archiveNormalizeFolderId(
            parentId
        );

    let id =
        `folder-${Date.now()}`;

    let suffix =
        1;

    while (
        archiveFolderById(
            id
        )
    )
    {
        id =
            `folder-${Date.now()}-${suffix}`;

        suffix +=
            1;
    }

    const now =
        new Date()
            .toISOString();

    const folder = {
        id,

        projectId,

        favorite: false,

        parentId:
          normalizedParentId,

        name:
          normalizedName,

        createdAt:
          now,

        updatedAt:
          now
    };

    sampleData.archiveFolders =
        sampleData.archiveFolders
        || [];

    sampleData
        .archiveFolders
        .push(
            folder
        );

    if (
        normalizedParentId
    )
    {
        state.archiveExpandedFolders[
            normalizedParentId
        ] = true;
    }

    return folder;
}

function openArchiveCreateFolderModal(
    parentId =
        state.archiveSelectedFolderId
)
{
    const initialParentId =
        archiveNormalizeFolderId(
            parentId
        );

    let selectedParentId =
        initialParentId;

    let query =
        '';

    let searchExpanded = false;

    const expandedIds =
        new Set([
            null
        ]);

    /*
        Reveal the initially selected parent and
        all of its ancestors.
      */
    archiveFolderAncestors(
        initialParentId
    ).forEach(folder =>
    {
        expandedIds.add(
            folder.id
        );
    });

    if (initialParentId)
    {
        expandedIds.add(
            initialParentId
        );
    }

    openModal(`
        <div
          class="
            modal
            archive-create-folder-modal
            resource-picker
          "
          role="dialog"
          aria-modal="true"
          aria-labelledby="archiveNewFolderTitle">

          <div class="modal-header">
            <div>
              <h2
                id="archiveNewFolderTitle">

                New folder
              </h2>

              <p>
                Enter a folder name and choose
                where it should be created.
              </p>
            </div>

            <button
              class="close-button"
              type="button"
              data-close
              aria-label="Close">

              ${icon.close}
            </button>
          </div>

          <form
            class="
              archive-create-folder-form
            "
            data-archive-create-folder-form>

            <div
              class="
                modal-body
                archive-create-folder-body
              ">

              <div
                class="
                  field
                  archive-create-folder-name-field
                ">

                <label
                  for="archiveCreateFolderName">

                  Name of new folder
                </label>

                <input
                  id="archiveCreateFolderName"
                  data-archive-folder-name
                  required
                  maxlength="160"
                  placeholder="e.g. Civil records">
              </div>

              <div
                class="
                  archive-create-folder-parent-picker
                "
                data-archive-create-folder-parent-picker>
              </div>
            </div>

            <div class="modal-footer">
              <button
                class="button secondary"
                type="button"
                data-close>

                Cancel
              </button>

              <button
                class="button primary"
                type="submit">

                Create folder
              </button>
            </div>
          </form>
        </div>
      `);

    const modal =
        modalBackdrop.querySelector(
            '.archive-create-folder-modal'
        );

    const form =
        modal?.querySelector(
            '[data-archive-create-folder-form]'
        );

    const nameInput =
        form?.querySelector(
            '[data-archive-folder-name]'
        );

    const parentPickerRoot =
        form?.querySelector(
            '[data-archive-create-folder-parent-picker]'
        );

    const renderParentPicker =
        ({
            focusSearch =
                false
        } = {}) =>
        {
            if (!parentPickerRoot)
            {
                return;
            }

            const breadcrumbs = [
                { id: ARCHIVE_ROOT_PICKER_VALUE, name: t('All files') },
                ...archiveFolderAncestors(selectedParentId).map(folder => ({ id: folder.id, name: folder.name }))
            ];
            const currentCrumb = breadcrumbs.at(-1);
            const fullPath = breadcrumbs.map(crumb => crumb.name).join(' / ');

            parentPickerRoot.innerHTML = `
            <div class="archive-create-folder-path-row">
              <div class="archive-create-folder-path-context">
                <span class="archive-create-folder-path-label">${escapeHtml(t('Create inside'))}</span>
                <nav class="rp-path archive-folder-path" aria-label="${escapeHtml(t('Parent folder'))}" aria-live="polite">
                  <span class="rp-path-icon" aria-hidden="true">${icon.folderyellow}</span>
                  ${breadcrumbs.slice(0, -1).map((crumb, index) => `<button class="${index ? 'archive-folder-crumb-intermediate' : ''}" type="button" data-archive-create-folder-crumb="${escapeHtml(crumb.id)}" title="${escapeHtml(crumb.name)}">${escapeHtml(crumb.name)}</button><span class="${index ? 'archive-folder-crumb-intermediate' : ''}" aria-hidden="true">${icon.chevron}</span>`).join('')}
                  <span aria-current="page" title="${escapeHtml(fullPath)}">${escapeHtml(currentCrumb.name)}</span>
                </nav>
              </div>
              <div class="archive-folder-inline-search ${searchExpanded ? 'is-expanded' : ''}">
                <button type="button" class="icon-button" data-archive-create-folder-search-toggle
                  aria-label="${escapeHtml(t(searchExpanded ? 'Close search' : 'Search folders'))}" aria-expanded="${searchExpanded}" aria-controls="archiveCreateFolderSearch" title="${escapeHtml(t(searchExpanded ? 'Close search' : 'Search folders'))}">${icon.search}</button>
                <input id="archiveCreateFolderSearch" type="search" data-archive-create-folder-search
                  aria-label="${escapeHtml(t('Search folders'))}" placeholder="${escapeHtml(t('Search folders'))}" value="${escapeHtml(query)}" ${searchExpanded ? '' : 'hidden'}>
              </div>
            </div>

            ${renderArchiveMovePicker({
                query,

                selectedId:
                selectedParentId,

                expandedIds,

                /*
                The Create modal has no unavailable
                moving/current folder. Every folder
                is a valid parent destination.
              */
                movingFolder:
                null,

                /*
                This argument is used by the latest
                shared picker implementation. Older
                signatures safely ignore it.
              */
                currentFolderState:
                null
            })}
          `;

            const createButton = form?.querySelector('button[type="submit"]');
            const parentName = selectedParentId
                ? archiveFolderById(selectedParentId)?.name
                : t('All files');
            if (createButton) createButton.textContent = `${t('Create in')} ${parentName || t('All files')}`;

            /*
           * This picker is rendered after openModal()
           * has localized the initial modal content.
           *
           * Localize the newly inserted subtree
           * explicitly. The same function also runs
           * after search, selection, and expand/collapse
           * rerenders.
           */
            localizeUI(
                parentPickerRoot,
                {
                    suppressObserverReplay:
                true
                }
            );

            requestAnimationFrame(
                () =>
                {
                    if (!focusSearch)
                    {
                        return;
                    }

                    const searchInput =
                        parentPickerRoot
                            .querySelector(
                                '[data-archive-create-folder-search]'
                            );

                    searchInput?.focus();

                    const end =
                        searchInput?.value
                            .length
                || 0;

                    searchInput
                        ?.setSelectionRange(
                            end,
                            end
                        );
                }
            );
        };

    /*
        Search is delegated because the picker
        content is rerendered after every query.
      */
    modal?.addEventListener(
        'input',
        event =>
        {
            const searchInput =
                event.target.closest(
                    '[data-archive-create-folder-search]'
                );

            if (!searchInput)
            {
                return;
            }

            query =
                searchInput.value;

            renderParentPicker({
                focusSearch:
              true
            });
        }
    );

    /*
        Reuse the Move picker expand and select
        controls inside this modal only.
      */
    modal?.addEventListener(
        'click',
        event =>
        {
            if (event.target.closest('[data-archive-create-folder-search-toggle]'))
            {
                searchExpanded = !searchExpanded;
                if (!searchExpanded) query = '';
                renderParentPicker({ focusSearch: searchExpanded });
                if (!searchExpanded) requestAnimationFrame(() => parentPickerRoot.querySelector('[data-archive-create-folder-search-toggle]')?.focus());
                return;
            }

            const crumb = event.target.closest('[data-archive-create-folder-crumb]');
            if (crumb)
            {
                selectedParentId = archiveFolderIdFromChoice(crumb.dataset.archiveCreateFolderCrumb);
                query = '';
                searchExpanded = false;
                renderParentPicker();
                requestAnimationFrame(() => parentPickerRoot.querySelector('[data-archive-create-folder-search-toggle]')?.focus());
                return;
            }

            const toggle =
                event.target.closest(
                    '[data-archive-move-toggle]'
                );

            if (toggle)
            {
                const folderId =
                    archiveFolderIdFromChoice(
                        toggle.dataset
                            .archiveMoveToggle
                    );

                if (
                    expandedIds.has(
                        folderId
                    )
                )
                {
                    expandedIds.delete(
                        folderId
                    );
                }
                else
                {
                    expandedIds.add(
                        folderId
                    );
                }

                renderParentPicker();

                return;
            }

            const destination =
                event.target.closest(
                    '[data-archive-move-select]'
                );

            if (!destination)
            {
                return;
            }

            if (
                destination.disabled
            || destination.getAttribute(
                'aria-disabled'
            ) === 'true'
            )
            {
                return;
            }

            selectedParentId =
                archiveFolderIdFromChoice(
                    destination.dataset
                        .archiveMoveSelect
                );

            /*
            Ensure a parent selected through search
            is revealed when the search is cleared.
          */
            archiveFolderAncestors(
                selectedParentId
            ).forEach(folder =>
            {
                expandedIds.add(
                    folder.id
                );
            });

            if (selectedParentId)
            {
                expandedIds.add(
                    selectedParentId
                );
            }

            renderParentPicker();
        }
    );

    form?.addEventListener(
        'submit',
        event =>
        {
            event.preventDefault();

            const name =
                nameInput
                    ?.value
                    .trim()
            || '';

            if (!name)
            {
                nameInput?.focus();

                return;
            }

            const folder =
                createArchiveFolderRecord(
                    name,
                    selectedParentId
                );

            if (!folder)
            {
                nameInput?.focus();

                return;
            }

            closeModal();

            archiveNavigateToLocation(
                {
                    view:
                'files',

                    folderId:
                folder.id,

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
                },
                {
                    expandCurrent:
                true
                }
            );

            showToast(
                'Folder created.'
            );
        }
    );

    renderParentPicker();

    requestAnimationFrame(
        () =>
        {
            nameInput?.focus();
        }
    );
}

function archiveSourceAccessedDateValue(dateModel)
{
    if (!dateModel || dateModel.invalid) return null;
    const value = normalizeGenealogyDateInput(dateModel);
    return value.state === 'empty' ? '' : value;
}

function collectArchiveSourceAccessedDate()
{
    const fieldId =
        'archiveSourceAccessed';

    const fieldRoot =
        modalBackdrop
            ?.querySelector(
                `[data-genealogy-date-field="${fieldId}"]`
            );

    const dateModel =
        collectGenealogyDateField(
            fieldId
        );

    if (!dateModel)
    {
        return null;
    }

    const isoDate =
        archiveSourceAccessedDateValue(
            dateModel
        );

    if (isoDate === null)
    {
        setGenealogyDateFieldError(
            fieldRoot,
            'Enter a valid date or the known date parts.'
        );

        return null;
    }

    return isoDate;
}

function openArchiveSourceModal(
    sourceId = '',
    {
        onCreated =
            null,
        modalOpener = openModal,
        targetProjectId = null
    } = {}
)
{
    const source =
        archiveSourceById(
            sourceId
        );

    const editing =
        Boolean(
            source
        );

    const categoryOptions =
        SOURCE_CATEGORIES
            .map(category => `
            <option
              value="${escapeHtml(category.value)}"
              ${
                    source?.category
                  === category.value
                        ? 'selected'
                        : ''
                }>
              ${escapeHtml(category.label)}
            </option>
          `)
            .join('');

    modalOpener(`
        <div
          class="modal archive-source-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="archiveSourceModalTitle">

          <div class="modal-header">
            <div>
              <h2 id="archiveSourceModalTitle">
                ${
                    editing
                        ? 'Edit source'
                        : 'Add source'
                }
              </h2>

              <p>
                Record where this file or information came from.
                Only the source name is required.
              </p>
            </div>

            <button
              class="close-button"
              type="button"
              data-close
              aria-label="Close">
              ${icon.close}
            </button>
          </div>

          <form
            class="archive-source-form"
            data-archive-source-form>

            <div
              class="
                modal-body
                archive-source-form-body
              ">

              <section
                class="archive-source-form-section"
                aria-labelledby="archiveSourceBasicHeading">

                <div
                  class="
                    archive-source-form-section-heading
                  ">

                  <h3 id="archiveSourceBasicHeading">
                    Basic information
                  </h3>
                </div>

                <div class="field">
                  <label for="archiveSourceName">
                    Source name

                    <span
                      class="archive-source-required"
                      aria-hidden="true">
                      *
                    </span>
                  </label>

                  <input
                    id="archiveSourceName"
                    data-archive-source-title
                    required
                    aria-required="true"
                    autocomplete="off"
                    value="${escapeHtml(source?.title || '')}"
                    placeholder="e.g. Pawford household register">
                </div>

                <div
                  class="
                    archive-source-form-row
                    archive-source-form-row-identity
                  ">

                  <div class="field">
                    <label for="archiveSourceCategory">
                      Source category
                    </label>

                    <select
                      id="archiveSourceCategory"
                      class="compact-select"
                      data-archive-source-form-category>

                      <option value="">
                        Choose category
                      </option>

                      ${categoryOptions}
                    </select>
                  </div>

                  <div class="field">
                    <label for="archiveSourceProvidedBy">
                      Where or who did it come from?
                    </label>

                    <input
                      id="archiveSourceProvidedBy"
                      data-archive-source-provided-by
                      autocomplete="off"
                      value="${escapeHtml(source?.providedBy || '')}"
                      placeholder="Person, archive, website, library, or family collection">
                  </div>
                </div>
              </section>

              <section
                class="archive-source-form-section"
                aria-labelledby="archiveSourceFindingHeading">

                <div
                  class="
                    archive-source-form-section-heading
                  ">

                  <h3 id="archiveSourceFindingHeading">
                    Finding details
                  </h3>
                </div>

                <div
                  class="
                    archive-source-form-row
                    archive-source-form-row-location
                  ">

                  <div class="field">
                    <label for="archiveSourceLocation">
                      Location
                    </label>

                    <input
                      id="archiveSourceLocation"
                      data-archive-source-location
                      autocomplete="off"
                      value="${escapeHtml(source?.location || '')}"
                      placeholder="Town, archive location, or where the item is kept">
                  </div>

                  <div class="field">
                    <label for="archiveSourceReference">
                      Where can it be found?
                    </label>

                    <input
                      id="archiveSourceReference"
                      data-archive-source-reference
                      autocomplete="off"
                      value="${escapeHtml(source?.reference || '')}"
                      placeholder="Collection, folder, volume, page, call number, or item">
                  </div>
                </div>

                <div
                  class="
                    archive-source-form-row
                    archive-source-form-row-access
                  ">

                  <div class="field">
                    <label for="archiveSourceUrl">
                      Website or link
                    </label>

                    <input
                      id="archiveSourceUrl"
                      type="url"
                      inputmode="url"
                      autocomplete="url"
                      data-archive-source-url
                      value="${escapeHtml(source?.url || '')}"
                      placeholder="https://">
                  </div>

                  ${renderGenealogyDateField(
                        'archiveSourceAccessed',
                        'Date accessed or received',
                        source?.accessedDate
                      || '',
                        {
                            inputId:
                        'archiveSourceAccessedInput',

                            typeId:
                        'archiveSourceAccessedType',

                            defaultDateType:
                        'Exact date',

                            placeholder:
                        'e.g. 24 May 2026',

                            className:
                        'archive-source-accessed-date'
                        }
                    )}
                </div>
              </section>

              <section
                class="archive-source-form-section"
                aria-labelledby="archiveSourceNotesHeading">

                <div
                  class="
                    archive-source-form-section-heading
                  ">

                  <h3 id="archiveSourceNotesHeading">
                    Additional notes
                  </h3>
                </div>

                <div class="field">
                  <label for="archiveSourceNotes">
                    Notes
                  </label>

                  <textarea
                    id="archiveSourceNotes"
                    data-archive-source-notes
                    placeholder="Add anything that will help you recognize or find this source again">${escapeHtml(source?.notes || '')}</textarea>
                </div>
              </section>
            </div>

            <div class="modal-footer">
              <button
                class="button secondary"
                type="button"
                data-close>
                Cancel
              </button>

              <button
                class="button primary"
                type="submit">
                ${
                    editing
                        ? 'Save source'
                        : 'Create source'
                }
              </button>
            </div>
          </form>
        </div>
      `);

    const form =
        modalBackdrop.querySelector(
            '[data-archive-source-form]'
        );

    bindGenealogyDateFields(
        modalBackdrop
    );

    requestAnimationFrame(
        () =>
        {
            modalBackdrop
                .querySelector(
                    '#archiveSourceName'
                )
                ?.focus({
                    preventScroll: true
                });
        }
    );

    form?.addEventListener(
        'submit',
        event =>
        {
            event.preventDefault();

            const projectId =
                source?.projectId
            || targetProjectId
            || requireActiveProjectId();

            if (!projectId)
            {
                return;
            }

            const title =
                form
                    .querySelector(
                        '[data-archive-source-title]'
                    )
                    .value
                    .trim();

            if (!title)
            {
                return;
            }

            const accessedDate =
                collectArchiveSourceAccessedDate();

            if (accessedDate === null)
            {
                form
                    .querySelector(
                        '[data-genealogy-date-input]'
                    )
                    ?.focus({
                        preventScroll: true
                    });

                return;
            }

            const now =
                new Date().toISOString();

            const target =
                source
            || {
                id:
                createRuntimeId(
                    'source'
                ),

                projectId,

                favorite:
                false,

                createdAt:
                now
            };

            target.title =
                title;

            target.category =
                form
                    .querySelector(
                        '[data-archive-source-form-category]'
                    )
                    .value;

            target.providedBy =
                form
                    .querySelector(
                        '[data-archive-source-provided-by]'
                    )
                    .value
                    .trim();

            target.location =
                form
                    .querySelector(
                        '[data-archive-source-location]'
                    )
                    .value
                    .trim();

            target.reference =
                form
                    .querySelector(
                        '[data-archive-source-reference]'
                    )
                    .value
                    .trim();

            target.url =
                form
                    .querySelector(
                        '[data-archive-source-url]'
                    )
                    .value
                    .trim();

            target.accessedDate =
                accessedDate;

            target.notes =
                form
                    .querySelector(
                        '[data-archive-source-notes]'
                    )
                    .value
                    .trim();

            target.updatedAt =
                now;

            const created =
                !source;

            if (created)
            {
                sampleData.sources.unshift(
                    target
                );
            }

            if (
                created
            && typeof onCreated
              === 'function'
            )
            {
                closeModal();

                onCreated(
                    target
                );

                return;
            }

            state.archiveView =
                'sources';

            state.archiveSelectedSourceId =
                target.id;

            state.archiveSearch =
                '';

            closeModal();
            renderArchive();

            showToast(
                editing
                    ? 'Source updated.'
                    : 'Source created.'
            );
        }
    );
}

function openArchiveRenameItemModal(
    type,
    id
)
{
    const file =
        type === 'file'
            ? archiveFileById(
                id
            )
            : null;

    const folder =
        type === 'folder'
            ? archiveFolderById(
                id
            )
            : null;

    const item =
        file
        || folder;

    if (!item)
    {
        return;
    }

    const itemType =
        file
            ? 'file'
            : 'folder';

    const currentName =
        file?.name
        || folder?.name
        || '';

    const title =
        file
            ? 'Rename file'
            : 'Rename folder';

    const description =
        file
            ? 'Update the file name without changing its contents, folder, or links.'
            : 'Update the folder name without changing its contents or location.';

    openModal(`
        <div
          class="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="archiveRenameItemTitle">

          <div class="modal-header">
            <div>
              <h2
                id="archiveRenameItemTitle">

                ${escapeHtml(
                    title
                )}
              </h2>

              <p>
                ${escapeHtml(
                    description
                )}
              </p>
            </div>

            <button
              class="close-button"
              type="button"
              data-close
              aria-label="Close">

              ${icon.close}
            </button>
          </div>

          <form
            data-archive-rename-item-form>

            <div class="modal-body">
              <div class="field">
                <label
                  for="archiveRenameItemValue">

                  Name
                </label>

                <input
                  id="archiveRenameItemValue"
                  required
                  maxlength="220"
                  value="${escapeHtml(
                        currentName
                    )}">
              </div>
            </div>

            <div class="modal-footer">
              <button
                class="button secondary"
                type="button"
                data-close>

                Cancel
              </button>

              <button
                class="button primary"
                type="submit">

                Rename
              </button>
            </div>
          </form>
        </div>
      `);

    const form =
        modalBackdrop.querySelector(
            '[data-archive-rename-item-form]'
        );

    const input =
        form?.querySelector(
            '#archiveRenameItemValue'
        );

    form?.addEventListener(
        'submit',
        event =>
        {
            event.preventDefault();

            const value =
                input
                    ?.value
                    .trim()
            || '';

            if (!value)
            {
                input?.focus();

                return;
            }

            const now =
                new Date()
                    .toISOString();

            if (file)
            {
                file.name =
                    value;

                file.updatedAt =
                    now;

                file.updated =
                    'Just now';
            }

            if (folder)
            {
                folder.name =
                    value;

                folder.updatedAt =
                    now;
            }

            closeModal();
            renderArchive();

            showToast(
                `${
                    itemType === 'file'
                        ? 'File'
                        : 'Folder'
                } renamed.`
            );
        }
    );

    requestAnimationFrame(
        () =>
        {
            input?.focus();
            input?.select();
        }
    );
}

function archiveMoveFolderPath(
    folderId
)
{
    const folders =
        archiveFolderAncestors(
            folderId
        );

    return [
        ARCHIVE_ROOT_LABEL,

        ...folders.map(
            folder =>
                folder.name
        )
    ].join(
        ' / '
    );
}

function archiveMoveCurrentFolderState({
    movingFolder,
    files
})
{
    /*
        When moving a folder, the folder itself is
        the unavailable "Current folder" row.
      */
    if (movingFolder)
    {
        return {
            hasCurrentFolder:
            true,

            folderId:
            movingFolder.id
        };
    }

    /*
        A single current folder exists only when
        all selected files share the same folder.
      */
    const folderIds =
        [
            ...new Set(
                files.map(file =>
                    archiveFileFolderId(
                        file
                    )
                )
            )
        ];

    return {
        hasCurrentFolder:
          folderIds.length === 1,

        folderId:
          folderIds.length === 1
              ? folderIds[0]
              : null
    };
}

function archiveMoveNewFolderParentId({
    movingFolder,
    selectedId,
    currentFolderState
})
{
    /*
        Create inside the explicitly selected
        destination whenever one exists.
      */
    if (
        archiveMoveHasDestination(
            selectedId
        )
    )
    {
        return selectedId;
    }

    /*
        A new destination for a moving folder
        must not be created inside that folder.
        Default to its existing parent.
      */
    if (movingFolder)
    {
        return archiveFolderParentId(
            movingFolder
        );
    }

    /*
        For files from one location, creating a
        subfolder inside their current folder is
        a useful default.
      */
    if (
        currentFolderState
            .hasCurrentFolder
    )
    {
        return currentFolderState
            .folderId;
    }

    /*
        Mixed-origin bulk selection defaults to
        the Files root.
      */
    return null;
}

const ARCHIVE_FOLDER_DOUBLE_CLICK_MS =
    420;

let archiveLastFolderRowClick = {
    folderId:
        null,

    at:
        0
};

let archiveLastFileRowClick = { fileId: null, at: 0 };

function archiveFileRowWasDoubleClick(fileId)
{
    const now = performance.now();
    const repeated = archiveLastFileRowClick.fileId === fileId
        && now - archiveLastFileRowClick.at <= ARCHIVE_FOLDER_DOUBLE_CLICK_MS;
    archiveLastFileRowClick = { fileId, at: now };
    return repeated;
}

function archiveFolderRowWasDoubleClick(
    folderId
)
{
    const now =
        performance.now();

    const repeated =
        archiveLastFolderRowClick
            .folderId === folderId
        && now
          - archiveLastFolderRowClick.at
          <= ARCHIVE_FOLDER_DOUBLE_CLICK_MS;

    archiveLastFolderRowClick = {
        folderId,

        at:
          now
    };

    return repeated;
}

function resetArchiveFolderRowClick()
{
    archiveLastFolderRowClick = {
        folderId:
          null,

        at:
          0
    };
}

function archiveMoveInitialRevealFolderId({
    movingFolder,
    files,
    currentFolderState
})
{
    if (movingFolder)
    {
        return movingFolder.id;
    }

    if (
        currentFolderState
            .hasCurrentFolder
    )
    {
        return currentFolderState
            .folderId;
    }

    return archiveFileFolderId(
        files[0]
    );
}

function renderArchiveMoveItemSummary({
    movingFolder,
    files
})
{
    let itemIcon =
        files.length === 1 && archiveFileKind(files[0]) === 'img'
            ? icon.image
            : icon.file;

    let itemName =
        '';

    let itemMeta =
        '';

    if (movingFolder)
    {
        const impact =
            archiveFolderImpact(
                movingFolder.id
            );

        itemIcon =
            icon.folderyellow;

        itemName =
            movingFolder.name
          || 'Untitled folder';

        itemMeta =
            `${impact.files} ${
                impact.files === 1
                    ? 'file'
                    : 'files'
            } · ${impact.folders} ${
                impact.folders === 1
                    ? 'subfolder'
                    : 'subfolders'
            }`;
    }
    else if (
        files.length === 1
    )
    {
        const file =
            files[0];

        itemName =
            file.name
          || 'Untitled file';

        itemMeta =
            [
                archiveFileTypeLabel(
                    file
                ),

                file.size
            || ''
            ]
                .filter(Boolean)
                .join(' · ');
    }
    else
    {
        itemName =
            `${files.length} files`;

        itemMeta =
            'Selected files';
    }

    return `
        <div
          class="
            archive-move-item-summary
          ">

          <span
            class="
              archive-move-context-label
            ">

            ${movingFolder ? 'Folder to move' : files.length === 1 ? 'File to move' : 'Files to move'}
          </span>

          <div
            class="
              archive-move-item-row
            ">

            <span
              class="
                archive-move-item-icon
              "
              aria-hidden="true">

              ${itemIcon}
            </span>

            <span
              class="
                archive-move-item-copy
              ">

              <strong>
                ${escapeHtml(
                    itemName
                )}
              </strong>

              ${
                    itemMeta
                        ? `
                    <span>
                      ${escapeHtml(
                            itemMeta
                        )}
                    </span>
                  `
                        : ''
                }
            </span>


          </div>
        </div>
      `;
}

function archiveMoveSelectionStats({
    movingFolder,
    files,
    selectedId
})
{
    if (
        !archiveMoveHasDestination(
            selectedId
        )
    )
    {
        return {
            canMove:
            false,

            movableFiles:
            [],

            movableCount:
            0,

            alreadyThere:
            0
        };
    }

    if (movingFolder)
    {
        const currentParentId =
            archiveFolderParentId(
                movingFolder
            );

        const canMove =
            currentParentId
            !== selectedId;

        return {
            canMove,

            movableFiles:
            [],

            movableCount:
            canMove
                ? 1
                : 0,

            alreadyThere:
            canMove
                ? 0
                : 1
        };
    }

    const movableFiles =
        files.filter(file =>
            archiveFileFolderId(
                file
            ) !== selectedId
        );

    return {
        canMove:
          movableFiles.length > 0,

        movableFiles,

        movableCount:
          movableFiles.length,

        alreadyThere:
          files.length
          - movableFiles.length
    };
}

function archiveMoveHighlightMatch(
    label,
    query
)
{
    const normalizedLabel =
        String(
            label || ''
        );

    const normalizedQuery =
        String(
            query || ''
        )
            .trim();

    if (!normalizedQuery)
    {
        return escapeHtml(
            normalizedLabel
        );
    }

    const index =
        normalizedLabel
            .toLowerCase()
            .indexOf(
                normalizedQuery
                    .toLowerCase()
            );

    if (index < 0)
    {
        return escapeHtml(
            normalizedLabel
        );
    }

    const before =
        normalizedLabel.slice(
            0,
            index
        );

    const match =
        normalizedLabel.slice(
            index,
            index
            + normalizedQuery.length
        );

    const after =
        normalizedLabel.slice(
            index
            + normalizedQuery.length
        );

    return `
        ${escapeHtml(
            before
        )}<mark>${escapeHtml(
            match
        )}</mark>${escapeHtml(
            after
        )}
      `;
}

function renderArchiveMoveSelectedMark()
{
    return `
        <span
          class="
            archive-move-selected-mark
          "
          aria-hidden="true">

          ${icon.check}
        </span>
      `;
}

function renderArchiveMoveTreeFolderRows({
    parentId,
    depth,
    selectedId,
    expandedIds,
    movingFolderId,
    currentFolderState
})
{
    return archiveFolderChildren(
        parentId
    )
        .map(folder =>
        {
            const isMovingFolder =
                folder.id
              === movingFolderId;

            const isCurrentFolder =
                Boolean(
                    currentFolderState
                        ?.hasCurrentFolder
              && folder.id
                === currentFolderState
                    .folderId
                );

            const children =
                archiveFolderChildren(
                    folder.id
                );

            const hasChildren =
                children.length > 0;

            const expanded =
                expandedIds.has(
                    folder.id
                );

            const selected =
                archiveMoveHasDestination(
                    selectedId
                )
            && selectedId
              === folder.id;

            return `
            <div
              class="
                archive-move-tree-row
              "
              style="
                --archive-move-depth:
                  ${depth};
              ">

              ${
                    hasChildren
                && !isMovingFolder
                        ? `
                    <button
                      class="
                        archive-move-tree-toggle
                        ${
                            expanded
                                ? 'is-expanded'
                                : ''
                        }
                      "
                      type="button"
                      data-archive-move-toggle="${escapeHtml(
                            folder.id
                        )}"
                      aria-label="${
                            expanded
                                ? 'Collapse'
                                : 'Expand'
                        } ${escapeHtml(
                            folder.name
                        )}"
                      aria-expanded="${String(
                            expanded
                        )}">

                      ${icon.chevron}
                    </button>
                  `
                        : `
                    <span
                      class="
                        archive-move-tree-toggle
                        is-placeholder
                      "
                      aria-hidden="true">
                    </span>
                  `
                }

              <button
                class="
                  archive-move-tree-main

                  ${
                        selected
                            ? 'is-selected'
                            : ''
                    }

                  ${
                        isCurrentFolder
                            ? 'is-current-folder'
                            : ''
                    }
                "
                type="button"
                data-archive-move-select="${escapeHtml(
                    folder.id
                )}"
                aria-pressed="${String(
                    selected
                )}"
                ${
                    isCurrentFolder
                        ? 'disabled aria-disabled="true"'
                        : ''
                }>

                ${icon.folderyellow}

                <span
                  class="
                    archive-move-folder-copy
                  ">

                  <strong>
                    ${escapeHtml(
                        folder.name
                    )}
                  </strong>

                  ${
                        isCurrentFolder
                            ? `
                        <span>
                          ${escapeHtml(t(movingFolderId ? 'Cannot move a folder into itself' : 'Already in this folder'))}
                        </span>
                      `
                            : ''
                    }
                </span>

                ${
                    selected
                        ? renderArchiveMoveSelectedMark()
                        : ''
                }
              </button>
            </div>

            ${
                hasChildren
              && expanded
              && !isMovingFolder
                    ? renderArchiveMoveTreeFolderRows({
                        parentId:
                      folder.id,

                        depth:
                      depth + 1,

                        selectedId,

                        expandedIds,

                        movingFolderId,

                        currentFolderState
                    })
                    : ''
            }
          `;
        })
        .join('');
}

function renderArchiveMoveTree({
    selectedId,
    expandedIds,
    movingFolderId,
    currentFolderState
})
{
    const rootExpanded =
        expandedIds.has(
            null
        );

    const rootCurrent =
        Boolean(
            currentFolderState
                ?.hasCurrentFolder
          && archiveIsRootLocation(
              currentFolderState
                  .folderId
          )
        );

    const rootSelected =
        archiveMoveHasDestination(
            selectedId
        )
        && archiveIsRootLocation(
            selectedId
        );

    const rootHasChildren =
        archiveFolderChildren(
            null
        ).length > 0;

    return `
        <div
          class="
            archive-move-tree
          ">

          <div
            class="
              archive-move-tree-row
            "
            style="
              --archive-move-depth:
                0;
            ">

            ${
                rootHasChildren
                    ? `
                  <button
                    class="
                      archive-move-tree-toggle
                      ${
                            rootExpanded
                                ? 'is-expanded'
                                : ''
                        }
                    "
                    type="button"
                    data-archive-move-toggle="${ARCHIVE_ROOT_PICKER_VALUE}"
                    aria-label="${
                        rootExpanded
                            ? `Collapse ${ARCHIVE_ROOT_LABEL}`
                            : `Expand ${ARCHIVE_ROOT_LABEL}`
                    }"
                    aria-expanded="${String(
                        rootExpanded
                    )}">

                    ${icon.chevron}
                  </button>
                `
                    : `
                  <span
                    class="
                      archive-move-tree-toggle
                      is-placeholder
                    "
                    aria-hidden="true">
                  </span>
                `
            }

            <button
              class="
                archive-move-tree-main

                ${
                    rootSelected
                        ? 'is-selected'
                        : ''
                }

                ${
                    rootCurrent
                        ? 'is-current-folder'
                        : ''
                }
              "
              type="button"
              data-archive-move-select="${ARCHIVE_ROOT_PICKER_VALUE}"
              aria-pressed="${String(
                    rootSelected
                )}"
              ${
                    rootCurrent
                        ? 'disabled aria-disabled="true"'
                        : ''
                }>

              ${icon.folderyellow}

              <span
                class="
                  archive-move-folder-copy
                ">

                <strong>
                  ${ARCHIVE_ROOT_LABEL}
                </strong>

                <span>
                  ${
                        rootCurrent
                            ? t(movingFolderId ? 'Cannot move a folder into itself' : 'Already in this folder')
                            : 'Top level'
                    }
                </span>
              </span>

              ${
                    rootSelected
                        ? renderArchiveMoveSelectedMark()
                        : ''
                }
            </button>
          </div>

          ${
                rootExpanded
                    ? renderArchiveMoveTreeFolderRows({
                        parentId:
                    null,

                        depth:
                    1,

                        selectedId,

                        expandedIds,

                        movingFolderId,

                        currentFolderState
                    })
                    : ''
            }
        </div>
      `;
}

function renderArchiveMoveSearchResults({
    query,
    selectedId,
    movingFolder,
    currentFolderState
})
{
    const normalizedQuery =
        String(
            query || ''
        )
            .trim()
            .toLowerCase();

    const blockedDescendantIds =
        new Set(
            movingFolder
                ? archiveFolderDescendantIds(
                    movingFolder.id,
                    {
                        includeSelf:
                    false
                    }
                )
                : []
        );

    const rootMatches =
        `${ARCHIVE_ROOT_LABEL} files top level`
            .toLowerCase()
            .includes(
                normalizedQuery
            );

    const rootCurrent =
        Boolean(
            currentFolderState
                ?.hasCurrentFolder
          && archiveIsRootLocation(
              currentFolderState
                  .folderId
          )
        );

    const rootSelected =
        archiveMoveHasDestination(
            selectedId
        )
        && archiveIsRootLocation(
            selectedId
        );

    const folders =
        archiveFlattenFolders()
            .map(item =>
                item.folder
            )
            .filter(folder =>
                !blockedDescendantIds.has(
                    folder.id
                )
            && String(
                folder.name || ''
            )
                .toLowerCase()
                .includes(
                    normalizedQuery
                )
            );

    if (
        !rootMatches
        && !folders.length
    )
    {
        return `
          <div
            class="
              archive-move-empty
            ">

            No folders match “${escapeHtml(
                query
            )}”.
          </div>
        `;
    }

    return `
        <div
          class="
            archive-move-search-results
          ">

          ${
                rootMatches
                    ? `
                <button
                  class="
                    archive-move-search-result

                    ${
                        rootSelected
                            ? 'is-selected'
                            : ''
                    }

                    ${
                        rootCurrent
                            ? 'is-current-folder'
                            : ''
                    }
                  "
                  type="button"
                  data-archive-move-select="${ARCHIVE_ROOT_PICKER_VALUE}"
                  aria-pressed="${String(
                        rootSelected
                    )}"
                  ${
                        rootCurrent
                            ? 'disabled aria-disabled="true"'
                            : ''
                    }>

                  ${icon.folderyellow}

                  <span
                    class="
                      archive-move-folder-copy
                    ">

                    <strong>
                      ${archiveMoveHighlightMatch(
                            ARCHIVE_ROOT_LABEL,
                            query
                        )}
                    </strong>

                    <span>
                      ${
                            rootCurrent
                                ? t(movingFolder ? 'Cannot move a folder into itself' : 'Already in this folder')
                                : 'Top level'
                        }
                    </span>
                  </span>

                  ${
                        rootSelected
                            ? renderArchiveMoveSelectedMark()
                            : ''
                    }
                </button>
              `
                    : ''
            }

          ${folders
                .map(folder =>
                {
                    const isCurrentFolder =
                        Boolean(
                            currentFolderState
                                ?.hasCurrentFolder
                  && folder.id
                    === currentFolderState
                        .folderId
                        );

                    const selected =
                        archiveMoveHasDestination(
                            selectedId
                        )
                && selectedId
                  === folder.id;

                    return `
                <button
                  class="
                    archive-move-search-result

                    ${
                        selected
                            ? 'is-selected'
                            : ''
                    }

                    ${
                        isCurrentFolder
                            ? 'is-current-folder'
                            : ''
                    }
                  "
                  type="button"
                  data-archive-move-select="${escapeHtml(
                        folder.id
                    )}"
                  aria-pressed="${String(
                        selected
                    )}"
                  ${
                        isCurrentFolder
                            ? 'disabled aria-disabled="true"'
                            : ''
                    }>

                  ${icon.folderyellow}

                  <span
                    class="
                      archive-move-folder-copy
                    ">

                    <strong>
                      ${archiveMoveHighlightMatch(
                            folder.name,
                            query
                        )}
                    </strong>

                    <span>
                      ${
                            isCurrentFolder
                                ? t(movingFolder ? 'Cannot move a folder into itself' : 'Already in this folder')
                                : escapeHtml(
                                    archiveMoveFolderPath(
                                        archiveFolderParentId(
                                            folder
                                        )
                                    )
                                )
                        }
                    </span>
                  </span>

                  ${
                        selected
                            ? renderArchiveMoveSelectedMark()
                            : ''
                    }
                </button>
              `;
                })
                .join('')}
        </div>
      `;
}

function renderArchiveMovePicker({
    query,
    selectedId,
    expandedIds,
    movingFolder,
    currentFolderState
})
{
    return `
        <div
          class="
            archive-move-picker
            rp-content
          "
          data-archive-move-picker>

          ${
                String(
                    query || ''
                ).trim()
                    ? renderArchiveMoveSearchResults({
                        query,
                        selectedId,
                        movingFolder,
                        currentFolderState
                    })
                    : renderArchiveMoveTree({
                        selectedId,
                        expandedIds,

                        movingFolderId:
                    movingFolder?.id
                    || '',

                        currentFolderState
                    })
            }
        </div>
      `;
}

function openArchiveMoveModal({
    fileIds = [],
    folderId = ''
} = {})
{
    const movingFolder =
        folderId
            ? archiveFolderById(
                folderId
            )
            : null;

    const files =
        [
            ...new Set(
                fileIds
            )
        ]
            .map(id =>
                archiveFileById(
                    id
                )
            )
            .filter(Boolean);

    if (
        !movingFolder
        && !files.length
    )
    {
        return;
    }

    const currentFolderState =
        archiveMoveCurrentFolderState({
            movingFolder,
            files
        });

    let selectedId =
        ARCHIVE_MOVE_NO_DESTINATION;

    let query =
        '';

    let searchExpanded =
        false;

    let creatingFolder =
        false;

    const expandedIds =
        new Set([
            null
        ]);

    const revealFolderId =
        archiveMoveInitialRevealFolderId({
            movingFolder,
            files,
            currentFolderState
        });

    archiveFolderAncestors(
        revealFolderId
    ).forEach(folder =>
    {
        expandedIds.add(
            folder.id
        );
    });

    if (revealFolderId)
    {
        expandedIds.add(
            revealFolderId
        );
    }

    const title =
        movingFolder
            ? 'Move folder'
            : files.length === 1
                ? 'Move file'
                : `Move ${files.length} files`;

    openModal(`
        <div
          class="
            modal
            archive-move-modal
            resource-picker
          "
          role="dialog"
          aria-modal="true"
          aria-labelledby="archiveMoveTitle">

          <div class="modal-header">
            <div>
              <h2
                id="archiveMoveTitle">

                ${escapeHtml(
                    title
                )}
              </h2>

              <p>
                Choose a destination folder.
              </p>
            </div>

            <button
              class="close-button"
              type="button"
              data-close
              aria-label="Close">

              ${icon.close}
            </button>
          </div>

          <div
            class="
              modal-body
            ">

            ${renderArchiveMoveItemSummary({
                movingFolder,
                files
            })}

            <div
              class="
                archive-move-content
              "
              data-archive-move-content>
            </div>
          </div>

          <div
            class="
              modal-footer
            "
            data-archive-move-footer>
          </div>
        </div>
      `);

    const modal =
        modalBackdrop.querySelector(
            '.archive-move-modal'
        );

    const contentRoot =
        modal?.querySelector(
            '[data-archive-move-content]'
        );

    const footerRoot =
        modal?.querySelector(
            '[data-archive-move-footer]'
        );

    const getNewFolderParentId =
        () =>
            archiveMoveNewFolderParentId({
                movingFolder,
                selectedId,
                currentFolderState
            });

    const renderMoveContent =
        ({
            focusSearch =
                false,

            focusFolderName =
                false
        } = {}) =>
        {
            const stats =
                archiveMoveSelectionStats({
                    movingFolder,
                    files,
                    selectedId
                });

            const hasDestination =
                archiveMoveHasDestination(
                    selectedId
                );

            const breadcrumbs = hasDestination
                ? [
                    { id: ARCHIVE_ROOT_PICKER_VALUE, name: t('All files') },
                    ...archiveFolderAncestors(selectedId).map(folder => ({ id: folder.id, name: folder.name }))
                ]
                : [{ id: ARCHIVE_ROOT_PICKER_VALUE, name: t('Choose a folder') }];
            const currentCrumb = breadcrumbs.at(-1);
            const fullPath = breadcrumbs.map(crumb => crumb.name).join(' / ');

            const newFolderParentId =
                getNewFolderParentId();

            const newFolderParentPath =
                archiveMoveFolderPath(
                    newFolderParentId
                );

            if (contentRoot)
            {
                contentRoot.innerHTML = `
              <div class="archive-create-folder-path-row">
                <div class="archive-create-folder-path-context">
                  <span class="archive-create-folder-path-label">${escapeHtml(t('Destination'))}</span>
                  <nav class="rp-path archive-folder-path" aria-label="${escapeHtml(t('Destination'))}" aria-live="polite">
                    <span class="rp-path-icon" aria-hidden="true">${icon.folderyellow}</span>
                    ${breadcrumbs.slice(0, -1).map((crumb, index) => `<button class="${index ? 'archive-folder-crumb-intermediate' : ''}" type="button" data-archive-move-crumb="${escapeHtml(crumb.id)}" title="${escapeHtml(crumb.name)}">${escapeHtml(crumb.name)}</button><span class="${index ? 'archive-folder-crumb-intermediate' : ''}" aria-hidden="true">${icon.chevron}</span>`).join('')}
                    <span aria-current="page" class="${hasDestination ? '' : 'is-placeholder'}" title="${escapeHtml(fullPath)}">${escapeHtml(currentCrumb.name)}</span>
                  </nav>
                </div>
                <div class="archive-folder-inline-search ${searchExpanded ? 'is-expanded' : ''}">
                  <button type="button" class="icon-button" data-archive-move-search-toggle
                    aria-label="${escapeHtml(t(searchExpanded ? 'Close search' : 'Search folders'))}" aria-expanded="${searchExpanded}" aria-controls="archiveMoveSearch" title="${escapeHtml(t(searchExpanded ? 'Close search' : 'Search folders'))}">${icon.search}</button>
                  <input id="archiveMoveSearch" type="search" data-archive-move-search
                    aria-label="${escapeHtml(t('Search folders'))}" placeholder="${escapeHtml(t('Search folders'))}" value="${escapeHtml(query)}" ${searchExpanded ? '' : 'hidden'}>
                </div>
                <button class="button secondary archive-move-item-action" type="button"
                  data-archive-move-new-folder aria-label="Create a new destination folder">
                  ${icon.plus}<span>New folder</span>
                </button>
              </div>
              ${
                    creatingFolder
                        ? `
                    <form
                      class="
                        archive-move-new-folder-form
                      "
                      data-archive-move-new-folder-form>

                      <div
                        class="
                          archive-move-new-folder-context
                        ">

                        <span>
                          Create inside
                        </span>

                        <strong>
                          ${escapeHtml(
                                newFolderParentPath
                            )}
                        </strong>
                      </div>

                      <div
                        class="
                          archive-move-new-folder-fields
                        ">

                        <input
                          data-archive-move-new-folder-name
                          required
                          maxlength="160"
                          placeholder="Folder name">

                        <button
                          class="
                            button
                            secondary
                          "
                          type="button"
                          data-archive-move-cancel-new-folder>

                          Cancel
                        </button>

                        <button
                          class="
                            button
                            primary
                          "
                          type="submit">

                          Create
                        </button>
                      </div>
                    </form>
                  `
                        : ''
                }

              ${renderArchiveMovePicker({
                    query,
                    selectedId,
                    expandedIds,
                    movingFolder,
                    currentFolderState
                })}
            `;
            }

            if (footerRoot)
            {
                const buttonLabel =
                    !archiveMoveHasDestination(selectedId)
              || movingFolder
              || files.length === 1
                        ? 'Move here'
                        : `Move ${stats.movableCount} files`;

                footerRoot.innerHTML = `
              <button
                class="button secondary"
                type="button"
                data-close>
                Cancel
              </button>

              <button
                class="button primary"
                type="button"
                data-archive-move-confirm
                ${stats.canMove ? '' : 'disabled aria-disabled="true"'}>
                ${escapeHtml(buttonLabel)}
              </button>
            `;

                // The footer is recreated on every render, so bind its new button.
                footerRoot
                    .querySelector('[data-close]')
                    ?.addEventListener('click', closeModal);
            }

            // Translate after both the folder picker and footer have been rendered.
            localizeUI(modal, {
                suppressObserverReplay: true
            });

            requestAnimationFrame(
                () =>
                {
                    if (focusSearch)
                    {
                        const searchInput =
                            modal?.querySelector(
                                '[data-archive-move-search]'
                            );

                        searchInput?.focus();

                        const end =
                            searchInput?.value
                                .length
                  || 0;

                        searchInput?.setSelectionRange(
                            end,
                            end
                        );
                    }

                    if (focusFolderName)
                    {
                        modal
                            ?.querySelector(
                                '[data-archive-move-new-folder-name]'
                            )
                            ?.focus();
                    }
                }
            );
        };

    const commitMove =
        () =>
        {
            if (
                !archiveMoveHasDestination(
                    selectedId
                )
            )
            {
                return;
            }
            if (
                selectedId
            && !archiveFolderById(
                selectedId
            )
            )
            {
                return;
            }

            const stats =
                archiveMoveSelectionStats({
                    movingFolder,
                    files,
                    selectedId
                });

            if (!stats.canMove)
            {
                return;
            }

            const destinationPath =
                archiveMoveFolderPath(
                    selectedId
                );

            const now =
                new Date()
                    .toISOString();

            const folderSnapshot =
                movingFolder
                    ? {
                        id:
                    movingFolder.id,

                        parentId:
                    archiveFolderParentId(
                        movingFolder
                    ),

                        updatedAt:
                    movingFolder.updatedAt
                    }
                    : null;

            const fileSnapshots =
                stats.movableFiles
                    .map(file => ({
                        id:
                  file.id,

                        folderId:
                  archiveFileFolderId(
                      file
                  ),

                        updatedAt:
                  file.updatedAt,

                        updated:
                  file.updated
                    }));

            if (movingFolder)
            {
                movingFolder.parentId =
                    selectedId;

                movingFolder.updatedAt =
                    now;

                if (selectedId)
                {
                    state.archiveExpandedFolders[
                        selectedId
                    ] = true;
                }
            }
            else
            {
                stats.movableFiles
                    .forEach(file =>
                    {
                        file.folderId =
                            selectedId;

                        file.updatedAt =
                            now;

                        file.updated =
                            'Just now';
                    });

                state.archiveSelectedFileIds =
                    [];

                if (
                    stats.movableFiles
                        .some(file =>
                            file.id
                    === state.archiveSelectedFileId
                        )
                )
                {
                    state.archiveSelectedFileId =
                        null;
                }
            }

            const movedCount =
                movingFolder
                    ? 1
                    : stats.movableCount;

            const movedMessage =
                movingFolder
                    ? `${
                        movingFolder.name
                  || 'Folder'
                    } moved to ${destinationPath}.`
                    : movedCount === 1
                        ? `${
                            stats.movableFiles[0]
                                ?.name
                    || 'File'
                        } moved to ${destinationPath}.`
                        : `${movedCount} files moved to ${destinationPath}.`;

            const openFolderId =
                movingFolder
                    ? movingFolder.id
                    : selectedId;

            closeModal();
            renderArchive();

            showActionToast({
                message:
              movedMessage,

                actions: [
                    {
                        label:
                  'Undo',

                        onClick:
                  () =>
                  {
                      if (folderSnapshot)
                      {
                          const folder =
                              archiveFolderById(
                                  folderSnapshot.id
                              );

                          if (folder)
                          {
                              folder.parentId =
                                  folderSnapshot.parentId;

                              folder.updatedAt =
                                  folderSnapshot.updatedAt;
                          }
                      }

                      fileSnapshots
                          .forEach(snapshot =>
                          {
                              const file =
                                  archiveFileById(
                                      snapshot.id
                                  );

                              if (!file)
                              {
                                  return;
                              }

                              file.folderId =
                                  snapshot.folderId;

                              file.updatedAt =
                                  snapshot.updatedAt;

                              file.updated =
                                  snapshot.updated;
                          });

                      renderArchive();

                      showToast(
                          'Move undone.'
                      );
                  }
                    },

                    {
                        label:
                  'Open folder',

                        onClick:
                  () =>
                  {
                      archiveNavigateToLocation(
                          {
                              view:
                          'files',

                              folderId:
                          openFolderId,

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
                          },
                          {
                              expandCurrent:
                          true
                          }
                      );
                  }
                    }
                ]
            });
        };

    modal?.addEventListener(
        'input',
        event =>
        {
            const searchInput =
                event.target.closest(
                    '[data-archive-move-search]'
                );

            if (!searchInput)
            {
                return;
            }

            query =
                searchInput.value;

            renderMoveContent({
                focusSearch:
              true
            });
        }
    );

    modal?.addEventListener(
        'submit',
        event =>
        {
            const form =
                event.target.closest(
                    '[data-archive-move-new-folder-form]'
                );

            if (!form)
            {
                return;
            }

            event.preventDefault();

            const name =
                form
                    .querySelector(
                        '[data-archive-move-new-folder-name]'
                    )
                    ?.value
                    .trim()
            || '';

            const parentId =
                getNewFolderParentId();

            const folder =
                createArchiveFolderRecord(
                    name,
                    parentId
                );

            if (!folder)
            {
                form
                    .querySelector(
                        '[data-archive-move-new-folder-name]'
                    )
                    ?.focus();

                return;
            }

            expandedIds.add(
                parentId
            );

            selectedId =
                folder.id;

            query =
                '';

            creatingFolder =
                false;

            renderMoveContent();
        }
    );

    modal?.addEventListener(
        'click',
        event =>
        {
            const searchToggle = event.target.closest('[data-archive-move-search-toggle]');
            if (searchToggle)
            {
                searchExpanded = !searchExpanded;
                if (!searchExpanded) query = '';
                renderMoveContent({ focusSearch: searchExpanded });
                if (!searchExpanded)
                {
                    requestAnimationFrame(() => modal?.querySelector('[data-archive-move-search-toggle]')?.focus());
                }
                return;
            }

            const crumb = event.target.closest('[data-archive-move-crumb]');
            if (crumb)
            {
                const nextId = archiveFolderIdFromChoice(crumb.dataset.archiveMoveCrumb);
                const blocked = movingFolder
                    && archiveFolderDescendantIds(movingFolder.id).includes(nextId);
                if (blocked || !archiveMoveSelectionStats({ movingFolder, files, selectedId: nextId }).canMove) return;
                selectedId = nextId;
                query = '';
                searchExpanded = false;
                renderMoveContent();
                return;
            }

            const toggle =
                event.target.closest(
                    '[data-archive-move-toggle]'
                );

            if (toggle)
            {
                const folderId =
                    archiveFolderIdFromChoice(
                        toggle.dataset
                            .archiveMoveToggle
                    );

                if (
                    expandedIds.has(
                        folderId
                    )
                )
                {
                    expandedIds.delete(
                        folderId
                    );
                }
                else
                {
                    expandedIds.add(
                        folderId
                    );
                }

                renderMoveContent();

                return;
            }

            const destination =
                event.target.closest(
                    '[data-archive-move-select]'
                );

            if (destination)
            {
                if (
                    destination.disabled
              || destination.getAttribute(
                  'aria-disabled'
              ) === 'true'
                )
                {
                    return;
                }

                selectedId =
                    archiveFolderIdFromChoice(
                        destination.dataset
                            .archiveMoveSelect
                    );

                renderMoveContent();

                return;
            }

            if (
                event.target.closest(
                    '[data-archive-move-new-folder]'
                )
            )
            {
                if (
                    creatingFolder
                )
                {
                    modal
                        ?.querySelector(
                            '[data-archive-move-new-folder-name]'
                        )
                        ?.focus();

                    return;
                }

                creatingFolder =
                    true;

                renderMoveContent({
                    focusFolderName:
                true
                });

                return;
            }

            if (
                event.target.closest(
                    '[data-archive-move-cancel-new-folder]'
                )
            )
            {
                creatingFolder =
                    false;

                renderMoveContent();

                return;
            }

            if (
                event.target.closest(
                    '[data-archive-move-confirm]'
                )
            )
            {
                commitMove();
            }
        }
    );

    renderMoveContent();
}

function archiveFilesForLinkAction(
    fileIds
)
{
    const files =
        archiveUniqueIds(
            fileIds
        )
            .map(id =>
                archiveFileById(
                    id
                )
            )
            .filter(Boolean);

    if (!files.length)
    {
        return [];
    }

    const projectId =
        files[0].projectId
        || currentProjectId();

    return files.filter(file =>
        (
            file.projectId
          || currentProjectId()
        ) === projectId
    );
}

function archiveCommonFileConnectionIds(
    files,
    entityType
)
{
    if (!files.length)
    {
        return [];
    }

    const remainingSets =
        files
            .slice(1)
            .map(file =>
                new Set(
                    archiveConnectionIds(
                        'file',
                        file.id,
                        entityType
                    )
                )
            );

    return archiveUniqueIds(
        archiveConnectionIds(
            'file',
            files[0].id,
            entityType
        )
    ).filter(recordId =>
        remainingSets.every(set =>
            set.has(
                recordId
            )
        )
    );
}

function archiveCommitFileConnections({
    fileIds =
        [],

    entityType =
        '',

    recordIds =
        []
} = {})
{
    const normalizedFileIds =
        archiveUniqueIds(
            fileIds
        );

    const normalizedRecordIds =
        archiveUniqueIds(
            recordIds
        );

    const result = {
        ok:
          false,

        fileCount:
          normalizedFileIds.length,

        recordCount:
          normalizedRecordIds.length,

        changedFileCount:
          0,

        addedLinkCount:
          0,

        failedWrites:
          []
    };

    if (
        !normalizedFileIds.length
        || !normalizedRecordIds.length
    )
    {
        return result;
    }

    if (
        entityType === 'place'
        && normalizedRecordIds.length > 1
    )
    {
        result.failedWrites.push({
            fileId: '',
            recordId: '',
            reason: 'Archive files support one place'
        });

        return result;
    }

    const files =
        normalizedFileIds.map(fileId =>
            archiveFileById(fileId)
        );

    const records =
        normalizedRecordIds.map(recordId =>
            archiveConnectionRecord(
                entityType,
                recordId
            )
        );

    files.forEach((file, index) =>
    {
        if (!file)
        {
            result.failedWrites.push({
                fileId:
              normalizedFileIds[index],

                recordId: '',
                reason: 'File not found'
            });
        }
    });

    records.forEach((record, index) =>
    {
        if (!record)
        {
            result.failedWrites.push({
                fileId: '',
                recordId:
              normalizedRecordIds[index],

                reason: 'Linked record not found'
            });
        }
    });

    files.filter(Boolean).forEach(file =>
    {
        records.filter(Boolean).forEach(record =>
        {
            if (
                file.projectId
            && record.projectId
            && file.projectId
              !== record.projectId
            )
            {
                result.failedWrites.push({
                    fileId:
                file.id,

                    recordId:
                record.id,

                    reason:
                'Records belong to different projects'
                });
            }
        });
    });

    if (result.failedWrites.length)
    {
        console.warn(
            '[Archive bulk links]',
            result.failedWrites
        );

        return result;
    }

    const writes =
        files.flatMap(file =>
            normalizedRecordIds
                .filter(recordId =>
                    !archiveConnectionIds(
                        'file',
                        file.id,
                        entityType
                    ).includes(recordId)
                )
                .map(recordId => ({
                    ownerType: 'file',
                    ownerId: file.id,
                    entityType,
                    entityId: recordId,
                    shouldLink: true
                }))
        );

    if (!writes.length)
    {
        return result;
    }

    const committed =
        archiveSetConnectionsAtomically(
            writes
        );

    if (!committed.ok)
    {
        result.failedWrites.push({
            fileId: '',
            recordId: '',
            reason: 'Relationships were not written'
        });

        console.warn(
            '[Archive bulk links]',
            result.failedWrites
        );

        return result;
    }

    result.addedLinkCount =
        committed.changedCount;

    result.changedFileCount =
        new Set(
            writes.map(write =>
                write.ownerId
            )
        ).size;

    result.ok =
        result.addedLinkCount > 0;

    if (
        result.failedWrites.length
    )
    {
        console.warn(
            '[Archive bulk links]',
            result.failedWrites
        );
    }

    return result;
}

function archiveBulkLinkSubtitle(
    files
)
{
    if (
        files.length === 1
    )
    {
        return files[0].name
          || 'Untitled file';
    }

    return `${files.length} selected files`;
}

function finishArchiveBulkLinkAction(
    fileIds
)
{
    const normalizedFileIds =
        archiveUniqueIds(
            fileIds
        );

    const firstFile =
        normalizedFileIds
            .map(fileId =>
                archiveFileById(
                    fileId
                )
            )
            .find(Boolean);

    state.archiveSelectedFileIds =
        [];

    state.archiveSelectedFileId =
        firstFile?.id
        || state.archiveSelectedFileId;

    state.archiveInspectorCollapsed =
        false;

    renderArchive();
}

function openArchiveFilesNoteModal(
    fileIds
)
{
    if (archiveUniqueIds(fileIds).length > 1)
        return rpOpenArchiveResourcePicker({ ownerType: 'file', ownerIds: fileIds, entityType: 'note' });
    const files =
        archiveFilesForLinkAction(
            fileIds
        );

    const ids =
        files.map(file =>
            file.id
        );

    if (!files.length)
    {
        return;
    }

    const singleFile =
        files.length === 1
            ? files[0]
            : null;

    const existingNoteIds =
        singleFile
            ? archiveNoteIdsForFile(
                singleFile
            )
            : archiveCommonFileConnectionIds(
                files,
                'note'
            );

    openNoteLinkPickerModal({
        projectId:
          files[0].projectId
          || currentProjectId(),

        autoFocusSearch:
          false,

        title:
          singleFile
              ? 'Add note'
              : 'Add notes',

        description:
          singleFile
              ? `Link existing notes to “${
                  singleFile.name
                || 'this file'
              }”.`
              : `Link existing notes to ${
                  files.length
              } selected files.`,

        existingNoteIds,

        includeArchived:
          false,

        existingStatus:
          'Already linked',

        existingMetaLabel:
          singleFile
              ? 'already linked'
              : 'linked to all selected files',

        createLabel:
          'Create linked note',

        /*
          Creating a Note from an Archive context
          currently accepts one owner only. Preserve
          it for one file and hide it in bulk mode.
        */
        onCreate:
          singleFile
              ? () =>
                  openNewNoteForContext(
                      'archiveFile',
                      singleFile.id
                  )
              : null,

        onSave:
          (selectedNoteIds, context) =>
          {
              if (context?.changes) return rpCommitArchivePickerChanges('file', ids, 'note', selectedNoteIds, context);
              if (singleFile)
              {
                  const currentFile =
                      archiveFileById(
                          singleFile.id
                      );

                  if (!currentFile)
                  {
                      return false;
                  }

                  const result =
                      archiveCommitFileConnections({
                          fileIds: [
                              currentFile.id
                          ],

                          entityType:
                    'note',

                          recordIds:
                    selectedNoteIds
                      });

                  return result.ok
                      ? result
                      : false;
              }

              const result =
                  archiveCommitFileConnections({
                      fileIds:
                  ids,

                      entityType:
                  'note',

                      recordIds:
                  selectedNoteIds
                  });

              if (!result.ok)
              {
                  showToast(
                      'No notes were linked.'
                  );

                  return false;
              }

              return result;
          },

        afterSave:
          singleFile
              ? renderArchive
              : () =>
              {
                  finishArchiveBulkLinkAction(
                      ids
                  );
              },

        successMessage:
          singleFile
              ? count =>
                  `${count} ${
                      count === 1
                          ? 'note was'
                          : 'notes were'
                  } linked to the file.`
              : count =>
                  `${count} ${
                      count === 1
                          ? 'link was'
                          : 'links were'
                  } added to ${files.length} files.`
    });
}

function openArchiveFileNoteModal(
    fileId
)
{
    openArchiveFilesNoteModal(
        [
            fileId
        ]
    );
}

function openArchiveFilePlacesModal(fileId, query = '', resolveLegacy = false)
{
    const file = archiveFileById(fileId);
    if (!file) return;
    openNotesPlacesModal({
        query,
        linkContext: {
            projectId: file.projectId,
            title: 'Add places',
            subtitle: file.name || 'Untitled file',
            initialPlaceIds: archiveFilePlaceIds(file),
            getPlaceIds: () => { const current = archiveFileById(fileId, file.projectId); return current ? archiveFilePlaceIds(current) : []; },
            suggestedPlaceIds: archiveFilePlaceIds(file),
            onSave: (nextPlaceIds, context) => {
                const current = archiveFileById(fileId, file.projectId);
                const next = context?.changes && current
                    ? rpApplyConnectionChanges(archiveFilePlaceIds(current), context) : nextPlaceIds;
                if (!current || !archiveSetFilePlaces(current, next, { resolveLegacy })) {
                    showToast(t('Places could not be updated.'));
                    return false;
                }
                showToast(t('Place links updated.'));
                return true;
            },
            afterSave: renderArchive
        }
    });
}

function openArchiveFilesPlaceModal(
    fileIds
)
{
    if (archiveFilesForLinkAction(fileIds).length)
        return rpOpenArchiveResourcePicker({ ownerType: 'file', ownerIds: fileIds, entityType: 'place' });
    const files =
        archiveFilesForLinkAction(
            fileIds
        );

    if (!files.length)
    {
        return;
    }

    let selectedPlaceId = '';

    let selectedDraft = null;

    openModal(`
        <div
          class="modal notes-related-modal archive-link-picker-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="archivePlacePickerTitle">

          <div class="modal-header">
            <div>
              <h2 id="archivePlacePickerTitle">
                ${escapeHtml(t('Add places to files'))}
              </h2>
              <p>
                ${escapeHtml(t('Choose or create a place. Existing file places will stay linked.'))}
              </p>
            </div>

            <button
              class="close-button"
              type="button"
              data-close
              aria-label="Close">
              ${icon.close}
            </button>
          </div>

          <div class="modal-body form-grid">
            ${renderPlaceCombobox({
                id: 'archiveBulkPlaceInput',
                label: 'Find or create a place',
                value: '',
                selectedPlaceId: '',
                showAddress: false,
                inputAttrs: `data-place-project-id="${escapeHtml(files[0].projectId)}"`
            })}
          </div>

          <div class="modal-footer">
            <span
              class="archive-link-picker-status"
              data-archive-place-status
              aria-live="polite">
            </span>

            <div class="archive-modal-actions">
              <button
                class="button secondary"
                type="button"
                data-close>
                Cancel
              </button>

              <button
                class="button primary"
                type="button"
                data-archive-place-save>
                ${escapeHtml(t('Add place'))}
              </button>
            </div>
          </div>
        </div>
      `);

    const modal =
        modalBackdrop.querySelector(
            '.archive-link-picker-modal'
        );

    const status =
        modal.querySelector(
            '[data-archive-place-status]'
        );

    const save =
        modal.querySelector(
            '[data-archive-place-save]'
        );

    const updateStatus = () =>
    {
        const changedFiles =
            selectedPlaceId
                ? files.filter(file => !archiveFilePlaceIds(file).includes(selectedPlaceId)).length
                : 0;

        status.textContent =
            selectedPlaceId
                ? changedFiles
                    ? `${t('Files to link:')} ${changedFiles}`
                    : t('This place is already linked to every selected file')
                : selectedDraft?.text
                    ? `${t('Files to link:')} ${files.length}`
                    : t('Select a place');

        save.disabled =
            (!selectedPlaceId && !selectedDraft?.text)
          || (selectedPlaceId && changedFiles === 0);
    };

    bindPlaceComboboxes(modal);
    const placeInput = modal.querySelector('#archiveBulkPlaceInput');
    placeInput?.addEventListener('input', () =>
    {
        selectedDraft = readPlaceInputValue('#archiveBulkPlaceInput', modal);
        selectedPlaceId = selectedDraft.selectedPlaceId || '';
        updateStatus();
    });

    save.addEventListener(
        'click',
        () =>
        {
            if (save.disabled)
            {
                return;
            }

            let createdPlace = null;
            if (!selectedPlaceId && selectedDraft?.text)
            {
                const resolved = resolvePlaceAssignment(selectedDraft);
                selectedPlaceId = resolved.placeId;
                if (resolved.created) createdPlace = getPlace(resolved.placeId);
            }
            if (!selectedPlaceId) return;

            const changedFiles =
                files.filter(file =>
                    !archiveFilePlaceIds(file).includes(selectedPlaceId)
                );

            const writes = changedFiles.map(file => ({
                ownerType: 'file', ownerId: file.id,
                entityType: 'place', entityId: selectedPlaceId,
                shouldLink: true
            }));

            const committed =
                archiveSetConnectionsAtomically(
                    writes
                );

            if (!committed.ok)
            {
                if (createdPlace)
                {
                    const index = sampleData.places.indexOf(createdPlace);
                    if (index >= 0) sampleData.places.splice(index, 1);
                }
                showToast(
                    'The place could not be linked to every file.'
                );

                return;
            }

            const changedCount =
                changedFiles.length;

            closeModal();
            finishArchiveBulkLinkAction(
                files.map(file =>
                    file.id
                )
            );

            showToast(`${t('Files linked:')} ${changedCount}`);
        }
    );

    updateStatus();

    requestAnimationFrame(() =>
        modal
            .querySelector(
                '#archiveBulkPlaceInput'
            )
            ?.focus()
    );
}

function openArchiveSourcePeopleModal(
    sourceId
)
{
    const source =
        archiveSourceById(
            sourceId
        );

    if (!source)
    {
        showToast(
            'The source is no longer available.'
        );

        return;
    }

    const projectId =
        source.projectId
        || currentProjectId();

    const initialPersonIds =
        sourceTargetIds(
            source.id,
            'person',
            projectId
        );

    /*
        People connected to files from this source
        receive priority in Suggested people.
        All project people remain searchable.
      */
    const suggestedPersonIds =
        archiveUniqueIds(
            archiveFilesForSource(
                source.id
            ).flatMap(file =>
                file.linkedPersonIds
            || []
            )
        );

    openPeopleLinkModal({
        projectId,

        title:
          'Add people',

        subtitle:
          source.title
          || 'Untitled source',

        initialPersonIds,

        suggestedPersonIds,

        selectedHeading:
          'Linked people',

        saveLabel:
          'Save people',

        onSave:
          nextPersonIds =>
          {
              const currentSource =
                  archiveSourceById(
                      source.id,
                      projectId
                  );

              if (!currentSource)
              {
                  showToast(
                      'The source is no longer available.'
                  );

                  return false;
              }

              const currentIds =
                  new Set(
                      sourceTargetIds(
                          currentSource.id,
                          'person',
                          projectId
                      )
                  );

              const desiredIds =
                  new Set(
                      archiveUniqueIds(
                          nextPersonIds
                      )
                  );

              /*
              Save the entire edited selection:
              remove deselected people and add newly
              selected people in one atomic operation.
            */
              const writes = [
                  ...[...currentIds]
                      .filter(personId =>
                          !desiredIds.has(
                              personId
                          )
                      )
                      .map(personId => ({
                          ownerType:
                    'source',

                          ownerId:
                    currentSource.id,

                          entityType:
                    'person',

                          entityId:
                    personId,

                          shouldLink:
                    false
                      })),

                  ...[...desiredIds]
                      .filter(personId =>
                          !currentIds.has(
                              personId
                          )
                      )
                      .map(personId => ({
                          ownerType:
                    'source',

                          ownerId:
                    currentSource.id,

                          entityType:
                    'person',

                          entityId:
                    personId,

                          shouldLink:
                    true
                      }))
              ];

              const committed =
                  archiveSetConnectionsAtomically(
                      writes
                  );

              if (!committed.ok)
              {
                  showToast(
                      'People links could not be updated.'
                  );

                  return false;
              }

              /*
              Verify that the canonical sourceLinks
              collection now matches the modal state.
            */
              const savedIds =
                  new Set(
                      sourceTargetIds(
                          currentSource.id,
                          'person',
                          projectId
                      )
                  );

              const savedCorrectly =
                  savedIds.size
                === desiredIds.size
              && [...desiredIds].every(
                  personId =>
                      savedIds.has(
                          personId
                      )
              );

              if (!savedCorrectly)
              {
                  showToast(
                      'People links could not be updated.'
                  );

                  return false;
              }

              return committed;
          },

        afterSave:
          renderArchivePreservingSourceInspectorScroll,

        successMessage:
          'Linked people updated.'
    });
}

function openArchiveSourceEventsModal(
    sourceId
)
{
    const source =
        archiveSourceById(
            sourceId
        );

    if (!source)
    {
        showToast(
            'The source is no longer available.'
        );

        return;
    }

    const projectId =
        source.projectId
        || currentProjectId();

    const initiallyLinkedEventIds =
        sourceTargetIds(
            source.id,
            'event',
            projectId
        );

    /*
        People connected directly to the Source
        appear first in the Notes-style person list.
      */
    const primaryPersonIds =
        sourceTargetIds(
            source.id,
            'person',
            projectId
        );

    /*
        People connected through files from this
        Source are useful secondary suggestions.
      */
    const secondaryPersonIds =
        archiveUniqueIds(
            archiveFilesForSource(
                source.id
            ).flatMap(file =>
                file.linkedPersonIds
            || []
            )
        );

    openEventLinkModal({
        projectId,

        autoFocusSearch:
          false,

        title:
          'Add events',

        subtitle:
          source.title
          || 'Untitled source',

        initiallyLinkedEventIds,

        primaryPersonIds,

        secondaryPersonIds,

        alreadyLinkedTarget:
          'this source',

        onSave:
          selectedEventIds =>
          {
              const currentSource =
                  archiveSourceById(
                      source.id,
                      projectId
                  );

              if (!currentSource)
              {
                  showToast(
                      'The source is no longer available.'
                  );

                  return false;
              }

              const currentEventIds =
                  new Set(
                      sourceTargetIds(
                          currentSource.id,
                          'event',
                          projectId
                      )
                  );

              /*
              openEventLinkModal is additive:
              previously linked Events are disabled,
              and selectedEventIds contains new choices.
            */
              const eventIdsToAdd =
                  archiveUniqueIds(
                      selectedEventIds
                  ).filter(eventId =>
                      !currentEventIds.has(
                          eventId
                      )
                  );

              const writes =
                  eventIdsToAdd.map(
                      eventId => ({
                          ownerType:
                    'source',

                          ownerId:
                    currentSource.id,

                          entityType:
                    'event',

                          entityId:
                    eventId,

                          shouldLink:
                    true
                      })
                  );

              const committed =
                  archiveSetConnectionsAtomically(
                      writes
                  );

              if (!committed.ok)
              {
                  showToast(
                      'No events were linked.'
                  );

                  return false;
              }

              /*
              Verify the canonical sourceLinks data,
              including the unlikely case where the
              Source changed while the modal was open.
            */
              const savedEventIds =
                  new Set(
                      sourceTargetIds(
                          currentSource.id,
                          'event',
                          projectId
                      )
                  );

              const savedCorrectly =
                  selectedEventIds.every(
                      eventId =>
                          savedEventIds.has(
                              eventId
                          )
                  );

              if (!savedCorrectly)
              {
                  showToast(
                      'No events were linked.'
                  );

                  return false;
              }

              return {
                  ...committed,

                  addedLinkCount:
                eventIdsToAdd.length
              };
          },

        afterSave:
          renderArchivePreservingSourceInspectorScroll,

        successMessage:
          count =>
              `${count} ${
                  count === 1
                      ? 'event'
                      : 'events'
              } added to source.`
    });
}

function openArchiveSourceNotesModal(
    sourceId
)
{
    const source =
        archiveSourceById(
            sourceId
        );

    if (!source)
    {
        showToast(
            'The source is no longer available.'
        );

        return;
    }

    const projectId =
        source.projectId
        || currentProjectId();

    const existingNoteIds =
        sourceTargetIds(
            source.id,
            'note',
            projectId
        );

    openNoteLinkPickerModal({
        projectId,

        autoFocusSearch:
          false,

        title:
          'Add notes',

        description:
          `Link existing notes to “${
              source.title
            || 'Untitled source'
          }”.`,

        helperText:
          'Linked notes remain available in the Notes module.',

        existingNoteIds,

        includeArchived:
          false,

        existingStatus:
          'Already linked',

        existingMetaLabel:
          'already linked',

        createLabel:
          'Create linked note',

        onCreate:
          () =>
          {
              const currentSource =
                  archiveSourceById(
                      source.id,
                      projectId
                  );

              if (!currentSource)
              {
                  showToast(
                      'The source is no longer available.'
                  );

                  return;
              }

              /*
              Source is already supported by the
              canonical Notes context model.
            */
              openNewNoteForContext(
                  'source',
                  currentSource.id
              );
          },

        onSave:
          (selectedNoteIds, context) =>
          {
              if (context?.changes) return rpCommitArchivePickerChanges('source', [source.id], 'note', selectedNoteIds, context);
              const currentSource =
                  archiveSourceById(
                      source.id,
                      projectId
                  );

              if (!currentSource)
              {
                  showToast(
                      'The source is no longer available.'
                  );

                  return false;
              }

              const currentNoteIds =
                  new Set(
                      sourceTargetIds(
                          currentSource.id,
                          'note',
                          projectId
                      )
                  );

              const noteIdsToAdd =
                  archiveUniqueIds(
                      selectedNoteIds
                  ).filter(noteId =>
                      !currentNoteIds.has(
                          noteId
                      )
                  );

              const writes =
                  noteIdsToAdd.map(
                      noteId => ({
                          ownerType:
                    'source',

                          ownerId:
                    currentSource.id,

                          entityType:
                    'note',

                          entityId:
                    noteId,

                          shouldLink:
                    true
                      })
                  );

              const committed =
                  archiveSetConnectionsAtomically(
                      writes
                  );

              if (!committed.ok)
              {
                  showToast(
                      'No notes were linked.'
                  );

                  return false;
              }

              return {
                  ...committed,

                  addedLinkCount:
                committed.changedCount
              };
          },

        afterSave:
          renderArchivePreservingSourceInspectorScroll,

        successMessage:
          'Notes linked to source.'
    });
}

function openArchiveSourcePhotosModal(
    sourceId
)
{
    const source =
        archiveSourceById(
            sourceId
        );

    if (!source)
    {
        showToast(
            'The source is no longer available.'
        );

        return;
    }

    const projectId =
        source.projectId
        || currentProjectId();

    const initialPhotoIds =
        sourceTargetIds(
            source.id,
            'photo',
            projectId
        );

    openPhotoLinkModal({
        projectId,

        title:
          'Add photos to source',

        description:
          `Selected and uploaded photos will be linked to ${
              source.title
            || 'Untitled source'
          }.`,

        ownerLabel:
          'this source',

        initiallyLinkedPhotoIds:
          initialPhotoIds,

        uploadDraftIdPrefix:
          'source-photo-upload-draft',

        uploadedPhotoIdPrefix:
          `photo-source-${source.id}`,

        onSave:
          (addedIds, context) =>
          {
              if (context?.changes) return rpCommitArchivePickerChanges('source', [source.id], 'photo', addedIds, context);
              const currentSource =
                  archiveSourceById(
                      source.id,
                      projectId
                  );

              if (!currentSource)
              {
                  return false;
              }

              const currentIds =
                  new Set(
                      sourceTargetIds(
                          currentSource.id,
                          'photo',
                          projectId
                      )
                  );

              const photoIdsToAdd =
                  archiveUniqueIds(
                      addedIds
                  ).filter(photoId =>
                      !currentIds.has(
                          photoId
                      )
                  );

              const writes =
                  photoIdsToAdd.map(
                      photoId => ({
                          ownerType:
                    'source',

                          ownerId:
                    currentSource.id,

                          entityType:
                    'photo',

                          entityId:
                    photoId,

                          shouldLink:
                    true
                      })
                  );

              const committed =
                  archiveSetConnectionsAtomically(
                      writes
                  );

              if (!committed.ok)
              {
                  return false;
              }

              const savedIds =
                  new Set(
                      sourceTargetIds(
                          currentSource.id,
                          'photo',
                          projectId
                      )
                  );

              const savedCorrectly =
                  addedIds.every(
                      photoId =>
                          savedIds.has(
                              photoId
                          )
                  );

              return {
                  ...committed,
                  ok:
                savedCorrectly
              };
          },

        afterSave:
          renderArchivePreservingSourceInspectorScroll,

        successMessage:
          count =>
              `${count} ${
                  count === 1
                      ? 'photo'
                      : 'photos'
              } added to source.`
    });
}

function openArchiveSourcePlacesModal(
    sourceId
)
{
    const source =
        archiveSourceById(
            sourceId
        );

    if (!source)
    {
        showToast(
            'The source is no longer available.'
        );

        return;
    }

    const projectId =
        source.projectId
        || currentProjectId();

    const initialPlaceIds =
        sourceTargetIds(
            source.id,
            'place',
            projectId
        );

    const filePlaceIds =
        archiveFilesForSource(
            source.id
        )
            .flatMap(file => archiveFilePlaceIds(file));

    const notePlaceIds =
        sourceTargetIds(
            source.id,
            'note',
            projectId
        ).flatMap(noteId =>
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

            return note?.linkedPlaceIds
            || [];
        });

    const eventPlaceIds =
        sourceTargetIds(
            source.id,
            'event',
            projectId
        )
            .map(eventId =>
                archiveConnectionRecord(
                    'event',
                    eventId
                )?.placeId
            )
            .filter(Boolean);

    const suggestedPlaceIds =
        archiveUniqueIds([
            ...filePlaceIds,
            ...notePlaceIds,
            ...eventPlaceIds
        ]);

    openNotesPlacesModal({
        linkContext: {
            projectId,

            title:
            'Add places',

            subtitle:
            source.title
            || 'Untitled source',

            initialPlaceIds,

            suggestedPlaceIds,

            renderContext:
            renderArchivePreservingSourceInspectorScroll,

            onSave:
            (nextPlaceIds, context) =>
            {
                if (context?.changes) return rpCommitArchivePickerChanges('source', [source.id], 'place', nextPlaceIds, context);
                const currentSource =
                    archiveSourceById(
                        source.id,
                        projectId
                    );

                if (!currentSource)
                {
                    showToast(
                        'The source is no longer available.'
                    );

                    return false;
                }

                const currentIds =
                    new Set(
                        sourceTargetIds(
                            currentSource.id,
                            'place',
                            projectId
                        )
                    );

                const desiredIds =
                    new Set(
                        archiveUniqueIds(
                            nextPlaceIds
                        )
                    );

                const writes = [
                    ...[...currentIds]
                        .filter(placeId =>
                            !desiredIds.has(
                                placeId
                            )
                        )
                        .map(placeId => ({
                            ownerType:
                      'source',

                            ownerId:
                      currentSource.id,

                            entityType:
                      'place',

                            entityId:
                      placeId,

                            shouldLink:
                      false
                        })),

                    ...[...desiredIds]
                        .filter(placeId =>
                            !currentIds.has(
                                placeId
                            )
                        )
                        .map(placeId => ({
                            ownerType:
                      'source',

                            ownerId:
                      currentSource.id,

                            entityType:
                      'place',

                            entityId:
                      placeId,

                            shouldLink:
                      true
                        }))
                ];

                const committed =
                    archiveSetConnectionsAtomically(
                        writes
                    );

                if (!committed.ok)
                {
                    showToast(
                        'Place links could not be updated.'
                    );

                    return false;
                }

                const savedIds =
                    new Set(
                        sourceTargetIds(
                            currentSource.id,
                            'place',
                            projectId
                        )
                    );

                const savedCorrectly =
                    savedIds.size
                  === desiredIds.size
                && [...desiredIds].every(
                    placeId =>
                        savedIds.has(
                            placeId
                        )
                );

                if (!savedCorrectly)
                {
                    showToast(
                        'Place links could not be updated.'
                    );

                    return false;
                }

                return committed;
            },

            afterSave:
            renderArchivePreservingSourceInspectorScroll,

            successMessage:
            'Place links updated.'
        }
    });
}

function rpCommitArchivePickerChanges(ownerType, ownerIds, entityType, selectedIds, context)
{
    const decisions = context.changes?.decisions || [
        ...(context.changes?.addedIds || []).map(id => ({ id, linked: true })),
        ...(context.changes?.removedIds || []).map(id => ({ id, linked: false }))
    ];
    return archiveSetConnectionsAtomically(ownerIds.flatMap(ownerId => decisions.map(({ id, linked }) => ({
        ownerType, ownerId, entityType, entityId: id, shouldLink: linked
    }))));
}

function openArchiveConnectionPicker({ ownerType, ownerIds, entityType })
{
    if (['photo', 'file', 'note', 'source', 'place'].includes(entityType))
    {
        return rpOpenArchiveResourcePicker({ ownerType, ownerIds, entityType });
    }
    const config = archiveEntityConfig(entityType);
    const ids = archiveUniqueIds(ownerIds);
    if (!config || !ids.length) return;
    const records = config.records();
    const existingSets = ids.map(ownerId => new Set(archiveConnectionIds(ownerType, ownerId, entityType)));
    const linkedToAll = recordId => existingSets.every(set => set.has(recordId));
    let query = '';
    const selected = new Set();
    openModal(`<div class="modal notes-related-modal archive-link-picker-modal" role="dialog" aria-modal="true" aria-labelledby="archiveLinkPickerTitle"><div class="modal-header"><div><h2 id="archiveLinkPickerTitle">${escapeHtml(config.addLabel)}</h2><p>Choose existing ${escapeHtml(config.title.toLowerCase())} to link. Linking does not move or duplicate records.</p></div><button class="close-button" type="button" data-close aria-label="Close">${icon.close}</button></div><div class="modal-body form-grid"><div class="archive-link-picker-toolbar"><label class="app-search-field archive-link-picker-search" aria-label="Search ${escapeHtml(config.title.toLowerCase())}">${icon.search}<input type="search" data-archive-link-search placeholder="Search ${escapeHtml(config.title.toLowerCase())}..." aria-label="Search ${escapeHtml(config.title.toLowerCase())}" autocomplete="off"></label>${entityType === 'source' ? `<button class="button secondary" type="button" aria-label="Create source" data-archive-create-source-from-picker>${icon.plus}<span class="source-create-full">Create source</span><span class="source-create-short">Create</span></button>` : ''}</div><div class="archive-modal-list" data-archive-link-results></div></div><div class="modal-footer"><span class="archive-link-picker-status" data-archive-link-count aria-live="polite">0 selected</span><div class="archive-modal-actions"><button class="button secondary" type="button" data-close>Cancel</button><button class="button primary" type="button" data-archive-link-save disabled>Add links</button></div></div></div>`);
    const modal = modalBackdrop.querySelector('.modal');
    const results = modal.querySelector('[data-archive-link-results]');
    const count = modal.querySelector('[data-archive-link-count]');
    const save = modal.querySelector('[data-archive-link-save]');
    const updateSelectionStatus = () =>
    {
        count.textContent = `${selected.size} selected`;
        save.disabled = selected.size === 0;
    };
    const refresh = () =>
    {
        const visible = records.filter(record => [config.label(record), config.meta(record)].join(' ').toLowerCase().includes(query.toLowerCase()));
        results.innerHTML = visible.length ? visible.map(record =>
        {
            const existing = linkedToAll(record.id);
            return `<label class="archive-modal-choice"><input type="checkbox" data-archive-link-choice value="${escapeHtml(record.id)}" ${existing ? 'checked disabled' : selected.has(record.id) ? 'checked' : ''}><span class="archive-modal-choice-copy"><strong>${escapeHtml(config.label(record))}</strong><span>${escapeHtml(config.meta(record))}</span></span><span>${existing ? 'Already linked' : ''}</span></label>`;
        }).join('') : `<div class="archive-section-empty">No matching ${escapeHtml(config.title.toLowerCase())}.</div>`;
        updateSelectionStatus();
    };
    modal.querySelector('[data-archive-link-search]')?.addEventListener('input', event =>
    {
        query = event.currentTarget.value; refresh();
    });
    modal.addEventListener('change', event =>
    {
        const input = event.target.closest('[data-archive-link-choice]');
        if (!input || input.disabled) return;
        if (input.checked) selected.add(input.value); else selected.delete(input.value);
        updateSelectionStatus();
    });
    modal
        .querySelector(
            '[data-archive-create-source-from-picker]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                closeModal();

                openArchiveSourceModal(
                    '',
                    {
                        onCreated:
                  createdSource =>
                  {
                      const committed =
                          archiveSetConnectionsAtomically(
                              ids.map(ownerId => ({
                                  ownerType,
                                  ownerId,
                                  entityType: 'source',
                                  entityId: createdSource.id,
                                  shouldLink: true
                              }))
                          );

                      if (
                          !committed.ok
                      || committed.changedCount
                        !== ids.length
                      )
                      {
                          showToast(
                              'Source created, but it could not be linked.'
                          );

                          return;
                      }

                      state.archiveSelectedFileIds =
                          [];

                      if (
                          ownerType === 'file'
                      )
                      {
                          state.archiveView =
                              'files';

                          state.archiveSelectedFileId =
                              ids[0]
                        || null;
                      }

                      renderArchive();

                      showToast(
                          'Source created and linked.'
                      );
                  }
                    }
                );
            }
        );
    save.addEventListener(
        'click',
        () =>
        {
            if (!selected.size)
            {
                return;
            }

            /*
            File bulk relationships use the verified
            Archive commit path.
          */
            if (
                ownerType === 'file'
            )
            {
                const result =
                    archiveCommitFileConnections({
                        fileIds:
                  ids,

                        entityType,

                        recordIds: [
                            ...selected
                        ]
                    });

                if (!result.ok)
                {
                    showToast(
                        `No ${
                            config.title.toLowerCase()
                        } were linked.`
                    );

                    return;
                }

                closeModal();

                finishArchiveBulkLinkAction(
                    ids
                );

                showToast(
                    `${result.addedLinkCount} ${
                        result.addedLinkCount === 1
                            ? 'link was'
                            : 'links were'
                    } added to ${
                        result.changedFileCount
                    } ${
                        result.changedFileCount === 1
                            ? 'file'
                            : 'files'
                    }.`
                );

                return;
            }

            /*
            Preserve the existing Source-inspector
            relationship workflow.
          */
            const writes =
                ids.flatMap(ownerId =>
                    [...selected]
                        .filter(recordId =>
                            !archiveConnectionIds(
                                ownerType,
                                ownerId,
                                entityType
                            ).includes(recordId)
                        )
                        .map(recordId => ({
                            ownerType,
                            ownerId,
                            entityType,
                            entityId: recordId,
                            shouldLink: true
                        }))
                );

            const committed =
                archiveSetConnectionsAtomically(
                    writes
                );

            const addedCount =
                committed.ok
                    ? committed.changedCount
                    : 0;

            if (!addedCount)
            {
                showToast(
                    'No links were added.'
                );

                return;
            }

            closeModal();

            if (
                ownerType === 'source'
            )
            {
                renderArchivePreservingSourceInspectorScroll();
            }
            else
            {
                renderArchive();
            }

            showToast(
                `${addedCount} ${
                    addedCount === 1
                        ? 'link was'
                        : 'links were'
                } added.`
            );
        }
    );
    refresh();
}

function openArchiveFilesSourceModal(
    fileIds
)
{
    const files =
        archiveFilesForLinkAction(
            fileIds
        );

    if (!files.length)
    {
        return;
    }

    /*
        A single selected file uses the same additive
        source picker as People, Albums, and Places.
      */
    if (files.length === 1)
    {
        const file =
            files[0];

        const fileLabel =
            file.name
          || file.title
          || 'this file';

        openSourcesForTargetModal({
            targetType:
            'file',

            autoFocusSearch:
            false,

            targetId:
            file.id,

            projectId:
            file.projectId,

            title:
            'Add sources',

            subtitle:
            `Connect existing sources to ${
                fileLabel
            }.`,

            afterSave:
            renderArchivePreservingFileInspectorScroll
        });

        return;
    }

    /*
        Keep the multi-owner Archive picker for bulk
        linking because the shared picker currently
        operates on one target record.
      */
    openArchiveConnectionPicker({
        ownerType:
          'file',

        ownerIds:
          files.map(file =>
              file.id
          ),

        entityType:
          'source'
    });
}

function openArchiveBulkLinkModal(
    fileIds,
    entityType
)
{
    const ids =
        archiveFilesForLinkAction(
            fileIds
        ).map(file =>
            file.id
        );

    if (!ids.length)
    {
        return;
    }

    if (
        entityType === 'person'
    )
    {
        openArchiveFilesPeopleModal(
            ids
        );

        return;
    }

    if (
        entityType === 'event'
    )
    {
        openArchiveFilesEventsModal(
            ids
        );

        return;
    }

    if (
        entityType === 'note'
    )
    {
        openArchiveFilesNoteModal(
            ids
        );

        return;
    }

    if (
        entityType === 'source'
    )
    {
        openArchiveFilesSourceModal(
            ids
        );

        return;
    }

    if (
        entityType === 'place'
    )
    {
        openArchiveFilesPlaceModal(
            ids
        );

        return;
    }
}

function openArchiveAddLinksMenu(
    fileIds
)
{
    const files =
        archiveFilesForLinkAction(
            fileIds
        );

    if (!files.length)
    {
        return;
    }

    const ids =
        files.map(file =>
            file.id
        );

    openModal(`
        <div
          class="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="archiveAddLinksTitle">

          <div class="modal-header">
            <div>
              <h2
                id="archiveAddLinksTitle">

                Add links
              </h2>

              <p>
                Connect the selected ${
                    ids.length === 1
                        ? 'file'
                        : 'files'
                } to genealogy records.
              </p>
            </div>

            <button
              class="close-button"
              type="button"
              data-close
              aria-label="Close">

              ${icon.close}
            </button>
          </div>

          <div class="modal-body">
            <div
              class="
                archive-action-grid
              ">

              <button
                class="button secondary"
                type="button"
                data-archive-link-menu="person">

                ${icon.profile}
                People
              </button>

              <button
                class="button secondary"
                type="button"
                data-archive-link-menu="event">

                ${icon.calendar}
                Events
              </button>

              <button
                class="button secondary"
                type="button"
                data-archive-link-menu="note">

                ${icon.note}
                Notes
              </button>

              <button
                class="button secondary"
                type="button"
                data-archive-link-menu="place">

                ${icon.mapPin}
                Places
              </button>

              <button
                class="button secondary"
                type="button"
                data-archive-link-menu="source">

                ${icon.archive}
                Sources
              </button>
            </div>
          </div>

          <div class="modal-footer">
            <button
              class="button secondary"
              type="button"
              data-close>

              Cancel
            </button>
          </div>
        </div>
      `);

    modalBackdrop
        .querySelectorAll(
            '[data-archive-link-menu]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    const entityType =
                        button.dataset
                            .archiveLinkMenu;

                    closeModal();

                    openArchiveBulkLinkModal(
                        ids,
                        entityType
                    );
                }
            );
        });
}

function openArchiveUnlinkConfirm({
    ownerType,
    ownerId,
    entityType,
    entityId
})
{
    const config =
        archiveEntityConfig(
            entityType
        );

    const record =
        archiveConnectionRecord(
            entityType,
            entityId
        );

    const owner =
        ownerType === 'source'
            ? archiveSourceById(
                ownerId
            )
            : ownerType === 'file'
                ? archiveFileById(
                    ownerId
                )
                : null;

    if (
        !config
        || !record
        || !owner
    )
    {
        return;
    }

    const recordLabel =
        config.label(record);

    const ownerLabel =
        ownerType === 'source'
            ? (
                owner.title
              || 'Untitled source'
            )
            : (
                owner.name
              || owner.title
              || 'Untitled file'
            );

    const ownerKind =
        ownerType === 'source'
            ? 'source'
            : 'file';

    const relationshipCopy =
        state.language === 'ru'
            ? `Связь между «${recordLabel}» и ${
                ownerType === 'source'
                    ? 'источником'
                    : 'файлом'
            } «${ownerLabel}» будет удалена. Обе записи останутся в проекте.`
            : `“${recordLabel}” will no longer be linked to the ${ownerKind} “${ownerLabel}”. Neither record will be deleted.`;

    openModal(`
        <div
          class="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="archiveUnlinkTitle">

          <div class="modal-header">
            <div>
              <h2 id="archiveUnlinkTitle">
                ${escapeHtml(
                    t(
                        `Unlink ${config.singular}?`
                    )
                )}
              </h2>

              <p>
                ${escapeHtml(
                    recordLabel
                )}
              </p>
            </div>

            <button
              class="close-button"
              type="button"
              data-close
              aria-label="${escapeHtml(
                    t('Close')
                )}">
              ${icon.close}
            </button>
          </div>

          <div class="modal-body">
            <div class="unlink-relationship-warning">
              <strong>
                ${escapeHtml(
                    t(
                        'Only the connection will be removed.'
                    )
                )}
              </strong>

              <span>
                ${escapeHtml(
                    relationshipCopy
                )}
              </span>
            </div>
          </div>

          <div class="modal-footer">
            <button
              class="button secondary"
              type="button"
              data-close>
              ${escapeHtml(
                    t('Cancel')
                )}
            </button>

            <button
              class="button danger"
              type="button"
              data-archive-unlink-confirm>
              ${escapeHtml(
                    t('Unlink')
                )}
            </button>
          </div>
        </div>
      `);

    modalBackdrop
        .querySelector(
            '[data-archive-unlink-confirm]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                if (
                    !archiveSetConnection(
                        ownerType,
                        ownerId,
                        entityType,
                        entityId,
                        false
                    )
                )
                {
                    showToast(
                        'The link could not be removed.'
                    );

                    return;
                }

                if (ownerType === 'file' && entityType === 'person')
                {
                    const file = archiveFileById(ownerId);
                    if (file?.personRegions)
                    {
                        const regions = { ...file.personRegions };
                        delete regions[entityId];
                        file.personRegions = regions;
                    }
                }

                closeModal();

                if (
                    ownerType === 'source'
              && state.archiveView
                === 'sources'
                )
                {
                    renderArchivePreservingSourceInspectorScroll();
                }
                else
                {
                    renderArchive();
                }

                showToast(
                    'Link removed.'
                );
            }
        );
}

function deleteArchiveFilesPermanently(fileIds)
{
    const ids = new Set(fileIds);
    ids.forEach(archiveReleaseDocument);
    removeSourceLinksForTargets(
        'file',
        [...ids]
    );
    (sampleData.notes || []).forEach(note =>
    {
        note.linkedArchiveFileIds = (note.linkedArchiveFileIds || []).filter(id => !ids.has(id));
    });
    sampleData.archiveFiles = (sampleData.archiveFiles || []).filter(file => !ids.has(file.id));
    state.archiveSelectedFileIds = [];
    if (ids.has(state.archiveSelectedFileId)) state.archiveSelectedFileId = null;
}

function openArchiveDeleteFileConfirm(fileIds)
{
    const files = archiveUniqueIds(fileIds).map(id => archiveFileById(id)).filter(Boolean);
    if (!files.length) return;
    const label = files.length === 1 ? files[0].name : `${files.length} files`;
    const impact = files.length === 1
        ? 'The file and all links to People, Events, Notes, Places, and Sources will be removed. Connected records will not be deleted.'
        : 'The files and all links to People, Events, Notes, Places, and Sources will be removed. Connected records will not be deleted.';
    openModal(`<div class="modal" role="dialog" aria-modal="true" aria-labelledby="archiveDeleteFileTitle"><div class="modal-header"><div><h2 id="archiveDeleteFileTitle">Delete permanently?</h2><p>${escapeHtml(label)}</p></div><button class="close-button" type="button" data-close aria-label="Close">${icon.close}</button></div><div class="modal-body"><div class="archive-delete-summary"><strong>This action cannot be undone.</strong><span>${escapeHtml(t(impact))}</span></div></div><div class="modal-footer"><button class="button secondary" type="button" data-close>Cancel</button><button class="button danger" type="button" data-archive-delete-file-confirm>Delete permanently</button></div></div>`);
    modalBackdrop.querySelector('[data-archive-delete-file-confirm]')?.addEventListener('click', () =>
    {
        deleteArchiveFilesPermanently(files.map(file => file.id));
        closeModal();
        renderArchive();
        showToast(files.length === 1 ? 'File permanently deleted.' : 'Files permanently deleted.');
    });
}

function openArchiveDeleteFolderConfirm(folderId)
{
    const folder = archiveFolderById(folderId);
    if (!folder)
    {
        return;
    }
    const impact = archiveFolderImpact(folder.id);
    openModal(`<div class="modal" role="dialog" aria-modal="true" aria-labelledby="archiveDeleteFolderTitle"><div class="modal-header"><div><h2 id="archiveDeleteFolderTitle">Delete folder permanently?</h2><p>${escapeHtml(folder.name)}</p></div><button class="close-button" type="button" data-close aria-label="Close">${icon.close}</button></div><div class="modal-body"><div class="archive-delete-summary"><strong>This action cannot be undone.</strong><span>${impact.folders} nested ${impact.folders === 1 ? 'folder' : 'folders'} and ${impact.files} ${impact.files === 1 ? 'file' : 'files'} will be permanently deleted. Connections will be removed; connected genealogy records will remain.</span></div></div><div class="modal-footer"><button class="button secondary" type="button" data-close>Cancel</button><button class="button danger" type="button" data-archive-delete-folder-confirm>Delete permanently</button></div></div>`);
    modalBackdrop
        .querySelector(
            '[data-archive-delete-folder-confirm]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                const parentId =
                    archiveFolderParentId(
                        folder
                    );

                const ids =
                    new Set(
                        impact.folderIds
                    );

                deleteArchiveFilesPermanently(
                    archiveProjectFiles()
                        .filter(file =>
                            ids.has(
                                archiveFileFolderId(
                                    file
                                )
                            )
                        )
                        .map(file =>
                            file.id
                        )
                );

                sampleData.archiveFolders =
                    (
                        sampleData.archiveFolders
                || []
                    ).filter(item =>
                        !ids.has(
                            item.id
                        )
                    );

                closeModal();

                archiveNavigateToLocation(
                    {
                        view:
                  'files',

                        folderId:
                  parentId,

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
                    },
                    {
                        recordHistory:
                  false,

                        expandCurrent:
                  true
                    }
                );

                showToast(
                    'Folder permanently deleted.'
                );
            }
        );
}

function archiveEffectiveBulkItems(folderIds, fileIds)
{
    const selectedFolders = archiveUniqueIds(folderIds).map(id => archiveFolderById(id)).filter(Boolean);
    const descendantIds = new Set(selectedFolders.flatMap(folder => archiveFolderDescendantIds(folder.id)));
    const folders = selectedFolders.filter(folder => !selectedFolders.some(parent =>
        parent.id !== folder.id && archiveFolderDescendantIds(parent.id).includes(folder.id)));
    const files = archiveUniqueIds(fileIds).map(id => archiveFileById(id))
        .filter(file => file && !descendantIds.has(archiveFileFolderId(file)));
    return { folders, files };
}

function archiveCanMoveBulkItems(items, destinationId)
{
    if (destinationId && !archiveFolderById(destinationId)) return false;
    if (items.folders.some(folder => archiveFolderDescendantIds(folder.id).includes(destinationId))) return false;
    return items.folders.some(folder => archiveFolderParentId(folder) !== destinationId)
        || items.files.some(file => archiveFileFolderId(file) !== destinationId);
}

function archiveMoveBulkItems(items, destinationId)
{
    if (!archiveCanMoveBulkItems(items, destinationId)) return false;
    const folderSnapshots = items.folders.map(folder => ({ id: folder.id,
        parentId: archiveFolderParentId(folder), updatedAt: folder.updatedAt }));
    const fileSnapshots = items.files.map(file => ({ id: file.id,
        folderId: archiveFileFolderId(file), updatedAt: file.updatedAt, updated: file.updated }));
    const now = new Date().toISOString();
    items.folders.forEach(folder => { folder.parentId = destinationId; folder.updatedAt = now; });
    items.files.forEach(file => { file.folderId = destinationId; file.updatedAt = now; file.updated = 'Just now'; });
    state.archiveSelectedFolderIds = [];
    state.archiveSelectedFileIds = [];
    state.archiveSelectedFolderItemId = null;
    state.archiveSelectedFileId = null;
    renderArchive();
    showActionToast({
        message: `${t('Moved selected items to')} ${archiveMoveFolderPath(destinationId)}.`,
        actions: [{ label: 'Undo', onClick: () => {
            folderSnapshots.forEach(snapshot => {
                const folder = archiveFolderById(snapshot.id);
                if (folder) { folder.parentId = snapshot.parentId; folder.updatedAt = snapshot.updatedAt; }
            });
            fileSnapshots.forEach(snapshot => {
                const file = archiveFileById(snapshot.id);
                if (file) { file.folderId = snapshot.folderId; file.updatedAt = snapshot.updatedAt; file.updated = snapshot.updated; }
            });
            renderArchive();
            showToast('Move undone.');
        }}]
    });
    return true;
}

function openArchiveBulkMoveModal(folderIds, fileIds)
{
    const items = archiveEffectiveBulkItems(folderIds, fileIds);
    if (!items.folders.length && !items.files.length) return;
    const choices = [{ id: null, label: t(ARCHIVE_ROOT_LABEL) },
        ...archiveFlattenFolders().map(({ folder }) => ({ id: folder.id, label: archiveFolderPath(folder.id) }))];
    openModal(`<div class="modal archive-bulk-move-modal" role="dialog" aria-modal="true" aria-labelledby="archiveBulkMoveTitle">
        <div class="modal-header"><div><h2 id="archiveBulkMoveTitle">${escapeHtml(t('Move selected items'))}</h2>
        <p>${escapeHtml(archiveBulkSelectionLabel())}</p></div>
        <button class="close-button" type="button" data-close aria-label="${escapeHtml(t('Close'))}">${icon.close}</button></div>
        <div class="modal-body"><label class="form-field"><span>${escapeHtml(t('Destination folder'))}</span>
        <select data-archive-bulk-destination size="8">${choices.map(choice =>
            `<option value="${escapeHtml(choice.id || '')}" ${archiveCanMoveBulkItems(items, choice.id) ? '' : 'disabled'}>${escapeHtml(choice.label)}</option>`).join('')}</select></label></div>
        <div class="modal-footer"><button class="button secondary" type="button" data-close>${escapeHtml(t('Cancel'))}</button>
        <button class="button primary" type="button" data-archive-bulk-move-confirm disabled>${escapeHtml(t('Move'))}</button></div></div>`);
    const select = modalBackdrop.querySelector('[data-archive-bulk-destination]');
    const confirm = modalBackdrop.querySelector('[data-archive-bulk-move-confirm]');
    select?.addEventListener('change', () => { confirm.disabled = !archiveCanMoveBulkItems(items, select.value || null); });
    confirm?.addEventListener('click', () => {
        if (!archiveCanMoveBulkItems(items, select.value || null)) return;
        closeModal();
        archiveMoveBulkItems(items, select.value || null);
    });
}

function openArchiveBulkDeleteConfirm(folderIds, fileIds)
{
    const items = archiveEffectiveBulkItems(folderIds, fileIds);
    const deletedFolderIds = new Set(items.folders.flatMap(folder => archiveFolderDescendantIds(folder.id)));
    const deletedFiles = new Set([...items.files.map(file => file.id),
        ...archiveProjectFiles().filter(file => deletedFolderIds.has(archiveFileFolderId(file))).map(file => file.id)]);
    if (!deletedFolderIds.size && !deletedFiles.size) return;
    openModal(`<div class="modal" role="dialog" aria-modal="true" aria-labelledby="archiveBulkDeleteTitle">
        <div class="modal-header"><div><h2 id="archiveBulkDeleteTitle">${escapeHtml(t('Delete permanently?'))}</h2>
        <p>${escapeHtml(translateCountPhrase(`${deletedFolderIds.size} ${deletedFolderIds.size === 1 ? 'folder' : 'folders'}`))}, ${escapeHtml(translateCountPhrase(`${deletedFiles.size} ${deletedFiles.size === 1 ? 'file' : 'files'}`))}</p></div>
        <button class="close-button" type="button" data-close aria-label="${escapeHtml(t('Close'))}">${icon.close}</button></div>
        <div class="modal-body"><div class="archive-delete-summary"><strong>${escapeHtml(t('This action cannot be undone.'))}</strong>
        <span>${escapeHtml(t('Selected folders, their contents, selected files, and file links will be removed. Connected genealogy records will remain.'))}</span></div></div>
        <div class="modal-footer"><button class="button secondary" type="button" data-close>${escapeHtml(t('Cancel'))}</button>
        <button class="button danger" type="button" data-archive-bulk-delete-confirm>${escapeHtml(t('Delete permanently'))}</button></div></div>`);
    modalBackdrop.querySelector('[data-archive-bulk-delete-confirm]')?.addEventListener('click', () => {
        deleteArchiveFilesPermanently([...deletedFiles]);
        sampleData.archiveFolders = (sampleData.archiveFolders || []).filter(folder => !deletedFolderIds.has(folder.id));
        state.archiveSelectedFolderIds = [];
        state.archiveSelectedFileIds = [];
        state.archiveSelectedFolderItemId = null;
        const current = state.archiveSelectedFolderId;
        if (current && deletedFolderIds.has(current)) state.archiveSelectedFolderId = null;
        closeModal();
        renderArchive();
        showToast(t('Selected Archive items permanently deleted.'));
    });
}

function openArchiveDeleteSourceConfirm(sourceId)
{
    const source = archiveSourceById(sourceId);
    if (!source) return;
    openModal(`<div class="modal" role="dialog" aria-modal="true" aria-labelledby="archiveDeleteSourceTitle"><div class="modal-header"><div><h2 id="archiveDeleteSourceTitle">Delete source permanently?</h2><p>${escapeHtml(source.title)}</p></div><button class="close-button" type="button" data-close aria-label="Close">${icon.close}</button></div><div class="modal-body"><div class="archive-delete-summary"><strong>The Source record cannot be restored.</strong><span>Its connections will be removed. Linked files, Photos, People, Events, Notes, and Places will not be deleted.</span></div></div><div class="modal-footer"><button class="button secondary" type="button" data-close>Cancel</button><button class="button danger" type="button" data-archive-delete-source-confirm>Delete permanently</button></div></div>`);
    modalBackdrop.querySelector('[data-archive-delete-source-confirm]')?.addEventListener('click', () =>
    {
        removeSourceLinksForSource(
            source.id
        );
        sampleData.sources = (sampleData.sources || []).filter(item => item.id !== source.id);
        state.archiveSelectedSourceId = null;
        closeModal();
        renderArchive();
        showToast('Source permanently deleted.');
    });
}

function openArchiveItemActionsPopover(
    type,
    id,
    anchor
)
{
    if (
        !(anchor instanceof HTMLElement)
    )
    {
        return;
    }

    const file =
        type === 'file'
            ? archiveFileById(
                id
            )
            : null;

    const folder =
        type === 'folder'
            ? archiveFolderById(
                id
            )
            : null;
    const folderIsCurrentLocation =
        Boolean(
            folder
          && folder.id
            === archiveNormalizeFolderId(
                state.archiveSelectedFolderId
            )
        );
    const source =
        type === 'source'
            ? archiveSourceById(
                id
            )
            : null;
    const sourceMenuInInspector =
        Boolean(
            source
          && anchor.closest(
              '.archive-inspector-toolbar'
          )
        );
    const item =
        file
        || folder
        || source;

    if (!item)
    {
        return;
    }

    /*
        Clicking the active More button again
        closes its menu instead of reopening it.
      */
    const alreadyOpen =
        anchor.getAttribute(
            'aria-expanded'
        ) === 'true'
        && Boolean(
            document.getElementById(
                'projectMenu'
            )
        );

    closeMenu();

    if (alreadyOpen)
    {
        return;
    }

    const label =
        file?.name
        || folder?.name
        || source?.title
        || 'Item';

    const menu =
        document.createElement(
            'div'
        );

    menu.className =
        'menu-popover';

    menu.id =
        'projectMenu';

    menu.setAttribute(
        'role',
        'menu'
    );

    menu.setAttribute(
        'aria-label',
        `More actions for ${label}`
    );

    if (file)
    {
        menu.innerHTML = `
          <button type="button" role="menuitem" data-archive-item-action="favorite">${escapeHtml(t(file.favorite ? 'Remove from favourites' : 'Add to favourites'))}</button>
          <button
            type="button"
            role="menuitem"
            data-archive-item-action="rename">

            Rename
          </button>

          <button
            type="button"
            role="menuitem"
            data-archive-item-action="move">

            Move
          </button>

          <button
            class="danger"
            type="button"
            role="menuitem"
            data-archive-item-action="delete">

            Delete permanently
          </button>
        `;
    }

    if (folder)
    {
        menu.innerHTML = `
          ${innerWidth <= 900 ? `<button type="button" role="menuitem" data-archive-item-action="details">${escapeHtml(t('Details'))}</button>` : ''}
          <button type="button" role="menuitem" data-archive-item-action="favorite">${escapeHtml(t(folder.favorite ? 'Remove from favourites' : 'Add to favourites'))}</button>
          ${
                folderIsCurrentLocation
                    ? ''
                    : `
                <button
                  type="button"
                  role="menuitem"
                  data-archive-item-action="open">

                  Open folder
                </button>
              `
            }

          <button
            type="button"
            role="menuitem"
            data-archive-item-action="rename">

            Rename
          </button>

          <button
            type="button"
            role="menuitem"
            data-archive-item-action="move">

            Move
          </button>

          <button
            class="danger"
            type="button"
            role="menuitem"
            data-archive-item-action="delete">

            Delete permanently
          </button>
        `;
    }

    if (source)
    {
        menu.innerHTML =
            sourceMenuInInspector
                ? `
              <button
                class="danger"
                type="button"
                role="menuitem"
                data-archive-item-action="delete">

                Delete permanently
              </button>
            `
                : `
              <button
                type="button"
                role="menuitem"
                data-archive-item-action="edit">

                Edit source
              </button>

              <button
                type="button"
                role="menuitem"
                data-archive-item-action="favorite">

                ${
                    source.favorite
                        ? 'Remove from favourites'
                        : 'Add to favourites'
                }
              </button>

              <button
                class="danger"
                type="button"
                role="menuitem"
                data-archive-item-action="delete">

                Delete permanently
              </button>
            `;
    }

    document.body.appendChild(
        menu
    );

    /*
        Position after mounting so the actual
        menu dimensions are available.
      */
    const rect =
        anchor.getBoundingClientRect();

    const viewportMargin =
        12;

    const gap =
        6;

    const left =
        Math.min(
            Math.max(
                viewportMargin,
                rect.right
              - menu.offsetWidth
            ),
            Math.max(
                viewportMargin,
                window.innerWidth
              - menu.offsetWidth
              - viewportMargin
            )
        );

    const belowTop =
        rect.bottom
        + gap;

    const top =
        belowTop
          + menu.offsetHeight
          <= window.innerHeight
            - viewportMargin
            ? belowTop
            : Math.max(
                viewportMargin,
                rect.top
                - menu.offsetHeight
                - gap
            );

    menu.style.left =
        `${left}px`;

    menu.style.top =
        `${top}px`;

    anchor.setAttribute(
        'aria-expanded',
        'true'
    );

    menu.addEventListener(
        'click',
        event =>
        {
            const actionButton =
                event.target.closest(
                    '[data-archive-item-action]'
                );

            if (!actionButton)
            {
                return;
            }

            const action =
                actionButton.dataset
                    .archiveItemAction;

            closeMenu();

            if (file)
            {
                if (action === 'favorite')
                {
                    file.favorite = !file.favorite;
                    renderArchive();
                    return;
                }
                if (
                    action === 'rename'
                )
                {
                    runAfterArchiveFileEditGuard(() => beginArchiveFileRename(file.id));

                    return;
                }

                if (
                    action === 'move'
                )
                {
                    openArchiveMoveModal({
                        fileIds:
                  [
                      file.id
                  ]
                    });

                    return;
                }

                if (
                    action === 'delete'
                )
                {
                    openArchiveDeleteFileConfirm(
                        [
                            file.id
                        ]
                    );
                }

                return;
            }

            if (folder)
            {
                if (action === 'favorite')
                {
                    folder.favorite = !folder.favorite;
                    renderArchive();
                    return;
                }
                if (action === 'details')
                {
                    selectArchiveFolderItem(folder.id);
                    main.querySelector(`[data-archive-row-id="${CSS.escape(folder.id)}"]`)?.focus({ preventScroll: true });
                    openMobileSurface('details');
                    return;
                }
                if (
                    action === 'open'
                )
                {
                    archiveOpenFolder(
                        folder.id
                    );

                    return;
                }

                if (
                    action === 'rename'
                )
                {
                    openArchiveRenameItemModal(
                        'folder',
                        folder.id
                    );

                    return;
                }

                if (
                    action === 'move'
                )
                {
                    openArchiveMoveModal({
                        folderId:
                  folder.id
                    });

                    return;
                }

                if (
                    action === 'delete'
                )
                {
                    openArchiveDeleteFolderConfirm(
                        folder.id
                    );
                }

                return;
            }

            if (source)
            {
                if (
                    action === 'edit'
                )
                {
                    openArchiveSourceModal(
                        source.id
                    );

                    return;
                }

                if (
                    action === 'favorite'
                )
                {
                    source.favorite =
                        !source.favorite;

                    renderArchive();

                    return;
                }

                if (
                    action === 'delete'
                )
                {
                    openArchiveDeleteSourceConfirm(
                        source.id
                    );
                }
            }
        }
    );

    bindMenuLifecycle(
        anchor
    );

    requestAnimationFrame(
        () =>
        {
            menu
                .querySelector(
                    '[role="menuitem"]'
                )
                ?.focus();
        }
    );
}

function openArchiveMobileChoiceMenu(anchor, kind)
{
    const wasOpen = anchor.getAttribute('aria-expanded') === 'true'
        && Boolean(document.getElementById('projectMenu'));
    closeMenu();
    if (wasOpen) return;
    const menu = document.createElement('div');
    menu.id = 'projectMenu';
    menu.className = 'menu-popover';
    menu.setAttribute('role', 'menu');
    const { folders, files } = archiveSelectedBulkItems();
    const allFavorite = [...folders, ...files].every(item => item.favorite);
    const bulkChoices = `${kind === 'bulk' ? `<button type="button" role="menuitem" data-archive-mobile-choice="move">${escapeHtml(t('Move'))}</button><button type="button" role="menuitem" data-archive-mobile-choice="favorite">${escapeHtml(t(allFavorite ? 'Remove from favourites' : 'Add to favourites'))}</button>` : ''}
        ${!folders.length ? `<button type="button" role="menuitem" data-archive-mobile-choice="links">${escapeHtml(t('Add links'))}</button>` : ''}
        <button class="danger" type="button" role="menuitem" data-archive-mobile-choice="delete">${escapeHtml(t('Delete permanently'))}</button>`;
    menu.innerHTML = kind === 'add'
        ? `<button type="button" role="menuitem" data-archive-mobile-choice="files">${escapeHtml(t('Add files'))}</button><button type="button" role="menuitem" data-archive-mobile-choice="folder">${escapeHtml(t('New folder'))}</button>`
        : bulkChoices;
    document.body.appendChild(menu);
    const rect = anchor.getBoundingClientRect();
    menu.style.left = `${Math.max(12, Math.min(rect.right - menu.offsetWidth, innerWidth - menu.offsetWidth - 12))}px`;
    menu.style.top = `${rect.bottom + menu.offsetHeight + 8 < innerHeight ? rect.bottom + 6 : Math.max(12, rect.top - menu.offsetHeight - 6)}px`;
    menu.addEventListener('click', event => {
        const choice = event.target.closest('[data-archive-mobile-choice]')?.dataset.archiveMobileChoice;
        if (!choice) return;
        closeMenu();
        if (choice === 'files') openArchiveAddFilesModal();
        else if (choice === 'folder') openArchiveCreateFolderFromTrigger(anchor);
        else main.querySelector(`[data-archive-selection-action="${choice}"]`)?.click();
    });
    bindMenuLifecycle(anchor);
}

function openArchiveConnectedRecordCommit(
    type,
    id
)
{
    if (
        type === 'photo'
    )
    {
        openAlbumsForPhoto(
            id
        );

        return;
    }
    if (
        type === 'person'
    )
    {
        openPlaceInspectorPerson(
            id
        );

        return;
    }

    if (
        type === 'note'
    )
    {
        openCentralNoteFromContext(
            id,

            state.archiveView
            === 'sources'
                ? {
                    type:
                    'source',

                    id:
                    state.archiveSelectedSourceId
                    || ''
                }
                : {
                    type:
                    'archiveFile',

                    id:
                    state.archiveSelectedFileId
                    || ''
                }
        );

        return;
    }

    if (
        type === 'place'
    )
    {
        state.activeModule =
            'Places';

        state.placesView =
            'all';

        state.selectedPlaceId =
            id;

        render();

        return;
    }

    if (
        type === 'source'
    )
    {
        archiveRememberCurrentLocation();

        state.archiveView =
            'sources';

        state.archiveSelectedSourceId =
            id;

        state.archiveInspectorCollapsed =
            false;

        renderArchive();

        return;
    }

    if (
        type === 'file'
    )
    {
        const file =
            archiveFileById(
                id
            );

        archiveNavigateToLocationCommit(
            {
                view:
              'files',

                folderId:
              archiveFileFolderId(
                  file
              ),

                search:
              '',

                searchScope:
              'folder',

                personFilterId:
              '',

                selectedFileId:
              file?.id
              || null,

                inspectorCollapsed:
              false
            },
            {
                expandCurrent:
              true
            }
        );

        return;
    }

    if (
        type === 'event'
    )
    {
        const event =
            archiveConnectionRecord(
                'event',
                id
            );

        const personId =
            event?.personIds?.[0];

        if (personId)
        {
            openPlaceInspectorPerson(
                personId
            );
        }
        else
        {
            showToast(
                'Opening this event is simulated.'
            );
        }
    }
}

function openArchiveConnectedRecord(
    type,
    id
)
{
    runAfterArchiveFileEditGuard(
        () =>
        {
            openArchiveConnectedRecordCommit(
                type,
                id
            );
        }
    );
}

function openSourceConnectedItems(sourceId, entityType)
{
    const source = archiveSourceById(sourceId);
    if (!source) return;

    if (entityType === 'note')
    {
        openNotesForContext('source', source.id);
        return;
    }

    const records = archiveSourceConnectionRecords(
        source,
        entityType
    );

    if (entityType === 'photo')
    {
        state.activeModule = 'Albums';
        state.albumsView = 'all';
        state.activeAlbumId = null;

        state.albumsFilters = {
            ...defaultAlbumFilters,
            sourceId: source.id
        };

        state.albumsSearch = '';
        state.selectedPhotoIds = [];
        state.selectedPhotoId = records[0]?.id || null;
        state.albumsDetailCollapsed = false;

        resetAlbumsPage();
        render();
        return;
    }

    if (entityType === 'file')
    {
        openArchiveLocation({
            view: 'files',
            folderId: null,
            search: '',
            fileFilters: {
                ...defaultArchiveFileFilters,
                sourceId: source.id
            },
            filterPresentation: 'flat',
            filterScopeFolderId: null,
            selectedFileId: records[0]?.id || null,
            inspectorCollapsed: true
        });
    }
}

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
            '[data-archive-inspector-open-folder]'
        )
        ?.addEventListener(
            'click',
            event =>
            {
                archiveOpenFolder(
                    event.currentTarget
                        .dataset
                        .archiveInspectorOpenFolder
                );
            }
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
                        if (innerWidth > 900 && !event.shiftKey && !event.ctrlKey && !event.metaKey
                            && archiveFileRowWasDoubleClick(row.dataset.archiveFileRow))
                            openArchiveDocumentViewer(row.dataset.archiveFileRow);
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

                    selectArchiveFolderItem(folderId);
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

const EXPECTED_CANONICAL_NOTE_COUNT = 12;
const EXPECTED_CANONICAL_NOTE_COLLECTION_COUNT = 4;
sampleData.noteCollections = [
    {
        id:
          'note-col-pawford',

        projectId:
          'p1',

        name:
          'Pawford research',

        description:
          'Records, places, and open questions connected to Pawford.'
    },

    {
        id:
          'note-col-whiskerfield',

        projectId:
          'p1',

        name:
          'Whiskerfield family',

        description:
          'Family history, surname research, and household context.'
    },

    {
        id:
          'note-col-sources',

        projectId:
          'p1',

        name:
          'Source analysis',

        description:
          'Transcriptions, extracts, and interpretation of research sources.'
    },

    {
        id:
          'note-col-interviews',

        projectId:
          'p1',

        name:
          'Family interviews',

        description:
          'Interview preparation, recollections, and follow-up questions.'
    }
];

sampleData.notes = (() =>
{
    const body = (...lines) =>
        lines.join('\n');

    const richBody = (...blocks) => ({
        body: blocks.map(([, text]) => text).join('\n'),
        bodyDelta: {
            ops: blocks.flatMap(([kind, text]) => [
                kind === 'emphasis' ? { insert: text, attributes: { bold: true } }
                    : { insert: text },
                kind === 'heading' ? { insert: '\n', attributes: { header: 3 } }
                    : kind === 'bullet' ? { insert: '\n', attributes: { list: 'bullet' } }
                        : { insert: '\n' }
            ])
        },
        bodyFormat: 'quill-delta-v1'
    });

    const note = record => ({
        id: '',
        projectId: 'p1',
        title: '',
        body: '',
        bodyDelta: null,
        bodyFormat: '',
        collectionIds: [],
        favorite: false,
        archived: false,
        checklist: [],
        linkedPersonIds: [],
        linkedPlaceIds: [],
        linkedEventIds: [],
        linkedPhotoIds: [],
        linkedArchiveFileIds: [],
        relatedNoteIds: [],
        createdAt:
          '2026-01-01T00:00:00Z',
        updatedAt:
          '2026-01-01T00:00:00Z',
        ...record
    });

    return [
        note({
            id:
            'note-daisy-parentage',

            title:
            'Daisy’s birth extract: name and place to verify',

            ...richBody(
                ['heading', 'What the extract says'],
                ['paragraph', 'The sample extract names Daisy Whiskerfield, gives 03 June 1949, and lists Pawford as her birthplace.'],
                ['emphasis', 'The extract does not identify Daisy’s parents.'],
                ['heading', 'What the Tree says'],
                ['paragraph', 'Daisy’s Tree profile records Milkpaw as her maiden name and leaves her birthplace unset. Percival Milkpaw and Nora Creamfur are already connected as her parents; Barnaby Whiskerfield is her husband.'],
                ['heading', 'To verify'],
                ['bullet', 'Find the full birth entry and check whether Whiskerfield is a later name on this extract.'],
                ['bullet', 'Confirm Pawford before adding it to Daisy’s birth fact.'],
                ['bullet', 'Do not use this extract alone to confirm her parents.']
            ),

            collectionIds: [
                'note-col-pawford',
                'note-col-whiskerfield'
            ],

            favorite: true,

            checklist: [
                {
                    id:
                'note-daisy-parentage-check-register',

                    text:
                'Find the full birth entry',

                    done:
                false
                },

                {
                    id:
                'note-daisy-parentage-check-households',

                    text:
                'Check the surname shown on the birth extract',

                    done:
                false
                },

                {
                    id:
                'note-daisy-parentage-review-evidence',

                    text:
                'Confirm Pawford before updating the birth place',

                    done:
                false
                }
            ],

            linkedPersonIds: [
                'daisy'
            ],

            linkedPlaceIds: [
                'place-pawford'
            ],

            linkedEventIds: [
                'event-daisy-birth'
            ],

            linkedArchiveFileIds: [
                'af-birth-sample'
            ],

            relatedNoteIds: [
                'note-pawford-household',
                'note-whiskerfield-surname'
            ],

            createdAt:
            '2026-06-27T09:00:00Z',

            updatedAt:
            '2026-07-22T16:30:00Z'
        }),

        note({
            id:
            'note-old-cattery-burial',

            title:
            'Pearl’s Old Cattery burial: source to find',

            ...richBody(
                ['paragraph', 'Pearl Softtail (née Velvetpaw) died on 02 February 2011. Her Tree profile places her death and burial in Old Cattery.'],
                ['paragraph', 'No burial-index file is linked to this note. Find the original entry and check its date, recorded name, and plot reference before adding further details.'],
                ['paragraph', 'This archived note preserves the research trail without implying a connection to Daisy or the Pawford branch.']
            ),

            collectionIds: [
                'note-col-sources'
            ],

            archived:
            true,

            linkedPersonIds: [
                'pearl'
            ],

            linkedPlaceIds: [
                'place-old-cattery'
            ],

            createdAt:
            '2026-05-14T10:00:00Z',

            updatedAt:
            '2026-06-28T11:15:00Z'
        }),

        note({
            id:
            'note-meowbridge-transcription',

            title:
            'Meowbridge marriage extract: field notes',

            ...richBody(
                ['heading', 'Visible on the extract'],
                ['bullet', 'Bridegroom: Silver Whiskerfield. Bride: Luna Purrington.'],
                ['bullet', 'Date: 18 August 2023. Place: Meowbridge, North Yorkshire.'],
                ['heading', 'Limits'],
                ['paragraph', 'The sample image does not show witnesses, a certificate number, or the original register page. Leave those details blank until another record supplies them.'],
                ['paragraph', 'Keep this transcription linked to the scan; the separate marriage note tracks what the event establishes.']
            ),

            collectionIds: [
                'note-col-sources'
            ],

            linkedPersonIds: [
                'silver',
                'luna'
            ],

            linkedPlaceIds: [
                'place-meowbridge'
            ],

            linkedArchiveFileIds: [
                'af5'
            ],

            relatedNoteIds: [
                'note-silver-luna-marriage'
            ],

            createdAt:
            '2026-06-24T09:30:00Z',

            updatedAt:
            '2026-07-13T14:10:00Z'
        }),

        note({
            id:
            'note-pawford-household',

            title:
            'Pawford register index, 2004',

            ...richBody(
                ['heading', 'Four separate entries'],
                ['paragraph', 'The sample page lists Barnaby, Daisy, Silver, and Luna with birth years, Pawford as locality, and separate PW/001–PW/004 references.'],
                ['paragraph', 'It is an index, not a household listing: it does not say they lived together, give an address, or state how they are related. Luna’s entry uses Purrington, which differs from her current Tree surname.'],
                ['heading', 'Next step'],
                ['bullet', 'Use each reference to request the underlying record before treating the locality or name as a new fact.'],
                ['bullet', 'Compare the index scan with page 12 and note any transcription differences.']
            ),

            collectionIds: [
                'note-col-pawford',
                'note-col-sources',
                'note-col-whiskerfield'
            ],

            favorite:
            true,

            checklist: [
                {
                    id:
                'note-pawford-household-transcribe',

                    text:
                'Transcribe all four index entries',

                    done:
                true
                },

                {
                    id:
                'note-pawford-household-address',

                    text:
                'Request the underlying records by reference',

                    done:
                false
                },

                {
                    id:
                'note-pawford-household-continuation',

                    text:
                'Compare names with the index on page 12',

                    done:
                false
                }
            ],

            linkedPersonIds: [
                'barnaby',
                'daisy',
                'silver',
                'luna'
            ],

            linkedPlaceIds: [
                'place-pawford'
            ],

            linkedArchiveFileIds: [
                'af1',
                'af3'
            ],

            relatedNoteIds: [
                'note-daisy-parentage'
            ],

            createdAt:
            '2026-06-22T08:00:00Z',

            updatedAt:
            '2026-07-21T18:20:00Z'
        }),

        note({
            id:
            'note-whiskerfield-album',

            title:
            'Family photographs: identified and open',

            ...richBody(
                ['heading', 'Already identified'],
                ['paragraph', 'The garden photograph is tagged with Barnaby and Daisy; the family-table photograph is tagged with Silver, Luna, and Pearl. These identifications should be checked against the originals and their captions.'],
                ['heading', 'Still open'],
                ['paragraph', 'The studio portrait in Archive has no identified person or date. Do not assign it to a relative just because it appears with family material.'],
                ['paragraph', 'Daisy’s 2006 letter to Luna says she was sorting family photographs. Compare that context with album order and handwritten captions before proposing an identity.']
            ),

            collectionIds: [
                'note-col-whiskerfield'
            ],

            favorite:
            true,

            linkedPersonIds: [
                'silver',
                'luna',
                'barnaby',
                'daisy',
                'pearl'
            ],

            linkedPlaceIds: [
                'place-pawford'
            ],

            linkedPhotoIds: [
                'photo-family-table',
                'photo-grandparents-garden',
                'photo-unidentified-studio'
            ],

            linkedArchiveFileIds: [
                'af2',
                'af4'
            ],

            relatedNoteIds: [
                'note-luna-interview'
            ],

            createdAt:
            '2026-06-18T10:00:00Z',

            updatedAt:
            '2026-07-18T12:45:00Z'
        }),

        note({
            id:
            'note-whiskerfield-surname',

            title:
            'Names across the Pawford records',

            ...richBody(
                ['paragraph', 'The 2004 Pawford index lists Daisy as Whiskerfield and Luna as Purrington. Daisy’s Tree profile records Milkpaw as her maiden name; Luna’s records show Purrington before her marriage to Silver.'],
                ['paragraph', 'A change of surname is not evidence of a spelling error. Keep each recorded form with its date and source, then compare it with the person’s life events.'],
                ['bullet', 'Check whether Daisy’s birth extract was annotated or created after her marriage.'],
                ['bullet', 'Keep Luna’s Purrington name in the 2023 marriage transcription.']
            ),

            collectionIds: [
                'note-col-whiskerfield',
                'note-col-pawford'
            ],

            linkedPersonIds: [
                'daisy',
                'luna'
            ],

            linkedPlaceIds: [
                'place-pawford'
            ],

            linkedArchiveFileIds: [
                'af1',
                'af-birth-sample',
                'af5'
            ],

            relatedNoteIds: [
                'note-daisy-parentage'
            ],

            createdAt:
            '2026-06-15T09:10:00Z',

            updatedAt:
            '2026-07-17T15:00:00Z'
        }),

        note({
            id:
            'note-rupert-death',

            title:
            'Rupert’s death: record search',

            ...richBody(
                ['paragraph', 'Rupert Purrington is marked deceased in the Tree, but no death date or place is recorded. The Pawford online collection ends in 1950, before Rupert’s recorded birth in 1951, so it cannot supply his death entry.'],
                ['paragraph', 'Search an appropriate later death register. Compare full name, age, family members, and district before attaching a result or entering a date.']
            ),

            collectionIds: [
                'note-col-sources'
            ],

            checklist: [
                {
                    id:
                'note-rupert-death-check-index',

                    text:
                'Find a later death register',

                    done:
                false
                },

                {
                    id:
                'note-rupert-death-compare-residence',

                    text:
                'Compare residence and family details',

                    done:
                false
                }
            ],

            linkedPersonIds: [
                'rupert'
            ],

            createdAt:
            '2026-06-10T13:30:00Z',

            updatedAt:
            '2026-07-16T17:05:00Z'
        }),

        note({
            id:
            'note-purrington-surname',

            title:
            'Purrington name in the marriage extract',

            body: body(
                'The 2023 marriage extract names the bride Luna Purrington. Her current Tree display name is Luna Mabel Whiskerfield, with Purrington recorded as her maiden name.',
                '',
                'Preserve the name exactly as it appears on the dated document. This archived note is a reminder to compare names in their own time, not to treat a later surname as a transcription correction.'
            ),

            collectionIds: [],

            archived:
            true,

            linkedPersonIds: [
                'luna'
            ],

            linkedArchiveFileIds: [
                'af5'
            ],

            createdAt:
            '2026-05-01T11:00:00Z',

            updatedAt:
            '2026-06-30T09:20:00Z'
        }),

        note({
            id:
            'note-silver-luna-marriage',

            title:
            'Silver and Luna marriage record notes',

            ...richBody(
                ['heading', 'What the extract supports'],
                ['paragraph', 'Silver Whiskerfield and Luna Purrington married on 18 August 2023 in Meowbridge, North Yorkshire. The Tree’s marriage event uses that date and place.'],
                ['heading', 'What it does not show'],
                ['paragraph', 'The sample extract has no witness names or certificate number. Do not add those details from memory or from the wedding photograph.'],
                ['paragraph', 'The scan documents the event; the wedding photograph provides separate visual context. The field-note transcription records the visible text.']
            ),

            collectionIds: [
                'note-col-whiskerfield',
                'note-col-sources'
            ],

            linkedPersonIds: [
                'silver',
                'luna'
            ],

            linkedPlaceIds: [
                'place-meowbridge'
            ],

            linkedEventIds: [
                'event-rel-silver-luna-partner-rel-silver-luna-partner-marriage'
            ],

            linkedPhotoIds: [
                'photo-silver-luna-wedding'
            ],

            linkedArchiveFileIds: [
                'af5'
            ],

            relatedNoteIds: [
                'note-silver-profile-checklist'
            ],

            createdAt:
            '2026-05-19T10:15:00Z',

            updatedAt:
            '2026-07-20T13:35:00Z'
        }),

        note({
            id:
            'note-silver-profile-checklist',

            title:
            'Silver’s profile: next checks',

            body: '',

            collectionIds: [
                'note-col-whiskerfield'
            ],

            checklist: [
                {
                    id:
                'note-silver-profile-residence',

                    text:
                'Confirm Silver’s Pawford birth announcement against the original notice',

                    done:
                false
                },

                {
                    id:
                'note-silver-profile-photos',

                    text:
                'Review names and dates on the linked photographs',

                    done:
                true
                },

                {
                    id:
                'note-silver-profile-events',

                    text:
                'Check the marriage event against its extract',

                    done:
                false
                }
            ],

            linkedPersonIds: [
                'silver'
            ],

            linkedPlaceIds: [
                'place-pawford'
            ],

            linkedEventIds: [
                'event-silver-birth'
            ],

            linkedArchiveFileIds: [
                'af7'
            ],

            relatedNoteIds: [
                'note-silver-luna-marriage'
            ],

            createdAt:
            '2026-06-05T08:40:00Z',

            updatedAt:
            '2026-07-19T10:25:00Z'
        }),

        note({
            id:
            'note-luna-interview',

            title:
            'Family interview with Luna',

            ...richBody(
                ['heading', 'Interview context'],
                ['paragraph', 'The source is an audio interview with Luna recorded on 02 April 2026. Luna can speak directly about her own photographs and the family album as she knew it.'],
                ['heading', 'Secondhand stories'],
                ['paragraph', 'Accounts of the older Whiskerfield generations came to Luna through relatives. Record who told each story and when; do not present it as Luna’s firsthand memory.'],
                ['heading', 'Follow-up'],
                ['bullet', 'Ask who kept the album before Luna saw it.'],
                ['bullet', 'Compare the people she identifies with the tagged garden photograph and Daisy’s letter about sorting photographs.']
            ),

            collectionIds: [
                'note-col-interviews',
                'note-col-whiskerfield'
            ],

            checklist: [
                {
                    id:
                'note-luna-interview-follow-up',

                    text:
                'Schedule a follow-up conversation',

                    done:
                false
                },

                {
                    id:
                'note-luna-interview-album',

                    text:
                'Prepare unidentified album photographs',

                    done:
                false
                }
            ],

            linkedPersonIds: [
                'luna'
            ],

            linkedPhotoIds: [
                'photo-grandparents-garden'
            ],

            linkedArchiveFileIds: [
                'af4'
            ],

            relatedNoteIds: [
                'note-whiskerfield-album'
            ],

            createdAt:
            '2026-05-20T14:00:00Z',

            updatedAt:
            '2026-07-15T11:50:00Z'
        }),

        note({
            id:
            'note-pawford-archive-visit',

            title:
            'Pawford archive visit checklist',

            ...richBody(
                ['paragraph', 'Use the four PW references from the 2004 Pawford index to request the underlying entries. The index alone does not establish an address or family relationship.'],
                ['paragraph', 'Record each full citation and adjacent page. Keep unsuccessful searches too, so the same shelf or register is not checked twice.']
            ),

            collectionIds: [
                'note-col-pawford',
                'note-col-sources'
            ],

            checklist: [
                {
                    id:
                'note-pawford-archive-continuation',

                    text:
                'Request the four underlying PW entries',

                    done:
                false
                },

                {
                    id:
                'note-pawford-archive-households',

                    text:
                'Capture adjacent pages and full citations',

                    done:
                false
                },

                {
                    id:
                'note-pawford-archive-spellings',

                    text:
                'Compare the recorded names with Tree names',

                    done:
                false
                },

                {
                    id:
                'note-pawford-archive-images',

                    text:
                'Record image, folder, and shelf references',

                    done:
                false
                }
            ],

            linkedPlaceIds: [
                'place-pawford'
            ],

            linkedArchiveFileIds: [
                'af1',
                'af3'
            ],

            createdAt:
            '2026-06-01T08:00:00Z',

            updatedAt:
            '2026-07-14T16:20:00Z'
        })
    ];
})();

sampleData.sourceLinks = [
    // Source → People
    ['as1', 'person', 'barnaby'],
    ['as1', 'person', 'daisy'],
    ['as2', 'person', 'silver'],
    ['as3', 'person', 'barnaby'],
    ['as3', 'person', 'luna'],
    ['as4', 'person', 'luna'],
    ['as5', 'person', 'silver'],

    // Source → Places
    ['as1', 'place', 'place-archive'],
    ['as1', 'place', 'place-pawford'],
    ['as2', 'place', 'place-pawford'],
    ['as3', 'place', 'place-meowbridge'],
    ['as5', 'place', 'place-pawford'],
    ['as6', 'place', 'place-pawford'],

    // Source → Archive files
    ['as1', 'file', 'af1'],
    ['as1', 'file', 'af3'],
    ['as1', 'file', 'af-birth-sample'],
    ['as2', 'file', 'af7'],
    ['as3', 'file', 'af5'],
    ['as5', 'file', 'af4'],

    // Source → Notes
    ['as1', 'note', 'note-daisy-parentage'],
    ['as1', 'note', 'note-pawford-household'],
    ['as1', 'note', 'note-pawford-archive-visit'],
    ['as1', 'note', 'note-whiskerfield-surname'],
    ['as3', 'note', 'note-meowbridge-transcription'],
    ['as3', 'note', 'note-silver-luna-marriage'],
    ['as3', 'note', 'note-purrington-surname'],
    ['as4', 'note', 'note-luna-interview'],
    ['as5', 'note', 'note-whiskerfield-album']
].map(
    (
        [
            sourceId,
            targetType,
            targetId
        ],
        index
    ) => ({
        id:
          `source-link-seed-${index + 1}`,

        projectId:
          'p1',

        sourceId,
        targetType,
        targetId
    })
);

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

backfillEventEvidencePeople();

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
                  && !place.deleted
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

    const validIds =
        new Set(
            noteEntityRecords(
                type,
                note.projectId
            ).map(record =>
                record.id
            )
        );

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

function destroyNotesRichTextEditor()
{
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

    textarea.addEventListener(
        'input',
        event =>
        {
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

            autoSizeNoteBody(
                event.currentTarget
            );

            touchNote(
                currentNote
            );
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

function initializeNotesRichTextEditor(
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
                plainTextFromQuill(
                    instance
                );

            touchNote(
                currentNote
            );
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

