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

