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
          '2026-01-01T00:00:00.000Z',
        updatedAt:
          '2026-01-01T00:00:00.000Z',
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
            '2026-06-27T09:00:00.000Z',

            updatedAt:
            '2026-07-22T16:30:00.000Z'
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
            '2026-05-14T10:00:00.000Z',

            updatedAt:
            '2026-06-28T11:15:00.000Z'
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
            '2026-06-24T09:30:00.000Z',

            updatedAt:
            '2026-07-13T14:10:00.000Z'
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
            '2026-06-22T08:00:00.000Z',

            updatedAt:
            '2026-07-21T18:20:00.000Z'
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
            '2026-06-18T10:00:00.000Z',

            updatedAt:
            '2026-07-18T12:45:00.000Z'
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
            '2026-06-15T09:10:00.000Z',

            updatedAt:
            '2026-07-17T15:00:00.000Z'
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
            '2026-06-10T13:30:00.000Z',

            updatedAt:
            '2026-07-16T17:05:00.000Z'
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
            '2026-05-01T11:00:00.000Z',

            updatedAt:
            '2026-06-30T09:20:00.000Z'
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
                'note-silver-profile-checklist',
                'note-meowbridge-transcription'
            ],

            createdAt:
            '2026-05-19T10:15:00.000Z',

            updatedAt:
            '2026-07-20T13:35:00.000Z'
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
            '2026-06-05T08:40:00.000Z',

            updatedAt:
            '2026-07-19T10:25:00.000Z'
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
            '2026-05-20T14:00:00.000Z',

            updatedAt:
            '2026-07-15T11:50:00.000Z'
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
            '2026-06-01T08:00:00.000Z',

            updatedAt:
            '2026-07-14T16:20:00.000Z'
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

