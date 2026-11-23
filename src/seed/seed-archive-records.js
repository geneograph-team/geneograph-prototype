// ---------- Archive: genealogy file manager MVP ----------

sampleData.archiveFolders = [
    { id: 'pawford', projectId: 'p1', parentId: null, name: 'Family records', createdAt: '2026-01-04T10:00:00Z', updatedAt: '2026-06-02T10:00:00Z' },
    { id: 'fond12', projectId: 'p1', parentId: 'pawford', name: 'Births', createdAt: '2026-01-04T10:00:00Z', updatedAt: '2026-06-02T10:00:00Z' },
    { id: 'certificates', projectId: 'p1', parentId: 'pawford', name: 'Marriages', createdAt: '2026-01-04T10:00:00Z', updatedAt: '2026-05-19T10:00:00Z' },
    { id: 'interviews', projectId: 'p1', parentId: 'pawford', name: 'Correspondence', createdAt: '2026-01-04T10:00:00Z', updatedAt: '2026-04-05T10:00:00Z' },
    { id: 'documents', projectId: 'p1', parentId: null, name: 'Research trips', createdAt: '2026-01-04T10:00:00Z', updatedAt: '2026-05-19T10:00:00Z' },
    { id: 'opis3', projectId: 'p1', parentId: 'documents', name: 'Pawford', createdAt: '2026-01-04T10:00:00Z', updatedAt: '2026-06-02T10:00:00Z' },
    { id: 'delo44', projectId: 'p1', parentId: 'opis3', name: 'Register extracts', createdAt: '2026-01-04T10:00:00Z', updatedAt: '2026-06-02T10:00:00Z' },
    { id: 'delo45', projectId: 'p1', parentId: 'documents', name: 'Meowbridge', createdAt: '2026-01-04T10:00:00Z', updatedAt: '2026-05-28T10:00:00Z' },
    { id: 'albums-origin', projectId: 'p1', parentId: null, name: 'To identify', createdAt: '2026-01-04T10:00:00Z', updatedAt: '2026-03-29T10:00:00Z' },
    { id: 'unsorted', projectId: 'p1', parentId: null, name: 'Future research', createdAt: '2026-01-04T10:00:00Z', updatedAt: '2026-06-02T10:00:00Z' }
];

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

        placeId:
          'place-archive',

        reference:
          'Register collection 12 / household series 3',

        url:
          '',

        accessedDate:
          {"state":"known","dateType":"Exact date","calendar":"Gregorian","first":{"year":2026,"month":5,"day":24},"second":null,"originalText":"2026-05-24","date":"24.05.2026","dateLabel":"24 May 2026","sortDate":"20260524","date2":"","date2Label":"","sortDate2":""},

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

        placeId:
          'place-archive',

        reference:
          'Birth notices collection, 1990–2000',

        url:
          '',

        accessedDate:
          {"state":"known","dateType":"Exact date","calendar":"Gregorian","first":{"year":2026,"month":5,"day":28},"second":null,"originalText":"2026-05-28","date":"28.05.2026","dateLabel":"28 May 2026","sortDate":"20260528","date2":"","date2Label":"","sortDate2":""},

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

        placeId:
          'place-residence',

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

        placeId:
          null,

        reference:
          'Audio interview 2026-04-02',

        url:
          '',

        accessedDate:
          {"state":"known","dateType":"Exact date","calendar":"Gregorian","first":{"year":2026,"month":4,"day":2},"second":null,"originalText":"2026-04-02","date":"02.04.2026","dateLabel":"02 Apr 2026","sortDate":"20260402","date2":"","date2Label":"","sortDate2":""},

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

        placeId:
          'place-residence',

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

        placeId:
          null,

        reference:
          'Pawford record collection, 1900–1950',

        url:
          'https://example.org/pawford-records',

        accessedDate:
          {"state":"known","dateType":"Exact date","calendar":"Gregorian","first":{"year":2026,"month":6,"day":1},"second":null,"originalText":"2026-06-01","date":"01.06.2026","dateLabel":"01 Jun 2026","sortDate":"20260601","date2":"","date2Label":"","sortDate2":""},

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

sampleData.archiveFiles = [
    {
        id: 'af1', projectId: 'p1', folderId: 'delo44', name: 'pawford_household_register_2004.png', kind: 'img', type: 'Image', mimeType: 'image/png', sizeBytes: 2782928,
        previewUrl: 'assets/documents/pawford-household-register-sample.png', favorite: true,
        description: 'Sample register table with four family names on separate lines.',
        documentDate: {"date":"2004","dateType":"Exact date","state":"known","calendar":"Gregorian","first":{"year":2004,"month":null,"day":null},"second":null,"originalText":"2004","dateLabel":"2004","sortDate":"20040000","date2":"","date2Label":"","sortDate2":"","placeId":null,"reason":"","burialPlaceId":null}, linkedPersonIds: ['barnaby', 'daisy', 'silver', 'luna'],
        personRegions: { barnaby: { x: 0.05, y: 0.43, width: 0.29, height: 0.06 }, daisy: { x: 0.05, y: 0.54, width: 0.28, height: 0.06 }, silver: { x: 0.05, y: 0.66, width: 0.29, height: 0.06 }, luna: { x: 0.05, y: 0.78, width: 0.27, height: 0.06 } },
        linkedEventIds: [], linkedNoteIds: [], documentPlaceId: 'place-pawford', linkedPlaceIds: [],
        addedAt: '2026-06-02T09:20:00Z', updatedAt: '2026-06-02T09:20:00Z'
    },
    {
        id: 'af2', projectId: 'p1', folderId: 'albums-origin', name: 'unidentified_studio_portrait.jpg', kind: 'img', type: 'Image', mimeType: 'image/jpeg', sizeBytes: 156569,
        previewUrl: 'assets/photos/unidentified-studio-portrait.jpg', favorite: false,
        description: 'Unidentified studio portrait awaiting a person link and date.',
        documentDate: {"state":"empty","dateType":"Exact date","calendar":"Gregorian","first":{"year":null,"month":null,"day":null},"second":null,"originalText":"","date":"","dateLabel":"","sortDate":"","date2":"","date2Label":"","sortDate2":""}, linkedPersonIds: [], linkedEventIds: [], linkedNoteIds: [], documentPlaceId: null, linkedPlaceIds: [],
        addedAt: '2026-06-02T08:40:00Z', updatedAt: '2026-06-02T08:40:00Z'
    },
    {
        id: 'af3', projectId: 'p1', folderId: 'opis3', name: 'pawford_register_index_page_12.png', kind: 'img', type: 'Image', mimeType: 'image/png', sizeBytes: 2592368,
        previewUrl: 'assets/documents/pawford-register-index-sample.png', favorite: false,
        description: 'Name index pointing to the household register page.',
        documentDate: {"state":"empty","dateType":"Exact date","calendar":"Gregorian","first":{"year":null,"month":null,"day":null},"second":null,"originalText":"","date":"","dateLabel":"","sortDate":"","date2":"","date2Label":"","sortDate2":""}, linkedPersonIds: ['barnaby', 'silver'],
        personRegions: { barnaby: { x: 0.14, y: 0.47, width: 0.55, height: 0.06 }, silver: { x: 0.14, y: 0.66, width: 0.55, height: 0.06 } },
        linkedEventIds: [], linkedNoteIds: [], documentPlaceId: 'place-pawford', linkedPlaceIds: [],
        addedAt: '2026-06-01T14:10:00Z', updatedAt: '2026-06-01T14:10:00Z'
    },
    {
        id: 'af4', projectId: 'p1', folderId: 'interviews', name: 'daisy_letter_to_luna_2006.png', kind: 'img', type: 'Image', mimeType: 'image/png', sizeBytes: 2619679,
        previewUrl: 'assets/documents/daisy-letter-sample.png', favorite: false,
        description: 'Sample family letter from Daisy to Luna about preserving photographs.',
        documentDate: {"date":"12.04.2006","dateType":"Exact date","state":"known","calendar":"Gregorian","first":{"year":2006,"month":4,"day":12},"second":null,"originalText":"12 Apr 2006","dateLabel":"12 Apr 2006","sortDate":"20060412","date2":"","date2Label":"","sortDate2":"","placeId":null,"reason":"","burialPlaceId":null}, linkedPersonIds: ['daisy', 'luna'],
        personRegions: { daisy: { x: 0.07, y: 0.71, width: 0.48, height: 0.15 }, luna: { x: 0.07, y: 0.24, width: 0.14, height: 0.05 } },
        linkedEventIds: [], linkedNoteIds: [], documentPlaceId: 'place-pawford', linkedPlaceIds: [],
        addedAt: '2026-05-28T12:00:00Z', updatedAt: '2026-05-28T12:00:00Z'
    },
    {
        id: 'af5', projectId: 'p1', folderId: 'certificates', name: 'silver_luna_marriage_record_2023.png', kind: 'img', type: 'Image', mimeType: 'image/png', sizeBytes: 2427635,
        previewUrl: 'assets/documents/silver-luna-marriage-record-sample.png', favorite: true,
        description: 'Sample marriage extract for Silver and Luna in Meowbridge.',
        documentDate: {"date":"18.08.2023","dateType":"Exact date","state":"known","calendar":"Gregorian","first":{"year":2023,"month":8,"day":18},"second":null,"originalText":"18 Aug 2023","dateLabel":"18 Aug 2023","sortDate":"20230818","date2":"","date2Label":"","sortDate2":"","placeId":null,"reason":"","burialPlaceId":null}, linkedPersonIds: ['silver', 'luna'],
        personRegions: { silver: { x: 0.065, y: 0.56, width: 0.22, height: 0.06 }, luna: { x: 0.32, y: 0.56, width: 0.2, height: 0.06 } },
        linkedEventIds: ['event-rel-silver-luna-partner-rel-silver-luna-partner-marriage'], linkedNoteIds: [], documentPlaceId: 'place-meowbridge', linkedPlaceIds: [],
        addedAt: '2026-05-19T10:00:00Z', updatedAt: '2026-05-19T10:00:00Z'
    },
    {
        id: 'af7', projectId: 'p1', folderId: 'fond12', name: 'silver_birth_announcement_1998.png', kind: 'img', type: 'Image', mimeType: 'image/png', sizeBytes: 2379200,
        previewUrl: 'assets/documents/silver-birth-announcement-sample-v2.png', favorite: false,
        description: 'Sample birth announcement for Silver Whiskerfield.',
        documentDate: {"date":"03.03.1998","dateType":"Exact date","state":"known","calendar":"Gregorian","first":{"year":1998,"month":3,"day":3},"second":null,"originalText":"03 Mar 1998","dateLabel":"03 Mar 1998","sortDate":"19980303","date2":"","date2Label":"","sortDate2":"","placeId":null,"reason":"","burialPlaceId":null}, linkedPersonIds: ['silver'],
        personRegions: { silver: { x: 0.23, y: 0.36, width: 0.54, height: 0.13 } },
        linkedEventIds: ['event-silver-birth'], linkedNoteIds: [], documentPlaceId: 'place-pawford', linkedPlaceIds: [],
        addedAt: '2026-03-29T10:00:00Z', updatedAt: '2026-03-29T10:00:00Z'
    },
    {
        id: 'af-birth-sample', projectId: 'p1', folderId: 'fond12', name: 'daisy_birth_record_1949.png', kind: 'img', type: 'Image', mimeType: 'image/png', sizeBytes: 2347971,
        previewUrl: 'assets/documents/daisy-birth-record-sample.png', favorite: false,
        description: 'Illustrative birth-record extract for Daisy Whiskerfield.',
        documentDate: {"date":"03.06.1949","dateType":"Exact date","state":"known","calendar":"Gregorian","first":{"year":1949,"month":6,"day":3},"second":null,"originalText":"03 Jun 1949","dateLabel":"03 Jun 1949","sortDate":"19490603","date2":"","date2Label":"","sortDate2":"","placeId":null,"reason":"","burialPlaceId":null}, linkedPersonIds: ['daisy'], personRegions: { daisy: { x: 0.14, y: 0.36, width: 0.72, height: 0.12 } },
        linkedEventIds: ['event-daisy-birth'], linkedNoteIds: [], documentPlaceId: 'place-pawford', linkedPlaceIds: [],
        addedAt: '2026-06-02T09:25:00Z', updatedAt: '2026-06-02T09:25:00Z'
    },
    {
        id: 'af-letter-transcription', projectId: 'p1', folderId: 'interviews', name: 'daisy_letter_transcription.txt', kind: 'doc', type: 'Text', mimeType: 'text/plain', assetUrl: 'assets/documents/daisy_letter_transcription.txt', sizeBytes: 655, favorite: false,
        description: 'Transcription of Daisy’s letter to Luna.', linkedPersonIds: ['daisy', 'luna'], linkedEventIds: [], linkedNoteIds: [], documentPlaceId: 'place-pawford', linkedPlaceIds: [],
        addedAt: '2026-06-02T09:30:00Z', updatedAt: '2026-06-02T09:30:00Z'
    },
    {
        id: 'af-pawford-trip', projectId: 'p1', folderId: 'opis3', name: 'pawford_visit_notes.docx', kind: 'doc', type: 'Document', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', assetUrl: 'assets/documents/pawford_visit_notes.docx', sizeBytes: 37210, favorite: false,
        description: 'Research notes from a visit to Pawford.', linkedPersonIds: ['barnaby', 'daisy'], linkedEventIds: [], linkedNoteIds: [], documentPlaceId: 'place-pawford', linkedPlaceIds: [],
        addedAt: '2026-06-02T09:31:00Z', updatedAt: '2026-06-02T09:31:00Z'
    },
    {
        id: 'af-household-csv', projectId: 'p1', folderId: 'delo44', name: 'pawford_household_index.csv', kind: 'sheet', type: 'CSV', mimeType: 'text/csv', assetUrl: 'assets/documents/pawford_household_index.csv', sizeBytes: 387, favorite: false,
        description: 'Searchable transcription of the household register index.', linkedPersonIds: ['barnaby', 'daisy', 'silver', 'luna'], linkedEventIds: [], linkedNoteIds: [], documentPlaceId: 'place-pawford', linkedPlaceIds: [],
        addedAt: '2026-06-02T09:32:00Z', updatedAt: '2026-06-02T09:32:00Z'
    },
    {
        id: 'af-marriage-packet', projectId: 'p1', folderId: 'certificates', name: 'silver_luna_marriage_packet.pdf', kind: 'pdf', type: 'PDF', mimeType: 'application/pdf', assetUrl: 'assets/documents/silver_luna_marriage_packet.pdf', sizeBytes: 3229, favorite: false,
        description: 'Research packet for Silver and Luna’s marriage.', linkedPersonIds: ['silver', 'luna'], linkedEventIds: ['event-rel-silver-luna-partner-rel-silver-luna-partner-marriage'], linkedNoteIds: [], documentPlaceId: 'place-meowbridge', linkedPlaceIds: [],
        addedAt: '2026-06-02T09:33:00Z', updatedAt: '2026-06-02T09:33:00Z'
    }
];


